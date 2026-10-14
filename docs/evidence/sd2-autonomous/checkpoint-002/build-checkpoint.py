"""One-time local packet construction from inspected receipts; no network or acceptance."""
from pathlib import Path
import datetime, hashlib, json, subprocess
P=Path(__file__).resolve().parent; ROOT=P.parents[3]
target=P.parent/'checkpoint-002.json'
if target.exists(): raise SystemExit('Refusing overwrite of recorded checkpoint; edit explicitly, never reset progress.')
def sha(b): return hashlib.sha256(b).hexdigest()
def load(p): return json.loads(p.read_text())
def dump(p,o): p.write_text(json.dumps(o,indent=2,ensure_ascii=False)+'\n')
now=datetime.datetime.now(datetime.timezone.utc).isoformat()
q=load(P.parent/'queue.json'); old=load(P.parent/'checkpoint-001.json')
sources=load(P/'source-receipts.json')+load(P/'native-receipts.json')
for sid in ['ffa','rh-alias']:
 s=dict(next(s for s in old['sourceRegistry'] if s['sourceId']==sid))
 s['reusedFrom']='docs/evidence/sd2-autonomous/checkpoint-001.json'
 s['reuseReason']='Applicable same-day parent-route evidence only; no named-child eligibility/offering inferred.'
 sources.append(s)
for s in sources:
 s['artifactSha256']=sha((ROOT/s['artifactPath']).read_bytes())
 s.setdefault('owner','Codex research/proposals')
 s.setdefault('sourceScope','Selected source text; identity/current applicability held')
 s.setdefault('extractionLimits','Sanitized selected text; no rendered HTML or whole-site completeness claim')
 if s['sourceId'] in ['memorial','sokn','sokn-overview','sobba','wai','wai-2027','gianforte-fact','gianforte-dash']:
  f={'wai':'wai','wai-2027':'wai-2027','gianforte-fact':'gianforte'}.get(s['sourceId'],s['sourceId'])
  raw=Path('/private/tmp/sd2-002-work')/(f+'.pdf')
  s['originalBytesSha256']=sha(raw.read_bytes()); s['originalBytes']=raw.stat().st_size
  pages={'memorial':2,'sokn':1,'sokn-overview':1,'sobba':2,'wai':10,'wai-2027':10,'gianforte-fact':1,'gianforte-dash':1}[s['sourceId']]
  inspected={'wai':[1,3,4,5,6,8,9,10],'wai-2027':[1,2]}.get(s['sourceId'],list(range(1,pages+1)))
  s['pageCount']=pages; s['visuallyInspectedPages']=inspected
  s['renderSha256']={str(p):sha((raw.parent/(f+'-'+(str(p).zfill(2) if pages==10 else str(p))+'.png')).read_bytes()) for p in inspected}
  s['extractionLimits']='Full PDF page count verified locally. All relevant selected program pages visually inspected; unrelated scopes omitted. WAI2027 retains general cover/index only; no named-child absence or whole-catalog completeness claim. Native scans manually transcribed, accents/quotes normalized. Original raw PDF/renderings temporary only.'
registry={s['sourceId']:s for s in sources}
fields=['amount','minimumGPA','gpaBasis','schoolType','residency','membership','needRequirement','needPriority','renewability','gapYears','deadline','applicationWindow','cycle','applicationMethod','materials','identityContinuity','currentOffering']
records=[]
for src in q['records'][20:40]:
 r={k:src[k] for k in ['inputKey','rowLocator','recordedName','publicIdCandidates','identityAcceptance']}
 r.update(outcome='researched-held',fieldProposals={},owner='Codex source/identity reconciliation',trigger='Applicable authorized evidence arrival or SD2 consolidation after initial queue coverage',nextAction='Reconcile each held identity/material field; preserve unknowns and existing human/canonical acceptance gates.',interviewCoverage='No runtime change. Existing school/GPA/criteria controls may represent supported proposals only after acceptance; unknown current identity/cycle prevents exclusion. Other material/supplement limits remain review notes.')
 for f in fields:
  r['fieldProposals'][f]={'value':None,'state':'unverified','acceptance':'held','sourceScope':'Current named award applicability unresolved','observedAt':now,'sourceRevision':None,'freshness':'Current applicability is not inferred from retrieval or historical document','evidence':[],'note':'Unsupported/unknown remains non-excluding; source silence is not false/unrestricted.'}
 records.append(r)
