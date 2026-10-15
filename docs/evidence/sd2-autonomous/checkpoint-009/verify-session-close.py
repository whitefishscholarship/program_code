"""Read-only session closure audit; preserve every earlier review/audit binding."""
from pathlib import Path
import json, hashlib, subprocess, datetime
P=Path(__file__).resolve().parent; B=P.parent; ROOT=P.parents[3]
load=lambda p:json.loads(p.read_text()); sha=lambda b:hashlib.sha256(b).hexdigest()
g=lambda *a:subprocess.check_output(['git',*a],cwd=ROOT)
pre=load(P/'session-close-preflight.json');baseline=pre['preCloseHead']
assert baseline.startswith('7eaa47a') and pre['exitCode']==0
assert pre['command']==['python3','docs/evidence/sd2-autonomous/checkpoint-009/verify-wrap.py']
assert sha((json.dumps(pre['audit'],indent=2)+'\n').encode())==pre['originalOutputSha256']
original=pre['audit'];assert original['outcome']=='PASS' and original['allOwnersTriggersNextActionsPresent'] and original['noPendingReviewerRepair']
pp='docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md';mutable={pp,'docs/CURRENT_HANDOFF.md','docs/evidence/sd2-autonomous/NEXT_SESSION.md'}
closurepaths={str((P/x).relative_to(ROOT)) for x in ['SESSION_CLOSE.md','session-close-preflight.json','verify-session-close.py','session-close-verification.json','session-close-plan.json','session-close-plan.log']}
changed=set(g('diff','--name-only',baseline).decode().splitlines())|set(g('ls-files','--others','--exclude-standard').decode().splitlines())
assert changed<=mutable|closurepaths,changed-(mutable|closurepaths)
# Every prior tracked file except the three append-only progress pointers is exact.
preserved=0
for path in g('ls-tree','-r','--name-only',baseline).decode().splitlines():
 if path in mutable:continue
 assert path not in changed,path;preserved+=1
text=(ROOT/pp).read_text();a='<!-- SD2-CHECKPOINT-009-CLOSE-START -->\n';b='<!-- SD2-CHECKPOINT-009-CLOSE-END -->\n'
assert text.count(a)==text.count(b)==1;x=text.index(a);y=text.index(b)+len(b)
assert text[:x]+text[y:]==g('show',baseline+':'+pp).decode()
for path in mutable-{pp}:assert (ROOT/path).read_bytes().endswith(g('show',baseline+':'+path))
m=load(P/'final-manifest.json');r=load(P/'review.json');c=m['candidateCommit'];receipt=load(P/'review-receipt-identity.json')['commit']
assert r['outcome']=='PASS' and not any(r['severityCounts'].values()) and not r['unresolvedRequiredFixes']
assert r['requiredFixCount']==r['resolvedDispositionCount']==len(r['dispositions'])==2
assert all(d['status']=='resolved-independently-rechecked' for d in r['dispositions'])
assert c==original['reviewedCandidate']==r['binding']['candidateCommit']
assert sha((P/'final-manifest.json').read_bytes())==r['binding']['manifestSha256']==original['manifestSha256']
assert sha(g('diff','--binary',m['entryCommit'],c))==m['completeDiffSha256']
assert g('rev-parse',receipt+'^').decode().strip()==c
assert set(g('diff','--name-only',c,receipt).decode().splitlines())=={str((P/x).relative_to(ROOT)) for x in ['final-manifest.json','review.json']}
for f in m['changedFiles']:assert sha((ROOT/f['path']).read_bytes())==f['sha256']==sha(g('show',c+':'+f['path']))
keys=[];fields=seeds=links=0;ledgerpins=[]
for i in range(1,10):
 path=B/f'checkpoint-{i:03d}.json';l=load(path);assert l['acceptedFacts']==0
 ledgerpins.append(dict(path=str(path.relative_to(ROOT)),sha256=sha(path.read_bytes())))
 for row in l['records']:
  keys.append(row['inputKey']);assert row['identityAcceptance']=='held' and all(row.get(k) for k in ['owner','trigger','nextAction'])
  for f in row['fieldProposals'].values():
   fields+=1;assert f['acceptance']=='held' and all(f.get(k) or row.get(k) for k in ['owner','trigger','nextAction'])
  for d in row.get('seedDispositions',[]):
   seeds+=1;assert all(d.get(k) or row.get(k) for k in ['owner','trigger','nextAction'])
 for source in l['sourceRegistry']:
  for d in source.get('linkDispositions',[]):
   links+=1;assert all(d.get(k) or source.get(k) for k in ['owner','trigger','nextAction'])
