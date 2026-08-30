# Current Handoff

Last updated: 2026-08-30
Plan revision: 6
Repository: `whitefishscholarship/program_code`
Default branch: `main`

## Current P8 accepted-state candidate

- P8 has a prospective accepted-state marker on isolated branch
  `codex/p8-monitoring-recovery` from exact live baseline
  `5be74c3ccb45ee57671fd7e4616358d2d0e2b32f`. P9 is next-permitted only after P8 is
  attested, merged, and verified; no P9 production authority exists.
- Standard authenticated Git reproduced the baseline merge and exact accepted P7
  direct-child attestation `fa23a761fdf7d09156ae3d683476457c665e7092`.
- Preliminary frozen candidate `b3347e75c76e490e41fe200f9245185605e385d2`
  was independently rejected C0/H5/M1/L1 and must never be attested or delivered. It
  collapsed the denominator to 197 rows, modeled rather than executed critical
  controls, duplicated logical review work across runs, allowed recovered suffix
  publication to lose prefix work, lacked an exact build pass, used unkeyed receipts,
  and contained two whitespace defects.
- Replacement `30cdbfe4ee8f026015b917ce9abf781b69cbd94f` was independently
  rejected C0/H2/M1/L0 and must also never be attested or delivered. Its live driver
  falsely refreshed 978 unchanged snapshots, queue publication accepted a forged
  complete object, and same-tip replay was not idempotent.
- Replacement `9e5264e212a6224a9fd058e1d61524283cde0149` was independently
  rejected C0/H1/M0/L0 and must never be attested or delivered. A custom non-HMAC
  structural store could bypass the segment bound, mint a branded finalization, and
  publish a queue. The current remediation requires the private registered store for
  both execution and finalization, rechecks the segment maximum during replay, and adds
  direct negative tests.
- Replacement `7d87c589a699423513b0fbbcd1489a01da0e2c52` was independently
  rejected C0/H1/M0/L0 and must never be attested or delivered. Both a mutated genuine
  plan and a fabricated structural plan could execute and publish. The current
  remediation exact-binds accepted semantic and file digests, deeply freezes and
  privately registers the plan, and rejects unregistered or changed plans before probe
  execution or receipt reads.
- The current replacement keeps 1,028 distinct targets: 217 P7 sources, 213 P5
  source routes, 192 awards, 192 cycles, 21 portals, four application groups, 187 P5
  review items, and two P6 review items. Only the 50 accepted public read-only routes
  are probe-eligible; 163 manual routes and every application URL remain no-fetch.
- Two replacement dry runs each execute all 1,028 targets in five authenticated
  segments with zero duplicates/loss, matching semantic results, 50 executed spacing
  delays, 1,028 freshness evaluations, and no accepted-fact mutation or publication.
- Six required failure simulations enter review. Bounded retries/backoff execute, stale
  and future observations fail freshness, and missing observations cannot silently
  default unchanged.
- Each receipt is append-only, HMAC-authenticated, and linked to the prior segment. The
  recovery simulation retains a first-segment review item, rejects incomplete
  publication, reconciles all 1,028 targets, rejects forged/mutated finalizations and
  out-of-plan targets, keeps same-tip replay at one occurrence, and uses stable
  cross-run review upsert. Non-public live-driver checks retain accepted observation
  time, so absent snapshots age into review rather than refreshing themselves.
- The schedule plan remains disabled and activation unauthorized. The guarded driver
  accepts only explicit dry-run mode and was not invoked. No live source, spreadsheet,
  form, provider, notification, deployment configuration, production system, or P9
  action occurred.
- `docs/evidence/P8.md`, `docs/evidence/P8-report.json`, and
  `docs/P8-OPERATIONS.md` are the replacement evidence and runbook. Locked install,
  focused P8 checks, plan validation, typecheck, the full P0-P8 suite, exact normal-
  worker Turbopack production build, full/production audits, and both working/range
  whitespace checks passed by `2026-08-30T06:02:21Z`. Replacement freeze,
  same-reviewer recheck, accepted-state transition, final recheck, manifest,
  attestation, and governed delivery remain pending.
- After the `30cdbfe4` rejection, deterministic evidence, strengthened freshness/
  publication/replay tests, plan validation, typecheck, the full P0-P8 suite, exact
  Turbopack build, both zero-match audits, and both whitespace checks passed again by
  `2026-08-30T06:15:42Z`. The next action is a new immutable technical freeze and the
  same reviewer's read-only recheck.
- After the `9e5264e2` rejection, the trusted-store and segment-bound focused checks,
  plan validation, typecheck, full P0-P8 suite, exact Turbopack build, both zero-match
  audits, and both whitespace checks passed by `2026-08-30T06:22:56Z`. The next action
  remains a new immutable freeze and same-reviewer recheck.
- After the `7d87c589` rejection, the exact-input and structural-plan negatives,
  deterministic P8 evidence, plan validation, typecheck, full P0-P8 suite, exact
  Turbopack build, both zero-match audits, and both whitespace checks passed by
  `2026-08-30T06:34:36Z`.
- Fresh-context reviewer `/root/p8_fresh_review` accepted exact technical candidate
  `3ffd53e873c0718d160ca353e4f01375bc4cf56c` C0/H0/M0/L0 against provisional manifest
  SHA-256 `2d8a158e92d15bc67679da2918e146e6bf9960045943af52d817bd2b1f506274`.
  No medium or low dispositions are required.
- Kelsey Stuart explicitly authorized the prospective acceptance-state transition on
  2026-08-30. Machine state now records P8 accepted, no active stage, and P9
  next-permitted with the P9 kickoff bound. Freeze this documentation-only transition,
  regenerate the exact manifest, obtain the same reviewer's final read-only recheck,
  then add only the manifest and review in its direct child. Authentication and
  delivery remain prohibited before that attestation.
- Prospective accepted-state `p8:test`, typecheck, and working-tree whitespace
  validation passed by `2026-08-30T15:08:35Z`. Plan validation reported only the two
  expected pre-attestation errors: missing P8 manifest and missing committed P8
  manifest/review attestation.
- `docs/kickoffs/P9-PRODUCTION-MIGRATION.md` is bound preparatory documentation only.
  It grants no production authority, does not start P9, and must not be used in this
  P8 session. The monitoring schedule remains disabled and unauthorized.

## Historical P7 accepted-state candidate (delivered)

## Current P7 accepted-state candidate

- P7 — Student-facing product and API — has a prospective accepted-state marker and
  awaits final exact-candidate recheck and attestation on branch
  `codex/p7-student-facing` in isolated worktree `/private/tmp/program_code-p7`.
- The exact P7 baseline is live `origin/main`
  `28e53dbdb0959ad86ff535d781c59c5ea9a4bf54`, the merge carrying accepted P6
  direct-child attestation `0bc02bcc9cc8856bc1e83b26130e787851dc937d`.
  Local commit topology, GitHub API, and standard HTTPS Git all independently
  reproduced that baseline; the original GitHub account was restored after the
  bounded read-only check.
- P6 is durably accepted and delivered. Candidate
  `53150026a92e45721642e9f44b564ed8a79aa3ea` received fresh-context read-only
  C0/H0/M0/L0 acceptance against manifest SHA-256
  `52320c0466fee1b9e3abd1f6bee97c3956b242fd65e976cf195039d189c265e4`;
  direct-child attestation `0bc02bcc` added only the P6 manifest and review.
- P6 canonical coverage reproduces 6 sources, 16 child awards, 1 shared
  application group, 16 yearless/unknown cycles, 109 field-level Evidence
  records, 2 ReviewItems, 7 legacy bindings, 0 active additions, and at least 71
  observed recipient slots.
- `docs/evidence/P7-test-matrix.json` is the pre-implementation browser and
  contract matrix. Its replacement expectations keep 217 canonical sources and 21
  portal records distinct, and covers all 13 canonical source architectures, single and
  shared awards, portals, paper/form routes, automatic consideration, unavailable
  cycles, all privacy/export states, and 360x800, 768x1024, and 1440x900.
- The complete 30-cell browser matrix passed with no exclusions. Production-mode
  screenshot evidence and machine results are in `docs/evidence/P7-browser-results.json`
  and the three `docs/evidence/P7-browser-*.jpg` files.
- The replacement public catalog reconciles exactly to 217 canonical sources, 21 portal
  records, 192 awards (176 accepted legacy plus 16 P6 children), 4 application groups,
  192 cycles, 0 active cycles, 192 unknown cycles, and at least 71 observed recipient
  slots from P6 descriptions. API and CSV are separate
  hard allow-lists and expose no internal evidence/review fields or applicant data.
- Locked install, P7 checks, plan validation, typecheck, the complete P0-P7 suite,
  production build, full and production dependency audits, and root whitespace
  validation passed. Both final audits had zero current advisory matches.
- Rejected exact candidate `11f3c53e34008684b8115660244c203774fc659a`
  received C0/H2/M2/L0 against uncommitted manifest SHA-256
  `130a77ea74d4b978440d1b121228a9fb56a5de904e43ba7e20f20356806518de`.
  It omitted the accepted legacy baseline, broke the legacy API/smoke contract, claimed
  incomplete ARIA tabs, and left this handoff stale. It must never be attested or delivered.
- The replacement combines P2/P5 with P6, preserves a versioned catalog plus exact
  197-row `{data}` compatibility adapter, passes the unchanged production smoke test,
  and replaces ARIA tabs with ordinary grouped native buttons. Its fresh 30-cell
  browser matrix passed with zero console errors.
- The same reviewer rejected exact replacement
  `8c455a8d071b3b9e6c5e5eb624cabeac034befed` C0/H1/M0/L1 against uncommitted
  manifest SHA-256 `021227c3c09286a9f02a6dab95eaebeb07f955b288f90a3d4c39f6499bfe5ecb`.
  All 16 P6 awards referenced a source public ID absent from the advertised source
  array, and this handoff contained one duplicated word. That candidate and manifest
  must never be attested or delivered.
- The second replacement resolves P6 sources through governed P1 legacy source
  identity when URLs differ, fails closed on an unmappable expansion source, and adds
  runtime plus focused referential-integrity checks. All 16 P6 awards now reference the
  existing Reach Higher Montana parent source and its computed award count is 16. The
  duplicated word was removed as the count-matched L1 disposition.
