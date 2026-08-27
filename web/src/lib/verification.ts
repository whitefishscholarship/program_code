import { createHash } from 'node:crypto';
import { z } from 'zod';
import { canonicalizeAcquisitionUrl } from './acquisition';
import {
  EvidenceSchema,
  MODEL_SCHEMA_VERSION,
  SourceSchema,
  evidenceId,
  sha256Text,
} from './canonicalModel';

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
  if (observation.status === null || observation.status < 200 || observation.status >= 300 || observation.finalUrl === null) {
    return {
      ...base,
      state: 'inconclusive',
      targetClass: 'unknown',
      reason: observation.status === null
        ? 'No HTTP response was observed'
        : observation.finalUrl === null
          ? `HTTP ${observation.status} lacked a verified final target`
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
  const unknownTarget = targetClass === 'unknown';
  const softApplicationRedirect = observation.role === 'application' && redirected && targetClass === 'html'
    && !observation.markers.includes('application_form');
  const requiresReview = (redirected && redirectKind === 'off_host') || unknownTarget || softApplicationRedirect;
  return {
    ...base,
    state,
    targetClass,
    reason: redirected
      ? `Reachable final target observed via ${redirectKind.replace('_', '-')} redirect`
      : 'Reachable target observed; this alone does not verify any scholarship fact',
    requiresReview,
    reviewSeverity: requiresReview ? linkSeverity(observation.role, state) : null,
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
    const milliseconds = Math.round(input.raw * 86_400_000);
    const date = new Date(epoch + milliseconds);
    const datePart = isoDate(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
    if (!Number.isInteger(input.raw)) {
      if (!timezone) {
        return { raw: input.raw, parseState: 'unknown', opensAt: null, closesAt: null, year: null, precision: 'unknown', timezone, recurrence: 'unknown', reason: 'Fractional spreadsheet serial requires a timezone to preserve its observed time' };
      }
      const timePart = `${String(date.getUTCHours()).padStart(2, '0')}:${String(date.getUTCMinutes()).padStart(2, '0')}:${String(date.getUTCSeconds()).padStart(2, '0')}`;
      return { raw: input.raw, parseState: 'parsed', opensAt: null, closesAt: `${datePart}T${timePart}`, year: date.getUTCFullYear(), precision: 'exact_datetime', timezone, recurrence: 'one_time', reason: 'Parsed Google Sheets fractional serial and preserved its local wall time with the supplied timezone' };
    }
    return { raw: input.raw, parseState: 'parsed', opensAt: null, closesAt: datePart, year: date.getUTCFullYear(), precision: 'date_only', timezone, recurrence: 'one_time', reason: 'Parsed Google Sheets serial using the 1899-12-30 epoch' };
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

  const explicitlyAnnual = /^annual\b/i.test(raw);
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
    return { raw: input.raw, parseState: 'parsed', opensAt: start.value, closesAt: end.value, year, precision, timezone, recurrence: explicitlyAnnual || (start.year === null && end.year === null) ? 'annual' : 'one_time', reason: 'Typed range preserved as separate open and close facts' };
  }

  const point = parseDatePoint(withoutAnnualPrefix);
  if (point.state !== 'parsed') {
    return { raw: input.raw, parseState: point.state, opensAt: null, closesAt: null, year: null, precision: 'unknown', timezone, recurrence: 'unknown', reason: point.state === 'invalid' ? 'Invalid calendar date rejected' : 'Unrecognized date text preserved as unknown' };
  }
  const recurrence = point.precision === 'annual_rule' || /^annual\b/i.test(raw) ? 'annual' : 'one_time';
  return { raw: input.raw, parseState: 'parsed', opensAt: null, closesAt: point.value, year: point.year, precision: point.precision, timezone, recurrence, reason: 'Typed date preserved at observed precision' };
}

function localDate(asOf: string, timezone: string): string | null {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(asOf));
    const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? '';
    return `${part('year')}-${part('month')}-${part('day')}`;
  } catch {
    return null;
  }
}

