import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { AWARD_TAG_KEYS, AwardTagsSchema } from '../src/lib/awardTagSchema';
import { deriveAwardTags, pickAwardTags, step3Categories, type TaggableAward } from '../src/lib/awardTags';
import { StudentCatalogSchema } from '../src/lib/studentCatalog';

const catalogPath = 'fixtures/r3/catalog-v1.json';
const bundle = JSON.parse(fs.readFileSync(catalogPath, 'utf8')) as {
  catalog: { awards: Array<TaggableAward & Record<string, unknown>> };
  connections: Array<{ answerId: string; awardId: string }>;
};
const relevance = JSON.parse(fs.readFileSync('fixtures/relevance/interview-relevance-v1.json', 'utf8')) as {
  connections: Array<{ answerId: string; awardId: string }>;
};
const coverage = JSON.parse(fs.readFileSync('fixtures/coverage/interview-coverage-v1.json', 'utf8')) as {
  connections: Array<{ answerId: string; awardId: string }>;
};
const pin = JSON.parse(fs.readFileSync('fixtures/r3/pin.json', 'utf8')) as { sha256: string };
const report = fs.readFileSync('fixtures/r3/p1-tagging-report.md', 'utf8');
const bands: Record<number, [number, number]> = {
  1: [8, 16], 2: [22, 30], 3: [36, 44], 4: [50, 58], 5: [64, 76], 6: [86, 94],
};

assert.equal(bundle.catalog.awards.length, 390);
assert.equal(bundle.connections.length, 248);
assert.equal(relevance.connections.length, 206);
assert.equal(coverage.connections.length, 4);
assert.equal(pin.sha256, crypto.createHash('sha256').update(fs.readFileSync(catalogPath)).digest('hex'));
StudentCatalogSchema.parse(bundle.catalog);

const linkIds = new Map<string, string[]>();
for (const connection of [...bundle.connections, ...relevance.connections, ...coverage.connections]) {
  const current = linkIds.get(connection.awardId) ?? [];
  current.push(connection.answerId);
  linkIds.set(connection.awardId, current);
}

const scopeCounts = new Map<string, number>();
for (const award of bundle.catalog.awards) {
  for (const key of ['residencyScope', 'poolLevel', 'poolReason'] as const) {
    assert.equal(Object.hasOwn(award, key), true, `${award.publicId} missing ${key}`);
  }
  const tags = AwardTagsSchema.parse(pickAwardTags(award));
  assert.equal(tags.tagConfirmedBy, 'derived');
  assert.equal(/[—–]/.test(tags.poolReason), false, award.name);
  assert.equal(/eligibility/i.test(tags.poolReason), false, award.name);
  if (tags.residencyScope) {
    assert.ok(tags.poolLevel);
    assert.equal(typeof tags.competitionScore, 'number');
    const [low, high] = bands[tags.poolLevel];
    assert.ok(tags.competitionScore !== null && tags.competitionScore >= low && tags.competitionScore <= high, award.name);
  } else {
    assert.equal(tags.poolLevel, null, award.name);
    assert.equal(tags.competitionScore, null, award.name);
  }
  const derived = deriveAwardTags(award, linkIds.get(award.publicId) ?? []);
  for (const key of AWARD_TAG_KEYS) {
    assert.deepEqual(award[key], derived.tags[key], `${award.name} ${key}`);
  }
  const scope = tags.residencyScope ?? 'null';
  scopeCounts.set(scope, (scopeCounts.get(scope) ?? 0) + 1);
}

const one = (name: string) => {
  const found = bundle.catalog.awards.filter((award) => award.name.includes(name));
  assert.equal(found.length, 1, name);
  return found[0];
};

const kiita = one('KIITA Foundation');
assert.equal(kiita.residencyScope, 'flathead');
assert.equal(kiita.poolLevel, 2);
assert.equal(kiita.needBased, true);
assert.equal(kiita.renewable, true);

const police = one('Whitefish Police Protective');
assert.equal(police.residencyScope, 'whitefish');
assert.equal(police.poolLevel, 1);