- The complete regression/build/audit matrix, unchanged optimized-server smoke, and
  fresh 30-cell browser matrix now pass; the browser observed the corrected 16-award
  source relationship at every required viewport with zero console errors. The exact
  final command window was `2026-08-29T21:15:44Z` through
  `2026-08-29T21:16:29Z`; both dependency audits again reported zero current matches.
- Fresh-context reviewer `/root/p7_fresh_review` accepted exact verified candidate
  `e3230f37f6dd1c0d55c9964a407ca3ac7d96fe98` C0/H0/M0/L0 against manifest
  SHA-256 `414f99219cbb614bf3db79d4656e76e3f37fe958949d5f3acc8887eac8b9d7f3`
  and explicitly cleared the accepted-state-only transition.
- Machine state now records P7 accepted, no active stage, and P8 next-permitted. This
  remains prospective until the commit containing this record is frozen, a new exact
  manifest receives the same reviewer's final read-only recheck, and its direct child
  adds exactly the P7 manifest and review. Do not authenticate or deliver before then.
- Accepted-state plan validation required the standard autonomous-Git boundary in the
  already prepared P8 kickoff. That documentation-only correction was added without
  starting P8; validation now reports only the expected missing committed P7
  manifest/review attestation.
- `docs/kickoffs/P8-MONITORING.md` is documentation only. P8 is next-permitted but
  remains planned and must not begin in this session.
- P7 may change only the student API/UI/export surfaces, bounded fixtures/tests,
  dependencies needed for P7, browser evidence, and P7 governance artifacts.
  Spreadsheet writes, production spreadsheet access/migration, P8 execution,
  P9, forms/applications, applicant data, provider contact, deployment changes,
  paid/destructive actions, history rewriting, and gate weakening remain prohibited.

## Historical P6 work record (superseded)

The detailed work-in-progress narrative below is retained as historical context only.
The accepted P6 manifest, review, evidence, direct-child attestation, and live merge
identified above are canonical and supersede its earlier pending/rejected wording.

- P6 remains undelivered and must not be treated as accepted. The current disjoint
  replacement is branch `codex/p6-eligible-coverage-expansion-rev3` in isolated
  worktree `/private/tmp/program_code-p6-rev3`, created directly from exact baseline
  `2831ef1ff79c99a0fc4755fe7af7b855d11ebf21`. Its accepted-state machine marker is
  prospective only. The third replacement candidate `f1fbc34...` was rejected
  C0/H0/M2/L0 and is preserved locally. Its stale current-state summaries and
  caller-controlled application observation time are remediated in the commit
  containing this record; that new candidate will receive a regenerated manifest,
  independent recheck, direct-child attestation, and delivery only if all gates pass.
- Live GitHub API verification resolved `main` to exact P6 baseline merge
  `2831ef1ff79c99a0fc4755fe7af7b855d11ebf21`, produced by PR #20 from exact P5
  attestation `d22c8dd7108338f41192b884227421a00ecf09b5`. The merge parents are exact P4
  delivery `c8651bf9015c55965eb50cab4a96a12621f3b0fe` and the P5 attestation. Standard
  SSH and HTTPS Git fetches both returned `Repository not found`; the signed remote
  merge payload was retrieved read-only through the configured repository account,
  reproduced byte-for-byte at the expected SHA, and used to advance the local
  `origin/main` tracking ref. The original active GitHub account was restored.
- P5 is durably accepted and delivered. Candidate
  `ebf21669937469e306023dc4d3ab7de6f126d9ce` received fresh-context read-only
  C0/H0/M0/L0 acceptance against manifest SHA-256
  `094aebc0ae186a8e516f12c5cbf812260d4c0e9d72300cd9bf4f8325580a793c`;
  direct-child attestation `d22c8dd` added only the P5 manifest and review.
- P6 entry reproduction passed: plan/history validation, the 213-source P5 queue,
  the 197-row audit, and post-write reconciliation. The restricted runner first
  denied the `tsx` local IPC pipe; the exact permitted retries passed.
- `docs/evidence/P6-source-queue.json` pins the complete 21-row P5 portal denominator
  before any P6 live expansion. Five high-yield parent sources spanning seven rows are
  selected; the other 14 rows have explicit batch-selection exclusions.
- Sixteen bounded public information reads produced a PII-free sanitized fixture,
  one source-authority/audience refresh receipt, and two fresh application-evidence
  receipts with internally recorded observation time.
  Three queue sources are complete and two are `blocked-external`; there are zero unaccounted
  or resumably incomplete queue items. No login, account, search form, eligibility
  questionnaire, application route, or submission was entered.
- Reach Higher's selected application-group section exposes 30 individual awards after
  expanding its Montana FFA umbrella: 16 become child records and 14 are excluded for
  non-Whitefish audience, non-postsecondary use, or baseline identity collision. NFU
  exposes three named children under one unified application description, but its
  current official page exposes no linked application route, so all three are excluded.
  Reach Higher states only an annual Jan. 1-Mar. 1 window without a year-qualified
  current cycle. All 16 child cycles therefore remain `unknown`, so the exact P6 net
  change in active eligible awards is zero.
- FVCC's current catalog exposes 169 unique opportunities across pages 1-4, all marked
  `Ended`; page 5 is the first empty page. The accepted historical 179 observation is
  preserved as a ten-item drift unknown because the prior evidence did not retain all
  179 identities. No current item is accepted as active.
- Horatio states `over 70` programs but exposes only 15 named undergraduate/CTE
  programs statically. FIRST states `more than 150` provider organizations but no exact
  scholarship denominator. Both sources contribute zero accepted children because
  complete enumeration would require prohibited filter/portal interaction.
- Earlier candidates passed their recorded matrices, but those results do not accept
  the current third replacement. The current deterministic result remains 16 modeled
  scholarships, one application group, 16 unknown annual cycles, seven exact P1
  portal-row bindings, zero active cycles, and at least 71 observed recipient slots
  across undated descriptions. The current child-graph digest is
  `d7ae32194b75e27ba796365b7d8b6140b562f34cecbd60adcbf375e7f3cf13cc`;
  the final remediation matrix passed before the new candidate freeze.
- Preliminary candidate `c1c8164a3294263217dcaf35350d7ca39b2555aa` was independently
  rejected C0/H2/M1/L0 and must never be attested or delivered. Remediation excludes
  both exact collision `MABA-MGEA Scholarship` (baseline row 174) and the independently
  identified Leave a Legacy alias (baseline row 170), derives application/workflow
  claims from privacy-safe source excerpts and excludes NFU children without a linked
  route. Its attempted synthetic legacy identities were later rejected and are not
  retained by the current replacement.
- The same reviewer rejected immutable replacement
  `075f3117f0d4d26c804aafe936890b3f692c5593` at C0/H0/M1/L0 after confirming all
  original findings closed. Its new provenance finding is remediated by assigning all
  18 refreshed Reach application Evidence records the exact `05:25:54Z` observation
  time and binding the linked route into their source-excerpt digest. The replacement
  must not be attested or delivered; another freeze and recheck are required.
- The provenance-corrected second-replacement matrix passed completely at
  `2026-08-29T05:40:47Z`; a new immutable replacement freeze and independent recheck
  are next.
- The accepted-state matrix ran from `2026-08-29T06:10:05Z` through
  `2026-08-29T06:12:02Z`: locked install, deterministic P6 check, typecheck, complete
  tests, production build, and root whitespace validation passed. Prospective plan
  validation reported only the two expected absent P6 manifest/review-attestation
  gates after the existing P7 kickoff path was bound in machine state.
- Fresh-context final reviewer `/root/p6_final_review` rejected exact accepted-state
  candidate `077af076908429d22f61af1befd4d83b2eec69c8` against manifest SHA-256
  `679c511caa3193c7c35dd2702f8354f78394b36b124da3429455a7899ed389ab`
  at C0/H2/M0/L0. That candidate and manifest must never be attested or delivered.
  It fabricated closed 2026 states from an annual-only rule and confused portal-row
  hashes with source identities while omitting canonical legacy bindings.
- Second replacement candidate `82e546226bdae3771aedec32419742494a9a56e8`
  and direct-child attestation `e322d0aa09f2a2b04c4a80edc75a1c6907e9ccfa`
  were independently rejected C0/H4/M2/L0 by `/root/p6_replacement_audit`. Although
  their manifest/topology checks passed, the candidate still descended from rejected
  `077af07`; audience and official-source relationships were insufficiently bound;
  verification histories conflicted; capture provenance was self-asserted; and
  near-name dedupe was not systematic. Neither commit may be delivered.
- Current `rev3` remediation is directly rooted at `2831ef1`, preserves all cycles as
  unknown/yearless, binds the six exact P1 source identities and seven portal rows,
  and adds canonical field Evidence for each source authority and every accepted
  parent/application relationship. Each accepted child now has explicit page-level
  Montana-audience Evidence rather than an inferred geography.
- A single bounded official-page refresh returned provider scrape ID
  `01a04e42-b0fa-74e9-95c0-8e0615315641` and the exact heading `Scholarships for
  Montana Students`. The raw response was deleted after sanitized receipt/hash binding.
  Capture tooling now derives scrape IDs from provider metadata and records observation
  time internally. Systematic near-name review detects and dispositions both the
  row-170 Leave a Legacy alias and the ended FVCC row-44 suffix alias.
- The complete third-replacement matrix passed from `2026-08-29T16:16:38Z` through
  `2026-08-29T16:18:11Z`: locked install, deterministic P6 check, focused audience/
  authority/relationship/identity/cycle/privacy test, typecheck, complete tests,
  network-permitted production build, and root whitespace validation. Prospective
  plan validation reported only the two expected missing manifest/review-attestation
  gates. The child graph SHA-256 is
  `407cfa9ac39d25e2649994d3ce7cd0d80d482ea66ae5e92b5b2e6ce6e47f2f69`.
  That commit froze the then-current replacement; the later fresh recheck rejected it
  as recorded below.
- Fresh reviewer `/root/p6_replacement_audit` rejected exact candidate `f1fbc34...`
  at C0/H0/M2/L0 against manifest SHA-256
  `d7d83a735a80fb906b5b7d41321ac33caff1db6d6fc95a0a07df53bd4b11799a`.
  It confirmed the clean baseline topology and all earlier high-severity remediation,
  but found stale current-state narrative and caller-controlled application timestamps.
  That exact candidate must never be attested or delivered.
