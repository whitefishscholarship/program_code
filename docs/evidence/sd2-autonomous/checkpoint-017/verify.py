"""Read-only integrity and source-semantic audit; no queue construction or source access."""
from pathlib import Path
import json,hashlib,subprocess,datetime,collections,re,os,sys,urllib.parse,itertools
P=Path(__file__).resolve().parent;B=P.parent;R=P.parents[3]
ENTRY='89d84f329b065e29daf1a4f724cb8b6404b74afc'
sha=lambda b:hashlib.sha256(b).hexdigest()
load=lambda p:json.loads(p.read_text())
def git(*a):return subprocess.check_output(['git',*a],cwd=R)
q=load(B/'queue.json');l=load(B/'checkpoint-017.json');prior=[load(B/f'checkpoint-{i:03d}.json') for i in range(1,17)]
assert l['entryCommit']==ENTRY and l['queueSha256']==sha((B/'queue.json').read_bytes())
assert len(q['records'])==406 and (l['queueOffsetStart'],l['queueOffsetEndExclusive'])==(320,340)
assert [r['inputKey'] for x in prior for r in x['records']]==[r['inputKey'] for r in q['records'][:320]]
assert l['orderedInputKeys']==[r['inputKey'] for r in q['records'][320:340]]==[r['inputKey'] for r in l['records']]
assert l['nextCheckpointInputOffset']==340 and l['nextInputKey']==q['records'][340]['inputKey']=='saved-405588227-row-346'
assert not any(l[k] for k in ['acceptedFacts','canonicalAcceptance','fullSD2Complete','SD3Started'])
aff={326:['pizzini','pizzinipdf'],327:['natafuture'],328:['natataylor'],329:['blackburn'],330:['wardens'],331:['patrol'],332:['olszewski'],333:['gbci'],334:['kay'],335:['lynch'],336:['reach'],337:['young'],338:['folds','foldsfirst','foldsfirstpdf'],339:['folds','foldsmilitary','foldsmilpdf'],340:['ase','nths','nthscriteria'],341:['lapsen','nths','nthscriteria'],342:['techforce','nths'],343:['trades'],344:['blackmountain','bmspdf'],345:['nths']}
sources=l['sourceRegistry'];assert sources==load(P/'source-receipts.json');reg={s['sourceId']:s for s in sources};assert len(reg)==26
texts={}
for s in sources:
 raw=(R/s['artifactPath']).read_bytes();assert sha(raw)==s['artifactSha256'];texts[s['sourceId']]=raw.decode()
 assert s['callStartedAt']<=s['callCompletedAt']==s['observedAt'] and 0<=s['depth']<=2
 assert s['statusCode']==200 and s['maxAgeRequested']==0 and s['sourceRevision'] is None
 assert all(s.get(k) for k in ['owner','trigger','nextAction','sourceScope','selectionAccounting'])
 assert not any(s[k] for k in ['rawArtifactRetained','originFreshnessVerified','completeRawPageImageInspection','nativePublicSponsorContinuityVerified'])
 assert s['selectionAccounting']['finalCharacters']==len(texts[s['sourceId']])
 links=list(dict.fromkeys(re.findall(r'(?<=\]\()(https?://[^)\s]+)',texts[s['sourceId']])))
 assert links==[d['url'] for d in s['linkDispositions']]
 for d in s['linkDispositions']:
  assert all(d.get(k) for k in ['owner','trigger','nextAction','disposition'])
  assert d['sourceIds']==[t['sourceId'] for t in sources if d['url'] in [t['originalUrl'],t['finalUrl']]]
 if s['parentSourceId']:assert s['originalUrl'] in [d['url'] for d in reg[s['parentSourceId']]['linkDispositions']]
 assert s['providerFinalEqualsRequested'] or s['sourceId']=='ase'
