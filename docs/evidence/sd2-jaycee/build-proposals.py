"""Build held field proposals from the two complete, already captured documents."""
from pathlib import Path
import hashlib,json,re
P=Path(__file__).resolve().parent
def read(n):return json.loads((P/n).read_text())
def sha(b):return hashlib.sha256(b).hexdigest()
def dump(n,d):(P/n).write_text(json.dumps(d,indent=2,ensure_ascii=False)+'\n')
records=[]; evidence=[]
comparison=read('identity-comparison.json')
for index,(row,kind,gpa,levels,slots) in enumerate([(40,'vocational',3.25,[1000,1500],10),(68,'university',3.75,[2000,2500],50)]):
 http=read(kind+'-http.json'); extraction=read(kind+'-extraction.json');text=(P/(kind+'-source.txt')).read_text()
 comp=comparison['records'][index]
 record={'inputRecord':{'ledgerPath':'docs/evidence/sd2-first-batch/inventory-ledger.json','rowLocator':row,
 'ledgerRowOutcome':'named_identity_pending','ledgerIdentityResolution':'name_duplicate_hold',
 'recordedName':'Montana Jaycee Foundation Scholarship'},
 'freshDetailCapture':f'row{row}-before.json','closingCapture':'rows-after.json',
 'outcome':'held','identityHoldPreserved':True,'existingPublicIdCandidate':comp['existingPublicId'],
 'existingCanonicalIdCandidate':comp['existingCanonicalId'],
 'mappingAcceptance':'held','newAwardId':None,
 'proposedDisposition':'retain separate vocational and college/university program-track candidates; preserve both existing IDs and both input records pending sponsor/route/version continuity evidence and human review',
 'sourceUrl':http['url'],'fields':{},'acceptedFacts':0}
 scope={'subject':f'selected-input-locator-{row}', 'programTrack':kind,
 'providerDocumentLabel':'SCHOLAR:2026-2027', 'graduatingClass':2027,
 'identityBinding':'held; evidence supports document-scoped proposals, not acceptance against the Montana-named record',
 'asOf':http['observedAt']}
 def field(name,value,state,quotes=(),reason=None,freshness='applicable'):
  excerpts=[];locators=[]
  for q in quotes:
   assert q in text,(kind,name,q)
   # Local render page locator independently corroborates the exact textutil excerpt.
   tokens=lambda s:re.sub(r'\s+','',s)
   pages=[p['page'] for p in extraction['pages'] if tokens(q) in tokens(p['text'])]
   excerpts.append(q);locators.append({'textutilExactExcerpt':q,'localRenderPages':pages})
  ev={'inputRowLocator':row,'field':name,'value':value,'state':state,'scope':scope,
      'sourceUrl':http['url'],'sourceArtifact':kind+'-source.doc','sourceSha256':http['sourceSha256'],
      'extractionArtifact':kind+'-extraction.json','extractionSha256':sha((P/(kind+'-extraction.json')).read_bytes()),
      'observedAt':http['observedAt'],'excerpts':excerpts,'locators':locators,
      'completeSourceInspected':True,'absenceOrLimit':reason,'acceptance':'held','reviewer':None}
  ev['evidenceId']='evd_'+sha(json.dumps(ev,sort_keys=True,ensure_ascii=False).encode())
  evidence.append(ev)
  record['fields'][name]={'value':value,'state':state,'evidenceIds':[ev['evidenceId']],
      'scope':scope,'observedAt':http['observedAt'],'freshness':freshness,'acceptance':'held',
      'reason':reason}
 field('documentSponsor','United States JCI Senate Foundation','verified', ['United States JCI Senate Foundation'])
 field('documentAwardName', 'Vocational/Technical/Trade Scholarship' if kind=='vocational' else 'College/University Scholarship', 'verified',
       ['Vocational/Technical/Trade Scholarship Application' if kind=='vocational' else 'College/University Scholarship Application'])
 field('montanaSponsorRelationship',None,'unverified',reason='Neither complete document names Montana Jaycee Foundation or binds that organizer-recorded name to this national program; no parent or state list was selected.')
 field('applicationCycleLabel','SCHOLAR:2026-2027','verified',['SCHOLAR:2026-2027'])
 field('educationalStartYear',2027,'verified',['You must begin your educational program in 2027.' if kind=='vocational' else 'You must begin your college career in 2027.'])
 field('academicYear',None,'unstated',reason='Document form label and start year do not specify the full academic-year window.')
 field('deadline',{'value':'2027-01-12','purpose':'mailing and postmark','timezone':None,'precision':'date_only'},'verified',
       ['APPLICATIONS MUST BE MAILED AND POSTMARKED BY JANUARY 12, 2027.' if kind=='vocational' else 'APPLICATIONS MUST BE POSTMARKED AND MAILED BY JANUARY 12, 2027'])
 field('opens',None,'unstated',reason='No opening date stated anywhere in the complete document. A downloadable blank application does not prove an open state route.')
 field('availability',None,'unverified',reason='Document announces2027 grants; live open/closed state, state participation, destination contact and application route usability are outside selected evidence. No present-open inference.')
 field('entryGpa',{'minimum':gpa,'scale':None,'basis':None},'verified',[f'STUDENTS MUST HAVE A GPA OF {gpa} AND ABOVE TO BE CONSIDERED.'],reason='Threshold explicit; scale, weighting and calculation basis remain unverified. Do not assume4.0 scale or weighted/unweighted.')
 field('renewalGpa',None,'unstated',reason='No renewal GPA stated.')
 field('applicantStage',['hs_senior'],'verified',['Graduating high school seniors in the United States, who reside in a state that has a JCI Senate scholarship chairperson or contact.'])
 field('eligibilityConditions',{'operator':'AND','conditions':[
    {'kind':'stage','value':'graduating high school senior;2027 graduate'},
    {'kind':'citizenship','value':'U.S. citizen'},
    {'kind':'residence','value':'U.S. state with listed JCI Senate scholarship chairperson/contact','participatingStates':None},
    {'kind':'destination','value':'accredited U.S. vocational/technical/trade program' if kind=='vocational' else 'accredited U.S. college/university'},
    {'kind':'entryGpa','minimum':gpa,'scale':None},
    {'kind':'start','year':2027},
    {'kind':'attendance','value':'first year of full-time study immediately following high school graduation'}]},'verified',
    ['You must be a U.S. citizen to apply for this scholarship.',
     'If your state does not have a chairperson or contact listed, you are not eligible to apply.',
     'Scholarships must be used for tuition in the first year of full-time study immediately following high school graduation.'])
 field('montanaParticipation',None,'unverified',reason='Participating-state contact list is linked but not selected; no Montana/Whitefish eligibility assertion.')
 field('destinationScope',{'country':'United States','accreditationRequired':True,
    'description':'short-term specialized vocational, technical or trade programs, including qualifying community-college programs; not bachelor degree programs' if kind=='vocational' else 'post-secondary college or university; no degree-level or two/four-year classification supplied'},'verified',
    ['accredited school offering vocational, technical or trade programs within the United States.' if kind=='vocational' else 'accredited post-secondary college or university within the United States.'])
 field('schoolTypes',['trade'] if kind=='vocational' else [],'verified' if kind=='vocational' else 'unverified',
    ['Vocational/Technical/Trade'] if kind=='vocational' else [],
    reason='Community college is qualified by specialized program, not unrestricted two-year eligibility.' if kind=='vocational' else 'College/university wording retained; do not impose four-year-only or Any-school mapping.')
 if kind=='vocational':
  field('studyPaths',{'normalized':['certificate','associate'],'otherPublished':['diploma','license'],'bachelorExcludedByProgramDescription':True},'verified',
   ['Completion leads to a certificate, diploma, license, or associate degree, rather than a bachelor’s degree.'])
 else:field('studyPaths',None,'unstated',reason='No named degree path. College/university does not prove bachelor-only.')
 field('amount',{'currency':'USD','minimum':levels[0],'maximum':levels[1],'publishedDiscreteAmounts':levels,
    'basis':'one_time','use':'tuition in first year of full-time study immediately following high school graduation',
    'recipientSlots':slots,'payee':'school; check in recipient name','selectionBetweenAmounts':None},'verified',
    [f'Scholarship grants in amounts of ${levels[0]} or ${levels[1]} will be awarded',
    'Ten (10) grants will be awarded to 2027 graduates by the United States JCI Senate Foundation.' if kind=='vocational' else 'Fifty (50) grants will be awarded to 2027 graduates by the United States JCI Senate Foundation.'],
    reason='Amounts are alternatives, not a continuous promised range; slot counts are recipients, not independent awards. First-year tuition scope supports one-payment proposal; renewal rights are separately unstated.')
 field('fundingKind','gift','verified',['Scholarship grants in amounts'],reason='Document says grants, not loans; no inferred guaranteed receipt.')
 field('needRequired',None,'unstated',reason='Complete eligibility and financial sections state no financial-need threshold; silence is not not_required.')
 field('needSelection',None,'unverified',[
    'This financial section is to show your understanding of the costs of your education.',
    '5-B. FINANCIAL CONSIDERATIONS: (optional)',
    'Explain any personal, family or financial circumstances you believe merit consideration.'],
    reason='Optional financial-circumstances explanation is allowed. These questions do not establish an explicit judging rule or priority weight for need.')
 field('financialStatementAmbiguity',{'section5A':'financing explanation requested','section5B':'labelled optional','checklist':'questions5Aand5B answered'},'conflict',
    ['5-B. FINANCIAL CONSIDERATIONS: (optional)','Questions 5-A and 5-B are answered.'],reason='Checklist asks questions5-A and5-B answered while section5-B explicitly says optional. Preserve conflict; do not convert to a mandatory need condition.')
 field('renewal',None,'unstated',reason='First-year tuition use does not explicitly state nonrenewable status or renewal rights.')
 field('reapplication',None,'unstated',reason='No later competitive reapplication rule stated.')
 field('nomination',None,'unstated',reason='Educator reference and state processing are not evidence of a nomination requirement.')
 field('applicationMode','offline','verified',['All application materials MUST be submitted in one mailing.' if kind=='vocational' else 'All materials MUST be submitted in one mailing.',
    'NO ELECTRONIC SUBMISSIONS WILL BE ACCEPTED.'])
 field('applicationRouting',{'method':'postal package','recipientRule':'state scholarship chairperson/contact listed for residence state; contact may live in another state',
    'stateContact':None,'stateContactListInspected':False,'wrongAddressPackagesForwarded':False},'verified',
    ['Using the “State Chairman Contact List” locate the state where you live and submit your application to the state chairperson or contact listed for that state.'],
    reason='Actual contact/address and current mailing destination not inspected; no application interaction or linked-list read.')
 field('materials',{'personalStatement':{'minimumWords':300,'maximumWords':500,'wordCountIncluded':True},
    'referenceLetters':{'maximum':3,'minimumEducatorReferences':1},
    'transcript':{'currentHighSchoolRequired':True,'includeClassGradesOrScores':True},
    'acceptanceLetter':'include if already accepted',
    'supportingDocumentation':'up to3 pages of applicant choice; checklist asks attachment; no invented universal3-page minimum',
    'photo':'optional but encouraged',
    'schoolCommunityEmploymentStatements':'separate attached responses for sections7,8,9',
    'financialStatement':'first year or total vocational program cost' if kind=='vocational' else 'first-year costs',
    'typedPackage':'black ink; single-sided; numbered; prescribed order; stapled; checklist first; exclude first two instruction pages'},'verified',
    ['Complete a statement of 300 to 500 words, indicating your chosen field of study.',
     'REFERENCE LETTERS (maximum of three (3) letters)',
     'At least one reference letter must be from an educator.',
     'A copy of your current high school transcript MUST be included.'])
 field('testScores',{'required':False,'includeIfAvailable':True,'selectionPointsMayBeAwarded':True if kind=='university' else None},'verified',
    ['NOTE: The ACT/SAT scores are not required.' if kind=='vocational' else 'NOTE: The ACT/SAT scores are not mandatory, but judging points may awarded for the test scores.'])
 field('focus',{'description':'vocational/technical/trade paths; examples non-exhaustive' if kind=='vocational' else 'chosen field explained in statement; no major restriction stated',
     'mandatoryMajor':None},'verified' if kind=='vocational' else 'unstated',
     ['Fields of study may include, but are not limited to:'] if kind=='vocational' else [],
     reason='Do not limit vocational focus to construction or map university Any to unrestricted verified eligibility.')
 field('otherEligibility',{'ageThreshold':None,'GED':None,'gapYear':None,'membership':None,'gender':None,'disability':None,'ethnicity':None},'unstated',reason='No extra explicit rule in complete selected documents; no negative values or unrestricted claims. Immediate full-time post-high-school study requirement stays separate.')
 record['observedCellDifferences']=[{'column':'A','recorded':'2026-01-12','documentProposed':'2027-01-12','state':'held'},
    {'column':'E','recorded':'$1,000' if kind=='vocational' else 'Up to $2,000','documentProposedDiscreteAmounts':levels,'state':'held'},
    {'column':'N','recorded':'statement up to500words; up to3references; counselor deadline confirmation',
     'documentProposed':'300-500words with word count; at least1educator reference; mailed/postmarked2027-01-12; current state destination still unknown','state':'held'}]
 record['unknowns']=['Montana sponsor relationship; current participating-state list and actual submission destination',
    'Route/version continuity to preserved app/canonical identity and older Google Doc aliases',
    'Opening date, usable open route, GPA scale/weighting/basis, amount-selection basis',
    'Need judging rule and optional5-B/checklist conflict; renewal/reapplication/nomination unstated',
    'Full population identity/collision/relationship reconciliation; human fact reviewer not named']
 records.append(record)
