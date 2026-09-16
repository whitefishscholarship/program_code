# Four-screen interview journey — UX1

Date: 2026-09-16. Owner: Codex. Priority: before the scholarship season timer.
Single implementation plan for this UX maintenance release; canonical authority is
Plan Revision 20 in SCHOLARSHIP_SYSTEM_BUILD_PLAN.md and BUILD_STATE.json.

## 1. Outcome and authority

Make the full four-screen interview the normal route to personalized results.
Only the existing GPA and target-school-type answers are required. Students may
leave every other answer blank or use existing none/unknown answers. The September16
cleanup removes visible prefer-not answers and sensitive-skip controls; its direct
authority is in docs/evidence/ux1-cleanup/authority.md.
The user expressly clarified that mandatory screens do not mean mandatory input,
requested Back with answer editing, authorized a complete stored plan and execution,
and required a direct handoff to the timer plan. Exact statements are recorded in
`docs/evidence/PLAN-REV20.md`.

Local planning, prospective policy, implementation, tests and independent review
are authorized. Publication is a separate final gate because Git pushes/PRs can
create Vercel Preview deployments and merging creates Production deployment.
No prior release grant is reused. Prepare a concrete reviewed change before asking
for any missing release authority. Do not stop local work merely because it is missing.

## 2. Baseline and isolation

- Verified GitHub main: `aae973238bed8651c3404b17cd51c1385f457075` on 2026-09-16.
  Exact read command and UTC observation are in `docs/evidence/ux1/preflight.json`.
- Branch: `codex/ux1-four-screen-journey`.
- Worktree: `/private/tmp/program_code-ux1-four-screen-journey`.
- Timer branch remains `codex/scholarship-season-monitor-plan`, saved at
  `009fa57e7def04ce2a9b49051f395c32b1393c14`; preserve its original files and history.
- P0–P9 and historical amendments remain complete and unchanged. Stage pointers
  stay null; `interviewUx` tracks only this local maintenance work.

## 3. Exact behavior and control inventory

| New step | Existing screen | Controls retained |
| --- | --- | --- |
| 1 of 4 — Start with two details | 1 | Required unweighted GPA and target school type |
| 2 of 4 — More details and application preferences | 4 | Residence, educational status, college acceptance, gap year and six application format choices; all optional |
| 3 of 4 — Study plans and activities | 2 | Education interests, career/activity criteria, four activities, conditional volunteer hours |
| 4 of 4 — Helpful scholarship connections | 3 | Financial-need discovery preference, student organizations and clearing responses, remaining criteria |

Preserve all 38 special criteria, every currently configured interest/organization,
all substantive option values and IDs, conditional clearing, and existing eligibility
semantics. Explicitly retire only the prefer-not and sensitive-skip UI controls.
Keep legacy schema values compatible internally; no matcher/schema migration.
No new question, checkbox or answer acknowledgement is introduced.

- Display `Step 1 of 4` through `Step 4 of 4`; remove optional-section headings and
  invitations to stop early. Individual optional-field labels remain accurate.
- Steps 1–3 have one prominent `Continue` action. Step 4 has one prominent
  `Show my results` action. No personalized-results shortcut on steps 1–3.
- Steps 2–4 have a secondary `Back` action. Keep existing all-award browsing and
  cancel-edit access as a visually quieter first-step exit, separate from the
  primary progression. Leaving an edit via Back to results keeps prior submitted
  results; completing the edited journey submits the revised answers.
- Back does not validate or clear answers. Forward progression validates the
  existing required core only. Blank optional screens must advance successfully.
- Guard completion so it can occur only from the final step. Preserve validation
  feedback for blank/out-of-range GPA and no target school selection.
- Preserve live component state while moving backward/forward. Edit answers from
  results repopulates the four screens; final submission replaces the previous
  answer set and recalculates results. Clearing a prior selection takes effect.
- Reset and page reload retain their existing clearing behavior. Answers remain
  in volatile page memory; no local/session storage, cookies, URLs, requests,
  logs, analytics or exports contain interview answers.
- Continue/Back/results are keyboard accessible, visibly focused and usable at
  360px and desktop widths. Focus follows the current step heading.

## 4. Implementation boundary

Runtime scope: `web/src/components/InterviewWizard.tsx`,
`web/src/components/ScholarshipBrowser.tsx` and `web/src/app/page.tsx`. The latter
two permit copy/notice removal only; preserve all catalog, result, edit and reset logic.
Keep the original UX1 evidence immutable. Record this correction under
`docs/evidence/ux1-cleanup/` with a separate current browser regression script.
Preserve original UX1 QA and evidence; they describe the original reviewed release.
The two presentation assertions in web/scripts/test-p8f-interview.ts that require
SensitiveSkip text and SHORTLIST_NOTICE are prospectively superseded by this direct
correction. Update only those assertions to verify their removal; keep every actual
matcher, privacy, schema and export regression unchanged.
No new dependency, matcher/schema change, catalog/data change, source fetch,
spreadsheet access, provider contact, email send, credential/configuration change,
monitor/timer implementation, paid action or remote release during local execution.

