# Decision Log

This file is append-only. Accepted entries may be superseded by a later decision,
but are not rewritten or deleted.

## D-001 — Canonical plan and machine-readable state

- Date: 2026-08-23
- Status: accepted
- Decision: Use `docs/SCHOLARSHIP_SYSTEM_BUILD_PLAN.md` as the human authority and
  `docs/BUILD_STATE.json` as the machine-checkable stage pointer.
- Reason: New sessions need one stable scope contract and a compact way to detect
  an invalid stage transition.
- Consequence: Kickoffs and handoffs summarize authority but cannot replace it.

## D-002 — Separate sources, awards, applications, and cycles

- Date: 2026-08-23
- Status: accepted
- Decision: Preserve Source, Scholarship, Application Group, Cycle, Evidence, and
  Review Item as distinct concepts.
- Reason: Live sources show one-to-many, many-to-one, paginated, shared-application,
  and annual-cycle relationships that a flat row cannot represent safely.
- Consequence: P2 must provide compatibility with the existing sheet before any
  migration.

## D-003 — Honest coverage metrics

- Date: 2026-08-23
- Status: accepted
- Decision: Report portals, individual awards, active cycles, search results, and
  recipient slots separately.
- Reason: A higher row count can otherwise misstate the number of applications or
  opportunities available to a student.
- Consequence: P6 has no arbitrary target count; relevance, currency, evidence, and
  completeness determine success.

## D-004 — Testing sheet until P9

- Date: 2026-08-23
- Status: accepted
- Decision: P0-P8 may not configure or mutate the production Whitefish spreadsheet.
- Reason: The user designated the supplied sheet as the testing surface and deferred
  production migration until the system is built.
- Consequence: Production spreadsheet identity remains unset in build state.

## D-005 — Autonomous, non-destructive Git delivery

- Date: 2026-08-23
- Status: accepted
- Decision: Agents make routine branch, worktree, commit, push, PR, merge, and cleanup
  decisions without asking Kelsey.
- Reason: The user explicitly requested no Git questions.
- Consequence: `AGENTS.md` requires isolated work for dirty trees, stage-scoped
  branches, preservation of user changes, and no history rewriting or check bypass.

## D-006 — Independent acceptance review

- Date: 2026-08-23
- Status: accepted
- Decision: A fresh-context reviewer that did not author or edit the stage must review
  the final candidate read-only. The implementation agent performs remediation.
- Reason: Reviewer independence is an explicit user requirement and prevents
  self-confirming stage closure.
- Consequence: Critical/high findings block acceptance; the reviewer rechecks after
  remediation.

## D-007 — No silent truncation

- Date: 2026-08-23
- Status: accepted
- Decision: Processing may be bounded per run, but omitted pages, children, results,
  and awards must remain counted and resumable.
- Reason: Current source architectures include catalogs and portals far larger than
  existing ingestion caps.
- Consequence: P3 completion requires completeness receipts and resumable cursors.

## D-008 — Main-branch merge has a production deployment effect

- Date: 2026-08-23
- Status: accepted
- Decision: Treat a merge to `main` as both Git delivery and a production redeploy
  because the repository CI documents that `main` auto-deploys. Require a pre-merge
  downstream-effect check and stage-specific authority or verified suppression.
- Reason: A merge cannot be described as side-effect-free when it triggers deployment.
- Consequence: Routine Git preferences still do not go to Kelsey, but missing release
  authority is an external-effect blocker. Historical GitHub deployment records also
  show Vercel Preview deployments for branch/PR revisions, so the check begins before
  push rather than only before merge. P0 execution approval did not explicitly
  acknowledge those Preview/Production effects; P0 delivery remains blocked until
  direct informed authority or verified suppression is recorded. No Git delivery
  authority ever authorizes spreadsheet writes.

## D-009 — Exact P0 commit delivery authority and amendment boundary

- Date: 2026-08-23
- Status: accepted
- Decision: Preserve the user's authorization to push commit `07a6e14`, create its PR,
  and merge it, but do not extend that authorization to later candidate changes without
  a new direct informed instruction.
- Reason: Kelsey explicitly authorized those Git actions after acknowledging that they
  may trigger Vercel Preview and Production deployments.
- Evidence: `docs/evidence/P0-delivery-authorization.md`
- Consequence: The later validator and authorization amendment remains a delivery
  blocker until separately authorized. No authorization permits spreadsheet writes or
  product behavior changes.

