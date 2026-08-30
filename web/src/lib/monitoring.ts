import { createHash } from 'node:crypto';

export const MONITORING_SCHEMA_VERSION = 1 as const;

export const DEFAULT_MONITORING_POLICY = {
  maxTargetsPerRun: 250,
  maxAttemptsPerTarget: 3,
  baseBackoffMs: 250,
  maximumBackoffMs: 1_000,
  minimumRequestSpacingMs: 100,
} as const;

export const FRESHNESS_POLICY = {
  activeCycleDays: 1,
  upcomingCycleDays: 3,
  unknownCycleDays: 7,
  portalDays: 7,
  inactiveCycleDays: 30,
  futureDatedEvidenceIsFresh: false,
} as const;

export type MonitoringMode = 'dry_run' | 'apply_review_queue';
export type ObservationKind =
  | 'unchanged'
  | 'not_found'
  | 'timeout'
  | 'bot_block'
  | 'redirect'
  | 'date_conflict'
  | 'portal_change';
export type MonitoringDisposition =
  | 'unchanged'
  | 'review_dead_link'
  | 'review_inconclusive'
  | 'review_redirect'
  | 'review_date_conflict'
  | 'review_portal_change';

export interface LegacyTestingSheetRow {
  'Last Updated': string;
  'Due Date': string;
  'In-State / National': string;
  'Portal/ Scholarship': string;
  'Amount': string;
  'Scholarship Location/Information': string;
  'Name of Scholarship': string;
  'Application Link/Method': string;
  'Summary': string;
  'Stated Min. GPA': string;
  'School Type (2-or 4-Year, or Trade)': string;
  'Renewing/ Non-Renewing': string;
  'Focus': string;
  'Acute Financial Need Prioritization': string;
  'Accepts Gap Year Applications Upon Return': string;
}

export interface MonitoringTarget {
  targetId: string;
  sheetRow: number;
  name: string;
  recordType: 'Scholarship' | 'Portal';
  informationUrls: string[];
  applicationUrls: string[];
  acceptedFingerprint: string;
}

export interface MonitoringObservation {
  targetId: string;
  kind: ObservationKind;
  observedFingerprint?: string;
  finalUrl?: string;
  detail?: string;
  attempts?: number;
}

export interface MonitoringResult {
  targetId: string;
  sheetRow: number;
  recordType: MonitoringTarget['recordType'];
  disposition: MonitoringDisposition;
  requiresReview: boolean;
  severity: 'high' | 'medium' | null;
  reason: string;
  attempts: number;
  retryDelaysMs: number[];
  acceptedFactMutation: false;
}

export interface ReviewQueueItem {
  reviewId: string;
  targetId: string;
  sheetRow: number;
  severity: 'high' | 'medium';
  disposition: Exclude<MonitoringDisposition, 'unchanged'>;
  reason: string;
  state: 'open';
  acceptedFactMutation: false;
}

export interface MonitoringRunBody {
  schemaVersion: typeof MONITORING_SCHEMA_VERSION;
  stageId: 'P8';
  runId: string;
  mode: MonitoringMode;
  observedAt: string;
  source: {
    spreadsheetId: string;
    sheetName: string;
    spreadsheetRevisionId: string;
    sourceMode: 'accepted_revision_fixture';
    liveReadPerformed: false;
  };
  policy: typeof DEFAULT_MONITORING_POLICY;
  rateLimitPlan: {
    plannedRequests: number;
    firstOffsetMs: number;
    lastOffsetMs: number;
  };
  inputDigest: string;
  startCursor: number;
  nextCursor: number | null;
  targetDenominator: number;
  processedCount: number;
  uniqueProcessedCount: number;
  duplicateCount: number;
  remainingCount: number;
  status: 'completed' | 'failed';
  failureReason: string | null;
  results: MonitoringResult[];
  resultDigest: string;
  reviewQueue: ReviewQueueItem[];
  publication: {
    acceptedStatePublished: false;
    acceptedFactsChanged: false;
    reviewQueuePublished: boolean;
  };
  notification: {
    channel: 'artifact_only';
    externalNotificationSent: false;
    reviewCount: number;
    highCount: number;
    mediumCount: number;
  };
}

export type MonitoringRunReceipt = MonitoringRunBody & { receiptSha256: string };

