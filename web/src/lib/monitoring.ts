import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const MONITORING_SCHEMA_VERSION = 2 as const;
export const MAX_TARGETS_PER_SEGMENT = 250;
export const MAX_ATTEMPTS = 3;
export const MINIMUM_REQUEST_SPACING_MS = 100;
export const RETRY_DELAYS_MS = [250, 500] as const;

export type TargetKind = 'source' | 'source_route' | 'award' | 'award_cycle' | 'portal' | 'application_group' | 'review_item';
export type MonitoringRoute = 'public_read_only_probe' | 'manual_review_no_fetch' | 'offline_no_fetch' | 'snapshot_compare';
export type ChangeKind = 'generic_change' | 'date_conflict' | 'portal_change';
export type Disposition = 'unchanged' | 'review_dead_link' | 'review_inconclusive' | 'review_redirect' | 'review_date_conflict' | 'review_portal_change' | 'review_change';

export interface MonitoringTarget {
  targetId: string;
  kind: TargetKind;
  subjectId: string;
  route: MonitoringRoute;
  url: string | null;
  acceptedFingerprint: string;
  acceptedObservedAt: string;
  freshnessDays: number;
}

export interface MonitoringPlan {
  schemaVersion: typeof MONITORING_SCHEMA_VERSION;
  stageId: 'P8';
  spreadsheetId: string;
  sheetName: string;
  spreadsheetRevisionId: string;
  catalogRevision: string;
  counts: {
    sources: number;
    sourceRoutes: number;
    publicReadOnlySources: number;
    manualNoFetchSources: number;
    offlineSources: number;
    awards: number;
    cycles: number;
    portals: number;
    applicationGroups: number;
    p5ReviewItems: number;
    p6ReviewItems: number;
    targetDenominator: number;
  };
  pinnedSurfaces: Record<string, string>;
  targets: MonitoringTarget[];
  planDigest: string;
}

type CatalogInput = {
  catalogRevision: string;
  sources: Array<{ publicId: string; url: string | null; [key: string]: unknown }>;
  awards: Array<{ publicId: string; cycle: unknown; [key: string]: unknown }>;
  portals: Array<{ publicId: string; [key: string]: unknown }>;
  applicationGroups: Array<{ publicId: string; [key: string]: unknown }>;
};
type SourceQueueInput = {
  sourceSpreadsheetId: string;
  sourceRevisionId: string;
  sheetName: string;
  entries: Array<{ sourceId: string; url: string; retrievalDisposition: 'public_read_only_scrape' | 'manual_review_no_fetch' }>;
};
type P5ReviewInput = { entries: Array<{ rowKey: string; [key: string]: unknown }> };
type P6ReviewItem = { id: string; [key: string]: unknown };
type PublicProbeInput = { receipts: Array<{ url: string; retrievedAt: string; rawBodySha256: string }> };

export type RawProbeObservation =
  | { kind: 'http'; status: number | null; finalUrl: string | null; observedFingerprint: string | null; observedAt: string; markers: Array<'bot_block'>; changeKind?: ChangeKind }
  | { kind: 'snapshot'; observedFingerprint: string; observedAt: string; changeKind?: ChangeKind }
  | { kind: 'no_fetch'; observedFingerprint: string; observedAt: string };

export interface ProbeAdapter {
  probe(target: MonitoringTarget, attempt: number): Promise<RawProbeObservation>;
}

export interface ExecutionEnvironment {
  now(): string;
  sleep(milliseconds: number): Promise<void>;
}

export interface MonitoringResult {
  targetId: string;
  kind: TargetKind;
  route: MonitoringRoute;
  disposition: Disposition;
  requiresReview: boolean;
  severity: 'high' | 'medium' | null;
  reason: string;
  attempts: number;
  retryDelaysMs: number[];
  requestSpacingMs: number;
  observationFingerprint: string;
  observedAt: string;
  fresh: boolean;
  acceptedFactMutation: false;
}

export interface ReviewQueueItem {
  reviewId: string;
  targetId: string;
  disposition: Exclude<Disposition, 'unchanged'>;
  observationFingerprint: string;
  severity: 'high' | 'medium';
  reason: string;
  state: 'open';
  firstSeenAt: string;
  lastSeenAt: string;
  occurrenceCount: number;
  occurrenceRunIds: string[];
  acceptedFactMutation: false;
}

