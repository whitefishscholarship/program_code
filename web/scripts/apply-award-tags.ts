import fs from 'node:fs';
import crypto from 'node:crypto';
import { AWARD_TAG_KEYS, type AwardTagKey } from '../src/lib/awardTagSchema';
import { deriveAwardTags, step3Categories, type DeriveResult, type TaggableAward } from '../src/lib/awardTags';

const catalogPath = 'fixtures/r3/catalog-v1.json';
const reportPath = 'fixtures/r3/p1-tagging-report.md';
const pinPath = 'fixtures/r3/pin.json';
const bundle = JSON.parse(fs.readFileSync(catalogPath, 'utf8')) as {
  catalog: { awards: Array<TaggableAward & Record<string, unknown>> };
  connections: Array<{ answerId: string; awardId: string }>;
};
const relevance = JSON.parse(fs.readFileSync('fixtures/relevance/interview-relevance-v1.json', 'utf8')) as { connections: Array<{ answerId: string; awardId: string }> };
const coverage = JSON.parse(fs.readFileSync('fixtures/coverage/interview-coverage-v1.json', 'utf8')) as { connections: Array<{ answerId: string; awardId: string }> };
const linkIds = new Map<string, string[]>();
for (const connection of [...bundle.connections, ...relevance.connections, ...coverage.connections]) {
  const current = linkIds.get(connection.awardId) ?? [];
  current.push(connection.answerId);
  linkIds.set(connection.awardId, current);
}

const rows: Array<{ award: TaggableAward; result: DeriveResult }> = [];
for (const award of bundle.catalog.awards) {
  const result = deriveAwardTags(award, linkIds.get(award.publicId) ?? []);
  for (const key of AWARD_TAG_KEYS) award[key] = result.tags[key];
  rows.push({ award, result });
}

fs.writeFileSync(catalogPath, `${JSON.stringify(bundle, null, 2)}\n`);
const pin = JSON.parse(fs.readFileSync(pinPath, 'utf8')) as { sha256: string };
pin.sha256 = crypto.createHash('sha256').update(fs.readFileSync(catalogPath)).digest('hex');
fs.writeFileSync(pinPath, `${JSON.stringify(pin, null, 2)}\n`);
fs.writeFileSync(reportPath, renderReport(rows));
console.log(JSON.stringify({
  awards: rows.length,
  withPlace: rows.filter((row) => row.result.tags.residencyScope).length,
  uncertain: rows.filter((row) => row.result.notes.length > 0).length,
  sha256: pin.sha256,
}, null, 2));

function renderReport(items: Array<{ award: TaggableAward; result: DeriveResult }>): string {
  const lines: string[] = [];
  lines.push('# Phase 1 award tags');
  lines.push('');
  lines.push('Each award now carries its own tags. The tags come from the award name, summary, and eligibility text. A step 3 link is kept in the old files, but it is copied onto the award only when that text supports it.');
  lines.push('');
  lines.push('Checked by is `derived` for every award. A person has not confirmed these tags yet.');
  lines.push('');
  lines.push('Pool level 1 is Whitefish only. Level 2 is Flathead County. Level 3 is a smaller area than one whole state. Level 4 is one whole state. Level 5 is bigger than one state, or open to the whole country but only for a specific group. Level 6 is open across the United States. A lower competition score means a smaller pool. Scores stay inside the band for that level, so local awards stay ahead of national ones.');
  lines.push('');
  lines.push(`Awards tagged: ${items.length}.`);
  lines.push('');
  lines.push('## Counts');
  lines.push('');
  for (const key of AWARD_TAG_KEYS) {
    lines.push(`### ${key}`);
    lines.push('');
    for (const [value, count] of countsFor(items, key)) lines.push(`- ${value}: ${count}`);
    lines.push('');
  }
  const uncertain = items.filter((item) => item.result.notes.length > 0).sort((a, b) => a.award.name.localeCompare(b.award.name));
  lines.push('## Awards left uncertain');
  lines.push('');
  lines.push(`${uncertain.length} awards still have a gap. The tag fields are filled with null where the page does not say.`);
  lines.push('');
  for (const item of uncertain) {
    lines.push(`- ${item.award.publicId} | ${item.award.name} | ${item.result.notes.join(' ')}`);
  }
  lines.push('');
  const categories = step3Categories();
  const used = new Map<string, number>();
  for (const item of items) for (const id of item.result.step3Ids) used.set(id, (used.get(id) ?? 0) + 1);
  const empty = categories.filter((category) => (used.get(category.id) ?? 0) === 0);
  lines.push('## Step 3 categories with 0 awards');
  lines.push('');
  if (empty.length === 0) lines.push('Every step 3 category has at least one award.');
  else for (const category of empty) lines.push(`- ${category.group}: ${category.label} (${category.id})`);
  lines.push('');
  lines.push('## Step 3 categories with awards');
  lines.push('');
  for (const category of categories) {
    if ((used.get(category.id) ?? 0) === 0) continue;
    lines.push(`- ${category.label}: ${used.get(category.id)}`);
  }
  lines.push('');
  lines.push('## Step 3 links the text does not support');
  lines.push('');
  lines.push('These old links stay in the step 3 files. They were not copied onto the award because the current award text does not say the same thing.');
  lines.push('');
  const byLink = new Map<string, string[]>();
  for (const item of items) {
    for (const id of item.result.unsupportedLinks) {
      const names = byLink.get(id) ?? [];
      names.push(item.award.name);
      byLink.set(id, names);
    }
  }
  if (byLink.size === 0) lines.push('None.');
  for (const [id, names] of [...byLink.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const label = categories.find((category) => category.id === id)?.label ?? id;
    lines.push(`- ${label} (${id}): ${names.length}`);
    for (const name of names.sort((a, b) => a.localeCompare(b))) lines.push(`  - ${name}`);
  }
  lines.push('');
  return `${lines.join('\n')}\n`;
}

function countsFor(items: Array<{ result: DeriveResult }>, key: AwardTagKey): Array<[string, number]> {
  const counts = new Map<string, number>();
  for (const item of items) {
    const value = item.result.tags[key];
    if (Array.isArray(value)) {
      if (value.length === 0) bump(counts, 'empty list');
      for (const entry of value) bump(counts, entry);
    } else if (value === null) bump(counts, 'null');
    else bump(counts, String(value));
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

function bump(counts: Map<string, number>, key: string) {
  counts.set(key, (counts.get(key) ?? 0) + 1);
}
