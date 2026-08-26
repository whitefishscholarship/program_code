# Plan Revision 6 Evidence — Exact P2 Package-Script Resolution

Status: candidate pending freeze, manifest-bound independent review, and attestation
Date: 2026-08-26
Baseline commit: `cc7760d51f1460728e85a9b1fc0921d30320a541`
Branch: `codex/plan-rev6-p2-package-resolution`

## Objective

Make the already-authorized exact P2 two-parent integration executable without
changing P2 candidate `1a6376207eb467ff0977298de16a1c0d0db1b3cd`, attestation
`cc277b34075f6d648ff3c71022fadf6a6c632b34`, or any accepted Revision 5 artifact.
Add only `web/package.json` as P2's third governed resolution path and require its exact
mechanical result to preserve the complete delivered test harness while adding only
P2's exact model scripts and missing model-test command.

## Observed conflict

Revision 5 was independently accepted and delivered through PR #14. Its clean-clone
candidate is `a9b656b93cfa398a2badd1c1ef3f61f860979ac3`, its direct-child attestation is
`06d9e3ff4bcfff8b0fe0b2bc728ed8aeb9320000`, and the delivered merge is
`cc7760d51f1460728e85a9b1fc0921d30320a541`. PR CI and post-merge main CI passed.
Vercel Production completed; Preview was blocked by the existing commit-author project
access rule, and no configuration changed.

From a clean branch at exact `cc7760d`, `git merge --no-ff --no-commit cc277b3`
produced conflicts in:

- `docs/BUILD_STATE.json`;
- `docs/CURRENT_HANDOFF.md`; and
- `web/package.json`.

The first two are the already authorized governance resolution paths. The package
conflict is substantive: delivered Revision 5's package runs
`test-governance-history.ts`, while exact P2's package adds `p2:model`,
`p2:model:check`, and `test-p2-data-model.ts`. Taking either side removes an accepted
test. The merge was aborted before any commit. No invalid candidate, manifest, review,
attestation, push, PR, merge, or deployment was created.

## Direct informed authority

On 2026-08-26 Kelsey Stuart authorized Plan Revision 6 to add `web/package.json` as the
narrowly governed third P2 resolution path, preserve every Revision 5 test command,
and add only the exact P2 model scripts and test command from candidate `1a63762`.
Kelsey authorized Revision 6 commits, independent review, attestation, push, pull
request, merge, and resulting Vercel Preview and Production deployments, followed by
exact P2 delivery through attestation `cc277b3`.

The authority explicitly excludes P3, spreadsheet writes, P9 or production-data
actions, deployment-configuration changes, forms, provider contact, paid/destructive
actions, and history rewriting.

## Deterministic resolution rule

`web/scripts/delivery-package-history.ts` constructs the only valid integrated package:

1. deep-copy the complete delivered Revision 6 first-parent package;
2. preserve every baseline field, dependency, metadata value, script, and test command;
3. copy exact `p2:model` and `p2:model:check` values from the immutable P2 attestation;
4. append only P2 test commands not already present, preserving baseline command order;
5. compare the complete integrated JSON document by deep strict equality.

The delivery validator performs this reconstruction against the candidate named by the
future attested P2 delivery manifest. `web/scripts/test-delivery-package-history.ts`
proves the exact union passes and rejects removal of either governance or P2 tests,
mutation of a P2 model script, and unrelated dependency mutation. The P2 exception is
stage-specific and Plan-Revision-6-specific; P1 and every future integration retain the
ordinary two-path allowlist.

## Candidate scope

Expected candidate paths before freeze:

- `AGENTS.md`
- `docs/BUILD_STATE.json`
- `docs/CURRENT_HANDOFF.md`
- `docs/DECISIONS.md`
- `docs/SCHOLARSHIP_SYSTEM_BUILD_PLAN.md`
- `docs/evidence/PLAN-REV6.md`
- `web/package.json`
- `web/scripts/delivery-package-history.ts`
- `web/scripts/test-delivery-package-history.ts`
- `web/scripts/validate-build-plan.ts`

The candidate excludes `docs/evidence/PLAN-REV6-manifest.json` and
`docs/reviews/PLAN-REV6.json`; only a future direct-child attestation may add those two
paths after exact-candidate acceptance.

## Verification

Pre-freeze verification completed on 2026-08-26:

- `npm ci` ran from `2026-08-26T15:24:58Z` through
  `2026-08-26T15:25:16Z` and passed with 565 locked packages. The time-sensitive
  audit reported 21 findings (1 low, 7 moderate, 12 high, 1 critical); no dependency
  or lockfile was changed and no audit fix was run.
- `npm run typecheck -- --incremental false`, complete `npm test`, and prospective
  `npm run plan:check` ran from `2026-08-26T15:25:20Z` through
  `2026-08-26T15:25:49Z`. Typecheck and the complete suite passed, including the P1
  digest, accepted-delivery deletion/downgrade/rebind history, governance history,
  and the new exact package-history regression. Prospective plan validation reported
  exactly the three expected pre-attestation errors: missing Revision 6 manifest,
  missing Revision 6 review, and missing committed Revision 6 attestation.
- `npm run build` ran from `2026-08-26T15:25:54Z` through
  `2026-08-26T15:26:21Z` and passed. Existing middleware and absent Google service
  account/testing-sheet notices remained informational; no configuration changed.
- Root `git diff --check` passed at `2026-08-26T15:26:21Z`.
- A post-documentation `npm run plan:check` retry at `2026-08-26T15:31:03Z`
  encountered the restricted environment's `tsx` IPC `listen EPERM` before the
  validator executed. The socket-free equivalent
  `node --import tsx scripts/validate-build-plan.ts` then executed the same validator
  and reported exactly the same three expected pre-attestation errors. This was an
  execution-environment limitation, not a validation finding.

At the pre-freeze checkpoint, `HEAD` and cached `origin/main` were exact
`cc7760d51f1460728e85a9b1fc0921d30320a541`. Exactly the ten candidate paths listed
above were modified or untracked; no manifest or review existed, and no remote
Revision 6 branch had been pushed. The frozen candidate SHA, complete manifest digest,
post-freeze state, and independent-review result necessarily exist only after this
candidate's content is frozen. They will be bound by the uncommitted complete manifest
and the future direct-child review/attestation; rewriting this evidence to insert its
own content-derived commit SHA would instead create a different candidate.

## Side effects and rollback

Revision 6 is governance, validator, test, evidence, and handoff maintenance only. It
does not change product/runtime code, dependencies or lockfiles, CI or deployment
configuration, scholarship data, spreadsheets, forms, providers, P3, P9, or production
data. Before exact P2 relies on it, rollback requires the ordinary independently
reviewed amendment path. After P2 delivery, every Revision 6 and P2 candidate,
manifest, review, and attestation remains immutable historical evidence.