export interface SegmentReceiptBody {
  schemaVersion: typeof MONITORING_SCHEMA_VERSION;
  stageId: 'P8';
  runId: string;
  mode: 'dry_run' | 'apply_review_queue';
  planDigest: string;
  spreadsheetId: string;
  spreadsheetRevisionId: string;
  segmentIndex: number;
  startCursor: number;
  nextCursor: number;
  targetDenominator: number;
  processedCount: number;
  remainingCount: number;
  previousReceiptSha256: string | null;
  reachedPlanEnd: boolean;
  results: MonitoringResult[];
  reviewQueue: ReviewQueueItem[];
}
export type SegmentReceipt = SegmentReceiptBody & { receiptSha256: string; receiptMac: string };

export interface FinalizedRun {
  schemaVersion: typeof MONITORING_SCHEMA_VERSION;
  stageId: 'P8';
  runId: string;
  mode: SegmentReceiptBody['mode'];
  planDigest: string;
  receiptTipSha256: string;
  receiptCount: number;
  targetDenominator: number;
  processedCount: number;
  uniqueProcessedCount: number;
  duplicateCount: number;
  lostCount: number;
  complete: true;
  results: MonitoringResult[];
  reviewQueue: ReviewQueueItem[];
  resultDigest: string;
}

export interface MonitoringReceiptStore {
  read(receiptSha256: string): SegmentReceipt | null;
}

const storeState = new WeakMap<MonitoringReceiptStore, { directory: string; key: Buffer }>();
const authenticatedFinalizations = new WeakMap<FinalizedRun, { digest: string; targetIds: Set<string> }>();
const registeredPlans = new WeakMap<MonitoringPlan, string>();

const ACCEPTED_PINNED_SURFACES = {
  'docs/evidence/P3-acquisition.json': 'e5faf3f932672bd0a4fa29999f8b8db997d0386f7d7a5c785429e361559e555a',
  'docs/evidence/P3-completeness.json': '9abae4851738d67f9f022a00306bd6e4a1b49814cc2599bd60501a85463666ec',
  'docs/evidence/P4-field-evidence.json': '5afb7757355faba8a35528b974e076bb32962f5c6e5c0014a487ecb29a82eda9',
  'docs/evidence/P4-reviews.json': 'dfd83689c4d1125f365f4d643115116cda8740c8336b0335f9c405edfa59f756',
  'docs/evidence/P5-applied-change-receipt.json': '17da5eec7dc062bc9a2d06212cb516a4e1e252df27e97c50f0f034270bac29f9',
  'docs/evidence/P5-postwrite-reconciliation.json': 'cc55838e36b82b51edd5b75f3b0ad4960dca71413c3365f3a76c427f8b0cf1a9',
  'docs/evidence/P5-source-queue.json': '8e05c4575b162a9e9b9c74c4dda646f717ab7eae6fc0df6ca11e0567b2317ba6',
  'docs/evidence/P5-public-probes.json': '7be67a3182b20127555f973d8eea2c778a3a3cb184b63fad5314a4dddb60da08',
  'docs/evidence/P5-manual-review.json': '3613b51d41930a06178b474f33cbd18385504ca0450763fb4643dab7b11fe58c',
  'docs/evidence/P6-child-records.json': 'd7ae32194b75e27ba796365b7d8b6140b562f34cecbd60adcbf375e7f3cf13cc',
  'web/fixtures/p7/student-catalog.json': '35d7836432747710e3515010e8548ceb20ef270a9896d1f1b14c7c91693e9841',
  'docs/evidence/P7-manifest.json': 'e384db7fda28dfbb651d78f0d56c3bf377f7af677c67fdd3cae06fef46975df3',
} as const;

export function sha256(value: string | Buffer): string {
  return createHash('sha256').update(value).digest('hex');
}

