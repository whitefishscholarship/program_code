"""Build the selected derived view from immutable saved envelopes; no network/raw reads."""
from pathlib import Path
import collections
import hashlib
import json

P = Path(__file__).resolve().parent
R = P.parents[3]
B = P.parent
load = lambda p: json.loads(p.read_text())
sha = lambda b: hashlib.sha256(b).hexdigest()
canon = lambda x: json.dumps(x, sort_keys=True, ensure_ascii=False, separators=(',', ':')).encode()
selection = load(P / 'selection.json')
pins = {}

def ref(path, pointer=''):
    path = str(path)
    digest = sha((R / path).read_bytes())
    if path in pins:
        assert pins[path] == digest
    pins[path] = digest
    return dict(path=path, sha256=digest, pointer=pointer)


def write(name, obj):
    (P / name).write_text(json.dumps(obj, indent=2, ensure_ascii=False) + '\n')

# Author comparisons are explicit for each selected field. They annotate saved
# envelopes; no key below replaces a factual value, scope, timestamp or hold.
S = 'existing evidence consistent'
U = 'applicability/identity unresolved'
C = 'existing evidence conflicting'
E = 'evidence unavailable'

def a(category, reason, needed):
    return dict(category=category, comparison=reason, minimumAdditionalProof=needed,
                proposalOnly=True, originalHoldRetained=True, newReadSelected=False)

