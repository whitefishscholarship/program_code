import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
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
  `delivery state history: PASS (${acceptedIntegrations.length} accepted integration${acceptedIntegrations.length === 1 ? '' : 's'})`,
);
