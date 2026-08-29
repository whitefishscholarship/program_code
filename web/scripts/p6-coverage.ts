import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import {
  adaptP1Inventory,
  CanonicalDatasetSchema,
  MODEL_SCHEMA_VERSION,
  P1InventoryInput,
  canonicalRelationshipErrors,
  evidenceId,
  sha256Text,
  stableId,
} from '../src/lib/canonicalModel';
import { VerificationSourceInputSchema } from '../src/lib/verification';

const root = path.resolve(process.cwd(), '..');
const fixturePath = path.join(process.cwd(), 'fixtures', 'p6', 'live-source-snapshots.json');
const queuePath = path.join(root, 'docs', 'evidence', 'P6-source-queue.json');
const baselinePath = path.join(process.cwd(), 'fixtures', 'p5', 'prewrite-master-database.json');
const p1InventoryPath = path.join(root, 'docs', 'evidence', 'P1-inventory.json');
const p1ManifestPath = path.join(root, 'docs', 'evidence', 'P1-manifest.json');
const checkOnly = process.argv.includes('--check');

const fixture = JSON.parse(readFileSync(fixturePath, 'utf8')) as any;
const queue = JSON.parse(readFileSync(queuePath, 'utf8')) as any;
const baseline = JSON.parse(readFileSync(baselinePath, 'utf8')) as any;
const p1Inventory = JSON.parse(readFileSync(p1InventoryPath, 'utf8')) as P1InventoryInput;
const retrievedAt = fixture.capturedAt as string;
const reachApplicationRetrievedAt = fixture.reachHigherMontana.applicationEvidenceCapturedAt as string;
const reachAuthorityReceipt = fixture.reachHigherMontana.authorityEvidenceReceipt as any;
const reachAudienceEvidence = fixture.reachHigherMontana.audienceEvidence as any;

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

const p1Canonical = adaptP1Inventory(p1Inventory, {
  p1InventorySha256: sha256(readFileSync(p1InventoryPath, 'utf8')),
  p1ManifestSha256: sha256(readFileSync(p1ManifestPath, 'utf8')),
  spreadsheetRevisionId: p1Inventory.generatedFrom.spreadsheetRevisionId,
  capturedAt: p1Inventory.generatedFrom.capturedAt,
});

function p1SourceIdentity(normalizedUrl: string): string {
  const source = p1Inventory.sources.find((item) => item.normalizedUrl === normalizedUrl);
  if (!source) throw new Error(`P1 source identity missing for ${normalizedUrl}`);
  return source.sourceIdentity;
}

const expectedReachApplicationEvidenceSha256 = sha256(JSON.stringify([
  fixture.reachHigherMontana.applicationEvidence.cycleText,
  fixture.reachHigherMontana.applicationEvidence.architectureText,
  fixture.reachHigherMontana.applicationEvidence.supplementalText,
  fixture.reachHigherMontana.applicationRouteUrl,
]));
if (fixture.reachHigherMontana.applicationEvidence.contentSha256 !== expectedReachApplicationEvidenceSha256) {
  throw new Error('Reach Higher application evidence digest does not bind its route and source-derived excerpts');
}
if (Number.isNaN(Date.parse(reachApplicationRetrievedAt))) {
  throw new Error('Reach Higher application evidence observation timestamp is invalid');
}
if (!reachAuthorityReceipt
    || Number.isNaN(Date.parse(reachAuthorityReceipt.observedAt))
    || !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(reachAuthorityReceipt.scrapeId)
    || reachAuthorityReceipt.statusCode !== 200
    || reachAuthorityReceipt.siteName !== 'Reach Higher Montana') {
  throw new Error('Reach Higher authority receipt is incomplete or invalid');
}
const expectedReachAudienceSha256 = sha256(JSON.stringify([
  reachAudienceEvidence.heading,
  reachAudienceEvidence.description,
  reachAudienceEvidence.childSectionHeading,
]));
if (reachAudienceEvidence.contentSha256 !== expectedReachAudienceSha256
    || reachAudienceEvidence.heading !== '## Scholarships for Montana Students'
    || reachAudienceEvidence.childSectionHeading !== "## It's Scholarship Time!"
    || !/Montana scholarships/i.test(reachAudienceEvidence.description)) {
  throw new Error('Reach Higher audience evidence is not bound to the sanitized official-page receipt');
}

function canonicalJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function writeOrCheck(relativePath: string, value: unknown): void {
  const absolutePath = path.join(root, relativePath);
  const expected = canonicalJson(value);
  if (checkOnly) {
    const actual = readFileSync(absolutePath, 'utf8');
    if (actual !== expected) throw new Error(`${relativePath} is not deterministic`);
  } else {
    writeFileSync(absolutePath, expected);
  }
}

