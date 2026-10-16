"""Read-only checkpoint020 evidence and preservation audit; never changes a queue."""
from pathlib import Path
import json,hashlib,subprocess,datetime,collections,re,os,sys
P=Path(__file__).resolve().parent;B=P.parent;R=P.parents[3]
ENTRY='59fa4da23e84de267c2f58af15ee5c6d23074ecd'
load=lambda p:json.loads(p.read_text());sha=lambda b:hashlib.sha256(b).hexdigest()
def git(*a):return subprocess.check_output(['git',*a],cwd=R)
q=load(B/'queue.json');l=load(B/'checkpoint-020.json');prior=[load(B/f'checkpoint-{i:03d}.json') for i in range(1,20)]
assert l['entryCommit']==ENTRY and sha((B/'queue.json').read_bytes())==l['queueSha256']
assert len(q['records'])==406 and (l['queueOffsetStart'],l['queueOffsetEndExclusive'])==(380,400)
assert [r['inputKey'] for p in prior for r in p['records']]==[r['inputKey'] for r in q['records'][:380]]
assert l['orderedInputKeys']==[r['inputKey'] for r in l['records']]==[r['inputKey'] for r in q['records'][380:400]]
assert l['nextCheckpointInputOffset']==400 and l['nextInputKey']==q['records'][400]['inputKey']=='saved-405588227-row-407'
assert l['nextInputName']==q['records'][400]['recordedName']
assert not any(l[k] for k in ['acceptedFacts','canonicalAcceptance','fullSD2Complete','SD3Started'])
assert l['sourceRegistry']==load(P/'source-receipts.json') and len(l['sourceRegistry'])==1
s=l['sourceRegistry'][0];raw=(R/s['artifactPath']).read_bytes();t=raw.decode()
assert sha(raw)==s['artifactSha256'] and sha(s['originalUrl'].encode())==s['originalUrlSha256']
assert s['sourceId']=='aopa' and s['statusCode']==200 and s['originalUrl']==s['finalUrl']=='https://www.aopa.org/training-and-safety/students/aopa-flight-training-scholarships'
assert s['sourceRevision'] is None and s['convertedTextSha256'] is None and s['maxAgeRequested']==0 and s['depth']==0
assert s['callStartedAt']<=s['callCompletedAt']==s['observationRecordedAt']
assert not any(s[k] for k in ['rawArtifactRetained','originalNativeVisualFidelityVerified','originFreshnessVerified','completeRawPageImageInspection'])
assert s['selectionAccounting']['selectedCharacters']==s['selectedCharacters']==len(t)
meta=load(P/'capture-metadata.json')['sources'][0]
assert all(s[k]==v for k,v in meta.items()) and s['convertedCharacters']>=len(t)
assert s['omissionAccounting']['selectedChildSections']==18 and '### Donor' not in t
assert len(re.findall(r'^## (?!Now Accepting)',t,re.M))==18
assert set(re.findall(r'\]\((https?://[^\s)]+)',t))=={d['url'] for d in s['linkDispositions'] if d['url']}
assert sum(d['url'] is None for d in s['linkDispositions'])==2
for d in s['linkDispositions']:assert all(d.get(k) for k in ['owner','trigger','nextAction','disposition']) and not d['sourceIds']
ca=load(P/'concurrency-audit.json');assert ca['clientIntervals']==ca['maximumMeasuredConcurrentReads']==1 and not ca['measuredSameHostOverlaps'] and not ca['independentProviderTelemetry']
assert ca['intervals']==[{k:s[k] for k in ['sourceId','originalUrl','callStartedAt','callCompletedAt']}]
co=load(P/'source-concordance.json');assert co['authorSelectedLineConcordance'] and not co['independentOriginalFidelity']
cl=load(P/'conversion-link-dispositions.json');assert len(cl['sources'])==1
dest=cl['sources'][0];assert dest['sourceId']=='aopa' and dest['convertedDestinationCount']==len(dest['destinations'])==31 and dest['unclosedDestinations']==0
for i,d in enumerate(dest['destinations']):
 assert d['index']==i and d['url'] is None and d['closed'] and re.fullmatch('[a-f0-9]{64}',d['destinationSha256'])
 assert all(d.get(k) for k in ['owner','trigger','nextAction','disposition'])