- Two fresh cache-bypassed, PII-redacted reads of the Reach Higher and NFU public
  scholarship pages returned provider scrape IDs `01a04e63-c85f-72d9-9cd5-ac252b74bbcb`
  and `01a04e63-cb23-753f-aa63-bca8b35c331e`. The corrected binder validated both
  official hosts, accepted only provider-issued UUIDs, and internally recorded
  `2026-08-29T16:40:30.087Z`. The raw responses were deleted after sanitized receipt
  and hash binding; no application or interactive route was entered.
- The complete fourth-candidate matrix ran from `2026-08-29T16:45:25Z` through
  `2026-08-29T16:46:31Z`: locked install, deterministic P6 check, focused provenance
  regression, typecheck, complete tests, network-permitted production build, and root
  whitespace validation passed. Prospective plan validation reported only the expected
  absent committed P6 manifest/review attestation. The current child graph is
  `d7ae32194b75e27ba796365b7d8b6140b562f34cecbd60adcbf375e7f3cf13cc`.
- A separate prior review process committed local attestation `04a06a6` for rejected
  candidate `077af07` on the original branch while the final fresh review was still in
  progress. It is contradicted by the later C0/H2 decision, is isolated from this
  replacement branch, and must never be pushed, merged, or delivered. No history was
  rewritten and no commit was appended to that attested branch.
- `docs/kickoffs/P7-STUDENT-FACING.md` is prepared as next-stage documentation only.
  P7 is next-permitted in this prospective accepted state but remains strictly
  prohibited in this P6 session and must not start until the P6 attestation is merged
  and verified on live `origin/main`.
- P6 may use bounded public information pages and the minimum required testing-sheet
  read-only input. Spreadsheet writes, production access, forms/application
  interaction, applicant data, provider contact, deployment-configuration changes,
  paid/destructive actions, history rewriting, acceptance-gate weakening, P7, and P9
  remain prohibited.

## P5 delivery (completed)

- PR #20 merged exact P5 attestation `d22c8dd7108338f41192b884227421a00ecf09b5`
  to `main` as `2831ef1ff79c99a0fc4755fe7af7b855d11ebf21` at
  `2026-08-29T04:08:21Z`.
- Kelsey supplied direct informed authority for revision fingerprinting, complete
  reversible backup creation, and approved idempotent writes limited to testing
  spreadsheet `1Dp5AMnrfSQ-Xf-r03S75lKsGPJk7o0inOgvC9Q6lOl4`, tab
  `Master Database`. The durable record is
  `docs/evidence/P5-write-authorization.md`.
- Testing-sheet source revision `222` is pinned, and complete native backup
  `1C2sc2TkqcskFfL_tYqq5yQynUgUHRXd7JpfpCdOt8lQ` is verified. The source and backup
  `Master Database!A1:X1060` native-cell payloads match at SHA-256
  `fc3d3b13052a64972291decae146e354883a4801b0e1575d555e1fabb17f05b9`.
  The guarded write advanced the testing sheet exactly once from revision `222` to
  `223`; the complete revision-222 backup remains the rollback source.
- The remediated pre-write audit is complete across exactly 197 rows and 213 distinct
  CellData sources. The final strict router permits 50 public information-only sources
  and sends 163 application-role/private/form/login/portal sources to no-fetch.
  Firecrawl evidence covers the same 50 static public sources with 48 retrieved and two
  inconclusive.
- Proposed dispositions are zero confirmed, 10 corrected, zero archived, zero merged,
  and 187 manual review. The 10 corrected rows contain 25 cell proposals: 15 material
  corrections plus 10 correction-date stamps. Exact candidate `502b612` received
  independent C0/H0/M0/L0 approval for all 25 proposals.
- The first proposal checkpoint `57d3540` was rejected C0/H3/M2/L0. Its evidence
  reproducibility, unsupported confirmations, routing boundary, row 59 tier collapse,
  and row 167 unsupported opening claim have been remediated. Earlier bounded GETs are
  disclosed; no form submission or applicant collection occurred.
- Replacement `1227321` was rejected C0/H2/M0/L0. Final remediation closed its
  dual-role routing gap and commits row-specific official-page query bindings for both
  Montana Farm Bureau application URLs. The same reviewer rechecked `502b612`, all 10
  mandatory rows, and the deterministic 38-row sample, then approved the complete set.
- The immediate revision/CellData preconditions passed. One 25-request batch applied
  the approved set with 25 replies and zero rejection. Immediate readback reports
  revision `223` with previous revision `222`; all 25 targets match, all 55 untargeted
  edited-window cells are unchanged, link display/formatting is preserved, and the
  whole denominator remains 197 named rows with zero unnamed nonempty rows.
- Durable machine evidence is in `P5-proposal-review.json`,
  `P5-applied-change-receipt.json`, and `P5-postwrite-reconciliation.json`.
- Entry verification reproduced P4's 270 links, four offline methods, 20 cycle cases,
  nine field decisions, five conflicts, 300 reviews, and `522d42a1bb62` link digest.
  Baseline plan/history validation passed all 10 ordered stages.
- Production spreadsheet identity remains unset and every production access or
  mutation remains unauthorized. API/UI work, forms, application interaction,
  provider contact, deployment-configuration changes, paid or destructive actions,
  and history rewriting remain prohibited.
- Rejected final candidate `157daf60cacdd2f729bc422394abf0c77284b53e`
  received C0/H1/M0/L0 against rejected manifest digest `91d17921b51a`. Its technical
  remediation passed, but it incorrectly retained P5 as active, which the two-file
  attestation could not repair. It must never be attested or delivered.
- The same independent reviewer accepted the corrected exact candidate and its
  direct-child attestation; the earlier prospective-only wording is historical and no
  longer controls current state.

## P4 delivery (completed)

- Active stage: none. P4 — Accuracy and verification engine — is accepted, attested,
  and delivered on `origin/main`.
- Final P4 candidate: `4a7eaba0ec84c7d20830b9446576840e80f1e203`.
  Direct-child two-file attestation:
  `b6880e4dd65ab92c10d607766950a1b6c78ba6e0`. Final independent review:
  C0/H0/M0/L0 with no dispositions. Manifest SHA-256:
  `fd31b7d3fa82b7c98c4ed9532a574c0a59cafa0187a6838287e0282587b5c7da`.
- PR #18 merged at `2026-08-27T04:25:50Z` as
  `35c1a6db298c8613502b31187f162cf47d819fc4`, whose parents are exactly the P4
  baseline `268758f94922f90bf307229d8633da05b2417c4a` and attestation `b6880e4`.
- PR CI run `33039273103` passed. Vercel Preview was blocked by the existing
  project-author access rule; no identity, permission, or deployment configuration was
  changed. Main CI run `33039390240` passed, and the merge commit's Vercel status
  reported a completed Production deployment.
- P5 is next-permitted but unstarted. Before any P5 testing-sheet write, require direct
  informed write authority, a verified sheet revision fingerprint, and backup. The
  production spreadsheet remains unset and unauthorized.
- Deferred adjacent issues remain unchanged: the GitHub Actions Node-runtime warning
  and the locked-install denominator of 21 advisories (1 low, 7 moderate, 12 high,
  1 critical). They are not P4 exploitability findings and remain later-stage work.
- The remaining P4 bullets below preserve implementation and review chronology as
  historical evidence; this completed delivery summary is authoritative for current
  state.
- Entry validation confirmed the exact accepted P3 candidate, direct-child
  attestation, manifest, C0/H0/M0/L0 review, PR merge, and clean current machine state.
- P2 schema version `2.0.0`, P3 acquisition report SHA-256
  `b577e6f2ec3b0ad48848e218863060eabd400cbb2f828a2b1aa4c2a8533b00f8`,
  P3 completeness report SHA-256
  `d967119a72f272803cfab5c9a3e22680b5bd7686b69d26a183b1a2578ee89020`,
  and the exact 34-item P3 fixture denominator are pinned P4 inputs.
- Production spreadsheet identity remains unset. Testing and production spreadsheet
  writes are unauthorized, and P5 has not started.
- Baseline `npm ci` installed 565 locked packages. Baseline `npm run plan:check`
  passed for all 10 ordered stage contracts after the restricted runner's local IPC
  socket was permitted.
- First required P4 governance checkpoint: `18f0961`; implementation checkpoint:
  `2fbe817`. Rejected first candidate:
  `2a9daa87b62d60e21d14ed6d4c639f6459ed40ce` at C0/H4/M3/L0, with rejected
  uncommitted manifest digest
  `ee8e919b05e6cd1a5a48e6717ae2173141dc7705bc880192c061456295d77370`.
  It must never be attested or delivered. The replacement will receive a new manifest
  only after it is frozen.
- Rejected first remediated replacement:
  `c26cbb94086601136bfcd3e5dc5ce77716296365` at C0/H3/M1/L0, with rejected
  uncommitted manifest digest
  `e020edad1d56429e125f21a2286c58f84a8f0e0bae23d826bd6da368cfd05853`.
  It also must never be attested or delivered. Its findings cover later-stage P4-check
  compatibility, canonical authority/relationship provenance, DST-fallback ambiguity,
  and URL-equivalent source identity.
- Rejected second remediated replacement:
  `6921ac1403ab24d253d72d23187164b8f6735459` at C0/H4/M2/L0, with rejected
  uncommitted manifest digest
  `1b6835a33d5546499628b2a8d7b9a7ab831c8533a01abf6748ff293981dcf11d`.
  It also must never be attested or delivered. Its findings cover fixture
  self-certification, conflicting relationship bindings, stale provenance, canonical
  URL identity, invalid timezones, and soft application redirects.
- Rejected third-remediation replacement:
  `95b8ead1deb8c293bf5bfee612695ce8f31657c2` at C0/H3/M2/L0, with rejected
  uncommitted manifest digest
  `a2ea71fc76332ab8a9eb69e06309ed8bf9826e5dd9a385090046ff986bb3d5ce`.
  It must never be attested or delivered. Its findings cover residual relationship
  self-certification, missing positive precedence coverage, contradictory directness,
  offline receipt provenance, and unmarked nonredirected application HTML.
- P4 reconciles all 270 historical CellData hyperlink representations, including 92
  hidden application hyperlinks, plus four explicit offline methods. No representation
  was deduplicated or skipped. The deterministic run made no spreadsheet or public-
  source read and does not claim those historical URLs are current.
- Fifteen synthetic target cases yield three reachable, two redirected, two dead
  targets, and eight inconclusive outcomes. Zero network outcomes support award closure
  or archive; the two dead targets are eligible only for link-correction review.
