import { createHash } from 'node:crypto';
import * as cheerio from 'cheerio';
import { z } from 'zod';
import {
  ApplicationGroupSchema,
  CanonicalDatasetSchema,
  CycleSchema,
  EvidenceSchema,
  MODEL_SCHEMA_VERSION,
  ReviewItemSchema,
  ScholarshipSchema,
  SourceSchema,
  StudentFieldsSchema,
  evidenceId,
  sha256Text,
  stableId,
  type CanonicalDataset,
  type SourceArchitecture,
} from './canonicalModel';

export const ACQUISITION_SCHEMA_VERSION = 1 as const;

export const ACQUISITION_ROUTES = {
  single_award_page: 'single_page_extractor',
  multi_award_page: 'multi_award_section_splitter',
  directory_hub: 'directory_queue',
  paginated_catalog: 'pagination_cursor_engine',
  common_application: 'common_application_reader',
  matching_portal: 'matching_portal_review',
  external_marketplace: 'external_provider_queue',
  login_application_portal: 'access_review',
  document_or_pdf: 'document_parser',
  form_only: 'public_form_reader',
  institution_umbrella: 'institution_section_splitter',
  offline_or_automatic: 'offline_method_receipt',
  unknown: 'architecture_review',
} as const satisfies Record<SourceArchitecture, string>;

export type AcquisitionRoute = (typeof ACQUISITION_ROUTES)[SourceArchitecture];

const TRACKING_PARAMETER_PATTERNS = [
  /^utm_/i,
  /^(?:gclid|dclid|fbclid|msclkid)$/i,
  /^mc_(?:cid|eid)$/i,
  /^_ga(?:_|$)/i,
];

export interface CanonicalizedAcquisitionUrl {
  url: string;
  preservedQueryParameters: string[];
  removedTrackingParameters: string[];
  fragmentPreserved: boolean;
}

export function canonicalizeAcquisitionUrl(raw: string, base?: string): CanonicalizedAcquisitionUrl {
  const parsed = base ? new URL(raw, base) : new URL(raw);
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error(`Unsupported acquisition URL scheme: ${parsed.protocol}`);
  }
  parsed.hostname = parsed.hostname.toLowerCase();
  if ((parsed.protocol === 'https:' && parsed.port === '443') || (parsed.protocol === 'http:' && parsed.port === '80')) {
    parsed.port = '';
  }

  const kept: Array<[string, string]> = [];
  const removed: string[] = [];
  for (const [key, value] of parsed.searchParams.entries()) {
    if (TRACKING_PARAMETER_PATTERNS.some((pattern) => pattern.test(key))) removed.push(key);
    else kept.push([key, value]);
  }
  kept.sort(([leftKey, leftValue], [rightKey, rightValue]) =>
    leftKey.localeCompare(rightKey) || leftValue.localeCompare(rightValue));
  parsed.search = '';
  for (const [key, value] of kept) parsed.searchParams.append(key, value);
  if (parsed.pathname !== '/') parsed.pathname = parsed.pathname.replace(/\/+$/, '') || '/';

  return {
    url: parsed.toString(),
    preservedQueryParameters: [...new Set(kept.map(([key]) => key))].sort(),
    removedTrackingParameters: [...new Set(removed)].sort(),
    fragmentPreserved: parsed.hash.length > 1,
  };
}

export interface ArchitectureSignals {
  declaredArchitecture?: SourceArchitecture;
  offline?: boolean;
  document?: boolean;
  publicForm?: boolean;
  loginRequired?: boolean;
  dynamicApplication?: boolean;
  pagination?: boolean;
  directory?: boolean;
  externalProviders?: boolean;
  matching?: boolean;
  commonApplication?: boolean;
  multipleAwards?: boolean;
  singleAward?: boolean;
  institutionUmbrella?: boolean;
}

export interface ArchitectureClassification {
  architecture: SourceArchitecture;
  confidence: 'declared' | 'single_signal' | 'unknown';
  evidence: string[];
}

