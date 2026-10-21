"""Read-only checkpoint011 evidence, held-state and continuity audit. Never assemble."""
from pathlib import Path
import json,hashlib,datetime,subprocess,re,collections
P=Path(__file__).resolve().parent;B=P.parent;R=P.parents[3]
ENTRY='7343656bd849e8651e2b0e0ec44f97341d5f1533'
load=lambda p:json.loads(p.read_text());sha=lambda x:hashlib.sha256(x).hexdigest()
def git(*a):return subprocess.check_output(['git',*a],cwd=R)
l=load(B/'checkpoint-011.json');q=load(B/'queue.json');prior=[load(B/f'checkpoint-{i:03d}.json') for i in range(1,11)]
assert l['entryCommit']==ENTRY and l['queueSha256']==sha((B/'queue.json').read_bytes())
assert l['queueOffsetStart']==200 and l['queueOffsetEndExclusive']==220
assert l['orderedInputKeys']==[r['inputKey'] for r in q['records'][200:220]]
assert len(l['records'])==len(set(l['orderedInputKeys']))==20
assert [r['inputKey'] for p in prior for r in p['records']]==[r['inputKey'] for r in q['records'][:200]]
assert l['nextCheckpointInputOffset']==220 and l['nextInputKey']==q['records'][220]['inputKey']=='saved-405588227-row-224'
assert not any(l[k] for k in ['acceptedFacts','canonicalAcceptance','fullSD2Complete','SD3Started'])
assert sum(len(r['fieldProposals']) for p in prior for r in p['records'])==3939
assert all(r['identityAcceptance']=='held' and all(f['acceptance']=='held' for f in r['fieldProposals'].values()) for p in prior for r in p['records'])
reg={s['sourceId']:s for s in l['sourceRegistry']};assert len(reg)==4 and l['sourceRegistry']==load(P/'source-receipts.json')
texts={}
for s in reg.values():
 assert s['depth']<=2 and s['statusCode']==200 and s['originalUrl']==s['finalUrl']
 assert s['callStartedAt']<=s['callCompletedAt']==s['observedAt']
 assert all(s.get(k) for k in ['owner','trigger','nextAction','sourceScope'])
 raw=(R/s['artifactPath']).read_bytes();assert sha(raw)==s['artifactSha256'];texts[s['sourceId']]=raw.decode()
 assert not s['rawArtifactRetained'] and not s['originFreshnessVerified'] and not s['completeRawPageImageInspection']
 for d in s['linkDispositions']:
  assert all(d.get(k) for k in ['owner','trigger','nextAction','disposition'])
  assert set(d['sourceIds'])<=set(reg)
  assert (d.get('url') or d['rawLocator']) in texts[s['sourceId']]
assert reg['financial']['parentSourceId']=='isa' and reg['financial']['depth']==1
refs=fields=seeds=0
for r,seed in zip(l['records'],q['records'][200:220]):
 for k in ['inputKey','rowLocator','recordedName','recordedSeedUrls','publishedSourceAliases','publicIdCandidates','identityBasis','identityAcceptance']:assert r[k]==seed[k],k
 assert r['identityAcceptance']=='held' and r['status']==r['outcome']
 assert all(r.get(k) for k in ['owner','trigger','nextAction'])
 assert set(r['allowedSourceIds'])<=set(reg)
 assert [d['url'] for d in r['seedDispositions']]==list(dict.fromkeys(seed['recordedSeedUrls']+seed['publishedSourceAliases']))
 for d in r['seedDispositions']:
  seeds+=1;assert d['sourceIds'] and set(d['sourceIds'])<=set(r['allowedSourceIds'])
  assert all(d.get(k) for k in ['owner','trigger','nextAction','disposition'])
 for f in r['fieldProposals'].values():
  fields+=1;assert f['acceptance']=='held' and f['state'] in ['verified','unverified','unstated','conflict','inaccessible']
  assert all(f.get(k) for k in ['owner','trigger','nextAction','sourceScope','observedAt','freshness'])
  if f['state'] in ['verified','conflict']:assert f['evidence']
  for e in f['evidence']:
   s=reg[e['sourceId']];assert e['sourceId'] in r['allowedSourceIds']
   assert e['artifactPath']==s['artifactPath'] and e['artifactSha256']==s['artifactSha256'] and e['sourceUrl']==s['originalUrl']
   assert e['excerpt'] in texts[e['sourceId']] and e['locator'];refs+=1
