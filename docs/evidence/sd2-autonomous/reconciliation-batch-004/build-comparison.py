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
# Exact selected excerpts or bounded general passages only; never full shared/biography output.
registry={s['sourceId']:(i,s) for i,s in enumerate(packet['sourceRegistry'])}
contexts=[]
for sx in selection['selectedComparison']['sources']:
    sid=sx['sourceId'];source=registry[sid][1];text=(R/source['artifactPath']).read_text();quotes=[]
    for item in selection['selectedComparison']['orderedInputs']:
        row=packet['records'][item['queueOffset']]
        for env in row['fieldProposals'].values():
            for ev in env['evidence']:
                if ev['sourceId']==sid and ev['excerpt'] not in quotes:quotes.append(ev['excerpt'])
    lines=text.splitlines()
    extra_ranges={'rh-old':[(83,94),(101,112)],'rh-alias':[(1,1),(5,5)],
        'ffa':[(14,14)],'ffa-applications':[(1,13)],'ffa-guidelines':[(1,26)],
        'ffa-college-rubric':[(1,1),(19,26),(53,53)],'ffa-leadership-rubric':[(1,1),(17,26),(99,99)]}
    for a,z in extra_ranges.get(sid,[]):
        q='\n'.join(lines[a-1:z])
        if q not in quotes:quotes.append(q)
    if sid=='ffa':quotes.append('annual $1,500 scholarship to a Montana FFA State Officer.')
    passages=[]
    for q in quotes:
        a=text.find(q);assert a>=0,(sid,'missing selected quotation')
        passages.append(dict(startCharacter=a,endCharacter=a+len(q),quote=q))
    contexts.append(dict(sourceId=sid,artifactReference=ref(source['artifactPath']),permittedInputKeys=sx['permittedInputKeys'],passages=passages,
        locatorConvention='Zero-based Unicode codepoint offsets in exact UTF-8-decoded saved artifact; selected occurrence only',
        scopeLimit='Selected saved sentences/general passages only; not full/native/visual/current source proof. No biography or unselected award semantics.'))
