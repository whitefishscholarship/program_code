# Stage Kickoff Prompt Standard

Copy this template into a new session and replace every angle-bracket field. The
canonical build plan and build state remain authoritative if the prompt is stale.

```text
You are executing Stage <ID>: <NAME> only in whitefishscholarship/program_code.

AUTHORITATIVE READ ORDER
1. AGENTS.md
2. docs/SCHOLARSHIP_SYSTEM_BUILD_PLAN.md
3. docs/BUILD_STATE.json
4. docs/CURRENT_HANDOFF.md
5. docs/evidence/<PREVIOUS-STAGE>.md
6. <THIS-STAGE-KICKOFF-PATH>
7. Stage-specific implementation and tests

STATE TO PIN BEFORE EDITING
- Repository root: discover with git rev-parse --show-toplevel
- Remote: <EXPECTED-REMOTE>
- Default branch: main
- Expected accepted baseline: <SHA-OR-DISCOVERY-INSTRUCTION>
- Plan revision: <NUMBER>
- Testing spreadsheet: <ID>
- Authorized tabs and access mode: <EXACT-SCOPE>
- Production spreadsheet mutation: forbidden unless this is authorized P9

If repository, plan, sheet, or stage state differs, do not silently reinterpret
the task. Reconcile read-only evidence, record the stale-state difference in the
handoff/decision log, and continue only if the stage contract remains valid.

OBJECTIVE
<ONE CONCRETE STAGE OBJECTIVE>

ENTRY PREREQUISITES
- <PREREQUISITE AND HOW TO VERIFY IT>

IN SCOPE
- <ALLOWED DELIVERABLE>

OUT OF SCOPE
- <LATER-STAGE OR PROHIBITED WORK>

INVARIANTS
- Execute this stage only.
- Do not weaken or reinterpret acceptance criteria during implementation.
- Preserve observed facts, inferences, conflicts, and unknowns separately.
- Do not silently drop source pages, children, links, or records.
- Never collect, submit, log, or commit applicant PII or credentials.
- Do not mutate the production Whitefish spreadsheet.
- Route later-stage discoveries to docs/DECISIONS.md or CURRENT_HANDOFF.md.

ACCEPTANCE TESTS
- <EXACT COMMAND AND REQUIRED RESULT>
- cd web && npm run plan:check
- cd web && npm run typecheck
- cd web && npm test
- cd web && npm run build
- git diff --check

EVIDENCE REQUIRED
- <EXACT ARTIFACT, COUNTS, HASHES, SOURCE REVISION, AND UNKNOWN REPORT>
- Update docs/evidence/<ID>.md.
- Update docs/BUILD_STATE.json and docs/CURRENT_HANDOFF.md.

INDEPENDENT REVIEW
- Commit the complete stage candidate before final review; do not include the new
  stage manifest or review record in that candidate commit.
- Record the candidate commit and current verified `origin/main` baseline in the
  manifest; hash blobs from that candidate tree and its complete change set.
- Use a fresh-context, read-only reviewer that did not author or edit this stage.
- Give it the original objective, stage contract, baseline, candidate diff,
  verification evidence, and known risks.
- The implementation agent fixes findings; the reviewer does not edit.
- Critical/high findings block acceptance. Recheck after remediation.
- Add the accepted manifest and review record only in the following direct-child
  attestation commit; its diff must contain exactly those two paths.
- Preserve prior-stage manifest and review blobs byte-for-byte. Disposition every
  medium/low finding with rationale, owner, and target.

AUTONOMOUS GIT DELIVERY — NO GIT QUESTIONS TO KELSEY
- Inspect state and follow AGENTS.md.
- Preserve dirty work with an isolated worktree.
- Use codex/<stage-id>-<slug>.
- Commit coherent stage-owned changes locally.
- Inspect downstream effects before push, PR, or merge. Require direct, stage-specific,
  informed authority with an evidence path for each Preview/Production deployment
  effect, or a verified deployment-suppression mechanism covering the action.
- Push, open/update the PR, monitor checks, and merge only after acceptance,
  downstream-effect authority, and repository policy pass.
- Never force-push, rewrite history, discard user work, or bypass checks.
- Report only a verified external credential/permission blocker; do not ask Git
  preference questions.

STOP CONDITIONS
- The requested work requires a later stage.
- Production data or an unauthorized external side effect would be required.
- A prerequisite is false and cannot be restored safely within this stage.
- Independent review retains a critical/high finding.

END-OF-STAGE OUTPUT
- Outcome and accepted scope
- Exact verification results
- Independent review disposition
- Files/data surfaces changed
- PR and merged commit, when available
- Evidence and handoff paths
- Remaining blockers/unknowns
- Next permitted stage and kickoff path

Do not begin the next stage in this session.
```

## Prompt-quality checklist

A kickoff is invalid if it lacks any of the following:

- one and only one stage ID;
- the authoritative read order;
- a pinned or discoverable baseline revision;
- the testing spreadsheet ID and exact access boundary;
- entry prerequisites;
- explicit in-scope and out-of-scope lists;
- exact acceptance commands and observable results;
- evidence artifacts and reconciliation requirements;
- independent-review separation;
- the autonomous Git policy;
- stop conditions; or
- the required end-of-stage handoff.

Do not paste secrets, tokens, service-account JSON, applicant information, or
private spreadsheet content into a kickoff prompt.