spear = {
'amount': a(S, 'The saved 2025 and 2026 texts both describe USD500; the selected envelope is expressly historical class2026.', 'Applicable-cycle amount and accepted award identity before current use.'),
'minimumGPA': a(E, 'The original envelope has no GPA evidence. Neither a blank value nor the retained selected texts establishes unrestricted GPA eligibility.', 'Applicable award-bound entry-GPA rule or complete field-scope silence proof.'),
'gpaBasis': a(E, 'No GPA scale, weighting or calculation basis is established for this selected envelope.', 'Explicit applicable GPA basis if any threshold is later supported.'),
'schoolType': a(U, 'Saved text invites life-skills, vocational, technical, trade and undergraduate paths; that language does not validate a normalized Any-school value or the held mapping.', 'Award-bound school-type mapping with life-skills/program scope preserved.'),
'residency': a(U, 'The saved school affiliation is Whitefish High School or Whitefish Independent High School. School attendance does not itself establish applicant residence.', 'An explicit residence rule, or complete applicable field-scope silence proof.'),
'membership': a(E, 'No exact membership evidence is attached to this original null envelope; no required/not-required conclusion follows.', 'Applicable membership rule or complete field-scope silence proof.'),
'needRequirement': a(E, 'No need eligibility evidence is attached. Disability eligibility is not proof of financial-need eligibility.', 'Applicable explicit need eligibility rule or field-scope silence proof.'),
'needPriority': a(E, 'Need selection priority is not established by the attached record. It cannot be inferred from scholarship purpose.', 'Applicable selection criteria identifying treatment of financial need.'),
'renewability': a(E, 'The saved use-year requirement is not a renewal or reapplication policy.', 'Explicit renewal terms or complete applicable field-scope silence proof.'),
'gapYears': a(U, 'The 2026 document identifies Class of2026 and use in2026-2027. It does not support a general future gap-year rule.', 'Applicable applicant-stage/gap-year rule scoped to its cycle.'),
'deadline': a(S, 'The 2026 text states April17,2026; the earlier scan states April4 with its historical version. These distinct versions must not be combined into a next-cycle date.', 'Applicable next-cycle deadline and purpose/precision before current use.'),
'applicationWindow': a(E, 'A historical deadline and downloadable document do not establish an opening date or a current usable window.', 'Applicable opening/window evidence and separate current route proof.'),
'cycle': a(S, 'The saved class2026 and use2026-2027 terms corroborate the original historical envelope; nextApplication remains null.', 'Explicit next application-cycle identity; no extrapolated year.'),
'applicationMethod': a(U, 'Saved2026 instructions name delivery to the high-school guidance counselor. The original null envelope stays unchanged; this historical instruction does not prove a current route.', 'Applicable-cycle submission method plus route/identity proof.'),
'materials': a(S, 'The old scan has250 words;2026 asks a brief coping/challenges/goals essay and two recommendations. The old word limit is not inherited into2026; reference-provider examples remain in original evidence.', 'Applicable-cycle complete materials and accepted source identity before publication.'),
'identityContinuity': a(U, 'Distinct exact file IDs, matching program/schools/USD500 support candidate continuity beyond the earlier name-only hold. Public access, publisher custody and formal mapping remain unproved.', 'Publisher/source custody and formal validation of the retained app/source mapping.'),
'disabilityCriterion': a(S, 'The saved2026 text supports the documented diagnosis condition and enumerated/comparable conditions exactly within that class scope. No student answer or applicant data is used.', 'Applicable-cycle criterion and accepted identity before any matching use.'),
}
sor = {
'amount': a(S, 'Saved program text distinguishes variable club awards averaging1000, regional alternatives3000/5000 and international10000;16000 is potential cumulative competitive funding, not a guaranteed initial grant.', 'Applicable local/level-specific amount and award identity for current publication.'),
'minimumGPA': a(E, 'No GPA evidence is attached to this null envelope; a general eligibility list does not automatically prove no GPA requirement.', 'Applicable explicit entry-GPA rule or complete field-scope silence proof.'),
'gpaBasis': a(E, 'No GPA scale/weighting/basis is supported by this envelope.', 'Applicable explicit basis if any GPA threshold is supported.'),
'schoolType': a(U, 'Accepted/enrolled vocational or skills training and undergraduate programs are program descriptions, not unrestricted2-year/4-year/trade/GED eligibility.', 'Field-specific school/program mapping; GED-only scope must not be inferred.'),
'residency': a(U, 'Member-country residence is in the saved eligibility evidence. Preserve the entire original country list there; do not infer local club eligibility or current country scope.', 'Applicable award-bound residence/country and local participation scope.'),
'membership': a(U, 'The eligibility envelope excludes Soroptimist members, employees and immediate family; the separate membership envelope remains null. Do not replace that exclusion with unrestricted membership.', 'Field-specific mapping of the exact member/employee/family exclusion.'),
'needRequirement': a(S, 'The saved program explicitly requires financial need; SD1 prior proposed need evidence is corroborative, not accepted current truth.', 'Applicable-cycle/identity acceptance for use; no expanded need-selection conclusion.'),
'needPriority': a(U, 'Required financial need and optional expense/income detail do not establish a ranking weight or prioritization rule.', 'Explicit applicable judging/selection treatment of need.'),
'renewability': a(U, 'No-prior-recipient eligibility is retained in eligibility. Successive judging levels and the old recorded Non-Renewing label do not establish a general renewal policy.', 'Explicit applicable renewal/reapplication policy, preserving prior-recipient exclusion.'),
'gapYears': a(E, 'No gap-year rule is attached; adult/program eligibility is not a blanket gap-year permission.', 'Applicable applicant-stage/gap-year condition or field-scope silence proof.'),
'deadline': a(U, 'Saved annual November15 materials cutoff is corroborated by the annual window; the separate exact deadline remains null because no dated cycle/timezone is established.', 'Applicable dated cycle/deadline precision and timezone where published.'),
'applicationWindow': a(S, 'Both saved program and preparation text support annual August1-November15; no cycle year or open-today inference is added.', 'Explicit applicable cycle and usable-route evidence before open status.'),
'cycle': a(U, 'Annual timing has no dated cycle identity. Calendar date alone cannot convert this null envelope into a current open award.', 'Provider evidence explicitly identifying the applicable cycle.'),
'applicationMethod': a(U, 'Saved application links are locators only; no login/form or route-operability test occurred. The app/source crosswalk remains held.', 'Accepted app/source mapping and applicable usable submission route.'),
'materials': a(S, 'Saved preparation rules require one online reference form completed by the deadline, optional second reference,750-word personal statement,300-word goals description, optional finances and own-voice writing. Letters are not required by that reference-form wording.', 'Applicable-cycle full material scope and identity; reference/form routes remain untouched.'),
'programIdentity': a(U, 'The canonical program title and organization support program identity. They do not independently validate award-52b096183d9d or bind the older app locator to a current usable route.', 'Formal app/source crosswalk validation with retained aliases; current-cycle proof separately.'),
'eligibility': a(S, 'The saved list jointly preserves woman/primary support for self and dependents/need/enrollment/member-country/no-prior-award/no-graduate-degree-or-study/member-employee-family exclusion. AI grammar/organization guidance and own-voice writing remain scoped in materials.', 'Applicable-cycle/identity acceptance; no eligibility guarantee or country-list shortening.'),
}

