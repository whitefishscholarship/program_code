"""One-time author assembly from already captured selected sources; never replay."""
from pathlib import Path
import json,hashlib,subprocess,datetime,re,collections
P=Path(__file__).resolve().parent; B=P.parent; ROOT=P.parents[3]
def load(p):return json.loads(p.read_text())
def sha(b):return hashlib.sha256(b).hexdigest()
def save(p,x):
 assert not p.exists(),str(p)
 p.write_text(json.dumps(x,indent=2,ensure_ascii=False)+'\n')
entry=load(P/'capture-inputs.json')['entryCommit'];q=load(B/'queue.json');target=B/'checkpoint-007.json'
assert not target.exists() and entry=='4a490a70f3be08b402439e9a92d0c4285762b787'
assert subprocess.check_output(['git','branch','--show-current'],cwd=ROOT).decode().strip()=='codex/plan-student-data-maintenance'
prior=[load(B/f'checkpoint-{i:03d}.json') for i in range(1,7)]
assert [k for c in prior for k in c['orderedInputKeys']]==[r['inputKey'] for r in q['records'][:120]]
now=datetime.datetime.now(datetime.timezone.utc).isoformat()
owner='Codex source/identity reconciliation';trigger='Applicable authorized evidence arrival or SD2 consolidation after initial remaining-queue coverage'
def route(action):return dict(owner=owner,trigger=trigger,nextAction=action)
# Remove only a contact value in the newly authored current packet before hashing.
f=P/'sources/luedke.md';f.write_text(f.read_text().replace('P.O. Box 1417 Whitefish, MT 59937','[mailing address omitted]'))
native=load(P/'native-downloads.json');inspection=load(P/'native-inspection.json')
for d in inspection:d['selectedTextSha256']=sha((ROOT/d['selectedTextPath']).read_bytes())
# This receipt is the assembled final inspection; original extraction receipt retained.
save(P/'document-inspection.json',{'recordedAt':now,'nativeDocuments':inspection,'publicDocuments':load(P/'public-downloads.json'),'safePageViews':load(P/'page-views.json'),'all14SelectedPageViewsInspected':True,'priorCustody':{'path':'docs/evidence/sd2-autonomous/checkpoint-007/prior-custody-audit.json','pins':41,'gaps':0},'limits':['Six DOCX files: complete body XML/tables inspected, zero embedded images; no page-render or other-package-part factual silence claim.','WET exact old/current raw downloads403; readable provider text only, no visual or current-byte proof. No repeat403 probing.','Native connected access does not establish public/sponsor authority; temporary artifacts only.','Ortho original PDF has no extractable text: two-page OCR plus both sanitized rendered rule views inspected.','Provider may serve indexed content; exact origin freshness/revision unknown.']})
parents={'jean-pdf':'jean','kiita-pdf':'kiita','coffee-pdf':'coffee','davis-faq':'davis','nths-scholarships':'byf','wet-pdf':'wet','rhino-pdf':'rhino'}
reg=[]
for m in load(P/'web-capture-metadata.json'):
 id=m['sourceId'];f=P/'sources'/(id+'.md');text=f.read_text();parent=parents.get(id)
 s=dict(m,originalUrl=m['url'],depth=1 if parent else 0,parentSourceId=parent,sourceRole='blank-program-document' if id.endswith('-pdf') or id=='wet-old' else 'selected-public-page',artifactPath=str(f.relative_to(ROOT)),artifactSha256=sha(f.read_bytes()),sourceScope='Sanitized selected program text; excluded scope cannot establish silence',linkDispositions=[])
 s.update(route('Reconcile exact selected program/source/version and every deferred material at this source path; preserve access/identity/freshness limits.'))
 # Every retained program-scope link gets one disposition; no broad directory crawl.
 urls=list(dict.fromkeys(re.findall(r'https?://[^\s<>\)]+',text)))
 for url in urls:
  url=url.rstrip('.,;');match=next((x['sourceId'] for x in load(P/'web-capture-metadata.json') if x['url']==url),None)
  disposition='inspected-selected-source' if match else 'locator-only-no-action' if any(x in url.lower() for x in ['grantinterface','kaleidoscope','awardspring','/byf-scholarship','bit.ly','dream.csac','studentaid','ope.ed']) else 'deferred-material-identity-or-scope-hold'
  s['linkDispositions'].append(dict(url=url,disposition=disposition,sourceIds=[match] if match else [],**route('Retain this exact link; inspect only if material within original depth/host authority. Login/form/action remains excluded; missing or deferred scope is not silence.')))
 reg.append(s)
for r in native:
 id=r['id'];f=P/'sources'/(id+'.md');seed=next((u for x in q['records'][120:140] for u in x['recordedSeedUrls']+x['publishedSourceAliases'] if r['metadata']['id'] in u),None);assert seed
 reg.append(dict(sourceId=id,originalUrl=seed,finalUrl=seed,depth=0,parentSourceId=None,status=200,sourceRole='exact-native-blank-program-document',metadata=r['metadata'],rawArtifactPath=r['path'],rawSha256=r['sha256'],observedAt=r['completedAt'],sourceRevision=None,artifactPath=str(f.relative_to(ROOT)),artifactSha256=sha(f.read_bytes()),sourceScope='Sanitized complete selected native document body/layout/OCR; blank personal-field labels only, no applicant values',linkDispositions=[],**route('Resolve native file public/sponsor/version and saved input continuity at applicable evidence/consolidation; preserve raw custody and inspection limits.')))
