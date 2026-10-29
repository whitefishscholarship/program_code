import { z } from 'zod';
import type { StudentAward } from './studentCatalog';

export const DIFFERENTIATION_PLACES = ['whitefish', 'flathead', 'montana', 'rural'] as const;
export type DifferentiationPlace = (typeof DIFFERENTIATION_PLACES)[number];

const uniqueValues = (values: readonly string[]) => new Set(values).size === values.length;
const tagList = (max: number) => z.array(z.string().min(1).max(80)).max(max).refine(uniqueValues, 'Choices must not repeat.');

export const DifferentiationProfileSchema = z.strictObject({
  places: z.array(z.enum(DIFFERENTIATION_PLACES)).max(DIFFERENTIATION_PLACES.length).refine(uniqueValues, 'Places must not repeat.'),
  sports: tagList(40),
  heritage: tagList(20),
  faith: tagList(20),
  gender: tagList(10),
  firstGen: z.boolean(),
  familyTies: tagList(20),
  clubs: tagList(40),
  plans: tagList(40),
  health: tagList(20),
  lifeSituation: tagList(20),
});

export type DifferentiationProfile = z.infer<typeof DifferentiationProfileSchema>;

export type DifferentiationChip = {
  field: keyof DifferentiationProfile;
  value: string;
  label: string;
};

export type DifferentiationGroup = {
  id: string;
  title: string;
  hint: string;
  chips: DifferentiationChip[];
};

type ListField = 'sports' | 'clubs' | 'heritage' | 'faith' | 'familyTies' | 'plans' | 'health' | 'lifeSituation' | 'gender';

const LIST_FIELDS: readonly ListField[] = [
  'sports', 'clubs', 'heritage', 'faith', 'familyTies', 'plans', 'health', 'lifeSituation', 'gender',
];

const LABELS: Record<string, string> = {
  whitefish: 'Whitefish',
  flathead: 'Flathead',
  montana: 'Montana',
  rural: 'Rural or small town',
  'student athlete': 'Student athlete',
  golf: 'Golf',
  rodeo: 'Rodeo',
  soccer: 'Soccer',
  track: 'Track',
  wrestling: 'Wrestling',
  employer: 'A parent works for the sponsor',
  military: 'Military family',
  'first responder': 'First responder in the family',
  'electric co-op': 'Electric co-op family',
  'farm bureau': 'Farm Bureau family',
  fraternal: 'Club like the Elks',
  union: 'Union family',
  'credit union': 'Credit union family',
  'lineman family': 'Lineman in the family',
  'pilot training': 'Pilot training',
  'aviation maintenance': 'Fixing airplanes',
  'aviation management': 'Aviation jobs',
  'skilled trades': 'Skilled trades',
  'two-year college': 'Two-year college',
  STEM: 'STEM',
  'drone training': 'Flying drones',
  healthcare: 'Health care',
  'public service': 'Public service',
  agriculture: 'Farming and nature',
  transportation: 'Transportation',
  business: 'Business',
  teaching: 'Teaching',
  law: 'Law',
  arts: 'Art',
  woman: 'Girl or woman',
  nonbinary: 'Nonbinary',
  transgender: 'Transgender',
  'gender-diverse': 'Gender diverse',
  'Native American': 'Native American',
  'Asian or Pacific Islander': 'Asian or Pacific Islander',
  'Hispanic or Latino': 'Hispanic or Latino',
  'Black or African American': 'Black or African American',
  Catholic: 'Catholic',
  Christian: 'Christian',
  Presbyterian: 'Presbyterian',
  Lutheran: 'Lutheran',
  Jewish: 'Jewish',
  'learning disability': 'Learning disability',
  'mental health': 'Mental health',
  ADHD: 'ADHD',
  disability: 'A disability',
  dyslexia: 'Dyslexia',
  autism: 'Autism',
  'foster care': 'Foster care',
  'LGBTQ+': 'LGBTQ+',
  adopted: 'Adopted',
  'hard times': 'Hard times',
  'loss of a parent': 'Lost a parent',
  true: 'First in my family to go to college',
};

export function emptyDifferentiation(): DifferentiationProfile {
  return {
    places: [],
    sports: [],
    heritage: [],
    faith: [],
    gender: [],
    firstGen: false,
    familyTies: [],
    clubs: [],
    plans: [],
    health: [],
    lifeSituation: [],
  };
}

export function chipLabel(value: string): string {
  return LABELS[value] ?? value.replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
}

type TagSource = Pick<StudentAward, 'residencyScope' | 'ruralRule' | 'firstGen' | ListField>;

function presentValues(awards: readonly TagSource[], field: ListField): string[] {
  const found = new Set<string>();
  for (const award of awards) {
    const list = award[field];
    if (!list) continue;
    for (const value of list) found.add(value);
  }
  return [...found].sort((left, right) => chipLabel(left).localeCompare(chipLabel(right)) || left.localeCompare(right));
}

function chipsFor(field: ListField | 'places' | 'firstGen', values: readonly string[]): DifferentiationChip[] {
  return values.map((value) => ({ field, value, label: chipLabel(value) }));
}

