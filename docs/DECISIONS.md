# Decision Log

This file is append-only. Accepted entries may be superseded by a later decision,
but are not rewritten or deleted.

## D-001 — Canonical plan and machine-readable state

- Date: 2026-08-23
- Status: accepted
- Decision: Use `docs/SCHOLARSHIP_SYSTEM_BUILD_PLAN.md` as the human authority and
  `docs/BUILD_STATE.json` as the machine-checkable stage pointer.
- Reason: New sessions need one stable scope contract and a compact way to detect
  an invalid stage transition.
- Consequence: Kickoffs and handoffs summarize authority but cannot replace it.

## D-002 — Separate sources, awards, applications, and cycles

- Date: 2026-08-23
- Status: accepted
- Decision: Preserve Source, Scholarship, Application Group, Cycle, Evidence, and
  Review Item as distinct concepts.
- Reason: Live sources show one-to-many, many-to-one, paginated, shared-application,
  and annual-cycle relationships that a flat row cannot represent safely.
- Consequence: P2 must provide compatibility with the existing sheet before any
  migration.

## D-003 — Honest coverage metrics

- Date: 2026-08-23
- Status: accepted
- Decision: Report portals, individual awards, active cycles, search results, and
  recipient slots separately.
- Reason: A higher row count can otherwise misstate the number of applications or
  opportunities available to a student.
- Consequence: P6 has no arbitrary target count; relevance, currency, evidence, and
  completeness determine success.

## D-004 — Testing sheet until P9

- Date: 2026-08-23
- Status: accepted
- Decision: P0-P8 may not configure or mutate the production Whitefish spreadsheet.
- Reason: The user designated the supplied sheet as the testing surface and deferred
  production migration until the system is built.
- Consequence: Production spreadsheet identity remains unset in build state.

## D-005 — Autonomous, non-destructive Git delivery

- Date: 2026-08-23
- Status: accepted
- Decision: Agents make routine branch, worktree, commit, push, PR, merge, and cleanup
  decisions without asking Kelsey.
- Reason: The user explicitly requested no Git questions.
- Consequence: `AGENTS.md` requires isolated work for dirty trees, stage-scoped
  branches, preservation of user changes, and no history rewriting or check bypass.

## D-006 — Independent acceptance review

- Date: 2026-08-23
- Status: accepted
- Decision: A fresh-context reviewer that did not author or edit the stage must review
  the final candidate read-only. The implementation agent performs remediation.
- Reason: Reviewer independence is an explicit user requirement and prevents
  self-confirming stage closure.
- Consequence: Critical/high findings block acceptance; the reviewer rechecks after
  remediation.

## D-007 — No silent truncation

- Date: 2026-08-23
- Status: accepted
- Decision: Processing may be bounded per run, but omitted pages, children, results,
  and awards must remain counted and resumable.
- Reason: Current source architectures include catalogs and portals far larger than
  existing ingestion caps.
- Consequence: P3 completion requires completeness receipts and resumable cursors.

## D-008 — Main-branch merge has a production deployment effect

- Date: 2026-08-23
- Status: accepted
- Decision: Treat a merge to `main` as both Git delivery and a production redeploy
  because the repository CI documents that `main` auto-deploys. Require a pre-merge
  downstream-effect check and stage-specific authority or verified suppression.
- Reason: A merge cannot be described as side-effect-free when it triggers deployment.
- Consequence: Routine Git preferences still do not go to Kelsey, but missing release
  authority is an external-effect blocker. Historical GitHub deployment records also
  show Vercel Preview deployments for branch/PR revisions, so the check begins before
  push rather than only before merge. P0 execution approval did not explicitly
  acknowledge those Preview/Production effects; P0 delivery remains blocked until
  direct informed authority or verified suppression is recorded. No Git delivery
  authority ever authorizes spreadsheet writes.

## D-009 — Exact P0 commit delivery authority and amendment boundary

- Date: 2026-08-23
- Status: accepted
- Decision: Preserve the user's authorization to push commit `07a6e14`, create its PR,
  and merge it, but do not extend that authorization to later candidate changes without
  a new direct informed instruction.
- Reason: Kelsey explicitly authorized those Git actions after acknowledging that they
  may trigger Vercel Preview and Production deployments.
- Evidence: `docs/evidence/P0-delivery-authorization.md`
- Consequence: The later validator and authorization amendment remains a delivery
  blocker until separately authorized. No authorization permits spreadsheet writes or
  product behavior changes.

## D-010 — Complete amended P0 delivery authority

- Date: 2026-08-23
- Status: accepted
- Decision: Deliver the P0 branch containing `07a6e14` and `24a368d`, one
  documentation-only commit recording this authorization, and one attestation-only
  commit containing the final manifest and independent review record.
- Reason: Kelsey explicitly authorized push, PR creation/update, merge to `main`, and
  resulting Vercel Preview and Production deployments for that bounded final candidate.
- Evidence: `docs/evidence/P0-delivery-authorization.md`
- Consequence: Delivery may proceed only after the refreshed independent adversarial
  review accepts the frozen candidate. The authority excludes spreadsheet writes,
  product behavior changes, deployment-configuration changes, form submissions, and
  provider contact.

## D-011 — Attestation-only enforcement and renewed delivery boundary

- Date: 2026-08-23
- Status: accepted
- Decision: Require the manifest/review attestation to be the candidate commit's direct
  child with exactly those two changed paths; preserve historical attestation blobs;
  and machine-check a disposition for every medium/low finding.
- Reason: Independent review of `5b3082e` found that arbitrary post-candidate changes
  could otherwise escape review and that nonblocking findings could lack ownership.
- Consequence: The validator remediation is a new candidate change outside D-010's
  exact delivery sequence. Keep delivery blocked until Kelsey explicitly authorizes the
  final remediated commit and its direct-child attestation.

## D-012 — Canonical first attestation and undelivered branch-tip lock

