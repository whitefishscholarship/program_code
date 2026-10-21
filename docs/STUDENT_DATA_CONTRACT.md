# SD1 scholarship data contract

Version 1.0; October 13, 2026. Final local design for the selected SD1 pilot.
This is a planning checkpoint, not canonical stage acceptance, accepted scholarship
facts, a workbook migration, an app release or monitoring activation.

## Scope and controlling authority

The direct SD1 request authorizes local contract/pilot work, review and only the new
copy's metadata, headers and 8–12 scholarship records. Its exact authority and reads
are in `docs/evidence/sd1/README.md`. The saved SD1 prompt does not grant access by
itself; this direct selection supplies the bounded read authority. Canonical Revision
21 and BUILD_STATE retain their exact bytes and null stage pointers. No P0–P9 stage
is reopened. SD1 finishes a proposed local design; later runtime, publication,
migration or monitoring work must select a prospective canonical contract through
the existing process. Historical acceptance/attestation gates are not waived.

## Fact envelope and concise vocabulary

Every material normalized field carries `value`, `state`, `evidenceIds`, `scope`,
`observedAt`, `freshness`, and `acceptance`. A proposal is never an accepted fact.
Absence of a currently usable value is null (or an empty multi-value list with an
explicit unknown state); never false, zero, Any, no restriction or no requirement.

| State | Meaning |
| --- | --- |
| verified | Named official-source evidence supports this value for its stated scope/as-of time |
| unstated | The relevant, complete applicable source section was inspected and does not state the field |
| unverified | Not checked, unsupported, stale for the intended use, or scope unresolved |
| conflict | Applicable evidence contradicts itself or another material source; preserve alternatives |
| inaccessible | Required evidence cannot be inspected; record the access limit |

`freshness`: applicable / historical / refresh_needed / unknown. `acceptance`:
proposed / accepted / held. Only an accepted, applicable, verified typed eligibility
fact can prove a student conflict. Historical verified facts remain historical; they
cannot populate the next cycle. A saved synopsis does not prove that a complete
source was silent. Use unstated only with a complete field-scope inspection receipt.
Access result (responded/blocked/failed/unreviewed) is separate from fact state.

| Field | Machine values; display labels and definition |
| --- | --- |
| cycleStatus | active/upcoming/closed/unavailable/unknown → Open/Upcoming/Closed/Unavailable/Unverified; applies to one evidenced cycle |
| needRequired | required/not_required/null → Required/Not required/Unstated or Unverified; an eligibility condition only |
| needSelection | considered/prioritized/not_considered/null → Considered/Prioritized/Not considered/Unstated or Unverified; selection only |
| schoolTypes | two_year/four_year/trade/other → 2-year college/4-year college/Trade school/Other |
| studyPaths | certificate/associate/bachelor/graduate/apprenticeship; degree/certificate objective, separate from institution type |
| applicantStage | hs_senior/hs_graduate/college_student/graduate_student/adult_learner; GED and gap-year permission are separate evidenced conditions |
| renewal | renewable/nonrenewable/conditional/null; another payment under the same award's renewal terms |
| reapplication | allowed/not_allowed/conditional/null; a new competitive application, never inferred from renewal |
| applicationMode | existing automatic_consideration/selectable_children/eligibility_matched/shared_with_supplements/direct_per_award/offline/unknown codes |
| nomination | required/not_required/null; nomination differs from a recommendation/reference |
| materials | essay/reference/transcript/video/portfolio/interview/resume/other; retain count, limit and award scope |
| focus | agriculture/arts/business/education/health/public_service/stem/trades/transportation/other; descriptive interest unless an evidenced eligibility rule makes it mandatory |

Financial-need discovery interest is a preference, not proof of financial eligibility.
FAFSA requested, merit described, or column M = Yes establishes neither need field.
"Not prioritized" does not mean "not considered". A statement that need is not required
does not settle whether it affects selection. Only explicit wording sets negative values.

Numbers: entryGpa and renewalGpa have separate value/scale/basis; entry and transfer
rules can differ. Amount has currency, minimum/maximum, basis (per_year/total/one_time/
tuition_percent/unknown), fundingKind (gift/loan/mixed/unknown), recipientSlots and
conditions. Conditional totals and loan-inclusive aid never rank as guaranteed gifts.

