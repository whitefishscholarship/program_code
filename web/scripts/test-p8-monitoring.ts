import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import catalogJson from '../fixtures/p7/student-catalog.json';
import p5ReviewJson from '../../docs/evidence/P5-manual-review.json';
import publicProbesJson from '../../docs/evidence/P5-public-probes.json';
import sourceQueueJson from '../../docs/evidence/P5-source-queue.json';
import p6ChildrenJson from '../../docs/evidence/P6-child-records.json';
import dryRunOneJson from '../../docs/evidence/P8-dry-run-1.json';
import dryRunTwoJson from '../../docs/evidence/P8-dry-run-2.json';
import privacyJson from '../../docs/evidence/P8-privacy.json';
import recoveryJson from '../../docs/evidence/P8-recovery.json';
import reportJson from '../../docs/evidence/P8-report.json';
import scheduleJson from '../../docs/evidence/P8-schedule-plan.json';
import simulationsJson from '../../docs/evidence/P8-simulations.json';
import {
  MAX_TARGETS_PER_SEGMENT,
  MINIMUM_REQUEST_SPACING_MS,
  RETRY_DELAYS_MS,
  applyReviewQueue,
  acceptedNonPublicObservation,
  assertPrivacySafeArtifact,
  buildMonitoringPlan,
  createMonitoringReceiptStore,
  evaluateFreshness,
  executeMonitoringSegment,
  finalizeMonitoringRun,
  sha256,
  type ExecutionEnvironment,
  type MonitoringPlan,
  type MonitoringTarget,
  type ProbeAdapter,
  type RawProbeObservation,
} from '../src/lib/monitoring';

const repoRoot = path.resolve(process.cwd(), '..');
const pinned = ['docs/evidence/P3-acquisition.json', 'docs/evidence/P3-completeness.json', 'docs/evidence/P4-field-evidence.json', 'docs/evidence/P4-reviews.json', 'docs/evidence/P5-applied-change-receipt.json', 'docs/evidence/P5-postwrite-reconciliation.json', 'docs/evidence/P5-source-queue.json', 'docs/evidence/P5-public-probes.json', 'docs/evidence/P5-manual-review.json', 'docs/evidence/P6-child-records.json', 'web/fixtures/p7/student-catalog.json', 'docs/evidence/P7-manifest.json'];
const plan = buildMonitoringPlan({
  catalog: catalogJson as Parameters<typeof buildMonitoringPlan>[0]['catalog'],
  sourceQueue: sourceQueueJson as Parameters<typeof buildMonitoringPlan>[0]['sourceQueue'],
  publicProbes: publicProbesJson,
  p5Review: p5ReviewJson as Parameters<typeof buildMonitoringPlan>[0]['p5Review'],
  p6ReviewItems: p6ChildrenJson.reviewItems,
  acceptedSpreadsheetRevisionId: '223',
  acceptedObservedAt: '2026-08-29T21:25:30.000Z',
  pinnedSurfaces: Object.fromEntries(pinned.map((item) => [item, sha256(fs.readFileSync(path.join(repoRoot, item)))])),
});
assert.deepEqual(plan.counts, { sources: 217, sourceRoutes: 213, publicReadOnlySources: 50, manualNoFetchSources: 163, offlineSources: 7, awards: 192, cycles: 192, portals: 21, applicationGroups: 4, p5ReviewItems: 187, p6ReviewItems: 2, targetDenominator: 1028 });
assert.equal(new Set(plan.targets.map((item) => item.targetId)).size, 1028);
assert.equal(plan.targets.filter((item) => item.url !== null && item.route !== 'public_read_only_probe').length, 163, 'manual/application-like URLs must remain no-fetch');
assert.equal(plan.targets.filter((item) => item.route === 'public_read_only_probe').every((item) => item.kind === 'source_route'), true);
assert.equal(Object.keys(plan.pinnedSurfaces).length, 12, 'P3-P7 trust surfaces must be pinned');
assert(Object.isFrozen(plan) && Object.isFrozen(plan.targets) && Object.isFrozen(plan.targets[0]) && Object.isFrozen(plan.counts) && Object.isFrozen(plan.pinnedSurfaces), 'canonical monitoring plan must be deeply immutable');
assert.throws(() => { (plan.targets as MonitoringTarget[])[0] = { ...plan.targets[0], targetId: 'forged-out-of-contract-target' }; }, TypeError, 'post-build mutation of a canonical plan must fail');
const alteredCatalog = structuredClone(catalogJson);
alteredCatalog.sources[0].title = 'forged source';
assert.throws(() => buildMonitoringPlan({ catalog: alteredCatalog as Parameters<typeof buildMonitoringPlan>[0]['catalog'], sourceQueue: sourceQueueJson as Parameters<typeof buildMonitoringPlan>[0]['sourceQueue'], publicProbes: publicProbesJson, p5Review: p5ReviewJson as Parameters<typeof buildMonitoringPlan>[0]['p5Review'], p6ReviewItems: p6ChildrenJson.reviewItems, acceptedSpreadsheetRevisionId: '223', acceptedObservedAt: '2026-08-29T21:25:30.000Z', pinnedSurfaces: plan.pinnedSurfaces }), /Accepted P3-P7 monitoring inputs changed/, 'plan registration must reject altered accepted inputs');
assert.equal(evaluateFreshness('2026-08-30T00:00:00Z', '2026-08-30T00:00:00Z', 1), true);
assert.equal(evaluateFreshness('2026-08-31T00:00:00Z', '2026-08-30T00:00:00Z', 1), false, 'future evidence cannot be fresh');
assert.equal(evaluateFreshness('2026-08-20T00:00:00Z', '2026-08-30T00:00:00Z', 1), false, 'stale evidence cannot be fresh');
for (const target of [plan.targets.find((item) => item.route === 'snapshot_compare')!, plan.targets.find((item) => item.route === 'manual_review_no_fetch')!]) {
  assert.equal(acceptedNonPublicObservation(target).observedAt, target.acceptedObservedAt, 'non-public live-driver observations must preserve accepted time');
}
assert.throws(() => acceptedNonPublicObservation(plan.targets.find((item) => item.route === 'public_read_only_probe')!), /require a new executed observation/);

