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

export function amountLabel(award: StudentAward): string {
  if (award.amount.minimum === null && award.amount.maximum === null) return 'See site';
  if (award.amount.label === 'Amount not stated' || award.amount.label === 'Amount not verified') return 'See site';
  return plainStudentText(award.amount.label);
}

export function deadlineLabel(award: StudentAward): string {
  const verification = displayVerification(award);
  if (verification.status !== 'verified') return 'Not sure';
  return verification.deadline ? plainStudentText(verification.deadline) : 'See site';
}

export function explicitDeadlineDate(award: StudentAward): { year: number; month: number; day: number } | null {
  const verification = displayVerification(award);
  if (verification.status !== 'verified' || !verification.deadline) return null;
  const match = verification.deadline.match(EXPLICIT_DATE);
  if (!match) return null;
  const month = MONTHS[match[1].toLowerCase()];
  const day = Number(match[2]);
  const year = Number(match[3]);
  if (month === undefined || day < 1 || day > 31) return null;
  const date = new Date(Date.UTC(year, month, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month || date.getUTCDate() !== day) return null;
  return { year, month: month + 1, day };
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

export function shortCheckedDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(year, month - 1, day)));
}
