import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const P8M_SOURCE_SNAPSHOT_PATH =
  'web/fixtures/p8m/master-database-rev225.json';
export const P8M_INPUT_DIRECTORY = 'web/fixtures/p8m/claude-input-batches';
export const P8M_OUTPUT_DIRECTORY = 'web/fixtures/p8m/claude-output';
export const P8M_RECEIPT_PATH = `${P8M_OUTPUT_DIRECTORY}/claude-run-receipt.json`;
export const P8M_RECONCILIATION_PATH = 'docs/evidence/P8M-proposal-reconciliation.json';
export const P8M_HUMAN_REVIEW_PATH = 'docs/evidence/P8M-human-review.csv';
export const P8M_CATALOG_PATH = 'web/fixtures/p7/student-catalog.json';

const SOURCE_REVISION = '225';
const SOURCE_SNAPSHOT_SHA256 =
  'cf898d6cbb5bfb6d4d576fc77e4d1666f0f67ee3cb01ed7cd16ee7991a9c4106';
const CATALOG_SHA256 =
  '35d7836432747710e3515010e8548ceb20ef270a9896d1f1b14c7c91693e9841';
const USED_RANGE = "'Master Database'!A1:O198";
const EXPECTED_ROWS = Array.from({ length: 197 }, (_, index) => index + 2);

const BATCH_KEYS = [
  'schema_version',
  'batch_id',
  'prompt_version',
  'source_revision',
  'source_snapshot_sha256',
  'authorized_tab',
  'authorized_gid',
  'used_range',
  'claude_code_version',
  'claude_code_version_source',
  'model_identifier',
  'model_identifier_source',
  'input_filename',
  'input_sha256',
  'first_row_number',
  'last_row_number',
  'expected_row_count',
  'returned_row_count',
  'external_url_reads',
  'spreadsheet_reads',
  'spreadsheet_writes',
  'matching_facts_produced',
  'accepted_facts',
  'reviewer_decisions',
  'output_body_sha256',
  'rows',
] as const;

const ROW_KEYS = [
  'row_number',
  'source_row_id',
  'row_kind',
  'source_name',
  'processing_outcome',
  'tags',
  'correction_candidates',
  'manual_review_reasons',
  'ambiguity_note',
  'confidence',
] as const;

const TAG_KEYS = [
  'geography_scope',
  'school_types',
  'renewal',
  'application_route',
  'topic_tags',
] as const;

const CORRECTION_KEYS = [
  'field',
  'proposed_value',
  'evidence_field',
  'evidence_excerpt',
  'confidence',
] as const;

const PROCESSING_OUTCOMES = new Set([
  'proposed_tags_only',
  'proposed_tags_and_corrections',
  'manual_review_no_tags',
]);
const GEOGRAPHY_VALUES = new Set([
  'montana',
  'national',
  'any_or_unspecified',
  'other_state_or_local',
  'unknown',
]);
const SCHOOL_TYPE_VALUES = new Set([
  'two_year',
  'four_year',
  'trade_vocational',
  'certificate',
  'any',
  'unknown',
]);
const RENEWAL_VALUES = new Set(['renewable', 'non_renewing', 'unknown']);
const APPLICATION_ROUTE_VALUES = new Set([
  'paper',
  'email',
  'provider_portal',
  'provider_form',
  'automatic_consideration',
  'offline_or_counselor',
  'other',
  'unknown',
]);
const TOPIC_VALUES = new Set([
  'general',
  'merit',
  'financial_need',
  'community_service',
  'leadership',
  'work_experience',
  'caregiving',
  'stem',
  'aviation_pilot',
  'aviation_maintenance',
  'aviation_management',
  'nursing',
  'healthcare',
  'trades',
  'business_finance',
  'public_service',
  'law',
  'arts_humanities',
  'agriculture_conservation',
  'athletics_sports',
  'military_veteran',
  'first_responder',
  'farmers_union',
  'electric_coop',
  'credit_union',
  'elks_lodge',
  'company_employee',
  'dyslexia',
  'adhd',
  'autism',
  'learning_other',
  'mental_health',
  'chronic_health',
  'foster_care',
  'loss_of_parent',
  'overcoming_adversity',
  'first_generation',
  'black_african_american',
  'hispanic_latino',
  'native_american',
  'asian_pacific_islander',
  'lgbtqia',
  'female',
  'nonbinary',
  'single_parent',
  'mensa',
  'homelessness',
  'unknown',
]);
const REVIEW_REASONS = new Set([
  'source_queue_empty_by_column_a_boundary',
  'official_verification_required',
  'missing_information',
  'ambiguous_value',
  'internal_conflict',
  'unsupported_taxonomy',
  'duplicate_name',
]);
const CORRECTION_FIELDS = new Set([
  'Due Date',
  'In-State / National',
  'Amount',
  'Scholarship Location/Information',
  'Application Link/Method',
  'Stated Min. GPA',
  'School Type (2-or 4-Year, or Trade)',
  'Renewing/ Non-Renewing',
  'Focus',
  'Acute Financial Need Prioritization',
  'Accepts Gap Year Applications Upon Return',
]);
const CONFIDENCE_VALUES = new Set(['high', 'medium', 'low']);

