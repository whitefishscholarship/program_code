# Plan Revision 9 Evidence — Former Interview Detail Governance

Date: 2026-09-01
Stage: `PLAN-REV9`
Baseline: `f118b85dc0e10cc3841d172d2d4091f618454970`
Status: candidate evidence complete; immutable acceptance review and attestation pending

## Objective and authority

The user directed Codex to continue the former-interview restoration follow-up from
exact local commit `128c3e5136daae6b6ca40349db18324567bb19ee`, complete the authoritative
read order, inspect the pinned historical files and complete Git history, govern and
deliver the required plan amendment/new stage before changing product code, preserve a
complete inventory, leave an exact implementation kickoff, and not begin P9.

The instruction included the repository operating contract that states branch/PR
revisions have historically caused Vercel Preview deployments and `main` revisions have
caused Production deployments. The user's explicit direction to govern and deliver the
amendment therefore authorizes Plan Revision 9's branch push, pull request, merge, and
resulting Preview and Production deployment effects. The same instruction directly
orders the later former-interview restoration under the detailed safety conditions in
this amendment and authorizes P8F's ordinary governed Git delivery and resulting Vercel
effects only after Revision 9 is accepted and delivered.

This authority excludes every spreadsheet read or write, P9 or `P9-IDENTITY-PINS`,
production-source access or configuration, deployment-configuration changes, P8
monitoring activation, form/application interaction, applicant-data collection,
interview-answer persistence or transmission, analytics, provider contact, paid or
destructive action, acceptance-gate weakening, force-push/history rewriting, and any
scope beyond the former-interview detail restoration.

## Observed baseline and history

- The requested branch/commit was clean and exact. It descends from locally tracked
  `origin/main` `f118b85dc0e10cc3841d172d2d4091f618454970` by one documentation-only
  follow-up commit.
- Initial SSH Git transport returned `Repository not found`. After secure browser
  authentication as `whitefishscholarship`, `gh auth setup-git`, and a command-scoped
  HTTPS override using the keyring-backed credential helper, normal `git fetch origin`
  succeeded without changing the saved remote or exposing a token. GitHub API, fetched
  `origin/main`, and the local tracking ref all resolved to exact `f118b85...`.
- `docs/evidence/PLAN-REV9-interview-inventory.md` records the complete 197-commit
  history search and exact pinned blobs. It proves that `f63e550...` was the last
  detailed-question configuration change, `4c20637...` was the last active route, and
  direct child `a2567d6...` removed that route.
- The former UI displayed one ADHD question, not separate ADHD and ADD questions. The
  exact identifier was `adhd`; its tooltip spelled out Attention-Deficit/Hyperactivity
  Disorder. No rendered `ADD` label or identifier exists in the reachable history.
- The former route displayed 6 academic questions, 4 activity/responsibility
  checkboxes, 1 conditional volunteer-hours question, 1 financial-need checkbox, and
  38 grouped special criteria. Eight additional answer-map fields existed only in
  TypeScript types and were not displayed.
- An earlier active configuration also displayed one standalone six-option
  `organization_affiliations` question. The final configuration migrated those six
  concepts into the 38 special criteria; Revision 9 preserves the exact mapping and
  forbids duplicate restored controls.
- Historical text filters and scoring are intent evidence only. Several directly
  contradict accepted P8R controls, including default-Montana exclusion,
  `Non-Renewing` substring classification, free-text affiliation gates, arbitrary
  amount/portal/criteria points, the earlier `New for 2026!` +5 boost, and
  session-stored matched legacy rows.

## Revision 9 controls

Revision 9:

- inserts planned P8F after accepted P8R and before planned P9;
- makes P8F the sole next-permitted stage while keeping P9 planned and unstarted;
- binds the complete historical question/rule/result/export inventory and its explicit
  retained/safely-replaced/retired dispositions;
- requires a P8F test matrix and exact old-ID-to-new-control/rule map to be committed
  before product implementation;
- distinguishes rendered former questions from TypeScript-only fields and forbids
  representing ADD as a separate recovered question;
- preserves accepted P7 catalog/cards/filter/sort/export/count/relationship behavior,
  P8's disabled schedule, and P8R's volatile-answer privacy and conservative
  match/possible/conflict semantics;
- requires every hard conflict to cite an award-bound, field-specific accepted public
  fact plus an explicit contradictory typed answer;
- treats missing, ambiguous, free-text-only, manual-review, provenance-free, unanswered,
  and prefer-not-to-answer states as non-excluding;
- requires sensitive identity, health, hardship, demographic, affiliation, and employer
  controls to be optional; nonselection is never a negative fact;
- prohibits importing or reconnecting the historical `processor.ts` or `rulesPack.ts`
  as matching truth, restoring the old matched-row session payload, or replacing the
  accepted canonical catalog with legacy `{data}` rows;
- requires deterministic reason-coded ordering instead of legacy points, with the
  current accepted P7 sort and stable award ID as explicit tie-breakers;
- preserves every Revision 7/8 production no-write, identity, evidence, and trusted-
  workflow gate while advancing the dormant P9 trusted-proof compatibility anchor only
  for the exact Revision 9 governance change; and
- carries live scholarship freshness and application-health smoke as explicit unknown
  evidence rather than inferred passes; private Git transport was directly restored and
  verified before freeze.

## Candidate paths

The Revision 9 candidate is limited to governance, the historical inventory, evidence,
kickoffs/handoff, validator/lifecycle/trusted-proof compatibility, and deterministic
tests. It contains no student-facing runtime implementation, dependency or lockfile
change, deployment configuration, workflow dispatch, spreadsheet/data operation,
monitoring activation, form/application interaction, applicant data, or P9 work.

## Verification record

