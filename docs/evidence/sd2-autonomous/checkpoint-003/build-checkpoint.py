"""Generate only the new held ledger from inspected checkpoint003 sources; never reset queue/history."""
from pathlib import Path
import collections, datetime, hashlib, json, re
P=Path(__file__).resolve().parent; ROOT=P.parents[3]
def load(p):return json.loads(p.read_text())
def sha(b):return hashlib.sha256(b).hexdigest()
def dump(p,x):p.write_text(json.dumps(x,indent=2,ensure_ascii=False)+'\n')
q=load(P.parent/'queue.json');sources=load(P/'source-receipts.json')
for s in sources:
 if s['sourceId'] in ['fcdw-2026','jenne','vfw']:
  s['statusCode']=None;s['transportExitCode']=0;s['statusLimit']='curl --fail succeeded; exact HTTP status/header revision not captured'
 if s['artifactPath'].startswith('docs/evidence/sd2-autonomous/checkpoint-003/'):
  p=ROOT/s['artifactPath'];p.write_text('\n'.join(x.rstrip() for x in p.read_text().splitlines()).strip()+'\n')
 s['artifactSha256']=sha((ROOT/s['artifactPath']).read_bytes())
registry={s['sourceId']:s for s in sources};now=datetime.datetime.now(datetime.timezone.utc).isoformat()
fields=['amount','minimumGPA','gpaBasis','schoolType','residency','membership','needRequirement','needPriority','renewability','gapYears','deadline','applicationWindow','cycle','applicationMethod','materials','identityContinuity','currentOffering']
records=[]
for src in q['records'][40:60]:
 r={k:src[k] for k in ['inputKey','rowLocator','recordedName','publicIdCandidates','identityAcceptance']}
 r.update(outcome='researched-held',fieldProposals={},owner='Codex source/identity reconciliation',trigger='Applicable authorized evidence arrival or SD2 consolidation after initial remaining-queue coverage',nextAction='Reconcile every material field and named identity; retain all unknowns and existing human/canonical/publication gates.',interviewCoverage='No app change. Only later accepted award-bound facts can affect matching; unknown/current-scope gaps stay non-excluding.')
 for f in fields:r['fieldProposals'][f]={'value':None,'state':'unverified','acceptance':'held','sourceScope':'Current named-award applicability unresolved','observedAt':now,'sourceRevision':None,'freshness':'No current fact inferred from retrieval, filename, historical cycle or parent page','evidence':[],'note':'Unknown is non-excluding; source silence is never false or unrestricted.'}
 records.append(r)
byrow={r['rowLocator']:r for r in records}
def put(row,field,value,sid,needle,scope,state='verified',note=None):
 s=registry[sid];t=(ROOT/s['artifactPath']).read_text();assert needle in t,(row,field,sid,needle)
 # Keep the complete relevant line/paragraph, including qualifications next to the anchor.
 lines=t.splitlines();n=next(i for i,x in enumerate(lines) if needle in x) if '\n' not in needle else None
 excerpt='\n'.join(lines[max(0,n-1):min(len(lines),n+3)]) if n is not None else needle
 f={'value':value,'state':state,'acceptance':'held','sourceScope':scope,'observedAt':s.get('observedAt',now),'sourceRevision':s.get('sourceRevision'),'freshness':'Source-scoped observation only; historical/yearless terms never establish current opening or accepted applicability','evidence':[{'sourceId':sid,'sourceUrl':s['originalUrl'],'artifactSha256':s['artifactSha256'],'locator':scope+' / '+field,'excerpt':excerpt}]}
 if note:f['note']=note
 byrow[row]['fieldProposals'][field]=f
def extra(row,field,sid,needle):
 s=registry[sid];t=(ROOT/s['artifactPath']).read_text();assert needle in t
 byrow[row]['fieldProposals'][field]['evidence'].append({'sourceId':sid,'sourceUrl':s['originalUrl'],'artifactSha256':s['artifactSha256'],'locator':'Separate source/variant retained','excerpt':needle})
for row in [42,43]:
 put(row,'identityContinuity',{'program':'Fred J. Epstein Youth Achievement Awards','sponsor':'Smart Kids with Learning Disabilities','mappingAcceptance':'held'},'epstein-2025','Fred J. Epstein','2025 named main award and Special Recognition on same sponsor page; child separation retained')
 put(row,'historicalEligibility',{'LDorADHD':True,'maxAge':19,'achievementRequired':True},'epstein-2025','students 19 or younger','2025 general awards; not 2027 criteria')
 put(row,'historicalAmount',{'currency':'USD','value':1000 if row==42 else 500},'epstein-2025','$1,000 Fred J. Epstein Youth Achievement Award and $500 Special Recognition Award','2025 named child only; not current amount')
 put(row,'historicalDeadline',{'date':'2025-01-15','timezone':None},'epstein-2025','January 15, 2025','2025 submission deadline')
 put(row,'applicationMethod',{'nomination':True,'applicationRouteVisited':False},'epstein-2025','accepting nominations','2025 nominations; no current submission usability verified')
 put(row,'parent2026Status',{'cycle':2026,'status':'closed','childBinding':'Main program' if row==42 else None},'epstein-2026','Applications for the 2026 awards are now closed.','2026 named program closure; Special Recognition child terms not assumed')
 put(row,'parent2026Deadline',{'date':'2026-01-20','timezone':None},'epstein-2026','January 20, 2026','2026 general program; Special Recognition child-binding held')
 byrow[row]['nextAction']='Resolve next-cycle named child terms/amounts and nomination materials within POLICY. Keep2025 amounts historical,2026 closure separate, Special Recognition current child continuity held. Never visit application action route.'
