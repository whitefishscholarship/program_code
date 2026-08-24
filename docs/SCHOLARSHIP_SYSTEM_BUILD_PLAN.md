# Whitefish Scholarship System Build Plan

Plan revision: 2
Status: canonical
Repository: `whitefishscholarship/program_code`
Default branch: `main`
Testing spreadsheet: `1Dp5AMnrfSQ-Xf-r03S75lKsGPJk7o0inOgvC9Q6lOl4`
Production spreadsheet: intentionally unset until P9

## 1. Authority and purpose

This document is the execution contract for improving the accuracy, function,
coverage, reviewability, and operational safety of the Whitefish Scholarship
System. `docs/BUILD_STATE.json` records which stage is active or permitted next.
`AGENTS.md` defines repository-wide operating rules.

The plan exists to prevent four failures:

1. treating a portal, directory, application, and individual scholarship as the
   same object;
2. increasing row count by adding expired, duplicate, or inapplicable awards;
3. changing data or code without reproducible source evidence; and
4. allowing a new chat or agent to reinterpret scope and drift into a later
   stage.

If another document or prompt conflicts with this plan, this plan wins. Any
change to scope, stage order, acceptance gates, or production authority requires
a recorded plan amendment under section 14.

## 2. Final program outcome

The program is successful only when all of the following are true:

- Every student-visible active scholarship is supported by a current official
  source, an application method, a cycle status, and a verification timestamp.
- Every current testing-sheet row has been confirmed, corrected, archived,
  merged, or assigned to a visible manual-review queue.
- Active rows have no known-dead application link. Inconclusive or login-gated
  links are labeled and reviewed rather than silently treated as valid.
- Hidden Google Sheets hyperlinks are audited as links, not mistaken for plain
  labels.
- A source that contains multiple scholarships is represented as a parent source
  with child awards; a shared application does not collapse the children.
- Portal and directory discovery has measurable completeness. No page, child,
  result, or award is silently lost to a processing cap.
- Deadlines are typed annual-cycle data with a time zone and precision/status,
  not ambiguous display strings or spreadsheet serial numbers.
- Student-facing counts distinguish individual awards from portals, application
  groups, and numbers of award recipients.
- Coverage increases only through current, deduplicated opportunities for the
  intended Whitefish audience. A larger raw row count is not a success metric.
- Student-facing API, export, and UI surfaces expose only allow-listed fields and
  no applicant PII, internal review notes, or credentials.
- Monitoring produces a bounded review queue and never overwrites authoritative
  facts merely because a page changed or a fetch failed.
- Production has no unresolved critical/high exploitable dependency or application
  security finding; accepted exceptions identify evidence, exposure, owner, and
  target removal stage.
- The production migration is backed up, reconciled, reversible, deployed from a
  recorded commit, and independently reviewed.
- P0 through P9 are accepted, delivered through reviewed Git history, and have
  durable evidence and handoffs.

## 3. Current verified baseline

The following observations were made against the testing spreadsheet and live
sources on 2026-08-23. They ground planning but do not replace the P1 reproducible
baseline:

- 197 populated Master Database records: 176 labeled `Scholarship` and 21 labeled
  `Portal`.
- 193 records had at least one link and four used an offline or institution-handled
  method.
- 213 distinct linked URLs were observed across the information and application
  columns.
- 74 records had more than one linked source.
- 92 application links and 86 information links were hidden behind cell labels.
- 26 normalized URLs were shared by more than one scholarship record.
- Representative live architectures included a single award page, a Google Doc
  paper application, a direct PDF, a multi-award page with one form, a common
  application with supplements, a paginated institutional catalog, a searchable
  marketplace, a static directory, and an application-only login portal.
- The current ingestion code caps page extraction at 10 awards and the directory
  crawler defaults to 15 children with 10 awards per child.
- URL comparison currently removes all query parameters and fragments, even when
  `page`, `urlkey`, `sys_id`, filters, or anchors identify different content.
- The read-only link-audit script reads plain cell values and can miss links hidden
  behind labels, although the student API already preserves CellData hyperlinks.

Observed examples demonstrate why the architecture matters:

- National Farmers Union lists three child scholarships on one page and uses one
  application, but the child deadlines differ.
- Horatio Alger advertises more than 70 programs; most use a common application,
  while specialized programs may not.
- Reach Higher Montana performs shared eligibility matching and then presents
  award-specific supplemental questions.
