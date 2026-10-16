"""Create only checkpoint020 from the frozen cursor; refuses to overwrite its ledger."""
from pathlib import Path
import json,hashlib,subprocess,datetime,copy,re,collections
P=Path(__file__).resolve().parent;B=P.parent;R=P.parents[3]
ENTRY='59fa4da23e84de267c2f58af15ee5c6d23074ecd'
load=lambda p:json.loads(p.read_text());sha=lambda b:hashlib.sha256(b).hexdigest()
OWNER='Codex source/identity reconciliation'
TRIGGER='Applicable authorized evidence arrival or SD2 consolidation after initial remaining-queue coverage'
def write(p,v):
 assert not p.exists(),str(p)
 p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
q=load(B/'queue.json');prior=[load(B/f'checkpoint-{i:03d}.json') for i in range(1,20)]
assert not (B/'checkpoint-020.json').exists()
assert [r['inputKey'] for p in prior for r in p['records']]==[r['inputKey'] for r in q['records'][:380]]
assert q['records'][380]['inputKey']=='saved-405588227-row-386'
t=(P/'sources/aopa.md').read_text();parent=t[:t.index('### Examples of Past Scholarships')].strip()
s=load(P/'capture-metadata.json')['sources'][0]
s.update(artifactPath=str((P/'sources/aopa.md').relative_to(R)),artifactSha256=sha(t.encode()),originalUrlSha256=sha(s['originalUrl'].encode()),observationRecordedAt=s['callCompletedAt'],convertedTextSha256=None,owner=OWNER,trigger=TRIGGER,nextAction='Reconcile exact child versus parent, cycle/current applicability and unseen documents; retain original/native/visual/public/sponsor/freshness gaps. No interaction or acceptance.',redirectDisposition='Provider final URL equals requested URL; no origin/public/sponsor continuity inferred.')
s['selectionAccounting']={'convertedCharacters':s['convertedCharacters'],'selectedCharacters':len(t),'omittedCharactersNet':s['convertedCharacters']-len(t),'limits':s['sourceScope']}
s['linkDispositions']=[]
for u in dict.fromkeys(re.findall(r'\]\((https?://[^\s)]+)',t)):
 s['linkDispositions'].append(dict(url=u,sourceIds=[],disposition='Deferred blank document or application/account locator; no visit or inferred rules',owner=OWNER,trigger=TRIGGER,nextAction=s['nextAction']))
# Masked links remain explicit holds; their exact hashes exist in conversion destinations.
for label in ['membership options','free high-school membership']:
 s['linkDispositions'].append(dict(url=None,sourceIds=[],disposition='Query-bearing '+label+' locator withheld; unvisited',owner=OWNER,trigger=TRIGGER,nextAction=s['nextAction']))
