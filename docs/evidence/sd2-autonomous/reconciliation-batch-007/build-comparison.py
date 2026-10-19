"""Build the exact selected saved-evidence view; no network or raw/native reads."""
from pathlib import Path
import collections
import hashlib
import json

P=Path(__file__).resolve().parent; R=P.parents[3]
load=lambda p:json.loads(p.read_text())
sha=lambda b:hashlib.sha256(b).hexdigest()
canon=lambda x:json.dumps(x,sort_keys=True,separators=(',', ':'),ensure_ascii=False).encode()
selection=load(P/'selection.json'); packet_path='docs/evidence/sd2-autonomous/checkpoint-001.json'
packet=load(R/packet_path); pins={}
def ref(path,pointer=''):
    path=str(path); digest=sha((R/path).read_bytes()); assert path not in pins or pins[path]==digest
    pins[path]=digest; return dict(path=path,sha256=digest,pointer=pointer)
def write(name,x):(P/name).write_text(json.dumps(x,indent=2,ensure_ascii=False)+'\n')
S='existing evidence consistent'; U='applicability/identity unresolved'; E='evidence unavailable'; C='existing evidence conflicting'
def note(category,comparison,proof):
    return dict(category=category,comparison=comparison,minimumAdditionalProof=proof,proposalOnly=True,originalHoldRetained=True,newReadSelected=False)
# Preselected envelope excerpts and relevant shared passages only; parent metadata is not child evidence.
registry={s['sourceId']:(i,s) for i,s in enumerate(packet['sourceRegistry'])}
contexts=[]
for sx in selection['selectedComparison']['sources']:
    sid=sx['sourceId'];source=registry[sid][1];text=(R/source['artifactPath']).read_text();quotes=[]
    for item in selection['selectedComparison']['orderedInputs']:
        for env in packet['records'][item['queueOffset']]['fieldProposals'].values():
            for ev in env['evidence']:
                if ev['sourceId']==sid:
                    q=ev['excerpt']
                    if sid=='rh-old' and item['queueOffset']==17 and q.startswith("**Odd Fellows"):
                        q=q.split('\n\n####')[0]
                    if sid=='rh-old' and item['queueOffset']==19 and q.startswith('**Servant Leadership'):
                        q=q.split('\n\n01.')[0]
                    if q not in quotes:quotes.append(q)
    if sid=='rh-old':
        for start,end in [('09. Do I have to submit','12. Can I reapply'),('14. How will I receive','15. How will my award')]:
            a=text.index(start);z=text.index(end,a);q=text[a:z].rstrip()
            if q not in quotes:quotes.append(q)
        q=next(line for line in text.splitlines() if line.strip().startswith('- No. We have set a firm deadline of March 1st'))
        if q not in quotes:quotes.append(q)
    passages=[]
    for q in quotes:
        a=text.find(q);assert a>=0,(sid,'missing selected quotation')
        passages.append(dict(startCharacter=a,endCharacter=a+len(q),quote=q))
    contexts.append(dict(sourceId=sid,artifactReference=ref(source['artifactPath']),permittedInputKeys=sx['permittedInputKeys'],passages=passages,
        locatorConvention='Zero-based Unicode codepoint offsets in exact UTF-8-decoded saved artifact; selected occurrence only',
        scopeLimit='Selected saved excerpts/general passages only; No inherited child facts. No full/native/visual/current proof, biographies or unrelated award semantics.'))
