# R3 catalog refresh — proposed bounded contract

Status: local scope proposal; execution and source reads await Kelsey's separate grant.
Planning baseline: `f6fdb2aea09eba3d29eaa2ac6eb345c3d111ed9e`.
Planning branch/worktree: `codex/r3-catalog-scope`, `/private/tmp/program_code-r3-scope`.
The current user instruction, “proceed,” selects preparation of this proposal and its
independent review after the assistant described that preparation. It does not select
source access or implementation. R1/R2 remain complete. This is neither a canonical
amendment nor a release attestation. The existing R1–R7 roadmap is unchanged.

## 1. Outcome

Prepare a reviewed local catalog that accounts for the already-applied 219 additions and
38 updates, preserves every existing website award, and connects supported records to
the existing optional interview. Stop with a tested local candidate and an R4 handoff.
There is no promised new award count: an applied row is not necessarily a distinct,
currently available award. Useful supported records may proceed while other records
have explicit deferred or unresolved outcomes.

`CURRENT_HANDOFF.md` remains the sole progress pointer. The original intake ledger remains
the sole intake decision ledger. The new `r3-scope-inputs.json` is only a hash-bound index
of saved inputs, operation IDs and priority references; it makes no new intake decision.

## 2. Observed planning evidence and limits

- The authenticated read-only GitHub main query returned
  `a8aa6f958f029b7edfacf03ac6c5848e9e8f4b32` during this preparation. That verifies a
  repository revision only. The local planning baseline descends from that merge and
  preserves the R2 closeout. No live workbook or hosted application check was performed.
- The immutable application receipt records revision 229 on September 11, 2026,
  257 applied operations, 3,367 cells, 197 original named rows and 416 named rows after
  application. Append cells were `A199:O417`; 38 existing rows were updated.
  These are historical observations, not present source counts or current-read authority.
- The website retains 192 awards, 38 original criteria, 206 prior positive relevance
  connections and four REV16 connections. Preserve their IDs and original publications.
- The four priority gaps contain 42 references to 38 distinct entities: organization
  membership 15, Teaching 5, ordinary financial need 19, first-generation definitions 3.
  Exactly 37 priority entities are in the applied batch. The remaining NTHS duplicate
  `intake-entity-10fdd5d4c2991973` was withdrawn and points to survivor
  `intake-entity-2b04ced9c8073619`, historical Master row 143 and existing website award
  `award-ead4360dadca`. Reconcile that survivor; do not restore its withdrawn addition.
- Saved facts retain their original observation dates and review limits. A fresh
  organizer-sheet read will establish snapshot currency only, not official provider
  verification, current deadlines, eligibility or availability.

## 3. Exact proposed source-read grant

Only after separate approval and the prospective policy gate in section 7:

| Item | Proposed permitted scope |
| --- | --- |
| Workbook | `1Dp5AMnrfSQ-Xf-r03S75lKsGPJk7o0inOgvC9Q6lOl4`, saved title `Whitefish HS Scholarship Database` |
| Tab | `Master Database`, sheet ID `0` only |
| Cells | `'Master Database'!A1:O417` only: 417 rows × 15 columns, including header; 6,255 addressable cells |
| Workbook identity/freshness metadata | This file's ID, name/title, MIME type, trashed status, version/revision token and modified time; workbook locale/time zone |
| Tab identity metadata | Only sheet 0 ID, title, grid row/column dimensions and hidden flag; no other tab contents or inventories |
| Cell projection | Entered/effective scalar values and formula text, formatted value, hyperlink, text-run start indexes and link URIs, entered/effective number-format type and pattern |
| Evidence persistence | Local bounded scholarship snapshot/provenance and derived public-only artifacts; no cloud workbook copies or backups |

Expected headers, verified from the saved Master snapshot:

