# P9 Kickoff — Production Migration, Deployment, and Closeout

Use this kickoff only in a fresh session after Plan Revision 7 is independently
accepted, attested, merged, and verified on live `origin/main`. This document prepares
P9; the authority and strict no-production-write boundary are recorded in
`docs/evidence/PLAN-REV7.md` and `docs/BUILD_STATE.json`.

```text
Execute P9 — Production migration, deployment, and closeout — only for
whitefishscholarship/program_code and only as the authorized read-only production-source
and application-configuration cutover.

AUTHORITATIVE READ ORDER
1. AGENTS.md
2. docs/SCHOLARSHIP_SYSTEM_BUILD_PLAN.md
3. docs/BUILD_STATE.json
4. docs/CURRENT_HANDOFF.md
5. docs/evidence/P8.md
6. docs/evidence/P8-manifest.json
7. docs/reviews/P8.json
8. docs/kickoffs/P9-PRODUCTION-MIGRATION.md
9. docs/evidence/PLAN-REV7.md
10. docs/evidence/PLAN-REV7-manifest.json
11. docs/reviews/PLAN-REV7.json
12. Accepted P5 backup/write receipts and P7/P8 public, monitoring, and rollback surfaces

STATE TO PIN BEFORE EDITING
- Fetch live origin/main without changing user work and prove the exact accepted P8
  direct-child attestation and accepted Plan Revision 7 attestation are present.
- Verify P0-P8 are accepted and delivered, with no unresolved critical/high finding.
- Pin exact production spreadsheet
  `1eWGMdavcEECUcY_-nZ9gR2nMTN7T7T6oipG5ql1LoIE`, the two authorized scholarship
  tabs/bounds, revision-9857 backups, and the exact read-only authority from build state.
- Verify the deployed runtime identity can read the exact production spreadsheet with
  minimum permissions, without logging credentials or changing sharing. Do not start P9
  until that evidence path is recorded in build state.
- Before P9 becomes active, reverify metadata-only that source revision remains `9857`
  and the two tab IDs, titles, and grid dimensions remain exact. If they do, re-read only
  the authorized bounds, rehash source and backups, and prove the source revision remains
  `9857` after those reads. Bind the runtime identity fingerprint, exact read-only OAuth
  scope, source/backup fingerprints, unchanged sharing, and zero observed writes to the
  validator-checked `docs/evidence/P9-entry.json` receipt before P9 becomes active.
- Any revision, dimension, title, ID, source-hash, backup-hash, or post-read revision
  mismatch is a stop condition. Do not widen a range or treat the existing backup as
  current; require a new directly authorized, independently reviewed amendment and
  current backup receipt.
- Deployment owner and rollback owner are Kelsey Stuart.

OBJECTIVE
Move the accepted application to a separate read-only production data-source
configuration, reconcile the mapped production source completely, deploy the recorded
commit, demonstrate configuration rollback, and close the program without mutating the
production spreadsheet.

IN SCOPE
- Only work expressly authorized after every P9 entry prerequisite is satisfied.
- Verify the two existing private native backups, perform a reviewed mapping/dry-run
  diff, create a configuration-cutover receipt and read-only post-cutover reconciliation,
  deploy/smoke, demonstrate application-configuration rollback, and complete the
  operator runbook, final architecture/data documentation, and closeout handoff.
- Use the authorized testing spreadsheet for writes only if an exact P9 testing target
  set is necessary and every build-state write gate passes. A testing write is not
  required merely because it is authorized.

OUT OF SCOPE
- Every production spreadsheet write, append, clear, format, metadata/permission change,
  rename, move, restore, or other mutation.
- Substituting the production ID into the existing write-capable `GOOGLE_SHEET_ID` path.
- Access to any production tab other than the two exact scholarship tabs/bounds in build
  state, including any form/intake or applicant surface.
- Applicant data, unrelated production data, silent schema changes, forms/application
  interaction, provider contact, paid/destructive actions outside the exact approved
  rollback plan, history rewriting, gate weakening, or scope expansion.

INVARIANTS
- P9 is the only stage. Do not infer authority from P8 acceptance or this document.
- The production spreadsheet is read-only without exception. Use a distinct production
  configuration and read-only API scope. Keep every write-capable path pinned to the
  testing ID or disable it.
- Review the dry-run diff before configuration cutover.
- Backups, exact revision, cutover receipt, read-only reconciliation, deployed commit,
  smoke evidence, and configuration rollback proof must remain bound and recoverable.
- After deployment smoke and again after the rollback proof, repeat the revision,
  authorized tab/grid, source hash, sharing, and zero-write checks. Bind them to the
  validator-checked `docs/evidence/P9-post-cutover.json` receipt. Both structured
  receipts must be present in and hash-bound by P9's accepted candidate manifest.
- Bind the Vercel rollback probe to `docs/evidence/P9-deployment.json`. Use an existing
  deployed runtime commit that descends from P9's exact baseline. The final candidate
  may add evidence/governance after that commit but may not change any runtime-affecting
  path. The validator must prove both commit objects, exact rollback-baseline equality,
  ancestry, and runtime equivalence. Capture distinct deployment/rollback IDs through
  the authenticated Vercel API, require health to report the corresponding exact commit,
  and compute distinct cutover/rollback hashes from the validator's canonical
  non-secret configuration descriptors. Arbitrary repeated digests are invalid.
- After the rollback-probe deployment commit, change no tracked `web/` file—including
  any catalog fixture imported by the API—and no tracked deployment-control path. Only
  the exact P9 evidence/governance closeout may differ before the final candidate.
- Preserve applicant privacy and every unknown/manual-review state.
- Keep the P8 monitoring schedule disabled.

ACCEPTANCE TESTS
- Run npm ci, plan validation, typecheck, complete tests, production build, security
  audit, root whitespace validation, production health/API/browser smoke, exact count
  reconciliation, required deterministic record sample, and rollback demonstration.
- Prove with negative tests that the production ID cannot reach any Sheets write call,
  the production client requests read-only scope, and testing-only/admin writes cannot
  target production.
- Independent fresh-context review retains no critical/high finding.

INDEPENDENT REVIEW
- Freeze the exact P9 candidate, generate the complete manifest, and obtain a fresh-
  context read-only review by an agent that did not author or edit P9.
- Critical/high findings block acceptance; disposition every medium/low finding.
- Add only the accepted manifest and review in the direct-child two-file attestation.

AUTONOMOUS GIT DELIVERY — NO GIT QUESTIONS TO KELSEY
- Follow AGENTS.md and the exact recorded production/deployment authority.
- Never force-push, rewrite history, bypass checks, or broaden production access.
- After merge, authenticate the exact Vercel Production deployment and deployed main
  commit, repeat health/API/browser and read-only source-fingerprint smoke, and publish
  the provider/run IDs in the governed PR delivery record before declaring the program
  complete.

STOP CONDITIONS
- P8 is not exactly accepted and delivered on live origin/main.
- Plan Revision 7 is not exactly accepted and delivered on live origin/main.
- Exact read-only production authority, authorized-tab backups, deployed-runtime read
  permission, reconciliation, deploy owner, or configuration-rollback prerequisites are
  incomplete.
- Any code, credential, environment variable, route, script, or operator step could
  mutate the production spreadsheet.
- The exact entry revision, tab/grid bounds, source/backup hashes, or unchanged
  post-read revision cannot be reverified.
- Work would expose applicant data, weaken a gate, or expand beyond exact authority.

END-OF-STAGE OUTPUT
- One PASS/BLOCKED/FAIL status, exact migration/deployment/rollback evidence, review,
  PR/merge commit, remaining unknowns, and program closeout state.
```
