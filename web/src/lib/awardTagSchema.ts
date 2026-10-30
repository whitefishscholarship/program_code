import { z } from 'zod';

export const RESIDENCY_SCOPES = ['whitefish', 'flathead', 'montana', 'regional', 'national'] as const;
export const RURAL_RULES = ['none', 'nonmetro-county', 'nces-rural', 'nces-town-or-rural', 'class-bc', 'service-area'] as const;

export const AWARD_TAG_KEYS = [
  'residencyScope',
  'poolLevel',
  'competitionScore',
  'poolReason',
  'ruralRule',
  'sports',
  'clubs',
  'heritage',
  'faith',
  'familyTies',
  'plans',
  'health',
  'lifeSituation',
  'gender',
  'firstGen',
  'needBased',
  'essayRequired',
  'renewable',
  'tagConfirmedBy',
] as const;

export type AwardTagKey = (typeof AWARD_TAG_KEYS)[number];
export type ResidencyScope = (typeof RESIDENCY_SCOPES)[number];
export type RuralRule = (typeof RURAL_RULES)[number];
export type PoolLevel = 1 | 2 | 3 | 4 | 5 | 6;

const tagList = z.array(z.string().min(1)).nullable();

export const awardTagShape = {
  residencyScope: z.enum(RESIDENCY_SCOPES).nullable(),
  poolLevel: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(6)]).nullable(),
  competitionScore: z.number().int().min(0).max(100).nullable(),
  poolReason: z.string().min(1).max(280),
  ruralRule: z.enum(RURAL_RULES).nullable(),
  sports: tagList,
  clubs: tagList,
  heritage: tagList,
  faith: tagList,
  familyTies: tagList,
  plans: tagList,
  health: tagList,
  lifeSituation: tagList,
  gender: tagList,
  firstGen: z.boolean().nullable(),
  needBased: z.boolean().nullable(),
  essayRequired: z.boolean().nullable(),
  renewable: z.boolean().nullable(),
  tagConfirmedBy: z.literal('derived'),
};

export const AwardTagsSchema = z.object(awardTagShape).strict();
export type AwardTags = z.infer<typeof AwardTagsSchema>;

export const optionalAwardTagShape = {
  residencyScope: awardTagShape.residencyScope.optional(),
  poolLevel: awardTagShape.poolLevel.optional(),
  competitionScore: awardTagShape.competitionScore.optional(),
  poolReason: awardTagShape.poolReason.optional(),
  ruralRule: awardTagShape.ruralRule.optional(),
  sports: awardTagShape.sports.optional(),
  clubs: awardTagShape.clubs.optional(),
  heritage: awardTagShape.heritage.optional(),
  faith: awardTagShape.faith.optional(),
  familyTies: awardTagShape.familyTies.optional(),
  plans: awardTagShape.plans.optional(),
  health: awardTagShape.health.optional(),
  lifeSituation: awardTagShape.lifeSituation.optional(),
  gender: awardTagShape.gender.optional(),
  firstGen: awardTagShape.firstGen.optional(),
  needBased: awardTagShape.needBased.optional(),
  essayRequired: awardTagShape.essayRequired.optional(),
  renewable: awardTagShape.renewable.optional(),
  tagConfirmedBy: awardTagShape.tagConfirmedBy.optional(),
};
