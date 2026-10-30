import assert from 'node:assert/strict';
import fs from 'node:fs';
import { crc32 } from 'node:zlib';
import { InterviewAnswersSchema, type InterviewAnswers } from '../src/lib/interviewMatcher';
import {
  buildStudentWorkbook,
  serializeStudentCalendar,
  serializeStudentCsv,
  STUDENT_EXPORT_COLUMNS,
  toStudentExportRows,
} from '../src/lib/studentExport';
import {
  buildStudentHref,
  decodeStudentLink,
  encodeStudentLink,
} from '../src/lib/studentLink';
import {
  BOOKMARK_NOTE,
  HIDE_BANNER,
  HIDDEN_FOOTNOTE,
  formatStudentAmount,
  formatStudentDeadline,
  hideAwardId,
  isOpeningThisMonth,
  restoreAwardId,
  sortStudentAwards,
  splitHidden,
  explicitDeadlineDate,
  STUDENT_STATUS_LABELS,
  studentStatus,
} from '../src/lib/studentList';
import { openStatusText, StudentAwardSchema, type StudentAward } from '../src/lib/studentCatalog';

const now = new Date(2026, 9, 28);

const answers = InterviewAnswersSchema.parse({
  gpa: 3.4,
  targetSchoolTypes: ['four_year'],
  residenceState: 'MT',
});

function award(overrides: Partial<StudentAward> & Pick<StudentAward, 'publicId' | 'name'>): StudentAward {
  const base = {
    publicId: overrides.publicId,
    name: overrides.name,
    summary: 'A short summary.',
    amount: { label: '$1,000', minimum: 1000, maximum: 1000, currency: 'USD', state: 'known' as const },
    eligibility: { audience: 'Students', minimumGpa: null, schoolTypes: [], focus: null },
    cycle: { status: 'unknown' as const, label: 'Availability not verified', year: null, opens: null, closes: 'March 1, 2026', recurrence: 'unknown' as const },
    application: { mode: 'direct_per_award' as const, label: 'Separate application for this award', url: 'https://example.com/apply', groupPublicId: null, supplements: 'unknown' as const },
    sourcePublicIds: ['source-aaaaaaaaaaaa'],
  };
  return StudentAwardSchema.parse({
    ...base,
    ...overrides,
    amount: { ...base.amount, ...overrides.amount },
    eligibility: { ...base.eligibility, ...overrides.eligibility },
    cycle: { ...base.cycle, ...overrides.cycle },
    application: { ...base.application, ...overrides.application },
    verification: overrides.verification,
  });
}

const openAward = award({
  publicId: 'award-aaaaaaaaaaa1',
  name: 'Open Example',
  cycle: { status: 'unknown', label: 'Availability not verified', year: 2026, opens: 'October 1, 2026', closes: null, recurrence: 'annual' },
  verification: { status: 'verified', lastChecked: '2026-10-28', sourceUrl: 'https://example.com/open', openStatus: 'open_now', deadline: 'December 15, 2026' },
});
const laterAward = award({
  publicId: 'award-aaaaaaaaaaa2',
  name: 'Later Example',
  amount: { label: '$500', minimum: 500, maximum: 500, currency: 'USD', state: 'known' },
  cycle: { status: 'active', label: 'Open now', year: 2026, opens: 'November 1, 2026', closes: null, recurrence: 'annual' },
  verification: { status: 'verified', lastChecked: '2026-10-28', sourceUrl: 'https://example.com/later', openStatus: 'opens_on', deadline: 'January 15, 2027' },
});
const closedAward = award({
  publicId: 'award-aaaaaaaaaaa3',
  name: 'Closed Example',
  amount: { label: 'See site', minimum: null, maximum: null, currency: null, state: 'unknown' },
  cycle: { status: 'closed', label: 'Closed', year: null, opens: null, closes: 'April 1, 2024', recurrence: 'unknown' },
  application: { mode: 'direct_per_award', label: 'Historical program application via https://school.example/buried ; current portal observed closed.', url: null, groupPublicId: null, supplements: 'unknown' },
  verification: { status: 'verified', lastChecked: '2026-10-28', sourceUrl: 'https://school.example/source', openStatus: 'closed_next_not_posted', deadline: null },
});
const unsureAward = award({
  publicId: 'award-aaaaaaaaaaa4',
  name: 'Unsure Example',
  cycle: { status: 'active', label: 'Open now', year: null, opens: 'October 15, 2026', closes: 'May 1, 2026', recurrence: 'unknown' },
});
const monthAward = award({
  publicId: 'award-aaaaaaaaaaa5',
  name: 'This Month Example',
  cycle: { status: 'upcoming', label: 'Upcoming', year: 2026, opens: 'October 31, 2026', closes: null, recurrence: 'annual' },
  verification: { status: 'verified', lastChecked: '2026-10-28', sourceUrl: 'https://example.com/month', openStatus: 'opens_on', deadline: 'December 1, 2026' },
});

