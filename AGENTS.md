# Repository Operating Contract

This repository is governed by `docs/SCHOLARSHIP_SYSTEM_BUILD_PLAN.md` and
`docs/BUILD_STATE.json`. Read them before changing code, data, documentation, CI,
or deployment configuration.

## Required read order

1. `AGENTS.md`
2. `docs/SCHOLARSHIP_SYSTEM_BUILD_PLAN.md`
3. `docs/BUILD_STATE.json`
4. `docs/CURRENT_HANDOFF.md`
5. The evidence file for the most recently accepted stage
6. The kickoff file for the next permitted stage

If a kickoff prompt conflicts with the canonical plan or build state, the plan
and build state win. Execute one stage only. Do not begin a later stage because
it is convenient or adjacent.

## Grounding and evidence

- Separate observed facts, inferences, and unknowns.
- A successful fetch proves only that one URL responded at that time.
- A green test suite does not prove scholarship facts are current.
- Do not mark a stage accepted until every universal and stage-specific gate is
  satisfied, the candidate manifest is stable, and an independent reviewer has
  no unresolved critical or high findings.
- Do not relax acceptance criteria while implementing a stage. Record a plan
  amendment in `docs/DECISIONS.md`, update the canonical plan in a dedicated
  commit, and re-run plan validation.
- Route later-stage discoveries to the decision log or handoff; do not absorb
  them into the active stage.
- Record exact commands, results, timestamps, source revisions when available,
  and unresolved failures in `docs/evidence/`.

## Scholarship data boundaries

- The testing spreadsheet is
  `1Dp5AMnrfSQ-Xf-r03S75lKsGPJk7o0inOgvC9Q6lOl4`.
- The production Whitefish Scholarship spreadsheet must not be configured,
  mutated, or migrated before P9 and explicit production-migration authority.
- Never collect, reproduce, or commit applicant responses, credentials, dates of
  birth, addresses, phone numbers, transcripts, recommendation letters, or
  other applicant PII.
- Preserve parent sources, child awards, shared applications, annual cycles, and
  field-level evidence as distinct concepts.
- Never silently truncate portal pages, child links, search results, or extracted
  awards. Completeness must be measurable.

## Independent review

The acceptance review must be performed by a fresh-context agent that did not
author or edit the reviewed stage. Give the reviewer the original objective,
canonical plan, baseline and candidate manifest, diff, validation evidence, and
explicit read-only instructions. The implementation agent owns remediation; the
reviewer must not repair its own findings. After remediation, the independent
reviewer rechecks the final candidate. Accepted stages require a structured review
record whose outcome and manifest digest are validated by `npm run plan:check`.
Freeze implementation and documentation in an immutable candidate commit before final
review. The manifest hashes candidate-tree blobs and the complete Git change set from
the verified `origin/main` baseline. Add only the manifest and review record in the
following attestation commit. Historical manifests are never rebound to a later
worktree. The attestation must be the candidate commit's direct child and change exactly
the stage manifest and review paths. Preserve every historical attestation byte-for-byte.
Every medium/low review finding requires a count-matched disposition with rationale,
owner, and target.
The first valid attestation in Git history is canonical. Never delete/re-add or rebind it,
and do not append another commit after an undelivered attestation. The attestation must
remain the branch tip until merged.
Validate an accepted delivery integration's exact derived `BUILD_STATE` transition
against the immutable delivery candidate named by its attested manifest. Later stages
may evolve the current `BUILD_STATE` only through the normal reviewed state machine;
they must not weaken, replace, or reinterpret that historical integration proof.

Plan Revision 2 adds one exception that preserves rather than replaces an attestation:
an independently reviewed delivery integration may merge an exact previously attested
stage into a separately delivered amended `origin/main`. The integration must use the
exact parents, manifest, review, authority evidence, and branch-tip lock defined by the
canonical plan and `BUILD_STATE`. It never permits an ordinary post-attestation commit,
candidate rewrite, attestation rebinding, or unreviewed merge resolution. Material plan
amendments are themselves frozen, manifested, independently reviewed, and attested
before delivery.
The integration must preserve every non-governance stage blob from the exact attestation;
only `docs/BUILD_STATE.json` and `docs/CURRENT_HANDOFF.md` may reconcile delivery state.

## Autonomous Git policy: no Git questions to Kelsey

- Inspect status, branches, worktrees, remotes, and repository conventions
  directly. Do not ask Kelsey to choose a branch name, commit boundary, push
  timing, PR wording, merge method, or cleanup strategy.
- Use a `codex/<stage-id>-<slug>` branch. If the primary checkout is dirty, keep
  it untouched and create an isolated worktree from the latest `origin/main`.
- Preserve unrelated user changes. Stage only stage-owned paths.
- Commit coherent checkpoints locally without asking routine Git questions.
- Before push, PR creation/update, or merge, inspect downstream effects. This
  repository's Vercel Git integration has historically created Preview deployments
  for branch/PR revisions and Production deployments for `main` revisions. Perform a
  delivery action only when `docs/BUILD_STATE.json` contains direct, stage-specific,
  informed authority with an evidence path for every deployment effect, or when a
  verified deployment-suppression mechanism covers the action. Missing deployment
  authority is an external-release blocker, not a Git-preference question.
- Monitor CI and merge only when acceptance, downstream-effect authority, and
  repository policy permit it.
- Follow the repository's established PR merge convention. Prefer a new clean
  branch and replay of stage-owned commits over risky conflict resolution.
- For a declared Plan Revision 2 delivery integration, use the exact two-parent merge
  and dedicated delivery attestation required by the canonical plan; do not replay or
  squash the preserved stage commits.
- Never force-push, rewrite published history, use destructive reset/checkout
  commands, delete a worktree containing changes, or bypass required checks.
- A verified authentication or permission outage may be recorded as an external
  blocker, but routine Git mechanics are not user questions.
- A merge authorization covers only the downstream effect stated in build state.
  It never authorizes production spreadsheet writes, form submissions, provider
  contact, or unrelated external effects.

## Required verification

From `web/`, run the stage-specific commands plus:

```bash
npm run plan:check
npm run typecheck
npm test
npm run build
```

From the repository root, run:

```bash
git diff --check
```

Use the exact evidence and handoff requirements in the active stage contract.
