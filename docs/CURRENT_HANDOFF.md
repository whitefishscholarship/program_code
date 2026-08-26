# Current Handoff

Last updated: 2026-08-26
Plan revision: 6
Repository: `whitefishscholarship/program_code`
Default branch: `main`

## Current P3 replacement-candidate state

- Active stage: none. The first local P3 acceptance candidate was rejected and the
  remediated replacement is pending freeze, independent recheck, and direct-child
  attestation. P4 is only next permitted and has not started.
- Verified P3 baseline and `origin/main`:
  `2dbacb0a7320e9e1c7a7d29c798d005e25f28ff3`.
- P3 branch: `codex/p3-architecture-aware-acquisition` in an isolated worktree.
- P3 implementation checkpoint:
  `21e085a259cac558fac3689bfade58b0228be27b`.
- Rejected predecessor candidate:
  `f89f61c634318d7b77b3db82ef3084af53f59c61` (C0/H4/M3/L0); it must never be
  attested or delivered. First rejected replacement:
  `6e28ab95a6e707167ff51436a140669369f95a3a` (C0/H2/M0/L0), with rejected
  uncommitted manifest digest
  `c1d83fa89a96dc2d991e3938e032f457318caf165382f20726f7c45e0042bbcb`.
  Second rejected replacement:
  `715a4d32b9d7c292c38eb9034987d6ec6243f8fc` (C0/H2/M0/L0), with rejected
  uncommitted manifest digest
  `1f707dce20fca72c3589ab2e25c97456f7f7bec53fa4ba933dd16f5c91a9641c`.
  Third rejected replacement:
  `118006a8bccdbee91fcce000e56ac958ab938c04` (C0/H2/M0/L0), with rejected
  uncommitted manifest digest
  `0f5334a9c6b4d7c392cc2b53018f899fc21867e7862765f358d59a3b4d9fd0bc`.
  No rejected candidate may be attested or delivered. Remediation checkpoints:
  `e805e49`, `d4ee469`, `03421b3`, and `5b2fda0`.
- Exact replacement candidate: pending freeze. Its content-derived SHA will be bound in
  `docs/evidence/P3-manifest.json`; a commit cannot embed its own SHA without changing
  that SHA.
- Replacement P3 manifest/review: intentionally absent until the candidate is frozen.
  They must be
  the only two paths added in the exact direct-child attestation.
- Entry verification confirmed that the exact P2 merge, accepted marker, evidence,
  manifest, review, and direct-child attestation are all present in the baseline.
- P2 schema version `2.0.0`, P1 inventory SHA-256
  `3f7dda3cd9d2946a42e8dec16e5a4d3b6240218eda8b4fee0cb42fc7b32aec6a`, and P2
  canonical dataset digest
  `dcbc9a28b093d1f32ec149d7c37b20606ea3108eaa3bdcea1ecc76474cd2d295`
  are the pinned acquisition inputs.
- Baseline `npm ci` installed 565 locked packages and baseline `npm run plan:check`
  passed after the restricted runner's local IPC socket was permitted. No dependency,
  lockfile, spreadsheet, deployment-configuration, form, provider, or production-data
  mutation occurred.
- P3 is authorized under the stage-specific standing mandate recorded in
  `docs/evidence/STANDING-OPERATING-MANDATE.md`. Reserved effects remain excluded.
- P3 implements all 13 architecture routes, selective URL identity, bounded retries,
  hash-linked receipt-ledger resume, thrown-error classification, occurrence-preserving
  single/multi-page and directory parsing, pagination/document parsing, representative
  no-submit public-form reading, explicit access review, and schema-valid unverified P2
  fixture graphs derived only from successful work results. Successful Source URLs
  preserve provider hosts, page parameters, and fragments; receipt history is loaded
  only from an implementation-owned append-only directory that can be reopened after
  interruption and whose receipts require a runtime-held HMAC integrity key. Form
  labels/titles use only direct structural text or explicit accessible-name attributes,
  so descendant custom-control response text is never recorded.
- Deterministic fixture denominator: 34 work items; 34 processed, 27 successful, seven
  explicit failure/review outcomes, zero unaccounted remaining. All seven failures have
  a canonical Source, Evidence item, and Review Item.
- Fixture graph totals: 45 Sources, 27 Scholarships, six Application Groups, 27 Cycles,
  105 Evidence items, and 105 Review Items. All evidence remains unverified and every
  cycle remains unknown for P4.
- Acquisition report SHA-256:
  `2a826bde49befb06987af6e662c242cb7e4ce3b9c6c7b72233594e042cd46987`;
  completeness report SHA-256:
  `d967119a72f272803cfab5c9a3e22680b5bd7686b69d26a183b1a2578ee89020`.