assert reg['ase']['finalUrl']=='https://nths.org/ase/'
assert reg['pizzinipdf']['originalUrlSha256']==reg['pizzinipdf']['finalUrlSha256']==sha(q['records'][320]['recordedSeedUrls'][0].encode())
assert len(reg['pizzini']['excludedProgramLinkDispositions'])==6
assert all(d['queryMatchesExactQueuedInitialQuery'] and all(d.get(k) for k in ['owner','trigger','nextAction','queryIdentityPointer']) for d in reg['pizzini']['excludedProgramLinkDispositions'])
con=load(P/'source-concordance.json');assert con['independentSourceFidelity'] is False and len(con['checks'])==26
for c in con['checks']:assert not c['unmatched'] and c['finalArtifactSha256']==reg[c['sourceId']]['artifactSha256'] and c['selectedCharacters']==len(texts[c['sourceId']])
pairs=[];events=[]
for s in sources:events.extend([(s['callStartedAt'],1),(s['callCompletedAt'],-1)])
for a,b in itertools.combinations(sources,2):
 if urllib.parse.urlsplit(a['originalUrl']).hostname.lower().removeprefix('www.')==urllib.parse.urlsplit(b['originalUrl']).hostname.lower().removeprefix('www.') and max(a['callStartedAt'],b['callStartedAt'])<min(a['callCompletedAt'],b['callCompletedAt']):pairs.append([a['sourceId'],b['sourceId']])
active=peak=0
for _,d in sorted(events):active+=d;peak=max(peak,active)
assert not pairs and peak<=4
audit=load(P/'concurrency-audit.json');assert audit['historicalCompliance'] and audit['sameHostOverlaps']==pairs and audit['maximumConcurrentReads']==peak
fields=refs=seeds=0
for r,seed in zip(l['records'],q['records'][320:340]):
 for k,v in seed.items():
  if k=='status':continue
  if k in ['recordedSeedUrls','publishedSourceAliases']:v=['[query-bearing locator withheld; immutable queue hash/pointer]' if 'AccessKeyId=' in u else u for u in v]
  assert r[k]==v,(r['rowLocator'],k)
 assert r['allowedSourceIds']==aff[r['rowLocator']] and r['identityAcceptance']=='held'
 assert r['status']==r['outcome']=='researched-held' and all(r.get(k) for k in ['owner','trigger','nextAction'])
 assert len(r['seedDispositions'])==len(dict.fromkeys(seed['recordedSeedUrls']+seed['publishedSourceAliases']))
 for d,u in zip(r['seedDispositions'],dict.fromkeys(seed['recordedSeedUrls']+seed['publishedSourceAliases'])):
  seeds+=1;assert all(d.get(k) for k in ['owner','trigger','nextAction','disposition','inputPointer']) and d['urlSha256']==sha(u.encode())
  assert d['url']==(None if 'AccessKeyId=' in u else u)
  assert set(d['sourceIds'])<=set(r['allowedSourceIds'])
 for k,f in r['fieldProposals'].items():
  fields+=1;assert f['acceptance']=='held' and f['state'] in ['verified','unverified','unstated','inaccessible','conflict']
  assert all(f.get(k) for k in ['owner','trigger','nextAction','sourceScope','observedAt','freshness','semanticAssertion'])
  assert f['semanticAssertion']==('Typed held observation: '+json.dumps(f['value'],ensure_ascii=False,separators=(',',':')) if f['value'] is not None else 'Unknown remains non-excluding.')
  if f['state'] in ['verified','conflict']:assert f['evidence']
  for e in f['evidence']:
   s=reg[e['sourceId']];assert e['sourceId'] in r['allowedSourceIds']
   assert (e['sourceUrl'],e['artifactPath'],e['artifactSha256'])==(s['originalUrl'],s['artifactPath'],s['artifactSha256'])
   assert e['excerpt'] in texts[e['sourceId']] and e['locator'];refs+=1