jc = {
'documentSponsor': a(S, 'Both saved current documents and the respective legacy PRELUDE name the national foundation; this does not prove a separate Montana legal sponsor.', 'Formal identity acceptance and any claimed local legal relationship.'),
'documentAwardName': a(S, 'The named current document track agrees with the corresponding legacy track in PRELUDE. Identical organizer labels do not merge the two tracks.', 'Formal same-track mapping validation; explicit publisher replacement chain remains absent.'),
'montanaSponsorRelationship': a(U, 'PRELUDE supplies parent/state and legacy continuity observations beyond the original two-document gap. It still does not establish a separate Montana Jaycee Foundation legal identity or organizer-name alias.', 'Explicit official organizer-name/legal-relationship evidence if that relationship is claimed.'),
'applicationCycleLabel': a(S, 'The saved SCHOLAR:2026-2027 label is retained literally, separately from2027 graduation/start and unknown full academic-year window.', 'Formal applicability/identity acceptance; no inferred academic-year range.'),
'educationalStartYear': a(S, 'The corresponding current document explicitly requires a2027 educational start; legacy2026 deadline is separate prior-cycle provenance.', 'Applicable identity/field acceptance before current publication.'),
'academicYear': a(U, 'Document label and start year do not supply a complete academic-year window.', 'Explicit applicable academic-year span if publication needs it.'),
'deadline': a(S, 'Both current documents support mailed/postmarked January12,2027 as a date-only term; PRELUDE records Kelsey approval of this exact correction. Legacy January12,2026 remains historical.', 'Formal identity/publication acceptance; timezone remains null where unprovided.'),
'opens': a(U, 'No exact opening date is established. PRELUDE reports a parent program-open observation as ofOctober14; that is not an opening timestamp for this held row.', 'Applicable exact opening date if needed; no inference from a downloadable form.'),
'availability': a(U, 'PRELUDE reports the parent2026-2027 program open and both document links at its observation time. That supplements the old gap but does not prove present row-level availability or a usable submission route.', 'Applicable row/track identity plus current usable-route and availability evidence.'),
'entryGpa': a(U, 'The exact track threshold agrees with its legacy track. Scale, weighting and calculation basis remain null; the threshold cannot be used as an accepted student exclusion.', 'Explicit applicable GPA scale/weighting/basis plus formal identity acceptance.'),
'renewalGpa': a(E, 'Original complete-document silence is retained as unstated; entry GPA does not become renewal GPA.', 'Explicit renewal-GPA policy only if a renewal claim is later made.'),
'applicantStage': a(S, 'The saved current document specifies graduating high-school seniors/2027 graduates. Immediate full-time post-graduation attendance stays in eligibility conditions.', 'Formal applicability/identity acceptance; no gap-year expansion.'),
'eligibilityConditions': a(S, 'Keep the exact AND conditions: graduation, U.S.citizenship, listed-state residence, accredited U.S.destination, track GPA,2027 start and immediate first-year full-time study. PRELUDE participation corroboration does not erase any condition.', 'Formal identity/field acceptance and unresolved GPA/route details.'),
'montanaParticipation': a(U, 'Original document packet did not inspect the contact list; PRELUDE later records an inline Montana state entry. This is saved corroboration, not a fresh state/contact check or accepted eligibility fact.', 'Applicable verified participation/contact route bound to this track; no contact values copied.'),
'destinationScope': a(S, 'The exact track destination wording is preserved; vocational specialized/community-college programs are distinct from college/university wording.', 'Formal applicability/identity acceptance without broader school/degree inference.'),
'schoolTypes': a(U, 'Vocational trade mapping is limited by specialized-program scope; university college/university wording does not establish four-year-only or Any-school eligibility.', 'Field-specific accepted institution classification for this track.'),
'studyPaths': a(U, 'Vocational certificate/associate plus diploma/license and bachelor exclusion stay distinct; university silence does not establish bachelor-only or unrestricted degrees.', 'Field-specific applicable degree/path evidence where a normalized classification is needed.'),
'amount': a(S, 'Retain the track discrete alternatives and recipient counts exactly. Legacy amounts remain prior-cycle; PRELUDE approvals cover the new alternatives, not an amount-choice rule or guaranteed payment.', 'Explicit amount-choice basis plus formal identity/publication acceptance.'),
'fundingKind': a(S, 'The current document calls these grants, supporting a held gift proposal. It does not guarantee receipt or prove renewal rights.', 'Formal applicable identity/field acceptance before publication.'),
'needRequired': a(U, 'Complete-document silence remains unstated, not not_required. Financial questions and the optional5B/checklist conflict do not establish need eligibility.', 'Explicit applicable need eligibility evidence if a positive/negative requirement is claimed.'),
'needSelection': a(U, 'Optional circumstances and education-cost questions do not establish a judging weight for need; PRELUDE approval did not cover that unknown.', 'Explicit applicable judging/selection rule for financial need.'),
'financialStatementAmbiguity': a(C, 'The same current document labels5B optional while its checklist asks5A and5B answered. Preserve both instructions without choosing a winner or creating mandatory need eligibility.', 'Official clarification of the exact optional5B/checklist inconsistency.'),
'renewal': a(E, 'First-year tuition and one-time funding basis do not establish an explicit nonrenewable policy; original unstated envelope remains.', 'Explicit renewal rights/conditions if a renewal claim is later needed.'),
'reapplication': a(E, 'Original complete-document silence remains unstated; no later competitive reapplication rule is supplied.', 'Explicit applicable reapplication policy if a claim is later needed.'),
'nomination': a(E, 'Educator reference and state-level processing are not nomination evidence; original unstated envelope stays.', 'Explicit nomination requirement or complete applicable field-scope silence evidence.'),
'applicationMode': a(S, 'Current saved instructions require one postal package and no electronic submissions. This is document-scoped, not a live-route test.', 'Formal mapping and usable state destination before operational advice.'),
'applicationRouting': a(U, 'The saved residence-state routing rule and no-forwarding condition stand. PRELUDE state listing corroborates participation historically but does not test current mailing usability or explicit old/new replacement.', 'Applicable state submission destination/route proof; preserve contact-data exclusion.'),
'materials': a(S, 'Preserve all original nested requirements:300-500 words/word count, up to3 references with educator minimum, transcript, conditional acceptance letter, up to3 supporting pages, optional photo, sections7-9, track financial costs, complete form, working home email, signature/date and package order. Legacy photo-required and signature-section10 do not replace current optional-photo/section6.', 'Applicable complete cycle-specific material/identity acceptance;5B conflict remains separately held.'),
 'testScores': a(S, 'Vocational ACT/SAT not-required and university not-mandatory with possible judging points remain track-specific. Do not transfer university points into vocational or invent minimum scores.', 'Formal applicable identity/field acceptance; no inferred test minimum.'),
'focus': a(U, 'Vocational examples are non-exhaustive; university chosen-field statement is not a mandatory-major restriction. No construction-only, Any-major or bachelor-only conclusion.', 'Explicit applicable major restriction or accepted descriptive classification if needed.'),
'otherEligibility': a(U, 'Original unstated age/GED/gap-year/membership/gender/disability/ethnicity entries remain null. Immediate post-graduation full-time attendance is retained separately and not overwritten by broad gap-year permission.', 'Applicable explicit extra eligibility for any proposed positive/negative rule.'),
}