byrow={r['rowLocator']:r for r in records}
def put(row,field,value,sid,excerpt,scope,state='verified',note=None):
 s=registry[sid]; assert excerpt in (ROOT/s['artifactPath']).read_text(),(row,field,excerpt)
 f={'value':value,'state':state,'acceptance':'held','sourceScope':scope,'observedAt':s.get('observedAt',s.get('retrievedAt',now)),'sourceRevision':s.get('sourceRevision'),'freshness':'Observed source scope only; current named-award applicability separately held','evidence':[{'sourceId':sid,'sourceUrl':s.get('originalUrl',s.get('requestedUrl')),'artifactSha256':s['artifactSha256'],'locator':scope+' / '+field,'excerpt':excerpt}]}
 if note:f['note']=note
 byrow[row]['fieldProposals'][field]=f
for row in [21,23]:
 byrow[row]['outcome']='held-identity'
 byrow[row]['nextAction']='Verify named child/sponsor continuity from applicable official evidence; saved parent/application aliases do not bind this identity.'
 put(row,'applicationMethod',{'parentRouteCandidate':'shared Reach Higher application','namedChildBinding':None},'ffa' if row==21 else 'rh-alias','One application will work for any FFA Scholarship' if row==21 else 'One Application, Mutiple Scholarships.','Parent route only; no named Stockman/Peck eligibility or current-offering claim',state='unverified')
for row in [26,41]:
 byrow[row]['outcome']='held-access'
 byrow[row]['nextAction']='Retain historical Kaleidoscope application locator; inspect only separately available official public criteria under POLICY; no application/login interaction.'
 byrow[row]['fieldProposals']['applicationMethod']['note']='Seed is application-action/portal route, retained without fetching under policy. No transport or login failure claimed.'
