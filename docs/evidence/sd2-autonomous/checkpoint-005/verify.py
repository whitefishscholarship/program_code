"""Read-only checkpoint005 frozen-denominator, evidence and preservation audit."""
from pathlib import Path
import json,hashlib,subprocess,re,collections,datetime
P=Path(__file__).resolve().parent;ROOT=P.parents[3];BASE=P.parent
def load(p):return json.loads(p.read_text())
def sha(b):return hashlib.sha256(b).hexdigest()
def git(*a):return subprocess.check_output(['git',*a],cwd=ROOT)
l=load(BASE/'checkpoint-005.json');q=load(BASE/'queue.json');entry=l['entryCommit']
assert entry=='ab360d1b443e7a5f340c71f02ebbadcb95bc56ec'
assert l['queueSha256']==sha((BASE/'queue.json').read_bytes())
assert (l['queueOffsetStart'],l['queueOffsetEndExclusive'])==(80,100)
assert [r['inputKey'] for r in q['records'][80:100]]==l['orderedInputKeys']==[r['inputKey'] for r in l['records']]
prior=[load(BASE/f'checkpoint-{i:03d}.json') for i in range(1,5)]
oldkeys=[k for c in prior for k in c['orderedInputKeys']]
assert oldkeys==[r['inputKey'] for r in q['records'][:80]] and len(set(oldkeys+l['orderedInputKeys']))==100
assert q['records'][80]['recordedName']=='Clayton E. Hoyt Endowed Scholarship'
assert q['records'][100]['inputKey']==l['nextInputKey']=='saved-405588227-row-104'
assert q['records'][100]['recordedName']=='Keith P. Guelff Memorial Endowed Scholarship'
assert l['nextCheckpointInputOffset']==100 and len(q['records'])==406 and len(q['records'][100:])==306
assert l['acceptedFacts']==0 and not any(l[k] for k in ['fullSD2Complete','canonicalAcceptance','SD3Started'])
assert l['sourceRegistry']==load(P/'source-receipts.json');reg={s['sourceId']:s for s in l['sourceRegistry']};assert len(reg)==6
assert l['preservedGates']==prior[-1]['preservedGates']
allowed={r['rowLocator']:({'promise','dawson'} if r['rowLocator']==86 else {'elks-cdn','elks-native','elks-home','elks-parent'} if r['rowLocator']==88 else {'dawson'} if reg['dawson']['originalUrl'] in r['publishedSourceAliases']+r['recordedSeedUrls'] else set()) for r in q['records'][80:100]}
seedurls={u for r in q['records'][80:100] for u in r['recordedSeedUrls']+r['publishedSourceAliases']}
links=0
for s in reg.values():
 assert all(s.get(k) for k in ['owner','trigger','nextAction'])
 assert sha((ROOT/s['artifactPath']).read_bytes())==s['artifactSha256']
 assert s['depth']<=2
 if s.get('reusedFrom'):
  original=next(x for x in prior[-1]['sourceRegistry'] if x['sourceId']==s['sourceId'])
  assert all(s[k]==v for k,v in original.items() if k!='reusedFrom')
 elif s.get('parentSourceId'):
  parent=reg[s['parentSourceId']];assert s['depth']==parent['depth']+1
  assert s['originalUrl'] in [d['url'] for d in parent['linkDispositions']]
 else:assert s['originalUrl'] in seedurls
 for d in s['linkDispositions']:
  links+=1;assert all(d.get(k) for k in ['disposition','owner','trigger','nextAction'])
  assert all(sid in reg for sid in d.get('sourceIds',[]))
  assert not re.search(r'mailto:|tel:|[?&](?:token|signature|sig|se)=',d['url'])
fields=[];refs=0
for r,seed in zip(l['records'],q['records'][80:100]):
 assert all(r[k]==seed[k] for k in ['inputKey','rowLocator','recordedName','publicIdCandidates','identityAcceptance'])
 assert r['identityAcceptance']=='held' and all(r.get(k) for k in ['owner','trigger','nextAction'])
 assert {d['url'] for d in r['seedDispositions']}==set(seed['recordedSeedUrls']+seed['publishedSourceAliases'])
 for d in r['seedDispositions']:
  assert all(d.get(k) for k in ['disposition','owner','trigger','nextAction'])
  assert all(sid in allowed[r['rowLocator']] for sid in d['sourceIds'])
  if not d['sourceIds']:assert 'not fetched' in d['disposition'] and 'formstack.com' in d['url']
 for name,f in r['fieldProposals'].items():
  fields.append(f);assert f['acceptance']=='held' and f['state'] in ['verified','conflict','unverified','unstated','inaccessible']
  assert f.get('sourceScope') and f.get('freshness') and f.get('observedAt')
  if f['state'] in ['verified','conflict']:assert f['evidence']
  for e in f['evidence']:
   s=reg[e['sourceId']];assert e['sourceId'] in allowed[r['rowLocator']],(r['inputKey'],name,e['sourceId'])
   assert e['sourceUrl']==s['originalUrl'] and e['artifactSha256']==s['artifactSha256']
   assert e['excerpt'] and e['excerpt'] in (ROOT/s['artifactPath']).read_text();refs+=1
