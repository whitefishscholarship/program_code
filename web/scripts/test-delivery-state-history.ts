import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  changedAcceptedIntegration,
  expectedDeliveryCandidateState,
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
const nonRegressionFixtureIntegrations = acceptedIntegrations.length > 1
  ? acceptedIntegrations
  : [
      acceptedIntegrations[0],
      {
        ...acceptedIntegrations[0],
        stageId: 'P2',
        stageCandidateCommit: '1'.repeat(40),
        deliveryBaselineCommit: '2'.repeat(40),
        manifestPath: 'docs/evidence/P2-delivery-manifest.json',
      },
    ];
assert.equal(
  changedAcceptedIntegration(
    nonRegressionFixtureIntegrations,
    nonRegressionFixtureIntegrations,
  ),
  undefined,
  'multiple exact accepted integration records must pass',
);
for (const integration of nonRegressionFixtureIntegrations) {
  const deletedIntegrations = nonRegressionFixtureIntegrations.filter(
    (item) => item.stageId !== integration.stageId,
  );
  assert.equal(
    changedAcceptedIntegration(deletedIntegrations, nonRegressionFixtureIntegrations),
    integration.stageId,
    `deleting accepted ${integration.stageId} integration must fail`,
  );

  const downgradedIntegrations = JSON.parse(
    JSON.stringify(nonRegressionFixtureIntegrations),
  ) as DeliveryIntegration[];
  const downgraded = downgradedIntegrations.find(
    (item) => item.stageId === integration.stageId,
  )!;
  downgraded.status = 'authorized-pending';
  downgraded.deliveryBaselineCommit = null;
  assert.equal(
    changedAcceptedIntegration(downgradedIntegrations, nonRegressionFixtureIntegrations),
    integration.stageId,
    `downgrading accepted ${integration.stageId} integration must fail`,
  );

  const reboundIntegrations = JSON.parse(
    JSON.stringify(nonRegressionFixtureIntegrations),
  ) as DeliveryIntegration[];
  const rebound = reboundIntegrations.find(
    (item) => item.stageId === integration.stageId,
  )!;
  rebound.stageCandidateCommit = '0'.repeat(40);
  assert.equal(
    changedAcceptedIntegration(reboundIntegrations, nonRegressionFixtureIntegrations),
    integration.stageId,
    `rebinding accepted ${integration.stageId} integration must fail`,
  );
}

const evolvedCurrentState = JSON.parse(JSON.stringify(currentState)) as CurrentBuildState;
evolvedCurrentState.planRevision = (currentState.planRevision ?? 0) + 1;
assert.equal(
  changedAcceptedIntegration(
    evolvedCurrentState.deployment.deliveryIntegrations ?? [],
    acceptedIntegrations,
  ),
  undefined,
  'non-integration current state may evolve while accepted integrations remain exact',
);

const pendingIntegration = (currentState.deployment.deliveryIntegrations ?? []).find(
  (integration) => integration.status === 'authorized-pending',
);
if (pendingIntegration) {
  const prospectiveBaseline = currentState as HistoricalDeliveryState;
  const prospectiveStageState = jsonAtCommit<HistoricalDeliveryState>(
    pendingIntegration.stageCandidateCommit,
    'docs/BUILD_STATE.json',
  );
  const prospectiveDeliveryBaseline = 'f'.repeat(40);
  const prospectiveCurrentState = expectedDeliveryCandidateState(
    prospectiveBaseline,
    prospectiveStageState,
    pendingIntegration.stageId,
    prospectiveDeliveryBaseline,
  );
  assert.equal(
    isExactHistoricalDeliveryState(
      prospectiveCurrentState,
      prospectiveBaseline,
      prospectiveStageState,
      pendingIntegration.stageId,
      prospectiveDeliveryBaseline,
    ),
    true,
    'the newest exact delivery state may also be the current BUILD_STATE',
  );
}

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
  `delivery state history: PASS (${acceptedIntegrations.length} accepted integration${acceptedIntegrations.length === 1 ? '' : 's'}; every deletion/downgrade/rebind rejected; latest equality and later evolution allowed)`,
);
