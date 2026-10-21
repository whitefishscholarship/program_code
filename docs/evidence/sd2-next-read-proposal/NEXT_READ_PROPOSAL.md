# Next bounded SD2 read proposal

October 13, 2026, America/Denver. Prepared from verified local closeout
`a4e9c7cb0232ded152fcc57166c0a73bfa4c33d0` on
`codex/plan-student-data-maintenance`. Status: proposed, awaiting direct selection.
This document authorizes no access. Full SD2 remains incomplete; stop before SD3.

## Recommended selection and reason

Investigate only the two records named **Montana Jaycee Foundation Scholarship**,
in saved original order: row 40, then row 68. These are input locators, not stable
award IDs. The completed F/G/O inventory records different exact document routes:
one filename says Vocational, the other University. This is an observed route
difference; it does not establish separate awards, sponsor identity, current
offering, or a duplicate. Keep both records and their identity holds.

This two-record checkpoint reduces the inventory's one known duplicate-name group
without replaying the completed Pell/Neurodiversity/Barnes research or the whole
794-row inventory. Two records are appropriate for a document/identity conflict;
do not add a third award merely to reach a batch size. Missing document or identity
proof can finish as an explicit hold rather than trigger broader discovery.

## Exact proposed workbook reads

Only workbook `1-rgieaL5Hd87W97Zzx9SPFFSmPAmSPGqkzPYnjDQzL0`, expected title
`Spreadsheet Clean Up 4`; only `School Resource - Cleaned Up`, expected
sheetId `405588227`, grid 795 rows by 25 columns. Read identity/tab properties
and reported modified time/version before and after the bounded checkpoint.
Do not request permission lists, unrelated-tab cells, applicant data or notes.

Before either detail read, recheck these exact identity ranges against the saved
native F/G/O cells, including formulas, hyperlinks and runs:

- `'School Resource - Cleaned Up'!F40:G40`
- `'School Resource - Cleaned Up'!O40:O40`
- `'School Resource - Cleaned Up'!F68:G68`
- `'School Resource - Cleaned Up'!O68:O68`

Only after matching the complete name and source-route projection, read
`'School Resource - Cleaned Up'!A40:O40`, then
`'School Resource - Cleaned Up'!A68:O68`. Recheck both same A:O rectangles at
close for bounded consistency. These detail rectangles have not been captured
in SD2. The small repeated identity projection is a necessary locator/concurrency
guard for new detail reads, not a replay of the whole inventory. Reuse the saved
A1:O1 header; no new header or full-inventory read is proposed.

Stop dependent work on identity/route mismatch, moved locators, changed tab/grid,
or inconsistent before/after observations. Record the mismatch and propose its
exact recovery scope; do not search more rows, scan another tab, use an old
workbook, or expand the rectangles. Unknown version stays unknown. Equal bounded
reads or metadata never establish an atomic snapshot or whole-workbook preservation.

## Exact proposed public document reads

Read only these two URLs already present in the saved selected-copy O cells,
in corresponding record order. Their contents and current access are unreviewed:

1. https://www.usjcisenate.org/images/scholarship/2026-2027%20U.S.%20JCI%20Senate%20Vocational%20Scholarship%20Application.doc
2. https://www.usjcisenate.org/images/scholarship/2026-2027%20U.S.%20JCI%20Senate%20%20Foundation%20University%20Scholarship%20Application%20_.doc

Fetch as public documents only, preserving exact URL identity and byte hashes.
Do not enter, complete or submit an application workflow. Inspect the entire
document, including tables and all pages where rendered, using existing available
tools. Record measurable extraction/page completeness; failed or incomplete
conversion remains inaccessible/manual review. Do not install services or infer
silence from an incomplete extraction. Blank application field labels may inform
public rule/material categories; do not reproduce filled applicant information,
signatures, contact details or sample birthdates. Unexpected applicant content
stops retention and dependent review.

