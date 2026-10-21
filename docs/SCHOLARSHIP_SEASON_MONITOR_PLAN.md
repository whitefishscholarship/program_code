# Approved M1 setup execution — Revision23

Direct authority: docs/evidence/m1-approved-setup/authority.json. Exact approved proposal is preserved byte-for-byte below and under docs/evidence/season-monitor-m1-change-proposal/. Its old false selections are historical; current authority selects A/B/C without rewriting the original receipt. Current execution evidence is docs/evidence/m1-approved-setup/. One M1 setup/configuration release only; no M2, source checks, sends, state-ref creation, activation or SD3.

---

# Current M1 setup change proposal — October21,2026

This remains the sole seasonal tracker. Latest proposal: `docs/evidence/season-monitor-m1-change-proposal/REVIEW.md` and `contract.json`. Preparation only: no sender configuration, key creation, secret storage, environment change, deployment configuration application, remote Git action, email or activation is authorized by this document. User requested exact changes for review while M2/source/send/activation remain off.

Prior setup receipt `9b2ba0fad42e7127d0a57f9ff823152314abcdd7` preserves all437 routes,12pilot pins, existing Waypoint domain/key/allowance evidence and original independent reviews. Its paths below resolve against that immutable tree. Current proposal adds no source permission or fact acceptance. Only the M1 status row and this prefix change the prior tracker.

Proposed From: `Whitefish Scholarships <scholarships@mail.waypointfranchise.com>`. To: `kelsey@waypointfranchise.com`. New dedicated Resend key `whitefish-season-alerts`, sending-access only, restricted to verified `mail.waypointfranchise.com`. Store only as environment secret `SCHOLARSHIP_MONITOR_RESEND_API_KEY` in new GitHub environment `scholarship-season-monitor`; branch rule `main` only, no tags, required reviewer `whitefishscholarship` while main protection/unattended release policy is unresolved. Existing full-access key and Vercel/admin credentials remain unchanged. No workflow consumes it in M1.

Inactive draft `proposed/web-vercel.json` would become `web/vercel.json` only after separate exact configuration/release authority. It disables automatic Git deployment for exactly `codex/scholarship-monitor-state`, leaves default behavior of other branches unchanged, and requires reviewed main to contain it before first state-ref creation. A true matching rule defeats suppression; alternate config/project roots must be rechecked. No state branch or suppression probe is created now. Actual provider proof remains M4.

M1 specification readiness is distinct from provisioning, release, or operational proof. Local review can assess this contract; Kelsey can select its exact future effects afterward. No approval here means M2, source reads, sending, activation, unapproved publication or SD3. Original holds/privacy/custody gates remain.

---

# Current M1 public-repository setup continuation — October21,2026

This is the sole current seasonal-monitor tracker, restored from exact retained checkpoint `009fa57e7def04ce2a9b49051f395c32b1393c14` with the M1 row updated below. Original frozen plan/reviews remain immutable at their Git identities; relative historical evidence references below resolve in that retained tree. Current evidence: `docs/evidence/season-monitor-m1-public-resend/`. Prior partial refresh receipt `a2757ac19dc263cf0a7698cf46150aaeeb909ded` is preserved, not rebound or appended to.

Direct current user scope: update M1 for public repository and verify existing Resend setup read-only; Waypoint setup explicitly permitted. Alerts remain selected only for Kelsey at kelsey@waypointfranchise.com, meaningful opening/date/rule findings or actionable failures; unchanged checks quiet. No M2, source checks, email sends, activation, external configuration/security changes or credential extraction/reuse.

GitHub metadata freshly confirms repository1177349487 (`whitefishscholarship/program_code`) is public. Standard GitHub-hosted runner minutes are free for public repositories; private-repository included-minute/account-usage evidence is no longer needed for the proposed standard Linux runner. Historical1000-minute ceiling remains a proposed resource bound, not a bill or free-tier entitlement. No larger runner or paid capacity selected. Actual sweep timing remains M3/M4. Artifact/cache/custom-image storage are separate cost considerations; no unbounded storage or paid overage is authorized.

