"""Read-only checkpoint019 audit; never initialize/reset/replay or mutate history."""
from pathlib import Path
import json,hashlib,subprocess,datetime,collections,re,os,sys,itertools,urllib.parse
P=Path(__file__).resolve().parent;B=P.parent;R=P.parents[3]
ENTRY='1b2fb382c263dcc37e2210eee2d01ebe7337a2df'
load=lambda p:json.loads(p.read_text());sha=lambda b:hashlib.sha256(b).hexdigest()
def git(*a):return subprocess.check_output(['git',*a],cwd=R)
q=load(B/'queue.json');l=load(B/'checkpoint-019.json');prior=[load(B/f'checkpoint-{i:03d}.json') for i in range(1,19)]
assert l['entryCommit']==ENTRY and l['queueSha256']==sha((B/'queue.json').read_bytes())
assert len(q['records'])==406 and (l['queueOffsetStart'],l['queueOffsetEndExclusive'])==(360,380)
assert [r['inputKey'] for p in prior for r in p['records']]==[r['inputKey'] for r in q['records'][:360]]
assert l['orderedInputKeys']==[r['inputKey'] for r in l['records']]==[r['inputKey'] for r in q['records'][360:380]]
assert l['nextCheckpointInputOffset']==380 and l['nextInputKey']==q['records'][380]['inputKey']=='saved-405588227-row-386'
assert all(not l[k] for k in ['acceptedFacts','canonicalAcceptance','fullSD2Complete','SD3Started'])
aff={366:['hilleman','hillemanroot'],367:['wts'],368:['wts'],369:['msuresident'],370:['msuresident'],371:['umexternal'],372:['umdefault','umnew'],373:['wts'],374:['wts','wtsstrategic'],375:['ndalliance','morelli'],376:['umaas','umdefault'],377:['agc'],378:['wts'],379:['allamerican','npma'],380:['aopa'],381:['aopa'],382:[],383:[],384:[],385:[]}
sources=l['sourceRegistry'];assert sources==load(P/'source-receipts.json');reg={s['sourceId']:s for s in sources};assert len(reg)==15
texts={};metadata={s['sourceId']:s for s in load(P/'capture-metadata.json')['sources']}
for s in sources:
 raw=(R/s['artifactPath']).read_bytes();assert sha(raw)==s['artifactSha256'];texts[s['sourceId']]=raw.decode()
 assert s['selectionAccounting']['selectedCharacters']==s['selectedCharacters']==metadata[s['sourceId']]['selectedCharacters']==len(raw.decode())
 assert s['sourceRevision'] is None and s['maxAgeRequested']==0 and s['statusCode']==200 and s['convertedTextSha256'] is None
 assert sha(s['originalUrl'].encode())==s['originalUrlSha256']
 assert all(s.get(k) for k in ['owner','trigger','nextAction','sourceScope','redirectDisposition'])
 assert not any(s[k] for k in ['rawArtifactRetained','originFreshnessVerified','completeRawPageImageInspection','originalNativeVisualFidelityVerified'])
 assert s['callStartedAt']<=s['callCompletedAt']==s['observationRecordedAt'] and 0<=s['depth']<=2
 assert urllib.parse.urlsplit(s['originalUrl']).hostname==urllib.parse.urlsplit(s['finalUrl']).hostname
 extracted=list(dict.fromkeys(re.findall(r'\]\((https?://[^\s)]+)',raw.decode())))
 assert len(extracted)==len(s['linkDispositions'])
 for u,d in zip(extracted,s['linkDispositions']):
  assert all(d.get(k) for k in ['owner','trigger','nextAction','disposition'])
  assert d['url']==(None if '[query-withheld]' in u else u)
  assert d['sourceIds']==([x['sourceId'] for x in sources if u in [x['originalUrl'],x['finalUrl']]] if '[query-withheld]' not in u else [])
for s in sources:
 if s['parentSourceId']:assert s['originalUrl'] in texts[s['parentSourceId']]
events=[];pairs=[]
host=lambda s:urllib.parse.urlsplit(s['originalUrl']).hostname.lower().removeprefix('www.')
for s in sources:events.extend([(s['callStartedAt'],1),(s['callCompletedAt'],-1)])
active=peak=0
for _,d in sorted(events):active+=d;peak=max(peak,active)
for a,b in itertools.combinations(sources,2):
 if host(a)==host(b) and max(a['callStartedAt'],b['callStartedAt'])<min(a['callCompletedAt'],b['callCompletedAt']):pairs.append([a['sourceId'],b['sourceId']])
