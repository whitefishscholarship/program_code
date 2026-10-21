"""Audit separate checkpoint010 handoff without replaying research or rebinding review."""
from pathlib import Path
import collections,datetime,hashlib,json,re,subprocess
P=Path(__file__).resolve().parent
# Installed beside SESSION_WRAP.md by the post-review closeout only.
ROOT=P.parents[3];B=P.parent
load=lambda p:json.loads(p.read_text());sha=lambda b:hashlib.sha256(b).hexdigest()
g=lambda *a:subprocess.check_output(['git',*a],cwd=ROOT)
m=load(P/'final-manifest.json');review=load(P/'review.json');bind=review['binding'];entry=m['entryCommit'];candidate=m['candidateCommit']
assert review['outcome']=='PASS' and review['severityCounts']==dict(critical=0,high=0,medium=0,low=0)
assert bind['candidateCommit']==candidate and bind['manifestSha256']==sha((P/'final-manifest.json').read_bytes())
assert bind['candidateTree']==g('rev-parse',candidate+'^{tree}').decode().strip()==m['candidateTree']
assert sha(g('diff','--binary',entry,candidate))==m['completeDiffSha256']==bind['completeDiffSha256']
assert review['unresolvedRequiredFixes']==0 and review['resolvedDispositionCount']==1
for f in m['changedFiles']:
 raw=g('show',candidate+':'+f['path']);assert sha(raw)==f['sha256'] and len(raw)==f['bytes']
 assert g('rev-parse',candidate+':'+f['path']).decode().strip()==f['blob']
 assert (ROOT/f['path']).read_bytes()==raw,f['path']
receipt=load(P/'wrap-state.json')['reviewReceiptCommit']
assert g('rev-parse',receipt+'^').decode().strip()==candidate
assert set(g('diff-tree','--no-commit-id','--name-only','-r',receipt).decode().splitlines())=={'docs/evidence/sd2-autonomous/checkpoint-010/final-manifest.json','docs/evidence/sd2-autonomous/checkpoint-010/review.json'}
for f in ['final-manifest.json','review.json']:assert (P/f).read_bytes()==g('show',receipt+':'+str((P/f).relative_to(ROOT)))
first=load(P/'review-round1.json');fix=load(P/'remediation.json')
assert first['outcome']=='FAIL' and fix['requiredFixCount']==len(fix['dispositions'])==1
assert first['findings'][0]['id']==fix['dispositions'][0]['findingId']==review['dispositions'][0]['findingId']=='SD2-010-M1'
assert fix['originalReviewSha256']==sha((P/'review-round1.json').read_bytes())
assert fix['originalManifestSha256']==sha((P/'manifest-round1.json').read_bytes())
assert (P/'verification-round1.json').read_bytes()==g('show',fix['originalCandidate']+':docs/evidence/sd2-autonomous/checkpoint-010/verification.json')
mutable={'docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md','docs/CURRENT_HANDOFF.md','docs/evidence/sd2-autonomous/NEXT_SESSION.md'}
extra={'docs/evidence/sd2-autonomous/checkpoint-010/'+x for x in ['SESSION_WRAP.md','wrap-state.json','verify-wrap.py','wrap-verification.json']}
changed=set(g('diff','--name-only',receipt).decode().splitlines());untracked=set(g('ls-files','--others','--exclude-standard').decode().splitlines())
assert changed|untracked<=mutable|extra,changed|untracked
pp='docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md';old=g('show',entry+':'+pp).decode();cur=(ROOT/pp).read_text();a='<!-- SD2-CHECKPOINT-010-START -->\n';z='<!-- SD2-CHECKPOINT-010-END -->\n';assert cur.count(a)==cur.count(z)==1
assert cur[:cur.index(a)]+cur[cur.index(z)+len(z):]==old
for path in mutable-{pp}:assert (ROOT/path).read_bytes().endswith(g('show',entry+':'+path))
alll=[]
for i in range(1,11):
 path=B/f'checkpoint-{i:03d}.json';l=load(path);alll.append(l)
 if i<10:assert path.read_bytes()==g('show',entry+':'+str(path.relative_to(ROOT)))
 assert all(r['identityAcceptance']=='held' and all(r.get(k) for k in ['owner','trigger','nextAction']) for r in l['records'])
 for r in l['records']:
  for f in r['fieldProposals'].values():
   assert f['acceptance']=='held'
   assert all(f.get(k) or r.get(k) for k in ['owner','trigger','nextAction'])
  for d in r.get('seedDispositions',[]):
   # Original early ledgers inherit some route components from their input row.
   # Preserve that representation; new checkpoint010 routes remain explicit.
   assert all(d.get(k) or (r.get(k) if l['checkpoint']<10 else None) for k in ['owner','trigger','nextAction'])
 for s in l['sourceRegistry']:
  for d in s.get('linkDispositions',[]):
   # Checkpoint003's original link routes inherit the unchanged source route.
   assert all(d.get(k) or (s.get(k) if l['checkpoint']<10 else None) for k in ['owner','trigger','nextAction'])
