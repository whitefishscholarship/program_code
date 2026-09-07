import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  EXPECTED_PLAN_REV12_ROW_SOURCE,
  P8M_HUMAN_DECISIONS_BLOCKER,
  PLAN_REV12_AMENDMENT_PATHS,
  PLAN_REV12_P8M_BLOCKERS,
  validatePlanRev12RowSource,
  type PlanRev12RowSourceCorrection,
  type PlanRev12ValidationContext,
} from './plan-rev12-row-source';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relativePath: string) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
const state = JSON.parse(read('docs/BUILD_STATE.json')) as {
  planRevision: number;
  activeStageId: string | null;
  nextPermittedStageId: string | null;
  dataAuthority: {
    sourceTransition: {
      organizerMaster: PlanRev12ValidationContext['organizerMaster'];
      p8mRowSource?: PlanRev12RowSourceCorrection;
    };
  };
  deployment: {
    stageMergeAuthorizations: NonNullable<
      PlanRev12ValidationContext['p8mAuthorization']
    >[];
    deliveryBlockers: string[];
  };
  governance: {
    planAmendments: Array<{
      id: string;
      baselineCommit: string;
      evidencePath: string;
      deliveryAuthorization?: { authorized: boolean };
      rowSourceCorrection?: PlanRev12RowSourceCorrection;
    }>;
  };
  stages: Array<{ id: string; status: string }>;
};

const revision12 = state.governance.planAmendments.find(({ id }) => id === 'PLAN-REV12');
assert(revision12, 'PLAN-REV12 amendment record is required');
const p8mAuthorization = state.deployment.stageMergeAuthorizations.find(({ stageId }) => stageId === 'P8M');
const context: PlanRev12ValidationContext = {
  planRevision: state.planRevision,
  amendmentBaselineCommit: revision12.baselineCommit,
  amendmentDeliveryAuthorized: revision12.deliveryAuthorization?.authorized === true,
  amendmentEvidencePath: revision12.evidencePath,
  rowSource: state.dataAuthority.sourceTransition.p8mRowSource,
  amendmentRowSource: revision12.rowSourceCorrection,
  organizerMaster: state.dataAuthority.sourceTransition.organizerMaster,
  p8mAuthorization,
  p8mStatus: state.stages.find(({ id }) => id === 'P8M')?.status,
  activeStageId: state.activeStageId,
  nextPermittedStageId: state.nextPermittedStageId,
  deliveryBlockers: state.deployment.deliveryBlockers,
};

assert.deepEqual(validatePlanRev12RowSource(context), []);
assert.deepEqual(
  {
    ...context.rowSource,
    externalSourceReadsAuthorized: false,
    claudeProcessingAuthorized: false,
    humanFactReviewer: null,
  },
  EXPECTED_PLAN_REV12_ROW_SOURCE,
);
assert.equal(context.rowSource?.externalSourceReadsAuthorized, true);
assert.equal(context.rowSource?.claudeProcessingAuthorized, true);
assert.equal(context.rowSource?.humanFactReviewer, 'Kelsey Stuart');
assert.equal(PLAN_REV12_AMENDMENT_PATHS.includes('web/src/app/page.tsx' as never), false);
assert.equal(context.deliveryBlockers.includes(PLAN_REV12_P8M_BLOCKERS[0]), false);
assert.equal(context.deliveryBlockers.includes(PLAN_REV12_P8M_BLOCKERS[1]), false);
assert.equal(context.deliveryBlockers.includes(P8M_HUMAN_DECISIONS_BLOCKER), false);

const mutations: Array<(copy: PlanRev12ValidationContext) => void> = [
  (copy) => { copy.rowSource!.populatedRows = 198; },
  (copy) => { copy.rowSource!.cycleDenominator = '176'; },
  (copy) => { copy.rowSource!.applicationGroupRequiredForSourceRow = true; },
  (copy) => { copy.rowSource!.blankCellDisposition = 'false'; },
  (copy) => { copy.rowSource!.incompleteFactsMayProceed = false; },
  (copy) => { copy.rowSource!.spreadsheetWriteAuthorized = true; },
  (copy) => { copy.organizerMaster.automatedWriteAuthorized = true; },
  (copy) => { copy.p8mAuthorization!.authorized = false; },
  (copy) => { copy.rowSource!.claudeProcessingAuthorized = false; },
  (copy) => { copy.deliveryBlockers.push(PLAN_REV12_P8M_BLOCKERS[0]); },
  (copy) => {
    copy.deliveryBlockers.push(P8M_HUMAN_DECISIONS_BLOCKER);
  },
  (copy) => { copy.deliveryBlockers.push('P8M-cycle-denominator-missing'); },
];
for (const mutate of mutations) {
  const copy = structuredClone(context);
  mutate(copy);
  assert(validatePlanRev12RowSource(copy).length > 0);
}

for (const [file, phrase] of [
  ['AGENTS.md', 'Plan Revision 12 row-source correction boundary'],
  ['docs/SCHOLARSHIP_SYSTEM_BUILD_PLAN.md', 'Row-source correction and incomplete-fact progress'],
  ['docs/CURRENT_HANDOFF.md', 'Plan Revision 12 — row-source correction'],
  ['docs/DECISIONS.md', 'D-024'],
  ['docs/evidence/PLAN-REV12.md', 'revision remained `225`'],
  ['docs/kickoffs/PLAN-REV12-ROW-SOURCE-CORRECTION.md', 'Stop before P8M execution'],
  ['docs/kickoffs/P8M-MATCHING-FACT-ENRICHMENT.md', 'application-group and cycle counts are not source denominators'],
] as const) {
  assert(read(file).includes(phrase), `${file} missing ${phrase}`);
}

console.log('PLAN REV12 ROW SOURCE TEST PASS exact pin, row completeness, unknown blanks, no invented denominators, and no-write boundary');
