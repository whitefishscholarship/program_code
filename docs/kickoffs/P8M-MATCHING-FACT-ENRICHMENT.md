# P8M Kickoff — Matching-Fact Enrichment and Acceptance

Use this kickoff only after Plan Revisions 10 through 12 are independently accepted,
direct-child attested, delivered, and verified on live `origin/main`. Revision 12 pins
the row source and corrects the earlier invented-denominator assumption. This kickoff
does not itself authorize the remaining external reads, Claude processing, or final
human acceptance.

```text
Execute P8M — Matching-fact enrichment and acceptance — only for
whitefishscholarship/program_code. Stop before P8F and P9.

AUTHORITATIVE READ ORDER
1. AGENTS.md
2. docs/SCHOLARSHIP_SYSTEM_BUILD_PLAN.md
3. docs/BUILD_STATE.json
4. docs/CURRENT_HANDOFF.md
5. docs/evidence/PLAN-REV10.md, manifest, and review
6. docs/evidence/PLAN-REV10-matching-fact-contract.json
7. docs/evidence/PLAN-REV11.md, manifest, and review
8. docs/evidence/PLAN-REV12.md, manifest, and review
9. docs/evidence/P8R.md and its accepted manifest/review
10. docs/evidence/PLAN-REV9-interview-inventory.md
11. docs/evidence/P5.md and the accepted write/backup/reconciliation records
12. docs/evidence/P7.md and its accepted manifest/review
13. docs/evidence/P8.md and its accepted manifest/review
14. docs/kickoffs/P8M-MATCHING-FACT-ENRICHMENT.md

PINNED ROW SOURCE
- Spreadsheet: 1Dp5AMnrfSQ-Xf-r03S75lKsGPJk7o0inOgvC9Q6lOl4.
- Title: Whitefish HS Scholarship Database.
- Only source tab: Master Database, gid 0.
- Grid range: 'Master Database'!A1:X1060.
- Used range: 'Master Database'!A1:O198.
- Drive revision: 225; revision time 2026-09-02T03:41:28.432Z; file modified time
  2026-09-02T03:41:28.518Z.
- One header plus exactly 197 populated source rows: 176 explicitly labeled
  Scholarship and 21 explicitly labeled Portal.
- There are 175 unique nonblank Scholarship names and one exact-name duplicate group.
  Name alone is not a stable identity; resolve the duplicate explicitly.
- The original source has no application-group field and no cycle/cycle-ID field.
  Therefore application-group and cycle counts are not source denominators. Never
  fabricate either field to complete a row.
- Every source row must have exactly one row-ledger outcome. A row does not need every
  possible fact. Blank or unavailable facts remain unknown and do not stop valid work
  on that row or other rows.

CURRENT AUTHORITY AND REMAINING PHASE GATES
- The completed read-only pin was limited to spreadsheet metadata and Master Database.
  It made no writes and the revision remained 225.
- Governed P8M Git delivery and resulting Vercel Preview/Production verification are
  authorized after P8M independently passes acceptance.
- No spreadsheet write is authorized. Edit capability is not operation authority.
- Before any official-source acquisition or Claude processing, obtain and machine-pin
  the exact URL-bearing source columns, official-source allowlist, and bounded Claude
  processing instruction. Access no URL or additional tab before then.
- Before any fact can be accepted and before P8M acceptance, machine-pin the named
  human fact reviewer. Claude and Codex remain proposal/validation roles, not fact
  acceptance identities.
- These are phased gates. Missing a later gate does not undo the source pin or block
  local schema, ledger, reconciliation, and proposal-pipeline preparation that has no
  external read or write effect.

OBJECTIVE
Create a typed, evidence-backed, independently reviewed matching-fact set and immutable
versioned publication while reconciling exactly all 197 source rows. Complete means no
source row is silently lost, not that every field is populated.

PINNED CONTRACT
- Use only matching-facts-v1, taxonomy 1.0.0, at
  docs/evidence/PLAN-REV10-matching-fact-contract.json and its strict validator at
  web/scripts/matching-fact-contract.ts.
- The frozen normalized contract may represent a cycle-specific fact when current
  evidence explicitly establishes one. It does not require cycle_id for a source row.
- Bind accepted facts to stable award_id; use cycle_id only for explicitly
  cycle-specific facts. Keep the source-row ledger distinct from the fact ledger.
- Unknown criteria, aliases, values, operators, subjects, or scopes go to explicit
  unknown/manual taxonomy review. Do not expand or weaken the taxonomy during row
  processing.
- Preserve parent, child, portal, shared-application, and cycle concepts as distinct
  only when source evidence establishes them. Do not infer an application group from a
  shared URL or a cycle from a date alone.

SOURCE AND EVIDENCE POLICY
- Access only Master Database cells and only the later allowlisted URLs. The former
  production spreadsheet and all other tabs remain out of scope.
- Organizer-reviewed master facts may be accepted directly only where the organizer is
  authoritative for that local field. Material eligibility, deadline, application, and
  any explicitly cycle-specific facts otherwise require current official evidence.
- Secondary sources and AI output are discovery/proposal only. Equal-authority conflict
  remains visible and cannot affect matching.
- A blank cell, unavailable page, blocked fetch, incomplete scrape, unsupported
  criterion, or absent statement is unknown—not false, rejected, or ineligible.
- Row outcomes must distinguish proposed facts, accepted facts, rejected proposals,
  conflicts, stale facts, unknowns, source-access failures, and manual-taxonomy needs.
  Those outcomes permit resumable progress without silently skipping a row.

CLAUDE PROPOSAL-ONLY BOUNDARY
- Run Claude only after the exact URL-column/allowlist and processing instruction are
  pinned. Freeze revision 225 inputs or explicitly stop if the source revision changes.
- Pin prompt, model/tool version, input/output fingerprints, batch size, checkpoints,
  resume cursor, retries, confidence/ambiguity, and all-197-row receipts.
- Accept only schema-valid JSON/JSONL with proposed status. Claude cannot self-accept,
  write a spreadsheet, process applicant PII, enter a form/application, contact a
  provider, infer false from missing text, invent cycle/application-group fields, or
  silently skip or truncate a row or source.

CODEX AND HUMAN REVIEW BOUNDARY
- Codex owns stable-ID mapping, strict validation, duplicate/conflict/coverage checks,
  no-truncation reconciliation, source-policy enforcement, review packaging, and
  immutable-publication construction.
- The named human fact reviewer owns accepted/rejected/conflict decisions and rationale.
  No Claude or Codex proposal becomes accepted without that review.
- Review 100% of required-effect, sensitive, conflict, stale, rejected, unknown,
  duplicate-name, parent/child, shared-application, and any future write-bound record,
  plus the predeclared deterministic sample of remaining proposals.

NO-WRITE BOUNDARY
- P8M is read-only with respect to the spreadsheet. Do not append, clear, format,
  comment, rename, share, or otherwise mutate it.
- A future sheet write would require a separate plan amendment and direct informed
  authorization naming the exact cells, operation count, current revision, backup and
  rollback owners, reviewed dry run, readback, and untargeted-cell proof. None exists.

DELIVERABLES
- Exact source/revision receipt; 197-row ledger; deterministic row-to-award/portal
  mapping; duplicate-name disposition; proposal/checkpoint/resume/ambiguity ledgers;
  normalized fact set; explicit conflict/stale/unknown/rejected/manual queues; reviewer
  decisions; immutable publication candidate; reconciliation; rollback; evidence;
  manifest; and fresh-context review.
- Advance BUILD_STATE only through the governed P8M lifecycle. P8M may preserve the
  Revision 12 master pin. It may create a candidate publication only after complete
  validation. Leave every P9-owned runtime/provider pin unset.
- If blocked or failed, preserve completed row outcomes and a resumable cursor. Do not
  relabel incomplete work or a candidate publication as accepted.

ACCEPTANCE TESTS
- Reconcile exactly 197 row-ledger outcomes, 176 Scholarship-labeled rows, 21
  Portal-labeled rows, 175 unique nonblank Scholarship names, and one exact-name
  duplicate group. No source row may be absent or duplicated.
- Do not require a nonzero fact, source, cycle, or application-group count for every
  row. Verify instead that missing information has an explicit unknown/access/manual
  outcome and cannot affect matching.
- Test every criterion/operator/value/scope, alias, status transition, authority rank,
  freshness rollover, sensitive state, conflict, stable-ID link, duplicate, truncation,
  checkpoint/retry, and no-write boundary.
- Run npm ci, plan check, typecheck, complete tests, exact production build, audits, and
  whitespace checks. Freeze the candidate, obtain non-author fresh-context C0/H0
  review, disposition every medium/low finding, and add only manifest/review in the
  direct-child attestation.

INDEPENDENT REVIEW
- The reviewer starts from fresh context, remains read-only, and has authored or edited
  no P8M byte. Provide the objective, live baseline, exact authority, source pin,
  contract, row ledger, candidate manifest/diff, verification, proposals, human
  decisions, reconciliation, side effects, risks, and stop boundary.
- The implementation agent owns remediation. The same reviewer rechecks changed bytes.

AUTONOMOUS GIT DELIVERY — NO GIT QUESTIONS TO KELSEY
- Use the recorded P8M Git/Vercel authority only after acceptance. Never force-push,
  rewrite accepted history, bypass checks, append after an undelivered attestation, or
  infer any external-read/write authority from delivery authority.

OUT OF SCOPE
- P8F, P9, P9-IDENTITY-PINS, mutable-master runtime reads, additional spreadsheet tabs,
  the legacy comparison sheet, monitoring activation, deployment-configuration
  changes, applicant data, forms, provider contact, self-accepted AI output,
  unallowlisted sources, every spreadsheet write, paid/destructive actions, gate
  weakening, and history rewrite.

STOP CONDITIONS
- The live baseline or revision pin changes without a governed reconciliation.
- Work would read an unallowlisted URL/additional tab, invoke Claude before its exact
  instruction, accept a fact before the named human reviewer, write the spreadsheet,
  turn unknown into false, silently skip a row, or invent cycle/application-group data.
- Work would begin P8F/P9, activate monitoring, change runtime/deployment configuration,
  submit a form, contact a provider, or exceed exact authority.

END-OF-STAGE OUTPUT
One PASS/BLOCKED/FAIL status; exact 197-row reconciliation; fact/status totals; source
and no-write receipt; Claude proposal-only proof; human and independent review;
immutable publication/candidate/manifest/attestation; authorized delivery results or
blocker; and every remaining unknown. Stop before P8F and P9.
```
