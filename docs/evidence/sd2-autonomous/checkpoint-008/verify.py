"""Read-only evidence, denominator, historical preservation and route audit."""
from pathlib import Path
import json,hashlib,subprocess,collections,re,datetime
P=Path(__file__).resolve().parent;B=P.parent;ROOT=P.parents[3]
load=lambda p:json.loads(p.read_text());sha=lambda b:hashlib.sha256(b).hexdigest()
g=lambda *a:subprocess.check_output(['git',*a],cwd=ROOT)
l=load(B/'checkpoint-008.json');q=load(B/'queue.json');entry=l['entryCommit']
assert entry=='d394d074b7e375f9bd6919a7774c9e72f84dae80'
assert l['queueSha256']==sha((B/'queue.json').read_bytes())
prior=[load(B/f'checkpoint-{i:03d}.json') for i in range(1,8)]
assert (l['queueOffsetStart'],l['queueOffsetEndExclusive'])==(140,160)
assert [k for c in prior for k in c['orderedInputKeys']]+l['orderedInputKeys']==[r['inputKey'] for r in q['records'][:160]]
assert l['orderedInputKeys']==[r['inputKey'] for r in l['records']]==[r['inputKey'] for r in q['records'][140:160]]
assert l['nextCheckpointInputOffset']==160 and l['nextInputKey']=='saved-405588227-row-164'==q['records'][160]['inputKey']
assert l['acceptedFacts']==0 and not any(l[k] for k in ['fullSD2Complete','canonicalAcceptance','SD3Started'])
assert l['preservedGates']==prior[-1]['preservedGates']
assert l['sourceRegistry']==load(P/'source-receipts.json');reg={s['sourceId']:s for s in l['sourceRegistry']};assert len(reg)==26
seedurls={u for r in q['records'][140:160] for u in r['recordedSeedUrls']+r['publishedSourceAliases']}
refs=fields=seedcount=linkcount=0
for s in reg.values():
 assert s['originalUrl'] in seedurls and s['depth']==0
 assert all(s.get(k) for k in ['owner','trigger','nextAction','observedAt','sourceScope'])
 assert sha((ROOT/s['artifactPath']).read_bytes())==s['artifactSha256']
 assert not re.search(r'[?&](?:token|sig|signature|se|ouid)=',s['originalUrl']+s['finalUrl'])
 for d in s['linkDispositions']:
  assert all(d.get(k) for k in ['owner','trigger','nextAction','disposition']) and set(d['sourceIds'])<=set(reg);linkcount+=1
for r,seed in zip(l['records'],q['records'][140:160]):
 for k in ['inputKey','rowLocator','recordedName','publicIdCandidates','identityAcceptance']:assert r[k]==seed[k]
 assert r['identityAcceptance']=='held' and all(r.get(k) for k in ['owner','trigger','nextAction'])
 urls=list(dict.fromkeys(seed['recordedSeedUrls']+seed['publishedSourceAliases']));assert len(urls)==len(r['seedDispositions'])
 for u,d in zip(urls,r['seedDispositions']):
  assert d['url']==(u if not u.startswith('mailto:') else 'mailto:[contact omitted]')
  if u.startswith('mailto:'):assert d['urlSha256']==sha(u.encode())
  assert all(d.get(k) for k in ['owner','trigger','nextAction','disposition']) and set(d['sourceIds'])<=set(r['allowedSourceIds']);seedcount+=1
 for name,f in r['fieldProposals'].items():
  fields+=1;assert f['acceptance']=='held' and f['state'] in ['verified','unverified','conflict','inaccessible','unstated']
  assert all(f.get(k) for k in ['owner','trigger','nextAction','sourceScope','observedAt','freshness'])
  if f['state'] in ['verified','conflict']:assert f['evidence']
  for e in f['evidence']:
   s=reg[e['sourceId']];assert e['sourceId'] in r['allowedSourceIds']
   assert e['sourceUrl']==s['originalUrl'] and e['artifactSha256']==s['artifactSha256'] and e['artifactPath']==s['artifactPath']
   assert e['excerpt'] in (ROOT/e['artifactPath']).read_text() and e['locator'];refs+=1
