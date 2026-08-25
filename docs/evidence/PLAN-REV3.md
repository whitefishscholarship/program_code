# Plan Revision 3 Evidence — Historical Delivery-State Validation

Status: candidate ready for freeze and hash-bound independent review
Date: 2026-08-24
Baseline commit: `be6644f5140c35de2075fa24782f81bf0449f0f6`
Branch: `codex/plan-rev3-future-stage-state`

## Objective

Fix the validator defect that compared P1's mechanically derived delivery-integration
state with the evolving current `docs/BUILD_STATE.json`. Preserve P1 candidate
`92ee21095e959bd19ab641752308c0fd9b394b22`, attestation
`20476b8384cfbda6aaa04a3da4b7f0a3fbd291e5`, delivery candidate
`464eece0c05c97e014cca0955f0ab92998c1d97c`, and delivery attestation
`e4541a9b845758309031f00cd1958c96b4de4a27` byte-for-byte while allowing later stages
to evolve machine state through their existing reviewed contracts.

## Observed defect

- On the clean delivered baseline, `npm run plan:check` passed.
- The local P2 worktree then made the ordinary P2 transition from planned to
  implemented, set the verified P2 baseline, added a P2 delivery blocker, and advanced
  the active-stage pointer.
- The validator reconstructed the exact expected P1 delivery state from the delivered
  Plan Revision 2 baseline and preserved P1 candidate, but compared that historical
  result with the current P2 state.
- It therefore reported `P1 delivery BUILD_STATE contains changes outside the exact
  stage-state transition`. The error made any legitimate later stage state impossible.

## Revision 3 mechanism

1. Read the existing attested P1 delivery manifest and its immutable
   `candidateCommit`.
2. Read `docs/BUILD_STATE.json` from that candidate commit in Git history.
3. Compare that historical blob with the same mechanically derived pending-to-accepted
   P1 integration transition used by Revision 2.
4. Continue comparing P1's current authority entry and immutable integration identity,
   paths, preserved blobs, topology, manifest, review, and attestation exactly as before.
5. Do not compare the original P1 transition with the later current stage state.
6. Run a regression test against the actual preserved P1 history. It must accept the
   exact delivery-candidate blob, reject using the Revision 3 current state as the
   historical proof, and reject a mutated historical blob.
7. Discover every historically accepted delivery integration from the current Git
   history and require the current state to retain its entire record exactly. Reject
   deletion, downgrade to pending, or rebinding before iterating current integrations.
8. Validate the canonical plan's exact revision header against `BUILD_STATE` and test
   that agreement directly.

Revision 3 is recorded as `attestation-gated`. The record does not self-certify
acceptance: only the exact manifest-bound fresh-context review and direct-child
two-file attestation can satisfy the validator.

## Authorization and exclusions

Kelsey Stuart explicitly authorized this Plan Revision 3 amendment, its commits,
independent review, branch push, pull request, merge, and resulting Vercel Preview and
Production deployments. After that delivery, Kelsey authorized local P2 implementation
and independent review.

This authority does not authorize P2 push, pull request, merge, Preview or Production
deployment; any spreadsheet write; any product change; any deployment-configuration
change; any form submission; or any provider contact. This amendment changes only
governance, validation, tests, and documentation. The separate dirty P2 worktree remains
paused and untouched until Revision 3 is delivered.

## Candidate files

- `AGENTS.md`
- `docs/SCHOLARSHIP_SYSTEM_BUILD_PLAN.md`
- `docs/BUILD_STATE.json`
- `docs/CURRENT_HANDOFF.md`
- `docs/DECISIONS.md`
- `docs/evidence/PLAN-REV3.md`
- `docs/kickoffs/P2-DATA-MODEL.md`
- `web/package.json`
- `web/scripts/delivery-state-history.ts`
- `web/scripts/test-delivery-state-history.ts`
- `web/scripts/validate-build-plan.ts`

The candidate intentionally excludes `docs/evidence/PLAN-REV3-manifest.json` and
`docs/reviews/PLAN-REV3.json`. Those two paths are added only in the direct-child
attestation after a fresh-context read-only reviewer accepts the frozen candidate.

## Verification

Pre-freeze verification completed through `2026-08-25T01:02:20Z`. The only subsequent
candidate changes are this durable result record and the matching handoff record.

