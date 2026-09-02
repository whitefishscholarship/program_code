# Plan Revision 12 kickoff — row-source correction

Execute Plan Revision 12 only from verified live `origin/main`
`57bb062d64f725fa6ce72709f81fe987dde3e2af` on isolated branch
`codex/plan-rev12-row-source`.

## Objective

Record Kelsey's correction before P8M: `Master Database` has no application-group or
cycle/cycle-ID field; its 197 populated rows are the complete source denominator; and
blank or unavailable values remain explicit unknowns while valid work continues.
Machine-pin the completed read-only source receipt, update the P8M kickoff/lifecycle,
and preserve the frozen matching-fact contract.

## Exact scope

- Change only the fifteen allowlisted governance/evidence/test/validator paths in
  `BUILD_STATE` and `web/scripts/plan-rev12-row-source.ts`.
- Bind spreadsheet ID, title, gid `0`, grid and used ranges, revision `225`, timestamps,
  one header, 197 populated rows, 176 Scholarship rows, 21 Portal rows, 175 unique
  Scholarship names, and one exact-name duplicate group.
- Make complete-row outcomes mandatory while allowing unavailable facts to remain
  unknown and non-excluding.
- Keep `matching-facts-v1` byte-for-byte unchanged. Source rows do not require
  `cycle_id` or application-group identity; optional normalized facts use them only
  when later evidence explicitly establishes them.
- Preserve P8M as planned and sole next-permitted stage. Preserve P8F and P9 as planned.
- Freeze, independently review, direct-child attest, and use the explicitly authorized
  Git/PR/Preview/merge/Production verification path for Revision 12.

## Prohibited

Stop before P8M execution. Do not read external URLs, invoke Claude, accept facts, write
or reread the spreadsheet, access another tab's cells, alter scholarship data, change
product/runtime/workflow/deployment configuration, activate monitoring, handle
applicant data, contact providers, begin P8F or P9, or rewrite history.

## Acceptance

- The focused mutation suite rejects denominator drift, invented cycle/application
  requirements, blank-to-false conversion, batch-stopping incomplete facts, write
  authority, master-write authority, missing P8M delivery authority, and obsolete
  cycle-denominator blockers.
- Plan validation, typecheck, full tests, build, and whitespace checks pass to their
  evidence boundaries.
- The candidate changes exactly the machine allowlist and receives non-author
  fresh-context C0/H0 review with all medium/low findings dispositioned.
- A direct-child attestation adds exactly `docs/evidence/PLAN-REV12-manifest.json` and
  `docs/reviews/PLAN-REV12.json` and remains branch tip through delivery.

## End state

Plan Revision 12 is an ancestor of live `origin/main`; CI and resulting Preview and
Production deployment states are verified without being misrepresented as application
health; the source pin is durable; and P8M is reassessed only against its remaining
phased gates. Stop before P8M execution, P8F, and P9.
