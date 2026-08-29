import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
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
    cacheState?: string;
    cachedAt?: string;
  };
}

const root = path.resolve(process.cwd(), '..');
const rawDir = path.join(root, '.firecrawl');
const fixtureDir = path.join(process.cwd(), 'fixtures', 'p6');
const capturedAt = new Date().toISOString();

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function readScrape(file: string): FirecrawlResult & { receipt: Record<string, unknown> } {
  const raw = readFileSync(path.join(rawDir, file), 'utf8');
  const parsed = JSON.parse(raw) as FirecrawlResult;
  if (parsed.metadata.statusCode !== 200) throw new Error(`${file} status ${parsed.metadata.statusCode}`);
  if (!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(parsed.metadata.scrapeId)) {
    throw new Error(`${file} lacks a provider-issued scrape ID`);
  }
  return {
    ...parsed,
    receipt: {
      scrapeId: parsed.metadata.scrapeId,
      sourceUrl: parsed.metadata.sourceURL,
      finalUrl: parsed.metadata.url,
      statusCode: parsed.metadata.statusCode,
      title: parsed.metadata.title.trim(),
      cacheState: parsed.metadata.cacheState ?? null,
      cachedAt: parsed.metadata.cachedAt ?? null,
      rawJsonSha256: sha256(raw),
      markdownSha256: sha256(parsed.markdown),
    },
  };
}

function sliceRequired(value: string, start: string, end: string): string {
  const startIndex = value.indexOf(start);
  const endIndex = value.indexOf(end, startIndex + start.length);
  if (startIndex < 0 || endIndex < 0) throw new Error(`Missing bounded section ${start} -> ${end}`);
  return value.slice(startIndex, endIndex).trim();
}

function paragraphAfter(section: string, heading: string): string {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = section.match(new RegExp(`^\\*\\*${escaped}\\*\\*\\s*\\n\\s*\\n([^\\n]+)`, 'm'));
  if (!match) throw new Error(`Missing fact paragraph for ${heading}`);
  return match[1].replace(/\s+/g, ' ').trim();
}

const reach = readScrape('p6-reach-higher.json');
const reachSection = sliceRequired(
  reach.markdown,
  "## It's Scholarship Time!",
  '[**Frequently Asked Questions**]',
);
const reachAwardNames = [...reachSection.matchAll(/^\*\*([^*\n]+)\*\*\s*\n\s*\n([^\n]+)/gm)]
  .map((match) => ({ name: match[1].trim(), fact: match[2].replace(/\s+/g, ' ').trim() }))
  .filter((item) => item.name !== 'One Application, Mutiple Scholarships.');
if (reachAwardNames.length !== 30) {
  throw new Error(`Reach Higher safe child denominator drift: ${reachAwardNames.length} != 30`);
}
const reachApplicationRouteUrls = reach.links.filter((url) =>
  /^https:\/\/www\.grantinterface\.com\/Home\/Logon\?urlkey=SAF$/.test(url));
if (reachApplicationRouteUrls.length !== 1) {
  throw new Error(`Reach Higher application route drift: ${JSON.stringify(reachApplicationRouteUrls)}`);
}
const reachCycleText = reachSection.match(/^Opens Jan\. 1, closes Mar\. 1$/m)?.[0];
const reachArchitectureText = reachSection.match(/^\*\*One Application, Mutiple Scholarships\.\*\*$/m)?.[0]
  ?? reachSection.match(/^\*\*One Application, Multiple Scholarships\.\*\*$/m)?.[0];
const reachSupplementalText = reach.markdown.match(/Individual scholarships will have supplemental questions that you will need to complete before you can submit each application\.[^\n]+/)?.[0];
if (!reachCycleText || !reachArchitectureText || !reachSupplementalText) {
  throw new Error('Reach Higher application/cycle source evidence drift');
}

