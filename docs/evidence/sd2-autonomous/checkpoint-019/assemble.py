"""One-time checkpoint019 assembler. Refuses to overwrite; never initializes/replays queue."""
from pathlib import Path
import json,hashlib,subprocess,copy,datetime,re,urllib.parse,collections
P=Path(__file__).resolve().parent; B=P.parent; R=P.parents[3]
ENTRY='1b2fb382c263dcc37e2210eee2d01ebe7337a2df'
load=lambda p:json.loads(p.read_text()); sha=lambda b:hashlib.sha256(b).hexdigest()
now=lambda:datetime.datetime.now(datetime.timezone.utc).isoformat()
OWNER='Codex source/identity reconciliation'
TRIGGER='Applicable authorized evidence arrival or SD2 consolidation after initial remaining-queue coverage'
def write(p,v):
 assert not p.exists(),str(p)
 p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
assert not (B/'checkpoint-019.json').exists()
q=load(B/'queue.json'); prior=[load(B/f'checkpoint-{i:03d}.json') for i in range(1,19)]
assert [r['inputKey'] for p in prior for r in p['records']]==[r['inputKey'] for r in q['records'][:360]]
assert q['records'][360]['inputKey']=='saved-405588227-row-366'
sources=load(P/'capture-metadata.json')['sources']; reg={s['sourceId']:s for s in sources}
texts={s['sourceId']:(P/'sources'/(s['sourceId']+'.md')).read_text() for s in sources}
def part(s,a,z=None):
 t=texts[s];i=t.index(a);j=t.index(z,i+len(a)) if z else len(t);return t[i:j].strip()
scopes={(367,'wts'):part('wts','#### Junior College','#### WTS Transportation'),(368,'wts'):part('wts','#### Molitoris','#### Junior College'),(378,'wts'):part('wts','#### WTS Transportation'),(373,'wts'):part('wts','#### <PRIVATE_PERSON> Memorial','#### Molitoris'),(380,'aopa'):part('aopa','## AOPA Foundation Scholarship','## Cleveland'),(381,'aopa'):part('aopa','## Cleveland')}
for s in sources:
 s.update(artifactPath=str((P/'sources'/(s['sourceId']+'.md')).relative_to(R)),artifactSha256=sha(texts[s['sourceId']].encode()),originalUrlSha256=sha(s['originalUrl'].encode()),owner=OWNER,trigger=TRIGGER,nextAction='Reconcile exact named program/source scope, applicable cycle, unseen documents, identity and current/public/route continuity; retain every held variant and unknown. No interaction or acceptance.',observationRecordedAt=s['callCompletedAt'],convertedTextSha256=None)
 s['redirectDisposition']='Same-host resource-preserving redirect; WTS alias, MSU index-directory or ND singular-plural resource path' if s['originalUrl']!=s['finalUrl'] else 'Provider final URL equals requested URL; no origin/public/sponsor continuity proof inferred'
 assert urllib.parse.urlsplit(s['originalUrl']).hostname==urllib.parse.urlsplit(s['finalUrl']).hostname
 s['linkDispositions']=[]
 for u in dict.fromkeys(re.findall(r'\]\((https?://[^\s)]+)',texts[s['sourceId']])):
  masked='[query-withheld]' in u
  ids=[x['sourceId'] for x in sources if u in [x['originalUrl'],x['finalUrl']]] if not masked else []
  s['linkDispositions'].append(dict(url=None if masked else u,locatorBase=u.split('[query-withheld]')[0] if masked else None,sourceIds=ids,disposition='Retrieved selected program conversion' if ids else 'Deferred official document, related resource or application/account locator; no interaction or inferred rules',owner=OWNER,trigger=TRIGGER,nextAction=s['nextAction']))
 s['selectionAccounting']={'convertedCharacters':s['convertedCharacters'],'selectedCharacters':len(texts[s['sourceId']]),'omittedCharactersNet':s['convertedCharacters']-len(texts[s['sourceId']]),'limits':'Selected passages and explicit image/query/biography omissions only; converted-character counts do not prove original/raw/native/visual/page/table/form completeness or source silence.'}
