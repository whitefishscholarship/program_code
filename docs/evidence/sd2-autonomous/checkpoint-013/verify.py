"""Read-only checkpoint013 integrity/continuity audit. Never assembles or processes inputs."""
from pathlib import Path
import json,hashlib,subprocess,re,collections,datetime,os
P=Path(__file__).resolve().parent;B=P.parent;R=P.parents[3]
ENTRY='cc146e6da7a977aa223d72f3be46d72c5503a181'
load=lambda p:json.loads(p.read_text());sha=lambda b:hashlib.sha256(b).hexdigest()
def git(*a):return subprocess.check_output(['git',*a],cwd=R)
l=load(B/'checkpoint-013.json');q=load(B/'queue.json');prior=[load(B/f'checkpoint-{i:03d}.json') for i in range(1,13)]
assert l['entryCommit']==ENTRY and l['queueSha256']==sha((B/'queue.json').read_bytes())
assert l['queueOffsetStart']==240 and l['queueOffsetEndExclusive']==260 and len(q['records'])==406
assert l['orderedInputKeys']==[x['inputKey'] for x in q['records'][240:260]] and len(set(l['orderedInputKeys']))==20
assert [r['inputKey'] for p in prior for r in p['records']]==[r['inputKey'] for r in q['records'][:240]]
assert l['nextCheckpointInputOffset']==260 and l['nextInputKey']==q['records'][260]['inputKey']=='saved-405588227-row-265'
assert not any(l[k] for k in ['acceptedFacts','canonicalAcceptance','fullSD2Complete','SD3Started'])
assert sum(len(r['fieldProposals']) for p in prior for r in p['records'])==4721
assert all(r['identityAcceptance']=='held' and all(f['acceptance']=='held' for f in r['fieldProposals'].values()) for p in prior for r in p['records'])
reg={s['sourceId']:s for s in l['sourceRegistry']};assert len(reg)==21 and l['sourceRegistry']==load(P/'source-receipts.json')
texts={}
for s in reg.values():
 assert s['depth'] in [0,1,2] and s['statusCode']==200
 if s['sourceId']=='epic':
  assert s['callStartedAt'] is None and s['callCompletedAt'] is None and s['timingLimit']
 else:assert s['callStartedAt']<=s['callCompletedAt']==s['observedAt']
 if s['originalUrl']!=s['finalUrl']:
  from urllib.parse import urlparse
  assert urlparse(s['originalUrl']).hostname==urlparse(s['finalUrl']).hostname
 assert all(s.get(k) for k in ['owner','trigger','nextAction','sourceScope'])
 raw=(R/s['artifactPath']).read_bytes();assert sha(raw)==s['artifactSha256'];texts[s['sourceId']]=raw.decode()
 assert not s['rawArtifactRetained'] and not s['originFreshnessVerified'] and not s['completeRawPageImageInspection']
 for d in s['linkDispositions']:
  assert d['renderedDestination'] in texts[s['sourceId']] and set(d['sourceIds'])<=set(reg)
  assert d['url']==d['renderedDestination'].replace('\\#','#') and '](' not in d['url'] and '[' not in d['url'] and not re.search(r'\s',d['url'])
  direct=[x['sourceId'] for x in reg.values() if d['url'] in [x['originalUrl'],x['finalUrl']]]
  if direct:assert set(direct)==set(d['sourceIds']) and 'deferred' not in d['disposition']
  if '#' in d['url'] and d['url'].split('#')[0] in [s['originalUrl'],s['finalUrl']] and '#kck-apply' not in d['url']:
   assert d['sourceIds']==[s['sourceId']] and 'same-document' in d['disposition'] and 'deferred' not in d['disposition']
  assert all(d.get(k) for k in ['owner','trigger','nextAction','disposition'])
# Every destination occurrence is accounted once; labels cannot masquerade as URLs.
for src in reg.values():
 expected=list(dict.fromkeys(re.findall(r'(?<=\]\()(https?://[^)\s]+)',texts[src['sourceId']])))
 assert [d['renderedDestination'] for d in src['linkDispositions']]==expected
