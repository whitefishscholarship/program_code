"""Build only checkpoint004 from inspected sources. Existing queue/history never mutated."""
from pathlib import Path
import json,hashlib,datetime,re,subprocess
P=Path(__file__).resolve().parent;ROOT=P.parents[3]
ENTRY='02e8b2a';ENTRY=subprocess.check_output(['git','rev-parse',ENTRY],cwd=ROOT).decode().strip()
def load(p):return json.loads(p.read_text())
def sha(b):return hashlib.sha256(b).hexdigest()
def dump(p,x):p.write_text(json.dumps(x,indent=2,ensure_ascii=False)+'\n')
q=load(P.parent/'queue.json');sources=load(P/'source-receipts.json')
# Reuse the already inspected same-day Dawson listing, preserving its exact historical receipt.
prior=load(P.parent/'checkpoint-003.json');old=next(s for s in prior['sourceRegistry'] if s['sourceId']=='dawson')
sources=[s for s in sources if s['sourceId']!='dawson']+[dict(old,reusedFrom='docs/evidence/sd2-autonomous/checkpoint-003.json')]
for s in sources:
 s['artifactSha256']=sha((ROOT/s['artifactPath']).read_bytes())
 for d in s['linkDispositions']:
  linked=[x['sourceId'] for x in sources if x['originalUrl']==d['url']]
  if linked:d['disposition']='inspected/reused exact source; limits/holds retained';d['sourceIds']=linked
registry={s['sourceId']:s for s in sources};now=load(P.parent/'checkpoint-004.json')['completedAt'] if (P.parent/'checkpoint-004.json').exists() else datetime.datetime.now(datetime.timezone.utc).isoformat()
fields=['amount','minimumGPA','gpaBasis','schoolType','residency','membership','needRequirement','needPriority','renewability','gapYears','deadline','applicationWindow','cycle','applicationMethod','materials','identityContinuity','currentOffering']
records=[]
for seed in q['records'][60:80]:
 r={k:seed[k] for k in ['inputKey','rowLocator','recordedName','publicIdCandidates','identityAcceptance']}
 r.update(outcome='researched-held',fieldProposals={},owner='Codex source/identity reconciliation',trigger='Applicable authorized evidence arrival or SD2 consolidation after initial remaining-queue coverage',nextAction='Reconcile each held named identity/current material field under POLICY and later human/canonical/publication gates.',interviewCoverage='No app change. Only later accepted award-bound facts can affect matching; unknown/current-scope gaps remain non-excluding.')
 for f in fields:r['fieldProposals'][f]={'value':None,'state':'unverified','acceptance':'held','sourceScope':'Current named-award applicability unresolved','observedAt':now,'sourceRevision':None,'freshness':'No current fact inferred from retrieval, historical cycle, filename or parent page','evidence':[],'note':'Unknown is non-excluding; selected excerpts never prove silence in uninspected/excluded scope.'}
 records.append(r)
byrow={r['rowLocator']:r for r in records}
def put(row,field,value,sid,needle,scope,state='verified',note=None):
 s=registry[sid];t=(ROOT/s['artifactPath']).read_text();assert needle in t,(row,field,sid,needle)
 # Anchor exact selected text; qualifications are retained in the full linked source artifact.
 f={'value':value,'state':state,'acceptance':'held','sourceScope':scope,'observedAt':s['observedAt'],'sourceRevision':s.get('sourceRevision'),'freshness':'Source-scoped observation only. Historical/yearless facts cannot establish a future cycle. Applicability/identity and later acceptance remain held.','evidence':[{'sourceId':sid,'sourceUrl':s['originalUrl'],'artifactSha256':s['artifactSha256'],'locator':scope+' / '+field,'excerpt':needle}]}
 if note:f['note']=note
 byrow[row]['fieldProposals'][field]=f

def extra(row,field,sid,needle):
 s=registry[sid];assert needle in (ROOT/s['artifactPath']).read_text()
 byrow[row]['fieldProposals'][field]['evidence'].append({'sourceId':sid,'sourceUrl':s['originalUrl'],'artifactSha256':s['artifactSha256'],'locator':'Separate scope/variant or qualification','excerpt':needle})
