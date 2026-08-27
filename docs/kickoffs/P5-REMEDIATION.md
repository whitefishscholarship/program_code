# P5 Kickoff — Complete Testing-Sheet Accuracy Remediation

Paste the following into a fresh session only after the accepted P4 attestation is
delivered on `origin/main` **and** Kelsey has supplied separate direct informed authority
for the testing-sheet writes required by P5.

```text
Execute P5 — Complete testing-sheet accuracy remediation — only for
whitefishscholarship/program_code.

AUTHORITATIVE READ ORDER
1. AGENTS.md
2. docs/SCHOLARSHIP_SYSTEM_BUILD_PLAN.md
3. docs/BUILD_STATE.json
4. docs/CURRENT_HANDOFF.md
5. docs/evidence/P4.md
6. docs/evidence/P4-links.json
7. docs/evidence/P4-cycles.json
8. docs/evidence/P4-field-evidence.json
9. docs/evidence/P4-conflicts.json
10. docs/evidence/P4-reviews.json
11. docs/kickoffs/P5-REMEDIATION.md
12. P1 CellData capture, P2 model, P3 acquisition, P4 verification implementation,
    fixtures, reports, and tests

PIN STATE BEFORE EDITING OR ACCESSING THE SHEET
- Discover the repository root, verify the origin remote, fetch origin, and record exact
  `origin/main`.
- Branch only from that verified commit after confirming it contains P4's accepted
  marker, evidence, manifest, independent review, and direct-child attestation.
- Run `npm run plan:check` and validate every historical attestation before editing.
- Verify that BUILD_STATE contains direct, informed P5 testing-sheet write authority
  with an evidence path. The Plan Revision 5 standing mandate does not supply it.
- Pin the testing spreadsheet ID
  `1Dp5AMnrfSQ-Xf-r03S75lKsGPJk7o0inOgvC9Q6lOl4`, tab `Master Database`, a current
  Drive revision fingerprint, and a complete reversible backup before any write.
- Production spreadsheet identity must remain unset and every production access or
  mutation is forbidden.

OBJECTIVE
Apply a controlled, human-reviewable accuracy audit to every current testing-sheet
record, with complete dispositions, evidence-bound proposals, authorized idempotent
writes, and exact post-write reconciliation.

ENTRY PREREQUISITES
- P4 is accepted and its immutable manifest/review attestation is present on
  `origin/main`.
- A current testing-sheet revision fingerprint and reversible backup are captured.
- Separate direct informed authority explicitly covers the required testing-sheet
  writes. Git/Vercel delivery authority alone is insufficient.
- P4 link, cycle, field-evidence, conflict, and review receipts validate byte-for-byte.
- No other stage is active and no unreviewed plan/state divergence exists.
- No production spreadsheet is configured or authorized.

IN SCOPE
- A complete pre-write row denominator and one proposed disposition per input row:
  confirmed, corrected, archived, merged, or manual review.
- Evidence-bound proposals for link, deadline, eligibility, amount, application-method,
  duplicate, and archive decisions.
- Human-review queue, deterministic high-risk review sample, applied-change receipt,
  idempotent authorized writes to the named testing sheet only, and post-write
  reconciliation.
- P5 tooling, sanitized fixtures, evidence, tests, handoff, local commits, independent
  review, attestation, and authorized Git/Vercel delivery.

OUT OF SCOPE
- Any sheet write without separate direct informed authority and verified backup.
- Production-sheet identity, read, write, migration, or P9 action.
- Portal/source coverage expansion, P6 execution, public API/UI changes, deployment
  configuration, schedules, forms/application interactions, applicant data, paid or
  destructive actions, access-control bypass, or provider contact.
- Starting P6.

INVARIANTS
- Execute P5 only; do not begin P6.
- Every input row has exactly one reconciled disposition.
- A dead target is not by itself proof that an award is closed; archives, merges,
  eligibility exclusions, deadline corrections, and application-route changes require
  the P4 evidence standard and human review.
- Timeout, DNS/TLS failure, rate limit, server error, bot block, login wall, dynamic
  shell, stale source, and unresolved conflict remain manual review.
- Applied writes must equal approved proposals exactly and be idempotent.
- Preserve parent sources, children, shared applications, cycles, raw values, evidence,
  unknowns, and rollback identity.
- Never collect, log, or commit applicant PII or credentials.

ACCEPTANCE TESTS
- Every pre-write input row has exactly one confirmed, corrected, archived, merged, or
  manual-review disposition; totals reconcile with no omission or duplicate.
- Every proposed or applied material-field change has current direct official evidence.
- Every archive, merge, known-dead link, eligibility exclusion, portal/application
  relationship change, deadline correction, and application-link correction receives
  100% independent review.
- A deterministic SHA-256-selected 20% of all remaining dispositions is independently
  reviewed, with a minimum of 25 or all when fewer than 25 remain.
- Applied writes match approved proposals, the pinned revision/backup, and an exact
  idempotent change receipt.
- Post-write counts equal pre-write rows plus explicit disposition totals.
- `cd web && npm ci`, stage-specific reconciliation checks, `npm run plan:check`,
  `npm run typecheck`, `npm test`, and `npm run build` pass.
- `git diff --check` passes.
- A fresh-context read-only reviewer finds no unresolved critical/high false-archive,
  data-loss, evidence-integrity, privacy, authorization, or reconciliation finding.

EVIDENCE REQUIRED
- Record the exact pre-write revision and backup identity, row denominator, proposals,
  approval boundary, applied receipt, post-write revision, disposition totals,
  reconciliation, commands, unknowns, rollback, and external effects in
  `docs/evidence/P5.md` and deterministic machine-readable artifacts.
- Update `docs/BUILD_STATE.json` and `docs/CURRENT_HANDOFF.md`.
- Create the exact P6 kickoff without executing P6.

INDEPENDENT REVIEW
- Freeze the complete P5 candidate without the new P5 manifest/review record.
- Build the complete candidate-tree manifest against verified `origin/main` and use a
  genuinely fresh-context read-only reviewer that did not author or edit P5.
- Give the reviewer the original objective, plan, P4 inputs, pre/post revision and
  backup identities, complete proposal/write/reconciliation receipts, candidate diff,
  manifest, validation evidence, and explicit no-edit instructions.
- The implementation agent repairs findings; the reviewer rechecks the replacement.
- Critical/high findings block acceptance. Disposition every medium/low finding.
- Add only accepted P5 manifest/review in the direct-child attestation and append no
  later commit before authorized delivery.

AUTONOMOUS GIT DELIVERY — NO GIT QUESTIONS TO KELSEY
Follow AGENTS.md. P5 Git/Vercel delivery is covered by its stage-specific standing
record after acceptance, but that record does not authorize a spreadsheet write. Use a
P5 `codex/` branch, stage only P5-owned paths, inspect downstream effects, and never
force-push, rewrite history, discard user work, or bypass checks.

STOP CONDITIONS
- P4 acceptance evidence or attestation is missing from verified `origin/main`.
- Separate direct informed testing-sheet write authority or a verified backup/revision
  fingerprint is absent.
- P4 receipts cannot be reproduced or the sheet changed after the pinned fingerprint.
- Work requires production access, P6, coverage expansion, deployment change,
  form/application interaction, access-control bypass, paid action, provider contact,
  or an unreviewed destructive conclusion.
- Independent review retains a critical/high finding.

END-OF-STAGE OUTPUT
- Outcome and accepted scope.
- Exact pre/post revisions, backup/rollback identity, disposition totals, write receipt,
  and reconciliation.
- Independent-review coverage and disposition.
- Files and data surfaces changed.
- Evidence and handoff paths.
- PR and merged commit only when authorized and available.
- Remaining blockers and unknowns.
- Next permitted stage and exact kickoff path.

Do not start P6 in this session.
```