records=[]
base=['identityObservation','cycle','amount','eligibility','minimumGPA','need','schoolType','studyPath','applicantStage','affiliation','renewal','reapplication','nomination','materials','application']
def put(r,k,v,ids=(),state='verified',scope='Exact named child and explicitly stated source variant only; identity/current applicability remain held.',excerpt=None):
 ev=[]
 for sid in ids:
  s=reg[sid];t=excerpt or scopes.get((r['rowLocator'],sid),texts[sid].strip());assert t in texts[sid]
  start=texts[sid][:texts[sid].index(t)].count('\n')+1
  ev.append(dict(sourceId=sid,sourceUrl=s['originalUrl'],sourceUrlSha256=s['originalUrlSha256'],artifactPath=s['artifactPath'],artifactSha256=s['artifactSha256'],locator=f'Selected passage lines {start}-{start+t.count(chr(10))}',excerpt=t))
 r['fieldProposals'][k]=dict(value=v,state=state,acceptance='held',sourceScope=scope,observationRecordedAt=now(),sourceRevision=None,freshness='As-observed selected conversion; no current/future child offering or original/native/origin proof',evidence=ev,semanticAssertion='Typed held observation: '+json.dumps(v,ensure_ascii=False,separators=(',',':')) if v is not None else 'Unknown remains non-excluding.',owner=OWNER,trigger=TRIGGER,nextAction=r['nextAction'])
def rec(row,ids,action,status='researched-held'):
 seed=next(x for x in q['records'][360:380] if x['rowLocator']==row);r=copy.deepcopy(seed)
 r.update(status=status,outcome=status,allowedSourceIds=ids,owner=OWNER,trigger=TRIGGER,nextAction=action,fieldProposals={},seedDispositions=[])
 for k in base:put(r,k,None,state='unverified')
 for u in dict.fromkeys(seed['recordedSeedUrls']+seed['publishedSourceAliases']):
  masked='?' in u or '@' in u;ids2=[s['sourceId'] for s in sources if s['sourceId'] in ids and u in [s['originalUrl'],s['finalUrl']]]
  r['seedDispositions'].append(dict(url=None if masked else u,urlSha256=sha(u.encode()),inputPointer=f"queue.json:{seed['inputKey']}",sourceIds=ids2,disposition='Retrieved selected conversion, including pinned same-host alias where stated' if ids2 else 'Deferred exact locator/annotated seed/alias or account/application platform; no visit or rule inference',owner=OWNER,trigger=TRIGGER,nextAction=action))
 for k in ['recordedSeedUrls','publishedSourceAliases']:r[k]=['[query-bearing locator withheld; immutable queue hash/pointer]' if '?' in u or '@' in u else u for u in r[k]]
 records.append(r);return r

r=rec(366,['hilleman','hillemanroot'],'Reconcile general Hilleman Montana-resident leadership scope, Fall2026 application version, essay/reference/prompts and image/table gaps; keep separate from narrower Hilleman/Morelli; no new-cycle or shared-rule acceptance.')
put(r,'identityObservation',{'namedProgramObserved':'MSU Hilleman Scholars Program','mapping':'proposed; held','distinctFromHillemanMorelli':True},['hillemanroot'])
put(r,'cycle',{'applicationNamesEntryTerm':'Fall 2026','displayedOpenStatement':True,'deadline':None,'futureOfferingUnknown':True},['hilleman'],state='unverified')
put(r,'eligibility',{'residency':'Montana residents','program':'leadership','demonstratedPotential':['academic','leadership','career']},['hillemanroot'])
put(r,'materials',{'personalReference':{'acceptableExamples':['high school teacher','coach','counselor','another significant influence'],'familyMemberPermitted':False,'institutionSendsRecommendationInstructionsAfterSubmission':True},'essay':{'approximateWords':[500,1000],'readBiographyFirst':True,'topics':['how biography inspires MSU studies','personal aspirations','work ethic for academic/leadership/career goals']},'otherPrompts':['home responsibilities and academic impact','paid work during high school','family history and relationships','volunteering frequency and learning or reasons none'],'promptsAreNotEligibilityRequirements':True},['hilleman'])
put(r,'application',{'staticBlankFormConversionOnly':True,'noInteraction':True,'applicationProgressNotAutomaticallySaved':None,'imagesTablesComplete':False},['hilleman'],state='unverified')

