"""Read-only final session closure audit. No source acquisition or assembly."""
from pathlib import Path
import collections, datetime, hashlib, json, os, re, subprocess

P=Path(__file__).resolve().parent;ROOT=P.parents[3];B=P.parent
BASE='d7071809b4e1d22ed1ebd90f3d9a2d6d4930ed30'
load=lambda p:json.loads(p.read_text());sha=lambda b:hashlib.sha256(b).hexdigest()
g=lambda *a:subprocess.check_output(['git',*a],cwd=ROOT)
mutable={'docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md','docs/CURRENT_HANDOFF.md','docs/evidence/sd2-autonomous/NEXT_SESSION.md'}
extra={'docs/evidence/sd2-autonomous/checkpoint-010/'+x for x in ['SESSION_CLOSE.md','verify-session-close.py','session-close-verification.json']}
assert g('branch','--show-current').decode().strip()=='codex/plan-student-data-maintenance'
assert g('rev-parse','--show-object-format').decode().strip()=='sha1'
preserved=0
for item in g('ls-tree','-rz',BASE).split(b'\0'):
 if not item:continue
 head,name=item.split(b'\t',1);mode,kind,blob=head.split();path=name.decode()
 if path in mutable:continue
 f=ROOT/path;raw=os.fsencode(os.readlink(f)) if mode==b'120000' else f.read_bytes()
 assert kind==b'blob' and hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest()==blob.decode(),path
 preserved+=1
changed=set(g('diff','--name-only',BASE).decode().splitlines());untracked=set(g('ls-files','--others','--exclude-standard').decode().splitlines())
assert changed|untracked<=mutable|extra,changed|untracked
pp='docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md';cur=(ROOT/pp).read_text();old=g('show',BASE+':'+pp).decode()
a='<!-- SD2-CHECKPOINT-010-CLOSE-START -->\n';z='<!-- SD2-CHECKPOINT-010-CLOSE-END -->\n'
assert cur.count(a)==cur.count(z)==1
assert cur[:cur.index(a)]+cur[cur.index(z)+len(z):]==old
for path in mutable-{pp}:assert (ROOT/path).read_bytes().endswith(g('show',BASE+':'+path))
m=load(P/'final-manifest.json');review=load(P/'review.json');bind=review['binding'];receipt=load(P/'wrap-state.json')['reviewReceiptCommit']
assert review['outcome']=='PASS' and review['severityCounts']==dict(critical=0,high=0,medium=0,low=0)
assert review['unresolvedRequiredFixes']==0 and review['resolvedDispositionCount']==1
assert bind['candidateCommit']==m['candidateCommit'] and bind['manifestSha256']==sha((P/'final-manifest.json').read_bytes())
assert sha(g('diff','--binary',m['entryCommit'],m['candidateCommit']))==m['completeDiffSha256']==bind['completeDiffSha256']
assert g('rev-parse',receipt+'^').decode().strip()==m['candidateCommit']
assert set(g('diff-tree','--no-commit-id','--name-only','-r',receipt).decode().splitlines())=={'docs/evidence/sd2-autonomous/checkpoint-010/'+x for x in ['final-manifest.json','review.json']}
for f in m['changedFiles']:
 assert sha((ROOT/f['path']).read_bytes())==f['sha256'] and sha(g('show',m['candidateCommit']+':'+f['path']))==f['sha256']
ledgers=[load(B/f'checkpoint-{i:03d}.json') for i in range(1,11)];q=load(B/'queue.json')
records=[r for l in ledgers for r in l['records']]
assert [r['inputKey'] for r in records]==[r['inputKey'] for r in q['records'][:200]]
assert len({r['inputKey'] for r in records})==len(records)==200
fields=seeds=links=0
for l in ledgers:
 assert not l.get('acceptedFacts')
 for r in l['records']:
  assert r['identityAcceptance']=='held' and all(r.get(k) for k in ['owner','trigger','nextAction'])
  for f in r['fieldProposals'].values():
   fields+=1;assert f['acceptance']=='held' and all(f.get(k) or r.get(k) for k in ['owner','trigger','nextAction'])
  for d in r.get('seedDispositions',[]):
   seeds+=1;assert all(d.get(k) or (r.get(k) if l['checkpoint']<10 else None) for k in ['owner','trigger','nextAction'])
 for s in l['sourceRegistry']:
  for d in s.get('linkDispositions',[]):
   links+=1;assert all(d.get(k) or (s.get(k) if l['checkpoint']<10 else None) for k in ['owner','trigger','nextAction'])
