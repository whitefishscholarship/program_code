import { isDeepStrictEqual } from 'node:util';

export const PLAN_REV12_AMENDMENT_PATHS = [
  'AGENTS.md',
  'docs/BUILD_STATE.json',
  'docs/CURRENT_HANDOFF.md',
  'docs/DECISIONS.md',
  'docs/SCHOLARSHIP_SYSTEM_BUILD_PLAN.md',
  'docs/evidence/PLAN-REV12.md',
  'docs/kickoffs/P8M-MATCHING-FACT-ENRICHMENT.md',
  'docs/kickoffs/PLAN-REV12-ROW-SOURCE-CORRECTION.md',
  'web/package.json',
  'web/scripts/plan-rev10-lifecycle.ts',
  'web/scripts/plan-rev12-row-source.ts',
  'web/scripts/test-plan-rev10-governance.ts',
  'web/scripts/test-plan-rev11-late-delivery.ts',
  'web/scripts/test-plan-rev12-row-source.ts',
  'web/scripts/validate-build-plan.ts',
] as const;

export const PLAN_REV12_P8M_BLOCKERS = [
  'P8M-external-reverification-awaits-exact-url-column-allowlist-and-Claude-processing-instruction',
  'P8M-acceptance-awaits-named-human-fact-reviewer',
] as const;

export const P8M_HUMAN_DECISIONS_BLOCKER =
  'P8M-acceptance-awaits-complete-human-fact-decisions';

export type PlanRev12RowSourceCorrection = {
  contractId: string;
  spreadsheetId: string;
  spreadsheetTitle: string;
  sheetId: number;
  sheetTitle: string;
  sourceRevision: string;
  revisionModifiedTime: string;
  fileModifiedTime: string;
  gridRange: string;
  usedRange: string;
  headerRows: number;
  populatedRows: number;
  scholarshipRows: number;
  portalRows: number;
  uniqueScholarshipNames: number;
  duplicateExactScholarshipNameGroups: number;
  sourceDenominator: string;
  awardDenominator: string;
  cycleDenominator: string;
  applicationGroupDenominator: string;
  blankCellDisposition: string;
  rowOutcomeRequired: boolean;
  incompleteFactsMayProceed: boolean;
  cycleIdRequiredForSourceRow: boolean;
  applicationGroupRequiredForSourceRow: boolean;
  spreadsheetWriteAuthorized: boolean;
  externalSourceReadsAuthorized: boolean;
  claudeProcessingAuthorized: boolean;
  humanFactReviewer: string | null;
  pinningEvidencePath: string;
};

export const EXPECTED_PLAN_REV12_ROW_SOURCE: PlanRev12RowSourceCorrection = {
  contractId: 'p8m-row-source-v1',
  spreadsheetId: '1Dp5AMnrfSQ-Xf-r03S75lKsGPJk7o0inOgvC9Q6lOl4',
  spreadsheetTitle: 'Whitefish HS Scholarship Database',
  sheetId: 0,
  sheetTitle: 'Master Database',
  sourceRevision: '225',
  revisionModifiedTime: '2026-09-02T03:41:28.432Z',
  fileModifiedTime: '2026-09-02T03:41:28.518Z',
  gridRange: "'Master Database'!A1:X1060",
  usedRange: "'Master Database'!A1:O198",
  headerRows: 1,
  populatedRows: 197,
  scholarshipRows: 176,
  portalRows: 21,
  uniqueScholarshipNames: 175,
  duplicateExactScholarshipNameGroups: 1,
  sourceDenominator: 'all_197_populated_rows',
  awardDenominator: '176_rows_explicitly_labeled_scholarship',
  cycleDenominator: 'not_a_source_field_not_required',
  applicationGroupDenominator: 'not_a_source_field_not_required',
  blankCellDisposition: 'unknown_not_observed',
  rowOutcomeRequired: true,
  incompleteFactsMayProceed: true,
  cycleIdRequiredForSourceRow: false,
  applicationGroupRequiredForSourceRow: false,
  spreadsheetWriteAuthorized: false,
  externalSourceReadsAuthorized: false,
  claudeProcessingAuthorized: false,
  humanFactReviewer: null,
  pinningEvidencePath: 'docs/evidence/PLAN-REV12.md',
};

type OrganizerMaster = {
  spreadsheetId: string;
  role: string;
  designationEvidence: string;
  verificationStatus: string;
  accessAuthorized: boolean;
  automatedWriteAuthorized: boolean;
  automatedWriteAuthorizationEvidencePath: string | null;
  automatedWriteAcceptanceEvidencePath: string | null;
  verificationEvidencePath: string;
};

type P8mAuthorization = {
  stageId: string;
  authorized: boolean;
  authorizedBy: string | null;
  authorizedAt: string | null;
  evidencePath: string | null;
  basis: string;
  scope: string;
};

export type PlanRev12ValidationContext = {
  planRevision: number;
  amendmentBaselineCommit: string;
  amendmentDeliveryAuthorized: boolean;
  amendmentEvidencePath: string | null;
  rowSource: PlanRev12RowSourceCorrection | undefined;
  amendmentRowSource: PlanRev12RowSourceCorrection | undefined;
  organizerMaster: OrganizerMaster;
  p8mAuthorization: P8mAuthorization | undefined;
  p8mStatus: string | undefined;
  activeStageId: string | null;
  nextPermittedStageId: string | null;
  deliveryBlockers: string[];
};