write(P/'source-receipts.json',[s])
specs={
386:('Erral Lea and Glenn Plymate Memorial Flight Training Scholarship',{'USDLowerBound':2500,'upperBound':None,'recipientCountWording':'Multiple'},'Primary certification (Sport, Recreational or Private Pilot certificate)',None),
387:('Hurst Foundation Flight Training Scholarship',{'USD':7550},'Primary certification',None),
389:('Lev Prichard Flight Training Scholarship',{'USDLowerBound':10000,'upperBound':None},'Primary certification',{'FAAExam':'Must have passed FAA Private Pilot written knowledge exam before application submission','uninspectedLinkedExamDocument':True}),
391:('Mark R. Baker Primary   Flight Training Scholarship',{'USD':10000},'Primary Certification',None),
392:('Peter and Terri Wolfgram Scholarship',{'USD':6500},'Primary Certification',{'residencePreference':'living in Bozeman, MT','preferenceNotRequirement':True}),
393:('The Allyn J. Caruso Aviation Scholarship',{'approximateUSD':5000},'Primary certification',{'preference':{'activeStudentsFromMaine':True,'currentlyEnrolledAtSchool':True,'aviationCourseOfStudyExamples':['Pilot','A&P mechanic','flight dispatcher','airport manager','aircraft engineer','another discipline directly related to general aviation']},'preferenceClauseBoundaryHeld':True,'ageAtAward':[16,26],'minimumGPA':2.7,'GPAScale':None}),
394:('The Bruce W. Alatary Memorial Flight Training Scholarship',{'amountWording':'Amount will vary','USD':None},'Primary Certification (Sport, Recreational, or Private Pilot certificate)',{'preference':'female applicants training in Morris County, New Jersey area','preferenceNotRequirement':True}),
395:('The Carlsbad Jet Center and Sonoma Jet Center General Aviation Professional Scholarships',{'USDPerAward':6000,'recipientCount':2},'Flight Dispatcher, FBO Manager, Airport Manager, Aircraft Engineer',{'FBOEmploymentRequired':{'fullOrPartTime':True,'country':'United States','atBoth':['application','scholarship award']},'generalAviationCareerThroughCourseOfStudy':['A&P mechanic','aircraft pilot','flight dispatcher','FBO manager','airport manager','aircraft engineer','another discipline directly related to general aviation'],'headingAndCriteriaBreadthKeptSeparate':True}),
396:('The Ceci Stratford Flight Training Scholarship',{'USDLowerBoundPerAward':5000,'recipientCount':2,'upperBound':None,'slots':[{'count':1,'purpose':'primary certification: Sport, Recreational or Private Pilot certificate'},{'count':1,'purpose':'advanced rating'}]},'One primary certification; one advanced rating',{'ageWording':'Must be 16 years at the time of application submission','minimumOrExactAgeInterpretationHeld':True,'femaleApplicantsOnly':True}),
397:('The Corporate Aircraft Association Preferred FBO Employee Scholarship',{'USDPerAward':2000,'recipientCount':200},'Funds can be used for any aviation education purpose',{'employeeOfCAAPreferredFBOAtAward':True,'recommendationFromGeneralManagerOfCAAPreferredFBORequired':True,'dedicatedCAAApplicationRequired':True}),
398:('The Daniel T. Taussig Memorial Flight Training Scholarship',{'amountWording':'Amount will vary','USD':None},'Primary certification (Sport, Recreational or Private Pilot certificate)',{'ageWording':'Must be 16 years at the time of application submission','minimumOrExactAgeInterpretationHeld':True}),
399:('The David & Florence Kleine Flight Training Scholarship',{'USD':5000},'Primary certification (Sport, Recreational or Private Pilot certificate)',{'ageWording':'Must be 16 years at the time of application submission','minimumOrExactAgeInterpretationHeld':True,'trainingPreference':['Illinois','Minnesota'],'preferenceNotRequirement':True}),
401:('The Dudley D. and Delores R. Malone Memorial Flight Training Scholarship',{'USDPerAward':5000,'recipientCount':4,'femaleSlots':2,'maleSlots':2},'Primary certification (Sport, Recreational or Private Pilot certificate)',{'ageWording':'Must be 16 years at the time of application submission','minimumOrExactAgeInterpretationHeld':True,'femaleSlots':2,'maleSlots':2}),
402:('The Edward B. Shafer Future of Flight Scholarship',{'USD':5000},None,{'currentlyEnrolledAccreditedUniversityOrCollege':True,'pursuingAviationCareer':True,'preferences':['mid-west United States','females','minorities'],'preferencesNotRequirements':True,'careerExamplesNonExhaustive':['aerospace engineering','professional pilot (airline, corporate, etc.)','flight instruction','aircraft maintenance','airport management']}),
403:('The Frank and Alison Heilesen Scholarship',{'USDLowerBound':10000,'upperBound':None},'Primary certification',{'preference':'those in western United States','preferenceNotRequirement':True}),
404:('The Fred and Diane Fitts Memorial Flight Training Scholarship by CAA',{'USDPerAward':7500,'recipientCount':None},'Private pilot certification or instrument rating',{'ageAtApplicationSubmission':[17,35],'preferences':['interested in becoming corporate pilots','members of CAA and their relatives','employees of CAA-preferred FBOs and their relatives'],'preferencesNotRequirements':True}),
405:('The Julie Walker Ibrahim "Wings of Opportunity" Scholarship for Women in Aviation',{'USD':5000},'Private Pilot Certificate or Instrument Rating for Female Student',{'stageOR':['high school','college'],'femaleStudents':True,'minimumGPA':2.8,'GPAScale':None}),
406:('The Kenneth Copeland Flight Training Scholarship',{'USDPerAward':10000,'recipientCount':5},'Primary certification',{'highSchoolStudents':True})}
sections={}
for row,(heading,*_) in specs.items():
 a=t.index('## '+heading+'\n');b=t.find('\n## ',a+4);sections[row]=t[a:b if b>=0 else len(t)].strip()
