# Current Handoff

Last updated: 2026-08-26
Plan revision: 6
Repository: `whitefishscholarship/program_code`
Default branch: `main`

## Current Revision 6 state

- Active stage: none; P3 must not start.
- Verified delivered Revision 5 `origin/main` and Revision 6 baseline:
  `cc7760d51f1460728e85a9b1fc0921d30320a541`.
- Revision 5 exact clean-clone candidate:
  `a9b656b93cfa398a2badd1c1ef3f61f860979ac3`.
- Revision 5 canonical delivered attestation:
  `06d9e3ff4bcfff8b0fe0b2bc728ed8aeb9320000`.
- Revision 5 merged through PR #14 at `2026-08-25T22:37:58Z`; PR CI and post-merge
  main CI passed, Vercel Production completed, and Preview was blocked by the existing
  Franscale1922 project-access rule. No deployment configuration changed.
- Revision 6 branch: `codex/plan-rev6-p2-package-resolution`.
- Revision 6 candidate and attestation: pending freeze, independent review, and exact
  direct-child two-file attestation.
- The candidate cannot embed its own content-derived SHA. After freeze, the complete
  uncommitted manifest will bind that exact SHA for independent review; changing this
  handoff afterward would create a replacement candidate.
- Exact P2 candidate: `1a6376207eb467ff0977298de16a1c0d0db1b3cd`.
- Exact P2 attestation: `cc277b34075f6d648ff3c71022fadf6a6c632b34`.
- P2 manifest SHA-256:
  `4d47d562e26efe249f6a7be0ed656f1fddc1a17233378254772019cacd49ee8a`.
- A clean P2 merge from `cc7760d` was attempted without committing. It produced the
  expected conflicts in `docs/BUILD_STATE.json` and this handoff plus a substantive
  `web/package.json` conflict. The merge was safely aborted; no P2 integration commit,
  review, attestation, push, PR, merge, or deployment occurred.
- On 2026-08-26 Kelsey Stuart explicitly authorized Plan Revision 6 to add only
  `web/package.json` as P2's third integration-resolution path, preserve every Revision
  5 test command, and add only P2's exact model scripts and test command. The authority
  covers Revision 6 review/attestation/Git/Vercel delivery and subsequent exact P2
  delivery, with all recorded exclusions unchanged.
- Production spreadsheet ID remains unset; all spreadsheet mutation remains
  unauthorized. No product/runtime, CI, deployment-configuration, form, provider, P9,
  production-data, paid/destructive, or P3 effect is in scope.
- Revision 6 pre-freeze verification passed from `2026-08-26T15:24:58Z` through
  `2026-08-26T15:26:21Z`: locked install, non-incremental typecheck, complete tests,
  production build, and root diff check all passed. Prospective plan validation
  reported exactly the expected missing Revision 6 manifest, review, and committed
  attestation. Exact command outcomes and the unchanged audit denominator are recorded
  in `docs/evidence/PLAN-REV6.md`.

## Plan Revision 6 amendment

The Revision 4 P2 integration allowlist permitted only `BUILD_STATE` and the handoff.
That was sufficient before Revision 5, but frozen P2 and delivered Revision 5 now both
change `web/package.json`: P2 adds `p2:model`, `p2:model:check`, and its model test,
while Revision 5 adds governance-history tests. Taking either merge side would discard
an accepted test gate.

Revision 6 permits `web/package.json` only for exact P2 and validates a deterministic
result reconstructed from both immutable parents. The result starts with the complete
delivered baseline package, preserves every field and existing test command, copies
only P2's exact two model scripts, and appends only P2's missing model-test command.
Dependencies, lockfiles, metadata, other scripts, and arbitrary conflict resolution are
forbidden. Dedicated tests reject omission of either governance or P2 tests, mutation
of P2 commands, and unrelated package changes.

Current required next actions:

1. Complete Revision 6 evidence and full verification, freeze the exact candidate,
   generate its complete manifest, obtain fresh-context read-only acceptance, and add
   only the manifest/review direct-child attestation.
