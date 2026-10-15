"""Read-only evidence, complete denominator, held-state and preservation audit."""
from pathlib import Path
import json, hashlib, subprocess, collections, re
P=Path(__file__).resolve().parent; B=P.parent; ROOT=P.parents[3]
load=lambda p:json.loads(p.read_text());sha=lambda b:hashlib.sha256(b).hexdigest()
g=lambda *a:subprocess.check_output(['git',*a],cwd=ROOT)
l=load(B/'checkpoint-009.json');q=load(B/'queue.json');entry=l['entryCommit']
assert entry=='5b971ee6656d1fa3aa63f13354e5b6e8297dec76'
assert l['queueSha256']==sha((B/'queue.json').read_bytes())
assert len(q['records'])==len({r['inputKey'] for r in q['records']})==406
prior=[load(B/f'checkpoint-{i:03d}.json') for i in range(1,9)]
assert (l['queueOffsetStart'],l['queueOffsetEndExclusive'])==(160,180)
assert l['orderedInputKeys']==[r['inputKey'] for r in l['records']]==[r['inputKey'] for r in q['records'][160:180]]
assert [k for c in prior for k in c['orderedInputKeys']]+l['orderedInputKeys']==[r['inputKey'] for r in q['records'][:180]]
assert l['nextCheckpointInputOffset']==180 and l['nextInputKey']==q['records'][180]['inputKey']=='saved-405588227-row-184'
assert l['acceptedFacts']==0 and not any(l[k] for k in ['fullSD2Complete','canonicalAcceptance','SD3Started'])
assert l['preservedGates']==prior[-1]['preservedGates'] and l['sourceRegistry']==load(P/'source-receipts.json')
reg={s['sourceId']:s for s in l['sourceRegistry']};assert len(reg)==9
seedurls={u for r in q['records'][160:180] for u in r['recordedSeedUrls']+r['publishedSourceAliases']}
linkcount=seedcount=refs=fields=0
for s in reg.values():
 assert s['depth']<=2 and s['statusCode']==200
 assert all(s.get(k) for k in ['owner','trigger','nextAction','observedAt','sourceScope'])
 assert s['callStartedAt']<=s['callCompletedAt']==s['observedAt']
 assert not s['rawArtifactRetained'] and not s['originFreshnessVerified']
 assert sha((ROOT/s['artifactPath']).read_bytes())==s['artifactSha256']
 if s['parentSourceId']:
  parent=reg[s['parentSourceId']];assert s['depth']==parent['depth']+1
  # Every followed URL must appear verbatim in its selected parent artifact.
  assert s['originalUrl'] in (ROOT/parent['artifactPath']).read_text() or s['originalUrl'] in seedurls
 else:assert s['originalUrl'] in seedurls
 for d in s['linkDispositions']:
  assert all(d.get(k) for k in ['owner','trigger','nextAction','disposition']);linkcount+=1
  assert set(d['sourceIds'])<=set(reg)
for r,seed in zip(l['records'],q['records'][160:180]):
 for k in ['inputKey','rowLocator','recordedName','publicIdCandidates','identityAcceptance','recordedSeedUrls','publishedSourceAliases']:assert r[k]==seed[k]
 assert r['identityAcceptance']=='held' and r['status']==r['outcome']
 assert all(r.get(k) for k in ['owner','trigger','nextAction'])
 urls=list(dict.fromkeys(seed['recordedSeedUrls']+seed['publishedSourceAliases']))
 assert [d['url'] for d in r['seedDispositions']]==urls
 for d in r['seedDispositions']:
  seedcount+=1;assert all(d.get(k) for k in ['owner','trigger','nextAction','disposition']) and set(d['sourceIds'])<=set(r['allowedSourceIds'])
 for f in r['fieldProposals'].values():
  fields+=1;assert f['acceptance']=='held' and f['state'] in ['verified','unverified','unstated','conflict','inaccessible']
  assert all(f.get(k) for k in ['owner','trigger','nextAction','sourceScope','observedAt','freshness'])
  if f['state'] in ['verified','conflict']:assert f['evidence']
  for e in f['evidence']:
   s=reg[e['sourceId']];assert s['sourceId'] in r['allowedSourceIds']
   assert e['artifactPath']==s['artifactPath'] and e['artifactSha256']==s['artifactSha256'] and e['sourceUrl']==s['originalUrl']
   assert e['excerpt'] in (ROOT/e['artifactPath']).read_text() and e['locator'];refs+=1
