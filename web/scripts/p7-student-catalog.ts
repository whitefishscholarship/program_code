import fs from 'node:fs';
import path from 'node:path';
import { buildStudentCatalog, type CanonicalCatalogInput, type CoverageMetricsInput } from '../src/lib/studentCatalog';

const webRoot = process.cwd();
const repoRoot = path.resolve(webRoot, '..');
const graphPath = path.join(repoRoot, 'docs/evidence/P6-child-records.json');
const metricsPath = path.join(repoRoot, 'docs/evidence/P6-metrics.json');
const outputPath = path.join(webRoot, 'fixtures/p7/student-catalog.json');
const check = process.argv.includes('--check');

const graph = JSON.parse(fs.readFileSync(graphPath, 'utf8')) as CanonicalCatalogInput;
const metrics = JSON.parse(fs.readFileSync(metricsPath, 'utf8')) as CoverageMetricsInput;
const catalog = buildStudentCatalog(graph, metrics);
const serialized = `${JSON.stringify(catalog, null, 2)}\n`;

if (check) {
  if (!fs.existsSync(outputPath)) throw new Error('P7 student catalog fixture is missing');
  if (fs.readFileSync(outputPath, 'utf8') !== serialized) throw new Error('P7 student catalog fixture is stale');
  console.log(`P7 student catalog check passed: ${catalog.counts.awards} awards, ${catalog.counts.portals} portals, ${catalog.counts.activeCycles} active, ${catalog.counts.unknownCycles} unknown.`);
} else {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, serialized);
  console.log(`Wrote ${path.relative(repoRoot, outputPath)}`);
}
