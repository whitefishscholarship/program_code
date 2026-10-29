import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  applyRuralAutoTag,
  differentiationGroups,
  differentiationHits,
  emptyDifferentiation,
  ruralRuleMatches,
  type DifferentiationProfile,
} from '../src/lib/differentiation';
import { InterviewAnswersSchema } from '../src/lib/interviewMatcher';
import { serializeAwardDeadlineCalendar } from '../src/lib/studentExport';
import { decodeStudentLink, encodeStudentLink } from '../src/lib/studentLink';
import { poolExplanation, RULES_NOT_POSTED, sortStudentAwards } from '../src/lib/studentList';
import { StudentAwardSchema, StudentCatalogSchema, type StudentAward } from '../src/lib/studentCatalog';

const now = new Date(2026, 9, 28);
const catalog = StudentCatalogSchema.parse(JSON.parse(fs.readFileSync('fixtures/r3/catalog-v1.json', 'utf8')).catalog);

function award(overrides: Partial<StudentAward> & Pick<StudentAward, 'publicId' | 'name'>): StudentAward {
  const { amount, eligibility, cycle, application, ...rest } = overrides;
  return StudentAwardSchema.parse({
    summary: 'A short summary.',
    amount: { label: '$1,000', minimum: 1000, maximum: 1000, currency: 'USD', state: 'known', ...amount },
    eligibility: { audience: 'Students', minimumGpa: null, schoolTypes: [], focus: null, ...eligibility },
    cycle: { status: 'unknown', label: 'Availability not verified', year: null, opens: null, closes: null, recurrence: 'unknown', ...cycle },
    application: { mode: 'direct_per_award', label: 'Separate application for this award', url: 'https://example.com/apply', groupPublicId: null, supplements: 'unknown', ...application },
    sourcePublicIds: ['source-aaaaaaaaaaaa'],
    verification: { status: 'verified', lastChecked: '2026-10-28', sourceUrl: 'https://example.com/open', openStatus: 'open_now', deadline: 'December 15, 2026' },
    ...rest,
  });
}

const tight = award({
  publicId: 'award-aaaaaaaaaaa1',
  name: 'Tight Local',
  residencyScope: 'whitefish',
  poolLevel: 1,
  competitionScore: 10,
  poolReason: 'Only Whitefish High School students can apply.',
  ruralRule: 'none',
});
const local = award({
  publicId: 'award-aaaaaaaaaaa2',
  name: 'Local',
  residencyScope: 'whitefish',
  poolLevel: 1,
  competitionScore: 16,
  poolReason: 'Only Whitefish High School students can apply.',
  ruralRule: 'none',
});
const county = award({
  publicId: 'award-aaaaaaaaaaa3',
  name: 'County',
  residencyScope: 'flathead',
  poolLevel: 2,
  competitionScore: 22,
  poolReason: 'Only Flathead County students can apply.',
  ruralRule: 'service-area',
});
const state = award({
  publicId: 'award-aaaaaaaaaaa4',
  name: 'State',
  residencyScope: 'montana',
  poolLevel: 4,
  competitionScore: 55,
  poolReason: 'Montana students can apply.',
  ruralRule: 'none',
});
const national = award({
  publicId: 'award-aaaaaaaaaaa5',
  name: 'National',
  residencyScope: 'national',
  poolLevel: 6,
  competitionScore: 90,
  poolReason: 'Open to students across the United States.',
  ruralRule: 'none',
});
const unposted = award({
  publicId: 'award-aaaaaaaaaaa6',
  name: 'Unposted',
  residencyScope: null,
  poolLevel: null,
  competitionScore: 1,
  poolReason: 'The page does not say the place.',
  ruralRule: null,
});
const levelMissing = award({
  publicId: 'award-aaaaaaaaaaa7',
  name: 'Level Missing',
  residencyScope: 'national',
  poolLevel: null,
  competitionScore: 1,
  poolReason: 'Open to students across the United States.',
  ruralRule: 'none',
});

const byPool = sortStudentAwards([national, unposted, state, local, levelMissing, county, tight], 'pool', now).map((item) => item.name);
assert.deepEqual(byPool, ['Tight Local', 'Local', 'County', 'State', 'National', 'Level Missing', 'Unposted']);
assert.equal(poolExplanation(unposted), RULES_NOT_POSTED);
assert.equal(poolExplanation(levelMissing), RULES_NOT_POSTED);
assert.equal(poolExplanation(tight), 'Only Whitefish High School students can apply.');
assert.equal(RULES_NOT_POSTED, 'Rules not posted yet');

const whitefish: DifferentiationProfile = { ...emptyDifferentiation(), places: ['whitefish'] };
const flathead: DifferentiationProfile = { ...emptyDifferentiation(), places: ['flathead'] };
const montana: DifferentiationProfile = { ...emptyDifferentiation(), places: ['montana'] };
const rural: DifferentiationProfile = { ...emptyDifferentiation(), places: ['rural'] };
const tagged = applyRuralAutoTag(whitefish);
assert.notEqual(tagged, whitefish);
assert.deepEqual(whitefish.places, ['whitefish']);
assert.deepEqual(tagged.places, ['whitefish', 'rural']);
assert.equal(applyRuralAutoTag(tagged), tagged);