| Column | Header | Permitted use |
| --- | --- | --- |
| A | Last Updated | Recorded date provenance, not current official verification |
| B | Due Date | Preserve precision, cycle/status uncertainty and native date evidence |
| C | In-State / National | Recorded geography text; no inferred exclusion |
| D | Portal/ Scholarship | Review record type; do not count a resource as an award |
| E | Amount | Recorded public amount with ambiguity retained |
| F | Scholarship Location/Information | Public source links and identity evidence |
| G | Name of Scholarship | Identity candidate, never sole duplicate proof |
| H | Application Link/Method | Preserve links, query/fragment distinctions and offline methods |
| I | Summary | Public scholarship description and qualified condition wording |
| J | Stated Min. GPA | Reviewed numeric organizer criterion only under section 5 |
| K | School Type (2-or 4-Year, or Trade) | Reviewed organizer school-type criterion only |
| L | Renewing/ Non-Renewing | Recorded renewal text; unknown remains unknown |
| M | Focus | Reviewed interest/topic support, not eligibility proof |
| N | Acute Financial Need Prioritization | Award-record metadata; never a student's financial fact |
| O | Accepts Gap Year Applications Upon Return | Recorded public condition, not a default exclusion |

No notes, comments, drawings, contact/outreach fields, applicant fields, permissions,
credentials, additional columns, other tabs, linked documents or formula dependencies
may be fetched. Never execute formulas or follow URLs as part of this grant. If a
connector cannot enforce these limits, stop or use a supported narrower read route;
do not broaden the request to work around the tool. Unexpected personal content must
not be reproduced or committed; stop and record only its location and exclusion reason.

### Stable bounded capture

1. Verify this exact file/tab, headers and minimum grid size before processing. Record
   identity/freshness metadata before and after each complete capture. Revision 229 is
   provenance, not an expected current token. A later revision alone is not a failure.
2. Read only the allowlisted projection in A1:O417; retain coordinates and distinguish
   blank cells, missing response data and failed reads. Account for all 416 candidate
   data-row positions, including blank, nameless, changed or unrelated rows.
3. Require equal before/after revision tokens and two equal complete projected-cell
   digests within a stable capture attempt. Use a deterministic documented encoding;
   never compare digests produced with different field projections as if identical.
   This is a bounded consistency check, not a transactional or whole-workbook proof.
4. Permit at most three complete capture attempts within the approved range. If source
   edits continue, identity/headers change, projection is incomplete, or permissions
   fail, stop source-dependent work with exact unresolved state. Do not alter protection
   settings or ask for an editing quiet window for this read-only operation.
5. The result covers this range only. No read below row 417 is implied. If an applied
   identity has moved outside it, preserve its unresolved outcome and seek a separately
   bounded scope extension only if needed. Do not import unrelated newer edits even
   when encountered inside the authorized range. No full-Master completeness claim.

## 4. Complete reconciliation without repeating the batch

Use the receipt to establish that the historical `UNAPPLIED_LOCAL_PROPOSAL` file was
subsequently applied. Never regenerate or replay its write payload. Account separately for:

1. All 257 operation IDs with their original entity, target, reviewed field evidence,
   review receipt and application receipt.
2. Every current in-range row position, including newer/unrelated, blank and ambiguous
   records. Historical row numbers are locators, not permanent identities.
3. Every one of the 192 existing public award IDs, catalog-only children, source/portal
   identities and application relationships. Preserve the distinction between row,
   child award, portal, shared application and cycle.
4. All 38 priority entities/42 gap references, including the NTHS survivor exception;
   all nine organizations; all five original interview-gap recommendations.

The R3 reconciliation artifact is a derived crosswalk keyed to the original ledger and
operation IDs, not a replacement intake ledger. Required fields: operation/entity ID,
historical locator, current in-range locator or explicit missing status, identity
evidence, existing/new public IDs, source snapshot digest, reviewed field deltas,
publication outcome, supporting review path, owner, trigger and next action.
Use explicit outcomes such as included_in_local_candidate, preserved_existing,
deferred, changed_pending_review, duplicate_to_named_survivor, parent_or_resource,
unrelated_newer_edit and unresolved. Report row and operation outcomes separately so
duplicate joins cannot make a denominator appear complete.

