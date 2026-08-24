import fs from 'node:fs';
import path from 'node:path';
import { buildInventory, loadP1Inputs, serializeInventory } from './p1-inventory-lib';

const webRoot = process.cwd();
const outputPath = path.resolve(webRoot, '../docs/evidence/P1-inventory.json');
const { fixture, observations } = loadP1Inputs(webRoot);
const report = buildInventory(fixture, observations);
const serialized = serializeInventory(report);

if (process.argv.includes('--check')) {
  const existing = fs.readFileSync(outputPath, 'utf8');
  if (existing !== serialized) {
    throw new Error('P1 inventory is stale; run npm run p1:inventory');
  }
  console.log(`P1 INVENTORY STABLE ${report.stability.deterministicDigestSha256}`);
} else {
  fs.writeFileSync(outputPath, serialized);
  console.log(`P1 INVENTORY WROTE ${path.relative(webRoot, outputPath)}`);
  console.log(`records=${report.counts.populatedRecords} urls=${report.counts.distinctUrls} sharedGroups=${report.counts.sharedNormalizedUrlGroups}`);
}
