import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  adaptP1Inventory,
  ApplicationGroupSchema,
  canonicalRelationshipErrors,
  CanonicalDatasetSchema,
  CycleSchema,
  evidenceId,
  EvidenceSchema,
  LEGACY_STUDENT_FIELDS,
  LegacyStudentFieldValuesSchema,
  MODEL_SCHEMA_VERSION,
  P1InventoryInput,
  ReviewItemSchema,
  roundTripP1Records,
  ScholarshipSchema,
  sha256Text,
  SourceSchema,
  SOURCE_ARCHITECTURES,
  stableId,
  StudentFieldsSchema,
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
assert.deepEqual(canonicalRelationshipErrors(first), [], 'every generated relationship and subject must resolve');

const versionedSourceId = stableId('src', ['version-probe']);
assert.equal(
  versionedSourceId,
  `src_${sha256Text(JSON.stringify([MODEL_SCHEMA_VERSION, 'version-probe']))}`,
  'stable IDs must include the model schema version',
);
assert.notEqual(
  versionedSourceId,
  `src_${sha256Text(JSON.stringify(['version-probe']))}`,
  'versioned identity must differ from the legacy unversioned digest',
);

const observationBase = {
  subjectKind: 'source' as const,
  subjectId: versionedSourceId,
  fieldPath: 'architecture',
  sourceId: versionedSourceId,
  retrievedAt: '2026-08-24T12:00:00-06:00',
  sourceRevision: 'revision-a',
  result: 'observed' as const,
  claim: 'Architecture observed.',
  contentSha256: sha256Text('Architecture observed.'),
};
assert.notEqual(
  evidenceId(observationBase),
  evidenceId({ ...observationBase, retrievedAt: '2026-08-25T12:00:00-06:00', sourceRevision: 'revision-b' }),
  'successive observations must not collide',
);
assert.notEqual(
  evidenceId(observationBase),
  evidenceId({ ...observationBase, sourceId: stableId('src', ['corroborating-source']) }),
  'corroborating sources must not collide',
);

const studentFieldCases = [
  {
    label: 'typed',
    value: {
      summary: { raw: 'Supports local graduates.', state: 'known', evidenceIds: [] },
      awardAmount: { raw: '$1,000-$2,500', minimum: 1000, maximum: 2500, currency: 'USD', state: 'variable', evidenceIds: [] },
      eligibility: {
        location: { raw: 'Flathead County', state: 'known' },
        minimumGpa: { raw: '3.0', value: 3, state: 'known' },
        schoolTypes: { raw: '2-year or trade', values: ['two_year', 'trade'], state: 'known' },
        focus: { raw: 'Forestry', state: 'known' },
        gapYear: { raw: 'Yes, after one year', value: 'conditional', state: 'known' },
      },
      selection: { financialNeedPriority: { raw: 'Preference for need', value: 'prioritized', state: 'known' } },
      renewal: { raw: 'Renews with progress', value: 'conditional', state: 'known' },
    },
  },
  {
    label: 'unknown',
    value: {
      summary: { raw: null, state: 'unknown', evidenceIds: [] },
      awardAmount: { raw: null, minimum: null, maximum: null, currency: null, state: 'unknown', evidenceIds: [] },
      eligibility: {
        location: { raw: null, state: 'unknown' },
        minimumGpa: { raw: null, value: null, state: 'unknown' },
        schoolTypes: { raw: null, values: [], state: 'unknown' },
        focus: { raw: null, state: 'unknown' },
        gapYear: { raw: null, value: null, state: 'unknown' },
      },
      selection: { financialNeedPriority: { raw: null, value: null, state: 'unknown' } },
      renewal: { raw: null, value: null, state: 'unknown' },
    },
  },
  {
    label: 'unparseable',
    value: {
      summary: { raw: 'Unstructured summary', state: 'known', evidenceIds: [] },
      awardAmount: { raw: 'varies a bunch', minimum: null, maximum: null, currency: null, state: 'unparseable', evidenceIds: [] },
      eligibility: {
        location: { raw: 'local-ish', state: 'unparseable' },
        minimumGpa: { raw: 'good grades', value: null, state: 'unparseable' },
        schoolTypes: { raw: 'college-ish', values: [], state: 'unparseable' },
        focus: { raw: 'STEM-ish', state: 'unparseable' },
        gapYear: { raw: 'maybe after time off', value: null, state: 'unparseable' },
      },
      selection: { financialNeedPriority: { raw: 'need considered somehow', value: null, state: 'unparseable' } },
      renewal: { raw: 'possibly again', value: null, state: 'unparseable' },
    },
  },
] as const;
for (const fixture of studentFieldCases) {
  assert.deepEqual(StudentFieldsSchema.parse(fixture.value), fixture.value, `${fixture.label} student fields must round-trip losslessly`);
}

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

