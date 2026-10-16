"""Generate only the48 selected saved-envelope comparisons; no network/raw inspection."""
from pathlib import Path
import collections
import hashlib
import json

P = Path(__file__).resolve().parent
R = P.parents[3]
B = P.parent
load = lambda p: json.loads(p.read_text())
sha = lambda b: hashlib.sha256(b).hexdigest()
canon = lambda x: json.dumps(x, sort_keys=True, separators=(',', ':'), ensure_ascii=False).encode()
selection = load(P / 'selection.json')
packet_path = 'docs/evidence/sd2-autonomous/checkpoint-001.json'
packet = load(R / packet_path)
pins = {}

def ref(path, pointer=''):
    path = str(path); digest = sha((R / path).read_bytes())
    assert path not in pins or pins[path] == digest
    pins[path] = digest
    return dict(path=path, sha256=digest, pointer=pointer)

def write(name, value):
    (P / name).write_text(json.dumps(value, indent=2, ensure_ascii=False) + '\n')

S = 'existing evidence consistent'
U = 'applicability/identity unresolved'
E = 'evidence unavailable'

def note(category, comparison, proof):
    return dict(category=category, comparison=comparison, minimumAdditionalProof=proof,
                proposalOnly=True, originalHoldRetained=True, newReadSelected=False)

