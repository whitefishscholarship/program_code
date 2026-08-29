import fs from 'node:fs';
import path from 'node:path';
import {
  applicationModeLabel,
  buildStudentCatalog,
  cycleStatusLabel,
  StudentCatalogSchema,
  type ApplicationMode,
  type CanonicalCatalogInput,
  type CoverageMetricsInput,
  type CycleStatus,
  type StudentAward,
} from '../src/lib/studentCatalog';
import { SOURCE_ARCHITECTURES, sha256Text, type P1InventoryInput } from '../src/lib/canonicalModel';
import { buildCompleteStudentCatalog, type AppliedReceipt, type LegacySnapshot } from '../src/lib/studentCatalogLegacy';

const webRoot = process.cwd();
const repoRoot = path.resolve(webRoot, '..');
const graphPath = path.join(repoRoot, 'docs/evidence/P6-child-records.json');
const metricsPath = path.join(repoRoot, 'docs/evidence/P6-metrics.json');
const p1InventoryPath = path.join(repoRoot, 'docs/evidence/P1-inventory.json');
const p1ManifestPath = path.join(repoRoot, 'docs/evidence/P1-manifest.json');
const legacyPath = path.join(webRoot, 'fixtures/p5/prewrite-master-database.json');
const receiptPath = path.join(repoRoot, 'docs/evidence/P5-applied-change-receipt.json');
const outputPath = path.join(webRoot, 'fixtures/p7/student-catalog.json');
const compatibilityOutputPath = path.join(webRoot, 'fixtures/p7/legacy-api-data.json');
const matrixOutputPath = path.join(webRoot, 'fixtures/p7/matrix-catalog.json');
const check = process.argv.includes('--check');

const graph = JSON.parse(fs.readFileSync(graphPath, 'utf8')) as CanonicalCatalogInput;
const metrics = JSON.parse(fs.readFileSync(metricsPath, 'utf8')) as CoverageMetricsInput;
const inventory = JSON.parse(fs.readFileSync(p1InventoryPath, 'utf8')) as P1InventoryInput;
const legacy = JSON.parse(fs.readFileSync(legacyPath, 'utf8')) as LegacySnapshot;
const receipt = JSON.parse(fs.readFileSync(receiptPath, 'utf8')) as AppliedReceipt;
const { catalog, compatibilityData } = buildCompleteStudentCatalog({
  inventory,
  p1InventorySha256: sha256Text(fs.readFileSync(p1InventoryPath, 'utf8')),
  p1ManifestSha256: sha256Text(fs.readFileSync(p1ManifestPath, 'utf8')),
  legacy,
  receipt,
  expansion: graph,
  metrics,
});
const serialized = `${JSON.stringify(catalog, null, 2)}\n`;
const compatibilitySerialized = `${JSON.stringify(compatibilityData, null, 2)}\n`;

