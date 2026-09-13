# Interview coverage execution — INTERVIEW-COVERAGE-1

Date: 2026-09-12. Status: first local implementation independently reviewed complete;
remaining R1–R7 sequence is planning only. The original implementation contract below
remains the record of its selected scope. Current progress belongs in CURRENT_HANDOFF.md.

## Objective and selected scope

Execute the approved coverage proposal's first interview improvements: allow GPA and target
school type to lead directly to results; keep every existing question available in optional
sections; replace acute-need self-screening with a voluntary discovery preference; add
Education / Teaching and only organization choices backed by existing website award IDs.
Kelsey directly instructed "proceed with execution of plan" after the independently reviewed
proposal at 8f423c8 and its review-only checkpoint 40ff61e. This authorizes local implementation,
necessary prospective policy changes, tests and independent review. It does not grant the
proposal's separately reserved spreadsheet-copy/write or external release effects.

## Grounded correction and source boundary

Execution starts from clean 40ff61ecc75c204cc6114fd34a5b9941e84f5ad1 on the existing
codex/scholarship-intake branch. Authenticated read-only GitHub verification returned main
5fa08541b6b49484dedc8fc06012e47c658ce8fb on 2026-09-12, matching origin/main.
The 192-award website and 206 existing positive connections remain at saved revision 225.
New intake entities have no approved website publication mapping. Therefore this first
implementation reuses the exact saved, reviewed publication and four award-bound source
rows (44, 143, 170, 174); it does not present newer intake records as website awards.
This explicitly narrows the proposal's fresh-Master reconciliation prerequisite to a future
catalog refresh or addition. No source identity, catalog record or existing publication changes
here. Four new positive connections use a separate immutable, hash-pinned supplement.
The attached mapping accounts for all nine proposed organizations and all five prior gaps.
Only NTHS and FFA have selected supported connections in the unchanged catalog; other
organizations remain queued until exact child awards are published. Teaching initially
connects to the narrower FVCC early-childhood program with that limit visible in its reason.
Do not infer general teacher eligibility from a sponsor name or inherit catalog-parent rules.

## Product behavior

- First screen: required GPA and target school type, Show my results, optional refinement,
  and browse-all. Residence/status may be null; they must not fabricate a match or conflict.
- Three reachable optional sections: Study plans and activities; Helpful scholarship
  connections; More details and application preferences. Preserve all 38 original criteria,
  four activities, service-hour condition, six application formats and sensitive skip.
- Education / Teaching is a new positive discovery interest, separate from the frozen
  matching-facts taxonomy; preserve early-education public_service and music-education arts.
- Organization control offers NTHS and FFA plus None / Not sure / Prefer not to answer.
  Explicit unknown/no/prefer states clear positive organization selections. No joint
  membership inference, parent-to-child propagation, or automatic qualification.
- Financial discovery asks "Would you like to see scholarships that consider financial need?"
  Yes / No / Not sure / Prefer not to answer. A new optional preference field supplies positive
  relevance only. Never turn this preference into the legacy acute-need fact alias. Preserve
  old parsed-answer compatibility, but the new UI submits legacy financialNeed=false.
- Keep binary OR relevance, existing GPA/school decisions and explicit user-sort precedence.
  Selecting new interests adds reasons, never points or exclusions. No/unknown/skip cannot
  remove awards. Sensitive skip clears need, sensitive criteria and caregiving effects.
- Answers/reasons stay in volatile browser memory; no URLs/storage/network/logging/analytics.
  CSV retains only public fields for exactly the visible awards and order. Browse, edit,
  reset and reload must work. No new dependency, service, credential or configuration.

## Verification and completion

Commit and independently review this policy and exact mapping before product changes.
Test core-only parsing and results, invalid GPA/school choices, null optional observations,
all new positive connections and unchanged decisions/counts, negative/unknown/skip cases,
OR behavior, existing-control regressions and all-award/public-CSV behavior. Validate exact
source excerpts/IDs/digests, preservation of historical publications and all scoped proposal
files. Verify keyboard, 360px and desktop layouts, edit/reset/reload and zero answer leakage
against the local production build using fictional profiles only.
Run plan:check, typecheck, npm test, build and git diff --check. Preserve the three outstanding
PLAN-REV15 attestation diagnostics. Revision16 local preparation has its own exact off-hosted
exception for false release authority; it waives no final manifest/review/attestation gate.
Record any additional reserved Revision16 diagnostics honestly; never claim canonical
acceptance while they remain. Freeze the final local candidate and obtain fresh-context
read-only review; remediate before recording PASS. Final canonical attestation and delivery
remain unstarted pending the recorded release gates, including predecessor package handling.

