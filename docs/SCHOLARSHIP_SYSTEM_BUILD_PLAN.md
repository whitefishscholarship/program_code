# Whitefish Scholarship System Build Plan

Plan revision: 20
Status: canonical
Repository: `whitefishscholarship/program_code`
Default branch: `main`
Organizer authoring master (user-confirmed, read-only verified): `1Dp5AMnrfSQ-Xf-r03S75lKsGPJk7o0inOgvC9Q6lOl4`
Legacy comparison-only spreadsheet (access unauthorized): `1eWGMdavcEECUcY_-nZ9gR2nMTN7T7T6oipG5ql1LoIE`
Application runtime source: validated immutable versioned publication; not yet created or authorized

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
  source and verification outcome. Application-method and cycle details are retained
  when observed; their absence remains unknown and does not fabricate a negative fact.
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
- Students can complete a privacy-preserving guided interview and receive transparent,
  evidence-bounded scholarship matches without the browser storing or transmitting
  their answers. Unknown eligibility remains visible as unknown rather than becoming a
  false exclusion.
- Monitoring produces a bounded review queue and never overwrites authoritative
  facts merely because a page changed or a fetch failed.
- Production has no unresolved critical/high exploitable dependency or application
  security finding; accepted exceptions identify evidence, exposure, owner, and
  target removal stage.
- The production migration is backed up, reconciled, reversible, deployed from a
  recorded commit, and independently reviewed.
- P0 through P9, including P8R, P8M, and P8F, are accepted, delivered through reviewed Git
  history, and have durable evidence and handoffs.

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
- Collecting, transmitting, persisting, or committing student interview answers or
  applicant PII. P8R and P8F may process voluntary answers only in volatile browser
  memory.
- Bypassing logins, CAPTCHAs, access controls, robots restrictions, or rate limits.
- Treating commercial scholarship aggregators as final factual authority.
- Guaranteeing that a student will qualify for or receive an award.
- Automatically converting an ambiguous page change into a destructive archive.
- Mutating the production Whitefish spreadsheet at any stage, including P9.

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
2. **Spreadsheet boundary.** P0-P8F, including P8M, may not configure or mutate the
   legacy comparison-only Whitefish spreadsheet. P8M may access or mutate the organizer
   master only under its later exact stage-specific read/write authority.
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
13. **Conservative matching.** Student answers may hard-exclude an award only when a
    typed, accepted public eligibility fact proves a conflict. Missing, ambiguous, or
    free-text-only facts remain possible matches with a visible verification note.

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
P0-P8, P8R, P8M, and P8F specifically `accepted` and cannot use supersession to bypass them.

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

Plan Revision 2 introduced a narrow per-stage delivery-integration framework. A stage
may use it only when a later independently reviewed amendment pins that exact candidate,
attestation, authority, and evidence paths. Plan Revision 4 enables the framework only
for P2 candidate `1a6376207eb467ff0977298de16a1c0d0db1b3cd` and attestation
`cc277b34075f6d648ff3c71022fadf6a6c632b34`. The integration is permitted only when all
of these conditions hold:

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
   `docs/CURRENT_HANDOFF.md` may differ to reconcile delivery state. `BUILD_STATE` must
   equal the delivered amendment baseline except for the exact pending-to-accepted
   integration fields and the stage array/next pointer copied from the preserved stage
   candidate; the authority object and every pinned identity/path remain unchanged.

The exact state comparison in condition 7 is historical: the validator reads
`docs/BUILD_STATE.json` from the immutable delivery candidate named by the attested
delivery manifest and compares that blob with the mechanically derived transition. It
must not compare the derived transition with the current worktree state. After the
integration is delivered, later independently governed stages and plan amendments may
advance the current stage pointer, stage records, blockers, authorizations, and other
machine state through their ordinary contracts. That later evolution neither changes
nor weakens the preserved integration because its candidate, manifest, review,
attestation, identities, authority, paths, and blobs remain hash-bound and are
revalidated from Git history.

Immediately after the newest integration, the current `BUILD_STATE` may equal that
integration candidate's exact derived historical state; equality is correct, not a
failure to evolve. After later stages or amendments, the current state may differ.
Regression tests must validate both cases without ever using current-state inequality
as a historical acceptance requirement. They must reject deletion, downgrade, or
rebinding for every accepted integration and reject mutation of every historical
delivery candidate.

Every integration that has ever reached `accepted` in the current Git history is
non-regressing machine state. The validator discovers those historical records and
requires the current state to retain each one exactly. Deletion, downgrade to pending,
or rebinding of any identity, authority path, manifest, review, baseline, or allowlist
is invalid and cannot be used to skip historical validation.

This mechanism is an exceptional delivery bridge, not a general post-attestation edit
path. Each stage may have at most one delivery integration, and every commit is pinned.

### Late authority for an undelivered plan amendment

Plan Revision 11 adds one narrower continuation for the canonical, accepted, but
undelivered Plan Revision 10 attestation. This is not an ordinary post-attestation
commit and does not amend or rebind Revision 10. It is valid only when all of the
following are true:

1. The target is exactly Plan Revision 10 candidate
   `519f8b0cc3cb1da7d1cb75651940358b5722f9e9`, direct-child attestation
   `4a22711bbb352d763298c6200768dc181662f80f`, and original live baseline
   `390b270c5d3127ff2705ffb114212a518a1d5953`.
2. The continuation uses only branch `codex/plan-rev11-rev10-delivery`, descends from
   the exact Revision 10 attestation, and changes exactly the machine-recorded
   governance, evidence, test, and validator allowlist. Product, data, runtime,
   workflow, spreadsheet, source, and deployment-configuration changes are forbidden.
3. Plan Revision 11 records direct informed authority for its branch push, pull
   request, resulting Vercel Preview, merge, resulting Vercel Production deployment,
   CI, and deployment verification. The satisfied Revision 10 permission blocker is
   removed without changing Revision 10's immutable historical authorization record.
4. The Plan Revision 11 manifest uses the unchanged live `origin/main` baseline and
   covers the complete baseline-to-continuation candidate, including the exact Revision
   10 candidate, manifest, review, and attestation ancestry. A new non-author,
   fresh-context reviewer accepts that complete tree.
5. A direct-child Plan Revision 11 attestation adds only its manifest and review. Until
   delivered, that attestation is the only permitted continuation tip. Once merged,
   both Revision 10 and Revision 11 attestations must be ancestors of live
   `origin/main` and remain byte-identical.

The bridge binds the exact Revision 10 candidate and attestation. Stop before P8M access.
This continuation carries authorization to deliver governance only. The user's later
P8M intent does not manufacture still-unknown tab/range,
denominator, revision, source, reviewer, or write-gate facts; P8M begins only after its
exact entry contract is machine-pinned without inference.

### Row-source correction and incomplete-fact progress

Plan Revision 12 corrects the P8M source contract before P8M execution. The original
`Master Database` has neither an application-group field nor a cycle/cycle-ID field.
Those concepts may remain in the frozen normalized matching contract for facts that are
later explicitly observed, but they are not source columns, required source identities,
or source denominators. No future processor may invent them to make a row look complete.

The read-only pin is spreadsheet
`1Dp5AMnrfSQ-Xf-r03S75lKsGPJk7o0inOgvC9Q6lOl4`, sheet title `Master Database`,
gid `0`, used range `'Master Database'!A1:O198`, Drive revision `225`: one header and
197 populated rows, comprising 176 rows explicitly labeled `Scholarship` and 21 labeled
`Portal`. The 197 populated rows are the complete source denominator. The 176
Scholarship rows are a typed row subset, not proof of 176 distinct stable awards; 175
names are unique and one exact-name duplicate group requires identity reconciliation.
Application-group and cycle counts are not source denominators.

Every source row must receive one deterministic row outcome, so completeness remains
measurable. Completeness means no row is silently lost; it does not mean every field is
known; blank source cells remain unknown. An unavailable fact, inaccessible page,
incomplete scrape, or unsupported criterion may enter an explicit unknown/manual-review
outcome while other valid facts and rows continue. Unknown and proposal-only values
cannot affect matching until accepted through the governed evidence and human-review
path. This flexibility never permits a false value, inferred negative, silent skip,
self-accepted AI output, or weakened provenance rule.

Revision 12 records the completed metadata-and-`Master Database` pin only. It authorizes
no spreadsheet write. External URL reads and Claude processing still require the exact
bounded URL-column/allowlist instruction, and P8M acceptance still requires a named
human fact reviewer. Revision 12 itself is governance-only and stops before P8M
execution, P8F, and P9.

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

### P8R — Student interview and matching restoration

**Objective:** Restore the guided student interview as the primary path to an
on-page, privacy-preserving set of scholarship matches while preserving the accepted
P7 catalog, API compatibility, count semantics, accessibility, exports, and P8
monitoring boundaries.

**Entry prerequisites:** P8 accepted and delivered; Plan Revision 8 accepted, attested,
and delivered; live `origin/main` verified; P9 remains planned and unstarted; the P8R
test matrix is committed before product implementation.

