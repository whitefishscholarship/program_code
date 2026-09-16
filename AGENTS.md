# Repository Operating Contract

This repository is governed by `docs/SCHOLARSHIP_SYSTEM_BUILD_PLAN.md` and
`docs/BUILD_STATE.json`. Read them before changing code, data, documentation, CI,
or deployment configuration.

## Required read order

1. `AGENTS.md`
2. `docs/SCHOLARSHIP_SYSTEM_BUILD_PLAN.md`
3. `docs/BUILD_STATE.json`
4. `docs/CURRENT_HANDOFF.md`
5. The evidence file for the most recently accepted stage
6. The kickoff file for the next permitted stage

If a kickoff prompt conflicts with the canonical plan or build state, the plan
and build state win. Execute one stage only. Do not begin a later stage because
it is convenient or adjacent.

## Grounding and evidence

- Separate observed facts, inferences, and unknowns.
- A successful fetch proves only that one URL responded at that time.
- A green test suite does not prove scholarship facts are current.
- Do not mark a stage accepted until every universal and stage-specific gate is
  satisfied, the candidate manifest is stable, and an independent reviewer has
  no unresolved critical or high findings.
- Do not relax acceptance criteria while implementing a stage. Record a plan
  amendment in `docs/DECISIONS.md`, update the canonical plan in a dedicated
  commit, and re-run plan validation.
- Route later-stage discoveries to the decision log or handoff; do not absorb
  them into the active stage.
- Record exact commands, results, timestamps, source revisions when available,
  and unresolved failures in `docs/evidence/`.

## Scholarship data boundaries

- Under Plan Revision 10, spreadsheet
  `1Dp5AMnrfSQ-Xf-r03S75lKsGPJk7o0inOgvC9Q6lOl4` is only the user-reported,
  independently unverified organizer authoring master. Revision 10 grants no access
  or automated-write authority. It is not an operative testing source.
- Spreadsheet
  `1eWGMdavcEECUcY_-nZ9gR2nMTN7T7T6oipG5ql1LoIE` is legacy comparison-only under
  Plan Revision 10, with no access authority. The following Revision 7 source and P9
  rules are preserved solely as historical context and are non-operative after the
  Revision 10 transition; they grant no spreadsheet access or replacement-P9 authority.
- **Historical, non-operative Revision 7 record:** The former production Whitefish
  Scholarship spreadsheet was
  `1eWGMdavcEECUcY_-nZ9gR2nMTN7T7T6oipG5ql1LoIE`. Plan Revision 7 authorizes only
  bounded read access and an application-configuration cutover in P9. Never write,
  append, clear, format, share, rename, restore, or otherwise mutate that spreadsheet.
- P9 may read only the two scholarship tabs and bounds pinned in `BUILD_STATE`. Do not
  access unrelated tabs or applicant data. The deployed runtime identity's read access
  must be verified before P9 becomes active: require the exact principal to have one
  direct, unexpired Viewer permission on production and require that same authorized
  verifier to read both exact private backups. A connected user account, stored secret,
  or CI-runner read is not deployed application-path proof. Exact Vercel project/team
  fingerprints and the canonical student-facing Production hostname must be separately
  authority-pinned, and the protected environment/credential provenance must be
  authenticated. All corresponding false/null `BUILD_STATE` gates are stop conditions;
  Revision 7 does not change permissions or provider configuration. Reverify source
  revision `9857`, the exact
  tab identities/grid bounds, both source/backup fingerprints, and unchanged post-read
  revision at P9 entry. Preserve the two historical opaque hashes as provenance, but
  make the operative comparison a fresh source-versus-existing-backup equality under
  `google-sheets-v4-griddata-canonical-json-v1` over the exact bounded GridData payload.
  Any mismatch blocks P9 pending a newly authorized amendment and current
  backup receipt; do not expand a range silently.
- Bind the deployed-runtime/revision/source-backup entry proof to structured
  `docs/evidence/P9-entry.json`. Bind the post-deployment and rollback zero-mutation
  proof to `docs/evidence/P9-post-cutover.json`. Both paths are immutable; P9's accepted
  manifest must hash both receipts. Every P9 receipt must use the strict schema-v2
  contract and pass exact GitHub OIDC artifact-attestation verification from the
  delivered default-branch `.github/workflows/p9-evidence.yml`; schema-v1 or
  self-asserted provider JSON is forbidden. The validator must reject missing,
  malformed, stale, expanded-scope, unauthenticated, or later-rebound receipts.
