import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import catalogJson from '../fixtures/p7/student-catalog.json';
import questionMapJson from '../../docs/evidence/P8F-question-rule-map.json';
import { serializeAwardCsv } from '../src/lib/export';
import {
  AcceptedAwardMatchFactsSchema,
  InterviewAnswersSchema,
  matchStudentAwards,
  type AcceptedAwardMatchFacts,
  type InterviewAnswers,
} from '../src/lib/interviewMatcher';
import { ACTIVITY_QUESTIONS, EDUCATIONAL_STATUSES, RESIDENCE_STATES, SPECIAL_CRITERIA, TARGET_SCHOOL_TYPES, VOLUNTEER_HOURS } from '../src/lib/interviewQuestions';
import { CURRENT_ACCEPTED_MATCH_FACTS, CURRENT_ACCEPTED_MATCHING_FACT_COUNT, P8M_MATCHING_PUBLICATION, P8M_PUBLICATION_SHA256 } from '../src/lib/p8mMatchingFacts';
import { StudentAwardSchema, StudentCatalogSchema } from '../src/lib/studentCatalog';

const webRoot = process.cwd();
const repoRoot = path.resolve(webRoot, '..');
const catalog = StudentCatalogSchema.parse(catalogJson);
const questionMap = questionMapJson;
const publicationBytes = fs.readFileSync(path.join(webRoot, 'fixtures/p8m/matching-facts-v1.json'));
assert.equal(crypto.createHash('sha256').update(publicationBytes).digest('hex'), P8M_PUBLICATION_SHA256);
assert.equal(P8M_MATCHING_PUBLICATION.taxonomy_version, '1.0.0');
assert.equal(CURRENT_ACCEPTED_MATCHING_FACT_COUNT, 0);
assert.deepEqual(CURRENT_ACCEPTED_MATCH_FACTS, {});

assert.equal(questionMap.questionCounts.academicPrompts, 6);
assert.equal(ACTIVITY_QUESTIONS.length, 4);
assert.equal(VOLUNTEER_HOURS.length, 4);
assert.equal(SPECIAL_CRITERIA.length, 38);
assert.equal(SPECIAL_CRITERIA.filter((item) => item.id === 'adhd').length, 1);
assert.equal(SPECIAL_CRITERIA.some((item) => String(item.id) === 'add'), false);
assert.deepEqual(RESIDENCE_STATES.map(([value]) => value), questionMap.academicPrompts[1].options?.map((item) => item.value));
assert.deepEqual(EDUCATIONAL_STATUSES.map(([value]) => value), questionMap.academicPrompts[2].options?.map((item) => item.value));
assert.deepEqual(TARGET_SCHOOL_TYPES.map(([value]) => value), questionMap.academicPrompts[3].options?.map((item) => item.value));
assert.deepEqual(ACTIVITY_QUESTIONS.map((item) => item.id), questionMap.activityCheckboxes.map((item) => item.oldId.split('.').at(-1)));
assert.deepEqual(SPECIAL_CRITERIA.map((item) => item.id), questionMap.specialCriteria.map((item) => item.oldId));
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
const authority = 'synthetic_matrix_fixture' as const;
const baseFacts = (interviewRules: AcceptedAwardMatchFacts['interviewRules']): AcceptedAwardMatchFacts => AcceptedAwardMatchFactsSchema.parse({
  awardPublicId: award.publicId,
  minimumGpa: null,
  schoolTypes: null,
  cycleStatus: { value: 'active', authority },
  applicationMode: { value: 'direct_per_award', authority },
  eligibilityDimensionsComplete: { value: true, authority },
  interviewRules,
});
const runRule = (rule: AcceptedAwardMatchFacts['interviewRules'][number], answerSet = answers) => matchStudentAwards([award], answerSet, { [award.publicId]: baseFacts([rule]) }).results[0];

