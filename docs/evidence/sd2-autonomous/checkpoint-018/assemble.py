"""Assemble only offsets340:360 from retained selected evidence; no acquisition/reset/replay."""
from pathlib import Path
import json,hashlib,copy,re,datetime,subprocess,urllib.parse,collections,itertools
P=Path(__file__).resolve().parent;B=P.parent;R=P.parents[3]
ENTRY='d472eb79b3eb9edcb744ac53a3f485f84f314810'
sha=lambda b:hashlib.sha256(b).hexdigest()
load=lambda p:json.loads(p.read_text())
now=lambda:datetime.datetime.now(datetime.timezone.utc).isoformat()
OWNER='Codex source/identity reconciliation'
TRIGGER='Applicable authorized evidence arrival or SD2 consolidation after initial remaining-queue coverage'
ACTION='Reconcile exact saved identity, sponsor, child, cycle, materials and route; preserve every qualifier, variant and unknown. No name-only/ordinal mapping or fact acceptance.'
def write(p,v):
 assert not p.exists(),str(p)
 p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
q=load(B/'queue.json');prior=[load(B/f'checkpoint-{i:03d}.json') for i in range(1,18)]
assert [r['inputKey'] for l in prior for r in l['records']]==[r['inputKey'] for r in q['records'][:340]]
assert q['records'][340]['inputKey']=='saved-405588227-row-346'
sources=load(P/'capture-metadata.json')['sources'];reg={s['sourceId']:s for s in sources}
texts={s['sourceId']:(R/s['artifactPath']).read_text() for s in sources}
def links(t):
 return list(dict.fromkeys(re.findall(r'\]\((https?://[^\s)]+)',t)))
for s in sources:
 s.update(owner=OWNER,trigger=TRIGGER,nextAction=ACTION)
 s['linkDispositions']=[]
 for u in links(texts[s['sourceId']]):
  masked='[query-withheld]' in u
  targets=[x['sourceId'] for x in sources if u in [x['originalUrl'],x['finalUrl']]] if not masked else []
  s['linkDispositions'].append(dict(url=None if masked else u,locatorBase=u.split('[query-withheld]')[0] if masked else None,sourceIds=targets,disposition='Retrieved selected conversion' if targets else 'Deferred resource/application/account locator; no interaction or rule inference',owner=OWNER,trigger=TRIGGER,nextAction=ACTION))
 for d in s['queryLinkDispositions']:d.update(owner=OWNER,trigger=TRIGGER,nextAction=ACTION)
 s['selectionAccounting']={'convertedCharacters':s['characterCountBeforeSelection'],'finalCharacters':len(texts[s['sourceId']]),'limits':'Selected program text only; omitted biography, unrelated awards/navigation, contact values, images and response fields. No full-source or independent fidelity proof.'}
 s['timingPrecision']='Exact client request interval' if s['callStartedAt'] else 'First AWS read sequentially preceded all other reads; exact interval unmeasured; observationRecordedAt is not retrieval time'
 if s['sourceId']=='um':s['redirectDisposition']='Unexpected external hostname redirect; general source identity/access hold; no content facts transferred or new-host follow-up'
 elif s['originalUrl']!=s['finalUrl']:s['redirectDisposition']='Same-host resource-preserving redirect; program-specific selected content retained with holds'
 else:s['redirectDisposition']='Provider final URL equals requested URL; no origin/public/authority proof inferred'
records=[]
base=['identityObservation','cycle','amount','eligibility','minimumGPA','need','schoolType','studyPath','applicantStage','affiliation','renewal','reapplication','nomination','materials','application']
def part(s,start,end=None):
 t=texts[s];i=t.index(start);j=t.index(end,i+len(start)) if end else len(t);return t[i:j].strip()
scopes={
 (347,'aea'):part('aea','### **Aircraft Lighting','### **Dutch'),
 (349,'aea'):part('aea','### **Dutch'),
 (352,'nths'):part('nths','### **NTHS DECA','### **NTHS FCCLA'),
 (353,'nths'):part('nths','### **NTHS BPA','### **NTHS DECA'),
 (354,'nths'):part('nths','### **NTHS FCCLA','### **Rubin'),
 (355,'nths'):part('nths','### **Rubin','### **<PRIVATE_PERSON> Alumni'),
 (360,'nths'):part('nths','### **<PRIVATE_PERSON> Scholarship','### **NTHS BPA'),
 (361,'nths'):part('nths','### **<PRIVATE_PERSON> Alumni')}
