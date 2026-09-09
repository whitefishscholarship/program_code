import { z } from 'zod';
import { StudentAwardSchema, type ApplicationMode, type StudentAward } from './studentCatalog';
import {
  ACTIVITY_QUESTIONS,
  EDUCATIONAL_STATUSES,
  RESIDENCE_STATES,
  SPECIAL_CRITERIA,
  TARGET_SCHOOL_TYPES,
  VOLUNTEER_HOURS,
} from './interviewQuestions';
import {
  P8F_MATCHING_FACT_CONTRACT,
  parseAcceptedMatchingFact,
  type AcceptedMatchingFact,
  type MatchingFactValue,
} from './matchingFactRuntime';
import { expandAlias } from '../../scripts/matching-fact-contract';

export const INTERVIEW_APPLICATION_MODES = [
  'automatic_consideration', 'selectable_children', 'eligibility_matched',
  'shared_with_supplements', 'direct_per_award', 'offline',
] as const;

const uniqueValues = (values: readonly string[]) => new Set(values).size === values.length;
type ResidenceState = (typeof RESIDENCE_STATES)[number][0];
type EducationalStatus = (typeof EDUCATIONAL_STATUSES)[number][0];
type TargetSchoolType = (typeof TARGET_SCHOOL_TYPES)[number][0];
type ActivityId = (typeof ACTIVITY_QUESTIONS)[number]['id'];
type VolunteerHours = (typeof VOLUNTEER_HOURS)[number][0];
type SpecialCriterionId = (typeof SPECIAL_CRITERIA)[number]['id'];

const enumFrom = <T extends string>(values: readonly T[], label: string) => z.custom<T>(
  (value) => typeof value === 'string' && values.includes(value as T),
  `${label} is not recognized.`,
);

export const InterviewAnswersSchema = z.strictObject({
  gpa: z.number().finite().min(0).max(4),
  residenceState: enumFrom<ResidenceState>(RESIDENCE_STATES.map(([value]) => value), 'Residence state'),
  educationalStatus: enumFrom<EducationalStatus>(EDUCATIONAL_STATUSES.map(([value]) => value), 'Educational status'),
  targetSchoolTypes: z.array(enumFrom<TargetSchoolType>(TARGET_SCHOOL_TYPES.map(([value]) => value), 'Target school type')).min(1).max(TARGET_SCHOOL_TYPES.length).refine(uniqueValues, 'Target school types must not repeat.'),
  collegeAccepted: z.union([z.boolean(), z.literal('prefer_not_to_answer')]).nullable(),
  gapYear: z.union([z.boolean(), z.literal('prefer_not_to_answer')]).nullable(),
  activities: z.array(enumFrom<ActivityId>(ACTIVITY_QUESTIONS.map(({ id }) => id), 'Activity')).max(ACTIVITY_QUESTIONS.length).refine(uniqueValues, 'Activities must not repeat.'),
  volunteerHours: enumFrom<VolunteerHours>(VOLUNTEER_HOURS.map(([value]) => value), 'Volunteer hours').nullable(),
  financialNeed: z.boolean(),
  selectedCriteria: z.array(enumFrom<SpecialCriterionId>(SPECIAL_CRITERIA.map(({ id }) => id), 'Special criterion')).max(SPECIAL_CRITERIA.length).refine(uniqueValues, 'Special criteria must not repeat.'),
  sensitiveCriteriaSkipped: z.boolean(),
  preferredApplicationModes: z.array(z.enum(INTERVIEW_APPLICATION_MODES)).max(INTERVIEW_APPLICATION_MODES.length).refine(uniqueValues, 'Application preferences must not repeat.'),
});

export type InterviewAnswers = z.infer<typeof InterviewAnswersSchema>;
export type AcceptedMatchFactsByAwardId = Readonly<Record<string, readonly AcceptedMatchingFact[]>>;
export type AcceptedMatchFactBundle = Readonly<{
  byAwardId: AcceptedMatchFactsByAwardId;
  cycleIdsByAwardId: Readonly<Record<string, readonly string[]>>;
}>;
export type MatchDecision = 'match' | 'possible_match' | 'known_conflict';

export const EMPTY_ACCEPTED_MATCH_FACT_BUNDLE: AcceptedMatchFactBundle = Object.freeze({
  byAwardId: Object.freeze({}), cycleIdsByAwardId: Object.freeze({}),
});