export function validatePlanRev12RowSource(
  context: PlanRev12ValidationContext,
): string[] {
  const errors: string[] = [];
  const operationalRowSource = context.rowSource
    ? {
        ...context.rowSource,
        externalSourceReadsAuthorized: false,
        claudeProcessingAuthorized: false,
        humanFactReviewer: null,
      }
    : undefined;
  if (context.planRevision !== 12) errors.push('Plan Revision 12 must set planRevision to 12');
  if (context.amendmentBaselineCommit !== '57bb062d64f725fa6ce72709f81fe987dde3e2af') {
    errors.push('Plan Revision 12 must bind the verified Revision 11 delivery-closure baseline');
  }
  if (!context.amendmentDeliveryAuthorized || context.amendmentEvidencePath !== 'docs/evidence/PLAN-REV12.md') {
    errors.push('Plan Revision 12 delivery requires direct authority bound to its evidence');
  }
  if (!isDeepStrictEqual(operationalRowSource, EXPECTED_PLAN_REV12_ROW_SOURCE)) {
    errors.push('Plan Revision 12 row-source identity differs from the exact read-only receipt');
  }
  if (!isDeepStrictEqual(context.amendmentRowSource, EXPECTED_PLAN_REV12_ROW_SOURCE)) {
    errors.push('Plan Revision 12 amendment must bind the exact row-source correction');
  }
  if (
    context.organizerMaster.spreadsheetId !== EXPECTED_PLAN_REV12_ROW_SOURCE.spreadsheetId ||
    context.organizerMaster.role !== 'organizer_authoring_master' ||
    context.organizerMaster.designationEvidence !== 'user-confirmed-and-read-only-verified' ||
    context.organizerMaster.verificationStatus !== 'verified' ||
    context.organizerMaster.accessAuthorized !== true ||
    context.organizerMaster.automatedWriteAuthorized !== false ||
    context.organizerMaster.automatedWriteAuthorizationEvidencePath !== null ||
    context.organizerMaster.automatedWriteAcceptanceEvidencePath !== null ||
    context.organizerMaster.verificationEvidencePath !== 'docs/evidence/PLAN-REV12.md'
  ) {
    errors.push('Plan Revision 12 organizer-master state must be exact read-only verified and no-write');
  }
  if (
    context.p8mAuthorization?.authorized !== true ||
    context.p8mAuthorization.authorizedBy !== 'Kelsey Stuart' ||
    context.p8mAuthorization.authorizedAt !== '2026-09-02' ||
    context.p8mAuthorization.evidencePath !== 'docs/evidence/PLAN-REV12.md' ||
    !context.p8mAuthorization.basis.trim() ||
    !context.p8mAuthorization.scope.includes('No spreadsheet write')
  ) {
    errors.push('Plan Revision 12 must retain exact P8M delivery authority and no-write scope');
  }
  const externalBlocker = PLAN_REV12_P8M_BLOCKERS[0];
  const reviewerBlocker = PLAN_REV12_P8M_BLOCKERS[1];
  if (context.p8mStatus === 'planned') {
    if (
      context.rowSource?.externalSourceReadsAuthorized !== false ||
      context.rowSource?.claudeProcessingAuthorized !== false ||
      context.rowSource?.humanFactReviewer !== null ||
      context.activeStageId !== null ||
      context.nextPermittedStageId !== 'P8M' ||
      !context.deliveryBlockers.includes(externalBlocker) ||
      !context.deliveryBlockers.includes(reviewerBlocker)
    ) {
      errors.push('Planned P8M must retain both phased blockers and no processing authority');
    }
  } else {
    if (
      context.rowSource?.externalSourceReadsAuthorized !== true ||
      context.rowSource?.claudeProcessingAuthorized !== true ||
      context.deliveryBlockers.includes(externalBlocker)
    ) {
      errors.push('Started P8M requires the exact external-source and Claude instruction gate to be satisfied');
    }
    const accepted = context.p8mStatus === 'accepted';
    if (
      (accepted && (context.activeStageId !== null || context.nextPermittedStageId !== 'P8F')) ||
      (!accepted && (context.activeStageId !== 'P8M' || context.nextPermittedStageId !== null))
    ) {
      errors.push('P8M active/next-stage state is inconsistent with its lifecycle status');
    }
    const reviewerNamed = Boolean(context.rowSource?.humanFactReviewer?.trim());
    if (reviewerNamed === context.deliveryBlockers.includes(reviewerBlocker)) {
      errors.push('P8M human-reviewer blocker must exactly reflect whether a reviewer is named');
    }
    const decisionsBlocked = context.deliveryBlockers.includes(P8M_HUMAN_DECISIONS_BLOCKER);
    const decisionsShouldBeBlocked =
      reviewerNamed && !['verified', 'accepted'].includes(context.p8mStatus ?? '');
    if (decisionsShouldBeBlocked !== decisionsBlocked) {
      errors.push('P8M human-decision blocker must exactly reflect review completion state');
    }
    if (accepted && !reviewerNamed) {
      errors.push('Accepted P8M requires a named human fact reviewer');
    }
  }
  if (
    context.deliveryBlockers.some(
      (item) =>
        item.includes('cycle') ||
        item.includes('application-group') ||
        item.includes('application_group'),
    )
  ) {
    errors.push('Plan Revision 12 cannot retain invented cycle/application-group source blockers');
  }
  return errors;
}