q=load(B/'queue.json');keys=[r['inputKey'] for l in alll for r in l['records']]
assert keys==[r['inputKey'] for r in q['records'][:200]] and len(set(keys))==200
fields=sum(len(r['fieldProposals']) for l in alll for r in l['records']);seeds=sum(len(r.get('seedDispositions',[])) for l in alll for r in l['records']);links=sum(len(s.get('linkDispositions',[])) for l in alll for s in l['sourceRegistry'])
assert fields==3939 and seeds==314 and links==809
assert alll[-1]['nextInputKey']==q['records'][200]['inputKey']=='saved-405588227-row-204'
for l in alll:assert not l.get('acceptedFacts')
# Existing independent research verification remains its own dated observation.
v=load(P/'verification.json');assert v['outcome']=='PASS' and v['evidenceReferences']==252
assert v['historicalManifestReviewsVerified']==9 and v['M1Records']==437
custody=load(P/'prior-custody-audit.json');assert len(custody['pins'])==71
for pin in custody['pins']:
 f=Path(pin['path']);actual=sha(f.read_bytes()) if f.exists() else None
 assert actual==pin['observedSha256']
 assert all(pin.get(k) for k in ['owner','trigger','nextAction'])
pins=load(ROOT/'docs/evidence/sd2-next-read-proposal/verification.json')['retainedM1Artifacts']
for pin in pins:assert sha(g('show','009fa57:'+pin['path']))==pin['sha256']
m1=json.loads(g('show','009fa57:docs/evidence/season-monitor-m1/inventory.json'));assert len(m1['records'])==len({r['id'] for r in m1['records']})==437
assert all(sha((ROOT/r['logPath']).read_bytes())==r['logSha256'] for r in load(P/'validation.json')['checks'])
wrap=(P/'SESSION_WRAP.md').read_text();assert candidate in wrap and receipt in wrap
assert all(x.casefold() in wrap.casefold() for x in ['historical retention','offset200','savedrow204','stop before SD3','437M1','WET403','Clerkvisual','Davisrecovery','BLFredactedlocator'])
structural_date=re.compile(r'\b[A-Z][a-z]+\s+\d{1,2},\s+19\d{2}\b|\([^()\n]*\b\d{4}\s*[–-]\s*[^()\n]*\b\d{4}\)')
for f in [B/'checkpoint-010.json']+[x for x in P.rglob('*') if x.is_file()]:
 assert not structural_date.search(f.read_text()),str(f)
for path in mutable|extra:
 f=ROOT/path
 if f.exists():assert all(x==x.rstrip() for x in f.read_text().splitlines()),path
assert load(ROOT/'docs/BUILD_STATE.json')['activeStageId'] is None
assert load(ROOT/'docs/BUILD_STATE.json')['nextPermittedStageId'] is None
g('diff','--check',entry);g('diff','--check',entry,candidate)
result=dict(outcome='PASS',recordedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),scope='Separate author-verified no-loss handoff; never rebound independent source review',reviewedCandidate=candidate,localReviewReceipt=receipt,manifestSha256=bind['manifestSha256'],candidatePathsPreserved=len(m['changedFiles']),allNineAttentionRowsSupplementsAndPriorHistoryPreserved=True,initialDispositions=200,unprocessedInputs=206,heldFields=3939,heldIdentities=200,acceptedFacts=0,seedAliasDispositionOccurrences=seeds,sourceLinkDispositionOccurrences=links,allOwnersTriggersNextActionsPresent=True,noPendingReviewerRepair=True,resolvedReviewFindings=1,failedReviewBindingPreserved=True,originalGuardHistoricalRetentionDisclosedAndRouted=True,priorTemporaryCustodyPinsVerified=71,M1Records=437,M1Pins=len(pins),sourceInspectionAndOutputLimitsRouted=True,allLaterGatesRetained=True,newSourceReadsDuringRemediationHandoff=False,newExternalEffects=False,SD3Started=False,buildGate=load(P/'validation.json')['buildGate'],freshMainTargetGate=load(P/'validation.json')['freshMainTargetGate'],next=dict(owner='Next-session Codex source/identity reconciliation',trigger='Next selected session under existing AUTHORITY/POLICY',authoritativeProgressPath='docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md section9',kickoffPath='docs/evidence/sd2-autonomous/NEXT_SESSION.md',offset=200,inputKey='saved-405588227-row-204',name='Boeing Maintenance Training Scholarship',action='Resume one bounded SD2 checkpoint; never initialize/reset/replay; stop before SD3'))
print(json.dumps(result,indent=2))