- Bind the rollback probe to `docs/evidence/P9-deployment.json`. Its deployed and
  runtime commit must exist, descend from P9's exact baseline, precede the final
  candidate, and remain byte-equivalent to the final candidate across every tracked
  `web/` and deployment-control path. This includes catalog fixtures consumed by the
  API. Deploy that same rollback-safe runtime commit three times with distinct provider
  IDs: production-read cutover configuration, accepted-P7 static rollback
  configuration, then restored production-read configuration. Each observation-only
  phase proof must finish before the next deployment is created. The trusted workflow
  must query the authenticated Vercel API, require health to return the exact provider
  commit, fresh nonce, deployment ID, and actual shared-loader runtime descriptor, and
  recompute its canonical digest. Cutover/restored health must return a nonce-bound
  application-read observation whose digests cover the complete normalized bounded
  GridData with the fresh nonce and match the trusted runner's independent computation;
  it must not echo stored source hashes or cell values. The phase proof must also bind
  both deployed routes to one statically verified shared loader and direct result
  dataflow at the exact runtime commit; rollback must return none. Provider/runtime
  observations must match the immutable authority pins, not merely each other.
  SHA-shaped values, claimed booleans,
  and unexecuted writer-test results are not evidence.
- Never collect, reproduce, or commit applicant responses, credentials, dates of
  birth, addresses, phone numbers, transcripts, recommendation letters, or
  other applicant PII.
- Preserve parent sources, child awards, shared applications, annual cycles, and
  field-level evidence as distinct concepts.
- Never silently truncate portal pages, child links, search results, or extracted
  awards. Completeness must be measurable.

## Independent review

The acceptance review must be performed by a fresh-context agent that did not
author or edit the reviewed stage. Give the reviewer the original objective,
canonical plan, baseline and candidate manifest, diff, validation evidence, and
explicit read-only instructions. The implementation agent owns remediation; the
reviewer must not repair its own findings. After remediation, the independent
reviewer rechecks the final candidate. Accepted stages require a structured review
record whose outcome and manifest digest are validated by `npm run plan:check`.
Freeze implementation and documentation in an immutable candidate commit before final
review. The manifest hashes candidate-tree blobs and the complete Git change set from
the verified `origin/main` baseline. Add only the manifest and review record in the
following attestation commit. Historical manifests are never rebound to a later
worktree. The attestation must be the candidate commit's direct child and change exactly
the stage manifest and review paths. Preserve every historical attestation byte-for-byte.
Every medium/low review finding requires a count-matched disposition with rationale,
owner, and target.
The first valid attestation in Git history is canonical. Never delete/re-add or rebind it,
and do not append another commit after an undelivered attestation. The attestation must
remain the branch tip until merged.
Validate an accepted delivery integration's exact derived `BUILD_STATE` transition
against the immutable delivery candidate named by its attested manifest. Later stages
may evolve the current `BUILD_STATE` only through the normal reviewed state machine;
they must not weaken, replace, or reinterpret that historical integration proof.

## Plan Revision 8 and P8R boundary

Plan Revision 8 inserts `P8R` between accepted P8 and planned P9. Revision 8 itself is
governance-only: do not change student-facing runtime behavior while preparing or
delivering the amendment. After Revision 8 is independently accepted, attested, and
delivered, P8R may restore the interview-first flow under its canonical contract and
recorded delivery authority. Interview answers must remain only in volatile browser
memory and must never be placed in storage, cookies, URLs, requests, logs, analytics,
fixtures, evidence, or Git. A matcher may hard-exclude only from a typed accepted public
fact; unknown or free-text-only eligibility stays visible as a possible match.

Neither Revision 8 nor P8R authorizes spreadsheet access or writes, P9, production
source/configuration work, monitoring activation, form submission, applicant-data
collection, provider contact, deployment-configuration changes, or scope expansion.

## Plan Revision 9 and P8F boundary

Plan Revision 9 inserts `P8F` between accepted P8R and planned P9. Revision 9 is
governance-only: do not change student-facing runtime behavior while preparing or
delivering it. The former-interview inventory pinned by Revision 9 distinguishes all
historically displayed controls from TypeScript-only fields and proves that ADD was not
a separate displayed question from ADHD. It also maps the earlier active six-option
`organization_affiliations` control into the final affiliation criteria without
authorizing a duplicate question and retires its associated free-text gate plus the
legacy `New for 2026!` boost. After Revision 9 is independently accepted,
attested, and delivered, P8F may restore only the governed former displayed detail
inside the accepted P7/P8R product.

