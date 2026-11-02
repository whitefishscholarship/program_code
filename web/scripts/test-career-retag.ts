import assert from 'node:assert/strict';
import fs from 'node:fs';
import { deriveAwardTags, type PageRead, type TaggableAward } from '../src/lib/awardTags';
import { CAREER_CHOICES } from '../src/lib/careerClusters';

type GoldAward = {
  publicId: string;
  name: string;
  focus: string | null;
  previous: string[] | null;
  expected: string[] | null;
  removedIncorrect: string[];
  reason: string;
};

const bundle = JSON.parse(fs.readFileSync('fixtures/r3/catalog-v1.json', 'utf8')) as {
  catalog: { awards: TaggableAward[] };
  connections: Array<{ answerId: string; awardId: string }>;
};
const reads = JSON.parse(fs.readFileSync('fixtures/r3/p1-page-reads.json', 'utf8')).reads as Record<string, PageRead>;
const relevance = JSON.parse(fs.readFileSync('fixtures/relevance/interview-relevance-v1.json', 'utf8')) as { connections: Array<{ answerId: string; awardId: string }> };
const coverage = JSON.parse(fs.readFileSync('fixtures/coverage/interview-coverage-v1.json', 'utf8')) as { connections: Array<{ answerId: string; awardId: string }> };
const gold = JSON.parse(fs.readFileSync('fixtures/career/career-gold.json', 'utf8')) as { schemaVersion: number; awards: GoldAward[] };
const linkIds = new Map<string, string[]>();
for (const connection of [...bundle.connections, ...relevance.connections, ...coverage.connections]) {
  const current = linkIds.get(connection.awardId) ?? [];
  current.push(connection.answerId);
  linkIds.set(connection.awardId, current);
}
const byId = new Map(bundle.catalog.awards.map((award) => [award.publicId, award]));
const alias: Record<string, string> = {
  STEM: 'engineering',
  healthcare: 'health',
  'skilled trades': 'trades',
  teaching: 'education',
  'public service': 'law',
};
const clusters = CAREER_CHOICES.filter((choice) => choice.id !== 'any').map((choice) => choice.id);

function same(left: string[] | null, right: string[] | null): boolean {
  return JSON.stringify([...(left ?? [])].sort()) === JSON.stringify([...(right ?? [])].sort());
}

const mismatches: string[] = [];
const falsePositives: string[] = [];
const falseNegatives: string[] = [];
const lost: string[] = [];
const diffs: string[] = [];
for (const row of gold.awards) {
  const award = byId.get(row.publicId);
  assert(award, row.publicId);
  const page = reads[row.publicId];
  const derived = deriveAwardTags(award, linkIds.get(row.publicId) ?? [], page ? { loaded: page.loaded, text: page.text } : null).tags.plans;
  if (!same(derived, row.expected)) {
    mismatches.push(`${row.name}: derived ${JSON.stringify(derived)} expected ${JSON.stringify(row.expected)}`);
  }
  const expected = new Set(row.expected ?? []);
  const predicted = new Set(derived ?? []);
  for (const plan of predicted) {
    if (!expected.has(plan)) falsePositives.push(`${row.name}: ${plan}. ${row.reason}`);
  }
  for (const plan of expected) {
    if (!predicted.has(plan)) falseNegatives.push(`${row.name}: ${plan}. ${row.reason}`);
  }
  for (const plan of row.previous ?? []) {
    const mapped = alias[plan] ?? plan;
    if (!expected.has(mapped) && !row.removedIncorrect.includes(plan) && !row.removedIncorrect.includes(mapped)) {
      lost.push(`${row.name}: lost ${plan}`);
    }
  }
  if (!same(row.previous, row.expected)) {
    diffs.push(`- ${row.name} | was ${JSON.stringify(row.previous)} | now ${JSON.stringify(row.expected)} | ${row.reason}`);
  }
}

const metrics = clusters.map((cluster) => {
  let tp = 0;
  let fp = 0;
  let fn = 0;
  for (const row of gold.awards) {
    const award = byId.get(row.publicId);
    const page = reads[row.publicId];
    const derived = deriveAwardTags(award as TaggableAward, linkIds.get(row.publicId) ?? [], page ? { loaded: page.loaded, text: page.text } : null).tags.plans ?? [];
    const expected = row.expected ?? [];
    const hit = derived.includes(cluster);
    const want = expected.includes(cluster);
    if (hit && want) tp += 1;
    else if (hit) fp += 1;
    else if (want) fn += 1;
  }
  const precision = tp + fp === 0 ? null : tp / (tp + fp);
  const recall = tp + fn === 0 ? null : tp / (tp + fn);
  return { cluster, tp, fp, fn, precision, recall };
});

assert.equal(mismatches.length, 0, mismatches.join('\n'));
assert.equal(falsePositives.length, 0, falsePositives.join('\n'));
assert.equal(falseNegatives.length, 0, falseNegatives.join('\n'));
assert.equal(lost.length, 0, lost.join('\n'));
for (const row of metrics) {
  if (row.precision === null && row.recall === null) continue;
  assert.equal(row.precision, 1, row.cluster);
  assert.equal(row.recall, 1, row.cluster);
}
assert(gold.awards.length >= 180, `gold set is ${gold.awards.length}`);
for (const name of ['Janet Clark', 'LPA Aerospace', 'HITEC', 'Black Mountain Software', 'Reach for the Future', 'Montana Tech', 'Lonnie Collinsworth', 'Glacier Art Museum', 'Sandpiper', 'Whitefish Lake Institute', 'GBES', 'AHLEF', 'MSU Teacher']) {
  assert(gold.awards.some((row) => row.name.includes(name)), name);
}

const lines = [
  '# Career retag accuracy',
  '',
  'Gold awards are every scholarship with a focus, a previous field tag, or a new field tag, plus the named cases. Expected tags were reviewed against the award wording.',
  '',
  `Gold awards: ${gold.awards.length}.`,
  `Awards whose tags changed: ${diffs.length}.`,
  `False positives: ${falsePositives.length}.`,
  `False negatives: ${falseNegatives.length}.`,
  `Correct tags lost: ${lost.length}.`,
  '',
  '## Precision and recall',
  '',
  '| Cluster | True positive | False positive | False negative | Precision | Recall |',
  '| --- | --- | --- | --- | --- | --- |',
  ...metrics.map((row) => `| ${row.cluster} | ${row.tp} | ${row.fp} | ${row.fn} | ${row.precision === null ? 'n/a' : row.precision.toFixed(2)} | ${row.recall === null ? 'n/a' : row.recall.toFixed(2)} |`),
  '',
  '## Tag changes',
  '',
  ...diffs.sort(),
  '',
  '## False positives',
  '',
  falsePositives.length ? falsePositives.map((item) => `- ${item}`).join('\n') : 'None.',
  '',
  '## False negatives',
  '',
  falseNegatives.length ? falseNegatives.map((item) => `- ${item}`).join('\n') : 'None.',
  '',
];
const report = `${lines.join('\n')}\n`;
const reportPath = 'fixtures/career/retag-report.md';
if (process.env.CAREER_REPORT_WRITE === '1') fs.writeFileSync(reportPath, report);
assert.equal(fs.readFileSync(reportPath, 'utf8'), report);
console.log('career retag accuracy passed', JSON.stringify({ gold: gold.awards.length, changed: diffs.length, mismatches: mismatches.length }));
