# Plan Revision 12 evidence — row-source correction and incomplete-fact progress

Date: 2026-09-02

## Authority and correction

Kelsey first authorized P8M against spreadsheet
`1Dp5AMnrfSQ-Xf-r03S75lKsGPJk7o0inOgvC9Q6lOl4`, with official-source reads to be
bounded, Claude proposal-only, no spreadsheet writes, and governed Git delivery plus
resulting Vercel Preview/Production verification authorized. Kelsey then authorized a
read-only source-pinning pass limited to spreadsheet metadata and `Master Database`.

After seeing the pinning result, Kelsey corrected the proposed source model: the
original source never had an application-group field or cycle/cycle-ID field; those
were introduced in later GPT iterations. Kelsey also explained that blanks commonly
mean information was unavailable during the earlier Claude scrape and directed the
process to continue safely when data is imperfect.

This is a material acceptance-contract correction, so it is recorded as Plan Revision
12 before P8M execution. It does not change the immutable Revision 10 matching-fact
contract. Instead, it separates source-row completeness from optional normalized facts.

## Verified live repository baseline

- Repository: `whitefishscholarship/program_code`; default branch `main`.
- `git fetch` and the GitHub API independently resolved live `main` to
  `57bb062d64f725fa6ce72709f81fe987dde3e2af`.
- Commit time: `2026-09-02T02:50:27-06:00`.
- Work is isolated on `codex/plan-rev12-row-source`; the user's older primary checkout
  and unrelated changes were not modified.

## Read-only source pin receipt

The authorized read used the connected Google Drive/Sheets service. Spreadsheet
metadata was read, then cells only from `Master Database`. Spreadsheet metadata may
enumerate tab properties; no cells from any other tab were requested or read. No
spreadsheet or Drive write operation was called.

| Field | Observed value |
| --- | --- |
| Spreadsheet ID | `1Dp5AMnrfSQ-Xf-r03S75lKsGPJk7o0inOgvC9Q6lOl4` |
| Spreadsheet title | `Whitefish HS Scholarship Database` |
| Source sheet | `Master Database` |
| gid / sheet ID | `0` |
| Sheet grid | `1060` rows × `24` columns (`A:X`) |
| Used range | `'Master Database'!A1:O198` |
| Header rows | `1` |
| Populated data rows | `197` |
| `Scholarship` rows | `176` |
| `Portal` rows | `21` |
| Other row labels | `0` |
| Unique nonblank Scholarship names | `175` |
| Exact-name duplicate groups | `1` |
| Scholarship rows with observed due date | `171` |
| Scholarship rows without observed due date | `5` |
| Drive revision | `225` |
| Previous listed Drive revision | `223` |
| Revision modified time | `2026-09-02T03:41:28.432Z` |
| File modified time | `2026-09-02T03:41:28.518Z` |

The Drive revision was checked again after the reads; the revision remained `225`.
There were zero spreadsheet writes.

## Correct denominator and progress contract

- Source denominator: all 197 populated rows in the pinned used range.
- Typed subsets: 176 rows explicitly labeled `Scholarship`; 21 explicitly labeled
  `Portal`.
- `176` is a labeled-row count, not proof of 176 unique stable awards. The exact-name
  duplicate must be resolved without relying on name alone.
- Cycle denominator: not a source field and not required.
- Application-group denominator: not a source field and not required.
- Each source row requires exactly one deterministic row-ledger outcome.
- A row does not require every possible matching fact. Blank, inaccessible,
  unsupported, ambiguous, or otherwise unavailable information remains `unknown` or
  manual review. It does not become false or stop valid work on other facts and rows.
- Complete means no row is silently lost. It does not mean every cell or normalized
  fact is populated.

## Remaining phased P8M gates

Revision 12 removes only the satisfied or incorrect entry blockers. The following
remain explicit:

1. Before any external source read or Claude processing: exact URL-bearing source
   columns, official-source allowlist, and bounded Claude processing instruction.
2. Before any fact acceptance or P8M acceptance: the named human fact reviewer.

No spreadsheet write is authorized. P8F and P9 remain unstarted and prohibited.

## Governance-only change boundary