export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map((item) => canonicalJson(item)).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function fingerprint(value: unknown): string {
  return sha256(canonicalJson(value));
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

function assertRegisteredPlan(plan: MonitoringPlan): void {
  const registeredDigest = registeredPlans.get(plan);
  const { planDigest, ...body } = plan;
  if (!registeredDigest || planDigest !== fingerprint(body) || registeredDigest !== fingerprint(plan)) throw new Error('Monitoring requires an immutable registered canonical plan');
}

function makeTargetId(kind: TargetKind, subjectId: string): string {
  return `p8-${kind}-${sha256(`${kind}:${subjectId}`).slice(0, 24)}`;
}

export function buildMonitoringPlan(input: {
  catalog: CatalogInput;
  sourceQueue: SourceQueueInput;
  publicProbes: PublicProbeInput;
  p5Review: P5ReviewInput;
  p6ReviewItems: P6ReviewItem[];
  acceptedSpreadsheetRevisionId: string;
  acceptedObservedAt: string;
  pinnedSurfaces: Record<string, string>;
}): MonitoringPlan {
  if (input.acceptedObservedAt !== '2026-08-29T21:25:30.000Z') throw new Error('Accepted observation time changed');
  if (input.acceptedSpreadsheetRevisionId !== '223' || input.sourceQueue.sourceSpreadsheetId !== '1Dp5AMnrfSQ-Xf-r03S75lKsGPJk7o0inOgvC9Q6lOl4' || input.sourceQueue.sourceRevisionId !== '222' || input.sourceQueue.sheetName !== 'Master Database') throw new Error('Accepted testing-sheet identity changed');
  const acceptedInputDigests = { catalog: '4140ce6493dbd94d59dfc0457edf15fb126d045d925b8ea8f8600152e2df60c1', sourceQueue: 'c35b702c3b6dfed8f42358339c45500eaa66d57b4dadc182be9a3c7c4b5c791f', publicProbes: '59776faa0c7668b3ac6ab478ef3e3e4b8dbd0796752ba85c9f157f8fedac619b', p5Review: '3f040adc068e5df0327f5c847471c0510f469b0183d83e5e30ff36bc951bb315', p6ReviewItems: '6acc7dad283437ca4e2c8be71ebf259fc2d013a44614222df320480ed47b6ef1' };
  const suppliedInputDigests = { catalog: fingerprint(input.catalog), sourceQueue: fingerprint(input.sourceQueue), publicProbes: fingerprint(input.publicProbes), p5Review: fingerprint(input.p5Review), p6ReviewItems: fingerprint(input.p6ReviewItems) };
  if (canonicalJson(suppliedInputDigests) !== canonicalJson(acceptedInputDigests) || canonicalJson(input.pinnedSurfaces) !== canonicalJson(ACCEPTED_PINNED_SURFACES)) throw new Error('Accepted P3-P7 monitoring inputs changed');
  if (input.catalog.sources.length !== 217 || input.catalog.awards.length !== 192 || input.catalog.portals.length !== 21 || input.catalog.applicationGroups.length !== 4) throw new Error('Accepted P7 catalog denominator changed');
  if (input.sourceQueue.entries.length !== 213) throw new Error('Accepted P5 source denominator changed');
  if (input.publicProbes.receipts.length !== 50) throw new Error('Accepted P5 public-probe denominator changed');
  if (input.p5Review.entries.length !== 187 || input.p6ReviewItems.length !== 2) throw new Error('Accepted review denominator changed');
  const queueByUrl = new Map(input.sourceQueue.entries.map((entry) => [new URL(entry.url).toString(), entry]));
  if (queueByUrl.size !== 213) throw new Error('P5 source queue contains duplicate URLs');
  const probeByUrl = new Map(input.publicProbes.receipts.map((receipt) => [new URL(receipt.url).toString(), receipt]));
  if (probeByUrl.size !== 50) throw new Error('P5 public-probe receipts contain duplicate URLs');

  const sourceTargets = input.catalog.sources.map((source): MonitoringTarget => ({ targetId: makeTargetId('source', source.publicId), kind: 'source', subjectId: source.publicId, route: 'snapshot_compare', url: null, acceptedFingerprint: fingerprint(source), acceptedObservedAt: input.acceptedObservedAt, freshnessDays: 30 }));
  const sourceRouteTargets = input.sourceQueue.entries.map((queue): MonitoringTarget => {
    const canonicalUrl = new URL(queue.url).toString();
    const route = queue.retrievalDisposition === 'public_read_only_scrape' ? 'public_read_only_probe' : 'manual_review_no_fetch';
    const publicProbe = route === 'public_read_only_probe' ? probeByUrl.get(canonicalUrl) : undefined;
    if (route === 'public_read_only_probe' && !publicProbe) throw new Error(`P5 source route lacks accepted public-probe receipt: ${queue.sourceId}`);
    return { targetId: makeTargetId('source_route', queue.sourceId), kind: 'source_route', subjectId: queue.sourceId, route, url: canonicalUrl, acceptedFingerprint: publicProbe?.rawBodySha256 ?? fingerprint(queue), acceptedObservedAt: publicProbe?.retrievedAt ?? input.acceptedObservedAt, freshnessDays: route === 'public_read_only_probe' ? 7 : 30 };
  });
  const awardTargets = input.catalog.awards.map((award): MonitoringTarget => {
    const { cycle: _cycle, ...awardWithoutCycle } = award;
    return { targetId: makeTargetId('award', award.publicId), kind: 'award', subjectId: award.publicId, route: 'snapshot_compare', url: null, acceptedFingerprint: fingerprint(awardWithoutCycle), acceptedObservedAt: input.acceptedObservedAt, freshnessDays: 7 };
  });
  const cycleTargets = input.catalog.awards.map((award): MonitoringTarget => ({ targetId: makeTargetId('award_cycle', award.publicId), kind: 'award_cycle', subjectId: award.publicId, route: 'snapshot_compare', url: null, acceptedFingerprint: fingerprint(award.cycle), acceptedObservedAt: input.acceptedObservedAt, freshnessDays: 7 }));
  const portalTargets = input.catalog.portals.map((portal): MonitoringTarget => ({ targetId: makeTargetId('portal', portal.publicId), kind: 'portal', subjectId: portal.publicId, route: 'snapshot_compare', url: null, acceptedFingerprint: fingerprint(portal), acceptedObservedAt: input.acceptedObservedAt, freshnessDays: 7 }));
  const applicationTargets = input.catalog.applicationGroups.map((group): MonitoringTarget => ({ targetId: makeTargetId('application_group', group.publicId), kind: 'application_group', subjectId: group.publicId, route: 'snapshot_compare', url: null, acceptedFingerprint: fingerprint(group), acceptedObservedAt: input.acceptedObservedAt, freshnessDays: 30 }));
  const p5ReviewTargets = input.p5Review.entries.map((item): MonitoringTarget => ({ targetId: makeTargetId('review_item', `p5:${item.rowKey}`), kind: 'review_item', subjectId: `p5:${item.rowKey}`, route: 'snapshot_compare', url: null, acceptedFingerprint: fingerprint(item), acceptedObservedAt: input.acceptedObservedAt, freshnessDays: 7 }));
  const p6ReviewTargets = input.p6ReviewItems.map((item): MonitoringTarget => ({ targetId: makeTargetId('review_item', `p6:${item.id}`), kind: 'review_item', subjectId: `p6:${item.id}`, route: 'snapshot_compare', url: null, acceptedFingerprint: fingerprint(item), acceptedObservedAt: input.acceptedObservedAt, freshnessDays: 7 }));
  const targets = [...sourceTargets, ...sourceRouteTargets, ...awardTargets, ...cycleTargets, ...portalTargets, ...applicationTargets, ...p5ReviewTargets, ...p6ReviewTargets];
  if (new Set(targets.map((target) => target.targetId)).size !== targets.length) throw new Error('Monitoring target identities are not unique');
  const counts = { sources: sourceTargets.length, sourceRoutes: sourceRouteTargets.length, publicReadOnlySources: sourceRouteTargets.filter((item) => item.route === 'public_read_only_probe').length, manualNoFetchSources: sourceRouteTargets.filter((item) => item.route === 'manual_review_no_fetch').length, offlineSources: input.catalog.sources.filter((item) => item.url === null).length, awards: awardTargets.length, cycles: cycleTargets.length, portals: portalTargets.length, applicationGroups: applicationTargets.length, p5ReviewItems: p5ReviewTargets.length, p6ReviewItems: p6ReviewTargets.length, targetDenominator: targets.length };
  if (counts.publicReadOnlySources !== 50 || counts.manualNoFetchSources !== 163 || counts.offlineSources !== 7 || counts.targetDenominator !== 1028) throw new Error(`Monitoring route or target denominator changed: ${canonicalJson(counts)}`);
  if (!/^\d+$/.test(input.acceptedSpreadsheetRevisionId)) throw new Error('Accepted spreadsheet revision identity is invalid');
  const body = { schemaVersion: MONITORING_SCHEMA_VERSION, stageId: 'P8' as const, spreadsheetId: input.sourceQueue.sourceSpreadsheetId, sheetName: input.sourceQueue.sheetName, spreadsheetRevisionId: input.acceptedSpreadsheetRevisionId, catalogRevision: input.catalog.catalogRevision, counts, pinnedSurfaces: input.pinnedSurfaces, targets };
  const plan = deepFreeze({ ...body, planDigest: fingerprint(body) });
  registeredPlans.set(plan, fingerprint(plan));
  return plan;
}

export function evaluateFreshness(observedAt: string, now: string, maximumAgeDays: number): boolean {
  const observed = Date.parse(observedAt);
  const current = Date.parse(now);
  if (!Number.isFinite(observed) || !Number.isFinite(current) || observed > current) return false;
  return current - observed <= maximumAgeDays * 86_400_000;
}

export function acceptedNonPublicObservation(target: MonitoringTarget): RawProbeObservation {
  if (target.route === 'public_read_only_probe') throw new Error('Public probe targets require a new executed observation');
  if (target.route === 'snapshot_compare') return { kind: 'snapshot', observedFingerprint: target.acceptedFingerprint, observedAt: target.acceptedObservedAt };
  return { kind: 'no_fetch', observedFingerprint: target.acceptedFingerprint, observedAt: target.acceptedObservedAt };
}

function stableReview(result: MonitoringResult, runId: string): ReviewQueueItem {
  const reviewId = `p8-review-${sha256(canonicalJson([result.targetId, result.disposition, result.observationFingerprint])).slice(0, 24)}`;
  return { reviewId, targetId: result.targetId, disposition: result.disposition as Exclude<Disposition, 'unchanged'>, observationFingerprint: result.observationFingerprint, severity: result.severity!, reason: result.reason, state: 'open', firstSeenAt: result.observedAt, lastSeenAt: result.observedAt, occurrenceCount: 1, occurrenceRunIds: [runId], acceptedFactMutation: false };
}

export function mergeReviewQueue(existing: ReviewQueueItem[], incoming: ReviewQueueItem[]): ReviewQueueItem[] {
  for (const item of [...existing, ...incoming]) {
    const expectedReviewId = `p8-review-${sha256(canonicalJson([item.targetId, item.disposition, item.observationFingerprint])).slice(0, 24)}`;
    if (item.reviewId !== expectedReviewId || item.state !== 'open' || item.acceptedFactMutation !== false) throw new Error('Review queue item identity is invalid');
    if (item.occurrenceRunIds.length === 0 || new Set(item.occurrenceRunIds).size !== item.occurrenceRunIds.length || item.occurrenceCount !== item.occurrenceRunIds.length) throw new Error('Review queue occurrence provenance is invalid');
    if (!Number.isFinite(Date.parse(item.firstSeenAt)) || !Number.isFinite(Date.parse(item.lastSeenAt)) || Date.parse(item.firstSeenAt) > Date.parse(item.lastSeenAt)) throw new Error('Review queue observation time is invalid');
  }
  const merged = new Map(existing.map((item) => [item.reviewId, { ...item }]));
  for (const item of incoming) {
    const prior = merged.get(item.reviewId);
    if (!prior) { merged.set(item.reviewId, { ...item, occurrenceRunIds: [...item.occurrenceRunIds] }); continue; }
    const occurrenceRunIds = [...new Set([...prior.occurrenceRunIds, ...item.occurrenceRunIds])].sort();
    merged.set(item.reviewId, { ...prior, firstSeenAt: Date.parse(prior.firstSeenAt) <= Date.parse(item.firstSeenAt) ? prior.firstSeenAt : item.firstSeenAt, lastSeenAt: Date.parse(prior.lastSeenAt) >= Date.parse(item.lastSeenAt) ? prior.lastSeenAt : item.lastSeenAt, occurrenceCount: occurrenceRunIds.length, occurrenceRunIds });
  }
  return [...merged.values()].sort((a, b) => a.reviewId.localeCompare(b.reviewId));
}

function errorText(error: unknown): string {
  return error instanceof Error ? `${error.name}:${(error as Error & { code?: string }).code ?? ''}:${error.message}` : String(error);
}

async function executeTarget(target: MonitoringTarget, adapter: ProbeAdapter, environment: ExecutionEnvironment): Promise<MonitoringResult> {
  const retryDelaysMs: number[] = [];
  let attempts = 0;
  let observation: RawProbeObservation | null = null;
  let failure = '';
  if (target.route === 'public_read_only_probe') await environment.sleep(MINIMUM_REQUEST_SPACING_MS);
  while (attempts < MAX_ATTEMPTS && observation === null) {
    attempts += 1;
    try { observation = await adapter.probe(target, attempts); }
    catch (error) {
      failure = errorText(error);
      if (attempts < MAX_ATTEMPTS) { const delay = RETRY_DELAYS_MS[attempts - 1]; retryDelaysMs.push(delay); await environment.sleep(delay); }
    }
  }
  const runObservedAt = environment.now();
  const observedAt = observation?.observedAt ?? runObservedAt;
  const fresh = evaluateFreshness(observedAt, runObservedAt, target.freshnessDays);
  const common = { targetId: target.targetId, kind: target.kind, route: target.route, attempts, retryDelaysMs, requestSpacingMs: target.route === 'public_read_only_probe' ? MINIMUM_REQUEST_SPACING_MS : 0, observedAt, fresh, acceptedFactMutation: false as const };
  if (!observation) return { ...common, disposition: 'review_inconclusive', requiresReview: true, severity: 'high', reason: `Probe exhausted bounded retries: ${failure}`, observationFingerprint: sha256(failure) };
  const { observedAt: _observationTime, ...observationBody } = observation;
  const observationFingerprint = fingerprint(observationBody);
  if (!fresh) return { ...common, disposition: 'review_inconclusive', requiresReview: true, severity: 'high', reason: 'Observation timestamp is stale, invalid, or future-dated.', observationFingerprint };
  if (observation.kind === 'http') {
    if (observation.markers.includes('bot_block')) return { ...common, disposition: 'review_inconclusive', requiresReview: true, severity: 'high', reason: 'Bot block is inconclusive and preserves accepted facts.', observationFingerprint };
    if (observation.status === 404 || observation.status === 410) return { ...common, disposition: 'review_dead_link', requiresReview: true, severity: 'high', reason: `HTTP ${observation.status} is a link review only and cannot archive an award.`, observationFingerprint };
    if (observation.status === null || observation.status < 200 || observation.status >= 300) return { ...common, disposition: 'review_inconclusive', requiresReview: true, severity: 'high', reason: `HTTP ${observation.status ?? 'none'} is inconclusive.`, observationFingerprint };
    if (observation.finalUrl !== target.url) return { ...common, disposition: 'review_redirect', requiresReview: true, severity: 'medium', reason: 'Observed final URL differs from the accepted source route.', observationFingerprint };
    if (observation.observedFingerprint !== target.acceptedFingerprint) return { ...common, disposition: 'review_change', requiresReview: true, severity: 'medium', reason: 'Observed public-source fingerprint differs and requires evidence review.', observationFingerprint };
  } else if (observation.observedFingerprint !== target.acceptedFingerprint) {
    const changeKind = observation.kind === 'snapshot' ? observation.changeKind : undefined;
    const disposition = changeKind === 'date_conflict' ? 'review_date_conflict' : changeKind === 'portal_change' ? 'review_portal_change' : 'review_change';
    return { ...common, disposition, requiresReview: true, severity: disposition === 'review_date_conflict' ? 'high' : 'medium', reason: `${changeKind ?? 'snapshot'} differs from the accepted fingerprint and requires review.`, observationFingerprint };
  }
  return { ...common, disposition: 'unchanged', requiresReview: false, severity: null, reason: 'Executed observation matches the accepted fingerprint; no factual acceptance or mutation occurred.', observationFingerprint };
}

export function createMonitoringReceiptStore(directory: string, integrityKey: Uint8Array): MonitoringReceiptStore {
  if (integrityKey.byteLength < 32) throw new Error('Monitoring receipt integrity key must contain at least 32 bytes');
  const resolved = path.resolve(directory);
  fs.mkdirSync(resolved, { recursive: true, mode: 0o700 });
  const key = Buffer.from(integrityKey);
  const store: MonitoringReceiptStore = Object.freeze({ read(receiptSha256: string) {
    if (!/^[0-9a-f]{64}$/.test(receiptSha256)) throw new Error('Monitoring receipt digest is invalid');
    const receiptPath = path.join(resolved, `${receiptSha256}.json`);
    if (!fs.existsSync(receiptPath)) return null;
    const receipt = JSON.parse(fs.readFileSync(receiptPath, 'utf8')) as SegmentReceipt;
    const { receiptMac, ...unsigned } = receipt;
    const expected = createHmac('sha256', key).update(canonicalJson(unsigned)).digest();
    const supplied = Buffer.from(receiptMac, 'hex');
    if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) throw new Error('Monitoring receipt authentication failed');
    if (receipt.receiptSha256 !== receiptSha256 || receiptSha256 !== fingerprint(unsignedBody(receipt))) throw new Error('Monitoring receipt digest failed');
    return receipt;
  } });
  storeState.set(store, { directory: resolved, key });
  return store;
}

