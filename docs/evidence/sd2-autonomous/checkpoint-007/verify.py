"""Read-only checkpoint007 coverage, evidence, custody, history and routing audit."""
from pathlib import Path
import json,subprocess,hashlib,re,collections
P=Path(__file__).resolve().parent;ROOT=P.parents[3];B=P.parent
def load(p):return json.loads(p.read_text())
def sha(b):return hashlib.sha256(b).hexdigest()
def git(*a):return subprocess.check_output(['git',*a],cwd=ROOT)
l=load(B/'checkpoint-007.json');q=load(B/'queue.json');entry=l['entryCommit'];assert entry=='4a490a70f3be08b402439e9a92d0c4285762b787'
assert l['queueSha256']==sha((B/'queue.json').read_bytes()) and len(q['records'])==406
assert (l['queueOffsetStart'],l['queueOffsetEndExclusive'])==(120,140)
prior=[load(B/f'checkpoint-{i:03d}.json') for i in range(1,7)]
assert [k for c in prior for k in c['orderedInputKeys']]+l['orderedInputKeys']==[r['inputKey'] for r in q['records'][:140]]
assert l['orderedInputKeys']==[r['inputKey'] for r in l['records']]==[r['inputKey'] for r in q['records'][120:140]]
assert l['nextCheckpointInputOffset']==140 and l['nextInputKey']==q['records'][140]['inputKey']=='saved-405588227-row-144'
assert l['acceptedFacts']==0 and not any(l[k] for k in ['fullSD2Complete','canonicalAcceptance','SD3Started'])
assert l['preservedGates']==prior[-1]['preservedGates']
assert l['sourceRegistry']==load(P/'source-receipts.json');reg={s['sourceId']:s for s in l['sourceRegistry']};assert len(reg)==36
affinity={124:['jean','jean-old','jean-pdf'],125:['kiita','kiita-old','kiita-pdf'],126:['coffee','coffee-old','coffee-pdf'],127:['seeley'],128:['dane','wef'],129:['byf','nths','nths-scholarships'],130:['ortho','ortho-home'],131:['davis','davis-faq'],132:['helen','wef'],133:['logan'],134:['wet','wet-old','wet-pdf'],135:['luedke','wef'],136:['rhino','rhino-west','rhino-pdf'],137:['surety'],138:['adams'],139:['ann','wef'],140:['john'],141:['glacier','glacier-alias'],142:['mspoa-old','mspoa'],143:['mspoa-old','mspoa']}
seedurls={u for r in q['records'][120:140] for u in r['recordedSeedUrls']+r['publishedSourceAliases']}
links=refs=0;fields=[]
for s in reg.values():
 assert all(s.get(k) for k in ['owner','trigger','nextAction']) and s['depth']<=2
 assert sha((ROOT/s['artifactPath']).read_bytes())==s['artifactSha256']
 if s.get('parentSourceId'):
  par=reg[s['parentSourceId']];assert s['depth']==par['depth']+1
  assert s['originalUrl'] in [d['url'] for d in par['linkDispositions']],s['sourceId']
 else:assert s['originalUrl'] in seedurls,s['sourceId']
 assert not re.search(r'[?&](?:token|sig|signature|se|ouid)=',s['originalUrl']+s['finalUrl'])
 for d in s['linkDispositions']:
  links+=1;assert all(d.get(k) for k in ['disposition','owner','trigger','nextAction']) and set(d['sourceIds'])<=set(reg)
for r,seed in zip(l['records'],q['records'][120:140]):
 for k in ['inputKey','rowLocator','recordedName','publicIdCandidates','identityAcceptance']:assert r[k]==seed[k]
 assert r['identityAcceptance']=='held' and all(r.get(k) for k in ['owner','trigger','nextAction'])
 assert r['allowedSourceIds']==affinity[r['rowLocator']]
 urls=list(dict.fromkeys(seed['recordedSeedUrls']+seed['publishedSourceAliases']));assert len(r['seedDispositions'])==len(urls)
 for d,u in zip(r['seedDispositions'],urls):
  if u.startswith('mailto:'):assert d['urlSha256']==sha(u.encode()) and d['url']=='mailto:[contact omitted]'
  else:assert d['url']==u
  assert all(d.get(k) for k in ['disposition','owner','trigger','nextAction']) and set(d['sourceIds'])<=set(affinity[r['rowLocator']])
 for f in r['fieldProposals'].values():
  fields.append(f);assert f['acceptance']=='held' and f['state'] in ['verified','unverified','conflict','unstated','inaccessible']
  assert all(f.get(k) for k in ['sourceScope','observedAt','freshness','owner','trigger','nextAction'])
  if f['state'] in ['verified','conflict']:assert f['evidence']
  for e in f['evidence']:
   s=reg[e['sourceId']];assert e['sourceId'] in affinity[r['rowLocator']]
   assert e['sourceUrl']==s['originalUrl'] and e['artifactSha256']==s['artifactSha256']
   assert e['excerpt'] in (ROOT/s['artifactPath']).read_text() and e['locator'];refs+=1