type ScenarioFixture = {
  id: string;
  description: string;
  sources: Array<{ key: string; architecture: (typeof SOURCE_ARCHITECTURES)[number]; parentKeys: string[]; childKeys: string[]; access: 'public' | 'authenticated' | 'offline' | 'unknown' }>;
  scholarships: Array<{ key: string; sourceKeys: string[]; applicationGroupKeys: string[]; cycleKeys: string[] }>;
  applicationGroups: Array<{ key: string; mode: 'automatic_consideration' | 'selectable_children' | 'eligibility_matched' | 'shared_with_supplements' | 'direct_per_award' | 'offline' | 'unknown'; sourceKeys: string[]; scholarshipKeys: string[]; supplements: 'required' | 'not_required' | 'mixed' | 'unknown' }>;
  cycles: Array<{ key: string; scholarshipKey: string; applicationGroupKey: string | null; status: 'active' | 'closed' | 'upcoming' | 'unavailable' | 'unknown' }>;
  evidence: Array<{ key: string; subjectKind: 'source' | 'scholarship' | 'application_group' | 'cycle'; subjectKey: string; sourceKey: string; result: 'observed' | 'supported' | 'conflicting' | 'inconclusive' | 'unverified' }>;
  reviewItems: Array<{ key: string; subjectKind: 'source' | 'scholarship' | 'application_group' | 'cycle'; subjectKey: string; reason: 'architecture_unknown' | 'source_manual_review' | 'record_manual_review' | 'identity_ambiguity' | 'cycle_unknown' | 'excluded_legacy_field' | 'conflicting_evidence' | 'access_blocked' | 'other' }>;
};
const scenarios = JSON.parse(fs.readFileSync(path.join(webRoot, 'fixtures/p2/model-scenarios.json'), 'utf8')) as {
  schemaVersion: number;
  modelSchemaVersion: string;
  scenarios: ScenarioFixture[];
};
assert.equal(scenarios.schemaVersion, 2, 'scenario fixtures must contain model entities, not label descriptors');
assert.equal(scenarios.modelSchemaVersion, MODEL_SCHEMA_VERSION);