assert peak==1 and not pairs
ca=load(P/'concurrency-audit.json');assert ca['clientIntervals']==15 and ca['maximumMeasuredConcurrentReads']==peak and ca['measuredSameHostOverlaps']==pairs and not ca['independentProviderTelemetry']
con=load(P/'source-concordance.json');assert len(con['checks'])==15 and not con['independentSourceFidelity']
assert all(c['authorSelectedLineConcordance'] and not c['unmatchedLineLengths'] and not c['independentOriginalFidelity'] for c in con['checks'])
cl=load(P/'conversion-link-dispositions.json');assert len(cl['sources'])==15
conversionlinks=unclosed=0
for s in cl['sources']:
 assert s['sourceId'] in reg and s['convertedDestinationCount']==len(s['destinations'])
 assert s['unclosedDestinations']==sum(not d['closed'] for d in s['destinations'])
 unclosed+=s['unclosedDestinations']
 for i,d in enumerate(s['destinations']):
  conversionlinks+=1;assert d['index']==i and d['url'] is None and re.fullmatch('[a-f0-9]{64}',d['destinationSha256'])
  assert all(d.get(k) for k in ['owner','trigger','nextAction','disposition'])
assert unclosed==1
fields=refs=seeds=0
for r,seed in zip(l['records'],q['records'][360:380]):
 for k,v in seed.items():
  if k=='status':continue
  if k in ['recordedSeedUrls','publishedSourceAliases']:v=['[query-bearing locator withheld; immutable queue hash/pointer]' if '?' in u or '@' in u else u for u in v]
  assert r[k]==v,(r['rowLocator'],k)
 assert r['allowedSourceIds']==aff[r['rowLocator']] and r['identityAcceptance']=='held' and all(r.get(k) for k in ['owner','trigger','nextAction'])
 expected='held-identity' if r['rowLocator'] in [372,373] else 'held-access' if r['rowLocator']>=382 else 'researched-held'
 assert r['status']==r['outcome']==expected
 us=list(dict.fromkeys(seed['recordedSeedUrls']+seed['publishedSourceAliases']));assert len(us)==len(r['seedDispositions'])
 for u,d in zip(us,r['seedDispositions']):
  seeds+=1;assert d['urlSha256']==sha(u.encode()) and d['url']==(None if '?' in u or '@' in u else u)
  assert all(d.get(k) for k in ['owner','trigger','nextAction','disposition','inputPointer'])
  assert d['sourceIds']==[s['sourceId'] for s in sources if s['sourceId'] in r['allowedSourceIds'] and u in [s['originalUrl'],s['finalUrl']]]
 for k,f in r['fieldProposals'].items():
  fields+=1;assert f['acceptance']=='held' and f['state'] in ['verified','unverified','unstated','conflict','inaccessible']
  assert all(f.get(k) for k in ['owner','trigger','nextAction','sourceScope','observationRecordedAt','freshness','semanticAssertion']) and f['nextAction']==r['nextAction']
  assert f['semanticAssertion']==('Typed held observation: '+json.dumps(f['value'],ensure_ascii=False,separators=(',',':')) if f['value'] is not None else 'Unknown remains non-excluding.')
  if f['value'] is not None or f['state'] in ['verified','conflict']:assert f['evidence']
  for e in f['evidence']:
   refs+=1;s=reg[e['sourceId']];assert e['sourceId'] in r['allowedSourceIds']
   assert (e['sourceUrl'],e['sourceUrlSha256'],e['artifactPath'],e['artifactSha256'])==(s['originalUrl'],s['originalUrlSha256'],s['artifactPath'],s['artifactSha256'])
   t=texts[e['sourceId']];assert e['excerpt'] in t
   start=t[:t.index(e['excerpt'])].count('\n')+1;assert e['locator']==f"Selected passage lines {start}-{start+e['excerpt'].count(chr(10))}"