source_packet = 'docs/evidence/sd2-autonomous/checkpoint-001.json'
jaycee_packet = 'docs/evidence/sd2-jaycee/proposals.json'
prelude_path = 'docs/evidence/sd2-autonomous/PRELUDE.json'
pilot_path = 'docs/evidence/sd1/pilot.json'
packets = {source_packet: load(R / source_packet), jaycee_packet: load(R / jaycee_packet)}
source_registry = {s['sourceId']: (i, s) for i, s in enumerate(packets[source_packet]['sourceRegistry'])}
source_texts = {k: (R / s['artifactPath']).read_text() for k, (_, s) in source_registry.items()
                if k in {'spear-2025', 'spear-2026', 'soroptimist', 'sor-preparing'}}
# Exact inherited original route from Jaycee SESSION_WRAP; later PRELUDE reviewer
# designation is carried separately instead of rewriting this historical route.
wrap_path = 'docs/evidence/sd2-jaycee/SESSION_WRAP.md'
wrap_lines = (R / wrap_path).read_text().splitlines()
route_line = next(x for x in wrap_lines if x.startswith('| Every held/unknown field'))
parts = [x.strip() for x in route_line.split('|')[1:-1]]
jaycee_route = dict(owner=parts[1], trigger=parts[2].split('. Treat complete-source')[0] + '.',
                    nextAction='Treat complete-source' + parts[2].split('. Treat complete-source', 1)[1],
                    inheritance=ref(wrap_path, 'table row: Every held/unknown field'), exactTableRow=route_line)
