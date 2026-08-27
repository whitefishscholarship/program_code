import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sha256Text } from '../src/lib/canonicalModel';

type SourceRole = 'information' | 'application';
type SnapshotRecord = {
  sheetRow: number;
  rowKey: string;
  values: Record<string, unknown> & {
    name: { formatted: string };
    information: { urls: Array<{ url: string; provenance: string[] }> };
    application: { urls: Array<{ url: string; provenance: string[] }> };
  };
  disposition: 'pending_audit';
};

type PrewriteSnapshot = {
  spreadsheetId: string;
  spreadsheetRevisionId: string;
  sheetName: string;
  sheetId: number;
  boundedRange: string;
  denominator: { populatedRecords: number; unnamedNonemptyRows: number[] };
  records: SnapshotRecord[];
};

type SourceAccumulator = {
  url: string;
  host: string;
  roles: Set<SourceRole>;
  sheetRows: Set<number>;
  provenance: Set<string>;
};

export type P5SourceQueueEntry = {
  sourceId: string;
  url: string;
  host: string;
  roles: SourceRole[];
  sheetRows: number[];
  provenance: string[];
  retrievalDisposition: 'public_read_only_scrape' | 'manual_review_no_fetch';
  reason: string;
};

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const snapshotPath = path.join(repoRoot, 'web/fixtures/p5/prewrite-master-database.json');
const buildStatePath = path.join(repoRoot, 'docs/BUILD_STATE.json');
const backupReceiptPath = path.join(repoRoot, 'docs/evidence/P5-prewrite-snapshot.json');
const queuePath = path.join(repoRoot, 'docs/evidence/P5-source-queue.json');

const riskyHosts = [
  /(^|\.)docs\.google\.com$/i,
  /(^|\.)drive\.google\.com$/i,
  /(^|\.)forms\.gle$/i,
  /(^|\.)surveymonkey\.com$/i,
  /(^|\.)submittable\.com$/i,
  /(^|\.)academicworks\.com$/i,
  /(^|\.)grantinterface\.com$/i,
  /(^|\.)mykaleidoscope\.com$/i,
  /(^|\.)applymontana\.mus\.edu$/i,
  /(^|\.)awardmontana\.mus\.edu$/i,
];

const riskyPath = /(?:^|\/)(?:forms?|apply|application|login|sign-in|signin|register)(?:\/|$)/i;

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

export function retrievalDisposition(entry: SourceAccumulator): Pick<P5SourceQueueEntry, 'retrievalDisposition' | 'reason'> {
  const parsed = new URL(entry.url);
  const applicationOnly = entry.roles.has('application') && !entry.roles.has('information');
  const isGoogleForm = parsed.hostname === 'docs.google.com' && /^\/forms\//i.test(parsed.pathname);
  const isRiskyHost = riskyHosts.some((pattern) => pattern.test(parsed.hostname));
  const isRiskyApplicationPath = applicationOnly && riskyPath.test(parsed.pathname);
  if (isGoogleForm || isRiskyHost || isRiskyApplicationPath) {
    return {
      retrievalDisposition: 'manual_review_no_fetch',
      reason: 'Google-hosted file with unverified visibility, form, login, application-workflow, or matching-portal URL is not fetched under the P5 privacy/no-interaction boundary.',
    };
  }
  return {
    retrievalDisposition: 'public_read_only_scrape',
    reason: 'Public page or document is eligible for bounded read-only retrieval without form or application interaction.',
  };
}

export function buildSourceQueue(snapshot: PrewriteSnapshot): P5SourceQueueEntry[] {
  const sources = new Map<string, SourceAccumulator>();
  for (const record of snapshot.records) {
    for (const role of ['information', 'application'] as const) {
      for (const reference of record.values[role].urls) {
        const parsed = new URL(reference.url);
        assert.equal(parsed.protocol === 'https:' || parsed.protocol === 'http:', true, `non-HTTP source at row ${record.sheetRow}`);
        const current = sources.get(parsed.href) ?? {
          url: parsed.href,
          host: parsed.hostname,
          roles: new Set<SourceRole>(),
          sheetRows: new Set<number>(),
          provenance: new Set<string>(),
        };
        current.roles.add(role);
        current.sheetRows.add(record.sheetRow);
        for (const item of reference.provenance) current.provenance.add(item);
        sources.set(parsed.href, current);
      }
    }
  }
  return [...sources.values()]
    .map((source) => ({
      sourceId: `p5src_${sha256Text(source.url).slice(0, 20)}`,
      url: source.url,
      host: source.host,
      roles: [...source.roles].sort(),
      sheetRows: [...source.sheetRows].sort((a, b) => a - b),
      provenance: [...source.provenance].sort(),
      ...retrievalDisposition(source),
    }))
    .sort((a, b) => a.sourceId.localeCompare(b.sourceId));
}

