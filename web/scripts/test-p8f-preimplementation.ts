import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const webRoot = process.cwd();
const repoRoot = path.resolve(webRoot, '..');
const readJson = <T>(relativePath: string): T => JSON.parse(
  fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'),
) as T;
const sha256 = (relativePath: string): string => crypto
  .createHash('sha256')
  .update(fs.readFileSync(path.join(repoRoot, relativePath)))
  .digest('hex');
const git = (...args: string[]): string => execFileSync('git', args, {
  cwd: repoRoot,
  encoding: 'utf8',
}).trim();

type MapEntry = {
  oldId: string;
  newControlId: string;
  label: string;
  criterionId: string;
  sensitive?: boolean;
  ruleMode: string;
};

type QuestionRuleMap = {
  schemaVersion: number;
  stageId: string;
  baselineCommit: string;
  historicalSnapshotCommit: string;
  taxonomyVersion: string;
  matchingPublication: {
    path: string;
    sha256: string;
    sourceRevision: string;
    sourceRows: number;
    acceptedFacts: number;
  };
  questionCounts: Record<string, number>;
  academicPrompts: MapEntry[];
  activityCheckboxes: MapEntry[];
  conditionalVolunteerPrompt: MapEntry & { condition: string; options: unknown[] };
  financialNeedPrompt: MapEntry;
  specialCriteria: Array<MapEntry & { category: string; tooltip: string | null }>;
  earlierAffiliationMigration: Array<{
    oldQuestionId: string;
    oldValue: string;
    finalSpecialCriterionId: string;
    renderOldQuestion: boolean;
  }>;
  typeOnlyExcluded: string[];
  ruleDispositions: Array<{ id: string; disposition: string }>;
  resultRoutes: string[];
};

type Matrix = {
  schemaVersion: number;
  stageId: string;
  baselineCommit: string;
  declaredBeforeImplementation: boolean;
  status: string;
  questionRuleMapPath: string;
  viewports: Array<{ id: string; width: number; height: number }>;
  canonicalCounts: Record<string, number>;
  questionCounts: Record<string, number | boolean>;
  acceptedFactPolicy: {
    publicationPath: string;
    publicationSha256: string;
    taxonomyVersion: string;
    acceptedFacts: number;
    currentProductionOutcome: string;
  };
  journeys: Array<{ id: string; kind: 'visual' | 'nonvisual'; viewports: string[]; viewportExclusion?: string }>;
  acceptedExclusions: unknown[];
  results: unknown[];
};

type MatchingContract = {
  taxonomyVersion: string;
  criteria: Array<{ criterion_id: string }>;
  aliases: Array<{ alias: string; criterion_id: string }>;
};

type Publication = {
  schema_version: number;
  taxonomy_version: string;
  source_revision: string;
  accepted_facts: unknown[];
  reviewed_rows: unknown[];
  counts: { source_rows: number; scholarship_rows: number; portal_rows: number; accepted_matching_facts: number };
};

const map = readJson<QuestionRuleMap>('docs/evidence/P8F-question-rule-map.json');
const matrix = readJson<Matrix>('docs/evidence/P8F-test-matrix.json');
const contract = readJson<MatchingContract>('docs/evidence/PLAN-REV10-matching-fact-contract.json');
const publication = readJson<Publication>(map.matchingPublication.path);

assert.equal(map.schemaVersion, 1);
assert.equal(map.stageId, 'P8F');
assert.equal(map.baselineCommit, 'd2e282a3004d79d7b597c58f84ed2b9c8e8eb797');
assert.equal(map.historicalSnapshotCommit, '4c20637a351d272788e24ac9d02e541494644832');
assert.equal(map.taxonomyVersion, contract.taxonomyVersion);
assert.equal(sha256(map.matchingPublication.path), map.matchingPublication.sha256);
assert.equal(publication.schema_version, 1);
assert.equal(publication.taxonomy_version, map.taxonomyVersion);
assert.equal(publication.source_revision, map.matchingPublication.sourceRevision);
assert.equal(publication.reviewed_rows.length, 197);
assert.equal(publication.counts.source_rows, 197);
assert.equal(publication.counts.scholarship_rows, 176);
assert.equal(publication.counts.portal_rows, 21);
assert.equal(publication.accepted_facts.length, 0);
assert.equal(publication.counts.accepted_matching_facts, 0);

assert.deepEqual(map.questionCounts, {
  academicPrompts: 6,
  activityCheckboxes: 4,
  conditionalVolunteerPrompts: 1,
  financialNeedCheckboxes: 1,
  specialCriteria: 38,
  earlierAffiliationValuesMigrated: 6,
  typeOnlyFieldsExcluded: 8,
});
assert.equal(map.academicPrompts.length, 6);
assert.equal(map.activityCheckboxes.length, 4);
assert.equal(map.conditionalVolunteerPrompt.options.length, 4);
assert.equal(map.specialCriteria.length, 38);
assert.equal(map.earlierAffiliationMigration.length, 6);
assert.equal(map.typeOnlyExcluded.length, 8);
assert.equal(map.ruleDispositions.length, 30);

