import { createHash } from 'node:crypto';
import {
  adaptP1Inventory,
  type P1InventoryInput,
  type SourceArchitecture,
} from './canonicalModel';
import {
  applicationModeLabel,
  buildStudentCatalog,
  cycleStatusLabel,
  publicEntityId,
  StudentApplicationGroupSchema,
  StudentAwardSchema,
  StudentCatalogSchema,
  StudentPortalSchema,
  StudentSourceSchema,
  type ApplicationMode,
  type CanonicalCatalogInput,
  type CoverageMetricsInput,
  type StudentAward,
  type StudentCatalog,
} from './studentCatalog';

type LegacyCell = { formatted: string | null; unformatted: string | number | null };
type LegacyLink = { url: string };
type LegacyRecord = {
  sheetRow: number;
  rowKey: string;
  values: {
    lastUpdated: LegacyCell;
    dueDate: LegacyCell;
    scope: LegacyCell;
    recordType: LegacyCell;
    amount: LegacyCell;
    name: LegacyCell;
    minimumGpa: LegacyCell;
    schoolType: LegacyCell;
    renewal: LegacyCell;
    focus: LegacyCell;
    acuteFinancialNeedPriority: LegacyCell;
    gapYearUponReturn: LegacyCell;
    information: { displayClass: string; urls: LegacyLink[] };
    application: { displayClass: string; urls: LegacyLink[] };
  };
};

export type LegacySnapshot = {
  spreadsheetRevisionId: string;
  records: LegacyRecord[];
};

type AppliedOperation = {
  sheetRow: number;
  field: string;
  postFormattedValue?: string;
  newHyperlink?: string;
};

export type AppliedReceipt = {
  postwriteRevisionId: string;
  bodySha256: string;
  operations: AppliedOperation[];
};

export type CompleteCatalogInputs = {
  inventory: P1InventoryInput;
  p1InventorySha256: string;
  p1ManifestSha256: string;
  legacy: LegacySnapshot;
  receipt: AppliedReceipt;
  expansion: CanonicalCatalogInput;
  metrics: CoverageMetricsInput;
};

export type LegacyCompatibilityRow = Record<string, string>;

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function correction(receipt: AppliedReceipt, row: number, field: string): AppliedOperation | undefined {
  return receipt.operations.find((item) => item.sheetRow === row && item.field === field);
}

function correctedText(record: LegacyRecord, receipt: AppliedReceipt, field: 'lastUpdated' | 'dueDate'): string {
  return correction(receipt, record.sheetRow, field)?.postFormattedValue ?? record.values[field].formatted ?? '';
}

function correctedUrl(record: LegacyRecord, receipt: AppliedReceipt, field: 'informationLink' | 'applicationLink'): string | null {
  return correction(receipt, record.sheetRow, field)?.newHyperlink
    ?? record.values[field === 'informationLink' ? 'information' : 'application'].urls[0]?.url
    ?? null;
}

function httpsUrl(value: string | null): string | null {
  return value?.startsWith('https://') ? value : null;
}

function schoolTypes(raw: string | null): StudentAward['eligibility']['schoolTypes'] {
  const normalized = (raw ?? '').toLowerCase();
  const values: StudentAward['eligibility']['schoolTypes'] = [];
  if (/2|two/.test(normalized)) values.push('two_year');
  if (/4|four/.test(normalized)) values.push('four_year');
  if (/trade|technical|vocational/.test(normalized)) values.push('trade');
  if (normalized && !/any/.test(normalized) && values.length === 0) values.push('other');
  return values;
}

function amount(raw: string | null): StudentAward['amount'] {
  if (!raw || /^(any|varies|variable|unknown)$/i.test(raw.trim())) {
    return { label: raw?.trim() || 'Amount not verified', minimum: null, maximum: null, currency: null, state: raw ? 'variable' : 'unknown' };
  }
  const values = [...raw.matchAll(/\$\s*([0-9][0-9,.]*)(\s*[kK])?/g)].map((match) => {
    const parsed = Number(match[1].replaceAll(',', ''));
    return match[2] ? parsed * 1000 : parsed;
  }).filter(Number.isFinite);
  return {
    label: raw.trim(),
    minimum: values.length ? Math.min(...values) : null,
    maximum: values.length ? Math.max(...values) : null,
    currency: values.length ? 'USD' : null,
    state: values.length ? 'known' : 'unparseable',
  };
}

