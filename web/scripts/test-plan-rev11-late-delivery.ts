import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  PLAN_REV11_CONTINUATION_PATHS,
  PLAN_REV11_DELIVERY_EFFECTS,
  validatePlanRev11LateDelivery,
  type PlanRev11LateDeliveryContinuation,
} from './plan-rev11-late-delivery';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relativePath: string) =>
  fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
const state = JSON.parse(read('docs/BUILD_STATE.json')) as {
  planRevision: number;
  activeStageId: string | null;
  nextPermittedStageId: string | null;
  governance: {
    planAmendments: Array<{
      id: string;
      baselineCommit: string;
      deliveryAuthorization?: { authorized: boolean; evidencePath: string | null };
      lateDeliveryContinuation?: PlanRev11LateDeliveryContinuation;
    }>;
  };
  deployment: { deliveryBlockers: string[] };
};

const target = {
  amendmentId: 'PLAN-REV10',
  candidateCommit: '519f8b0cc3cb1da7d1cb75651940358b5722f9e9',
  attestationCommit: '4a22711bbb352d763298c6200768dc181662f80f',
  baselineCommit: '390b270c5d3127ff2705ffb114212a518a1d5953',
};

assert(state.planRevision >= 11);
assert.equal(state.activeStageId, null);
assert.equal(state.nextPermittedStageId, 'P8M');
const revision11 = state.governance.planAmendments.find(({ id }) => id === 'PLAN-REV11');
assert(revision11, 'PLAN-REV11 amendment record is required');
assert.equal(revision11.baselineCommit, target.baselineCommit);
assert.equal(revision11.deliveryAuthorization?.authorized, true);
assert.equal(revision11.deliveryAuthorization?.evidencePath, 'docs/evidence/PLAN-REV11.md');
assert(revision11.lateDeliveryContinuation, 'late-delivery continuation record is required');
assert.deepEqual(
  validatePlanRev11LateDelivery(revision11.lateDeliveryContinuation, target),
  [],
);
assert.deepEqual(
  revision11.lateDeliveryContinuation.authorizedEffects,
  PLAN_REV11_DELIVERY_EFFECTS,
);
assert.deepEqual(
  revision11.lateDeliveryContinuation.allowedContinuationPaths,
  PLAN_REV11_CONTINUATION_PATHS,
);
assert(
  !state.deployment.deliveryBlockers.includes(
    'PLAN-REV10-awaits-direct-push-pr-merge-preview-production-authority',
  ),
  'the satisfied Revision 10 permission blocker must be removed',
);

for (const mutation of [
  (copy: PlanRev11LateDeliveryContinuation) => {
    copy.targetCandidateCommit = 'a'.repeat(40);
  },
  (copy: PlanRev11LateDeliveryContinuation) => {
    copy.targetAttestationCommit = 'b'.repeat(40);
  },
  (copy: PlanRev11LateDeliveryContinuation) => {
    copy.authorizedEffects = copy.authorizedEffects.slice(0, -1);
  },
  (copy: PlanRev11LateDeliveryContinuation) => {
    copy.allowedContinuationPaths = [...copy.allowedContinuationPaths, 'web/src/app/page.tsx'];
  },
  (copy: PlanRev11LateDeliveryContinuation) => {
    copy.productOrDataChangeAuthorized = true;
  },
]) {
  const copy = structuredClone(revision11.lateDeliveryContinuation);
  mutation(copy);
  assert(validatePlanRev11LateDelivery(copy, target).length > 0);
}

for (const requiredText of [
  ['AGENTS.md', 'Plan Revision 11 late-delivery boundary'],
  ['docs/SCHOLARSHIP_SYSTEM_BUILD_PLAN.md', 'Late authority for an undelivered plan amendment'],
  ['docs/CURRENT_HANDOFF.md', 'Plan Revision 11 — Revision 10 late-delivery bridge'],
  ['docs/DECISIONS.md', 'D023'],
  ['docs/evidence/PLAN-REV11.md', 'zero spreadsheet/source/enrichment operations'],
  ['docs/kickoffs/PLAN-REV11-REV10-LATE-DELIVERY.md', 'Stop before P8M access'],
] as const) {
  assert(read(requiredText[0]).includes(requiredText[1]), `${requiredText[0]} missing ${requiredText[1]}`);
}

console.log('PLAN REV11 LATE DELIVERY TEST PASS exact target, authority, effects, and path boundary');
