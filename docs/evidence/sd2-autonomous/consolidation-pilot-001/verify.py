"""Read-only pilot preservation and occurrence/evidence-affinity verification."""
from pathlib import Path
import collections
import datetime
import hashlib
import json
import os
import subprocess

P = Path(__file__).resolve().parent
R = P.parents[3]
ENTRY = 'c89427c21f3bd09205bb27b3402a40143bc6ba9d'
MUTABLE = {'docs/CURRENT_HANDOFF.md', 'docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md',
           'docs/evidence/sd2-autonomous/NEXT_SESSION.md'}
PREFIX = str(P.relative_to(R)) + '/'
load = lambda p: json.loads(p.read_text())
sha = lambda b: hashlib.sha256(b).hexdigest()
canon = lambda x: json.dumps(x, sort_keys=True, ensure_ascii=False, separators=(',', ':')).encode()
git = lambda *a: subprocess.check_output(['git', *a], cwd=R)
started = datetime.datetime.now(datetime.timezone.utc).isoformat()
assert git('branch', '--show-current').decode().strip() == 'codex/plan-student-data-maintenance'
protected = 0
for item in git('ls-tree', '-rz', ENTRY).split(b'\0'):
    if not item:
        continue
    meta, path = item.decode().split('\t'); mode, kind, blob = meta.split()
    if path in MUTABLE:
        continue
    f = R / path
    raw = os.readlink(f).encode() if mode == '120000' else f.read_bytes()
    assert hashlib.sha1(b'blob ' + str(len(raw)).encode() + b'\0' + raw).hexdigest() == blob, path
    if mode in ['100644', '100755']:
        assert bool(f.stat().st_mode & 0o111) == (mode == '100755'), path
    protected += 1
for path in MUTABLE:
    raw = (R / path).read_bytes(); old = git('show', ENTRY + ':' + path)
    if path.endswith('STUDENT_DATA_AND_MAINTENANCE_PLAN.md'):
        a = b'<!-- SD2-PILOT-001-START -->\n'; z = b'<!-- SD2-PILOT-001-END -->\n'
        assert raw.count(a) == raw.count(z) == 1
        assert raw[:raw.index(a)] + raw[raw.index(z) + len(z):] == old
    else:
        assert raw.endswith(old), path
untracked = set(git('ls-files', '--others', '--exclude-standard').decode().splitlines())
assert untracked <= {PREFIX + 'final-manifest.json', PREFIX + 'review.json'}, untracked
changed = set(git('diff', '--name-only', ENTRY).decode().splitlines()) | untracked
assert all(x in MUTABLE or x.startswith(PREFIX) for x in changed), changed
entry = load(P / 'entry-audit.json')
assert entry['entryCommit'] == ENTRY and entry['exitCode'] == 0
assert entry['result']['outcome'] == 'PASS' and entry['result']['allPreCloseBindingsBytesModesPreserved']
assert entry['result']['proposalCandidate'] == '962f6ba8f47c249c4c4e2bdac4c20012a85b1da9'
selection = load(P / 'selection.json')
proposal = load(R / 'docs/evidence/sd2-autonomous/consolidation-proposal/scope.json')
assert selection['entryCommit'] == ENTRY and selection['executionSelected']
assert not proposal['executionSelected']  # Historical proposal remains untouched.
assert selection['selectedPilot'] == proposal['proposedPilot']
for pin in selection['historicalProposalPins'] + selection['savedEvidencePins'] + load(P / 'artifact-pins.json')['artifacts']:
    assert sha((R / pin['path']).read_bytes()) == pin['sha256'], pin['path']
policy = load(P / 'policy-review.json')
assert policy['outcome'] == 'PASS' and not any(policy['severityCounts'].values())
for path, digest in policy['pins'].items():
    assert sha((P / path).read_bytes()) == digest, path

def lookup(path, pointer):
    node = load(R / path)
    for part in pointer.split('/')[1:]:
        key = part.replace('~1', '/').replace('~0', '~')
        node = node[int(key)] if isinstance(node, list) else node[key]
    return node

