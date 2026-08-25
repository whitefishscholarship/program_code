import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  adaptP1Inventory,
  CanonicalDatasetSchema,
  CycleSchema,
  MODEL_SCHEMA_VERSION,
  P1InventoryInput,
  roundTripP1Records,
  sha256Text,
  SOURCE_ARCHITECTURES,
  stableId,
} from '../src/lib/canonicalModel';

const webRoot = process.cwd();
const repoRoot = path.resolve(webRoot, '..');
const inventoryPath = path.join(repoRoot, 'docs/evidence/P1-inventory.json');
const manifestPath = path.join(repoRoot, 'docs/evidence/P1-manifest.json');
const inventoryText = fs.readFileSync(inventoryPath, 'utf8');
const inventory = JSON.parse(inventoryText) as P1InventoryInput;
const pinnedInput = {
  p1InventorySha256: sha256Text(inventoryText),
  p1ManifestSha256: sha256Text(fs.readFileSync(manifestPath, 'utf8')),
  spreadsheetRevisionId: inventory.generatedFrom.spreadsheetRevisionId,
  capturedAt: inventory.generatedFrom.capturedAt,
};

const first = adaptP1Inventory(inventory, pinnedInput);
const second = adaptP1Inventory(inventory, pinnedInput);
CanonicalDatasetSchema.parse(first);

assert.deepEqual(first, second, 'same pinned input must produce the same canonical dataset');
assert.equal(first.legacyBindings.length, 197, 'all P1 records must have a compatibility binding');
assert.equal(first.scholarships.length, 176, 'only P1 Scholarship rows become awards');
assert.equal(first.legacyBindings.filter((item) => item.targetKind === 'source_record').length, 21, 'Portal rows must remain non-award bindings');
assert.equal(first.sources.filter((item) => item.legacySourceIdentity !== null).length, 213, 'all URL sources must map');
assert.equal(first.sources.filter((item) => item.canonicalUrl === null).length, 4, 'offline methods require explicit sources');
assert.equal(first.cycles.length, 176, 'every migrated award has an explicit unknown cycle');
assert.equal(first.cycles.filter((item) => item.status === 'unknown').length, 176, 'P1 must not invent cycle state');
assert.equal(first.applicationGroups.length, 3, 'P1 common/matching sources must remain explicit groups');

assert.deepEqual(roundTripP1Records(first), inventory.records, 'round trip must preserve every retained P1 field and reference');
assert.equal(first.reviewItems.filter((item) => item.reason === 'record_manual_review').length, 188, 'manual record reviews must survive');
assert.equal(
  first.reviewItems.filter(
    (item) => item.subjectKind === 'source' && ['source_manual_review', 'architecture_unknown'].includes(item.reason),
  ).length,
  207,
  'manual source reviews must survive',
);
assert.equal(
  first.reviewItems.filter((item) => item.reason === 'identity_ambiguity' && item.subjectKind === 'source').length,
  15,
  'identity-bearing query and fragment sources must survive',
);

const sameUrlSourceIds = first.sources.filter((source) => source.canonicalUrl === 'https://whitefisheducationfoundation.org/scholarships/');
assert.equal(sameUrlSourceIds.length, 1, 'one URL should have one source identity');
const sharedScholarships = first.scholarships.filter((scholarship) => scholarship.sourceIds.includes(sameUrlSourceIds[0].id));
const expectedSharedCount = inventory.sharedUrlGroups.find(
  (group) => group.normalizedUrlWithoutQueryOrFragment === 'https://whitefisheducationfoundation.org/scholarships/',
)?.recordCount;
assert.equal(sharedScholarships.length, expectedSharedCount, 'one source URL must support multiple distinct scholarship identities');
assert.equal(new Set(sharedScholarships.map((item) => item.id)).size, expectedSharedCount, 'shared source must not deduplicate awards');

const grantInterfaceSources = first.sources.filter((source) => source.host === 'grantinterface.com');
assert.equal(grantInterfaceSources.length, 2, 'identity-bearing urlkey values must remain distinct source identities');
assert.notEqual(grantInterfaceSources[0].id, grantInterfaceSources[1].id, 'distinct preserved query values must not collide');
assert(first.sources.some((source) => source.canonicalUrl?.endsWith('#c475')), 'meaningful fragment must be preserved');

const baseScholarship = first.scholarships[0];
const secondCycleId = stableId('cyc', [baseScholarship.id, 'synthetic-second-cycle']);
CycleSchema.parse({
  ...first.cycles.find((cycle) => cycle.scholarshipId === baseScholarship.id),
  id: secondCycleId,
  cycleKey: 'synthetic-second-cycle',
});
CanonicalDatasetSchema.parse({
  ...first,
  scholarships: first.scholarships.map((scholarship) =>
    scholarship.id === baseScholarship.id
      ? { ...scholarship, cycleIds: [...scholarship.cycleIds, secondCycleId] }
      : scholarship,
  ),
  cycles: [
    ...first.cycles,
    {
      ...first.cycles.find((cycle) => cycle.scholarshipId === baseScholarship.id)!,
      id: secondCycleId,
      cycleKey: 'synthetic-second-cycle',
    },
  ],
});

const scenarios = JSON.parse(fs.readFileSync(path.join(webRoot, 'fixtures/p2/model-scenarios.json'), 'utf8')) as {
  scenarios: Array<{ architectures: string[] }>;
};
const covered = [...new Set(scenarios.scenarios.flatMap((item) => item.architectures))].sort();
assert.deepEqual(covered, [...SOURCE_ARCHITECTURES].sort(), 'fixtures must cover every architecture taxonomy');

const fieldMap = JSON.parse(fs.readFileSync(path.join(webRoot, 'fixtures/p2/legacy-field-map.json'), 'utf8')) as {
  modelSchemaVersion: string;
  mappings: Array<{ legacyField: string; canonicalTargets: string[]; p1Availability: string }>;
};
assert.equal(fieldMap.modelSchemaVersion, MODEL_SCHEMA_VERSION);
assert.equal(fieldMap.mappings.length, 15, 'all student-facing legacy fields must map');
assert.equal(new Set(fieldMap.mappings.map((item) => item.legacyField)).size, 15, 'field mappings must be unique');
assert(fieldMap.mappings.every((item) => item.canonicalTargets.length > 0), 'every legacy field must have a canonical target');
assert.equal(fieldMap.mappings.filter((item) => item.p1Availability === 'retained').length, 4);
assert.equal(fieldMap.mappings.filter((item) => item.p1Availability === 'excluded_from_sanitized_input').length, 11);

const dryRun = JSON.parse(fs.readFileSync(path.join(repoRoot, 'docs/evidence/P2-dry-run.json'), 'utf8')) as {
  canonicalDatasetSha256: string;
  reconciliation: Record<string, unknown>;
};
assert.equal(dryRun.canonicalDatasetSha256, sha256Text(`${JSON.stringify(first, null, 2)}\n`));
assert(Object.values(dryRun.reconciliation).every((value) => typeof value !== 'boolean' || value), 'all dry-run boolean reconciliation checks must pass');

console.log(`P2 DATA MODEL TEST ALL PASS ${dryRun.canonicalDatasetSha256}`);
