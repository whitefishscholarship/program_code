# PLAN-REV17 — R2 repair authority and evidence

Recorded 2026-09-12T23:49:53Z. Kelsey directly replied:

> authorize all items you have listed

The immediately preceding request identified the independently reviewed repair
proposal at `5ecf7a7d37e37a267b60c0894c1158ef64da3718`, review-only checkpoint
`3b276b4` on `codex/r2-rev15-blocked-handoff`. It asked for validator/test repair,
an attestation-preserving REV17 continuation and its existing-project release
effects, retaining serial REV15 then REV16 and all prohibitions. This grant
authorizes every listed positive action, not the explicitly prohibited actions.

Current GitHub main API and normal command-scoped HTTPS fetch both returned M0
`5fa08541b6b49484dedc8fc06012e47c658ce8fb`. A15 `94db9e72ff241f5eb0939872d97852657f139ecb` and original R1 source
`979122a13d4a8098d8cea26f115add1e68405355` were clean and unchanged. No remote action
beyond those read-only baseline checks has occurred at this policy checkpoint.
The source blocker receipt is retained at 3b276b4 under
`docs/evidence/interview-coverage/r2-rev15-blocker.json`; all four full blob hashes
match, but actual prior validator fails. Scratch success is diagnosis only.

Exact authority and continuation pins:

```json
{
  "targetAmendmentId": "PLAN-REV15",
  "targetCandidateCommit": "74057a1f2af33ca226fb573c4f9301796048bef0",
  "targetAttestationCommit": "94db9e72ff241f5eb0939872d97852657f139ecb",
  "targetBaselineCommit": "5fa08541b6b49484dedc8fc06012e47c658ce8fb",
  "authorityReceivedAt": "2026-09-12T23:49:53Z",
  "authorityEvidencePath": "docs/evidence/PLAN-REV17.md",
  "continuationBranch": "codex/plan-rev17-rev15-delivery-repair",
  "authorizedEffects": [
    "branch_push",
    "pull_request",
    "vercel_preview",
    "merge",
    "vercel_production",
    "ci_and_deployment_verification"
  ],
  "allowedContinuationPaths": [
    "AGENTS.md",
    "docs/BUILD_STATE.json",
    "docs/SCHOLARSHIP_SYSTEM_BUILD_PLAN.md",
    "docs/DECISIONS.md",
    "docs/CURRENT_HANDOFF.md",
    "docs/kickoffs/PLAN-REV17-REV15-DELIVERY-REPAIR.md",
    "docs/evidence/PLAN-REV17.md",
    "docs/evidence/interview-coverage/r2-rev17-policy-review.json",
    "docs/evidence/interview-coverage/r2-rev17-validation.json",
    "docs/evidence/interview-coverage/r2-rev17-preservation.json",
    "web/package.json",
    "web/scripts/validate-build-plan.ts",
    "web/scripts/plan-rev17-rev15-delivery-repair.ts",
    "web/scripts/test-plan-rev17-rev15-delivery-repair.ts"
  ],
  "productOrDataChangeAuthorized": false,
  "workbookAccessAuthorized": false,
  "researchAuthorized": false,
  "configurationChangeAuthorized": false,
  "laterPhaseAuthorized": false,
  "projectId": "prj_LbefE2deji6nPND6iBiuofe7IABv",
  "teamId": "team_6CAjRq58n0WvAH49otKSQbA7",
  "canonicalHostname": "web-two-gules-45.vercel.app",
  "originalSourceCommit": "979122a13d4a8098d8cea26f115add1e68405355"
}
```

The original R2 grant remains in unchanged PLAN-REV15.md. This repair grant
replaces only its first delivery branch and adds the reviewed repair scope.
No prior workbook grant is reusable. All original open-item triggers remain in
the retained R1 handoff at 979122a and recovery handoff at 3b276b4.

The reviewed proposal below is preserved as the description of the approved
scope; its pre-grant pending language is historical and superseded above.

---

# R2 recovery proposal — additional authority pending

