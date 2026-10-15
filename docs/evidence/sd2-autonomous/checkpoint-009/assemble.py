"""Assemble this new offset160 packet once; never modify/replay a prior ledger."""
from pathlib import Path
import json, hashlib, datetime, subprocess, re, collections
from link_targets import observed_targets, is_redacted
P=Path(__file__).resolve().parent; B=P.parent; ROOT=P.parents[3]
load=lambda p:json.loads(p.read_text()); sha=lambda b:hashlib.sha256(b).hexdigest()
ENTRY='5b971ee6656d1fa3aa63f13354e5b6e8297dec76'
assert subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT).decode().strip()==ENTRY
assert not (B/'checkpoint-009.json').exists(), 'Never overwrite a ledger'
q=load(B/'queue.json'); prior=[load(B/f'checkpoint-{i:03d}.json') for i in range(1,9)]
assert [k for c in prior for k in c['orderedInputKeys']]==[r['inputKey'] for r in q['records'][:160]]
assert q['records'][160]['rowLocator']==164 and q['checkpointSize']==20
now=datetime.datetime.now(datetime.timezone.utc).isoformat()
owner='Codex source/identity reconciliation'
trigger='Applicable authorized evidence arrival or SD2 consolidation after initial remaining-queue coverage'
route=lambda action:dict(owner=owner,trigger=trigger,nextAction=action)
def save(p,x):
 assert not p.exists(),str(p)
 p.write_text(json.dumps(x,indent=2,ensure_ascii=False)+'\n')
meta=load(P/'capture-metadata.json'); reg=[]
parents={'ngpa-prepare':'ngpa','ngpa-faq':'ngpa','ngpa-about':'ngpa','looney-senior':'looney','looney-pdf':'looney-senior'}
for m in meta:
 f=P/'sources'/(m['id']+'.md'); text=f.read_text()
 s=dict(m,sourceId=m['id'],artifactPath=str(f.relative_to(ROOT)),artifactSha256=sha(f.read_bytes()),
  observedAt=m['callCompletedAt'],depth=2 if m['id']=='looney-pdf' else 1 if m['id'] in parents else 0,
  parentSourceId=parents.get(m['id']),sourceScope=m['retainedScope'],linkDispositions=[],
  nativePublicSponsorContinuityVerified=False,completeRawPageImageInspection=False,
  **route('Reconcile exact source/cycle/child applicability and deferred material at authorized evidence arrival/consolidation. Preserve selected-text, provider-redaction, origin freshness and visual limits.'))
 for u in observed_targets(text):
  matched=[x['id'] for x in meta if x['originalUrl']==u]
  locator=any(x in u.lower() for x in ['neoncrm','tally.so','/applynow','/join','member_levels'])
  s['linkDispositions'].append(dict(url=u,sourceIds=matched,disposition='inspected-selected-source' if matched else 'locator-only-no-action' if locator else 'deferred-material-or-out-of-selected-scope',
   **route('Retain exact link and source scope. Forms/login/account/Apply/contact stay untouched; only separately material evidence within depth/host policy may be considered at applicable trigger. No widening, source-silence or child-opening inference.')))
  if is_redacted(u):
   s['linkDispositions'][-1].update(url=None,redactedLocator=u,disposition='held-provider-redacted-locator',usableUrlEstablished=False,doesNotReplacePinnedSeed=True)
 if m['id']=='ngpa':s['selectedTableAccounting']={'retrievedAwardRows':21,'retainedRowsForSelectedNames':13,'unrelatedRowsExplicitlyExcluded':8,'selectedInputNames':9}
 if m['id']=='lpa':s['selectedProgramAccounting']={'retrievedProgramHeadings':5,'selectedHeadingsRetained':4,'unrelatedDispatcherChildExcluded':1,'fiveSavedNamesNotEstablished':True}
 if m['id']=='looney-pdf':s.update(externalDocumentRelationship='Exact PDF link embedded by queued senior-application page; hosting link is observed, independent sponsor/native authority unverified',rawDownloadPerformed=False,conversionPageMarkers=[1,2,3,4,5],blankFieldsOmitted=True,sourceSilenceClaimed=False)
 reg.append(s)
