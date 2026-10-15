"""Assemble only the new offset140 checkpoint from this session's captures.
Never initialize/reset/replay a queue or overwrite an existing ledger.
"""
from pathlib import Path
import json,hashlib,datetime,subprocess,re,collections
P=Path(__file__).resolve().parent;B=P.parent;ROOT=P.parents[3]
load=lambda p:json.loads(p.read_text());sha=lambda b:hashlib.sha256(b).hexdigest()
def save(p,x):
 assert not p.exists(),str(p)
 p.write_text(json.dumps(x,indent=2,ensure_ascii=False)+'\n')
cap=load(P/'capture-inputs.json');entry=cap['entryCommit'];q=load(B/'queue.json')
assert entry=='d394d074b7e375f9bd6919a7774c9e72f84dae80'
assert not (B/'checkpoint-008.json').exists()
prior=[load(B/f'checkpoint-{i:03d}.json') for i in range(1,8)]
assert [k for c in prior for k in c['orderedInputKeys']]==[r['inputKey'] for r in q['records'][:140]]
now=datetime.datetime.now(datetime.timezone.utc).isoformat()
owner='Codex source/identity reconciliation'
trigger='Applicable authorized evidence arrival or SD2 consolidation after initial remaining-queue coverage'
def route(action):return dict(owner=owner,trigger=trigger,nextAction=action)
meta=load(P/'capture-metadata.json');reg=[]
for m in meta:
 # Preserve saved original locator separately from the same-file connector route.
 if m['id'] in ['sloan','smile-native']:
  m=dict(m,originalUrl=next(u for r in q['records'][140:160] for u in r['recordedSeedUrls']+r['publishedSourceAliases'] if m['metadata']['id'] in u),finalUrl=m['originalUrl'])
 f=P/'sources'/(m['id']+'.md');assert f.exists()
 s=dict(m,sourceId=m['id'],artifactPath=str(f.relative_to(ROOT)),artifactSha256=sha(f.read_bytes()),depth=0,parentSourceId=None,sourceScope='Sanitized selected program/source scope only; excluded fields, images, biographies, contacts and unrelated scope cannot establish silence.',sourceRevision=m.get('sourceRevision'),linkDispositions=[],**route('Reconcile this exact source, public/sponsor continuity, current cycle and deferred material only at its authorized evidence/consolidation trigger. Retain every access/inspection/freshness limit.'))
 if not s.get('observedAt'):
  s['observedAt']=now;s['observationTimeLimit']='Precise initial source-call timestamp was not captured; timestamp is evidence assembly, not exact fetch or origin time.'
 s['finalUrl']=s.get('finalUrl') or s['originalUrl']
 if m['id']=='smile-doc':s['unexpectedExternalRedirectHeld']=True
 if m['id']=='peo':s.update(rawArtifactPath='/private/tmp/sd2-checkpoint-008-raw/peo.pdf',rawSha256=sha(Path('/private/tmp/sd2-checkpoint-008-raw/peo.pdf').read_bytes()),blankDocument=True,pageCount=2,completeLayoutTextInspected=True,sanitizedRulePageViewsInspected=True,publicSponsorContinuityVerified=False)
 reg.append(s)
registry={s['sourceId']:s for s in reg}
aff={144:['peo','peo-parent'],145:['smile-doc','smile-native','smile-page'],146:['ripple','ripple-pdf'],147:['hinderman','hinderman-alias'],148:['macd'],149:['rotary','rotary-parent'],150:['soroptimist'],151:['herriges','herriges-alias'],152:['stimpson'],153:['donk','donk-parent'],154:['evelyn'],155:[],156:['exploring','exploring-pdf'],157:['sloan'],158:['bigsky'],159:['actionair'],160:['kuchenbrod'],161:[],162:['lpa'],163:[]}
for s in reg:
 for u in dict.fromkeys(re.findall(r'https?://[^\s<>)]+',(ROOT/s['artifactPath']).read_text())):
  u=u.rstrip('.,;');matched=[x['sourceId'] for x in reg if x['originalUrl']==u]
  action='inspected-selected-source' if matched else 'locator-only-no-action' if any(x in u.lower() for x in ['racereach','grantinterface','neoncrm','apply.','/forms/','bold.org/applicants']) else 'deferred-material-or-out-of-selected-scope'
  s['linkDispositions'].append(dict(url=u,disposition=action,sourceIds=matched,**route('Retain exact locator; follow only material official program evidence inside depth/host authority. Forms/login/contact and unrelated children remain excluded. No source-silence inference.')))
