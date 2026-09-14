# R3 freshness-check correction proposal

Status: proposed, not authorized or implemented. R3 source-dependent work is blocked.
Original and supplemental source-read permissions remain valid; no repeat access grant
is requested. The only proposed change is the verification rule described below.

## Evidence and cause

The approved supplemental policy at candidate `9f7398461e639e0ea002661e395e98df869b6062`
and review checkpoint `93ea61442acc7d40f1daafbcb4faaa68a1728696` requires agreement between
the file modifiedTime and matching revision modifiedTime. Its reviewed sanitizer
implements exact instant equality. Two permitted revision observations returned25 records
and exactly one record matching the connector-reported currentRevisionId. Both failed
that check. The follow-up establishes a valid revision timestamp of
`2026-09-11T10:51:53.207Z`, versus independently read file modifiedTime
`2026-09-11T10:51:53.348Z`: a141-millisecond difference. See connector-preflight-01.json
and connector-preflight-02.json. No current token was accepted or persisted; no cells
were read. Raw responses and editor attribution were discarded.

Google defines file modifiedTime as the last modification of the file and revision
modifiedTime as the last modification of that revision. These are separately defined
fields; the references do not promise equality. The file version counter covers all
server-side changes, but the connector does not expose it. Sources, accessed
2026-09-14 UTC: [File resource](https://developers.google.com/workspace/drive/api/reference/rest/v3/files)
and [Revision resource](https://developers.google.com/workspace/drive/api/reference/rest/v3/revisions).

Google also warns that revision lists may omit older history. A25-record result is not
proof of complete history. [Manage revisions](https://developers.google.com/workspace/drive/api/guides/manage-revisions).
No arbitrary tolerance, rounding,141-millisecond exception, guarantee of normal behavior,
or proof that the connector returned the true current head follows from these references.

The exact-equality assumption was introduced by Codex. Its failure does not by itself
establish stale scholarship content or a broken Google file. The present contract still
requires it, so implementation may not silently ignore the failure.

## Exact proposed replacement

Replace only cross-resource timestamp equality with separate stability comparisons.
For each complete capture attempt, obtain four bounded freshness observations: before
and after complete capture1, then before and after complete capture2. Each observation
uses the same already-approved file-metadata and one-page revision routes. No pagination.

Each observation must independently pass:

1. Exact workbook identity, expected title and spreadsheet MIME type, and a valid file
   modifiedTime. An observed trashed:true blocks; unavailable stays unknown.
2. Nonempty safe connector-reported currentRevisionId, exactly one corresponding revision
   record, a valid revision modifiedTime, compatible MIME type if supplied, and only
   approved metadata fields. Missing/ambiguous identity or a1000-record cap blocks.
3. Discard editor identity and raw spreadsheet URL before output or persistence. Persist
   only the minimal authorized identity, reported token, timestamps and comparison proof.

Across all four observations, require exact equality separately for each of these values:

- The connector-reported currentRevisionId.
- The revision record's modifiedTime.
- The file's modifiedTime.

Require both complete A1:O417 native-cell projections to have equal deterministic digests,
with exact sheet0 identity, headers, minimum dimensions, field projection and all416 row
positions accounted for. Do not compare file time to revision time; retain both values
as distinct observations. Any change, missing proof, scope/privacy violation or incomplete
capture blocks the attempt. Maximum3 attempts; a failed metadata-only attempt still
consumes an attempt conservatively. Existing attempt1 failed before any cell capture;
no more than2 further complete attempts would remain after approval.

## Value, risk and unchanged boundaries

This tests whether the source stayed stable throughout capture without inventing an
undocumented equality relationship between two different fields. It retains the original
equal-token and two-equal-complete-capture requirements and adds explicit stability of
each timestamp. It grants no new reads, fields, source writes, credentials or R4 effects.

This DOES remove an independently reviewed check. The replacement accepts unequal file
and revision timestamps if each stays stable. It does not prove that the connector's
reported current token is the true server head: a stale/incomplete connector response
could remain stable. Direct native cell reads and stable file metadata provide separate
observations of the captured content but do not bind a Google revision token cryptographically
to those cells. This remains bounded observational consistency, never a transactional
snapshot, complete history proof or current official scholarship verification. Do not
claim reported revision IDs are the same thing as the unavailable Drive file version.

The alternative is to retain the existing exact rule and wait for an authorized supported
connector route that exposes the required file version/identity proof. No further permission
is needed merely to keep the current source work blocked.

## Approval and continuation

Kelsey's direct informed approval of this precise verification change is required before
implementation; the earlier grants do not authorize quietly weakening their accepted gate.
Then append the prospective REV18 correction and DECISIONS entry in a dedicated local
policy commit, update only the supplemental verification fields and tests, freeze and
obtain fresh independent policy PASS before more source calls. Do not alter original
scope/proposal/evidence/review bytes or rebind any historical candidate.

Source reconciliation/mapping review still precedes product edits; full local R3 review
and separate R4 authority remain required. Preserve all original257 operations,192 awards,
38 priority entities/42 references, NTHS survivor and every recorded hold/recovery/backlog
owner and trigger. No source-dependent acceptance or product change has occurred.