for row,child,amount in [(367,'Junior College/Trade School Scholarship',2500),(368,'Molitoris Leadership Scholarship for Undergraduates',5000),(378,'WTS Transportation YOU High School Scholarship',2500)]:
 r=rec(row,['wts'],'Reconcile exact WTS child, parent2027 opening/chapter nomination and extra chapter requirements; preserve child gender/study/leadership scope and unknown full materials/GPA/deadline. Uninspected guidelines/coversheet remain held.')
 put(r,'identityObservation',{'namedChildObserved':child,'mapping':'proposed; held'},['wts'])
 put(r,'amount',{'USD':amount,'period':None,'recipientCount':None},['wts'])
 put(r,'cycle',{'parent2027Opening':'2026-12-14','parentAnnualWinnerAnnouncement':'May of following year','childDeadline':None,'notCurrentChildOpenProof':True},['wts'],state='unverified',scope='WTS Foundation parent program, not Strategic Partner program or a guaranteed future child offering.',excerpt=part('wts','### WTS Foundation','#### <PRIVATE_PERSON> Memorial'))
 put(r,'nomination',{'allApplicationsThroughChapter':True,'chapterWinnersSubmittedAnnuallyToFoundation':True,'chapterAdditionalRequirementsMayInclude':['personal interviews','higher GPA'],'localChapterIdentityUnknown':True},['wts'],state='unverified',scope='WTS Foundation parent program only; exact local chapter requirements unresolved.',excerpt=part('wts','### WTS Foundation','#### <PRIVATE_PERSON> Memorial'))
 if row==367:put(r,'eligibility',{'women':True,'transportationRelatedStudy':True,'institutionTypes':['community','technical','trade college'],'degreeOR':['Associate','technical degree']},['wts'])
 if row==368:put(r,'eligibility',{'women':True,'level':'undergraduate','transportationLeadership':'leadership qualities receive special selection attention'},['wts'])
 if row==378:put(r,'eligibility',{'girls':True,'level':'high school','studies':['science','technology','engineering','math']},['wts'])

r=rec(369,['msuresident'],'Reconcile historical Fall2026 Premier tuition/GPA bands, automatic freshman consideration and first-bachelor scope, separate2.5renewal/15credits/residency/continuous enrollment, no MUS-Presidential stacking, term-specific reevaluation and unknown2027 terms.')
premier=part('msuresident','## Montana Premier Scholarship Program','## Montana Treasure State First Generation')
put(r,'identityObservation',{'namedProgramObserved':'Montana Premier Scholarship Program','mapping':'proposed; held'},['msuresident'],excerpt=premier)
put(r,'cycle',{'sourceTerms':'Fall 2026','fall2027InformationPending':True,'awardSpecificToEnrollmentYear':True,'deadline':None},['msuresident'],state='unverified')
put(r,'amount',{'annualUSDRange':[1000,4000],'maximumYearsAsStated':4,'tuitionOnly':True,'bands':[['4.0+',4000],['3.5 - 3.99',3000],['3.0 - 3.49',2000],['2.7 - 2.99',1000]],'belowListedBandsUnknown':True},['msuresident'],excerpt=premier)
put(r,'eligibility',{'MontanaFreshmen':True,'firstUndergraduateBachelorOnly':True,'cumulativeHighSchoolGPAProvided':True,'testScoresRequired':False},['msuresident'],excerpt=premier)
put(r,'renewal',{'minimumCumulativeGPA':2.5,'minimumSemesterCredits':15,'residentStatusMaintained':True,'continuousEnrollment':True,'fourYearsAsStated':True},['msuresident'],excerpt=premier)
put(r,'application',{'automaticConsiderationWithAdmissionApplicationAndSelfReportGPA':True,'noInteraction':True,'GPAChangeReconsiderationMayBePossible':True},['msuresident'])
put(r,'stacking',{'cannotStackWith':['MUS Honors Scholarship','Presidential Scholarship'],'higherValueHonored':True,'acceptingPremierDoesNotPreventGreaterAwardConsideration':True},['msuresident'])
put(r,'deferral',{'startTermSpecific':'reevaluated under later year parameters rather than deferred award','freshmanDualEnrollmentAPIB':'credits taken in high school preserve freshman classification','transferDefinition':'12 or more college credits after high-school graduation'},['msuresident'])

