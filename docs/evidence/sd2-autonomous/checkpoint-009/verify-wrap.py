"""Author-only no-loss closure audit; never rebinds independent source review."""
from pathlib import Path
import json, hashlib, subprocess, datetime
P=Path(__file__).resolve().parent; B=P.parent; ROOT=P.parents[3]
load=lambda p:json.loads(p.read_text());sha=lambda b:hashlib.sha256(b).hexdigest()
g=lambda *a:subprocess.check_output(['git',*a],cwd=ROOT)
m=load(P/'final-manifest.json');r=load(P/'review.json');c=m['candidateCommit'];entry=m['entryCommit'];receipt=load(P/'review-receipt-identity.json')['commit']
assert c=='f4413e986bec7eef9a307ff8b5b97e81fb79ce3c'
assert r['outcome']=='PASS' and not any(r['severityCounts'].values()) and r['binding']['candidateCommit']==c
assert sha((P/'final-manifest.json').read_bytes())==r['binding']['manifestSha256']
assert sha(g('diff','--binary',entry,c))==m['completeDiffSha256'] and g('rev-parse',c+'^{tree}').decode().strip()==m['candidateTree']
assert g('rev-parse',receipt+'^').decode().strip()==c
assert set(g('diff','--name-only',c,receipt).decode().splitlines())=={str((P/x).relative_to(ROOT)) for x in ['final-manifest.json','review.json']}
for f in m['changedFiles']:
 assert sha(g('show',c+':'+f['path']))==f['sha256'] and (ROOT/f['path']).read_bytes()==g('show',c+':'+f['path'])
assert len(m['changedFiles'])==44 and r['requiredFixCount']==r['resolvedDispositionCount']==len(r['dispositions'])==2 and not r['unresolvedRequiredFixes']
assert {d['findingId'] for d in r['dispositions']}=={'SD2-009-M1','SD2-009-L1'}
assert all(d['status']=='resolved-independently-rechecked' for d in r['dispositions'])
for round in [1,2]:
 old=load(P/f'review-round{round}.json');man=load(P/f'manifest-round{round}.json')
 assert old['outcome']=='FAIL' and old['binding']['manifestSha256']==sha((P/f'manifest-round{round}.json').read_bytes())
 assert sha(g('diff','--binary',entry,man['candidateCommit']))==man['completeDiffSha256']
 assert (P/f'verification-round{round}.json').read_bytes()==g('show',man['candidateCommit']+':'+str((P/'verification.json').relative_to(ROOT)))
 preservation=r['priorReviewPreservation'][round-1];assert preservation['candidateCommit']==man['candidateCommit'] and preservation['reviewSha256']==sha((P/f'review-round{round}.json').read_bytes())
pp='docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md';s=(ROOT/pp).read_text();a='<!-- SD2-CHECKPOINT-009-START -->\n';b='<!-- SD2-CHECKPOINT-009-END -->\n'
assert s.count(a)==s.count(b)==1;x=s.index(a);y=s.index(b)+len(b);assert s[:x]+s[y:]==g('show',entry+':'+pp).decode()
for path in ['docs/CURRENT_HANDOFF.md','docs/evidence/sd2-autonomous/NEXT_SESSION.md']:assert (ROOT/path).read_bytes().endswith(g('show',entry+':'+path))
for p in [P/'SESSION_WRAP.md',B/'NEXT_SESSION.md']:
 t=p.read_text()
 for term in [c,receipt,'offset180','3,495','226','stopbeforeSD3','owner','trigger','custody','437M1','redacted','WET','Clerk','Davis']:assert term.lower() in t.lower(),(p,term)
keys=[];fields=seeds=links=0;ledgerpins=[]
for i in range(1,10):
 p=B/f'checkpoint-{i:03d}.json';l=load(p);assert l['acceptedFacts']==0;ledgerpins.append(dict(path=str(p.relative_to(ROOT)),sha256=sha(p.read_bytes())))
 for row in l['records']:
  keys.append(row['inputKey']);assert row['identityAcceptance']=='held' and all(row.get(k) for k in ['owner','trigger','nextAction'])
  for field in row['fieldProposals'].values():
   fields+=1;assert field['acceptance']=='held' and all(field.get(k) or row.get(k) for k in ['owner','trigger','nextAction'])
  for d in row.get('seedDispositions',[]):seeds+=1;assert all(d.get(k) or row.get(k) for k in ['owner','trigger','nextAction'])
 for source in l['sourceRegistry']:
  for d in source.get('linkDispositions',[]):links+=1;assert all(d.get(k) or source.get(k) for k in ['owner','trigger','nextAction'])
q=load(B/'queue.json');assert keys==[r['inputKey'] for r in q['records'][:180]] and len(keys)==len(set(keys))==180
assert fields==3495 and seeds==294 and links==788 and len(q['records'][180:])==226
run=subprocess.run(['python3',str(P/'verify.py')],cwd=ROOT,capture_output=True,text=True);assert run.returncode==0,run.stderr;audit=json.loads(run.stdout);old=load(P/'verification.json');old.pop('recordedAt');assert audit==old
plan=load(P/'wrap-plan.json');assert plan['exitCode']==0 and sha((ROOT/plan['logPath']).read_bytes())==plan['logSha256']
allowed={pp,'docs/CURRENT_HANDOFF.md','docs/evidence/sd2-autonomous/NEXT_SESSION.md'}|{str((P/x).relative_to(ROOT)) for x in ['SESSION_WRAP.md','verify-wrap.py','wrap-verification.json','wrap-plan.json','wrap-plan.log','review-receipt-identity.json']}
changed=set(g('diff','--name-only',receipt).decode().splitlines())|set(g('ls-files','--others','--exclude-standard').decode().splitlines());assert changed<=allowed,changed-allowed
g('diff','--check',entry)
print(json.dumps(dict(outcome='PASS',recordedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),scope='Separate author-verified no-loss closure; not rebound independent source review',reviewedCandidate=c,localReviewReceipt=receipt,manifestSha256=sha((P/'final-manifest.json').read_bytes()),candidatePathsPreserved=44,originalProgressSupplementsNineAttentionRowsAndHandoffPromptBytesPreserved=True,initialDispositions=180,unprocessedInputs=226,heldFields=fields,heldIdentities=180,factsAccepted=0,seedAliasDispositionOccurrences=seeds,sourceLinkDispositionOccurrences=links,allOwnersTriggersNextActionsPresent=True,noPendingReviewerRepair=True,resolvedReviewFindings=2,bothFailedReviewBindingsPreserved=True,ledgers=ledgerpins,sourceAudit=audit,M1Records=437,M1Pins=12,priorTemporaryCustodyPinsVerified=71,sourceOutputAndRedactedLocatorAndOriginalRawBatchLimitsRouted=True,allLaterPreservationAcceptanceStudentMonitorEffectGatesRetained=True,newSourceReadsDuringRemediationHandoff=False,newExternalEffects=False,SD3Started=False,buildGate=load(P/'validation.json')['buildGate'],freshMainTargetGate=load(P/'validation.json')['freshMainTargetGate'],next=dict(owner='Next-session Codex source/identity reconciliation',trigger='Next selected session under existing AUTHORITY/POLICY',authoritativeProgressPath='docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md section9',kickoffPath='docs/evidence/sd2-autonomous/NEXT_SESSION.md',offset=180,inputKey='saved-405588227-row-184',name='PSA Airlines Flight Scholarship (NGPA)',action='Resume one bounded SD2 checkpoint; never initialize/reset/replay; stopbeforeSD3')),indent=2))
