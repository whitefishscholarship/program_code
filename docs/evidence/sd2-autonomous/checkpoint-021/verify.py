"""Read-only checkpoint021 audit; no initialization/reset/replay or source access."""
from pathlib import Path
import json,hashlib,subprocess,datetime,collections,re,os,sys
P=Path(__file__).resolve().parent;B=P.parent;R=P.parents[3]
ENTRY='00687b689eec233cbd3dc40e9196886af5bb06d3'
load=lambda p:json.loads(p.read_text());sha=lambda b:hashlib.sha256(b).hexdigest()
def git(*a):return subprocess.check_output(['git',*a],cwd=R)
q=load(B/'queue.json');l=load(B/'checkpoint-021.json');prior=[load(B/f'checkpoint-{i:03d}.json') for i in range(1,21)]
assert l['entryCommit']==ENTRY and sha((B/'queue.json').read_bytes())==l['queueSha256']
assert len(q['records'])==406 and (l['queueOffsetStart'],l['queueOffsetEndExclusive'])==(400,406)
assert [r['inputKey'] for p in prior for r in p['records']]==[r['inputKey'] for r in q['records'][:400]]
assert l['orderedInputKeys']==[r['inputKey'] for r in l['records']]==[r['inputKey'] for r in q['records'][400:406]]
assert l['nextCheckpointInputOffset']==406 and l['nextInputKey'] is l['nextInputName'] is None and l['initialQueueCoverageComplete']
assert not any(l[k] for k in ['acceptedFacts','canonicalAcceptance','fullSD2Complete','SD3Started'])
assert l['sourceRegistry']==load(P/'source-receipts.json') and len(l['sourceRegistry'])==8
sm={s['sourceId']:s for s in l['sourceRegistry']};texts={}
for s in sm.values():
 raw=(R/s['artifactPath']).read_bytes();t=raw.decode();texts[s['sourceId']]=t
 assert sha(raw)==s['artifactSha256'] and sha(s['originalUrl'].encode())==s['originalUrlSha256']
 assert s['statusCode']==200 and (s['originalUrl']==s['finalUrl'] or (s['sourceId']=='eaaChapter' and s['originalUrl'].lower()==s['finalUrl'])) and s['sourceRevision'] is s['convertedTextSha256'] is None
 assert s['maxAgeRequested']==0 and s['callStartedAt']<=s['callCompletedAt']==s['observationRecordedAt']
 assert not any(s[k] for k in ['rawArtifactRetained','originalNativeVisualFidelityVerified','originFreshnessVerified','completeRawPageImageInspection'])
 assert s['selectedCharacters']==len(t)==s['omissionAccounting']['selectedCharacters'] and s['convertedCharacters']>=len(t)
 meta=next(x for x in load(P/'capture-metadata.json')['sources'] if x['sourceId']==s['sourceId']);assert all(s[k]==v for k,v in meta.items())
 assert s['depth']==(1 if s['sourceId'] in ['eaaScholar','eaaChapter'] else 0)
 assert s['parentSourceId']==('eaa' if s['depth'] else None)
 assert set(re.findall(r'\]\((https?://[^\s)]+)',t))=={d['url'] for d in s['linkDispositions'] if d['url']}
 for d in s['linkDispositions']:
  assert all(d.get(k) for k in ['owner','trigger','nextAction','disposition'])
  for sid in d['sourceIds']:assert sid in sm and sm[sid]['originalUrl'].lower().rstrip('#')==d['url'].lower().rstrip('#')