**Deliverables:** An accessible interview-first flow with an explicit browse-all
alternative; validated typed answers held only in volatile browser memory; a typed,
deterministic matcher over the current canonical public award model; evidence-bounded
match, possible-match, and known-conflict decisions with student-readable reasons;
matched-result cards that retain current filters, sorting, application methods, cycle
status, official links, and CSV export; edit/reset/error/empty states; a privacy and
public-field allow-list; deterministic matching fixtures; and complete mobile, tablet,
and desktop browser evidence.

The matcher may use a student answer as a hard gate only when an accepted structured
public fact proves the conflict. It may rank an award using accepted structured facts
and clearly labeled non-eligibility preferences. It must not infer a hard residence,
identity, health, hardship, affiliation, renewal, deadline, or application requirement
from substring matching, a default Montana assumption, or missing data. Unknown or
unmodeled eligibility remains a possible match with an explicit verification reason.
The existing legacy `{data}` API compatibility payload may remain available to existing
consumers, but P8R matching must not depend on the legacy heuristic processor as its
source of truth.

**Out of scope:** Any scholarship spreadsheet read or write; production source access
or configuration; P9 or `P9-IDENTITY-PINS`; live monitoring or schedule activation;
scholarship fact mutation; form/application interaction; applicant-data collection;
analytics or answer telemetry; provider contact; dependency changes not strictly
required for P8R; and deployment-configuration changes.

**Verification:** Before implementation, commit a P8R matrix covering interview start,
required and optional answers, back/edit/reset, all supported hard gates, unknown-fact
preservation, known conflicts, deterministic ranking, zero-result and error recovery,
browse-all fallback, result filtering/sorting, official links, and matched CSV export.
Run every applicable journey at 360x800, 768x1024, and 1440x900. Unit and adversarial
tests must reject legacy `Non-Renewing` substring classification, year-2001 deadline
fallback, default-Montana exclusion, identity/health free-text hard gates, stale answer
reuse, and any answer write to `sessionStorage`, `localStorage`, cookies, IndexedDB,
request bodies, URLs, logs, or analytics. API/schema, privacy allow-list, canonical count
reconciliation, keyboard/focus, screen-reader status, current browse-all journeys,
admin-route compatibility, export safety, typecheck, full tests, production build,
dependency audits, and whitespace checks must pass.

**Acceptance:** The interview is the primary student flow and presents the resulting
matches on the website. Every displayed decision has deterministic reasons; no unknown
fact becomes a false eligibility claim or silent exclusion; current P7 catalog counts
and record relationships reconcile exactly; no student answer is transmitted or
persisted; all predeclared browser cells pass without unexplained exclusion; and a
fresh-context independent reviewer reports no critical/high correctness, privacy,
security, accessibility, or regression finding.

**Rollback:** Deploy the last accepted P8 application revision, which retains the
canonical browse-all catalog. No spreadsheet, accepted scholarship fact, P8 schedule,
production configuration, or P9 state changes during rollback.

### P8M — Matching-fact enrichment and acceptance

**Objective:** Produce evidence-backed, independently reviewed normalized matching facts
for every one of the 197 pinned source rows, without requiring unavailable fields or
allowing AI proposals, free text, missing evidence, or edit capability to become
accepted truth or write authority.

**Entry prerequisites:** Plan Revisions 10 through 12 are accepted, direct-child
attested, delivered, and reverified on live `origin/main`; P8M is the sole
next-permitted stage. The exact row-source pin and no-write boundary are already
recorded. Before external acquisition or Claude processing, direct authority must name
the exact URL-bearing input columns, official-source allowlist, and Claude processing
instruction. Before acceptance, it must name the human fact reviewer. Git/Vercel
delivery authority is recorded; spreadsheet writes remain prohibited. P8F, P9, and
`P9-IDENTITY-PINS` remain planned and unstarted.

**Source and identity boundary:** The organizer authoring master is the exact
Revision 12 pin: spreadsheet
`1Dp5AMnrfSQ-Xf-r03S75lKsGPJk7o0inOgvC9Q6lOl4`, `Master Database`, gid `0`, used
range `'Master Database'!A1:O198`, revision `225`, one header plus 197 populated rows.
Only those cells and spreadsheet metadata were read during source pinning; the revision
remained unchanged. The former production spreadsheet is legacy comparison-only and
unread. Human editor, proposal processor, fact reviewer, and read-only application
runtime are distinct identities. Application runtime may eventually consume only a
validated immutable versioned publication. Edit access is capability, not operation
authority, and no sheet write is authorized.

**Matching-fact contract:** The exact machine-readable contract is
`docs/evidence/PLAN-REV10-matching-fact-contract.json`, contract
`matching-facts-v1`, taxonomy `1.0.0`. Each accepted fact is keyed by stable `award_id`
and, only when a fact is explicitly cycle-specific, an optional exact `cycle_id`; it
carries a controlled `criterion_id`; effect
`required|preferred|informational`; typed operator/value; status
`proposed|accepted|rejected|conflict|stale|unknown`; exact source/revision/observation;
short non-PII evidence; reviewer/time/rationale; and taxonomy version. The source row
ledger is separate from the normalized fact ledger. Every row must reconcile to a
stable award/portal outcome without using scholarship name alone; the exact-name
duplicate is resolved explicitly. A source row does not require a cycle ID or
application-group identity. Parent, child, application, and cycle concepts remain
distinct whenever evidence actually establishes them.

The contract's executable validator is `web/scripts/matching-fact-contract.ts`.
Unknown fields and enum members fail closed. It binds exact scalar/set/date/identifier
shapes, per-criterion numeric bounds and units, closed enum domains, one four-field
inclusive-bound object for `between`, evidence-status-specific null/source/reviewer
rules, and lossless fixed-value expansion for aggregate historical aliases. Open-ended
places, schools, organizations, employers, fields, service types, and sports use
normalized identifiers rather than unbounded enum strings.

The frozen taxonomy covers academics; education and institution; geography; service,
work, leadership, and caregiving; financial need; learning/neurodiversity; health and
hardship; heritage/demographics/identity; career and field interests including aviation
and nursing; athletics; military/first responder; organizations; employers;
application modes/groups/supplements; and cycles. Their presence in the taxonomy does
not assert matching source fields or require one fact per category. Unknown criteria
stop for taxonomy review; examples never define the complete scope. One `learning.adhd` criterion maps
the historical ADHD control; ADD is not a separate recovered question or alias.

**Evidence policy:** When cycle-specific official child-award evidence exists, it
outranks parent or yearless evidence. Organizer-reviewed master facts may be accepted directly only where
the organizer is the authoritative owner for that local award field; material
eligibility, deadline, cycle, and application facts otherwise require current official
provider evidence. Secondary sources and AI output are proposal/discovery only. Equal-
authority disagreement becomes `conflict`; it blocks acceptance and matching use.
Observed cycle facts stale at cycle close or declared replacement; yearless/prior-cycle facts
stale at the next calendar year until reverified; non-cycle accepted facts require
review after 365 days. A successful fetch does not refresh an unobserved field.

**Claude/Codex boundary:** Claude is proposal-only after the remaining exact authority
and taxonomy/input freeze. It receives the revision-pinned 197-row input plus only the
separately allowlisted official URLs and emits schema-valid
JSON/JSONL plus provenance, confidence/ambiguity, prompt version, input/output
fingerprints, checkpoint/resume cursors, and complete-row receipts. A row may validly
finish with known facts plus explicit unknown outcomes. Claude never
writes the master, accepts its own facts, treats absence as false, processes applicant
PII, enters applications, contacts providers, or silently truncates rows or sources.
Codex owns stable-ID binding, validators, duplicate/conflict/
coverage checks, source-policy enforcement, complete reconciliation, review packaging,
and any separately authorized exact write/readback workflow.

**Future write gate:** Edit access is capability, not operation authority. A write
requires a separate direct informed instruction naming the exact spreadsheet, tab,
columns/ranges/cells, operation count, source revision, backup owner, rollback owner,
and acceptance evidence. Before mutation, create and verify a reversible backup and a
deterministic dry run accepted by the human fact reviewer and independent reviewer.
Apply one bounded idempotent batch, immediately read back every target, prove every
untargeted cell unchanged, and reconcile all accepted, rejected, conflict, stale,
unknown, and remaining rows. A successful API reply alone is not acceptance.

**Deliverables:** Verified source-role/identity receipt; exact 197-row denominator and
row-to-award/portal reconciliation; validated proposal and completeness ledgers;
normalized fact set; conflict,
stale, unknown, rejected, and remaining-work queues; reviewer decisions; optional exact
write/readback evidence only if separately authorized; immutable publication candidate
for later runtime use; reconciliation; rollback; independent review; manifest; and
direct-child attestation.

**Out of scope:** Any action not named by the later P8M authority; applicant data;
application/form interaction; provider contact; self-accepted AI output; silent
truncation; mutable-master runtime reads; P8F product work; P9 or identity pins;
monitoring activation; deployment-configuration changes; and every unapproved write.

**Verification:** Validate every input and output fingerprint, taxonomy ID/operator/
value, stable identity binding, source/evidence precedence, freshness transition,
conflict, sensitive-state rule, duplicate, and completeness total. Reconcile all 197
source rows exactly once with no missing or duplicate row outcome. Fact, source, cycle,
or application-group counts may be zero or incomplete where evidence is unavailable;
that is recorded as unknown/manual review rather than treated as a failed batch. Review
100% of required-effect, sensitive, conflict, stale, rejection, unknown, parent/child,
shared-application, and write-bound records plus a deterministic sample of all
remaining proposals. Prove proposal-only isolation, no PII, no direct write, no self-
acceptance, no form/provider action, checkpoint/resume idempotency, and fail-closed
truncation. Run the repository matrix and obtain fresh-context C0/H0 review.