cov=l['coverage'];assert cov['fieldEnvelopes']==fields==306 and sum(len(r['fieldProposals']) for p in prior for r in p['records'])==5947
assert cov['cumulativeAutonomousHeldFields']==6253 and cov['cumulativeInitialDispositions']==cov['cumulativeAutonomousHeldIdentities']==340 and cov['unprocessedInputs']==66
assert cov['outcomes']==dict(collections.Counter(r['outcome'] for r in l['records']))=={'researched-held':20}
rows={r['rowLocator']:r for r in l['records']};v=lambda n,k:rows[n]['fieldProposals'][k]['value']
# Material qualifiers independently compared against the retained selected source passages.
assert v(326,'minimumGPA')['entryMinimum']==3.0 and v(326,'minimumGPA')['committeeMayWaiveForCurrentLTCProfessionals']
assert 'committee may waive' in texts['pizzinipdf'] and 'class rank' in texts['pizzinipdf'] and 'family members will not be accepted' in texts['pizzinipdf']
assert v(326,'materials')['officialHSTranscriptIncludesClassRank'] and v(326,'renewal')['renewalRecommendationsNotRequired']
assert v(327,'materials')['personalStatementTopics'][-1]=='two or more reasons for selection' and 'two or more reasons' in texts['natafuture']
assert rows[328]['fieldProposals']['eligibility']['state']=='conflict' and rows[328]['fieldProposals']['materials']['state']=='conflict'
assert 'Unofficial college/university transcript' in texts['natataylor'] and v(328,'minimumGPA')['minimum']==3.0
assert v(329,'eligibility')['ruralMontanaHighSchoolPreferenceOnly'] and v(329,'minimumGPA')['entry']==3.5
for n in [330,331]:assert v(n,'renewal')['fullTimeCreditsMinimum']==12 and v(n,'minimumGPA')['entryThrough']=='first semester of high-school senior year' and v(n,'reapplication')['priorRecipientsAllowed'] is False
assert v(332,'eligibility')['preferredMontanaCounties']==['Blaine','Hill','Phillips'] and v(332,'renewal')['academicYears']==2
assert v(333,'affiliation')['afterInitialAwardReapplyRegardlessPersonalOrParentalEmployment'] and 'regardless of personal or parental employment status' in texts['gbci']
assert len(v(334,'eligibility')['MontanaTechStagesOR'])==3 and v(334,'need')['required']
assert v(335,'eligibility')['excludePrograms']==['cosmetology','massage'] and 'cosmetology or massage' in texts['lynch']
assert len(v(336,'eligibility')['documentedMontanaConnectionOR'])==3 and v(336,'minimumGPA')['entry'] is None and v(336,'minimumGPA')['continuingMinimum']==2.5
assert all(v(336,'materials')[k] for k in ['FAFSA_FSS','recommendationLetters','references'])
assert v(337,'need')['requiredNeedThreshold'] is None and v(337,'materials')['references']
for n in [338,339]:
 assert rows[n]['fieldProposals']['cycle']['state']==('conflict' if n==338 else 'unverified') and v(n,'amount')['partTimePerTermMaximumUSD']==1250
 assert v(n,'minimumGPA')['entryNumericRequirementNotSeparatelyEstablished'] and v(n,'minimumGPA')['summerExcluded']
 assert v(n,'checkInMaterials')['requiredTextbooks'] and len(v(n,'checkInMaterials')['reimbursement'])==3
