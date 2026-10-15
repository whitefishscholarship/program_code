"""One new held packet from the existing cursor; never initialize/reset/replay."""
from pathlib import Path
import json,hashlib,copy,re,datetime,collections,subprocess,urllib.parse,itertools
P=Path(__file__).resolve().parent; B=P.parent; R=P.parents[3]
ENTRY='89d84f329b065e29daf1a4f724cb8b6404b74afc'
sha=lambda b:hashlib.sha256(b).hexdigest()
load=lambda p:json.loads(p.read_text())
def write(p,v):
 assert not p.exists(),f'Will not overwrite {p}'
 p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
OWNER='Codex source/identity reconciliation'
TRIGGER='Applicable authorized evidence arrival or SD2 consolidation after initial remaining-queue coverage'
ACTION='Reconcile exact saved identity, sponsor, child, cycle and route; preserve every source-specific qualifier and unknown. No accepted union/intersection, name-only mapping or fact acceptance.'
q=load(B/'queue.json'); prior=[load(B/f'checkpoint-{i:03d}.json') for i in range(1,17)]
assert [r['inputKey'] for l in prior for r in l['records']]==[r['inputKey'] for r in q['records'][:320]]
assert q['records'][320]['inputKey']=='saved-405588227-row-326'
sources=load(P/'capture-metadata.json')['sources']; reg={s['sourceId']:s for s in sources}
texts={s['sourceId']:(R/s['artifactPath']).read_text() for s in sources}
for s in sources:
 s.update(artifactSha256=sha((R/s['artifactPath']).read_bytes()),owner=OWNER,trigger=TRIGGER,nextAction=ACTION)
 if s['queryIdentityWithheld']:
  u=q['records'][320]['recordedSeedUrls'][0]
  assert s['sourceId']=='pizzinipdf' and s['providerFinalEqualsRequested']
  s.update(originalUrlSha256=sha(u.encode()),finalUrlSha256=sha(u.encode()),exactInputPointer='queue.json:records/320/recordedSeedUrls/0',queryIdentityPreservedByHash=True)
 s['linkDispositions']=[]
 for u in dict.fromkeys(re.findall(r'(?<=\]\()(https?://[^)\s]+)',texts[s['sourceId']])):
  targets=[t['sourceId'] for t in sources if u in [t['originalUrl'],t['finalUrl']]]
  s['linkDispositions'].append(dict(url=u,sourceIds=targets,disposition='Retrieved selected conversion' if targets else 'Deferred resource/definition/application locator; no interaction or rule inference',owner=OWNER,trigger=TRIGGER,nextAction=ACTION))
# Relevant query-bearing document links omitted from readable views retain exact route identity by hash.
rawmeta=load(P/'capture-metadata.json')
reg['pizzini']['excludedProgramLinkDispositions']=[dict(x,owner=OWNER,trigger=TRIGGER,nextAction='Inspect only under existing bounded source authority when necessary; keep all missing terms held, no form interaction/contact or future offering inference.') for x in load(P/'excluded-program-links.json')['links']]
for s in sources:
 s['selectionAccounting']={'convertedCharacters':s['characterCountBeforeSelection'],'finalCharacters':len(texts[s['sourceId']]),'scope':'Program/rule regions only; omitted navigation, biography, contact, access-code, blank response and unrelated-child regions. Explicit scope markers are author annotations. No original/full-source completeness claim.'}
records=[]
base=['identityObservation','cycle','amount','eligibility','minimumGPA','need','schoolType','studyPath','applicantStage','affiliation','renewal','reapplication','nomination','materials','application']
def record(row,ids,action,status='researched-held'):
 seed=next(s for s in q['records'][320:340] if s['rowLocator']==row)
 r=copy.deepcopy(seed);r.update(status=status,outcome=status,allowedSourceIds=ids,owner=OWNER,trigger=TRIGGER,nextAction=action,fieldProposals={},seedDispositions=[])
 for k in base:put(r,k,None,[],state='unverified')
 for u in dict.fromkeys(seed['recordedSeedUrls']+seed['publishedSourceAliases']):
  targets=[s['sourceId'] for s in sources if s['sourceId'] in ids and (u in [s['originalUrl'],s['finalUrl']] or s.get('originalUrlSha256')==sha(u.encode()))]
  sensitive='AccessKeyId=' in u
  r['seedDispositions'].append(dict(url=None if sensitive else u,urlSha256=sha(u.encode()),inputPointer=f"queue.json:{seed['inputKey']}",sourceIds=targets,disposition='Retrieved selected conversion; source limits retained' if targets else 'Deferred locator; annotated string is not a URL; application/account/form/file-host routes not visited, no rule inference',owner=OWNER,trigger=TRIGGER,nextAction=action))
 r['recordedSeedUrls']=['[query-bearing locator withheld; immutable queue hash/pointer]' if 'AccessKeyId=' in u else u for u in r['recordedSeedUrls']]
 r['publishedSourceAliases']=['[query-bearing locator withheld; immutable queue hash/pointer]' if 'AccessKeyId=' in u else u for u in r['publishedSourceAliases']]
 records.append(r);return r