refs=fields=seeds=0
for r,seed in zip(l['records'],q['records'][240:260]):
 for k in ['inputKey','rowLocator','recordedName','publishedSourceAliases','publicIdCandidates','identityBasis','identityAcceptance']:assert r[k]==seed[k],k
 assert r['status']==r['outcome'] and r['identityAcceptance']=='held'
 assert all(r.get(k) for k in ['owner','trigger','nextAction']) and set(r['allowedSourceIds'])<=set(reg)
 assert r['recordedSeedUrls']==[None if u.startswith('mailto:') else u for u in seed['recordedSeedUrls']]
 expected=list(dict.fromkeys(seed['recordedSeedUrls']+seed['publishedSourceAliases']))
 assert len(r['seedDispositions'])==len(expected)
 for d,u in zip(r['seedDispositions'],expected):
  if u.startswith('mailto:'):assert d['url'] is None and d['recordedLocatorSha256']==sha(u.encode()) and len(r['redactedSeedLocators'])==1
  else:assert d['url']==u
 for d in r['seedDispositions']:
  seeds+=1;assert set(d['sourceIds'])<=set(r['allowedSourceIds'])
  assert all(d.get(k) for k in ['owner','trigger','nextAction','disposition'])
  if d['url'] is None or re.search(r'jotform|login|mailto:',d['url']):assert not d['sourceIds']
 for f in r['fieldProposals'].values():
  fields+=1;assert f['acceptance']=='held' and f['state'] in ['verified','unverified','unstated','conflict','inaccessible']
  assert all(f.get(k) for k in ['owner','trigger','nextAction','sourceScope','observedAt','freshness'])
  if f['state'] in ['verified','conflict']:assert f['evidence']
  for e in f['evidence']:
   s=reg[e['sourceId']];assert e['sourceId'] in r['allowedSourceIds']
   assert e['artifactPath']==s['artifactPath'] and e['artifactSha256']==s['artifactSha256'] and e['sourceUrl']==s['originalUrl']
   assert e['excerpt'] in texts[e['sourceId']] and e['locator'];refs+=1
cov=l['coverage'];assert fields==cov['fieldEnvelopes']==320 and cov['cumulativeAutonomousHeldFields']==4721+fields==5041
assert cov['cumulativeInitialDispositions']==cov['cumulativeAutonomousHeldIdentities']==260
assert cov['unprocessedInputs']==146 and cov['sourceReceipts']==cov['newPublicRetrievals']==21
assert cov['outcomes']==dict(collections.Counter(r['outcome'] for r in l['records']))=={'researched-held':13,'held-identity':7}
rows={r['rowLocator']:r for r in l['records']};v=lambda n,k:rows[n]['fieldProposals'][k]['value']
assert set(rows)==set(range(244,265))-{255}
for n in [244,246,247]:
 assert v(n,'eligibility')['ThirdClassMedicalRequired'] and v(n,'materials')['communityServiceExtracurricularPDF']
 assert v(n,'materials')['recommendationLetters']==2 and v(n,'materials')['recommenderConditions']['relativesIncludingGuardian']['permitted'] is False