Dates: applicationCycleLabel and academicYear are separate. opens/deadline retain
value, purpose, timezone and precision: exact_datetime/date_only/month_only/annual_rule/
rolling/approximate/unknown. Date-only never silently becomes midnight; yearless dates
never acquire the current year; multiple windows become separate cycles only when
evidenced. A program labelled WAI2027 can close in 2026. ExpectedOpening is a review
hint with basis, never a public opening. Parent reopening does not reopen a child.

Rules: one small list of typed conditions grouped by explicit AND/OR/unknown operators,
not a generic rule engine. Separate residence, school/community affiliation, destination
institution, membership, age, study path and descriptive focus. Lists of affiliations
do not invent OR; names and sponsor location do not create eligibility. Unknown
operators remain held. Do not add questions to resolve pilot gaps in SD1.

## Stable IDs and identity

Retain existing accepted app award IDs and canonical IDs through an explicit registry.
Match the fresh copy by award name plus sponsor/program and route evidence, never row
position. Row coordinates and capture digests are locators, not award identity. Changed
names/URLs become reviewed aliases; a shared URL never merges distinct awards.
Twelve unique app-name candidates are identified; the Spear document change and Live
Your Dream's missing published source locator are held mappings. The others have
matching source locators or an evidenced Pell route transition. This pilot is not a
complete-copy duplicate audit or a permission to publish any mapping.

Reuse `canonicalModel.stableId` and `studentCatalog.publicEntityId` at implementation.
Canonical IDs use existing sch/src/app/cyc/evd/rev SHA-256 namespaces. Existing IDs are
never regenerated from a changed row/name. For new awards, allocate an immutable
identity seed after review of sponsor + independently named fund; persist it once and
check complete canonical/public-ID collisions. Never treat a 12-digit prefix as proof
against collision. Conflicting mappings block that identity while others continue.

Sources use stable resource identity; preserve meaningful query parameters/fragments,
document IDs, versions and original/final URL aliases. The pilot uses deterministic
`src_` hashes of exact observed URLs, with existing public-source aliases kept as
crosswalk candidates. Duplicate aliases require later review, not silent rewriting.
Content changes create a new evidence/version record, not a new resource ID.

Cycles use `cyc_` over stable award ID plus the provider's explicit cycle identity.
Unknown cycle uses a persistent unresolved slot, never an invented 2027 cycle.
When resolved, preserve that slot's alias and create the evidenced cycle. Evidence
IDs bind subject/field/value/scope/source/version/observation; review IDs bind subject
and reason, with attempt history appended. Shared application IDs require workflow
evidence; URL equality alone is insufficient. Keep every child award and its scope.

## Minimum workbook and public feed

Use the existing authoring table plus four additional logical tables in the same
workbook: Awards, Cycles, Sources, Evidence and Reviews. This selects a lean SD3 target
design, not actual tab names or permission to create them. Application-group records
may occupy Sources with `recordKind=application_group` and explicit child IDs; no
sixth tab is needed initially. Store multi-values as validated JSON arrays (or native
validation-backed equivalent with a lossless adapter), not guessed punctuation.

| Logical table | Required keys and fields |
| --- | --- |
| Awards | awardId, appPublicId/aliases, identityState, name, sponsor, sourceIds, applicationGroupIds, descriptive focus; one row per independently named award |
| Cycles | cycleId, awardId, explicit cycle/academicYear, status/date facts, entry and renewal GPA, needRequired, needSelection, eligibility conditions, school/path/stage, amount, renewal/reapplication, nomination/materials, application mode/route/supplements; each fact refers to Evidence |
| Sources | sourceId, recordKind, URL/offline authority, aliases/version, role, architecture/access, parent/child award IDs; group records retain workflow and supplement evidence |
| Evidence | evidenceId, award/cycle/field, typed supported value/state/scope, sourceId, source artifact + digest + precise locator, observed/verified time, freshness, reviewer/acceptance; no repeated raw documents |
| Reviews | reviewId, award/cycle/source IDs, reason/state/owner/action, dueAt, lastAttemptAt/lastSuccessfulCheckAt/lastFactVerifiedAt, hint/basis, attempts and evidence/disposition; authoritative decision records |

