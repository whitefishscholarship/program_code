import assert from 'node:assert/strict';
import { createHash, randomBytes } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ACQUISITION_ROUTES,
  buildFixtureCanonicalGraph,
  canonicalizeAcquisitionUrl,
  classifyArchitecture,
  createReceiptStore,
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
const receiptTestRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'p3-receipt-test-'));
const receiptTestKey = randomBytes(32);
let receiptStoreIndex = 0;
const newReceiptStore = () => createReceiptStore(path.join(receiptTestRoot, `store-${receiptStoreIndex += 1}`), receiptTestKey);

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
const repeatedSections = splitMultiAwardSections(`
  <h2 data-award-name="Repeated Award">First</h2><p>First body</p>
  <h2 data-award-name="Repeated Award">Second</h2><p>Second body</p>`);
assert.equal(repeatedSections.length, 2, 'same-name sections must retain distinct occurrences');
assert.notEqual(repeatedSections[0].contentSha256, repeatedSections[1].contentSha256);

const directory = enumerateDirectoryLinks(`
  <a href="/award?page=1&utm_source=one">Award one</a>
  <a href="/award?utm_source=two&page=1">Duplicate tracked link</a>
  <a href="/award?page=2#details">Award two</a>
  <a href="javascript:submit()">Unsafe action</a>`, 'https://fixtures.invalid/hub');
assert.equal(directory.links.length, 3, 'same canonical URL occurrences and their labels must be retained');
assert.equal(directory.links.filter((link) => link.url.endsWith('?page=1')).length, 2);
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
assert.deepEqual(publicForm.questions.map((question) => question.controlTypes), [['text'], ['textarea']]);
assert.equal(publicForm.controlCount, 3);
assert(!JSON.stringify(publicForm).includes('applicant@example.test'));
assert(!JSON.stringify(publicForm).includes('private response'));
const nestedForm = readPublicForm(`
  <h1>Nested Control Form</h1><form>
    <label>Essay<textarea>DO-NOT-COLLECT-APPLICANT-ESSAY</textarea></label>
    <label>Choice<select><option selected>DO-NOT-COLLECT-SELECTED-RESPONSE</option></select></label>
    <label>Custom<div role="textbox" contenteditable="true">DO-NOT-COLLECT-CONTENTEDITABLE</div><output>DO-NOT-COLLECT-OUTPUT</output></label>
  </form>`, 'https://fixtures.invalid/nested-form');
assert.deepEqual(nestedForm.fieldLabels, ['Essay', 'Choice', 'Custom']);
assert(!JSON.stringify(nestedForm).includes('DO-NOT-COLLECT'));
const editableHeadingForm = readPublicForm(`
  <form><h1 role="textbox" contenteditable="true">DO-NOT-COLLECT-HEADING-RESPONSE</h1>
  <label>Question<input></label></form>`, 'https://fixtures.invalid/editable-heading');
assert.equal(editableHeadingForm.title, 'Public form');
assert(!JSON.stringify(editableHeadingForm).includes('DO-NOT-COLLECT'));
const ancestorHeadingForm = readPublicForm(`
  <form><div role="textbox" contenteditable="true"><h1>DO-NOT-COLLECT-ANCESTOR-RESPONSE</h1></div>
  <label>Question<input></label></form>`, 'https://fixtures.invalid/ancestor-heading');
assert.equal(ancestorHeadingForm.title, 'Public form');
assert(!JSON.stringify(ancestorHeadingForm).includes('DO-NOT-COLLECT'));

