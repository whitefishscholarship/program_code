# SD1 local validation

Scope: local contract/pilot planning, not canonical implementation acceptance.
Entry checkpoint72e39fe95daa64dd0a2fb47083e56d112a78d0bc; retained main object
1c8e33f23beb55c2ed2ebe78fe4e256722af8392. Live remote refresh failed HTTP404;
no delivery is claimed. Exact raw outputs are retained in checks/. The independently
reviewed candidate will be identified in review.json; do not rebind that record.

## Required commands

| Command / location | Result |
| --- | --- |
| npm run plan:check / web | Initial sandbox exit1, IPC EPERM; permitted retry exit0, 13 ordered contracts/current machine transition passed |
| npm run typecheck / web | Exit0, 2026-10-13T14:52:55.932992Z |
| npm test / web | Initial sandbox exit1, IPC EPERM; permitted retry exit0 at14:59:39.085292Z, complete existing suite |
| npm run build / web | Exit1 at14:52:57.766545Z; permitted retry exit1 at14:59:40.259424Z, Turbopack process/port EPERM |
| npm run build -- --webpack / web | Exit0 at14:59:52.368256Z; compiled, TypeScript and static pages/routes generated |
| git diff --check / root | Exit0; repeated for final candidate preparation |

checks/results.json and checks/permitted-results.json record exact starts/ends and
log paths for the initial matrix and permitted test/build retries. The separately
invoked permitted plan-check returned "Build-plan validation passed for 13 ordered
stage contracts and the current machine-state transition"; its completion was
observed before15:04UTC, exact per-command timestamp unavailable. No build script,
configuration or acceptance gate changed. Staging exposed trailing whitespace in
two newly saved command logs; those exact outputs were preserved losslessly as JSON
rawOutput strings, with result paths updated. No historical log was changed. The
final staged whitespace check covers all new files, unlike an unstaged tracked-only
check. The alternate build does not turn the
standard build into PASS. This unresolved environment limitation prevents claiming
all universal gates or canonical stage acceptance; it does not erase the completed
local planning deliverables. Historical middleware/Edge warnings remain unchanged.

## Local pilot checks

Root commands:

`python3 docs/evidence/sd1/run-pilot.py`

`node --import ./web/node_modules/tsx/dist/loader.mjs docs/evidence/sd1/check-public.ts`

Both exit0. The first produces deterministic pilot/validation/summary files and
23 behavioral probes (names and result in pilot-validation.json). The second parses
all12 conservative public award projections and16 source projections with the
existing unchanged StudentAwardSchema/StudentSourceSchema and checks source links.
Probes include adversarial missing/stale/conflicting facts, need-selection separation,
entry versus renewal GPA, optional answers, AND/OR, parent/child identity, current-
cycle priority, all non-open cadences, near-opening cadence and failed-check retry.
Fictional acceptance cases are explicitly synthetic; no real answers or applicant
data are stored. Public compatibility proves shape/relationship support, not live
app behavior or current scholarship truth. No UI/browser work is required for an
unchanged app; later SD4 student tasks remain unexecuted.

## Preservation

Direct byte equality against the entry commit confirms AGENTS, canonical plan and
BUILD_STATE unchanged. Original CURRENT_HANDOFF is an exact suffix. Git diff for
web/.github is empty; app, fixtures, dependencies and deployment/runtime files are
unchanged. Original student-data proposal/replacement review/validation records and
all historical attestations are preserved. Only the selected plan/handoff pointer,
new contract and new docs/evidence/sd1 material are stage-owned. Primary checkout
remains clean on the retained historical branch; no push/PR/merge or external effects.

No old cell snapshot was read for this task. The twelve new-copy records, current
public app identity crosswalk and selected independently captured source sections
have separate provenance. Raw selected-source digests are preserved as recorded
historical receipts, not asserted as freshly fetched/verified full documents.
Missing complete source captures, age/date conflicts and unknowns are held. All
initial due dates are proposed October13 catch-up, not fabricated monitor success.

## Review boundary

Freeze the complete local candidate before fresh-context independent read-only
review. Supply the original SD1 objective, entry and retained main baselines, full
diff, contract, pilot/input hashes and this validation. The reviewer may not edit,
fetch scholarship/applicant data, write sheets or repair findings. Author remediates
and reviewer rechecks a replacement frozen candidate when needed. This is the
existing local proposal review pattern, not a new canonical manifest/attestation.
Preserve reviewed candidate bytes; append only the new review/closure record locally.

Final close: one local PASS/BLOCKED/FAIL with scope and unresolved exact standard
build/fresh-delivery-baseline limits. Stop before SD2.