function unsignedBody(receipt: SegmentReceipt): SegmentReceiptBody {
  const { receiptSha256: _digest, receiptMac: _mac, ...body } = receipt;
  return body;
}

function commitReceipt(store: MonitoringReceiptStore, body: SegmentReceiptBody): SegmentReceipt {
  const state = storeState.get(store);
  if (!state) throw new Error('Monitoring receipt store is untrusted');
  const receiptSha256 = fingerprint(body);
  const unsigned = { ...body, receiptSha256 };
  const receiptMac = createHmac('sha256', state.key).update(canonicalJson(unsigned)).digest('hex');
  const receipt: SegmentReceipt = { ...unsigned, receiptMac };
  const receiptPath = path.join(state.directory, `${receiptSha256}.json`);
  const serialized = `${JSON.stringify(receipt, null, 2)}\n`;
  try { fs.writeFileSync(receiptPath, serialized, { flag: 'wx', mode: 0o600 }); }
  catch (error) { if ((error as NodeJS.ErrnoException).code !== 'EEXIST' || fs.readFileSync(receiptPath, 'utf8') !== serialized) throw new Error('Monitoring receipt store is append-only'); }
  return receipt;
}

function loadLedger(store: MonitoringReceiptStore, tip: string): SegmentReceipt[] {
  const reversed: SegmentReceipt[] = [];
  const visited = new Set<string>();
  let current: string | null = tip;
  while (current) {
    if (visited.has(current)) throw new Error('Monitoring receipt ledger cycle');
    visited.add(current);
    const receipt = store.read(current);
    if (!receipt) throw new Error('Monitoring receipt ledger is incomplete');
    reversed.push(receipt);
    current = receipt.previousReceiptSha256;
  }
  return reversed.reverse();
}

