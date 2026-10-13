# Student scholarship data and maintenance plan

Version: 1. Proposed October 13, 2026, America/Denver.
Status: local planning proposal; implementation unstarted. Validation and independent review are recorded in docs/evidence/student-data-plan/.
Owner: Codex maintains the plan and implements selected work; Kelsey selects scope and external effects.
Repository: whitefishscholarship/program_code.

## 1. Objective and scope

Make the background Google workbook a reliable authoring and maintenance source for
the existing student app. Students use only the app and its output. Provide concise
filters, understandable fit explanations, useful application priority, and a durable
queue that detects new cycles and material scholarship changes throughout the year.

This request authorizes this local plan, necessary documentation, validation and
independent plan review. It does not execute the proposed stages, access or change
scholarship sources/workbooks, publish code, deploy, schedule checks or send alerts.
The earlier final-three cleanup authority is completed and must not be replayed.

AGENTS.md, SCHOLARSHIP_SYSTEM_BUILD_PLAN.md and BUILD_STATE.json remain controlling.
SD1–SD6 below are proposed delivery slices, not accepted canonical stages or new
authority. Stage pointers currently are null. Before implementation, the selected
slice must be reconciled with those documents through the existing prospective
selection/amendment process where required. Do not create another governance system,
weaken historical gates, or reactivate P0–P9 because their subjects sound similar.

No faculty interface, new student account system, applicant-data collection, generic
rules engine, database service, new scheduler/provider, broad award discovery or
rewriting of historical evidence is in this proposal. Preserve the four-screen
interview, expanded categories, optional answers, Back/Edit, required GPA/school inputs,
removed volunteer-hours question, volatile answers and public-only CSV unless Kelsey
specifically selects a later change. No private-form submissions or provider contact.

## 2. Grounded baseline and recovery inputs

- Authenticated GitHub main verified October 13: `1c8e33f23beb55c2ed2ebe78fe4e256722af8392`.
  Existing local origin/main equals this commit; HTTPS fetch was rewritten to a failing
  transport, but the owner-account API proved the exact SHA and its local tree exists.
  No account switch or credential/configuration change was made.
- Deployed health identifies this same commit. The app publishes a bundled, reviewed
  catalog, not live Google reads. R3 provenance: September 14/revision229; 411 award
  records, all availability unknown at this planning observation. These are publication
  facts, not assertions that all awards are closed or that current criteria are unknown.
- Existing app code: `web/src/lib/{studentCatalog,r3Catalog,spreadsheetShortlist,
  interviewRelevance,monitoring}.ts`, `web/src/components/{InterviewWizard,
  ScholarshipBrowser}.tsx`, `web/src/lib/export.ts`. Reuse schemas, stable public IDs,
  publication validation, relationship model and monitoring tests where suitable.
- Research workbook: `1ifwt24eEI2ITG7ME58bH190kUX4NtizMDBM0pGN2BY0`,
  `School Resource - Cleaned Up`, sheet405588227. Saved final-three packet:
  `/Users/kelseystuart/.codex/visualizations/2026/10/13/01a13336-2097-7d61-a2e0-7b185f96b89c/whitefish-410-412/`.
  `BATCH-REPORT.md`, `final-verified.json`, `verification.json`, identity manifest,
  earlier-disposition reconciliation, original-order boundary and source index are
  entry evidence. Its October12 final reports 411 reviewed dispositions, including
  uncertainty/skips; this is not 411 verified current/open awards. Preserve originals
  through 412; later historical names are blank. Do not substitute adjacent live rows.
- App411 records and research411 dispositions are different denominators. Reconcile
  award/sponsor/source identity, not counts, names alone or physical row numbers.
  Current source/Master roles and actual embedded links must be refreshed only within
  an expressly selected read scope. Organizer Master and legacy school list retain
  their separate IDs/roles; neither is an automatically authorized write destination.
- Research source protections: preserve A,D,E,F,G,H,N, prior P notes, Pell original 364/
  live 18 yellow formatting and note, hidden P (589 px) and source structure. A background
  workbook redesign is a separate migration, never permission to undo those controls.
- Existing seasonal plan at retained branch `codex/scholarship-season-monitor-plan`,
  checkpoint `009fa57e7def04ce2a9b49051f395c32b1393c14`, is a dependency, not completed
  activation. Read its `docs/SCHOLARSHIP_SEASON_MONITOR_PLAN.md` and M1 evidence on
  that exact tree. Saved 437-record inventory includes 411 awards  + 26 leads; leads are
  not new app awards. Preserve its review and pinned inputs. The known allowance,
  email-service and deployment-suppression setup issues must be freshly checked.
  The previously selected recipient remains selected; do not ask again or send mail
  as part of planning. Older grants do not broaden this selected project's effects.