const capItems = [
  { key: 'one', url: 'https://fixtures.invalid/1' },
  { key: 'two', url: 'https://fixtures.invalid/2' },
  { key: 'three', url: 'https://fixtures.invalid/3' },
];
const capDirectory = path.join(receiptTestRoot, 'cap-restart');
const capStore = createReceiptStore(capDirectory, receiptTestKey);
const capFirst = await runBoundedQueue(capItems, { cap: 2, maxAttempts: 3, receiptStore: capStore, execute: () => 'success' });
assert.deepEqual({
  denominator: capFirst.denominator,
  processed: capFirst.processedTotal,
  remaining: capFirst.remaining,
  queued: capFirst.queued,
}, { denominator: 3, processed: 2, remaining: 1, queued: 1 });
assert(capFirst.cursor, 'a partial cap requires a resumable cursor');
await assert.rejects(
  runBoundedQueue(capItems, { cap: 2, maxAttempts: 3, cursor: capFirst.cursor, receiptStore: newReceiptStore(), execute: () => 'success' }),
  /absent from the trusted receipt store/,
);
const capFinal = await runBoundedQueue(capItems, {
  cap: 2,
  maxAttempts: 3,
  cursor: capFirst.cursor,
  receiptStore: createReceiptStore(capDirectory, receiptTestKey),
  execute: () => 'success',
});
assert.equal(capFinal.processedTotal, 3);
assert.equal(capFinal.remaining, 0);
assert.equal(capFinal.cursor, null);
assert.equal(capFinal.succeededTotal, 3);
const capRepeat = await runBoundedQueue(capItems, { cap: 2, maxAttempts: 3, receiptStore: newReceiptStore(), execute: () => 'success' });
assert.deepEqual(capRepeat, capFirst, 'same input and receipt start must be idempotent');
const tamperedState = JSON.parse(Buffer.from(capFirst.cursor!, 'base64url').toString('utf8'));
tamperedState.previousReceiptSha256 = 'a'.repeat(64);
const tamperedCursor = Buffer.from(JSON.stringify(tamperedState)).toString('base64url');
await assert.rejects(
  runBoundedQueue(capItems, { cap: 2, maxAttempts: 3, cursor: tamperedCursor, receiptStore: capStore, execute: () => 'success' }),
  /absent from the trusted receipt store/,
);
let forgedStoreExecuted = false;
await assert.rejects(
  runBoundedQueue(capItems, {
    cap: 2,
    maxAttempts: 3,
    cursor: capFirst.cursor,
    receiptStore: { read: () => structuredClone(capFirst) },
    execute: () => {
      forgedStoreExecuted = true;
      return 'success';
    },
  }),
  /must be created by createReceiptStore/,
);
assert.equal(forgedStoreExecuted, false, 'untrusted receipt stores must fail before execution');

