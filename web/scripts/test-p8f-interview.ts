import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import catalogJson from '../fixtures/p7/student-catalog.json';
import questionMapJson from '../../docs/evidence/P8F-question-rule-map.json';
import { serializeAwardCsv } from '../src/lib/export';
import {
  EMPTY_ACCEPTED_MATCH_FACT_BUNDLE,
  InterviewAnswersSchema,
  createSyntheticAcceptedFact,
  matchStudentAwards,
  type AcceptedMatchFactBundle,
  type InterviewAnswers,
} from '../src/lib/interviewMatcher';
import { P8F_MATCHING_FACT_CONTRACT, parseAcceptedMatchingFact, type AcceptedMatchingFact } from '../src/lib/matchingFactRuntime';
import { expandAlias, validateMatchingFact } from './matching-fact-contract';
import { ACTIVITY_QUESTIONS, EDUCATIONAL_STATUSES, RESIDENCE_STATES, SPECIAL_CRITERIA, TARGET_SCHOOL_TYPES, VOLUNTEER_HOURS } from '../src/lib/interviewQuestions';
import { CURRENT_ACCEPTED_MATCH_FACTS, CURRENT_ACCEPTED_MATCHING_FACT_COUNT, P8M_MATCHING_PUBLICATION, P8M_PUBLICATION_SHA256 } from '../src/lib/p8mMatchingFacts';
import { StudentAwardSchema, StudentCatalogSchema } from '../src/lib/studentCatalog';

const webRoot = process.cwd();
const repoRoot = path.resolve(webRoot, '..');
const catalog = StudentCatalogSchema.parse(catalogJson);
const questionMap = questionMapJson;
const publicationBytes = fs.readFileSync(path.join(webRoot, 'fixtures/p8m/matching-facts-v1.json'));
const frozenContractBytes = fs.readFileSync(path.join(repoRoot, 'docs/evidence/PLAN-REV10-matching-fact-contract.json'));
const runtimeContractBytes = fs.readFileSync(path.join(webRoot, 'fixtures/p8m/matching-fact-contract-v1.json'));
assert.equal(crypto.createHash('sha256').update(runtimeContractBytes).digest('hex'), crypto.createHash('sha256').update(frozenContractBytes).digest('hex'), 'runtime must use a byte-identical copy of the frozen matching-facts-v1 contract');
assert.equal(crypto.createHash('sha256').update(publicationBytes).digest('hex'), P8M_PUBLICATION_SHA256);
assert.equal(P8M_MATCHING_PUBLICATION.taxonomy_version, '1.0.0');
assert.equal(CURRENT_ACCEPTED_MATCHING_FACT_COUNT, 0);
assert.deepEqual(CURRENT_ACCEPTED_MATCH_FACTS, EMPTY_ACCEPTED_MATCH_FACT_BUNDLE);

