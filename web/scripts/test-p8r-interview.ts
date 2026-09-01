import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import catalogJson from '../fixtures/p7/student-catalog.json';
import matrixCatalogJson from '../fixtures/p7/matrix-catalog.json';
import { serializeAwardCsv } from '../src/lib/export';
import {
  AcceptedAwardMatchFactsSchema,
  InterviewAnswersSchema,
  PUBLIC_MATCH_REASON_FIELDS,
  PUBLIC_MATCH_RESPONSE_FIELDS,
  PUBLIC_MATCH_RESULT_FIELDS,
  buildSyntheticMatrixMatchFacts,
  matchStudentAwards,
  type AcceptedAwardMatchFacts,
  type AcceptedMatchFactsByAwardId,
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

const authority = 'synthetic_matrix_fixture' as const;
const factsFor = (
  award: StudentAward,
  overrides: Partial<AcceptedAwardMatchFacts> = {},
): AcceptedAwardMatchFacts => AcceptedAwardMatchFactsSchema.parse({
  awardPublicId: award.publicId,
  minimumGpa: award.eligibility.minimumGpa === null ? null : { value: award.eligibility.minimumGpa, authority },
  schoolTypes: award.eligibility.schoolTypes.length === 0 ? null : { values: award.eligibility.schoolTypes, authority },
  cycleStatus: award.cycle.status === 'unknown' ? null : { value: award.cycle.status, authority },
  applicationMode: award.application.mode === 'unknown' ? null : { value: award.application.mode, authority },
  eligibilityDimensionsComplete: { value: true, authority },
  ...overrides,
});
const factsMap = (...facts: AcceptedAwardMatchFacts[]): AcceptedMatchFactsByAwardId => Object.fromEntries(
  facts.map((item) => [item.awardPublicId, item]),
);

const knownAward = cloneAward({
  publicId: 'award-100000000001',
  name: 'Synthetic known-fact award',
  eligibility: { ...baseAward.eligibility, minimumGpa: 3, schoolTypes: ['four_year'] },
  cycle: { ...baseAward.cycle, status: 'active', label: 'Open now' },
});
const knownFacts = factsFor(knownAward);
assert.equal(matchStudentAwards([knownAward], syntheticAnswers, factsMap(knownFacts)).results[0].decision, 'match');
assert(matchStudentAwards([knownAward], syntheticAnswers, factsMap(knownFacts)).results[0].reasons.some((reason) => reason.code === 'gpa_meets_minimum'));
assert(matchStudentAwards([knownAward], syntheticAnswers, factsMap(knownFacts)).results[0].reasons.some((reason) => reason.code === 'school_type_matches'));

const noAuthorityResult = matchStudentAwards([knownAward], syntheticAnswers).results[0];
assert.equal(noAuthorityResult.decision, 'possible_match', 'provenance-free structured fields must remain possible');
assert(noAuthorityResult.reasons.some((reason) => reason.code === 'gpa_not_accepted'));
assert(noAuthorityResult.reasons.some((reason) => reason.code === 'school_type_not_accepted'));
assert(noAuthorityResult.reasons.some((reason) => reason.code === 'eligibility_not_fully_modeled'));

const gpaConflict = matchStudentAwards(
  [knownAward],
  { ...syntheticAnswers, gpa: 2.5 },
  factsMap(knownFacts),
).results[0];
assert.equal(gpaConflict.decision, 'known_conflict');
assert(gpaConflict.reasons.some((reason) => reason.code === 'gpa_below_minimum'));

const schoolConflict = matchStudentAwards(
  [knownAward],
  { ...syntheticAnswers, schoolTypes: ['trade'] },
  factsMap(knownFacts),
).results[0];
assert.equal(schoolConflict.decision, 'known_conflict');
assert(schoolConflict.reasons.some((reason) => reason.code === 'school_type_conflict'));

const educationFallbackAward = cloneAward({
  publicId: 'award-100000000002',
  name: 'Synthetic legacy Education fallback award',
  eligibility: { ...baseAward.eligibility, audience: 'Legacy manual review', minimumGpa: 3, schoolTypes: ['other'], focus: 'Education' },
  cycle: { ...baseAward.cycle, status: 'unknown', label: 'Availability not verified' },
});
const educationFallback = matchStudentAwards([educationFallbackAward], syntheticAnswers).results[0];
assert.equal(educationFallback.decision, 'possible_match', 'legacy Education-to-other fallback must not hard-exclude');
assert(!educationFallback.reasons.some((reason) => reason.kind === 'known_conflict'));
assert(educationFallback.reasons.some((reason) => reason.code === 'school_type_not_accepted'));

const liveStructuredAward = catalog.awards.find((award) => award.eligibility.minimumGpa !== null || award.eligibility.schoolTypes.length > 0);
assert(liveStructuredAward, 'accepted catalog must retain a legacy structured eligibility case for the provenance regression');
const liveStructuredResult = matchStudentAwards([liveStructuredAward], syntheticAnswers).results[0];
assert.equal(liveStructuredResult.decision, 'possible_match', 'manual-review/provenance-free live fields must remain possible');
assert(!liveStructuredResult.reasons.some((reason) => reason.kind === 'known_conflict'));

const unknownAward = cloneAward({
  publicId: 'award-100000000003',
  name: 'Synthetic unknown-fact award',
  eligibility: { ...baseAward.eligibility, minimumGpa: null, schoolTypes: [] },
  cycle: { ...baseAward.cycle, status: 'unknown', label: 'Availability not verified', year: null, closes: 'Annual — May 31' },
});
const unknownResult = matchStudentAwards([unknownAward], syntheticAnswers).results[0];
assert.equal(unknownResult.decision, 'possible_match', 'missing accepted eligibility must stay possible');
assert(unknownResult.reasons.some((reason) => reason.code === 'gpa_not_accepted'));
assert(unknownResult.reasons.some((reason) => reason.code === 'school_type_not_accepted'));
assert(unknownResult.reasons.some((reason) => reason.code === 'cycle_not_verified'));
assert(unknownResult.reasons.some((reason) => reason.code === 'eligibility_not_fully_modeled'));
assert(!unknownResult.reasons.some((reason) => reason.code === 'cycle_closed'), 'annual text must not become a year-2001 closure');

const closedAward = cloneAward({
  publicId: 'award-100000000004',
  name: 'Synthetic closed award',
  eligibility: { ...baseAward.eligibility, minimumGpa: 3, schoolTypes: ['four_year'] },
  cycle: { ...baseAward.cycle, status: 'closed', label: 'Closed' },
});
assert(matchStudentAwards([closedAward], syntheticAnswers, factsMap(factsFor(closedAward))).results[0].reasons.some((reason) => reason.code === 'cycle_closed'));

const unavailableAward = cloneAward({
  publicId: 'award-100000000005',
  name: 'Synthetic unavailable award',
  eligibility: { ...baseAward.eligibility, minimumGpa: 3, schoolTypes: ['four_year'] },
  cycle: { ...baseAward.cycle, status: 'unavailable', label: 'Unavailable' },
});
assert(matchStudentAwards([unavailableAward], syntheticAnswers, factsMap(factsFor(unavailableAward))).results[0].reasons.some((reason) => reason.code === 'cycle_unavailable'));

for (const [publicId, name, summary, focus] of [
  ['award-100000000006', 'Synthetic Non-Renewing text award', 'Non-Renewing award description.', null],
  ['award-100000000007', 'Synthetic Montana text award', 'For Montana students.', null],
  ['award-100000000008', 'Synthetic identity text award', 'Applicants discuss health, identity, or hardship.', 'Dyslexia and chronic health'],
] as const) {
  const textOnlyAward = cloneAward({
    publicId,
    name,
    summary,
    eligibility: { ...baseAward.eligibility, audience: 'Montana students', minimumGpa: 3, schoolTypes: ['four_year'], focus },
    cycle: { ...baseAward.cycle, status: 'active', label: 'Open now' },
  });
  const incompleteFacts = factsFor(textOnlyAward, { eligibilityDimensionsComplete: null });
  const result = matchStudentAwards([textOnlyAward], syntheticAnswers, factsMap(incompleteFacts)).results[0];
  assert.equal(result.decision, 'possible_match', `${name} must remain possible because free-text eligibility is unassessed`);
  assert(!result.reasons.some((reason) => reason.kind === 'known_conflict'));
  assert(result.reasons.some((reason) => reason.code === 'eligibility_not_fully_modeled'));
}

assert.throws(() => matchStudentAwards([knownAward], syntheticAnswers, factsMap(factsFor(knownAward, {
  schoolTypes: { values: ['trade'], authority },
}))), /do(?:es)? not match the public award/, 'mismatched accepted facts must fail closed');

const directAward = cloneAward({
  publicId: 'award-100000000009',
  name: 'Zulu synthetic direct award',
  amount: { ...baseAward.amount, minimum: 5000, maximum: 5000, label: '$5,000' },
  eligibility: { ...baseAward.eligibility, minimumGpa: 3, schoolTypes: ['four_year'] },
  cycle: { ...baseAward.cycle, status: 'active', label: 'Open now' },
  application: { ...baseAward.application, mode: 'direct_per_award', label: 'Direct application' },
});
const offlineAward = cloneAward({
  publicId: 'award-10000000000a',
  name: 'Alpha synthetic offline award',
  amount: { ...baseAward.amount, minimum: 1, maximum: 1, label: '$1' },
  eligibility: { ...baseAward.eligibility, minimumGpa: 3, schoolTypes: ['four_year'] },
  cycle: { ...baseAward.cycle, status: 'active', label: 'Open now' },
  application: { ...baseAward.application, mode: 'offline', label: 'Paper / offline', url: null },
});
const rankedFacts = factsMap(factsFor(directAward), factsFor(offlineAward));
const noPreference = matchStudentAwards([directAward, offlineAward], syntheticAnswers, rankedFacts);
assert.equal(noPreference.results[0].award.publicId, offlineAward.publicId, 'unsupported amount must not rank results');
const preferred = matchStudentAwards([directAward, offlineAward], {
  ...syntheticAnswers,
  preferredApplicationModes: ['direct_per_award'],
}, rankedFacts);
assert.equal(preferred.results[0].award.publicId, directAward.publicId, 'accepted rank-only application preference must sort first');
assert.equal(preferred.results[0].decision, 'match', 'preference must not change eligibility decision');
assert(preferred.results[0].reasons.some((reason) => reason.code === 'preferred_application_mode' && reason.kind === 'preference'));

const immutableInput = [knownAward, unknownAward, closedAward, unavailableAward, directAward, offlineAward];
const immutableFacts = factsMap(knownFacts, factsFor(closedAward), factsFor(unavailableAward), factsFor(directAward), factsFor(offlineAward));
const before = JSON.stringify(immutableInput);
const first = matchStudentAwards(immutableInput, syntheticAnswers, immutableFacts);
const second = matchStudentAwards(immutableInput, syntheticAnswers, immutableFacts);
assert.deepEqual(first, second, 'same catalog, answers, and accepted facts must produce identical order and reasons');
assert.equal(JSON.stringify(immutableInput), before, 'matcher must not mutate the catalog');
assert.equal(first.counts.total, immutableInput.length);
assert.equal(first.counts.match + first.counts.possibleMatch + first.counts.knownConflict, first.counts.total);
assert.deepEqual(Object.keys(first).sort(), [...PUBLIC_MATCH_RESPONSE_FIELDS].sort());
for (const result of first.results) {
  assert.deepEqual(Object.keys(result).sort(), [...PUBLIC_MATCH_RESULT_FIELDS].sort());
  for (const reason of result.reasons) assert.deepEqual(Object.keys(reason).sort(), [...PUBLIC_MATCH_REASON_FIELDS].sort());
}
const publicResultKeys = JSON.stringify(first);
for (const forbidden of ['answers', 'studentGpa', 'selectedSchoolTypes', 'preferredApplicationModes', 'authority']) {
  assert(!publicResultKeys.includes(`"${forbidden}"`), `public match result leaked ${forbidden}`);
}

const completeCatalogResult = matchStudentAwards(catalog.awards, syntheticAnswers);
assert.deepEqual(completeCatalogResult.counts, { match: 0, possibleMatch: 192, knownConflict: 0, total: 192 });
assert.equal(completeCatalogResult.results.length, catalog.counts.awards);
assert(completeCatalogResult.results.every((result) => result.reasons.some((reason) => reason.code === 'eligibility_not_fully_modeled')));
const resultAwardIds = new Set(completeCatalogResult.results.map((result) => result.award.publicId));
assert.equal(resultAwardIds.size, catalog.counts.awards, 'matching must neither duplicate nor lose an award');

const matrixFacts = buildSyntheticMatrixMatchFacts(matrixCatalog.awards);
const matrixResult = matchStudentAwards(matrixCatalog.awards, {
  ...syntheticAnswers,
  schoolTypes: ['four_year', 'trade'],
}, matrixFacts);
assert.deepEqual(matrixResult.counts, { match: 2, possibleMatch: 4, knownConflict: 1, total: 7 });

const recommendedAwards = first.results.filter((result) => result.decision !== 'known_conflict').map((result) => result.award);
const csv = serializeAwardCsv(recommendedAwards);
assert.equal(csv.split('\r\n').filter(Boolean).length, recommendedAwards.length + 1);
for (const forbidden of ['possible_match', 'known_conflict', 'gpa_below_minimum', 'preferredApplicationModes']) {
  assert(!csv.includes(forbidden), `matched CSV leaked interview decision material ${forbidden}`);
}

const matcherSource = fs.readFileSync(path.join(webRoot, 'src/lib/interviewMatcher.ts'), 'utf8');
for (const forbidden of ['processAndFilter', './processor', 'studentCatalogLegacy', 'RulesPack', 'amountRank', 'fetch(', 'XMLHttpRequest', 'sendBeacon', 'localStorage', 'sessionStorage', 'indexedDB', 'document.cookie', 'console.']) {
  assert(!matcherSource.includes(forbidden), `pure matcher contains forbidden capability or rank ${forbidden}`);
}
const wizardSource = fs.readFileSync(path.join(webRoot, 'src/components/InterviewWizard.tsx'), 'utf8');
for (const forbidden of ['@/types/wizard', 'ActiveFactsStep', 'PassiveSignalsStep', 'processor', 'fetch(', 'XMLHttpRequest', 'sendBeacon', 'localStorage', 'sessionStorage', 'indexedDB', 'document.cookie', 'console.', 'history.pushState', 'history.replaceState']) {
  assert(!wizardSource.includes(forbidden), `interview wizard contains forbidden capability ${forbidden}`);
}
const browserSource = fs.readFileSync(path.join(webRoot, 'src/components/ScholarshipBrowser.tsx'), 'utf8');
for (const forbidden of ['processAndFilter', 'RulesPack', 'fetch(', 'XMLHttpRequest', 'sendBeacon', 'localStorage', 'sessionStorage', 'indexedDB', 'document.cookie', 'console.', 'history.pushState', 'history.replaceState']) {
  assert(!browserSource.includes(forbidden), `student experience contains forbidden capability ${forbidden}`);
}
assert(browserSource.includes('loadStudentCatalog(qaMode)'), 'catalog load must use the answer-independent client');
assert(browserSource.includes("process.env.NODE_ENV !== 'production'"), 'synthetic matrix authority must be disabled in production');
assert(browserSource.includes("catalog.catalogRevision === 'f'.repeat(64)"), 'synthetic authority must bind the exact matrix catalog');
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
  supportedAnswerHardGates: Array<{ id: string; authorityRequired: boolean }>;
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
assert(matrix.supportedAnswerHardGates.every((item) => item.authorityRequired), 'every answer hard gate requires field-specific accepted authority');
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