const encoded = encodeStudentLink({ answers, hiddenIds: [openAward.publicId, openAward.publicId, 'not-an-id'] });
assert(encoded.startsWith('wfs1.'));
assert(!encoded.includes('+') && !encoded.includes('/') && !encoded.includes('='));
const decoded = decodeStudentLink(`#${encoded}`);
assert(decoded);
assert.equal(decoded.answers?.gpa, 3.4);
assert.equal(decoded.answers?.residenceState, 'MT');
assert.deepEqual(decoded.hiddenIds, [openAward.publicId]);
assert.equal(decodeStudentLink(''), null);
assert.equal(decodeStudentLink('#main-content'), null);
assert.equal(decodeStudentLink(encodeStudentLink({ answers: { ...answers, gpa: 9 } as InterviewAnswers, hiddenIds: [] })), null);

const href = buildStudentHref('https://finder.example/list?gpa=3.5&qa=matrix#old', { answers, hiddenIds: [laterAward.publicId] });
const hrefUrl = new URL(href);
assert.equal(hrefUrl.searchParams.get('gpa'), null);
assert.equal(hrefUrl.searchParams.get('qa'), 'matrix');
assert.equal(hrefUrl.search, '?qa=matrix');
assert.equal(decodeStudentLink(hrefUrl.hash)?.answers?.gpa, 3.4);
assert.ok(href.includes('#'));
assert.equal(href.split('#')[0].includes('residenceState'), false);

let hidden = hideAwardId([], openAward.publicId);
hidden = hideAwardId(hidden, laterAward.publicId);
hidden = hideAwardId(hidden, laterAward.publicId);
assert.deepEqual(hidden, [openAward.publicId, laterAward.publicId]);
const split = splitHidden([openAward, laterAward, closedAward], hidden);
assert.deepEqual(split.visible.map((item) => item.publicId), [closedAward.publicId]);
assert.deepEqual(split.concealed.map((item) => item.name), ['Open Example', 'Later Example']);
hidden = restoreAwardId(hidden, openAward.publicId);
assert.deepEqual(splitHidden([openAward, laterAward, closedAward], hidden).visible.map((item) => item.name), ['Open Example', 'Closed Example']);

assert.equal(studentStatus(openAward, now), 'open_now');
assert.equal(studentStatus(laterAward, now), 'opens_later');
assert.equal(studentStatus(closedAward, now), 'closed');
assert.equal(studentStatus(unsureAward, now), 'not_sure', 'an unchecked award stays Not sure even when the old cycle label says open');

const dueToday = award({
  publicId: 'award-aaaaaaaaaaa6',
  name: 'Due Today Example',
  verification: { status: 'verified', lastChecked: '2026-10-28', sourceUrl: 'https://example.com/today', openStatus: 'open_now', deadline: 'October 28, 2026' },
});
const noYear = award({
  publicId: 'award-aaaaaaaaaaa7',
  name: 'No Year Example',
  verification: { status: 'verified', lastChecked: '2026-10-28', sourceUrl: 'https://example.com/noyear', openStatus: 'open_now', deadline: 'December 31, 11:59 p.m. ET' },
});
assert.equal(studentStatus(dueToday, now), 'open_now', 'a deadline of today is not before today');
assert.equal(studentStatus(noYear, now), 'open_now', 'a deadline without a year is not treated as past');