registry={s['sourceId']:s for s in reg}
aff={r:['lpa'] for r in range(164,173)}
aff.update({173:['rollins'],174:['looney','looney-senior','looney-pdf']})
aff.update({r:['ngpa','ngpa-prepare','ngpa-faq','ngpa-about'] for r in range(175,184)})
actions={
164:'Reconcile saved Elevated Access Advanced Rating child against LPA parent showing only five current programs; selected name absent in retrieved headings is not proof of closure. Keep parent Fall2026/general terms separate, with no substitute NGPA award or new identity.',
165:'Reconcile saved EPIC Flight Academy AMT child; current LPA AMT is separately named and is not an EPIC identity proof. Parent-only Fall2026/general terms stay held; no name-only merge or closure inference.',
166:'Reconcile saved LPA Advanced Rating child, not established among five retrieved programs; do not substitute Professional Flight Degree or UAA. Keep parent-only terms and current child amount/eligibility unknown.',
167:'Reconcile Aerospace Degree Advancement exact program/cycle/public authority. Preserve engineering/business/aircraft maintenance/air traffic control/dispatch/aerospace technology examples, education/certifications/specialized training and explicit flight-training exclusion; three slots, variable amount. Parent terms scoped separately.',
168:'Reconcile LPA AMT exact program/cycle. Preserve FAA A&P and/or IA, tuition/technical training/required certification, enrolled OR planning FAA-recognized US/territories program. Four slots/variable amount; separate parent accepted/enrolled accredited-institution terms without choosing combined criteria.',
169:'Reconcile saved LPA Private Pilot child, not established among retrieved programs; do not treat absence as ineligibility or map UAA/NGPA. Preserve parent-only general terms; child amount/GPA/materials/window remain unknown.',
170:'Reconcile Professional Flight Degree exact program/cycle; enrolled OR accepted accredited degree, tuition/flight fees/required collegiate training, two slots/variable amount. Parent age/member/materials/payment/window stay scoped held observations.',
171:'Reconcile saved VOLAR Military child, not established among retrieved programs; no fabricated military criteria, amount or substitute current child. Keep parent-only terms and all identity/current-offering gaps.',
172:'Reconcile UAA child/LPA Fall2026 applicability; preserve conditionally accepted OR enrolled UAA, age18+, five slots, USD27000–122000 varying, direct Academy nontransferable funds. Parent17+ exception and institution/materials/window remain separately scoped; no cross-NGPA merge.',
173:'Reconcile Rollins saved Tally rjPRGR versus newly linked EkjjV4, both untouched. Preserve Winter2027 now-open claim, high-school-seniors/story-impact selection, first10000/runner5000, at-least500word essay, Jan15,2027 11:59PM EST/earlyFeb notice/three judges/ThankYou-no-email claim. Current route usability and unsupported GPA/residency/need unknown.',
174:'Reconcile saved broad BLF senior input with Gold Star children/siblings/4-year college Fall2026 one-time program; preserve 2026–27 PDF title/Fall2026, March1–May31 yearless window. Keep all-schools transcripts even no grades, choose-one one-page Word/double-spaced/TNR12 essay, DD1300/MilitaryID checklist, two nonrelative character letters, direct institution payment. Provider-redacted identity/external hosting and conversion/fullfields/certification/pagevisual limits remain held; no camp/college-track substitution.',
175:'Reconcile NGPA Elevated Access child separately from LPA row164. Keep10000/post-private steps/travel2027PalmSprings/flight-school payment; common18+/active member/flight-only medical-studentcertificate/FAQ nationality qualifiers/material variants and cycle conflicts stay scoped and held.',
176:'Reconcile Endeavor child with three distinct funding variants4000/2400/2000, flightstudent OR CFI at PropelAffiliateSchool, direct flight-school funds. Do not flatten to one amount/slot count; retain NGPA common terms/material/cycle conflicts.',
177:'Reconcile FedEx exact child6000/aviationflighttraining/direct flightschool, commonNGPA requirements and origin/cycle/material conflicts. No invented license/GPA/citizenship rule from sponsor name.',
178:'Reconcile GoJet exact child1500/aviationflighttraining/direct flightschool, commonNGPA requirements and origin/cycle/material conflicts. Unknowns remain non-excluding.',
179:'Reconcile LogTenPro child3000/CFIItraining/direct flightschool, commonNGPA requirements/material/cycle conflicts; do not substitute CFI or inherit unstated prerequisite certificates.',
180:'Reconcile NGPA General Aviation one named program with3x5000/2x10000/1x15000 funding variants. Keep member/generalaviation interests/direct flightschool, no new children from slot counts, worldwide NGPA-namedFAQ scope and conditional flight-only medical; common material/cycle conflicts held.',
181:'Reconcile TransgenderNonbinary Committee child5000/outstanding transgender OR gender-diverse advocate/aviationstudytraining/direct school; phrase describes advocacy, no unsupported applicant identity or sex gate. Preserve general allies/advocacyFAQ, common requirements/material/cycle conflicts.',
182:'Reconcile WomensCommittee child5000/outstandingLGBTQ+advocate/aviationstudytraining/direct school; no inferred women-only applicant identity rule. Preserve general allies/advocacyFAQ/common requirements/material/cycle conflicts.',
183:'Reconcile PSA AircraftMechanic child4500/towardA&P/careerAMT; child payment/slots unknown. Retain parent nonflight no-medical distinction separately, no flight prerequisite inheritance or PSAFlight child substitution; common material/cycle conflicts held.'}
basefields=['amount','minimumGPA','gpaBasis','schoolType','residency','membership','needRequirement','needSelection','renewability','reapplication','materials','applicationMethod','deadline','opening','cycle','currentOffering','nomination','eligibility','sourceInspectionLimit']
records=[]
for seed in q['records'][160:180]:
 row=seed['rowLocator']; outcome='held-identity' if row in [164,165,166,169,171,174] else 'researched-held'
 r=dict(seed,status=outcome,allowedSourceIds=aff[row],outcome=outcome,seedDispositions=[],fieldProposals={},**route(actions[row]))
 for u in dict.fromkeys(seed['recordedSeedUrls']+seed['publishedSourceAliases']):
  ids=[sid for sid in aff[row] if registry[sid]['originalUrl']==u]
  r['seedDispositions'].append(dict(url=u,sourceIds=ids,disposition='inspected-with-source-specific-limits' if ids else 'locator-only-no-action',**route(actions[row])))
 for key in basefields:r['fieldProposals'][key]=dict(value=None,state='unverified',acceptance='held',sourceScope='Unknown for exact selected child/cycle; not a negative rule or source silence.',observedAt=now,sourceRevision=None,freshness='Current applicability unverified',evidence=[],**route(actions[row]))
 records.append(r)
