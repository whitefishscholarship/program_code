"""Separate read-only closeout/routing audit; does not rebind source review."""
from pathlib import Path
import subprocess,json,hashlib,datetime
P=Path(__file__).resolve().parent;ROOT=P.parents[3];B=P.parent
load=lambda p:json.loads(p.read_text());sha=lambda b:hashlib.sha256(b).hexdigest();g=lambda *a:subprocess.check_output(['git',*a],cwd=ROOT)
m=load(P/'final-manifest.json');review=load(P/'review.json');c=m['candidateCommit'];entry=m['entryCommit'];assert review['outcome']=='PASS' and not any(review['severityCounts'].values())
assert review['binding']['candidateCommit']==c and review['binding']['manifestSha256']==sha((P/'final-manifest.json').read_bytes())
receipt=load(P/'review-receipt-identity.json')['commit'];assert g('rev-parse',receipt+'^').decode().strip()==c
assert set(g('diff','--name-only',c,receipt).decode().splitlines())=={str((P/x).relative_to(ROOT)) for x in ['final-manifest.json','review.json']}
assert sha(g('diff','--binary',entry,c))==m['completeDiffSha256']
for f in m['changedFiles']:assert sha(g('show',c+':'+f['path']))==f['sha256'] and (ROOT/f['path']).read_bytes()==g('show',c+':'+f['path'])
assert load(P/'remediation.json')['requiredFixCount']==3 and len(review['dispositions'])==3
assert all(x['status']=='resolved-independently-rechecked' for x in review['dispositions'])
old=load(P/'review-round1.json');assert old['binding']['candidateCommit']=='4373ca3b96bd47b47d880b6e740130cba2445a97' and old['outcome']=='FAIL'
assert sha((P/'manifest-round1.json').read_bytes())==old['binding']['manifestSha256']
assert (P/'verification-round1.json').read_bytes()==g('show','4373ca3:docs/evidence/sd2-autonomous/checkpoint-007/verification.json')
pp='docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md';s=(ROOT/pp).read_text();a='<!-- SD2-CHECKPOINT-007-START -->\n';b='<!-- SD2-CHECKPOINT-007-END -->\n';assert s.count(a)==s.count(b)==1;x=s.index(a);y=s.index(b)+len(b);assert s[:x]+s[y:]==g('show',entry+':'+pp).decode()
for p in ['docs/CURRENT_HANDOFF.md','docs/evidence/sd2-autonomous/NEXT_SESSION.md']:assert (ROOT/p).read_bytes().endswith(g('show',entry+':'+p))
for p in [P/'SESSION_WRAP.md',B/'NEXT_SESSION.md']:
 s=p.read_text()
 for word in [c,receipt,'offset140','2,646','266','stopbeforeSD3']:assert word in s,(p,word)
 for word in ['owner','trigger','custody','WET','Clerk','437M1']:assert word.lower() in s.lower(),(p,word)
q=load(B/'queue.json');keys=[];fields=seeds=links=0;ledgerpins=[]
for i in range(1,8):
 p=B/f'checkpoint-{i:03d}.json';l=load(p);assert l['acceptedFacts']==0
 ledgerpins.append({'path':str(p.relative_to(ROOT)),'sha256':sha(p.read_bytes())})
 for r in l['records']:
  keys.append(r['inputKey']);assert r['identityAcceptance']=='held' and all(r.get(k) for k in ['owner','trigger','nextAction'])
  for f in r['fieldProposals'].values():assert f['acceptance']=='held' and all(f.get(k) or r.get(k) for k in ['owner','trigger','nextAction']);fields+=1
  for d in r.get('seedDispositions',[]):assert all(d.get(k) or r.get(k) for k in ['owner','trigger','nextAction']);seeds+=1
 for s in l['sourceRegistry']:
  for d in s.get('linkDispositions',[]):assert all(d.get(k) or s.get(k) for k in ['owner','trigger','nextAction']);links+=1
assert keys==[r['inputKey'] for r in q['records'][:140]] and len(keys)==len(set(keys))==140
assert fields==2646 and seeds==235 and links==744 and len(q['records'][140:])==266
run=subprocess.run(['python3',str(P/'verify.py')],cwd=ROOT,capture_output=True,text=True);assert run.returncode==0,run.stderr;audit=json.loads(run.stdout);observed=load(P/'verification.json');observed.pop('recordedAt');assert audit==observed
plan=load(P/'wrap-plan.json');assert plan['exitCode']==0 and sha((ROOT/plan['logPath']).read_bytes())==plan['logSha256']
allowed={pp,'docs/CURRENT_HANDOFF.md','docs/evidence/sd2-autonomous/NEXT_SESSION.md'}|{str((P/f).relative_to(ROOT)) for f in ['SESSION_WRAP.md','verify-wrap.py','wrap-verification.json','wrap-plan.json','wrap-plan.log','review-receipt-identity.json']}
changed=set(g('diff','--name-only',receipt).decode().splitlines())|set(g('ls-files','--others','--exclude-standard').decode().splitlines());assert changed<=allowed,changed-allowed
g('diff','--check',entry)
result={'outcome':'PASS','recordedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'scope':'Separate author-verified final handoff and routing audit, not rebound independent source review','reviewedCandidate':c,'localReviewReceipt':receipt,'manifestSha256':sha((P/'final-manifest.json').read_bytes()),'candidatePathsPreserved':len(m['changedFiles']),'allOlderPlanSupplementsNineAttentionRowsAndOldHandoffPromptBytesPreserved':True,'initialDispositions':140,'unprocessedInputs':266,'heldFields':2646,'heldIdentities':140,'factsAccepted':0,'seedAliasDispositionOccurrences':235,'sourceLinkDispositionOccurrences':744,'allOwnersTriggersNextActionsPresent':True,'noPendingReviewerRepair':True,'resolvedReviewFindings':3,'originalFailedReviewPreserved':True,'ledgers':ledgerpins,'sourceAudit':audit,'M1Records':437,'M1Pins':12,'temporaryPriorCustodyPinsVerified':41,'safePageViewsVerified':14,'newSourceReadsDuringRemediationOrHandoff':False,'standardBuildGate':'Both exact process/portEPERM failures open/unwaived; Codex before canonical acceptance/authorized release','freshMainTargetGate':'Unverified; Codex before canonical acceptance/authorized release','WETRawVisualProofUnavailable':True,'ClerkPriorRawVisualGapRetained':True,'DavisRecoveredOriginalCaptureNoRawEnvelopeHash':True,'nativeInterimFinalBindingExplicit':True,'sourceOutputLapsesAndFutureSanitizationRouted':True,'allLaterPreservationAcceptanceStudentMonitorEffectGatesRetained':True,'newExternalEffects':False,'SD3Started':False,'next':{'owner':'Next-session Codex research/proposals','trigger':'Next selected session under existing AUTHORITY/POLICY','authoritativeProgressPath':'docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md section9','kickoffPath':'docs/evidence/sd2-autonomous/NEXT_SESSION.md','offset':140,'inputKey':'saved-405588227-row-144','name':'P.E.O. Chapter D Scholarship (1) $1,400','action':'Resume one bounded SD2 checkpoint; never initialize/reset/replay; stopbeforeSD3'}}
print(json.dumps(result,indent=2))
