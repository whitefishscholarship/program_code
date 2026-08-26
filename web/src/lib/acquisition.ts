import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
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
  occurrence: number;
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
    sections.push({ occurrence: sections.length, name, text: body, contentSha256: sha256Text(`${name}\n${body}`) });
  });
  return sections;
}

export interface DirectoryEnumeration {
  links: Array<{ occurrence: number; url: string; text: string }>;
  rejected: Array<{ href: string; reason: string }>;
}

export function enumerateDirectoryLinks(html: string, sourceUrl: string): DirectoryEnumeration {
  const $ = cheerio.load(html);
  const links: Array<{ occurrence: number; url: string; text: string }> = [];
  const rejected: Array<{ href: string; reason: string }> = [];
  $('a[href]').each((_, element) => {
    const href = String($(element).attr('href') ?? '').trim();
    const text = cleanText($(element).text());
    try {
      const canonical = canonicalizeAcquisitionUrl(href, sourceUrl).url;
      links.push({ occurrence: links.length, url: canonical, text });
    } catch (error) {
      rejected.push({ href, reason: error instanceof Error ? error.message : String(error) });
    }
  });
  return {
    links,
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
    return body ? [{ occurrence: 0, name: 'Document observation', text: body, contentSha256: sha256Text(body) }] : [];
  }
  return matches.map((match, index) => {
    const start = (match.index ?? 0) + match[0].length;
    const end = matches[index + 1]?.index ?? normalized.length;
    const name = cleanText(match[1]);
    const body = cleanText(normalized.slice(start, end));
    return { occurrence: index, name, text: body, contentSha256: sha256Text(`${name}\n${body}`) };
  });
}

export interface PublicFormObservation {
  title: string;
  actionUrl: string | null;
  method: 'get' | 'post';
  fieldLabels: string[];
  questions: Array<{ occurrence: number; label: string; controlTypes: string[]; required: boolean }>;
  controlCount: number;
  submitted: false;
  contentSha256: string;
}

export function readPublicForm(html: string, sourceUrl: string): PublicFormObservation {
  const $ = cheerio.load(html);
  const form = $('form').first();
  if (!form.length) throw new Error('Public-form fixture contains no form element');
  const heading = $('h1').first().length ? $('h1').first() : $('title').first();
  const headingClone = heading.clone();
  headingClone.find('input, select, textarea, option, button, script, style').remove();
  const title = cleanText(headingClone.text()) || 'Public form';
  const rawAction = String(form.attr('action') ?? '').trim();
  let actionUrl: string | null = null;
  if (rawAction) actionUrl = canonicalizeAcquisitionUrl(rawAction, sourceUrl).url;
  const method = String(form.attr('method') ?? 'get').toLowerCase() === 'post' ? 'post' : 'get';
  const questions: PublicFormObservation['questions'] = [];
  const seenElements = new Set<unknown>();
  form.find('label, [role="listitem"] [role="heading"], [data-question-title], .M7eMe').each((_, element) => {
    if (seenElements.has(element)) return;
    seenElements.add(element);
    const node = $(element);
    const labelClone = node.clone();
    labelClone.find('input, select, textarea, option, button, script, style').remove();
    const label = cleanText(labelClone.text());
    if (!label) return;
    const container = node.closest('[role="listitem"], label, fieldset, [data-question]');
    let controls = (container.length ? container : node.parent()).find('input, select, textarea');
    const forId = String(node.attr('for') ?? '');
    if (!controls.length && forId) {
      controls = form.find('input, select, textarea').filter((__, control) => String($(control).attr('id') ?? '') === forId);
    }
    if (!controls.length && node.is('label')) controls = node.nextAll('input, select, textarea').first();
    const controlTypes = [...new Set(controls.map((__, control) => {
      const tag = String(control.tagName ?? '').toLowerCase();
      return tag === 'input' ? String($(control).attr('type') ?? 'text').toLowerCase() : tag;
    }).get())].sort();
    const required = controls.is('[required], [aria-required="true"]') || container.is('[aria-required="true"]');
    questions.push({ occurrence: questions.length, label, controlTypes, required });
  });
  const fieldLabels = questions.map((question) => question.label);
  const controlCount = form.find('input, select, textarea, button').length;
  const digestPayload = JSON.stringify({ title, actionUrl, method, fieldLabels, questions, controlCount, submitted: false });
  return { title, actionUrl, method, fieldLabels, questions, controlCount, submitted: false, contentSha256: sha256Text(digestPayload) };
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
  previousReceiptSha256: string;
}

