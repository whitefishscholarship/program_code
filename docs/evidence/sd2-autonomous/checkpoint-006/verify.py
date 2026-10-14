"""Read-only checkpoint006 evidence, exact queue and protected-history audit."""
from pathlib import Path
import json,subprocess,hashlib,re,collections
P=Path(__file__).resolve().parent;ROOT=P.parents[3];BASE=P.parent
def load(p):return json.loads(p.read_text())
def sha(b):return hashlib.sha256(b).hexdigest()
def git(*a):return subprocess.check_output(['git',*a],cwd=ROOT)
l=load(BASE/'checkpoint-006.json');q=load(BASE/'queue.json');entry=l['entryCommit']
assert entry=='194fd2b086d34607d915b4d551a28b6c013728ae'
assert l['queueSha256']==sha((BASE/'queue.json').read_bytes()) and len(q['records'])==406
assert (l['queueOffsetStart'],l['queueOffsetEndExclusive'])==(100,120)
assert l['orderedInputKeys']==[r['inputKey'] for r in q['records'][100:120]]==[r['inputKey'] for r in l['records']]
prior=[load(BASE/f'checkpoint-{i:03d}.json') for i in range(1,6)]
allkeys=[k for c in prior for k in c['orderedInputKeys']]+l['orderedInputKeys']
assert allkeys==[r['inputKey'] for r in q['records'][:120]] and len(set(allkeys))==120
assert l['nextCheckpointInputOffset']==120 and l['nextInputKey']==q['records'][120]['inputKey']=='saved-405588227-row-124'
assert q['records'][120]['recordedName']=='Jean Atkinson Driggers Scholarship ($2,500)'
assert l['acceptedFacts']==0 and not any(l[k] for k in ['fullSD2Complete','canonicalAcceptance','SD3Started'])
assert l['preservedGates']==prior[-1]['preservedGates']
assert l['sourceRegistry']==load(P/'source-receipts.json')
reg={s['sourceId']:s for s in l['sourceRegistry']};assert len(reg)==24
affinity={r:set(ids) for r,ids in {104:['dawson'],105:['dawson'],106:[],107:[],108:['dawson'],109:['dawson'],110:['dawson'],111:['dawson'],112:['dawson'],113:['nahb'],114:['fcd-page','fcd-pdf'],115:['clerk-page','clerk-pdf','clerk-current'],116:['golf','golf-old'],117:['hitec'],118:['hawkins'],119:['barbara-2025','barbara-about','barbara-2026'],120:['lions-pdf','lions-page'],121:['davidson'],122:['campbell-page','campbell-old','campbell-current'],123:['rise-page','rise-old','rise-current','rise-restaurants']}.items()}
seedurls={u for r in q['records'][100:120] for u in r['recordedSeedUrls']+r['publishedSourceAliases']}
refs=0;links=0;fields=[]
for s in reg.values():
 assert all(s.get(k) for k in ['owner','trigger','nextAction']) and s['depth']<=2
 assert sha((ROOT/s['artifactPath']).read_bytes())==s['artifactSha256']
 if s['sourceId']=='dawson':
  old=next(x for x in prior[-1]['sourceRegistry'] if x['sourceId']=='dawson')
  for k,v in old.items():
   if k not in ['reusedFrom','reuseCheckedAt','reuseApplicability']:assert s[k]==v
 elif s.get('parentSourceId'):
  par=reg[s['parentSourceId']];assert s['depth']==par['depth']+1 and s['originalUrl'] in [x['url'] for x in par['linkDispositions']]
 else:assert s['originalUrl'] in seedurls
 assert not re.search(r'[?&](?:token|sig|signature|se|ouid)=',s['originalUrl']+s['finalUrl'])
 for d in s['linkDispositions']:
  links+=1;assert all(d.get(k) for k in ['disposition','owner','trigger','nextAction'])
  assert all(sid in reg for sid in d.get('sourceIds',[]))
