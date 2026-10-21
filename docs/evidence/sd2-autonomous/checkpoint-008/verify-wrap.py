"""Read-only final route/closure audit; never rebinds independent source review."""
from pathlib import Path
import json,subprocess,hashlib,datetime
P=Path(__file__).resolve().parent;B=P.parent;ROOT=P.parents[3]
load=lambda p:json.loads(p.read_text());sha=lambda b:hashlib.sha256(b).hexdigest();g=lambda *a:subprocess.check_output(['git',*a],cwd=ROOT)
m=load(P/'final-manifest.json');r=load(P/'review.json');c=m['candidateCommit'];entry=m['entryCommit'];receipt=load(P/'review-receipt-identity.json')['commit']
assert r['outcome']=='PASS' and not any(r['severityCounts'].values()) and r['binding']['candidateCommit']==c
assert sha((P/'final-manifest.json').read_bytes())==r['binding']['manifestSha256']
assert sha(g('diff','--binary',entry,c))==m['completeDiffSha256']
assert g('rev-parse',receipt+'^').decode().strip()==c
assert set(g('diff','--name-only',c,receipt).decode().splitlines())=={str((P/x).relative_to(ROOT)) for x in ['final-manifest.json','review.json']}
for f in m['changedFiles']:assert sha(g('show',c+':'+f['path']))==f['sha256'] and (ROOT/f['path']).read_bytes()==g('show',c+':'+f['path'])
assert len(m['changedFiles'])==59 and len(r['dispositions'])==r['requiredFixCount']==2 and not r['unresolvedRequiredFixes']
assert all(x['status']=='resolved-independently-rechecked' for x in r['dispositions'])
old=load(P/'review-round1.json');assert old['binding']['candidateCommit']=='6be403829cbcf68bb075b6bfaee239c921b351b4' and old['outcome']=='FAIL'
assert sha((P/'review-round1.json').read_bytes())==r['originalReview']['reviewSha256']
assert sha((P/'manifest-round1.json').read_bytes())==old['binding']['manifestSha256']
pp='docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md';s=(ROOT/pp).read_text();a='<!-- SD2-CHECKPOINT-008-START -->\n';b='<!-- SD2-CHECKPOINT-008-END -->\n';assert s.count(a)==s.count(b)==1;x=s.index(a);y=s.index(b)+len(b);assert s[:x]+s[y:]==g('show',entry+':'+pp).decode()
for path in ['docs/CURRENT_HANDOFF.md','docs/evidence/sd2-autonomous/NEXT_SESSION.md']:assert (ROOT/path).read_bytes().endswith(g('show',entry+':'+path))
for p in [P/'SESSION_WRAP.md',B/'NEXT_SESSION.md']:
 t=p.read_text()
 for term in [c,receipt,'offset160','3,033','246','stopbeforeSD3']:assert term in t,(p,term)
 for term in ['owner','trigger','custody','WET','Clerk','437M1','rejected']:assert term.lower() in t.lower(),(p,term)
q=load(B/'queue.json');keys=[];fields=seeds=links=0;ledgerpins=[]
for i in range(1,9):
 p=B/f'checkpoint-{i:03d}.json';l=load(p);assert l['acceptedFacts']==0
 ledgerpins.append({'path':str(p.relative_to(ROOT)),'sha256':sha(p.read_bytes())})
 for row in l['records']:
  keys.append(row['inputKey']);assert row['identityAcceptance']=='held' and all(row.get(k) for k in ['owner','trigger','nextAction'])
  for f in row['fieldProposals'].values():assert f['acceptance']=='held' and all(f.get(k) or row.get(k) for k in ['owner','trigger','nextAction']);fields+=1
  for d in row.get('seedDispositions',[]):assert all(d.get(k) or row.get(k) for k in ['owner','trigger','nextAction']);seeds+=1
 for source in l['sourceRegistry']:
  for d in source.get('linkDispositions',[]):assert all(d.get(k) or source.get(k) for k in ['owner','trigger','nextAction']);links+=1
assert keys==[r['inputKey'] for r in q['records'][:160]] and len(keys)==len(set(keys))==160
assert fields==3033 and seeds==272 and links==766 and len(q['records'][160:])==246
run=subprocess.run(['python3',str(P/'verify.py')],cwd=ROOT,capture_output=True,text=True);assert run.returncode==0,run.stderr;audit=json.loads(run.stdout);recorded=load(P/'verification.json');recorded.pop('recordedAt');assert audit==recorded
plan=load(P/'wrap-plan.json');assert plan['exitCode']==0 and sha((ROOT/plan['logPath']).read_bytes())==plan['logSha256']
allowed={pp,'docs/CURRENT_HANDOFF.md','docs/evidence/sd2-autonomous/NEXT_SESSION.md'}|{str((P/x).relative_to(ROOT)) for x in ['SESSION_WRAP.md','verify-wrap.py','wrap-verification.json','wrap-plan.json','wrap-plan.log','review-receipt-identity.json']}
changed=set(g('diff','--name-only',receipt).decode().splitlines())|set(g('ls-files','--others','--exclude-standard').decode().splitlines());assert changed<=allowed,changed-allowed
g('diff','--check',entry)
result={'outcome':'PASS','recordedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'scope':'Separate author-verified final handoff and routing audit, not rebound independent source review','reviewedCandidate':c,'localReviewReceipt':receipt,'manifestSha256':sha((P/'final-manifest.json').read_bytes()),'candidatePathsPreserved':59,'allOlderPlanSupplementsNineAttentionRowsAndHandoffPromptBytesPreserved':True,'initialDispositions':160,'unprocessedInputs':246,'heldFields':3033,'heldIdentities':160,'factsAccepted':0,'seedAliasDispositionOccurrences':272,'sourceLinkDispositionOccurrences':766,'allOwnersTriggersNextActionsPresent':True,'noPendingReviewerRepair':True,'resolvedReviewFindings':2,'originalFailedReviewPreserved':True,'ledgers':ledgerpins,'sourceAudit':audit,'M1Records':437,'M1Pins':12,'temporaryPriorCustodyPinsVerified':68,'newPEORawAndSafeViewPins':3,'rawBatchRejectionAndSafeHeldAlternativesRouted':True,'sourceOutputLapsesAndFutureSanitizationRouted':True,'allLaterPreservationAcceptanceStudentMonitorEffectGatesRetained':True,'newSourceReadsDuringRemediationHandoff':False,'newExternalEffects':False,'SD3Started':False,'standardBuildGate':{'owner':'Codex validation/governance/delivery','trigger':'Before canonical acceptance or authorized release','nextAction':'Require exact standard build pass in a permitted supporting environment; both current process/portEPERM failures remain unwaived.'},'freshMainTargetGate':{'owner':'Codex validation/governance/delivery','trigger':'Before canonical acceptance or authorized release','nextAction':'Verify fresh authenticated owner-authorized main/target; saved baseline not current proof.'},'next':{'owner':'Next-session Codex research/proposals','trigger':'Next selected session under existing AUTHORITY/POLICY','authoritativeProgressPath':'docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md section9','kickoffPath':'docs/evidence/sd2-autonomous/NEXT_SESSION.md','offset':160,'inputKey':'saved-405588227-row-164','name':'Elevated Access Advanced Rating Scholarship','action':'Resume one bounded SD2 checkpoint; never initialize/reset/replay; stopbeforeSD3.'}}
print(json.dumps(result,indent=2))
