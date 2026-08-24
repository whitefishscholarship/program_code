import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const ARCHITECTURES = [
  'single_award_page',
  'multi_award_page',
  'directory_hub',
  'paginated_catalog',
  'common_application',
  'matching_portal',
  'external_marketplace',
  'login_application_portal',
  'document_or_pdf',
  'form_only',
  'institution_umbrella',
  'offline_or_automatic',
  'unknown',
] as const;

export type Architecture = (typeof ARCHITECTURES)[number];
type Role = 'information' | 'application';

type UrlReference = {
  sourceReferenceIndex: number;
  sanitizedUrl: string;
  queryParameters: Array<{ name: string; identityPotential: boolean; valueRedacted: boolean }>;
  removedParameters: string[];
  redactedParameters: string[];
  fragmentPresent: boolean;
  provenance: string[];
};

type CapturedRecord = {
  sheetRow: number;
  currentLabel: string;
  scholarshipName: string;
  information: { display: string; urls: UrlReference[] };
  application: { display: string; urls: UrlReference[] };
};

export type CapturedFixture = {
  schemaVersion: number;
  capture: Record<string, unknown> & {
    capturedAt: string;
    spreadsheetId: string;
    spreadsheetRevisionId: string;
    sheetTitle: string;
    boundedRange: string;
  };
  sanitization: Record<string, unknown>;
  records: CapturedRecord[];
};

type SourceOccurrence = {
  row: number;
  role: Role;
  label: string;
  scholarshipName: string;
  reference: UrlReference;
};

type PublicObservation = {
  url: string;
  architecture: Architecture;
  observed: string;
  reviewState: 'observed' | 'manual_review';
};

type PublicObservationFixture = {
  schemaVersion: number;
  observedAt: string;
  method: string;
  limitations: string;
  observations: PublicObservation[];
};

const TRACKING_KEYS = new Set([
  'ouid', 'usp', 'rtpof', 'sd', 'gclid', 'fbclid', 'msclkid', 'mc_cid', 'mc_eid', '_gl', 'gad_source',
]);
const SENSITIVE_KEY = /^(access_?token|auth|authorization|code|credential|key|password|secret|signature|sig|token)$/i;

export function sha256(value: string | Buffer): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function sorted<T>(values: Iterable<T>, compare?: (a: T, b: T) => number): T[] {
  return [...values].sort(compare);
}

function normalizeUrl(raw: string, keepIdentity = true): string {
  try {
    const url = new URL(raw);
    url.protocol = url.protocol.toLowerCase();
    url.hostname = url.hostname.toLowerCase();
    if ((url.protocol === 'https:' && url.port === '443') || (url.protocol === 'http:' && url.port === '80')) {
      url.port = '';
    }
    for (const key of [...url.searchParams.keys()]) {
      const lower = key.toLowerCase();
      if (TRACKING_KEYS.has(lower) || lower.startsWith('utm_') || lower.startsWith('_ga')
        || lower.startsWith('_gcl_') || lower.startsWith('gad_')) url.searchParams.delete(key);
      if (SENSITIVE_KEY.test(lower)) url.searchParams.set(key, 'REDACTED');
    }
    if (!keepIdentity) {
      url.search = '';
      url.hash = '';
    }
    return url.toString();
  } catch {
    return raw.trim();
  }
}

function hostOf(raw: string): string {
  try {
    return new URL(raw).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return 'invalid-url';
  }
}