assert fields==315 and sum(len(r['fieldProposals']) for p in prior for r in p['records'])==6561
assert l['coverage']==dict(checkpointInputs=20,fieldEnvelopes=315,sourceReceipts=15,newPublicRetrievals=15,nativeReadableRetrievals=0,nativeMetadataRetrievals=0,outcomes={'researched-held':14,'held-identity':2,'held-access':4},cumulativeInitialDispositions=380,cumulativeAutonomousHeldFields=6876,cumulativeAutonomousHeldIdentities=380,unprocessedInputs=26)
rows={r['rowLocator']:r for r in l['records']};v=lambda n,k:rows[n]['fieldProposals'][k]['value']
assert v(366,'materials')['personalReference']['familyMemberPermitted'] is False and v(366,'materials')['essay']['approximateWords']==[500,1000] and v(366,'application')['applicationProgressNotAutomaticallySaved'] is True
assert 'Fall, 2026' in texts['hilleman'] and v(366,'eligibility')['residency']=='Montana residents'
assert v(367,'eligibility')['degreeOR']==['Associate','technical degree'] and v(378,'eligibility')['level']=='high school'
for n in [367,368,378]:assert len(v(n,'parentSelection')['parentCompetitiveSelectionFactors'])==3 and v(n,'parentSelection')['encouragementNotMandatoryEligibility']
assert v(369,'renewal')['minimumCumulativeGPA']==2.5 and v(369,'renewal')['minimumSemesterCredits']==15 and v(369,'eligibility')['firstUndergraduateBachelorOnly']
assert v(370,'renewal')['GPAThreshold'] is None and v(370,'renewal')['creditRequirement'] is None and v(370,'eligibility')['firstGenerationDefinitionUnknown']
assert v(371,'amount')['UMFinalistAnnualUSD']==2000 and v(371,'amount')['UMSemifinalistAnnualUSD']==1000 and v(371,'eligibility')['variantFinalist']['UMFirstChoiceIndicated']
assert v(372,'amount') is None and v(373,'amount') is None and v(373,'unassignedSourceProfile')['notAssignedToQueuedName']
assert v(374,'amount')['article2027']['recipientCount']==6 and v(374,'amount')['parent2026']['recipientCount']==7 and v(374,'cycle')['closeYearExplicit'] is None
assert v(375,'eligibility')['variantsNotCombined'] and rows[375]['fieldProposals']['eligibility']['state']=='conflict' and v(375,'application')['sharedRouteDoesNotTransferGeneralHillemanRequirements']
assert v(376,'amount')['amountPeriodExplicit'] is None and v(376,'amount')['overlapAt3_34To3_349Unresolved'] and rows[376]['fieldProposals']['amount']['state']=='conflict'
assert v(376,'renewal')['startFall2025OrAfter']['semesterCredits']==15 and v(376,'renewal')['startBeforeFall2025']['semesterCredits']==12 and v(376,'renewal')['summerAwardAvailable'] is False
assert v(376,'materials')['unofficialHighSchoolTranscriptRequiredBeforeOfficialOffer'] and v(376,'parentTimingVariant')['yearAndChildDeadlineUnknown']
assert v(377,'studyPath')['undergraduateABETACCEATMAERulesNotTransferred'] and v(377,'cycle')['announcedOpening']=='2027-03-01'
assert rows[379]['fieldProposals']['materials']['state']=='conflict' and v(379,'materials')['NPMAVariant']['resumeOrCV'] and v(379,'awardConditions')['NPMAAppreciationLetterCommitment']
assert v(379,'materials')['sponsorVariant']['essayORVideo']['essayApproxWords']==[500,1000] and v(379,'materials')['NPMAVariant']['essayORVideo']['essayMinimumPages']==1
for n in [380,381]:assert v(n,'cycle')['childListedAsPastExample'] and v(n,'cycle')['childCurrentCycleUnknown'] and 'Examples of Past Scholarships' in texts['aopa']
assert v(380,'eligibility')['minimumOrExactAgeInterpretationHeld'] and len(v(381,'eligibility')['residenceEnrollmentOR'])==2
for n in range(382,386):assert not rows[n]['allowedSourceIds'] and all(f['value'] is None for f in rows[n]['fieldProposals'].values())
history=0
for folder in [B]+[B/f'checkpoint-{i:03d}' for i in range(2,19)]:
 mp=folder/('research-manifest.json' if folder==B else 'final-manifest.json');rp=folder/('research-review.json' if folder==B else 'review.json');m=load(mp);rv=load(rp);binding=rv.get('binding',rv)
 assert rv['outcome']=='PASS' and binding['candidateCommit']==m['candidateCommit'] and binding['manifestSha256']==sha(mp.read_bytes())
 assert sha(git('diff','--binary',m['entryCommit'],m['candidateCommit']))==m['completeDiffSha256']
 for f in m['changedFiles']:assert sha(git('show',m['candidateCommit']+':'+f['path']))==f['sha256']
 history+=1
