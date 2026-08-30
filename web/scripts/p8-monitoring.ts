import fs from 'node:fs';
import path from 'node:path';
import legacyRowsJson from '../fixtures/p7/legacy-api-data.json';
import scenarioJson from '../fixtures/p8/monitoring-scenarios.json';
import {
  DEFAULT_MONITORING_POLICY,
  FRESHNESS_POLICY,
  assertPrivacySafeArtifact,
  buildTestingSheetTargets,
  canonicalJson,
  deterministicRetryDelays,
  reconcileRecoveredRun,
  runMonitoring,
  sha256,
  verifyMonitoringReceipt,
  type LegacyTestingSheetRow,
  type MonitoringObservation,
  type ObservationKind,
} from '../src/lib/monitoring';

const webRoot = process.cwd();
const repoRoot = path.resolve(webRoot, '..');
const checkOnly = process.argv.includes('--check');
const scenarios = scenarioJson as {
  schemaVersion: number;
  stageId: string;
  testingSheet: {
    spreadsheetId: string;
    sheetName: string;
    acceptedRevisionId: string;
    sourceFixture: string;
    expectedRows: number;
    liveReadPerformed: false;
  };
  policy: typeof DEFAULT_MONITORING_POLICY;
  dryRuns: Array<{ runId: string; observedAt: string }>;
  failureScenarios: Array<{
    id: string;
    targetIndex: number;
    kind: ObservationKind;
    expectedDisposition: string;
  }>;
  partialRecovery: {
    runId: string;
    resumeRunId: string;
    observedAt: string;
    resumeObservedAt: string;
    stopAfter: number;
  };
  limitations: string;
};

if (scenarios.schemaVersion !== 1 || scenarios.stageId !== 'P8') throw new Error('P8 scenario contract is invalid');
if (canonicalJson(scenarios.policy) !== canonicalJson(DEFAULT_MONITORING_POLICY)) throw new Error('P8 fixture policy drifted from implementation');

const legacyRows = legacyRowsJson as LegacyTestingSheetRow[];
const targets = buildTestingSheetTargets(legacyRows);
if (targets.length !== scenarios.testingSheet.expectedRows) throw new Error('P8 testing-sheet row denominator changed');

const run = (runId: string, observedAt: string, observations?: MonitoringObservation[], startCursor?: number, stopAfter?: number) => runMonitoring({
  runId,
  observedAt,
  mode: 'dry_run',
  targets,
  observations,
  startCursor,
  stopAfter,
  spreadsheetId: scenarios.testingSheet.spreadsheetId,
  sheetName: scenarios.testingSheet.sheetName,
  spreadsheetRevisionId: scenarios.testingSheet.acceptedRevisionId,
});

const firstDryRun = run(scenarios.dryRuns[0].runId, scenarios.dryRuns[0].observedAt);
const secondDryRun = run(scenarios.dryRuns[1].runId, scenarios.dryRuns[1].observedAt);
if (!verifyMonitoringReceipt(firstDryRun) || !verifyMonitoringReceipt(secondDryRun)) throw new Error('P8 dry-run receipt integrity failed');
if (firstDryRun.status !== 'completed' || secondDryRun.status !== 'completed') throw new Error('P8 dry runs must complete');
if (firstDryRun.inputDigest !== secondDryRun.inputDigest || firstDryRun.resultDigest !== secondDryRun.resultDigest) {
  throw new Error('P8 consecutive dry runs do not reconcile');
}