- Three bounded public landing pages were read with Firecrawl at
  `2026-08-26T22:38:00Z` for architecture observations only: NFU, FVCC AcademicWorks,
  and FIRST. No child crawl, form/application interaction, authentication, factual
  acceptance, spreadsheet access, or provider contact occurred.
- `docs/kickoffs/P4-VERIFICATION.md` is prepared as the next-stage contract only. P4
  has not started and may not start until P3 acceptance is delivered on `origin/main`.
- The rejected predecessor's matrix passed through `2026-08-26T22:47:06Z`: locked install,
  deterministic acquisition check, plan/history validation, typecheck, complete tests,
  permitted network build, and root diff check. The restricted build failed only on
  existing Google Fonts network access; no configuration changed. Exact UTC windows and
  outcomes are historical in `docs/evidence/P3.md` and are not replacement acceptance
  evidence. It is not replacement acceptance evidence.
- The first replacement matrix passed through `2026-08-26T23:09:19Z`: exact locked
  install, deterministic acquisition check at `abca542965bd`, typecheck, complete tests,
  permitted network build, and root diff check. Prospective plan validation reported
  exactly the expected missing P3 manifest/review attestation and no other error. Exact
  UTC windows and outcomes are historical in `docs/evidence/P3.md`; that candidate was
  rejected and the final replacement matrix is pending.
- The second replacement matrix passed through `2026-08-26T23:22:29Z`: exact locked
  install, deterministic acquisition check at `2a826bde49be`, typecheck, complete
  tests, permitted network build, and root diff check. Prospective plan validation
  reported exactly the expected missing P3 manifest/review attestation and no other
  error. That candidate was rejected; exact UTC windows are historical in
  `docs/evidence/P3.md`.
- The third replacement matrix passed through `2026-08-26T23:35:06Z`: exact locked
  install, deterministic acquisition check at `2a826bde49be`, typecheck, complete
  tests (including nested-response and restart-resume regressions), permitted network
  build, and root diff check. Prospective plan validation reported only the expected
  missing P3 manifest/review attestation. That candidate was rejected; final replacement
  verification is pending.
- The fifth candidate matrix passed through `2026-08-26T23:47:02Z`: exact locked
  install, deterministic acquisition/completeness checks, typecheck, complete tests
  including authenticated-rewrite and custom-control response regressions, permitted
  network build, and root diff check. Prospective plan validation reported only the
  expected missing P3 manifest/review attestation.
- The immutable replacement candidate, complete manifest, reviewer recheck, and exact
  direct-child attestation are still pending. Until delivery, P3 is not durably complete
  on `origin/main` and P4 remains prohibited in this session.

### Deferred platform and dependency issues (not P3 remediation)

- **Vercel Preview:** PR #16's Preview deployment was attempted and blocked by the
  existing `Franscale1922` project-access rule. Main CI and the Production deployment
  completed. No identity, permission, or deployment configuration was changed. Owner:
  repository/Vercel administrator. Target: resolve through separately authorized
  access administration before a Preview result becomes an acceptance dependency.
- **GitHub Actions Node runtime:** post-merge run `33018750958` passed but annotated
  that Node.js 20 action runtimes are deprecated and `actions/checkout@v4` plus
  `actions/setup-node@v4` were forced onto Node.js 24. Owner: repository maintainer.
  Target: a separately reviewed operational-governance update before the warning
  becomes a CI failure; P3 does not change CI configuration.
- **Dependency audit:** the locked install still reports 21 time-sensitive advisories
  (1 low, 7 moderate, 12 high, 1 critical). This is an audit denominator, not an
  exploitability finding. Owner: P7 implementation/reviewer. Target: P7's required
  dependency/security audit and exposure review; P3 applies no upgrade or audit fix.

## Historical P2 delivery integration state (completed)

- Exact P2 delivery integration completed and merged through PR #16 at
  `2dbacb0a7320e9e1c7a7d29c798d005e25f28ff3` on 2026-08-26.
- Its exact two-parent candidate used delivered Revision 6
  `322a2b85ba32b6255e0f24a1482c0a6a26dd2b7f` as first parent and immutable P2
  attestation `cc277b34075f6d648ff3c71022fadf6a6c632b34` as second parent.
- Preserved P2 candidate:
  `1a6376207eb467ff0977298de16a1c0d0db1b3cd`; preserved P2 manifest SHA-256:
  `4d47d562e26efe249f6a7be0ed656f1fddc1a17233378254772019cacd49ee8a`.
- Delivery candidate `147513a` and direct-child attestation `0655da7` were
  independently accepted C0/H0/M0/L0. PR CI and post-merge main CI passed; Vercel
  Production completed. The blocked Preview result is carried above.
