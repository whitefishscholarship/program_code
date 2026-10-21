"""Read-only verification of a bounded proposal, never field reconciliation."""
from pathlib import Path
import datetime
import hashlib
import json
import os
import subprocess
import sys

P = Path(__file__).resolve().parent
R = P.parents[3]
ENTRY = '1e175d2f6e448591ee4747313798302845a3ce51'
PREFIX = str(P.relative_to(R)) + '/'
MUTABLE = {'docs/CURRENT_HANDOFF.md', 'docs/evidence/sd2-autonomous/NEXT_SESSION.md',
           'docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md'}
git = lambda *args: subprocess.check_output(['git', *args], cwd=R)
sha = lambda b: hashlib.sha256(b).hexdigest()
canon = lambda x: json.dumps(x, sort_keys=True, separators=(',', ':'), ensure_ascii=False).encode()
load = lambda p: json.loads(p.read_text())
started = datetime.datetime.now(datetime.timezone.utc).isoformat()
assert git('branch', '--show-current').decode().strip() == 'codex/plan-student-data-maintenance'
protected = 0
for item in git('ls-tree', '-rz', ENTRY).split(b'\0'):
    if not item:
        continue
    meta, path = item.decode().split('\t'); mode, kind, blob = meta.split()
    if path in MUTABLE:
        continue
    f = R / path; raw = os.readlink(f).encode() if mode == '120000' else f.read_bytes()
    assert hashlib.sha1(b'blob ' + str(len(raw)).encode() + b'\0' + raw).hexdigest() == blob, path
    if mode in ['100644', '100755']:
        assert bool(f.stat().st_mode & 0o111) == (mode == '100755'), path
    protected += 1
for path in MUTABLE:
    raw = (R / path).read_bytes(); old = git('show', ENTRY + ':' + path)
    if path.endswith('STUDENT_DATA_AND_MAINTENANCE_PLAN.md'):
        a = b'<!-- SD2-PROPOSAL-006-START -->\n'; z = b'<!-- SD2-PROPOSAL-006-END -->\n'
        assert raw.count(a) == raw.count(z) == 1
        assert raw[:raw.index(a)] + raw[raw.index(z) + len(z):] == old
    else:
        assert raw.endswith(old)
untracked = set(git('ls-files', '--others', '--exclude-standard').decode().splitlines())
assert untracked <= {PREFIX + 'final-manifest.json', PREFIX + 'review.json'}, untracked
paths = set(git('diff', '--name-only', ENTRY).decode().splitlines()) | untracked
assert all(x in MUTABLE or x.startswith(PREFIX) for x in paths), paths
entry = load(P / 'entry-audit.json'); er = entry['result']
assert entry['entryCommit'] == ENTRY and entry['exitCode'] == 0 and er['outcome'] == 'PASS'
assert entry['command']==['python3','docs/evidence/sd2-autonomous/reconciliation-batch-005/verify.py','--review-bound']
assert entry['stderrUtf8']==''
assert er['cumulativeComparedFieldOccurrences']==300 and er['comparedAutonomousInputs']==14
assert er['remainingAutonomousInputsOutsideComparison']==392
assert entry['stdoutSha256']==sha((json.dumps(er,indent=2)+'\n').encode())
assert (er['fieldOccurrences'], er['autonomousFieldHolds'], er['autonomousIdentityHolds']) == (51, 7406, 406)
assert er['allPriorBytesModesHandoffsAndReviewBindingsPreserved']
assert er['M1Records'] == 437 and er['M1Pins'] == 12 and er['custodyPins'] == 71
s = load(P / 'scope.json'); assert s['entryCommit'] == ENTRY
assert not any(s[k] for k in ['executionSelected', 'comparisonExecuted', 'newSourceOrWorkbookReads',
    'newRawContentReinspection', 'canonicalAcceptance', 'fullSD2Complete', 'SD3Started', 'externalEffects'])
for pin in s['savedEvidencePins']:
    assert sha((R / pin['path']).read_bytes()) == pin['sha256'], pin['path']
