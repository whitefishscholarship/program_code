"""Read-only audit of checkpoint016; never initialize/reset/replay an input."""
from pathlib import Path
import json,hashlib,subprocess,datetime,collections,re,os,sys
P=Path(__file__).resolve().parent;B=P.parent;R=P.parents[3]
ENTRY='65a5434288d458e6cfcd99dac6e6485a75c53cb7'
sha=lambda b:hashlib.sha256(b).hexdigest()
load=lambda p:json.loads(p.read_text())
def git(*a):return subprocess.check_output(['git',*a],cwd=R)
q=load(B/'queue.json');l=load(B/'checkpoint-016.json');prior=[load(B/f'checkpoint-{i:03d}.json') for i in range(1,16)]
assert l['entryCommit']==ENTRY and l['queueSha256']==sha((B/'queue.json').read_bytes())
assert len(q['records'])==406 and (l['queueOffsetStart'],l['queueOffsetEndExclusive'])==(300,320)
assert [r['inputKey'] for p in prior for r in p['records']]==[r['inputKey'] for r in q['records'][:300]]
assert l['orderedInputKeys']==[r['inputKey'] for r in q['records'][300:320]]==[r['inputKey'] for r in l['records']]
assert l['nextCheckpointInputOffset']==320 and l['nextInputKey']==q['records'][320]['inputKey']=='saved-405588227-row-326'
assert not any(l[k] for k in ['acceptedFacts','canonicalAcceptance','fullSD2Complete','SD3Started'])
aff={306:['sportys','aea'],307:['aea'],308:['aea'],309:['umhonors','umgeneral'],310:['umhonors','umgeneral'],311:['umhonors','umgeneral'],312:['equitable'],313:['dpw'],314:['csu'],315:['flatheadfailure','flathead','mtech'],316:['parkside','parkfile'],317:['wceafile'],318:['beta','betaalias'],319:['nths','hosa'],320:['nths','tsa'],321:['nths'],322:['naehcy','naeinstructions','naefaq'],323:['card'],324:['agc','byf','agccrit'],325:['aopa','aopafaq']}
sources=l['sourceRegistry'];assert sources==load(P/'source-receipts.json');reg={s['sourceId']:s for s in sources};assert len(reg)==27
texts={}
for s in sources:
 raw=(R/s['artifactPath']).read_bytes();assert sha(raw)==s['artifactSha256'];texts[s['sourceId']]=raw.decode()
 assert s['callStartedAt']<=s['callCompletedAt']==s['observedAt'] and s['depth']<=2
 assert all(s.get(k) for k in ['owner','trigger','nextAction','sourceScope'])
 assert not any(s[k] for k in ['rawArtifactRetained','originFreshnessVerified','completeRawPageImageInspection','nativePublicSponsorContinuityVerified'])
 assert s['sourceRevision'] is None and s['maxAgeRequested'] is None
 links=list(dict.fromkeys(re.findall(r'(?<=\]\()(https?://[^)\s]+)',raw.decode())))
 assert links==[d['renderedDestination'] for d in s['linkDispositions']]
 for d in s['linkDispositions']:
  assert all(d.get(k) for k in ['owner','trigger','nextAction','disposition'])
  assert d['sourceIds']==[t['sourceId'] for t in sources if d['url'] in [t['originalUrl'],t['finalUrl']]]
 if s['parentSourceId']:assert s['originalUrl'] in [d['url'] for d in reg[s['parentSourceId']]['linkDispositions']]
assert reg['flatheadfailure']['statusCode']==503 and reg['flathead']['statusCode']==200
assert reg['umgeneral']['finalUrl']=='https://www.umt.edu/student-financial-services/scholarships/default.php'
con=load(P/'source-concordance.json');assert len(con['checks'])==27 and con['independentSourceFidelity'] is False
for c in con['checks']:
 assert not c['unmatched'] and c['finalArtifactSha256']==reg[c['sourceId']]['artifactSha256']