2. Push, open, verify, and merge Revision 6; verify Preview/Production outcomes.
3. Rebuild exact P2 with delivered Revision 6 `origin/main` as first parent and exact
   `cc277b3` as second parent. Resolve only `BUILD_STATE`, this handoff, and the exact
   deterministic `web/package.json` union.
4. Run the complete P2 matrix, freeze, manifest, obtain a separate fresh review,
   attest, push, open, verify, and merge P2. Stop before P3.

## Historical Revision 5 candidate state

- Active stage: none; P3 must not start
- Verified delivered Revision 4 baseline and current `origin/main`:
  `08cb6809425036991400b539ca23a34915b3fe26`
- Current replacement Revision 5 branch: `codex/plan-rev5-standing-mandate-ci`
- Preliminary Revision 5 candidate `4f034bb5eaedb64c16f76665aaf6057c2565416c`
  was independently rejected C0/H1/M0/L0 because its presence-only guard was not
  durably bound to immutable history. It must never be attested or delivered.
- First accepted replacement candidate `17dd49f2e2b2b96e628df802f2562479dcf435db`
  and direct-child attestation `ec1737670be24e23ada3f377eb75c34b1747898c`
  remain byte-for-byte on the first delivery branch. PR #13 was not merged because a
  clean GitHub runner lacked the unpublished P2 object required by the new test.
- Clean-clone replacement Revision 5 candidate: pending freeze. Its exact post-freeze SHA will be bound by
  `docs/evidence/PLAN-REV5-manifest.json`; a commit cannot embed its own content-derived
  identity.
- Revision 5 attestation: pending; it must be the candidate's direct child and add
  exactly `docs/evidence/PLAN-REV5-manifest.json` and
  `docs/reviews/PLAN-REV5.json`.
- Preliminary P2 integration `6ff2acb83c75c254f559192ebdd23bc75eb4e10e` is local,
  unpublished, unreviewed, unattested, and invalid for delivery because the required
  history regression test exposed a latest-state equality defect. It will be rebuilt
  cleanly from delivered Revision 5 `origin/main`.
- Accepted P2 candidate: `1a6376207eb467ff0977298de16a1c0d0db1b3cd`
- Canonical P2 attestation: `cc277b34075f6d648ff3c71022fadf6a6c632b34`
- P2 manifest SHA-256:
  `4d47d562e26efe249f6a7be0ed656f1fddc1a17233378254772019cacd49ee8a`
- P2 delivery: directly authorized but integration pending; P2 is not yet delivered to
  `origin/main`. Candidate and attestation remain byte-for-byte unchanged.
- Preserved P1 candidate: `92ee21095e959bd19ab641752308c0fd9b394b22`
- Preserved P1 attestation: `20476b8384cfbda6aaa04a3da4b7f0a3fbd291e5`
- P1 delivery candidate: `464eece0c05c97e014cca0955f0ab92998c1d97c`
- P1 delivery attestation: `e4541a9b845758309031f00cd1958c96b4de4a27`
- Durable P1 completion gate: satisfied on verified `origin/main`
- Verified P1 baseline: `d374247156e3ed15d19c037473da8f76ceedb6ab`
- Production spreadsheet: unset; mutation unauthorized
- Revision 4 candidate: `8881085e668bd268f92c6b1dc835eb4e194e6fd2`
- Revision 4 attestation: `fb82df5a20e0eb7ce7cb0830e40709b6ca4f81fd`
- Revision 4 merged through PR #12 at `08cb6809425036991400b539ca23a34915b3fe26`;
  PR/main CI passed and Vercel Production completed. Preview was attempted but blocked
  by the existing Vercel author-access rule; no configuration changed.
- External data, product, or deployment-configuration mutations during Revision 5: none

## Historical Plan Revision 5 amendment (delivered)