export function classifyArchitecture(signals: ArchitectureSignals): ArchitectureClassification {
  if (signals.declaredArchitecture) {
    return {
      architecture: signals.declaredArchitecture,
      confidence: 'declared',
      evidence: [`declared:${signals.declaredArchitecture}`],
    };
  }
  const candidates: Array<[SourceArchitecture, boolean | undefined, string]> = [
    ['offline_or_automatic', signals.offline, 'offline'],
    ['document_or_pdf', signals.document, 'document'],
    ['form_only', signals.publicForm, 'public_form'],
    ['login_application_portal', Boolean(signals.loginRequired || signals.dynamicApplication), 'login_or_dynamic'],
    ['paginated_catalog', signals.pagination, 'pagination'],
    ['directory_hub', signals.directory, 'directory'],
    ['external_marketplace', signals.externalProviders, 'external_providers'],
    ['matching_portal', signals.matching, 'matching'],
    ['common_application', signals.commonApplication, 'common_application'],
    ['institution_umbrella', signals.institutionUmbrella, 'institution_umbrella'],
    ['multi_award_page', signals.multipleAwards, 'multiple_awards'],
    ['single_award_page', signals.singleAward, 'single_award'],
  ];
  const observed = candidates.filter(([, present]) => present);
  if (observed.length === 1) {
    return { architecture: observed[0][0], confidence: 'single_signal', evidence: [observed[0][2]] };
  }
  return {
    architecture: 'unknown',
    confidence: 'unknown',
    evidence: observed.length === 0
      ? ['no_supported_architecture_signal']
      : [`ambiguous:${observed.map(([, , basis]) => basis).sort().join(',')}`],
  };
}

export function routeArchitecture(architecture: SourceArchitecture): AcquisitionRoute {
  return ACQUISITION_ROUTES[architecture];
}

function cleanText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

export interface SinglePageObservation {
  title: string;
  text: string;
  contentSha256: string;
}

export function extractSinglePage(html: string): SinglePageObservation {
  const $ = cheerio.load(html);
  $('script, style, iframe, noscript').remove();
  const title = cleanText($('h1').first().text() || $('title').first().text());
  const root = $('main').first().length ? $('main').first() : $('body');
  root.find('br').replaceWith(' ');
  root.find('h1, h2, h3, h4, h5, h6, p, li, div, section').each((_, element) => {
    $(element).append(' ');
  });
  const text = cleanText(root.text());
  if (!title || !text) throw new Error('Single-page fixture requires a title and visible text');
  return { title, text, contentSha256: sha256Text(text) };
}

export interface AwardSection {
  name: string;
  text: string;
  contentSha256: string;
}

export function splitMultiAwardSections(html: string): AwardSection[] {
  const $ = cheerio.load(html);
  $('script, style, iframe, noscript').remove();
  const headingSelector = '[data-award-name], h2, h3, h4';
  const sections: AwardSection[] = [];
  $(headingSelector).each((_, element) => {
    const heading = $(element);
    const explicitName = cleanText(heading.attr('data-award-name') ?? '');
    const headingText = cleanText(heading.text());
    const name = explicitName || headingText;
    if (!name) return;
    if (!explicitName && !/scholarship|award|grant|bursary|fellowship/i.test(name)) return;
    const body = cleanText(heading.nextUntil(headingSelector).map((_, sibling) => $(sibling).text()).get().join(' '));
    sections.push({ name, text: body, contentSha256: sha256Text(`${name}\n${body}`) });
  });
  const deduplicated = new Map<string, AwardSection>();
  for (const section of sections) {
    const key = section.name.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    if (key && !deduplicated.has(key)) deduplicated.set(key, section);
  }
  return [...deduplicated.values()];
}

export interface DirectoryEnumeration {
  links: Array<{ url: string; text: string }>;
  rejected: Array<{ href: string; reason: string }>;
}