notes = {
2: {
'amount': note(E, 'No amount is stated in the selected sanitized Ted instructions or attached to this envelope. A prior app/worksheet value cannot supply a current amount.', 'Applicable award-bound amount and basis, or explicit unresolved amount disposition.'),
'minimumGPA': note(U, 'The blank GPA field requests information; it supplies no minimum threshold. The original null/unverified value remains, never an unrestricted-GPA claim.', 'Explicit applicable entry-GPA threshold or complete applicable field-scope silence proof.'),
'gpaBasis': note(E, 'No scale, weighting or calculation basis is established by the selected instructions.', 'Explicit applicable GPA basis if a threshold is later supported.'),
'schoolType': note(U, 'Post-graduation school/trade/state/career prompts do not define permitted institution types. No Any-school or trade eligibility inference.', 'Applicable school/program eligibility wording, then field-specific mapping.'),
'residency': note(U, 'WHS athletics participation is a question/essay topic; it cannot establish applicant residence or an accepted school-affiliation eligibility rule.', 'Explicit applicable residence or school-affiliation condition, kept distinct.'),
'membership': note(E, 'No membership rule is supplied for this held envelope. Athletics involvement is not a membership-rule substitute.', 'Applicable membership rule or complete field-scope silence proof.'),
'needRequirement': note(U, 'A financial-need paragraph and FAFSA SAI printout are requested materials. They establish no financial-need eligibility threshold.', 'Explicit applicable financial-need eligibility condition or field-scope silence proof.'),
'needPriority': note(U, 'Need-related materials do not establish judging priority, weight or selection treatment.', 'Explicit applicable judging/selection rule for financial need.'),
'renewability': note(E, 'No renewal or reapplication policy is established by the selected instructions; neither is inferred from a historical deadline.', 'Explicit renewal rights/conditions, separately from reapplication.'),
'gapYears': note(E, 'A post-graduation plans prompt is not a gap-year permission or exclusion.', 'Applicable applicant-stage/gap-year rule or complete field-scope silence proof.'),
'deadline': note(S, 'The saved document states April3rd2026, corroborating the held2026-04-03 value within its expired application scope. No next-cycle date or present-open conclusion.', 'Applicable next-cycle deadline, purpose/precision and source identity before current use.'),
'applicationWindow': note(E, 'No opening date or current usable window is established. The expired2026 deadline is not a current application window.', 'Applicable opening/window and separate usable-route evidence.'),
'cycle': note(U, 'Document title/deadline identify historical2026 provenance, but not a full academic-year span or a future application cycle.', 'Explicit applicable application-cycle/academic-year identity without extrapolation.'),
'applicationMethod': note(U, 'The retained delivery prefix requests three paper-clipped packets; the staff recipient was sanitized. This supports historical paper delivery only, not a counselor identity, usable current destination or accepted route.', 'Applicable submission method/recipient route with publisher and identity proof; no contact data copied.'),
'materials': note(S, 'Keep three paper-clipped copies, community-service and financial-need paragraphs, athletics essay strictly less than2pages, transcript, any teacher/coach references and FAFSA SAI printout. The complete-materials instruction remains; Any references gives no numerical minimum. The three-copy transcription restoration is documented, with native hash unchanged and staff/biography omitted.', 'Applicable-cycle full materials and identity acceptance; clarify any reference minimum rather than inventing it.'),
'athleticsStatement': note(U, 'The sport/leadership question and athletics-meaning essay support a requested response, not an exclusive athlete eligibility rule. Original hardEligibility:null remains.', 'Explicit applicable athletic eligibility condition if a hard rule is proposed.'),
},
3: {
'amount': note(U, 'Saved parent text assigns10000 over four years to Anne Ford and5000 over two years to Allegra Ford Thomas. Neither amount belongs to the unidentified generic input.', 'Evidence identifying the original input, then that exact award/cycle amount and basis.'),
'minimumGPA': note(E, 'No entry-GPA threshold is attached to the generic input. Child-specific rules cannot be substituted for an unidentified award.', 'Original award identity and applicable entry-GPA evidence or field-scope silence proof.'),
'gpaBasis': note(E, 'No GPA basis is attached to the unidentified original input.', 'Original award identity and explicit applicable GPA basis if a threshold is supported.'),
'schoolType': note(U, 'The two named children have distinct bachelor versus community-college/vocational/technical/specialized-program scope. No union, intersection or generic school-type mapping is supported.', 'Identify original input first; then preserve its own institution/program wording.'),
'residency': note(E, 'No award-bound residence rule for the unidentified input is established by the retained parent excerpt.', 'Original identity and applicable residence scope or complete field-scope silence proof.'),
'membership': note(E, 'No membership rule for this generic input is established; silence in a parent synopsis is not an unrestricted conclusion.', 'Original identity and applicable membership rule or field-scope silence proof.'),
'needRequirement': note(E, 'No financial-need eligibility condition is attached to the generic record. Disability/program purpose is not financial-need evidence.', 'Original identity and applicable explicit need eligibility condition.'),
'needPriority': note(E, 'The selected parent excerpt establishes no need-ranking rule for the generic input.', 'Original identity and applicable judging treatment of financial need.'),
'renewability': note(U, 'The children have multi-year amount schedules. Those are not a renewal policy for the unidentified original record and do not establish reapplication rights.', 'Original identity and its own explicit funding/renewal/reapplication terms.'),
'gapYears': note(U, 'Parent child descriptions refer to graduating seniors and fall enrollment. These cannot establish a generic input gap-year rule.', 'Original award identity and applicable applicant-stage/gap-year scope.'),
'deadline': note(E, 'No current exact deadline is attached to the generic input. The old recorded year label and portal locator do not supply one.', 'Original identity and applicable award/cycle deadline with precision.'),
'applicationWindow': note(E, 'The saved parent text and unvisited login locator do not establish a generic award opening/window or usable route.', 'Original identity and applicable opening/window evidence; no login interaction.'),
'cycle': note(U, 'Annual parent language and the saved historical label do not identify an applicable cycle for this original input.', 'Original award identity and explicit application-cycle evidence.'),
'applicationMethod': note(U, 'Parent Learn More links and original login19 locator remain unvisited references. They do not establish the generic record application method or authorize portal use.', 'Original identity and an applicable public submission-method description.'),
'materials': note(E, 'No original-award material list is attached. A documented-LD eligibility criterion for named children does not establish a generic input application checklist.', 'Original identity followed by exact applicable materials/document requirements.'),
'parentDiscovery': note(U, 'Saved parent identifies two separate named children. Both require documented LD; ADHD applicants are encouraged when they also have LD. This supports the existing identity hold, not an ADHD-only award, deletion, child substitution or new stable IDs. Preserve child amount/duration/school/stage distinctions in original evidence.', 'Evidence identifying the original generic input and its relationship, if any, to either named child; otherwise retain unsupported-identity hold.'),
},
4: {
'amount': note(E, 'No amount is established by the selected academic-program text. Do not borrow sibling/adoption-grant amounts or recorded app values.', 'Applicable academic-award amount/basis or explicit unresolved amount disposition.'),
'minimumGPA': note(U, 'High achievement and academic progress wording provides no numerical GPA cutoff. Original null/unverified threshold stays; no unrestricted-GPA conclusion.', 'Explicit applicable academic-award entry-GPA rule or field-scope silence proof.'),
'gpaBasis': note(E, 'No scale/weighting/calculation basis is established in the saved academic-program text.', 'Applicable GPA basis only if an entry threshold is supported.'),
'schoolType': note(U, 'The saved academic criterion says advanced education plans to a4-year college. The separate null schoolType envelope is preserved; no Any-school, trade or sibling-grant eligibility inference.', 'Formal identity/applicability and field-specific institution mapping for the academic award.'),
'residency': note(E, 'No residence rule is established by the selected academic-program text; no location-based inference from sponsor name.', 'Applicable academic-award residence rule or complete field-scope silence proof.'),
'membership': note(E, 'Adopted-or-foster-care status is a different criterion from membership or use of this agency. No agency-client membership condition is inferred.', 'Explicit applicable membership/client restriction or field-scope silence proof.'),
'needRequirement': note(E, 'Overcoming adversity is not an explicit financial-need eligibility condition.', 'Explicit academic-award need eligibility rule or complete field-scope silence proof.'),
'needPriority': note(E, 'Adversity/character/achievement language does not establish financial-need ranking or a selection weight.', 'Explicit applicable academic-award judging treatment of financial need.'),
'renewability': note(E, 'No academic-award renewal or reapplication policy is supplied by the selected text.', 'Explicit renewal terms, separately from any reapplication permission.'),
'gapYears': note(U, 'High-school academic progress and college-bound language do not establish a general gap-year permission/exclusion or a precise graduating-class rule.', 'Applicable academic-award applicant-stage/gap-year scope.'),
'deadline': note(E, 'No exact applicable deadline is established in the selected academic-program excerpt.', 'Applicable academic-award deadline and precision; no extrapolated date.'),
'applicationWindow': note(E, 'An Apply Now link is a locator, not an opening date or a verified present-open route. The application was not inspected or used.', 'Applicable academic-award window and independently scoped usable-route evidence.'),
'cycle': note(E, 'The saved undated academic-program text establishes no specific cycle year or full academic-year span.', 'Explicit applicable academic-award cycle identity.'),
'applicationMethod': note(U, 'Saved text refers to furnishing/uploading materials and an academic application locator. No full form, submission process or current route was inspected.', 'Applicable public method and usable academic-award route, without form interaction.'),
'materials': note(S, 'Preserve two recommendation letters with at least one teacher/guidance-counselor letter, transcripts and/or applicable test scores, and must-be-willing public name/photo/personal-statement/college-update sharing. The text uses should for letters and transcript/test-score uploads; no numerical test cutoff, two-required-documents AND rule or mandatory-letter hard exclusion is created. Consent describes the awardee obligation; no names/photos/stories are collected.', 'Applicable academic-award full materials/identity acceptance; preserve should versus must and and/or wording.'),
'eligibility': note(U, 'The text says must for adopted-or-foster-care plus known adversity and4-year-college plans; should for character/high achievement and four-year high-school progress. Original values remain held and are not converted into uniformly mandatory AND eligibility. Academic award stays separate from sibling/adoption grants.', 'Applicable identity and typed criteria mapping preserving each must/should qualifier and program scope.'),
}}
registry = {s['sourceId']: (i, s) for i, s in enumerate(packet['sourceRegistry'])}
records = []; identity = []
for item in selection['selectedComparison']['orderedInputs']:
    ix = item['queueOffset']; row = packet['records'][ix]; fields = row['fieldProposals']
    assert sha(canon(row)) == item['recordCanonicalSha256'] and set(fields) == set(notes[row['rowLocator']])
    route = {k: row[k] for k in ['owner', 'trigger', 'authoritativePath', 'nextAction']}
    rr = ref(packet_path, item['recordPointer'])
    reviews = [ref('docs/evidence/sd2-autonomous/research-manifest.json'),
               ref('docs/evidence/sd2-autonomous/research-review.json'),
               ref('docs/evidence/sd2-autonomous/research-manifest-round1.json'),
               ref('docs/evidence/sd2-autonomous/research-review-round1.json'),
               ref('docs/evidence/sd2-autonomous/research-dispositions.json')]
    context = [rr]
    for sid in item['sourceIds']:
        ri, source = registry[sid];context += [ref(packet_path, f'/sourceRegistry/{ri}'), ref(source['artifactPath'])]
    if row['rowLocator'] == 2:
        context += [ref('docs/evidence/sd2-autonomous/native-receipts.json', '/2'),
                    ref('docs/evidence/sd1/pilot.json', '/records/0'), ref('docs/evidence/sd1/review.json')]
        native = load(R / 'docs/evidence/sd2-autonomous/native-receipts.json')[2]
        assert native['sourceId'] == 'ted-2026'
        assert native['selectedScope'].strip() == (R / registry['ted-2026'][1]['artifactPath']).read_text().strip()
    comparisons = []
    for name, env in fields.items():
        ep = item['recordPointer'] + '/fieldProposals/' + name
        evidence_refs = []
        for i, ev in enumerate(env['evidence']):
            ri, source = registry[ev['sourceId']]
            raw = (R / source['artifactPath']).read_bytes()
            assert sha(raw) == ev['artifactSha256'] == source['artifactSha256']
            assert ev['sourceUrl'] == source['requestedUrl'] and ev['excerpt'] in raw.decode()
            evidence_refs += [ref(packet_path, ep + f'/evidence/{i}'), ref(source['artifactPath'])]
        n = notes[row['rowLocator']][name]
        comparisons.append(dict(field=name, originalReference=ref(packet_path, ep),
            originalEnvelopeSha256=sha(canon(env)), originalEnvelope=env, originalRoute=route,
            evidenceReferences=evidence_refs, contextReferences=context, originalReviewReferences=reviews,
            comparison=n, holdDisposition='Retain original held acceptance, state, scope, timestamp and evidence.',
            nextActionRoute=dict(route, minimumProofProposal=n['minimumAdditionalProof'], newReadSelected=False)))
    records.append(dict(order=item['order'], savedInputKey=item['savedInputKey'], savedRowLocator=row['rowLocator'],
        displayLabel=item['displayLabel'], originalRecordedNameReference=item['recordedNameReference'],
        publicIdCandidates=item['publicIdCandidates'], originalIdentityAcceptance='held',
        originalRecordReference=rr, originalRecordRoute=route, fieldOccurrences=len(comparisons), fields=comparisons))
    if row['rowLocator'] == 2:
        conclusion='SD1 corroborates an existing mapped candidate by unique app name/source locator; saved Ted native metadata and text support document continuity. It remains a candidate, not formal accepted identity, current public custody or an accepted athletics restriction.'
        proof='Publisher/public-access and applicable-cycle identity/candidate validation; explicit eligibility before any hard athletic rule.'
    elif row['rowLocator'] == 3:
        conclusion='No public ID candidate. Parent names Anne Ford and Allegra Ford Thomas with distinct scopes; neither identifies the generic input. Preserve the original identity hold without deletion, substitution, merging or ID allocation.'
        proof='Evidence identifying the original generic input and its relationship to any specifically named program, or a retained unsupported-identity disposition.'
    else:
        conclusion='Saved academic-program title/criteria support the existing Adoption STAR academic candidate. That does not establish accepted mapping/current offering or any relationship to sibling/adoption grants. Preserve must/should qualifiers.'
        proof='Formal academic-program candidate validation, applicable-cycle evidence and any claimed route/public identity proof.'
    identity.append(dict(savedRowLocator=row['rowLocator'], displayLabel=item['displayLabel'], publicIdCandidates=item['publicIdCandidates'],
        originalIdentityAcceptance='held', comparisonCategory=U, conclusion=conclusion, minimumAdditionalProof=proof,
        originalIdentityProposal=row['identityProposal'], evidenceReferences=context, originalReviewReferences=reviews,
        originalRoute=route, nextAction='Retain exact original mapping/identity state; propose missing proof only.',
        acceptedMapping=False, newIdentityAllocated=False))