The local planning branch is the durable Git checkpoint. If its temporary checkout
is missing, locate that branch in the primary repository and create a fresh checkout
without moving or editing the historical primary branch. The checkout path is a
convenience, not the sole copy of this plan.

If any saved packet/worktree is unavailable, recover exact retained Git/artifact
history read-only, verify its identity/hash, and record the gap. Do not reconstruct
facts from memory, erase newer state or rebind an old review to a new candidate.

## 3. Minimal architecture and ownership

Background workbook -> bounded capture -> validate/map -> reviewable public catalog
candidate -> existing app API -> interview/results/CSV. Keep Google credentials and
maintainer notes out of the deployed student runtime. A Sheet edit does not imply an
app release. Prefer this existing publication boundary over live production Sheets
reads; changing it is a separate architecture decision, not required here.

Start with five logical tables. Combine physical tabs only if IDs, history and
relationships remain lossless. Do not duplicate the same authoritative field.

| Table | Minimum information |
| --- | --- |
| Awards | Stable award ID, existing app ID/alias mapping, sponsor, name, application-group reference and descriptive focus |
| Cycles | Stable cycle ID/award ID, application cycle and academic year separately, status, opening/deadline/timezone/precision, current eligibility/selection rules, amount and renewal terms |
| Sources | Source ID, exact URL/document/version, role (information/application/hub), architecture, access result and linked award IDs |
| Evidence | Evidence ID, award/cycle/field, supported value, fact state, source ID, exact excerpt/page/section, observation/verification timestamp; artifacts referenced rather than pasted repeatedly |
| Reviews | Award/source IDs, due date/reason/state, last attempt/success/fact verification, expected opening and its basis, failure/manual outcome, changed fields and next action |

Reuse the existing application-group model. Add a small Application Groups table
only if shared route/supplement facts otherwise repeat; one group retains each child
award. Shared URLs alone do not prove shared applications. Use validated lists or
relation records for multiple values, never arbitrary punctuation/text guessing.

The Reviews table is the proposed authoritative award-review queue visible to a GPT.
The monitor may retain source fingerprints, cursors, receipt history and notification
delivery state; those are operational state, not a second independently maintained
award decision queue. SD1 must explicitly reconcile this proposed queue ownership
with the older state-branch design before selecting it. SD5 must not silently enable
the old runner or add competing schedules/queues. A generated review report is a view.

Fit, personalized priority and student answers belong in the app, never static
scholarship facts in the shared workbook. Expected openings inferred from history
are review-scheduling hints only; student-facing dates require applicable-cycle evidence.

## 4. Vocabulary and factual rules

Keep machine values stable and separate from concise display labels. Reuse existing
app codes where their meaning fits. Every material field has a supported value and
fact state: verified / unstated / unverified / conflict / inaccessible. Empty values
must not acquire unrestricted eligibility. Rules may be alternatives (OR) or joint
requirements (AND); a list of tags must not silently invent either relationship.

| Field | Proposed concise labels and rule |
| --- | --- |
| Availability | Open / Upcoming / Closed / Unavailable / Unverified; cycle-specific |
| Need required | Required / Not required / Unstated / Unverified; explicit eligibility evidence |
| Need in selection | Considered / Prioritized / Not considered / Unstated / Unverified |
| School type | 2-year college / 4-year college / Trade school / Other; multiple permitted types plus fact state |
| Study path | Certificate / Associate / Bachelor's / Graduate / Apprenticeship; multiple supported paths |
| Applicant stage | HS senior / HS graduate / College student / Graduate student / Adult learner; GED and gap-year acceptance recorded separately |
| Renewal | Renewable / Nonrenewable / Unstated / Unverified; terms and renewal GPA separately |
| Reapplication | Allowed / Not allowed / Unstated / Unverified; never imply renewal |
| Application | Reuse existing direct/shared/matching/selectable/automatic/offline/unknown modes; concise UI labels |
| Nomination | Required / Not required / Unstated / Unverified; supplements and references separately |
| Materials | Essay / Reference / Transcript / Video / Portfolio / Interview / Other; quantities and limits retained |
| Focus | Agriculture / Arts / Business / Education / Health / Public service / STEM / Trades / Transportation / Other; descriptive, not automatically a mandatory major |

