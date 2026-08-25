import fs from 'node:fs';
import path from 'node:path';
import {
  adaptP1Inventory,
  CanonicalDatasetSchema,
  MODEL_SCHEMA_VERSION,
  P1InventoryInput,
  roundTripP1Records,
  sha256Text,
  SOURCE_ARCHITECTURES,
} from '../src/lib/canonicalModel';

const webRoot = process.cwd();
const repoRoot = path.resolve(webRoot, '..');
const inventoryPath = path.join(repoRoot, 'docs/evidence/P1-inventory.json');
const p1ManifestPath = path.join(repoRoot, 'docs/evidence/P1-manifest.json');
const scenariosPath = path.join(webRoot, 'fixtures/p2/model-scenarios.json');
const fieldMapPath = path.join(webRoot, 'fixtures/p2/legacy-field-map.json');
const dryRunPath = path.join(repoRoot, 'docs/evidence/P2-dry-run.json');
const compatibilityPath = path.join(repoRoot, 'docs/evidence/P2-compatibility.json');

function readJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(file, 'utf8')) as T;
}

function canonicalJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function sha256File(file: string): string {
  return sha256Text(fs.readFileSync(file, 'utf8'));
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const inventory = readJson<P1InventoryInput>(inventoryPath);
const scenarios = readJson<{
  schemaVersion: number;
  modelSchemaVersion: string;
  scenarios: Array<{
    id: string;
    description: string;
    architectures: string[];
    applicationMode: string;
    scholarshipCount: number;
    sharedApplication: boolean;
    supplements: string;
  }>;
}>(scenariosPath);
const fieldMap = readJson<{
  schemaVersion: number;
  modelSchemaVersion: string;
  sourceSchema: string;
  mappings: Array<{
    legacyField: string;
    canonicalTargets: string[];
    p1Availability: 'retained' | 'excluded_from_sanitized_input';
    conversion: string;
  }>;
}>(fieldMapPath);

const pinnedInput = {
  p1InventorySha256: sha256File(inventoryPath),
  p1ManifestSha256: sha256File(p1ManifestPath),
  spreadsheetRevisionId: inventory.generatedFrom.spreadsheetRevisionId,
  capturedAt: inventory.generatedFrom.capturedAt,
};

const dataset = adaptP1Inventory(inventory, pinnedInput);
const repeatedDataset = adaptP1Inventory(inventory, pinnedInput);
CanonicalDatasetSchema.parse(dataset);
CanonicalDatasetSchema.parse(repeatedDataset);

const datasetJson = canonicalJson(dataset);
const repeatedDatasetJson = canonicalJson(repeatedDataset);
assert(datasetJson === repeatedDatasetJson, 'P2 adapter output is not deterministic');

const roundTrip = roundTripP1Records(dataset);
const originalRecords = inventory.records.slice().sort((a, b) => a.sheetRow - b.sheetRow);
assert(JSON.stringify(roundTrip) === JSON.stringify(originalRecords), 'P1 compatibility round trip is not exact');

const sourceIds = new Set(dataset.sources.map((source) => source.id));
const scholarshipIds = new Set(dataset.scholarships.map((scholarship) => scholarship.id));
const applicationGroupIds = new Set(dataset.applicationGroups.map((group) => group.id));
const cycleIds = new Set(dataset.cycles.map((cycle) => cycle.id));
const evidenceIds = new Set(dataset.evidence.map((item) => item.id));
const reviewIds = new Set(dataset.reviewItems.map((item) => item.id));
assert(sourceIds.size === dataset.sources.length, 'Duplicate source identifier');
assert(scholarshipIds.size === dataset.scholarships.length, 'Duplicate scholarship identifier');
assert(applicationGroupIds.size === dataset.applicationGroups.length, 'Duplicate application-group identifier');
assert(cycleIds.size === dataset.cycles.length, 'Duplicate cycle identifier');
assert(evidenceIds.size === dataset.evidence.length, 'Duplicate evidence identifier');
assert(reviewIds.size === dataset.reviewItems.length, 'Duplicate review-item identifier');

for (const scholarship of dataset.scholarships) {
  assert(scholarship.sourceIds.every((id) => sourceIds.has(id)), `Scholarship ${scholarship.id} has a missing source`);
  assert(scholarship.cycleIds.every((id) => cycleIds.has(id)), `Scholarship ${scholarship.id} has a missing cycle`);
  assert(scholarship.applicationGroupIds.every((id) => applicationGroupIds.has(id)), `Scholarship ${scholarship.id} has a missing application group`);
}
for (const group of dataset.applicationGroups) {
  assert(group.sourceIds.every((id) => sourceIds.has(id)), `Application group ${group.id} has a missing source`);
  assert(group.scholarshipIds.every((id) => scholarshipIds.has(id)), `Application group ${group.id} has a missing scholarship`);
}
for (const cycle of dataset.cycles) {
  assert(scholarshipIds.has(cycle.scholarshipId), `Cycle ${cycle.id} has a missing scholarship`);
  assert(cycle.applicationGroupId === null || applicationGroupIds.has(cycle.applicationGroupId), `Cycle ${cycle.id} has a missing application group`);
}

const fixtureTaxonomies = [...new Set(scenarios.scenarios.flatMap((scenario) => scenario.architectures))].sort();
assert(
  JSON.stringify(fixtureTaxonomies) === JSON.stringify([...SOURCE_ARCHITECTURES].sort()),
  'P2 scenarios do not cover every source architecture taxonomy',
);

const fieldNames = fieldMap.mappings.map((mapping) => mapping.legacyField);
assert(fieldNames.length === 15 && new Set(fieldNames).size === 15, 'Legacy field map must cover exactly 15 unique student fields');
assert(fieldMap.mappings.every((mapping) => mapping.canonicalTargets.length > 0), 'Every legacy field needs a canonical target');

const p1UrlSources = dataset.sources.filter((source) => source.legacySourceIdentity !== null);
const offlineSources = dataset.sources.filter((source) => source.canonicalUrl === null);
const scholarshipBindings = dataset.legacyBindings.filter((binding) => binding.targetKind === 'scholarship');
const portalBindings = dataset.legacyBindings.filter((binding) => binding.targetKind === 'source_record');
const referenceOccurrences = inventory.records.reduce((total, record) => total + record.references.length, 0);
const manualSourceReviews = dataset.reviewItems.filter(
  (item) => item.subjectKind === 'source' && ['source_manual_review', 'architecture_unknown'].includes(item.reason),
).length;
const manualRecordReviews = dataset.reviewItems.filter((item) => item.reason === 'record_manual_review').length;
const identityReviewCount = dataset.reviewItems.filter((item) => item.reason === 'identity_ambiguity' && item.subjectKind === 'source').length;
const unknownRecordCount = inventory.records.filter((record) => record.architecture === 'unknown').length;
const unknownSourceCount = inventory.sources.filter((source) => source.architecture === 'unknown').length;

assert(dataset.legacyBindings.length === inventory.counts.populatedRecords, 'Legacy binding count drifted');
assert(scholarshipBindings.length === inventory.counts.labels.Scholarship, 'Scholarship row count drifted');
assert(portalBindings.length === inventory.counts.labels.Portal, 'Portal row count drifted');
assert(p1UrlSources.length === inventory.counts.distinctUrls, 'P1 URL source count drifted');
assert(offlineSources.length === inventory.records.filter((record) => record.references.length === 0).length, 'Offline source count drifted');
assert(referenceOccurrences === inventory.counts.urlOccurrences, 'URL-role occurrence count drifted');
assert(manualSourceReviews === inventory.sources.filter((source) => source.reviewState === 'manual_review').length, 'Manual source reviews were lost');
assert(manualRecordReviews === inventory.records.filter((record) => record.reviewState === 'manual_review').length, 'Manual record reviews were lost');
assert(identityReviewCount === inventory.counts.queryOrFragmentSensitiveSources, 'Identity-bearing query/fragment reviews were lost');

const sourceIdsByRow = new Map<number, Set<string>>();
for (const binding of dataset.legacyBindings) {
  const ids = new Set<string>();
  for (const ref of binding.legacyRecord.references) {
    const source = dataset.sources.find((item) => item.canonicalUrl === ref.urlIdentity);
    if (source) ids.add(source.id);
  }
  sourceIdsByRow.set(binding.sheetRow, ids);
}
const sharedGroups = inventory.sharedUrlGroups.map((group) => ({
  normalizedUrlWithoutQueryOrFragment: group.normalizedUrlWithoutQueryOrFragment,
  expectedRecordCount: group.recordCount,
  mappedSheetRows: group.sheetRows.filter((row) => sourceIdsByRow.has(row)).length,
  canonicalSourceIds: [...new Set(group.sheetRows.flatMap((row) => [...(sourceIdsByRow.get(row) ?? [])]))].sort(),
}));
assert(sharedGroups.every((group) => group.mappedSheetRows === group.expectedRecordCount), 'Shared-source row mapping is incomplete');

const preservedIdentitySources = inventory.sources.filter(
  (source) => source.identityBearingQueryParameters.length > 0 || source.fragmentPresent,
);
assert(preservedIdentitySources.length === inventory.counts.queryOrFragmentSensitiveSources, 'P1 identity-sensitive denominator drifted');
assert(
  preservedIdentitySources.every((input) => dataset.sources.some((source) => source.canonicalUrl === input.normalizedUrl)),
  'An identity-bearing query or fragment was normalized away',
);

const dryRun = {
  schemaVersion: 1,
  stageId: 'P2',
  baselineCommit: '6a6d64339d44cbede99acfd5a3966781f1f9c4f6',
  modelSchemaVersion: MODEL_SCHEMA_VERSION,
  pinnedInput,
  canonicalDatasetSha256: sha256Text(datasetJson),
  identityDeterminism: {
    repeatedRunSha256: sha256Text(repeatedDatasetJson),
    byteIdentical: datasetJson === repeatedDatasetJson,
  },
  counts: {
    legacyRecords: dataset.legacyBindings.length,
    scholarshipBindings: scholarshipBindings.length,
    portalBindings: portalBindings.length,
    p1UrlSources: p1UrlSources.length,
    offlineSources: offlineSources.length,
    canonicalSources: dataset.sources.length,
    applicationGroups: dataset.applicationGroups.length,
    cycles: dataset.cycles.length,
    evidenceItems: dataset.evidence.length,
    reviewItems: dataset.reviewItems.length,
    urlRoleOccurrences: referenceOccurrences,
    sharedSourceGroups: sharedGroups.length,
    identityBearingQueryOrFragmentSources: preservedIdentitySources.length,
    unknownRecords: unknownRecordCount,
    unknownSources: unknownSourceCount,
  },
  reconciliation: {
    everyP1RecordBound: dataset.legacyBindings.length === inventory.counts.populatedRecords,
    scholarshipRowsRemainAwards: scholarshipBindings.length === inventory.counts.labels.Scholarship,
    portalRowsNotPromotedToAwards: portalBindings.length === inventory.counts.labels.Portal,
    everyP1UrlSourceMapped: p1UrlSources.length === inventory.counts.distinctUrls,
    everyUrlRoleOccurrencePreserved: referenceOccurrences === inventory.counts.urlOccurrences,
    everyUnknownPreserved: unknownRecordCount === 162 && unknownSourceCount === 121,
    everyManualReviewPreserved: manualRecordReviews === 188 && manualSourceReviews === 207,
    everyIdentitySensitiveUrlPreserved: preservedIdentitySources.length === 15,
    sharedSourceGroups: sharedGroups.length,
  },
  fixtureCoverage: {
    scenarioCount: scenarios.scenarios.length,
    scenarioIds: scenarios.scenarios.map((scenario) => scenario.id),
    architectures: fixtureTaxonomies,
    coversEveryTaxonomy: true,
  },
  boundaries: {
    spreadsheetReads: 0,
    spreadsheetWrites: 0,
    publicFetches: 0,
    formSubmissions: 0,
    providerContacts: 0,
    productBehaviorChanges: 0,
  },
};

const originalRecordJson = canonicalJson(originalRecords);
const roundTripJson = canonicalJson(roundTrip);
const compatibility = {
  schemaVersion: 1,
  stageId: 'P2',
  modelSchemaVersion: MODEL_SCHEMA_VERSION,
  pinnedP1InventorySha256: pinnedInput.p1InventorySha256,
  legacyFieldMapSha256: sha256File(fieldMapPath),
  fieldCoverage: {
    expectedStudentFields: 15,
    mappedStudentFields: fieldMap.mappings.length,
    retainedInP1Input: fieldMap.mappings.filter((mapping) => mapping.p1Availability === 'retained').length,
    explicitlyUnavailableInP1Input: fieldMap.mappings.filter((mapping) => mapping.p1Availability === 'excluded_from_sanitized_input').length,
    allHaveCanonicalTargets: fieldMap.mappings.every((mapping) => mapping.canonicalTargets.length > 0),
    fields: fieldMap.mappings,
  },
  roundTrip: {
    inputRecordCount: originalRecords.length,
    outputRecordCount: roundTrip.length,
    inputSha256: sha256Text(originalRecordJson),
    outputSha256: sha256Text(roundTripJson),
    exact: originalRecordJson === roundTripJson,
  },
  relationshipChecks: {
    sourceReferencesResolve: true,
    scholarshipCyclesResolve: true,
    applicationGroupMembersResolve: true,
    oneUrlMaySupportMultipleAwards: sharedGroups.some((group) => group.expectedRecordCount > 1),
    oneAwardMayHaveMultipleCycles: 'schema_allows_multiple_cycle_ids',
    portalRowsRemainNonAwardBindings: portalBindings.length,
  },
};

const outputs = [
  [dryRunPath, canonicalJson(dryRun)],
  [compatibilityPath, canonicalJson(compatibility)],
] as const;

if (process.argv.includes('--check')) {
  for (const [file, expected] of outputs) {
    assert(fs.existsSync(file), `Missing generated P2 evidence: ${path.relative(repoRoot, file)}`);
    assert(fs.readFileSync(file, 'utf8') === expected, `Generated P2 evidence drifted: ${path.relative(repoRoot, file)}`);
  }
  console.log(`P2 MODEL CHECK PASS ${sha256Text(datasetJson)}`);
} else {
  for (const [file, contents] of outputs) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, contents);
  }
  console.log(`P2 MODEL GENERATED ${sha256Text(datasetJson)}`);
}
