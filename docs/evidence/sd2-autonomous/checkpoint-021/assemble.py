"""Append only frozen offsets400:406; refuse existing ledger; never reset/replay."""
from pathlib import Path
import json,hashlib,copy,collections,datetime,re
P=Path(__file__).resolve().parent;B=P.parent;R=P.parents[3]
ENTRY='00687b689eec233cbd3dc40e9196886af5bb06d3'
load=lambda p:json.loads(p.read_text());sha=lambda b:hashlib.sha256(b).hexdigest()
OWNER='Codex source/identity reconciliation'
TRIGGER='Applicable authorized evidence arrival or separately selected SD2 consolidation; initial frozen-queue coverage alone grants no further reads'
def write(p,v):
 assert not p.exists(),str(p)
 p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
q=load(B/'queue.json');prior=[load(B/f'checkpoint-{i:03d}.json') for i in range(1,21)]
assert not (B/'checkpoint-021.json').exists()
assert [r['inputKey'] for p in prior for r in p['records']]==[r['inputKey'] for r in q['records'][:400]]
assert len(q['records'])==406 and q['records'][400]['inputKey']=='saved-405588227-row-407'
texts={p.stem:p.read_text() for p in (P/'sources').glob('*.md')}
sources=load(P/'capture-metadata.json')['sources'];sm={s['sourceId']:s for s in sources}
for s in sources:
 t=texts[s['sourceId']];assert len(t)==s['selectedCharacters']
 s.update(artifactPath=str((P/'sources'/(s['sourceId']+'.md')).relative_to(R)),artifactSha256=sha(t.encode()),originalUrlSha256=sha(s['originalUrl'].encode()),observationRecordedAt=s['callCompletedAt'],convertedTextSha256=None,owner=OWNER,trigger=TRIGGER,nextAction='Reconcile retained input/source/current-cycle and extraction/access limitations at authorized evidence arrival or separately selected SD2 consolidation; no automatic follow-up, interaction or acceptance.',redirectDisposition='Provider final URL equals queued or directly linked request; no origin freshness/public-access or sponsor continuity inferred.',linkDispositions=[])
 for u in dict.fromkeys(re.findall(r'\]\((https?://[^\s)]+)',t)):
  ids=[z['sourceId'] for z in sources if z['originalUrl'].lower().rstrip('#')==u.lower().rstrip('#')]
  s['linkDispositions'].append(dict(url=u,sourceIds=ids,disposition='Selected source already retrieved in this checkpoint' if ids else 'Deferred document/biography/account/application locator; unvisited, no interaction or inferred rules',owner=OWNER,trigger=TRIGGER,nextAction=s['nextAction']))
 for marker in re.findall(r'\]\((\[query-bearing [^\]]+\])\)',t):
  s['linkDispositions'].append(dict(url=None,sourceIds=[],disposition=marker+'; original converted-destination hash occurrence retained, no reconstruction',owner=OWNER,trigger=TRIGGER,nextAction=s['nextAction']))
for source in sources:
 if source['originalUrl']!=source['finalUrl']:
  assert source['sourceId']=='eaaChapter' and source['originalUrl'].lower()==source['finalUrl']
  source['redirectDisposition']='Resource-preserving same-host case normalization to lowercase chapter path; selected notice is member-only. No sponsor/public/origin proof.'
write(P/'source-receipts.json',sources)
records=[]
base=['identityObservation','cycle','amount','eligibility','minimumGPA','need','schoolType','studyPath','applicantStage','affiliation','renewal','reapplication','nomination','materials','application']
def put(r,k,v,sid=None,ex=None,state='verified',scope=None):
 ev=[]
 if sid:
  s=sm[sid];t=texts[sid];ex=ex or t.strip();assert ex in t
  line=t[:t.index(ex)].count('\n')+1
  ev=[dict(sourceId=sid,sourceUrl=s['originalUrl'],sourceUrlSha256=s['originalUrlSha256'],artifactPath=s['artifactPath'],artifactSha256=s['artifactSha256'],locator=f'Selected passage lines {line}-{line+ex.count(chr(10))}',excerpt=ex)]
 r['fieldProposals'][k]=dict(value=v,state=state,acceptance='held',sourceScope=scope or r['evidenceScope'],observationRecordedAt=sm[sid]['callCompletedAt'] if sid else r['observationRecordedAt'],sourceRevision=None,freshness='As-observed selected provider conversion only; current offering, source currency and complete native/public/sponsor proof held',evidence=ev,semanticAssertion='Typed held observation: '+json.dumps(v,ensure_ascii=False,separators=(',',':')) if v is not None else 'Unknown remains non-excluding.',owner=OWNER,trigger=TRIGGER,nextAction=r['nextAction'])