type JsonRecord = Record<string, unknown>;

export type P8mSourceRow = {
  row_number: number;
  source_row_id: string;
  row_kind: 'Scholarship' | 'Portal';
  source_name: string | null;
  column_a_urls: string[];
  cells: Record<string, string | null>;
};

export type P8mProposalRow = {
  row_number: number;
  source_row_id: string;
  row_kind: 'Scholarship' | 'Portal';
  source_name: string | null;
  processing_outcome: string;
  tags: {
    geography_scope: string;
    school_types: string[];
    renewal: string;
    application_route: string;
    topic_tags: string[];
  };
  correction_candidates: Array<{
    field: string;
    proposed_value: string;
    evidence_field: string;
    evidence_excerpt: string;
    confidence: string;
  }>;
  manual_review_reasons: string[];
  ambiguity_note: string | null;
  confidence: string;
};

export type P8mPackageData = {
  receiptText: string;
  receipt: JsonRecord;
  snapshotText: string;
  snapshot: JsonRecord & { rows: P8mSourceRow[] };
  catalogText: string;
  catalog: JsonRecord & {
    awards: Array<JsonRecord & { publicId: string; name: string; sourcePublicIds: string[] }>;
    portals: Array<JsonRecord & { publicId: string; title: string; sourcePublicIds: string[] }>;
  };
  inputTexts: Map<string, string>;
  inputs: Map<string, JsonRecord & { rows: Array<Omit<P8mSourceRow, 'column_a_urls' | 'cells'> & { fields: Record<string, string | null> }> }>;
  outputTexts: Map<string, string>;
  outputs: Map<string, JsonRecord & { rows: P8mProposalRow[] }>;
};

export type P8mValidationResult = {
  errors: string[];
  summary: JsonRecord;
  reconciliation: JsonRecord;
  humanReviewCsv: string;
};

function sha256(value: string | Buffer): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value as JsonRecord)
        .sort()
        .map((key) => [key, stableValue((value as JsonRecord)[key])]),
    );
  }
  return value;
}

export function stableJson(value: unknown): string {
  return JSON.stringify(stableValue(value));
}

function exactKeys(value: unknown, expected: readonly string[]): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  return (
    JSON.stringify(Object.keys(value as JsonRecord).sort()) ===
    JSON.stringify([...expected].sort())
  );
}

function isSortedUnique(values: unknown): values is string[] {
  return (
    Array.isArray(values) &&
    values.every((value) => typeof value === 'string') &&
    new Set(values).size === values.length &&
    JSON.stringify(values) === JSON.stringify([...values].sort())
  );
}

function increment(target: Record<string, number>, key: string): void {
  target[key] = (target[key] ?? 0) + 1;
}

function normalizeName(value: unknown): string {
  return String(value ?? '')
    .normalize('NFKD')
    .toLowerCase()
    .replaceAll('&', 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function sortedCounts(target: Record<string, number>): Record<string, number> {
  return Object.fromEntries(Object.entries(target).sort(([left], [right]) => left.localeCompare(right)));
}

export function csvCell(value: unknown): string {
  const rawText = typeof value === 'string' ? value : stableJson(value);
  const text = rawText.replace(/\r\n?/g, '\n').replace(/[ \t]+(?=\n|$)/g, '');
  const spreadsheetSafeText = /^[\t\r ]*[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${spreadsheetSafeText.replaceAll('"', '""')}"`;
}

function requireEnum(
  errors: string[],
  value: unknown,
  allowed: Set<string>,
  label: string,
): void {
  if (typeof value !== 'string' || !allowed.has(value)) {
    errors.push(`${label} has invalid value ${JSON.stringify(value)}`);
  }
}

function walkForbiddenKeys(value: unknown, label: string, errors: string[]): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => walkForbiddenKeys(item, `${label}[${index}]`, errors));
    return;
  }
  if (!value || typeof value !== 'object') return;
  for (const [key, nested] of Object.entries(value as JsonRecord)) {
    if (
      /^(cycle|cycle_id|cycleId|application_group|applicationGroup|reviewer|reviewer_id|reviewerId|accepted)$/i.test(
        key,
      )
    ) {
      errors.push(`${label}.${key} is a prohibited proposal-row key`);
    }
    walkForbiddenKeys(nested, `${label}.${key}`, errors);
  }
}

