# P8M validation receipt

Generated 2026-09-06T19:55:12-06:00

## Output SHA-256

| File | SHA-256 |
|---|---|
| `P8M-human-review.csv` | `2f30b7c565abbf67f9ee4bcb2012c596c2cc445aae542b65aec58defaf433b7a` |
| `P8M-omitted-source-fields.csv` | `76433a0571bbcc3475707ef22a9df0a08f8b92858cdc84a298126340c275317f` |
| `P8M-human-review-Kelsey-completed.xlsx` | `9158d1698ce5822384890aa68019d8089d72c7cc0ddab19e5d731aaa6353ce50` |
| `P8M-review-digest.md` | `85960fd18068fdf7aed2aca7f7255189b8cd9e8f20b4c2df08c89ed212fbf4d8` |

## Source snapshot identity — VERIFIED

The companion file is built **exclusively** from the frozen revision-225 snapshot. No live-sheet read
was performed in this round and no live value was substituted.

| Property | Expected | Observed |
|---|---|---|
| Git blob | `68d38a2516db51b2326540665ae114da63913d91` | `68d38a2516db51b2326540665ae114da63913d91` ✓ |
| File size | 273646 bytes | 273646 bytes ✓ |
| SHA-256 | `cf898d6c…a9c4106` | `cf898d6cbb5bfb6d4d576fc77e4d1666f0f67ee3cb01ed7cd16ee7991a9c4106` ✓ |
| Source revision | 225 | `225` ✓ |
| Denominator | 197 rows, 2–198 | 197 rows, 2–198 ✓ |

Retrieved read-only from the local object database at
`~/Documents/Codex/2026-08-23/i-x20/work/program_code` via `git cat-file blob`. Snapshot metadata:
`'Master Database'!A1:O198`, captured `2026-09-02T23:12:04.760Z`, render `FORMATTED_VALUE`.

**Correction to the previous receipt:** it reported this snapshot as absent from the machine. That was
wrong. My search covered working trees, two repositories' logs, `~/Downloads` and `~/Projects`, but not
git object databases outside those paths — the blob was present all along, unchecked-out, in a
repository I never scanned. The blocker was an artefact of an insufficient search, not a missing file.

## Companion file — zero-difference proof

- Rows: **197**; columns: **10**, in the required order
- Row order 2–198 preserved — **True**
- **Cell differences vs the frozen snapshot: 0**

Every value is reproduced exactly, including trailing whitespace (rows 28 and 88), Unicode punctuation
(e.g. the en dash in row 191's amount), and mixed date formats present in the source itself (rows 172
and 173 carry ISO dates where neighbours carry US-style). JSON `null` — the snapshot's only empty form,
407 of 1379 mapped cells — is written as an empty CSV field, there being no null in CSV.

All 34 cells previously flagged as mismatched are now correct: `last_updated` on rows 9, 24, 33, 34,
38, 67, 164, 167, 172, 173; `source_name` exactness on rows 28 and 88; `last_updated` and `amount` on
rows 188–198.

## Governed CSV — unchanged, and re-verified

- Exact governed 31-column header preserved — **True**
- Data rows **197**, row_number 2–198 contiguous and unique — **True**
- Unique `source_row_id` values: **197**
- `reviewer_name` == "Kelsey Stuart" on every row — **True**
- Single `reviewed_at` — **True** (`2026-09-06T17:05:35-06:00`)
- `tag_decision`: **176 approve, 14 revise, 7 needs_more_evidence, 0 reject**
- `correction_decision`: **38 approve, 1 reject, 158 not_applicable**
- `not_applicable` ⇔ `correction_candidates_json == "[]"` — **True**

## Zero-mutation statement

Columns 0–26 compared cell-by-cell against the pre-decision baseline across all 197 rows.
**Differences: 0.** Only `reviewed_at`, `tag_decision`, `correction_decision` and
`human_rationale` were ever written. No row or column added, removed, or reordered.

`P8M-human-review.csv` and `P8M-human-review-Kelsey-completed.xlsx` are **byte-for-byte identical** to
the versions validated in the previous round (hashes above unchanged from that receipt).

**No spreadsheet write, no live-sheet read, no Git write, no P8F, no P9.** The snapshot was read from
the object database with `git cat-file`; nothing was committed, staged, or fetched. No fact was
accepted by Claude.

## Native hyperlink targets — UNAVAILABLE (unchanged, and corroborated by the snapshot)

- `application_link_method` holds a literal http(s) URL on **100 of 197** rows; **97** have none.
- `scholarship_location_information` is populated on **187** rows and contains **0** literal URLs.
- The snapshot's own `url_acquisition_boundary` records `native_hyperlink_count: 0`
  and `visible_url_count: 0` for the authorized input column (`Last Updated`),
  and `counts.column_a_urls: 0`.

The capture is `FORMATTED_VALUE`, which cannot expose hyperlink targets behind label text. These were
**not** inferred, discovered, or invented, and are reported as **unavailable** rather than as blank
eligibility facts. All 197 rows remain `official_verification_required` and
`source_queue_empty_by_column_a_boundary`; the 38 approved corrections remain recommendations, not
accepted facts.