assert (fields,seeds,links)==(3939,314,809)
assert ledgers[-1]['nextCheckpointInputOffset']==200 and ledgers[-1]['nextInputKey']==q['records'][200]['inputKey']=='saved-405588227-row-204'
custody=load(P/'prior-custody-audit.json');assert len(custody['pins'])==71
for pin in custody['pins']:
 f=Path(pin['path']);assert (sha(f.read_bytes()) if f.exists() else None)==pin['observedSha256']
 assert all(pin.get(k) for k in ['owner','trigger','nextAction'])
pins=load(ROOT/'docs/evidence/sd2-next-read-proposal/verification.json')['retainedM1Artifacts']
for pin in pins:assert sha(g('show','009fa57:'+pin['path']))==pin['sha256']
m1=json.loads(g('show','009fa57:docs/evidence/season-monitor-m1/inventory.json'));assert len(m1['records'])==len({r['id'] for r in m1['records']})==437
validation=load(P/'validation.json')
for r in validation['checks']:assert sha((ROOT/r['logPath']).read_bytes())==r['logSha256']
assert {f.stem:load(f)['exitCode'] for f in [P/(x+'.json') for x in ['plan','plan-retry','typecheck','tests','tests-retry','build','build-retry']]}=={'plan':1,'plan-retry':0,'typecheck':0,'tests':1,'tests-retry':0,'build':1,'build-retry':1}
for label in ['build','build-retry']:assert 'binding to a port' in (P/(label+'.log')).read_text() and 'Operation not permitted' in (P/(label+'.log')).read_text()
fix=load(P/'remediation.json');assert fix['originalReviewSha256']==sha((P/'review-round1.json').read_bytes()) and fix['requiredFixCount']==1
assert fix['dispositions'][0]['findingId']==review['dispositions'][0]['findingId']=='SD2-010-M1'
assert load(P/'wrap-verification.json')['outcome']=='PASS'
text=(P/'SESSION_CLOSE.md').read_text();assert all(x in text for x in ['206unprocessed','offset200/savedrow204','historical retention','stop before SD3','no pending reviewer','71temporarycustodypins'])
structural_date=re.compile(r'\b[A-Z][a-z]+\s+\d{1,2},\s+19\d{2}\b|\([^()\n]*\b\d{4}\s*[–-]\s*[^()\n]*\b\d{4}\)')
for f in [B/'checkpoint-010.json']+[x for x in P.rglob('*') if x.is_file()]:assert not structural_date.search(f.read_text()),str(f)
state=load(ROOT/'docs/BUILD_STATE.json');assert state['activeStageId'] is None and state['nextPermittedStageId'] is None
g('diff','--check',BASE);g('diff','--check',m['entryCommit']);g('diff','--check',m['entryCommit'],m['candidateCommit'])
print(json.dumps(dict(outcome='PASS',recordedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),scope='Author-verified final session closure; never rebound independent research review',preCloseHandoff=BASE,reviewedCandidate=m['candidateCommit'],localReviewReceipt=receipt,manifestSha256=bind['manifestSha256'],preservedPreClosePaths=preserved,reviewedCandidatePaths=len(m['changedFiles']),initialDispositions=200,unprocessedInputs=206,heldFields=fields,heldIdentities=200,acceptedFacts=0,seedAliasDispositions=seeds,sourceLinkDispositions=links,allOwnersTriggersNextActionsPresent=True,allNineAttentionRowsSupplementsAndPriorHistoryPreserved=True,allTenLedgersAndReviewBindingsExact=True,priorCustodyPinsVerified=71,M1Records=437,M1Pins=len(pins),independentReviewerStatus='completed; no pending repair/recheck/delegated work',resolvedReviewFindings=1,originalGuardHistoricalRetentionDisclosedAndRouted=True,originalVerificationAllowlistsAndBindingsPreserved=True,allSourceAndLaterGateRoutesRetained=True,noNewResearchResetReplayFactAcceptanceOrExternalEffects=True,SD3Started=False,buildGate=validation['buildGate'],freshMainTargetGate=validation['freshMainTargetGate'],next=load(P/'wrap-verification.json')['next'],recommendedNextSessionEffort='High'),indent=2))