rows={r['rowLocator']:r for r in records}
def quote(sid,start,end=None):
 t=(ROOT/registry[sid]['artifactPath']).read_text();i=t.index(start);return t[i:t.index(end,i) if end else len(t)].strip()
def put(row,key,value,sids,excerpts=None,state='verified',scope=None):
 if isinstance(sids,str):sids=[sids]
 evidence=[]
 for n,sid in enumerate(sids):
  assert sid in aff[row];s=registry[sid];t=(ROOT/s['artifactPath']).read_text();ex=excerpts[n] if excerpts else t.strip();assert ex in t
  evidence.append(dict(sourceId=sid,sourceUrl=s['originalUrl'],artifactPath=s['artifactPath'],artifactSha256=s['artifactSha256'],excerpt=ex,locator='Exact sanitized selected-scope text; no raw/page/image completeness claim'))
 rows[row]['fieldProposals'][key]=dict(value=value,state=state,acceptance='held',sourceScope=scope or 'Selected program text only; parent/common applicability remains scoped, current acceptance unverified.',observedAt=registry[sids[0]]['observedAt'],sourceRevision=None,freshness='Retrieved observation; maxAge0 request is not verified origin currency/current offering.',evidence=evidence,**route(actions[row]))
# Shared LPA parent observations remain explicitly separate from any saved child.
lpaCommon=quote('lpa','## General Eligibility','## Selected child programs')
for row in range(164,173):
 put(row,'parentGeneralRequirements',{'scope':'LPA parent only','savedChildApplicabilityAccepted':False,'activeMemberTiers':['Student','Standard','Lifetime'],'ageMinimum':17,'UAAExceptionAge':18,'enrolledOrAcceptedAccreditedInstitution':'United States or territories','directCertifiedInstitutionPayment':True},'lpa',[lpaCommon])
 put(row,'parentMaterials',{'scope':'LPA parent only','onePageResume':['education','work history','volunteer experience','honors'],'twoRecommendations':{'onePageEach':True,'sources':['professors','employers','mentors'],'LPAMembersPreferred':True},'twoEssaysMaxWordsEach':500,'essays':'passion and alignment with LPA mission','enrollmentOrAcceptanceProof':'required upon award'},'lpa',[lpaCommon])
 put(row,'parentCycle',{'scope':'LPA Fall2026 parent only','openingDate':'2026-10-15','deadlineDate':'2026-11-05','deadlineTime':'23:59','zoneLiteral':'PT','savedChildOpeningAccepted':False,'noLateApplications':True,'webinarDate':None},'lpa',[quote('lpa','Fall 2026 Cycle','## Our Commitment'),quote('lpa','## Important Dates','## Selected child programs')][0:1])
 # Include the second parent excerpt that establishes time and no-late wording.
 s=registry['lpa'];ex=quote('lpa','## Important Dates','## Selected child programs')
 rows[row]['fieldProposals']['parentCycle']['evidence'].append(dict(sourceId='lpa',sourceUrl=s['originalUrl'],artifactPath=s['artifactPath'],artifactSha256=s['artifactSha256'],excerpt=ex,locator='Parent timeline; exact selected text'))
 put(row,'applicationMethod',{'scope':'LPA parent only','loginJoinMembershipHubScholarshipPortal':True,'portalOpensOctober15':True,'currentRouteUsability':None,'actionsPerformed':False},'lpa',[quote('lpa','## Ready to Apply?','[One unrelated')])
 if row in [164,165,166,169,171]:
  put(row,'identityObservation',{'exactSavedNameNotEstablishedAmongFiveRetrievedProgramHeadings':True,'absenceProvesClosure':False,'mappingOrReplacement':None,'parentTermsNotAcceptedForChild':True},'lpa',[quote('lpa','[One unrelated')],state='unverified')