for r,seed in zip(l['records'],q['records'][100:120]):
 assert all(r[k]==seed[k] for k in ['inputKey','rowLocator','recordedName','publicIdCandidates','identityAcceptance'])
 assert r['identityAcceptance']=='held' and all(r.get(k) for k in ['owner','trigger','nextAction'])
 assert set(r['allowedSourceIds'])==affinity[r['rowLocator']]
 assert {d['url'] for d in r['seedDispositions']}==set(seed['recordedSeedUrls']+seed['publishedSourceAliases'])
 for d in r['seedDispositions']:
  assert all(d.get(k) for k in ['disposition','owner','trigger','nextAction'])
  assert set(d['sourceIds'])<=affinity[r['rowLocator']]
 for f in r['fieldProposals'].values():
  fields.append(f);assert f['acceptance']=='held' and f['state'] in ['verified','unverified','conflict','unstated','inaccessible']
  assert all(f.get(k) for k in ['sourceScope','observedAt','freshness','owner','trigger','nextAction'])
  if f['state'] in ['verified','conflict']:assert f['evidence']
  for e in f['evidence']:
   s=reg[e['sourceId']];assert e['sourceId'] in affinity[r['rowLocator']]
   assert e['sourceUrl']==s['originalUrl'] and e['artifactSha256']==s['artifactSha256']
   assert e['excerpt'] in (ROOT/s['artifactPath']).read_text() and e['locator'];refs+=1
cov=l['coverage'];assert len(fields)==cov['fieldEnvelopes']==376
assert cov['cumulativeAutonomousHeldFields']==2262==len(fields)+sum(len(r['fieldProposals']) for c in prior for r in c['records'])
assert cov['cumulativeInitialDispositions']==cov['cumulativeAutonomousHeldIdentities']==120 and cov['unprocessedInputs']==286
assert cov['outcomes']==dict(collections.Counter(r['outcome'] for r in l['records']))=={'held-identity':7,'held-access':2,'researched-held':11}
rows={r['rowLocator']:r for r in l['records']}
def val(row,f):return rows[row]['fieldProposals'][f]['value']
assert val(114,'eligibility')['highSchoolSenior'] is True and val(114,'eligibility')['homeschoolExclusion'] is None
assert val(114,'amount')['possibleSixthHomeschool'] is True
assert any(e['sourceId']=='fcd-pdf' and e['excerpt']=='qualified local high school seniors.' and 'page1' in e['locator'] for e in rows[114]['fieldProposals']['eligibility']['evidence'])
assert val(115,'eligibility')['documentGraduatingSeniorRequired'] is True and val(115,'eligibility')['parentHighSchoolCounty']=='Flathead County'
assert val(115,'eligibility')['applicantCountyResidency'] is None and val(115,'eligibility')['completePDFInspection'] is False
assert {e['sourceId'] for e in rows[115]['fieldProposals']['eligibility']['evidence']}=={'clerk-pdf','clerk-page'}
for row,word in [(114,'qualified local high school seniors'),(115,'Flathead County high-school')]:
 assert word in rows[row]['nextAction'] and all(word in d['nextAction'] for d in rows[row]['seedDispositions'])
assert val(115,'amount')['selectedSlotCount'] is None and rows[115]['fieldProposals']['amount']['state']=='conflict'
assert val(115,'sourceInspectionLimit')['visualProof'] is False
assert val(116,'currentOffering')['2027OpeningDate'] is None
assert not any(e['sourceId']=='golf-old' for f in rows[116]['fieldProposals'].values() for e in f['evidence'])
assert val(118,'cycle')['selectedCycle'] is None and val(118,'deadline')['studentDate']!=val(118,'deadline')['counselorDate']
assert val(119,'deadline')['year'] is None and val(119,'continuingConditions')['stageRelationshipUnresolved']
assert val(119,'materials')['twoAdultReferencesOneTeacherCounselor'] and val(119,'materials')['personalStatementAlternative']['videoFormat']=='MP4'
assert val(121,'renewability')['previousRecipientReapplication'] is False
assert val(122,'renewability')['automaticRenewal'] is None
assert val(122,'materials')['twoRecommendations']['uploadedByProvidersNotApplicant']
assert val(123,'membership')['logicalScopeUnresolved'] and val(123,'cycle')['selectedTimezone'] is None
inspection=load(P/'document-inspection.json');assert len(inspection['documents'])==7
for d in inspection['documents']:
 assert d['pageCount']==2 and d['selectedRuleRegionsVisuallyInspected'] and not d['wholeUnredactedVisualClaim']
 assert sha(Path(d['rawArtifactPath']).read_bytes())==d['rawSha256']
 for p in d['pages']:assert sha(Path(p['path']).read_bytes())==p['sha256']
