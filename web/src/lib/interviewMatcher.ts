import { z } from 'zod';
import {
  StudentAwardSchema,
  type ApplicationMode,
  type StudentAward,
} from './studentCatalog';

export const INTERVIEW_SCHOOL_TYPES = [
  'two_year',
  'four_year',
  'trade',
  'other',
] as const;

export const INTERVIEW_APPLICATION_MODES = [
  'automatic_consideration',
  'selectable_children',
  'eligibility_matched',
  'shared_with_supplements',
  'direct_per_award',
  'offline',
] as const;

const uniqueValues = (values: readonly string[]) => new Set(values).size === values.length;

export const InterviewAnswersSchema = z.strictObject({
  gpa: z.number().finite().min(0).max(4),
  schoolTypes: z
    .array(z.enum(INTERVIEW_SCHOOL_TYPES))
    .min(1)
    .max(INTERVIEW_SCHOOL_TYPES.length)
    .refine(uniqueValues, 'School types must not repeat.'),
  preferredApplicationModes: z
    .array(z.enum(INTERVIEW_APPLICATION_MODES))
    .max(INTERVIEW_APPLICATION_MODES.length)
    .refine(uniqueValues, 'Application preferences must not repeat.'),
});

export type InterviewAnswers = z.infer<typeof InterviewAnswersSchema>;
export type MatchDecision = 'match' | 'possible_match' | 'known_conflict';

export const PUBLIC_MATCH_REASON_FIELDS = ['code', 'kind', 'message'] as const;
export const PUBLIC_MATCH_RESULT_FIELDS = ['award', 'decision', 'reasons'] as const;
export const PUBLIC_MATCH_RESPONSE_FIELDS = ['counts', 'results'] as const;

export type MatchReason = {
  code:
    | 'gpa_meets_minimum'
    | 'gpa_below_minimum'
    | 'gpa_not_published'
    | 'school_type_matches'
    | 'school_type_conflict'
    | 'school_type_not_published'
    | 'cycle_active'
    | 'cycle_upcoming'
    | 'cycle_closed'
    | 'cycle_unavailable'
    | 'cycle_not_verified'
    | 'preferred_application_mode';
  kind: 'confirmed_match' | 'known_conflict' | 'verification_needed' | 'preference';
  message: string;
};

export type AwardMatchResult = {
  award: StudentAward;
  decision: MatchDecision;
  reasons: MatchReason[];
};

export type MatchResponse = {
  counts: {
    match: number;
    possibleMatch: number;
    knownConflict: number;
    total: number;
  };
  results: AwardMatchResult[];
};

type RankedResult = AwardMatchResult & {
  decisionRank: number;
  preferenceRank: number;
  confirmedRank: number;
  amountRank: number;
};

function evaluateAward(awardValue: StudentAward, answersValue: InterviewAnswers): RankedResult {
  const award = StudentAwardSchema.parse(awardValue);
  const answers = InterviewAnswersSchema.parse(answersValue);
  const reasons: MatchReason[] = [];
  let conflicts = 0;
  let unknownEligibilityFacts = 0;
  let confirmedEligibilityFacts = 0;

  if (award.eligibility.minimumGpa === null) {
    unknownEligibilityFacts += 1;
    reasons.push({
      code: 'gpa_not_published',
      kind: 'verification_needed',
      message: 'This award does not publish a structured minimum GPA in the catalog. Verify the official source.',
    });
  } else if (answers.gpa < award.eligibility.minimumGpa) {
    conflicts += 1;
    reasons.push({
      code: 'gpa_below_minimum',
      kind: 'known_conflict',
      message: 'Your GPA is below the structured minimum GPA published for this award.',
    });
  } else {
    confirmedEligibilityFacts += 1;
    reasons.push({
      code: 'gpa_meets_minimum',
      kind: 'confirmed_match',
      message: 'Your GPA meets the structured minimum GPA published for this award.',
    });
  }

  if (award.eligibility.schoolTypes.length === 0) {
    unknownEligibilityFacts += 1;
    reasons.push({
      code: 'school_type_not_published',
      kind: 'verification_needed',
      message: 'This award does not publish a structured school-type rule in the catalog. Verify the official source.',
    });
  } else if (!award.eligibility.schoolTypes.some((schoolType) => answers.schoolTypes.includes(schoolType))) {
    conflicts += 1;
    reasons.push({
      code: 'school_type_conflict',
      kind: 'known_conflict',
      message: 'Your selected school type does not overlap the structured school types published for this award.',
    });
  } else {
    confirmedEligibilityFacts += 1;
    reasons.push({
      code: 'school_type_matches',
      kind: 'confirmed_match',
      message: 'Your selected school type overlaps a structured school type published for this award.',
    });
  }

  if (award.cycle.status === 'closed') {
    conflicts += 1;
    reasons.push({
      code: 'cycle_closed',
      kind: 'known_conflict',
      message: 'The accepted public cycle state is closed. Check the official source for a future cycle.',
    });
  } else if (award.cycle.status === 'unavailable') {
    conflicts += 1;
    reasons.push({
      code: 'cycle_unavailable',
      kind: 'known_conflict',
      message: 'The accepted public cycle state is unavailable. Check the official source before applying.',
    });
  } else if (award.cycle.status === 'active') {
    reasons.push({
      code: 'cycle_active',
      kind: 'confirmed_match',
      message: 'The accepted public cycle state is open now.',
    });
  } else if (award.cycle.status === 'upcoming') {
    reasons.push({
      code: 'cycle_upcoming',
      kind: 'verification_needed',
      message: 'The accepted public cycle state is upcoming. Confirm its opening date on the official source.',
    });
  } else {
    reasons.push({
      code: 'cycle_not_verified',
      kind: 'verification_needed',
      message: 'Current cycle availability is not verified. This award is not being labeled open.',
    });
  }

  const preferred = answers.preferredApplicationModes.includes(
    award.application.mode as Exclude<ApplicationMode, 'unknown'>,
  );
  if (preferred) {
    reasons.push({
      code: 'preferred_application_mode',
      kind: 'preference',
      message: 'This application format matches an optional preference. Preferences affect order, not eligibility.',
    });
  }

  const decision: MatchDecision = conflicts > 0
    ? 'known_conflict'
    : unknownEligibilityFacts > 0
      ? 'possible_match'
      : 'match';

  return {
    award,
    decision,
    reasons,
    decisionRank: { match: 0, possible_match: 1, known_conflict: 2 }[decision],
    preferenceRank: preferred ? 0 : 1,
    confirmedRank: -confirmedEligibilityFacts,
    amountRank: -(award.amount.maximum ?? award.amount.minimum ?? -1),
  };
}

export function matchStudentAwards(
  awardsValue: readonly StudentAward[],
  answersValue: InterviewAnswers,
): MatchResponse {
  const answers = InterviewAnswersSchema.parse(answersValue);
  const results = awardsValue
    .map((award) => evaluateAward(award, answers))
    .sort((left, right) =>
      left.decisionRank - right.decisionRank
      || left.preferenceRank - right.preferenceRank
      || left.confirmedRank - right.confirmedRank
      || left.amountRank - right.amountRank
      || left.award.name.localeCompare(right.award.name)
      || left.award.publicId.localeCompare(right.award.publicId))
    .map(({ decisionRank: _decisionRank, preferenceRank: _preferenceRank, confirmedRank: _confirmedRank, amountRank: _amountRank, ...result }) => result);

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
