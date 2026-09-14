# Proposed metadata-only connector supplement

Status: proposed, not authorized. Original R3 authority and cell bounds are unchanged.
This proposal resolves an observed connector mismatch; it does not relax capture gates.

## Observed blocker

The independently reviewed R3 policy is committed at `eceeb49`, candidate
`c8be2caf739b1074ae6caddc9e7f87ab28a68078`. Its scope permits only the selected file,
sheet0 Master Database A1:O417 and exact metadata/cell fields. One authorized
`get_file_metadata` call requested `id,name,mimeType,trashed,version,modifiedTime`.
The response confirmed workbook identity and modified time but omitted version and
trashed. See `source-preflight.json`. No cells or revision history were read.

The connector's version-history tool can provide revision identity, but it has no field
mask and may also expose editor attribution. Its native-cell tool can select the exact
range/cell fields, but its unmaskable envelope may include selected-tab metadata beyond
our allowlist, as observed in saved `docs/evidence/scholarship-intake/cells-0.json`.
Available tool declarations are saved in `connector-tool-declarations.json`.
No new cells were read.
The all-tab metadata tool cannot limit its inventory to sheet0 and remains prohibited.
Local filtering cannot undo an unauthorized upstream read. No supported narrower route
was found in the available tool declarations; credential/raw-request workarounds were
not attempted. Modified time alone cannot replace the required revision token.

## Exact proposed additional permission

Only workbook `1Dp5AMnrfSQ-Xf-r03S75lKsGPJk7o0inOgvC9Q6lOl4`, for the already-authorized
R3 capture. All native cell bounds/projection, source semantics and R4 exclusions stay exact.

| Route | Additional metadata proposed | Bound and retention |
| --- | --- | --- |
| `list_file_revisions` | File ID, current/previous revision IDs; each returned revision's ID, MIME type, modification time, keepForever, published, original filename, size; incidental lastModifyingUser display name, email address, me, permission ID and photo link | One page with `pageSize:1000` per freshness observation; no pagination or revision-content fetch. At most four observations per complete capture attempt, three attempts total. Discard editor attribution and unnecessary historical metadata in orchestration before model-facing output or repository persistence. |
| `get_spreadsheet_cells` | In addition to approved fields: selected sheet0 index, sheetType, gridProperties.frozenRowCount, and top-level spreadsheetUrl | Header sentinel within A1:O417, then the approved bounded captures only. Discard the raw spreadsheetUrl, including account/owner query parameters. Retain only needed nonpersonal selected-sheet identity metadata. |

The revision tool may expose editor names, email addresses, photo links or permission
identifiers in its upstream response. This incidental exposure needs explicit permission
even though those values will not be copied into Git, user-facing output or saved evidence.
No applicant content or application records are requested or permitted.

Persist only the file identity, usable current revision token, relevant modification
timestamps, observation time, returned revision count and minimal evidence supporting
the current-token selection. Do not claim that a truncated page or the last returned
ID proves the current revision. Require a nonempty tool-reported currentRevisionId
with a corresponding revision record whose modifiedTime agrees with the independently
read current file modifiedTime. Reject ambiguity and a response reaching the 1000-record
cap; stop rather than paginate or assume completeness. If the tool cannot provide this
proof, remain blocked. No whole-version-history completeness claim is required or made.

Retain the original before/after same-token and two-equal-complete-cell-digest checks.
The supplemental metadata does not turn a missing token or incomplete cell projection
into a PASS. Unexpected sheet IDs, additional metadata, extra cells or unexpected personal
content stop dependent processing without reproducing that content.

Trashed status remains unavailable through these tool routes. Record it as unknown;
do not infer `trashed:false` from successful access. This supplement does not waive any
gate that requires that status. The existing capture contract requires verified exact
identity, headers, minimum dimensions, stable revision and complete cell evidence; if
execution reveals that explicit trash-status proof is also necessary, stop for a supported
route instead of silently substituting another observation.

## Approval and continuation

This is a small supplemental source-read permission proposal, not a new workbook or
product scope. The original R3 grant remains valid and does not need to be repeated.
Kelsey may approve only the two metadata routes and bounds above. Then the implementation
agent must add this exact supplement prospectively to REV18 policy/state and its tests,
freeze it and obtain fresh independent read-only policy review before those source calls.
Keep the original scope/policy documents, review records and candidate bindings unchanged.

After that review, resume the bounded source capture under the combined grants. Separate
source reconciliation/mapping review still precedes product edits. R3 final local review
and R4 release authority/attestation remain mandatory. The original 257 operations are
never replayed; all held entities, historical routes, recovery and operational triggers
remain preserved in CURRENT_HANDOFF.

No additional workbook/tab/cell content, revision contents, other-tab inventory, linked
documents, formulas executed, cloud copies, source mutation, credential handling,
research, configuration, provider contact, monitoring, deployment or later phase is included.
