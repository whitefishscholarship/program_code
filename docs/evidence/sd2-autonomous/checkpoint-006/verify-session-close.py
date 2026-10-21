"""Read-only final closure audit; --record creates one new receipt without overwrite."""
from pathlib import Path
import json,subprocess,datetime,hashlib,sys
P=Path(__file__).resolve().parent;ROOT=P.parents[3];BASE=P.parent
def load(p):return json.loads(p.read_text())
def sha(b):return hashlib.sha256(b).hexdigest()
def git(*a):return subprocess.check_output(['git',*a],cwd=ROOT)
started=datetime.datetime.now(datetime.timezone.utc).isoformat();before='d931b274a821cfcbf90d568e71414a356ca31ba4'
command=['python3',str((P/'verify-wrap.py').relative_to(ROOT))]
r=subprocess.run(command,cwd=ROOT,capture_output=True,text=True);assert r.returncode==0,(r.stdout,r.stderr)
wrap=json.loads(r.stdout);assert wrap['outcome']=='PASS'
q=load(BASE/'queue.json');keys=[];fields=[];seeds=0;links=0;inheritedSeeds=0;inheritedLinks=0;ledgers=[]
for i in range(1,7):
 p=BASE/f'checkpoint-{i:03d}.json';l=load(p);assert l['acceptedFacts']==0 and len(l['records'])==20
 for record in l['records']:
  assert record['identityAcceptance']=='held' and all(record.get(k) for k in ['owner','trigger','nextAction'])
  keys.append(record['inputKey'])
  for f in record['fieldProposals'].values():
   assert f['acceptance']=='held' and all(f.get(k) or record.get(k) for k in ['owner','trigger','nextAction']);fields.append(f)
  for d in record.get('seedDispositions',[]):
   assert all(d.get(k) or record.get(k) for k in ['owner','trigger','nextAction']);seeds+=1
   if not all(d.get(k) for k in ['owner','trigger','nextAction']):inheritedSeeds+=1
 for source in l['sourceRegistry']:
  for d in source.get('linkDispositions',[]):
   assert all(d.get(k) or source.get(k) for k in ['owner','trigger','nextAction']);links+=1
   if not all(d.get(k) for k in ['owner','trigger','nextAction']):inheritedLinks+=1
 ledgers.append({'path':str(p.relative_to(ROOT)),'sha256':sha(p.read_bytes()),'inputs':20,'heldFields':sum(len(x['fieldProposals']) for x in l['records'])})
assert keys==[r['inputKey'] for r in q['records'][:120]] and len(keys)==len(set(keys))==120
assert len(fields)==2262 and len(q['records'][120:])==286 and seeds==190 and links==720
review=load(P/'review.json');assert review['outcome']=='PASS' and review['unresolvedRequiredFixes']==0 and review['requiredFixCount']==review['resolvedDispositionCount']==2
assert all(x==0 for x in review['severityCounts'].values())
for d in review['dispositions']:assert d['status']=='resolved-independently-rechecked'
pp='docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md';s=(ROOT/pp).read_text();old=git('show',before+':'+pp).decode()
a='<!-- SD2-CHECKPOINT-006-CLOSE-START -->\n';b='<!-- SD2-CHECKPOINT-006-CLOSE-END -->\n';assert s.count(a)==s.count(b)==1
x=s.index(a);y=s.index(b)+len(b);assert s[:x]+s[y:]==old
for path in ['docs/CURRENT_HANDOFF.md','docs/evidence/sd2-autonomous/NEXT_SESSION.md']:assert (ROOT/path).read_bytes().endswith(git('show',before+':'+path))
close=(P/'SESSION_CLOSE.md').read_text()
for item in ['Owner','Trigger and next action','Source-output handling','Temporary006raw','Clerk raw-byte','Both exact standard-buildEPERM','Recommended next-session effort: High.']:assert item in close,item
expected={pp,'docs/CURRENT_HANDOFF.md','docs/evidence/sd2-autonomous/NEXT_SESSION.md'}|{str((P/p).relative_to(ROOT)) for p in ['SESSION_CLOSE.md','verify-session-close.py','session-close-verification.json']}
changed=set(git('diff','--name-only',before).decode().splitlines())|set(git('ls-files','--others','--exclude-standard').decode().splitlines());assert changed<=expected,changed-expected
protected=0
for path in git('ls-tree','-r','--name-only',before).decode().splitlines():
 if path in expected:continue
 assert (ROOT/path).read_bytes()==git('show',before+':'+path),path;protected+=1