2026-09-12. Local proposal only; this does not amend the canonical plan, grant
authority, accept a stage, or permit delivery. The companion blocker receipt records
actual failing gates and the diagnostic limit. R2 remains BLOCKED before publication.

## Verified problem and corrected plan

REV15 candidate `74057a1f2af33ca226fb573c4f9301796048bef0` passed independent review.
Its direct-child attestation `94db9e72ff241f5eb0939872d97852657f139ecb` adds exactly
the canonical manifest and review. Both remain intact and unpushed on
`codex/plan-rev15-intake-release`, worktree `/private/tmp/program_code-r2-rev15`.
Manifest SHA256 is `8fc5fd17504313cde78d0e390dcd9ea2a12dcc0f9db61edaa354a61fce866f27`.

Actual post-attestation validation fails: the validator's `gitBuffer` uses Node's
default 1 MiB output buffer. Four existing evidence blobs exceed it; reads raise
ENOBUFS and are mislabeled hash mismatches. Full independent Git reads match all four
manifest hashes. A scratch-only 16 MiB reader makes validation pass. This diagnostic
is not a pass for the tracked validator or permission to deliver. No runtime defect
or source-data corruption has been established.

R1's grounding missed a path only exercised after attestation existed. Its statement
that no rule amendment was necessary is now superseded for this blocked checkpoint.
Before final attestation, missing-artifact diagnostics concealed the reader failure.
Keep the zero-error gate and preserve the locked attestation. Do not push it or append
an ordinary repair commit. REV16 remains unstarted.

The reviewed R1 unit-1 allowlist excludes validator/package/test edits; its zero-error
post-attestation gate is mandatory. AGENTS.md's independent-review section forbids
ordinary descendants of an undelivered attestation. The existing REV11 continuation
is pinned exclusively to REV10 and cannot authorize this case. The prospective
exception below needs direct authority and independent review before implementation.

## Exact prospective repair

Use PLAN-REV17 solely for this delivery repair, on new branch
`codex/plan-rev17-rev15-delivery-repair` from exact A15 above. Preserve the original
REV15 branch at A15 and the original intake branch at
`979122a13d4a8098d8cea26f115add1e68405355`. Require freshly verified main to remain
`5fa08541b6b49484dedc8fc06012e47c658ce8fb`; movement requires a revised reviewed recipe.

1. Record the new grant, exact topology, target and bounded exception in a dedicated
   canonical policy checkpoint; independently review it before implementation.
2. Repair Git blob reading with a finite 16 MiB limit, retaining rejection of failed,
   oversized/truncated or incorrect-hash inputs. Add regression coverage for the
   four actual preserved blobs, wrong hashes, unreadable objects and over-limit data.
   Do not shrink or regenerate the original evidence to fit the old limit.
3. Implement a REV15-only continuation check modeled on the existing exact REV11
   mechanism. It must require the pinned M0/C15/A15, branch, direct authority/effects,
   complete exact path allowlist, and byte equality outside it. Preserve the complete
   PLAN-REV15 amendment object against C15 directly, authority evidence and both
   canonical artifacts. Do not rely only on earliest-record amendment discovery.
   Only independently accepted REV17 attestation A17 may become the authorized
   undelivered continuation tip. Never exempt arbitrary descendants or alter REV11.
4. Freeze C17 after all evidence. Manifest the complete M0→C17 change set, including
   preserved C15/A15 ancestry and artifact blobs. Obtain fresh non-author full-candidate
   review, resolve all critical/high findings and disposition every medium/low.
   Add only `docs/evidence/PLAN-REV17-manifest.json` and `docs/reviews/PLAN-REV17.json`
   in C17's direct-child A17; require actual local and hosted-mode validation to pass.
   No branch-tip override may conceal a real descendant or failed gate.
5. Deliver REV15 plus this repair in the first release PR. Require exact-head CI and
   Preview verification before a non-squash merge, then exact Production verification.
   Only afterward resume the already-authorized REV16 release from freshly delivered
   main. Preserve REV15 and REV17 records, authority, manifests and reviews exactly.

