"""Read-only checkpoint015 audit. Does not initialize or process any queue input."""
from pathlib import Path
import json,hashlib,subprocess,datetime,collections,re,os
P=Path(__file__).resolve().parent;B=P.parent;R=P.parents[3]
ENTRY='fc38c772799d4e285759cbc00041f5aa233aeb6b'
sha=lambda b:hashlib.sha256(b).hexdigest()
load=lambda p:json.loads(p.read_text())
def git(*a):return subprocess.check_output(['git',*a],cwd=R)
q=load(B/'queue.json');l=load(B/'checkpoint-015.json');prior=[load(B/f'checkpoint-{i:03d}.json') for i in range(1,15)]
assert git('branch','--show-current').decode().strip()=='codex/plan-student-data-maintenance'
assert l['entryCommit']==ENTRY and l['queueSha256']==sha((B/'queue.json').read_bytes())
assert len(q['records'])==406 and (l['queueOffsetStart'],l['queueOffsetEndExclusive'])==(280,300)
assert l['orderedInputKeys']==[r['inputKey'] for r in q['records'][280:300]]==[r['inputKey'] for r in l['records']]
assert [r['inputKey'] for p in prior for r in p['records']]==[r['inputKey'] for r in q['records'][:280]]
assert len(set(l['orderedInputKeys']))==20 and l['nextCheckpointInputOffset']==300
assert l['nextInputKey']==q['records'][300]['inputKey']=='saved-405588227-row-306'
assert not any(l[k] for k in ['acceptedFacts','canonicalAcceptance','fullSD2Complete','SD3Started'])
assert sum(len(r['fieldProposals']) for p in prior for r in p['records'])==5341
sources=l['sourceRegistry'];assert sources==load(P/'source-receipts.json');reg={s['sourceId']:s for s in sources}
assert len(reg)==14 and all(s['provider']=='Firecrawl connector' for s in sources)
texts={}
for s in sources:
 assert s['callStartedAt']<=s['callCompletedAt']==s['observedAt'] and s['statusCode']==200
 assert s['depth'] in [0,1] and (s['depth']==0 or s['parentSourceId'] in reg)
 assert not any(s[k] for k in ['rawArtifactRetained','originFreshnessVerified','completeRawPageImageInspection','nativePublicSponsorContinuityVerified'])
 assert s['sourceRevision'] is None and s['maxAgeRequested'] is None
 raw=(R/s['artifactPath']).read_bytes();assert sha(raw)==s['artifactSha256'];texts[s['sourceId']]=raw.decode()
 links=list(dict.fromkeys(re.findall(r'(?<=\]\()(https?://[^)\s]+)',raw.decode())))
 assert links==[d['renderedDestination'] for d in s['linkDispositions']]
 for d in s['linkDispositions']:
  assert d['url']==d['renderedDestination']
  assert all(d.get(k) for k in ['owner','trigger','nextAction','disposition'])
  assert d['sourceIds']==[t['sourceId'] for t in sources if d['url'] in [t['originalUrl'],t['finalUrl']]]
 if s['parentSourceId']:assert s['originalUrl'] in [d['url'] for d in reg[s['parentSourceId']]['linkDispositions']]
aff={285:['heroes','heroesfaq'],286:['nfpa'],287:['gtmf','gtmfalias'],288:['duck','duckrules'],289:['nth'],291:['hpfy'],292:['hpfy'],293:['afsa']}
aff.update({n:['aea']+{294:['freeland'],298:['baker'],300:['cook']}.get(n,[]) for n in range(294,306)})
refs=fields=seeds=0
for r,seed in zip(l['records'],q['records'][280:300]):
 for k,v in seed.items():
  if k!='status':assert r[k]==v,(r['rowLocator'],k)
 assert r['status']==r['outcome'] and r['identityAcceptance']=='held'
 assert all(r.get(k) for k in ['owner','trigger','nextAction']) and r['allowedSourceIds']==aff[r['rowLocator']]
 assert [d['url'] for d in r['seedDispositions']]==list(dict.fromkeys(seed['recordedSeedUrls']+seed['publishedSourceAliases']))
 for d in r['seedDispositions']:
  seeds+=1;assert all(d.get(k) for k in ['owner','trigger','nextAction','disposition'])
  assert set(d['sourceIds'])<=set(r['allowedSourceIds'])
 for k,f in r['fieldProposals'].items():
  fields+=1;assert f['acceptance']=='held' and f['state'] in ['verified','unverified','unstated','inaccessible','conflict']
  assert all(f.get(k) for k in ['owner','trigger','nextAction','sourceScope','observedAt','freshness','semanticAssertion'])
  expected='Typed held observation: '+json.dumps(f['value'],ensure_ascii=False,separators=(',',':')) if f['value'] is not None else 'Unknown remains non-excluding.'
  assert f['semanticAssertion']==expected
  if f['state'] in ['verified','conflict']:assert f['evidence']
  for e in f['evidence']:
   s=reg[e['sourceId']];assert e['sourceId'] in r['allowedSourceIds']
   assert e['sourceUrl']==s['originalUrl'] and e['artifactPath']==s['artifactPath'] and e['artifactSha256']==s['artifactSha256']
   assert e['excerpt'] in texts[e['sourceId']] and e['locator'];refs+=1