export function enumerateDirectoryLinks(html: string, sourceUrl: string): DirectoryEnumeration {
  const $ = cheerio.load(html);
  const links = new Map<string, string>();
  const rejected: Array<{ href: string; reason: string }> = [];
  $('a[href]').each((_, element) => {
    const href = String($(element).attr('href') ?? '').trim();
    const text = cleanText($(element).text());
    try {
      const canonical = canonicalizeAcquisitionUrl(href, sourceUrl).url;
      if (!links.has(canonical)) links.set(canonical, text);
    } catch (error) {
      rejected.push({ href, reason: error instanceof Error ? error.message : String(error) });
    }
  });
  return {
    links: [...links.entries()].map(([url, text]) => ({ url, text })),
    rejected,
  };
}

export interface PaginationDiscovery {
  pages: Array<{ url: string; token: string }>;
  cursors: string[];
  rejected: Array<{ value: string; reason: string }>;
}

export function discoverPagination(html: string, sourceUrl: string): PaginationDiscovery {
  const $ = cheerio.load(html);
  const pages = new Map<string, string>();
  const cursors = new Set<string>();
  const rejected: Array<{ value: string; reason: string }> = [];
  $('a[rel="next"], a[data-page], a[href*="page="]').each((_, element) => {
    const href = String($(element).attr('href') ?? '').trim();
    try {
      const canonical = canonicalizeAcquisitionUrl(href, sourceUrl).url;
      const token = String($(element).attr('data-page') ?? new URL(canonical).searchParams.get('page') ?? canonical);
      pages.set(canonical, token);
    } catch (error) {
      rejected.push({ value: href, reason: error instanceof Error ? error.message : String(error) });
    }
  });
  $('[data-cursor]').each((_, element) => {
    const cursor = String($(element).attr('data-cursor') ?? '').trim();
    if (cursor) cursors.add(cursor);
  });
  return {
    pages: [...pages.entries()].map(([url, token]) => ({ url, token })),
    cursors: [...cursors].sort(),
    rejected,
  };
}