assert len([s for s in sources if s['provider']=='Firecrawl connector'])==23
metas=load(P/'capture-metadata.json')['nativeMetadata'];assert len(metas)==6
assert [m['sourceId'] for m in metas if m['unexpectedFileType']]==['wcea','wceaslide']
assert all(not m['contentRead'] for m in metas if m['unexpectedFileType'])
fields=refs=seeds=0
for r,seed in zip(l['records'],q['records'][300:320]):
 for k,v in seed.items():
  if k=='status':continue
  if k=='recordedSeedUrls':v=[u if not u.startswith('mailto:') else '[contact locator withheld; see immutable queue hash/pointer]' for u in v]
  assert r[k]==v,(r['rowLocator'],k)
 assert r['allowedSourceIds']==aff[r['rowLocator']] and r['identityAcceptance']=='held'
 assert r['status']==r['outcome'] and all(r.get(k) for k in ['owner','trigger','nextAction'])
 assert len(r['seedDispositions'])==len(dict.fromkeys(seed['recordedSeedUrls']+seed['publishedSourceAliases']))
 for d,u in zip(r['seedDispositions'],dict.fromkeys(seed['recordedSeedUrls']+seed['publishedSourceAliases'])):
  seeds+=1;assert all(d.get(k) for k in ['owner','trigger','nextAction','disposition'])
  if u.startswith('mailto:'):assert d['url'] is None and d['urlSha256']==sha(u.encode()) and d['inputPointer']
  else:assert d['url']==u
  assert set(d['sourceIds'])<=set(r['allowedSourceIds'])
 for k,f in r['fieldProposals'].items():
  fields+=1;assert f['acceptance']=='held' and f['state'] in ['verified','unverified','unstated','inaccessible','conflict']
  assert all(f.get(k) for k in ['owner','trigger','nextAction','sourceScope','observedAt','freshness','semanticAssertion'])
  expected='Typed held observation: '+json.dumps(f['value'],ensure_ascii=False,separators=(',',':')) if f['value'] is not None else 'Unknown remains non-excluding.'
  assert f['semanticAssertion']==expected
  if f['state'] in ['verified','conflict']:assert f['evidence']
  for e in f['evidence']:
   s=reg[e['sourceId']];assert e['sourceId'] in r['allowedSourceIds']
   assert (e['sourceUrl'],e['artifactPath'],e['artifactSha256'])==(s['originalUrl'],s['artifactPath'],s['artifactSha256'])
   assert e['excerpt'] in texts[e['sourceId']] and e['locator'];refs+=1
cov=l['coverage'];assert cov['fieldEnvelopes']==fields==305
assert sum(len(r['fieldProposals']) for p in prior for r in p['records'])==5642
assert cov['cumulativeAutonomousHeldFields']==5947 and cov['cumulativeInitialDispositions']==cov['cumulativeAutonomousHeldIdentities']==320 and cov['unprocessedInputs']==86
assert cov['outcomes']==dict(collections.Counter(r['outcome'] for r in l['records']))=={'researched-held':18,'held-identity':1,'held-access':1}
rows={r['rowLocator']:r for r in l['records']};v=lambda n,k:rows[n]['fieldProposals'][k]['value']
assert v(306,'amount')['USD']==6000 and v(306,'affiliation')['tenureYearsMinimum']==1
assert rows[306]['fieldProposals']['eligibility']['state']=='conflict'
assert v(306,'materials')['essay']['maximumWords']==200 and v(306,'materials')['essay']['doubleSpaced']
assert len(v(306,'materials')['ratings'])==11 and 'Signature: [blank field omitted]' in texts['sportys']
assert rows[307]['outcome']=='held-identity' and v(307,'amount') is None and v(307,'unassignedProfile')['notAssignedToSavedName']
assert v(308,'amount')['USD']==1500
for n in [309,310,311]:
 assert v(n,'minimumGPA')['entryMinimum'] is None and v(n,'minimumGPA')['renewalMinimum']==3.4
 assert v(n,'renewal')['honorsExperiencesPerAcademicYearMinimum']==2 and v(n,'renewal')['averageCreditsPerAcademicYear']==30
 assert v(n,'cycle')['year'] is None and v(n,'application')['genericJuly1RuleNotTransferred']