assert.equal(questionMap.questionCounts.academicPrompts, 6);
assert.equal(ACTIVITY_QUESTIONS.length, 4);
assert.equal(VOLUNTEER_HOURS.length, 4);
assert.equal(SPECIAL_CRITERIA.length, 38);
assert.equal(SPECIAL_CRITERIA.filter((item) => item.id === 'adhd').length, 1);
assert.equal(SPECIAL_CRITERIA.some((item) => String(item.id) === 'add'), false);
assert.deepEqual(RESIDENCE_STATES.map(([value]) => value), questionMap.academicPrompts[1].options?.map((item) => item.value));
assert.deepEqual(EDUCATIONAL_STATUSES.map(([value]) => value), questionMap.academicPrompts[2].options?.map((item) => item.value));
assert.deepEqual(TARGET_SCHOOL_TYPES.map(([value]) => value), questionMap.academicPrompts[3].options?.map((item) => item.value));
assert.deepEqual(TARGET_SCHOOL_TYPES.map(([value, label]) => ({ value, label })), questionMap.academicPrompts[3].options);
assert.deepEqual(ACTIVITY_QUESTIONS.map((item) => item.id), questionMap.activityCheckboxes.map((item) => item.oldId.split('.').at(-1)));
assert.deepEqual(ACTIVITY_QUESTIONS.map((item) => ({ oldId: `passiveSignals.${item.id}`, newControlId: item.controlId, label: item.label, criterionId: item.criterionId })), questionMap.activityCheckboxes.map(({ currentEffect: _currentEffect, ruleMode: _ruleMode, sensitive: _sensitive, ...item }) => item));
assert.deepEqual(SPECIAL_CRITERIA.map((item) => item.id), questionMap.specialCriteria.map((item) => item.oldId));
assert.deepEqual(SPECIAL_CRITERIA.map((item) => ({ category: item.category, oldId: item.id, newControlId: item.controlId, label: item.label, tooltip: item.detail, criterionId: item.criterionId })), questionMap.specialCriteria.map(({ fixedValue: _fixedValue, sensitive: _sensitive, ruleMode: _ruleMode, ...item }) => item));
assert.deepEqual(VOLUNTEER_HOURS.map(([value, label]) => ({ value, label })), questionMap.conditionalVolunteerPrompt.options.map(({ typedRange: _typedRange, ...item }) => item));
assert.equal(questionMap.conditionalVolunteerPrompt.condition, 'passiveSignals.service === true');
assert.deepEqual(questionMap.earlierAffiliationMigration.map((item) => item.finalSpecialCriterionId), ['military_veteran', 'first_responder', 'farmers_union', 'electric_coop', 'credit_union', 'elks_lodge']);

const answers: InterviewAnswers = InterviewAnswersSchema.parse({
  gpa: 3.5,
  residenceState: 'MT',
  educationalStatus: 'high_school_senior',
  targetSchoolTypes: ['four_year'],
  collegeAccepted: true,
  gapYear: false,
  activities: ['leadership', 'work_experience', 'caregiving', 'service'],
  volunteerHours: '50 to 99',
  financialNeed: true,
  selectedCriteria: SPECIAL_CRITERIA.map((item) => item.id),
  sensitiveCriteriaSkipped: false,
  preferredApplicationModes: ['direct_per_award'],
});
assert.equal(InterviewAnswersSchema.safeParse({ ...answers, gpa: 4.01 }).success, false);
assert.equal(InterviewAnswersSchema.safeParse({ ...answers, residenceState: '' }).success, false);
assert.equal(InterviewAnswersSchema.safeParse({ ...answers, educationalStatus: '' }).success, false);
assert.equal(InterviewAnswersSchema.safeParse({ ...answers, targetSchoolTypes: [] }).success, false);
assert.equal(InterviewAnswersSchema.safeParse({ ...answers, targetSchoolTypes: ['four_year', 'four_year'] }).success, false);
assert.equal(InterviewAnswersSchema.safeParse({ ...answers, selectedCriteria: ['add'] }).success, false);

const oppositeAnswers = InterviewAnswersSchema.parse({
  ...answers,
  gpa: 1,
  residenceState: 'OTHER',
  educationalStatus: 'other',
  targetSchoolTypes: ['undecided'],
  collegeAccepted: 'prefer_not_to_answer',
  gapYear: 'prefer_not_to_answer',
  activities: [], volunteerHours: null, financialNeed: false, selectedCriteria: [], sensitiveCriteriaSkipped: true,
  preferredApplicationModes: [],
});
const currentA = matchStudentAwards(catalog.awards, answers, CURRENT_ACCEPTED_MATCH_FACTS);
const currentB = matchStudentAwards(catalog.awards, oppositeAnswers, CURRENT_ACCEPTED_MATCH_FACTS);
assert.deepEqual(currentA.counts, { match: 0, possibleMatch: 192, knownConflict: 0, total: 192 });
assert.deepEqual(currentB.counts, currentA.counts);
assert.deepEqual(currentB.results.map((item) => item.award.publicId), currentA.results.map((item) => item.award.publicId), 'unsupported answers must not reorder awards');
assert(currentA.results.every((item) => item.reasons.length > 0 && item.reasons.every((reason) => reason.kind !== 'known_conflict')));