cov=l['coverage'];assert fields==cov['fieldEnvelopes']==412
assert cov['cumulativeAutonomousHeldFields']==3939+fields==4351
assert cov['cumulativeInitialDispositions']==cov['cumulativeAutonomousHeldIdentities']==220
assert cov['unprocessedInputs']==186 and cov['sourceReceipts']==cov['newPublicRetrievals']==4
assert cov['outcomes']==dict(collections.Counter(r['outcome'] for r in l['records']))=={'researched-held':12,'held-identity':8}
rows={r['rowLocator']:r for r in l['records']};v=lambda n,k:rows[n]['fieldProposals'][k]['value']
assert v(204,'minimumGPA')['requirementWording']=='should' and v(204,'minimumGPA')['scopeAndGrammarAmbiguous']
assert v(206,'eligibility')['medicalAlternatives']['oneOrOtherRequired'] and v(206,'eligibility')['privatePilotCertificateRequired']
assert v(206,'amount')['recipientSlots']==3 and v(208,'amount')['recipientSlots']==2
assert v(212,'eligibility')['audienceNotFormalPrerequisite']
assert v(214,'amount')['recipientSlotsMinimum']==2 and v(215,'amount')['value'] is None
for n in [214,215]:
 assert rows[n]['fieldProposals']['deadline']['state']=='conflict' and v(n,'deadline')['chosenDeadline'] is None
 assert rows[n]['fieldProposals']['applicationMethod']['state']=='conflict' and v(n,'applicationMethod')['chosenRoute'] is None
 assert v(n,'materials')['highestAcademicTranscriptOnlyIfCollegeUniversityEnrolled'] and v(n,'materials')['FAAInquiryIncidentDetailsOrNone']
 assert v(n,'reapplication')['oneLifetimeAward'] and v(n,'paymentAndTrainingConditions')['recipientResponsibleFor']
assert v(215,'eligibility')['commandInstrumentRatingRequired'] and v(215,'reapplication')['mayApplyBothISAProgramsSameYear']
assert v(220,'eligibility')['currentOrIncomingLIFTStudent'] and v(220,'eligibility')['notMergedWithNGPA']
assert v(222,'eligibility')['commercialPilotLicenseRequired'] and v(222,'eligibility')['workingTowardCFIRating']
for n in [205,207,209,210,213,216,218,219]:
 assert rows[n]['outcome']=='held-identity' and v(n,'identityObservation')['exactChildMapping'] is None
 assert v(n,'identityObservation')['noOrdinalMapping'] and v(n,'eligibility') is None and v(n,'amount') is None
look=load(P/'identity-lookup.json');assert len(look['checks'])==9 and sum(x['exactFragmentObserved'] for x in look['checks'])==1 and not any(x['identityMappingAccepted'] for x in look['checks'])
history=0
for folder in [B]+[B/f'checkpoint-{i:03d}' for i in range(2,11)]:
 mp=folder/('research-manifest.json' if folder==B else 'final-manifest.json');rp=folder/('research-review.json' if folder==B else 'review.json')
 m=load(mp);rv=load(rp);bind=rv.get('binding',rv)
 assert rv['outcome']=='PASS' and bind['candidateCommit']==m['candidateCommit'] and bind['manifestSha256']==sha(mp.read_bytes())
 assert sha(git('diff','--binary',m['entryCommit'],m['candidateCommit']))==m['completeDiffSha256']
 for f in m['changedFiles']:assert sha(git('show',m['candidateCommit']+':'+f['path']))==f['sha256']
 history+=1