## 4a. September16 optional-answer and copy refinement

- Remove every visible Prefer not to answer option: college acceptance, gap year,
  financial-need interest and organization response. Remove both sensitive-skip
  checkboxes and their helper copy. All substantive questions and categories remain.
- Blank optional answers remain valid before and after editing. Provide a small
  keyboard-accessible Clear answer action only when an optional radio group has an
  answer; this resets that answer to null. Checkbox choices remain individually
  toggleable; organization clearing resets both choices and response. This is an
  editing action, not a substitute decline answer or a required acknowledgement.
- Preserve legacy parsed-answer compatibility and non-exclusion: legacy prefer-not
  choices display as blank; previous sensitive skipping never resurrects cleared
  selections or leaves visible options permanently disabled. Explicit later choices
  take effect. No answer/schema/catalog/matcher fact is promoted or persisted.
- Remove the temporary-memory paragraph and How your answers are used disclosure,
  global organizer/snapshot/unsupported-choice notices, no-effect annotations,
  financial-need/organization/application-preference implementation explanations,
  and generic nonselection/points explanations. Remove the repeated results banner
  and introductory matching-status explanation. Keep per-award facts, status labels,
  specific result reasons, accessible counts and required-field validation errors.
- Simplify the privacy-focused hero/start/results copy to plain scholarship wording;
  remove the legacy start-screen promise cards and generic footer warning. Keep
  Administrator sign-in, browse-all, all questions, progress and Continue/Back/results.
  Retain concise question definitions when needed to understand an answer choice.
- Actual privacy behavior stays identical: volatile current-visit state, no answer
  storage/transmission/logging or answer-bearing CSV. Removing explanatory text
  does not authorize changing those mechanisms.
- Preserve all original docs/evidence/ux1 files and the existing QA script byte-for-
  byte; use new cleanup evidence and QA. Recheck desktop/mobile four-step flow, blank
  screens, selecting then clearing each optional radio, clearing organizations,
  Back/edit/recalculation, legacy compatibility, reset/reload, keyboard/focus and
  exact public CSV. Assert removed copy/options absent on all screens and results.

## 5. Execution tracker and completion gates

These are checkpoints within one UX maintenance release, not permission to start
another program stage. Update this table and CURRENT_HANDOFF; no duplicate backlog.

| Checkpoint | Work and completion gate | Status |
| --- | --- | --- |
| Plan and policy | Store and review the prospective cleanup correction before affected runtime edits | Original PASS preserved; cleanup policy PASS at6d77046, C0/H0/M0/L0 |
| Local implementation | Preserve four-step flow; remove decline controls and extra notices; make optional answers clearable | Cleanup implemented; optional clearing and concise copy verified locally |
| Verification and independent review | Required checks, revised browser matrix, preserved artifacts and fresh final cleanup review | Original PASS at1207be2 preserved; cleanup tests/build/browser PASS; independent final local PASS atbc22ae1, C0/H0/M0/L0; four canonical release gates remain |
| Release | Obtain any missing exact push/PR/Preview/merge/Production/verification authority; refreeze/review authority-bearing candidate; canonical direct-child two-file attestation; exact Preview/CI then merge and exact Production checks | Not authorized or started |
| Direct timer handoff | After UX delivery is verified, continue only unfinished timer M1 under section 7 below | Queued; Codex owns continuation |

The plan/policy checkpoint is local prospective preparation. It does not create a
canonical attestation or claim acceptance. Keep the existing validator unchanged:
until exact delivery authority and the final canonical manifest/review/attestation
exist, expect four Revision 20 diagnostics. They remain failures and block release;
never suppress them or treat other diagnostics as expected. Local implementation
may follow the independent prospective-policy review under the direct user grant.

## 6. Acceptance and evidence

Use fictional profiles against the local production build, with 360×800 and
1440×1000 viewports. Check actual controls and results, not just source text.

1. Exact 1→4→2→3 content order and step count; only one primary forward action;
   no early results; blank optional screens reach results.
2. Empty/invalid GPA and missing school type block Continue with visible errors;
   valid basics advance. Back always works without demanding new input.
3. Enter optional values on every panel, go Back repeatedly, verify values remain,
   change and clear selections, then compare final ordered IDs/reasons with the
   unchanged matcher for the final profile. Re-enter through Edit answers and
   verify replacement rather than accumulation of prior answers.
4. Preserve substantive controls, direct answer clearing, conditional service hours,
   none/not-sure responses and all-award access. Verify no prefer-not/sensitive-skip
   controls remain visible; preserve conservative legacy skipped-answer behavior. Keep unsupported and
   unknown choices non-excluding; no eligibility facts change.
5. Keyboard-only forward/back traversal, heading focus, mobile/desktop layout,
   no horizontal overflow, and screenshots of the reordered flow.
6. Reset/reload clearing; no answer storage/requests/logs/URLs; exact public CSV
   for visible awards/order; API catalog remains identical to the saved publication.