Revision 5 fixes only the regression test's invalid assumption that current state must
differ from every historical delivery state. The newest exact delivery candidate may
correctly be current state; older states may differ after later evolution. The revised
test rejects deletion, downgrade, and rebinding for every accepted integration,
revalidates every immutable historical candidate, rejects historical mutation, and
adds a prospective latest-equality case. Production validator behavior and acceptance
criteria do not change for delivery history. The replacement validator independently
discovers canonical plan amendments from their Git attestations, rejects revision
rollback and amendment removal/change, and binds every field of the P3-P8 standing
authorizations plus the exact mandate evidence blob to the immutable Revision 5
candidate. Revision 5 has no revocation path; any future revocation or supersession
requires separately informed authority and a new reviewed machine mechanism.

Revision 5 also records Kelsey's approved standing operating mandate. After P2 is
delivered, P3-P8 may proceed in order without repeated authorization for ordinary
stage-scoped implementation, fresh review, commits, push, pull request, merge, and
resulting Vercel deployments. Public pages/documents and the pinned testing spreadsheet
may be read only when the active stage requires bounded input. Individual P3-P8
delivery records in `BUILD_STATE` bind the shared authority evidence.

Reserved effects still require new direct authority: any spreadsheet write; P9 or
production spreadsheet identity/access/migration; deployment-configuration or schedule
changes; paid/destructive actions; secrets; force-push or published-history rewrite;
forms/application interactions; provider contact; gate weakening; and material scope
expansion. P5 cannot perform its required writes, and P8 cannot configure schedules,
under the standing mandate alone.

Revision 5 must be verified, frozen, independently accepted, attested, and delivered
before the P2 integration is rebuilt. P3 remains prohibited until exact P2 is delivered
on verified `origin/main`.

Pre-freeze verification completed through `2026-08-25T21:59:46Z`; the only subsequent
candidate changes are this durable handoff record and its matching evidence record.
`npm ci`, typecheck, and the complete test suite passed. The strengthened history test
covered a two-integration fixture, every deletion/downgrade/rebind case, prospective
latest-state equality, later non-integration evolution, exact historical candidates,
and historical mutation rejection. Prospective plan validation reported only the three
expected absent Revision 5 manifest/review/attestation gates. The restricted build
failed only on existing Google Fonts network access; the authorized retry passed and
changed no configuration. `git diff --check` passed. `HEAD` and `origin/main` were exact
`08cb680`; exactly nine Revision 5 paths were dirty at `2026-08-25T22:00:12Z`, and no
remote Revision 5 branch existed. After the final mandate-presence validator guard was
added, typecheck, the full suite, prospective plan validation, and the production build
passed again with the same
expected pre-attestation result. Exact UTC windows and outcomes are in
`docs/evidence/PLAN-REV5.md`.

The same fresh reviewer rejected preliminary candidate `4f034bb` at
`2026-08-25T22:09:15Z`, C0/H1/M0/L0, because the standing mandate was not yet
historically immutable. The implementation agent remediated that finding without
attesting or delivering the rejected candidate. Replacement typecheck, the complete
test suite, and prospective plan validation ran from `2026-08-25T22:16:30Z` through
`2026-08-25T22:16:54Z`: typecheck/tests passed, including every new governance-history
case, and plan validation reported only the expected missing review/attestation. The
network-enabled build passed from `2026-08-25T22:16:00Z` through
`2026-08-25T22:16:26Z`; `git diff --check` passed. The replacement has twelve candidate
paths and one uncommitted manifest path pending regeneration against the frozen SHA.

The reviewer then accepted exact candidate `17dd49f` at
`2026-08-25T22:21:36Z`, C0/H0/M0/L0, and exact attestation `ec17376` was pushed in PR
#13. Vercel Preview was blocked by the existing author-access rule. GitHub Actions run
`32905946430` failed the delivery-history test at `2026-08-25T22:24:41Z` because its
clean clone did not contain unpublished P2 candidate `1a63762`; the PR was not merged.
The production validator already handles an unreachable pending object and will require
the exact object when the later two-parent integration makes it reachable. The clean
replacement test uses exact P2 state when available and a deterministic accepted-stage
fixture otherwise. The failed branch remains unchanged and will not be force-pushed or
merged; no deployment configuration changed.