cov=l['coverage'];assert len(fields)==cov['fieldEnvelopes']==384
assert cov['cumulativeAutonomousHeldFields']==2646==len(fields)+sum(len(r['fieldProposals']) for c in prior for r in c['records'])
assert cov['cumulativeInitialDispositions']==cov['cumulativeAutonomousHeldIdentities']==140 and cov['unprocessedInputs']==266
assert cov['outcomes']==dict(collections.Counter(r['outcome'] for r in l['records']))=={'researched-held':19,'held-access':1}
rows={r['rowLocator']:r for r in l['records']}
def v(row,field):return rows[row]['fieldProposals'][field]['value']
assert v(124,'minimumGPA')['minimumRequired'] is False and v(124,'reapplication')['automaticRenewal'] is None
assert v(125,'minimumGPA')['preferred']==3.0 and v(125,'minimumGPA')['requiredThreshold'] is None
assert v(126,'membership')['selectedSingleInterpretation'] is None
assert v(127,'reapplication')['previousRecipientsAllowed'] is False
assert v(129,'deadline')['year'] is None and v(130,'materials')['seventhSemesterTranscript']
assert v(131,'needRequirement')['required'] is True and v(131,'applicationMethod')['visitedNeither']
assert v(132,'minimumGPA')['entry']==3.5 and v(132,'deadline')['year'] is None
assert rows[133]['outcome']=='held-access' and v(133,'amount') is None
assert v(134,'eligibility')['notExclusiveDemographicRule'] and v(134,'sourceInspectionLimit')['rawVisualUnavailable']
assert v(135,'minimumGPA')['entryRequired'] is False and v(135,'renewability')['GPA']==2.0
assert not v(135,'nomination')['requiredForAll'] and v(135,'renewability')['extenuatingException']
assert v(136,'amount')['slots']==7 and v(136,'deadline')['zone'] is None
assert v(137,'eligibility')['selectedRequirement'] is None
assert v(138,'materials')['wordingDistinctionHeld'] and v(139,'amount')['annualBasis'] is None
assert v(140,'materials')['essay']['selectedLimit'] is None and v(141,'deadline')['year'] is None
assert v(142,'minimumGPA')['HSorCurrentCollege']==2.5 and v(143,'minimumGPA') is None
assert v(143,'selection')['random'] and not v(143,'selection')['meritBased']
dual=v(131,'eligibility')['highSchoolDualEnrollment'];assert dual['degreeCreditsAtHigherEducationInstitutionRequired'] and dual['APGenerallyDoesNotMeetRequirement'] and dual['partTimeCollegeEnrolleeStillInHighSchoolMayQualify'] and not dual['automaticEligibility']
assert any(e['sourceId']=='davis-faq' and 'part-time college enrollees' in e['excerpt'] for e in rows[131]['fieldProposals']['eligibility']['evidence'])
assert reg['davis-faq']['sanitizationRecovery']['newSourceRead'] is False and reg['davis-faq']['sanitizationRecovery']['rawFullEnvelopeHashRetained'] is False
for row in [124,125,126,127,134]:
 method=rows[row]['fieldProposals']['applicationMethod'];assert method['state']=='verified' and method['acceptance']=='held' and method['evidence']
 assert method['value']['currentRouteUsability'] is None and method['value']['currentPublicAccess'] is None and method['value']['currentApplicableCycle'] is None
 assert method['value']['actualApplicationAccessVerified'] is False and method['value']['loginFormSubmissionContactActions'] is False and method['value']['applicationPortalVisited'] is False
assert v(127,'applicationMethod')['publishedApplicationAccessCode']=='26SFMS'
assert v(134,'applicationMethod')['alternativeMethods']==['mailed paper application','online through published program link']
originalNative=json.loads(git('show','4373ca3:docs/evidence/sd2-autonomous/checkpoint-007/native-inspection.json'))
interim=load(P/'native-inspection.json')
for orig,cur in zip(originalNative,interim):
 assert all(cur[k]==val for k,val in orig.items())
 assert cur['receiptStatus']=='interim extraction observation, superseded for final retained-text binding'
 assert cur['finalRetainedTextVerificationPath']=='docs/evidence/sd2-autonomous/checkpoint-007/document-inspection.json'
luedke=next(x for x in interim if x['id']=='luedke');assert luedke['selectedTextSha256']!=sha((ROOT/luedke['selectedTextPath']).read_bytes()) and 'does not match' in luedke['selectedTextBindingLimit']
originalReview=load(P/'review-round1.json');assert originalReview['outcome']=='FAIL' and originalReview['severityCounts']=={'critical':0,'high':0,'medium':2,'low':1}
assert sha((P/'manifest-round1.json').read_bytes())==originalReview['binding']['manifestSha256']
assert (P/'verification-round1.json').read_bytes()==git('show','4373ca3:docs/evidence/sd2-autonomous/checkpoint-007/verification.json')
fixes=load(P/'remediation.json');assert fixes['requiredFixCount']==len(fixes['dispositions'])==3 and {x['findingId'] for x in fixes['dispositions']}=={x['id'] for x in originalReview['findings']}
d=load(P/'document-inspection.json');assert len(d['nativeDocuments'])==9 and len(d['safePageViews'])==14 and d['all14SelectedPageViewsInspected']
for x in d['nativeDocuments']:
 assert sha(Path(x['rawArtifactPath']).read_bytes())==x['rawSha256']
 assert sha((ROOT/x['selectedTextPath']).read_bytes())==x['selectedTextSha256']
