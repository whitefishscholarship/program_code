# Interview relevance build plan

Plan ID: INTERVIEW-RELEVANCE-1
Prepared: 2026-09-10
Execution state and open items: `docs/BUILD_STATE.json` and `docs/CURRENT_HANDOFF.md`
Kickoff: `docs/kickoffs/INTERVIEW-RELEVANCE.md`

## 1. Authority, precedence, and starting point

This is the detailed specification for one proposed maintenance release. It is subordinate
to `AGENTS.md` and `docs/SCHOLARSHIP_SYSTEM_BUILD_PLAN.md`; it does not itself amend the
canonical contract, activate a program stage, grant external effects, or declare acceptance.
The current user request authorizes creating this plan and a reusable execution prompt.
Implementation begins only when the user issues that execution instruction. The kickoff
expressly authorizes local preparation, implementation, testing, and required independent
review; it does not authorize publication or new source access.

Current canonical revision is 13. P0 through P9, including P8R/P8M/P8F, are accepted;
activeStageId and nextPermittedStageId are null. P9 and program closeout stay complete.
The deployed shortlist release is PR #42, merge
`2f517755118bc72570a2aa8b5109a2660e0d9b12`. Its candidate is
`07c6c8df825b17cee64037f81a94ac05ba2ce464`, attestation
`c4c5e5ecf6749b7673086fbde3841232d2c56cd6`. Its local closeout is
`6e66ec3eecce6fca1ad054649218dc5be5965de2`; delivery proof is in the PR and
`docs/evidence/PLAN-REV13-delivery.json`. These observations are the starting baseline,
not a claim that remote main cannot change before the next session.

## 2. Outcome and fixed release boundary

Make supported existing interview answers bring relevant scholarships forward and explain
why, while preserving the working interview, existing recorded GPA/school comparisons,
all-awards recovery, privacy, and exact visible-result CSV exports.

First release: additional POSITIVE RELEVANCE connections only. The existing GPA/school
rules continue to control recorded-fit, needs-checking, and outside-shortlist decisions.
New answers cannot change those decisions or exclude awards. This deliberate first-release
boundary delivers broad usefulness with less interpretive risk; residence, education,
gap-year, acceptance, or volunteer-hour exclusion rules are separate future choices.

Include existing career/special-criteria selections, service, leadership, work experience,
caregiving, and financial-need selections wherever an award-specific saved record supports
a reviewed positive connection. A topic is a reason to investigate an award, not proof
that an applicant satisfies its requirements. Keep general opportunities available.

Excluded: new questions, personal identifiers, live spreadsheet integration or writes,
new source crawling/research, new official eligibility claims, monitoring, accounts,
analytics, AI calls during student use, generalized rules platforms, new dependencies,
provider/configuration/credential changes, unrelated cleanup, P9 reopening, and automatic
publication of local handoffs. Freshness work and unsupported filters remain in the
existing handoff, not prerequisites to this release.

## 3. Fixed inputs and observed opportunity

Use only already saved repository inputs. Preserve them byte-for-byte:

- `web/fixtures/p8m/master-database-rev225.json`, SHA256
  `cf898d6cbb5bfb6d4d576fc77e4d1666f0f67ee3cb01ed7cd16ee7991a9c4106`;
- `web/fixtures/p8m/matching-facts-v1.json`, SHA256
  `16db9f32a14c7b63d2a912a84c43ac973ae43a07d7c40841174d6fbdfd5a6b07`;
- supporting `docs/evidence/P8M-human-review.csv` and human rationales;
- the delivered `web/fixtures/p7/student-catalog.json` and shortlist v1 publication;
- actual controls in `web/src/lib/interviewQuestions.ts` and `InterviewWizard.tsx`.

Snapshot: September 2, 2026, Master Database revision 225; 197 source records comprising
176 award rows and 21 portals. The catalog has 192 awards, including 16 catalog-only
children. The original official matching-fact publication still has zero accepted facts.
Preserve that fact and its flags; use a separately versioned organizer-recorded relevance
artifact. A new artifact must not silently replace or reinterpret historical evidence.

