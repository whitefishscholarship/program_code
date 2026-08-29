# P8 Kickoff — Monitoring, Review Operations, and Recovery

Use this kickoff only in a fresh session after P7 is independently accepted, attested,
merged, and verified on live `origin/main`. This document prepares P8; it does not
start monitoring work or authorize any schedule or deployment-configuration change.

```text
Execute P8 — Monitoring, review operations, and recovery — only for
whitefishscholarship/program_code.

AUTHORITATIVE READ ORDER
1. AGENTS.md
2. docs/SCHOLARSHIP_SYSTEM_BUILD_PLAN.md
3. docs/BUILD_STATE.json
4. docs/CURRENT_HANDOFF.md
5. docs/evidence/P7.md
6. docs/evidence/P7-manifest.json
7. docs/reviews/P7.json
8. docs/kickoffs/P8-MONITORING.md
9. Accepted P3-P7 acquisition, verification, data, API, and rollback surfaces needed by P8

STATE TO PIN BEFORE EDITING
- Discover the repository root and fetch live origin/main without changing user work.
- Prove live origin/main is the merge carrying the exact accepted P7 direct-child
  attestation named by the P7 manifest and review.
- Pin the accepted P7 public catalog, review states, receipts, and rollback boundaries.
- Testing-sheet access is minimum bounded read-only unless separate direct write
  authority is recorded. Production spreadsheet identity/access/mutation is forbidden.

If P7 delivery or stage state is not exact, reconcile with read-only evidence and stop.
A local accepted marker is not proof of delivery.

OBJECTIVE
Keep links, facts, and cycles current through bounded, observable automation and
explicit human review, with safe recovery from partial or failed runs.

IN SCOPE
- Scheduled-check logic developed and exercised locally or in dry-run mode only.
- Change detection, freshness rules, rate limiting, retries/backoff, review queues,
  notification/report artifacts, run receipts, recovery procedures, and operator docs.
- Simulations for 404, timeout, bot block, redirect, date conflict, portal change, and
  partial-run recovery.
- Two consecutive testing-sheet dry runs, independent review, attestation, and the
  authorized Git/Vercel delivery path.

OUT OF SCOPE
- Creating, enabling, or changing a live schedule or deployment configuration.
- Spreadsheet writes, production/P9 work, autonomous factual mutation, forms or
  application interaction, applicant data, provider contact, paid/destructive actions,
  history rewriting, gate weakening, or scope expansion.

INVARIANTS
- Execute P8 only; do not begin P9.
- Monitoring defaults to review for ambiguity and cannot partially publish accepted state.
- Preserve unknown, blocked, inaccessible, conflict, and stale states; a fetch result is
  not automatically an accepted scholarship fact.
- Every run is bounded, observable, resumable, idempotent, and tied to an immutable receipt.
- Secrets, credentials, applicant values, and internal-only evidence never enter public
  reports or logs.

ACCEPTANCE TESTS
- Two consecutive testing-sheet dry runs reconcile with no duplicate or lost work.
- All required failure simulations behave as specified, including partial-run recovery.
- Retry/backoff and rate limits are deterministic and bounded in tests.
- Failed runs cannot publish accepted state; recovery restores the last accepted receipt.
- Full stage-specific checks plus npm ci, plan validation, typecheck, complete tests,
  production build, dependency/security audit, and root whitespace validation pass.

EVIDENCE REQUIRED
- Machine-readable dry-run receipts, failure-simulation results, idempotency and recovery
  reconciliation, privacy/logging checks, exact commands/timestamps, and unresolved items.
- Update docs/BUILD_STATE.json and docs/CURRENT_HANDOFF.md; prepare P9 kickoff as
  documentation only without starting production migration.

INDEPENDENT REVIEW AND DELIVERY
- Freeze the complete P8 candidate without its new manifest/review record.
- Give the objective, contract, baseline/candidate, complete diff, receipts, simulations,
  privacy evidence, recovery evidence, and known risks to a fresh-context read-only
  reviewer that did not author or edit P8.
- Critical/high findings block acceptance; disposition every medium/low finding.
- Add only the accepted manifest and review in the candidate's direct-child two-file
  attestation. Append no later commit before authorized delivery.
- Standing authority covers P8 commits, review, attestation, push, PR, merge, and the
  disclosed Vercel effects. It does not authorize a live schedule, deployment-
  configuration change, spreadsheet write, or any other reserved action.

AUTONOMOUS GIT DELIVERY — NO GIT QUESTIONS TO KELSEY
- Follow AGENTS.md, preserve unrelated work in an isolated codex/p8-... branch, and
  commit only P8-owned changes.
- Inspect downstream effects. BUILD_STATE's P8 standing authority covers the disclosed
  branch/PR/main Vercel effects but no live schedule, deployment-configuration change,
  spreadsheet write, production/P9 action, or other reserved effect.
- Push, open/update the PR, monitor checks, and merge only after acceptance and policy
  gates pass. Never force-push, rewrite history, discard user work, or bypass checks.

STOP CONDITIONS
- P7 is not exactly accepted and delivered.
- Work requires a live schedule/configuration change, spreadsheet write, production/P9
  action, form/application interaction, applicant data, provider contact, paid or
  destructive action, history rewrite, gate weakening, or scope expansion.
- A run can partially publish accepted state, dry runs do not reconcile, or independent
  review retains a critical/high finding.

END-OF-STAGE OUTPUT
- One PASS/BLOCKED/FAIL status, exact verification and dry-run results, review
  disposition, PR/merge commit, evidence/handoff, unresolved items, and next permitted
  stage. Do not begin P9 in the P8 session.
```