counts = collections.Counter(x['comparison']['category'] for r in records for x in r['fields'])
write('comparison.json', dict(schemaVersion=1, scope='Derived saved-evidence comparison; original packets remain authoritative',
    entryCommit=selection['entryCommit'], records=records, selectedInputs=3, fieldOccurrences=48, categoryCounts=dict(counts),
    priorPilotComparisons=96, cumulativeComparedFieldOccurrences=144, comparedAutonomousInputs=5,
    remainingAutonomousInputsOutsideComparison=401, acceptedFacts=0, originalFactsChanged=0,
    newSourceOrWorkbookReads=0, rawContentReinspections=0, fullSD2Complete=False, SD3Started=False, externalEffects=False))
write('identity-assessment.json', dict(schemaVersion=1, records=identity, acceptedMappings=0, newStableIds=0,
    deletedInputs=0, mergedInputs=0, childAwardsCreated=0, completePopulationIdentityReconciliation=False, SD3Started=False))
write('artifact-pins.json', dict(schemaVersion=1, artifacts=[dict(path=path, sha256=digest) for path,digest in sorted(pins.items())]))
source_views = []
for sid in ['ted-2026', 'ncld', 'adoption']:
    registry_index, source = registry[sid]
    occurrences = []
    for rec in records:
        for f in rec['fields']:
            for n, ev in enumerate(f['originalEnvelope']['evidence']):
                if ev['sourceId'] == sid:
                    occurrences.append(dict(savedInputKey=rec['savedInputKey'], field=f['field'],
                        envelopeReference=f['originalReference'], evidenceIndex=n,
                        originalEvidence=ev))
    source_views.append(dict(sourceId=sid, originalRegistryReference=ref(packet_path, f'/sourceRegistry/{registry_index}'),
        artifactReference=ref(source['artifactPath']), extractionLimits=source['extractionLimits'],
        sourceRevision=source.get('sourceRevision'), originalSourceStatus=source['status'],
        originalObservation=source.get('captureRecordedAt'), selectedEvidenceOccurrences=occurrences,
        newFetchPerformed=False, newSourceReceiptCreated=False))
write('saved-source-references.json', dict(scope='Generated reference view from final comparison; no new source capture or authoritative source registry', sources=source_views))
print(json.dumps(dict(selectedInputs=3, fieldOccurrences=48, categoryCounts=dict(counts), originalFactsChanged=0)))
