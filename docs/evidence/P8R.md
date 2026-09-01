# P8R Evidence — Student Interview and Matching Restoration

Status: replacement remediation after rejected first candidate; complete re-verification,
same-reviewer recheck, immutable freeze, and direct-child attestation pending

## Scope and baseline

- Stage: P8R only. P9 and `P9-IDENTITY-PINS` were not started.
- Baseline: `208a94b43a571109a1dac217b584e0e200ccd681`, the live GitHub `main`
  Revision 8 delivery-closure merge observed on 2026-09-01.
- Local `origin/main` matched that exact live GitHub identity. An authenticated normal
  Git fetch using the repository's scoped HTTPS transport also resolved that baseline;
  no credential or token was requested, exposed, or stored.
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
`StudentAward` model. A minimum-GPA, school-type, `closed`, or `unavailable` conflict can
create a known conflict only when an award-bound field-specific accepted-public-evidence
record exists and exactly matches the public award. Structured fields without that
authority remain possible matches with explicit verification reasons. Optional
application-method choices rank only where the same field-specific authority exists;
they never change eligibility. Free-text
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
- deterministic accepted-catalog outcome of zero matches, 192 possible matches, and zero
  known conflicts because the accepted P7 catalog has no field-specific accepted
  matching-authority records; and
- explicit synthetic-matrix outcome of two matches, four possible matches, and one known
  conflict using award-bound test-only authority, without recording answer values in
  evidence.

Focused adversarial tests reject the legacy `Non-Renewing` substring classification,
year-2001 deadline fallback, default-Montana exclusion, identity/health free-text hard
gates, missing/manual-review/provenance-free exclusion, unmodeled eligibility promoted
to match, unsupported legacy amount ranking, mismatched authority, response-field
expansion, catalog mutation, unstable ordering, answer-bearing exports, and legacy-
processor coupling.

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

`docs/evidence/P8R-browser.json` records a complete replacement run with 30/30 passing
declared visual cells. This supersedes the rejected first candidate's browser result:

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

The first candidate completed the matrix on 2026-09-01 through
`2026-09-01T21:27:06Z`:

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

Fresh-context reviewer `/root/p8r_fresh_review` rejected exact first candidate
`c9e8d20155fb5cbd3d87f422ae104a14b264c930` at `2026-09-01T21:42:33Z` with
`C0/H2/M1/L0`: legacy manual-review fields created hard exclusions, unmodeled
eligibility could become a match, and unsupported legacy amount values influenced
ranking. That candidate is permanently rejected and must never be attested or delivered.
The replacement requires exact award-bound field-specific accepted authority for every
hard exclusion and application-mode preference, leaves all unmodeled eligibility
possible, and removes amount ranking. Focused replacement tests, typecheck, and the
complete 30-cell replacement browser matrix pass.

Replacement re-verification completed through `2026-09-01T22:02:16Z`:

- `npm ci` reinstalled the locked 462-package tree and reported zero vulnerabilities;
- `npm run p8r:test` passed with all 192 accepted-catalog awards retained as possible,
  plus the explicit two-match/four-possible/one-conflict synthetic authority matrix;
- pre-attestation `npm run plan:check` reported exactly the two expected missing-
  attestation conditions: absent `docs/evidence/P8R-manifest.json` and no committed
  P8R manifest/review pair;
- `npm run typecheck` and the complete `npm test` suite passed;
- exact `npm run build` passed Next.js 16.3.3 Turbopack compilation, TypeScript, page
  generation, and every student/admin/API route;
- both full and production-only low-severity audits reported zero vulnerabilities;
- `git diff --check` passed; and
- the complete replacement browser matrix passed 30/30 cells, including separate
  missing-GPA and missing-school-type validation at every viewport.

The sandboxed `tsx` CLI attempt could not create its local IPC socket; the unchanged
command passed when run outside that sandbox restriction. Initial exact-build attempts
hit Turbopack's environment-only local worker port error. Moving the generated `.next`
cache out of the worktree and rerunning the same exact command outside the sandbox passed.
The build repeated the existing Next.js middleware-file deprecation warning; no
middleware, dependency, lockfile, or deployment configuration was changed.

The exact replacement focused/full/build/audit/whitespace matrix is complete.
`npm run plan:check` must pass after the accepted manifest and review are added by the
candidate's direct child. Any other failure blocks delivery.

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