put(63,'identityContinuity',{'name':'Most Valuable Student','sponsor':'Elks National Foundation','publicIdCandidate':'award-2c06399c35e5'},'elks-mvs','The Elks National Foundation will award','Named sponsor/page supports proposed continuity only')
put(63,'deadline',{'date':'2026-11-12','time':'23:59','timezoneLiteral':'Pacific Time','FAQTimezoneLiteral':'PST'},'elks-mvs','The 2027 application deadline is November 12, 2026 at 11:59 p.m., Pacific Time.','2027 contest; literal zone wording retained')
extra(63,'deadline','elks-faq','November 12, 2026 at 11:59 p.m., PST.')
put(63,'eligibility',{'highSchoolSeniorOrEquivalent':True,'USCitizenAtSubmission':True,'graduatesExcluded':True,'permanentResidentOnlyExcluded':True},'elks-mvs','Current high school seniors, or the equivalent, who are citizens of the United States are eligible to apply.','2027 posted page with complete exceptions in artifact')
extra(63,'eligibility','elks-mvs','permanent legal resident status does not qualify.')
put(63,'membership',{'ElksRelatedRequired':False},'elks-mvs','Applicants **do not** need to be related to a member of the Elks.','Explicit no relationship required')
put(63,'schoolType',{'program':'4-year undergraduate US accredited full-time','minimumSemesterHours':12,'firstTwoYearsAtTwoYearCollegeAllowedForFourYearProgram':True},'elks-mvs','full-time basis (minimum of 12 semester hours)','Four-year program distinct from initial two-year institution')
extra(63,'schoolType','elks-faq','It is acceptable for a student to enroll in a two-year college for the first two years of the four-year program.')
put(63,'amount',{'USDPerYearRange':[1000,7500],'USDTotalTop20':30000,'USDTotalOther480':4000,'recipientSlots':500,'topAwardRequiresLeadershipWeekend':True},'elks-mvs','Ranging from $1,000 per year to $7,500 per year','2027 narrative; 2026 award table separately historical')
extra(63,'amount','elks-mvs','Attendance at Leadership Weekend is required to be part of the Top 20 cohort and receive $30,000.')
put(63,'needPriority',{'consideredInJudging':True,'noPublishedMinimumOrMaximumIncomeCutoff':True},'elks-faq','There is not a minimum income required in order to apply nor is there a maximum income we would not consider.','Need scoring is not need-eligibility threshold')
put(63,'gapYears',{'alreadyGraduatedGapYearExcluded':True,'plannedGapYearBeforeGraduationPotentiallyEligible':True},'elks-faq','If however, you have not yet graduated high school, but plan to take a gap year, you would be eligible','FAQ conditional rule; no blanket gap-year exclusion')
put(63,'materials',{'counselorReport':True,'quarterFinalistTranscriptAndFAFSASummary':True,'semifinalistAdditionalEssayAndTeacherEvaluation':True,'ACTSATRequired':False},'elks-faq','including your Counselor Report','Stage-specific materials; no application route inspected')
extra(63,'materials','elks-faq','In January, Quarter Finalists are required to upload their transcript and FAFSA Submission Summary.')
extra(63,'materials','elks-faq','National Semi-Finalists are required to submit an additional essay, and a teacher’s evaluation.')
extra(63,'materials','elks-faq','You do not need to submit ACT and/or SAT scores.')
for row in [63,73]:
 put(row,'ENFMultipleAwardConflict',{'MVSFAQ':'cannot accept more than one ENF scholarship/grant in academic year','LegacyPage':'both scholarships awarded','resolution':None},'elks-faq','cannot accept, more than one Elks National Foundation scholarship or grant in any one academic year','Cross-program equal-sponsor contradiction; no stacking decision',state='conflict')
 extra(row,'ENFMultipleAwardConflict','elks-legacy','In cases where the student\nwins more than one, we will award both scholarships.')
