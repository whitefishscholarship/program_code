"""Author documentation closeout audit; writes only the new wrap receipt."""
from pathlib import Path
import collections,datetime,hashlib,json,subprocess
P=Path(__file__).resolve().parent;ROOT=P.parents[3]
ENTRY='ec895940b0c93fcb063a357572504bcbe8e79648'
RECEIPT='9c79b15332cfb6960dbfda7c9298b35536fa3c43'
def git(*a):return subprocess.check_output(['git',*a],cwd=ROOT)
def sha(b):return hashlib.sha256(b).hexdigest()
def load(p):return json.loads(p.read_text())
commands=[]
for command in [['python3','docs/evidence/sd2-autonomous/checkpoint-002/verify.py'],['python3','docs/evidence/sd2-autonomous/verify.py'],['python3','docs/evidence/sd2-autonomous/build-queue.py','--check'],['git','diff','--check',ENTRY]]:
 start=datetime.datetime.now(datetime.timezone.utc).isoformat();r=subprocess.run(command,cwd=ROOT,capture_output=True,text=True)
 commands.append({'command':command,'startedAt':start,'completedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'exitCode':r.returncode,'stdout':r.stdout,'stderr':r.stderr});assert r.returncode==0,commands[-1]
manifest=load(P/'final-manifest.json');review=load(P/'review.json');binding=review['binding']
assert review['outcome']=='PASS' and review['severityCounts']==dict(critical=0,high=0,medium=0,low=0)
assert binding['manifestSha256']==sha((P/'final-manifest.json').read_bytes())
candidate=manifest['candidateCommit'];assert candidate==binding['candidateCommit']==git('rev-parse',RECEIPT+'^').decode().strip()
assert manifest['candidateTree']==binding['candidateTree']==git('rev-parse',candidate+'^{tree}').decode().strip()
assert sha(git('diff','--binary',ENTRY,candidate))==manifest['completeDiffSha256']==binding['completeDiffSha256']
for f in manifest['changedFiles']:
 b=git('show',candidate+':'+f['path']);assert sha(b)==f['sha256'] and len(b)==f['bytes']
 assert (ROOT/f['path']).read_bytes()==b,f['path']
assert set(git('diff','--name-only',candidate,RECEIPT).decode().splitlines())=={'docs/evidence/sd2-autonomous/checkpoint-002/final-manifest.json','docs/evidence/sd2-autonomous/checkpoint-002/review.json'}
for path in ['final-manifest.json','review.json']:assert (P/path).read_bytes()==git('show',RECEIPT+':docs/evidence/sd2-autonomous/checkpoint-002/'+path)
archived=load(P/'manifest-round1.json');round1=load(P/'review-round1.json')
assert sha((P/'manifest-round1.json').read_bytes())==round1['binding']['manifestSha256']
assert archived['candidateCommit']==round1['binding']['candidateCommit']=='535fbc85061c768c86546e44a5f9239480cecdf8'
assert (P/'manifest-round1.json').read_bytes()==(P/'manifest.json').read_bytes()
assert sha((P/'review-round1.json').read_bytes())==review['preservedOriginalReview']['reviewSha256']
dispositions=load(P/'dispositions.json')['dispositions'];assert len(dispositions)==len(round1['findings'])==len(review['recheckedFixes'])==2
assert {d['findingId'] for d in dispositions}=={f['id'] for f in round1['findings']}=={f['findingId'] for f in review['recheckedFixes']}
assert all(f['status']=='fixed-independently-rechecked' for f in review['recheckedFixes'])
before=git('show',ENTRY+':docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md').decode();plan=(ROOT/'docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md').read_text()
table=lambda x:x.split('| Attention item / evidence |',1)[1].split('\nResolved here:',1)[0]
assert table(plan)==table(before)
assert len([x for x in table(plan).splitlines() if x.startswith('| ')])-1==9
for path in ['docs/CURRENT_HANDOFF.md','docs/evidence/sd2-autonomous/README.md']:
 assert (ROOT/path).read_bytes().endswith(git('show',ENTRY+':'+path))
old=load(P.parent/'checkpoint-001.json');new=load(P.parent/'checkpoint-002.json');q=load(P.parent/'queue.json')
fields=[f for l in [old,new] for r in l['records'] for f in r['fieldProposals'].values()]
assert len(fields)==744 and all(f['acceptance']=='held' for f in fields)
records=old['records']+new['records'];assert len(records)==len({r['inputKey'] for r in records})==40
assert [r['inputKey'] for r in records]==[r['inputKey'] for r in q['records'][:40]]
assert all(r['identityAcceptance']=='held' and r['owner'] and r['trigger'] and r['nextAction'] for r in records)
for path in ['NEXT_SESSION.md','CONTINUE.md']:
 text=(P.parent/path).read_text();assert 'offset40' in text and '366' in text and 'Fred J. Epstein Youth Achievement Award' in text and 'stop beforeSD3' in text
report={'outcome':'PASS','scope':'Author-verified documentation wrap; independent research binding unchanged','recordedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'entryCommit':ENTRY,'reviewedCandidate':candidate,'localReviewReceipt':RECEIPT,'manifestSha256':sha((P/'final-manifest.json').read_bytes()),'reviewSha256':sha((P/'review.json').read_bytes()),'coverage':{'frozenInputs':406,'checkpointInputs':20,'cumulativeInitialDispositions':40,'unprocessedInputs':366,'autonomousHeldFieldEnvelopes':744,'autonomousHeldIdentities':40,'acceptedFacts':0,'nextQueueOffset':40,'nextSavedRow':42,'nextInputKey':new['nextInputKey'],'sourceReceiptsByCheckpoint':[18,17]},'preservation':{'preEntryPaths':1055,'reviewedSourcePacketPaths':len(manifest['changedFiles']),'allNineOriginalRowsAndSupplements':True,'priorHandoffAndREADMEExactSuffix':True,'M1Records':437,'M1ArtifactPins':12,'originalPolicyResearchJayceeBindings':'unchanged and retained','originalFailedCandidateAndReview':'preserved; both findings independently fixed/rechecked'},'openItemRouting':{'authoritativePath':'docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md section9','supplementPath':'docs/evidence/sd2-autonomous/checkpoint-002/SESSION_WRAP.md','fieldHoldPaths':['docs/evidence/sd2-autonomous/checkpoint-001.json','docs/evidence/sd2-autonomous/checkpoint-002.json'],'owner':'Existing Codex source/identity owners; existing human acceptance gate retained','trigger':'Applicable authorized evidence arrival or SD2 consolidation after initial remaining queue coverage','nextAction':'Reconcile every field/identity without false exclusions; preserve every original later-stage/effect trigger'},'verification':'Required plan/type/fulltests PASS; exact standard build twice EPERM; full final candidate diff PASS. See validation.json/validation-remediation.json; source/runtime checks not redundantly rerun for documentation wrap. Final wrap plan consistency receipt: wrap-plan-check.json.','freshMainTarget':'unverified, retained local pin only; Codex establishes before later acceptance/release','sourcePolicyDeviation':'Unpinned guessed Stockman URL404; disclosed/excluded/no retry or search; containment independently reviewed','reviewerTasks':'complete; zero unresolved findings','newSourceOrWorkbookReadsDuringWrap':0,'workbookWrites':0,'runtimeConfigurationRemoteGitContactLoginMessagesActivation':0,'canonicalAcceptance':False,'fullSD2Complete':False,'SD3Started':False,'actualBackendModelAndEffort':'Not independently observable; no switch claimed','commands':commands}
(P/'wrap-verification.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({k:report[k] for k in ['outcome','reviewedCandidate','localReviewReceipt','coverage','preservation','fullSD2Complete','SD3Started']},indent=2))
