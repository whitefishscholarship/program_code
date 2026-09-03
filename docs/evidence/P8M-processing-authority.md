# P8M processing authority and resolved source boundary

Date: 2026-09-02
Stage: `P8M`
Repository baseline: `55245dc42a726d57ef3bdbeeab7aa27fcce31d17`

## Direct instruction

Kelsey authorized a read-only P8M proposal pass over all 197 populated rows in the
`Master Database` tab. Official-source acquisition is limited to nonblank URLs in
column A and legitimate first-party redirects from those URLs. Claude may propose
factual corrections and controlled sorting, filtering, and grouping tags, but remains
proposal-only: it may not write the spreadsheet or accept its own output. No cycle,
cycle-ID, or application-group field may be created. Missing or unavailable
information remains unknown and may not stop otherwise valid row processing. Codex
owns validation, full-denominator reconciliation, review packaging, and governed Git
delivery after acceptance. No spreadsheet write is authorized. P8F and P9 remain out
of scope.

The supplied human-review identity is the literal placeholder `[NAME]`. It is not a
named reviewer identity and cannot satisfy the fact-acceptance gate. This does not
block proposal generation or construction of the human-review package; it blocks all
fact acceptance, P8M acceptance, attestation, and delivery until a real reviewer is
identified and records decisions.

## Live resolution before processing

- Google Drive current revision: `225`; previous revision: `223`.
- Revision `225` modified: `2026-09-02T03:41:28.432Z`.
- Spreadsheet: `1Dp5AMnrfSQ-Xf-r03S75lKsGPJk7o0inOgvC9Q6lOl4`.
- Spreadsheet title: `Whitefish HS Scholarship Database`.
- Authorized tab: `Master Database`, gid `0`, grid `A1:X1060`.
- Authorized used range read: `'Master Database'!A1:O198`.
- Returned rows: one header plus 197 populated data rows.
- Row kinds: 176 `Scholarship`, 21 `Portal`, zero other.
- Column A header: `Last Updated`.
- Column A visible URLs: `0`.
- Column A native hyperlinks: `0`.
- Therefore the authorized external URL queue is exactly `0`; no external URL may be
  fetched or followed in this pass.
- Exact-name duplicate: `Montana Jaycee Foundation Scholarship`, rows 26 and 27. The
  row identities remain distinct and name alone may not resolve them.

No cell from another tab was requested. No Sheets or Drive mutation method was called.

## Claude execution envelope

- Input: `web/fixtures/p8m/master-database-rev225.json` only.
- Contract reference: `docs/evidence/PLAN-REV10-matching-fact-contract.json`, read-only.
- Prompt: `docs/evidence/P8M-claude-prompt-v1.md`.
- Batch size: 25 rows; final batch 22 rows; eight batches total.
- Tools: local file read only. Web, browser, shell, spreadsheet, write, edit, form,
  provider-contact, and application interaction tools are unavailable.
- CLI observed before execution: Claude Code `2.1.74`.
- Every returned item is a proposal. No reviewer or acceptance field exists in the
  proposal schema.

## Side-effect boundary

Spreadsheet writes: `0`. External URL reads: `0`. Redirects followed: `0`. Form or
application interactions: `0`. Provider contacts: `0`. Applicant-data operations: `0`.
P8F/P9 operations: `0`.

## Supplied artifact chronology

Kelsey later clarified that the pasted Claude narrative described the pre-review
figures, while the attached receipt and the nine files in
`/private/tmp/p8m-claude-output` are the post-review result. Codex therefore uses the
post-review written files and their recomputed hashes as the proposal-package authority;
the earlier narrative totals are retained only as chronology. This clarification does
not name the human fact reviewer and does not substitute for P8M's final independent
repository acceptance review.
