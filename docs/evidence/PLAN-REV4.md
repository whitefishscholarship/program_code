# Plan Revision 4 Evidence — Exact P2 Delivery Path

Status: candidate pending freeze, hash-bound independent review, and attestation
Date: 2026-08-25
Baseline commit: `6a6d64339d44cbede99acfd5a3966781f1f9c4f6`
Branch: `codex/plan-rev4-p2-delivery`

## Objective

Create a reviewed delivery path for exact accepted P2 candidate
`1a6376207eb467ff0977298de16a1c0d0db1b3cd` and canonical direct-child attestation
`cc277b34075f6d648ff3c71022fadf6a6c632b34` without changing either object. Deliver
this amendment first. Then deliver P2 through a separate independently reviewed,
hash-bound integration whose first parent is the delivered Revision 4 `origin/main`
and whose second parent is exact `cc277b3`.

## Why an amendment is required

The accepted P2 attestation records the authority state that existed when P2 was frozen:
local acceptance only, with no push, pull request, merge, Preview, or Production
authority. Repository governance correctly prohibits appending delivery authority after
an undelivered attestation. Later informed authority therefore cannot be written onto the
P2 branch or used to rebind its historical manifest.

Revision 2 introduced a narrow integration mechanism and Revision 3 made its historical
validation durable as later state evolves. Revision 4 enables that existing mechanism
for P2 only. No validator, product, dependency, CI, or deployment-configuration change
is required.

## Exact identity and authority

- Original P2 baseline: `6a6d64339d44cbede99acfd5a3966781f1f9c4f6`
- P2 candidate: `1a6376207eb467ff0977298de16a1c0d0db1b3cd`
- P2 attestation: `cc277b34075f6d648ff3c71022fadf6a6c632b34`
- P2 manifest SHA-256:
  `4d47d562e26efe249f6a7be0ed656f1fddc1a17233378254772019cacd49ee8a`
- Direct authority evidence: `docs/evidence/P2-delivery-authorization.md`
- Future integration manifest: `docs/evidence/P2-delivery-manifest.json`
- Future integration review: `docs/reviews/P2-delivery.json`
- Permitted merge-resolution paths: `docs/BUILD_STATE.json` and
  `docs/CURRENT_HANDOFF.md`

Kelsey Stuart explicitly authorized Revision 4's commits, independent review, branch
push, pull request, merge, and resulting Vercel Preview and Production deployments.
After Revision 4 delivery, Kelsey explicitly authorized the exact P2 integration's
push, pull request, merge, and resulting Preview and Production deployments.

## Amendment changes

1. Advance the canonical plan and `BUILD_STATE` to Revision 4.
2. Clarify that the delivery-integration mechanism is per-stage and must be enabled by
   a reviewed amendment pinning exact objects and direct informed authority.
3. Add the exact P2 delivery authorization and an `authorized-pending` P2 integration.
4. Preserve every P0, P1, Revision 2, Revision 3, and P2 object unchanged.
5. Record the current delivery sequence and exclusions in evidence, decision log, and
   handoff.

Revision 4 is `attestation-gated`; its state record does not self-declare acceptance.
Its implementation candidate must be frozen, completely manifested, independently
reviewed, and followed by a direct-child commit changing exactly
`docs/evidence/PLAN-REV4-manifest.json` and `docs/reviews/PLAN-REV4.json`.

## Verification

Pre-freeze verification completed through `2026-08-25T17:06:16Z`. The only subsequent
candidate changes are this durable result record and the matching handoff record.

- `npm ci` from `web/` passed from `2026-08-25T17:05:11Z` through
  `2026-08-25T17:05:20Z`; 565 locked packages were installed. The unchanged,
  time-sensitive audit reported 21 findings (1 low, 7 moderate, 12 high, 1 critical).
  No dependency, package metadata, or lockfile changed and no audit fix was applied.
- `npm run typecheck` passed within the `2026-08-25T17:05:20Z` through
  `2026-08-25T17:05:41Z` verification window.
- The complete `npm test` suite passed in that same window, including P1 digest
  `dc373a09d062ae6e5e03347ab391291ecc3dea427f90a21132e89cad113393e2`
  and `delivery state history: PASS (1 accepted integration;
  deletion/downgrade/rebind rejected)`.
- The first restricted prospective `npm run plan:check` attempt failed before
  validation because `tsx` could not create its local IPC socket (`EPERM`). The
  permitted retry completed within the same verification window and reported exactly
  three expected pre-attestation errors: missing Revision 4 manifest, missing Revision
  4 review, and missing committed Revision 4 attestation. No other plan error appeared.
- The restricted `npm run build` attempt from `2026-08-25T17:04:05Z` through
  `2026-08-25T17:04:25Z` failed only because the existing Geist Google Fonts could not
  be fetched. The authorized network-enabled build passed from
  `2026-08-25T17:05:48Z` through `2026-08-25T17:06:11Z`, produced every existing
  route, and changed no configuration. Existing missing Google service-account and
  sheet environment notices remained non-fatal.
- `git diff --check` passed at `2026-08-25T17:06:16Z`.

Repository state observed at `2026-08-25T17:06:16Z`:

- `HEAD` and `origin/main` were exact
  `6a6d64339d44cbede99acfd5a3966781f1f9c4f6`.
- Exactly seven Revision 4 paths were dirty: five tracked governance/documentation
  paths and two new evidence paths. No product, dependency, CI, deployment,
  spreadsheet, P2 implementation, manifest, or review path was present in the diff.
- No remote `origin/codex/plan-rev4-p2-delivery` branch existed.
- The future Revision 4 manifest and review were absent as required before freeze.

## Delivery sequence after Revision 4

1. Push only the accepted Revision 4 attestation tip, open its pull request, verify CI
   and Vercel effects, merge under repository policy, and verify delivered `main`.
2. Create a clean P2 delivery-integration branch from that exact `origin/main`.
3. Produce a two-parent integration candidate with the delivered Revision 4 commit as
   first parent and exact P2 attestation `cc277b3` as second parent.
4. Permit only `BUILD_STATE` and `CURRENT_HANDOFF` to reconcile the historical stage
   state with the delivered baseline. Preserve every other P2 candidate and attestation
   blob exactly.
5. Run all required checks, generate a complete delivery manifest, obtain a separate
   fresh-context read-only acceptance review, and add only the delivery manifest/review
   in the direct-child attestation.
6. Push, open the P2 delivery pull request, verify CI and Vercel effects, merge, and
   verify delivered `main`.

## Boundaries and rollback

This amendment and delivery path authorize no P3 implementation, spreadsheet access or
write, product or deployment-configuration change, form submission, application
interaction, or provider contact. Production spreadsheet identity remains unset and
production mutation remains unauthorized.

Before P2 delivery, Revision 4 may be reverted only through the ordinary reviewed
governance process. After P2 depends on it, rollback requires another independently
reviewed amendment and must never rewrite or replace any preserved P2 object.