export const PUBLIC_MATCH_REASON_FIELDS = ['code', 'kind', 'message'] as const;
export const PUBLIC_MATCH_RESULT_FIELDS = ['award', 'decision', 'reasons'] as const;
export const PUBLIC_MATCH_RESPONSE_FIELDS = ['counts', 'results'] as const;

export type MatchReason = { code: string; kind: 'confirmed_match' | 'known_conflict' | 'verification_needed' | 'preference'; message: string };
export type AwardMatchResult = { award: StudentAward; decision: MatchDecision; reasons: MatchReason[] };
export type MatchResponse = {
  counts: { match: number; possibleMatch: number; knownConflict: number; total: number };
  results: AwardMatchResult[];
};
type RankedResult = AwardMatchResult & { decisionRank: number; preferenceRank: number; confirmedRank: number };
type NumericInterval = { lower: number; upper: number | null };
type Observation = boolean | number | string | string[] | NumericInterval | undefined;
const CORE_REQUIRED_CRITERIA = [
  'academic.gpa_unweighted',
  'geography.residence_state',
  'education.current_status',
  'education.target_institution_type',
] as const;

const applicationPreferenceToContract: Record<Exclude<ApplicationMode, 'unknown'>, string> = {
  automatic_consideration: 'automatic_consideration',
  selectable_children: 'organizer_common',
  eligibility_matched: 'provider_portal',
  shared_with_supplements: 'organizer_common',
  direct_per_award: 'provider_form',
  offline: 'paper',
};

function selectedAliasObservation(answers: InterviewAnswers, criterionId: string): Observation {
  const aliases = [...answers.activities, ...(answers.financialNeed ? ['financial_need'] : []), ...answers.selectedCriteria];
  const expanded = aliases.map((alias) => expandAlias(P8F_MATCHING_FACT_CONTRACT, alias, true))
    .filter((item): item is NonNullable<typeof item> => item?.criterion_id === criterionId);
  if (expanded.length === 0) return undefined;
  const values = expanded.flatMap((item) => Array.isArray(item.value) ? item.value : [item.value]);
  if (values.every((value) => typeof value === 'string')) return [...new Set(values as string[])];
  return values[0] as boolean | number | string;
}

function observationForCriterion(answers: InterviewAnswers, criterionId: string): Observation {
  if (criterionId === 'academic.gpa_unweighted') return answers.gpa;
  if (criterionId === 'geography.residence_state') return answers.residenceState === 'OTHER' ? undefined : [answers.residenceState];
  if (criterionId === 'education.current_status') {
    const domain = P8F_MATCHING_FACT_CONTRACT.factSchema.enumDomains[criterionId] ?? [];
    return domain.includes(answers.educationalStatus) ? answers.educationalStatus : undefined;
  }
  if (criterionId === 'education.target_institution_type') {
    const values = answers.targetSchoolTypes.filter((value) => value !== 'undecided');
    return values.length > 0 ? values : undefined;
  }
  if (criterionId === 'education.college_accepted') return typeof answers.collegeAccepted === 'boolean' ? answers.collegeAccepted : undefined;
  if (criterionId === 'education.gap_year') return typeof answers.gapYear === 'boolean' ? answers.gapYear : undefined;
  if (criterionId === 'service.volunteer_hours') {
    if (!answers.activities.includes('service') || !answers.volunteerHours) return undefined;
    const expanded = expandAlias(P8F_MATCHING_FACT_CONTRACT, 'volunteer_hours_bucket', answers.volunteerHours);
    if (!expanded) return undefined;
    if (expanded.operator === 'between' && typeof expanded.value === 'object' && expanded.value !== null && !Array.isArray(expanded.value)) {
      const range = expanded.value as { lower: number; upper: number };
      return { lower: range.lower, upper: range.upper };
    }
    if (expanded.operator === 'gte' && typeof expanded.value === 'number') return { lower: expanded.value, upper: null };
    return typeof expanded.value === 'number' ? expanded.value : undefined;
  }
  if (criterionId === 'application.mode') {
    const values = answers.preferredApplicationModes.map((mode) => applicationPreferenceToContract[mode]);
    return values.length > 0 ? [...new Set(values)] : undefined;
  }
  return selectedAliasObservation(answers, criterionId);
}

