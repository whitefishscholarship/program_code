import assert from 'node:assert/strict';
import dryRunOneJson from '../../docs/evidence/P8-dry-run-1.json';
import dryRunTwoJson from '../../docs/evidence/P8-dry-run-2.json';
import privacyJson from '../../docs/evidence/P8-privacy.json';
import recoveryJson from '../../docs/evidence/P8-recovery.json';
import reportJson from '../../docs/evidence/P8-report.json';
import scheduleJson from '../../docs/evidence/P8-schedule-plan.json';
import simulationsJson from '../../docs/evidence/P8-simulations.json';
import legacyRowsJson from '../fixtures/p7/legacy-api-data.json';
import {
  DEFAULT_MONITORING_POLICY,
  FRESHNESS_POLICY,
  assertPrivacySafeArtifact,
  buildTestingSheetTargets,
  deterministicRetryDelays,
  plannedRequestOffsets,
  runMonitoring,
  verifyMonitoringReceipt,
  type LegacyTestingSheetRow,
  type MonitoringRunReceipt,
} from '../src/lib/monitoring';

const targets = buildTestingSheetTargets(legacyRowsJson as LegacyTestingSheetRow[]);
assert.equal(targets.length, 197, 'P8 must monitor the exact accepted testing-sheet row denominator');
assert.equal(new Set(targets.map((target) => target.targetId)).size, 197, 'P8 target identities must be unique');
assert.equal(new Set(targets.map((target) => target.sheetRow)).size, 197, 'P8 sheet rows must not duplicate');
assert.deepEqual(deterministicRetryDelays(), [250, 500], 'P8 retries must be deterministic and bounded');
assert(DEFAULT_MONITORING_POLICY.minimumRequestSpacingMs > 0, 'P8 must impose an explicit request-spacing floor');
assert.deepEqual(plannedRequestOffsets(3), [0, 100, 200], 'P8 request spacing must be deterministic');
assert.equal(FRESHNESS_POLICY.futureDatedEvidenceIsFresh, false, 'future-dated evidence must never pass freshness');

const first = dryRunOneJson as MonitoringRunReceipt;
const second = dryRunTwoJson as MonitoringRunReceipt;
for (const receipt of [first, second]) {
  assert(verifyMonitoringReceipt(receipt), `${receipt.runId} receipt digest must verify`);
  assert.equal(receipt.status, 'completed');
  assert.equal(receipt.targetDenominator, 197);
  assert.equal(receipt.processedCount, 197);
  assert.equal(receipt.uniqueProcessedCount, 197);
  assert.equal(receipt.duplicateCount, 0);
  assert.equal(receipt.remainingCount, 0);
  assert.equal(receipt.reviewQueue.length, 0);
  assert.equal(receipt.publication.acceptedStatePublished, false);
  assert.equal(receipt.publication.acceptedFactsChanged, false);
  assert.equal(receipt.publication.reviewQueuePublished, false);
  assert.equal(receipt.source.spreadsheetRevisionId, '223');
  assert.equal(receipt.source.liveReadPerformed, false);
  assert.equal(receipt.rateLimitPlan.plannedRequests, 197);
  assert.equal(receipt.rateLimitPlan.lastOffsetMs, 19_600);
}
assert.equal(first.inputDigest, second.inputDigest, 'consecutive dry runs must bind the same input');
assert.equal(first.resultDigest, second.resultDigest, 'consecutive dry runs must reconcile to the same result');

const tampered = { ...first, processedCount: 196 };
assert.equal(verifyMonitoringReceipt(tampered), false, 'receipt tampering must be detected');

const simulations = simulationsJson as {
  counts: { simulated: number; reviewRequired: number; acceptedFactMutations: number };
  retryPolicy: { deterministicRetryDelaysMs: number[] };
  scenarios: Array<{ observationKind: string; disposition: string; requiresReview: boolean; acceptedFactMutation: boolean; attempts: number; retryDelaysMs: number[] }>;
};
assert.equal(simulations.counts.simulated, 6);
assert.equal(simulations.counts.reviewRequired, 6);
assert.equal(simulations.counts.acceptedFactMutations, 0);
assert.deepEqual(simulations.retryPolicy.deterministicRetryDelaysMs, [250, 500]);
assert.deepEqual(new Set(simulations.scenarios.map((item) => item.observationKind)), new Set([
  'not_found', 'timeout', 'bot_block', 'redirect', 'date_conflict', 'portal_change',
]));
assert(simulations.scenarios.every((item) => item.requiresReview && !item.acceptedFactMutation));
assert(simulations.scenarios.filter((item) => ['timeout', 'bot_block'].includes(item.observationKind))
  .every((item) => item.attempts === 3 && JSON.stringify(item.retryDelaysMs) === JSON.stringify([250, 500])));