- Date: 2026-08-23
- Status: accepted
- Decision: Treat the first structurally valid manifest/review addition as the immutable
  attestation; reject later deletion/re-addition or rebinding; and require the
  undelivered branch tip to equal its attestation commit.
- Reason: Independent recheck of `0e4e106` found that a later arbitrary commit or a
  replacement attestation could otherwise escape the reviewed-candidate boundary.
- Consequence: CI receives the PR head SHA, historical attestation blobs remain fixed,
  and delivery stays blocked until the final remediation commit is explicitly authorized.

## D-013 — Final P0 technical acceptance and delivery authority

- Date: 2026-08-23
- Status: accepted
- Decision: Deliver the branch through technical commit
  `1460818684eeaef0b431c59465c5f0b9168b791b`, this one documentation-only
  authorization/acceptance commit, and one direct-child attestation commit containing
  exactly the P0 manifest and independent review record.
- Reason: The independent reviewer accepted `1460818` at 2026-08-24T03:22:20Z with
  zero findings, after which Kelsey explicitly authorized the bounded sequence, Git
  delivery, and resulting Vercel Preview and Production deployments.
- Evidence: `docs/evidence/P0-delivery-authorization.md`
- Consequence: After the final candidate receives independent acceptance and the
  two-file attestation passes locally, Codex may push, open/update the PR, merge, and
  verify delivery. Spreadsheet writes, product behavior changes, deployment-configuration
  changes, form submissions, and provider contact remain forbidden.

## D-014 — Hash-bound delivery integration for post-attestation authority

- Date: 2026-08-24
- Status: accepted candidate pending independent review and delivery
- Decision: Amend the plan to permit one machine-checked delivery integration for exact
  P1 candidate `92ee21095e959bd19ab641752308c0fd9b394b22` and canonical attestation
  `20476b8384cfbda6aaa04a3da4b7f0a3fbd291e5`. Deliver this amendment first. Then merge
  the preserved attestation as the second parent of a candidate whose first parent is
  the verified amended `origin/main`, independently review the complete integration
  change set, and add a direct-child two-file delivery attestation.
- Reason: P1 was correctly frozen while delivery was prohibited. Direct informed
  Preview/Production authority arrived afterward, but Plan Revision 1 simultaneously
  required that authority in `BUILD_STATE` and prohibited every post-attestation commit
  or rebinding. The narrow integration records the later authority without altering the
  reviewed P1 candidate, attestation, manifest, or review.
- Evidence: `docs/evidence/PLAN-REV2.md` and
  `docs/evidence/P1-delivery-authorization.md`
- Consequence: The exception applies only to the exact pinned P1 history and the exact
  reviewed delivery integration. It does not create a general post-attestation edit
  path, waive independent review, or authorize spreadsheet writes, product changes,
  deployment-configuration changes, form submissions, or provider contact.

## D-015 — Bind delivery-state validation to immutable history

- Date: 2026-08-24
- Status: candidate pending independent review and delivery
- Decision: In Plan Revision 3, validate the mechanically derived P1 delivery
  integration state against `docs/BUILD_STATE.json` at the candidate commit named by
  the attested P1 delivery manifest. Permit the current `BUILD_STATE` to evolve only
  through later stage and plan-amendment contracts while continuing to revalidate every
  preserved P1 integration object, hash, identity, path, authority record, and topology
  from Git history. Record Revision 3 as `attestation-gated`, so its accepted outcome is
  derived from its bound independent review and attestation instead of predeclared.
- Evidence: `docs/evidence/PLAN-REV3.md`
- Alternatives: Freezing the live `BUILD_STATE` forever would make every later stage
  impossible. Removing the exact-transition check would weaken P1. Copying historical
  integration fields into a second current-state schema would create two authorities.
- Impact: The historical P1 integration remains byte-for-byte and mechanically checked;
  P2 and later stages can advance machine state without a false P1 failure. A regression
  test proves both the allowed current-state divergence and rejection of historical
  mutation.
- Rollback: Revert the Revision 3 amendment before any later stage is accepted. Once a
  later stage depends on it, rollback requires another independently reviewed amendment;
  preserved P1 commits and attestations must never be rewritten.

## D-016 — Enable an exact P2 delivery integration

- Date: 2026-08-25
- Status: candidate pending independent review and delivery
- Decision: In Plan Revision 4, enable the existing hash-bound integration mechanism
  only for P2 candidate `1a6376207eb467ff0977298de16a1c0d0db1b3cd` and canonical
  attestation `cc277b34075f6d648ff3c71022fadf6a6c632b34`. Deliver Revision 4
  first. Then merge exact `cc277b3` as the second parent of an integration candidate
  whose first parent is the verified delivered Revision 4 `origin/main`; independently
  review the complete integration and add its direct-child two-file delivery
  attestation.
- Evidence: `docs/evidence/PLAN-REV4.md` and
  `docs/evidence/P2-delivery-authorization.md`
- Reason: P2 was correctly accepted and attested while external delivery was prohibited.
  Direct informed Git and Vercel authority arrived afterward, so it cannot be appended
  to or used to rebind the immutable P2 attestation.
- Impact: Exact P2 may be delivered without changing any preserved candidate,
  manifest, review, or attestation blob. Revision 4 does not create standing delivery
  authority for P3 or later stages and does not authorize spreadsheet access or writes,
  product or deployment-configuration changes, form submissions, application
  interactions, or provider contact.
- Rollback: Before P2 delivery, revert only through a reviewed governance amendment.
  After P2 delivery depends on Revision 4, any rollback must preserve the complete P2
  integration and attestation history byte-for-byte.

## D-017 — Correct latest-delivery equality and adopt a bounded standing mandate