**Acceptance:** Every one of the 197 source rows has one reconciled outcome; every
accepted fact is schema-valid, current under its freshness rule, bound to the exact
stable award and any explicitly observed cycle, and
field-specific authority, and independently reviewable. Proposed/unaccepted evidence
cannot affect matching. A row need not have every possible fact. Missing, ambiguous,
unavailable, free-text-only, provenance-free,
unanswered, nonselected, or sensitive nonselection remains unknown and non-excluding.
Any authorized write reconciles exactly with zero untargeted change. P8M is delivered
before P8F becomes next-permitted.

P8M accepted and delivered is an absolute P8F entry gate; a local acceptance marker,
prepared kickoff, or next-permitted pointer is not a substitute for live delivery.

**Rollback:** Remove the P8M publication/proposal batch by its exact receipt and retain
the last accepted P8R product. If a separately authorized sheet write occurred, use its
verified backup or inverse receipt only under the recorded rollback authority. Do not
activate P8F, P9, monitoring, or runtime source changes during rollback.

### P8F — Former interview detail and routing restoration

**Objective:** Restore the complete last-active former interview question detail and
its intended search workflow inside the accepted P7/P8R product, without reconnecting
legacy heuristics, persisting answers, or turning missing/unaccepted evidence into an
eligibility decision.

**Entry prerequisites:** P8R, Plan Revisions 9 and 10, and P8M accepted,
direct-child attested, and delivered; live `origin/main` verified; P8F is the sole
next-permitted stage; exact accepted matching facts and their immutable publication are
pinned; P9 remains
planned and unstarted; the pinned `4c20637a351d272788e24ac9d02e541494644832`
history and every blob in `docs/evidence/PLAN-REV9-interview-inventory.md` are
reverified; and the complete P8F test matrix plus old-ID-to-new-control/rule map are
committed before product implementation.

**Deliverables:** An accessible detailed interview covering the six former academic
prompts, four activity/responsibility checkboxes, conditional volunteer-hours prompt,
financial-need prompt, and all 38 final former special-criteria IDs; an exact migration
map for the earlier six-option `organization_affiliations` control without rendering a
duplicate affiliation question; an exact disposition for
every former filter, score, sort, and result/export route; optional/prefer-not-to-answer
handling for sensitive traits; typed award-bound match/possible/conflict rules with
visible reasons; an explicit no-current-effect state for any answer lacking accepted
rule authority; on-page matched results that preserve current P7/P8R cards, counts,
relationships, filters, sorting, application methods, cycle state, official links,
browse-all, admin/API compatibility, and visible-result CSV export; edit/back/reset/
reload/empty/error/accessibility states; strict privacy/public-field allow-lists; and
complete deterministic and three-viewport evidence.

The reachable history supports one `adhd` control labeled `ADHD`, whose tooltip expands
Attention-Deficit/Hyperactivity Disorder. It contains no distinct ADD question. P8F may
not invent a second ADD control. SAT, ACT, FAFSA completion, skills, creative skills,
background, constraints, and career interests existed only in TypeScript types at the
pinned snapshot and may not be represented as recovered former questions.

Complete history also includes an earlier active standalone
`passiveSignals.organization_affiliations` question with six values: `Military`,
`First Responder`, `Farmers Union`, `Electric Co-op`, `Credit Union`, and `Elks Lodge`.
The final configuration migrated those concepts respectively to `military_veteran`,
`first_responder`, `farmers_union`, `electric_coop`, `credit_union`, and `elks_lodge`.
P8F must preserve the mapping but render only the final controls. The earlier
`New for 2026!`/`is_new` +5 rule is explicitly retired as an unsupported legacy boost.

Every hard conflict requires both an explicit contradictory typed student answer and an
award-bound field-specific accepted public fact. Missing, ambiguous, free-text-only,
manual-review, provenance-free, unanswered, nonselected, and prefer-not-to-answer states
remain non-excluding. Positive sensitive identity, health, hardship, demographic,
affiliation, and employer answers may influence results only through exact accepted
authority; nonselection is never a negative fact. A question with no accepted rule must
say that it did not narrow results.

P8F must implement the Revision 9 retained/safely-replaced/retired disposition table.
It may not import, reconnect, copy, or disguise historical `processor.ts` or
`rulesPack.ts` behavior as matching truth; restore default-Montana, date/substr, text-
affiliation, amount/portal/criterion-point, or essay-penalty heuristics; consume legacy
`{data}` rows as matcher truth; store matched rows for retry; or return to an Excel-only
result screen. Ordering is deterministic by accepted decision tier, explicit mapped
preference, the current selected P7 sort, and stable award ID tie-break.

**Out of scope:** Any spreadsheet or public-source read/write; accepted scholarship fact
mutation; production source/configuration work; P9 or identity pins; live monitoring or
schedule activation; form/application interaction; applicant data; answer/decision
telemetry or persistence; provider contact; paid/destructive actions; deployment-
configuration change; dependency change not strictly required for P8F; history rewrite;
gate weakening; and broader product/data scope.

**Verification:** Before implementation, commit a matrix that accounts for every
historical displayed ID, label, option, conditional, configuration migration,
type-only exclusion, rule
disposition, and result/export route. Unit and adversarial tests must prove the exact
question counts; one ADHD/no separate ADD control; required validation; every accepted-
fact gate and sensitive optional/non-answer state; unknown preservation; deterministic
ordering; current filters/sort/links/export; reset/reload; and complete API/catalog/admin
compatibility. They must reject default-Montana exclusion, `Non-Renewing` substring
classification, year-2001 deadline fallback, free-text identity/health/affiliation
gates, arbitrary legacy scoring, legacy processor/rules imports, legacy `{data}` matcher
coupling, matched-row storage, stale answers, and every persistence/transmission channel.
Reconcile the exact accepted catalog graph/counts and run every applicable journey at
360x800, 768x1024, and 1440x900 plus the full repository matrix, both dependency audits,
privacy/export allow-lists, keyboard/focus/screen-reader checks, and whitespace checks.

**Acceptance:** Every historical display/rule route has one count-matched disposition;
the detailed interview works without false exclusion or unsupported promotion; every
displayed result has deterministic reasons; no answer, decision, or matched-row payload
is transmitted or persisted; the accepted P7/P8R catalog and product surfaces reconcile
exactly; every declared browser cell passes without unexplained exclusion; and a fresh-
context independent reviewer reports no critical/high correctness, privacy, security,
accessibility, evidence, or regression finding.

**Rollback:** Deploy the accepted P8R application revision. No spreadsheet, accepted
scholarship fact, P8 schedule, production configuration, or P9 state changes during
rollback.

### P9 — Production migration, deployment, and closeout

**Objective:** Deploy the accepted P8F application against the exact validated,
immutable, versioned matching-fact publication accepted in P8M; prove the runtime has no
spreadsheet capability; demonstrate deployment/configuration rollback; and close the
program without reading or mutating either spreadsheet.

**Entry prerequisites:** P0-P8, P8R, P8M, and P8F accepted and delivered; Plan
Revisions 7 through 10 accepted, attested, and delivered; exact P8M publication path,
schema/taxonomy version, source-master revision receipt, accepted-fact digest, generator
digest, candidate, manifest, review, and attestation pinned; P8F reconciled to that
publication; the read-only application runtime identity separated from every human,
proposal, reviewer, Google, and write-capable identity; deployment and rollback owners;
exact non-secret Vercel project/team/canonical-host pins; protected verification
environment and secret provenance; and current direct P9 Git/deployment authority.

The organizer master is not a runtime data surface. The application runtime must read
only the accepted publication bytes bundled with or fetched by exact content digest
from an immutable read-only artifact. It must hold no Google credential or Sheets/Drive
scope. Spreadsheet `1eWGMdavcEECUcY_-nZ9gR2nMTN7T7T6oipG5ql1LoIE` remains
legacy comparison-only and inaccessible unless a later independently reviewed plan
amendment grants an exact comparison read. The former `P9-IDENTITY-PINS` path is retired
unstarted by Revision 10 because it pinned a Google-sheet runtime that is no longer the
chosen architecture; its absent artifacts remain absent and no historical Revision 7
evidence is rewritten.

Plan Revision 10 prospectively supersedes the old P9 operational validator and current
stage-delivery authorization while preserving the Revision 7 candidate, evidence,
review, attestation, and authority text as immutable history. Replacement P9 is
unauthorized until new direct target-specific authority is recorded; Revision 7
authority cannot satisfy that additional gate. The validator applies the old Google-
sheet receipt and identity-pin law only to pre-Revision-10 state and applies the
immutable-publication/runtime/provider pin lifecycle to Revision 10 and later.

**Deliverables:** Publication identity/pin receipt; static/runtime proof that no
spreadsheet ID, credential, scope, client, or mutator is reachable from the application
runtime; exact deployment target and commit; publication-to-model/API/UI count and hash
reconciliation; health/API/browser/export smoke; rollback to the accepted P8F static
publication configuration; restored deployment proof; operator runbook; final
architecture/data documentation; closeout handoff; independent review; manifest; and
direct-child attestation.

