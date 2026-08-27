# P6 Kickoff — Eligible Coverage Expansion

Use this kickoff only in a fresh session after P5 is accepted, attested, and delivered
on `origin/main`. Creating this document does not start or authorize P6.

```text
Execute P6 — Eligible coverage expansion — only for
whitefishscholarship/program_code.

AUTHORITATIVE READ ORDER
1. AGENTS.md
2. docs/SCHOLARSHIP_SYSTEM_BUILD_PLAN.md
3. docs/BUILD_STATE.json
4. docs/CURRENT_HANDOFF.md
5. docs/evidence/P5.md
6. docs/evidence/P5-manifest.json
7. docs/reviews/P5.json
8. docs/kickoffs/P6-COVERAGE-EXPANSION.md
9. P1-P5 accepted implementation, fixtures, reports, and tests needed by P6

ENTRY GATE
- Verify exact live `origin/main`, the accepted P5 candidate, direct-child attestation,
  manifest, independent review, and delivered branch tip before editing.
- Run plan/history validation and reproduce P5 reconciliation before beginning P6.
- Keep the production spreadsheet identity unset and every production read/write
  unauthorized. P5 testing-sheet write authority does not authorize P6 writes.
- Execute P6 only; do not start P7 or P9.

OBJECTIVE
Increase useful eligible scholarship coverage by expanding high-yield sources into
current, evidence-bound, deduplicated child awards without silently losing pages,
children, applications, or unknowns.

IN SCOPE
- Architecture classifier and selective URL canonicalization.
- Single-page extraction, multi-award section splitting, directory queues,
  pagination/cursor handling, document parsing, bounded public-form reading, and a
  dynamic/login manual-review route.
- Completeness receipts, resumable counts, deterministic source-specific fixtures,
  P6 evidence/tests/handoff, independent review, attestation, and authorized delivery.

OUT OF SCOPE
- Production writes or migration, P9, automatic acceptance of extracted facts,
  access-control bypass, form submission, application interaction, applicant data,
  credentials, provider contact, paid actions, deployment-configuration changes, or
  starting P7.

INVARIANTS
- Preserve identity-bearing page, urlkey, sys_id, filters, and meaningful fragments;
  remove only proven tracking parameters.
- Preserve parent sources, child awards, shared applications, annual cycles, raw
  denominators, field evidence, conflicts, and unknowns as distinct concepts.
- Never silently truncate portal pages, child links, search results, extracted awards,
  or processing caps. Every incomplete route remains measurable and resumable.
- Fetch retries are bounded. Failed, inaccessible, dynamic, or login-gated sources
  produce manual-review items rather than accepted facts.
- Same input produces the same child identities.

ACCEPTANCE
- No representative architecture silently loses a child or page.
- Independent review reproduces fixture counts and challenges pagination, caps,
  canonicalization, child splitting, and deduplication boundaries.
- Required stage checks plus plan validation, typecheck, tests, build, and root diff
  check pass; final acceptance uses the immutable candidate, complete manifest, and
  direct-child review attestation required by AGENTS.md.

ROLLBACK
Disable the P6 router and return to accepted P5 read-only behavior. Do not delete or
rewrite accepted P5 data or evidence.

STOP
Stop if P5 is not accepted/delivered, source completeness cannot be measured, work
requires a reserved external effect, or independent review retains a critical/high
finding.
```
