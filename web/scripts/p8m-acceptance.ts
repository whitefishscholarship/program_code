import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  loadP8mPackage,
  P8M_HUMAN_FACT_REVIEWER,
  P8M_HUMAN_REVIEW_PATH,
  P8M_RECONCILIATION_PATH,
  P8M_SOURCE_SNAPSHOT_PATH,
  validateP8mPackage,
  type P8mProposalRow,
} from './p8m-proposals';

export const P8M_SOURCE_FIELDS_PATH = 'docs/evidence/P8M-omitted-source-fields.csv';
export const P8M_REVIEW_DIGEST_PATH = 'docs/evidence/P8M-review-digest.md';
export const P8M_REVIEW_VALIDATION_PATH =
  'docs/evidence/P8M-human-review-validation.md';
export const P8M_PUBLICATION_PATH = 'web/fixtures/p8m/matching-facts-v1.json';

const SOURCE_REVISION = '225';
const SOURCE_SNAPSHOT_SHA256 =
  'cf898d6cbb5bfb6d4d576fc77e4d1666f0f67ee3cb01ed7cd16ee7991a9c4106';
const HUMAN_REVIEW_SHA256 =
  '2f30b7c565abbf67f9ee4bcb2012c596c2cc445aae542b65aec58defaf433b7a';
const SOURCE_FIELDS_SHA256 =
  '76433a0571bbcc3475707ef22a9df0a08f8b92858cdc84a298126340c275317f';
const REVIEW_DIGEST_SHA256 =
  '85960fd18068fdf7aed2aca7f7255189b8cd9e8f20b4c2df08c89ed212fbf4d8';
const REVIEW_VALIDATION_SHA256 =
  '831bfa0cc3cd91091b7aa6d6a0cacb02d5f9ff2c54f8cb0b527be41cd7173ddc';
const REVIEWED_AT = '2026-09-06T17:05:35-06:00';
const ACCEPTED_FACT_SHA256 =
  '4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945';

const REVIEW_HEADERS = [
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
] as const;

const SOURCE_FIELD_HEADERS = [
  'row_number',
  'source_row_id',
  'source_name',
  'last_updated',
  'amount',
  'scholarship_location_information',
  'stated_min_gpa',
  'acute_financial_need_prioritization',
  'accepts_gap_year_applications_upon_return',
  'application_link_method',
] as const;

const SOURCE_FIELD_MAP: Record<(typeof SOURCE_FIELD_HEADERS)[number], string | null> = {
  row_number: null,
  source_row_id: null,
  source_name: null,
  last_updated: 'Last Updated',
  amount: 'Amount',
  scholarship_location_information: 'Scholarship Location/Information',
  stated_min_gpa: 'Stated Min. GPA',
  acute_financial_need_prioritization: 'Acute Financial Need Prioritization',
  accepts_gap_year_applications_upon_return:
    'Accepts Gap Year Applications Upon Return',
  application_link_method: 'Application Link/Method',
};

type CsvRow = Record<string, string>;
type Tags = P8mProposalRow['tags'];
type TagOverride = Partial<{
  geography_scope: string;
  school_types: string[];
  renewal: string;
  application_route: string;
  topic_tags: string[];
}>;

const TAG_OVERRIDES = new Map<number, TagOverride>([
  [2, { school_types: ['four_year', 'two_year'] }],
  [19, { application_route: 'other' }],
  [23, { geography_scope: 'unknown' }],
  [29, { geography_scope: 'unknown' }],
  [30, { renewal: 'renewable' }],
  [33, { topic_tags: ['community_service'] }],
  [34, { topic_tags: ['community_service'] }],
  [35, { geography_scope: 'unknown', topic_tags: ['community_service', 'company_employee'] }],
  [48, { topic_tags: ['unknown'] }],
  [56, { topic_tags: ['community_service', 'financial_need', 'healthcare', 'merit'] }],
  [60, { application_route: 'other' }],
  [63, { application_route: 'other' }],
  [67, { application_route: 'other' }],
  [69, { topic_tags: ['unknown'] }],
  [83, { application_route: 'other' }],
  [98, { school_types: ['any'] }],
  [114, { topic_tags: ['unknown'] }],
  [136, { application_route: 'unknown' }],
  [138, { topic_tags: ['arts_humanities', 'female', 'stem'] }],
  [144, { school_types: ['certificate', 'trade_vocational', 'two_year'] }],
  [151, { application_route: 'unknown' }],
]);

