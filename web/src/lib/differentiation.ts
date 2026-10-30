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
  outsideMontana: z.boolean().default(false),
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
  layout?: 'pills' | 'questions';
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
  football: 'Football',
  basketball: 'Basketball',
  volleyball: 'Volleyball',
  'cross country': 'Cross country',
  tennis: 'Tennis',
  swimming: 'Swimming',
  baseball: 'Baseball',
  softball: 'Softball',
  cheer: 'Cheer',
  'speech and debate': 'Are you in speech and debate?',
  drama: 'Are you in drama or theatre?',
  band: 'Are you in band?',
  orchestra: 'Are you in orchestra?',
  choir: 'Are you in choir?',
  chess: 'Are you in a chess club?',
  'student council': 'Are you in student council or a class officer?',
  yearbook: 'Are you on the yearbook staff?',
  FFA: 'Are you in the National FFA Organization (FFA)?',
  NTHS: 'Are you in the National Technical Honor Society (NTHS)?',
  DECA: 'Are you in DECA, the marketing student organization?',
  FBLA: 'Are you in Future Business Leaders of America (FBLA)?',
  BPA: 'Are you in Business Professionals of America (BPA)?',
  FCCLA: 'Are you in Family, Career and Community Leaders of America (FCCLA)?',
  HOSA: 'Are you in HOSA Future Health Professionals?',
  SkillsUSA: 'Are you in SkillsUSA?',
  TSA: 'Are you in the Technology Student Association (TSA)?',
  'National Honor Society': 'Are you in the National Honor Society?',
  'Eagle Scout': 'Are you an Eagle Scout?',
  AEA: 'Are you or a parent a member of the Aircraft Electronics Association (AEA)?',
  AOPA: 'Are you a member of the Aircraft Owners and Pilots Association (AOPA)?',
  NGPA: 'Are you a member of the National Gay Pilots Association (NGPA)?',
  WAI: 'Are you a member of Women in Aviation International (WAI)?',
  LPA: 'Are you a member of Latino Professionals in Aerospace (LPA)?',
  elks: 'Are you or a parent an Elks member?',
  rainbow: 'Are you in the Order of the Rainbow for Girls?',
  'employer:aea-member-company': 'Do you work for an Aircraft Electronics Association member company?',
  'employer:da-davidson': 'Do you or a parent work for D.A. Davidson?',
  'employer:glacier-bancorp': 'Do you or a parent work for Glacier Bancorp?',
  'employer:glacier-restaurant-group': 'Do you or a parent work for Glacier Restaurant Group?',
  'employer:dc-goodman': 'Does a parent work for D.C. Goodman?',
  'employer:fiore': 'Does a parent work for Fiore?',
  'employer:kish-bank': 'Does a parent work for Kish Bank?',
  'employer:mead-westvaco': 'Does a parent work for Mead/Westvaco?',
  rodeo: 'Rodeo',
  soccer: 'Soccer',
  track: 'Track',
  wrestling: 'Wrestling',
  military: 'Military family',
  'first responder': 'First responder in the family',
  'electric co-op': 'Electric co-op family',
  'farm bureau': 'Farm Bureau family',
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
  woman: 'Female',
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
  diabetes: 'Diabetes',
  'foster care': 'Foster care',
  'LGBTQ+': 'LGBTQ+',
  adopted: 'Adopted',
  'hard times': 'Hard times',
  'loss of a parent': 'Lost a parent',
  twins: 'Twins',
  true: 'First in my family to go to college',
};

/** One chip stands in for these catalog club tags. */
export const AVIATION_GROUP_CLUBS = ['AEA', 'AOPA', 'NGPA', 'WAI'] as const;
export const AVIATION_GROUP_VALUE = 'aviation group';

function isAviationClub(value: string): boolean {
  return (AVIATION_GROUP_CLUBS as readonly string[]).includes(value);
}

/** Older answers used one aviation chip. New answers name each group. */
export function aviationGroupSelected(clubs: readonly string[]): boolean {
  return clubs.includes(AVIATION_GROUP_VALUE);
}