No parent-page crawl, search, linked download, portal, login or provider contact is
selected. Do not follow a redirect outside these two exact approved URLs; preserve
the redirect/access limitation for a later scope proposal. No fallback URL is
implied. A filename or responding URL alone proves no scholarship fact.

## Local deliverable and completion limits

Reconcile two input records and two source targets explicitly: observed sponsor,
independently named award, route/document version, vocational/university scope,
published cycle/window, and any material eligibility/funding/application terms
actually supported. Use the existing contract's field envelopes and keep every
unsupported field unknown. Compare against saved current app/canonical identities
locally; preserve existing IDs and proposed aliases. Do not allocate new award IDs,
merge, replace, accept facts, or publish mappings from a name or route alone.

Each selected input receives an explicit mapped-candidate, held, duplicate-candidate,
reference/resource, or unsupported-with-reason outcome. Retain both observations
even if later evidence suggests duplication. Check complete selected-document
coverage and input/source counts. Preserve the original capture ledger and source
receipts; reference continuation outcomes to its two input records for the next
ledger reconciliation. Do not create a second Reviews queue.

The saved denominator remains 794 rows: 411 named, 383 empty in the selected
projection, 410 unique exact names. Three named records have completed bounded
research; 408 remain unselected for research at this preparation checkpoint.
The proposed two records are a subset of those 408, not additional awards.
No future distinct-award count, reduction in pending work, full canonical/public-ID
relationship/collision reconciliation, or fact acceptance is claimed here.

If selected, freeze this exact order/read scope, obtain local independent technical
review for the completed research candidate under the existing process, and leave
fact acceptance for a named human reviewer. No canonical stage transition or new
per-source attestation scheme is proposed. No workbook writes, app changes,
backup/recovery operations, Git delivery/deployment, monitoring or messages.

## Carry-forward and information from Kelsey

Section 9 of `docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md` remains the sole progress
pointer. Its nine attention rows and every existing SD2 supplement are preserved
byte-for-byte, with their owners and triggers. This proposal addresses only the
duplicate-name subcase of the inventory row. Pell entry-GPA scale/basis, extra/
athletic criteria and window; ND coherent cycle/current funding/exact dates and
historical FAQ age conflict; Barnes named current offering/funding/terms; and every
other field in the immutable `sd2-first-batch/proposals.json` remain proposed/held.
No same-day refresh of the six completed sources is proposed without new evidence
or a specific freshness reason.

Spear/Live Your Dream holds, the seven other pilot awards, all remaining identities,
preservation/concurrency/native backup/recovery/permissions, SD3/SD4 publication/
student tasks, standard-build/fresh-delivery limits and later canonical/effect
authority retain their existing triggers. M1 `009fa57` retains every original
437-record route and hold, including ETV/Fund the Fish, allowance/zero-overage,
sender/service/receipt, suppression, measured pilot/full sweep, recovery/catch-up
and schedule health. No inventory rebuilding, second queue or old-runner activation.
The selected notification destination is unchanged.

Kelsey needs only to select whether Codex may read **these two scholarship entries
and their two linked public documents**. No permission to edit the workbook, use
application accounts or contact anyone is requested. Before a later checkpoint
accepts scholarship facts, Kelsey must name the person who will check and approve
them; that person need not be chosen to prepare or perform this read-only research.
Technical review does not supply that human fact approval. This need comes from
section 9 and the original `sd2-first-batch/AUTHORITY.md` completion boundary.
No billing, email, migration or release information is needed for this proposal.

Copy-ready selection, if desired: "Select the exact two-record Montana Jaycee
read scope in docs/evidence/sd2-next-read-proposal/NEXT_READ_PROPOSAL.md. Research
and propose only; keep unresolved identities held and stop before SD3."

Verification: `verification.json` in this directory. No new workbook/source reads
occurred during preparation. No model switch; exact backend model/effort unavailable.
Recommended next-session effort: High.