type Override = (target: MonitoringTarget, attempt: number) => Promise<RawProbeObservation>;
function adapter(observedAt: string, overrides = new Map<string, Override>(), calls: MonitoringTarget[] = []): ProbeAdapter {
  return { async probe(target, attempt) {
    calls.push(target);
    const override = overrides.get(target.targetId);
    if (override) return override(target, attempt);
    if (target.route === 'public_read_only_probe') return { kind: 'http', status: 200, finalUrl: target.url, observedFingerprint: target.acceptedFingerprint, observedAt, markers: [] };
    if (target.route === 'snapshot_compare') return { kind: 'snapshot', observedFingerprint: target.acceptedFingerprint, observedAt };
    return { kind: 'no_fetch', observedFingerprint: target.acceptedFingerprint, observedAt };
  } };
}
function environment(observedAt: string): ExecutionEnvironment & { sleeps: number[] } {
  const sleeps: number[] = [];
  return { sleeps, now: () => observedAt, sleep: async (value) => { sleeps.push(value); } };
}
function store() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'p8-test-'));
  return { directory, receiptStore: createMonitoringReceiptStore(directory, Buffer.alloc(32, 7)) };
}
async function complete(input: { monitoringPlan?: MonitoringPlan; runId: string; mode: 'dry_run' | 'apply_review_queue'; observedAt: string; overrides?: Map<string, Override> }) {
  const monitoringPlan = input.monitoringPlan ?? plan;
  const stored = store();
  const env = environment(input.observedAt);
  const calls: MonitoringTarget[] = [];
  let cursor = 0;
  let tip: string | null = null;
  while (cursor < monitoringPlan.targets.length) {
    const receipt = await executeMonitoringSegment({ plan: monitoringPlan, store: stored.receiptStore, runId: input.runId, mode: input.mode, startCursor: cursor, previousReceiptSha256: tip, adapter: adapter(input.observedAt, input.overrides, calls), environment: env });
    cursor = receipt.nextCursor;
    tip = receipt.receiptSha256;
  }
  return { ...stored, env, calls, finalized: finalizeMonitoringRun(monitoringPlan, stored.receiptStore, tip!) };
}