function compareNumericInterval(observation: NumericInterval, operator: AcceptedMatchingFact['operator'], expected: MatchingFactValue): boolean | undefined {
  if (typeof expected === 'number') {
    if (operator === 'gte') {
      if (observation.lower >= expected) return true;
      if (observation.upper !== null && observation.upper < expected) return false;
      return undefined;
    }
    if (operator === 'lte') {
      if (observation.upper !== null && observation.upper <= expected) return true;
      if (observation.lower > expected) return false;
      return undefined;
    }
    if (operator === 'eq') {
      if (observation.upper !== null && observation.lower === expected && observation.upper === expected) return true;
      if (expected < observation.lower || (observation.upper !== null && expected > observation.upper)) return false;
      return undefined;
    }
  }
  if (operator === 'between' && typeof expected === 'object' && expected !== null && !Array.isArray(expected)) {
    const lower = typeof expected.lower === 'number' ? expected.lower : Number.NaN;
    const upper = typeof expected.upper === 'number' ? expected.upper : Number.NaN;
    if (!Number.isFinite(lower) || !Number.isFinite(upper)) return undefined;
    const withinLower = expected.lower_inclusive ? observation.lower >= lower : observation.lower > lower;
    const withinUpper = observation.upper !== null && (expected.upper_inclusive ? observation.upper <= upper : observation.upper < upper);
    if (withinLower && withinUpper) return true;
    if ((observation.upper !== null && observation.upper < lower) || observation.lower > upper) return false;
  }
  return undefined;
}

function satisfiesFact(observation: Exclude<Observation, undefined>, operator: AcceptedMatchingFact['operator'], expected: MatchingFactValue): boolean | undefined {
  if (typeof observation === 'object' && !Array.isArray(observation)) return compareNumericInterval(observation, operator, expected);
  const observedValues = Array.isArray(observation) ? observation.map(String) : [String(observation)];
  const expectedValues = Array.isArray(expected) ? expected.map(String) : [String(expected)];
  if (operator === 'contains_any' || operator === 'in') return observedValues.some((value) => expectedValues.includes(value));
  if (operator === 'contains_all') return expectedValues.every((value) => observedValues.includes(value));
  if (operator === 'not_in') return !observedValues.some((value) => expectedValues.includes(value));
  if (operator === 'exists') return expected === true;
  if (operator === 'eq') return Array.isArray(observation) ? observedValues.includes(String(expected)) : observation === expected;
  if (operator === 'neq') return Array.isArray(observation) ? !observedValues.includes(String(expected)) : observation !== expected;
  if (typeof observation === 'number' && typeof expected === 'number') {
    if (operator === 'gte') return observation >= expected;
    if (operator === 'lte') return observation <= expected;
  }
  if (operator === 'between' && typeof observation === 'number' && typeof expected === 'object' && expected !== null && !Array.isArray(expected)) {
    const lower = Number(expected.lower);
    const upper = Number(expected.upper);
    return (expected.lower_inclusive ? observation >= lower : observation > lower)
      && (expected.upper_inclusive ? observation <= upper : observation < upper);
  }
  return undefined;
}

function validatedFacts(award: StudentAward, bundle: AcceptedMatchFactBundle): AcceptedMatchingFact[] {
  return [...(bundle.byAwardId[award.publicId] ?? [])].map((value) => {
    const fact = parseAcceptedMatchingFact(value);
    if (fact.award_id !== award.publicId) throw new Error('Accepted matching fact targets the wrong award.');
    if (fact.cycle_id !== null && !(bundle.cycleIdsByAwardId[award.publicId] ?? []).includes(fact.cycle_id)) {
      throw new Error('Accepted matching fact targets an unbound or wrong cycle.');
    }
    return fact;
  });
}

function cycleReason(fact: AcceptedMatchingFact): MatchReason | null {
  if (fact.criterion_id !== 'cycle.status' || typeof fact.value !== 'string') return null;
  if (fact.value === 'open') return { code: 'cycle_active', kind: 'confirmed_match', message: 'Accepted cycle evidence says this cycle is open.' };
  return {
    code: fact.value === 'closed' ? 'cycle_closed' : fact.value === 'suspended' ? 'cycle_unavailable' : 'cycle_upcoming',
    kind: 'verification_needed',
    message: 'Accepted cycle evidence is shown for planning, but cycle state alone never excludes an award from interview results.',
  };
}

