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

const MATCH_FACT_AUTHORITIES = [
  'accepted_public_evidence',
  'synthetic_matrix_fixture',
] as const;

const uniqueValues = (values: readonly string[]) => new Set(values).size === values.length;
const factAuthority = z.enum(MATCH_FACT_AUTHORITIES);

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

export const AcceptedAwardMatchFactsSchema = z.strictObject({
  awardPublicId: z.string().regex(/^award-[a-f0-9]{12}$/),
  minimumGpa: z.strictObject({ value: z.number().finite().min(0).max(4), authority: factAuthority }).nullable(),
  schoolTypes: z.strictObject({
    values: z.array(z.enum(INTERVIEW_SCHOOL_TYPES)).min(1).max(INTERVIEW_SCHOOL_TYPES.length).refine(uniqueValues),
    authority: factAuthority,
  }).nullable(),
  cycleStatus: z.strictObject({
    value: z.enum(['active', 'upcoming', 'closed', 'unavailable']),
    authority: factAuthority,
  }).nullable(),
  applicationMode: z.strictObject({
    value: z.enum(INTERVIEW_APPLICATION_MODES),
    authority: factAuthority,
  }).nullable(),
  eligibilityDimensionsComplete: z.strictObject({
    value: z.literal(true),
    authority: factAuthority,
  }).nullable(),
});

export type InterviewAnswers = z.infer<typeof InterviewAnswersSchema>;
export type AcceptedAwardMatchFacts = z.infer<typeof AcceptedAwardMatchFactsSchema>;
export type AcceptedMatchFactsByAwardId = Readonly<Record<string, AcceptedAwardMatchFacts>>;
export type MatchDecision = 'match' | 'possible_match' | 'known_conflict';

export const PUBLIC_MATCH_REASON_FIELDS = ['code', 'kind', 'message'] as const;
export const PUBLIC_MATCH_RESULT_FIELDS = ['award', 'decision', 'reasons'] as const;
export const PUBLIC_MATCH_RESPONSE_FIELDS = ['counts', 'results'] as const;

export type MatchReason = {
  code:
    | 'gpa_meets_minimum'
    | 'gpa_below_minimum'
    | 'gpa_not_accepted'
    | 'school_type_matches'
    | 'school_type_conflict'
    | 'school_type_not_accepted'
    | 'cycle_active'
    | 'cycle_upcoming'
    | 'cycle_closed'
    | 'cycle_unavailable'
    | 'cycle_not_verified'
    | 'eligibility_dimensions_accepted'
    | 'eligibility_not_fully_modeled'
    | 'preferred_application_mode'
    | 'application_mode_not_accepted';
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
};

function sorted(values: readonly string[]): string[] {
  return [...values].sort((left, right) => left.localeCompare(right));
}

function validatedFacts(
  award: StudentAward,
  factsValue: AcceptedAwardMatchFacts | undefined,
): AcceptedAwardMatchFacts | null {
  if (!factsValue) return null;
  const facts = AcceptedAwardMatchFactsSchema.parse(factsValue);
  if (facts.awardPublicId !== award.publicId) throw new Error('Accepted match facts target the wrong award.');
  if (facts.minimumGpa && facts.minimumGpa.value !== award.eligibility.minimumGpa) {
    throw new Error('Accepted minimum-GPA fact does not match the public award.');
  }
  if (facts.schoolTypes && JSON.stringify(sorted(facts.schoolTypes.values)) !== JSON.stringify(sorted(award.eligibility.schoolTypes))) {
    throw new Error('Accepted school-type facts do not match the public award.');
  }
  if (facts.cycleStatus && facts.cycleStatus.value !== award.cycle.status) {
    throw new Error('Accepted cycle-status fact does not match the public award.');
  }
  if (facts.applicationMode && facts.applicationMode.value !== award.application.mode) {
    throw new Error('Accepted application-mode fact does not match the public award.');
  }
  return facts;
}