- Date: 2026-08-25
- Status: candidate pending independent review and delivery
- Decision: In Plan Revision 5, remove the invalid regression-test requirement that
  current `BUILD_STATE` differ from every historical delivery candidate. Explicitly
  test that the newest exact delivery state may equal current state, test later
  non-integration evolution independently, and apply deletion/downgrade/rebind cases to
  every accepted integration. Also record Kelsey's standing P3-P8 operating mandate as
  individual stage delivery authorizations bound to one reviewed evidence file.
- Evidence: `docs/evidence/PLAN-REV5.md` and
  `docs/evidence/STANDING-OPERATING-MANDATE.md`
- Reason: Exact preliminary P2 integration `6ff2acb` passed the production plan
  validator's mechanical state check but failed the Revision 3 regression test solely
  because P2 was the newest integration and therefore correctly equaled current state.
  Separately, repeated generated authorization requests left Kelsey copying technical
  wording without a useful decision boundary; a durable plain-English mandate better
  distinguishes routine program work from reserved consequential effects.
- Alternatives: Requiring artificial current-state drift would violate the exact P2
  transition. Weakening historical validation would endanger accepted integrations.
  Continuing per-stage authorization rituals would not solve the informed-governance
  problem. An unlimited mandate would remove necessary controls.
- Impact: Historical candidate validation remains exact and per-integration
  non-regression coverage becomes stronger. P3-P8 ordinary implementation, review,
  Git delivery, and Vercel effects no longer require repeated user authorization when
  all canonical gates pass. Spreadsheet writes, P9/production, deployment configuration
  or schedules, paid/destructive actions, secrets, forms/application interactions,
  provider contact, force-push/history rewrite, gate weakening, and scope expansion
  remain reserved.
- Historical control: The validator discovers attested amendments independently from
  Git history, prevents plan-revision rollback and canonical amendment removal/change,
  and binds every P3-P8 authorization field plus the standing-mandate evidence blob to
  the immutable Revision 5 candidate. Revision 5 has no implicit revocation path; any
  future revocation or supersession requires separate informed authority and a new
  independently reviewed, machine-recorded plan mechanism.
- Rollback: Revert only through another independently reviewed amendment. Do not delete
  or alter any accepted stage, amendment, delivery candidate, manifest, review, or
  attestation. Any stage already delivered under the mandate remains historically valid.

## D-018 — Resolve the exact P2 package-script collision deterministically

- Date: 2026-08-26
- Status: candidate pending independent review and delivery
- Decision: Plan Revision 6 adds `web/package.json` as the third and final resolution
  path only for the exact P2 delivery integration. The integrated package must preserve
  the complete delivered Revision 5/6 baseline and all its test commands, add the exact
  P2 `p2:model` and `p2:model:check` scripts, and add only P2's missing model-test
  command. A validator reconstructs and checks the exact result from both immutable
  parents.
- Evidence: `docs/evidence/PLAN-REV6.md`
- Reason: The clean two-parent P2 merge from delivered Revision 5 main produced the two
  expected governance conflicts plus a substantive `web/package.json` conflict. Taking
  either side would drop either Revision 5 governance tests or P2 model tests, while the
  Revision 4 allowlist prohibited resolving that third path.
- Authority: Kelsey Stuart directly authorized this exact Plan Revision 6 path, its
  commits, independent review, attestation, Git/Vercel delivery, and the subsequent
  exact P2 delivery. All stated reserved effects remain excluded.
- Alternatives: Taking either package side weakens accepted verification. Appending to
  P2 rewrites frozen history. Changing CI or deployment configuration is both unnecessary
  and unauthorized. Leaving P2 blocked fails the already-authorized delivery objective.
- Impact: P2 can be integrated without changing its candidate or attestation and without
  losing any delivered governance test. No dependency, lockfile, runtime/product, CI,
  deployment configuration, spreadsheet, form, provider, or P3 path changes.
- Rollback: Revert before P2 integration only through the reviewed amendment process.
  After P2 relies on it, preserve the exact Revision 6 amendment and P2 delivery
  attestation and use a later separately reviewed amendment for any change.

## D-019 — Make P9 a production-read-only source and configuration cutover

- Date: 2026-08-30
- Status: candidate pending independent review and delivery
- Decision: Plan Revision 7 records exact production spreadsheet
  `1eWGMdavcEECUcY_-nZ9gR2nMTN7T7T6oipG5ql1LoIE` and permits P9 to read only the two
  exact scholarship tabs pinned in `BUILD_STATE`. P9 must use a separate read-only
  production configuration. Every write-capable path remains pinned to testing
  spreadsheet `1Dp5AMnrfSQ-Xf-r03S75lKsGPJk7o0inOgvC9Q6lOl4` or is disabled.
  Production rollback changes only the deployed application revision/configuration;
  production backups are evidence and are never restored under current authority.
- Evidence: `docs/evidence/PLAN-REV7.md`
- Reason: Kelsey directly prohibited every production spreadsheet write while
  authorizing P9 source migration, application configuration switching, governed Git
  and pull-request delivery, Preview and Production deployment, verification,
  reconciliation, and rollback. Revision 6 instead required production mutation
  authority, post-write reconciliation, and restoring a production backup. The current
  application also uses `GOOGLE_SHEET_ID` in an admin endpoint that can append rows, so
  simply replacing the testing ID with production would violate the explicit boundary.
- Alternatives: Retain Revision 6 and request production write authority, which Kelsey
  explicitly denied; stop P9 permanently; or treat a configuration switch as implicit
  write safety without machine checks. Each conflicts with the requested outcome or
  leaves a direct production-mutation path.