Match with reviewed identity evidence and source relationships; names, row numbers and
shared URLs alone are insufficient. Never infer children by expanding a portal or
relabel an unknown row as a unique award. Existing catalog-only children inherit no
parent-row GPA, school, need, membership or other condition. Preserve every existing
award ID. Missing source fields or rows do not authorize deleting/hiding awards or
rewriting existing decisions. Conflicting existing eligibility/shortlist criteria are
recorded for explicit later policy selection, while the accepted behavior remains.

Include each supported applied record whose identity and public-field mapping can be
reviewed; no arbitrary count cap. Unresolved cases retain actionable deferrals rather
than blocking unrelated supported rows. All 310 held entities/312 holds remain under
their original triggers. Do not reopen them in bulk or promote the four non-write-ready
research additions. The 26-record R5 research queue and other historical routes remain
separate.

## 5. Bounded local product and data changes proposed

Create a separate immutable catalog and connection bundle with source digest, schema,
generator digest and reconciliation pins. Reuse the existing catalog/shortlist/relevance
architecture; do not overwrite historical fixtures or accepted facts. Wire API, browser,
compatibility data and CSV to the same selected reviewed catalog. Preserve the existing
runtime's zero Google/Drive/Sheets capability. A fresh snapshot is an offline build
input, never a live runtime dependency. No services, dependencies or configuration changes.
Health/source metadata must distinguish the newly selected catalog bundle and its snapshot
from the preserved historical matching-facts publication; never imply the old revision225
metadata describes new records. Show honest snapshot dates and organizer-recorded status.

Preserve the two required inputs, all current optional controls, all-award access,
explicit user sorting, binary OR relevance and current GPA/school decision algorithm.
Retain the existing 192-award shortlist criteria and 206+4 connection behavior. New
award criteria may use only explicit, individually reviewed organizer GPA values and
resolved school types under the prospectively adopted R3 contract. Unsupported or
ambiguous values stay unknown; any recorded mismatch retains a reason and an accessible
outside-shortlist/all-awards view. Do not create new typed accepted eligibility facts,
hard-exclusion rules or an accumulated score.

Extend supported Teaching, financial-need discovery and existing-topic connections only
with exact reviewed award IDs and qualified award-specific wording. Review the seven
remaining organization choices individually: BPA, DECA, FBLA, FCCLA, HOSA, SkillsUSA and
TSA. Add a choice only when at least one exact included child award supports it. Preserve
NTHS/FFA. Do not infer membership, joint membership, course completion or program eligibility
from an interest or another organization. Required combinations remain on the card.

Review first-generation and care/adoption wording against existing saved definitions,
but keep any proposed new definition/question as a recommendation in this bounded
implementation. No universal definition or new sensitive question is selected here.
Specialized memberships/training remain card information. Skipped/negative/unknown
sensitive answers stay non-excluding; no income, family records or proof is collected.
Answers and reasons remain in volatile browser memory; CSV contains public fields only.

Include the recorded NTHS `46113` display follow-up. Inspect preserved/native number-format
and date provenance before presenting a date. A numeric serial alone is not an annual
deadline or current cycle. If evidence is insufficient or conflicting, display an honest
unverified-deadline message and keep the provenance in local evidence; do not manufacture
a date or use the withdrawn duplicate's proposed deadline as accepted replacement data.

## 6. Verification and review gates

Before R3 product edits, freeze/review the exact proposed mapping, field rules, source
reconciliation and representative expected examples. Each imported public field and
new connection must have a recorded evidence/review disposition. The execution agent
implements and remediates; a fresh-context read-only reviewer verifies the final candidate.
No model may promote its own proposals to official accepted facts. Kelsey owns any
separate official-fact acceptance, which is outside this contract.

Required R3 evidence:

- Complete source-range, 257-operation, existing-192-award, priority-38 and option
  reconciliation; measured denominators, source dates, distinct row/award/resource counts,
  identity/collision outcomes, relationship preservation and all deferred triggers.
- Stable capture checks and failures; negative cases for incomplete capture, shuffled
  rows, moved/missing identities, shared URLs, duplicate survivor, conflicting fields,
  newer unrelated edits, ambiguous dates and parent-to-child leakage.