put(42,'parent2026Eligibility',{'studentStage':'high school','maxAge':19,'learningDifferences':['LD','ADHD'],'achievementRequired':True},'epstein-2026','high school students 19 or younger','2026 closed program; no future-cycle eligibility inferred')
put(44,'identityContinuity',{'sourceName':'Emily Leighty/DKG Lambda Scholarship','nativeAuthority':'unverified'},'emily','Emily Leighty/DKG Lambda','Native blank2026-titled document; public/sponsor provenance held')
put(44,'amount',{'currency':'USD','value':1000},'emily','Amount: $1,000','2026-titled native document; no current offering inferred')
put(44,'eligibility',{'female':True,'studentStage':'WHS high school senior','focus':'Education/working with children'},'emily','Open to female high school seniors','Native overview eligibility')
put(44,'fundUseLimit','year awarded','emily','used in the year it was awarded','Native use rule')
put(44,'deadline',{'month':4,'day':3,'year':None,'timezone':None,'filenameYear':2026},'emily','Applications due by 4/3','Yearless printed date; filename not deadline-year proof')
put(44,'materials',{'typedApplication':True,'transcript':True,'collegeAcceptanceLetter':True,'careerIntentStatement':True,'activitiesOrResume':True,'recommendationLetters':2,'financialGapResponse':True,'GPARequestedScale':4.0,'classRankRequested':True},'emily','Application Requirements:','All3 rendered pages and form inspected; financial question is not need-required proof')
put(44,'applicationMethod','WHS Guidance Office','emily','WHS Guidance Office','Printed counselor route; no contact')
put(46,'identityContinuity',{'sourceName':'Jack Quatman Scholarship','nativeAuthority':'unverified'},'quatman','Jack Quatman Scholarship','Native2026 blank document, original candidate held')
put(46,'amount',{'currency':'USD','minimum':1000},'quatman','Amount: $1,000 (minimum)','Minimum not fixed maximum')
put(46,'minimumGPA',{'required':False},'quatman','No Minimum GPA Requirement','Explicit no-minimum statement in2026 application; not source silence')
put(46,'schoolType',['4-year','2-year','technical','work/apprenticeship'],'quatman','beginning work/apprenticeship','Native pathway alternatives')
put(46,'studentStage','Whitefish High School senior','quatman','high school seniors enrolled at Whitefish High School','Native2026 eligibility')
put(46,'deadline',{'month':4,'day':4,'year':None,'timezone':None,'documentYear':2026},'quatman','Applications due by 4/4','Overview date yearless; application form explicitly2026')
put(46,'materials',{'typedAndPrintedApplication':True,'oneEssayChooseOneOf':3,'wordCountWording':['under250','250orLess'],'exactBoundaryResolution':None},'quatman','under 250 words','Overview and form boundary phrasing differ; keep both')
extra(46,'materials','quatman','250 words (half-page) or less')
for row in [47,49]:
 put(row,'identityContinuity',{'sourceName':'Muldown Scholastic Scholarship' if row==47 else 'Whitefish High School Alumni Scholarship','sharedApplication':True,'separateChildren':True},'wef-common','MULDOWN SCHOLASTIC SCHOLARSHIP','Native2026-titled common application; mapping held')
 put(row,'amount',{'currency':'USD','eachChild':1000},'wef-common','AMOUNT OF AWARD FOR EACH SCHOLARSHIP: $1,000','Separate named awards, not recipient-slot inference')
 put(row,'deadline',{'date':'2026-04-23','timezone':None},'wef-common','April 23rd 2026','Printed explicit2026 deadline')
 put(row,'studentStage',{'literalRule':'Whitefish High School graduating senior or planning to attend an accredited postsecondary institution','logicalInterpretation':None},'wef-common','Whitefish High School graduating senior or planning','Preserve literal OR; do not silently make conjunctive eligibility')
 put(row,'classRank',{'topPercent':20},'wef-common','top 20%','Native common criteria; GPA threshold not supplied')
 put(row,'focus',{'educationInterestRequired':True} if row==47 else {'anyFieldExplicit':True},'wef-common','Alumni applicants may be pursuing a career in any field','Both named-child focus rules read; not merged')
 put(row,'selectionPriority',['leadership','scholastic','extracurricular','community involvement'],'wef-common','Leadership, as well as scholastic','Native prioritized factors, not required participation thresholds')
 put(row,'materials',{'typedCompletedApplication':True,'currentHSTranscript':True,'seniorResume':True,'futurePlansStatement':True,'financialNeedsStatement':True,'oneEssayChooseOneOf':2,'essayWordsRange':[250,300]},'wef-common','Application documents must include:','Complete3-page rendered native source; no need-eligibility threshold inferred')
 put(row,'applicationMethod',{'sharedSelect':['Muldown','Alumni','Both'],'submitTo':'WHS Counselors Office'},'wef-common','Indicate the scholarship(s) you are applying for:','Common application permits one or both; preserve children')
 put(row,'historicalAlias',{'filenameCycle':2025,'deadlineMonth':4,'deadlineDay':4,'printedYear':None},'muldown-alias','DEADLINE: APRIL 4TH','Separate2025-titled PDF, current2026 terms not overwritten')
 byrow[row]['nextAction']='Resolve native/public sponsor provenance and current named-child offering. Preserve shared application/two separate awards,2025/2026 dates, literal OR ambiguity, class-rank and field-specific focus; do not infer numerical GPA or need requirement.'