dump('proposals.json',{'schemaVersion':1,'scope':'selected two-record SD2 continuation; all facts/mappings held',
 'entryBaseline':'f742890','orderedInputLocators':[40,68],'records':records,'evidence':evidence,
 'acceptedFacts':0,'humanFactReviewer':None,'fullSD2Complete':False,'SD3Started':False,
 'continuationLedger':{'parent':'docs/evidence/sd2-first-batch/inventory-ledger.json','parentSha256':sha((P.parent/'sd2-first-batch/inventory-ledger.json').read_bytes()),
 'identityKey':'original selected-copy ledger row + exact native name/source projection; row is only a locator, not a stable award ID',
 'outcomes':[{'parentRowLocator':r['inputRecord']['rowLocator'],'outcome':r['outcome'],'identityHoldPreserved':True,'proposalRecordIndex':n} for n,r in enumerate(records)],
 'noSecondReviewsQueue':True},
 'denominators':{'savedSelectedRows':794,'savedNamedRows':411,'savedEmptyProjectionRows':383,'savedUniqueExactNames':410,
 'previousResearchRows':3,'thisCheckpointRows':2,'cumulativeBoundedResearchRows':5,'remainingNamedRowsWithoutSelectedResearch':406,
 'thisCheckpointSources':2,'sourceDocumentsComplete':2,'futureDistinctAwardCount':None,'appRecords':411,'M1Records':437,
 'limits':'Local research coverage accounting only; no new inventory capture, closed identity hold, accepted award count or canonical completeness claim.'},
 'inferences':['The two named document tracks support preserving separate candidates; shared sponsor and duplicate organizer name do not justify merging.',
 'GPA/destination differences corroborate possible continuity to two existing app IDs; historical route change and Montana relationship keep mapping held.']})
print(f'PASS: {len(records)} held input outcomes; {len(evidence)} field-evidence envelopes; acceptedFacts0')