actions={
144:'Resolve exact Chapter D public/sponsor/native continuity/current offering. Keep one1400/seniorgirl/3.0/Montana highereducation/April15,2026, fullessay/transcript/two nonrelative references and typed-versus-print instruction conflict; financial-need discussion is not a proven numeric need threshold.',
145:'Resolve Smile officialDOCX externalCDN redirect versus exact native alias/currentcycle. Keep six schools/one1000 each/2026senior/essay-first selection/April1,2026/counselor OR singlePDFemail,1–2page typed smileessay/transcript. Program-page404 cannot prove closure; no GPA cutoff from a form label.',
146:'Resolve Ripple parent-versus2026filename/yearlessbody and olderPDFalias. Keep500/WHSorColumbiaFalls senior/2–4year environmentalmajor/3.0 fromPDF,300–500wordwatershedessay,transcript/two teachercontacts; postmark-versus-scanemail route and September1 subsequent award paperwork/photo publicity stay separate. Internship3000/graduateTBD not imported.',
147:'Resolve Hinderman native2026 versus exact2025PDF/currentcycle/sponsor. Keep undeterminedamount/count,April17,2026 versus historicalApril18, need/SAI versus EFC,7thsemesterWHStranscript/seniorresume/twoletters/acceptanceMontanacollege-training, samegraduationyear/fulltimecontinuous/twoyearpossibledisbursement/statusupdates. No automaticrenewal or entryGPA invented.',
148:'Resolve MACD exact official program terms/currentcycle at authorized evidence arrival;403 remains unretried. Jotform untouched, no old2024 two1000 facts imported.',
149:'Resolve Rotary native/publiccurrentcycle and amountminimum-versus1000payment wording; keep fullsenior-yearWHS/graduate/gapyearconfirmation, anyhighereducation, requiredschoolceremony AND Rotarylunch, schoolpayment/upto2yearhold,April17,2026 3:30pm zoneunknown, writtenortypedpersonalpage/twotypedtopicresponses/unofficialtranscript/twononfamilyletters. Inlineimage uninspected; genericparent not silence.',
150:'Resolve exact Whitefish Soroptimist Memorial versus broader organization, current terms and nomination/returning/needscope; GoogleForm untouched. Aboutpage is not program-completeness or offering proof. Original pilot identity remains held.',
151:'Resolve separate Herriges2026requirements/application native/publiccontinuity. Requirements state three3000/April20,2026/Montanaschool/transcript/seniorresume with serviceactivitiesemployment/counselor. LargePDF readabletextempty and batchrawrejection; fullapplication/fields/completeinstructions unknown. No invented GPA/need/highschool scope.',
152:'Resolve exact Stimpson2026program/public currentoffering despite providerredacted awardname. Keep two2000/USHSspring2026/accepted-and-enrolling aviationdegree/3.0on4.0,application/transcript/max2letters/750wordtypeddoublespacedessay,April24,2026receipt/electronicpreferred-versus-mail and selection. No raw-page/visual silence claim.',
153:'Resolve exact DonK application; no legacydate or criteria adopted: filetitle2026 but application/msword/readableempty/rawbatchrejected. Parent list supports namedprogram and five schoolareas only, not full eligibility. Exact native material access/sponsor/currentcycle remain held.',
154:'Resolve EvelynJohnson providerredactedidentity/current2026versusaccesscode25EJMS. Keep RainbowGirls membership/MontanaHSgraduatingsenior/2.0/accrediteddegree, need/activity/goals/motivation selection not needthreshold,typical3000/1–2/onetime/no repeat,Jan1–April30,2026/transcript/FAFSAFSS/portalcode. Portal untouched.',
155:'Only SmarterSelect application locator frozen; no independent permitted programterms or host/sponsor continuity. Preserve Mike/GailDonley spouse identity/amount/date/materials unknown; no login/application read or invented providerURL.',
156:'Resolve AviationExplorer2026parent and yearlessPDFApril30/bodyFeb2026; two2500awards versus five categorytypes/sharedapplication distinct. Keep currentactivepost/under18parent/advisor+councilverification/min3nonfamilyletters, allsameemailPDFs/photo/FAAconditional/transcript,500wordeducationplan/lifeskillsrecords/talentrelease. Part141/61/training/degree/categoryredemption1yeartraining and2or4yearredemption terms distinct; reapplyno carryover,oneaward/year. Three supplementaryblankdocuments deferred, no form action.',
157:'Resolve Sloan native/publiccurrentcycle; art/musiccurrently enrolled AND intended2–4yearmajor AND hardship examplesnonexhaustive. GPA notselectionfactor,amountunknown; essayfewparagraphs/artmusicportfolio/adultletter/institutionpayment/May1,2026 endofdaycounselor OR mailed route. Biographical/contactscope excluded, no exclusive hardship taxonomy.',
158:'Resolve BigSky2027heading FridayMay1 versus actualSaturdayMay1,2027 and possible intendeddate;2026–27junioronly/stateathlete/BigSkyinvolvement. No500legacyamount or fixedslots imported; trade/communitycollege allowed. Form untouched, winners excluded; amounts/materials/actualcycleopen remain unknown.',
159:'Resolve ActionAir markedAwarded2026 versus futurecycle; one2500/May12,2026/June12announcement,undergraduateHVAC atChattanoogaStateCommunityCollege. Noessay versus detailedprofilepreferred,ambitiondriveimpactselection retained. Staticlistingonly/noApply/donorlink or account; winners excluded.',
160:'Resolve Kuchenbrod exactnative/sponsor/current2026; one5000newWHSgraduate/2.5/12creditMontana2–4yeartrade,renew5000upto3additionalyears/separate2.5and12creditproof/annualfamilywrittenupdate. Approximately500wordonepageessay/1–2nonrelativeadultletters/resume/officialHStranscript/FAFSA-SAI/Montanaacceptance/May7,2026 endofdaytodisclosedschoolcontact,schoolpaymentafteracceptance+registration. WEFpriorhistoricalsource not newlyread/replayed; alloriginalroutes preserved.',
161:'Combined AnneAllegraFordThomas2026 Kaleidoscope application locator only; keep Allegra child separate from Anne atrow163. No portal read/parentterms/amount/GPA/date inferred; host/program/childidentity remains held.',
162:'Resolve saved AmericanAirlinesDispatcher versus current LPA DispatcherCertification program; no AApartnername observed in selectedchild, no name-onlymapping. Fall2026parentOct15–Nov5,11:59pmPT,activeLPA17+/USorTerritoriesaccreditedinstitution,parentresume/2letters/2essays/enrollmentproof,child2awards/amountvaries/FAAapproveddispatcherprogram. Parentcycle not acceptedchildopening or member-paymentauthority; membershipform untouched.',
163:'Combined AnneAllegraFordThomas2026 Kaleidoscope application locator only; keep Anne child separate from Allegra atrow161. No portal read/parentterms/amount/GPA/date inferred; host/program/childidentity remains held.'}
basefields=['amount','minimumGPA','gpaBasis','schoolType','residency','membership','needRequirement','needSelection','renewability','reapplication','materials','applicationMethod','deadline','opening','cycle','currentOffering','nomination','eligibility','sourceInspectionLimit']
records=[]
for seed in q['records'][140:160]:
 row=seed['rowLocator'];r=dict(seed,allowedSourceIds=aff[row],outcome='held-access' if row in [148,153,155,161,163] else 'held-identity' if row in [150,162] else 'researched-held',seedDispositions=[],fieldProposals={},**route(actions[row]))
 for key in ['recordedSeedUrls','publishedSourceAliases']:r[key]=[u if not u.startswith('mailto:') else 'mailto:[contact omitted]' for u in seed[key]]
 for u in dict.fromkeys(seed['recordedSeedUrls']+seed['publishedSourceAliases']):
  ids=[id for id in aff[row] if registry[id]['originalUrl']==u]
  d=dict(url=u if not u.startswith('mailto:') else 'mailto:[contact omitted]',sourceIds=ids,disposition='inspected-with-source-specific-limits' if ids else 'locator-only-no-action' if any(x in u.lower() for x in ['mailto:','/forms/','jotform','grantinterface','smarterselect','kaleidoscope']) else 'deferred-exact-alias-no-current-fact-inference',**route(actions[row]))
  if u.startswith('mailto:'):d['urlSha256']=sha(u.encode())
  r['seedDispositions'].append(d)
 for field in basefields:r['fieldProposals'][field]=dict(value=None,state='inaccessible' if not aff[row] or row in [148,153] else 'unverified',acceptance='held',sourceScope='Selected input only; not established in inspected scope, not source silence or a negative rule.',observedAt=now,sourceRevision=None,freshness='Unknown/current applicability unverified; old-cycle and parent claims remain scoped.',evidence=[],**route(actions[row]))
 records.append(r)