for row,title,slots in [(167,'LPA Aerospace Degree Advancement Scholarship',3),(168,'LPA Aviation Maintenance Technician Scholarship',4),(170,'LPA Professional Flight Degree Scholarship',2),(172,'United Aviate Academy Scholarship',5)]:
 text=(ROOT/registry['lpa']['artifactPath']).read_text();start=text.index('### '+title);end=text.find('### ',start+4);end=end if end>=0 else text.index('## Ready to Apply?',start);ex=text[start:end].strip()
 put(row,'amount',{'currency':'USD','value':None,'literal':'Varies','recipientSlots':slots} if row!=172 else {'currency':'USD','range':[27000,122000],'amountsVary':True,'recipientSlots':5},'lpa',[ex])
 put(row,'identityObservation',{'exactNamedChildObserved':title,'savedIDMapping':'proposed/held; source continuity/current cycle unverified'},'lpa',[ex])
 if row==167:val={'enrolledOrAcceptedAccreditedInstitution':True,'aerospaceFieldsExamples':['engineering','business','aircraft maintenance','air traffic control','dispatch','aerospace technology'],'supports':['education','certifications','specialized training'],'flightTrainingExcluded':True}
 if row==168:val={'pursuing':['FAA certified Airframe and Powerplant mechanic','Inspection Authorization'],'andOr':True,'supports':['tuition','technical training','required certifications'],'enrolledOrPlanningToEnrollFAARecognizedAPProgram':'US or territories','parentAccreditedEnrolledAcceptedTermsSeparate':True}
 if row==170:val={'enrolledOrAcceptedAccreditedProfessionalFlightDegree':True,'supports':['tuition','flight fees','required training associated with university or collegiate aviation programs']}
 if row==172:val={'conditionallyAcceptedOrCurrentlyEnrolled':'United Aviate Academy','ageMinimum':18,'aspiringProfessionalPilots':True,'payment':'direct to Academy','fundsNontransferable':True}
 put(row,'eligibility',val,'lpa',[ex])
