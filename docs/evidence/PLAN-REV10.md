# Plan Revision 10 Evidence — Master Source and Matching Facts

Date: 2026-09-01
Stage: `PLAN-REV10`
Baseline: `390b270c5d3127ff2705ffb114212a518a1d5953`
Status: governance candidate in progress; verification, immutable review, and local attestation pending

## Objective and exact authority

The user directed Codex to continue the Whitefish Scholarship master-source and
matching-fact follow-up from local branch `codex/master-matching-facts-handoff` at exact
commit `83e61e80f07d17dadff43bbb635aa98c0472dc39`, complete the authoritative read
order, follow the Plan Revision 10 kickoff exactly, govern Revision 10 only, preserve
every open item and trigger in the top handoff section, and stop before enrichment.

This instruction authorizes governance-only local implementation, validation, fresh-
context review, and the direct-child local attestation required by the supplied kickoff.
It expressly excludes matching-fact enrichment, Claude row processing, P8F, P9,
`P9-IDENTITY-PINS`, spreadsheet/public-source access, product work, monitoring, and
deployment-configuration changes. It also warns not to infer automated-write or remote-
delivery authority from team edit access.

The current instruction does not separately state direct informed authority for branch
push, pull request, merge, or the resulting Vercel Preview and Production effects.
`BUILD_STATE` therefore records the exact local-only blocker
`PLAN-REV10-awaits-direct-push-pr-merge-preview-production-authority`. No remote
Revision 10 delivery action may occur until a later instruction names those effects.

## Authoritative grounding and live baseline

The complete read order in `AGENTS.md` and the 30-file Revision 10 kickoff chain was
completed before implementation. The governed-stage-delivery procedure was used for
candidate/manifest/review/attestation ordering.

Observed repository state before editing:

- The supplied worktree was clean at exact checkpoint `83e61e80...`, whose direct
  parent was live-tracking `origin/main` `390b270c...`.
- Authenticated GitHub account context was `whitefishscholarship`; no token text was
  requested, exposed, copied, or stored.
- Normal SSH transport returned `Repository not found`; the previously governed,
  command-scoped keyring-backed HTTPS override fetched `origin` without changing the
  saved remote.
- Refreshed `origin/main` remained exact
  `390b270c5d3127ff2705ffb114212a518a1d5953`.
- GitHub reported PR #31 merged at
  `3359bdc1ed1a447be41b512a8bd79445460169f1`, with exact head Revision 9
  attestation `ee09197fbbae63fa52dc40b9c5d1806878f0552d`.
- GitHub reported delivery-closure PR #32 merged at exact baseline `390b270c...`.
- Accepted P8R candidate `a3ed84d116a32f67034902a1ce55e7b5c12bf4bf`, accepted
  Revision 9 candidate `bcde44a5979b2be5a631f914a3e249bca2943c40`, and Revision 9
  direct-child attestation remain ancestors of the live baseline.
- The original checkpoint branch remains preserved. Revision 10 work is isolated on
  `codex/plan-rev10-master-matching-facts` in the existing isolated worktree; the
  primary checkout was untouched.

## Observed facts, user-reported facts, and unknowns

User-reported, not independently verified in Revision 10:

- The organizer designated spreadsheet
  `1Dp5AMnrfSQ-Xf-r03S75lKsGPJk7o0inOgvC9Q6lOl4` as the master document.
- The team has edit access.

Observed from delivered repository state:

- Revision 9 still called that ID the testing spreadsheet.
- Revision 9 still treated
  `1eWGMdavcEECUcY_-nZ9gR2nMTN7T7T6oipG5ql1LoIE` as the P9 read-only production
  source, made P8F next, and forbade sheet/source work in P8F.
- P8 remained accepted with its schedule disabled.
- P8R matching preserved all 192 accepted awards as possible because accepted P7
  evidence had no award-bound field-specific matching authority.

Unknown and deliberately unaccessed:

- Organizer-master title, exact scholarship tabs/ranges, schema, stable IDs, current
  revision, permission/editor identities, and intended publication relationship.
- Whether any comparison read of the former production spreadsheet is useful.
- Current scholarship freshness and protected application health.
- Any current provider, Google runtime, backup, Vercel target, protected-environment,
  or runtime credential identity relevant to future P9.

No Drive, Sheets, spreadsheet, permission, metadata, revision, public-source, Claude,
Vercel, workflow-dispatch, product runtime, monitoring, form, provider, or applicant-data
operation was performed in Revision 10.

## Source, identity, and runtime decisions

Revision 10 resolves the material source conflict prospectively while preserving
unknowns:

1. The exact new ID is `organizer_authoring_master`, designation evidence
   `user-reported`, verification `unverified`, with no read or automated-write authority.
2. The former production ID is `legacy_comparison_only`; neither access nor comparison
   read is authorized.
3. Human editor, proposal processor, fact reviewer, and read-only application runtime
   are distinct identities and permissions.
4. The application runtime will consume only a validated immutable versioned
   publication whose exact bytes/digest descend from an accepted P8M candidate. It may
   not read the mutable master directly.