export function loadP8mPackage(repoRoot: string): P8mPackageData {
  const read = (relativePath: string) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
  const snapshotText = read(P8M_SOURCE_SNAPSHOT_PATH);
  const catalogText = read(P8M_CATALOG_PATH);
  const receiptText = read(P8M_RECEIPT_PATH);
  const receipt = JSON.parse(receiptText) as JsonRecord;
  const batches = receipt.batches as JsonRecord[];
  const inputTexts = new Map<string, string>();
  const inputs = new Map<string, P8mPackageData['inputs'] extends Map<string, infer T> ? T : never>();
  const outputTexts = new Map<string, string>();
  const outputs = new Map<string, P8mPackageData['outputs'] extends Map<string, infer T> ? T : never>();

  for (const batch of batches) {
    const inputFilename = String(batch.input_filename);
    const outputFilename = String(batch.output_filename);
    const inputText = read(`${P8M_INPUT_DIRECTORY}/${inputFilename}`);
    const outputText = read(`${P8M_OUTPUT_DIRECTORY}/${outputFilename}`);
    inputTexts.set(inputFilename, inputText);
    inputs.set(inputFilename, JSON.parse(inputText));
    outputTexts.set(outputFilename, outputText);
    outputs.set(outputFilename, JSON.parse(outputText));
  }

  return {
    receiptText,
    receipt,
    snapshotText,
    snapshot: JSON.parse(snapshotText),
    catalogText,
    catalog: JSON.parse(catalogText),
    inputTexts,
    inputs,
    outputTexts,
    outputs,
  };
}

