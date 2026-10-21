"""Read-only checkpoint, cursor, claim and immutable-history audit."""
from pathlib import Path
import collections, hashlib, json, subprocess
P=Path(__file__).resolve().parent;ROOT=P.parents[3]
ENTRY='ec895940b0c93fcb063a357572504bcbe8e79648'
def git(*a):return subprocess.check_output(['git',*a],cwd=ROOT)
def sha(b):return hashlib.sha256(b).hexdigest()
def load(p):return json.loads(p.read_text())
q=load(P.parent/'queue.json');l=load(P.parent/'checkpoint-002.json');old=load(P.parent/'checkpoint-001.json')
assert l['queueSha256']==sha((P.parent/'queue.json').read_bytes())
assert [r['inputKey'] for r in l['records']]==l['orderedInputKeys']==[r['inputKey'] for r in q['records'][20:40]]
assert len(l['records'])==len(set(l['orderedInputKeys']))==20
assert l['nextCheckpointInputOffset']==40 and l['nextInputKey']==q['records'][40]['inputKey']
assert len(q['records'][40:])==366 and set(l['orderedInputKeys']).isdisjoint(old['orderedInputKeys'])
assert l['acceptedFacts']==0 and not l['fullSD2Complete'] and not l['SD3Started']
registry={s['sourceId']:s for s in l['sourceRegistry']};assert len(registry)==len(l['sourceRegistry'])==17
seeds={u for r in q['records'][20:40] for u in r['recordedSeedUrls']+r['publishedSourceAliases']}
followups={'wai-current':('wai','https://www.wai.org/scholarships',1),'wai-how':('wai-current','https://www.wai.org/how-to-apply',2),'wai-2027':('wai-current','https://assets.noviams.com/novi-file-uploads/wai/WAI2027_Scholarships/WAI2027_Scholarship_Listings.pdf',2),'gianforte-fact':('gianforte','https://awardmontana.mus.edu/documents/Gianforte_Trade_Tech_FACT_SHEET.pdf',1),'gianforte-dash':('gianforte','https://awardmontana.mus.edu/documents/Gianforte_Trade_Tech_FACT-SHEET.pdf',1)}
for sid,s in registry.items():
 assert sha((ROOT/s['artifactPath']).read_bytes())==s['artifactSha256'],sid
 assert s.get('depth',0)<=2
 if sid in followups:
  parent,url,depth=followups[sid];assert s['originalUrl']==url and s['depth']==depth
  parentText=(ROOT/registry[parent]['artifactPath']).read_text()
  assert url in parentText or (sid=='wai-current' and 'www.WAI.org/scholarships' in parentText)
 elif s.get('reusedFrom'):
  original=next(x for x in old['sourceRegistry'] if x['sourceId']==sid)
  assert s['artifactSha256']==original['artifactSha256']
 else:assert s['originalUrl'] in seeds or s['originalUrl'].split('?')[0] in {x.split('?')[0] for x in seeds},sid
fields=[]
for r,src in zip(l['records'],q['records'][20:40]):
 assert all(r[k]==src[k] for k in ['inputKey','rowLocator','recordedName','publicIdCandidates','identityAcceptance'])
 assert r['owner'] and r['trigger'] and r['nextAction'] and r['identityAcceptance']=='held'
 assert {d['url'] for d in r['seedDispositions']}==set(src['recordedSeedUrls']+src['publishedSourceAliases'])
 for f in r['fieldProposals'].values():
  fields.append(f);assert f['acceptance']=='held' and f['state'] in ['verified','unstated','unverified','conflict','inaccessible']
  if f['state'] in ['verified','conflict']:assert f['evidence']
  for e in f['evidence']:
   s=registry[e['sourceId']];assert e['artifactSha256']==s['artifactSha256']
   assert e['excerpt'] in (ROOT/s['artifactPath']).read_text()
assert len(fields)==l['coverage']['fieldEnvelopes']==400
program=next(r for r in l['records'] if r['rowLocator']==25)['fieldProposals']['schoolType']
assert program['state']=='conflict' and program['value']['qualifyingCampusProgramResolution'] is None
assert {e['sourceId'] for e in program['evidence']}=={'gianforte','gianforte-fact','gianforte-dash'}
assert all(registry[s]['visuallyInspectedPages']==[1] for s in ['gianforte-fact','gianforte-dash'])
for s in registry.values():
 if Path(s['artifactPath']).parent==P/'sources':
  text=(ROOT/s['artifactPath']).read_text()
  assert text.endswith('\n') and not text.endswith('\n\n')
  assert all(line==line.rstrip() for line in text.splitlines())
# Every pre-entry blob except selected current documentation must remain exact.
allowed={'docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md','docs/CURRENT_HANDOFF.md','docs/evidence/sd2-autonomous/NEXT_SESSION.md','docs/evidence/sd2-autonomous/CONTINUE.md','docs/evidence/sd2-autonomous/README.md'}
tree=git('ls-tree','-r','-z',ENTRY);preserved=0
for entry in tree.split(b'\0'):
 if not entry:continue
 meta,path=entry.split(b'\t',1);path=path.decode();blob=meta.decode().split()[2]
 if path in allowed:continue
 content=(ROOT/path).read_bytes();actual=hashlib.sha1(b'blob '+str(len(content)).encode()+b'\0'+content).hexdigest()
 assert actual==blob,path;preserved+=1
plan=(ROOT/'docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md').read_text();before=git('show',ENTRY+':docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md').decode()
start='<!-- SD2-CHECKPOINT-002-START -->\n';end='<!-- SD2-CHECKPOINT-002-END -->\n'
if start in plan:
 a=plan.index(start);b=plan.index(end)+len(end);assert plan[:a]+plan[b:]==before
else:assert plan==before
assert (ROOT/'docs/CURRENT_HANDOFF.md').read_bytes().endswith(git('show',ENTRY+':docs/CURRENT_HANDOFF.md'))
for name in ['policy','research']:
 m=load(P.parent/(name+'-manifest.json'));r=load(P.parent/(name+'-review.json'))
 assert sha((P.parent/(name+'-manifest.json')).read_bytes())==r['manifestSha256']
 assert m['candidateCommit']==r['candidateCommit'] and r['outcome']=='PASS'
 assert git('rev-parse',m['candidateCommit']+'^{tree}').decode().strip()==m['candidateTree']
m1pins=load(ROOT/'docs/evidence/sd2-next-read-proposal/verification.json')['retainedM1Artifacts']
for item in m1pins:assert sha(git('show','009fa57:'+item['path']))==item['sha256']
m1=json.loads(git('show','009fa57:docs/evidence/season-monitor-m1/inventory.json'))
assert len(m1['records'])==len({r['id'] for r in m1['records']})==437
state=load(ROOT/'docs/BUILD_STATE.json');assert state['activeStageId'] is None and state['nextPermittedStageId'] is None
git('diff','--check')
git('diff','--check',ENTRY)
print(json.dumps({'outcome':'PASS','checkpointInputs':20,'cumulativeInputs':40,'unprocessedInputs':366,'nextInputKey':l['nextInputKey'],'sourceReceipts':17,'fieldEnvelopes':400,'fieldStates':dict(collections.Counter(f['state'] for f in fields)),'outcomes':dict(collections.Counter(r['outcome'] for r in l['records'])),'preservedEntryPaths':preserved,'M1Records':437,'M1Pins':len(m1pins),'acceptedFacts':0,'SD3Started':False,'sourcePolicyDeviationExcluded':True},indent=2))
