import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import {
  ACQUISITION_ROUTES,
  ACQUISITION_SCHEMA_VERSION,
  WorkOutcomeSchema,
  buildFixtureCanonicalGraph,
  canonicalizeAcquisitionUrl,
  classifyArchitecture,
  deterministicJsonSha256,
  discoverPagination,
  enumerateDirectoryLinks,
  extractSinglePage,
  parseDocumentSections,
  readPublicForm,
  routeArchitecture,
  runFixtureQueue,
  splitMultiAwardSections,
  type AcquisitionFixtureScenario,
} from '../src/lib/acquisition';
import {
  ApplicationModeSchema,
  MODEL_SCHEMA_VERSION,
  SOURCE_ARCHITECTURES,
  SourceArchitectureSchema,
  canonicalRelationshipErrors,
  sha256Text,
} from '../src/lib/canonicalModel';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(scriptDir, '..');
const repoRoot = path.resolve(webRoot, '..');
const fixturePath = path.join(webRoot, 'fixtures/p3/acquisition-scenarios.json');
const acquisitionPath = path.join(repoRoot, 'docs/evidence/P3-acquisition.json');
const completenessPath = path.join(repoRoot, 'docs/evidence/P3-completeness.json');

const FixtureScenarioSchema = z.object({
  id: z.string().min(1),
  architecture: SourceArchitectureSchema,
  sourceUrl: z.string().url().nullable(),
  offlineAuthority: z.string().min(1).nullable(),
  applicationMode: ApplicationModeSchema.nullable(),
  workCap: z.number().int().positive(),
  maxAttempts: z.number().int().positive(),
  workItems: z.array(z.object({
    key: z.string().min(1),
    url: z.string().url().nullable(),
    outcomes: z.array(WorkOutcomeSchema).min(1),
    childNames: z.array(z.string().min(1)),
  })),
  parserFixture: z.object({
    kind: z.enum(['single_html', 'multi_html', 'directory_html', 'pagination_html', 'document_text', 'public_form_html']),
    content: z.string().min(1),
  }).optional(),
}).superRefine((scenario, ctx) => {
  if ((scenario.sourceUrl === null) === (scenario.offlineAuthority === null)) {
    ctx.addIssue({ code: 'custom', message: 'Fixture scenario requires exactly one source URL or offline authority' });
  }
});

const FixtureFileSchema = z.object({
  schemaVersion: z.literal(ACQUISITION_SCHEMA_VERSION),
  modelSchemaVersion: z.literal(MODEL_SCHEMA_VERSION),
  observedAt: z.string().datetime({ offset: true }),
  limitations: z.string().min(1),
  scenarios: z.array(FixtureScenarioSchema).min(1),
});

export interface GeneratedP3Evidence {
  acquisition: Record<string, unknown>;
  completeness: Record<string, unknown>;
}

function addDigest(body: Record<string, unknown>): Record<string, unknown> {
  return { ...body, reportSha256: deterministicJsonSha256(body) };
}

function receiptEvidence(receipt: Awaited<ReturnType<typeof runFixtureQueue>>[number]): Record<string, unknown> {
  const safeReceipt = structuredClone(receipt) as Partial<typeof receipt>;
  delete safeReceipt.receiptMac;
  return { ...safeReceipt, receiptMacWithheld: true };
}

