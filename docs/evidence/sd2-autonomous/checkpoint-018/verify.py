"""Read-only checkpoint018 integrity, semantic-affinity and preserved-route audit."""
from pathlib import Path
import json,hashlib,subprocess,datetime,collections,re,os,sys,itertools,urllib.parse
P=Path(__file__).resolve().parent;B=P.parent;R=P.parents[3]
ENTRY='d472eb79b3eb9edcb744ac53a3f485f84f314810'
load=lambda p:json.loads(p.read_text());sha=lambda b:hashlib.sha256(b).hexdigest()
def git(*a):return subprocess.check_output(['git',*a],cwd=R)
q=load(B/'queue.json');l=load(B/'checkpoint-018.json');prior=[load(B/f'checkpoint-{i:03d}.json') for i in range(1,18)]
assert l['entryCommit']==ENTRY and l['queueSha256']==sha((B/'queue.json').read_bytes())
assert len(q['records'])==406 and (l['queueOffsetStart'],l['queueOffsetEndExclusive'])==(340,360)
assert [r['inputKey'] for p in prior for r in p['records']]==[r['inputKey'] for r in q['records'][:340]]
assert l['orderedInputKeys']==[r['inputKey'] for r in l['records']]==[r['inputKey'] for r in q['records'][340:360]]
assert l['nextCheckpointInputOffset']==360 and l['nextInputKey']==q['records'][360]['inputKey']=='saved-405588227-row-366'
assert all(not l[k] for k in ['acceptedFacts','canonicalAcceptance','fullSD2Complete','SD3Started'])
aff={346:['aws'],347:['aea'],348:['aea'],349:['aea'],350:['aea'],351:['aea'],352:['nths','deca'],353:['nths','bpa','bpaalt'],354:['nths','fccla','fccrubric'],355:['nths','rubin'],356:['mikerowe'],357:['clearwater'],358:['fvcc'],359:['rise','risepdf'],360:['nths'],361:['nths'],362:['soroptimist'],363:['bluecollar'],364:['bold'],365:['um','army']}
sources=l['sourceRegistry'];assert sources==load(P/'source-receipts.json');reg={s['sourceId']:s for s in sources};assert len(reg)==19
texts={}
for s in sources:
 raw=(R/s['artifactPath']).read_bytes();assert sha(raw)==s['artifactSha256'];texts[s['sourceId']]=raw.decode()
 assert s['selectionAccounting']['finalCharacters']==s['selectedCharacters']==len(raw.decode())
 assert s['sourceRevision'] is None and s['maxAgeRequested']==0 and s['statusCode']==(404 if s['sourceId']=='bpa' else 200)
 assert all(s.get(k) for k in ['owner','trigger','nextAction','sourceScope','timingPrecision'])
 assert not any(s[k] for k in ['rawArtifactRetained','originFreshnessVerified','completeRawPageImageInspection','nativePublicSponsorContinuityVerified'])
 if s['callStartedAt']:assert s['callStartedAt']<=s['callCompletedAt']<=s['observationRecordedAt']
 else:assert s['sourceId']=='aws' and s['callCompletedAt'] is None
 assert 0<=s['depth']<=2
 if s['parentSourceId']:assert s['originalUrl'] in texts[s['parentSourceId']]
 extracted=list(dict.fromkeys(re.findall(r'\]\((https?://[^\s)]+)',texts[s['sourceId']])))
 assert len(extracted)==len(s['linkDispositions'])
 for u,d in zip(extracted,s['linkDispositions']):
  assert all(d.get(k) for k in ['owner','trigger','nextAction','disposition'])
  assert d['url']==(None if '[query-withheld]' in u else u)
  assert d['sourceIds']==([x['sourceId'] for x in sources if u in [x['originalUrl'],x['finalUrl']]] if '[query-withheld]' not in u else [])
 for d in s['queryLinkDispositions']:assert d['url'] is None and re.fullmatch('[a-f0-9]{64}',d['urlSha256']) and all(d.get(k) for k in ['owner','trigger','nextAction'])
 assert s['convertedTextSha256'] is None