**Out of scope:** Every spreadsheet or public-source read/write; master or legacy-sheet
runtime access; production spreadsheet configuration; applicant data; form/application
interaction; provider contact; monitoring activation; mutable publication aliases;
unreviewed fact refresh; and any deployment/configuration target not directly authorized
and identity-pinned.

**Verification:** Recompute every publication and accepted-fact digest from the exact
P8M candidate; prove P8F and the deployed runtime use those bytes; reject mutable paths,
network fallback, environment-selected alternate publications, Google credentials,
Drive/Sheets scopes, and all spreadsheet client construction or write calls. Bind
project/team/host, provider Git SHA, deployment IDs, health nonce, publication digest,
runtime descriptor, and rollback/restored observations. Reconcile complete award,
cycle, matching-fact, source, application-group, and result denominators. Run the full
repository matrix, audits, health/API/browser/export smoke, rollback demonstration, and
fresh-context C0/H0 review.

**Acceptance:** The exact accepted publication is the sole deployed fact source; the
runtime has zero spreadsheet capability; counts and hashes reconcile; deployment and
rollback are authenticated; no critical/high finding remains; and all unresolved
manual/stale/unknown facts are published honestly. The program is complete only after
P9's accepted attestation is delivered and the authenticated Production smoke/rollback
record is complete.

**Rollback:** Deploy the accepted P8F application and its same pinned publication under
the last accepted static configuration. Do not access or change either spreadsheet,
publication contents, accepted facts, P8 schedule, or provider permissions.

### Historical pre-Revision-10 P9 contract — non-operative

The text below is preserved as historical Revision 7-9 evidence. Plan Revision 10
supersedes its Google-sheet runtime, backup-read, `P9-IDENTITY-PINS`, and three-deployment
trusted-workflow mechanics. None may execute unless a later independently reviewed plan
amendment expressly restores them. Their no-production-write, privacy, independent-
review, manifest, attestation, and exact-target safety principles remain mandatory.

**Objective:** Move the accepted application from its testing/static source boundary to
the actual Whitefish Scholarship spreadsheet as a strictly read-only source, with
verified configuration rollback and durable operational handoff.

**Entry prerequisites:** P0-P8, P8R, P8M, and P8F accepted and delivered; Plan
Revisions 8, 9, and 10 accepted, attested, and delivered; the organizer master has been
verified under exact authority; the immutable versioned publication and read-only
runtime identity are explicit; the legacy comparison-only source has no operative role
unless a later amendment grants an exact comparison read; current backups of
the exact authorized scholarship tabs verified; the exact deployed runtime principal
identified without exposing credentials and proved to hold one direct, unexpired
`reader` production permission rather than `writer`; that principal proved able to read
both exact private backup spreadsheet IDs, or a separately authorized backup verifier
recorded; deploy/rollback owner identified; exact non-secret Vercel project/team
fingerprints and canonical student-facing Production hostname authority-pinned; the
protected verification environment and environment-scoped secret provenance
authenticated; the exact revision `9857`, tab IDs/titles/grid bounds, source hashes,
backup hashes, and unchanged post-read revision reverified at P9 entry; and Plan
Revision 7 independently accepted, attested, and delivered. The connected user's Drive
account, a stored credential, or a CI-runner Google read is not deployed application-
path proof. Any mismatch or missing pin blocks P9 pending a new directly authorized,
independently reviewed amendment and current backup receipt; never extend a range or
treat an older backup as current silently.

**Deliverables:** Authorized-tab production backups; a structured, validator-checked
`docs/evidence/P9-entry.json` receipt; mapping and dry-run diff; configuration-cutover
receipt; structured `docs/evidence/P9-post-cutover.json` zero-mutation receipt;
an authenticated `docs/evidence/P9-deployment.json` Vercel rollback-probe record;
the exact dormant default-branch trusted-proof workflow delivered by Revision 7;
post-cutover read-only source-to-model/API/UI
reconciliation, deployment record, health/API/browser smoke evidence, configuration
rollback test, operator runbook, final architecture/data documentation, and closeout
handoff.

**Out of scope:** Every production spreadsheet write or metadata/permission mutation;
unrelated production tabs or data; applicant data; silent schema changes; and changing
the existing write-capable `GOOGLE_SHEET_ID` path to the production ID.

**Verification:** The mapping/dry-run diff is reviewed before the configuration cutover.
Production CellData is read only from the two exact bounded scholarship tabs and the
complete authorized-tab structural counts reconcile to the mapped canonical graph.
The two earlier SHA-256 values remain historical provenance because their original
serialization was not recorded. Operative entry and phase proof freshly read each exact
source bound and its existing private backup, hash the canonical JSON of the returned
`sheets[].data` GridData payload under
`google-sheets-v4-griddata-canonical-json-v1`, require source/backup equality, and
require the same canonical source digest in every phase.
Record verification covers 100% of mapped archives, merges, application-link/deadline
differences, and other high-risk transformations plus a deterministic SHA-256-selected
10% of remaining active records (minimum 25, maximum 100, or all when fewer than 25).
Tests prove the production ID cannot reach any write-capable code path, the production
client requests only read-only OAuth scope, and any admin/write path remains pinned to
the testing ID or is disabled. Deployed health identifies the expected commit. Student
journeys and exports pass against the production read model. Rollback is demonstrated
without writing the production spreadsheet. After deployment smoke and again after the
rollback proof, re-read only the authorized bounds and prove revision `9857`, tab/grid
identities, canonical bounded-GridData source/backup equality and cross-phase hashes,
and sharing state are unchanged. The structured
receipts must record zero production write calls and be immutable in the accepted P9
candidate. Schema-v1 receipts, self-asserted provider JSON, SHA-shaped claims, and
unexecuted writer-test assertions are forbidden. Each exact canonical receipt must pass
GitHub OIDC artifact-attestation verification for the delivered default-branch
`.github/workflows/p9-evidence.yml`, exact repository, exact P9 baseline source digest,
and hosted runner.

Cutover and restored-cutover health must return a fresh nonce-bound application-read
observation containing the exact production ID, sole read-only Sheets scope, and both
exact tab IDs/titles/bounds/dimensions. For each tab, the proof digest is computed over
an exact domain-separated envelope containing the unpredictable runner nonce and the
complete normalized bounded GridData payload—not over a stored source digest. The
trusted runner independently computes the same digest from its own bounded read; an old
full-sheet hash or `hash(nonce, oldHash)` cannot satisfy the contract. The response
contains no cell values. Static rollback health must return no production-read
observation. The trusted phase also hashes and structurally verifies the exact deployed
health route, public scholarship route, and their one shared loader at the provider-
reported runtime commit, including direct result dataflow and the sole read-only Google
call. This proves the deployed application path rather than only the control-plane
credential or an unused Google read. The source permission fingerprint must bind the
runtime principal to a direct, unexpired `reader` permission, and both backup reads must
bind to that same authorized principal.

All operational identity fingerprints must be non-null in the exact delivered P9
baseline before the trusted runner makes any network call. Hash exact provider project
and team IDs as UTF-8 text, the canonical lowercased hostname as UTF-8 text, the exact
verification-environment name as UTF-8 text, and the strict non-secret runtime-identity
descriptor as canonical JSON. The environment-name hash binds identity only; hosted
approval rules and environment-scoped secret provenance still require authenticated
operational evidence and may not be inferred from the workflow file.

Revision 7 predeclares the only identity-population mechanism as stage
`P9-IDENTITY-PINS`, with fixed evidence, manifest, and review paths. Its candidate may
change only `docs/BUILD_STATE.json` plus the new pin evidence, must populate all seven
fingerprints together from a null-pin Revision 7 baseline, must keep P9 planned and all
operational proof flags false, and requires a fresh independent accepted review plus a
direct-child manifest/review attestation. The first valid attestation is canonical;
later pin or artifact change, deletion, re-addition, or rebind is rejected.

P9 first creates one rollback-safe runtime commit that separates production reads from
testing-only writes, blocks the production ID before write-client construction, and
serves its actual shared-loader runtime descriptor from authenticated health with a
fresh nonce. Deploy that same immutable runtime commit three times, with distinct
authenticated provider IDs and configurations: production-read cutover, accepted-P7
static-catalog rollback, and restored production-read cutover. The observation-only
trusted workflow runs from the delivered P9 baseline in separate entry, cutover,
rollback, restored-cutover, and finalize phases. Each phase must authenticate its
predecessor artifact and attestation; deployment creation precedes phase observation;
health and bounded source reconciliation finish before the next deployment is created.
The finalizer reproduces those relationships and emits the exact three canonical
receipts.

