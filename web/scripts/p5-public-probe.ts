import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';
import { assertFetchableUrl, parsePdfBuffer } from '../src/lib/extract';
import { sha256Text } from '../src/lib/canonicalModel';
import { classifyLinkObservation, type LinkObservation, type NetworkFailureClass } from '../src/lib/verification';
import type { P5SourceQueueEntry } from './p5-remediation';

type ProbeReceipt = {
  sourceId: string;
  url: string;
  roles: Array<'information' | 'application'>;
  sheetRows: number[];
  retrievedAt: string;
  attempts: number;
  status: number | null;
  finalUrl: string | null;
  contentType: string | null;
  contentBytesCaptured: number;
  contentLengthHeader: number | null;
  truncated: boolean;
  rawBodySha256: string | null;
  textSha256: string | null;
  textLength: number;
  title: string | null;
  markers: LinkObservation['markers'];
  failureClass: NetworkFailureClass | null;
  classifications: ReturnType<typeof classifyLinkObservation>[];
  explicitFactCandidates: {
    deadline: string[];
    amount: string[];
    applicationSignal: boolean;
    eligibilitySignal: boolean;
  };
  rowNameMatches: Array<{ sheetRow: number; exactNormalizedNamePresent: boolean; tokenCoverage: number }>;
  errorCode: string | null;
};

type QueueReport = { entries: P5SourceQueueEntry[] };
type Snapshot = { records: Array<{ sheetRow: number; values: { name: { formatted: string } } }> };

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const queuePath = path.join(repoRoot, 'docs/evidence/P5-source-queue.json');
const snapshotPath = path.join(repoRoot, 'web/fixtures/p5/prewrite-master-database.json');
const outputPath = path.join(repoRoot, 'docs/evidence/P5-public-probes.json');
const partialPath = path.join(repoRoot, '.firecrawl/P5-public-probes.partial.json');
const MAX_BYTES = 10_000_000;
const CONCURRENCY = 8;
const TIMEOUT_MS = 15_000;
const UA = 'Mozilla/5.0 (compatible; WhitefishScholarship-P5-ReadOnly/1.0)';

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

function sanitizeUrl(raw: string | null): string | null {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    for (const key of [...url.searchParams.keys()]) {
      if (/^utm_/i.test(key) || ['gclid', 'fbclid', 'ouid', 'rtpof', 'usp', 'sd'].includes(key.toLowerCase())) {
        url.searchParams.delete(key);
      }
    }
    return url.href;
  } catch {
    return null;
  }
}

function normalizeText(value: string): string {
  return value.normalize('NFKC').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function privacyClean(value: string): string {
  return value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[redacted-email]')
    .replace(/(?:\+?1[-. (]*)?\d{3}[-. )]*\d{3}[-. ]*\d{4}/g, '[redacted-phone]')
    .replace(/\bP\.?\s*O\.?\s*Box\s+\w+/gi, '[redacted-postal]');
}

async function boundedBody(response: Response): Promise<{ bytes: Buffer; truncated: boolean }> {
  if (!response.body) return { bytes: Buffer.alloc(0), truncated: false };
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  let truncated = false;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    const remaining = MAX_BYTES - total;
    if (value.byteLength > remaining) {
      if (remaining > 0) chunks.push(value.subarray(0, remaining));
      total = MAX_BYTES;
      truncated = true;
      await reader.cancel();
      break;
    }
    chunks.push(value);
    total += value.byteLength;
  }
  return { bytes: Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))), truncated };
}

function failureClass(error: unknown): { classification: NetworkFailureClass; code: string } {
  const candidate = error as { name?: string; code?: string; message?: string; cause?: { code?: string } };
  const code = String(candidate.cause?.code ?? candidate.code ?? candidate.name ?? 'ERR');
  if (/abort|timeout|ETIMEDOUT/i.test(`${code} ${candidate.message ?? ''}`)) return { classification: 'timeout', code };
  if (/ENOTFOUND|EAI_AGAIN|dns/i.test(code)) return { classification: 'dns', code };
  if (/CERT|TLS|SSL/i.test(code)) return { classification: 'tls', code };
  return { classification: 'other', code };
}

function markersFor(status: number, finalUrl: string, html: string, text: string): LinkObservation['markers'] {
  const lower = `${finalUrl}\n${text.slice(0, 20_000)}`.toLowerCase();
  const markers: LinkObservation['markers'] = [];
  if (/captcha|access denied|verify you are human|cloudflare/.test(lower)) markers.push('bot_block');
  if (/\b(?:login|log in|sign in|authentication required)\b/.test(lower)) markers.push('login_wall');
  if (status === 200 && text.length < 250 && /javascript|enable js|loading/.test(lower)) markers.push('dynamic_shell');
  if (/<form\b/i.test(html)) markers.push('application_form');
  return [...new Set(markers)];
}

