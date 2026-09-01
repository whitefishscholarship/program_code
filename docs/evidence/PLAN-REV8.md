# Plan Revision 8 Evidence — Interview Restoration Governance

Date: 2026-09-01  
Stage: `PLAN-REV8`  
Baseline: `781b62bf5fe2e6d8b9524e77d03a1ca4841a8b92`  
Status: candidate pending verification, independent review, and attestation

## Objective and authority

The user directed Codex to restore the student interview safely. Codex explained that
the repository requires a governance amendment before product work and that both the
amendment and later restoration stage would use branch push, pull request, merge, and
resulting Vercel Preview and Production deployments. The user replied, “yes,
authorized.” This authorizes delivery of Plan Revision 8 and, only after Revision 8 is
accepted and delivered, the separately governed P8R stage and its stated deployment
effects.

This authority excludes all spreadsheet access or writes, P9, production-source or
deployment-configuration changes, monitoring activation, form/application interaction,
applicant-data collection, persistence or transmission of interview answers, analytics,
provider contact, paid/destructive actions, gate weakening, history rewriting, and scope
expansion.

## Observed baseline and problem

- A securely authenticated normal-Git fetch resolved live `origin/main` to the exact
  baseline above before the isolated worktree was created.
- Historical commit `a2567d6395c1a946b0a0df8f50a47a5372928a80` replaced the former
  interview-driven homepage with `ScholarshipBrowser`.
- The current build retains legacy interview components and a legacy processor, but the
  homepage no longer invokes them.
- The accepted current API exposes the canonical `catalog` and a legacy compatibility
  `data` payload. The legacy processor uses defaults and text heuristics that are not a
  safe eligibility source of truth.

These observations justify a new product stage; they do not authorize product changes
inside this amendment.

## Revision 8 controls

Revision 8:

- inserts planned P8R after accepted P8 and before planned P9;
- makes P8R the next permitted stage while leaving P9 planned and unstarted;
- requires interview answers to remain in volatile browser memory;
- allows hard exclusion only from typed accepted public facts;
- keeps unknown or free-text-only eligibility as possible with visible reasons;
- requires integration with the accepted P7 catalog/cards/filter/sort/export rather than
  a wholesale revert;
- requires precommitted unit, privacy, regression, accessibility, and three-viewport
  browser matrices;
- preserves the disabled P8 schedule and all Revision 7 read-only P9 boundaries; and
- advances the immutable P9 trusted-proof code anchor only for the exact Revision 8
  compatibility changes, without weakening any P9 evidence or no-write rule.

## Candidate paths

The Revision 8 candidate is limited to governance, handoff/kickoff/evidence, validator
and deterministic validator tests. It contains no student-facing runtime implementation
and no dependency, lockfile, deployment-configuration, workflow, spreadsheet, or data
change.

## Verification record

Pre-freeze verification at `2026-09-01T19:49:08Z`:

- `npm ci`: PASS; 462 packages installed, 0 vulnerabilities reported.
- `npm run typecheck`: PASS.
- Complete `npm test` command through the `tsx` CLI: environment BLOCKED before the
  first test because this sandbox prohibits the CLI's IPC socket. The exact test list
  was rerun with each `tsx` invocation replaced by the repository-supported
  `node --import tsx` loader: PASS, including all P0-P8, governance-history, P9
  authority/evidence/trusted-proof, catalog, privacy, and recovery tests.
- Focused Revision 8 lifecycle and P9 trusted-proof-anchor tests: PASS.
- `npm run build`: first attempt BLOCKED by sandboxed Google Fonts network access; the
  approved retry fetched fonts but Turbopack was BLOCKED by its internal port-binding
  restriction. Equivalent `npx next build --webpack`: PASS with all routes built. The
  existing middleware deprecation and Edge `process.cwd` warnings remain warnings.
- `git diff --check`: PASS.
- `node --import tsx scripts/validate-build-plan.ts`: pre-attestation result contains
  only the three expected amendment gates: missing Revision 8 manifest, missing Review,
  and no committed direct-child attestation. It will be rerun at the attestation tip.

The candidate commit and manifest digest will be bound in the immutable manifest; the
review outcome will be bound in the review record; and delivery/CI/deployment-status
observations belong in the governed pull-request delivery record. A green test proves
only the checked repository behavior; it does not prove scholarship facts are current
or that a deployment is application-healthy.

## Stop boundary

Do not begin P8R until this amendment is independently accepted, direct-child attested,
merged, and verified on live `origin/main`. Do not begin P9 during this execution.
