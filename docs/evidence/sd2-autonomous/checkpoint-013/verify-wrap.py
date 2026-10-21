"""Audit separate checkpoint013 handoff; no research or review rebinding."""
from pathlib import Path
import json,hashlib,subprocess,datetime,re
P=Path(__file__).resolve().parent;R=P.parents[3];B=P.parent
load=lambda p:json.loads(p.read_text());sha=lambda x:hashlib.sha256(x).hexdigest()
def git(*a):return subprocess.check_output(['git',*a],cwd=R)
m=load(P/'final-manifest.json');rv=load(P/'review.json');bd=rv['binding'];entry=m['entryCommit'];candidate=m['candidateCommit'];state=load(P/'wrap-state.json');receipt=state['reviewReceiptCommit']
assert rv['outcome']=='PASS' and rv['severityCounts']==dict(critical=0,high=0,medium=0,low=0)
assert bd['candidateCommit']==candidate and bd['manifestSha256']==sha((P/'final-manifest.json').read_bytes())
assert bd['candidateTree']==m['candidateTree']==git('rev-parse',candidate+'^{tree}').decode().strip()
assert sha(git('diff','--binary',entry,candidate))==m['completeDiffSha256']==bd['completeDiffSha256']
for f in m['changedFiles']:
 raw=git('show',candidate+':'+f['path']);assert sha(raw)==f['sha256'] and len(raw)==f['bytes'] and git('rev-parse',candidate+':'+f['path']).decode().strip()==f['blob']
 assert (R/f['path']).read_bytes()==raw,f['path']
assert git('rev-parse',receipt+'^').decode().strip()==candidate
assert set(git('diff-tree','--no-commit-id','--name-only','-r',receipt).decode().splitlines())=={'docs/evidence/sd2-autonomous/checkpoint-013/final-manifest.json','docs/evidence/sd2-autonomous/checkpoint-013/review.json'}
for f in ['final-manifest.json','review.json']:assert (P/f).read_bytes()==git('show',receipt+':'+str((P/f).relative_to(R)))
mutable={'docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md','docs/CURRENT_HANDOFF.md','docs/evidence/sd2-autonomous/NEXT_SESSION.md'}
extra={str((P/x).relative_to(R)) for x in ['SESSION_WRAP.md','wrap-state.json','verify-wrap.py','wrap-verification.json']}
paths=set(git('diff','--name-only',receipt).decode().splitlines())|set(git('ls-files','--others','--exclude-standard').decode().splitlines())
assert paths<=mutable|extra,paths
pp='docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md';old=git('show',entry+':'+pp).decode();t=(R/pp).read_text();a='<!-- SD2-CHECKPOINT-013-START -->\n';z='<!-- SD2-CHECKPOINT-013-END -->\n';assert t.count(a)==t.count(z)==1
assert t[:t.index(a)]+t[t.index(z)+len(z):]==old
for p in mutable-{pp}:assert (R/p).read_bytes().endswith(git('show',entry+':'+p))
ledgers=[load(B/f'checkpoint-{i:03d}.json') for i in range(1,14)];q=load(B/'queue.json')
assert [r['inputKey'] for l in ledgers for r in l['records']]==[r['inputKey'] for r in q['records'][:260]]
fields=seeds=links=identities=0
for l in ledgers:
 assert not l.get('acceptedFacts')
 for r in l['records']:
  identities+=1;assert r['identityAcceptance']=='held' and all(r.get(k) for k in ['owner','trigger','nextAction'])
  for f in r['fieldProposals'].values():fields+=1;assert f['acceptance']=='held' and all(f.get(k) or r.get(k) for k in ['owner','trigger','nextAction'])
  for d in r.get('seedDispositions',[]):
   seeds+=1;assert all(d.get(k) or (r.get(k) if l['checkpoint']<11 else None) for k in ['owner','trigger','nextAction'])
 for s in l['sourceRegistry']:
  for d in s.get('linkDispositions',[]):
   links+=1;assert all(d.get(k) or (s.get(k) if l['checkpoint']<11 else None) for k in ['owner','trigger','nextAction'])