export function validateP8mPackage(data: P8mPackageData): P8mValidationResult {
  const errors: string[] = [];
  const receipt = data.receipt;
  if (
    !exactKeys(receipt, [
      'schema_version',
      'receipt_id',
      'prompt_version',
      'status',
      'source',
      'versions',
      'batches',
      'totals',
      'side_effects',
      'boundaries',
      'combined_output_sha256',
      'combined_output_sha256_formula',
    ])
  ) {
    errors.push('Claude run receipt has unknown or missing top-level keys');
  }
  if (
    receipt.schema_version !== 1 ||
    receipt.receipt_id !== 'p8m-claude-run-receipt-v1' ||
    receipt.prompt_version !== 'p8m-claude-prompt-v1' ||
    receipt.status !== 'proposal_only_complete'
  ) {
    errors.push('Claude run receipt identity is invalid');
  }

  const source = receipt.source as JsonRecord;
  if (
    source.spreadsheet_revision !== SOURCE_REVISION ||
    source.source_snapshot_sha256 !== SOURCE_SNAPSHOT_SHA256 ||
    source.authorized_tab !== 'Master Database' ||
    source.authorized_gid !== 0 ||
    source.used_range !== USED_RANGE ||
    source.repository_baseline !== '55245dc42a726d57ef3bdbeeab7aa27fcce31d17'
  ) {
    errors.push('Claude run receipt source pin is invalid');
  }
  if (sha256(data.snapshotText) !== SOURCE_SNAPSHOT_SHA256) {
    errors.push('Pinned source snapshot SHA-256 does not match');
  }
  if (
    data.snapshot.source_revision !== SOURCE_REVISION ||
    data.snapshot.sheet_title !== 'Master Database' ||
    data.snapshot.sheet_id !== 0 ||
    data.snapshot.used_range !== USED_RANGE ||
    data.snapshot.rows.length !== 197
  ) {
    errors.push('Pinned source snapshot metadata or denominator is invalid');
  }
  const urlBoundary = data.snapshot.url_acquisition_boundary as JsonRecord;
  if (
    urlBoundary.authorized_input_column !== 'A' ||
    urlBoundary.authorized_header !== 'Last Updated' ||
    urlBoundary.native_hyperlink_count !== 0 ||
    urlBoundary.visible_url_count !== 0 ||
    urlBoundary.external_url_queue_count !== 0
  ) {
    errors.push('Column-A zero-URL acquisition boundary is invalid');
  }
  if (data.snapshot.rows.some((row) => row.column_a_urls.length !== 0)) {
    errors.push('Pinned source contains an unexpected authorized column-A URL');
  }
  if (
    sha256(data.catalogText) !== CATALOG_SHA256 ||
    data.catalog.awards.length !== 192 ||
    data.catalog.portals.length !== 21
  ) {
    errors.push('Accepted P7 catalog identity or denominator is invalid');
  }

  const sourceRows = new Map(data.snapshot.rows.map((row) => [row.row_number, row]));
  const allRows: P8mProposalRow[] = [];
  const combinedBodyParts: string[] = [];
  const batches = Array.isArray(receipt.batches) ? (receipt.batches as JsonRecord[]) : [];
  if (batches.length !== 8) errors.push(`Expected 8 batches, received ${batches.length}`);

  for (const batch of batches) {
    const batchId = String(batch.batch_id);
    const inputFilename = String(batch.input_filename);
    const outputFilename = String(batch.output_filename);
    const inputText = data.inputTexts.get(inputFilename);
    const input = data.inputs.get(inputFilename);
    const outputText = data.outputTexts.get(outputFilename);
    const output = data.outputs.get(outputFilename);
    if (!inputText || !input || !outputText || !output) {
      errors.push(`${batchId} is missing an input or output file`);
      continue;
    }
    if (!exactKeys(output, BATCH_KEYS)) {
      errors.push(`${batchId} has unknown or missing batch keys`);
    }
    if (sha256(inputText) !== batch.input_sha256) {
      errors.push(`${batchId} input SHA-256 does not match`);
    }
    if (sha256(outputText) !== batch.output_sha256) {
      errors.push(`${batchId} output SHA-256 does not match`);
    }
    const outputBodySha256 = sha256(stableJson(output.rows));
    if (outputBodySha256 !== batch.output_body_sha256) {
      errors.push(`${batchId} output-body SHA-256 does not match`);
    }
    combinedBodyParts.push(`${batchId}:${outputBodySha256}`);

    const expectedBatchFields: Record<string, unknown> = {
      schema_version: 1,
      batch_id: batchId,
      prompt_version: receipt.prompt_version,
      source_revision: SOURCE_REVISION,
      source_snapshot_sha256: SOURCE_SNAPSHOT_SHA256,
      authorized_tab: 'Master Database',
      authorized_gid: 0,
      used_range: USED_RANGE,
      input_filename: inputFilename,
      input_sha256: batch.input_sha256,
      first_row_number: batch.first_row_number,
      last_row_number: batch.last_row_number,
      expected_row_count: batch.expected_row_count,
      returned_row_count: batch.returned_row_count,
      external_url_reads: 0,
      spreadsheet_reads: 0,
      spreadsheet_writes: 0,
      matching_facts_produced: 0,
      accepted_facts: 0,
      reviewer_decisions: 0,
      output_body_sha256: batch.output_body_sha256,
    };
    for (const [key, expected] of Object.entries(expectedBatchFields)) {
      if (output[key] !== expected) errors.push(`${batchId}.${key} differs from its receipt`);
    }
    if (
      input.source_revision !== SOURCE_REVISION ||
      input.authorized_external_url_count !== 0 ||
      input.batch_id !== batchId ||
      input.rows.length !== batch.expected_row_count ||
      output.rows.length !== batch.returned_row_count ||
      input.rows.length !== output.rows.length
    ) {
      errors.push(`${batchId} input/output envelope is invalid`);
    }

    output.rows.forEach((row, index) => {
      const label = `${batchId} row-index ${index}`;
      const inputRow = input.rows[index];
      if (!exactKeys(row, ROW_KEYS)) errors.push(`${label} has unknown or missing row keys`);
      if (!exactKeys(row.tags, TAG_KEYS)) errors.push(`${label} has unknown or missing tag keys`);
      if (
        !inputRow ||
        row.row_number !== inputRow.row_number ||
        row.source_row_id !== inputRow.source_row_id ||
        row.row_kind !== inputRow.row_kind ||
        row.source_name !== inputRow.source_name
      ) {
        errors.push(`${label} does not match its exact input-row identity`);
      }
      const sourceRow = sourceRows.get(row.row_number);
      if (
        !sourceRow ||
        row.source_row_id !== sourceRow.source_row_id ||
        row.row_kind !== sourceRow.row_kind ||
        row.source_name !== sourceRow.source_name
      ) {
        errors.push(`${label} does not match the pinned source snapshot`);
      }

      requireEnum(errors, row.processing_outcome, PROCESSING_OUTCOMES, `${label}.processing_outcome`);
      requireEnum(errors, row.tags.geography_scope, GEOGRAPHY_VALUES, `${label}.geography_scope`);
      requireEnum(errors, row.tags.renewal, RENEWAL_VALUES, `${label}.renewal`);
      requireEnum(
        errors,
        row.tags.application_route,
        APPLICATION_ROUTE_VALUES,
        `${label}.application_route`,
      );
      if (!isSortedUnique(row.tags.school_types)) {
        errors.push(`${label}.school_types is not a sorted unique string array`);
      } else {
        row.tags.school_types.forEach((value) =>
          requireEnum(errors, value, SCHOOL_TYPE_VALUES, `${label}.school_types`),
        );
      }
      if (!isSortedUnique(row.tags.topic_tags)) {
        errors.push(`${label}.topic_tags is not a sorted unique string array`);
      } else {
        row.tags.topic_tags.forEach((value) =>
          requireEnum(errors, value, TOPIC_VALUES, `${label}.topic_tags`),
        );
      }
      if (!isSortedUnique(row.manual_review_reasons)) {
        errors.push(`${label}.manual_review_reasons is not a sorted unique string array`);
      } else {
        row.manual_review_reasons.forEach((value) =>
          requireEnum(errors, value, REVIEW_REASONS, `${label}.manual_review_reasons`),
        );
      }
      if (
        !row.manual_review_reasons.includes('official_verification_required') ||
        !row.manual_review_reasons.includes('source_queue_empty_by_column_a_boundary')
      ) {
        errors.push(`${label} is missing a mandatory zero-URL review reason`);
      }
      const duplicateMarkerExpected = row.row_number === 26 || row.row_number === 27;
      if (row.manual_review_reasons.includes('duplicate_name') !== duplicateMarkerExpected) {
        errors.push(`${label} has an invalid duplicate-name disposition`);
      }
      requireEnum(errors, row.confidence, CONFIDENCE_VALUES, `${label}.confidence`);
      if (!(row.ambiguity_note === null || typeof row.ambiguity_note === 'string')) {
        errors.push(`${label}.ambiguity_note must be a string or null`);
      }

      const expectedOutcome = row.correction_candidates.length
        ? 'proposed_tags_and_corrections'
        : 'proposed_tags_only';
      if (row.processing_outcome !== expectedOutcome) {
        errors.push(`${label}.processing_outcome disagrees with its correction count`);
      }
      row.correction_candidates.forEach((correction, correctionIndex) => {
        const correctionLabel = `${label}.correction_candidates[${correctionIndex}]`;
        if (!exactKeys(correction, CORRECTION_KEYS)) {
          errors.push(`${correctionLabel} has unknown or missing keys`);
        }
        requireEnum(errors, correction.field, CORRECTION_FIELDS, `${correctionLabel}.field`);
        requireEnum(
          errors,
          correction.confidence,
          CONFIDENCE_VALUES,
          `${correctionLabel}.confidence`,
        );
        if (
          !correction.proposed_value.trim() ||
          !correction.evidence_field.trim() ||
          !correction.evidence_excerpt.trim()
        ) {
          errors.push(`${correctionLabel} contains an empty required string`);
        }
        if (correction.evidence_field === correction.field) {
          errors.push(`${correctionLabel} cites the correction target instead of a different cell`);
        }
        const evidence = inputRow?.fields[correction.evidence_field];
        if (typeof evidence !== 'string' || !evidence.includes(correction.evidence_excerpt)) {
          errors.push(`${correctionLabel}.evidence_excerpt is not verbatim in the cited source cell`);
        }
        if (inputRow?.fields[correction.field] === correction.proposed_value) {
          errors.push(`${correctionLabel}.proposed_value does not differ from the target cell`);
        }
      });

      const serialized = JSON.stringify(row);
      if (/https?:\/\/|www\./i.test(serialized)) errors.push(`${label} contains a URL`);
      if (/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(serialized)) {
        errors.push(`${label} contains an email address`);
      }
      if (/\b(?:\+?1[-. ]?)?\(?[2-9][0-9]{2}\)?[-. ][0-9]{3}[-. ][0-9]{4}\b/.test(serialized)) {
        errors.push(`${label} contains a phone number`);
      }
      walkForbiddenKeys(row, label, errors);
      allRows.push(row);
    });
  }

  const combinedOutputSha256 = sha256(combinedBodyParts.join('\n'));
  if (combinedOutputSha256 !== receipt.combined_output_sha256) {
    errors.push('Combined output SHA-256 does not match its receipt formula');
  }
  const rowNumbers = allRows.map((row) => row.row_number).sort((left, right) => left - right);
  if (
    allRows.length !== 197 ||
    new Set(rowNumbers).size !== 197 ||
    JSON.stringify(rowNumbers) !== JSON.stringify(EXPECTED_ROWS) ||
    new Set(allRows.map((row) => row.source_row_id)).size !== 197
  ) {
    errors.push('All-197-row denominator, order, or stable source-row identity is invalid');
  }

  type StableMapping = {
    target_kind: 'award' | 'portal';
    target_public_id: string;
    mapping_basis: string;
    corroborating_fields: string[];
    related_catalog_only_award_ids: string[];
  };
  const awardsByName = new Map<string, typeof data.catalog.awards>();
  for (const award of data.catalog.awards) {
    const key = normalizeName(award.name);
    awardsByName.set(key, [...(awardsByName.get(key) ?? []), award]);
  }
  const portalsByName = new Map<string, typeof data.catalog.portals>();
  for (const portal of data.catalog.portals) {
    const key = normalizeName(portal.title);
    portalsByName.set(key, [...(portalsByName.get(key) ?? []), portal]);
  }
  const sourceScholarshipNames = new Set(
    data.snapshot.rows
      .filter((row) => row.row_kind === 'Scholarship')
      .map((row) => normalizeName(row.source_name)),
  );
  const catalogOnlyAwards = data.catalog.awards
    .filter((award) => !sourceScholarshipNames.has(normalizeName(award.name)))
    .map((award) => ({
      award_public_id: award.publicId,
      name: award.name,
      source_public_ids: [...award.sourcePublicIds].sort(),
      disposition: 'existing_catalog_child_award_without_a_separate_pinned_source_row',
      human_review_status: 'pending_named_human_reviewer',
    }))
    .sort((left, right) => left.award_public_id.localeCompare(right.award_public_id));
  if (catalogOnlyAwards.length !== 16) {
    errors.push(`Expected 16 accepted-catalog child awards without source rows, received ${catalogOnlyAwards.length}`);
  }
  const catalogOnlyAwardIds = new Set(catalogOnlyAwards.map((award) => award.award_public_id));
  const stableMappings = new Map<number, StableMapping>();
  for (const sourceRow of data.snapshot.rows) {
    if (sourceRow.row_kind === 'Scholarship') {
      const candidates = awardsByName.get(normalizeName(sourceRow.source_name)) ?? [];
      let award: (typeof data.catalog.awards)[number] | undefined;
      let mappingBasis = 'unique_normalized_name_plus_pinned_row_identity_and_catalog_fields';
      if (sourceRow.row_number === 26) {
        award = candidates.find(({ publicId }) => publicId === 'award-e05338ef963f');
        mappingBasis = 'duplicate_disambiguated_by_amount_gpa_and_school_type';
      } else if (sourceRow.row_number === 27) {
        award = candidates.find(({ publicId }) => publicId === 'award-67de97a4f446');
        mappingBasis = 'duplicate_disambiguated_by_amount_gpa_and_school_type';
      } else if (candidates.length === 1) {
        [award] = candidates;
      }
      if (!award) {
        errors.push(`Source row ${sourceRow.row_number} does not resolve to exactly one stable award identity`);
        continue;
      }
      const amount = award.amount as JsonRecord | undefined;
      const eligibility = award.eligibility as JsonRecord | undefined;
      const cycle = award.cycle as JsonRecord | undefined;
      const application = award.application as JsonRecord | undefined;
      const corroboratingFields: string[] = [];
      if (normalizeName(sourceRow.cells.Amount) === normalizeName(amount?.label)) {
        corroboratingFields.push('Amount');
      }
      if (
        sourceRow.cells['Stated Min. GPA'] !== null &&
        Number.parseFloat(sourceRow.cells['Stated Min. GPA']) === eligibility?.minimumGpa
      ) {
        corroboratingFields.push('Stated Min. GPA');
      }
      if (normalizeName(sourceRow.cells['Due Date']) === normalizeName(cycle?.closes)) {
        corroboratingFields.push('Due Date');
      }
      if (
        /^https?:\/\//.test(sourceRow.cells['Application Link/Method'] ?? '') &&
        sourceRow.cells['Application Link/Method'] === application?.url
      ) {
        corroboratingFields.push('Application Link/Method');
      }
      if (
        normalizeName(sourceRow.cells['In-State / National']) ===
        normalizeName(eligibility?.audience)
      ) {
        corroboratingFields.push('In-State / National');
      }
      if (corroboratingFields.length === 0) {
        errors.push(`Source row ${sourceRow.row_number} award mapping lacks a corroborating catalog field`);
      }
      stableMappings.set(sourceRow.row_number, {
        target_kind: 'award',
        target_public_id: award.publicId,
        mapping_basis: mappingBasis,
        corroborating_fields: corroboratingFields.sort(),
        related_catalog_only_award_ids: [],
      });
      continue;
    }

    const candidates = portalsByName.get(normalizeName(sourceRow.source_name)) ?? [];
    if (candidates.length !== 1) {
      errors.push(`Source row ${sourceRow.row_number} does not resolve to exactly one stable portal identity`);
      continue;
    }
    const [portal] = candidates;
    const portalSources = new Set(portal.sourcePublicIds);
    const relatedCatalogOnlyAwardIds = catalogOnlyAwards
      .filter((award) => award.source_public_ids.some((sourceId) => portalSources.has(sourceId)))
      .map((award) => award.award_public_id)
      .sort();
    stableMappings.set(sourceRow.row_number, {
      target_kind: 'portal',
      target_public_id: portal.publicId,
      mapping_basis: 'unique_normalized_title_plus_pinned_row_identity',
      corroborating_fields: ['Portal/ Scholarship'],
      related_catalog_only_award_ids: relatedCatalogOnlyAwardIds,
    });
  }
  if (
    stableMappings.size !== 197 ||
    new Set([...stableMappings.values()].map((mapping) => mapping.target_public_id)).size !== 197
  ) {
    errors.push('Stable target mapping must cover 197 unique award/portal identities');
  }
  const relatedCatalogOnlyAwardIds = new Set(
    [...stableMappings.values()].flatMap((mapping) => mapping.related_catalog_only_award_ids),
  );
  if (
    relatedCatalogOnlyAwardIds.size !== catalogOnlyAwardIds.size ||
    [...catalogOnlyAwardIds].some((awardId) => !relatedCatalogOnlyAwardIds.has(awardId))
  ) {
    errors.push('Catalog-only child-award relationship queue is incomplete');
  }

  const kinds: Record<string, number> = {};
  const outcomes: Record<string, number> = {};
  const confidence: Record<string, number> = {};
  const correctionFields: Record<string, number> = {};
  const correctionConfidence: Record<string, number> = {};
  const reviewReasons: Record<string, number> = {};
  const geography: Record<string, number> = {};
  const renewal: Record<string, number> = {};
  const routes: Record<string, number> = {};
  const schoolTypes: Record<string, number> = {};
  const topics: Record<string, number> = {};
  let correctionCount = 0;
  let ambiguityCount = 0;
  for (const row of allRows) {
    increment(kinds, row.row_kind);
    increment(outcomes, row.processing_outcome);
    increment(confidence, row.confidence);
    increment(geography, row.tags.geography_scope);
    increment(renewal, row.tags.renewal);
    increment(routes, row.tags.application_route);
    row.tags.school_types.forEach((value) => increment(schoolTypes, value));
    row.tags.topic_tags.forEach((value) => increment(topics, value));
    row.manual_review_reasons.forEach((value) => increment(reviewReasons, value));
    if (row.ambiguity_note !== null) ambiguityCount += 1;
    for (const correction of row.correction_candidates) {
      correctionCount += 1;
      increment(correctionFields, correction.field);
      increment(correctionConfidence, correction.confidence);
    }
  }

  const recomputedTotals = {
    total_expected_rows: 197,
    total_returned_rows: allRows.length,
    unique_source_row_ids: new Set(allRows.map((row) => row.source_row_id)).size,
    unique_row_numbers: new Set(allRows.map((row) => row.row_number)).size,
    scholarship_rows: kinds.Scholarship ?? 0,
    portal_rows: kinds.Portal ?? 0,
    duplicate_name_rows: [26, 27],
    processing_outcomes: sortedCounts(outcomes),
    row_confidence: sortedCounts(confidence),
    correction_candidate_count: correctionCount,
    correction_candidates_by_field: sortedCounts(correctionFields),
    correction_candidates_by_confidence: sortedCounts(correctionConfidence),
    manual_review_reason_counts: sortedCounts(reviewReasons),
    ambiguity_note_count: ambiguityCount,
    geography_scope_counts: sortedCounts(geography),
    application_route_counts: sortedCounts(routes),
    renewal_counts: sortedCounts(renewal),
    school_type_tag_counts: sortedCounts(schoolTypes),
    topic_tag_counts: sortedCounts(topics),
  };
  if (stableJson(recomputedTotals) !== stableJson(receipt.totals)) {
    errors.push('Receipt totals do not match totals recomputed from written proposal rows');
  }

  const sideEffects = receipt.side_effects as Record<string, unknown>;
  if (
    Object.keys(sideEffects).length === 0 ||
    Object.values(sideEffects).some((value) => value !== 0)
  ) {
    errors.push('Claude side-effect receipt must contain only zero values');
  }
  const boundaries = receipt.boundaries as JsonRecord;
  if (
    boundaries.role !== 'proposal_only' ||
    boundaries.authorized_external_url_queue !== 0 ||
    !String(boundaries.reviewer_identity).includes('unresolved placeholder')
  ) {
    errors.push('Claude proposal-only or unresolved-reviewer boundary is invalid');
  }

  const orderedRows = [...allRows].sort((left, right) => left.row_number - right.row_number);
  const reconciliationRows = orderedRows.map((row) => {
    const stableMapping = stableMappings.get(row.row_number) ?? {
      target_kind: row.row_kind === 'Scholarship' ? ('award' as const) : ('portal' as const),
      target_public_id: 'unresolved',
      mapping_basis: 'invalid_package',
      corroborating_fields: [],
      related_catalog_only_award_ids: [],
    };
    return {
      row_number: row.row_number,
      source_row_id: row.source_row_id,
      row_kind: row.row_kind,
      source_name: row.source_name,
      stable_target_kind: stableMapping.target_kind,
      stable_target_public_id: stableMapping.target_public_id,
      mapping_basis: stableMapping.mapping_basis,
      mapping_corroborating_fields: stableMapping.corroborating_fields,
      related_catalog_only_award_ids: stableMapping.related_catalog_only_award_ids,
      proposal_batch_id: batches.find((batch) => {
        const first = Number(batch.first_row_number);
        const last = Number(batch.last_row_number);
        return row.row_number >= first && row.row_number <= last;
      })?.batch_id,
      codex_validation: 'schema_identity_hash_excerpt_and_stable_target_mapping_pass',
      fact_status: 'no_matching_fact_produced',
      human_review_status: 'pending_named_human_reviewer',
    };
  });
  const reconciliation = {
    schema_version: 1,
    contract_id: 'p8m-proposal-reconciliation-v1',
    source_revision: SOURCE_REVISION,
    source_snapshot_sha256: SOURCE_SNAPSHOT_SHA256,
    accepted_p7_catalog_path: P8M_CATALOG_PATH,
    accepted_p7_catalog_sha256: CATALOG_SHA256,
    claude_receipt_sha256: sha256(data.receiptText),
    combined_output_sha256: combinedOutputSha256,
    status: errors.length === 0 ? 'validated_proposal_only_human_review_pending' : 'invalid',
    codex_validation_scope:
      'All 197 rows: exact identity, closed schema, input/output hashes, row coverage, correction excerpt grounding, prohibited fields, contact-string exclusion, proposal-only counters, recomputed totals, and stable mapping to 176 award plus 21 portal public IDs. This does not accept scholarship truth or semantic tag correctness.',
    human_fact_reviewer: null,
    matching_facts_produced: 0,
    accepted_facts: 0,
    reviewer_decisions: 0,
    stable_target_counts: {
      award: [...stableMappings.values()].filter((mapping) => mapping.target_kind === 'award').length,
      portal: [...stableMappings.values()].filter((mapping) => mapping.target_kind === 'portal').length,
      unique_public_ids: new Set(
        [...stableMappings.values()].map((mapping) => mapping.target_public_id),
      ).size,
      catalog_only_child_awards_without_source_rows: catalogOnlyAwards.length,
    },
    totals: recomputedTotals,
    catalog_only_child_award_review_queue: catalogOnlyAwards,
    rows: reconciliationRows,
  };

  const csvHeaders = [
    'row_number',
    'source_row_id',
    'row_kind',
    'source_name',
    'stable_target_kind',
    'stable_target_public_id',
    'mapping_basis',
    'mapping_corroborating_fields',
    'related_catalog_only_award_ids',
    'source_due_date',
    'source_geography',
    'source_application_method',
    'source_school_type',
    'source_renewal',
    'source_focus',
    'source_summary',
    'proposed_geography',
    'proposed_school_types',
    'proposed_renewal',
    'proposed_application_route',
    'proposed_topic_tags',
    'correction_candidates_json',
    'manual_review_reasons',
    'ambiguity_note',
    'claude_confidence',
    'codex_validation',
    'reviewer_name',
    'reviewed_at',
    'tag_decision',
    'correction_decision',
    'human_rationale',
  ];
  const csvRows = orderedRows.map((row) => {
    const sourceRow = sourceRows.get(row.row_number)!;
    const stableMapping = stableMappings.get(row.row_number) ?? {
      target_kind: row.row_kind === 'Scholarship' ? ('award' as const) : ('portal' as const),
      target_public_id: 'unresolved',
      mapping_basis: 'invalid_package',
      corroborating_fields: [],
      related_catalog_only_award_ids: [],
    };
    const values = [
      row.row_number,
      row.source_row_id,
      row.row_kind,
      row.source_name ?? '',
      stableMapping.target_kind,
      stableMapping.target_public_id,
      stableMapping.mapping_basis,
      stableMapping.corroborating_fields.join('|'),
      stableMapping.related_catalog_only_award_ids.join('|'),
      sourceRow.cells['Due Date'] ?? '',
      sourceRow.cells['In-State / National'] ?? '',
      sourceRow.cells['Application Link/Method'] ?? '',
      sourceRow.cells['School Type (2-or 4-Year, or Trade)'] ?? '',
      sourceRow.cells['Renewing/ Non-Renewing'] ?? '',
      sourceRow.cells.Focus ?? '',
      sourceRow.cells.Summary ?? '',
      row.tags.geography_scope,
      row.tags.school_types.join('|'),
      row.tags.renewal,
      row.tags.application_route,
      row.tags.topic_tags.join('|'),
      row.correction_candidates,
      row.manual_review_reasons.join('|'),
      row.ambiguity_note ?? '',
      row.confidence,
      'schema_identity_hash_and_excerpt_pass; proposal_only; not_fact_accepted',
      '',
      '',
      '',
      '',
      '',
    ];
    return values.map(csvCell).join(',');
  });
  const humanReviewCsv = `${csvHeaders.map(csvCell).join(',')}\n${csvRows.join('\n')}\n`;

  return {
    errors,
    summary: {
      source_revision: SOURCE_REVISION,
      source_snapshot_sha256: SOURCE_SNAPSHOT_SHA256,
      accepted_p7_catalog_sha256: CATALOG_SHA256,
      claude_receipt_sha256: sha256(data.receiptText),
      combined_output_sha256: combinedOutputSha256,
      totals: recomputedTotals,
      side_effects: sideEffects,
    },
    reconciliation,
    humanReviewCsv,
  };
}

