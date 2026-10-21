# Bounded SD2 consolidation and hold-reconciliation proposal

October 15, 2026, America/Denver. Local proposal only; execution is not selected.
Entry: `37d0b041423fb9db8eb9bf63484694230e1ac12f` on
`codex/plan-student-data-maintenance`. Owner: Codex source/identity reconciliation.
Kelsey selects additional execution scope. Stop before SD3.

## Decision prepared

Select one saved-evidence-only pilot covering three complex identity cases and
four saved inputs, in this order: Spear45, Live Your Dream290, Jaycee40, Jaycee68.
Produce a reviewable comparison of existing holds and evidence; retain all facts,
IDs, mappings and source actions in their existing held state. This would test a
lossless reconciliation method before proposing a whole-SD2 consolidation.

This session prepares this proposal, pins its scope, verifies preservation and
obtains independent proposal review. It does not perform the pilot, resolve holds,
create a consolidated factual ledger, or restart research. A proposal PASS means
the proposal is reviewable within its limits, never that the facts are accepted.

The selection is a recommendation based on the two original SD1 app-ID holds and
the sole duplicate-name pair in the saved inventory. It is not a claim that these
are the only or most severe remaining SD2 issues. Keeping the pair together is
necessary to inspect track/ID continuity without silently merging the records.

## Observed saved baseline

`checkpoint-021/FINAL_SESSION_AUDIT.md` and the fresh entry audit in
`entry-audit.json` establish the following local saved-evidence counts. No live
workbook, source, GitHub main or deployed target was refreshed for this proposal.

| Denominator | Saved state and limit |
| --- | --- |
| Original selected F/G/O inventory | 794 positions; 411 named, 383 empty in that projection; 410 unique exact names. Not distinct accepted awards or a current whole-workbook baseline. |
| Autonomous initial queue | 406/406 initial dispositions, cursor406, no next input, zero unprocessed. Excludes earlier researched locators18,40,68,255,400. |
| Autonomous held envelopes | 7,406 fields and 406 identities across21 packets; zero accepted facts. Initial coverage is complete; full SD2 remains incomplete. |
| Prior research | First-three packet and two Jaycee records remain separate, with their original holds/reviews and PRELUDE supplements. Do not add their representations to autonomous counts as unique facts. |
| Source and locator routes | 676 seed/alias, 1,127 selected-source-link, 365 source-receipt and628 converted-destination occurrences. These are occurrences, not unique URLs or awards. |
| Special inherited routes | 35 source receipts in001/002 retain their original shared routes; one019 converted destination remains unclosed. No historical schema rewrite or URL reconstruction. |
| Retained dependencies | Nine original attention rows and every supplement;437 M1 records/12 pins;71 original temporary-custody pins. |

The entry audit passed before any proposal edit and rechecked021's review-bound
closure,20 earlier research bindings, original custody hashes and M1 pins. Its
timestamps describe that audit only. Temporary-file availability is not promised
for a later session. All pre-proposal tracked bytes and modes, except the three
append-only handoff surfaces, are separately protected by `verify.py`.

The canonical build-state stage pointers remain null; P0–P9 remain historical
accepted stages. SD2 is local research/proposal work under its existing boundary.
This document changes no canonical plan, build state, acceptance gate or authority.

## Exact proposed pilot

`scope.json` pins packet hashes, record pointers, ordered IDs and counts. Saved
row numbers are locators, not stable award IDs. These four inputs represent96
existing field envelopes:17+17 autonomous and31+31 Jaycee. They are not96 new facts.
The Jaycee pair is outside the exhausted406 queue; it is not appended to that queue.

| Order and saved input | Existing candidate / evidence | Proposed comparison and required retained hold |
| --- | --- | --- |
| 1. row45, Gladys R. Spear Memorial Scholarship ($500) | `award-8bce77306c27`; `checkpoint-001.json` record0; `sources/spear-2025.md` and `spear-2026.md`; SD1 pilot | Compare the two exact document identities, school/program and version evidence. Distinguish the historical250-word term from the2026 brief-essay requirement and two recommendations. The2026 use year/deadline cannot become a future offering. Preserve public-access/publisher-custody and identity acceptance gaps. |
| 2. row290, Live Your Dream Award | `award-52b096183d9d`; `checkpoint-001.json` record1; `sources/soroptimist.md` and `sor-preparing.md`; SD1 pilot | Compare saved app/source identity and public-program continuity. Retain annual August1–November15 wording without assigning a cycle year/open status; separate club/region/international award levels and reference requirements. Program identity observations do not accept app mapping or prove a current usable route. |
| 3. row40, Montana Jaycee Foundation Scholarship | `award-67de97a4f446`; `sd2-jaycee/proposals.json` record0; `PRELUDE.json` | Compare the vocational/technical/trade track's saved legacy/current document continuity and exact supplied human decisions. Keep historical organizer label, unresolved explicit replacement/legal relationship, amount-choice/GPA-basis/need/checklist gaps and all31 field holds. |
| 4. row68, same recorded name | `award-e05338ef963f`; `sd2-jaycee/proposals.json` record1; `PRELUDE.json` | Compare the college/university track separately, then compare the pair for collision risk. Retain its distinct candidate/canonical ID, document/cycle/material scope and31 field holds. No name-only deduplication, union/intersection of rules or ordinal assignment. |