function validateLedger(plan: MonitoringPlan, ledger: SegmentReceipt[]): void {
  let cursor = 0;
  let previous: string | null = null;
  const runId = ledger[0]?.runId;
  const mode = ledger[0]?.mode;
  for (const [index, receipt] of ledger.entries()) {
    if (receipt.schemaVersion !== MONITORING_SCHEMA_VERSION || receipt.stageId !== 'P8' || receipt.runId !== runId || receipt.mode !== mode || receipt.planDigest !== plan.planDigest || receipt.targetDenominator !== plan.targets.length || receipt.spreadsheetId !== plan.spreadsheetId || receipt.spreadsheetRevisionId !== plan.spreadsheetRevisionId) throw new Error('Monitoring ledger identity changed');
    if (receipt.segmentIndex !== index || receipt.startCursor !== cursor || receipt.previousReceiptSha256 !== previous) throw new Error('Monitoring ledger is not contiguous');
    if (receipt.nextCursor <= receipt.startCursor || receipt.nextCursor > plan.targets.length || receipt.processedCount <= 0 || receipt.processedCount > MAX_TARGETS_PER_SEGMENT || receipt.processedCount !== receipt.nextCursor - receipt.startCursor || receipt.remainingCount !== plan.targets.length - receipt.nextCursor || receipt.reachedPlanEnd !== (receipt.nextCursor === plan.targets.length)) throw new Error('Monitoring ledger counters are inconsistent or exceed the segment bound');
    const expectedIds = plan.targets.slice(receipt.startCursor, receipt.nextCursor).map((item) => item.targetId).sort();
    const actualIds = receipt.results.map((item) => item.targetId).sort();
    if (new Set(actualIds).size !== actualIds.length || canonicalJson(actualIds) !== canonicalJson(expectedIds)) throw new Error('Monitoring segment contains duplicate or lost work');
    const expectedReviewIds = receipt.results.filter((item) => item.requiresReview).map((item) => stableReview(item, receipt.runId)).map((item) => item.reviewId).sort();
    const actualReviewIds = receipt.reviewQueue.map((item) => item.reviewId).sort();
    if (new Set(actualReviewIds).size !== actualReviewIds.length || canonicalJson(actualReviewIds) !== canonicalJson(expectedReviewIds)) throw new Error('Monitoring segment review queue is incomplete or duplicated');
    cursor = receipt.nextCursor;
    previous = receipt.receiptSha256;
  }
}