function explicitFactCandidates(text: string) {
  const safe = privacyClean(text);
  const deadline = [...safe.matchAll(/\b(?:deadline|due|closes?|closing date)\b[^.!?\n]{0,140}/gi)]
    .map((match) => match[0].replace(/\s+/g, ' ').trim()).filter((value) => value.length >= 8).slice(0, 12);
  const amount = [...safe.matchAll(/(?:\$\s?\d[\d,]*(?:\.\d{2})?|\b(?:award|amount)\b[^.!?\n]{0,100})/gi)]
    .map((match) => match[0].replace(/\s+/g, ' ').trim()).filter((value) => value.length >= 2).slice(0, 12);
  return {
    deadline: [...new Set(deadline)],
    amount: [...new Set(amount)],
    applicationSignal: /\bapply|application|paper application|automatic consideration\b/i.test(safe),
    eligibilitySignal: /\beligib|requirements?|must be|applicants? must\b/i.test(safe),
  };
}

function nameMatch(name: string, text: string) {
  const normalizedName = normalizeText(name);
  const normalizedText = normalizeText(text);
  const tokens = normalizedName.split(' ').filter((token) => token.length >= 4 && !['scholarship', 'foundation', 'memorial'].includes(token));
  const matched = tokens.filter((token) => normalizedText.includes(token)).length;
  return {
    exactNormalizedNamePresent: normalizedName.length > 0 && normalizedText.includes(normalizedName),
    tokenCoverage: tokens.length ? Number((matched / tokens.length).toFixed(3)) : 0,
  };
}