function isDocument(url: string): boolean {
  const lower = url.toLowerCase();
  return /\.pdf(?:$|[?#])/.test(lower)
    || /docs\.google\.com\/(?:document|presentation)\//.test(lower)
    || /drive\.google\.com\/file\//.test(lower);
}

function isForm(url: string): boolean {
  const lower = url.toLowerCase();
  return /docs\.google\.com\/forms\//.test(lower)
    || /forms\.office\.com\//.test(lower)
    || /surveymonkey\.com\//.test(lower)
    || /smartsheet\.com\/b\/form\//.test(lower)
    || /wufoo\.com\/forms\//.test(lower)
    || /racereach\.com\/form\//.test(lower)
    || /verintefm\.com\/se\//.test(lower)
    || /ninja-forms\//.test(lower);
}

function isLoginPortal(url: string): boolean {
  const lower = url.toLowerCase();
  return /(?:login|logon|sign_in|signup|secure-platform)/.test(lower)
    || /webportalapp\.com/.test(lower)
    || /grantinterface\.com/.test(lower)
    || /\.my\.site\.com/.test(lower)
    || /scholarsapply\.org/.test(lower)
    || /submittable\.com/.test(lower);
}

function sourceOverride(url: string, publicObservations: Map<string, PublicObservation>): Architecture | null {
  const exact = publicObservations.get(normalizeUrl(url));
  if (exact) return exact.architecture;
  const lower = url.toLowerCase();
  if (lower.includes('fvcc.academicworks.com')) return 'paginated_catalog';
  if (lower.includes('firstinspires.org/') && lower.includes('scholarship')) return 'external_marketplace';
  if (lower.includes('grantinterface.com') && lower.includes('urlkey=saf')) return 'matching_portal';
  if (lower.includes('reachhighermontana.org/') && lower.includes('scholarship')) return 'matching_portal';
  if (lower.includes('apply.mykaleidoscope.com/program/esafoundationscholarship')) return 'common_application';
  return null;
}

function classifySource(
  url: string,
  occurrences: SourceOccurrence[],
  publicObservations: Map<string, PublicObservation>,
): Architecture {
  const override = sourceOverride(url, publicObservations);
  if (override) return override;
  const roles = new Set(occurrences.map((item) => item.role));
  const rows = new Set(occurrences.map((item) => item.row));
  const labels = new Set(occurrences.map((item) => item.label));
  const lower = url.toLowerCase();

  if (isDocument(url)) return 'document_or_pdf';
  if (/academicworks\.com/.test(lower)) return 'paginated_catalog';
  if (/scholarshipinstitute\.org|futures\.pearson\.com/.test(lower)) return 'external_marketplace';
  if (roles.has('application') && rows.size > 1) return 'common_application';
  if (roles.has('information') && rows.size > 1) return 'multi_award_page';
  if (isForm(url)) return 'form_only';
  if (isLoginPortal(url)) return 'login_application_portal';
  if ([...labels].includes('Portal')) return 'directory_hub';
  if (/montana\.edu\/admissions\/scholarships|umontana\.edu\/how-to-apply\/scholarships|fvcc\.edu\/.*scholarships/.test(lower)) {
    return 'institution_umbrella';
  }
  if (roles.size === 1 && roles.has('application')) return 'unknown';
  return 'single_award_page';
}

function recordArchitecture(
  record: CapturedRecord,
  sourceArchitectureByUrl: Map<string, Architecture>,
): Architecture {
  const urls = [...record.information.urls, ...record.application.urls].map((ref) => normalizeUrl(ref.sanitizedUrl));
  if (urls.length === 0) return 'offline_or_automatic';
  const architectures = new Set(urls.map((url) => sourceArchitectureByUrl.get(url) ?? 'unknown'));
  const name = record.scholarshipName.toLowerCase();

  if (name.includes('reach higher montana')) return 'matching_portal';
  if (name.includes('fvcc institutional')) return 'paginated_catalog';
  if (name.includes('first scholarship portal')) return 'external_marketplace';
  if (name.includes('national farmers union')) return 'common_application';
  if (name.includes('esa foundation')) return 'common_application';

  const priority: Architecture[] = [
    'matching_portal', 'paginated_catalog', 'external_marketplace', 'common_application',
    'multi_award_page', 'institution_umbrella', 'directory_hub', 'login_application_portal',
    'document_or_pdf', 'form_only', 'single_award_page', 'unknown',
  ];
  if (record.currentLabel === 'Portal') {
    return priority.find((type) => architectures.has(type)) ?? 'directory_hub';
  }
  if (architectures.size === 1) return architectures.values().next().value ?? 'unknown';
  return priority.find((type) => architectures.has(type)) ?? 'unknown';
}

function stableRecordIdentity(record: CapturedRecord, revisionId: string): string {
  return sha256(`${revisionId}\n${record.sheetRow}\n${record.currentLabel}\n${record.scholarshipName}`);
}

function addCount(map: Map<string, number>, key: string): void {
  map.set(key, (map.get(key) ?? 0) + 1);
}

function mapCounts(map: Map<string, number>): Array<{ value: string; count: number }> {
  return sorted(map.entries(), (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([value, count]) => ({ value, count }));
}

function countHiddenCells(records: CapturedRecord[], role: Role): number {
  return records.filter((record) => {
    const cell = role === 'information' ? record.information : record.application;
    return cell.urls.some((reference) =>
      reference.provenance.includes('cellData.hyperlink')
      && !reference.provenance.includes('formattedValue'));
  }).length;
}

export function buildInventory(fixture: CapturedFixture, observations: PublicObservationFixture) {
  if (fixture.schemaVersion !== 1 || observations.schemaVersion !== 1) {
    throw new Error('Unsupported P1 fixture schema');
  }
  const expectedRows = fixture.records.length;
  const sheetRows = new Set(fixture.records.map((record) => record.sheetRow));
  if (sheetRows.size !== expectedRows) throw new Error('Duplicate sheet row in capture');

  const occurrences: SourceOccurrence[] = [];
  for (const record of fixture.records) {
    for (const reference of record.information.urls) {
      occurrences.push({ row: record.sheetRow, role: 'information', label: record.currentLabel, scholarshipName: record.scholarshipName, reference });
    }
    for (const reference of record.application.urls) {
      occurrences.push({ row: record.sheetRow, role: 'application', label: record.currentLabel, scholarshipName: record.scholarshipName, reference });
    }
  }

  const groupedSources = new Map<string, SourceOccurrence[]>();
  for (const occurrence of occurrences) {
    const identity = normalizeUrl(occurrence.reference.sanitizedUrl);
    const group = groupedSources.get(identity) ?? [];
    group.push(occurrence);
    groupedSources.set(identity, group);
  }
  const publicObservationMap = new Map(observations.observations.map((item) => [normalizeUrl(item.url), item]));
  const sourceArchitectureByUrl = new Map<string, Architecture>();
  for (const [url, group] of groupedSources) {
    sourceArchitectureByUrl.set(url, classifySource(url, group, publicObservationMap));
  }

  const recordArchitectures = new Map<string, number>();
  const records = fixture.records.map((record) => {
    const architecture = recordArchitecture(record, sourceArchitectureByUrl);
    addCount(recordArchitectures, architecture);
    const references = [
      ...record.information.urls.map((ref) => ({ role: 'information' as const, urlIdentity: normalizeUrl(ref.sanitizedUrl), provenance: ref.provenance })),
      ...record.application.urls.map((ref) => ({ role: 'application' as const, urlIdentity: normalizeUrl(ref.sanitizedUrl), provenance: ref.provenance })),
    ];
    return {
      rowIdentity: stableRecordIdentity(record, fixture.capture.spreadsheetRevisionId),
      sheetRow: record.sheetRow,
      currentLabel: record.currentLabel,
      scholarshipName: record.scholarshipName,
      architecture,
      reviewState: architecture === 'unknown' ? 'manual_review' : 'classified',
      explicitApplicationMethod: references.length === 0 ? record.application.display : null,
      references,
    };
  });

  const hostCounts = new Map<string, number>();
  const sourceArchitectureCounts = new Map<string, number>();
  const sources = sorted(groupedSources.entries(), (a, b) => a[0].localeCompare(b[0])).map(([url, group]) => {
    const architecture = sourceArchitectureByUrl.get(url) ?? 'unknown';
    addCount(sourceArchitectureCounts, architecture);
    addCount(hostCounts, hostOf(url));
    const rows = sorted(new Set(group.map((item) => item.row)), (a, b) => a - b);
    const roles = sorted(new Set(group.map((item) => item.role)));
    const queryParameters = sorted(new Set(group.flatMap((item) => item.reference.queryParameters.filter((parameter) => parameter.identityPotential).map((parameter) => parameter.name))));
    return {
      sourceIdentity: sha256(url),
      normalizedUrl: url,
      host: hostOf(url),
      roles,
      sheetRows: rows,
      occurrenceCount: group.length,
      architecture,
      reviewState: architecture === 'unknown' ? 'manual_review' : 'classified',
      identityBearingQueryParameters: queryParameters,
      fragmentPresent: group.some((item) => item.reference.fragmentPresent),
    };
  });

  const comparisonGroups = new Map<string, Set<number>>();
  for (const occurrence of occurrences) {
    const identity = normalizeUrl(occurrence.reference.sanitizedUrl, false);
    const group = comparisonGroups.get(identity) ?? new Set<number>();
    group.add(occurrence.row);
    comparisonGroups.set(identity, group);
  }
  const sharedUrlGroups = sorted(comparisonGroups.entries(), (a, b) => a[0].localeCompare(b[0]))
    .filter(([, rows]) => rows.size > 1)
    .map(([normalizedUrlWithoutQueryOrFragment, rows]) => ({
      normalizedUrlWithoutQueryOrFragment,
      sheetRows: sorted(rows, (a, b) => a - b),
      recordCount: rows.size,
    }));

  const urlBearingRows = fixture.records.filter((record) => record.information.urls.length + record.application.urls.length > 0);
  const rowsWithMultipleSources = fixture.records.filter((record) => {
    const urls = new Set([...record.information.urls, ...record.application.urls].map((ref) => normalizeUrl(ref.sanitizedUrl)));
    return urls.size > 1;
  });
  const queryAndFragmentSources = sources.filter((source) => source.identityBearingQueryParameters.length > 0 || source.fragmentPresent);
  const duplicateNames = new Map<string, number[]>();
  for (const record of fixture.records) {
    const key = record.scholarshipName.trim().toLowerCase();
    const rows = duplicateNames.get(key) ?? [];
    rows.push(record.sheetRow);
    duplicateNames.set(key, rows);
  }

  const counts = {
    populatedRecords: fixture.records.length,
    labels: {
      Scholarship: fixture.records.filter((record) => record.currentLabel === 'Scholarship').length,
      Portal: fixture.records.filter((record) => record.currentLabel === 'Portal').length,
      other: fixture.records.filter((record) => !['Scholarship', 'Portal'].includes(record.currentLabel)).length,
    },
    rowsWithAtLeastOneUrl: urlBearingRows.length,
    rowsWithNoUrl: fixture.records.length - urlBearingRows.length,
    rowsWithMultipleLinkedSources: rowsWithMultipleSources.length,
    urlOccurrences: occurrences.length,
    urlOccurrencesByRole: {
      information: occurrences.filter((item) => item.role === 'information').length,
      application: occurrences.filter((item) => item.role === 'application').length,
    },
    cellDataHyperlinkCellsByRole: {
      information: fixture.records.filter((record) => record.information.urls.some((ref) => ref.provenance.includes('cellData.hyperlink'))).length,
      application: fixture.records.filter((record) => record.application.urls.some((ref) => ref.provenance.includes('cellData.hyperlink'))).length,
    },
    hiddenHyperlinkCellsByRole: {
      information: countHiddenCells(fixture.records, 'information'),
      application: countHiddenCells(fixture.records, 'application'),
    },
    distinctUrls: groupedSources.size,
    sharedNormalizedUrlGroups: sharedUrlGroups.length,
    hosts: new Set(sources.map((source) => source.host)).size,
    queryOrFragmentSensitiveSources: queryAndFragmentSources.length,
  };

  const planningObservation = {
      populatedRecords: 197,
      Scholarship: 176,
      Portal: 21,
      rowsWithAtLeastOneUrl: 193,
      rowsWithNoUrl: 4,
      distinctUrls: 213,
      rowsWithMultipleLinkedSources: 74,
      hiddenApplicationHyperlinkCells: 92,
      hiddenInformationHyperlinkCells: 86,
      sharedNormalizedUrlGroups: 26,
  };
  const currentCapture = {
      populatedRecords: counts.populatedRecords,
      Scholarship: counts.labels.Scholarship,
      Portal: counts.labels.Portal,
      rowsWithAtLeastOneUrl: counts.rowsWithAtLeastOneUrl,
      rowsWithNoUrl: counts.rowsWithNoUrl,
      distinctUrls: counts.distinctUrls,
      rowsWithMultipleLinkedSources: counts.rowsWithMultipleLinkedSources,
      hiddenApplicationHyperlinkCells: counts.hiddenHyperlinkCellsByRole.application,
      hiddenInformationHyperlinkCells: counts.hiddenHyperlinkCellsByRole.information,
      sharedNormalizedUrlGroups: counts.sharedNormalizedUrlGroups,
  };
  const reconciliation = {
    planningObservation,
    currentCapture,
    result: JSON.stringify(planningObservation) === JSON.stringify(currentCapture) ? 'exact_match' : 'drift_detected',
    explanation: 'The current CellData capture reproduces section 3 when each cell URL is deduplicated across hyperlink metadata and visible URL text, while preserving role occurrences.',
  };

  const reportWithoutDigest = {
    schemaVersion: 1,
    generatedFrom: {
      spreadsheetId: fixture.capture.spreadsheetId,
      spreadsheetRevisionId: fixture.capture.spreadsheetRevisionId,
      sheetTitle: fixture.capture.sheetTitle,
      boundedRange: fixture.capture.boundedRange,
      capturedAt: fixture.capture.capturedAt,
      fixtureSha256: sha256(JSON.stringify(fixture)),
      publicObservationSha256: sha256(JSON.stringify(observations)),
    },
    sanitization: fixture.sanitization,
    counts,
    recordArchitectureCounts: mapCounts(recordArchitectures),
    sourceArchitectureCounts: mapCounts(sourceArchitectureCounts),
    hostCounts: mapCounts(hostCounts),
    reconciliation,
    noUrlRecords: records.filter((record) => record.references.length === 0).map((record) => ({
      sheetRow: record.sheetRow,
      currentLabel: record.currentLabel,
      scholarshipName: record.scholarshipName,
      explicitApplicationMethod: record.explicitApplicationMethod,
      architecture: record.architecture,
    })),
    sharedUrlGroups,
    queryAndFragmentSources,
    duplicateNameReviewItems: sorted(duplicateNames.entries(), (a, b) => a[0].localeCompare(b[0]))
      .filter(([, rows]) => rows.length > 1)
      .map(([normalizedName, rows]) => ({ normalizedName, sheetRows: rows, reviewState: 'manual_review' })),
    publicSourceInspection: observations,
    records,
    sources,
  };
  return {
    ...reportWithoutDigest,
    stability: {
      deterministicDigestSha256: sha256(JSON.stringify(reportWithoutDigest)),
      claim: 'Rebuilding from the same captured fixture and public-observation fixture produces byte-identical JSON.',
    },
  };
}

export function loadP1Inputs(webRoot = process.cwd()): { fixture: CapturedFixture; observations: PublicObservationFixture } {
  const fixture = JSON.parse(fs.readFileSync(path.join(webRoot, 'fixtures/p1/master-database-cell-data.json'), 'utf8')) as CapturedFixture;
  const observations = JSON.parse(fs.readFileSync(path.join(webRoot, 'fixtures/p1/public-source-observations.json'), 'utf8')) as PublicObservationFixture;
  return { fixture, observations };
}

export function serializeInventory(report: ReturnType<typeof buildInventory>): string {
  return `${JSON.stringify(report, null, 2)}\n`;
}
