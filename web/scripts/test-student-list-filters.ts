// Each list filter option must change the award count versus that control left off.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { APPLICATION_MODES } from '../src/lib/studentCatalog';
import { googleCalendarTemplateUrl } from '../src/lib/studentExport';
import { InterviewAnswersSchema } from '../src/lib/interviewMatcher';
import { awardsForResultScope, shortlistAwards } from '../src/lib/spreadsheetShortlist';
import {
  filterStudentAwards,
  poolExplanation,
  STUDENT_STATUS_ORDER,
  type StudentSchoolFilter,
} from '../src/lib/studentList';
import { StudentCatalogSchema, type StudentAward } from '../src/lib/studentCatalog';
import {
  chipLabel,
  differentiationGroups,
  differentiationHits,
  emptyDifferentiation,
  toggleDifferentiation,
} from '../src/lib/differentiation';
import {
  PROGRESS_NOTE,
  clearAwardProgress,
  filterByProgress,
  progressCounts,
  awardProgress,
  readAwardProgress,
  setAwardProgress,
  writeAwardProgress,
  type ProgressStorage,
} from '../src/lib/awardProgress';

const now = new Date(2026, 9, 30);
const catalog = StudentCatalogSchema.parse(JSON.parse(fs.readFileSync('fixtures/r3/catalog-v1.json', 'utf8')).catalog);
const awards = catalog.awards;
const off = awards.length;

function changed(label: string, matched: readonly StudentAward[]) {
  assert.notEqual(matched.length, off, `${label} left the count at ${off}`);
  console.log(`${label}: off ${off}, on ${matched.length}`);
}

for (const status of STUDENT_STATUS_ORDER) {
  changed(`status ${status}`, filterStudentAwards(awards, { status, now }));
}
changed('opening this month', filterStudentAwards(awards, { openingThisMonth: true, now }));
for (const method of APPLICATION_MODES) {
  changed(`apply ${method}`, filterStudentAwards(awards, { method, now }));
}
const schoolTypes: StudentSchoolFilter[] = ['two_year', 'four_year', 'trade', 'other'];
for (const schoolType of schoolTypes) {
  changed(`school ${schoolType}`, filterStudentAwards(awards, { schoolType, now }));
}
const named = awards.find((award) => award.name.includes('Evans Scholarship'));
assert.ok(named);
changed('search Evans', filterStudentAwards(awards, { search: 'Evans Scholarship', now }));

const answers = InterviewAnswersSchema.parse({ gpa: 1, targetSchoolTypes: ['four_year'] });
const results = shortlistAwards(awards, answers).results;
const allResults = awardsForResultScope(results, 'all');
for (const scope of ['recommended', 'conflicts'] as const) {
  const matched = awardsForResultScope(results, scope);
  assert.notEqual(matched.length, allResults.length, `${scope} left the count at ${allResults.length}`);
  console.log(`scope ${scope}: off ${allResults.length}, on ${matched.length}`);
}

const dated = awards.find((award) => googleCalendarTemplateUrl(award));
assert.ok(dated);
const url = new URL(googleCalendarTemplateUrl(dated)!);
assert.equal(url.origin + url.pathname, 'https://calendar.google.com/calendar/render');
assert.equal(url.searchParams.get('action'), 'TEMPLATE');
assert.match(url.searchParams.get('text') ?? '', /Deadline:/);
assert.match(url.searchParams.get('dates') ?? '', /^\d{8}\/\d{8}$/);
assert.equal(url.searchParams.get('add'), null);
assert.doesNotMatch(url.toString(), /mailto|@/i);
const undated = awards.find((award) => !googleCalendarTemplateUrl(award));
assert.ok(undated);
assert.equal(googleCalendarTemplateUrl(undated), null);

const evansUrl = new URL(googleCalendarTemplateUrl(named)!);
assert.equal(evansUrl.searchParams.get('dates'), '20261015/20261016');
assert.match(evansUrl.searchParams.get('text') ?? '', /Evans Scholarship/);
assert.doesNotMatch(evansUrl.searchParams.get('details') ?? '', /@/);

