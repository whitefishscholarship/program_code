import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildQueueReport, buildSourceQueue, retrievalDisposition } from './p5-remediation';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const snapshot = JSON.parse(
  fs.readFileSync(path.join(repoRoot, 'web/fixtures/p5/prewrite-master-database.json'), 'utf8'),
);

const entries = buildSourceQueue(snapshot);
const report = buildQueueReport(snapshot, entries);
assert.equal(report.recordDenominator, 197);
assert.equal(report.sourceDenominator, 213);
assert.equal(new Set(entries.map((entry) => entry.sourceId)).size, 213);
assert.equal(new Set(entries.map((entry) => entry.url)).size, 213);
assert.equal(entries.every((entry) => entry.sheetRows.length > 0), true);
assert.equal(entries.every((entry) => entry.sheetRows.every((row) => snapshot.records.some((record: { sheetRow: number }) => record.sheetRow === row))), true);
assert.equal(entries.some((entry) => entry.retrievalDisposition === 'manual_review_no_fetch'), true);
assert.equal(entries.some((entry) => entry.retrievalDisposition === 'public_read_only_scrape'), true);

const googleForm = {
  url: 'https://docs.google.com/forms/d/example/viewform',
  host: 'docs.google.com',
  roles: new Set(['application'] as const),
  sheetRows: new Set([2]),
  provenance: new Set(['cellData.hyperlink']),
};
assert.equal(retrievalDisposition(googleForm).retrievalDisposition, 'manual_review_no_fetch');

const googleDocument = {
  ...googleForm,
  url: 'https://docs.google.com/document/d/example/edit',
};
assert.equal(retrievalDisposition(googleDocument).retrievalDisposition, 'manual_review_no_fetch');

const applicationLanding = {
  ...googleForm,
  url: 'https://provider.example/scholarships/current',
  host: 'provider.example',
};
assert.equal(retrievalDisposition(applicationLanding).retrievalDisposition, 'manual_review_no_fetch');

const officialInfo = {
  url: 'https://provider.example/scholarships/current',
  host: 'provider.example',
  roles: new Set(['information'] as const),
  sheetRows: new Set([2]),
  provenance: new Set(['cellData.hyperlink']),
};
assert.equal(retrievalDisposition(officialInfo).retrievalDisposition, 'public_read_only_scrape');

const dualRoleSource = {
  ...officialInfo,
  roles: new Set(['information', 'application'] as const),
};
assert.equal(retrievalDisposition(dualRoleSource).retrievalDisposition, 'manual_review_no_fetch');

for (const url of [
  'https://forms.office.com/pages/responsepage.aspx?id=example',
  'https://webportalapp.com/sp/login_saml/example',
  'https://fvcc.awardspring.com/',
  'https://provider.example/applications',
  'https://provider.example/ninja-forms/example',
]) {
  const parsed = new URL(url);
  assert.equal(retrievalDisposition({ ...officialInfo, url, host: parsed.hostname }).retrievalDisposition, 'manual_review_no_fetch');
}

const serialized = JSON.stringify(report);
assert.equal(/[?&](?:utm_[^=&]+|gclid|fbclid|ouid|rtpof|usp|sd)=/i.test(serialized), false);
assert.equal(/BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY/.test(serialized), false);
console.log('P5 REMEDIATION TEST PASS records=197 sources=213 form/login boundary enforced');
