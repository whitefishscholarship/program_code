import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (p: string) => fs.readFileSync(path.join(root, p));
const digest = (bytes: Buffer | string) => crypto.createHash('sha256').update(bytes).digest('hex');
const sourcePath = 'web/fixtures/p8m/master-database-rev225.json';
const reviewPath = 'web/fixtures/p8m/matching-facts-v1.json';
const source = JSON.parse(read(sourcePath).toString());
const review = JSON.parse(read(reviewPath).toString());
if (digest(read(sourcePath)) !== 'cf898d6cbb5bfb6d4d576fc77e4d1666f0f67ee3cb01ed7cd16ee7991a9c4106' || digest(read(reviewPath)) !== '16db9f32a14c7b63d2a912a84c43ac973ae43a07d7c40841174d6fbdfd5a6b07') throw new Error('Input snapshot/review changed; a new bounded refresh and review are required.');
// Independently inspected exceptions: do not confuse renewal/college/weighted GPA with entry unweighted GPA.
const gpaExceptions: Record<number, string> = {
  6: 'Ongoing college GPA condition; entry requirement not established.',
  30: 'GPA is described as a maintenance condition, not an entry minimum.',
  98: 'College-versus-high-school GPA applicability is unresolved.',
  158: 'Weighted GPA cannot be compared with the interview unweighted GPA.',
};
const ledger: unknown[] = [];
const rows = source.rows.map((row: any) => {
  const reviewed = review.reviewed_rows.find((r: any) => r.source_row_id === row.source_row_id);
  if (!reviewed || reviewed.row_number !== row.row_number) throw new Error('Missing exact reviewed row identity.');
  const rawGpa = String(row.cells['Stated Min. GPA'] ?? '').trim();
  const numericGpa = /^\d(?:\.\d{1,2})?\+?$/.test(rawGpa) ? Number(rawGpa.replace('+', '')) : null;
  const minimumGpa = row.row_kind === 'Scholarship' && !gpaExceptions[row.row_number] && numericGpa !== null && numericGpa >= 0 && numericGpa <= 4 ? numericGpa : null;
  const reviewedTypes: string[] = reviewed.reviewed_tags?.school_types ?? [];
  const schoolTypes = reviewedTypes.length && reviewedTypes.every((x: string) => ['two_year', 'four_year', 'trade_vocational', 'certificate'].includes(x))
    ? [...new Set(reviewedTypes.map((x: string) => x === 'certificate' ? 'trade_vocational' : x))].sort() : [];
  const route: string | null = reviewed.reviewed_tags?.application_route ?? null;
  const preferences: Record<string, string> = { paper: 'offline', offline_or_counselor: 'offline', provider_form: 'direct_per_award', automatic_consideration: 'automatic_consideration' };
  const gpaNote = gpaExceptions[row.row_number] ?? (minimumGpa === null ? 'No usable numeric minimum in the saved cell.' : 'Explicit numeric minimum-GPA cell, checked for scope conflicts.');
  ledger.push({ row: row.row_number, sourceRowId: row.source_row_id, targetKind: reviewed.target_kind, targetId: reviewed.target_public_id, gpaCell: `J${row.row_number}`, gpaSource: rawGpa, minimumGpa, gpaDisposition: gpaNote, schoolTypes, schoolBasis: 'Resolved P8M human-reviewed school_types; any, unknown, and unsupported values impose no restriction.', applicationPreference: preferences[route ?? ''] ?? null });
  return { sourceRow: row.row_number, targetKind: reviewed.target_kind, targetId: reviewed.target_public_id, minimumGpa, schoolTypes, applicationPreference: preferences[route ?? ''] ?? null };
});
if (rows.length !== 197 || new Set(rows.map((r: any) => r.targetId)).size !== 197) throw new Error('Incomplete or duplicate source ledger.');
const catalog = JSON.parse(read('web/fixtures/p7/student-catalog.json').toString());
const awards = new Set(catalog.awards.map((a: any) => a.publicId));
const awardRows = rows.filter((r: any) => r.targetKind === 'award');
if (awardRows.length !== 176 || awardRows.some((r: any) => !awards.has(r.targetId))) throw new Error('Award mapping does not reconcile.');
const publication = { schemaVersion: 1, id: 'spreadsheet-shortlist-v1-rev225', basis: 'organizer_recorded_not_officially_verified', snapshotDate: source.captured_at.slice(0, 10), sourceRevision: '225', sourceSha256: digest(read(sourcePath)), reviewSha256: digest(read(reviewPath)), counts: { sourceRows: 197, awardRows: 176, portalRows: 21, catalogAwards: 192, catalogOnlyAwards: 16, gpaRules: awardRows.filter((r: any) => r.minimumGpa !== null).length, schoolRules: awardRows.filter((r: any) => r.schoolTypes.length).length }, rows };
const bytes = JSON.stringify(publication, null, 2) + '\n';
const outputs: Record<string, string> = {
  'web/fixtures/shortlist/spreadsheet-shortlist-v1.json': bytes,
  'web/fixtures/shortlist/pin.json': JSON.stringify({ id: publication.id, sha256: digest(bytes) }, null, 2) + '\n',
  'docs/evidence/PLAN-REV13-row-reconciliation.json': JSON.stringify({ sourcePath, reviewPath, sourceSha256: publication.sourceSha256, reviewSha256: publication.reviewSha256, publicationSha256: digest(bytes), counts: publication.counts, catalogOnlyAwardIds: [...awards].filter(id => !awardRows.some((r: any) => r.targetId === id)).sort(), rows: ledger }, null, 2) + '\n',
};
for (const [p, value] of Object.entries(outputs)) {
  if (process.argv.includes('--write')) { fs.mkdirSync(path.dirname(path.join(root, p)), { recursive: true }); fs.writeFileSync(path.join(root, p), value); }
  else if (read(p).toString() !== value) throw new Error(`Generated artifact differs: ${p}`);
}
console.log(JSON.stringify(publication.counts));