Public-repository60-day inactivity disabling now applies. The earlier private-repository exception in saved setup.json is historical. Future operator instructions must check Actions last-run/overdue state and workflow disabled status, and describe authorized re-enable/manual recovery. No keepalive commits, independent watchdog or new schedule is selected here. Durable state writes may be repository activity, but this session does not assume they guarantee scheduler availability.

Existing Resend code/key metadata does not identify its owning account or prove sender validity, allowance, delivery, or permission to wire credentials into Actions. An authorized Waypoint account can be assessed as the proposed service without asserting it owns the current Vercel key. No key value will be decrypted, read or copied. Service verification and later credential wiring/inbox proof are distinct. Suppression and all prior source/privacy/custody/hold gates remain intact.397source holds/272quarantines/0cleared, permanent original sourceFAIL,0accepted facts/mappings, noSD3.

Read-only Resend result: team `waypointfranchise`, verified `mail.waypointfranchise.com`, existing `Whitefish` key (Full access/All domains/0 uses). Free transactional plan3000/month and100/day; displayed usage34/month and2/day, pay-as-you-go off. No key value read or credential validity/app-key match asserted. Proposed future From: `Whitefish Scholarships <scholarships@mail.waypointfranchise.com>`; not configured or sent. Account/domain/allowance setup evidence is now verified; wiring and actual receipt stay later gates.

These current observations supersede only older private-runner allowance and private-repository inactivity assumptions plus the dated M1 status row. The historical details below do not reopen completed work or grant effects.

References checked read-only:
- https://docs.github.com/en/billing/concepts/product-billing/github-actions
- https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule

---

# Scholarship season monitoring — bounded build plan

Status: M1 inventory/setup checkpoint, September 15, 2026. Kelsey directly requested
M1 in the current session; local inventory and read-only setup inspection are authorized.
M2, scholarship-source pilot, configuration changes, notification sends and activation
remain outside this instruction.
Owner: Codex implements and maintains the handoff; Kelsey approves activation and
any later authoritative scholarship changes. This is a new selected project;
completed R1–R7 and historical reviews/attestations remain unchanged.

## Objective and finished behavior

Check every in-scope scholarship not known to be open at least once per 14-day
review cycle, subject to provider/scheduler availability. Detect possible openings,
new cycle dates and material rule changes, and give Kelsey a concise actionable
report. Preserve evidence, failures and next checks across sessions and machines.
Routine collection and scheduling are autonomous; ambiguous rules and application
portals can require human review. Monitoring never silently updates the workbook
or the student-facing catalog. Zero observed reopenings is a valid run result.

## Grounded starting point

- Parent checkpoint: a4e72d73f97d72c3ef17309fffa3bd9f62111206 (R7 local closeout).
- Retained previously verified delivered main: aae973238bed8651c3404b17cd51c1385f457075.
  Git/connector remote verification failed in R5; current remote access is unknown.
- `web/fixtures/r3/catalog-v1.json`: 411 awards, all411 cycles unknown,436 sources,
  21 portals,4 application groups. These are saved counts, not current eligibility.
- `docs/evidence/r5-research/results.json`:26 lead IDs,20 historical links,19holds,
  6restricted/resources,1represented parent. Do not treat26 leads as26 new awards.
- `web/src/lib/monitoring.ts` already supplies bounded execution, evidence receipts,
  queue merging and completeness checks. Reuse suitable functions and tests.
- `web/scripts/p8-live-monitor.ts` still uses older P7/P5/P6 inputs and principally
  detects HTTP/content changes; it cannot simply be enabled for this objective.
  P8 schedule is disabled and notifications are artifact-only.

M1 must pin hashes of these exact inputs and assign all411 awards plus26 lead IDs
an explicit route, reconciling overlaps through stable IDs. Include unknown,
closed and announced cycles; exclude only explicitly evidenced discontinued or
inapplicable records, retaining reason/evidence. Portals are sources, not awards.
Unselected held entities and historical routes retain their current triggers;
no recursive catalog expansion, new awards or broad scholarship discovery.
A future catalog revision requires an explicit inventory reconciliation, not an
unnoticed change of denominator. No live workbook read is required for this build.