function legacyApplicationMode(record: LegacyRecord, hasGroup: boolean, url: string | null): ApplicationMode {
  if (hasGroup) return 'shared_with_supplements';
  if (/paper|document|offline/i.test(record.values.application.displayClass)) return 'offline';
  return url ? 'direct_per_award' : 'unknown';
}

export function buildCompleteStudentCatalog(input: CompleteCatalogInputs): { catalog: StudentCatalog; compatibilityData: LegacyCompatibilityRow[] } {
  const baseline = adaptP1Inventory(input.inventory, {
    p1InventorySha256: input.p1InventorySha256,
    p1ManifestSha256: input.p1ManifestSha256,
    spreadsheetRevisionId: input.inventory.generatedFrom.spreadsheetRevisionId,
    capturedAt: input.inventory.generatedFrom.capturedAt,
  });
  const expansionCatalog = buildStudentCatalog(input.expansion, input.metrics);
  const legacyByRow = new Map(input.legacy.records.map((record) => [record.sheetRow, record]));
  const sourceById = new Map(baseline.sources.map((source) => [source.id, source]));
  const scholarshipById = new Map(baseline.scholarships.map((award) => [award.id, award]));
  const groupById = new Map(baseline.applicationGroups.map((group) => [group.id, group]));

  const baselineAwards = baseline.legacyBindings.filter((binding) => binding.targetKind === 'scholarship').map((binding) => {
    const record = legacyByRow.get(binding.sheetRow);
    const canonical = scholarshipById.get(binding.targetIds[0]);
    if (!record || !canonical) throw new Error(`Missing accepted legacy scholarship row ${binding.sheetRow}`);
    const group = canonical.applicationGroupIds.map((id) => groupById.get(id)).find(Boolean);
    const appUrl = httpsUrl(correctedUrl(record, input.receipt, 'applicationLink'));
    const mode = legacyApplicationMode(record, Boolean(group), appUrl);
    const dueDate = correctedText(record, input.receipt, 'dueDate');
    const minimumGpa = Number(record.values.minimumGpa.unformatted);
    return StudentAwardSchema.parse({
      publicId: publicEntityId('award', canonical.id),
      name: record.values.name.formatted ?? canonical.name,
      summary: null,
      amount: amount(record.values.amount.formatted),
      eligibility: {
        audience: record.values.scope.formatted || 'Audience details not verified',
        minimumGpa: Number.isFinite(minimumGpa) && minimumGpa > 0 ? minimumGpa : null,
        schoolTypes: schoolTypes(record.values.schoolType.formatted),
        focus: record.values.focus.formatted && !/^any$/i.test(record.values.focus.formatted) ? record.values.focus.formatted : null,
      },
      cycle: {
        status: 'unknown',
        label: cycleStatusLabel('unknown'),
        year: null,
        opens: null,
        closes: dueDate || null,
        recurrence: /annual/i.test(dueDate) ? 'annual' : /ongoing|rolling/i.test(dueDate) ? 'rolling' : 'unknown',
      },
      application: {
        mode,
        label: applicationModeLabel(mode),
        url: appUrl,
        groupPublicId: group ? publicEntityId('application', group.id) : null,
        supplements: group?.supplementalRequirements ?? 'unknown',
      },
      sourcePublicIds: canonical.sourceIds.map((id) => publicEntityId('source', id)),
    });
  });

  const sourceIdByUrl = new Map(baseline.sources.filter((source) => source.canonicalUrl).map((source) => [source.canonicalUrl!, publicEntityId('source', source.id)]));
  const expansionSourceUrlByPublicId = new Map(expansionCatalog.sources.map((source) => [source.publicId, source.url]));
  const expansionAwards = expansionCatalog.awards.map((award) => StudentAwardSchema.parse({
    ...award,
    sourcePublicIds: award.sourcePublicIds.map((id) => sourceIdByUrl.get(expansionSourceUrlByPublicId.get(id) ?? '') ?? id),
  }));
  const awards = [...baselineAwards, ...expansionAwards].sort((a, b) => a.name.localeCompare(b.name));

  const referencedByPortal = new Set(baseline.legacyBindings.filter((binding) => binding.targetKind === 'source_record').flatMap((binding) => binding.targetIds));
  const sources = baseline.sources.map((source) => {
    const publicId = publicEntityId('source', source.id);
    const url = httpsUrl(source.canonicalUrl);
    return StudentSourceSchema.parse({
      publicId,
      title: source.host ?? source.offlineAuthority ?? 'Offline source',
      recordType: referencedByPortal.has(source.id) ? 'portal' : 'source',
      architecture: source.architecture,
      url,
      access: source.accessBehavior,
      availability: 'unknown',
      awardCount: awards.filter((award) => award.sourcePublicIds.includes(publicId)).length,
    });
  }).sort((a, b) => a.title.localeCompare(b.title));

  const portals = baseline.legacyBindings.filter((binding) => binding.targetKind === 'source_record').map((binding) => {
    const portalSources = binding.targetIds.map((id) => sourceById.get(id)).filter(Boolean);
    return StudentPortalSchema.parse({
      publicId: publicEntityId('portal', binding.id),
      title: binding.legacyRecord.scholarshipName,
      architecture: binding.legacyRecord.architecture,
      url: httpsUrl(portalSources.find((source) => source?.canonicalUrl)?.canonicalUrl ?? null),
      sourcePublicIds: binding.targetIds.map((id) => publicEntityId('source', id)),
    });
  }).sort((a, b) => a.title.localeCompare(b.title));

  const baselineAwardPublicId = new Map(baseline.scholarships.map((award) => [award.id, publicEntityId('award', award.id)]));
  const baselineGroups = baseline.applicationGroups.map((group) => StudentApplicationGroupSchema.parse({
    publicId: publicEntityId('application', group.id),
    mode: group.mode,
    label: applicationModeLabel(group.mode),
    url: httpsUrl(group.sourceIds.map((id) => sourceById.get(id)?.canonicalUrl).find(Boolean) ?? null),
    awardPublicIds: group.scholarshipIds.map((id) => baselineAwardPublicId.get(id)).filter((id): id is string => Boolean(id)),
    supplements: group.supplementalRequirements,
  }));
  const applicationGroups = [...baselineGroups, ...expansionCatalog.applicationGroups];

  const catalog = StudentCatalogSchema.parse({
    schemaVersion: '1.0.0',
    catalogRevision: sha256(JSON.stringify({
      p1: input.p1InventorySha256,
      p5Revision: input.receipt.postwriteRevisionId,
      p5Receipt: input.receipt.bodySha256,
      p6: input.metrics.childRecordDatasetSha256,
    })),
    counts: {
      sources: sources.length,
      portals: portals.length,
      awards: awards.length,
      applicationGroups: applicationGroups.length,
      cycles: awards.length,
      activeCycles: 0,
      upcomingCycles: 0,
      closedCycles: 0,
      unavailableCycles: 0,
      unknownCycles: awards.length,
      minimumObservedRecipientSlots: input.metrics.recipientSlots.observedMinimumAcrossAcceptedChildrenWithUnknownCycles,
    },
    awards,
    sources,
    portals,
    applicationGroups,
    notice: 'The catalog combines the accepted 176-record legacy scholarship baseline with 16 accepted P6 child awards. Cycle availability remains unverified unless a year-qualified official observation exists; no record is labeled open from a date parse alone.',
  });

  const compatibilityData = input.legacy.records.map((record) => ({
    'Last Updated': correctedText(record, input.receipt, 'lastUpdated'),
    'Due Date': correctedText(record, input.receipt, 'dueDate'),
    'In-State / National': record.values.scope.formatted ?? '',
    'Portal/ Scholarship': record.values.recordType.formatted ?? '',
    'Amount': record.values.amount.formatted ?? '',
    'Scholarship Location/Information': correctedUrl(record, input.receipt, 'informationLink') ?? '',
    'Name of Scholarship': record.values.name.formatted ?? '',
    'Application Link/Method': correctedUrl(record, input.receipt, 'applicationLink') ?? '',
    Summary: '',
    'Stated Min. GPA': record.values.minimumGpa.formatted ?? '',
    'School Type (2-or 4-Year, or Trade)': record.values.schoolType.formatted ?? '',
    'Renewing/ Non-Renewing': record.values.renewal.formatted ?? '',
    Focus: record.values.focus.formatted ?? '',
    'Acute Financial Need Prioritization': record.values.acuteFinancialNeedPriority.formatted ?? '',
    'Accepts Gap Year Applications Upon Return': record.values.gapYearUponReturn.formatted ?? '',
  }));
  return { catalog, compatibilityData };
}