const PUBLIC_URL_PATTERN = /https:\/\/[^\s<>'")\]]+/gi;
const FORBIDDEN_PRIVACY_MARKERS = [
  'applicant',
  'date of birth',
  'phone number',
  'street address',
  'transcript',
  'recommendation letter',
  'private_key',
  'client_email',
  'credential',
  'access_token',
  'refresh_token',
];

export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map((item) => canonicalJson(item)).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

function publicUrls(value: string): string[] {
  return [...new Set((value.match(PUBLIC_URL_PATTERN) ?? []).map((raw) => {
    const parsed = new URL(raw.replace(/[.,;:]+$/, ''));
    if (parsed.protocol !== 'https:') throw new Error(`Monitoring target URL must use HTTPS: ${parsed.protocol}`);
    return parsed.toString();
  }))].sort();
}

export function buildTestingSheetTargets(rows: LegacyTestingSheetRow[]): MonitoringTarget[] {
  const targets = rows.map((row, index): MonitoringTarget => {
    const sheetRow = index + 2;
    const name = row['Name of Scholarship'].trim();
    if (!name) throw new Error(`Testing-sheet row ${sheetRow} has no public scholarship name`);
    const recordType = row['Portal/ Scholarship'];
    if (recordType !== 'Scholarship' && recordType !== 'Portal') {
      throw new Error(`Testing-sheet row ${sheetRow} has unsupported record type ${recordType}`);
    }
    const publicMonitorFields = {
      sheetRow,
      name,
      recordType,
      lastUpdated: row['Last Updated'],
      dueDate: row['Due Date'],
      scope: row['In-State / National'],
      amount: row.Amount,
      information: row['Scholarship Location/Information'],
      application: row['Application Link/Method'],
      minimumGpa: row['Stated Min. GPA'],
      schoolType: row['School Type (2-or 4-Year, or Trade)'],
      renewal: row['Renewing/ Non-Renewing'],
      focus: row.Focus,
      acuteNeed: row['Acute Financial Need Prioritization'],
      gapYear: row['Accepts Gap Year Applications Upon Return'],
    };
    const acceptedFingerprint = sha256(canonicalJson(publicMonitorFields));
    return {
      targetId: `p8-target-${sha256(canonicalJson([sheetRow, name, recordType])).slice(0, 20)}`,
      sheetRow,
      name,
      recordType,
      informationUrls: publicUrls(row['Scholarship Location/Information']),
      applicationUrls: publicUrls(row['Application Link/Method']),
      acceptedFingerprint,
    };
  });
  if (new Set(targets.map((target) => target.targetId)).size !== targets.length) {
    throw new Error('Monitoring target identities are not unique');
  }
  return targets;
}

export function deterministicRetryDelays(policy = DEFAULT_MONITORING_POLICY): number[] {
  const delays = Array.from({ length: Math.max(0, policy.maxAttemptsPerTarget - 1) }, (_, index) =>
    Math.min(policy.maximumBackoffMs, policy.baseBackoffMs * (2 ** index)));
  if (delays.some((delay) => delay > policy.maximumBackoffMs)) {
    throw new Error('Retry policy exceeds its maximum backoff');
  }
  return delays;
}

export function plannedRequestOffsets(
  count: number,
  policy = DEFAULT_MONITORING_POLICY,
): number[] {
  if (!Number.isInteger(count) || count < 0 || count > policy.maxTargetsPerRun) {
    throw new Error('Request plan count exceeds the bounded monitoring policy');
  }
  return Array.from({ length: count }, (_, index) => index * policy.minimumRequestSpacingMs);
}

export function classifyMonitoringObservation(
  target: MonitoringTarget,
  observation: MonitoringObservation,
): MonitoringResult {
  if (observation.targetId !== target.targetId) throw new Error('Observation target identity mismatch');
  const attempts = observation.attempts ?? ((observation.kind === 'timeout' || observation.kind === 'bot_block')
    ? DEFAULT_MONITORING_POLICY.maxAttemptsPerTarget
    : 1);
  if (!Number.isInteger(attempts) || attempts < 1 || attempts > DEFAULT_MONITORING_POLICY.maxAttemptsPerTarget) {
    throw new Error('Observation attempts violate the bounded retry policy');
  }
  const retryDelaysMs = deterministicRetryDelays().slice(0, attempts - 1);
  const common = {
    targetId: target.targetId,
    sheetRow: target.sheetRow,
    recordType: target.recordType,
    acceptedFactMutation: false as const,
    attempts,
    retryDelaysMs,
  };
  if (observation.kind === 'unchanged') {
    if (observation.observedFingerprint && observation.observedFingerprint !== target.acceptedFingerprint) {
      throw new Error('Unchanged observation does not match the accepted target fingerprint');
    }
    return {
      ...common,
      disposition: 'unchanged',
      requiresReview: false,
      severity: null,
      reason: 'Accepted public-field fingerprint is unchanged; no factual acceptance or mutation occurred.',
    };
  }
  if (observation.kind === 'not_found') {
    return {
      ...common,
      disposition: 'review_dead_link',
      requiresReview: true,
      severity: target.applicationUrls.length > 0 ? 'high' : 'medium',
      reason: 'A simulated 404 proves only that one target was unavailable at observation time; archive and accepted-state mutation are prohibited.',
    };
  }
  if (observation.kind === 'timeout' || observation.kind === 'bot_block') {
    return {
      ...common,
      disposition: 'review_inconclusive',
      requiresReview: true,
      severity: 'high',
      reason: `${observation.kind.replace('_', ' ')} is inconclusive and preserves the prior accepted facts pending review.`,
    };
  }
  if (observation.kind === 'redirect') {
    return {
      ...common,
      disposition: 'review_redirect',
      requiresReview: true,
      severity: 'medium',
      reason: 'A simulated redirect is a candidate link change only; the final authority and application role require review.',
    };
  }
  if (observation.kind === 'date_conflict') {
    return {
      ...common,
      disposition: 'review_date_conflict',
      requiresReview: true,
      severity: 'high',
      reason: 'A simulated date conflict cannot overwrite the accepted cycle and requires source-authority review.',
    };
  }
  return {
    ...common,
    disposition: 'review_portal_change',
    requiresReview: true,
    severity: 'medium',
    reason: 'A simulated portal change is queued with its denominator; no child, result, or award is silently accepted or dropped.',
  };
}

function sealReceipt(body: MonitoringRunBody): MonitoringRunReceipt {
  return { ...body, receiptSha256: sha256(canonicalJson(body)) };
}

export function verifyMonitoringReceipt(receipt: MonitoringRunReceipt): boolean {
  const { receiptSha256, ...body } = receipt;
  return receiptSha256 === sha256(canonicalJson(body));
}

export function runMonitoring(input: {
  runId: string;
  observedAt: string;
  mode: MonitoringMode;
  targets: MonitoringTarget[];
  observations?: MonitoringObservation[];
  startCursor?: number;
  stopAfter?: number;
  spreadsheetId: string;
  sheetName: string;
  spreadsheetRevisionId: string;
}): MonitoringRunReceipt {
  if (Number.isNaN(Date.parse(input.observedAt))) throw new Error('Monitoring observation time must be ISO-compatible');
  if (input.targets.length > DEFAULT_MONITORING_POLICY.maxTargetsPerRun) {
    throw new Error('Monitoring target denominator exceeds the bounded run policy');
  }
  const startCursor = input.startCursor ?? 0;
  if (!Number.isInteger(startCursor) || startCursor < 0 || startCursor > input.targets.length) {
    throw new Error('Monitoring start cursor is outside the target denominator');
  }
  const stopAfter = input.stopAfter ?? input.targets.length - startCursor;
  if (!Number.isInteger(stopAfter) || stopAfter < 0) throw new Error('Monitoring stopAfter must be a nonnegative integer');
  const endCursor = Math.min(input.targets.length, startCursor + stopAfter);
  const observationByTarget = new Map((input.observations ?? []).map((item) => [item.targetId, item]));
  if (observationByTarget.size !== (input.observations ?? []).length) throw new Error('Monitoring observations contain duplicate target identities');

  const selected = input.targets.slice(startCursor, endCursor);
  const results = selected.map((target) => classifyMonitoringObservation(
    target,
    observationByTarget.get(target.targetId) ?? {
      targetId: target.targetId,
      kind: 'unchanged',
      observedFingerprint: target.acceptedFingerprint,
    },
  ));
  const uniqueProcessedCount = new Set(results.map((result) => result.targetId)).size;
  const reviewQueue = results.flatMap((result): ReviewQueueItem[] => result.requiresReview ? [{
    reviewId: `p8-review-${sha256(canonicalJson([input.runId, result.targetId, result.disposition])).slice(0, 20)}`,
    targetId: result.targetId,
    sheetRow: result.sheetRow,
    severity: result.severity!,
    disposition: result.disposition as Exclude<MonitoringDisposition, 'unchanged'>,
    reason: result.reason,
    state: 'open',
    acceptedFactMutation: false,
  }] : []);
  const status = endCursor === input.targets.length ? 'completed' : 'failed';
  const requestOffsets = plannedRequestOffsets(selected.length);
  const reviewQueuePublished = input.mode === 'apply_review_queue' && status === 'completed';
  const body: MonitoringRunBody = {
    schemaVersion: MONITORING_SCHEMA_VERSION,
    stageId: 'P8',
    runId: input.runId,
    mode: input.mode,
    observedAt: input.observedAt,
    source: {
      spreadsheetId: input.spreadsheetId,
      sheetName: input.sheetName,
      spreadsheetRevisionId: input.spreadsheetRevisionId,
      sourceMode: 'accepted_revision_fixture',
      liveReadPerformed: false,
    },
    policy: DEFAULT_MONITORING_POLICY,
    rateLimitPlan: {
      plannedRequests: requestOffsets.length,
      firstOffsetMs: requestOffsets[0] ?? 0,
      lastOffsetMs: requestOffsets.at(-1) ?? 0,
    },
    inputDigest: sha256(canonicalJson(input.targets)),
    startCursor,
    nextCursor: status === 'completed' ? null : endCursor,
    targetDenominator: input.targets.length,
    processedCount: results.length,
    uniqueProcessedCount,
    duplicateCount: results.length - uniqueProcessedCount,
    remainingCount: input.targets.length - endCursor,
    status,
    failureReason: status === 'failed' ? 'simulated_partial_run_interruption' : null,
    results,
    resultDigest: sha256(canonicalJson(results.map(({ targetId, disposition, acceptedFactMutation }) => ({ targetId, disposition, acceptedFactMutation })))),
    reviewQueue,
    publication: {
      acceptedStatePublished: false,
      acceptedFactsChanged: false,
      reviewQueuePublished,
    },
    notification: {
      channel: 'artifact_only',
      externalNotificationSent: false,
      reviewCount: reviewQueue.length,
      highCount: reviewQueue.filter((item) => item.severity === 'high').length,
      mediumCount: reviewQueue.filter((item) => item.severity === 'medium').length,
    },
  };
  return sealReceipt(body);
}

export function reconcileRecoveredRun(
  interrupted: MonitoringRunReceipt,
  resumed: MonitoringRunReceipt,
  lastAcceptedReceiptSha256: string,
) {
  if (!verifyMonitoringReceipt(interrupted) || !verifyMonitoringReceipt(resumed)) {
    throw new Error('Recovery requires immutable valid run receipts');
  }
  if (interrupted.status !== 'failed' || interrupted.nextCursor === null) {
    throw new Error('Recovery requires an interrupted receipt with a resumable cursor');
  }
  if (resumed.startCursor !== interrupted.nextCursor || resumed.status !== 'completed') {
    throw new Error('Recovery receipt does not resume exactly from the interruption cursor');
  }
  if (resumed.inputDigest !== interrupted.inputDigest || resumed.targetDenominator !== interrupted.targetDenominator) {
    throw new Error('Recovery input identity changed across the partial run');
  }
  const combined = [...interrupted.results, ...resumed.results];
  const unique = new Set(combined.map((result) => result.targetId));
  const complete = combined.length === interrupted.targetDenominator && unique.size === interrupted.targetDenominator;
  if (!complete) throw new Error('Recovered run contains duplicate or lost work');
  return {
    schemaVersion: MONITORING_SCHEMA_VERSION,
    stageId: 'P8' as const,
    interruptedReceiptSha256: interrupted.receiptSha256,
    resumedReceiptSha256: resumed.receiptSha256,
    targetDenominator: interrupted.targetDenominator,
    processedCount: combined.length,
    uniqueProcessedCount: unique.size,
    duplicateCount: combined.length - unique.size,
    lostCount: interrupted.targetDenominator - unique.size,
    recoveryCompleted: true,
    acceptedStateReceiptBefore: lastAcceptedReceiptSha256,
    acceptedStateReceiptAfter: lastAcceptedReceiptSha256,
    acceptedFactsChanged: false,
  };
}

export function assertPrivacySafeArtifact(value: unknown): void {
  const serialized = canonicalJson(value).toLowerCase();
  for (const marker of FORBIDDEN_PRIVACY_MARKERS) {
    if (serialized.includes(marker)) throw new Error(`Monitoring artifact contains forbidden privacy marker: ${marker}`);
  }
}