ca=load(P/'concurrency-audit.json');assert ca['clientIntervals']==8 and ca['maximumMeasuredConcurrentReads']==1 and not ca['measuredSameHostOverlaps'] and not ca['independentProviderTelemetry']
assert ca['intervals']==[{k:s[k] for k in ['sourceId','originalUrl','callStartedAt','callCompletedAt']} for s in sm.values()]
assert all(a['callCompletedAt']<=b['callStartedAt'] for a,b in zip(ca['intervals'],ca['intervals'][1:]))
assert ca['normalizedHosts']==[s['originalUrl'].split('/')[2].lower() for s in sm.values()]
co=load(P/'source-concordance.json');assert co['authorSelectedLineConcordance'] and not co['independentOriginalFidelity'] and set(co['sources'])==set(sm)
cl=load(P/'conversion-link-dispositions.json');assert len(cl['sources'])==8
for source in cl['sources']:
 assert source['sourceId'] in sm and source['convertedDestinationCount']==len(source['destinations'])
 assert source['unclosedDestinations']==sum(not d['closed'] for d in source['destinations'])
 for i,d in enumerate(source['destinations']):
  assert d['index']==i and d['url'] is None and re.fullmatch('[a-f0-9]{64}',d['destinationSha256'])
  assert all(d.get(k) for k in ['owner','trigger','nextAction','disposition'])
destinations=sum(len(s['destinations']) for s in cl['sources']);assert destinations==128
fields=refs=0;rows={r['rowLocator']:r for r in l['records']}
affinity={407:['aopa'],408:['aopa'],409:['aopa'],410:['hilleman','msuMorelli','foundation'],411:['msf'],412:['eaa','eaaScholar','eaaChapter']}
for r,seed in zip(l['records'],q['records'][400:406]):
 for k,v in seed.items():
  if k!='status':assert r[k]==v,(r['rowLocator'],k)
 assert r['identityAcceptance']=='held' and r['status']==r['outcome']=='researched-held'
 assert r['allowedSourceIds']==affinity[r['rowLocator']] and all(r.get(k) for k in ['owner','trigger','nextAction'])
 urls=list(dict.fromkeys(seed['recordedSeedUrls']+seed['publishedSourceAliases']));assert len(urls)==len(r['seedDispositions'])
 for u,d in zip(urls,r['seedDispositions']):
  assert d['url']==u and d['urlSha256']==sha(u.encode()) and d['inputPointer']=='queue.json:'+r['inputKey']
  assert d['sourceIds']==[sid for sid in r['allowedSourceIds'] if sm[sid]['originalUrl']==u]
  assert all(d.get(k) for k in ['owner','trigger','nextAction','disposition'])
 for k,f in r['fieldProposals'].items():
  fields+=1;assert f['acceptance']=='held' and f['state'] in ['verified','unverified','inaccessible','unstated','conflict']
  assert all(f.get(k) for k in ['owner','trigger','nextAction','sourceScope','freshness','observationRecordedAt','semanticAssertion'])
  assert f['nextAction']==r['nextAction'] and f['sourceRevision'] is None
  assert f['semanticAssertion']==('Typed held observation: '+json.dumps(f['value'],ensure_ascii=False,separators=(',',':')) if f['value'] is not None else 'Unknown remains non-excluding.')
  if f['value'] is not None and k!='generalApplicationExcludedStructure':assert f['evidence']
  if k=='generalApplicationExcludedStructure':assert f['state']=='unverified' and not f['evidence']
  for e in f['evidence']:
   refs+=1;sid=e['sourceId'];s=sm[sid];t=texts[sid];assert sid in r['allowedSourceIds']
   assert (e['sourceUrl'],e['sourceUrlSha256'],e['artifactPath'],e['artifactSha256'])==(s['originalUrl'],s['originalUrlSha256'],s['artifactPath'],s['artifactSha256'])
   ex=e['excerpt'];assert ex in t;line=t[:t.index(ex)].count('\n')+1
   assert e['locator']==f'Selected passage lines {line}-{line+ex.count(chr(10))}'
   if r['rowLocator']<410:
    if k.startswith('parent'):assert ex==t[:t.index('### Examples of Past Scholarships')].strip() and f['state']=='unverified' and 'parent program only' in f['sourceScope']
    elif k=='cycle':assert ex=='### Examples of Past Scholarships'
    else:assert ex.startswith('## '+r['fieldProposals']['identityObservation']['value']['namedChildObserved']+'\n') and '\n## ' not in ex
