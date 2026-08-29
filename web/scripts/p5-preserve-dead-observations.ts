import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sha256Text } from '../src/lib/canonicalModel';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const sourceCommit = '57d3540319b70adc7e3de88ce5723023c9783062';
const sourcePath = 'docs/evidence/P5-public-probes.json';
const outputPath = path.join(repoRoot, 'docs/evidence/P5-preboundary-dead-link-observations.json');

function buildReport() {
  const source = JSON.parse(execFileSync('git', ['show', `${sourceCommit}:${sourcePath}`], { cwd: repoRoot, encoding: 'utf8' })) as {
    bodySha256: string;
    receipts: Array<{
      sourceId: string; url: string; roles: string[]; sheetRows: number[]; retrievedAt: string;
      status: number | null; finalUrl: string | null; contentType: string | null; failureClass: string | null;
      classifications: Array<{ id: string; role: string; requestedUrl: string; finalUrl: string | null; status: number | null; redirectKind: string; retrievedAt: string; awardClosureSupported: boolean; state: string; targetClass: string; reason: string; requiresReview: boolean; reviewSeverity: string; linkCorrectionReviewEligible: boolean }>;
    }>;
  };
  const receipts = source.receipts.filter((receipt) => receipt.classifications.some((value) => value.state === 'dead')).map((receipt) => ({
    sourceId: receipt.sourceId, url: receipt.url, roles: receipt.roles, sheetRows: receipt.sheetRows,
    retrievedAt: receipt.retrievedAt, status: receipt.status, finalUrl: receipt.finalUrl,
    contentType: receipt.contentType, failureClass: receipt.failureClass, classifications: receipt.classifications,
  }));
  assert.equal(receipts.length, 7);
  const body = {
    schemaVersion: 1,
    stageId: 'P5',
    sourceCheckpoint: sourceCommit,
    sourceArtifact: sourcePath,
    sourceArtifactDigest: source.bodySha256,
    disclosure: 'These bounded read-only GET observations occurred before the no-application-fetch router was corrected. No form was submitted and no applicant data was collected.',
    awardClosureSupported: false,
    receipts,
  };
  return { ...body, bodySha256: sha256Text(JSON.stringify(body)) };
}

const report = buildReport();
const serialized = `${JSON.stringify(report, null, 2)}\n`;
if (process.argv.includes('--check')) assert.equal(fs.readFileSync(outputPath, 'utf8'), serialized, 'pre-boundary dead-link evidence is stale');
else fs.writeFileSync(outputPath, serialized);
console.log(`P5 PREBOUNDARY DEAD-LINK ${process.argv.includes('--check') ? 'CHECK ' : ''}PASS receipts=${report.receipts.length} digest=${report.bodySha256.slice(0, 12)}`);
