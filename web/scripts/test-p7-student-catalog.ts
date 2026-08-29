import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import catalogJson from '../fixtures/p7/student-catalog.json';
import matrixCatalogJson from '../fixtures/p7/matrix-catalog.json';
import legacyApiDataJson from '../fixtures/p7/legacy-api-data.json';
import { awardCsvDataUri, EXPORT_HEADERS, serializeAwardCsv, toExportRows } from '../src/lib/export';
import {
  APPLICATION_MODES,
  collectObjectKeys,
  FORBIDDEN_PUBLIC_KEYS,
  PUBLIC_AWARD_FIELDS,
  PUBLIC_PORTAL_FIELDS,
  PUBLIC_SOURCE_FIELDS,
  StudentCatalogSchema,
  type StudentAward,
} from '../src/lib/studentCatalog';
import { SOURCE_ARCHITECTURES } from '../src/lib/canonicalModel';
import { STUDENT_HEADERS } from '../src/lib/pushMapping';

const webRoot = process.cwd();
const repoRoot = path.resolve(webRoot, '..');
const catalog = StudentCatalogSchema.parse(catalogJson);
const matrixCatalog = StudentCatalogSchema.parse(matrixCatalogJson);

assert.deepEqual(catalog.counts, {
  sources: 217,
  portals: 21,
  awards: 192,
  applicationGroups: 4,
  cycles: 192,
  activeCycles: 0,
  upcomingCycles: 0,
  closedCycles: 0,
  unavailableCycles: 0,
  unknownCycles: 192,
  minimumObservedRecipientSlots: 71,
}, 'student counts must reconcile the accepted P2/P5 baseline plus P6 expansion');
assert.equal(catalog.awards.length, catalog.counts.awards);
assert.equal(catalog.sources.length, catalog.counts.sources);
assert.equal(catalog.portals.length, catalog.counts.portals);
assert.equal(catalog.applicationGroups.length, catalog.counts.applicationGroups);
assert.equal(catalog.awards.filter((award) => award.cycle.status === 'active').length, 0, 'yearless rules must never become active');
assert.equal(catalog.awards.filter((award) => award.cycle.status === 'unknown').length, 192);
assert(catalog.awards.every((award) => award.cycle.year === null), 'unknown annual cycles must not fabricate a year');
assert.equal(catalog.awards.filter((award) => award.application.label.includes('Shared application')).length >= 16, true);
assert(catalog.applicationGroups.some((group) => group.awardPublicIds.length === 16), 'P6 shared application must preserve all child relationships');
assert(catalog.sources.every((source) => source.url === null || source.url.startsWith('https://')), 'student source links must use public HTTPS URLs');

for (const award of catalog.awards) {
  assert.deepEqual(Object.keys(award).sort(), [...PUBLIC_AWARD_FIELDS].sort(), `${award.name} must use the exact award allow-list`);
}
for (const source of catalog.sources) {
  assert.deepEqual(Object.keys(source).sort(), [...PUBLIC_SOURCE_FIELDS].sort(), `${source.title} must use the exact source allow-list`);
}
for (const portal of catalog.portals) {
  assert.deepEqual(Object.keys(portal).sort(), [...PUBLIC_PORTAL_FIELDS].sort(), `${portal.title} must use the exact portal allow-list`);
}
assert.equal(legacyApiDataJson.length, 197, 'legacy API compatibility data must preserve every accepted P5 row');
for (const row of legacyApiDataJson) assert.deepEqual(Object.keys(row), [...STUDENT_HEADERS], 'legacy compatibility rows must preserve the exact hard allow-list');
const publicKeys = collectObjectKeys(catalog);
for (const forbidden of FORBIDDEN_PUBLIC_KEYS) assert(!publicKeys.has(forbidden), `public catalog leaked forbidden key ${forbidden}`);
const serializedCatalog = JSON.stringify(catalog).toLowerCase();
for (const sensitive of ['private_key', 'client_email', 'date of birth', 'transcript', 'recommendation letter']) {
  assert(!serializedCatalog.includes(sensitive), `public catalog contains sensitive marker ${sensitive}`);
}

const exportRows = toExportRows(catalog.awards);
assert.equal(exportRows.length, 192);
for (const row of exportRows) assert.deepEqual(Object.keys(row), [...EXPORT_HEADERS], 'exports must use the independent fixed allow-list');
const csv = serializeAwardCsv(catalog.awards);
assert(awardCsvDataUri(catalog.awards).startsWith('data:text/csv;charset=utf-8,'));
assert.equal(csv.split('\r\n').filter(Boolean).length, 193, 'CSV must contain one header plus every award');
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
assert.deepEqual(matrixCatalog.sources.map((source) => source.architecture).sort(), [...SOURCE_ARCHITECTURES].sort(), 'browser matrix catalog must render every architecture');
assert.equal(matrixCatalog.sources.filter((source) => source.recordType === 'portal').length, 5);
assert.equal(matrixCatalog.awards.filter((award) => award.cycle.status === 'unavailable').length, 1);
assert.equal(matrixCatalog.awards.filter((award) => award.application.mode === 'automatic_consideration').length, 1);
assert.equal(matrixCatalog.awards.filter((award) => award.application.mode === 'offline').length, 1);

console.log('P7 API, count, cycle, architecture-matrix, privacy, and export tests passed.');