def put(r,k,v,ids=(),state='verified',scope=None,excerpt=None):
 ev=[]
 for sid in ids:
  s=reg[sid];t=excerpt or scopes.get((r['rowLocator'],sid),texts[sid].strip());assert t in texts[sid]
  start=texts[sid][:texts[sid].index(t)].count('\n')+1
  ev.append(dict(sourceId=sid,sourceUrl=s['originalUrl'],sourceUrlSha256=s['originalUrlSha256'],artifactPath=s['artifactPath'],artifactSha256=s['artifactSha256'],locator=f'Selected passage lines {start}-{start+t.count(chr(10))}',excerpt=t))
 r['fieldProposals'][k]=dict(value=v,state=state,acceptance='held',sourceScope=scope or 'Exact named child and stated source variant only; identity/current applicability remain held.',observationRecordedAt=now(),sourceRevision=None,freshness='As-observed selected conversion; no future/current offering or native/origin proof',evidence=ev,semanticAssertion='Typed held observation: '+json.dumps(v,ensure_ascii=False,separators=(',',':')) if v is not None else 'Unknown remains non-excluding.',owner=OWNER,trigger=TRIGGER,nextAction=r['nextAction'])
def rec(row,ids,action,status='researched-held'):
 seed=next(x for x in q['records'][340:360] if x['rowLocator']==row);r=copy.deepcopy(seed)
 r.update(status=status,outcome=status,allowedSourceIds=ids,owner=OWNER,trigger=TRIGGER,nextAction=action,fieldProposals={},seedDispositions=[])
 for key in base:put(r,key,None,state='unverified')
 for u in dict.fromkeys(seed['recordedSeedUrls']+seed['publishedSourceAliases']):
  masked='?' in u or '@' in u
  targets=[s['sourceId'] for s in sources if s['sourceId'] in ids and s['originalUrlSha256']==sha(u.encode())]
  r['seedDispositions'].append(dict(url=None if masked else u,urlSha256=sha(u.encode()),inputPointer=f"queue.json:{seed['inputKey']}",sourceIds=targets,disposition='Retrieved selected conversion; limits retained' if targets else 'Deferred exact locator/annotated seed/native file/account/form/alias; no visit or rule inference',owner=OWNER,trigger=TRIGGER,nextAction=action))
 for k in ['recordedSeedUrls','publishedSourceAliases']:r[k]=['[query-bearing locator withheld; immutable queue hash/pointer]' if '?' in u or '@' in u else u for u in r[k]]
 records.append(r);return r

r=rec(346,['aws'],'Reconcile AWS certificate-only award, district residence/map, excluded officer/committee families, November2026 window, fixed versus minimum wording, redemption and funds; application remains locator.')
put(r,'identityObservation',{'namedChild':'Welder Training Scholarship','mapping':'proposed; held'},['aws'])
put(r,'cycle',{'applyBy':'2026-11-30','acceptedWindowYearless':['12-01','11-30'],'rollingSelectionYearless':['01-15','12-15'],'schoolAttendance':'next year','calendarYearRemainingFundsOnly':True,'timezone':None},['aws'],state='unverified')
put(r,'amount',{'headlineUSD':1000,'annualRecipientMaximum':800,'awardSectionMinimumUSD':1000,'notPaidToStudent':True,'paidDirectToInstitution':True,'permittedUse':['tuition','fees','books','supplies','required equipment'],'redemptionYears':1},['aws'])
put(r,'eligibility',{'resideWithinAWSDistrict':True,'trainingFacilityOR':['trade school','community college','other welder training facility'],'excludedFamilies':['Section officers and their families','Section Selection Committee members and their families']},['aws'])
put(r,'studyPath',{'certificateProgramYearsLessThan':2,'excludedDegreePrograms':['associate','bachelor']},['aws'])
put(r,'application',{'online':True,'accountWorkflowVisited':False,'districtMapDeferred':True},['aws'])

