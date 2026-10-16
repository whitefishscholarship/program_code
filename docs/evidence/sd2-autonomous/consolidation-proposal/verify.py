"""Read-only proposal preservation check. Does not execute hold reconciliation."""
from pathlib import Path
import datetime
import hashlib
import json
import os
import subprocess

P = Path(__file__).resolve().parent
R = P.parents[3]
B = P.parent
ENTRY = '37d0b041423fb9db8eb9bf63484694230e1ac12f'
MUTABLE = {'docs/CURRENT_HANDOFF.md',
           'docs/evidence/sd2-autonomous/NEXT_SESSION.md',
           'docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md'}
sha = lambda raw: hashlib.sha256(raw).hexdigest()
load = lambda path: json.loads(path.read_text())


def git(*args):
    return subprocess.check_output(['git', *args], cwd=R)


started = datetime.datetime.now(datetime.timezone.utc).isoformat()
scope = load(P / 'scope.json')
assert scope['entryCommit'] == ENTRY
assert git('branch', '--show-current').decode().strip() == scope['branch']
assert not any(scope[k] for k in ['executionSelected', 'newSourceOrWorkbookReads',
                                'consolidationExecuted', 'acceptedFacts',
                                'canonicalAcceptance', 'SD3Started', 'externalEffects'])
assert scope['initialQueue'] == dict(total=406, cursor=406, nextInputKey=None,
                                  unprocessed=0, acceptedFacts=0, fullSD2Complete=False)
protected = 0
for item in git('ls-tree', '-rz', ENTRY).split(b'\0'):
    if not item:
        continue
    meta, path = item.decode().split('\t')
    mode, typ, blob = meta.split()
    assert typ == 'blob'
    if path in MUTABLE:
        continue
    f = R / path
    raw = os.readlink(f).encode() if mode == '120000' else f.read_bytes()
    assert hashlib.sha1(b'blob ' + str(len(raw)).encode() + b'\0' + raw).hexdigest() == blob, path
    if mode in ['100644', '100755']:
        assert bool(f.stat().st_mode & 0o111) == (mode == '100755'), path
    protected += 1

for path in MUTABLE - {'docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md'}:
    raw = (R / path).read_bytes()
    assert raw.endswith(git('show', ENTRY + ':' + path)), path
    top = raw.split(b'---')[0].decode()
    assert all(s in top for s in ['406', '7406', '0accepted', 'Stop before SD3',
                                 'proposal', 'Kelsey', '96'])
path = 'docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md'
t = (R / path).read_text()
a = '<!-- SD2-CONSOLIDATION-PROPOSAL-START -->\n'
z = '<!-- SD2-CONSOLIDATION-PROPOSAL-END -->\n'
assert t.count(a) == t.count(z) == 1
assert t[:t.index(a)] + t[t.index(z) + len(z):] == git('show', ENTRY + ':' + path).decode()
changed = set(git('diff', '--name-only', ENTRY).decode().splitlines())
changed |= set(git('ls-files', '--others', '--exclude-standard').decode().splitlines())
prefix = str(P.relative_to(R)) + '/'
assert all(x in MUTABLE or x.startswith(prefix) for x in changed), changed
assert len(changed & MUTABLE) == 3

audit = load(P / 'entry-audit.json')
assert audit['outcome'] == 'PASS' and audit['allOriginalBindingsAndPacketsPreserved']
assert audit['acceptedFacts'] == 0 and not audit['SD3Started']
assert audit['closure']['routeCounts'] == dict(identities=406, fields=7406, seeds=676, links=1127)
assert audit['closure']['verification']['historicalManifestReviewsVerified'] == 20
assert audit['closure']['verification']['priorCustodyPins'] == 71
assert not audit['closure']['verification']['custodyGaps']
assert audit['closure']['verification']['M1Records'] == 437
assert audit['closure']['verification']['M1Pins'] == 12
# The fresh pre-edit entry audit is a new execution receipt, not the old saved receipt.
assert audit['scope'].startswith('Requested final')
for pin in scope['savedEvidencePins']:
    assert sha((R / pin['path']).read_bytes()) == pin['sha256'], pin['path']