assert reg['um']['originalUrl'] is None and reg['um']['originalUrlSha256']==sha(q['records'][359]['recordedSeedUrls'][0].encode())
assert reg['um']['finalUrl']=='https://www.umt.edu/student-financial-services/scholarships/default.php'
assert 'Unexpected external' in reg['um']['redirectDisposition']
measured=[s for s in sources if s['callStartedAt']];events=[];pairs=[]
host=lambda s:urllib.parse.urlsplit(s['originalUrl'] or 'https://umontana.edu').hostname.lower().removeprefix('www.')
for s in measured:events.extend([(s['callStartedAt'],1),(s['callCompletedAt'],-1)])
active=peak=0
for _,d in sorted(events):active+=d;peak=max(peak,active)
for a,b in itertools.combinations(measured,2):
 if host(a)==host(b) and max(a['callStartedAt'],b['callStartedAt'])<min(a['callCompletedAt'],b['callCompletedAt']):pairs.append([a['sourceId'],b['sourceId']])
assert len(measured)==18 and not pairs and peak<=4
ca=load(P/'concurrency-audit.json');assert ca['maximumMeasuredConcurrentReads']==peak and ca['measuredSameHostOverlaps']==pairs and ca['firstAWSIntervalUnmeasured'] and not ca['independentProviderTelemetry']
con=load(P/'source-concordance.json');assert len(con['checks'])==19 and not con['independentSourceFidelity']
assert all(c['authorSelectedLineConcordance'] and not c['unmatchedLineLengths'] and not c['independentOriginalFidelity'] for c in con['checks'])
fields=refs=seeds=0
for r,seed in zip(l['records'],q['records'][340:360]):
 for k,v in seed.items():
  if k=='status':continue
  if k in ['recordedSeedUrls','publishedSourceAliases']:v=['[query-bearing locator withheld; immutable queue hash/pointer]' if '?' in u or '@' in u else u for u in v]
  assert r[k]==v,(r['rowLocator'],k)
 assert r['allowedSourceIds']==aff[r['rowLocator']] and r['identityAcceptance']=='held' and all(r.get(k) for k in ['owner','trigger','nextAction'])
 assert r['status']==r['outcome']==('held-identity' if r['rowLocator'] in [348,350,351,360,361] else 'researched-held')
 us=list(dict.fromkeys(seed['recordedSeedUrls']+seed['publishedSourceAliases']));assert len(us)==len(r['seedDispositions'])
 for u,d in zip(us,r['seedDispositions']):
  seeds+=1;assert d['urlSha256']==sha(u.encode()) and d['url']==(None if '?' in u or '@' in u else u)
  assert all(d.get(k) for k in ['owner','trigger','nextAction','disposition','inputPointer'])
  assert d['sourceIds']==[s['sourceId'] for s in sources if s['sourceId'] in r['allowedSourceIds'] and s['originalUrlSha256']==sha(u.encode())]
 for k,f in r['fieldProposals'].items():
  fields+=1;assert f['acceptance']=='held' and f['state'] in ['verified','unverified','unstated','conflict','inaccessible']
  assert all(f.get(k) for k in ['owner','trigger','nextAction','sourceScope','observationRecordedAt','freshness','semanticAssertion'])
  assert f['nextAction']==r['nextAction']
  assert f['semanticAssertion']==('Typed held observation: '+json.dumps(f['value'],ensure_ascii=False,separators=(',',':')) if f['value'] is not None else 'Unknown remains non-excluding.')
  if f['value'] is not None:assert f['evidence']
  if f['state'] in ['verified','conflict']:assert f['evidence']
  for e in f['evidence']:
   refs+=1;s=reg[e['sourceId']];assert e['sourceId'] in r['allowedSourceIds']
   assert (e['sourceUrl'],e['sourceUrlSha256'],e['artifactPath'],e['artifactSha256'])==(s['originalUrl'],s['originalUrlSha256'],s['artifactPath'],s['artifactSha256'])
   assert e['excerpt'] in texts[e['sourceId']] and e['locator']