const expectedSpecialIds = [
  'dyslexia', 'adhd', 'autism', 'learning_other',
  'mental_health', 'chronic_health', 'foster_care', 'loss_of_parent', 'overcoming_adversity',
  'first_generation', 'black_african_american', 'hispanic_latino', 'native_american',
  'asian_pacific_islander', 'lgbtqia', 'female', 'nonbinary', 'single_parent', 'mensa',
  'aviation_pilot', 'aviation_maintenance', 'aviation_management', 'stem', 'healthcare',
  'trades', 'business_finance', 'public_service', 'law', 'arts_humanities',
  'agriculture_conservation', 'athletics_sports', 'military_veteran', 'first_responder',
  'farmers_union', 'electric_coop', 'credit_union', 'elks_lodge', 'company_employee',
];
assert.deepEqual(map.specialCriteria.map((item) => item.oldId), expectedSpecialIds);
assert.equal(map.specialCriteria.filter((item) => item.oldId === 'adhd').length, 1);
assert.equal(map.specialCriteria.some((item) => item.oldId.toLowerCase() === 'add'), false);
assert.equal(map.specialCriteria.find((item) => item.oldId === 'adhd')?.tooltip, 'Diagnosed with Attention-Deficit/Hyperactivity Disorder.');

const expectedAffiliations = new Map([
  ['Military', 'military_veteran'],
  ['First Responder', 'first_responder'],
  ['Farmers Union', 'farmers_union'],
  ['Electric Co-op', 'electric_coop'],
  ['Credit Union', 'credit_union'],
  ['Elks Lodge', 'elks_lodge'],
]);
for (const migration of map.earlierAffiliationMigration) {
  assert.equal(migration.oldQuestionId, 'passiveSignals.organization_affiliations');
  assert.equal(migration.finalSpecialCriterionId, expectedAffiliations.get(migration.oldValue));
  assert.equal(migration.renderOldQuestion, false);
  assert.equal(map.specialCriteria.filter((item) => item.oldId === migration.finalSpecialCriterionId).length, 1);
}

const allMappedEntries: MapEntry[] = [
  ...map.academicPrompts,
  ...map.activityCheckboxes,
  map.conditionalVolunteerPrompt,
  map.financialNeedPrompt,
  ...map.specialCriteria,
];
assert.equal(new Set(allMappedEntries.map((entry) => entry.oldId)).size, allMappedEntries.length);
assert.equal(new Set(allMappedEntries.map((entry) => entry.newControlId)).size, allMappedEntries.length);
const criterionIds = new Set(contract.criteria.map((criterion) => criterion.criterion_id));
for (const entry of allMappedEntries) {
  assert(criterionIds.has(entry.criterionId), `${entry.oldId} maps to unknown criterion ${entry.criterionId}`);
  assert(entry.ruleMode.length > 0, `${entry.oldId} lacks an explicit rule mode`);
}

const aliases = new Map(contract.aliases.map((alias) => [alias.alias, alias.criterion_id]));
for (const criterion of map.specialCriteria) {
  assert.equal(aliases.get(criterion.oldId), criterion.criterionId, `${criterion.oldId} alias drifted from taxonomy 1.0.0`);
}
for (const entry of [...map.activityCheckboxes, map.conditionalVolunteerPrompt, map.financialNeedPrompt]) {
  assert.equal(aliases.get(entry.oldId.replace('passiveSignals.', '')), entry.criterionId, `${entry.oldId} alias drifted from taxonomy 1.0.0`);
}

assert.deepEqual(map.typeOnlyExcluded, [
  'activeFacts.sat',
  'activeFacts.act',
  'activeFacts.fafsa_complete',
  'passiveSignals.skills',
  'passiveSignals.creative_skills',
  'passiveSignals.background_optional',
  'passiveSignals.constraints',
  'passiveSignals.career_interests',
]);
assert(new Set(map.ruleDispositions.map((item) => item.id)).size === map.ruleDispositions.length);
for (const retired of [
  'state_default_montana_filter', 'amount_points', 'is_new_plus_5',
  'non_renewing_substring_plus_3', 'portal_foundation_common_application_plus_4',
  'selected_criterion_plus_15', 'essay_minus_2_and_creative_penalty',
  'session_storage_matched_rows', 'legacy_excel_export', 'legacy_data_payload_matcher_input',
]) assert(map.ruleDispositions.some((item) => item.id === retired), `missing disposition for ${retired}`);