cov=l['coverage'];assert cov['fieldEnvelopes']==fields==301 and cov['cumulativeAutonomousHeldFields']==5341+fields==5642
assert cov['cumulativeInitialDispositions']==cov['cumulativeAutonomousHeldIdentities']==300 and cov['unprocessedInputs']==106
assert cov['sourceReceipts']==cov['newPublicRetrievals']==14 and cov['nativeReadableRetrievals']==0
assert cov['outcomes']==dict(collections.Counter(r['outcome'] for r in l['records']))=={'researched-held':12,'held-identity':8}
rows={r['rowLocator']:r for r in l['records']};v=lambda n,k:rows[n]['fieldProposals'][k]['value']
assert v(285,'minimumGPA')['highSchool']==3 and v(285,'minimumGPA')['college']==2.5
assert v(285,'eligibility')['enrollmentOR']==['enroll','plan to enroll'] and len(v(285,'eligibility')['additionalOR'])==3
assert v(285,'eligibility')['ageAndUSIDTiming']=='first scheduled day of fall classes for award academic year'
assert v(285,'need')['needBased'] is False and v(285,'materials')['parentSponsorGuardianDigitalSignature']
assert v(285,'reapplication')['priorApplicants'] and v(285,'amount')['fullyCoveredTuition']
assert rows[286]['fieldProposals']['eligibility']['state']=='conflict' and v(286,'eligibility')['ageConflictUnresolved']
assert v(286,'materials')['postAward']==['college acceptance copy','enrollment proof']
assert v(287,'cycle')['2027']['deadline']=='2027-05-03' and v(287,'amount')['amountCycle'].startswith('2026')
assert texts['gtmf']==texts['gtmfalias'] and v(287,'materials')['firstRound']=='pre-screened video online'
assert v(288,'cycle')['entryClose']=='2026-06-03T12:00:00 ET' and v(288,'cycle')['overallEnd'].startswith('2026-07-13')
assert rows[288]['fieldProposals']['cycle']['state']=='conflict'
assert v(288,'amount')['statedScholarshipPrizeCount']==13 and v(288,'amount')['cashPrizesSeparateCount']==4
assert v(288,'materials')['generativeAIAnyPortion'] is False and v(288,'materials')['basicGrammarSpellingReferencesAllowed']
assert v(288,'materials')['photos']['count']==[1,5] and v(288,'application')['finalistReleaseReturnDays']==2
assert v(288,'application')['votingTieEssay']['maxWords']==150 and v(288,'application')['votingTieEssay']['responseDays']==3
assert v(289,'cycle')['year'] is None and v(289,'affiliation')['dualRequired']==['NTHS','FBLA']
assert v(291,'eligibility')['fullTimeOrPartTime'] and v(292,'eligibility')['fullTime']
assert v(291,'minimumGPA')['selectionUsesGPA'] is False and v(292,'minimumGPA')['minimum']==3
assert v(291,'materials')['essay']['minimumWords']==v(292,'materials')['essay']['minimumWords']==500
assert v(292,'eligibility')['communityVolunteerHoursMinimum']==100 and v(292,'eligibility')['collectionPeriodYears']==2
assert v(293,'cycle')['closes']=='2026-08-31 12:59 CDT' and v(293,'materials')['twoFormsID']
assert v(293,'minimumGPA')['required'] is False and v(293,'need')['incomeRequirement'] is False
assert rows[294]['fieldProposals']['studyPath']['state']=='conflict' and v(294,'affiliation')['AEAEmployerTenureYearsMinimum']==1
assert v(294,'materials')['essay']['maximumWords']==200 and v(294,'materials')['essay']['doubleSpaced']
assert v(294,'amountUse')['employerDisburses']
for n in [298,300]:
 assert rows[n]['outcome']=='held-identity' and v(n,'minimumGPA')['minimum']==2.5 and v(n,'minimumGPA')['scale']==4
 assert v(n,'cycle')['receivedDeadline']=='2027-04-01' and v(n,'cycle')['topDeadlineRedacted']
 assert v(n,'materials')['essay']['maximumWords']==300 and v(n,'materials')['recommendation']['dated'] and v(n,'materials')['recommendation']['signed']