- FVCC AcademicWorks exposed 179 paginated opportunity pages at inspection time,
  all then marked `Ended`.
- FIRST/Pearson exposed 121 filtered results, each with provider-specific terms.
- The ESA Foundation Kaleidoscope program contains two distinct scholarships on
  one program/application page.
- Direct 2026 PDF links for Alcohol Responsibility Matters and one Whitefish
  Community Foundation award returned 404 while their parent sources described
  changed or closed current state.

P1 must reproduce or explicitly explain changes from these observations. No later
stage may quote these counts as a current fact without a new snapshot.

## 4. Scope and non-goals

### In scope

- The repository, its tests, CI, documentation, and deployment configuration.
- The named testing spreadsheet and its student-facing scholarship data.
- Official public scholarship sources and public application portals.
- Read-only architecture discovery and verification of public forms.
- A review workflow for unresolved, blocked, conflicting, or login-gated facts.
- Production migration only in P9 under its explicit authority.

### Out of scope unless a later plan revision explicitly adds it

- Applying for scholarships or submitting any form.
- Collecting or storing applicant responses or applicant PII.
- Bypassing logins, CAPTCHAs, access controls, robots restrictions, or rate limits.
- Treating commercial scholarship aggregators as final factual authority.
- Guaranteeing that a student will qualify for or receive an award.
- Automatically converting an ambiguous page change into a destructive archive.
- Mutating the production Whitefish spreadsheet before P9.

## 5. Canonical concepts

The implementation may evolve field names during P2, but it must preserve these
separate concepts:

### Source

An official page, document, directory, catalog, portal, form, or offline authority
from which claims are derived. A source has architecture type, canonical URL,
access behavior, crawl state, source authority, and verification metadata.

### Scholarship

An independently nameable award with its own eligibility or selection identity.
Multiple recipients of one award do not automatically create multiple scholarship
records.

### Application group

A shared application or eligibility workflow used by one or more scholarships.
It records whether children are automatically considered, selectable, matched by
eligibility, or require supplemental questions.

### Cycle

The year or application window for a scholarship. It carries open/close dates,
time zone, date precision, active/closed/upcoming/unknown status, recurrence, and
the evidence supporting those facts.

### Evidence

A field-level observation tied to a source, retrieval timestamp, optional source
revision, captured excerpt or hash, verification result, and reviewer state.

### Review item

An explicit unresolved condition such as conflicting dates, login-gated facts,
source ambiguity, dead redirects, audience uncertainty, or extraction failure.

## 6. Source architecture taxonomy

Every source must be classified before its extraction strategy is selected.

| Type | Meaning | Required behavior |
| --- | --- | --- |
| `single_award_page` | One page describes one award | Extract one award and its current cycle. |
| `multi_award_page` | One page directly describes several awards | Split children and keep their shared source relationship. |
| `directory_hub` | Page links to child opportunities | Traverse child links resumably and report completeness. |
| `paginated_catalog` | Results span pages or cursors | Preserve page/cursor identity and enumerate to a measured end. |
| `common_application` | One workflow serves multiple awards | Create an application group and retain child-specific eligibility. |
| `matching_portal` | Answers determine available awards | Record matching behavior and supplements; do not claim unseen children. |
| `external_marketplace` | Search results point to independent providers | Treat each provider as authority for its own award. |
| `login_application_portal` | Public content ends at authentication | Verify public metadata; send inaccessible facts to manual review. |
| `document_or_pdf` | Source is a document rather than HTML | Parse versioned content and verify the parent page when possible. |
| `form_only` | Public form contains instructions/questions | Read requirements; never submit or collect responses. |
| `institution_umbrella` | Institution page mixes automatic and competitive aid | Separate awards, application modes, and renewal rules. |
| `offline_or_automatic` | Counselor, mail, admission, or financial-aid process | Preserve the non-URL method and responsible office. |
| `unknown` | Architecture cannot yet be determined | Create a review item; do not silently treat it as a single award. |

## 7. Program invariants

These requirements apply to every stage:

1. **One stage per execution.** A session may close one stage or make a bounded
   checkpoint within it. It may prepare but not execute the next stage.
2. **Testing-sheet boundary.** P0-P8 may not configure or mutate the production
   Whitefish spreadsheet.
3. **Official-source priority.** Sponsor/provider pages outrank aggregators. Child
   detail pages outrank parent summaries for child-specific facts. Current parent
   pages outrank orphaned direct documents when they conflict.
