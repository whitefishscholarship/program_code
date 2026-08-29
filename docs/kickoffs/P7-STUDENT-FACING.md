# P7 Kickoff — Student-Facing Product and API

Use this kickoff only in a fresh session after P6 is independently accepted, attested,
merged, and verified on live `origin/main`. This document does not start P7.

```text
Execute P7 — Student-facing product and API — only for
whitefishscholarship/program_code.

AUTHORITATIVE READ ORDER
1. AGENTS.md
2. docs/SCHOLARSHIP_SYSTEM_BUILD_PLAN.md
3. docs/BUILD_STATE.json
4. docs/CURRENT_HANDOFF.md
5. docs/evidence/P6.md
6. docs/evidence/P6-manifest.json
7. docs/reviews/P6.json
8. docs/kickoffs/P7-STUDENT-FACING.md
9. Accepted P2-P6 models, fixtures, reports, tests, and runtime surfaces needed by P7

STATE TO PIN BEFORE EDITING
- Repository root: discover with git rev-parse --show-toplevel.
- Remote: git@github.com:whitefishscholarship/program_code.git.
- Default branch: main.
- Expected baseline: discover live origin/main, then prove it is the merge carrying the
  exact P6 attestation named by docs/evidence/P6-manifest.json and docs/reviews/P6.json.
- Plan revision: 6.
- Testing spreadsheet: 1Dp5AMnrfSQ-Xf-r03S75lKsGPJk7o0inOgvC9Q6lOl4.
- Testing-sheet access: minimum bounded read-only access only; no write is authorized.
- Production spreadsheet identity/access/mutation: forbidden.

If repository, plan, sheet, P6 delivery, or stage state differs, reconcile it with
read-only evidence and stop if P7 prerequisites are not exact. Do not reinterpret a
local accepted marker as delivered acceptance.

OBJECTIVE
Present accurate scholarships, portals, application methods, cycle-aware status,
counts, filters, and exports to students without exposing internal or sensitive data.

ENTRY PREREQUISITES
- P6 is accepted and delivered on live origin/main with its exact candidate,
  direct-child attestation, complete manifest, and accepted fresh-context review.
- Canonical child/application-group records and count semantics reproduce P6 evidence.
- Before implementation, commit a P7 test matrix covering every source architecture and
  at least 360x800, 768x1024, and 1440x900 viewports.

IN SCOPE
- Student API compatibility/update and explicit privacy allow-list tests.
- Portal-versus-award presentation and honest separate counts.
- Cycle-aware status and sorting, application-method display, filters, accessible
  empty/error states, and exports.
- The predeclared browser journey matrix, dependency/security exposure review, P7
  evidence/tests/handoff, independent review, attestation, and authorized delivery.

OUT OF SCOPE
- Any spreadsheet write, production spreadsheet access/migration, P8 schedules or
  monitoring, P9, autonomous factual mutation, forms/application interaction,
  applicant data, provider contact, paid/destructive actions, deployment-configuration
  changes, history rewriting, gate weakening, or scope expansion.

INVARIANTS
- Execute P7 only; do not begin P8 or P9.
- Preserve sources, portals, awards, application groups, cycles, evidence, conflicts,
  unknowns, and recipient slots as distinct concepts.
- Closed or unknown cycles never appear active because of parse failure.
- Student API, UI, and export surfaces use hard allow-lists and expose no internal
  review notes, credentials, applicant values, or other PII.
- Preserve observed facts, inferences, and unknowns separately; green tests do not
  prove scholarship facts are current.

ACCEPTANCE TESTS
- Every precommitted matrix journey passes at every applicable required viewport or has
  an explicit reviewed exclusion.
- Matrix includes single awards, shared applications, portals, paper applications,
  automatic awards, and unavailable cycles.
- Counts reconcile exactly to the canonical model and keep sources, portals, awards,
  active cycles, and recipient slots separate.
- API/privacy allow-list, export, keyboard, accessibility, cycle/status, and fixture
  reconciliation checks pass.
- From web/: npm ci, P7-specific checks, npm run plan:check, npm run typecheck,
  npm test, npm run build, and the required dependency/security audit.
- From repository root: git diff --check.

EVIDENCE REQUIRED
- Precommitted P7 test matrix and completed browser evidence for all required viewports.
- API/UI/export count reconciliation, allow-list/privacy results, accessibility results,
  dependency/security findings with exposure classification, exact commands/timestamps,
  and all unknowns in docs/evidence/P7.md and machine-readable artifacts.
- Update docs/BUILD_STATE.json and docs/CURRENT_HANDOFF.md; prepare the exact P8 kickoff
  as documentation only.

INDEPENDENT REVIEW
- Freeze the complete P7 candidate without its new manifest/review record.
- Generate the complete candidate-tree manifest against verified origin/main and give
  the objective, contract, baseline/candidate, full diff, matrix, browser evidence,
  count/privacy/security evidence, and known risks to a fresh-context read-only reviewer
  that did not author or edit P7.
- Critical/high findings block acceptance. Disposition every medium/low finding.
- Add only the accepted P7 manifest and review in the candidate's direct-child two-file
  attestation. Append no later commit before delivery and preserve all prior
  attestations byte-for-byte.

AUTONOMOUS GIT DELIVERY — NO GIT QUESTIONS TO KELSEY
- Follow AGENTS.md, preserve unrelated work in an isolated codex/p7-... branch, and
  commit only P7-owned changes.
- Inspect downstream effects. BUILD_STATE's P7 standing authority covers the disclosed
  branch/PR/main Vercel effects but no reserved effect.
- Push, open/update the PR, monitor checks, and merge only after acceptance and policy
  gates pass. Never force-push, rewrite history, discard user work, or bypass checks.

STOP CONDITIONS
- P6 is not exactly accepted and delivered.
- Work requires a spreadsheet write, production/P9 action, P8 schedule, form/application
  interaction, applicant data, provider contact, deployment-configuration change,
  paid/destructive action, history rewrite, gate weakening, or scope expansion.
- The predeclared matrix cannot be reconciled, sensitive data escapes an allow-list, or
  independent review retains a critical/high finding.

END-OF-STAGE OUTPUT
- One PASS/BLOCKED/FAIL status, accepted scope, exact verification and browser results,
  independent-review disposition, changed surfaces, PR/merge commit, evidence/handoff,
  unresolved items, and next permitted stage/kickoff.

Do not begin P8 or P9 in this session.
```