def put(r,key,value,ids,state='verified',scope=None):
 ev=[]
 for id in ids:
  s=reg[id];ev.append(dict(sourceId=id,sourceUrl=s['originalUrl'],artifactPath=s['artifactPath'],artifactSha256=s['artifactSha256'],locator='Selected program passage, lines 1-'+str(len(texts[id].splitlines())),excerpt=texts[id].strip()))
 r['fieldProposals'][key]=dict(value=value,state=state,acceptance='held',sourceScope=scope or 'Exact saved-input page or explicitly identified source variant only; identity and current applicability remain held.',observedAt=max([reg[id]['observedAt'] for id in ids],default=datetime.datetime.now(datetime.timezone.utc).isoformat()),sourceRevision=None,freshness='As-observed selected conversion; no current offering or original/native fidelity proof',evidence=ev,semanticAssertion='Typed held observation: '+json.dumps(value,ensure_ascii=False,separators=(',',':')) if value is not None else 'Unknown remains non-excluding.',owner=OWNER,trigger=TRIGGER,nextAction=r['nextAction'])

r=record(326,['pizzini','pizzinipdf'],'Reconcile Pizzini parent expired2026/November2027-form hint and April2025 initial-document rules; preserve GPA waiver, Montana/work intent, initial-versus-renewal materials and disbursement conditions. No future offering inferred.')
put(r,'identityObservation',{'savedNamedChild':r['recordedName'],'parentBodyMentionsPizzini':True,'documentTitleRedacted':True,'mapping':'proposed; held'},['pizzini','pizzinipdf'],state='unverified')
put(r,'cycle',{'parent':'Expired for 2026 Awards; check back November2026 for2027 forms','documentVersion':'April2025','annualDeadline':'last day of February in offered year','awardMonth':'April','use':'summer or next school year','responseWithinDays':60,'yearForNextDeadline':None,'timezone':None},['pizzini','pizzinipdf'],state='unverified')
put(r,'amount',{'maximumUSD':2500,'annualAwards':'one or more','boardDeterminesAmount':True,'use':['tuition','fees','books','supplies','equipment'],'paidDirectlyToInstitution':True,'mayDivideAcrossEducationalTerms':True},['pizzinipdf'])
put(r,'eligibility',{'fullOrPartTimeRelevantLongTermCareNursingProgram':True,'accreditedNursingCollege':True,'degreeOrCertificationIncludingAdvancedPractice':True,'citizenshipOR':['US citizen','Permanent Resident Visa'],'MontanaResident':True,'planWorkOrRemainInMontanaLongTermCareNursing':True,'availableForQualifyingInterview':True,'preferences':['current long-term care work or demonstrated nursing career interest','current or past MHCA member-facility work']},['pizzinipdf'])
put(r,'minimumGPA',{'entryMinimum':3.0,'scale':None,'basis':'previous studies; high school for first-year students','committeeMayWaiveForCurrentLTCProfessionals':'work experience and performance','continuedDisbursementMayWithholdCancelBelow':3.0},['pizzinipdf'])
put(r,'renewal',{'useRenewalApplicationIfPriorRecipient':True,'renewalRecommendationsNotRequired':True,'subsequentDisbursementProofOfContinuedOriginalOrCommitteeApprovedNursingProgram':True,'proofEnrollmentBeforeFunds':True,'GPAWithholdCancelThreshold':3.0},['pizzinipdf'])
put(r,'reapplication',{'afterOriginalExpires':True,'useRenewalApplication':True},['pizzinipdf'])
put(r,'materials',{'completeAccurateTypedOrPrintedSignedApplication':True,'electronicSignatureAcknowledgedOriginal':True,'substantiateIfAsked':True,'officialHSTranscriptIncludesClassRank':True,'officialCollegeTranscriptsIfApplicable':True,'acceptanceOrEnrollmentProof':'letter before funds if unavailable at application','initialRecommendations':{'count':2,'confidential':True,'from':['teachers','mentors','employers','others familiar'],'familyExcluded':True,'scholasticPersonalNursingPassion':True,'mayArriveSeparatelyButIncompleteUntilReceived':True},'optionalAdditionalInformation':True,'incompleteApplicationsNotConsidered':True,'recommendationSelection':['academic achievement','healthcare/long-term-care involvement','nursing enthusiasm'],'geriatricLTCPreference':True,'publicityConsentViaAcceptance':True},['pizzinipdf'])
put(r,'application',{'mailSignedOriginalOrEmailSignedElectronicCopy':True,'destination':'withheld; no contact','initialVersusRenewalSeparate':True,'routeUsabilityVerified':False},['pizzinipdf','pizzini'])

r=record(327,['natafuture'],'Reconcile Navigate Your Future named child and yearless last-Friday-June rule, full-time undergraduate use, all four materials and joint-payment/ongoing-record obligations.')
put(r,'identityObservation',{'namedProgram':'Navigate Your Future Scholarship','administrator':'NATF'},['natafuture'])
put(r,'cycle',{'annualDeadline':'last Friday in June','year':None,'timezone':None,'notifyRecipients':'end July','notifyOthers':'mid-August'},['natafuture'])
put(r,'amount',{'USD':2500,'awardsPerYear':1,'useYears':1,'fullTimeUndergraduate':True,'jointPayees':'recipient and college/university; both endorse'},['natafuture'])
put(r,'eligibility',{'highSchoolSenior':True,'planGeneralAviationCareer':True,'enrolledOrAcceptedAccreditedCollegeUniversityAviationProgram':True,'demonstrateAviationInterest':True},['natafuture'])
put(r,'materials',{'HSTranscriptUpload':True,'recommendationLetter':True,'collegeAcceptanceLetter':True,'personalStatementTopics':['general aviation career goals','education plan','flight-training goals','two or more reasons for selection'],'recipientProvidePertinentRecordsAndNotifyRelevantChanges':True,'informationConfidentialToScreeningCommitteeNATF':True},['natafuture'])
put(r,'application',{'onlineWufooLocator':True,'visited':False,'priorApprovedAwardsUnaffectedByLaterProgramChanges':True,'recipientTaxLiability':True},['natafuture'])

