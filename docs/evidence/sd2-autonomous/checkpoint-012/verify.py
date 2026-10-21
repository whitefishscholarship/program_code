"""Read-only checkpoint012 integrity/continuity audit. Never assembles or processes inputs."""
from pathlib import Path
import json,hashlib,subprocess,re,collections,datetime,os
P=Path(__file__).resolve().parent;B=P.parent;R=P.parents[3]
ENTRY='5e22fba162021403299555fe4c767f05eb3b5b65'
load=lambda p:json.loads(p.read_text());sha=lambda b:hashlib.sha256(b).hexdigest()
def git(*a):return subprocess.check_output(['git',*a],cwd=R)
l=load(B/'checkpoint-012.json');q=load(B/'queue.json');prior=[load(B/f'checkpoint-{i:03d}.json') for i in range(1,12)]
assert l['entryCommit']==ENTRY and l['queueSha256']==sha((B/'queue.json').read_bytes())
assert l['queueOffsetStart']==220 and l['queueOffsetEndExclusive']==240 and len(q['records'])==406
assert l['orderedInputKeys']==[x['inputKey'] for x in q['records'][220:240]] and len(set(l['orderedInputKeys']))==20
assert [r['inputKey'] for p in prior for r in p['records']]==[r['inputKey'] for r in q['records'][:220]]
assert l['nextCheckpointInputOffset']==240 and l['nextInputKey']==q['records'][240]['inputKey']=='saved-405588227-row-244'
assert not any(l[k] for k in ['acceptedFacts','canonicalAcceptance','fullSD2Complete','SD3Started'])
assert sum(len(r['fieldProposals']) for p in prior for r in p['records'])==4351
assert all(r['identityAcceptance']=='held' and all(f['acceptance']=='held' for f in r['fieldProposals'].values()) for p in prior for r in p['records'])
reg={s['sourceId']:s for s in l['sourceRegistry']};assert len(reg)==4 and l['sourceRegistry']==load(P/'source-receipts.json')
texts={}
for s in reg.values():
 assert s['depth']==0 and s['statusCode']==200 and s['originalUrl']==s['finalUrl']
 assert s['callStartedAt']<=s['callCompletedAt']==s['observedAt']
 assert all(s.get(k) for k in ['owner','trigger','nextAction','sourceScope'])
 raw=(R/s['artifactPath']).read_bytes();assert sha(raw)==s['artifactSha256'];texts[s['sourceId']]=raw.decode()
 assert not s['rawArtifactRetained'] and not s['originFreshnessVerified'] and not s['completeRawPageImageInspection']
 for d in s['linkDispositions']:
  assert d['url'] in texts[s['sourceId']] and not d['sourceIds']
  assert all(d.get(k) for k in ['owner','trigger','nextAction','disposition'])
refs=fields=seeds=0
for r,seed in zip(l['records'],q['records'][220:240]):
 for k in ['inputKey','rowLocator','recordedName','recordedSeedUrls','publishedSourceAliases','publicIdCandidates','identityBasis','identityAcceptance']:assert r[k]==seed[k],k
 assert r['status']==r['outcome'] and r['identityAcceptance']=='held'
 assert all(r.get(k) for k in ['owner','trigger','nextAction']) and set(r['allowedSourceIds'])<=set(reg)
 assert [d['url'] for d in r['seedDispositions']]==list(dict.fromkeys(seed['recordedSeedUrls']+seed['publishedSourceAliases']))
 for d in r['seedDispositions']:
  seeds+=1;assert set(d['sourceIds'])<=set(r['allowedSourceIds'])
  assert all(d.get(k) for k in ['owner','trigger','nextAction','disposition'])
  if 'jotform' in d['url']:assert d['sourceIds']==[] and 'no retrieval' in d['disposition']
  else:assert d['sourceIds']
 for f in r['fieldProposals'].values():
  fields+=1;assert f['acceptance']=='held' and f['state'] in ['verified','unverified','unstated','conflict','inaccessible']
  assert all(f.get(k) for k in ['owner','trigger','nextAction','sourceScope','observedAt','freshness'])
  if f['state'] in ['verified','conflict']:assert f['evidence']
  for e in f['evidence']:
   s=reg[e['sourceId']];assert e['sourceId'] in r['allowedSourceIds']
   assert e['artifactPath']==s['artifactPath'] and e['artifactSha256']==s['artifactSha256'] and e['sourceUrl']==s['originalUrl']
   assert e['excerpt'] in texts[e['sourceId']] and e['locator'];refs+=1