function executeParserFixture(scenario: AcquisitionFixtureScenario): Record<string, unknown> | null {
  const fixture = scenario.parserFixture;
  if (!fixture) return null;
  const expectedNames = scenario.workItems.flatMap((item) => item.childNames);
  let observation: unknown;
  if (fixture.kind === 'single_html') {
    observation = extractSinglePage(fixture.content);
    assert(expectedNames.includes((observation as ReturnType<typeof extractSinglePage>).title));
  } else if (fixture.kind === 'multi_html') {
    observation = splitMultiAwardSections(fixture.content);
    assert.deepEqual((observation as ReturnType<typeof splitMultiAwardSections>).map((item) => item.name), expectedNames);
  } else if (fixture.kind === 'directory_html') {
    observation = enumerateDirectoryLinks(fixture.content, scenario.sourceUrl!);
    const discovered = (observation as ReturnType<typeof enumerateDirectoryLinks>).links.map((item) => item.url);
    assert.deepEqual(discovered, scenario.workItems.map((item) => canonicalizeAcquisitionUrl(item.url!).url));
  } else if (fixture.kind === 'pagination_html') {
    observation = discoverPagination(fixture.content, scenario.sourceUrl!);
    assert((observation as ReturnType<typeof discoverPagination>).pages.length > 0);
  } else if (fixture.kind === 'document_text') {
    observation = parseDocumentSections(fixture.content);
    assert.deepEqual((observation as ReturnType<typeof parseDocumentSections>).map((item) => item.name), expectedNames);
  } else {
    observation = readPublicForm(fixture.content, scenario.sourceUrl!);
    const form = observation as ReturnType<typeof readPublicForm>;
    assert.equal(form.title, expectedNames[0]);
    assert.equal(form.submitted, false);
    assert(form.questions.length > 0);
  }
  return { kind: fixture.kind, resultSha256: deterministicJsonSha256(observation), observation };
}