export function validateP8mPackageAt(repoRoot: string): P8mValidationResult {
  return validateP8mPackage(loadP8mPackage(repoRoot));
}

function main(): void {
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
  const result = validateP8mPackageAt(repoRoot);
  if (result.errors.length > 0) {
    console.error(result.errors.join('\n'));
    process.exitCode = 1;
    return;
  }

  if (process.argv.includes('--write-review-package')) {
    fs.writeFileSync(
      path.join(repoRoot, P8M_RECONCILIATION_PATH),
      `${JSON.stringify(result.reconciliation, null, 2)}\n`,
    );
    fs.writeFileSync(path.join(repoRoot, P8M_HUMAN_REVIEW_PATH), result.humanReviewCsv);
  }

  if (process.argv.includes('--check')) {
    const expectedReconciliation = `${JSON.stringify(result.reconciliation, null, 2)}\n`;
    const actualReconciliation = fs.readFileSync(
      path.join(repoRoot, P8M_RECONCILIATION_PATH),
      'utf8',
    );
    const actualReview = fs.readFileSync(path.join(repoRoot, P8M_HUMAN_REVIEW_PATH), 'utf8');
    if (actualReconciliation !== expectedReconciliation) {
      console.error(`${P8M_RECONCILIATION_PATH} is stale`);
      process.exitCode = 1;
      return;
    }
    if (actualReview !== result.humanReviewCsv) {
      console.error(`${P8M_HUMAN_REVIEW_PATH} is stale`);
      process.exitCode = 1;
      return;
    }
  }

  const totals = result.summary.totals as JsonRecord;
  console.log(
    `P8M PROPOSAL CHECK PASS ${totals.total_returned_rows} rows, ${totals.scholarship_rows} Scholarship, ${totals.portal_rows} Portal, ${totals.correction_candidate_count} corrections, 0 accepted facts`,
  );
}

if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1] ?? '')) main();