for n in [295,297,301,302,303,304]:
 assert rows[n]['outcome']=='held-identity' and v(n,'amount') is None and v(n,'eligibility') is None
for n,amt in [(296,2000),(299,2500),(305,1000)]:
 assert v(n,'amount')['USD']==amt and v(n,'eligibility')['enrollmentOR']==['plans to attend','attending']
con=load(P/'source-concordance.json');assert len(con['checks'])==14 and all(not c['unmatched'] for c in con['checks'])
history=0
for folder in [B]+[B/f'checkpoint-{i:03d}' for i in range(2,15)]:
 mp=folder/('research-manifest.json' if folder==B else 'final-manifest.json');rp=folder/('research-review.json' if folder==B else 'review.json');m=load(mp);rv=load(rp);binding=rv.get('binding',rv)
 assert rv['outcome']=='PASS' and binding['candidateCommit']==m['candidateCommit'] and binding['manifestSha256']==sha(mp.read_bytes())
 assert sha(git('diff','--binary',m['entryCommit'],m['candidateCommit']))==m['completeDiffSha256']
 for f in m['changedFiles']:assert sha(git('show',m['candidateCommit']+':'+f['path']))==f['sha256']
 history+=1
mutable={'docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md','docs/CURRENT_HANDOFF.md','docs/evidence/sd2-autonomous/NEXT_SESSION.md'}
paths=set(git('diff','--name-only',ENTRY).decode().splitlines())|set(git('ls-files','--others','--exclude-standard').decode().splitlines())
assert all(p in mutable or p=='docs/evidence/sd2-autonomous/checkpoint-015.json' or p.startswith('docs/evidence/sd2-autonomous/checkpoint-015/') for p in paths),paths
protected=0
for line in git('ls-tree','-r',ENTRY).decode().splitlines():
 meta,path=line.split('\t');mode,typ,blob=meta.split()
 if path in mutable:continue
 f=R/path;raw=os.readlink(f).encode() if mode=='120000' else f.read_bytes()
 assert hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest()==blob,path
 if mode in ['100644','100755']:assert bool(f.stat().st_mode&0o111)==(mode=='100755'),path
 protected+=1
pp='docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md';t=(R/pp).read_text();old=git('show',ENTRY+':'+pp).decode();a='<!-- SD2-CHECKPOINT-015-START -->\n';z='<!-- SD2-CHECKPOINT-015-END -->\n'
if a in t:assert t.count(a)==t.count(z)==1 and t[:t.index(a)]+t[t.index(z)+len(z):]==old
else:assert t==old
for p in mutable-{pp}:assert (R/p).read_bytes().endswith(git('show',ENTRY+':'+p))
cust=load(P/'prior-custody-audit.json');oldcust=load(B/'checkpoint-014/prior-custody-audit.json');assert len(cust['pins'])==71
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
for p in [B/'checkpoint-015.json']+[f for f in P.rglob('*') if f.is_file()]:
 t=p.read_text();assert not re.search(r'\b[\w.%+-]+@[\w.-]+\.[A-Za-z]{2,}|[?&](?:token|sig|signature|se|ouid)=',t),str(p)
 assert not re.search(r'(?:\b\d{3}[-/.]|\(\d{3}\)\s*)\d{3}[-/.]\d{4}',t),str(p)
 assert not re.search(r'\[phone redacted\]\s+(?:ext\.?|extension)\s*\d+',t,re.I),str(p)
 assert all(x==x.rstrip() for x in t.splitlines()) and t.endswith('\n'),str(p)
va=load(P/'validation.json');assert not any(va[k] for k in ['canonicalAcceptance','externalEffects','SD3Started'])
for c in va['checks']:assert sha((R/c['logPath']).read_bytes())==c['logSha256']
assert len(va['checks'])==7 and [load(P/(n+'.json'))['exitCode'] for n in ['plan-retry','typecheck','tests-retry','build','build-retry']]==[0,0,0,1,1]
for n in ['build','build-retry']:assert 'Operation not permitted' in (P/(n+'.log')).read_text()
git('diff','--check',ENTRY)
print(json.dumps(dict(outcome='PASS',recordedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),entryCommit=ENTRY,scope='Local held-research integrity only',checkpointInputs=20,cumulativeInitialDispositions=300,unprocessedInputs=106,fieldEnvelopes=fields,cumulativeHeldFields=5642,heldIdentities=300,sourceReceipts=14,evidenceReferences=refs,seedDispositions=seeds,sourceLinkDispositions=sum(len(s['linkDispositions']) for s in sources),historicalManifestReviewsVerified=history,protectedTrackedFiles=protected,priorCustodyPins=71,custodyGaps=gaps,M1Records=437,M1Pins=len(pins),acceptedFacts=0,SD3Started=False,nextInputKey=l['nextInputKey']),indent=2))
