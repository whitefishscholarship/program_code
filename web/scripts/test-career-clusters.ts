import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  CAREER_CHOICES,
  TWO_YEAR_PLAN,
  awardMatchesCareerChoice,
  careerChoiceCount,
  careerChoiceSelected,
  careerEmptyNote,
  careerFitLabels,
  toggleCareerPlan,
} from '../src/lib/careerClusters';
import {
  differentiationGroups,
  differentiationHits,
  emptyDifferentiation,
  legacyFromProfile,
  type DifferentiationProfile,
} from '../src/lib/differentiation';
import { sortByFit } from '../src/lib/studentList';
import { StudentCatalogSchema, type StudentAward } from '../src/lib/studentCatalog';

const catalog = StudentCatalogSchema.parse(JSON.parse(fs.readFileSync('fixtures/r3/catalog-v1.json', 'utf8')).catalog);
const awards = catalog.awards;
const groups = differentiationGroups(awards);
const plans = groups.find((group) => group.id === 'plans');
assert(plans, 'career group missing');

const clusterIds = [
  'engineering', 'computers', 'health', 'trades', 'business', 'education', 'arts', 'law',
  'agriculture', 'transportation', 'hospitality', 'helping', 'communications', 'energy',
];
const aviationIds = ['pilot training', 'aviation maintenance', 'aviation management', 'drone training'];
assert.deepEqual(CAREER_CHOICES.map((choice) => choice.id), ['any', ...clusterIds.slice(0, 10), ...aviationIds, ...clusterIds.slice(10)]);
assert.deepEqual(plans.chips.map((chip) => chip.value), CAREER_CHOICES.map((choice) => choice.id));
assert.equal(plans.chips.some((chip) => chip.value === TWO_YEAR_PLAN), false);
assert.equal(plans.hint.includes('never hides'), true);

for (const chip of plans.chips) {
  assert.equal(chip.count, careerChoiceCount(awards, chip.value), chip.value);
  assert.equal(typeof chip.count, 'number');
  assert(chip.count !== undefined && chip.count >= 0);
}
for (const id of aviationIds) {
  const chip: (typeof plans.chips)[number] | undefined = plans.chips.find((item) => item.value === id);
  const parent: (typeof plans.chips)[number] | undefined = plans.chips.find((item) => item.value === 'transportation');
  assert.equal(chip?.nestUnder, 'transportation', id);
  assert((parent?.count ?? 0) >= (chip?.count ?? 0), id);
}

const zeros = plans.chips.filter((chip) => chip.count === 0);
assert(zeros.length > 0, 'a fixed list must keep paths that no scholarship uses yet');
assert.equal(plans.emptyNote, careerEmptyNote(plans.chips));
assert(plans.emptyNote?.includes('Nothing is hidden'));
assert(plans.emptyNote?.includes('open to any major'));
for (const chip of zeros) assert(plans.emptyNote?.includes(chip.label), chip.label);
for (const chip of plans.chips) {
  if ((chip.count ?? 0) > 0) assert.equal(plans.emptyNote?.includes(chip.label), false, chip.label);
}

const step = fs.readFileSync('src/components/steps/DifferentiationStep.tsx', 'utf8');
const wizard = fs.readFileSync('src/components/InterviewWizard.tsx', 'utf8');
const list = fs.readFileSync('src/components/StudentMatchList.tsx', 'utf8');
assert(step.includes('chip.count'));
assert(step.includes('emptyNote'));
assert(step.includes('Aviation choices inside'));
assert(wizard.includes('plan-two-year-college'));
assert(wizard.includes('it is not a career path'));
assert(list.includes('Every award stays on the list.'));

function profile(plansValues: string[]): DifferentiationProfile {
  return { ...emptyDifferentiation(), plans: plansValues };
}

function careerLabels(award: StudentAward, picked: DifferentiationProfile): string[] {
  return careerFitLabels(award.plans, picked.plans);
}

function visibleCount(picked: DifferentiationProfile): number {
  return sortByFit(awards, (award) => careerLabels(award, picked).length > 0).length;
}

for (const picked of [profile(['any']), profile(['engineering']), profile(['computers']), profile(['STEM']), profile(['transportation', 'any'])]) {
  assert.equal(visibleCount(picked), awards.length, picked.plans.join(','));
}

const anyHits = awards.filter((award) => careerLabels(award, profile(['any'])).length > 0);
assert.equal(anyHits.length, 0);

const engineering = awards.find((award) => (award.plans ?? []).includes('STEM') || (award.plans ?? []).includes('engineering'));
assert(engineering);
assert(differentiationHits(engineering, profile(['engineering'])).includes('Engineering and manufacturing'));
assert(differentiationHits(engineering, profile(['STEM'])).includes('Engineering and manufacturing'));
assert.equal(careerChoiceSelected(['STEM'], 'engineering'), true);
assert.deepEqual(toggleCareerPlan(['STEM'], 'engineering'), []);
assert.deepEqual(toggleCareerPlan([], 'engineering'), ['engineering']);

const pilot = awards.find((award) => (award.plans ?? []).includes('pilot training') && !(award.plans ?? []).includes('transportation'));
assert(pilot);
assert(differentiationHits(pilot, profile(['transportation'])).includes('Transportation and aviation'));
assert(differentiationHits(pilot, profile(['pilot training'])).includes('Pilot'));
assert.equal(differentiationHits(pilot, profile(['drone training'])).includes('Drones'), false);

const transportOnly = awards.find((award) => {
  const tags = award.plans ?? [];
  return tags.includes('transportation') && !tags.some((tag) => aviationIds.includes(tag));
});
assert(transportOnly);
assert.equal(differentiationHits(transportOnly as StudentAward, profile(['pilot training'])).includes('Pilot'), false);
assert(differentiationHits(transportOnly as StudentAward, profile(['transportation'])).includes('Transportation and aviation'));

const publicService = awards.find((award) => (award.plans ?? []).includes('public service') || (award.plans ?? []).includes('law'));
assert(publicService);
assert(differentiationHits(publicService, profile(['law'])).includes('Law, public safety, and government'));
assert(differentiationHits(publicService, profile(['public service'])).includes('Law, public safety, and government'));
assert.equal(legacyFromProfile(profile(['public service'])).selectedCriteria.includes('public_service'), true);
assert.equal(legacyFromProfile(profile(['law'])).selectedCriteria.includes('law'), true);

const openMajor = awards.filter((award) => !awardMatchesCareerChoice(award.plans ?? [], 'engineering') && (award.plans ?? []).every((tag) => !clusterIds.includes(tag) && tag !== 'STEM'));
assert(openMajor.length > 0);
const picked = profile(['engineering']);
const ranked = sortByFit(awards, (award) => careerLabels(award, picked).length > 0);
assert.equal(ranked.length, awards.length);
assert(openMajor.some((award) => ranked.includes(award)));
let lastFit = -1;
let firstOpen = -1;
ranked.forEach((award, index) => {
  if (careerLabels(award, picked).length > 0) lastFit = index;
  else if (firstOpen < 0) firstOpen = index;
});
assert(lastFit >= 0 && firstOpen > lastFit);

console.log('career cluster UI tests passed', JSON.stringify({
  chips: plans.chips.map((chip) => [chip.value, chip.count]),
  empty: zeros.map((chip) => chip.label),
}));
