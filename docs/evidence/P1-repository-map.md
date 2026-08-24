# P1 Repository Behavior Map

Status: observed static inventory
Baseline: `d374247156e3ed15d19c037473da8f76ceedb6ab`
Observed: 2026-08-24

This map describes code present at the P1 baseline. It is not runtime proof and P1
does not change any of the mapped product paths.

## Ingestion and acquisition

- `web/src/lib/extract.ts:136-167` distinguishes direct PDFs from HTML, fetches
  public content, and enumerates same-page anchors. `extractScholarships` at
  `web/src/lib/extract.ts:170-220` sends captured text to Gemini, retries boundedly,
  and grounds returned fields against that text.
- `web/scripts/ingest-batch.ts:16-24` targets the configured sheet's Scraped Data,
  Master Database, and Ingestion Staging tabs. It processes 18 candidate pages per
  invocation and keeps at most 10 scholarships per page.
- `web/scripts/ingest-batch.ts:46-75` uses the Sheets values API, chooses a plain-text
  application URL, excludes rows labeled as portals, and deduplicates candidates by
  host plus path. Query and fragment identity is therefore not retained in candidate
  selection.
- `web/scripts/ingest-batch.ts:92-180` reads the source, extracts/grounds awards,
  marks dynamic portals for human review, and records when the 10-award page cap drops
  additional results. The cap is visible but the omitted awards are not a resumable
  queue.
- `web/scripts/crawl-directory.ts:13-20` defaults to 15 child links.
  `web/scripts/crawl-directory.ts:48-88` normalizes then caps children, keeps at most
  10 awards per child, and logs omitted counts. `web/scripts/crawl-directory.ts:90-96`
  appends the retained rows to Ingestion Staging.

## Audit and verification

- `web/scripts/audit-live.ts:56-68` uses a read-only Sheets scope but reads plain
  values with `spreadsheets.values.get`. `web/scripts/audit-live.ts:89-115` evaluates
  relevance, audience, amount, summary, and application text, then extracts URLs from
  the plain application value. It does not request CellData hyperlinks, so labeled
  application links can be missed.
- `web/src/lib/grounding.ts:440-445` normalizes URL comparisons to lower-case host and
  path and removes every query and fragment. Parameters such as `page`, `urlkey`,
  `sys_id`, filters, and anchors can therefore collide even when they identify
  different content.
- Existing focused suites are orchestrated by `web/package.json:14-15`; the P1
  deterministic inventory test is appended without changing application behavior.

## Spreadsheet writes

- `web/scripts/ingest-batch.ts:215-268` pushes only staging rows marked NEW, checks
  duplicate names, maps against the live header, appends to Master Database, and
  updates staging status. This is a write path and was not invoked in P1.
- `web/src/app/api/admin/push/route.ts:20-39` loads write-scoped Sheets credentials.
  `web/src/app/api/admin/push/route.ts:43-95` validates the target header, checks
  duplicate names, and appends rows. This route was statically inspected only.
- `web/src/lib/pushMapping.ts:10-40` defines the 15 student-facing columns and known
  forbidden staff/PII columns. `web/src/lib/pushMapping.ts:65-99` neutralizes formulas
  and maps only recognized headers. `web/src/lib/pushMapping.ts:101-132` rejects
  missing, forbidden, or unexpected columns.

## Student API and display

- `web/src/app/api/scholarships/route.ts:9-66` authenticates with a read-only scope and
  requests `formattedValue` plus CellData `hyperlink`. `web/src/app/api/scholarships/route.ts:72-78`
  falls back to the first tab if no title contains `Master Database`; that fallback is
  an observed static risk, not a P1 runtime finding.
- `web/src/app/api/scholarships/route.ts:85-128` applies the student-header allow-list
  and exposes hyperlinks through synthetic `_url` fields.
- `web/src/lib/browse.ts:69-88` prefers the application hyperlink, then information
  and name hyperlinks, then visible URLs. `web/src/lib/browse.ts:107-120` requires a
  minimally populated named row and hides parsed past deadlines.
- `web/src/components/ScholarshipBrowser.tsx:41-98` fetches the API, constructs browse
  items, and applies search, audience, school-type, renewal, and deadline filters.
  `web/src/components/ScholarshipBrowser.tsx:247-284` renders one card per returned row
  and links its Apply action to the resolved URL.

## Tests, build, CI, and deployment

- `web/package.json:5-15` defines build, plan validation, P1 capture/inventory,
  typecheck, and test commands. P1 adds tooling and a test only; it does not add a
  runtime dependency.
- `.github/workflows/ci.yml:5-37` runs on pull requests and pushes to `main`, checks out
  full history, installs with `npm ci`, then runs plan validation, typecheck, tests,
  and a production build using placeholder data configuration.
- `.github/workflows/ci.yml:3-4` states that `main` auto-deploys to production.
  `web/src/app/api/health/route.ts:3-23` exposes the deployed Git/Vercel build stamp.
  P1 made no CI or deployment-configuration change and no delivery action occurred.

## Evidence boundaries and unknowns

- Static inspection proves the named code exists; it does not prove deployed runtime
  configuration, authentication, provider availability, or end-to-end behavior.
- The P1 live Sheet capture used CellData and is stronger evidence for its one bounded
  snapshot than the values-only audit path, but it does not make scholarship facts
  current.
- P1 records the existing caps and query/fragment collapse as inputs to P2/P3. It does
  not repair them because acquisition and model changes are outside P1.