const simulationRuns = scenarios.failureScenarios.map((scenario, index) => {
  const target = targets[scenario.targetIndex];
  if (!target) throw new Error(`P8 failure scenario ${scenario.id} selects a missing target`);
  const receipt = run(
    `p8-${scenario.id}`,
    `2026-08-30T00:${String(10 + index).padStart(2, '0')}:00.000Z`,
    [{
      targetId: target.targetId,
      kind: scenario.kind,
      finalUrl: scenario.kind === 'redirect' ? 'https://example.test/simulated-final-target' : undefined,
      detail: 'Synthetic P8 failure-mode fixture; not a public-source observation.',
      attempts: scenario.kind === 'timeout' || scenario.kind === 'bot_block' ? 3 : 1,
    }],
  );
  const result = receipt.results.find((item) => item.targetId === target.targetId);
  if (!result || result.disposition !== scenario.expectedDisposition || !result.requiresReview || result.acceptedFactMutation) {
    throw new Error(`P8 failure scenario ${scenario.id} violated its review-first boundary`);
  }
  return {
    id: scenario.id,
    observationKind: scenario.kind,
    targetId: target.targetId,
    disposition: result.disposition,
    severity: result.severity,
    requiresReview: result.requiresReview,
    acceptedFactMutation: result.acceptedFactMutation,
    attempts: result.attempts,
    retryDelaysMs: result.retryDelaysMs,
    receiptSha256: receipt.receiptSha256,
  };
});

const interrupted = run(
  scenarios.partialRecovery.runId,
  scenarios.partialRecovery.observedAt,
  undefined,
  0,
  scenarios.partialRecovery.stopAfter,
);
if (interrupted.status !== 'failed' || interrupted.nextCursor !== scenarios.partialRecovery.stopAfter) {
  throw new Error('P8 partial-run simulation did not retain its exact cursor');
}
const resumed = run(
  scenarios.partialRecovery.resumeRunId,
  scenarios.partialRecovery.resumeObservedAt,
  undefined,
  interrupted.nextCursor,
);
const recovery = reconcileRecoveredRun(interrupted, resumed, firstDryRun.receiptSha256);

const simulations = {
  schemaVersion: 1,
  stageId: 'P8',
  generatedAt: '2026-08-30T00:20:00.000Z',
  sourceMode: 'synthetic_failure_fixture',
  livePublicSourceObservations: 0,
  retryPolicy: {
    ...DEFAULT_MONITORING_POLICY,
    deterministicRetryDelaysMs: deterministicRetryDelays(),
  },
  scenarios: simulationRuns,
  counts: {
    simulated: simulationRuns.length,
    reviewRequired: simulationRuns.filter((item) => item.requiresReview).length,
    acceptedFactMutations: simulationRuns.filter((item) => item.acceptedFactMutation).length,
  },
  limitations: 'Synthetic outcomes exercise control behavior only and are not evidence about any public scholarship source.',
};

const recoveryArtifact = {
  ...recovery,
  generatedAt: '2026-08-30T00:21:00.000Z',
  interrupted: {
    runId: interrupted.runId,
    status: interrupted.status,
    processedCount: interrupted.processedCount,
    remainingCount: interrupted.remainingCount,
    nextCursor: interrupted.nextCursor,
    acceptedStatePublished: interrupted.publication.acceptedStatePublished,
    reviewQueuePublished: interrupted.publication.reviewQueuePublished,
  },
  resumed: {
    runId: resumed.runId,
    status: resumed.status,
    startCursor: resumed.startCursor,
    processedCount: resumed.processedCount,
    remainingCount: resumed.remainingCount,
    acceptedStatePublished: resumed.publication.acceptedStatePublished,
  },
};

const schedulePlan = {
  schemaVersion: 1,
  stageId: 'P8',
  enabled: false,
  activationAuthorized: false,
  executionMode: 'read_only_dry_run',
  proposedCadence: 'P1D',
  timezone: 'America/Denver',
  command: 'npm run p8:monitor:check',
  targetLimit: DEFAULT_MONITORING_POLICY.maxTargetsPerRun,
  rateLimit: {
    minimumRequestSpacingMs: DEFAULT_MONITORING_POLICY.minimumRequestSpacingMs,
    maximumAttemptsPerTarget: DEFAULT_MONITORING_POLICY.maxAttemptsPerTarget,
    maximumBackoffMs: DEFAULT_MONITORING_POLICY.maximumBackoffMs,
  },
  freshnessPolicy: FRESHNESS_POLICY,
  notificationMode: 'artifact_only',
  externalNotificationConfigured: false,
  reason: 'P8 defines and tests schedule-safe logic but has no authority to create, enable, or change a live schedule or deployment configuration.',
};

