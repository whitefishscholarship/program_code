import { createHash } from 'node:crypto';

export const VERIFICATION_SCHEMA_VERSION = 1 as const;

export type LinkRole = 'information' | 'application' | 'excluded' | 'offline';
export type LinkState = 'reachable' | 'redirected' | 'dead' | 'inconclusive' | 'offline';
export type LinkTargetClass = 'html' | 'document' | 'form' | 'login' | 'dynamic_shell' | 'offline' | 'unknown';
export type ReviewSeverity = 'critical' | 'high' | 'medium' | 'low';
export type NetworkFailureClass = 'timeout' | 'dns' | 'tls' | 'rate_limit' | 'server_error' | 'bot_block' | 'login_wall' | 'dynamic_shell' | 'other';

export interface LinkObservation {
  id: string;
  role: Exclude<LinkRole, 'offline'>;
  requestedUrl: string;
  finalUrl: string | null;
  status: number | null;
  contentType: string | null;
  failureClass: NetworkFailureClass | null;
  markers: Array<'bot_block' | 'login_wall' | 'dynamic_shell' | 'application_form'>;
  retrievedAt: string;
}

export interface LinkClassification {
  id: string;
  role: Exclude<LinkRole, 'offline'>;
  requestedUrl: string;
  finalUrl: string | null;
  status: number | null;
  state: Exclude<LinkState, 'offline'>;
  targetClass: Exclude<LinkTargetClass, 'offline'>;
  redirectKind: 'none' | 'on_host' | 'off_host' | 'unknown';
  reason: string;
  requiresReview: boolean;
  reviewSeverity: ReviewSeverity | null;
  linkCorrectionReviewEligible: boolean;
  awardClosureSupported: false;
  retrievedAt: string;
}

