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

- The testing spreadsheet is
  `1Dp5AMnrfSQ-Xf-r03S75lKsGPJk7o0inOgvC9Q6lOl4`.
- The production Whitefish Scholarship spreadsheet is
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

## P9 read-only production mandate — Plan Revision 7

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
