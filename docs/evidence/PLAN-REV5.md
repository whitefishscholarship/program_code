# Plan Revision 5 Evidence — Durable Operating Mandate and Latest-State Regression

Status: candidate pending freeze, hash-bound independent review, and attestation
Date: 2026-08-25
Baseline commit: `08cb6809425036991400b539ca23a34915b3fe26`
Branch: `codex/plan-rev5-standing-mandate`

## Objectives

1. Correct the Revision 3 history regression test so it accepts the valid case where
   the newest delivery candidate is also the current `BUILD_STATE`, while preserving or
   strengthening every historical non-regression check.
2. Record Kelsey's informed standing mandate for bounded autonomous P3-P8 execution,
   independent review, Git delivery, and resulting Vercel effects, with consequential
   actions kept explicitly reserved.
3. Deliver Revision 5 first, then rebuild the exact P2 integration from the new verified
   `origin/main` without changing P2 candidate
   `1a6376207eb467ff0977298de16a1c0d0db1b3cd` or attestation
   `cc277b34075f6d648ff3c71022fadf6a6c632b34`.

## Observed regression

Revision 4 was independently accepted, attested, and merged through PR #12 at
`08cb6809425036991400b539ca23a34915b3fe26`. Main CI and Vercel Production passed;
the Vercel Preview attempt was blocked by the existing author-access rule and no
configuration changed.

The first unpublished P2 integration attempt produced exact two-parent commit
`6ff2acb83c75c254f559192ebdd23bc75eb4e10e` with first parent `08cb680` and second
parent exact `cc277b3`. Its `BUILD_STATE` matched the mechanical pending-to-accepted P2
transition exactly and all ten non-governance P2 candidate blobs matched the immutable
attestation. `npm run p2:model:check` passed with canonical digest
`dcbc9a28b093d1f32ec149d7c37b20606ea3108eaa3bdcea1ecc76474cd2d295`, typecheck
passed, and prospective plan validation reported only the expected absent delivery
review/attestation gates after a provisional manifest was present.

The full test suite then failed at
`web/scripts/test-delivery-state-history.ts` because line 119 required
`isExactHistoricalDeliveryState(currentState, ...)` to be false for every accepted
integration. That inequality is valid for older P1 after later state evolves, but false
for the newest P2 integration because its exact delivery state correctly is the current
state. The production validator does not contain this defect: it validates the immutable
manifest candidate, and prospective plan validation accepted the P2 state transition.

The preliminary P2 integration branch was never pushed, reviewed, attested, opened as
a pull request, merged, or deployed. It remains isolated evidence only and will be
rebuilt cleanly after Revision 5 delivery.

## Regression correction

The revised test:

- rejects deletion, downgrade, and identity rebinding separately for every accepted
  integration rather than only the first record;
- proves non-integration current state can evolve while all accepted integration
  records remain exact;
- constructs the pending P2 prospective delivery state and proves the newest exact
  delivery may also equal current state;
- continues to reconstruct and validate every immutable historical delivery candidate;
  and
- continues to reject mutation of every historical candidate.

No delivery-history validation logic or acceptance criterion is relaxed. The regression
change corrects only the invalid universal inequality and adds stronger
multi-integration coverage. The plan validator separately requires every P3-P8 standing
authorization to remain enabled and bound to the exact mandate evidence path.

## Standing mandate and boundaries

`docs/evidence/STANDING-OPERATING-MANDATE.md` is the direct authority record. Revision 5
adds individual machine-validated P3-P8 delivery authorization entries bound to it and
updates the operating contract and canonical plan. The mandate authorizes only ordered,
stage-scoped work that passes every existing gate. It reserves spreadsheet writes,
production/P9, deployment-configuration or schedule changes, paid/destructive actions,
secrets, forms/application interactions, provider contact, force-push/history rewrite,
gate weakening, and scope expansion for new direct authority.

Revision 5 itself and the later exact P2 delivery are explicitly authorized for local
commits, independent review, push, pull request, merge, and resulting Vercel Preview and
Production deployments.

## Candidate paths