The deployment record's Git objects must exist: the runtime commit descends from the
exact P9 baseline and is an ancestor of the final candidate, and the validator proves no
runtime-affecting path changed after the runtime proof. “Runtime-affecting” covers the
entire tracked `web/` tree, including P7 catalog fixtures imported by the API, plus
tracked deployment-control paths. The authenticated Vercel observation must bind the
independently authority-pinned exact project/team fingerprints and canonical Production
hostname, production target, READY state, provider Git SHA, deployment hostname, fresh
health nonce, deployment ID, and the actual runtime descriptor. Mutable workflow inputs
or secrets cannot establish the authorized target by self-consistency. The
validator recomputes every observation/configuration/inventory digest, requires the
exact unique TypeScript-AST writer inventory, and requires a secrets-free trusted job to
execute the production-ID negative tests with zero client constructions and zero write
calls. Any mismatch blocks acceptance and rollback remains application-only. After
merge, authenticate the resulting Vercel Production deployment, prove the deployed main
commit, repeat health/API/browser and read-only source-fingerprint smoke, and publish the
provider/run identifiers in the governed PR delivery record.

**Acceptance:** P0-P8, P8R, and P8F are accepted and delivered on `origin/main`.
Independent fresh-context review has no unresolved critical/high issue;
production evidence, deployed commit, backups, cutover receipt, and rollback location
are recorded; zero production mutations are proved; final count semantics and remaining
manual items are published honestly.
The overall program becomes complete only when P9's accepted marker and review evidence
are present on `origin/main` and the authenticated Production deployment/smoke delivery
record is complete.

**Rollback:** Restore the last accepted application revision and its prior configuration.
The production spreadsheet is never restored or mutated; its verified backups are
evidence and emergency operator references only.

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

Material plan amendments and exceptional delivery integrations use the same independence,
manifest completeness, hash binding, severity, disposition, and direct-child attestation
standard. Their records use dedicated evidence, manifest, and review paths so they cannot
replace a stage's canonical manifest or review.

The validator discovers canonical plan amendments from their first structurally valid
Git attestations rather than only from the mutable current `BUILD_STATE`. The current
plan revision cannot roll back below the highest historically attested revision, and no
historically attested amendment record may be deleted, downgraded, or changed. Once
Revision 5 is attested, the complete P3-P8 authorization objects and the exact
`STANDING-OPERATING-MANDATE.md` candidate blob are immutable inputs to every later plan
validation. Revision 5 defines no revocation or supersession mechanism. Any future
change to those authorities must first introduce an explicit machine-recorded mechanism
through separately informed authority and an independently reviewed plan amendment;
ordinary state edits are rejected.

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

### Standing operating mandate — Plan Revision 5

Kelsey approved a standing operating mandate for P3 through P8. `BUILD_STATE` records a
separate informed delivery authorization for each covered stage, all bound to
`docs/evidence/STANDING-OPERATING-MANDATE.md`. Within one canonical stage at a time,
Codex may autonomously:

- implement the stage's explicit code, product, evidence, fixture, test, and
  documentation deliverables;
- use official public pages and documents read-only, excluding form/application
  workflows, and read the pinned testing spreadsheet only when the active stage
  requires the minimum bounded input;
- create local commits, freeze candidates, obtain fresh-context read-only review, and
  create exact direct-child attestations;
- push stage and in-scope operational-governance branches, open pull requests, merge
  after required checks, and allow the resulting Vercel Preview and Production
  deployments; and
- make separately manifested, independently reviewed, attested governance, validator,
  test, evidence, or handoff amendments necessary to keep the existing plan executable,
  without a new user authorization, when they do not weaken a gate, skip a stage,
  rewrite history, expand scope, or cause a reserved effect.

The mandate does not authorize any spreadsheet write or mutation; production
spreadsheet identity, access, migration, or P9; deployment-configuration or schedule
changes; paid actions; disclosure or new handling of secrets; destructive or
unrecoverable actions; force-push or published-history rewrite; form submission or
application interaction; provider contact; acceptance-gate weakening; or material scope
expansion. Each reserved effect requires new direct informed authority. Platform
sandbox, authentication, or provider permission prompts remain independent safeguards.

### Delivery integration

When `BUILD_STATE` declares an authorized exceptional delivery integration, Git delivery
uses the exact two-parent candidate and its exact direct-child delivery attestation. The
validator confirms both parents, the complete change set, immutable original stage
attestation blobs, current informed authority, independent acceptance, and the branch-tip
lock. A synthetic PR merge, sibling authorization commit, or ordinary post-attestation
commit is not a substitute.

Plan Revision 6 adds one narrowly governed P2 resolution path because frozen P2 and
delivered Revision 5 both changed `web/package.json`: P2 added its model scripts/test,
while Revision 5 added governance-history tests. The P2 integration may therefore
resolve exactly `docs/BUILD_STATE.json`, `docs/CURRENT_HANDOFF.md`, and
`web/package.json`. Package resolution is mechanical: start with the complete delivered
Revision 6 baseline package, preserve every existing field and test command, copy only
the exact P2 `p2:model` and `p2:model:check` scripts, and append only P2's missing test
command without duplication. The delivery validator reconstructs this result from the
immutable first parent and exact P2 attestation and rejects omission, unrelated mutation,
dependency change, or any other script change. No other stage or delivery integration
inherits this exception.

After that integration is on `origin/main`, validation of its exact derived state is
bound to the delivery-manifest candidate, not to the evolving current `BUILD_STATE`.
Every historical object and authority check remains mandatory while later stages use
the normal state machine.

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

Beginning with Plan Revision 3, a new amendment is recorded as
`attestation-gated`: the machine state does not predeclare acceptance. The validator
derives acceptance only from the exact manifest-bound fresh-context review and
direct-child two-file attestation. Each new amendment record also contains direct
informed authority for that amendment's push, pull request, merge, and resulting
deployment effects, bound to its evidence path. Amendment delivery authority never
authorizes a stage delivery or any spreadsheet, product, provider, form, or
deployment-configuration effect outside its recorded scope.

Beginning with Plan Revision 5, narrow operational amendments that are necessary to
keep this existing plan executable may rely on the reviewed standing mandate rather
than a new user-authored authorization. The amendment must still be dedicated,
attestation-gated, completely manifested, independently reviewed, delivered separately
before affected stage work resumes, and explicitly prove that it does not weaken an
acceptance gate, skip a stage, rewrite accepted history, expand program scope, or cause
a reserved effect. A material program change or any reserved effect still requires new
direct informed authority.

Plan Revision 6 exercises that operational path with additional direct informed user
authority. It changes no acceptance criterion and authorizes no product, data, CI, or
deployment-configuration effect. It only makes the already-authorized exact P2
two-parent integration executable while preserving both the Revision 5 test harness and
P2 model commands under an independently reviewed, attested, exact-output validator.

Plan Revision 7 records the user's direct P9 authority and stricter production no-write
boundary. The former P9 contract and validator required production mutation authority,
post-write reconciliation, and production-backup restoration; those requirements would
contradict the user's instruction and could route the production ID into an existing
write-capable admin endpoint. Revision 7 replaces only those P9 mechanics with a
read-only source/configuration cutover, exact authorized-tab backups, post-cutover
read-only reconciliation, write-path isolation, and application-configuration rollback.
It records, rather than conceals or retroactively authorizes, the bounded connector
reads and private backup creations that occurred before every original P9 entry gate was
present. Those actions left source revision `9857` unchanged; their prospective use is
conditional on validator-checked entry and post-cutover receipts.
It preserves P9's full mapping, sampling, smoke, privacy, unknown/manual-review,
independent-review, manifest, attestation, and delivery gates. Revision 7 must be
independently accepted, attested, and delivered before P9 starts.
Revision 7 also delivers a dormant, manual, protected-environment evidence workflow and
strict schema-v2 validators. The workflow is not a schedule, performs no action during
Revision 7, and may later make only authenticated allowlisted reads in P9. Its separate
entry/cutover/rollback/restored/finalize runs prevent a future deployment ID or a single
after-the-fact observation from being presented as chronological rollback proof.

Plan Revision 8 records the user's direct instruction to restore the interview safely
and their separately confirmed authority for the amendment and later P8R Git delivery,
including resulting Vercel Preview and Production deployments. It inserts P8R between
accepted P8 and planned P9, leaves P9 unstarted, and changes no scholarship data,
runtime behavior, spreadsheet, provider configuration, or schedule itself. Revision 8
also moves the immutable P9 trusted-proof code anchor forward only for the exact
Revision 8 governance compatibility change that recognizes the new plan revision; all
Revision 7 production identities, no-write rules, evidence schemas, and operational
proof gates remain unchanged. Revision 8 must be independently accepted, attested, and
delivered before P8R begins.

Plan Revision 9 records the user's direct follow-up instruction to recover the complete
former displayed interview detail and intended routing after accepted P8R restored only
GPA, school type, and application-mode questions. It inserts P8F between accepted P8R
and planned P9, binds the exact historical inventory and retained/replaced/retired rule
dispositions, and leaves P9 unstarted. Revision 9 itself changes no student-facing
runtime behavior, scholarship fact, spreadsheet, provider configuration, or schedule.
It advances the immutable P9 trusted-proof code anchor only for the exact Revision 9
governance compatibility change that recognizes the additional prerequisite; every
Revision 7/8 production identity, no-write rule, receipt schema, and operational proof
gate remains unchanged. Revision 9 must be independently accepted, attested, and
delivered before P8F begins.