P8F must preserve volatile-browser-memory privacy, current catalog/cards/filter/sort/
export/count/relationship behavior, and conservative field-specific accepted-fact
rules. A hard conflict requires an explicit contradictory typed answer plus an award-
bound accepted public fact. Missing, ambiguous, free-text-only, manual-review,
provenance-free, unanswered, nonselected, and prefer-not-to-answer states remain non-
excluding. A sensitive nonselection is never a contradiction. Never reconnect, copy,
or disguise the historical processor/rules pack as
matching truth, restore legacy points/defaults, store matched rows, or replace on-page
canonical results with the former Excel-only route.

Neither Revision 9 nor P8F authorizes scholarship spreadsheet or public-source access,
writes or fact mutation, P9, production source/configuration work, monitoring
activation, form/application interaction, applicant-data collection, answer/decision
persistence or transmission, analytics, provider contact, deployment-configuration
changes, or scope expansion.

## Plan Revision 10 and P8M boundary

Plan Revision 10 inserts `P8M` between accepted P8R and planned P8F. P8M is the sole
next-permitted stage, but it remains planned and unauthorized until a later direct,
stage-specific instruction names the exact bounded denominator, master tabs/ranges,
permitted source reads, proposal processing, human review, write exclusion or exact
write gate, Git delivery, and resulting deployment effects. Do not begin P8M merely
because it is next-permitted.

Spreadsheet `1Dp5AMnrfSQ-Xf-r03S75lKsGPJk7o0inOgvC9Q6lOl4` is the
organizer-designated authoring master only as a user-reported, independently unverified
fact. Edit access is not automated-write authority. Revision 10 grants no sheet,
source, permission, metadata, or revision access and no Claude row processing. The
former production spreadsheet is legacy comparison-only with no access authority.
Application runtime must eventually consume a validated immutable versioned publication,
not the mutable master, under separately accepted P9 governance.

Claude is proposal-only: it may never accept its own facts or write a spreadsheet.
Codex owns stable-ID validation, evidence policy, duplicate/conflict/coverage checks,
complete-denominator reconciliation, proposal-review packaging, and any separately
authorized exact write/readback workflow. Missing, unaccepted, ambiguous, stale,
conflicting, free-text-only, unanswered, or nonselected information remains unknown and
cannot hard-exclude an award.

P8F may start only after P8M is accepted, attested, delivered, and reverified on live
`origin/main`. P9 and `P9-IDENTITY-PINS` remain planned and unstarted. Revision 10 does
not activate monitoring, change product/runtime or deployment configuration, or grant
remote Plan Revision 10 delivery authority. A local attestation must remain branch tip
until separately authorized delivery.

## Plan Revision 11 late-delivery boundary

Plan Revision 11 is the sole exact continuation for delivery authority received after
the immutable Plan Revision 10 attestation. It must preserve Revision 10 candidate
`519f8b0cc3cb1da7d1cb75651940358b5722f9e9` and direct-child attestation
`4a22711bbb352d763298c6200768dc181662f80f` byte-for-byte, use only the pinned
continuation branch and allowlisted governance paths, receive fresh-context review,
and add only its own manifest/review in its direct-child attestation.

The continuation authorizes its exact branch push, pull request, Vercel Preview, merge,
Vercel Production deployment, CI, and verification. It authorizes no product, data,
runtime, workflow, spreadsheet, source, monitoring, or deployment-configuration change.
The user separately authorized P8M/enrichment in principle, but P8M cannot access the
master or sources until the exact tab/range, denominator, revision, source, reviewer,
and write-gate fields required by its kickoff are known and machine-recorded. Stop
before P8M access during Revision 11 delivery.

## Plan Revision 12 row-source correction boundary

Plan Revision 12 records the completed read-only pin of the organizer master before
P8M execution. The only source tab is `Master Database`, gid `0`, used range
`'Master Database'!A1:O198`, Drive revision `225`: one header and exactly 197
populated rows, comprising 176 rows labeled `Scholarship` and 21 labeled `Portal`.
The source has no application-group field and no cycle/cycle-ID field. Those concepts
are not required source identities or source denominators and must never be fabricated
to make a row complete.