## One small implementation

Use existing Node/TypeScript tools and extraction libraries. Add one seasonal
runner and one GitHub Actions workflow in the existing Whitefish repository.
Proposed daily wake-up:07:23 UTC; the runner fetches only due sources. A daily wake-up
with persisted due dates implements14 days correctly across month boundaries.
It runs without an open Codex session or laptop. No new database, hosted dashboard,
AI agent service, subscription, browser-login automation or generic rules framework.

Proposed durable storage: one dedicated `codex/scholarship-monitor-state` Git branch
with `state.json` and a derived `REPORT.md`. Git history provides prior versions;
Actions logs/artifacts are troubleshooting aids, never the only copy of state.
Code executes from reviewed main, never from the mutable state branch. Restrict
writes to the two state/report paths; never merge that branch into product main.
Use one serialized workflow, reject stale state heads, commit checkpoints before
notification, and safely resume unfinished work without replaying completed checks.
A corrupt/missing existing state is an error, not permission to recreate an empty ledger.

M1 must verify GitHub access, repository visibility, available Actions allowance,
branch permissions, notification destination and Vercel integration. Before the
first state-branch publication, the exact branch must have verified deployment
suppression, including its initial creation, and no conflicting wildcard enable rule.
Use Vercel's branch-specific `git.deploymentEnabled` mechanism if supported by this
project's effective configuration. Suppression changes themselves require informed
configuration/release authority. If this cannot be verified, stop activation and
propose one specific alternative; do not add a second storage platform silently.

Code-scope expectation: the seasonal runner, focused tests/fixtures, the workflow,
its initial inventory configuration and the minimal deployment-suppression setting.
Do not edit historical monitoring fixtures/receipts to make them appear current.
Update canonical plan/state once for the separately approved build/activation contract;
use existing acceptance tooling and preserve all historical bindings. Routine progress
and source observations do not require additional canonical plan amendments.

## Individual record and review behavior

One state record per stable award/lead ID: name, kind, source URLs/locator, route,
lastAttemptAt, lastSuccessfulCheckAt, observed cycle/year/open/close/timezone and
precision, evidence excerpt/digest, confidence/reason, nextDueAt, failure count,
review status and last-notified event ID. Preserve the prior observation when it
changes. Store only public scholarship-rule excerpts; no recipient stories or PII.
Shared-source fetches fan out to named children only when award-specific evidence
supports them. Keep child awards, shared applications and annual cycles distinct.

REPORT.md is generated from that state, not independently maintained. It lists:
possible openings; date/rule changes; manual/failed/overdue checks; and individual
last-check/next-check rows with official links. Show exact denominators: awards,
leads, unique fetched sources, unchanged, changed, manual, excluded and overdue.
No silently dropped records, per-run caps or inaccessible children. Kelsey can review
one scholarship at a time through its report row and source evidence. A validated
manual runner command can record a reviewed disposition/evidence and retry one ID;
no new UI is needed. Manual review never promotes facts into the public catalog.

Default due interval:14 elapsed days after a successful check, with dates displayed
in America/Denver. A source with an evidence-backed expected opening within30 days
uses7 days until its status resolves. Historical season alone is an estimate, not an
opening date. On an observed opening, queue an alert and use7-day deadline checks;
after its evidenced close return to14-day checks. No automatic deadline extensions.
Manual/offline records remain visible every14 days; do not repeatedly hit login walls.
Explicit exclusions remain listed with their evidence and can be manually reopened.

A page change or Apply button is only a signal. Label a candidate opening only when
award-bound public evidence establishes the applicable cycle, an open window at the
observation time and a usable application route. Undated/contradictory text, an old
cycle, a login-only route or an unrendered PDF/JS page stays needs-review. Never infer
missing citizenship, residency, GPA, membership or care conditions. Use supported
HTML/PDF text extraction; ambiguous table alignment and missing rendered content
stay manual. No automatic login, forms, provider contact or CAPTCHA bypass.