Plan Revision 10 records the user-reported organizer decision that spreadsheet
`1Dp5AMnrfSQ-Xf-r03S75lKsGPJk7o0inOgvC9Q6lOl4` is now the authoring master and
that the team has edit access. The designation remains unverified because Revision 10
performs no spreadsheet, Drive, permission, metadata, revision, or public-source access.
Edit access is capability, not operation authority. Revision 10 classifies spreadsheet
`1eWGMdavcEECUcY_-nZ9gR2nMTN7T7T6oipG5ql1LoIE` as legacy comparison-only
with no access authority; separates human editor, proposal processor, fact reviewer,
and read-only application runtime identities; and selects a validated immutable
versioned publication rather than mutable-master runtime access.

Revision 10 inserts P8M before P8F, freezes `matching-facts-v1` taxonomy `1.0.0`,
defines the evidence ladder and freshness/conflict/sensitive-state rules, makes Claude
proposal-only, and requires exact separately informed authority for any future read,
processing, write, Git delivery, or deployment effect. P8M, P8F, P9, and
`P9-IDENTITY-PINS` remain unstarted during the amendment. P8F may begin only after P8M
is accepted and delivered. P9 is replaced with an immutable-publication deployment;
the former Google-sheet runtime identity-pin path is retired unstarted while all
historical Revision 7-9 evidence remains byte-identical.

The Revision 10 state validator permits the governed lifecycle instead of freezing the
initial unknowns forever: planned P8M is unverified/inaccessible with no publication;
authorized in-flight P8M may verify the master and create a candidate immutable
publication; accepted P8M requires verified identity and complete publication pins;
`blocked-external` and `failed` preserve a no-publication or fully pinned candidate
publication without implying acceptance; accepted P8M derives and validates its exact
candidate SHA from the canonical manifest and its exact attestation SHA from the first
valid direct-child two-file attestation;
and only separately authorized replacement P9 may add runtime/provider pins and runtime
read authority. Self-referential P8M candidate/attestation identity is derived from its
canonical direct-child manifest rather than guessed in the candidate tree.

Revision 10 itself is governance-only. It changes no product/runtime or deployment
configuration, reads or writes no spreadsheet/public source, performs no Claude row
processing, mutates no scholarship fact, starts no later stage, and activates no
monitoring. Its local candidate, independent review, and direct-child attestation are
authorized by the current instruction. Remote push, PR, merge, Preview, and Production
effects remain blocked pending separate direct informed authority.

Plan Revision 11 records the direct delivery authority received after the immutable
Revision 10 attestation and provides the single exact continuation above. It removes
only the satisfied Revision 10 delivery-permission blocker, preserves the exact
Revision 10 candidate and attestation, and authorizes the combined governance branch,
PR, Preview, merge, Production deployment, CI, and verification. It changes no stage
order, product, data, runtime, workflow, source, spreadsheet, monitoring, or deployment
configuration. The same user later authorized P8M/enrichment in principle; Revision 11
records that intent but does not claim the still-unknown exact P8M source bounds or
start P8M.

Historically attested amendment identity is non-regressing. A later amendment may add a
new revision but cannot lower `planRevision`, remove or mutate an earlier canonical
amendment record, or alter Revision 5's exact P3-P8 authority fields or mandate evidence.
Revocation or supersession is unavailable unless a later, separately authorized plan
revision first defines and tests an explicit mechanism without rewriting accepted
history.

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
| Production is changed outside exact authority | Historical Revision 7 authority remains evidence only; replacement P9 stays unauthorized until new immutable-publication runtime/provider/Git/Vercel authority and pins are directly recorded. |
| A production ID is substituted into the existing write-capable environment variable | Use a separate read-only production configuration, prove the ID cannot reach a write call, and keep the write path pinned to testing or disabled. |
| Read-only P9 rollback mutates production while restoring a backup | Roll back only application revision/configuration; production backups are evidence and are never restored under current authority. |
| Git delivery triggers an undeclared Preview or Production deploy | Pre-delivery downstream-effect inspection and direct stage-specific deployment authority with evidence, or verified suppression. |
| Public API leaks sensitive columns | Hard allow-list and privacy tests. |
| Interview answers leak or persist | Volatile browser-memory processing only; prohibit answer-bearing storage, requests, URLs, logs, cookies, IndexedDB, and analytics, with adversarial tests. |
| Matching heuristics hide viable awards | Hard gates require typed accepted facts; unknown/free-text facts remain visible as possible matches with reasons. |
| Restoring the old page regresses the accepted catalog | Integrate P8R with the canonical P7 model and existing cards/filters/export; never revert the P7 commit wholesale. |
| Former detailed questions silently reactivate unsafe rules | P8F binds every displayed ID and every legacy filter/score/export route to an explicit retained, safely replaced, or retired disposition with tests. |
| Sensitive nonselection is treated as a contradiction | Sensitive P8F controls are optional; only an explicit contradictory typed answer plus award-bound accepted authority may hard-conflict. |
| Edit capability is treated as read/write authority | P8M requires separate exact source, processing, write, and delivery authority; edit access alone authorizes nothing. |
| AI proposals become eligibility truth | Claude is proposal-only; only schema-valid, field-specific, human-reviewed accepted facts may reach matching. |
| Parent, child, application, or cycle facts collapse | Matching facts bind stable award and optional cycle IDs and prohibit inherited parent/group facts without explicit child authority. |
| Mutable master changes deployed results silently | Runtime consumes only a digest-pinned immutable versioned publication with complete reconciliation and rollback. |
| Legacy P9 source is accessed after source authority changes | The old production sheet is legacy comparison-only with no access authority; historical identity-pin/workflow mechanics are non-operative. |
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


## 17. Plan Revision 13 — Spreadsheet shortlist maintenance

P9 and the program closeout remain complete. Kelsey's direction to prioritize a
workable interview, spreadsheet filtering, and downloadable results, followed by
"continue", authorizes this one local maintenance release and the necessary
prospective matching-policy adjustment. On September 10, Kelsey separately authorized
this release's branch push, PR, Vercel Preview, merge, Vercel Production deployment,
and verification on the existing web project; exact target pins and scope are recorded
in build state and `docs/evidence/PLAN-REV13.md`.

The bounded input is the already committed Master Database revision 225 snapshot
(all 197 rows) and its completed P8M human review. No fresh spreadsheet or external
source access is included. This is a saved spreadsheet snapshot, not a current-sheet
or official-provider verification claim. Keep every historical publication, candidate,
manifest, review, attestation, source snapshot, and P9 evidence byte-identical.

A separate immutable `spreadsheet-shortlist-v1` artifact may use explicit numeric
minimum-GPA cells and resolved human-reviewed school-type tags as recorded criteria.
Conflicting, ambiguous, absent, unreviewed, or unsupported fields remain unknown.
Reviewed application-route preferences may affect ordering without excluding awards.
Do not infer sensitive eligibility from names, keywords, or nonselection. The existing
38 criteria and other unanswered/unsupported controls remain non-excluding and must
have an honest no-effect explanation. No new interview fields are required.

This prospectively permits useful spreadsheet-based shortlisting without promoting
organizer records to officially accepted `matching-facts-v1` facts. A recorded
mismatch may move an award outside the default shortlist only with a visible reason
and an always-available outside-shortlist/all-awards view. A recorded fit means only
that the evaluated recorded criteria fit; it is never a guarantee of eligibility.
Unknown fields do not cancel other supported comparisons. Catalog-only children
inherit no parent-row criteria. Preserve all 192 awards and the separate 197-row
source denominator. Do not invent cycle years, current deadlines, or open status.

Implement this adjustment as one bounded amendment/release. Commit and independently
review this policy before affected product implementation; freeze and independently
review the complete final candidate using the existing manifest and direct-child
attestation process. Local preparation is permitted with false delivery authority and
an explicit Revision 13 release blocker. That blocker is now satisfied by the direct
September 10 delivery grant. Final attestation binds the authorized candidate before
Git/PR publication, Preview, merge, Production deployment, and verification on the
existing web project. Deployment configuration changes remain outside this release.

Required evidence: complete row/award/unknown reconciliation; source and review hashes;
field provenance and conflict dispositions; representative lower/higher GPA, different
school types, undecided school, and missing-data comparisons; exact visible-result CSV
agreement; edit/reset/reload/privacy checks; keyboard/mobile/desktop browser checks;
full repository verification and independent review. Publish a clear snapshot date and
an operator refresh procedure requiring a new bounded snapshot and review. No live
scheduler, spreadsheet write, new dependency, provider permission, applicant data,
or credential access is included. Rollback is the unchanged deployed P9 revision.

Historical validation continues to authenticate P9 against its canonical candidate,
recomputing the frozen deployed runtime closure from Git blobs rather than comparing
that old deployment with a changed maintenance checkout. Current runtime capability
checks still run. Revision 12 source validation must continue through later plan
revisions while preserving its exact historical amendment and source pins.


## 18. Plan Revision 14 — Interview relevance maintenance

Kelsey directly authorized execution of INTERVIEW-RELEVANCE-1 on September 10, 2026:
local preparation, this prospective policy/state amendment, implementation, testing,
and fresh-context independent review. The complete fixed scope and acceptance matrix
in `docs/INTERVIEW_RELEVANCE_BUILD_PLAN.md` sections 2–7 are adopted for this one
maintenance release. P9 and Revision 13 remain complete; no program stage is reopened.

