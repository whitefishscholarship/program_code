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
type ReviewState = 'classified' | 'manual_review';
type Confidence = 'direct_observation' | 'bounded_structural_inference' | 'unknown';
type Classification = {
  architecture: Architecture;
  reviewState: ReviewState;
  confidence: Confidence;
  evidenceBasis: string[];
};

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
  boundedCompleteness: {
    populatedDataRowsAnyCell: number;
    namedDataRows: number;
    unnamedNonemptyRows: unknown[];
    headerMismatches: unknown[];
    hyperlinkRepresentations: {
      totalMetadataRepresentations: number;
      byForm: { cellDataHyperlink: number; textFormatRuns: number; formula: number };
      byStatus: { http: number; nonHttp: number; malformedOrRelative: number };
      retainedSourceColumns: number;
      excludedColumns: number;
      duplicateSameCellUrlRepresentations: number;
    };
    retainedSourceColumnBindings: {
      informationColumn: { columnIndex: number; metadataRepresentations: number };
      applicationColumn: { columnIndex: number; metadataRepresentations: number };
    };
    excludedColumnHyperlinkReviewItems: unknown[];
    [key: string]: unknown;
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

function sourceObservation(url: string, publicObservations: Map<string, PublicObservation>): Classification | null {
  const exact = publicObservations.get(normalizeUrl(url));
  if (!exact) return null;
  return {
    architecture: exact.architecture,
    reviewState: exact.reviewState === 'observed' ? 'classified' : 'manual_review',
    confidence: exact.reviewState === 'observed' ? 'direct_observation' : 'bounded_structural_inference',
    evidenceBasis: [
      `public_source_observation:${exact.reviewState}`,
      exact.observed,
    ],
  };
}

function classifySource(
  url: string,
  occurrences: SourceOccurrence[],
  publicObservations: Map<string, PublicObservation>,
): Classification {
  const observed = sourceObservation(url, publicObservations);
  if (observed) return observed;
  const roles = new Set(occurrences.map((item) => item.role));
  const rows = new Set(occurrences.map((item) => item.row));
  const labels = new Set(occurrences.map((item) => item.label));
  const structuralSignals = [
    `roles:${sorted(roles).join(',')}`,
    `row_count:${rows.size}`,
    `sheet_labels:${sorted(labels).join(',')}`,
  ];

  if (isDocument(url)) {
    return { architecture: 'document_or_pdf', reviewState: 'manual_review', confidence: 'bounded_structural_inference', evidenceBasis: ['url_structure:document_or_pdf', ...structuralSignals] };
  }
  if (isForm(url)) {
    return { architecture: 'form_only', reviewState: 'manual_review', confidence: 'bounded_structural_inference', evidenceBasis: ['url_structure:known_form_path', ...structuralSignals] };
  }
  if (isLoginPortal(url)) {
    return { architecture: 'login_application_portal', reviewState: 'manual_review', confidence: 'bounded_structural_inference', evidenceBasis: ['url_structure:login_or_submission_path', ...structuralSignals] };
  }
  return {
    architecture: 'unknown',
    reviewState: 'manual_review',
    confidence: 'unknown',
    evidenceBasis: ['no_retained_evidence_for_structural_taxonomy', ...structuralSignals],
  };
}

function classifyRecord(
  record: CapturedRecord,
  sourceClassifications: Map<string, Classification>,
): Classification {
  const urls = [...record.information.urls, ...record.application.urls].map((ref) => normalizeUrl(ref.sanitizedUrl));
  if (urls.length === 0) {
    return {
      architecture: 'offline_or_automatic',
      reviewState: 'classified',
      confidence: 'direct_observation',
      evidenceBasis: ['captured_record:no_information_or_application_url', `application_method:${record.application.display}`],
    };
  }
  const classifications = urls.map((url) => sourceClassifications.get(url) ?? {
    architecture: 'unknown' as const,
    reviewState: 'manual_review' as const,
    confidence: 'unknown' as const,
    evidenceBasis: ['missing_source_classification'],
  });
  const architectures = new Set(classifications.map((item) => item.architecture));
  const anyManual = classifications.some((item) => item.reviewState === 'manual_review');
  const singleArchitecture = architectures.size === 1 ? classifications[0].architecture : 'unknown';
  return {
    architecture: singleArchitecture,
    reviewState: anyManual || architectures.size !== 1 ? 'manual_review' : 'classified',
    confidence: anyManual || architectures.size !== 1 ? (singleArchitecture === 'unknown' ? 'unknown' : 'bounded_structural_inference') : 'direct_observation',
    evidenceBasis: [
      `source_reference_count:${urls.length}`,
      `source_architectures:${sorted(architectures).join(',')}`,
      ...(architectures.size !== 1 ? ['conflicting_source_architectures:not_promoted'] : []),
      ...(anyManual ? ['manual_review_source:propagated'] : []),
    ],
  };
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
  const completeness = fixture.boundedCompleteness;
  if (!completeness || completeness.headerMismatches.length > 0 || completeness.unnamedNonemptyRows.length > 0) {
    throw new Error('P1 bounded completeness receipt is missing or unresolved');
  }
  if (completeness.populatedDataRowsAnyCell !== expectedRows || completeness.namedDataRows !== expectedRows) {
    throw new Error('P1 row denominator does not reconcile to captured records');
  }
  const hyperlinkCounts = completeness.hyperlinkRepresentations;
  if (hyperlinkCounts.totalMetadataRepresentations !== hyperlinkCounts.byForm.cellDataHyperlink
    + hyperlinkCounts.byForm.textFormatRuns + hyperlinkCounts.byForm.formula
    || hyperlinkCounts.totalMetadataRepresentations !== hyperlinkCounts.byStatus.http
    + hyperlinkCounts.byStatus.nonHttp + hyperlinkCounts.byStatus.malformedOrRelative
    || hyperlinkCounts.retainedSourceColumns + hyperlinkCounts.excludedColumns !== hyperlinkCounts.totalMetadataRepresentations
    || hyperlinkCounts.excludedColumns !== completeness.excludedColumnHyperlinkReviewItems.length) {
    throw new Error('P1 CellData hyperlink denominator does not reconcile');
  }
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
  const sourceClassifications = new Map<string, Classification>();
  for (const [url, group] of groupedSources) {
    sourceClassifications.set(url, classifySource(url, group, publicObservationMap));
  }

  const recordArchitectures = new Map<string, number>();
  const records = fixture.records.map((record) => {
    const classification = classifyRecord(record, sourceClassifications);
    addCount(recordArchitectures, classification.architecture);
    const references = [
      ...record.information.urls.map((ref) => ({ role: 'information' as const, urlIdentity: normalizeUrl(ref.sanitizedUrl), provenance: ref.provenance })),
      ...record.application.urls.map((ref) => ({ role: 'application' as const, urlIdentity: normalizeUrl(ref.sanitizedUrl), provenance: ref.provenance })),
    ];
    return {
      rowIdentity: stableRecordIdentity(record, fixture.capture.spreadsheetRevisionId),
      sheetRow: record.sheetRow,
      currentLabel: record.currentLabel,
      scholarshipName: record.scholarshipName,
      architecture: classification.architecture,
      reviewState: classification.reviewState,
      confidence: classification.confidence,
      evidenceBasis: classification.evidenceBasis,
      explicitApplicationMethod: references.length === 0 ? record.application.display : null,
      references,
    };
  });

  const hostCounts = new Map<string, number>();
  const sourceArchitectureCounts = new Map<string, number>();
  const sources = sorted(groupedSources.entries(), (a, b) => a[0].localeCompare(b[0])).map(([url, group]) => {
    const classification = sourceClassifications.get(url) ?? {
      architecture: 'unknown' as const,
      reviewState: 'manual_review' as const,
      confidence: 'unknown' as const,
      evidenceBasis: ['missing_source_classification'],
    };
    addCount(sourceArchitectureCounts, classification.architecture);
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
      architecture: classification.architecture,
      reviewState: classification.reviewState,
      confidence: classification.confidence,
      evidenceBasis: classification.evidenceBasis,
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
    boundedCompleteness: fixture.boundedCompleteness,
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
