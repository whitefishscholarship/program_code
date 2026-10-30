import fs from 'node:fs';
import crypto from 'node:crypto';
import { AWARD_TAG_KEYS, type AwardTagKey } from '../src/lib/awardTagSchema';
import { deriveAwardTags, step3Categories, type DeriveResult, type PageRead, type TaggableAward } from '../src/lib/awardTags';

const FLAG_PLACES: Array<{ id: string; question: string }> = [
  {
    id: 'award-9d1c9d543817',
    question: 'The page says only New York residents can apply. Whitefish students likely cannot apply. Should this award stay off their list?',
  },
  {
    id: 'award-3c66c7edc5d3',
    question: 'The page requires an active application with the Southeast Lineman Training Center in Trenton, Georgia. Whitefish students likely cannot apply unless they are in that program. Should this award stay off their list?',
  },
];

const FLAG_DEADLINES: Array<{ id: string; question: string }> = [
  {
    id: 'award-a9c6e0fcc5af',
    question: 'The page lists a deadline of May 10, 2026, and it does not list a new date. Is this award closed?',
  },
  {
    id: 'award-3c66c7edc5d3',
    question: 'The page lists a deadline of April 10, 2026, and it does not list a new date. Is this award closed?',
  },
  {
    id: 'award-5a371acc5f8b',
    question: 'The page lists a deadline of January 20, 2026, and it does not list a new date. Is this award closed?',
  },
];

const FLAG_NO_RULES: Record<string, string> = {
  'award-145de4f3884e': 'The application site did not show the rules. Who can apply, and is there a location limit?',
  'award-88d2adae4d6d': 'The linked file is only an image, so the rules could not be read. Who can apply, and is there a location limit?',
  'award-f72b8b128a76': 'The application site did not show the rules. Who can apply, and is there a location limit?',
  'award-5b93bad03efd': 'The WAI scholarship list did not include this award\'s rules. Who can apply, and is there a location limit?',
  'award-cd0fb7cd0c64': 'The WAI how-to-apply page did not state this award\'s rules. Who can apply, and is there a location limit?',
  'award-2126bc5d2f6b': 'The form did not state who can apply. Who can apply, and is there a location limit?',
  'award-116fe9ce5784': 'The linked file is only an image, so the rules could not be read. Who can apply, and is there a location limit?',
  'award-11c663acf42e': 'The application site did not show the rules. Who can apply, and is there a location limit?',
  'award-5dd6fcbcc0f8': 'The form did not state who can apply. Who can apply, and is there a location limit?',
  'award-47478b1163e1': 'The linked file is only an image, so the rules could not be read. Who can apply, and is there a location limit?',
  'award-0651dcec4d07': 'The linked file is only an image, so the rules could not be read. Who can apply, and is there a location limit?',
  'award-ffbd0f0b989f': 'The form did not state who can apply. Who can apply, and is there a location limit?',
  'award-2dc33d508924': 'The WAI scholarship list did not include this award\'s rules. Who can apply, and is there a location limit?',
  'award-607fe66710d6': 'The page showed winner stories, not the rules for who can apply. Which students can enter, and is there a location limit?',
  'award-273fe6406702': 'The WAI scholarship list did not include this award\'s rules. Who can apply, and is there a location limit?',
  'award-5dc2aab768d2': 'The slides showed dates only, not who can apply. Who can apply?',
  'award-5dd4c3d3988a': 'The form did not state who can apply. Is it only for girls graduating from Whitefish High School?',
  'award-d2b44a62c0a7': 'The application page did not state who can apply. Who can apply, and is there a location limit?',
  'award-bb8ca59a7f0f': 'The page lists two ways to qualify: an employee or dependent, or a Flathead Valley resident. Which students should this award include?',
};