coverage=l['coverage'];assert len(fields)==coverage['fieldEnvelopes']==366
assert coverage['cumulativeAutonomousHeldFields']==1886==sum(len(r['fieldProposals']) for c in prior for r in c['records'])+len(fields)
assert coverage['cumulativeInitialDispositions']==coverage['cumulativeAutonomousHeldIdentities']==100
assert coverage['unprocessedInputs']==306 and coverage['outcomes']==dict(collections.Counter(r['outcome'] for r in l['records']))=={'held-identity':13,'researched-held':2,'held-access':5}
elks=next(r for r in l['records'] if r['rowLocator']==88);promise=next(r for r in l['records'] if r['rowLocator']==86)
assert elks['fieldProposals']['amount']['state']=='conflict' and elks['fieldProposals']['amount']['value']['selectedAmount'] is None
assert elks['fieldProposals']['minimumGPA']['value'] is None and elks['fieldProposals']['needRequirement']['value'] is None
assert elks['fieldProposals']['deadline']['value']['year'] is None
assert promise['fieldProposals']['identityContinuity']['value']['endowedAwardBinding'] is None
inspection=load(P/'document-inspection.json');assert inspection['pageCount']==inspection['cdnPageCount']==12 and inspection['allPagesVisuallyInspected'] and inspection['blankApplication']
assert not inspection['rawBytesEqual'] and inspection['layoutTextBytesEqual']
for path,key in [('rawArtifactPath','rawSha256'),('cdnRawArtifactPath','cdnRawSha256')]:assert sha(Path(inspection[path]).read_bytes())==inspection[key]
for p in inspection['pages']:assert sha(Path(p['path']).read_bytes())==p['sha256']
assert Path('/private/tmp/sd2-checkpoint005-raw/elks-native.txt').read_bytes()==Path('/private/tmp/sd2-checkpoint005-raw/elks-cdn.txt').read_bytes()
# Retained prior temporary custody audited without replay/reacquisition.
n=load(BASE/'checkpoint-004/document-inspection.json');assert sha(Path(n['rawArtifactPath']).read_bytes())==n['rawSha256']
for p in n['pages']:assert sha(Path(p['path']).read_bytes())==p['sha256']
mutable={'docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md','docs/CURRENT_HANDOFF.md','docs/evidence/sd2-autonomous/NEXT_SESSION.md'}
preserved=0
for p in git('ls-tree','-r','--name-only',entry).decode().splitlines():
 if p in mutable:continue
 assert (ROOT/p).read_bytes()==git('show',entry+':'+p),p;preserved+=1
planpath='docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md';before=git('show',entry+':'+planpath).decode();current=(ROOT/planpath).read_text()
a='<!-- SD2-CHECKPOINT-005-START -->\n';b='<!-- SD2-CHECKPOINT-005-END -->\n'
if a in current:
 assert current.count(a)==current.count(b)==1
 x=current.index(a);y=current.index(b)+len(b);assert current[:x]+current[y:]==before
else:assert current==before
assert (ROOT/'docs/CURRENT_HANDOFF.md').read_bytes().endswith(git('show',entry+':docs/CURRENT_HANDOFF.md'))
m=load(BASE/'checkpoint-004/final-manifest.json');review=load(BASE/'checkpoint-004/review.json')
assert review['outcome']=='PASS' and review['binding']['manifestSha256']==sha((BASE/'checkpoint-004/final-manifest.json').read_bytes())
assert m['candidateCommit']==review['binding']['candidateCommit']==git('rev-parse','bf17ea2^').decode().strip()
assert sha(git('diff','--binary',m['entryCommit'],m['candidateCommit']))==m['completeDiffSha256']
for f in m['changedFiles']:assert sha(git('show',m['candidateCommit']+':'+f['path']))==f['sha256']
assert set(git('diff','--name-only',m['candidateCommit'],'bf17ea2').decode().splitlines())=={'docs/evidence/sd2-autonomous/checkpoint-004/final-manifest.json','docs/evidence/sd2-autonomous/checkpoint-004/review.json'}
pins=load(ROOT/'docs/evidence/sd2-next-read-proposal/verification.json')['retainedM1Artifacts']
for pin in pins:assert sha(git('show','009fa57:'+pin['path']))==pin['sha256']
m1=json.loads(git('show','009fa57:docs/evidence/season-monitor-m1/inventory.json'));assert len(m1['records'])==len({r['id'] for r in m1['records']})==437
state=load(ROOT/'docs/BUILD_STATE.json');assert state['activeStageId'] is None and state['nextPermittedStageId'] is None
for p in (P/'sources').glob('*.md'):
 t=p.read_text();assert t.endswith('\n') and not t.endswith('\n\n') and all(x==x.rstrip() for x in t.splitlines())
 assert not re.search(r'\b[\w.%+-]+@[\w.-]+\.[A-Za-z]{2,}|mailto:|tel:|401 E\.|Anaconda,|[?&](?:token|signature|sig|se)=',t),p
 assert not re.search(r'(?:\b\d{3}[-/.]|\(\d{3}\)\s*)\d{3}[-/.]\d{4}',t),p
git('diff','--check',entry)
print(json.dumps({'outcome':'PASS','checkpointInputs':20,'cumulativeInitialDispositions':100,'unprocessed':306,'nextInputKey':l['nextInputKey'],'fieldEnvelopes':len(fields),'cumulativeHeldFields':1886,'heldIdentities':100,'evidenceReferences':refs,'sourceReceipts':6,'sourceLinkDispositions':links,'outcomes':coverage['outcomes'],'preservedEntryPaths':preserved,'M1Records':437,'M1Pins':len(pins),'priorNorrishCustodyVerified':True,'nativeElksPagesVisuallyInspected':12,'CDNCompleteLayoutTextEqual':True,'acceptedFacts':0,'SD3Started':False},indent=2))
