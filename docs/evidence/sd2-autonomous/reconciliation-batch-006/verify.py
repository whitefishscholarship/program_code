"""Read-only selected-batch preservation, exact occurrence and evidence verification."""
from pathlib import Path
import collections
import datetime
import hashlib
import json
import os
import subprocess
import sys

P = Path(__file__).resolve().parent
R = P.parents[3]
ENTRY = '30cc24a4a57a56e24a571e68a43805c8d230884e'
PREFIX = str(P.relative_to(R)) + '/'
MUTABLE = {'docs/CURRENT_HANDOFF.md', 'docs/evidence/sd2-autonomous/NEXT_SESSION.md',
           'docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md'}
git = lambda *a: subprocess.check_output(['git', *a], cwd=R)
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
        a = b'<!-- SD2-BATCH-006-START -->\n'; z = b'<!-- SD2-BATCH-006-END -->\n'
        assert raw.count(a) == raw.count(z) == 1
        assert raw[:raw.index(a)] + raw[raw.index(z) + len(z):] == old
    else:
        assert raw.endswith(old), path
untracked = set(git('ls-files', '--others', '--exclude-standard').decode().splitlines())
assert untracked <= {PREFIX + 'final-manifest.json', PREFIX + 'review.json'}, untracked
paths = set(git('diff', '--name-only', ENTRY).decode().splitlines()) | untracked
assert all(x in MUTABLE or x.startswith(PREFIX) for x in paths), paths
s = load(P / 'selection.json'); e = load(P / 'entry-audit.json')
assert s['entryCommit'] == e['entryCommit'] == ENTRY
assert e['exitCode'] == 0 and e['result']['outcome'] == 'PASS'
assert e['stdoutSha256']==sha((json.dumps(e['result'],indent=2)+'\n').encode())
assert e['command']==['python3','docs/evidence/sd2-autonomous/consolidation-proposal-006/verify.py','--review-bound']
assert e['result']['proposedFieldOccurrences']==53 and e['result']['newComparedFields']==0
assert e['result']['allPriorBytesModesHandoffsAndReviewBindingsPreserved']
assert s['executionSelected'] and s['allFactsAndIdentitiesRemainHeld']
proposal = load(P.parent / 'consolidation-proposal-006/scope.json')
assert s['selectedComparison'] == proposal['proposedComparison'] and not proposal['executionSelected']
for pin in s['proposalPins'] + s['savedEvidencePins'] + load(P / 'artifact-pins.json')['artifacts']:
    assert sha((R / pin['path']).read_bytes()) == pin['sha256'], pin['path']
packet = load(P.parent / 'checkpoint-001.json')
registry = {x['sourceId']: x for x in packet['sourceRegistry']}
c = load(P / 'comparison.json'); identities = load(P / 'identity-assessment.json')
assert (c['selectedInputs'], c['fieldOccurrences']) == (3, 53)
assert [r['savedRowLocator'] for r in c['records']] == [14, 15, 16]
assert [r['savedRowLocator'] for r in identities['records']] == [14, 15, 16]
seen = set(); categories = collections.Counter(); source_occurrences = []
for scope, row, ident in zip(s['selectedComparison']['orderedInputs'], c['records'], identities['records']):
    original = packet['records'][scope['queueOffset']]
    assert sha(canon(original)) == scope['recordCanonicalSha256']
    assert row['savedInputKey'] == original['inputKey'] == scope['savedInputKey']
    assert row['order'] == scope['order'] and row['displayLabel'] == scope['displayLabel']
    assert row['publicIdCandidates'] == ident['publicIdCandidates'] == scope['publicIdCandidates']
    assert row['originalIdentityAcceptance'] == ident['originalIdentityAcceptance'] == original['identityAcceptance'] == 'held'
    assert not ident['acceptedMapping'] and not ident['newIdentityAllocated']
    assert ident['originalIdentityProposal'] == original['identityProposal']
    route = {k: original[k] for k in ['owner', 'trigger', 'authoritativePath', 'nextAction']}
    assert row['originalRecordRoute'] == ident['originalRoute'] == route
    assert row['originalRecordedNameReference'] == scope['recordedNameReference']
    assert row['fieldOccurrences'] == len(row['fields']) == scope['fieldEnvelopeOccurrences']
    assert [f['field'] for f in row['fields']] == scope['orderedFieldNames'] == list(original['fieldProposals'])
    for f in row['fields']:
        ref = f['originalReference'];key = (ref['path'], ref['pointer']);assert key not in seen;seen.add(key)
        assert key == (scope['packetPath'], scope['recordPointer'] + '/fieldProposals/' + f['field'])
        env = original['fieldProposals'][f['field']]
        assert f['originalEnvelope'] == env and sha(canon(env)) == f['originalEnvelopeSha256'] and env['acceptance'] == 'held'
        assert f['originalRoute'] == route
        assert all(f['nextActionRoute'][k] == route[k] for k in route)
        note = f['comparison']; categories[note['category']] += 1
        assert note['category'] in ['existing evidence consistent', 'existing evidence conflicting', 'applicability/identity unresolved', 'evidence unavailable']
        assert note['proposalOnly'] and note['originalHoldRetained'] and not note['newReadSelected']
        assert note['minimumAdditionalProof'] == f['nextActionRoute']['minimumProofProposal']
        assert not f['nextActionRoute']['newReadSelected']
        for r in f['evidenceReferences'] + f['contextReferences'] + f['originalReviewReferences']:
            assert sha((R / r['path']).read_bytes()) == r['sha256']
            if r['pointer'] and r['path'].endswith('.json'):
                node=load(R/r['path'])
                for part in r['pointer'].split('/')[1:]:
                    part=part.replace('~1','/').replace('~0','~')
                    node=node[int(part)] if isinstance(node,list) else node[part]
        for ei, ev in enumerate(env['evidence']):
            assert ev['sourceId'] in scope['sourceIds']
            source = registry[ev['sourceId']];raw = (R / source['artifactPath']).read_bytes()
            assert sha(raw) == ev['artifactSha256'] == source['artifactSha256']
            assert ev['sourceUrl'] == source['requestedUrl'] and ev['excerpt'] in raw.decode()
            assert any(r['pointer'] == ref['pointer'] + f'/evidence/{ei}' for r in f['evidenceReferences'])
            source_occurrences.append(dict(sourceId=ev['sourceId'], savedInputKey=row['savedInputKey'],field=f['field'],
                envelopeReference=ref,evidenceIndex=ei,originalEvidence=ev))