put(48,'identityContinuity',{'sourceName':'Whitefish Education Foundation-Community Service Scholarship','publicIdCandidate':None},'wef-community','Whitefish Education Foundation-Community Service','2025-titled native blank document; no new stable ID created')
put(48,'amount',{'currency':'USD','perRecipient':1000,'recipientSlots':2},'wef-community','Amount: $1,000 (2)','Two slots, not two newly created awards')
put(48,'studentStage','WHS graduating seniors','wef-community','Available to WHS graduating seniors','Historical/undated printed terms')
put(48,'schoolType','accredited post-secondary institution','wef-community','accredited post-secondary','Historical destination requirement')
put(48,'service',{'highSchoolCommunityServiceOrVolunteerism':True,'minimumHours':None},'wef-community','Students must have participated','Historical participation, no hours inferred')
put(48,'deadline',{'month':4,'day':4,'year':None,'timezone':None},'wef-community','Applications due by 4/4','Yearless deadline; file title2025 only')
put(48,'materials',{'typedApplication':True,'transcript':True,'essayWords':250,'essayTopic':'community volunteerism and learning','financialGapResponse':True,'activitiesHonorsAndGoals':True,'GPARequestedScale':4.0},'wef-community','Application Requirements:','All4 rendered pages; GPA/financial response are not thresholds')
put(48,'disbursement',{'payTo':'institution','months':[7,8],'year':'award year'},'wef-community','PAYMENT OF SCHOLARSHIP','Historical payment timing; no award opening inferred')
put(50,'identityContinuity',{'sourceName':'Lonnie Collinsworth Scholarship','nativeAuthority':'unverified'},'collinsworth','Lonnie Collinsworth Scholarship','Native blank2025/26 application')
put(50,'amount',{'currency':'USD','value':1500},'collinsworth','Amount: $1,500','Explicit native document amount')
put(50,'renewability',False,'collinsworth','non-renewable','Explicit non-renewal, not substring guess')
put(50,'minimumGPA',3.0,'collinsworth','Minimum 3.0 GPA','Scale/weighted/cumulative basis unknown')
put(50,'residency','Montana','collinsworth','Must be a Montana resident','Native applicant residence; destination may be outsideMontana')
put(50,'schoolType',['4-year','2-year'],'collinsworth','4-year, or a 2-year school','In-state or out-of-state allowed')
put(50,'focus',{'majorRestricted':False,'minimumHighSchoolArtYears':1},'collinsworth','no restriction regarding major','Art-course prerequisite separate from college major')
extra(50,'focus','collinsworth','Minimum 1 Year of Art in High School')
put(50,'studentStage','WHS high school seniors','collinsworth','high school seniors enrolled at Whitefish High School','Native2025/26 eligibility')
put(50,'deadline',{'date':'2026-04-10','timezone':None},'collinsworth','April 10th, 2026','Explicit native deadline')
put(50,'materials',{'typedPrintedApplication':True,'hardCopies':1,'allThreeEssays':True,'wordCountWording':['under250each','approximately250each'],'exactBoundaryResolution':None},'collinsworth','ALL 3 essays','All3 rendered pages; overview under250 versus form approximately250 retained')
extra(50,'materials','collinsworth','approximately 250 words each')
put(51,'identityContinuity',{'sourceName':'John L. & Ann Taylor Scholarship Trust','administrator':'D.A. Davidson Trust Company'},'taylor','The John L. & Ann Taylor','Undated printed source;2026 filename not current cycle')
put(51,'minimumGPA',3.0,'taylor','at least a 3.0 GPA','Entry minimum; current and cumulative requested, basis unspecified')
put(51,'eligibility',{'studentStage':'graduating senior','schoolLocation':'Flathead Valley Montana','schoolAccredited':True,'degree':['Bachelor of Fine Arts','Master of Fine Arts'],'emphasis':['painting oil/watercolor','printing using stated mediums']},'taylor','Must be a graduating senior','Native complete single-page criteria; no generic all-arts expansion')
put(51,'deadline',{'month':4,'day':10,'year':None,'timezone':None},'taylor','DEADLINE: April 10th','Yearless printed deadline')
put(51,'materials',{'coverSheet':{'currentAndCumulativeGPA':True,'schoolHistory':True,'prioritizedCollegeAcceptancesAndCosts':True,'major':True,'careerGoalsMaxWords':50},'formattedHSResume':True,'personalStatementMaxWords':300,'needStatement':True,'officialTranscriptThroughSemester':7,'artTeacherLetter':{'count':1,'letterhead':True,'signed':True,'portfolioEvaluation':True},'portfolioCopies':{'wording':'would be appreciated','maxPieces':6,'descriptionsAndMedium':True,'mandatoryResolution':None}},'taylor','1. COVER SHEET','All six sections inspected; portfolio appreciated is not silently mandatory')
put(51,'applicationMethod','return completed application to D.A. Davidson Trust Company','taylor','Return completed applications','Printed route; no contact action')
put(52,'identityContinuity',{'sourceName':'Flathead County Democratic Women scholarship','currentSourceLinkBound':True},'fcdw','Flathead County Democratic Women Scholarship','Sponsor page binds exact2026 PDF; native2025 alias separate')
put(52,'amount',{'currency':'USD','value':1000,'cycle':2026},'fcdw-2026','$1000','2026 PDF; not old1500 title or2025 value')
put(52,'deadline',{'date':'2026-04-03','timezone':None},'fcdw-2026','April 3, 2026','2026 explicit PDF/sponsor deadline')
put(52,'applicationWindow',{'cycle':2026,'openingMonth':1,'openingDay':None,'statusNow':None},'fcdw','open in January of 2026','Reported2026 window; no2027 current offering inferred')
put(52,'selectionCriteria',{'needConsidered':True,'FlatheadCountyHSGraduate':True,'traditionalOrNontraditionalDiplomaOrGED':True,'currentFVCCStudent':True,'supportsDemocraticPrinciples':True,'bulletAlternativesOrCumulative':None,'partyMembershipRequired':None},'fcdw-2026','Selection criteria list:','Preserve ambiguous bullet scope; support is not party registration/membership')
put(52,'materials',{'completeSignedDatedApplication':True,'typedOrBlueBlackInk':True,'officialTranscript':True,'nonFamilyLetters':2,'typedSingleSidedEssay':True,'essayTopics':['need','career/education','leadership/volunteerism','extracurricular','employment if applicable','Democratic principles support']},'fcdw-2026','Page 2:','Both pages inspected; no applicant values/contact data retained')
put(52,'historicalAlias',{'cycle':2025,'amountUSD':1500,'deadline':'2025-04-10'},'fcdw-alias','$1,500','Historical2025 variant not current conflict or same-cycle source choice')
put(53,'identityContinuity',{'sourceName':'Whitefish Police Protective Association Scholarship'},'police','Whitefish Police Protective Association','Native2025-titled3-page scan; public-page transport blocked')
put(53,'amount',{'currency':'USD','perRecipient':1000,'recipientSlots':2},'police','two $1000.00 scholarships','Recipient slots separate from distinct award count')
put(53,'minimumGPA',2.5,'police','grade point average of 2.5 or higher','Historical/yearless entry requirement, GPA scale unknown')
put(53,'schoolType',{'fullTime':True,'destinations':['college','trade school']},'police','full-time college or trade school','Historical/yearless destination')
put(53,'studentStage','Whitefish High School senior','police','Eligibility: Whitefish High School senior','Historical/yearless eligibility')
put(53,'needPriority',True,'police','based on need, academic standing','Selection factor distinct from need-required eligibility')
put(53,'deadline',{'month':4,'day':15,'year':None,'timezone':None},'police','April 15th','Printed yearless; filename2025')
put(53,'materials',{'currentHSTranscript':True,'referenceLetters':2,'contactReferences':3,'applicantSignature':True,'impactStatement':True,'lawEnforcementEssay':True,'completedApplication':True},'police','Include current High School transcript','Three pages inspected; two letters versus three listed references are separate')
put(53,'applicationMethod','hand deliver or mail to Whitefish Police Department','police','hand delivered or mailed','Historical printed delivery; no contact')
byrow[53]['nextAction']='Retain native historical rules and distinct reference requirements. Public parent twice transport-blocked; no further retry now. Resolve current cycle/sponsor authority on applicable evidence arrival or consolidation.'
byrow[54]['outcome']='held-identity';byrow[54]['nextAction']='Resolve exact James D. Schultz named child from applicable official evidence; source redaction obscures names. Retain application-action locator unvisited; listing notice is not proof of absence or closure.'
put(54,'sourceInspectionLimit',{'listingUnderConstruction':True,'namedChildResolved':False,'redactionObscuresHeadings':True},'dawson','LISTING UNDER CONSTRUCTION','No selected award fact established',state='unverified')
put(55,'identityContinuity',{'sourceName':'Whitefish Bulldog Booster Club Scholarships','tracksHeldSeparately':True},'booster','Whitefish Bulldog Booster Club Scholarships','Five rendered slides, filename2026, current authority held')
put(55,'amount',{'currency':'USD','tracks':[{'value':1000,'slots':2},{'value':1500,'slots':1}],'boardMayModify':True},'booster','two scholarships annually','Two award levels/three slots; no new child IDs')
put(55,'minimumGPA',{'1000track':2.5,'1500track':3.5,'scale':None},'booster','GPA 2.5 or greater','Track-specific GPA thresholds; no collapsed numeric minimum')
extra(55,'minimumGPA','booster','GPA 3.5 or greater')
put(55,'eligibility',{'parentGuardianActiveWBBCMembershipBy':'May1 of application year','stage':['graduating senior','graduated in last2years'],'listedActivitiesMinimum':2,'WHSParticipationYearsMinimum':2,'fullTimeAccreditedPostsecondary':True,'conductViolationsAllowed':False,'fullRideRecipientsEligible':False},'booster','For either $1,000 scholarship:','Both track terms inspected; membership not inferred from school')
extra(55,'eligibility','booster','Students receiving full-ride scholarships are not eligible.')
put(55,'higherTrackAdditional',{'leadershipRole':True,'volunteerHoursMinimum':120},'booster','$1,500 track:','Higher track only; no student UI hours restored')
put(55,'needPriority',False,'booster','Financial need is not a consideration.','Explicit merit basis; native-source applicability held')
put(55,'renewability',False,'booster','One-time, non-renewable.','Explicit source rule')
put(55,'deadline',{'page1':{'month':4,'day':17},'pages2to5':{'month':4,'day':18},'year':None,'resolution':None},'booster','Page 1 overlay:','Conflicting overlays, no source/date choice',state='conflict')
extra(55,'deadline','booster','Pages 2, 3, 4 and 5 overlays: Due April 18th to Guidance Counselor.')
put(55,'materials',{'completeApplication':True,'serviceProof':True,'recommendations':[{'count':1,'from':'participating coach/advisor'},{'count':1,'from':'teacher/counselor/administrator/employer'}],'typedDoubleSpacedEssayMaxPages':1,'applicantParentGuidanceSignatures':True,'GPAConfirmedByCounselor':True,'returnTo':'WHS Guidance Office'},'booster','Page 2:','All5 pages including signatures inspected')
byrow[55]['nextAction']='Resolve conflicting April17/18 overlays and current cycle/native sponsor authority; preserve two scholarship levels, separate GPA/service/leadership criteria and every form/signature requirement. No award splitting or chosen deadline.'
put(56,'identityContinuity',{'sourceName':'Jerry Barnes Memorial Scholarship'},'jerry','Jerry Barnes Memorial','Historical2025-titled single-page scan')
put(56,'amount',{'currency':'USD','maximum':500,'dependsOnNumberGiven':True},'jerry','up to $500','Not fixed500 per guaranteed recipient')
put(56,'minimumGPA',3.0,'jerry','Cumulative GPA of 3.0','Cumulative specified, scale unknown')
put(56,'eligibility',{'WHSGraduatingSenior':True,'seniorYearSportRequired':True,'destination':'Montana College/Trade School'},'jerry','Criteria:','Historical/yearless criteria')
put(56,'deadline',{'month':4,'day':22,'year':None,'timezone':None},'jerry','Due 4/22','Yearless overlay')
put(56,'materials',{'interestLetter':True,'seventhSemesterHSTranscript':True,'collegeAcceptanceLetter':True,'coachLeadershipLetter':True},'jerry','Please provide:','Complete historical scan requirements')
put(57,'identityContinuity',{'sourceName':'Glacier Medical Associates Scholarship','2025and2026Variants':'separate','nativeSponsorAuthority':'unverified'},'medical','Glacier Medical Associates Scholarship Application','Different exact IDs; no substitution')
put(57,'amount',{'currency':'USD','perRecipient':1000,'recipientSlots':5,'cycle':2026},'medical','5 scholarships worth $1000 each','2026 native source; five slots not five distinct child awards')
put(57,'eligibility',{'graduatingSeniorSchoolsLiteral':['WHS','CFHS','FHS','GHS','SHS'],'career':'Health sciences','schoolAbbreviationExpansion':None},'medical','applicants graduating seniors','Native abbreviation list preserved, no invented expansion')
put(57,'deadline',{'date':'2026-04-30','timezone':None},'medical','April 30, 2026','Explicit2026 native deadline')
put(57,'materials',{'completedApplication':True,'resume':True,'officialTranscript':True,'recommendationLetters':2,'healthScienceStatementMaxPages':1,'additionalUncoveredInformationResponse':True,'financeAndOtherScholarshipsResponse':True,'GPARequested':True},'medical','Please attach your resume','Whole page inspected; GPA/finance question not eligibility threshold')
put(57,'applicationMethod','postal mail to Glacier Medical Associates HR','medical','Please mail your application','No mail/contact sent; address omitted')
put(57,'historicalAlias',{'cycle':2025,'amountUSD':500,'deadline':'2025-04-23'},'medical-alias','A $500 is available','Earlier exactID historical terms; no silent overwrite')
put(58,'identityContinuity',{'name':'Student-View Scholarship','sponsor':'Student Insights'},'studentview','Sponsor: Student Insights','Program/sponsor page; existing candidate remains held')
put(58,'applicationWindow',{'cycle':2027,'status':'expected','surveyAvailableVerified':False},'studentview','We expect to offer','Tentative expected2027 survey, not open application')
put(58,'minimumGPA',{'required':False},'studentview','NO minimum grade point average','Explicit yearless/current page rule; not silence')
put(58,'needRequirement',False,'studentview','regardless of academic achievement or financial need','Explicit regardless-of-need statement; not inferred')
put(58,'materials',{'surveyMinutes':[15,25],'essayRequired':False,'SATorACTMinimumRequired':False,'applicationFees':False,'randomDrawingEntry':True},'studentview','NO minimum SAT or ACT','Public description only; survey/notification never visited')
byrow[58]['nextAction']='Verify complete2027 rules, amount/deadline and actual survey opening from permitted public evidence; retained old survey and new notification routes locator-only. No survey/signup/form or applicant data.'
put(59,'identityContinuity',{'sourceName':'Margaret Fellows Memorial and Jane Fellows Drama/Theatre Scholarship','sponsor':'Whitefish Theatre Company'},'fellows','Whitefish Theatre','Native2026 explicit submission line, historical alias separate')
put(59,'amount',{'currency':'USD','value':500,'recipientSlots':1},'fellows','AMOUNT OF AWARD:','2026 document amount/slot; not title-only')
put(59,'deadline',{'date':'2026-04-30','timezone':None},'fellows','4/30/2026','Explicit application turn-in line')
put(59,'eligibility',{'theatreParticipationRequired':True,'WTCParticipation':'special consideration'},'fellows','applicant must have participated','Participation required, WTC merely preference')
put(59,'needPriority',False,'fellows','not based on financial need','Explicit source non-need selection')
put(59,'materials',{'writtenApplication':True,'resume':True,'schoolTranscript':True,'educationCareerGoalsMaxWords':250,'theatreExperienceImpactMaxWords':500},'fellows','Each applicant must:','Both pages inspected including two required responses')
put(59,'historicalAlias',{'filenameCycle':2025,'deadlineMonth':4,'deadlineDay':25,'printedYear':None,'amount':'varies'},'fellows-alias','APRIL 25','Historical alias, not current fixed500 conflict')
put(60,'identityContinuity',{'program':'P.E.O. STAR Scholarship','localChapterBinding':'historical BR/D Whitefish flyer only'},'peo','P.E.O. STAR Scholarship','Official sponsor page plus historical local flyer; May15 resume request unverified')
put(60,'amount',{'currency':'USD','value':2500},'peo','$2,500','Current yearless sponsor criteria')
put(60,'renewability',False,'peo','non-renewable','Explicit sponsor non-renewal rule')
put(60,'minimumGPA',3.0,'peo','minimum cumulative unweighted GPA of 3.0','Explicit basis/scale separate')
put(60,'gpaBasis',{'scale':4.0,'cumulative':True,'weighted':False},'peo','minimum cumulative unweighted GPA of 3.0 on a 4.0 scale','Explicit current sponsor basis')
put(60,'eligibility',{'woman':True,'stage':'final high school year','recommendedByLocalPEOChapter':True,'citizenshipOrPermanentResidency':['US','Canada'],'postsecondaryAccredited':['US','Canada'],'enrollment':['full-time','part-time'],'start':'fall after graduation'},'peo','Eligibility Requirements','Yearless sponsor eligibility; historical flyer age cap not imported')
put(60,'selectionPriority',['leadership','academics','extracurricular','community service','future success'],'peo','Exhibits excellence','Selection criteria, no arbitrary scoring')
put(60,'materials',{'chapterInterview':True,'onlineAfterChapterRecommendation':True,'essayWords':700,'recommendationLetters':2,'unofficialTranscriptThroughGrade':11,'activities':True,'relativeSubmissionDaysAfterEmail':30},'peo','Members of a local P.E.O. chapter','Current public application-process text only; no account/login action')
put(60,'fundUseLimit','academic year following graduation or forfeited','peo','academic year following graduation or it will be forfeited','Explicit source use requirement')
put(60,'historicalFlyer',{'footer':'4/24','nativeFilename':2025,'ageCap':20,'chapterRecommendationWindow':['August15','October15'],'currentAgeCapOrLocalMay15DeadlineAccepted':False},'peo-alias','20 years of age or younger','Historical local flyer; no current age ceiling or local deadline inferred')
byrow[60]['nextAction']='Reconcile linked official policy variants/student instructions within depth2 and current Whitefish nomination/local resume date. Historical flyer age20/annual chapter window stays historical; no current age cap or May15 rule without evidence. Account/email route locator-only.'
put(61,'identityContinuity',{'program':'William and Sara Jenne Scholarship','sponsor':'Montana State Elks Association','officialParentToPDFLink':True},'jenne','William and Sara Jenne','Exact linked seed PDF plus native historical alias')
extra(61,'identityContinuity','jenne-community','https://montanaelks.b-cdn.net/wp-content/uploads/2024/01/scholarship-william-and-sara-jenne-scholarship-application.pdf')
put(61,'minimumGPA',2.0,'jenne','cumulative GPA of 2.0','Completed first-year cumulative requirement; scale unknown')
put(61,'studentStage',{'completedYear':1,'continueIntoYear':2,'schoolsLocation':'Montana'},'jenne','completed their first year','Yearless blank PDF, not graduating-HS award')
put(61,'deadline',{'month':6,'day':1,'year':None,'method':'mailed no later than','timezone':None},'jenne','mailed no later than June 1st','Yearless PDF; parent says usuallyJune1, no current date proof')
put(61,'materials',{'completedSignedDatedApplication':True,'officialCompletedFirstYearTranscript':True,'recommendationLetters':2,'lettersExcludeFamily':True,'letterSources':['educators','employers','community leaders'],'financingEmploymentStudyActivitiesAndSpecialConsiderationsResponses':True},'jenne','To this completed application:','All3 pages and all narrative/signature/checklist sections inspected')
put(61,'parentNeed',{'bonafideVerifiableNeed':True,'applicationScopeResolution':None},'jenne-community','bonafide and verifiable need','Named-linked parent terms; applicability held, not automatic canonical eligibility')
put(61,'parentScopeAmbiguity',{'collegeUniversityAllowedEarlier':True,'laterCommunityTechnicalOnlyLanguage':True,'laterBachelorTransferExcluded':True,'fullTimeAndMontanaAccreditedLater':True,'resolution':None},'jenne-community','Montana University, College','Parent named-linked section mixes broad first-year university with appended vocational-style restrictions; no union/intersection or source choice',state='conflict')
extra(61,'parentScopeAmbiguity','jenne-community','STUDENTS PLANNING TO TRANSFER TO A FOUR YEAR SCHOOL TO PURSUE A BACHELOR’S DEGREE ARE NOT ELIGIBLE FOR THIS PROGRAM.')
byrow[61]['nextAction']='Resolve current cycle and conflicting parent/program scope (broad university first-year versus later community/technical and no bachelor transfer), amount and source-version applicability; retain separate undatedPDF/native alias. Do not apply sibling vocational rules by proximity.'
put(62,'identityContinuity',{'sourceName':'Voice of Democracy','sponsor':'Veterans of Foreign Wars','oldRecordedThemeDiffers':True,'publicIdCandidate':None},'vfw','Voice of Democracy Competition','Exact saved providerCDN2026–27 blank document; no new award ID created')
put(62,'cycle',{'yearStart':2026,'yearEnd':2027,'theme':'What a Veteran Taught Me About America'},'vfw','What a Veteran Taught Me About America','Printed current source differs from saved input old theme; identity mapping held')
put(62,'deadline',{'date':'2026-10-31','timeLiteral':'midnight','timezone':None,'deliverTo':'participating VFW Post'},'vfw','midnight, Oct. 31, 2026','No timezone or ambiguous-midnight conversion invented')
put(62,'amount',{'currency':'USD','nationalGrandPrize':35000,'localOtherPrizes':None},'vfw','Grand Prize: $35,000 Award','Grand prize, not guaranteed amount for every applicant')
put(62,'eligibility',{'gradeRange':[9,12],'asOf':'October31 deadline','schools':['US public/private/parochial/home study','territories/possessions','overseas dependents of USmilitary/civilian personnel'],'permanentResidenceOrPendingUndeniedWithIntentToNaturalize':True,'excluded':['foreign exchange','age20orOver','GED','Adult Education']},'vfw','The Voice of Democracy is open to students in grades 9-12','Printed complete rule/exception paragraph, not citizenship-only simplification')
put(62,'materials',{'originalAudioMinutes':[3,5],'maxTimingToleranceSeconds':5,'audioFormat':'MP3','noVideo':True,'ownVoiceEnglish':True,'typedEssay':True,'completedEntryForm':True,'anonymousEssay':True,'noMusicSingingPoetrySoundEffects':True,'studentSignature':True,'parentSignatureEvenAge18':True,'participantAgreement':True,'hearingSpeechImpairedSpecialInstructions':'contact-only route, not accessed'},'vfw','Record your original 3-5 minute','Both pages/all columns inspected; no applicant or form interaction')
extra(62,'materials','vfw','Required even if student is 18 or over')
put(62,'submissionLimits',{'onePostAndCompetitionPerYear':True,'nationalDirectEntriesConsidered':False,'schoolGroupAlternative':'one winner per15 students','electronicSubmission':'localPost permission/QR-link required','AIUse':'inappropriate AI/ChatGPT prohibited','advancingStateWinnerConsentAgreement':True},'vfw','All entries begin at the VFW Post level.','All printed exceptions/agreements retained; no post contact or submission')
put(62,'judging',{'originality':35,'delivery':35,'content':30},'vfw','Originality is worth 35 points','Contest judging only, not student-app scoring')
put(62,'sourceAuthorityLimit',{'exactPinnedCDNOnly':True,'independentSponsorParentBinding':False},'vfw','Veterans of','Pinned saved source inspected, not inferred externalhost official proof',state='unverified')
# Exact seed/alias receipts, including every unvisited application route.
def fileid(url):
 m=re.search(r'/d/([^/]+)',url);return m.group(1) if m else None