export async function executeMonitoringSegment(input: { plan: MonitoringPlan; store: MonitoringReceiptStore; runId: string; mode: SegmentReceiptBody['mode']; startCursor: number; previousReceiptSha256: string | null; adapter: ProbeAdapter; environment: ExecutionEnvironment; limit?: number }): Promise<SegmentReceipt> {
  const { plan } = input;
  assertRegisteredPlan(plan);
  if (!storeState.has(input.store)) throw new Error('Monitoring execution requires a registered authenticated receipt store');
  if (!Number.isInteger(input.startCursor) || input.startCursor < 0 || input.startCursor >= plan.targets.length) throw new Error('Monitoring cursor is invalid');
  let segmentIndex = 0;
  if (input.startCursor === 0) { if (input.previousReceiptSha256 !== null) throw new Error('Initial segment cannot have a prior receipt'); }
  else {
    if (!input.previousReceiptSha256) throw new Error('Resumed segment requires an authenticated prior receipt');
    const ledger = loadLedger(input.store, input.previousReceiptSha256);
    validateLedger(plan, ledger);
    const prior = ledger.at(-1)!;
    if (prior.nextCursor !== input.startCursor || prior.runId !== input.runId || prior.mode !== input.mode) throw new Error('Resume cursor, run, or mode changed');
    segmentIndex = ledger.length;
  }
  if (input.limit !== undefined && (!Number.isInteger(input.limit) || input.limit <= 0)) throw new Error('Monitoring segment limit is invalid');
  const limit = Math.min(input.limit ?? MAX_TARGETS_PER_SEGMENT, MAX_TARGETS_PER_SEGMENT);
  const nextCursor = Math.min(plan.targets.length, input.startCursor + limit);
  const results: MonitoringResult[] = [];
  for (const target of plan.targets.slice(input.startCursor, nextCursor)) results.push(await executeTarget(target, input.adapter, input.environment));
  const reviewQueue = results.filter((item) => item.requiresReview).map((item) => stableReview(item, input.runId));
  return commitReceipt(input.store, { schemaVersion: MONITORING_SCHEMA_VERSION, stageId: 'P8', runId: input.runId, mode: input.mode, planDigest: plan.planDigest, spreadsheetId: plan.spreadsheetId, spreadsheetRevisionId: plan.spreadsheetRevisionId, segmentIndex, startCursor: input.startCursor, nextCursor, targetDenominator: plan.targets.length, processedCount: results.length, remainingCount: plan.targets.length - nextCursor, previousReceiptSha256: input.previousReceiptSha256, reachedPlanEnd: nextCursor === plan.targets.length, results, reviewQueue });
}

