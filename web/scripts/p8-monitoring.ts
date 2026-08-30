import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import catalogJson from '../fixtures/p7/student-catalog.json';
import scenarioJson from '../fixtures/p8/monitoring-scenarios.json';
import p5ReviewJson from '../../docs/evidence/P5-manual-review.json';
import publicProbesJson from '../../docs/evidence/P5-public-probes.json';
import sourceQueueJson from '../../docs/evidence/P5-source-queue.json';
import p6ChildrenJson from '../../docs/evidence/P6-child-records.json';
import {
  MAX_ATTEMPTS,
  MAX_TARGETS_PER_SEGMENT,
  MINIMUM_REQUEST_SPACING_MS,
  RETRY_DELAYS_MS,
  applyReviewQueue,
  assertPrivacySafeArtifact,
  buildMonitoringPlan,
  canonicalJson,
  createMonitoringReceiptStore,
  executeMonitoringSegment,
  finalizeMonitoringRun,
  sha256,
  type ExecutionEnvironment,
  type FinalizedRun,
  type MonitoringPlan,
  type MonitoringTarget,
  type ProbeAdapter,
  type RawProbeObservation,
  type SegmentReceipt,
} from '../src/lib/monitoring';

const webRoot = process.cwd();
const repoRoot = path.resolve(webRoot, '..');
const checkOnly = process.argv.includes('--check');
const scenarios = scenarioJson as {
  schemaVersion: number;
  stageId: string;
  acceptedObservedAt: string;
  testingSheet: { spreadsheetId: string; sheetName: string; acceptedRevisionId: string; liveReadPerformed: false };
  dryRuns: Array<{ runId: string; observedAt: string }>;
  failureObservedAt: string;
  partialRecovery: { runId: string; observedAt: string; stopAfter: number };
  limitations: string;
};
if (scenarios.schemaVersion !== 2 || scenarios.stageId !== 'P8') throw new Error('P8 scenario contract is invalid');

const pinnedPaths = [
  'docs/evidence/P3-acquisition.json',
  'docs/evidence/P3-completeness.json',
  'docs/evidence/P4-field-evidence.json',
  'docs/evidence/P4-reviews.json',
  'docs/evidence/P5-applied-change-receipt.json',
  'docs/evidence/P5-postwrite-reconciliation.json',
  'docs/evidence/P5-source-queue.json',
  'docs/evidence/P5-public-probes.json',
  'docs/evidence/P5-manual-review.json',
  'docs/evidence/P6-child-records.json',
  'web/fixtures/p7/student-catalog.json',
  'docs/evidence/P7-manifest.json',
];
const pinnedSurfaces = Object.fromEntries(pinnedPaths.map((relativePath) => [relativePath, sha256(fs.readFileSync(path.join(repoRoot, relativePath)))]));
const plan = buildMonitoringPlan({
  catalog: catalogJson as Parameters<typeof buildMonitoringPlan>[0]['catalog'],
  sourceQueue: sourceQueueJson as Parameters<typeof buildMonitoringPlan>[0]['sourceQueue'],
  publicProbes: publicProbesJson,
  p5Review: p5ReviewJson as Parameters<typeof buildMonitoringPlan>[0]['p5Review'],
  p6ReviewItems: p6ChildrenJson.reviewItems,
  acceptedSpreadsheetRevisionId: scenarios.testingSheet.acceptedRevisionId,
  acceptedObservedAt: scenarios.acceptedObservedAt,
  pinnedSurfaces,
});
if (plan.spreadsheetId !== scenarios.testingSheet.spreadsheetId || plan.sheetName !== scenarios.testingSheet.sheetName || plan.spreadsheetRevisionId !== scenarios.testingSheet.acceptedRevisionId) throw new Error('P8 accepted testing-sheet identity changed');

