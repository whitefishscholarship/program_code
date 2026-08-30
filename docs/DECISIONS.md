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