q = load(P.parent / 'queue.json'); packet = load(P.parent / 'checkpoint-001.json')
c = s['proposedComparison']
assert (c['cases'], c['savedInputOccurrences'], c['fieldEnvelopeOccurrences']) == (3, 3, 53)
assert [x['savedRowLocator'] for x in c['orderedInputs']] == [14, 15, 16]
assert [x['queueOffset'] for x in c['orderedInputs']] == [14, 15, 16]
assert [x['publicIdCandidates'] for x in c['orderedInputs']] == [['award-df57e3f6a067'], ['award-66c48204573e'], ['award-fc37c2d47f56']]
assert not (R / c['proposedOutputDirectory']).exists(), 'Proposal cannot execute its proposed comparison'
for order, x in enumerate(c['orderedInputs'], 1):
    ix = x['queueOffset']; row = packet['records'][ix]
    assert x['order'] == order and x['recordPointer'] == f'/records/{ix}'
    assert x['packetPath'] == 'docs/evidence/sd2-autonomous/checkpoint-001.json'
    assert x['packetSha256'] == sha((R / x['packetPath']).read_bytes())
    assert x['savedInputKey'] == row['inputKey'] == q['records'][ix]['inputKey']
    assert x['publicIdCandidates'] == row['publicIdCandidates']
    assert x['recordCanonicalSha256'] == sha(canon(row))
    assert x['recordedNameReference']['pointer'] == f'/records/{ix}/recordedName'
    assert x['recordedNameReference']['valueSha256'] == sha(canon(row['recordedName']))
    assert x['fieldEnvelopeOccurrences'] == len(row['fieldProposals']) == [17, 19, 17][order - 1]
    assert x['orderedFieldNames'] == list(row['fieldProposals'])
    assert x['identityAcceptance'] == row['identityAcceptance'] == 'held'
    assert x['originalRoute'] == {k: row[k] for k in ['owner', 'trigger', 'authoritativePath', 'nextAction']}
    assert x['sourceIds'] == row['sourceReceipts']
for x in c['sources']:
    source = packet['sourceRegistry'][int(x['registryPointer'].split('/')[-1])]
    assert x['sourceId'] == source['sourceId']
    assert x['sourceRevision']==source.get('sourceRevision')
    assert x['sourceLimitsPointer']==x['registryPointer']+'/extractionLimits'
    assert sha((R / x['artifactPath']).read_bytes()) == x['artifactSha256'] == source['artifactSha256']
assert [x['sourceId'] for x in c['sources']] == ['rh-old', 'rh-alias', 'ffa', 'ffa-applications', 'ffa-guidelines', 'ffa-college-rubric', 'ffa-leadership-rubric', 'kids']
for source in c['sources']:
    assert source['permittedInputKeys'] == [r['inputKey'] for r in packet['records'][14:17] if source['sourceId'] in r['sourceReceipts']]
assert c['sources'][0]['artifactSha256'] == c['sources'][1]['artifactSha256']
for ix in [14,16]:
    assert 'AMTOPP' in packet['records'][ix]['fieldProposals']['minimumGPA']['note']
    assert packet['records'][ix]['fieldProposals']['minimumGPA']['value']==2.0
assert packet['records'][14]['fieldProposals']['recipientSlots']['value']==2
assert packet['records'][16]['fieldProposals']['recipientSlots']['value']==1
kids=packet['records'][15]['fieldProposals']
assert kids['educationStageConflict']['state']=='conflict'
assert kids['fafsaRequired']['value'] is False
assert kids['initialEligibility']['value']['agesInclusive']==[16,26]
assert kids['renewability']['value']=={'possible':True,'contingentOnFunds':True,'renewalEligibilityLimitYears':4}
assert kids['deadline']['value']=='2026-03-01'
assert kids['materials']['value'] is None
cv = s['coverage']
assert (cv['initialResearchInputs'], cv['initialResearchDispositions'], cv['researchCursor'], cv['nextResearchInput']) == (406, 406, 406, None)
assert cv['thisProposalAddsComparedInputs'] == cv['thisProposalAddsComparedFields'] == cv['acceptedFacts'] == 0
assert cv['alreadyComparedAutonomousInputs'] == 14 and cv['alreadyComparedPriorJayceeInputs'] == 2 and cv['alreadyComparedFieldOccurrences'] == 300
assert cv['ifSeparatelyExecutedAutonomousInputsCompared'] + cv['ifSeparatelyExecutedRemainingAutonomousInputs'] == 406
assert cv['ifSeparatelyExecutedAutonomousInputsCompared'] == 17
assert cv['ifSeparatelyExecutedRemainingAutonomousInputs'] == 389
assert cv['ifSeparatelyExecutedCumulativeComparedFields'] == 353
rows = []
for i in range(1, 22):
    p = load(P.parent / f'checkpoint-{i:03d}.json'); rows.extend(p['records'])
