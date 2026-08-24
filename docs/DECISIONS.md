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