4. **No silent loss.** Caps may protect one run, but all omitted work must remain
   queued with counts and resumable cursors.
5. **No false precision.** Unknown, annual, rolling, approximate, and date-only
   deadlines must remain distinguishable.
6. **Honest counts.** Portals, scholarships, recipient slots, and search results are
   different metrics.
7. **Idempotence.** Re-running a stage against the same pinned inputs must not create
   duplicate awards or destructive state drift.
8. **Evidence before mutation.** A proposed correction is not accepted without its
   supporting source and retrieval time.
9. **Preserve unknowns.** Fetch failures, bot blocks, and login walls are inconclusive,
   not evidence that a scholarship is dead.
10. **Privacy.** Public form structure may be inspected; applicant data may not be
    collected, stored, or committed.
11. **Secrets.** Credentials remain in approved secret stores or environment
    variables and never appear in Git, prompts, logs, evidence, or fixtures.
12. **Independent acceptance review.** The reviewer did not author or edit the stage.

## 8. Stage state machine and universal completion gate

Allowed stage statuses are:

- `planned`
- `active`
- `implemented`
- `verified`
- `accepted`
- `blocked-external`
- `failed`
- `superseded`

At most one stage may be in flight (`active`, `implemented`, `verified`,
`blocked-external`, or `failed`). Accepted stages form a contiguous prefix, followed
by at most one in-flight stage, followed by planned stages. A later stage may not
become active until every prior stage is accepted. `superseded` is reserved and is
invalid under plan revision 1; enabling it requires an independently reviewed plan
amendment, explicit supersession evidence, and a validator revision. P9 always requires
P0-P8 specifically `accepted` and cannot use supersession to bypass them.

A stage may move to `accepted` only when:

1. its entry prerequisites were verified;
2. only its authorized scope changed;
3. every stated deliverable exists;
4. stage-specific and repository-wide verification passed;
5. its evidence file records commands, results, timestamps, counts, and unknowns;
6. an independent fresh-context reviewer reported no unresolved critical or high
   findings against the final candidate;
7. medium and low findings are fixed or explicitly carried with rationale and owner;
8. `docs/BUILD_STATE.json`, `docs/CURRENT_HANDOFF.md`, and the next kickoff are
   consistent and pass `npm run plan:check`; and
9. the candidate manifest is stable and a structured independent-review record
   binds the review outcome to that manifest.

`accepted` describes the reviewed candidate. A stage is durably complete only when
that accepted marker, its evidence, manifest, and review record are present on
`origin/main`. The next stage's entry check verifies this on `origin/main`; it does
not trust an accepted marker that exists only on an unmerged branch. This separates
acceptance from delivery and avoids a self-referential "merge before accepted" state.

Passing tests alone establishes neither factual accuracy nor stage acceptance.

### Delivery integration for authority received after attestation

An accepted but undelivered stage may have been frozen while Git delivery was explicitly
unauthorized. If direct informed delivery authority arrives only after its canonical
attestation exists, that authority may not be appended to the stage branch and the stage
candidate or attestation may not be amended, replaced, deleted, or rebound.

Plan Revision 2 permits one narrow delivery integration when all of these conditions hold:

1. `docs/BUILD_STATE.json` pins the exact original candidate, canonical attestation,
   original baseline, direct authority evidence, and dedicated delivery manifest/review
   paths before delivery begins.
2. The plan amendment enabling the integration is independently reviewed, hash-bound,
   attested, and delivered to `origin/main` first.
3. The delivery candidate is a two-parent merge whose first parent is that verified
   amended `origin/main` baseline and whose second parent is the exact preserved stage
   attestation.
4. A delivery manifest covers and hashes the complete first-parent-baseline-to-candidate
   change set. A fresh-context read-only reviewer accepts that exact delivery candidate.
5. A direct-child attestation adds exactly the delivery manifest and delivery review.
   It remains the delivery branch tip until merged.
6. The original stage candidate, attestation, manifest, and review remain byte-for-byte
   unchanged. The integration cannot change product or data scope, waive a finding,
   replace stage acceptance, or authorize any effect outside the recorded authority.
7. Every non-governance changed path must be present in the original stage manifest or
   be the original stage manifest/review itself, and its delivery-candidate blob must
   equal the preserved attestation blob. Only `docs/BUILD_STATE.json` and
   `docs/CURRENT_HANDOFF.md` may differ to reconcile delivery state.

