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
                if ev['sourceId']==sid and ev['excerpt'] not in quotes:quotes.append(ev['excerpt'])
    lines=text.splitlines()
    ranges={'rh-old':[(83,94),(101,112)],'rh-alias':[(1,1),(5,5)],'ffa':[(14,14)],
        'ffa-applications':[(1,13)],'ffa-guidelines':[(1,26)],'ffa-college-rubric':[(1,1),(19,26),(53,53)],
        'ffa-leadership-rubric':[(1,1),(17,26),(99,99)]}
    if sid=='kids':
        quotes.append('### Submission Requirements\n\n- Submission of complete renewal application\n- Essay responses')
    for a,z in ranges.get(sid,[]):
        q='\n'.join(lines[a-1:z])
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
'amount':(S,'Kozlowski named statement gives two2000USD recipient slots; original perRecipient2000 remains held. No current guarantee, extra identity or multiplied funding total.','Applicable exact-child/cycle amount and recipient allocation before current or accepted use.'),
'minimumGPA':(U,'Exact Kozlowski child states2.0orhigher. Copied generic-AMTOPP note remains unchanged and flagged as annotation drift, not affinity or substituted rules. Scale/weighting/current applicability remain held.','Applicable exact-child/cycle GPA threshold/basis; any annotation correction separately selected.'),
'gpaBasis':(U,'Historical College/Leadership cumulativeHS4.0 scoring does not establish current Kozlowski entry-GPA scale or weighting. Original null remains.','Applicable named-child entry-GPA calculation/scale/weighting separate from scoring.'),
'schoolType':(U,'Kozlowski HS senior OR undergraduate college student is applicant stage, not an institution-type, required degree or agriculture-major rule. Original schoolType:null remains.','Applicable child/cycle institution/program criteria without converting stage into school type.'),
'residency':(U,'Montana FFA or sponsor geography does not establish Kozlowski applicant residence. Original null remains.','Applicable exact-child residence rule or complete field-scope silence proof.'),
'membership':(S,'Exact Kozlowski child states FFA member. No borrowed tenure, two-AgEd-year or sibling-child condition.','Applicable exact-child/cycle membership and any separately supported tenure condition.'),
'needRequirement':(U,'Historical College/Leadership financial-need judging is not Kozlowski hard need eligibility. Original null remains.','Applicable child need eligibility separate from scoring/priority.'),
'needPriority':(U,'Historical shared scoring/weights do not establish current Kozlowski need ranking. No other-child weight is inherited.','Applicable exact-child/cycle judging treatment of financial need.'),
'renewability':(S,'RHM shared FAQ describes nonrenewable year-by-year awards, new annual applications and reevaluation while eligible. Kozlowski is named in that shared application; no automatic or guaranteed repeat funding.','Applicable named-child/cycle shared-route continuity and separate ongoing eligibility.'),
'gapYears':(U,'Kozlowski HS senior OR undergraduate college student remains an OR. It establishes neither generic gap-year permission/prohibition nor postgraduate eligibility.','Applicable exact-child/cycle stage and gap-year rule without changing alternatives.'),
'deadline':(U,'RHM yearlessMarch1/11:59PM MST, FFA March1,2026 and historical2021/December31 remain distinct. No current Kozlowski or2027deadline inferred.','Applicable child/cycle deadline year/purpose/time and version applicability.'),
'applicationWindow':(U,'AnnualJanuary1-March1/currentYear:null stays shared context. Mixed FFA historical versions establish no current Kozlowski opening.','Applicable child/cycle opening/closing proof without current-open inference.'),
'cycle':(U,'Original2026-03-01 applications,2021-06-28 guideline,olderDecember31,nextCycle:null remain distinct versions, not a synthesized current cycle.','Explicit applicable child/cycle/version continuity or retained unknown.'),
'applicationMethod':(U,'Shared RHM/FFA online route and historical College/Leadership links remain unvisited locators. portalRead:false stays; no current usable or accepted destination.','Applicable named-child/cycle public method and route relationship, no portal interaction.'),
'materials':(U,'Shared supplements/transcript guidance, historical college photo/adviser-community references, scoring prompts and later thank-you/enrollment/classes/payment tasks do not establish a complete current Kozlowski checklist.','Applicable complete child/cycle checklist separating initial, rubric and awardee timing.'),
'namedEligibilityStatement':(S,'Preserve exact Kozlowski child: two2000USD slots,HS senior OR undergraduate college student,GPA2.0orhigher,FFA member. No institution/degree/tenure rule inferred or OR changed to AND.','Applicable exact-child identity/cycle and typed qualifier proof before acceptance.'),
'recipientSlots':(S,'Two Kozlowski slots remain potential recipients, not two new award IDs, guaranteed current awards or a funding total.','Applicable named-child/cycle recipient allocation before current or stronger use.'),
}
notes[14]={k:note(*v) for k,v in common.items()}
notes[16]={k:note(v[0],v[1].replace('Kozlowski','Murdoch').replace('two2000USD','one500USD').replace('perRecipient2000','perRecipient500').replace('HS senior OR undergraduate college student','HS Senior').replace('Two Murdoch slots','One Murdoch slot').replace('two new award IDs','a new award ID'),v[2]) for k,v in common.items()}
notes[16]['namedEligibilityStatement']=note(S,'Preserve exact Murdoch child: one500USD recipient slot,HS Senior,GPA2.0orhigher,FFA member. No undergraduate expansion,employment/family requirement,retail-geography restriction or biography-derived rule.','Applicable exact-child identity/cycle and typed qualifier proof before acceptance.')
notes[16]['gapYears']=note(U,'Murdoch named statement says HS Senior. General FFA senior/freshman guidance cannot expand that stage or establish generic gap-year eligibility.','Applicable exact-child/cycle stage and gap-year criteria without sibling substitution.')
notes[16]['schoolType']=note(U,'Murdoch HS Senior is applicant stage, not institution type or degree. Sponsor background does not establish employment/family status, retail-geography eligibility or a major requirement. Original null remains.','Applicable exact-child/cycle institution/program criteria without background-derived restrictions.')
notes[15]={
'amount':note(S,'Original value:null/sourceQualifier:varies matches exact RHM Amounts vary. No minimum, maximum, average, total or guaranteed current amount invented.','Applicable exact-child/cycle amount and basis or retained varies/unknown.'),
'minimumGPA':note(E,'No Kids entry-GPA threshold is established in selected evidence. Most recent grades is a document request, not a GPA cutoff or proof of unrestricted GPA.','Applicable exact-child entry-GPA rule or complete field-scope silence proof.'),
'gpaBasis':note(E,'No Kids GPA scale/weighting/calculation basis is established. Initial transcript request supplies no threshold basis.','Applicable explicit GPA basis if a cutoff is later supported.'),
'schoolType':note(U,'Provider diploma/GED/HiSet OR current-year graduating student in good standing describes prior education/stage, not accepted institution type. Original null remains.','Applicable child/cycle institution type and education-stage mapping kept distinct.'),
'residency':note(U,'RHM says parent/guardian permanently injured or killed on the job in Montana; provider says serious work-related injury or fatality. Preserve work-event geography/permanence/breadth differences; neither establishes applicant residence.','Applicable exact-child scope relationship and separate residence/work-event criteria.'),
'membership':note(E,'No organizational membership condition established. Dependency on injured/killed worker is not organization membership, and absence is not unrestricted.','Applicable exact-child membership rule or complete field-scope silence proof.'),
'needRequirement':note(U,'Initial provider FAFSA Not Required does not establish no financial need, a need threshold or no income test. Original null remains.','Applicable exact-child need eligibility separately from FAFSA/document requirements.'),
'needPriority':note(E,'No financial-need ranking or weight is established. Funding contingency and family injury do not prove need scoring.','Applicable child/cycle judging treatment of financial need.'),
'renewability':note(U,'Preserve provider possible renewal contingent on funds/four-year eligibility limit versus shared RHM nonrenewable annual reapplication. Renewal requires current OR past recipient,dependency,ages16–26,restricted uses/direct institution payment and fund availability. Four-year limit is not four payments,consecutive years,remaining entitlement or automatic funding; no source winner.','Applicable child/cycle initial-renewal/shared-route relationship and exact duration/allocation conditions.'),
'gapYears':note(U,'RHM HSsenior differs from provider diploma/GED/HiSet OR current-year graduate in good standing,ages16–26. Do not exclude older initial applicants/transfers or infer a general gap-year rule.','Applicable exact-child stage/age/gap-year criteria and source-scope relationship.'),
'deadline':note(S,'Provider new and renewal sections both say March1,2026. Original held2026-03-01 matches historical deadline only; no2027date,current offering or time inferred.','Applicable exact-child/cycle deadline year/purpose/time before current use.'),
'applicationWindow':note(U,'Original RHM annualJanuary1-March1/currentYear:null and sharedFAQ19 time stay distinct from provider historical2026deadline. No current opening or transfer of unstated provider time.','Applicable child/cycle shared-route and opening/closing time continuity.'),
'cycle':note(U,'Original cycle:null remains despite provider2026deadline; application deadline alone does not establish complete academic/application-year cycle or next cycle.','Explicit applicable child/cycle identity and versions, or retained unknown.'),
'applicationMethod':note(U,'Original shared online locator remains portalRead:false. Neither public provider instruction nor locator proves current usable,accepted route or complete portal forms.','Applicable exact-child/cycle public method and shared-route identity,without portal visit.'),
'materials':note(U,'Original materials:null remains. Provider initial asks complete application/essay responses plus most recent grades(unofficial transcript okay); renewal asks complete renewal application/essay responses. No automatic initial transcript transfer or silence-based no-transcript claim. Restricted uses/direct institution payment and four-year limit are conditions,not uploads.','Applicable complete initial-versus-renewal child/cycle checklist and completeness proof; any new typed materials proposal separately held.'),
'namedEligibilityStatement':note(U,'Preserve exact RHM HS Senior,parent/guardian permanently injured OR killed on the job in Montana,amounts vary. Provider dependent/serious-work-related-injury-or-fatality,ages16–26 and broader education alternatives remain separate. Do not silently equate,union,intersect or delete variants.','Applicable exact-child source/scope/cycle relationship retaining all qualifiers and conflict.'),
'initialEligibility':note(U,'Original dependentOfKilledOrSeriouslyInjuredWorker:true,agesInclusive:[16,26],education alternatives,FAFSArequired:false remain held. Exact provider Between16-26 wording does not independently prove inclusive endpoints. Keep diploma/GED/HiSet OR current-year graduating student in good standing,restricted tuition/fees/room-and-board/books/required-supplies uses,direct institution payment,funds/may-renew conditions; no family/applicant records collected.','Applicable exact-child/cycle endpoint and initial-eligibility scope proof,without strengthening wording or collecting applicant data.'),
'fafsaRequired':note(S,'Provider initial section explicitly says FAFSA Not Required,matching heldfalse. Do not transfer to renewal without proof or convert into need=false.','Applicable child/cycle initial-versus-renewal FAFSA condition distinct from need eligibility.'),
'educationStageConflict':note(C,'Retain existing conflict:RHM High School Senior versus provider diploma/GED/HiSet OR current-year graduate in good standing,ages16–26. No winner,forced intersection or hard exclusion of older initial applicants/transfers; injury/permanence/Montana-work-event scope also remains unresolved separately.','Applicable exact-child source/cycle/scope evidence resolving or explicitly retaining all variants.'),
}
records=[]; identities=[]
identity_notes={
14:('Exact named Kozlowski child/shared RHM route supports only existing award-df57e3f6a067 candidate. HSsenior OR undergraduate/GPA/FFA/two2000slots and copiedAMTOPP annotation drift stay held. No mapping or additional IDs accepted.','Applicable child/source/cycle identity and formal candidate validation; annotation correction separately selected.'),
15:('Existing award-66c48204573e remains held. Shared RHM and provider initial/renewal scope differences do not authorize same-cycle identity,rule winner,hard exclusions or accepted mapping. Preserve original identity proposal.','Applicable exact-child/source/cycle and shared-route/initial-renewal relationship,retaining unresolved variants.'),
16:('Exact Murdoch named child/shared RHM route supports only existing award-fc37c2d47f56 candidate. HSsenior/GPA/FFA/one500slot and copiedAMTOPP drift stay held; sponsor background establishes no identity or eligibility rule.','Applicable exact-child/source/cycle identity and formal candidate validation; annotation correction separately selected.')}
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
write('comparison.json',dict(schemaVersion=1,scope='Derived saved-evidence comparison; original packets remain authoritative',entryCommit=selection['entryCommit'],records=records,selectedInputs=3,fieldOccurrences=53,categoryCounts=dict(counts),priorComparedFieldOccurrences=300,cumulativeComparedFieldOccurrences=353,comparedAutonomousInputs=17,comparedPriorJayceeInputs=2,remainingAutonomousInputsOutsideComparison=389,acceptedFacts=0,originalFactsChanged=0,newSourceOrWorkbookReads=0,rawContentReinspections=0,fullSD2Complete=False,SD3Started=False,externalEffects=False))
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
