import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sha256Text } from '../src/lib/canonicalModel';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const evidenceDir = path.join(repoRoot, 'docs/evidence');

function read(name: string) {
  return JSON.parse(fs.readFileSync(path.join(evidenceDir, name), 'utf8')) as Record<string, unknown>;
}

function assertDigest(report: Record<string, unknown>) {
  const { bodySha256, ...body } = report;
  assert.equal(typeof bodySha256, 'string');
  assert.equal(sha256Text(JSON.stringify(body)), bodySha256);
}

for (const name of [
  'P5-public-probes.json', 'P5-firecrawl-receipts.json', 'P5-replacement-evidence.json',
  'P5-preboundary-dead-link-observations.json', 'P5-preboundary-static-application-observations.json', 'P5-proposals.json', 'P5-audit-ledger.json', 'P5-manual-review.json', 'P5-review-sample.json',
]) assertDigest(read(name));

const ledger = read('P5-audit-ledger.json') as { inputRowDenominator: number; dispositionTotals: Record<string, number>; entries: Array<{ sheetRow: number; proposedDisposition: string }> };
assert.equal(ledger.inputRowDenominator, 197);
assert.equal(ledger.entries.length, 197);
assert.equal(new Set(ledger.entries.map((entry) => entry.sheetRow)).size, 197);
assert.equal(Object.values(ledger.dispositionTotals).reduce((sum, count) => sum + count, 0), 197);

const proposals = read('P5-proposals.json') as { proposalRowCount: number; proposalCellCount: number; proposals: Array<{ sheetRow: number; cell: string; reviewStatus: string }> };
assert.equal(proposals.proposalRowCount, 10);
assert.equal(proposals.proposalCellCount, 25);
assert.equal(proposals.proposals.every((proposal) => proposal.reviewStatus === 'pending_independent_review'), true);
assert.equal(new Set(proposals.proposals.map((proposal) => proposal.cell)).size, proposals.proposalCellCount);

const sample = read('P5-review-sample.json') as { mandatoryCoverage: { rows: number[] }; remainingDenominator: number; sampleSize: number; sampledRows: Array<{ sheetRow: number; score: string }> };
assert.equal(sample.sampleSize, Math.max(25, Math.ceil(sample.remainingDenominator * 0.2)));
assert.equal(sample.sampledRows.length, sample.sampleSize);
assert.equal(sample.mandatoryCoverage.rows.length, 10);
assert.deepEqual(sample.sampledRows, [...sample.sampledRows].sort((a, b) => a.score.localeCompare(b.score)));

const serialized = [
  'P5-public-probes.json', 'P5-firecrawl-receipts.json', 'P5-replacement-evidence.json',
  'P5-preboundary-dead-link-observations.json', 'P5-preboundary-static-application-observations.json', 'P5-proposals.json', 'P5-audit-ledger.json', 'P5-manual-review.json', 'P5-review-sample.json',
].map((name) => fs.readFileSync(path.join(evidenceDir, name), 'utf8')).join('\n');
assert.equal(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(serialized), false);
assert.equal(/BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY/.test(serialized), false);
assert.equal(/(?:access|refresh)[_-]?token|client[_-]?secret/i.test(serialized), false);
console.log('P5 AUDIT TEST PASS rows=197 proposals=25 mandatory=10 sample=38 privacy-safe');