For Jaycee, `AUTHORITY.md` and `PRELUDE.json` already name Kelsey Stuart as human
reviewer and record approval of the enumerated deadline, discrete amount
alternatives, official application locators and cycle-specific materials. Preserve
that approval exactly. Do not ask Kelsey to name a reviewer again, rereview every
checkpoint, confirm original-sheet intent or establish sponsor identity from memory.
Those decisions do not accept every field, complete formal identity validation,
resolve omitted facts, grant writes or authorize publication. Earlier pending
reviewer wording remains historical; do not edit it to reflect later supplements.

## Procedure proposed for a separately selected pilot

1. Reground the governing documents and immutable proposal/review. Verify hashes
   in `scope.json`, the four exact record pointers, queue exhaustion and original
   candidate/manifest/review bindings. A mismatch blocks the affected comparison;
   report the exact path and preserve the last verified state.
2. Read only the selected saved records, their exact evidence references and
   associated saved source/metadata/review artifacts. Follow a saved artifact
   reference only for these records. A shared file may be inspected for exact
   relevant passages; other records remain outside semantic reconciliation.
   No source fetch, workbook/metadata access, search, form/portal/login, raw
   reacquisition, provider contact or temporary raw-document reinspection is part
   of this pilot. Hash-only custody checks may report availability gaps; preserve
   their receipts instead of reconstructing content.
3. Produce one derived comparison view under
   `docs/evidence/sd2-autonomous/consolidation-pilot-001/`, preserving original
   packet ownership. For each of96 envelope occurrences retain packet hash,
   record/field JSON pointer, exact original value/state/acceptance/scope/time,
   evidence references, explicit or inherited owner/trigger/action, and the
   reason a decision remains held. Prefer pointers/hashes over duplicate excerpts.
   Keep every input, candidate ID, source variant and original review reference.
4. Add an explicitly proposal-only reconciliation annotation per selected field
   and identity: existing evidence consistent, existing evidence conflicting,
   applicability/identity unresolved, or evidence unavailable. These describe
   comparison results only and cannot replace original fact states or release
   holds. Do not choose a winner, combine eligibility alternatives, refresh a
   timestamp or create new stable award/cycle IDs.
5. For missing proof, record the smallest additional evidence needed and its
   existing owner, trigger, authoritative path and next action. A suggested read
   remains unselected. Do not turn an old read mandate, scheduled trigger or
   evidence gap into permission to fetch after queue exhaustion.
6. Reconcile4 input occurrences,3 cases and96 field occurrences exactly once.
   Recheck the unchanged global baseline mechanically without semantically
   processing the other404 autonomous inputs or the other prior research records.
   Independent fresh-context review checks every pilot comparison, sensitive/
   identity/conflict/cycle/route/material qualifier and original binding. The
   author fixes defects; the reviewer rechecks the final immutable candidate.
   Preserve failed candidates/reviews. Stop at this pilot's reviewed handoff.

The pilot's comparison view is a generated review aid, not a second Reviews
queue, factual ledger, replacement source registry or publication adapter.
Existing packets remain authoritative. Even an evidence-consistent comparison
leaves identityAcceptance/acceptance held and acceptedFacts0.

## Deliverables and completion checks if selected

The proposed directory contains a96-occurrence comparison view, a four-record
identity/relationship assessment, exact evidence-needed proposals for remaining
gaps, validation evidence and an independent candidate-bound review. Each outcome
must point back to the original records and retain all their held fields/actions.
No original packet is edited. No new discovery or second source queue is created.

Use existing validators and the required plan/type/tests/build/diff matrix. Keep
standard-build EPERM visible; a different build mode cannot waive that gate.
Preservation compares every pre-pilot tracked blob/mode and exact prior handoff
bytes; frozen old verifiers keep their original path allowlists and bindings.
Run an old verifier in its valid entry context or use the preserved entry receipt
plus byte-preservation proof; never modify it to bless a later candidate.

Stop on identity/hash/scope mismatch, missing exact evidence, unexpected sensitive
content, incomplete field accounting or unresolved critical/high review finding.
Unknown is a valid outcome. A missing artifact does not justify another source
read, retired-workbook fallback, replay, hold deletion or inferred negative.

After the pilot, Codex may propose the next bounded SD2 slice using its evidence.
Whole-queue consolidation, complete canonical/public-ID collision/relationship
reconciliation, the remaining pilot awards, Pell/ND/Barnes, source refreshes and
human/canonical acceptance are not selected by this proposal. No later slice
starts automatically. SD3 remains unstarted even if all comparisons are held.

## Every open route remains owned

`checkpoint-021/FINAL_SESSION_AUDIT.md`, the21 ledgers and original wraps retain
the exact per-item owners/triggers/actions; section9 retains all nine attention
rows and supplements. The following is dependency routing, not a replacement list.