for row,name,amount in [(347,'Aircraft Lighting International Scholarship',5000),(349,'Dutch and Ginger Arver Scholarship',1000)]:
 r=rec(row,['aea'],'Reconcile exact AEA named child,2027-28 parent availability, accredited avionics/aircraft-maintenance program, amount and uninspected application requirements; no generic/current fact acceptance.')
 put(r,'identityObservation',{'namedChildObserved':name,'mapping':'proposed; held'},['aea'])
 put(r,'cycle',{'parentApplicationSchoolYear':'2027-28','deadline':None,'timezone':None},['aea'],state='unverified',excerpt=part('aea','**Applications for 2027-28','### **Aircraft'))
 put(r,'amount',{'USD':amount,'recipientCount':None},['aea'])
 put(r,'eligibility',{'stageOR':['high school senior','college student'],'enrollmentOR':['plans to attend','attending'],'accreditedSchool':True,'programOR':['avionics','aircraft maintenance']},['aea'])
 put(r,'application',{'sharedApplicationLocatorObserved':True,'unvisited':True,'materialsUnknown':True},['aea'])
for row in [348,350,351]:
 r=rec(row,['aea'],'Reconcile exact named AEA child using independently observable sponsor/title/route evidence; provider-redacted profiles cannot be assigned by ordinal, adjacent names or common application. All child terms remain unknown.',status='held-identity')
 put(r,'identityObservation',{'queuedName':r['recordedName'],'matchingNamedProfileEstablished':False,'providerRedactedTitlesObserved':True,'ordinalAssignmentForbidden':True},['aea'],state='unverified',excerpt=part('aea','# AEA Educational','### **Aircraft'))

r=rec(352,['nths','deca'],'Reconcile dual NTHS-DECA child; yearlessJanuary9 versus January11,2027 deadline variants, child essay, general DECA fulltime/grade-level/merit/material/funding rules and unvisited account route; no silent source selection.')
put(r,'identityObservation',{'namedChildObserved':'National Technical Honor Society Scholarship','dualMembership':['NTHS','DECA'],'mapping':'proposed; held'},['nths','deca'])
put(r,'cycle',{'NTHSWindowYearless':['10-01','01-09'],'DECAChildDeadline':'2027-01-11','timezone':None,'scopeVersionReconciliationRequired':True},['nths','deca'],state='conflict')
put(r,'amount',{'annualRecipientCount':3,'USD':1000,'DECAProgramFundingDirectToCollege':True},['nths','deca'])
put(r,'eligibility',{'dualMembership':['NTHS','DECA'],'DECAProgramFullTimeCollegeRequired':True,'DECAProgramGradeLevels':'all grade levels high-school freshman through Collegiate DECA unless child specifically restricts'},['nths','deca'])
put(r,'need',{'DECAIntro':'strictly merit-based','DECAFAQ':'most scholarships merit-based','explicitChildNeedThreshold':None},['deca'],state='unverified')
put(r,'materials',{'childEssayUpload':True,'DECAFAQAcceptsUnofficialTranscripts':True,'DECAStatementOfInterestNoWordLimit':True,'unseenApplicationMayHaveOtherRequirements':True},['deca'])
put(r,'application',{'accountRequired':True,'unvisited':True,'multipleAwardsIfEachCriteriaMet':True,'changesAfterSubmissionAllowed':False,'ICDCAttendanceRequired':False},['deca'])
put(r,'deferral',{'DECAProgramMaximumYears':3},['deca'])

r=rec(353,['nths','bpa','bpaalt'],'Reconcile NTHS-BPA dual membership/secondary-postsecondary divisions/selection; pinned404 versus alternate200; general5pmET versus child11:59pmET March15,2027 deadline; account requirements held.')
put(r,'identityObservation',{'namedChildObserved':'National Technical Honor Society Scholarships','mapping':'proposed; held'},['bpaalt','nths'])
put(r,'cycle',{'NTHSWindowYearless':['09-15','03-15'],'BPAGeneral':'March15 each membership year at5pm ET','BPAChild':'2027-03-15T23:59','BPAChildTimezone':'ET','timeConflict':True},['nths','bpaalt'],state='conflict')
put(r,'amount',{'recipientCount':3,'USD':1000},['nths','bpaalt'])
put(r,'eligibility',{'dualMembership':['NTHS','BPA'],'divisionOR':['Secondary','Postsecondary'],'selection':['academic success','BPA involvement','NTHS membership']},['nths','bpaalt'])
put(r,'application',{'initialRouteHTTP404':True,'alternateNamedPageObserved':True,'memberGatewayUnvisited':True},['bpa','bpaalt'])

