import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import catalogJson from '../fixtures/p7/student-catalog.json';
import matrixCatalogJson from '../fixtures/p7/matrix-catalog.json';
import { serializeAwardCsv } from '../src/lib/export';
import {
  InterviewAnswersSchema,
  PUBLIC_MATCH_REASON_FIELDS,
  PUBLIC_MATCH_RESPONSE_FIELDS,
  PUBLIC_MATCH_RESULT_FIELDS,
  matchStudentAwards,
  type InterviewAnswers,
} from '../src/lib/interviewMatcher';
import {
  StudentAwardSchema,
  StudentCatalogSchema,
  type StudentAward,
} from '../src/lib/studentCatalog';

const webRoot = process.cwd();
const repoRoot = path.resolve(webRoot, '..');
const catalog = StudentCatalogSchema.parse(catalogJson);
const matrixCatalog = StudentCatalogSchema.parse(matrixCatalogJson);

const syntheticAnswers: InterviewAnswers = {
  gpa: 3.5,
  schoolTypes: ['four_year'],
  preferredApplicationModes: [],
};

assert.equal(InterviewAnswersSchema.safeParse(syntheticAnswers).success, true);
assert.equal(InterviewAnswersSchema.safeParse({ ...syntheticAnswers, gpa: 4.01 }).success, false, 'GPA above 4.0 must fail validation');
assert.equal(InterviewAnswersSchema.safeParse({ ...syntheticAnswers, schoolTypes: [] }).success, false, 'At least one school type is required');
assert.equal(InterviewAnswersSchema.safeParse({ ...syntheticAnswers, residence: 'Colorado' }).success, false, 'Unstructured residence answers must not enter the matcher');
assert.equal(InterviewAnswersSchema.safeParse({ ...syntheticAnswers, schoolTypes: ['four_year', 'four_year'] }).success, false, 'Repeated school types must fail validation');

const baseAward = matrixCatalog.awards[0];
const cloneAward = (overrides: Partial<StudentAward> & { publicId: string; name: string }): StudentAward => StudentAwardSchema.parse({
  ...baseAward,
  ...overrides,
  amount: { ...baseAward.amount, ...overrides.amount },
  eligibility: { ...baseAward.eligibility, ...overrides.eligibility },
  cycle: { ...baseAward.cycle, ...overrides.cycle },
  application: { ...baseAward.application, ...overrides.application },
});

const knownAward = cloneAward({
  publicId: 'award-100000000001',
  name: 'Synthetic known-fact award',
  eligibility: { ...baseAward.eligibility, minimumGpa: 3, schoolTypes: ['four_year'] },
  cycle: { ...baseAward.cycle, status: 'active', label: 'Open now' },
});
assert.equal(matchStudentAwards([knownAward], syntheticAnswers).results[0].decision, 'match');
assert(matchStudentAwards([knownAward], syntheticAnswers).results[0].reasons.some((reason) => reason.code === 'gpa_meets_minimum'));
assert(matchStudentAwards([knownAward], syntheticAnswers).results[0].reasons.some((reason) => reason.code === 'school_type_matches'));

const gpaConflict = matchStudentAwards([knownAward], { ...syntheticAnswers, gpa: 2.5 }).results[0];
assert.equal(gpaConflict.decision, 'known_conflict');
assert(gpaConflict.reasons.some((reason) => reason.code === 'gpa_below_minimum'));

const schoolConflict = matchStudentAwards([knownAward], { ...syntheticAnswers, schoolTypes: ['trade'] }).results[0];
assert.equal(schoolConflict.decision, 'known_conflict');
assert(schoolConflict.reasons.some((reason) => reason.code === 'school_type_conflict'));

const unknownAward = cloneAward({
  publicId: 'award-100000000002',
  name: 'Synthetic unknown-fact award',
  eligibility: { ...baseAward.eligibility, minimumGpa: null, schoolTypes: [] },
  cycle: { ...baseAward.cycle, status: 'unknown', label: 'Availability not verified', year: null, closes: 'Annual — May 31' },
});
const unknownResult = matchStudentAwards([unknownAward], syntheticAnswers).results[0];
assert.equal(unknownResult.decision, 'possible_match', 'missing structured eligibility must stay possible');
assert(unknownResult.reasons.some((reason) => reason.code === 'gpa_not_published'));
assert(unknownResult.reasons.some((reason) => reason.code === 'school_type_not_published'));
assert(unknownResult.reasons.some((reason) => reason.code === 'cycle_not_verified'));
assert(!unknownResult.reasons.some((reason) => reason.code === 'cycle_closed'), 'annual text must not become a year-2001 closure');

const closedAward = cloneAward({
  publicId: 'award-100000000003',
  name: 'Synthetic closed award',
  eligibility: { ...baseAward.eligibility, minimumGpa: 3, schoolTypes: ['four_year'] },
  cycle: { ...baseAward.cycle, status: 'closed', label: 'Closed' },
});
assert(matchStudentAwards([closedAward], syntheticAnswers).results[0].reasons.some((reason) => reason.code === 'cycle_closed'));