evidence_rows = packets[jaycee_packet]['evidence']
records = []
identity = []
for item in selection['selectedPilot']['orderedInputs']:
    path = item['packetPath']; row_index = int(item['recordPointer'].split('/')[-1])
    row = packets[path]['records'][row_index]
    rownum = item['savedRowLocator']; field_map = row[item['fieldContainer']]
    notes = spear if rownum == 45 else sor if rownum == 290 else jc
    assert set(field_map) == set(notes), (rownum, set(field_map) ^ set(notes))
    record_ref = ref(path, item['recordPointer'])
    route = ({k: row[k] for k in ['owner', 'trigger', 'nextAction']} |
             {'inheritance': record_ref}) if item['autonomousQueueMember'] else jaycee_route
    related = [record_ref]
    if rownum in [45, 290]:
        pi = 2 if rownum == 45 else 9
        related += [ref(pilot_path, f'/records/{pi}')]
        # Original research review, including preserved earlier rejected bindings.
        reviewrefs = [ref('docs/evidence/sd2-autonomous/research-manifest.json'),
                      ref('docs/evidence/sd2-autonomous/research-review.json')]
    else:
        pi = 0 if rownum == 40 else 1
        related += [ref('docs/evidence/sd2-jaycee/identity-comparison.json', f'/records/{pi}'),
                    ref(prelude_path, f'/jayceeLegacy/records/{pi}'),
                    ref(prelude_path, '/jayceeLegacy/materialsVersionBoundary'),
                    ref(prelude_path, '/jayceeLegacy/identityEvidenceDetermination'),
                    ref(prelude_path, '/jayceeParent'),
                    ref(prelude_path, '/jayceeLegacy/humanApproval')]
        reviewrefs = [ref('docs/evidence/sd2-jaycee/final-candidate-manifest.json'),
                      ref('docs/evidence/sd2-jaycee/review.json')]
    selected_fields = []
    for name, original in field_map.items():
        refs = []
        if item['autonomousQueueMember']:
            for n, ev in enumerate(original['evidence']):
                registry_index, source = source_registry[ev['sourceId']]
                assert ev['artifactSha256'] == sha((R / source['artifactPath']).read_bytes())
                assert ev['sourceUrl'] == source['requestedUrl']
                # Source-scope exact excerpts are retained; availability is not refreshed.
                assert ev['excerpt'] in source_texts[ev['sourceId']], (rownum, name, n)
                refs += [ref(path, f"{item['recordPointer']}/{item['fieldContainer']}/{name}/evidence/{n}"),
                         ref(path, f'/sourceRegistry/{registry_index}'), ref(source['artifactPath'])]
        else:
            for evidence_id in original['evidenceIds']:
                matches = [(n, e) for n, e in enumerate(evidence_rows) if e['evidenceId'] == evidence_id]
                assert len(matches) == 1
                ei, ev = matches[0]
                assert ev['inputRowLocator'] == rownum and ev['field'] == name
                assert ev['value'] == original['value'] and ev['state'] == original['state']
                assert ev['scope'] == original['scope'] and ev['observedAt'] == original['observedAt']
                refs += [ref(path, f'/evidence/{ei}'), ref('docs/evidence/sd2-jaycee/' + ev['extractionArtifact'])]
        pointer = f"{item['recordPointer']}/{item['fieldContainer']}/{name}"
        selected_fields.append(dict(field=name, originalReference=ref(path, pointer),
            originalEnvelopeSha256=sha(canon(original)), originalEnvelope=original,
            originalRoute=route, evidenceReferences=refs, comparison=notes[name],
            corroborationReferences=related, originalReviewReferences=reviewrefs,
            holdDisposition='Retain original held acceptance; no source fact or identity changed.',
            nextActionRoute=dict(owner=route['owner'], trigger=route['trigger'],
                authoritativePath=path, nextAction=route['nextAction'],
                minimumProofProposal=notes[name]['minimumAdditionalProof'], newReadSelected=False)))
    records.append(dict(order=item['order'], savedInputKey=item['savedInputKey'],
        savedRowLocator=rownum, publicIdCandidates=item['publicIdCandidates'],
        existingCanonicalIdCandidate=row.get('existingCanonicalIdCandidate'),
        originalRecordReference=record_ref, originalIdentityAcceptance='held',
        originalRecordRoute=route, fieldOccurrences=len(selected_fields), fields=selected_fields))
    identity.append(dict(savedRowLocator=rownum, publicIdCandidates=item['publicIdCandidates'],
        existingCanonicalIdCandidate=row.get('existingCanonicalIdCandidate'), originalIdentityAcceptance='held',
        comparisonCategory=U, conclusion=notes['identityContinuity' if rownum == 45 else 'programIdentity' if rownum == 290 else 'documentAwardName']['comparison'],
        unresolvedProof=notes['identityContinuity' if rownum == 45 else 'programIdentity' if rownum == 290 else 'montanaSponsorRelationship']['minimumAdditionalProof'],
        evidenceReferences=related, originalReviewReferences=reviewrefs,
        owner='Codex identity/source reconciliation', trigger='Applicable authorized identity evidence arrival or later selected formal identity reconciliation',
        authoritativePath=path, nextAction='Retain existing candidate and original mapping hold; propose exact missing proof without new reads.',
        identityAccepted=False))
