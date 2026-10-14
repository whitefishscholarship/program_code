"""Read-only queue/evidence/history audit for the exact third SD2 checkpoint."""
from pathlib import Path
import collections,hashlib,json,re,subprocess
P=Path(__file__).resolve().parent;ROOT=P.parents[3]
ENTRY='2b021a6162f8b94684c10c390bef5ee8bbb47bed'
def git(*args):return subprocess.check_output(['git',*args],cwd=ROOT)
def sha(b):return hashlib.sha256(b).hexdigest()
def load(p):return json.loads(p.read_text())
q=load(P.parent/'queue.json');l=load(P.parent/'checkpoint-003.json')
assert l['entryCommit']==ENTRY and l['queueSha256']==sha((P.parent/'queue.json').read_bytes())
assert l['queueOffsetStart']==40 and l['queueOffsetEndExclusive']==60
assert l['orderedInputKeys']==[r['inputKey'] for r in q['records'][40:60]]==[r['inputKey'] for r in l['records']]
assert len(l['records'])==len(set(l['orderedInputKeys']))==20
prior=[load(P.parent/f'checkpoint-{i:03d}.json') for i in [1,2]]
oldkeys=[k for old in prior for k in old['orderedInputKeys']]
assert len(oldkeys)==len(set(oldkeys))==40 and set(oldkeys).isdisjoint(l['orderedInputKeys'])
assert l['nextCheckpointInputOffset']==60 and l['nextInputKey']==q['records'][60]['inputKey']
assert len(q['records'][60:])==346 and l['coverage']['cumulativeInitialDispositions']==60
assert l['acceptedFacts']==0 and not l['fullSD2Complete'] and not l['canonicalAcceptance'] and not l['SD3Started']
registry={s['sourceId']:s for s in l['sourceRegistry']};assert len(registry)==len(l['sourceRegistry'])==32
seedurls={u for r in q['records'][40:60] for u in r['recordedSeedUrls']+r['publishedSourceAliases']}
fileids={re.search(r'/d/([^/]+)',u).group(1) for u in seedurls if '/d/' in u}
for sid,s in registry.items():
 assert sha((ROOT/s['artifactPath']).read_bytes())==s['artifactSha256'],sid
 assert s.get('depth',0)<=2
 if s.get('reusedFrom'):
  old=next(x for x in prior[1]['sourceRegistry'] if x['sourceId']==sid)
  assert s['artifactSha256']==old['artifactSha256']
 elif sid=='jenne-community':
  assert s['parentSourceId']=='jenne-page' and s['depth']==1
  assert s['originalUrl'] in (ROOT/registry['jenne-page']['artifactPath']).read_text()
 elif s.get('native'):assert s['fileId'] in fileids
 else:assert s['originalUrl'] in seedurls,(sid,s['originalUrl'])
 if s['artifactPath'].startswith('docs/evidence/sd2-autonomous/checkpoint-003/'):
  text=(ROOT/s['artifactPath']).read_text();assert text.endswith('\n') and not text.endswith('\n\n')
  assert all(line==line.rstrip() for line in text.splitlines())
 for d in s.get('linkDispositions',[]):
  if d.get('url'):assert d.get('disposition') and (d.get('owner') or s.get('owner'))
fields=[];refs=0
for r,seed in zip(l['records'],q['records'][40:60]):
 assert all(r[k]==seed[k] for k in ['inputKey','rowLocator','recordedName','publicIdCandidates','identityAcceptance'])
 assert r['identityAcceptance']=='held' and all(r[k] for k in ['owner','trigger','nextAction'])
 assert {d['url'] for d in r['seedDispositions']}==set(seed['recordedSeedUrls']+seed['publishedSourceAliases'])
 for d in r['seedDispositions']:
  assert all(d[k] for k in ['disposition','owner','trigger','nextAction'])
  assert all(sid in registry for sid in d['sourceIds'])
  assert d['sourceIds'] or 'not fetched' in d['disposition'],d
 for f in r['fieldProposals'].values():
  fields.append(f);assert f['acceptance']=='held'
  assert f['state'] in ['verified','unverified','unstated','conflict','inaccessible']
  if f['state'] in ['verified','conflict']:assert f['evidence']
  for e in f['evidence']:
   s=registry[e['sourceId']];assert e['artifactSha256']==s['artifactSha256']
   assert e['sourceUrl']==s['originalUrl'] and e['excerpt'] in (ROOT/s['artifactPath']).read_text();refs+=1
