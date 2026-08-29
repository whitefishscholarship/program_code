import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

interface FirecrawlResult {
  markdown: string;
  links: string[];
  metadata: {
    sourceURL: string;
    url: string;
    statusCode: number;
    title: string;
    scrapeId: string;
    cacheState?: string;
    cachedAt?: string;
  };
}

const root = path.resolve(process.cwd(), '..');
const fixturePath = path.join(process.cwd(), 'fixtures', 'p6', 'live-source-snapshots.json');
const reachRawArg = process.argv.find((arg) => arg.startsWith('--reach-raw='));
const nfuRawArg = process.argv.find((arg) => arg.startsWith('--nfu-raw='));
const reachRawPath = reachRawArg
  ? path.resolve(process.cwd(), reachRawArg.slice('--reach-raw='.length))
  : path.join(root, '.firecrawl', 'p6-reach-higher-remediation-v2.json');
const nfuRawPath = nfuRawArg
  ? path.resolve(process.cwd(), nfuRawArg.slice('--nfu-raw='.length))
  : path.join(root, '.firecrawl', 'p6-nfu-remediation-v2.json');

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function readRaw(rawPath: string, expectedHost: string): FirecrawlResult & {
  rawJsonSha256: string;
  markdownSha256: string;
  observedAt: string;
} {
  const raw = readFileSync(rawPath, 'utf8');
  const parsed = JSON.parse(raw) as FirecrawlResult;
  if (parsed.metadata.statusCode !== 200) throw new Error(`${rawPath} status ${parsed.metadata.statusCode}`);
  if (!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(parsed.metadata.scrapeId)) {
    throw new Error(`${rawPath} lacks a provider-issued scrape ID`);
  }
  const sourceHost = new URL(parsed.metadata.sourceURL).hostname.replace(/^www\./, '');
  const finalHost = new URL(parsed.metadata.url).hostname.replace(/^www\./, '');
  if (sourceHost !== expectedHost || finalHost !== expectedHost) {
    throw new Error(`${rawPath} escaped expected provider host ${expectedHost}`);
  }
  return {
    ...parsed,
    rawJsonSha256: sha256(raw),
    markdownSha256: sha256(parsed.markdown),
    observedAt: new Date().toISOString(),
  };
}

function receipt(source: FirecrawlResult & {
  rawJsonSha256: string;
  markdownSha256: string;
  observedAt: string;
}) {
  return {
    observedAt: source.observedAt,
    scrapeId: source.metadata.scrapeId,
    sourceUrl: source.metadata.sourceURL,
    finalUrl: source.metadata.url,
    statusCode: source.metadata.statusCode,
    title: source.metadata.title.trim(),
    cacheState: source.metadata.cacheState ?? null,
    cachedAt: source.metadata.cachedAt ?? null,
    rawJsonSha256: source.rawJsonSha256,
    markdownSha256: source.markdownSha256,
  };
}

const fixture = JSON.parse(readFileSync(fixturePath, 'utf8')) as any;
const reach = readRaw(reachRawPath, 'reachhighermontana.org');
const nfu = readRaw(nfuRawPath, 'nfu.org');

const reachRouteUrls = reach.links.filter((url) =>
  /^https:\/\/www\.grantinterface\.com\/Home\/Logon\?urlkey=SAF$/.test(url));
const reachCycleText = reach.markdown.match(/^Opens Jan\. 1, closes Mar\. 1$/m)?.[0];
const reachArchitectureText = reach.markdown.match(/^\*\*One Application, Mutiple Scholarships\.\*\*$/m)?.[0]
  ?? reach.markdown.match(/^\*\*One Application, Multiple Scholarships\.\*\*$/m)?.[0];
const reachSupplementalText = reach.markdown.match(/Individual scholarships will have supplemental questions that you will need to complete before you can submit each application\.[^\n]+/)?.[0];
if (reachRouteUrls.length !== 1 || !reachCycleText || !reachArchitectureText || !reachSupplementalText) {
  throw new Error('Reach Higher bounded application evidence did not reproduce');
}

const nfuUnifiedApplicationText = nfu.markdown.match(/No matter which scholarship you apply for, you’ll only need to complete \*\*one unified application form\*\*\./)?.[0];
const nfuApplicationChannelText = nfu.markdown.match(/Completed application form\. Applications may be completed electronically through Google forms or by printing out and mailing the PDF form\. Please do not submit both an electronic and paper copy\./)?.[0];
const nfuLinkedRouteUrls = nfu.links.filter((url) =>
  /docs\.google\.com\/forms|Fillable-Scholarship-Application\.pdf/i.test(url));
if (!nfuUnifiedApplicationText || !nfuApplicationChannelText || nfuLinkedRouteUrls.length !== 0) {
  throw new Error(`NFU bounded application evidence drift routes=${JSON.stringify(nfuLinkedRouteUrls)}`);
}

fixture.reachHigherMontana.applicationEvidenceReceipt = receipt(reach);
fixture.reachHigherMontana.applicationEvidenceCapturedAt = reach.observedAt;
fixture.reachHigherMontana.applicationEvidence = {
  cycleText: reachCycleText,
  architectureText: reachArchitectureText,
  supplementalText: reachSupplementalText,
  contentSha256: sha256(JSON.stringify([reachCycleText, reachArchitectureText, reachSupplementalText, reachRouteUrls[0]])),
};
fixture.reachHigherMontana.applicationRouteUrl = reachRouteUrls[0];

fixture.nationalFarmersUnion.applicationEvidenceReceipt = receipt(nfu);
fixture.nationalFarmersUnion.applicationEvidenceCapturedAt = nfu.observedAt;
fixture.nationalFarmersUnion.applicationEvidence = {
  unifiedApplicationText: nfuUnifiedApplicationText,
  channelText: nfuApplicationChannelText,
  linkedRouteUrls: nfuLinkedRouteUrls,
  contentSha256: sha256(JSON.stringify([nfuUnifiedApplicationText, nfuApplicationChannelText, nfuLinkedRouteUrls])),
};
fixture.nationalFarmersUnion.applicationRoutes = [
  { type: 'public_information_page', url: nfu.metadata.url, visited: true },
];
fixture.nationalFarmersUnion.applicationRouteStatus = 'described_without_current_link';

writeFileSync(fixturePath, `${JSON.stringify(fixture, null, 2)}\n`);
console.log(`P6 APPLICATION EVIDENCE BIND PASS reachRoute=1 nfuLinkedRoutes=0 reachObservedAt=${reach.observedAt} nfuObservedAt=${nfu.observedAt}`);
