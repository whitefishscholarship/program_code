# PLAN-REV16 direct execution authority and local scope

2026-09-12. Kelsey said: "proceed with execution of plan" after the reviewed coverage
proposal and checkpoint 40ff61e. Local implementation, prospective policy, testing and
independent review are authorized. The explicit bounded execution contract is
[INTERVIEW_COVERAGE_EXECUTION_PLAN.md](../INTERVIEW_COVERAGE_EXECUTION_PLAN.md).
No fresh workbook read/copy/write or external release effect is included. Existing
Revision14 release authority and the original intake batch grant cannot be reused.

Grounding: clean branch codex/scholarship-intake at 40ff61ecc75c204cc6114fd34a5b9941e84f5ad1;
`gh api repos/whitefishscholarship/program_code/commits/main --jq .sha` returned
5fa08541b6b49484dedc8fc06012e47c658ce8fb through a read-only permitted network call.
The restricted call could not connect; no credentials were revealed. The remote result
proves repository revision only, not application health or workbook freshness.

Status: local preparation. Policy and final review receipts will bind exact candidates.
Canonical manifest/attestation and external delivery remain unstarted.

Policy validation before freeze: exact four source excerpt / reviewed award bindings and
preserved input hashes PASS; exact local-preparation boundary positive, hosted, wrong-ID
and missing-blocker cases PASS; git diff --check PASS. Build-plan validator executed via
`node --import tsx scripts/validate-build-plan.ts` from web and reported exactly six
reserved errors: missing manifests, reviews and committed attestations for PLAN-REV15
and PLAN-REV16. These remain failures; no canonical acceptance or waiver is claimed.
An initial invocation from repository root failed to resolve web's tsx dependency; the
correct web-directory invocation above is the substantive result.