function normalizeName(value: string): string {
  return value.toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function identityNameTokens(value: string): Set<string> {
  return new Set(normalizeName(value).split(' ')
    .filter((token) => token.length > 1 && token !== 'scholarship' && token !== 'award'));
}

function identityNameSimilarity(left: string, right: string): number {
  const leftTokens = identityNameTokens(left);
  const rightTokens = identityNameTokens(right);
  const union = new Set([...leftTokens, ...rightTokens]);
  if (union.size === 0) return 0;
  const intersection = [...leftTokens].filter((token) => rightTokens.has(token)).length;
  return intersection / union.size;
}

const reachExclusions: Record<string, string> = {
  'Kelly Kuntz Scholarship': 'Current postsecondary students only; not a graduating Whitefish high-school senior opportunity.',
  'Gilman Family Scholarship': 'Restricted to students who attended Sheridan or Twin Bridges High Schools.',
  'Rotary of Helena Scholarship': 'Restricted to named Helena-area high schools.',
  'The Angel Fund Scholarship': 'Restricted to named Helena-area high schools.',
  'Big Muddy Legacy Scholarship': 'Restricted to the Big Muddy FFA District; no Whitefish fit is established.',
  'Doris Robinson Memorial Scholarship': 'Restricted to Carbon or Stillwater County.',
  'MABA-MGEA Scholarship': 'An exact normalized-name match already exists as baseline Scholarship row 174; accepting another child would create a duplicate.',
  'Montana FFA Leave a Legacy Scholarship': 'Identity review resolves this as the same award as baseline Scholarship row 170, Montana FFA Foundation Leave a Legacy Scholarship: the official parent route, annual Jan. 1-Mar. 1 window, and $500 amount align. P6 excludes the discovered alias rather than inflating coverage.',
  'Holt Family, John Bishop Scholarship': 'Funds attendance at the FFA National Conference rather than postsecondary education.',
  'Irene Andres Memorial Award': 'Funds attendance at the FFA National Conference rather than postsecondary education.',
  'Montana FFA Alumni Leadership Camp Scholarship': 'Funds a leadership camp rather than postsecondary education.',
  'Sam Cornthwaite Memorial Scholarship for WLC': 'Funds the Washington Leadership Conference rather than postsecondary education.',
  'Sam Cornthwaite Memorial Scholarship for ALC': 'Funds the Alumni Leadership Camp rather than postsecondary education.',
  'Washington Leadership Conference Scholarship WLC': 'Funds the Washington Leadership Conference rather than postsecondary education.',
};

const reachSlotMinimums: Record<string, number | null> = {
  'Reach Higher Montana Scholarship': 50,
  'Carl Valvoda Scholarship': 1,
  'Bridging the Gap Scholarship': 1,
  'Kelly Kuntz Scholarship': 1,
  'Horse Creek Scholarship': 6,
  'Gilman Family Scholarship': 2,
  'Rotary of Helena Scholarship': 1,
  'The Angel Fund Scholarship': 1,
  "Kid's Chance of Montana": null,
  'Agri Industries': null,
  "Odd Fellows and Rebekah's Scholarship": 1,
  'FFA Ag Teachers Memorial Scholarship': 1,
  'AMTOPP Scholarship': 1,
  'Big Muddy Legacy Scholarship': 1,
  'Doris Robinson Memorial Scholarship': 2,
  'Dr. Max L Amberson Ag Education Scholarship': 2,
  'Dr. Van Shelhamer Memorial Scholarship': 1,
  'Holt Family, John Bishop Scholarship': 1,
  'Irene Andres Memorial Award': 1,
  'John Kozlowski Memorial Scholarship': 2,
  'MABA-MGEA Scholarship': 2,
  'Montana FFA Alumni Leadership Camp Scholarship': 5,
  'Montana FFA Leave a Legacy Scholarship': 1,
  "Murdoch's Scholarship": 1,
  'Sam Cornthwaite Memorial Scholarship for WLC': 1,
  'Sam Cornthwaite Memorial Scholarship for ALC': 1,
  'Servant Leadership Scholarship': 1,
  'Stockman Bank Next Gen Scholarship': 2,
  'Washington Leadership Conference Scholarship WLC': 7,
  'W. Ralph Peck Memorial Scholarship': 1,
};

const nfuExclusionReason = 'The official public page describes electronic and paper application channels but exposes no current linked application URL. P6 cannot evidence-bind the required application route and therefore does not accept the child.';

const evidence: any[] = [];
const reviewItems: any[] = [];
const sources: any[] = [];

function addEvidence(input: {
  subjectKind: 'source' | 'scholarship' | 'application_group' | 'cycle';
  subjectId: string;
  fieldPath: string;
  sourceId: string | null;
  result: 'observed' | 'supported' | 'conflicting' | 'inconclusive' | 'unverified';
  claim: string;
  contentSha256: string;
  reviewerState?: 'classified' | 'manual_review' | 'unknown';
  observedAt?: string;
  sourceRevision?: string | null;
}): string {
  const { observedAt, sourceRevision, ...evidenceInput } = input;
  const identity = { ...evidenceInput, retrievedAt: observedAt ?? retrievedAt, sourceRevision: sourceRevision ?? null };
  const id = evidenceId(identity);
  evidence.push({
    schemaVersion: MODEL_SCHEMA_VERSION,
    id,
    ...identity,
    reviewerState: input.reviewerState ?? 'classified',
  });
  return id;
}

function addSource(input: {
  key: string;
  url: string;
  architecture: string;
  accessBehavior: string;
  authority: string;
  acquisitionState: string;
  claim: string;
  contentSha256: string;
  legacySourceIdentity?: string;
  observedAt?: string;
  authorityObservedAt?: string;
  authoritySourceRevision: string;
  reviewSummary?: string;
}): string {
  const id = stableId('src', ['p6', input.key, input.url]);
  const acquisitionEvidenceId = addEvidence({
    subjectKind: 'source',
    subjectId: id,
    fieldPath: 'acquisitionState',
    sourceId: id,
    result: input.reviewSummary ? 'inconclusive' : 'supported',
    claim: input.claim,
    contentSha256: input.contentSha256,
    observedAt: input.observedAt,
    reviewerState: input.reviewSummary ? 'manual_review' : 'classified',
  });
  const authorityEvidenceId = addEvidence({
    subjectKind: 'source',
    subjectId: id,
    fieldPath: 'authority',
    sourceId: id,
    result: 'supported',
    claim: `authority=${input.authority}`,
    contentSha256: sha256Text(JSON.stringify({ sourceId: id, canonicalUrl: input.url, authority: input.authority })),
    observedAt: input.authorityObservedAt ?? input.observedAt,
    sourceRevision: input.authoritySourceRevision,
  });
  const reviewIds: string[] = [];
  if (input.reviewSummary) {
    const reviewId = stableId('rev', ['p6', input.key, 'source-block']);
    reviewItems.push({
      schemaVersion: MODEL_SCHEMA_VERSION,
      id: reviewId,
      subjectKind: 'source',
      subjectId: id,
      reason: 'access_blocked',
      state: 'open',
      summary: input.reviewSummary,
      evidenceIds: [acquisitionEvidenceId],
      owner: 'P6 review queue',
      targetStage: 'P6',
    });
    reviewIds.push(reviewId);
  }
  const parsed = new URL(input.url);
  sources.push({
    schemaVersion: MODEL_SCHEMA_VERSION,
    id,
    architecture: input.architecture,
    canonicalUrl: input.url,
    offlineAuthority: null,
    host: parsed.host,
    identityPolicy: {
      preservedQueryParameters: [...parsed.searchParams.keys()].sort(),
      fragmentPreserved: parsed.hash.length > 0,
      trackingParametersRemoved: false,
    },
    accessBehavior: input.accessBehavior,
    authority: input.authority,
    acquisitionState: input.acquisitionState,
    parentSourceIds: [],
    childSourceIds: [],
    evidenceIds: [acquisitionEvidenceId, authorityEvidenceId].sort(),
    reviewItemIds: reviewIds,
    legacySourceIdentity: input.legacySourceIdentity ?? null,
  });
  return id;
}

const reachParentId = addSource({
  key: 'reach-parent',
  url: fixture.reachHigherMontana.receipt.finalUrl,
  architecture: 'matching_portal',
  accessBehavior: 'public',
  authority: 'official_provider',
  acquisitionState: 'complete',
  claim: 'The bounded public It’s Scholarship Time section exposes 30 individual child awards after expanding the Montana FFA umbrella.',
  contentSha256: fixture.reachHigherMontana.safeSectionSha256,
  authorityObservedAt: reachAuthorityReceipt.observedAt,
  authoritySourceRevision: `firecrawl:${reachAuthorityReceipt.scrapeId}`,
  legacySourceIdentity: p1SourceIdentity('https://www.reachhighermontana.org/plan-your-future/scholarships#c475'),
});
const reachApplicationId = addSource({
  key: 'reach-application',
  url: fixture.reachHigherMontana.applicationRouteUrl,
  architecture: 'login_application_portal',
  accessBehavior: 'authenticated',
  authority: 'official_application',
  acquisitionState: 'blocked',
  claim: `The public provider page links ${fixture.reachHigherMontana.applicationRouteUrl} as the shared application route; P6 did not visit it.`,
  contentSha256: fixture.reachHigherMontana.applicationEvidence.contentSha256,
  observedAt: reachApplicationRetrievedAt,
  authorityObservedAt: reachAuthorityReceipt.observedAt,
  authoritySourceRevision: `linked-by-firecrawl:${reachAuthorityReceipt.scrapeId}`,
  legacySourceIdentity: p1SourceIdentity('https://www.grantinterface.com/Home/Logon?urlkey=SAF'),
});
const fvccParentId = addSource({
  key: 'fvcc-parent',
  url: 'https://fvcc.academicworks.com/',
  architecture: 'paginated_catalog',
  accessBehavior: 'public',
  authority: 'institutional',
  acquisitionState: 'complete',
  claim: 'Pages 1-4 expose 169 unique opportunities, all Ended; page 5 is the first empty page.',
  contentSha256: sha256Text(JSON.stringify(fixture.fvccAcademicWorks.pages.map((page: any) => page.receipt.markdownSha256))),
  authorityObservedAt: retrievedAt,
  authoritySourceRevision: `firecrawl:${fixture.fvccAcademicWorks.pages[0].receipt.scrapeId}`,
  legacySourceIdentity: p1SourceIdentity('https://fvcc.academicworks.com/'),
});
const nfuParentId = addSource({
  key: 'nfu-parent',
  url: fixture.nationalFarmersUnion.receipt.finalUrl,
  architecture: 'multi_award_page',
  accessBehavior: 'public',
  authority: 'official_provider',
  acquisitionState: 'complete',
  claim: fixture.nationalFarmersUnion.applicationEvidence.unifiedApplicationText,
  contentSha256: fixture.nationalFarmersUnion.applicationEvidence.contentSha256,
  authorityObservedAt: fixture.nationalFarmersUnion.applicationEvidenceCapturedAt,
  authoritySourceRevision: `firecrawl:${fixture.nationalFarmersUnion.applicationEvidenceReceipt.scrapeId}`,
  legacySourceIdentity: p1SourceIdentity('https://nfu.org/education/scholarships/'),
});
const horatioParentId = addSource({
  key: 'horatio-parent',
  url: 'https://horatioalger.org/scholarships/',
  architecture: 'directory_hub',
  accessBehavior: 'public',
  authority: 'official_provider',
  acquisitionState: 'partial',
  claim: 'The public pages statically exposed 15 named undergraduate/CTE programs while the provider states that it administers over 70 programs.',
  contentSha256: sha256Text(JSON.stringify(fixture.horatioAlger.receipts.map((receipt: any) => receipt.markdownSha256))),
  authorityObservedAt: retrievedAt,
  authoritySourceRevision: `firecrawl:${fixture.horatioAlger.receipts[0].scrapeId}`,
  legacySourceIdentity: p1SourceIdentity('https://horatioalger.org/scholarships/'),
  reviewSummary: 'Exact child denominator and remaining count are unavailable from the static public pages without entering filter/application interaction outside P6 authority. No Horatio child is accepted.',
});
const firstParentId = addSource({
  key: 'first-parent',
  url: fixture.firstScholarships.receipt.finalUrl,
  architecture: 'external_marketplace',
  accessBehavior: 'public',
  authority: 'official_provider',
  acquisitionState: 'partial',
  claim: fixture.firstScholarships.parentObservation,
  contentSha256: fixture.firstScholarships.receipt.markdownSha256,
  authorityObservedAt: retrievedAt,
  authoritySourceRevision: `firecrawl:${fixture.firstScholarships.receipt.scrapeId}`,
  legacySourceIdentity: p1SourceIdentity('https://www.firstinspires.org/resources/library/scholarships'),
  reviewSummary: 'FIRST provides no exact child scholarship denominator and delegates distinct facts to provider cards in the Pearson portal. Search/portal interaction is outside P6 authority, so no child is accepted.',
});

const reachGroupId = stableId('app', ['p6', 'reach-higher-shared-application', fixture.reachHigherMontana.applicationRouteUrl]);
const scholarships: any[] = [];
const cycles: any[] = [];
const acceptedSlots: Array<number | null> = [];
const verificationBindingsBySource = new Map<string, any[]>();

function addSourceRelationshipEvidence(
  sourceId: string,
  subjectId: string,
  relationship: 'parent_summary' | 'direct',
  direct: true,
): string {
  const source = sources.find((item) => item.id === sourceId);
  const authorityEvidence = evidence.find((item) => item.subjectKind === 'source'
    && item.subjectId === sourceId && item.fieldPath === 'authority');
  if (!source || !authorityEvidence) throw new Error(`Source ${sourceId} lacks canonical authority evidence`);
  const fieldPath = `sourceLinks.${sourceId}.${relationship}.direct`;
  const relationshipEvidenceId = addEvidence({
    subjectKind: 'scholarship',
    subjectId,
    fieldPath,
    sourceId,
    result: 'supported',
    claim: `sourceRelationship=${relationship}`,
    contentSha256: sha256Text(JSON.stringify({ sourceId, subjectId, relationship, direct })),
    observedAt: authorityEvidence.retrievedAt,
    sourceRevision: authorityEvidence.sourceRevision,
  });
  source.evidenceIds = [...new Set([...source.evidenceIds, relationshipEvidenceId])].sort();
  const relationshipEvidence = evidence.find((item) => item.id === relationshipEvidenceId);
  const bindings = verificationBindingsBySource.get(sourceId) ?? [];
  bindings.push({ subjectId, relationship, direct, evidence: relationshipEvidence });
  verificationBindingsBySource.set(sourceId, bindings);
  return relationshipEvidenceId;
}

function parseAmount(rawFact: string): any {
  if (/amounts? var(?:y|ies)|varies/i.test(rawFact)) {
    return { raw: rawFact, minimum: null, maximum: null, currency: 'USD', state: 'variable', evidenceIds: [] };
  }
  const values = [...rawFact.matchAll(/\$([0-9][0-9,]*(?:\.\d{2})?)/g)].map((match) => Number(match[1].replace(/,/g, '')));
  if (values.length === 0) return { raw: rawFact, minimum: null, maximum: null, currency: null, state: 'unknown', evidenceIds: [] };
  return { raw: rawFact, minimum: Math.min(...values), maximum: Math.max(...values), currency: 'USD', state: 'known', evidenceIds: [] };
}

function addScholarship(input: {
  sourceKey: 'reach' | 'nfu';
  name: string;
  fact: string;
  deadline: string;
  parentSourceId: string;
  applicationSourceId: string;
  applicationGroupId: string;
  slots: number | null;
}): void {
  const scholarshipId = stableId('sch', ['p6-child', input.sourceKey, input.name]);
  const cycleId = stableId('cyc', [scholarshipId, 'annual-unknown']);
  const factSha = sha256Text(input.fact);
  const parentRelationshipEvidence = addSourceRelationshipEvidence(
    input.parentSourceId, scholarshipId, 'parent_summary', true,
  );
  const applicationRelationshipEvidence = addSourceRelationshipEvidence(
    input.applicationSourceId, scholarshipId, 'direct', true,
  );
  const nameEvidence = addEvidence({
    subjectKind: 'scholarship', subjectId: scholarshipId, fieldPath: 'name', sourceId: input.parentSourceId,
    result: 'supported', claim: `The official public parent names ${input.name} as an individual award.`, contentSha256: factSha,
  });
  const eligibilityEvidence = addEvidence({
    subjectKind: 'scholarship', subjectId: scholarshipId, fieldPath: 'studentFields.eligibility', sourceId: input.parentSourceId,
    result: 'supported', claim: input.fact, contentSha256: factSha,
  });
  const audienceClaim = `${input.name} is listed in the official ${reachAudienceEvidence.childSectionHeading} section on a page headed ${reachAudienceEvidence.heading}; the page description identifies Montana scholarships.`;
  const audienceEvidenceId = addEvidence({
    subjectKind: 'scholarship', subjectId: scholarshipId,
    fieldPath: 'studentFields.eligibility.location', sourceId: input.parentSourceId,
    result: 'supported', claim: audienceClaim,
    contentSha256: sha256Text(JSON.stringify([
      reachAudienceEvidence.contentSha256, input.name, input.fact,
    ])),
    observedAt: reachAuthorityReceipt.observedAt,
    sourceRevision: `firecrawl:${reachAuthorityReceipt.scrapeId}`,
  });
  const cycleClaim = input.sourceKey === 'reach'
    ? `${fixture.reachHigherMontana.applicationEvidence.cycleText}; no year or current availability is stated, so cycle status remains unknown.`
    : `The official child section states ${input.deadline}; no year-qualified current cycle is established, so status remains unknown.`;
  const cycleEvidence = addEvidence({
    subjectKind: 'cycle', subjectId: cycleId, fieldPath: 'status', sourceId: input.parentSourceId,
    result: 'supported', claim: cycleClaim, contentSha256: input.sourceKey === 'reach' ? fixture.reachHigherMontana.applicationEvidence.contentSha256 : factSha,
    observedAt: input.sourceKey === 'reach' ? reachApplicationRetrievedAt : undefined,
  });
  const amount = parseAmount(input.fact);
  amount.evidenceIds = [eligibilityEvidence];
  const gpaMatch = input.fact.match(/\b([0-4](?:\.\d+)?)\s*GPA\b/i);
  const schoolTypes: string[] = [];
  if (/two[- ]year|associate/i.test(input.fact)) schoolTypes.push('two_year');
  if (/four[- ]year|bachelor|college|university/i.test(input.fact)) schoolTypes.push('four_year');
  if (/trade|technical|certificate/i.test(input.fact)) schoolTypes.push('trade');
  scholarships.push({
    schemaVersion: MODEL_SCHEMA_VERSION,
    id: scholarshipId,
    name: input.name,
    lifecycleState: 'modeled',
    legacyRowIdentities: [],
    sourceIds: [input.parentSourceId, input.applicationSourceId].sort(),
    sourceLinks: [
      { sourceId: input.parentSourceId, role: 'parent', provenance: [parentRelationshipEvidence] },
      { sourceId: input.applicationSourceId, role: 'application', provenance: [applicationRelationshipEvidence] },
    ].sort((a, b) => a.sourceId.localeCompare(b.sourceId)),
    applicationGroupIds: [input.applicationGroupId],
    cycleIds: [cycleId],
    evidenceIds: [
      nameEvidence,
      eligibilityEvidence,
      audienceEvidenceId,
      parentRelationshipEvidence,
      applicationRelationshipEvidence,
    ].sort(),
    reviewItemIds: [],
    studentFields: {
      summary: { raw: null, state: 'unknown', evidenceIds: [] },
      awardAmount: amount,
      eligibility: {
        location: {
          raw: `${reachAudienceEvidence.heading}; ${reachAudienceEvidence.description}`,
          state: 'known',
        },
        minimumGpa: gpaMatch ? { raw: gpaMatch[0], value: Number(gpaMatch[1]), state: 'known' } : { raw: null, value: null, state: 'unknown' },
        schoolTypes: schoolTypes.length > 0 ? { raw: input.fact, values: [...new Set(schoolTypes)].sort(), state: 'known' } : { raw: null, values: [], state: 'unknown' },
        focus: { raw: null, state: 'unknown' },
        gapYear: { raw: null, value: null, state: 'unknown' },
      },
      selection: { financialNeedPriority: { raw: null, value: null, state: 'unknown' } },
      renewal: { raw: null, value: null, state: 'unknown' },
    },
  });
  const closeValue = input.sourceKey === 'reach' ? '03-01' : null;
  cycles.push({
    schemaVersion: MODEL_SCHEMA_VERSION,
    id: cycleId,
    scholarshipId,
    cycleKey: 'annual-unknown',
    year: null,
    opensAt: input.sourceKey === 'reach'
      ? { value: '01-01', precision: 'annual_rule', timezone: null }
      : { value: null, precision: 'unknown', timezone: null },
    closesAt: { value: closeValue, precision: input.sourceKey === 'reach' ? 'annual_rule' : 'unknown', timezone: null },
    status: 'unknown',
    recurrence: 'annual',
    applicationGroupId: input.applicationGroupId,
    evidenceIds: [cycleEvidence],
    reviewItemIds: [],
  });
  acceptedSlots.push(input.slots);
}

const reachAccepted = fixture.reachHigherMontana.discoveredChildren.filter((child: any) => !reachExclusions[child.name]);
const reachExcluded = fixture.reachHigherMontana.discoveredChildren.filter((child: any) => reachExclusions[child.name]);
for (const child of reachAccepted) {
  addScholarship({
    sourceKey: 'reach', name: child.name, fact: child.fact, deadline: 'Annual — March 1',
    parentSourceId: reachParentId, applicationSourceId: reachApplicationId,
    applicationGroupId: reachGroupId, slots: reachSlotMinimums[child.name],
  });
}

function addApplicationGroup(id: string, mode: string, sourceIds: string[], scholarshipIds: string[], claim: string, contentSha256: string, supplementalRequirements: string, observedAt?: string): any {
  const evd = addEvidence({ subjectKind: 'application_group', subjectId: id, fieldPath: 'mode', sourceId: sourceIds[0], result: 'supported', claim, contentSha256, observedAt });
  return {
    schemaVersion: MODEL_SCHEMA_VERSION, id, mode, sourceIds: sourceIds.sort(), scholarshipIds: scholarshipIds.sort(),
    supplementalRequirements, evidenceIds: [evd], reviewItemIds: [],
  };
}

const reachScholarshipIds = scholarships.filter((item) => item.applicationGroupIds.includes(reachGroupId)).map((item) => item.id);
const applicationGroups = [
  addApplicationGroup(reachGroupId, 'shared_with_supplements', [reachParentId, reachApplicationId], reachScholarshipIds,
    fixture.reachHigherMontana.applicationEvidence.supplementalText,
    fixture.reachHigherMontana.applicationEvidence.contentSha256, 'mixed', reachApplicationRetrievedAt),
];

for (const source of sources) {
  const authorityEvidenceItems = evidence.filter((item) => item.subjectKind === 'source'
    && item.subjectId === source.id && item.fieldPath === 'authority');
  if (authorityEvidenceItems.length !== 1 || !source.evidenceIds.includes(authorityEvidenceItems[0].id)) {
    throw new Error(`Source ${source.id} does not have exactly one bound authority Evidence item`);
  }
}
for (const [key, sourceId] of [['reach-parent', reachParentId], ['reach-application', reachApplicationId]] as const) {
  const source = sources.find((item) => item.id === sourceId);
  const authorityEvidence = evidence.find((item) => item.subjectKind === 'source'
    && item.subjectId === sourceId && item.fieldPath === 'authority');
  VerificationSourceInputSchema.parse({
    key,
    source,
    authorityEvidence,
    subjectBindings: verificationBindingsBySource.get(sourceId),
  });
}

function bindLegacyPortalRow(sheetRow: number, targetIds: string[]): any {
  const binding = p1Canonical.legacyBindings.find((item) => item.sheetRow === sheetRow);
  if (!binding || binding.currentLabel !== 'Portal' || binding.targetKind !== 'source_record') {
    throw new Error(`P1 portal binding missing for selected row ${sheetRow}`);
  }
  const studentFieldCompatibility = Object.fromEntries(Object.entries(binding.studentFieldCompatibility)
    .map(([field, value]: [string, any]) => [field, { ...value, evidenceIds: [] }]));
  return {
    ...binding,
    targetIds: [...new Set(targetIds)].sort(),
    reviewItemIds: [],
    studentFieldCompatibility,
  };
}

const legacyBindings = [
  bindLegacyPortalRow(17, [horatioParentId]),
  bindLegacyPortalRow(31, [horatioParentId]),
  bindLegacyPortalRow(45, [fvccParentId]),
  bindLegacyPortalRow(55, [nfuParentId]),
  bindLegacyPortalRow(79, [reachParentId, reachApplicationId]),
  bindLegacyPortalRow(83, [nfuParentId]),
  bindLegacyPortalRow(187, [firstParentId]),
].sort((a, b) => a.id.localeCompare(b.id));

const dataset = {
  schemaVersion: MODEL_SCHEMA_VERSION,
  pinnedInput: {
    p1InventorySha256: '3f7dda3cd9d2946a42e8dec16e5a4d3b6240218eda8b4fee0cb42fc7b32aec6a',
    p1ManifestSha256: '0712c6ff782285ce4fdb933cebfa7797a7b5f10184a3974017896c0d3df76a60',
    spreadsheetRevisionId: '223',
    capturedAt: retrievedAt,
  },
  sources: sources.sort((a, b) => a.id.localeCompare(b.id)),
  scholarships: scholarships.sort((a, b) => a.id.localeCompare(b.id)),
  applicationGroups: applicationGroups.sort((a, b) => a.id.localeCompare(b.id)),
  cycles: cycles.sort((a, b) => a.id.localeCompare(b.id)),
  evidence: evidence.sort((a, b) => a.id.localeCompare(b.id)),
  reviewItems: reviewItems.sort((a, b) => a.id.localeCompare(b.id)),
  legacyBindings,
};
CanonicalDatasetSchema.parse(dataset);
const relationshipErrors = canonicalRelationshipErrors(dataset as any);
if (relationshipErrors.length > 0) throw new Error(`P6 canonical relationship errors: ${relationshipErrors.join('; ')}`);

const baselineNames = baseline.records.map((record: any) => ({
  sheetRow: record.sheetRow,
  rowKey: record.rowKey,
  recordType: record.values.recordType.unformatted,
  name: record.values.name.unformatted,
  normalizedName: normalizeName(record.values.name.unformatted),
}));
const allDiscovered = [
  ...fixture.reachHigherMontana.discoveredChildren.map((child: any) => ({ source: 'reach-higher', name: child.name })),
  ...fixture.nationalFarmersUnion.discoveredChildren.map((child: any) => ({ source: 'nfu', name: child.name })),
  ...fixture.fvccAcademicWorks.pages.flatMap((page: any) => page.opportunities.map((child: any) => ({ source: 'fvcc', name: child.name }))),
  ...fixture.horatioAlger.staticallyVisibleUndergraduateChildren.map((name: string) => ({ source: 'horatio-visible', name })),
  ...fixture.horatioAlger.staticallyVisibleCteChildren.map((name: string) => ({ source: 'horatio-visible', name })),
];
const exactNameCollisions = allDiscovered.flatMap((child: any) => baselineNames
  .filter((row: any) => row.normalizedName === normalizeName(child.name))
  .map((row: any) => ({ source: child.source, discoveredName: child.name, ...row })));
const acceptedNames = new Set(scholarships.map((item) => normalizeName(item.name)));
const acceptedScholarshipCollisions = exactNameCollisions.filter((item: any) => item.recordType === 'Scholarship' && acceptedNames.has(normalizeName(item.discoveredName)));
if (acceptedScholarshipCollisions.length !== 0) throw new Error(`Accepted child duplicates baseline scholarships: ${JSON.stringify(acceptedScholarshipCollisions)}`);
const nearNameCollisionCandidates = allDiscovered.flatMap((child: any) => baselineNames
  .filter((row: any) => row.recordType === 'Scholarship'
    && row.normalizedName !== normalizeName(child.name)
    && identityNameSimilarity(child.name, row.name) >= 0.8)
  .map((row: any) => ({
    source: child.source,
    discoveredName: child.name,
    baselineSheetRow: row.sheetRow,
    baselineName: row.name,
    baselineRecordType: row.recordType,
    tokenJaccard: identityNameSimilarity(child.name, row.name),
  })))
  .sort((a: any, b: any) => `${a.discoveredName}:${a.baselineSheetRow}`.localeCompare(`${b.discoveredName}:${b.baselineSheetRow}`));
const reviewedCollisionDispositions: Record<string, { disposition: string; basis: string[] }> = {
  'Montana FFA Leave a Legacy Scholarship:170': {
    disposition: 'same_award_excluded',
    basis: ['same official Reach Higher parent/application route', 'same annual Jan. 1-Mar. 1 window', 'same $500 amount', 'names differ only by the provider word Foundation'],
  },
  'Flathead Electric Coop. Early Childhood Education Scholarship:44': {
    disposition: 'same_award_excluded_currently_ended',
    basis: ['same distinctive provider and award name', 'baseline name adds only the @ FVCC location suffix', 'current FVCC catalog marks the discovered opportunity Ended'],
  },
};
const reviewedIdentityCollisions = nearNameCollisionCandidates.map((candidate: any) => {
  const disposition = reviewedCollisionDispositions[`${candidate.discoveredName}:${candidate.baselineSheetRow}`];
  if (!disposition) throw new Error(`Near-name collision lacks explicit disposition: ${JSON.stringify(candidate)}`);
  return { ...candidate, ...disposition };
});
if (reviewedIdentityCollisions.some((item) => acceptedNames.has(normalizeName(item.discoveredName)))) {
  throw new Error('A reviewed baseline identity collision remains accepted');
}

const exclusions = {
  schemaVersion: 1,
  stageId: 'P6',
  generatedFrom: { fixturePath: 'web/fixtures/p6/live-source-snapshots.json', fixtureSha256: sha256(readFileSync(fixturePath, 'utf8')) },
  reachHigherMontana: reachExcluded.map((child: any) => ({ name: child.name, reason: reachExclusions[child.name], evidence: child.fact })),
  nationalFarmersUnion: fixture.nationalFarmersUnion.discoveredChildren.map((child: any) => ({
    name: child.name,
    reason: nfuExclusionReason,
    evidence: {
      unifiedApplicationText: fixture.nationalFarmersUnion.applicationEvidence.unifiedApplicationText,
      channelText: fixture.nationalFarmersUnion.applicationEvidence.channelText,
      linkedRouteUrls: fixture.nationalFarmersUnion.applicationEvidence.linkedRouteUrls,
    },
  })),
  fvccAcademicWorks: fixture.fvccAcademicWorks.pages.flatMap((page: any) => page.opportunities.map((item: any) => ({
    name: item.name, url: item.url, amount: item.amount, currentCatalogStatus: item.status,
    reason: 'The current institutional catalog labels the opportunity Ended; P6 does not accept a closed catalog item as active coverage.',
  }))),
  sourceBlocks: [
    { queueId: 'p6-horatio-alger', reason: 'Provider states over 70 programs, but only 15 child names are statically visible and no exact denominator/remaining count is exposed without out-of-scope interaction.' },
    { queueId: 'p6-first-scholarships', reason: 'Provider marketplace child denominator is not exact and provider-specific facts require out-of-scope portal/search traversal.' },
  ],
};

const completeness = {
  schemaVersion: 1,
  stageId: 'P6',
  queuePath: 'docs/evidence/P6-source-queue.json',
  queueSha256: sha256(readFileSync(queuePath, 'utf8')),
  capturedAt: retrievedAt,
  outcomes: [
    { queueId: 'p6-reach-higher-montana', outcome: 'completed', discoveredIndividualAwards: 30, acceptedChildren: 16, excludedChildren: 14, remainingCount: 0, cursor: null, applicationRouteVisited: false },
    { queueId: 'p6-fvcc-academicworks', outcome: 'completed', historicalObservedAwards: 179, currentDiscoveredAwards: 169, acceptedChildren: 0, excludedChildren: 169, remainingCount: 0, cursor: { pagesProcessed: [1, 2, 3, 4], firstEmptyPage: 5, firstEmptyPageCount: 0 }, applicationRouteVisited: false },
    { queueId: 'p6-national-farmers-union', outcome: 'completed', discoveredIndividualAwards: 3, acceptedChildren: 0, excludedChildren: 3, remainingCount: 0, cursor: null, applicationRouteVisited: false, limitation: 'The current public page describes application channels but exposes no linked application URL, so all three children are excluded from accepted coverage.' },
    { queueId: 'p6-horatio-alger', outcome: 'blocked-external', staticallyVisibleChildren: 15, statedDenominator: 'over 70 programs', acceptedChildren: 0, exactRemainingCount: null, blockingBoundary: 'Exact enumeration requires filter/application interaction outside P6 authority.', applicationRouteVisited: false },
    { queueId: 'p6-first-scholarships', outcome: 'blocked-external', staticallyVisibleChildren: 0, statedProviderOrganizations: 'more than 150', acceptedChildren: 0, exactScholarshipDenominator: null, blockingBoundary: 'Exact enumeration requires Pearson portal/search interaction and provider-page verification outside P6 authority.', applicationRouteVisited: false },
  ],
  reconciliation: { queueItems: 5, completed: 3, excludedWithEvidence: 0, blockedExternal: 2, resumablyIncomplete: 0, unaccounted: 0 },
  limitations: [
    fixture.fvccAcademicWorks.driftLimitation,
    'A successful public fetch proves only the returned page at the recorded time; it does not prove future cycles or unexposed portal contents.',
    'Blocked sources contribute no accepted child and no inflated denominator.',
  ],
};

const collisions = {
  schemaVersion: 1,
  stageId: 'P6',
  baseline: { revisionId: '223', populatedRows: 197, scholarshipRows: 176, portalRows: 21 },
  exactNameCollisions,
  nearNameCollisionCandidates,
  reviewedIdentityCollisions,
  parentChildBindings: [
    { baselineRows: [79], parentLegacySourceIdentities: [p1SourceIdentity('https://www.reachhighermontana.org/plan-your-future/scholarships#c475'), p1SourceIdentity('https://www.grantinterface.com/Home/Logon?urlkey=SAF')], parentName: 'Reach Higher Montana Scholarship (1 application, MULTIPLE scholarships!)', childCount: 16, treatment: 'preserve exact P1 information/application source identities and the row-79 source-record binding; new children have no legacy row identity' },
    { baselineRows: [55, 83], parentLegacySourceIdentities: [p1SourceIdentity('https://nfu.org/education/scholarships/')], parentName: 'National Farmers Union portal rows', childNames: fixture.nationalFarmersUnion.discoveredChildren.map((child: any) => child.name), treatment: 'preserve the exact P1 NFU source identity and both source-record bindings; accept no child because no current linked application route is exposed' },
  ],
  acceptedChildCount: scholarships.length,
  acceptedChildExactBaselineScholarshipCollisions: acceptedScholarshipCollisions.length,
  dedupeRule: 'An exact normalized-name collision with a baseline Scholarship row blocks acceptance. Every token-Jaccard near-name candidate at or above 0.8 requires an explicit evidence-backed disposition; unreviewed candidates fail deterministic generation. Portal identities remain on parent sources and are never assigned to new children.',
};

const slotMinimumKnown = acceptedSlots.filter((value): value is number => value !== null).reduce((sum, value) => sum + value, 0);
const metrics = {
  schemaVersion: 1,
  stageId: 'P6',
  capturedAt: retrievedAt,
  sources: { queuedParents: 5, completed: 3, blockedExternal: 2 },
  portals: { baselinePortalRows: 21, selectedParentSources: 5, applicationGroupsCreated: 1 },
  awards: { exactlyDiscoveredOnCompletedSources: 202, staticallyVisibleOnBlockedSourcesNotAccepted: 15, acceptedChildRecords: scholarships.length, excludedChildRecords: reachExcluded.length + fixture.nationalFarmersUnion.discoveredChildren.length + 169 },
  cycles: { acceptedActive: 0, acceptedClosed: 0, acceptedUpcoming: 0, acceptedUnknown: cycles.length },
  recipientSlots: { observedMinimumAcrossAcceptedChildrenWithUnknownCycles: slotMinimumKnown, awardsWithUnknownSlotCount: acceptedSlots.filter((value) => value === null).length, activeRecipientSlots: 0 },
  exactNetChangeInActiveEligibleAwards: 0,
  explanation: 'P6 created 16 evidence-bound child records, but the official page states only an annual Jan. 1-Mar. 1 rule with no year-qualified current availability. All 16 cycle states remain unknown, so the exact active eligible net change is zero. The observed minimum 71 recipient slots is historical/undated award-structure evidence, not an active or closed-cycle count. Existing MABA-MGEA and Leave a Legacy rows, NFU children without a current linked application route, blocked sources, and ended FVCC rows are not counted as additions.',
};

const datasetDigest = sha256(canonicalJson(dataset));
(metrics as any).childRecordDatasetSha256 = datasetDigest;

writeOrCheck('docs/evidence/P6-child-records.json', dataset);
writeOrCheck('docs/evidence/P6-exclusions.json', exclusions);
writeOrCheck('docs/evidence/P6-portal-completeness.json', completeness);
writeOrCheck('docs/evidence/P6-collisions.json', collisions);
writeOrCheck('docs/evidence/P6-metrics.json', metrics);

console.log(`P6 COVERAGE ${checkOnly ? 'CHECK ' : ''}PASS queue=5 completed=3 blocked=2 discovered=202 accepted=16 active=0 unknown=16 fvcc=169 terminal=0 slotsObservedMin=${slotMinimumKnown} legacyBindings=${legacyBindings.length} digest=${datasetDigest.slice(0, 12)}`);