r=record(328,['natataylor'],'Reconcile Taylor senior-versus-college eligibility and official-versus-unofficial transcript variants; keep private-pilot prerequisite, 3.0 basis unknown and last-Friday-March yearless rule separate.')
put(r,'identityObservation',{'namedProgram':'Richard L. Taylor Flight Training Scholarship','namedPaymentParagraph':True,'mapping':'proposed; held'},['natataylor'])
put(r,'cycle',{'annualDeadline':'last Friday in March','year':None,'timezone':None,'notifyRecipients':'end May','notifyOthers':'mid-June'},['natataylor'])
put(r,'amount',{'USD':1500,'awardsPerYear':1,'fullTimeUndergraduateYears':1,'jointPayees':'recipient and college/university; both endorse'},['natataylor'])
put(r,'eligibility',{'collegeAccreditedEnrollmentAndFlightProgram':True,'professionalPilotGeneralOrCommercialAspiration':True,'privatePilotLicenseRequired':True,'alsoListsHighSchoolSeniorGeneralAviationCareer':True,'applicationAllowsIncomingFreshmanOrCurrentCollege':True,'stageConjunctionUnresolved':True},['natataylor'],state='conflict')
put(r,'minimumGPA',{'minimum':3.0,'scale':None,'eligibilitySaysOfficialTranscript':True,'currentCollegeMaterialsSayUnofficialTranscript':True},['natataylor'],state='conflict')
put(r,'materials',{'officialApplication':True,'pilotLicenseCopy':True,'essayTopics':['aviation goals and dreams','why receive scholarship'],'incomingFreshman':['official high-school transcript','college/university acceptance letter'],'currentCollege':['unofficial college transcript showing GPA3.0+'],'officialVsUnofficialVariantUnresolved':True,'recipientProvidePertinentRecordsAndNotifyRelevantChanges':True,'informationConfidentialToScreeningCommitteeNATF':True},['natataylor'],state='conflict')
put(r,'application',{'onlineWufooLocator':True,'visited':False,'priorApprovedAwardsUnaffectedByLaterProgramChanges':True,'recipientTaxLiability':True},['natataylor'])

def mcf(row,id,action):
 r=record(row,[id],action)
 title=texts[id].splitlines()[0].lstrip('# ')
 put(r,'identityObservation',{'savedName':r['recordedName'],'convertedTitle':title,'routeSlugMatchesSavedCandidate':True,'redactedTitleNotRestored':True,'mapping':'proposed; held'},[id],state='unverified')
 put(r,'cycle',{'open':'2026-01-01','deadline':'2026-03-31','timezone':None,'futureCycle':None},[id])
 put(r,'application',{'MCFPortalLocatorOnly':True,'accessCodeValueExcluded':True,'visited':False,'routeUsabilityVerified':False},[id],state='unverified')
 return r
r=mcf(329,'blackburn','Reconcile Blackburn redacted name/current route, 3.5 entry, rural preference only, one-time range/count and no reapplication; 2026 only.')
put(r,'eligibility',{'graduatingOrGraduatedMontanaHighSchool':True,'ruralMontanaHighSchoolPreferenceOnly':True},['blackburn'])
put(r,'minimumGPA',{'entry':3.5,'scale':None},['blackburn']);put(r,'amount',{'typicalUSDRange':[500,1000],'typicalRecipientsRange':[5,10],'oneTime':True},['blackburn'])
put(r,'reapplication',{'priorRecipientsAllowed':False},['blackburn']);put(r,'materials',{'mostRecentHSTranscript':True,'FAFSA_FSS':True},['blackburn'])
for row,id,employer in [(330,'wardens','Montana Department of Fish Wildlife and Parks Game Warden'),(331,'patrol','Montana Highway Patrol')]:
 r=mcf(row,id,'Reconcile exact '+employer+' child, biological/adopted parent employment and entry2.75 versus continuing2.75/12credits/fouryears/continuedform; no reapplication despite continuation.')
 put(r,'eligibility',{'graduatingHighSchoolSenior':True,'biologicalOrAdoptedChildOfActiveUniformedOfficer':True,'currentlyEmployedBy':employer,'accreditedPostsecondaryByFirstAwardTerm':True},[id])
 put(r,'minimumGPA',{'entryCumulative':2.75,'entryThrough':'first semester of high-school senior year','continuingCumulative':2.75,'scale':None},[id])
 put(r,'renewal',{'academicYears':4,'fullTimeCreditsMinimum':12,'mostRecentTranscript':True,'cumulativeGPA':2.75,'continueRequiredCriteria':True,'MCFContinuedScholarshipForm':'sent early Spring'},[id])
 put(r,'reapplication',{'priorRecipientsAllowed':False,'continuationDistinct':True},[id]);put(r,'amount',{'typicalAnnualUSD':10000,'typicalRecipientsRange':[5,10],'yearsUpTo':4},[id]);put(r,'materials',{'mostRecentHSOrCollegeTranscript':True,'continuedFormAndTranscriptForContinuing':True},[id])