const baseAward = catalog.awards[0];
const award = StudentAwardSchema.parse({ ...baseAward, publicId: 'award-200000000001', name: 'P8F synthetic accepted-fact award', eligibility: { ...baseAward.eligibility, minimumGpa: 3, schoolTypes: ['four_year'] }, cycle: { ...baseAward.cycle, status: 'active', label: 'Open now' }, application: { ...baseAward.application, mode: 'direct_per_award', label: 'Direct application' } });
const bundle = (facts: readonly AcceptedMatchingFact[], cycleIds: readonly string[] = []): AcceptedMatchFactBundle => ({
  byAwardId: { [award.publicId]: facts },
  cycleIdsByAwardId: cycleIds.length > 0 ? { [award.publicId]: cycleIds } : {},
});
const runFact = (fact: AcceptedMatchingFact, answerSet = answers, cycleIds: readonly string[] = []) => matchStudentAwards([award], answerSet, bundle([fact], cycleIds)).results[0];

const eligibilityFacts = [
  createSyntheticAcceptedFact(award, 'academic.gpa_unweighted', 'required', 'gte', 3),
  createSyntheticAcceptedFact(award, 'geography.residence_state', 'required', 'contains_any', ['MT']),
  createSyntheticAcceptedFact(award, 'education.current_status', 'required', 'eq', 'high_school_senior'),
  createSyntheticAcceptedFact(award, 'education.target_institution_type', 'required', 'contains_any', ['four_year']),
  createSyntheticAcceptedFact(award, 'education.college_accepted', 'required', 'eq', true),
  createSyntheticAcceptedFact(award, 'education.gap_year', 'required', 'eq', false),
  createSyntheticAcceptedFact(award, 'service.volunteer_hours', 'required', 'gte', 50),
];
for (const fact of eligibilityFacts) {
  assert(runFact(fact).reasons.some((reason) => reason.kind === 'confirmed_match'), `missing accepted gate for ${fact.criterion_id}`);
}

const positiveAliases = [...ACTIVITY_QUESTIONS.map((item) => item.id), 'financial_need', ...SPECIAL_CRITERIA.map((item) => item.id)];
for (const alias of positiveAliases) {
  const expanded = expandAlias(P8F_MATCHING_FACT_CONTRACT, alias, true);
  assert(expanded, `missing frozen alias ${alias}`);
  const item = SPECIAL_CRITERIA.find((criterion) => criterion.id === alias);
  const effect = item?.rankOnly ? 'preferred' : 'required';
  const fact = createSyntheticAcceptedFact(
    award,
    expanded.criterion_id,
    effect,
    (expanded.operator ?? 'eq') as AcceptedMatchingFact['operator'],
    expanded.value as AcceptedMatchingFact['value'],
  );
  const expectedKind = effect === 'preferred' ? 'preference' : 'confirmed_match';
  assert(runFact(fact).reasons.some((reason) => reason.kind === expectedKind), `missing positive accepted gate for ${alias}`);
  assert.notEqual(runFact(fact, oppositeAnswers).decision, 'known_conflict', `nonselection must remain non-excluding for ${alias}`);
}
const preferredAppFact = createSyntheticAcceptedFact(award, 'application.mode', 'preferred', 'eq', 'provider_form');
assert(runFact(preferredAppFact).reasons.some((reason) => reason.kind === 'preference'));

const partialRaceAnswers = InterviewAnswersSchema.parse({ ...oppositeAnswers, selectedCriteria: ['black_african_american'], sensitiveCriteriaSkipped: false });
const hispanicFact = createSyntheticAcceptedFact(award, 'identity.race_ethnicity', 'required', 'contains_any', ['hispanic_latino']);
assert.notEqual(runFact(hispanicFact, partialRaceAnswers).decision, 'known_conflict', 'an unchecked sibling race identity remains unknown');
assert(runFact(hispanicFact, partialRaceAnswers).reasons.some((reason) => reason.kind === 'verification_needed'));
const blackFact = createSyntheticAcceptedFact(award, 'identity.race_ethnicity', 'required', 'contains_any', ['black_african_american']);
assert(runFact(blackFact, partialRaceAnswers).reasons.some((reason) => reason.kind === 'confirmed_match'), 'an explicitly selected race identity may positively match exact accepted authority');