Fetch only registered public URLs: enforce existing SSRF protection across redirects,
response/time limits, conservative per-host pacing and at most3 attempts per fetch.
Honor Retry-After within a bounded run; persist unfinished targets for the next run.
Initial baseline covers every route; stagger later due dates without extending any
successful14-day interval. Record an attempted-but-failed check separately from a
successful one. Retry a failed due source once on the next daily wake; if still
blocked, route to manual review and retain the overdue warning instead of retrying
daily forever. The14-day manual review remains scheduled. A failure never means closed.

## Notifications and operational limits

Kelsey's September 15 correction requires alerts outside GitHub: she rarely signs in
and would miss an issue-only alert. Kelsey confirmed direct email to
`kelsey@waypointfranchise.com`; the delivery setup remains to be verified. GitHub may perform background
scheduling/storage, but reading or acting on an alert must not require a GitHub visit.
The email contains the scholarship names, observed changes, dates when supported,
what needs review, and direct official-source links. It must be useful on its own.

Send a compact email only for new opening/date/rule findings, newly persistent source
failures, or a run failure requiring action. Unchanged runs stay quiet. Pin the exact
recipient, sender, existing email service, allowance and sending scope before activation;
prove actual inbox receipt with a labeled synthetic test. The repository contains an
existing Resend integration for admin recovery, but that code does not prove monitor
sending capability, available quota, or permission to reuse credentials. Evaluate it
read-only first; do not invoke recovery, reveal/copy secrets, add a service or change
configuration from this planning correction. No new GitHub issue or issues:write
permission is proposed for notifications.

Keep source failures deduplicated until recovery or a material new condition. Use stable
event IDs and a durable delivery outbox tied to saved observations; distinguish pending,
provider-accepted, delivered and failed/unknown delivery. Verify the selected provider's
idempotency/reconciliation behavior before implementing retries. An uncertain send
must not cause blind resend or loss of the finding. Pending review remains in the report.
The earlier issue-based proposal in setup.json is historical; the current plan and
notification-preference.json supersede only its notification destination, delivery
mechanism and issue permission proposal. This is a proposal correction, not activation.

Show last completed sweep and overdue status prominently. A daily wake catches up
late/missed runs; manual dispatch resumes using persisted due work. GitHub schedules
can be delayed/dropped and public-repository schedules can disable after60days of
inactivity. M1 must establish visibility and inactivity handling; M4 verifies a real
scheduled run. No claim of guaranteed exact-time delivery or independent outage
detection: a completely disabled scheduler cannot report its own outage. Document
how to inspect last-run health and re-enable it; an independent watchdog is a later
selection if that stronger guarantee is needed. No second scheduler in this build.

M1 calculates projected requests and runner minutes from unique due sources, tests
a representative sample, and sets an explicit run/request budget within verified
existing allowance. Cost or pagination limits produce visible unfinished work,
never truncation. No paid upgrade or new extraction provider is assumed. Verify
the first full sweep fits the budget before activation; otherwise reduce overhead
or present the concrete capacity constraint without shrinking scholarship coverage.
Pause stops fetching/notifications while preserving state. Resume catches up once.
Rollback restores reviewed runner code and validates the existing state schema;
never erase newer observations or rewrite Git history to roll back code.

## Build tracker — update this table, not a second backlog

| Step | Deliverable and completion test | Status |
| --- | --- | --- |
| M0 Plan | This plan, handoff, frozen local independent review; no activation | PASS at candidate527488a; review checkpoint8b8a1d0; digest and22blobs reverified |
| M1 Inventory and setup contract | Preserve437 routes/12pins; provision approved exact sender/credential/environment; deliver exact state-branch exclusion under Revision23 | Approved by Kelsey October21. GitHub environment and four variables provisioned with main-only/reviewer/no-bypass controls. Resend creation/direct secret entry reserved to Kelsey; pending metadata confirmation. Config release in progress under docs/evidence/m1-approved-setup/. M1 not operationally activated; M2/source/send/activation off. |
| M2 Local implementation | Due scheduler, conservative observations, durable state/report, deduplicated alerts and resume controls; saved/synthetic tests pass | Not started |
| M3 Bounded public pilot | Explicit read authority for12 representative registered sources: direct page, shared-child, PDF, closed/announced, ambiguous, inaccessible; reconcile all selected IDs and failure recovery; local review passes | Not started |
| M4 Activate and prove | Approved exact deployment/configuration/state-write/notification effects; publish reviewed workflow; prove full inventory sweep, synthetic alert receipt, no state-branch deployment, pause/resume and a real scheduled run; retain actual14-day transition for final cadence confirmation | Not started |