This mechanism is an exceptional delivery bridge, not a general post-attestation edit
path. Each stage may have at most one delivery integration, and every commit is pinned.

## 9. Stage contracts

### P0 — Program contract and governance baseline

**Objective:** Establish a durable, machine-checkable execution contract before
product implementation.

**Entry prerequisites:** Clean or isolated checkout; repository and testing-sheet
identity verified; baseline commit recorded.

**Deliverables:**

- `AGENTS.md`
- this canonical plan
- `docs/BUILD_STATE.json`
- `docs/KICKOFF_PROMPT_TEMPLATE.md`
- `docs/CURRENT_HANDOFF.md`
- `docs/DECISIONS.md`
- `docs/evidence/P0.md`
- a paste-ready P1 kickoff
- a plan validator wired into CI

**Out of scope:** Product behavior, scholarship data edits, portal extraction,
production configuration, and deployment changes other than the plan validation
gate.

**Acceptance:** All future stages contain prerequisites, deliverables, exclusions,
verification, evidence, rollback, and measurable completion criteria. Independent
review confirms the plan addresses architecture variety, factual evidence, stage
drift, privacy, production boundaries, and autonomous Git delivery.

**Rollback:** Revert the P0 documentation/validator PR; no data or runtime behavior
has changed.

### P1 — Reproducible baseline and architecture inventory

**Objective:** Produce a read-only, reproducible snapshot of the current repository,
testing sheet, links, source architectures, and known gaps.

**Entry prerequisites:** P0 accepted; P1 kickoff identifies the accepted P0 merge;
testing spreadsheet access is read-only for this stage.

**Deliverables:**

- bounded inventory tooling that reads CellData hyperlinks, not only visible values;
- a sanitized manifest of row identities, architecture classes, URL roles, normalized
  identities, and review states;
- source/host and shared-URL reports;
- a repository behavior map for ingestion, audit, API, UI, tests, CI, and deployment;
- a dependency/security baseline that separates runtime exposure from development-
  only tooling and records current audit findings without applying upgrades;
- reconciliation and drift report against section 3's observed counts.

**Out of scope:** Sheet corrections, schema migration, child-award creation, crawler
rewrites, and production access.

**Verification:** The manifest accounts for every populated Master Database row and
every CellData hyperlink in the bounded source snapshot. Every record has one taxonomy
value, including explicit `unknown`. Re-running against the same snapshot is stable.
Sanitized artifacts contain no credentials, applicant PII, or private review columns.

**Acceptance:** Reconciliation has no unexplained missing or duplicate source rows;
count changes from the planning observation are explained as source drift; manual-review
items are explicit; the dependency/security baseline distinguishes runtime and
development exposure; independent review reproduces the key counts.

**Rollback:** Remove read-only inventory artifacts and tooling; no sheet state changed.

### P2 — Canonical data and evidence model

**Objective:** Define and validate the Source, Scholarship, Application Group, Cycle,
Evidence, and Review Item model with a compatibility path for the current sheet.

**Entry prerequisites:** P1 accepted; its manifest is the pinned migration input.

**Deliverables:** Versioned schemas, stable identifiers, allowed enums, normalization
rules, old-to-new field mapping, compatibility adapter, migration dry-run, and fixtures
covering every taxonomy type.

**Out of scope:** Live data mutation, full crawling, public UI changes, and production
migration.

**Verification:** Fixtures include single award, NFU-style children, Horatio-style
common application exceptions, Reach Higher matching/supplements, FVCC pagination,
FIRST external results, ESA shared program, document/PDF, Google Form, institution
umbrella, and offline/automatic methods. Round-trip tests preserve links, children,
cycle states, unknowns, and evidence. Identifier generation is deterministic.

**Acceptance:** No current student-facing field becomes unrepresentable; one URL can
support multiple awards without accidental dedupe; one award can have multiple cycles;
independent review finds no critical/high data-loss or identity ambiguity.

**Rollback:** Compatibility adapter remains on the legacy model; no sheet mutation.

### P3 — Architecture-aware acquisition

**Objective:** Route each source to a bounded, resumable acquisition strategy without
silent truncation.

**Entry prerequisites:** P2 accepted; schema fixtures and P1 source manifest pinned.

