# P8M — proposal reconciliation and human-review handoff

Status: `BLOCKED` before fact acceptance, P8M acceptance, attestation, or delivery

Observed through: `2026-09-03T01:48:20Z`

Baseline: `55245dc42a726d57ef3bdbeeab7aa27fcce31d17`

## Scope and authority

Kelsey authorized one read-only P8M proposal pass over all 197 populated rows in
`Master Database`. Official-source reads were limited to nonblank URLs already present
in column A plus legitimate first-party redirects. Column A is `Last Updated` and the
pinned data contains zero visible URLs and zero native hyperlinks, so the authorized
external-source queue was zero. Claude was proposal-only. No spreadsheet write, fact
acceptance, application/form entry, provider contact, other-tab cell read, P8F, or P9
operation was authorized or performed.

The literal value `[NAME]` is a placeholder, not a named human fact reviewer. It does
not block source pinning, proposal generation, Codex validation, or review-package
preparation. It does block every human decision, accepted fact, P8M acceptance,
candidate freeze, independent acceptance review, attestation, and Git/Vercel delivery.

The exact instruction and its resolved read boundary are recorded in
`docs/evidence/P8M-processing-authority.md`. The proposal instruction is
`docs/evidence/P8M-claude-prompt-v1.md`.

## Source pin and input package

- Spreadsheet revision: `225`; it had not changed before processing, so no re-pin was
  required.
- Used range: `'Master Database'!A1:O198`.
- Source snapshot:
  `web/fixtures/p8m/master-database-rev225.json`.
- Snapshot SHA-256:
  `cf898d6cbb5bfb6d4d576fc77e4d1666f0f67ee3cb01ed7cd16ee7991a9c4106`.
- Complete denominator: 197 source rows, comprising 176 `Scholarship` and 21 `Portal`
  rows.
- Input batching: seven 25-row batches and one 22-row batch, covering rows 2–198
  exactly once.
- Authorized external URL reads: 0.
- Spreadsheet writes: 0.

The source contains no cycle, cycle-ID, or application-group field. No such field was
created in the input, proposal, reconciliation, or human-review row schema.

## Claude artifact chronology

Kelsey supplied Claude's narrative summary and later clarified that it described the
pre-review state. Kelsey identified the attached receipt and the nine files in
`/private/tmp/p8m-claude-output` as the post-review result. The pre-review figures are
therefore chronology, not the digest authority for this package.

The repository copy of the post-review receipt is
`web/fixtures/p8m/claude-output/claude-run-receipt.json`, SHA-256
`1437a4db1c345d91b40466eeb2773db576245982834ff9b656cdc6a80500cb60`.
It is byte-identical to `/Users/kelseystuart/Downloads/clauderunreceipt.json`. The eight
post-review proposal files are preserved beside it. Their recomputed combined body
digest is
`75eebc9abd6d84d2e6e266b9c44255289c9c7cdb669c73caf85ed5cefe91024f`.

Claude Code `2.1.74` is recorded only as the version observed on `PATH`; the receipt
does not prove it was the executing harness binary. `claude-opus-5` is session-reported
model provenance, not independently authenticated model telemetry.

Kelsey's statement establishes that the supplied files are the post-review artifact
set. No separate signed or structured record identifying that proposal reviewer was
supplied. This proposal review is not the canonical fresh-context repository acceptance
review required after a complete immutable P8M candidate exists.

## Codex independent validation

`npm run p8m:proposal:check` re-derives validation from the written files. It checks all
197 rows, not a sample:

- the snapshot, eight inputs, eight outputs, receipt, output-body, and combined hashes;
- rows 2–198 exactly once, with 197 unique row numbers and source-row IDs;
- exact input-to-output name, type, and source-row identity binding;
- closed top-level, row, tag, correction, reason, and confidence schemas;
- sorted unique controlled arrays and mandatory zero-URL review reasons;
- duplicate-name markers only on rows 26 and 27;
- correction targets, different-cell evidence, and verbatim evidence excerpts;
- zero proposal-row URLs, email addresses, or phone numbers;
- zero prohibited cycle, cycle-ID, application-group, reviewer, or acceptance keys in
  proposal rows;
- zero external reads, spreadsheet reads/writes by Claude, matching facts, accepted
  facts, and reviewer decisions; and
- every receipt total recomputed from the written proposal rows.

`npm run p8m:proposal:test` accepts the pinned package and fails closed on 18
adversarial mutations, including truncation, duplication, identity changes, unknown
keys, invalid enums, unsorted tags, missing review reasons, fabricated correction
quotes, URLs, prohibited identity fields, hash changes, nonzero writes/acceptance, and
catalog-identity corruption.

This validation proves package integrity, controlled values, exact row coverage,
correction-excerpt grounding, and proposal-only isolation. It does not establish that a
scholarship statement is current or that any tag or correction is factually accepted.
The zero official-source queue means every row still requires human judgment.

## Post-review reconciliation

The authoritative machine record is
`docs/evidence/P8M-proposal-reconciliation.json`, SHA-256
`4d85c233a37b4de846e9a29d4ed6199780de4e3ca6549b670d85b9200bbf6150`.

