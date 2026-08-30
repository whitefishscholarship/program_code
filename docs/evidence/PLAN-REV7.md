# Plan Revision 7 Evidence — Read-Only P9 Production Cutover

Status: replacement candidate pending freeze after first-candidate rejection
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
The original hash serialization was not recorded, so those two digests remain immutable
historical provenance rather than an opaque executable algorithm. Schema-v2 proof uses
the explicit `google-sheets-v4-griddata-canonical-json-v1` algorithm: SHA-256 of
canonical JSON for the exact bounded `sheets[].data` GridData payload. Every trusted
phase freshly hashes source and the existing corresponding backup, requires equality,
and requires the canonical source hash to remain identical across phases.

The deployed runtime identity has not yet been independently proved to read the exact
production ID through the application path. The two existing backups are private and
unshared, so the intended deployed identity also has not been proved able to perform the
required fresh backup equality reads. The production sharing screenshot shows service
accounts with Editor access; it does not prove that the eventual deployed identity has
the required direct Viewer permission. Revision 7 does not change any permission or
sharing state. `BUILD_STATE` therefore records direct-reader permission, backup-reader
permission, application-path proof, entry source reverification, and post-cutover
zero-mutation proof as false. P9 may not become active until those explicit stop gates
are satisfied and `docs/evidence/P9-entry.json` passes its validator with a non-secret
runtime-identity fingerprint, the exact read-only OAuth scope, revision `9857` before
and after reads, exact tab/grid identities, fresh canonical source/backup CellData
equality, unchanged sharing, authorized-tabs-only scope, and zero observed production
writes. A connected user Drive account or a CI runner that can decrypt and use a stored
credential is not proof that the deployed application read path works. P9 may not
become verified until
`docs/evidence/P9-post-cutover.json` proves the same revision/dimensions/hashes after
deployment smoke and again after application rollback, zero production write calls,
write-isolation tests, and exact runtime/deployment binding. All receipt paths are
immutable and the accepted P9 manifest must hash them. A third structured record,
`docs/evidence/P9-deployment.json`, binds exact Vercel observations and actual runtime
descriptors to one rollback-safe runtime commit deployed three times under cutover,
static rollback, and restored-cutover configurations. That runtime commit must descend
from P9's exact baseline, precede the final candidate, and remain byte-identical to it
across the entire tracked `web/` tree—including P7 catalog fixtures—plus tracked
deployment-control paths.

Schema-v1 receipts and self-asserted provider JSON are permanently fail-closed. Exact
schema-v2 receipts must pass GitHub OIDC artifact-attestation verification from the
delivered default-branch trusted workflow. That workflow uses separate entry, cutover,
rollback, restored-cutover, and finalize runs. Each successor verifies its predecessor;
each deployment is observed only after creation, and each health/source phase must
finish before the next deployment is created. Provider IDs, health identity/nonces,
source observations, runtime configuration, TypeScript-AST writer inventory, and
secrets-free executed negative-test results are derived and relationship-checked rather
than accepted as hashes or booleans. Cutover and restored-cutover health must also
return a nonce-bound application-read observation for the exact production ID,
read-only scope, and authorized tabs/bounds. Each tab digest is computed from a domain-
separated envelope containing the fresh runner nonce and the complete normalized
bounded GridData payload—not from the stored source digest—and the trusted runner
independently computes the same digest from its own read. The response exposes no cell
values. The trusted phase additionally binds the exact deployed health route and public
scholarship route to one statically verified shared loader at the provider-reported
runtime commit and rejects unused-read or constant-return dataflow. Static rollback
must return no production-read observation. After merge, the governed PR delivery record must authenticate
the resulting Production deployment/main commit and repeat health/API/browser and
read-only source-fingerprint smoke before program completion.

The authenticated Vercel target is not yet authority-pinned. Exact project and team
fingerprints and the canonical student-facing Production hostname remain unknown in
Revision 7; protected-environment existence/protection and environment-scoped secret
provenance are also operationally unverified. No mutable workflow input or secret may
select a substitute same-repository project or deployment hostname. These facts remain
false/null machine gates. Revision 7 predeclares the sole population path as
`P9-IDENTITY-PINS`, using fixed evidence, manifest, and review paths. That future
candidate must populate all seven fingerprints together from the null-pin Revision 7
baseline, change no state except those pins, keep P9 planned and every operational proof
flag false, and receive fresh independent acceptance plus a direct-child attestation.
Any later pin/artifact change, deletion, re-addition, or rebind fails closed. Revision 7
does not contact Vercel or configure a GitHub environment.

The future pin derivations are explicit: project and team fingerprints are SHA-256 of
the exact provider IDs; the canonical-host fingerprint is SHA-256 of the lowercase
hostname; the hosted-environment fingerprint is SHA-256 of the exact
`p9-production-verification` name; the runtime principal is canonical-JSON SHA-256 of
the lowercased service-account email and Google project ID; and credential provenance is
canonical-JSON SHA-256 of the complete strict non-secret runtime-identity descriptor.
The trusted runner reads these non-null values from the exact delivered P9-baseline
`BUILD_STATE` blob before any network call and compares every provider/runtime
observation to them. Environment-name binding does not by itself prove approval rules or
secret provenance; those operational properties remain separately unverified and must
receive authenticated evidence before their proof-state flags can become true.

## Current P9 entry blockers

P9 remains `planned` and must return `BLOCKED` until all of the following are proved:

1. the exact deployed Google service-account principal is identified without exposing
   credentials and has one direct, unexpired `reader` permission—not `writer`—on the
   production spreadsheet;
2. that same authorized verifier can read both exact private backup spreadsheet IDs, or
   a separately authorized backup-verification identity and relationship is introduced;