affinity={407:['aopa'],408:['aopa'],409:['aopa'],410:['hilleman','msuMorelli','foundation'],411:['msf'],412:['eaa','eaaScholar','eaaChapter']}
actions={407:'Reconcile exact named past-example child/current offering and variable amount/count and advanced-training examples; keep parent scope separate and donor/native gaps held.',408:'Reconcile exact named past-example child/current offering, historical USD6000 and primary certificate alternatives; keep parent scope separate and donor/native gaps held.',409:'Reconcile exact named past-example child/current offering, historical USD2500 lower bound and seaplane rating; keep parent scope separate and donor/native gaps held.',410:'Reconcile Hilleman/Morelli identity and MSU Montana-resident/learning-difference/STEM support scope against foundation variant. Keep general Hilleman Fall2026/reference/essay/form prompts separately scoped and child applicability unknown; no merged identity or accepted union/intersection.',411:'Reconcile exact approved-program scope, full-time/good-standing and safety motivation with 2026 dates; amount remains unknown despite Award heading. Application query and unseen platform materials remain held; no form interaction.',412:'Reconcile exact Ray scholar versus chapter identity/funding/windows/nomination/certificates/medical/flight/service/milestones. Retain member-only chapter page, unknown individual cycle/local chapter participation and unseen portal/materials; no login/contact or future student opening inferred.'}
for seed in q['records'][400:406]:
 r=copy.deepcopy(seed);row=r['rowLocator'];ids=affinity[row]
 scope='Exact named AOPA child under Examples of Past Scholarships; current offering and donor/native scope held' if row<410 else 'Exact saved input; each source variant separately scoped; identity/currentness remain held'
 r.update(status='researched-held',outcome='researched-held',allowedSourceIds=ids,owner=OWNER,trigger=TRIGGER,nextAction=actions[row],fieldProposals={},seedDispositions=[],evidenceScope=scope,observationRecordedAt=max(sm[s]['callCompletedAt'] for s in ids))
 for k in base:put(r,k,None,state='unverified')
 for u in dict.fromkeys(seed['recordedSeedUrls']+seed['publishedSourceAliases']):
  ss=[sid for sid in ids if sm[sid]['originalUrl']==u]
  r['seedDispositions'].append(dict(url=u,urlSha256=sha(u.encode()),inputPointer='queue.json:'+r['inputKey'],sourceIds=ss,disposition='Retrieved selected provider conversion once for this checkpoint',owner=OWNER,trigger=TRIGGER,nextAction=actions[row]));assert ss
 if row<410:
  headings={407:'The Richard McSpadden Scholarship for Advanced Pilot Training',408:'The Richard Santori Memorial Scholarship',409:'The Tony Phillippi Seaplane Scholarship'}
  t=texts['aopa'];a=t.index('## '+headings[row]+'\n');b=t.find('\n## ',a+4);ex=t[a:b if b>=0 else len(t)].strip();parent=t[:t.index('### Examples of Past Scholarships')].strip()
  put(r,'identityObservation',{'namedChildObserved':headings[row],'mapping':'proposed; held','sourceSection':'Examples of Past Scholarships'},'aopa',ex)
  put(r,'cycle',{'childListedAsPastExample':True,'childCurrentCycleUnknown':True,'childSpecificDates':None},'aopa','### Examples of Past Scholarships',state='unverified')
  amounts={407:{'amountWording':'Quantity and amount will vary.','USD':None,'recipientCount':None},408:{'USD':6000,'recipientCount':None},409:{'USDLowerBound':2500,'upperBound':None,'recipientCount':None}}
  put(r,'amount',dict(amounts[row],amountPeriodExplicit=None,currentChildFundingUnknown=True),'aopa',ex)
  paths={407:{'advancedTrainingExamplesNonExhaustive':['tailwheel','upset recovery','other advanced ratings']},408:{'primaryCertificateAlternatives':['Sport','Recreational','Private Pilot']},409:{'rating':'Seaplane'}}
  put(r,'studyPath',paths[row],'aopa',ex)
  ps='AOPA parent program only; no child-specific or current offering assignment'
  put(r,'parentTiming',{'fallYearlessWindow':['10-01','12-31'],'springYearlessWindow':['04-01','06-30'],'closeTimeLiteral':'11:59 p.m. ET','decisionDatesYearless':{'fall':'04-15','spring':'09-15'},'year':None,'saysAcceptingApplications':True},'aopa',parent,state='unverified',scope=ps)
  put(r,'parentEligibility',{'currentAOPAMembership':True,'residentJurisdictions':['United States & District of Columbia','Canada','Guam','Puerto Rico','U.S. Virgin Islands'],'freeHighSchoolMembershipStated':True,'membershipRoutesUnvisited':True},'aopa',parent,state='unverified',scope=ps)
  put(r,'parentMaterials',{'transcriptReferencesAndOtherMaterialsBeforeDeadline':True,'lateOrIncompleteApplicationsNotAccepted':True,'completeChildMaterialsUnknown':True},'aopa',parent,state='unverified',scope=ps)
  put(r,'parentApplication',{'separateSystemAccountFromAOPALogin':True,'oneGeneralApplicationAutomaticMatching':True,'numberAndValueDependOnDonorFundingMayFinalizeBeforeAnnouncement':True,'accountAndFormUnvisited':True},'aopa',parent,state='unverified',scope=ps)
  put(r,'parentFunding',{'annualAggregateUSDLowerBound':1000000,'rangeUSD':[250,14000],'donorFundingMayVary':True,'notNamedChildAwardAmountOrOffering':True},'aopa',parent,state='unverified',scope=ps)
  put(r,'parentAwardConditions',{'prepaidExpenseCard':True,'flightTrainingExpiryMonthsAfterAward':12,'aviationMaintenanceExpiryMonthsAfterAward':24},'aopa',parent,state='unverified',scope=ps)
  put(r,'parentReapplication',{'unsuccessfulApplicantsMayResubmitNextPeriod':True,'notChildRenewalProof':True},'aopa',parent,state='unverified',scope=ps)
 elif row==410:
  put(r,'identityObservation',{'namedProgramObserved':'Hilleman/Morelli Scholarship','institution':'Montana State University','distinctFromGeneralHillemanApplicationScope':True,'mapping':'proposed; held'},'msuMorelli')
  put(r,'eligibility',{'MontanaResidentStudents':True,'studentsWithLearningDifferences':True,'intrinsicCommunityImpactMotivation':'with degree in science, technology, engineering or math discipline','academicLeadershipCareerPotentialSelection':True,'allVariantsHeldSeparately':True},'msuMorelli')
  put(r,'studyPath',{'institution':'Montana State University','degreeDisciplineAsPrinted':['science','technology','engineering','math'],'degreeLevelUnverified':True},'msuMorelli')
  put(r,'supportDuration',{'years':4,'support':['financial','academic','leadership','mentoring'],'awardAmountUnknown':True,'annualRenewalRulesUnknown':True},'msuMorelli')
  put(r,'foundationVariant',{'learningDifferencesDemonstration':True,'years':4,'selectionPotential':['academic','leadership','career'],'MontanaResidencyAndSTEMNotRestatedInSelectedPassage':True,'notAnAcceptedUnionOrIntersection':True},'foundation',state='unverified',scope='Foundation Morelli program passage; source variant, no exclusion inference from omitted criteria')
  put(r,'application',{'linkedGeneralHillemanApplication':'https://www.montana.edu/hillemanscholars/apply.html','routeObservedFromBothProgramSources':True,'noFormInteraction':True,'childSpecificCurrentApplicabilityUnknown':True},'msuMorelli',state='unverified')
  gs='General Hilleman application only; linked by Morelli sources, exact child/current applicability unverified'
  put(r,'generalHillemanCycle',{'studentsStartingAtMSUFall2026':True,'deadline':None,'currentChildOfferingUnknown':True},'hilleman',state='unverified',scope=gs)
  put(r,'generalHillemanMaterials',{'personalReference':{'examples':['high school teacher','coach','counselor','another significant influence'],'familyMemberExcluded':True,'programContactsReferenceAfterSubmissionForRecommendation':True},'essay':{'approximateWordRange':[500,1000],'readLinkedHillemanBiography':True,'prompts':['how his story inspires own MSU studies','personal aspirations','how work ethic will achieve academic, leadership, and/or career goals']},'preSubmissionCounselorTeacherCoachReviewEncouragedNotRequired':True,'completeApplicationInputsUnknown':True},'hilleman',state='unverified',scope=gs)
  put(r,'generalApplicationExcludedStructure',{'blankInputsAndHomeResponsibilitiesPaidWorkFamilyHistoryVolunteerQuestionsExcludedFromRetainedSelection':True,'notProofOfCompleteMaterialsOrFormSilence':True,'noApplicantResponsesObserved':True},state='unverified',scope=gs)
 elif row==411:
  put(r,'identityObservation',{'programName':r['recordedName'],'sponsor':'Montana State Fund','mapping':'proposed; held'},'msf')
  put(r,'cycle',{'applicationYear':2026,'openingDate':'2026-10-07','deadlineDate':'2026-11-13','deadlineTime':None,'timezone':None,'dateOnly':True,'pageResponseNotCurrentOfferingProof':True},'msf',state='unverified')
  put(r,'eligibility',{'enrolledFullTime':True,'goodStanding':True,'approvedProgramRequired':True,'approvedProgramDefinitionUnknown':True,'IHOrOSHStudents':True,'demonstrateDesireToChampionSafetyInChosenField':True},'msf')
  put(r,'studyPath',{'programAlternatives':['Industrial Hygiene','Occupational Safety and Health'],'degreeLevelUnknown':True},'msf')
  put(r,'amount',None,state='unverified',scope='Award heading contains opening date, no monetary award inferred; unseen application held')
  put(r,'application',{'applyHereObserved':True,'url':None,'queryBearingDestinationHeldInConversionHashRoutes':True,'unvisited':True,'materialsAndProgramListUnknown':True},'msf',state='unverified')
 else:
  put(r,'identityObservation',{'program':'EAA Ray Aviation Scholarship','fundedBy':'Ray Foundation','managedBy':'EAA','administeredThrough':'EAA Chapters network','mapping':'proposed; held'},'eaa')
  put(r,'amount',{'USDUpperBound':12000,'purpose':'flight training expenses','annualAggregateFundingUSD':2250000,'annualAggregateNotIndividualAward':True,'individualCurrentFundingUnknown':True},'eaa')
  put(r,'eligibility',{'poweredFlightAgeInclusive':[16,19],'poweredPaths':['Private','Sport Pilot'],'gliderAgeInclusive':[15,19],'studentPilotCertificate':'U.S. scholars only','medicalCertificate':'at least 3rd class; Private Pilot students only','atLeastOneEAAYoungEaglesFlight':True,'ableToBeginWithinDays':30,'startDateDefinition':'last day of month scholar approved by EAA'},'eaaScholar')
  put(r,'selectionPreferences',{'additionalConsideration':['multiple Young Eagle flights','EAA student membership','active EAA Young Eagles Flight Plan participation, specifically Sporty’s Learn to Fly Course'],'preferencesNotAdditionalHardRequirements':True},'eaaScholar')
  put(r,'nomination',{'localChapterVetsAndSelectsCandidates':True,'EAAApplicationScreeningAndApprovalAfterChapterSelection':True},'eaaScholar')
  put(r,'scholarObligations',{'chapterVolunteerHoursPerMonth':2,'serviceExamples':['Young Eagles rally','pancake breakfast/fly-ins','aircraft build/restoration','chapter gathering','newsletter/website/social media maintenance'],'regularProgressReportsAtMonthlyCheckIns':True,'milestonesMonths':{'firstSoloIfApplicable':3,'writtenExamIfApplicable':6,'checkride':12},'fundingDependsOnTimelyMilestonesAndReports':True,'failureMayDiscontinueAward':True},'eaaScholar')
  put(r,'studyPath',{'powered':['Private','Sport Pilot'],'gliderTraining':True,'trainingMilestonesSeparatelyConditional':True},'eaaScholar')
  put(r,'chapterFunding',{'coreEAAAndDivisionalChapters':['United States','Canada'],'coreGrantUSDUpperBound':12000,'matchingChapterPreviouslyMentoredRayScholarThroughFlightTraining':True,'matchingSharesPercent':{'chapter':25,'RayFoundation':75},'notStudentResidencyOrAmountGuarantee':True},'eaa',scope='Chapter grant requirements/funding distinct from scholar criteria')
  put(r,'chapterTiming',{'fullYearlessWindow':['11-01','01-31'],'matchingYearlessWindow':['11-01','12-31'],'fullApprovalMonth':'February','matchingApprovalMonth':'January','chapter2027OpeningDate':'2026-11-01','notStudentApplicationOpening':True},'eaa',state='unverified',scope='Chapter application timing only')
  put(r,'scholarTiming',{'fullScholarshipNominatedScholarsYearlessWindow':['February','08-31'],'matchingScholarsMayApplyStartingMonth':'January','EAAApprovalFrequency':'monthly','individualCurrentCycleUnknown':True},'eaa',state='unverified',scope='Scholar application timing; separate from 2027 chapter opening')
  put(r,'application',{'portal':'https://webportalapp.com/sp/rayaviationchapter_20','portalChapterCoordinatorsOnly':True,'studentsDirectedToLocalChapterCoordinator':True,'portalUnvisited':True,'noContactPerformed':True},'eaa')
  put(r,'chapterAccessHold',{'memberOnlyNoticeObserved':True,'chapterCriteriaContentInaccessible':True,'noLoginRegisterJoinAction':True},'eaaChapter',state='inaccessible',scope='Selected chapter-requirements access notice only')
 records.append(r)