base=['identityObservation','cycle','amount','eligibility','minimumGPA','need','schoolType','studyPath','applicantStage','affiliation','renewal','reapplication','nomination','materials','application']
records=[]
def put(r,k,v,excerpt=None,state='verified',scope=None):
 ev=[]
 if excerpt:
  assert excerpt in t
  start=t[:t.index(excerpt)].count('\n')+1
  ev=[dict(sourceId='aopa',sourceUrl=s['originalUrl'],sourceUrlSha256=s['originalUrlSha256'],artifactPath=s['artifactPath'],artifactSha256=s['artifactSha256'],locator=f'Selected passage lines {start}-{start+excerpt.count(chr(10))}',excerpt=excerpt)]
 r['fieldProposals'][k]=dict(value=v,state=state,acceptance='held',sourceScope=scope or 'Exact named child under Examples of Past Scholarships; identity and current offering remain held. Donor/image/native omissions prevent completeness or source-silence claims.',observationRecordedAt=s['callCompletedAt'],sourceRevision=None,freshness='As-observed selected provider conversion only; no current/future child offering or origin/native proof',evidence=ev,semanticAssertion='Typed held observation: '+json.dumps(v,ensure_ascii=False,separators=(',',':')) if v is not None else 'Unknown remains non-excluding.',owner=OWNER,trigger=TRIGGER,nextAction=r['nextAction'])
