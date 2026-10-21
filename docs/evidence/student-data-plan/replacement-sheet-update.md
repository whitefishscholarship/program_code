# Replacement working spreadsheet — documentation update

User instruction October 13, 2026: “new sheet to work on/from. this is a copy of
the sheet you know but new url. make sure it's documented and the old sheet is not
used as a reference”. User URL: https://docs.google.com/spreadsheets/d/1-rgieaL5Hd87W97Zzx9SPFFSmPAmSPGqkzPYnjDQzL0/edit?usp=sharing.

Current working/reference ID: `1-rgieaL5Hd87W97Zzx9SPFFSmPAmSPGqkzPYnjDQzL0`.
Retired predecessor: `1ifwt24eEI2ITG7ME58bH190kUX4NtizMDBM0pGN2BY0`.
Baseline local planning checkpoint: `db9c2a75e1b481fd5f96b284f6b22d9a61a9814a`.

## Observed verification and limits

At 2026-10-13 14:24:48 UTC, Google Drive get_file_metadata for the new ID returned
that exact ID, title `Spreadsheet Clean Up 4`, MIME type
`application/vnd.google-apps.spreadsheet`, and a matching Google Sheets URL.
Request fields: id,name,mimeType,webViewLink,trashed. The result did not verify
contents, tab IDs, row identities, edit permission or equivalence. The connector
reports source_visibility_status access_not_verified; metadata success is not
content/write access proof. An initial malformed request was rejected by local
schema validation, then the correctly shaped metadata request succeeded.
No cells were read or written, and the old workbook was not accessed.

## Documentation behavior

The current plan and handoff designate only the new copy for future selected
workbook/reference work. Old workbook/cell snapshots are historical audit records,
not a current baseline; no fallback to the retired workbook. New-copy tabs and
identities must be verified instead of copying old coordinates. Independent
scholarship source captures may be reused only after applicable identity/cycle/
field/freshness checks against the new copy. Destination selection is settled;
future exact operations, content baseline and preservation controls remain due.

Preserve the original independent review and validation records byte-for-byte;
they attest their named historical candidate and are not rebound to this update.
Canonical state/plan, app data/configuration, historical evidence and the primary
checkout remain unchanged. No Sheet edit, migration, release or monitor activation.
Final validation and fresh proposal recheck will be appended below.

## Validation

Completed by 2026-10-13T14:28:41.862397+00:00:

- From web, npm run plan:check: exit 0, 13 contracts/current state passed.
- npm run typecheck: exit 0.
- npm test: exit 0, complete existing test script.
- npm run build: exit 1 even with permitted process access; same existing local
  port/process EPERM as original planning validation. Runtime/build bytes remain
  unchanged; earlier npm run build -- --webpack pass remains applicable as a
  historical alternate check, not a new standard-build pass.
- Root git diff --check: exit 0.
- Controlling docs and original proposal validation/review are byte-identical
  to this update's baseline; historical handoff remains an exact suffix.

This is a source-designation documentation update, not implementation acceptance.
Fresh independent recheck follows on a committed candidate.

## Independent recheck and local close

PASS — bounded proposal update review. Fresh read-only reviewer /root/plan_review
reviewed candidate `47757f0ae857dac1f2425203d1c6eccb8183866a` against
`db9c2a75e1b481fd5f96b284f6b22d9a61a9814a`. Findings C0/H0/M0/L0.
Reviewer confirmed consistent sole current workbook designation in plan/handoff/
prompts; no predecessor reference/fallback; audit-only historical snapshots;
new-copy reconciliation before official-source capture reuse; no assumed copied
tabs/coordinates/contents/permissions/equivalence and no expanded effects.
Exactly three documentation paths changed, with canonical controls, app tree,
original validation/review and historical handoff bytes preserved. Candidate
whitespace check passed. Review performed no remote/source access or edits.

This appended review result does not rebind the prior review or accept an
implementation stage. Reviewed plan and handoff bytes remain frozen. The update
is committed locally; no Git delivery or workbook-cell changes occurred.