assert v(312,'need')['required'] and v(312,'minimumGPA')['minimum']==2.5
assert v(312,'amount')['newAwardsUpTo']==100 and v(312,'amount')['separateEducatorGiftCardUSD']==500
assert v(312,'renewal')['professionalDevelopmentWorkshopsMinimumEachYear']==2
assert v(312,'materials')['IRS1040FirstTwoPagesMostRecentFiled']
assert v(313,'minimumGPA')['entry'] is None and v(313,'minimumGPA')['renewalMinimum']==2.0
assert v(313,'eligibility')['graduation']=='Spring/Summer2026'
assert rows[314]['fieldProposals']['cycle']['state']=='conflict' and v(314,'eligibility')['fullTimeRegularOnCampusCreditsMinimumPerSemester']==12
assert v(314,'amount')['baseAnnualUSD']==5000 and v(314,'amount')['separatePartnershipAnnualUSD']==3000
assert v(315,'amount')['awardsAnnually']==2 and v(315,'amount')['USD']==5000 and v(315,'programAdmission')['MMRDosesProof']==2
assert v(316,'amount')['exactCount'] is None and reg['parkfile']['conversionChars']==0
assert rows[317]['outcome']=='held-access' and v(317,'identityObservation')['unexpectedTypesHeld']
assert v(318,'minimumGPA')['minimum']==2 and v(318,'eligibility')['childOfBetaSigmaPhiMemberExcluded']
for n,p,c in [(319,'HOSA',7),(320,'TSA',3),(321,'SkillsUSA',4)]:
 assert v(n,'affiliation')['dualRequired']==['NTHS',p] and v(n,'amount')['awards']==c
assert v(320,'nomination')['notSeparateScholarshipNominationProof']
assert rows[322]['fieldProposals']['amount']['state']==rows[322]['fieldProposals']['cycle']['state']=='conflict'
assert v(322,'materials')['essay']['wordsRange']==[500,800] and v(322,'eligibility')['undocumentedEligible']
assert v(322,'materials')['recommendationMinimum']==1 and v(322,'eligibility')['NAEHCYPriorRecipientWithinYearsExcluded']==3
assert v(323,'materials')['originalEssay']['wordRange']==[500,900] and v(323,'minimumGPA')['minimum']==3.5
assert v(324,'minimumGPA')['entry'] is None and v(324,'minimumGPA')['renewalMinimum']==2.5
assert v(324,'amount')['checksDirectRecipientNotEducationalFacility'] and v(324,'materials')['onlineInstructorOrEmployerSupervisorEvaluation']
assert v(325,'materials')['referencesCount']==2 and v(325,'eligibility')['highSchoolStudentAgeInclusive']==[16,18]
assert v(325,'minimumGPA')['minimum']==2.7 and v(325,'minimumGPA')['transcriptCumulativeUnweightedScale']==4
assert v(325,'eligibility')['FAAprivatePilotWrittenExamBeforeSubmission'] and v(325,'amount')['flightTrainingExpiresMonthsAfterAward']==12
history=0
for folder in [B]+[B/f'checkpoint-{i:03d}' for i in range(2,16)]:
 mp=folder/('research-manifest.json' if folder==B else 'final-manifest.json');rp=folder/('research-review.json' if folder==B else 'review.json');m=load(mp);rv=load(rp);binding=rv.get('binding',rv)
 assert rv['outcome']=='PASS' and binding['candidateCommit']==m['candidateCommit'] and binding['manifestSha256']==sha(mp.read_bytes())
 assert sha(git('diff','--binary',m['entryCommit'],m['candidateCommit']))==m['completeDiffSha256']
 for f in m['changedFiles']:assert sha(git('show',m['candidateCommit']+':'+f['path']))==f['sha256']
 history+=1
mutable={'docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md','docs/CURRENT_HANDOFF.md','docs/evidence/sd2-autonomous/NEXT_SESSION.md'}
paths=set(git('diff','--name-only',ENTRY).decode().splitlines())|set(git('ls-files','--others','--exclude-standard').decode().splitlines())
assert all(p in mutable or p=='docs/evidence/sd2-autonomous/checkpoint-016.json' or p.startswith('docs/evidence/sd2-autonomous/checkpoint-016/') for p in paths),paths
protected=0
for line in git('ls-tree','-r',ENTRY).decode().splitlines():
 meta,path=line.split('\t');mode,typ,blob=meta.split()
 if path in mutable:continue
 f=R/path;raw=os.readlink(f).encode() if mode=='120000' else f.read_bytes()
 assert hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest()==blob,path
 if mode in ['100644','100755']:assert bool(f.stat().st_mode&0o111)==(mode=='100755'),path
 protected+=1