assert fields==308 and refs==119 and sum(len(r['fieldProposals']) for p in prior for r in p['records'])==6253
assert l['coverage']==dict(checkpointInputs=20,fieldEnvelopes=308,sourceReceipts=19,newPublicRetrievals=19,nativeReadableRetrievals=0,nativeMetadataRetrievals=0,outcomes={'researched-held':15,'held-identity':5},cumulativeInitialDispositions=360,cumulativeAutonomousHeldFields=6561,cumulativeAutonomousHeldIdentities=360,unprocessedInputs=46)
rows={r['rowLocator']:r for r in l['records']};v=lambda n,k:rows[n]['fieldProposals'][k]['value']
assert v(346,'studyPath')['certificateProgramYearsLessThan']==2 and v(346,'amount')['annualRecipientMaximum']==800 and 'associate or bachelor' in texts['aws']
assert len(v(346,'eligibility')['excludedFamilies'])==2 and v(346,'amount')['redemptionYears']==1
for n in [348,350,351]:assert rows[n]['outcome']=='held-identity' and v(n,'amount') is None and '<PRIVATE_PERSON>' in rows[n]['fieldProposals']['identityObservation']['evidence'][0]['excerpt']
for n in [347,349]:assert v(n,'eligibility')['programOR']==['avionics','aircraft maintenance'] and len(v(n,'eligibility')['stageOR'])==2
assert rows[352]['fieldProposals']['cycle']['state']=='conflict' and 'January 11, 2027' in texts['deca'] and 'January 9' in texts['nths']
assert v(352,'materials')['childEssayUpload'] and 'upload an essay' in texts['deca']
assert v(352,'application')['changesAfterSubmissionAllowed'] is False and 'cannot make any further changes' in texts['deca']
assert rows[353]['fieldProposals']['cycle']['state']=='conflict' and '5 p.m. ET' in texts['bpaalt'] and '11:59 p.m. ET' in texts['bpaalt']
assert v(354,'materials')['historicalRubricOnly'] and v(354,'materials')['recommendationCount']==2 and '2025 2026' in texts['fccrubric']
assert v(354,'application')['unifiedSelectableOneSeveralAll'] and v(354,'cycle')['timezone']=='ET'
assert v(355,'materials')['exactPromptUnknown'] and v(355,'application')['loggedInMembersOnly']
assert v(356,'materials')['references']['count']==2 and v(356,'materials')['pledgeAndFourShortAnswers'] and v(356,'studyPath')['embeddedDocumentsInspected'] is False
assert v(357,'amount')['observed2026Recipients']==9 and v(357,'amount')['categories']['postHighSchoolAdultDegreeLearner']==1
assert v(357,'eligibility')['depositAccountTransactionWithinDays']==60 and v(357,'materials')['checkupResultsNotUsedInSelection']
assert v(358,'eligibility')['creditsEachFundedSemesterMinimum']==6 and v(358,'renewal')['numericThreshold'] is None
assert v(359,'minimumGPA')['minimum']==3.5 and len(v(359,'materials')['recommendations'])==2 and v(359,'materials')['essayCount']==3
assert v(359,'materials')['applicantDoesNotUploadLetters'] and v(359,'cycle')['parentZone']=='MST' and v(359,'cycle')['documentZone']=='MDT'
assert 'within one year' in ' '.join(texts['risepdf'].split()) and 'must be employed' in texts['risepdf'] and rows[359]['fieldProposals']['affiliation']['state']=='conflict'
for n in [360,361]:assert v(n,'unassignedSourceProfile')['notAssignedToQueuedName'] and v(n,'amount') is None and rows[n]['outcome']=='held-identity'
assert v(362,'reapplication')['applyOnlyOnceForAid'] and len(v(362,'eligibility')['enrollmentOR'])==2
assert v(363,'cycle')['pageStatus']=='paused' and v(363,'eligibility')['historicalFall2025Only'] and v(363,'minimumGPA')['historicalMinimum']==3.0
assert v(364,'materials')['noEssayAdvertised'] and v(364,'minimumGPA')['advertisedAnyGPA']
assert v(365,'nationalProgramEligibility')['nationalOnlyNotTransferred'] and v(365,'eligibility') is None and v(365,'minimumGPA') is None
assert v(365,'nationalProgramEligibility')['HSApplicantsUnweightedGPAMinimum']==2.5 and v(365,'nationalProgramObligation')['futureServiceYears']==8
assert all(e['sourceId']=='army' for k,f in rows[365]['fieldProposals'].items() if k!='identityObservation' for e in f['evidence'])
# Independent findings require distinct scoped conditions,not evidence-only preservation.
assert v(359,'eligibility')==dict(historical2026Only=True,intentToEnrollRequired=True,institutionScope='post-secondary educational institution',term='fall2026',futureOfferingUnknown=True)
assert 'Intend to enroll at a post-secondary educational institution in the fall of 2026' in ' '.join(rows[359]['fieldProposals']['eligibility']['evidence'][0]['excerpt'].split())
assert rows[359]['fieldProposals']['affiliation']['state']=='conflict' and rows[359]['fieldProposals']['cycle']['state']=='conflict'
payment=v(352,'amount')['DECAProgramDisbursement'];assert payment['mustCompleteForm'] and payment['formEmailedMonth']=='May' and payment['generalDECAProgramOnly'] and payment['formUrl'] is None and payment['unvisitedChildApplicationRequirementsNotInferred']
assert 'completing a form that will be emailed to you in May' in texts['deca']
selection=v(352,'selection');assert selection['selectionFactors']==['DECA involvement','leadership ability','community service','academic performance'] and selection['donorSpecificCriteriaAlsoApply'] and selection['generalDECACorporateProgramOnly'] and selection['notMandatoryChildEligibility'] and selection['noScoringOrHardExclusionAuthority']
assert all(x in rows[352]['fieldProposals']['selection']['evidence'][0]['excerpt'] for x in selection['selectionFactors'])
assert 'selectionFactors' not in v(352,'eligibility') and 'May-emailed payment-form' in rows[352]['nextAction'] and 'requiredintent' in rows[359]['nextAction']
original=load(P/'manifest-round1.json');rv1=load(P/'review-round1.json');rem=load(P/'remediation.json')
assert original['candidateCommit']==rv1['binding']['candidateCommit']==rem['priorCandidateCommit']=='75861c229b6d9b0494b7c3f65b25a2502f07b607'
assert sha((P/'manifest-round1.json').read_bytes())==rv1['binding']['manifestSha256']==rem['priorManifestSha256']
assert sha((P/'review-round1.json').read_bytes())==rem['priorReviewSha256']
assert sha((P/'verification-round1.json').read_bytes())==rem['priorVerificationSha256']==next(f['sha256'] for f in original['changedFiles'] if f['path'].endswith('/verification.json'))
assert rv1['outcome']=='FAIL' and rv1['severityCounts']==dict(critical=0,high=0,medium=3,low=0)
assert [d['id'] for d in rem['dispositions']]==[f['id'] for f in rv1['findings']]==['SD2-018-M1','SD2-018-M2','SD2-018-M3']
assert all(all(d.get(k) for k in ['rationale','owner','trigger','target']) for d in rem['dispositions'])
assert rem['newSourceReads']==0 and rem['allSourceReceiptsUnchanged']
assert sha(git('diff','--binary',ENTRY,original['candidateCommit']))==original['completeDiffSha256']
for f in original['changedFiles']:assert sha(git('show',original['candidateCommit']+':'+f['path']))==f['sha256']
old=json.loads(git('show',original['candidateCommit']+':docs/evidence/sd2-autonomous/checkpoint-018.json'));assert old['sourceRegistry']==sources
for oldr,r in zip(old['records'],l['records']):
 if r['rowLocator'] not in [352,359]:assert oldr==r
 else:
  for k in oldr:
   if k not in ['fieldProposals','nextAction','seedDispositions']:assert oldr[k]==r[k]
  for od,nd in zip(oldr['seedDispositions'],r['seedDispositions']):assert {k:v for k,v in od.items() if k!='nextAction'}=={k:v for k,v in nd.items() if k!='nextAction'}
  for k,f in oldr['fieldProposals'].items():
   nf=r['fieldProposals'][k]
   if (r['rowLocator'],k) in [(352,'amount'),(359,'eligibility')]:assert nf['acceptance']=='held'
   else:assert {a:v for a,v in f.items() if a!='nextAction'}=={a:v for a,v in nf.items() if a!='nextAction'}
  assert set(r['fieldProposals'])-set(oldr['fieldProposals'])==({'selection'} if r['rowLocator']==352 else set())