for seed in q['records'][380:400]:
 r=copy.deepcopy(seed);row=r['rowLocator'];blocked=row in [388,390]
 action='Reconcile exact named child identity/current offering and preserved historical amount/certificate/criteria/preferences/age wording; keep parent rules separate, unseen donor/native/image/document scope held. No accepted union, name-only mapping or current-child inference.' if not blocked else 'Keep exact saved SmarterSelect application locator unvisited; reconcile named award/sponsor/public metadata through later authorized evidence without login/form interaction or inferred facts.'
 r.update(status='held-access' if blocked else 'researched-held',outcome='held-access' if blocked else 'researched-held',allowedSourceIds=[] if blocked else ['aopa'],owner=OWNER,trigger=TRIGGER,nextAction=action,fieldProposals={},seedDispositions=[])
 for k in base:put(r,k,None,state='inaccessible' if blocked else 'unverified')
 for u in dict.fromkeys(seed['recordedSeedUrls']+seed['publishedSourceAliases']):
  r['seedDispositions'].append(dict(url=u,urlSha256=sha(u.encode()),inputPointer='queue.json:'+r['inputKey'],sourceIds=['aopa'] if not blocked and u==s['originalUrl'] else [],disposition='Retrieved shared selected conversion once for this checkpoint' if not blocked and u==s['originalUrl'] else 'Application-platform locator held unvisited; no login/form action',owner=OWNER,trigger=TRIGGER,nextAction=action))
 if not blocked:
  heading,amount,cert,criteria=specs[row];ex=sections[row]
  put(r,'identityObservation',{'namedChildObserved':heading,'mapping':'proposed; held','sourceSection':'Examples of Past Scholarships'},ex)
  put(r,'amount',dict(amount,amountPeriodExplicit=None,currentChildFundingUnknown=True),ex)
  if cert:put(r,'studyPath',{'certificateRatingOrCareerPathAsPrinted':cert},ex)
  if criteria:put(r,'eligibility',criteria,ex)
  if row in [393,405]:put(r,'minimumGPA',{'entry':2.7 if row==393 else 2.8,'scale':None},ex)
  if row==397:
   put(r,'materials',{'oneRequiredRecommendationFromCAAPreferredFBOGeneralManager':True,'completeMaterialsUnknown':True},ex)
   put(r,'application',{'dedicatedCAAApplication':'https://aopa-caa.secure-platform.com/site','unvisited':True,'generalMatchingRouteNotSubstituted':True},ex)
  put(r,'cycle',{'childListedAsPastExample':True,'childCurrentCycleUnknown':True,'childSpecificDates':None},'### Examples of Past Scholarships',state='unverified')
  scope='AOPA parent program only; not silently assigned as child-specific conditions/current offering. Dedicated CAA route remains separate.'
  put(r,'parentTiming',{'saysAcceptingApplications':True,'fallYearlessWindow':['10-01','12-31'],'springYearlessWindow':['04-01','06-30'],'closeTimeLiteral':'11:59 p.m. ET','decisionDatesYearless':{'fall':'04-15','spring':'09-15'},'year':None},parent,state='unverified',scope=scope)
  put(r,'parentEligibility',{'currentAOPAMembership':True,'residentJurisdictions':['United States & District of Columbia','Canada','Guam','Puerto Rico','U.S. Virgin Islands'],'freeHighSchoolMembershipStated':True,'membershipRoutesUnvisited':True},parent,state='unverified',scope=scope)
  put(r,'parentMaterials',{'transcriptReferencesAndOtherMaterialsBeforeDeadline':True,'completeChildMaterialsUnknown':True,'lateOrIncompleteApplicationsNotAccepted':True},parent,state='unverified',scope=scope)
  put(r,'parentApplication',{'separateSystemAccountFromAOPALogin':True,'oneGeneralApplicationAutomaticMatching':True,'numberAndValueDependOnDonorFundingMayFinalizeBeforeAnnouncement':True,'accountAndFormUnvisited':True,'CAAExceptionRetained':row==397},parent,state='unverified',scope=scope)
  put(r,'parentAwardConditions',{'prepaidExpenseCard':True,'flightTrainingExpiryMonthsAfterAward':12,'aviationMaintenanceExpiryMonthsAfterAward':24},parent,state='unverified',scope=scope)
  put(r,'parentReapplication',{'unsuccessfulApplicantsMayResubmitNextPeriod':True,'notChildRenewalProof':True},parent,state='unverified',scope=scope)
 records.append(r)