- Impact: P9 retains complete mapping, deterministic sampling, privacy,
  unknown/manual-review preservation, deployment smoke, independent review, manifest,
  attestation, and closeout gates. Post-write reconciliation becomes complete
  post-cutover read-only reconciliation. The validator pins the exact IDs, tabs,
  backups, owners, production no-write rule, testing-write controls, and outstanding
  deployed-runtime permission gate. Structured entry and post-cutover receipts must
  preserve revision `9857`, exact grids/source-backup hashes, read-only OAuth scope,
  unchanged sharing, and zero production writes across deployment smoke and rollback.
  The Vercel rollback-probe record must bind real Git objects, exact baseline ancestry,
  provider status/configuration, and one rollback-safe runtime commit deployed three
  times under cutover/static-rollback/restored-cutover configuration; the legacy
  baseline is not a safe runtime rollback while a production source setting exists.
  Exact schema-v2 receipts require hosted GitHub OIDC attestations from a dormant
  protected default-branch workflow with predecessor-verified entry, cutover, rollback,
  restored-cutover, and finalize phases. The validator derives observation,
  configuration, and AST writer-inventory digests and binds a secrets-free executed
  negative-test report; fabricated SHA-shaped values or asserted booleans fail.
  Cutover/restored health must provide a nonce-bound application-read observation whose
  digests cover the exact normalized bounded GridData plus the fresh runner nonce and
  match the trusted runner's independent computation without exposing cell values.
  Each phase also statically binds both deployed routes and direct result dataflow to one
  shared loader at the exact runtime commit; rollback must provide none. A control-plane
  credential read or unused read plus echoed constant is not application-path proof.
  P9 also remains blocked until the runtime principal has a direct unexpired production
  Viewer permission, the authorized verifier can read both private backups,
  and exact Vercel project/team fingerprints and canonical Production hostname are
  independently authority-pinned through the predeclared, fixed-path,
  fresh-review/direct-child-attested `P9-IDENTITY-PINS` record. Revision 7 records these
  facts as false/null and does not change sharing, provider configuration, or hosted
  environment state.
  Because the earlier backup-equality hash serialization was not recorded, those two
  digests remain historical provenance. Operative proof uses the explicitly versioned
  canonical bounded-GridData algorithm and requires fresh source/existing-backup
  equality plus cross-phase identity.
  Revision 7 also records the contained pre-entry connector-access deviation without
  retroactive authorization. Revision 7 itself changes only governance, validator/tests,
  evidence, and handoff; P9 remains unstarted.
- Review history: first frozen candidate `1c23d4fef71635c75702e638f268501318f403ec`
  was rejected C0/H2/M0/L0 because its receipts could accept stale/unknown fields and
  self-asserted provider/configuration evidence. Its manifest is rejected and is not
  rebound. The same reviewer must recheck the replacement candidate after strict-schema,
  chronology, OIDC, runtime-descriptor, and executed writer-proof remediation.
- Authority: Kelsey Stuart directly supplied the exact production and testing
  spreadsheet boundaries, authorized the P9 configuration/Git/Preview/Production and
  rollback effects, and named Kelsey Stuart as deployment and rollback owner.
- Rollback: Before P9 starts, supersede Revision 7 only through another directly
  authorized, independently reviewed amendment. After P9 depends on it, preserve the
  Revision 7 candidate, manifest, review, attestation, and P9 history byte-for-byte.
  Never use rollback to mutate the production spreadsheet.

## D-020 — Restore interview-first matching as a separate privacy-bounded stage

- Date: 2026-09-01
- Status: candidate pending independent review and delivery
- Decision: Plan Revision 8 inserts P8R between accepted P8 and planned P9. P8R restores
  the guided interview as the primary student path and presents matches on the current
  website using the accepted canonical public award model. Answers exist only in
  volatile browser memory. A hard exclusion requires a typed accepted public fact that
  proves a conflict; missing, ambiguous, or free-text-only eligibility remains a
  possible match with a visible verification reason.
- Evidence: `docs/evidence/PLAN-REV8.md`
- Reason: The current build replaced the interview-driven homepage with the accepted
  P7 browse-all catalog, while legacy interview components and a heuristic processor
  remained disconnected. Reconnecting that processor or reverting the P7 page would
  risk false exclusions, stale answer reuse, and catalog/API regressions.
- Alternatives: Revert the homepage wholesale; reconnect the legacy heuristic matcher;
  or leave browse-only behavior. The first two weaken accepted product/data guarantees,
  while the third does not satisfy the student-filtering objective.
- Impact: Revision 8 itself changes governance and trusted-proof compatibility only.
  P8R must precommit its test matrix, preserve browse-all and P7 counts/relationships,
  add deterministic decision reasons, prove no answer persistence or transmission, and
  pass mobile/tablet/desktop browser journeys plus fresh independent review.
- Authority: After explicit disclosure of the Git and Vercel Preview/Production effects
  for both Revision 8 and later P8R, Kelsey Stuart answered yes, authorized. Spreadsheet
  access/writes, P9, production configuration, schedule activation, forms, applicant
  data, answer telemetry, and provider contact remain excluded.
- Rollback: Revert to the last accepted P8 application revision; do not change accepted
  scholarship facts, spreadsheet state, P8 schedule, production configuration, or P9.

## D-021 — Restore the complete former interview detail through a separate accepted-fact stage

- Date: 2026-09-01
- Status: candidate pending independent review and delivery
- Decision: Plan Revision 9 inserts P8F after accepted P8R and before planned P9. P8F
  restores the complete last-active former displayed interview detail and its intended
  search process inside the accepted P7/P8R product. Revision 9 binds the exact history
  inventory and requires every former question, filter, scoring rule, sort, and
  result/export route to be retained, safely replaced, or retired with rationale and
  tests before implementation.
- Evidence: `docs/evidence/PLAN-REV9.md` and
  `docs/evidence/PLAN-REV9-interview-inventory.md`