export function buildQueueReport(snapshot: PrewriteSnapshot, entries: P5SourceQueueEntry[]) {
  const body = {
    schemaVersion: 1,
    stageId: 'P5',
    sourceSpreadsheetId: snapshot.spreadsheetId,
    sourceRevisionId: snapshot.spreadsheetRevisionId,
    sheetName: snapshot.sheetName,
    sheetId: snapshot.sheetId,
    boundedRange: snapshot.boundedRange,
    recordDenominator: snapshot.records.length,
    sourceDenominator: entries.length,
    retrievalCounts: {
      publicReadOnlyScrape: entries.filter((entry) => entry.retrievalDisposition === 'public_read_only_scrape').length,
      manualReviewNoFetch: entries.filter((entry) => entry.retrievalDisposition === 'manual_review_no_fetch').length,
    },
    entries,
  };
  return { ...body, bodySha256: sha256Text(JSON.stringify(body)) };
}

function main() {
  const check = process.argv.includes('--check');
  const snapshot = readJson<PrewriteSnapshot>(snapshotPath);
  const buildState = readJson<{
    activeStageId: string | null;
    dataAuthority: { testingWriteAuthorization?: { authorized: boolean; spreadsheetId: string; sheetName: string } };
  }>(buildStatePath);
  const backup = readJson<{
    source: { revisionId: string; spreadsheetId: string; sheetName: string };
    verification: { completeReversibleBackupEstablished: boolean; sourceRevisionAfterCopyAndReadback: string };
  }>(backupReceiptPath);

  assert.equal(buildState.activeStageId, 'P5');
  assert.equal(buildState.dataAuthority.testingWriteAuthorization?.authorized, true);
  assert.equal(buildState.dataAuthority.testingWriteAuthorization?.spreadsheetId, snapshot.spreadsheetId);
  assert.equal(buildState.dataAuthority.testingWriteAuthorization?.sheetName, snapshot.sheetName);
  assert.equal(backup.verification.completeReversibleBackupEstablished, true);
  assert.equal(backup.source.revisionId, snapshot.spreadsheetRevisionId);
  assert.equal(backup.verification.sourceRevisionAfterCopyAndReadback, snapshot.spreadsheetRevisionId);
  assert.equal(snapshot.denominator.populatedRecords, 197);
  assert.deepEqual(snapshot.denominator.unnamedNonemptyRows, []);
  assert.equal(snapshot.records.length, 197);
  assert.equal(new Set(snapshot.records.map((record) => record.sheetRow)).size, 197);
  assert.equal(snapshot.records.every((record) => record.disposition === 'pending_audit'), true);

  const report = buildQueueReport(snapshot, buildSourceQueue(snapshot));
  assert.equal(report.sourceDenominator, 213);
  assert.equal(report.retrievalCounts.publicReadOnlyScrape + report.retrievalCounts.manualReviewNoFetch, 213);
  const serialized = `${JSON.stringify(report, null, 2)}\n`;
  if (check) {
    assert.equal(fs.readFileSync(queuePath, 'utf8'), serialized, 'docs/evidence/P5-source-queue.json is stale');
  } else {
    fs.writeFileSync(queuePath, serialized);
  }
  console.log(
    `P5 SOURCE QUEUE ${check ? 'CHECK ' : ''}PASS records=${report.recordDenominator} sources=${report.sourceDenominator} fetch=${report.retrievalCounts.publicReadOnlyScrape} manual=${report.retrievalCounts.manualReviewNoFetch} digest=${report.bodySha256.slice(0, 12)}`,
  );
}

if (path.resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) main();