history=0
for folder in [B]+[B/f'checkpoint-{i:03d}' for i in range(2,18)]:
 mp=folder/('research-manifest.json' if folder==B else 'final-manifest.json');rp=folder/('research-review.json' if folder==B else 'review.json');m=load(mp);rv=load(rp);binding=rv.get('binding',rv)
 assert rv['outcome']=='PASS' and binding['candidateCommit']==m['candidateCommit'] and binding['manifestSha256']==sha(mp.read_bytes())
 assert sha(git('diff','--binary',m['entryCommit'],m['candidateCommit']))==m['completeDiffSha256']
 for f in m['changedFiles']:assert sha(git('show',m['candidateCommit']+':'+f['path']))==f['sha256']
 history+=1
mutable={'docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md','docs/CURRENT_HANDOFF.md','docs/evidence/sd2-autonomous/NEXT_SESSION.md'}
paths=set(git('diff','--name-only',ENTRY).decode().splitlines())|set(git('ls-files','--others','--exclude-standard').decode().splitlines())
assert all(p in mutable or p=='docs/evidence/sd2-autonomous/checkpoint-018.json' or p.startswith('docs/evidence/sd2-autonomous/checkpoint-018/') for p in paths),paths
protected=0
for line in git('ls-tree','-r',ENTRY).decode().splitlines():
 meta,path=line.split('\t');mode,typ,blob=meta.split()
 if path in mutable:continue
 f=R/path;raw=os.readlink(f).encode() if mode=='120000' else f.read_bytes()
 assert hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest()==blob,path
 if mode in ['100644','100755']:assert bool(f.stat().st_mode&0o111)==(mode=='100755'),path
 protected+=1