Execute one step at a time. A session ends with this table and the operative handoff
updated: checkpoint, tests/evidence, unresolved blocker, owner and exact next action.
Use the existing independent candidate/review process for acceptance; reviewer must
not author repairs. Recheck changed material after actual findings. Keep one compact
stage evidence record; no per-scholarship reports or repeated governance proposals.
Plan edits change scope only when explicitly justified; routing ordinary manual
results does not expand scope. Proposed adjacent improvements stay deferred below.

## M1 setup checkpoint — September15,2026

Evidence: `docs/evidence/season-monitor-m1/setup.json`; complete individual inventory:
`docs/evidence/season-monitor-m1/inventory.json`. Reproduce using
`python3 docs/evidence/season-monitor-m1/build-inventory.py --check`. This is saved
input routing, not a live scholarship check or an implemented runner.

- All411award IDs plus26lead IDs retained exactly once:416public-signal candidates,
  18manual source reviews,1known access block and2separate ETV/Fund the Fish follow-ups.
  Zero exclusions or confirmed child merges. All436catalog sources,21portals,
  4application groups and20historical links are accounted for. Four lead records
  retain candidate award/portal overlaps without collapsing children or parent resources.
- 242unique proposed fetched URLs across133hosts serve the416candidate records;
  273registered URLs include manual locators. These are proposed source permissions,
  not permission to fetch. Preserve exact query/fragment identity. Login/form/workbook
  and discovery-only routes remain manual; application URLs are locators only.
  Saved organizer authority remains unverified; field-specific source review is required.
- Authenticated Whitefish GitHub CLI account266880911 has admin/push rights on
  private repository1177349487. API main and local origin/main both equal
  aae973238bed8651c3404b17cd51c1385f457075. SSH and the other-account connector
  fail; this does not negate the successful authenticated API observation.
  Actions is enabled with read-default workflow tokens. No state branch or matching
  notification issue exists at the M1 observation; issue delivery has since been rejected.
  Existing branches report unprotected; repository rulesets
  are unavailable on the current plan. Future writer scope is enforced in reviewed code,
  not claimed to be a branch/path-restricted GitHub token.
- Vercel visibly connects the existing web project to this repository, root `web`,
  Hobby plan. Skip-unaffected is disabled; ignored-build behavior is Automatic.
  No tracked Vercel config exists. Suppression is neither configured nor proven.
  The exact future `web/vercel.json` proposal is in setup.json: only
  `codex/scholarship-monitor-state:false`, with no wildcard true rule. Future state
  branch creation inherits the reviewed main tree containing that config; only
  `state.json` and `REPORT.md` may be added/changed. Do not create a config-free branch.
- Proposed job limit30minutes, acquisition stop25minutes,4500HTTP requests,4parallel
  hosts/1per-host,1second pacing,3attempts and20second end-to-end attempt timeout.
  Initial242sources imply up to4356HTTP requests including redirects/retries.
  Unmeasured8second/source assumptions suggest10.07minutes for first sweep and
  79.86–97.72minutes per31days at14/7-day cadences. Worst-case fetch time alone is
  60.5minutes: interrupted sweeps must persist/catch up, never omit IDs.
  The monthly scheduled ceiling is930minutes; proposed total including manual runs
  is1000minutes, conditional on sufficient verified allowance and zero paid overage.
  Live timing and extraction use the12registered-source M3 sample only after authority;
  neither a representative live sample nor full-sweep capacity has been proved.

M1 remains incomplete. Codex owns resumption, independent checkpoint review and
reconciliation; Kelsey supplies/selects otherwise inaccessible account/delivery facts:

| Remaining item | Owner and next action | Trigger |
| --- | --- | --- |
| Existing Actions allowance, other usage, zero-overage setting | Kelsey provides read-only billing visibility or the current figures; Codex reconciles the proposed budget. Both billing APIs report missing user scope and browser is logged out; no permission expansion attempted. | Account evidence available |
| Direct email delivery | Destination confirmed: kelsey@waypointfranchise.com. Codex verifies existing sender/service capability, allowance and proposed access. Prove actual inbox receipt in M4. No issue-only alert. | Read-only service verification; recipient response complete |
| Suppression and writer verification | Codex applies/reviews the exact proposed configuration before initial state publication and proves provider behavior. | Later exact configuration/release authority |
| Measured capacity/extraction | Codex uses the12registered-source sample, then full-sweep evidence; assumptions never become verified allowance. | Authorized M3, then M4 |

No M1 acceptance, M2 start, source call, workflow activation, paid action or external
publication follows merely from this checkpoint. The existing single tracker remains
authoritative. All original research/recovery routes below remain unchanged.

## Verification and final acceptance

Meaningful tests must cover14-day due logic across months/DST,7-day exception,
unknown not closed, yearless/old-cycle/Apply-button false positives, changed rules,
shared-source distinct children, redirect/bot/PDF failure, counts and no lost IDs,
crash during a sweep, stale concurrent writes, corrupt state, notification replay,
pause/resume and budget exhaustion. Use a fake clock for long intervals.
Run AGENTS-required `npm run plan:check`, `npm run typecheck`, `npm test`, `npm run build`
from web and `git diff --check` from root; actual authority and historical gates apply.
Live pilot verifies extraction rather than treating green tests as scholarship truth.
M4 is initially operational only after real cloud/state/notification evidence; confirm
biweekly operation with the subsequent actual due sweep. A simulated14-day run alone
is not long-term monitoring proof. Failures/unknowns and any remaining wait stay visible.

Finished: all in-scope IDs have an accountable route; cloud wake-up and persistence
work without this desktop; individual evidence/report and meaningful alerts work;
missed-run/restart/pause behavior is proven; no automatic authoritative facts change;
and no unapproved deployment or spend. Operator instructions are a short section
in this plan, with the deployed workflow/state links, verified email destination and disable/resume command.
Review value at the end of the first scholarship season without requiring a new build.

## Boundaries, deferred work and resume

The original request authorized planning only. The September15 continuation explicitly
authorizes M1 inventory/setup. No monitor, issue, public scholarship fetch, external
write, account/configuration change or release has started. Public technical
documentation and read-only existing platform observations inform setup. Before
M2 or public pilot/activation, record the separately approved build/effects contract
through canonical plan/state once. M1 does not amend historical authority or grants.
Prepare concrete reviewable configuration and costs before activation approval; no
routine Git questions.

Preserve R1–R7, all recovery/no-replay objects, held entities, criteria/definition issues,
Bonita/NTHS routes and the selected ETV/Fund the Fish follow-ups. Those two remain
separate research tasks and are not prerequisites to building this monitor. Other
future work: automatic workbook/publication updates, recursive portal discovery,
new applicant questions, dashboards, independent watchdog and paid browser services.

Resume: open `/private/tmp/program_code-season-monitor-plan`, branch
`codex/scholarship-season-monitor-plan`. If missing, recover the committed branch into
a new isolated worktree without rewriting history. Read AGENTS, canonical plan,
BUILD_STATE, operative CURRENT_HANDOFF, latest accepted evidence, then this plan and
`docs/evidence/season-monitor-plan/review.json`. Verify its candidate/digest before
calling M0 reviewed. Read the tracker; continue only the first unfinished authorized
step. M0 is reverified PASS. Current next action remains finishing M1 setup gates below;
do not advance to M2 from a partial checkpoint review.

Technical references checked September15,2026:
- [GitHub schedule behavior](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule): default-branch scheduling, delayed/dropped runs and public-repository inactivity limitation.
- [Vercel branch deployment control](https://vercel.com/docs/project-configuration/git-configuration#git.deploymentenabled): branch-specific disable and overlapping enable rules; actual project behavior still requires verification.
