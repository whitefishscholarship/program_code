# Scholarship intake evaluation build plan

Plan ID: SCHOLARSHIP-INTAKE-1
Prepared: 2026-09-10 America/Denver (2026-09-11 UTC)
Status: proposed; local planning only, audit not started
Protection update: user-requested complete-workbook backup requirement, 2026-09-10 Denver
Kickoff: [SCHOLARSHIP-INTAKE.md](kickoffs/SCHOLARSHIP-INTAKE.md)
Continuation: [CURRENT_HANDOFF.md](CURRENT_HANDOFF.md)
Planning observations: [inventory and sample limitations](evidence/SCHOLARSHIP-INTAKE-planning.json)

## 1. Outcome and authority

Evaluate scholarship candidates throughout the existing workbook, especially records
held outside Master Database. Produce a complete, independently reviewed decision for
each input row and an evidence-backed batch of additions or narrowly related updates.
Every proposed award also receives a tagging review and interview-coverage decision.
Accuracy takes priority over the number of additions. Unsupported facts remain unknown;
they do not prevent completing supported work elsewhere.

This proposal is subordinate to AGENTS.md, SCHOLARSHIP_SYSTEM_BUILD_PLAN.md and
BUILD_STATE.json. The present instruction authorizes documenting the plan and kickoff,
not execution, spreadsheet mutation, or delivery. Sending the kickoff starts only the
bounded local preparation and read-only evaluation described below.

Verified planning baseline: main `5fa08541b6b49484dedc8fc06012e47c658ce8fb` (PR43).
Canonical revision14; P0–P9 including P8R/P8M/P8F accepted; active/next pointers null.
P9, shortlist PR42 and interview relevance PR43 remain complete. Local delivery closeout
`7bd12107606e9a8c426058b21864d7cc8fbd2cd8` supplies the preserved handoff and
PLAN-REV14-delivery.json. Reverify main at execution; these are baseline observations.

| Action | Authority boundary |
| --- | --- |
| Document this proposal, local commits and plan review | Authorized now; no canonical activation |
| Local prospective amendment, read-only workbook audit, bounded official-source verification, tagging proposals, tests and independent review | Authorized when the user sends this kickoff; first complete the policy checkpoint |
| Create private full-workbook/recovery-test copies and write approved additions, related corrections, tags or staging dispositions | New exact batch authority after a concrete reviewed dry run, naming backup destinations and recovery effects; old P5/P9 grants do not cover this intake |
| Push, PR, Preview, merge, Production and hosted verification | New release-specific authority for every effect, or verified applicable deployment suppression |
| Full Master freshness review, scheduled updates, automated writes, website publication, new interview questions or rules | Deferred; separate selected scope and authority |

## 2. Fixed dataset and practical scope