- Reason: Accepted P8R intentionally restored only GPA, school type, and application-
  mode questions. The user identified Dyslexia, ADHD/possibly ADD, and First-Generation
  College as anchors for the former detailed experience and requested the complete
  question/routing restoration. Complete reachable history proves one ADHD question
  with an expanded tooltip and no distinct ADD control, six academic prompts, four
  activity prompts, one conditional volunteer question, one financial-need prompt, 38
  final special criteria, an earlier active standalone six-option organization-
  affiliations question later migrated into those final criteria, and eight type-only
  fields that were never displayed. The earlier `New for 2026!`/`is_new` +5 boost is
  also inventoried and retired.
- Alternatives: Reconnect the former processor, which would restore unsafe defaults,
  regex gates, arbitrary points, and session-stored legacy rows; add questions directly
  to accepted P8R without a stage, which would violate the one-stage and review gates;
  or leave the detailed interview absent, which would not satisfy the requested
  restoration. Each alternative either weakens accepted controls or misses the stated
  outcome.
- Impact: Revision 9 itself is governance-only. P8F must preserve the accepted catalog,
  cards, filters, sort, export, counts, relationships, admin/API behavior, disabled P8
  schedule, and volatile-answer privacy. A hard conflict requires an explicit
  contradictory typed answer plus award-bound field-specific accepted authority.
  Missing, ambiguous, free-text-only, manual-review, provenance-free, unanswered,
  nonselected, and prefer-not-to-answer states remain non-excluding. Sensitive
  selections are optional positive signals only where accepted authority exists. P9
  remains planned and unstarted.
- Authority: The user supplied the repository contract identifying governed Git and
  Vercel Preview/Production effects and directly ordered Codex to govern and deliver the
  required amendment/new stage, preserve the complete inventory, leave the exact
  kickoff, and eventually restore the former detail without beginning P9. All reserved
  effects outside that exact scope remain excluded.
- Rollback: Before P8F begins, supersede Revision 9 only through another directly
  authorized, independently reviewed amendment. After P8F depends on it, preserve the
  Revision 9 candidate, manifest, review, attestation, and P8F history byte-for-byte.
  Runtime rollback uses accepted P8R and does not change any spreadsheet, accepted fact,
  P8 schedule, production configuration, or P9 state.

## D-022 — Govern the organizer master through P8M and an immutable runtime publication

- Date: 2026-09-01
- Status: candidate pending independent review and local attestation; remote delivery blocked
- Decision: Plan Revision 10 treats spreadsheet
  `1Dp5AMnrfSQ-Xf-r03S75lKsGPJk7o0inOgvC9Q6lOl4` as the organizer-designated
  authoring master on a user-reported, independently unverified basis. It classifies
  `1eWGMdavcEECUcY_-nZ9gR2nMTN7T7T6oipG5ql1LoIE` as legacy comparison-only with
  no access authority; separates human editor, proposal processor, fact reviewer, and
  read-only application runtime identities; inserts P8M before P8F; freezes
  `matching-facts-v1`/taxonomy `1.0.0`; and selects a validated immutable versioned
  publication as the only future runtime fact source.
- Evidence: `docs/evidence/PLAN-REV10.md` and
  `docs/evidence/PLAN-REV10-matching-fact-contract.json`.
- Reason: The organizer's source decision materially conflicts with Revision 9's
  testing/production roles, P8F ordering, and former P9 Google-sheet runtime. Team edit
  capability is not authority for Codex, Claude, or the application to read or mutate
  the workbook. P8F also cannot safely use the restored detailed questions until
  award-bound, cycle-aware, field-specific accepted facts exist.
- Alternatives: Read the mutable master directly at runtime, which couples student
  results to unreviewed editor changes; enrich inside P8F, which collapses governance,
  data acceptance, and product work; treat free-form AI tags as truth, which loses typed
  operators, evidence, scope, and review; or continue the old production-sheet P9,
  which conflicts with the organizer's new source decision. Each alternative weakens
  evidence, stage, identity, or rollback controls.
- Evidence ladder: Cycle-specific official child-award evidence outranks parent or
  yearless evidence. Organizer-reviewed master facts may be accepted directly only for
  fields where the organizer is the authoritative owner of that local award. Material
  eligibility, deadline, cycle, and application facts otherwise require current
  official provider evidence. Secondary sources and Claude output remain proposals.
  Equal-authority disagreement becomes `conflict` and cannot affect matching.
- AI and review boundary: Claude is proposal-only after later exact processing
  authority and may emit only bounded schema-valid JSON/JSONL with provenance,
  confidence/ambiguity, fingerprints, checkpoints, resume cursors, and completeness
  receipts. It cannot accept facts or write the master. Codex owns stable-ID validation,
  duplicate/conflict/coverage checks, evidence-policy enforcement, reconciliation,
  review packaging, and any separately authorized write/readback path.
- Write authority: Edit access is capability, not operation authority. A later write
  requires the exact spreadsheet, tab, columns/ranges/cells, operation count, source
  revision, backup/rollback owners, dry run, human and independent acceptance,
  idempotent bounded batch, immediate readback, untargeted-cell proof, and complete
  reconciliation.
- P9 replacement: Future P9 deploys the exact P8M immutable publication and proves the
  runtime has no Google credential, Drive/Sheets scope, spreadsheet client, or mutator.
  The former `P9-IDENTITY-PINS` Google-runtime path is retired unstarted. Historical
  Revision 7-9 evidence remains unchanged. After the first immutable-candidate review
  exposed the conflict, the user explicitly authorized Revision 10 to prospectively
  supersede the old operational P9 authority and validator path while preserving that
  history. `stageMergeAuthorizations[P9]` is therefore unauthorized for the replacement
  stage, and any later active P9 requires new target-specific authority evidence.
- Executable contract: The frozen contract binds strict scalar/set/date/identifier
  encodings, exact numeric bounds and units, closed enum domains, one object shape for
  `between`, evidence-status null/reviewer rules, unknown-field rejection, and lossless
  aggregate aliases. `web/scripts/matching-fact-contract.ts` deterministically rejects
  unknown enum members, malformed values, incomplete review groups, and unsupported
  fields before any future proposal can be reviewed or matched.
