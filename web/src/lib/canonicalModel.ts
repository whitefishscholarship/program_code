import { createHash } from 'node:crypto';
import { z } from 'zod';

export const MODEL_SCHEMA_VERSION = '2.0.0' as const;

export const SOURCE_ARCHITECTURES = [
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

export const SourceArchitectureSchema = z.enum(SOURCE_ARCHITECTURES);
export const ReviewStateSchema = z.enum(['open', 'resolved', 'deferred']);
export const EvidenceResultSchema = z.enum([
  'observed',
  'supported',
  'conflicting',
  'inconclusive',
  'unverified',
]);
export const ApplicationModeSchema = z.enum([
  'automatic_consideration',
  'selectable_children',
  'eligibility_matched',
  'shared_with_supplements',
  'direct_per_award',
  'offline',
  'unknown',
]);
export const CycleStatusSchema = z.enum([
  'active',
  'closed',
  'upcoming',
  'unavailable',
  'unknown',
]);
export const DatePrecisionSchema = z.enum([
  'exact_datetime',
  'date_only',
  'month_only',
  'annual_rule',
  'rolling',
  'approximate',
  'unknown',
]);

const sha256Pattern = /^[0-9a-f]{64}$/;
const entityId = (prefix: string) => z.string().regex(new RegExp(`^${prefix}_[0-9a-f]{64}$`));
const sha256 = z.string().regex(sha256Pattern);
const schemaVersion = z.literal(MODEL_SCHEMA_VERSION);

export const SourceSchema = z.object({
  schemaVersion,
  id: entityId('src'),
  architecture: SourceArchitectureSchema,
  canonicalUrl: z.string().url().nullable(),
  offlineAuthority: z.string().min(1).nullable(),
  host: z.string().min(1).nullable(),
  identityPolicy: z.object({
    preservedQueryParameters: z.array(z.string()),
    fragmentPreserved: z.boolean(),
    trackingParametersRemoved: z.boolean(),
  }),
  accessBehavior: z.enum(['public', 'authenticated', 'offline', 'unknown']),
  authority: z.enum([
    'official_provider',
    'official_application',
    'institutional',
    'government',
    'aggregator',
    'unknown',
  ]),
  acquisitionState: z.enum(['observed', 'partial', 'complete', 'blocked', 'failed', 'unknown']),
  parentSourceIds: z.array(entityId('src')),
  childSourceIds: z.array(entityId('src')),
  evidenceIds: z.array(entityId('evd')),
  reviewItemIds: z.array(entityId('rev')),
  legacySourceIdentity: sha256.nullable(),
}).superRefine((source, ctx) => {
  if ((source.canonicalUrl === null) === (source.offlineAuthority === null)) {
    ctx.addIssue({
      code: 'custom',
      message: 'A source requires exactly one of canonicalUrl or offlineAuthority',
    });
  }
});

export const ScholarshipSchema = z.object({
  schemaVersion,
  id: entityId('sch'),
  name: z.string().min(1),
  lifecycleState: z.enum(['legacy_imported', 'modeled', 'archived', 'unknown']),
  legacyRowIdentities: z.array(sha256).min(1),
  sourceIds: z.array(entityId('src')),
  sourceLinks: z.array(z.object({
    sourceId: entityId('src'),
    role: z.enum(['information', 'application', 'parent', 'detail', 'document', 'discovery', 'unknown']),
    provenance: z.array(z.string().min(1)),
  })),
  applicationGroupIds: z.array(entityId('app')),
  cycleIds: z.array(entityId('cyc')).min(1),
  evidenceIds: z.array(entityId('evd')),
  reviewItemIds: z.array(entityId('rev')),
  studentFields: z.object({
    summary: z.object({ raw: z.string().nullable(), state: z.enum(['known', 'unknown']), evidenceIds: z.array(entityId('evd')) }),
    awardAmount: z.object({
      raw: z.string().nullable(),
      minimum: z.number().nonnegative().nullable(),
      maximum: z.number().nonnegative().nullable(),
      currency: z.string().length(3).nullable(),
      state: z.enum(['known', 'variable', 'unknown']),
      evidenceIds: z.array(entityId('evd')),
    }),
    eligibility: z.object({
      location: z.object({ raw: z.string().nullable(), state: z.enum(['known', 'unknown']) }),
      minimumGpa: z.object({ value: z.number().min(0).max(5).nullable(), state: z.enum(['known', 'any', 'unknown']) }),
      schoolTypes: z.object({ values: z.array(z.enum(['two_year', 'four_year', 'trade', 'other'])), state: z.enum(['known', 'any', 'unknown']) }),
      focus: z.object({ raw: z.string().nullable(), state: z.enum(['known', 'any', 'unknown']) }),
      gapYear: z.enum(['yes', 'no', 'conditional', 'unknown']),
    }),
    selection: z.object({ financialNeedPriority: z.enum(['required', 'prioritized', 'not_prioritized', 'unknown']) }),
    renewal: z.enum(['renewing', 'non_renewing', 'conditional', 'unknown']),
  }),
});

export const ApplicationGroupSchema = z.object({
  schemaVersion,
  id: entityId('app'),
  mode: ApplicationModeSchema,
  sourceIds: z.array(entityId('src')).min(1),
  scholarshipIds: z.array(entityId('sch')),
  supplementalRequirements: z.enum(['required', 'not_required', 'mixed', 'unknown']),
  evidenceIds: z.array(entityId('evd')),
  reviewItemIds: z.array(entityId('rev')),
});

export const DateFactSchema = z.object({
  value: z.string().nullable(),
  precision: DatePrecisionSchema,
  timezone: z.string().min(1).nullable(),
});

export const CycleSchema = z.object({
  schemaVersion,
  id: entityId('cyc'),
  scholarshipId: entityId('sch'),
  cycleKey: z.string().min(1),
  year: z.number().int().min(1900).max(2200).nullable(),
  opensAt: DateFactSchema,
  closesAt: DateFactSchema,
  status: CycleStatusSchema,
  recurrence: z.enum(['annual', 'one_time', 'rolling', 'irregular', 'unknown']),
  applicationGroupId: entityId('app').nullable(),
  evidenceIds: z.array(entityId('evd')),
  reviewItemIds: z.array(entityId('rev')),
});

export const EvidenceSchema = z.object({
  schemaVersion,
  id: entityId('evd'),
  subjectKind: z.enum(['source', 'scholarship', 'application_group', 'cycle']),
  subjectId: z.string().min(1),
  fieldPath: z.string().min(1),
  sourceId: entityId('src').nullable(),
  retrievedAt: z.string().datetime({ offset: true }),
  sourceRevision: z.string().min(1).nullable(),
  result: EvidenceResultSchema,
  claim: z.string().min(1),
  contentSha256: sha256,
  reviewerState: z.enum(['classified', 'manual_review', 'unknown']),
});

export const ReviewItemSchema = z.object({
  schemaVersion,
  id: entityId('rev'),
  subjectKind: z.enum(['source', 'scholarship', 'application_group', 'cycle', 'legacy_record']),
  subjectId: z.string().min(1),
  reason: z.enum([
    'architecture_unknown',
    'source_manual_review',
    'record_manual_review',
    'identity_ambiguity',
    'cycle_unknown',
    'excluded_legacy_field',
    'conflicting_evidence',
    'access_blocked',
    'other',
  ]),
  state: ReviewStateSchema,
  summary: z.string().min(1),
  evidenceIds: z.array(entityId('evd')),
  owner: z.string().min(1).nullable(),
  targetStage: z.enum(['P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8', 'P9']).nullable(),
});

export const P1ReferenceSchema = z.object({
  role: z.enum(['information', 'application']),
  urlIdentity: z.string().url(),
  provenance: z.array(z.string().min(1)).min(1),
});

export const P1RecordSchema = z.object({
  rowIdentity: sha256,
  sheetRow: z.number().int().positive(),
  currentLabel: z.enum(['Scholarship', 'Portal']),
  scholarshipName: z.string().min(1),
  architecture: SourceArchitectureSchema,
  reviewState: z.enum(['classified', 'manual_review']),
  confidence: z.enum(['direct_observation', 'bounded_structural_inference', 'unknown']),
  evidenceBasis: z.array(z.string()),
  explicitApplicationMethod: z.string().min(1).nullable(),
  references: z.array(P1ReferenceSchema),
});

export const LegacyRecordBindingSchema = z.object({
  schemaVersion,
  id: entityId('leg'),
  rowIdentity: sha256,
  sheetRow: z.number().int().positive(),
  currentLabel: z.enum(['Scholarship', 'Portal']),
  targetKind: z.enum(['scholarship', 'source_record']),
  targetIds: z.array(z.string().min(1)),
  reviewItemIds: z.array(entityId('rev')),
  legacyRecord: P1RecordSchema,
});

export const CanonicalDatasetSchema = z.object({
  schemaVersion,
  pinnedInput: z.object({
    p1InventorySha256: sha256,
    p1ManifestSha256: sha256,
    spreadsheetRevisionId: z.string().min(1),
    capturedAt: z.string().datetime({ offset: true }),
  }),
  sources: z.array(SourceSchema),
  scholarships: z.array(ScholarshipSchema),
  applicationGroups: z.array(ApplicationGroupSchema),
  cycles: z.array(CycleSchema),
  evidence: z.array(EvidenceSchema),
  reviewItems: z.array(ReviewItemSchema),
  legacyBindings: z.array(LegacyRecordBindingSchema),
});

export type SourceArchitecture = z.infer<typeof SourceArchitectureSchema>;
export type P1Record = z.infer<typeof P1RecordSchema>;
export type CanonicalDataset = z.infer<typeof CanonicalDatasetSchema>;

export interface P1InventoryInput {
  generatedFrom: {
    spreadsheetRevisionId: string;
    capturedAt: string;
  };
  counts: {
    populatedRecords: number;
    labels: { Scholarship: number; Portal: number };
    urlOccurrences: number;
    distinctUrls: number;
    sharedNormalizedUrlGroups: number;
    queryOrFragmentSensitiveSources: number;
  };
  records: P1Record[];
  sources: Array<{
    sourceIdentity: string;
    normalizedUrl: string;
    host: string;
    roles: Array<'information' | 'application'>;
    sheetRows: number[];
    occurrenceCount: number;
    architecture: SourceArchitecture;
    reviewState: 'classified' | 'manual_review';
    confidence: 'direct_observation' | 'bounded_structural_inference' | 'unknown';
    evidenceBasis: string[];
    identityBearingQueryParameters: string[];
    fragmentPresent: boolean;
  }>;
  sharedUrlGroups: Array<{ normalizedUrlWithoutQueryOrFragment: string; sheetRows: number[]; recordCount: number }>;
  duplicateNameReviewItems: Array<{ normalizedName: string; sheetRows: number[]; reviewState: 'manual_review' }>;
  boundedCompleteness: {
    excludedColumnHyperlinkReviewItems: Array<{
      sheetRow: number;
      columnIndex: number;
      columnHeader: string;
      form: string;
      sanitizedUrl: string;
      reviewState: 'manual_review';
      reason: string;
    }>;
  };
}

export function sha256Text(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function stableId(prefix: 'src' | 'sch' | 'app' | 'cyc' | 'evd' | 'rev' | 'leg', parts: unknown[]): string {
  return `${prefix}_${sha256Text(JSON.stringify(parts))}`;
}

function evidenceId(subjectKind: string, subjectId: string, fieldPath: string, claim: string): string {
  return stableId('evd', [MODEL_SCHEMA_VERSION, subjectKind, subjectId, fieldPath, claim]);
}

function reviewId(subjectKind: string, subjectId: string, reason: string, discriminator: unknown): string {
  return stableId('rev', [MODEL_SCHEMA_VERSION, subjectKind, subjectId, reason, discriminator]);
}

function applicationMode(architecture: SourceArchitecture): z.infer<typeof ApplicationModeSchema> {
  if (architecture === 'common_application') return 'selectable_children';
  if (architecture === 'matching_portal') return 'eligibility_matched';
  return 'unknown';
}

export function adaptP1Inventory(
  rawInput: P1InventoryInput,
  pinned: CanonicalDataset['pinnedInput'],
): CanonicalDataset {
  const records = z.array(P1RecordSchema).parse(rawInput.records).slice().sort((a, b) => a.sheetRow - b.sheetRow);
  const sourceInputs = rawInput.sources.slice().sort((a, b) => a.sourceIdentity.localeCompare(b.sourceIdentity));
  const sources: CanonicalDataset['sources'] = [];
  const scholarships: CanonicalDataset['scholarships'] = [];
  const applicationGroups: CanonicalDataset['applicationGroups'] = [];
  const cycles: CanonicalDataset['cycles'] = [];
  const evidence: CanonicalDataset['evidence'] = [];
  const reviewItems: CanonicalDataset['reviewItems'] = [];
  const legacyBindings: CanonicalDataset['legacyBindings'] = [];
  const sourceIdByUrl = new Map<string, string>();
  const sourceReviewIdByUrl = new Map<string, string>();
  const recordByRow = new Map(records.map((record) => [record.sheetRow, record]));

  for (const input of sourceInputs) {
    const id = stableId('src', ['url', input.normalizedUrl]);
    sourceIdByUrl.set(input.normalizedUrl, id);
    const claim = input.evidenceBasis.length > 0
      ? input.evidenceBasis.join(' | ')
      : 'No retained evidence basis beyond the P1 source identity.';
    const evdId = evidenceId('source', id, 'architecture', claim);
    evidence.push({
      schemaVersion: MODEL_SCHEMA_VERSION,
      id: evdId,
      subjectKind: 'source',
      subjectId: id,
      fieldPath: 'architecture',
      sourceId: id,
      retrievedAt: pinned.capturedAt,
      sourceRevision: pinned.spreadsheetRevisionId,
      result: input.confidence === 'direct_observation' ? 'observed' : 'unverified',
      claim,
      contentSha256: sha256Text(claim),
      reviewerState: input.reviewState,
    });
    const sourceReviewIds: string[] = [];
    if (input.reviewState === 'manual_review') {
      const reason = input.architecture === 'unknown' ? 'architecture_unknown' : 'source_manual_review';
      const revId = reviewId('source', id, reason, input.sourceIdentity);
      sourceReviewIds.push(revId);
      sourceReviewIdByUrl.set(input.normalizedUrl, revId);
      reviewItems.push({
        schemaVersion: MODEL_SCHEMA_VERSION,
        id: revId,
        subjectKind: 'source',
        subjectId: id,
        reason,
        state: 'open',
        summary: `P1 retained ${input.architecture} source ${input.sourceIdentity} for manual review.`,
        evidenceIds: [evdId],
        owner: null,
        targetStage: 'P3',
      });
    }
    if (input.identityBearingQueryParameters.length > 0 || input.fragmentPresent) {
      const revId = reviewId('source', id, 'identity_ambiguity', [
        input.identityBearingQueryParameters,
        input.fragmentPresent,
      ]);
      sourceReviewIds.push(revId);
      reviewItems.push({
        schemaVersion: MODEL_SCHEMA_VERSION,
        id: revId,
        subjectKind: 'source',
        subjectId: id,
        reason: 'identity_ambiguity',
        state: 'open',
        summary: 'Query parameters or fragment may carry source identity and are preserved pending P3 policy.',
        evidenceIds: [evdId],
        owner: null,
        targetStage: 'P3',
      });
    }
    sources.push({
      schemaVersion: MODEL_SCHEMA_VERSION,
      id,
      architecture: input.architecture,
      canonicalUrl: input.normalizedUrl,
      offlineAuthority: null,
      host: input.host,
      identityPolicy: {
        preservedQueryParameters: input.identityBearingQueryParameters.slice().sort(),
        fragmentPreserved: input.fragmentPresent,
        trackingParametersRemoved: true,
      },
      accessBehavior: input.architecture === 'login_application_portal' ? 'authenticated' : 'public',
      authority: input.architecture === 'external_marketplace' ? 'aggregator' : 'unknown',
      acquisitionState: input.confidence === 'direct_observation' ? 'observed' : 'unknown',
      parentSourceIds: [],
      childSourceIds: [],
      evidenceIds: [evdId],
      reviewItemIds: sourceReviewIds.sort(),
      legacySourceIdentity: input.sourceIdentity,
    });
  }

  for (const record of records.filter((item) => item.references.length === 0)) {
    const method = record.explicitApplicationMethod ?? 'Unknown offline authority';
    const id = stableId('src', ['offline', record.rowIdentity, method]);
    const claim = `P1 captured no URL and retained application method: ${method}`;
    const evdId = evidenceId('source', id, 'offlineAuthority', claim);
    sources.push({
      schemaVersion: MODEL_SCHEMA_VERSION,
      id,
      architecture: 'offline_or_automatic',
      canonicalUrl: null,
      offlineAuthority: method,
      host: null,
      identityPolicy: {
        preservedQueryParameters: [],
        fragmentPreserved: false,
        trackingParametersRemoved: true,
      },
      accessBehavior: 'offline',
      authority: 'unknown',
      acquisitionState: 'observed',
      parentSourceIds: [],
      childSourceIds: [],
      evidenceIds: [evdId],
      reviewItemIds: [],
      legacySourceIdentity: null,
    });
    evidence.push({
      schemaVersion: MODEL_SCHEMA_VERSION,
      id: evdId,
      subjectKind: 'source',
      subjectId: id,
      fieldPath: 'offlineAuthority',
      sourceId: id,
      retrievedAt: pinned.capturedAt,
      sourceRevision: pinned.spreadsheetRevisionId,
      result: 'observed',
      claim,
      contentSha256: sha256Text(claim),
      reviewerState: 'classified',
    });
  }

  const sourceIdsByRow = new Map<number, string[]>();
  for (const record of records) {
    const ids = record.references.map((ref) => {
      const id = sourceIdByUrl.get(ref.urlIdentity);
      if (!id) throw new Error(`P1 row ${record.sheetRow} references missing source ${ref.urlIdentity}`);
      return id;
    });
    if (ids.length === 0) {
      ids.push(stableId('src', ['offline', record.rowIdentity, record.explicitApplicationMethod ?? 'Unknown offline authority']));
    }
    sourceIdsByRow.set(record.sheetRow, [...new Set(ids)].sort());
  }

  const scholarshipIdByRow = new Map<number, string>();
  for (const record of records.filter((item) => item.currentLabel === 'Scholarship')) {
    const id = stableId('sch', ['p1-row', record.rowIdentity]);
    scholarshipIdByRow.set(record.sheetRow, id);
    const nameClaim = `P1 row ${record.sheetRow} name: ${record.scholarshipName}`;
    const nameEvidenceId = evidenceId('scholarship', id, 'name', nameClaim);
    const cycleId = stableId('cyc', [id, 'legacy-unknown']);
    const cycleClaim = 'P1 sanitized input excluded cycle fields; status, dates, timezone, precision, and recurrence remain unknown.';
    const cycleEvidenceId = evidenceId('cycle', cycleId, 'cycle', cycleClaim);
    const cycleReviewId = reviewId('cycle', cycleId, 'cycle_unknown', record.rowIdentity);
    const recordReviewIds: string[] = [cycleReviewId];
    if (record.reviewState === 'manual_review') {
      const revId = reviewId('legacy_record', record.rowIdentity, 'record_manual_review', record.evidenceBasis);
      recordReviewIds.push(revId);
      reviewItems.push({
        schemaVersion: MODEL_SCHEMA_VERSION,
        id: revId,
        subjectKind: 'legacy_record',
        subjectId: record.rowIdentity,
        reason: 'record_manual_review',
        state: 'open',
        summary: `P1 row ${record.sheetRow} remains manual review; its architecture is ${record.architecture}.`,
        evidenceIds: [nameEvidenceId],
        owner: null,
        targetStage: 'P3',
      });
    }
    for (const ref of record.references) {
      const inherited = sourceReviewIdByUrl.get(ref.urlIdentity);
      if (inherited) recordReviewIds.push(inherited);
    }
    evidence.push({
      schemaVersion: MODEL_SCHEMA_VERSION,
      id: nameEvidenceId,
      subjectKind: 'scholarship',
      subjectId: id,
      fieldPath: 'name',
      sourceId: sourceIdsByRow.get(record.sheetRow)?.[0] ?? null,
      retrievedAt: pinned.capturedAt,
      sourceRevision: pinned.spreadsheetRevisionId,
      result: 'observed',
      claim: nameClaim,
      contentSha256: sha256Text(nameClaim),
      reviewerState: record.reviewState,
    });
    evidence.push({
      schemaVersion: MODEL_SCHEMA_VERSION,
      id: cycleEvidenceId,
      subjectKind: 'cycle',
      subjectId: cycleId,
      fieldPath: 'cycle',
      sourceId: sourceIdsByRow.get(record.sheetRow)?.[0] ?? null,
      retrievedAt: pinned.capturedAt,
      sourceRevision: pinned.spreadsheetRevisionId,
      result: 'unverified',
      claim: cycleClaim,
      contentSha256: sha256Text(cycleClaim),
      reviewerState: 'unknown',
    });
    reviewItems.push({
      schemaVersion: MODEL_SCHEMA_VERSION,
      id: cycleReviewId,
      subjectKind: 'cycle',
      subjectId: cycleId,
      reason: 'cycle_unknown',
      state: 'open',
      summary: `Cycle facts for P1 row ${record.sheetRow} were not available in the sanitized migration input.`,
      evidenceIds: [cycleEvidenceId],
      owner: null,
      targetStage: 'P4',
    });
    cycles.push({
      schemaVersion: MODEL_SCHEMA_VERSION,
      id: cycleId,
      scholarshipId: id,
      cycleKey: 'legacy-unknown',
      year: null,
      opensAt: { value: null, precision: 'unknown', timezone: null },
      closesAt: { value: null, precision: 'unknown', timezone: null },
      status: 'unknown',
      recurrence: 'unknown',
      applicationGroupId: null,
      evidenceIds: [cycleEvidenceId],
      reviewItemIds: [cycleReviewId],
    });
    scholarships.push({
      schemaVersion: MODEL_SCHEMA_VERSION,
      id,
      name: record.scholarshipName,
      lifecycleState: 'legacy_imported',
      legacyRowIdentities: [record.rowIdentity],
      sourceIds: sourceIdsByRow.get(record.sheetRow) ?? [],
      sourceLinks: record.references.length > 0
        ? record.references.map((ref) => ({
          sourceId: sourceIdByUrl.get(ref.urlIdentity)!,
          role: ref.role,
          provenance: ref.provenance,
        }))
        : [{
          sourceId: sourceIdsByRow.get(record.sheetRow)![0],
          role: 'application',
          provenance: ['explicitApplicationMethod'],
        }],
      applicationGroupIds: [],
      cycleIds: [cycleId],
      evidenceIds: [nameEvidenceId],
      reviewItemIds: [...new Set(recordReviewIds)].sort(),
      studentFields: {
        summary: { raw: null, state: 'unknown', evidenceIds: [] },
        awardAmount: {
          raw: null,
          minimum: null,
          maximum: null,
          currency: null,
          state: 'unknown',
          evidenceIds: [],
        },
        eligibility: {
          location: { raw: null, state: 'unknown' },
          minimumGpa: { value: null, state: 'unknown' },
          schoolTypes: { values: [], state: 'unknown' },
          focus: { raw: null, state: 'unknown' },
          gapYear: 'unknown',
        },
        selection: { financialNeedPriority: 'unknown' },
        renewal: 'unknown',
      },
    });
  }

  for (const record of records.filter(
    (item) => item.currentLabel === 'Portal' && item.reviewState === 'manual_review',
  )) {
    const revId = reviewId('legacy_record', record.rowIdentity, 'record_manual_review', record.evidenceBasis);
    const relatedEvidenceIds = (sourceIdsByRow.get(record.sheetRow) ?? [])
      .flatMap((sourceId) => sources.find((source) => source.id === sourceId)?.evidenceIds ?? []);
    reviewItems.push({
      schemaVersion: MODEL_SCHEMA_VERSION,
      id: revId,
      subjectKind: 'legacy_record',
      subjectId: record.rowIdentity,
      reason: 'record_manual_review',
      state: 'open',
      summary: `P1 portal row ${record.sheetRow} remains manual review; its architecture is ${record.architecture}.`,
      evidenceIds: [...new Set(relatedEvidenceIds)].sort(),
      owner: null,
      targetStage: 'P3',
    });
  }

  for (const input of sourceInputs.filter((source) => ['common_application', 'matching_portal'].includes(source.architecture))) {
    const sourceId = sourceIdByUrl.get(input.normalizedUrl)!;
    const id = stableId('app', ['p1-source', input.sourceIdentity]);
    const scholarshipIds = input.sheetRows
      .map((row) => scholarshipIdByRow.get(row))
      .filter((value): value is string => Boolean(value))
      .sort();
    const claim = input.evidenceBasis.join(' | ') || `P1 classified source ${input.sourceIdentity} as ${input.architecture}.`;
    const evdId = evidenceId('application_group', id, 'mode', claim);
    const groupReviewIds: string[] = [];
    if (input.reviewState === 'manual_review') {
      const revId = reviewId('application_group', id, 'source_manual_review', input.sourceIdentity);
      groupReviewIds.push(revId);
      reviewItems.push({
        schemaVersion: MODEL_SCHEMA_VERSION,
        id: revId,
        subjectKind: 'application_group',
        subjectId: id,
        reason: 'source_manual_review',
        state: 'open',
        summary: 'Application-group behavior is represented but remains unverified from P1.',
        evidenceIds: [evdId],
        owner: null,
        targetStage: 'P3',
      });
    }
    evidence.push({
      schemaVersion: MODEL_SCHEMA_VERSION,
      id: evdId,
      subjectKind: 'application_group',
      subjectId: id,
      fieldPath: 'mode',
      sourceId,
      retrievedAt: pinned.capturedAt,
      sourceRevision: pinned.spreadsheetRevisionId,
      result: input.reviewState === 'classified' ? 'observed' : 'unverified',
      claim,
      contentSha256: sha256Text(claim),
      reviewerState: input.reviewState,
    });
    applicationGroups.push({
      schemaVersion: MODEL_SCHEMA_VERSION,
      id,
      mode: applicationMode(input.architecture),
      sourceIds: [sourceId],
      scholarshipIds,
      supplementalRequirements: 'unknown',
      evidenceIds: [evdId],
      reviewItemIds: groupReviewIds,
    });
    for (const scholarshipId of scholarshipIds) {
      const scholarship = scholarships.find((item) => item.id === scholarshipId)!;
      scholarship.applicationGroupIds.push(id);
      const cycle = cycles.find((item) => item.scholarshipId === scholarshipId)!;
      cycle.applicationGroupId = id;
    }
  }

  for (const record of records) {
    const recordReviewIds = reviewItems
      .filter((item) => item.subjectId === record.rowIdentity)
      .map((item) => item.id);
    const scholarshipId = scholarshipIdByRow.get(record.sheetRow);
    legacyBindings.push({
      schemaVersion: MODEL_SCHEMA_VERSION,
      id: stableId('leg', ['p1-row', record.rowIdentity]),
      rowIdentity: record.rowIdentity,
      sheetRow: record.sheetRow,
      currentLabel: record.currentLabel,
      targetKind: scholarshipId ? 'scholarship' : 'source_record',
      targetIds: scholarshipId ? [scholarshipId] : (sourceIdsByRow.get(record.sheetRow) ?? []),
      reviewItemIds: recordReviewIds.sort(),
      legacyRecord: record,
    });
  }

  for (const duplicate of rawInput.duplicateNameReviewItems) {
    const subjectId = duplicate.sheetRows.map((row) => recordByRow.get(row)?.rowIdentity).filter(Boolean).sort().join(':');
    const id = reviewId('legacy_record', subjectId, 'identity_ambiguity', duplicate.normalizedName);
    reviewItems.push({
      schemaVersion: MODEL_SCHEMA_VERSION,
      id,
      subjectKind: 'legacy_record',
      subjectId,
      reason: 'identity_ambiguity',
      state: 'open',
      summary: `Duplicate normalized legacy name requires identity review: ${duplicate.normalizedName}.`,
      evidenceIds: [],
      owner: null,
      targetStage: 'P3',
    });
  }

  for (const excluded of rawInput.boundedCompleteness.excludedColumnHyperlinkReviewItems) {
    const record = recordByRow.get(excluded.sheetRow);
    const subjectId = record?.rowIdentity ?? `sheet-row-${excluded.sheetRow}`;
    const id = reviewId('legacy_record', subjectId, 'excluded_legacy_field', [excluded.columnIndex, excluded.form, excluded.sanitizedUrl]);
    reviewItems.push({
      schemaVersion: MODEL_SCHEMA_VERSION,
      id,
      subjectKind: 'legacy_record',
      subjectId,
      reason: 'excluded_legacy_field',
      state: 'open',
      summary: excluded.reason,
      evidenceIds: [],
      owner: null,
      targetStage: 'P4',
    });
  }

  for (const collection of [sources, scholarships, applicationGroups, cycles, evidence, reviewItems, legacyBindings]) {
    collection.sort((a, b) => a.id.localeCompare(b.id));
  }
  for (const scholarship of scholarships) {
    scholarship.applicationGroupIds.sort();
  }

  const dataset = {
    schemaVersion: MODEL_SCHEMA_VERSION,
    pinnedInput: pinned,
    sources,
    scholarships,
    applicationGroups,
    cycles,
    evidence,
    reviewItems,
    legacyBindings,
  };
  return CanonicalDatasetSchema.parse(dataset);
}

export function roundTripP1Records(dataset: CanonicalDataset): P1Record[] {
  return dataset.legacyBindings
    .slice()
    .sort((a, b) => a.sheetRow - b.sheetRow)
    .map((binding) => P1RecordSchema.parse(binding.legacyRecord));
}
