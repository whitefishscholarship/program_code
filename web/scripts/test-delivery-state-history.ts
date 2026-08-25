import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  changedAcceptedIntegration,
  isExactHistoricalDeliveryState,
  type HistoricalDeliveryState,
} from './delivery-state-history';

type CandidateManifest = {
  candidateCommit: string;
};

type DeliveryIntegration = {
  stageId: string;
  status: string;
  stageCandidateCommit: string;
  deliveryBaselineCommit: string | null;
  manifestPath: string;
};

type CurrentBuildState = Omit<HistoricalDeliveryState, 'deployment'> & {
  deployment: {
    deliveryIntegrations?: DeliveryIntegration[];
    [key: string]: unknown;
  };
};

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..', '..');

function readJson<T>(relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), 'utf8')) as T;
}

function jsonAtCommit<T>(commit: string, relativePath: string): T {
  return JSON.parse(
    execFileSync('git', ['show', `${commit}:${relativePath}`], {
      cwd: repoRoot,
      encoding: 'utf8',
    }),
  ) as T;
}

const currentState = readJson<CurrentBuildState>('docs/BUILD_STATE.json');
const acceptedIntegrations = (currentState.deployment.deliveryIntegrations ?? []).filter(
  (integration) => integration.status === 'accepted',
);
assert.ok(acceptedIntegrations.length > 0, 'expected at least one historically accepted integration');

assert.equal(
  changedAcceptedIntegration(acceptedIntegrations, acceptedIntegrations),
  undefined,
  'exact accepted integration retention must pass',
);
assert.equal(
  changedAcceptedIntegration([], acceptedIntegrations),
  acceptedIntegrations[0].stageId,
  'deleting an accepted integration must fail',
);
const downgradedIntegrations = JSON.parse(JSON.stringify(acceptedIntegrations)) as DeliveryIntegration[];
downgradedIntegrations[0].status = 'authorized-pending';
downgradedIntegrations[0].deliveryBaselineCommit = null;
assert.equal(
  changedAcceptedIntegration(downgradedIntegrations, acceptedIntegrations),
  acceptedIntegrations[0].stageId,
  'downgrading an accepted integration must fail',
);
const reboundIntegrations = JSON.parse(JSON.stringify(acceptedIntegrations)) as DeliveryIntegration[];
reboundIntegrations[0].stageCandidateCommit = '0'.repeat(40);
assert.equal(
  changedAcceptedIntegration(reboundIntegrations, acceptedIntegrations),
  acceptedIntegrations[0].stageId,
  'rebinding an accepted integration must fail',
);

const canonicalPlan = fs.readFileSync(
  path.join(repoRoot, 'docs/SCHOLARSHIP_SYSTEM_BUILD_PLAN.md'),
  'utf8',
);
const canonicalPlanRevision = Number(/^Plan revision: (\d+)$/m.exec(canonicalPlan)?.[1] ?? 0);
assert.equal(
  canonicalPlanRevision,
  currentState.planRevision,
  'canonical plan revision must match BUILD_STATE',
);

for (const integration of acceptedIntegrations) {
  assert.match(integration.deliveryBaselineCommit ?? '', /^[0-9a-f]{40}$/);
  const manifest = readJson<CandidateManifest>(integration.manifestPath);
  const baselineState = jsonAtCommit<HistoricalDeliveryState>(
    integration.deliveryBaselineCommit!,
    'docs/BUILD_STATE.json',
  );
  const stageCandidateState = jsonAtCommit<HistoricalDeliveryState>(
    integration.stageCandidateCommit,
    'docs/BUILD_STATE.json',
  );
  const deliveredCandidateState = jsonAtCommit<HistoricalDeliveryState>(
    manifest.candidateCommit,
    'docs/BUILD_STATE.json',
  );

  assert.equal(
    isExactHistoricalDeliveryState(
      deliveredCandidateState,
      baselineState,
      stageCandidateState,
      integration.stageId,
      integration.deliveryBaselineCommit!,
    ),
    true,
    `${integration.stageId} historical delivery candidate must retain the exact derived transition`,
  );

  assert.equal(
    isExactHistoricalDeliveryState(
      currentState,
      baselineState,
      stageCandidateState,
      integration.stageId,
      integration.deliveryBaselineCommit!,
    ),
    false,
    `${integration.stageId} current BUILD_STATE must be allowed to evolve independently`,
  );

  const tamperedHistoricalState = JSON.parse(
    JSON.stringify(deliveredCandidateState),
  ) as HistoricalDeliveryState;
  tamperedHistoricalState.planRevision = -1;
  assert.equal(
    isExactHistoricalDeliveryState(
      tamperedHistoricalState,
      baselineState,
      stageCandidateState,
      integration.stageId,
      integration.deliveryBaselineCommit!,
    ),
    false,
    `${integration.stageId} historical delivery mutation must still be rejected`,
  );
}

console.log(
  `delivery state history: PASS (${acceptedIntegrations.length} accepted integration${acceptedIntegrations.length === 1 ? '' : 's'}; deletion/downgrade/rebind rejected)`,
);
