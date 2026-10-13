# Local student-data planning validation

Recorded October 13, 2026, 14:13:51 UTC (08:13:51 America/Denver).
Scope: a documentation-only proposal, not a canonical stage acceptance or delivery.
Baseline: `1c8e33f23beb55c2ed2ebe78fe4e256722af8392`, authenticated owner-account
GitHub main API and existing local tree agreed during this session. Deployed health
also identified this SHA. No global account/configuration switch occurred. The
rewritten HTTPS fetch failed; this record does not claim a successful fetch.

## Checks

Executed in `/private/tmp/program_code-student-data-maintenance-plan/web`:

| Exact command | Result |
| --- | --- |
| `npm ci` | Exit 0; lockfile and package files unchanged |
| `npm run plan:check` | Initial sandbox IPC permission failure; permitted retry exit 0: 13 ordered contracts and current machine-state transition passed |
| `npm run typecheck` | Exit 0 |
| `npm test` | Exit 0; complete repository script finished, including R3 catalog/coverage/privacy and historical plan/attestation regression suites |
| `npm run build` | Exit 1, both default attempt and permitted retry: Turbopack creating a process/binding to a local port received Operation not permitted (os error 1) |
| `npm run build -- --webpack` | Exit 0: compiled, TypeScript completed, 10 static pages generated, routes and middleware emitted |

Executed in the repository root: `git diff --check`, exit 0.
All above outcomes were complete by the recorded timestamp. The successful
alternative build does not convert the exact standard build to a pass; that
command remains environment-blocked. No build script/configuration was changed,
no acceptance gate was waived, and no implementation stage is being accepted.
Existing middleware/Edge Runtime warnings appeared in the alternative build.

The new worktree initially had a zero-byte Git index. `git read-tree HEAD` rebuilt
only that new checkout's tracking metadata (exit 0); no files, original checkout,
branch history or historical attestation were reset. Subsequent status/diff worked.

## Preservation and scope

A direct byte comparison to the baseline confirmed AGENTS.md, the canonical build
plan and BUILD_STATE.json unchanged. The original CURRENT_HANDOFF.md is an exact
suffix of the new file; original SHA256:
`d32cbc90668b855b9a3d9cbaa4e035031160914312ee6de142749a9976ece04a`.
The primary checkout remains clean on codex/p1-reproducible-baseline, with its
historical attestation untouched. App code, fixtures, lockfiles, configuration,
all prior evidence and historical attestations remain baseline bytes.

Changed paths are limited to the new student-data plan, the prepended handoff
pointer and this task's validation/review records. No source research, Google
Sheet access/edit, applicant data, timer activation, alert, Git push/PR/merge or
Vercel release occurred in this planning task. The preceding cleanup task is
already complete and is preserved separately; this plan does not replay it.

## Evidence boundaries

The plan distinguishes live API observations, saved reviewed research, proposed
schemas/policies and unresolved facts. Catalog observation endpoints:
https://web-two-gules-45.vercel.app/api/health and
https://web-two-gules-45.vercel.app/api/scholarships . The catalog observation was
411 award records, 436 sources, 21 portals, 4 application groups and 411 unknown
cycle statuses; counts do not prove current eligibility or availability.
Final cleanup and source artifacts are referenced by exact paths in plan section 2.
They were inspected locally; no scholarship source was newly fetched for planning.
The seasonal plan was read from retained commit
`009fa57e7def04ce2a9b49051f395c32b1393c14`, not silently replaced.

Official model documentation was checked during this session; plan section 8 links
the sources and distinguishes API context from this desktop session's capacity.
Tests establish software compatibility only, not scholarship factual currency.

Independent review must assess an immutable committed candidate, identify severity
and scope, and preserve the reviewer result in independent-review.md. This is a
prospective proposal review; no canonical stage manifest is created or rebound.

## Proposal review remediation

The first immutable proposal candidate was
`e7efffa72b71ea96d9ae1cf7347848c7f37980ad`. Fresh read-only reviewer plan_review
identified two medium findings and a low spacing typo, with no critical/high
findings. Author-owned remediation updates only the proposal text: default
14-day coverage now explicitly includes every in-scope non-open record; explicit
exclusions retain evidence. Failed due checks retry once at the next daily wake
before the documented manual/blocked cadence. Source contradictions stay in Check first, whereas a
supported student mismatch may use Later. The kickoff batch-size spacing is fixed.
No runtime, data, authority or canonical acceptance bytes changed. Existing tests
need no repeat for these prose-only corrections; final diff/plan checks and fresh
recheck of the replacement immutable candidate are recorded in the review record.