P8M completeness is row-based: each of the 197 rows must have exactly one reconciled
row outcome. A row does not need every possible fact. Blank, unavailable, blocked,
unsupported, or otherwise unobserved information remains explicit `unknown` or manual
review and may not become false, ineligible, or silently omitted. Valid processing may
continue for other facts and rows. The frozen `matching-facts-v1` contract remains
unchanged; optional cycle-specific normalized facts may be used only when evidence
actually establishes them.

Revision 12 authorizes only its own governed Git delivery and resulting Vercel
Preview/Production verification. It does not start P8M execution. Before external URL
reads or Claude processing, pin the exact URL-bearing columns, official-source
allowlist, and Claude instruction. Before fact or stage acceptance, pin the named human
fact reviewer. No spreadsheet write is authorized. Stop before P8F and P9.

Plan Revision 2 introduced a per-stage exception that preserves rather than replaces an
attestation: an independently reviewed delivery integration may merge an exact
previously attested stage into a separately delivered amended `origin/main`. Each use
must be enabled by a reviewed plan amendment that pins the exact stage candidate and
attestation plus direct informed delivery authority. The integration must use the exact
parents, manifest, review, authority evidence, and branch-tip lock defined by the
canonical plan and `BUILD_STATE`. It never permits an ordinary post-attestation commit,
candidate rewrite, attestation rebinding, or unreviewed merge resolution. Material plan
amendments are themselves frozen, manifested, independently reviewed, and attested
before delivery.
The validator discovers historically attested plan amendments from Git history rather
than trusting only the mutable current amendment array. The current plan revision may
not fall below the highest attested revision, and every canonical amendment record must
remain exact. After Revision 5 is attested, its complete P3-P8 authorization objects and
standing-mandate evidence blob are bound to that immutable candidate. Deletion,
downgrade, field mutation, or evidence mutation is prohibited. Revocation or
supersession requires a separately authorized, independently reviewed, machine-recorded
mechanism introduced by a later plan amendment; no such mechanism exists in Revision 5.
The integration must preserve every non-governance stage blob from the exact attestation.
Normally only `docs/BUILD_STATE.json` and `docs/CURRENT_HANDOFF.md` may reconcile
delivery state. Plan Revision 6 adds one P2-only exception for `web/package.json`: the
integrated file must equal the deterministic union of the complete delivered-baseline
package and test harness plus only the exact P2 `p2:model`, `p2:model:check`, and missing
P2 test command. It may not change dependencies, other scripts, metadata, or either
side's test commands. The validator checks that exact result at the immutable delivery
candidate.

## Standing operating mandate — Plan Revision 5

Kelsey has granted a reviewed standing mandate for P3 through P8. Within one canonical
stage at a time, Codex may autonomously implement the stage contract, make local
commits, use public sources read-only outside form/application workflows, access the
pinned testing spreadsheet read-only when the stage requires it, obtain independent
review, create the exact attestation, push, open and merge a pull request, and allow the
resulting Vercel Preview and Production deployments. Product behavior changes are
authorized only when they are express deliverables of the active stage. The individual
P3-P8 delivery authorization records in `BUILD_STATE` bind this mandate to each stage.

The mandate also covers independently reviewed governance, validator, test, evidence,
and handoff maintenance necessary to keep the existing plan executable. It may not
weaken acceptance criteria, skip a stage, rewrite accepted history, expand program
scope, or authorize a reserved effect. Such maintenance remains a manifested,
fresh-context-reviewed, attested plan amendment before delivery, but does not require a
new user authorization when it stays inside these boundaries.

The following remain reserved and require new direct informed authority: any
spreadsheet write or mutation; production spreadsheet identity, access, migration, or
P9; deployment-configuration or schedule changes; paid actions; secrets or credential
handling beyond already configured secure stores; destructive or unrecoverable actions;
force-push or published-history rewrite; form submission or application interaction;
provider contact; acceptance-gate weakening; and material scope expansion. Platform
sandbox or authentication approvals remain separate technical safeguards.

## Historical P9 read-only production mandate — Plan Revision 7 (non-operative)

This section records the superseded Revision 7 operating mandate for provenance only.
Plan Revision 10 makes it non-operative: it grants no access to either spreadsheet and
no replacement-P9, Google Sheets client, configuration, Git, or deployment authority.
The current Plan Revision 10 and P8M boundary above controls. Every imperative in the
legacy text below describes the historical Revision 7 constraint; none is a current
instruction or authority source.

