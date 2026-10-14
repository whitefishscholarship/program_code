"""One-time author-only three-finding correction; no capture, builder, or replay."""
from pathlib import Path
import json,hashlib,subprocess,datetime
P=Path(__file__).resolve().parent;ROOT=P.parents[3];B=P.parent
load=lambda p:json.loads(p.read_text());sha=lambda b:hashlib.sha256(b).hexdigest()
g=lambda *a:subprocess.check_output(['git',*a],cwd=ROOT)
old='4373ca3b96bd47b47d880b6e740130cba2445a97';lp=B/'checkpoint-007.json';original=load(lp)
assert lp.read_bytes()==g('show',old+':'+str(lp.relative_to(ROOT)))
assert not (P/'remediation.json').exists()
assert sha((P/'manifest-round1.json').read_bytes())==load(P/'review-round1.json')['binding']['manifestSha256']
paragraph='Probably not, but you should review the eligibility criteria to check based on your specific context. You must be **enrolled** at an institution of higher education and be receiving degree credits from that institution. Advanced placement courses while in high school generally do not meet those requirements, though part-time college enrollees who are still in high school **may** be eligible.'
f=P/'sources/davis-faq.md';text=f.read_text();marker='### I am still in high school, but I am taking college courses. Can I apply for a grant for these courses?\n\n[contact line omitted]'
assert marker in text;text=text.replace(marker,marker.replace('[contact line omitted]',paragraph));f.write_text(text)
ledger=load(lp);reg={s['sourceId']:s for s in ledger['sourceRegistry']};s=reg['davis-faq'];s['artifactSha256']=sha(f.read_bytes());s['sanitizationRecovery']={'scope':'Restore substantive high-school/degree-credit answer from original in-session captured response; contact sentence/link excluded','newSourceRead':False,'rawFullEnvelopeHashRetained':False,'originalCallWindow':{'startedAt':s['start'],'completedAt':s['end']},'provenanceLimit':'Recovered wording was verified in retained in-session original tool result; no raw full-envelope hash or independent source refresh. Original sanitized omission remains in immutable candidate4373ca3.'}
rows={r['rowLocator']:r for r in ledger['records']};r=rows[131];r['fieldProposals']['eligibility']['value']['highSchoolDualEnrollment']={'degreeCreditsAtHigherEducationInstitutionRequired':True,'APGenerallyDoesNotMeetRequirement':True,'partTimeCollegeEnrolleeStillInHighSchoolMayQualify':True,'automaticEligibility':False,'qualifiedContextReviewRequired':True}
r['fieldProposals']['eligibility']['evidence'].append({'sourceId':'davis-faq','sourceUrl':s['originalUrl'],'artifactSha256':s['artifactSha256'],'excerpt':paragraph,'locator':'FAQ high-school/college-course answer; recovered original in-session capture, no new fetch'})
addition=' Preserve degree-credit highereducation enrollment, AP generally-not-qualifying and conditional parttime-college/HS exception; contact-only sentence omitted, original capture recovery/no raw full-envelope hash explicit.'
r['nextAction']+=addition
for d in list(r['fieldProposals'].values())+r['seedDispositions']:d['nextAction']+=addition
for record in ledger['records']:
 for field in record['fieldProposals'].values():
  for e in field['evidence']:
   if e['sourceId']=='davis-faq':e['artifactSha256']=s['artifactSha256']