r=rec(354,['nths','fccla','fccrubric'],'Reconcile NTHS-FCCLA active dual membership,March1,2027 ET deadline,unified selectable scholarships,three tuition awards and historical2025-26 rubric/materials; current fullform unseen.')
put(r,'identityObservation',{'namedChildObserved':'National Technical Honor Society Scholarship','mapping':'proposed; held'},['nths','fccla'])
put(r,'cycle',{'NTHSYearlessWindow':['09-15','03-01'],'FCCLAChildDeadline':'2027-03-01T23:59','timezone':'ET','rubricVersion':'2025 2026'},['nths','fccla','fccrubric'],state='unverified')
put(r,'amount',{'recipientCount':3,'USD':1000,'paidTo':'college or university tuition'},['nths','fccla'])
put(r,'eligibility',{'activeDualMembership':['NTHS','FCCLA'],'selection':'contributions and leadership within both organizations'},['nths','fccla'])
put(r,'materials',{'historicalRubricOnly':True,'officialTranscript':True,'recommendationCount':2,'scoredInputs':['academic awards','FCCLA offices/committees','other offices','national programs','state/national projects/events','volunteer activities','FCCLA promotion/public relations','college/university choice','major/minor','why college choice','career goals','CTE preparation','FCCLA impact'],'currentApplicationMaterialsUnknown':True},['fccrubric'],state='unverified')
put(r,'application',{'unifiedSelectableOneSeveralAll':True,'memberPortalLoginRequired':True,'memberIDRequired':True,'surveysApplicationsScholarshipsRoute':True,'notVisited':True},['fccla'])

r=rec(355,['nths','rubin'],'Reconcile Rubin professional-email prompt,2x1000/yearlesswindow and logged-in NTHS application; prompt/fullform and complete requirements remain unseen.')
put(r,'identityObservation',{'namedChild':'Rubin Propel Scholarship','mapping':'proposed; held'},['nths','rubin'])
put(r,'cycle',{'yearlessWindow':['10-01','05-01'],'year':None,'timezone':None},['nths'],state='unverified')
put(r,'amount',{'annualRecipients':2,'USD':1000},['nths'])
put(r,'materials',{'RubinPropelEmailWritingTool':True,'scholarshipPrompt':'write effective professional business email','exactPromptUnknown':True},['nths'])
put(r,'affiliation',{'NTHSMembersLoginRequired':True},['rubin'])
put(r,'application',{'loggedInMembersOnly':True,'workflowUnvisited':True},['rubin'])

r=rec(356,['mikerowe'],'Reconcile WorkEthic UScitizenship/HSsenior-graduate/approved<=2yearprogram/pledge,4shortanswers/video/2references/transcript/tuitionbill; yearlessquarterlydates and embedded2page/3page documents remain held/uninspected.')
put(r,'identityObservation',{'namedProgram':'Work Ethic Scholarship Program','mapping':'proposed; held'},['mikerowe'])
put(r,'eligibility',{'USCitizen':True,'stageOR':['high school graduate','high school senior'],'enrollmentOR':['enroll','plan to enroll'],'approvedProgramAccreditedSchool':True,'maximumProgramYears':2,'fourYearProgramsExcluded':True,'signSWEATPledge':True},['mikerowe'])
put(r,'cycle',{'yearlessDeadline':'10-31','quarterlyDeadlines':['04-30','06-30','08-30','10-31'],'decisionMonths':['June','August','October','December'],'year':None,'timezone':None},['mikerowe'],state='unverified')
put(r,'materials',{'pledgeAndFourShortAnswers':True,'shortVideo':True,'references':{'count':2,'fromOR':['teacher','employer','supervisor'],'contactInformationRequestedButNotCollected':True},'mostRecentHighSchoolOrCollegeTranscript':True,'officialTuitionBillOrSchoolCostStatement':True,'applicantAndSchoolInformationRequiredButNotCollected':True},['mikerowe'])
put(r,'studyPath',{'maximumYears':2,'advertisedPrograms':['construction','electrical','heavy equipment','plumbing','machining','manufacturing','welding','HVAC','energy','automotive','aviation','commercial driving','diesel','marine','farming/agriculture','IT','nursing associate or LPN only','protective services/police/fire/EMT','veterinary technology','cosmetology','culinary'],'embeddedApprovedProgramsPagesReported':2,'embeddedGuidelinesPagesReported':3,'embeddedDocumentsInspected':False},['mikerowe'],state='unverified')
put(r,'application',{'externalAccountLocatorOnly':True,'noApplicationInteraction':True},['mikerowe'])

