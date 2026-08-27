# P4 Kickoff — Accuracy and Verification Engine

Paste the following into a fresh session only after the accepted P3 attestation is
delivered on `origin/main`.

```text
Execute P4 — Accuracy and verification engine — only for
whitefishscholarship/program_code.

AUTHORITATIVE READ ORDER
1. AGENTS.md
2. docs/SCHOLARSHIP_SYSTEM_BUILD_PLAN.md
3. docs/BUILD_STATE.json
4. docs/CURRENT_HANDOFF.md
5. docs/evidence/P3.md
6. docs/evidence/P3-acquisition.json
7. docs/evidence/P3-completeness.json
8. docs/evidence/P3-live-observations.json
9. docs/kickoffs/P4-VERIFICATION.md
10. P2 canonical model plus P3 acquisition fixtures, receipts, implementation, and tests

PIN STATE BEFORE EDITING
- Discover the repository root, verify the origin remote, fetch origin, and record exact
  `origin/main`.
- Branch only from that verified commit after confirming it contains P3's accepted
  marker, evidence, manifest, independent review, and direct-child attestation.
- Run `npm run plan:check` and validate every historical attestation before editing.
- Pin P2 schema version `2.0.0`, P3 acquisition/completeness report digests, and the
  exact sanitized fixture denominator from committed evidence.
- Treat P3 public probes as bounded historical observations, not current scholarship
  truth. Any P4 public read is separately timestamped and evidence-bound.
- Production spreadsheet remains unset and every production mutation is forbidden.

OBJECTIVE
Verify links, dates, cycles, eligibility, amounts, application methods, and field-level
claims without turning failures or ambiguity into accepted corrections or destructive
archive decisions.

ENTRY PREREQUISITES
- P3 is accepted and its immutable manifest/review attestation is present on
  `origin/main`.
- P3 routes, cursors, exact completeness denominators, and review paths validate.
- P2 canonical relationships and P3 fixture graphs validate without loss.
- No other stage is active and no unreviewed plan/state divergence exists.
- No production spreadsheet is configured or authorized.

IN SCOPE
- CellData-aware link audit and redirect/target classification.
- Typed date parsing, annual-cycle status, precision, recurrence, and time-zone handling.
- Official-source authority rules and parent/child evidence precedence.
- Field-level evidence receipts, conflict detection, freshness policy, and manual-review
  severity rules.
- Read-only bounded public-source verification and the minimum required read-only access
  to the pinned testing spreadsheet when directly required by the P4 contract.
- Sanitized fixtures, deterministic reports, tests, P4 evidence, and local commits.

OUT OF SCOPE
- Spreadsheet writes, accepted bulk corrections, archives, merges, or P5 remediation.
- Coverage expansion, public API/UI changes, production migration, or deployment
  configuration.
- Authentication/CAPTCHA/robots bypass, form submission, applicant data, paid actions,
  provider contact, or destructive closure conclusions.
- Starting P5.

INVARIANTS
- Execute P4 only; do not begin P5.
- A successful fetch proves only that one URL responded at that time.
- Timeout, bot block, login wall, TLS failure, rate limit, and server error remain
  inconclusive unless stronger official evidence proves a factual state.
- Only direct current official evidence can support field acceptance; aggregators and
  parent summaries cannot silently override child-specific official facts.
- Preserve raw date text, typed value, year, precision, timezone, recurrence, and
  status separately; never invent precision.
- Audit hidden CellData hyperlinks as links and account for every bounded input.
- Conflicts, inaccessible facts, and stale documents produce visible review items.
- Never mutate either scholarship sheet and never store credentials or applicant PII.

REQUIRED FIXTURES
- 404 and 410, redirects on-host and off-host, timeout, DNS failure, TLS failure, 429,
  5xx, bot block, login wall, and dynamic near-empty HTML.
- Hidden CellData hyperlinks and offline/paper application methods.
- Exact dates, date-only values, spreadsheet serials, ranges, rolling dates, annual
  rules, approximate/month-only text, unknowns, invalid dates, and explicit time zones.
- Active, closed, upcoming, unavailable, and unknown cycles across year boundaries.
- Parent/child official-source conflict, stale direct PDF versus current parent page,
  aggregator versus provider, and corroborating/conflicting evidence.
- Amount, eligibility, application-method, and deadline field conflicts with provenance.
- Freshness expiry and manual-review severity for every inconclusive class.

ACCEPTANCE TESTS
- Every bounded CellData hyperlink and explicit offline method has one reconciled audit
  outcome; no hidden application hyperlink is skipped.
- Known-dead links are distinguished from inconclusive failures; no timeout, block, or
  login wall becomes closure evidence.
- Date fixtures preserve raw text and exact precision/time-zone/recurrence semantics.
- Closed awards cannot become active solely because parsing failed.
- Field acceptance requires current official evidence and every conflict creates a
  review item with source and retrieval provenance.
- Re-running the same pinned evidence is deterministic and idempotent.
- `cd web && npm ci` passes.
- `cd web && npm run plan:check` passes.
- `cd web && npm run typecheck` passes.
- `cd web && npm test` passes.
- `cd web && npm run build` passes.
- `git diff --check` passes.
- A fresh-context read-only reviewer finds no unresolved critical/high false-archive,
  false-current, privacy, access-control, or evidence-integrity finding.

EVIDENCE REQUIRED
- Update `docs/evidence/P4.md` with pinned P3 digests, complete link/date/field fixture
  denominators, source-authority matrix, exact command results, public observations,
  unknowns, and external effects.
- Create deterministic machine-readable link, cycle, field-evidence, conflict, and
  review receipts.
- Update `docs/BUILD_STATE.json` and `docs/CURRENT_HANDOFF.md`.
- Create the exact P5 kickoff without executing P5 or writing any spreadsheet.

INDEPENDENT REVIEW
- Freeze the complete P4 candidate without the new P4 manifest/review record.
- Build the complete candidate-tree manifest against verified `origin/main` and obtain
  a genuinely fresh-context read-only review.
- Give the reviewer the objective, canonical plan, P3 inputs, candidate diff, manifest,
  validation evidence, known risks, and explicit no-edit instructions.
- The implementation agent repairs findings; the reviewer rechecks the replacement.
- Critical/high findings block acceptance. Disposition every medium/low finding with
  rationale, owner, and target.
- Add only accepted P4 manifest/review in the direct-child attestation; append no later
  commit before authorized delivery.

AUTONOMOUS GIT DELIVERY — NO GIT QUESTIONS TO KELSEY
Follow AGENTS.md. Use a P4 `codex/` branch and stage only P4-owned paths. Before push,
PR, or merge, inspect downstream effects and require the exact P4 delivery authority in
BUILD_STATE. Never force-push, rewrite history, discard user work, or bypass checks.

STOP CONDITIONS
- P3 acceptance evidence or attestation is missing from verified `origin/main`.
- P3 acquisition/completeness digests or P2 model relationships cannot be reproduced.
- Work requires a spreadsheet write, accepted correction, P5 remediation, production
  configuration, deployment change, form submission, access-control bypass, paid
  action, provider contact, or destructive conclusion.
- Independent review retains a critical/high finding.

END-OF-STAGE OUTPUT
- Outcome and accepted scope.
- Exact link, date, field-evidence, conflict, and manual-review denominators.
- Independent-review disposition.
- Files and data surfaces changed.
- Evidence and handoff paths.
- PR and merged commit only when authorized and available.
- Remaining blockers and unknowns.
- Next permitted stage and exact kickoff path.

Do not start P5 in this session.
```