# Rollins: exact dated claims, saved and new form locators distinct.
put(173,'amount',{'currency':'USD','firstPlace':10000,'runnerUp':5000,'oneCommonProgramTwoPlacesNotTwoNewAwards':True},'rollins')
put(173,'eligibility',{'highSchoolSenior':True},'rollins')
put(173,'materials',{'essayMinimumWords':500,'selectionTopics':['life stories','intended fields','careers','impact on world']},'rollins')
put(173,'deadline',{'date':'2027-01-15','time':'23:59','zoneLiteral':'EST','lateResponsesNotConsidered':True},'rollins')
put(173,'cycle',{'literal':'WINTER 2027 SCHOLARSHIP NOW OPEN','independentCurrentOfferingAccepted':False},'rollins')
put(173,'selection',{'judges':3,'mostCompellingStories':True,'notification':'early FEB 2027'},'rollins')
put(173,'applicationMethod',{'savedTally':'https://tally.so/r/rjPRGR','currentLinkedTally':'https://tally.so/r/EkjjV4','bothLocatorOnly':True,'sourceSaysConfirmation':'Thank You page; no confirmation email','currentRouteUsability':None,'actionsPerformed':False},'rollins')
# BLF parent and linked public document: no raw file or applicant values retained.
put(174,'eligibility',{'highSchoolSeniors':True,'GoldStarChildrenOrSiblings':True,'fourYearCollegeInFall':True,'parentSaysFall2026':True,'scope':'Gold Star Senior only; no camp or existing-college track'},'looney')
put(174,'renewability',{'parentOneTimeScholarship':True,'futureReapplicationPolicy':None},'looney')
put(174,'cycle',{'parentAwardFall':2026,'pdfTitleAcademicYear':'2026-2027','PDFEnrollmentFall':2026,'currentOpenOffering':None},['looney','looney-pdf'])
put(174,'opening',{'monthDay':'03-01','explicitYear':None},'looney')
put(174,'deadline',{'monthDay':'05-31','explicitYear':None,'time':None,'zone':None},'looney')
put(174,'materials',{'completedBLFApplicationPages':2,'twoNonrelativeCharacterReferenceLetters':'forms included in conversion','checklist':['essays as applicable','copy Military ID, DD form 1300'],'separateInstruction':'include copy DD1300','transcripts':'all high schools attended/currently attending even if no grades; each school if several','essay':{'chooseOne':True,'format':'MS Word','pages':1,'doubleSpaced':True,'font':'Times new Roman','fontSizePt':12,'prompts':['family member Armed Forces service inspiration/influence','meaning of Service Honor Commitment','own service to community/others inspiration']},'communityServicePromptObserved':True,'completeFieldsCertificationVisualsUnknown':True},'looney-pdf')
put(174,'payment',{'directAcademicInstitution':True},'looney-pdf')
put(174,'applicationMethod',{'downloadAndSubmitToAddressInApplication':True,'mailingValueOmitted':True,'routeUsability':None,'actionsPerformed':False},'looney')
# NGPA: preserve common conditions and conflicts without inventing award-specific rules.
commonMain=quote('ngpa','**Universal Requirements:**','[Unrelated award-table')
for row in range(175,184):
 put(row,'membership',{'activeNGPAMemberRequired':True},'ngpa',[commonMain])
 put(row,'parentGeneralRequirements',{'scope':'NGPA common requirements; not accepted child truth','ageMinimum':18,'flightTrainingOnlyMedical':'current third class at least (main); FAA first/second/third or nation equivalent (FAQ)','flightTrainingOnlyStudentPilotCertificateAtLeast':True,'nonFlightTrainingMedicalRequired':False,'BasicMed':'considered only, not accepted substitute','alliesWelcomeWithDocumentableLGBTQAdvocacy':True},['ngpa','ngpa-about'],[commonMain,quote('ngpa-about','**I am a member of NGPA','**I am not a U.S.')])
 # Exact flight/medical excerpts separate from allies paragraph.
 for a,b in [('**I am new to aviation','**Where do I apply'),('**Is an FAA medical required','**I am looking for additional')]:
  s=registry['ngpa-about'];rows[row]['fieldProposals']['parentGeneralRequirements']['evidence'].append(dict(sourceId='ngpa-about',sourceUrl=s['originalUrl'],artifactPath=s['artifactPath'],artifactSha256=s['artifactSha256'],excerpt=quote('ngpa-about',a,b),locator='Common FAQ conditional medical/certificate scope'))
 put(row,'parentNationalityScope',{'NGPANamed':'open regardless where live or learn to fly','someScholarshipsNonUSCitizenEligible':True,'mostIndustrySponsoredRequireUSWorkAuthorization':True,'specificSponsorChildWorkAuthorization':None,'USCitizenshipRequired':None,'notInferredFromSponsorName':True},'ngpa-about',[quote('ngpa-about','**I am not a U.S.','**I am new to aviation')])
 put(row,'materials',{'scope':'common preparation guidance, exact child package/current cycle unverified','common':['photo ID','aviation/aerospace certificates or nation equivalent','postsecondary transcripts as applicable','one-page resume','employment and community-service history month/year','why scholarship deserved','1–5 year aviation goals','unique financial need/mitigation','service reflects NGPA mission'],'preparePage':['high-school diploma or secondary school academic records','other training certificates','LGBTQ+ advocacy/volunteer/Q+ club history'],'FAQ':['high-school academic transcripts','aviation resume strongly requested'],'flightConditional':['medical or nation equivalent','all checkride flights and DPE comments'],'logbookVariants':{'prepare':'at least last 50 flight-training hours; if fewer include all','FAQ':'last twenty flights'},'householdIncomeDocumentation':'competitive but not required per FAQ','variantsNotCollapsed':True},['ngpa-prepare','ngpa-about'],state='conflict')
 put(row,'needSelection',{'commonPrompt':'unique need and mitigation','householdIncomeDocumentation':'competitive, not required','needThresholdOrRequiredIncomeLevel':None},'ngpa-about',[quote('ngpa-about','**How can I best prepare','**How do I attach multiple')])
 put(row,'cycle',{'mainBanner':'2026 closed to new applicants; 2027 opens June2027','prepareBody':'2026 now open','FAQ':'next opens June2027; also links 2025 awards and refers to2024 OPs','exactChosenState':None,'parentChildOpeningsNotAccepted':True},['ngpa','ngpa-prepare','ngpa-about'],[quote('ngpa','**2026 cycle','* * *'),quote('ngpa-prepare','## Prepare to Apply','**What will I need'),quote('ngpa-about','**When can I apply','**When I log in')],state='conflict')
 put(row,'opening',{'scope':'NGPA parent only','year':2027,'month':6,'day':None,'time':None,'zone':None,'childAvailabilityUnknown':True},'ngpa-about',[quote('ngpa-about','**When can I apply','**When I log in')])
 put(row,'applicationMethod',{'scope':'NGPA common FAQ','ReviewrViaNGPASiteWhenOpen':True,'singleUniversalApplicationAllEligibleScholarships':True,'specialProgramsDocumentAcceptance':True,'semifinalistsCanPrioritize':'if no preference match highest eligible value','applicantMustCompleteOwnApplication':True,'proofreadingMentorHelpAllowed':True,'confirmation':'Reviewr email plus account status per FAQ, not tested','updatesBeforeWindowCloses':'FAQ also carries dated2024 wording; do not infer future lock policy','actualAccessVerified':False,'actionsPerformed':False},'ngpa-about')
 put(row,'sourceInspectionLimit',{'selectedHTMLTextOnly':True,'noRawImagesPortalInspection':True,'sourceRevisionOriginCurrencyUnknown':True,'parentMaterialAndCycleVariantsUnresolved':True},['ngpa','ngpa-prepare','ngpa-about'],state='unverified')
 names={175:'Elevated Access Flight Training Scholarship',176:'Endeavor Air Flight Training Scholarship',177:'FedEx Flight Training Scholarship',178:'GoJet Airlines Flight Training Scholarship',179:'LogTen Pro CFII Training Scholarship',180:'NGPA General Aviation Scholarship',181:'NGPA Transgender & Non-binary Committee Scholarship',182:'NGPA Women’s Committee Scholarship',183:'PSA Airlines Aircraft Mechanic Scholarship'}
 matches=[line for line in (ROOT/registry['ngpa']['artifactPath']).read_text().splitlines() if line.startswith('| **'+names[row]+'**')]
 assert matches
 put(row,'identityObservation',{'exactNamedChildObserved':names[row],'savedIDMapping':'proposed/held','separateFromLPAAndOtherNamedChildren':True},'ngpa',['\n'.join(matches)])
 if row==176:amount={'currency':'USD','variants':[4000,2400,2000],'oneNamedInputNotThreeNewAwards':True,'recipientSlots':None}
 elif row==180:amount={'currency':'USD','variants':[{'perRecipient':5000,'slots':3},{'perRecipient':10000,'slots':2},{'perRecipient':15000,'slots':1}],'oneNamedInputNotSixAwards':True}
 else:amount={'currency':'USD','value':{175:10000,177:6000,178:1500,179:3000,181:5000,182:5000,183:4500}[row],'recipientSlots':None}
 put(row,'amount',amount,'ngpa',['\n'.join(matches)])
 vals={175:{'pursuingStepsAfterObtainingPrivate':True,'includesTravel':'2027 Palm Springs NGPA events'},176:{'flightStudentOrCFI':'at a Propel Affiliate School'},177:{'pursuing':'aviation flight training'},178:{'pursuing':'aviation flight training'},179:{'pursuing':'CFII training'},180:{'memberPursuing':'general aviation interests'},181:{'outstandingAdvocate':'transgender or gender-diverse','studyingOrTraining':'work in aviation industry','applicantGenderIdentityRestriction':None},182:{'outstandingAdvocate':'LGBTQ+','studyingOrTraining':'work in aviation industry','applicantWomenOnlyRestriction':None},183:{'workingToward':'A&P license','career':'aircraft maintenance technician'}}
 put(row,'eligibility',vals[row],'ngpa',['\n'.join(matches)])
 if row!=183:put(row,'payment',{'cashAward':True,'directTo':'school where studying/training' if row in [181,182] else 'flight school where training','actualTransferPerformed':False},'ngpa',['\n'.join(matches)])