cov=l['coverage'];oldfields=sum(len(r['fieldProposals']) for c in prior for r in c['records'])
assert oldfields==3033 and fields==cov['fieldEnvelopes']==462
assert cov['cumulativeAutonomousHeldFields']==oldfields+fields==3495
assert cov['cumulativeInitialDispositions']==cov['cumulativeAutonomousHeldIdentities']==180 and cov['unprocessedInputs']==226
assert cov['outcomes']==dict(collections.Counter(r['outcome'] for r in l['records']))=={'held-identity':6,'researched-held':14}
rows={r['rowLocator']:r for r in l['records']};v=lambda row,key:rows[row]['fieldProposals'][key]['value']
for row in [164,165,166,169,171]:
 assert rows[row]['outcome']=='held-identity' and v(row,'identityObservation')['absenceProvesClosure'] is False
 assert v(row,'parentCycle')['savedChildOpeningAccepted'] is False
 assert all(v(row,key) is None for key in ['amount','minimumGPA','eligibility','materials','currentOffering'])
assert v(167,'amount')['recipientSlots']==3 and v(167,'eligibility')['flightTrainingExcluded']
assert len(v(167,'eligibility')['aerospaceFieldsExamples'])==6
assert v(168,'amount')['recipientSlots']==4 and v(168,'eligibility')['andOr'] and v(168,'eligibility')['parentAccreditedEnrolledAcceptedTermsSeparate']
assert v(170,'amount')['recipientSlots']==2
assert v(172,'amount')['range']==[27000,122000] and v(172,'eligibility')['ageMinimum']==18 and v(172,'eligibility')['fundsNontransferable']
assert v(173,'materials')['essayMinimumWords']==500 and v(173,'deadline')['date']=='2027-01-15' and v(173,'deadline')['zoneLiteral']=='EST'
assert v(173,'applicationMethod')['savedTally']!=v(173,'applicationMethod')['currentLinkedTally'] and not v(173,'applicationMethod')['actionsPerformed']
assert v(174,'eligibility')['GoldStarChildrenOrSiblings'] and v(174,'eligibility')['fourYearCollegeInFall']
assert v(174,'deadline')['explicitYear'] is None and v(174,'renewability')['parentOneTimeScholarship']
assert v(174,'materials')['twoNonrelativeCharacterReferenceLetters'] and 'even if no grades' in v(174,'materials')['transcripts']
assert v(174,'materials')['essay']['chooseOne'] and len(v(174,'materials')['essay']['prompts'])==3
assert not reg['looney-pdf']['rawDownloadPerformed'] and not reg['looney-pdf']['completeRawPageImageInspection']
for row in range(175,184):
 assert v(row,'parentGeneralRequirements')['ageMinimum']==18 and v(row,'parentGeneralRequirements')['nonFlightTrainingMedicalRequired'] is False
 assert v(row,'parentNationalityScope')['specificSponsorChildWorkAuthorization'] is None
 assert rows[row]['fieldProposals']['materials']['state']==rows[row]['fieldProposals']['cycle']['state']=='conflict'
 assert v(row,'materials')['variantsNotCollapsed'] and len(v(row,'materials')['logbookVariants'])==2
 assert v(row,'minimumGPA') is None and v(row,'needRequirement') is None and v(row,'deadline') is None
assert v(175,'eligibility')['includesTravel']=='2027 Palm Springs NGPA events'
assert v(176,'amount')['variants']==[4000,2400,2000] and v(176,'eligibility')['flightStudentOrCFI']=='at a Propel Affiliate School'
assert len(v(180,'amount')['variants'])==3 and sum(x['slots'] for x in v(180,'amount')['variants'])==6
assert v(181,'eligibility')['applicantGenderIdentityRestriction'] is None and v(182,'eligibility')['applicantWomenOnlyRestriction'] is None
assert 'payment' not in rows[183]['fieldProposals']
assert reg['ngpa']['selectedTableAccounting']=={'retrievedAwardRows':21,'retainedRowsForSelectedNames':13,'unrelatedRowsExplicitlyExcluded':8,'selectedInputNames':9}
# All prior candidate/manifest/review bindings remain historical, never rebound.
historical=0
for i in range(2,9):
 folder=B/f'checkpoint-{i:03d}';m=load(folder/'final-manifest.json');r=load(folder/'review.json')
 assert r['outcome']=='PASS' and r['binding']['candidateCommit']==m['candidateCommit'] and r['binding']['manifestSha256']==sha((folder/'final-manifest.json').read_bytes())
 assert sha(g('diff','--binary',m['entryCommit'],m['candidateCommit']))==m['completeDiffSha256']
 for f in m['changedFiles']:assert sha(g('show',m['candidateCommit']+':'+f['path']))==f['sha256']
 historical+=1