The stabilized pre-freeze command ledger uses exact UTC start/end timestamps:

| UTC interval | Exact command | Exact result |
| --- | --- | --- |
| `2026-09-02T01:08:54.346Z`–`01:09:00.379Z` | `npm ci` | PASS; 462 packages installed, 463 audited, 0 vulnerabilities; lockfile unchanged. |
| `2026-09-02T01:09:26.242Z`–`01:09:27.211Z` | `node --import tsx scripts/test-plan-rev9-interview-inventory.ts` | PASS; `pinnedBlobs=7 criteria=38 earlierAffiliations=6 typeOnly=8`. |
| `2026-09-02T01:09:26.242Z`–`01:09:27.255Z` | `node --import tsx scripts/p5-remediation.ts --check && node --import tsx scripts/test-p5-remediation.ts` | PASS; records `197`, sources `213`, form/login boundary enforced. |
| `2026-09-02T01:09:26.242Z`–`01:09:27.330Z` | `npm run p9:trusted-proof:self-test` | PASS; dormant compatibility self-test only; no P9 workflow or production operation ran. |
| `2026-09-02T01:09:26.242Z`–`01:09:33.540Z` | `npm run typecheck` | PASS. |
| `2026-09-02T01:10:10.510Z`–`01:10:53.742Z` | `npm test` | PASS outside the restricted sandbox; all P0-P8R suites including the Revision 9 pinned-source test passed. |
| `2026-09-02T01:09:26.242Z`–`01:09:43.772Z` | `node --import tsx scripts/validate-build-plan.ts` | Expected nonzero result with exactly three gates: missing `PLAN-REV9` manifest, review, and committed attestation; no other error. |
| `2026-09-02T01:10:57.919Z`–`01:11:00.856Z` | `npm run build` | Environment-blocked in Turbopack PostCSS worker: local-port binding `Operation not permitted`; not a pass. |
| `2026-09-02T01:11:05.039Z`–`01:11:29.932Z` | `npm run build -- --webpack` | PASS; supported Next production build compiled, typechecked, generated 10/10 static pages, and emitted the existing middleware-deprecation warning. |
| `2026-09-02T01:09:26.242Z`–`01:09:31.010Z` | `npm audit --audit-level=low` | PASS; 0 vulnerabilities. |
| `2026-09-02T01:09:26.242Z`–`01:09:32.521Z` | `npm audit --omit=dev --audit-level=low` | PASS; 0 vulnerabilities. |
| `2026-09-02T01:09:26.242Z`–`01:09:26.686Z` | `ruby -e 'require "psych"; Dir[".github/workflows/*.{yml,yaml}"].sort.each { |f| Psych.parse_file(f); puts "YAML PASS #{f}" }'` | PASS for `.github/workflows/ci.yml` and `.github/workflows/p9-evidence.yml`; neither workflow changed. |
| `2026-09-02T01:09:26.242Z`–`01:09:26.686Z` | `git diff --name-status f118b85dc0e10cc3841d172d2d4091f618454970` | PASS; exactly 15 paths, limited to governance, evidence, handoff/kickoff, validator/compatibility, package-script, and tests. |
| `2026-09-02T01:09:26.242Z`–`01:09:26.689Z` | `git diff --check f118b85dc0e10cc3841d172d2d4091f618454970` | PASS; no output. |
| `2026-09-02T01:09:26.242Z`–`01:09:26.692Z` | `git diff --cached --check` | PASS; no output. |
| `2026-09-02T01:09:26.242Z`–`01:09:26.710Z` | `git diff --check` | PASS; no output. |
| `2026-09-02T01:09:26.242Z`–`01:09:27.554Z` | `gh api repos/whitefishscholarship/program_code/commits/main --jq .sha` | PASS; `f118b85dc0e10cc3841d172d2d4091f618454970`. |
| `2026-09-02T01:09:26.242Z`–`01:09:33.277Z` | `git -c url.https://github.com/.insteadOf=git@github.com: fetch origin` | PASS; keyring-backed scoped HTTPS, saved remote unchanged, no credential exposed. |
| `2026-09-02T01:11:38.868Z`–`01:11:38.964Z` | `git rev-parse origin/main` | PASS; `f118b85dc0e10cc3841d172d2d4091f618454970`. |

The `tsx` CLI wrapper had earlier hit the known restricted-sandbox IPC `listen EPERM`;
the exact full `npm test` command passed outside that restriction, while focused tests
also passed through the repository-supported `node --import tsx` path. The inventory
test reads the pinned `dda6e2ab`, `f63e550`, `c97f35a`, and `4c20637` Git objects rather
than trusting only the inventory prose. The 15-path enumeration contains no product
runtime, lockfile, data, workflow, or deployment-configuration change.

Fresh-context pre-freeze review was read-only and used an agent that authored no bytes.
The first pass reported C0/H1/M1/L1; remediation added the missing earlier affiliation
configuration and source-backed test. The second reported C0/H0/M1/L0; remediation
corrected the `is_new` removal chronology. A source/history/governance recheck reported
`PASS C0/H0/M0/L0`. A later evidence-byte check reported C0/H0/M2/L0 for the stale Git
unknown and missing exact ledger; both were remediated above. The exact resulting bytes
require one final no-edit pre-freeze recheck before freeze. None of these is the final
immutable-candidate acceptance review recorded in `docs/reviews/PLAN-REV9.json`.

Green checks do not establish scholarship freshness, the default Turbopack build path,
or protected application health.

## Stop boundary

Do not begin P8F until this amendment is independently accepted, direct-child attested,
merged, and verified on live `origin/main`. Do not begin P9, access any spreadsheet or
provider, dispatch the dormant P9 workflow, or change deployment configuration during
Revision 9.
