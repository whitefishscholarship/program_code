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

After resumption, an explicit adversarial audit strengthened the remaining shared-loader
mapping proof. The first pass stopped treating mere callback-parameter presence as
result provenance, rejected dead or condition-only input use, and required the
`map`/`flatMap` callback result itself to derive from the exact response item. Direct
negative tests rejected a top-level constant mapper, a callback that evaluates its input
and then returns a constant, and a source-dependent conditional with two constant
branches.

Fresh-context, read-only reviewer `/root/rev7_prefreeze_recheck` then rejected those
working-tree bytes `C0/H3/M0/L0`:

1. the derived-receiver rule still accepted constant-output
   `sheet.data.filter(() => false)`;
2. runtime source discovery silently skipped symlinked TypeScript writers; and
3. generic-network discovery omitted a raw Sheets REST `POST` invoked through
   `Reflect.apply(fetch, ...)`.

Remediation now limits collection-call provenance to exact `map`/`flatMap` callbacks
whose returned value is itself proved derived, rejects every symbolic link encountered
in the scanned runtime source tree, and resolves or fails closed on standard indirect
network calls including `Reflect.apply` and function `.apply`. New regression fixtures
cover the reviewer's exact constant-filter, symlink-writer, and reflected-fetch bypasses
plus direct function `.apply`. Focused non-incremental typecheck, evidence-v2 tests,
trusted-proof self-test, and production-authority tests pass on the remediated bytes.
This is not acceptance: the same reviewer must return C0/H0 before freeze, and the full
replacement verification remains pending.

The same reviewer's first recheck rejected that remediation `C0/H2/M0/L0`. Any generic
binary operator still counted as derived when either operand was derived, admitting
algebraically constant `sheet.data.length * 0` and
`sheet.data.length - sheet.data.length`. Separately, the standard detached-call forms
`(0, fetch)(...)` and `Reflect.apply((0, fetch), ...)` had no resolved expression chain
and disappeared from writer inventory. The second remediation rejects mapper binary
and conditional result operators except the explicit `&&`, `??`, and `||` propagation
rules required by the bounded loader shape; it also resolves comma-expression network
targets from the effective right operand. Exact regression fixtures cover both
algebraic constants and both detached-call variants. A second same-reviewer C0/H0
recheck is still required before freeze.

The same reviewer's second recheck rejected those bytes `C0/H2/M0/L0`. Callback-local
mutation and control flow could erase a previously derived array, while cardinality-
only projections such as `sheet.data.length` did not carry complete GridData cell
values. Conditional and logical callable expressions could also conceal fetch, both
directly and through `Reflect.apply` or a local alias. The third remediation removes
the permissive mapper provenance heuristic and pins the exact intended collection
shape: one `flatMap` callback returning `sheet.data ?? []` with no block, mutation,
projection, or alternate control flow. Network chain resolution now handles identical
conditional/logical branches and marks mixed network branches as an unknown indirect
network capability; independently, any unfamiliar call that carries a statically
resolved Sheets URL is inventoried fail-closed. Direct regression fixtures cover the
reviewer's mutation, cardinality, conditional/logical, reflected, and aliased variants,
plus unfamiliar indexed-call syntax. Another same-reviewer C0/H0 recheck is required
before freeze.

The same reviewer's third recheck rejected those bytes `C0/H2/M0/L0`. Extra loader
statements could monkeypatch either the response receiver's `flatMap` method or
`Array.prototype.flatMap` before the otherwise exact mapping call. Separately,
object/array/Map containers holding fetch, the Sheets endpoint, and write options
prevented direct call resolution and disappeared from inventory. The fourth remediation
pins the loader's complete top-level import/function/constant closure, ordered
side-effect-free statement sequence, single-return early branches, and direct
GoogleAuth initializer. Writer discovery also applies a file-level fail-closed rule:
a statically resolved generic-network capability, Sheets target, and write method in the
same runtime source is a raw Sheets writer even when aggregate indirection obscures the
call. Exact response/prototype monkeypatch and object/array/Map regressions are included.
Another same-reviewer C0/H0 recheck is required before freeze.

The same reviewer's fourth recheck rejected those bytes `C0/H2/M0/L0`. Async and
generator mapper declarations and an async `flatMap` callback preserved the pinned
expression syntax while returning promises or an iterator rather than GridData.
Aggregate fallback also missed a computed `fetch` property and a `POST` method assembled
with array `join`. The fifth remediation explicitly rejects async/generator mapper
semantics and async callbacks, resolves statically concatenated computed property names
and joined string arrays, and treats a statically resolved Sheets mutation endpoint as
a raw writer independently of aggregate call resolution. Exact regressions cover all
five reviewer probes. Another same-reviewer C0/H0 recheck is required before freeze.