const eligibilityRules: AcceptedAwardMatchFacts['interviewRules'] = [
  { answerKey: 'gpa', criterionId: 'academic.gpa_unweighted', effect: 'required', operator: 'gte', value: 3, authority },
  { answerKey: 'residenceState', criterionId: 'geography.residence_state', effect: 'required', operator: 'equals', value: 'MT', authority },
  { answerKey: 'educationalStatus', criterionId: 'education.current_status', effect: 'required', operator: 'equals', value: 'high_school_senior', authority },
  { answerKey: 'targetSchoolTypes', criterionId: 'education.target_institution_type', effect: 'required', operator: 'one_of', value: ['four_year'], authority },
  { answerKey: 'collegeAccepted', criterionId: 'education.college_accepted', effect: 'required', operator: 'equals', value: true, authority },
  { answerKey: 'gapYear', criterionId: 'education.gap_year', effect: 'required', operator: 'equals', value: false, authority },
  { answerKey: 'volunteerHours', criterionId: 'service.volunteer_hours', effect: 'required', operator: 'one_of', value: ['50 to 99'], authority },
];
for (const rule of eligibilityRules) assert(runRule(rule).reasons.some((reason) => reason.code === `accepted_rule_${rule.answerKey}` && reason.kind === 'confirmed_match'), `missing accepted gate for ${rule.answerKey}`);

const positiveRules: AcceptedAwardMatchFacts['interviewRules'] = [
  ...ACTIVITY_QUESTIONS.map((item) => ({ answerKey: item.id, criterionId: item.criterionId, effect: 'required' as const, operator: 'equals' as const, value: true, authority })),
  { answerKey: 'financialNeed', criterionId: 'financial.need', effect: 'required', operator: 'equals', value: true, authority },
  ...SPECIAL_CRITERIA.map((item) => ({ answerKey: item.id, criterionId: item.criterionId, effect: (item.rankOnly ? 'preferred' : 'required') as 'preferred' | 'required', operator: 'equals' as const, value: true, authority })),
];
for (const rule of positiveRules) {
  const result = runRule(rule);
  const expectedKind = rule.effect === 'preferred' ? 'preference' : 'confirmed_match';
  assert(result.reasons.some((reason) => reason.kind === expectedKind), `missing positive accepted gate for ${rule.answerKey}`);
  const withoutSelection = runRule(rule, oppositeAnswers);
  assert.notEqual(withoutSelection.decision, 'known_conflict', `nonselection must remain non-excluding for ${rule.answerKey}`);
}
const preferredApp = runRule({ answerKey: 'preferredApplicationModes', criterionId: 'application.application_mode', effect: 'preferred', operator: 'one_of', value: ['direct_per_award'], authority });
assert(preferredApp.reasons.some((reason) => reason.kind === 'preference'));

const contradiction = runRule({ answerKey: 'residenceState', criterionId: 'geography.residence_state', effect: 'required', operator: 'equals', value: 'CO', authority });
assert.equal(contradiction.decision, 'known_conflict');
assert.throws(() => runRule({ answerKey: 'residenceState', criterionId: 'education.current_status', effect: 'required', operator: 'equals', value: 'MT', authority }), /invalid criterion binding/);
assert.equal(AcceptedAwardMatchFactsSchema.safeParse({ ...baseFacts([]), awardPublicId: 'wrong' }).success, false);
assert.equal(AcceptedAwardMatchFactsSchema.safeParse({ ...baseFacts([]), interviewRules: [{ ...eligibilityRules[0], authority: 'proposed' }] }).success, false);

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

console.log(`P8F INTERVIEW TEST PASS awards=${catalog.counts.awards} academic=6 activities=${ACTIVITY_QUESTIONS.length} volunteer=1 financial=1 criteria=${SPECIAL_CRITERIA.length} acceptedFacts=${CURRENT_ACCEPTED_MATCHING_FACT_COUNT} ruleGates=${eligibilityRules.length + positiveRules.length + 1}`);