r=rec(357,['clearwater'],'Reconcile saved8x2500 versus observednine2026 awards; 2027February opening hint is not future criteria; sixmonthmembership/60daytransaction/2026senior-or-adult/financialcheckup and deferred native alias stay held.')
put(r,'identityObservation',{'namedProgram':'Clearwater Scholarship Program','savedCountNotCurrentAuthority':True,'mapping':'proposed; held'},['clearwater'])
put(r,'cycle',{'2026Applications':'closed','2027OpeningMonthHint':'2027-02','historicalDeadline':'2026-03-31T23:59','timezone':None,'futureCriteriaUnverified':True},['clearwater'],state='unverified')
put(r,'amount',{'observed2026Recipients':9,'eachUSD':2500,'totalUSD':22500,'categories':{'educationDegreeHSSenior':1,'anyDegreeHSSenior':7,'postHighSchoolAdultDegreeLearner':1},'savedInputLabelRecipients':8,'savedVsSourceScopeHeld':True},['clearwater'],state='unverified')
put(r,'eligibility',{'historical2026Only':True,'minimumMembershipMonths':6,'depositAccountTransactionWithinDays':60,'stageOR':['2026 graduating high school senior','post-high-school adult learner entering college or enrolled pursuing degree']},['clearwater'])
put(r,'materials',{'historicalOnlineApplication':True,'onlineFinancialWellnessCheckupByDeadline':True,'checkupResultsNotUsedInSelection':True,'nativeDriveAliasDeferredUninspected':True},['clearwater'])

r=rec(358,['fvcc'],'Reconcile Eagle newincoming-degree status including RunningStart,firstcome merit/GPA-GED-HiSET/6credits/renewalappropriateGPA and December15-untilfundsexhausted; exact numerical thresholds/year and account unverified.')
put(r,'identityObservation',{'namedChild':'FVCC Eagle Scholarship','mapping':'proposed; held'},['fvcc'])
put(r,'cycle',{'annualOpensMonthDay':'12-15','closes':'until funds exhausted','year':None,'waitlistPossible':True},['fvcc'],state='unverified')
put(r,'amount',{'minimumUSD':500,'maximumUSD':1000,'basisUnknown':True},['fvcc'])
put(r,'eligibility',{'newIncomingDegreeSeekingUpcomingFall':True,'priorDegreeSeekingTermsExcluded':True,'RunningStartMayQualifyIfNowDegreeSeekingUpcomingFall':True,'creditsEachFundedSemesterMinimum':6,'firstComeFirstServed':True},['fvcc'])
put(r,'minimumGPA',{'selectionBasisOR':['most recent cumulative highschool GPA','college GPA for transfers','HiSET','GED'],'numericEntryThreshold':None},['fvcc'],state='unverified')
put(r,'renewal',{'followingYearPossible':True,'appropriateCumulativeGPARequired':True,'numericThreshold':None},['fvcc'],state='unverified')
put(r,'application',{'externalSSOUnvisited':True,'awardSpringAliasNotAssumedSameRoute':True},['fvcc'])

r=rec(359,['rise','risepdf'],'Reconcile distinct saved RISE input/survivor relationship;2026two2500 versus savedthree1000; parentcurrentemployee versus PDFformer-withinoneyear/finalcurrentqualifier;MST-MDT,3.5,two provider-uploaded letters/3essays/enrollment; no merge or future offering.')
put(r,'identityObservation',{'namedProgram':'Glacier Restaurant Group R.I.S.E. Scholarship','duplicateCandidateOnly':'earlier saved RISE input retained separately','mapping':'proposed; held'},['rise','risepdf'])
put(r,'cycle',{'opens':'2026-01-30','deadlineDate':'2026-03-31','time':'23:59','parentZone':'MST','documentZone':'MDT','awardAnnouncement':'2026-05','enrollment':'fall2026','futureOffering':None},['rise','risepdf'],state='conflict')
put(r,'amount',{'2026Recipients':2,'eachUSD':2500,'savedInputLabel':'3 - $1,000','paidDirectToInstitutionAfterEnrollmentVerification':True,'savedVsSourceDifferenceHeld':True},['rise','risepdf'],state='unverified')
put(r,'affiliation',{'parent':'current eligible employee OR child/legal dependent of current employee','PDF':'current associated-business employee OR employed by GRG within one year before application OR child/legal dependent of eligible associated-business employee','PDFFinalQualifier':'eligible employee must be employed by employer at application','unresolvedScope':True},['rise','risepdf'],state='conflict')
put(r,'minimumGPA',{'minimum':3.5,'basis':'highschool or currentcollege','scale':None},['risepdf'])
put(r,'materials',{'transcriptUpload':True,'recommendations':[{'from':'current/former teacher/professor/instructor','writtenWithinYears':2},{'from':'current/former employer/community-involvement supervisor','writtenWithinYears':2}],'referencesUploadThemselvesByDeadline':True,'applicantDoesNotUploadLetters':True,'essayCount':3,'essayTopics':['special attributes/accomplishments','short/long goals and relation to college education','volunteering choices,reasons and effect on life'],'completedOnlineApplication':True,'enrollmentProofForFunds':True,'lateApplicationsNotAccepted':True},['risepdf'])
put(r,'application',{'onlineFoundationPortalUnvisited':True,'noFormInteraction':True},['risepdf'])

