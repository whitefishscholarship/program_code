"""Read-only local evidence/receipt verification; never invoke old runners."""
from pathlib import Path
import gzip
import hashlib
import json
import os
import subprocess
import sys

G = Path(__file__).resolve().parent
R = G.parents[2]
ENTRY = 'dec67156687ae289f3b8e1a4bddb1d0fcda5d7b4'
PRIOR = 'docs/evidence/sd2-control-repair-closeout/'
PREFIX = str(G.relative_to(R)) + '/'
HISTORIES = {
    'docs/CURRENT_HANDOFF.md',
    'docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md',
    'docs/evidence/sd2-autonomous/NEXT_SESSION.md',
}


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def git(*args):
    return subprocess.check_output(['git', *args], cwd=R)


def load(path):
    return json.loads((R / path).read_bytes())


def pointer(obj, path):
    for token in path.strip('/').split('/') if path else []:
        token = token.replace('~1', '/').replace('~0', '~')
        obj = obj[int(token)] if isinstance(obj, list) else obj[token]
    return obj


def mode(path):
    return '120000' if path.is_symlink() else ('100755' if path.stat().st_mode & 0o111 else '100644')


def verify(bound=False):
    assert git('branch', '--show-current').decode().strip() == 'codex/plan-student-data-maintenance'
    entry = load(PREFIX + 'entry-audit.json')
    assert entry['entryCommit'] == ENTRY and entry['cleanStatus'] == ''
    assert entry['exitCode'] == 0 and entry['newPacketCreatedAfterVerification']
    assert entry['command'] == ['python3', PRIOR + 'verify.py', '--review-bound']
    assert entry['result']['reviewBound'] and entry['result']['sessionStatus'] == 'PASS'
    # Verify the old immutable receipt, never rerun its context-bound verifier.
    old_manifest = load(PRIOR + 'manifest.json')
    old_review = load(PRIOR + 'review.json')
    old_candidate = old_manifest['candidateCommit']
    assert old_review['outcome'] == 'PASS' and not any(old_review['unresolvedSeverityCounts'].values())
    assert old_review['sourceExecutionStatus'] == 'FAIL' and not old_review['canonicalAcceptance']
    assert old_review['binding']['candidateCommit'] == old_candidate
    assert old_review['binding']['manifestSha256'] == sha((R / (PRIOR + 'manifest.json')).read_bytes())
    assert git('rev-parse', ENTRY + '^').decode().strip() == old_candidate
    assert set(git('diff', '--name-only', old_candidate, ENTRY).decode().splitlines()) == {
        PRIOR + 'manifest.json', PRIOR + 'review.json'}
    old_diff = git('diff', '--binary', old_manifest['entryCommit'], old_candidate)
    assert len(old_diff) == old_manifest['completeDiffBytes'] and sha(old_diff) == old_manifest['completeDiffSha256']
    for item in old_manifest['changedFiles']:
        raw = git('show', old_candidate + ':' + item['path'])
        assert sha(raw) == item['sha256'] and len(raw) == item['bytes']
        assert git('show', ENTRY + ':' + item['path']) == raw
    protected = 0
    for line in git('ls-tree', '-rz', ENTRY).split(b'\0'):
        if not line:
            continue
        metadata, path = line.decode().split('\t')
        expected_mode, _, oid = metadata.split()
        if path in HISTORIES:
            continue
        p = R / path
        raw = os.readlink(p).encode() if p.is_symlink() else p.read_bytes()
        assert mode(p) == expected_mode
        assert hashlib.sha1(b'blob ' + str(len(raw)).encode() + b'\0' + raw).hexdigest() == oid, path
        protected += 1
    for path in HISTORIES:
        before = git('show', ENTRY + ':' + path)
        current = (R / path).read_bytes()
        assert mode(R / path) == git('ls-tree', ENTRY, path).decode().split()[0]
        if path.endswith('STUDENT_DATA_AND_MAINTENANCE_PLAN.md'):
            start = b'<!-- SD2-DISPATCH-SUFFICIENCY-1-START -->\n'
            end = b'<!-- SD2-DISPATCH-SUFFICIENCY-1-END -->\n'
            assert current.count(start) == current.count(end) == 1
            assert current[:current.index(start)] + current[current.index(end) + len(end):] == before
        else:
            assert current.endswith(before), path
    changed = set(git('diff', '--name-only', ENTRY).decode().splitlines())
    changed |= set(git('ls-files', '--others', '--exclude-standard').decode().splitlines())
    assert all(path in HISTORIES or path.startswith(PREFIX) for path in changed)
    inventory = load(PREFIX + 'input-inventory.json')
    assert inventory['entryCommit'] == ENTRY and not inventory['rawTraceOrProviderBodyRead']
    assert inventory['sourceRequests'] == inventory['workbookRequests'] == 0
    pins = {x['path']: x for x in inventory['files']}
    assert len(pins) == len(inventory['files']) == 20
    for path, item in pins.items():
        raw = (R / path).read_bytes()
        assert sha(raw) == item['sha256'] and len(raw) == item['bytes']
        assert git('show', ENTRY + ':' + path) == raw
        assert git('rev-parse', ENTRY + ':' + path).decode().strip() == item['gitBlob']
    decision = load(PREFIX + 'decision.json')
    assert decision['evidenceDecision'] == 'BLOCKED_NOT_ESTABLISHED_ZERO_CLEARED'
    assert decision['exactNeverDispatchedProof'] == 'NOT_ESTABLISHED'
    assert decision['targetsHeld'] == 397 and decision['quarantinesHeld'] == 272 and decision['otherHolds'] == 125
    assert decision['clearedForAcquisition'] == decision['acceptedFacts'] == decision['acceptedMappings'] == 0
    assert not decision['canonicalAcceptance'] and not decision['fullSD2Complete'] and not decision['SD3Started']
    assert decision['originalSourceExecution'] == 'FAIL'
    assert decision['observedCompletedCalls'] == 64 and decision['frontierReservations'] == 4
    assert decision['conservativeExplicitCalls'] == 68 and decision['theoreticalUnusedExpandedTargets'] == 72
    assert decision['exactAttempts'] == 'NOT_ESTABLISHED' and decision['underlyingHttpRequests'] == 'UNMEASURED'
    for item in decision['evidenceAssessment']:
        ref = item['reference']
        assert ref['path'] in pins and ref['sha256'] == pins[ref['path']]['sha256']
        value = pointer(load(ref['path']), ref['pointer'])
        assert value is not None
    audit = load('docs/evidence/sd2-resolution-proof-1/source-call-audit.json')
    ledger = load('docs/evidence/sd2-resolution-proof-1/call-ledger-review.json')
    summary = load('docs/evidence/sd2-control-repair-1/summary.json')
    historical = load('docs/evidence/sd2-control-repair-1/historical-import.json')
    assert audit['doesNotProveNoUnloggedInFlightDispatch'] and len(audit['records']) == 64
    assert 'item_completed' in ledger['traceBinding']['eventVisibilityLimit']
    assert 'absence is not proof' in ledger['traceBinding']['eventVisibilityLimit']
    assert not historical['exactAttemptsEstablished'] and len(historical['completed']) == 64 and len(historical['frontier']) == 4
    assert summary['exactNeverDispatchedProof'] == 'NOT_ESTABLISHED' and summary['clearedForAcquisition'] == 0
    assert load('docs/evidence/sd2-control-repair-1/contract.json')['mode'] == 'synthetic-only'
    inherited = load(PRIOR + 'open-items.json')
    items = load(PREFIX + 'open-items.json')
    assert items['inheritedReference'] == dict(path=PRIOR + 'open-items.json', sha256=pins[PRIOR + 'open-items.json']['sha256'], pointer='')
    for field, count in [('items', 13), ('originalGates', 14), ('additionalSessionDispositions', 4)]:
        assert items[field] == inherited[field] and len(items[field]) == count
    assert all(x['owner'] and x['trigger'] and x['authoritativePath'] and x['nextAction'] for x in items['checkpointDispositions'])
    state = load('docs/BUILD_STATE.json')
    assert state['planRevision'] == 21 and state['activeStageId'] is None and state['nextPermittedStageId'] is None
    validation_path = G / 'validation.json'
    if validation_path.exists():
        validation = json.loads(validation_path.read_bytes())
        expected = [['npm', 'run', 'plan:check'], ['npm', 'run', 'typecheck'], ['npm', 'test'], ['npm', 'run', 'build'], ['git', 'diff', '--check'], ['git', 'diff', '--check', ENTRY]]
        assert [x['command'] for x in validation['checks']] == expected
        assert [x['exitCode'] for x in validation['checks']] == [1, 0, 1, 1, 0, 0]
        assert validation['dependencyInstallAttempts'] == validation['sourceRequests'] == validation['workbookRequests'] == 0
        assert validation['requiredBuildGateRemainsOpen'] and not validation['freshAuthenticatedMainTargetVerified']
        for item in validation['checks']:
            raw = (R / item['logPath']).read_bytes()
            assert sha(raw) == item['storedSha256'] and len(raw) == item['storedBytes']
            unpacked = gzip.decompress(raw)
            assert sha(unpacked) == item['rawSha256'] and len(unpacked) == item['rawBytes']
        build = gzip.decompress((G / 'checks/build.log.gz').read_bytes()).decode()
        assert 'Operation not permitted' in build and 'binding to a port' in build
        retry = load(PREFIX + 'validation-retry.json')
        assert [x['command'] for x in retry['checks']] == [expected[0], expected[2]]
        assert [x['exitCode'] for x in retry['checks']] == [0, 0]
        assert retry['dependencyInstallAttempts'] == retry['sourceRequests'] == retry['workbookRequests'] == 0
        assert not retry['alternateBuild'] and not retry['buildGateWaived']
        for item in retry['checks']:
            raw = (R / item['logPath']).read_bytes()
            assert sha(raw) == item['storedSha256'] and len(raw) == item['storedBytes']
            unpacked = gzip.decompress(raw)
            assert sha(unpacked) == item['rawSha256'] and len(unpacked) == item['rawBytes']
        for name in ['plan', 'tests']:
            original = gzip.decompress((G / 'checks' / (name + '.log.gz')).read_bytes()).decode()
            assert 'listen EPERM' in original and 'tsx' in original
    manifest_path = G / 'manifest.json'
    manifest = None
    if manifest_path.exists():
        manifest = json.loads(manifest_path.read_bytes())
        candidate = manifest['candidateCommit']
        assert manifest['entryCommit'] == ENTRY
        assert git('merge-base', '--is-ancestor', ENTRY, candidate) == b''
        assert git('rev-parse', candidate + '^{tree}').decode().strip() == manifest['candidateTree']
        diff = git('diff', '--binary', ENTRY, candidate)
        assert len(diff) == manifest['completeDiffBytes'] and sha(diff) == manifest['completeDiffSha256']
        assert set(git('diff', '--name-only', ENTRY, candidate).decode().splitlines()) == {x['path'] for x in manifest['changedFiles']}
        for item in manifest['changedFiles']:
            raw = git('show', candidate + ':' + item['path'])
            assert sha(raw) == item['sha256'] and len(raw) == item['bytes']
            assert (R / item['path']).read_bytes() == raw
            assert git('ls-tree', candidate, item['path']).decode().split()[0] == item['mode']
    if bound:
        assert manifest is not None and validation_path.exists()
        review = load(PREFIX + 'review.json')
        assert review['outcome'] == 'PASS' and not any(review['unresolvedSeverityCounts'].values())
        assert review['binding']['candidateCommit'] == manifest['candidateCommit']
        assert review['binding']['manifestSha256'] == sha(manifest_path.read_bytes())
        assert review['independence']['freshContext'] and review['independence']['readOnlyRepository']
        assert not review['independence']['authoredOrEditedReviewedStage']
        assert review['sourceExecutionStatus'] == 'FAIL' and not review['canonicalAcceptance']
        assert git('rev-parse', 'HEAD^').decode().strip() == manifest['candidateCommit']
        assert set(git('diff', '--name-only', manifest['candidateCommit'], 'HEAD').decode().splitlines()) == {PREFIX + 'manifest.json', PREFIX + 'review.json'}
        assert not git('status', '--porcelain').strip()
    git('diff', '--check', ENTRY)
    return dict(localObjectiveIntegrity='PASS', reviewBound=bound, evidenceDecision='BLOCKED_NOT_ESTABLISHED_ZERO_CLEARED', protectedPreEntryFiles=protected, appendHistories=3, inheritedItems=13, originalGates=14, inheritedAdditionalDispositions=4, originalSourceExecution='FAIL', targetsHeld=397, quarantinesHeld=272, clearedForAcquisition=0, exactNeverDispatchedProof='NOT_ESTABLISHED', acceptedFacts=0, acceptedMappings=0, canonicalAcceptance=False, fullSD2Complete=False, SD3Started=False)


if __name__ == '__main__':
    print(json.dumps(verify('--review-bound' in sys.argv), indent=2))
