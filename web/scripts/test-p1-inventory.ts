import fs from 'node:fs';
import path from 'node:path';
import { analyzeBoundedCellData, assertCaptureCompleteness, EXPECTED_HEADERS, type CaptureRow } from './p1-capture-lib';
import { ARCHITECTURES, buildInventory, loadP1Inputs, serializeInventory } from './p1-inventory-lib';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const inputs = loadP1Inputs(process.cwd());
const first = serializeInventory(buildInventory(inputs.fixture, inputs.observations));
const second = serializeInventory(buildInventory(inputs.fixture, inputs.observations));
assert(first === second, 'same captured input must produce byte-identical inventory');

const report = JSON.parse(first) as ReturnType<typeof buildInventory>;
assert(report.counts.populatedRecords === 197, 'all 197 populated rows must be present');
assert(report.counts.labels.Scholarship === 176, 'Scholarship label count drifted');
assert(report.counts.labels.Portal === 21, 'Portal label count drifted');
assert(report.counts.labels.other === 0, 'unexpected current label');
assert(report.counts.rowsWithAtLeastOneUrl === 193, 'linked row count drifted');
assert(report.counts.rowsWithNoUrl === 4, 'no-URL row count drifted');
assert(report.counts.distinctUrls === 213, 'distinct URL count drifted');
assert(report.counts.urlOccurrences === 278, 'URL role occurrence count drifted');
assert(report.counts.rowsWithMultipleLinkedSources === 74, 'multi-source row count drifted');
assert(report.counts.hiddenHyperlinkCellsByRole.application === 92, 'hidden application hyperlink count drifted');
assert(report.counts.hiddenHyperlinkCellsByRole.information === 86, 'hidden information hyperlink count drifted');
assert(report.counts.sharedNormalizedUrlGroups === 26, 'shared normalized URL group count drifted');
assert(report.reconciliation.result === 'exact_match', 'planning reconciliation is not exact');
assert(report.records.length === report.counts.populatedRecords, 'record manifest completeness failure');
assert(report.sources.length === report.counts.distinctUrls, 'source manifest completeness failure');

const completeness = inputs.fixture.boundedCompleteness;
assert(completeness.populatedDataRowsAnyCell === 197, 'raw populated-row denominator drifted');
assert(completeness.namedDataRows === 197, 'named-row denominator drifted');
assert(completeness.unnamedNonemptyRows.length === 0, 'nonempty unnamed rows require review');
assert(completeness.hyperlinkRepresentations.totalMetadataRepresentations === 270, 'raw CellData hyperlink denominator drifted');
assert(completeness.hyperlinkRepresentations.retainedSourceColumns === 267, 'retained source-column hyperlink denominator drifted');
assert(completeness.hyperlinkRepresentations.excludedColumns === 3, 'excluded-column hyperlink review denominator drifted');
assert(completeness.excludedColumnHyperlinkReviewItems.length === 3, 'every excluded-column hyperlink representation must be listed');
const retainedMetadataBindings = inputs.fixture.records.flatMap((record) => [
  ...record.information.urls,
  ...record.application.urls,
]).reduce((count, reference) => count + reference.provenance.filter((item) => item.startsWith('cellData.')).length, 0);
assert(retainedMetadataBindings === 267, 'retained CellData hyperlink representations do not bind to captured references');

const taxonomy = new Set<string>(ARCHITECTURES);
for (const record of report.records) assert(taxonomy.has(record.architecture), `row ${record.sheetRow} has invalid architecture`);
for (const source of report.sources) assert(taxonomy.has(source.architecture), `source ${source.sourceIdentity} has invalid architecture`);

const manualSourceUrls = new Set(report.sources.filter((source) => source.reviewState === 'manual_review').map((source) => source.normalizedUrl));
for (const record of report.records) {
  if (record.references.some((reference) => manualSourceUrls.has(reference.urlIdentity))) {
    assert(record.reviewState === 'manual_review', `row ${record.sheetRow} promoted a manual-review source`);
  }
}
for (const observation of inputs.observations.observations.filter((item) => item.reviewState === 'manual_review')) {
  const source = report.sources.find((item) => item.normalizedUrl === observation.url);
  assert(source?.reviewState === 'manual_review', `manual public observation was promoted: ${observation.url}`);
  assert(source?.evidenceBasis.some((basis) => basis.includes('public_source_observation:manual_review')), 'manual observation evidence basis was lost');
}