assert len(seen) == 53 and dict(categories) == c['categoryCounts']
views = load(P / 'saved-source-references.json')['sources'];assert [v['sourceId'] for v in views] == ['rh-old','rh-alias','ffa','ffa-applications','ffa-guidelines','ffa-college-rubric','ffa-leadership-rubric','kids']
for view in views:
    source = registry[view['sourceId']]
    sx=next(x for x in s['selectedComparison']['sources'] if x['sourceId']==view['sourceId'])
    assert view['permittedInputKeys']==sx['permittedInputKeys']
    assert all(o['savedInputKey'] in view['permittedInputKeys'] for o in view['selectedEvidenceOccurrences'])
    assert view['extractionLimits'] == source['extractionLimits'] and view['sourceRevision'] == source.get('sourceRevision')
    assert view['originalSourceStatus'] == source['status'] and view['originalObservation'] == source.get('captureRecordedAt')
    assert not view['newFetchPerformed'] and not view['newSourceReceiptCreated']
    expected = [{k:v for k,v in x.items() if k!='sourceId'} for x in source_occurrences if x['sourceId'] == view['sourceId']]
    assert view['selectedEvidenceOccurrences'] == expected
# Independently check selected semantics and exact bounded-passage fidelity.
f14,f15,f16=[{f['field']:f for f in row['fields']} for row in c['records']]
for f,amount,slots in [(f14,2000,2),(f16,500,1)]:
    assert f['amount']['originalEnvelope']['value']['perRecipient']==amount
    assert f['recipientSlots']['originalEnvelope']['value']==slots
    assert f['minimumGPA']['originalEnvelope']['value']==2.0
    assert 'AMTOPP' in f['minimumGPA']['originalEnvelope']['note']
    assert 'drift' in f['minimumGPA']['comparison']['comparison']
assert 'OR' in f14['namedEligibilityStatement']['comparison']['comparison']
assert f15['educationStageConflict']['originalEnvelope']['state']=='conflict'
assert f15['educationStageConflict']['comparison']['category']=='existing evidence conflicting'
assert f15['initialEligibility']['originalEnvelope']['value']['agesInclusive']==[16,26]
assert 'inclusive' in f15['initialEligibility']['comparison']['comparison']
assert f15['fafsaRequired']['originalEnvelope']['value'] is False
assert f15['materials']['originalEnvelope']['value'] is None
assert f15['renewability']['originalEnvelope']['value']=={'possible':True,'contingentOnFunds':True,'renewalEligibilityLimitYears':4}
contexts=load(P/'selected-context.json')['sources']
assert [x['sourceId'] for x in contexts]==[x['sourceId'] for x in s['selectedComparison']['sources']]
for context,sx in zip(contexts,s['selectedComparison']['sources']):
    assert context['permittedInputKeys']==sx['permittedInputKeys']
    assert context['artifactReference']['path']==sx['artifactPath'] and context['artifactReference']['sha256']==sx['artifactSha256']
    text=(R/sx['artifactPath']).read_text()
    for q in context['passages']:
        assert 0<=q['startCharacter']<q['endCharacter']<=len(text)
        assert q['quote']==text[q['startCharacter']:q['endCharacter']]
    if context['sourceId']=='ffa':assert len(context['passages'])==1 and context['passages'][0]['quote']==text.splitlines()[13]