Read-only planning found exact tag candidates for 33 of the 38 special criteria. Examples
among the 176 award rows: trades 19, STEM 11, pilot aviation 8, healthcare 5, community
service 24, leadership 10, work experience 6, caregiving 1, financial need 39. Counts overlap
and are topic occurrences, not approved rules or guaranteed eligibility. Recompute the
inventory at execution; do not copy these counts as acceptance results.

No exact tag was found for nonbinary, single_parent, mensa, aviation_management, or
farmers_union. Inspect saved summaries before assigning unsupported; do not infer that
no scholarship exists. Do not equate Farmers Union with Farm Bureau or FFA. A topic tag
may describe a sponsor or purpose rather than an applicant connection, so tag equality
alone never activates a rule.

## 4. Mapping and interpretation contract

Create one versioned mapping ledger, with one disposition for EVERY existing question or
choice and one outcome for EVERY source row. Each proposed connection records:
question/answer ID, stable award ID, source row and field, concise public evidence excerpt,
interpretation, reviewed disposition, and the intended user-facing relevance explanation.
Use stable identities, not names alone. Keep portal rows and catalog-only awards accounted
for; do not inherit parent conditions or topics automatically.

Allowed dispositions: existing_rule_preserved, relevance_enabled, insufficient_evidence,
not_applicable, or deferred_out_of_scope. Record a short reason for every unsupported or
deferred choice. The ledger can include machine-readable arrays for controls, source rows,
and connections; avoid separate competing status spreadsheets.

A connection is usable only if the saved text supports a meaningful relationship to the
selected answer and no saved contradiction defeats that interpretation. Exact reviewed
tags may nominate connections; an implementer checks the saved text and human rationale.
The independent reviewer checks the resulting connections before release. These are
organizer-recorded relevance judgments, never self-accepted official eligibility facts.

Rules for common ambiguity:

- Career interest can surface an award focused on that field without claiming that an
  interest establishes enrollment in a required program.
- Financial need is positive relevance only. "No" in a prioritization column does not
  mean applicants with need are ineligible. Existing self-description is not proof of
  FAFSA/Pell or an income threshold.
- A broad learning/health/identity answer cannot establish a narrower diagnosis, tribal
  enrollment, relationship, or formal eligibility requirement. Use qualified relevance
  wording only if an actual supported connection exists; otherwise leave unsupported.
- Organization/employer affiliation must name any narrower institution or relationship
  still needing confirmation. Sponsorship alone is insufficient evidence of affiliation
  relevance. Never claim the broad checkbox satisfies exact membership.
- An unchecked box, skipped answer, or prefer-not-to-answer is unknown, never false.
  Positive selections are evaluated separately; selecting one identity does not negate
  another. Sensitive-skip must clear the relevant effects as well as selections.
- Residence is not institution location. High-school attendance is not state residency.
  Planning a gap year is not applying after returning. Hours need compatible ranges and
  time periods. No new filters for these fields in this release.
- Unavailable evidence for one connection does not stop unrelated supported connections.

Before product edits, commit the proposed ledger and expected-example matrix. Record
exact included connections and known exclusions. Fixing a demonstrably wrong mapping is
remediation; adding new effect types or expanding input sources is a scope change.

## 5. Deterministic product behavior

Reuse `spreadsheetShortlist.ts` and the existing result/display flow. Keep relevance as
an additional independent property; do not promote needs-checking into recorded-fit.

Default match ordering is explicitly:
1. Existing shortlist awards before existing recorded mismatches in an all-awards view.
2. Within either group, awards with at least one supported selected relevance connection
   before awards with none.
3. Existing recorded-fit before needs-checking when relevance is tied.
4. Existing reviewed application-preference match, then name, then stable award ID.

