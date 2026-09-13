# R1 — Existing release package preparation

Date: 2026-09-12. Local proposal only. Independent completion is controlled by
`r1-review.json`, bound to an immutable candidate; this document is not a delivery grant,
canonical manifest, accepted amendment, or attestation. Progress belongs in
`docs/CURRENT_HANDOFF.md`. Execute no R2 command below without R2's exact authority.

## Grounded decision

Use two sequential release units in R2 under the existing rules: deliver REV15 first,
then prepare and deliver REV16 from that delivered main. Do not stack both attestations
on the current local branch. No rule amendment, changed gate, or special late-delivery
exception is necessary for this route. The original source work is **unattested**.

`web/scripts/validate-build-plan.ts`, `validateBoundAttestation` (lines 576–755 at the
R1 entry checkpoint), requires: complete baseline-to-candidate changes; exact Git blob
hashes; a fresh independent accepted review bound to the manifest; a direct-child commit
changing exactly that revision's two artifact paths; baseline equal to origin/main while
undelivered; and branch tip equal to that attestation while undelivered. Its amendment
loop (1607–1664) applies this separately to each revision. CI supplies the actual PR head
as `STAGE_BRANCH_TIP_SHA`; never spoof it to hide a descendant. A four-file attestation,
a second stacked attestation before first delivery, or a historical review relabeled as
canonical would fail this contract. No final attestation is created in R1.

The roadmap's “all six gates before delivery” is operationally evaluated per package:
REV15 has only its three applicable gates; it must close all three before its delivery.
REV16's three become closable after the delivered predecessor; R2 is complete only when
all six are closed and both releases verified. This implements the roadmap's required
predecessor order, not a waiver permitting any applicable gate to fail on a released tree.

## Exact sources and boundaries

| Pin | Exact immutable source | Meaning |
| --- | --- | --- |
| M0 | `5fa08541b6b49484dedc8fc06012e47c658ce8fb` | GitHub main freshly observed via authenticated read-only API; equals local origin/main |
| S15 | `40ff61ecc75c204cc6114fd34a5b9941e84f5ad1` | Last complete REV15-only checkpoint before REV16 policy; intake application, historical reconciliation, and coverage proposal/review included |
| UI | `c0fffacd3a97328afc75d8e7a06e4cfa8273f356` | Independently reviewed interview implementation, not a canonical release candidate |
| S16 | `865730ea820cfa8c300147d98b2c9e77064eb779` | User-selected clean continuation through implementation, roadmap and closeout reviews |
| R1 | Resolve the R1 review-only checkpoint from this branch after PASS | S16 plus only this R1 evidence and additive handoff/kickoff; use as second-parent integration source later |

`r1-source-paths.json` pins every changed path and candidate-blob SHA256 in M0→S15
(165 paths), S15→UI (28), UI→S16 (7), and S15→S16 (32 distinct paths). These are source
inventories, **not** future canonical manifests. Overlapping paths are counted once in
the complete range. REV15 has no change in `web/src`, `web/fixtures`, `.github`, or root
`vercel.json` versus M0. REV16 adds the separate coverage supplement, four positive
connections and reviewed two-input/optional UI; it leaves the saved 192-award catalog
and 206 preexisting connections intact. No R3 catalog refresh belongs in either package.

All R1 source reviews remain bound to their original candidate-tree blobs: 55 path
bindings across proposal, REV16 policy, UI, roadmap and closeout reviews, plus 119 paths
in the complete local intake manifest. Current intake ledger, proposed-write and report
hashes also match the local review. `r1-grounding.json` records this and its limits.
Final release reviews must inspect complete new candidates, relying on still-valid prior
evidence without repeating completed intake/research or pretending old reviews cover new
candidate bytes. The already-applied 257 operations are historical receipts, never a job
to rerun. Spreadsheet source freshness is not a release-package fact claimed here.

## R2 release unit 1 — REV15 predecessor