On the clean replacement, `npm ci` installed the same 565 locked packages with the
unchanged audit result. Typecheck, the full suite, and prospective plan validation ran
from `2026-08-25T22:28:18Z` through `2026-08-25T22:28:39Z`: typecheck/tests passed,
including the always-exercised portable latest-state fixture and locally reachable exact
P2 path, while plan validation reported only the expected missing manifest, review, and
attestation. The network-enabled build and `git diff --check` passed through
`2026-08-25T22:29:08Z`. The complete replacement remains confined to the same twelve
authorized governance, validator, test, evidence, and handoff paths.

Historical Revision 5 next actions (completed or superseded by Revision 6):

1. Complete replacement Revision 5 verification, freeze its candidate, regenerate the complete
   manifest, obtain fresh-context read-only acceptance, and create the direct-child
   two-file attestation.
2. Push, open, verify, and merge Revision 5 under the approved Git/Vercel authority.
3. Create a new clean P2 integration branch from delivered Revision 5 `origin/main`;
   use exact `cc277b3` as second parent and reconcile only `BUILD_STATE` and this
   handoff.
4. Run the complete P2 matrix, freeze, manifest, obtain a separate fresh review, attest,
   push, open, verify, and merge P2. Stop before P3.

## Historical Plan Revision 4 amendment (completed)

Revision 4 enables the existing independently reviewed delivery-integration mechanism
only for exact P2 candidate `1a63762` and exact attestation `cc277b3`. It preserves both
commits, their manifest and review, and all prior P0/P1/Revision 2/Revision 3 history
byte-for-byte. The amendment changes only governance and documentation.

Kelsey Stuart directly authorized the amendment's commits, independent review, push,
pull request, merge, and resulting Vercel Preview and Production deployments. After
Revision 4 is delivered, Kelsey directly authorized the exact P2 integration's push,
pull request, merge, and resulting Vercel deployments. The authority excludes P3
implementation, spreadsheet access or writes, product or deployment-configuration
changes, form submissions, application interactions, and provider contact.

The Revision 4 request for a future preauthorization mechanism was not treated as
unbounded authority. Revision 5 now records the separately approved bounded mandate;
its current terms above supersede this historical pending statement.

P2's fresh-context reviewer accepted exact candidate `1a63762` against baseline
`6a6d643` with critical 0, high 0, medium 0, low 1. The sole low finding was stale
August 24 provenance headers in the frozen P2 governance documents. Its disposition is
to correct them in the first authorized P3 candidate governance update after P2 is
delivered and P3 entry authority is satisfied; it does not authorize starting P3.

Pre-freeze verification completed through `2026-08-25T17:06:16Z`; the only subsequent
candidate changes are this durable handoff record and its matching evidence record.

- `npm ci`: passed with 565 locked packages. The unchanged time-sensitive audit
  reported 21 findings (1 low, 7 moderate, 12 high, 1 critical); no dependency or
  lockfile changed.
- `npm run typecheck` and the complete `npm test` suite passed, including the exact P1
  digest and historical integration deletion/downgrade/rebind regression.
- Prospective `npm run plan:check`: after a restricted `tsx` IPC failure, the permitted
  retry reported exactly the three expected absent Revision 4 manifest, review, and
  committed-attestation errors.
- `npm run build`: the restricted attempt failed only on existing Google Fonts network
  access; the network-enabled retry passed and changed no configuration.
- `git diff --check`: passed.
- `HEAD` and `origin/main` were exact `6a6d643`; exactly seven Revision 4 paths were
  dirty and no remote Revision 4 branch existed.

Exact UTC command windows and outcomes are in `docs/evidence/PLAN-REV4.md`.

Historical Revision 4 next actions (completed or superseded by Revision 5):

1. Complete verification, freeze Revision 4, generate its complete manifest, obtain a
   fresh-context read-only review, and add only its manifest/review in the direct-child
   attestation.
2. Push, open, verify, and merge the authorized Revision 4 delivery.
3. From delivered Revision 4 `origin/main`, create the exact two-parent P2 integration
   with `cc277b3` as second parent; reconcile only `BUILD_STATE` and this handoff.