r=rec(370,['msuresident'],'Reconcile historical Fall2026 Treasure first-generation self-report/Montana-resident rule,1500annual/fouryears/Premier stacking; first-generation definition and Treasure-specific renewal thresholds remain unknown, never copy Premier15credit/2.5 rules.')
treasure=part('msuresident','## Montana Treasure State First Generation','## Frequently Asked Questions:')
put(r,'identityObservation',{'namedProgramObserved':'Montana Treasure State First Generation Scholarship','mapping':'proposed; held'},['msuresident'],excerpt=treasure)
put(r,'cycle',{'sourceTerms':'Fall 2026','fall2027InformationPending':True,'deadline':None},['msuresident'],state='unverified')
put(r,'eligibility',{'MontanaResident':True,'selfReportFirstGenerationOnAdmissionApplication':True,'firstGenerationDefinitionUnknown':True},['msuresident'],excerpt=treasure)
put(r,'amount',{'annualUSD':1500,'renewableYearsAsStated':4,'statedTotalUSD':6000,'mayStackOnPremier':True},['msuresident'],excerpt=treasure)
put(r,'renewal',{'renewableForFourYearsAsStated':True,'GPAThreshold':None,'creditRequirement':None,'PremierRenewalRulesNotTransferred':True},['msuresident'],state='unverified',excerpt=treasure)

r=rec(371,['umexternal'],'Reconcile UM-specific National Merit finalist2000annual/UMfirstchoice versus enrolledsemifinalist1000annual, permitted stacking and unknown cycle/renewal/materials; do not substitute national corporation or other university terms.')
put(r,'identityObservation',{'namedProgramObserved':'National Merit Scholarship Program at University of Montana','mapping':'proposed; held'},['umexternal'])
put(r,'amount',{'UMFinalistAnnualUSD':2000,'UMSemifinalistAnnualUSD':1000,'guaranteedDurationUnknown':True},['umexternal'])
put(r,'eligibility',{'variantFinalist':{'NationalMeritFinalist':True,'UMFirstChoiceIndicated':True},'variantSemifinalist':{'NationalMeritSemifinalist':True,'enrollAtUM':True}},['umexternal'])
put(r,'stacking',{'mayHoldInAdditionTo':['Presidential Leadership Scholarship','departmental scholarships']},['umexternal'])

r=rec(372,['umdefault','umnew'],'Reconcile Payne Family Impact exact named child/sponsor/current offering and award-specific evidence; generic UM parent timing/menu does not establish identity, absence, eligibility or closure.',status='held-identity')
put(r,'identityObservation',{'queuedName':'Payne Family Impact Scholarship','namedChildEstablished':False,'genericUMSourcesOnly':True,'noSourceSilenceOrAbsenceInference':True},['umdefault','umnew'],state='unverified',scope='General UM scholarship parent only, no Payne child terms.')

r=rec(373,['wts'],'Reconcile exact Sharon D. Banks title against provider-redacted undergraduate profile; no ordinal/adjacent-name assignment. Preserve unassigned5000/women/undergraduate/transportation variant separately; queued child terms unknown.',status='held-identity')
put(r,'identityObservation',{'queuedName':r['recordedName'],'redactedTitleCannotEstablishNamedChild':True,'ordinalAssignmentForbidden':True},['wts'],state='unverified')
put(r,'unassignedSourceProfile',{'providerTitle':'<PRIVATE_PERSON> Memorial Undergraduate Scholarship','USD':5000,'women':True,'undergraduateStudy':'transportation or related field','notAssignedToQueuedName':True},['wts'],state='unverified',scope='Unassigned provider-redacted profile only; no transfer into queued named child fields.')

r=rec(374,['wts','wtsstrategic'],'Reconcile2027StrategicPartner six5000 versus parent historical2026seven, minimum3.0/enrolledUGorgraduate/transportationstudy-and-career, December11yearless closure and futureconference; references/personalstatement selection guidance separate from mandatory unseenform. Account remains locator.')
put(r,'identityObservation',{'namedProgramObserved':'WTS Strategic Partner Scholarships','mapping':'proposed; held'},['wtsstrategic'])
put(r,'cycle',{'articleLabels2027Open':True,'applicationCloseText':'Friday, December 11','closeYearExplicit':None,'timezone':None,'annualConference':'May 4-6, 2027','futureOrCurrentOfferingUnaccepted':True},['wtsstrategic'],state='unverified')
put(r,'amount',{'article2027':{'recipientCount':6,'USD':5000},'parent2026':{'recipientCount':7,'USD':5000},'distinctYearVariants':True},['wts','wtsstrategic'],state='unverified',excerpt=None)
put(r,'eligibility',{'enrolledAtApplication':True,'levelOR':['undergraduate','graduate'],'transportationRelatedField':{'examples':['engineering','planning','finance','construction/project management','logistics']},'plansTransportationCareer':True},['wtsstrategic'])
put(r,'minimumGPA',{'entry':3.0},['wtsstrategic'])
put(r,'materials',{'strongApplicationGuidance':['leadership and engagement in chosen field','compelling personal statement','references demonstrating strong support'],'mandatoryFullFormRequirementsUnknown':True},['wtsstrategic'],state='unverified')
put(r,'awardConditions',{'winnersInvitedAsSpecialGuestsToAnnualConference':True,'acceptOnStageAtFoundationGala':'Washington DC May2027','mandatoryAttendanceCostOrTravelCoverageUnknown':True},['wtsstrategic'],state='unverified')