- Unchanged outcomes for the 192 retained awards under representative existing profiles;
  supported new-award GPA/school comparisons, unknown/skip/nonselection, binary OR,
  Teaching/membership/need qualification, user-sort precedence and all-award access.
- Same visible IDs/order across API/browser/CSV, public-field allowlist, zero answer
  storage/requests/logs/URLs, edit/reset/reload, actual local saved CSV downloads,
  360px/desktop layouts and a complete keyboard journey (extend the existing regression).
- From `web/`: `npm run plan:check`, `npm run typecheck`, `npm test`, `npm run build`,
  `npm run intake:check`, `npm run coverage:check`, `npm run p9:production:check`.
  Also run the new R3 source/reconciliation/catalog checks adopted by its policy before
  implementation and `git diff --check` from the repository root. Verify production
  build trace with `node --import tsx scripts/p9-production-runtime.ts --require-build-trace`.
- A complete frozen local candidate manifest and independent review, unresolved critical/
  high findings zero, and count-matched disposition of every other finding. This is
  local R3 completion, not canonical release acceptance or deployment.

This planning-only change uses deterministic scope/preservation checks and plan/diff
validation. Its unchanged runtime/dependencies permit retaining R2's recorded full
matrix/browser evidence with that reuse explicitly recorded; no new runtime PASS is
claimed from documentation checks.

## 7. Order, canonical policy and future authorization

1. **Now:** freeze and independently review this local proposal, input index and
   handoff. Leave canonical plan/state, runtime, source and all release branches unchanged.
2. **Separate grant:** Kelsey approves this exact source-read/local-implementation scope,
   including its metadata, local evidence persistence, prospective policy and independent
   reviews. Record the verbatim grant before any source read or product work.
3. **Policy first:** reverify live main and preserved closeout ancestry. Prepare a dedicated
   prospective canonical amendment (next unused revision, expected 18), decision entry,
   state, validator and exact kickoff; independently review that policy checkpoint
   before source access or product edits. It must adopt sections 3–6, explicitly allow
   this bounded local preparation with false delivery authority, and preserve all
   historical bindings and acceptance gates. Do not rebind a prior amendment or expand
   a historical local-preparation exception. If canonical rules cannot support this
   local-only path without prior delivery, stop with the concrete policy conflict;
   do not use this proposal or an old grant to bypass it.
4. **Then R3 only:** stable read, full reconciliation and mapping review, local bundle/UI
   implementation, complete validation, frozen full-candidate independent review and
   durable R4 handoff. Capture source/publication pins from actual evidence, not invented
   future revisions. Independent review of unchanged prior stages is not repeated.
5. **Stop before R4:** no final canonical attestation is created while exact R4 delivery
   authority is missing. R4 separately refreshes baseline/targets, resolves policy/release
   gates, freezes the authority-bearing candidate, obtains independent review and creates
   its valid direct-child attestation before exact Preview/merge/Production verification.

No R3 grant under this proposal authorizes workbook writes, backup/recovery copies,
restoration, other workbooks/tabs, public-source research, form/application interaction,
provider contact, credentials, configuration, paid actions, monitoring, push, PR, Preview,
merge, Production or hosted verification. R4–R7 retain their separate triggers.

## 8. Continuation and recovery

Follow AGENTS read order, the operative handoff, `SCHOLARSHIP-INTAKE-RESUME.md`, the
existing execution roadmap and this contract. Verify this scope's review against its
immutable candidate and manifest before using it as the proposal for approval. The
planning checkpoint is the retained branch tip; the review-only commit follows the
frozen candidate. All required inputs live in Git; temporary logs are not continuation
requirements. Recover a missing temporary worktree only from the retained exact branch
in the shared repository, preserving unrelated work and original attestations.

Carry every prior trigger from the complete handoff and R2 session wrap, including source
currency, recovery objects, I65/Hagan, historical routes, research, issuer credentials,
platform/protection uncertainty, CLI account mismatch and hosted request/download limits.
Those limits apply to future verification; they do not reopen R2. The next action after
planning PASS is Kelsey's exact grant in step 2, not automatic execution.
