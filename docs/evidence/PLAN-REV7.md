# Plan Revision 7 Evidence — Read-Only P9 Production Cutover

Status: candidate pending freeze, manifest-bound independent review, and attestation
Date: 2026-08-30
Baseline commit: `5c6040e332127ef2cdfe04bbb1cc9bdff4f5eecd`
Branch: `codex/plan-rev7-readonly-p9`

## Objective

Resolve the direct conflict between Plan Revision 6's production-write P9 contract and
Kelsey Stuart's explicit instruction that neither Codex nor the application may write
the production spreadsheet. Record the exact production identity, authorized tabs,
testing-only write boundary, current scoped backups, deployment/rollback owners, and
informed Git/Vercel authority. Make the no-production-write boundary machine-checkable
before P9 starts.

## Direct informed authority

On 2026-08-30, after receiving the exact P9 prerequisite statement, Kelsey Stuart:

- identified production spreadsheet
  `1eWGMdavcEECUcY_-nZ9gR2nMTN7T7T6oipG5ql1LoIE`;
- identified testing spreadsheet
  `1Dp5AMnrfSQ-Xf-r03S75lKsGPJk7o0inOgvC9Q6lOl4`;
- expressly stated that production writes are unauthorized and spreadsheet writes are
  authorized only on the testing spreadsheet;
- authorized P9 production source migration, application configuration switching,
  governed Git and pull-request delivery, Preview and Production deployment,
  verification, reconciliation, and rollback when necessary; and
- named Kelsey Stuart as both deployment owner and rollback owner.

At `2026-08-30T18:51:00Z`, the repository recorded the final operative grant exactly as
supplied by the user:

> You are not authorized to write on the production ID. You are only authorized to
> write on the testing spreadsheet. You do have authorization to write the testing
> spreadsheet. authorize P9 production migration, application configuration switching,
> governed Git/PR delivery, Preview and Production deployment, verification,
> reconciliation, and rollback if necessary. Deployment owner: Kelsey Stuart. Rollback
> owner: Kelsey Stuart.

The exact production and testing URLs immediately preceding that grant bind “production
ID” and “testing spreadsheet” to the IDs above. Revision 7 binds this one direct grant
to two distinct, non-interchangeable delivery records:

1. `PLAN-REV7` permits only the governance/validator/test/evidence change required to
   encode the stricter no-write instruction, plus its governed PR and resulting Preview
   and Production deployments. It changes no runtime behavior or deployment setting.
2. `P9` separately permits the later read-only source/configuration cutover, governed
   PR, Preview and Production deployment, verification, reconciliation, and
   application-only rollback after every entry gate passes.

Neither record permits the other's implementation scope. The testing-write authority is
also separate: an affirmative P9 testing write remains optional and requires exact
non-applicant targets, a fresh testing revision/backup, reviewed dry-run, bounded
idempotent write, immediate readback, and reconciliation.

## Control deviation, containment, and prospective authority

Earlier on 2026-08-30, the user supplied the exact production link and scholarship tab
identities, said “Proceed,” then stated that the Google Drive connector was connected
and asked to “try again.” Bounded production metadata/authorized-tab reads and creation
of the two private backup files below then occurred around `2026-08-30T18:36Z`.

That sequence did not yet name deployment and rollback owners. The original P9 stop
condition required every entry prerequisite before any production discovery or access.
Accordingly, those reads and backup creations were a control deviation; this evidence
does not rewrite their chronology or treat the later `18:51Z` grant as retroactive
authority.

Containment was immediate and measurable: the production source stayed at revision
`9857`; no production cell, format, metadata, sharing, or permission changed; no
unrelated tab or applicant surface was read; the two new backup files were private; no
testing-sheet write, runtime/configuration change, deployment, or schedule activation
occurred; and no further Drive operation is part of Revision 7. The final grant now
provides prospective P9 scope and owners. The existing backups may be used prospectively
only if P9's structured entry receipt proves revision, dimensions, source/backup hashes,
sharing, and post-read revision are still exact. Any mismatch blocks P9 for a new
directly authorized amendment and current backup receipt.