- `npm ci` from `web/` passed from `2026-08-25T01:00:52Z` through
  `2026-08-25T01:01:00Z`; 565 locked packages were installed. The time-sensitive audit
  reported the existing 21 findings (1 low, 7 moderate, 12 high, 1 critical). No
  package or lockfile changed and no audit fix was applied.
- `npm run typecheck` from `web/` passed from `2026-08-25T01:01:05Z` through
  `2026-08-25T01:01:09Z`.
- `npm test` from `web/` passed from `2026-08-25T01:01:09Z` through
  `2026-08-25T01:01:11Z`. The existing P1 digest remained
  `dc373a09d062ae6e5e03347ab391291ecc3dea427f90a21132e89cad113393e2`.
  The new history regression reported `delivery state history: PASS (1 accepted
  integration)` and exercised exact-history acceptance, current-state divergence, and
  historical-mutation rejection.
- The restricted `npm run build` from `web/` failed from `2026-08-25T01:01:17Z`
  through `2026-08-25T01:01:36Z` only because the existing Geist Google Fonts could
  not be fetched. The authorized network-enabled retry passed from
  `2026-08-25T01:01:42Z` through `2026-08-25T01:02:00Z`, producing all routes. Existing
  missing Google service-account and sheet environment notices remained non-fatal; no
  configuration changed.
- Prospective `npm run plan:check` from `web/` ran from `2026-08-25T01:02:11Z`
  through `2026-08-25T01:02:20Z` and reported exactly the three intentional
  pre-attestation failures: missing Revision 3 manifest, missing Revision 3 review, and
  missing committed Revision 3 attestation. It reported no P1 historical-transition
  error and no other validation error.
- `git diff --check` from the repository root passed at
  `2026-08-25T01:02:20Z`.

Repository state observed at `2026-08-25T01:02:20Z`:

- `HEAD` and `origin/main` were both exact
  `be6644f5140c35de2075fa24782f81bf0449f0f6` before the candidate commit.
- The branch was `codex/plan-rev3-future-stage-state`, based directly on that verified
  baseline, with no published Revision 3 branch or pull request.
- Dirty paths were exactly the 11 candidate files listed above; the manifest and review
  were absent as required before freeze.
- The separate P2 worktree remained dirty and untouched. No spreadsheet, product,
  deployment-configuration, form, or provider effect occurred.

## Independent-review remediation history

The fresh-context reviewer rejected predecessor candidate
`5913beef4f6654bcc926925688992d7cc2598e8b` at `2026-08-25T01:10:58Z` with critical 0,
high 2, medium 0, low 0. The complete manifest and all 11 hashes were correct, and all
P1 objects and attested blobs were preserved. The two high findings were:

1. A later current state could remove or downgrade the accepted P1 integration, causing
   the validator and original regression test to iterate zero accepted records and skip
   every historical check.
2. The canonical plan header still said Revision 2, and the validator checked only the
   handoff/state revision agreement.

The replacement candidate discovers accepted integrations from Git history, enforces
exact current retention, adds deletion/downgrade/rebind regression cases, updates the
plan header to Revision 3, and validates/tests exact plan/state revision agreement. The
same reviewer must recheck the frozen replacement candidate; this evidence does not
self-certify the remediation.

Post-review remediation verification completed through `2026-08-25T01:15:15Z`:

- `npm run typecheck` and the complete `npm test` suite passed from
  `2026-08-25T01:14:28Z` through `2026-08-25T01:14:34Z`. The focused output was
  `delivery state history: PASS (1 accepted integration; deletion/downgrade/rebind
  rejected)`. It also asserts exact canonical-plan/state revision agreement.
- The network-enabled `npm run build` passed from `2026-08-25T01:14:40Z` through
  `2026-08-25T01:14:58Z`; it produced all routes, retained only the existing non-fatal
  missing Google credential/sheet notices, and changed no configuration.
- Prospective `npm run plan:check` ran from `2026-08-25T01:15:09Z` through
  `2026-08-25T01:15:15Z` and reported exactly two expected errors: the absent Revision
  3 review and absent committed attestation. The rejected predecessor's uncommitted
  manifest was still present for this check and will be regenerated against the frozen
  replacement candidate. No historical-integration or plan-revision error remained.
- `git diff --check` passed at `2026-08-25T01:15:15Z`.

## Rollback

Before a later stage is accepted, revert the Revision 3 amendment. After later stage
state depends on Revision 3, use another independently reviewed plan amendment. Never
rewrite or replace any preserved P1 candidate, manifest, review, or attestation.
