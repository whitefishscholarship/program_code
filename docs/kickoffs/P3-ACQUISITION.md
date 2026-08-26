# P3 Kickoff — Architecture-Aware Acquisition

Paste the following into a fresh session only after the accepted P2 attestation is
delivered on `origin/main`.

```text
Execute P3 — Architecture-aware acquisition — only for
whitefishscholarship/program_code.

AUTHORITATIVE READ ORDER
1. AGENTS.md
2. docs/SCHOLARSHIP_SYSTEM_BUILD_PLAN.md
3. docs/BUILD_STATE.json
4. docs/CURRENT_HANDOFF.md
5. docs/evidence/P2.md
6. docs/evidence/P2-dry-run.json
7. docs/evidence/P2-compatibility.json
8. docs/kickoffs/P3-ACQUISITION.md
9. P2 model, adapter, fixtures, and tests plus existing acquisition code

PIN STATE BEFORE EDITING
- Discover the repository root, verify the origin remote, fetch origin, and record the
  exact current `origin/main` commit.
- Branch only from that verified commit after confirming it contains P2's accepted
  marker, evidence, manifest, independent review, and direct-child attestation.
- Validate every accepted plan amendment and historical attestation with
  `npm run plan:check`.
- Pin P2 model schema version `2.0.0`, P1 inventory SHA-256
  `3f7dda3cd9d2946a42e8dec16e5a4d3b6240218eda8b4fee0cb42fc7b32aec6a`,
  and the accepted P2 dry-run digest from committed evidence.
- Prefer committed sanitized fixtures. Any public live probe is read-only, bounded,
  timestamped, and an observation rather than permanent truth.
- Production spreadsheet remains unset and every production mutation is forbidden.

OBJECTIVE
Implement architecture-aware, bounded, resumable acquisition that routes every source
taxonomy without silent truncation and emits canonical P2 entities, evidence, review
items, and measurable completeness receipts.

ENTRY PREREQUISITES
- P2 is accepted and its immutable manifest/review attestation is present on
  `origin/main`.
- P2 schemas, compatibility evidence, and required architecture fixtures validate.
- No other stage is active and no unreviewed plan/state divergence exists.
- No production spreadsheet is configured or authorized.

IN SCOPE
- Architecture routing for all P2 source taxonomy values.
- Selective URL canonicalization that preserves identity-bearing queries and fragments.
- Single-page extraction, multi-award section splitting, document parsing, and public
  form reading without submission.
- Directory and pagination queues with bounded work, exact remaining counts, cursors,
  retries, and completeness receipts.
- Dynamic/login/manual-review paths that do not bypass access controls.
- Source-specific sanitized fixtures, deterministic tests, P3 evidence, and local
  commits.

OUT OF SCOPE
- Spreadsheet writes, accepted factual corrections, bulk accuracy remediation, or
  coverage expansion.
- Public API/UI changes, production migration, deployment configuration, or provider
  contact.
- Authentication bypass, CAPTCHA/robots bypass, form submission, paid actions, or
  applicant data collection.
- P4 verification decisions or destructive closure/archive conclusions.

INVARIANTS
- Execute P3 only; do not begin P4.
- Route by explicit source architecture and preserve `unknown` as review state.
- Never silently drop a page, cursor, child, result, award, source, application group,
  cycle, evidence item, or failure.
- A processing cap creates resumable queued work with an exact denominator and cursor.
- Fetch failure, bot block, login wall, and timeout are inconclusive, not evidence of
  closure.
- One URL may support multiple awards; one award may have multiple cycles; shared
  applications do not collapse children.
- Preserve `page`, `urlkey`, `sys_id`, filters, and meaningful fragments when they carry
  identity; remove only allow-listed tracking parameters.
- Never store credentials or applicant PII and never mutate either scholarship sheet.

REQUIRED FIXTURES
- Single award page.
- Multi-award page with distinct children.
- NFU-style unified application.
- Horatio-style directory/common-application exceptions.
- Reach Higher matching/supplements routed to bounded observation or review.
- FVCC-style pagination with resumable cursor and measured end.
- FIRST-style external provider results.
- ESA-style shared program.
- Versioned document/PDF and public Google Form without submission.
- Institution umbrella, login portal, offline/automatic, and explicit unknown.
- Identity-bearing query and fragment cases plus known tracking parameters.
- Timeout, retry exhaustion, bot block, malformed child, partial run, and cap recovery.

ACCEPTANCE TESTS
- Every P2 taxonomy routes deterministically to an acquisition strategy or explicit
  review path.
- Required identity-bearing URL components survive; allow-listed tracking parameters
  do not affect identity.
- Every bounded cap exposes exact processed, remaining, failed, and queued counts plus a
  resumable cursor.
- Re-running the same fixture and receipt is idempotent and creates no duplicate child.
- Parent sources, children, application groups, cycles, evidence, and review items
  validate against P2 schema version `2.0.0`.
- No representative fixture silently loses a page, result, or child.
- `cd web && npm ci` passes.
- `cd web && npm run plan:check` passes.
- `cd web && npm run typecheck` passes.
- `cd web && npm test` passes.
- `cd web && npm run build` passes.
- `git diff --check` passes.
- A fresh-context read-only reviewer finds no unresolved critical/high truncation,
  identity, privacy, or access-control finding.

EVIDENCE REQUIRED
- Update docs/evidence/P3.md with the accepted P2 input digests, routing matrix,
  completeness denominators, retry/cursor behavior, fixture counts, exact commands and
  results, external observations, and every unresolved unknown.
- Create deterministic machine-readable acquisition and completeness receipts.
- Update docs/BUILD_STATE.json and docs/CURRENT_HANDOFF.md.
- Create the exact P4 kickoff without executing P4.

INDEPENDENT REVIEW
- Freeze the complete P3 candidate before final review without the new P3 manifest or
  review record.
- Create a complete candidate-tree manifest against the verified `origin/main`
  baseline and obtain a genuinely fresh-context, read-only review.
- Give the reviewer the stage objective, canonical plan, P2 inputs, candidate diff,
  manifest, validation evidence, known risks, and explicit no-edit instructions.
- The implementation agent repairs findings; the reviewer rechecks the replacement.
- Critical/high findings block acceptance. Disposition every medium/low finding with
  rationale, owner, and target.
- Add only the accepted P3 manifest and review in the direct-child attestation commit;
  append no later commit before separately authorized delivery.

AUTONOMOUS GIT DELIVERY — NO GIT QUESTIONS TO KELSEY
Follow AGENTS.md. Use a P3 `codex/` branch and stage only P3-owned paths. Before push,
PR, or merge, inspect downstream effects. Proceed only when BUILD_STATE contains direct,
informed P3 authority with an evidence path for every resulting Vercel Preview and
Production effect, or a verified suppression mechanism covers the action. Never
force-push, rewrite history, discard user work, or bypass checks.

STOP CONDITIONS
- P2's accepted marker, evidence, manifest, and review are not all present on the
  verified `origin/main` commit.
- P2 model/dry-run digests cannot be validated.
- Work would require a spreadsheet write, product behavior change, P4 verification,
  production configuration, deployment change, form submission, access-control bypass,
  or provider contact.
- Independent review retains a critical/high finding.

END-OF-STAGE OUTPUT
- Outcome and accepted scope.
- Exact routing, completeness, identity, and fixture results.
- Independent-review disposition.
- Files and data surfaces changed.
- Evidence and handoff paths.
- PR and merged commit only when separately authorized and available.
- Remaining blockers and unknowns.
- Next permitted stage and exact kickoff path.

Do not start P4 in this session.
```