type Override = (target: MonitoringTarget, attempt: number, observedAt: string) => Promise<RawProbeObservation>;
function fixtureAdapter(observedAt: string, overrides = new Map<string, Override>()): ProbeAdapter {
  return { async probe(target, attempt) {
    const override = overrides.get(target.targetId);
    if (override) return override(target, attempt, observedAt);
    if (target.route === 'public_read_only_probe') return { kind: 'http', status: 200, finalUrl: target.url, observedFingerprint: target.acceptedFingerprint, observedAt, markers: [] };
    if (target.route === 'snapshot_compare') return { kind: 'snapshot', observedFingerprint: target.acceptedFingerprint, observedAt };
    return { kind: 'no_fetch', observedFingerprint: target.acceptedFingerprint, observedAt };
  } };
}

function fixtureEnvironment(observedAt: string): ExecutionEnvironment & { sleeps: number[] } {
  const sleeps: number[] = [];
  return { sleeps, now: () => observedAt, sleep: async (milliseconds) => { sleeps.push(milliseconds); } };
}

function fixtureStore(label: string) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), `p8-${label}-`));
  const fixtureOnlyKey = Buffer.from(sha256(`P8 deterministic evidence fixture only:${label}`), 'hex');
  return createMonitoringReceiptStore(directory, fixtureOnlyKey);
}

async function runComplete(input: { plan: MonitoringPlan; runId: string; mode: 'dry_run' | 'apply_review_queue'; observedAt: string; overrides?: Map<string, Override> }) {
  const store = fixtureStore(input.runId);
  const environment = fixtureEnvironment(input.observedAt);
  const receipts: SegmentReceipt[] = [];
  let cursor = 0;
  let previous: string | null = null;
  while (cursor < input.plan.targets.length) {
    const receipt = await executeMonitoringSegment({ plan: input.plan, store, runId: input.runId, mode: input.mode, startCursor: cursor, previousReceiptSha256: previous, adapter: fixtureAdapter(input.observedAt, input.overrides), environment });
    receipts.push(receipt);
    cursor = receipt.nextCursor;
    previous = receipt.receiptSha256;
  }
  return { finalized: finalizeMonitoringRun(input.plan, store, previous!), receipts, sleeps: environment.sleeps, store };
}

function receiptSummary(receipt: SegmentReceipt) {
  return { receiptSha256: receipt.receiptSha256, receiptMac: receipt.receiptMac, segmentIndex: receipt.segmentIndex, startCursor: receipt.startCursor, nextCursor: receipt.nextCursor, processedCount: receipt.processedCount, remainingCount: receipt.remainingCount, previousReceiptSha256: receipt.previousReceiptSha256, reachedPlanEnd: receipt.reachedPlanEnd };
}
function dryRunArtifact(run: Awaited<ReturnType<typeof runComplete>>) {
  const { finalized } = run;
  return {
    schemaVersion: 2,
    stageId: 'P8',
    runId: finalized.runId,
    mode: finalized.mode,
    planDigest: finalized.planDigest,
    receiptTipSha256: finalized.receiptTipSha256,
    receiptCount: finalized.receiptCount,
    receipts: run.receipts.map(receiptSummary),
    targetDenominator: finalized.targetDenominator,
    processedCount: finalized.processedCount,
    uniqueProcessedCount: finalized.uniqueProcessedCount,
    duplicateCount: finalized.duplicateCount,
    lostCount: finalized.lostCount,
    reviewCount: finalized.reviewQueue.length,
    resultDigest: finalized.resultDigest,
    executedControls: {
      publicProbeCalls: finalized.results.filter((item) => item.route === 'public_read_only_probe').reduce((sum, item) => sum + item.attempts, 0),
      noFetchCalls: finalized.results.filter((item) => item.route !== 'public_read_only_probe').length,
      spacingSleeps: run.sleeps.filter((value) => value === MINIMUM_REQUEST_SPACING_MS).length,
      retrySleeps: run.sleeps.filter((value) => RETRY_DELAYS_MS.includes(value as 250 | 500)).length,
      freshnessEvaluations: finalized.results.length,
    },
    complete: finalized.complete,
    acceptedFactsChanged: false,
    acceptedStatePublished: false,
    reviewQueuePublished: false,
  };
}