c = load(P / 'comparison.json'); ids = load(P / 'identity-assessment.json')
assert (c['selectedInputs'], c['cases'], c['fieldOccurrences']) == (4, 3, 96)
assert [r['savedRowLocator'] for r in c['records']] == [45, 290, 40, 68]
assert [r['savedRowLocator'] for r in ids['records']] == [45, 290, 40, 68]
seen = set(); categories = collections.Counter()
for expected, rec, ident in zip(selection['selectedPilot']['orderedInputs'], c['records'], ids['records']):
    original = lookup(expected['packetPath'], expected['recordPointer'])
    assert rec['savedInputKey'] == expected['savedInputKey'] and rec['order'] == expected['order']
    assert rec['publicIdCandidates'] == ident['publicIdCandidates'] == expected['publicIdCandidates']
    assert rec['originalIdentityAcceptance'] == ident['originalIdentityAcceptance'] == 'held'
    assert rec['existingCanonicalIdCandidate'] == ident['existingCanonicalIdCandidate'] == original.get('existingCanonicalIdCandidate')
    fields = original[expected['fieldContainer']]
    assert rec['fieldOccurrences'] == len(rec['fields']) == expected['fieldEnvelopes']
    assert [f['field'] for f in rec['fields']] == list(fields)
    if expected['autonomousQueueMember']:
        for key in ['owner', 'trigger', 'nextAction']:
            assert rec['originalRecordRoute'][key] == original[key]
    else:
        route = rec['originalRecordRoute']; assert route['exactTableRow'] in (R / route['inheritance']['path']).read_text()
        columns = [x.strip() for x in route['exactTableRow'].split('|')[1:-1]]
        assert route['owner'] == columns[1]
        assert route['trigger'] + ' ' + route['nextAction'] == columns[2]
    for f in rec['fields']:
        ref = f['originalReference']; key = (ref['path'], ref['pointer']); assert key not in seen; seen.add(key)
        assert ref['path'] == expected['packetPath']
        assert ref['pointer'] == expected['recordPointer'] + '/' + expected['fieldContainer'] + '/' + f['field']
        assert f['originalEnvelope'] == fields[f['field']] == lookup(*key)
        assert sha(canon(f['originalEnvelope'])) == f['originalEnvelopeSha256']
        assert f['originalEnvelope']['acceptance'] == 'held'
        assert f['originalRoute'] == rec['originalRecordRoute']
        assert all(f['nextActionRoute'][k] == f['originalRoute'][k] for k in ['owner', 'trigger', 'nextAction'])
        assert f['nextActionRoute']['authoritativePath'] == expected['packetPath']
        note = f['comparison']; categories[note['category']] += 1
        assert note['category'] in ['existing evidence consistent', 'existing evidence conflicting', 'applicability/identity unresolved', 'evidence unavailable']
        assert note['proposalOnly'] and note['originalHoldRetained'] and not note['newReadSelected']
        assert note['comparison'] and note['minimumAdditionalProof'] == f['nextActionRoute']['minimumProofProposal']
        for r in f['evidenceReferences'] + f['corroborationReferences'] + f['originalReviewReferences']:
            assert sha((R / r['path']).read_bytes()) == r['sha256']
        if expected['autonomousQueueMember']:
            source_packet = load(R / expected['packetPath'])
            registry = {s['sourceId']: s for s in source_packet['sourceRegistry']}
            for e in f['originalEnvelope']['evidence']:
                s = registry[e['sourceId']]
                assert e['sourceUrl'] == s['requestedUrl']
                raw = (R / s['artifactPath']).read_bytes()
                assert sha(raw) == s['artifactSha256'] == e['artifactSha256']
                assert e['excerpt'] in raw.decode()
        else:
            evidence = load(R / expected['packetPath'])['evidence']
            bound = [lookup(r['path'], r['pointer']) for r in f['evidenceReferences'] if r['path'] == expected['packetPath']]
            assert [e['evidenceId'] for e in bound] == f['originalEnvelope']['evidenceIds']
            for e in bound:
                assert e['inputRowLocator'] == expected['savedRowLocator'] and e['field'] == f['field']
                assert e['value'] == f['originalEnvelope']['value'] and e['state'] == f['originalEnvelope']['state']
                assert e['scope'] == f['originalEnvelope']['scope'] and e['observedAt'] == f['originalEnvelope']['observedAt']
assert len(seen) == 96 and dict(categories) == c['categoryCounts']
assert ids['acceptedMappings'] == ids['newStableIds'] == ids['jayceePair']['acceptedMappings'] == 0
# Meaningful boundaries across the four selected cases, independently of counts.
f45 = {x['field']: x for x in c['records'][0]['fields']}
f290 = {x['field']: x for x in c['records'][1]['fields']}
assert f45['materials']['originalEnvelope']['value']['2025EssayWordCount'] == 250
assert f45['materials']['originalEnvelope']['value']['2026EssayWordCount'] is None
assert f45['materials']['originalEnvelope']['value']['recommendations'] == 2
assert f45['cycle']['originalEnvelope']['value']['nextApplication'] is None
assert f290['applicationWindow']['originalEnvelope']['value']['currentCycleYear'] is None
assert f290['amount']['originalEnvelope']['value']['guaranteed'] is False
for rec, gpa, amounts, slots in zip(c['records'][2:], [3.25, 3.75], [[1000, 1500], [2000, 2500]], [10, 50]):
    f = {x['field']: x for x in rec['fields']}
    assert f['entryGpa']['originalEnvelope']['value'] == dict(minimum=gpa, scale=None, basis=None)
    assert f['amount']['originalEnvelope']['value']['publishedDiscreteAmounts'] == amounts
    assert f['amount']['originalEnvelope']['value']['recipientSlots'] == slots
    assert f['financialStatementAmbiguity']['comparison']['category'] == 'existing evidence conflicting'
    assert '/jayceeParent' in [r['pointer'] for r in f['montanaParticipation']['corroborationReferences']]
    mat = f['materials']['originalEnvelope']['value']
    assert mat['workingHomeEmailAddress']['required'] and mat['applicantSignature']['required'] and mat['completeApplicationForm']['required']
    assert mat['referenceLetters'] == dict(maximum=3, minimumEducatorReferences=1)