const fixtureDatasets = scenarios.scenarios.map((scenario) => {
  const sourceIds = new Map(scenario.sources.map((item) => [item.key, stableId('src', ['fixture', scenario.id, item.key])]));
  const scholarshipIds = new Map(scenario.scholarships.map((item) => [item.key, stableId('sch', ['fixture', scenario.id, item.key])]));
  const groupIds = new Map(scenario.applicationGroups.map((item) => [item.key, stableId('app', ['fixture', scenario.id, item.key])]));
  const cycleIds = new Map(scenario.cycles.map((item) => [item.key, stableId('cyc', ['fixture', scenario.id, item.key])]));
  const subjectId = (kind: ScenarioFixture['evidence'][number]['subjectKind'], key: string): string => {
    const ids = kind === 'source' ? sourceIds : kind === 'scholarship' ? scholarshipIds : kind === 'application_group' ? groupIds : cycleIds;
    const id = ids.get(key);
    assert(id, `${scenario.id} has missing ${kind} key ${key}`);
    return id;
  };
  const fixtureEvidence = scenario.evidence.map((item) => {
    const sourceId = sourceIds.get(item.sourceKey);
    assert(sourceId, `${scenario.id} evidence ${item.key} has missing source`);
    const claim = `${scenario.id}:${item.key}`;
    const identity = {
      subjectKind: item.subjectKind,
      subjectId: subjectId(item.subjectKind, item.subjectKey),
      fieldPath: item.key,
      sourceId,
      retrievedAt: '2026-08-24T12:00:00-06:00',
      sourceRevision: 'sanitized-fixture-v1',
      result: item.result,
      claim,
      contentSha256: sha256Text(claim),
    };
    return EvidenceSchema.parse({ schemaVersion: MODEL_SCHEMA_VERSION, id: evidenceId(identity), ...identity, reviewerState: item.result === 'unverified' ? 'manual_review' : 'classified' });
  });
  const fixtureReviews = scenario.reviewItems.map((item) => ReviewItemSchema.parse({
    schemaVersion: MODEL_SCHEMA_VERSION,
    id: stableId('rev', ['fixture', scenario.id, item.key]),
    subjectKind: item.subjectKind,
    subjectId: subjectId(item.subjectKind, item.subjectKey),
    reason: item.reason,
    state: 'open',
    summary: `${scenario.description} Review fixture ${item.key}.`,
    evidenceIds: fixtureEvidence.filter((evidenceItem) => evidenceItem.subjectId === subjectId(item.subjectKind, item.subjectKey)).map((evidenceItem) => evidenceItem.id),
    owner: null,
    targetStage: 'P3',
  }));
  const evidenceFor = (id: string) => fixtureEvidence.filter((item) => item.subjectId === id).map((item) => item.id);
  const reviewsFor = (id: string) => fixtureReviews.filter((item) => item.subjectId === id).map((item) => item.id);
  const fixtureSources = scenario.sources.map((item) => {
    const id = sourceIds.get(item.key)!;
    return SourceSchema.parse({
      schemaVersion: MODEL_SCHEMA_VERSION,
      id,
      architecture: item.architecture,
      canonicalUrl: item.access === 'offline' ? null : `https://fixtures.invalid/${scenario.id}/${item.key}`,
      offlineAuthority: item.access === 'offline' ? `Sanitized offline method ${item.key}` : null,
      host: item.access === 'offline' ? null : 'fixtures.invalid',
      identityPolicy: { preservedQueryParameters: item.architecture === 'unknown' ? ['award'] : [], fragmentPreserved: item.architecture === 'unknown', trackingParametersRemoved: true },
      accessBehavior: item.access,
      authority: item.architecture === 'external_marketplace' ? 'aggregator' : 'official_provider',
      acquisitionState: item.architecture === 'unknown' ? 'unknown' : 'observed',
      parentSourceIds: item.parentKeys.map((key) => sourceIds.get(key)!),
      childSourceIds: item.childKeys.map((key) => sourceIds.get(key)!),
      evidenceIds: evidenceFor(id),
      reviewItemIds: reviewsFor(id),
      legacySourceIdentity: null,
    });
  });
  const unknownFields = StudentFieldsSchema.parse(studentFieldCases[1].value);
  const fixtureScholarships = scenario.scholarships.map((item) => {
    const id = scholarshipIds.get(item.key)!;
    return ScholarshipSchema.parse({
      schemaVersion: MODEL_SCHEMA_VERSION,
      id,
      name: `Sanitized ${scenario.id} ${item.key}`,
      lifecycleState: 'modeled',
      legacyRowIdentities: [sha256Text(`fixture:${scenario.id}:${item.key}`)],
      sourceIds: item.sourceKeys.map((key) => sourceIds.get(key)!),
      sourceLinks: item.sourceKeys.map((key) => ({ sourceId: sourceIds.get(key)!, role: 'information', provenance: ['sanitized-fixture'] })),
      applicationGroupIds: item.applicationGroupKeys.map((key) => groupIds.get(key)!),
      cycleIds: item.cycleKeys.map((key) => cycleIds.get(key)!),
      evidenceIds: evidenceFor(id),
      reviewItemIds: reviewsFor(id),
      studentFields: unknownFields,
    });
  });
  const fixtureGroups = scenario.applicationGroups.map((item) => {
    const id = groupIds.get(item.key)!;
    return ApplicationGroupSchema.parse({
      schemaVersion: MODEL_SCHEMA_VERSION,
      id,
      mode: item.mode,
      sourceIds: item.sourceKeys.map((key) => sourceIds.get(key)!),
      scholarshipIds: item.scholarshipKeys.map((key) => scholarshipIds.get(key)!),
      supplementalRequirements: item.supplements,
      evidenceIds: evidenceFor(id),
      reviewItemIds: reviewsFor(id),
    });
  });
  const fixtureCycles = scenario.cycles.map((item) => {
    const id = cycleIds.get(item.key)!;
    return CycleSchema.parse({
      schemaVersion: MODEL_SCHEMA_VERSION,
      id,
      scholarshipId: scholarshipIds.get(item.scholarshipKey)!,
      cycleKey: item.key,
      year: 2026,
      opensAt: { value: null, precision: 'unknown', timezone: null },
      closesAt: { value: null, precision: 'unknown', timezone: null },
      status: item.status,
      recurrence: 'unknown',
      applicationGroupId: item.applicationGroupKey ? groupIds.get(item.applicationGroupKey)! : null,
      evidenceIds: evidenceFor(id),
      reviewItemIds: reviewsFor(id),
    });
  });
  const fixtureDataset = CanonicalDatasetSchema.parse({
    schemaVersion: MODEL_SCHEMA_VERSION,
    pinnedInput: { p1InventorySha256: sha256Text('sanitized-fixture'), p1ManifestSha256: sha256Text('sanitized-fixture-manifest'), spreadsheetRevisionId: 'sanitized-fixture', capturedAt: '2026-08-24T12:00:00-06:00' },
    sources: fixtureSources,
    scholarships: fixtureScholarships,
    applicationGroups: fixtureGroups,
    cycles: fixtureCycles,
    evidence: fixtureEvidence,
    reviewItems: fixtureReviews,
    legacyBindings: [],
  });
  assert.deepEqual(canonicalRelationshipErrors(fixtureDataset), [], `${scenario.id} fixture relationships must resolve`);
  assert.equal(fixtureDataset.scholarships.length, scenario.scholarships.length, `${scenario.id} child awards must remain exact`);
  assert.equal(fixtureDataset.applicationGroups.length, scenario.applicationGroups.length, `${scenario.id} application groups must remain exact`);
  assert.equal(fixtureDataset.cycles.length, scenario.cycles.length, `${scenario.id} cycles must remain exact`);
  return fixtureDataset;
});
assert.equal(fixtureDatasets.length, 12, 'all required sanitized model scenarios must parse');
const covered = [...new Set(fixtureDatasets.flatMap((dataset) => dataset.sources.map((source) => source.architecture)))].sort();
assert.deepEqual(covered, [...SOURCE_ARCHITECTURES].sort(), 'fixtures must cover every architecture taxonomy');