**Deliverables:** Architecture classifier, selective URL canonicalization, single-page
extractor, multi-award section splitter, directory queue, pagination/cursor engine,
document parser, public-form reader, dynamic/login review path, completeness receipts,
and source-specific fixtures.

**Out of scope:** Automatic production writes, bypassing access controls, and accepting
extracted facts as verified.

**Verification:** Identity-bearing `page`, `urlkey`, `sys_id`, filters, and meaningful
fragments survive normalization while known tracking parameters do not. Processing caps
leave resumable work with exact counts. Fetch retries are bounded. Same input produces
the same child identities. Representative live probes are clearly labeled as current
observations, not permanent fixtures.

**Acceptance:** No representative architecture silently loses a child or page; failed
and inaccessible sources produce review items; independent review reproduces fixture
counts and challenges cap, pagination, and dedupe boundaries.

**Rollback:** Disable the new router and use legacy read-only paths; no accepted data is
deleted.

### P4 — Accuracy and verification engine

**Objective:** Verify links, dates, cycles, eligibility, amounts, application methods,
and field evidence before any correction is eligible for review.

**Entry prerequisites:** P3 accepted; acquisition receipts and P2 evidence model stable.

**Deliverables:** CellData-aware link audit, redirect/target classification, typed date
parser, annual-cycle status engine, source-authority rules, field-level conflict detector,
freshness policy, evidence receipts, and manual-review severity rules.

**Out of scope:** Bulk accepting corrections or expanding the database.

**Verification:** Fixtures cover dead links, redirects, bot blocks, login walls, stale
PDFs, hidden hyperlinks, spreadsheet date serials, ranges, rolling deadlines, annual
dates, time zones, parent-child conflicts, and closed/upcoming cycles. Failure remains
inconclusive unless evidence proves closure or removal.

**Acceptance:** The known representative stale-link and mixed-date cases are detected;
no hidden application hyperlink is skipped; field acceptance requires current official
evidence; independent review finds no critical/high false-archive path.

**Rollback:** Run verification in report-only mode and retain legacy display data.

### P5 — Complete testing-sheet accuracy remediation

**Objective:** Apply a controlled, human-reviewable audit to every current testing-sheet
record.

**Entry prerequisites:** P4 accepted; backup and revision fingerprint captured; writes
limited to the testing spreadsheet and staging/review workflow.

**Deliverables:** Full row audit ledger, proposed corrections, archive proposals,
duplicate proposals, evidence per material field, manual-review queue, applied-change
receipt, and post-write reconciliation.

**Out of scope:** New portal expansion, production-sheet writes, and UI redesign.

**Verification:** Every input row has exactly one disposition: confirmed, corrected,
archived, merged, or manual review. Applied writes match approved proposals and are
idempotent. Active rows have no known-dead application link. Post-write counts reconcile
to pre-write rows plus explicit disposition totals.

**Acceptance:** Zero unresolved critical/high findings; every manual item has reason,
evidence, and next action. Independent review covers 100% of archives, merges, dead-link
dispositions, eligibility exclusions, portal/application relationship changes, and
deadline/application-link corrections. It also checks a deterministic SHA-256-selected
20% of all remaining dispositions (minimum 25, or all when fewer than 25 remain), then
validates complete reconciliation.

**Rollback:** Restore the captured testing-sheet backup/revision or apply the inverse
change receipt; production remains untouched.

### P6 — Eligible coverage expansion

**Objective:** Increase useful scholarship coverage by expanding high-yield sources into
current, eligible, deduplicated child awards.

**Entry prerequisites:** P5 accepted; corrected testing sheet is the pinned baseline;
source expansion priorities are recorded.

**Deliverables:** A source queue pinned before expansion in
`docs/evidence/P6-source-queue.json`, portal completeness receipts, child award and
application-group records, exclusion evidence, duplicate/collision report, and honest
coverage metrics. The queue records its complete denominator and selection rationale.

**Out of scope:** Adding all portal results indiscriminately, counting recipients as
scholarships, accepting closed cycles as active, and production migration.

**Verification:** Each added child has individual audience fit, current cycle state,
official source, application route, and evidence. Shared applications and parent sources
remain linked. Re-running produces no duplicates. Counts show sources, portals, awards,
active cycles, and recipient slots separately.

