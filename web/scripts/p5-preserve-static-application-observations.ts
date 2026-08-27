import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sha256Text } from '../src/lib/canonicalModel';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const sourceCommit = '57d3540319b70adc7e3de88ce5723023c9783062';
const sourcePath = 'docs/evidence/P5-firecrawl-receipts.json';
const outputPath = path.join(repoRoot, 'docs/evidence/P5-preboundary-static-application-observations.json');
const requiredSourceIds = new Set(['p5src_a2baa8cd20bafbcbbce7', 'p5src_7443be7e1cb6f0709cf5']);

function buildReport() {
  const source = JSON.parse(execFileSync('git', ['show', `${sourceCommit}:${sourcePath}`], { cwd: repoRoot, encoding: 'utf8' })) as {
    bodySha256: string;
    receipts: Array<{ sourceId: string; outcome: string; statusCode: number | null; [key: string]: unknown }>;
  };
  const receipts = source.receipts.filter((receipt) => requiredSourceIds.has(receipt.sourceId));
  assert.equal(receipts.length, requiredSourceIds.size);
  assert.equal(receipts.every((receipt) => receipt.outcome === 'retrieved' && receipt.statusCode === 200), true);
  const body = {
    schemaVersion: 1,
    stageId: 'P5',
    sourceCheckpoint: sourceCommit,
    sourceArtifact: sourcePath,
    sourceArtifactDigest: source.bodySha256,
    disclosure: 'These two static public scholarship-page GET observations occurred before application-role URLs were moved to no-fetch. No form, login, action, profile, or submission was used.',
    receipts,
  };
  return { ...body, bodySha256: sha256Text(JSON.stringify(body)) };
}

const report = buildReport();
const serialized = `${JSON.stringify(report, null, 2)}\n`;
if (process.argv.includes('--check')) assert.equal(fs.readFileSync(outputPath, 'utf8'), serialized, 'pre-boundary static application evidence is stale');
else fs.writeFileSync(outputPath, serialized);
console.log(`P5 PREBOUNDARY STATIC-APPLICATION ${process.argv.includes('--check') ? 'CHECK ' : ''}PASS receipts=${report.receipts.length} digest=${report.bodySha256.slice(0, 12)}`);
