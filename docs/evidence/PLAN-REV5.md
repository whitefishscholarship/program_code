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
multi-integration coverage. The plan validator separately discovers historically
attested plan amendments from Git history, forbids revision rollback or canonical-record
removal/change, and binds every field of each P3-P8 standing authorization plus the
mandate evidence blob to the immutable Revision 5 candidate after attestation.

## Preliminary independent review and remediation

Fresh-context reviewer `/root/plan_rev5_independent_review` rejected preliminary
candidate `4f034bb5eaedb64c16f76665aaf6057c2565416c` at
`2026-08-25T22:09:15Z` with counts C0/H1/M0/L0. The reviewed manifest SHA-256 was
`3117106480d56f436d9f2a7e89284a600545f0b03cf1f55592a5a36daff52ca9`.
The sole high finding was that a later state could roll `planRevision` back below 5,
remove `PLAN-REV5`, delete or alter a standing authorization, or mutate the mandate
evidence and thereby switch off the original presence-only guard.

The replacement implementation adds independent historical-attestation discovery,
exact amendment-record retention, maximum-revision non-regression, immutable binding
of every P3-P8 authorization field and the mandate evidence blob to the attested
Revision 5 candidate, and regression cases for revision rollback, PLAN-REV5 removal,
deletion and mutation of every field for all six stages, P5's separate-write condition,
P8's deployment-config/schedule exclusion, and evidence mutation. Revision 5 exposes
no revocation path; a future revocation or supersession requires separately informed
authority and a new reviewed machine-recorded mechanism.

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
- `web/scripts/governance-history.ts`
- `web/scripts/test-governance-history.ts`
- `web/scripts/validate-build-plan.ts`
- `web/package.json`

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

Replacement verification after the preliminary rejection:

- `npm run typecheck -- --incremental false`, the complete `npm test`, and prospective
  `npm run plan:check` ran from `2026-08-25T22:16:30Z` through
  `2026-08-25T22:16:54Z`. Typecheck and the full suite passed. The new suite result was
  `governance history: PASS (revision/amendment rollback, every P3-P8 field, P5/P8
  exclusions, and evidence mutation rejected)`. Delivery-history regression coverage
  also remained green. Prospective plan validation reported exactly the two expected
  post-manifest/pre-attestation errors: missing Revision 5 review and missing committed
  Revision 5 attestation.
- The network-enabled `npm run build` passed from `2026-08-25T22:16:00Z` through
  `2026-08-25T22:16:26Z`, including TypeScript and every existing route. The unchanged
  missing Google service-account and sheet environment notices remained non-fatal.
- `git diff --check` passed at `2026-08-25T22:16:26Z`. The replacement change set has
  exactly twelve candidate paths: the original nine plus `web/package.json`,
  `web/scripts/governance-history.ts`, and
  `web/scripts/test-governance-history.ts`. The only non-candidate path is the
  uncommitted manifest, which will be regenerated against the frozen replacement SHA.

## First delivery attempt and clean-clone remediation

The same independent reviewer accepted exact candidate
`17dd49f2e2b2b96e628df802f2562479dcf435db` at
`2026-08-25T22:21:36Z`, C0/H0/M0/L0, against manifest SHA-256
`399a168828783fcd0f9cb693e89d6bc1155e9fa5e120fd8a30874287b0b279b3`.
Its exact direct-child two-file attestation is
`ec1737670be24e23ada3f377eb75c34b1747898c`. Both commits were pushed unchanged on
`codex/plan-rev5-standing-mandate`, and PR #13 was opened. Vercel Preview was blocked
by the existing author-access rule. GitHub Actions run `32905946430` then failed
`npm test` at `2026-08-25T22:24:41Z`, so the PR was not merged.

The failure exposed a clean-clone portability defect in the new test, not a validator
or delivery-state defect. Local Git contained unpublished P2 candidate
`1a6376207eb467ff0977298de16a1c0d0db1b3cd`, so the prospective pending-integration
case loaded its `BUILD_STATE` directly. A clean GitHub runner correctly lacked that
unmerged object even with `fetch-depth: 0`, causing `git show` to exit 128 before the
assertion ran. The production validator already treats a pending, not-yet-reachable
stage object as unavailable and performs the exact candidate check once the two-parent
delivery integration makes it reachable.

The failed delivery attestation and PR branch remain byte-for-byte and will not be
amended, force-pushed, or merged. A clean replacement branch
`codex/plan-rev5-standing-mandate-ci` was created from exact `origin/main` `08cb680` and
replayed only the two pre-attestation candidate commits. The test now uses the exact
pending-stage object when available and otherwise constructs a deterministic accepted
stage-state fixture from current machine state. Both paths exercise the same
`expectedDeliveryCandidateState` and `isExactHistoricalDeliveryState` logic. Exact P2
candidate validation remains mandatory in the later two-parent integration, where the
object is necessarily reachable. No CI/deployment configuration or accepted historical
artifact changed.

Clean-clone replacement verification:

- `npm ci` installed the same 565 locked packages before the final matrix and reported
  the unchanged 21 audit findings (1 low, 7 moderate, 12 high, 1 critical). No audit
  fix, dependency, metadata, or lockfile change was made.
- `npm run typecheck -- --incremental false`, the complete `npm test`, and prospective
  `npm run plan:check` ran from `2026-08-25T22:28:18Z` through
  `2026-08-25T22:28:39Z`. Typecheck and all tests passed. The portable clean-clone
  latest-state fixture is always exercised; the exact locally reachable P2 candidate
  path also passed. Plan validation reported exactly the three expected pre-manifest
  errors: missing manifest, missing review, and missing committed attestation.
- The network-enabled `npm run build` passed through `2026-08-25T22:29:08Z`, including
  TypeScript and every existing route. Existing missing Google service-account and
  sheet environment notices remained non-fatal.
- `git diff --check` passed at `2026-08-25T22:29:08Z`. Only the test, this evidence,
  and the handoff differed from the replayed pre-attestation candidate at that time.
  The complete baseline-to-candidate set remains the same twelve authorized paths.

Repository state observed at `2026-08-25T22:00:12Z`:

- `HEAD` and `origin/main` were exact
  `08cb6809425036991400b539ca23a34915b3fe26`.
- The preliminary candidate had exactly nine Revision 5 paths dirty: seven tracked governance/validator/test
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