const catalogPath = 'fixtures/r3/catalog-v1.json';
const reportPath = 'fixtures/r3/p1-tagging-report.md';
const pinPath = 'fixtures/r3/pin.json';
const readsPath = 'fixtures/r3/p1-page-reads.json';
const pageReads = fs.existsSync(readsPath)
  ? (JSON.parse(fs.readFileSync(readsPath, 'utf8')) as { reads: Record<string, PageRead & { url?: string }> }).reads
  : {};
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
  const stored = pageReads[award.publicId];
  const page: PageRead | null = stored ? { loaded: stored.loaded, text: stored.text } : null;
  const result = deriveAwardTags(award, linkIds.get(award.publicId) ?? [], page);
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
  lines.push('Each award now carries its own tags. The tags come from the award name, summary, and eligibility text. When an award had no place, its official page was opened and the rules on that page were added. A step 3 link is kept in the old files, but it is copied onto the award only when that text supports it.');
  lines.push('');
  lines.push('Checked by is `derived` for every award. A person has not confirmed these tags yet.');
  lines.push('');
  lines.push('If a page states no state or location limit, the place is national and the note is `no location limit listed`. `ruralRule` is `none` when the page does not state a rural preference.');
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
  const failed = items.filter((item) => item.result.notes.some((note) => note === 'The page did not load.'));
  const unread = items.filter((item) => item.result.notes.some((note) => note === 'The page loaded but this award\'s rules were not on it.'));
  lines.push('## Pages that did not load');
  lines.push('');
  lines.push(`${failed.length} awards. The place stays null because the official page did not load.`);
  lines.push('');
  const failedUrls = new Map<string, string[]>();
  for (const item of failed) {
    const url = pageReads[item.award.publicId]?.url ?? 'unknown url';
    const names = failedUrls.get(url) ?? [];
    names.push(item.award.name);
    failedUrls.set(url, names);
  }
  for (const [url, names] of [...failedUrls.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    lines.push(`- ${url}`);
    for (const name of names.sort((a, b) => a.localeCompare(b))) lines.push(`  - ${name}`);
  }
  lines.push('');
  lines.push('## Pages that loaded but did not show this award\'s rules');
  lines.push('');
  lines.push(`${unread.length} awards. The page opened, but the award's own rules were not on it, so the place stays null.`);
  lines.push('');
  for (const item of unread.sort((a, b) => a.award.name.localeCompare(b.award.name))) {
    const url = pageReads[item.award.publicId]?.url ?? 'unknown url';
    lines.push(`- ${item.award.name} | ${url}`);
  }
  lines.push('');
  lines.push(...flagForKelsey(items, unread));
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

function flagForKelsey(
  items: Array<{ award: TaggableAward; result: DeriveResult }>,
  unread: Array<{ award: TaggableAward; result: DeriveResult }>,
): string[] {
  const byId = new Map(items.map((item) => [item.award.publicId, item]));
  const lines: string[] = [];
  lines.push('## Flag for Kelsey');
  lines.push('');
  lines.push('These awards stay in the catalog. Each line is a question the page did not settle.');
  lines.push('');
  lines.push('### Place limits');
  lines.push('');
  for (const flag of FLAG_PLACES) lines.push(flagLine(byId.get(flag.id), flag.question));
  lines.push('');
  lines.push('### Passed deadlines with no new date');
  lines.push('');
  for (const flag of FLAG_DEADLINES) lines.push(flagLine(byId.get(flag.id), flag.question));
  lines.push('');
  const noRules = new Map<string, { award: TaggableAward; result: DeriveResult }>();
  for (const item of unread) noRules.set(item.award.publicId, item);
  const coffee = byId.get('award-bb8ca59a7f0f');
  if (coffee) noRules.set(coffee.award.publicId, coffee);
  const rows = [...noRules.values()].sort((a, b) => a.award.name.localeCompare(b.award.name));
  lines.push(`### Pages with no rules (${rows.length})`);
  lines.push('');
  for (const item of rows) {
    const question = FLAG_NO_RULES[item.award.publicId] ?? 'The page did not show this award\'s rules. Who can apply?';
    lines.push(flagLine(item, question));
  }
  lines.push('');
  return lines;
}

function flagLine(item: { award: TaggableAward } | undefined, question: string): string {
  const name = (item?.award.name ?? 'Missing award').replace(/\s+/g, ' ').trim();
  const url = item ? (pageReads[item.award.publicId]?.url ?? 'unknown url') : 'unknown url';
  return `- ${name} | ${url} | ${question}`;
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