v=lambda row,k:rows[row]['fieldProposals'][k]['value']
for row in [407,408,409]:assert v(row,'cycle')['childListedAsPastExample'] and v(row,'cycle')['childCurrentCycleUnknown']
assert v(407,'amount')['recipientCount'] is None and v(407,'studyPath')['advancedTrainingExamplesNonExhaustive']==['tailwheel','upset recovery','other advanced ratings']
assert v(408,'amount')['USD']==6000 and v(409,'amount')['USDLowerBound']==2500
assert v(410,'eligibility')['MontanaResidentStudents'] and v(410,'eligibility')['studentsWithLearningDifferences'] and v(410,'supportDuration')['years']==4
assert v(410,'foundationVariant')['notAnAcceptedUnionOrIntersection'] and v(410,'generalHillemanCycle')['studentsStartingAtMSUFall2026']
mat=v(410,'generalHillemanMaterials');assert mat['personalReference']['familyMemberExcluded'] and mat['personalReference']['programContactsReferenceAfterSubmissionForRecommendation']
assert mat['essay']['approximateWordRange']==[500,1000] and len(mat['essay']['prompts'])==3 and mat['preSubmissionCounselorTeacherCoachReviewEncouragedNotRequired']
assert v(411,'cycle')['openingDate']=='2026-10-07' and v(411,'cycle')['deadlineDate']=='2026-11-13' and v(411,'amount') is None
assert v(411,'eligibility')['approvedProgramDefinitionUnknown'] and v(411,'eligibility')['goodStanding']
assert v(412,'chapterTiming')['chapter2027OpeningDate']=='2026-11-01' and v(412,'chapterTiming')['notStudentApplicationOpening']
e=v(412,'eligibility');assert e['poweredFlightAgeInclusive']==[16,19] and e['gliderAgeInclusive']==[15,19] and e['ableToBeginWithinDays']==30
assert e['studentPilotCertificate']=='U.S. scholars only' and 'Private Pilot students only' in e['medicalCertificate']
assert v(412,'selectionPreferences')['preferencesNotAdditionalHardRequirements']
o=v(412,'scholarObligations');assert o['chapterVolunteerHoursPerMonth']==2 and o['milestonesMonths']=={'firstSoloIfApplicable':3,'writtenExamIfApplicable':6,'checkride':12} and o['fundingDependsOnTimelyMilestonesAndReports']
assert v(412,'chapterAccessHold')['chapterCriteriaContentInaccessible'] and v(412,'application')['portalChapterCoordinatorsOnly']
assert fields==122 and l['coverage']==dict(checkpointInputs=6,fieldEnvelopes=122,sourceReceipts=8,newPublicRetrievals=8,nativeReadableRetrievals=0,nativeMetadataRetrievals=0,outcomes={'researched-held':6},cumulativeInitialDispositions=406,cumulativeAutonomousHeldFields=7406,cumulativeAutonomousHeldIdentities=406,unprocessedInputs=0)
history=0
for folder in [B]+[B/f'checkpoint-{i:03d}' for i in range(2,21)]:
 mp=folder/('research-manifest.json' if folder==B else 'final-manifest.json');rp=folder/('research-review.json' if folder==B else 'review.json');m=load(mp);rv=load(rp);binding=rv.get('binding',rv)
 assert rv['outcome']=='PASS' and binding['candidateCommit']==m['candidateCommit'] and binding['manifestSha256']==sha(mp.read_bytes())
 assert sha(git('diff','--binary',m['entryCommit'],m['candidateCommit']))==m['completeDiffSha256']
 for f in m['changedFiles']:assert sha(git('show',m['candidateCommit']+':'+f['path']))==f['sha256']
 history+=1