async function main() {
const executed = await complete({ runId: 'test-controls', mode: 'dry_run', observedAt: '2026-08-30T00:00:00.000Z' });
assert.equal(executed.finalized.receiptCount, 5);
assert.equal(executed.finalized.processedCount, 1028);
assert.equal(executed.finalized.uniqueProcessedCount, 1028);
assert.equal(executed.finalized.duplicateCount, 0);
assert.equal(executed.finalized.lostCount, 0);
assert.equal(executed.calls.filter((item) => item.route === 'public_read_only_probe').length, 50);
assert.equal(executed.calls.filter((item) => item.route !== 'public_read_only_probe' && item.url !== null).every((item) => item.route === 'manual_review_no_fetch'), true);
assert.equal(executed.env.sleeps.filter((item) => item === MINIMUM_REQUEST_SPACING_MS).length, 50, 'request spacing must execute for every public probe');
const fakeStore = { read: () => null };
assert.throws(() => finalizeMonitoringRun(plan, fakeStore, '0'.repeat(64)), /registered authenticated receipt store/, 'custom structural stores must not mint finalizations');
await assert.rejects(() => executeMonitoringSegment({ plan, store: fakeStore, runId: 'fake-store', mode: 'dry_run', startCursor: 0, previousReceiptSha256: null, adapter: adapter('2026-08-30T00:00:00.000Z'), environment: environment('2026-08-30T00:00:00.000Z') }), /registered authenticated receipt store/, 'custom structural stores must not execute probes or commit receipts');
const structuralPlan = structuredClone(plan) as MonitoringPlan;
structuralPlan.targets[0] = { ...structuralPlan.targets[0], targetId: 'forged-out-of-contract-target' };
const structuralPlanStore = store();
let structuralPlanProbes = 0;
const structuralPlanAdapter: ProbeAdapter = { probe: async (target) => { structuralPlanProbes += 1; return acceptedNonPublicObservation(target); } };
await assert.rejects(() => executeMonitoringSegment({ plan: structuralPlan, store: structuralPlanStore.receiptStore, runId: 'forged-plan', mode: 'apply_review_queue', startCursor: 0, previousReceiptSha256: null, adapter: structuralPlanAdapter, environment: environment('2026-08-30T00:00:00.000Z') }), /immutable registered canonical plan/, 'structural plans must not execute through a registered store');
assert.equal(structuralPlanProbes, 0, 'forged plan rejection must happen before probes');
assert.throws(() => finalizeMonitoringRun(structuralPlan, structuralPlanStore.receiptStore, '0'.repeat(64)), /immutable registered canonical plan/, 'structural plans must not mint publication-authorized finalizations');

const timeoutTarget = plan.targets.find((item) => item.route === 'public_read_only_probe')!;
const timeout = await complete({ runId: 'test-retry', mode: 'dry_run', observedAt: '2026-08-30T00:00:00.000Z', overrides: new Map([[timeoutTarget.targetId, async () => { throw new Error('ETIMEDOUT'); }]]) });
const timeoutResult = timeout.finalized.results.find((item) => item.targetId === timeoutTarget.targetId)!;
assert.equal(timeoutResult.attempts, 3);
assert.deepEqual(timeoutResult.retryDelaysMs, [250, 500]);
assert(RETRY_DELAYS_MS.every((delay) => timeout.env.sleeps.includes(delay)), 'bounded retry delays must execute');
assert.equal(timeoutResult.disposition, 'review_inconclusive');

const stale = await complete({ runId: 'test-stale', mode: 'dry_run', observedAt: '2026-08-30T00:00:00.000Z', overrides: new Map([[timeoutTarget.targetId, async (target) => ({ kind: 'http', status: 200, finalUrl: target.url, observedFingerprint: target.acceptedFingerprint, observedAt: '2026-08-20T00:00:00.000Z', markers: [] })]]) });
assert.equal(stale.finalized.results.find((item) => item.targetId === timeoutTarget.targetId)!.disposition, 'review_inconclusive', 'stale executed observations must enter review');
const acceptedSnapshotTarget = plan.targets.find((item) => item.route === 'snapshot_compare')!;
const liveDriverShaped = await complete({ runId: 'test-live-driver-stale', mode: 'dry_run', observedAt: '2026-10-15T00:00:00.000Z', overrides: new Map([[acceptedSnapshotTarget.targetId, async (target) => acceptedNonPublicObservation(target)]]) });
const liveDriverResult = liveDriverShaped.finalized.results.find((item) => item.targetId === acceptedSnapshotTarget.targetId)!;
assert.equal(liveDriverResult.fresh, false, 'no new live-driver snapshot must retain accepted observation time');
assert.equal(liveDriverResult.disposition, 'review_inconclusive', 'stale accepted snapshot must enter review instead of refreshing itself');

const recoveryTarget = plan.targets[0];
const recoveryOverride = new Map<string, Override>([[recoveryTarget.targetId, async () => ({ kind: 'snapshot', observedFingerprint: sha256('changed'), observedAt: '2026-08-30T00:00:00.000Z', changeKind: 'generic_change' })]]);
const interruptedStore = store();
const interruptedEnv = environment('2026-08-30T00:00:00.000Z');
const prefix = await executeMonitoringSegment({ plan, store: interruptedStore.receiptStore, runId: 'test-recovery', mode: 'apply_review_queue', startCursor: 0, previousReceiptSha256: null, adapter: adapter('2026-08-30T00:00:00.000Z', recoveryOverride), environment: interruptedEnv, limit: MAX_TARGETS_PER_SEGMENT });
assert.equal(prefix.reviewQueue.length, 1, 'interrupted prefix must retain its review item');
assert.throws(() => finalizeMonitoringRun(plan, interruptedStore.receiptStore, prefix.receiptSha256), /complete denominator/, 'partial suffix/prefix must not publish');
await assert.rejects(() => executeMonitoringSegment({ plan, store: interruptedStore.receiptStore, runId: 'wrong-run', mode: 'apply_review_queue', startCursor: prefix.nextCursor, previousReceiptSha256: prefix.receiptSha256, adapter: adapter('2026-08-30T00:00:00.000Z'), environment: interruptedEnv }), /run, or mode changed/);
let cursor = prefix.nextCursor;
let tip = prefix.receiptSha256;
while (cursor < plan.targets.length) {
  const receipt = await executeMonitoringSegment({ plan, store: interruptedStore.receiptStore, runId: 'test-recovery', mode: 'apply_review_queue', startCursor: cursor, previousReceiptSha256: tip, adapter: adapter('2026-08-30T00:00:00.000Z', recoveryOverride), environment: interruptedEnv });
  cursor = receipt.nextCursor;
  tip = receipt.receiptSha256;
}
const recovered = finalizeMonitoringRun(plan, interruptedStore.receiptStore, tip);
const published = applyReviewQueue(recovered, []);
assert.equal(published.reviewQueue.length, 1);
assert.equal(published.reviewQueue[0].reviewId, prefix.reviewQueue[0].reviewId, 'prefix review must survive authenticated recovery');
assert.equal(published.acceptedFactsChanged, false);
const replayedSameTip = applyReviewQueue(recovered, published.reviewQueue);
assert.equal(replayedSameTip.reviewQueue[0].occurrenceCount, 1, 'replaying the same authenticated tip must be idempotent');
const refinalizedSameTip = finalizeMonitoringRun(plan, interruptedStore.receiptStore, tip);
assert.equal(applyReviewQueue(refinalizedSameTip, replayedSameTip.reviewQueue).reviewQueue[0].occurrenceCount, 1, 'refinalizing and replaying the same authenticated tip must remain idempotent');
const forgedFinalization = JSON.parse(JSON.stringify(recovered));
forgedFinalization.reviewQueue[0].targetId = 'not-in-plan';
assert.throws(() => applyReviewQueue(forgedFinalization, []), /runtime-authenticated finalization/, 'structurally forged complete objects must not publish');
const forgedExisting = { ...published.reviewQueue[0], targetId: 'not-in-plan' };
assert.throws(() => applyReviewQueue(recovered, [forgedExisting]), /outside the authenticated plan/, 'existing queue targets outside the authenticated plan must not publish');
const repeat = await complete({ runId: 'test-recovery-repeat', mode: 'apply_review_queue', observedAt: '2026-08-30T00:00:00.000Z', overrides: recoveryOverride });
const republished = applyReviewQueue(repeat.finalized, replayedSameTip.reviewQueue);
assert.equal(republished.reviewQueue.length, 1, 'same logical review must upsert across runs');
assert.equal(republished.reviewQueue[0].reviewId, published.reviewQueue[0].reviewId);
assert.equal(republished.reviewQueue[0].occurrenceCount, 2);
recovered.results[0].reason = 'post-finalization mutation';
assert.throws(() => applyReviewQueue(recovered, published.reviewQueue), /unmodified runtime-authenticated finalization/, 'post-finalization mutation must invalidate publication');

const firstReceiptPath = path.join(executed.directory, `${executed.finalized.receiptTipSha256}.json`);
const tampered = JSON.parse(fs.readFileSync(firstReceiptPath, 'utf8')) as Record<string, unknown>;
tampered.processedCount = 1;
fs.writeFileSync(firstReceiptPath, `${JSON.stringify(tampered, null, 2)}\n`);
assert.throws(() => createMonitoringReceiptStore(executed.directory, Buffer.alloc(32, 7)).read(executed.finalized.receiptTipSha256), /authentication failed/, 'unkeyed receipt edits must fail HMAC authentication');

const dryOne = dryRunOneJson as unknown as { targetDenominator: number; processedCount: number; duplicateCount: number; lostCount: number; resultDigest: string; receiptCount: number; executedControls: { publicProbeCalls: number; spacingSleeps: number; freshnessEvaluations: number } };
const dryTwo = dryRunTwoJson as unknown as typeof dryOne;
for (const dry of [dryOne, dryTwo]) {
  assert.equal(dry.targetDenominator, 1028);
  assert.equal(dry.processedCount, 1028);
  assert.equal(dry.duplicateCount, 0);
  assert.equal(dry.lostCount, 0);
  assert.equal(dry.receiptCount, 5);
  assert.equal(dry.executedControls.publicProbeCalls, 50);
  assert.equal(dry.executedControls.spacingSleeps, 50);
  assert.equal(dry.executedControls.freshnessEvaluations, 1028);
}
assert.equal(dryOne.resultDigest, dryTwo.resultDigest);
assert.equal((simulationsJson as { counts: { simulated: number; reviewRequired: number; acceptedFactMutations: number } }).counts.simulated, 6);
assert.equal((simulationsJson as { counts: { reviewRequired: number } }).counts.reviewRequired, 6);
assert.equal((simulationsJson as { counts: { acceptedFactMutations: number } }).counts.acceptedFactMutations, 0);
const recoveryEvidence = recoveryJson as unknown as { incompletePublicationRejected: boolean; finalized: { processedCount: number; duplicateCount: number; lostCount: number }; repeatedApply: { stableReviewId: boolean; sameTipReplayOccurrenceCount: number; distinctRunOccurrenceCount: number } };
assert.equal(recoveryEvidence.incompletePublicationRejected, true);
assert.equal(recoveryEvidence.finalized.processedCount, 1028);
assert.equal(recoveryEvidence.finalized.duplicateCount, 0);
assert.equal(recoveryEvidence.finalized.lostCount, 0);
assert.equal(recoveryEvidence.repeatedApply.stableReviewId, true);
assert.equal(recoveryEvidence.repeatedApply.sameTipReplayOccurrenceCount, 1);
assert.equal(recoveryEvidence.repeatedApply.distinctRunOccurrenceCount, 2);
assert.equal(scheduleJson.enabled, false);
assert.equal(scheduleJson.activationAuthorized, false);
assert.equal(scheduleJson.externalNotificationConfigured, false);
assert.equal(privacyJson.personalDataPresent, false);
assert.equal(privacyJson.sensitiveAuthMaterialPresent, false);
assert.equal(privacyJson.spreadsheetWrites, 0);
assert.equal(privacyJson.productionSpreadsheetAccesses, 0);
const reportEvidence = reportJson as unknown as { plan: { counts: { targetDenominator: number } }; scheduleEnabled: boolean };
assert.equal(reportEvidence.plan.counts.targetDenominator, 1028);
assert.equal(reportEvidence.scheduleEnabled, false);
for (const artifact of [dryRunOneJson, dryRunTwoJson, simulationsJson, recoveryJson, scheduleJson, privacyJson, reportJson]) assert.doesNotThrow(() => assertPrivacySafeArtifact(artifact));

console.log('P8 full-denominator monitoring, executed retry/rate/freshness, HMAC recovery, idempotency, schedule-boundary, and privacy tests passed.');
}

main().catch((error) => { console.error(error); process.exit(1); });