const catalog = JSON.parse(fs.readFileSync('fixtures/r3/catalog-v1.json', 'utf8')) as { catalog: { awards: unknown[] } };
const gatesRecord = catalog.catalog.awards.find((item) => typeof item === 'object' && item !== null && 'name' in item && item.name === 'The Gates Scholarship');
assert(gatesRecord, 'catalog includes The Gates Scholarship');
const gatesAward = StudentAwardSchema.parse(gatesRecord);
assert.equal(gatesAward.verification?.deadline, 'September 15, 2026');
assert.deepEqual(explicitDeadlineDate(gatesAward), { year: 2026, month: 9, day: 15 });
assert.equal(studentStatus(gatesAward, now), 'closed');
assert.equal(STUDENT_STATUS_LABELS[studentStatus(gatesAward, now)], 'Closed');
const gatesStoredOpen = StudentAwardSchema.parse({
  ...gatesAward,
  cycle: { ...gatesAward.cycle, status: 'active', label: 'Open now' },
  verification: { ...gatesAward.verification, openStatus: 'open_now' },
});
assert.equal(studentStatus(gatesStoredOpen, now), 'closed', 'a past dated deadline stays Closed even when the stored status says Open now');
assert.equal(STUDENT_STATUS_LABELS[studentStatus(gatesStoredOpen, now)], 'Closed');
assert.equal(openStatusText(gatesStoredOpen, now), 'Closed. Deadline September 15, 2026.');
const gatesIso = award({
  publicId: 'award-aaaaaaaaaaa8',
  name: 'The Gates Scholarship',
  verification: { status: 'verified', lastChecked: '2026-10-28', sourceUrl: 'https://www.thegatesscholarship.org/scholarship/', openStatus: 'open_now', deadline: '2026-09-15' },
});
assert.equal(studentStatus(gatesIso, now), 'closed');
assert.equal(STUDENT_STATUS_LABELS[studentStatus(gatesIso, now)], 'Closed');
assert.equal(formatStudentDeadline('2026-09-15'), '09/15/2026');
assert.equal(isOpeningThisMonth(monthAward, now), true);
assert.equal(isOpeningThisMonth(laterAward, now), false);
assert.equal(isOpeningThisMonth(unsureAward, now), false);
assert.equal(isOpeningThisMonth(openAward, now), true);

const byDeadline = sortStudentAwards([laterAward, unsureAward, openAward], 'deadline', now).map((item) => item.name);
assert.deepEqual(byDeadline, ['Open Example', 'Later Example', 'Unsure Example']);
const byAmount = sortStudentAwards([closedAward, openAward, laterAward], 'amount', now).map((item) => item.name);
assert.deepEqual(byAmount, ['Open Example', 'Later Example', 'Closed Example']);
const byName = sortStudentAwards([laterAward, openAward, closedAward], 'name', now).map((item) => item.name);
assert.deepEqual(byName, ['Closed Example', 'Later Example', 'Open Example']);

assert.equal(toStudentExportRows([closedAward])[0].Link, 'https://school.example/buried');
const exported = toStudentExportRows([openAward, laterAward], now);
assert.deepEqual(Object.keys(exported[0]), [...STUDENT_EXPORT_COLUMNS]);
assert.equal(exported[0].Status, 'Open now');
assert.equal(exported[0].Deadline, '12/15/2026');
assert.equal(exported[0].Amount, '$1,000');
assert.equal(exported[1].Status, 'Opens later');
assert.equal(exported[1].Deadline, '01/15/2027');
assert.equal(exported[1].Amount, '$500');
assert.equal('Verified source' in exported[0], false);

const visibleForFile = splitHidden([openAward, laterAward, closedAward], [laterAward.publicId]).visible;
const csv = serializeStudentCsv(visibleForFile, now);
assert(csv.startsWith('\uFEFF'));
assert(csv.includes('List made Oct 28, 2026. Each Apply button opens the real site.'));
assert(csv.includes('"Name","Status","Deadline","Amount","Link","Short summary"'));
assert(!csv.includes('Verified source'));
assert(!csv.includes(laterAward.name));
assert(!csv.includes('Award ID'));
assert(!csv.includes(laterAward.publicId));
assert(!csv.includes('residenceState'));