Owner: R2 implementation agent; final acceptance reviewer: fresh context, read-only,
not author/editor. Branch: `codex/plan-rev15-intake-release` in a new isolated worktree.
Start it from S15, preserving the original `codex/scholarship-intake` branch and every
reviewed ancestor. This creates a **new descendant** candidate on a side branch; it does
not retroactively insert an attestation into the original history.

Before creating it, reverify remote main and require M0. If main moved, stop this exact
recipe and prepare/review an updated baseline integration; do not reset main or silently
use the stale baseline. Inspect any preexisting branch/worktree and resume valid owned
work rather than overwrite it. R1 does not create these release branches.

After a grant covering both named releases, record REV15-specific informed authority in
`docs/BUILD_STATE.json`'s PLAN-REV15 deliveryAuthorization and
`docs/evidence/PLAN-REV15.md`. Set its publication bookkeeping consistently; keep the
historic spreadsheet grant explicitly spent and no-write in the operative handoff.
Remove only the satisfied REV15 release blocker. Keep the stale P9 bookkeeping item
routed separately; this release does not reopen P9 or perform unrelated cleanup.
Update canonical section19's current delivery-status statement and append the authority
and packaging decision to DECISIONS. Preserve its original scope/backup/fact rules.
Add the current release handoff and kickoff overlay, pointing to this R1 proposal and
the retained R1 source commit. Do not import REV16 state or runtime into this package.

Permitted new governance delta over S15 is limited to:
`docs/BUILD_STATE.json`, `docs/SCHOLARSHIP_SYSTEM_BUILD_PLAN.md`, `docs/DECISIONS.md`,
`docs/evidence/PLAN-REV15.md`, `docs/CURRENT_HANDOFF.md`,
`docs/kickoffs/SCHOLARSHIP-INTAKE-RESUME.md`, and the release's own local validation/
review-support evidence under `docs/evidence/interview-coverage/` prefixed `r2-rev15-`.
Canonical manifest/review are reserved for the later two-file attestation. No runtime,
existing ledger/review/snapshot, workflow, package, dependency or provider-config edit.
The complete manifest must include all actual M0→C15 changes, including these additions,
not merely this small governance delta or the old 165-path inventory.

Run the full required matrix below, freeze all implementation/evidence as new C15, derive
its manifest, and obtain fresh final review of the full candidate. Expected pre-attestation
plan failure is exactly REV15's three missing canonical-artifact/attestation diagnostics;
any additional failure blocks finalization. Then add the REV15 manifest and review as A15, C15's direct
child. Run actual plan validation again: **zero errors**, local and hosted checks.
A15 stays branch tip until its merge. Preview, CI, merge and Production verification
must complete for this predecessor before constructing the next release candidate.
A non-squash merge preserving A15 ancestry is required (established repository convention).
Store post-attestation delivery observations in the authorized PR delivery record; never
append evidence or handoff to the locked release branch. Retain its external record URL
and copy that non-sensitive receipt into REV16's subsequent local evidence before freeze.

## R2 release unit 2 — REV16 interview

Entry: A15 is an ancestor of freshly fetched main M15, its manifest/review hashes match,
its exact accepted revision passed Preview before merge and Production after merge, and
REV16's distinct release authority is present. Use new isolated branch
`codex/plan-rev16-coverage-release` from M15. Merge the retained R1 checkpoint with
`--no-ff --no-commit` to preserve every original source/review ancestor. This is ordinary
integration of **unattested** source work, not the special previously-attested-stage
integration mechanism. Do not rebase, squash, rewrite, or replay the canonical A15.

Resolve overlaps deterministically before committing C16:

| Path or state | Required result |
| --- | --- |
| PLAN-REV15 amendment object | Copy verbatim from M15; baseline, delivery authority and all fields unchanged |
| `docs/evidence/PLAN-REV15.md`, REV15 manifest/review files | Byte-identical to delivered M15; never take the older source-side versions |
| Scholarship-intake state and spent grant | Preserve delivered REV15 state, receipts and no-new-write meaning |
| PLAN-REV16 amendment object | New exact authority; baseline=M15; never change attested REV15's baseline |
| `interviewCoverage.baselineCommit` | Preserve original implementation-provenance `40ff61e`; this is distinct from the amendment's new delivery baseline |
| Other stages, historical amendment objects and canonical attestations | Preserve delivered main byte-for-byte/field-for-field, except expressly authorized still-unattested REV16 additions |
| Canonical plan | Delivered main's REV15 authority text plus existing section20; update only REV16's delivery status after its own grant; no revision downgrade or gate changes |
| DECISIONS | Preserve both histories and append exact integration/authority decision |
| Handoff/kickoff | Preserve both retained histories and all R1 routes; prepend one operative REV16 release pointer |
| REV16 implementation paths in r1-source-paths.json | Exact reviewed source blobs; shared package/validator changes use the reviewed S16 blobs only if main still matches S15 there; otherwise stop for conflict review |
| Existing ledgers, publications, research, application/recovery receipts and local reviews | Unchanged, with original immutable candidates still ancestors through the merge |
| Release evidence | Add predecessor delivery receipt and `r2-rev16-` local verification evidence before final freeze |

Explicitly compare the complete PLAN-REV15 amendment JSON object and its evidence bytes
against M15 as well as both canonical artifact bytes. Do not rely solely on the current
historical amendment discovery helper: it filters candidate records by equality with the
earliest seen record, whereas adding legitimate release authority changes that original
false-authority record. This is an existing validator coverage limitation, not permission
to mutate history. Owner: R2 execution agent; trigger: constructing C16; next action:
perform and record all four equality checks. A separate validator-hardening change is
outside R1; the explicit preservation check is mandatory for this recipe.

Before freeze, inspect the complete M15→C16 diff (including merge resolution). Validate
all protected bytes and both predecessor/source ancestry. The new manifest is that whole
diff, not the old 32-path overlay, and does not include unchanged predecessor artifacts.
C16, its own manifest/review and A16 follow the same fresh-review/direct-child process. Before attestation
only REV16's three diagnostics may remain; after A16 all six original gates must pass
with zero new errors. A16 remains tip until non-squash merge. Verify exact Preview before
merge and exact Production afterward. Record post-freeze results on the authorized PR;
a separately permitted continuation checkpoint after delivery carries the durable handoff.

## Six gates, artifact ownership and order

C15/C16 are future authority-bearing candidate commits; their exact SHAs cannot exist
until grant, predecessor delivery and freeze. M15 denotes the actual main merge commit
for the first release. The owner must record full SHA values at R2 execution, never
invent future hashes.

| Gate | Owner and exact artifact | Required command/check | Dependency and expected result |
| --- | --- | --- | --- |
| REV15 manifest | R2 agent: `docs/evidence/PLAN-REV15-manifest.json` | Generate schema1 for C15/M0 with the recipe below | New C15 frozen; every actual changed Git blob covered |
| REV15 review | Fresh reviewer: `docs/reviews/PLAN-REV15.json` | Independent full-candidate review; SHA256 bind exact manifest bytes | No unresolved C/H; all M/L count-matched dispositions; cannot reuse local PASS |
| REV15 attestation | R2 agent: A15 | `git diff --name-only A15^ A15`; `npm run plan:check` | Parent=C15; exactly the two REV15 paths; zero errors at A15; deliver before C16 |
| REV16 manifest | R2 agent: `docs/evidence/PLAN-REV16-manifest.json` | Generate schema1 for C16/actual delivered-main baseline | A15 delivered, exact merge/reconciliation complete; all changed blobs covered |
| REV16 review | Fresh reviewer: `docs/reviews/PLAN-REV16.json` | Independent full C16 review and exact manifest hash | Preserved REV15 bytes/proof, full verification, no unresolved C/H; all M/L dispositioned |
| REV16 attestation | R2 agent: A16 | `git diff --name-only A16^ A16`; `npm run plan:check` | Parent=C16; only the two REV16 paths; predecessor ancestor of main; zero errors |

## Exact command recipe and validation

