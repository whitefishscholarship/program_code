# P9 Kickoff — Production Migration, Deployment, and Closeout

Use this kickoff only in a fresh session after Plan Revision 8 and P8R are independently
accepted, attested, merged, and verified on live `origin/main`. This document prepares
P9; the production authority and strict no-production-write boundary remain recorded in
`docs/evidence/PLAN-REV7.md`, while the ordering and trusted-proof compatibility anchor
are recorded in `docs/evidence/PLAN-REV8.md` and `docs/BUILD_STATE.json`.

```text
Execute P9 — Production migration, deployment, and closeout — only for
whitefishscholarship/program_code and only as the authorized read-only production-source
and application-configuration cutover.

AUTHORITATIVE READ ORDER
1. AGENTS.md
2. docs/SCHOLARSHIP_SYSTEM_BUILD_PLAN.md
3. docs/BUILD_STATE.json
4. docs/CURRENT_HANDOFF.md
5. docs/evidence/P8R.md
6. docs/evidence/P8R-manifest.json
7. docs/reviews/P8R.json
8. docs/evidence/PLAN-REV8.md
9. docs/evidence/PLAN-REV8-manifest.json
10. docs/reviews/PLAN-REV8.json
11. docs/kickoffs/P9-PRODUCTION-MIGRATION.md
12. docs/evidence/PLAN-REV7.md and its accepted manifest/review
13. Accepted P5 backup/write receipts and P7/P8/P8R product, monitoring, and rollback surfaces

STATE TO PIN BEFORE EDITING
- Fetch live origin/main without changing user work and prove the exact accepted P8R
  direct-child attestation and accepted Plan Revisions 7 and 8 attestations are present.
- Verify P0-P8 and P8R are accepted and delivered, with no unresolved critical/high finding.
- Pin exact production spreadsheet
  `1eWGMdavcEECUcY_-nZ9gR2nMTN7T7T6oipG5ql1LoIE`, the two authorized scholarship
  tabs/bounds, revision-9857 backups, and the exact read-only authority from build state.
- Verify the exact deployed runtime principal without logging credentials. Require one
  direct, unexpired `reader` permission—not `writer`—on the production spreadsheet and
  prove that the authorized verifier can read both exact private backup spreadsheet
  IDs. If the backup verifier is a different identity, stop for a separately authorized,
  independently reviewed amendment that records that relationship. Do not change
  sharing in this execution or start P9 while either permission gate is false.
- Require the accepted `P9-IDENTITY-PINS` evidence, manifest, fresh independent review,
  and direct-child attestation to populate the exact runtime/backup principal, Vercel
  project/team, canonical student-facing Production-host, hosted-environment, and
  credential-provenance fingerprints together. Authenticate
  the protected `p9-production-verification` environment, approval policy,
  environment-scoped secret provenance, and required read-only provider/API
  capabilities. Mutable workflow inputs or secrets cannot select or prove these targets.
  Use the Revision 7 canonical derivations: exact provider IDs as UTF-8 text, lowercase
  hostname as UTF-8 text, exact environment name as UTF-8 text, and the complete strict
  non-secret runtime-identity descriptor as canonical JSON, all SHA-256. The environment
  name hash is identity binding, not protection-rule evidence.
- Before P9 becomes active, reverify metadata-only that source revision remains `9857`
  and the two tab IDs, titles, and grid dimensions remain exact. If they do, re-read only
  the authorized bounds, rehash source and backups, and prove the source revision remains
  `9857` after those reads. Bind the runtime identity fingerprint, exact read-only OAuth
  scope, source/backup fingerprints, unchanged sharing, and zero observed writes to the
  validator-checked `docs/evidence/P9-entry.json` receipt before P9 becomes active.
- Treat the two stored SHA-256 values as historical provenance only because their
  original serialization was not recorded. Freshly hash canonical JSON of each exact
  source and existing-backup `sheets[].data` payload using
  `google-sheets-v4-griddata-canonical-json-v1`; source and backup must match and the
  canonical source hash must remain identical through every phase.
- Produce the entry receipt only through the dormant protected-environment
  `.github/workflows/p9-evidence.yml` on delivered `main`. The exact receipt bytes must
  pass GitHub OIDC artifact-attestation verification for the repository, workflow,
  P9-baseline source digest, event, environment, and hosted-runner restriction. A
  connected user Drive account, screenshot, syntactically valid JSON, stored secret, or
  a successful Google read made directly by the CI runner is not deployed-application-
  path evidence.
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
  rollback-safe runtime commit that descends from P9's exact baseline. Deploy that same
  commit three times with distinct provider IDs: production-read cutover, accepted-P7
  static-catalog rollback, and restored production-read cutover. The final candidate
  may add evidence/governance after that runtime commit but may not change any
  runtime-affecting path. Never roll back to the legacy P9 baseline while production
  source configuration exists; that baseline retains write-capable surfaces.
- Invoke the trusted workflow in five observation-only modes: entry, cutover, rollback,
  restored-cutover, and finalize. Every run uses delivered default-branch proof code.
  Each successor verifies the exact predecessor artifact and GitHub OIDC attestation.
  The owner creates or switches each deployment before its corresponding phase proof;
  the phase proof must finish health/source reconciliation before the next deployment
  is created. Finalize only after all four phase proofs pass, and attest the exact
  `P9-entry.json`, `P9-deployment.json`, and `P9-post-cutover.json` bytes.
- Require the authenticated Vercel API and health to bind exact project/team
  fingerprints already pinned by accepted authority, the canonical Production hostname,
  target, READY state, provider Git SHA, deployment ID/host, fresh nonce, and the actual
  shared-loader runtime descriptor. Recompute observation and config digests. Do not
  accept arbitrary hashes, asserted booleans, or same-repository self-consistency as
  target identity.
- Cutover and restored-cutover health must return a nonce-bound application-read
  observation with the exact production ID, sole read-only Sheets scope, and exact two
  tabs/bounds/dimensions. Each digest must cover a domain-separated envelope containing
  the fresh runner nonce and complete normalized bounded GridData—not a stored source
  hash—and must match the trusted runner's independent computation. Return no cell
  values. Independently hash and AST-verify the exact deployed health/public routes and
  their one shared loader, including direct result dataflow, at the provider-reported
  runtime commit. Static rollback must return a null application-read observation.
- After the rollback-safe runtime commit, change no tracked `web/` file—including
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
  target production. Discover Google mutators with the required TypeScript-AST
  inventory and run every exact production-ID negative through the trusted secrets-free
  proof job; require zero client constructions and zero write calls.
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
- P8R is not exactly accepted and delivered on live origin/main.
- Plan Revisions 7 and 8 are not exactly accepted and delivered on live origin/main.
- Exact read-only production authority, authorized-tab backups, deployed-runtime read
  permission, direct Viewer ACL, backup readability, deployed application-read proof,
  reconciliation, deploy owner, or configuration-rollback prerequisites are incomplete.
- Exact Vercel project/team fingerprints and canonical Production hostname are not
  accepted and authority-pinned, or the protected environment/secret provenance cannot
  be authenticated.
- Any code, credential, environment variable, route, script, or operator step could
  mutate the production spreadsheet.
- Any required phase artifact/attestation is missing, a phase did not complete before
  the next deployment was created, or the trusted workflow differs from accepted
  the accepted Revision 8 trusted-proof anchor.
- The exact entry revision, tab/grid bounds, fresh canonical source/backup equality,
  cross-phase source hash, or unchanged
  post-read revision cannot be reverified.
- Work would expose applicant data, weaken a gate, or expand beyond exact authority.

END-OF-STAGE OUTPUT
- One PASS/BLOCKED/FAIL status, exact migration/deployment/rollback evidence, review,
  PR/merge commit, remaining unknowns, and program closeout state.
```