- Lifecycle: While P8M is planned, the master stays unverified and inaccessible and no
  publication exists. An authorized in-flight P8M may verify the master and create a
  candidate publication; accepted P8M requires complete publication pins. Replacement
  P9 separately owns runtime/provider pins and cannot activate on Revision 7 authority.
- Authority: The current and follow-up instructions authorize Plan Revision 10
  governance, the prospective P9 supersession above, local commits, independent review,
  remediation, and direct-child local attestation only. They expressly
  stops before P8M, P8F, and P9. It does not separately authorize branch push, pull
  request, merge, Vercel Preview, or Vercel Production effects; those remain blocked.
- Rollback: Before P8M begins, replace Revision 10 only through a separately authorized,
  independently reviewed plan amendment. After later stages depend on it, preserve the
  Revision 10 candidate, contract, manifest, review, and attestation byte-for-byte.
  Runtime rollback uses accepted P8R until P8F/P9 are separately accepted and never
  accesses or mutates either spreadsheet.

## D023 — Carry late delivery authority through one reviewed Revision 10 continuation

- Date: 2026-09-02
- Status: candidate pending independent review and delivery
- Decision: Plan Revision 11 creates one governance-only continuation from the exact
  accepted Revision 10 attestation. It records the user's later direct authority for
  push, pull request, Vercel Preview, merge, Vercel Production, CI, and deployment
  verification without editing or rebinding Revision 10.
- Evidence: `docs/evidence/PLAN-REV11.md`.
- Reason: Revision 10 correctly froze and attested while remote delivery was expressly
  unauthorized. Repository law forbids appending authority to that immutable branch.
  The user subsequently granted full authority and directed removal of permission
  blockers. A new independently reviewed amendment is therefore required to preserve
  the old decision while making the new authority executable.
- Alternatives: Push the Revision 10 branch while `BUILD_STATE` still forbids delivery,
  which violates the operating contract; amend or append to the accepted attestation,
  which destroys its topology; or leave the new authority unused. All three are
  rejected.
- Impact: The continuation manifest covers the complete original-baseline-to-candidate
  tree, the exact Revision 10 attestation remains in ancestry, and only twelve pinned
  governance/evidence/test/validator paths may change after it. No product, data,
  runtime, workflow, source, spreadsheet, monitoring, or deployment configuration may
  change. The user also authorized P8M/enrichment in principle, but unknown exact entry
  bounds remain facts to pin, not permission blockers to waive.
- Rollback: Before merge, abandon only the Revision 11 continuation branch and retain
  Revision 10 locally accepted. After merge, revert the governance delivery through a
  separately reviewed amendment; never rewrite either attestation or roll back data,
  because this continuation performs no data operation.

## D-024 — Use Master Database rows as the P8M source denominator

- Date: 2026-09-02
- Status: candidate pending independent review and delivery
- Decision: Plan Revision 12 pins `Master Database`, gid `0`, used range
  `'Master Database'!A1:O198`, Drive revision `225`, and exactly 197 populated rows as
  the P8M source denominator. The 176 `Scholarship` rows and 21 `Portal` rows are typed
  subsets. Application-group and cycle/cycle-ID counts are not source denominators
  because the original source contains no such fields.
- Evidence: `docs/evidence/PLAN-REV12.md`.
- Reason: Kelsey directly corrected the prior GPT-derived assumption and explained
  that blanks normally mean information was unavailable to the earlier Claude scrape.
  Requiring invented fields or perfect population would block accurate restoration and
  encourage false facts. Row-complete outcomes preserve measurable coverage while
  permitting honest unknowns.
- Identity and completeness: Every one of the 197 source rows receives one outcome.
  The 176 Scholarship-labeled rows contain 175 unique nonblank names and one exact-name
  duplicate group, so name alone is never a stable award key. A normalized cycle ID or
  application grouping may exist only when later evidence explicitly supports it; it
  is never required to account for a source row.
- Missing-data rule: Blank, unavailable, blocked, unsupported, ambiguous, or
  unobserved values remain `unknown` or manual review. They do not become false,
  rejected, ineligible, or batch-stopping, and other valid work may continue. Every
  skip/fetch failure remains a visible row outcome.
- Authority: The read-only pin was limited to spreadsheet metadata and Master Database
  and made no writes. External URL reads and Claude proposal processing still await an
  exact URL-column/allowlist instruction; final fact and P8M acceptance await a named
  human fact reviewer. Claude remains proposal-only. Governed Git delivery and
  resulting Vercel Preview/Production verification are authorized for Revision 12 and
  eventual accepted P8M; no spreadsheet write, P8F, or P9 action is authorized.
- Alternatives: Require cycles/application groups, which fabricates a source schema;
  treat blanks as negative facts, which makes unsupported eligibility decisions; or
  block the entire batch on any unavailable value, which destroys safe incremental
  progress. All are rejected.
- Rollback: Before merge, abandon only the Revision 12 branch. After delivery,
  supersede it only through another independently reviewed amendment. Never rewrite
  its attestation or roll back spreadsheet data because Revision 12 performs no write.


## D-025 — Useful spreadsheet shortlist after completed P9

Kelsey asked to prioritize interview-driven spreadsheet filtering and downloads,
avoid drift and excessive governance, accepted the recommended bounded release,
and instructed "continue". The saved source has 197 rows and a completed human
review, but the official matching publication deliberately contains zero facts.
Requiring official verification for every shortlist comparison prevents the basic
product from using clear organizer-recorded criteria.

Choose a separately labeled, immutable spreadsheet shortlist with reversible
recorded-mismatch filtering and honest unknowns. Preserve official accepted-fact
semantics and P9 history. Reject a live credential-bearing spreadsheet integration,
blanket keyword eligibility, assumed current cycles, and a new full-source crawl.
Scope, evidence, source limits, verification, and rollback are in plan section 17.
Publication effects require separate exact authority or verified suppression.