## Preserved follow-up

All 83 historical routes, four potential additions, provider conflicts and nine discovery
backlog items remain owned by the proposal's existing records; none is silently completed.
The 15 organization and five teaching intake entities need a separately selected immutable
catalog refresh before they can supply further website connections. First-generation and
care/adoption definition refinements await exact repeated award support; rare requirements
stay on cards. The current original intake, 257 applied operations, receipts and all recovery
objects remain unchanged. Existing quiet-window authority is spent. New copies/writes need
exact targets, authority and complete backup/recovery/freshness/concurrency/readback proof.
Push/PR/Preview/merge/Production/hosted verification need direct informed authority. No such
action, new workbook read, provider contact, application interaction or monitoring is included.
The primary checkout stays untouched. Local rollback is abandonment of these new commits;
no external restore is needed or authorized.

## Remaining sequence across sessions

This is the single remaining-work sequence. Labels R1–R7 are planning steps, not new
canonical stages or permission grants. Canonical plan/BUILD_STATE and exact user grants
control execution. Kelsey's instruction to tighten this plan authorizes this documentation
update and review only. Do not start a future phase because it is listed here.

The first local implementation is complete at candidate `c0fffacd3a97328afc75d8e7a06e4cfa8273f356`,
with independent PASS saved in review-only checkpoint `17515b51ea53cdbf48d7f8b2ac14758f0d1c0d35`.
All following steps are pending. The operative progress pointer belongs only in
`CURRENT_HANDOFF.md`; keep evidence in the existing ledgers/review folders rather than
creating another tracker. Kelsey owns scope and external-effect decisions; the execution
agent owns each selected phase and remediation; a fresh-context reviewer owns its review.

### R1 — Prepare the existing release package (next)

**Outcome:** a concrete, independently reviewed way to deliver the existing work without
replaying intake, losing history, or bypassing the six acceptance errors.

Start from current clean local HEAD, verify the reviewed ancestors and fresh remote main,
and inspect the actual REV15/REV16 validator and Git history. Account separately for the
applied intake package, reviewed UI package and later documentation changes. Specify exact
candidate boundaries, predecessor order, manifest scope, immutable review records and
valid direct-child attestation topology. Do not rebind an old review to a changed candidate,
retroactively insert an attestation, or assume one record can satisfy both revisions.
If current rules cannot support the proposed packaging, prepare a dedicated prospective
canonical amendment for independent review before changing those rules.

**Done:** every gate in the table below has an exact candidate/package owner, required
artifact and command, ordering dependency and validation expectation; the complete local
release proposal has independent PASS and lists all downstream Git/Vercel effects. Record
any unresolved topology problem as a blocker with a next action. R1 prepares the legal
acceptance path; it does not claim the six errors are closed or create final attestations.

**Boundary:** local package preparation only when selected. No source reads/writes or
release. Present the concrete package for Kelsey's exact informed delivery grant after
local preparation/review; preserve false delivery authority until that grant exists.

### R2 — Accept and deliver the current interview

Requires R1's reviewed packaging and exact new authority for the affected branch/PR,
Preview, merge, Production and hosted verification, or verified applicable suppression.
Reverify main and provider targets; reconcile only phase-owned changes. Finish all evidence
before final candidate freeze/review, then create each valid canonical attestation in the
order established by R1. An attestation remains its branch tip until delivery; do not append
later implementation or ordinary handoff edits. Preserve every earlier valid attestation.

**Done:** all six gates below pass under the actual canonical validator, all required checks
pass, exact Preview is verified before merge, and exact Production afterward. Reconcile
API/browser/visible CSV with the deployed candidate and verify zero spreadsheet capability.
A green deployment alone is insufficient. Save actual commit/deployment/verification evidence
and a separate permitted continuation checkpoint. If release authority or a technical gate
is missing, R2 stays blocked; it cannot mark itself complete or silently advance to R3.

