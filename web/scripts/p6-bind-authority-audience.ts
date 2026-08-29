import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

interface FirecrawlResult {
  markdown: string;
  links: string[];
  metadata: {
    scrapeId: string;
    sourceURL: string;
    url: string;
    statusCode: number;
    title: string;
    description?: string;
    'og:site_name'?: string;
    ogSiteName?: string;
    cacheState?: string;
    cachedAt?: string;
  };
}

const root = path.resolve(process.cwd(), '..');
const fixturePath = path.join(process.cwd(), 'fixtures', 'p6', 'live-source-snapshots.json');
const rawArg = process.argv.find((arg) => arg.startsWith('--raw='));
const rawPath = rawArg
  ? path.resolve(process.cwd(), rawArg.slice('--raw='.length))
  : path.join(root, '.firecrawl', 'p6-rev3-reach-authority.json');

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

const raw = readFileSync(rawPath, 'utf8');
const parsed = JSON.parse(raw) as FirecrawlResult;
const metadata = parsed.metadata;
if (metadata.statusCode !== 200) throw new Error(`Reach authority refresh status ${metadata.statusCode}`);
if (!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(metadata.scrapeId)) {
  throw new Error('Reach authority refresh lacks a provider-issued scrape ID');
}
const sourceUrl = new URL(metadata.sourceURL);
const finalUrl = new URL(metadata.url);
if (sourceUrl.hostname !== 'reachhighermontana.org' || finalUrl.hostname !== 'reachhighermontana.org') {
  throw new Error('Reach authority refresh escaped the official provider host');
}
const siteName = metadata['og:site_name'] ?? metadata.ogSiteName;
if (siteName !== 'Reach Higher Montana') throw new Error(`Unexpected Reach site identity ${siteName}`);
const description = metadata.description?.replace(/\s+/g, ' ').trim() ?? '';
if (!/Montana scholarships/i.test(description)) throw new Error('Reach metadata lacks Montana scholarship scope');
const audienceHeading = parsed.markdown.match(/^## Scholarships for Montana Students$/m)?.[0];
const childSectionHeading = parsed.markdown.match(/^## It's Scholarship Time!$/m)?.[0];
if (!audienceHeading || !childSectionHeading) {
  throw new Error('Reach refresh lacks the bounded audience or child-award section heading');
}

const fixture = JSON.parse(readFileSync(fixturePath, 'utf8')) as any;
const observedAt = new Date().toISOString();
const authorityEvidenceReceipt = {
  observedAt,
  scrapeId: metadata.scrapeId,
  sourceUrl: metadata.sourceURL,
  finalUrl: metadata.url,
  statusCode: metadata.statusCode,
  title: metadata.title.trim(),
  siteName,
  description,
  cacheState: metadata.cacheState ?? null,
  cachedAt: metadata.cachedAt ?? null,
  rawJsonSha256: sha256(raw),
  markdownSha256: sha256(parsed.markdown),
};
const audienceEvidence = {
  heading: audienceHeading,
  description,
  childSectionHeading,
  contentSha256: sha256(JSON.stringify([audienceHeading, description, childSectionHeading])),
};
fixture.reachHigherMontana.authorityEvidenceReceipt = authorityEvidenceReceipt;
fixture.reachHigherMontana.audienceEvidence = audienceEvidence;

writeFileSync(fixturePath, `${JSON.stringify(fixture, null, 2)}\n`);
console.log(`P6 AUTHORITY/AUDIENCE BIND PASS scrapeId=${metadata.scrapeId} observedAt=${observedAt}`);