- Twenty date/cycle fixtures yield five active, two closed, two upcoming, one
  unavailable, and ten unknown states. Zero unknown/invalid parse results become
  active. Mixed open/close strings, serials, annual/rolling rules, approximate/month-
  only values, explicit time zones, and year boundaries are covered.
- Sixteen field claims yield 16 complete receipts and nine decisions: zero synthetic
  decisions are accepted, all nine remain review, and five conflicts remain
  non-accepted. No spreadsheet correction is applied.
- Deterministic working-replacement report SHA-256 values: links `522d42a1bb62`,
  cycles `00cf5ed3c434`, field evidence `64ef64820fb6`, conflicts `3d9d1ff8a263`,
  and reviews `d11301f1653b`.
- The final pre-freeze matrix passed from `2026-08-27T02:00:40Z` through
  `2026-08-27T02:02:41Z`: locked install, deterministic P4 check, plan/history
  validation, typecheck, complete tests, permitted network build, and root diff check.
  The restricted build failed only on existing Google Fonts access; no configuration
  changed. This matrix belongs to the rejected first candidate and is not replacement
  acceptance evidence.
- The reviewer findings and completed remediation cover exact verified/accepted-state
  generation, unresolved redirects and unknown successful targets, future exact-time
  windows, runtime-validated canonical Source/Evidence authority binding, duplicate
  identity rejection, fractional spreadsheet-serial times, and year-qualified Annual
  recurrence. Each now has a focused regression; the same reviewer must recheck the
  frozen replacement.
- Second-review remediation additionally permits the permanent P4 check with a later
  active stage, requires canonical classified Source authority and scholarship-link
  Evidence, rejects DST-ambiguous exact local times, and canonicalizes URL aliases
  before identity/uniqueness. Each boundary has an adversarial regression.
- Third-review remediation removes fixture authority/direct self-certification,
  preserves upstream P2/P3 URL identity semantics, rejects duplicate subject bindings
  and stale provenance, fails invalid timezones to unknown, and reviews soft
  application redirects. Synthetic fixture decisions can no longer be accepted.
- Fourth-review remediation removes report-scenario relationship input entirely and
  fixes all report sources to unknown/indirect discovery. Private test-only canonical
  records exercise two positive acceptances and all required official-source precedence
  paths without entering deterministic report evidence. Contradictory directness now
  fails schema validation, offline authority survives into field receipts, and unmarked
  application HTML is reviewable with or without a redirect.
- The replacement pre-freeze matrix passed from `2026-08-27T02:29:43Z` through
  `2026-08-27T02:30:50Z`: exact locked install, deterministic P4 check, plan/history
  validation, typecheck, complete tests, permitted network build, and root diff check.
  The restricted build failed only on existing Google Fonts access. The unchanged
  locked audit denominator is 21; no dependency, lockfile, CI, deployment, spreadsheet,
  or provider change was made. This matrix belongs to rejected candidate `c26cbb9`
  and is historical, not current acceptance evidence.
- The second-remediation replacement matrix passed from `2026-08-27T02:57:11Z`
  through `2026-08-27T02:58:26Z`: exact locked install, deterministic P4 check,
  plan/history validation, typecheck, complete tests, permitted network build, and
  root diff check. The restricted build failed only on existing Google Fonts access;
  the audit denominator remains 21 and no reserved effect occurred. This matrix belongs
  to rejected candidate `6921ac1` and is historical.
- The third-remediation replacement matrix passed from `2026-08-27T03:18:02Z`
  through `2026-08-27T03:19:07Z`: exact locked install, deterministic P4 check,
  plan/history validation, typecheck, complete tests, permitted network build, and
  root diff check. The restricted build failed only on existing Google Fonts access;
  the audit denominator remains 21 and no reserved effect occurred. This matrix belongs
  only to rejected candidate `95b8ead` and is historical.
- One bounded read-only NFU landing-page scrape was recorded at
  `2026-08-27T03:31:51Z` in `docs/evidence/P4-live-observations.json`. It is
  observation-only and digest-pinned; it does not establish any synthetic field claim.
- The fourth-remediation replacement matrix completed through
  `2026-08-27T03:44:56Z`: exact locked install, deterministic P4 check, plan/history
  validation, typecheck, complete tests, permitted production build, and all cumulative
  adversarial regressions passed. The locked audit denominator remains 21; no package,
  lockfile, spreadsheet, form, provider, CI, or deployment configuration changed.
  Final deterministic/plan/type/diff checks passed through `2026-08-27T03:45:44Z`.
  The commit containing this record freezes the replacement; new manifest generation
  and same-reviewer recheck remain required.
- Preliminary-state independent review accepted exact candidate `0adbd79237aefcb489b0278d5cd4c05038eed62a`
  for correction at C0/H0/M1/L0 against manifest digest `cf7a1fc651a1`. The one medium
  finding identified a stale narrative fixture digest while the fixture, manifest, and
  all five reports consistently bound `3607ad0d91d7`. Disposition: corrected the
  narrative digest; owner P4 implementer; target corrected verified-state replacement;
  state completed. P4 remains verified/active until the corrected exact candidate and
  new manifest receive the same reviewer's read-only recheck.
- Corrected verified-state candidate `530df9bf01ba660375b0d04d5ddc2d442e2b5405`
  was independently accepted C0/H0/M0/L0 against manifest digest `dfd5ace395ec`.
  The prior M1, all 15 paths/tree hashes, five report digests, live pin, denominators,
  tests, and P4-only boundaries passed with no remaining disposition. That review binds
  the predecessor only. The same reviewer prospectively accepted the exact P4-only
  accepted-state delta C0/H0/M0/L0, and the user authorized this completion path.
  The resulting exact candidate and regenerated manifest still require final recheck;
  no P5 or spreadsheet effect was authorized.
- The accepted-state candidate matrix ran from `2026-08-27T04:15:45Z` through
  `2026-08-27T04:16:19Z`: locked install, deterministic P4 check, typecheck, complete
  tests, permitted production build, and root diff check passed. Pre-attestation plan
  validation reported only the expected missing P4 manifest and committed review/
  attestation gates. Code, fixtures, reports, and external effects are unchanged.
- `docs/kickoffs/P5-REMEDIATION.md` is prepared as next-stage documentation only. P5
  cannot start until P4 is accepted and delivered and separate direct informed testing-
  sheet write authority plus a verified revision/backup exists.
- P4 external effects: zero spreadsheet reads/writes, one bounded public-source
  landing-page read, zero forms/application interactions, zero applicant values, zero
  provider contacts, zero accepted scholarship corrections/archives/writes, one
  authorized Git merge, and zero dependency, CI, or deployment-configuration changes.

## Historical P3 delivery and replacement-candidate state (completed)

- P3 candidate `9e4230c3012f41f6b70cb47674fdb95dd1de333c` was accepted by
  fresh-context read-only review at C0/H0/M0/L0 with manifest SHA-256
  `1970e8b952dcc4696db31a3282c912fae45b6fe237d400e87794113d3ba419c6`.
- Direct-child attestation `ff058bd727af22c145378588c2d7e54a2f9a880c`
  added exactly `docs/evidence/P3-manifest.json` and `docs/reviews/P3.json`.
- PR #17 merged at `2026-08-27T00:20:49Z` as
  `268758f94922f90bf307229d8633da05b2417c4a`. PR CI run `33026405321`
  passed; the Vercel Preview status failed under the existing author-access rule.
- Main CI run `33026531417` passed. The Vercel status for the merge commit reported
  a completed Production deployment. No deployment configuration, identity, or
  permission was changed.
- P3 is durably accepted and delivered on `origin/main`; the detailed candidate and
  remediation chronology below is preserved as historical evidence.

- Historical pre-delivery snapshot: no stage was active while the first local P3
  acceptance candidate and successive replacements awaited remediation, freeze,
  independent recheck, and direct-child attestation.
- Verified P3 baseline and `origin/main`:
  `2dbacb0a7320e9e1c7a7d29c798d005e25f28ff3`.
- P3 branch: `codex/p3-architecture-aware-acquisition` in an isolated worktree.
- P3 implementation checkpoint:
  `21e085a259cac558fac3689bfade58b0228be27b`.
- Rejected predecessor candidate:
  `f89f61c634318d7b77b3db82ef3084af53f59c61` (C0/H4/M3/L0); it must never be
  attested or delivered. First rejected replacement:
  `6e28ab95a6e707167ff51436a140669369f95a3a` (C0/H2/M0/L0), with rejected
  uncommitted manifest digest
  `c1d83fa89a96dc2d991e3938e032f457318caf165382f20726f7c45e0042bbcb`.
  Second rejected replacement:
  `715a4d32b9d7c292c38eb9034987d6ec6243f8fc` (C0/H2/M0/L0), with rejected
  uncommitted manifest digest
  `1f707dce20fca72c3589ab2e25c97456f7f7bec53fa4ba933dd16f5c91a9641c`.
  Third rejected replacement:
  `118006a8bccdbee91fcce000e56ac958ab938c04` (C0/H2/M0/L0), with rejected
  uncommitted manifest digest
  `0f5334a9c6b4d7c392cc2b53018f899fc21867e7862765f358d59a3b4d9fd0bc`.
  Fourth rejected replacement:
  `50448b0c415d72e7b6ab2f5c9de3f65ee4360f75` (C0/H1/M0/L0), with rejected
  uncommitted manifest digest
  `131ad1a6844bc768125f1d9a3e8a2a879e94524ac22e00a21660b88dd7605ea6`.
  Fifth rejected replacement:
  `415914230aa6ba93258f40d3cf0380f99e76acad` (C0/H1/M0/L0), with rejected
  uncommitted manifest digest
  `43df6c8180ecb2f5365785191250d1675f98a25930e560652332175efa89ea4d`.
  Sixth rejected replacement:
  `ac368e0f2e3c68b13d461aabbfcecd587c96f013` (C0/H1/M0/L0), with rejected
  uncommitted manifest digest
  `92c35ebe60d38c1dbda900d8696e5d46825d317e1da249e4202d75414e7bfb45`.
  No rejected candidate may be attested or delivered. Remediation checkpoints:
  `e805e49`, `d4ee469`, `03421b3`, `5b2fda0`, `dab60c1`, `313c944`, and
  `0a4f2fd`.