for x in d['safePageViews']:assert sha(Path(x['path']).read_bytes())==x['sha256']
custody=load(P/'prior-custody-audit.json');assert len(custody['pins'])==41 and custody['gaps']==[]
for x in custody['pins']:assert sha(Path(x['path']).read_bytes())==x['recordedSha256']
assert {x['id'] for x in d['publicDocuments'] if x.get('httpCode')==403}=={'wet-old','wet-pdf'}
for x in d['publicDocuments']:
 if x.get('path'):assert sha(Path(x['path']).read_bytes())==x['sha256']
# Previous exact review and receipt, never rebound to this session.
m=load(B/'checkpoint-006/final-manifest.json');r=load(B/'checkpoint-006/review.json');assert r['outcome']=='PASS'
assert m['candidateCommit']==r['binding']['candidateCommit']=='5434035979d9465f55bd6f56fb5d042f5045ae75'
assert sha((B/'checkpoint-006/final-manifest.json').read_bytes())==r['binding']['manifestSha256']
assert sha(git('diff','--binary',m['entryCommit'],m['candidateCommit']))==m['completeDiffSha256']
for f in m['changedFiles']:assert sha(git('show',m['candidateCommit']+':'+f['path']))==f['sha256']
assert git('rev-parse','e1f2185^').decode().strip()==m['candidateCommit']
assert set(git('diff','--name-only',m['candidateCommit'],'e1f2185').decode().splitlines())=={'docs/evidence/sd2-autonomous/checkpoint-006/final-manifest.json','docs/evidence/sd2-autonomous/checkpoint-006/review.json'}
mutable={'docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md','docs/CURRENT_HANDOFF.md','docs/evidence/sd2-autonomous/NEXT_SESSION.md'};preserved=0
for path in git('ls-tree','-r','--name-only',entry).decode().splitlines():
 if path in mutable:continue
 assert (ROOT/path).read_bytes()==git('show',entry+':'+path),path;preserved+=1
pp='docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md';old=git('show',entry+':'+pp).decode();cur=(ROOT/pp).read_text();a='<!-- SD2-CHECKPOINT-007-START -->\n';b='<!-- SD2-CHECKPOINT-007-END -->\n'
if a in cur:
 assert cur.count(a)==cur.count(b)==1;x=cur.index(a);y=cur.index(b)+len(b);assert cur[:x]+cur[y:]==old
else:assert cur==old
assert (ROOT/'docs/CURRENT_HANDOFF.md').read_bytes().endswith(git('show',entry+':docs/CURRENT_HANDOFF.md'))
pins=load(ROOT/'docs/evidence/sd2-next-read-proposal/verification.json')['retainedM1Artifacts']
for pin in pins:assert sha(git('show','009fa57:'+pin['path']))==pin['sha256']
monitor=json.loads(git('show','009fa57:docs/evidence/season-monitor-m1/inventory.json'));assert len(monitor['records'])==len({x['id'] for x in monitor['records']})==437
state=load(ROOT/'docs/BUILD_STATE.json');assert state['activeStageId'] is None and state['nextPermittedStageId'] is None
for p in (P/'sources').glob('*.md'):
 t=p.read_text();assert t.endswith('\n') and not t.endswith('\n\n') and all(x==x.rstrip() for x in t.splitlines())
 assert not re.search(r'\b[\w.%+-]+@[\w.-]+\.[A-Za-z]{2,}|[?&](?:token|sig|signature|se|ouid)=|480 EAST PARK|5955 Farm|P\.O\. Box 1417|CookieYes|ApplicationGateway',t),p
 assert not re.search(r'(?:\b\d{3}[-/.]|\(\d{3}\)\s*)\d{3}[-/.]\d{4}',t),p
for label,code in [('plan-retry',0),('typecheck',0),('tests-retry',0),('build',1),('build-retry',1)]:
 receipt=load(P/(label+'.json'));assert receipt['exitCode']==code
 assert sha((ROOT/receipt['logPath']).read_bytes())==receipt['logSha256']
git('diff','--check',entry)
print(json.dumps({'outcome':'PASS','checkpointInputs':20,'cumulativeInitialDispositions':140,'unprocessed':266,'nextInputKey':l['nextInputKey'],'fieldEnvelopes':384,'cumulativeHeldFields':2646,'heldIdentities':140,'evidenceReferences':refs,'sourceReceipts':36,'sourceLinkDispositions':links,'preservedEntryPaths':preserved,'M1Records':437,'M1Pins':len(pins),'priorCustodyHashes':41,'safePageViews':14,'WETRawVisualProof':False,'acceptedFacts':0,'SD3Started':False},indent=2))