fields=refs=0;rows={r['rowLocator']:r for r in l['records']}
for r,seed in zip(l['records'],q['records'][380:400]):
 for k,v in seed.items():
  if k!='status':assert r[k]==v,(r['rowLocator'],k)
 assert r['identityAcceptance']=='held' and all(r.get(k) for k in ['owner','trigger','nextAction'])
 blocked=r['rowLocator'] in [388,390]
 assert r['status']==r['outcome']==('held-access' if blocked else 'researched-held')
 assert r['allowedSourceIds']==([] if blocked else ['aopa'])
 urls=list(dict.fromkeys(seed['recordedSeedUrls']+seed['publishedSourceAliases']))
 assert len(urls)==len(r['seedDispositions'])
 for u,d in zip(urls,r['seedDispositions']):
  assert d['url']==u and d['urlSha256']==sha(u.encode()) and d['inputPointer']=='queue.json:'+r['inputKey']
  assert d['sourceIds']==(['aopa'] if not blocked and u==s['originalUrl'] else [])
  assert all(d.get(k) for k in ['owner','trigger','nextAction','disposition'])
 for k,f in r['fieldProposals'].items():
  fields+=1;assert f['acceptance']=='held' and f['state'] in ['verified','unverified','inaccessible','unstated','conflict']
  assert all(f.get(k) for k in ['owner','trigger','nextAction','sourceScope','freshness','observationRecordedAt','semanticAssertion'])
  assert f['nextAction']==r['nextAction'] and f['sourceRevision'] is None
  assert f['semanticAssertion']==('Typed held observation: '+json.dumps(f['value'],ensure_ascii=False,separators=(',',':')) if f['value'] is not None else 'Unknown remains non-excluding.')
  if f['value'] is not None or f['state']=='verified':assert f['evidence']
  for e in f['evidence']:
   refs+=1;assert not blocked and e['sourceId']=='aopa'
   assert (e['sourceUrl'],e['sourceUrlSha256'],e['artifactPath'],e['artifactSha256'])==(s['originalUrl'],s['originalUrlSha256'],s['artifactPath'],s['artifactSha256'])
   ex=e['excerpt'];assert ex in t;start=t[:t.index(ex)].count('\n')+1
   assert e['locator']==f'Selected passage lines {start}-{start+ex.count(chr(10))}'
   if k.startswith('parent'):assert ex==t[:t.index('### Examples of Past Scholarships')].strip() and 'parent program only' in f['sourceScope']
   elif k=='cycle':assert ex=='### Examples of Past Scholarships'
   else:assert ex.startswith('## '+r['fieldProposals']['identityObservation']['value']['namedChildObserved']+'\n') and '\n## ' not in ex
  if blocked:assert f['value'] is None and f['state']=='inaccessible' and not f['evidence']
 if not blocked:
  assert r['fieldProposals']['cycle']['value']['childCurrentCycleUnknown'] and r['fieldProposals']['cycle']['value']['childListedAsPastExample']
  assert all(r['fieldProposals'][k]['state']=='unverified' for k in r['fieldProposals'] if k.startswith('parent'))
v=lambda row,k:rows[row]['fieldProposals'][k]['value']
assert v(386,'amount')['USDLowerBound']==2500 and v(387,'amount')['USD']==7550 and v(389,'eligibility')['uninspectedLinkedExamDocument']
assert v(392,'eligibility')['preferenceNotRequirement'] and v(393,'minimumGPA')['entry']==2.7 and v(393,'eligibility')['ageAtAward']==[16,26]
assert v(395,'eligibility')['FBOEmploymentRequired']['atBoth']==['application','scholarship award'] and v(395,'amount')['recipientCount']==2
assert v(396,'amount')['slots'][1]['purpose']=='advanced rating' and v(396,'eligibility')['femaleApplicantsOnly']
assert v(397,'materials')['oneRequiredRecommendationFromCAAPreferredFBOGeneralManager'] and v(397,'application')['generalMatchingRouteNotSubstituted'] and v(397,'amount')['recipientCount']==200
for row in [396,398,399,401]:assert v(row,'eligibility')['minimumOrExactAgeInterpretationHeld']
assert v(401,'amount')['femaleSlots']==v(401,'amount')['maleSlots']==2
assert v(402,'eligibility')['currentlyEnrolledAccreditedUniversityOrCollege'] and v(402,'studyPath') is None
assert v(404,'eligibility')['ageAtApplicationSubmission']==[17,35] and v(405,'minimumGPA')['entry']==2.8 and v(406,'amount')['recipientCount']==5
assert fields==408 and l['coverage']==dict(checkpointInputs=20,fieldEnvelopes=408,sourceReceipts=1,newPublicRetrievals=1,nativeReadableRetrievals=0,nativeMetadataRetrievals=0,outcomes={'researched-held':18,'held-access':2},cumulativeInitialDispositions=400,cumulativeAutonomousHeldFields=7284,cumulativeAutonomousHeldIdentities=400,unprocessedInputs=6)
history=0
for folder in [B]+[B/f'checkpoint-{i:03d}' for i in range(2,20)]:
 mp=folder/('research-manifest.json' if folder==B else 'final-manifest.json');rp=folder/('research-review.json' if folder==B else 'review.json');m=load(mp);rv=load(rp);binding=rv.get('binding',rv)
 assert rv['outcome']=='PASS' and binding['candidateCommit']==m['candidateCommit'] and binding['manifestSha256']==sha(mp.read_bytes())
 assert sha(git('diff','--binary',m['entryCommit'],m['candidateCommit']))==m['completeDiffSha256']
 for f in m['changedFiles']:assert sha(git('show',m['candidateCommit']+':'+f['path']))==f['sha256']
 history+=1