- The reviewed integration reconciled only `docs/BUILD_STATE.json`, this handoff, and
  the deterministic `web/package.json` union. It preserved every Revision 6 test
  command and added only exact P2 model scripts and its missing test command.
- P2 is durably accepted and delivered. Its historical pre-freeze checks, constrained
  runner behavior, and exact package/state proofs remain preserved in P2 delivery
  evidence and review records.
- Production spreadsheet identity remains unset and all spreadsheet mutation remains
  unauthorized.

## Historical Revision 6 pre-delivery state (completed)

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

Historical Revision 6 next actions (completed or superseded):

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
- P1 delivery integration candidate:
  `464eece0c05c97e014cca0955f0ab92998c1d97c`
- P1 delivery attestation:
  `e4541a9b845758309031f00cd1958c96b4de4a27`
- P1 delivery merged through PR #10 at
  `be6644f5140c35de2075fa24782f81bf0449f0f6`
- Plan Revision 3 candidate: `7e38c61dc0e08190ddb72a55bae109895831d94b`
- Plan Revision 3 attestation: `3f2cbfee112b15c1ce0a690ce838080f4cffcd84`
- Plan Revision 3 merged through PR #11 at
  `6a6d64339d44cbede99acfd5a3966781f1f9c4f6`
- Delivery candidate identity: this exact two-parent merge commit. A commit cannot
  embed its own content-derived SHA without changing that SHA; after freeze, the
  authoritative exact SHA is bound in `docs/evidence/P1-delivery-manifest.json` and
  rechecked in `docs/reviews/P1-delivery.json`. Rejected predecessor candidate
  `354acea210fe60ffc21d68deff94716561b5427d` is not authorized for delivery.
- Durable P1 completion gate: satisfied; exact preserved P1 history and the accepted
  delivery integration are present on `origin/main`
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

## Plan Revision 3 delivery

Revision 3 was independently accepted with zero findings, attested in exact direct-child
commit `3f2cbfe`, and merged through PR #11. Main CI passed. The authorized Vercel Preview
attempt was blocked by the existing author-access condition; no configuration or
provider change was made. Vercel Production deployment `6074576943` completed
successfully at `https://web-65cdpbnfc-whitefishscholarships-projects.vercel.app`.
The amendment now validates P1's exact derived integration state from its immutable
delivery candidate and prevents deletion, downgrade, or rebinding of historically
accepted integrations.

## Plan Revision 2 delivery integration

The delivered integration preserves P1 candidate `92ee210`, attestation `20476b8`, and
every non-governance P1 blob byte-for-byte. Its exact two-parent candidate, independent
review, direct-child delivery attestation, PR/main CI, and Production deployment all
completed. The Vercel Preview attempt was blocked by the existing author-access rule;
no configuration or provider change was made.

## P2 implementation result

P2 defines Zod-validated schema version `2.0.0` for Source, Scholarship, Application
Group, Cycle, Evidence, and Review Item. Stable identifiers use deterministic SHA-256
over versioned typed identity components.

The read-only P1 compatibility adapter:

- binds all 197 records without changing the pinned input;
- maps 176 `Scholarship` rows to distinct awards and keeps 21 `Portal` rows as
  non-award source-record bindings;
- preserves 213 URL sources, creates four explicit offline sources, and preserves all
  278 information/application role occurrences with provenance;
- creates 176 explicit unknown cycles instead of inventing dates, status, time zone,
  precision, or recurrence;
- represents three common/matching application groups without claiming unseen children
  or unverified supplement behavior;
- preserves 162 unknown records, 121 unknown sources, 188 manual-review records, 207
  manual-review sources, 26 shared-source groups, and all 15 identity-bearing
  query/fragment source identities;
- round-trips all retained P1 record fields and references exactly; and
- maps all 15 student-facing fields while explicitly leaving the 11 fields excluded
  from P1 unavailable rather than fabricating values.

The deterministic canonical dataset digest is
`dcbc9a28b093d1f32ec149d7c37b20606ea3108eaa3bdcea1ecc76474cd2d295`.

The replacement preserves raw and normalized forms for every previously lossy
eligibility/renewal field, binds Evidence IDs to complete observation identity, and
uses the schema version in every stable identifier. Duplicate-name review items now
attach to resolvable row identities. The 12 scenario fixtures contain linked Source,
Scholarship, Application Group, Cycle, Evidence, and Review Item records rather than
taxonomy labels alone.

P2 changed only model/adapter code, sanitized fixtures, deterministic generated
evidence, tests, package scripts, governance state/handoff, and the P3 kickoff. It does
not change runtime routes, API/UI behavior, connectors, acquisition, dependencies,
lockfile, CI, or deployment configuration.

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