put(22,'materials',{'supplemental':['transcripts','standardized test scores','tax forms'],'officialCopiesIfAwarded':True,'completeCurrentChecklist':None},'louie','All supplemental application materials, including transcripts, standardized test scores, and tax forms','2026-titled application page; disabled form; partial instructions only')
put(22,'applicationMethod',{'formStatus':'disabled','functionalSubmissionVerified':False},'louie','This form has been disabled by the owner.','Retrieved public application text; no form interaction')
byrow[22]['outcome']='held-access'; byrow[22]['nextAction']='Reconcile current public cycle/eligibility and complete materials; disabled form never becomes closed award or completed submission.'
put(24,'minimumGPA',3.0,'wells','minimum grade point average of 3.0 on a 4.0 scale or its equivalent.','Tentative 2026 entry terms; not renewal')
put(24,'gpaBasis',{'scale':4.0,'equivalentAllowed':True,'weighted':None,'entryCumulative':None},'wells','minimum grade point average of 3.0 on a 4.0 scale or its equivalent.','Entry GPA; weighted/cumulative basis not established')
put(24,'disabilityCriterion',{'required':True,'longTermOrRecurring':True},'wells','Have an identified disability','Tentative 2026 source eligibility')
put(24,'schoolType',{'accreditedUSCollege':['two-year','four-year'],'undergraduate':True,'enrollment':['full-time','half-time'],'minimumCreditsPerTerm':6},'wells','full-time or half-time (at least 6 credits per term) undergraduate study at an accredited two-year or four-year college or university in the United States','Tentative 2026 undergraduate entry')
put(24,'residency',{'status':['US citizen','legal resident'],'currentlyResiding':'USA'},'wells','Be a US citizen or legal resident currently residing in the USA.','Tentative 2026 eligibility')
put(24,'studentStage',['high school senior','high school graduate','current postsecondary undergraduate'],'wells','Be a high school senior or graduate or a current postsecondary undergraduate','Tentative 2026 initial award')
put(24,'amount',{'currency':'USD','fullTime':2500,'halfTime':1250},'wells','$2,500 award for full-time study or a $1,250 award for half-time study.','Tentative 2026 entry amount')
put(24,'renewability',{'fullTimeAdditionalYears':3,'halfTimeAdditionalYears':7,'halfTimeEndsAtBachelors':True,'yearsBasedOnInitialGraduationAndGrade':True},'wells','Full-time student awards may be renewed for up to three (3) additional years and half-time student awards may be renewed for up to seven (7) years or until a bachelor’s degree is earned, whichever occurs first.','Tentative 2026 contingent renewal')
put(24,'renewalGPA',{'minimum':2.5,'scale':4.0,'basis':'cumulative','equivalentAllowed':True},'wells','Renewal is contingent upon maintaining a cumulative grade point average of 2.5 on a 4.0 scale or the equivalent.','Renewal only; never entry threshold')
put(24,'needRequirement',True,'wells','Financial need as calculated by Scholarship America must be demonstrated for the student to receive an award.','Tentative 2026 need required; not priority alone')
put(24,'applicationLimit',{'firstCompletedApplicationsConsidered':700},'wells','Only the first 700 completed applications received will be considered.','Applications not recipient slots')
put(24,'applicationWindow',{'reportedStatus':'closed','opening':None,'deadline':None,'programInformation':'tentative 2026'},'wells','Information for the 2026 program is tentative and subject to change.','Provider cached October13 page observed October14; no future-cycle extrapolation')
put(24,'materials',{'transcript':'current complete; grade reports not accepted; names/school/grades/credits/terms required','essayPrompt':'What life experiences have shaped who you are today?','testScores':'official SAT/ACT copy if provided and absent from high-school transcript; not required with college transcript','submission':'all required documents electronically','email':'active personal, avoid school/work'},'wells','Your application is not complete unless all required documents are submitted electronically.','Tentative 2026 full selected eligibility/requirements/notification scope')
put(25,'amount',{'currency':'USD','fullTimePerSemester':1500,'partTimePerSemester':750},'gianforte','receive $1,500 for full-time or $750 for part-time enrollment.','Observed program page; no named academic year')
put(25,'needRequirement',{'required':True,'formula':'Cost of Attendance minus SAI minus other aid except loans'},'gianforte','Have Unmet Need (Cost of Attendance minus Student Aid Index SAI minus other aid except','Program requirements; loans excluded from other-aid subtraction')
put(25,'materials',{'FAFSA':'required except dual credit','completePortalApplication':True,'minimumEnrollmentCredits':6,'goodStanding':'SAP at qualifying campus'},'gianforte','File a FAFSA (dual credit students are not required to file a FAFSA)','Observed requirements; no portal interaction')
put(25,'residency',{'MontanaResident':True,'policy':'940.1 definition not independently inspected'},'gianforte','Must be a resident of the state of Montana','Program requirement; sponsor location not substituted')
put(25,'renewability',{'maximumEquivalentFullTimeSemesters':4,'maximumPartTimeSemesters':8,'mixedAwardsAllowed':True},'gianforte','may not receive more than the equivalent of 4 semesters full-time or 8 semesters part-time','Program aggregate enrollment cap; contingent upon requirements')
put(25,'deadline',{'fall':{'month':9,'day':1,'year':None},'spring':{'month':2,'day':1,'year':None},'timezone':None},'gianforte','Fall semester - September 1','Yearless semester deadlines; spring February1 in same artifact; no future date created')
put(25,'schoolType',{'qualifyingCampusProgramResolution':None,'minimumCredits':6,'enrolledDuringAppliedTerm':True,'posterVariants':['Gianforte_Trade_Tech_FACT_SHEET.pdf','Gianforte_Trade_Tech_FACT-SHEET.pdf']},'gianforte','Applicants must be currently enrolled during the term they are applying for.','Program enrollment supported; exact campus/program lists conflict',state='conflict',note='Underscore includes FVCC Electrical Apprentice; dash includes Building Trades instead, plus other campus differences. No source selection, union/intersection or current applicability inferred; reconcile scope/version under POLICY.')
for sid,excerpt in [('gianforte-fact','•Electrical Apprentice'),('gianforte-dash','•Building Trades')]:
 s=registry[sid];byrow[25]['fieldProposals']['schoolType']['evidence'].append({'sourceId':sid,'sourceUrl':s['originalUrl'],'artifactSha256':s['artifactSha256'],'locator':'Visually inspected FVCC program column; unresolved variant conflict','excerpt':excerpt})