## Observed live baseline and P8 entry state

- Standard authenticated Git fetched live `origin/main` and resolved it to exact merge
  `5c6040e332127ef2cdfe04bbb1cc9bdff4f5eecd`.
- Accepted P8 attestation `20eeb53c80fce4e79a689128918a12361233aa7b`
  is an ancestor of that baseline. It is the direct child of P8 candidate
  `cc69d276c85f931499a23a5abde623bda321e0c0` and adds exactly
  `docs/evidence/P8-manifest.json` and `docs/reviews/P8.json`.
- P8 review outcome is accepted at C0/H0/M0/L0 against manifest SHA-256
  `02f17a53022465d1772df421f0b495056386fe4104fb8414c25da4216867d68c`.
- P0-P8 are accepted and P9 is next-permitted but planned. P8's monitoring schedule
  remains disabled and activation remains unauthorized.

## Production identity, permissions, and scoped backups

The connected Google Drive account metadata identified the exact production file as a
native Google Sheet titled `Whitefish High School Senior Scholarships`. The connected
Kelsey account had writer permission, but current authority remains read-only. Google
metadata also reported an anyone-with-link reader permission, which conflicts with the
earlier restricted-sharing screenshot for a differently titled workbook. Revision 7
does not change sharing and P9 must preserve this discrepancy as an observed permission
state rather than infer privacy or access policy from either representation.

Only these production tabs are authorized P9 data surfaces:

1. sheet ID `405588227`, `Resource: WHS Senior Scholarships_Updated 2_3_26`, grid
   `807` rows by `27` columns, bounded range `A1:AA807`;
2. sheet ID `1998253810`, `Resource: "Unique" Finds_Updated 10_2_25`, grid `973` rows
   by `29` columns, bounded range `A1:AC973`.

Unrelated tabs were not read. Any intake, form, applicant, or unrelated production
surface remains prohibited.

Immediately before the final authority clarification, two private native, sheet-only
backups were created from source revision `9857`, whose modified time was
`2026-05-19T20:01:00.674Z`. They are distinct from the source and unshared:

- source sheet `405588227` -> backup spreadsheet
  `1_UARat1DIg9ZW2ciViVFK5gH51vk8VAr1CvNo4lLcZI`, created
  `2026-08-30T18:36:18.588Z`; complete native CellData SHA-256
  `e67b548d3835eb0e37c78f685cbced8932771314c530682dfe781a95a9ec6551` matches
  the source across `A1:AA807`;
- source sheet `1998253810` -> backup spreadsheet
  `1RIxFui5dAX7ieC_iqWdJ1IuxImWC7S_rs3N2fgUX9yw`, created
  `2026-08-30T18:36:21.776Z`; complete native CellData SHA-256
  `019e08e246d8180cdd62a75ec1ee79936b02ee5a5032e897bd2f00a947e9d2ed` matches
  the source across `A1:AC973`.

The source remained at revision `9857` after both copies and equality reads. Copying
the authorized tabs created new private Drive files; it did not write or otherwise
mutate the production source. The backups are evidence and emergency operator
references only. Current authority does not permit restoring them into production.