pp='docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md';t=(R/pp).read_text();old=git('show',ENTRY+':'+pp).decode();a='<!-- SD2-CHECKPOINT-018-START -->\n';z='<!-- SD2-CHECKPOINT-018-END -->\n'
if a in t:assert t.count(a)==t.count(z)==1 and t[:t.index(a)]+t[t.index(z)+len(z):]==old
else:assert t==old
for p in mutable-{pp}:assert (R/p).read_bytes().endswith(git('show',ENTRY+':'+p))
cust=load(P/'prior-custody-audit.json');oldcust=load(B/'checkpoint-017/prior-custody-audit.json');assert len(cust['pins'])==71
assert [(p['path'],p['recordedSha256']) for p in cust['pins']]==[(p['path'],p['recordedSha256']) for p in oldcust['pins']]
gaps=[]
for pin in cust['pins']:
 p=Path(pin['path']);actual=sha(p.read_bytes()) if p.exists() else None;assert actual==pin['observedSha256']
 if actual!=pin['recordedSha256']:gaps.append(pin['path'])
 assert all(pin.get(k) for k in ['owner','trigger','nextAction'])
assert gaps==cust['gaps']
pins=load(R/'docs/evidence/sd2-next-read-proposal/verification.json')['retainedM1Artifacts']
for pin in pins:assert sha(git('show','009fa57:'+pin['path']))==pin['sha256']
m1=json.loads(git('show','009fa57:docs/evidence/season-monitor-m1/inventory.json'));assert len(m1['records'])==len({r['id'] for r in m1['records']})==437
state=load(R/'docs/BUILD_STATE.json');assert state['activeStageId'] is None and state['nextPermittedStageId'] is None
routecounts=collections.Counter();missing=[]
def routes(x,parents=None):
 if not isinstance(x,dict):return
 inherited={k:x.get(k) or (parents or {}).get(k) for k in ['owner','trigger','nextAction']}
 for k,vv in x.items():
  if k in ['fieldProposals']:
   for f in vv.values():routecounts['fields']+=1;assert all(f.get(a) or inherited.get(a) for a in inherited)
  elif k in ['seedDispositions','linkDispositions','queryLinkDispositions','excludedProgramLinkDispositions']:
   for d in vv:
    routecounts['seeds' if k=='seedDispositions' else 'links']+=1
    assert all(d.get(a) or inherited.get(a) for a in inherited),(k,d)