r=rec(375,['ndalliance','morelli'],'Reconcile NDcommunity legacy dyslexia/STEM national-sounding description against foundationMSU-onlyfrom2026 transition and narrower four-yearHilleman/Morelli learning-differences/potential criteria; shared generalHilleman application is locator only, no union/intersection or automaticidentitymerge.')
put(r,'identityObservation',{'queuedLegacyFoundationName':r['recordedName'],'foundationTransitionToMSUObserved':True,'relationshipToHillemanMorelli':'proposed; held','notGeneralHillemanIdentityAcceptance':True},['ndalliance','morelli'],state='unverified')
put(r,'cycle',{'foundationDissolutionTransfer':'2025-12-31','MSUOnlyStarts':2026,'liveApplicationWindow':None,'legacyCommunityDescriptionApplicabilityUnknown':True},['morelli'],state='unverified')
put(r,'eligibility',{'communityLegacyVariant':{'highSchoolAndCollegeStudents':True,'dyslexia':True,'STEMDegreeIntent':True},'foundationTransitionVariant':{'attendMSUStarting2026':True,'STEMEducation':True},'HillemanMorelliVariant':{'learningDifferences':True,'selectionPotential':['academic','leadership','career']},'variantsNotCombined':True},['ndalliance','morelli'],state='conflict')
put(r,'amount',{'USD':None,'HillemanMorelliDurationYears':4,'support':['financial','academic','leadership','mentoring']},['morelli'],state='unverified')
put(r,'application',{'foundationLinksGeneralHillemanApplication':True,'noInteraction':True,'sharedRouteDoesNotTransferGeneralHillemanRequirements':True},['morelli'],state='unverified')

r=rec(376,['umaas','umdefault'],'Reconcile UMAAS firstbachelor/UG-transfer/automaticadmission and unofficialHS transcript, verbatimoverlappingGPA bands/unstatedamountperiod, tuitionstacking/replacement, entry-onlyqualification, cohort2.5/15or12credits/30or24annual, noSummer/onlineonly/Missoula-Bitterroottransfer, remainingduration/degreecompletion and genericJuly1priority separatefromchilddeadline.')
put(r,'identityObservation',{'namedProgramObserved':'UM Academic Achievement Scholarship (UMAAS)','mapping':'proposed; held'},['umaas'])
put(r,'eligibility',{'undergraduateAndTransfer':True,'firstBachelorDegree':True,'cannotQualifyLaterIfNotQualifiedOnEntry':True,'postBaccalaureateOrGraduateNotEligible':True},['umaas'])
put(r,'amount',{'amountPeriodExplicit':None,'highSchoolGPABandsAsPrinted':[['3.95+',18000],['3.75 to 3.949',16000],['3.34 to 3.749',14000],['3.00 to 3.349',12500],['2.99 and below',5000]],'transferGPABandsAsPrinted':[['3.5+',12500],['3.25 to 3.49',10000],['3.00 to 3.249',5000],['2.99 and below',0]],'overlapAt3_34To3_349Unresolved':True,'noInventedCorrectionOrUnlistedGPAPrecisionRule':True,'tuitionOnly':True},['umaas'],state='conflict')
put(r,'materials',{'unofficialHighSchoolTranscriptRequiredBeforeOfficialOffer':True,'offerOtherwisePreliminary':True,'FAFSAEncouragedNotAssertedRequired':True},['umaas'])
put(r,'application',{'automaticallyConsideredWithAdmission':True,'departmentalRenewableScholarshipUniverseSeparate':True,'noInteraction':True},['umaas'])
put(r,'stacking',{'cannotCombineOtherFullTuitionWaiver':True,'tuitionDesignatedAwardsTotalCannotExceedTuition':True,'otherWaiverOrThirdPartyCoverageMayReduceOrCancel':True,'UMMaySubstituteOtherScholarshipFunds':True},['umaas'])
put(r,'renewal',{'minimumCumulativeGPAAtEndSpring':2.5,'startFall2025OrAfter':{'semesterCredits':15,'annualCredits':30},'startBeforeFall2025':{'semesterCredits':12,'annualCredits':24},'annualTerms':['fall','spring','summer'],'continuousEnrollmentExceptSummer':True,'summerAwardAvailable':False,'forfeitIf':['Missoula/Bitterroot College transfer','online-only'],'availableToMontanaResidents':True,'maxYears':4,'transferRemainingYearsByCredits':[['0-29',4],['30-59',3],['60+',2]],'loseEligibilityAfterBachelorCompletion':True,'appealFormAvailable':True},['umaas'])
put(r,'parentTimingVariant',{'genericIncomingMeritAdmissionApplyBy':'July 1','priorityGivenByDate':True,'yearAndChildDeadlineUnknown':True},['umdefault'],state='unverified',scope='General UM incoming merit program only; not silently assigned as exact UMAAS cutoff.')