const NEEDS_MORE_EVIDENCE_ROWS = new Set([23, 29, 48, 69, 114, 136, 151]);
const REVISE_ROWS = new Set([2, 19, 30, 33, 34, 35, 56, 60, 63, 67, 83, 98, 138, 144]);
const CORRECTION_REJECT_ROWS = new Set([55]);
const DISAGREEMENT_ROWS = new Set([
  ...NEEDS_MORE_EVIDENCE_ROWS,
  ...REVISE_ROWS,
  ...CORRECTION_REJECT_ROWS,
]);

function sha256(value: string | Buffer): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value as Record<string, unknown>)
        .sort()
        .map((key) => [key, stableValue((value as Record<string, unknown>)[key])]),
    );
  }
  return value;
}

function stableJson(value: unknown): string {
  return JSON.stringify(stableValue(value));
}

export function parseCsv(text: string): { headers: string[]; rows: CsvRow[] } {
  const records: string[][] = [];
  let record: string[] = [];
  let field = '';
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ',') {
      record.push(field);
      field = '';
    } else if (character === '\n') {
      record.push(field.replace(/\r$/, ''));
      records.push(record);
      record = [];
      field = '';
    } else {
      field += character;
    }
  }
  if (quoted) throw new Error('CSV ends inside a quoted field');
  if (field.length > 0 || record.length > 0) {
    record.push(field);
    records.push(record);
  }
  const headers = records.shift() ?? [];
  const rows = records
    .filter((values) => values.some((value) => value.length > 0))
    .map((values, index) => {
      if (values.length !== headers.length) {
        throw new Error(`CSV row ${index + 2} has ${values.length} fields; expected ${headers.length}`);
      }
      return Object.fromEntries(headers.map((header, column) => [header, values[column]]));
    });
  return { headers, rows };
}

function mergeTags(tags: Tags, override: TagOverride | undefined): Tags {
  return {
    geography_scope: override?.geography_scope ?? tags.geography_scope,
    school_types: override?.school_types ?? tags.school_types,
    renewal: override?.renewal ?? tags.renewal,
    application_route: override?.application_route ?? tags.application_route,
    topic_tags: override?.topic_tags ?? tags.topic_tags,
  };
}

export type P8mAcceptanceResult = {
  errors: string[];
  publication: Record<string, unknown>;
  reconciliation: Record<string, unknown>;
  summary: Record<string, unknown>;
};