- Exact replacement candidate: pending freeze. Its content-derived SHA will be bound in
  `docs/evidence/P3-manifest.json`; a commit cannot embed its own SHA without changing
  that SHA.
- Replacement P3 manifest/review: intentionally absent until the candidate is frozen.
  They must be
  the only two paths added in the exact direct-child attestation.
- Entry verification confirmed that the exact P2 merge, accepted marker, evidence,
  manifest, review, and direct-child attestation are all present in the baseline.
- P2 schema version `2.0.0`, P1 inventory SHA-256
  `3f7dda3cd9d2946a42e8dec16e5a4d3b6240218eda8b4fee0cb42fc7b32aec6a`, and P2
  canonical dataset digest
  `dcbc9a28b093d1f32ec149d7c37b20606ea3108eaa3bdcea1ecc76474cd2d295`
  are the pinned acquisition inputs.
- Baseline `npm ci` installed 565 locked packages and baseline `npm run plan:check`
  passed after the restricted runner's local IPC socket was permitted. No dependency,
  lockfile, spreadsheet, deployment-configuration, form, provider, or production-data
  mutation occurred.
- P3 is authorized under the stage-specific standing mandate recorded in
  `docs/evidence/STANDING-OPERATING-MANDATE.md`. Reserved effects remain excluded.
- P3 implements all 13 architecture routes, selective URL identity, bounded retries,
  hash-linked receipt-ledger resume, thrown-error classification, occurrence-preserving
  single/multi-page and directory parsing, pagination/document parsing, representative
  no-submit public-form reading, explicit access review, and schema-valid unverified P2
  fixture graphs derived only from successful work results. Successful Source URLs
  preserve provider hosts, page parameters, and fragments; receipt history is loaded
  only from an implementation-owned append-only directory that can be reopened after
  interruption and whose receipts require a runtime-held HMAC integrity key. Form
  labels/titles use only direct structural text or explicit accessible-name attributes,
  so descendant custom-control response text is never recorded.
- Deterministic fixture denominator: 34 work items; 34 processed, 27 successful, seven
  explicit failure/review outcomes, zero unaccounted remaining. All seven failures have
  a canonical Source, Evidence item, and Review Item.
- Fixture graph totals: 45 Sources, 27 Scholarships, six Application Groups, 27 Cycles,
  105 Evidence items, and 105 Review Items. All evidence remains unverified and every
  cycle remains unknown for P4.
- Acquisition report SHA-256:
  `b577e6f2ec3b0ad48848e218863060eabd400cbb2f828a2b1aa4c2a8533b00f8`;
  completeness report SHA-256:
  `d967119a72f272803cfab5c9a3e22680b5bd7686b69d26a183b1a2578ee89020`.
- Three bounded public landing pages were read with Firecrawl at
  `2026-08-26T22:38:00Z` for architecture observations only: NFU, FVCC AcademicWorks,
  and FIRST. No child crawl, form/application interaction, authentication, factual
  acceptance, spreadsheet access, or provider contact occurred.
- `docs/kickoffs/P4-VERIFICATION.md` is prepared as the next-stage contract only. P4
  has not started and may not start until P3 acceptance is delivered on `origin/main`.
- The rejected predecessor's matrix passed through `2026-08-26T22:47:06Z`: locked install,
  deterministic acquisition check, plan/history validation, typecheck, complete tests,
  permitted network build, and root diff check. The restricted build failed only on
  existing Google Fonts network access; no configuration changed. Exact UTC windows and
  outcomes are historical in `docs/evidence/P3.md` and are not replacement acceptance
  evidence. It is not replacement acceptance evidence.
- The first replacement matrix passed through `2026-08-26T23:09:19Z`: exact locked
  install, deterministic acquisition check at `abca542965bd`, typecheck, complete tests,
  permitted network build, and root diff check. Prospective plan validation reported
  exactly the expected missing P3 manifest/review attestation and no other error. Exact
  UTC windows and outcomes are historical in `docs/evidence/P3.md`; that candidate was
  rejected and the final replacement matrix is pending.
- The second replacement matrix passed through `2026-08-26T23:22:29Z`: exact locked
  install, deterministic acquisition check at `2a826bde49be`, typecheck, complete
  tests, permitted network build, and root diff check. Prospective plan validation
  reported exactly the expected missing P3 manifest/review attestation and no other
  error. That candidate was rejected; exact UTC windows are historical in
  `docs/evidence/P3.md`.
- The third replacement matrix passed through `2026-08-26T23:35:06Z`: exact locked
  install, deterministic acquisition check at `2a826bde49be`, typecheck, complete
  tests (including nested-response and restart-resume regressions), permitted network
  build, and root diff check. Prospective plan validation reported only the expected
  missing P3 manifest/review attestation. That candidate was rejected; final replacement
  verification is pending.
- The fourth replacement matrix passed through `2026-08-26T23:47:02Z`: exact locked
  install, deterministic acquisition/completeness checks, typecheck, complete tests
  including authenticated-rewrite and custom-control response regressions, permitted
  network build, and root diff check. Prospective plan validation reported only the
  expected missing P3 manifest/review attestation. That candidate was rejected; final
  replacement verification is pending.
- The fifth replacement matrix passed through `2026-08-26T23:55:55Z`: exact locked
  install, deterministic acquisition/completeness checks, typecheck, complete tests
  including the custom-control heading boundary, permitted network build, and root
  diff check. Prospective plan validation reported only the expected missing P3
  manifest/review attestation. That candidate was rejected; final replacement
  verification is pending.
- The sixth replacement matrix passed through `2026-08-27T00:02:58Z`: exact locked
  install, deterministic acquisition/completeness checks, typecheck, complete tests
  including the document-title-only form boundary, permitted network build, and root
  diff check. Prospective plan validation reported only the expected missing P3
  manifest/review attestation. That candidate was rejected; final replacement
  verification is pending.
- The seventh replacement matrix passed through `2026-08-27T00:10:09Z`: exact locked
  install, deterministic acquisition/completeness checks, typecheck, complete tests
  including nested question-candidate ancestry non-collection, permitted network
  build, and root diff check. Prospective plan validation reported only the expected
  missing P3 manifest/review attestation. Exact UTC windows are recorded in
  `docs/evidence/P3.md`; only this result record remains to be frozen before manifest
  binding and reviewer recheck.
- The immutable replacement candidate, complete manifest, reviewer recheck, and exact
  direct-child attestation are still pending. Until delivery, P3 is not durably complete
  on `origin/main` and P4 remains prohibited in this session.

### Deferred platform and dependency issues (carried into P4)

- **Vercel Preview:** PR #17's Preview deployment was attempted and blocked by the
  existing `Franscale1922` project-access rule. PR/main CI and the Production
  deployment completed. No identity, permission, or deployment configuration was changed. Owner:
  repository/Vercel administrator. Target: resolve through separately authorized
  access administration before a Preview result becomes an acceptance dependency.
- **GitHub Actions Node runtime:** post-merge run `33018750958` passed but annotated
  that Node.js 20 action runtimes are deprecated and `actions/checkout@v4` plus
  `actions/setup-node@v4` were forced onto Node.js 24. Owner: repository maintainer.
  Target: a separately reviewed operational-governance update before the warning
  becomes a CI failure; P3 does not change CI configuration.
- **Dependency audit:** the locked install still reports 21 time-sensitive advisories
  (1 low, 7 moderate, 12 high, 1 critical). This is an audit denominator, not an
  exploitability finding. Owner: P7 implementation/reviewer. Target: P7's required
  dependency/security audit and exposure review; P3 applies no upgrade or audit fix.

## Historical P2 delivery integration state (completed)

- Exact P2 delivery integration completed and merged through PR #16 at
  `2dbacb0a7320e9e1c7a7d29c798d005e25f28ff3` on 2026-08-26.
- Its exact two-parent candidate used delivered Revision 6
  `322a2b85ba32b6255e0f24a1482c0a6a26dd2b7f` as first parent and immutable P2
  attestation `cc277b34075f6d648ff3c71022fadf6a6c632b34` as second parent.
- Preserved P2 candidate:
  `1a6376207eb467ff0977298de16a1c0d0db1b3cd`; preserved P2 manifest SHA-256:
  `4d47d562e26efe249f6a7be0ed656f1fddc1a17233378254772019cacd49ee8a`.
- Delivery candidate `147513a` and direct-child attestation `0655da7` were
  independently accepted C0/H0/M0/L0. PR CI and post-merge main CI passed; Vercel
  Production completed. The blocked Preview result is carried above.
- The reviewed integration reconciled only `docs/BUILD_STATE.json`, this handoff, and
  the deterministic `web/package.json` union. It preserved every Revision 6 test
  command and added only exact P2 model scripts and its missing test command.
- P2 is durably accepted and delivered. Its historical pre-freeze checks, constrained
  runner behavior, and exact package/state proofs remain preserved in P2 delivery
  evidence and review records.
- Production spreadsheet identity remains unset and all spreadsheet mutation remains
  unauthorized.

## Historical Revision 6 pre-delivery state (completed)

- Active stage: none; P3 must not start.
- Verified delivered Revision 5 `origin/main` and Revision 6 baseline:
  `cc7760d51f1460728e85a9b1fc0921d30320a541`.
- Revision 5 exact clean-clone candidate:
  `a9b656b93cfa398a2badd1c1ef3f61f860979ac3`.
- Revision 5 canonical delivered attestation:
  `06d9e3ff4bcfff8b0fe0b2bc728ed8aeb9320000`.
- Revision 5 merged through PR #14 at `2026-08-25T22:37:58Z`; PR CI and post-merge
  main CI passed, Vercel Production completed, and Preview was blocked by the existing
  Franscale1922 project-access rule. No deployment configuration changed.
- Revision 6 branch: `codex/plan-rev6-p2-package-resolution`.
- Revision 6 candidate and attestation: pending freeze, independent review, and exact
  direct-child two-file attestation.
- The candidate cannot embed its own content-derived SHA. After freeze, the complete
  uncommitted manifest will bind that exact SHA for independent review; changing this
  handoff afterward would create a replacement candidate.
- Exact P2 candidate: `1a6376207eb467ff0977298de16a1c0d0db1b3cd`.
- Exact P2 attestation: `cc277b34075f6d648ff3c71022fadf6a6c632b34`.
- P2 manifest SHA-256:
  `4d47d562e26efe249f6a7be0ed656f1fddc1a17233378254772019cacd49ee8a`.