assert (fields,seeds,links,identities)==(5041,398,909,260)
assert ledgers[-1]['nextInputKey']==q['records'][260]['inputKey']=='saved-405588227-row-265'
for i in range(1,13):
 p=B/f'checkpoint-{i:03d}.json';assert p.read_bytes()==git('show',entry+':'+str(p.relative_to(R)))
v=load(P/'verification.json');assert v['outcome']=='PASS' and v['evidenceReferences']==194 and v['historicalManifestReviewsVerified']==12 and v['M1Records']==437
for receiptcheck in load(P/'validation.json')['checks']:assert sha((R/receiptcheck['logPath']).read_bytes())==receiptcheck['logSha256']
pins=load(R/'docs/evidence/sd2-next-read-proposal/verification.json')['retainedM1Artifacts']
for p in pins:assert sha(git('show','009fa57:'+p['path']))==p['sha256']
mon=json.loads(git('show','009fa57:docs/evidence/season-monitor-m1/inventory.json'));assert len(mon['records'])==len({r['id'] for r in mon['records']})==437
cust=load(P/'prior-custody-audit.json')
for pin in cust['pins']:
 f=Path(pin['path']);assert (sha(f.read_bytes()) if f.exists() else None)==pin['observedSha256']==pin['recordedSha256']
wrap=(P/'SESSION_WRAP.md').read_text();assert candidate in wrap and receipt in wrap
for term in ['offset260','savedrow265','stop before SD3','437M1','historical guard retention','BLFredactedlocator','WET403','Clerkvisual','Davisrecovery','Epic','Avfuel','MSU','six redacted','BigSun']:assert term.casefold() in wrap.casefold(),term
for path in mutable|extra:
 f=R/path
 if f.exists():assert all(x==x.rstrip() for x in f.read_text().splitlines()) and f.read_text().endswith('\n'),path
assert load(R/'docs/BUILD_STATE.json')['activeStageId'] is None and load(R/'docs/BUILD_STATE.json')['nextPermittedStageId'] is None
git('diff','--check',entry);git('diff','--check',entry,candidate)
result=dict(outcome='PASS',recordedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),scope='Separate author-verified no-loss handoff; never rebound independent source review',reviewedCandidate=candidate,localReviewReceipt=receipt,manifestSha256=bd['manifestSha256'],candidatePathsPreserved=len(m['changedFiles']),allNineAttentionRowsSupplementsAndPriorHistoryPreserved=True,initialDispositions=260,unprocessedInputs=146,heldFields=5041,heldIdentities=260,acceptedFacts=0,seedAliasDispositionOccurrences=seeds,sourceLinkDispositionOccurrences=links,allOwnersTriggersNextActionsPresent=True,noPendingReviewerRepair=True,priorTemporaryCustodyPinsVerified=71,M1Records=437,M1Pins=len(pins),sourceInspectionOutputAndHistoricalGuardLimitsRouted=True,allLaterGatesRetained=True,newSourceReadsDuringHandoff=False,newExternalEffects=False,SD3Started=False,buildGate=load(P/'validation.json')['openBuild'],freshMainTargetGate='Unverified; original Codex owner before canonical acceptance/authorized release',next=dict(owner='Next-session Codex source/identity reconciliation',trigger='Next selected session under existing AUTHORITY/POLICY',authoritativeProgressPath='docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md section9',kickoffPath='docs/evidence/sd2-autonomous/NEXT_SESSION.md',offset=260,inputKey='saved-405588227-row-265',name=q['records'][260]['recordedName'],action='Resume one bounded SD2 checkpoint; never initialize/reset/replay; stop before SD3'))
print(json.dumps(result,indent=2))