byrow[63]['nextAction']='Resolve ENF simultaneous-award contradiction, source/ID continuity and exact material/applicability gaps; preserve staged materials, gap-year nuance and literal deadline timezone. No login or fact acceptance.'
put(64,'identityContinuity',{'program':'Cooke College Scholarship Program','sponsor':'Jack Kent Cooke Foundation'},'cooke','The Cooke College Scholarship Program','Named sponsor/program proposed continuity only')
put(64,'cycle',{'graduation':'spring2027','enrollment':'fall2027'},'cooke','plan to graduate in spring 2027.','Explicit applicable entry year')
put(64,'applicationWindow',{'open':'2026-08-19','deadline':'2026-11-11','timezone':None},'cooke','**August 19, 2026**','2027 entry window; no timezone invented')
extra(64,'applicationWindow','cooke','**November 11, 2026**')
put(64,'currentOffering',{'pageSays':'application currently open','deadline':'2026-11-11','livePortalVerified':False},'cooke','application is currently open and will close on November 11, 2026.','Sponsor claim only; no action-path usability proof')
put(64,'minimumGPA',{'min':3.75,'basis':'cumulative unweighted','scale':None},'cooke','minimum, cumulative unweighted GPA of 3.75 or above.','Entry GPA; scale not inferred')
put(64,'schoolType',{'accreditedFourYearBachelor':True,'USCollegeRequired':False,'onlineFourYearProgramsExcluded':True,'fullTime':True},'cooke-faq','No, you do not have to attend college in the U.S.','FAQ institution scope and baccalaureate qualification')
extra(64,'schoolType','cooke-faq','No, accredited online four-year programs are not covered by Cooke College Scholarship Program funds.')
extra(64,'schoolType','cooke-faq','planning to enroll full time in an accredited four-year institution')
put(64,'renewability',{'annualDiscretionaryReview':True,'reviewFactors':['grades','financialeligibility','conduct','degreeprogress','cooperation'],'inYearRevocationPossible':True,'intendedFundingYears':4,'durationExceptionsCaseByCase':True},'cooke-faq','No. The scholarship is renewable each year.','YearlessFAQ continuation policy; acceptance/current applicability held')
extra(64,'renewability','cooke-faq','revoke a scholarship during the academic year')
extra(64,'renewability','cooke-faq','Exceptions to this would only be considered on a case-by-case basis.')
put(64,'renewalGPA',{'min':3.0,'basis':'cumulative','scale':None,'challengingCourseLoad':True},'cooke-faq','cumulative GPA of 3.0 or better','Continuing condition distinct from initial3.75unweighted GPA; applicability held')
put(64,'amount',{'currency':'USD','maxPerYear':55000,'lastDollarAfterInstitutionalAid':True,'fixedAward':False},'cooke','can provide as much as $55,000 per year','Maximum last-dollar amount, not guaranteed')
put(64,'needRequirement',{'demonstratedUnmetNeed':True,'familyIncomeUpperUSD':95000,'basisResolution':None},'cooke','**Demonstrate Unmet Financial Need**','Need required but income metric conflicts',state='conflict')
extra(64,'needRequirement','cooke','family annual gross income up to $95,000')
extra(64,'needRequirement','cooke','family adjusted gross income up to $95,000')
put(64,'materials',{'academicRecommendations':2,'counselorRecommendation':1,'schoolReport':True,'SATorACTorAPorIBScoreRequired':True,'minimumTestScore':None,'severalShortEssays':True,'threeYearsHouseholdAGI':True},'cooke','**Two Academic Recommendations:**','Current posted requirements; exact recommendations qualifications in artifact')
extra(64,'materials','cooke','**One Counselor Recommendation:**')
extra(64,'materials','cooke-faq','Several short essays')
extra(64,'materials','cooke-faq','last three years’ Adjusted Gross Income (AGI)')
put(64,'transcriptConflict',{'howToApply':'unofficial with possible official semifinalist request','FAQ':'official required through counselor','resolution':None},'cooke','You must submit unofficial transcripts','Equal-sponsor material contradiction',state='conflict')
extra(64,'transcriptConflict','cooke-faq','Yes, and your official high school transcript will be submitted by your school counselor')
put(64,'gapYears',{'postGraduationGapYearExcluded':True,'approvedPostAwardDeferralPossible':True,'GEDExcluded':True},'cooke-faq','Students who are taking a gap year','FAQ separate gap-year/deferral/GED rules')
extra(64,'gapYears','cooke-faq','No. If you received a GED diploma')
byrow[64]['nextAction']='Resolve gross-versus-AGI income and official-versus-unofficial transcript contradictions, military-base FAQ scope and stale FAQ academic-year phrase. Retain2027entry, test-score-without-minimum distinction, three recommendations, fulltime/noonlineinstitutionrule, annualdiscretionaryreview/revocation and distinctcontinuing3.0GPA/fouryearfundingexceptions; no CommonApp visit.'
put(65,'identityContinuity',{'sponsor':'Hagan Scholarship Foundation','program':'Hagan Scholarship'},'hagan','Hagan Scholarship Fall Application','Named official program; identity held')
put(65,'cycle',{'academicYear':'2027-2028','graduatingClass':2027},'hagan','For the 2027-2028 Academic Year','Explicit 2027 graduating-class fall application')
put(65,'deadline',{'date':'2026-12-01','time':None,'timezone':None},'hagan','Application Deadline: December 1, 2026.','Fall application only; spring separately')
put(65,'applicationWindow',{'fallOpen':'2026-09-01','fallDeadline':'2026-12-01','springOpen':'2027-01-15','springDeadline':'2027-03-15'},'hagan-timeline','Application Available September 1, 2026','Separate published fall/spring phases; no invented one combined window')
extra(65,'applicationWindow','hagan-timeline','Application available January 15, 2027.')
extra(65,'applicationWindow','hagan-timeline','Application Submittal Deadline March 15, 2027.')
put(65,'minimumGPA',{'min':3.5,'basis':'CGPA','scale':None},'hagan','Must have achieved a 3.50 CGPA','Initial GPA distinct from third-year study-abroad threshold')
put(65,'schoolType',{'fourYearEligibleCollegeFirstFall':True,'communityJuniorOnlineExcluded':True,'fourYearGraduationSchedule':True},'hagan','Must enroll in an eligible four-year College or University','Explicit first-fall/institution requirements; linked institution list deferred')
extra(65,'schoolType','hagan','The scholarship cannot be used to attend a community college, junior college, or online institution.')
put(65,'needRequirement',{'max2025ParentsAGHouseholdIncomeUSD':125000,'mustApplyFederalStateGrantsIfEligible':True},'hagan','Parents’ Adjusted Gross Household Income reported for 2025 Federal Income Tax Purposes must not have exceeded $125,000.','Explicit income condition; FAFSA and citizenship material branches separate')
put(65,'eligibility',{'attendUSHighSchool':True,'citizenshipRestriction':False,'paidNonfamilySupervisedWorkHours':240,'workStart':'2027-01-01','workEnd':'2027-09-01'},'hagan','All students who meet the eligibility criteria can apply regardless of citizenship.','Graduating class and work required in posted2027 application')
extra(65,'eligibility','hagan','Must work 240 hours from January 1, 2027 until September 1, 2027')
put(65,'materials',{'currentHighSchoolTranscript':True,'unsealedRecommendation':True,'USFinalistsFAFSASummaryFirstTwoPagesSAI':True,'nonUSFinalistsCitizenshipProof':True},'hagan','Must provide a current copy of the applicant’s High School Transcript.','Current posted material requirements; linked full instructions remain deferred')
extra(65,'materials','hagan','Must provide an “unsealed” Letter of Recommendation.')
extra(65,'materials','hagan','U.S. Citizens selected as Finalists must provide the first two pages of their FAFSA Summary.')
extra(65,'materials','hagan','Non-U.S. Citizens selected as Finalists must provide Proof of non-U.S. Citizenship.')
put(65,'amount',{'USDMaxPerSemester':7500,'maxConsecutiveSemesters':8,'variableEachSemester':True,'graduateAwardSeparate':True},'hagan-description','up to $7,500 each semester for up to 8 consecutive semesters','Maximum renewable undergrad support; graduate award not merged')
put(65,'renewability',{'upToAdditionalConsecutiveSemesters':7,'ceasesAtGraduationOr140Credits':True,'requirementsAndWorkshops':True},'hagan-description','renewable for up to seven additional consecutive semesters','Conditional terms; full linked particulars deferred')
put(65,'initialPurchaseConflict',{'overviewUSD':1000,'paragraph4USD':2000,'resolution':None},'hagan-description','provides $1,000 to help purchase essential items','Same-page first-year purchase contradiction',state='conflict')
extra(65,'initialPurchaseConflict','hagan-description','receive $2,000 prior to college enrollment')
put(65,'reapplication',{'oneApplicationOnly':True},'hagan','Applicants can apply one time only.','Not the same as renewal; spring repeat eligibility unresolved')
byrow[65]['nextAction']='Resolve1000/2000initial-purchase contradiction, one-time application versus spring phase eligibility and linked full particulars/brochure/tips/currentrenewal rules. No signup or inferred renewal GPA; amounts remain caps.'
put(66,'historicalMetadata',{'provider':'Nelson Cabinetry','deadlineLiteral':'december31st2025','USD':1500,'fields':['business','interior design','architecture']},'nelson','Submit your application by december 31st, 2025','Metadata-only historical candidate, body completeness unresolved',state='unverified')
byrow[66]['outcome']='held-identity';byrow[66]['nextAction']='Resolve named Nelson scholarship identity and complete applicable terms: historical2025metadata versus incomplete body/form extraction. Do not derive current amount/window, complete source silence, subscribe or upload.'
put(67,'identityContinuity',{'children':['BEPC','MECA'],'sharedApplicationExplicit':True,'noMerge':True},'fec','use one application to apply for both scholarships simultaneously.','Two distinct awards sharing route; existing aggregate ID held')
put(67,'amount',{'BasinUSD':2500,'MECAUSD':500,'BasinRecipientSlots':1,'MECARecipientSlots':1},'fec','award one $2,500 scholarship','Separate named child amounts, not3000aggregate award')
extra(67,'amount','fec','award one $500 scholarship')
put(67,'eligibility',{'memberChild':True,'stage':['graduatingHS','currentUndergraduate'],'regionalMemberMECA':True},'fec','Flathead Electric Cooperative member’s child graduating from high school or currently attending an undergraduate college.','Basin/MECA individual child member rules')
extra(67,'eligibility','fec','regional electric cooperative member’s child graduating from high school or currently attending an undergraduate college.')
put(67,'deadline',{'date':'2026-01-11','timezone':None},'fec','Applications are due January 11, 2026.','Closed2026 Basin/MECA only')
put(67,'sourceStatus',{'posted':'closed','cycleDeadlineYear':2026,'futureCycle':None},'fec','**Applications are now closed. Please check back next year.**','Named child section retained; no future offering inferred')
byrow[67]['nextAction']='Preserve two named children/shared application, separate2500/500amounts, member-child scope,2026closure and historical2023/24portal aliases. Resolve complete new-cycle instructions/materials and child mapping; no portal access or newID.'
put(69,'identityContinuity',{'institution':'University of Montana','scope':'institution-specific WUE','generalWUEAllInstitutionsNotEstablished':True},'wue-current','University of Montana’s highest award','Generic saved name versus institution-specific scope; held mapping')
put(69,'historicalAmount',{'academicYear':'2026-27','currency':'USD','tuitionFeeDiscount':21120,'cashScholarship':False},'wue-current','WUE tuition discount is equal to $21,120 off out-of-state tuition and fees.','2026-27institution discount, not2027-28price')
put(69,'minimumGPA',{'incomingFreshman':3.0,'transferCollege':3.5,'freshmanBasis':'highest weighted OR unweighted cumulative','scale':None},'wue-current','minimum GPA to qualify for WUE as an incoming freshman is 3.0 or higher.','Separate freshman/transfer thresholds')
extra(69,'minimumGPA','wue-current','Transfer students must have a cumulative college GPA of 3.5 or higher to qualify.')
put(69,'residency',{'eligible':['AK','AZ','CA','CO','HI','ID','NV','NM','ND','OR','SD','UT','WA','WY','CNMI','Guam'],'MontanaResidencyForfeits':True},'wue-current','must be a resident of one of the following qualifying states:','Full explicit list in source; no default Montana qualification')
extra(69,'residency','wue-current','establish Montana residency')
put(69,'schoolType',{'UMMountainCampusFirstUndergrad':True,'MissoulaCollegeExcluded':True,'postBaccalaureateInternationalGraduateExcluded':True},'wue-current','Mountain Campus at the University of Montana.','Institution scope only')
put(69,'deadline',{'month':12,'day':1,'year':None,'status':'priority; later space-available'},'wue-current','If you apply for admission after Dec. 1','Yearless priority date, not absolute annual closing')
put(69,'applicationMethod',{'admissionApplicationAutomaticConsideration':True,'highSchoolCurrentTranscript':True,'qualifiedSelectionNotGuaranteed':True},'wue-current','Your application for admission to UM serves as your WUE application.','No admission/account action')
extra(69,'applicationMethod','wue-current','**Not all qualified first-year applicants will receive the WUE award.**')
put(69,'renewability',{'GPA':3.0,'startedFall2025OrLaterSemesterCredits':15,'academicYearCredits':30,'earlierSemesterCredits':12,'earlierYearCredits':24,'durationUpToYears':4,'transferDurationByCredits':{'0-29':4,'30-59':3,'60+':2}},'wue-current','| Renewal Criteria | Started Fall 2025 or After | Started Before Fall 2025 |','Full table/exceptions retained; GPA not entry threshold')
put(69,'renewalCreditLogic',{'tableListsSemesterAndAnnualMinimum':True,'proseSemesterOrAnnual':True,'resolution':None},'wue-current','15 credits each semester','Samepage table/prose renewal-credit conjunction ambiguity; exact cohort rules retained',state='conflict')
extra(69,'renewalCreditLogic','wue-current','or a')
put(69,'stacking',{'noOtherNonresidentEnteringAwards':True,'UMAASForfeited':True},'wue-current','WUE does not “stack” with other scholarships.','Institution-specific no-stacking scope')
byrow[69]['nextAction']='Resolve genericWUEname versus exactUMaward mapping and applicable next-year price/window. Preserve404oldroute, observeddepth2newroute, residency list, transferGPA, initial/renewal credits and space-available priority; no account appeal.'
put(70,'identityContinuity',{'sponsor':'Montana CARD','program':'Alcohol Responsibility Matters','oneProgramFiveRecipients':True},'alcohol','CARD will award five, one-time, $2,000 scholarships','Official named 2026program; mapping held')
put(70,'historicalAmount',{'currency':'USD','value':2000,'oneTime':True,'recipientSlots':5},'alcohol','Five, one-time, $2,000 scholarships.','2026five slots, not five new award identities')
put(70,'historicalWindow',{'open':'2025-12-01','deadline':'2026-01-25','timeLiteral':'midnight','timezone':None},'alcohol','applications will open on December 1, 2025, and close on January 25, 2026, by midnight.','Explicit historical cycle, no midnight interpretation invented')
put(70,'historicalEligibility',{'MontanaSeniorOrHomeschool2025_26':True,'MontanaPostSecondaryApprenticeCertificate':True,'fall2026Enrollment':True,'goodAcademicStandingNoNumericMinimumObserved':True},'alcohol','Must attend a **Montana** post-secondary school/apprentice program/certificate institute','2026cycle only; GPA numeric threshold stays unknown')
put(70,'historicalMaterials',{'originalMontanaArtworkTagline':True,'paragraphMaxWords':250,'noGenerativeAIArtOrEssay':True,'completeSignedApplication':True,'validatingOfficial':True},'alcohol','Generative AI, such as ChatGPT or other similar applications for essays or artwork, will not be accepted.','2026program full material requirements; blank form source404')
extra(70,'historicalMaterials','alcohol','250 words maximum')
put(70,'historicalApplicationMethod',{'onlineOrMail':True,'GoogleDocsNotAccepted':True},'alcohol','The state of Montana state offices cannot accept Google Docs','2026posted submission options, no route action')
byrow[70]['nextAction']='Preserve2026winners/historical criteria and exactPDF404, alias redirect to parent; resolve next-cycle form/current offering. No recipient read, closure inference, newcycle extrapolation or submission.'
put(71,'identityContinuity',{'program':'Youth Serve Montana','administrator':'Governor’s Office of Community Service'},'youth','Governor’s Office of Community Service administers the scholarships.','Official page identity; current2026recipient heading not future offering')
put(71,'recipientSlots',{'max':90,'priorityOnePerHighSchool':True},'youth','Up to 90 total with priority given to awarding one per high school.','YearlessFAQ slots not distinct awards')
put(71,'eligibility',{'MontanaStudentSenior':True,'MontanaCampusNetworkMemberInstitution':True,'homeschoolAccepted':True,'otherStatesOrInternationalExcluded':True},'youth','Proof of acceptance to one of Montana Campus Network for Civic Engagement','FAQ destination requirement; membership annual-list proof deferred')
extra(71,'eligibility','youth','Yes, home-schooled students are encouraged to apply')
put(71,'minimumGPA',{'selectionUsesHS_GPA':False,'programAfterEnrollmentMinimumRequired':False,'institutionMaySetOwnRequirements':True},'youth','Is my high school grade point average included in the selection criteria?','ExplicitFAQ noGPA selection; not universal institution rule')
extra(71,'minimumGPA','youth','Scholarship does not require a minimum grade point average after enrollment')
put(71,'materials',{'completeLegibleForm':True,'acceptanceProof':True,'validatingOfficial':True,'FAFSACertificationNoAwardLetter':True,'homeschoolCountySuperintendent':True},'youth','you only need to certify on the application that you have submitted a FAFSA','FAQ material verification, not demonstrated need proof')
put(71,'serviceRules',{'politicalAdvocacyReligiousProselytizationExcluded':True,'churchCommunityServiceMayCount':True,'informalNonfamilyVerification':True,'schoolOutsideClassMayCount':True,'disciplinaryHoursExcluded':True,'minimumHours':None},'youth','Activities that include efforts to influence policy and legislation','FAQ service classifications; minimum-hour threshold remains unknown')
extra(71,'serviceRules','youth','Volunteer hours mandated because of detention or disciplinary action cannot be counted.')
put(71,'applicationMethod',{'onlinePreferredPDFByRequest':'not acquired','emailApplicationExcluded':True},'youth','Applications may not be completed via email.','Noportal/PDFrequest/contact action')
put(71,'fundUse',{'noDeferral':True,'fallFullTime':True,'splitFallSpring':True,'otherAidMayReduceInstitutionMatch':True},'youth','You must be enrolled full-time for the fall semester.','YearlessFAQ; not renewable promise or need threshold')
byrow[71]['nextAction']='Resolve applicable cycle/window/amount/minimumhours and annualmemberinstitution list. PreserveFAQexplicit noGPA, FAFSA certification not need qualification, service exclusions/verification, splitmatch and nondeferral; no login/contact/PDFrequest.'
put(72,'identityContinuity',{'program':'LeRoy W. Homer Jr. Foundation flight-training scholarship'},'homer','Our 2027 Scholarship Application opens October 31, 2026!','Named sponsor/current opening versus historicalFAQ')
put(72,'applicationWindow',{'open':'2026-10-31','deadlineMonth':1,'deadlineDay':31,'deadlineYear':None,'annualWindow':True},'homer','Our 2027 Scholarship Application opens October 31, 2026!','Opening explicit, closing year not explicit on2027page')
extra(72,'applicationWindow','homer','Our application window is 10/31 – 1/31 annually.')
put(72,'historicalEligibility',{'ageAtDeadlineRange':[16,23],'USCitizenOrPermanentResident':True,'neverChargedOrConvictedMisdemeanorFelony':True,'noPriorPrivatePilotCertificate':True,'groundSchoolBeforeAward':True,'groundSchool2026Deadline':'2026-05-15','availableMayDec2026':True,'limitedAbsence':True},'homer-faq','Applicant must be between the age of 16 and 23 years old as of the application deadline date.','MixedyearFAQ contains2026training dates; never apply automatically to2027')
extra(72,'historicalEligibility','homer-faq','Applicant must never have been charged or convicted of any misdemeanors or felonies.')
extra(72,'historicalEligibility','homer-faq','prior to May 15, 2026')
put(72,'fundUse',{'privatePilotCertificateOnly':True,'universityIntegratedFlightProgramExcluded':True,'noInstrumentRating':True,'localApprovedFlightSchool':True,'medicalAndIACRAAtAcceptance':True},'homer-faq','not intended for individuals already enrolled in a university based flight program','Yearlessscope training restrictions; FAA external rules not independently researched')
put(72,'amount',{'serviceFlightTrainingExpenseUSD':'below17000unlesscircumstances','approxFlightHoursRange':[45,65],'cashAwardNotStated':True,'sixMonthWindow':True,'basicMaterialsWrittenExamCheckRide':True,'priorTrainingReimbursementExcluded':True,'optionalEquipmentExcluded':True},'homer-faq','at an expense below $17,000 unless circumstances require otherwise.','FAQcostscope cap not cash guaranteed award')
put(72,'materials',{'unofficialTranscript':True,'officialMayBeRequested':True,'recommendationLetters':2,'threeOriginalEssayPrompts':True,'AIContentDiscouraged':True},'homer-faq','An unofficial transcript will be accepted','FAQmaterial request; currentcycle applicability held')
extra(72,'materials','homer-faq','There are three essay prompts')
extra(72,'materials','homer-faq','IMPORTANT – You must receive two (2) on file')
put(72,'reapplication',{'encouragedAfterNonselection':True},'homer-faq','Applicants are encouraged to reapply','Not renewableaward')
byrow[72]['nextAction']='Resolve2027specific closingyear/currenteligibility/materials against2026FAQtrainingdates; retain medical-versus-application distinction, localflighttraining cost scope and no university tuition. No link before observed opening or account action.'
put(73,'identityContinuity',{'program':'ENF Legacy Awards','newPublicID':None,'distinctFromMVS':True},'elks-legacy','Legacy Awards are scholarships available','Existing emptyID stays empty; no invented ID')
put(73,'amount',{'USDTotal':6000,'USDPerYear':1500,'years':4,'recipientSlots':400,'MontanaQuota':3,'atLarge':149},'elks-legacy-faq','Legacy Awards are $6,000 scholarships ($1,500 per year for four years).','2027FAQupdated amount; recipient slots distinct awards')
extra(73,'amount','elks-legacy-faq','total of 400 awards in the 2027 contest.')
extra(73,'amount','elks-legacy','| Montana | 3 |')
put(73,'applicationWindow',{'open':'2026-09-01','deadline':'2027-02-01','time':'11:59','timezoneLiteral':'Pacific Time','noonDescriptionLiteral':True},'elks-legacy','deadline is February 1, 2027 at 11:59 a.m. Pacific Time.','Preserve11:59AMliteral and NOONdescription; do not convert to midnight')
put(73,'eligibility',{'HSsenior':True,'childGrandchildStepchildStepgrandchildLegalWardOfLivingElk':True,'greatGrandchildExcluded':True,'joinBeforeOrOn':'2024-04-01','newLodgeCharterException':True,'duesThrough':'2027-03-31','parentLodgeIfBothParentGrandparent':True},'elks-legacy','any child or grandchild (or step-child, step-grandchild, or legal ward) of a living Elk','Completemembershipexceptions/eligibility paragraph; separate lapsedmember explanatory note')
put(73,'schoolType',{'accreditedUSSchoolCollegeUniversity':True,'PanamaPuertoRicoPhilippinesHomeInstitutionException':True},'elks-legacy','Legacy Awards may only be applied to accredited','FAQschoolbroadscope and explicitterritoryexceptions, not4-yearonly')
put(73,'needPriority',{'financialNeedInvestigated':False},'elks-legacy-faq','There will be no further investigation of the prospective students or their parents with respect to financial need','Explicitjudgingpolicy; no inferred incomeeligibility fact')
put(73,'materials',{'ACTSATRequired':False,'transcriptFreshmanToJunior':True,'essaysWordLimitsUnknown':True,'sponsorMembershipDetails':True},'elks-legacy-faq','waived the standardized test requirement for the 2027 Legacy contest.','FAQ materials; application not entered')
extra(73,'materials','elks-legacy-faq','shows your freshman through junior year information.')
put(73,'continuingService',{'lodgeServiceActsMinimum':3,'timeScope':'collegiatecareer'},'elks-legacy','complete an act of service with a Lodge at least three times during your collegiate career.','Postawardrequirementnotpriorvolunteerhours')
byrow[73]['nextAction']='ResolveENFstackingconflictandmemberdues/lapsed-noteapplicability; retain2027sixthousandtotal/notoldfourthousand,400slots,11:59AMdeadlineandseparateMVSidentity. No newID, lodge/contact/account action.'
put(74,'identityContinuity',{'program':'Dell Scholars'},'dell','The Dell Scholars program helps','ExactpublicIDcandidateheld, programscopechanged')
put(74,'cycle',{'applicationYear':2027},'dell','To be eligible for the 2027 application cycle','Explicitposted2027scope')
put(74,'eligibility',{'TexasHighSchoolSenior':True,'approvedReadinessProgramGrades':[11,12],'TexasAccreditedFourYearPublicInstitution':True,'PellGrantEligible':True,'GPAmin':2.4,'GPAbasisAndScale':None},'dell','Be a high school senior graduating from a Texas high school','2027TexasdestinationandHSrequirements; no app exclusion')
extra(74,'eligibility','dell','Plan to enroll in an accredited four-year public college or university in Texas')
extra(74,'eligibility','dell','Be Pell Grant eligible')
put(74,'applicationWindow',{'open':'2026-10-01','deadline':'2027-01-12','timezone':None},'dell','2026\n\nOCT1','Calendar year boundaries retained')
extra(74,'applicationWindow','dell','2027\n\nJAN12')
put(74,'amount',{'currency':'USD','totalFlexible':20000,'recipientSlotsPerYear':500,'otherBenefits':['laptop','bookcredits','emergencyfunds'],'annualAward':False},'dell','$20,000 flexible scholarship','Totalflexibleawardnotannualcash')
put(74,'materials',{'finalistsHighSchoolTranscript':True,'FAFSASubmissionSummary':True,'otherRequiredInformationUnknown':True},'dell','Finalists are asked to submit a current copy of their high school transcript','Finalistmaterialsnotinitialcompleteapplicationproof')
byrow[74]['nextAction']='Resolve2027Texas-onlyscopeversussavedWhitefishlistingandapprovedreadinessprogramlist; preserve500recipients,20000total,calendarphases/PellruleandunknownGPAbasis. No runtime exclusion or account action.'
put(75,'identityContinuity',{'program':'Flathead Electric Co-op Scholarships','sponsor':'Flathead Electric Cooperative','separateFromBasinMECA':True},'fec','### Flathead Electric Co-op Scholarships','Exact named FEC section; aggregate amount not separate new awards')
put(75,'amount',{'currency':'USD','individualRange':[1500,6000]},'fec','Individual scholarships range from $1,500 to $6,000.','FEC individual scholarship range; no recipient count or guaranteed award inferred')
put(75,'membership',{'applicantORparentLegalGuardianCoopMember':True,'primaryResidenceServedByCoop':True},'fec','The applicant or their parent/legal guardian must be a member of Flathead Electric Cooperative, served by the Co-op at their primary residence.','Literal FEC member alternatives distinct from Basin/MECA member-child')
put(75,'schoolType',{'accreditedPostSecondaryInMontana':True,'degreeTypesNotExplicit':None},'fec','Scholarship money must be used to attend an accredited post-secondary education institution in Montana.','FEC specific destination restriction')
put(75,'deadline',{'date':'2026-02-22','timezone':None},'fec','Applications are due February 22, 2026.','Explicit FEC 2026 deadline; no future cycle inferred')
put(75,'sourceStatus',{'posted':'closed','deadlineYear':2026,'nextOffering':None},'fec','**Applications are now closed. Please check back next year.**','First closed statement follows FEC-specific deadline; Basin/MECA closure separately retained')
put(75,'parentStageOptions',{'graduatingAccreditedServiceAreaHS':True,'graduatingHomeschool':True,'currentUndergrad':True,'namedChildApplicabilityResolution':None},'fec','Current undergraduate college students','Parent-wide stage options only; individual child qualification held',state='unverified')
byrow[75]['nextAction']='Resolve exact current FEC section/ID and nextcycle rules/materials; preserve1500–6000range, literal applicantORparent/guardian membership at primaryresidence, Montana destination, February22/2026closure and separate Basin/MECA children. No portal visit or newID.'
put(76,'identityContinuity',{'program':'Fly for Duke Aviation Scholarships','sponsor':'Duke Carrillo Foundation'},'duke','The Duke Carrillo Foundation offers Fly For Duke','Namedprogramcontinuityproposedonly')
put(76,'historicalWindow',{'open':'2025-11-16','deadline':'2026-02-25','time':'17:00','timezoneLiteral':'CST','trainingCompleteBy':'2027-05-01'},'duke-faq','opens on November 16, 2025 and closes February 25, 2026 at 5:00 PM CST.','2025/26applicationversus2027trainingend; no2027applicationinferred')
extra(76,'historicalWindow','duke-faq','Training must be completed by May 1, 2027.')
put(76,'eligibility',{'ageAtApplicationRange':[17,24],'USCitizen':True,'approvedFAAFlightSchool':True,'privatePilotGroundSchoolAndThirdClassMedicalBeforeTraining':True},'duke-criteria','Must be between the ages of 17 – 24 years','Yearlesscriteriawith2026deadline; heldapplicability')
extra(76,'eligibility','duke-criteria','Must be a U.S. citizen')
extra(76,'eligibility','duke-faq','17-24 years of age at time of application')
put(76,'fundUse',{'privatePilotLicenseTraining':True,'mentoringOnRequest':True,'approvedSchoolOnlineOrInpersonTraining':True},'duke','earn a private pilot’s license.','Trainingaidnotcollegetuitionscholarship')
extra(76,'fundUse','duke-faq','As long as all training is at an approved FAA flight school for private pilot’s license, all forms of training with that school will be accepted.')
put(76,'materials',{'collegeTranscriptInsteadOfHSIfCollegeEnrolled':True,'USCitizenshipProofAndPhotoIDIfSelected':True,'exactInitialFormMaterials':None},'duke-faq','No, please provide your college transcript.','FAQlimitedmaterials; no response collection')
put(76,'reapplication',{'afterNonselectionNextPeriod':True},'duke-faq','Yes, you can reapply','Notrenewal')
byrow[76]['nextAction']='Resolve2025label/2026application/2027trainingdatecurrentcycleandamount/fullmaterials. Preserve17–24atapplication/UScitizenship/FAAmedicalbeforetraining and reapplication; no inventedcashcap or form.'
put(77,'identityContinuity',{'program':'John & Joe Norrish Memorial Scholarship','sponsor':'Flathead Building Association'},'norrish','2025-2026 John & Joe Norrish Memorial Scholarship','Raw4pagePDFindependentlyidentifiedname; Firecrawlredactedname not absence')
put(77,'historicalWindow',{'open':'2025-12-15','deadline':'2026-02-27','time':'16:00','timezone':None},'norrish','Application Deadline—Friday, Feb. 27, 2026 4:00 PM','Explicit2025/26document; timezoneunknown')
put(77,'amount',{'USDTypicalRange':[500,1500],'committeeDiscretion':True,'recipientCountVariable':True,'tuitionOnly':True},'norrish','typically ranges from $500 to $1500','Typicalrangeandcommitteeavailabilitynotguaranteed')
put(77,'eligibility',{'constructionRelatedCourseOrVocational':['engineering','construction','architecture','structuraldesign','trades','businesssupport'],'HSseniorGPA':2.5,'undergradFullTimeGPA':2.5,'returningAdultGPA':2.5,'returningAdultCollegeYearsMin':1,'MontanaAccreditedInstitution':True,'undeclaredMajorEncouragedWithCommitteeReview':True},'norrish','If Graduating high school senior: GPA of 2.5 or higher','Fullpage1stage/fieldconditionsandexceptions')
put(77,'membershipAmbiguity',{'page1AffiliationPreferred':True,'page3CheckboxCategoryAffiliation':True,'requiredStatusResolution':None},'norrish','Weight given to children or legal dependent of FBA member','Preferencesnotautomaticmandatorymembership; applicationcategoryambiguous',state='conflict')
extra(77,'membershipAmbiguity','norrish','FBA Membership of parent, legal guardian, or FBA sponsor')
put(77,'materials',{'completedTypedOrInkForm':True,'essayMaxWords':500,'recommendationLetters':3,'certifiedOfficialTranscriptGPA2_5':True,'HSAcceptanceLetterIfAvailable':True,'studentParentSignatures':True,'memberSponsorSignatureIfSponsored':True,'possibleInterview':True},'norrish','Attach 3 letters of recommendation','All4pages visually inspected; complete list and signature requirements')
extra(77,'materials','norrish','essay of 500 words or less')
extra(77,'materials','norrish','Parent Signature:')
put(77,'payout',{'tuitionOnly':True,'useWithin12Months':True,'institutionPaid':True,'typicalHalfFirstHalfSecondTerm':True,'firstTermGPA2_5ForSecondPayment':True,'lowerGradesCommitteeReview':True,'currentRenewabilityNotEstablished':True},'norrish','50% for first term or semester','Splitpaymentnotrenewableannualaward; discretion/lowgradeexceptionretained')
extra(77,'payout','norrish','Lower grades will be considered')
byrow[77]['nextAction']='Resolveapplicablenextcycle, membershippreferenceversuscheckboxcategoryand2023-24blankattendancelabel. Preservetypical500–1500cap,stageconditions,3letters,500wordessay,signatures and splitpaymentGPAexception; no contact/submission.'
byrow[78]['outcome']='held-access';byrow[78]['nextAction']='DEWALT seed is an excluded login/application route only; no read attempt or source-access failure claimed. Resolve official public terms only if supplied or observed within POLICY; no guessed provider URL/search/signup.'
for row in [79,80,81,82,83]:
 byrow[row]['outcome']='held-identity';byrow[row]['nextAction']='Retained same-day Dawson listing is under construction and redacted selected scope cannot bind this exact named child. Keep existing publicIDcandidate/identity and every material field held. Reconcile on applicable authorized exact evidence arrival or consolidation; no generalapplication/form traversal or inferred child absence.'
 put(row,'sourceInspectionLimit',{'listingUnderConstruction':True,'exactNamedChildBinding':False,'reusedPriorSource':True,'awardAbsenceInferred':False},'dawson','LISTING UNDER CONSTRUCTION','Retainedsourcecapturedoesnotestablishnamedchildfacts',state='unverified')