mutable={'docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md','docs/CURRENT_HANDOFF.md','docs/evidence/sd2-autonomous/NEXT_SESSION.md'}
paths=set(git('diff','--name-only',ENTRY).decode().splitlines())|set(git('ls-files','--others','--exclude-standard').decode().splitlines())
assert all(p in mutable or p=='docs/evidence/sd2-autonomous/checkpoint-021.json' or p.startswith('docs/evidence/sd2-autonomous/checkpoint-021/') for p in paths)
protected=0
for line in git('ls-tree','-r',ENTRY).decode().splitlines():
 meta,path=line.split('\t');mode,typ,blob=meta.split()
 if path in mutable:continue
 f=R/path;b=os.readlink(f).encode() if mode=='120000' else f.read_bytes()
 assert hashlib.sha1(b'blob '+str(len(b)).encode()+b'\0'+b).hexdigest()==blob,path
 if mode in ['100644','100755']:assert bool(f.stat().st_mode&0o111)==(mode=='100755')
 protected+=1
pp='docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md';text=(R/pp).read_text();old=git('show',ENTRY+':'+pp).decode();a='<!-- SD2-CHECKPOINT-021-START -->\n';z='<!-- SD2-CHECKPOINT-021-END -->\n'
assert text==old or (text.count(a)==text.count(z)==1 and text[:text.index(a)]+text[text.index(z)+len(z):]==old)
for path in mutable-{pp}:assert (R/path).read_bytes().endswith(git('show',ENTRY+':'+path))
cust=load(P/'prior-custody-audit.json');oldcust=load(B/'checkpoint-020/prior-custody-audit.json');assert len(cust['pins'])==71
assert [(p['path'],p['recordedSha256']) for p in cust['pins']]==[(p['path'],p['recordedSha256']) for p in oldcust['pins']]
gaps=[]
for pin in cust['pins']:
 f=Path(pin['path']);actual=sha(f.read_bytes()) if f.exists() else None;assert actual==pin['observedSha256']
 if actual!=pin['recordedSha256']:gaps.append(pin['path'])
 assert all(pin.get(k) for k in ['owner','trigger','nextAction'])
assert gaps==cust['gaps']
assert cust['auditCorrection'].startswith('Inherited checkpoint020 historical correction, not a checkpoint021 event: ')
assert cust['auditCorrectionOrigin']['sha256']==sha((B/'checkpoint-020/prior-custody-audit.json').read_bytes())
oldm=load(P/'manifest-round1.json');oldrv=load(P/'review-round1.json');rem=load(P/'remediation.json')
assert oldrv['outcome']=='FAIL' and oldrv['binding']['candidateCommit']==oldm['candidateCommit']=='ae00e4221c5a923348fab78834571587253e7963'
assert oldrv['binding']['manifestSha256']==sha((P/'manifest-round1.json').read_bytes())==rem['originalManifestSha256']
assert oldrv['severityCounts']==rem['counts']==dict(critical=0,high=0,medium=0,low=1) and len(rem['dispositions'])==1
assert rem['dispositions'][0]['findingId']=='L1' and rem['newSourceReads']==rem['changedHeldFacts']==0
assert sha(git('diff','--binary',ENTRY,oldm['candidateCommit']))==oldm['completeDiffSha256']
for f in oldm['changedFiles']:assert sha(git('show',oldm['candidateCommit']+':'+f['path']))==f['sha256']
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
assert routes['fields']==7406 and routes['identities']==406
for f in [B/'checkpoint-021.json']+[p for p in P.rglob('*') if p.is_file() and '__pycache__' not in str(p)]:
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
print(json.dumps(dict(outcome='PASS',recordedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),scope='Local held-research integrity only; initial coverage not SD2 completion',entryCommit=ENTRY,checkpointInputs=6,cumulativeInitialDispositions=406,unprocessedInputs=0,fieldEnvelopes=fields,cumulativeHeldFields=7406,heldIdentities=406,sourceReceipts=8,evidenceReferences=refs,maximumMeasuredConcurrentReads=1,measuredSameHostOverlaps=[],conversionDestinationRoutes=destinations,routeCounts=dict(routes),historicalManifestReviewsVerified=history,protectedTrackedFiles=protected,priorCustodyPins=71,custodyGaps=gaps,M1Records=437,M1Pins=len(pins),acceptedFacts=0,fullSD2Complete=False,SD3Started=False,nextInputKey=None,nextCheckpointInputOffset=406,reviewBound='--review-bound' in sys.argv),indent=2))