assert v(245,'amount')['chosenChildOrCampus'] is None and rows[245]['outcome']=='held-identity'
assert v(245,'eligibility')['mechanicNoMedicalTransferred'] and v(245,'materials')['mechanicEssayScopeVariantHeld']
assert v(248,'amount')['values']==[1500,1000,500] and v(249,'amount')['value']==2000
assert v(248,'eligibility')['AVTRIPMembershipForThisChildUnknown'] and v(249,'eligibility')['currentAVTRIPMemberRequired']
assert v(250,'affiliation')['numericNationalGPAUnknown'] and v(250,'materials')['accountVerificationDistinctFromApplicationCertification']
assert v(250,'renewal')['renewable'] is False and v(250,'amount')['FAQCurrentYearScopeUnbound']
assert v(251,'eligibility')['noUniversalFirstGenDefinition']
sub=v(252,'materials')['transcriptAndRecommendationSubmission'];rank=v(252,'materials')['schoolDoesNotRankCondition']
assert sub['modality']=='must' and sub['transcriptsRequiredByThisInstruction'] and not sub['mailAccepted'] and not sub['emailAttachmentsAccepted']
assert 'personal links emailed to counselors and recommenders' in sub['method'] and sub['noUploadOrApplicantMaterialCollected']
assert rank['condition']=='school does not rank students' and rank['modality']=='please ask school counselor to provide'
assert rank['requestedRankingOR']==['confidential ranking','percentile ranking'] and rank['visibleTo']=='review committee only; not applicant'
assert reg['referee']['linkDispositions'][0]['url']=='https://bold.org/scholarships/student-referee-scholarship/' and reg['referee']['linkDispositions'][0]['sourceIds']==['refereebold']
assert len(reg['nhsfaq']['linkDispositions'])==11 and all(d['sourceIds']==['nhsfaq'] for d in reg['nhsfaq']['linkDispositions'])
assert v(252,'renewal')['noVariantChosen'] and [x.get('MSUGPA',x.get('minimumCumulativeGPA')) for x in v(252,'renewal')['variants']]==[3.7,3.5]
assert v(252,'cycle')['chosenTimeZoneOrMidnightBoundary'] is None and v(252,'materials')['publicConversionHasShow2MoreUninspected']
assert v(253,'eligibility')['shouldQualifiers'] and v(253,'minimumGPA')['numericMinimum'] is None
assert v(254,'materials')['socialPlatformsMinimum']==2 and v(254,'reapplication')['priorRecipientsEligible'] is False
assert v(256,'minimumGPA')['entry']==3.4 and v(256,'renewal')['cumulativeGPAEachAcademicYear']==3.4
assert v(256,'renewal')['creditsAfter2_4_6Semesters']==[30,60,90] and v(256,'eligibility')['anyCombinationIncludingSeniorYear']
assert v(257,'cycle')['noCycleVariantChosenOrNewCycleOpenedFromOldRoute'] and v(257,'eligibility')['noIntersectionOrUnionAsCurrentEligibility']
assert v(258,'eligibility')['educationDegree']=='preferred, not required'
assert v(259,'eligibility')['degree']=='four-year undergraduate' and v(260,'need')['required']
assert v(261,'eligibility')['major']=='history' and v(262,'eligibility')['LGBTQIdentityNotMadeMandatory']
assert v(263,'eligibility')['noNarrowingToFamilyOnly'] and v(264,'materials')['AIgeneratedNotAccepted']
for n in [258,259,260,261,262,263]:assert rows[n]['outcome']=='held-identity' and v(n,'identityObservation')['providerRedactedTitle']
con=load(P/'source-concordance.json');assert len(con['checks'])==20 and all(c['allSelectedParagraphsContained'] for c in con['checks']) and con['epicLimit']
history=0
for folder in [B]+[B/f'checkpoint-{i:03d}' for i in range(2,13)]:
 mp=folder/('research-manifest.json' if folder==B else 'final-manifest.json');rp=folder/('research-review.json' if folder==B else 'review.json')
 m=load(mp);rv=load(rp);bind=rv.get('binding',rv)
 assert rv['outcome']=='PASS' and bind['candidateCommit']==m['candidateCommit'] and bind['manifestSha256']==sha(mp.read_bytes())
 assert sha(git('diff','--binary',m['entryCommit'],m['candidateCommit']))==m['completeDiffSha256']
 for f in m['changedFiles']:assert sha(git('show',m['candidateCommit']+':'+f['path']))==f['sha256']
 history+=1