export function emptyDifferentiation(): DifferentiationProfile {
  return {
    places: [],
    sports: [],
    heritage: [],
    faith: [],
    gender: [],
    firstGen: false,
    outsideMontana: false,
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

type TagSource = Pick<StudentAward, 'residencyScope' | 'ruralRule' | 'firstGen' | ListField> & {
  name?: string;
  summary?: string | null;
  eligibility?: { audience?: string | null };
};

type TieQuestion = {
  field: 'familyTies';
  value: string;
  group: 'community' | 'employer';
  matches: (award: TagSource) => boolean;
};

function awardBlob(award: TagSource): string {
  return `${award.name ?? ''} ${award.summary ?? ''} ${award.eligibility?.audience ?? ''}`;
}

function tieQuestions(): TieQuestion[] {
  const fraternal = (award: TagSource, pattern: RegExp) => (award.familyTies ?? []).includes('fraternal') && pattern.test(awardBlob(award));
  const employer = (award: TagSource, pattern: RegExp) => (award.familyTies ?? []).includes('employer') && pattern.test(awardBlob(award));
  return [
    { field: 'familyTies', value: 'elks', group: 'community', matches: (award) => fraternal(award, /elk/i) },
    { field: 'familyTies', value: 'rainbow', group: 'community', matches: (award) => fraternal(award, /rainbow/i) },
    { field: 'familyTies', value: 'employer:aea-member-company', group: 'employer', matches: (award) => employer(award, /aea member company/i) },
    { field: 'familyTies', value: 'employer:da-davidson', group: 'employer', matches: (award) => employer(award, /d\.a\. davidson/i) },
    { field: 'familyTies', value: 'employer:glacier-bancorp', group: 'employer', matches: (award) => employer(award, /glacier bancorp/i) },
    { field: 'familyTies', value: 'employer:glacier-restaurant-group', group: 'employer', matches: (award) => employer(award, /glacier restaurant group/i) },
    { field: 'familyTies', value: 'employer:dc-goodman', group: 'employer', matches: (award) => employer(award, /d\.c\. goodman/i) },
    { field: 'familyTies', value: 'employer:fiore', group: 'employer', matches: (award) => employer(award, /fiore/i) },
    { field: 'familyTies', value: 'employer:kish-bank', group: 'employer', matches: (award) => employer(award, /kish bank/i) },
    { field: 'familyTies', value: 'employer:mead-westvaco', group: 'employer', matches: (award) => employer(award, /mead\/westvaco/i) },
  ];
}

function clubBucket(value: string): 'school' | 'community' | 'aviation' {
  if (value === 'LPA' || isAviationClub(value)) return 'aviation';
  if (value === 'Eagle Scout') return 'community';
  return 'school';
}

function sortChips(chips: DifferentiationChip[]): DifferentiationChip[] {
  return chips.sort((left, right) => left.label.localeCompare(right.label) || left.value.localeCompare(right.value));
}

function clubQuestionChips(awards: readonly TagSource[], bucket: 'school' | 'community' | 'aviation'): DifferentiationChip[] {
  return chipsFor('clubs', presentValues(awards, 'clubs').filter((value) => clubBucket(value) === bucket));
}

function tieQuestionChips(awards: readonly TagSource[], group: 'community' | 'employer'): DifferentiationChip[] {
  return tieQuestions()
    .filter((question) => question.group === group && awards.some((award) => question.matches(award)))
    .map((question) => ({ field: question.field, value: question.value, label: chipLabel(question.value) }));
}

const HIDDEN_FAMILY = new Set(['employer', 'fraternal']);

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
  const sports = presentValues(awards, 'sports');
  const heritage = presentValues(awards, 'heritage');
  const faith = presentValues(awards, 'faith');
  const gender = presentValues(awards, 'gender');
  const identity = [
    ...chipsFor('heritage', heritage),
    ...chipsFor('faith', faith),
    ...chipsFor('gender', gender),
  ];
  const firstGen = awards.some((award) => award.firstGen === true)
    ? [{ field: 'firstGen' as const, value: 'true', label: chipLabel('true') }]
    : [];
  const health = [
    ...chipsFor('health', presentValues(awards, 'health')),
    ...chipsFor('lifeSituation', presentValues(awards, 'lifeSituation')),
  ];
  const placeOrder = ['montana', 'whitefish', 'flathead', 'rural'] as const;
  const places = placeOrder.filter((place) => place === 'rural'
    ? awards.some((award) => award.ruralRule != null && award.ruralRule !== 'none')
    : awards.some((award) => award.residencyScope === place));

  const ordered: DifferentiationGroup[] = [
    {
      id: 'where-you-live',
      title: 'Where you live',
      hint: 'Many scholarships are for students in Montana. Pick a place if you want. If you live outside Montana, say so. If you skip this, we still count you as a Whitefish-area student.',
      chips: [
        ...chipsFor('places', places),
        { field: 'outsideMontana', value: 'true', label: 'I live outside Montana' } satisfies DifferentiationChip,
      ],
    },
    {
      id: 'plans',
      title: 'Plans and career path',
      hint: 'Pick what you want to study or do for work.',
      chips: chipsFor('plans', presentValues(awards, 'plans')),
    },
    {
      id: 'first-gen',
      title: 'First in your family',
      hint: 'Some scholarships are for students who would be the first in their family to go to college.',
      chips: firstGen,
    },
    {
      id: 'identity',
      title: 'Heritage, faith and identity',
      hint: 'Share only what you want. You can skip this.',
      chips: identity,
    },
    {
      id: 'sports',
      title: 'Sports and outdoors',
      hint: 'Pick the sports you play.',
      chips: chipsFor('sports', sports),
    },
    {
      id: 'family',
      title: 'Family ties',
      hint: 'Pick a tie your family has.',
      chips: chipsFor('familyTies', presentValues(awards, 'familyTies').filter((value) => !HIDDEN_FAMILY.has(value))),
    },
    {
      id: 'health',
      title: 'Health and life situation',
      hint: 'Share only what you want. You can skip this.',
      chips: health,
    },
    {
      id: 'community-orgs',
      title: 'Community and fraternal organizations',
      hint: 'Check one only if you or your family belong.',
      layout: 'questions',
      chips: sortChips([...clubQuestionChips(awards, 'community'), ...tieQuestionChips(awards, 'community')]),
    },
    {
      id: 'school-clubs',
      title: 'School clubs',
      hint: 'Check a club only if you are in it.',
      layout: 'questions',
      chips: sortChips(clubQuestionChips(awards, 'school')),
    },
    {
      id: 'aviation-groups',
      title: 'Aviation groups',
      hint: 'Check a group only if you are a member.',
      layout: 'questions',
      chips: sortChips(clubQuestionChips(awards, 'aviation')),
    },
    {
      id: 'employers',
      title: 'Where a parent works',
      hint: 'Check a workplace only if the question fits your family.',
      layout: 'questions',
      chips: sortChips(tieQuestionChips(awards, 'employer')),
    },
  ];
  return ordered.filter((group) => group.chips.length > 0);
}

export function chipSelected(profile: DifferentiationProfile, chip: DifferentiationChip): boolean {
  if (chip.field === 'firstGen') return profile.firstGen;
  if (chip.field === 'outsideMontana') return profile.outsideMontana;
  if (chip.field === 'places') return profile.places.includes(chip.value as DifferentiationPlace);
  const list = profile[chip.field];
  return Array.isArray(list) && list.includes(chip.value);
}

export function toggleDifferentiation(profile: DifferentiationProfile, chip: DifferentiationChip): DifferentiationProfile {
  if (chip.field === 'firstGen') return { ...profile, firstGen: !profile.firstGen };
  if (chip.field === 'outsideMontana') return { ...profile, outsideMontana: !profile.outsideMontana };
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
 * Every student is a Whitefish student. Local places are added only while matching.
 * The saved answers stay as the student left them.
 */
export function applyRuralAutoTag(profile: DifferentiationProfile): DifferentiationProfile {
  if (profile.outsideMontana) return profile;
  const missing = DIFFERENTIATION_PLACES.filter((place) => !profile.places.includes(place));
  if (missing.length === 0) return profile;
  return { ...profile, places: [...profile.places, ...missing] };
}

export function awardHasRuralRule(award: { ruralRule?: string | null }): boolean {
  return award.ruralRule != null && award.ruralRule !== 'none';
}

/** Rural awards match every student. The place answers are applied in the background. */
export function ruralRuleMatches(award: { ruralRule?: string | null }, profile: DifferentiationProfile): boolean {
  if (!awardHasRuralRule(award)) return false;
  return applyRuralAutoTag(profile).places.includes('rural');
}

type HitAward = TagSource;

function tieQuestionSelected(profile: DifferentiationProfile, question: TieQuestion): boolean {
  if (profile.familyTies.includes(question.value)) return true;
  if (question.value.startsWith('employer:') && profile.familyTies.includes('employer')) return true;
  return (question.value === 'elks' || question.value === 'rainbow') && profile.familyTies.includes('fraternal');
}

export function differentiationHits(award: HitAward, profile: DifferentiationProfile): string[] {
  const effective = applyRuralAutoTag(profile);
  const hits: string[] = [];
  const add = (label: string) => {
    if (!hits.includes(label)) hits.push(label);
  };
  if (effective.places.includes('whitefish') && award.residencyScope === 'whitefish') add(chipLabel('whitefish'));
  if (effective.places.includes('flathead') && award.residencyScope === 'flathead') add(chipLabel('flathead'));
  if (effective.places.includes('montana') && award.residencyScope === 'montana') add(chipLabel('montana'));
  if (awardHasRuralRule(award) && effective.places.includes('rural')) add(chipLabel('rural'));
  const legacyAviation = profile.clubs.includes(AVIATION_GROUP_VALUE);
  for (const field of LIST_FIELDS) {
    const selected = profile[field];
    const values = award[field];
    if (!values) continue;
    for (const value of values) {
      if (field === 'familyTies' && HIDDEN_FAMILY.has(value)) continue;
      if (selected.includes(value) || (legacyAviation && field === 'clubs' && isAviationClub(value))) add(chipLabel(value));
    }
  }
  for (const question of tieQuestions()) {
    if (tieQuestionSelected(profile, question) && question.matches(award)) add(chipLabel(question.value));
  }
  if (profile.firstGen && award.firstGen === true) add(chipLabel('true'));
  return hits;
}

type LegacyChip = { field: keyof DifferentiationProfile; value: string };

/** Old step 4 and 5 questions that ask the same thing as a catalog chip. */
const LEGACY_CHIPS: readonly { kind: 'criterion' | 'discovery' | 'organization'; id: string; chip: LegacyChip }[] = [
  { kind: 'criterion', id: 'aviation_pilot', chip: { field: 'plans', value: 'pilot training' } },
  { kind: 'criterion', id: 'aviation_maintenance', chip: { field: 'plans', value: 'aviation maintenance' } },
  { kind: 'criterion', id: 'aviation_management', chip: { field: 'plans', value: 'aviation management' } },
  { kind: 'criterion', id: 'stem', chip: { field: 'plans', value: 'STEM' } },
  { kind: 'criterion', id: 'healthcare', chip: { field: 'plans', value: 'healthcare' } },
  { kind: 'criterion', id: 'trades', chip: { field: 'plans', value: 'skilled trades' } },
  { kind: 'criterion', id: 'business_finance', chip: { field: 'plans', value: 'business' } },
  { kind: 'criterion', id: 'public_service', chip: { field: 'plans', value: 'public service' } },
  { kind: 'criterion', id: 'law', chip: { field: 'plans', value: 'law' } },
  { kind: 'criterion', id: 'arts_humanities', chip: { field: 'plans', value: 'arts' } },
  { kind: 'criterion', id: 'agriculture_conservation', chip: { field: 'plans', value: 'agriculture' } },
  { kind: 'discovery', id: 'education_teaching', chip: { field: 'plans', value: 'teaching' } },
  { kind: 'criterion', id: 'athletics_sports', chip: { field: 'sports', value: 'student athlete' } },
  { kind: 'criterion', id: 'dyslexia', chip: { field: 'health', value: 'dyslexia' } },
  { kind: 'criterion', id: 'adhd', chip: { field: 'health', value: 'ADHD' } },
  { kind: 'criterion', id: 'autism', chip: { field: 'health', value: 'autism' } },
  { kind: 'criterion', id: 'learning_other', chip: { field: 'health', value: 'learning disability' } },
  { kind: 'criterion', id: 'mental_health', chip: { field: 'health', value: 'mental health' } },
  { kind: 'criterion', id: 'foster_care', chip: { field: 'lifeSituation', value: 'foster care' } },
  { kind: 'criterion', id: 'loss_of_parent', chip: { field: 'lifeSituation', value: 'loss of a parent' } },
  { kind: 'criterion', id: 'overcoming_adversity', chip: { field: 'lifeSituation', value: 'hard times' } },
  { kind: 'criterion', id: 'lgbtqia', chip: { field: 'lifeSituation', value: 'LGBTQ+' } },
  { kind: 'criterion', id: 'first_generation', chip: { field: 'firstGen', value: 'true' } },
  { kind: 'criterion', id: 'native_american', chip: { field: 'heritage', value: 'Native American' } },
  { kind: 'criterion', id: 'asian_pacific_islander', chip: { field: 'heritage', value: 'Asian or Pacific Islander' } },
  { kind: 'criterion', id: 'female', chip: { field: 'gender', value: 'woman' } },
  { kind: 'criterion', id: 'nonbinary', chip: { field: 'gender', value: 'nonbinary' } },
  { kind: 'criterion', id: 'military_veteran', chip: { field: 'familyTies', value: 'military' } },
  { kind: 'criterion', id: 'first_responder', chip: { field: 'familyTies', value: 'first responder' } },
  { kind: 'criterion', id: 'electric_coop', chip: { field: 'familyTies', value: 'electric co-op' } },
  { kind: 'criterion', id: 'credit_union', chip: { field: 'familyTies', value: 'credit union' } },
  { kind: 'criterion', id: 'elks_lodge', chip: { field: 'familyTies', value: 'elks' } },
  { kind: 'criterion', id: 'company_employee', chip: { field: 'familyTies', value: 'employer' } },
  { kind: 'organization', id: 'nths', chip: { field: 'clubs', value: 'NTHS' } },
  { kind: 'organization', id: 'ffa', chip: { field: 'clubs', value: 'FFA' } },
  { kind: 'organization', id: 'bpa', chip: { field: 'clubs', value: 'BPA' } },
  { kind: 'organization', id: 'deca', chip: { field: 'clubs', value: 'DECA' } },
  { kind: 'organization', id: 'fbla', chip: { field: 'clubs', value: 'FBLA' } },
  { kind: 'organization', id: 'fccla', chip: { field: 'clubs', value: 'FCCLA' } },
  { kind: 'organization', id: 'hosa', chip: { field: 'clubs', value: 'HOSA' } },
  { kind: 'organization', id: 'skillsusa', chip: { field: 'clubs', value: 'SkillsUSA' } },
  { kind: 'organization', id: 'tsa', chip: { field: 'clubs', value: 'TSA' } },
];

function bindingSelected(profile: DifferentiationProfile, chip: LegacyChip, id: string): boolean {
  if (id === 'company_employee') return profile.familyTies.includes('employer');
  if (id === 'elks_lodge') return profile.familyTies.includes('elks') || profile.familyTies.includes('fraternal');
  return chipSelected(profile, { ...chip, label: chip.value });
}

/** Turn older saved answers into the chips that replaced those questions. */
export function withLegacySelections(
  profile: DifferentiationProfile,
  selections: { criteria?: readonly string[]; discovery?: readonly string[]; organizations?: readonly string[] },
): DifferentiationProfile {
  const wanted = new Set([...(selections.criteria ?? []), ...(selections.discovery ?? []), ...(selections.organizations ?? [])]);
  let next = profile;
  for (const binding of LEGACY_CHIPS) {
    if (!wanted.has(binding.id) || bindingSelected(next, binding.chip, binding.id)) continue;
    next = toggleDifferentiation(next, { ...binding.chip, label: binding.chip.value });
  }
  return next;
}

/** Chip answers still fill the older match fields those questions used. */
export function legacyFromProfile(profile: DifferentiationProfile): {
  selectedCriteria: string[];
  discoveryInterests: string[];
  studentOrganizations: string[];
} {
  const selectedCriteria: string[] = [];
  const discoveryInterests: string[] = [];
  const studentOrganizations: string[] = [];
  for (const binding of LEGACY_CHIPS) {
    if (!bindingSelected(profile, binding.chip, binding.id)) continue;
    if (binding.kind === 'criterion') selectedCriteria.push(binding.id);
    else if (binding.kind === 'discovery') discoveryInterests.push(binding.id);
    else studentOrganizations.push(binding.id);
  }
  return { selectedCriteria, discoveryInterests, studentOrganizations };
}