for row in [360,361]:
 r=rec(row,['nths'],'Reconcile exact named NTHS child against provider-redacted title; retain unassigned selected profile separately, never map by position/acronym/adjacency alone. Account query remains hash-bound unvisited locator.',status='held-identity')
 put(r,'identityObservation',{'queuedName':r['recordedName'],'titleProviderRedacted':True,'mapping':'held; exact named identity not independently established','sourceVariantNotAcceptedAsQueuedAward':True},['nths'],state='unverified')
 if row==360:
  put(r,'unassignedSourceProfile',{'providerRedactedTitle':True,'activeNTHSMembersOnly':True,'oncePerCycle':True,'yearlessWindow':['09-01','05-01'],'yearlessAwardDay':'05-15','recipients':275,'USD':1000,'notAssignedToQueuedName':True},['nths'],state='unverified',scope='Unassigned redacted source profile only; no queued-award fact mapping')
 else:
  put(r,'unassignedSourceProfile',{'providerRedactedTitle':True,'NTHSAlumni':True,'eligibleAfterGraduationMonths':6,'lifetimeAccessToApply':True,'yearlessWindow':['09-01','05-01'],'recipients':5,'USD':1000,'notAssignedToQueuedName':True},['nths'],state='unverified',scope='Unassigned redacted source profile only; no queued-award fact mapping')

r=rec(362,['soroptimist'],'Reconcile exact Soroptimist Certificate child,women/enrolled-or-considering certificate-instead-of-degree,once-only/yearlessAugust1-September15;publicform remains locator with no amount/fullmaterials/currentcycle inference.')
put(r,'identityObservation',{'namedChild':'Certificate Scholarships','mapping':'proposed; held'},['soroptimist'])
put(r,'cycle',{'yearlessWindow':['08-01','09-15'],'year':None,'timezone':None},['soroptimist'],state='unverified')
put(r,'eligibility',{'women':True,'enrollmentOR':['currently enrolled','considering enrolling'],'certificateInsteadOfDegree':True,'examplesOnly':['cosmetology','massage','other certification programs']},['soroptimist'])
put(r,'reapplication',{'applyOnlyOnceForAid':True},['soroptimist'])
put(r,'application',{'formLinkObserved':True,'unvisited':True,'fullRequirementsUnknown':True},['soroptimist'])

r=rec(363,['bluecollar'],'Reconcile paused/TBD/fall2026hint versus historicalfall2025 rules and annualNovember wording;3.0,lastschooltranscript/acceptance/accreditation/fulltime/US-or-studentvisa/GED/trade restrictions remain historical,not future/open.')
put(r,'identityObservation',{'namedProgram':'Blue Collar Brain Scholarship Program','mapping':'proposed; held'},['bluecollar'])
put(r,'cycle',{'pageStatus':'paused','applicationStatus':'closed','dates':'TBD','relaunchHint':'fall2026','historicalEnrollment':'fall2025','historicalPayment':'fall2025','annualOpeningWording':'November','futureCycleUnverified':True},['bluecollar'],state='unverified')
put(r,'amount',{'historicalRecipients':1,'USD':2500,'paidToSchoolWhenRequiredForFall2025':True},['bluecollar'])
put(r,'eligibility',{'historicalFall2025Only':True,'statusOR':['US citizen','student visa'],'educationOR':['high school graduate','GED'],'fullTimeEnrolledOrPlanned':['vocational/technical school','2-year college'],'skilledTradeCertificationOrDegree':True,'accreditedSchoolProofRequired':True,'sponsorMayExcludeNotTradeSpecific':True},['bluecollar'])
put(r,'minimumGPA',{'historicalMinimum':3.0,'basis':'last school attended','scale':None},['bluecollar'])
put(r,'materials',{'historicalAcceptanceLetter':True,'officialTranscriptLastSchool':True,'proofEnrollment':True,'onlineApplicationOnly':True},['bluecollar'])