**Acceptance:** Every item in the pinned source queue has exactly one reconciled outcome:
completed, excluded-with-evidence, blocked-external, or resumably incomplete with exact
remaining counts and cursor. All accepted children are relevant to the intended Whitefish
audience. The report gives the exact net change in active eligible awards. A zero-addition
result is acceptable only when all queue outcomes are evidence-backed; a zero-source queue
is invalid. Independent review finds no critical/high inflation or omission.

**Rollback:** Remove expansion batch by its receipt while retaining corrected P5 data.

### P7 — Student-facing product and API

**Objective:** Present accurate awards, portals, counts, filters, application methods,
and status to students without exposing internal or sensitive data.

**Entry prerequisites:** P6 accepted; canonical model and count semantics stable.

**Deliverables:** API compatibility/update, portal-versus-award presentation, cycle-aware
status and sorting, application-method UI, filters, accessible empty/error states, exports,
privacy allow-list tests, and browser QA evidence.

**Out of scope:** Production sheet switch and autonomous factual mutation.

**Verification:** Typecheck, unit tests, production build, dependency/security audit,
API contract tests, fixture count reconciliation, keyboard/accessibility checks, and
export verification. Before implementation, commit a P7 test matrix covering every
source architecture and at least 360x800, 768x1024, and 1440x900 browser viewports. Run
every matrix journey at every applicable viewport. Closed awards cannot appear as active
due only to date parse failure. Internal fields and PII remain excluded.

**Acceptance:** Every journey in the predeclared P7 matrix passes or has an explicit
accepted exclusion. The matrix must include single awards, shared applications, portals,
paper applications, automatic awards, and unavailable cycles. Counts match the canonical
model; independent review has no critical/high correctness, privacy, security, or
accessibility findings.

**Rollback:** Deploy the last accepted application revision and keep canonical data
unchanged.

### P8 — Monitoring, review operations, and recovery

**Objective:** Keep links, facts, and cycles current through bounded automation and
explicit human review.

**Entry prerequisites:** P7 accepted; review states and rollback receipts stable.

**Deliverables:** Scheduled read-only checks, change detection, rate limiting, retry and
backoff, freshness policy, review queue, notifications/reporting, dry-run and apply modes,
run receipts, recovery procedure, and operator documentation.

**Out of scope:** Unreviewed destructive updates and production migration.

**Verification:** Two consecutive testing-sheet dry runs reconcile without duplicate or
lost work. Simulated 404, timeout, bot block, redirect, date conflict, portal change, and
partial-run recovery behave as specified. Failed runs cannot partially publish accepted
state.

**Acceptance:** Monitoring is observable, resumable, idempotent, and defaults to review
for ambiguity; independent review finds no critical/high destructive or privacy path.

**Rollback:** Disable schedules and restore the last accepted receipt; no production
sheet has been modified.

### P9 — Production migration, deployment, and closeout

**Objective:** Move the accepted system from the testing sheet to the actual Whitefish
Scholarship sheet with verified rollback and durable operational handoff.

**Entry prerequisites:** P0-P8 accepted; production spreadsheet identity explicitly
provided and production migration explicitly authorized; current production backup and
permissions verified; deploy/rollback owner identified.

**Deliverables:** Production backup, mapping and dry-run diff, migration receipt,
post-write reconciliation, deployment record, health/API/browser smoke evidence,
rollback test, operator runbook, final architecture/data documentation, and closeout
handoff.

**Out of scope:** Unrelated production data, applicant data, and silent schema changes.

**Verification:** Dry-run diff is reviewed before writes. Post-write structural counts
reconcile completely. Record verification covers 100% of archives, merges, application-
link/deadline changes, and other high-risk mutations plus a deterministic SHA-256-selected
10% of remaining active records (minimum 25, maximum 100, or all when fewer than 25).
Deployed health identifies the expected commit. Student journeys and exports pass against
production. Rollback is demonstrated without loss.

**Acceptance:** P0-P8 are accepted and delivered on `origin/main`. Independent
fresh-context review has no unresolved critical/high issue;
production evidence, deployed commit, backup, migration receipt, and rollback location
are recorded; final count semantics and remaining manual items are published honestly.
The overall program becomes complete only when P9's accepted marker and review evidence
are then present on `origin/main`.

**Rollback:** Restore the verified production backup and deploy the last accepted
application revision.

## 10. Verification matrix

Every implementation stage runs its specific checks plus the repository baseline:

```bash
cd web
npm ci
npm run plan:check
npm run typecheck
npm test
npm run build
cd ..
git diff --check
```