## PLAN-REV14 — positive interview relevance (2026-09-10)

Direct user execution authority adopts INTERVIEW-RELEVANCE-1 locally. Saved reviewed
records can support useful positive connections without official qualification claims.
Retaining no effects would leave supported answers unused; new exclusion rules or live
research would exceed scope. Enable only independently reviewed award-specific positive
connections, preserve GPA/school decisions and every award, use one binary boost, and
keep sensitive answers/reasons in temporary browser memory. The full mapping and matrix
precede product edits. Independent policy review precedes implementation; final review
binds the complete frozen candidate. No historical evidence is rebound. Delivery remains
blocked pending new exact Git/Vercel authority or verified suppression, before attestation.
Rollback reference is unchanged PR42; performing rollback needs separate authority.


## D-027 — PLAN-REV15 bounded scholarship intake (2026-09-11 UTC)

The invoked prepared plan and complete-backup update authorize one local cross-tab
intake, preserving completed releases. Choose a dedicated Revision15 preparation
exception and one decision ledger. Existing Revision14 authority is exhausted and its
exception cannot implicitly apply. Reject reopening P9, a full-master refresh, runtime
integration, blanket exclusions from historical labels, or source writes without new
exact authority and complete verified recovery. Complete fresh-context policy review
before audit; then practical entity batches and one complete independent final review.
The complete fixed plan is incorporated by canonical section19. Missing facts remain
unknown. Backup creation and all write/publication effects remain false. Rollback is
abandonment of local changes; historical artifacts and original checkout stay intact.

## 2026-09-12 — R2 exact two-release delivery authority

Kelsey directly authorized the reviewed R1 package at retained source979122a: REV15
first, REV16 only after verified delivery. This REV15 branch starts from40ff61e and
changes only the reviewed authority/evidence paths. Existing canonical topology requires
separate full manifests, fresh review and two-file direct-child attestations. No rule
amendment, historical attestation integration exception or gate waiver is introduced.
R2 grants and exact target appear in PLAN-REV15.md and BUILD_STATE. Workbook access,
new research, configuration changes and later phases remain prohibited. The stale P9
bookkeeping label remains separately routed; it does not reopen P9.


## 2026-09-12T23:49:53Z — Authorized R2 REV15 repair continuation

Record direct grant “authorize all items you have listed” for reviewed recovery
proposal 5ecf7a7, review-only checkpoint 3b276b4. The one-MiB reader defect became
visible only after A15. Keep all hashes and gates; do not rewrite A15. Introduce
only the exact prospective REV17 continuation in the canonical plan/state. Policy
review precedes implementation; complete candidate review and two-file A17 precede
publication. All old decisions and R2 boundaries remain.


## D-028 — PLAN-REV16 interview coverage execution (2026-09-12)

User execution authority selects the first useful interview implementation. Existing
website IDs support a bounded Teaching/NTHS/FFA supplement without importing unreviewed
intake entities. Amend the proposal's future fresh-source prerequisite explicitly for
this unchanged-catalog case; preserve it for catalog additions. Separate financial-need
discovery from typed acute-need disclosure. No/skip stays unknown, all existing controls
remain reachable, and source/release gates remain reserved. Policy/mapping review precedes
code; exact local candidate review precedes completion. Do not erase Revision15 diagnostics
or create premature canonical acceptance. See INTERVIEW_COVERAGE_EXECUTION_PLAN.md.


## 2026-09-13T00:50:09.543072+00:00 — R2 second release after verified predecessor

PR44 delivered REV15/REV17 at16092cb with exact Preview/CI/Production proof.
Integrate original979122a ancestry and reviewed runtime unchanged, preserve both
canonical amendment objects/evidence/artifacts, and use the reviewed union of
validator/test changes. Record distinct REV16 authority/baseline; planRevision stays17.
No source, workbook, configuration or later-phase scope is added.

## 2026-09-13 — PLAN-REV18 bounded local R3 catalog refresh

Kelsey granted the exact independently reviewed R3 scope with “yes, authorized.” The
reviewed proposal at adf45e4 and checkpoint f95464d fixes the allowed source, metadata,
projection and local-only effects. Adopt it prospectively without reopening R1/R2 or
promoting saved facts to current official truth. A full-Master scan or whole-workbook
copy would exceed this grant; reading only A1:O417 with explicit moved/newer/unresolved
outcomes meets the selected reconciliation need. Preserve original receipts and IDs.

Use a distinct immutable catalog/connection bundle while preserving existing criteria,
publications and unknown handling. Review policy before source access, then source and
mapping before product changes. Add only an exact off-hosted REV18 false-release-authority
exception; preserve the three final canonical-artifact errors and all historical gates.
R3 completion is local review only; R4 authority and attestation remain separate. Local
rollback is abandonment of these new commits; external rollback or restore is unauthorized.

## 2026-09-13 — R3 connector metadata supplement approved

Kelsey replied “approved, proceed” after disclosure of the exact connector supplement
and incidental editor identity exposure. Adopt only the hash-pinned proposal through
the prospective REV18 appendix, BUILD_STATE.connectorSupplement and connector-authority.json.
The earlier proposal and policy reviews retain their original candidates and bytes.
Require fresh independent policy review before new source calls. Discard incidental
editor identity and raw spreadsheet URL before output or persistence; require current
revision proof and both equal complete captures. Unknown trashed status stays unknown.
No source cell bounds, original mapping/product gates or R4 effects change. If the
connector still fails to prove current revision, preserve the blocker without substituting
timestamp-only evidence, credentials or broader reads. Original R3 authority persists.

## 2026-09-14 — R3 independent freshness comparisons approved

