// Each list filter option must change the award count versus that control left off.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { APPLICATION_MODES } from '../src/lib/studentCatalog';
import { googleCalendarTemplateUrl } from '../src/lib/studentExport';
import { InterviewAnswersSchema } from '../src/lib/interviewMatcher';
import { awardsForResultScope, shortlistAwards } from '../src/lib/spreadsheetShortlist';
import {
  filterStudentAwards,
  STUDENT_STATUS_ORDER,
  type StudentSchoolFilter,
} from '../src/lib/studentList';
import { StudentCatalogSchema, type StudentAward } from '../src/lib/studentCatalog';

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