Kelsey directly authorized P9 production source migration, application-configuration
switching, governed Git/PR delivery, Vercel Preview and Production deployment,
verification, reconciliation, and rollback, with Kelsey as deployment and rollback
owner. Kelsey expressly prohibited every write to the production spreadsheet and
authorized spreadsheet writes only on the testing spreadsheet.

Do not implement P9 by changing the existing write-capable `GOOGLE_SHEET_ID` to the
production ID. P9 must use a distinct production configuration and a read-only Sheets
client; every write-capable route must stay pinned to the testing spreadsheet or be
disabled. Production rollback means application revision/configuration rollback only.
The production backups are evidence and must not be restored under this authority.
Testing-sheet writes remain gated by exact targets, a current revision fingerprint,
reversible backup, reviewed dry-run, bounded idempotent write, readback, and
reconciliation. Plan Revision 7 must be accepted, attested, and delivered before P9
starts.

## Autonomous Git policy: no Git questions to Kelsey

- Inspect status, branches, worktrees, remotes, and repository conventions
  directly. Do not ask Kelsey to choose a branch name, commit boundary, push
  timing, PR wording, merge method, or cleanup strategy.
- Use a `codex/<stage-id>-<slug>` branch. If the primary checkout is dirty, keep
  it untouched and create an isolated worktree from the latest `origin/main`.
- Preserve unrelated user changes. Stage only stage-owned paths.
- Commit coherent checkpoints locally without asking routine Git questions.
- Before push, PR creation/update, or merge, inspect downstream effects. This
  repository's Vercel Git integration has historically created Preview deployments
  for branch/PR revisions and Production deployments for `main` revisions. Perform a
  delivery action only when `docs/BUILD_STATE.json` contains direct, stage-specific,
  informed authority with an evidence path for every deployment effect, including a
  stage-specific record derived from the reviewed standing mandate, or when a verified
  deployment-suppression mechanism covers the action. Missing deployment authority is
  an external-release blocker, not a Git-preference question.
- Monitor CI and merge only when acceptance, downstream-effect authority, and
  repository policy permit it.
- Follow the repository's established PR merge convention. Prefer a new clean
  branch and replay of stage-owned commits over risky conflict resolution.
- For a declared exceptional delivery integration, use the exact two-parent merge
  and dedicated delivery attestation required by the canonical plan; do not replay or
  squash the preserved stage commits.
- Never force-push, rewrite published history, use destructive reset/checkout
  commands, delete a worktree containing changes, or bypass required checks.
- A verified authentication or permission outage may be recorded as an external
  blocker, but routine Git mechanics are not user questions.
- A merge authorization covers only the downstream effect stated in build state.
  It never authorizes production spreadsheet writes, form submissions, provider
  contact, or unrelated external effects.

## Required verification

From `web/`, run the stage-specific commands plus:

```bash
npm run plan:check
npm run typecheck
npm test
npm run build
```

From the repository root, run:

```bash
git diff --check
```

Use the exact evidence and handoff requirements in the active stage contract.


## Plan Revision 17 — exact REV15 delivery repair continuation

Kelsey authorized the reviewed R2 repair proposal. This is a single prospective
exception to the undelivered REV15 tip lock, never a general waiver. The original
REV15 branch remains at A15 unchanged. Its original candidate, manifest, review,
authority evidence and complete amendment object remain immutable. Preserve every
A15 blob outside the exact machine-recorded allowlist. The dedicated policy
checkpoint requires independent review before implementation.

Only the authorized branch descending from the pinned A15 may prepare C17. Its
manifest covers the whole unchanged M0 baseline to C17, including preserved A15
ancestry and artifacts. Fresh independent full-candidate review must accept it.
Only a valid direct-child, two-file REV17 attestation A17 may replace A15 as the
allowed undelivered tip. Before A17, retain REV15's tip failure plus REV17's three
missing-artifact diagnostics; after A17 actual local and hosted-mode checks must
report zero errors. Preserve all other acceptance rules and historical exceptions.
No ordinary post-A17 commit is allowed before delivery.

The finite 16 MiB Git reader must fail closed for unreadable, over-limit or
incorrect-hash objects; all four preserved large blobs must pass regression tests.
Run the full existing matrix, new adversarial continuation/reader tests and exact
Preview before merge, Production after merge. The first release delivers REV15
and this repair; only verified predecessor delivery permits the existing REV16
release. REV16 retains its identifier while planRevision stays at least17. Preserve
REV15/REV17 records, evidence and canonical artifacts, using the reviewed union of
repair and REV16 validator/test changes and original reviewed runtime/UI bytes.