export function parseDocumentSections(text: string): AwardSection[] {
  const normalized = text.replace(/\r\n/g, '\n');
  const marker = /^(?:#{1,6}\s+|===\s*Award:\s*)(.+?)(?:\s*===)?\s*$/gm;
  const matches = [...normalized.matchAll(marker)];
  if (matches.length === 0) {
    const body = cleanText(normalized);
    return body ? [{ name: 'Document observation', text: body, contentSha256: sha256Text(body) }] : [];
  }
  return matches.map((match, index) => {
    const start = (match.index ?? 0) + match[0].length;
    const end = matches[index + 1]?.index ?? normalized.length;
    const name = cleanText(match[1]);
    const body = cleanText(normalized.slice(start, end));
    return { name, text: body, contentSha256: sha256Text(`${name}\n${body}`) };
  });
}

export interface PublicFormObservation {
  title: string;
  actionUrl: string | null;
  method: 'get' | 'post';
  fieldLabels: string[];
  controlCount: number;
  submitted: false;
  contentSha256: string;
}

export function readPublicForm(html: string, sourceUrl: string): PublicFormObservation {
  const $ = cheerio.load(html);
  const form = $('form').first();
  if (!form.length) throw new Error('Public-form fixture contains no form element');
  const title = cleanText($('h1').first().text() || $('title').first().text() || 'Public form');
  const rawAction = String(form.attr('action') ?? '').trim();
  let actionUrl: string | null = null;
  if (rawAction) actionUrl = canonicalizeAcquisitionUrl(rawAction, sourceUrl).url;
  const method = String(form.attr('method') ?? 'get').toLowerCase() === 'post' ? 'post' : 'get';
  const fieldLabels = $('label').map((_, element) => cleanText($(element).text())).get().filter(Boolean);
  const controlCount = form.find('input, select, textarea, button').length;
  const digestPayload = JSON.stringify({ title, actionUrl, method, fieldLabels, controlCount, submitted: false });
  return { title, actionUrl, method, fieldLabels, controlCount, submitted: false, contentSha256: sha256Text(digestPayload) };
}

export const WorkOutcomeSchema = z.enum([
  'success',
  'timeout',
  'network_error',
  'bot_block',
  'login_wall',
  'malformed',
]);
export type WorkOutcome = z.infer<typeof WorkOutcomeSchema>;

export interface AcquisitionWorkItem {
  key: string;
  url: string | null;
}

interface QueueCursorState {
  schemaVersion: 1;
  inputSha256: string;
  nextIndex: number;
  succeededKeys: string[];
  failedKeys: string[];
}

const QueueCursorStateSchema = z.object({
  schemaVersion: z.literal(ACQUISITION_SCHEMA_VERSION),
  inputSha256: z.string().regex(/^[0-9a-f]{64}$/),
  nextIndex: z.number().int().nonnegative(),
  succeededKeys: z.array(z.string().min(1)),
  failedKeys: z.array(z.string().min(1)),
});

export interface WorkFailure {
  key: string;
  outcome: Exclude<WorkOutcome, 'success'>;
  attempts: number;
}

export interface CompletenessReceipt {
  schemaVersion: 1;
  inputSha256: string;
  denominator: number;
  processedThisRun: number;
  processedTotal: number;
  succeededThisRun: number;
  succeededTotal: number;
  failedThisRun: number;
  failedTotal: number;
  remaining: number;
  queued: number;
  cap: number;
  maxAttempts: number;
  startIndex: number;
  nextIndex: number;
  succeededKeys: string[];
  failedKeys: string[];
  failures: WorkFailure[];
  cursor: string | null;
  complete: boolean;
}

function queueInputSha256(items: AcquisitionWorkItem[]): string {
  return sha256Text(JSON.stringify(items.map((item) => ({ key: item.key, url: item.url }))));
}

function encodeCursor(state: QueueCursorState): string {
  return Buffer.from(JSON.stringify(state)).toString('base64url');
}

function decodeCursor(cursor: string): QueueCursorState {
  try {
    return QueueCursorStateSchema.parse(JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')));
  } catch (error) {
    throw new Error(`Invalid acquisition cursor: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function runBoundedQueue(
  items: AcquisitionWorkItem[],
  options: {
    cap: number;
    maxAttempts: number;
    cursor?: string | null;
    execute: (item: AcquisitionWorkItem, attempt: number) => Promise<WorkOutcome> | WorkOutcome;
  },
): Promise<CompletenessReceipt> {
  if (!Number.isInteger(options.cap) || options.cap <= 0) throw new Error('Queue cap must be a positive integer');
  if (!Number.isInteger(options.maxAttempts) || options.maxAttempts <= 0) throw new Error('maxAttempts must be a positive integer');
  const keys = items.map((item) => item.key);
  if (new Set(keys).size !== keys.length) throw new Error('Queue work-item keys must be unique');
  const inputSha256 = queueInputSha256(items);
  const initial: QueueCursorState = {
    schemaVersion: ACQUISITION_SCHEMA_VERSION,
    inputSha256,
    nextIndex: 0,
    succeededKeys: [],
    failedKeys: [],
  };
  const state = options.cursor ? decodeCursor(options.cursor) : initial;
  if (state.inputSha256 !== inputSha256) throw new Error('Cursor does not match the acquisition work denominator');
  if (state.nextIndex < 0 || state.nextIndex > items.length) throw new Error('Cursor index is outside the work denominator');
  const cursorKeys = [...state.succeededKeys, ...state.failedKeys];
  if (new Set(cursorKeys).size !== cursorKeys.length) throw new Error('Cursor outcome keys must be unique and disjoint');
  const expectedProcessedKeys = keys.slice(0, state.nextIndex).sort();
  if (JSON.stringify([...cursorKeys].sort()) !== JSON.stringify(expectedProcessedKeys)) {
    throw new Error('Cursor outcome keys do not reconcile with its processed prefix');
  }

  const selected = items.slice(state.nextIndex, state.nextIndex + options.cap);
  const succeededKeys = [...state.succeededKeys];
  const failedKeys = [...state.failedKeys];
  const failures: WorkFailure[] = [];
  for (const item of selected) {
    let finalOutcome: WorkOutcome = 'network_error';
    let attempts = 0;
    for (let attempt = 1; attempt <= options.maxAttempts; attempt += 1) {
      attempts = attempt;
      finalOutcome = WorkOutcomeSchema.parse(await options.execute(item, attempt));
      if (finalOutcome === 'success') break;
      if (!['timeout', 'network_error'].includes(finalOutcome)) break;
    }
    if (finalOutcome === 'success') succeededKeys.push(item.key);
    else {
      failedKeys.push(item.key);
      failures.push({ key: item.key, outcome: finalOutcome, attempts });
    }
  }
  const nextIndex = state.nextIndex + selected.length;
  const remaining = items.length - nextIndex;
  const nextState: QueueCursorState = {
    schemaVersion: ACQUISITION_SCHEMA_VERSION,
    inputSha256,
    nextIndex,
    succeededKeys,
    failedKeys,
  };
  return {
    schemaVersion: ACQUISITION_SCHEMA_VERSION,
    inputSha256,
    denominator: items.length,
    processedThisRun: selected.length,
    processedTotal: nextIndex,
    succeededThisRun: selected.length - failures.length,
    succeededTotal: succeededKeys.length,
    failedThisRun: failures.length,
    failedTotal: failedKeys.length,
    remaining,
    queued: remaining,
    cap: options.cap,
    maxAttempts: options.maxAttempts,
    startIndex: state.nextIndex,
    nextIndex,
    succeededKeys,
    failedKeys,
    failures,
    cursor: remaining > 0 ? encodeCursor(nextState) : null,
    complete: remaining === 0,
  };
}

export interface FixtureWorkItem extends AcquisitionWorkItem {
  outcomes: WorkOutcome[];
}

export interface AcquisitionFixtureScenario {
  id: string;
  architecture: SourceArchitecture;
  sourceUrl: string | null;
  offlineAuthority: string | null;
  childNames: string[];
  applicationMode: z.infer<typeof ApplicationGroupSchema>['mode'] | null;
  workCap: number;
  maxAttempts: number;
  workItems: FixtureWorkItem[];
}

export async function runFixtureQueue(scenario: AcquisitionFixtureScenario): Promise<CompletenessReceipt[]> {
  const receipts: CompletenessReceipt[] = [];
  let cursor: string | null = null;
  do {
    const receipt = await runBoundedQueue(scenario.workItems, {
      cap: scenario.workCap,
      maxAttempts: scenario.maxAttempts,
      cursor,
      execute: (item, attempt) => {
        const fixture = scenario.workItems.find((candidate) => candidate.key === item.key);
        if (!fixture || fixture.outcomes.length === 0) return 'malformed';
        return fixture.outcomes[Math.min(attempt - 1, fixture.outcomes.length - 1)];
      },
    });
    receipts.push(receipt);
    cursor = receipt.cursor;
  } while (cursor);
  return receipts;
}

function unknownStudentFields(): z.infer<typeof StudentFieldsSchema> {
  return StudentFieldsSchema.parse({
    summary: { raw: null, state: 'unknown', evidenceIds: [] },
    awardAmount: { raw: null, minimum: null, maximum: null, currency: null, state: 'unknown', evidenceIds: [] },
    eligibility: {
      location: { raw: null, state: 'unknown' },
      minimumGpa: { raw: null, value: null, state: 'unknown' },
      schoolTypes: { raw: null, values: [], state: 'unknown' },
      focus: { raw: null, state: 'unknown' },
      gapYear: { raw: null, value: null, state: 'unknown' },
    },
    selection: { financialNeedPriority: { raw: null, value: null, state: 'unknown' } },
    renewal: { raw: null, value: null, state: 'unknown' },
  });
}

export function buildFixtureCanonicalGraph(
  scenario: AcquisitionFixtureScenario,
  observedAt: string,
): CanonicalDataset {
  const sourceCanonical = scenario.sourceUrl ? canonicalizeAcquisitionUrl(scenario.sourceUrl) : null;
  const parentSourceId = stableId('src', ['p3-fixture', scenario.id, sourceCanonical?.url ?? scenario.offlineAuthority]);
  const createsChildSources = ['directory_hub', 'paginated_catalog', 'external_marketplace'].includes(scenario.architecture);
  const childSourceIds = scenario.childNames.map((name, index) =>
    createsChildSources ? stableId('src', ['p3-fixture', scenario.id, 'child-source', index, name]) : parentSourceId);
  const distinctChildSourceIds = [...new Set(childSourceIds.filter((id) => id !== parentSourceId))];
  const failedWorkItems = scenario.workItems.flatMap((item) => {
    let finalOutcome: WorkOutcome = item.outcomes[0] ?? 'malformed';
    let succeeded = false;
    for (let attempt = 1; attempt <= scenario.maxAttempts; attempt += 1) {
      finalOutcome = item.outcomes[Math.min(attempt - 1, item.outcomes.length - 1)] ?? 'malformed';
      if (finalOutcome === 'success') {
        succeeded = true;
        break;
      }
      if (!['timeout', 'network_error'].includes(finalOutcome)) break;
    }
    return succeeded ? [] : [{ item, outcome: finalOutcome as Exclude<WorkOutcome, 'success'> }];
  });
  const failedSourceIds = new Map(failedWorkItems.map(({ item }) => [
    item.key,
    stableId('src', ['p3-fixture', scenario.id, 'failed-work', item.key]),
  ]));
  const failureBySourceId = new Map(failedWorkItems.map(({ item, outcome }) => [
    failedSourceIds.get(item.key)!,
    { key: item.key, outcome, url: item.url },
  ]));
  const scholarshipIds = scenario.childNames.map((name, index) => stableId('sch', ['p3-fixture', scenario.id, index, name]));
  const cycleIds = scholarshipIds.map((id) => stableId('cyc', ['p3-fixture', scenario.id, id, 'unknown-cycle']));
  const applicationGroupId = scenario.applicationMode
    ? stableId('app', ['p3-fixture', scenario.id, scenario.applicationMode])
    : null;
  const entitySubjects: Array<{ kind: 'source' | 'scholarship' | 'application_group' | 'cycle'; id: string }> = [
    { kind: 'source', id: parentSourceId },
    ...distinctChildSourceIds.map((id) => ({ kind: 'source' as const, id })),
    ...[...failedSourceIds.values()].map((id) => ({ kind: 'source' as const, id })),
    ...scholarshipIds.map((id) => ({ kind: 'scholarship' as const, id })),
    ...(applicationGroupId ? [{ kind: 'application_group' as const, id: applicationGroupId }] : []),
    ...cycleIds.map((id) => ({ kind: 'cycle' as const, id })),
  ];
  const evidence = entitySubjects.map((subject) => {
    const claim = `Sanitized P3 fixture ${scenario.id} produced an unverified ${subject.kind} acquisition observation.`;
    const identity = {
      subjectKind: subject.kind,
      subjectId: subject.id,
      fieldPath: 'acquisition.observation',
      sourceId: subject.kind === 'source' ? subject.id : parentSourceId,
      retrievedAt: observedAt,
      sourceRevision: 'sanitized-p3-fixture-v1',
      result: 'unverified' as const,
      claim,
      contentSha256: sha256Text(claim),
    };
    return EvidenceSchema.parse({
      schemaVersion: MODEL_SCHEMA_VERSION,
      id: evidenceId(identity),
      ...identity,
      reviewerState: 'manual_review',
    });
  });
  const evidenceBySubject = new Map(evidence.map((item) => [item.subjectId, [item.id]]));
  const reviewItems = entitySubjects.map((subject) => {
    const failure = failureBySourceId.get(subject.id);
    return ReviewItemSchema.parse({
    schemaVersion: MODEL_SCHEMA_VERSION,
    id: stableId('rev', ['p3-fixture', scenario.id, subject.kind, subject.id, 'requires-p4-verification']),
    subjectKind: subject.kind,
    subjectId: subject.id,
    reason: failure && ['bot_block', 'login_wall'].includes(failure.outcome)
      ? 'access_blocked'
      : ['login_application_portal', 'matching_portal'].includes(scenario.architecture)
        ? 'access_blocked'
      : 'source_manual_review',
    state: 'open',
    summary: failure
      ? `P3 work item ${failure.key} ended as ${failure.outcome}; it is inconclusive and requires review.`
      : `P3 acquisition fixture ${scenario.id} is an observation only; P4 verification is required.`,
    evidenceIds: evidenceBySubject.get(subject.id) ?? [],
    owner: null,
    targetStage: 'P4',
    });
  });
  const reviewsBySubject = new Map(reviewItems.map((item) => [item.subjectId, [item.id]]));

  const childSources = distinctChildSourceIds.map((id, childIndex) => {
    const name = scenario.childNames[childIndex] ?? `child-${childIndex + 1}`;
    const url = `https://fixtures.invalid/${encodeURIComponent(scenario.id)}/children/${childIndex + 1}-${encodeURIComponent(name.toLowerCase().replace(/[^a-z0-9]+/g, '-'))}`;
    return SourceSchema.parse({
      schemaVersion: MODEL_SCHEMA_VERSION,
      id,
      architecture: 'single_award_page',
      canonicalUrl: url,
      offlineAuthority: null,
      host: 'fixtures.invalid',
      identityPolicy: { preservedQueryParameters: [], fragmentPreserved: false, trackingParametersRemoved: false },
      accessBehavior: 'public',
      authority: scenario.architecture === 'external_marketplace' ? 'official_provider' : 'unknown',
      acquisitionState: 'observed',
      parentSourceIds: [parentSourceId],
      childSourceIds: [],
      evidenceIds: evidenceBySubject.get(id) ?? [],
      reviewItemIds: reviewsBySubject.get(id) ?? [],
      legacySourceIdentity: null,
    });
  });
  const failureSources = failedWorkItems.map(({ item, outcome }) => {
    const id = failedSourceIds.get(item.key)!;
    const canonical = item.url ? canonicalizeAcquisitionUrl(item.url) : null;
    return SourceSchema.parse({
      schemaVersion: MODEL_SCHEMA_VERSION,
      id,
      architecture: 'unknown',
      canonicalUrl: canonical?.url ?? null,
      offlineAuthority: canonical ? null : `Sanitized unresolved work item ${item.key}`,
      host: canonical ? new URL(canonical.url).hostname : null,
      identityPolicy: {
        preservedQueryParameters: canonical?.preservedQueryParameters ?? [],
        fragmentPreserved: canonical?.fragmentPreserved ?? false,
        trackingParametersRemoved: (canonical?.removedTrackingParameters.length ?? 0) > 0,
      },
      accessBehavior: ['bot_block', 'login_wall'].includes(outcome) ? 'authenticated' : 'unknown',
      authority: 'unknown',
      acquisitionState: ['bot_block', 'login_wall'].includes(outcome) ? 'blocked' : 'failed',
      parentSourceIds: [parentSourceId],
      childSourceIds: [],
      evidenceIds: evidenceBySubject.get(id) ?? [],
      reviewItemIds: reviewsBySubject.get(id) ?? [],
      legacySourceIdentity: null,
    });
  });
  const parentSource = SourceSchema.parse({
    schemaVersion: MODEL_SCHEMA_VERSION,
    id: parentSourceId,
    architecture: scenario.architecture,
    canonicalUrl: sourceCanonical?.url ?? null,
    offlineAuthority: sourceCanonical ? null : scenario.offlineAuthority,
    host: sourceCanonical ? new URL(sourceCanonical.url).hostname : null,
    identityPolicy: {
      preservedQueryParameters: sourceCanonical?.preservedQueryParameters ?? [],
      fragmentPreserved: sourceCanonical?.fragmentPreserved ?? false,
      trackingParametersRemoved: (sourceCanonical?.removedTrackingParameters.length ?? 0) > 0,
    },
    accessBehavior: scenario.architecture === 'offline_or_automatic'
      ? 'offline'
      : scenario.architecture === 'login_application_portal'
        ? 'authenticated'
        : scenario.architecture === 'unknown'
          ? 'unknown'
          : 'public',
    authority: scenario.architecture === 'external_marketplace' ? 'aggregator' : 'unknown',
    acquisitionState: ['login_application_portal', 'matching_portal'].includes(scenario.architecture)
      ? 'blocked'
      : scenario.architecture === 'unknown'
        ? 'unknown'
        : 'observed',
    parentSourceIds: [],
    childSourceIds: [...distinctChildSourceIds, ...failedSourceIds.values()],
    evidenceIds: evidenceBySubject.get(parentSourceId) ?? [],
    reviewItemIds: reviewsBySubject.get(parentSourceId) ?? [],
    legacySourceIdentity: null,
  });
  const scholarships = scenario.childNames.map((name, index) => ScholarshipSchema.parse({
    schemaVersion: MODEL_SCHEMA_VERSION,
    id: scholarshipIds[index],
    name,
    lifecycleState: 'modeled',
    legacyRowIdentities: [sha256Text(`sanitized-p3-fixture:${scenario.id}:${index}:${name}`)],
    sourceIds: [childSourceIds[index]],
    sourceLinks: [{
      sourceId: childSourceIds[index],
      role: createsChildSources ? 'detail' : 'information',
      provenance: ['sanitized-p3-fixture', `scenario:${scenario.id}`],
    }],
    applicationGroupIds: applicationGroupId ? [applicationGroupId] : [],
    cycleIds: [cycleIds[index]],
    evidenceIds: evidenceBySubject.get(scholarshipIds[index]) ?? [],
    reviewItemIds: reviewsBySubject.get(scholarshipIds[index]) ?? [],
    studentFields: unknownStudentFields(),
  }));
  const applicationGroups = applicationGroupId ? [ApplicationGroupSchema.parse({
    schemaVersion: MODEL_SCHEMA_VERSION,
    id: applicationGroupId,
    mode: scenario.applicationMode,
    sourceIds: [parentSourceId],
    scholarshipIds,
    supplementalRequirements: scenario.applicationMode === 'shared_with_supplements' ? 'mixed' : 'unknown',
    evidenceIds: evidenceBySubject.get(applicationGroupId) ?? [],
    reviewItemIds: reviewsBySubject.get(applicationGroupId) ?? [],
  })] : [];
  const cycles = scholarshipIds.map((scholarshipId, index) => CycleSchema.parse({
    schemaVersion: MODEL_SCHEMA_VERSION,
    id: cycleIds[index],
    scholarshipId,
    cycleKey: 'p3-observed-unknown',
    year: null,
    opensAt: { value: null, precision: 'unknown', timezone: null },
    closesAt: { value: null, precision: 'unknown', timezone: null },
    status: 'unknown',
    recurrence: 'unknown',
    applicationGroupId,
    evidenceIds: evidenceBySubject.get(cycleIds[index]) ?? [],
    reviewItemIds: reviewsBySubject.get(cycleIds[index]) ?? [],
  }));
  return CanonicalDatasetSchema.parse({
    schemaVersion: MODEL_SCHEMA_VERSION,
    pinnedInput: {
      p1InventorySha256: sha256Text('sanitized-p3-fixture-p1-inventory'),
      p1ManifestSha256: sha256Text('sanitized-p3-fixture-p1-manifest'),
      spreadsheetRevisionId: 'sanitized-p3-fixture',
      capturedAt: observedAt,
    },
    sources: [parentSource, ...childSources, ...failureSources].sort((left, right) => left.id.localeCompare(right.id)),
    scholarships: scholarships.sort((left, right) => left.id.localeCompare(right.id)),
    applicationGroups,
    cycles: cycles.sort((left, right) => left.id.localeCompare(right.id)),
    evidence: evidence.sort((left, right) => left.id.localeCompare(right.id)),
    reviewItems: reviewItems.sort((left, right) => left.id.localeCompare(right.id)),
    legacyBindings: [],
  });
}

export function deterministicJsonSha256(value: unknown): string {
  return createHash('sha256').update(`${JSON.stringify(value, null, 2)}\n`).digest('hex');
}
