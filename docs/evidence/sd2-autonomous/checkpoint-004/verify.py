"""Read-only checkpoint004 evidence, exact ordered resume, and historical preservation audit."""
from pathlib import Path
import json,hashlib,subprocess,re,collections
P=Path(__file__).resolve().parent;ROOT=P.parents[3]
def git(*a):return subprocess.check_output(['git',*a],cwd=ROOT)
def load(p):return json.loads(p.read_text())
def sha(b):return hashlib.sha256(b).hexdigest()
q=load(P.parent/'queue.json');l=load(P.parent/'checkpoint-004.json');entry=l['entryCommit']
assert l['queueSha256']==sha((P.parent/'queue.json').read_bytes())
assert l['queueOffsetStart']==60 and l['queueOffsetEndExclusive']==80
assert l['orderedInputKeys']==[r['inputKey'] for r in q['records'][60:80]]==[r['inputKey'] for r in l['records']]
assert len(set(l['orderedInputKeys']))==20
prior=[load(P.parent/f'checkpoint-{i:03d}.json') for i in [1,2,3]]
oldkeys=[k for a in prior for k in a['orderedInputKeys']]
assert len(oldkeys)==len(set(oldkeys))==60 and not set(oldkeys)&set(l['orderedInputKeys'])
assert len(q['records'])==406 and len(q['records'][80:])==326
assert l['nextCheckpointInputOffset']==80 and l['nextInputKey']==q['records'][80]['inputKey']=='saved-405588227-row-84'
assert l['coverage']['cumulativeInitialDispositions']==80 and l['coverage']['cumulativeAutonomousHeldIdentities']==80
assert not l['acceptedFacts'] and not l['fullSD2Complete'] and not l['canonicalAcceptance'] and not l['SD3Started']
assert l['sourceRegistry']==load(P/'source-receipts.json')
registry={s['sourceId']:s for s in l['sourceRegistry']};assert len(registry)==28
seedurls={u for r in q['records'][60:80] for u in r['recordedSeedUrls']+r['publishedSourceAliases']}
for s in registry.values():
 assert sha((ROOT/s['artifactPath']).read_bytes())==s['artifactSha256']
 assert s['depth']<=2 and all(s.get(k) for k in ['owner','trigger','nextAction'])
 if s.get('reusedFrom'):assert s['artifactSha256']==next(x for x in prior[-1]['sourceRegistry'] if x['sourceId']==s['sourceId'])['artifactSha256']
 elif s.get('parentSourceId'):
  par=registry[s['parentSourceId']];assert s['depth']==par['depth']+1 and s['originalUrl'] in [d['url'] for d in par['linkDispositions']]
 else:assert s['originalUrl'] in seedurls,s['sourceId']
 for d in s['linkDispositions']:
  assert all(d.get(k) for k in ['disposition','owner','trigger','nextAction'])
  for sid in d.get('sourceIds',[]):assert sid in registry
fields=[];refs=0
for r,seed in zip(l['records'],q['records'][60:80]):
 assert all(r[k]==seed[k] for k in ['inputKey','rowLocator','recordedName','publicIdCandidates','identityAcceptance'])
 assert r['identityAcceptance']=='held' and all(r.get(k) for k in ['owner','trigger','nextAction'])
 assert {d['url'] for d in r['seedDispositions']}==set(seed['recordedSeedUrls']+seed['publishedSourceAliases'])
 for d in r['seedDispositions']:
  assert all(d.get(k) for k in ['disposition','owner','trigger','nextAction'])
  assert all(sid in registry for sid in d['sourceIds'])
  assert d['sourceIds'] or 'not fetched' in d['disposition']
 for f in r['fieldProposals'].values():
  fields.append(f);assert f['acceptance']=='held' and f['state'] in ['verified','conflict','unverified','unstated','inaccessible']
  if f['state'] in ['verified','conflict']:assert f['evidence']
  for e in f['evidence']:
   s=registry[e['sourceId']];assert e['sourceUrl']==s['originalUrl'] and e['artifactSha256']==s['artifactSha256']
   assert e['excerpt'] in (ROOT/s['artifactPath']).read_text();refs+=1
# Exact immutable input keys and claim-source affinity independently reject the initial misbinding.
allowed={63:{'elks-mvs','elks-faq','elks-legacy'},64:{'cooke','cooke-faq'},65:{'hagan','hagan-description','hagan-timeline'},66:{'nelson'},67:{'fec'},69:{'wue','wue-old','wue-incoming','wue-current'},70:{'alcohol','alcohol-alias','alcohol-pdf'},71:{'youth'},72:{'homer','homer-faq'},73:{'elks-legacy','elks-legacy-faq','elks-faq'},74:{'dell'},75:{'fec'},76:{'duke','duke-criteria','duke-faq'},77:{'norrish','norrish-parent'},78:set(),79:{'dawson'},80:{'dawson'},81:{'dawson'},82:{'dawson'},83:{'dawson'}}
def affinity(rows):
 for r in rows:
  row=r['rowLocator'];assert r['inputKey']==f'saved-405588227-row-{row}'
  for name,f in r['fieldProposals'].items():
   for e in f['evidence']:assert e['sourceId'] in allowed[row],f'Wrong named input/source affinity: {r["inputKey"]}/{name}/{e["sourceId"]}'
  if row==75:assert r['recordedName']=='FEC Scholarships' and r['fieldProposals']['identityContinuity']['value']['program']=='Flathead Electric Co-op Scholarships'
  if row==76:assert r['recordedName']=='Fly for Duke Aviation Scholarships' and r['fieldProposals']['identityContinuity']['value']['program']=='Fly for Duke Aviation Scholarships'