export function finalizeMonitoringRun(plan: MonitoringPlan, store: MonitoringReceiptStore, tip: string): FinalizedRun {
  assertRegisteredPlan(plan);
  if (!storeState.has(store)) throw new Error('Monitoring finalization requires a registered authenticated receipt store');
  const ledger = loadLedger(store, tip);
  validateLedger(plan, ledger);
  if (ledger.length === 0 || ledger[0].startCursor !== 0 || ledger.at(-1)!.nextCursor !== plan.targets.length || !ledger.at(-1)!.reachedPlanEnd) throw new Error('Monitoring run cannot finalize before the complete denominator is authenticated');
  const results = ledger.flatMap((receipt) => receipt.results);
  const unique = new Set(results.map((item) => item.targetId));
  if (results.length !== plan.targets.length || unique.size !== plan.targets.length) throw new Error('Final monitoring run contains duplicate or lost work');
  const reviewQueue = mergeReviewQueue([], ledger.flatMap((receipt) => receipt.reviewQueue));
  const finalized: FinalizedRun = { schemaVersion: MONITORING_SCHEMA_VERSION, stageId: 'P8', runId: ledger[0].runId, mode: ledger[0].mode, planDigest: plan.planDigest, receiptTipSha256: tip, receiptCount: ledger.length, targetDenominator: plan.targets.length, processedCount: results.length, uniqueProcessedCount: unique.size, duplicateCount: results.length - unique.size, lostCount: plan.targets.length - unique.size, complete: true, results, reviewQueue, resultDigest: fingerprint(results.map(({ targetId, disposition, observationFingerprint }) => ({ targetId, disposition, observationFingerprint }))) };
  authenticatedFinalizations.set(finalized, { digest: fingerprint(finalized), targetIds: new Set(plan.targets.map((item) => item.targetId)) });
  return finalized;
}