| Existing gate | Resolution owner/phase | Closure evidence |
| --- | --- | --- |
| Missing `docs/evidence/PLAN-REV15-manifest.json` | Agent designs in R1; produces valid artifact in R2 | Exact REV15 candidate-tree and complete baseline change-set manifest |
| Missing `docs/reviews/PLAN-REV15.json` | Independent reviewer under R2's package | Structured PASS bound to that exact manifest, with finding dispositions |
| REV15 committed attestation missing | Agent, R2 in the reviewed predecessor order | Valid direct-child commit changing exactly the required two paths |
| Missing `docs/evidence/PLAN-REV16-manifest.json` | Agent designs in R1; produces valid artifact in R2 | Exact REV16 candidate-tree and complete baseline change-set manifest |
| Missing `docs/reviews/PLAN-REV16.json` | Independent reviewer under R2's package | Structured PASS bound to that exact manifest, with finding dispositions |
| REV16 committed attestation missing | Agent, R2 after required predecessor gates | Valid direct-child two-file attestation; full plan validation passes |

These are recorded failures, not administrative checkboxes. R1 must establish whether each
candidate and its ancestry can lawfully satisfy its gate; filenames or a prior local PASS
are not substitutes. No acceptance criteria are relaxed by this roadmap.

### R3 — Publish the already-applied records into a reviewed local catalog and connections

After R2, prepare and select one bounded catalog-refresh contract before implementation.
Use the completed 219 additions/38 updates as the reconciliation queue, not a new write
batch. Plan the exact allowed Master scholarship fields, tab/bounds and source projection
from existing evidence first; obtain the required fresh read authority before access.
Capture stable source revisions and account for every row within the approved bounds.
The saved 416 names are historical context, not a required future row or award count.
Reconcile all 257 applied operations to current rows and stable public IDs, with explicit
published, deferred, changed, duplicate, parent/resource or unresolved outcomes. Do not
silently import unrelated newer edits, collapse shared applications, or require every
scholarship's official facts to become known before a useful reviewed subset can proceed.

Prioritize the 38 distinct intake entities referenced across the organization, teaching,
ordinary-need and first-generation gaps (42 references with overlap). Preserve all remaining
applied records in the same queue. Extend only supported organization/Teaching connections;
consider first-generation/care wording only against exact award definitions and repeated
useful distinctions. Keep uncommon training requirements on cards. Preserve the two-input
core and existing supported choices. Do not show a new question with no usable connection.

**Done:** a separate immutable catalog/mapping candidate with complete source and applied-
operation reconciliation; each deferred item has owner, trigger and next action; every
shown option has exact reviewed award IDs and qualified explanations. Source freshness,
parent/child identity, privacy, GPA/school decisions, OR relevance, all-award access,
mobile/keyboard behavior and exact CSV are tested and independently reviewed. No deletion
of an existing award or change of shortlist policy may be inferred from a missing field;
propose such a change explicitly in the selected canonical contract first.

**Boundary:** exact source-read/local-implementation scope and prospective canonical policy
must be selected and reviewed first. No workbook mutation, official-fact acceptance by
inference or automatic deployment. R3's source read does not authorize a backup or copy.

### R4 — Accept and deliver the refreshed catalog

Apply R2's exact-candidate release controls to the separately reviewed R3 package, with
its own canonical policy, acceptance artifacts and new informed release authority.

**Done:** required canonical checks/attestations and exact Preview/Production verification
pass; deployed catalog counts and visible CSV match the reviewed reconciliation. Keep a
pinned rollback reference and an operator refresh procedure. No actual rollback or
scheduler activation is implied. If blocked, preserve the candidate and stop at this gate.

### R5 — Resolve the bounded additional-opportunity queue

Select a public-research contract limited initially to the 26 named records already in
`docs/evidence/coverage-discovery/proposal.json` (`programs`). Its scope includes all 20
previously researched historical occurrences, the four candidate additions, foster-program
conflicts, PDK, three Pony Club funds, AQHF and named non-foster discrepancies. Reuse still-
adequate evidence; recheck only decision-critical current rules, conflicts and availability.
Pin any public child-page set before enumeration. Access walls remain unknown; no login,
contact or application interaction. Do not turn this into an open-ended national search.

**Done:** all selected identities have an evidence-backed ready-for-batch-review, represented,
restricted/resource, or explicit hold disposition. Report inspected identities, supported
unique awards, verified broad reach and currently usable awards separately. The initial
four candidate additions remain non-write-ready until their individual gates actually pass.
None of the other 63 historical routes disappears or becomes newly verified by inference;
reopening one requires its recorded trigger or an explicit bounded scope amendment.

**Boundary:** bounded public research/local proposals only under the selected grant; no
workbook writes or automatic acceptance/publication. If no candidate clears its gates,
record that outcome and skip R6 explicitly rather than manufacture additions.

### R6 — Apply and publish only a separately approved new batch (conditional)