Revision 12 may change exactly these fifteen candidate paths:

1. `AGENTS.md`
2. `docs/BUILD_STATE.json`
3. `docs/CURRENT_HANDOFF.md`
4. `docs/DECISIONS.md`
5. `docs/SCHOLARSHIP_SYSTEM_BUILD_PLAN.md`
6. `docs/evidence/PLAN-REV12.md`
7. `docs/kickoffs/P8M-MATCHING-FACT-ENRICHMENT.md`
8. `docs/kickoffs/PLAN-REV12-ROW-SOURCE-CORRECTION.md`
9. `web/package.json`
10. `web/scripts/plan-rev10-lifecycle.ts`
11. `web/scripts/plan-rev12-row-source.ts`
12. `web/scripts/test-plan-rev10-governance.ts`
13. `web/scripts/test-plan-rev11-late-delivery.ts`
14. `web/scripts/test-plan-rev12-row-source.ts`
15. `web/scripts/validate-build-plan.ts`

No product, scholarship data, runtime, workflow, deployment configuration, accepted
historical evidence, or frozen matching-contract file may change.

## Test-first evidence

- `npm ci`: PASS; 462 packages installed and lockfile unchanged. NPM reported two
  moderate dependency advisories; no automatic mutation was applied.
- The ordinary `tsx` command was environment-blocked before test execution by
  `listen EPERM` on its local IPC socket.
- `node --import tsx scripts/test-plan-rev12-row-source.ts`: expected RED before the
  amendment existed, failing exactly at `PLAN-REV12 amendment record is required`.

## Pre-freeze verification matrix

Completed by `2026-09-02T22:17:20Z` against the isolated Revision 12 worktree:

| Command | Result |
| --- | --- |
| `npm ci` | PASS; 462 packages installed; lockfile unchanged. |
| `node --import tsx scripts/test-plan-rev12-row-source.ts` | PASS; exact pin, row completeness, unknown blanks, no invented denominators, and no-write mutations all enforced. |
| `npm run typecheck` | PASS. |
| `npm test` | PASS outside the restricted sandbox; complete suite passed, including Revision 10, Revision 11, Revision 12, P9 safety, P2-P8, and P8R checks. The earlier run exposed and led to correction of the expected later-revision assertions in the Revision 10/11 tests. |
| `npm run build` | PASS outside the restricted sandbox; exact default Next.js 16.3.3 Turbopack production build compiled, typechecked, generated 10/10 static pages, and emitted only the existing middleware deprecation warning. |
| `npm run plan:check` | Expected pre-attestation negative only: missing Revision 12 manifest, missing Revision 12 review, and missing committed direct-child attestation. No content, lifecycle, scope, authority, or historical-integrity error. |
| `git diff --check` | PASS. |
| Candidate path reconciliation | PASS; exactly 15 paths, matching the machine allowlist. |
| `npm audit --audit-level=low` | FAIL; two moderate advisories, no critical/high: `@humanfs/node@0.16.7` through development-only `eslint@9.39.2`, and `qs@6.15.3` through production dependency `googleapis@176.0.0` / `googleapis-common@8.0.1`. |
| `npm audit --omit=dev --audit-level=low` | FAIL; one moderate advisory in `qs@6.15.3`; no critical/high. |
| `npm ls @humanfs/node qs --all` | PASS; exact dependency paths above reproduced. |

The moderate dependency advisories pre-exist the governance-only candidate and do not
touch the corrected source contract. They remain open, owned by Codex for a separately
scoped dependency-maintenance proposal after the current governed stage; no automatic
upgrade or lockfile mutation is authorized inside Revision 12. The independent reviewer
must assess whether that disposition is sufficient.

The candidate SHA, manifest digest, independent review, and direct-child attestation
are recorded only after the implementation stabilizes.

## External-effect receipt

The source-pinning pass made read-only metadata and `Master Database` cell requests.
Revision 12 preparation made no further spreadsheet/Drive read and no public URL or
Claude request. Across the amendment there were zero spreadsheet writes, data or
product mutations, runtime/workflow/deployment-configuration changes, monitoring
activation, applicant-data operations, form submissions, or provider contacts.