assert len(fields)==l['coverage']['fieldEnvelopes']==392
assert l['coverage']['cumulativeAutonomousHeldFields']==744+len(fields)==1136
assert sum(len(r['fieldProposals']) for old in prior for r in old['records'])==744
assert len(oldkeys)+len(l['records'])==60
for row,field in [(55,'deadline'),(61,'parentScopeAmbiguity')]:
 f=next(r for r in l['records'] if r['rowLocator']==row)['fieldProposals'][field]
 assert f['state']=='conflict' and f['value']['resolution'] is None
# Recompute every historical source/review blob from the exact entry tree.
allowed={'docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md','docs/CURRENT_HANDOFF.md','docs/evidence/sd2-autonomous/NEXT_SESSION.md','docs/evidence/sd2-autonomous/CONTINUE.md'}
preserved=0
for item in git('ls-tree','-r','-z',ENTRY).split(b'\0'):
 if not item:continue
 meta,path=item.split(b'\t',1);path=path.decode()
 if path in allowed:continue
 data=(ROOT/path).read_bytes();blob=hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()
 assert blob==meta.decode().split()[2],path;preserved+=1
planpath='docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md';before=git('show',ENTRY+':'+planpath).decode();current=(ROOT/planpath).read_text()
start='<!-- SD2-CHECKPOINT-003-START -->\n';end='<!-- SD2-CHECKPOINT-003-END -->\n'
if start in current:
 a=current.index(start);b=current.index(end)+len(end);assert current[:a]+current[b:]==before
else:assert current==before
assert (ROOT/'docs/CURRENT_HANDOFF.md').read_bytes().endswith(git('show',ENTRY+':docs/CURRENT_HANDOFF.md'))
# Bind checkpoint002's exact immutable review and direct-child local receipt, without rerunning its writer.
m=load(P.parent/'checkpoint-002/final-manifest.json');review=load(P.parent/'checkpoint-002/review.json');binding=review['binding']
assert review['outcome']=='PASS' and binding['manifestSha256']==sha((P.parent/'checkpoint-002/final-manifest.json').read_bytes())
assert m['candidateCommit']==binding['candidateCommit']==git('rev-parse','9c79b15^').decode().strip()
assert m['candidateTree']==git('rev-parse',m['candidateCommit']+'^{tree}').decode().strip()
assert sha(git('diff','--binary',m['entryCommit'],m['candidateCommit']))==m['completeDiffSha256']
for f in m['changedFiles']:
 b=git('show',m['candidateCommit']+':'+f['path']);assert sha(b)==f['sha256'] and len(b)==f['bytes']
pins=load(ROOT/'docs/evidence/sd2-next-read-proposal/verification.json')['retainedM1Artifacts']
for pin in pins:assert sha(git('show','009fa57:'+pin['path']))==pin['sha256']
m1=json.loads(git('show','009fa57:docs/evidence/season-monitor-m1/inventory.json'))
assert len(m1['records'])==len({r['id'] for r in m1['records']})==437
state=load(ROOT/'docs/BUILD_STATE.json');assert state['activeStageId'] is None and state['nextPermittedStageId'] is None
git('diff','--check',ENTRY)
print(json.dumps({'outcome':'PASS','checkpointInputs':20,'cumulativeInitialDispositions':60,'unprocessed':346,'nextInputKey':l['nextInputKey'],'sourceReceipts':32,'fieldEnvelopes':len(fields),'fieldEvidenceReferences':refs,'fieldStates':dict(collections.Counter(f['state'] for f in fields)),'preservedEntryPaths':preserved,'M1Records':437,'M1Pins':len(pins),'acceptedFacts':0,'SD3Started':False},indent=2))