mutable={'docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md','docs/CURRENT_HANDOFF.md','docs/evidence/sd2-autonomous/NEXT_SESSION.md'}
paths=set(git('diff','--name-only',ENTRY).decode().splitlines())|set(git('ls-files','--others','--exclude-standard').decode().splitlines())
assert all(p in mutable or p=='docs/evidence/sd2-autonomous/checkpoint-019.json' or p.startswith('docs/evidence/sd2-autonomous/checkpoint-019/') for p in paths),paths
protected=0
for line in git('ls-tree','-r',ENTRY).decode().splitlines():
 meta,path=line.split('\t');mode,typ,blob=meta.split()
 if path in mutable:continue
 f=R/path;raw=os.readlink(f).encode() if mode=='120000' else f.read_bytes()
 assert hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest()==blob,path
 if mode in ['100644','100755']:assert bool(f.stat().st_mode&0o111)==(mode=='100755'),path
 protected+=1
pp='docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md';t=(R/pp).read_text();old=git('show',ENTRY+':'+pp).decode();a='<!-- SD2-CHECKPOINT-019-START -->\n';z='<!-- SD2-CHECKPOINT-019-END -->\n'
if a in t:assert t.count(a)==t.count(z)==1 and t[:t.index(a)]+t[t.index(z)+len(z):]==old
else:assert t==old
for p in mutable-{pp}:assert (R/p).read_bytes().endswith(git('show',ENTRY+':'+p))
cust=load(P/'prior-custody-audit.json');oldcust=load(B/'checkpoint-018/prior-custody-audit.json');assert len(cust['pins'])==71
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
routecounts=collections.Counter()
def routes(x):
 inherited={k:x.get(k) for k in ['owner','trigger','nextAction']}
 for k,vv in x.items():
  if k=='fieldProposals':
   for f in vv.values():routecounts['fields']+=1;assert all(f.get(a) or inherited.get(a) for a in inherited)
  elif k in ['seedDispositions','linkDispositions','queryLinkDispositions','excludedProgramLinkDispositions']:
   for d in vv:routecounts['seeds' if k=='seedDispositions' else 'links']+=1;assert all(d.get(a) or inherited.get(a) for a in inherited)
for packet in prior+[l]:
 for r in packet['records']:routecounts['identities']+=1;routes(r)
 for s in packet['sourceRegistry']:routes(s)
assert routecounts['fields']==6876 and routecounts['identities']==380
for p in [B/'checkpoint-019.json']+[f for f in P.rglob('*') if f.is_file()]:
 t=p.read_text();assert not re.search(r'\b[\w.%+-]+@[\w.-]+\.[A-Za-z]{2,}|[?&](?:AccessKeyId|token|sig|signature|se|ouid|_gl|EventKey)=|tel:\d+',t,re.I),str(p)
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
 if (P/'local-review-receipt.json').exists():
  receipt=load(P/'local-review-receipt.json')['commit'];assert git('rev-parse',receipt+'^').decode().strip()==m['candidateCommit']
  assert set(git('diff','--name-only',m['candidateCommit'],receipt).decode().splitlines())=={'docs/evidence/sd2-autonomous/checkpoint-019/final-manifest.json','docs/evidence/sd2-autonomous/checkpoint-019/review.json'}
print(json.dumps(dict(outcome='PASS',recordedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),scope='Local held-research integrity only',entryCommit=ENTRY,checkpointInputs=20,cumulativeInitialDispositions=380,unprocessedInputs=26,fieldEnvelopes=fields,cumulativeHeldFields=6876,heldIdentities=380,sourceReceipts=15,evidenceReferences=refs,maximumMeasuredConcurrentReads=peak,measuredSameHostOverlaps=pairs,conversionDestinationRoutes=conversionlinks,unclosedConvertedDestinations=unclosed,routeCounts=dict(routecounts),historicalManifestReviewsVerified=history,protectedTrackedFiles=protected,priorCustodyPins=71,custodyGaps=gaps,M1Records=437,M1Pins=len(pins),acceptedFacts=0,SD3Started=False,nextInputKey=l['nextInputKey'],reviewBound='--review-bound' in sys.argv),indent=2))