export function validateP8mAcceptanceAt(
  repoRoot: string,
  fileOverrides: ReadonlyMap<string, string> = new Map(),
): P8mAcceptanceResult {
  const errors: string[] = [];
  const read = (relativePath: string): string =>
    fileOverrides.get(relativePath) ?? fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
  const proposalData = loadP8mPackage(repoRoot);
  const proposalResult = validateP8mPackage(proposalData);
  errors.push(...proposalResult.errors.map((error) => `proposal package: ${error}`));

  const artifactHashes = new Map<string, string>([
    [P8M_HUMAN_REVIEW_PATH, HUMAN_REVIEW_SHA256],
    [P8M_SOURCE_FIELDS_PATH, SOURCE_FIELDS_SHA256],
    [P8M_REVIEW_DIGEST_PATH, REVIEW_DIGEST_SHA256],
    [P8M_REVIEW_VALIDATION_PATH, REVIEW_VALIDATION_SHA256],
    [P8M_SOURCE_SNAPSHOT_PATH, SOURCE_SNAPSHOT_SHA256],
  ]);
  for (const [relativePath, expectedHash] of artifactHashes) {
    const actualHash = sha256(read(relativePath));
    if (actualHash !== expectedHash) {
      errors.push(`${relativePath} SHA-256 ${actualHash} differs from ${expectedHash}`);
    }
  }

  let completed: ReturnType<typeof parseCsv> = { headers: [], rows: [] };
  let pending: ReturnType<typeof parseCsv> = { headers: [], rows: [] };
  let sourceFields: ReturnType<typeof parseCsv> = { headers: [], rows: [] };
  try {
    completed = parseCsv(read(P8M_HUMAN_REVIEW_PATH));
    pending = parseCsv(proposalResult.humanReviewCsv);
    sourceFields = parseCsv(read(P8M_SOURCE_FIELDS_PATH));
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }

  if (stableJson(completed.headers) !== stableJson(REVIEW_HEADERS)) {
    errors.push('human-review CSV header differs from the governed 31-column schema');
  }
  if (stableJson(sourceFields.headers) !== stableJson(SOURCE_FIELD_HEADERS)) {
    errors.push('source-fields CSV header differs from the governed 10-column schema');
  }
  if (completed.rows.length !== 197 || pending.rows.length !== 197 || sourceFields.rows.length !== 197) {
    errors.push('P8M acceptance requires exactly 197 rows in each review artifact');
  }

  const proposalRows = [...proposalData.outputs.values()]
    .flatMap((output) => output.rows)
    .sort((left, right) => left.row_number - right.row_number);
  const proposalByRow = new Map(proposalRows.map((row) => [row.row_number, row]));
  const snapshotByRow = new Map(proposalData.snapshot.rows.map((row) => [row.row_number, row]));
  const decisionCounts: Record<string, number> = {};
  const correctionCounts: Record<string, number> = {};
  const finalRows: Array<Record<string, unknown>> = [];

  for (let index = 0; index < 197; index += 1) {
    const expectedRowNumber = index + 2;
    const row = completed.rows[index] ?? {};
    const pendingRow = pending.rows[index] ?? {};
    const sourceFieldRow = sourceFields.rows[index] ?? {};
    const proposal = proposalByRow.get(expectedRowNumber);
    const snapshotRow = snapshotByRow.get(expectedRowNumber);
    if (!proposal || !snapshotRow) {
      errors.push(`row ${expectedRowNumber} is missing from the pinned proposal package`);
      continue;
    }
    if (Number(row.row_number) !== expectedRowNumber || row.source_row_id !== proposal.source_row_id) {
      errors.push(`human-review row ${expectedRowNumber} identity or order differs from the pin`);
    }
    for (const header of REVIEW_HEADERS.slice(0, 27)) {
      if (row[header] !== pendingRow[header]) {
        errors.push(`human-review row ${expectedRowNumber} changed governed source column ${header}`);
      }
    }
    if (row.reviewer_name !== P8M_HUMAN_FACT_REVIEWER || row.reviewed_at !== REVIEWED_AT) {
      errors.push(`human-review row ${expectedRowNumber} lacks the exact reviewer/time pin`);
    }
    if (!['approve', 'revise', 'needs_more_evidence'].includes(row.tag_decision)) {
      errors.push(`human-review row ${expectedRowNumber} has invalid tag_decision`);
    }
    const expectedTagDecision = REVISE_ROWS.has(expectedRowNumber)
      ? 'revise'
      : NEEDS_MORE_EVIDENCE_ROWS.has(expectedRowNumber)
        ? 'needs_more_evidence'
        : 'approve';
    if (row.tag_decision !== expectedTagDecision) {
      errors.push(`human-review row ${expectedRowNumber} tag decision differs from the accepted review`);
    }
    const hasCorrections = proposal.correction_candidates.length > 0;
    const expectedCorrectionDecision = !hasCorrections
      ? 'not_applicable'
      : CORRECTION_REJECT_ROWS.has(expectedRowNumber)
        ? 'reject'
        : 'approve';
    if (row.correction_decision !== expectedCorrectionDecision) {
      errors.push(`human-review row ${expectedRowNumber} correction decision differs from the accepted review`);
    }
    if (!row.human_rationale.trim()) {
      errors.push(`human-review row ${expectedRowNumber} has no human rationale`);
    }
    decisionCounts[row.tag_decision] = (decisionCounts[row.tag_decision] ?? 0) + 1;
    correctionCounts[row.correction_decision] =
      (correctionCounts[row.correction_decision] ?? 0) + 1;

    if (
      Number(sourceFieldRow.row_number) !== expectedRowNumber ||
      sourceFieldRow.source_row_id !== snapshotRow.source_row_id ||
      sourceFieldRow.source_name !== (snapshotRow.source_name ?? '')
    ) {
      errors.push(`source-fields row ${expectedRowNumber} identity differs from the snapshot`);
    }
    for (const header of SOURCE_FIELD_HEADERS.slice(3)) {
      const sourceHeader = SOURCE_FIELD_MAP[header];
      const expected = sourceHeader ? (snapshotRow.cells[sourceHeader] ?? '') : '';
      if (sourceFieldRow[header] !== expected) {
        errors.push(`source-fields row ${expectedRowNumber} ${header} differs from the snapshot`);
      }
    }

    const finalTags = mergeTags(proposal.tags, TAG_OVERRIDES.get(expectedRowNumber));
    finalRows.push({
      row_number: expectedRowNumber,
      source_row_id: proposal.source_row_id,
      target_kind: row.stable_target_kind,
      target_public_id: row.stable_target_public_id,
      tag_decision: row.tag_decision,
      reviewed_tags: finalTags,
      correction_disposition:
        row.correction_decision === 'approve'
          ? 'approved_recommendation_unapplied'
          : row.correction_decision === 'reject'
            ? 'rejected_recommendation_unapplied'
            : 'not_applicable',
      official_verification_status: 'required_unavailable',
      matching_eligible: false,
    });
  }

  if (stableJson(decisionCounts) !== stableJson({ approve: 176, revise: 14, needs_more_evidence: 7 })) {
    errors.push(`tag decision totals differ: ${stableJson(decisionCounts)}`);
  }
  if (stableJson(correctionCounts) !== stableJson({ approve: 38, reject: 1, not_applicable: 158 })) {
    errors.push(`correction decision totals differ: ${stableJson(correctionCounts)}`);
  }
  if (TAG_OVERRIDES.size !== 21) errors.push('tag override ledger must contain exactly 21 rows');

  const digest = read(P8M_REVIEW_DIGEST_PATH);
  const partOne = digest.split(/^## Part 2\b/m)[0];
  const digestRows = [...partOne.matchAll(/^### Row (\d+)\b/gm)].map((match) => Number(match[1]));
  const expectedDigestRows = [...DISAGREEMENT_ROWS].sort((left, right) => left - right);
  const actualDigestRows = [...new Set(digestRows)].sort((left, right) => left - right);
  if (stableJson(actualDigestRows) !== stableJson(expectedDigestRows) || digestRows.length !== 22) {
    errors.push('review digest Part 1 does not identify exactly the 22 disagreement rows');
  }
  const validationReceipt = read(P8M_REVIEW_VALIDATION_PATH);
  for (const requiredHash of [
    HUMAN_REVIEW_SHA256,
    SOURCE_FIELDS_SHA256,
    REVIEW_DIGEST_SHA256,
    SOURCE_SNAPSHOT_SHA256,
  ]) {
    if (!validationReceipt.includes(requiredHash)) {
      errors.push(`validation receipt omits required hash ${requiredHash}`);
    }
  }

  const generatorPath = path.relative(
    repoRoot,
    fileURLToPath(import.meta.url),
  );
  const generatorSha256 = sha256(read(generatorPath));
  const publication: Record<string, unknown> = {
    schema_version: 1,
    publication_id: 'p8m-matching-facts-v1-rev225',
    taxonomy_version: '1.0.0',
    source_revision: SOURCE_REVISION,
    source_snapshot_sha256: SOURCE_SNAPSHOT_SHA256,
    human_review_sha256: HUMAN_REVIEW_SHA256,
    generator_sha256: generatorSha256,
    reviewer_name: P8M_HUMAN_FACT_REVIEWER,
    reviewed_at: REVIEWED_AT,
    status: 'human_reviewed_nonmatching_tags_published',
    policy: {
      reviewed_tags_use: 'sorting_filtering_grouping_only',
      matching_use: 'prohibited_without_accepted_official_source_facts',
      corrections: 'recommendations_only_unapplied',
      missing_or_unavailable_information: 'unknown_non_excluding',
      spreadsheet_writes: 0,
      external_url_reads: 0,
    },
    counts: {
      source_rows: 197,
      scholarship_rows: 176,
      portal_rows: 21,
      reviewed_tag_rows: 197,
      accepted_matching_facts: 0,
      approved_correction_recommendations: 39,
      rejected_correction_recommendations: 1,
      application_method_literal_urls: 100,
      application_method_without_literal_url: 97,
      location_fields_with_literal_url: 0,
    },
    accepted_facts: [],
    reviewed_rows: finalRows,
  };
  const humanRationaleSha256 = sha256(
    completed.rows.map((row) => `${row.row_number}\0${row.human_rationale}`).join('\n'),
  );
  const previousReconciliation = proposalResult.reconciliation as Record<string, unknown>;
  const reconciliation: Record<string, unknown> = {
    ...previousReconciliation,
    status: 'human_review_reconciled_publication_candidate',
    human_fact_reviewer: P8M_HUMAN_FACT_REVIEWER,
    reviewer_decisions: 197,
    human_review_sha256: HUMAN_REVIEW_SHA256,
    human_rationale_sha256: humanRationaleSha256,
    accepted_facts: [],
    matching_facts_produced: 0,
    decision_totals: {
      tags: decisionCounts,
      corrections: correctionCounts,
    },
    publication_path: P8M_PUBLICATION_PATH,
    accepted_fact_sha256: ACCEPTED_FACT_SHA256,
    rows: (previousReconciliation.rows as Array<Record<string, unknown>>).map((sourceRow, index) => ({
      ...sourceRow,
      human_review_status: 'complete',
      tag_decision: completed.rows[index]?.tag_decision,
      correction_decision: completed.rows[index]?.correction_decision,
      reviewed_tags: finalRows[index]?.reviewed_tags,
      matching_fact_status: 'none_official_verification_unavailable',
    })),
  };

  return {
    errors,
    publication,
    reconciliation,
    summary: {
      source_rows: 197,
      tag_decisions: decisionCounts,
      correction_decisions: correctionCounts,
      accepted_matching_facts: 0,
      accepted_fact_sha256: ACCEPTED_FACT_SHA256,
      human_review_sha256: HUMAN_REVIEW_SHA256,
      publication_sha256: sha256(`${JSON.stringify(publication, null, 2)}\n`),
      reconciliation_sha256: sha256(`${JSON.stringify(reconciliation, null, 2)}\n`),
      generator_sha256: generatorSha256,
    },
  };
}

function main(): void {
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
  const result = validateP8mAcceptanceAt(repoRoot);
  if (result.errors.length > 0) {
    console.error(result.errors.join('\n'));
    process.exitCode = 1;
    return;
  }
  const publicationText = `${JSON.stringify(result.publication, null, 2)}\n`;
  const reconciliationText = `${JSON.stringify(result.reconciliation, null, 2)}\n`;
  if (process.argv.includes('--write')) {
    fs.mkdirSync(path.join(repoRoot, path.dirname(P8M_PUBLICATION_PATH)), { recursive: true });
    fs.writeFileSync(path.join(repoRoot, P8M_PUBLICATION_PATH), publicationText);
    fs.writeFileSync(path.join(repoRoot, P8M_RECONCILIATION_PATH), reconciliationText);
  }
  if (process.argv.includes('--check')) {
    if (readExisting(repoRoot, P8M_PUBLICATION_PATH) !== publicationText) {
      console.error(`${P8M_PUBLICATION_PATH} is stale`);
      process.exitCode = 1;
      return;
    }
    if (readExisting(repoRoot, P8M_RECONCILIATION_PATH) !== reconciliationText) {
      console.error(`${P8M_RECONCILIATION_PATH} is stale`);
      process.exitCode = 1;
      return;
    }
  }
  console.log(`P8M ACCEPTANCE CHECK PASS ${JSON.stringify(result.summary)}`);
}

function readExisting(repoRoot: string, relativePath: string): string | null {
  const absolutePath = path.join(repoRoot, relativePath);
  return fs.existsSync(absolutePath) ? fs.readFileSync(absolutePath, 'utf8') : null;
}

if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1] ?? '')) main();