- A clean P2 merge from `cc7760d` was attempted without committing. It produced the
  expected conflicts in `docs/BUILD_STATE.json` and this handoff plus a substantive
  `web/package.json` conflict. The merge was safely aborted; no P2 integration commit,
  review, attestation, push, PR, merge, or deployment occurred.
- On 2026-08-26 Kelsey Stuart explicitly authorized Plan Revision 6 to add only
  `web/package.json` as P2's third integration-resolution path, preserve every Revision
  5 test command, and add only P2's exact model scripts and test command. The authority
  covers Revision 6 review/attestation/Git/Vercel delivery and subsequent exact P2
  delivery, with all recorded exclusions unchanged.
- Production spreadsheet ID remains unset; all spreadsheet mutation remains
  unauthorized. No product/runtime, CI, deployment-configuration, form, provider, P9,
  production-data, paid/destructive, or P3 effect is in scope.
- Revision 6 pre-freeze verification passed from `2026-08-26T15:24:58Z` through
  `2026-08-26T15:26:21Z`: locked install, non-incremental typecheck, complete tests,
  production build, and root diff check all passed. Prospective plan validation
  reported exactly the expected missing Revision 6 manifest, review, and committed
  attestation. Exact command outcomes and the unchanged audit denominator are recorded
  in `docs/evidence/PLAN-REV6.md`.

## Plan Revision 6 amendment

The Revision 4 P2 integration allowlist permitted only `BUILD_STATE` and the handoff.
That was sufficient before Revision 5, but frozen P2 and delivered Revision 5 now both
change `web/package.json`: P2 adds `p2:model`, `p2:model:check`, and its model test,
while Revision 5 adds governance-history tests. Taking either merge side would discard
an accepted test gate.

Revision 6 permits `web/package.json` only for exact P2 and validates a deterministic
result reconstructed from both immutable parents. The result starts with the complete
delivered baseline package, preserves every field and existing test command, copies
only P2's exact two model scripts, and appends only P2's missing model-test command.
Dependencies, lockfiles, metadata, other scripts, and arbitrary conflict resolution are
forbidden. Dedicated tests reject omission of either governance or P2 tests, mutation
of P2 commands, and unrelated package changes.

Historical Revision 6 next actions (completed or superseded):

1. Complete Revision 6 evidence and full verification, freeze the exact candidate,
   generate its complete manifest, obtain fresh-context read-only acceptance, and add
   only the manifest/review direct-child attestation.
2. Push, open, verify, and merge Revision 6; verify Preview/Production outcomes.
3. Rebuild exact P2 with delivered Revision 6 `origin/main` as first parent and exact
   `cc277b3` as second parent. Resolve only `BUILD_STATE`, this handoff, and the exact
   deterministic `web/package.json` union.
4. Run the complete P2 matrix, freeze, manifest, obtain a separate fresh review,
   attest, push, open, verify, and merge P2. Stop before P3.

## Historical Revision 5 candidate state

- Active stage: none; P3 must not start
- Verified delivered Revision 4 baseline and current `origin/main`:
  `08cb6809425036991400b539ca23a34915b3fe26`
- Current replacement Revision 5 branch: `codex/plan-rev5-standing-mandate-ci`
- Preliminary Revision 5 candidate `4f034bb5eaedb64c16f76665aaf6057c2565416c`
  was independently rejected C0/H1/M0/L0 because its presence-only guard was not
  durably bound to immutable history. It must never be attested or delivered.
- First accepted replacement candidate `17dd49f2e2b2b96e628df802f2562479dcf435db`
  and direct-child attestation `ec1737670be24e23ada3f377eb75c34b1747898c`
  remain byte-for-byte on the first delivery branch. PR #13 was not merged because a
  clean GitHub runner lacked the unpublished P2 object required by the new test.
- Clean-clone replacement Revision 5 candidate: pending freeze. Its exact post-freeze SHA will be bound by
  `docs/evidence/PLAN-REV5-manifest.json`; a commit cannot embed its own content-derived
  identity.
- Revision 5 attestation: pending; it must be the candidate's direct child and add
  exactly `docs/evidence/PLAN-REV5-manifest.json` and
  `docs/reviews/PLAN-REV5.json`.
- Preliminary P2 integration `6ff2acb83c75c254f559192ebdd23bc75eb4e10e` is local,
  unpublished, unreviewed, unattested, and invalid for delivery because the required
  history regression test exposed a latest-state equality defect. It will be rebuilt
  cleanly from delivered Revision 5 `origin/main`.
- Accepted P2 candidate: `1a6376207eb467ff0977298de16a1c0d0db1b3cd`
- Canonical P2 attestation: `cc277b34075f6d648ff3c71022fadf6a6c632b34`
- P2 manifest SHA-256:
  `4d47d562e26efe249f6a7be0ed656f1fddc1a17233378254772019cacd49ee8a`
- P2 delivery: directly authorized but integration pending; P2 is not yet delivered to
  `origin/main`. Candidate and attestation remain byte-for-byte unchanged.
- Preserved P1 candidate: `92ee21095e959bd19ab641752308c0fd9b394b22`
- Preserved P1 attestation: `20476b8384cfbda6aaa04a3da4b7f0a3fbd291e5`
- P1 delivery integration candidate:
  `464eece0c05c97e014cca0955f0ab92998c1d97c`
- P1 delivery attestation:
  `e4541a9b845758309031f00cd1958c96b4de4a27`
- P1 delivery merged through PR #10 at
  `be6644f5140c35de2075fa24782f81bf0449f0f6`
- Plan Revision 3 candidate: `7e38c61dc0e08190ddb72a55bae109895831d94b`
- Plan Revision 3 attestation: `3f2cbfee112b15c1ce0a690ce838080f4cffcd84`
- Plan Revision 3 merged through PR #11 at
  `6a6d64339d44cbede99acfd5a3966781f1f9c4f6`
- Delivery candidate identity: this exact two-parent merge commit. A commit cannot
  embed its own content-derived SHA without changing that SHA; after freeze, the
  authoritative exact SHA is bound in `docs/evidence/P1-delivery-manifest.json` and
  rechecked in `docs/reviews/P1-delivery.json`. Rejected predecessor candidate
  `354acea210fe60ffc21d68deff94716561b5427d` is not authorized for delivery.
- Durable P1 completion gate: satisfied; exact preserved P1 history and the accepted
  delivery integration are present on `origin/main`
- Verified P1 baseline: `d374247156e3ed15d19c037473da8f76ceedb6ab`
- Production spreadsheet: unset; mutation unauthorized
- Revision 4 candidate: `8881085e668bd268f92c6b1dc835eb4e194e6fd2`
- Revision 4 attestation: `fb82df5a20e0eb7ce7cb0830e40709b6ca4f81fd`
- Revision 4 merged through PR #12 at `08cb6809425036991400b539ca23a34915b3fe26`;
  PR/main CI passed and Vercel Production completed. Preview was attempted but blocked
  by the existing Vercel author-access rule; no configuration changed.
- External data, product, or deployment-configuration mutations during Revision 5: none

## Historical Plan Revision 5 amendment (delivered)

Revision 5 fixes only the regression test's invalid assumption that current state must
differ from every historical delivery state. The newest exact delivery candidate may
correctly be current state; older states may differ after later evolution. The revised
test rejects deletion, downgrade, and rebinding for every accepted integration,
revalidates every immutable historical candidate, rejects historical mutation, and
adds a prospective latest-equality case. Production validator behavior and acceptance
criteria do not change for delivery history. The replacement validator independently
discovers canonical plan amendments from their Git attestations, rejects revision
rollback and amendment removal/change, and binds every field of the P3-P8 standing
authorizations plus the exact mandate evidence blob to the immutable Revision 5
candidate. Revision 5 has no revocation path; any future revocation or supersession
requires separately informed authority and a new reviewed machine mechanism.

Revision 5 also records Kelsey's approved standing operating mandate. After P2 is
delivered, P3-P8 may proceed in order without repeated authorization for ordinary
stage-scoped implementation, fresh review, commits, push, pull request, merge, and
resulting Vercel deployments. Public pages/documents and the pinned testing spreadsheet
may be read only when the active stage requires bounded input. Individual P3-P8
delivery records in `BUILD_STATE` bind the shared authority evidence.

Reserved effects still require new direct authority: any spreadsheet write; P9 or
production spreadsheet identity/access/migration; deployment-configuration or schedule
changes; paid/destructive actions; secrets; force-push or published-history rewrite;
forms/application interactions; provider contact; gate weakening; and material scope
expansion. P5 cannot perform its required writes, and P8 cannot configure schedules,
under the standing mandate alone.

Revision 5 must be verified, frozen, independently accepted, attested, and delivered
before the P2 integration is rebuilt. P3 remains prohibited until exact P2 is delivered
on verified `origin/main`.

Pre-freeze verification completed through `2026-08-25T21:59:46Z`; the only subsequent
candidate changes are this durable handoff record and its matching evidence record.
`npm ci`, typecheck, and the complete test suite passed. The strengthened history test
covered a two-integration fixture, every deletion/downgrade/rebind case, prospective
latest-state equality, later non-integration evolution, exact historical candidates,
and historical mutation rejection. Prospective plan validation reported only the three
expected absent Revision 5 manifest/review/attestation gates. The restricted build
failed only on existing Google Fonts network access; the authorized retry passed and
changed no configuration. `git diff --check` passed. `HEAD` and `origin/main` were exact
`08cb680`; exactly nine Revision 5 paths were dirty at `2026-08-25T22:00:12Z`, and no
remote Revision 5 branch existed. After the final mandate-presence validator guard was
added, typecheck, the full suite, prospective plan validation, and the production build
passed again with the same
expected pre-attestation result. Exact UTC windows and outcomes are in
`docs/evidence/PLAN-REV5.md`.

The same fresh reviewer rejected preliminary candidate `4f034bb` at
`2026-08-25T22:09:15Z`, C0/H1/M0/L0, because the standing mandate was not yet
historically immutable. The implementation agent remediated that finding without
attesting or delivering the rejected candidate. Replacement typecheck, the complete
test suite, and prospective plan validation ran from `2026-08-25T22:16:30Z` through
`2026-08-25T22:16:54Z`: typecheck/tests passed, including every new governance-history
case, and plan validation reported only the expected missing review/attestation. The
network-enabled build passed from `2026-08-25T22:16:00Z` through
`2026-08-25T22:16:26Z`; `git diff --check` passed. The replacement has twelve candidate
paths and one uncommitted manifest path pending regeneration against the frozen SHA.