## P2 artifacts

- `web/src/lib/canonicalModel.ts` — versioned schemas, ID rules, compatibility adapter,
  and exact legacy round trip
- `web/fixtures/p2/model-scenarios.json` — 12 linked canonical graph fixtures covering
  all 13 taxonomy values
- `web/fixtures/p2/legacy-field-map.json` — all 15 current student-facing fields with
  raw, typed, unknown, and unparseable compatibility cases
- `web/scripts/p2-data-model.ts` — deterministic migration dry run and evidence check
- `web/scripts/test-p2-data-model.ts` — model, identity, relationship, and loss tests
- `docs/evidence/P2-dry-run.json` and `docs/evidence/P2-compatibility.json` —
  machine-readable reconciliation and compatibility evidence
- `docs/evidence/P2.md` — stage evidence pending final verification details
- `docs/kickoffs/P3-ACQUISITION.md` — next-stage contract only; P3 was not executed

## Verification and review

P2 verification to date:

- Clean replacement baseline `6a6d643` matched exact `origin/main`; P1 accepted history
  and Plan Revision 3 manifest/review attestation were present.
- `npm ci` passed with 565 packages and the unchanged time-sensitive audit result of 21
  findings (1 low, 7 moderate, 12 high, 1 critical).
- Baseline `npm run plan:check` passed for all 10 stage contracts.
- `npm run p2:model` generated deterministic evidence.
- Final predecessor `npm run p2:model:check` passed after the explicit source-link
  schema addition with digest `727f8615f54484f2499ed12f0e95354d6a800fdd05c428b4ab225fb9a0f667d1`.
- Typecheck and the focused predecessor P2 test passed after explicit source
  relationships were added, with digest `727f8615f54484f2499ed12f0e95354d6a800fdd05c428b4ab225fb9a0f667d1`.
- One full test run exposed an incorrect test expectation of eight Whitefish Education
  Foundation children; the pinned P1 shared group correctly contains nine. The test now
  derives its expectation from the pinned group, and the focused rerun passed.
- The final Revision 3-aware matrix passed through `2026-08-25T01:31:32Z`: locked
  install, model check, plan validation, typecheck, complete test suite, production
  build, and diff check. Exact UTC windows are recorded in `docs/evidence/P2.md`.
- Fresh reviewer `/root/p2_independent_review` rejected exact candidate `658f07d` at
  `2026-08-25T01:43:19Z` with critical 0, high 3, medium 2, low 0: five fields lost
  raw values; evidence observations could collide; scenarios were descriptors rather
  than model graphs; several IDs were not version-bound; and one duplicate-name review
  subject did not resolve. Manifest SHA-256 was
  `3b9e2d06b586a7663d0d925a1c92652b013f655b9b41bc1347b691986c0c1902`.
- The replacement fixes all five findings. Its regenerated dataset has 572 Evidence
  records, 592 resolvable Review Items, and digest
  `dcbc9a28b093d1f32ec149d7c37b20606ea3108eaa3bdcea1ecc76474cd2d295`.
  The post-freeze replacement manifest bound its exact identity.
- The same reviewer technically accepted exact candidate `9aebc85` at
  `2026-08-25T02:11:32Z` with C0/H0/M0/L0 and independently confirmed all five fixes,
  denominators, deterministic digest, linked fixtures, relationship resolution,
  12-path manifest, historical preservation, and scope boundaries. Exact reviewed
  manifest SHA-256 was
  `48ba326da8410118a87e86f39527ab55fdb7d9bda80dcc72fd23c0a8e60a468a`.
- The user then explicitly authorized the local P2 acceptance-marker transition,
  exact final review, and direct-child two-file attestation. No delivery or P3 work was
  authorized.
- Replacement pre-freeze verification passed through `2026-08-25T02:02:44Z`: locked
  install, model check, Revision 3-aware plan validation, typecheck, complete tests,
  production build, and diff check. Exact UTC windows and outcomes are recorded in
  `docs/evidence/P2.md`.

P1 historical verification and review:

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

- P2 uses only committed sanitized P1 fixtures and evidence; it made no spreadsheet
  read or write and no public fetch.

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

- P1 excluded deadline, amount, summary, eligibility, and other student-facing values.
  P2 proves representation and lossless handling but does not reconstruct those values.
- Every migrated award has an explicit unknown cycle because P1 retained no cycle
  facts; P4 owns fact verification.
- Parent/child source links are schema-supported but remain empty where P1 supplies no
  evidence of source hierarchy. P3 may populate them only from evidence.
- Reach Higher application-group behavior remains manual review.

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
