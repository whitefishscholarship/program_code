# REV17 — authorized R2 repair kickoff

Read AGENTS, canonical plan, BUILD_STATE, CURRENT_HANDOFF, immutable REV15 evidence
and docs/evidence/PLAN-REV17.md in that order. Preserve original candidate/A15 and
source branches. Execute only this exact repair before resuming authorized REV16.

Independently review the policy checkpoint before implementation. Enforce the
exact state allowlist and pins. Repair the Git reader with a finite 16 MiB bound,
add fail-closed tests and the exact canonical continuation checks. Freeze all
implementation/evidence before full fresh review. Pre-attestation expects exactly
four remaining diagnostics; post-attestation zero. Use direct-child two-file A17.

Run npm ci, plan:check, typecheck, npm test, build, intake:check, p9:production:check,
node --import tsx scripts/p9-production-runtime.ts --require-build-trace and root
git diff --check. Store bounded outputs and synthetic browser/CSV/privacy results
inside r2-rev17-validation.json, preservation proof inside r2-rev17-preservation.json.
Do not overwrite prior browser evidence. Verify exact Preview/CI before non-squash
merge and exact Production afterward. Save post-freeze receipts in the PR.

After verified release, REV16 uses fresh delivered main, preserves REV15/17 records
and original reviewed runtime blobs, and independently reviews the union of
shared validator/test changes. Keep planRevision >=17. No scope or configuration
change and no workbook/research/later phase. Stop on any material gate failure.
