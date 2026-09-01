import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertP5StageLifecycle, buildQueueReport, buildSourceQueue, retrievalDisposition, type P5LifecycleState } from './p5-remediation';

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

const stageIds = ['P0', 'P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8', 'P8R', 'P9'];
const lifecycle = (
  acceptedCount: number,
  inFlightStatus: P5LifecycleState['stages'][number]['status'] | null,
): P5LifecycleState => ({
  activeStageId: inFlightStatus === null ? null : stageIds[acceptedCount],
  nextPermittedStageId: inFlightStatus === null && acceptedCount < stageIds.length ? stageIds[acceptedCount] : null,
  stages: stageIds.map((id, index) => ({
    id,
    status: index < acceptedCount ? 'accepted'
      : index === acceptedCount && inFlightStatus !== null ? inFlightStatus
        : 'planned',
  })),
});

for (const status of ['active', 'implemented', 'verified', 'blocked-external', 'failed'] as const) {
  assert.doesNotThrow(() => assertP5StageLifecycle(lifecycle(5, status)));
  assert.doesNotThrow(() => assertP5StageLifecycle(lifecycle(6, status)));
}
assert.doesNotThrow(() => assertP5StageLifecycle(lifecycle(6, null)));
assert.doesNotThrow(() => assertP5StageLifecycle(lifecycle(7, null)));
assert.doesNotThrow(() => assertP5StageLifecycle(lifecycle(9, 'verified')));
assert.doesNotThrow(() => assertP5StageLifecycle(lifecycle(10, 'verified')));

const p5Planned = lifecycle(5, null);
assert.throws(() => assertP5StageLifecycle(p5Planned));
const acceptedGap = lifecycle(6, null);
acceptedGap.stages[4].status = 'planned';
assert.throws(() => assertP5StageLifecycle(acceptedGap));
const multipleInFlight = lifecycle(5, 'active');
multipleInFlight.stages[6].status = 'verified';
assert.throws(() => assertP5StageLifecycle(multipleInFlight));
const mismatchedActive = lifecycle(6, 'implemented');
mismatchedActive.activeStageId = 'P7';
assert.throws(() => assertP5StageLifecycle(mismatchedActive));
const wrongNext = lifecycle(7, null);
wrongNext.nextPermittedStageId = 'P9';
assert.throws(() => assertP5StageLifecycle(wrongNext));
const reordered = lifecycle(6, null);
[reordered.stages[6], reordered.stages[7]] = [reordered.stages[7], reordered.stages[6]];
assert.throws(() => assertP5StageLifecycle(reordered));

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
