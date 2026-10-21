"""Read-only requested session close audit; no pilot, source reads or acceptance."""
from pathlib import Path
import collections
import datetime
import hashlib
import json
import os
import subprocess

P = Path(__file__).resolve().parent
R = P.parents[3]
B = P.parent
BASE = 'ebd767392b0b7017e67392b46212f0f4edb3630e'
MUTABLE = {'docs/CURRENT_HANDOFF.md', 'docs/evidence/sd2-autonomous/NEXT_SESSION.md',
           'docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md'}
git = lambda *a: subprocess.check_output(['git', *a], cwd=R)
sha = lambda b: hashlib.sha256(b).hexdigest()
load = lambda p: json.loads(p.read_text())
started = datetime.datetime.now(datetime.timezone.utc).isoformat()
protected = 0
for line in git('ls-tree', '-r', BASE).decode().splitlines():
    meta, path = line.split('\t')
    mode, typ, blob = meta.split()
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
    assert raw.endswith(git('show', BASE + ':' + path)), path
    top = raw.split(b'---')[0].decode()
    assert all(x in top for x in ['7406', '406', '96', '0accepted', 'Stop before SD3',
                                  'Kelsey', 'unselected', 'SESSION_CLOSE'])
path = 'docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md'
t = (R / path).read_text()
a = '<!-- SD2-CONSOLIDATION-CLOSE-START -->\n'
z = '<!-- SD2-CONSOLIDATION-CLOSE-END -->\n'
assert t.count(a) == t.count(z) == 1
assert t[:t.index(a)] + t[t.index(z) + len(z):] == git('show', BASE + ':' + path).decode()
allowed = {str((P / f).relative_to(R)) for f in ['SESSION_CLOSE.md', 'verify-close.py',
    'session-close-verification.json', 'close-plan.json', 'close-plan.log']}
untracked = set(git('ls-files', '--others', '--exclude-standard').decode().splitlines())
assert not untracked, 'Stage all closeout additions before complete diff verification'
paths = set(git('diff', '--name-only', BASE).decode().splitlines())
assert paths <= MUTABLE | allowed, paths - MUTABLE - allowed
m = load(P / 'final-manifest.json')
rv = load(P / 'review.json')
assert rv['outcome'] == 'PASS' and not any(rv['severityCounts'].values())
assert rv['binding']['candidateCommit'] == m['candidateCommit']
assert rv['binding']['manifestSha256'] == sha((P / 'final-manifest.json').read_bytes())
assert git('rev-parse', BASE + '^').decode().strip() == m['candidateCommit']
assert set(git('diff', '--name-only', m['candidateCommit'], BASE).decode().splitlines()) == {
    str((P / f).relative_to(R)) for f in ['final-manifest.json', 'review.json']}
for f in m['changedFiles']:
    assert sha(git('show', m['candidateCommit'] + ':' + f['path'])) == f['sha256']
    if f['path'] not in MUTABLE:
        assert sha((R / f['path']).read_bytes()) == f['sha256']
assert sha(git('diff', '--binary', m['entryCommit'], m['candidateCommit'])) == m['completeDiffSha256']
assert [x['findingId'] for x in rv['dispositions']] == ['M1']
assert rv['dispositions'][0]['status'] == 'fixed-and-independently-rechecked'
check = subprocess.run(['python3', str(P / 'verify.py')], cwd=R,
                       stdout=subprocess.PIPE, stderr=subprocess.PIPE)
assert check.returncode == 0, check.stderr.decode()
v = json.loads(check.stdout)
assert v['outcome'] == 'PASS' and v['routeCounts'] == dict(identities=406, fields=7406, seeds=676, links=1127)
routes = collections.Counter()
sources = inherited = 0
for i in range(1, 22):
    packet = load(B / f'checkpoint-{i:03d}.json')
    for row in packet['records']:
        assert all(row.get(k) for k in ['owner', 'trigger', 'nextAction'])
    for s in packet['sourceRegistry']:
        sources += 1
        assert s.get('owner')
        if not s.get('trigger') or not s.get('nextAction'):
            assert i in [1, 2]
            inherited += 1
    for x in packet['records'] + packet['sourceRegistry']:
        inherit = {k: x.get(k) for k in ['owner', 'trigger', 'nextAction']}
        if 'inputKey' in x:
            routes['identities'] += 1
        for k, values in x.items():
            if k == 'fieldProposals':
                for f in values.values():
                    routes['fields'] += 1
                    assert all(f.get(a) or inherit.get(a) for a in inherit)
            elif k in ['seedDispositions', 'linkDispositions', 'queryLinkDispositions',
                       'excludedProgramLinkDispositions']:
                for d in values:
                    routes['seeds' if k == 'seedDispositions' else 'links'] += 1
                    assert all(d.get(a) or inherit.get(a) for a in inherit)