const rewriteDirectory = path.join(receiptTestRoot, 'rewrite-attack');
const rewriteStore = createReceiptStore(rewriteDirectory, receiptTestKey);
const rewriteFirst = await runBoundedQueue([
  { key: 'blocked', url: null },
  { key: 'tail', url: null },
], { cap: 1, maxAttempts: 1, receiptStore: rewriteStore, execute: () => 'bot_block' });
const forgedReceipt = structuredClone(rewriteFirst);
forgedReceipt.succeededThisRun = 1;
forgedReceipt.succeededTotal = 1;
forgedReceipt.failedThisRun = 0;
forgedReceipt.failedTotal = 0;
forgedReceipt.succeededKeys = ['blocked'];
forgedReceipt.failedKeys = [];
forgedReceipt.failures = [];
const forgedDigestBody = structuredClone(forgedReceipt) as Partial<typeof forgedReceipt>;
delete forgedDigestBody.receiptSha256;
delete forgedDigestBody.receiptMac;
delete forgedDigestBody.cursor;
forgedReceipt.receiptSha256 = createHash('sha256').update(JSON.stringify(forgedDigestBody)).digest('hex');
const forgedCursorState = JSON.parse(Buffer.from(rewriteFirst.cursor!, 'base64url').toString('utf8'));
forgedCursorState.previousReceiptSha256 = forgedReceipt.receiptSha256;
forgedReceipt.cursor = Buffer.from(JSON.stringify(forgedCursorState)).toString('base64url');
fs.writeFileSync(
  path.join(rewriteDirectory, `${forgedReceipt.receiptSha256}.json`),
  `${JSON.stringify(forgedReceipt, null, 2)}\n`,
  { flag: 'wx' },
);
let rewrittenLedgerExecuted = false;
await assert.rejects(
  runBoundedQueue([
    { key: 'blocked', url: null },
    { key: 'tail', url: null },
  ], {
    cap: 1,
    maxAttempts: 1,
    cursor: forgedReceipt.cursor,
    receiptStore: createReceiptStore(rewriteDirectory, receiptTestKey),
    execute: () => {
      rewrittenLedgerExecuted = true;
      return 'success';
    },
  }),
  /authentication failed/,
);
assert.equal(rewrittenLedgerExecuted, false, 'rewritten receipt history must fail before execution');
await assert.rejects(
  runBoundedQueue(capItems, { cap: 2, maxAttempts: 3, cursor: 'not-a-valid-cursor', receiptStore: capStore, execute: () => 'success' }),
  /Invalid acquisition cursor/,
);
await assert.rejects(
  runBoundedQueue([{ key: 'duplicate', url: null }, { key: 'duplicate', url: null }], { cap: 1, maxAttempts: 1, receiptStore: newReceiptStore(), execute: () => 'success' }),
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
  receiptStore: newReceiptStore(),
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

let thrownAttempts = 0;
const thrown = await runBoundedQueue([{ key: 'thrown-timeout', url: null }], {
  cap: 1,
  maxAttempts: 2,
  receiptStore: newReceiptStore(),
  execute: () => {
    thrownAttempts += 1;
    const error = new Error('request timed out');
    error.name = 'AbortError';
    throw error;
  },
});
assert.equal(thrownAttempts, 2);
assert.deepEqual(thrown.failedKeys, ['thrown-timeout']);
assert.equal(thrown.failures[0].outcome, 'timeout');
assert.match(thrown.failures[0].detail ?? '', /AbortError/);

let totalChildren = 0;
for (const scenario of fixtures.scenarios) {
  const receipts = await runFixtureQueue(scenario);
  const firstGraph = buildFixtureCanonicalGraph(scenario, fixtures.observedAt, receipts);
  const secondGraph = buildFixtureCanonicalGraph(scenario, fixtures.observedAt, receipts);
  const expectedChildren = scenario.workItems
    .filter((item) => receipts.some((receipt) => receipt.succeededKeys.includes(item.key)))
    .flatMap((item) => item.childNames);
  assert.deepEqual(firstGraph, secondGraph, `${scenario.id} canonical output must be deterministic`);
  assert.deepEqual(canonicalRelationshipErrors(firstGraph), [], `${scenario.id} relationships must resolve`);
  assert.equal(firstGraph.scholarships.length, expectedChildren.length, `${scenario.id} successful work must be the child denominator`);
  assert.equal(new Set(firstGraph.scholarships.map((scholarship) => scholarship.id)).size, expectedChildren.length);
  assert(firstGraph.evidence.every((item) => item.result === 'unverified'), 'P3 fixture facts must remain unverified');
  assert(firstGraph.cycles.every((cycle) => cycle.status === 'unknown'), 'P3 must not make P4 cycle decisions');
  assert(firstGraph.reviewItems.every((item) => item.targetStage === 'P4'));
  const final = receipts.at(-1)!;
  assert.equal(final.remaining, 0, `${scenario.id} queue must reach a measured end`);
  assert.equal(final.processedTotal, final.denominator);
  for (const item of scenario.workItems.filter((candidate) => receipts.some((receipt) => receipt.succeededKeys.includes(candidate.key)))) {
    for (const childName of item.childNames) {
      const scholarship = firstGraph.scholarships.find((candidate) => candidate.name === childName)!;
      const source = firstGraph.sources.find((candidate) => candidate.id === scholarship.sourceIds[0])!;
      const expectedUrl = item.url
        ? canonicalizeAcquisitionUrl(item.url).url
        : scenario.sourceUrl
          ? canonicalizeAcquisitionUrl(scenario.sourceUrl).url
          : null;
      assert.equal(source.canonicalUrl, expectedUrl, `${scenario.id}/${item.key} must preserve successful work URL identity`);
    }
  }
  for (const failedKey of receipts.flatMap((receipt) => receipt.failedKeys)) {
    const failureSourceId = stableId('src', ['p3-fixture', scenario.id, 'failed-work', failedKey]);
    const failureSource = firstGraph.sources.find((source) => source.id === failureSourceId);
    assert(failureSource, `${scenario.id} failed work ${failedKey} requires a canonical source receipt`);
    assert(failureSource.reviewItemIds.length > 0, `${scenario.id} failed work ${failedKey} requires a review item`);
    assert(firstGraph.reviewItems.some((item) => item.subjectId === failureSourceId));
  }
  totalChildren += firstGraph.scholarships.length;
}
assert(totalChildren > 0);
const horatio = fixtures.scenarios.find((scenario) => scenario.id === 'horatio-directory-exceptions')!;
const horatioReceipts = await runFixtureQueue(horatio);
assert.equal(buildFixtureCanonicalGraph(horatio, fixtures.observedAt, horatioReceipts).scholarships.length, 2);
const recovery = fixtures.scenarios.find((scenario) => scenario.id === 'bounded-failure-recovery')!;
const recoveryReceipts = await runFixtureQueue(recovery);
assert.equal(buildFixtureCanonicalGraph(recovery, fixtures.observedAt, recoveryReceipts).scholarships.length, 2);
assert(recoveryReceipts.flatMap((receipt) => receipt.failures).some((failure) => failure.key === 'retry-exhausted'));

const generated = await generateP3Evidence();
const committedAcquisition = JSON.parse(fs.readFileSync(path.join(repoRoot, 'docs/evidence/P3-acquisition.json'), 'utf8'));
const committedCompleteness = JSON.parse(fs.readFileSync(path.join(repoRoot, 'docs/evidence/P3-completeness.json'), 'utf8'));
assert.deepEqual(committedAcquisition, generated.acquisition, 'committed acquisition evidence must be deterministic');
assert.deepEqual(committedCompleteness, generated.completeness, 'committed completeness evidence must be deterministic');

fs.rmSync(receiptTestRoot, { recursive: true, force: true });
console.log(`P3 ACQUISITION TEST ALL PASS ${String(generated.acquisition.reportSha256).slice(0, 12)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