function evaluateAward(
  awardValue: StudentAward,
  answersValue: InterviewAnswers,
  factsValue: AcceptedAwardMatchFacts | undefined,
): RankedResult {
  const award = StudentAwardSchema.parse(awardValue);
  const answers = InterviewAnswersSchema.parse(answersValue);
  const facts = validatedFacts(award, factsValue);
  const reasons: MatchReason[] = [];
  let conflicts = 0;
  let unknownEligibilityFacts = 0;
  let confirmedEligibilityFacts = 0;

  if (!facts?.minimumGpa) {
    unknownEligibilityFacts += 1;
    reasons.push({
      code: 'gpa_not_accepted',
      kind: 'verification_needed',
      message: 'P8R has no accepted field-specific GPA evidence it can use for matching this award. Verify the official source.',
    });
  } else if (answers.gpa < facts.minimumGpa.value) {
    conflicts += 1;
    reasons.push({
      code: 'gpa_below_minimum',
      kind: 'known_conflict',
      message: 'Your GPA is below the accepted structured minimum GPA for this award.',
    });
  } else {
    confirmedEligibilityFacts += 1;
    reasons.push({
      code: 'gpa_meets_minimum',
      kind: 'confirmed_match',
      message: 'Your GPA meets the accepted structured minimum GPA for this award.',
    });
  }

  if (!facts?.schoolTypes) {
    unknownEligibilityFacts += 1;
    reasons.push({
      code: 'school_type_not_accepted',
      kind: 'verification_needed',
      message: 'P8R has no accepted field-specific school-type evidence it can use for matching this award. Verify the official source.',
    });
  } else if (!facts.schoolTypes.values.some((schoolType) => answers.schoolTypes.includes(schoolType))) {
    conflicts += 1;
    reasons.push({
      code: 'school_type_conflict',
      kind: 'known_conflict',
      message: 'Your selected school type does not overlap the accepted structured school types for this award.',
    });
  } else {
    confirmedEligibilityFacts += 1;
    reasons.push({
      code: 'school_type_matches',
      kind: 'confirmed_match',
      message: 'Your selected school type overlaps an accepted structured school type for this award.',
    });
  }

  const acceptedCycle = facts?.cycleStatus?.value;
  if (acceptedCycle === 'closed') {
    conflicts += 1;
    reasons.push({
      code: 'cycle_closed',
      kind: 'known_conflict',
      message: 'The accepted public cycle state is closed. Check the official source for a future cycle.',
    });
  } else if (acceptedCycle === 'unavailable') {
    conflicts += 1;
    reasons.push({
      code: 'cycle_unavailable',
      kind: 'known_conflict',
      message: 'The accepted public cycle state is unavailable. Check the official source before applying.',
    });
  } else if (acceptedCycle === 'active') {
    reasons.push({
      code: 'cycle_active',
      kind: 'confirmed_match',
      message: 'The accepted public cycle state is open now.',
    });
  } else if (acceptedCycle === 'upcoming') {
    unknownEligibilityFacts += 1;
    reasons.push({
      code: 'cycle_upcoming',
      kind: 'verification_needed',
      message: 'The accepted public cycle state is upcoming. Confirm its opening date on the official source.',
    });
  } else {
    unknownEligibilityFacts += 1;
    reasons.push({
      code: 'cycle_not_verified',
      kind: 'verification_needed',
      message: 'Current cycle availability is not verified. This award is not being labeled open.',
    });
  }

  if (facts?.eligibilityDimensionsComplete) {
    confirmedEligibilityFacts += 1;
    reasons.push({
      code: 'eligibility_dimensions_accepted',
      kind: 'confirmed_match',
      message: 'The accepted evidence marks the modeled eligibility dimensions complete for this synthetic or reviewed fact set.',
    });
  } else {
    unknownEligibilityFacts += 1;
    reasons.push({
      code: 'eligibility_not_fully_modeled',
      kind: 'verification_needed',
      message: 'Other eligibility requirements may not be fully modeled. Verify audience, focus, residence, identity, health, hardship, affiliation, and other requirements on the official source.',
    });
  }

  const acceptedApplicationMode = facts?.applicationMode?.value;
  const preferred = acceptedApplicationMode !== undefined
    && answers.preferredApplicationModes.includes(acceptedApplicationMode as Exclude<ApplicationMode, 'unknown'>);
  if (preferred) {
    reasons.push({
      code: 'preferred_application_mode',
      kind: 'preference',
      message: 'This accepted application format matches an optional preference. Preferences affect order, not eligibility.',
    });
  } else if (answers.preferredApplicationModes.length > 0 && !acceptedApplicationMode) {
    reasons.push({
      code: 'application_mode_not_accepted',
      kind: 'verification_needed',
      message: 'This application format is not backed by accepted field-specific evidence, so your optional preference did not affect its rank.',
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
  };
}

export function buildSyntheticMatrixMatchFacts(
  awards: readonly StudentAward[],
): AcceptedMatchFactsByAwardId {
  return Object.fromEntries(awards.map((awardValue) => {
    const award = StudentAwardSchema.parse(awardValue);
    const authority = 'synthetic_matrix_fixture' as const;
    return [award.publicId, AcceptedAwardMatchFactsSchema.parse({
      awardPublicId: award.publicId,
      minimumGpa: award.eligibility.minimumGpa === null ? null : { value: award.eligibility.minimumGpa, authority },
      schoolTypes: award.eligibility.schoolTypes.length === 0 ? null : { values: award.eligibility.schoolTypes, authority },
      cycleStatus: award.cycle.status === 'unknown' ? null : { value: award.cycle.status, authority },
      applicationMode: award.application.mode === 'unknown' ? null : { value: award.application.mode, authority },
      eligibilityDimensionsComplete: { value: true, authority },
    })];
  }));
}

export function matchStudentAwards(
  awardsValue: readonly StudentAward[],
  answersValue: InterviewAnswers,
  acceptedFactsByAwardId: AcceptedMatchFactsByAwardId = {},
): MatchResponse {
  const answers = InterviewAnswersSchema.parse(answersValue);
  const results = awardsValue
    .map((award) => evaluateAward(award, answers, acceptedFactsByAwardId[award.publicId]))
    .sort((left, right) =>
      left.decisionRank - right.decisionRank
      || left.preferenceRank - right.preferenceRank
      || left.confirmedRank - right.confirmedRank
      || left.award.name.localeCompare(right.award.name)
      || left.award.publicId.localeCompare(right.award.publicId))
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
