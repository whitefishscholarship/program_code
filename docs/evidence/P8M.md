# P8M — human-reviewed reconciliation and immutable publication candidate

Status: `VERIFIED CANDIDATE`; fresh-context review, direct-child attestation, and
remote delivery remain required before canonical acceptance

Observed through: `2026-09-06`

Baseline: `55245dc42a726d57ef3bdbeeab7aa27fcce31d17`

## Scope and authority

Kelsey authorized one read-only P8M proposal pass over all 197 populated rows in
`Master Database`. Official-source reads were limited to nonblank URLs already present
in column A plus legitimate first-party redirects. Column A is `Last Updated` and the
pinned data contains zero visible URLs and zero native hyperlinks, so the authorized
external-source queue was zero. Claude was proposal-only. No spreadsheet write, fact
acceptance, application/form entry, provider contact, other-tab cell read, P8F, or P9
operation was authorized or performed.

Kelsey clarified at `2026-09-03T02:48:16Z` that she is the human reviewer and has now
completed all 197 row decisions. The result is reconciled below. It accepts zero
matching facts because official verification remained unavailable; reviewed controlled
tags are isolated to sorting, filtering, and grouping. Independent repository review,
attestation, and Git/Vercel delivery remain separate gates.

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
`9ad8cb77ffec8d2666dfafb0302ec7be3f5352e7efe4c27193f2957ea7e3e5b9`.

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

## Human review and final reconciliation candidate

Kelsey Stuart completed all 197 decisions at
`2026-09-06T17:05:35-06:00`. The governed review CSV is
`docs/evidence/P8M-human-review.csv`, SHA-256
`2f30b7c565abbf67f9ee4bcb2012c596c2cc445aae542b65aec58defaf433b7a`.
Its first 27 columns are cell-for-cell identical to the generated proposal package;
only `reviewed_at`, `tag_decision`, `correction_decision`, and `human_rationale` are
populated. Decisions reconcile to 176 tag approvals, 14 revisions, and 7 completed
`needs_more_evidence` outcomes. Correction decisions are 38 approvals, one rejection,
and 158 `not_applicable`; the 38 approved rows contain 39 correction recommendations.

The companion source-field extract is
`docs/evidence/P8M-omitted-source-fields.csv`, SHA-256
`76433a0571bbcc3475707ef22a9df0a08f8b92858cdc84a298126340c275317f`.
It matches every mapped revision-225 snapshot value for rows 2–198. JSON `null` maps
to an empty CSV field in 407 cells; no other representational difference exists. The
review digest and independent validation receipt are preserved at
`docs/evidence/P8M-review-digest.md` and
`docs/evidence/P8M-human-review-validation.md`, with SHA-256 values
`85960fd18068fdf7aed2aca7f7255189b8cd9e8f20b4c2df08c89ed212fbf4d8`
and `831bfa0cc3cd91091b7aa6d6a0cacb02d5f9ff2c54f8cb0b527be41cd7173ddc`.

The deterministic final reconciliation is
`docs/evidence/P8M-proposal-reconciliation.json`, SHA-256
`6df332b900df4791441bdcd36c8ec6e665758e2354e9c7b70f3ca516da70d48b`.
The immutable publication candidate is
`web/fixtures/p8m/matching-facts-v1.json`, SHA-256
`16db9f32a14c7b63d2a912a84c43ac973ae43a07d7c40841174d6fbdfd5a6b07`.
It contains 197 human-reviewed controlled-tag outcomes for sorting, filtering, and
grouping only. It contains zero accepted matching facts (canonical empty-array digest
`4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945`).
No reviewed tag can exclude a student or affect matching. Approved corrections remain
unapplied recommendations. Missing or unavailable information remains unknown and
non-excluding.

The snapshot and companion expose 100 literal URLs in `Application Link/Method`; 97
rows have no literal application URL. None of the 187 populated
`Scholarship Location/Information` cells contains a literal URL, and the formatted-
value snapshot contains no native hyperlink targets. Those targets remain unavailable,
not blank facts. Because authorized column A contained zero URLs, P8M made zero
external URL reads and all 197 rows retain `official_verification_required`.

## Side effects and boundary receipt

- Spreadsheet reads during this acceptance continuation: 0.
- Spreadsheet writes: 0.
- External URL reads or redirects: 0.
- Forms, applications, logins, provider contacts, and applicant data: 0.
- P8F and P9 work: 0.
- Claude accepted facts or spreadsheet mutations: 0.

The publication generator refuses to overwrite a completed human review package,
checks all proposal-owned columns, exact hashes, row identities, decision vocabulary,
source-companion cells, disagreement-row coverage, and zero-fact isolation. It creates
no cycle, cycle-ID, or application-group field.

## Verification and acceptance gate

Pre-freeze verification on the isolated acceptance worktree:

- `npm ci`: PASS; 462 packages installed from the lockfile.
- `npm run p8m:proposal:check` and `npm run p8m:proposal:test`: PASS; 197 rows and
  19 fail-closed proposal mutations.
- `npm run p8m:acceptance:check` and `npm run p8m:acceptance:test`: PASS; exact human
  package/publication reconstruction plus seven fail-closed acceptance mutations.
- `npm run plan:check`: PASS for all 13 ordered stage contracts.
- `npm run typecheck`: PASS.
- `npm test`: PASS, including the complete P0–P8R matrix and both P8M suites.
- `npm run build`: dependency fetching succeeded, but the exact Turbopack build then
  failed because its CSS worker attempted a prohibited local port bind (`EPERM`).
- `npm run build -- --webpack`: PASS on the same candidate; only the existing
  middleware-deprecation and Edge-runtime compatibility warnings remained.
- `npm audit --omit=dev --json`: one moderate production advisory in transitive `qs`,
  with zero critical/high. A fix is available but dependency mutation is outside P8M;
  route it to separately authorized maintenance.
- `git diff --check`: PASS after declaring the governed CRLF review CSV as
  `cr-at-eol`; the review file's accepted SHA-256 remains unchanged.

The first fresh-context review of candidate `c2213f3` returned C0/H0/M2/L1. All three
findings were remediated before the final freeze: every Claude input `fields` object is
now deep-compared with its pinned snapshot row and covered by an adversarial mutation;
the stale pending-review introduction in this evidence was replaced with the current
verified-candidate state; and the completed-human-decisions blocker was removed while
the stage remains gated by verified status and the required review/attestation. The
final review record must retain three count-matched dispositions and the same reviewer
must recheck every changed byte before attestation.

The candidate is not canonically accepted merely because `BUILD_STATE.json` describes
a verified publication candidate. Canonical acceptance requires the exact candidate
manifest and a fresh-context C0/H0 review in the direct-child attestation.

At the start of closeout, Git remote refresh and repository lookup were unavailable:
SSH reported `Repository not found`, and both locally configured GitHub identities
reported invalid authentication. No credential was requested, copied, or stored. The
last locally verified `origin/main` remains
`55245dc42a726d57ef3bdbeeab7aa27fcce31d17`. Before attestation or remote delivery, a
fresh session must reauthenticate securely through the browser/keychain, verify the
remote baseline is still exact, and rerun the final review if any candidate byte or
baseline changes. Do not create an undeliverable attestation commit.

Stop before P8F and P9. P8F may begin only after the P8M direct-child attestation is
merged and the exact live `origin/main` delivery is verified.