function evaluateAward(awardValue: StudentAward, answersValue: InterviewAnswers, bundle: AcceptedMatchFactBundle): RankedResult {
  const award = StudentAwardSchema.parse(awardValue);
  const answers = InterviewAnswersSchema.parse(answersValue);
  const facts = validatedFacts(award, bundle);
  const reasons: MatchReason[] = [{ code: 'eligibility_not_fully_modeled', kind: 'verification_needed', message: 'Other requirements may not be fully modeled. Verify every requirement on the official source.' }];
  let conflicts = 0;
  let confirmedEligibilityFacts = 0;
  let preferredMatches = 0;
  const confirmedCoreCriteria = new Set<string>();

  if (!facts.some((fact) => fact.criterion_id === 'academic.gpa_unweighted')) reasons.push({ code: 'gpa_not_accepted', kind: 'verification_needed', message: 'No accepted award-bound GPA fact currently supports a decision.' });
  if (!facts.some((fact) => fact.criterion_id === 'education.target_institution_type')) reasons.push({ code: 'school_type_not_accepted', kind: 'verification_needed', message: 'No accepted award-bound school-type fact currently supports a decision.' });
  if (!facts.some((fact) => fact.criterion_id === 'cycle.status')) reasons.push({ code: 'cycle_not_verified', kind: 'verification_needed', message: 'Current cycle availability is not verified by an accepted cycle-bound fact.' });

  for (const fact of facts) {
    const acceptedCycleReason = cycleReason(fact);
    if (acceptedCycleReason) { reasons.push(acceptedCycleReason); continue; }
    if (fact.effect === 'informational') {
      reasons.push({ code: `informational_fact_${fact.criterion_id}`, kind: 'verification_needed', message: 'An accepted informational fact is available, but it does not affect eligibility or order.' });
      continue;
    }
    const observation = observationForCriterion(answers, fact.criterion_id);
    if (observation === undefined) {
      reasons.push({ code: `accepted_rule_${fact.criterion_id}`, kind: 'verification_needed', message: 'This accepted fact has no explicit comparable answer, so it does not exclude or promote the award.' });
      continue;
    }
    const satisfied = satisfiesFact(observation, fact.operator, fact.value);
    if (satisfied === undefined) {
      reasons.push({ code: `accepted_rule_${fact.criterion_id}`, kind: 'verification_needed', message: 'The answer and accepted fact overlap without proving agreement or contradiction.' });
    } else if (fact.effect === 'preferred' && satisfied) {
      preferredMatches += 1;
      reasons.push({ code: `preferred_rule_${fact.criterion_id}`, kind: 'preference', message: 'An accepted award-bound preference fact matched an explicit answer. It affects order only.' });
    } else if (fact.effect === 'required' && satisfied) {
      confirmedEligibilityFacts += 1;
      if ((CORE_REQUIRED_CRITERIA as readonly string[]).includes(fact.criterion_id)) confirmedCoreCriteria.add(fact.criterion_id);
      const code = fact.criterion_id === 'academic.gpa_unweighted' ? 'gpa_meets_minimum' : fact.criterion_id === 'education.target_institution_type' ? 'school_type_matches' : `accepted_rule_${fact.criterion_id}`;
      reasons.push({ code, kind: 'confirmed_match', message: 'An accepted award-bound required fact agrees with an explicit typed answer.' });
    } else if (fact.effect === 'required' && !satisfied) {
      conflicts += 1;
      const code = fact.criterion_id === 'academic.gpa_unweighted' ? 'gpa_below_minimum' : fact.criterion_id === 'education.target_institution_type' ? 'school_type_conflict' : `accepted_rule_${fact.criterion_id}`;
      reasons.push({ code, kind: 'known_conflict', message: 'An explicit typed answer contradicts an accepted award-bound required fact.' });
    }
  }

  const decision: MatchDecision = conflicts > 0
    ? 'known_conflict'
    : CORE_REQUIRED_CRITERIA.every((criterionId) => confirmedCoreCriteria.has(criterionId))
      ? 'match'
      : 'possible_match';
  return { award, decision, reasons, decisionRank: { match: 0, possible_match: 1, known_conflict: 2 }[decision], preferenceRank: -preferredMatches, confirmedRank: -confirmedEligibilityFacts };
}

function syntheticCycleId(award: StudentAward): string { return `cycle:${award.publicId}:${award.cycle.year ?? 'unknown'}`; }

