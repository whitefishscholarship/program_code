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
# Explicit selected passages; shared artifacts are never forwarded in full.
ranges={'rh-old':[(1,1),(5,5),(30,32),(42,44),(56,58),(80,96),(98,99),(101,112)],
        'rh-alias':[(1,1),(5,5)],'ffa':[(14,14),(16,20)],'ffa-applications':[(1,13)],
        'ffa-guidelines':[(1,26)],'ffa-college-rubric':[(1,1),(19,26),(53,53)],
        'ffa-leadership-rubric':[(1,1),(17,26),(99,99)],'amtopp':None}
registry={s['sourceId']:(i,s) for i,s in enumerate(packet['sourceRegistry'])}
contexts=[]
for sx in selection['selectedComparison']['sources']:
    sid=sx['sourceId']; source=registry[sid][1]; lines=(R/source['artifactPath']).read_text().splitlines()
    rs=ranges[sid] or [(1,len(lines))]
    contexts.append(dict(sourceId=sid,artifactReference=ref(source['artifactPath']),permittedInputKeys=sx['permittedInputKeys'],
        passages=[dict(startLine=a,endLine=z,quote='\n'.join(lines[a-1:z])) for a,z in rs],
        scopeLimit='Selected sanitized saved passages only; not full/native/visual/current source proof; no unselected award semantics.'))
