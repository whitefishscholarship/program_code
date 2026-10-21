"""Read-only denominator, source, proposal and protected-history verification."""
from pathlib import Path
import collections,hashlib,json,subprocess
P=Path(__file__).resolve().parent;ROOT=P.parents[2]
ENTRY='3f3462d26a046a25ab1a3738d4556e312b64823d'
def git(*a):return subprocess.check_output(['git',*a],cwd=ROOT)
def sha(b):return hashlib.sha256(b).hexdigest()
def read(p):return json.loads(p.read_text())
q=read(P/'queue.json');l=read(P/'checkpoint-001.json')
assert q['remainingNamedInputs']==len(q['records'])==len({r['inputKey'] for r in q['records']})==406
assert q['alreadyResearchedLocators']==[18,40,68,255,400]
assert [r['rowLocator'] for r in q['records'][:2]]==[45,290]
assert len(l['records'])==len(l['orderedInputKeys'])==20
assert [r['inputKey'] for r in l['records']]==q['firstCheckpointInputKeys']==l['orderedInputKeys']
assert sha((P/'queue.json').read_bytes())==l['queueSha256']
original=read(ROOT/'docs/evidence/sd2-first-batch/inventory-ledger.json')
rows={r['row']:r for r in original['rows'] if r['name']}
assert set(rows)-set(q['alreadyResearchedLocators'])=={r['rowLocator'] for r in q['records']}
for r in q['records']:
 assert rows[r['rowLocator']]['name']==r['recordedName']
 assert r['identityAcceptance']=='held'
for pin in q['sourcePins']:assert sha((ROOT/pin['path']).read_bytes())==pin['sha256']
protected=git('ls-tree','-r','--name-only',ENTRY,'docs/evidence','docs/reviews','AGENTS.md',
 'docs/SCHOLARSHIP_SYSTEM_BUILD_PLAN.md','docs/BUILD_STATE.json','docs/STUDENT_DATA_CONTRACT.md','web','.github').decode().splitlines()
for p in protected:assert (ROOT/p).read_bytes()==git('show',ENTRY+':'+p),p
plan=(ROOT/'docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md').read_text()
a=plan.index('<!-- SD2-AUTONOMOUS-START -->');b=plan.index('<!-- SD2-AUTONOMOUS-END -->')+len('<!-- SD2-AUTONOMOUS-END -->\n\n')
assert plan[:a]+plan[b:]==git('show',ENTRY+':docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md').decode()
assert (ROOT/'docs/CURRENT_HANDOFF.md').read_bytes().endswith(git('show',ENTRY+':docs/CURRENT_HANDOFF.md'))
state=read(ROOT/'docs/BUILD_STATE.json');assert state['activeStageId'] is None and state['nextPermittedStageId'] is None
m1=json.loads(git('show','009fa57:docs/evidence/season-monitor-m1/inventory.json'))
assert len(m1['records'])==len({r['id'] for r in m1['records']})==437
registry={r['sourceId']:r for r in l['sourceRegistry']};assert len(registry)==len(l['sourceRegistry'])
for s in registry.values():
 if s.get('artifactPath'):
  p=ROOT/s['artifactPath'];assert sha(p.read_bytes())==s['artifactSha256']
 assert s.get('depth',0)<=2
for r in l['records']:
 assert r['identityAcceptance']=='held'
 for field,f in r['fieldProposals'].items():
  assert f['state'] in ['verified','unstated','unverified','conflict','inaccessible']
  assert f['acceptance'] in ['proposed','held']
  for e in f.get('evidence',[]):
   s=registry[e['sourceId']];assert s.get('artifactPath')
   text=(ROOT/s['artifactPath']).read_text();assert e['excerpt'] in text
  if f['state']=='verified':assert f.get('evidence')
assert l['acceptedFacts']==0
git('diff','--check')
print(json.dumps({'outcome':'PASS','remainingDenominator':406,'checkpointInputs':20,
 'outcomes':dict(collections.Counter(r['outcome'] for r in l['records'])),
 'sourceReceipts':len(registry),'protectedPreEntryFiles':len(protected),
 'originalSection9AndHandoffPreserved':True,'M1Records':437,'acceptedFacts':0,
 'researchComplete':l['researchComplete'],'SD3Started':False},indent=2))