r=rec(377,['agc'],'Reconcile AGCWorkforce craft/technical program1000peryear/renewableuptotwoyears and2027-28March1,2027opening; no transfer of undergraduate accreditation/amount rules; fullapplication/renewalconditions and smrshortlink identity remain unknown.')
put(r,'identityObservation',{'namedProgramObserved':'Workforce Development Scholarships','AGCFoundation':True,'mapping':'proposed; held'},['agc'])
put(r,'cycle',{'programYear':'2027-2028','announcedOpening':'2027-03-01','deadline':None,'notCurrentOpenProof':True},['agc'],state='unverified')
put(r,'amount',{'annualUSD':1000,'renewalWording':'renewable for up to two years','guaranteedTotalOrExtraYearsUnknown':True},['agc'])
put(r,'studyPath',{'craftAndTechnicalPrograms':True,'undergraduateABETACCEATMAERulesNotTransferred':True},['agc'])

r=rec(379,['allamerican','npma'],'Reconcile STEAMfemale/accreditedUS/seniororcollege-trade/3.0/passion-and-career/corevalues,2026Oct1-Nov30/January2027,1000oneaward; hold distinct500-1000words vsonepagemin/resume/transcriptofficial/current/recommendation variants and postaward appreciationletter. No acceptedunion/intersection or form entry.')
put(r,'identityObservation',{'namedChildObserved':'All-American Pest Control STEAM Trailblazer Scholarship','mapping':'proposed; held'},['allamerican','npma'])
put(r,'cycle',{'sponsor2026Window':['2026-10-01','2026-11-30'],'sponsorAnnouncement':'mid-January 2027','NPMAAnnualWindow':['10-01','11-30'],'timezone':None},['allamerican','npma'],state='unverified')
put(r,'amount',{'USD':1000,'annualRecipientCount':1},['allamerican','npma'])
put(r,'eligibility',{'female':True,'enrolledStageOR':['high school senior','college student','trade school student'],'accreditedInstitutionInUS':True,'coreValues':['servant leadership','thoughtful innovation','respectfulness','teamwork','reliability'],'demonstrateValuesIn':['academic pursuits','extracurricular activities','community involvement'],'STEAMPassionAndActiveOrPlannedCareer':True},['allamerican','npma'])
put(r,'minimumGPA',{'entry':3.0,'scale':4.0},['allamerican','npma'])
put(r,'materials',{'sponsorVariant':{'essayORVideo':{'essayApproxWords':[500,1000],'videoMinutes':[2,3]},'oneRecommendation':True,'officialMostRecentTranscript':True,'basicPersonalAndEducationDetails':True},'NPMAVariant':{'resumeOrCV':True,'currentAcademicTranscript':True,'essayORVideo':{'essayMinimumPages':1,'videoMinutes':[2,3]},'recommendationMinimum':1},'bothPromptTopics':['STEAM passion','STEAM accomplishments','career aspirations','demonstrated sponsor core value'],'promptCoreValueExamplesDifferBySource':True,'noAcceptedUnionOrIntersection':True},['allamerican','npma'],state='conflict')
put(r,'awardConditions',{'NPMAAppreciationLetterCommitment':True,'letterExplainsAcademicBenefit':True},['npma'])
put(r,'application',{'sponsorDirectsToNPMASubmissionRequirements':True,'NPMALoginLocatorUnvisited':True,'fullFormUnknown':True},['allamerican','npma'],state='unverified')