write('selected-context.json',dict(scope='Exact selected-passage reference view, not a new capture or source registry',sources=contexts))
notes={
8:{
'amount':note(S,'The exact Carl child states one2000USD scholarship, matching the held perRecipient2000 value. No current award guarantee, additional slot or funding total inferred.','Applicable named-child identity/cycle and amount allocation before accepted current use.'),
'minimumGPA':note(E,'No Carl entry-GPA threshold is established by the selected child synopsis. No unrestricted-GPA inference from partial evidence.','Applicable Carl entry-GPA rule or complete field-scope silence proof.'),
'gpaBasis':note(E,'No Carl GPA scale, weighting or calculation basis is established.','Applicable explicit GPA basis if a threshold is later supported.'),
'schoolType':note(E,'The selected Carl statement establishes no allowed institution/program type; ROTC is not a school-type mapping.','Applicable Carl institution/program rule or complete field-scope silence proof.'),
'residency':note(E,'Service in ROTC or U.S. Armed Forces does not state applicant residence or citizenship.','Applicable explicit residence rule, separately from citizenship/service.'),
'membership':note(U,'Serving or have-served ROTC OR Armed Forces is the separate militaryCriterion, not a generic association-membership rule. Original null membership stays; do not replace service with interest or dependent status.','Applicable membership rule if any, kept distinct from exact service eligibility.'),
'needRequirement':note(E,'No Carl financial-need eligibility threshold is established by selected passages.','Applicable child need eligibility rule or complete field-scope silence proof.'),
'needPriority':note(E,'No Carl financial-need judging priority or weight is established.','Applicable child judging treatment of financial need.'),
'renewability':note(S,'Shared FAQ explicitly says non-renewable year-by-year awards with new annual application and reevaluation while eligible, even after winning. Carl is named on the shared page; no automatic renewal or guaranteed repeat award.','Applicable child/shared-application and cycle continuity before current use.'),
'gapYears':note(E,'Past or present service does not define a school-stage or gap-year condition.','Applicable child applicant-stage/gap-year rule or complete field-scope silence proof.'),
'deadline':note(U,'Shared March1 at11:59PM MST is yearless; no specific Carl cycle deadline is established. Original null stays, no2027date inferred.','Applicable child/cycle deadline year, purpose, time and timezone.'),
'applicationWindow':note(S,'FAQ01 supports annualJanuary1-March1; FAQ19 supplies March1 11:59PM MST. Original currentYear:null stays; this shared recurring window is not a current child opening.','Applicable child/cycle continuity and current window proof before current use.'),
'cycle':note(E,'Undated Carl child and recurring parent terms establish no specific application/academic-year cycle.','Explicit applicable Carl cycle identity without observation-date extrapolation.'),
'applicationMethod':note(U,'Exact child requires RHM application; shared FAQ06 describes online-only and FAQ07 individual supplements. Original portalRead:false stays; login locator does not prove a usable current destination or accepted route.','Applicable child/shared-route identity and public method/route proof without portal interaction.'),
'materials':note(U,'Shared supplemental-question and unofficial-transcript guidance is not a complete Carl checklist. Later grades/enrollment verification concern award payment. Original null materials remains; no personal data collected.','Applicable complete child materials, separating application from awardee follow-up and preserving completeness limits.'),
'namedEligibilityStatement':note(S,'Retain exact named Carl one2000USD scholarship: must complete RHM application AND is serving or have served in ROTC OR U.S. Armed Forces. No veterans-only narrowing, dependent/interest expansion, citizenship or age inference.','Applicable child identity/cycle and explicit typed service mapping before accepted use.'),
'recipientSlots':note(S,'One scholarship supports the original one recipient slot only; no new award identity, guarantee or next-cycle count.','Applicable current child/cycle recipient allocation if a stronger claim is proposed.'),
'militaryCriterion':note(S,'Exact serving-or-have-served ROTC OR U.S. Armed Forces supports original held service alternatives. Both current and prior service remain; relatives, military interest and veteran-only categories are not substituted.','Applicable child/cycle criterion proof preserving service tense/OR and unknown documentation rules.'),
},
9:{
'amount':note(S,'RHM states two500USD scholarships; exact FFA child sentence states500for each scholarship awarded. Original perRecipient500 remains within those saved scopes, without a current guaranteed count or invented award IDs.','Applicable child/cycle identity and amount/count allocation, retaining version-specific scope.'),
'minimumGPA':note(U,'Exact Amberson RHM excerpt states2.0orhigher. Original note contains copied generic-AMTOPP wording; preserve it unchanged as annotation drift, never source affinity or an AMTOPP substitution. Threshold acceptance, basis and stage applicability remain held.','Applicable Amberson child/cycle GPA proof and separately reviewed correction proposal for annotation drift if later selected.'),
'gpaBasis':note(U,'Historical College/Leadership scoring uses cumulative high-school GPA on4.0. That does not establish current Amberson entry-threshold scale or weighting; original null stays.','Exact child/cycle threshold basis, separately from historical scoring rubrics.'),
'schoolType':note(U,'AgEducation degree is a named field requirement, not an unrestricted institution type. RHM senior/freshman and FFA freshman/sophomore stage alternatives conflict; memorial biography supplies no applicant-school rule. Original null schoolType stays.','Applicable child/cycle institution/program and stage rules, without biographical inference.'),
'residency':note(U,'Shared Montana FFA scope does not independently establish Amberson applicant residence. Sponsor/school/member geography remains distinct.','Applicable child residence rule or complete field-scope silence proof, separate from affiliation.'),
'membership':note(S,'Exact RHM Amberson child states FFA member. Preserve that limited held membership condition; do not automatically import historical general two-AgEd-year or other-child requirements.','Applicable child/cycle membership and any independently supported tenure terms.'),
'needRequirement':note(U,'General College/Leadership scoring includes need-related judging context, not a demonstrated Amberson hard need threshold. Original null remains; other award criteria are excluded.','Applicable exact-child need eligibility rule, separately from judging and rubric applicability.'),
'needPriority':note(U,'General historical College/Leadership weights are not an applicable current Amberson selection rubric. Do not borrow AMTOPP need scoring or another child rule.','Applicable child/cycle judging rubric and need weight, if actually established.'),
'renewability':note(S,'Shared FAQ separates non-renewable year-by-year awards from reapplication while eligible, with a new application and reevaluation. Amberson stage conflict prevents an assumed eligibility continuation; no guaranteed renewal.','Applicable child/cycle shared-application continuity and separate stage eligibility before current reapplication use.'),
'gapYears':note(U,'RHM senior OR freshman and FFA freshman OR sophomore conflict does not establish a general gap-year permission/exclusion. No union/intersection or chosen version.','Applicable exact-child/cycle stage and gap-year rules resolving or retaining the conflict.'),
'deadline':note(U,'RHM recurring March1 11:59PM MST, FFA applications March1,2026 and historical2021guideline December31 reference remain separate. No Amberson-specific current deadline or next-cycle date inferred.','Exact child/cycle deadline with purpose/precision and version applicability.'),
'applicationWindow':note(U,'Original annualJanuary1-March1/currentYear:null remains shared-parent context. Mixed FFA document versions and stage conflict do not establish a coherent current Amberson opening.','Applicable child/cycle opening/closing proof without extrapolation or source winner.'),
'cycle':note(U,'Original envelope retains applications2026-03-01, guideline2021-06-28, olderDecember31 and nextCycle:null. Different document scopes/versions are not combined into one current cycle.','Exact child/cycle/version continuity; retain all historical dates without substitution.'),
'applicationMethod':note(U,'Shared RHM/FFA online method and older college/leadership application links remain unvisited locators. Stage/version conflict is unresolved; no usable current route or portal interaction.','Applicable exact-child/cycle public submission method and route identity.'),
'materials':note(U,'Original null remains: shared supplements/transcript guidance and historical2021college photo/transcript/adviser-community forms with later thank-you/enrollment/classes do not establish a full current Amberson checklist. College/Leadership scoring prompts are not automatically required documents.','Applicable complete child/cycle materials, preserving initial-versus-awardee timing and rubric scope.'),
'namedEligibilityStatement':note(U,'Keep RHM two500USD slots, HSsenior OR collegefreshman,FFA,GPA2.0orhigher,AgEducation degree alongside FFA freshman OR sophomore AgEducation wording. Preserve studentStage conflict without rule union/intersection or winner; no memorial-biography eligibility.','Applicable child/cycle rule set or explicit retained unresolved-version disposition.'),
'recipientSlots':note(S,'RHM two scholarships supports original two recipient slots within that saved synopsis. FFA amount-per-scholarship sentence does not independently establish current slot count or two new identities.','Applicable child/cycle recipient count before current use.'),
'studentStage':note(C,'Retain original conflict: RHM high-school senior OR college freshman versus exact FFA child freshman OR sophomore pursuing AgEducation. Do not union/intersect stages, choose a winner or treat shared general guidelines as reconciliation.','Exact applicable child/cycle stage evidence resolving the versions, or retained explicit conflict disposition.'),
},
10:{
'amount':note(S,'RHM one1500USD scholarship and exact FFA child amount sentence support original1500 value within saved scope. Annual language is not proof of a current offering or guaranteed next-year award.','Applicable named-child/cycle amount and slot allocation before current use.'),
'minimumGPA':note(U,'Exact Shelhamer RHM excerpt states2.0orhigher. Copied generic-AMTOPP note remains unchanged and flagged as annotation drift, not affinity or substitution proof. Short FFA synopsis cannot erase RHM GPA or prove silence; basis/current applicability held.','Applicable Shelhamer child/cycle entry-GPA evidence and separately selected annotation correction proposal.'),
'gpaBasis':note(U,'Historical College/Leadership cumulativeHS4.0 scoring basis is not a current Shelhamer entry-threshold scale/weighting rule. Original null stays.','Exact child/cycle entry-GPA basis rather than shared scoring assumptions.'),
'schoolType':note(U,'RHM explicitly says attending Montana State University. Preserve that named institution qualifier while original schoolType:null remains; no Any-school mapping or inference from memorial educational biography.','Applicable named-child/cycle institution rule and formal field mapping.'),
'residency':note(U,'Montana FFA State Officer and attending MSU are office/institution conditions, not an explicit applicant-residence rule.','Applicable child residence wording separately from state office and institution.'),
'membership':note(U,'Original FFA membership value is less specific than exact Montana FFA State Officer requirement. Preserve envelope and full named statement together; do not expand eligibility to all FFA members.','Applicable child/cycle officer role and membership mapping preserving specificity.'),
'needRequirement':note(U,'General College/Leadership need scoring does not establish a Shelhamer financial-need hard eligibility threshold. Original null remains.','Applicable exact-child need eligibility rule, kept separate from judging context.'),
'needPriority':note(U,'Historical shared scoring/weights do not establish an applicable current Shelhamer need-ranking rule.','Exact child/cycle judging rubric and need treatment, with applicability proof.'),
'renewability':note(S,'Shared FAQ is non-renewable year-by-year with new annual application and reevaluation while eligible. Annual FFA amount language is not automatic renewal or guaranteed continued officer eligibility.','Applicable child/cycle shared-route continuity and separate current office eligibility.'),
'gapYears':note(E,'State-officer/MSU condition and memorial biography establish no general applicant gap-year permission or exclusion.','Applicable child applicant-stage/gap-year wording or complete field-scope silence proof.'),
'deadline':note(U,'Keep shared yearless March1 11:59PM MST, applicationsMarch1,2026 and2021guideline December31 reference separate. None proves current exact Shelhamer deadline or2027 date.','Applicable exact-child/cycle deadline, purpose, precision and document-version applicability.'),
'applicationWindow':note(U,'Original annualJanuary1-March1/currentYear:null remains; shared yearless and mixed-version FFA material does not open the named child now.','Applicable child/cycle window and route proof without current-open inference.'),
'cycle':note(U,'Applications2026-03-01, guideline2021-06-28, olderDecember31 and nextCycle:null remain historical distinct evidence; no synthesized academic-year span or selected winner.','Exact child/cycle/version continuity with explicit unknowns retained.'),
'applicationMethod':note(U,'Shared RHM/FFA online route and historical application links remain unvisited locators. No current usable destination, accepted method mapping or form inspection is claimed.','Applicable named-child/cycle public submission method/route proof without login.'),
'materials':note(U,'Shared questions/transcript guidance, historical2021college photo/transcript/two forms and post-award thank-you/enrollment/classes are distinct from a full current Shelhamer checklist. Original null remains; Leadership scoring is not a child requirement.','Applicable complete exact-child materials, preserving version/rubric and application-versus-awardee timing.'),
'namedEligibilityStatement':note(S,'Preserve exact RHM one1500USD scholarship, Montana FFA State Officer attending Montana State University and2.0GPAorhigher. Short FFA named-child amount/officer sentence does not remove institution/GPA or establish same cycle. No memorial-biography-derived rule.','Applicable child/cycle identity and typed conditions before acceptance; retain all exact qualifiers.'),
'recipientSlots':note(S,'RHM one scholarship supports original one recipient slot only; no new identity, total-funding multiplication or current guarantee.','Applicable named-child/cycle recipient allocation before stronger/current use.'),
}}
records=[]; identities=[]
identity_notes={8:('Exact Carl named child and shared RHM route support only existing candidate award-cc062852a7f2. Preserve service tense/ROTC OR ArmedForces and required application; no accepted mapping/current offering or broader military-family interpretation.', 'Applicable child/source/cycle identity and formal candidate validation without expanding service criteria.'),9:('Exact Amberson child supports only existing candidate award-bb295b2828b5. StudentStage conflict and copied AMTOPP GPA annotation remain held and separately flagged; neither identity substitution nor source winner is selected.', 'Applicable exact-child/cycle identity and stage evidence, or retained explicit conflict; annotation correction separately selected.'),10:('Exact Shelhamer named child supports only existing candidate award-6a6b073e14f6. State-officer/MSU/GPA qualifiers remain exact; copied AMTOPP annotation is drift, not a different child mapping. No biography inference or accepted current identity.', 'Applicable exact-child/source/cycle identity and formal candidate validation preserving role/institution/GPA scope.')}
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
write('comparison.json',dict(schemaVersion=1,scope='Derived saved-evidence comparison; original packets remain authoritative',entryCommit=selection['entryCommit'],records=records,selectedInputs=3,fieldOccurrences=53,categoryCounts=dict(counts),priorComparedFieldOccurrences=196,cumulativeComparedFieldOccurrences=249,comparedAutonomousInputs=11,comparedPriorJayceeInputs=2,remainingAutonomousInputsOutsideComparison=395,acceptedFacts=0,originalFactsChanged=0,newSourceOrWorkbookReads=0,rawContentReinspections=0,fullSD2Complete=False,SD3Started=False,externalEffects=False))
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