/** Chip groups use only tag values that already appear on catalog awards. */
export function differentiationGroups(awards: readonly TagSource[]): DifferentiationGroup[] {
  const scopes = new Set(awards.map((award) => award.residencyScope).filter((scope): scope is NonNullable<typeof scope> => Boolean(scope)));
  const placeValues = DIFFERENTIATION_PLACES.filter((place) => {
    if (place === 'rural') return awards.some((award) => award.ruralRule != null && award.ruralRule !== 'none');
    return scopes.has(place);
  });
  const sports = presentValues(awards, 'sports');
  const heritage = presentValues(awards, 'heritage');
  const faith = presentValues(awards, 'faith');
  const gender = presentValues(awards, 'gender');
  const identity = [
    ...chipsFor('heritage', heritage),
    ...chipsFor('faith', faith),
    ...chipsFor('gender', gender),
  ];
  if (awards.some((award) => award.firstGen === true)) identity.push({ field: 'firstGen', value: 'true', label: chipLabel('true') });
  const health = [
    ...chipsFor('health', presentValues(awards, 'health')),
    ...chipsFor('lifeSituation', presentValues(awards, 'lifeSituation')),
  ];

  return [
    {
      id: 'place',
      title: 'Where you live and go to school',
      hint: 'Whitefish students count as rural. You can leave Rural or small town empty.',
      chips: chipsFor('places', placeValues),
    },
    {
      id: 'sports',
      title: 'Sports and outdoors',
      hint: 'Pick the sports you play.',
      chips: chipsFor('sports', sports),
    },
    {
      id: 'identity',
      title: 'Heritage, faith and identity',
      hint: 'Share only what you want. You can skip this.',
      chips: identity,
    },
    {
      id: 'family',
      title: 'Family ties',
      hint: 'Pick a tie your family has.',
      chips: chipsFor('familyTies', presentValues(awards, 'familyTies')),
    },
    {
      id: 'clubs',
      title: 'Clubs and activities',
      hint: 'Pick clubs you belong to.',
      chips: chipsFor('clubs', presentValues(awards, 'clubs')),
    },
    {
      id: 'plans',
      title: 'Plans and career path',
      hint: 'Pick what you want to study or do for work.',
      chips: chipsFor('plans', presentValues(awards, 'plans')),
    },
    {
      id: 'health',
      title: 'Health and life situation',
      hint: 'Share only what you want. You can skip this.',
      chips: health,
    },
  ];
}

export function chipSelected(profile: DifferentiationProfile, chip: DifferentiationChip): boolean {
  if (chip.field === 'firstGen') return profile.firstGen;
  if (chip.field === 'places') return profile.places.includes(chip.value as DifferentiationPlace);
  const list = profile[chip.field];
  return Array.isArray(list) && list.includes(chip.value);
}

export function toggleDifferentiation(profile: DifferentiationProfile, chip: DifferentiationChip): DifferentiationProfile {
  if (chip.field === 'firstGen') return { ...profile, firstGen: !profile.firstGen };
  if (chip.field === 'places') {
    const value = chip.value as DifferentiationPlace;
    if (!DIFFERENTIATION_PLACES.includes(value)) return profile;
    const places = profile.places.includes(value)
      ? profile.places.filter((item) => item !== value)
      : [...profile.places, value];
    return { ...profile, places };
  }
  const list = profile[chip.field];
  if (!Array.isArray(list)) return profile;
  const next = list.includes(chip.value) ? list.filter((item) => item !== chip.value) : [...list, chip.value];
  return { ...profile, [chip.field]: next };
}

/**
 * Whitefish students are treated as rural. The saved answers stay as the student left them.
 */
export function applyRuralAutoTag(profile: DifferentiationProfile): DifferentiationProfile {
  if (!profile.places.includes('whitefish') || profile.places.includes('rural')) return profile;
  return { ...profile, places: [...profile.places, 'rural'] };
}

export function awardHasRuralRule(award: { ruralRule?: string | null }): boolean {
  return award.ruralRule != null && award.ruralRule !== 'none';
}

/** Rural awards match a Whitefish student even when the rural box is empty. */
export function ruralRuleMatches(award: { ruralRule?: string | null }, profile: DifferentiationProfile): boolean {
  if (!awardHasRuralRule(award)) return false;
  return applyRuralAutoTag(profile).places.includes('rural');
}

type HitAward = Pick<StudentAward, 'residencyScope' | 'ruralRule' | 'firstGen' | ListField>;

export function differentiationHits(award: HitAward, profile: DifferentiationProfile): string[] {
  const effective = applyRuralAutoTag(profile);
  const hits: string[] = [];
  const add = (label: string) => {
    if (!hits.includes(label)) hits.push(label);
  };
  if (profile.places.includes('whitefish') && award.residencyScope === 'whitefish') add(chipLabel('whitefish'));
  if (profile.places.includes('flathead') && award.residencyScope === 'flathead') add(chipLabel('flathead'));
  if (profile.places.includes('montana') && award.residencyScope === 'montana') add(chipLabel('montana'));
  if (awardHasRuralRule(award) && effective.places.includes('rural')) add(chipLabel('rural'));
  for (const field of LIST_FIELDS) {
    const selected = profile[field];
    const values = award[field];
    if (!values) continue;
    for (const value of values) {
      if (selected.includes(value)) add(chipLabel(value));
    }
  }
  if (profile.firstGen && award.firstGen === true) add(chipLabel('true'));
  return hits;
}