Commands below describe later R2, not actions performed or authorized in R1. Run from the
applicable isolated release worktree. Inspect/reuse existing names rather than overwrite.
`BASE`, `CANDIDATE`, `ATTESTATION` and `MAIN_AFTER_REV15` are full SHAs resolved and saved
from actual Git results at that step, not user-provided guesses. Preserve normal secure
authentication; do not print or persist secrets.

```sh
# R2 entry, read-only; compare main to M0 before first release
 gh api repos/whitefishscholarship/program_code/commits/main --jq .sha
 git fetch origin main
 git worktree add -b codex/plan-rev15-intake-release /private/tmp/program_code-r2-rev15 40ff61ecc75c204cc6114fd34a5b9941e84f5ad1
# Make and validate ONLY the authority/governance delta above, then commit C15.
# After A15 actually merges and its Production checks pass:
 git fetch origin main
 git merge-base --is-ancestor "$ATTESTATION" origin/main
 git worktree add -b codex/plan-rev16-coverage-release /private/tmp/program_code-r2-rev16 origin/main
# In that new worktree, use the exact preserved R1 review-only checkpoint:
 git merge --no-ff --no-commit "$R1_REVIEWED_TIP"
# Perform the bounded resolutions above, checks and freeze C16.
```

If normal fetch fails because of the known URL rewrite/DNS route, use the existing secure
configured authentication and command-scoped transport correction. Verify the fetched SHA
against the authenticated API; do not change persistent Git configuration or expose tokens.
An unavailable fresh remote blocks the dependent baseline step, not unrelated local review.

From `web/`: `npm ci`, `npm run plan:check`, `npm run typecheck`, `npm test`,
`npm run build`, `npm run intake:check`, `npm run p9:production:check`, and
`node --import tsx scripts/p9-production-runtime.ts --require-build-trace`.
REV16 additionally runs `npm run coverage:check`, `npm run coverage:test` and its existing
local browser regression `qa-interview-coverage.cjs` against local port3216. Its current
output location is hardcoded to historical browser evidence: **do not run it unchanged**.
Make a scratch copy, replace only the output directory with a new `r2-rev16-browser`
evidence directory and resolve its relative imports against the release worktree; verify
that the assertions are unchanged. Run with `node --import tsx` and the existing approved
Playwright installation (no new dependency); save the command and scratch-script digest.
This isolates new evidence from the preserved browser.json/PNG files. Reconcile desktop/mobile/keyboard/edit/reset/reload, core and optional flows,
unchanged all-award counts, visible CSV and zero answer persistence/transmission using only
fictional profiles. REV15 verifies unchanged student runtime and corresponding saved
catalog/API/CSV smoke. Run root `git diff --check` and
`git diff --check "$BASE" "$CANDIDATE"`. Record exact commands/times/results/limits.
A sandbox IPC failure is not substantive validation; rerun with permitted local worker
support, or use the equivalent `node --import tsx` validator entrypoint and label it.

Create the canonical manifest only **after** that candidate is committed and reviewed
inputs are frozen. Invoke the following from the release root, with arguments replaced by
actual subject/baseline/candidate; output goes to scratch for review, not Git until accepted:

```sh
python3 - PLAN-REV15 "$BASE" "$CANDIDATE" > /private/tmp/rev15-candidate-manifest.json <<'PY'
import sys, subprocess, json, hashlib, datetime
subject, base, candidate = sys.argv[1:]
def git(*args): return subprocess.check_output(['git', *args])
assert len(base) == len(candidate) == 40
git('merge-base', '--is-ancestor', base, candidate)
excluded = {f'docs/evidence/{subject}-manifest.json', f'docs/reviews/{subject}.json'}
files = []
for line in git('diff', '--name-status', '--no-renames', base, candidate, '--').decode().splitlines():
    status, path = line.split('\t')
    if path in excluded: continue
    files.append({'path': path, 'change': 'deleted' if status == 'D' else 'present',
                  'sha256': None if status == 'D' else hashlib.sha256(git('show', f'{candidate}:{path}')).hexdigest()})
print(json.dumps({'schemaVersion': 1, 'stageId': subject,
    'createdAt': datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='milliseconds').replace('+00:00', 'Z'),
    'baselineCommit': base, 'candidateCommit': candidate, 'files': files}, indent=2))
PY
```