function host(url: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function linkSeverity(role: Exclude<LinkRole, 'offline'>, state: Exclude<LinkState, 'offline'>): ReviewSeverity {
  if (role === 'application' && (state === 'dead' || state === 'inconclusive')) return 'high';
  if (role === 'excluded') return 'medium';
  return 'medium';
}

export function classifyLinkObservation(observation: LinkObservation): LinkClassification {
  const requestedHost = host(observation.requestedUrl);
  const finalHost = host(observation.finalUrl);
  const redirected = Boolean(observation.finalUrl && observation.finalUrl !== observation.requestedUrl);
  const redirectKind: LinkClassification['redirectKind'] = redirected
    ? requestedHost && finalHost
      ? requestedHost === finalHost ? 'on_host' : 'off_host'
      : 'unknown'
    : 'none';
  const base = {
    id: observation.id,
    role: observation.role,
    requestedUrl: observation.requestedUrl,
    finalUrl: observation.finalUrl,
    status: observation.status,
    redirectKind,
    retrievedAt: observation.retrievedAt,
    awardClosureSupported: false as const,
  };

  const markerFailure = observation.markers.find((marker) => marker !== 'application_form');
  const failureClass = observation.failureClass ?? markerFailure ?? null;
  if (failureClass) {
    const targetClass: LinkClassification['targetClass'] = failureClass === 'login_wall'
      ? 'login'
      : failureClass === 'dynamic_shell'
        ? 'dynamic_shell'
        : 'unknown';
    return {
      ...base,
      state: 'inconclusive',
      targetClass,
      reason: `${failureClass} does not establish removal, closure, or a valid replacement target`,
      requiresReview: true,
      reviewSeverity: linkSeverity(observation.role, 'inconclusive'),
      linkCorrectionReviewEligible: false,
    };
  }

  if (observation.status === 404 || observation.status === 410) {
    return {
      ...base,
      state: 'dead',
      targetClass: 'unknown',
      reason: `HTTP ${observation.status} establishes only that this target was unavailable at retrieval time`,
      requiresReview: true,
      reviewSeverity: linkSeverity(observation.role, 'dead'),
      linkCorrectionReviewEligible: true,
    };
  }
  if (observation.status === 429) {
    return classifyLinkObservation({ ...observation, failureClass: 'rate_limit' });
  }
  if (observation.status !== null && observation.status >= 500) {
    return classifyLinkObservation({ ...observation, failureClass: 'server_error' });
  }
  if (observation.status === null || observation.status < 200 || observation.status >= 400) {
    return {
      ...base,
      state: 'inconclusive',
      targetClass: 'unknown',
      reason: observation.status === null
        ? 'No HTTP response was observed'
        : `HTTP ${observation.status} without a verified final target is inconclusive`,
      requiresReview: true,
      reviewSeverity: linkSeverity(observation.role, 'inconclusive'),
      linkCorrectionReviewEligible: false,
    };
  }

  const contentType = observation.contentType?.toLowerCase() ?? '';
  const targetClass: LinkClassification['targetClass'] = observation.markers.includes('application_form')
    ? 'form'
    : contentType.includes('pdf') || contentType.includes('document')
      ? 'document'
      : contentType.includes('html')
        ? 'html'
        : 'unknown';
  const state: LinkClassification['state'] = redirected ? 'redirected' : 'reachable';
  return {
    ...base,
    state,
    targetClass,
    reason: redirected
      ? `Reachable final target observed via ${redirectKind.replace('_', '-')} redirect`
      : 'Reachable target observed; this alone does not verify any scholarship fact',
    requiresReview: redirected && redirectKind === 'off_host',
    reviewSeverity: redirected && redirectKind === 'off_host' ? 'medium' : null,
    linkCorrectionReviewEligible: false,
  };
}

interface P1UrlReference {
  sanitizedUrl: string;
  provenance: string[];
}

interface P1CellDataRecord {
  sheetRow: number;
  scholarshipName: string;
  information: { display: string; urls: P1UrlReference[] };
  application: { display: string; urls: P1UrlReference[] };
}

interface P1CellDataFixture {
  capture: { spreadsheetId: string; range: string; capturedAt: string };
  boundedCompleteness: {
    hyperlinkRepresentations: {
      totalMetadataRepresentations: number;
      retainedSourceColumns: number;
      excludedColumns: number;
    };
    retainedSourceColumnBindings: {
      informationColumn: { metadataRepresentations: number };
      applicationColumn: { metadataRepresentations: number };
    };
    excludedColumnHyperlinkReviewItems: Array<{
      sheetRow: number;
      columnIndex: number;
      columnHeader: string;
      form: string;
      sanitizedUrl: string;
      reason: string;
    }>;
  };
  records: P1CellDataRecord[];
}

export interface PinnedLinkAuditReceipt {
  id: string;
  sheetRow: number;
  scholarshipName: string | null;
  role: LinkRole;
  representation: string;
  sanitizedUrl: string | null;
  method: string | null;
  hiddenBehindLabel: boolean;
  state: 'inconclusive' | 'offline';
  reason: string;
  requiresReview: boolean;
  reviewSeverity: ReviewSeverity | null;
  correctionEligible: false;
}

export interface PinnedLinkAudit {
  spreadsheetId: string;
  range: string;
  capturedAt: string;
  hyperlinkDenominator: number;
  retainedHyperlinks: number;
  excludedHyperlinks: number;
  informationHyperlinks: number;
  applicationHyperlinks: number;
  hiddenInformationHyperlinks: number;
  hiddenApplicationHyperlinks: number;
  offlineMethodDenominator: number;
  outcomeDenominator: number;
  outcomes: PinnedLinkAuditReceipt[];
}

function receiptId(parts: unknown[]): string {
  return `p4_${createHash('sha256').update(JSON.stringify([VERIFICATION_SCHEMA_VERSION, ...parts])).digest('hex')}`;
}

export function auditPinnedCellData(fixture: P1CellDataFixture): PinnedLinkAudit {
  const outcomes: PinnedLinkAuditReceipt[] = [];
  let retained = 0;
  let information = 0;
  let application = 0;
  let hiddenInformation = 0;
  let hiddenApplication = 0;

  for (const record of fixture.records) {
    for (const role of ['information', 'application'] as const) {
      const cell = record[role];
      for (const reference of cell.urls) {
        const hidden = !reference.provenance.includes('formattedValue');
        for (const representation of reference.provenance.filter((value) => value.startsWith('cellData.'))) {
          retained += 1;
          if (role === 'information') {
            information += 1;
            if (hidden) hiddenInformation += 1;
          } else {
            application += 1;
            if (hidden) hiddenApplication += 1;
          }
          outcomes.push({
            id: receiptId(['cell-data', record.sheetRow, role, reference.sanitizedUrl, representation]),
            sheetRow: record.sheetRow,
            scholarshipName: record.scholarshipName,
            role,
            representation,
            sanitizedUrl: reference.sanitizedUrl,
            method: null,
            hiddenBehindLabel: hidden,
            state: 'inconclusive',
            reason: 'Pinned historical CellData representation is accounted for but was not refetched by the deterministic fixture run',
            requiresReview: true,
            reviewSeverity: role === 'application' ? 'high' : 'medium',
            correctionEligible: false,
          });
        }
      }
    }
    if (record.information.urls.length === 0 && record.application.urls.length === 0 && record.application.display.trim()) {
      outcomes.push({
        id: receiptId(['offline', record.sheetRow, record.application.display]),
        sheetRow: record.sheetRow,
        scholarshipName: record.scholarshipName,
        role: 'offline',
        representation: 'explicit_application_method',
        sanitizedUrl: null,
        method: record.application.display,
        hiddenBehindLabel: false,
        state: 'offline',
        reason: 'Explicit offline or institution-handled application method is preserved as a method, not treated as a missing link',
        requiresReview: false,
        reviewSeverity: null,
        correctionEligible: false,
      });
    }
  }

  for (const [index, excluded] of fixture.boundedCompleteness.excludedColumnHyperlinkReviewItems.entries()) {
    outcomes.push({
      id: receiptId(['excluded', index, excluded.sheetRow, excluded.columnIndex, excluded.form, excluded.sanitizedUrl]),
      sheetRow: excluded.sheetRow,
      scholarshipName: null,
      role: 'excluded',
      representation: excluded.form,
      sanitizedUrl: excluded.sanitizedUrl,
      method: null,
      hiddenBehindLabel: true,
      state: 'inconclusive',
      reason: excluded.reason,
      requiresReview: true,
      reviewSeverity: 'medium',
      correctionEligible: false,
    });
  }

  const expected = fixture.boundedCompleteness.hyperlinkRepresentations;
  if (retained !== expected.retainedSourceColumns) throw new Error(`Retained CellData denominator mismatch: ${retained} != ${expected.retainedSourceColumns}`);
  if (information !== fixture.boundedCompleteness.retainedSourceColumnBindings.informationColumn.metadataRepresentations) throw new Error('Information CellData denominator mismatch');
  if (application !== fixture.boundedCompleteness.retainedSourceColumnBindings.applicationColumn.metadataRepresentations) throw new Error('Application CellData denominator mismatch');
  const hyperlinkOutcomes = outcomes.filter((item) => item.role !== 'offline').length;
  if (hyperlinkOutcomes !== expected.totalMetadataRepresentations) throw new Error(`Total CellData denominator mismatch: ${hyperlinkOutcomes} != ${expected.totalMetadataRepresentations}`);
  const offlineMethodDenominator = outcomes.filter((item) => item.role === 'offline').length;
  return {
    spreadsheetId: fixture.capture.spreadsheetId,
    range: fixture.capture.range,
    capturedAt: fixture.capture.capturedAt,
    hyperlinkDenominator: expected.totalMetadataRepresentations,
    retainedHyperlinks: retained,
    excludedHyperlinks: expected.excludedColumns,
    informationHyperlinks: information,
    applicationHyperlinks: application,
    hiddenInformationHyperlinks: hiddenInformation,
    hiddenApplicationHyperlinks: hiddenApplication,
    offlineMethodDenominator,
    outcomeDenominator: outcomes.length,
    outcomes,
  };
}

export type DatePrecision = 'exact_datetime' | 'date_only' | 'month_only' | 'annual_rule' | 'rolling' | 'approximate' | 'unknown';
export type DateParseState = 'parsed' | 'unknown' | 'invalid';
export type CycleStatus = 'active' | 'closed' | 'upcoming' | 'unavailable' | 'unknown';

export interface TypedDateInput {
  raw: string | number | null;
  timezone?: string | null;
}

export interface TypedDateResult {
  raw: string | number | null;
  parseState: DateParseState;
  opensAt: string | null;
  closesAt: string | null;
  year: number | null;
  precision: DatePrecision;
  timezone: string | null;
  recurrence: 'annual' | 'one_time' | 'rolling' | 'irregular' | 'unknown';
  reason: string;
}

const MONTHS: Record<string, number> = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4,
  may: 5, jun: 6, june: 6, jul: 7, july: 7, aug: 8, august: 8, sep: 9,
  sept: 9, september: 9, oct: 10, october: 10, nov: 11, november: 11,
  dec: 12, december: 12,
};

