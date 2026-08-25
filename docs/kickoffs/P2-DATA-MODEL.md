# P2 Kickoff — Canonical Data and Evidence Model

Paste the following into a fresh session only after the accepted P1 attestation is
delivered on `origin/main`.

```text
Execute P2 — Canonical data and evidence model — only for
whitefishscholarship/program_code.

AUTHORITATIVE READ ORDER
1. AGENTS.md
2. docs/SCHOLARSHIP_SYSTEM_BUILD_PLAN.md
3. docs/BUILD_STATE.json
4. docs/CURRENT_HANDOFF.md
5. docs/evidence/P1.md
6. docs/evidence/P1-inventory.json
7. docs/kickoffs/P2-DATA-MODEL.md
8. Existing data, ingestion, audit, API, UI, fixture, and test code

PIN STATE BEFORE EDITING
- Discover the repository root and verify the origin remote.
- Fetch origin and record the current `origin/main` commit. Branch only from that
  verified commit after confirming it contains P1's accepted marker, evidence,
  manifest, independent review, and attestation.
- Verify the current plan revision and read every accepted amendment before proceeding.
- Testing spreadsheet ID:
  1Dp5AMnrfSQ-Xf-r03S75lKsGPJk7o0inOgvC9Q6lOl4
- Spreadsheet access is read-only and bounded to the minimum data required to validate
  compatibility against P1's pinned sanitized manifest. Prefer the pinned P1 fixtures.
- Production spreadsheet is unset and every production mutation is forbidden.

If repository, plan, spreadsheet, or stage state differs, do not silently reinterpret
the task. Reconcile read-only evidence, record the difference, and continue only when
the P2 contract remains valid.

OBJECTIVE
Define and validate versioned Source, Scholarship, Application Group, Cycle, Evidence,
and Review Item models with deterministic identities and a lossless compatibility path
for every record and architecture in P1's pinned inventory.

ENTRY PREREQUISITES
- P1 is accepted and its immutable manifest/review attestation is present on
  `origin/main`.
- P1's candidate manifest is the pinned migration input and its digest validates.
- No other stage is active and no unreviewed plan or state divergence exists.
- No production spreadsheet is configured or authorized.

IN SCOPE
- Versioned schemas, stable identifier rules, allowed enums, and validation tooling.
- Explicit Source, Scholarship, Application Group, Cycle, Evidence, and Review Item
  relationships.
- Old-to-new field mapping and a read-only compatibility adapter for current data.
- Migration dry-run reports and sanitized fixtures covering every P1 taxonomy type.
- Tests proving deterministic identity, round-trip preservation, and no accidental
  shared-source deduplication.
- P2 documentation, evidence, tests, and local commits.

OUT OF SCOPE
- Any spreadsheet write, correction, archive, merge, or added scholarship.
- Full crawling or P3 acquisition/classifier implementation.
- Accuracy remediation, public API or UI behavior changes, and production migration.
- Deployment configuration, push, merge, form submission, applicant data, or provider
  contact without separate explicit authority.

INVARIANTS
- Execute P2 only; do not begin P3.
- Preserve parent sources, child awards, shared applications, annual cycles, field-level
  evidence, and review state as distinct concepts.
- One URL may support multiple awards; one award may have multiple cycles.
- Preserve query or fragment identity where P1 marks it potentially meaningful.
- Preserve explicit unknowns; do not invent facts or silently drop records, links,
  children, methods, evidence, or conflicts.
- Never collect, submit, log, or commit applicant PII or credentials.
- Do not mutate either scholarship spreadsheet or configure production data.

REQUIRED FIXTURES AND DRY RUN
- Single award.
- NFU-style multiple children with a unified application.
- Horatio-style common-application exceptions.
- Reach Higher matching and supplements.
- FVCC pagination/directory structure.
- FIRST external results.
- ESA shared program.
- Document/PDF and Google Form sources.
- Institution umbrella and offline/automatic methods.
- Every explicit unknown and potentially identity-bearing query/fragment class in P1.

ACCEPTANCE TESTS
- The migration dry run accounts for every P1 record, source, URL role, architecture
  class, unknown, and shared-source group with no unexplained loss or duplicate.
- Every current student-facing field remains representable.
- Round-trip tests preserve links, parent/child relationships, application groups,
  cycle states, unknowns, and field-level evidence.
- Identifier generation is deterministic across repeated runs on the same input.
- `cd web && npm ci` passes.
- `cd web && npm run plan:check` passes.
- `cd web && npm run typecheck` passes.
- `cd web && npm test` passes.
- `cd web && npm run build` passes.
- `git diff --check` passes.
- A fresh-context read-only reviewer finds no unresolved critical/high data-loss or
  identity-ambiguity finding.

EVIDENCE REQUIRED
- Update docs/evidence/P2.md with input manifest digest, schema versions, identifier
  rules, mapping counts, dry-run reconciliation, fixture coverage, exact commands and
  results, and every unresolved unknown.
- Create deterministic machine-readable dry-run and compatibility evidence.
- Update docs/BUILD_STATE.json and docs/CURRENT_HANDOFF.md.
- Create the exact P3 kickoff without executing P3.

INDEPENDENT REVIEW
- Commit the complete P2 candidate before final review without the new P2
  manifest/review record.
- Freeze a manifest recording that candidate commit and the current verified
  `origin/main` baseline, covering their complete Git change set and hashing
  candidate-tree blobs.
- Use a genuinely fresh-context, read-only reviewer that did not author or edit P2.
- Give it the original objective, stage contract, baseline and candidate commits,
  candidate manifest, diff, validation evidence, P1 input digest, and known risks.
- The implementation agent repairs findings; the reviewer performs the recheck and
  never edits the candidate.
- Critical/high findings block acceptance. Disposition every medium/low finding with
  rationale, owner, and target.
- Add only the accepted P2 manifest and review record in the direct-child attestation
  commit. Preserve P0 and P1 attestations byte-for-byte and append no later commit
  before delivery.

AUTONOMOUS GIT DELIVERY — NO GIT QUESTIONS TO KELSEY
Follow AGENTS.md. Preserve dirty work with an isolated worktree, use a P2 `codex/`
branch, and commit only P2-owned changes locally. Before push, PR, or merge, inspect
downstream effects. Proceed only when BUILD_STATE contains direct, informed P2
authority with an evidence path for every resulting Vercel Preview/Production effect,
or a verified deployment-suppression mechanism covers the action. Never force-push,
rewrite history, discard user work, or bypass checks. A release-authority outage is a
blocker, not a Git-preference question.

STOP CONDITIONS
- P1's accepted marker, evidence, manifest, and review are not all present on the
  verified `origin/main` commit.
- P1's manifest digest or pinned inventory cannot be validated.
- Repository/plan authority has diverged or another stage is in flight.
- The work would require a spreadsheet write, product behavior change, P3 acquisition,
  production configuration, deployment change, form submission, or provider contact.
- Independent review retains a critical/high finding.

END-OF-STAGE OUTPUT
- Outcome and accepted scope.
- Exact verification and dry-run reconciliation results.
- Independent-review disposition.
- Files and data surfaces changed.
- Evidence and handoff paths.
- PR and merged commit, when separately authorized and available.
- Remaining blockers and unknowns.
- Next permitted stage and exact kickoff path.

Do not start P3 in this session.
```