Unstated means relevant source inspected but silent. Unverified means unresolved.
Not required/no restriction/Any field need explicit support; do not infer from silence.
Not-primary need wording does not mean excluded. FAFSA/income questions and merit
wording do not alone establish need required/considered/excluded. A request to see
need-considering awards does not prove a student meets an eligibility need threshold.

Store numbers/dates as typed values: initial GPA, scale and renewal GPA; amount range,
currency, annual/total basis and contingent renewal; full opening/deadline when
published + timezone + precision. Retain yearless/rolling/month-only limitations;
never extrapolate a future cycle. Separate residence, school/community affiliation
and destination-institution restrictions; sponsor location is not a residence rule.
Country/state/county/institution names use normalized lookups with original evidence.

Research priority: current applicable award-specific application/instructions, current
official named page, relevant school-hosted document, reference lists, older official
material, then reputable secondary leads. Resolve contradictions by scope/version,
not automatically by website modified date. Inspect actual hyperlinks/formulas/runs,
all relevant PDF pages and scans; document extraction failure is not source absence.
Log private access limits without accounts, answers, submissions or outreach.

## 5. Accuracy and efficiency

First reconcile every identity and material field against saved reviewed evidence.
For each award, also record whether existing interview questions cover the supported
criteria; flag a gap only when it affects a useful student decision.
Do not research all 411 again just because the schema changed. Reuse source captures
only where award/cycle/field identity and freshness support the claim. Refresh expired,
ambiguous, conflicting, incomplete, inaccessible or newly needed evidence. Older
criteria never become verified future-cycle criteria automatically.

Use one compact reconciliation ledger during SD2 with identity/IDs, field mapping,
source/evidence links, disposition and next action. Every input finishes as mapped,
held, reference/resource, duplicate candidate or unsupported-with-reason. Unknown
is a legitimate outcome; no silent exclusion, invented sponsor or substitute award.
Maintain denominators separately for awards, cycles, sources, leads and applications.
Fetch/cache a shared source once within its useful freshness window, then assess
named children individually. No pagination/child/result cap silently truncates work.

Choose an initial batch of 3 complex identities or 6 straightforward ones; decrease
when portals/scans/conflicts require it. Freeze ordered IDs and relevant baseline;
complete one identity's research/proposal/readback before moving to another when
live writes are expressly selected. Before each live edit recheck identity/version;
after it immediately reread. Check all affected and protected state at batch close.
During dry-run stages record proposed edits only. Stop for identity/concurrency or
preservation failure; keep factual uncertainty visible and continue unaffected work.

## 6. Staged delivery

Only one selected SD slice per session; large slices use bounded checkpoints rather
than fabricated completion. Dates/session counts are estimates, not deadlines.
All stages below are unstarted; their prompts do not independently grant authority.

| Slice | Deliverable and exit check | Suggested model / effort |
| --- | --- | --- |
| SD1 — Contract and representative pilot | Final vocabulary, ID/field mapping, review-queue ownership, app/schema gaps; 8–12 varied saved identities fit a local dry-run representation with explicit unknowns; no live writes | GPT-6.1 Sol High; Astra High/Xhigh for disputed semantics |
| SD2 — Complete source reconciliation | All research/app identities and relevant sources accounted; material facts evidenced or held; complete source/document captures where needed; bounded batches resumable by ID | Sol High; Astra High for ambiguous sponsor/cycle or scanned tables |
| SD3 — Background workbook and publication adapter | Validated local workbook/capture/export; exact schema/relationships and public allowlist; separately authorized copy migration/readback proves preservation and recoverability | Sol High; independent review of migration/dataflow |
| SD4 — Student fit, sorting and output | Local updated catalog plus compact comparison, reliable filters, priority/deadline/value sorts, concise reasons/materials/next action; existing journey and export privacy preserved; representative browser tasks pass | Sol High; Astra High for matching/priority review |
| SD5 — Due reviews and seasonal checks | Reuse existing monitor; deterministic due queue, bounded source checks, candidate-change evidence, failure/manual/catch-up handling; local tests and separately authorized public pilot | Sol High; Astra High for source-state/queue consistency |
| SD6 — Reviewed release and operating proof | Separately authorized workbook/app/monitor effects, exact published version and sample records, successful scheduled pilot/catch-up, useful changed-only alerts, recovery runbook | Sol High; fresh Astra High review for release/data integrity |