5. Future P9 proves the runtime has no Google credential, Drive/Sheets scope,
   spreadsheet client, or mutator. The former Google-runtime `P9-IDENTITY-PINS` path is
   retired unstarted; its absent artifacts stay absent and all historical Revision 7-9
   evidence remains immutable.

## Stage order and authority triggers

The exact order is now:

1. Plan Revision 10 — governance-only local acceptance and attestation; remote delivery
   blocked pending separate informed authority.
2. P8M — matching-fact enrichment and acceptance; planned, next-permitted, and
   unauthorized until a later direct stage-specific source/processing/review/write/
   delivery instruction satisfies its kickoff.
3. P8F — planned and unstarted until P8M is accepted and delivered; every Revision 9
   displayed/type-only/rule disposition remains binding.
4. P9 — planned and unstarted; deploys only the accepted immutable publication after
   new target/runtime/deployment/rollback pins and direct authority.
5. Monitoring/freshness activation — separately governed; P8 schedule stays disabled.

Team edit access supplies none of these triggers. A prepared kickoff and
`nextPermittedStageId` are state, not authority.

## Matching-fact contract

Machine artifact: `docs/evidence/PLAN-REV10-matching-fact-contract.json`.

- Contract: `matching-facts-v1`; taxonomy: `1.0.0`; status:
  `governance-frozen-no-processing-authority`.
- 82 controlled criteria across 15 required categories, including the complete former
  interview domains plus application/cycle architecture.
- 50 governed aliases, including exact Revision 9 historical mappings. `adhd` maps to
  `learning.adhd`; no separate `add` alias or recovered question exists.
- 10 typed operators across nine value types.
- 31 sensitive criteria with unknown-not-negative nonselection/unanswered behavior.
- Facts require stable award and optional exact cycle identity, controlled criterion,
  effect, typed operator/value, evidence status, source/revision/time, short non-PII
  evidence, reviewer/time/rationale, and taxonomy version.
- Parent source, child award, application group, and annual cycle remain separate.

Evidence precedence is cycle-specific official child evidence, official parent field
evidence, organizer-owned local award evidence, organizer-reviewed master, accepted
repository evidence, secondary-source discovery, then AI proposal. The ranking is
field/scope-sensitive: organizer facts are directly acceptible only where the organizer
is authoritative for that local field. Material eligibility, deadline, cycle, and
application facts otherwise require current official provider evidence. Equal-authority
disagreement is `conflict` and blocks matching use.

Cycle-specific facts stale at cycle close or source replacement; yearless/prior-cycle
facts stale on the next calendar year until reverified; non-cycle facts require review
after 365 days. Missing, ambiguous, free-text-only, provenance-free, unaccepted,
unanswered, nonselected, conflict, stale, or unknown information cannot hard-exclude.

## Claude, Codex, review, and future write boundaries

Claude is proposal-only after later exact authority and a frozen input. Its permitted
output is schema-valid proposed JSON/JSONL with provenance, confidence/ambiguity,
prompt/tool version, input/output fingerprints, batch/checkpoint/resume receipts, and
complete-denominator accounting. It cannot accept facts, write a spreadsheet, process
applicant PII, enter applications, contact providers, infer false from absence, or
silently truncate work.

Codex owns stable-ID validation, duplicate/conflict/coverage checks, no-truncation
reconciliation, source/evidence policy, proposal-review packaging, independent-review
evidence, and any separately authorized exact write/readback workflow. A named human
fact reviewer owns accepted/rejected/conflict decisions in P8M.

Edit access is capability, not operation authority. A later write must name exact
spreadsheet, tab, columns/ranges/cells, operation count, source revision, backup owner,
rollback owner, and acceptance evidence. It requires a verified backup, deterministic
dry run, human and independent acceptance, bounded idempotent batch, immediate target
readback, untargeted-cell proof, and complete outcome reconciliation.

## Candidate scope and test-first gate

The Plan Revision 10 adversarial governance test was committed before implementation at
`cac8894`. Its initial run failed as intended because delivered state was still Revision
9. The completed candidate is limited to governance, the matching-fact contract,
evidence/handoff/kickoffs, validator/adversarial tests, package-script wiring, and the
minimum dormant trusted-proof plan-revision compatibility update.

No student-facing `web/src` file, dependency, lockfile, workflow, deployment
configuration, spreadsheet fixture/fact, P8 schedule, or external state is in scope.

## Verification record

The final exact command ledger, UTC timestamps, results, path counts, candidate SHA,
manifest digest, independent review, and unchanged external-effect receipt will be
recorded here before immutable freeze. Green tests will not be represented as scholarship
freshness, protected application-health, spreadsheet access, or remote-delivery proof.

## Stop boundary and unresolved triggers

Do not begin P8M, P8F, P9, `P9-IDENTITY-PINS`, Claude processing, spreadsheet/public-
source access, product work, monitoring, or deployment-configuration changes. Do not
push, open a PR, merge, or trigger Vercel Preview/Production until the exact Revision 10
delivery blocker receives separate direct informed authority.

Every open item and trigger from the top "Master-source and matching-fact follow-up"
section of `docs/CURRENT_HANDOFF.md` remains preserved and is carried into the P8M
kickoff or the later P9/monitoring trigger that owns it.