const unavailableAward = cloneAward({
  publicId: 'award-100000000004',
  name: 'Synthetic unavailable award',
  eligibility: { ...baseAward.eligibility, minimumGpa: 3, schoolTypes: ['four_year'] },
  cycle: { ...baseAward.cycle, status: 'unavailable', label: 'Unavailable' },
});
assert(matchStudentAwards([unavailableAward], syntheticAnswers).results[0].reasons.some((reason) => reason.code === 'cycle_unavailable'));

for (const [publicId, name, summary, focus] of [
  ['award-100000000005', 'Synthetic Non-Renewing text award', 'Non-Renewing award description.', null],
  ['award-100000000006', 'Synthetic Montana text award', 'For Montana students.', null],
  ['award-100000000007', 'Synthetic identity text award', 'Applicants discuss health, identity, or hardship.', 'Dyslexia and chronic health'],
] as const) {
  const textOnlyAward = cloneAward({
    publicId,
    name,
    summary,
    eligibility: { ...baseAward.eligibility, audience: 'Montana students', minimumGpa: 3, schoolTypes: ['four_year'], focus },
    cycle: { ...baseAward.cycle, status: 'active', label: 'Open now' },
  });
  const result = matchStudentAwards([textOnlyAward], syntheticAnswers).results[0];
  assert.equal(result.decision, 'match', `${name} must not create a free-text hard gate`);
  assert(!result.reasons.some((reason) => reason.kind === 'known_conflict'));
}

const directAward = cloneAward({
  publicId: 'award-100000000008',
  name: 'Synthetic direct award',
  eligibility: { ...baseAward.eligibility, minimumGpa: 3, schoolTypes: ['four_year'] },
  cycle: { ...baseAward.cycle, status: 'active', label: 'Open now' },
  application: { ...baseAward.application, mode: 'direct_per_award', label: 'Direct application' },
});
const offlineAward = cloneAward({
  publicId: 'award-100000000009',
  name: 'Synthetic offline award',
  eligibility: { ...baseAward.eligibility, minimumGpa: 3, schoolTypes: ['four_year'] },
  cycle: { ...baseAward.cycle, status: 'active', label: 'Open now' },
  application: { ...baseAward.application, mode: 'offline', label: 'Paper / offline', url: null },
});
const preferred = matchStudentAwards([directAward, offlineAward], {
  ...syntheticAnswers,
  preferredApplicationModes: ['offline'],
});
assert.equal(preferred.results[0].award.publicId, offlineAward.publicId, 'rank-only application preference must sort first');
assert.equal(preferred.results[0].decision, 'match', 'preference must not change eligibility decision');
assert(preferred.results[0].reasons.some((reason) => reason.code === 'preferred_application_mode' && reason.kind === 'preference'));

const immutableInput = [knownAward, unknownAward, closedAward, unavailableAward, directAward, offlineAward];
const before = JSON.stringify(immutableInput);
const first = matchStudentAwards(immutableInput, syntheticAnswers);
const second = matchStudentAwards(immutableInput, syntheticAnswers);
assert.deepEqual(first, second, 'same catalog and answers must produce identical order and reasons');
assert.equal(JSON.stringify(immutableInput), before, 'matcher must not mutate the catalog');
assert.equal(first.counts.total, immutableInput.length);
assert.equal(first.counts.match + first.counts.possibleMatch + first.counts.knownConflict, first.counts.total);
assert.deepEqual(Object.keys(first).sort(), [...PUBLIC_MATCH_RESPONSE_FIELDS].sort());
for (const result of first.results) {
  assert.deepEqual(Object.keys(result).sort(), [...PUBLIC_MATCH_RESULT_FIELDS].sort());
  for (const reason of result.reasons) assert.deepEqual(Object.keys(reason).sort(), [...PUBLIC_MATCH_REASON_FIELDS].sort());
}
const publicResultKeys = JSON.stringify(first);
for (const forbidden of ['answers', 'studentGpa', 'selectedSchoolTypes', 'preferredApplicationModes']) {
  assert(!publicResultKeys.includes(`"${forbidden}"`), `public match result leaked ${forbidden}`);
}

const completeCatalogResult = matchStudentAwards(catalog.awards, syntheticAnswers);
assert.equal(completeCatalogResult.counts.total, 192);
assert.equal(completeCatalogResult.results.length, catalog.counts.awards);
const resultAwardIds = new Set(completeCatalogResult.results.map((result) => result.award.publicId));
assert.equal(resultAwardIds.size, catalog.counts.awards, 'matching must neither duplicate nor lose an award');

const recommendedAwards = first.results.filter((result) => result.decision !== 'known_conflict').map((result) => result.award);
const csv = serializeAwardCsv(recommendedAwards);
assert.equal(csv.split('\r\n').filter(Boolean).length, recommendedAwards.length + 1);
for (const forbidden of ['possible_match', 'known_conflict', 'gpa_below_minimum', 'preferredApplicationModes']) {
  assert(!csv.includes(forbidden), `matched CSV leaked interview decision material ${forbidden}`);
}