export function createSyntheticAcceptedFact(
  award: StudentAward,
  criterion_id: string,
  effect: AcceptedMatchingFact['effect'],
  operator: AcceptedMatchingFact['operator'],
  value: MatchingFactValue,
  cycle_id: string | null = null,
): AcceptedMatchingFact {
  return parseAcceptedMatchingFact({
    award_id: award.publicId, cycle_id, criterion_id, effect, operator, value,
    evidence_status: 'accepted', source_url: 'https://example.org/p8f-synthetic-matrix',
    source_revision: 'p8f-synthetic-matrix-v1', observed_at: '2026-09-08T12:00:00Z',
    evidence_excerpt: 'Synthetic QA fact; never enabled in production.', reviewer_id: 'reviewer:p8f-synthetic',
    reviewed_at: '2026-09-08T12:01:00Z', review_rationale: 'Deterministic development-only matcher coverage.',
    taxonomy_version: '1.0.0',
  });
}

export function buildSyntheticMatrixMatchFacts(awards: readonly StudentAward[]): AcceptedMatchFactBundle {
  const byAwardId: Record<string, AcceptedMatchingFact[]> = {};
  const cycleIdsByAwardId: Record<string, string[]> = {};
  for (const awardValue of awards) {
    const award = StudentAwardSchema.parse(awardValue);
    const cycleId = syntheticCycleId(award);
    cycleIdsByAwardId[award.publicId] = [cycleId];
    const facts: AcceptedMatchingFact[] = [];
    if (award.eligibility.minimumGpa !== null) facts.push(createSyntheticAcceptedFact(award, 'academic.gpa_unweighted', 'required', 'gte', award.eligibility.minimumGpa));
    if (award.eligibility.schoolTypes.length > 0) {
      const schoolTypes = award.eligibility.schoolTypes.map((value) => value === 'trade' ? 'trade_vocational' : value === 'other' ? 'other_accredited' : value);
      facts.push(createSyntheticAcceptedFact(award, 'education.target_institution_type', 'required', 'contains_any', schoolTypes));
    }
    if (award.cycle.status !== 'unknown') {
      const cycleStatus = { active: 'open', upcoming: 'not_open', closed: 'closed', unavailable: 'suspended' }[award.cycle.status];
      facts.push(createSyntheticAcceptedFact(award, 'cycle.status', 'informational', 'eq', cycleStatus, cycleId));
    }
    if (award.application.mode !== 'unknown') facts.push(createSyntheticAcceptedFact(award, 'application.mode', 'preferred', 'eq', applicationPreferenceToContract[award.application.mode]));
    if (award.eligibility.minimumGpa !== null) {
      facts.push(createSyntheticAcceptedFact(award, 'education.current_status', 'required', 'eq', 'high_school_senior'));
      facts.push(createSyntheticAcceptedFact(award, 'geography.residence_state', 'required', 'contains_any', [award.cycle.status === 'unavailable' ? 'CO' : 'MT']));
    }
    byAwardId[award.publicId] = facts;
  }
  return { byAwardId, cycleIdsByAwardId };
}

export function matchStudentAwards(awardsValue: readonly StudentAward[], answersValue: InterviewAnswers, bundle: AcceptedMatchFactBundle = EMPTY_ACCEPTED_MATCH_FACT_BUNDLE): MatchResponse {
  const answers = InterviewAnswersSchema.parse(answersValue);
  const awardIds = new Set(awardsValue.map((award) => award.publicId));
  for (const [awardId, values] of Object.entries(bundle.byAwardId)) {
    if (!awardIds.has(awardId)) throw new Error('Accepted matching facts include an unknown or parent-only award identity.');
    for (const value of values) {
      const fact = parseAcceptedMatchingFact(value);
      if (fact.award_id !== awardId) throw new Error('Accepted matching fact index does not match its award identity.');
    }
  }
  const results = awardsValue.map((award) => evaluateAward(award, answers, bundle)).sort((left, right) =>
    left.decisionRank - right.decisionRank || left.preferenceRank - right.preferenceRank || left.confirmedRank - right.confirmedRank
    || left.award.name.localeCompare(right.award.name) || left.award.publicId.localeCompare(right.award.publicId))
    .map(({ decisionRank: _decisionRank, preferenceRank: _preferenceRank, confirmedRank: _confirmedRank, ...result }) => result);
  return {
    counts: {
      match: results.filter((result) => result.decision === 'match').length,
      possibleMatch: results.filter((result) => result.decision === 'possible_match').length,
      knownConflict: results.filter((result) => result.decision === 'known_conflict').length,
      total: results.length,
    },
    results,
  };
}