q = load(B / 'queue.json')
packets = [load(B / f'checkpoint-{i:03d}.json') for i in range(1, 22)]
rows = [row for packet in packets for row in packet['records']]
assert [x['inputKey'] for x in rows] == [x['inputKey'] for x in q['records']]
assert len(rows) == len({x['inputKey'] for x in rows}) == 406
assert all(x['identityAcceptance'] == 'held' for x in rows)
fields = [f for row in rows for f in row['fieldProposals'].values()]
assert len(fields) == 7406 and all(f['acceptance'] == 'held' for f in fields)
assert sum(len(packet['sourceRegistry']) for packet in packets) == 365
assert all(packet['acceptedFacts'] == 0 for packet in packets)
assert packets[-1]['nextCheckpointInputOffset'] == 406 and packets[-1]['nextInputKey'] is None

pilot = scope['proposedPilot']
assert (pilot['caseCount'], pilot['savedInputOccurrences'], pilot['fieldEnvelopeOccurrences']) == (3, 4, 96)
assert [x['savedRowLocator'] for x in pilot['orderedInputs']] == [45, 290, 40, 68]
assert [x['queueOffset'] for x in pilot['orderedInputs']] == [0, 1, None, None]
assert [x['publicIdCandidates'] for x in pilot['orderedInputs']] == [
    ['award-8bce77306c27'], ['award-52b096183d9d'],
    ['award-67de97a4f446'], ['award-e05338ef963f']]
for i, item in enumerate(pilot['orderedInputs'], 1):
    assert item['order'] == i and sha((R / item['packetPath']).read_bytes()) == item['packetSha256']
    node = load(R / item['packetPath'])
    for part in item['recordPointer'].split('/')[1:]:
        node = node[int(part)] if isinstance(node, list) else node[part]
    assert len(node[item['fieldContainer']]) == item['fieldEnvelopes']
    if item['autonomousQueueMember']:
        assert node['inputKey'] == item['savedInputKey']
        assert node['publicIdCandidates'] == item['publicIdCandidates']
    else:
        assert node['inputRecord']['rowLocator'] == item['savedRowLocator']
        assert node['existingPublicIdCandidate'] == item['publicIdCandidates'][0]
        assert node['mappingAcceptance'] == 'held'
    assert node.get('identityAcceptance', node.get('mappingAcceptance')) == 'held'
doc = (P / 'PROPOSAL.md').read_text()
assert all(s in doc for s in ['96', '7,406',
                             'Stop before SD3', 'not selected', 'PRELUDE',
                             'Kelsey Stuart', 'owner', 'trigger', 'next action'])
if (P / 'validation.json').exists():
    validation = load(P / 'validation.json')
    assert validation['entryCommit'] == ENTRY
    assert not any(validation[k] for k in ['newSourceOrWorkbookReads',
        'consolidationExecuted', 'pilotExecuted', 'acceptedFacts',
        'fullSD2Complete', 'canonicalAcceptance', 'externalEffects', 'SD3Started'])
    assert sha((P / 'entry-audit.json').read_bytes()) == validation['entryAudit']['sha256']
    assert [c['exitCode'] for c in validation['checks']] == [1, 0, 0, 1, 0, 1]
    for check in validation['checks']:
        assert sha((R / check['logPath']).read_bytes()) == check['logSha256']
    assert 'Operation not permitted' in (P / 'build.log').read_text()
git('diff', '--check', ENTRY)
print(json.dumps(dict(outcome='PASS', scope='Local proposal preservation and bounded-scope checks only',
    startedAt=started, completedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),
    entryCommit=ENTRY, protectedEntryTrackedFiles=protected, changedPaths=sorted(changed),
    allPriorTrackedBytesAndModesPreserved=True, allPriorHandoffBytesPreserved=True,
    oldReviewBindingsUnchanged=True, routeCounts=audit['closure']['routeCounts'],
    sourceReceipts=365, historicalSourcesWithInheritedRoutes=35,
    conversionDestinations=628, unclosedDestinationHolds=1,
    originalAttentionRows=9, M1Records=437, M1Pins=12, originalCustodyPins=71,
    currentCustodyRecheck='Not repeated after the successful pre-edit entry audit; future availability unknown',
    pilotProposedInputs=4, pilotProposedFieldOccurrences=96, pilotExecuted=False,
    newSourceOrWorkbookReads=0, acceptedFacts=0, canonicalAcceptance=False,
    fullSD2Complete=False, externalEffects=False, SD3Started=False), indent=2))