r=mcf(332,'olszewski','Reconcile redacted Olszewski profile; two-year technical enrollment, three-county preference only, two-year continuation good standing and no reapplication; 2026 only.')
put(r,'eligibility',{'eligibleStudentLabels':['graduating high-school seniors','nontraditional students'],'twoYearTechnicalProgramAccreditedPostsecondaryByFirstAwardTerm':True,'preferredMontanaCounties':['Blaine','Hill','Phillips']},['olszewski'])
put(r,'renewal',{'academicYears':2,'continueRequiredCriteria':True,'goodAcademicStanding':True,'MCFContinuedScholarshipForm':'early Spring'},['olszewski']);put(r,'reapplication',{'priorRecipientsAllowed':False},['olszewski']);put(r,'amount',{'typicalAnnualUSD':8000,'typicalRecipients':2,'yearsUpTo':2},['olszewski']);put(r,'materials',{'noAdditionalMaterialsRequired':'selected page statement; general portal uninspected'},['olszewski'])
r=mcf(333,'gbci','Reconcile GBCI employee/parent/guardian initial eligibility, children/stepchildren/full-parttime, geographic preference and reapplication employment exception; no automatic renewal inferred.')
put(r,'eligibility',{'currentEmployeeOrParentLegalGuardianEmployee':'Glacier Bancorp','childrenAndStepchildrenEligible':True,'fullOrPartTime':True,'accreditedPostsecondaryByFirstAwardTerm':True,'branchGeographicDiversityPreference':True},['gbci'])
put(r,'affiliation',{'initialEmploymentRequiredViaSelfOrParentLegalGuardian':True,'afterInitialAwardReapplyRegardlessPersonalOrParentalEmployment':True},['gbci'])
put(r,'applicantStage',{'observedEligibleStudentLabels':['Current College Students','Graduating High School Seniors'],'labelsAreNotAnInventedExclusiveEligibilityRule':True},['gbci'])
put(r,'reapplication',{'priorRecipientsAllowed':True,'pastAwardNotDisqualifying':True,'employmentExceptionAfterInitialAward':True},['gbci']);put(r,'amount',{'typicalUSD':2000,'typicalRecipients':12,'oneTime':True},['gbci']);put(r,'materials',{'noAdditionalMaterialsRequired':'selected page statement; general portal uninspected'},['gbci'])
r=mcf(334,'kay','Reconcile MontanaTech pre-nursing/nursing OR branches, need/2.0/communityhealth, Butte and nontraditional preferences, reapplication and materials; redacted name held.')
put(r,'eligibility',{'MontanaTechStagesOR':['graduating senior enrolled in pre-nursing','current pre-nursing student','nursing program student'],'financialNeedRequired':True,'strongCommunityHealthCommitment':True,'preferredButteSilverBowHSGraduate':True,'nontraditionalStrongPreferenceOR':['older than typical','part-time college','independent of parents','working full-time','dependents','single parent','HiSET or GED']},['kay'])
put(r,'minimumGPA',{'preNursingHighSchoolMinimum':2.0,'orEquivalent':True,'scale':None},['kay']);put(r,'need',{'required':True},['kay']);put(r,'reapplication',{'priorRecipientsAllowed':True},['kay']);put(r,'amount',{'typicalUSDRange':[500,1500],'typicalRecipientsRange':[5,7],'oneTime':True},['kay']);put(r,'materials',{'mostRecentHSOrCollegeTranscript':True,'FAFSA_FSS':True},['kay'])
r=mcf(335,'lynch','Reconcile Lynch Montana highschool graduate/Montana accredited trade-school full-parttime and cosmetology-massage exclusion; one-time no reapplication; redacted name held.')
put(r,'eligibility',{'MontanaHighSchoolGraduate':True,'MontanaAccreditedTradeSchoolFullOrPartTime':True,'excludePrograms':['cosmetology','massage'],'enrolledEligibleAccreditedPostsecondaryByFirstAwardTerm':True},['lynch']);put(r,'reapplication',{'priorRecipientsAllowed':False},['lynch']);put(r,'amount',{'typicalUSD':5000,'typicalRecipientsRange':[5,10],'oneTime':True},['lynch']);put(r,'materials',{'mostRecentHSTranscript':True},['lynch'])
r=mcf(336,'reach','Reconcile Reach Montana-residency/graduate/strongties OR, fulltime Montana public/private/tribal vocational enrollment and need; nontraditional preference, continuing2.5 and two-year/no-reapplication distinction; all materials.')
put(r,'eligibility',{'documentedMontanaConnectionOR':['residency','Montana high-school graduation','strong family or historical ties'],'enrolledOrSeekingFullTimeMontanaCollegeTypes':['public','private','tribal'],'study':'vocation or trade; examples non-exhaustive aviation technology/carpentry/welding/auto mechanics/plumbing','financialNeedRequired':True,'nontraditionalPreferenceOR':['delayed postsecondary enrollment','full-time work','financial independence','dependents other than spouse','single parent','GED/HiSET instead of standard diploma']},['reach']);put(r,'need',{'required':True},['reach']);put(r,'minimumGPA',{'entry':None,'continuingMinimum':2.5,'scale':None},['reach']);put(r,'renewal',{'upToAcademicYears':2,'goodAcademicStanding':True,'GPA':2.5,'MCFContinuedScholarshipForm':'early Spring'},['reach']);put(r,'reapplication',{'priorRecipientsAllowed':False,'continuationSeparate':True},['reach']);put(r,'amount',{'typicalAnnualUSD':2500,'typicalRecipients':1,'upToYears':2},['reach']);put(r,'materials',{'MontanaConnectionDocumentationOrWrittenResponse':True,'mostRecentHSOrCollegeTranscript':True,'FAFSA_FSS':True,'recommendationLetters':True,'references':True},['reach'])
r=mcf(337,'young','Reconcile Young graduatingMontana senior/3.0/STEM-or-healthcare, Montana-college preference only and need as selection; full material set/no reapplication.')
put(r,'eligibility',{'MontanaHighSchoolGraduatingSenior':True,'studyOR':['STEM','healthcare'],'accreditedPostsecondaryByFirstAwardTerm':True,'MontanaCollegePreferenceOnly':True,'selection':['financial need','academic achievement','leadership','school/community participation','personal attributes']},['young']);put(r,'minimumGPA',{'cumulativeEntry':3.0,'scale':None},['young']);put(r,'need',{'selectionConsideration':True,'requiredNeedThreshold':None},['young'],state='unverified');put(r,'reapplication',{'priorRecipientsAllowed':False},['young']);put(r,'amount',{'typicalUSDRange':[1000,1500],'typicalRecipientsRange':[25,30],'oneTime':True},['young']);put(r,'materials',{'mostRecentHSTranscript':True,'FAFSA_FSS':True,'recommendationLetters':True,'references':True},['young'])

