# SD1 checkpoint and authority

Selected October 13, 2026. Local planning/pilot only; SD2 is unstarted.
Implementation agent: Codex `/root`. Actual backend model/effort identifiers are
not exposed in this session; no model switch was requested or performed.

## Direct selected scope

Kelsey requested: finalize the scholarship data contract and test a representative
pilot in the existing retained planning worktree/branch, preserve the primary checkout,
read controlling files and the latest replacement-sheet review, inspect only the
new copy's metadata, scholarship headers and 8–12 representative records, with no
applicant information or old spreadsheet/cell-snapshot fallback. Finalize vocabulary
and unknown states, separate eligibility need from selection need, stable award/
cycle/source IDs and lean workbook feed, reconcile the existing monitor's queue,
test student filter/fit/priority/review use locally, record missing evidence and the
exact first SD2 batch, obtain review, save validation/continuation and stop before SD2.
Sheet writes, app changes, deployment, monitoring activation and notifications are
expressly prohibited. No new official-source fetch was performed; only applicable
saved independent public-source evidence was used with scope/freshness limits.

## Controls and recovery

Worktree `/private/tmp/program_code-student-data-maintenance-plan` exists on
`codex/plan-student-data-maintenance`; initial state was clean. Entry checkpoint:
`72e39fe95daa64dd0a2fb47083e56d112a78d0bc`. Latest replacement review is
`docs/evidence/student-data-plan/replacement-sheet-update.md`, reviewing 47757f0.
The existing baseline `origin/main` object is 1c8e33f23beb55c2ed2ebe78fe4e256722af8392.
An authenticated `gh api repos/whitefishscholarship/program_code/commits/main --jq .sha`
attempt returned HTTP404 using the currently active Franscale1922 account. The saved
owner-account main verification was not silently presented as refreshed. No account,
credential, remote, or Git transport configuration was changed; local-only work does
not require a live delivery claim. Fresh authenticated main verification remains a
later delivery prerequisite. The primary checkout remained clean on its historical
codex/p1-reproducible-baseline branch (behind342); it was not moved or edited.

AGENTS, canonical Revision21, BUILD_STATE null pointers, most recent accepted P9
evidence, current plan/SD1 kickoff, original proposal review and replacement review
were read. Only local proposal material and new SD1 artifacts change. No canonical
amendment or acceptance is claimed. Direct user scope supersedes the saved prompt's
absence of sheet-read permission for this bounded selection only. Existing canonical
acceptance/attestation and deployment gates remain unchanged and operative for later
implementation/release. Historical P9/master references are provenance, not reads.

## Fresh-copy observation

Spreadsheet: `1-rgieaL5Hd87W97Zzx9SPFFSmPAmSPGqkzPYnjDQzL0`, title
`Spreadsheet Clean Up 4`; native Sheets, locale en_US, timezone America/Denver.
Native metadata (`metadata.json`) reports seven tabs:

| Tab | gid | Grid | Visible |
| --- | --- | --- | --- |
| Cleaned Up backup 2026-09-19 | 1193557025 | 795×25 | No |
| WHS Senior Scholarships | 0 | 1034×21 | No |
| WHS Senior Scholarships_UPdated 12_1 | 150739037 | 1035×29 | No |
| School Resource - Cleaned Up | 405588227 | 795×25 | Yes |
| Start Here | 453916594 | 1000×26 | Yes |
| Resource: Student Research Worksheet | 1478970682 | 1000×26 | No |
| Cleaned Up backup 2026-09-20 | 745255621 | 795×25 | No |

Only the named scholarship tab's A1:Y1 header and A:O of rows
2,18,45,80,115,150,185,220,255,290,325,400 were read. Twelve nonempty, independently
named scholarship candidates were observed. The other tabs' cells, P: Y record
columns, applicant records and predecessor cells/snapshots were not read. No whole-
workbook population or equivalence claim is made. Header width includes blank S:Y;
18 named headers were observed. P/Q/R headers exist but their record contents are
excluded. Visible row ranges are sampling coordinates, never transferred identities.

Connector calls: get_spreadsheet_metadata(exact ID); get_spreadsheet_cells(exact
quoted scholarship tab, header); get_spreadsheet_cells(the12 exact A:O rows), with
formattedValue,userEnteredValue,hyperlink,textFormatRuns. Then get_file_metadata
fields id,name,mimeType,version,modifiedTime,webViewLink,trashed. The latter returned
modified_time 2026-10-13T14:18:43.551Z but did not expose version. Capture occurred
in this session before14:45:41UTC; an exact per-call timestamp/version is unavailable.
Successful cell reads establish bounded access; metadata source_visibility_status
still says access_not_verified and does not prove edit permission or runtime access.
No revision lock, complete preservation audit, hidden-P width/yellow-format check,
backup equivalence or concurrency guarantee was performed for this read-only pilot.
Those checks remain prerequisite to any later authorized migration/write.

Raw bounded metadata/headers/records are saved without contact/note/applicant cells.
Their hashes and source input hashes are recorded in the final local review packet.
App catalog is consulted only for public identity/locator/schema crosswalks, never as
current new-copy values. No cells-*.json or old spreadsheet snapshot was used.

## Deliverables, decisions and remaining work

- `../../STUDENT_DATA_CONTRACT.md`: final SD1 vocabulary/fields/unknowns, IDs, five
  logical tables, publication boundary, queue ownership and conservative student use.
- `PILOT.md` and `pilot.json`: all12 cases, per-field proposals, raw fresh values,
  evidence pointers/digests, missing evidence, due dates and first SD2 batch.
- `run-pilot.py`, `pilot-validation.json`, `check-public.ts`: repeatable local probes
  and existing-public-schema compatibility; no app implementation.
- `VALIDATION.md` and checks/: exact mandatory checks and unresolved environment limits.
- `review.json`: fresh-context read-only review of the immutable candidate only.
- `CONTINUE.md`: short prompt, next scope and stop conditions.

Decisions: needRequired and needSelection remain separate; M=Yes does not settle
either. Existing IDs remain crosswalk candidates with two held mappings. Reviews
owns decisions/due dates; retained M1 state branch owns attempts/fingerprints/outbox
and REPORT is generated. Whole437-record reconciliation belongs to SD5; no second
runner/queue. Current recorded shortlist and accepted fact layers stay separate.

Missing evidence: every selected award's applicable current offering/window/route;
Spear document identity, Live Your Dream published-locator binding, Pell GPA and
loan/gift scope, ND age/date/need contradictions, AOPA named child offering and parent
date conflict; other record-specific gaps are in PILOT. No fact is accepted here.
All12 initial review dates are October13, not a claimed successful monitor check.

Exact first SD2 batch: award-2179b44d009d (Pell Promise), award-97dfaadd1d31
(Neurodiversity), award-ce44143820a7 (David and Lisa Barnes), in that order.
This is a proposed frozen three-complex-identity batch, not SD2 execution authority.
Owner Codex; trigger: direct SD2 selection and bounded source/denominator authority.
Later scope must establish the separately named whole-ledger denominator; the12-record
sample and411-app/437-monitor inventories are distinct. No broad discovery, extra
children, workbook writes or catalog publication follows from this checkpoint.

Standard-build process/port failures, fresh delivery baseline, full preservation,
canonical implementation selection, publication field extensions and monitoring
allowance/service/suppression gates remain explicitly deferred. No paid/provider/
form/applicant effects, push/PR/merge, deployment, activation or notifications occurred.