Prospectively allow only positive relevance and qualified explanations from individually
reviewed award-specific saved revision225 information. Existing GPA/school decisions
remain unchanged. Relevance is binary, OR across positive choices, never an accumulating
score. Sort mismatch group last, then relevance, recorded fit, existing application
preference, name, stable ID. Explicit user sorts override this order. Keep every existing
question and disposition every choice, all197 source rows and all192 awards. Preserve
all historical data, publications and attestations byte-for-byte. Use a separate versioned
organizer-recorded relevance artifact; no new official matching facts are accepted.

Commit and independently review this policy before product changes. Commit the complete
mapping ledger and expected-example matrix before implementation. All verification and
fresh-context final review gates remain. This policy checkpoint is local preparation,
not final release acceptance. An exact Revision14 local-preparation validator exception
may accept false publication authority only off hosted CI and with its exact blocker;
it never grants publication or exempts any historical validation.

No new questions, exclusion rules, services, dependencies, source research, spreadsheet
access, telemetry, applicant data, provider configuration, monitoring or unrelated
maintenance is authorized. Sensitive skip/nonselection remains unknown; only public
reviewed rules are bundled. Answers and reasons remain volatile; CSV has only public
fields for exactly the visible awards in visible order.

Publication authority was settled on September 10, 2026 by Kelsey's direct “yes” to
this release's exact branch push, PR, Vercel Preview, merge, Production deployment and
verification question; see `docs/evidence/PLAN-REV14.md`. The grant covers the existing
web project, team and canonical hostname recorded in Revision14 state. Refreeze and
independently recheck the authority-bearing candidate before direct-child two-file
attestation. Verify exact Preview before merge and exact Production afterward. The
previous release grant is exhausted and is not relied on. No configuration changes
or additional external effects are included.
Rollback reference is deployed PR42 merge 2f517755118bc72570a2aa8b5109a2660e0d9b12;
any actual rollback additionally requires explicit authority.


## 19. Plan Revision 15 — Scholarship intake evaluation

Kelsey directly invoked SCHOLARSHIP-INTAKE-1 on September10 Denver / September11 UTC,
2026, authorizing local preparation, this prospective canonical plan/state amendment,
read-only evaluation of the named workbook's scholarship fields, bounded official-source
verification, local implementation, testing and independent review. Adopt the complete
fixed scope, evidence/inclusion rules, one-ledger contract, tags/interview recommendations,
backup/recovery requirements and acceptance matrix in
`docs/SCHOLARSHIP_INTAKE_BUILD_PLAN.md` sections1–9 and its invoked kickoff.
P9 and completed Revisions13/14 remain complete; all program stage pointers stay null.
The separate scholarshipIntake state tracks this one local maintenance effort.

Commit and independently review this policy before the full audit or affected
implementation. This checkpoint permits local preparation, not final acceptance or
attestation. The exact PLAN-REV15 local-preparation exception permits false publication
authority only outside hosted CI with the exact release blocker. Every historical
validation and final manifest/review/direct-child attestation gate remains mandatory.
The final local review-complete candidate may await exact authority without a premature
canonical attestation. Local checkpoints may continue until that final freeze.

Inventory all tabs including hidden tabs; access only scholarship-bearing fields of
workbook 1Dp5AMnrfSQ-Xf-r03S75lKsGPJk7o0inOgvC9Q6lOl4. Scraped Data defaults to A:Q;
exclude R:T contact/outreach/applicant-count content. Unrelated/sensitive tabs are
metadata-only exclusions. Capture bounded native cells, formulas and rich links;
verify snapshot stability and account for every relevant row and discovered child.
Review every disposition, duplicate survivor, proposed field/tag and interview gap
independently. Unsupported facts remain explicit and do not block unrelated supported work.
New questions and matching rules are recommendations only; no runtime behavior changes.

The historical exact batch was applied and reconciled under its separate recorded grant;
that batch and quiet window are spent. On September12 Kelsey granted R2 delivery of this
existing REV15 package followed only after verification by REV16. PLAN-REV15.md records
the exact branch/PR/Preview/merge/Production/CI/hosted-verification scope and target.
R2 authorizes no workbook access, new copy/write, research or configuration change.
Any future source mutation requires a new exact grant after a concrete reviewed batch.
Before any original write require a separate private complete native backup of all tabs,
verified access/preservation, demonstrated recovery in an authorized disposable copy,
affected-cell backups, current fingerprints, protection against newer edits and exact
readback. Missing complete backup or recovery proof blocks writes, not read-only work.
Retain backup locations, proof, retention and recovery state durably. Never automatically
restore the whole workbook or overwrite newer edits. The complete section7 applies.

Preserve historical artifacts, P9 zero-spreadsheet runtime, GPA/school filtering,
all-award access, volatile interview privacy and exact visible-result CSV downloads.
No applicant data, legacy workbook access, provider contact, forms, paid access, new
services, full-master freshness review, automation, new catalog publication, configuration
changes or unrelated maintenance. The September12 R2 grant covers only this package
release and its unchanged student runtime, after fresh full-candidate review and valid
direct-child attestation. No acceptance gate is waived. Later catalog/publication work
requires its own selected scope and exact authority. Rollback or external restore is not
authorized; preserve the applied receipt and recovery objects without accessing them.


## 20. Plan Revision 16 — Interview coverage implementation

On September 12, 2026 Kelsey instructed "proceed with execution of plan" after the
independently reviewed scholarship coverage proposal. Adopt the bounded first execution
step in docs/INTERVIEW_COVERAGE_EXECUTION_PLAN.md: two-input core, reachable optional
existing questions, discovery-only financial-need preference, Teaching and the supported
NTHS/FFA choices, using four separately reviewed connections to the existing 192-award
saved revision225 catalog. The original grant covered local implementation, tests and independent review.
R2 now directly authorizes this exact reviewed release and Git/Preview/merge/Production/
CI/hosted effects on the existing web project after verified REV15/REV17 delivery.
Workbook access/copy/write and later phases remain prohibited.

The selected existing-catalog supplement uses pinned saved evidence; it does not require
or claim a fresh Master snapshot. New catalog additions still require fresh allowed source
reconciliation. Preserve all old publications, original intake and historical proposal
artifacts byte-for-byte. Do not promote new interests to typed accepted matching facts.
Unknown and skipped answers remain non-excluding; preserve binary OR relevance, GPA/school
shortlisting, all-award access, volatile-only answers and public-only visible-result CSV.

Commit and independently review the policy and mapping before product edits. Keep every
normal verification and final candidate review gate. An exact Revision16 local-preparation
exception permits false release authority only off hosted CI with its own explicit blocker;
it grants no acceptance or delivery. REV15 and the exact REV17 repair are now attested, delivered and verified in PR44
at main16092cb. Preserve their complete records/evidence/artifacts. REV16 uses that
fresh delivery baseline while original implementation provenance remains40ff61e.
Keep planRevision at least17. Review the union of coverage and repair validator/tests.
REV16 still requires its own fresh full-candidate review and direct-child attestation.
No P9 reopening, workbook access/copy/write, provider action, application interaction,
new services/dependencies/configuration or monitoring is authorized here.
Deployment is authorized only through the exact R2 release grant in PLAN-REV16.md.


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

## Plan Revision 18 — bounded local R3 catalog refresh

Kelsey directly authorized the independently reviewed R3 scope on September 13, 2026
with “yes, authorized.” Adopt sections 3–7 of `docs/R3_CATALOG_SCOPE.md` at SHA256
`2b0b3a58301c8667582ccb1ae06fd1970262a6686dabb51416dbcbb66893b4c2` and its exact
source/read, reconciliation, product, privacy and verification boundaries. This is one
local maintenance phase. P0–P9 and R1/R2 remain complete; canonical stage pointers stay
null. `r3CatalogRefresh` records the current exact grant; historical grants remain exact.

The only newly permitted source is workbook `1Dp5AMnrfSQ-Xf-r03S75lKsGPJk7o0inOgvC9Q6lOl4`,
sheet0 `Master Database`, A1:O417 and the exact metadata/projection in state. No other
tab inventory, linked content or formula dependency may be accessed. Require stable
before/after revision tokens, two equal full bounded cell projections, complete range
accounting and at most three capture attempts. Fresh organizer snapshot currency is not
official scholarship verification. Do not silently expand bounds or import newer unrelated
edits. Preserve all 257 applied-operation outcomes, 192 existing IDs, 38 priority entities,
42 priority references, duplicate survivor links and every held/recovery trigger.

Prospectively allow a separate immutable organizer-recorded catalog/connection bundle.
Preserve all historical publications and existing 192-award GPA/school criteria and 206+4
connections; reuse the same binary OR, explicit-sort and all-award behavior. Only new
awards with individually reviewed explicit GPA and resolved school-type fields may add
organizer shortlist criteria. Missing/ambiguous/sensitive nonselection is non-excluding;
no new officially accepted facts, hard exclusions, scoring or universal sensitive definitions.
Add the seven remaining organization options only with exact included child-award support;
extend supported Teaching/need/topic connections and review NTHS numeric-date provenance.
The original two-input core and optional controls remain. Answers stay volatile, CSV stays
public-only, and runtime retains zero Google/Drive/Sheets capability. Catalog, API, browser,
compatibility data, CSV and health/source identity must reconcile to the selected bundle.