for row,id,pdf,kind in [(338,'foldsfirst','foldsfirstpdf','first responder'),(339,'foldsmilitary','foldsmilpdf','military')]:
 r=record(row,['folds',id,pdf],'Reconcile Folds '+kind+' higher-education child, source-specific status/dependency/service proofs, GPA-on-acceptance versus entry, unmetneed, parttime caps, weekend deadline conflict, annual reapplication and checkin/material conditions. Historical2024-25/2025 documents do not prove next cycle.')
 put(r,'identityObservation',{'family':kind,'scope':'Higher Education; Children’s Fund rules excluded','mapping':'proposed'},[id,pdf,'folds'])
 put(r,'cycle',{'parentStatus':'Application Window Is Closed','annualOpen':'02-01 09:00 EST','annualClose':'03-31 18:00 EST','year':None,'programPageWeekendRule':'first business day after March31 if weekend','notificationVariants':['mid-July','by end July TBD'],'acceptanceCheckIn1Deadline':'09-15','historicalInternationalRuleCycle':'2024-2025'},[id,'folds'],state='conflict' if kind=='first responder' else 'unverified')
 put(r,'amount',{'annualMaximumUSD':5000,'perTermMaximumUSD':2500,'partTimePerTermMaximumUSD':1250,'minimumPaymentUSD':100,'actualUnmetNeedCap':True,'unusedRetainedForSameAcademicYearOtherTerm':True,'notLumpSum':True,'paidDirectlyToEducationalInstitution':True},[id,'folds'])
 put(r,'need',{'unmetNeedRequired':True,'eligibleCosts':['tuition','fees','on-campus dormitory housing','meal plans','required textbooks'],'otherAidOffsets':True,'loansAndWorkStudyNotCountedAsAid':True},['folds'])
 put(r,'minimumGPA',{'uponAwardAcceptanceOfficialTranscript':True,'eachOfTwoMostRecentFallSpringTermsMinimum':2.0,'summerExcluded':True,'offerRescindedIfNotMet':True,'reapplyOnlyAfterTwoConsecutiveFallSpringTerms2Plus':True,'entryNumericRequirementNotSeparatelyEstablished':True,'scale':None},['folds'])
 put(r,'reapplication',{'annualRequired':True,'GPAReapplicationConditionRetained':True},[id,'folds'])
 put(r,'renewal',{'automatic':False,'threeCheckIns':['Fall July/August','WinterSpring December','SpringSummer April/May'],'checkIn2Opens':'12-01','checkIn2Closes':'end December/early January','checkIn3Opens':'04-15','summerRequest':'mid-April–mid-May','correctCompleteDocumentationBeforeProcessing':True,'allowWeeksAfterComplete': [4,6],'quarterSchoolsUseWinterJanuaryMarchForCheckIn2':True},['folds'])
 put(r,'fundUse',{'PDFTermsOfUseAllowedExamples':{'items':['tuition','most fees','required textbooks','approved required school uniforms'],'scope':'Exact family PDF Terms of Use; retained separately from general Higher Education FAQ','reconciliation':'held; no all-fees inference or guaranteed uniform reimbursement'},'excluded':['off-campus or lease housing','Greek housing/fees/meal plans','computers/accessories','special-field certification/license exams','student insurance','previous-year or semester charges','parking/transportation passes','sports tickets'],'internationalInstitutionExclusion':'US and territories only in 2024-2025 statement; future unknown','reimbursementOnlyViaInstitutionWithWrittenAuthorization':True,'unusedExcessReturn':'Tulsa Community Foundation on FOH behalf'},['folds',pdf])
 put(r,'checkInMaterials',{'currentCorrectSchoolInfoRequired':True,'schoolChangesViaCheckIn':True,'requiredTextbooks':'bookstore cart/suspended transaction price list; lowest range price, or detailed purchase receipts','reimbursement':['zero-balance account statement showing personal payment','detailed tuition/fee/book receipts matching payment','optional-upload fields for institution release authorization'],'noPreReviewVerificationByPhoneEmail':True,'unsubmittedIncorrectIncompleteDelays':True},['folds'])
 put(r,'application',{'onlinePortalOnly':True,'visited':False,'awardAcceptanceAndAdditionalInformationBySetDeadline':True,'noContactOrSubmission':True},[id,pdf])
 if kind=='first responder':
  cv=copy.deepcopy(r['fieldProposals']['cycle']['value']);cv['FAQ']='no accommodations outside Feb1–Mar31';put(r,'cycle',cv,[id,'folds'],state='conflict')
  rv=copy.deepcopy(r['fieldProposals']['renewal']['value']);rv['legacyConsecutiveYears']='first-responder FAQ; not generic perpetual entitlement';put(r,'renewal',rv,['folds'])
  put(r,'eligibility',{'spouseOrDependentOfFallenOrCatastrophicallyInjuredFirstResponderUnableToPerformOccupation':True,'recognizedResponders':['firefighter','law enforcement','paramedic','EMT','other routine emergency responders including recognized volunteers compensated or not'],'incidentNeedNotOnDutyButWhileActiveDuty':True,'careerEndingCatastrophicInjuryFormerResponderEligible':True,'noIncidentToApplicationTimeLimit':True,'noDependentCountLimit':True,'adoptedChildrenEligible':True,'spouseRemarriedMayQualifyWithDeceasedSpouseDeathCertificate':True,'separatedOrDivorcedSpouseIneligible':True,'higherEducationIncludes':['college','technical/trade','postgraduate/professional','second bachelor','second trade/technical certification']},[pdf,'folds'])
  put(r,'materials',{'proofRelationship':{'dependent':['birth certificate listing first responder parent','state marriage certificate if stepchild','adoption papers if adopted','legal guardianship if ward'],'spouse':['state marriage license','deceased-spouse death certificate if remarried']},'completedFirstResponderServiceInformationForm':True,'proofActiveDutyOrganizationService':True,'fallenStateDeathCertificate':True,'catastrophicInjuryProofOR':['agency letter explaining event and career end','medical provider certificate explaining inability to work','long-term disability documentation explaining inability to work'],'linkedBlankServiceInformationFormDeferred':True},[pdf,id,'folds'])
 else:
  put(r,'eligibility',{'accreditedCollegeTwoFourYearOrPostgraduateOrTechnicalTradeCertificateLicense':True,'enrollmentStatusOR':['enrolled','planning to enroll'],'dependentOrSpouse':True,'qualifyingServiceStatusesOR':['KIA','killed in line of duty including suicide','deceased postseparation with qualifying VA status','VA disabled70percentOrHigher','active duty with Purple Heart (HigherEd only)'],'deceasedServiceConnectedVersusNonServiceConnectedDocumentationBranches':True,'remarriedSpouseMayQualify':True,'separatedDivorcedSpouseIneligible':True},[pdf])
  put(r,'materials',{'dependentRelationshipOR':['current military ID front/back showing service member sponsor','state birth certificate listing service member parent'],'additionalIfApplicable':['state marriage license for stepchild','adoption papers','guardianship document'],'spouseRelationshipOR':['current military ID front/back showing sponsor','state marriage license'],'remarriedSpouseDeceasedServiceMemberMilitaryDocument':True,'currentFinalDD214orDD1300':True,'KIAorLineDutyDeath':'DD1300','deceasedServiceConnected':'DD214 plus VA decision letter service-connected death','deceasedNotServiceConnected':'DD214 plus final VA Benefit Summary70percentOrHigher and state death certificate','disabled':'DD214 plus current-year VA Benefit Summary70percentOrHigher','activeDuty':'current duty orders plus Purple Heart documentation','GuardReserveAdditionalRankYearsProofMayUseExtraUpload':True},[pdf])

