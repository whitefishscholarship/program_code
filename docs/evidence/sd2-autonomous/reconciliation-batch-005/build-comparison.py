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
    for a,z in ranges.get(sid,[]):
        q='\n'.join(lines[a-1:z])
        if q not in quotes:quotes.append(q)
    passages=[]
    for q in quotes:
        a=text.find(q);assert a>=0,(sid,'missing selected quotation')
        passages.append(dict(startCharacter=a,endCharacter=a+len(q),quote=q))
    contexts.append(dict(sourceId=sid,artifactReference=ref(source['artifactPath']),permittedInputKeys=sx['permittedInputKeys'],passages=passages,
        locatorConvention='Zero-based Unicode codepoint offsets in exact UTF-8-decoded saved artifact; selected occurrence only',
        scopeLimit='Selected saved excerpts/general passages only; flathead parent has metadata-only context, no inherited child facts. No full/native/visual/current proof, biographies or unrelated award semantics.'))
write('selected-context.json',dict(scope='Selected-passage reference view, not new capture or authoritative registry',sources=contexts))
notes={
11:{
'amount':note(S,'Exact Teachers child states one500USD scholarship, matching original held perRecipient500. No current guarantee, additional award identity or funding total inferred.','Applicable named-child/cycle amount and slot allocation before accepted current use.'),
'minimumGPA':note(U,'Exact Teachers RHM excerpt states2.0orhigher. Copied generic-AMTOPP annotation remains unchanged and flagged as drift, not source affinity or AMTOPP substitution; threshold basis/current applicability stay held.','Applicable Teachers child/cycle GPA proof; any annotation correction is a separate selected proposal.'),
'gpaBasis':note(U,'Historical College/Leadership cumulativeHS4.0 scoring is not a current Teachers entry-threshold scale/weighting rule. Original null remains.','Exact child/cycle entry-GPA basis, kept separate from historical scoring.'),
'schoolType':note(U,'Planning a career as an AgEd teacher does not establish a required degree or permitted institution type. Original null stays; no other FFA child degree/stage rule is borrowed.','Applicable child institution/program wording, separately from career plans.'),
'residency':note(U,'General Montana FFA scope does not establish Teachers applicant residence. School/organization/sponsor geography stays distinct.','Applicable exact-child residence rule or complete field-scope silence proof.'),
'membership':note(S,'Exact RHM Teachers child states FFA membership. Do not import two-AgEd-year or other-child membership/tenure conditions from general historical material.','Applicable exact-child/cycle membership and any independently supported tenure rule.'),
'needRequirement':note(U,'General College/Leadership financial-need judging does not establish Teachers hard need eligibility. Original null stays.','Applicable exact-child need eligibility wording, separately from scoring.'),
'needPriority':note(U,'Historical shared scoring/weights do not establish a current Teachers need-ranking rule; no AMTOPP weight or other-child rule is adopted.','Applicable child/cycle judging rubric and financial-need treatment.'),
'renewability':note(S,'Shared RHM FAQ expressly separates non-renewable year-by-year awards from new annual applications and reevaluation while eligible. Teachers is named on the shared page; no guaranteed renewal/repeat funding.','Applicable child/cycle shared-route continuity and separate ongoing eligibility.'),
'gapYears':note(U,'Teachers child says HS Senior. General FFA senior/freshman guidance cannot expand that stage or establish a generic gap-year rule.','Applicable exact-child/cycle stage and gap-year wording without borrowed alternatives.'),
'deadline':note(U,'RHM yearlessMarch1at11:59PM MST, FFAapplicationsMarch1,2026 and2021guidelineDecember31 reference stay separate. No current Teachers-specific or2027 deadline inferred.','Applicable exact-child/cycle deadline year, purpose, precision and version applicability.'),
'applicationWindow':note(U,'Original annualJanuary1-March1/currentYear:null remains shared-parent context; mixed FFA versions establish no coherent current Teachers opening.','Applicable named-child/cycle opening/closing proof, without current-open inference.'),
'cycle':note(U,'Original applications2026-03-01,guideline2021-06-28,olderDecember31,nextCycle:null stay distinct historical evidence, not one synthesized cycle.','Exact child/cycle/version continuity or retained explicit unknown.'),
'applicationMethod':note(U,'Shared RHM/FFA online route and older College/Leadership links remain unvisited locators. portalRead:false stays; no usable current destination or accepted route.','Applicable exact-child/cycle public submission method and route proof, no login/form interaction.'),
'materials':note(U,'Shared supplements/transcript guidance and historical2021college photo/transcript/adviser-community forms plus later thank-you/enrollment/classes do not establish a complete current Teachers checklist. Scoring prompts are not automatically required documents.','Applicable complete child/cycle materials with initial-versus-awardee timing and rubric/version scope.'),
'namedEligibilityStatement':note(S,'Keep exact named child one500USD slot,HS Senior,GPA2.0orhigher,FFA member,planning a career as an AgEd teacher. No mandatory AgEducation degree, college-freshman expansion or biography-derived rule.','Applicable child identity/cycle and typed conditions before acceptance, preserving career-plan wording.'),
'recipientSlots':note(S,'Original one slot is supported by the RHM one-scholarship statement only; no additional award identity, total or current guarantee.','Applicable named-child/cycle recipient allocation before stronger/current use.'),
},
12:{
'amount':note(U,'No child-bound amount is established. Retained parent FEC1500-6000 context cannot supply the early-childhood award amount; original null remains.','Exact identified early-childhood child/cycle amount and basis, or retained unknown.'),
'minimumGPA':note(E,'No entry-GPA cutoff is attached to the held early-childhood child. A locator or parent summary does not establish unrestricted GPA.','Applicable identified-child entry-GPA rule or complete field-scope silence proof.'),
'gpaBasis':note(E,'No child-bound GPA scale, weighting or calculation basis is established.','Exact identified-child basis if a threshold is later supported.'),
'schoolType':note(U,'FVCC/early-childhood wording in the saved name/link supports only a candidate program relationship, not accepted institution or major eligibility. Original null remains.','Resolve exact child identity then applicable institution/program criteria.'),
'residency':note(U,'No child-bound residence condition is established. Parent/sponsor location or terms cannot become this child requirement.','Exact identified-child residence rule, separately from parent/sponsor geography.'),
'membership':note(U,'No child-bound co-op membership/service restriction is established. Parent/sponsor association is not a child rule or proof of no restriction.','Exact identified-child membership/client rule or complete field-scope silence proof.'),
'needRequirement':note(E,'No identified-child financial-need eligibility condition is established by the retained locator.','Exact child/cycle need eligibility wording or complete field-scope silence proof.'),
'needPriority':note(E,'No identified-child financial-need ranking or weight is established.','Exact child/cycle judging treatment of financial need.'),
'renewability':note(E,'No early-childhood child renewal/reapplication policy is established; RHM terms belong to other records and are excluded.','Exact child/cycle renewal terms, separately from reapplication.'),
'gapYears':note(E,'A program/college locator establishes no child applicant-stage or gap-year rule.','Exact child/cycle stage/gap-year criteria or complete field-scope silence proof.'),
'deadline':note(U,'Parent FECFeb22 is not an early-childhood deadline. Original null remains, with no year or next-cycle date inferred.','Exact identified-child/cycle deadline, purpose and precision.'),
'applicationWindow':note(E,'No child-bound opening/window or current-open proof is established by unvisited portal locators.','Exact identified-child/cycle opening/closing evidence and separate route proof.'),
'cycle':note(E,'No specific early-childhood application/academic-year cycle is established.','Explicit exact-child cycle identity without source-date extrapolation.'),
'applicationMethod':note(U,'Saved official scholarships pointer and old portal link remain uninspected locators, not an accepted method or usable current destination. Original null remains.','Resolve child identity and applicable public method/route, without portal interaction.'),
'materials':note(E,'No complete child checklist or document requirement is established; parent/sibling/college-wide material lists cannot substitute.','Exact identified-child/cycle complete materials with source completeness proof.'),
'childApplicationLocator':note(U,'Retain academicworks opportunity3986 versus old awardspring433125 and acceptedSameIdentity:false. Exact saved Early Childhood Education Program link supports candidate relationship only, not same identity/current access, offering, publisher custody or accepted route. Neither portal is read.','Exact original-child identity and old/new route relationship, or retained unresolved identity disposition; no fetch selected.'),
},
13:{
'amount':note(C,'Retain original conflict: summary2000USD versus exact named detail1500USD, both from savedrh-old. No winner, current-cycle reconciliation, total multiplication or variant deletion.','Exact applicable child/cycle amount/version evidence resolving or explicitly retaining both variants.'),
'minimumGPA':note(E,'The selected Horse Creek statement establishes no GPA cutoff. No unrestricted-GPA conclusion from a partial source.','Applicable child entry-GPA rule or complete field-scope silence proof.'),
'gpaBasis':note(E,'No Horse Creek GPA scale, weighting or calculation basis is established.','Applicable explicit basis if an entry threshold is later supported.'),
'schoolType':note(U,'Named statement says at least half-time at ANY accredited post-secondary institution nationwide, pursuing a business-related certificate/degree OR having completed at least one Business/Finance course in HS or college. Original null stays; no forced business major, full-time-only or four-year-only rule.','Applicable child/cycle field mapping preserving enrollment/accreditation/nationwide and degree-OR-course alternatives.'),
'residency':note(U,'Have/will graduate from a Montana high school is not applicant residence. Two scholarships prefer graduates/residents of Beaverhead and Madison Counties; keep slash/qualifiers, not an all-six-slot residence exclusion or invented operator.','Applicable child/cycle school-affiliation and separately supported preference/residence mapping.'),
'membership':note(E,'No Horse Creek association-membership rule is established. Coursework/FAFSA/enrollment do not supply one.','Applicable child membership condition or complete field-scope silence proof.'),
'needRequirement':note(U,'Required FAFSA completion byApril1 is not an explicit financial-need threshold or aid-eligibility test. Original null needRequirement stays.','Applicable child financial-need eligibility condition, distinct from FAFSA completion.'),
'needPriority':note(U,'The two-slot county preference is not a financial-need priority or judging weight. No need-ranking rule is established.','Applicable child/cycle judging treatment of financial need and separate preference allocation.'),
'renewability':note(S,'Shared FAQ says non-renewable year-by-year with a new annual application and reevaluation while eligible. This is distinct from automatic renewal or guaranteed repeat funding.','Applicable named-child/cycle shared-route continuity and ongoing eligibility.'),
'gapYears':note(U,'High-school senior OR college student who have/will graduate from Montana HS does not establish a general gap-year permission/prohibition.','Applicable child/cycle stage and gap-year wording without extrapolation.'),
'deadline':note(U,'FAFSA byyearlessApril1 is not the scholarship application deadline. Shared yearlessMarch1at11:59PM MST remains separate; original award deadline:null stays with no2027date.','Applicable exact-child/cycle scholarship deadline with purpose/year/time, separately from FAFSA timing.'),
'applicationWindow':note(S,'FAQ01 supports annualJanuary1-March1; FAQ19 supplies11:59PM MST closing. Original currentYear:null stays; no current child opening or FAFSA-window substitution.','Applicable child/cycle shared-route continuity and current opening/closing proof before use.'),
'cycle':note(E,'Undated child/summary,yearlessFAFSAApril1 and recurring parent window establish no full application/academic-year cycle.','Explicit applicable child/cycle identity without inferred year.'),
'applicationMethod':note(U,'Shared RHM online-only/supplemental-question context supports only the saved method scope. Original portalRead:false remains; no current usable or accepted destination, login or form read.','Applicable exact-child/shared-route public method and identity proof without portal interaction.'),
'materials':note(U,'Child states FAFSA completion, not a FAFSA upload or complete checklist. Shared transcript/supplement guidance and later grade/enrollment/payment tasks remain separate. Original null materials stays; no applicant data collected.','Applicable complete child/cycle checklist, preserving completion-versus-upload and initial-versus-awardee timing.'),
'namedEligibilityStatement':note(S,'Keep exact detail: six1500USD slots while amount conflict also preserves2000summary; HSseniors OR college students with have/willMT-HSgraduation,FAFSAbyApril1,half-timeANYaccreditednationwide institution,business certificate/degree OR>=1Business/Financecourse,plus two-slot graduates/residents county preference. No source winner,AND conversion or all-slot restriction.','Applicable child/cycle identity and exact qualifier mapping; resolve or retain amount conflict separately.'),
'recipientSlots':note(S,'Six slots occur in both summary/detail. They remain six potential recipients, not six new award IDs, guaranteed current slots or multiplied funding total; two-slot preference stays qualified.','Applicable child/cycle count and preference allocation before current or stronger use.'),
'fafsaRequired':note(S,'Original required:true,April1,year:null matches child have/will-complete FAFSA wording. No scholarship deadline,2027year,financial-need cutoff or FAFSA-upload requirement inferred.','Applicable child/cycle FAFSA timing and completion criterion before acceptance, preserving unknown year.'),
}}
records=[]; identities=[]
identity_notes={11:('Exact Teachers named child/shared RHM route support only existing candidate award-54180c19eb74. Career-plan/HSsenior scope and copied AMTOPP annotation drift remain exact and held; no degree substitution or accepted mapping.', 'Applicable child/source/cycle identity and formal candidate validation; annotation correction separately selected.'),12:('Existing award-36ff5fe7d091 remains a candidate. Saved official Early Childhood Education link and academicworks3986 versus old awardspring433125 do not resolve same identity; acceptedSameIdentity remainsfalse. Parent terms and uninspected portals establish no accepted child facts.', 'Exact original-child identity and old/new locator relationship, or retained unresolved identity disposition; no portal fetch selected.'),13:('Exact Horse Creek named child/shared RHM route support only existing candidate award-a60341b46e39. Amount conflict and all eligibility/preference alternatives remain held; six recipients do not create six awards or accepted current mapping.', 'Applicable named-child/source/cycle identity and formal candidate validation while resolving or retaining amount/version conflict.')}
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
write('comparison.json',dict(schemaVersion=1,scope='Derived saved-evidence comparison; original packets remain authoritative',entryCommit=selection['entryCommit'],records=records,selectedInputs=3,fieldOccurrences=51,categoryCounts=dict(counts),priorComparedFieldOccurrences=249,cumulativeComparedFieldOccurrences=300,comparedAutonomousInputs=14,comparedPriorJayceeInputs=2,remainingAutonomousInputsOutsideComparison=392,acceptedFacts=0,originalFactsChanged=0,newSourceOrWorkbookReads=0,rawContentReinspections=0,fullSD2Complete=False,SD3Started=False,externalEffects=False))
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
print(json.dumps(dict(selectedInputs=3,fieldOccurrences=51,categoryCounts=dict(counts),originalFactsChanged=0)))
