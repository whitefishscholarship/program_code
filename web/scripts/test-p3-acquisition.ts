import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ACQUISITION_ROUTES,
  buildFixtureCanonicalGraph,
  canonicalizeAcquisitionUrl,
  classifyArchitecture,
  discoverPagination,
  enumerateDirectoryLinks,
  extractSinglePage,
  parseDocumentSections,
  readPublicForm,
  routeArchitecture,
  runBoundedQueue,
  runFixtureQueue,
  splitMultiAwardSections,
  type AcquisitionFixtureScenario,
} from '../src/lib/acquisition';
import {
  MODEL_SCHEMA_VERSION,
  SOURCE_ARCHITECTURES,
  canonicalRelationshipErrors,
  stableId,
} from '../src/lib/canonicalModel';
import { generateP3Evidence } from './p3-acquisition';

async function main(): Promise<void> {
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(scriptDir, '..');
const repoRoot = path.resolve(webRoot, '..');
const fixtures = JSON.parse(fs.readFileSync(path.join(webRoot, 'fixtures/p3/acquisition-scenarios.json'), 'utf8')) as {
  modelSchemaVersion: string;
  observedAt: string;
  scenarios: AcquisitionFixtureScenario[];
};

assert.equal(fixtures.modelSchemaVersion, MODEL_SCHEMA_VERSION);
assert.equal(new Set(fixtures.scenarios.map((scenario) => scenario.id)).size, fixtures.scenarios.length, 'scenario IDs must be unique');

const identityInput = 'HTTPS://Example.COM:443/a/?utm_source=x&page=2&urlkey=A&sys_id=B&filters=mt&fbclid=z#c475';
const identity = canonicalizeAcquisitionUrl(identityInput);
assert.equal(identity.url, 'https://example.com/a?filters=mt&page=2&sys_id=B&urlkey=A#c475');
assert.deepEqual(identity.preservedQueryParameters, ['filters', 'page', 'sys_id', 'urlkey']);
assert.deepEqual(identity.removedTrackingParameters, ['fbclid', 'utm_source']);
assert.equal(identity.fragmentPreserved, true);
assert.equal(
  canonicalizeAcquisitionUrl('https://example.com/a?page=2&utm_campaign=one').url,
  canonicalizeAcquisitionUrl('https://example.com/a?utm_campaign=two&page=2').url,
  'allow-listed tracking parameters must not affect identity',
);
assert.notEqual(
  canonicalizeAcquisitionUrl('https://example.com/a?page=2').url,
  canonicalizeAcquisitionUrl('https://example.com/a?page=3').url,
  'page identity must survive',
);
assert.notEqual(
  canonicalizeAcquisitionUrl('https://example.com/a?urlkey=one#details').url,
  canonicalizeAcquisitionUrl('https://example.com/a?urlkey=two#other').url,
  'urlkey and meaningful fragments must survive',
);

for (const scenario of fixtures.scenarios) {
  const classified = classifyArchitecture({ declaredArchitecture: scenario.architecture });
  assert.equal(classified.architecture, scenario.architecture, `${scenario.id} declared architecture must be stable`);
  assert.equal(routeArchitecture(scenario.architecture), ACQUISITION_ROUTES[scenario.architecture]);
}
assert.equal(classifyArchitecture({}).architecture, 'unknown');
assert.equal(
  classifyArchitecture({ directory: true, commonApplication: true }).architecture,
  'unknown',
  'ambiguous structural signals must not be promoted',
);
assert.equal(classifyArchitecture({ document: true }).architecture, 'document_or_pdf');
const signalCases = [
  [{ singleAward: true }, 'single_award_page'],
  [{ multipleAwards: true }, 'multi_award_page'],
  [{ directory: true }, 'directory_hub'],
  [{ pagination: true }, 'paginated_catalog'],
  [{ commonApplication: true }, 'common_application'],
  [{ matching: true }, 'matching_portal'],
  [{ externalProviders: true }, 'external_marketplace'],
  [{ loginRequired: true }, 'login_application_portal'],
  [{ document: true }, 'document_or_pdf'],
  [{ publicForm: true }, 'form_only'],
  [{ institutionUmbrella: true }, 'institution_umbrella'],
  [{ offline: true }, 'offline_or_automatic'],
] as const;
for (const [signals, architecture] of signalCases) {
  assert.equal(classifyArchitecture(signals).architecture, architecture);
}
assert.deepEqual(
  [...new Set(fixtures.scenarios.map((scenario) => scenario.architecture))].sort(),
  [...SOURCE_ARCHITECTURES].sort(),
  'fixtures must route every P2 taxonomy',
);

const single = extractSinglePage('<html><head><title>Fallback</title></head><body><main><h1>Sanitized Award</h1><p>Visible text.</p><script>ignore()</script></main></body></html>');
assert.equal(single.title, 'Sanitized Award');
assert.equal(single.text, 'Sanitized Award Visible text.');
assert(!single.text.includes('ignore'), 'scripts must not enter extracted text');

const sections = splitMultiAwardSections(`
  <main>
    <h1>Scholarship Opportunities</h1>
    <h2 data-award-name="Sanitized Alpha Award">Alpha</h2><p>Alpha body</p>
    <h2 data-award-name="Sanitized Beta Scholarship">Beta</h2><p>Beta body</p>
    <h2 data-award-name="Sanitized Trades Grant">Trades</h2><p>Trades body</p>
  </main>`);
assert.deepEqual(sections.map((section) => section.name), [
  'Sanitized Alpha Award',
  'Sanitized Beta Scholarship',
  'Sanitized Trades Grant',
]);
assert.equal(new Set(sections.map((section) => section.contentSha256)).size, 3);

const directory = enumerateDirectoryLinks(`
  <a href="/award?page=1&utm_source=one">Award one</a>
  <a href="/award?utm_source=two&page=1">Duplicate tracked link</a>
  <a href="/award?page=2#details">Award two</a>
  <a href="javascript:submit()">Unsafe action</a>`, 'https://fixtures.invalid/hub');
assert.equal(directory.links.length, 2, 'tracking variants must dedupe without collapsing page identity');
assert.equal(directory.rejected.length, 1, 'unsupported links must be explicitly receipted');
assert(directory.links.some((link) => link.url.endsWith('?page=2#details')));

const pagination = discoverPagination(`
  <a data-page="2" href="?page=2&utm_medium=test">2</a>
  <a rel="next" href="?page=3">Next</a>
  <span data-cursor="opaque-b"></span><span data-cursor="opaque-a"></span>`, 'https://fixtures.invalid/catalog?page=1');
assert.deepEqual(pagination.pages.map((page) => page.token), ['2', '3']);
assert.deepEqual(pagination.cursors, ['opaque-a', 'opaque-b']);
assert.equal(pagination.rejected.length, 0);

const documentSections = parseDocumentSections(`
# Sanitized Document Award A
Versioned body A.
=== Award: Sanitized Document Award B ===
Versioned body B.`);
assert.deepEqual(documentSections.map((section) => section.name), [
  'Sanitized Document Award A',
  'Sanitized Document Award B',
]);

const publicForm = readPublicForm(`
  <html><body><h1>Sanitized Public Form</h1>
  <form method="post" action="/submit?sys_id=form-a&utm_source=test">
    <label for="email">Email address</label><input id="email" value="applicant@example.test">
    <label for="essay">Essay</label><textarea id="essay">private response</textarea>
    <button>Submit</button>
  </form></body></html>`, 'https://fixtures.invalid/form');
assert.equal(publicForm.submitted, false);
assert.equal(publicForm.actionUrl, 'https://fixtures.invalid/submit?sys_id=form-a');
assert.deepEqual(publicForm.fieldLabels, ['Email address', 'Essay']);
assert.equal(publicForm.controlCount, 3);
assert(!JSON.stringify(publicForm).includes('applicant@example.test'));
assert(!JSON.stringify(publicForm).includes('private response'));

const capItems = [
  { key: 'one', url: 'https://fixtures.invalid/1' },
  { key: 'two', url: 'https://fixtures.invalid/2' },
  { key: 'three', url: 'https://fixtures.invalid/3' },
];
const capFirst = await runBoundedQueue(capItems, { cap: 2, maxAttempts: 3, execute: () => 'success' });
assert.deepEqual({
  denominator: capFirst.denominator,
  processed: capFirst.processedTotal,
  remaining: capFirst.remaining,
  queued: capFirst.queued,
}, { denominator: 3, processed: 2, remaining: 1, queued: 1 });
assert(capFirst.cursor, 'a partial cap requires a resumable cursor');
const capFinal = await runBoundedQueue(capItems, { cap: 2, maxAttempts: 3, cursor: capFirst.cursor, execute: () => 'success' });
assert.equal(capFinal.processedTotal, 3);
assert.equal(capFinal.remaining, 0);
assert.equal(capFinal.cursor, null);
assert.equal(capFinal.succeededTotal, 3);
const capRepeat = await runBoundedQueue(capItems, { cap: 2, maxAttempts: 3, execute: () => 'success' });
assert.deepEqual(capRepeat, capFirst, 'same input and receipt start must be idempotent');
const tamperedState = JSON.parse(Buffer.from(capFirst.cursor!, 'base64url').toString('utf8'));
tamperedState.succeededKeys = ['not-a-work-item'];
const tamperedCursor = Buffer.from(JSON.stringify(tamperedState)).toString('base64url');
await assert.rejects(
  runBoundedQueue(capItems, { cap: 2, maxAttempts: 3, cursor: tamperedCursor, execute: () => 'success' }),
  /outcome keys/,
);
await assert.rejects(
  runBoundedQueue(capItems, { cap: 2, maxAttempts: 3, cursor: 'not-a-valid-cursor', execute: () => 'success' }),
  /Invalid acquisition cursor/,
);
await assert.rejects(
  runBoundedQueue([{ key: 'duplicate', url: null }, { key: 'duplicate', url: null }], { cap: 1, maxAttempts: 1, execute: () => 'success' }),
  /unique/,
);

const attempts = new Map<string, number>();
const failures = await runBoundedQueue([
  { key: 'recover', url: null },
  { key: 'timeout', url: null },
  { key: 'bot', url: null },
  { key: 'malformed', url: null },
], {
  cap: 4,
  maxAttempts: 3,
  execute: (item) => {
    const attempt = (attempts.get(item.key) ?? 0) + 1;
    attempts.set(item.key, attempt);
    if (item.key === 'recover') return attempt === 1 ? 'timeout' : 'success';
    if (item.key === 'timeout') return 'timeout';
    if (item.key === 'bot') return 'bot_block';
    return 'malformed';
  },
});
assert.equal(failures.succeededTotal, 1);
assert.equal(failures.failedTotal, 3);
assert.equal(failures.failures.find((failure) => failure.key === 'timeout')?.attempts, 3);
assert.equal(failures.failures.find((failure) => failure.key === 'bot')?.attempts, 1);
assert.equal(failures.processedTotal + failures.remaining, failures.denominator);

let totalChildren = 0;
for (const scenario of fixtures.scenarios) {
  const firstGraph = buildFixtureCanonicalGraph(scenario, fixtures.observedAt);
  const secondGraph = buildFixtureCanonicalGraph(scenario, fixtures.observedAt);
  assert.deepEqual(firstGraph, secondGraph, `${scenario.id} canonical output must be deterministic`);
  assert.deepEqual(canonicalRelationshipErrors(firstGraph), [], `${scenario.id} relationships must resolve`);
  assert.equal(firstGraph.scholarships.length, scenario.childNames.length, `${scenario.id} child denominator must be exact`);
  assert.equal(new Set(firstGraph.scholarships.map((scholarship) => scholarship.id)).size, scenario.childNames.length);
  assert(firstGraph.evidence.every((item) => item.result === 'unverified'), 'P3 fixture facts must remain unverified');
  assert(firstGraph.cycles.every((cycle) => cycle.status === 'unknown'), 'P3 must not make P4 cycle decisions');
  assert(firstGraph.reviewItems.every((item) => item.targetStage === 'P4'));
  const receipts = await runFixtureQueue(scenario);
  const final = receipts.at(-1)!;
  assert.equal(final.remaining, 0, `${scenario.id} queue must reach a measured end`);
  assert.equal(final.processedTotal, final.denominator);
  for (const failedKey of final.failedKeys) {
    const failureSourceId = stableId('src', ['p3-fixture', scenario.id, 'failed-work', failedKey]);
    const failureSource = firstGraph.sources.find((source) => source.id === failureSourceId);
    assert(failureSource, `${scenario.id} failed work ${failedKey} requires a canonical source receipt`);
    assert(failureSource.reviewItemIds.length > 0, `${scenario.id} failed work ${failedKey} requires a review item`);
    assert(firstGraph.reviewItems.some((item) => item.subjectId === failureSourceId));
  }
  totalChildren += firstGraph.scholarships.length;
}
assert(totalChildren > 0);

const generated = await generateP3Evidence();
const committedAcquisition = JSON.parse(fs.readFileSync(path.join(repoRoot, 'docs/evidence/P3-acquisition.json'), 'utf8'));
const committedCompleteness = JSON.parse(fs.readFileSync(path.join(repoRoot, 'docs/evidence/P3-completeness.json'), 'utf8'));
assert.deepEqual(committedAcquisition, generated.acquisition, 'committed acquisition evidence must be deterministic');
assert.deepEqual(committedCompleteness, generated.completeness, 'committed completeness evidence must be deterministic');

console.log(`P3 ACQUISITION TEST ALL PASS ${String(generated.acquisition.reportSha256).slice(0, 12)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