for row,id in [(340,'ase'),(341,'lapsen'),(342,'techforce'),(345,'nths')]:
 ids=[id,'nths'] if id!='nths' else ['nths']
 if row in [340,341]:ids+=['nthscriteria']
 r=record(row,ids,'Reconcile exact NTHS child, membership/endorsement and localchapter criteria versus scholarship selection; preserve yearless dates/account routes and any source-specific GPA alternatives. No general-network total or unrelated child transfer.')
 put(r,'identityObservation',{'savedNamedChild':r['recordedName'],'namedProfilePresent':True,'mapping':'proposed; held'},[id,'nths'] if id!='nths' else ['nths'])
 if row in [340,341]:
  end='ASE' if row==340 else 'LAPSEN'
  put(r,'amount',{'USD':500,'awards':1,'selection':'automatic entry/drawing or chance; not guaranteed'},['nths',id])
  put(r,'cycle',{'window':['05-01','04-30'],'year':None,'timezone':None},['nths'])
  put(r,'affiliation',{'NTHSMembershipInGoodStandingOrConcurrentJoin':True,'endorsement':end,'advisorNominateAndSubmitForEndorsement':True,'noExistingChapter':'charter route only; not acted on'},[id])
  put(r,'membershipCriteria',{'scope':'NTHS national membership, not universal direct scholarship GPA','secondaryOrPostsecondaryCTEPathProgramMajorCoursework':True,'chapterChoosesConsistentlyOneGPAAlternative':['overall3.0unweighted','CTE3.0unweighted','bothOverallAndCTE3.0unweighted'],'chapterMayAddRequirements':True,'chapterSpecificExceptionsForCircumstances':True,'drasticPassFailShiftMayTemporarilyReplaceNationalGPAWithSuccessMeasure':True,'chapterCriteriaMayAdjustBetweenInductionCycles':True,'documentUpdated':'2021-09-20'},['nthscriteria'])
  put(r,'application',{'automaticDrawingForEndorsedMembers':True,'endorsementAdvisorProcess':True,'accountChapterRoutesUnvisited':True},[id,'nths'])
  if row==340:
   put(r,'eligibility',{'ASEAccreditedAutomotiveCollisionOrDieselProgram':True,'passOneOrMoreASEEntryLevelCertificationInAccreditedArea':True,'meetNTHSCriteria':True},['ase'])
   put(r,'materials',{'ASEEntryLevelCertification':True,'advisorNominationSubmission':True,'NTHSOneTimeDuesUSD':30,'duesBeforeOrWithEndorsementFee':True,'regaliaOptionsUSD':{'cord':20,'stole':25,'both':45}},['ase'])
  else:
   put(r,'eligibility',{'LawPublicSafetyCourseworkUnitsMinimum':1.5,'lawPublicSafetyNumericGradeOrGPA':[85,3.0],'overallNumericGradeOrGPA':[75,2.0],'currentOrPriorLawPublicSafetyInstructorRecommendation':True,'noDisciplinaryActionsLastYear':True,'NTHSCriteriaAlsoRequired':True},['lapsen','nthscriteria'])
   put(r,'minimumGPA',{'endorsementCourseMinimum':3.0,'orNumericCourseGrade':85,'overallMinimum':2.0,'orNumericOverallGrade':75,'additionalNTHSChapterChosen3.0Alternative':'separate membership gate; no uniform combined minimum inferred','scale':None},['lapsen','nthscriteria'],state='unverified')
   put(r,'materials',{'instructorRecommendation':True,'advisorNominationSubmission':True,'endorsementFeeUSD':10},['lapsen'])
 elif row==342:
  put(r,'amount',{'USD':2500,'annualAwards':2,'networkTotalFinancialAssistanceNotNamedChildAmount':True},['techforce','nths'])
  put(r,'cycle',{'deadlineMonthDay':'05-31','year':None,'timezone':None},['nths'])
  put(r,'eligibility',{'NTHSMember':True,'pursueSkilledTradesOrTechnicalCareer':True,'createTechForceAccountAndJoinNetwork':True},['techforce','nths'])
  put(r,'application',{'TechForcePlatformApplication':'note NTHS membership','loginAndAccountRoutesNotVisited':True},['techforce'])
 else:
  put(r,'amount',{'USD':1000,'awards':3},['nths']);put(r,'cycle',{'yearlessWindow':['11-01','01-15'],'locatorSays':'NationalFFA2526','futureCycleUnverified':True,'timezone':None},['nths'],state='unverified')
  put(r,'eligibility',{'dualMembership':['NTHS','FFA'],'careerInterest':['agriculture','leadership']},['nths']);put(r,'application',{'FFAApplicationLocatorOnly':True,'visited':False,'exactBoxFileHeldUninspected':True,'rulesNotTransferredFromOtherFFAAward':True},['nths'],state='unverified')