The reviewer then accepted exact candidate `17dd49f` at
`2026-08-25T22:21:36Z`, C0/H0/M0/L0, and exact attestation `ec17376` was pushed in PR
#13. Vercel Preview was blocked by the existing author-access rule. GitHub Actions run
`32905946430` failed the delivery-history test at `2026-08-25T22:24:41Z` because its
clean clone did not contain unpublished P2 candidate `1a63762`; the PR was not merged.
The production validator already handles an unreachable pending object and will require
the exact object when the later two-parent integration makes it reachable. The clean
replacement test uses exact P2 state when available and a deterministic accepted-stage
fixture otherwise. The failed branch remains unchanged and will not be force-pushed or
merged; no deployment configuration changed.

On the clean replacement, `npm ci` installed the same 565 locked packages with the
unchanged audit result. Typecheck, the full suite, and prospective plan validation ran
from `2026-08-25T22:28:18Z` through `2026-08-25T22:28:39Z`: typecheck/tests passed,
including the always-exercised portable latest-state fixture and locally reachable exact
P2 path, while plan validation reported only the expected missing manifest, review, and
attestation. The network-enabled build and `git diff --check` passed through
`2026-08-25T22:29:08Z`. The complete replacement remains confined to the same twelve
authorized governance, validator, test, evidence, and handoff paths.

Historical Revision 5 next actions (completed or superseded by Revision 6):

1. Complete replacement Revision 5 verification, freeze its candidate, regenerate the complete
   manifest, obtain fresh-context read-only acceptance, and create the direct-child
   two-file attestation.
2. Push, open, verify, and merge Revision 5 under the approved Git/Vercel authority.
3. Create a new clean P2 integration branch from delivered Revision 5 `origin/main`;
   use exact `cc277b3` as second parent and reconcile only `BUILD_STATE` and this
   handoff.
4. Run the complete P2 matrix, freeze, manifest, obtain a separate fresh review, attest,
   push, open, verify, and merge P2. Stop before P3.

## Historical Plan Revision 4 amendment (completed)

Revision 4 enables the existing independently reviewed delivery-integration mechanism
only for exact P2 candidate `1a63762` and exact attestation `cc277b3`. It preserves both
commits, their manifest and review, and all prior P0/P1/Revision 2/Revision 3 history
byte-for-byte. The amendment changes only governance and documentation.

Kelsey Stuart directly authorized the amendment's commits, independent review, push,
pull request, merge, and resulting Vercel Preview and Production deployments. After
Revision 4 is delivered, Kelsey directly authorized the exact P2 integration's push,
pull request, merge, and resulting Vercel deployments. The authority excludes P3
implementation, spreadsheet access or writes, product or deployment-configuration
changes, form submissions, application interactions, and provider contact.

The Revision 4 request for a future preauthorization mechanism was not treated as
unbounded authority. Revision 5 now records the separately approved bounded mandate;
its current terms above supersede this historical pending statement.

P2's fresh-context reviewer accepted exact candidate `1a63762` against baseline
`6a6d643` with critical 0, high 0, medium 0, low 1. The sole low finding was stale
August 24 provenance headers in the frozen P2 governance documents. Its disposition is
to correct them in the first authorized P3 candidate governance update after P2 is
delivered and P3 entry authority is satisfied; it does not authorize starting P3.

Pre-freeze verification completed through `2026-08-25T17:06:16Z`; the only subsequent
candidate changes are this durable handoff record and its matching evidence record.

- `npm ci`: passed with 565 locked packages. The unchanged time-sensitive audit
  reported 21 findings (1 low, 7 moderate, 12 high, 1 critical); no dependency or
  lockfile changed.
- `npm run typecheck` and the complete `npm test` suite passed, including the exact P1
  digest and historical integration deletion/downgrade/rebind regression.
- Prospective `npm run plan:check`: after a restricted `tsx` IPC failure, the permitted
  retry reported exactly the three expected absent Revision 4 manifest, review, and
  committed-attestation errors.
- `npm run build`: the restricted attempt failed only on existing Google Fonts network
  access; the network-enabled retry passed and changed no configuration.
- `git diff --check`: passed.
- `HEAD` and `origin/main` were exact `6a6d643`; exactly seven Revision 4 paths were
  dirty and no remote Revision 4 branch existed.

Exact UTC command windows and outcomes are in `docs/evidence/PLAN-REV4.md`.

Historical Revision 4 next actions (completed or superseded by Revision 5):

1. Complete verification, freeze Revision 4, generate its complete manifest, obtain a
   fresh-context read-only review, and add only its manifest/review in the direct-child
   attestation.
2. Push, open, verify, and merge the authorized Revision 4 delivery.
3. From delivered Revision 4 `origin/main`, create the exact two-parent P2 integration
   with `cc277b3` as second parent; reconcile only `BUILD_STATE` and this handoff.
4. Complete checks, manifest, a separate fresh review, and the direct-child P2 delivery
   attestation; then push, open, verify, and merge the authorized P2 delivery.
5. Verify CI and Vercel effects. Do not start P3.

## Plan Revision 3 delivery

Revision 3 was independently accepted with zero findings, attested in exact direct-child
commit `3f2cbfe`, and merged through PR #11. Main CI passed. The authorized Vercel Preview
attempt was blocked by the existing author-access condition; no configuration or
provider change was made. Vercel Production deployment `6074576943` completed
successfully at `https://web-65cdpbnfc-whitefishscholarships-projects.vercel.app`.
The amendment now validates P1's exact derived integration state from its immutable
delivery candidate and prevents deletion, downgrade, or rebinding of historically
accepted integrations.

## Plan Revision 2 delivery integration

The delivered integration preserves P1 candidate `92ee210`, attestation `20476b8`, and
every non-governance P1 blob byte-for-byte. Its exact two-parent candidate, independent
review, direct-child delivery attestation, PR/main CI, and Production deployment all
completed. The Vercel Preview attempt was blocked by the existing author-access rule;
no configuration or provider change was made.

## P2 implementation result

P2 defines Zod-validated schema version `2.0.0` for Source, Scholarship, Application
Group, Cycle, Evidence, and Review Item. Stable identifiers use deterministic SHA-256
over versioned typed identity components.

The read-only P1 compatibility adapter:

- binds all 197 records without changing the pinned input;
- maps 176 `Scholarship` rows to distinct awards and keeps 21 `Portal` rows as
  non-award source-record bindings;
- preserves 213 URL sources, creates four explicit offline sources, and preserves all
  278 information/application role occurrences with provenance;
- creates 176 explicit unknown cycles instead of inventing dates, status, time zone,
  precision, or recurrence;
- represents three common/matching application groups without claiming unseen children
  or unverified supplement behavior;
- preserves 162 unknown records, 121 unknown sources, 188 manual-review records, 207
  manual-review sources, 26 shared-source groups, and all 15 identity-bearing
  query/fragment source identities;
- round-trips all retained P1 record fields and references exactly; and
- maps all 15 student-facing fields while explicitly leaving the 11 fields excluded
  from P1 unavailable rather than fabricating values.

The deterministic canonical dataset digest is
`dcbc9a28b093d1f32ec149d7c37b20606ea3108eaa3bdcea1ecc76474cd2d295`.

The replacement preserves raw and normalized forms for every previously lossy
eligibility/renewal field, binds Evidence IDs to complete observation identity, and
uses the schema version in every stable identifier. Duplicate-name review items now
attach to resolvable row identities. The 12 scenario fixtures contain linked Source,
Scholarship, Application Group, Cycle, Evidence, and Review Item records rather than
taxonomy labels alone.

P2 changed only model/adapter code, sanitized fixtures, deterministic generated
evidence, tests, package scripts, governance state/handoff, and the P3 kickoff. It does
not change runtime routes, API/UI behavior, connectors, acquisition, dependencies,
lockfile, CI, or deployment configuration.

## P1 result

The deterministic P1 inventory accounts for every populated record and every retained
information/application URL in the pinned snapshot:

- 197 records: 176 `Scholarship`, 21 `Portal`
- 278 URL-role occurrences: 86 information and 192 application
- 213 distinct sanitized URLs across 115 hosts
- 193 records with at least one URL and four explicit offline/campus/provider methods
- 74 records with multiple linked sources
- 26 shared normalized URL groups
- 86 information and 92 application hyperlinks visible only through CellData metadata
- 270 raw CellData hyperlink representations before filtering: 267 bound to retained
  information/application references and three sanitized excluded-Summary review items
- 162 records and 121 sources classified explicitly as `unknown`; 188 records and 207
  sources remain manual review with evidence/confidence provenance
- 15 sources retaining a potentially identity-bearing query or fragment after known
  tracking parameters were removed
- deterministic inventory digest:
  `dc373a09d062ae6e5e03347ab391291ecc3dea427f90a21132e89cad113393e2`

These counts exactly reconcile the plan's 197-row and 213-distinct-URL observations.
The report does not infer that one successful public fetch proves source completeness,
current scholarship facts, or production behavior.

## Candidate artifacts

- `web/fixtures/p1/master-database-cell-data.json` — sanitized bounded snapshot
- `web/fixtures/p1/public-source-observations.json` — seven representative read-only
  public observations with scope limitations
- `web/scripts/p1-capture-sheet.ts` — exact-ID, exact-range, read-only capture tool
- `web/scripts/p1-inventory-lib.ts` and `web/scripts/p1-inventory.ts` — deterministic
  inventory implementation
- `web/scripts/test-p1-inventory.ts` — count, completeness, sanitization, and repeat-run
  tests
- `docs/evidence/P1-inventory.json` — full sanitized deterministic report
- `docs/evidence/P1-repository-map.md` — static behavior map with file/line evidence
- `docs/evidence/P1-dependency-security.json` — time-stamped runtime/development audit
  baseline without package changes
- `docs/evidence/P1.md` — stage evidence and external-effects record
- `docs/kickoffs/P2-DATA-MODEL.md` — next-stage contract only; P2 was not executed

`docs/evidence/P1-manifest.json` and `docs/reviews/P1.json` were intentionally absent
from implementation candidate `92ee210`, then added as the only two paths in exact
direct-child attestation `20476b8`. The delivery integration preserves both blobs.

## P2 artifacts