counts = collections.Counter(f['comparison']['category'] for r in records for f in r['fields'])
write('comparison.json', dict(schemaVersion=1, scope='Selected derived comparison only; original packets remain authoritative',
    entryCommit=selection['entryCommit'], selectedInputs=4, cases=3, fieldOccurrences=96,
    categoryCounts=dict(counts), records=records, originalFactsChanged=0, acceptedFacts=0,
    newSourceOrWorkbookReads=0, fullSD2Complete=False, SD3Started=False, externalEffects=False))
write('identity-assessment.json', dict(schemaVersion=1, records=identity,
    jayceePair=dict(comparisonCategory=U, decision='Preserve two distinct candidates and their separate canonical/public IDs; do not merge the duplicate organizer names.',
        basis='Legacy/current track titles and respective3.25/3.75 GPA thresholds plus distinct source routes corroborate separate same-track candidates. PRELUDE supplies historical parent/legacy support, not an explicit publisher replacement chain or a separate Montana legal sponsor.',
        scopeLimits='No complete-population canonical/public-ID collision audit, current route test or formal mapping acceptance performed.',
        evidenceReferences=[ref(prelude_path, '/jayceeLegacy/identityEvidenceDetermination'), ref('docs/evidence/sd2-jaycee/identity-comparison.json')],
        acceptedMappings=0), acceptedMappings=0, newStableIds=0, SD3Started=False))
write('artifact-pins.json', dict(schemaVersion=1, scope='Only selected saved evidence and review artifacts; exact bytes protected',
    artifacts=[dict(path=k, sha256=v) for k, v in sorted(pins.items())]))
print(json.dumps(dict(selectedInputs=len(records), fieldOccurrences=sum(r['fieldOccurrences'] for r in records), categoryCounts=dict(counts))))