One supported connection is sufficient for the relevance boost. Additional disclosures
may add explanations, but do not create an accumulating score or qualification percentage.
Selecting multiple interests is OR for relevance; an award need not match every interest.
Existing explicit user sorts (name, amount, status/deadline) override match ordering as
before. Completing or editing the interview must select the intended default match order
using the current flow. Preserve all existing search, filter, scope, and browse behaviors.

Each boosted result must explain the supported connection and any narrower condition
still needing checking. For example: "The saved record identifies pilot training as a
focus. Check the program's current entry requirements." Do not display "you qualify".
Use concise explanations and an accessible disclosure if necessary; do not silently drop
mapped reasons. Update the interview notice to describe the actual active effect types.
For unsupported choices, show an honest no-current-connection explanation without
removing or adding questions. Do not dump technical IDs or reviewer notes into the UI.

Answers, relevance flags, personalized reasons, and intermediate matching state remain
in volatile browser memory. No storage, cookies, URLs, requests, logs, analytics, or exports
containing answers or personalized reasons. Only public reviewed rule data is bundled.
The expressly permitted CSV contains only current public award fields for exactly the
visible rows in visible order; it never includes the personalized state or reasons.

## 6. Checkpoints within one release

A. Re-ground and adopt policy. Verify current remote main read-only, provenance, clean/dirty
worktrees, current state and handoff. Preserve the original checkout and all completed
branches. Create an isolated `codex/interview-relevance` worktree from verified main;
carry the local plan/kickoff/handoff deliberately, without replaying an old attestation.
Record the next prospective canonical amendment (expected Revision 14; determine live).
Keep all historical stage acceptances and P9 unchanged. Record local-only authority and
an explicit release blocker. Commit the prospective canonical amendment in its dedicated
policy commit, then obtain fresh-context read-only policy review before affected
implementation. This is a checkpoint of one maintenance release, not a new program stage.

The existing validator permits local-only preparation for specifically named historical
amendments, not arbitrary future amendments. If needed, add only an exact amendment-bound
local-preparation case with tests proving it grants no hosted or publication authority.
Never bypass historical validation or globally ignore authority failures. Expected missing
final attestation during preparation must be reported honestly; all unrelated checks must
pass. Do not label preparatory policy review as final release acceptance.

B. Map. Produce and review the complete ledger above and concrete expected profiles from
fixed saved inputs. Reuse supported reviewed information; resolve routine interpretations
from evidence. Bring only consequential unresolved product choices to Kelsey, bundled
with exact examples and a recommendation. Continue independent unblocked work.

C. Build. Version the relevance artifact, extend matcher/explanations, and integrate
existing UI/export flow. Reuse current dependencies and architecture.

D. Verify and review. Run the matrix below. Freeze the complete candidate, generate its
manifest from candidate-tree blobs and the verified main baseline, and obtain fresh-context
read-only independent review. The implementer fixes findings; the reviewer rechecks.
Do not create a final undelivered attestation until the publication boundary is settled:
if authority arrives later, record it, refreeze, and recheck the exact authorized candidate
before the two-file direct-child attestation. Preserve each historical attestation.

E. Deliver only with new exact authority. The prior Revision 13 grant covers the completed
release only. Complete local work before requesting the new release's branch push, PR,
Preview, merge, Production, and verification authority, or verify applicable suppression.
The existing target is Vercel project web `prj_LbefE2deji6nPND6iBiuofe7IABv`, team
`team_6CAjRq58n0WvAH49otKSQbA7`, canonical `web-two-gules-45.vercel.app`.
A branch push can create Preview; main merge can create Production. Preview alone is
not live acceptance. Verify exact Preview commit, health/data pins, and journeys before
merge. If Kelsey reserves a Preview review, wait for it before merge. Then verify main CI,
Production identity, nonce health, and the real synthetic interview/export journey.
Keep the prior working deployment as rollback reference; any rollback operation must be
covered by explicit authority. Do not invent it from ordinary verification permission.

## 7. Acceptance and verification

- Every existing control and all 197 rows have an explicit disposition; all 192 awards
  remain accounted for. No inherited portal rules, lost rows, or unreviewed activated
  connections. Report final enabled controls/connections/distinct awards/unknowns with
  their denominators; do not claim all 33 candidates were enabled unless proven.