const workbook = buildStudentWorkbook(visibleForFile, now);
const files = readStoredZip(workbook);
const sheet = new TextDecoder().decode(files.get('xl/worksheets/sheet1.xml'));
assert(sheet.includes('state="frozen"'));
assert(sheet.includes('ySplit="2"'));
assert(sheet.includes('<autoFilter ref="A2:F4"/>'));
assert(!sheet.includes('Verified source'));
const headerRow = sheet.match(/<row r="2">([\s\S]*?)<\/row>/)?.[1] ?? '';
const headerText = [...headerRow.matchAll(/<t[^>]*>([^<]*)<\/t>/g)].map((match) => match[1]);
assert.deepEqual(headerText, [...STUDENT_EXPORT_COLUMNS]);
assert(!sheet.includes('Award ID'));
assert(!sheet.includes(laterAward.publicId));
assert(!sheet.includes(laterAward.name));
assert(sheet.includes('Open Example'));
assert(sheet.includes('https://school.example/buried') || sheet.includes('https://example.com/apply'));
const rels = new TextDecoder().decode(files.get('xl/worksheets/_rels/sheet1.xml.rels'));
assert(rels.includes('Target="https://example.com/apply"'));
assert(rels.includes('Target="https://school.example/buried"'));
for (const [name, data] of files) {
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const localCrc = view.getUint32(14, true);
  assert.equal(localCrc, crc32(data.subarray(30 + name.length)), name);
}

const calendar = serializeStudentCalendar([openAward, closedAward, unsureAward], now);
assert(calendar.includes('BEGIN:VCALENDAR'));
assert(calendar.includes('DTSTART;VALUE=DATE:20261215'));
assert(calendar.includes('Deadline: Open Example'));
assert(!calendar.includes('Closed Example'));
assert(!calendar.includes('Unsure Example'));
assert(!calendar.includes('residenceState'));

assert.equal(formatStudentDeadline('October 31, 2026'), '10/31/2026');
assert.equal(formatStudentDeadline('October 31, 2026, 11:59 p.m. EDT'), '10/31/2026');
assert.equal(formatStudentDeadline('November 12, 2026, 11:59 p.m. Pacific Time'), '11/12/2026');
assert.equal(formatStudentDeadline('October 31, 2026 (late applications for 2026-2027)'), '10/31/2026');
assert.equal(formatStudentDeadline('April 30, 2026 at 11:59 p.m. EDT'), '04/30/2026');
assert.equal(formatStudentDeadline('December 1, 2026 at midnight MST'), '12/01/2026');
assert.equal(formatStudentDeadline('March 1, 11:59 p.m. MST'), 'See site');
assert.equal(formatStudentDeadline('November 15 (August 1 to November 15; year not printed on the page)'), 'See site');
assert.equal(formatStudentDeadline('Friday, December 11'), 'See site');
assert.equal(formatStudentDeadline('November 30'), 'See site');
assert.equal(formatStudentDeadline('February 31, 2026'), 'See site');

assert.equal(formatStudentAmount('$4,000'), '$4,000');
assert.equal(formatStudentAmount('$27,000-$122,000'), '$27,000-$122,000');
assert.equal(formatStudentAmount('$1,000\u2013$5,000'), '$1,000-$5,000');
assert.equal(formatStudentAmount('$1,000 to $5,000'), '$1,000-$5,000');
assert.equal(formatStudentAmount('Typically $500 to $1,500'), '$500-$1,500');
assert.equal(formatStudentAmount('$4,000, or $30,000 for the top 20'), 'Up to $30,000');
assert.equal(formatStudentAmount('Club awards average $1,000; up to $16,000 total'), 'Up to $16,000');
assert.equal(formatStudentAmount('National first place $35,000; other national awards up to $21,000; department first place at least $1,000'), 'Up to $35,000');
assert.equal(formatStudentAmount('$500 each (two awards)'), '$500');
assert.equal(formatStudentAmount('$5,000 ($2,500 a year for two years)'), 'Up to $5,000');
assert.equal(formatStudentAmount('$500, $1,000, and $1,500'), 'Up to $1,500');
assert.equal(formatStudentAmount('Amount not stated'), 'See site');
assert.equal(formatStudentAmount('Full-time tuition and fees'), 'See site');
assert.equal(formatStudentAmount('$2,500 and up'), '$2,500');
assert.equal(formatStudentAmount('$1,500.50'), '$1,500.50');