rows={r['rowLocator']:r for r in records}
def put(row,field,value,sid,state='verified',excerpt=None):
 assert sid in aff[row];s=registry[sid];t=(ROOT/s['artifactPath']).read_text();ex=excerpt or t.strip();assert ex in t
 rows[row]['fieldProposals'][field]=dict(value=value,state=state,acceptance='held',sourceScope=s['sourceScope'],observedAt=s['observedAt'],sourceRevision=s.get('sourceRevision'),freshness='Source-scoped observation only; no accepted current offering or canonical fact.',evidence=[dict(sourceId=sid,sourceUrl=s['originalUrl'],artifactPath=s['artifactPath'],artifactSha256=s['artifactSha256'],excerpt=ex,locator='Exact selected-scope artifact text; native/public inspection limits apply')],**route(actions[row]))
put(144,'amount',{'currency':'USD','value':1400,'slots':1},'peo')
put(144,'minimumGPA',{'value':3.0,'scale':None},'peo')
put(144,'eligibility',{'seniorGirl':True,'higherEducationInMontana':True,'highSchoolOrResidenceScopeUnknown':True},'peo')
put(144,'deadline',{'date':'2026-04-15','time':None,'zone':None},'peo')
put(144,'materials',{'applicationAllQuestions':True,'transcript':True,'oneSidedEssay':['reasons','financial need','education/career goals','service','employment','activities/honors'],'useOfEducationAndNeedStatements':True,'twoNonrelativeWrittenReferences':True,'proofreadSuggested':True},'peo')
put(144,'applicationMethod',{'profileInstruction':'print neatly blue/black ink or type','laterInstruction':'APPLICATION MUST BE TYPED','selectedFormat':None,'submissionRecipient':'P.E.O. Chapter D','currentRouteUsability':None,'actionsPerformed':False},'peo','conflict')
put(145,'amount',{'currency':'USD','perRecipient':1000,'onePerEachSchool':['Columbia Falls','Whitefish','Glacier','Flathead','Bigfork','Eureka']},'smile-native')
put(145,'eligibility',{'graduatingSenior':True,'postSecondaryIn2026':True,'schoolListFromAmountScope':True},'smile-native')
put(145,'deadline',{'date':'2026-04-01','time':None,'zone':None},'smile-native')
put(145,'materials',{'personalInformationPage':True,'typedEssayPages':[1,2],'prompt':'Share a personal story that will make us smile (or laugh!)','recentTranscript':True,'singlePDFAllDocumentsForEmail':True,'noWordGoogleLinksOrMultipleFiles':True},'smile-native')
put(145,'applicationMethod',{'OR':['physical copy to school counselor','digital single PDF by published email'],'actualAccessVerified':False,'currentRouteUsability':None,'actionsPerformed':False},'smile-native')
put(145,'selection',{'essayFirstThenOtherInformation':True,'grammarStructureImportant':'making us smile most important'},'smile-native')
put(146,'amount',{'currency':'USD','value':500,'scope':'High-school Ripple track only; internship/graduate separate'},'ripple-pdf')
put(146,'minimumGPA',{'value':3.0,'scale':None},'ripple-pdf')
put(146,'eligibility',{'WhitefishOrColumbiaFallsSenior':True,'twoOrFourYearCollegeEnvironmentalMajor':True,'examples':['biology','ecology','environmental science/studies','hydrology'],'otherWaterQualityFieldNeedsWLIApproval':True},'ripple-pdf')
put(146,'deadline',{'monthDay':'04-15','year':None,'filename2026NotBodyProof':True,'postmarkedRequired':True,'announcementMonthDay':'05-01'},'ripple-pdf')
put(146,'materials',{'application':True,'transcript':'form calls official','essayWords':[300,500],'essayTopic':'watershed ethic','twoTeacherContactReferences':True,'subsequentRecipientFormBySeptember1':'SSN and college information requested by sponsor, no values collected','publicityAgreement':['name','location','GPA','course','photo'],'directCollegePayment':True},'ripple-pdf')
put(146,'applicationMethod',{'instructions':['print complete mail','print complete scan email'],'postmarkVersusEmailUnresolved':True,'subject':'Ripple Effect Application','actualAccessVerified':False,'actionsPerformed':False},'ripple-pdf','conflict')
put(147,'amount',{'value':None,'count':None,'literal':'Undetermined'},'hinderman')
put(147,'eligibility',{'WHS7thSemesterTranscript':True,'MontanaHigherLearningOrTrainingAccepted':True,'collegeUniversityTradeTechnicalCosmetology':True,'useInGraduationYear':True,'continuousFullTimeRequiredToObtainAndMaintain':True,'statusChangesReportedToCounselor':True},'hinderman')
put(147,'needRequirement',{'demonstratedNeedRequired':True,'currentDocument':'SAI','historical2025Alias':'EFC','numericThreshold':None},'hinderman')
put(147,'materials',{'formalWrittenApplication':True,'WHS7thSemesterTranscript':True,'seniorResumeIncludingContactFieldsOnlyNoValuesRetained':True,'twoRecommendations':True,'SAICopy':True,'acceptanceLetter':True,'financialNeedsAndFuturePlansStatements':True},'hinderman')
put(147,'deadline',{'date':'2026-04-17','delivery':'counselor','historicalAliasMonthDay':'04-18','historicalAliasYear':2025},'hinderman','conflict')
put(147,'renewability',{'automaticRenewal':None,'mayDisburseOverAcademicYears':2,'dependentOnInstitution':True,'continuousFullTimeToMaintain':True},'hinderman')
put(149,'amount',{'currency':'USD','minimumPerScholarship':1000,'numberAndAmountDependOnApprovedApplications':True,'paymentDescriptionTotal':1000,'paymentAlternative':[1000,'two 500 installments'],'amountPaymentReconciliationUnresolved':True},'rotary','conflict')
put(149,'eligibility',{'WHSentireSeniorYearAndGraduate':True,'gapYearAcceptedWithApprovalConfirmation':True,'acceptedPlansHigherEducation':['vocational','community college','college/university','trade'],'schoolAwardsCeremonyRequired':True,'RotaryLunchRecognitionRequired':True},'rotary')
put(149,'materials',{'personalPageWrittenOrTyped':True,'unofficialHSTranscript':True,'twoNonfamilyLetters':True,'typedResponsesChooseAnyTwoOfSixTopics':True,'topics':'service past/future, volunteerism, proposed Whitefish service project, Rotary program benefit, future projects'},'rotary')
put(149,'deadline',{'date':'2026-04-17','time':'15:30','zone':None,'delivery':'WHS Guidance office'},'rotary')
put(149,'applicationMethod',{'returnCompletedApplicationAndRequirementsToGuidanceOffice':True,'paymentToRegisteredInstitution':True,'canHoldUnusedFundsYears':2,'studentMustNotifyClubWhenNeeded':True,'actualAccessVerified':False,'actionsPerformed':False},'rotary')
put(151,'amount',{'currency':'USD','perAward':3000,'slots':3,'scope':'2026 requirements file; application contents unavailable'},'herriges-alias')
put(151,'eligibility',{'attendSchoolInMontana':True,'highSchoolRestrictionNotIndependentlyEstablished':True},'herriges-alias')
put(151,'deadline',{'date':'2026-04-20','time':None,'zone':None},'herriges-alias')
put(151,'materials',{'formalWrittenApplication':True,'HSTranscript':True,'seniorResume':['community service','extracurricular activities','employment'],'fullApplicationSpecificsUnverified':True},'herriges-alias')
put(151,'applicationMethod',{'submitCompletedInformationToGuidanceCounselor':True,'actualAccessVerified':False,'actionsPerformed':False},'herriges-alias')
put(152,'amount',{'currency':'USD','perAward':2000,'slots':2,'annualWording':True},'stimpson')
put(152,'minimumGPA',{'value':3.0,'scale':4.0},'stimpson')
put(152,'eligibility',{'currentUSHighSchoolStudentGraduatingSpring2026':True,'acceptedAndEnrollingAviationRelatedDegree':True,'examples':['flight training','aviation management','aerospace engineering','aviation maintenance']},'stimpson')
put(152,'materials',{'applicationForm':True,'currentHSTranscript':True,'recommendationLettersMaximum':2,'essayWordLimit':750,'typedDoubleSpaced':True,'essayQuestion':'interest in general aviation career and how to pursue it','additionalPagesOrResumeAllowed':True},'stimpson')
put(152,'deadline',{'date':'2026-04-24','basis':'received by GAMA','time':None,'zone':None},'stimpson')
put(152,'applicationMethod',{'electronicPreferred':True,'mailAlternative':True,'actualAccessVerified':False,'actionsPerformed':False},'stimpson')
put(152,'selection',{'academicAchievements':True,'extracurricularInvolvement':True,'essayResponses':True},'stimpson')
put(154,'amount',{'currency':'USD','typicalPerAcademicYear':3000,'typicalSlots':[1,2],'oneTime':True},'evelyn')
put(154,'eligibility',{'OrderOfRainbowForGirlsMember':True,'graduatingSeniorMontanaHighSchool':True,'accreditedPostsecondaryDegreeProgram':True},'evelyn')
put(154,'minimumGPA',{'value':2.0,'basis':'high school','scale':None},'evelyn')
put(154,'membership',{'OrderOfRainbowForGirlsRequired':True},'evelyn')
put(154,'needSelection',{'financialNeed':True,'schoolCommunityChurchActivities':True,'longTermGoalsMotivation':True,'needRequiredThreshold':None},'evelyn')
put(154,'reapplication',{'previousRecipientsAllowed':False},'evelyn')
put(154,'opening',{'date':'2026-01-01'},'evelyn')
put(154,'deadline',{'date':'2026-04-30','time':None,'zone':None},'evelyn')
put(154,'materials',{'mostRecentHSTranscript':True,'FAFSAFSS':True},'evelyn')
put(154,'applicationMethod',{'MCFPortal':True,'publishedAccessCode':'25EJMS','codeVersus2026Unresolved':True,'actualAccessVerified':False,'portalVisited':False,'actionsPerformed':False},'evelyn')
put(156,'amount',{'currency':'USD','perAward':2500,'guideSaysTwoScholarships':True,'fiveCategoriesNotFiveProvenSlots':True,'maximumAwardsPerAcademicYear':1},'exploring-pdf')
put(156,'membership',{'currentlyRegisteredAndActiveAviationExplorerPost':True},'exploring-pdf')
put(156,'eligibility',{'activePost':True,'parentGuardianSignatureUnder18':True,'categorySpecificStagesTrainingAndRedemption':True,'flightTraining':'FAA Part141/61 or accredited degree-leading college/university; literal guide scope retained'},'exploring-pdf')
put(156,'materials',{'completedApplicationPDF':True,'highResolutionSelfPortrait':True,'minimumNonfamilyRecommendations':3,'sources':['aviation post advisor','aviation professional','teacher','employer','community leader'],'FAAExamResults':True,'FAAMedicalIfApplicable':True,'FAACertificatesIfAny':True,'collegeTranscriptIfApplicable':True,'HSOrCollegeTranscriptForDegreeCategory':True,'advisorEndorsementAndCouncilVerification':True,'personalRecord':['career','life skills','citizenship','leadership','character','optional circumstances'],'educationPlanWords':500,'talentRelease':True,'allComponentsSameEmail':True,'threeLinkedSupplementaryDocsDeferred':True},'exploring-pdf')
put(156,'deadline',{'date':'2026-04-30','parentDateYear':2026,'PDFMonthDay':'04-30','PDFYearOnlyRevisionFeb2026':True,'notificationMonthDay':'07-01'},'exploring')
put(156,'reapplication',{'applicationsNotCarriedOver':True,'previousApplicationsCanBeUpdatedResubmittedToLocalCouncil':True,'awardRenewalUnverified':True},'exploring-pdf')
put(156,'awardTypes',{'sharedApplication':True,'types':{'degreeProfession':{'accreditedCollegeUniversityAcceptedOrAttending':True,'redeemWithinYears':4},'avionics':{'HSseniorOrCollege':True,'accreditedProgram':True,'redeemWithinYears':2},'pilot':{'sportOrPrivateAnyAircraft':True,'aviationCareerNotRequired':True,'completeTrainingWithinYears':1,'redeemWithinYears':2,'needIsSelectionFactor':True},'maintenance':{'HSseniorOrCollege':True,'accreditedAircraftRepair':True,'redeemWithinYears':2},'management':{'aviationManagementDesignEngineeringAirport':True,'accreditedInstitution':True,'redeemWithinYears':2}},'noNewAwardIDsOrQueueInputs':True},'exploring-pdf')
put(156,'applicationMethod',{'sameEmailPDFComponents':True,'publishedNationalEmailContactOmitted':True,'actualAccessVerified':False,'actionsPerformed':False},'exploring-pdf')
put(156,'selection',{'leadershipAviationAchievements':True,'educationalPlanEssay':True,'pilotSpecificIncludesFinancialNeedEducationWorkVolunteer':True},'exploring-pdf')
put(157,'eligibility',{'currentlyEnrolledArtOrMusicClasses':True,'intendedArtMusicMajorTwoOrFourYear':True,'pastOrCurrentHardshipRequiredNonExhaustiveExamples':['mental health/PTSD','addiction','chronic health','financial problems','unplanned pregnancy','homelessness'],'notUniversalSensitiveDefinitions':True},'sloan')
put(157,'minimumGPA',{'GPAIsDeterminingFactor':False,'threshold':None},'sloan')
put(157,'materials',{'contactInstitutionMajorFieldsBlankOnly':True,'shortEssayFewParagraphsWhyConsidered':True,'smallArtMusicPortfolio':True,'adultWhoKnowsStudentRecommendation':True},'sloan')
put(157,'deadline',{'date':'2026-05-01','dayOfWeek':'Friday','schoolDeliveryEndOfDay':True,'mailTimingUnverified':True,'zone':None},'sloan')
put(157,'applicationMethod',{'OR':['school contact by end of day','mail to published program address'],'checksToEducationalInstitution':True,'actualAccessVerified':False,'actionsPerformed':False},'sloan')
put(158,'eligibility',{'highSchoolJuniorsDuring2026to2027Only':True,'MontanaStudentCitizenAthletes':'involved in Big Sky State Games','secondaryEducationAfterHSIncludesTradeCommunityCollege':True},'bigsky')
put(158,'deadline',{'literal':'2027 Scholarship Deadline: Friday, May 1','headingYear':2027,'monthDay':'05-01','computedWeekday2027May1':'Saturday','intendedExactDate':None},'bigsky','conflict')
put(158,'selection',{'sportsmanshipCharacter':['trustworthiness','respect','responsibility','fairness','caring','citizenship'],'noCurrentAmountOrSlotsObservedInSelectedScope':True},'bigsky')
put(158,'applicationMethod',{'onlineFormLocator':True,'alsoMontanaHighSchoolGuidanceOfficesPerPage':True,'formNotVisited':True,'actualAccessVerified':False,'actionsPerformed':False},'bigsky')
put(159,'amount',{'currency':'USD','value':2500,'slots':1},'actionair')
put(159,'eligibility',{'undergraduate':True,'ChattanoogaStateCommunityCollegeTennessee':True,'HVACProgram':True},'actionair')
put(159,'deadline',{'date':'2026-05-12','announced':'2026-06-12','time':None,'zone':None},'actionair')
put(159,'cycle',{'listingMarked':'Awarded','datesIn2026':True,'futureOffering':None},'actionair')
put(159,'materials',{'noEssay':True,'completeDetailedProfilePreferred':True,'actualAccountRequirementsUnverified':True},'actionair')
put(159,'applicationMethod',{'staticPageSaysHitApply':True,'applyNotClicked':True,'accountNotVisited':True,'actualAccessVerified':False,'actionsPerformed':False},'actionair')
put(159,'selection',{'criteria':['Ambition','Drive','Impact']},'actionair')
put(160,'amount',{'currency':'USD','initial':5000,'initialAnnualSlots':1,'renewalAnnual':5000,'maximumAdditionalRenewalYears':3},'kuchenbrod')
put(160,'minimumGPA',{'entryHighSchool':2.5,'scale':None},'kuchenbrod')
put(160,'eligibility',{'WHSGraduate':True,'MontanaTwoOrFourYearOrVocationalTrade':True,'fullTimeMinimumCreditsPerSemester':12},'kuchenbrod')
put(160,'renewability',{'upToAdditionalYears':3,'continuingCumulativeGPA':2.5,'continuingCreditsMinimum':12,'year2to4TranscriptAndScheduleToWEF':True,'annualWrittenFamilyUpdate':'any/all major,GPA,rewarding/challenging courses,college experiences','conditionsRequiredNotAutomatic':True},'kuchenbrod')
put(160,'materials',{'personalEssayApproxWords':500,'onePageEssay':True,'essayTopics':['education/career/personal goals','inspiration','achievement plan','scholarship/community impact','major/rolemodels/experiences'],'adultNonrelativeRecommendationCount':[1,2],'onePageResume':True,'officialHSTranscript':True,'FAFSACalculatedSAI':True,'MontanaInstitutionAcceptanceLetter':True},'kuchenbrod')
put(160,'deadline',{'date':'2026-05-07','literalTime':'end of','zone':None,'delivery':'named school contact omitted'},'kuchenbrod')
put(160,'applicationMethod',{'submitToPublishedSchoolContact':True,'institutionCheckAfterAcceptanceAndClassRegistrationToWEF':True,'actualAccessVerified':False,'actionsPerformed':False},'kuchenbrod')
put(162,'amount',{'scope':'current LPA dispatcher child; saved AmericanAirlines mapping held','value':None,'literal':'Award Varies','slots':2},'lpa')
put(162,'eligibility',{'parentRequirements':['active LPA Student/Standard/Lifetime member','at least17','accepted/enrolled accredited US or Territories institution'],'dispatcherChild':'pursuing FAA dispatcher certification, approved FAA dispatcher program','childAcceptedEnrolledAccreditedInstitution':True,'noAAsponsorBindingEstablished':True},'lpa')
put(162,'membership',{'activeLPAMembershipRequiredParentScope':True,'noMembershipActionOrPayment':True},'lpa')
put(162,'materials',{'parentScopeOnly':True,'onePageResume':True,'twoOnePageRecommendations':'professor/employer/mentor; LPA members preferred','twoEssays500WordLimitEach':True,'enrollmentAcceptanceProofAtAward':True,'childAdditionalTermsUnverified':True},'lpa')
put(162,'opening',{'parentCycle':'Fall2026','parentDate':'2026-10-15','savedAAChildOpeningAccepted':False},'lpa')
put(162,'deadline',{'parentDate':'2026-11-05','time':'23:59','literalZone':'PT','noLateApplications':True,'savedAAChildApplicabilityHeld':True},'lpa')
for r in records:
 sid=(aff[r['rowLocator']] or [None])[0]
 limits={'selectedTextScopeOnly':True,'noSourceSilence':True,'sourceRevisionsUnknown':True,'currentOfferingUnverified':True,'nativePublicSponsorAuthorityUnverified':True,'rawPageVisualProof':r['rowLocator']==144,'rawBatchRejectedNoBypass':r['rowLocator'] in [147,149,151,153,157,160],'nativeBodyOrReadableOnly':r['rowLocator'] in [145,147,149,151,153,157,160],'portalActions':False,'priorClerkWETGapsUnchanged':True}
 if sid:put(r['rowLocator'],'sourceInspectionLimit',limits,sid,state='unverified')
 else:r['fieldProposals']['sourceInspectionLimit']['value']=limits