function validDate(year: number, month: number, day: number): boolean {
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function isoDate(year: number, month: number, day: number): string {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

interface DatePoint {
  value: string | null;
  year: number | null;
  precision: DatePrecision;
  state: DateParseState;
}

function parseDatePoint(raw: string): DatePoint {
  const value = raw.trim().replace(/^(?:opens?|closes?|deadline|due)\s*:?\s*/i, '').trim();
  const exact = value.match(/^(\d{4})-(\d{2})-(\d{2})T.+(?:Z|[+-]\d{2}:\d{2})$/);
  if (exact) {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? { value: null, year: null, precision: 'unknown', state: 'invalid' }
      : { value, year: Number(exact[1]), precision: 'exact_datetime', state: 'parsed' };
  }
  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    const [year, month, day] = iso.slice(1).map(Number);
    return validDate(year, month, day)
      ? { value: isoDate(year, month, day), year, precision: 'date_only', state: 'parsed' }
      : { value: null, year: null, precision: 'unknown', state: 'invalid' };
  }
  const numeric = value.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2}|\d{4}))?$/);
  if (numeric) {
    const month = Number(numeric[1]);
    const day = Number(numeric[2]);
    const year = numeric[3] ? (numeric[3].length === 2 ? 2000 + Number(numeric[3]) : Number(numeric[3])) : null;
    if (year === null) return month >= 1 && month <= 12 && day >= 1 && day <= 31
      ? { value: `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`, year: null, precision: 'annual_rule', state: 'parsed' }
      : { value: null, year: null, precision: 'unknown', state: 'invalid' };
    return validDate(year, month, day)
      ? { value: isoDate(year, month, day), year, precision: 'date_only', state: 'parsed' }
      : { value: null, year: null, precision: 'unknown', state: 'invalid' };
  }
  const monthDay = value.match(/^([A-Za-z]+)\.?\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s+(\d{4}))?$/);
  if (monthDay) {
    const month = MONTHS[monthDay[1].toLowerCase()];
    const day = Number(monthDay[2]);
    const year = monthDay[3] ? Number(monthDay[3]) : null;
    if (!month || day < 1 || day > 31) return { value: null, year: null, precision: 'unknown', state: 'invalid' };
    if (year === null) return { value: `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`, year: null, precision: 'annual_rule', state: 'parsed' };
    return validDate(year, month, day)
      ? { value: isoDate(year, month, day), year, precision: 'date_only', state: 'parsed' }
      : { value: null, year: null, precision: 'unknown', state: 'invalid' };
  }
  const dayMonth = value.match(/^(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)\.?(?:,?\s+(\d{4}))?$/);
  if (dayMonth) return parseDatePoint(`${dayMonth[2]} ${dayMonth[1]}${dayMonth[3] ? ` ${dayMonth[3]}` : ''}`);
  const monthOnly = value.match(/^([A-Za-z]+)(?:\s+(\d{4}))?$/);
  if (monthOnly && MONTHS[monthOnly[1].toLowerCase()]) {
    const month = MONTHS[monthOnly[1].toLowerCase()];
    const year = monthOnly[2] ? Number(monthOnly[2]) : null;
    return { value: year ? `${year}-${String(month).padStart(2, '0')}` : String(month).padStart(2, '0'), year, precision: 'month_only', state: 'parsed' };
  }
  return { value: null, year: null, precision: 'unknown', state: 'unknown' };
}