const headerRow: CaptureRow = { values: EXPECTED_HEADERS.map((formattedValue) => ({ formattedValue })) };
const namedDuplicateRow: CaptureRow = { values: Array.from({ length: 15 }, (_, index) => {
  if (index === 5) return { hyperlink: 'https://example.org/apply', textFormatRuns: [{ format: { link: { uri: 'https://example.org/apply' } } }] };
  if (index === 6) return { formattedValue: 'Synthetic Scholarship' };
  return {};
}) };
const duplicateAnalysis = analyzeBoundedCellData([headerRow, namedDuplicateRow]);
assert(duplicateAnalysis.hyperlinkCounts.totalMetadataRepresentations === 2, 'same-URL hyperlink forms must remain separate in the raw denominator');
assert(duplicateAnalysis.hyperlinkCounts.duplicateSameCellUrlRepresentations === 1, 'duplicate rich-text representation must be explicit');
assertCaptureCompleteness(duplicateAnalysis);

const misplacedHeader = structuredClone(headerRow);
misplacedHeader.values![5] = { formattedValue: 'Wrong Header' };
assert(analyzeBoundedCellData([misplacedHeader]).headerMismatches.length === 1, 'unexpected header position must be detected');
let headerRejected = false;
try { assertCaptureCompleteness(analyzeBoundedCellData([misplacedHeader])); } catch { headerRejected = true; }
assert(headerRejected, 'unexpected header position must fail capture');

const unnamedRow: CaptureRow = { values: Array.from({ length: 15 }, (_, index) => index === 5 ? { hyperlink: 'https://example.org' } : {}) };
let unnamedRejected = false;
try { assertCaptureCompleteness(analyzeBoundedCellData([headerRow, unnamedRow])); } catch { unnamedRejected = true; }
assert(unnamedRejected, 'nonempty unnamed row must fail capture');

const nonHttpRow: CaptureRow = { values: Array.from({ length: 15 }, (_, index) => {
  if (index === 5) return { hyperlink: 'mailto:provider@example.org' };
  if (index === 6) return { formattedValue: 'Synthetic Scholarship' };
  return {};
}) };
let nonHttpRejected = false;
try { assertCaptureCompleteness(analyzeBoundedCellData([headerRow, nonHttpRow])); } catch { nonHttpRejected = true; }
assert(nonHttpRejected, 'non-HTTP CellData hyperlink must fail capture for explicit review');

const committedFixture = fs.readFileSync(path.join(process.cwd(), 'fixtures/p1/master-database-cell-data.json'), 'utf8');
for (const forbidden of ['private_key', 'BEGIN PRIVATE KEY', 'client_email', 'access_token', 'refresh_token', 'Bearer ']) {
  assert(!committedFixture.includes(forbidden), `sanitized fixture contains forbidden secret marker: ${forbidden}`);
}
assert(!committedFixture.includes('ouid='), 'sanitized fixture retained a Google user identifier query parameter');
assert(!committedFixture.includes('_gl='), 'sanitized fixture retained a Google linker tracking parameter');
for (const record of inputs.fixture.records) {
  assert(!Object.prototype.hasOwnProperty.call(record, 'Summary'), `row ${record.sheetRow} retained Summary data`);
  assert(!Object.prototype.hasOwnProperty.call(record, 'summary'), `row ${record.sheetRow} retained summary data`);
}

const committedOutput = fs.readFileSync(path.resolve(process.cwd(), '../docs/evidence/P1-inventory.json'), 'utf8');
assert(committedOutput === first, 'committed P1 inventory is not the deterministic output');

console.log(`P1 INVENTORY TEST ALL PASS ${report.stability.deterministicDigestSha256}`);