export async function generateP3Evidence(): Promise<GeneratedP3Evidence> {
  const fixtureText = fs.readFileSync(fixturePath, 'utf8');
  const fixtures = FixtureFileSchema.parse(JSON.parse(fixtureText));
  const buildState = JSON.parse(fs.readFileSync(path.join(repoRoot, 'docs/BUILD_STATE.json'), 'utf8')) as {
    stages: Array<{ id: string; baselineCommit: string | null }>;
  };
  const p3Baseline = buildState.stages.find((stage) => stage.id === 'P3')?.baselineCommit;
  assert.match(p3Baseline ?? '', /^[0-9a-f]{40}$/, 'P3 requires a pinned baseline');

  const p1InventoryText = fs.readFileSync(path.join(repoRoot, 'docs/evidence/P1-inventory.json'), 'utf8');
  const liveObservationText = fs.readFileSync(path.join(repoRoot, 'docs/evidence/P3-live-observations.json'), 'utf8');
  const liveObservations = z.object({
    schemaVersion: z.literal(1),
    stageId: z.literal('P3'),
    observedAt: z.string().datetime({ offset: true }),
    method: z.string().min(1),
    limitations: z.string().min(1),
    observations: z.array(z.object({
      requestedUrl: z.string().url(),
      observedCanonicalUrl: z.string().url(),
      architecture: SourceArchitectureSchema,
      scrapeId: z.string().min(1),
      contentSha256: z.string().regex(/^[0-9a-f]{64}$/),
      boundedDenominator: z.record(z.string(), z.number().int().nonnegative()),
      observed: z.string().min(1),
      reviewState: z.literal('observation_only'),
    })).min(1),
    externalEffects: z.object({
      publicReadOnlyFetches: z.number().int().nonnegative(),
      spreadsheetReads: z.literal(0),
      spreadsheetWrites: z.literal(0),
      formSubmissions: z.literal(0),
      providerContacts: z.literal(0),
      authenticatedInteractions: z.literal(0),
    }),
  }).parse(JSON.parse(liveObservationText));
  const p2DryRun = JSON.parse(fs.readFileSync(path.join(repoRoot, 'docs/evidence/P2-dry-run.json'), 'utf8')) as {
    modelSchemaVersion: string;
    pinnedInput: { p1InventorySha256: string };
    canonicalDatasetSha256: string;
  };
  assert.equal(sha256Text(p1InventoryText), p2DryRun.pinnedInput.p1InventorySha256, 'P1 inventory digest must match accepted P2 input');
  assert.equal(p2DryRun.modelSchemaVersion, MODEL_SCHEMA_VERSION, 'P2 model schema version must remain pinned');

  const scenarioResults: Array<Record<string, unknown>> = [];
  const completenessScenarios: Array<Record<string, unknown>> = [];
  const graphTotals = { sources: 0, scholarships: 0, applicationGroups: 0, cycles: 0, evidence: 0, reviewItems: 0 };
  let workDenominator = 0;
  let workProcessed = 0;
  let workSucceeded = 0;
  let workFailed = 0;
  let workRemaining = 0;

  for (const scenario of fixtures.scenarios as AcquisitionFixtureScenario[]) {
    const classification = classifyArchitecture({ declaredArchitecture: scenario.architecture });
    assert.equal(classification.architecture, scenario.architecture);
    const route = routeArchitecture(classification.architecture);
    const receipts = await runFixtureQueue(scenario);
    const finalReceipt = receipts.at(-1)!;
    assert.equal(finalReceipt.remaining, 0, `${scenario.id} fixture queue must reach a measured end`);
    assert.equal(finalReceipt.processedTotal, finalReceipt.denominator, `${scenario.id} denominator must reconcile`);

    const graph = buildFixtureCanonicalGraph(scenario, fixtures.observedAt, receipts);
    assert.deepEqual(canonicalRelationshipErrors(graph), [], `${scenario.id} fixture graph relationships must resolve`);
    graphTotals.sources += graph.sources.length;
    graphTotals.scholarships += graph.scholarships.length;
    graphTotals.applicationGroups += graph.applicationGroups.length;
    graphTotals.cycles += graph.cycles.length;
    graphTotals.evidence += graph.evidence.length;
    graphTotals.reviewItems += graph.reviewItems.length;
    workDenominator += finalReceipt.denominator;
    workProcessed += finalReceipt.processedTotal;
    workSucceeded += finalReceipt.succeededTotal;
    workFailed += finalReceipt.failedTotal;
    workRemaining += finalReceipt.remaining;

    scenarioResults.push({
      id: scenario.id,
      architecture: scenario.architecture,
      route,
      sourceIdentity: scenario.sourceUrl ? canonicalizeAcquisitionUrl(scenario.sourceUrl).url : scenario.offlineAuthority,
      childCount: graph.scholarships.length,
      applicationGroupCount: graph.applicationGroups.length,
      cycleCount: graph.cycles.length,
      evidenceCount: graph.evidence.length,
      reviewItemCount: graph.reviewItems.length,
      parserObservation: executeParserFixture(scenario),
      finalCompleteness: {
        denominator: finalReceipt.denominator,
        processed: finalReceipt.processedTotal,
        succeeded: finalReceipt.succeededTotal,
        failed: finalReceipt.failedTotal,
        remaining: finalReceipt.remaining,
        queued: finalReceipt.queued,
        runs: receipts.length,
      },
    });
    completenessScenarios.push({
      id: scenario.id,
      architecture: scenario.architecture,
      cap: scenario.workCap,
      maxAttempts: scenario.maxAttempts,
      runs: receipts.map(receiptEvidence),
      final: {
        denominator: finalReceipt.denominator,
        processed: finalReceipt.processedTotal,
        succeeded: finalReceipt.succeededTotal,
        failed: finalReceipt.failedTotal,
        remaining: finalReceipt.remaining,
        queued: finalReceipt.queued,
        failedKeys: receipts.flatMap((receipt) => receipt.failedKeys),
        failures: receipts.flatMap((receipt) => receipt.failures),
        complete: finalReceipt.complete,
      },
    });
  }

  const coveredArchitectures = [...new Set(fixtures.scenarios.map((scenario) => scenario.architecture))].sort();
  assert.deepEqual(coveredArchitectures, [...SOURCE_ARCHITECTURES].sort(), 'P3 fixtures must cover every P2 source taxonomy');
  assert.equal(workDenominator, workProcessed + workRemaining, 'complete work denominator must reconcile');
  assert.equal(workProcessed, workSucceeded + workFailed, 'processed work must reconcile to success and explicit failure');

  const identityCases = [
    'https://fixtures.invalid/search?utm_source=x&page=2&urlkey=award-a&sys_id=record-a&filters=mt#details',
    'https://fixtures.invalid/search?page=3&urlkey=award-b&sys_id=record-b&filters=national#other',
  ].map((url) => canonicalizeAcquisitionUrl(url));

  const acquisitionBody = {
    schemaVersion: ACQUISITION_SCHEMA_VERSION,
    stageId: 'P3',
    generatedAt: fixtures.observedAt,
    baselineCommit: p3Baseline,
    modelSchemaVersion: MODEL_SCHEMA_VERSION,
    pinnedInput: {
      p1InventorySha256: p2DryRun.pinnedInput.p1InventorySha256,
      p2CanonicalDatasetSha256: p2DryRun.canonicalDatasetSha256,
      fixtureSha256: sha256Text(fixtureText),
      liveObservationSha256: sha256Text(liveObservationText),
    },
    limitations: fixtures.limitations,
    routingMatrix: Object.entries(ACQUISITION_ROUTES).map(([architecture, route]) => ({ architecture, route })),
    coveredArchitectures,
    scenarioCount: fixtures.scenarios.length,
    scenarioResults,
    canonicalEntityFixtureTotals: graphTotals,
    parserCoverage: fixtures.scenarios.flatMap((scenario) => scenario.parserFixture ? [scenario.parserFixture.kind] : []),
    identityPolicy: {
      trackingParameters: 'allow-listed removal only',
      meaningfulFragmentsPreserved: true,
      cases: identityCases,
    },
    publicObservations: {
      observedAt: liveObservations.observedAt,
      count: liveObservations.observations.length,
      architectures: [...new Set(liveObservations.observations.map((item) => item.architecture))].sort(),
      limitations: liveObservations.limitations,
    },
    boundaries: {
      fixtureSpreadsheetReads: 0,
      publicReadOnlyFetches: liveObservations.externalEffects.publicReadOnlyFetches,
      spreadsheetWrites: 0,
      formSubmissions: 0,
      providerContacts: 0,
      acceptedFactTransitions: 0,
      productBehaviorChanges: 0,
    },
  };
  const completenessBody = {
    schemaVersion: ACQUISITION_SCHEMA_VERSION,
    stageId: 'P3',
    generatedAt: fixtures.observedAt,
    baselineCommit: p3Baseline,
    totals: {
      denominator: workDenominator,
      processed: workProcessed,
      succeeded: workSucceeded,
      failed: workFailed,
      remaining: workRemaining,
      queued: workRemaining,
      reconciled: workDenominator === workProcessed + workRemaining && workProcessed === workSucceeded + workFailed,
    },
    failurePolicy: {
      timeoutAndNetworkRetries: 'bounded by per-scenario maxAttempts',
      retryExhaustion: 'explicit failure and review; never closure evidence',
      botBlockLoginWallMalformedChild: 'explicit failure and review; no access-control bypass',
      cap: 'unprocessed denominator remains in cursor-addressed queue',
    },
    scenarios: completenessScenarios,
  };
  return { acquisition: addDigest(acquisitionBody), completeness: addDigest(completenessBody) };
}

function serialized(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

async function main(): Promise<void> {
  const generated = await generateP3Evidence();
  const outputs: Array<[string, string]> = [
    [acquisitionPath, serialized(generated.acquisition)],
    [completenessPath, serialized(generated.completeness)],
  ];
  if (process.argv.includes('--check')) {
    for (const [outputPath, expected] of outputs) {
      assert.equal(fs.readFileSync(outputPath, 'utf8'), expected, `${path.relative(repoRoot, outputPath)} is stale`);
    }
    console.log(`P3 ACQUISITION CHECK PASS ${String(generated.acquisition.reportSha256).slice(0, 12)}`);
    return;
  }
  for (const [outputPath, content] of outputs) fs.writeFileSync(outputPath, content);
  console.log(`P3 ACQUISITION GENERATED ${String(generated.acquisition.reportSha256)}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