cov=l['coverage'];assert fields==cov['fieldEnvelopes']==387
oldfields=sum(len(r['fieldProposals']) for c in prior for r in c['records']);assert oldfields==2646
assert cov['cumulativeAutonomousHeldFields']==oldfields+fields==3033
assert cov['cumulativeInitialDispositions']==cov['cumulativeAutonomousHeldIdentities']==160 and cov['unprocessedInputs']==246
assert cov['outcomes']==dict(collections.Counter(r['outcome'] for r in l['records']))=={'researched-held':13,'held-access':5,'held-identity':2}
rows={r['rowLocator']:r for r in l['records']}
v=lambda row,field:rows[row]['fieldProposals'][field]['value']
assert rows[144]['fieldProposals']['applicationMethod']['state']=='conflict' and v(144,'applicationMethod')['selectedFormat'] is None
assert v(145,'amount')['perRecipient']==1000 and len(v(145,'amount')['onePerEachSchool'])==6
assert reg['smile-doc']['unexpectedExternalRedirectHeld']
assert v(146,'deadline')['year'] is None and v(146,'minimumGPA')['value']==3.0
parent=v(146,'eligibility')['parentEligibilityScope'];assert parent['namedMajorExamples']==['environmental science/studies','environmental engineering','biology','sustainability']
assert parent['otherMajorsCondition']=='demonstrate a link to an environmental emphasis' and v(146,'eligibility')['otherWaterQualityFieldNeedsWLIApproval'] and v(146,'eligibility')['parentAndPDFNotCollapsed']
assert {e['sourceId'] for e in rows[146]['fieldProposals']['eligibility']['evidence']}=={'ripple','ripple-pdf'}
assert 'Preserve parent environmental-engineering/sustainability' in rows[146]['nextAction']
assert v(147,'amount')['value'] is None and v(147,'needRequirement')['currentDocument']=='SAI'
assert {e['sourceId'] for e in rows[147]['fieldProposals']['deadline']['evidence']}=={'hinderman','hinderman-alias'}
assert v(149,'eligibility')['RotaryLunchRecognitionRequired'] and v(149,'amount')['amountPaymentReconciliationUnresolved']
assert v(151,'amount')['slots']==3 and v(151,'materials')['fullApplicationSpecificsUnverified']
assert v(152,'minimumGPA')['scale']==4.0 and v(152,'materials')['essayWordLimit']==750
assert v(154,'needSelection')['needRequiredThreshold'] is None and not v(154,'reapplication')['previousRecipientsAllowed']
assert v(156,'amount')['fiveCategoriesNotFiveProvenSlots'] and v(156,'materials')['minimumNonfamilyRecommendations']==3
assert v(156,'awardTypes')['types']['degreeProfession']['redeemWithinYears']==4
assert v(156,'awardTypes')['types']['pilot']['completeTrainingWithinYears']==1
assert not v(157,'minimumGPA')['GPAIsDeterminingFactor'] and v(157,'amount') is None
assert v(158,'deadline')['intendedExactDate'] is None and datetime.date(2027,5,1).strftime('%A')=='Saturday'
assert v(159,'cycle')['listingMarked']=='Awarded' and v(159,'eligibility')['HVACProgram']
assert v(160,'renewability')['continuingCumulativeGPA']==2.5 and v(160,'amount')['maximumAdditionalRenewalYears']==3
assert v(162,'opening')['savedAAChildOpeningAccepted'] is False and rows[162]['outcome']=='held-identity'
payment=v(162,'payment');assert payment['allFundsSentDirectlyToCertifiedEducationalInstitution'] and payment['sourceScope'].startswith('LPA parent')
assert payment['savedAmericanAirlinesChildApplicability']=='unverified' and not payment['acceptedForSavedAAChild'] and not payment['paymentActionPerformed']
assert rows[162]['fieldProposals']['payment']['acceptance']=='held' and 'parent direct-to-certified-educational-institution' in rows[162]['nextAction']
first=load(P/'review-round1.json');assert first['binding']['candidateCommit']=='6be403829cbcf68bb075b6bfaee239c921b351b4' and first['outcome']=='FAIL' and first['severityCounts']=={'critical':0,'high':0,'medium':2,'low':0}
assert sha((P/'manifest-round1.json').read_bytes())==first['binding']['manifestSha256']
assert (P/'verification-round1.json').read_bytes()==g('show','6be4038:docs/evidence/sd2-autonomous/checkpoint-008/verification.json')
fix=load(P/'remediation.json');assert fix['requiredFixCount']==len(fix['dispositions'])==2 and {d['findingId'] for d in fix['dispositions']}=={d['id'] for d in first['findings']}
for row in [155,161,163]:
 assert not rows[row]['allowedSourceIds'] and all(f['state']=='inaccessible' for f in rows[row]['fieldProposals'].values())
 assert rows[row]['outcome']=='held-access'
assert rows[161]['inputKey']!=rows[163]['inputKey'] and set(rows[161]['publicIdCandidates']).isdisjoint(rows[163]['publicIdCandidates'])
d=load(P/'document-inspection.json');assert d['noRejectedBatchRetryOrBypass'] and len(d['safePageViews'])==2
for x in d['nativeDocuments']:assert sha(Path(x['rawArtifactPath']).read_bytes())==x['rawSha256'] and sha((ROOT/x['selectedTextPath']).read_bytes())==x['selectedTextSha256']
for x in d['safePageViews']:assert sha(Path(x['path']).read_bytes())==x['sha256']
custody=load(P/'prior-custody-audit.json');assert len(custody['pins'])==68 and custody['gaps']==[]
for x in custody['pins']:assert sha(Path(x['path']).read_bytes())==x['recordedSha256']
assert all(x['bodyVersusParagraphNonWhitespaceEqual'] for x in load(P/'native-body-concordance.json'))
structure=load(P/'document-structure.json');assert sum(x['tableElements'] for d in structure for x in d['tabs'])==0
assert sum(x['inlineObjectElements'] for d in structure for x in d['tabs'])==1
# Verify each historical review/manifest against its original candidate, not this tree.
historical=0
for i in range(2,8):
 folder=B/f'checkpoint-{i:03d}';m=load(folder/'final-manifest.json');r=load(folder/'review.json');assert r['outcome']=='PASS'
 assert r['binding']['candidateCommit']==m['candidateCommit'] and r['binding']['manifestSha256']==sha((folder/'final-manifest.json').read_bytes())
 assert sha(g('diff','--binary',m['entryCommit'],m['candidateCommit']))==m['completeDiffSha256']
 for f in m['changedFiles']:assert sha(g('show',m['candidateCommit']+':'+f['path']))==f['sha256']
 historical+=1