async function fetchOnce(entry: P5SourceQueueEntry, names: Map<number, string>, attempt: number): Promise<ProbeReceipt> {
  const retrievedAt = new Date().toISOString();
  try {
    assertFetchableUrl(entry.url);
    const response = await fetch(entry.url, {
      method: 'GET',
      redirect: 'follow',
      headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml,application/pdf,text/plain;q=0.9,*/*;q=0.5' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const contentType = response.headers.get('content-type');
    const contentLengthHeader = Number(response.headers.get('content-length')) || null;
    const { bytes, truncated } = await boundedBody(response);
    let text = '';
    let html = '';
    if (/pdf/i.test(contentType ?? '') || new URL(response.url).pathname.toLowerCase().endsWith('.pdf')) {
      if (!truncated && bytes.length) {
        try { text = await parsePdfBuffer(bytes); } catch { text = ''; }
      }
    } else if (/html|xhtml/i.test(contentType ?? '')) {
      html = bytes.toString('utf8');
      const $ = cheerio.load(html);
      $('script,style,iframe,noscript').remove();
      text = $('body').text().replace(/\s+/g, ' ').trim();
    } else if (/text|json|xml/i.test(contentType ?? '')) {
      text = bytes.toString('utf8').replace(/\s+/g, ' ').trim();
    }
    const cleanText = privacyClean(text);
    const markers = markersFor(response.status, response.url, html, cleanText);
    let statusFailure: NetworkFailureClass | null = null;
    if (response.status === 429) statusFailure = 'rate_limit';
    else if (response.status >= 500) statusFailure = 'server_error';
    else if ([401, 403].includes(response.status)) statusFailure = 'login_wall';
    else if (markers.includes('bot_block')) statusFailure = 'bot_block';
    else if (markers.includes('login_wall')) statusFailure = 'login_wall';
    else if (markers.includes('dynamic_shell')) statusFailure = 'dynamic_shell';
    const classifications = entry.roles.map((role) => classifyLinkObservation({
      id: `${entry.sourceId}:${role}`,
      role,
      requestedUrl: entry.url,
      finalUrl: sanitizeUrl(response.url),
      status: response.status,
      contentType,
      failureClass: statusFailure,
      markers,
      retrievedAt,
    }));
    return {
      sourceId: entry.sourceId,
      url: entry.url,
      roles: entry.roles,
      sheetRows: entry.sheetRows,
      retrievedAt,
      attempts: attempt,
      status: response.status,
      finalUrl: sanitizeUrl(response.url),
      contentType,
      contentBytesCaptured: bytes.length,
      contentLengthHeader,
      truncated,
      rawBodySha256: createHash('sha256').update(bytes).digest('hex'),
      textSha256: text ? sha256Text(cleanText) : null,
      textLength: cleanText.length,
      title: html ? privacyClean(cheerio.load(html)('title').first().text()).slice(0, 300) || null : null,
      markers,
      failureClass: statusFailure,
      classifications,
      explicitFactCandidates: explicitFactCandidates(cleanText),
      rowNameMatches: entry.sheetRows.map((sheetRow) => ({ sheetRow, ...nameMatch(names.get(sheetRow) ?? '', cleanText) })),
      errorCode: null,
    };
  } catch (error) {
    const failure = failureClass(error);
    const roleClassifications = entry.roles.map((role) => classifyLinkObservation({
      id: `${entry.sourceId}:${role}`,
      role,
      requestedUrl: entry.url,
      finalUrl: null,
      status: null,
      contentType: null,
      failureClass: failure.classification,
      markers: [],
      retrievedAt,
    }));
    return {
      sourceId: entry.sourceId, url: entry.url, roles: entry.roles, sheetRows: entry.sheetRows,
      retrievedAt, attempts: attempt, status: null, finalUrl: null, contentType: null,
      contentBytesCaptured: 0, contentLengthHeader: null, truncated: false, rawBodySha256: null,
      textSha256: null, textLength: 0, title: null, markers: [], failureClass: failure.classification,
      classifications: roleClassifications,
      explicitFactCandidates: { deadline: [], amount: [], applicationSignal: false, eligibilitySignal: false },
      rowNameMatches: entry.sheetRows.map((sheetRow) => ({ sheetRow, exactNormalizedNamePresent: false, tokenCoverage: 0 })),
      errorCode: failure.code,
    };
  }
}

async function pool<T, R>(items: T[], concurrency: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const output = new Array<R>(items.length);
  let cursor = 0;
  let completed = 0;
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    for (;;) {
      const index = cursor++;
      if (index >= items.length) return;
      output[index] = await fn(items[index]);
      completed += 1;
      if (completed % 10 === 0 || completed === items.length) console.log(`P5 public probe progress ${completed}/${items.length}`);
    }
  }));
  return output;
}

async function main() {
  const check = process.argv.includes('--check');
  if (check) {
    const report = readJson<{ bodySha256: string; receipts: ProbeReceipt[]; denominator: number }>(outputPath);
    const queue = readJson<QueueReport>(queuePath);
    const expected = queue.entries.filter((entry) => entry.retrievalDisposition === 'public_read_only_scrape').length;
    const { bodySha256, ...body } = report;
    assert.equal(body.denominator, expected);
    assert.equal(body.receipts.length, expected);
    assert.equal(new Set(body.receipts.map((receipt) => receipt.sourceId)).size, expected);
    assert.equal(sha256Text(JSON.stringify(body)), bodySha256);
    console.log(`P5 PUBLIC PROBE CHECK PASS sources=${body.denominator} digest=${bodySha256.slice(0, 12)}`);
    return;
  }

  const queue = readJson<QueueReport>(queuePath);
  const snapshot = readJson<Snapshot>(snapshotPath);
  const entries = queue.entries.filter((entry) => entry.retrievalDisposition === 'public_read_only_scrape');
  assert.equal(entries.length > 0, true);
  const names = new Map(snapshot.records.map((record) => [record.sheetRow, record.values.name.formatted]));
  const existing = fs.existsSync(partialPath) ? readJson<ProbeReceipt[]>(partialPath) : [];
  const completed = new Map(existing.map((receipt) => [receipt.sourceId, receipt]));
  const pending = entries.filter((entry) => !completed.has(entry.sourceId));
  const fresh = await pool(pending, CONCURRENCY, async (entry) => {
    let receipt = await fetchOnce(entry, names, 1);
    if (receipt.status === null && ['timeout', 'dns', 'tls', 'other'].includes(receipt.failureClass ?? '')) {
      receipt = await fetchOnce(entry, names, 2);
    }
    completed.set(entry.sourceId, receipt);
    if (completed.size % 10 === 0) fs.writeFileSync(partialPath, `${JSON.stringify([...completed.values()], null, 2)}\n`);
    return receipt;
  });
  void fresh;
  const receipts = entries.map((entry) => completed.get(entry.sourceId)).filter((value): value is ProbeReceipt => Boolean(value));
  assert.equal(receipts.length, entries.length);
  const body = {
    schemaVersion: 1,
    stageId: 'P5',
    capturedAt: new Date().toISOString(),
    denominator: entries.length,
    maxContentBytes: MAX_BYTES,
    timeoutMs: TIMEOUT_MS,
    maxAttempts: 2,
    concurrency: CONCURRENCY,
    receipts,
  };
  const report = { ...body, bodySha256: sha256Text(JSON.stringify(body)) };
  fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(partialPath, `${JSON.stringify(receipts, null, 2)}\n`);
  console.log(`P5 PUBLIC PROBE PASS sources=${receipts.length} digest=${report.bodySha256.slice(0, 12)}`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