## D-010 — Complete amended P0 delivery authority

- Date: 2026-08-23
- Status: accepted
- Decision: Deliver the P0 branch containing `07a6e14` and `24a368d`, one
  documentation-only commit recording this authorization, and one attestation-only
  commit containing the final manifest and independent review record.
- Reason: Kelsey explicitly authorized push, PR creation/update, merge to `main`, and
  resulting Vercel Preview and Production deployments for that bounded final candidate.
- Evidence: `docs/evidence/P0-delivery-authorization.md`
- Consequence: Delivery may proceed only after the refreshed independent adversarial
  review accepts the frozen candidate. The authority excludes spreadsheet writes,
  product behavior changes, deployment-configuration changes, form submissions, and
  provider contact.

## D-011 — Attestation-only enforcement and renewed delivery boundary

- Date: 2026-08-23
- Status: accepted
- Decision: Require the manifest/review attestation to be the candidate commit's direct
  child with exactly those two changed paths; preserve historical attestation blobs;
  and machine-check a disposition for every medium/low finding.
- Reason: Independent review of `5b3082e` found that arbitrary post-candidate changes
  could otherwise escape review and that nonblocking findings could lack ownership.
- Consequence: The validator remediation is a new candidate change outside D-010's
  exact delivery sequence. Keep delivery blocked until Kelsey explicitly authorizes the
  final remediated commit and its direct-child attestation.

## D-012 — Canonical first attestation and undelivered branch-tip lock

- Date: 2026-08-23
- Status: accepted
- Decision: Treat the first structurally valid manifest/review addition as the immutable
  attestation; reject later deletion/re-addition or rebinding; and require the
  undelivered branch tip to equal its attestation commit.
- Reason: Independent recheck of `0e4e106` found that a later arbitrary commit or a
  replacement attestation could otherwise escape the reviewed-candidate boundary.
- Consequence: CI receives the PR head SHA, historical attestation blobs remain fixed,
  and delivery stays blocked until the final remediation commit is explicitly authorized.

## D-013 — Final P0 technical acceptance and delivery authority

- Date: 2026-08-23
- Status: accepted
- Decision: Deliver the branch through technical commit
  `1460818684eeaef0b431c59465c5f0b9168b791b`, this one documentation-only
  authorization/acceptance commit, and one direct-child attestation commit containing
  exactly the P0 manifest and independent review record.
- Reason: The independent reviewer accepted `1460818` at 2026-08-24T03:22:20Z with
  zero findings, after which Kelsey explicitly authorized the bounded sequence, Git
  delivery, and resulting Vercel Preview and Production deployments.
- Evidence: `docs/evidence/P0-delivery-authorization.md`
- Consequence: After the final candidate receives independent acceptance and the
  two-file attestation passes locally, Codex may push, open/update the PR, merge, and
  verify delivery. Spreadsheet writes, product behavior changes, deployment-configuration
  changes, form submissions, and provider contact remain forbidden.

## D-014 — Hash-bound delivery integration for post-attestation authority

- Date: 2026-08-24
- Status: accepted candidate pending independent review and delivery
- Decision: Amend the plan to permit one machine-checked delivery integration for exact
  P1 candidate `92ee21095e959bd19ab641752308c0fd9b394b22` and canonical attestation
  `20476b8384cfbda6aaa04a3da4b7f0a3fbd291e5`. Deliver this amendment first. Then merge
  the preserved attestation as the second parent of a candidate whose first parent is
  the verified amended `origin/main`, independently review the complete integration
  change set, and add a direct-child two-file delivery attestation.
- Reason: P1 was correctly frozen while delivery was prohibited. Direct informed
  Preview/Production authority arrived afterward, but Plan Revision 1 simultaneously
  required that authority in `BUILD_STATE` and prohibited every post-attestation commit
  or rebinding. The narrow integration records the later authority without altering the
  reviewed P1 candidate, attestation, manifest, or review.
- Evidence: `docs/evidence/PLAN-REV2.md` and
  `docs/evidence/P1-delivery-authorization.md`
- Consequence: The exception applies only to the exact pinned P1 history and the exact
  reviewed delivery integration. It does not create a general post-attestation edit
  path, waive independent review, or authorize spreadsheet writes, product changes,
  deployment-configuration changes, form submissions, or provider contact.