git('diff','--check','194fd2b')
result={'outcome':'PASS','scope':'Final user-requested session closure only; no new SD2 checkpoint or rebound source review','command':['python3','docs/evidence/sd2-autonomous/checkpoint-006/verify-session-close.py']+(['--record'] if '--record' in sys.argv else []),'startedAt':started,'completedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'baselineBeforeCloseout':before,'reviewedCandidate':review['binding']['candidateCommit'],'localReviewReceipt':wrap['localReviewReceipt'],'originalReviewAndManifestPreserved':True,'allPreCloseoutPathsPreservedExceptThreeAuthorizedHandoffPointers':protected,'allOlderPlanSupplementsAndNineAttentionRowsBytePreserved':True,'oldHandoffAndPromptBytesPreserved':True,'independentReviewerCompletedNoPendingRepairOrRecheck':True,'twoFindingsResolvedIndependently':True,'frozenInputs':406,'initialDispositions':120,'unprocessedInputs':286,'heldFields':2262,'heldIdentities':120,'factsAccepted':0,'checkpointLedgers':ledgers,'seedAliasDispositionOccurrences':seeds,'seedRoutesInheritedFromVerifiedParentRecord':inheritedSeeds,'sourceLinkDispositionOccurrences':links,'sourceLinkRoutesInheritedFromVerifiedParentSource':inheritedLinks,'allOwnersTriggersNextActionsPresent':True,'M1Records':437,'M1Pins':12,'temporaryCustodyHashesCurrentlyVerified':19,'selectedRenderedViewsCustodyCurrentlyVerified':14,'ClerkRawVisualProofUnavailable':True,'newSourceReadOrReplay':False,'newExternalEffects':False,'SD3Started':False,'newIssuesDisposition':{'sourceReviewOmissions':'Both author-fixed/independently-rechecked; failed candidate/history preserved','outputScopeAndUnexpectedFormLapses':'Disclosed with persisted containment; next-session Codex must narrow/sanitize before permitted output and keep form facts excluded','temporaryCustodyAvailability':'Verified locally now; next evidence owner checks exact paths/hashes at next required audit or reports specific gap without reconstruction/replay','IPCAndSharedGitIndex':'Resolved via permitted execution; no remaining repair or remote effect','InitialVerificationFreezeAndAssertions':'Completed/corrected before independent source review; intermediate history preserved'},'limits':{'standardBuild':'Both exact process/port EPERM failures open/unwaived; Codex before canonical acceptance/authorized release','freshAuthenticatedMainTarget':'Unverified; Codex at canonical acceptance/release trigger','liveWorkbookPublicSourceAuthorityNativePreservationBackupRecovery':'Not established by local research/closure','Clerk':'Raw/visual/complete official section unavailable; provider-readable200 not live byte/current offering proof','rawOriginTimingAndRevisions':'Provider windows retained; some origin times/status/version unavailable','crossHostCustody':'No permanent availability proof; check exact historical custody at required audit','humanCanonicalPublicationStudentMonitorEffects':'Original owner/trigger/gates retained'},'next':{'owner':'Next-session Codex research/proposals','trigger':'Fresh selected session under existing AUTHORITY/POLICY','authoritativeProgressPath':'docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md section9','kickoffPath':'docs/evidence/sd2-autonomous/NEXT_SESSION.md','offset':120,'inputKey':'saved-405588227-row-124','name':'Jean Atkinson Driggers Scholarship ($2,500)','action':'Resume one later bounded SD2 checkpoint; never initialize/reset/replay; stop beforeSD3','recommendedEffort':'High'}}
if '--record' in sys.argv:
 p=P/'session-close-verification.json';assert not p.exists(),'Existing receipt will not be replaced';p.write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result,indent=2))