If R5 produces useful reviewed changes, finish exact targets, digest, duplicate survivors,
field evidence, tags and interview-coverage decisions before asking for a write grant.
New original-source writes require a full private native backup, verified preservation and
recovery in an authorized disposable copy, affected-cell preimages, fresh fingerprints,
protection against newer edits and exact readback. **No verified complete backup means no
source write.** Copy/recovery authority, original-write authority and release authority are
distinct. The original batch digest and quiet window are spent and cannot be replayed.

**Done:** either an explicit no-batch outcome, or exact authorized batch application and
readback followed by a separately selected R3/R4-style immutable publication and verified
release of those selected changes. Treat source application and publication as separate
gates/checkpoints; a spreadsheet receipt alone does not mean the website contains the awards.
No blind retry or whole-workbook restoration over newer edits. Stop on concurrency, recovery,
readback or authority failure and preserve recovery pointers in the current handoff.

### R7 — Close the selected build, preserve the remaining queue

Reconcile planned versus delivered scope, validation limits, acceptance state, open holds
and recovery objects. Update this plan's progress only through the current handoff and
its evidence pointers. Unresolved research is not a reason to invent rules or expand the
project indefinitely. Close the selected build when its agreed outcomes are delivered
and every deferred item remains actionable; do not require every unknown to disappear.

**Done:** exact final checkpoint/deployed revision, verified outcomes, unresolved items,
owners/triggers and one next-session instruction are saved and reviewed. Monitoring,
full-Master official currency, platform cleanup, issuer credential revocation and worktree
cleanup remain separate selections, not automatic closeout tasks.

## Existing backlog routing — no second ledger

The immutable proposal retains the original research history. This table assigns its IDs
to the ordered work above; it does not rewrite old decisions or claim new research.

| Existing work | Phase and disposition |
| --- | --- |
| D01 organizations; D02 ordinary need; D04 Teaching | R3/R4 first: reuse already-applied entities; R5/R6 only for additional verified opportunities |
| D03 foster/adoption/kinship | R5 resolves named conflicts/identities; R6 only after exact gates; definition changes require selected publication support |
| D05 equestrian | R5's three named Pony Club records/AQHF parent; uninspected children remain queued |
| D06 zero/one-connection choices | R3 distinguishes connection gaps using refreshed records; any expansion beyond R5's named set needs explicit scope selection |
| D07 first-generation definitions | R3 reviews the three existing supporting entities without a universal definition; new wording only when supported |
| D08 specialist memberships/training | R3 keeps the existing recommendation on cards; no new mandatory question |
| D09 historical omissions | R5 handles named records already in its 26-item set; other historical routes remain on their individual triggers |
| 310 held entities / 312 hold records; related corrections/catalogs | Preserve original ledger owner/trigger/next action; no bulk reopening. Selected ready changes enter R5/R6 |
| I65 formatting and Hagan I25 definition | R6 only after exact independent evidence/review and new batch authority; otherwise preserve existing holds |
| Recovery copies, quiet window, source-write safeguards | R6; retained objects remain protected during every phase |
| Full-Master official currency, monitoring, platform bookkeeping, retired issuer credential, historical worktrees | R7 handoff carries existing source pointers/owners; separate scope/authority required before action |

## Session discipline and limits on complexity

1. Resume from the operative top of CURRENT_HANDOFF, verify the clean checkpoint/ancestry,
   then validate prior reviews against their recorded Git candidates. Later reviewed
   documentation changes do not rebind an older review to current HEAD. Verify implementation
   paths still match the reviewed implementation or obtain a new review for actual changes.
2. Select one phase and write its exact objective, inputs, output and stop boundary before
   work. A pending phase, next pointer, green test or earlier permission is not new authority.
3. Reuse the existing ledgers, source IDs, stable award IDs and publication architecture.
   Add a field, question, service, dependency or abstraction only to solve a demonstrated
   selected need; document that need and prefer the smallest sufficient change.
4. Keep student-facing scope fixed: a short core, voluntary refinement, useful qualified
   connections, all-award access, temporary answers and clean downloads. No scoring engine,
   universal sensitive eligibility inference or form growth for one-off requirements.
5. End each session with one checkpoint and update only the operative handoff: phase/status,
   completed output, exact evidence, blockers, next action, authority needed and recovery
   pointers. Preserve historical sections as evidence, never competing current instructions.
6. If a phase encounters an unrelated issue, route it to its existing hold/backlog item.
   Do not expand scope, duplicate a tracker, repeat completed reviews without changed inputs,
   or mark a blocked/unknown item done merely to finish the session.