cov=l['coverage'];assert fields==cov['fieldEnvelopes']==370 and cov['cumulativeAutonomousHeldFields']==4351+fields==4721
assert cov['cumulativeInitialDispositions']==cov['cumulativeAutonomousHeldIdentities']==240
assert cov['unprocessedInputs']==166 and cov['sourceReceipts']==cov['newPublicRetrievals']==4
assert cov['outcomes']==dict(collections.Counter(r['outcome'] for r in l['records']))=={'researched-held':14,'held-identity':4,'held-access':2}
rows={r['rowLocator']:r for r in l['records']};v=lambda n,k:rows[n]['fieldProposals'][k]['value']
assert v(224,'eligibility')['pursuingDegreeIn']==['aviation management','dispatch','similar fields']
assert v(225,'eligibility')['RJetCadetWithRepublicRequired'] and v(225,'eligibility')['femaleCommercialPilot']
assert v(226,'eligibility')['WAIChapterMember'] and v(226,'eligibility')['worksWithYouthToPursueAviation']
assert v(226,'selection')['GirlsInAviationDayVolunteers']=='special consideration; not required'
assert v(227,'eligibility')['privatePilotCertificateRequired'] and v(228,'amount')['value']==250
assert v(228,'identityObservation')['redactedTitleNamedBody']
assert v(230,'minimumGPA')['scale']==4.0 and v(230,'need')['requiredNeedThresholdUnknown']
assert v(230,'materials')['childRequirements']['essay']['wordsMax']==1000
assert v(232,'eligibility')['flightHoursMinimum']==100 and v(232,'materials')['childRequirements']['currentWrittenTestResultsForRating']
assert v(233,'eligibility')['onExactBoundaryInterpretationUnknown'] and v(234,'eligibility')['beforeBoundaryIneligible']
for n in [229,231,237,239]:
 assert rows[n]['outcome']=='held-identity' and v(n,'identityObservation')['exactChildMapping'] is None
 assert v(n,'identityObservation')['noOrdinalMapping'] and v(n,'eligibility') is None and v(n,'amount') is None
for n in [235,236]:assert v(n,'eligibility')['UnitedAviateAcademyAcceptanceRequiredBeforeScholarship'] and v(n,'amount')['TBD'] and v(n,'relationship')['PAPAChildNotMerged']
assert v(238,'eligibility')['USSchoolsOnlyFromWAI'] and v(238,'eligibility')['militaryServiceRequirementNotEstablished']
assert v(238,'materials')['noVariantChosen'] and v(238,'paymentAndTrainingConditions')['WMAOneYearMembershipIncluded']
for n in [240,241]:
 assert rows[n]['outcome']=='held-access' and v(n,'parentGuidance')['rangeNotChildAmount'] and v(n,'cycle')['childAvailabilityUnverified']
 assert v(n,'amount') is None and v(n,'applicationMethod')['noLoginOrAction']