Fresh headers map A → proposed deadline, B/D → geography/affiliation candidate,
C → destination institution candidate, E → amount, F/O → actual link or method,
G → award name, H/L → descriptive connections or rule proposals, I → unresolved GPA
scope, J → school/path proposals, K → renewal proposal, M → unresolved need wording,
N → proposed summary/conditions. P/Q/R and all other columns are not pilot inputs.
"Any", Flight and GED require source interpretation, not forced school-type mapping.
Actual hyperlinks, formula URL literals and link runs must survive capture. Unresolved
link extraction stays held; no label-based URL invention.

The existing immutable publication boundary stays: capture → validate → review →
public catalog → existing API/interview/results/CSV. Google credentials and workbook
notes remain outside the student runtime. Current StudentCatalog schema accepts only
publicId/name/summary/amount/eligibility/cycle/application/sourcePublicIds. The pilot
validates a conservative projection against that unchanged schema. Unsupported new
fields remain internal; any later public schema extension belongs to SD3/SD4 review.
No raw P notes, Evidence, Reviews, source-row locators or identity diagnostics in CSV.
Current recorded shortlist behavior remains separate from newly accepted matching
facts; SD1 does not certify or replace historical narrowing rules.

## One review queue with the existing monitor

Adopt Reviews as the sole authoritative award decision queue. The retained M1
state-branch proposal at 009fa57 stays the single future runner/cursor/fingerprint/
attempt/outbox store, with reviewId-linked observations and a generated REPORT.md.
It cannot independently resolve a Reviews decision or maintain a competing due date.
Runner next fetch is derived from Reviews dueAt plus retry state; conflicts halt that
record's publication. A monitor observation appends proposed evidence/queue work;
human/Codex review writes a separately authorized disposition. Workbook editing and
state persistence require their own later exact effects and concurrency/readback gates.
Do not implement bidirectional synchronization in SD1 or erase historical queues.
If workbook reads are unavailable, persist attempts and mark synchronization pending;
do not close decisions or silently substitute a different authoritative queue.

SD5 must reconcile all 411 award IDs and 26 leads in the exact retained M1 inventory
before adoption; the 12-record pilot is not the monitor denominator. Leads remain
leads, exclusions need evidence, and ETV/Fund the Fish/other held triggers stay intact.
P8 remains disabled; M1 setup is incomplete. Do not enable the old P8 live runner.
Use its suitable bounded receipts/queue functions, one proposed daily wake and the
existing selected notification destination. Allowance, sender/service, state-branch
deployment suppression and actual delivery remain later gates; no fresh setup reads
or notifications were performed here.

Due policy: successful official check +14 elapsed days for every non-open status;
+7 days for open or an evidenced/clearly labelled estimated future opening within
30 days. Never use a Sheet read as lastSuccessfulCheckAt. All pilot records have no
runner-success receipt and start due October 13, 2026, for an initial catch-up review.
Failure records the attempt, preserves verification/overdue state, retries once on
the next daily wake, then keeps a visible manual/blocked review at 14 days. Keep
deadline-sensitive checks before the evidenced deadline; closed/unavailable do not
remove records. Scheduler delay and a disabled scheduler remain explicit limits.

## Student filters, fit and priority

Need-required and need-in-selection are separate filters. Verified values can match;
unverified/conflict/inaccessible/unstated stay in a visible Needs checking bucket.
Optional blank/nonselected/sensitive answers do not prove a contradiction. Show
supported connections and concrete unresolved prerequisites without claiming full
eligibility or win probability. Renewal GPA never becomes an entry conflict.

Apply now requires accepted applicable open-window/usable-route evidence and no
critical unresolved prerequisite. Prepare next requires an accepted announced future
cycle with useful preparation. Check first covers material uncertainty/conflict.
Later covers an evidenced closed/unavailable selected cycle or supported mismatch,
retaining access. A closed historical cycle does not put an unknown next cycle in
Later. Within bands: verified deadline, supported connection, name, stable ID. Preserve
manual-sort precedence. Amount and materials support separate value/workload sorts;
no invented odds, guaranteed totals or effort estimates.

`docs/evidence/sd1/PILOT.md` and `pilot.json` contain all 12 selected identities,
field proposals/evidence limits, fit/filter explanations, initial due dates and
exact SD2 batch. `run-pilot.py` exercises uncertainty, cycle scope, identity holds,
need separation, renewal/entry GPA, AND/OR, shared children, priority and due behavior.
`check-public.ts` validates the 12 projections against the existing public schema.
These are local contract probes, not app implementation or scholarship acceptance.