mutable={'docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md','docs/CURRENT_HANDOFF.md','docs/evidence/sd2-autonomous/NEXT_SESSION.md'}
paths=set(git('diff','--name-only',ENTRY).decode().splitlines())|set(git('ls-files','--others','--exclude-standard').decode().splitlines())
assert all(x in mutable or x=='docs/evidence/sd2-autonomous/checkpoint-011.json' or x.startswith('docs/evidence/sd2-autonomous/checkpoint-011/') for x in paths),paths
pp='docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md';t=(R/pp).read_text();old=git('show',ENTRY+':'+pp).decode();a='<!-- SD2-CHECKPOINT-011-START -->\n';z='<!-- SD2-CHECKPOINT-011-END -->\n'
if a in t:assert t.count(a)==t.count(z)==1 and t[:t.index(a)]+t[t.index(z)+len(z):]==old
else:assert t==old
for x in mutable-{pp}:assert (R/x).read_bytes().endswith(git('show',ENTRY+':'+x))
cust=load(P/'prior-custody-audit.json');oldcust=load(B/'checkpoint-010/prior-custody-audit.json');assert len(cust['pins'])==71
assert [(x['path'],x['recordedSha256']) for x in cust['pins']]==[(x['path'],x['recordedSha256']) for x in oldcust['pins']]
gaps=[]
for pin in cust['pins']:
 f=Path(pin['path']);actual=sha(f.read_bytes()) if f.exists() else None;assert actual==pin['observedSha256']
 if actual!=pin['recordedSha256']:gaps.append(pin['path'])
 assert all(pin.get(k) for k in ['owner','trigger','nextAction'])
assert gaps==cust['gaps']==[]
pins=load(R/'docs/evidence/sd2-next-read-proposal/verification.json')['retainedM1Artifacts']
for p in pins:assert sha(git('show','009fa57:'+p['path']))==p['sha256']
m1=json.loads(git('show','009fa57:docs/evidence/season-monitor-m1/inventory.json'));assert len(m1['records'])==len({r['id'] for r in m1['records']})==437
state=load(R/'docs/BUILD_STATE.json');assert state['activeStageId'] is None and state['nextPermittedStageId'] is None
datepat=re.compile(r'\b[A-Z][a-z]+\s+\d{1,2},\s+19\d{2}\b|\([^()\n]*\b\d{4}\s*[–-]\s*[^()\n]*\b\d{4}\)')
for p in [B/'checkpoint-011.json']+[x for x in P.rglob('*') if x.is_file()]:
 text=p.read_text();assert not datepat.search(text),str(p)
 assert not re.search(r'\b[\w.%+-]+@[\w.-]+\.[A-Za-z]{2,}|[?&](?:token|sig|signature|se|ouid)=',text),str(p)
 assert not re.search(r'(?:\b\d{3}[-/.]|\(\d{3}\)\s*)\d{3}[-/.]\d{4}',text),str(p)
 assert all(x==x.rstrip() for x in text.splitlines()) and text.endswith('\n'),str(p)
if (P/'validation.json').exists():
 va=load(P/'validation.json');assert not any(va[k] for k in ['canonicalAcceptance','externalEffects','SD3Started'])
 for receipt in va['checks']:assert sha((R/receipt['logPath']).read_bytes())==receipt['logSha256']
git('diff','--check',ENTRY)
print(json.dumps(dict(outcome='PASS',recordedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),scope='Local held-research integrity only',entryCommit=ENTRY,checkpointInputs=20,cumulativeInitialDispositions=220,unprocessedInputs=186,fieldEnvelopes=fields,cumulativeHeldFields=4351,heldIdentities=220,sourceReceipts=4,newPublicRetrievals=4,evidenceReferences=refs,seedDispositions=seeds,sourceLinkDispositions=sum(len(s['linkDispositions']) for s in reg.values()),historicalManifestReviewsVerified=history,priorCustodyPins=71,custodyGaps=gaps,M1Records=437,M1Pins=len(pins),acceptedFacts=0,SD3Started=False,nextInputKey=l['nextInputKey']),indent=2))