Kelsey directly approved the reviewed freshness correction with “approved. proceed.”
The earlier cross-resource exact timestamp equality assumption is superseded only by
the hash-pinned correction and its explicit authority record. Each timestamp and the
reported revision token must remain independently stable across four ordered observations;
two complete bounded captures must match. No arbitrary tolerance, additional reads,
current-head guarantee or R4 authority is implied. Attempt1 remains consumed. Preserve
all prior proposals, grant records, review bindings and failed observations. Independently
review this prospective correction before attempts2/3; mapping review still precedes
product edits. This records the approved removal of an acceptance check explicitly.
# 2026-09-14 — R4 exact catalog release authorization

Kelsey approved publication, Preview, merge, Production and verification after explicit
disclosure. Record the direct receipt in docs/evidence/r4-catalog/authority.json and
REV18 deliveryAuthorization before effects. Keep planRevision18: R4 must satisfy its
reserved canonical manifest/review/attestation gates without relaxation or rebinding.
Preserve the original R3 grant and all runtime bytes. Only R4 policy/evidence/routing
and canonical two-file attestation are added. Existing decisions and triggers below
remain on their separate routes; no R5–R7 authority is implied.


## Plan Revision 19 — exact Whitefish identity delivery continuation

Kelsey directly approved the independently reviewed correction proposal on September14,2026.
The receipt embeds the exact proposal and independent review in
`docs/evidence/r4-identity-repair/authority.json`; PLAN-REV19 state pins its21-path scope,
original A18/C18/baseline, Whitefish author/committer identity and existing target/effects.
This is R4 delivery only. All stage pointers remain null; completed stages remain complete.
Original REV18 amendment/grant and all prior evidence/reviews/attestations remain canonical
and byte-identical. No force push, rebinding, subscription or access change is permitted.

Only codex/r4-whitefish-delivery-repair descending from original A18 may prepare C19.
Freeze this prospective policy and obtain independent fresh-context read-only PASS before
implementation. Preserve all A18 blobs outside the finite allowlist, including every product,
catalog, source/fixture, dependency and deployment/CI byte. Package changes only append
`node --import tsx scripts/test-r4-identity-delivery.ts` to the existing test command.
Preserve all original state objects; only planRevision19 and the new amendment are added.

The sole tip-lock exception permits only a separately valid canonical REV19 direct-child
two-file attestation A19 to replace original A18 as REV18's allowed undelivered tip. C19
must descend from A18 and its manifest covers the entire pinned M0-to-C19 change set.
Require fresh independent full-candidate review, C/H0 and count-matched dispositions.
Before A19 retain REV18's original tip error plus all three missing REV19 artifact errors;
all other diagnostics block. After A19 actual local and hosted-mode validators must exit0.
A19 must remain tip until delivered. Original PR46 and its branch/head stay immutable.

During preparation validate active candidate preservation. Once A19 exists validate
immutable C19/A19 trees, never freeze future runtime/state to this release. Later separately
authorized stages may evolve them normally, but original repair amendment/authority, policy
review, manifest and historical proof must remain exact. All new commits from A18 through
A19 must have Whitefish author AND committer; verify GitHub head attribution before delivery.
Add negative regressions for identity, pins, changed evidence/grants, expanded allowlist,
missing authority/review, wrong ancestry, extra/non-direct attestation, post-A19 tips, and
valid later evolution with rejection of changed historical proof. Preserve all older gates.

Run full plan/typecheck/test/build, intake/coverage/R3 saved-evidence and P9/trace checks,
plus git diff --check. Recompute runtime/bundle equality to bind existing local browser proof.
Publish the new reviewed branch/PR under existing R4 effects, then close PR46 unmerged with
replacement identified. Verify exact Preview/CI before exact-head ancestry-preserving merge;
verify exact Production commit/catalog/compatibility/API/browser/public CSV/source capability
afterward. Request-body/download evidence unavailable through hosted tools stays unknown.
Record post-attestation observations outside the locked branch, then a local-only handoff
after merge. No extra unreviewed closeout push. Continuing provider rejection is a blocker.

No source/workbook access or writes, research, product change, configuration/credentials,
paid/access actions, rollback, monitoring, provider/applicant interaction or R5–R7. Retain
all existing owners/triggers,257-operation no-replay, recovery objects, hold/research queues,
criteria/definition/Bonita/NTHS issues and historical verification limits unchanged.


## D-UX1 — Four-screen journey first, direct timer continuation

- Date: 2026-09-16. Status: prospective; local policy review required.
- Evidence: Kelsey's exact request/clarification/execution grant in PLAN-REV20.md.
- Decision: separate UX release before timer, with required progression and optional
  nonessential answers; reorder existing screens 1,4,2,3 and retain Back/edit.
- Alternatives: combining scheduler/email work delays independently useful UX; forcing
  answers contradicts the user's clarification. Neither is selected.
- Impact: navigation/wording only; original questions, data, matching and privacy remain.
  Supersede only the prior early-results/optional-section presentation prospectively.
- Rollback: retain local baseline; no destructive reset or deployed rollback authority.
- Continuation: Codex must follow UX plan section7 directly into timer M1 after verified
  UX delivery; preserve timer009fa57 and use delivered UX in later timer code baselines.


## D-UX1-COPY — Optional-answer cleanup from user preview feedback

- Date: 2026-09-16. Direct user authority: docs/evidence/ux1-cleanup/authority.md.
- Decision: refine the existing unshipped UX1 release; remove visible prefer-not and
  sensitive-skip controls and extra explanatory copy. Keep substantive questions,
  optional blank answers, clearable radio responses and normal navigation.
- Scope: Wizard plus copy-only Browser/page changes; no matcher/schema, source,
  privacy mechanism, persistence or timer change. Preserve legacy compatibility.
- Review: prospective cleanup review before affected edits; separate final review.
  Original candidate and all UX1 evidence remain immutable and unrebound.
- Rollback: retain d7e8872 locally; no history rewrite or deployment authority.
- Direct timer handoff remains required and unchanged.
