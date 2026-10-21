"""Read-only local-repair receipt verification; never runs old context verifiers."""
from pathlib import Path
import gzip
import hashlib
import json
import os
import subprocess
import sys
from journal import digest, encoded
from reconcile import calculate

G = Path(__file__).resolve().parent
R = G.parents[2]
ENTRY = 'e2c5ada60cabca9f7cba1c9117b5e2ff016db9ae'
HISTORIES = {'docs/CURRENT_HANDOFF.md', 'docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md',
             'docs/evidence/sd2-autonomous/NEXT_SESSION.md'}
PREFIX = str(G.relative_to(R)) + '/'


def git(*args):
    return subprocess.check_output(['git', *args], cwd=R)


def load(path):
    return json.loads(path.read_bytes())


def verify(bound=False):
    assert git('branch','--show-current').decode().strip() == 'codex/plan-student-data-maintenance'
    entry = load(G / 'entry-audit.json')
    assert entry['entryCommit'] == ENTRY and entry['exitCode'] == 0 and entry['cleanStatus'] == ''
    assert entry['result']['reviewBound'] and entry['result']['handoffIntegrity'] == 'PASS'
    assert entry['result']['sessionStatus'] == 'FAIL'
    old = R / 'docs/evidence/sd2-control-repair-handoff'
    manifest, review = load(old / 'manifest.json'), load(old / 'review.json')
    assert git('rev-parse', ENTRY+'^').decode().strip() == manifest['candidateCommit']
    assert review['outcome'] == 'PASS' and review['sourceExecutionStatus'] == 'FAIL'
    assert review['binding']['manifestSha256'] == digest((old / 'manifest.json').read_bytes())
    assert set(git('diff','--name-only',manifest['candidateCommit'],ENTRY).decode().splitlines()) == {
        str((old / p).relative_to(R)) for p in ['manifest.json','review.json']}
    protected = 0
    for line in git('ls-tree','-rz',ENTRY).split(b'\0'):
        if not line: continue
        metadata, path = line.decode().split('\t')
        mode, kind, oid = metadata.split()
        if path in HISTORIES: continue
        p = R / path
        data = os.readlink(p).encode() if p.is_symlink() else p.read_bytes()
        current_mode = '120000' if p.is_symlink() else ('100755' if p.stat().st_mode & 0o111 else '100644')
        assert current_mode == mode
        assert hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest() == oid, path
        protected += 1
    for path in HISTORIES:
        prior = git('show', ENTRY+':'+path)
        current = (R / path).read_bytes()
        if path.endswith('STUDENT_DATA_AND_MAINTENANCE_PLAN.md'):
            a = b'<!-- SD2-CONTROL-REPAIR-1-START -->\n'
            z = b'<!-- SD2-CONTROL-REPAIR-1-END -->\n'
            assert current.count(a) == current.count(z) == 1
            assert current[:current.index(a)] + current[current.index(z)+len(z):] == prior
        else:
            assert current.endswith(prior), path
    changed = set(git('diff','--name-only',ENTRY).decode().splitlines()) | set(
        git('ls-files','--others','--exclude-standard').decode().splitlines())
    assert all(p in HISTORIES or p.startswith(PREFIX) for p in changed)
    for name, value in calculate().items():
        assert (G / name).read_bytes() == encoded(value), name
    assert (G / 'inherited-open-items.json').read_bytes() == (old / 'open-items.json').read_bytes()
    inherited = load(G / 'inherited-open-items.json')
    assert len(inherited['sessionItems']) == 9 and len(inherited['originalGates']) == 14
    gates = R / 'docs/evidence/sd2-consolidation-package/acceptance-gates.json'
    original = load(gates)['gates']
    for i, (row, source) in enumerate(zip(inherited['originalGates'], original)):
        assert row['reference'] == dict(path=str(gates.relative_to(R)),sha256=digest(gates.read_bytes()),pointer=f'/gates/{i}')
        for a,b in [('originalOwner','owner'),('originalTrigger','trigger'),
                    ('originalNextAction','nextAction'),('originalAuthoritativePaths','authoritativePaths')]:
            assert row[a] == source[b]
    opened = load(G / 'open-items.json')
    assert opened['inheritedReference']['sha256'] == digest((old / 'open-items.json').read_bytes())
    assert all(x['owner'] and x['trigger'] and x['authoritativePath'] and x['nextAction'] for x in opened['repairItems'])
    policy_review = load(G / 'policy-review.json')
    assert policy_review['outcome'] == 'PASS'
    # The prospective reviewer did not author or edit the implementation.
    assert git('show','40c91ff:docs/evidence/sd2-control-repair-1/POLICY.md') == (G / 'POLICY.md').read_bytes()
    val = load(G / 'validation.json')
    assert val['dependencyInstallAttempts'] == 0 and not val['freshAuthenticatedMainTargetVerified']
    assert [x['exitCode'] for x in val['checks']] == [0,0,0,0,0,1,0,0]
    assert not val['exactBuildGateCleared'] and not val['allRequiredChecksPassed']
    assert [x['command'] for x in val['checks'][2:6]] == [
        ['npm','run','plan:check'],['npm','run','typecheck'],['npm','test'],['npm','run','build']]
    for check in val['checks'] + val.get('supplementalChecks', []):
        stored = (R / check['logPath']).read_bytes()
        assert digest(stored) == check['storedSha256'] and len(stored) == check['storedBytes']
        raw = gzip.decompress(stored)
        assert digest(raw) == check['rawSha256'] and len(raw) == check['rawBytes']
    build = gzip.decompress((G / 'checks/build.log.gz').read_bytes()).decode()
    assert 'binding to a port' in build and 'Operation not permitted' in build
    assert val.get('supplementalChecks') and all(x['exitCode']==0 for x in val['supplementalChecks'])
    for path, sha in val['finalSyntheticCodePins'].items():
        assert digest((R / path).read_bytes()) == sha
    for pin in load(R / 'docs/evidence/sd2-consolidation-package/PROPOSED_VALIDATION_REPAIR.json')['pins']:
        assert digest((R / pin['path']).read_bytes()) == pin['sha256']
    if (G / 'manifest.json').exists():
        m = load(G / 'manifest.json'); candidate = m['candidateCommit']
        assert m['entryCommit'] == ENTRY
        assert git('rev-parse',candidate+'^{tree}').decode().strip() == m['candidateTree']
        diff = git('diff','--binary',ENTRY,candidate)
        assert digest(diff) == m['completeDiffSha256'] and len(diff) == m['completeDiffBytes']
        assert set(git('diff','--name-only',ENTRY,candidate).decode().splitlines()) == {x['path'] for x in m['changedFiles']}
        for x in m['changedFiles']:
            raw = git('show',candidate+':'+x['path'])
            assert digest(raw) == x['sha256'] and len(raw) == x['bytes']
            assert raw == (R / x['path']).read_bytes()
            assert git('ls-tree',candidate,x['path']).decode().split()[0] == x['mode']
    if bound:
        m = load(G / 'manifest.json'); v = load(G / 'review.json')
        assert v['outcome'] == 'PASS' and not any(v['unresolvedSeverityCounts'].values())
        assert v['binding']['candidateCommit'] == m['candidateCommit']
        assert v['binding']['manifestSha256'] == digest((G / 'manifest.json').read_bytes())
        assert v['sourceExecutionStatus'] == 'FAIL' and not v['canonicalAcceptance']
        assert git('rev-parse','HEAD^').decode().strip() == m['candidateCommit']
        assert set(git('diff','--name-only',m['candidateCommit'],'HEAD').decode().splitlines()) == {
            PREFIX+'manifest.json',PREFIX+'review.json'}
        assert not git('status','--porcelain').strip()
    git('diff','--check',ENTRY)
    return dict(localRepairIntegrity='PASS',reviewBound=bound,originalSourceExecution='FAIL',
                protectedPreEntryFiles=protected,appendHistories=3,targetsHeld=397,
                originalQuarantines=272,originalGateBindings=14,conservativeCalls=68,
                exactNeverDispatchedProof='NOT_ESTABLISHED',clearedForAcquisition=0,
                sourceRequestsDuringBatch=0,acceptedFacts=0,acceptedMappings=0,
                exactBuildGate='BLOCKED_EPERM',freshAuthenticatedMainTarget='UNVERIFIED',
                canonicalAcceptance=False,fullSD2Complete=False,SD3Started=False)


if __name__ == '__main__':
    print(json.dumps(verify('--review-bound' in sys.argv),indent=2))