const bold = one('Be Bold');
assert.equal(bold.residencyScope, 'national');
assert.equal(bold.poolLevel, 6);
assert.equal(bold.essayRequired, false);
assert.equal(bold.plans, null);

const secondChance = one('2nd Chance');
assert.equal(secondChance.residencyScope, 'national');
assert.equal(secondChance.poolLevel, 6);
assert.equal(secondChance.plans, null);

const dream = one('Live Your Dream');
assert.equal(dream.residencyScope, 'national');
assert.equal(dream.poolLevel, 5);
assert.deepEqual(dream.gender, ['woman']);
assert.equal(dream.needBased, true);
assert.equal(dream.plans, null);

const neuro = bundle.catalog.awards.filter((award) => award.name === 'The Neurodiversity Scholarship' && award.health);
assert.equal(neuro.length, 1);
assert.equal(neuro[0].residencyScope, 'national');
assert.equal(neuro[0].poolLevel, 5);
assert.equal(neuro[0].plans, null);
assert.equal(neuro[0].needBased, null);
assert.equal(neuro[0].renewable, true);

const legacy = one('Elks National Foundation Legacy');
assert.deepEqual(legacy.familyTies, ['fraternal']);
assert.equal(legacy.residencyScope, null);
assert.equal(deriveAwardTags(legacy).step3Ids.includes('elks_lodge'), true);

const elkVoc = one("Elk's State Level Vocational");
assert.equal(elkVoc.residencyScope, 'montana');
assert.deepEqual(elkVoc.plans, ['skilled trades', 'two-year college']);
assert.equal(elkVoc.familyTies, null);

const beta = one('Beta Sigma Phi');
assert.equal(beta.residencyScope, null);
assert.equal(beta.poolLevel, null);

const treasure = one('Treasure State First Generation');
assert.equal(treasure.residencyScope, 'montana');
assert.equal(treasure.firstGen, null);
assert.equal(treasure.renewable, true);

const clearwater = one('Clearwater Credit Union');
assert.deepEqual(clearwater.familyTies, ['credit union']);

const golf = one('Montana State Golf');
assert.deepEqual(golf.sports, ['golf']);
assert.equal(golf.residencyScope, null);

const nesa = one('NESA Scholarships');
assert.deepEqual(nesa.clubs, ['Eagle Scout']);
assert.equal(nesa.plans, null);

const past = bundle.catalog.awards.find((award) => String(award.poolReason).startsWith('The page only shows an old example'));
assert.ok(past);
assert.equal(past.residencyScope, null);
assert.equal(past.poolLevel, null);

assert.match(report, /Awards tagged: 390/);
assert.match(report, /255 awards still have a gap/);
const scopeBlock = report.split('### residencyScope')[1]?.split('### poolLevel')[0] ?? '';
for (const [scope, count] of scopeCounts) assert.match(scopeBlock, new RegExp(`- ${scope}: ${count}`));

const zeroIds = ['mental_health', 'chronic_health', 'black_african_american', 'hispanic_latino', 'asian_pacific_islander', 'single_parent', 'mensa', 'farmers_union', 'leadership', 'caregiving'];
const zeroBlock = report.split('## Step 3 categories with 0 awards')[1]?.split('## Step 3 categories with awards')[0] ?? '';
const liveZero = step3Categories().filter((category) => {
  const used = bundle.catalog.awards.some((award) => deriveAwardTags(award, linkIds.get(award.publicId) ?? []).step3Ids.includes(category.id));
  return !used;
}).map((category) => category.id);
assert.deepEqual(liveZero, zeroIds);
for (const id of zeroIds) assert.match(zeroBlock, new RegExp(`\\(${id}\\)`));

console.log('P1 AWARD TAGS PASS', JSON.stringify({
  awards: bundle.catalog.awards.length,
  withPlace: 390 - (scopeCounts.get('null') ?? 0),
  uncertain: 255,
  scopes: Object.fromEntries(scopeCounts),
}));