- `web/src/lib/canonicalModel.ts` — versioned schemas, ID rules, compatibility adapter,
  and exact legacy round trip
- `web/fixtures/p2/model-scenarios.json` — 12 linked canonical graph fixtures covering
  all 13 taxonomy values
- `web/fixtures/p2/legacy-field-map.json` — all 15 current student-facing fields with
  raw, typed, unknown, and unparseable compatibility cases
- `web/scripts/p2-data-model.ts` — deterministic migration dry run and evidence check
- `web/scripts/test-p2-data-model.ts` — model, identity, relationship, and loss tests
- `docs/evidence/P2-dry-run.json` and `docs/evidence/P2-compatibility.json` —
  machine-readable reconciliation and compatibility evidence
- `docs/evidence/P2.md` — stage evidence pending final verification details
- `docs/kickoffs/P3-ACQUISITION.md` — next-stage contract only; P3 was not executed

## Verification and review

P2 verification to date:

- Clean replacement baseline `6a6d643` matched exact `origin/main`; P1 accepted history
  and Plan Revision 3 manifest/review attestation were present.
- `npm ci` passed with 565 packages and the unchanged time-sensitive audit result of 21
  findings (1 low, 7 moderate, 12 high, 1 critical).
- Baseline `npm run plan:check` passed for all 10 stage contracts.
- `npm run p2:model` generated deterministic evidence.
- Final predecessor `npm run p2:model:check` passed after the explicit source-link
  schema addition with digest `727f8615f54484f2499ed12f0e95354d6a800fdd05c428b4ab225fb9a0f667d1`.
- Typecheck and the focused predecessor P2 test passed after explicit source
  relationships were added, with digest `727f8615f54484f2499ed12f0e95354d6a800fdd05c428b4ab225fb9a0f667d1`.
- One full test run exposed an incorrect test expectation of eight Whitefish Education
  Foundation children; the pinned P1 shared group correctly contains nine. The test now
  derives its expectation from the pinned group, and the focused rerun passed.
- The final Revision 3-aware matrix passed through `2026-08-25T01:31:32Z`: locked
  install, model check, plan validation, typecheck, complete test suite, production
  build, and diff check. Exact UTC windows are recorded in `docs/evidence/P2.md`.
- Fresh reviewer `/root/p2_independent_review` rejected exact candidate `658f07d` at
  `2026-08-25T01:43:19Z` with critical 0, high 3, medium 2, low 0: five fields lost
  raw values; evidence observations could collide; scenarios were descriptors rather
  than model graphs; several IDs were not version-bound; and one duplicate-name review
  subject did not resolve. Manifest SHA-256 was
  `3b9e2d06b586a7663d0d925a1c92652b013f655b9b41bc1347b691986c0c1902`.
- The replacement fixes all five findings. Its regenerated dataset has 572 Evidence
  records, 592 resolvable Review Items, and digest
  `dcbc9a28b093d1f32ec149d7c37b20606ea3108eaa3bdcea1ecc76474cd2d295`.
  The post-freeze replacement manifest bound its exact identity.
- The same reviewer technically accepted exact candidate `9aebc85` at
  `2026-08-25T02:11:32Z` with C0/H0/M0/L0 and independently confirmed all five fixes,
  denominators, deterministic digest, linked fixtures, relationship resolution,
  12-path manifest, historical preservation, and scope boundaries. Exact reviewed
  manifest SHA-256 was
  `48ba326da8410118a87e86f39527ab55fdb7d9bda80dcc72fd23c0a8e60a468a`.
- The user then explicitly authorized the local P2 acceptance-marker transition,
  exact final review, and direct-child two-file attestation. No delivery or P3 work was
  authorized.
- Replacement pre-freeze verification passed through `2026-08-25T02:02:44Z`: locked
  install, model check, Revision 3-aware plan validation, typecheck, complete tests,
  production build, and diff check. Exact UTC windows and outcomes are recorded in
  `docs/evidence/P2.md`.

P1 historical verification and review:

- Development checks reproduced the inventory digest and exact counts.
- `npm ci` completed with the locked dependency tree. The audit snapshot reported 21
  total findings and 16 production findings; this is time-sensitive registry evidence,
  not proof of exploitability. No dependency or lockfile changed.
- P1-focused deterministic tests and TypeScript typechecking passed after the final
  sanitizer/classification correction.
- The first fresh-context read-only review rejected candidate `0e17291` with two high
  findings. The implementation agent added a pre-filter CellData completeness receipt
  and removed unsupported taxonomy promotion; only the replacement candidate's recheck
  can accept P1.
- The complete candidate verification matrix and exact timestamps are recorded in
  `docs/evidence/P1.md`; the final accepted reviewer outcome is authoritative only in
  `docs/reviews/P1.json`, bound to `docs/evidence/P1-manifest.json`.
- Exact attestation `20476b8` satisfies the original P1 manifest/review gate. Plan
  Revision 2 adds a separate delivery manifest/review gate for this integration.

### Delivery integration verification

The replacement delivery candidate was prepared only after the following pre-freeze
verification of its complete tree. The only subsequent candidate change is this
handoff's durable record of those results; the manifest binds the resulting exact
commit SHA and every changed blob for the independent recheck.

- `npm ci` from `web/`: passed from `2026-08-24T19:44:08Z` through
  `2026-08-24T19:44:16Z`; 565 locked packages installed and 21 time-sensitive audit
  findings reported (1 low, 7 moderate, 12 high, 1 critical). No dependency or
  lockfile change was made.
- `npm run typecheck` from `web/`: passed between `2026-08-24T19:44:22Z` and
  `2026-08-24T19:44:28Z`.
- `npm test` from `web/`: passed between `2026-08-24T19:44:22Z` and
  `2026-08-24T19:44:28Z`, including P1 inventory digest
  `dc373a09d062ae6e5e03347ab391291ecc3dea427f90a21132e89cad113393e2`.
- `npm run build` from `web/`: the restricted-network attempt from
  `2026-08-24T19:44:32Z` through `2026-08-24T19:44:52Z` failed only because Google
  Fonts could not be fetched; the authorized network-enabled retry passed at
  `2026-08-24T19:45:18Z`. It reported the existing missing Google service-account and
  sheet environment variables during static generation and changed no configuration.
- `git diff --check` from the repository root: passed at
  `2026-08-24T19:45:25Z`.
- Prospective `npm run plan:check` from `web/`: after a restricted local IPC attempt
  failed with `EPERM`, the authorized retry completed at `2026-08-24T19:45:36Z` and
  reported exactly the three expected pre-attestation errors: missing
  `docs/reviews/P1-delivery.json`, missing committed delivery attestation, and branch
  tip not yet equal to that attestation. No other plan error was reported.

Repository state observed at `2026-08-24T19:45:25Z`:

- `origin/main` was exact
  `015128616ffac9b453f8712f96c73530fbd9d805`.
- Local branch `codex/p1-delivery-integration` had no published remote branch or pull
  request and was four commits ahead of `origin/main` through rejected predecessor
  `354acea`.
- No tracked file was dirty before this handoff remediation. The only untracked path
  was the prepared, not-yet-attested `docs/evidence/P1-delivery-manifest.json`; it must
  be regenerated against the replacement candidate before review.
- The first delivery review rejected `354acea` with critical 0, high 0, medium 1,
  low 0 solely because this delivery verification and repository state were not yet
  durable in the handoff. The reviewer found no substantive topology, hash, state,
  authority, or scope defect.

## Data and side-effect boundaries

- P2 uses only committed sanitized P1 fixtures and evidence; it made no spreadsheet
  read or write and no public fetch.

- The testing sheet was accessed read-only; no spreadsheet update, append, clear,
  formatting, permission, or metadata mutation was performed.
- The production sheet was not configured, read, or mutated.
- Seven public scholarship pages were fetched read-only for representative
  architecture observations. No login, interactive workflow, form submission, paid
  action, or provider contact occurred.
- Applicant PII, credentials, non-student review columns, private service-account
  material, and original tracking-bearing URL values were not committed.
- Product behavior, runtime dependencies, CI, and deployment configuration were not
  changed.

## Historical Revision 3 delivery state (superseded by Revision 4)

At the Revision 3 handoff, Kelsey had supplied direct informed authority for Revision 3
commits, independent review, push, pull request, merge, and resulting Vercel Preview and
Production deployments. `docs/evidence/PLAN-REV3.md` records that bounded historical
authority. At that time, only local P2 implementation and independent review could
resume and P2 delivery was unauthorized. Revision 4's current authority and exact
delivery sequence at the top of this handoff supersede these old action limits without
changing their historical accuracy.

## Remaining unknowns and later-stage routing

- P1 excluded deadline, amount, summary, eligibility, and other student-facing values.
  P2 proves representation and lossless handling but does not reconstruct those values.
- Every migrated award has an explicit unknown cycle because P1 retained no cycle
  facts; P4 owns fact verification.
- Parent/child source links are schema-supported but remain empty where P1 supplies no
  evidence of source hierarchy. P3 may populate them only from evidence.
- Reach Higher application-group behavior remains manual review.

- P1's public probes are representative observations, not full portal crawls or proof
  that scholarship facts are current.
- Source architecture and application identity remain explicit `unknown` where the
  sanitized evidence is insufficient. URL-structure inferences remain manual review,
  and direct public observations retain their observation/review status.
- Potential identity-bearing query/fragment semantics must be defined in P2/P3 rather
  than discarded by P1.
- Dependency remediation remains P7 work; the P1 baseline applies no upgrades and
  makes no exploitability claim.

## Historical Revision 3 next-stage direction (superseded by Revision 4)

Under the Revision 3 handoff, Revision 3 was the only permitted work until its accepted
attestation was delivered on verified `origin/main`. The then-current direction was to
resume local P2 implementation and review under `docs/kickoffs/P2-DATA-MODEL.md` without
delivering P2. Revision 3 and local P2 acceptance are now complete; the current Revision
4 sequence at the top of this handoff controls.

## Historical Revision 3 prohibitions (superseded where Revision 4 is more specific)

The Revision 3 handoff prohibited spreadsheet writes, production-data configuration,
forms, application workflows, provider contact, product changes, P2 delivery, P1
history changes, and unreviewed Revision 3 delivery. Revision 4 supersedes only the old
P2 Git/Vercel delivery prohibition for exact candidate `1a63762` and attestation
`cc277b3` through the current reviewed sequence. Every other exclusion remains in force.