mutable={'docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md','docs/CURRENT_HANDOFF.md','docs/evidence/sd2-autonomous/NEXT_SESSION.md'}
changed=set(g('diff','--name-only',entry).decode().splitlines());untracked=set(g('ls-files','--others','--exclude-standard').decode().splitlines())
assert changed<=mutable|{str((B/'checkpoint-009.json').relative_to(ROOT))}|{str(f.relative_to(ROOT)) for f in P.rglob('*') if f.is_file()}
assert all(x in mutable or x==str((B/'checkpoint-009.json').relative_to(ROOT)) or x.startswith(str(P.relative_to(ROOT))+'/') for x in untracked)
for path in g('ls-tree','-r','--name-only',entry).decode().splitlines():
 if path not in mutable:assert path not in changed,path
pp='docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md';cur=(ROOT/pp).read_text();old=g('show',entry+':'+pp).decode()
a='<!-- SD2-CHECKPOINT-009-START -->\n';b='<!-- SD2-CHECKPOINT-009-END -->\n'
if a in cur:
 assert cur.count(a)==cur.count(b)==1;x=cur.index(a);y=cur.index(b)+len(b);assert cur[:x]+cur[y:]==old
else:assert cur==old
for path in mutable-{pp}:assert (ROOT/path).read_bytes().endswith(g('show',entry+':'+path))
custody=load(P/'prior-custody-audit.json');assert len(custody['pins'])==71
for pin in custody['pins']:
 f=Path(pin['path']);actual=sha(f.read_bytes()) if f.exists() else None;assert actual==pin['observedSha256']
 assert all(pin.get(k) for k in ['owner','trigger','nextAction'])
pins=load(ROOT/'docs/evidence/sd2-next-read-proposal/verification.json')['retainedM1Artifacts']
for pin in pins:assert sha(g('show','009fa57:'+pin['path']))==pin['sha256']
m1=json.loads(g('show','009fa57:docs/evidence/season-monitor-m1/inventory.json'));assert len(m1['records'])==len({r['id'] for r in m1['records']})==437
state=load(ROOT/'docs/BUILD_STATE.json');assert state['activeStageId'] is None and state['nextPermittedStageId'] is None
validation=load(P/'validation.json');assert not any(validation[k] for k in ['canonicalAcceptance','externalEffects','SD3Started'])
for label,expected in [('plan',1),('plan-retry',0),('typecheck',0),('tests',1),('tests-retry',0),('build',1),('build-retry',1)]:
 r=load(P/(label+'.json'));assert r['exitCode']==expected and sha((ROOT/r['logPath']).read_bytes())==r['logSha256']
 if label.startswith('build'):assert 'binding to a port' in (ROOT/r['logPath']).read_text() and 'Operation not permitted' in (ROOT/r['logPath']).read_text()
for f in list((P/'sources').glob('*.md'))+[B/'checkpoint-009.json',P/'source-receipts.json',P/'capture-metadata.json']:
 t=f.read_text();assert not re.search(r'\b[\w.%+-]+@[\w.-]+\.[A-Za-z]{2,}|[?&](?:token|sig|signature|se|ouid)=|PO Box|Dunkirk|20754',t),f
 assert not re.search(r'(?:\b\d{3}[-/.]|\(\d{3}\)\s*)\d{3}[-/.]\d{4}',t),f
 assert t.endswith('\n') and all(x==x.rstrip() for x in t.splitlines()),f
g('diff','--check',entry)
print(json.dumps(dict(outcome='PASS',checkpointInputs=20,cumulativeInitialDispositions=180,unprocessed=226,fieldEnvelopes=fields,cumulativeHeldFields=3495,heldIdentities=180,sourceReceipts=9,evidenceReferences=refs,seedDispositions=seedcount,sourceLinkDispositions=linkcount,historicalManifestReviewsVerified=historical,priorCustodyPins=71,custodyGaps=custody['gaps'],M1Records=437,M1Pins=len(pins),acceptedFacts=0,SD3Started=False,nextInputKey=l['nextInputKey']),indent=2))