# Preserve the rejected immutable candidate and count-match all author dispositions.
om=load(P/'manifest-round1.json');orr=load(P/'review-round1.json');rem=load(P/'remediation.json')
assert om['candidateCommit']==orr['binding']['candidateCommit']==rem['priorCandidateCommit']=='5ffc8ea51c33657db2715f83ffcae457379cb6e1'
assert sha((P/'manifest-round1.json').read_bytes())==orr['binding']['manifestSha256']==rem['priorManifestSha256']
assert sha((P/'review-round1.json').read_bytes())==rem['priorReviewSha256']
assert orr['outcome']=='FAIL' and orr['severityCounts']==dict(critical=0,high=0,medium=1,low=1)
assert [f['id'] for f in orr['findings']]==[d['id'] for d in rem['dispositions']]==['SD2-013-M1','SD2-013-L1']
assert all(all(d.get(k) for k in ['rationale','owner','target']) for d in rem['dispositions'])
assert sha((P/'verification-round1.json').read_bytes())==next(f['sha256'] for f in om['changedFiles'] if f['path'].endswith('/verification.json'))
assert sha(git('diff','--binary',ENTRY,om['candidateCommit']))==om['completeDiffSha256']
for f in om['changedFiles']:assert sha(git('show',om['candidateCommit']+':'+f['path']))==f['sha256']
mutable={'docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md','docs/CURRENT_HANDOFF.md','docs/evidence/sd2-autonomous/NEXT_SESSION.md'}
paths=set(git('diff','--name-only',ENTRY).decode().splitlines())|set(git('ls-files','--others','--exclude-standard').decode().splitlines())
assert all(x in mutable or x=='docs/evidence/sd2-autonomous/checkpoint-013.json' or x.startswith('docs/evidence/sd2-autonomous/checkpoint-013/') for x in paths),paths
# Inspect every pre-entry tracked file, preserving bytes/modes except the three prepend-only handoff paths.
protected=0
for line in git('ls-tree','-r',ENTRY).decode().splitlines():
 meta,path=line.split('\t');mode,typ,blob=meta.split()
 if path in mutable:continue
 f=R/path;raw=os.readlink(f).encode() if mode=='120000' else f.read_bytes()
 assert hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest()==blob,path
 if mode in ['100644','100755']:assert bool(f.stat().st_mode&0o111)==(mode=='100755'),path
 protected+=1
pp='docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md';t=(R/pp).read_text();old=git('show',ENTRY+':'+pp).decode();a='<!-- SD2-CHECKPOINT-013-START -->\n';z='<!-- SD2-CHECKPOINT-013-END -->\n'
if a in t:assert t.count(a)==t.count(z)==1 and t[:t.index(a)]+t[t.index(z)+len(z):]==old
else:assert t==old
for x in mutable-{pp}:assert (R/x).read_bytes().endswith(git('show',ENTRY+':'+x))
cust=load(P/'prior-custody-audit.json');oldcust=load(B/'checkpoint-012/prior-custody-audit.json');assert len(cust['pins'])==71
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
for p in [B/'checkpoint-013.json']+[x for x in P.rglob('*') if x.is_file()]:
 txt=p.read_text();assert not datepat.search(txt),str(p)
 assert not re.search(r'\b[\w.%+-]+@[\w.-]+\.[A-Za-z]{2,}|[?&](?:token|sig|signature|se|ouid)=',txt),str(p)
 assert not re.search(r'(?:\b\d{3}[-/.]|\(\d{3}\)\s*)\d{3}[-/.]\d{4}',txt),str(p)
 assert all(x==x.rstrip() for x in txt.splitlines()) and txt.endswith('\n'),str(p)
if (P/'validation.json').exists():
 va=load(P/'validation.json');assert not any(va[k] for k in ['canonicalAcceptance','externalEffects','SD3Started'])
 for receipt in va['checks']:assert sha((R/receipt['logPath']).read_bytes())==receipt['logSha256']
git('diff','--check',ENTRY)
print(json.dumps(dict(outcome='PASS',recordedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),scope='Local held-research integrity only',entryCommit=ENTRY,checkpointInputs=20,cumulativeInitialDispositions=260,unprocessedInputs=146,fieldEnvelopes=fields,cumulativeHeldFields=5041,heldIdentities=260,sourceReceipts=21,newPublicRetrievals=21,evidenceReferences=refs,seedDispositions=seeds,sourceLinkDispositions=sum(len(s['linkDispositions']) for s in reg.values()),historicalManifestReviewsVerified=history,protectedTrackedFiles=protected,priorCustodyPins=71,custodyGaps=gaps,M1Records=437,M1Pins=len(pins),acceptedFacts=0,SD3Started=False,nextInputKey=l['nextInputKey']),indent=2))