4. Complete checks, manifest, a separate fresh review, and the direct-child P2 delivery
   attestation; then push, open, verify, and merge the authorized P2 delivery.
5. Verify CI and Vercel effects. Do not start P3.

## Plan Revision 3 amendment

The validator formerly compared P1's exact derived delivery transition to the current
worktree `BUILD_STATE`. That made every normal P2 state change look like a historical P1
mutation. Revision 3 reads the P1 delivery candidate named by the existing attested
delivery manifest and compares that immutable candidate-tree state to the derived
transition. Current stage state may then advance through the existing state machine,
while all P1 objects, hashes, topology, authority, identities, and paths remain checked.
It also discovers every historically accepted integration from Git history and requires
its complete current record to remain exact, so deletion, downgrade, or rebinding cannot
silently disable validation. The canonical plan revision header is checked against
`BUILD_STATE` and covered by regression testing.

Revision 3 is `attestation-gated`: the machine record does not predeclare acceptance.
Only its exact manifest-bound fresh-context review and direct-child two-file attestation
can satisfy the validator. The amendment changes governance, validation, regression
tests, and documentation only. It does not alter product behavior, dependencies, CI,
deployment configuration, P1 artifacts, or scholarship data.

The unpublished worktree `/private/tmp/program_code-p2` remains dirty, local, paused,
and untouched. After Revision 3 delivery, P2 must be reconciled onto the new verified
`origin/main`, revalidated, frozen, manifested, and independently reviewed without any
push, pull request, merge, or deployment.

### Revision 3 verification

Pre-freeze checks completed through `2026-08-25T01:02:20Z`; the only subsequent
candidate changes are this durable handoff record and the matching evidence record.

- `npm ci`: passed, 565 locked packages; the existing time-sensitive audit count was
  21 (1 low, 7 moderate, 12 high, 1 critical), with no package or lockfile change.
- `npm run typecheck`: passed.
- `npm test`: passed, including P1 inventory digest
  `dc373a09d062ae6e5e03347ab391291ecc3dea427f90a21132e89cad113393e2`
  and, after review remediation, `delivery state history: PASS (1 accepted integration;
  deletion/downgrade/rebind rejected)` plus canonical plan/state revision agreement.
- `npm run build`: the restricted attempt failed only on existing Google Fonts network
  access; the authorized retry passed and changed no configuration.
- Prospective `npm run plan:check`: reported exactly the three expected absent
  Revision 3 manifest/review/attestation errors and no other error.
- `git diff --check`: passed.
- Before freeze, `HEAD` and `origin/main` were exact
  `be6644f5140c35de2075fa24782f81bf0449f0f6`; the 11 candidate paths were the only
  dirty paths, and no Revision 3 remote branch or pull request existed.

Exact UTC command windows and outcomes are in `docs/evidence/PLAN-REV3.md`.

After the rejected predecessor review, typecheck, the complete test suite, the
network-enabled production build, and `git diff --check` passed again through
`2026-08-25T01:15:15Z`. Prospective plan validation reported only the absent review and
attestation because the uncommitted predecessor manifest remained present pending
regeneration against the replacement candidate.

## Plan Revision 2 delivery integration

The delivered integration preserves P1 candidate `92ee210`, attestation `20476b8`, and
every non-governance P1 blob byte-for-byte. Its candidate `464eece` has first parent the
delivered Plan Revision 2 baseline and second parent exact `20476b8`; its direct-child
attestation is `e4541a9`. Revision 3 changes none of these objects.

## P1 result

The deterministic P1 inventory accounts for every populated record and every retained
information/application URL in the pinned snapshot:

- 197 records: 176 `Scholarship`, 21 `Portal`
- 278 URL-role occurrences: 86 information and 192 application
- 213 distinct sanitized URLs across 115 hosts
- 193 records with at least one URL and four explicit offline/campus/provider methods
- 74 records with multiple linked sources
- 26 shared normalized URL groups
- 86 information and 92 application hyperlinks visible only through CellData metadata
- 270 raw CellData hyperlink representations before filtering: 267 bound to retained
  information/application references and three sanitized excluded-Summary review items