registry={x['sourceId']:x for x in reg}
affinity={124:['jean','jean-old','jean-pdf'],125:['kiita','kiita-old','kiita-pdf'],126:['coffee','coffee-old','coffee-pdf'],127:['seeley'],128:['dane','wef'],129:['byf','nths','nths-scholarships'],130:['ortho','ortho-home'],131:['davis','davis-faq'],132:['helen','wef'],133:['logan'],134:['wet','wet-old','wet-pdf'],135:['luedke','wef'],136:['rhino','rhino-west','rhino-pdf'],137:['surety'],138:['adams'],139:['ann','wef'],140:['john'],141:['glacier','glacier-alias'],142:['mspoa-old','mspoa'],143:['mspoa-old','mspoa']}
basefields=['amount','minimumGPA','gpaBasis','schoolType','residency','membership','needRequirement','needSelection','renewability','reapplication','materials','applicationMethod','deadline','opening','cycle','currentOffering','nomination','eligibility','sourceInspectionLimit']
actions={
124:'Resolve saved-name/native current document mapping, Olney-Bissell attendance and Flathead graduate scope, no entry GPA, annual one-time/reapplication distinction, 2026 year and literal MDT without PDF AM/PM, two academic-year provider-uploaded letters/four essays/enrollment and payment. Old PDF404; no portal interaction or 2027 extrapolation.',
125:'Resolve exact KIITA/current cycle and renewal conditions; preserve four-year Montana University System bachelor destination, public Flathead senior, inability to rely on family, preferred3.0 (not a required cutoff), volunteer/work-ethic preference, two distinct provider-uploaded letters/four essays and up-to10000/year/up-to4year wording. Old PDF404; no guarantee of renewal or service requirement.',
126:'Resolve Montana Coffee Traders employee-within-prior-year versus parent current-employee wording and separate Flathead resident slot; retain both1000 slots,3.0 high-school/current-college, two academic-year provider letters/three essays, fall2026 enrollment/directschoolpayment and May announcement. Old PDF URL returned parent not PDF; no merge or live offering inference.',
127:'Resolve Seeley church affiliation OR child/employee alternatives,2.0/accredited term enrollment, need/good-character selection, one-time500–1000/1–2slots and no previous-recipient reapplication;2026Jan1–March31/transcript/FAFSA-FSS. Portal locator remains untouched.',
128:'Resolve Dane Hunt saved-name/Reeb-Hunt native continuity, WHS graduating-senior and broad work/apprenticeship/travel path, community nomination/written kindness statement, no entry GPA,1000/April1,2026 endofday to counselor. Parent is historical2024 and redacted; no current identity acceptance.',
129:'Resolve NTHS BYF child versus broader NTHS input; keep five2000/current-member/current-HS-senior-or-postsecondary/construction-discipline criteria and yearlessOct1–April1. Construction codes DOCX deferred; three essays/recommendation are BYF-parent scope, no portal action or invented numeric date provenance.',
130:'Resolve exact native Ortho2026/public sponsor binding,500/graduating-senior/April1,2026/counselor/awards-ceremony agreement,7th-semester transcript and500word essay. Two scanned pages inspected; general PT homepage tagline does not bind scholarship, no missing-GPA silence claim.',
131:'Resolve Davis-Putter Fall2026–June2027 versus yearlessApril1 literal midnightEST and competing Kaleidoscope/AwardSpring application locators. Keep activism AND need AND credited enrollment, US/abroad exceptions, max15000 versus prior7700 average, reapplyeachyear/no deferral, complete materials and interview-timeline hint. FAQ other tabs and financial worksheet references deferred; no application visit.',
132:'Resolve Helen native/current identity and yearlessApril3,3.5entry versus3.5continuing,2000/variablecount/four-year/US-citizen/WHS; retain typed form/500wordessay alternatives,parentfinancialstatement exception,7thsemester transcript,counselor signedsealedreport/testscores and two typeddatedsigned distinct references, full activity/work/service details. Historical parent need-selection wording not current requirement.',
133:'Resolve exact Healthy Futures program/cycle/criteria from applicable authorized program evidence; Smartsheet remains locator-only and generic Loganhomepage200 proves neither program terms nor absence. No form read/action, search or provider contact.',
134:'Resolve WET olderJanuary versus parent-linkedFebruary2026 PDF, essay diversity-and-inclusion versus DEI wording; keep firstyear/Montana-WyomingHS/open-to-all with underrepresented preference (not exclusive),2x1000/April3,2026,complete application/nonfamilyletter/officialtranscript/300word numbered-name essay. Raw403 and no visual/currentbyte proof remain; webform fields excluded/no action.',
135:'Resolve Luedke native/current cycle and yearlessdeadline unknown,1500/up-to4years, hardship/disability/discrimination OR categories, WHS/WIHS/fallimmediate/degreepaths/noentryGPA. Typed student three250wordminimum essays OR typed communitynomination250wordminimum, optionaladditional circumstances. Renewal2.0C/accredited/sameamount/annualtranscriptJuly1exception/nonreceiptcancellation/30daytermination kept; financial essay not proof need-only threshold.',
136:'Resolve Rhino currentcycle and alternate route equality,7x1000/3.0/2026graduatingseniors from fourcounties/accreditedcollege-trade/fall2026,April6noon/timezoneunknown/April21weeknotification,500wordessay/emailbody/subject/marketingphotoagreement/oneweekreply. Exact PDF redirects to filesusr CDN; host continuity remains held, no submission.',
137:'Resolve Surety requiredbusinessdegree versus qualificationspreference wording; no hardrestriction chosen.1500/oneslot/highschool-or-undergrad/500–1000WordPDFessay/officialmostrecenttranscript/April6,2026/June1announcement/nofees remain source-scoped. Contact locator excluded/no email.',
138:'Resolve Adams-Marcellin2025/26native/current identity,2500/oneslot/3.3/WHS-or-WIHS/accredited2–4year/fulltime12credits/instate-outstate-international/globalinterest. Typed application/twoletters/transcript/activitylist/twoessays approximately250 overview versus minimum250 form/halfpage/doublespaced/April10,2026 hardcopycounselor retained.',
139:'Resolve AnnMarieGuenther native/current identity,5000for2year/up-to10000for4year basis not annualized, WHS-or-WIHS/accredited2–4year/fulltime12credits/noGPA,technicalschool label versus institution scope. Typedform/unrelatedadultletter/officialtranscript/postgradplans/two250–500essays/halfpage/doublespaced/April10,2026 hardcopycounselor. Historical2024parent cannot bind currentterms.',
140:'Resolve JohnMichaels native/current mapping,2000/WHSsenior/Montanadestination2–4year-technical/noGPA/April11,2026. Application/activities-work/community and kindnessessay under500 overview versus500-or-less form remain conflict; no invented deliveryroute or time.',
141:'Resolve GlacierBank separate exact native application and description continuity/current cycle; keep two1000/yearlessApril15 despite2026filenames, formalwrittenapplication/7thsemestertranscript/seniorresume/counselor and financialneed/educationcareer statements. No GPAthreshold/needeligibility inferred from questions.',
142:'Resolve MSPOA merit child currentcycle: two1500/local-lawenforcementcareer AND parentcurrentmembergoodstanding AND employedMontanasheriff,HSgraduate-orGED/basicpeaceofficer requirements,2.5entryHS-or-college and criminaljustice destination qualifier. Preserve allsevenmaterials,need/academic/careerselection/payment and Jan2027openinghint without exactdate; shorter/scholarships route softmissing.',
143:'Resolve separate MSPOA memberschildren child: five1000/randomselection/notmerit/currentHSsenior-or-college,parentcurrentmembergoodstanding AND MontanaSheriffemployment; directuniversitycollegepayment and Jan2027openinghint. Do not inherit merit2.5/criminaljustice/materials. Softmissing/scholarships and SurveyMonkey locator untouched.'}
records=[]
for seed in q['records'][120:140]:
 row=seed['rowLocator'];r={k:seed[k] for k in ['inputKey','rowLocator','recordedName','publicIdCandidates','identityAcceptance']};r.update(outcome='held-access' if row==133 else 'researched-held',allowedSourceIds=affinity[row],fieldProposals={},seedDispositions=[],**route(actions[row]))
 for field in basefields:r['fieldProposals'][field]=dict(value=None,state='unverified',acceptance='held',sourceScope='Exact award/current applicability unresolved',observedAt=now,sourceRevision=None,freshness='As-observed source scope only; indexed provider freshness/current offering unknown; no future extrapolation',evidence=[],note='Unknown remains non-excluding; uninspected/deferred scope is not source silence.',**route(actions[row]))
 for i,url in enumerate(list(dict.fromkeys(seed['recordedSeedUrls']+seed['publishedSourceAliases']))):
  ids=[s['sourceId'] for s in reg if s['originalUrl']==url and s['sourceId'] in affinity[row]]
  contact=url.startswith('mailto:');excluded=contact or any(h in url for h in ['grantinterface','mykaleidoscope','smartsheet','surveymonkey'])
  r['seedDispositions'].append(dict(**({'urlSha256':sha(url.encode()),'queueLocator':f"{seed['inputKey']} unique seed/alias index{i}",'url':'mailto:[contact omitted]'} if contact else {'url':url}),sourceIds=ids,disposition='excluded-contact-no-action' if contact else 'locator-only-no-action' if excluded else 'inspected-selected-source' if ids else 'same-exact-file-alias-inspected' if '/document/d/' in url and row==140 else 'deferred-identity-scope-hold',**route(actions[row])))
 records.append(r)