Exact pins, allowlist, informed effects and target are in BUILD_STATE's PLAN-REV17
rev15DeliveryRepair and docs/evidence/PLAN-REV17.md. No workbook access/change,
research, runtime/catalog change, configuration change, monitoring, rollback,
provider/applicant interaction or later R3-R7 phase is authorized by this exception.


## Plan Revision 19 — exact Whitefish identity delivery continuation

Kelsey directly approved the independently reviewed correction proposal on September14,2026.
The receipt embeds the exact proposal and independent review in
`docs/evidence/r4-identity-repair/authority.json`; PLAN-REV19 state pins its21-path scope,
original A18/C18/baseline, Whitefish author/committer identity and existing target/effects.
This is R4 delivery only. All stage pointers remain null; completed stages remain complete.
Original REV18 amendment/grant and all prior evidence/reviews/attestations remain canonical
and byte-identical. No force push, rebinding, subscription or access change is permitted.

Only codex/r4-whitefish-delivery-repair descending from original A18 may prepare C19.
Freeze this prospective policy and obtain independent fresh-context read-only PASS before
implementation. Preserve all A18 blobs outside the finite allowlist, including every product,
catalog, source/fixture, dependency and deployment/CI byte. Package changes only append
`node --import tsx scripts/test-r4-identity-delivery.ts` to the existing test command.
Preserve all original state objects; only planRevision19 and the new amendment are added.

The sole tip-lock exception permits only a separately valid canonical REV19 direct-child
two-file attestation A19 to replace original A18 as REV18's allowed undelivered tip. C19
must descend from A18 and its manifest covers the entire pinned M0-to-C19 change set.
Require fresh independent full-candidate review, C/H0 and count-matched dispositions.
Before A19 retain REV18's original tip error plus all three missing REV19 artifact errors;
all other diagnostics block. After A19 actual local and hosted-mode validators must exit0.
A19 must remain tip until delivered. Original PR46 and its branch/head stay immutable.

During preparation validate active candidate preservation. Once A19 exists validate
immutable C19/A19 trees, never freeze future runtime/state to this release. Later separately
authorized stages may evolve them normally, but original repair amendment/authority, policy
review, manifest and historical proof must remain exact. All new commits from A18 through
A19 must have Whitefish author AND committer; verify GitHub head attribution before delivery.
Add negative regressions for identity, pins, changed evidence/grants, expanded allowlist,
missing authority/review, wrong ancestry, extra/non-direct attestation, post-A19 tips, and
valid later evolution with rejection of changed historical proof. Preserve all older gates.

Run full plan/typecheck/test/build, intake/coverage/R3 saved-evidence and P9/trace checks,
plus git diff --check. Recompute runtime/bundle equality to bind existing local browser proof.
Publish the new reviewed branch/PR under existing R4 effects, then close PR46 unmerged with
replacement identified. Verify exact Preview/CI before exact-head ancestry-preserving merge;
verify exact Production commit/catalog/compatibility/API/browser/public CSV/source capability
afterward. Request-body/download evidence unavailable through hosted tools stays unknown.
Record post-attestation observations outside the locked branch, then a local-only handoff
after merge. No extra unreviewed closeout push. Continuing provider rejection is a blocker.

No source/workbook access or writes, research, product change, configuration/credentials,
paid/access actions, rollback, monitoring, provider/applicant interaction or R5–R7. Retain
all existing owners/triggers,257-operation no-replay, recovery objects, hold/research queues,
criteria/definition/Bonita/NTHS issues and historical verification limits unchanged.


## Plan Revision 20 — UX1 local journey change

Use docs/INTERVIEW_UX_BUILD_PLAN.md for the selected four-screen UX release. Only
existing GPA/school answers are required; all other answers remain optional. Preserve
current-visit Back/edit state, all controls, unknown/non-exclusion and public-only
exports. Review the committed prospective policy before runtime edits. Local execution
is directly authorized; final canonical acceptance and release effects are not. Keep
all historical artifacts and validator gates intact; disclose the four outstanding
Revision20 release diagnostics. The direct timer handoff in plan section7 is required
after verified UX delivery and is owned by Codex. Do not mix timer implementation
into UX1 or deploy the saved pre-UX timer tree.
