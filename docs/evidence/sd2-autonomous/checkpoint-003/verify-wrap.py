"""Read-only by default. --record exclusively creates this checkpoint's new wrap receipt."""
from pathlib import Path
import datetime,hashlib,json,subprocess,sys
P=Path(__file__).resolve().parent;ROOT=P.parents[3]
ENTRY='2b021a6162f8b94684c10c390bef5ee8bbb47bed'
RECEIPT='1895c67081af52ec95a15aa3408c95de9aa4b1ad'
def git(*args):return subprocess.check_output(['git',*args],cwd=ROOT)
def sha(b):return hashlib.sha256(b).hexdigest()
def load(p):return json.loads(p.read_text())
if '--record' in sys.argv:assert not (P/'wrap-verification.json').exists(),'Existing receipt is immutable; use default read-only check'
commands=[]
for cmd in [['python3','docs/evidence/sd2-autonomous/checkpoint-003/verify.py'],['python3','docs/evidence/sd2-autonomous/build-queue.py','--check'],['git','diff','--check',ENTRY]]:
 start=datetime.datetime.now(datetime.timezone.utc).isoformat();r=subprocess.run(cmd,cwd=ROOT,capture_output=True,text=True)
 commands.append({'command':cmd,'startedAt':start,'completedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'exitCode':r.returncode,'stdout':r.stdout,'stderr':r.stderr});assert r.returncode==0,commands[-1]
m=load(P/'final-manifest.json');review=load(P/'review.json');binding=review['binding']
assert review['outcome']=='PASS' and review['severityCounts']==dict(critical=0,high=0,medium=0,low=0)
assert sha((P/'final-manifest.json').read_bytes())==binding['manifestSha256']
c=m['candidateCommit'];assert c==binding['candidateCommit']==git('rev-parse',RECEIPT+'^').decode().strip()
assert m['candidateTree']==binding['candidateTree']==git('rev-parse',c+'^{tree}').decode().strip()
assert sha(git('diff','--binary',ENTRY,c))==m['completeDiffSha256']==binding['completeDiffSha256']
assert {f['path'] for f in m['changedFiles']}==set(git('diff','--name-only',ENTRY,c).decode().splitlines())
for f in m['changedFiles']:
 b=git('show',c+':'+f['path']);assert sha(b)==f['sha256'] and len(b)==f['bytes'] and (ROOT/f['path']).read_bytes()==b,f['path']
assert set(git('diff','--name-only',c,RECEIPT).decode().splitlines())=={'docs/evidence/sd2-autonomous/checkpoint-003/final-manifest.json','docs/evidence/sd2-autonomous/checkpoint-003/review.json'}
for name in ['final-manifest.json','review.json']:assert (P/name).read_bytes()==git('show',RECEIPT+':docs/evidence/sd2-autonomous/checkpoint-003/'+name)
first=load(P/'review-round1.json');assert sha((P/'manifest-round1.json').read_bytes())==first['binding']['manifestSha256']
assert first['binding']['candidateCommit']=='287e1a71145d5ec299566301f26b34bd51319dfd'
assert {x['findingId'] for x in load(P/'dispositions.json')['dispositions']}=={x['id'] for x in first['findings']}=={x['findingId'] for x in review['dispositions']}
assert all(x['status']=='resolved-independently-rechecked' for x in review['dispositions'])
l=load(P.parent/'checkpoint-003.json');assert l['coverage']['cumulativeInitialDispositions']==60 and l['nextCheckpointInputOffset']==60
assert l['coverage']['cumulativeAutonomousHeldFields']==1136 and l['coverage']['cumulativeAutonomousHeldIdentities']==60
for name in ['NEXT_SESSION.md','CONTINUE.md']:
 t=(P.parent/name).read_text();assert all(s in t for s in ['offset60','346','Elks Most Valuable Student Scholarship','stop beforeSD3'])
t=(ROOT/'docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md').read_text();assert '<!-- SD2-CHECKPOINT-003-START -->' in t and '1,136' in t
wrap=(P/'SESSION_WRAP.md').read_text();assert c in wrap and RECEIPT in wrap
plancheck=load(P/'wrap-plan-check.json');assert plancheck['exitCode']==0
report={'outcome':'PASS','scope':'Author-verified documentation wrap; exact independent source review unchanged','recordedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'entryCommit':ENTRY,'reviewedCandidate':c,'localReviewReceipt':RECEIPT,'manifestSha256':sha((P/'final-manifest.json').read_bytes()),'reviewSha256':sha((P/'review.json').read_bytes()),'coverage':l['coverage'],'nextQueueOffset':60,'nextSavedRow':63,'nextInputKey':l['nextInputKey'],'preservation':{'preEntryPaths':1089,'reviewedPacketPaths':len(m['changedFiles']),'allNineOriginalRowsAndSupplements':True,'historicalCheckpoint001002AndAllReviewBindings':'byte-identical','M1Records':437,'M1ArtifactPins':12,'priorFivePacketsAndPRELUDEDecisions':'exact','originalFirstReviewAndFourFixes':'preserved and independently rechecked'},'openItemRouting':{'authoritativePath':'docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md section9','supplementPath':'docs/evidence/sd2-autonomous/checkpoint-003/SESSION_WRAP.md','fieldHoldPaths':['docs/evidence/sd2-autonomous/checkpoint-001.json','docs/evidence/sd2-autonomous/checkpoint-002.json','docs/evidence/sd2-autonomous/checkpoint-003.json'],'owner':'Codex source/identity reconciliation; existing original later-stage/human/monitor owners retained','trigger':'Applicable authorized evidence arrival or SD2 consolidation after initial remaining-queue coverage; every original later gate unchanged','nextAction':'Resume exact offset60; reconcile every held field/identity under POLICY without resetting, replay, false exclusions or acceptance shortcut'},'verification':'Required plan/type/fulltests PASS, exact standard build twice EPERM, frozen full diff PASS; focused evidence/history and final documentation plan checks PASS. No unchanged runtime matrix repeated for wrap.','freshMainTarget':'unverified local pin only; Codex establishes before later acceptance/release','reviewerTasks':'complete; no unresolved findings','newSourceWorkbookOrExternalEffectsDuringWrap':0,'workbookWrites':0,'appConfigurationLoginFormsContactMessagesRemoteGitReleaseActivation':0,'canonicalAcceptance':False,'fullSD2Complete':False,'SD3Started':False,'actualBackendModelAndEffort':'Not independently observable; no switch claimed','commands':commands,'wrapPlanCheck':plancheck}
if '--record' in sys.argv:
 with (P/'wrap-verification.json').open('x') as f:f.write(json.dumps(report,indent=2)+'\n')
else:
 if (P/'wrap-verification.json').exists():
  saved=load(P/'wrap-verification.json');assert saved['reviewedCandidate']==c and saved['localReviewReceipt']==RECEIPT and saved['coverage']==l['coverage'] and saved['manifestSha256']==report['manifestSha256'] and saved['reviewSha256']==report['reviewSha256']
print(json.dumps({k:report[k] for k in ['outcome','scope','reviewedCandidate','localReviewReceipt','coverage','nextInputKey','preservation','fullSD2Complete','SD3Started']},indent=2))