const partialGenderAnswers = InterviewAnswersSchema.parse({ ...oppositeAnswers, selectedCriteria: ['female'], sensitiveCriteriaSkipped: false });
const nonbinaryFact = createSyntheticAcceptedFact(award, 'identity.gender', 'required', 'contains_any', ['nonbinary']);
assert.notEqual(runFact(nonbinaryFact, partialGenderAnswers).decision, 'known_conflict', 'an unchecked sibling gender identity remains unknown');
const womanFact = createSyntheticAcceptedFact(award, 'identity.gender', 'required', 'contains_any', ['woman']);
assert(runFact(womanFact, partialGenderAnswers).reasons.some((reason) => reason.kind === 'confirmed_match'), 'an explicitly selected gender identity may positively match exact accepted authority');

const requiredAppFact = createSyntheticAcceptedFact(award, 'application.mode', 'required', 'eq', 'provider_portal');
const informationalAppFact = createSyntheticAcceptedFact(award, 'application.mode', 'informational', 'eq', 'provider_portal');
for (const fact of [requiredAppFact, informationalAppFact]) {
  const result = runFact(fact);
  assert.notEqual(result.decision, 'known_conflict', 'application preferences can never create an eligibility conflict');
  assert(!result.reasons.some((reason) => reason.kind === 'preference' || reason.kind === 'confirmed_match'));
}
const requiredStemFact = createSyntheticAcceptedFact(award, 'career.stem', 'required', 'eq', false);
const informationalStemFact = createSyntheticAcceptedFact(award, 'career.stem', 'informational', 'eq', true);
const stemAnswers = InterviewAnswersSchema.parse({ ...oppositeAnswers, selectedCriteria: ['stem'] });
for (const fact of [requiredStemFact, informationalStemFact]) {
  const result = runFact(fact, stemAnswers);
  assert.notEqual(result.decision, 'known_conflict', 'rank-only controls can never create an eligibility conflict');
  assert(!result.reasons.some((reason) => reason.kind === 'preference' || reason.kind === 'confirmed_match'));
}

for (const [bucket, expected] of questionMap.conditionalVolunteerPrompt.options.map((item) => [item.value, item.typedRange] as const)) {
  const expanded = expandAlias(P8F_MATCHING_FACT_CONTRACT, 'volunteer_hours_bucket', bucket);
  assert(expanded, `missing volunteer transform ${bucket}`);
  if (expected.upper === null) assert.deepEqual({ operator: expanded.operator, value: expanded.value }, { operator: 'gte', value: expected.lower });
  else assert.deepEqual({ operator: expanded.operator, value: expanded.value }, { operator: 'between', value: { lower: expected.lower, upper: expected.upper, lower_inclusive: true, upper_inclusive: true } });
}

const contradictionFact = createSyntheticAcceptedFact(award, 'geography.residence_state', 'required', 'contains_any', ['CO']);
assert.equal(runFact(contradictionFact).decision, 'known_conflict');
const undecided = runFact(createSyntheticAcceptedFact(award, 'education.target_institution_type', 'required', 'contains_any', ['four_year']), { ...answers, targetSchoolTypes: ['undecided'] });
assert.notEqual(undecided.decision, 'known_conflict');

const cycleId = 'cycle:award-200000000001:2026';
const closedCycleFact = createSyntheticAcceptedFact(award, 'cycle.status', 'informational', 'eq', 'closed', cycleId);
const closedCycleResult = runFact(closedCycleFact, answers, [cycleId]);
assert.notEqual(closedCycleResult.decision, 'known_conflict', 'cycle state cannot hard-exclude without an interview answer');
assert(closedCycleResult.reasons.some((reason) => reason.code === 'cycle_closed' && reason.kind === 'verification_needed'));
assert.throws(() => runFact(closedCycleFact, answers, ['cycle:award-200000000001:2025']), /wrong cycle/);