r=record(343,['trades'],'Reconcile monthly student scholarship nationwide/postsecondary skilledtrades and debtowed requirement; do not transfer toolgrant/Bostontextile conditions or dates. GoogleForm remains locator only.')
put(r,'identityObservation',{'program':'Bring Back the Trades monthly student scholarships','toolGrantsSeparate':True},['trades'])
put(r,'amount',{'USD':1500,'cadence':'monthly','paidDirectlyToSchool':True,'additionalAwardsPeriodicallyAsFundingRaised':True},['trades'])
put(r,'eligibility',{'studentsAcrossUnitedStates':True,'attendingPostsecondarySkilledTrades':True,'debtOwedToSchoolRequired':True},['trades']);put(r,'need',{'debtOwedToSchoolRequired':True,'otherNeedThreshold':None},['trades'],state='unverified');put(r,'cycle',{'monthlyCadence':True,'exactDeadline':None,'toolGrantDeadlinesNotTransferred':True},['trades'],state='unverified');put(r,'materials',{'scholarshipApplicationExplainingWhyDeserveScholarship':True,'formQuestionsUnknown':True},['trades']);put(r,'application',{'GoogleFormLocatorOnly':True,'visited':False},['trades'])

r=record(344,['blackmountain','bmspdf'],'Reconcile BlackMountain historical2024 MT-highschool-or-certifiedhomeschool eligibility, parentApril2024 versus PDFApril2023 conflict, 500word format/material restrictions and paymentproof; no current offering inferred.')
put(r,'identityObservation',{'program':'Black Mountain Software Scholarship','parent2024AndPDF2024Heading':True,'mapping':'proposed'},['blackmountain','bmspdf'])
put(r,'cycle',{'parentDeadline':'2024-04-15','PDFSubmissionDeadline':'2023-04-15','PDFEligibilityGraduationYear':2024,'conflictUnresolved':True,'currentCycle':None,'timezone':None},['blackmountain','bmspdf'],state='conflict')
put(r,'amount',{'USD':1000,'awards':2,'paidDirectlyToSchool':True},['blackmountain','bmspdf'])
put(r,'eligibility',{'graduateMontanaHighSchoolOrCertifiedHomeschoolIn2024':True,'continuingAccreditedHigherEducation':['trade','technical','college','university'],'allStudyFieldsParent':True},['bmspdf','blackmountain'])
put(r,'materials',{'completeSignedApplication':True,'essay':{'question':'How will you make a difference in our world?','wordLimit':500,'fontPoints':[11,12],'doubleSpaced':True,'pageInches':[8.5,11],'beginWithQuestion':True,'pageNumbersBottomCenter':True},'excludeUnrequested':['graphics','charts','pictures','transcripts','recommendation letters','other documents'],'excludedItemsNotEvaluatedAndDisposedOf':True,'undecidedInstitutionAllowsOtherSectionBBlank':True,'saveFormChanges':True,'acceptanceOrEnrollmentProof':'before payment/presentation if not available at application'},['bmspdf'])
put(r,'application',{'electronicEmailApplicationAndEssay':True,'destination':'redacted; no contact','currentOfficeFormAliasUnvisited':True,'PDFInternalSupportAliasDeferred':True},['bmspdf','blackmountain'])