Commit and independently review this dedicated prospective policy before source reads or
product edits. Freeze and independently review source reconciliation, mapping/field rules
and expected examples before product edits. Run the complete contract matrix, new R3
adversarial tests and keyboard/mobile/local-download/privacy regression; preserve all
historical evidence. Full local-candidate fresh review is required before R3 completion.

The exact REV18 local-preparation exception accepts false release authority only off
hosted CI, with the exact R4 blocker and unchanged approved scope/effect pins. It never
waives canonical manifest, review, attestation or historical validation. Before R4 the
three missing REV18 artifacts remain reported failures; other checks must pass and any
additional failure blocks completion. R3 may end as independently reviewed local work
with those exact reserved failures recorded. Do not create premature canonical acceptance
or an undelivered attestation. R4 requires new direct informed release authority, fresh
baseline/target checks, authority-bearing candidate review, valid direct-child attestation,
zero actual canonical diagnostics and exact Preview/Production verification.

No workbook mutation, cloud copy/recovery, research, source expansion, services/dependencies,
configuration, credentials, paid actions, forms, provider contact, monitoring, rollback,
Git publication, hosted verification or R4–R7 execution is authorized by Revision18.

### Revision 18 approved connector metadata supplement

Following disclosure of the observed connector limitation and incidental editor identity
exposure, Kelsey replied “approved, proceed” on September 13, 2026 (America/Denver).
Adopt only `docs/evidence/r3-catalog/CONNECTOR_READ_SUPPLEMENT.md` at SHA256
`378f6992f63acd9b4e5cb33629306d5e840d8a8b46edaa6bc7d819746e9a4e06`.
Its historical proposed status remains unchanged; `connector-authority.json` records
the subsequent grant, and `r3CatalogRefresh.connectorSupplement` pins the exact addition.

This is the sole metadata exception to the original projection: one revision-history
page of at most1000 records per observation, at most4 observations per attempt and3
attempts, and the named sheet0 envelope fields. No pagination or revision contents.
Discard editor attribution and raw spreadsheetUrl before model-facing output or
persistence. Keep only permitted minimal revision evidence. A currentRevisionId and
matching revision record must agree with independently read file modifiedTime; missing,
ambiguous or cap-reaching results block. Trashed status stays unknown unless observed.

The workbook, sheet0, A1:O417, CellData projection, stable before/after token and two
equal complete captures remain exact. All other grants, product/mapping gates and
reserved effects stay unchanged. Freeze and independently review this prospective
supplemental policy before new source calls; preserve original policy and proposal
reviews against their own candidates. Supplemental policy PASS is not a source-capture,
mapping, completed R3 or R4 acceptance claim.

### Revision 18 approved independent freshness comparisons

On September14,2026 (America/Denver), Kelsey replied “approved. proceed” to the exact
independently reviewed `FRESHNESS_CORRECTION_PROPOSAL.md` at SHA256
`a9244dc56e80bcb6e8d49212162677b820f79421fb7c2caa0fd5297090e1c3c0` in
`docs/evidence/r3-catalog/`. The grant is recorded in `freshness-authority.json`
and BUILD_STATE.r3CatalogRefresh.freshnessCorrection.

This prospectively replaces ONLY the preceding supplemental cross-resource timestamp
equality rule. Each observation still requires exact file identity, valid file time,
a safe connector-reported currentRevisionId with exactly one matching valid-timestamp
record, compatible MIME type and no unexpected metadata or cap-reaching revision page.
The file timestamp and revision timestamp may differ. Across four observations surrounding
two complete captures, require each timestamp and the reported token to stay exactly
unchanged separately, and both complete bounded native cell digests to match. Preserve
observation/capture order and all identity/header/grid/projection/privacy gates.
There is no tolerance or rounding exception. Attempt1 remains consumed; only attempts2
and3 remain. No extra access or later effects are authorized.

These are bounded consistency observations. They do not prove the connector reports the
actual server head, an atomic snapshot, complete history, or current official award facts.
Never equate a reported revision ID with the unavailable Drive file version. Preserve the
original proposal, authority, sanitizer evidence and independent review candidate bindings.
Commit and independently review this dedicated prospective policy correction before more
source calls. Source reconciliation/mapping review and final R3 review remain mandatory;
R4 acceptance and all release effects remain separately gated.

### Revision 18 separately approved R4 release

On September14,2026, Kelsey approved GitHub publication, automatic Vercel Preview,
merge, Production and verification of the reviewed R3 catalog. The direct receipt is
`docs/evidence/r4-catalog/authority.json`, incorporated in `PLAN-REV18.md` and REV18
deliveryAuthorization. This later grant supersedes only the previous no-R4 boundary.
Original R3 grant objects and historical reviews remain unchanged; r4CatalogRelease
governs the release. P0–P9 and R1/R2 stay complete, with stage pointers null.

Preserve every tracked runtime, fixture, dependency, test and deployment-control byte
from R3 review checkpoint ec0907eeab92647ee394bd9b9a7614ecb6ab92cc. R4 adds its authority
and release evidence/routing only. Publish to whitefishscholarship/program_code through
codex/r4-catalog-release. Target is web/prj_LbefE2deji6nPND6iBiuofe7IABv, team
team_6CAjRq58n0WvAH49otKSQbA7, canonical web-two-gules-45.vercel.app.

Freeze the complete baseline-to-candidate set and obtain fresh-context read-only
independent acceptance review. Add exactly canonical REV18 manifest and review in the
direct-child attestation, which must remain branch tip until merged. Require zero
actual local and hosted-mode plan diagnostics before publication. Verify exact Preview
and CI before ancestry-preserving merge; verify exact Production afterward. Passing
deployment is not health proof: bind deployed commit, selected catalog hashes/counts,
compatibility/API/browser/public CSV behavior and zero source capability. Unavailable
hosted request/download evidence remains unknown; distinguish local proof explicitly.

No workbook/source access or write, research, configuration/credential change, rollback,
monitoring, paid action, provider/applicant interaction or R5–R7 execution. Existing
criteria/definition/research/recovery/hold routes retain their recorded owners/triggers.


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


## Plan Revision 20 — four-screen interview journey

Kelsey directly authorized the complete UX plan and local execution on September 16,
2026, explicitly prioritizing it before the season timer and requiring a direct timer
handoff. Adopt docs/INTERVIEW_UX_BUILD_PLAN.md for this one maintenance release.
The new route is original screens 1,4,2,3 with a visible four-step progression, primary
Continue on the first three screens and results on the fourth. Preserve substantive
questions and optional answers; only existing GPA/school basics require input. Back/edit retain
current-visit state and final submission recomputes from revised answers. No persistent
answer storage, matching/schema/catalog changes or new question is authorized.

This prospectively supersedes only Revision16's early-results and optional-section
navigation behavior; preserve its historical record and all other invariants. Completed
stages and stage pointers remain unchanged; interviewUx tracks local preparation.
Commit and independently review this prospective plan/policy before product edits.
Local implementation and review follow under the direct user grant; canonical
acceptance, final attestation and delivery remain gated. Keep the validator unchanged
and report outstanding Revision20 delivery-authority/manifest/review/attestation failures
until settled. No diagnostic suppression or acceptance waiver is authorized. Freeze
and review the full final candidate; all normal canonical attestation gates still apply.

The September16 direct user cleanup refines this same undelivered UX1 release.
After independent prospective review, remove visible prefer-not/sensitive-skip controls
and extra explanatory notices, retaining clearable optional answers and underlying
privacy behavior. Runtime scope is InterviewWizard.tsx plus copy-only edits in
ScholarshipBrowser.tsx and app/page.tsx, as specified in UX plan section4a. Preserve
all original UX1 reviews/evidence; use ux1-cleanup for new reviews/evidence. No existing
review is rebound. Update only the two obsolete presentation assertions identified
in UX plan section4; no matcher/privacy regression is weakened. Scope changes require prior review.
The further direct category-visibility refinement in UX plan section4b opens all six
criterion groups by default through the shared renderer. Preserve existing questions/
handlers and prior evidence; review its policy before the edit and its final candidate
after validation. No release authority or other scope is added.
No source/workbook access or changes, credentials/configuration, dependencies, provider
contact, monitoring, email sending, paid action, rollback or remote release is granted.
Prepare the local result before requesting any missing informed Git/Preview/Production
effects. At verified UX delivery, Codex must execute the direct timer handoff in section7
of the UX plan, retaining the saved timer checkpoint and incorporating delivered UX
into any subsequent timer implementation/release baseline.

### September16 UX1 live delivery grant

Kelsey's direct instruction to push the reviewed updates live now supplies the
missing release effects. docs/evidence/ux1-release/authority.md and PLAN-REV20 state
bind the exact existing repository, branch, Vercel project/team and hostname. This
supersedes only the earlier no-publication status for UX1; no other authority changes.
Freeze/review the complete candidate, preserve all earlier artifacts, add exactly the
canonical manifest/review in a direct-child attestation, and require actual local and
hosted-mode validation to pass. Keep attestation at tip until exact Preview/CI and
ancestry-preserving merge, then verify exact Production/application behavior.
No runtime additions or validation exceptions are needed. Preserve section7's direct
timer handoff and execute it after verified delivery, within the timer's existing gates.