rows={r['rowLocator']:r for r in records}
def put(row,field,value,sid=None,excerpt=None,state='verified',locator='Selected source program section'):
 f=rows[row]['fieldProposals'].get(field)
 if f is None:
  f=dict(rows[row]['fieldProposals']['eligibility']);f['evidence']=[];rows[row]['fieldProposals'][field]=f
 f['value']=value;f['state']=state;f['sourceScope']=locator
 if sid:
  assert sid in affinity[row];s=registry[sid];t=(ROOT/s['artifactPath']).read_text();assert excerpt in t,(row,field,sid,excerpt)
  f['evidence'].append(dict(sourceId=sid,sourceUrl=s['originalUrl'],artifactSha256=s['artifactSha256'],excerpt=excerpt,locator=locator));f['observedAt']=s.get('observedAt',s.get('end')) or now
# Compound typed envelopes preserve original AND/OR, qualifiers and conflict alternatives.
put(124,'amount',{'currency':'USD','perRecipient':2500,'slots':1,'annualOneTime':True},'jean-pdf','annual, one-time scholarship of $2,500')
put(124,'eligibility',{'attendedOlneyBissellDistrict58':True,'schoolStageOR':['graduating senior in Flathead County','previously graduated from a high school in Flathead County'],'applicantResidence':None,'fallEnrollment':2026,'directInstitutionPaymentAfterVerification':True},'jean-pdf','Applicant must be a graduating senior in Flathead County, Montana, or have previously graduated from a high school in Flathead County, Montana.')
put(124,'minimumGPA',{'minimumRequired':False,'threshold':None},'jean-pdf','No minimum G.P.A. required.')
put(124,'reapplication',{'annualCompetition':True,'sameApplicantConsecutiveYearsPossible':True,'automaticRenewal':None},'jean-pdf','may be awarded to the same applicant in consecutive years')
put(124,'deadline',{'date':'2026-03-31','literalTime':'11:59 MDT','PDF_AMPM':None,'parentPM':True},'jean-pdf','March 31, 2026 at 11:59 MDT')
put(124,'opening',{'date':'2026-01-30','end':'2026-03-31'},'jean','January 30 to March 31, 2026')
put(124,'materials',{'completeApplication':True,'twoLetters':{'teacherProfessorAdvisor':1,'employerCommunitySupervisor':1,'academicYearWritten':True,'uploadedByProvidersByDeadline':True},'currentHSTranscriptOrCollegeTranscript':True,'essayCount':4,'topics':['challenge','special attributes','degree goals','volunteer activities']},'jean-pdf','Reference providers must upload their letters by the application deadline.')
put(124,'selection',{'communityVolunteerAndWorkEthicPreference':True,'announcement':'2026-05'},'jean-pdf','proven history of community involvement/volunteerism and a strong work ethic')
put(125,'amount',{'currency':'USD','annualMaximum':10000,'guaranteedAmount':None},'kiita-pdf','Scholarships of up to $10,000 will be awarded annually')
put(125,'eligibility',{'publicFlatheadCountyHighSchoolGraduatingSenior':True,'fourYearMontanaUniversitySystemBachelor':True,'cannotRelyOnFamilyForCollegeExpenses':True,'comingFallEnrollment':True},'kiita-pdf','four-year institution within the Montana University System')
put(125,'needRequirement',{'familyUnableToHelpRequired':True,'numericNeedThreshold':None},'kiita-pdf','Applicant must be unable to rely on their family to help pay for college expenses.')
put(125,'minimumGPA',{'preferred':3.0,'requiredThreshold':None,'capableOfAcademicSuccessRequired':True},'kiita-pdf','Minimum G.P.A. of 3.0 is preferred.')
put(125,'renewability',{'upToYears':4,'conditionsUnverified':True,'internationalServiceOpportunity':'Mexico','serviceParticipationRequired':None},'kiita-pdf','renewable for up to four years')
put(125,'deadline',{'date':'2026-03-31','literalTime':'11:59 MDT','AMPM':None},'kiita-pdf','March 31, 2026 at 11:59 MDT')
put(125,'opening',{'date':'2026-01-30'},'kiita','January 30')
put(125,'materials',{'twoLettersDistinctSources':['teacher/coach/counselor','employer/community supervisor'],'academicYearWritten':True,'providerUploadsByDeadline':True,'currentHSTranscript':True,'essayCount':4,'topics':['family financial independence','graduation obstacles','bachelor goals','volunteer activities'],'lateIncompleteRejected':True},'kiita-pdf','Reference providers must upload their letters by the application deadline.')
put(125,'selection',{'volunteerCommunityWorkEthicPreference':True,'announcement':'2026-05'},'kiita-pdf','proven history of community involvement/volunteerism and a strong work ethic')
put(126,'amount',{'currency':'USD','perRecipient':1000,'slots':2,'separateTracks':['employee/dependent','Flathead Valley resident']},'coffee-pdf','will award two, $1,000')
put(126,'membership',{'employeeTrackOR':['employed within year before application','child/legal dependent of current employee'],'residentTrack':'eligible Flathead Valley resident; employee affiliation not required and may overlap','parentCurrentEmployeeWording':True,'selectedSingleInterpretation':None},'coffee-pdf','within the year prior to the date of the',state='conflict')
put(126,'minimumGPA',{'value':3.0,'basis':'high school or current college','scale':None},'coffee-pdf','G.P.A. of 3.0 or higher')
put(126,'eligibility',{'fallEnrollment':2026,'postSecondaryInstitution':True,'directSchoolPaymentVerifiedEnrollment':True},'coffee-pdf','fall of 2026')
put(126,'deadline',{'date':'2026-03-31','time':'23:59','literalZone':'MDT'},'coffee-pdf','March 31, 2026 at 11:59 p.m. MDT')
put(126,'opening',{'date':'2026-01-30'},'coffee','January 30')
put(126,'materials',{'transcript':'HS or current college','twoAcademicYearLetters':['teacher/professor/instructor','employer/community supervisor'],'providerUploadsByDeadline':True,'essayCount':3,'topics':['special attributes','degree goals','volunteer activities'],'completeApplication':True},'coffee-pdf','Three essays written by the applicant')
put(126,'selection',{'communityVolunteerWorkEthicPreference':True,'announcement':'2026-05','highSchoolAwardCeremony':True},'coffee','high school award ceremony')
put(127,'amount',{'currency':'USD','typicalRange':[500,1000],'typicalSlotsRange':[1,2],'perAcademicYear':True},'seeley','Typically **$500 to $1,000**')
put(127,'membership',{'OR':['Helena First Presbyterian Church member','church employee','child of member','child of employee']},'seeley','be a member of the Helena First Presbyterian Church, an employee of Helena First Presbyterian Church, or be the a child of a member or employee.')
put(127,'minimumGPA',{'value':2.0,'scale':None},'seeley','GPA of 2.0 or higher')
put(127,'eligibility',{'stages':['current college','graduating HS senior'],'accreditedPostSecondaryByFirstTerm':True},'seeley','at an accredited postsecondary institution by the start of the first term')
put(127,'needSelection',{'financialNeedAndGoodCharacter':True,'needRequired':None},'seeley','Selection for this scholarship is based on demonstrated financial need and good character.')
put(127,'reapplication',{'previousRecipientsAllowed':False,'awardType':'One-Time'},'seeley','Previous recipients are NOT allowed to apply again.')
put(127,'deadline',{'date':'2026-03-31','time':None,'zone':None},'seeley','Tuesday, March 31, 2026')
put(127,'opening',{'date':'2026-01-01'},'seeley','Thursday, January 01, 2026')
put(127,'materials',{'transcript':'Most Recent High School or College','FAFSAFSS':True},'seeley','FAFSA FSS')
put(128,'amount',{'currency':'USD','value':1000},'dane','Amount: $1,000')
put(128,'eligibility',{'WHSSenior':True,'paths':['4-year','2-year','technical','work/apprenticeship','travel']},'dane','through beginning work/apprenticeship, or traveling.')
put(128,'minimumGPA',{'minimumRequired':False},'dane','No Minimum GPA Requirement')
put(128,'nomination',{'communityNominator':True,'randomActsKindness':True,'statementTypedOrHandWritten':True,'minimumLength':None},'dane','Anyone in the Whitefish Community can nominate a graduating Senior to receive this award.')
put(128,'deadline',{'date':'2026-04-01','literalTime':'end of day','zone':None,'delivery':'WHS guidance counselor'},'dane','no later than end of day April 1, 2026.')
put(128,'materials',{'nominationFormAndStatement':True,'statementLength':'no minimum'},'dane','no minimum length requirement')
put(129,'amount',{'currency':'USD','perRecipient':2000,'slots':5},'nths-scholarships','five $2000 scholarships')
put(129,'eligibility',{'currentNTHSMember':True,'stageOR':['current high school senior','post-secondary student'],'constructionRelatedStudy':True,'exactConstructionCodesDeferred':True},'nths-scholarships','current high school senior or post-secondary student')
put(129,'membership',{'NTHSCurrentRequired':True},'nths-scholarships','current NTHS members')
put(129,'deadline',{'monthDay':'04-01','year':None,'time':None},'nths-scholarships','October 1 - April 1')
put(129,'opening',{'monthDay':'10-01','year':None},'nths-scholarships','October 1 - April 1')
put(129,'materials',{'BYFParentScopeOnly':True,'honorsTrainingCertifications':True,'recommendation':True,'essayCount':3,'loginApplicationNotInspected':True},'byf','Three essay questions')
put(130,'amount',{'currency':'USD','value':500},'ortho','Scholarship ($500)')
put(130,'eligibility',{'graduatingSenior':True,'effortDrivePotential':True,'awardsCeremonyAgreement':True,'schoolResidenceRequirementsUnverified':True},'ortho','graduating seniors whose effort and drive reflect their potential')
put(130,'deadline',{'date':'2026-04-01','time':None,'delivery':'High School Career/Guidance Counselor'},'ortho','Application due April 1, 2026')
put(130,'materials',{'seventhSemesterTranscript':True,'cumulativeGPAClassRank':True,'honorsActivitiesServiceVolunteerEmploymentInterests':True,'separateEssayMaxWords':500},'ortho','(Attach essay separate from this application.)')
put(131,'amount',{'currency':'USD','maximumPerYear':15000,'applicablePeriod':['fall2026','2027-06-30'],'prior2025to26Average':7700,'disbursedPerAttendedTerm':True},'davis','maximum grant available is $15,000 per year')
put(131,'eligibility',{'AND':['active progressive movement organizer','financial need','enrolled degree/trade/training with credits during grant'],'undergraduateGraduate':True,'partTimeFullTime':True,'USParticipationAndUSProgramRuleWithAbroadExceptions':True},'davis','involved in movements for progressive social change, enrolled in a degree, trade or training program, and have financial need.')
put(131,'needRequirement',{'required':True,'notMerelyConsidered':True},'davis-faq','Applicants who do not have a financial need will not be selected.')
put(131,'residency',{'USCitizenshipRequired':False,'USActivitiesRequired':True,'USProgramRule':'FAQ says accredited US program; abroad/Canada/Mexico exceptions separately retained','noAutomaticForeignExclusion':True},'davis-faq','No, but applicants must have participated in activities in the United States')
put(131,'reapplication',{'mustReapplyEachYear':True,'repeatGrantsPossible':True,'noDeferralCarryover':True},'davis','must reapply each year support is sought.')
put(131,'deadline',{'monthDay':'04-01','literalTime':'midnight EST','year':None,'zoneNotNormalized':True},'davis','midnight EST, April 1')
put(131,'opening',{'month':'January','annualYearless':True,'timelineImageJanuary1':True},'davis','Applications are available in January of each year')
put(131,'materials',{'completeAllSections':True,'personalStatementAndShortEssays':True,'twoRecommendations':True,'mostRecentTranscriptUnofficialAllowed':True,'fullFinancialInformation':True,'SARorIfFederalIneligible':['state equivalent','FAFSA worksheet'],'FAQOtherTabsUninspected':True,'timelineFinalistInterviewHint':True},'davis','unofficial is acceptable')
put(131,'applicationMethod',{'online':True,'mainRoute':'Kaleidoscope2026','FAQRoute':'AwardSpring','routeContinuityUnresolved':True,'visitedNeither':True},'davis-faq','https://davisputter.awardspring.com/',state='conflict')
put(132,'amount',{'currency':'USD','value':2000,'awardCountVariable':True},'helen','Amount: $2,000 (# of awards vary by year)')
put(132,'minimumGPA',{'entry':3.5,'scale':None,'counselorReportScale':4.0},'helen','Minimum GPA: 3.5')
put(132,'renewability',{'renewable':True,'continuingGPA':3.5,'duration':None},'helen','if student maintains a 3.5 average in school')
put(132,'eligibility',{'WHSHighSchoolSenior':True,'USCitizen':True,'traditionalFourYear':True,'sourceTypoHighAspiresUncorrected':True},'helen','seniors who are US Citizens and enrolled at Whitefish High School')
put(132,'deadline',{'monthDay':'04-03','year':None,'filename2026NotDateProof':True,'delivery':'WHS guidance office','typed':True},'helen','Typed Applications due by 4/3')
put(132,'materials',{'typedApplication':True,'essay':{'collegeEssay500wordsOrTwoPromptChoice':True,'includeOriginalPrompt':True},'parentGuardianFinancialStatement':'see counselor if unable','transcript':'7thsemester, officialsignaturephotocopyacceptable','counselorReport':'completedsigned,sealedreturnwithtranscript','testScores':'oneACTorSATset, transcriptcopyacceptable,SATessaynotcounted','letters':{'count':2,'typedDatedSigned':True,'HSteacher':1,'nonHSnonrelativeCommunityMember':1},'employmentLeadershipHonorsCommunityServiceDetails':True},'helen','Letter(s) of Recommendation (must be typed, dated and signed)')
put(134,'amount',{'currency':'USD','perRecipient':1000,'slots':2},'wet-pdf','two (2) $1,000 scholarships')
put(134,'eligibility',{'firstYearCollege':True,'MontanaOrWyomingHighSchool':True,'openToAllWithUnderrepresentedPreference':True,'notExclusiveDemographicRule':True},'wet-pdf','open to all Montana and Wyoming High School students')
put(134,'deadline',{'date':'2026-04-03','time':None,'zone':None},'wet-pdf','APRIL 3, 2026')
put(134,'materials',{'completeLegibleApplication':True,'nonfamilyRecommendation':['teacher','counselor','employer','other nonfamily'],'officialTranscript':True,'essayMaxWords':300,'numberAndNameEachPage':True,'oldEssayTopic':'diversity and inclusion','currentTopic':'diversity, equity, and inclusion','personalExperienceExample':True,'selectedVersionUnaccepted':True},'wet-pdf','What is the importance of diversity, equity, and inclusion?',state='conflict')
put(135,'amount',{'currency':'USD','value':1500,'renewalSameAmount':True},'luedke','Amount: $1,500')
put(135,'eligibility',{'schoolOR':['WHS','Whitefish Independent HS'],'graduatingSenior':True,'hardshipDisabilityDiscriminationAlternativeExamplesNonExhaustive':True,'immediateFallEnrollmentRequired':True,'degreePaths':['4-year','2-yearcommunitycollege','technical/vocational']},'luedke','Student must enroll in the Fall immediately following High School graduation.')
put(135,'minimumGPA',{'entryRequired':False},'luedke','No Minimum GPA Requirement')
put(135,'nomination',{'studentApplicationORCommunityNomination':True,'typedEitherRoute':True,'requiredForAll':False},'luedke','Alternately, someone in the community')
put(135,'materials',{'studentEssays':{'count':3,'minWordsEach':250,'halfPageDoubleSpaced':True,'topics':['personal challenges','financial need','future impact']},'communityNominationEssay':{'minWords':250,'halfPageDoubleSpaced':True},'optionalCircumstances':True},'luedke','Please answer all three prompts below; each prompt should be a minimum of 250 words')
put(135,'renewability',{'upToConsecutiveYears':4,'accreditedSchool':True,'GPA':2.0,'literalGrade':'C','annualTranscriptPaperOrElectronic':True,'transcriptDueMonthDay':'07-01','extenuatingException':True,'failureCancels':True,'sameAmount':True,'terminationWith30DaysNoticeForAnyCommitteeReason':True},'luedke','Unless there are extenuating circumstances, the transcript must be submitted by 1 July')
put(136,'amount',{'currency':'USD','perRecipient':1000,'slots':7},'rhino','seven individual $1,000 scholarships')
put(136,'eligibility',{'2026GraduatingHighSchoolSenior':True,'schoolCountyOR':['Flathead','Lake','Missoula','Ravalli'],'accreditedCollegeOrTrade':True,'fall2026Plan':True,'applicantResidenceSeparateUnknown':True},'rhino','Flathead, Lake, Missoula, or Ravalli Counties')
put(136,'minimumGPA',{'value':3.0,'basis':'graduation GPA','scale':None},'rhino','minimum 3.0 GPA')
put(136,'deadline',{'date':'2026-04-06','literalTime':'12 PM (noon)','zone':None},'rhino','12 PM (noon)')
put(136,'materials',{'emailBodyApplication':True,'educationPlansSchoolStudentID':True,'essayWords':500,'essayTopics':['goals','planned school/program','why applicant'],'subject':'Scholarship Application 2026','marketingPhotoConsentAndInitials':True,'replyWithinWeekNotification':True,'businessProfessionalPanel':True,'notificationWeek':'2026-04-21'},'rhino-pdf','Recipient must reply within a week of notification.')
put(137,'amount',{'currency':'USD','value':1500,'slots':1},'surety','one winner will be selected to receive the $1,500 scholarship')
put(137,'eligibility',{'stagesOR':['high school','college undergraduate'],'businessDegreeRequiredVersusPreference':True,'selectedRequirement':None},'surety','Preference is given to students pursuing Accounting, Banking, Finance, or related business fields.',state='conflict')
put(137,'deadline',{'date':'2026-04-06','time':None,'zone':None},'surety','April\u202f6,\u202f2026')
put(137,'materials',{'essayWords':[500,1000],'essayFormats':['Word','PDF'],'topic':'business career reasons','officialMostRecentSemesterTranscript':True,'submission':'email','noContestFeesOrCreditCard':True,'announcement':'2026-06-01'},'surety','500–1,000‑word essay')
put(138,'amount',{'currency':'USD','value':2500,'slots':1},'adams','Amount: $2,500 (one scholarship available each year)')
put(138,'eligibility',{'schoolOR':['WHS','Whitefish Independent HS'],'graduatingSenior':True,'accredited2to4YearFullTime':True,'minimumCreditsPerSemester':12,'destinationOR':['in-state','out-of-state','international'],'internationalInterestPurpose':True},'adams','institution full time (12 credit minimum per semester)')
put(138,'minimumGPA',{'value':3.3,'scale':None},'adams','minimum GPA of 3.3')
put(138,'deadline',{'date':'2026-04-10','time':None,'delivery':'printed one hardcopy to guidance counselor'},'adams','April 10th, 2026.')
put(138,'materials',{'typedForm':True,'letters':2,'officialHSTranscript':True,'activitiesInvolvementList':True,'essays':{'count':2,'overviewApproximatelyWordsEach':250,'formMinimumWordsEach':250,'halfPageDoubleSpaced':True,'topics':['development/pursuit of international interest','future plans and international interests']},'wordingDistinctionHeld':True},'adams','minimum of 250 words',state='conflict')
put(139,'amount',{'currency':'USD','twoYearCourse':5000,'fourYearCourseMaximum':10000,'annualBasis':None},'ann','Amount: $5,000 for a 2-year course; up to $10,000 for a 4-year course.')
put(139,'eligibility',{'schoolOR':['WHS','Whitefish Independent HS'],'graduatingSenior':True,'accredited2to4YearFullTime':True,'creditsPerSemester':12,'inStateOutOfState':True,'formTechnicalLabelUnreconciled':True},'ann','12 credit minimum per semester')
put(139,'minimumGPA',{'minimumRequired':False},'ann','There is no minimum GPA requirement')
put(139,'deadline',{'date':'2026-04-10','delivery':'printed one hardcopy guidance counselor','time':None},'ann','April 10th, 2026.')
put(139,'materials',{'typedForm':True,'oneUnrelatedAdultLetter':True,'officialHSTranscript':True,'postgraduatePlans':True,'twoEssays':{'wordsEach':[250,500],'halfPageDoubleSpaced':True,'topics':['impact of education','doors advanced education opens']},'onePrintedHardCopy':True},'ann','each should be 250-500 words')
put(140,'amount',{'currency':'USD','value':2000},'john','Amount: $2,000')
put(140,'eligibility',{'WHSSenior':True,'MontanaInstitutionRequired':True,'paths':['4-year','2-year','technical']},'john','within Montana.')
put(140,'minimumGPA',{'minimumRequired':False},'john','No Minimum GPA Requirement')
put(140,'deadline',{'date':'2026-04-11','time':None,'zone':None,'delivery':None},'john','Due 4/11/26')
put(140,'materials',{'applicationWithWorkSchoolCommunityDetails':True,'essay':{'topic':'kindness, giving and future education legacy','overviewUnder500':True,'form500orLess':True,'selectedLimit':None}},'john','In 500 words or less',state='conflict')
put(141,'amount',{'currency':'USD','value':1000,'slots':2},'glacier-alias','Amount of Award:$1,000.00')
put(141,'deadline',{'monthDay':'04-15','year':None,'filename2026NotCycleProof':True,'time':None},'glacier-alias','Deadline:April 15')
put(141,'materials',{'formalWrittenApplication':True,'seventhSemesterHSTranscript':True,'seniorResume':True,'counselorDelivery':True,'financialNeedsAndEducationCareerStatements':True},'glacier-alias','Attach seventh semester high school transcript.')
put(142,'amount',{'currency':'USD','value':1500,'slots':2,'applicantNamedCheckForwardedToCollege':True},'mspoa-old','two $1500.00 scholarships')
put(142,'membership',{'AND':['parent current MSPOA member in good standing','parent employed by Montana Sheriffs Office']},'mspoa-old',"Whose parent is a current MSPOA member in good standing AND is employed by a Sheriff's Office in the state of Montana.")
put(142,'eligibility',{'HSseniorOrCurrentCollegeLocalLawEnforcementCareer':True,'HSGraduateOrGED':True,'basicPeaceOfficerEligibilityRequired':True,'HSFulltimeMontanaMinimumAACriminalJusticePreferredVersusCollegeCJPath':True,'ruleScopeUnresolved':True},'mspoa-old','High school graduate or successful GED completion.')
put(142,'minimumGPA',{'HSorCurrentCollege':2.5,'scale':None},'mspoa-old','grade point average of at least 2.5')
put(142,'opening',{'month':'2027-01','exactDate':None,'notOpenClaim':True},'mspoa-old','Application will be available January 2027.')
put(142,'needSelection',{'needAcademicAbilityCareerGoals':True,'needRequired':None},'mspoa-old','on the basis of need, academic ability, and career goals.')
put(142,'materials',{'items':['request letter','current HS/college transcript','resume with references','career-goal outline','recent photo','college-financing statement','advisor academic/enrollment-CJ letter'],'proofEnrollmentIntentOrCurrentEnrollment':True,'statuteLinkedRequirementsUninspected':True},'mspoa-old','Personal resume including references.')
put(143,'amount',{'currency':'USD','value':1000,'slots':5,'separateChildren':True,'directCollegePayment':True},'mspoa-old','Five (5) Scholarships of $1000')
put(143,'eligibility',{'HSseniorOrCurrentCollegeUniversity':True,'parentCurrentMSPOAMemberGoodStandingANDMontanaSheriffEmployment':True,'noInheritedMeritGPARule':True},'mspoa-old','Applicant must be a high school senior or a current college/university student.')
put(143,'selection',{'random':True,'meritBased':False},'mspoa-old','randomly chosen and are not merit based.')
put(143,'opening',{'month':'2027-01','exactDate':None,'notOpenClaim':True},'mspoa-old','Application will be available January 2027.')
for r in records:
 row=r['rowLocator'];nativeids=[x for x in affinity[row] if x in [d['id'] for d in native]]
 value={'identityAndCurrentOfferingHeld':True,'nativeIds':nativeids,'providerIndexedFreshnessUnknown':True,'uninspectedScopeCannotEstablishSilence':True,'rawVisualUnavailable':row==134,'DOCXBodyXMLOnly':row in [128,132,135,139,141],'portalUntouched':True}
 put(row,'sourceInspectionLimit',value,state='unverified')
 # Preserve scoped application route without implying successful application access.
 if r['fieldProposals']['applicationMethod']['value'] is None:
  r['fieldProposals']['applicationMethod']['value']={'recordedLocatorsOnly':True,'loginFormSubmissionContactActions':False,'actualApplicationAccessVerified':False}
 field=r['fieldProposals']['cycle'];field['value']={'currentApplicableCycle':None,'historicalOrYearlessOnly':True};field['state']='unverified'