mutable={'docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md','docs/CURRENT_HANDOFF.md','docs/evidence/sd2-autonomous/NEXT_SESSION.md'};preserved=0
for path in g('ls-tree','-r','--name-only',entry).decode().splitlines():
 if path in mutable:continue
 assert (ROOT/path).read_bytes()==g('show',entry+':'+path),path;preserved+=1
pp='docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md';cur=(ROOT/pp).read_text();old=g('show',entry+':'+pp).decode();a='<!-- SD2-CHECKPOINT-008-START -->\n';b='<!-- SD2-CHECKPOINT-008-END -->\n'
if a in cur:
 assert cur.count(a)==cur.count(b)==1;x=cur.index(a);y=cur.index(b)+len(b);assert cur[:x]+cur[y:]==old
else:assert cur==old
for path in ['docs/CURRENT_HANDOFF.md','docs/evidence/sd2-autonomous/NEXT_SESSION.md']:assert (ROOT/path).read_bytes().endswith(g('show',entry+':'+path))
pins=load(ROOT/'docs/evidence/sd2-next-read-proposal/verification.json')['retainedM1Artifacts']
for pin in pins:assert sha(g('show','009fa57:'+pin['path']))==pin['sha256']
m1=json.loads(g('show','009fa57:docs/evidence/season-monitor-m1/inventory.json'));assert len(m1['records'])==len({x['id'] for x in m1['records']})==437
state=load(ROOT/'docs/BUILD_STATE.json');assert state['activeStageId'] is None and state['nextPermittedStageId'] is None
validation=load(P/'validation.json');assert not validation['canonicalAcceptance'] and not validation['externalEffects'] and not validation['SD3Started']
for label,exitcode in [('plan',1),('plan-retry',0),('typecheck',0),('tests',1),('tests-retry',0),('build',1),('build-retry',1)]:
 receipt=load(P/(label+'.json'));assert receipt['exitCode']==exitcode and sha((ROOT/receipt['logPath']).read_bytes())==receipt['logSha256']
 if label in ['build','build-retry']:assert 'binding to a port' in (ROOT/receipt['logPath']).read_text() and 'Operation not permitted' in (ROOT/receipt['logPath']).read_text()
for f in (P/'sources').glob('*.md'):
 t=f.read_text();assert not re.search(r'\b[\w.%+-]+@[\w.-]+\.[A-Za-z]{2,}|[?&](?:token|sig|signature|se|ouid)=|Karrow Avenue|Spokane Ave|Somers Ave|1400 K St|MT 59937|Montana 59937|S:\\\\Marketing',t),f
 assert not re.search(r'(?:\b\d{3}[-/.]|\(\d{3}\)\s*)\d{3}[-/.]\d{4}',t),f
 assert t.endswith('\n') and not t.endswith('\n\n') and all(x==x.rstrip() for x in t.splitlines()),f
for f in [B/'checkpoint-008.json',P/'source-receipts.json',P/'capture-metadata.json',P/'capture-inputs.json']:assert not re.search(r'\b[\w.%+-]+@[\w.-]+\.[A-Za-z]{2,}|[?&](?:token|sig|signature|se|ouid)=',f.read_text()),f
allowed=mutable|{str((B/'checkpoint-008.json').relative_to(ROOT))};changed=set(g('diff','--name-only',entry).decode().splitlines())|set(g('ls-files','--others','--exclude-standard').decode().splitlines())
assert all(x in allowed or x.startswith(str(P.relative_to(ROOT))+'/') for x in changed),changed
g('diff','--check',entry)
print(json.dumps(dict(outcome='PASS',checkpointInputs=20,cumulativeInitialDispositions=160,unprocessed=246,nextInputKey=l['nextInputKey'],fieldEnvelopes=fields,cumulativeHeldFields=3033,heldIdentities=160,sourceReceipts=26,evidenceReferences=refs,seedDispositions=seedcount,sourceLinkDispositions=linkcount,preservedEntryPaths=preserved,historicalManifestReviewsVerified=historical,priorCustodyPins=68,safePageViews=2,M1Records=437,M1Pins=len(pins),acceptedFacts=0,SD3Started=False),indent=2))