const portalArchitectures = new Set(['directory_hub', 'paginated_catalog', 'matching_portal', 'external_marketplace', 'login_application_portal']);
const entityId = (kind: 'award' | 'source' | 'portal' | 'application', index: number) => `${kind}-${index.toString(16).padStart(12, '0')}`;
const matrixCases: Array<{ name: string; mode: ApplicationMode; status: CycleStatus; sourceIndex: number; url: string | null }> = [
  { name: 'Single Award Page Scholarship', mode: 'direct_per_award', status: 'active', sourceIndex: 0, url: 'https://example.test/single-award' },
  { name: 'Shared Application Scholarship', mode: 'shared_with_supplements', status: 'active', sourceIndex: 4, url: 'https://example.test/shared-application' },
  { name: 'Paper Application Scholarship', mode: 'offline', status: 'unknown', sourceIndex: 8, url: null },
  { name: 'Automatic Consideration Scholarship', mode: 'automatic_consideration', status: 'active', sourceIndex: 10, url: null },
  { name: 'Eligibility Matched Scholarship', mode: 'eligibility_matched', status: 'unknown', sourceIndex: 5, url: 'https://example.test/matching' },
  { name: 'Unavailable Cycle Scholarship', mode: 'direct_per_award', status: 'unavailable', sourceIndex: 12, url: 'https://example.test/unavailable' },
  { name: 'Selectable Children Scholarship', mode: 'selectable_children', status: 'upcoming', sourceIndex: 1, url: 'https://example.test/select-awards' },
];
const matrixAwards: StudentAward[] = matrixCases.map((item, index) => ({
  publicId: entityId('award', index + 1),
  name: item.name,
  summary: `P7 matrix fixture for ${item.mode.replaceAll('_', ' ')}.`,
  amount: { label: '$1,000', minimum: 1000, maximum: 1000, currency: 'USD', state: 'known' },
  eligibility: { audience: 'Matrix fixture audience', minimumGpa: index % 2 ? 3 : null, schoolTypes: index % 2 ? ['four_year'] : ['trade'], focus: null },
  cycle: { status: item.status, label: cycleStatusLabel(item.status), year: item.status === 'active' ? 2026 : null, opens: item.status === 'active' ? '2026-01-01' : null, closes: item.status === 'active' ? '2026-12-31' : null, recurrence: 'annual' },
  application: { mode: item.mode, label: applicationModeLabel(item.mode), url: item.url, groupPublicId: item.mode === 'shared_with_supplements' ? entityId('application', 1) : null, supplements: item.mode === 'shared_with_supplements' ? 'mixed' : 'not_required' },
  sourcePublicIds: [entityId('source', item.sourceIndex + 1)],
}));
const matrixCatalog = StudentCatalogSchema.parse({
  schemaVersion: '1.0.0',
  catalogRevision: 'f'.repeat(64),
  counts: { sources: 13, portals: 5, awards: matrixAwards.length, applicationGroups: 1, cycles: matrixAwards.length, activeCycles: 3, upcomingCycles: 1, closedCycles: 0, unavailableCycles: 1, unknownCycles: 2, minimumObservedRecipientSlots: 7 },
  awards: matrixAwards,
  sources: SOURCE_ARCHITECTURES.map((architecture, index) => ({
    publicId: entityId('source', index + 1),
    title: `${architecture.replaceAll('_', ' ')} fixture`,
    recordType: portalArchitectures.has(architecture) ? 'portal' : 'source',
    architecture,
    url: architecture === 'offline_or_automatic' ? null : `https://example.test/${architecture.replaceAll('_', '-')}`,
    access: architecture === 'offline_or_automatic' ? 'offline' : architecture === 'login_application_portal' ? 'authenticated' : 'public',
    availability: architecture === 'login_application_portal' ? 'blocked' : 'complete',
    awardCount: matrixCases.filter((item) => item.sourceIndex === index).length,
  })),
  portals: SOURCE_ARCHITECTURES.map((architecture, index) => ({ architecture, index }))
    .filter(({ architecture }) => portalArchitectures.has(architecture))
    .map(({ architecture, index }) => ({
      publicId: entityId('portal', index + 1),
      title: `${architecture.replaceAll('_', ' ')} portal fixture`,
      architecture,
      url: `https://example.test/${architecture.replaceAll('_', '-')}`,
      sourcePublicIds: [entityId('source', index + 1)],
    })),
  applicationGroups: [{ publicId: entityId('application', 1), mode: 'shared_with_supplements', label: applicationModeLabel('shared_with_supplements'), url: 'https://example.test/shared-application', awardPublicIds: [matrixAwards[1].publicId], supplements: 'mixed' }],
  notice: 'Development-only P7 matrix fixture. These are not scholarship facts.',
});
const matrixSerialized = `${JSON.stringify(matrixCatalog, null, 2)}\n`;

if (check) {
  if (!fs.existsSync(outputPath)) throw new Error('P7 student catalog fixture is missing');
  if (fs.readFileSync(outputPath, 'utf8') !== serialized) throw new Error('P7 student catalog fixture is stale');
  if (!fs.existsSync(matrixOutputPath)) throw new Error('P7 matrix catalog fixture is missing');
  if (fs.readFileSync(matrixOutputPath, 'utf8') !== matrixSerialized) throw new Error('P7 matrix catalog fixture is stale');
  if (!fs.existsSync(compatibilityOutputPath)) throw new Error('P7 legacy API fixture is missing');
  if (fs.readFileSync(compatibilityOutputPath, 'utf8') !== compatibilitySerialized) throw new Error('P7 legacy API fixture is stale');
  console.log(`P7 student catalog check passed: ${catalog.counts.awards} awards, ${catalog.counts.sources} sources (${catalog.counts.portals} portals), ${catalog.counts.activeCycles} active, ${catalog.counts.unknownCycles} unknown.`);
} else {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, serialized);
  fs.writeFileSync(matrixOutputPath, matrixSerialized);
  fs.writeFileSync(compatibilityOutputPath, compatibilitySerialized);
  console.log(`Wrote ${path.relative(repoRoot, outputPath)}, ${path.relative(repoRoot, matrixOutputPath)}, and ${path.relative(repoRoot, compatibilityOutputPath)}`);
}
