/**
 * Student-facing career paths. The list is fixed. It does not shrink to
 * whatever tags the current catalog happens to carry.
 * Old saved answers use the previous tag ids (STEM, healthcare, teaching, ...).
 * Those ids stay as aliases so a shared link still selects the same path.
 */

export const ANY_MAJOR_ID = 'any';
export const TWO_YEAR_PLAN = 'two-year college';

export type CareerChoice = {
  id: string;
  label: string;
  /** Previous tag ids that mean this same path. */
  aliases: readonly string[];
  /** Extra paths that the broad chip also points out. Aviation sits under transportation. */
  alsoMatches?: readonly string[];
  nestUnder?: string;
};

export const CAREER_CHOICES: readonly CareerChoice[] = [
  { id: ANY_MAJOR_ID, label: "Any major / I'm not sure", aliases: [] },
  { id: 'engineering', label: 'Engineering and manufacturing', aliases: ['STEM'] },
  { id: 'computers', label: 'Computers and technology', aliases: [] },
  { id: 'health', label: 'Health and nursing', aliases: ['healthcare'] },
  { id: 'trades', label: 'Skilled trades and construction', aliases: ['skilled trades'] },
  { id: 'business', label: 'Business', aliases: [] },
  { id: 'education', label: 'Education and teaching', aliases: ['teaching'] },
  { id: 'arts', label: 'Art, music, and design', aliases: [] },
  { id: 'law', label: 'Law, public safety, and government', aliases: ['public service'] },
  { id: 'agriculture', label: 'Agriculture, animals, and natural resources', aliases: [] },
  {
    id: 'transportation',
    label: 'Transportation and aviation',
    aliases: [],
    alsoMatches: ['pilot training', 'aviation maintenance', 'aviation management', 'drone training'],
  },
  { id: 'pilot training', label: 'Pilot', aliases: [], nestUnder: 'transportation' },
  { id: 'aviation maintenance', label: 'Fixing airplanes', aliases: [], nestUnder: 'transportation' },
  { id: 'aviation management', label: 'Aviation jobs', aliases: [], nestUnder: 'transportation' },
  { id: 'drone training', label: 'Drones', aliases: [], nestUnder: 'transportation' },
  { id: 'hospitality', label: 'Hospitality, food, and tourism', aliases: [] },
  { id: 'helping', label: 'Helping people', aliases: [] },
  { id: 'communications', label: 'Communications and media', aliases: [] },
  { id: 'energy', label: 'Energy and utilities', aliases: [] },
];

const byId = new Map(CAREER_CHOICES.map((choice) => [choice.id, choice]));
const aliasToId = new Map<string, string>();
for (const choice of CAREER_CHOICES) {
  aliasToId.set(choice.id, choice.id);
  for (const alias of choice.aliases) aliasToId.set(alias, choice.id);
}

export function careerChoiceById(id: string): CareerChoice | undefined {
  return byId.get(id);
}

/** Map a stored tag or an old alias to the chip id. Two-year college is not a career path. */
export function canonicalCareerChoice(value: string): string | null {
  if (value === ANY_MAJOR_ID || value === TWO_YEAR_PLAN) return value;
  return aliasToId.get(value) ?? null;
}

export function careerChoiceLabel(value: string): string {
  const key = canonicalCareerChoice(value);
  if (key === TWO_YEAR_PLAN) return 'Two-year program';
  return (key ? byId.get(key)?.label : undefined) ?? value;
}

export function careerChoiceSelected(plans: readonly string[], value: string): boolean {
  if (value === TWO_YEAR_PLAN) return plans.includes(TWO_YEAR_PLAN);
  const key = canonicalCareerChoice(value);
  if (!key) return plans.includes(value);
  return plans.some((plan) => canonicalCareerChoice(plan) === key);
}

type PlanAward = { plans?: readonly string[] | null };

function awardTags(award: PlanAward): readonly string[] {
  return award.plans ?? [];
}

/** A career chip matches an award when the award carries that path or an old alias. */
export function awardMatchesCareerChoice(tags: readonly string[], choice: string): boolean {
  const key = canonicalCareerChoice(choice);
  if (!key || key === ANY_MAJOR_ID || key === TWO_YEAR_PLAN) return false;
  const definition = byId.get(key);
  if (!definition) return false;
  const accepted = new Set([key, ...(definition.alsoMatches ?? [])]);
  return tags.some((tag) => {
    const canonical = canonicalCareerChoice(tag);
    return canonical !== null && accepted.has(canonical);
  });
}

export function awardHasCareerLimit(tags: readonly string[]): boolean {
  return tags.some((tag) => {
    const key = canonicalCareerChoice(tag);
    return key !== null && key !== ANY_MAJOR_ID && key !== TWO_YEAR_PLAN;
  });
}

export function careerChoiceCount(awards: readonly PlanAward[], choice: string): number {
  if (choice === ANY_MAJOR_ID) return awards.filter((award) => !awardHasCareerLimit(awardTags(award))).length;
  if (choice === TWO_YEAR_PLAN) return awards.filter((award) => awardTags(award).includes(TWO_YEAR_PLAN)).length;
  return awards.filter((award) => awardMatchesCareerChoice(awardTags(award), choice)).length;
}

export function toggleCareerPlan(plans: readonly string[], value: string): string[] {
  const selected = careerChoiceSelected(plans, value);
  if (value === TWO_YEAR_PLAN || canonicalCareerChoice(value) === null) {
    return selected ? plans.filter((plan) => plan !== value) : [...plans, value];
  }
  const key = canonicalCareerChoice(value) as string;
  if (selected) return plans.filter((plan) => canonicalCareerChoice(plan) !== key);
  return [...plans, key];
}

/** Fit labels for the paths the student picked. "Any major" does not promote or hide awards. */
export function careerFitLabels(tags: readonly string[] | null | undefined, plans: readonly string[]): string[] {
  const stored = tags ?? [];
  const labels: string[] = [];
  for (const choice of plans) {
    if (choice === ANY_MAJOR_ID) continue;
    if (choice === TWO_YEAR_PLAN) {
      if (stored.includes(TWO_YEAR_PLAN)) labels.push(careerChoiceLabel(TWO_YEAR_PLAN));
      continue;
    }
    if (!awardMatchesCareerChoice(stored, choice)) continue;
    const label = careerChoiceLabel(choice);
    if (!labels.includes(label)) labels.push(label);
  }
  return labels;
}

export function careerEmptyNote(chips: readonly { value: string; label: string; count?: number }[]): string | null {
  const missing = chips.filter((chip) => chip.count === 0 && chip.value !== ANY_MAJOR_ID);
  if (missing.length === 0) return null;
  return `No scholarship in this list is limited to ${joinLabels(missing.map((chip) => chip.label))} yet. Nothing is hidden. Scholarships open to any major are still here.`;
}

function joinLabels(labels: readonly string[]): string {
  if (labels.length <= 1) return labels[0] ?? '';
  if (labels.length === 2) return `${labels[0]} or ${labels[1]}`;
  return `${labels.slice(0, -1).join(', ')}, or ${labels[labels.length - 1]}`;
}