SD1 decisions: approve exact field definitions; reconcile existing IDs; choose the
background workbook destination at migration time; select Reviews queue ownership;
decide how any existing recorded narrowing rules become current accepted facts.
Use cases: financial need required vs considered; renewal vs reapplication; GPA
initial vs renewal; OR affiliation eligibility; named institution; shared application;
yearless deadline; scanned PDF; closed 2026/upcoming 2027; portal/login uncertainty.
Reuse prior student-view prototype ideas where helpful without exposing the Sheet.

SD2 done means every material fact has an explicit outcome, not every field populated
and not every award eligible/open. Prioritize errors that affect eligibility, due
dates and actual application route before descriptive polish. Preserve every existing
hold and unselected lead; no duplicate merging or broad additions without selected scope.

SD3 first builds locally using saved evidence. Before valuable-source migration:
select exact destination and allowed operations; obtain a dated private native-format
full backup; verify material content/formulas/links/validations/structure; demonstrate
recovery only in an expressly authorized disposable copy. A CSV or copy-success reply
is insufficient. Keep originals unchanged by default. Do not put backup/applicant
data or credentials in Git. Reconcile actual live scope before any read/write and
retain full preservation/readback limits. No background migration grant exists now.

SD4 checkpoints: (a) adapter/public schema/current data and accepted-vs-recorded
rule boundaries; (b) unknown-aware filters and compact results/materials/export;
(c) deterministic priority and task explanations. Preserve manual-sort precedence.
Known supported current mismatches remain explainable and accessible; missing/optional
answers never become a negative fact. An interest/affiliation connection is not a
qualification guarantee. Current verified facts may narrow only through the existing
accepted-fact publication rules; do not quietly replace recorded rules or certify
all eligibility from GPA/school overlap. Add supported mappings to existing questions
before adding new questions. Optional refinements remain optional and clearable.

Priority proposal: Apply now = supported fit, evidenced current open route and no
unresolved critical prerequisite; Prepare next = announced future cycle with useful
preparation; Check first = potentially relevant but material unresolved requirement/
route/availability, including conflicting source evidence; Later = evidenced closed/
unavailable or a supported student mismatch, retained for inspection. Within bands sort by verified deadline, then supported personal
connection; alphabetical/stable ID is the deterministic tie break. Value and effort
are explicit alternative sorts, not invented win odds/qualification percentages.
Annual and conditional totals must not be compared as guaranteed equal value.
Materials can justify a workload description; time estimates must be labeled estimates.
Unknown school/program types stay visible as Needs checking when filtering.

SD5 due policy: 14 elapsed days after successful checks for every in-scope non-open
record, including Closed, Unverified, Upcoming beyond 30 days and Unavailable;
7 days when announced/estimated opening is within 30 days or an open cycle is being
followed; check near an explicit deadline. An explicit exclusion from monitoring
retains its reason and supporting evidence; no status alone silently removes work. Expected dates are hints, never reopened
facts. Failed attempts do not advance last_verified or reset overdue work as success.
Retry once on the next due run, then persist blocked/manual state and 14-day review
visibility; no daily infinite login retries. Shared-source checks fan out only to
explicitly supported children. Schedule health includes last completion, overdue IDs
and catch-up; no exact-time or independent-outage guarantee. Reopening triggers a
complete material-fact/cycle/application review. Changed-page/Apply-button signals
alone cannot establish an open award. Material changes generate reviewed proposals;
monitor observations never automatically rewrite approved scholarship facts.

SD6 may release a completed app package before monitor activation if separately
selected; the other effect stays held. Prove the exact reviewed version at Production,
API/public CSV order/counts and representative awards, privacy/capability boundaries,
then real monitoring persistence, missed-run catch-up and deduplicated alert receipt.
Reuse existing alert recipient/service only after capability/allowance verification.
No new provider, paid upgrade, credential change or deployment-suppression change
without selected informed authority. Recovery restores reviewed code/data versions
without discarding newer evidence or silently replaying live writes.

## 7. Checks and lean review

Reuse repository checks; add focused tests for new behavior rather than parallel
validation frameworks. From web: `npm run plan:check`, `npm run typecheck`, `npm test`,
`npm run build`; root: `git diff --check`. Record exact command/result/time and failures
in one stage evidence record. Run required checks after final relevant changes;
repeat only if changed bytes/failures/unresolved risks justify it. Environment failures
are not permission to claim a pass or waive the existing gates.