- `AGENTS.md`
- `docs/SCHOLARSHIP_SYSTEM_BUILD_PLAN.md`
- `docs/BUILD_STATE.json`
- `docs/CURRENT_HANDOFF.md`
- `docs/DECISIONS.md`
- `docs/evidence/STANDING-OPERATING-MANDATE.md`
- `docs/evidence/PLAN-REV5.md`
- `web/scripts/test-delivery-state-history.ts`
- `web/scripts/validate-build-plan.ts`

The candidate intentionally excludes `docs/evidence/PLAN-REV5-manifest.json` and
`docs/reviews/PLAN-REV5.json`. Those two paths may be added only in the exact
candidate's direct-child attestation after fresh-context read-only acceptance.

## Verification

Pre-freeze verification completed through `2026-08-25T21:59:46Z`. The only subsequent
candidate changes are this durable result record and the matching handoff record.

- `npm ci` from `web/` passed from `2026-08-25T21:55:04Z` through
  `2026-08-25T21:55:11Z`; 565 locked packages were installed. The unchanged,
  time-sensitive audit reported 21 findings (1 low, 7 moderate, 12 high, 1 critical).
  No dependency, package metadata, or lockfile changed and no audit fix was applied.
- Focused `test-delivery-state-history.ts` passed before the final matrix. It exercised
  a two-integration non-regression fixture even though current delivered history has
  only P1 accepted and P2 pending.
- `npm run typecheck` and the complete `npm test` suite passed from
  `2026-08-25T21:56:19Z` through `2026-08-25T21:56:32Z`. The suite reported exact P1
  digest `dc373a09d062ae6e5e03347ab391291ecc3dea427f90a21132e89cad113393e2`
  and `delivery state history: PASS (1 accepted integration; every
  deletion/downgrade/rebind rejected; latest equality and later evolution allowed)`.
- Prospective `npm run plan:check` completed in that same window and reported exactly
  three expected pre-attestation errors: missing Revision 5 manifest, missing Revision
  5 review, and missing committed Revision 5 attestation. No other plan error appeared.
- The restricted `npm run build` attempt from `2026-08-25T21:56:37Z` through
  `2026-08-25T21:56:56Z` failed only because the existing Geist Google Fonts could not
  be fetched. The authorized network-enabled retry passed from
  `2026-08-25T21:57:02Z` through `2026-08-25T21:57:21Z`, produced every existing route,
  and changed no configuration. Existing missing Google service-account and sheet
  environment notices remained non-fatal.
- `git diff --check` passed at `2026-08-25T21:57:29Z` and again after the final result
  record updates at `2026-08-25T22:00:12Z`.
- After adding the final validator guard that requires all six standing stage
  authorizations to remain enabled and bound to the exact evidence path, typecheck, the
  full test suite, and prospective plan validation were rerun from
  `2026-08-25T21:59:08Z` through `2026-08-25T21:59:22Z` with the same pass/expected
  three-gate outcomes. The network-enabled production build passed again from
  `2026-08-25T21:59:29Z` through `2026-08-25T21:59:46Z`.

Repository state observed at `2026-08-25T22:00:12Z`:

- `HEAD` and `origin/main` were exact
  `08cb6809425036991400b539ca23a34915b3fe26`.
- Exactly nine Revision 5 paths were dirty: seven tracked governance/validator/test
  paths and two new evidence paths. No product/runtime, dependency, lockfile, CI, deployment,
  spreadsheet, P2 artifact, manifest, or review path was present in the change set.
- No remote `origin/codex/plan-rev5-standing-mandate` branch existed.
- Exact P2 candidate `1a6376207eb467ff0977298de16a1c0d0db1b3cd` and attestation
  `cc277b34075f6d648ff3c71022fadf6a6c632b34` remained available and unchanged.

## Side effects and rollback

Revision 5 changes governance, one regression test, evidence, and handoff only. It does
not access or mutate a spreadsheet, fetch a scholarship source, alter product/runtime
behavior, change dependencies or lockfiles, modify CI/deployment configuration, enter a
form or application, contact a provider, or start P3.

Before dependent delivery, Revision 5 can be reverted only through the ordinary
reviewed amendment process. After P2 or a later stage relies on it, rollback requires a
new independently reviewed amendment and must preserve every accepted historical object.
