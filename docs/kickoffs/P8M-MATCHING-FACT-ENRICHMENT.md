# P8M Kickoff — Matching-Fact Enrichment and Acceptance

Use this kickoff only in a fresh session after Plan Revision 10 is independently
accepted, direct-child attested, delivered, and verified on live `origin/main`, and only
after a new direct, stage-specific authority satisfies every entry trigger below. This
document prepares P8M; it does not supply that authority.

```text
Execute P8M — Matching-fact enrichment and acceptance — only for
whitefishscholarship/program_code. Stop before P8F and P9.

AUTHORITATIVE READ ORDER
1. AGENTS.md
2. docs/SCHOLARSHIP_SYSTEM_BUILD_PLAN.md
3. docs/BUILD_STATE.json
4. docs/CURRENT_HANDOFF.md, especially the Revision 10 closure and every preserved open item
5. docs/evidence/PLAN-REV10.md
6. docs/evidence/PLAN-REV10-manifest.json
7. docs/reviews/PLAN-REV10.json
8. docs/evidence/PLAN-REV10-matching-fact-contract.json
9. docs/evidence/P8R.md and its accepted manifest/review
10. docs/evidence/PLAN-REV9-interview-inventory.md
11. docs/evidence/P5.md and the accepted write/backup/reconciliation records
12. docs/evidence/P7.md and its accepted manifest/review
13. docs/evidence/P8.md and its accepted manifest/review
14. docs/kickoffs/P8M-MATCHING-FACT-ENRICHMENT.md

ENTRY AUTHORITY — ALL REQUIRED BEFORE ANY ACCESS OR PROCESSING
- Fetch live origin/main and prove exact Plan Revision 10 candidate, manifest, review,
  direct-child attestation, and delivery closure.
- Confirm BUILD_STATE names P8M as the sole next-permitted planned stage while P8F and
  P9 remain planned/unstarted.
- Obtain direct, stage-specific authority naming the exact organizer-master spreadsheet,
  exact tab IDs/titles/ranges, complete bounded row/award/cycle denominator, metadata and
  content reads, permitted official public-source reads, Claude proposal processing,
  human fact-review owner, independent review, Git push/PR/merge, and resulting Vercel
  Preview/Production effects.
- The authority must either prohibit every sheet write or separately name the exact
  tab/columns/ranges/cells, maximum operation count, source revision, backup owner,
  rollback owner, and acceptance evidence for a future write gate.
- Do not infer any authority from organizer designation, team edit access, historical P5
  authority, existing connectors, a prepared kickoff, or nextPermittedStageId.
- Do not access either spreadsheet, a public source, Drive metadata/permissions/revisions,
  or Claude until every applicable entry field is directly authorized and recorded.

OBJECTIVE
Create a complete, typed, evidence-backed, independently reviewed matching-fact set and
immutable versioned publication for the accepted award/cycle denominator without
allowing proposals, missing evidence, free text, or AI output to become accepted truth.

PINNED CONTRACT
- Use only contract matching-facts-v1, taxonomy 1.0.0, at
  docs/evidence/PLAN-REV10-matching-fact-contract.json.
- Bind every fact to stable award_id and, when cycle-specific, exact cycle_id. Never use
  scholarship name alone or collapse parent source, child award, application group, or
  annual cycle identities.
- Enforce exact effect, operator/value type, evidence status, source/revision/time,
  short non-PII evidence, reviewer/time/rationale, and taxonomy version.
- Unknown criteria, aliases, values, operators, subjects, or scopes fail closed to
  taxonomy/manual review. Do not expand the taxonomy inside row processing.

SOURCE AND EVIDENCE POLICY
- Independently verify the user-reported organizer master designation, title, exact
  scholarship tabs, stable IDs, schema, revision, team editor identity, and intended
  publication relationship only within the later exact authority. Keep applicant and
  unrelated tabs outside every request.
- The former production spreadsheet is legacy comparison-only. No comparison read is
  authorized by Revision 10 or this kickoff.
- Cycle-specific official child evidence outranks parent/yearless evidence. Organizer-
  reviewed facts may be accepted directly only where the organizer owns the local award
  field. Material eligibility, deadline, cycle, and application facts otherwise require
  current official provider evidence.
- Secondary sources and AI output are discovery/proposal only. Equal-authority conflict
  blocks acceptance. Stale facts remain review-visible but unavailable to matching.
- Missing, ambiguous, free-text-only, provenance-free, unaccepted, unanswered,
  nonselected, and prefer-not-to-answer states remain unknown and non-excluding.

CLAUDE PROPOSAL-ONLY BOUNDARY
- Claude is proposal-only. Run it only after exact authority and taxonomy/input freeze,
  in an isolated workspace, against revision-pinned bounded inputs and separately
  permitted official sources.
- Pin prompt version, model/tool version, batch size, input/output fingerprints,
  checkpoints, resume cursor, retries, ambiguity/confidence, and complete denominator.
- Accept only schema-valid JSON/JSONL with proposed status. Claude cannot self-accept,
  write a spreadsheet, process applicant PII, enter a form/application, contact a
  provider, infer false from missing text, or silently skip/truncate work.

CODEX AND HUMAN REVIEW BOUNDARY
- Codex owns stable-ID binding, schema validation, duplicate/conflict/coverage checks,
  no-truncation reconciliation, source/evidence enforcement, sampling/full-review
  selection, proposal-review packaging, and independent-review evidence.
- The named human fact reviewer owns accepted/rejected/conflict decisions. No Claude or
  Codex proposal becomes accepted without the recorded review authority and rationale.
- Review 100% of required-effect, sensitive, conflict, stale, rejection, unknown,
  parent/child, shared-application, and any write-bound record, plus the predeclared
  deterministic sample of all remaining proposals.

FUTURE WRITE GATE
- Edit access is not authority. Before any write, pin the exact source revision and
  complete denominator, create and verify a full reversible backup, generate a
  deterministic dry run, and obtain human plus independent acceptance.
- Apply only the authorized bounded idempotent operations. Immediately read back every
  target, prove untargeted cells unchanged, and reconcile accepted, rejected, conflict,
  stale, unknown, and remaining rows. A successful API reply is not acceptance.
- Preserve organizer content and formatting; derived facts use only the exact approved
  tab/columns and never overwrite source prose.

DELIVERABLES
- Exact source/identity/revision receipt; complete denominator; proposal, checkpoint,
  resume, ambiguity, and completeness ledgers; normalized fact set; review decisions;
  conflict/stale/unknown/rejected queues; immutable versioned publication; optional
  separately authorized write/readback receipt; reconciliation; rollback; evidence;
  manifest; and fresh-context review.
- Preserve exact evidence, rollback, handoff, manifest, and review paths from BUILD_STATE.

ACCEPTANCE TESTS
- Test every criterion/operator/value/scope, alias, status transition, authority rank,
  freshness rollover, sensitive state, conflict, stable-ID link, duplicate, truncation,
  checkpoint/retry, and no-direct-write boundary.
- Reconcile exact source/row/award/cycle/application-group/proposal/fact totals with no
  missing or duplicate identity. Run npm ci, plan check, typecheck, complete tests,
  exact production build, both audits, and whitespace checks.
- Freeze the exact candidate, obtain non-author fresh-context C0/H0 review, disposition
  every medium/low finding, and add only manifest/review in the direct-child attestation.

INDEPENDENT REVIEW
- The reviewer must start from fresh context, remain read-only, and have authored or
  edited no P8M byte. Give the reviewer the original objective, live baseline, exact
  authority, contract, complete denominator, candidate manifest/diff, verification,
  proposals, review decisions, reconciliation, side effects, risks, and stop boundary.
- The implementation agent owns remediation. The same reviewer rechecks changed bytes.

AUTONOMOUS GIT DELIVERY — NO GIT QUESTIONS TO KELSEY
- Use only the exact later P8M Git/Vercel authority. Never force-push, rewrite accepted
  history, bypass checks, append after an undelivered attestation, or infer delivery
  authority from edit access, Revision 10 delivery, or next-permitted state.

OUT OF SCOPE
- P8F product implementation, P9, P9-IDENTITY-PINS, mutable-master runtime reads,
  monitoring activation, deployment-configuration changes, applicant data, forms,
  provider contact, self-accepted AI output, unapproved sources, unapproved writes,
  paid/destructive actions, gate weakening, and history rewrite.

STOP CONDITIONS
- Exact authority, live baseline, source identity, revision, denominator, taxonomy,
  prompt/input fingerprint, reviewer, backup/write gate, delivery effects, or rollback
  owner is missing or mismatched.
- Any applicant/unrelated tab could be read; any proposal could self-accept; any missing
  value could become false; any sensitive nonselection could exclude; or any parent,
  child, application, or cycle identity could collapse.
- A cap, retry, model failure, source block, or review queue would silently lose work.
- Work would begin P8F/P9, activate monitoring, change runtime/deployment configuration,
  submit a form, contact a provider, or exceed exact authority.

END-OF-STAGE OUTPUT
One PASS/BLOCKED/FAIL status; exact denominator and fact reconciliation; source/access/
write receipt; Claude proposal-only proof; human and independent review; immutable
publication/candidate/manifest/attestation; authorized delivery results or blocker; and
every remaining unknown. Stop before P8F and P9.
```