const fieldMap = JSON.parse(fs.readFileSync(path.join(webRoot, 'fixtures/p2/legacy-field-map.json'), 'utf8')) as {
  modelSchemaVersion: string;
  mappings: Array<{
    legacyField: string;
    canonicalTargets: string[];
    p1Availability: string;
    compatibilityCases: { raw: string; typed: string; unknown: null; unparseable: string };
  }>;
};
assert.equal(fieldMap.modelSchemaVersion, MODEL_SCHEMA_VERSION);
assert.equal(fieldMap.mappings.length, 15, 'all student-facing legacy fields must map');
assert.equal(new Set(fieldMap.mappings.map((item) => item.legacyField)).size, 15, 'field mappings must be unique');
assert(fieldMap.mappings.every((item) => item.canonicalTargets.length > 0), 'every legacy field must have a canonical target');
assert(
  fieldMap.mappings.every((item) => item.compatibilityCases.raw.length > 0
    && item.compatibilityCases.typed.length > 0
    && item.compatibilityCases.unknown === null
    && item.compatibilityCases.unparseable.length > 0),
  'all 15 legacy fields require raw, typed, unknown, and unparseable compatibility fixtures',
);
assert.equal(fieldMap.mappings.filter((item) => item.p1Availability === 'retained').length, 4);
assert.equal(fieldMap.mappings.filter((item) => item.p1Availability === 'excluded_from_sanitized_input').length, 11);

for (const state of ['known', 'unknown', 'unparseable'] as const) {
  const values = Object.fromEntries(fieldMap.mappings.map((mapping) => [
    mapping.legacyField,
    state === 'known'
      ? { raw: mapping.compatibilityCases.raw, typed: mapping.compatibilityCases.typed, state, evidenceIds: [] }
      : state === 'unknown'
        ? { raw: null, typed: null, state, evidenceIds: [] }
        : { raw: mapping.compatibilityCases.unparseable, typed: null, state, evidenceIds: [] },
  ]));
  const parsed = LegacyStudentFieldValuesSchema.parse(values);
  assert.deepEqual(parsed, values, `all 15 ${state} legacy compatibility values must round-trip exactly`);
  assert.deepEqual(Object.keys(parsed).sort(), [...LEGACY_STUDENT_FIELDS].sort(), `all 15 ${state} fields must be exhaustive`);
}
assert(
  first.legacyBindings.every((binding) => Object.keys(binding.studentFieldCompatibility).length === 15),
  'every migrated record must carry all 15 compatibility fields',
);

const dryRun = JSON.parse(fs.readFileSync(path.join(repoRoot, 'docs/evidence/P2-dry-run.json'), 'utf8')) as {
  canonicalDatasetSha256: string;
  reconciliation: Record<string, unknown>;
};
assert.equal(dryRun.canonicalDatasetSha256, sha256Text(`${JSON.stringify(first, null, 2)}\n`));
assert(Object.values(dryRun.reconciliation).every((value) => typeof value !== 'boolean' || value), 'all dry-run boolean reconciliation checks must pass');

console.log(`P2 DATA MODEL TEST ALL PASS ${dryRun.canonicalDatasetSha256}`);
