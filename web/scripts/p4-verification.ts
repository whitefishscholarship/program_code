import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import {
  FieldClaimSchema,
  FRESHNESS_POLICIES,
  SOURCE_AUTHORITY_MATRIX,
  VERIFICATION_SCHEMA_VERSION,
  VerificationSourceInputSchema,
  auditPinnedCellData,
  classifyLinkObservation,
  deriveCycleStatus,
  deterministicVerificationSha256,
  evaluateFieldClaims,
  normalizeVerificationSourceUrl,
  parseTypedDate,
  type CycleStatus,
  type DateParseState,
  type DatePrecision,
  type FieldClaim,
  type LinkObservation,
  type ReviewSeverity,
  type TypedDateInput,
  type VerificationSourceInput,
} from '../src/lib/verification';
import {
  EvidenceSchema,
  MODEL_SCHEMA_VERSION,
  SourceArchitectureSchema,
  SourceSchema,
  evidenceId,
  sha256Text,
  stableId,
} from '../src/lib/canonicalModel';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(scriptDir, '..');
const repoRoot = path.resolve(webRoot, '..');
const fixturePath = path.join(webRoot, 'fixtures/p4/verification-scenarios.json');
const p1CellDataPath = path.join(webRoot, 'fixtures/p1/master-database-cell-data.json');
const outputPaths = {
  links: path.join(repoRoot, 'docs/evidence/P4-links.json'),
  cycles: path.join(repoRoot, 'docs/evidence/P4-cycles.json'),
  fieldEvidence: path.join(repoRoot, 'docs/evidence/P4-field-evidence.json'),
  conflicts: path.join(repoRoot, 'docs/evidence/P4-conflicts.json'),
  reviews: path.join(repoRoot, 'docs/evidence/P4-reviews.json'),
};

interface DateScenario {
  id: string;
  input: TypedDateInput;
  availabilityConfirmed: boolean;
  unavailable: boolean;
  expected: {
    parseState: DateParseState;
    precision: DatePrecision;
    closesAt?: string;
    status: CycleStatus;
  };
}

interface FixtureFile {
  schemaVersion: number;
  modelSchemaVersion: string;
  asOf: string;
  defaultTimezone: string;
  limitations: string;
  sources: SourceFixtureSpec[];
  linkObservations: LinkObservation[];
  dateScenarios: DateScenario[];
  fieldClaims: FieldClaim[];
}

type SourceFixtureSpec = z.infer<typeof SourceFixtureSpecSchema>;

const LinkObservationSchema = z.object({
  id: z.string().min(1),
  role: z.enum(['information', 'application', 'excluded']),
  requestedUrl: z.string().url(),
  finalUrl: z.string().url().nullable(),
  status: z.number().int().min(100).max(599).nullable(),
  contentType: z.string().min(1).nullable(),
  failureClass: z.enum(['timeout', 'dns', 'tls', 'rate_limit', 'server_error', 'bot_block', 'login_wall', 'dynamic_shell', 'other']).nullable(),
  markers: z.array(z.enum(['bot_block', 'login_wall', 'dynamic_shell', 'application_form'])),
  retrievedAt: z.string().datetime({ offset: true }),
});

const TypedDateInputSchema = z.object({
  raw: z.union([z.string(), z.number(), z.null()]),
  timezone: z.string().min(1).nullable().optional(),
});

const SourceFixtureSpecSchema = z.object({
  key: z.string().min(1),
  canonicalUrl: z.string().url(),
  architecture: SourceArchitectureSchema,
  authority: z.enum(['official_provider', 'official_application', 'institutional', 'government', 'aggregator', 'unknown']),
  relationship: z.enum(['child_detail', 'parent_summary', 'direct', 'document', 'discovery']),
  direct: z.boolean(),
  subjectIds: z.array(z.string().min(1)).min(1),
});