assert contexts[0]['artifactReference']['sha256']==contexts[1]['artifactReference']['sha256']
assert all(identities[k]==0 for k in ['acceptedMappings','newStableIds','deletedInputs','mergedInputs','childAwardsCreated'])
assert not identities['completePopulationIdentityReconciliation']
assert c['priorComparedFieldOccurrences']==300 and c['cumulativeComparedFieldOccurrences']==353
assert c['comparedAutonomousInputs']==17 and c['comparedPriorJayceeInputs']==2 and c['remainingAutonomousInputsOutsideComparison']==389
assert dict(categories)=={'existing evidence consistent':13,'applicability/identity unresolved':35,'evidence unavailable':4,'existing evidence conflicting':1}
rows=[]
for i in range(1,22):
    p=load(P.parent / f'checkpoint-{i:03d}.json');rows.extend(p['records'])
assert len(rows)==406 and all(x['identityAcceptance']=='held' for x in rows)
fields=[f for r in rows for f in r['fieldProposals'].values()]
assert len(fields)==7406 and all(f['acceptance']=='held' for f in fields)
assert p['nextCheckpointInputOffset']==406 and p['nextInputKey'] is None
assert c['acceptedFacts']==c['originalFactsChanged']==c['newSourceOrWorkbookReads']==c['rawContentReinspections']==0
assert not c['fullSD2Complete'] and not c['SD3Started'] and not c['externalEffects']
val=load(P/'validation.json')
assert val['requiredChecksRemainUnfulfilled'] and val['originalBuildEpermGateRetained']
assert len(val['checks'])==4
for check in val['checks']:
    assert load(R/str(Path(check['logPath']).with_suffix('.json')))==check
    raw=check['rawOutputUtf8'];assert sha(raw.encode())==check['rawLogSha256'] and len(raw.encode())==check['rawLogBytes']
    data=(R/check['logPath']).read_bytes();assert sha(data)==check['logSha256']
    assert data.decode()=='\n'.join(x.rstrip() for x in raw.splitlines()).rstrip()+'\n'
    assert check['exitCode']==127 and 'command not found' in raw
assert [x['command'] for x in val['checks']]==[['npm','run','plan:check'],['npm','run','typecheck'],['npm','test'],['npm','run','build']]
assert all(x=='BLOCKED_ENVIRONMENT' for x in val['results'].values())
recovery=load(P/'checkout-recovery.json')
assert recovery['tip']==ENTRY and recovery['existingMatchingTrackedFilesPreserved']==1582
assert recovery['restoredMissingTrackedFiles']==len(recovery['restoredFiles'])==901
assert recovery['overwrittenExistingFiles']==0 and recovery['branchAndIndexAndHistoryUnchanged']
for pin in recovery['restoredFiles']:
    assert sha(git('show',ENTRY+':'+pin['path']))==pin['sha256']
    if pin['path'] not in MUTABLE:
        assert pin['sha256']==sha((R/pin['path']).read_bytes())
if '--review-bound' in sys.argv:
    m=load(P/'final-manifest.json');review=load(P/'review.json')
    assert review['outcome']=='PASS' and not any(review['severityCounts'].values())
    assert review['binding']['candidateCommit']==m['candidateCommit'] and review['binding']['manifestSha256']==sha((P/'final-manifest.json').read_bytes())
    assert git('rev-parse',m['candidateCommit']+'^{tree}').decode().strip()==m['candidateTree']
    assert sha(git('diff','--binary',ENTRY,m['candidateCommit']))==m['completeDiffSha256']
    assert set(git('diff','--name-only',ENTRY,m['candidateCommit']).decode().splitlines())=={x['path'] for x in m['changedFiles']}
    for f in m['changedFiles']:assert sha(git('show',m['candidateCommit']+':'+f['path']))==f['sha256']==sha((R/f['path']).read_bytes())
    assert git('rev-parse','HEAD^').decode().strip()==m['candidateCommit']
    assert set(git('diff','--name-only',m['candidateCommit'],'HEAD').decode().splitlines())=={PREFIX+'final-manifest.json',PREFIX+'review.json'}
git('diff','--check',ENTRY)
print(json.dumps(dict(outcome='PASS',startedAt=started,completedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),
    entryCommit=ENTRY,protectedEntryFiles=protected,allPriorBytesModesHandoffsAndReviewBindingsPreserved=True,
    selectedInputs=3,fieldOccurrences=53,categoryCounts=dict(categories),cumulativeComparedFieldOccurrences=353,
    comparedAutonomousInputs=17,remainingAutonomousInputsOutsideComparison=389,autonomousFieldHolds=7406,
    autonomousIdentityHolds=406,researchCursor=406,nextResearchInput=None,M1Records=437,M1Pins=12,custodyPins=71,
    custodyLimit='Original receipts and fresh predecessor verification preserved; no new raw custody-availability claim',
    acceptedFacts=0,acceptedMappings=0,newSourceOrWorkbookReads=0,rawContentReinspections=0,
    fullSD2Complete=False,canonicalAcceptance=False,SD3Started=False,externalEffects=False),indent=2))
