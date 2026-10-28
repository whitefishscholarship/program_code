import { parseDeadline } from './dateParse';
import { displayVerification, type StudentAward } from './studentCatalog';

export const BOOKMARK_NOTE = "Bookmark this link. Don't share it, it holds your answers.";
export const HIDE_BANNER = 'Award hidden. Your link changed. Copy or bookmark your new refresh link.';
export const HIDDEN_FOOTNOTE = '* Hidden awards are saved only in your link, after the # sign. No account. We never see or keep your info. A brand new award will still show up.';

export const STUDENT_STATUS_ORDER = ['open_now', 'opens_later', 'closed', 'not_sure'] as const;
export type StudentStatus = (typeof STUDENT_STATUS_ORDER)[number];
export type StatusFilter = 'all' | StudentStatus;
export type StudentSort = 'deadline' | 'amount' | 'name';

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
const EXPLICIT_DATE = new RegExp(`\\b(${MONTH_ALT})\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s+(\\d{4})\\b`, 'i');
const OPEN_DATE = new RegExp(`\\b(${MONTH_ALT})\\b(?:\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?)?(?:,)?(?:\\s+(\\d{4}))?`, 'i');
const URL_IN_TEXT = /https?:\/\/[^\s<>"')\]]+/i;

export function plainStudentText(value: string): string {
  return value.replaceAll('\u2014', ', ').replaceAll('\u2013', '-');
}

export function studentStatus(award: StudentAward): StudentStatus {
  const verification = displayVerification(award);
  if (verification.status !== 'verified') return 'not_sure';
  if (verification.openStatus === 'open_now') return 'open_now';
  if (verification.openStatus === 'opens_on') return 'opens_later';
  if (verification.openStatus === 'closed_next_not_posted') return 'closed';
  return 'not_sure';
}

export function matchesStudentStatus(award: StudentAward, filter: StatusFilter): boolean {
  return filter === 'all' || studentStatus(award) === filter;
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
  const withoutNotes = text.replace(/\([^)]*\)/g, ' ');
  const matches = [...withoutNotes.matchAll(new RegExp(EXPLICIT_DATE.source, 'gi'))];
  const match = matches.at(-1);
  if (!match) return null;
  const month = MONTHS[match[1].toLowerCase()];
  const day = Number(match[2]);
  const year = Number(match[3]);
  if (month === undefined || day < 1 || day > 31) return null;
  const date = new Date(Date.UTC(year, month, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month || date.getUTCDate() !== day) return null;
  return { year, month: month + 1, day };
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

export function sortStudentAwards(awards: readonly StudentAward[], sort: StudentSort, now: Date): StudentAward[] {
  return [...awards].sort((left, right) => {
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
  const status = studentStatus(award);
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