const nfu = readScrape('p6-nfu.json');
const nfuNames = [
  'Stanley Moore Scholarships',
  'Hubert K. and JoAnn Seymour Scholarship',
  'Minorities in Agriculture, Natural Resources, and Related Sciences (MANRRS) Scholarship',
];
const nfuChildren = nfuNames.map((name, index) => {
  const start = nfu.markdown.indexOf(name);
  const end = index + 1 < nfuNames.length
    ? nfu.markdown.indexOf(nfuNames[index + 1], start + name.length)
    : nfu.markdown.indexOf('[![National Farmers Union logo for footer]', start + name.length);
  if (start < 0 || end < 0) throw new Error(`Missing NFU section for ${name}`);
  const section = nfu.markdown.slice(start, end);
  const eligibility = section.match(/##### Eligibility\s*\n\s*\n([^\n]+)/)?.[1]?.replace(/\s+/g, ' ').trim();
  const amount = section.match(/##### Amount\s*\n\s*\n([^\n]+)/)?.[1]?.replace(/\s+/g, ' ').trim();
  const deadline = section.match(/##### Application Deadline\s*\n\s*\n([^\n]+)/)?.[1]?.replace(/\s+/g, ' ').trim();
  if (!eligibility || !amount || !deadline) throw new Error(`Incomplete NFU facts for ${name}`);
  return { name, eligibility, amount, deadline };
});
const nfuUnifiedApplicationText = nfu.markdown.match(/No matter which scholarship you apply for, you’ll only need to complete \*\*one unified application form\*\*\./)?.[0];
const nfuApplicationChannelText = nfu.markdown.match(/Completed application form\. Applications may be completed electronically through Google forms or by printing out and mailing the PDF form\. Please do not submit both an electronic and paper copy\./)?.[0];
if (!nfuUnifiedApplicationText || !nfuApplicationChannelText) {
  throw new Error('NFU shared-application source evidence drift');
}
const nfuLinkedApplicationRoutes = nfu.links.filter((url) =>
  /docs\.google\.com\/forms|Fillable-Scholarship-Application\.pdf/i.test(url));

const fvccFiles = ['p6-fvcc.json', 'p6-fvcc-page2.json', 'p6-fvcc-page3.json', 'p6-fvcc-page4.json'];
const fvccPages = fvccFiles.map((file, index) => {
  const scrape = readScrape(file);
  const opportunities = scrape.markdown.split('\n').flatMap((line) => {
    const match = line.match(/^\|\s*(.*?)\s*\|\s*\[([^\]]+)\]\((https:\/\/fvcc\.academicworks\.com\/opportunities\/(\d+))\).*?\|\s*(Ended|Open|None)\s*\|$/);
    return match ? [{ amount: match[1].trim(), name: match[2].trim(), url: match[3], opportunityId: match[4], status: match[5] }] : [];
  });
  const expected = index < 3 ? 50 : 19;
  if (opportunities.length !== expected) throw new Error(`${file} opportunities ${opportunities.length} != ${expected}`);
  return { page: index + 1, receipt: scrape.receipt, opportunities };
});
const fvccOpportunities = fvccPages.flatMap((page) => page.opportunities);
const fvccTerminal = readScrape('p6-fvcc-page5-terminal.json');
const fvccTerminalIds = fvccTerminal.links.filter((url) => /\/opportunities\/\d+$/.test(url));
if (fvccTerminalIds.length !== 0 || !fvccTerminal.markdown.includes('|  |')) {
  throw new Error('FVCC page 5 is not the expected first empty terminal page');
}
if (new Set(fvccOpportunities.map((item) => item.opportunityId)).size !== 169) {
  throw new Error('FVCC current four-page opportunity IDs are not 169 unique values');
}
if (fvccOpportunities.some((item) => item.status !== 'Ended')) throw new Error('FVCC current public catalog includes a non-ended opportunity');

const horatioParent = readScrape('p6-horatio.json');
const horatioUndergrad = readScrape('p6-horatio-undergrad.json');
const horatioCte = readScrape('p6-horatio-cte.json');
const undergradNames = [...horatioUndergrad.markdown.matchAll(/^### (.+Scholarship(?: – .+)?)$/gm)]
  .map((match) => match[1].trim());
const cteSection = sliceRequired(horatioCte.markdown, '## SCHOLARSHIPS', '> I immigrated');
const cteNames = [...cteSection.matchAll(/^\*\*([^*]+Scholarship)\*\*$/gm)].map((match) => match[1].trim());
const expectedUndergradNames = [
  'National Scholarship',
  'Belle Plaine Community Schools Scholarship',
  'Bergeron Everglades Environmental Steward Scholarship',
  'Dennis & Phyllis Washington Foundation Undergraduate Scholarship',
  'Denny Sanford Arizona State University Scholarship',
  'Denny Sanford Augustana University Scholarship',
  'Denny Sanford Black Hills State University Scholarship',
  'Denny Sanford Dakota State University Scholarship',
  'Denny Sanford Long Island University Scholarship',
  'Denny Sanford National University Scholarship – San Diego, California',
];
const expectedCteNames = [
  'National Career & Technical Scholarship',
  'John Hardin Hudiburg Career & Technical Scholarship',
  'John Rollins Career & Technical Scholarship',
  'Valencia College Career & Technical Scholarship',
  'Warren Webster Technical Scholarship',
];
if (JSON.stringify(undergradNames) !== JSON.stringify(expectedUndergradNames)
    || JSON.stringify(cteNames) !== JSON.stringify(expectedCteNames)) {
  throw new Error(`Horatio exact visible children drift undergrad=${JSON.stringify(undergradNames)} cte=${JSON.stringify(cteNames)}`);
}

const first = readScrape('p6-first.json');

const fixture = {
  schemaVersion: 1,
  stageId: 'P6',
  capturedAt,
  accessBoundary: 'Public information pages only; no form, application, login, account, search, questionnaire, or submission interaction.',
  reachHigherMontana: {
    receipt: reach.receipt,
    safeSectionSha256: sha256(reachSection),
    applicationEvidence: {
      cycleText: reachCycleText,
      architectureText: reachArchitectureText,
      supplementalText: reachSupplementalText,
      contentSha256: sha256(JSON.stringify([reachCycleText, reachArchitectureText, reachSupplementalText, reachApplicationRouteUrls[0]])),
    },
    applicationRouteUrl: reachApplicationRouteUrls[0],
    applicationRouteVisited: false,
    discoveredChildren: reachAwardNames,
  },
  fvccAcademicWorks: {
    pageCount: 4,
    historicalObservedCount: 179,
    currentOpportunityCount: 169,
    historicalDifference: -10,
    endedCount: 169,
    pages: fvccPages,
    terminalProbe: { page: 5, opportunityCount: 0, receipt: fvccTerminal.receipt },
    driftLimitation: 'The accepted plan records a historical 179-item observation, but it does not retain those 179 identities. The current public catalog exposes 169 unique opportunities on pages 1-4 and zero on the first empty page 5. This proves the current measured traversal, not which ten historical items changed or why.',
  },
  nationalFarmersUnion: {
    receipt: nfu.receipt,
    applicationEvidence: {
      unifiedApplicationText: nfuUnifiedApplicationText,
      channelText: nfuApplicationChannelText,
      linkedRouteUrls: nfuLinkedApplicationRoutes,
      contentSha256: sha256(JSON.stringify([nfuUnifiedApplicationText, nfuApplicationChannelText, nfuLinkedApplicationRoutes])),
    },
    applicationRoutes: [
      { type: 'public_information_page', url: nfu.metadata.url, visited: true },
    ],
    discoveredChildren: nfuChildren,
  },
  horatioAlger: {
    receipts: [horatioParent.receipt, horatioUndergrad.receipt, horatioCte.receipt],
    parentProgramFamilies: [
      { name: 'Undergraduate Scholarships', period: 'Junior: December 1-March 1; Senior: December 1-February 15' },
      { name: 'Career & Technical Scholarships', period: 'March 15-June 15' },
      { name: 'Graduate Scholarships', period: 'July 1-August 31' },
    ],
    statedProgramDenominator: 'over 70 scholarship programs',
    staticallyVisibleUndergraduateChildren: undergradNames,
    staticallyVisibleCteChildren: cteNames,
    cteCycleObservation: 'The public page says the CTE application is closed and asks visitors to return for 2027 information.',
    applicationRouteVisited: false,
  },
  firstScholarships: {
    receipt: first.receipt,
    parentObservation: 'FIRST directs students to Pearson Futures, says new scholarships are added throughout the year, and says each provider controls its own amount, eligibility, process, and deadline.',
    providerDenominatorObservation: 'The partnership includes more than 150 postsecondary institutions and businesses; this is not an exact scholarship denominator.',
    portalUrls: [
      'https://futures.pearson.com/scholarships',
      'https://www.pearson.com/futures/scholarships?partnerName=FIRST+Partner',
    ],
    portalVisited: false,
  },
};

mkdirSync(fixtureDir, { recursive: true });
writeFileSync(path.join(fixtureDir, 'live-source-snapshots.json'), `${JSON.stringify(fixture, null, 2)}\n`);
console.log(`P6 LIVE CAPTURE PASS reach=30 fvccCurrent=169 fvccHistorical=179 fvccTerminal=0 nfu=3 horatioVisible=15 firstExact=unknown capturedAt=${capturedAt}`);