pp='docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md';t=(R/pp).read_text();old=git('show',ENTRY+':'+pp).decode();a='<!-- SD2-CHECKPOINT-016-START -->\n';z='<!-- SD2-CHECKPOINT-016-END -->\n'
if a in t:assert t.count(a)==t.count(z)==1 and t[:t.index(a)]+t[t.index(z)+len(z):]==old
else:assert t==old
for p in mutable-{pp}:assert (R/p).read_bytes().endswith(git('show',ENTRY+':'+p))
cust=load(P/'prior-custody-audit.json');oldcust=load(B/'checkpoint-015/prior-custody-audit.json');assert len(cust['pins'])==71
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
for p in [B/'checkpoint-016.json']+[f for f in P.rglob('*') if f.is_file() and f.suffix!='.py' and '.git' not in f.parts]:
 t=p.read_text();assert not re.search(r'\b[\w.%+-]+@[\w.-]+\.[A-Za-z]{2,}|[?&](?:token|sig|signature|se|ouid)=',t),str(p)
 assert not re.search(r'(?:\b\d{3}[-/.]|\(\d{3}\)\s*)\d{3}[-/.]\d{4}',t),str(p)
 assert all(x==x.rstrip() for x in t.splitlines()) and t.endswith('\n'),str(p)
va=load(P/'validation.json');assert not any(va[k] for k in ['canonicalAcceptance','externalEffects','SD3Started'])
for c in va['checks']:assert sha((R/c['logPath']).read_bytes())==c['logSha256']
assert [load(P/(n+'.json'))['exitCode'] for n in ['plan-retry','typecheck','tests-retry']]==[0,0,0]
assert load(P/'build.json')['exitCode']==1 and 'Operation not permitted' in (P/'build.log').read_text()
git('diff','--check',ENTRY)
if '--review-bound' in sys.argv:
 m=load(P/'final-manifest.json');rv=load(P/'review.json');binding=rv['binding']
 assert rv['outcome']=='PASS' and binding['candidateCommit']==m['candidateCommit'] and binding['manifestSha256']==sha((P/'final-manifest.json').read_bytes())
 assert rv['severityCounts']==dict(critical=0,high=0,medium=0,low=0)
 assert sha(git('diff','--binary',ENTRY,m['candidateCommit']))==m['completeDiffSha256']
 for f in m['changedFiles']:assert sha(git('show',m['candidateCommit']+':'+f['path']))==f['sha256']
 receipt=load(P/'local-review-receipt.json')['commit'];assert git('rev-parse',receipt+'^').decode().strip()==m['candidateCommit']
 assert set(git('diff','--name-only',m['candidateCommit'],receipt).decode().splitlines())=={'docs/evidence/sd2-autonomous/checkpoint-016/final-manifest.json','docs/evidence/sd2-autonomous/checkpoint-016/review.json'}
 for name in ['SESSION_WRAP.md','SESSION_CLOSE.md']:
  text=(P/name).read_text();assert all(x in text for x in ['owner','trigger','SD3','offset320','86','5947','437'])
print(json.dumps(dict(outcome='PASS',recordedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),entryCommit=ENTRY,scope='Local held-research integrity only',checkpointInputs=20,cumulativeInitialDispositions=320,unprocessedInputs=86,fieldEnvelopes=fields,cumulativeHeldFields=5947,heldIdentities=320,sourceReceipts=27,evidenceReferences=refs,seedDispositions=seeds,sourceLinkDispositions=sum(len(s['linkDispositions']) for s in sources),historicalManifestReviewsVerified=history,protectedTrackedFiles=protected,priorCustodyPins=71,custodyGaps=gaps,M1Records=437,M1Pins=len(pins),acceptedFacts=0,SD3Started=False,nextInputKey=l['nextInputKey'],reviewBound='--review-bound' in sys.argv),indent=2))