byrow[25]['nextAction']='Reconcile both official poster variants against exact current qualifying campus/program/version evidence; no newer-date source choice or merged list.'
put(25,'posterMaximum',{'currency':'USD','maximumTotal':6000},'gianforte-fact','Renewable up to $6,000.','Poster qualifications/complete campus columns inspected; no year verified')
put(27,'sourceNamedAwards',['Wayde Davis Family','Kim Dowaliby','Pam Fredenberg','Jim Withrow','Stefanie Daily','Tracy Maddux'],'memorial','MEMORIAL SCHOLARSHIP APPLICATION','Undated scanned shared application; aggregate identity held')
put(27,'studentStage','graduating WHS senior with committee discretion','memorial','Student must be a graduating WHS senior. (Selection committee has discretion in certain situations).','Undated document')
put(27,'needPriority',{'considered':True,'otherFactors':['scholarship','extracurricular','citizenship'],'ranking':'any order'},'memorial','Scholarship selection will be based on financial need, scholarship, extra-curricular activities and citizenship in any order.','Undated selection; not demonstrated-need eligibility')
put(27,'amount',None,'memorial','The amount of the scholarship is yet to be determined','Explicit undetermined amount',state='unstated')
put(27,'deadline',{'month':4,'day':16,'year':None,'timezone':None},'memorial','Deadline: April 16','Undated deadline; no assumed 2027 cycle')
put(27,'materials',{'transcript':True,'completeBlankApplication':True,'financialNeedsAndGoalsStatements':True,'experienceActivitiesHonors':True,'otherScholarshipsDisclosure':True,'registrationVerification':'August before disbursement'},'memorial','Transcript must be attached to application','Both pages inspected; personal/household prompts blank; no submissions')
byrow[27]['outcome']='held-identity'; byrow[27]['nextAction']='Reconcile aggregate public-ID candidate to six named awards/shared application without new seeds or merging; confirm source authority and current cycle.'
put(28,'amount',{'currency':'USD','perRecipient':3000},'sokn-overview','$3,000 scholarship','Historical 2024 overview')
put(28,'studentStage',{'female':True,'graduatingFrom':'Whitefish High School'},'sokn-overview','graduating female student from Whitefish High School','Historical 2024 eligibility')
put(28,'focus','STEM','sokn-overview','Science, Technology, Engineering or Math','Historical2024; current eligibility unverified')
put(28,'deadline',{'date':'2024-04-26','timezone':None},'sokn-overview','April 26, 2024.','Historical2024 counselor deadline')
put(28,'applicationMethod','Guidance Counselor','sokn-overview','A scholarship application may be obtained from your Guidance Counselor.','Historical2024 obtain/return counselor route')
put(28,'materials',{'essayMaxWords':300,'essayTopic':'what women in STEM means to you','failureReflection':True,'completeApplication':True,'signatureAndDate':True,'GPA':'requested without numeric threshold','activitiesAndMajor':True},'sokn','Please attach a brief essay (300-word max) discussing what women in STEM means to you.','2024-titled blank scanned application; whole page inspected')
put(29,'sourceNamedProgram','David Sobba Memorial Scholarship','sobba','DAVID SOBBA MEMORIAL SCHOLARSHIP:','Undated file; saved Davide name differs; candidate continuity held')
put(29,'amount',{'currency':'USD','perRecipient':1000},'sobba','Amount: $1000','Undated historical document')
put(29,'minimumGPA',3.0,'sobba','Minimum GPA: 3.0','Undated entry minimum; scale/basis unknown')
put(29,'needRequirement',False,'sobba','Financial need is not required.','Explicit document rule; no current applicability accepted')
put(29,'studentStage','high school seniors in Whitefish community','sobba','Open to high school seniors in the community of Whitefish','Undated community/student stage')
put(29,'schoolType',['4-year','2-year','technical'],'sobba','further education in a 4-year, 2-year or technical school.','Undated destination-school rule')
put(29,'materials',{'application':True,'transcript':True,'essayMinWords':300,'essayChooseOneOf':3,'recommendationLetters':2,'essayQualitySelection':True,'GPAAndClassRank':True},'sobba','minimum of 300 words and 2 letters of recommendation.','Both blank scan pages inspected; undated instructions')
byrow[29]['nextAction']='Resolve David/Davide identity spelling and native public/sponsor provenance; current named fund not corroborated by historical WEF parent; retain undated facts and GPA basis/date gaps.'
# WAI source is historical2025. Current2027 general pages never establish these named children.
waiRows={30:('Alaska Airlines/Horizon Air Maintenance',5000,3),31:('Bunny M. Connors',979.82,8),32:('Christine Reed',2500,8),33:('Delta Air Lines Aircraft Maintenance Technology',5000,4),34:('Delta Air Lines Pilot',5000,8),35:('Delta Air Lines Propel Pilot',5000,6),36:('Flexjet Aircraft Maintenance',2000,4),37:('Level Up Aviation General',1000,5),38:('The Dorothy Thompson/Tampa Bay',1500,9),39:('WAI Atlanta',1000,10)}
wai=(ROOT/registry['wai']['artifactPath']).read_text()
for row,(name,amount,page) in waiRows.items():
 put(row,'amount',{'currency':'USD','value':amount,'basis':'credit at Tampa Bay Aviation' if row==38 else 'scholarship value'},'wai',('$979.82' if row==31 else '$'+format(amount,',')),'Historical WAI2025 named child, PDF page'+str(page))
 put(row,'membership',{'WAI':True,'byDate':'2024-10-01'},'wai','you must be a WAI member by October 1, 2024','Historical2025 common application minimum')
 put(row,'deadline',{'date':'2024-10-11','time':'23:59','timezoneLiteral':'EST','timezoneInterpretation':None},'wai','Applications are due October 11, 2024','Historical2025 common deadline; literal EST not silently converted')
 put(row,'cycle','WAI2025','wai','WAI2025 scholarship cycle','Historical cycle only; offering now unknown')
 put(row,'currentParentWindow',{'program':'WAI2027 general','reportedStatus':'closed','childBinding':None},'wai-current','WAI2027 Scholarship applications are now closed.','Current parent only; no named child opens/closes inferred')
 put(row,'currentParentMembershipConflict',{'earlierWording':'no later than March30,2027','laterWording':'March30,2027 or later','resolution':None},'wai-how','expiration date no later than March 30, 2027','2027 general source contradicts itself and guide; named-child binding unresolved',state='conflict')
 put(row,'currentParentMaterials',{'recommendations':2,'essayWords':500,'resumeMaxPages':2,'flightOnly':['pilot certificate','medical certificate','last3 logbook pages'],'fileMaxMB':5,'otherChildRequirements':'as requested','childBinding':None},'wai-how','These requirements are the minimum for all scholarships unless otherwise indicated.','Current2027 parent requirements; not applied retroactively to2025 children')
 byrow[row]['nextAction']='Reconcile current exact named child/sponsor/route evidence within policy. Reuse2025 facts as historical only;2027 cover/index and parent closure do not prove child discontinuation or current terms. Keep membership wording conflict and any unvisited requirements held.'
