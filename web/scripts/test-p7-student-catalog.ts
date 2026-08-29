import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import catalogJson from '../fixtures/p7/student-catalog.json';
import { EXPORT_HEADERS, serializeAwardCsv, toExportRows } from '../src/lib/export';
import {
  APPLICATION_MODES,
  collectObjectKeys,
  FORBIDDEN_PUBLIC_KEYS,
  PUBLIC_AWARD_FIELDS,
  PUBLIC_PORTAL_FIELDS,
  StudentCatalogSchema,
  type StudentAward,
} from '../src/lib/studentCatalog';
import { SOURCE_ARCHITECTURES } from '../src/lib/canonicalModel';

const webRoot = process.cwd();
const repoRoot = path.resolve(webRoot, '..');
const catalog = StudentCatalogSchema.parse(catalogJson);

assert.deepEqual(catalog.counts, {
  sources: 6,
  portals: 5,
  awards: 16,
  applicationGroups: 1,
  cycles: 16,
  activeCycles: 0,
  upcomingCycles: 0,
  closedCycles: 0,
  unavailableCycles: 0,
  unknownCycles: 16,
  minimumObservedRecipientSlots: 71,
}, 'student counts must exactly reconcile to accepted P6 count semantics');
assert.equal(catalog.awards.length, catalog.counts.awards);
assert.equal(catalog.portals.length, catalog.counts.portals);
assert.equal(catalog.applicationGroups.length, catalog.counts.applicationGroups);
assert.equal(catalog.awards.filter((award) => award.cycle.status === 'active').length, 0, 'yearless rules must never become active');
assert.equal(catalog.awards.filter((award) => award.cycle.status === 'unknown').length, 16);
assert(catalog.awards.every((award) => award.cycle.year === null), 'unknown annual cycles must not fabricate a year');
assert(catalog.awards.every((award) => award.application.label.includes('Shared application')));
assert.equal(catalog.applicationGroups[0].awardPublicIds.length, 16, 'shared application must preserve all child relationships');
assert(catalog.portals.every((portal) => portal.url.startsWith('https://')), 'student portal links must use public HTTPS URLs');

for (const award of catalog.awards) {
  assert.deepEqual(Object.keys(award).sort(), [...PUBLIC_AWARD_FIELDS].sort(), `${award.name} must use the exact award allow-list`);
}
for (const portal of catalog.portals) {
  assert.deepEqual(Object.keys(portal).sort(), [...PUBLIC_PORTAL_FIELDS].sort(), `${portal.title} must use the exact portal allow-list`);
}
const publicKeys = collectObjectKeys(catalog);
for (const forbidden of FORBIDDEN_PUBLIC_KEYS) assert(!publicKeys.has(forbidden), `public catalog leaked forbidden key ${forbidden}`);
const serializedCatalog = JSON.stringify(catalog).toLowerCase();
for (const sensitive of ['private_key', 'client_email', 'date of birth', 'transcript', 'recommendation letter']) {
  assert(!serializedCatalog.includes(sensitive), `public catalog contains sensitive marker ${sensitive}`);
}

const exportRows = toExportRows(catalog.awards);
assert.equal(exportRows.length, 16);
for (const row of exportRows) assert.deepEqual(Object.keys(row), [...EXPORT_HEADERS], 'exports must use the independent fixed allow-list');
const csv = serializeAwardCsv(catalog.awards);
assert.equal(csv.split('\r\n').filter(Boolean).length, 17, 'CSV must contain one header plus every award');
for (const forbidden of FORBIDDEN_PUBLIC_KEYS) assert(!csv.includes(forbidden), `CSV leaked forbidden field ${forbidden}`);
const injectionProbe = { ...catalog.awards[0], name: '=HYPERLINK("https://invalid.example")' } as StudentAward;
assert(serializeAwardCsv([injectionProbe]).includes("'=HYPERLINK"), 'CSV formula-like values must be neutralized');

const matrix = JSON.parse(fs.readFileSync(path.join(repoRoot, 'docs/evidence/P7-test-matrix.json'), 'utf8')) as {
  declaredBeforeImplementation: boolean;
  viewports: Array<{ id: string; width: number; height: number }>;
  architectureCoverage: Array<{ architecture: string; scenarioIds: string[] }>;
  journeys: Array<{ id: string; kind: 'visual' | 'nonvisual'; viewports: string[]; viewportExclusion?: string }>;
  acceptedExclusions: unknown[];
};
assert.equal(matrix.declaredBeforeImplementation, true);
assert.deepEqual(matrix.viewports, [
  { id: 'mobile', width: 360, height: 800 },
  { id: 'tablet', width: 768, height: 1024 },
  { id: 'desktop', width: 1440, height: 900 },
]);
assert.deepEqual(matrix.architectureCoverage.map((item) => item.architecture).sort(), [...SOURCE_ARCHITECTURES].sort(), 'matrix must cover every canonical source architecture');
assert(matrix.architectureCoverage.every((item) => item.scenarioIds.length > 0));
for (const journey of matrix.journeys) {
  if (journey.kind === 'visual') assert.deepEqual(journey.viewports, ['mobile', 'tablet', 'desktop'], `${journey.id} must run at every required viewport`);
  else assert(journey.viewportExclusion, `${journey.id} requires an explicit reason for being viewport-independent`);
}
assert.equal(matrix.acceptedExclusions.length, 0);
for (const required of ['single-award-filter-sort', 'shared-application', 'portal-versus-award', 'paper-form-offline', 'automatic-and-matched', 'unavailable-and-unknown-cycles', 'empty-filter-state', 'recoverable-error-state', 'keyboard-and-accessibility', 'api-contract-privacy', 'export-contract-privacy']) {
  assert(matrix.journeys.some((journey) => journey.id === required), `matrix is missing ${required}`);
}

const scenarios = JSON.parse(fs.readFileSync(path.join(webRoot, 'fixtures/p2/model-scenarios.json'), 'utf8')) as {
  scenarios: Array<{ applicationGroups: Array<{ mode: string }> }>;
};
const scenarioModes = new Set(scenarios.scenarios.flatMap((scenario) => scenario.applicationGroups.map((group) => group.mode)));
for (const mode of ['automatic_consideration', 'selectable_children', 'eligibility_matched', 'shared_with_supplements', 'offline']) {
  assert(scenarioModes.has(mode), `P2 scenario set must exercise ${mode}`);
  assert(APPLICATION_MODES.includes(mode as (typeof APPLICATION_MODES)[number]));
}

console.log('P7 API, count, cycle, architecture-matrix, privacy, and export tests passed.');