assert len(rows) == 406 and all(r['identityAcceptance'] == 'held' for r in rows)
fields = [f for r in rows for f in r['fieldProposals'].values()]
assert len(fields) == 7406 and all(f['acceptance'] == 'held' for f in fields)
assert p['nextCheckpointInputOffset'] == 406 and p['nextInputKey'] is None
text = ' '.join((P / 'PROPOSAL.md').read_text().split())
for phrase in ['Proposal only','53','educationStageConflict','FAFSA','renewal','AMTOPP','rh-alias','Stop before SD3','owner','Direct exact selection']:
    assert phrase.lower() in text.lower(), phrase
if (P / 'validation.json').exists():
    val = load(P / 'validation.json')
    assert len(val['checks']) == 7
    for attempt in val['checks']:
        assert load(R / str(Path(attempt['logPath']).with_suffix('.json'))) == attempt
        assert attempt['cwd'] == str(R / 'web')
        assert attempt['startedAt'] <= attempt['completedAt']
        raw = attempt['rawOutputUtf8']
        assert len(raw.encode()) == attempt['rawLogBytes'] and sha(raw.encode()) == attempt['rawLogSha256']
        log = (R / attempt['logPath']).read_bytes()
        assert sha(log) == attempt['logSha256']
        assert log.decode() == '\n'.join(x.rstrip() for x in raw.splitlines()).rstrip() + '\n'
    by_name = {Path(a['logPath']).stem: a for a in val['checks']}
    assert set(by_name)=={'plan','plan-retry','typecheck','tests','tests-retry','build','build-retry'}
    for name, command in [('plan', ['npm', 'run', 'plan:check']), ('typecheck', ['npm', 'run', 'typecheck']), ('tests', ['npm', 'test'])]:
        final = by_name.get(name + '-retry', by_name[name])
        assert final['command'] == command and final['exitCode'] == 0
        if name + '-retry' in by_name:
            assert by_name[name]['exitCode'] != 0 and 'EPERM' in by_name[name]['rawOutputUtf8']
    assert all(val['results'][x] == 'PASS' for x in ['plan', 'typecheck', 'tests'])
    build = by_name.get('build-retry', by_name['build'])
    assert build['command'] == ['npm', 'run', 'build']
    if val['results']['standardBuild'] == 'PASS':
        assert build['exitCode'] == 0
    else:
        assert val['results']['standardBuild'] == 'BLOCKED_ENVIRONMENT'
        for name in ['build', 'build-retry']:
            assert by_name[name]['command'] == ['npm', 'run', 'build'] and by_name[name]['exitCode'] != 0
            assert 'Operation not permitted' in by_name[name]['rawOutputUtf8']
if '--review-bound' in sys.argv:
    m = load(P / 'final-manifest.json'); review = load(P / 'review.json')
    assert review['outcome'] == 'PASS' and not any(review['severityCounts'].values())
    assert review['binding']['candidateCommit'] == m['candidateCommit']
    assert review['binding']['manifestSha256'] == sha((P / 'final-manifest.json').read_bytes())
    assert git('rev-parse', m['candidateCommit'] + '^{tree}').decode().strip() == m['candidateTree']
    assert sha(git('diff', '--binary', ENTRY, m['candidateCommit'])) == m['completeDiffSha256']
    assert set(git('diff', '--name-only', ENTRY, m['candidateCommit']).decode().splitlines()) == {x['path'] for x in m['changedFiles']}
    for f in m['changedFiles']:
        assert sha(git('show', m['candidateCommit'] + ':' + f['path'])) == f['sha256'] == sha((R / f['path']).read_bytes())
    assert git('rev-parse', 'HEAD^').decode().strip() == m['candidateCommit']
    assert set(git('diff', '--name-only', m['candidateCommit'], 'HEAD').decode().splitlines()) == {PREFIX + 'final-manifest.json', PREFIX + 'review.json'}
git('diff', '--check', ENTRY)
print(json.dumps(dict(outcome='PASS', scope='Proposal preservation and exact scope only; no semantic field comparison',
    startedAt=started, completedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(), entryCommit=ENTRY,
    protectedEntryFiles=protected, allPriorBytesModesHandoffsAndReviewBindingsPreserved=True,
    proposedInputLocators=[14, 15, 16], proposedFieldOccurrences=53, newComparedInputs=0, newComparedFields=0,
    autonomousFieldHolds=7406, autonomousIdentityHolds=406, researchCursor=406, nextResearchInput=None,
    priorComparedFieldOccurrences=300, M1Records=437, M1Pins=12, custodyPins=71,
    custodyLimit='Retained original receipts and fresh predecessor entry verification; no raw reinspection or new custody-availability claim',
    acceptedFacts=0, newSourceOrWorkbookReads=0, comparisonExecuted=False, fullSD2Complete=False,
    canonicalAcceptance=False, externalEffects=False, SD3Started=False), indent=2))