for r,seed in zip(records,q['records'][40:60]):
 r['seedDispositions']=[]
 for url in dict.fromkeys(seed['recordedSeedUrls']+seed['publishedSourceAliases']):
  ids=[s['sourceId'] for s in sources if url==s['originalUrl'] or (fileid(url) and fileid(url)==s.get('fileId'))]
  action=any(x in url for x in ['formstack.com/forms/','efmfeed.verintefm.com','youth-achievement-award-application'])
  disposition='application/form/survey locator only; not fetched or interacted with' if action else ('inspected/reused exact source or file-ID; source limits and field holds retained' if ids else 'unresolved source binding; no fetched-source claim')
  r['seedDispositions'].append({'url':url,'sourceIds':ids,'disposition':disposition,'owner':r['owner'],'trigger':r['trigger'],'nextAction':r['nextAction']})
count=sum(len(r['fieldProposals']) for r in records)
ledger={'schemaVersion':1,'checkpoint':3,'entryCommit':'2b021a6162f8b94684c10c390bef5ee8bbb47bed','queueSha256':sha((P.parent/'queue.json').read_bytes()),'queueOffsetStart':40,'queueOffsetEndExclusive':60,'orderedInputKeys':[r['inputKey'] for r in records],'records':records,'sourceRegistry':sources,'acceptedFacts':0,'researchComplete':True,'researchCompleteMeaning':'Twenty initial held dispositions only; full SD2 incomplete. All identities and fields held. Unvisited application routes do not imply access failure.','independentReview':'Pending exact frozen-candidate review; receipt separate','completedAt':now,'fullSD2Complete':False,'canonicalAcceptance':False,'SD3Started':False,'coverage':{'frozenInputs':406,'checkpointInputs':20,'cumulativeInitialDispositions':60,'unprocessedInputs':346,'heldIdentities':20,'fieldEnvelopes':count,'cumulativeAutonomousHeldFields':744+count,'cumulativeAutonomousHeldIdentities':60,'sourceReceipts':len(sources),'newSourceReceipts':len(sources)-1,'reusedSourceReceipts':1,'renderedPages':46,'acceptedFacts':0,'distinctAcceptedAwards':None},'nextCheckpointInputOffset':60,'nextInputKey':q['records'][60]['inputKey'],'priorHolds':{'authoritativePaths':['docs/evidence/sd2-autonomous/checkpoint-001.json','docs/evidence/sd2-autonomous/checkpoint-002.json'],'fields':744,'identities':40,'state':'all unchanged, none closed','owner':'Codex source/identity reconciliation','trigger':'Applicable authorized evidence arrival or SD2 consolidation after initial remaining-queue coverage','nextAction':'Reconcile each held field/identity with source-specific scope and existing human/canonical gates; no replay'},'preservedGates':['Both standard-build EPERM attempts/fresh-main-target','preservation/concurrency/version/native backup/recovery/permissions','human fact/canonical/publication acceptance','student/CSV/browser','all original437M1 routes/owners/triggers','all reserved external effects'],'sourcePolicyDeviations':[],'limits':['Connected native access does not prove public source or sponsor authority.','Temporary raw/renderings may not survive another host. Durable captures are sanitized selected program scope.','Source revision/version unknown unless actually returned; filename dates do not prove current cycle.','Redacted Dawson headings prevent exact named identity; no award absence claim.','Historical wrap verifier mistakenly rewrote checkpoint002 wrap receipt timestamp locally; exact entry blob restored immediately before any commit; preservation reverified. No historical change retained.','Native materialization ordinary network DNS failure; permitted read-only curl retries succeeded; no token-bearing download URL persisted.','Backend model/effort not independently observable; no model switch claimed.']}
dump(P.parent/'checkpoint-003.json',ledger)
print(json.dumps({'coverage':ledger['coverage'],'next':ledger['nextInputKey'],'states':dict(collections.Counter(f['state'] for r in records for f in r['fieldProposals'].values()))},indent=2))