function cleanRangeEndpoint(raw: string): string {
  return raw
    .trim()
    .replace(/[ ]*\([ ]*(?:opens?|closes?)[ ]*\)[ ]*$/i, '')
    .replace(/^\(?\s*(?:opens?|closes?)\s*:?[ ]*/i, '')
    .replace(/[ ]*\)?[ ]*$/i, '')
    .trim();
}

export function parseTypedDate(input: TypedDateInput): TypedDateResult {
  const timezone = input.timezone ?? null;
  if (input.raw === null || (typeof input.raw === 'string' && !input.raw.trim())) {
    return { raw: input.raw, parseState: 'unknown', opensAt: null, closesAt: null, year: null, precision: 'unknown', timezone, recurrence: 'unknown', reason: 'No date value supplied' };
  }
  if (typeof input.raw === 'number') {
    if (!Number.isFinite(input.raw) || input.raw < 1 || input.raw > 200000) {
      return { raw: input.raw, parseState: 'invalid', opensAt: null, closesAt: null, year: null, precision: 'unknown', timezone, recurrence: 'unknown', reason: 'Spreadsheet serial is outside the supported date range' };
    }
    const epoch = Date.UTC(1899, 11, 30);
    const date = new Date(epoch + Math.floor(input.raw) * 86_400_000);
    const value = isoDate(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
    return { raw: input.raw, parseState: 'parsed', opensAt: null, closesAt: value, year: date.getUTCFullYear(), precision: 'date_only', timezone, recurrence: 'one_time', reason: 'Parsed Google Sheets serial using the 1899-12-30 epoch' };
  }

  const raw = input.raw.trim();
  if (/\b(rolling|ongoing|year[ -]?round|continuous)\b/i.test(raw)) {
    return { raw: input.raw, parseState: 'parsed', opensAt: null, closesAt: null, year: null, precision: 'rolling', timezone, recurrence: 'rolling', reason: 'Rolling rule preserved without inventing a deadline' };
  }
  if (/\b(unknown|tbd|to be determined|check (?:the )?site)\b/i.test(raw)) {
    return { raw: input.raw, parseState: 'unknown', opensAt: null, closesAt: null, year: null, precision: 'unknown', timezone, recurrence: 'unknown', reason: 'Explicit unknown date state preserved' };
  }
  if (/\b(early|mid|late|about|around|approximately|approx\.?|spring|summer|fall|winter)\b/i.test(raw)) {
    const year = raw.match(/\b(20\d{2})\b/)?.[1];
    return { raw: input.raw, parseState: 'parsed', opensAt: null, closesAt: year ?? null, year: year ? Number(year) : null, precision: 'approximate', timezone, recurrence: /annual/i.test(raw) ? 'annual' : 'unknown', reason: 'Approximate date text preserved without day-level precision' };
  }

  const withoutAnnualPrefix = raw.replace(/^annual\b\s*(?:[:—–-]\s*)?/i, '').trim();
  const openOnly = withoutAnnualPrefix.match(/^opens?\s*:?\s*(.+)$/i);
  if (openOnly && !/\bcloses?\b/i.test(withoutAnnualPrefix)) {
    const point = parseDatePoint(cleanRangeEndpoint(openOnly[1]));
    if (point.state !== 'parsed') {
      return { raw: input.raw, parseState: point.state, opensAt: null, closesAt: null, year: null, precision: 'unknown', timezone, recurrence: 'unknown', reason: 'Open-only date could not be parsed without inference' };
    }
    return {
      raw: input.raw,
      parseState: 'parsed',
      opensAt: point.value,
      closesAt: null,
      year: point.year,
      precision: point.precision,
      timezone,
      recurrence: point.precision === 'annual_rule' ? 'annual' : 'one_time',
      reason: 'Open date preserved separately; no deadline or close date was invented',
    };
  }
  const labeledRange = withoutAnnualPrefix.match(/^\(?\s*opens?\s+(.+?)\)?\s+closes?\s+(.+)$/i);
  const range = labeledRange ?? withoutAnnualPrefix.match(/^(.+?)\s+(?:-|–|—|to|through)\s+(.+)$/i);
  if (range) {
    const start = parseDatePoint(cleanRangeEndpoint(range[1]));
    const end = parseDatePoint(cleanRangeEndpoint(range[2]));
    if (start.state !== 'parsed' || end.state !== 'parsed') {
      return { raw: input.raw, parseState: start.state === 'invalid' || end.state === 'invalid' ? 'invalid' : 'unknown', opensAt: null, closesAt: null, year: null, precision: 'unknown', timezone, recurrence: 'unknown', reason: 'Date range could not be parsed without inference' };
    }
    const year = end.year ?? start.year;
    const precision: DatePrecision = start.precision === end.precision ? start.precision : 'approximate';
    return { raw: input.raw, parseState: 'parsed', opensAt: start.value, closesAt: end.value, year, precision, timezone, recurrence: start.year === null && end.year === null ? 'annual' : 'one_time', reason: 'Typed range preserved as separate open and close facts' };
  }

  const point = parseDatePoint(withoutAnnualPrefix);
  if (point.state !== 'parsed') {
    return { raw: input.raw, parseState: point.state, opensAt: null, closesAt: null, year: null, precision: 'unknown', timezone, recurrence: 'unknown', reason: point.state === 'invalid' ? 'Invalid calendar date rejected' : 'Unrecognized date text preserved as unknown' };
  }
  const recurrence = point.precision === 'annual_rule' || /^annual\b/i.test(raw) ? 'annual' : 'one_time';
  return { raw: input.raw, parseState: 'parsed', opensAt: null, closesAt: point.value, year: point.year, precision: point.precision, timezone, recurrence, reason: 'Typed date preserved at observed precision' };
}

function localDate(asOf: string, timezone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(asOf));
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function deriveCycleStatus(
  parsed: TypedDateResult,
  asOf: string,
  options: { availabilityConfirmed: boolean; unavailable: boolean; defaultTimezone: string },
): CycleStatus {
  if (options.unavailable) return 'unavailable';
  if (parsed.parseState !== 'parsed') return 'unknown';
  if (parsed.precision === 'rolling') return options.availabilityConfirmed ? 'active' : 'unknown';
  if (parsed.precision === 'annual_rule' || parsed.precision === 'month_only' || parsed.precision === 'approximate') return 'unknown';
  const timezone = parsed.timezone ?? options.defaultTimezone;
  const today = localDate(asOf, timezone);
  if (parsed.opensAt && parsed.closesAt && parsed.opensAt.length === 10 && parsed.closesAt.length === 10) {
    if (today < parsed.opensAt) return 'upcoming';
    if (today > parsed.closesAt) return 'closed';
    return options.availabilityConfirmed ? 'active' : 'unknown';
  }
  if (parsed.closesAt?.includes('T')) {
    const close = new Date(parsed.closesAt).getTime();
    if (!Number.isFinite(close)) return 'unknown';
    if (new Date(asOf).getTime() > close) return 'closed';
    return options.availabilityConfirmed ? 'active' : 'unknown';
  }
  if (parsed.closesAt?.length === 10) {
    if (today > parsed.closesAt) return 'closed';
    return options.availabilityConfirmed ? 'active' : 'unknown';
  }
  return 'unknown';
}

export type VerifiedField = 'deadline' | 'amount' | 'eligibility' | 'application_method';
export type SourceAuthority = 'official_child' | 'official_provider' | 'official_application' | 'official_parent' | 'institutional' | 'government' | 'official_document' | 'aggregator' | 'unknown';

export interface FieldClaim {
  id: string;
  subjectId: string;
  field: VerifiedField;
  value: string;
  sourceUrl: string;
  authority: SourceAuthority;
  direct: boolean;
  retrievedAt: string;
  sourceUpdatedAt: string | null;
  sourceRevision: string | null;
}

export interface FreshnessPolicy {
  retrievalMaxAgeDays: number;
  sourceMaxAgeDays: number;
}

export const FRESHNESS_POLICIES: Record<VerifiedField, FreshnessPolicy> = {
  deadline: { retrievalMaxAgeDays: 45, sourceMaxAgeDays: 400 },
  amount: { retrievalMaxAgeDays: 90, sourceMaxAgeDays: 400 },
  eligibility: { retrievalMaxAgeDays: 120, sourceMaxAgeDays: 400 },
  application_method: { retrievalMaxAgeDays: 60, sourceMaxAgeDays: 400 },
};

export const SOURCE_AUTHORITY_MATRIX: Record<SourceAuthority, { rank: number; official: boolean; description: string }> = {
  official_child: { rank: 100, official: true, description: 'Current child-specific provider detail' },
  official_application: { rank: 95, official: true, description: 'Official application instructions or workflow' },
  government: { rank: 92, official: true, description: 'Government authority for its own program' },
  official_provider: { rank: 90, official: true, description: 'Official provider page' },
  institutional: { rank: 85, official: true, description: 'Responsible institution page' },
  official_parent: { rank: 75, official: true, description: 'Official parent summary; lower than child detail' },
  official_document: { rank: 70, official: true, description: 'Official document; freshness and parent conflicts require review' },
  aggregator: { rank: 10, official: false, description: 'Discovery-only third party' },
  unknown: { rank: 0, official: false, description: 'Unclassified authority' },
};

export interface FieldEvidenceReceipt {
  id: string;
  claimId: string;
  subjectId: string;
  field: VerifiedField;
  value: string;
  sourceUrl: string;
  authority: SourceAuthority;
  authorityRank: number;
  direct: boolean;
  retrievedAt: string;
  sourceUpdatedAt: string | null;
  sourceRevision: string | null;
  retrievalAgeDays: number;
  sourceAgeDays: number | null;
  fresh: boolean;
  currentDirectOfficial: boolean;
  contentSha256: string;
}

export interface FieldDecision {
  subjectId: string;
  field: VerifiedField;
  accepted: boolean;
  preferredValue: string | null;
  conflict: boolean;
  reason: string;
  evidenceIds: string[];
  reviewRequired: boolean;
  reviewSeverity: ReviewSeverity | null;
}

function ageDays(asOf: string, value: string): number {
  return Math.floor((new Date(asOf).getTime() - new Date(value).getTime()) / 86_400_000);
}

function normalizeClaim(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

export function buildFieldEvidenceReceipt(claim: FieldClaim, asOf: string): FieldEvidenceReceipt {
  const policy = FRESHNESS_POLICIES[claim.field];
  const retrievalAgeDays = ageDays(asOf, claim.retrievedAt);
  const sourceAgeDays = claim.sourceUpdatedAt ? ageDays(asOf, claim.sourceUpdatedAt) : null;
  const validAges = retrievalAgeDays >= 0 && retrievalAgeDays <= policy.retrievalMaxAgeDays
    && (sourceAgeDays === null || (sourceAgeDays >= 0 && sourceAgeDays <= policy.sourceMaxAgeDays));
  const authority = SOURCE_AUTHORITY_MATRIX[claim.authority];
  const contentSha256 = createHash('sha256').update(JSON.stringify({
    schemaVersion: VERIFICATION_SCHEMA_VERSION,
    claimId: claim.id,
    subjectId: claim.subjectId,
    field: claim.field,
    value: claim.value,
    sourceUrl: claim.sourceUrl,
    authority: claim.authority,
    direct: claim.direct,
    retrievedAt: claim.retrievedAt,
    sourceUpdatedAt: claim.sourceUpdatedAt,
    sourceRevision: claim.sourceRevision,
  })).digest('hex');
  return {
    id: receiptId(['field-evidence', claim.id, contentSha256]),
    claimId: claim.id,
    subjectId: claim.subjectId,
    field: claim.field,
    value: claim.value,
    sourceUrl: claim.sourceUrl,
    authority: claim.authority,
    authorityRank: authority.rank,
    direct: claim.direct,
    retrievedAt: claim.retrievedAt,
    sourceUpdatedAt: claim.sourceUpdatedAt,
    sourceRevision: claim.sourceRevision,
    retrievalAgeDays,
    sourceAgeDays,
    fresh: validAges,
    currentDirectOfficial: validAges && authority.official && claim.direct,
    contentSha256,
  };
}

export function evaluateFieldClaims(claims: FieldClaim[], asOf: string): { receipts: FieldEvidenceReceipt[]; decisions: FieldDecision[] } {
  const receipts = claims.map((claim) => buildFieldEvidenceReceipt(claim, asOf));
  const groups = new Map<string, FieldEvidenceReceipt[]>();
  for (const receipt of receipts) {
    const key = `${receipt.subjectId}\u0000${receipt.field}`;
    groups.set(key, [...(groups.get(key) ?? []), receipt]);
  }
  const decisions: FieldDecision[] = [];
  for (const group of groups.values()) {
    const currentOfficial = group.filter((item) => item.currentDirectOfficial);
    const values = new Set(group.map((item) => normalizeClaim(item.value)));
    const conflict = values.size > 1;
    const highestRank = currentOfficial.length ? Math.max(...currentOfficial.map((item) => item.authorityRank)) : -1;
    const preferredCandidates = currentOfficial.filter((item) => item.authorityRank === highestRank);
    const preferredValues = new Set(preferredCandidates.map((item) => normalizeClaim(item.value)));
    const preferredValue = preferredValues.size === 1 ? preferredCandidates[0].value : null;
    const accepted = currentOfficial.length > 0 && !conflict && preferredValue !== null;
    const allStale = group.every((item) => !item.fresh);
    const onlyNonOfficial = currentOfficial.length === 0 && group.some((item) => item.fresh);
    decisions.push({
      subjectId: group[0].subjectId,
      field: group[0].field,
      accepted,
      preferredValue,
      conflict,
      reason: accepted
        ? 'Accepted only from current direct official evidence with no conflicting claim'
        : conflict
          ? 'Conflicting field claims require manual review even when an authority rule identifies a preferred source'
          : allStale
            ? 'All evidence is stale under the field freshness policy'
            : onlyNonOfficial
              ? 'No current direct official evidence supports acceptance'
              : 'Evidence is incomplete or indirect and requires review',
      evidenceIds: group.map((item) => item.id).sort(),
      reviewRequired: !accepted,
      reviewSeverity: !accepted ? (group[0].field === 'deadline' || group[0].field === 'application_method' ? 'high' : 'medium') : null,
    });
  }
  decisions.sort((left, right) => `${left.subjectId}:${left.field}`.localeCompare(`${right.subjectId}:${right.field}`));
  return { receipts: receipts.sort((left, right) => left.id.localeCompare(right.id)), decisions };
}

export function deterministicVerificationSha256(value: unknown): string {
  return createHash('sha256').update(`${JSON.stringify(value, null, 2)}\n`).digest('hex');
}