count=sum(len(r['fieldProposals']) for r in records);oldcount=sum(len(r['fieldProposals']) for c in prior for r in c['records'])
ledger={'schemaVersion':1,'checkpoint':7,'entryCommit':entry,'queueSha256':sha((B/'queue.json').read_bytes()),'queueOffsetStart':120,'queueOffsetEndExclusive':140,'orderedInputKeys':[r['inputKey'] for r in records],'records':records,'sourceRegistry':reg,'acceptedFacts':0,'researchComplete':True,'researchCompleteMeaning':'Twenty initial bounded dispositions with all unresolved scope routed; not complete award facts/full SD2','independentReview':'pending frozen candidate independent GPT review','completedAt':now,'fullSD2Complete':False,'canonicalAcceptance':False,'SD3Started':False,'coverage':{'checkpointInputs':20,'fieldEnvelopes':count,'sourceReceipts':len(reg),'outcomes':dict(collections.Counter(r['outcome'] for r in records)),'cumulativeInitialDispositions':140,'cumulativeAutonomousHeldFields':oldcount+count,'cumulativeAutonomousHeldIdentities':140,'unprocessedInputs':266},'nextCheckpointInputOffset':140,'nextInputKey':q['records'][140]['inputKey'],'priorHolds':{'unchangedPaths':[f'docs/evidence/sd2-autonomous/checkpoint-{i:03d}.json' for i in range(1,7)],'fields':oldcount,'identities':120,'allEarlierPacketsPRELUDESection9M1Routes':'byte-preserved; original owners/triggers control'},'preservedGates':prior[-1]['preservedGates'],'sourcePolicyDeviations':['Initial metadata call had unsupported nesting and no source read; corrected exact fileId request.','Intermediate outputs exposed unrelated navigation/consent/public-contact/mailing lines and native maintainer view-link query despite intended narrowing; no applicant responses or private credentials. Persisted selected artifacts exclude these values. Provider redactPII alone was insufficient. Later outputs narrowed/masked; prior outputs are not erased.','WET selected public program page included embedded blank form; form inputs/actions excluded. Rhino static program application instructions read without action.','Some source biography/name redactions limit identity; no fabricated name restoration. Exact raw native/public documents, when available, independently preserve names as public program identities.'],'limits':['No current workbook read/version/permission, official-current-offering, accepted facts, fresh authenticated remote main/target, whole-copy preservation or permanent raw custody proof.','Source revisions unknown; provider maxAge not specified, origin freshness unverified. Jean first call precise timestamp not captured.','WET provider200 text versus direct403 raw download stays held; no further403 probing.','Clerk prior raw/visual gap unchanged;41exact prior custody pins available/hash-equal without reacquisition.','No workbook/app/config/CI changes, login/form interaction/contact/messages, remoteGit/deployment/activation or SD3.']}
save(target,ledger);save(P/'source-receipts.json',reg)
print(json.dumps(ledger['coverage'],indent=2))