3. exact non-secret runtime, backup, Vercel project/team, canonical Production-host,
   hosted-environment, and credential-provenance fingerprints are populated together
   in the accepted, direct-child-attested `P9-IDENTITY-PINS` record;
4. the protected `p9-production-verification` GitHub environment, approval policy,
   environment-scoped secret provenance, and required read-only API capabilities are
   authenticated by the delivered workflow; and
5. cutover/restored health proves the deployed shared-loader path read the exact source
   bytes by matching fresh nonce-bound full-GridData digests independently computed by
   the trusted runner, while rollback proves that path is inactive.

Satisfying these gates may require Kelsey to change sharing on the source or backups or
to supply exact provider identity facts. This Revision 7 execution is not authorized to
make those changes, and it does not treat their absence as evidence of access.

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
- P9 first creates one rollback-safe runtime commit with separate read-only production
  and testing-only write configuration. Rollback deploys that same code with the
  accepted-P7 static source configuration; it never deploys the legacy baseline while a
  production source setting exists. The restored-cutover deployment uses the same code
  again with the read-only production source. The post-cutover receipt repeats the exact
  source fingerprint during all three phases and performs no production mutation.
- Revision 7 delivers the dormant manual trusted-proof workflow, strict schema-v2
  parser/validator, and negative tests. It does not invoke the workflow, configure its
  protected environment, change a deployment, or start P9.

## First frozen candidate rejection and remediation

The first immutable candidate was
`1c23d4fef71635c75702e638f268501318f403ec`. Its manifest SHA-256 was
`655c9086b73d804410bed9087a4aa3d58bf395c4ea88d2107fd49ac9c751bd3`.
Fresh-context reviewer `/root/rev7_final_review` rejected it C0/H2/M0/L0:

1. receipt validators accepted 1970 timestamps and unknown fields and lacked exact
   chronology, freshness, and baseline binding;
2. fabricated Vercel IDs, SHA-shaped values, asserted booleans, and configuration claims
   could pass without live/authenticated provider proof or executed writer-test
   provenance.

The rejected candidate and its manifest are not rebound or accepted. Remediation uses
strict Zod objects at every receipt level; canonical calendar timestamps; derived
observation/config/inventory digests; exact baseline, runtime, provider, source, and
candidate relationships; hosted GitHub OIDC artifact attestations; and a dormant
protected-environment workflow whose chronological phase chain queries providers
read-only. The same reviewer must recheck the replacement frozen candidate.

A later read-only preflight reported `C0/H7/M3/L0`. Revision 7 remediates the code-level
findings by expanding fail-closed TypeScript-symbol writer discovery across the runtime
tree, executing each exact writer probe under instrumented Google clients, binding the
accepted P7 catalog and all trusted proof bytes from Revision 7 through the runtime and
final candidate, enforcing cross-phase freshness, strengthening sharing fingerprints,
and adding the nonce-bound deployed application-read observation described above.
Operational findings are deliberately not fabricated away: direct Viewer permission,
private-backup readability, exact provider target pinning, and hosted environment/secret
provenance remain explicit P9 stop gates. The same preflight reviewer must recheck the
final replacement tree before candidate freeze.

The same preflight reviewer then rejected the remediated working tree `C0/H4/M1/L0`:
the null identity pins had no immutable future population mechanism; the application
probe could echo prior source hashes without proving shared-loader dataflow; Drive
permission detail did not yet prove directness; composed raw REST writers could escape
inventory; and trusted credential parsing did not match both strict runtime encodings.
The replacement now predeclares the fixed-path, independently reviewed and direct-child-
attested `P9-IDENTITY-PINS` slot; uses fresh full-GridData nonce challenges plus exact
runtime file/AST/dataflow binding in every phase; requires one explicit non-inherited
`user`/`reader` permission detail; fails closed on generic/composed network writers; and
accepts only bounded canonical raw JSON or canonical padded standard-base64 credential
objects. This history is not an acceptance claim. A fresh recheck of the final bytes is
still required before freeze.

## Candidate scope

Expected candidate paths before freeze:

- `.github/workflows/ci.yml`
- `.github/workflows/p9-evidence.yml`
- `AGENTS.md`
- `docs/BUILD_STATE.json`
- `docs/CURRENT_HANDOFF.md`
- `docs/DECISIONS.md`
- `docs/SCHOLARSHIP_SYSTEM_BUILD_PLAN.md`
- `docs/evidence/PLAN-REV7.md`
- `docs/kickoffs/P9-PRODUCTION-MIGRATION.md`
- `web/package.json`
- `web/scripts/p4-verification.ts`
- `web/scripts/p9-evidence-v2.ts`
- `web/scripts/p9-trusted-proof.ts`
- `web/scripts/production-authority.ts`
- `web/scripts/test-p9-evidence-v2.ts`
- `web/scripts/test-production-authority.ts`
- `web/scripts/validate-build-plan.ts`

The candidate excludes `docs/evidence/PLAN-REV7-manifest.json` and
`docs/reviews/PLAN-REV7.json`; only a future direct-child attestation may add those two
paths after exact-candidate acceptance.

## Verification

Replacement-candidate verification is pending. The earlier `2026-08-30T19:48:37Z`
through `2026-08-30T19:55:06Z` run applied only to rejected candidate `1c23d4f` and is
not acceptance evidence for the replacement. Before freeze, record a fresh complete
window for dependency installation, focused authority/evidence/trusted-proof tests,
plan validation, typecheck, full tests, production build, both dependency audits, YAML
parsing, root whitespace validation, production-write/P8-schedule static scans, and a
fresh authenticated baseline/P8 topology check. The pre-attestation plan validator may
report only the three expected absent-manifest, absent-review, and absent-direct-child-
attestation errors. Then record the exact committed path set and log digests here before
generating the replacement manifest or requesting acceptance review.

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