assert.equal(BOOKMARK_NOTE, "Bookmark this link. Don't share it, it holds your answers.");
assert.equal(HIDE_BANNER, 'Award hidden. Your link changed. Copy or bookmark your new refresh link.');
assert.equal(HIDDEN_FOOTNOTE, '* Hidden awards are saved only in your link, after the # sign. No account. We never see or keep your info. A brand new award will still show up.');

for (const file of [
  'src/components/StudentMatchList.tsx',
  'src/components/ScholarshipBrowser.tsx',
  'src/app/page.tsx',
  'src/lib/studentLink.ts',
  'src/lib/studentList.ts',
  'src/lib/studentExport.ts',
]) {
  const source = fs.readFileSync(file, 'utf8');
  assert(!source.includes('\u2014'), `${file} has an em dash`);
  assert(!source.includes('\u2013'), `${file} has an en dash`);
  for (const forbidden of ['sessionStorage', 'indexedDB', 'document.cookie', 'sendBeacon', 'XMLHttpRequest']) {
    assert(!source.includes(forbidden), `${file} uses ${forbidden}`);
  }
  if (file !== 'src/components/StudentMatchList.tsx') {
    assert(!source.includes('localStorage'), `${file} uses localStorage`);
  }
}
const browserSource = fs.readFileSync('src/components/ScholarshipBrowser.tsx', 'utf8');
const listSource = fs.readFileSync('src/components/StudentMatchList.tsx', 'utf8');
assert(!browserSource.includes('history.replaceState'));
assert(!browserSource.includes('history.pushState'));
assert(!browserSource.includes('fetch('));
assert(listSource.includes('Refresh my list'));
assert(listSource.includes('Copy my link'));
assert(listSource.includes('Show hidden'));
assert(listSource.includes('Opening this month'));
assert(listSource.includes('minmax(14rem,1fr)'));
assert(listSource.includes('break-words'));
assert(!listSource.includes('Verified checked'));
assert(listSource.includes('Add deadlines to my calendar'));
assert(listSource.includes('BOOKMARK_NOTE'));
assert(listSource.includes('HIDE_BANNER'));
assert(listSource.includes('HIDDEN_FOOTNOTE'));
assert.deepEqual(listSource.match(/localStorage/g), ['localStorage', 'localStorage', 'localStorage']);
assert(listSource.includes('readAwardProgress(window.localStorage)'));
assert(listSource.includes('writeAwardProgress(window.localStorage, next)'));
assert(listSource.includes('clearAwardProgress(window.localStorage)'));
assert(listSource.includes('Progress is saved on this device only') || listSource.includes('PROGRESS_NOTE'));
assert(!listSource.includes('localStorage.setItem'));
assert(listSource.includes('\u2715 Hide') || listSource.includes('✕ Hide'));
const linkSource = fs.readFileSync('src/lib/studentLink.ts', 'utf8');
assert(!linkSource.includes('searchParams.set'));
assert(linkSource.includes('url.hash'));

console.log('student ux tests passed');

function readStoredZip(bytes: Uint8Array): Map<string, Uint8Array> {
  const files = new Map<string, Uint8Array>();
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 0;
  while (offset + 30 <= bytes.length && view.getUint32(offset, true) === 0x04034b50) {
    const nameLength = view.getUint16(offset + 26, true);
    const extraLength = view.getUint16(offset + 28, true);
    const size = view.getUint32(offset + 18, true);
    const nameStart = offset + 30;
    const name = new TextDecoder().decode(bytes.subarray(nameStart, nameStart + nameLength));
    const dataStart = nameStart + nameLength + extraLength;
    files.set(name, bytes.subarray(offset, dataStart + size));
    offset = dataStart + size;
  }
  if (files.size < 5) throw new Error(`zip contained ${files.size} files`);
  return files;
}
