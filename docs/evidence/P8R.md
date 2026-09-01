# P8R Evidence — Student Interview and Matching Restoration

Status: prospective accepted-state candidate pending immutable freeze, fresh-context
review, and direct-child attestation

## Scope and baseline

- Stage: P8R only. P9 and `P9-IDENTITY-PINS` were not started.
- Baseline: `208a94b43a571109a1dac217b584e0e200ccd681`, the live GitHub `main`
  Revision 8 delivery-closure merge observed on 2026-09-01.
- Local `origin/main` matched that exact live GitHub API identity. Direct authenticated
  Git transport remained unavailable during the initial check and must be restored and
  reverified before any push; no credential or token was requested, exposed, or stored.
- Accepted P8 candidate `cc69d276c85f931499a23a5abde623bda321e0c0` and
  direct-child attestation `20eeb53c80fce4e79a689128918a12361233aa7b` remain in
  baseline history. Accepted Revision 8 candidate
  `0a48fe710b7513c551745967eeed73c355de2433` and direct-child attestation
  `5a6aeb24da8f845fb9f6176390a8d0630fa57ed4` also remain in history.
- Work is isolated on `codex/p8r-interview-restoration` at
  `/private/tmp/program_code-p8r`; the original checkout was not changed.
- The complete test matrix was committed before product implementation in
  `b580778`. The product/test implementation is anchored at `61bfc98`.

## Delivered behavior

The homepage now makes the guided interview the primary student path while keeping an
explicit browse-all alternative. Two accessible steps collect validated GPA and school
types plus optional application-method preferences. Answers live only in React
component state. Back and edit preserve the current in-memory values; reset and reload
clear them.

`web/src/lib/interviewMatcher.ts` is a pure typed matcher over the accepted P7
`StudentAward` model. A typed structured minimum-GPA or school-type conflict, or an
accepted `closed`/`unavailable` cycle state, can create a known conflict. Missing GPA or
school-type facts remain possible matches with explicit verification reasons. Optional
application-method choices rank only; they do not change eligibility. Free-text
residence, identity, health, hardship, affiliation, renewal, deadline, and application
language never become hard gates, and the P8R path does not import the legacy heuristic
processor.

The results page separates structured matches, possible matches, and known conflicts;
shows reasons on every card; and retains search, cycle/application/school filters,
deterministic sorting, official links, visible-result CSV export, browse-all award/
portal/source views, empty recovery, catalog-error retry, and administrator route
compatibility. The accepted P7 API and `{data}` compatibility payload are unchanged.

## Canonical reconciliation and matching evidence

`docs/evidence/P8R-matching.json` and `npm run p8r:test` reconcile:

- 192 awards, 217 sources, 21 portals, four application groups, and 192 cycles;
- zero active and 192 unknown cycles;
- minimum 71 historically observed recipient slots;
- all 192 awards returned once with zero duplicate or lost identities; and
- deterministic test outcome of 20 structured matches, 144 possible matches, and 28
  known conflicts without recording the synthetic test inputs in evidence.

Focused adversarial tests reject the legacy `Non-Renewing` substring classification,
year-2001 deadline fallback, default-Montana exclusion, identity/health free-text hard
gates, missing-fact exclusion, response-field expansion, catalog mutation, unstable
ordering, answer-bearing exports, and legacy-processor coupling.

These are deterministic repository tests. They do not prove that any scholarship fact
or current availability state is live or accurate.

## Privacy proof

`docs/evidence/P8R-privacy.json` binds the runtime and static privacy checks. The catalog
client is answer-independent and GET-only. The matcher is synchronous and pure. Source
assertions reject session/local storage, cookies, IndexedDB, request bodies, URL/history
mutation, logs, analytics, and answer-bearing export or public-result fields in the P8R
path. Browser tests prove reset and reload cannot reuse stale answer state.

No interview answer is recorded in evidence, screenshots, URLs, logs, analytics, or
Git runtime artifacts. Answer-free landing pages were inspected visually at all three
required sizes, but no screenshot is retained in repository evidence.

## Browser evidence

`docs/evidence/P8R-browser.json` records 30/30 passing declared visual cells:

- 360x800: 10/10;
- 768x1024: 10/10; and
- 1440x900: 10/10.

Each viewport covered primary interview and browse-all entry, required/optional
validation, back/edit/reset/reload, typed conflict and unknown preservation, visible
reasons and deterministic rank-only preference, zero-result recovery, matched filters/
sort/safe official links/visible-set export, award/portal/source browse regression,
recoverable catalog error, skip navigation, named controls, heading focus, live status,
and horizontal overflow. The deterministic browser catalog reconciled seven awards,
five portals, and 13 sources; the error retry restored the accepted 192-award catalog.

## Verification record

The matrix completed on 2026-09-01 through `2026-09-01T21:27:06Z`:

- `npm ci` installed the locked 462-package tree and reported zero vulnerabilities;
- `npm run p8r:test` passed 192-award matching, adversarial safety, privacy, matrix, and
  export assertions;
- pre-transition `npm run plan:check` passed all 11 ordered stage contracts and the
  current machine-state transition;
- `npm run typecheck` passed;
- complete `npm test` passed every P0-P8 regression plus P8R;
- exact `npm run build` passed Next.js 16.3.3 Turbopack compilation, TypeScript, page
  generation, and all student/admin/API routes;
- `npm audit --audit-level=low` and
  `npm audit --omit=dev --audit-level=low` each reported zero current advisory matches;
- `git diff --check` passed; and
- the declared browser matrix passed 30/30 cells.

The sandboxed `tsx` CLI attempt could not create its local IPC socket; the unchanged
command passed when run outside that sandbox restriction. The build repeated the
existing Next.js middleware-file deprecation warning; no middleware, dependency,
lockfile, or deployment configuration was changed.

After the prospective accepted-state, handoff, and evidence tree is complete, the exact
focused/full/build/audit/whitespace matrix must be rerun. `npm run plan:check` is expected
to report only the missing P8R manifest/review direct-child attestation until those two
accepted artifacts are added. Any other failure blocks freeze.

## Boundaries and unresolved items

No scholarship spreadsheet was read, written, configured, or discovered. No accepted
scholarship fact, P8 schedule, production source/configuration, deployment
configuration, form/application, applicant data, answer telemetry, provider contact,
paid/destructive action, or P9/P9-IDENTITY-PINS work occurred.

P8R has not yet been independently accepted, attested, pushed, merged, or deployment-
verified. Live scholarship freshness remains unknown. A successful build or later
deployment state will not substitute for application-health smoke; any unavailable
smoke must remain explicit.

## Prospective acceptance boundary

`docs/BUILD_STATE.json` prospectively marks P8R accepted on baseline `208a94b...`, with
no active stage and P9 next-permitted but planned/unstarted. That transition is not
accepted until the complete candidate is frozen, manifest-bound, accepted C0/H0 by a
fresh-context read-only reviewer with every medium/low finding dispositioned, and its
direct child adds exactly `docs/evidence/P8R-manifest.json` and
`docs/reviews/P8R.json`. The attestation must remain branch tip until merge. P9 still
requires its separate complete entry prerequisites, including the governed identity-pin
path; this stage grants no authority to begin either.