const matcherSource = fs.readFileSync(path.join(webRoot, 'src/lib/interviewMatcher.ts'), 'utf8');
for (const forbidden of ['processAndFilter', "./processor", 'RulesPack', 'fetch(', 'XMLHttpRequest', 'sendBeacon', 'localStorage', 'sessionStorage', 'indexedDB', 'document.cookie', 'console.']) {
  assert(!matcherSource.includes(forbidden), `pure matcher contains forbidden capability ${forbidden}`);
}
const wizardSource = fs.readFileSync(path.join(webRoot, 'src/components/InterviewWizard.tsx'), 'utf8');
for (const forbidden of ["@/types/wizard", 'ActiveFactsStep', 'PassiveSignalsStep', 'processor', 'fetch(', 'XMLHttpRequest', 'sendBeacon', 'localStorage', 'sessionStorage', 'indexedDB', 'document.cookie', 'console.', 'history.pushState', 'history.replaceState']) {
  assert(!wizardSource.includes(forbidden), `interview wizard contains forbidden capability ${forbidden}`);
}
const browserSource = fs.readFileSync(path.join(webRoot, 'src/components/ScholarshipBrowser.tsx'), 'utf8');
for (const forbidden of ['processAndFilter', 'RulesPack', 'fetch(', 'XMLHttpRequest', 'sendBeacon', 'localStorage', 'sessionStorage', 'indexedDB', 'document.cookie', 'console.', 'history.pushState', 'history.replaceState']) {
  assert(!browserSource.includes(forbidden), `student experience contains forbidden capability ${forbidden}`);
}
assert(browserSource.includes('loadStudentCatalog(qaMode)'), 'catalog load must use the answer-independent client');
assert(browserSource.includes('setAnswers(null)'), 'reset and new-interview paths must clear in-memory answers');
const clientSource = fs.readFileSync(path.join(webRoot, 'src/lib/studentCatalogClient.ts'), 'utf8');
assert(!/InterviewAnswers|answers|request\s*body|body\s*:/.test(clientSource), 'catalog client must be answer-independent and body-free');
assert(clientSource.includes("method: 'GET'"));

const matrix = JSON.parse(fs.readFileSync(path.join(repoRoot, 'docs/evidence/P8R-test-matrix.json'), 'utf8')) as {
  stageId: string;
  baselineCommit: string;
  declaredBeforeImplementation: boolean;
  status: string;
  viewports: Array<{ id: string; width: number; height: number }>;
  supportedAnswerHardGates: Array<{ id: string }>;
  journeys: Array<{ id: string; kind: 'visual' | 'nonvisual'; viewports: string[]; viewportExclusion?: string }>;
  acceptedExclusions: unknown[];
};
assert.equal(matrix.stageId, 'P8R');
assert.equal(matrix.baselineCommit, '208a94b43a571109a1dac217b584e0e200ccd681');
assert.equal(matrix.declaredBeforeImplementation, true);
assert.deepEqual(matrix.viewports, [
  { id: 'mobile', width: 360, height: 800 },
  { id: 'tablet', width: 768, height: 1024 },
  { id: 'desktop', width: 1440, height: 900 },
]);
assert.deepEqual(matrix.supportedAnswerHardGates.map((item) => item.id), ['minimum_gpa', 'school_type']);
for (const journey of matrix.journeys) {
  if (journey.kind === 'visual') assert.deepEqual(journey.viewports, ['mobile', 'tablet', 'desktop'], `${journey.id} must cover every required viewport`);
  else assert(journey.viewportExclusion, `${journey.id} requires an explicit viewport exclusion`);
}
for (const required of [
  'interview-primary-and-browse-all',
  'required-and-optional-answers',
  'back-edit-reset-and-stale-answer',
  'hard-gates-and-unknown-preservation',
  'decision-reasons-and-deterministic-ranking',
  'zero-result-and-conflict-recovery',
  'matched-filter-sort-links-export',
  'browse-all-catalog-regression',
  'recoverable-catalog-error',
  'keyboard-focus-and-screen-reader-status',
  'matcher-adversarial-contract',
  'answer-channel-privacy-contract',
  'api-schema-count-relationship-privacy',
  'admin-route-compatibility',
  'matched-export-privacy',
]) assert(matrix.journeys.some((journey) => journey.id === required), `P8R matrix is missing ${required}`);
assert.equal(matrix.acceptedExclusions.length, 0);

console.log(`P8R INTERVIEW TEST PASS awards=${completeCatalogResult.counts.total} match=${completeCatalogResult.counts.match} possible=${completeCatalogResult.counts.possibleMatch} conflicts=${completeCatalogResult.counts.knownConflict} matrixVisualCells=${matrix.journeys.filter((journey) => journey.kind === 'visual').length * 3}`);
