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
ENTRY = '901040e62d871f592f5600d366b3a19b39d08d07'
PRIOR = 'docs/evidence/sd2-acceptance-readiness-1/'
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
    assert entry['result']['reviewBound'] and entry['result']['localObjectiveIntegrity'] == 'PASS'
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
            start = b'<!-- SD2-HELD-CLOSURE-CONTRACT-1-START -->\n'
            end = b'<!-- SD2-HELD-CLOSURE-CONTRACT-1-END -->\n'
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
    assert len(pins) == len(inventory['files']) == 22
    for path, item in pins.items():
        raw = (R / path).read_bytes()
        assert sha(raw) == item['sha256'] and len(raw) == item['bytes']
        assert git('show', ENTRY + ':' + path) == raw
        assert git('rev-parse', ENTRY + ':' + path).decode().strip() == item['gitBlob']
    spec = load(PREFIX + 'amendment-spec.json')
    assert spec['status'] == 'PROSPECTIVE_DRAFT_NOT_APPLIED' and not spec['canonicalActivation']
    assert spec['currentEntryCommit'] == ENTRY and spec['currentRevisionRequired'] == 21 and spec['proposedRevision'] == 22
    assert spec['notAnExecutablePatch'] and spec['canonicalStagePointersRemainNull'] and spec['priorP0ThroughP9RemainAccepted']
    assert len(spec['proposedImplementationAllowlist']) == len(set(spec['proposedImplementationAllowlist'])) == 14
    assert 'web/package-lock.json' not in spec['proposedImplementationAllowlist']
    assert all(not path.startswith(('web/src/', '.github/')) for path in spec['proposedImplementationAllowlist'])
    assert spec['exactDenominator'] == dict(savedPositions=794, namedInputs=411, emptyPositions=383, originalFieldDefinitions=7547, heldFields=7518, proposedFields=29, separateAppAwardIds=411, separateSourceLocators=397, quarantines=272)
    for stage in ['before', 'after']:
        transition = spec['transition'][stage]
        assert transition['acceptedFacts'] == transition['acceptedMappings'] == 0 and not transition['SD3Started']
    assert not spec['transition']['before']['fullSD2Complete'] and spec['transition']['after']['fullSD2Complete']
    assert spec['activationPrerequisites'] and spec['adversarialValidationRequirements'] and spec['proposedStateTransformation']
    outcome = spec['currentOutcome']
    assert outcome['contractDraftCompleteOnlyAtMatchingIndependentPassReceipt']
    assert not outcome['canonicalAcceptance'] and not outcome['fullSD2Complete'] and not outcome['SD3Started']
    assert outcome['acceptedFacts'] == outcome['acceptedMappings'] == outcome['clearedForAcquisition'] == 0
    assert outcome['targetsHeld'] == 397 and outcome['quarantinesHeld'] == 272 and outcome['originalSourceExecution'] == 'FAIL'
    observations = load(PREFIX + 'connector-observations.json')['observations']
    assert len(observations) == 4 and all(x['isError'] for x in observations)
    by_key = {x['key']: x for x in observations}
    assert by_key['repo']['args'] == dict(repository_full_name='whitefishscholarship/program_code')
    assert by_key['repo']['httpStatus'] == 404
    assert by_key['branch']['args'] == dict(owner='whitefishscholarship', repo_name='program_code', query='main', page_size=10)
    for key in ['project', 'domains']:
        assert by_key[key]['httpStatus'] == 403
        assert by_key[key]['args']['idOrName'] == 'prj_LbefE2deji6nPND6iBiuofe7IABv'
        assert by_key[key]['args']['teamId'] == 'team_6CAjRq58n0WvAH49otKSQbA7'
    cli = load(PREFIX + 'cli-observations.json')['observations']
    assert len(cli) == 2 and all(x['exitCode'] == 1 for x in cli)
    assert cli[0]['key'] == 'github-repo' and cli[0]['command'][:3] == ['gh', 'api', 'repos/whitefishscholarship/program_code']
    assert '404' in cli[0]['stderrMetadataOrError']
    assert cli[1]['command'] == ['vercel', '--scope', 'team_6CAjRq58n0WvAH49otKSQbA7', 'project', 'inspect', 'prj_LbefE2deji6nPND6iBiuofe7IABv', '--non-interactive']
    assert 'do not have access to the specified account' in cli[1]['stderrMetadataOrError']
    inherited = load(PRIOR + 'open-items.json')
    items = load(PREFIX + 'open-items.json')
    assert items['inheritedReference'] == dict(path=PRIOR + 'open-items.json', sha256=pins[PRIOR + 'open-items.json']['sha256'])
    for field, count in [('items', 13), ('originalGates', 14), ('additionalSessionDispositions', 4), ('priorSufficiencyCheckpointDispositions', 2)]:
        assert items[field] == inherited[field] and len(items[field]) == count
    assert items['priorReadinessSelectionOverlay'] == inherited['readinessSelectionOverlay']
    assert items['priorReadinessBlockers'] == inherited['readinessBlockers'] and len(items['priorReadinessBlockers']) == 3
    assert len(items['currentBlockers']) == 4
    assert all(x['owner'] and x['trigger'] and x['authoritativePath'] and x['nextAction'] for x in items['currentBlockers'])
    assert items['originalSourceExecution'] == 'FAIL' and items['targetsHeld'] == 397 and items['quarantinesHeld'] == 272
    assert items['clearedForAcquisition'] == items['acceptedFacts'] == items['acceptedMappings'] == 0
    assert not items['canonicalAcceptance'] and not items['fullSD2Complete'] and not items['SD3Started']
    state = load('docs/BUILD_STATE.json')
    assert state['planRevision'] == 21 and state['activeStageId'] is None and state['nextPermittedStageId'] is None
    validator = (R / 'web/scripts/validate-build-plan.ts').read_text()
    assert 'requires direct informed delivery authority or an exact authorized local-only preparation blocker' in validator
    result_path = G / 'result.json'
    if result_path.exists():
        result = json.loads(result_path.read_bytes())
        assert result['overallExecutionStatus'] == 'BLOCKED_BUILD_AND_ACCESS'
        assert not result['canonicalContractApplied'] and not result['canonicalAcceptance']
        assert not result['fullSD2Complete'] and not result['SD3Started']
        assert result['acceptedFacts'] == result['acceptedMappings'] == result['clearedForAcquisition'] == 0
        assert result['targetsHeld'] == 397 and result['quarantinesHeld'] == 272
        assert result['originalSourceExecution'] == 'FAIL'
        assert result['explicitMetadataOperationsAttempted'] == len(observations) + len(cli) == 6
        assert result['underlyingHttpRequests'] == 'UNMEASURED'
        assert result['scholarshipSourceRequests'] == result['workbookRequests'] == result['permissionAccountCredentialOrConfigurationChanges'] == 0
    validation_path = G / 'validation.json'
    if validation_path.exists():
        validation = json.loads(validation_path.read_bytes())
        expected = [['npm', 'run', 'plan:check'], ['npm', 'run', 'typecheck'], ['npm', 'test'], ['npm', 'run', 'build'], ['git', 'diff', '--check'], ['git', 'diff', '--check', ENTRY]]
        assert [x['command'] for x in validation['checks']] == expected
        assert [x['exitCode'] for x in validation['checks']] == [0, 0, 0, 1, 0, 0]
        assert validation['dependencyInstallAttempts'] == validation['sourceRequests'] == validation['workbookRequests'] == 0
        assert validation['requiredBuildGateRemainsOpen'] and not validation['freshAuthenticatedMainTargetVerified']
        for item in validation['checks']:
            raw = (R / item['logPath']).read_bytes()
            assert sha(raw) == item['storedSha256'] and len(raw) == item['storedBytes']
            unpacked = gzip.decompress(raw)
            assert sha(unpacked) == item['rawSha256'] and len(unpacked) == item['rawBytes']
        build = gzip.decompress((G / 'checks/build.log.gz').read_bytes()).decode()
        assert 'Operation not permitted' in build and 'binding to a port' in build
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
    return dict(localObjectiveIntegrity='PASS', reviewBound=bound, contractDraftIntegrity='PASS', canonicalActivation=False, overallExecutionStatus='BLOCKED_BUILD_AND_ACCESS', protectedPreEntryFiles=protected, appendHistories=3, inheritedItems=13, originalGates=14, inheritedAdditionalDispositions=4, inheritedSupplementDispositions=2, inheritedReadinessBlockers=3, originalSourceExecution='FAIL', targetsHeld=397, quarantinesHeld=272, clearedForAcquisition=0, exactNeverDispatchedProof='NOT_ESTABLISHED', acceptedFacts=0, acceptedMappings=0, canonicalAcceptance=False, fullSD2Complete=False, SD3Started=False)


if __name__ == '__main__':
    print(json.dumps(verify('--review-bound' in sys.argv), indent=2))