for row in [380,381]:
 r=rec(row,['aopa'],'Reconcile named AOPA past-example child separately from parent current-open/yearlessperiods/member/residency/sharedapplication/fundexpiry/reapply rules; preserve exactchildamount/certification/age-orOhioORcriteria without currentoffering inference. Account/fullform remain unseen.')
 put(r,'identityObservation',{'namedChildObserved':'AOPA Foundation Scholarship' if row==380 else 'Cleveland Air Show Foundation Scholarships','mapping':'proposed; held','sourceSection':'Examples of Past Scholarships'},['aopa'])
 put(r,'cycle',{'childListedAsPastExample':True,'parentSaysAcceptingApplications':True,'parentFallWindowYearless':['10-01','12-31'],'parentSpringWindowYearless':['04-01','06-30'],'parentClosingTime':'11:59 p.m. ET','parentDecisionDatesYearless':{'fall':'04-15','spring':'09-15'},'childCurrentCycleUnknown':True},['aopa'],state='unverified',scope='AOPA parent program timing only; named child past-example status preserved.',excerpt=part('aopa','# SCHOLARSHIPS','### Examples of Past Scholarships'))
 put(r,'parentEligibility',{'currentAOPAMember':True,'residenceOR':['United States and District of Columbia','Canada','Guam','Puerto Rico','U.S. Virgin Islands'],'fullChildEligibilityUnknown':True},['aopa'],state='unverified',scope='AOPA parent only; no acceptance of current child applicability.',excerpt=part('aopa','# SCHOLARSHIPS','### Examples of Past Scholarships'))
 put(r,'application',{'separateApplicationAccount':'AOPA login will not work','oneGeneralApplicationAutoMatchesEligibleAwards':True,'lateIncompleteNotAccepted':True,'totalAwardsAndValueDependOnDonorFunding':True,'noInteraction':True},['aopa'],scope='AOPA parent only; unseen account/full child form remains held.',excerpt=part('aopa','# SCHOLARSHIPS','### Examples of Past Scholarships'))
 put(r,'materials',{'parentRequires':['transcript','references','other materials before deadline'],'exactChildFullMaterialsUnknown':True},['aopa'],state='unverified',scope='AOPA parent only.',excerpt=part('aopa','# SCHOLARSHIPS','### Examples of Past Scholarships'))
 put(r,'reapplication',{'parentAllowsNextApplicationPeriodResubmissionAfterNotSelected':True},['aopa'],scope='AOPA parent only.',excerpt=part('aopa','# SCHOLARSHIPS','### Examples of Past Scholarships'))
 put(r,'parentFunding',{'prepaidExpenseCard':True,'flightTrainingExpiryMonths':12,'aviationMaintenanceExpiryMonths':24,'fromAwardDate':True},['aopa'],scope='AOPA parent only.',excerpt=part('aopa','# SCHOLARSHIPS','### Examples of Past Scholarships'))
 if row==380:
  put(r,'amount',{'minimumUSDAsStated':2500,'wording':'$2,500 and up','awardCountVaries':True},['aopa'])
  put(r,'eligibility',{'ageLiteral':'Must be 16 years at the time of application submission','minimumOrExactAgeInterpretationHeld':True,'studentPilotCertificate':True},['aopa'],state='unverified')
  put(r,'studyPath',{'primaryCertificationOR':['Sport','Recreational','Private Pilot certificate']},['aopa'])
 else:
  put(r,'amount',{'recipientCount':2,'USD':5000},['aopa'])
  put(r,'eligibility',{'residenceEnrollmentOR':['Ohio resident','student enrolled at Ohio College/University/Flight school']},['aopa'])
  put(r,'studyPath',{'certificateRatingOR':['Private Pilot Certificate','Instrument','Commercial','Muli-engine [source spelling]','CFI','CFII','ATP']},['aopa'])

for row in range(382,386):
 r=rec(row,[],'Reconcile exact named scholarship, sponsor/file/route identity, applicable cycle and every material condition from separately permissible official public program evidence. Exact pinned SmarterSelect application-platform route remains unvisited; never authenticate/interact or infer title/terms from URL.',status='held-access')