r=rec(364,['bold'],'Reconcile Bold advertised allstudents/anyGPA/openOctober31,2026/rollingmonthly/December1 award;profileboldness/earlypreference,noessay;public sponsor/routeapplicability remains held and account not entered.')
put(r,'identityObservation',{'namedChild':'$25,000 Be Bold No-Essay Scholarship','mapping':'proposed; held'},['bold'])
put(r,'cycle',{'advertisedStatus':'open','deadline':'2026-10-31','rollingMonthlyDeadlines':True,'announced':'2026-12-01','timezone':None},['bold'],state='unverified')
put(r,'amount',{'USD':25000,'historicalWinnersAndFinalistsNotAwardCount':True},['bold'])
put(r,'eligibility',{'advertisedAllStudents':True,'advertisedAny':['education level','state','field of study','GPA'],'profileSelection':['earnest','determined','moving'],'earlierApplicantsFavored':True},['bold'])
put(r,'minimumGPA',{'advertisedAnyGPA':True},['bold'])
put(r,'materials',{'noEssayAdvertised':True,'BoldProfileRequiredForSelection':True,'fullAccountTermsUninspected':True},['bold'])
put(r,'application',{'externalRegistrationLocatorOnly':True,'notEntered':True},['bold'])

r=rec(365,['um','army'],'Reconcile exact GrizzlyBattalion local award identity after unexpectedUMexternal redirect;keep nationalArmyROTC rules as national-only variants,not local eligibility;class/schoolyear/deadlines/GPA-age/PFA/service/duration remain scoped;no recruitercontact/account.')
put(r,'identityObservation',{'queuedGrizzlyBattalionIdentity':'held','UMUnexpectedExternalRedirect':True,'nationalArmyROTCPageNotLocalAwardProof':True},['um','army'],state='unverified')
put(r,'nationalProgramEligibility',{'nationalOnlyNotTransferred':True,'USCitizen':True,'minimumAge':17,'mustBeUnderAgeInCommissioningYear':31,'HSDiplomaOrEquivalent':True,'SATorACT':True,'HSApplicantsUnweightedGPAMinimum':2.5,'PFAthenAFTOnContractCompletion':True,'waistToHeightStandards':True,'acceptCommissionAndService':True,'stageOR':['high school after junior year','college student','active-duty enlisted soldier']},['army'],state='unverified',scope='National Army ROTC program only; local GrizzlyBattalion identity/applicability held')
put(r,'nationalProgramCycle',{'open':'2026-06-14','mustStartBy':'2027-03-04','roundDeadlines':['2026-10-12','2027-01-18','2027-03-08'],'reviewWindows':[['2026-10-19','2026-10-23'],['2027-01-25','2027-01-29'],['2027-03-15','2027-03-19']],'pageClassLabel':'High School Class of2027','pageSchoolYearLabel':'2026-2027','timezone':None,'localApplicability':None},['army'],state='unverified',scope='National program labels only; class/school-year ambiguity retained')
put(r,'nationalProgramFunding',{'tuitionFeesOrRoomBoard':True,'monthlySchoolYearExpenseUSD':420,'annualBooksUSD':1200,'collegeScholarshipYears':[4,3,2],'fourYearMostCommonForFiveYearPlan':True,'twoYearCommonCertainCommunityCollegeTransfers':True,'nationalOnlyNotTransferred':True},['army'],state='unverified')
put(r,'nationalProgramObligation',{'futureServiceYears':8,'activeReserveGuardDependsOnScholarship':True,'mayQualifyPartTimeService':True,'exitAfterFreshmanYearWithoutObligationAdvertised':True,'localApplicability':None},['army'],state='unverified')
put(r,'application',{'nationalHighSchoolAccountUnvisited':True,'recruitingOfficerContactNotPerformed':True,'nationalFitnessDocumentsDeferred':True,'localRouteUnknown':True},['army'],state='unverified')

