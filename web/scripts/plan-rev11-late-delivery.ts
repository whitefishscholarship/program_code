export const PLAN_REV11_DELIVERY_EFFECTS = [
  'branch_push',
  'pull_request',
  'vercel_preview',
  'merge',
  'vercel_production',
  'ci_and_deployment_verification',
] as const;

export const PLAN_REV11_CONTINUATION_PATHS = [
  'AGENTS.md',
  'docs/BUILD_STATE.json',
  'docs/CURRENT_HANDOFF.md',
  'docs/DECISIONS.md',
  'docs/SCHOLARSHIP_SYSTEM_BUILD_PLAN.md',
  'docs/evidence/PLAN-REV11.md',
  'docs/kickoffs/PLAN-REV11-REV10-LATE-DELIVERY.md',
  'web/package.json',
  'web/scripts/plan-rev11-late-delivery.ts',
  'web/scripts/test-plan-rev10-governance.ts',
  'web/scripts/test-plan-rev11-late-delivery.ts',
  'web/scripts/validate-build-plan.ts',
] as const;

export type CanonicalPlanAmendmentIdentity = {
  amendmentId: string;
  candidateCommit: string;
  attestationCommit: string;
  baselineCommit: string;
};

export type PlanRev11LateDeliveryContinuation = {
  targetAmendmentId: string;
  targetCandidateCommit: string;
  targetAttestationCommit: string;
  targetBaselineCommit: string;
  authorityReceivedAt: string;
  authorityEvidencePath: string;
  continuationBranch: string;
  authorizedEffects: string[];
  allowedContinuationPaths: string[];
  productOrDataChangeAuthorized: boolean;
  p8mExecutionAuthorizedByThisContinuation: boolean;
};

export function validatePlanRev11LateDelivery(
  continuation: PlanRev11LateDeliveryContinuation,
  canonicalTarget: CanonicalPlanAmendmentIdentity,
): string[] {
  const errors: string[] = [];
  if (
    continuation.targetAmendmentId !== canonicalTarget.amendmentId ||
    continuation.targetCandidateCommit !== canonicalTarget.candidateCommit ||
    continuation.targetAttestationCommit !== canonicalTarget.attestationCommit ||
    continuation.targetBaselineCommit !== canonicalTarget.baselineCommit
  ) {
    errors.push('Plan Revision 11 late delivery must bind the exact canonical Revision 10 topology');
  }
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(continuation.authorityReceivedAt)) {
    errors.push('Plan Revision 11 late delivery requires an exact UTC authority timestamp');
  }
  if (continuation.authorityEvidencePath !== 'docs/evidence/PLAN-REV11.md') {
    errors.push('Plan Revision 11 late delivery authority must bind its immutable evidence path');
  }
  if (continuation.continuationBranch !== 'codex/plan-rev11-rev10-delivery') {
    errors.push('Plan Revision 11 late delivery must use the pinned continuation branch');
  }
  if (
    JSON.stringify(continuation.authorizedEffects) !==
    JSON.stringify(PLAN_REV11_DELIVERY_EFFECTS)
  ) {
    errors.push('Plan Revision 11 late delivery effects are incomplete or expanded');
  }
  if (
    JSON.stringify(continuation.allowedContinuationPaths) !==
    JSON.stringify(PLAN_REV11_CONTINUATION_PATHS)
  ) {
    errors.push('Plan Revision 11 late delivery continuation paths are incomplete or expanded');
  }
  if (continuation.productOrDataChangeAuthorized !== false) {
    errors.push('Plan Revision 11 late delivery cannot authorize product or data changes');
  }
  if (continuation.p8mExecutionAuthorizedByThisContinuation !== false) {
    errors.push('Plan Revision 11 late delivery cannot itself start P8M');
  }
  return errors;
}