const groups = differentiationGroups(awards);
const optionLabels = groups.flatMap((group) => group.chips.map((chip) => chip.label));
assert.equal(optionLabels.includes('Female'), true);
assert.equal(optionLabels.includes('Girl or woman'), false);
assert.equal(optionLabels.some((label) => /girl or woman/i.test(label)), false);
assert.equal(optionLabels.includes('A parent works for the sponsor'), false);
assert.equal(optionLabels.includes('Aviation group member'), false);
assert.equal(optionLabels.includes('Club like the Elks'), false);
for (const label of [
  'Elks',
  'FFA',
  'Kish Bank',
  'D.C. Goodman',
  'Fiore',
  'Mead/Westvaco',
  chipLabel('woman'),
]) {
  assert.equal(optionLabels.includes(label), true, label);
}
const female = groups.flatMap((group) => group.chips).find((chip) => chip.value === 'woman');
assert.equal(female?.label, 'Female');
changed('Female', awards.filter((award) => differentiationHits(award, toggleDifferentiation(emptyDifferentiation(), female!)).includes('Female')));
const womenAward = awards.find((award) => (award.gender ?? []).includes('woman') && (award.poolReason ?? '').includes('are women'));
assert.ok(womenAward);
assert.match(poolExplanation(womenAward), /are female/);
assert.doesNotMatch(poolExplanation(womenAward), /are women|girl or woman/i);

const seen = new Set<string>();
for (const id of ['school-clubs', 'community-orgs', 'aviation-groups', 'employers']) {
  const group = groups.find((item) => item.id === id);
  assert.ok(group, id);
  assert.notEqual(group.layout, 'questions');
  assert.ok(group.chips.length > 0, id);
  for (const chip of group.chips) {
    const profile = toggleDifferentiation(emptyDifferentiation(), chip);
    const matched = awards.filter((award) => differentiationHits(award, profile).includes(chip.label));
    changed(chip.label, matched);
    const key = matched.map((award) => award.publicId).sort().join(',');
    assert.equal(seen.has(key), false, `${chip.label} matches the same awards as another new option`);
    seen.add(key);
  }
}
const employerChips = groups.find((group) => group.id === 'employers')?.chips ?? [];
const employerAwards = awards.filter((award) => (award.familyTies ?? []).includes('employer'));
assert.equal(employerAwards.length, 9);
for (const award of employerAwards) {
  const hits = employerChips.filter((chip) => differentiationHits(award, toggleDifferentiation(emptyDifferentiation(), chip)).includes(chip.label));
  assert.equal(hits.length, 1, award.name);
}

const progressMap = setAwardProgress(setAwardProgress({}, awards[0].publicId, 'completed'), awards[1].publicId, 'in_progress');
changed('progress not started', filterByProgress(awards, progressMap, 'not_started'));
changed('progress in progress', filterByProgress(awards, progressMap, 'in_progress'));
changed('progress completed', filterByProgress(awards, progressMap, 'completed'));
assert.equal(filterByProgress(awards, progressMap, 'all').length, off);
const counts = progressCounts(awards, progressMap);
assert.equal(counts.all, off);
assert.equal(counts.completed, 1);
assert.equal(counts.in_progress, 1);
assert.equal(counts.not_started, off - 2);
assert.equal(awardProgress(progressMap, awards[2].publicId), 'not_started');
assert.deepEqual(setAwardProgress({}, 'not-an-award', 'completed'), {});
assert.equal(setAwardProgress(progressMap, awards[0].publicId, 'not_started')[awards[0].publicId], undefined);

const memory = memoryStorage();
writeAwardProgress(memory, progressMap);
const stored = memory.getItem('whitefish-award-progress-v1') ?? '';
assert.equal(stored.includes('gpa'), false);
assert.equal(stored.includes(awards[0].name), false);
assert.deepEqual(readAwardProgress(memory), progressMap);
clearAwardProgress(memory);
assert.equal(memory.getItem('whitefish-award-progress-v1'), null);
assert.deepEqual(readAwardProgress(memory), {});
memory.setItem('whitefish-award-progress-v1', JSON.stringify({
  [awards[0].publicId]: 'completed',
  'not-an-id': 'completed',
  [awards[1].publicId]: 'nope',
  gpa: 4,
}));
assert.deepEqual(readAwardProgress(memory), { [awards[0].publicId]: 'completed' });

const listSource = fs.readFileSync('src/components/StudentMatchList.tsx', 'utf8');
const linkSource = fs.readFileSync('src/lib/studentLink.ts', 'utf8');
assert.equal(listSource.includes('localStorage'), true);
assert.equal(listSource.includes('Clear progress'), true);
assert.equal(listSource.includes('Filter by progress'), true);
assert.equal(listSource.includes('PROGRESS_NOTE'), true);
assert.equal(PROGRESS_NOTE.startsWith('Progress is saved on this device only'), true);
assert.equal(listSource.includes('buildStudentHref(window.location.href, { answers, hiddenIds: [...hiddenIds] })'), true);
assert.equal(listSource.includes('fetch('), false);
assert.equal(linkSource.includes('localStorage'), false);
assert.equal(linkSource.includes('award-progress'), false);

function memoryStorage(): ProgressStorage & { getItem: (key: string) => string | null } {
  const items = new Map<string, string>();
  return {
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => { items.set(key, value); },
    removeItem: (key) => { items.delete(key); },
  };
}