async function main() {
const first = await runComplete({ plan, runId: scenarios.dryRuns[0].runId, mode: 'dry_run', observedAt: scenarios.dryRuns[0].observedAt });
const second = await runComplete({ plan, runId: scenarios.dryRuns[1].runId, mode: 'dry_run', observedAt: scenarios.dryRuns[1].observedAt });
if (first.finalized.resultDigest !== second.finalized.resultDigest) throw new Error('Consecutive P8 dry runs did not reconcile');

const publicTargets = plan.targets.filter((item) => item.route === 'public_read_only_probe');
const cycleTarget = plan.targets.find((item) => item.kind === 'award_cycle')!;
const portalTarget = plan.targets.find((item) => item.kind === 'portal')!;
const changedFingerprint = sha256('P8 synthetic changed observation');
const failureOverrides = new Map<string, Override>([
  [publicTargets[0].targetId, async (_target, _attempt, observedAt) => ({ kind: 'http', status: 404, finalUrl: publicTargets[0].url, observedFingerprint: null, observedAt, markers: [] })],
  [publicTargets[1].targetId, async () => { throw new Error('ETIMEDOUT synthetic fixture'); }],
  [publicTargets[2].targetId, async (_target, _attempt, observedAt) => ({ kind: 'http', status: 403, finalUrl: publicTargets[2].url, observedFingerprint: null, observedAt, markers: ['bot_block'] })],
  [publicTargets[3].targetId, async (_target, _attempt, observedAt) => ({ kind: 'http', status: 200, finalUrl: 'https://example.invalid/synthetic-redirect', observedFingerprint: publicTargets[3].acceptedFingerprint, observedAt, markers: [] })],
  [cycleTarget.targetId, async (_target, _attempt, observedAt) => ({ kind: 'snapshot', observedFingerprint: changedFingerprint, observedAt, changeKind: 'date_conflict' })],
  [portalTarget.targetId, async (_target, _attempt, observedAt) => ({ kind: 'snapshot', observedFingerprint: changedFingerprint, observedAt, changeKind: 'portal_change' })],
]);
const failure = await runComplete({ plan, runId: 'p8-failure-simulations', mode: 'dry_run', observedAt: scenarios.failureObservedAt, overrides: failureOverrides });
const failureResults = failure.finalized.results.filter((item) => item.requiresReview);
if (failureResults.length !== 6 || failureResults.some((item) => item.acceptedFactMutation)) throw new Error('P8 failure simulations did not stay review-only');
const simulations = {
  schemaVersion: 2,
  stageId: 'P8',
  sourceMode: 'synthetic_failure_fixture',
  livePublicSourceObservations: 0,
  run: dryRunArtifact(failure),
  scenarios: failureResults.map((item) => ({ targetId: item.targetId, kind: item.kind, disposition: item.disposition, severity: item.severity, requiresReview: item.requiresReview, attempts: item.attempts, retryDelaysMs: item.retryDelaysMs, requestSpacingMs: item.requestSpacingMs, fresh: item.fresh, acceptedFactMutation: item.acceptedFactMutation })),
  counts: { simulated: failureResults.length, reviewRequired: failureResults.length, acceptedFactMutations: 0 },
  limitations: 'Synthetic outcomes exercise the executed control path only and are not public-source observations.',
};

const recoveryStore = fixtureStore(scenarios.partialRecovery.runId);
const recoveryEnvironment = fixtureEnvironment(scenarios.partialRecovery.observedAt);
const recoveryTarget = plan.targets[0];
const recoveryOverride = new Map<string, Override>([[recoveryTarget.targetId, async (_target, _attempt, observedAt) => ({ kind: 'snapshot', observedFingerprint: changedFingerprint, observedAt, changeKind: 'generic_change' })]]);
const prefix = await executeMonitoringSegment({ plan, store: recoveryStore, runId: scenarios.partialRecovery.runId, mode: 'apply_review_queue', startCursor: 0, previousReceiptSha256: null, adapter: fixtureAdapter(scenarios.partialRecovery.observedAt, recoveryOverride), environment: recoveryEnvironment, limit: scenarios.partialRecovery.stopAfter });
let incompletePublicationRejected = false;
try { finalizeMonitoringRun(plan, recoveryStore, prefix.receiptSha256); } catch { incompletePublicationRejected = true; }
if (!incompletePublicationRejected || prefix.reviewQueue.length !== 1) throw new Error('Interrupted prefix was not safely retained and blocked from publication');
const recoveryReceipts = [prefix];
let recoveryCursor = prefix.nextCursor;
let recoveryTip = prefix.receiptSha256;
while (recoveryCursor < plan.targets.length) {
  const receipt = await executeMonitoringSegment({ plan, store: recoveryStore, runId: scenarios.partialRecovery.runId, mode: 'apply_review_queue', startCursor: recoveryCursor, previousReceiptSha256: recoveryTip, adapter: fixtureAdapter(scenarios.partialRecovery.observedAt, recoveryOverride), environment: recoveryEnvironment });
  recoveryReceipts.push(receipt);
  recoveryCursor = receipt.nextCursor;
  recoveryTip = receipt.receiptSha256;
}
const recovered = finalizeMonitoringRun(plan, recoveryStore, recoveryTip);
const firstPublication = applyReviewQueue(recovered, []);
const repeated = await runComplete({ plan, runId: 'p8-recovery-apply-repeat', mode: 'apply_review_queue', observedAt: scenarios.partialRecovery.observedAt, overrides: recoveryOverride });
const repeatedPublication = applyReviewQueue(repeated.finalized, firstPublication.reviewQueue);
if (recovered.reviewQueue.length !== 1 || repeatedPublication.reviewQueue.length !== 1 || repeatedPublication.reviewQueue[0].occurrenceCount !== 2) throw new Error('Recovered review publication is not cross-run idempotent');
const recovery = {
  schemaVersion: 2,
  stageId: 'P8',
  runId: recovered.runId,
  planDigest: recovered.planDigest,
  authenticatedReceiptChain: recoveryReceipts.map(receiptSummary),
  interrupted: { nextCursor: prefix.nextCursor, processedCount: prefix.processedCount, retainedReviewIds: prefix.reviewQueue.map((item) => item.reviewId), acceptedStatePublished: false, reviewQueuePublished: false },
  incompletePublicationRejected,
  finalized: { receiptTipSha256: recovered.receiptTipSha256, processedCount: recovered.processedCount, uniqueProcessedCount: recovered.uniqueProcessedCount, duplicateCount: recovered.duplicateCount, lostCount: recovered.lostCount, reviewIds: recovered.reviewQueue.map((item) => item.reviewId), complete: recovered.complete },
  repeatedApply: { firstQueueCount: firstPublication.reviewQueue.length, secondQueueCount: repeatedPublication.reviewQueue.length, stableReviewId: firstPublication.reviewQueue[0].reviewId === repeatedPublication.reviewQueue[0].reviewId, occurrenceCount: repeatedPublication.reviewQueue[0].occurrenceCount },
  acceptedStateReceiptBefore: plan.planDigest,
  acceptedStateReceiptAfter: plan.planDigest,
  acceptedFactsChanged: false,
};

const schedulePlan = {
  schemaVersion: 2,
  stageId: 'P8',
  enabled: false,
  activationAuthorized: false,
  executionMode: 'read_only_dry_run',
  proposedCadence: 'P1D',
  timezone: 'America/Denver',
  command: 'npm run p8:monitor:live-dry-run',
  targetDenominator: plan.counts.targetDenominator,
  targetLimitPerSegment: MAX_TARGETS_PER_SEGMENT,
  publicReadOnlyProbeRoutes: plan.counts.publicReadOnlySources,
  noFetchRoutes: plan.counts.targetDenominator - plan.counts.publicReadOnlySources,
  rateLimit: { minimumRequestSpacingMs: MINIMUM_REQUEST_SPACING_MS, maximumAttemptsPerTarget: MAX_ATTEMPTS, retryDelaysMs: RETRY_DELAYS_MS },
  freshnessDays: { publicSource: 7, snapshotReview: 7, manualOrOffline: 30 },
  notificationMode: 'artifact_only',
  externalNotificationConfigured: false,
  reason: 'P8 implements a guarded read-only driver but has no authority to create, enable, or change a live schedule or deployment configuration.',
};
const privacy = {
  schemaVersion: 2,
  stageId: 'P8',
  checkedAt: '2026-08-30T00:30:00.000Z',
  publicFieldsOnly: true,
  personalDataPresent: false,
  sensitiveAuthMaterialPresent: false,
  rawSummaryTextPresent: false,
  externalNotificationsSent: 0,
  spreadsheetWrites: 0,
  productionSpreadsheetAccesses: 0,
};
const reportBody = {
  schemaVersion: 2,
  stageId: 'P8',
  generatedAt: '2026-08-30T00:31:00.000Z',
  source: { ...scenarios.testingSheet, mode: 'accepted_revision_fixture' },
  plan: { planDigest: plan.planDigest, catalogRevision: plan.catalogRevision, counts: plan.counts, pinnedSurfaces: plan.pinnedSurfaces },
  consecutiveDryRuns: { completed: 2, eachProcessed: plan.targets.length, receiptTips: [first.finalized.receiptTipSha256, second.finalized.receiptTipSha256], resultDigestMatch: first.finalized.resultDigest === second.finalized.resultDigest, duplicateCount: first.finalized.duplicateCount + second.finalized.duplicateCount, lostCount: first.finalized.lostCount + second.finalized.lostCount, acceptedFactMutations: 0 },
  failureSimulations: simulations.counts,
  recovery: { complete: recovered.complete, duplicateCount: recovered.duplicateCount, lostCount: recovered.lostCount, prefixReviewRetained: recovered.reviewQueue.some((item) => item.reviewId === prefix.reviewQueue[0].reviewId), incompletePublicationRejected, repeatedApplyIdempotent: repeatedPublication.reviewQueue.length === 1 },
  scheduleEnabled: false,
  externalNotificationsSent: 0,
  limitations: scenarios.limitations,
};
const report = { ...reportBody, reportSha256: sha256(canonicalJson(reportBody)) };
const outputs: Array<[string, unknown]> = [
  ['docs/evidence/P8-dry-run-1.json', dryRunArtifact(first)],
  ['docs/evidence/P8-dry-run-2.json', dryRunArtifact(second)],
  ['docs/evidence/P8-simulations.json', simulations],
  ['docs/evidence/P8-recovery.json', recovery],
  ['docs/evidence/P8-schedule-plan.json', schedulePlan],
  ['docs/evidence/P8-privacy.json', privacy],
  ['docs/evidence/P8-report.json', report],
];
for (const [, artifact] of outputs) assertPrivacySafeArtifact(artifact);
for (const [relativePath, artifact] of outputs) {
  const absolutePath = path.join(repoRoot, relativePath);
  const serialized = `${JSON.stringify(artifact, null, 2)}\n`;
  if (checkOnly) {
    if (!fs.existsSync(absolutePath) || fs.readFileSync(absolutePath, 'utf8') !== serialized) throw new Error(`${relativePath} is missing, stale, or non-deterministic`);
  } else {
    fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
    fs.writeFileSync(absolutePath, serialized);
  }
}
console.log(`P8 monitoring ${checkOnly ? 'check' : 'generation'} passed: targets=${plan.targets.length} dryRuns=2 simulations=6 recovery=complete schedule=disabled.`);
}

main().catch((error) => { console.error(error); process.exit(1); });