write('selected-context.json',dict(scope='Selected-passage reference view, not new capture or authoritative registry',sources=contexts))
notes={}
common={
'amount':(S,'Servant named statement gives one500USD recipient slots; original perRecipient500 remains held. No current guarantee, extra identity or multiplied funding total.','Applicable exact-child/cycle amount and recipient allocation before current or accepted use.'),
'minimumGPA':(U,'Exact Servant child states2.0orhigher. Copied generic-AMTOPP note remains unchanged and flagged as annotation drift, not affinity or substituted rules. Scale/weighting/current applicability remain held.','Applicable exact-child/cycle GPA threshold/basis; any annotation correction separately selected.'),
'gpaBasis':(U,'Historical College/Leadership cumulativeHS4.0 scoring does not establish current Servant entry-GPA scale or weighting. Original null remains.','Applicable named-child entry-GPA calculation/scale/weighting separate from scoring.'),
'schoolType':(U,'Servant HS Senior is applicant stage, not an institution-type, required degree or agriculture-major rule. Original schoolType:null remains.','Applicable child/cycle institution/program criteria without converting stage into school type.'),
'residency':(U,'Montana FFA or sponsor geography does not establish Servant applicant residence. Original null remains.','Applicable exact-child residence rule or complete field-scope silence proof.'),
'membership':(S,'Exact Servant child states FFA member. No borrowed tenure, two-AgEd-year or sibling-child condition.','Applicable exact-child/cycle membership and any separately supported tenure condition.'),
'needRequirement':(U,'Historical College/Leadership financial-need judging is not Servant hard need eligibility. Original null remains.','Applicable child need eligibility separate from scoring/priority.'),
'needPriority':(U,'Historical shared scoring/weights do not establish current Servant need ranking. No other-child weight is inherited.','Applicable exact-child/cycle judging treatment of financial need.'),
'renewability':(S,'RHM shared FAQ describes nonrenewable year-by-year awards, new annual applications and reevaluation while eligible. Servant is named in that shared application; no automatic or guaranteed repeat funding.','Applicable named-child/cycle shared-route continuity and separate ongoing eligibility.'),
'gapYears':(U,'Servant HS Senior remains an OR. It establishes neither generic gap-year permission/prohibition nor postgraduate eligibility.','Applicable exact-child/cycle stage and gap-year rule without changing alternatives.'),
'deadline':(U,'RHM yearlessMarch1/11:59PM MST, FFA March1,2026 and historical2021/December31 remain distinct. No current Servant or2027deadline inferred.','Applicable child/cycle deadline year/purpose/time and version applicability.'),
'applicationWindow':(U,'AnnualJanuary1-March1/currentYear:null stays shared context. Mixed FFA historical versions establish no current Servant opening.','Applicable child/cycle opening/closing proof without current-open inference.'),
'cycle':(U,'Original2026-03-01 applications,2021-06-28 guideline,olderDecember31,nextCycle:null remain distinct versions, not a synthesized current cycle.','Explicit applicable child/cycle/version continuity or retained unknown.'),
'applicationMethod':(U,'Shared RHM/FFA online route and historical College/Leadership links remain unvisited locators. portalRead:false stays; no current usable or accepted destination.','Applicable named-child/cycle public method and route relationship, no portal interaction.'),
'materials':(U,'Shared supplements/transcript guidance, historical college photo/adviser-community references, scoring prompts and later thank-you/enrollment/classes/payment tasks do not establish a complete current Servant checklist.','Applicable complete child/cycle checklist separating initial, rubric and awardee timing.'),
'namedEligibilityStatement':(S,'Preserve exact Servant child: one500USD slots,HS Senior,GPA2.0orhigher,FFA member. No institution/degree/tenure rule inferred or OR changed to AND.','Applicable exact-child identity/cycle and typed qualifier proof before acceptance.'),
'recipientSlots':(S,'One Servant slot remain potential recipients, not a new award ID, guaranteed current awards or a funding total.','Applicable named-child/cycle recipient allocation before current or stronger use.'),
}
notes[19]={k:note(*v) for k,v in common.items()}
notes[19]['namedEligibilityStatement']=note(S,'Exact Servant child prefix says one500USD slot,HS Senior,FFA member,GPA2.0orhigher. Original envelope also contains a sharedFAQ annex; preserve it whole but do not assign annex text child-only eligibility meaning. No stage/degree/tenure expansion or accepted mapping.','Applicable exact-child/cycle typed conditions,with child sentence separately located from sharedFAQ policy.')
notes[19]['gapYears']=note(U,'Servant child says HS Senior. Shared/historical senior-freshman guidance does not expand that stage or establish a generic gap-year rule.','Applicable exact-child/cycle stage and gap-year criteria.')
notes[19]['schoolType']=note(U,'Servant child HS Senior is applicant stage,not institution type or degree. No other FFA child institution/major rule is borrowed; original null remains.','Applicable exact-child/cycle institution/program wording without sibling substitution.')
notes[19]['gpaBasis']=note(U,'Original note references historical cumulativeHS4.0 scoring. That annotation and historical rubric references do not establish a current Servant entry-GPA scale/weighting rule; original null remains.','Applicable exact-child/cycle entry-GPA basis separate from historical scoring.')
notes[19]['materials']=note(U,'Original materials:null remains. Retained sharedFAQ initial transcript/supplement wording,legacy references/scoring and later grade/enrollment/payment follow-up do not establish a complete current Servant checklist. Preserve annex once as original evidence but inspect exact relevant sentences only.','Applicable complete child/cycle checklist separating shared,initial,historical and awardee scope.')
notes[17]={
'amount':note(S,'Exact OddFellows detail states1000USD per recipient,matching original held amount. Recipient3+/1+ minima remain conflicting separately; no multiplied funding total/current guarantee.','Applicable exact-child/cycle amount and recipient allocation before current use.'),
'minimumGPA':note(U,'Original minimumGPA:null remains. Child GPA3.0orlower is a maximum,not minimum3.0 and not proof of no possible lower-bound rule.','Applicable exact-child GPA lower-bound wording or complete field-scope silence proof,kept distinct from maximum.'),
'gpaBasis':note(E,'No OddFellows GPA scale/weighting/calculation basis established. GPA3.0orlower alone supplies no4.0 scale.','Applicable exact-child/cycle GPA basis separate from threshold direction.'),
'schoolType':note(U,'Child plans college,university OR trade program following graduation. Original schoolType:null remains; no borrowed accreditation,major,Montana-school or four-year-only restriction.','Applicable exact-child/cycle mapping of education alternatives without sibling rule transfer.'),
'residency':note(E,'No applicant residence rule established in selected OddFellows child. Sponsor/school geography supplies none.','Applicable exact-child residence rule or complete field-scope silence proof.'),
'membership':note(S,'Child expressly does not require student or parent/guardian OddFellows/Rebekahs membership. This is scoped nonmembership,not unrestricted eligibility for every organization. Neighboring MontanaFFA heading retained in original excerpt supplies no OddFellows FFA affiliation.','Applicable exact-child/cycle membership scope before accepted/current use.'),
'needRequirement':note(E,'No OddFellows financial-need eligibility threshold established. MaximumGPA or nonmembership does not supply one.','Applicable exact-child need requirement or complete field-scope silence proof.'),
'needPriority':note(E,'No financial-need ranking or judging weight established for this child. No FFA scoring rule imported.','Applicable child/cycle judging treatment of financial need.'),
'renewability':note(S,'Shared RHM FAQ describes nonrenewable year-by-year awards,new annual application and reevaluation while eligible. OddFellows is named; no automatic or guaranteed repeat funding.','Applicable child/cycle shared-route continuity and ongoing eligibility.'),
'gapYears':note(U,'Detailed HSsenior/planned study following graduation differs from summary Seniors-College. Keep stage variants and unknown gap-year rule without union/intersection or assumed immediate-term requirement.','Applicable exact-child/cycle source-scope relationship and stage/gap-year wording.'),
'deadline':note(U,'Original deadline:null stays. Shared yearlessMarch1at11:59PM MST is not a proven current child/cycle deadline or2027date.','Applicable child/cycle deadline year,purpose and precision.'),
'applicationWindow':note(S,'SharedFAQ01 annualJanuary1-March1 andFAQ19 11:59PM MST match original recurring window,currentYear:null. No current opening or next year inferred.','Applicable exact-child/cycle shared-route continuity and current opening proof.'),
'cycle':note(E,'No complete OddFellows application/academic-year cycle established by undated child and recurring parent window.','Explicit applicable child/cycle identity or retained unknown.'),
'applicationMethod':note(U,'Shared online locator and supplemental-question context remain unvisited scope. portalRead:false stays; no current usable or accepted route.','Applicable child/cycle public method/shared-route relationship,without portal interaction.'),
'materials':note(U,'Original materials:null remains. Shared initial transcript/supplement guidance and later grade/enrollment/payment tasks are not a complete current OddFellows checklist or FFA-child materials.','Applicable complete child/cycle checklist with initial-versus-awardee scope/completeness.'),
'namedEligibilityStatement':note(U,'Preserve detail1+1000USD,HSsenior,GPA3.0orlower,plannedcollege/university/trade,scoped nonmembership versus summary3+Seniors-College. Existing excerpt also includes neighboring MontanaFFA heading; retain original bytes without importing affiliation or choosing stage/count variant.','Applicable exact-child/source/cycle scope evidence resolving or explicitly retaining stage/slot variants.'),
'maximumGPA':note(S,'Exact OddFellows child GPA3.0orlower supports held maximumGPA3.0,not minimum3.0. Scale/weighting remains unknown; no current hard exclusion or accepted fact.','Applicable exact-child/cycle maximum threshold and independently supported basis before acceptance.'),
'recipientSlots':note(C,'Retain existing conflict summaryMinimum3 versus eligibilityMinimum1: source3+ and1+ are minima,not exact counts,extra new award identities or guaranteed current allocation. Summary Seniors-College and detailedHSsenior also stay unresolved; no winner,total,union/intersection.','Applicable child/cycle/version proof resolving or explicitly retaining both recipient minima and scope variants.'),
}
notes[18]={
'amount':note(S,'Exact named ReachHigherMontana child says2000USD per recipient; held amount matches. Fifty slots are not50newIDs or a computed current funding total.','Applicable exact-child/cycle amount and recipient allocation before current/accepted use.'),
'minimumGPA':note(E,'No GPA cutoff established for exact RHM2000child. OddFellows maximum and Servant minimum do not transfer.','Applicable exact-child GPA rule or complete field-scope silence proof.'),
'gpaBasis':note(E,'No GPA scale/weighting/calculation basis established for exact RHMchild.','Applicable exact-child GPA basis if a threshold is later supported.'),
'schoolType':note(S,'Exact child requires at least half-time at an accredited Montana post-secondary institution/program,matching original typed held value. No full-time-only,four-year-only or nationwide-school substitution.','Applicable child/cycle enrollment,accreditation and institution-location proof before current use.'),
'residency':note(U,'Will graduate from a MontanaHS and attend a Montana institution/program are school-related conditions,not applicant-residence proof. Original residency:null remains.','Applicable exact-child residence rule and separate school/graduation geography.'),
'membership':note(E,'No organization membership condition established for RHMchild. Neither shared sponsorship nor FFA sibling membership supplies one.','Applicable exact-child membership rule or complete field-scope silence proof.'),
'needRequirement':note(U,'CompletedFAFSA is not an explicit financial-need threshold or aid-eligibility result. Original needRequirement:null remains.','Applicable child need eligibility separately from FAFSA completion.'),
'needPriority':note(E,'No RHMchild financial-need ranking or weight established. FAFSA completion alone is not need judging.','Applicable child/cycle financial-need judging treatment.'),
'renewability':note(S,'Shared FAQ nonrenewable year-by-year,new annual application and reevaluation while eligible remains distinct from automatic renewal/guaranteed repeat award.','Applicable named-child/cycle shared-route continuity and ongoing eligibility.'),
'gapYears':note(U,'Child says HSsenior who will graduate from MontanaHS; no generic gap-year permission/prohibition. Do not widen using OddFellows summary.','Applicable exact-child/cycle stage and gap-year wording.'),
'deadline':note(U,'Shared recurring March1/11:59PM MST remains yearless,originaldeadline:null. Child FAFSA completion supplies no FAFSA-specific date; HorseCreekApril1 does not transfer. No2027date.','Applicable exact-child/cycle scholarship deadline with separate FAFSA purpose/year proof.'),
'applicationWindow':note(S,'Shared annualJanuary1-March1/11:59PM MST matches original recurringwindow,currentYear:null. No current-open claim or sibling FAFSA-window substitution.','Applicable named-child/cycle shared-route and current opening/closing continuity.'),
'cycle':note(E,'Undated named-child statement and recurring window establish no complete application/academic-year cycle.','Explicit applicable child/cycle identity without source-date extrapolation.'),
'applicationMethod':note(U,'Shared online locator supports only original unvisited method scope. portalRead:false remains; no current usable or accepted route/form completeness.','Applicable child/cycle public method and shared-route relationship,without login/form visit.'),
'materials':note(U,'Child completedFAFSA is not a FAFSA-upload requirement. Originalmaterials:null remains; shared supplements/transcript guidance and later grade/enrollment/payment tasks do not establish complete current child checklist.','Applicable complete child/cycle initial checklist,completion-versus-upload and awardee timing/completeness.'),
'namedEligibilityStatement':note(S,'Preserve exact RHMchild50slots/2000USD,HSsenior who will graduate from MontanaHS,completedFAFSA AND at least half-time accredited Montana postsecondary institution/program. No residence/need/upload/FAFSA-date substitution or rule transfer.','Applicable exact-child/source/cycle identity and full typed-condition proof before acceptance.'),
'recipientSlots':note(S,'Fifty recipients remain original held slots,not50newawardIDs,guaranteed current awards or multiplied funding total.','Applicable exact-child/cycle recipient allocation before current/stronger use.'),
'fafsaRequired':note(S,'Exact child completedFAFSA supports heldtrue. No financial-need threshold,required upload,FAFSA-specific date or siblingApril1 inferred.','Applicable exact-child/cycle FAFSA completion requirement distinct from need and materials.'),
}
records=[]; identities=[]
identity_notes={17:('Existing OddFellows award-10b85bfc0c0c remains held. Exact child/shared route supports candidate only; recipient minima/stage variants and neighboring heading stay distinct,with no rule winner or new IDs.','Applicable exact-child/source/cycle identity and variant relationship; formal mapping validation before acceptance.'),18:('Existing RHMchild award-54af9ccbbb57 remains held. It is the named2000child,not the entire shared award directory;50recipients create no extra identities. School/FAFSA conditions do not accept mapping.','Applicable exact named-child/source/cycle identity and formal candidate validation.'),19:('Existing Servant award-ec7d28fb15f9 remains held. Exact child sentence/shared route supports candidate only; sharedFAQ annex and copiedAMTOPP annotation do not supply new identity or accepted mapping.','Applicable exact-child/source/cycle identity and formal candidate validation; any annotation correction separately selected.')}
for item in selection['selectedComparison']['orderedInputs']:
    ix=item['queueOffset'];row=packet['records'][ix];assert sha(canon(row))==item['recordCanonicalSha256']
    assert set(notes[ix])==set(row['fieldProposals'])
    route={k:row[k] for k in ['owner','trigger','authoritativePath','nextAction']};rr=ref(packet_path,item['recordPointer'])
    reviews=[ref('docs/evidence/sd2-autonomous/'+name) for name in ['research-manifest.json','research-review.json','research-manifest-round1.json','research-review-round1.json','research-dispositions.json']]
    context=[rr]
    for sid in item['sourceIds']:
        ri,source=registry[sid]; ci=next(i for i,x in enumerate(contexts) if x['sourceId']==sid)
        context += [ref(packet_path,f'/sourceRegistry/{ri}'),ref(str(P.relative_to(R)/'selected-context.json'),f'/sources/{ci}')]
    fields=[]
    for name,env in row['fieldProposals'].items():
        ep=item['recordPointer']+'/fieldProposals/'+name;refs=[]
        for ei,ev in enumerate(env['evidence']):
            source=registry[ev['sourceId']][1];raw=(R/source['artifactPath']).read_bytes()
            assert sha(raw)==ev['artifactSha256']==source['artifactSha256']
            assert ev['sourceUrl']==source['requestedUrl'] and ev['excerpt'] in raw.decode()
            refs += [ref(packet_path,ep+f'/evidence/{ei}'),ref(source['artifactPath'])]
        n=notes[ix][name]
        fields.append(dict(field=name,originalReference=ref(packet_path,ep),originalEnvelopeSha256=sha(canon(env)),originalEnvelope=env,originalRoute=route,evidenceReferences=refs,contextReferences=context,originalReviewReferences=reviews,comparison=n,holdDisposition='Retain original held acceptance, value/state, scope, timestamp and evidence.',nextActionRoute=dict(route,minimumProofProposal=n['minimumAdditionalProof'],newReadSelected=False)))
    records.append(dict(order=item['order'],savedInputKey=item['savedInputKey'],savedRowLocator=row['rowLocator'],displayLabel=item['displayLabel'],originalRecordedNameReference=item['recordedNameReference'],publicIdCandidates=item['publicIdCandidates'],originalIdentityAcceptance='held',originalRecordReference=rr,originalRecordRoute=route,fieldOccurrences=len(fields),fields=fields))
    conclusion,proof=identity_notes[ix]
    identities.append(dict(savedRowLocator=row['rowLocator'],displayLabel=item['displayLabel'],publicIdCandidates=item['publicIdCandidates'],originalIdentityAcceptance='held',comparisonCategory=U,conclusion=conclusion,minimumAdditionalProof=proof,originalIdentityProposal=row['identityProposal'],evidenceReferences=context,originalReviewReferences=reviews,originalRoute=route,nextAction='Retain exact original mapping/identity state; propose missing proof only.',acceptedMapping=False,newIdentityAllocated=False))