The same reviewer's fifth recheck rejected those bytes `C0/H2/M0/L0`. The executable
local runtime-binding import was outside the three-file binding closure and could
monkeypatch `flatMap` as an import side effect. Aggregate raw writers could also compute
capability, method, or endpoint strings with `String.fromCharCode` and string `concat`
forms outside the enumerated evaluator. The sixth remediation adds the imported module
to the exact runtime binding and trusted committed-byte closure, requiring exactly one
side-effect-free direct JSON-literal export. It also inventories every dynamic computed
access on global runtime objects as an unknown writer, treats unproved object `method`
properties as write-capable unless exactly GET/HEAD, and resolves the two cited static
string forms. Exact regressions cover the module side effect and both computed raw-write
fixtures. Another same-reviewer C0/H0 recheck is required before freeze.

The same reviewer's sixth recheck rejected those bytes `C0/H2/M0/L0`. The bound module
path was not the proved import resolution because the loader still used the configurable
`@/` alias. Reflective `globalThis.fetch` retrieval through `Reflect.get` or a property
descriptor also escaped aggregate writer inventory. The seventh remediation requires a
resolver-independent sibling-relative binding-module import and treats standard
reflective reads from `globalThis`, `window`, or `self` as unknown network capabilities.
Exact values-update regressions cover both reflective retrieval forms. Another
same-reviewer C0/H0 recheck is required before freeze.

The same reviewer's seventh recheck rejected those bytes `C0/H2/M0/L0`. Nested
`Reflect.apply` or bound reflective property reads could still conceal a global network
capability, and runtime-capable `web/instrumentation.ts` was outside the four-source
application binding, allowing a pre-request built-in prototype mutation. The eighth
remediation normalizes direct, applied, and bound reflective global-property reads into
the same unknown-network classification. It also binds the sorted path/blob digest and
file count for the complete runtime source closure, rejects tracked or untracked
checkout drift, and refuses built-in prototype mutation in any closure file. The
literal binding module remains separately constrained to avoid a self-hash cycle.
Exact nested-reflection and instrumentation regressions are included. Another
same-reviewer C0/H0 recheck is required before freeze.

The same reviewer's eighth recheck rejected those bytes `C0/H4/M0/L0`. Standard
reflective getters used through `.call`, `.apply`, or a partial bind were not all
normalized; a const alias of a built-in prototype could hide property assignment or
`Reflect.set`; a generic network capability, Sheets endpoint, and write method split
across three imported modules escaped the file-local aggregate rule; and runtime source
discovery excluded source files merely because a path segment was named `build`,
`dist`, or `out`. The ninth remediation treats every expression chain rooted at a
standard reflective getter as an unknown network capability, resolves stable const
prototype aliases for direct and reflective mutation checks, fails closed on any
unresolved call carrying a method option that is not proved GET/HEAD, and derives the
runtime closure from every tracked `web/` TypeScript/JavaScript path without build-like
exclusions. The non-Git fixture fallback follows the same inclusion rule. Exact
regressions cover applied and partially bound getters, both prototype-alias mutation
forms, three-module composition, and a writer under `web/src/build/hidden.ts`. Focused
non-incremental typecheck, evidence-v2 tests, trusted-proof self-test, and authority
tests pass on these bytes. This remains a working tree: the same reviewer must return
C0/H0 before candidate freeze.

The same reviewer's ninth recheck rejected those bytes `C0/H4/M0/L0`. A computed
`Reflect[member]` getter remained outside the resolved chain; a write-options object
imported alongside imported network capability and Sheets target defeated the
call-local method scan; prototype aliases expressed as stable `let`, object
destructuring, or an aliased `Object.assign` call were not resolved; and dynamic
`eval`/`Function` execution could conceal both prototype mutation and a base64-decoded
Sheets write. The tenth remediation inventories dynamic Reflect/Object element access,
derives direct local-module export facts for network capability, Sheets target, and
write options and binds them to import symbols at the call site, generalizes stable
runtime alias resolution across let/destructuring/callable chains, and rejects
eval/Function-family execution in both the writer inventory and runtime source closure.
Exact computed-getter, four-module writer, stable-let/destructured/callable prototype,
and dynamically decoded writer fixtures pass. Focused non-incremental typecheck,
evidence-v2 tests, trusted-proof self-test, and authority tests pass on these bytes.
This is still not acceptance; another same-reviewer C0/H0 recheck is required before
candidate freeze.