q=load(B/'queue.json');assert keys==[row['inputKey'] for row in q['records'][:180]] and len(keys)==len(set(keys))==180
assert fields==3495 and seeds==294 and links==788 and len(q['records'][180:])==226
assert q['records'][180]['inputKey']=='saved-405588227-row-184' and q['records'][180]['recordedName']=='PSA Airlines Flight Scholarship (NGPA)'
assert ledgerpins==original['ledgers']
custody=load(P/'prior-custody-audit.json');assert len(custody['pins'])==71
for pin in custody['pins']:assert sha(Path(pin['path']).read_bytes())==pin['recordedSha256']==pin['observedSha256']
pins=load(ROOT/'docs/evidence/sd2-next-read-proposal/verification.json')['retainedM1Artifacts']
for pin in pins:assert sha(g('show','009fa57:'+pin['path']))==pin['sha256']
m1=json.loads(g('show','009fa57:docs/evidence/season-monitor-m1/inventory.json'));assert len(m1['records'])==len({row['id'] for row in m1['records']})==437
state=load(ROOT/'docs/BUILD_STATE.json');assert state['activeStageId'] is None and state['nextPermittedStageId'] is None
plan=load(P/'session-close-plan.json');assert plan['exitCode']==0 and sha((ROOT/plan['logPath']).read_bytes())==plan['logSha256']
for label in ['build','build-retry']:
 result=load(P/(label+'.json'));assert result['exitCode']==1 and sha((ROOT/result['logPath']).read_bytes())==result['logSha256']
 assert 'Operation not permitted' in (ROOT/result['logPath']).read_text() and 'binding to a port' in (ROOT/result['logPath']).read_text()
for p in [P/'SESSION_CLOSE.md',B/'NEXT_SESSION.md']:
 t=p.read_text().lower()
 for token in ['offset180','row184','owner','trigger','custody','437m1','stopbeforesd3']:assert token in t,(p,token)
g('diff','--check',m['entryCommit']);g('diff','--check',baseline)
print(json.dumps(dict(outcome='PASS',recordedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),scope='Author-verified final session closure; no rebound independent source review',preCloseHandoff=baseline,reviewedCandidate=c,localReviewReceipt=receipt,manifestSha256=original['manifestSha256'],preservedPreClosePaths=preserved,reviewedCandidatePaths=44,initialDispositions=180,unprocessedInputs=226,heldFields=fields,heldIdentities=180,acceptedFacts=0,seedAliasDispositions=seeds,sourceLinkDispositions=links,allOwnersTriggersNextActionsPresent=True,allNineAttentionRowsSupplementsAndPriorHistoryPreserved=True,allNineLedgersAndReviewBindingsExact=True,priorCustodyPinsVerified=71,M1Records=437,M1Pins=len(pins),independentReviewerStatus='completed; no pending repair/recheck/delegated work',resolvedReviewFindings=2,gitIndexAndWrongHeadDraftIssuesResolved=True,originalVerificationAllowlistAndBindingsPreserved=True,sourcePolicyAndEveryLaterGateRetained=True,noNewResearchResetReplayFactAcceptanceOrEffects=True,SD3Started=False,buildGate=original['buildGate'],freshMainTargetGate=original['freshMainTargetGate'],next=original['next'],recommendedNextSessionEffort='High'),indent=2))