Data checks: allowed vocabulary/types; no missing/duplicate IDs or orphan evidence;
cycle and rule scope; exact migrated fields; all input dispositions and protected
state; no raw maintainer notes or student data in public exports. Source availability
and scholarship truth are distinct from software tests.

Student scenarios: trades, 2.8 GPA; undecided paths; need discovery without need proof;
WTS STEM with unresolved chapter; GPA renewal-only; upcoming vs closed cycle; one
application/multiple awards; unknown school type; optional answers blank; edit/reset.
Include phone, 360 px and a small Chromebook viewport plus keyboard/CSV tasks. These
are fictional tests, not stored real applicant responses or a claim of user research.

One fresh-context reviewer reviews each material selected delivery candidate under
AGENTS.md, prioritizing identity/data loss, unsupported exclusions and misleading
availability. The implementer remediates; reviewer rechecks changed candidate. Use
the existing acceptance/attestation machinery when a canonical stage is selected,
never extra bespoke manifests for every source/batch. A docs-only proposal review
is not canonical implementation acceptance. Keep historical artifacts byte-identical.

## 8. Models and context management

Recommendations are task-budget choices, not guarantees of factual accuracy.
Default GPT-6.1 Sol High for evidence interpretation and implementation. Medium is
appropriate for mechanical documentation or already specified mappings; avoid low
effort for scholarship semantics. Use GPT-6 Astra High/Xhigh for conflicting sponsor/
cycle evidence, difficult scans and independent final data/priority review. Do not
use Max/Ultra for every record; escalate only when a concrete ambiguity warrants it.
Check the available model menu when starting a session; record the actual model/effort.