const validFact = eligibilityFacts[0];
assert.deepEqual(validateMatchingFact(P8F_MATCHING_FACT_CONTRACT, validFact), []);
assert.throws(() => parseAcceptedMatchingFact({ ...validFact, operator: 'eq' }), /invalid operator/);
assert.throws(() => parseAcceptedMatchingFact({ ...validFact, evidence_status: 'proposed', reviewer_id: null, reviewed_at: null, review_rationale: null }), /Only accepted/);
assert.throws(() => parseAcceptedMatchingFact({ ...validFact, taxonomy_version: '2.0.0' }), /taxonomy version/);
assert.throws(() => matchStudentAwards([award], answers, { byAwardId: { [award.publicId]: [{ ...validFact, award_id: 'award-200000000002' }] }, cycleIdsByAwardId: {} }), /index does not match/);

const wizardSource = fs.readFileSync(path.join(webRoot, 'src/components/InterviewWizard.tsx'), 'utf8');
const browserSource = fs.readFileSync(path.join(webRoot, 'src/components/ScholarshipBrowser.tsx'), 'utf8');
const matcherSource = fs.readFileSync(path.join(webRoot, 'src/lib/interviewMatcher.ts'), 'utf8');
const clientSource = fs.readFileSync(path.join(webRoot, 'src/lib/studentCatalogClient.ts'), 'utf8');
assert(wizardSource.includes('All 38 former special-criteria choices are restored'));
assert(wizardSource.includes('Prefer not to answer sensitive questions'));
assert(!wizardSource.includes('organization_affiliations'));
for (const excluded of questionMap.typeOnlyExcluded.map((item) => item.split('.').at(-1))) assert(!new RegExp(`\\b${String(excluded)}\\b`).test(wizardSource), `type-only field rendered: ${excluded}`);
for (const forbidden of ['sessionStorage', 'localStorage', 'indexedDB', 'document.cookie', 'sendBeacon', 'fetch(', 'XMLHttpRequest', 'history.pushState', 'history.replaceState', 'console.']) assert(!wizardSource.includes(forbidden), `wizard contains forbidden channel ${forbidden}`);
for (const forbidden of ['processAndFilter', './processor', 'rulesPack', 'studentCatalogLegacy', 'amountRank', 'is_new']) assert(!matcherSource.includes(forbidden), `matcher contains retired behavior ${forbidden}`);
assert(browserSource.includes('CURRENT_ACCEPTED_MATCH_FACTS'));
assert(browserSource.includes('Your answers had no current effect.'));
assert(browserSource.includes('Browse all'));
assert(browserSource.includes('awardCsvDataUri(visibleAwards)'));
assert(browserSource.includes('rel="noopener noreferrer"'));
assert(clientSource.includes("method: 'GET'"));
assert(!/InterviewAnswers|answers|request\s*body|body\s*:/.test(clientSource));
assert(fs.existsSync(path.join(webRoot, 'src/app/api/scholarships/route.ts')));
assert(fs.existsSync(path.join(webRoot, 'src/app/admin/page.tsx')));

const csv = serializeAwardCsv(currentA.results.slice(0, 3).map((item) => item.award));
assert.equal(csv.split('\r\n').filter(Boolean).length, 4);
for (const forbidden of ['residenceState', 'selectedCriteria', 'possible_match', 'accepted_rule_', 'sensitiveCriteriaSkipped']) assert(!csv.includes(forbidden));

const changedPaths = fs.readFileSync(path.join(repoRoot, '.git'), 'utf8');
assert(changedPaths.startsWith('gitdir:'), 'P8F must run in an isolated Git worktree');

console.log(`P8F INTERVIEW TEST PASS awards=${catalog.counts.awards} academic=6 activities=${ACTIVITY_QUESTIONS.length} volunteer=1 financial=1 criteria=${SPECIAL_CRITERIA.length} acceptedFacts=${CURRENT_ACCEPTED_MATCHING_FACT_COUNT} ruleGates=${eligibilityFacts.length + positiveAliases.length + 1}`);
