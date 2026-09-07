import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  csvCell,
  loadP8mPackage,
  P8M_HUMAN_FACT_REVIEWER,
  validateP8mPackage,
  type P8mPackageData,
  type P8mProposalRow,
} from './p8m-proposals';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function clonePackage(data: P8mPackageData): P8mPackageData {
  return {
    receiptText: data.receiptText,
    receipt: structuredClone(data.receipt),
    snapshotText: data.snapshotText,
    snapshot: structuredClone(data.snapshot),
    catalogText: data.catalogText,
    catalog: structuredClone(data.catalog),
    inputTexts: new Map(data.inputTexts),
    inputs: new Map(
      [...data.inputs.entries()].map(([key, value]) => [key, structuredClone(value)]),
    ),
    outputTexts: new Map(data.outputTexts),
    outputs: new Map(
      [...data.outputs.entries()].map(([key, value]) => [key, structuredClone(value)]),
    ),
  };
}

function firstRow(data: P8mPackageData): P8mProposalRow {
  const output = data.outputs.values().next().value;
  assert(output);
  return output.rows[0];
}

const baseline = loadP8mPackage(repoRoot);
const baselineResult = validateP8mPackage(baseline);
assert.deepEqual(baselineResult.errors, []);
assert.equal(
  (baselineResult.humanReviewCsv.match(new RegExp(`"${P8M_HUMAN_FACT_REVIEWER}"`, 'g')) ?? [])
    .length,
  197,
);
assert.equal(csvCell('=1+1'), '"\'=1+1"');
assert.equal(csvCell(' @SUM(A1:A2)'), '"\' @SUM(A1:A2)"');
assert.equal(csvCell('ordinary text'), '"ordinary text"');
assert.equal(csvCell('line one  \r\nline two \r\n'), '"line one\nline two\n"');

const mutations: Array<(data: P8mPackageData) => void> = [
  (data) => {
    data.outputs.values().next().value!.rows.pop();
  },
  (data) => {
    const output = data.outputs.values().next().value!;
    output.rows[1] = structuredClone(output.rows[0]);
  },
  (data) => {
    firstRow(data).source_row_id = 'wrong-source-row';
  },
  (data) => {
    Object.assign(firstRow(data), { unexpected_key: true });
  },
  (data) => {
    firstRow(data).tags.geography_scope = 'regional';
  },
  (data) => {
    firstRow(data).tags.topic_tags = ['merit', 'general'];
  },
  (data) => {
    firstRow(data).manual_review_reasons = ['official_verification_required'];
  },
  (data) => {
    const duplicate = [...data.outputs.values()]
      .flatMap((output) => output.rows)
      .find((row) => row.row_number === 26)!;
    duplicate.manual_review_reasons = duplicate.manual_review_reasons.filter(
      (reason) => reason !== 'duplicate_name',
    );
  },
  (data) => {
    const correction = [...data.outputs.values()]
      .flatMap((output) => output.rows)
      .flatMap((row) => row.correction_candidates)[0];
    correction.evidence_excerpt = 'fabricated excerpt';
  },
  (data) => {
    const correction = [...data.outputs.values()]
      .flatMap((output) => output.rows)
      .flatMap((row) => row.correction_candidates)[0];
    correction.evidence_field = correction.field;
  },
  (data) => {
    firstRow(data).ambiguity_note = 'See https://example.invalid';
  },
  (data) => {
    Object.assign(firstRow(data), { cycle_id: 'invented' });
  },
  (data) => {
    const key = data.outputTexts.keys().next().value!;
    data.outputTexts.set(key, `${data.outputTexts.get(key)} `);
  },
  (data) => {
    const key = data.inputTexts.keys().next().value!;
    data.inputTexts.set(key, `${data.inputTexts.get(key)} `);
  },
  (data) => {
    const output = data.outputs.values().next().value!;
    output.spreadsheet_writes = 1;
  },
  (data) => {
    (data.receipt.side_effects as Record<string, unknown>).accepted_facts = 1;
  },
  (data) => {
    data.catalogText = `${data.catalogText} `;
  },
  (data) => {
    const duplicate = data.catalog.awards.find(
      (award) => award.publicId === 'award-e05338ef963f',
    )!;
    duplicate.publicId = 'award-invalid';
  },
  (data) => {
    const input = data.inputs.values().next().value!;
    input.rows[0].fields.Summary = 'tampered input field';
  },
];

for (const [index, mutate] of mutations.entries()) {
  const candidate = clonePackage(baseline);
  mutate(candidate);
  assert(
    validateP8mPackage(candidate).errors.length > 0,
    `adversarial mutation ${index + 1} must fail closed`,
  );
}

console.log(
  `P8M PROPOSAL TEST PASS baseline package and ${mutations.length} fail-closed adversarial mutations`,
);