The same reviewer's tenth recheck rejected those bytes `C0/H3/M0/L0`. Imported
capability facts vanished through a local alias or a barrel/namespace hop; standard
dynamic execution through a function object's `constructor`, `Reflect.apply(Function,
...)`, or `node:vm` was neither inventoried nor rejected from the runtime closure; and
prototype mutation could derive its target through `Object.getPrototypeOf` or
`__proto__`, or apply `Object.assign` reflectively. The eleventh remediation recursively
resolves stable local aliases of imported facts, propagates named and star barrel
re-exports to a fixed point, resolves namespace members, and treats every directly
exported raw network capability as an unknown write surface in its own right. Dynamic
Function/eval-family identifiers, standard vm modules, and constructor access are
fail-closed independent of surrounding syntax. Prototype derivation members and
applied calls containing a built-in prototype are rejected by the closure. Exact local-
alias, barrel/namespace, three dynamic-code, and three prototype-derivation/application
fixtures pass. Focused non-incremental typecheck and evidence-v2 tests pass; the complete
prefreeze suite and another same-reviewer C0/H0 recheck remain required.

The same reviewer's eleventh recheck rejected those bytes `C0/H3/M0/L0`. A network
capability returned from an exported function or nested in an exported object was not
represented by the module fact, encoded code could run through a data-URL `import()` or
`node:child_process.exec`, and a prototype alias could be exported in one module then
mutated from another. The twelfth remediation derives nested exported-container facts,
marks explicit capability-returning functions, and recursively carries imported facts
through call and member expressions. It rejects non-static or executable-scheme dynamic
imports and bound `exec`/`execSync` process calls in inventory and runtime closure.
Before per-file prototype validation, it now builds direct/default and fixed-point
barrel prototype exports, resolves named/default/namespace imports, seeds the consumer's
stable alias graph, and then applies the mutation proof. Exact function/container,
data-URL/process, and cross-module prototype fixtures pass. This remains unaccepted
working-tree evidence pending the complete suite and same-reviewer C0/H0 recheck.

The same reviewer's twelfth recheck rejected those bytes `C0/H3/M0/L0`. Capability
facts still vanished through a local callable wrapper or exported class method;
child-process `spawn` and related launch APIs exceeded the `exec`/`execSync` rule; and
prototype values nested in exported containers or returned by exported functions were
not propagated. The thirteenth remediation merges exported return facts through stable
local callables, derives class-method return capabilities, and distinguishes returned
capabilities from a directly executed proven-GET network call. Process bindings now
cover `exec`, `execSync`, `execFile`, `execFileSync`, `spawn`, `spawnSync`, and `fork`,
failing closed except for the repository's statically fixed Git/NPM evidence commands.
Runtime closure validation also rejects built-in prototypes exposed by an exported
direct value, object/array container, function, class return, or default assignment at
the exporting module boundary. Exact wrapper/class, dynamic-spawn, and exported
prototype container/function regressions pass. Another same-reviewer C0/H0 recheck is
required before freeze.

The same reviewer's thirteenth recheck rejected those bytes `C0/H3/M0/L0`.
Capability facts still depended on declaration order and missed non-exported local
function wrappers plus exported class fields. The child-process rule allowed arbitrary
literal `git`/`npx` arguments and did not normalize reflected process functions. Named
local prototype exports and exported class prototype fields also escaped the exporter
boundary. The fourteenth remediation computes local variable, function, method, and
class-field facts to a fixed point before any export resolution. Process bindings are
method-aware: all `exec`, `execSync`, `spawn`, `spawnSync`, `fork`, and reflected process
invocations fail closed, while only direct `execFile`/`execFileSync` with literal `git`
remains permitted for existing immutable-history evidence reads. Named local export
aliases and class property initializers enter prototype export rejection. Exact late-
local/function/class-field capability, npx/reflected spawn, and named/class prototype
regressions pass. Another same-reviewer C0/H0 recheck is required before freeze.

The same reviewer's fourteenth recheck rejected those bytes `C0/H3/M0/L0`.
Class accessors and anonymous/default classes were absent from capability facts.
Process launchers could be applied, bound, or locally re-exported, and the literal
`git`/`npx` exception did not constrain arguments. Named prototype containers and local
call-returned prototypes also escaped exporter checks. The fifteenth remediation adds
getter/setter/default-class return and field facts; normalizes process `.apply`, `.call`,
`.bind`, and Reflect application; inventories process re-exports; rejects every
spawn/fork invocation; and permits only direct Git exec-file calls whose literal first
argument is one of the audited read-only history subcommands. A second fixed point
derives prototype-valued locals through direct values, containers, functions, classes,
and local calls, then rejects named/default/direct exports of any derived value. Exact
accessor/default, applied/bound/re-exported process, Git `-c`, named container, and
wrapped prototype-return regressions pass. Another same-reviewer C0/H0 recheck is
required before freeze.

The same reviewer's fifteenth recheck rejected those bytes `C0/H3/M0/L0`.
Capability and prototype facts ignored property assignments after initialization and
class static blocks. Aliased and star child-process re-exports also escaped the exporter
boundary, and the Git exception permitted `diff --ext-diff` to launch an external
program. The sixteenth remediation adds assignment-root and class-static-block facts to
both fixed points, rejects aliased/star child-process re-exports, and removes `git diff`
from the literal read-only plumbing allowlist. Exact post-initialization container,
static-block class, aliased/star re-export, and external-diff regressions pass. Another
same-reviewer C0/H0 recheck is required before freeze.

The same reviewer's sixteenth recheck rejected those bytes `C0/H3/M0/L0`.
Capability and prototype fixed points still omit mutation-helper calls: both
`Object.assign(target, source)` and `Reflect.set(target, key, value)` can place `fetch`
or a built-in prototype in a later named export without propagating the fact. Process
launchers nested in an exported object or returned by an exported function also escape
the exporter-boundary check. Finally, validating only the first Git argument permits
`git show --ext-diff` to execute an external helper. The seventeenth remediation now
projects `Object.assign`, `Reflect.set`, `Object.defineProperty`,
`Object.defineProperties`, and `Reflect.defineProperty` target/value relationships
through one conservative helper shared by capability and built-in-prototype analysis.
The capability fixed point also carries process-launcher facts through nested exported
containers and function/class returns. Direct Git exec-file exceptions now require a
statically resolved command-specific read-only argument shape; unresolved arguments,
unrecognized positions, and external-execution options fail closed. Exact regressions
cover the reviewer's two mutation-helper capability examples, both prototype examples,
nested/returned `spawn`, and `git show --ext-diff HEAD`.

Focused seventeenth-remediation checks passed on the working tree:

- `npx tsc --noEmit`;
- `node --import tsx scripts/test-p9-evidence-v2.ts`;
- `node --import tsx scripts/p9-trusted-proof.ts --mode=self-test`;
- `node --import tsx scripts/test-production-authority.ts`; and
- root `git diff --check`.

These focused results are not candidate acceptance evidence. A fresh read-only
independent C0/H0 prefreeze review and the complete locked replacement verification
remain required before freeze.

Fresh-context reviewer `/root/rev7_prefreeze_17` rejected the seventeenth-remediation
working tree `C0/H3/M0/L0`:

1. a mutation target returned by a stable local function, such as `selectedBox()`, had
   no direct root identifier, so both capability and prototype facts were discarded;
2. anonymous default functions returning `spawn` and namespace re-exports from
   `node:child_process` escaped process export facts; and
3. the Git exception ignored exec-file options, allowing `{ shell: true }` to turn a
   nominally read-only Git call and metacharacter-bearing argument into shell execution.

The eighteenth remediation resolves stable local function/const-call targets into the
complete set of returned root identifiers before applying shared mutation-call facts.
It binds anonymous default-function return facts and rejects namespace child-process
re-exports. Git exec-file exceptions now require both a statically resolved,
command-specific read-only argument list and a narrow options object containing only
`cwd`, `encoding`, or `stdio`; shell, spread, computed, callback, and unknown options
fail closed. Safe Git values also reject shell metacharacters. Exact regressions cover
`Object.assign(selectedBox(), ...)`, `Reflect.set(selectedBox(), ...)`, both call-selected
prototype forms, anonymous-default and namespace process exports, and the reviewer's
`{ shell: true }` Git probe.

Focused TypeScript, evidence-v2, trusted-proof self-test, production-authority, and root
whitespace checks pass after this remediation. These are still working-tree results;
the same reviewer must return C0/H0 before freeze.

The same reviewer's eighteenth-remediation recheck closed the prior exact variants but
rejected the working tree `C0/H3/M0/L0`:

1. a stable const alias of a mutation-target selector function did not resolve to the
   selector's returned root, erasing capability/prototype/process facts;
2. a local function returning `spawn` could be immediately invoked without entering the
   direct child-process binding classifier; and
3. CommonJS `module.exports = { run: spawn }` remained outside ESM-only export/import
   propagation even though `.cjs` files are in the runtime scan.

The nineteenth remediation recursively resolves stable callable aliases when deriving
mutation roots, extends the process-binding fixed point with local function/arrow return
capabilities, and fails closed on CommonJS process exports at the exporting file while
also deriving CommonJS default/named facts for module analysis. Direct regressions cover
an aliased call-selected network container, the equivalent prototype shape, immediate
invocation of a locally returned launcher, and a two-file CommonJS exporter/consumer.
Focused non-incremental TypeScript and the complete evidence-v2 adversarial suite pass;
the same reviewer must recheck the exact bytes before freeze.

The same reviewer's nineteenth-remediation recheck closed the prior exact variants but
rejected the working tree `C0/H3/M0/L0`:

1. `module.exports.run = spawn` and mutation-helper writes to `module.exports` remained
   outside CommonJS exporter facts;
2. parenthesized, conditional, nested-IIFE, and object-method process-return wrappers
   could still execute a launcher without classification; and
3. a mutation-helper source containing `getTransport()` lost the local wrapper's
   network fact when the whole source was an object container.

The twentieth remediation binds exact and member CommonJS exports plus shared
`Object.assign`/`Reflect.set` projections at the exporter boundary. Process-method
resolution now unwraps transparent syntax, follows logical/conditional expressions,
inspects function expressions and object methods, and derives named local functions at
any nesting depth. Mutation-value analysis merges every nested local callable fact
before propagating the shared projection. New regressions cover all three CommonJS
export forms and their consumer, four equivalent local process-return calls, and the
local `getTransport()` mutation value in a complete cross-module Sheets writer. Focused
typecheck, evidence-v2 tests, trusted-proof self-test, authority tests, and whitespace
validation pass. Same-reviewer C0/H0 recheck remains mandatory before freeze.

The same reviewer's twentieth-remediation recheck closed every prior exact reproducer
but rejected the working tree `C0/H2/M0/L0`:

1. process capabilities stored in a named object, class field/method, array, or
   destructured binding did not enter the direct process-binding map; and
2. a stable alias of `module.exports` or `exports` erased assignment and mutation-helper
   CommonJS export facts.

The twenty-first remediation derives contained process methods from every local binding
pattern and class at a fixed point, then conservatively treats members of a bound
process-capability container as process-capable. CommonJS analysis now derives stable
const export-root aliases and uses the same alias map for direct member assignment,
`Object.assign`, `Reflect.set`, and module export facts. Regressions cover named object
values/methods, class fields/methods, arrays, destructuring, aliased `module.exports`,
aliased `exports`, and both shared mutation helpers. Focused typecheck and evidence-v2
tests pass; same-reviewer C0/H0 recheck remains mandatory before freeze.

The same reviewer's twenty-first-remediation recheck closed the named direct-container
and top-level const-alias controls but rejected the working tree `C0/H2/M0/L0`:

1. numeric, computed, and nested access into a bound process-capability container still
   required a direct identifier base and statically resolved member; and
2. CommonJS alias derivation remained limited to top-level unwrapped const identifiers,
   excluding let/var, parenthesized, destructured, and scoped aliases.

The twenty-second remediation propagates a bound container's process method through
arbitrary property/element access depth and no longer requires a static member when the
base is already process-capable. CommonJS property-chain normalization unwraps
transparent expressions; alias discovery scans every scope and declaration kind and
binds `{ exports: alias } = module`. New top-level computed/numeric/nested process tests
ensure call resolution itself fails closed without relying on exported-function facts.
CommonJS regressions cover let, var, parenthesized, destructured, and IIFE-local aliases.
Focused non-incremental typecheck and evidence-v2 tests pass; same-reviewer C0/H0
recheck remains mandatory before freeze.

The same reviewer's twenty-second-remediation recheck closed the prior exact variants
but rejected the working tree `C0/H2/M0/L0`:

1. process capabilities passed as call arguments or installed after container
   initialization could still escape, including `invoke(spawn)`, `identity(spawn)()`,
   property assignment, mutation helpers, and array insertion; and
2. CommonJS export roots acquired by later assignment, conditional/logical selection,
   local function return, or a containing object were not carried into export facts.

The twenty-third remediation treats any call receiving a contained process capability
as an unknown writer boundary and propagates process facts through later assignment
roots. CommonJS alias analysis is now a fixed point over declarations, assignments,
conditional/logical expressions, local function/class returns, and nested containers.
Exact top-level regressions avoid exported-function facts and cover argument passing,
returned argument identities, property assignment, `Object.assign`, `Reflect.set`, and
array insertion. CommonJS regressions cover assignment-created, conditional, logical,
function-returned, container-held, and mutation-helper aliases. Non-incremental
TypeScript, the complete evidence-v2 adversarial suite, trusted-proof self-test,
production-authority tests, and root whitespace validation pass on these working-tree
bytes. Same-reviewer C0/H0 recheck remains mandatory before freeze.

The same reviewer's twenty-third-remediation recheck closed both prior families but
rejected the working tree `C0/H2/M0/L0`:

1. `new Invoke(spawn)`, a tagged template receiving `spawn`, and a launcher yielded by
   a generator transferred process capability through syntax outside
   `CallExpression`; and
2. CommonJS export roots passed to a local installer, placed in an array/destructuring,
   or returned inside a call-built container did not reach exporter facts.

The twenty-fourth remediation classifies process capability in constructor arguments
and tagged-template substitutions, and carries both return and yield values through the
process fixed point. CommonJS alias discovery now recursively observes every expression
inside calls and containers, maps local call/new arguments to callable parameters, and
fails closed whenever a CommonJS `module.exports` boundary shares a module with any
direct or namespace child-process capability. Exact regressions cover all constructor,
tagged-template, generator, installer-call, array, destructuring, and call-built
container probes. Non-incremental TypeScript, the complete evidence-v2 adversarial
suite, trusted-proof self-test, production-authority tests, and root whitespace
validation pass on these working-tree bytes. Same-reviewer C0/H0 recheck remains
mandatory before freeze.

The same reviewer's twenty-fourth-remediation recheck closed every prior exact and
equivalent form but rejected the working tree `C0/H2/M0/L0`:

1. computed `child_process` specifiers and alternate `module.require` or
   `process.getBuiltinModule` loaders escaped the literal-import binding graph; and
2. `node:worker_threads` `Worker` construction could execute a data-URL module with
   global `fetch` without entering dynamic-execution or writer inventory.

The twenty-fifth remediation statically normalizes concatenated strings, template
expressions, and literal-array joins; recognizes `require`, `module.require`, and
`process.getBuiltinModule`; and conservatively carries unresolved loader/container
forms into the same fixed point. It models direct, namespace, require, returned, and
exported `Worker` capability from both `worker_threads` specifiers and rejects worker
construction/calls in both writer inventory and runtime closure. Exact regressions
cover all four alternate child-process acquisitions and the reviewer's executable
data-URL worker. Non-incremental TypeScript, the complete evidence-v2 adversarial suite,
trusted-proof self-test, production-authority tests, and root whitespace validation
pass on these working-tree bytes. Same-reviewer C0/H0 recheck remains mandatory before
freeze.

The same reviewer's twenty-fifth-remediation recheck closed all direct computed-loader
and Worker forms but rejected the working tree `C0/H2/M0/L0`:

1. loader aliases, returned/bound/reflected loaders, comma selection, `createRequire`,
   and module names computed separately from the invocation still escaped; and
2. `cluster.fork`, internal `process.binding('spawn_sync')`, Node module `_compile`, and
   inspector `Runtime.evaluate` were additional executable Node primitives outside the
   two-module model.

The twenty-sixth remediation establishes one fail-closed Node-execution boundary used
by both writer inventory and runtime closure. A `require` value is unsafe whenever it
is transferred rather than used as a direct statically safe call; dynamic direct
loaders, `module.require`/`process.getBuiltinModule` transfers, and any `createRequire`
surface are rejected. Execution-capable `cluster`, `inspector`, `module`, `repl`, and
`vm` module boundaries plus `process.binding`, `process.dlopen`, and `_compile` are
rejected independent of the eventual call spelling. Exact regressions cover every
loader alias and Node primitive reported by the reviewer. Non-incremental TypeScript,
the complete evidence-v2 adversarial suite, trusted-proof self-test,
production-authority tests, and root whitespace validation pass on these working-tree
bytes. Same-reviewer C0/H0 recheck remains mandatory before freeze.

The same reviewer's twenty-sixth-remediation recheck closed the prior loader aliases
and direct Node primitives but rejected the working tree `C0/H3/M0/L0`:

1. dynamic/computed namespace members plus rest/computed destructuring still erased
   child-process and Worker capability;
2. aliases of `process.binding`, `process.dlopen`, and `_compile`, together with the
   `inspector/promises` subpath, bypassed spelling-local execution checks; and
3. direct static loading of a native `.node` addon admitted opaque executable code that
   the JS/TS runtime source closure cannot inspect.

The twenty-seventh remediation makes any unresolved member of a known process/Worker
namespace fail closed, binds rest destructuring as a namespace, and binds every
unrecognized computed destructure as an unknown executable capability. The shared
Node-execution rule now rejects dangerous member names in property, binding, and
statically composed forms, treats execution-capable module subpaths as unsafe, and
recognizes `inspector/promises`. Direct `.node` imports/loads are rejected and tracked or
discovered native addons now fail the runtime-source enumeration itself. Exact
regressions cover every reported dynamic member, alias, subpath, and native-addon form.
Non-incremental TypeScript, the complete evidence-v2 adversarial suite, trusted-proof
self-test, production-authority tests, and root whitespace validation pass on these
working-tree bytes. Same-reviewer C0/H0 recheck remains mandatory before freeze.

The same reviewer's twenty-seventh-remediation recheck closed the prior declaration
forms, direct Node aliases, subpaths, and native addons but rejected the working tree
`C0/H4/M0/L0`:

1. assignment-form computed destructuring still erased child-process and Worker facts;
2. assignment-form primitive destructuring and a truly dynamic `process[...]` selector
   escaped the unsafe-execution rule;
3. extensionless, nonstandard-extension, and package-main CommonJS files executed bytes
   excluded from source enumeration; and
4. outside-web, absolute, and undeclared-package imports were silently unresolved even
   though their top-level code can execute.

The twenty-eighth remediation extends assignment-root discovery through object/array
patterns and binds process-module destructuring as an unknown executable capability.
The unsafe-execution rule also recognizes assignment-pattern primitive names and truly
dynamic direct `process[...]` access. A shared runtime-module boundary now checks every
static/dynamic import, export, direct require, `module.require`, and
`process.getBuiltinModule` against the enumerated source set, safe data extensions,
Node built-ins, and the locked package allowlist. Unresolved local representations,
paths outside the web closure, absolute/URL modules, and undeclared packages fail
closed in both writer inventory and the runtime-source proof. Exact regressions cover
every reported assignment, representation, and unresolved-boundary probe.
Non-incremental TypeScript, the complete evidence-v2 adversarial suite, trusted-proof
self-test, production-authority tests, and root whitespace validation pass on these
working-tree bytes. Same-reviewer C0/H0 recheck remains mandatory before freeze.

The same reviewer's twenty-eighth-remediation recheck closed every prior assignment and
unresolved-boundary form but rejected the working tree `C0/H3/M0/L0`:

1. TypeScript `import x = require(...)` was absent from both module-boundary and
   process/Worker acquisition analysis;
2. a declared package root was treated as intrinsically safe, allowing `tsx/esm/api`
   or a local `file:` dependency to load executable source outside the closure; and
3. CommonJS executed JavaScript bytes with `.css` and uppercase `.JSON` suffixes, while
   the shared boundary treated all apparent data/asset suffixes as safe and did not
   reject their symlinks.

The twenty-ninth remediation includes `ImportEqualsDeclaration` and external module
references in both boundary and process namespace analysis. The package allowlist now
requires a non-local declaration plus a lockfile entry with SHA-512 integrity, and
loader/compiler package roots such as `tsx`, `ts-node`, `jiti`, `esbuild`, `vite`, and
webpack fail closed regardless of declaration. Asset/data suffixes are safe only for
ES module import/export semantics; every CommonJS relative load must resolve to an
enumerated JS/TS file, so CSS, case-variant JSON, symlink, and package-main executable
representations are rejected. Exact regressions cover the three ImportEquals cases,
the existing declared `tsx` loader API, and executable CSS/uppercase-JSON probes.
Non-incremental TypeScript, the complete evidence-v2 adversarial suite, trusted-proof
self-test, production-authority tests, and root whitespace validation pass on these
working-tree bytes. Same-reviewer C0/H0 recheck remains mandatory before freeze.

Fresh-context reviewer `/root/rev7_prefreeze_safe` then statically reviewed the
twenty-ninth-remediation tree after the earlier reviewer became unavailable and
rejected it `C0/H4/M0/L0`:

1. `export =` and `import x = require(...)` were boundary-checked but omitted from
   cross-module runtime-fact propagation;
2. a computed assignment pattern could still extract an opaque Node primitive because
   only recognized member spellings were rejected;
3. an integrity-bearing `npm:` alias could hide a prohibited loader behind a benign
   declared package name; and
4. the ES-module asset exemption trusted only a suffix, before containment, existence,
   realpath, query/fragment, case, JSON parse, or symlink checks.

The thirtieth remediation derives both writer and built-in-prototype facts through
`export =` and ImportEquals modules, including local identifier resolution. Any computed
property in an assignment destructuring pattern now fails closed at the shared Node
execution boundary. Only semver-like, non-alias registry declarations with SHA-512
lockfile integrity can enter the package allowlist; `npm:` aliases are rejected before
the visible-name loader denylist. The ESM asset path now rejects query, fragment, and
percent-encoded forms; resolves inside the repository; requires an existing regular
non-symlink whose realpath is identical; checks a lowercase exact asset extension; and
parses JSON before treating it as data. Exact regressions cover split `export =` writer
facts, computed primitive assignment, an integrity-bearing `npm:tsx` alias, and a
query-disguised asset import. Non-incremental TypeScript, the complete evidence-v2
adversarial suite, trusted-proof self-test, production-authority tests, and root
whitespace validation pass on these working-tree bytes. Fresh C0/H0 prefreeze recheck
remains mandatory before freeze.

The same fresh reviewer rechecked the thirtieth-remediation tree and rejected it
`C0/H1/M1/L0`. Computed assignment destructuring was closed, but the equivalent
computed property in a variable-declaration or function-parameter binding pattern could
still extract an opaque Node primitive. The medium finding identified missing direct
regressions for prototype propagation through export/import-equals, an integrity-bearing
local dependency, and ESM asset symlink/containment handling.

The thirty-first remediation rejects every computed property name used by a binding
element, covering declarations and parameters independently of the bound value's later
spelling. Exact top-level regressions cover both declaration and parameter forms. The
suite now also exercises an export-equals/import-equals built-in-prototype alias across
the runtime closure, an integrity-bearing `file:` dependency, and an apparent JSON
asset symlink; each fails closed at its intended boundary. Non-incremental TypeScript,
the complete evidence-v2 adversarial suite, trusted-proof self-test,
production-authority tests, and root whitespace validation pass on these working-tree
bytes. Fresh C0/H0 prefreeze recheck remains mandatory before freeze.

The same reviewer's thirty-first-remediation recheck closed the prior high and all
three medium coverage gaps but rejected the working tree `C0/H1/M0/L0`: a computed
property in an existing-object destructuring target used by `for...of` or `for...in`
is neither a binding element nor a binary-assignment left side, so it remained outside
the shared rejection rule.

The thirty-second remediation treats a computed property beneath any `for...of` or
`for...in` statement as an unsafe execution boundary, covering loop-assignment
destructuring without relying on the eventual primitive spelling. An exact `for...of`
regression joins the binary-assignment, declaration, and parameter controls.
Non-incremental TypeScript, the complete evidence-v2 adversarial suite, trusted-proof
self-test, production-authority tests, and root whitespace validation pass on these
working-tree bytes. Fresh C0/H0 prefreeze recheck remains mandatory before freeze.

Fresh-context read-only reviewer `/root/rev7_prefreeze_safe` rechecked the stable
thirty-second-remediation tree and returned `PASS C0/H0/M0/L0`. The reviewer confirmed
that the shared ancestor rule rejects computed assignment destructuring beneath both
`for...of` and `for...in` (including `for await...of`), that the exact `for...of`
regression passes, and that the complete baseline diff contains no remaining finding.
The prefreeze C0/H0 gate is satisfied. No review disposition is required because the
reviewer reported no medium or low findings.

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

The replacement prefreeze matrix completed on 2026-08-31. Kelsey first ran exact
`CI=1 NEXT_TELEMETRY_DISABLED=1 npm run build` in an ordinary laptop Terminal against
this worktree. Next.js 16.3.3 Turbopack compiled in 1,518 ms, completed TypeScript,
collected page data with 11 workers, generated all 10 static pages, finalized the route
set, and exited zero. The normalized user-supplied transcript is retained at
`/private/tmp/plan-rev7-final-build-user-transcript.log`, SHA-256
`15745de1930d4dad2d7d70ed37313b3150eaf0177301b6087bdc0801065484f6`.
It is identified as a user-supplied transcript rather than an agent-captured raw log.
Earlier sandbox-only Turbopack worker/port failures and the rejected broad-worker route
are not represented as successful build evidence.

The agent-captured locked window then ran from `2026-08-31T21:49:06Z` through
`2026-08-31T21:52:28Z`:

- `npm ci` added 462 packages from the locked graph and exited zero.
- Production-authority tests, the complete evidence-v2 adversarial suite, trusted-proof
  self-test, and `npm run typecheck` all exited zero.
- Both direct plan validation and `npm run plan:check` reported exactly the three
  permitted pre-attestation absences: Revision 7 manifest, Revision 7 review, and the
  committed direct-child attestation. No other plan error appeared.
- `npm test` passed the complete P0-P8 suite plus every Revision 7/P9-boundary control.
  P8 monitoring again reported `targets=1028`, `recovery=complete`, and
  `schedule=disabled`.
- Full-tree and production-only registry audits each reported zero vulnerabilities.
- Both workflow files parsed as YAML. Working-tree and complete baseline-range
  whitespace checks passed.
- Static scans proved an empty `web/src` runtime diff, no production spreadsheet ID in
  runtime source, no committed workflow schedule/cron, P8 `enabled: false`, and no
  Revision 7 change to the P8 plan or operations runbook.
- Authenticated account `whitefishscholarship` fetched live `refs/heads/main` at exact
  baseline `5c6040e332127ef2cdfe04bbb1cc9bdff4f5eecd`. Accepted P8 attestation
  `20eeb53c80fce4e79a689128918a12361233aa7b` remains the direct child of candidate
  `cc69d276c85f931499a23a5abde623bda321e0c0` and adds exactly the P8 manifest/review.
- The complete baseline range contains exactly the 17 candidate paths enumerated above.

Retained final log SHA-256 values are: locked install
`f081b039c18baa696ef7c950259785f54f29efe21cc2d35cd6af2847f54ca26c`;
authority `36865d4ad49cd1caae726668ccac523a9dd6e321f35b7d0b6bb90ad64ff3b74c`;
evidence-v2 `d030acbbfe74654afecf61ba7d2de7aa9a65a052ad6282d9f97a0cf3c2cec92f`;
trusted proof `2de0958ccec1b89d7f7c73bd4cecd2f31389fe4d2fc026170710b6911c5b2066`;
typecheck `770863d71034923cbaea0551c18e53fb0f4f65c9e7196c0096c7376c3ed21de0`;
plan wrapper `1821b86924adb78c5630bb31575586e209c27a5ced2b23d8300606790872aa46`;
direct validator `b35caab6d2fa1c1b6e1b29a4a0541e73a3504c6e153c4f55fc13213083df2a20`;
full tests `a7cc087f54061a38c1dcb5a3e58d433489e2ffd35c34e6271b6b092247d0559f`;
each audit `1044a973997ecbdba6998ed9a7184c06aa7e74943868b41ebeb1793066122749`;
YAML `2fe60d6e424665f361b069fb4f17c5b6ec98e4d7d5f0e3f47d2aca9309466407`;
static scan `5a68be2ffb8bbdbd3c939ed83f659f505d675c57bdb967bb126b588bb51d5281`;
each whitespace check `349fa6491d9a99d4421f70f32c10f60a565611fe8d822cbf247dc760cde7cb2a`;
path set `a87dbe6df764b55de59cfd078f5a00b0343bccab2e01d652615872bb059e1403`;
and authenticated topology
`4ff2b4670d1626d8c067fe91863284663f3f3df70e73b5f8bc6d6b3595cc8334`.

These results satisfy prefreeze verification. They verify code and governance behavior,
not live scholarship freshness or any P9 production capability. No Google, Drive,
Sheets, Vercel, workflow-dispatch, configuration, spreadsheet, form, provider, or
applicant-data operation occurred.

Fresh-context read-only reviewer `/root/rev7_prefreeze_safe` then rechecked the final
post-verification documentation bytes and returned `PASS C0/H0/M0/L0`, explicitly
permitting immutable replacement-candidate freeze. The reviewer confirmed the
thirty-second-remediation guard/tests remain intact; the baseline range is exactly the
documented 17 paths with no `web/src` runtime change; every retained log digest matches;
the build transcript is accurately qualified as normalized user-supplied evidence;
the authenticated baseline/P8 topology record is supported without overstating
provider access; and P9 remains planned and unstarted. No medium/low disposition is
required.

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