assert dict(routes) == dict(identities=406, fields=7406, seeds=676, links=1127)
assert sources == 365 and inherited == 35
converted = unclosed = 0
for p in sorted(B.glob('checkpoint-*/conversion-link-dispositions.json')):
    for s in load(p)['sources']:
        for d in s['destinations']:
            converted += 1
            unclosed += not d['closed']
            assert all(d.get(k) for k in ['owner', 'trigger', 'nextAction'])
assert (converted, unclosed) == (628, 1)
custody = load(B / 'checkpoint-021/prior-custody-audit.json')
gaps = []
for pin in custody['pins']:
    f = Path(pin['path'])
    try:
        actual = sha(f.read_bytes())
    except (FileNotFoundError, PermissionError):
        actual = None
    assert all(pin.get(k) for k in ['owner', 'trigger', 'nextAction'])
    if actual != pin['recordedSha256']:
        gaps.append(dict(path=pin['path'], expectedSha256=pin['recordedSha256'],
                         observedSha256=actual, owner=pin['owner'], trigger=pin['trigger'],
                         nextAction=pin['nextAction']))
assert len(custody['pins']) == 71
pins = load(R / 'docs/evidence/sd2-next-read-proposal/verification.json')['retainedM1Artifacts']
for pin in pins:
    assert sha(git('show', '009fa57:' + pin['path'])) == pin['sha256']
m1 = json.loads(git('show', '009fa57:docs/evidence/season-monitor-m1/inventory.json'))
assert len(m1['records']) == len({r['id'] for r in m1['records']}) == 437
doc = (P / 'SESSION_CLOSE.md').read_text()
proposal = (P / 'PROPOSAL.md').read_text()
table = '| Open dependency / authoritative path |' + proposal.split(
    '| Open dependency / authoritative path |', 1)[1].split('\n\n## Review and next action', 1)[0]
assert table in doc
assert all(s in doc for s in ['No pending', '96', 'owner', 'Trigger', 'next action',
                              'EPERM', 'Not verified', 'High', 'Stop before SD3'])
plan = load(P / 'close-plan.json')
assert plan['exitCode'] == 0 and sha((R / plan['logPath']).read_bytes()) == plan['logSha256']
git('diff', '--check', BASE)
print(json.dumps(dict(outcome='PASS', scope='Requested author session closeout; immutable independent proposal review preserved',
    command=['python3', 'docs/evidence/sd2-autonomous/consolidation-proposal/verify-close.py'],
    cwd=str(R), startedAt=started, completedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),
    preCloseCommit=BASE, proposalCandidate=m['candidateCommit'], proposalReviewReceipt=BASE,
    protectedPreCloseTrackedFiles=protected, allPreCloseBindingsBytesModesPreserved=True,
    allPriorHandoffSection9BytesPreserved=True, immutableCandidatePathsVerified=len(m['changedFiles']),
    currentReviewedNonHandoffFilesUnchanged=True, routeCounts=dict(routes), sourceReceipts=sources,
    inheritedSourceRoutes=inherited, convertedDestinations=converted, unclosedDestinationHolds=unclosed,
    M1Records=437, M1Pins=len(pins), custodyPins=len(custody['pins']), custodyGaps=gaps,
    originalAttentionRows=9, originalAttentionRowsAndSupplementsUnchanged=True,
    verification=v, planCheck=plan, pendingReviewerWork=False, pendingDelegatedWork=False,
    initialQueueCoverageComplete=True, cursor=406, nextInputKey=None,
    nextOwner='Kelsey selects exact proposed pilot if desired; next-session Codex executes only selected work',
    nextTrigger='Direct exact saved-evidence-only pilot selection; wrap-up is not selection',
    nextAuthoritativePath='docs/evidence/sd2-autonomous/consolidation-proposal/PROPOSAL.md',
    nextAction='Keep completed reviewed proposal; only execute its exact pilot after selection. Preserve all other original routes and stop before SD3.',
    newSourceOrWorkbookReads=0, noResetOrReplay=True, pilotExecuted=False, acceptedFacts=0,
    fullSD2Complete=False, canonicalAcceptance=False, externalEffects=False, SD3Started=False,
    recommendedNextEffort='High'), indent=2))