Use narrower commands during development, but acceptance evidence must include the full
applicable matrix. Network or credential-dependent checks must report whether they were
executed, skipped by design, or blocked; they may not be represented by local fixtures.

## 11. Independent review standard

The acceptance reviewer must:

- start from fresh conversation context;
- not have authored or edited the candidate stage;
- receive the original objective, stage contract, baseline revision, candidate diff,
  verification evidence, known risks, and explicit read-only scope;
- inspect the actual files and evidence rather than reviewing a summary alone;
- report findings ranked `critical`, `high`, `medium`, or `low`, with file/line evidence;
- challenge scope leakage, untested claims, missing failure modes, weakened gates,
  privacy risks, data loss, silent truncation, and stale-state assumptions; and
- recheck the final candidate after the implementation agent performs remediation.

Each accepted stage has `docs/evidence/<stage>-manifest.json` and
`docs/reviews/<stage>.json`. Build state pins that stage's Git baseline. Before final
review, commit the complete candidate without its new manifest/review attestation. The
manifest records that immutable candidate commit, lists every added, modified, or
deleted path between the baseline and candidate commits (excluding only that stage's
manifest and review record), hashes blobs from the candidate Git tree, and represents
deletions explicitly. The reviewer signs the manifest digest; a following attestation
commit is the direct child of the candidate commit and adds only the manifest and review
record. All later stages preserve those attestation blobs byte-for-byte.
The first structurally valid attestation addition in Git history is canonical; deletion,
re-addition, or rebinding cannot replace it. Until that attestation is delivered on
`origin/main`, the branch tip must equal the attestation commit exactly, with no later
commit. PR CI receives the actual head SHA so a synthetic merge checkout cannot weaken
this rule.

CI fetches full history. `npm run plan:check` validates every historical stage against
its own candidate commit rather than the current worktree, requires the candidate to
descend from its baseline and remain in current history, proves an undelivered
candidate's baseline equals current `origin/main`, validates the candidate and baseline
BUILD_STATE transition, compares manifest paths to the complete Git commit-to-commit
change set, recomputes candidate-tree hashes, and rejects accepted-stage regression
found in repository history. It also discovers each committed attestation, proves the
direct candidate-to-attestation parent relationship and exact two-path diff, and rejects
later rewrites of historical manifest/review blobs or an unreviewed post-attestation
branch commit. This permits P1-P9 to evolve shared governance files
without invalidating P0. The review record contains reviewer task identity,
fresh-context and read-only declarations, outcome, severity counts, reviewed time,
manifest digest, and one machine-counted disposition for every medium/low finding with
rationale, owner, and target.

Critical or high findings prevent acceptance. Medium and low findings must be fixed or
carried into `docs/CURRENT_HANDOFF.md` with rationale, owner, and target stage. The
reviewer does not edit the implementation and cannot approve its own repair.

Material plan amendments and Revision 2 delivery integrations use the same independence,
manifest completeness, hash binding, severity, disposition, and direct-child attestation
standard. Their records use dedicated evidence, manifest, and review paths so they cannot
replace a stage's canonical manifest or review.

## 12. Kickoff and handoff protocol

Every kickoff follows `docs/KICKOFF_PROMPT_TEMPLATE.md` and contains:

- authoritative read order;
- repository, remote, baseline commit, spreadsheet identity, and plan revision;
- exactly one stage objective;
- entry prerequisites and stale-state checks;
- explicit in-scope and out-of-scope work;
- invariants and external-side-effect boundaries;
- exact acceptance tests and evidence artifacts;
- autonomous Git policy;
- independent-review requirement; and
- required end-of-session handoff fields.

Every handoff records:

- active or last accepted stage;
- baseline, candidate, reviewed, PR, and merge revisions when available;
- files changed and data surfaces touched;
- commands run and exact outcomes;
- source snapshot/revision and counts;
- unresolved findings, blockers, and unknowns;
- dirty state and remote state;
- next permitted stage and kickoff path; and
- prohibited next actions.

New sessions re-ground these artifacts and perform only missing checks. They do not
restart completed stages or treat a summary as stronger evidence than committed files.

## 13. Autonomous Git delivery

`AGENTS.md` is authoritative for Git behavior. In summary:

