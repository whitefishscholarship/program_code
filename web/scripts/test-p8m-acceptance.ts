import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  parseCsv,
  P8M_REVIEW_DIGEST_PATH,
  P8M_REVIEW_VALIDATION_PATH,
  P8M_SOURCE_FIELDS_PATH,
  validateP8mAcceptanceAt,
} from './p8m-acceptance';
import { P8M_HUMAN_REVIEW_PATH } from './p8m-proposals';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relativePath: string): string =>
  fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');

const baseline = validateP8mAcceptanceAt(repoRoot);
assert.deepEqual(baseline.errors, []);
assert.equal((baseline.publication.accepted_facts as unknown[]).length, 0);
assert.equal((baseline.publication.reviewed_rows as unknown[]).length, 197);
assert.equal(
  JSON.stringify(baseline.publication).includes('application_group'),
  false,
  'publication must not invent application-group fields',
);
assert.equal(
  /"cycle(?:_id)?"/.test(JSON.stringify(baseline.publication)),
  false,
  'publication must not invent cycle fields',
);

const csvProbe = parseCsv('a,b\n"line 1\nline 2","quoted ""value"""\n');
assert.deepEqual(csvProbe.headers, ['a', 'b']);
assert.deepEqual(csvProbe.rows, [{ a: 'line 1\nline 2', b: 'quoted "value"' }]);

const mutations: Array<[string, string]> = [
  [
    P8M_HUMAN_REVIEW_PATH,
    read(P8M_HUMAN_REVIEW_PATH).replace(
      'master-database-row-0002',
      'master-database-row-mutated',
    ),
  ],
  [
    P8M_HUMAN_REVIEW_PATH,
    read(P8M_HUMAN_REVIEW_PATH).replace(',revise,not_applicable,', ',approve,not_applicable,'),
  ],
  [
    P8M_HUMAN_REVIEW_PATH,
    read(P8M_HUMAN_REVIEW_PATH).replace('Kelsey Stuart', 'Claude'),
  ],
  [
    P8M_HUMAN_REVIEW_PATH,
    read(P8M_HUMAN_REVIEW_PATH).replace(
      '2026-09-06T17:05:35-06:00',
      '2026-09-06T17:05:36-06:00',
    ),
  ],
  [
    P8M_SOURCE_FIELDS_PATH,
    read(P8M_SOURCE_FIELDS_PATH).replace('12/11/2026', '12/12/2026'),
  ],
  [
    P8M_REVIEW_DIGEST_PATH,
    read(P8M_REVIEW_DIGEST_PATH).replace('### Row 2 ', '### Row 200 '),
  ],
  [
    P8M_REVIEW_VALIDATION_PATH,
    read(P8M_REVIEW_VALIDATION_PATH).replace(
      '2f30b7c565abbf67f9ee4bcb2012c596c2cc445aae542b65aec58defaf433b7a',
      '0'.repeat(64),
    ),
  ],
];

for (const [relativePath, mutatedText] of mutations) {
  const result = validateP8mAcceptanceAt(repoRoot, new Map([[relativePath, mutatedText]]));
  assert(result.errors.length > 0, `${relativePath} mutation must fail closed`);
}

console.log(`P8M ACCEPTANCE TEST PASS baseline plus ${mutations.length} fail-closed mutations`);