const failedApply = runMonitoring({
  runId: 'test-failed-apply',
  observedAt: '2026-08-30T01:00:00.000Z',
  mode: 'apply_review_queue',
  targets,
  stopAfter: 1,
  spreadsheetId: first.source.spreadsheetId,
  sheetName: first.source.sheetName,
  spreadsheetRevisionId: first.source.spreadsheetRevisionId,
});
assert.equal(failedApply.status, 'failed');
assert.equal(failedApply.publication.acceptedStatePublished, false);
assert.equal(failedApply.publication.reviewQueuePublished, false, 'failed runs cannot partially publish the review queue');

const completedApply = runMonitoring({
  runId: 'test-completed-apply',
  observedAt: '2026-08-30T01:01:00.000Z',
  mode: 'apply_review_queue',
  targets,
  observations: [{ targetId: targets[0].targetId, kind: 'date_conflict' }],
  spreadsheetId: first.source.spreadsheetId,
  sheetName: first.source.sheetName,
  spreadsheetRevisionId: first.source.spreadsheetRevisionId,
});
assert.equal(completedApply.status, 'completed');
assert.equal(completedApply.reviewQueue.length, 1);
assert.equal(completedApply.publication.reviewQueuePublished, true, 'apply mode may publish only a complete local review queue');
assert.equal(completedApply.publication.acceptedStatePublished, false);
assert.equal(completedApply.publication.acceptedFactsChanged, false);

const recovery = recoveryJson as {
  targetDenominator: number;
  processedCount: number;
  uniqueProcessedCount: number;
  duplicateCount: number;
  lostCount: number;
  recoveryCompleted: boolean;
  acceptedStateReceiptBefore: string;
  acceptedStateReceiptAfter: string;
  acceptedFactsChanged: boolean;
  interrupted: { status: string; nextCursor: number; acceptedStatePublished: boolean; reviewQueuePublished: boolean };
  resumed: { status: string; startCursor: number; acceptedStatePublished: boolean };
};
assert.equal(recovery.targetDenominator, 197);
assert.equal(recovery.processedCount, 197);
assert.equal(recovery.uniqueProcessedCount, 197);
assert.equal(recovery.duplicateCount, 0);
assert.equal(recovery.lostCount, 0);
assert.equal(recovery.recoveryCompleted, true);
assert.equal(recovery.acceptedStateReceiptBefore, recovery.acceptedStateReceiptAfter);
assert.equal(recovery.acceptedFactsChanged, false);
assert.equal(recovery.interrupted.status, 'failed');
assert.equal(recovery.interrupted.nextCursor, recovery.resumed.startCursor);
assert.equal(recovery.interrupted.acceptedStatePublished, false);
assert.equal(recovery.interrupted.reviewQueuePublished, false);
assert.equal(recovery.resumed.acceptedStatePublished, false);

assert.equal(scheduleJson.enabled, false, 'P8 must not enable a live schedule');
assert.equal(scheduleJson.activationAuthorized, false, 'P8 has no live-schedule authority');
assert.equal(scheduleJson.externalNotificationConfigured, false);
assert.equal(scheduleJson.freshnessPolicy.futureDatedEvidenceIsFresh, false);
assert.equal(privacyJson.personalDataPresent, false);
assert.equal(privacyJson.sensitiveAuthMaterialPresent, false);
assert.equal(privacyJson.spreadsheetWrites, 0);
assert.equal(privacyJson.productionSpreadsheetAccesses, 0);
assert.equal(reportJson.consecutiveDryRuns.completed, 2);
assert.equal(reportJson.consecutiveDryRuns.duplicateCount, 0);
assert.equal(reportJson.consecutiveDryRuns.lostCount, 0);
assert.equal(reportJson.consecutiveDryRuns.resultDigestMatch, true);
assert.equal(reportJson.scheduleEnabled, false);

for (const artifact of [first, second, simulationsJson, recoveryJson, scheduleJson, privacyJson, reportJson]) {
  assert.doesNotThrow(() => assertPrivacySafeArtifact(artifact));
}

console.log('P8 monitoring, idempotency, retry, failure, recovery, schedule-boundary, and privacy tests passed.');