fields=sum(len(r['fieldProposals']) for r in records);oldfields=sum(len(r['fieldProposals']) for p in prior for r in p['records'])
ledger=dict(schemaVersion=1,checkpointId='020',scope='One bounded local SD2 held-research checkpoint; no canonical acceptance',entryCommit=ENTRY,queueSha256=sha((B/'queue.json').read_bytes()),queueOffsetStart=380,queueOffsetEndExclusive=400,orderedInputKeys=[r['inputKey'] for r in records],records=records,sourceRegistry=[s],nextCheckpointInputOffset=400,nextInputKey=q['records'][400]['inputKey'],nextInputName=q['records'][400]['recordedName'],acceptedFacts=0,canonicalAcceptance=False,fullSD2Complete=False,SD3Started=False,coverage=dict(checkpointInputs=20,fieldEnvelopes=fields,sourceReceipts=1,newPublicRetrievals=1,nativeReadableRetrievals=0,nativeMetadataRetrievals=0,outcomes=dict(collections.Counter(r['outcome'] for r in records)),cumulativeInitialDispositions=400,cumulativeAutonomousHeldFields=oldfields+fields,cumulativeAutonomousHeldIdentities=400,unprocessedInputs=6),inheritedOpenRoutes=dict(allPriorLedgers=list(range(1,20)),fields=oldfields,identities=380,allPriorPacketsPRELUDESection9M1Routes='byte-preserved; original owners/triggers/actions'),preservedGates=prior[-1]['preservedGates'],sourcePolicyDeviations=['Initial heading-only inventory included unrelated scholarship headings; sanitized selected preview had a contact-withheld placeholder, removed before persistence. No applicant responses or contact values forwarded. Original session handling remains disclosed; final sanitization erases no history.'],limits=['Selected parent and18 child passages only; donor biographies/images/unrelated awards omitted; no original/native/visual/raw/page/table/form completeness, source silence, freshness/public/sponsor/route proof.','One measured sequential client interval; no provider telemetry or retry.','Two SmarterSelect application inputs and dedicated CAA/account/document locators unvisited.','All earlier holds/review/custody/timing/output bindings remain unchanged; GPT review accepts no facts or identities; stop before SD3.'])
write(B/'checkpoint-020.json',ledger)
write(P/'concurrency-audit.json',dict(clientIntervals=1,maximumMeasuredConcurrentReads=1,measuredSameHostOverlaps=[],independentProviderTelemetry=False,intervals=[{k:s[k] for k in ['sourceId','originalUrl','callStartedAt','callCompletedAt']}]))
rows=['|Saved row|Exact saved name|Outcome|Owned next action|','|---|---|---|---|']
for r in records:rows.append('|'+str(r['rowLocator'])+'|'+r['recordedName']+'|'+r['outcome']+'|'+r['nextAction']+'|')
readme='''# Checkpoint020 local held research

One bounded checkpoint resumes exactly offsets380:400, savedrows386-406 excluding
already-completed400. Never initialize/reset/replay. All facts/identities remain
held; fullSD2 incomplete; stop before SD3. AUTHORITY/POLICY remain unchanged.

One shared AOPA selected conversion serves18 queued past-example children; two
SmarterSelect application routes remain held-access and unvisited. No unrelated
child processing, form interaction, workbook/app/configuration change, remote Git,
publication/deployment, message or monitoring activation occurred.

Every record/field/seed/source/link has an owner, trigger and nextAction in
checkpoint-020.json; all prior ledgers retain original routes byte-for-byte.
Parent yearless dates/member/materials/expense-card/expiry/resubmit terms remain
parent-scoped. Current child offering is unknown. CAA has its separate dedicated
application and required general-manager recommendation. Preferences remain
preferences; literal must-be-16 wording has no invented minimum/exact reading.
Caruso schooling/Maine preference-clause scope stays held; Shafer career examples
are non-exhaustive. Carlsbad heading/criteria breadth and Ceci two purposes remain
distinct. Recipient slots do not become separate award identities.

Donor biographies/images and unrelated children/contact/navigation were omitted.
Converted destination hashes account for all conversion Markdown occurrences,
including omitted links; no original HTML/native completeness claim. Author
concordance is not independent source fidelity. No raw conversion is persisted.
Initial heading-only inventory included unrelated scholarship headings; contact
placeholder in selected preview was removed before persistence. Historical
handling is not erased. Earlier output/overlap/unmeasured/custody/native/current
limits retain their original owners and triggers.

Codex source/identity owns every new hold at applicable authorized evidence arrival
or SD2 consolidation. Exact child rules and unknowns are in typed held fields;
complete materials, donor/native/image scope, identity/current applicability and
unvisited document/portal routes remain explicit holds. Earlier19packets, nine
attention rows/supplements, 437M1 routes and71custody pins remain protected.

Required command results are in validation.json; standard-build/fresh-main and
all preservation/backup/recovery/permission/human/canonical/publication/student/
CSV/browser/fit/monitor/effect gates retain their original owner/trigger/action.
No canonical acceptance or later-stage authority follows from research review.

'''+ '\n'.join(rows)+'\n\nCoverage: '+json.dumps(ledger['coverage'],sort_keys=True)+'.\nNext offset400: '+ledger['nextInputKey']+' / '+ledger['nextInputName']+'.\n'
assert not (P/'README.md').exists();(P/'README.md').write_text(readme)
print(json.dumps(ledger['coverage'],indent=2));print('Next:',ledger['nextInputKey'],ledger['nextInputName'])
