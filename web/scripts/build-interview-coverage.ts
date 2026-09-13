import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (p: string) => fs.readFileSync(path.join(root, p), 'utf8');
const sha = (s: string) => crypto.createHash('sha256').update(s).digest('hex');
const ledger = JSON.parse(read('docs/evidence/PLAN-REV16-mapping.json'));
for (const [p, hash] of Object.entries(ledger.inputs)) assert.equal(sha(read(p)), hash, `Pinned input changed: ${p}`);
const source = JSON.parse(read('web/fixtures/p8m/master-database-rev225.json'));
const reviewed = JSON.parse(read('web/fixtures/p8m/matching-facts-v1.json'));
const catalog = JSON.parse(read('web/fixtures/p7/student-catalog.json'));
assert.equal(ledger.connections.length, 4);
assert.equal(new Set(ledger.connections.map((c: { id: string }) => c.id)).size, 4);
const connections = ledger.connections.map((c: { id: string; sourceRow: number; sourceRowId: string; sourceField: string; evidenceExcerpt: string; awardId: string; answerId: string; message: string }) => {
  const s = source.rows.find((r: { row_number: number }) => r.row_number === c.sourceRow);
  const r = reviewed.reviewed_rows.find((r: { row_number: number }) => r.row_number === c.sourceRow);
  assert.equal(c.sourceRowId, s.source_row_id); assert.equal(c.evidenceExcerpt, s.cells[c.sourceField]);
  assert.equal(r.target_kind, 'award'); assert.equal(c.awardId, r.target_public_id);
  assert(catalog.awards.some((a: { publicId: string }) => a.publicId === c.awardId));
  assert(['education_teaching', 'org_nths', 'org_ffa'].includes(c.answerId));
  return { id: c.id, answerId: c.answerId, awardId: c.awardId, message: c.message };
});
const publication = { schemaVersion: 1, id: ledger.id, basis: ledger.basis, snapshotDate: ledger.snapshotDate, sourceRevision: ledger.sourceRevision, connections };
const bytes = JSON.stringify(publication, null, 2) + '\n';
const outputs = { 'web/fixtures/coverage/interview-coverage-v1.json': bytes, 'web/fixtures/coverage/pin.json': JSON.stringify({ id: publication.id, sha256: sha(bytes) }, null, 2) + '\n' };
for (const [p, value] of Object.entries(outputs)) {
  if (process.argv.includes('--write')) { fs.mkdirSync(path.dirname(path.join(root, p)), { recursive: true }); fs.writeFileSync(path.join(root, p), value); }
  else assert.equal(read(p), value, `Generated coverage differs: ${p}`);
}
console.log('Coverage supplement PASS: four exact connections; frozen inputs preserved; SHA-256 ' + sha(bytes));
