# Plan Revision 2 Evidence — Immutable Post-Attestation Delivery Integration

Status: candidate pending hash-bound independent review
Date: 2026-08-24
Baseline commit: `d374247156e3ed15d19c037473da8f76ceedb6ab`
Branch: `codex/plan-v2-p1-delivery-path`

## Objective

Resolve the Plan Revision 1 deadlock created when an independently accepted stage was
attested before later delivery authority was received. Preserve P1 candidate
`92ee21095e959bd19ab641752308c0fd9b394b22` and attestation
`20476b8384cfbda6aaa04a3da4b7f0a3fbd291e5` byte-for-byte while adding a narrow,
machine-checkable delivery-integration path.

## Observed deadlock

- The accepted P1 candidate recorded delivery authorization as false because push,
  merge, Preview deployment, and Production deployment were prohibited at freeze time.
- The user later provided direct informed authority for those exact effects.
- Plan Revision 1 required authority in `docs/BUILD_STATE.json`, but also required the
  undelivered P1 attestation to remain the branch tip and forbade rebinding it.
- Therefore neither an appended authorization commit nor a replacement P1 attestation
  was permitted.

## Revision 2 mechanism

1. Every material plan amendment is itself frozen, manifested, independently reviewed,
   and attested in a direct-child two-file commit.
2. A delivery-integration record pins the original stage candidate, original stage
   attestation, original baseline, authority evidence, and future delivery manifest and
   review paths.
3. After this amendment is delivered, the delivery candidate must be a two-parent merge:
   first parent equal to the verified Plan Revision 2 `origin/main` baseline and second
   parent equal to exact P1 attestation `20476b8`.
4. The delivery candidate's complete baseline-to-candidate change set is hashed in a
   separate delivery manifest and accepted by a fresh-context read-only reviewer.
5. Only the delivery manifest and delivery review may be added in its direct-child
   attestation. Until delivered, that delivery attestation is the branch tip.
6. The original P1 manifest, review, candidate, and attestation remain immutable and
   canonical; the delivery record does not re-review or replace P1.
7. The validator rejects a stale first-parent baseline, every path outside the original
   P1 change set, and every non-governance blob that differs from `20476b8`. Only
   `docs/BUILD_STATE.json` and `docs/CURRENT_HANDOFF.md` may reconcile Plan Revision 2
   delivery state.
8. The delivery candidate's `BUILD_STATE` is derived mechanically from the delivered
   amendment baseline: the authority and every integration identity/path stay identical;
   only integration status/baseline and the stage status array/next-stage pointer copied
   from preserved candidate `92ee210` may change.

## Authorization and boundaries

Direct informed authority and exclusions are recorded in
`docs/evidence/P1-delivery-authorization.md`. This amendment changes governance,
documentation, and validation only. It does not change product behavior, dependencies,
CI configuration, deployment configuration, or scholarship data, and it authorizes no
spreadsheet write, form submission, application interaction, or provider contact.

## Candidate files

- `AGENTS.md`
- `docs/SCHOLARSHIP_SYSTEM_BUILD_PLAN.md`
- `docs/BUILD_STATE.json`
- `docs/CURRENT_HANDOFF.md`
- `docs/DECISIONS.md`
- `docs/evidence/P1-delivery-authorization.md`
- `docs/evidence/PLAN-REV2.md`
- `docs/kickoffs/P1-BASELINE.md`
- `web/scripts/validate-build-plan.ts`

The candidate intentionally excludes `docs/evidence/PLAN-REV2-manifest.json` and
`docs/reviews/PLAN-REV2.json`; those two paths are added only by the direct-child
attestation after independent acceptance.

## Verification

Pre-candidate verification completed through `2026-08-24T19:04:31Z`:

- `cd web && npm ci` — passed; 565 packages installed from the unchanged lockfile. The
  time-sensitive registry audit reported 21 findings (1 low, 7 moderate, 12 high, 1
  critical); no fix or package change was applied.
- `cd web && npm run typecheck` — passed.
- `cd web && npm test` — passed; all existing suites reported `ALL PASS`.
- `cd web && npm run build` — the restricted run failed only because the existing
  Google Fonts dependency could not reach `fonts.googleapis.com`; the authorized
  network-enabled rerun passed and produced all routes. Existing middleware and missing
  runtime Sheet credential notices remained non-fatal.
- `git diff --check` — passed.
- Prospective `cd web && npm run plan:check` — compiled and exercised the revised
  validator, then rejected exactly the intentionally absent
  `docs/evidence/PLAN-REV2-manifest.json`, `docs/reviews/PLAN-REV2.json`, and their
  not-yet-created direct-child attestation. No other validation error was reported.

The final manifest binds the immutable candidate commit and complete baseline change
set. The final review record supplies the authoritative independent outcome; this
evidence file does not self-certify acceptance.

## Independent-review remediation history

- Review of initial candidate `f7c94d0287b3ade940f7f616bf571da56af38c2a`
  rejected it with two high and one low finding: stale `origin/main` was not rejected,
  the delivery manifest could include unauthorized non-governance paths/blobs, and one
  evidence file had an extra blank line at EOF. All three were remediated.
- Recheck of replacement candidate
  `683dd5e4432b64f6bb42916ceff2f60dcd1c7e74` rejected it with one high and one medium
  finding: the allowlisted `BUILD_STATE` could rebind the integration identity, and the
  evidence artifact did not yet record post-remediation results. The validator now
  derives the exact machine-state transition from the delivered baseline and preserved
  stage candidate, including byte-for-byte authority and identity comparison. This
  evidence section records the remediation; a later immutable candidate requires the
  same reviewer to recheck it before acceptance.

Post-second-review remediation verification completed through
`2026-08-24T19:20:35Z`: `npm run typecheck`, the complete existing `npm test` suite,
the network-enabled production `npm run build`, and `git diff --check` all passed.
Prospective `npm run plan:check` rejected only the intentionally absent
`docs/reviews/PLAN-REV2.json` and the not-yet-created exact amendment attestation. The
candidate was frozen only after these results were written; its commit and complete
tree hashes are bound by the regenerated manifest.

GitHub PR #8 then exercised the accepted amendment attestation in a clean CI clone. CI
correctly lacked the unrelated, not-yet-pushed P1 objects and rejected the pending record
while trying to inspect `20476b8^`. The published attestation was left untouched. A clean
replacement branch starts from its reviewed candidate and changes the validator so a
pending integration validates exact SHA syntax and, when the objects are locally
available, their topology. The later accepted integration requires both Git objects and
rechecks the exact direct-parent relationship before any delivery can pass. This preserves
the amendment-first delivery sequence without weakening the integration gate.

Post-CI remediation verification completed through `2026-08-24T19:27:20Z`:
typecheck, the complete existing test suite, the network-enabled production build, and
`git diff --check` passed. Prospective plan validation rejected only the intentionally
absent replacement manifest, review, and direct-child attestation.
