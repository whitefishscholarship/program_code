# P9 Kickoff — Production Migration, Deployment, and Closeout

Use this kickoff only in a fresh session after P8 is independently accepted, attested,
merged, and verified on live `origin/main`. This document prepares P9; it does not
start production work and grants no production authority.

```text
Execute P9 — Production migration, deployment, and closeout — only for
whitefishscholarship/program_code, and only after direct informed production authority.

AUTHORITATIVE READ ORDER
1. AGENTS.md
2. docs/SCHOLARSHIP_SYSTEM_BUILD_PLAN.md
3. docs/BUILD_STATE.json
4. docs/CURRENT_HANDOFF.md
5. docs/evidence/P8.md
6. docs/evidence/P8-manifest.json
7. docs/reviews/P8.json
8. docs/kickoffs/P9-PRODUCTION-MIGRATION.md
9. Accepted P5 backup/write receipts and P7/P8 public, monitoring, and rollback surfaces

STATE TO PIN BEFORE EDITING
- Fetch live origin/main without changing user work and prove the exact accepted P8
  direct-child attestation is present.
- Verify P0-P8 are accepted and delivered, with no unresolved critical/high finding.
- Require the exact production spreadsheet identity, explicit production migration
  authority, current production backup, verified permissions, and named deploy/rollback
  owner. None is supplied by this kickoff.

OBJECTIVE
Move the accepted system to the explicitly authorized production spreadsheet, reconcile
it completely, deploy the recorded commit, demonstrate rollback, and close the program.

IN SCOPE
- Only work expressly authorized after every P9 entry prerequisite is satisfied.
- Production backup, reviewed dry-run diff, migration receipt, post-write
  reconciliation, deployment/smoke evidence, rollback demonstration, operator runbook,
  final architecture/data documentation, and closeout handoff.

OUT OF SCOPE
- Any production identity discovery, access, backup, write, migration, deployment, or
  rollback before direct informed authority is recorded.
- Applicant data, unrelated production data, silent schema changes, forms/application
  interaction, provider contact, paid/destructive actions outside the exact approved
  rollback plan, history rewriting, gate weakening, or scope expansion.

INVARIANTS
- P9 is the only stage. Do not infer authority from P8 acceptance or this document.
- Dry-run diff must be reviewed before any production write.
- Backup, exact revision, migration receipt, post-write reconciliation, deployed commit,
  smoke evidence, and rollback proof must remain bound and recoverable.
- Preserve applicant privacy and every unknown/manual-review state.

ACCEPTANCE TESTS
- Run npm ci, plan validation, typecheck, complete tests, production build, security
  audit, root whitespace validation, production health/API/browser smoke, exact count
  reconciliation, required deterministic record sample, and rollback demonstration.
- Independent fresh-context review retains no critical/high finding.

INDEPENDENT REVIEW
- Freeze the exact P9 candidate, generate the complete manifest, and obtain a fresh-
  context read-only review by an agent that did not author or edit P9.
- Critical/high findings block acceptance; disposition every medium/low finding.
- Add only the accepted manifest and review in the direct-child two-file attestation.

AUTONOMOUS GIT DELIVERY — NO GIT QUESTIONS TO KELSEY
- Follow AGENTS.md and the exact recorded production/deployment authority.
- Never force-push, rewrite history, bypass checks, or broaden production access.

STOP CONDITIONS
- P8 is not exactly accepted and delivered on live origin/main.
- Production spreadsheet identity or direct migration authority is absent.
- Backup, permissions, review-before-write, reconciliation, deploy owner, or rollback
  prerequisites are incomplete.
- Work would expose applicant data, weaken a gate, or expand beyond exact authority.

END-OF-STAGE OUTPUT
- One PASS/BLOCKED/FAIL status, exact migration/deployment/rollback evidence, review,
  PR/merge commit, remaining unknowns, and program closeout state.
```