The deployed runtime identity has not yet been independently proved to read the exact
production ID through the application path. `BUILD_STATE` therefore records runtime
permission, entry source reverification, and post-cutover zero-mutation proof as false.
P9 may not become active until `docs/evidence/P9-entry.json` passes its validator with a
non-secret runtime-identity fingerprint, the exact read-only OAuth scope, revision
`9857` before and after reads, exact tab/grid identities, exact source/backup native
CellData hashes, unchanged sharing, authorized-tabs-only scope, and zero observed
production writes. P9 may not become verified until
`docs/evidence/P9-post-cutover.json` proves the same revision/dimensions/hashes after
deployment smoke and again after application rollback, zero production write calls,
write-isolation tests, and exact deployed/rollback commits. Both receipt paths are
immutable and the accepted P9 manifest must hash them. A third structured record,
`docs/evidence/P9-deployment.json`, binds Vercel provider status and configuration
fingerprint to those commits. The validator requires both Git objects to exist, rollback
to equal P9's exact baseline, deployed to descend from rollback and precede the final
candidate, and every runtime-affecting path to remain unchanged after the deployed
rollback-probe commit. The guarded path set is the entire tracked `web/` tree—including
the P7 catalog fixtures imported by the scholarship API—plus tracked deployment-control
paths. It also requires distinct deployment/rollback IDs observed
through the authenticated Vercel API, health observations returning the corresponding
exact commits, and separate fingerprints recomputed from canonical non-secret cutover
and rollback descriptors; arbitrary repeated digests fail. After merge, the governed PR delivery record must authenticate
the resulting Production deployment/main commit and repeat health/API/browser and
read-only source-fingerprint smoke before program completion.

## Revision 6 conflict and safety consequence

Revision 6 requires P9 production mutation authority, review before writes, post-write
reconciliation, and production-backup restoration. Those gates cannot be truthfully
satisfied when production writes are expressly prohibited. Restoring a backup would
itself be a prohibited production mutation.

Static inspection also found that current `GOOGLE_SHEET_ID` is consumed by
`web/src/app/api/admin/push/route.ts`, which authenticates with full Sheets scope and
can append rows to `Master Database`. The public scholarship API currently serves the
accepted P7 catalog fixture and does not read `GOOGLE_SHEET_ID`. Therefore simply
changing that environment variable from testing to production would not perform the
intended public read cutover and would instead expose the production ID to a
write-capable route.

Revision 7 requires P9 to create a separate production configuration and read-only
client. Negative tests must prove the production ID cannot reach a Sheets write call.
Any write-capable admin/script path must remain pinned to the testing ID or be disabled.

## Testing-sheet authority

Kelsey directly authorized writes only on the exact testing spreadsheet. Revision 7
records that authority separately from the historical P5 `Master Database` authority.
It does not make a testing write mandatory or authorize an unbounded write. Before any
P9 testing write, P9 must record exact non-applicant tab/range targets, a current
revision fingerprint, a complete reversible backup, a reviewed dry-run, one bounded
idempotent operation, immediate readback, and reconciliation. No testing write occurs
in Revision 7.

## Amended P9 mechanics

- Migration is a read-only production source and application-configuration cutover.
- The two verified native backups satisfy the authorized-tab backup requirement but are
  not restoration authority and become stale immediately if any entry fingerprint
  differs.
- The migration receipt becomes a configuration-cutover receipt.
- Post-write reconciliation becomes complete post-cutover source-to-model/API/UI
  reconciliation.
- Deterministic record sampling, 100% review of high-risk transformations, privacy,
  unknown/manual-review preservation, health/API/browser/export smoke, independent
  review, manifest, attestation, and closeout gates remain required.
- Rollback redeploys the prior accepted application revision/configuration and performs
  no production spreadsheet mutation. The post-cutover structured receipt repeats the
  exact source fingerprint after both deployment smoke and rollback proof.

## Candidate scope

Expected candidate paths before freeze:

- `AGENTS.md`
- `docs/BUILD_STATE.json`
- `docs/CURRENT_HANDOFF.md`
- `docs/DECISIONS.md`
- `docs/SCHOLARSHIP_SYSTEM_BUILD_PLAN.md`
- `docs/evidence/PLAN-REV7.md`
- `docs/kickoffs/P9-PRODUCTION-MIGRATION.md`
- `web/package.json`
- `web/scripts/p4-verification.ts`
- `web/scripts/production-authority.ts`
- `web/scripts/test-production-authority.ts`
- `web/scripts/validate-build-plan.ts`

