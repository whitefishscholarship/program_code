"""Read-only integrity/continuity audit of this held checkpoint; never processes queue inputs."""
from pathlib import Path
import json,hashlib,subprocess,re,collections,datetime,os
P=Path(__file__).resolve().parent;B=P.parent;R=P.parents[3]
ENTRY='889057e8807ec55c41796d737262a35dda282e31'
load=lambda p:json.loads(p.read_text());sha=lambda b:hashlib.sha256(b).hexdigest()
def git(*args):return subprocess.check_output(['git',*args],cwd=R)
q=load(B/'queue.json');l=load(B/'checkpoint-014.json');prior=[load(B/f'checkpoint-{i:03d}.json') for i in range(1,14)]
assert git('branch','--show-current').decode().strip()=='codex/plan-student-data-maintenance'
assert l['entryCommit']==ENTRY and l['queueSha256']==sha((B/'queue.json').read_bytes())
assert len(q['records'])==406 and l['queueOffsetStart']==260 and l['queueOffsetEndExclusive']==280
assert l['orderedInputKeys']==[r['inputKey'] for r in q['records'][260:280]]==[r['inputKey'] for r in l['records']]
assert len(set(l['orderedInputKeys']))==20
assert [r['inputKey'] for p in prior for r in p['records']]==[r['inputKey'] for r in q['records'][:260]]
assert l['nextCheckpointInputOffset']==280 and l['nextInputKey']==q['records'][280]['inputKey']=='saved-405588227-row-285'
assert not any(l[k] for k in ['acceptedFacts','canonicalAcceptance','fullSD2Complete','SD3Started'])
assert sum(len(r['fieldProposals']) for p in prior for r in p['records'])==5041
assert all(r['identityAcceptance']=='held' and all(f['acceptance']=='held' for f in r['fieldProposals'].values()) for p in prior for r in p['records'])
sources=l['sourceRegistry'];assert sources==load(P/'source-receipts.json');reg={s['sourceId']:s for s in sources};assert len(reg)==24
assert sum(s['provider']=='Firecrawl connector' for s in sources)==23
assert collections.Counter(s['statusCode'] for s in sources)=={200:22,404:1,None:1}
texts={}
for s in sources:
 assert s['callStartedAt']<=s['callCompletedAt']==s['observedAt']
 assert s['depth'] in [0,1] and (s['depth']==0 or s['parentSourceId'] in reg)
 assert not any(s[k] for k in ['rawArtifactRetained','originFreshnessVerified','completeRawPageImageInspection','nativePublicSponsorContinuityVerified'])
 assert s['maxAgeRequested'] is None and s['sourceRevision'] is None
 raw=(R/s['artifactPath']).read_bytes();assert sha(raw)==s['artifactSha256'];texts[s['sourceId']]=raw.decode()
 destinations=list(dict.fromkeys(re.findall(r'(?<=\]\()(https?://[^)\s]+)',texts[s['sourceId']])))
 assert [d['renderedDestination'] for d in s['linkDispositions']]==destinations
 for d in s['linkDispositions']:
  assert d['url']==d['renderedDestination'].replace('\\#','#') and set(d['sourceIds'])<=set(reg)
  assert all(d.get(k) for k in ['owner','trigger','nextAction','disposition'])
  direct=[a['sourceId'] for a in sources if d['url'] in [a['originalUrl'],a['finalUrl']]]
  if direct:assert direct==d['sourceIds'] and 'Deferred' not in d['disposition']
 if s['parentSourceId']:
  parent=reg[s['parentSourceId']];assert any(d['url']==s['originalUrl'] for d in parent['linkDispositions'])
fields=refs=seeds=0
for r,seed in zip(l['records'],q['records'][260:280]):
 for k in ['inputKey','rowLocator','recordedName','recordedSeedUrls','publishedSourceAliases','publicIdCandidates','identityAcceptance','identityBasis']:assert r[k]==seed[k],(r['rowLocator'],k)
 assert r['status']==r['outcome'] and r['identityAcceptance']=='held'
 assert all(r.get(k) for k in ['owner','trigger','nextAction'])
 assert [d['url'] for d in r['seedDispositions']]==list(dict.fromkeys(seed['recordedSeedUrls']+seed['publishedSourceAliases']))
 for d in r['seedDispositions']:
  seeds+=1;assert all(d.get(k) for k in ['owner','trigger','nextAction','disposition'])
  assert set(d['sourceIds'])<=set(r['allowedSourceIds'])
 for k,f in r['fieldProposals'].items():
  fields+=1;assert f['acceptance']=='held' and f['state'] in ['verified','unverified','unstated','inaccessible','conflict']
  assert all(f.get(k) for k in ['owner','trigger','nextAction','sourceScope','observedAt','freshness','semanticAssertion'])
  if f['state'] in ['verified','conflict']:assert f['evidence'],(r['rowLocator'],k)
  for e in f['evidence']:
   s=reg[e['sourceId']];assert e['sourceId'] in r['allowedSourceIds']
   assert e['sourceUrl']==s['originalUrl'] and e['artifactPath']==s['artifactPath'] and e['artifactSha256']==s['artifactSha256']
   assert e['excerpt'] in texts[e['sourceId']] and e['locator'];refs+=1