assert v(241,'eligibility')['activeStudentAtApplicationClose'] and v(241,'eligibility')['conditionalAcceptanceLetterFromUnitedAviateAcademy']
for n in [242,243]:
 assert v(n,'amount')['chosenAmount'] is None and v(n,'amount')['parentMechanicSlots']==4
 assert v(n,'amount')['variantsPerCampus']==[{'value':20000,'slots':1},{'value':10000,'slots':1}]
 assert v(n,'eligibility')['currentlySeniorAtUSHighSchool'] and v(n,'eligibility')['age18ByProgramCompletion']
 assert v(n,'materials')['essayScopeVariantHeld'] and v(n,'eligibility')['medicalRequirementIsPilotOnlyNotTransferred']
 assert v(n,'materials')['recommendationLetters']==2 and 'countOfLettersUnknown' not in v(n,'materials')
 rc=v(n,'materials')['recommenderConditions']
 assert rc['atLeastOne']=={'modality':'must','roles':['high school teacher','counselor','coach','other school official']}
 assert rc['bothMayBeSchoolOfficials']=={'modality':'may','value':True}
 assert rc['relativesIncludingGuardian']=={'modality':'must not','permitted':False}
 assert rc['adultsWhoServedSupervisoryRole']=={'modality':'should','value':True}
 assert rc['referenceContactInformation']=={'modality':'please ensure','requested':True,'valuesNotCollected':True}

 assert v(n,'paymentAndTrainingConditions')=={'startTrainingWithinMonths':12,'useWithinMonths':24}
 assert v(n,'cycle')['sourceSaysApplicationsClosed']
assert all(c['allSubstantivePassagesContained'] for c in load(P/'source-concordance.json')['checks'])
history=0
for folder in [B]+[B/f'checkpoint-{i:03d}' for i in range(2,12)]:
 mp=folder/('research-manifest.json' if folder==B else 'final-manifest.json');rp=folder/('research-review.json' if folder==B else 'review.json')
 m=load(mp);rv=load(rp);bind=rv.get('binding',rv)
 assert rv['outcome']=='PASS' and bind['candidateCommit']==m['candidateCommit'] and bind['manifestSha256']==sha(mp.read_bytes())
 assert sha(git('diff','--binary',m['entryCommit'],m['candidateCommit']))==m['completeDiffSha256']
 for f in m['changedFiles']:assert sha(git('show',m['candidateCommit']+':'+f['path']))==f['sha256']
 history+=1
# Preserve rejected round1 and require one count-matched author disposition.
if (P/'manifest-round1.json').exists():
 om=load(P/'manifest-round1.json');orr=load(P/'review-round1.json');rem=load(P/'remediation.json')
 assert om['candidateCommit']==orr['binding']['candidateCommit']=='4920769cc6cae3d62ca0772c2282dc6b81d0294c'
 assert sha((P/'manifest-round1.json').read_bytes())==orr['binding']['manifestSha256']==rem['priorManifestSha256']
 assert sha((P/'review-round1.json').read_bytes())==rem['priorReviewSha256']
 assert orr['outcome']=='FAIL' and orr['severityCounts']=={'critical':0,'high':0,'medium':1,'low':0}
 assert len(rem['dispositions'])==len(orr['findings'])==1 and rem['dispositions'][0]['id']==orr['findings'][0]['id']=='SD2-012-M1'
 assert all(rem['dispositions'][0].get(k) for k in ['rationale','owner','target'])
 assert sha((P/'verification-round1.json').read_bytes())==next(f['sha256'] for f in om['changedFiles'] if f['path'].endswith('/verification.json'))
 assert sha(git('diff','--binary',ENTRY,om['candidateCommit']))==om['completeDiffSha256']
 for f in om['changedFiles']:assert sha(git('show',om['candidateCommit']+':'+f['path']))==f['sha256']
mutable={'docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md','docs/CURRENT_HANDOFF.md','docs/evidence/sd2-autonomous/NEXT_SESSION.md'}
paths=set(git('diff','--name-only',ENTRY).decode().splitlines())|set(git('ls-files','--others','--exclude-standard').decode().splitlines())
assert all(x in mutable or x=='docs/evidence/sd2-autonomous/checkpoint-012.json' or x.startswith('docs/evidence/sd2-autonomous/checkpoint-012/') for x in paths),paths
# Inspect every pre-entry tracked file, preserving bytes/modes except the three prepend-only handoff paths.
protected=0
for line in git('ls-tree','-r',ENTRY).decode().splitlines():
 meta,path=line.split('\t');mode,typ,blob=meta.split()
 if path in mutable:continue
 f=R/path;raw=os.readlink(f).encode() if mode=='120000' else f.read_bytes()
 assert hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest()==blob,path
 if mode in ['100644','100755']:assert bool(f.stat().st_mode&0o111)==(mode=='100755'),path
 protected+=1
