# Spreadsheet shortlist operations

The student flow opens on the interview, compares supported recorded criteria,
and downloads exactly the visible awards as CSV. The CSV opens in Excel and includes
scholarship details and application links. It contains no interview answers or
personalized decision reasons.

## Current data

The shortlist uses the saved Master Database revision 225, captured September 2,
2026, and its completed human review. This is not a live connection and does not claim
that deadlines or requirements are current. The screen displays the snapshot date.

`web/fixtures/shortlist/spreadsheet-shortlist-v1.json` is the separate public shortlist
artifact; `pin.json` records its digest. The generator reads only the already committed
source and review files, checks their exact hashes, and fails if either changes.
The historical P8M official matching publication and all P9 evidence stay unchanged.

- GPA comparisons use clear numeric minimum cells; four known scope/scale exceptions
  remain unknown. Always confirm the GPA scale and current provider rule.
- School comparisons use the resolved human-reviewed school-type fields.
- Exact reviewed application formats can improve order without excluding anything.
- Other interview answers have no effect in this version. Sensitive nonselection and
  unknown data never count against a student.
- A recorded mismatch appears under Outside shortlist and All awards. It is not a
  declaration of ineligibility. The default shortlist includes uncertain records.
- All 197 source rows reconcile; 176 map to awards and 21 to portals. Sixteen additional
  catalog awards have no separate source row and inherit no parent eligibility.

## Refresh using the same process

1. Obtain an authorized read-only snapshot of the organizer's Master Database, including
   the actual populated bounds and native information/application hyperlinks. The old
   column-A source restriction was a prior task boundary, not a URL-location assumption.
   This release itself does not authorize a fresh read or a website crawl.
2. Compare rows against the prior snapshot using stable identities; review additions,
   deletions, ambiguous mappings, and changed GPA/school/application fields. Reuse
   unchanged reviewed values. Review the changed fields, without requiring every field
   to be complete. Missing values remain unknown.
3. Create a new versioned source/review/shortlist artifact, update its exact hashes and
   date, and regenerate the complete row ledger. Never overwrite the historical P8M or
   P9 artifacts or blindly repoint the current generator at unreviewed input.
4. Run `npm run shortlist:check`, `npm run shortlist:test`, and the repository checks.
   Exercise contrasting synthetic profiles and compare the downloaded CSV with the
   visible list. Obtain independent review of that bounded update.
5. Publish only with exact authority for the Git/PR and Vercel effects. Verify the
   deployed commit, `/api/health` shortlist ID/digest, and the real student journey.

This process needs no spreadsheet credentials in the deployed app and no background
schedule. It never writes the source spreadsheet.

## Rollback and current release boundary

The current deployed P9 application remains the rollback reference: merge
`7c3cc309bcb4093c150fe5976b631c0351b7e12c`, followed by documentation-only closeout
merge `b8ea0982709b1984674e43e39f7ecbf7e42fe7d4`. Restoring a deployment is an external
effect requiring its exact authorization. Local development and browser results do
not prove Production health.

Kelsey directly authorized Revision 13 branch push, PR, resulting Vercel Preview,
merge, resulting Vercel Production, and verification on September 10 for the existing
web project. Build state and Revision 13 evidence pin the target and scope. Freeze
and independently recheck the authorized candidate, add the exact two-file
direct-child attestation, then deliver and verify the real deployed flow. Hosted
results belong in the PR delivery record and subsequent local handoff.
