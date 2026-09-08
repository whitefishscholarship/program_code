# P8F Evidence — Former Interview Detail and Routing Restoration

Status: verified implementation candidate; fresh independent review and direct-child
attestation pending

## Scope and baseline

- Stage: P8F only. P9 and `P9-IDENTITY-PINS` were not started.
- Authenticated live fetch pinned `origin/main` and the P8F baseline to
  `d2e282a3004d79d7b597c58f84ed2b9c8e8eb797`.
- The baseline descends from handoff-closeout merge `d2e282a...`, P8M merge
  `5dab929d215e8a4b956946698d066998552c96af`, and P8M direct-child attestation
  `d55ae325cd1783aee175120eea0577e7dcff4d2c`.
- Work is isolated on `codex/p8f-former-interview-detail` at
  `/private/tmp/program_code-p8f`. The primary checkout and unpublished local
  `codex/p8m-session-closeout` branch were not changed or published.
- Historical snapshot `4c20637a351d272788e24ac9d02e541494644832`, all seven
  Revision 9 pinned blobs, and all four earlier affiliation blobs were reverified.
- `docs/evidence/P8F-question-rule-map.json` and
  `docs/evidence/P8F-test-matrix.json` were committed before product code in
  `84ef59209ea5cc61738a7651d8016d6a34d56e1e`.

## Working interview outcome

The primary student path now presents four accessible parts containing the complete
former displayed inventory: six academic prompts, four activity/responsibility
checkboxes, one conditional volunteer-hours prompt, one financial-need checkbox, and
all 38 final special criteria. The one historical ADHD control retains its expanded
meaning; no ADD control exists. The earlier six-option standalone organization control
is represented only by its exact migration map to the final six controls and is not
rendered. Eight TypeScript-only fields remain excluded.

Required GPA, residence, educational status, and target-school-type answers are typed
and validated. Sensitive fields are optional. “Prefer not to answer” clears and
disables sensitive selections; unchecked and skipped states are unknown, never negative.
Volunteer hours appear only while community service is selected and are cleared when it
is removed. Back and edit preserve only the current in-memory state; reset and reload
clear it.

The runtime pins P8M publication `matching-facts-v1` taxonomy `1.0.0`, source revision
`225`, SHA-256
`16db9f32a14c7b63d2a912a84c43ac973ae43a07d7c40841174d6fbdfd5a6b07`.
It contains zero accepted matching facts. The production outcome is therefore exactly
zero structured matches, 192 possible matches, and zero known conflicts. The page says
the answers had no current effect and that all 192 awards remain possible. Divergent
answer sets produce the same decision counts and match order.

Synthetic test-only authority exercises 51 exact question/rule gates. A hard conflict
requires an explicit contradictory typed answer plus an accepted rule bound to the
exact award and criterion. Positive sensitive nonselection stays possible. Career,
athletic, and application-format preferences can alter order without changing
eligibility. Invalid authority, award identity, and criterion bindings fail closed.

## Preserved product routes

Accepted award cards, decision reasons, counts, source/application relationships,
search, cycle/application/school filters, current sorts with stable-ID ties, official
links, browse-all awards/portals/sources, empty/error recovery, and visible-result CSV
export remain on page. The accepted 192-award / 217-source / 21-portal graph and its
four application groups and 192 cycles reconcile exactly. API public fields, legacy
`{data}` compatibility, and administrator routes are unchanged.

The only governance-code change is a narrow lifecycle-validator correction required to
allow the already-defined P8F stage to move from planned to in-flight and then accepted
after P8M. It adds regression coverage for P8F-next, P8F-active, and post-P8F/P9-next
positions. It does not revise the plan, authority, stage order, or any data boundary.

## Privacy proof

`docs/evidence/P8F-privacy.json` binds static and browser checks. Answers remain only in
React state; matching is synchronous. The catalog client remains answer-independent and
GET-only. Assertions reject answer/decision/matched-row storage, cookies, IndexedDB,
request bodies, URL/history mutation, logging, analytics, legacy matcher imports, and
answer-bearing exports. No answer values or detailed decisions are present in evidence,
screenshots, fixtures, or Git.

## Browser evidence

`docs/evidence/P8F-browser.json` records 30/30 passing declared cells:

- 360x800: 10/10;
- 768x1024: 10/10; and
- 1440x900: 10/10.

Every viewport covered required validation, all exact question counts, conditional
volunteering, sensitive skip/clear, affiliation migration without duplication, zero-fact
production results, synthetic accepted-fact decisions, filters/sorts/links/export,
browse-all counts, error retry, reset/reload, edit preservation, focus transitions,
progress semantics, console errors, and horizontal overflow. The first mobile pass found
a source-card overflow; it was corrected and the complete 360x800 route then passed.

## Verification record

Verification on 2026-09-08 included:

- `npm ci`: locked 462-package installation completed; two moderate advisories;
- `npm run p8f:preimplementation:test`: PASS with 6 academic, 4 activity, 1
  volunteer, 1 financial, 38 criteria, 6 affiliation migrations, 8 exclusions, 30 rule
  dispositions, 30 browser cells, and zero accepted facts;
- `npm run p8f:test`: PASS with all 192 awards retained and 51 synthetic rule gates;
- `npm run p8r:test`: PASS after extending the typed answer model;
- `npm run typecheck`: PASS;
- complete `npm test`: PASS after updating the P8R source assertion for the exact
  refactored matrix binding;
- `node --import tsx scripts/validate-build-plan.ts`: PASS in verified state;
- `npm run build -- --webpack`: PASS including TypeScript, static generation, and all
  student/admin/API routes;
- `npm audit --audit-level=high`: zero critical/high, two moderate advisories;
- `npm audit --omit=dev --audit-level=high`: zero critical/high, one moderate advisory;
- `git diff --check`: PASS; and
- browser matrix: 30/30 PASS.

The exact default `npm run build` reached Next.js compilation but the restricted local
runner denied Turbopack's internal worker port. The same production build completed via
Next.js webpack. Exact default PR and main CI remain required delivery checks. The build
also retained the existing middleware-convention warning; no dependency, lockfile,
middleware, CI, or deployment configuration was changed.

These checks prove repository behavior and local rendering. They do not prove current
scholarship facts or application health behind protected Vercel routing.

## Boundaries and remaining triggered items

- No spreadsheet, external scholarship source, form/application, applicant data,
  provider contact, analytics, paid action, deployment configuration, monitoring
  schedule, accepted fact, or P9 work occurred.
- Approved P8M data corrections and all `official_verification_required` outcomes remain
  proposals only, pending separate exact source-read or bounded spreadsheet-write
  authority.
- Preview author-access protection and Production SSO remain separate from P8F. Do not
  change Vercel access or configuration. Deployment completion is not application-health
  evidence; inaccessible smoke remains unknown.
- The two overall / one production moderate advisories, GitHub Actions Node-runtime
  warning, and prunable historical worktrees remain separately triggered maintenance.
- P9 remains planned, unstarted, and blocked by
  `P9-awaits-direct-immutable-publication-runtime-target-deployment-authority`.

## Acceptance boundary

This implementation is verified but not yet accepted. Freeze the exact candidate,
obtain fresh-context read-only C0/H0 review, incorporate any remediation only in a new
candidate followed by reviewer recheck, then add exactly `docs/evidence/P8F-manifest.json`
and `docs/reviews/P8F.json` in the candidate's direct child. The attestation must remain
the branch tip until delivery under the existing P8F authority.