- 162 records and 121 sources classified explicitly as `unknown`; 188 records and 207
  sources remain manual review with evidence/confidence provenance
- 15 sources retaining a potentially identity-bearing query or fragment after known
  tracking parameters were removed
- deterministic inventory digest:
  `dc373a09d062ae6e5e03347ab391291ecc3dea427f90a21132e89cad113393e2`

These counts exactly reconcile the plan's 197-row and 213-distinct-URL observations.
The report does not infer that one successful public fetch proves source completeness,
current scholarship facts, or production behavior.

## Candidate artifacts

- `web/fixtures/p1/master-database-cell-data.json` — sanitized bounded snapshot
- `web/fixtures/p1/public-source-observations.json` — seven representative read-only
  public observations with scope limitations
- `web/scripts/p1-capture-sheet.ts` — exact-ID, exact-range, read-only capture tool
- `web/scripts/p1-inventory-lib.ts` and `web/scripts/p1-inventory.ts` — deterministic
  inventory implementation
- `web/scripts/test-p1-inventory.ts` — count, completeness, sanitization, and repeat-run
  tests
- `docs/evidence/P1-inventory.json` — full sanitized deterministic report
- `docs/evidence/P1-repository-map.md` — static behavior map with file/line evidence
- `docs/evidence/P1-dependency-security.json` — time-stamped runtime/development audit
  baseline without package changes
- `docs/evidence/P1.md` — stage evidence and external-effects record
- `docs/kickoffs/P2-DATA-MODEL.md` — next-stage contract only; P2 was not executed

`docs/evidence/P1-manifest.json` and `docs/reviews/P1.json` were intentionally absent
from implementation candidate `92ee210`, then added as the only two paths in exact
direct-child attestation `20476b8`. The delivery integration preserves both blobs.

## Verification and review

- Development checks reproduced the inventory digest and exact counts.
- `npm ci` completed with the locked dependency tree. The audit snapshot reported 21
  total findings and 16 production findings; this is time-sensitive registry evidence,
  not proof of exploitability. No dependency or lockfile changed.
- P1-focused deterministic tests and TypeScript typechecking passed after the final
  sanitizer/classification correction.
- The first fresh-context read-only review rejected candidate `0e17291` with two high
  findings. The implementation agent added a pre-filter CellData completeness receipt
  and removed unsupported taxonomy promotion; only the replacement candidate's recheck
  can accept P1.
- The complete candidate verification matrix and exact timestamps are recorded in
  `docs/evidence/P1.md`; the final accepted reviewer outcome is authoritative only in
  `docs/reviews/P1.json`, bound to `docs/evidence/P1-manifest.json`.
- Exact attestation `20476b8` satisfies the original P1 manifest/review gate. Plan
  Revision 2 adds a separate delivery manifest/review gate for this integration.

### Delivery integration verification

The replacement delivery candidate was prepared only after the following pre-freeze
verification of its complete tree. The only subsequent candidate change is this
handoff's durable record of those results; the manifest binds the resulting exact
commit SHA and every changed blob for the independent recheck.

- `npm ci` from `web/`: passed from `2026-08-24T19:44:08Z` through
  `2026-08-24T19:44:16Z`; 565 locked packages installed and 21 time-sensitive audit
  findings reported (1 low, 7 moderate, 12 high, 1 critical). No dependency or
  lockfile change was made.
- `npm run typecheck` from `web/`: passed between `2026-08-24T19:44:22Z` and
  `2026-08-24T19:44:28Z`.
- `npm test` from `web/`: passed between `2026-08-24T19:44:22Z` and
  `2026-08-24T19:44:28Z`, including P1 inventory digest
  `dc373a09d062ae6e5e03347ab391291ecc3dea427f90a21132e89cad113393e2`.