const QueueCursorStateSchema = z.object({
  schemaVersion: z.literal(ACQUISITION_SCHEMA_VERSION),
  inputSha256: z.string().regex(/^[0-9a-f]{64}$/),
  nextIndex: z.number().int().nonnegative(),
  previousReceiptSha256: z.string().regex(/^[0-9a-f]{64}$/),
});

export interface WorkFailure {
  key: string;
  outcome: Exclude<WorkOutcome, 'success'>;
  attempts: number;
  detail: string | null;
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
  previousReceiptSha256: string | null;
  receiptSha256: string;
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

export interface ReceiptStore {
  read(receiptSha256: string): CompletenessReceipt | null;
}

const receiptStoreState = new WeakMap<ReceiptStore, string>();

export function createReceiptStore(directory: string): ReceiptStore {
  const resolvedDirectory = path.resolve(directory);
  fs.mkdirSync(resolvedDirectory, { recursive: true, mode: 0o700 });
  const store: ReceiptStore = {
    read(receiptSha256) {
      if (!/^[0-9a-f]{64}$/.test(receiptSha256)) throw new Error('Receipt digest is invalid');
      const receiptPath = path.join(resolvedDirectory, `${receiptSha256}.json`);
      if (!fs.existsSync(receiptPath)) return null;
      const receipt = JSON.parse(fs.readFileSync(receiptPath, 'utf8')) as CompletenessReceipt;
      if (receipt.receiptSha256 !== receiptSha256) throw new Error('Stored receipt filename and digest differ');
      return receipt;
    },
  };
  receiptStoreState.set(store, resolvedDirectory);
  return Object.freeze(store);
}

function commitReceipt(store: ReceiptStore, receipt: CompletenessReceipt): void {
  const directory = receiptStoreState.get(store);
  if (!directory) throw new Error('Receipt store must be created by createReceiptStore');
  const receiptPath = path.join(directory, `${receipt.receiptSha256}.json`);
  const serialized = `${JSON.stringify(receipt, null, 2)}\n`;
  try {
    fs.writeFileSync(receiptPath, serialized, { flag: 'wx', mode: 0o600 });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
    if (fs.readFileSync(receiptPath, 'utf8') !== serialized) throw new Error('Receipt store is append-only');
  }
}

function receiptDigest(receipt: Omit<CompletenessReceipt, 'receiptSha256' | 'cursor'>): string {
  return sha256Text(JSON.stringify(receipt));
}

function classifyThrownError(error: unknown): { outcome: 'timeout' | 'network_error'; detail: string } {
  const candidate = error instanceof Error ? error : new Error(String(error));
  const code = typeof (candidate as Error & { code?: unknown }).code === 'string'
    ? (candidate as Error & { code: string }).code
    : '';
  const detail = cleanText([candidate.name, code, candidate.message].filter(Boolean).join(':')).slice(0, 240);
  return {
    outcome: candidate.name === 'AbortError' || /timeout|timed out|ETIMEDOUT/i.test(`${code} ${candidate.message}`)
      ? 'timeout'
      : 'network_error',
    detail,
  };
}

function validateReceiptLedger(items: AcquisitionWorkItem[], receipts: CompletenessReceipt[], inputSha256: string): void {
  let nextIndex = 0;
  let previousReceiptSha256: string | null = null;
  const keys = items.map((item) => item.key);
  for (const receipt of receipts) {
    if (receipt.inputSha256 !== inputSha256 || receipt.denominator !== items.length) throw new Error('Receipt ledger denominator mismatch');
    if (receipt.startIndex !== nextIndex || receipt.previousReceiptSha256 !== previousReceiptSha256) throw new Error('Receipt ledger chain is not contiguous');
    const receiptSha256 = receipt.receiptSha256;
    const digestBody = structuredClone(receipt) as Partial<CompletenessReceipt>;
    delete digestBody.receiptSha256;
    delete digestBody.cursor;
    if (receiptDigest(digestBody as Omit<CompletenessReceipt, 'receiptSha256' | 'cursor'>) !== receiptSha256) throw new Error('Receipt ledger digest mismatch');
    const runKeys = [...receipt.succeededKeys, ...receipt.failedKeys];
    const expected = keys.slice(receipt.startIndex, receipt.nextIndex);
    if (new Set(runKeys).size !== runKeys.length || JSON.stringify([...runKeys].sort()) !== JSON.stringify([...expected].sort())) {
      throw new Error('Receipt outcomes do not reconcile with its processed segment');
    }
    if (receipt.failures.length !== receipt.failedKeys.length || receipt.failures.some((failure) => !receipt.failedKeys.includes(failure.key))) {
      throw new Error('Receipt failure details do not reconcile');
    }
    nextIndex = receipt.nextIndex;
    previousReceiptSha256 = receipt.receiptSha256;
  }
}

function loadReceiptLedger(
  items: AcquisitionWorkItem[],
  store: ReceiptStore,
  tipSha256: string,
  inputSha256: string,
): CompletenessReceipt[] {
  const reversed: CompletenessReceipt[] = [];
  const visited = new Set<string>();
  let digest: string | null = tipSha256;
  while (digest) {
    if (visited.has(digest)) throw new Error('Receipt ledger contains a cycle');
    visited.add(digest);
    const receipt = store.read(digest);
    if (!receipt) throw new Error('Cursor receipt tip is absent from the trusted receipt store');
    reversed.push(receipt);
    digest = receipt.previousReceiptSha256;
  }
  const receipts = reversed.reverse();
  validateReceiptLedger(items, receipts, inputSha256);
  return receipts;
}

export async function runBoundedQueue(
  items: AcquisitionWorkItem[],
  options: {
    cap: number;
    maxAttempts: number;
    cursor?: string | null;
    receiptStore: ReceiptStore;
    execute: (item: AcquisitionWorkItem, attempt: number) => Promise<WorkOutcome> | WorkOutcome;
  },
): Promise<CompletenessReceipt> {
  if (!Number.isInteger(options.cap) || options.cap <= 0) throw new Error('Queue cap must be a positive integer');
  if (!Number.isInteger(options.maxAttempts) || options.maxAttempts <= 0) throw new Error('maxAttempts must be a positive integer');
  if (!receiptStoreState.has(options.receiptStore)) throw new Error('Receipt store must be created by createReceiptStore');
  const keys = items.map((item) => item.key);
  if (new Set(keys).size !== keys.length) throw new Error('Queue work-item keys must be unique');
  const inputSha256 = queueInputSha256(items);
  const state: QueueCursorState = options.cursor ? decodeCursor(options.cursor) : {
    schemaVersion: ACQUISITION_SCHEMA_VERSION, inputSha256, nextIndex: 0, previousReceiptSha256: sha256Text('genesis'),
  };
  const previousReceipts = options.cursor
    ? loadReceiptLedger(items, options.receiptStore, state.previousReceiptSha256, inputSha256)
    : [];
  if (state.inputSha256 !== inputSha256) throw new Error('Cursor does not match the acquisition work denominator');
  if (state.nextIndex < 0 || state.nextIndex > items.length) throw new Error('Cursor index is outside the work denominator');
  if (options.cursor) {
    const last = previousReceipts.at(-1)!;
    if (state.nextIndex !== last.nextIndex || state.previousReceiptSha256 !== last.receiptSha256) {
      throw new Error('Cursor does not match the prior receipt ledger tip');
    }
  }

  const selected = items.slice(state.nextIndex, state.nextIndex + options.cap);
  const succeededKeys: string[] = [];
  const failedKeys: string[] = [];
  const failures: WorkFailure[] = [];
  for (const item of selected) {
    let finalOutcome: WorkOutcome = 'network_error';
    let attempts = 0;
    for (let attempt = 1; attempt <= options.maxAttempts; attempt += 1) {
      attempts = attempt;
      let thrownDetail: string | null = null;
      try {
        finalOutcome = WorkOutcomeSchema.parse(await options.execute(item, attempt));
      } catch (error) {
        const classified = classifyThrownError(error);
        finalOutcome = classified.outcome;
        thrownDetail = classified.detail;
      }
      if (finalOutcome === 'success') break;
      if (!['timeout', 'network_error'].includes(finalOutcome)) break;
      if (attempt === options.maxAttempts && thrownDetail) failures.push({ key: item.key, outcome: finalOutcome, attempts, detail: thrownDetail });
    }
    if (finalOutcome === 'success') succeededKeys.push(item.key);
    else {
      failedKeys.push(item.key);
      if (!failures.some((failure) => failure.key === item.key)) failures.push({ key: item.key, outcome: finalOutcome, attempts, detail: null });
    }
  }
  const nextIndex = state.nextIndex + selected.length;
  const remaining = items.length - nextIndex;
  const priorSuccesses = previousReceipts.reduce((count, receipt) => count + receipt.succeededThisRun, 0);
  const priorFailures = previousReceipts.reduce((count, receipt) => count + receipt.failedThisRun, 0);
  const body: Omit<CompletenessReceipt, 'receiptSha256' | 'cursor'> = {
    schemaVersion: ACQUISITION_SCHEMA_VERSION,
    inputSha256,
    denominator: items.length,
    processedThisRun: selected.length,
    processedTotal: nextIndex,
    succeededThisRun: selected.length - failures.length,
    succeededTotal: priorSuccesses + succeededKeys.length,
    failedThisRun: failures.length,
    failedTotal: priorFailures + failedKeys.length,
    remaining,
    queued: remaining,
    cap: options.cap,
    maxAttempts: options.maxAttempts,
    startIndex: state.nextIndex,
    nextIndex,
    previousReceiptSha256: previousReceipts.at(-1)?.receiptSha256 ?? null,
    succeededKeys,
    failedKeys,
    failures,
    complete: remaining === 0,
  };
  const receiptSha256 = receiptDigest(body);
  const receipt: CompletenessReceipt = {
    ...body,
    receiptSha256,
    cursor: remaining > 0 ? encodeCursor({ schemaVersion: ACQUISITION_SCHEMA_VERSION, inputSha256, nextIndex, previousReceiptSha256: receiptSha256 }) : null,
  };
  commitReceipt(options.receiptStore, receipt);
  return receipt;
}

export interface FixtureWorkItem extends AcquisitionWorkItem {
  outcomes: WorkOutcome[];
  childNames: string[];
}

export type AcquisitionParserFixture = {
  kind: 'single_html' | 'multi_html' | 'directory_html' | 'pagination_html' | 'document_text' | 'public_form_html';
  content: string;
};

export interface AcquisitionFixtureScenario {
  id: string;
  architecture: SourceArchitecture;
  sourceUrl: string | null;
  offlineAuthority: string | null;
  applicationMode: z.infer<typeof ApplicationGroupSchema>['mode'] | null;
  workCap: number;
  maxAttempts: number;
  workItems: FixtureWorkItem[];
  parserFixture?: AcquisitionParserFixture;
}

export async function runFixtureQueue(scenario: AcquisitionFixtureScenario): Promise<CompletenessReceipt[]> {
  const receipts: CompletenessReceipt[] = [];
  const receiptDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'p3-acquisition-receipts-'));
  try {
    let receiptStore = createReceiptStore(receiptDirectory);
    let cursor: string | null = null;
    do {
      const receipt = await runBoundedQueue(scenario.workItems, {
        cap: scenario.workCap,
        maxAttempts: scenario.maxAttempts,
        cursor,
        receiptStore,
        execute: (item, attempt) => {
          const fixture = scenario.workItems.find((candidate) => candidate.key === item.key);
          if (!fixture || fixture.outcomes.length === 0) return 'malformed';
          return fixture.outcomes[Math.min(attempt - 1, fixture.outcomes.length - 1)];
        },
      });
      receipts.push(receipt);
      cursor = receipt.cursor;
      receiptStore = createReceiptStore(receiptDirectory);
    } while (cursor);
    return receipts;
  } finally {
    fs.rmSync(receiptDirectory, { recursive: true, force: true });
  }
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
  receipts: CompletenessReceipt[],
): CanonicalDataset {
  const successfulKeys = new Set(receipts.flatMap((receipt) => receipt.succeededKeys));
  const failures = receipts.flatMap((receipt) => receipt.failures);
  const children = scenario.workItems.flatMap((item) => successfulKeys.has(item.key)
    ? item.childNames.map((name) => ({ name, workKey: item.key, canonical: item.url ? canonicalizeAcquisitionUrl(item.url) : null }))
    : []);
  const sourceCanonical = scenario.sourceUrl ? canonicalizeAcquisitionUrl(scenario.sourceUrl) : null;
  const parentSourceId = stableId('src', ['p3-fixture', scenario.id, sourceCanonical?.url ?? scenario.offlineAuthority]);
  const childSourceIds = children.map(({ workKey, canonical }) =>
    canonical && canonical.url !== sourceCanonical?.url
      ? stableId('src', ['p3-fixture', scenario.id, 'child-source', workKey, canonical.url])
      : parentSourceId);
  const distinctChildSourceIds = [...new Set(childSourceIds.filter((id) => id !== parentSourceId))];
  const failedWorkItems = failures.map((failure) => ({ item: scenario.workItems.find((item) => item.key === failure.key)!, outcome: failure.outcome }));
  const failedSourceIds = new Map(failedWorkItems.map(({ item }) => [
    item.key,
    stableId('src', ['p3-fixture', scenario.id, 'failed-work', item.key]),
  ]));
  const failureBySourceId = new Map(failedWorkItems.map(({ item, outcome }) => [
    failedSourceIds.get(item.key)!,
    { key: item.key, outcome, url: item.url },
  ]));
  const scholarshipIds = children.map(({ name, workKey }, index) => stableId('sch', ['p3-fixture', scenario.id, workKey, index, name]));
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

  const childSources = distinctChildSourceIds.map((id) => {
    const child = children.find((_, index) => childSourceIds[index] === id)!;
    const canonical = child.canonical!;
    return SourceSchema.parse({
      schemaVersion: MODEL_SCHEMA_VERSION,
      id,
      architecture: 'single_award_page',
      canonicalUrl: canonical.url,
      offlineAuthority: null,
      host: new URL(canonical.url).hostname,
      identityPolicy: {
        preservedQueryParameters: canonical.preservedQueryParameters,
        fragmentPreserved: canonical.fragmentPreserved,
        trackingParametersRemoved: canonical.removedTrackingParameters.length > 0,
      },
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
      accessBehavior: outcome === 'login_wall' ? 'authenticated' : 'unknown',
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
  const scholarships = children.map(({ name, workKey }, index) => ScholarshipSchema.parse({
    schemaVersion: MODEL_SCHEMA_VERSION,
    id: scholarshipIds[index],
    name,
    lifecycleState: 'modeled',
    legacyRowIdentities: [sha256Text(`sanitized-p3-fixture:${scenario.id}:${workKey}:${index}:${name}`)],
    sourceIds: [childSourceIds[index]],
    sourceLinks: [{
      sourceId: childSourceIds[index],
      role: childSourceIds[index] === parentSourceId ? 'information' : 'detail',
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