export function applyReviewQueue(finalized: FinalizedRun, existing: ReviewQueueItem[]) {
  if (!finalized.complete || finalized.mode !== 'apply_review_queue') throw new Error('Only a complete authenticated apply run may publish a review queue');
  const authentication = authenticatedFinalizations.get(finalized);
  if (!authentication || authentication.digest !== fingerprint(finalized)) throw new Error('Review publication requires an unmodified runtime-authenticated finalization');
  if ([...existing, ...finalized.reviewQueue].some((item) => !authentication.targetIds.has(item.targetId))) throw new Error('Review publication contains a target outside the authenticated plan');
  const reviewQueue = mergeReviewQueue(existing, finalized.reviewQueue);
  return { reviewQueue, reviewQueuePublished: true, acceptedStatePublished: false as const, acceptedFactsChanged: false as const, acceptedStateReceiptBefore: finalized.planDigest, acceptedStateReceiptAfter: finalized.planDigest };
}

export function assertPrivacySafeArtifact(value: unknown): void {
  const serialized = canonicalJson(value).toLowerCase();
  for (const marker of ['date of birth', 'phone number', 'street address', 'transcript', 'recommendation letter', 'private_key', 'client_email', 'access_token', 'refresh_token']) if (serialized.includes(marker)) throw new Error(`Monitoring artifact contains forbidden marker ${marker}`);
}