fields=sum(len(r['fieldProposals']) for r in records);oldfields=sum(len(r['fieldProposals']) for p in prior for r in p['records'])
coverage=dict(checkpointInputs=6,fieldEnvelopes=fields,sourceReceipts=8,newPublicRetrievals=8,nativeReadableRetrievals=0,nativeMetadataRetrievals=0,outcomes={'researched-held':6},cumulativeInitialDispositions=406,cumulativeAutonomousHeldFields=oldfields+fields,cumulativeAutonomousHeldIdentities=406,unprocessedInputs=0)
ledger=dict(schemaVersion=1,checkpointId='021',scope='One bounded final initial-coverage SD2 checkpoint, not SD2 completion or acceptance',entryCommit=ENTRY,queueSha256=sha((B/'queue.json').read_bytes()),queueOffsetStart=400,queueOffsetEndExclusive=406,orderedInputKeys=[r['inputKey'] for r in records],records=records,sourceRegistry=sources,nextCheckpointInputOffset=406,nextInputKey=None,nextInputName=None,nextAction='Stop: frozen initial queue exhausted. Separately select bounded SD2 consolidation/hold reconciliation; do not initialize/reset/replay, accept facts or begin SD3.',acceptedFacts=0,canonicalAcceptance=False,fullSD2Complete=False,initialQueueCoverageComplete=True,SD3Started=False,coverage=coverage,inheritedOpenRoutes=dict(allPriorLedgers=list(range(1,21)),fields=oldfields,identities=400,allPriorPacketsPRELUDESection9M1Routes='byte-preserved; original owners/triggers/actions'),preservedGates=prior[-1]['preservedGates'],sourcePolicyDeviations=load(P/'capture-metadata.json')['handlingHistory'],limits=['Selected provider conversions only; raw/original/native/visual/full form/page/image/table/source-silence/current/public/sponsor/route continuity unknown.','All eight measured client intervals sequential; no independent provider telemetry. Earlier016overlap/018unmeasured and output history unchanged.','General Hilleman input form structure excluded; exact named child applicability and current cycle held. No form interaction or applicant responses.','Chapter premium/login barrier and all application/account/document routes stay held; no login/contact/portal interaction.','Initial saved input dispositions complete, but SD2 identity/field reconciliation, human/canonical acceptance and all later gates remain incomplete. Stop before SD3.'])
write(B/'checkpoint-021.json',ledger)
intervals=[{k:s[k] for k in ['sourceId','originalUrl','callStartedAt','callCompletedAt']} for s in sources]
assert all(a['callCompletedAt']<=b['callStartedAt'] for a,b in zip(intervals,intervals[1:]))
write(P/'concurrency-audit.json',dict(clientIntervals=8,maximumMeasuredConcurrentReads=1,measuredSameHostOverlaps=[],normalizedHosts=[s['originalUrl'].split('/')[2].lower() for s in sources],independentProviderTelemetry=False,intervals=intervals))
write(P/'source-concordance.json',dict(scope='Author selected-line comparison to retained in-session conversions; no independent original fidelity',authorSelectedLineConcordance=True,independentOriginalFidelity=False,sources=[s['sourceId'] for s in sources],limits='Contacts/query values/imagery/donors and unrelated scope omitted; hilleman introduction contact tail trimmed; exact excerpts bind saved selections only. Full raw conversion hashes unavailable.'))
rows=['|Saved row|Exact saved name|Outcome|Next action|','|---|---|---|---|']+[f"|{r['rowLocator']}|{r['recordedName']}|{r['outcome']}|{r['nextAction']}|" for r in records]
readme='''# SD2 checkpoint021 - final six initial dispositions

One bounded local held-research checkpoint: frozen offsets400:406/savedrows407-412.
Never initialize/reset/replay. Initial queue coverage is complete; full SD2 remains
incomplete. No canonical acceptance, accepted facts or SD3. Existing earlier holds,
review bindings, nine attention rows/supplements,437M1routes and71custodypins stay exact.

Eight sequential public retrievals yielded selected conversions only. Three AOPA
children remain past examples. Hilleman/Morelli MSU/foundation variants and linked
general Hilleman application stay separate. Montana State Fund dates are date-only;
Award heading supplies no amount. Ray chapter versus scholar timing, funding,
nomination, conditional certificates/medical, preferences, monthly service/reports
and milestones are separate. Chapter requirements remain member-only. No login,
form interaction, applicant response, contact or platform visit occurred.

Source selections exclude donor/recipient/staff biography, contact/footer, images,
unrelated awards, blank input structure and query values. Preview handling history
is disclosed in capture-metadata.json; final sanitization erases none. All128
converted Markdown destination occurrences have hash-only owned routes, including
excluded scope. Selected source links have explicit routes. No original/native/
visual/completeness/silence/public/sponsor/route/origin freshness proof is claimed.
Author concordance is not independent original source fidelity. Earlier history
limits including016overlap/018unmeasured retain original owners/triggers/actions.

Every new record/field/source/seed/link remains held with explicit owner, trigger
and nextAction. Exact typed observations/excerpts are in checkpoint-021.json.
Excluded general-form prompts/material completeness remain unknown. All earlier
routes retain exact saved actions; coverage completion does not resolve identity,
fact, preservation, human/canonical/publication/student/monitor/effect gates.
Required command evidence is in validation.json; build/fresh-main remain gates.

'''+ '\n'.join(rows)+'\n\nCoverage: '+json.dumps(coverage,sort_keys=True)+'.\n\nNext cursor406, no next input. STOP. Next-session Codex may prepare an exact bounded SD2 consolidation/hold-reconciliation proposal from saved evidence; Kelsey selects further scope where required. No automatic consolidation, source replay, fact acceptance, remote Git or SD3.\n'
assert not (P/'README.md').exists();(P/'README.md').write_text(readme)
print(json.dumps(coverage,indent=2))