const privacyArtifact = {
  schemaVersion: 1,
  stageId: 'P8',
  checkedAt: '2026-08-30T00:22:00.000Z',
  artifactsChecked: [
    'docs/evidence/P8-dry-run-1.json',
    'docs/evidence/P8-dry-run-2.json',
    'docs/evidence/P8-simulations.json',
    'docs/evidence/P8-recovery.json',
    'docs/evidence/P8-report.json',
    'docs/evidence/P8-schedule-plan.json',
  ],
  publicFieldsOnly: true,
  personalDataPresent: false,
  sensitiveAuthMaterialPresent: false,
  rawSummaryTextPresent: false,
  externalNotificationsSent: 0,
  spreadsheetWrites: 0,
  productionSpreadsheetAccesses: 0,
};

const reportBody = {
  schemaVersion: 1,
  stageId: 'P8',
  generatedAt: '2026-08-30T00:23:00.000Z',
  testingSheet: scenarios.testingSheet,
  targetDenominator: targets.length,
  inputDigest: firstDryRun.inputDigest,
  consecutiveDryRuns: {
    receipts: [firstDryRun.receiptSha256, secondDryRun.receiptSha256],
    completed: 2,
    eachProcessed: targets.length,
    duplicateCount: firstDryRun.duplicateCount + secondDryRun.duplicateCount,
    lostCount: firstDryRun.remainingCount + secondDryRun.remainingCount,
    resultDigestMatch: firstDryRun.resultDigest === secondDryRun.resultDigest,
    acceptedFactMutations: 0,
  },
  failureSimulations: simulations.counts,
  recovery: {
    recoveryCompleted: recovery.recoveryCompleted,
    duplicateCount: recovery.duplicateCount,
    lostCount: recovery.lostCount,
    acceptedFactsChanged: recovery.acceptedFactsChanged,
  },
  scheduleEnabled: false,
  externalNotificationsSent: 0,
  limitations: scenarios.limitations,
};
const report = { ...reportBody, reportSha256: sha256(canonicalJson(reportBody)) };

for (const artifact of [firstDryRun, secondDryRun, simulations, recoveryArtifact, schedulePlan, privacyArtifact, report]) {
  assertPrivacySafeArtifact(artifact);
}

const outputs: Array<[string, unknown]> = [
  ['docs/evidence/P8-dry-run-1.json', firstDryRun],
  ['docs/evidence/P8-dry-run-2.json', secondDryRun],
  ['docs/evidence/P8-simulations.json', simulations],
  ['docs/evidence/P8-recovery.json', recoveryArtifact],
  ['docs/evidence/P8-schedule-plan.json', schedulePlan],
  ['docs/evidence/P8-privacy.json', privacyArtifact],
  ['docs/evidence/P8-report.json', report],
];

for (const [relativePath, value] of outputs) {
  const absolutePath = path.join(repoRoot, relativePath);
  const serialized = `${JSON.stringify(value, null, 2)}\n`;
  if (checkOnly) {
    if (!fs.existsSync(absolutePath)) throw new Error(`${relativePath} is missing`);
    if (fs.readFileSync(absolutePath, 'utf8') !== serialized) throw new Error(`${relativePath} is stale or non-deterministic`);
  } else {
    fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
    fs.writeFileSync(absolutePath, serialized);
  }
}

console.log(`P8 monitoring ${checkOnly ? 'check' : 'generation'} passed: dryRuns=2 targets=${targets.length} simulations=${simulationRuns.length} recovery=${recovery.recoveryCompleted ? 'complete' : 'failed'} schedule=disabled.`);