assert v(338,'eligibility')['incidentNeedNotOnDutyButWhileActiveDuty'] and 'incident does not have to be considered' in texts['folds']
assert '70% or higher' in texts['foldsmilpdf'] and len(v(339,'eligibility')['qualifyingServiceStatusesOR'])==5
for n in [340,341]:assert len(v(n,'membershipCriteria')['chapterChoosesConsistentlyOneGPAAlternative'])==3 and v(n,'membershipCriteria')['chapterMayAddRequirements']
assert v(340,'eligibility')['passOneOrMoreASEEntryLevelCertificationInAccreditedArea']
assert v(341,'eligibility')['LawPublicSafetyCourseworkUnitsMinimum']==1.5 and v(341,'eligibility')['noDisciplinaryActionsLastYear']
assert v(342,'cycle')['deadlineMonthDay']=='05-31' and v(342,'amount')['annualAwards']==2
assert v(343,'eligibility')['debtOwedToSchoolRequired'] and 'debt owed to the school' in texts['trades'] and 'Tool Grant Program' not in texts['trades']
assert rows[344]['fieldProposals']['cycle']['state']=='conflict' and v(344,'cycle')['PDFSubmissionDeadline']=='2023-04-15'
assert 'April 15, 2023' in texts['bmspdf'] and 'April 15, 2024' in texts['blackmountain'] and v(344,'materials')['essay']['wordLimit']==500
assert v(345,'eligibility')['dualMembership']==['NTHS','FFA'] and v(345,'application')['exactBoxFileHeldUninspected']
assert 'two confidential letters of recommendation' in texts['pizzinipdf'] and 'Health care and/or long-term care involvement' in texts['pizzinipdf']
assert v(326,'materials')['initialRecommendations']['confidential'] and 'healthcare/long-term-care involvement' in v(326,'materials')['recommendationSelection']
assert v(333,'applicantStage')['observedEligibleStudentLabels']==['Current College Students','Graduating High School Seniors'] and v(333,'applicantStage')['labelsAreNotAnInventedExclusiveEligibilityRule']
assert v(339,'eligibility')['enrollmentStatusOR']==['enrolled','planning to enroll'] and 'enrolled or planning to enroll' in texts['foldsmilpdf']
for n,sid in [(338,'foldsfirstpdf'),(339,'foldsmilpdf')]:
 assert v(n,'fundUse')['PDFTermsOfUseAllowedExamples']['items']==['tuition','most fees','required textbooks','approved required school uniforms']
 assert 'most fees' in texts[sid] and 'school uniforms' in texts[sid]
assert 'FAQ' in v(338,'cycle') and 'legacyConsecutiveYears' in v(338,'renewal')
assert 'FAQ' not in v(339,'cycle') and 'legacyConsecutiveYears' not in v(339,'renewal')
assert rows[339]['fieldProposals']['cycle']['state']=='unverified'
original=load(P/'manifest-round1.json');review=load(P/'review-round1.json');rem=load(P/'remediation.json')
assert original['candidateCommit']==review['binding']['candidateCommit']==rem['priorCandidateCommit']=='b4d62383d2610da0fd58b1c5f10d7fa9db56e911'
assert sha((P/'manifest-round1.json').read_bytes())==review['binding']['manifestSha256']==rem['priorManifestSha256']
assert sha((P/'review-round1.json').read_bytes())==rem['priorReviewSha256']
assert review['outcome']=='FAIL' and review['severityCounts']==dict(critical=0,high=0,medium=3,low=0)
assert [d['id'] for d in rem['dispositions']]==[f['id'] for f in review['findings']]
assert all(all(d.get(k) for k in ['rationale','owner','trigger','target']) for d in rem['dispositions'])
assert rem['newSourceReads']==0 and rem['fieldCountsAndHoldsUnchanged']
assert sha(git('diff','--binary',ENTRY,original['candidateCommit']))==original['completeDiffSha256']
for f in original['changedFiles']:assert sha(git('show',original['candidateCommit']+':'+f['path']))==f['sha256']
assert sha((P/'verification-round1.json').read_bytes())==rem['priorVerificationSha256']==next(f['sha256'] for f in original['changedFiles'] if f['path'].endswith('/verification.json'))
oldLedger=json.loads(git('show',original['candidateCommit']+':docs/evidence/sd2-autonomous/checkpoint-017.json'))
assert oldLedger['coverage']==l['coverage']
for osource,nsource in zip(oldLedger['sourceRegistry'],sources):
 if osource['sourceId']!='pizzinipdf':assert osource==nsource
 else:
  for key in osource:
   if key not in ['artifactSha256','selectedCharacters','selectionAccounting']:assert osource[key]==nsource[key]
  assert osource['artifactSha256']==rem['originalSourceSha256Superseded'] and nsource['artifactSha256']==rem['finalSourceSha256']
  assert osource['selectionAccounting']['convertedCharacters']==nsource['selectionAccounting']['convertedCharacters']