for row,sid in [(124,'jean-pdf'),(125,'kiita-pdf'),(126,'coffee-pdf'),(127,'seeley'),(134,'wet-pdf')]:
 r=rows[row];field=r['fieldProposals']['applicationMethod'];source=reg[sid]
 value={'sourceDescribedMethod':'online WCF scholarship portal' if row in [124,125,126] else 'MCF scholarship portal with published access code' if row==127 else 'mailed paper application OR online alternative','currentRouteUsability':None,'currentPublicAccess':None,'identityAcceptance':'held','currentApplicableCycle':None,'actualApplicationAccessVerified':False,'loginFormSubmissionContactActions':False,'applicationPortalVisited':False}
 if row in [124,125,126]:value.update(onlineSubmissionRequired=True,portalLocator='https://www.grantinterface.com/Home/Logon?urlkey=wcfscholarship',sharedRouteDoesNotMergeNamedAwards=True);excerpt='Applications must be submitted online.'
 elif row==127:value.update(portalLocator='https://www.grantinterface.com/Home/Logon?urlkey=mtcfscholarship',publishedApplicationAccessCode='26SFMS');excerpt='Use this Access Code to apply directly for this scholarship within the'
 else:value.update(alternativeMethods=['mailed paper application','online through published program link'],mailingContactValuesExcluded=True);excerpt='Applications can also be submitted'
 assert excerpt in (ROOT/source['artifactPath']).read_text()
 field.update(value=value,state='verified',acceptance='held',sourceScope='Observed source-described submission method only; current route usability/identity/cycle unverified',evidence=[{'sourceId':sid,'sourceUrl':source['originalUrl'],'artifactSha256':source['artifactSha256'],'excerpt':excerpt,'locator':'Program application submission instructions'}])
 if row==127:field['evidence'].append({'sourceId':sid,'sourceUrl':source['originalUrl'],'artifactSha256':source['artifactSha256'],'excerpt':'26SFMS','locator':'Published application access code; not private credential'})
 if row==134:field['evidence'].append({'sourceId':sid,'sourceUrl':source['originalUrl'],'artifactSha256':source['artifactSha256'],'excerpt':'Application and all required attachments should be submitted to:','locator':'Paper submission instructions; contact/mailing values excluded'})
 action=' Preserve observed submission method as held source-scoped fact separately from unverified route usability/current cycle/identity; all portal/form/contact actions remain false.'
 r['nextAction']+=action
 for d in list(r['fieldProposals'].values())+r['seedDispositions']:d['nextAction']+=action
ins=load(P/'native-inspection.json')
for d in ins:
 d['receiptStatus']='interim extraction observation, superseded for final retained-text binding'
 d['finalRetainedTextVerificationPath']='docs/evidence/sd2-autonomous/checkpoint-007/document-inspection.json'
 d['originalReceiptImmutableCandidate']=old
 if d['id']=='luedke':d['selectedTextBindingLimit']='Historical selectedTextSha256 predates final mailing-value sanitization and does not match current selectedTextPath; use final document-inspection.json. Original hash retained intentionally.'
(P/'native-inspection.json').write_text(json.dumps(ins,indent=2)+'\n')
lp.write_text(json.dumps(ledger,indent=2,ensure_ascii=False)+'\n');(P/'source-receipts.json').write_text(json.dumps(ledger['sourceRegistry'],indent=2,ensure_ascii=False)+'\n')
findings=load(P/'review-round1.json')['findings'];out={'originalCandidate':old,'originalManifestSha256':sha((P/'manifest-round1.json').read_bytes()),'originalReviewSha256':sha((P/'review-round1.json').read_bytes()),'recordedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'requiredFixCount':3,'dispositions':[{'findingId':x['id'],'severity':x['severity'],'status':'author-fixed-awaiting-independent-recheck','rationale':{'SD2-007-M1':'Restored qualified dual-enrollment/AP answer from original in-session capture without contact sentence; updated held eligibility/evidence/hash/routes and disclosed missing raw-envelope hash. No refresh.','SD2-007-M2':'Retained observed online/portal or paper-online methods for all five rows with exact evidence; actual access/usability/identity/cycle remain unknown, all actions false.','SD2-007-L1':'Labeled every original extraction entry interim/superseded for final selected-text binding, explicitly documented Luedke historical mismatch and routed final proof to document-inspection.json; preserved original keys/hashes and immutable original candidate.'}[x['id']],'owner':'Codex implementation author','target':'Replacement frozen checkpoint007 candidate'} for x in findings],'noNewSourceReadBuilderResetOrReplay':True}
(P/'remediation.json').write_text(json.dumps(out,indent=2)+'\n')
print({'fixed':3,'fieldEnvelopes':ledger['coverage']['fieldEnvelopes'],'acceptedFacts':0,'newSourceReads':0})