pp='docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md';t=(R/pp).read_text();old=git('show',ENTRY+':'+pp).decode();a='<!-- SD2-CHECKPOINT-012-START -->\n';z='<!-- SD2-CHECKPOINT-012-END -->\n'
if a in t:assert t.count(a)==t.count(z)==1 and t[:t.index(a)]+t[t.index(z)+len(z):]==old
else:assert t==old
for x in mutable-{pp}:assert (R/x).read_bytes().endswith(git('show',ENTRY+':'+x))
cust=load(P/'prior-custody-audit.json');oldcust=load(B/'checkpoint-011/prior-custody-audit.json');assert len(cust['pins'])==71
assert [(x['path'],x['recordedSha256']) for x in cust['pins']]==[(x['path'],x['recordedSha256']) for x in oldcust['pins']]
gaps=[]
for pin in cust['pins']:
 f=Path(pin['path']);actual=sha(f.read_bytes()) if f.exists() else None;assert actual==pin['observedSha256']
 if actual!=pin['recordedSha256']:gaps.append(pin['path'])
 assert all(pin.get(k) for k in ['owner','trigger','nextAction'])
assert gaps==cust['gaps']
pins=load(R/'docs/evidence/sd2-next-read-proposal/verification.json')['retainedM1Artifacts']
for pin in pins:assert sha(git('show','009fa57:'+pin['path']))==pin['sha256']
m1=json.loads(git('show','009fa57:docs/evidence/season-monitor-m1/inventory.json'));assert len(m1['records'])==len({r['id'] for r in m1['records']})==437
state=load(R/'docs/BUILD_STATE.json');assert state['activeStageId'] is None and state['nextPermittedStageId'] is None
datepat=re.compile(r'\b[A-Z][a-z]+\s+\d{1,2},\s+19\d{2}\b|\([^()\n]*\b\d{4}\s*[–-]\s*[^()\n]*\b\d{4}\)')
for p in [B/'checkpoint-012.json']+[x for x in P.rglob('*') if x.is_file()]:
 txt=p.read_text();assert not datepat.search(txt),str(p)
 assert not re.search(r'\b[\w.%+-]+@[\w.-]+\.[A-Za-z]{2,}|[?&](?:token|sig|signature|se|ouid)=',txt),str(p)
 assert not re.search(r'(?:\b\d{3}[-/.]|\(\d{3}\)\s*)\d{3}[-/.]\d{4}',txt),str(p)
 assert all(x==x.rstrip() for x in txt.splitlines()) and txt.endswith('\n'),str(p)
if (P/'validation.json').exists():
 va=load(P/'validation.json');assert not any(va[k] for k in ['canonicalAcceptance','externalEffects','SD3Started'])
 for receipt in va['checks']:assert sha((R/receipt['logPath']).read_bytes())==receipt['logSha256']
git('diff','--check',ENTRY)
print(json.dumps(dict(outcome='PASS',recordedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),scope='Local held-research integrity only',entryCommit=ENTRY,checkpointInputs=20,cumulativeInitialDispositions=240,unprocessedInputs=166,fieldEnvelopes=fields,cumulativeHeldFields=4721,heldIdentities=240,sourceReceipts=4,newPublicRetrievals=4,evidenceReferences=refs,seedDispositions=seeds,sourceLinkDispositions=sum(len(s['linkDispositions']) for s in reg.values()),historicalManifestReviewsVerified=history,protectedTrackedFiles=protected,priorCustodyPins=71,custodyGaps=gaps,M1Records=437,M1Pins=len(pins),acceptedFacts=0,SD3Started=False,nextInputKey=l['nextInputKey']),indent=2))