changed={(326,'materials'),(333,'applicantStage'),(338,'fundUse'),(339,'fundUse'),(339,'eligibility'),(339,'cycle'),(339,'renewal')}
for old,new in zip(oldLedger['records'],l['records']):
 for k in old:
  if k!='fieldProposals' and not (old['rowLocator']==339 and k in ['nextAction','seedDispositions']):assert old[k]==new[k]
 for k,f in old['fieldProposals'].items():
  nf=new['fieldProposals'][k]
  if (old['rowLocator'],k) not in changed:
   # Row326 only changes supporting artifact hash/excerpt/locator for its other bound fields.
   if old['rowLocator']==326:
    for key in f:
     if key!='evidence':assert f[key]==nf[key]
   elif old['rowLocator']==339:
    assert {key:value for key,value in f.items() if key!='nextAction'}=={key:value for key,value in nf.items() if key!='nextAction'}
   else:assert f==nf
  else:assert f['acceptance']==nf['acceptance']=='held'
follow=load(P/'remediation-followup.json');mr2=load(P/'manifest-round2.json');rr2=load(P/'review-round2.json')
assert mr2['candidateCommit']==rr2['binding']['candidateCommit']==follow['priorCandidateCommit']=='8d044359b900d77bb499fd4b55d789cac4e87bfb'
assert sha((P/'manifest-round2.json').read_bytes())==rr2['binding']['manifestSha256']==follow['priorManifestSha256']
assert sha((P/'review-round2.json').read_bytes())==follow['priorReviewSha256']
assert rr2['severityCounts']==dict(critical=0,high=0,medium=0,low=1) and rr2['outcome']=='FAIL'
assert [d['id'] for d in follow['dispositions']]==[f['id'] for f in rr2['findings']]==['SD2-017-L1']
assert all(all(d.get(k) for k in ['rationale','owner','trigger','target']) for d in follow['dispositions'])
assert follow['newSourceReads']==0 and follow['allSourceReceiptsUnchanged'] and follow['fieldValuesCountsAndHoldsUnchanged']
assert sha(git('diff','--binary',ENTRY,mr2['candidateCommit']))==mr2['completeDiffSha256']
for f in mr2['changedFiles']:assert sha(git('show',mr2['candidateCommit']+':'+f['path']))==f['sha256']
assert sha((P/'verification-round2.json').read_bytes())==follow['priorVerificationSha256']==next(f['sha256'] for f in mr2['changedFiles'] if f['path'].endswith('/verification.json'))
old2=json.loads(git('show',mr2['candidateCommit']+':docs/evidence/sd2-autonomous/checkpoint-017.json'))
assert old2['sourceRegistry']==sources and old2['coverage']==l['coverage']
for old,new in zip(old2['records'],l['records']):
 if old['rowLocator']!=339:assert old==new
 else:
  assert old['nextAction']==follow['originalRow339NextAction'] and new['nextAction']==follow['correctedRow339NextAction']
  for key in old:
   if key not in ['nextAction','fieldProposals','seedDispositions']:assert old[key]==new[key]
  for od,nd in zip(old['seedDispositions'],new['seedDispositions']):
   assert {k:v for k,v in od.items() if k!='nextAction'}=={k:v for k,v in nd.items() if k!='nextAction'}
   assert nd['nextAction']==new['nextAction']
  for key,f in old['fieldProposals'].items():
   nf=new['fieldProposals'][key];assert {k:v for k,v in f.items() if k!='nextAction'}=={k:v for k,v in nf.items() if k!='nextAction'}
   assert nf['nextAction']==new['nextAction']
assert 'weekend deadline conflict' in rows[338]['nextAction']
assert 'weekend deadline conflict' not in rows[339]['nextAction'] and 'annual window/weekend extension/year uncertainty' in rows[339]['nextAction']
assert all(f['nextAction']==rows[339]['nextAction'] for f in rows[339]['fieldProposals'].values())
assert all(d['nextAction']==rows[339]['nextAction'] for d in rows[339]['seedDispositions'])
readme=(P/'README.md').read_text();row339=next(x for x in readme.splitlines() if x.startswith('|339|'));assert 'weekend deadline conflict' not in row339 and 'annual window/weekend extension/year uncertainty' in row339
history=0
for folder in [B]+[B/f'checkpoint-{i:03d}' for i in range(2,17)]:
 mp=folder/('research-manifest.json' if folder==B else 'final-manifest.json');rp=folder/('research-review.json' if folder==B else 'review.json');m=load(mp);rv=load(rp);binding=rv.get('binding',rv)
 assert rv['outcome']=='PASS' and binding['candidateCommit']==m['candidateCommit'] and binding['manifestSha256']==sha(mp.read_bytes())
 assert sha(git('diff','--binary',m['entryCommit'],m['candidateCommit']))==m['completeDiffSha256']
 for f in m['changedFiles']:assert sha(git('show',m['candidateCommit']+':'+f['path']))==f['sha256']
 history+=1