Organizer workbook: [Whitefish HS Scholarship Database](https://docs.google.com/spreadsheets/d/1Dp5AMnrfSQ-Xf-r03S75lKsGPJk7o0inOgvC9Q6lOl4/edit).
Spreadsheet ID `1Dp5AMnrfSQ-Xf-r03S75lKsGPJk7o0inOgvC9Q6lOl4`;
destination/reference tab **Master Database**, gid0. This is organizer authoring data;
the deployed application consumes a separate immutable publication.

The initial inventory below is a planning aid from read-only session observations.
Counts are named entries, not verified distinct awards, and exclude separately noted
nameless rows and headers. Recount against the execution snapshot; never make these
counts an acceptance target or interpret name inequality as proof of a new scholarship.

| Tab | Named entries observed | Evaluation role |
| --- | ---: | --- |
| Ingestion Staging | 373 | Primary queue; every status, including DUPLICATE, PUSHED, EMPTY and FETCH-FAILED |
| Scraped Data | 429, plus 9 populated nameless rows | Full candidate reconciliation; contains aliases, headings, aggregates and possible omitted awards |
| Removed 2026-06-16 | 14 | Recheck removal reasons; mixed schemas and repeated header |
| Removed 2026-06-17 | 1 | Reconcile Conquering Cancer with its staging copies |
| Curated Review 2026-07-05 | 23 | Reconcile 19 pushed entries and evaluate four other decisions |
| Curated Review 2026-07-11 | 61 | Reconcile 11 pushed entries and evaluate all 50 dropped decisions |
| Curated Review 2026-06-17 | 17 | Historical decision support; apparent Master matches require identity checks |
| Master Database | 197 | Destination identity/reference for all inputs; verify fields touched by proposed changes |
| Archive | 77 | Historical cycles and identity comparison; no duplicate import |
| Student View | 16 | Derived presentation comparison; displayed status is not current-source evidence |
| Master backup 2026-07-12 | 186 | History/delta comparison, not a second destination |
| Staging backup 2026-06-17 | 229 | History/delta comparison; recover genuinely missing candidates if found |
| Start Here | Reference | Read instructions as workbook context, not action authority |
| Categories | Reference | Existing vocabulary, checked against actual application definitions |

Inventory all tabs, including hidden tabs and any added since planning. Read every
scholarship-bearing populated row in the frozen workbook scope. If new tabs belong to
this same candidate/history purpose, include them and record the delta. Unrelated or
applicant-data tabs receive metadata-only exclusion with reason. History/view rows can
receive linked-reference dispositions without another full source investigation when
identity and content equivalence are established. Any materially different award,
cycle or eligibility detail returns to the candidate queue. Full current-fact review of
unaffected Master rows is deferred.

Do not access the legacy comparison-only workbook `1eWGMdavcEECUcY_-nZ9gR2nMTN7T7T6oipG5ql1LoIE`.
Do not collect applicant data, outreach contact details, credentials, or application
submissions. Scraped Data has scholarship fields A:Q and legacy contact/outreach/applicant
count columns R:T: default to A:Q. Inspect further only through a safe field-specific
selection for a needed public scholarship link; never bulk ingest those columns.
Preserve formulas and rich-text hyperlinks in approved scholarship fields, not only
displayed labels. Identify each tab/section's actual schema before interpreting it.

## 3. One workstream, five checkpoints

These checkpoints divide one bounded intake effort for resumption; they are not five
new program stages, approval committees, or separate software projects.

1. **Policy and snapshot.** Verify Git baseline and preserved work; record the user's
   kickoff authority. In one dedicated prospective amendment, adopt this fixed scope
   into the canonical plan/state and decision log. Select the next unused revision.
   Permit local read-only preparation without Git/Vercel delivery authority explicitly;
   if needed, make only the corresponding narrowly scoped validator adjustment.
   Preserve all historical gates and authority objects. Obtain fresh-context read-only
   policy review before the full audit or affected implementation. This is a local
   preparation checkpoint, not final attestation or acceptance. Then capture workbook
   identity, tab IDs, actual ranges, field allowlist, retrieval times and revisions when
   available, content hashes and complete row accounting. A multi-call read is not
   automatically an atomic snapshot: recheck revision/fingerprints before and after;
   if unavailable, reconcile repeated bounded content reads and state the limitation.
2. **Row evaluation.** Start with Ingestion Staging, then Scraped Data, removed/curated
   tabs and historical/reference reconciliation. Group overlapping identities first to
   reuse evidence. Research every candidate group, record every source row's decision,
   and account for every discovered child. Work in batches of about 25 entity groups;
   this is a checkpoint size, never a completeness cap. Commit after each useful batch.
3. **Tags and interview coverage.** Evaluate every proposed add/update for evidence-backed
   fields, controlled tags and the coverage decisions in section6. Prepare one exact
   promotion dry run and generate a concise readable report from the ledger.
4. **Independent review.** A fresh-context read-only reviewer checks 100% of row
   dispositions, duplicate destinations, proposed fields/tags and coverage decisions.
   The implementer fixes findings; the reviewer rechecks changes. Finalize a tested,
   reviewed local candidate with explicit holds and request only the exact batch
   authority needed to apply it. A held minority must not block a supported batch.
5. **Authorized application, if granted.** Apply only that reviewed, unchanged batch
   using section7 controls. Reconcile the result and preserve a receipt. If authority
   is absent, finish at `review-complete / awaiting exact batch authority`; do not
   describe unapplied rows as promoted. Do not start the later full-master audit.

Settle any sheet-write or publication authority that changes the candidate before its
final governed freeze/attestation. Keep working through ordinary local checkpoints
while authority is pending; do not prematurely attest a branch that still needs edits.
Final acceptance, if pursued, follows the existing immutable-candidate, complete-manifest,
fresh-context review and direct-child two-file attestation contract. Local review-complete,
sheet-applied, accepted and delivered are distinct states. Never append to an undelivered
attestation or reuse a previous release's authority.

## 4. Evidence and inclusion decisions

Use the official sponsor/program page and award-specific rules or linked PDF. Follow
links needed to identify the award, application route and actual conditions. Use one
targeted official-source search when the saved route is stale or ambiguous; follow
additional directly relevant evidence when it can resolve a material question. Stop
unproductive exploration with a documented hold and next action; do not start unrelated
scholarship discovery. Log accessed URLs, redirects, time, cycle, relevant field evidence
and conflicts. A responding URL is not proof of accuracy; AI agreement is not evidence.

For a multi-award source, enumerate all relevant entries/pages before claiming complete
coverage. Track discovered, reviewed, deferred and inaccessible children with stable
cursors. An extraction cap, blocked page or partial directory must leave an explicit
queue/coverage limitation. It cannot silently become “no other awards.” Children directly
needed to resolve an in-scope aggregate belong in this audit; an unrelated discovery
stays deferred. Do not submit forms, sign into applicant portals, contact providers,
purchase access or create services. A public application login gate can be recorded as
the application route without collecting credentials or proving submission works.

A proposed addition needs supported award identity, a plausible path for the intended
Whitefish high-school-to-postsecondary audience, an official source and a verified
application route (including clearly supported offline/institution-handled methods),
and evidence that it is not already represented. Distinguish an individual award, parent
portal, shared application, tuition benefit/grant/contest and annual cycle. Propose
appropriate existing record types; never count a portal or number of recipients as
individual scholarships. Types whose inclusion policy is unresolved remain explicit
policy holds rather than silently expanding the catalog.

Missing optional amount, GPA, renewal or exact deadline can remain unknown. Missing
identity, contradictory audience evidence or an untraceable duplicate cannot support
an addition. A past/closed cycle is not proof the recurring award should be discarded;
retain its exact cycle and closed/unknown status without inventing next year's opening.
An annual date without a year does not establish a current open cycle. Do not copy
“Any” from a blank or interpret “accepted or enrolled” as “college students only.”

Keep requirements, preferences, descriptive topics and application steps distinct.
Membership, employer-family, military-family, disability or other conditional eligibility
is not automatically incompatible with a graduating senior. Nor does a career interest
prove training enrollment or membership. Preserve narrower conditions explicitly.
Resolve contradictory official sources using award specificity, currency and the current
parent route; unresolved material conflicts remain held. Never inherit every parent
condition or topic onto every child award.

Record exactly one disposition for each input row: `propose_add`, `propose_update`,
`link_existing`, `duplicate_of`, `hold`, `out_of_scope`, or `non_record`.
Each includes evidence and rationale; duplicate/link dispositions must identify the
surviving entity and destination (existing row or proposed operation). Distinct annual
cycles and shared applications remain related records rather than accidental duplicates.
Name normalization and URL similarity nominate comparisons; neither proves identity.
No group can consist entirely of discarded duplicates without a surviving destination.
Historical status/AI confidence never substitutes for evidence. A note attributing an
exclusion to Kelsey is a prior-decision lead: preserve it, verify available provenance,
and surface any proposed reversal in the exact approval batch; do not silently override it.

## 5. One ledger and reproducible evidence

Create `docs/evidence/SCHOLARSHIP-INTAKE-ledger.json` as the sole decision/status ledger.
Reuse existing repository types/helpers when useful. No generalized review platform,
new service, extra competing spreadsheets, or separate reports with independent statuses.
Keep non-PII source snapshots/excerpts in a sibling `scholarship-intake/` evidence folder;
generate the readable report and proposed write batch from the ledger.

Required ledger contents:

- **Inputs:** snapshot ID, workbook/tab IDs, ranges and section headers, allowlisted
  fields, hashes/revision evidence and retrieval times; counts for populated rows,
  non-records, named and nameless records, and explicit excluded fields/tabs.
- **Rows:** stable ID anchored to snapshot + tab ID + original row + row-content hash;
  provenance, original status, entity ID, disposition, evidence references, rationale,
  destination, review outcome and reviewer. On changed inputs, use content/identity
  reconciliation; row numbers alone are not stable IDs.
- **Entities/fields:** aliases, type, parent/child/group/cycle relationships; existing
  Master/publication identities; each proposed field's old/new value, source locator,
  concise evidence, observed time, uncertainty/conflict and decision. New children get
  provenance to their parent source even if they lacked their own spreadsheet row.
- **Tags/gaps:** section6 mapping and rationale, supporting award IDs, explicit unsupported
  dimensions, proposed storage and coverage decisions.
- **Batches/review:** operation IDs, row/entity coverage, dry-run hash, review scope/hash,
  findings/dispositions, completion counts and remaining cursor. Holds carry reason,
  owner, next evidence/action and a useful revisit trigger; no invented deadline.

Separate observed facts from judgments and unknowns. Evidence excerpts must be short,
field-specific and respect source rights. Do not commit bulk copyrighted pages, applicant
information or credentials. Test completeness by reconciling every selected populated
row exactly once; account for intentionally excluded sensitive fields without reading
their contents. Input-row totals, unique entities, award additions, portal links, cycles
and unresolved groups each have separate denominators.

## 6. Tagging and interview-gap review

Read the current Categories tab, actual interview question/choice IDs and current
publication/mapping definitions; do not treat the old planning list as live truth.
For every proposed award or related update, review academic/program focus, activity,
financial-need preference, geography/education conditions, affiliations and other
supported eligibility dimensions. A reviewed “unknown / no supported tag” is valid.
Use the existing controlled vocabulary where meaning matches. Preserve exact narrower
requirements alongside broad discovery tags. Tags describe public awards, never people.

Each proposed tag records its stable key, display label, meaning, evidence, requirement
versus preference versus topic, existing question/choice mapping if any, and a qualified
explanation. Do not equate similar organizations or automatically use a sponsor name
as applicant eligibility. A broad tag cannot authorize a new exclusion or claim a
student qualifies. Preserve GPA/school filtering, all-award access, privacy and exact
visible-result CSV behavior; this effort changes no application runtime behavior.

Give each relevant unmet dimension one decision: reuse an existing choice; propose a
narrow wording improvement; propose a new category; or explain the condition on the
award card only. Group repeated gaps by meaning and list supporting unique awards.
Assess whether a question would materially improve discovery, duplicates an existing
answer, is understandable/answerable, or adds unnecessary sensitive disclosure. Frequency
is evidence, not an arbitrary minimum threshold. A rare employer/family condition will
often be clearer on the award card than as a permanent question. No missing interview
category prevents an otherwise supported award from entering Master.

Deliver a prioritized gap list with evidence, candidate wording/answer choices where
useful, covered awards, expected relevance benefit and privacy/UX tradeoffs. These are
proposals for later selection, not permission to add questions or activate matching.
For example, Chuck Peacock may support the existing aviation-management choice after
verification; that does not call for a new question.

Specify exactly where tags will be stored. Master currently uses the observed A:O
scholarship schema; do not silently add columns or overload summaries with hidden
machine tags. Default to reviewed local metadata keyed to stable award identities;
include a concrete minimal sheet-column/metadata proposal only if useful. Any added
column/tab, validation rule or tag write requires inclusion in the exact write batch.
Spreadsheet rows and tags do not automatically update the immutable website publication.
Record the future publication mapping needed, without editing released artifacts.

## 7. Concrete promotion batch and safe application

Before requesting write authority, produce `docs/evidence/SCHOLARSHIP-INTAKE-proposed-writes.json`
and a readable summary with all additions, related corrections, prior-decision reversals,
staging markers and any schema changes. Include exact workbook/tab IDs, target cell
allowlist, stable operation/entity IDs, before/after values, expected row/content
fingerprints, evidence, review outcome and batch digest. Exclude unresolved operations.
Keep reference/history tabs unchanged unless a specific necessary write is approved.
The approval package must also name the private backup destination, backup owner,
verification/recovery method and any proposed recovery-test copy. This documentation
update authorizes no actual copy, source write, permission change or restore.

### Mandatory complete-workbook backup before any source write

After exact batch authority and before the first source-workbook mutation of any kind,
create a separate, dated, native-format backup of the **entire original workbook**.
This includes all tabs, hidden tabs, Master Database, staging, history and reference
data; a backup tab inside the original workbook, CSV export, or affected-cell extract
does not satisfy this requirement. Preserve the original file identity, title and links.
Retain the existing affected-cell backup as well, for precise reversal of the batch.

Use a private destination approved in the batch grant, accessible to Kelsey and the
authorized recovery operator, with no broader access than the source. Verify destination
access rather than assuming sharing is inherited. Never publish or commit workbook
contents to Git, attach them to the report, or make a public backup link. Prefer a
provider-side copy so unrelated contents are not ingested into the audit. This does not
override the prohibition on applicant data: if the full copy would include out-of-scope
sensitive material, keep source writes blocked and resolve a permitted owner-managed
backup route and verification scope; do not silently make a partial backup or inspect
the sensitive contents. Read-only scholarship evaluation can continue.

Verify the backup before unlocking writes:

1. Record source and backup file IDs/URLs, native format, owner/location, creation time,
   source revision/fingerprints, complete tab inventory (including hidden state), and
   batch digest. Establish a stable source state across capture, backup verification
   and the pre-write check; a successful copy response alone is not verification.
2. Open the backup read-only using authorized access. Reconcile tab names/order,
   dimensions and non-sensitive structure, and approved content/formula fingerprints.
   Verify recoverable values, formulas, rich hyperlinks, formatting, validation,
   named ranges, filters, notes and protected ranges where present and relevant.
   Inventory other workbook features such as charts, connections or bound automation;
   do not assume native copying preserves them, sharing settings or revision history.
   Record preservation limits and a concrete recovery method for every material feature.
   Unverified or missing material recovery coverage blocks source writes.
3. Demonstrate recovery of the proposed operation types in an explicitly authorized
   disposable copy, using only approved scholarship cells and the inverse operations.
   Compare restored values/formulas/links/structure to the baseline. Never test recovery
   on the original or alter the preserved full backup. Do not activate copied scripts,
   schedules or external connections. Record proof and limitations; actual source
   rollback still requires its exact authority and current-state checks.

Save a non-sensitive receipt at
`docs/evidence/SCHOLARSHIP-INTAKE-backup-verification.json`, referenced by the ledger
and handoff. It records the checks above, PASS/failure per check, recovery evidence,
operator and exact grant, affected-cell backup location and any unresolved limitations.
Keep the complete baseline backup unchanged throughout execution and closeout; no
automatic deletion or overwrite. Its eventual deletion requires Kelsey's explicit
instruction. After a pause, source change or completed earlier batch, create and verify
a fresh full backup for the next write batch. Reuse within the same uninterrupted batch
only while the verified source preconditions and backup coverage remain valid.

**No verified complete backup and recovery proof means no source write.** A copy failure,
inaccessible backup, inconsistent snapshot or unresolved recovery limitation leaves the
approved batch unapplied. Report the exact issue and continue independent read-only work.

### Apply and reconcile the approved batch

Once the complete backup gate passes, verify target identity and current fingerprints;
retain the reversible backup of every affected cell, formula, hyperlink, validation or structure.
Pin intended append locations and use one writer, idempotent operation IDs and immediate
pre-write comparison. A sheet without transactional compare-and-swap is not concurrency
safe by assumption: establish a confirmed quiet write window or an available atomic
precondition, and otherwise keep the batch unapplied. If inputs changed, preserve manual
edits, regenerate only affected operations and re-review them; materially changed batches
need renewed exact authority. Never overwrite the whole sheet or delete staging history.

Read back every targeted cell and reconcile expected values, row identities, duplicate
counts, formulas/hyperlinks and unaffected bounded ranges. Record partial failures and
uncertain writes before retrying; read to determine what actually applied. No blind
retries or automatic rollback over newer edits. Supply an inverse operation plan and
obtain rollback authority in the batch grant if desired; execute it only against matching
post-write fingerprints. Keep staging provenance with approved promoted/destination
markers. A successful write API call alone is not a reconciled promotion.
If a processing error is detected, stop further writes, record which operations actually
applied and preserve current evidence. Prefer the exact authorized cell-level inverse
after checking that it will not overwrite newer edits. Whole-workbook recovery is an
emergency option requiring explicit restore authority, a snapshot of the current state,
and a reviewed reconciliation of changes made since the backup. Do not replace, delete,
rename or repoint the original automatically. A backup is a recovery source, not blanket
permission to discard later work. Verify the restored result before declaring recovery.

## 8. Verification and acceptance

Require deterministic checks for complete row/discovery accounting, identity collisions,
duplicate destinations, evidence references, allowed dispositions/types, unsupported
facts, tag vocabulary/mapping, valid operation targets, preconditions and repeatable
dry runs. Exercise materially relevant failure cases: nameless records, repeated headers,
rich hyperlinks, alias duplicates, multiple awards on one source, closed/unknown cycles,
source conflicts, restrictive-but-possible eligibility, changed sheet rows, partial
writes and retry prevention. Use synthetic write fixtures, never a live test mutation.
Also test that writes remain blocked for a missing/incomplete/inaccessible/stale full
backup, missing recovery proof or a changed source fingerprint. The explicitly authorized
disposable recovery-copy exercise in section7 is distinct from synthetic tests; neither
permits a test mutation of the original workbook.

Every execution candidate runs AGENTS.md's stage-specific and baseline commands from
web: `npm run plan:check`, `npm run typecheck`, `npm test`, `npm run build`; use the
canonical clean-install requirement and root `git diff --check`. Preserve any required
existing runtime boundary check. Record actual results/times and environment limitations.
Passing code checks does not establish scholarship accuracy.

The independent reviewer receives the original objective, adopted policy, exact baseline,
immutable candidate/diff, complete ledger and input hashes, official field evidence,
validation results and read-only instructions. Review all row dispositions including
holds/exclusions and history links, and all proposed writes/tags/gaps. Equivalent rows
may share an evidenced identity-group review; none may be omitted. Reviewer checks the
underlying evidence and source currency, reopening material sources where needed, rather
than agreeing with generated summaries. Findings are remediated by the implementer.
No unresolved critical/high findings; medium/low findings need count-matched dispositions
with rationale, owner and target under the existing contract. Recheck changed evidence.

The local audit finish line is: every in-scope row accounted for; every material discovery
limit visible; every proposed field/tag/operation supported and reviewed; all holds have
an actionable reason; the gap report and exact dry run are complete; required checks and
independent review pass; and handoff identifies the next action. It does not require
resolving every inaccessible provider or inventing missing facts. Report `review-complete`
with remaining holds and unapplied status honestly. `sheet-applied` additionally requires
the exact grant, verified complete-workbook and affected-cell backups, recovery proof,
preconditions and readback receipt. Governed acceptance/delivery
remain subject to the canonical contract, not inferred from either label.

## 9. Durable session handoff and bounded follow-up

Keep the operative top of CURRENT_HANDOFF updated at each batch and before stopping:
plan/revision, exact branch and last checkpoint commit, verified main baseline, snapshot
and ledger hashes, current checkpoint/cursor, row/entity/review counts, completed checks,
unresolved issues with owners, pending authority and the next executable action.
Before/after an authorized write, include the backup receipt path, full backup ID/location,
source revision and batch digest, verified recovery status, retention owner and any actual
rollback/readback outcome. A missing backup is pending work, never an assumed success.
Name the paths a new session must read. Resolve the committed branch tip and report it
in the session closeout; do not try to embed a commit's own hash inside itself.

On resume: read the required order, verify branch/status and recorded hashes, inspect
work already completed, then continue the next incomplete batch. Do not restart all
research because the conversation changed. Retain dated evidence and recheck only
changed/expired facts or facts needing fresh confirmation before an approved write.
Detect live workbook changes separately; do not silently replace the frozen denominator.

After intake, preserve three optional next-work items: full Master current-fact audit;
carefully bounded scheduled refresh with field-specific confidence, exception handling
and exact auto-write authority; and publication/interview changes selected from this
audit. Do not build or activate them here. No new services, dashboards, administrative
roles, repeated approval ceremonies, or unrelated maintenance are needed for this audit.