- no routine Git questions go to Kelsey;
- preserve dirty work through isolated worktrees;
- use stage-scoped `codex/` branches;
- stage only owned files;
- commit coherent checkpoints;
- before push, PR, or merge, inspect downstream effects. The repository's Vercel Git
  integration has historically created Preview deployments for branch/PR revisions
  and Production deployments for `main` revisions;
- push, open/update the PR, and merge only when build state contains direct,
  stage-specific informed authority for every resulting deployment effect, with an
  evidence path, or when a verified suppression mechanism covers the action;
- merge only after acceptance, downstream-effect authority, and checks pass;
- do not rewrite history or bypass checks; and
- report a verified permission/authentication outage as an external blocker rather
  than asking for Git preferences.

Delivery authority covers only the downstream effect stated in build state. It never
broadens authorization for spreadsheet mutation, paid services, form submission, or
contact with scholarship providers.

### Delivery integration

When `BUILD_STATE` declares an authorized Revision 2 delivery integration, Git delivery
uses the exact two-parent candidate and its exact direct-child delivery attestation. The
validator confirms both parents, the complete change set, immutable original stage
attestation blobs, current informed authority, independent acceptance, and the branch-tip
lock. A synthetic PR merge, sibling authorization commit, or ordinary post-attestation
commit is not a substitute.

## 14. Plan amendments and decision control

Acceptance criteria may not be changed inside an implementation fix. A material plan
change requires:

1. an entry in `docs/DECISIONS.md` describing the evidence, alternatives, impact, and
   rollback;
2. a dedicated plan-amendment commit;
3. updates to this plan, `docs/BUILD_STATE.json`, affected kickoff/handoff documents,
   and the validator when needed;
4. `npm run plan:check` and baseline verification; and
5. independent review of the amendment before affected implementation continues.

Beginning with Plan Revision 2, the amendment candidate is frozen before review. Its
complete baseline change set is hashed in `docs/evidence/PLAN-REV<revision>-manifest.json`,
the fresh-context decision is recorded in `docs/reviews/PLAN-REV<revision>.json`, and a
direct-child commit adds exactly those two files. The amendment attestation remains the
branch tip until delivered. This requirement applies before an amendment can authorize
or execute an exceptional stage-delivery integration.

Emergency safety fixes may stop active work immediately, but they do not silently
rewrite the plan. Record the stop and amendment before resuming product work.

## 15. Risk register

| Risk | Required control |
| --- | --- |
| One URL represents many awards | Parent/child/application-group model and child-level evidence. |
| Portal requires pagination or interaction | Architecture routing, cursors, completeness receipts, manual review for access walls. |
| Query/fragment carries identity | Selective parameter policy with fixtures for known portal patterns. |
| Direct PDF moves while parent remains live | Parent-first verification and document-version evidence. |
| Spreadsheet link hidden behind label | CellData hyperlink reads and audits. |
| Annual deadline is mistaken for current | Cycle year, status, precision, time zone, and verified timestamp. |
| Fetch failure causes false removal | `inconclusive` state and human review; destructive action requires stronger evidence. |
| Portal row inflates scholarship count | Separate portal, award, active-cycle, and recipient-slot metrics. |
| Large portal overwhelms one run | Bounded resumable queue; no silent cap. |
| Duplicate names or shared URLs collapse awards | Sponsor/award/cycle identity plus reviewable collision signals. |
| New session drifts from plan | Required read order, machine state, one-stage kickoff, validator, and handoff. |
| Implementer reviews own work | Fresh-context read-only independent reviewer and remediation separation. |
| Dirty checkout loses user work | Isolated worktree and stage-owned staging. |
| Production is changed early | Production ID unset and mutation forbidden until P9 authority. |
| Git delivery triggers an undeclared Preview or Production deploy | Pre-delivery downstream-effect inspection and direct stage-specific deployment authority with evidence, or verified suppression. |
| Public API leaks sensitive columns | Hard allow-list and privacy tests. |
| Dependency vulnerabilities remain hidden by green tests | P1 inventory, P7 remediation/exposure review, and no unresolved critical/high exploitable finding at launch. |

## 16. Completion reporting

Stage completion reports lead with the outcome and include:

- accepted stage and scope;
- merged PR and commit;
- verification commands and outcomes;
- independent review result and carried findings;
- sheet/source counts and evidence path when applicable;
- whether any external state changed;
- next permitted stage and kickoff path; and
- exact blockers or unknowns without inflating them into completed work.

Do not claim the overall program complete until P9 is accepted.