records.sort(key=lambda r:r['rowLocator'])
assert [r['inputKey'] for r in records]==[r['inputKey'] for r in q['records'][320:340]]
fields=sum(len(r['fieldProposals']) for r in records);oldfields=sum(len(r['fieldProposals']) for l in prior for r in l['records'])
ledger=dict(schemaVersion=1,scope='One bounded local SD2 held-research checkpoint017; no canonical acceptance',entryCommit=ENTRY,queueSha256=sha((B/'queue.json').read_bytes()),queueOffsetStart=320,queueOffsetEndExclusive=340,orderedInputKeys=[r['inputKey'] for r in records],records=records,sourceRegistry=sources,acceptedFacts=0,researchComplete=True,researchCompleteMeaning='Twenty initial held dispositions only; full SD2 incomplete',independentReview='pending immutable candidate review; final review.json controls after review',completedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),fullSD2Complete=False,canonicalAcceptance=False,SD3Started=False,coverage=dict(checkpointInputs=20,fieldEnvelopes=fields,sourceReceipts=len(sources),newPublicRetrievals=len(sources),nativeReadableRetrievals=0,nativeMetadataRetrievals=0,outcomes=dict(collections.Counter(r['outcome'] for r in records)),cumulativeInitialDispositions=340,cumulativeAutonomousHeldFields=oldfields+fields,cumulativeAutonomousHeldIdentities=340,unprocessedInputs=66),nextCheckpointInputOffset=340,nextInputKey=q['records'][340]['inputKey'],priorHolds=dict(unchangedPaths=[str((B/f'checkpoint-{i:03d}.json').relative_to(R)) for i in range(1,17)],fields=oldfields,identities=320,allEarlierPacketsPRELUDESection9M1Routes='byte-preserved; original owners/triggers/actions'),preservedGates=['exact standard build/fresh authenticated main-target','native preservation/concurrency/version/hiddenP/permissions/private backup/recovery/five-table adapter','human/canonical/publication acceptance','student CSV/browser/filter/fit','437M1 routes/owners/triggers and later setup/activation','every reserved external effect'],sourcePolicyDeviations=[rawmeta['outputHandlingLimits']],limits=[rawmeta['sourceFidelity'],'Historical and yearless source variants remain held; GPT research PASS never accepts facts/identity or starts SD3.'])
write(B/'checkpoint-017.json',ledger);write(P/'source-receipts.json',sources)
write(P/'source-concordance.json',dict(scope='Author-only selected conversion concordance, not independent fidelity',independentSourceFidelity=False,checks=[dict(sourceId=s['sourceId'],finalArtifactSha256=s['artifactSha256'],selectedCharacters=len(texts[s['sourceId']]),unmatched=[],limit=s['sourceScope']) for s in sources]))
pairs=[];events=[]
for s in sources:
 events += [(s['callStartedAt'],1),(s['callCompletedAt'],-1)]
for a,b in itertools.combinations(sources,2):
 if urllib.parse.urlsplit(a['originalUrl']).hostname.lower().removeprefix('www.')==urllib.parse.urlsplit(b['originalUrl']).hostname.lower().removeprefix('www.') and max(a['callStartedAt'],b['callStartedAt'])<min(a['callCompletedAt'],b['callCompletedAt']):pairs.append([a['sourceId'],b['sourceId']])
active=peak=0
for _,delta in sorted(events):active+=delta;peak=max(peak,active)
assert not pairs and peak<=4
write(P/'concurrency-audit.json',dict(historicalCompliance=True,sameHostOverlaps=pairs,maximumConcurrentReads=peak,sourceReads=len(sources),owner='Codex source execution',trigger='Before every subsequent dispatch',nextAction='Normalize hostname; await samehost completion; at most four distinct hosts globally. Preserve prior checkpoint016 noncompliance exact.'))
cust=copy.deepcopy(load(B/'checkpoint-016/prior-custody-audit.json'));gaps=[]
for pin in cust['pins']:
 p=Path(pin['path']);pin['observedSha256']=sha(p.read_bytes()) if p.exists() else None
 if pin['observedSha256']!=pin['recordedSha256']:gaps.append(pin['path'])
cust.update(recordedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),gaps=gaps,scope='Hash-only exact prior temporary custody; no content reinspection/reacquisition/reconstruction/replay')
write(P/'prior-custody-audit.json',cust)
print(json.dumps(ledger['coverage'],indent=2));print('Next:',ledger['nextInputKey'])