assert.equal(ruralRuleMatches(county, whitefish), true);
assert.equal(ruralRuleMatches(county, rural), true);
assert.equal(ruralRuleMatches(county, flathead), false);
assert.equal(ruralRuleMatches(county, montana), false);
assert.equal(ruralRuleMatches(county, emptyDifferentiation()), false);
assert.equal(ruralRuleMatches(tight, whitefish), false);
assert.equal(ruralRuleMatches({ ruralRule: null }, whitefish), false);
assert.deepEqual(differentiationHits(county, whitefish), ['Rural or small town']);
assert.deepEqual(differentiationHits(county, flathead), ['Flathead']);
assert.deepEqual(differentiationHits(tight, whitefish), ['Whitefish']);

const groups = differentiationGroups(catalog.awards);
assert.deepEqual(groups.map((group) => group.title), [
  'Where you live and go to school',
  'Sports and outdoors',
  'Heritage, faith and identity',
  'Family ties',
  'Clubs and activities',
  'Plans and career path',
  'Health and life situation',
]);
const sports = groups.find((group) => group.id === 'sports')?.chips.map((chip) => chip.value) ?? [];
assert.deepEqual(sports, ['golf', 'rodeo', 'soccer', 'student athlete', 'track', 'wrestling']);
assert.equal(sports.includes('skiing'), false);
assert.equal(sports.includes('mountain biking'), false);
for (const group of groups) {
  assert(group.chips.length > 0, group.title);
  assert.equal(/[—–]/.test(group.title + group.hint), false);
  assert.equal(/eligibility/i.test(group.hint), false);
  for (const chip of group.chips) {
    assert.equal(/[—–]/.test(chip.label), false);
    const field = chip.field;
    if (field === 'places' && chip.value === 'rural') {
      assert(catalog.awards.some((item) => item.ruralRule != null && item.ruralRule !== 'none'));
    } else if (field === 'places') {
      assert(catalog.awards.some((item) => item.residencyScope === chip.value));
    } else if (field === 'firstGen') {
      assert(catalog.awards.some((item) => item.firstGen === true));
    } else {
      assert(catalog.awards.some((item) => (item[field] ?? []).includes(chip.value)), chip.value);
    }
  }
}

const dated = serializeAwardDeadlineCalendar(tight, now);
assert(dated);
assert(dated.includes('BEGIN:VCALENDAR'));
assert.equal(dated.split('BEGIN:VEVENT').length - 1, 1);
assert(dated.includes('DTSTART;VALUE=DATE:20261215'));
assert(dated.includes('Deadline: Tight Local'));
assert(dated.includes(`UID:${tight.publicId}-20261215@whitefish-scholarships`));
assert(!dated.includes('County'));
assert(!/ATTENDEE|ORGANIZER|mailto/i.test(dated));
assert(!dated.includes('email'));
assert(dated.includes('\r\n'));
const undated = award({
  publicId: 'award-aaaaaaaaaaa8',
  name: 'No Date',
  verification: { status: 'verified', lastChecked: '2026-10-28', sourceUrl: 'https://example.com/open', openStatus: 'open_now', deadline: 'November 30' },
});
assert.equal(serializeAwardDeadlineCalendar(undated, now), null);

const answers = InterviewAnswersSchema.parse({
  gpa: 3.2,
  targetSchoolTypes: ['four_year'],
  differentiation: whitefish,
});
const decoded = decodeStudentLink(encodeStudentLink({ answers, hiddenIds: [] }));
assert.deepEqual(decoded?.answers?.differentiation?.places, ['whitefish']);
assert.equal(ruralRuleMatches(county, decoded?.answers?.differentiation ?? emptyDifferentiation()), true);

const wizard = fs.readFileSync('src/components/InterviewWizard.tsx', 'utf8');
const list = fs.readFileSync('src/components/StudentMatchList.tsx', 'utf8');
const step = fs.readFileSync('src/components/steps/DifferentiationStep.tsx', 'utf8');
assert(wizard.includes('What makes you different?'));
assert(wizard.includes('SPECIAL_CRITERIA.filter((item) => item.category === category).map'));
assert(list.includes('Why this pool is small'));
assert(list.includes('Add this deadline to my calendar'));
assert(list.includes('Add deadlines to my calendar'));
assert(!list.includes('type="email"'));
assert(!list.includes('mailto:'));
assert(!list.includes('fetch('));
assert(step.includes('type="checkbox"'));
for (const file of [wizard, list, step, fs.readFileSync('src/lib/differentiation.ts', 'utf8')]) {
  assert.equal(file.includes('\u2014'), false);
  assert.equal(file.includes('\u2013'), false);
}

console.log('p3 differentiation tests passed');