| Measure | Recomputed result |
| --- | ---: |
| Expected / returned source rows | 197 / 197 |
| Scholarship / Portal rows | 176 / 21 |
| Unique row numbers / source-row IDs | 197 / 197 |
| Tag-only row outcomes | 158 |
| Tag-plus-correction row outcomes | 39 |
| Correction candidates | 40 |
| Row confidence | 138 high / 58 medium / 1 low |
| Ambiguity notes | 165 |
| Matching facts / accepted facts / reviewer decisions | 0 / 0 / 0 |

Correction candidates comprise 28 `In-State / National`, 10 `Due Date`, one
`Application Link/Method`, and one `Renewing/ Non-Renewing`. Their confidence totals
are 28 high and 12 medium. Manual-review reasons total 197
`official_verification_required`, 197 `source_queue_empty_by_column_a_boundary`, 77
`ambiguous_value`, 60 `internal_conflict`, 52 `missing_information`, 38
`unsupported_taxonomy`, and two `duplicate_name`.

## Stable target reconciliation

Every source row is also mapped to the accepted P7 catalog snapshot
`web/fixtures/p7/student-catalog.json`, SHA-256
`35d7836432747710e3515010e8548ceb20ef270a9896d1f1b14c7c91693e9841`.
The result is 176 unique award public IDs and 21 unique portal public IDs, with no
missing or duplicate target identity.

The duplicated `Montana Jaycee Foundation Scholarship` name is resolved by row content,
not name alone:

- source row 26 -> `award-e05338ef963f`, corroborated by amount, due date, geography,
  and 3.75 GPA;
- source row 27 -> `award-67de97a4f446`, corroborated by amount, due date, geography,
  and 3.25 GPA plus the trade/vocational school type.

Sixteen accepted-catalog child awards have no separate pinned source row. All 16 are
already related by accepted P7 source identities to source row 79's stable portal
`portal-9720c3c04489`. They remain a named child-award human-review queue; they are not
silently counted as additional source rows and no application-group field was created.

## Human-review package

The complete package is `docs/evidence/P8M-human-review.csv`, SHA-256
`ac376ad3dd3cca6ab0729fc7e0f607573cf867892838114c55cf7f0fc4f54596`.
It contains a header plus exactly 197 source-row records. Each record includes the
source fields needed to judge the proposal, stable award/portal mapping, controlled
tags, correction JSON, review reasons, ambiguity note, Claude confidence, and blank
human-decision fields.

The named reviewer must complete all 197 rows. `reviewer_name` and `reviewed_at` must
be nonblank and consistent. `tag_decision` must be one of `approve`, `reject`,
`revise`, or `needs_more_evidence`. `correction_decision` must use the same values, or
`not_applicable` only when the row has no correction candidate. `human_rationale` must
explain the decision, including rows 26/27, row 79's child-award queue, every conflict,
unknown, unsupported taxonomy item, correction, and sensitive tag.

CSV cells whose first effective character could be interpreted as a spreadsheet
formula are prefixed with an apostrophe during export. This protects the review package
without changing the pinned source snapshot or Claude proposal artifacts.

An approved correction remains a reviewed proposal only. This stage has no authority
to write it to the spreadsheet. An approved tag is not a matching fact and cannot hard
exclude a student. Any later normalized matching fact must separately satisfy
`matching-facts-v1`, official/organizer field authority, provenance, freshness, and
reviewer requirements.

## Verification

- `npm run p8m:proposal:write`: PASS; regenerated the reconciliation and review
  package from the preserved source and post-review artifacts.
- `npm run p8m:proposal:check`: PASS; all 197 outcomes and all recorded hashes and
  totals independently recomputed.
- `npm run p8m:proposal:test`: PASS; baseline plus 18 fail-closed adversarial
  mutations.
- `npm run plan:check`: PASS; 13 ordered stage contracts and the current transition.
- `npm run typecheck`: PASS.
- `npm test`: PASS.
- `npm run build`: an earlier exact run passed before the final review-export
  hardening. The current-tree rerun reached Next.js 16.3.3 and then hit the execution
  environment's Turbopack local-port `EPERM`, both restricted and permitted.
- `npm run build -- --webpack`: PASS on the current tree in the permitted context.
  Existing middleware-deprecation and Edge-runtime compatibility warnings remain; they
  are not P8M data-integrity failures.
- `git diff --check`: PASS.

## Stop state and remaining gates

P8M is preserved as `blocked-external` on baseline
`55245dc42a726d57ef3bdbeeab7aa27fcce31d17` with the validated row package intact.
The only P8M acceptance blocker is
`P8M-acceptance-awaits-named-human-fact-reviewer`.

After a real reviewer is named and returns complete decisions, Codex must validate the
decision file, reconcile every decision, create any schema-valid accepted publication,
run the full required matrix, freeze a candidate, and obtain the separate fresh-context
read-only C0/H0 repository review. Only then may manifest/attestation and the already
authorized Git/Vercel delivery occur. No spreadsheet write is part of that path.

Stop before P8F and P9.