# Pre-freeze completeness refinement is recorded in author-completeness.json; do not rerun this assembler.
fields=sum(len(r['fieldProposals']) for r in records);oldfields=sum(len(r['fieldProposals']) for c in prior for r in c['records'])
assert oldfields==3033
ledger=dict(schemaVersion=1,checkpoint=9,entryCommit=ENTRY,queueSha256=sha((B/'queue.json').read_bytes()),queueOffsetStart=160,queueOffsetEndExclusive=180,
 orderedInputKeys=[r['inputKey'] for r in records],records=records,sourceRegistry=reg,acceptedFacts=0,researchComplete=True,researchCompleteMeaning='Exactly twenty frozen inputs have initial held outcomes; not full facts/completeness or accepted awards',independentReview='pending frozen candidate review',completedAt=now,fullSD2Complete=False,canonicalAcceptance=False,SD3Started=False,
 coverage=dict(checkpointInputs=20,fieldEnvelopes=fields,sourceReceipts=len(reg),outcomes=dict(collections.Counter(r['outcome'] for r in records)),cumulativeInitialDispositions=180,cumulativeAutonomousHeldFields=oldfields+fields,cumulativeAutonomousHeldIdentities=180,unprocessedInputs=226),nextCheckpointInputOffset=180,nextInputKey=q['records'][180]['inputKey'],
 priorHolds=dict(unchangedPaths=[str((B/f'checkpoint-{i:03d}.json').relative_to(ROOT)) for i in range(1,9)],fields=oldfields,identities=160,allEarlierPacketsPRELUDESection9M1Routes='byte-preserved with original owners/triggers'),preservedGates=prior[-1]['preservedGates'],
 sourcePolicyDeviations=[dict(issue='First sanitized preview still forwarded unrelated LPA dispatcher/sponsor-security scope, unrelated NGPA award rows, Looney camp/college/navigation/account boilerplate and later one public postal address. Actual contacts were mostly masked, but selection was insufficient.',containment='Final artifacts narrow exact selected program scope, omit contact/address/account/navigation/recipient values, images and unrelated award details. No raw full envelopes/files retained. Prior tool output cannot be erased by later sanitization.',owner='Codex source/evidence owner',trigger='Before each next permitted source call/output',nextAction='Select minimal program scope and sanitize every text/image/metadata value before forwarding. Provider redactPII is insufficient alone.')],
 limits=['No workbook read/write, applicant data, login/form action/contact/messages, app/config/CI, remote Git/release/activation or SD3.', 'All observations/identities held; current native sponsor continuity, source revisions, origin currency, raw/page/image completeness and full current offering unknown.', 'BLF PDF readable conversion only; no raw download, rendered pages or certification/full-field completeness. Provider identity redactions and checkbox conversion limit exact continuity.', 'LPA absence does not prove closure; NGPA common materials/cycles have unresolved variants. Parent terms never become accepted child criteria.', 'Prior WET/Clerk/Davis/interim-receipt/rawbatch rejection and temporary-custody limitations remain with original routes; no reacquisition/replay.', 'Standard build/fresh authenticated main-target and every later preservation/acceptance/student/monitor/effect gate retain original owner/trigger.'])
save(B/'checkpoint-009.json',ledger);save(P/'source-receipts.json',reg)
print(json.dumps(ledger['coverage'],indent=2));print('NEXT',q['records'][180]['inputKey'],q['records'][180]['recordedName'])