cov=l['coverage'];assert cov['fieldEnvelopes']==fields==300 and cov['cumulativeAutonomousHeldFields']==5041+fields==5341
assert cov['cumulativeInitialDispositions']==cov['cumulativeAutonomousHeldIdentities']==280 and cov['unprocessedInputs']==126
assert cov['sourceReceipts']==24 and cov['newPublicRetrievals']==23 and cov['nativeReadableRetrievals']==1 and cov['nativeMetadataReads']==2 and cov['preRetrievalParameterErrors']==4
assert cov['outcomes']==dict(collections.Counter(r['outcome'] for r in l['records']))=={'researched-held':16,'held-identity':3,'held-access':1}
rows={r['rowLocator']:r for r in l['records']};v=lambda n,k:rows[n]['fieldProposals'][k]['value']
assert set(rows)==set(range(265,285))
assert v(268,'minimumGPA')['highSchool']==3 and v(268,'minimumGPA')['college']==2.5
assert v(268,'eligibility')['enrollmentStatusOR']==['enrolled','planning to enroll']
assert v(269,'materials')['phase1']=={'essay':False,'transcript':False,'recommendations':False}
assert v(269,'materials')['phase2']['recommendation']==1 and v(269,'materials')['phase4']
assert v(272,'eligibility')['redactedAffiliationRoleUnknown'] and v(272,'materials')['recommendations']['distinctVariantsNotUnioned']
assert v(274,'minimumGPA')['entry']==3.25 and v(274,'minimumGPA')['renewal']==3
assert v(274,'materials')['conditionalMiddleSchoolTranscript'] and v(274,'renewal')['creditsAfterSemesters']=={'2':30,'4':60,'6':90}
assert v(275,'materials')['letterFromEachReference'] and v(275,'eligibility')['noAlreadyAcceptedOrEnrolledInference']
assert not rows[276]['allowedSourceIds'] and v(276,'application')['noFetchOrInteraction']
assert rows[277]['outcome']=='held-identity' and v(277,'identityObservation')['noAbsenceConclusion']
assert v(278,'renewal')['upToAcademicYears']==4 and v(278,'reapplication')['previousRecipientsMayApplyAgain'] is False
assert v(279,'need')['notCategoricalOffReservationExclusion'] and v(279,'reapplication')['applyEachYear']
cm=v(279,'materials');assert cm['diplomaGEDHiSET']['OR']==['high school diploma','GED/HiSET certificate','GED/HiSET test results']
assert cm['diplomaGEDHiSET']['2026HighSchoolGraduates']=={'OR':['diploma','transcript'],'timing':'after graduation date'}
assert cm['signedDatedForms'] and cm['faxAccepted'] is False
assert 'complete, sign and date all forms' in texts['csktpdf'] and 'Faxed applications will not be accepted.' in texts['csktpdf']
assert 'achievement-based scholarship' in texts['coca'] and v(269,'amount')['scholarship']=='achievement-based'
assert rows[280]['fieldProposals']['cycle']['state']=='conflict' and v(280,'minimumGPA')['basis']=='cumulative weighted or equivalent'
assert v(280,'eligibility')['enrollmentModality']=='must plan to enroll; current enrollment not required by this statement'
assert v(281,'eligibility')['LGBTQorAlly'] and v(281,'cycle')['applicationCalendarYear'] is None and v(281,'amount')['annualOrTotalBasis'] is None
assert len(v(282,'amount')['tiers'])==8 and v(282,'reapplication')['mayReceiveNESAOnlyOnce']
nr=v(282,'renewal');assert nr['activeNESAMembershipEachAwardPeriod'] and nr['generalProgramMaintenance']['fullTimeMinimumCredits']==12
assert nr['generalProgramMaintenance']['maintainAndProvideFullTimeProof'] and nr['generalProgramMaintenance']['paymentUponCourseScheduleReceived']
assert 'active' not in nr['CookeFourYearTerms'] and nr['CookePaymentVerification']==['course schedule','unofficial transcript']
assert rows[284]['fieldProposals']['amount']['state']=='conflict' and all(v(n,'eligibility')['noUnionOrIntersectionAsAcceptedCriteria'] for n in [283,284])
con=load(P/'source-concordance.json');assert len(con['checks'])==24
for c in con['checks']:assert not c['unmatched'] and c['retainedNonblankLines']==sum(bool(x.strip()) and not x.startswith('[Editorial:') for x in texts[c['sourceId']].splitlines())
history=0
for folder in [B]+[B/f'checkpoint-{i:03d}' for i in range(2,14)]:
 mp=folder/('research-manifest.json' if folder==B else 'final-manifest.json');rp=folder/('research-review.json' if folder==B else 'review.json');m=load(mp);rv=load(rp);binding=rv.get('binding',rv)
 assert rv['outcome']=='PASS' and binding['candidateCommit']==m['candidateCommit'] and binding['manifestSha256']==sha(mp.read_bytes())
 assert sha(git('diff','--binary',m['entryCommit'],m['candidateCommit']))==m['completeDiffSha256']
 for item in m['changedFiles']:assert sha(git('show',m['candidateCommit']+':'+item['path']))==item['sha256']
 history+=1