for field in ['needRequirement','deadline']:
 s=registry['hinderman-alias'];rows[147]['fieldProposals'][field]['evidence'].append(dict(sourceId='hinderman-alias',sourceUrl=s['originalUrl'],artifactPath=s['artifactPath'],artifactSha256=s['artifactSha256'],excerpt=(ROOT/s['artifactPath']).read_text().strip(),locator='Historical2025 exact native alias; not current2026 authority'))
save(P/'source-receipts.json',reg)
newfields=sum(len(r['fieldProposals']) for r in records);oldfields=sum(len(r['fieldProposals']) for c in prior for r in c['records'])
ledger=dict(schemaVersion=1,checkpoint=8,entryCommit=entry,queueSha256=cap['queueSha256'],queueOffsetStart=140,queueOffsetEndExclusive=160,orderedInputKeys=[r['inputKey'] for r in records],records=records,sourceRegistry=reg,acceptedFacts=0,researchComplete=True,researchCompleteMeaning='Twenty initial bounded dispositions; unresolved exact facts and material scope routed. Not full award facts/complete SD2.',independentReview='pending frozen-candidate fresh GPT review',completedAt=now,fullSD2Complete=False,canonicalAcceptance=False,SD3Started=False,coverage=dict(checkpointInputs=20,fieldEnvelopes=newfields,sourceReceipts=len(reg),outcomes=dict(collections.Counter(r['outcome'] for r in records)),cumulativeInitialDispositions=160,cumulativeAutonomousHeldFields=oldfields+newfields,cumulativeAutonomousHeldIdentities=160,unprocessedInputs=246),nextCheckpointInputOffset=160,nextInputKey=q['records'][160]['inputKey'],priorHolds=dict(unchangedPaths=[f'docs/evidence/sd2-autonomous/checkpoint-{i:03d}.json' for i in range(1,8)],fields=oldfields,identities=140,allEarlierPacketsPRELUDESection9M1Routes='byte-preserved with original owners/triggers'),preservedGates=prior[-1]['preservedGates'],sourcePolicyDeviations=['Initial streamed PEO reference was accidentally forwarded with signed download fields; no signed references persisted. Subsequent references were suppressed.','Intermediate text outputs included public contact/address/maintainer/unrelated-program fragments. Initial PEO safe-view mask was mispositioned, exposing public contact block. Corrected v3 mask and sanitized persisted scope do not erase earlier outputs. No applicant responses observed or retained.','Auto-review rejected multi-document local download because blankness/applicant PII had not been verified. No retry or workaround of that batch. Safer exact native paragraph/readable-text and structure reads supplied partial evidence; Herriges application and DonK raw remain unmaterialized/inaccessible. No approval needed to record held outcomes.'],limits=['No new workbook/source inventory, current worksheet/version/permission/preservation proof, accepted current offering, canonical facts, authenticated freshmain/target or external effects.','maxAge0 requested for public reads; origin revision/currency/atomicity unverified. Missing precise initial-call times explicitly labeled as assembly timestamps.','Native paragraph/structure concordance checked for three Google Docs; no rendered pages or Rotary inline-image inspection. Other native readable conversions and public document parses have no raw/page-completeness/visual proof; no silence inference.','P.E.O. only new local raw PDF; complete two-page text and corrected sanitized rule-region images inspected. Raw and images temporary.','All68prior exact custody hashes matched; WET/Clerk earlier unavailable raw/visual proof unchanged.','All20identities and all fields remain held, including already-corrected Jaycee and every historical field/identity/source/material route. FullSD2 incomplete; SD3 unstarted.'])
save(B/'checkpoint-008.json',ledger)
views=[]
for name in ['peo-page-1-safe-v3.png','peo-page-2-safe.png']:
 p=Path('/private/tmp/sd2-checkpoint-008-raw')/name;views.append(dict(path=str(p),sha256=sha(p.read_bytes()),wholeUnredactedVisualClaim=False))
save(P/'document-inspection.json',dict(recordedAt=now,nativeDocuments=[dict(id='peo',rawArtifactPath=registry['peo']['rawArtifactPath'],rawSha256=registry['peo']['rawSha256'],blankDocument=True,pageCount=2,completeLayoutTextInspected=True,selectedTextPath=registry['peo']['artifactPath'],selectedTextSha256=registry['peo']['artifactSha256'])],safePageViews=views,correctedSafeViewsInspected=True,priorCustodyPins=68,priorCustodyGaps=0,rawBatchRejected=True,noRejectedBatchRetryOrBypass=True,saferAlternatives='Native readable text and document structure; all uninspected scope explicitly held.',owner='Next-session Codex evidence owner',trigger='Next audit requiring original raw material',nextAction='Verify exact temporary custody; preserve receipts/report gaps without reconstruction/reacquisition/replay.'))
print(json.dumps(ledger['coverage'],indent=2))