records.sort(key=lambda r:r['rowLocator'])
fields=sum(len(r['fieldProposals']) for r in records);priorfields=sum(len(r['fieldProposals']) for p in prior for r in p['records'])
ledger=dict(schemaVersion=1,scope='One bounded local SD2 held-research checkpoint018; no canonical acceptance',entryCommit=ENTRY,queueSha256=sha((B/'queue.json').read_bytes()),queueOffsetStart=340,queueOffsetEndExclusive=360,orderedInputKeys=[r['inputKey'] for r in records],records=records,sourceRegistry=sources,acceptedFacts=0,researchComplete=True,researchCompleteMeaning='Twenty initial held dispositions only; full SD2 incomplete',independentReview='Pending immutable candidate review; final review.json controls',completedAt=now(),fullSD2Complete=False,canonicalAcceptance=False,SD3Started=False,coverage=dict(checkpointInputs=20,fieldEnvelopes=fields,sourceReceipts=len(sources),newPublicRetrievals=len(sources),nativeReadableRetrievals=0,nativeMetadataRetrievals=0,outcomes=dict(collections.Counter(r['outcome'] for r in records)),cumulativeInitialDispositions=360,cumulativeAutonomousHeldFields=priorfields+fields,cumulativeAutonomousHeldIdentities=360,unprocessedInputs=46),nextCheckpointInputOffset=360,nextInputKey=q['records'][360]['inputKey'],priorHolds={'unchangedPaths':[f'docs/evidence/sd2-autonomous/checkpoint-{i:03d}.json' for i in range(1,18)],'fields':priorfields,'identities':340,'allEarlierPacketsPRELUDESection9M1Routes':'byte-preserved; original owners/triggers/actions'},preservedGates=prior[-1]['preservedGates'],sourcePolicyDeviations=load(P/'capture-metadata.json')['sourcePolicyDeviations'],limits=['Selected conversions only; no raw/original/native/page/image/table/form completeness, source silence, current/public/sponsor/route continuity or independent original fidelity.','First AWS interval is unmeasured; other18 intervals are client-call timing only. No independent provider execution telemetry.','UM unexpected external redirect held; no new-host follow-up or generic scholarship transfer.','GPT research review never accepts facts/identities or authorizes SD3.'])
write(B/'checkpoint-018.json',ledger);write(P/'source-receipts.json',sources)
measured=[s for s in sources if s['callStartedAt']];events=[];overlaps=[]
for s in measured:events.extend([(s['callStartedAt'],1),(s['callCompletedAt'],-1)])
active=peak=0
for _,d in sorted(events):active+=d;peak=max(peak,active)
host=lambda s:urllib.parse.urlsplit(s['originalUrl'] or 'https://umontana.edu').hostname.lower().removeprefix('www.')
for a,b in itertools.combinations(measured,2):
 if host(a)==host(b) and max(a['callStartedAt'],b['callStartedAt'])<min(a['callCompletedAt'],b['callCompletedAt']):overlaps.append([a['sourceId'],b['sourceId']])
write(P/'concurrency-audit.json',dict(measuredReads=len(measured),maximumMeasuredConcurrentReads=peak,measuredSameHostOverlaps=overlaps,firstAWSIntervalUnmeasured=True,firstReadSequentialBeforeOthers=True,independentProviderTelemetry=False,historicalCheckpoint016OverlapUnchanged=True,owner='Codex source execution',trigger='Before every subsequent dispatch',nextAction='Normalize hostname, await samehost completion, at most4 distinct hosts globally; never relabel historical overlap.'))
cust=copy.deepcopy(load(B/'checkpoint-017/prior-custody-audit.json'));gaps=[]
for pin in cust['pins']:
 p=Path(pin['path']);pin['observedSha256']=sha(p.read_bytes()) if p.exists() else None
 if pin['observedSha256']!=pin['recordedSha256']:gaps.append(pin['path'])
cust.update(recordedAt=now(),gaps=gaps,scope='Hash-only original temporary custody; no content reinspection/reacquisition/reconstruction/replay')
write(P/'prior-custody-audit.json',cust)
print(json.dumps(ledger['coverage'],indent=2));print('Next',ledger['nextInputKey'])