om=load(P/'manifest-round1.json');rv=load(P/'review-round1.json');rem=load(P/'remediation.json')
assert om['candidateCommit']==rv['binding']['candidateCommit']==rem['priorCandidateCommit']=='5351727159f211c0294d581df3d975920d225ea0'
assert sha((P/'manifest-round1.json').read_bytes())==rv['binding']['manifestSha256']==rem['priorManifestSha256']
assert sha((P/'review-round1.json').read_bytes())==rem['priorReviewSha256']
assert rv['outcome']=='FAIL' and rv['severityCounts']==dict(critical=0,high=0,medium=3,low=1)
assert [f['id'] for f in rv['findings']]==[d['id'] for d in rem['dispositions']]==['SD2-014-M1','SD2-014-M2','SD2-014-M3','SD2-014-L1']
assert all(all(d.get(k) for k in ['rationale','owner','target']) for d in rem['dispositions'])
assert rem['newSourceReads']==0 and rem['fieldCountsAndHoldsUnchanged']
assert sha(git('diff','--binary',ENTRY,om['candidateCommit']))==om['completeDiffSha256']
for item in om['changedFiles']:assert sha(git('show',om['candidateCommit']+':'+item['path']))==item['sha256']
assert sha((P/'verification-round1.json').read_bytes())==next(x['sha256'] for x in om['changedFiles'] if x['path'].endswith('/verification.json'))
mutable={'docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md','docs/CURRENT_HANDOFF.md','docs/evidence/sd2-autonomous/NEXT_SESSION.md'}
paths=set(git('diff','--name-only',ENTRY).decode().splitlines())|set(git('ls-files','--others','--exclude-standard').decode().splitlines())
assert all(p in mutable or p=='docs/evidence/sd2-autonomous/checkpoint-014.json' or p.startswith('docs/evidence/sd2-autonomous/checkpoint-014/') for p in paths)
protected=0
for line in git('ls-tree','-r',ENTRY).decode().splitlines():
 meta,path=line.split('\t');mode,typ,blob=meta.split()
 if path in mutable:continue
 f=R/path;raw=os.readlink(f).encode() if mode=='120000' else f.read_bytes()
 assert hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest()==blob,path
 if mode in ['100644','100755']:assert bool(f.stat().st_mode&0o111)==(mode=='100755'),path
 protected+=1
pp='docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md';t=(R/pp).read_text();old=git('show',ENTRY+':'+pp).decode();a='<!-- SD2-CHECKPOINT-014-START -->\n';z='<!-- SD2-CHECKPOINT-014-END -->\n'
if a in t:assert t.count(a)==t.count(z)==1 and t[:t.index(a)]+t[t.index(z)+len(z):]==old
else:assert t==old
for p in mutable-{pp}:assert (R/p).read_bytes().endswith(git('show',ENTRY+':'+p))
cust=load(P/'prior-custody-audit.json');oldcust=load(B/'checkpoint-013/prior-custody-audit.json');assert len(cust['pins'])==71
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
for p in [B/'checkpoint-014.json']+[f for f in P.rglob('*') if f.is_file()]:
 t=p.read_text();assert not re.search(r'\b[\w.%+-]+@[\w.-]+\.[A-Za-z]{2,}|[?&](?:token|sig|signature|se|ouid)=',t),str(p)
 assert not re.search(r'(?:\b\d{3}[-/.]|\(\d{3}\)\s*)\d{3}[-/.]\d{4}',t),str(p)
 assert not re.search(r'\[phone redacted\]\s+(?:ext\.?|extension)\s*\d+',t,re.I),str(p)
 assert not re.search(r'\b[A-Z][a-z]+\s+\d{1,2},\s+19\d{2}\b|\([^()\n]*\b\d{4}\s*[–-]\s*[^()\n]*\b\d{4}\)',t),str(p)
 assert all(x==x.rstrip() for x in t.splitlines()) and t.endswith('\n'),str(p)
va=load(P/'validation.json');assert not any(va[k] for k in ['canonicalAcceptance','externalEffects','SD3Started'])
for c in va['checks']:assert sha((R/c['logPath']).read_bytes())==c['logSha256']
git('diff','--check',ENTRY)
print(json.dumps(dict(outcome='PASS',recordedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),entryCommit=ENTRY,scope='Local held-research integrity only',checkpointInputs=20,cumulativeInitialDispositions=280,unprocessedInputs=126,fieldEnvelopes=fields,cumulativeHeldFields=5341,heldIdentities=280,sourceReceipts=24,newPublicRetrievals=23,nativeReadableRetrievals=1,evidenceReferences=refs,seedDispositions=seeds,sourceLinkDispositions=sum(len(s['linkDispositions']) for s in sources),historicalManifestReviewsVerified=history,protectedTrackedFiles=protected,priorCustodyPins=71,custodyGaps=gaps,M1Records=437,M1Pins=len(pins),acceptedFacts=0,SD3Started=False,nextInputKey=l['nextInputKey']),indent=2))