Repeat using PLAN-REV16, its fresh baseline/C16 and a distinct scratch output. The reviewer
returns an actual schema1 record like `docs/reviews/PLAN-REV14.json`: stageId, task identity,
`reviewerWasAuthorOrEditor:false`, `reviewMode:fresh-context-read-only`, UTC reviewedAt,
`outcome:accepted`, four finding counts, count-matched medium/low dispositions with summary,
rationale, owner and target, and exact candidateManifestPath/SHA256. No fabricated result.
If findings change candidate files, refreeze and regenerate/review before attestation.
Copy only the accepted manifest and reviewer record into the canonical paths, stage only
those two, inspect staged paths and parent, commit, and immediately run plan validation.
Do not create an attestation speculatively to make the validator green.

## Concrete delivery decision after R1 PASS

Requested later authority is **two sequential releases**, not one combined push:

1. REV15 on `codex/plan-rev15-intake-release`: branch push, PR creation/update, resulting
   Vercel Preview, non-squash merge, resulting Production deployment, CI and exact hosted
   verification; student runtime/catalog unchanged, historical intake/research and local
   tooling/evidence published in Git.
2. Only after that verified delivery, REV16 on `codex/plan-rev16-coverage-release`: same
   Git/PR/Preview/merge/Production/verification effects for the reviewed interview and
   separate four-connection supplement, with existing saved catalog retained.

Recorded existing target: project `web` (`prj_LbefE2deji6nPND6iBiuofe7IABv`), team
`team_6CAjRq58n0WvAH49otKSQbA7`, canonical `web-two-gules-45.vercel.app`. These are historical
pins to **reverify read-only in R2**, not a current provider-identity/health observation.
Local CI configuration verifies PR/main-triggered checks; Vercel Git effects are the
recorded integration expectation and must be inspected again before each release. No
suppression is claimed. More than one Preview may result from authorized branch/PR actions;
each of the two main merges may cause Production. Exact target mismatch stops delivery.
Verify non-cacheable nonce-bound health with expected source/deployment/publication,
API/browser/public visible CSV reconciliation and zero spreadsheet capability. Deployment
“Ready” or HTTP success alone is insufficient. Fresh authority does not waive any check.

The concrete approval must expressly cover BOTH units and their narrow authority/evidence
bookkeeping. Until received, all current delivery flags remain false and R2 unstarted.
No source research/read/copy/write, new catalog import, provider contact, application
interaction, credential/configuration change, automation, paid action, cleanup, rollback
or whole-workbook restore is included. The former batch digest/quiet window is spent.

## Preservation and stop conditions

Retain the complete prior handoff/kickoff beneath new operative overlays. The existing
roadmap backlog and original ledgers remain the sole work queue: all 83 historical routes,
26 named research records, four non-write-ready additions, nine backlog IDs, 310 held
entities/312 hold records, I65/Hagan, remaining seven organization choices, catalog/R3/R4,
recovery objects, full-Master currency, monitoring, platform/issuer-credential and hygiene
triggers remain assigned as recorded. Carry keyboard automation improvement to next R3 UI
change; do not add another test system in R1. No hold or old evidence is promoted by package
acceptance. Do not inspect external recovery objects for this local packaging task.

Stop for missing exact grant, changed baseline/targets, changed protected blobs, new
validation failure, inability to preserve ancestry, scope conflict or unresolved critical/
high review findings. Record the blocker, owner and exact next action in the existing
handoff; never skip to R3. Six acceptance errors remain intentionally unresolved in R1.
The only R1 completion assertion is an independently reviewed executable proposal and
preserved continuation. Final candidate/attestation/merge IDs and hosted outcomes remain
unknown until their actual R2 steps occur.