assert.equal(matrix.schemaVersion, 1);
assert.equal(matrix.stageId, 'P8F');
assert.equal(matrix.baselineCommit, map.baselineCommit);
assert.equal(matrix.declaredBeforeImplementation, true);
assert.equal(matrix.status, 'declared');
assert.equal(matrix.questionRuleMapPath, 'docs/evidence/P8F-question-rule-map.json');
assert.deepEqual(matrix.viewports, [
  { id: 'mobile', width: 360, height: 800 },
  { id: 'tablet', width: 768, height: 1024 },
  { id: 'desktop', width: 1440, height: 900 },
]);
assert.equal(matrix.acceptedFactPolicy.publicationSha256, map.matchingPublication.sha256);
assert.equal(matrix.acceptedFactPolicy.taxonomyVersion, map.taxonomyVersion);
assert.equal(matrix.acceptedFactPolicy.acceptedFacts, 0);
assert.equal(matrix.acceptedExclusions.length, 0);
assert.equal(matrix.results.length, matrix.viewports.length, 'executed matrix must contain one result per viewport');
for (const result of matrix.results as Array<{ viewport?: string; status?: string; passedJourneyIds?: string[]; evidencePath?: string }>) {
  assert(matrix.viewports.some((viewport) => viewport.id === result.viewport));
  assert.equal(result.status, 'pass');
  assert.equal(result.passedJourneyIds?.length, 10);
  assert.equal(result.evidencePath, 'docs/evidence/P8F-browser.json');
}
const declaredMatrix = JSON.parse(execFileSync('git', [
  'show',
  '84ef59209ea5cc61738a7651d8016d6a34d56e1e:docs/evidence/P8F-test-matrix.json',
], { cwd: repoRoot, encoding: 'utf8' })) as Matrix;
assert.equal(declaredMatrix.results.length, 0, 'preimplementation commit must preserve the unexecuted declaration');
assert.equal(declaredMatrix.declaredBeforeImplementation, true);
const visualJourneys = matrix.journeys.filter((journey) => journey.kind === 'visual');
assert.equal(visualJourneys.length, 10);
for (const journey of matrix.journeys) {
  if (journey.kind === 'visual') assert.deepEqual(journey.viewports, ['mobile', 'tablet', 'desktop']);
  else assert(journey.viewportExclusion, `${journey.id} requires a viewport exclusion`);
}

const pinnedBlobs = new Map([
  ['web/src/app/page.tsx', '61343c9f4f785580bf4a1321a2163ec7c8f35436'],
  ['web/src/components/InterviewWizard.tsx', 'a183940afeeabecda9b443835c6c1e1b98e0e1d5'],
  ['web/src/components/steps/ActiveFactsStep.tsx', '4442b1bc1c7b26bbebcca9fea1d2c9e5594c2241'],
  ['web/src/components/steps/PassiveSignalsStep.tsx', 'b34a63d8847401a7943349d64167cbeabd37c7fa'],
  ['web/src/types/wizard.ts', 'a90906ae295108811a5e4d8e35119cb6892be196'],
  ['web/src/lib/processor.ts', '436c84e31de39892b9ab5bcb1d518f749e127a89'],
  ['web/src/lib/rulesPack.ts', 'f43df3539281637881106bdfd856efa5bd11004e'],
]);
assert.equal(git('cat-file', '-t', map.historicalSnapshotCommit), 'commit');
for (const [filePath, blob] of pinnedBlobs) {
  assert.equal(git('rev-parse', `${map.historicalSnapshotCommit}:${filePath}`), blob, `${filePath} historical blob drifted`);
}

const state = readJson<{
  activeStageId: string | null;
  nextPermittedStageId: string | null;
  stages: Array<{ id: string; status: string }>;
}>('docs/BUILD_STATE.json');
assert.equal(state.stages.find((stage) => stage.id === 'P8M')?.status, 'accepted');
const p8fStatus = state.stages.find((stage) => stage.id === 'P8F')?.status;
assert(['planned', 'active', 'implemented', 'verified', 'accepted'].includes(p8fStatus ?? ''), 'P8F lifecycle state is invalid');
if (p8fStatus === 'planned') assert.deepEqual([state.activeStageId, state.nextPermittedStageId], [null, 'P8F']);
else if (p8fStatus === 'accepted') {
  const p9Status = state.stages.find((stage) => stage.id === 'P9')?.status;
  assert(['planned', 'active', 'implemented', 'verified', 'accepted'].includes(p9Status ?? ''));
  assert.deepEqual(
    [state.activeStageId, state.nextPermittedStageId],
    p9Status === 'planned' ? [null, 'P9'] : p9Status === 'accepted' ? [null, null] : ['P9', null],
  );
}
else assert.deepEqual([state.activeStageId, state.nextPermittedStageId], ['P8F', null]);

console.log(`P8F PREIMPLEMENTATION TEST PASS academic=${map.academicPrompts.length} activities=${map.activityCheckboxes.length} volunteer=1 financial=1 criteria=${map.specialCriteria.length} affiliations=${map.earlierAffiliationMigration.length} typeOnly=${map.typeOnlyExcluded.length} dispositions=${map.ruleDispositions.length} visualCells=${visualJourneys.length * matrix.viewports.length} acceptedFacts=${publication.accepted_facts.length}`);