# All406 initial records are mechanically checked; only the selected two autonomous records are semantically compared.
rows = []; sources = 0
for n in range(1, 22):
    packet = load(P.parent / f'checkpoint-{n:03d}.json'); rows.extend(packet['records']); sources += len(packet['sourceRegistry'])
assert len(rows) == 406 and all(r['identityAcceptance'] == 'held' for r in rows)
held = [f for r in rows for f in r['fieldProposals'].values()]
assert len(held) == 7406 and all(f['acceptance'] == 'held' for f in held) and sources == 365
assert packet['nextCheckpointInputOffset'] == 406 and packet['nextInputKey'] is None
for obj in [c, selection]:
    assert obj['acceptedFacts'] == obj['newSourceOrWorkbookReads'] == 0 and not obj['SD3Started'] and not obj['externalEffects']
if (P / 'validation.json').exists():
    val = load(P / 'validation.json')
    for check in val['checks']:
        assert sha((R / check['logPath']).read_bytes()) == check['logSha256']
        assert sha(check['rawOutputUtf8'].encode()) == check['rawLogSha256']
        assert (R / check['logPath']).read_text() == '\n'.join(line.rstrip() for line in check['rawOutputUtf8'].splitlines()).rstrip() + '\n'
    assert val['results']['plan'] == val['results']['typecheck'] == val['results']['tests'] == 'PASS'
    assert val['results']['standardBuild'] in ['PASS', 'BLOCKED_ENVIRONMENT']
    check_map = {Path(x['logPath']).stem: x for x in val['checks']}
    for name, command in [('plan-retry', ['npm', 'run', 'plan:check']),
                          ('plan-final', ['npm', 'run', 'plan:check']),
                          ('typecheck', ['npm', 'run', 'typecheck']),
                          ('tests-retry', ['npm', 'test'])]:
        assert check_map[name]['command'] == command and check_map[name]['exitCode'] == 0
    for name in ['plan', 'tests']:
        assert check_map[name]['exitCode'] == 1 and 'EPERM' in check_map[name]['rawOutputUtf8']
    if val['results']['standardBuild'] == 'BLOCKED_ENVIRONMENT':
        for name in ['build', 'build-retry']:
            assert check_map[name]['command'] == ['npm', 'run', 'build']
            assert check_map[name]['exitCode'] == 1
            assert 'Operation not permitted' in check_map[name]['rawOutputUtf8']
# Review mode validates candidate receipt as well; author mode permits its absence.
if '--review-bound' in __import__('sys').argv:
    m = load(P / 'final-manifest.json'); review = load(P / 'review.json')
    assert review['outcome'] == 'PASS' and not any(review['severityCounts'].values())
    assert review['binding']['candidateCommit'] == m['candidateCommit']
    assert review['binding']['manifestSha256'] == sha((P / 'final-manifest.json').read_bytes())
    assert git('rev-parse', m['candidateCommit'] + '^{tree}').decode().strip() == m['candidateTree']
    assert sha(git('diff', '--binary', ENTRY, m['candidateCommit'])) == m['completeDiffSha256']
    for f in m['changedFiles']:
        assert sha(git('show', m['candidateCommit'] + ':' + f['path'])) == f['sha256']
        assert sha((R / f['path']).read_bytes()) == f['sha256']
    assert git('rev-parse', 'HEAD^').decode().strip() == m['candidateCommit']
    assert set(git('diff', '--name-only', m['candidateCommit'], 'HEAD').decode().splitlines()) == {PREFIX + 'final-manifest.json', PREFIX + 'review.json'}
git('diff', '--check', ENTRY)
print(json.dumps(dict(outcome='PASS', startedAt=started, completedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),
    entryCommit=ENTRY, protectedEntryFiles=protected, allEntryBytesModesAndPriorHandoffsPreserved=True,
    selectedInputs=4, fieldOccurrences=96, categoryCounts=dict(categories), autonomousFieldHolds=7406,
    autonomousIdentityHolds=406, cursor=406, nextInputKey=None, priorReviewBindingsUnchanged=True,
    M1Records=437, M1Pins=12, custodyPins=71, custodyLimit='Fresh entry audit verified hashes; original receipts and all entry files unchanged; future availability unpromised',
    acceptedFacts=0, newSourceOrWorkbookReads=0, fullSD2Complete=False, SD3Started=False, externalEffects=False), indent=2))