affinity(l['records'])
original=json.loads(git('show','8cd41aa:docs/evidence/sd2-autonomous/checkpoint-004.json'))
try:affinity(original['records'])
except AssertionError as e:negativeProof=str(e)
else:raise AssertionError('Original wrong FEC/Duke binding was not rejected')
assert 'saved-405588227-row-75' in negativeProof
fec=next(r for r in l['records'] if r['rowLocator']==75);duke=next(r for r in l['records'] if r['rowLocator']==76)
assert all('Duke' not in d['nextAction'] for d in fec['seedDispositions'])
for field in ['eligibility','fundUse']:assert any(e['sourceId']=='duke-faq' for e in duke['fieldProposals'][field]['evidence'])
cooke=next(r for r in l['records'] if r['rowLocator']==64)
assert cooke['fieldProposals']['minimumGPA']['value']['min']==3.75 and cooke['fieldProposals']['renewalGPA']['value']['min']==3.0
assert cooke['fieldProposals']['schoolType']['value']['onlineFourYearProgramsExcluded'] and cooke['fieldProposals']['schoolType']['value']['fullTime']
assert cooke['fieldProposals']['renewability']['value']['annualDiscretionaryReview'] and cooke['fieldProposals']['renewability']['value']['inYearRevocationPossible']
assert len(fields)==l['coverage']['fieldEnvelopes']==384
assert sum(len(r['fieldProposals']) for a in prior for r in a['records'])==1136
assert l['coverage']['cumulativeAutonomousHeldFields']==1520
inspection=load(P/'document-inspection.json');assert inspection['pageCount']==4 and inspection['allPagesVisuallyInspected']
assert sha(Path(inspection['rawArtifactPath']).read_bytes())==inspection['rawSha256']
for p in inspection['pages']:assert sha(Path(p['path']).read_bytes())==p['sha256']
preserved=0
mutable=['docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md','docs/CURRENT_HANDOFF.md','docs/evidence/sd2-autonomous/NEXT_SESSION.md']
for path in git('ls-tree','-r','--name-only',entry).decode().splitlines():
 if path in mutable:continue
 assert (ROOT/path).read_bytes()==git('show',entry+':'+path),path;preserved+=1
before=git('show',entry+':'+mutable[0]).decode();cur=(ROOT/mutable[0]).read_text()
a='<!-- SD2-CHECKPOINT-004-START -->\n';b='<!-- SD2-CHECKPOINT-004-END -->\n'
if a in cur:
 start=cur.index(a);end=cur.index(b)+len(b);assert cur[:start]+cur[end:]==before
else:assert cur==before
assert (ROOT/mutable[1]).read_bytes().endswith(git('show',entry+':'+mutable[1]))
# Independently audit prior immutable review/receipt binding; never rerun its writer.
m=load(P.parent/'checkpoint-003/final-manifest.json');review=load(P.parent/'checkpoint-003/review.json')
assert review['outcome']=='PASS' and sha((P.parent/'checkpoint-003/final-manifest.json').read_bytes())==review['binding']['manifestSha256']
assert m['candidateCommit']==git('rev-parse','1895c67^').decode().strip()==review['binding']['candidateCommit']
assert m['candidateTree']==git('rev-parse',m['candidateCommit']+'^{tree}').decode().strip()
assert sha(git('diff','--binary',m['entryCommit'],m['candidateCommit']))==m['completeDiffSha256']
for f in m['changedFiles']:assert sha(git('show',m['candidateCommit']+':'+f['path']))==f['sha256']
pins=load(ROOT/'docs/evidence/sd2-next-read-proposal/verification.json')['retainedM1Artifacts']
for pin in pins:assert sha(git('show','009fa57:'+pin['path']))==pin['sha256']
m1=json.loads(git('show','009fa57:docs/evidence/season-monitor-m1/inventory.json'));assert len(m1['records'])==len({r['id'] for r in m1['records']})==437
state=load(ROOT/'docs/BUILD_STATE.json');assert state['activeStageId'] is None and state['nextPermittedStageId'] is None
for p in (P/'sources').glob('*.md'):
 t=p.read_text();assert t.endswith('\n') and not t.endswith('\n\n');assert all(x==x.rstrip() for x in t.splitlines())
 assert not re.search(r'\b[\w.%+-]+@[\w.-]+\.[A-Za-z]{2,}|mailto:|tel:',t),p
 assert not re.search(r'(?:\b\d{3}[-/.]|\(\d{3}\)\s*)\d{3}[-/.]\d{4}',t),p
 assert not re.search(r'ouid=|access_token=|[?&](?:token|nonce|signature)=',t),p
# Full diff includes staged new files; frozen-candidate audit repeats separately.
git('diff','--check',entry)
print(json.dumps({'outcome':'PASS','originalMisbindingRejected':negativeProof,'checkpointInputs':20,'cumulativeInitialDispositions':80,'unprocessed':326,'nextInputKey':l['nextInputKey'],'sourceReceipts':28,'fieldEnvelopes':len(fields),'fieldEvidenceReferences':refs,'fieldStates':dict(collections.Counter(f['state'] for f in fields)),'preservedEntryPaths':preserved,'M1Records':437,'M1Pins':len(pins),'acceptedFacts':0,'SD3Started':False},indent=2))