- Every enabled connection has at least one assertion of its expected reason and effect.
  Fixed paired synthetic profiles differ by one answer, including career, service,
  leadership, work, financial need, and each enabled sensitive/affiliation group.
- At least one actual saved-data connection in each evidence-supported category must
  exercise the real UI; unsupported categories have an explicit reason, not a fake
  fixture presented as deployed coverage. Test compound interests, all-optional-skipped,
  sensitive skip, narrower membership, sponsor-only negative controls, and missing rows.
- New signals change relevance/order/reasons ONLY. Existing GPA/school decisions and
  counts remain unchanged for identical academic answers; preserve the previous 166,
  125, 152, and 190 shortlist counts for the exact documented regression profiles.
- Test a relevant needs-checking award ahead of an unrelated recorded-fit award; stable
  ties, application preferences, and explicit sort overrides must behave as specified.
- Reconcile exact visible IDs/names/order against CSV, including search, nondefault sort,
  outside-shortlist and all-awards views. Verify actual file downloads where supported;
  report browser-tool save-observation limits separately from CSV-content results.
- Run the student matrix at 360x800, 768x1024, and 1440x900: keyboard, understandable
  explanations, edit/reset/reload, no overflow, no answer-bearing network/storage/logs.
  All profiles, evidence, and screenshots are synthetic, clearly labeled, and non-PII.
- From web: `npm run plan:check`, `npm run typecheck`, `npm test`, `npm run build`,
  `npm run shortlist:check`, `npm run shortlist:test`, and
  `node --import tsx scripts/p9-production-runtime.ts --require-build-trace`.
  Add focused relevance tests to the existing npm test chain; no new test framework.
  From root: `git diff --check`.
- If local tsx IPC is blocked, use `node --import tsx scripts/validate-build-plan.ts`
  for the equivalent plan check. If default Turbopack cannot bind its worker port,
  record that failure and use `npm run build -- --webpack` locally. Exact hosted default
  build remains mandatory; passing Webpack must not be described as passing Turbopack.
- Independent final review has no unresolved critical/high findings; medium/low findings
  have count-matched rationale, owner, and target. Preserve all old manifests/reviews,
  P8M data, P9 candidate/attestation, and current zero-Google runtime validation.

Expected new evidence is one mapping ledger, one profile/browser matrix with outcomes,
and the amendment evidence/manifest/review required by the existing process. Generate
counts and hashes where practical. Reuse evidence; do not write parallel narrative reports.

## 8. Sessions, change control, and stopping

`CURRENT_HANDOFF.md` is the only live open-item register. After each meaningful checkpoint
or session boundary, update its operative top section with the exact branch/commit,
checkpoint, completed evidence, unresolved item, next executable action, and authority
boundary. Record work as local-only until a push is verified. Git commits survive a lost
worktree through the shared repository's object store, but are not an off-machine backup.
Do not rely on this chat, temporary servers, or a model's memory to resume.

On resume, follow AGENTS read order, then this plan and the active mapping/evidence. Check
recorded work against Git before changing it. Re-run only affected or missing checks;
repeat the required full suite at the final candidate and hosted release gates. Preserve
unrelated dirty work; routine Git mechanics do not require user decisions.

New requirements must name the concrete failure or agreed outcome they address. Defects
against this plan are fixed within scope. Isolated unknowns are recorded while supported
work proceeds. New sources, questions, exclusion types, services, or process gates require
an explicit scope decision and canonical change when material. Never change acceptance
criteria to make an implementation pass. Keep unrelated framework warnings, credential
revocation, monitoring, old branches, and stale P9 bookkeeping out of this release.

Stop dependent work only for an actual evidence contradiction, unauthorized necessary
side effect, unresolvable acceptance failure, or consequential missing user decision.
Prepare a concrete reviewable result before seeking publication authority. Once the
agreed release is delivered and verified, close it; do not automatically begin a next one.
