# Interview coverage execution — INTERVIEW-COVERAGE-1

Date: 2026-09-12. Status: local preparation; independent policy review required before product edits.

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