write('selected-context.json',dict(scope='Local selected-passage reference view, not a new capture or source registry',sources=contexts))
notes={
5:{
'amount':note(S,'The exact Agri child says amounts vary. Original numeric value stays null with sourceQualifier varies; no bounds, per-year basis or current offering inferred.','Applicable named-child amount/basis and cycle, or retained unknown numeric amount.'),
'minimumGPA':note(E,'No award-bound minimum GPA is attached or established by the selected Agri synopsis. No unrestricted-GPA conclusion from this partial source.','Applicable Agri entry-GPA rule or complete applicable field-scope silence proof.'),
'gpaBasis':note(E,'No Agri scale, weighting or GPA calculation basis is established.','Explicit applicable GPA basis if a threshold is supported.'),
'schoolType':note(U,'High School Senior OR College student describes applicant stage; interested career fields do not impose a required degree, major or institution type. Original null schoolType stays.','Applicable named-child institution/program rule, separately from stage and career interest.'),
'residency':note(E,'The selected Agri statement supplies no applicant residence rule. Sponsor/page location cannot supply one.','Applicable child-bound residence rule or complete field-scope silence proof.'),
'membership':note(E,'Career interest is not a professional-association membership condition. No Agri membership rule is established.','Explicit child-bound membership condition or complete field-scope silence proof.'),
'needRequirement':note(E,'No Agri financial-need eligibility condition is established by the saved selected passages.','Applicable child-bound need eligibility rule or complete field-scope silence proof.'),
'needPriority':note(E,'No Agri financial-need selection priority or weight is established.','Applicable child-bound judging treatment of financial need.'),
'renewability':note(S,'The shared application FAQ explicitly distinguishes non-renewable year-by-year awards from reapplication while eligible, requiring a new annual application and reevaluation. Agri is named on that shared page. No automatic renewal or guaranteed repeat award.','Applicable-cycle child/shared-application continuity before current use; retain renewal versus reapplication distinction.'),
'gapYears':note(U,'The high-school-senior OR college-student condition does not establish a general gap-year permission or prohibition.','Applicable Agri applicant-stage and gap-year wording without inference from college status.'),
'deadline':note(U,'The shared parent supplies March1 at11:59PM MST as a recurring deadline; no specific year-bound Agri deadline is established. Original null deadline remains.','Applicable child/cycle deadline with year, time and stated timezone; never infer2027.'),
'applicationWindow':note(S,'Saved FAQ01 supports annual January1 through March1; FAQ19 supplies March1 11:59PM MST. Original currentYear:null stays; this is yearless shared-parent timing, not proof a child is open.','Applicable child and cycle continuity plus current opening/closing proof before current use.'),
'cycle':note(E,'The undated Agri child and annual parent terms establish no specific application or academic-year cycle.','Explicit applicable Agri cycle identity; no extrapolation from observation date.'),
'applicationMethod':note(U,'Shared page and FAQ06 support online-only applications and FAQ07 describes per-child supplemental questions. Original portalRead:false remains; saved login locator is not a verified usable or accepted current submission route.','Applicable child/shared-application continuity and public method/route proof without portal interaction.'),
'materials':note(U,'FAQ07 describes child-specific supplemental questions; FAQ09 accepts an unofficial transcript with specified identifiers. Later grade/enrollment follow-ups concern award payment. These do not establish a complete current Agri checklist; original null materials stays and no personal data is collected.','Applicable complete child checklist, separating initial application from awardee follow-up; retain source completeness limits.'),
'namedEligibilityStatement':note(S,'Exact named Agri statement retains High School Senior OR College student interested in careers related to irrigation, electrical trades, HVAC, water wells/pumps/drilling, underground utilities, plumbing, welding or fabrication. No mandatory degree/major or current-cycle acceptance.','Named-child identity/applicability and cycle proof before any typed accepted rule.'),
},
6:{
'amount':note(U,'RHM names one500USD FFA scholarship and the FFA page also states500 annually through Montana FFA. These support FFA-context amount only; generic AMTOPP member/FFA/4H identity remains unresolved.','Resolve original input to exact branch/cycle and amount basis, without borrowing another branch amount.'),
'minimumGPA':note(U,'RHM and AMTOPP FFA text state2.0orhigher for FFA. That threshold is not transferred to member-company employees or4-H, and generic input remains identity-held.','Exact FFA-branch identity/applicability, applicable cycle and explicit entry-GPA rule.'),
'gpaBasis':note(U,'Saved historical College and Leadership scoring rubrics use cumulative high-school GPA on4.0. A scoring basis for those documents does not establish the current AMTOPP FFA threshold basis or weighting; original null stays.','Exact child/branch/cycle threshold scale and weighting, separately from historical scoring.'),
'schoolType':note(U,'AMTOPP FFA wording covers Montana high-school seniors OR graduates of those schools enrolled as college/vocational freshmen in any state, planning horticultural/arboriculture-related majors. Keep stage, school affiliation, institution location and major distinct; no generic school-type union.','Identify original branch and current applicable institution/stage/major rules before mapping.'),
'residency':note(U,'Montana high-school affiliation and college/vocational study in any state are not an explicit applicant-residence requirement.4-H Montana membership is another branch condition.','Exact branch identity and explicit residence rule, separately from school/organization geography.'),
'membership':note(U,'FFA membership plus at least two years agricultural education applies to the FFA branch. Employees of member companies and current Montana4-H members describe separate programs. No union/intersection or generic membership winner.','Resolve original branch and its explicit organization/tenure requirements.'),
'needRequirement':note(U,'AMTOPP FFA selection lists financial need5points. A scoring consideration is not a hard financial-need eligibility threshold; separate leadership rubric conditions cannot be imported.','Applicable exact-branch need eligibility wording, distinct from selection scoring.'),
'needPriority':note(U,'AMTOPP FFA text lists need5points with separate academic/FFA/career/SAE/community/reference components. Historical college/leadership rubrics have different scopes and weights; no adopted generic/current weighting.','Applicable branch/cycle judging rubric and identity, retaining all source-version differences.'),
'renewability':note(U,'RHM shared FAQ says non-renewable with annual reapplication while eligible. It applies only within that application relationship, not automatically to member or4-H branches; generic identity is held.','Resolve branch and current shared-application relationship, then its renewal/reapplication terms.'),
'gapYears':note(U,'AMTOPP FFA senior/freshman wording does not establish broad gap-year eligibility.4-H ages9-19 and employee status are separate scopes.','Exact branch/cycle applicant-stage and gap-year criteria.'),
'deadline':note(U,'Keep separate member January5 received/postmarked wording, historical4-H March13,2026, FFA applications March1,2026 and2021guideline December31 references. No single generic or next-cycle deadline.','Exact branch, cycle and deadline purpose/precision; preserve historical versions without selecting a winner.'),
'applicationWindow':note(U,'RHM/FFA yearless January1-March1 terms describe a shared route, not every AMTOPP branch or a2027opening. FFA page available-now language is historical at capture.','Exact branch/cycle window and applicable route, no live-open inference.'),
'cycle':note(U,'Original envelope preserves FFA applications March1,2026, guideline updatedJune28,2021, olderDecember31 reference and nextCycle:null. These belong to different versions/scopes, not one coherent current cycle; do not replace with4-H or member dates.','Exact branch/cycle/version continuity and timing evidence, retaining all historical pointers.'),
'applicationMethod':note(U,'RHM/FFA shared portal, older linked college/leadership application locators, member email/mail and4-H document link remain distinct. All forms/portals are unvisited locators; no route selection or usable-current claim.','Resolve original branch then its applicable public submission method/route; no login/form interaction.'),
'materials':note(U,'Original null checklist remains. AMTOPP FFA text mentions career/community essays, SAE and adviser/community reference scoring;2021college guidelines list photo/transcript/two forms plus later thank-you/enrollment/class follow-up. Shared questions and college/leadership rubric prompts cannot become a complete current child checklist.','Applicable complete exact-branch/cycle materials with initial versus awardee timing and judging versus required-document distinctions.'),
'namedEligibilityStatement':note(U,'RHM exact child says HS Senior,2.0GPAorhigher,FFA and one500USD scholarship. AMTOPP FFA source adds Montana-high-school graduate/freshman alternative, two AgEd years and horticulture/arboriculture major scope. Preserve both without declaring same cycle, merging into one accepted rule or resolving generic identity.','Resolve saved generic input to exact child/branch and applicable versions while retaining every qualifier.'),
'recipientSlots':note(U,'RHM one scholarship supports one FFA-context recipient slot. It does not establish a generic AMTOPP slot count or another award identity.','Exact branch/cycle recipient count, separate from distinct awards and amount basis.'),
'identityBranches':note(C,'Retain original conflict state: generic AMTOPP source spans employee-member drawing with January5 receipt/postmark, FFA senior/freshman membership/twoAgEd/GPA2.0/horticulture-arboriculture and Montana4-H ages9-19/project branch with March13,2026. RHM and FFA support only an FFA candidate. No winner, union/intersection, child creation or accepted mapping.','Evidence resolving the original generic input and its exact branch/cycle, or an explicit retained ambiguous-identity disposition.'),
},
7:{
'amount':note(U,'Saved child says1000USD for one or more recipients. Original perRecipient:1000 envelope is retained held; the wording does not independently disambiguate total versus per-recipient basis. No multiplication or funding total inferred.','Applicable explicit amount allocation/basis and child/cycle identity; otherwise retain basis ambiguity.'),
'minimumGPA':note(E,'The selected Bridging statement establishes no GPA cutoff; no unrestricted-GPA conclusion.','Applicable child entry-GPA rule or complete field-scope silence proof.'),
'gpaBasis':note(E,'No Bridging GPA scale, weighting or calculation basis is established.','Explicit applicable basis if a threshold is later supported.'),
'schoolType':note(E,'Shared payment-to-school and enrollment follow-up do not define allowed Bridging institution/program types.','Applicable child institution/program rule or complete field-scope silence proof.'),
'residency':note(E,'No applicant residence condition is established by the selected Bridging synopsis; sponsor geography is not residence evidence.','Applicable child residence rule or complete field-scope silence proof.'),
'membership':note(E,'Will-or-have-aged-out foster-care status is not a membership condition. No association/client membership rule is established.','Applicable child membership/client restriction or complete field-scope silence proof.'),
'needRequirement':note(E,'Foster-care criterion alone is not an explicit financial-need threshold.','Applicable child need eligibility condition or complete field-scope silence proof.'),
'needPriority':note(E,'No need selection weight/priority is established by the selected Bridging statement.','Applicable child judging treatment of financial need.'),
'renewability':note(S,'Shared FAQ expressly separates non-renewable year-by-year awards from reapplication while eligible, with new application and reevaluation. Named Bridging child remains held; no guaranteed repeat funding.','Applicable child/cycle shared-application continuity before current use.'),
'gapYears':note(E,'Will or have aged out describes foster-care timing, not school-stage or general gap-year eligibility.','Applicable child applicant-stage/gap-year rule or complete field-scope silence proof.'),
'deadline':note(U,'Shared yearless March1 at11:59PM MST is not a specific year-bound Bridging deadline; original null remains.','Applicable child/cycle deadline year, purpose, precision and timezone; no inferred2027date.'),
'applicationWindow':note(S,'FAQ01 supports annualJanuary1-March1 and FAQ19 supplies11:59PM MST close. currentYear:null remains; yearless shared-parent text does not prove a current child opening.','Applicable child/cycle continuity and current opening/closing evidence before current use.'),
'cycle':note(E,'Undated Bridging synopsis and recurring parent terms establish no specific cycle or full academic-year span.','Explicit applicable child/cycle identity.'),
'applicationMethod':note(U,'Exact child must complete Reach Higher Montana application; FAQ06 online-only and FAQ07 per-child supplemental questions support shared-method context. Original portalRead:false stays; no usable/current/accepted destination or form inspection.','Applicable child/shared-application continuity and exact public method/route proof.'),
'materials':note(U,'Shared questions/unofficial-transcript guidance and later grade/enrollment/payment follow-ups do not supply a complete current Bridging checklist. Original null materials stays; no personal data collected.','Applicable complete child materials, separating application documents from awardee follow-up and preserving completeness limits.'),
'namedEligibilityStatement':note(S,'Exact named child states1000USD for one-or-more recipients, must complete RHM application AND will or have aged out of foster care. Preserve amount-basis ambiguity separately; do not broaden to all foster-care/adopted applicants.','Applicable child identity/cycle acceptance and any missing allocation details; retain exact aged-out wording.'),
'recipientSlots':note(S,'One or more recipients supports original minimum:1 only, no maximum, total funding, guarantee or additional award identities.','Applicable current child/cycle recipient allocation if a stronger count is proposed.'),
'fosterCareCriterion':note(S,'Exact will-or-have-aged-out condition supports original held boolean within named-child source scope. It does not cover every foster-care/adopted applicant or define an age cutoff, dates or documentation.','Applicable child/cycle identity and explicit criterion mapping retaining exact wording and unknown age/document rules.'),
}}
records=[]; identities=[]
identity_notes={5:('Named Agri child and shared RHM route support only existing candidate award-1b50b8ba8dc7. Alias equal bytes add no independent corroboration or current/publisher/ID acceptance. Career interest and stage OR are retained.', 'Applicable named-child/source identity and cycle continuity plus formal candidate validation; no degree restriction inferred.'),6:('Generic saved AMTOPP remains identity-conflicted. Existing award-15228c015499 has only an FFA candidate relationship; employee-member and4-H branches remain separate context, not substituted/new awards. No rule merging or winning branch.', 'Resolve original input branch/cycle and exact candidate relationship without discarding any branch or inventing IDs.'),7:('Named Bridging child and shared RHM route support only existing candidate award-c0fca5630f43. Will-or-have-aged-out and amount-allocation ambiguity remain exact; no accepted mapping/current offering.', 'Applicable named-child/source/cycle continuity and formal candidate validation; separately resolve amount allocation if needed.')}
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
write('comparison.json',dict(schemaVersion=1,scope='Derived saved-evidence comparison; original packets remain authoritative',entryCommit=selection['entryCommit'],records=records,selectedInputs=3,fieldOccurrences=52,categoryCounts=dict(counts),priorComparedFieldOccurrences=144,cumulativeComparedFieldOccurrences=196,comparedAutonomousInputs=8,comparedPriorJayceeInputs=2,remainingAutonomousInputsOutsideComparison=398,acceptedFacts=0,originalFactsChanged=0,newSourceOrWorkbookReads=0,rawContentReinspections=0,fullSD2Complete=False,SD3Started=False,externalEffects=False))
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
print(json.dumps(dict(selectedInputs=3,fieldOccurrences=52,categoryCounts=dict(counts),originalFactsChanged=0)))
