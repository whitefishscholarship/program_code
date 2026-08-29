import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sha256Text } from '../src/lib/canonicalModel';
import type { P5SourceQueueEntry } from './p5-remediation';

type QueueReport = { entries: P5SourceQueueEntry[] };
type Snapshot = { records: Array<{ sheetRow: number; values: { name: { formatted: string } } }> };
type FirecrawlOutput = {
  markdown?: string;
  metadata?: {
    title?: string;
    sourceURL?: string;
    url?: string;
    statusCode?: number;
    contentType?: string;
    cacheState?: string;
    cachedAt?: string;
    scrapeId?: string;
    creditsUsed?: number;
  };
};

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const queuePath = path.join(repoRoot, 'docs/evidence/P5-source-queue.json');
const snapshotPath = path.join(repoRoot, 'web/fixtures/p5/prewrite-master-database.json');
const inputDir = path.join(repoRoot, '.firecrawl/P5-information-only');
const outputPath = path.join(repoRoot, 'docs/evidence/P5-firecrawl-receipts.json');
const EXCLUDED_INTERACTIVE_URL = /(?:forms\.office\.com|webportalapp\.com|awardspring\.com|my\.site\.com|efmfeed\.verintefm\.com|smr\.to|(?:^|\/)(?:forms?|login|sign[_-]?in|register|portal|responsepage|ninja-forms)(?:[/?#]|$))/i;

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

function eligible(entry: P5SourceQueueEntry): boolean {
  return entry.retrievalDisposition === 'public_read_only_scrape'
    && !EXCLUDED_INTERACTIVE_URL.test(entry.url);
}

function privacyClean(value: string): string {
  return value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[redacted-email]')
    .replace(/(?:\+?1[-. (]*)?\d{3}[-. )]*\d{3}[-. ]*\d{4}/g, '[redacted-phone]')
    .replace(/\bP\.?\s*O\.?\s*Box\s+\w+/gi, '[redacted-postal]');
}

function normalizeText(value: string): string {
  return value.normalize('NFKC').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function factCandidates(markdown: string): { deadline: string[]; amount: string[] } {
  const clean = privacyClean(markdown).replace(/\s+/g, ' ');
  const deadline = [...clean.matchAll(/\b(?:deadline|due|closes?|closing date)\b.{0,150}/gi)]
    .map((match) => match[0].trim().slice(0, 180));
  const amount = [...clean.matchAll(/(?:\$\s?\d[\d,]*(?:\.\d{2})?|\b\d[\d,]*\s+dollars?\b).{0,100}/gi)]
    .map((match) => match[0].trim().slice(0, 140));
  return { deadline: [...new Set(deadline)].slice(0, 5), amount: [...new Set(amount)].slice(0, 5) };
}

function main() {
  const check = process.argv.includes('--check');
  const queue = readJson<QueueReport>(queuePath);
  const entries = queue.entries.filter(eligible);
  if (check) {
    const report = readJson<{ bodySha256: string; denominator: number; outcomeCounts: { retrieved: number; inconclusiveRetrieval: number }; receipts: Array<{ sourceId: string; outcome: string }> }>(outputPath);
    const { bodySha256, ...body } = report;
    assert.equal(body.denominator, entries.length);
    assert.equal(body.receipts.length, entries.length);
    assert.equal(new Set(body.receipts.map((receipt) => receipt.sourceId)).size, entries.length);
    assert.equal(body.outcomeCounts.retrieved + body.outcomeCounts.inconclusiveRetrieval, entries.length);
    assert.equal(sha256Text(JSON.stringify(body)), bodySha256);
    console.log(`P5 FIRECRAWL EVIDENCE CHECK PASS sources=${body.denominator} retrieved=${body.outcomeCounts.retrieved} inconclusive=${body.outcomeCounts.inconclusiveRetrieval} digest=${bodySha256.slice(0, 12)}`);
    return;
  }
  const snapshot = readJson<Snapshot>(snapshotPath);
  const names = new Map(snapshot.records.map((record) => [record.sheetRow, record.values.name.formatted]));
  const receipts = entries.map((entry) => {
    const successPath = path.join(inputDir, `${entry.sourceId}.json`);
    const errorPath = path.join(inputDir, `${entry.sourceId}.error.json`);
    assert.equal(fs.existsSync(successPath) || fs.existsSync(errorPath), true, `missing Firecrawl receipt ${entry.sourceId}`);
    if (fs.existsSync(errorPath)) {
      const failure = readJson<{ failureCode: string; failureClass: string }>(errorPath);
      return {
        sourceId: entry.sourceId, url: entry.url, sheetRows: entry.sheetRows,
        outcome: 'inconclusive_retrieval' as const, statusCode: null, finalUrl: null,
        contentType: null, cacheState: null, cachedAt: null, scrapeId: null,
        creditsUsed: null, markdownSha256: null, markdownLength: 0,
        title: null, factCandidates: { deadline: [], amount: [] }, nameMatches: [],
        failureCode: failure.failureCode, failureClass: failure.failureClass,
      };
    }
    const output = readJson<FirecrawlOutput>(successPath);
    const markdown = privacyClean(output.markdown ?? '');
    const normalized = normalizeText(markdown);
    return {
      sourceId: entry.sourceId, url: entry.url, sheetRows: entry.sheetRows,
      outcome: 'retrieved' as const,
      statusCode: output.metadata?.statusCode ?? null,
      finalUrl: output.metadata?.url ?? null,
      contentType: output.metadata?.contentType ?? null,
      cacheState: output.metadata?.cacheState ?? null,
      cachedAt: output.metadata?.cachedAt ?? null,
      scrapeId: output.metadata?.scrapeId ?? null,
      creditsUsed: output.metadata?.creditsUsed ?? null,
      markdownSha256: sha256Text(markdown), markdownLength: markdown.length,
      title: privacyClean(output.metadata?.title ?? '').slice(0, 300) || null,
      factCandidates: factCandidates(markdown),
      nameMatches: entry.sheetRows.map((sheetRow) => {
        const name = normalizeText(names.get(sheetRow) ?? '');
        const tokens = name.split(' ').filter((token) => token.length > 2);
        return {
          sheetRow,
          exactNormalizedNamePresent: name.length > 0 && normalized.includes(name),
          tokenCoverage: tokens.length === 0 ? 0 : Number((tokens.filter((token) => normalized.includes(token)).length / tokens.length).toFixed(3)),
        };
      }),
      failureCode: null, failureClass: null,
    };
  });
  const mtimes = entries.flatMap((entry) => [
    path.join(inputDir, `${entry.sourceId}.json`),
    path.join(inputDir, `${entry.sourceId}.error.json`),
  ]).filter((filePath) => fs.existsSync(filePath)).map((filePath) => fs.statSync(filePath).mtimeMs);
  const body = {
    schemaVersion: 1,
    stageId: 'P5',
    capturedAt: new Date(Math.max(...mtimes)).toISOString(),
    privacyRedactionRequested: true,
    interactionBoundary: 'static public pages and documents only; no forms, logins, portals, profile use, actions, submissions, or private Drive/Docs',
    denominator: entries.length,
    outcomeCounts: {
      retrieved: receipts.filter((receipt) => receipt.outcome === 'retrieved').length,
      inconclusiveRetrieval: receipts.filter((receipt) => receipt.outcome === 'inconclusive_retrieval').length,
    },
    receipts,
  };
  const report = { ...body, bodySha256: sha256Text(JSON.stringify(body)) };
  const serialized = `${JSON.stringify(report, null, 2)}\n`;
  fs.writeFileSync(outputPath, serialized);
  console.log(`P5 FIRECRAWL EVIDENCE PASS sources=${entries.length} retrieved=${body.outcomeCounts.retrieved} inconclusive=${body.outcomeCounts.inconclusiveRetrieval} digest=${report.bodySha256.slice(0, 12)}`);
}

main();