Required commands from `web/`: `npm run plan:check`, `npm run typecheck`, `npm test`,
`npm run build`, plus the new local browser QA command recorded in validation.
From root: `git diff --check`. Preserve actual exit codes, timestamps and log hashes.
Full plan validation is not PASS while the four disclosed release gates remain.
Saved fixtures and tests do not prove scholarship facts are current or hosted health.

Freeze complete local candidate before fresh-context read-only review. Manifest the
entire verified main-to-candidate change set, hashing candidate-tree blobs. Bind the
local policy and final reviews separately; no old review is rebound. Address all
critical/high findings, and fix or disposition every medium/low finding with owner
and rationale. Final canonical attestation is withheld until all release gates are
satisfied; once added it must be the exact direct child and remain tip until delivered.

## 7. Direct handoff — continue the scholarship season timer

Trigger: UX release is merged and exact Production UX behavior is verified, or Kelsey
explicitly directs resumption sooner. Codex owns this handoff; it is required closeout
work, not an optional suggestion or a new unowned task.

1. Record the exact UX candidate/attestation/merge/deployment, verification result
   and any unresolved owner/trigger in CURRENT_HANDOFF. Point next to timer M1.
2. Open `/private/tmp/program_code-season-monitor-plan`, branch
   `codex/scholarship-season-monitor-plan`, retained checkpoint
   `009fa57e7def04ce2a9b49051f395c32b1393c14`. Recover a missing worktree from that
   retained branch without reset, force-push or history rewrite.
3. Read AGENTS, canonical plan/state, operative CURRENT_HANDOFF and
   `docs/SCHOLARSHIP_SEASON_MONITOR_PLAN.md`; then
   `docs/evidence/season-monitor-m1/{inventory,setup,review,notification-preference}.json`.
   The current UX handoff supersedes the older monitor-only priority instruction.
4. Resume unfinished M1 setup: verify existing GitHub Actions allowance/usage and
   zero-paid-overage protection; verify the existing email sender/service/allowance
   for **kelsey@waypointfranchise.com**. Direct-email alerts must include findings,
   review actions and official links; unchanged runs stay quiet. No GitHub visit is
   required to read an alert. Recipient selection is complete; do not ask again.
5. Reuse the finished 437-record inventory (411 awards + 26 leads), 416 public-signal
   candidate routes, 21 manual routes and 242 proposed fetch URLs. Reproduce its
   pinned digest with `python3 docs/evidence/season-monitor-m1/build-inventory.py --check`.
   Preserve M0 review and partial M1 review; do not claim full M1 completion.
6. The saved timer branch predates this UX release. Before timer code or release
   preparation, verify fresh main includes the delivered UX; prepare a clean
   continuation from that main, carrying timer-owned documentation/evidence plus
   required pinned saved inputs and their original provenance. The inventory builder
   requires `docs/evidence/r5-research/results.json` from timer checkpoint009fa57,
   SHA256 `b559cf798e624259d1ce5acd16fa793e2b215e9f8a53d40885086d8726eca848`;
   it is absent from the pre-UX main baseline. Carry that exact saved input without
   rereading sources or changing its contents. Verify the other input,
   `web/fixtures/r3/catalog-v1.json`, SHA256
   `9a4f8c8c0e3990fcaa182f52595710ee0404c11572f69512b4254bb0f6b72908`.
   Record original commit/path/hash provenance; preserve original review records
   without rebinding them to the new tree. Reproduce the inventory after transfer
   and require SHA256 `87d560f3feb2fcb35167e5a4f570a2f39a584a09df28b74d2f57a7d0509baac8`.
   Any source drift requires reconciliation before continuing. Preserve delivered
   UX/runtime bytes; never deploy the old timer tree or revert the UX.
   Route CURRENT_HANDOFF conflicts by keeping the
   newest operative instructions and preserving older sections as history.
7. Follow the timer's own M1→M2→M3→M4 gates. M2 needs its selected build contract;
   the 12-source public pilot remains M3; suppression/state writes, scheduling and
   email sending/receipt proof remain M4 with exact authority. This UX grant does
   not activate the timer or authorize those effects.

Unresolved monitoring setup and all original research/recovery queues remain in
the retained timer handoff. Preserve ETV/Fund the Fish as separate follow-ups,
257 spent operations and recovery objects; no replays or source changes.

## 8. Recovery, rollback and fresh-session kickoff

Resume `codex/ux1-four-screen-journey` in its worktree. Read AGENTS, canonical plan,
BUILD_STATE, operative CURRENT_HANDOFF, latest local UX review/evidence and this plan.
Verify current Git status, baseline ancestry and candidate hashes. Execute only the
first unfinished authorized UX checkpoint; no repeated completed reviews or tests
unless changes, failures or unresolved concerns justify them.
Local rollback is abandoning the UX-owned change while preserving the checkpoint;
do not restore external data or rewrite history. A deployed rollback is a separate
explicit effect. Stop affected work on source drift, unexpected validation failures,
scope expansion or review findings; record owner and next action. Complete all
unaffected local work. After verified UX delivery use section 7 directly.
