import fs from 'node:fs';
import path from 'node:path';
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

const taxonomy = new Set<string>(ARCHITECTURES);
for (const record of report.records) assert(taxonomy.has(record.architecture), `row ${record.sheetRow} has invalid architecture`);
for (const source of report.sources) assert(taxonomy.has(source.architecture), `source ${source.sourceIdentity} has invalid architecture`);

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
