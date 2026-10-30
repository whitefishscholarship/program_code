import { calendarDayIsBefore, explicitCalendarDay, parseDeadline } from './dateParse';
import { displayVerification, type ApplicationMode, type StudentAward } from './studentCatalog';

export const BOOKMARK_NOTE = "Bookmark this link. Don't share it, it holds your answers.";
export const HIDE_BANNER = 'Award hidden. Your link changed. Copy or bookmark your new refresh link.';
export const HIDDEN_FOOTNOTE = '* Hidden awards are saved only in your link, after the # sign. No account. We never see or keep your info. A brand new award will still show up.';

export const STUDENT_STATUS_ORDER = ['open_now', 'opens_later', 'closed', 'not_sure'] as const;
export type StudentStatus = (typeof STUDENT_STATUS_ORDER)[number];
export type StatusFilter = 'all' | StudentStatus;
export type StudentSort = 'deadline' | 'amount' | 'name' | 'pool';

export const RULES_NOT_POSTED = 'Rules not posted yet';

export const STUDENT_STATUS_LABELS: Record<StudentStatus, string> = {
  open_now: 'Open now',
  opens_later: 'Opens later',
  closed: 'Closed',
  not_sure: 'Not sure',
};

const MONTHS: Record<string, number> = {
  jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2, apr: 3, april: 3,
  may: 4, jun: 5, june: 5, jul: 6, july: 6, aug: 7, august: 7, sep: 8, sept: 8,
  september: 8, oct: 9, october: 9, nov: 10, november: 10, dec: 11, december: 11,
};
const MONTH_ALT = Object.keys(MONTHS).sort((left, right) => right.length - left.length).join('|');
const OPEN_DATE = new RegExp(`\\b(${MONTH_ALT})\\b(?:\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?)?(?:,)?(?:\\s+(\\d{4}))?`, 'i');
const URL_IN_TEXT = /https?:\/\/[^\s<>"')\]]+/i;

export function plainStudentText(value: string): string {
  return value.replaceAll('\u2014', ', ').replaceAll('\u2013', '-').replace(/ ?Checked on the sponsor page on [A-Za-z]+ \d{1,2}, \d{4}\.?/g, '').replaceAll('are women', 'are female');
}

/**
 * Display safety rule. A deadline that names a year and falls before today is
 * Closed on screen, even when the stored status still says open.
 */
export function datedDeadlineIsBeforeToday(award: StudentAward, now: Date): boolean {
  const date = explicitDeadlineDate(award);
  return date !== null && calendarDayIsBefore(date, now);
}

export function studentStatus(award: StudentAward, now: Date = new Date()): StudentStatus {
  const verification = displayVerification(award);
  if (verification.status !== 'verified') return 'not_sure';
  if (datedDeadlineIsBeforeToday(award, now)) return 'closed';
  if (verification.openStatus === 'open_now') return 'open_now';
  if (verification.openStatus === 'opens_on') return 'opens_later';
  if (verification.openStatus === 'closed_next_not_posted') return 'closed';
  return 'not_sure';
}

export function matchesStudentStatus(award: StudentAward, filter: StatusFilter, now: Date = new Date()): boolean {
  return filter === 'all' || studentStatus(award, now) === filter;
}

export type StudentSchoolFilter = 'all' | 'two_year' | 'four_year' | 'trade' | 'other';

export type StudentListFilters = {
  search?: string;
  status?: StatusFilter;
  openingThisMonth?: boolean;
  method?: 'all' | ApplicationMode;
  schoolType?: StudentSchoolFilter;
  now?: Date;
};

/** Same rules as the award list. Each option is compared with that control left off. */
export function filterStudentAwards(awards: readonly StudentAward[], filters: StudentListFilters = {}): StudentAward[] {
  const now = filters.now ?? new Date();
  const query = (filters.search ?? '').trim().toLocaleLowerCase();
  const status = filters.status ?? 'all';
  const method = filters.method ?? 'all';
  const schoolType = filters.schoolType ?? 'all';
  const openingThisMonth = filters.openingThisMonth === true;
  return awards.filter((award) => {
    const haystack = [award.name, award.summary ? plainStudentText(award.summary) : '', award.amount.label, award.eligibility.audience, award.application.label, deadlineLabel(award)]
      .filter(Boolean).join(' ').toLocaleLowerCase();
    const matchesSearch = !query || haystack.includes(query);
    const matchesMethod = method === 'all' || award.application.mode === method;
    const matchesSchool = schoolType === 'all' || award.eligibility.schoolTypes.includes(schoolType);
    const matchesMonth = !openingThisMonth || isOpeningThisMonth(award, now);
    return matchesSearch && matchesStudentStatus(award, status, now) && matchesMethod && matchesSchool && matchesMonth;
  });
}

export function officialUrl(award: StudentAward): string | null {
  const direct = award.application.url;
  if (direct && /^https?:\/\//i.test(direct)) return direct;
  const buried = award.application.label.match(URL_IN_TEXT)?.[0];
  if (buried) return buried;
  const source = displayVerification(award).sourceUrl;
  if (source && /^https?:\/\//i.test(source)) return source;
  return null;
}

export function actionLabel(status: StudentStatus): 'Apply' | 'Look now' {
  return status === 'open_now' ? 'Apply' : 'Look now';
}

const DOLLAR_AMOUNT_SOURCE = String.raw`\$\s*(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d{2}))?`;
const RANGE_GAP = /^(?:-|to|through)$/i;

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

function dollarsToCents(whole: string, fraction: string | undefined): number {
  return Number(whole.replaceAll(',', '')) * 100 + (fraction ? Number(fraction) : 0);
}

function formatMoney(cents: number): string {
  const whole = Math.floor(cents / 100);
  const fraction = cents % 100;
  const withCommas = String(whole).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return fraction === 0 ? `$${withCommas}` : `$${withCommas}.${pad2(fraction)}`;
}

/** Student-facing amount. Reads the label only and does not change catalog data. */
export function formatStudentAmount(label: string): string {
  const text = plainStudentText(label);
  const matches = [...text.matchAll(new RegExp(DOLLAR_AMOUNT_SOURCE, 'g'))];
  if (matches.length === 0) return 'See site';
  const cents = matches.map((match) => dollarsToCents(match[1], match[2]));
  const unique = [...new Set(cents)];
  if (unique.length === 1) return formatMoney(unique[0]);
  if (matches.length === 2 && isDollarRange(text, matches)) {
    const low = Math.min(cents[0], cents[1]);
    const high = Math.max(cents[0], cents[1]);
    return `${formatMoney(low)}-${formatMoney(high)}`;
  }
  return `Up to ${formatMoney(Math.max(...cents))}`;
}

function isDollarRange(text: string, matches: RegExpMatchArray[]): boolean {
  const first = matches[0];
  const second = matches[1];
  if (first.index === undefined || second.index === undefined) return false;
  const between = text.slice(first.index + first[0].length, second.index).replace(/\s/g, '');
  return RANGE_GAP.test(between);
}

type CalendarDate = { year: number; month: number; day: number };

function explicitDateInText(text: string): CalendarDate | null {
  return explicitCalendarDay(text);
}

/** Student-facing deadline. A missing year stays "See site" and is never guessed. */
export function formatStudentDeadline(text: string): string {
  const date = explicitDateInText(text);
  if (!date) return 'See site';
  return `${pad2(date.month)}/${pad2(date.day)}/${date.year}`;
}

export function amountLabel(award: StudentAward): string {
  return formatStudentAmount(award.amount.label);
}

export function deadlineLabel(award: StudentAward): string {
  const verification = displayVerification(award);
  if (verification.status !== 'verified') return 'Not sure';
  return verification.deadline ? formatStudentDeadline(verification.deadline) : 'See site';
}

export function explicitDeadlineDate(award: StudentAward): CalendarDate | null {
  const verification = displayVerification(award);
  if (verification.status !== 'verified' || !verification.deadline) return null;
  return explicitDateInText(verification.deadline);
}

export function deadlineSortTime(award: StudentAward, now: Date): number | null {
  const explicit = explicitDeadlineDate(award);
  if (explicit) return Date.UTC(explicit.year, explicit.month - 1, explicit.day);
  const verification = displayVerification(award);
  if (verification.status !== 'verified' || !verification.deadline) return null;
  const parsed = parseDeadline(verification.deadline, now);
  return parsed.date ? parsed.date.getTime() : null;
}

export function amountSortValue(award: StudentAward): number | null {
  const value = award.amount.maximum ?? award.amount.minimum;
  return value === null ? null : value;
}

const NARROW_FIELDS = ['sports', 'clubs', 'heritage', 'faith', 'familyTies', 'plans', 'health', 'lifeSituation', 'gender'] as const;

type PoolAward = Pick<StudentAward, 'residencyScope' | 'poolLevel' | 'poolReason' | 'ruralRule' | 'firstGen' | 'needBased' | (typeof NARROW_FIELDS)[number]>;

export function poolRulesMissing(award: Pick<StudentAward, 'residencyScope' | 'poolLevel'>): boolean {
  return award.residencyScope == null || award.poolLevel == null;
}

/** A heritage, union, health, club, or other specific trait makes the pool smaller. */
export function hasNarrowingTrait(award: PoolAward): boolean {
  for (const field of NARROW_FIELDS) {
    const values = award[field];
    if (values && values.length > 0) return true;
  }
  if (award.firstGen === true) return true;
  if (award.needBased === true) return true;
  return award.ruralRule != null && award.ruralRule !== 'none';
}

/**
 * Whitefish, Flathead, Montana, and a small local area are small pools.
 * A national award with no narrowing trait is a large pool.
 */
export function poolIsSmall(award: PoolAward): boolean {
  if (poolRulesMissing(award)) return false;
  if (hasNarrowingTrait(award)) return true;
  if (award.residencyScope === 'whitefish' || award.residencyScope === 'flathead' || award.residencyScope === 'montana') return true;
  return award.residencyScope === 'regional' && (award.poolLevel ?? 9) <= 3;
}

function largePoolLine(award: Pick<StudentAward, 'poolReason'>): string {
  const reason = award.poolReason?.trim() ?? '';
  if (reason.startsWith('Large pool:')) return plainStudentText(reason);
  if (/Canada/.test(reason)) return 'Large pool: open in the United States and Canada.';
  if (/\bTexas\b/.test(reason)) return 'Large pool: open across Texas.';
  if (/New York/.test(reason)) return 'Large pool: open across New York.';
  if (/nearby states/.test(reason)) return 'Large pool: open in Montana and nearby states.';
  return 'Large pool: open nationwide.';
}

/** Shown on the card. A missing place does not use the stored reason. */
export function poolExplanation(award: PoolAward): string {
  if (poolRulesMissing(award)) return RULES_NOT_POSTED;
  if (!poolIsSmall(award)) return largePoolLine(award);
  const reason = award.poolReason?.trim();
  return reason ? plainStudentText(reason) : RULES_NOT_POSTED;
}

export function sortStudentAwards(awards: readonly StudentAward[], sort: StudentSort, now: Date): StudentAward[] {
  return [...awards].sort((left, right) => {
    if (sort === 'pool') {
      const leftMissing = poolRulesMissing(left);
      const rightMissing = poolRulesMissing(right);
      if (leftMissing !== rightMissing) return leftMissing ? 1 : -1;
      // Level 1 is the smallest pool. Level 6, national and open, is the largest and sorts last among awards with a posted place.
      const leftLevel = left.poolLevel ?? 99;
      const rightLevel = right.poolLevel ?? 99;
      const leftScore = left.competitionScore ?? 101;
      const rightScore = right.competitionScore ?? 101;
      const leftDated = deadlineSortTime(left, now) === null ? 1 : 0;
      const rightDated = deadlineSortTime(right, now) === null ? 1 : 0;
      return leftLevel - rightLevel || leftScore - rightScore || leftDated - rightDated || left.name.localeCompare(right.name) || left.publicId.localeCompare(right.publicId);
    }
    if (sort === 'name') return left.name.localeCompare(right.name) || left.publicId.localeCompare(right.publicId);
    if (sort === 'amount') {
      const leftAmount = amountSortValue(left);
      const rightAmount = amountSortValue(right);
      if (leftAmount === null && rightAmount === null) return left.name.localeCompare(right.name) || left.publicId.localeCompare(right.publicId);
      if (leftAmount === null) return 1;
      if (rightAmount === null) return -1;
      return rightAmount - leftAmount || left.name.localeCompare(right.name) || left.publicId.localeCompare(right.publicId);
    }
    const leftTime = deadlineSortTime(left, now);
    const rightTime = deadlineSortTime(right, now);
    if (leftTime === null && rightTime === null) return left.name.localeCompare(right.name) || left.publicId.localeCompare(right.publicId);
    if (leftTime === null) return 1;
    if (rightTime === null) return -1;
    return leftTime - rightTime || left.name.localeCompare(right.name) || left.publicId.localeCompare(right.publicId);
  });
}

export function isOpeningThisMonth(award: StudentAward, now: Date): boolean {
  const status = studentStatus(award, now);
  if (status !== 'open_now' && status !== 'opens_later') return false;
  const opens = award.cycle.opens;
  if (!opens) return false;
  const match = opens.match(OPEN_DATE);
  if (!match) return false;
  const month = MONTHS[match[1].toLowerCase()];
  if (month === undefined) return false;
  const year = match[3] ? Number(match[3]) : now.getFullYear();
  return month === now.getMonth() && year === now.getFullYear();
}

export function hideAwardId(hiddenIds: readonly string[], id: string): string[] {
  return hiddenIds.includes(id) ? [...hiddenIds] : [...hiddenIds, id];
}

export function restoreAwardId(hiddenIds: readonly string[], id: string): string[] {
  return hiddenIds.filter((hiddenId) => hiddenId !== id);
}

export function splitHidden<T extends { publicId: string }>(awards: readonly T[], hiddenIds: readonly string[]): { visible: T[]; concealed: T[] } {
  const hidden = new Set(hiddenIds);
  const visible: T[] = [];
  const concealed: T[] = [];
  for (const award of awards) {
    if (hidden.has(award.publicId)) concealed.push(award);
    else visible.push(award);
  }
  return { visible, concealed };
}

export function formatListStamp(now: Date): string {
  const date = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(now);
  return `List made ${date}. Each Apply button opens the real site.`;
}