| Open dependency / authoritative path | Owner | Trigger and next action |
| --- | --- | --- |
| This proposal and exact pilot scope: this document and `scope.json` | Codex prepares; Kelsey selects execution | After reviewing this concrete proposal, select the exact saved-evidence-only pilot if desired. Codex then executes only that pilot and obtains independent review; no routine checkpoint reapproval within the selected scope. |
| All7,406 autonomous fields/406 identities, prior packets,365 receipts/35 inherited routes,676 seeds/1,127 links/628 destinations; original ledgers/wraps | Original recorded source/identity/evidence owners | Original applicable authorized evidence-arrival or separately selected consolidation trigger: retain each exact saved nextAction. Unselected records stay held; formal acceptance remains separately gated. |
| All historical source-fidelity/native/visual/completeness/silence/current/public/sponsor/route/custody limits;021 audit and original evidence | Original evidence owners | Before required future raw use/audit, verify original custody hashes or report gaps. At applicable selected reconciliation, retain or resolve the exact gap; conversions and author concordance are not original-source proof. |
| Output history,016 overlap,018 unmeasured interval and all earlier incidents; original capture/concurrency/assembly records | Codex evidence/governance/source execution | At later authorized history/canonical/publication review assess retained incidents; before any future output sanitize/narrow; before selected dispatch serialize normalized host/max4distincthosts. No erasure or retrospective relabeling. |
| Exact standard build and fresh authenticated main/target;021 validation and section9 | Codex validation/governance/delivery | Before canonical acceptance or authorized release, obtain exact build PASS in a supporting environment and authenticate current main/target. Retained build failures and historical remote observations remain limits, not current proof. |
| Workbook preservation/version/concurrency/permissions/native backup/recovery, hidden-P/formats, five-table adapter/public allowlist; contract and section9 | Original migration/publication owners | Only later separately selected SD3 design and exact live-effect gates: verify preservation/recovery before any selected valuable-source operation. No SD3 or workbook access here. |
| Human/canonical/publication/student-fit/filter/priority/CSV/browser gates; canonical plan/state/contract and section9 | Original governance/app owners; Kelsey selects scope/effects | Later selected acceptance/SD3/SD4: use prospective contract and original gates; verify actual student tasks. Named reviewer and limited Jaycee approval do not publish GPT-held facts. |
| All437 M1 routes/12 pins, ETV/Fund the Fish and setup/adoption/allowance/zero-overage/sender/receipt/suppression/pilot/catch-up/recovery/health issues;009fa57 and section9 | Original monitor owner; Kelsey selects reserved effects | Later selected M1/SD5 on fresh delivered UX: retain exact routes and selected recipient, reconcile Reviews/state ownership, select each setup/activation effect. No second queue, old-runner replay or monitor activation. |
| Remote Git/Preview/merge/Production/messages/configuration and all other external effects; AGENTS/canonical plan/state | Original governance/delivery owners; Kelsey selects effects | Before any such effect, verify direct stage-specific informed authority and exact targets. Local proposal/pilot selection grants none. |

## Review and next action

`entry-audit.json` records the successful original021 recheck before new files.
`validation.json` records this proposal's exact checks and limits. `verify.py`
checks unchanged entry bytes/modes, append-only handoffs, frozen counts/pins and
proposed scope; it does not assess scholarship truth or execute comparisons.
`final-manifest.json` and `review.json`, when present, bind independent proposal
review to its own immutable candidate. No earlier research review is rebound.

Original proposal candidate `d381c824` failed independent review on one MEDIUM
verification-evidence finding: the pre-freeze diff omitted then-untracked files
and missed a trailing blank line in a new command log. Its manifest/review and raw
log remain preserved in `manifest-round1.json`, `review-round1.json` and immutable
Git history. `remediation.json` records the author's EOF-only normalization,
original raw hash and superseded verification claims. Final checks require all
new candidate files staged and a complete frozen diff; only a matching independent
replacement PASS closes that finding. No scholarship evidence or scope changed.

No backend model/effort value is exposed in this session; no model switch was
requested. Recommended next-session effort: High. Preserve the original worktree
and branch; the live authenticated main/target gate remains open.

The next action belongs to Kelsey: select the exact four-input saved-evidence-only
pilot if desired. This selection boundary comes from021's saved kickoff and the
current request to prepare a proposal. Preparation and review are complete before
any selection is needed. No new source reads, initialization/reset/replay,
consolidation execution, fact acceptance, external effect or SD3 is authorized here.

Copy-ready selection:

```text
Select only the four-input saved-evidence SD2 hold-reconciliation pilot in
docs/evidence/sd2-autonomous/consolidation-proposal/PROPOSAL.md and scope.json:
Spear45, Live Your Dream290, Jaycee40, Jaycee68, in that order. Produce the
96-occurrence derived comparison and independent review; keep every original
hold/review binding and all facts/identities held. No new source or workbook
reads, raw reinspection/reacquisition, acceptance or external effects. Never
initialize/reset/replay. Stop after this bounded SD2 pilot and before SD3.
```