assert sha(Path(inspection['Hawkins']['rawArtifactPath']).read_bytes())==inspection['Hawkins']['rawSha256']
assert inspection['Hawkins']['bodyParagraphs']==20 and inspection['Hawkins']['bodyTables']==0
assert len(inspection['priorCustodyAudit'])==19
for d in inspection['priorCustodyAudit']:assert d['available'] and d['hashMatches'] and sha(Path(d['path']).read_bytes())==d['recordedSha256']
# Historical bound candidate/receipt and all prior repository bytes unchanged.
m=load(BASE/'checkpoint-005/final-manifest.json');r=load(BASE/'checkpoint-005/review.json')
assert r['outcome']=='PASS' and r['binding']['candidateCommit']==m['candidateCommit']=='25bd8249c4ec34694214a05210ddd3d3da74494b'
assert sha((BASE/'checkpoint-005/final-manifest.json').read_bytes())==r['binding']['manifestSha256']
assert sha(git('diff','--binary',m['entryCommit'],m['candidateCommit']))==m['completeDiffSha256']
for f in m['changedFiles']:assert sha(git('show',m['candidateCommit']+':'+f['path']))==f['sha256']
assert git('rev-parse','1021f06^').decode().strip()==m['candidateCommit']
assert set(git('diff','--name-only',m['candidateCommit'],'1021f06').decode().splitlines())=={'docs/evidence/sd2-autonomous/checkpoint-005/final-manifest.json','docs/evidence/sd2-autonomous/checkpoint-005/review.json'}
mutable={'docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md','docs/CURRENT_HANDOFF.md','docs/evidence/sd2-autonomous/NEXT_SESSION.md'}
preserved=0
for path in git('ls-tree','-r','--name-only',entry).decode().splitlines():
 if path in mutable:continue
 assert (ROOT/path).read_bytes()==git('show',entry+':'+path),path;preserved+=1
pp='docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md';old=git('show',entry+':'+pp).decode();current=(ROOT/pp).read_text()
a='<!-- SD2-CHECKPOINT-006-START -->\n';b='<!-- SD2-CHECKPOINT-006-END -->\n'
if a in current:
 assert current.count(a)==current.count(b)==1;x=current.index(a);y=current.index(b)+len(b);assert current[:x]+current[y:]==old
else:assert current==old
assert (ROOT/'docs/CURRENT_HANDOFF.md').read_bytes().endswith(git('show',entry+':docs/CURRENT_HANDOFF.md'))
pins=load(ROOT/'docs/evidence/sd2-next-read-proposal/verification.json')['retainedM1Artifacts']
for pin in pins:assert sha(git('show','009fa57:'+pin['path']))==pin['sha256']
monitor=json.loads(git('show','009fa57:docs/evidence/season-monitor-m1/inventory.json'));assert len(monitor['records'])==len({x['id'] for x in monitor['records']})==437
state=load(ROOT/'docs/BUILD_STATE.json');assert state['activeStageId'] is None and state['nextPermittedStageId'] is None
for p in (P/'sources').glob('*.md'):
 t=p.read_text();assert t.endswith('\n') and not t.endswith('\n\n') and all(x==x.rstrip() for x in t.splitlines())
 assert not re.search(r'\b[\w.%+-]+@[\w.-]+\.[A-Za-z]{2,}|mailto:|tel:|[?&](?:token|sig|signature|se|ouid)=|800 S Main|133 Interstate|CookieYes|ApplicationGateway',t),p
 assert not re.search(r'(?:\b\d{3}[-/.]|\(\d{3}\)\s*)\d{3}[-/.]\d{4}',t),p
git('diff','--check',entry)
print(json.dumps({'outcome':'PASS','checkpointInputs':20,'cumulativeInitialDispositions':120,'unprocessed':286,'nextInputKey':l['nextInputKey'],'fieldEnvelopes':376,'cumulativeHeldFields':2262,'heldIdentities':120,'evidenceReferences':refs,'sourceReceipts':24,'sourceLinkDispositions':links,'outcomes':cov['outcomes'],'preservedEntryPaths':preserved,'M1Records':437,'M1Pins':len(pins),'priorCustodyHashes':19,'selectedRenderedPageViews':14,'ClerkRawVisualProof':False,'acceptedFacts':0,'SD3Started':False},indent=2))