# Explicit route outcome for every seed/alias. No silently discarded locator.
for r,seed in zip(records,q['records'][60:80]):
 r['seedDispositions']=[]
 for u in dict.fromkeys(seed['recordedSeedUrls']+seed['publishedSourceAliases']):
  ids=[s['sourceId'] for s in sources if s['originalUrl']==u]
  excluded=bool(re.search('login|signup|commonapp|submittable|formstack|webportalapp|grantinterface',u,re.I))
  disposition='application/login locator only; not fetched or interacted with' if excluded else ('inspected/reused exact source; source limitations and all holds retained' if ids else 'deferred saved alias; not fetched; no current fact or access-failure claim')
  r['seedDispositions'].append({'url':u,'sourceIds':ids,'disposition':disposition,'owner':r['owner'],'trigger':r['trigger'],'nextAction':r['nextAction']})
count=sum(len(r['fieldProposals']) for r in records)
ledger={'schemaVersion':1,'checkpoint':4,'entryCommit':ENTRY,'queueSha256':sha((P.parent/'queue.json').read_bytes()),'queueOffsetStart':60,'queueOffsetEndExclusive':80,'orderedInputKeys':[r['inputKey'] for r in records],'records':records,'sourceRegistry':sources,'acceptedFacts':0,'researchComplete':True,'researchCompleteMeaning':'Twenty initial held dispositions only; uninspected material links/fields remain explicit holds. FullSD2 incomplete.','independentReview':'Pending exact frozen-candidate fresh-context read-only GPT review; receipt separate','completedAt':now,'fullSD2Complete':False,'canonicalAcceptance':False,'SD3Started':False,'coverage':{'frozenInputs':406,'checkpointInputs':20,'cumulativeInitialDispositions':80,'unprocessedInputs':326,'heldIdentities':20,'fieldEnvelopes':count,'cumulativeAutonomousHeldFields':1136+count,'cumulativeAutonomousHeldIdentities':80,'sourceReceipts':len(sources),'newSourceReceipts':len(sources)-1,'reusedSourceReceipts':1,'renderedPages':4,'acceptedFacts':0,'distinctAcceptedAwards':None},'nextCheckpointInputOffset':80,'nextInputKey':q['records'][80]['inputKey'],'priorHolds':{'authoritativePaths':[f'docs/evidence/sd2-autonomous/checkpoint-{i:03d}.json' for i in [1,2,3]],'fields':1136,'identities':60,'state':'all unchanged; none closed','owner':'Codex source/identity reconciliation','trigger':'Applicable authorized evidence arrival or SD2 consolidation after initial remaining-queue coverage','nextAction':'Reconcile every hold at original paths/triggers without replay or acceptance shortcut.'},'preservedGates':prior['preservedGates'],'sourcePolicyDeviations':[{'issue':'Initial Firecrawl full result forwarded public recipient names/contact scope despite provider redactPII request.','retainedInFiles':False,'containment':'Saved only sanitized selected scope; later results narrowed; no recipient links followed. Native blankPDFcontained no applicant response.'}],'limits':['No live workbook/permission/head/nativepreservation proof.','RetainedDawsoncaptureholds all five namedchildren; no absence inferred.','Norrishcurl sandboxDNSfailed; permittedexactURLdownload succeeded; exactcurlHTTPstatus unavailable.','Some program criteria remain unknown because material linked documents were explicitly deferred, not silently truncated.','RawNorrishPDF/renderings temporary; custodyhashes durable.','Fresh authenticated main/target unknown; retainedorigin/main not currentproof.','Backendmodel/effort not independently observable; no switch claimed.']}
dump(P/'source-receipts.json',sources);dump(P.parent/'checkpoint-004.json',ledger)
print(json.dumps({'coverage':ledger['coverage'],'next':q['records'][80],'outcomes':{k:sum(r['outcome']==k for r in records) for k in set(r['outcome'] for r in records)}},indent=2))