- `npm run build` from `web/`: the restricted-network attempt from
  `2026-08-24T19:44:32Z` through `2026-08-24T19:44:52Z` failed only because Google
  Fonts could not be fetched; the authorized network-enabled retry passed at
  `2026-08-24T19:45:18Z`. It reported the existing missing Google service-account and
  sheet environment variables during static generation and changed no configuration.
- `git diff --check` from the repository root: passed at
  `2026-08-24T19:45:25Z`.
- Prospective `npm run plan:check` from `web/`: after a restricted local IPC attempt
  failed with `EPERM`, the authorized retry completed at `2026-08-24T19:45:36Z` and
  reported exactly the three expected pre-attestation errors: missing
  `docs/reviews/P1-delivery.json`, missing committed delivery attestation, and branch
  tip not yet equal to that attestation. No other plan error was reported.

Repository state observed at `2026-08-24T19:45:25Z`:

- `origin/main` was exact
  `015128616ffac9b453f8712f96c73530fbd9d805`.
- Local branch `codex/p1-delivery-integration` had no published remote branch or pull
  request and was four commits ahead of `origin/main` through rejected predecessor
  `354acea`.
- No tracked file was dirty before this handoff remediation. The only untracked path
  was the prepared, not-yet-attested `docs/evidence/P1-delivery-manifest.json`; it must
  be regenerated against the replacement candidate before review.
- The first delivery review rejected `354acea` with critical 0, high 0, medium 1,
  low 0 solely because this delivery verification and repository state were not yet
  durable in the handoff. The reviewer found no substantive topology, hash, state,
  authority, or scope defect.

## Data and side-effect boundaries

- The testing sheet was accessed read-only; no spreadsheet update, append, clear,
  formatting, permission, or metadata mutation was performed.
- The production sheet was not configured, read, or mutated.
- Seven public scholarship pages were fetched read-only for representative
  architecture observations. No login, interactive workflow, form submission, paid
  action, or provider contact occurred.
- Applicant PII, credentials, non-student review columns, private service-account
  material, and original tracking-bearing URL values were not committed.
- Product behavior, runtime dependencies, CI, and deployment configuration were not
  changed.

## Historical Revision 3 delivery state (superseded by Revision 4)

At the Revision 3 handoff, Kelsey had supplied direct informed authority for Revision 3
commits, independent review, push, pull request, merge, and resulting Vercel Preview and
Production deployments. `docs/evidence/PLAN-REV3.md` records that bounded historical
authority. At that time, only local P2 implementation and independent review could
resume and P2 delivery was unauthorized. Revision 4's current authority and exact
delivery sequence at the top of this handoff supersede these old action limits without
changing their historical accuracy.

## Remaining unknowns and later-stage routing

- P1's public probes are representative observations, not full portal crawls or proof
  that scholarship facts are current.
- Source architecture and application identity remain explicit `unknown` where the
  sanitized evidence is insufficient. URL-structure inferences remain manual review,
  and direct public observations retain their observation/review status.
- Potential identity-bearing query/fragment semantics must be defined in P2/P3 rather
  than discarded by P1.
- Dependency remediation remains P7 work; the P1 baseline applies no upgrades and
  makes no exploitability claim.

## Historical Revision 3 next-stage direction (superseded by Revision 4)

Under the Revision 3 handoff, Revision 3 was the only permitted work until its accepted
attestation was delivered on verified `origin/main`. The then-current direction was to
resume local P2 implementation and review under `docs/kickoffs/P2-DATA-MODEL.md` without
delivering P2. Revision 3 and local P2 acceptance are now complete; the current Revision
4 sequence at the top of this handoff controls.

## Historical Revision 3 prohibitions (superseded where Revision 4 is more specific)

The Revision 3 handoff prohibited spreadsheet writes, production-data configuration,
forms, application workflows, provider contact, product changes, P2 delivery, P1
history changes, and unreviewed Revision 3 delivery. Revision 4 supersedes only the old
P2 Git/Vercel delivery prohibition for exact candidate `1a63762` and attestation
`cc277b3` through the current reviewed sequence. Every other exclusion remains in force.