put(30,'eligibility',{'femaleMechanic':True,'pursuing':'A&P certification','goal':'mechanic for Alaska Air Group','program':['accredited aviation maintenance','Alaska Maintenance Technician Development'],'standing':'good'},'wai','Applicants must be students enrolled in an accredited','Historical2025 child page3')
put(30,'recipientSlots',1,'wai','Alaska Airlines will award one $5,000 scholarship','Historical2025 child; slots distinct from award count')
put(31,'focus',['private pilot certificate','instrument rating'],'wai','pursuing a private pilot certificate or instrument rating','Historical2025 child page8')
put(31,'trainingUseLimit','within one year of receipt','wai','Flight\ntraining must be completed within one year','Historical2025 child page8')
put(32,'eligibility',{'women':True,'ageRange':[16,30],'soloWithinMonths':6,'certificates':['recreational','sport','private'],'advancedRatings':'may be considered based on applicant pool'},'wai','ages 16-30 that have soloed within the last six months','Historical2025 child page8')
put(32,'residencyPriority',['New Jersey','Illinois','Arizona'],'wai','Preference will be given to New Jersey, Illinois, and Arizona residents but all','Historical2025 preference; not hard residence restriction')
put(32,'materials',{'soloEndorsement':True,'additionalEssayPages':[1,2],'topic':'Why I Love to Fly','generalWAIRequirements':'referenced;2025 complete checklist unresolved'},'wai','provide a copy of their solo endorsement with the application.','Historical2025 child; supplemental essay distinct from general essay')
put(33,'minimumGPA',3.0,'wai','cumulative 3.0 GPA or better','Historical2025 child page4; scale not stated')
put(33,'eligibility',{'fullTime':True,'program':['AMT A&P','aviation maintenance technology degree'],'status':['US citizen','eligible non-citizen']},'wai','a U.S. citizen or\neligible non-citizen.','Historical2025 child page4')
put(34,'eligibility',{'intendedFor':'women pursuing professional airline pilot career','training':['instrument','commercial','CFI','CFII','MEI','primary certificates']},'wai','working toward their instrument, commercial, CFI, CFII, MEI, and primary certificates.','Historical2025 pilot child page8; distinct from Propel')
put(34,'trainingUseLimit','within one year; paid directly to flight school','wai','training must be completed within a year.','Historical2025 child page8')
put(35,'eligibility',{'currentlyInDeltaPropel':['collegiate','company','community partner'],'intendedFor':'women pursuing professional airline pilot career'},'wai','currently participating in Delta’s Propel Program','Historical2025 Propel child page6')
put(35,'recipientSlots',2,'wai','Delta Air Lines will award two $5,000 scholarships','Historical2025 Propel; not two distinct awards')
put(36,'minimumGPA',3.0,'wai','GPA must be 3.0 or higher','Historical2025 child page4; scale/basis unknown')
put(36,'eligibility',{'program':'accreditedUSmaintenance AMT A&P or degree','status':['US citizen','permanent resident']},'wai','accredited U.S. maintenance program, U.S. citizen or permanent resident.','Historical2025 child page4')
put(36,'recipientSlots',1,'wai','Flexjet will award one $2,000 scholarship','Historical2025 child page4')
put(37,'focus',['maintenance','ATC','scheduling','engineering','other aviation career'],'wai','related career (maintenance, ATC, scheduling, engineering, etc)','Historical2025 child page5')
put(37,'schoolType','certification or degree program','wai','must be enrolled in a certification or degree program.','Historical2025 child page5')
put(37,'fundingPurpose','economically disadvantaged/underrepresented groups; no explicit individual need threshold inferred','wai','economically disadvantaged and underrepresented groups','Historical2025 organizational purpose; not needRequirement')
put(38,'eligibility',{'training':['fixed-wing','rotorcraft','private','commercial','instrument'],'creditAt':'Tampa Bay Aviation','examAndOtherFees':'recipient responsibility','rentalOnlyUse':False},'wai','cannot simply be \nused for aircraft rental.','Historical2025 child page9')
put(38,'recipientSlots',1,'wai','offering one scholarship to a WAI member','Historical2025 child page9')
put(39,'membershipPriority','Atlanta Chapter preference; all applicants considered','wai','Preference will be given to members of the Atlanta Chapter, but all applicants','Historical2025 child page10; not chapter restriction')
put(39,'materials',{'essayWords':500,'include':['aviation dream','effect of scholarship','where funds used','goal timeline'],'followDirections':True,'generalWAIRequirements':'2025 complete checklist unresolved'},'wai','Within the required 500-word essay include the details of your aviation dream','Historical2025 child page10')
put(39,'trainingUseLimit','within one year; paid to organization','wai','Applicants\nmust use funds within one year of acceptance.','Historical2025 child page10')
# Every selected seed/alias accounted without crawling login/application routes.
for r,seed in zip(records,q['records'][20:40]):
 r['seedDispositions']=[{'url':u,'disposition':('application/login locator only; not fetched' if any(x in u for x in ['grantinterface.com','apply.mykaleidoscope.com','https://awardmontana.mus.edu/']) and '/documents/' not in u else 'Exact source or pinned alias inspected/reused as recorded in sourceRegistry; unresolved identity/current cycle held')} for u in dict.fromkeys(seed['recordedSeedUrls']+seed['publishedSourceAliases'])]