const P4FixtureSchema = z.object({
  schemaVersion: z.literal(VERIFICATION_SCHEMA_VERSION),
  modelSchemaVersion: z.literal(MODEL_SCHEMA_VERSION),
  asOf: z.string().datetime({ offset: true }),
  defaultTimezone: z.string().min(1),
  limitations: z.string().min(1),
  sources: z.array(SourceFixtureSpecSchema).min(1),
  linkObservations: z.array(LinkObservationSchema),
  dateScenarios: z.array(z.object({
    id: z.string().min(1),
    input: TypedDateInputSchema,
    availabilityConfirmed: z.boolean(),
    unavailable: z.boolean(),
    expected: z.object({
      parseState: z.enum(['parsed', 'unknown', 'invalid']),
      precision: z.enum(['exact_datetime', 'date_only', 'month_only', 'annual_rule', 'rolling', 'approximate', 'unknown']),
      closesAt: z.string().optional(),
      status: z.enum(['active', 'closed', 'upcoming', 'unavailable', 'unknown']),
    }),
  })),
  fieldClaims: z.array(FieldClaimSchema),
});

export function buildP4FixtureSourceRegistry(specValues: SourceFixtureSpec[], asOf: string): VerificationSourceInput[] {
  return z.array(SourceFixtureSpecSchema).parse(specValues).map((spec) => {
    const canonicalUrl = normalizeVerificationSourceUrl(spec.canonicalUrl);
    const sourceId = stableId('src', ['p4-verification', canonicalUrl]);
    const authorityClaim = `authority=${spec.authority}`;
    const authorityContentSha256 = sha256Text(JSON.stringify({ sourceId, canonicalUrl, authority: spec.authority }));
    const authorityIdentity = {
      subjectKind: 'source' as const,
      subjectId: sourceId,
      fieldPath: 'authority',
      sourceId,
      retrievedAt: asOf,
      sourceRevision: 'p4-synthetic-registry-v1',
      result: 'supported' as const,
      claim: authorityClaim,
      contentSha256: authorityContentSha256,
    };
    const authorityEvidence = EvidenceSchema.parse({
      schemaVersion: MODEL_SCHEMA_VERSION,
      id: evidenceId(authorityIdentity),
      ...authorityIdentity,
      reviewerState: 'classified',
    });
    const subjectBindings = spec.subjectIds.map((subjectId) => {
      const claim = `sourceRelationship=${spec.relationship}`;
      const contentSha256 = sha256Text(JSON.stringify({ sourceId, subjectId, relationship: spec.relationship, direct: spec.direct }));
      const identity = {
        subjectKind: 'scholarship' as const,
        subjectId,
        fieldPath: `sourceLinks.${sourceId}.${spec.relationship}.${spec.direct ? 'direct' : 'indirect'}`,
        sourceId,
        retrievedAt: asOf,
        sourceRevision: 'p4-synthetic-registry-v1',
        result: 'supported' as const,
        claim,
        contentSha256,
      };
      return {
        subjectId,
        relationship: spec.relationship,
        direct: spec.direct,
        evidence: EvidenceSchema.parse({
          schemaVersion: MODEL_SCHEMA_VERSION,
          id: evidenceId(identity),
          ...identity,
          reviewerState: 'classified',
        }),
      };
    });
    const source = SourceSchema.parse({
      schemaVersion: MODEL_SCHEMA_VERSION,
      id: sourceId,
      architecture: spec.architecture,
      canonicalUrl,
      offlineAuthority: null,
      host: new URL(canonicalUrl).hostname.toLowerCase(),
      identityPolicy: { preservedQueryParameters: [], fragmentPreserved: false, trackingParametersRemoved: true },
      accessBehavior: 'public',
      authority: spec.authority,
      acquisitionState: 'observed',
      parentSourceIds: [],
      childSourceIds: [],
      evidenceIds: [authorityEvidence.id, ...subjectBindings.map((binding) => binding.evidence.id)].sort(),
      reviewItemIds: [],
      legacySourceIdentity: null,
    });
    return VerificationSourceInputSchema.parse({ key: spec.key, source, authorityEvidence, subjectBindings });
  });
}

