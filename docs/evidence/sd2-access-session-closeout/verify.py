"""Read-only closeout/receipt integrity; never rerun historical context verifiers."""
from pathlib import Path
import gzip
import hashlib
import json
import os
import subprocess
import sys

G = Path(__file__).resolve().parent
R = G.parents[2]
ENTRY = '49a978544ee158b0cc87841e0d94c30c53aa0596'
PRIOR = 'docs/evidence/sd2-held-closure-contract-1/'
PREFIX = str(G.relative_to(R)) + '/'
HISTORIES = {'docs/CURRENT_HANDOFF.md', 'docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md',
             'docs/evidence/sd2-autonomous/NEXT_SESSION.md'}


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def git(*args):
    return subprocess.check_output(['git', *args], cwd=R)


def load(path):
    return json.loads((R / path).read_bytes())


def mode(path):
    return '120000' if path.is_symlink() else ('100755' if path.stat().st_mode & 0o111 else '100644')


def verify(bound=False):
    assert git('branch', '--show-current').decode().strip() == 'codex/plan-student-data-maintenance'
    entry = load(PREFIX + 'entry-audit.json')
    assert entry['entryCommit'] == ENTRY and entry['cleanStatus'] == ''
    assert entry['command'] == ['python3', PRIOR + 'verify.py', '--review-bound']
    assert entry['exitCode'] == 0 and entry['newPacketCreatedAfterVerification']
    assert entry['result']['reviewBound'] and entry['result']['localObjectiveIntegrity'] == 'PASS'
    old = load(PRIOR + 'manifest.json')
    review = load(PRIOR + 'review.json')
    assert review['outcome'] == 'PASS' and not any(review['unresolvedSeverityCounts'].values())
    assert review['binding']['candidateCommit'] == old['candidateCommit']
    assert review['binding']['manifestSha256'] == sha((R / (PRIOR + 'manifest.json')).read_bytes())
    assert git('rev-parse', ENTRY + '^').decode().strip() == old['candidateCommit']
    assert set(git('diff', '--name-only', old['candidateCommit'], ENTRY).decode().splitlines()) == {PRIOR + 'manifest.json', PRIOR + 'review.json'}
    diff = git('diff', '--binary', old['entryCommit'], old['candidateCommit'])
    assert sha(diff) == old['completeDiffSha256'] and len(diff) == old['completeDiffBytes']
    for item in old['changedFiles']:
        raw = git('show', old['candidateCommit'] + ':' + item['path'])
        assert sha(raw) == item['sha256'] and len(raw) == item['bytes']
        assert git('show', ENTRY + ':' + item['path']) == raw
    protected = 0
    for row in git('ls-tree', '-rz', ENTRY).split(b'\0'):
        if not row:
            continue
        metadata, path = row.decode().split('\t')
        expected_mode, _, oid = metadata.split()
        p = R / path
        assert mode(p) == expected_mode
        if path in HISTORIES:
            before, after = git('show', ENTRY + ':' + path), p.read_bytes()
            if path.endswith('STUDENT_DATA_AND_MAINTENANCE_PLAN.md'):
                start = b'<!-- SD2-ACCESS-SESSION-CLOSEOUT-START -->\n'
                end = b'<!-- SD2-ACCESS-SESSION-CLOSEOUT-END -->\n'
                assert after.count(start) == after.count(end) == 1
                assert after[:after.index(start)] + after[after.index(end) + len(end):] == before
            else:
                assert after.endswith(before)
        else:
            raw = os.readlink(p).encode() if p.is_symlink() else p.read_bytes()
            assert hashlib.sha1(b'blob ' + str(len(raw)).encode() + b'\0' + raw).hexdigest() == oid, path
            protected += 1
    changed = set(git('diff', '--name-only', ENTRY).decode().splitlines())
    changed |= set(git('ls-files', '--others', '--exclude-standard').decode().splitlines())
    assert all(p in HISTORIES or p.startswith(PREFIX) for p in changed)
    items = load(PREFIX + 'open-items.json')
    assert items['inherited'] == load(PRIOR + 'open-items.json')
    assert items['inheritedReference'] == dict(path=PRIOR + 'open-items.json', sha256=sha((R / (PRIOR + 'open-items.json')).read_bytes()))
    inherited = items['inherited']
    for key, count in [('items', 13), ('originalGates', 14), ('additionalSessionDispositions', 4), ('priorSufficiencyCheckpointDispositions', 2), ('priorReadinessBlockers', 3), ('currentBlockers', 4)]:
        assert len(inherited[key]) == count
    assert len(items['sessionDispositions']) == 8
    assert all(all(x[k] for k in ['id', 'status', 'owner', 'trigger', 'authoritativePath', 'nextAction']) for x in items['sessionDispositions'])
    assert items['originalSourceExecution'] == 'FAIL' and items['targetsHeld'] == 397 and items['quarantinesHeld'] == 272
    assert items['clearedForAcquisition'] == items['acceptedFacts'] == items['acceptedMappings'] == 0
    assert not items['canonicalAcceptance'] and not items['fullSD2Complete'] and not items['SD3Started']
    state = load('docs/BUILD_STATE.json')
    assert state['planRevision'] == 21 and state['activeStageId'] is None and state['nextPermittedStageId'] is None
    gh = load(PREFIX + 'github-observations.json')
    assert gh['accountUsed'] == 'whitefishscholarship' and gh['originalAccountRestored']
    assert all(x['exitCode'] == 0 for x in gh['observations'])
    assert gh['observations'][1]['observed']['full_name'] == 'whitefishscholarship/program_code'
    assert gh['observations'][1]['observed']['default_branch'] == 'main'
    assert gh['observations'][2]['observed']['sha'] == '1c8e33f23beb55c2ed2ebe78fe4e256722af8392'
    vc = load(PREFIX + 'vercel-observations.json')
    assert vc['profileMode'] == '0o700' and not vc['credentialContentsRead'] and not vc['globalProfileChanged']
    assert vc['observations'][0]['observedUsername'] == 'whitefishscholarship'
    assert all(x['exitCode'] == 0 for x in vc['observations'])
    assert vc['observations'][1]['observed']['id'] == 'prj_LbefE2deji6nPND6iBiuofe7IABv'
    pins = state['dataAuthority']['sourceTransition']['applicationRuntime']
    for key, value in [('providerProjectFingerprintSha256', 'prj_LbefE2deji6nPND6iBiuofe7IABv'), ('providerTeamFingerprintSha256', 'team_6CAjRq58n0WvAH49otKSQbA7'), ('canonicalProductionHostnameSha256', 'web-two-gules-45.vercel.app')]:
        assert vc['canonicalTargetPins'][key] == pins[key] == sha(value.encode())
    domain = vc['observations'][2]['observed']
    assert domain['name'] == 'web-two-gules-45.vercel.app' and domain['projectId'] == 'prj_LbefE2deji6nPND6iBiuofe7IABv' and domain['verified']
    validation = G / 'validation.json'
    if validation.exists():
        checks = json.loads(validation.read_bytes())['checks']
        assert [x['command'] for x in checks] == [['npm', 'run', 'plan:check'], ['npm', 'run', 'typecheck'], ['npm', 'test'], ['npm', 'run', 'build'], ['git', 'diff', '--check'], ['git', 'diff', '--check', ENTRY]]
        assert [x['exitCode'] for x in checks] == [0, 0, 0, 1, 0, 0]
        for item in checks:
            raw = (R / item['logPath']).read_bytes()
            assert sha(raw) == item['storedSha256'] and len(raw) == item['storedBytes']
            decoded = gzip.decompress(raw)
            assert sha(decoded) == item['rawSha256'] and len(decoded) == item['rawBytes']
        assert b'Operation not permitted' in gzip.decompress((G / 'checks/build.log.gz').read_bytes())
    result = load(PREFIX + 'result.json')
    assert result['sessionStatus'] == 'BLOCKED' and result['exactCliAccessVerified'] and result['requiredBuildGateOpen']
    assert not any(result[k] for k in ['canonicalContractApplied', 'canonicalAcceptance', 'fullSD2Complete', 'SD3Started'])
    assert result['originalSourceExecution'] == 'FAIL' and result['targetsHeld'] == 397 and result['quarantinesHeld'] == 272
    assert result['clearedForAcquisition'] == result['acceptedFacts'] == result['acceptedMappings'] == 0
    manifest = G / 'manifest.json'
    if manifest.exists():
        m = json.loads(manifest.read_bytes())
        assert m['entryCommit'] == ENTRY and git('rev-parse', m['candidateCommit'] + '^').decode().strip() == ENTRY
        assert git('rev-parse', m['candidateCommit'] + '^{tree}').decode().strip() == m['candidateTree']
        raw = git('diff', '--binary', ENTRY, m['candidateCommit'])
        assert sha(raw) == m['completeDiffSha256'] and len(raw) == m['completeDiffBytes']
        assert set(git('diff', '--name-only', ENTRY, m['candidateCommit']).decode().splitlines()) == {x['path'] for x in m['changedFiles']}
        for item in m['changedFiles']:
            raw = git('show', m['candidateCommit'] + ':' + item['path'])
            assert sha(raw) == item['sha256'] and len(raw) == item['bytes']
            assert (R / item['path']).read_bytes() == raw
            assert git('ls-tree', m['candidateCommit'], item['path']).decode().split()[0] == item['mode']
    if bound:
        assert manifest.exists() and validation.exists()
        review = load(PREFIX + 'review.json')
        assert review['outcome'] == 'PASS' and not any(review['unresolvedSeverityCounts'].values())
        assert review['binding']['candidateCommit'] == m['candidateCommit'] and review['binding']['manifestSha256'] == sha(manifest.read_bytes())
        assert review['independence']['freshContext'] and review['independence']['readOnlyRepository'] and not review['independence']['authoredOrEditedReviewedStage']
        assert git('rev-parse', 'HEAD^').decode().strip() == m['candidateCommit']
        assert set(git('diff', '--name-only', m['candidateCommit'], 'HEAD').decode().splitlines()) == {PREFIX + 'manifest.json', PREFIX + 'review.json'}
        assert not git('status', '--porcelain').strip()
    git('diff', '--check', ENTRY)
    return dict(localObjectiveIntegrity='PASS', reviewBound=bound, sessionStatus='BLOCKED', protectedPreEntryFiles=protected,
                appendHistories=3, inheritedItems=13, originalGates=14, inheritedDispositions=4, sufficiencySupplements=2,
                readinessBlockers=3, historicalBlockers=4, sessionDispositions=8, exactCliAccessVerified=True,
                buildGateOpen=True, canonicalAcceptance=False, fullSD2Complete=False, SD3Started=False,
                originalSourceExecution='FAIL', targetsHeld=397, quarantinesHeld=272, clearedForAcquisition=0, acceptedFacts=0, acceptedMappings=0)


if __name__ == '__main__':
    print(json.dumps(verify('--review-bound' in sys.argv), indent=2))