mutable={'docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md','docs/CURRENT_HANDOFF.md','docs/evidence/sd2-autonomous/NEXT_SESSION.md'}
paths=set(git('diff','--name-only',ENTRY).decode().splitlines())|set(git('ls-files','--others','--exclude-standard').decode().splitlines())
assert all(p in mutable or p=='docs/evidence/sd2-autonomous/checkpoint-017.json' or p.startswith('docs/evidence/sd2-autonomous/checkpoint-017/') for p in paths),paths
protected=0
for line in git('ls-tree','-r',ENTRY).decode().splitlines():
 meta,path=line.split('\t');mode,typ,blob=meta.split()
 if path in mutable:continue
 f=R/path;raw=os.readlink(f).encode() if mode=='120000' else f.read_bytes()
 assert hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest()==blob,path
 if mode in ['100644','100755']:assert bool(f.stat().st_mode&0o111)==(mode=='100755'),path
 protected+=1
pp='docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md';t=(R/pp).read_text();old=git('show',ENTRY+':'+pp).decode();a='<!-- SD2-CHECKPOINT-017-START -->\n';z='<!-- SD2-CHECKPOINT-017-END -->\n'
if a in t:assert t.count(a)==t.count(z)==1 and t[:t.index(a)]+t[t.index(z)+len(z):]==old
else:assert t==old
for p in mutable-{pp}:assert (R/p).read_bytes().endswith(git('show',ENTRY+':'+p))
cust=load(P/'prior-custody-audit.json');oldcust=load(B/'checkpoint-016/prior-custody-audit.json');assert len(cust['pins'])==71
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
for p in [B/'checkpoint-017.json']+[f for f in P.rglob('*') if f.is_file() and f.suffix!='.py']:
 t=p.read_text();assert not re.search(r'\b[\w.%+-]+@[\w.-]+\.[A-Za-z]{2,}|[?&](?:AccessKeyId|token|sig|signature|se|ouid)=|tel:\d+',t,re.I),str(p)
 assert not re.search(r'(?:\b\d{3}[-/.]|\(\d{3}\)\s*)\d{3}[-/.]\d{4}',t),str(p)
 assert all(x==x.rstrip() for x in t.splitlines()) and t.endswith('\n'),str(p)
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
 assert set(git('diff','--name-only',m['candidateCommit'],receipt).decode().splitlines())=={'docs/evidence/sd2-autonomous/checkpoint-017/final-manifest.json','docs/evidence/sd2-autonomous/checkpoint-017/review.json'}
 for name in ['SESSION_WRAP.md','SESSION_CLOSE.md']:
  text=(P/name).read_text();assert all(x in text for x in ['owner','trigger','SD3','offset340','66','6253','437'])
print(json.dumps(dict(outcome='PASS',recordedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),entryCommit=ENTRY,scope='Local held-research integrity only',checkpointInputs=20,cumulativeInitialDispositions=340,unprocessedInputs=66,fieldEnvelopes=fields,cumulativeHeldFields=6253,heldIdentities=340,sourceReceipts=26,evidenceReferences=refs,maximumConcurrentReads=peak,sameHostOverlaps=pairs,seedDispositions=seeds,sourceLinkDispositions=sum(len(s['linkDispositions'])+len(s.get('excludedProgramLinkDispositions',[])) for s in sources),historicalManifestReviewsVerified=history,protectedTrackedFiles=protected,priorCustodyPins=71,custodyGaps=gaps,M1Records=437,M1Pins=len(pins),acceptedFacts=0,SD3Started=False,nextInputKey=l['nextInputKey'],reviewBound='--review-bound' in sys.argv),indent=2))