mutable={'docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md','docs/CURRENT_HANDOFF.md','docs/evidence/sd2-autonomous/NEXT_SESSION.md'}
paths=set(git('diff','--name-only',ENTRY).decode().splitlines())|set(git('ls-files','--others','--exclude-standard').decode().splitlines())
assert all(p in mutable or p=='docs/evidence/sd2-autonomous/checkpoint-020.json' or p.startswith('docs/evidence/sd2-autonomous/checkpoint-020/') for p in paths)
protected=0
for line in git('ls-tree','-r',ENTRY).decode().splitlines():
 meta,path=line.split('\t');mode,typ,blob=meta.split()
 if path in mutable:continue
 f=R/path;b=os.readlink(f).encode() if mode=='120000' else f.read_bytes()
 assert hashlib.sha1(b'blob '+str(len(b)).encode()+b'\0'+b).hexdigest()==blob,path
 if mode in ['100644','100755']:assert bool(f.stat().st_mode&0o111)==(mode=='100755')
 protected+=1
pp='docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md';text=(R/pp).read_text();old=git('show',ENTRY+':'+pp).decode();a='<!-- SD2-CHECKPOINT-020-START -->\n';z='<!-- SD2-CHECKPOINT-020-END -->\n'
assert text==old or (text.count(a)==text.count(z)==1 and text[:text.index(a)]+text[text.index(z)+len(z):]==old)
for path in mutable-{pp}:assert (R/path).read_bytes().endswith(git('show',ENTRY+':'+path))
cust=load(P/'prior-custody-audit.json');oldcust=load(B/'checkpoint-019/prior-custody-audit.json');assert len(cust['pins'])==71
assert [(p['path'],p['recordedSha256']) for p in cust['pins']]==[(p['path'],p['recordedSha256']) for p in oldcust['pins']]
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
routes=collections.Counter()
for packet in prior+[l]:
 for x in packet['records']+packet['sourceRegistry']:
  inherited={k:x.get(k) for k in ['owner','trigger','nextAction']}
  if 'inputKey' in x:routes['identities']+=1
  for k,vv in x.items():
   if k=='fieldProposals':
    for f in vv.values():routes['fields']+=1;assert all(f.get(a) or inherited.get(a) for a in inherited)
   elif k in ['seedDispositions','linkDispositions','queryLinkDispositions','excludedProgramLinkDispositions']:
    for d in vv:routes['seeds' if k=='seedDispositions' else 'links']+=1;assert all(d.get(a) or inherited.get(a) for a in inherited)
assert routes['fields']==7284 and routes['identities']==400
for f in [B/'checkpoint-020.json']+[p for p in P.rglob('*') if p.is_file()]:
 text=f.read_text();assert not re.search(r'\b[\w.%+-]+@[\w.-]+\.[A-Za-z]{2,}|[?&](?:AccessKeyId|token|sig|signature|se|ouid|_gl|EventKey)=|tel:\d+',text,re.I),str(f)
 assert all(x==x.rstrip() for x in text.splitlines()) and text.endswith('\n') and not text.endswith('\n\n'),str(f)
va=load(P/'validation.json');assert not any(va[k] for k in ['canonicalAcceptance','externalEffects','SD3Started'])
for c in va['checks']:assert sha((R/c['logPath']).read_bytes())==c['logSha256']
assert [load(P/(n+'.json'))['exitCode'] for n in ['plan-retry','typecheck','tests-retry']]==[0,0,0]
assert all(load(P/(n+'.json'))['exitCode']==1 and 'Operation not permitted' in (P/(n+'.log')).read_text() for n in ['build','build-retry'])
git('diff','--check',ENTRY)
if '--review-bound' in sys.argv:
 m=load(P/'final-manifest.json');rv=load(P/'review.json');binding=rv['binding']
 assert rv['outcome']=='PASS' and binding['candidateCommit']==m['candidateCommit'] and binding['manifestSha256']==sha((P/'final-manifest.json').read_bytes())
 assert not any(rv['severityCounts'].values())
 assert sha(git('diff','--binary',ENTRY,m['candidateCommit']))==m['completeDiffSha256']
 for f in m['changedFiles']:assert sha(git('show',m['candidateCommit']+':'+f['path']))==f['sha256']
 if (P/'local-review-receipt.json').exists():
  receipt=load(P/'local-review-receipt.json')['commit'];assert git('rev-parse',receipt+'^').decode().strip()==m['candidateCommit']
  assert set(git('diff','--name-only',m['candidateCommit'],receipt).decode().splitlines())=={str((P/x).relative_to(R)) for x in ['final-manifest.json','review.json']}
print(json.dumps(dict(outcome='PASS',recordedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),scope='Local held-research integrity only',entryCommit=ENTRY,checkpointInputs=20,cumulativeInitialDispositions=400,unprocessedInputs=6,fieldEnvelopes=fields,cumulativeHeldFields=7284,heldIdentities=400,sourceReceipts=1,evidenceReferences=refs,maximumMeasuredConcurrentReads=1,measuredSameHostOverlaps=[],conversionDestinationRoutes=31,routeCounts=dict(routes),historicalManifestReviewsVerified=history,protectedTrackedFiles=protected,priorCustodyPins=71,custodyGaps=gaps,M1Records=437,M1Pins=len(pins),acceptedFacts=0,SD3Started=False,nextInputKey=l['nextInputKey'],reviewBound='--review-bound' in sys.argv),indent=2))