The prospective candidate delta over A15 is restricted to these paths (no directory
wildcards). Canonical manifest/review paths are reserved for the attestation:

```text
AGENTS.md
docs/BUILD_STATE.json
docs/SCHOLARSHIP_SYSTEM_BUILD_PLAN.md
docs/DECISIONS.md
docs/CURRENT_HANDOFF.md
docs/kickoffs/PLAN-REV17-REV15-DELIVERY-REPAIR.md
docs/evidence/PLAN-REV17.md
docs/evidence/interview-coverage/r2-rev17-policy-review.json
docs/evidence/interview-coverage/r2-rev17-validation.json
docs/evidence/interview-coverage/r2-rev17-preservation.json
web/package.json
web/scripts/validate-build-plan.ts
web/scripts/plan-rev17-rev15-delivery-repair.ts
web/scripts/test-plan-rev17-rev15-delivery-repair.ts
```

Only add the repair regression command to the existing package test chain; preserve
every existing command, dependency and lockfile. The helper may expose the bounded
reader for testing and implement the exact continuation checks. AGENTS/plan/state
changes must describe this single exception without weakening any other gate.
Store bounded diagnostic/validation outputs inside the named JSON receipts. Add no
runtime, catalog, scholarship fact, workflow, deployment, dependency or configuration
change. A necessary path outside this proposal requires a revised reviewed scope.

## Verification and REV16 preservation

Run the complete R1 REV15 matrix: clean install, plan check, typecheck, full tests,
build, intake check, P9 zero-capability check and built trace, plus new buffer and
continuation adversarial tests. Verify the whole changed-path manifest, protected
blobs, direct-child topology, exact historical records and original review bindings.
Before A17 exactly four expected diagnostics may remain: REV17's three missing
canonical artifacts/attestation and REV15's undelivered-tip failure. The REV15 tip
exception must not become operative before canonical A17 exists. After A17 both
actual local and hosted-mode validators must report zero errors. CI must
exercise the new regression suite through npm test. Existing synthetic browser/API/
public CSV smoke must confirm unchanged behavior without writing old evidence.

The second release keeps identifier PLAN-REV16 while planRevision remains at least17;
record and validate this explicit order in the repair policy. At REV16 integration,
use the reviewed union of delivered repair checks/test commands and the already-reviewed
REV16 coverage helpers/test commands. R1's old source-only shared-validator resolution
is superseded for these overlap paths. A fresh independent review must verify that
neither side's checks disappear. Preserve all reviewed runtime/UI/publication blobs
from the original REV16 source exactly; retain original implementation-provenance
baseline `40ff61ecc75c204cc6114fd34a5b9941e84f5ad1`, distinct from new delivery baseline.

For both release units, bind Preview/Production provider source identities, fresh
nonce health, API/browser/CSV reconciliation and zero workbook capability to the
exact deployed revisions. Keep immutable post-freeze evidence in the authorized PR
record. Stop on CI, hash, review, scope, baseline, target or hosted verification failure.
Branch-protection configuration remains unverified following an authenticated403;
no protection setting may be changed or claimed. Require passing gates explicitly.

## Additional authority requested

Authorize only the repair/continuation above and its first release branch push, PR,
Vercel Preview, merge, Production deployment, CI and hosted verification, replacing
the first release branch in the original R2 recipe. Existing target stays project
`prj_LbefE2deji6nPND6iBiuofe7IABv`, team `team_6CAjRq58n0WvAH49otKSQbA7`, canonical
host `web-two-gules-45.vercel.app`. The second release remains REV16 after verified
REV15; no third product phase or deployment is introduced by this proposal.

All existing prohibitions remain: no workbook access/change, research, configuration
change, monitoring activation, source refresh, provider contact, applicant workflow,
credential change, rollback or later R3–R7 execution. This local handoff branch has no
push/PR/deployment authority. R2 is incomplete until both releases pass verification.