interface ReviewReceipt {
  id: string;
  source: 'pinned_cell_data' | 'synthetic_link' | 'date' | 'field';
  subjectId: string;
  reason: string;
  severity: ReviewSeverity;
  state: 'open';
  correctionEligible: false;
  targetStage: 'P5';
}

export interface GeneratedP4Evidence {
  links: Record<string, unknown>;
  cycles: Record<string, unknown>;
  fieldEvidence: Record<string, unknown>;
  conflicts: Record<string, unknown>;
  reviews: Record<string, unknown>;
}

interface P4BuildStateTopology {
  activeStageId: string | null;
  stages: Array<{ id: string; baselineCommit: string | null; status: string }>;
}

export function assertP4BuildStateTopology(buildState: P4BuildStateTopology): void {
  const p4 = buildState.stages.find((stage) => stage.id === 'P4');
  assert(p4 && ['active', 'verified', 'accepted'].includes(p4.status), 'P4 must be active, verified, or accepted');
  if (p4.status === 'accepted') {
    const activeIndex = buildState.activeStageId === null
      ? -1
      : buildState.stages.findIndex((stage) => stage.id === buildState.activeStageId);
    const p4Index = buildState.stages.findIndex((stage) => stage.id === 'P4');
    assert(activeIndex === -1 || activeIndex > p4Index, 'Accepted P4 may coexist only with a later active stage');
  } else {
    assert.equal(buildState.activeStageId, 'P4', `${p4.status} P4 must remain the active stage`);
  }
  assert.equal(p4.baselineCommit, '268758f94922f90bf307229d8633da05b2417c4a');
}