records.sort(key=lambda r:q['records'].index(next(x for x in q['records'] if x['inputKey']==r['inputKey'])))
assert len(records)==20
fields=sum(len(r['fieldProposals']) for r in records);oldfields=sum(len(r['fieldProposals']) for p in prior for r in p['records'])
outcomes=dict(collections.Counter(r['outcome'] for r in records))
ledger=dict(schemaVersion=1,checkpointId='019',scope='One bounded local SD2 held-research checkpoint; no canonical acceptance',entryCommit=ENTRY,queueSha256=sha((B/'queue.json').read_bytes()),queueOffsetStart=360,queueOffsetEndExclusive=380,orderedInputKeys=[r['inputKey'] for r in records],records=records,sourceRegistry=sources,nextCheckpointInputOffset=380,nextInputKey=q['records'][380]['inputKey'],nextInputName=q['records'][380]['recordedName'],acceptedFacts=0,canonicalAcceptance=False,fullSD2Complete=False,SD3Started=False,coverage=dict(checkpointInputs=20,fieldEnvelopes=fields,sourceReceipts=len(sources),newPublicRetrievals=len(sources),nativeReadableRetrievals=0,nativeMetadataRetrievals=0,outcomes=outcomes,cumulativeInitialDispositions=380,cumulativeAutonomousHeldFields=oldfields+fields,cumulativeAutonomousHeldIdentities=380,unprocessedInputs=26),inheritedOpenRoutes={'allPriorLedgers':list(range(1,19)),'fields':oldfields,'identities':360,'allPriorPacketsPRELUDESection9M1Routes':'byte-preserved; original owners/triggers/actions'},preservedGates=['exact standard build/fresh authenticated main-target','native preservation/concurrency/version/hiddenP/permissions/private backup/recovery/five-table adapter','human/canonical/publication acceptance','student CSV/browser/filter/fit','437M1 routes/owners/triggers and later setup/activation','every reserved external effect'],sourcePolicyDeviations=['Initial saved-queue preview included a tracking-bearing seed. Early source previews included program contact footer/address, biographical text, unrelated award headings/navigation and blank form field labels. These are excluded from final artifacts; no applicant responses were observed or retained. A selector failed before persistence and was corrected from retained in-session conversions without reacquisition. Final sanitization never erases session history. Codex source/evidence/governance owns later authorized history/canonical/publication assessment.'],limits=['Selected conversions only; no raw/original/native/visual/page/image/table/form completeness, source silence, origin freshness, public/sponsor/route continuity or independent original fidelity.','All15 measured client-call intervals sequential; no provider telemetry or retries.','Four application-platform inputs remain held-access without visiting. Payne/Banks identity holds; no ordinal/name-only mapping.','All earlier review/hold/custody/timing/output history preserved. GPT research review accepts no facts or identities; stop before SD3.'])
write(B/'checkpoint-019.json',ledger);write(P/'source-receipts.json',sources)
write(P/'author-checks.json',{'recordedAt':now(),'scope':'Author semantic checks against retained selected conversions, not independent original fidelity','allFactsHeld':True,'notes':ledger['sourcePolicyDeviations'],'owner':'Codex source/evidence/governance','trigger':'Before each next output and later authorized evidence/history/canonical/publication review','nextAction':'Narrow and sanitize all text/link/query/image/metadata; preserve original handling history and assess at applicable review.'})
cust=copy.deepcopy(load(B/'checkpoint-018/prior-custody-audit.json'));cust['recordedAt']=now();cust['gaps']=[]
for p in cust['pins']:
 f=Path(p['path']);p['observedSha256']=sha(f.read_bytes()) if f.exists() else None;p['status']='matched' if p['observedSha256']==p['recordedSha256'] else 'gap'
 if p['status']=='gap':cust['gaps'].append(p['path'])
write(P/'prior-custody-audit.json',cust)
write(P/'concurrency-audit.json',dict(recordedAt=now(),clientIntervals=len(sources),maximumMeasuredConcurrentReads=1,measuredSameHostOverlaps=[],independentProviderTelemetry=False,scope='Sequential awaited dispatches; normalized host checked before each dispatch; all15 exact client intervals retained. No retries. Historical018firstAWSunmeasured/016overlap remain exact.'))
print(json.dumps(ledger['coverage']))