Official model pages checked October 13 list 1,050,000-token API context for both Sol
and Astra. This does not establish this desktop chat's usable capacity or mean a
larger input is more accurate. Higher effort is reasoning budget, not a larger
context window. Use the session's displayed capacity where available; no unsupported
percentage/token guarantee. Sources:
[Sol](https://developers.openai.com/api/docs/models/gpt-6.1-sol),
[Astra](https://developers.openai.com/api/docs/models/gpt-6-astra),
[Codex commands](https://learn.chatgpt.com/docs/developer-commands).

Read progressive context: controlling docs + current checkpoint + selected slice +
only necessary ledger rows/source pages/code. Do not load all historical transcripts
or full native JSON into the reasoning context. Preserve raw artifacts outside chat,
use bounded projections with completeness counts, and reopen original evidence for
the fact under decision. Keep the initial resume packet around 1,500 words and leave
room for source work/checks; checkpoint before capacity pressure or a natural batch
boundary. A suggested session is one slice checkpoint or 3–6 source identities,
never a demand to finish an entire portal within one context window.

## 9. Progress and session handoff

This section is the sole project progress pointer; CURRENT_HANDOFF links here.
Future data ledger and recurring Reviews table have their distinct factual jobs,
not duplicate project progress trackers. Update this small block at every checkpoint:

- Current slice: none; planning only. Next proposed slice: SD1.
- Branch/worktree: `codex/plan-student-data-maintenance`,
  `/private/tmp/program_code-student-data-maintenance-plan`.
- Baseline: `1c8e33f23beb55c2ed2ebe78fe4e256722af8392`.
- Last completed: local design proposal; final validation/review is recorded in
  `docs/evidence/student-data-plan/` once finished.
- Next exact action: select SD1 local contract/pilot and reconcile canonical authority;
  read saved baseline records, then freeze definitions and a representative dry-run.
- SD1/SD2/SD3/SD4/SD5/SD6: all unstarted. No live migration/publication/activation.
- Outstanding: workbook destination; ID/cycle collisions; new field evidence gaps;
  Reviews queue adoption vs older monitor state; accepted-fact publication selection;
  monitor setup/allowances; later exact release authority. Resolve in the relevant
  slice, not by adding unrequested platforms.

At close record commit/evidence paths; completed IDs or code checkpoint; exact next
ID/task; unresolved blockers and owner/trigger; commands/results; actual model/effort;
effects performed/not performed. Keep raw source details in evidence, not chat prose.
Use PASS/BLOCKED/FAIL for the selected task with limits; never equate a local proposal
pass, a source response, a whole-queue count or a green test with overall completion.

## 10. Copy-ready fresh-session prompts

Common preamble for every prompt: Read AGENTS.md; canonical build plan; BUILD_STATE;
CURRENT_HANDOFF; latest relevant accepted evidence; then this plan sections 1–2, the
progress block and the selected slice. Verify fresh Git/authority, input IDs/hashes
and current checkpoint. Preserve earlier work. Execute only the first unfinished
authorized checkpoint of that slice; otherwise complete local review/preparation
and report the exact missing authority. Do not infer authority from a kickoff file.
Use the model/effort suggested in section 8. Keep one checkpoint and one next action.

### SD1 — local contract and pilot

```text
Use the common preamble in docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md.
Prepare SD1 only: finalize controlled vocabulary, fact states, IDs/cycle mapping,
review-queue ownership and app-publication fields. Use the saved cleanup/catalog
evidence, preserving unknowns, to test 8–12 representative identities locally.
Do not access/write live Sheets, research new sources, change product code or
activate monitoring from this prompt. Resolve only decisions needed for SD1,
record exact unresolved fields and the first SD2 batch, obtain the required fresh
read-only review and stop. Proposed SD1 execution requires selected authority.
```

### SD2 — one source reconciliation batch

```text
Use the common preamble. Resume SD2's existing ledger at the exact next IDs in
section 9. Process only the frozen ordered batch (initially 3 complex or 6 simple).
Reuse current applicable saved evidence; refresh only the scoped missing/stale/
conflicting official sources when source reads are authorized. Inspect actual
links and complete relevant documents, including scans; record every field's
supported value or explicit uncertainty. Propose edits only; no live writes or
catalog release. Reconcile batch/whole-ledger denominators and checkpoint the
exact next IDs. Stop before SD3. Source/review scope must be selected explicitly.
```

### SD3 — background migration and adapter

```text
Use the common preamble. Resume SD3's first unfinished checkpoint. First build
and validate the local background workbook and bounded publication adapter from
SD2-reviewed evidence. Preserve IDs, cycles, application groups and unknowns.
Only migrate an explicitly selected live destination after verified full native
backup and authorized disposable recovery proof, immediate per-identity readback
and full preservation checks. If migration authority is missing, finish the
reviewable dry-run and hold that effect. No app deployment or monitor activation.
Record exact data/schema versions and rollback inputs; stop before SD4.
```

### SD4 — one student-app checkpoint

```text
Use the common preamble. Implement only SD4's selected checkpoint (a, b or c) from
reviewed SD3 data. Preserve the existing four-step interview, optional answers,
all-award access, volatile privacy and public-only CSV. Make unknown-aware filters,
fit explanations and sorting deterministic; need interest is not need eligibility.
Use the fictional scenario/browser/CSV matrix. Run required checks and fresh
candidate review; hold push/Preview/merge/Production unless exact effects are
already authorized. Record the next checkpoint; do not begin SD5.
```

### SD5 — due-review/monitor checkpoint

```text
Use the common preamble. Resume the adopted SD5/older M1–M4 checkpoint and original
provenance; preserve existing setup/review/recipient decisions. Reconcile inventory
by stable IDs against the reviewed background data, never treat leads as new awards.
Reuse monitoring functions; implement the chosen single queue authority and bounded
due policy with evidence/failure/catch-up tests. No source pilot, state publication,
Sheet writes, configuration changes, schedule or notification activation without
the separately selected effect. Finish local preparation where possible and record
the exact blocked effect/next action; do not enable the old runner directly.
```

### SD6 — selected release or activation

```text
Use the common preamble. Deliver only the named reviewed package/effect authorized
for SD6. Verify fresh main, candidate/data digests and all existing acceptance gates.
For app release prove exact Preview/CI/Production/catalog/CSV behavior. For monitor
activation separately prove state persistence, scheduled execution/catch-up, source
limits and useful deduplicated alert receipt. Missing authority for one effect does
not authorize a substitute or disable completed work. Preserve histories and queues;
close with operating/recovery instructions and exact remaining due work.
```

Planning-session resume pointer:

```text
Open /private/tmp/program_code-student-data-maintenance-plan on
codex/plan-student-data-maintenance. Read the controlling repository files,
docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md and docs/evidence/student-data-plan/.
The plan is a local docs-only proposal; all six SD slices remain unstarted.
Select only SD1 contract/pilot before implementation, respecting canonical state
and exact effect authority. Preserve completed cleanup and existing timer records.
No Sheet edit, source research, app release or monitoring activation is authorized
merely by the saved plan. Verify the current checkpoint before continuing.
```