The candidate excludes `docs/evidence/PLAN-REV7-manifest.json` and
`docs/reviews/PLAN-REV7.json`; only a future direct-child attestation may add those two
paths after exact-candidate acceptance.

## Verification

The final pre-freeze verification window was `2026-08-30T19:48:37Z` through
`2026-08-30T19:55:06Z`:

- `npm ci` completed from the locked dependency graph: 462 packages added, 463 audited,
  and zero vulnerabilities reported.
- `node --import tsx scripts/test-production-authority.ts` passed the exact IDs, tabs,
  backups, immutable receipt paths, no-production-write rule, entry/post-cutover proof
  states, and named-owner checks.
- `node --import tsx scripts/validate-build-plan.ts` produced exactly the three expected
  pre-attestation errors: absent `docs/evidence/PLAN-REV7-manifest.json`, absent
  `docs/reviews/PLAN-REV7.json`, and no committed direct-child Revision 7 attestation.
  It produced no other error.
- `npm run typecheck` passed.
- `npm test` passed the complete P0-P8 regression suite plus the new P9 production-
  authority tests. P8 monitoring validation again confirmed that its schedule is
  disabled.
- `CI=1 NEXT_TELEMETRY_DISABLED=1 npm run build` passed in an ordinary unsandboxed
  terminal against this exact tracked runtime tree. Next.js 16.3.3 Turbopack compiled,
  completed TypeScript, and generated all ten routes. The build changed no tracked
  path. The retained log is
  `/private/tmp/plan-rev7-build-terminal-20260830T195431Z.log`, SHA-256
  `0d5c3bc15299f17517083f927cb2eff7cd7bd6e74cb55d7418b86e54710f3829`.
  A direct Codex-sandbox build had previously reached a local-port `EPERM` while
  starting the Next/PostCSS worker; the normal-worker pass distinguishes that local
  sandbox restriction from a product build failure.
- `npm audit --audit-level=low` and
  `npm audit --omit=dev --audit-level=low` both completed against the registry with
  zero vulnerabilities.
- Root `git diff --check` passed. The candidate scope was exactly the 12 paths listed
  above, with no spreadsheet, deployment, schedule, runtime, secret, or applicant-data
  artifact.
- A final authenticated scoped-HTTPS fetch reproduced live `origin/main` at
  `5c6040e332127ef2cdfe04bbb1cc9bdff4f5eecd`; local ancestry and diff-tree checks again
  proved accepted P8 attestation `20eeb53c80fce4e79a689128918a12361233aa7b`
  is the direct child of `cc69d276c85f931499a23a5abde623bda321e0c0` and adds only
  the P8 manifest and review paths.

Before this final window, fresh-context read-only preflight review found and the
implementation resolved three high-risk contract defects: non-binding runtime proof,
stale backup/post-cutover proof, and authority/delivery chronology. Its recheck then
found and the implementation resolved forged deployment-commit/provenance and arbitrary
configuration-fingerprint gaps, including coverage of the runtime-imported P7 catalog.
The final preflight recheck reported no remaining concrete defect. This preflight is
not the final acceptance review: after the candidate commit and manifest are frozen, a
different fresh-context agent that did not author or edit Revision 7 must review the
exact candidate read-only.

## External effects and rollback

Observed pre-amendment external effects were the bounded metadata/CellData reads and two
private backup-file creations documented in the control-deviation section. The
production source remained unchanged at revision `9857`. No source cell, formatting,
metadata, sharing, or permission changed; no unrelated tab or applicant surface was
read; no testing spreadsheet write occurred.

Revision 7 changes only governance, validator/tests, evidence, and handoff. It does not
start P9, change application runtime behavior or deployment configuration, enable P8
monitoring, or access/write either spreadsheet. Before P9 depends on Revision 7,
rollback requires the normal independently reviewed amendment path. After P9 depends
on it, every Revision 7 and P9 candidate, manifest, review, and attestation remains
immutable historical evidence.