for packet in prior+[l]:
 for r in packet['records']:routecounts['identities']+=1;routes(r)
 for s in packet['sourceRegistry']:routes(s)
assert routecounts['fields']==6561 and routecounts['identities']==360
for p in [B/'checkpoint-018.json']+[f for f in P.rglob('*') if f.is_file()]:
 t=p.read_text();assert not re.search(r'\b[\w.%+-]+@[\w.-]+\.[A-Za-z]{2,}|[?&](?:AccessKeyId|token|sig|signature|se|ouid)=|tel:\d+',t,re.I),str(p)
 assert not re.search(r'(?:\b\d{3}[-/.]|\(\d{3}\)\s*)\d{3}[-/.]\d{4}',t),str(p)
 assert all(x==x.rstrip() for x in t.splitlines()) and t.endswith('\n') and not t.endswith('\n\n'),str(p)
va=load(P/'validation.json');assert not any(va[k] for k in ['canonicalAcceptance','externalEffects','SD3Started'])
for c in va['checks']:assert sha((R/c['logPath']).read_bytes())==c['logSha256']
assert [load(P/(n+'.json'))['exitCode'] for n in ['plan-retry','typecheck','tests-retry']]==[0,0,0]
assert all(load(P/(n+'.json'))['exitCode']==1 and 'Operation not permitted' in (P/(n+'.log')).read_text() for n in ['build','build-retry'])
git('diff','--check',ENTRY)
if '--review-bound' in sys.argv:
 m=load(P/'final-manifest.json');rv=load(P/'review.json');binding=rv['binding']
 assert rv['outcome']=='PASS' and binding['candidateCommit']==m['candidateCommit'] and binding['manifestSha256']==sha((P/'final-manifest.json').read_bytes())
 assert rv['severityCounts']==dict(critical=0,high=0,medium=0,low=0)
 assert sha(git('diff','--binary',ENTRY,m['candidateCommit']))==m['completeDiffSha256']
 for f in m['changedFiles']:assert sha(git('show',m['candidateCommit']+':'+f['path']))==f['sha256']
 receipt=load(P/'local-review-receipt.json')['commit'];assert git('rev-parse',receipt+'^').decode().strip()==m['candidateCommit']
 assert set(git('diff','--name-only',m['candidateCommit'],receipt).decode().splitlines())=={'docs/evidence/sd2-autonomous/checkpoint-018/final-manifest.json','docs/evidence/sd2-autonomous/checkpoint-018/review.json'}
print(json.dumps(dict(outcome='PASS',recordedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),entryCommit=ENTRY,scope='Local held-research integrity only',checkpointInputs=20,cumulativeInitialDispositions=360,unprocessedInputs=46,fieldEnvelopes=fields,cumulativeHeldFields=6561,heldIdentities=360,sourceReceipts=19,evidenceReferences=refs,maximumMeasuredConcurrentReads=peak,measuredSameHostOverlaps=pairs,firstAWSIntervalUnmeasured=True,routeCounts=dict(routecounts),historicalManifestReviewsVerified=history,protectedTrackedFiles=protected,priorCustodyPins=71,custodyGaps=gaps,M1Records=437,M1Pins=len(pins),acceptedFacts=0,SD3Started=False,nextInputKey=l['nextInputKey'],reviewBound='--review-bound' in sys.argv),indent=2))