function zonedLocalDateTimeEpoch(value: string, timezone: string): number | null {
  if (/Z$|[+-]\d{2}:\d{2}$/.test(value)) {
    const epoch = new Date(value).getTime();
    return Number.isFinite(epoch) ? epoch : null;
  }
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/);
  if (!match) return null;
  const [, year, month, day, hour, minute, second] = match.map(Number);
  const wallClockUtc = Date.UTC(year, month - 1, day, hour, minute, second);
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
    });
    const matches: number[] = [];
    for (let epoch = wallClockUtc - 18 * 3_600_000; epoch <= wallClockUtc + 18 * 3_600_000; epoch += 15 * 60_000) {
      const parts = formatter.formatToParts(new Date(epoch));
      const part = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((item) => item.type === type)?.value);
      const represented = Date.UTC(part('year'), part('month') - 1, part('day'), part('hour'), part('minute'), part('second'));
      if (represented === wallClockUtc) matches.push(epoch);
    }
    return matches.length === 1 ? matches[0] : null;
  } catch {
    return null;
  }
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
  if (today === null) return 'unknown';
  if (parsed.opensAt && parsed.closesAt && parsed.opensAt.length === 10 && parsed.closesAt.length === 10) {
    if (today < parsed.opensAt) return 'upcoming';
    if (today > parsed.closesAt) return 'closed';
    return options.availabilityConfirmed ? 'active' : 'unknown';
  }
  if (parsed.precision === 'exact_datetime') {
    const asOfEpoch = new Date(asOf).getTime();
    const open = parsed.opensAt ? zonedLocalDateTimeEpoch(parsed.opensAt, timezone) : null;
    const close = parsed.closesAt ? zonedLocalDateTimeEpoch(parsed.closesAt, timezone) : null;
    if (!Number.isFinite(asOfEpoch) || (parsed.opensAt && open === null) || (parsed.closesAt && close === null)) return 'unknown';
    if (open !== null && asOfEpoch < open) return 'upcoming';
    if (close !== null && asOfEpoch > close) return 'closed';
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

const SourceRelationshipSchema = z.enum(['child_detail', 'parent_summary', 'direct', 'document', 'discovery']);

export function normalizeVerificationSourceUrl(raw: string): string {
  return canonicalizeAcquisitionUrl(raw).url;
}

const VerificationSubjectBindingSchema = z.object({
  subjectId: z.string().min(1),
  relationship: SourceRelationshipSchema,
  direct: z.boolean(),
  evidence: EvidenceSchema,
});

export const VerificationSourceInputSchema = z.object({
  key: z.string().min(1),
  source: SourceSchema,
  authorityEvidence: EvidenceSchema,
  subjectBindings: z.array(VerificationSubjectBindingSchema).min(1),
}).superRefine((input, ctx) => {
  if (input.source.canonicalUrl) {
    const canonical = canonicalizeAcquisitionUrl(input.source.canonicalUrl);
    if (
      input.source.canonicalUrl !== canonical.url ||
      JSON.stringify(input.source.identityPolicy.preservedQueryParameters) !== JSON.stringify(canonical.preservedQueryParameters) ||
      input.source.identityPolicy.fragmentPreserved !== canonical.fragmentPreserved
    ) {
      ctx.addIssue({ code: 'custom', message: 'Canonical source URL and identity policy must match the P2/P3 acquisition policy' });
    }
  }
  const expectedAuthorityClaim = `authority=${input.source.authority}`;
  const authority = input.authorityEvidence;
  const expectedAuthorityContent = sha256Text(JSON.stringify({
    sourceId: input.source.id,
    canonicalUrl: input.source.canonicalUrl,
    authority: input.source.authority,
  }));
  const expectedAuthorityId = evidenceId({
    subjectKind: 'source', subjectId: input.source.id, fieldPath: 'authority',
    sourceId: input.source.id, retrievedAt: authority.retrievedAt,
    sourceRevision: authority.sourceRevision, result: 'supported',
    claim: expectedAuthorityClaim, contentSha256: expectedAuthorityContent,
  });
  if (
    authority.subjectKind !== 'source' || authority.subjectId !== input.source.id ||
    authority.fieldPath !== 'authority' || authority.sourceId !== input.source.id ||
    authority.result !== 'supported' || authority.reviewerState !== 'classified' ||
    authority.claim !== expectedAuthorityClaim || authority.contentSha256 !== expectedAuthorityContent ||
    authority.id !== expectedAuthorityId || !input.source.evidenceIds.includes(authority.id)
  ) {
    ctx.addIssue({ code: 'custom', message: 'Source authority requires matching classified canonical Evidence' });
  }
  for (const binding of input.subjectBindings) {
    const evidence = binding.evidence;
    const expectedFieldPath = `sourceLinks.${input.source.id}.${binding.relationship}.${binding.direct ? 'direct' : 'indirect'}`;
    const expectedClaim = `sourceRelationship=${binding.relationship}`;
    const expectedContent = sha256Text(JSON.stringify({
      sourceId: input.source.id,
      subjectId: binding.subjectId,
      relationship: binding.relationship,
      direct: binding.direct,
    }));
    const expectedId = evidenceId({
      subjectKind: 'scholarship', subjectId: binding.subjectId,
      fieldPath: expectedFieldPath, sourceId: input.source.id,
      retrievedAt: evidence.retrievedAt, sourceRevision: evidence.sourceRevision,
      result: 'supported', claim: expectedClaim, contentSha256: expectedContent,
    });
    if (
      evidence.subjectKind !== 'scholarship' || evidence.subjectId !== binding.subjectId ||
      evidence.fieldPath !== expectedFieldPath || evidence.sourceId !== input.source.id ||
      evidence.result !== 'supported' || evidence.reviewerState !== 'classified' ||
      evidence.claim !== expectedClaim || evidence.contentSha256 !== expectedContent || evidence.id !== expectedId ||
      !input.source.evidenceIds.includes(evidence.id)
    ) {
      ctx.addIssue({ code: 'custom', message: `Subject ${binding.subjectId} requires matching classified canonical relationship Evidence` });
    }
  }
  if (new Set(input.subjectBindings.map((binding) => binding.subjectId)).size !== input.subjectBindings.length) {
    ctx.addIssue({ code: 'custom', message: 'Each source/subject pair requires exactly one non-conflicting relationship binding' });
  }
});

export const FieldClaimSchema = z.object({
  id: z.string().min(1),
  subjectId: z.string().min(1),
  field: z.enum(['deadline', 'amount', 'eligibility', 'application_method']),
  value: z.string().trim().min(1),
  sourceKey: z.string().min(1),
  retrievedAt: z.string().datetime({ offset: true }),
  sourceUpdatedAt: z.string().datetime({ offset: true }).nullable(),
  sourceRevision: z.string().min(1).nullable(),
});

export type VerificationSourceInput = z.infer<typeof VerificationSourceInputSchema>;
export type FieldClaim = z.infer<typeof FieldClaimSchema>;

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
  sourceId: string;
  sourceKey: string;
  sourceUrl: string;
  authority: SourceAuthority;
  authorityRank: number;
  direct: boolean;
  retrievedAt: string;
  sourceUpdatedAt: string | null;
  sourceRevision: string | null;
  retrievalAgeDays: number;
  sourceAgeDays: number | null;
  authorityEvidenceAgeDays: number;
  relationshipEvidenceAgeDays: number;
  provenanceFresh: boolean;
  fresh: boolean;
  currentDirectOfficial: boolean;
  contentSha256: string;
  canonicalEvidence: z.infer<typeof EvidenceSchema>;
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

function verificationAuthority(sourceInput: VerificationSourceInput, relationship: z.infer<typeof SourceRelationshipSchema>): SourceAuthority {
  if (relationship === 'child_detail' && sourceInput.source.authority === 'official_provider') return 'official_child';
  if (relationship === 'document' && sourceInput.source.authority === 'official_provider') return 'official_document';
  if (relationship === 'parent_summary' && (sourceInput.source.authority === 'official_provider' || sourceInput.source.authority === 'institutional')) return 'official_parent';
  return sourceInput.source.authority;
}

export function buildFieldEvidenceReceipt(claimValue: FieldClaim, sourceValue: VerificationSourceInput, asOf: string): FieldEvidenceReceipt {
  const claim = FieldClaimSchema.parse(claimValue);
  const sourceInput = VerificationSourceInputSchema.parse(sourceValue);
  if (sourceInput.key !== claim.sourceKey) throw new Error(`Field claim ${claim.id} source key does not match bound source ${sourceInput.key}`);
  const source = sourceInput.source;
  const subjectBinding = sourceInput.subjectBindings.find((binding) => binding.subjectId === claim.subjectId);
  if (!subjectBinding) throw new Error(`Field claim ${claim.id} lacks canonical source relationship evidence for ${claim.subjectId}`);
  const derivedAuthority = verificationAuthority(sourceInput, subjectBinding.relationship);
  const direct = subjectBinding.direct;
  const policy = FRESHNESS_POLICIES[claim.field];
  const retrievalAgeDays = ageDays(asOf, claim.retrievedAt);
  const sourceAgeDays = claim.sourceUpdatedAt ? ageDays(asOf, claim.sourceUpdatedAt) : null;
  const authorityEvidenceAgeDays = ageDays(asOf, sourceInput.authorityEvidence.retrievedAt);
  const relationshipEvidenceAgeDays = ageDays(asOf, subjectBinding.evidence.retrievedAt);
  const provenanceFresh = authorityEvidenceAgeDays >= 0 && authorityEvidenceAgeDays <= policy.sourceMaxAgeDays
    && relationshipEvidenceAgeDays >= 0 && relationshipEvidenceAgeDays <= policy.sourceMaxAgeDays;
  const validAges = retrievalAgeDays >= 0 && retrievalAgeDays <= policy.retrievalMaxAgeDays
    && (sourceAgeDays === null || (sourceAgeDays >= 0 && sourceAgeDays <= policy.sourceMaxAgeDays));
  const authority = SOURCE_AUTHORITY_MATRIX[derivedAuthority];
  const contentSha256 = sha256Text(JSON.stringify({
    schemaVersion: VERIFICATION_SCHEMA_VERSION,
    subjectId: claim.subjectId,
    field: claim.field,
    value: claim.value,
    sourceId: source.id,
    sourceUrl: source.canonicalUrl,
    sourceAuthority: source.authority,
    sourceRelationship: subjectBinding.relationship,
    sourceRelationshipEvidenceId: subjectBinding.evidence.id,
    sourceAuthorityEvidenceId: sourceInput.authorityEvidence.id,
    retrievedAt: claim.retrievedAt,
    sourceUpdatedAt: claim.sourceUpdatedAt,
    sourceRevision: claim.sourceRevision,
  }));
  const evidenceIdentity = {
    subjectKind: 'scholarship' as const,
    subjectId: claim.subjectId,
    fieldPath: claim.field,
    sourceId: source.id,
    retrievedAt: claim.retrievedAt,
    sourceRevision: claim.sourceRevision,
    result: validAges && provenanceFresh && authority.official && direct ? 'observed' as const : 'unverified' as const,
    claim: `${claim.field}=${claim.value}`,
    contentSha256,
  };
  const canonicalEvidence = EvidenceSchema.parse({
    schemaVersion: MODEL_SCHEMA_VERSION,
    id: evidenceId(evidenceIdentity),
    ...evidenceIdentity,
    reviewerState: validAges && provenanceFresh && authority.official && direct ? 'classified' : 'manual_review',
  });
  return {
    id: canonicalEvidence.id,
    claimId: claim.id,
    subjectId: claim.subjectId,
    field: claim.field,
    value: claim.value,
    sourceId: source.id,
    sourceKey: sourceInput.key,
    sourceUrl: source.canonicalUrl!,
    authority: derivedAuthority,
    authorityRank: authority.rank,
    direct,
    retrievedAt: claim.retrievedAt,
    sourceUpdatedAt: claim.sourceUpdatedAt,
    sourceRevision: claim.sourceRevision,
    retrievalAgeDays,
    sourceAgeDays,
    authorityEvidenceAgeDays,
    relationshipEvidenceAgeDays,
    provenanceFresh,
    fresh: validAges,
    currentDirectOfficial: validAges && provenanceFresh && authority.official && direct,
    contentSha256,
    canonicalEvidence,
  };
}

function assertUnique(values: string[], label: string): void {
  if (new Set(values).size !== values.length) throw new Error(`${label} must be unique`);
}

export function evaluateFieldClaims(claimValues: FieldClaim[], asOf: string, sourceValues: VerificationSourceInput[]): { receipts: FieldEvidenceReceipt[]; decisions: FieldDecision[] } {
  const claims = z.array(FieldClaimSchema).parse(claimValues);
  const sources = z.array(VerificationSourceInputSchema).parse(sourceValues);
  assertUnique(claims.map((claim) => claim.id), 'Field claim IDs');
  assertUnique(sources.map((source) => source.key), 'Verification source keys');
  const sourceByKey = new Map(sources.map((source) => [source.key, source]));
  const canonicalSources = sources.map((source) => source.source);
  assertUnique(canonicalSources.map((source) => source.id), 'Canonical verification source IDs');
  assertUnique(canonicalSources.map((source) => source.canonicalUrl ? canonicalizeAcquisitionUrl(source.canonicalUrl).url : `offline:${source.offlineAuthority}`), 'Canonical verification source URL identities');
  const receipts = claims.map((claim) => {
    const source = sourceByKey.get(claim.sourceKey);
    if (!source) throw new Error(`Field claim ${claim.id} references unknown source key ${claim.sourceKey}`);
    return buildFieldEvidenceReceipt(claim, source, asOf);
  });
  assertUnique(receipts.map((receipt) => receipt.id), 'Field evidence receipt IDs');
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