result={'schemaVersion':1,'checkpoint':2,'entryCommit':'ec895940b0c93fcb063a357572504bcbe8e79648','queueSha256':sha((P.parent/'queue.json').read_bytes()),'queueOffsetStart':20,'queueOffsetEndExclusive':40,'orderedInputKeys':[r['inputKey'] for r in records],'records':records,'sourceRegistry':sources,'acceptedFacts':0,'researchComplete':True,'researchCompleteMeaning':'Twenty initial source dispositions; every record remains held. Portal-only records were not fetched. No fullSD2 or accepted-award claim.','independentReview':'pending frozen-candidate review','completedAt':now,'fullSD2Complete':False,'SD3Started':False,'coverage':{'frozenInputs':406,'checkpointInputs':20,'cumulativeInitialDispositions':40,'unprocessedInputs':366,'heldIdentities':20,'acceptedFacts':0,'distinctAcceptedAwards':None,'sourceReceipts':len(sources),'fieldEnvelopes':sum(len(r['fieldProposals']) for r in records)},'nextCheckpointInputOffset':40,'nextInputKey':q['records'][40]['inputKey'],'priorHeldFieldsAndIdentities':'checkpoint-001.json unchanged; all344 fields/20 identities retain evidence-arrival/consolidation trigger','sourcePolicyDeviation':{'url':'https://www.stockmanbank.com/community/scholarships','finalUrl':'https://www.stockmanbank.com/about-us/community/scholarships','observedStatus':404,'reason':'Author guessed an unpinned sponsor route before inspecting selected seeds','disposition':'Excluded from sourceRegistry and every factual proposal; no retry/search/follow-up. Subsequent reads grounded in frozen seeds or inspected links. Review must assess deviation; cannot undo historical request.','owner':'Codex author','trigger':'every subsequent read','nextAction':'Validate exact selected seed/alias or depth-two observed link before request'},'nativeMaterializationLimits':'Connector returned inline bytes despite raw-reference mode. Oversized JS payload refused by auto-review; smaller authenticated file-reference downloads succeeded through permitted curl. No token/bytes retained in durable packet.'}
dump(target,result)
print(json.dumps(result['coverage'],indent=2))