function readJson(filePath: string): unknown {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function addDigest(body: Record<string, unknown>): Record<string, unknown> {
  return { ...body, reportSha256: deterministicVerificationSha256(body) };
}

function countValues<T extends string>(values: T[]): Record<T, number> {
  const output = {} as Record<T, number>;
  for (const value of values) output[value] = (output[value] ?? 0) + 1;
  return output;
}

function reviewId(source: ReviewReceipt['source'], subjectId: string, reason: string): string {
  return `p4_review_${deterministicVerificationSha256([VERIFICATION_SCHEMA_VERSION, source, subjectId, reason])}`;
}

export function generateP4Evidence(): GeneratedP4Evidence {
  const fixtureText = fs.readFileSync(fixturePath, 'utf8');
  const fixtures = P4FixtureSchema.parse(JSON.parse(fixtureText)) as FixtureFile;
  const sourceRegistry = buildP4FixtureSourceRegistry(fixtures.sources, fixtures.asOf);
  assert.equal(new Set(fixtures.linkObservations.map((item) => item.id)).size, fixtures.linkObservations.length, 'Link fixture IDs must be unique');
  assert.equal(new Set(fixtures.dateScenarios.map((item) => item.id)).size, fixtures.dateScenarios.length, 'Date fixture IDs must be unique');
  assert.equal(new Set(fixtures.fieldClaims.map((item) => item.id)).size, fixtures.fieldClaims.length, 'Field claim IDs must be unique');

  const buildState = readJson(path.join(repoRoot, 'docs/BUILD_STATE.json')) as {
    activeStageId: string | null;
    dataAuthority: { productionSpreadsheetId: string | null; productionMutationAuthorized: boolean };
    stages: Array<{ id: string; baselineCommit: string | null; status: string }>;
  };
  const p4 = buildState.stages.find((stage) => stage.id === 'P4');
  assertP4BuildStateTopology(buildState);
  assert.equal(buildState.dataAuthority.productionSpreadsheetId, null);
  assert.equal(buildState.dataAuthority.productionMutationAuthorized, false);

  const p3Acquisition = readJson(path.join(repoRoot, 'docs/evidence/P3-acquisition.json')) as {
    reportSha256: string;
    modelSchemaVersion: string;
    canonicalEntityFixtureTotals: Record<string, number>;
  };
  const p3Completeness = readJson(path.join(repoRoot, 'docs/evidence/P3-completeness.json')) as {
    reportSha256: string;
    totals: { denominator: number; processed: number; succeeded: number; failed: number; remaining: number; reconciled: boolean };
  };
  assert.equal(p3Acquisition.modelSchemaVersion, MODEL_SCHEMA_VERSION);
  assert.equal(p3Acquisition.reportSha256, 'b577e6f2ec3b0ad48848e218863060eabd400cbb2f828a2b1aa4c2a8533b00f8');
  assert.equal(p3Completeness.reportSha256, 'd967119a72f272803cfab5c9a3e22680b5bd7686b69d26a183b1a2578ee89020');
  assert.deepEqual(p3Completeness.totals, { denominator: 34, processed: 34, succeeded: 27, failed: 7, remaining: 0, queued: 0, reconciled: true });

  const p1CellDataText = fs.readFileSync(p1CellDataPath, 'utf8');
  const pinnedAudit = auditPinnedCellData(JSON.parse(p1CellDataText));
  assert.equal(pinnedAudit.hyperlinkDenominator, 270);
  assert.equal(pinnedAudit.retainedHyperlinks, 267);
  assert.equal(pinnedAudit.excludedHyperlinks, 3);
  assert.equal(pinnedAudit.informationHyperlinks, 86);
  assert.equal(pinnedAudit.applicationHyperlinks, 181);
  assert.equal(pinnedAudit.hiddenInformationHyperlinks, 86);
  assert.equal(pinnedAudit.hiddenApplicationHyperlinks, 92);
  assert.equal(pinnedAudit.offlineMethodDenominator, 4);
  assert.equal(pinnedAudit.outcomeDenominator, 274);
  assert.equal(new Set(pinnedAudit.outcomes.map((item) => item.id)).size, pinnedAudit.outcomes.length, 'Pinned link audit receipts must not deduplicate representations');

  const syntheticLinks = fixtures.linkObservations.map(classifyLinkObservation);
  assert(syntheticLinks.every((item) => item.awardClosureSupported === false), 'No link observation may support award closure');
  for (const failure of ['timeout', 'dns-failure', 'tls-failure', 'rate-limit-429', 'server-error-503', 'bot-block', 'login-wall', 'dynamic-near-empty']) {
    assert.equal(syntheticLinks.find((item) => item.id === failure)?.state, 'inconclusive', `${failure} must remain inconclusive`);
  }
  assert.equal(syntheticLinks.find((item) => item.id === 'stale-direct-pdf-404')?.state, 'dead');
  assert.equal(syntheticLinks.find((item) => item.id === 'removed-target-410')?.state, 'dead');
  assert.equal(syntheticLinks.find((item) => item.id === 'off-host-redirect')?.redirectKind, 'off_host');

  const cycleResults = fixtures.dateScenarios.map((scenario) => {
    const parsed = parseTypedDate(scenario.input);
    const status = deriveCycleStatus(parsed, fixtures.asOf, {
      availabilityConfirmed: scenario.availabilityConfirmed,
      unavailable: scenario.unavailable,
      defaultTimezone: fixtures.defaultTimezone,
    });
    assert.equal(parsed.parseState, scenario.expected.parseState, `${scenario.id} parse-state mismatch`);
    assert.equal(parsed.precision, scenario.expected.precision, `${scenario.id} precision mismatch`);
    if (scenario.expected.closesAt) assert.equal(parsed.closesAt, scenario.expected.closesAt, `${scenario.id} close-date mismatch`);
    assert.equal(status, scenario.expected.status, `${scenario.id} cycle-status mismatch`);
    if (parsed.parseState !== 'parsed') assert.equal(status, 'unknown', `${scenario.id} parse failure must not create a current cycle`);
    return { id: scenario.id, input: scenario.input, parsed, availabilityConfirmed: scenario.availabilityConfirmed, unavailable: scenario.unavailable, status };
  });

  const field = evaluateFieldClaims(fixtures.fieldClaims, fixtures.asOf, sourceRegistry);
  const conflicts = field.decisions.filter((decision) => decision.conflict).map((decision) => ({
    id: `p4_conflict_${deterministicVerificationSha256([decision.subjectId, decision.field, decision.evidenceIds])}`,
    subjectId: decision.subjectId,
    field: decision.field,
    preferredValue: decision.preferredValue,
    accepted: decision.accepted,
    evidenceIds: decision.evidenceIds,
    reason: decision.reason,
  }));
  assert(conflicts.length >= 4, 'P4 fixtures require field-level conflicts');
  assert(field.decisions.filter((item) => item.accepted).every((item) => !item.conflict), 'Conflicting claims may not be accepted');
  assert(field.decisions.filter((item) => item.accepted).every((decision) => {
    const evidence = field.receipts.filter((receipt) => decision.evidenceIds.includes(receipt.id));
    return evidence.some((receipt) => receipt.currentDirectOfficial);
  }), 'Every accepted field requires current direct official evidence');

  const reviews: ReviewReceipt[] = [];
  for (const outcome of pinnedAudit.outcomes.filter((item) => item.requiresReview)) {
    const reason = outcome.reason;
    reviews.push({
      id: reviewId('pinned_cell_data', outcome.id, reason),
      source: 'pinned_cell_data',
      subjectId: outcome.id,
      reason,
      severity: outcome.reviewSeverity!,
      state: 'open',
      correctionEligible: false,
      targetStage: 'P5',
    });
  }
  for (const outcome of syntheticLinks.filter((item) => item.requiresReview)) {
    reviews.push({
      id: reviewId('synthetic_link', outcome.id, outcome.reason),
      source: 'synthetic_link',
      subjectId: outcome.id,
      reason: outcome.reason,
      severity: outcome.reviewSeverity!,
      state: 'open',
      correctionEligible: false,
      targetStage: 'P5',
    });
  }
  for (const result of cycleResults.filter((item) => item.parsed.parseState !== 'parsed' || item.status === 'unknown')) {
    const reason = `${result.parsed.reason}; resulting cycle status is ${result.status}`;
    reviews.push({
      id: reviewId('date', result.id, reason),
      source: 'date',
      subjectId: result.id,
      reason,
      severity: 'high',
      state: 'open',
      correctionEligible: false,
      targetStage: 'P5',
    });
  }
  for (const decision of field.decisions.filter((item) => item.reviewRequired)) {
    reviews.push({
      id: reviewId('field', `${decision.subjectId}:${decision.field}`, decision.reason),
      source: 'field',
      subjectId: `${decision.subjectId}:${decision.field}`,
      reason: decision.reason,
      severity: decision.reviewSeverity!,
      state: 'open',
      correctionEligible: false,
      targetStage: 'P5',
    });
  }
  reviews.sort((left, right) => left.id.localeCompare(right.id));
  assert.equal(new Set(reviews.map((item) => item.id)).size, reviews.length, 'Review receipt IDs must be unique');

  const pinnedInputs = {
    p2ModelSchemaVersion: MODEL_SCHEMA_VERSION,
    p3AcquisitionReportSha256: p3Acquisition.reportSha256,
    p3CompletenessReportSha256: p3Completeness.reportSha256,
    p3WorkDenominator: p3Completeness.totals.denominator,
    p4FixtureSha256: sha256Text(fixtureText),
    p1CellDataFixtureSha256: sha256Text(p1CellDataText),
  };
  const common = {
    schemaVersion: VERIFICATION_SCHEMA_VERSION,
    stageId: 'P4',
    generatedAt: fixtures.asOf,
    baselineCommit: p4!.baselineCommit,
    pinnedInputs,
    limitations: fixtures.limitations,
  };

  const links = addDigest({
    ...common,
    pinnedCellDataAudit: pinnedAudit,
    syntheticObservationCount: syntheticLinks.length,
    syntheticStateCounts: countValues(syntheticLinks.map((item) => item.state)),
    syntheticTargetCounts: countValues(syntheticLinks.map((item) => item.targetClass)),
    syntheticObservations: syntheticLinks,
    destructiveDecisionBoundary: {
      awardClosureSupportedCount: syntheticLinks.filter((item) => item.awardClosureSupported).length,
      correctionReviewEligibleCount: syntheticLinks.filter((item) => item.linkCorrectionReviewEligible).length,
      statement: 'A dead target may enter review for link correction; no network outcome alone makes an award archive or closure eligible.',
    },
  });
  const cycles = addDigest({
    ...common,
    defaultTimezone: fixtures.defaultTimezone,
    scenarioCount: cycleResults.length,
    parseStateCounts: countValues(cycleResults.map((item) => item.parsed.parseState)),
    precisionCounts: countValues(cycleResults.map((item) => item.parsed.precision)),
    statusCounts: countValues(cycleResults.map((item) => item.status)),
    scenarios: cycleResults,
    falseCurrentBoundary: {
      parseFailureCurrentCount: cycleResults.filter((item) => item.parsed.parseState !== 'parsed' && item.status === 'active').length,
      statement: 'Unknown and invalid date inputs remain unknown and cannot become active solely because parsing failed.',
    },
  });
  const fieldEvidence = addDigest({
    ...common,
    freshnessPolicies: FRESHNESS_POLICIES,
    sourceAuthorityMatrix: SOURCE_AUTHORITY_MATRIX,
    claimDenominator: fixtures.fieldClaims.length,
    evidenceReceiptDenominator: field.receipts.length,
    decisionDenominator: field.decisions.length,
    acceptedDecisionCount: field.decisions.filter((item) => item.accepted).length,
    reviewDecisionCount: field.decisions.filter((item) => item.reviewRequired).length,
    receipts: field.receipts,
    decisions: field.decisions,
  });
  const conflictEvidence = addDigest({
    ...common,
    conflictDenominator: conflicts.length,
    acceptedConflictCount: conflicts.filter((item) => item.accepted).length,
    conflicts,
  });
  const reviewEvidence = addDigest({
    ...common,
    reviewDenominator: reviews.length,
    severityCounts: countValues(reviews.map((item) => item.severity)),
    sourceCounts: countValues(reviews.map((item) => item.source)),
    correctionEligibleCount: reviews.filter((item) => item.correctionEligible).length,
    reviews,
  });
  return { links, cycles, fieldEvidence, conflicts: conflictEvidence, reviews: reviewEvidence };
}

function main(): void {
  const checkOnly = process.argv.includes('--check');
  const generated = generateP4Evidence();
  for (const [key, outputPath] of Object.entries(outputPaths) as Array<[keyof GeneratedP4Evidence, string]>) {
    const serialized = `${JSON.stringify(generated[key], null, 2)}\n`;
    if (checkOnly) {
      assert.equal(fs.readFileSync(outputPath, 'utf8'), serialized, `${path.relative(repoRoot, outputPath)} is stale`);
    } else {
      fs.writeFileSync(outputPath, serialized);
    }
  }
  const links = generated.links as { pinnedCellDataAudit: { hyperlinkDenominator: number; offlineMethodDenominator: number }; reportSha256: string };
  const cycles = generated.cycles as { scenarioCount: number; reportSha256: string };
  const field = generated.fieldEvidence as { decisionDenominator: number; reportSha256: string };
  const conflicts = generated.conflicts as { conflictDenominator: number };
  const reviews = generated.reviews as { reviewDenominator: number };
  console.log(`P4 VERIFICATION ${checkOnly ? 'CHECK ' : ''}PASS links=${links.pinnedCellDataAudit.hyperlinkDenominator} offline=${links.pinnedCellDataAudit.offlineMethodDenominator} cycles=${cycles.scenarioCount} fields=${field.decisionDenominator} conflicts=${conflicts.conflictDenominator} reviews=${reviews.reviewDenominator} digest=${links.reportSha256.slice(0, 12)}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