counts=collections.Counter(f['comparison']['category'] for r in records for f in r['fields'])
write('comparison.json',dict(schemaVersion=1,scope='Derived saved-evidence comparison; original packets remain authoritative',entryCommit=selection['entryCommit'],records=records,selectedInputs=3,fieldOccurrences=53,categoryCounts=dict(counts),priorComparedFieldOccurrences=353,cumulativeComparedFieldOccurrences=406,comparedAutonomousInputs=20,comparedPriorJayceeInputs=2,remainingAutonomousInputsOutsideComparison=386,acceptedFacts=0,originalFactsChanged=0,newSourceOrWorkbookReads=0,rawContentReinspections=0,fullSD2Complete=False,SD3Started=False,externalEffects=False))
write('identity-assessment.json',dict(schemaVersion=1,records=identities,acceptedMappings=0,newStableIds=0,deletedInputs=0,mergedInputs=0,childAwardsCreated=0,completePopulationIdentityReconciliation=False,SD3Started=False))
views=[]
for sx in selection['selectedComparison']['sources']:
    sid=sx['sourceId'];ri,source=registry[sid];occ=[]
    for rec in records:
        for f in rec['fields']:
            for ei,ev in enumerate(f['originalEnvelope']['evidence']):
                if ev['sourceId']==sid:occ.append(dict(savedInputKey=rec['savedInputKey'],field=f['field'],envelopeReference=f['originalReference'],evidenceIndex=ei,originalEvidence=ev))
    views.append(dict(sourceId=sid,originalRegistryReference=ref(packet_path,f'/sourceRegistry/{ri}'),artifactReference=ref(source['artifactPath']),permittedInputKeys=sx['permittedInputKeys'],extractionLimits=source['extractionLimits'],sourceRevision=source.get('sourceRevision'),originalSourceStatus=source['status'],originalObservation=source.get('captureRecordedAt'),selectedEvidenceOccurrences=occ,newFetchPerformed=False,newSourceReceiptCreated=False))
write('saved-source-references.json',dict(scope='Reference view generated from finalized selected comparison; no new capture or authoritative registry; equal RHM alias hashes not independent corroboration',sources=views))
write('artifact-pins.json',dict(schemaVersion=1,artifacts=[dict(path=path,sha256=digest) for path,digest in sorted(pins.items())]))
print(json.dumps(dict(selectedInputs=3,fieldOccurrences=53,categoryCounts=dict(counts),originalFactsChanged=0)))
