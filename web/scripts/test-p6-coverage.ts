import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { CanonicalDatasetSchema, ScholarshipSchema, canonicalRelationshipErrors } from '../src/lib/canonicalModel';

const root = path.resolve(process.cwd(), '..');
const read = (name: string) => JSON.parse(readFileSync(path.join(root, 'docs', 'evidence', name), 'utf8'));

const queue = read('P6-source-queue.json');
const completeness = read('P6-portal-completeness.json');
const children = read('P6-child-records.json');
const exclusions = read('P6-exclusions.json');
const collisions = read('P6-collisions.json');
const metrics = read('P6-metrics.json');
const fixture = JSON.parse(readFileSync(path.join(root, 'web', 'fixtures', 'p6', 'live-source-snapshots.json'), 'utf8'));
const captureSource = readFileSync(path.join(root, 'web', 'scripts', 'p6-capture-live.ts'), 'utf8');

assert.equal(queue.inputDenominator.portalLabeledRows, 21);
assert.equal(queue.inputDenominator.selectedRows + queue.inputDenominator.notSelectedRows, 21);
assert.equal(queue.queue.length, 5);
assert.equal(new Set(queue.queue.map((item: any) => item.queueId)).size, 5);

assert.deepEqual(completeness.reconciliation, {
  queueItems: 5,
  completed: 3,
  excludedWithEvidence: 0,
  blockedExternal: 2,
  resumablyIncomplete: 0,
  unaccounted: 0,
});
assert.equal(completeness.outcomes.length, 5);
assert.equal(new Set(completeness.outcomes.map((item: any) => item.queueId)).size, 5);
assert.equal(completeness.outcomes.find((item: any) => item.queueId === 'p6-fvcc-academicworks').currentDiscoveredAwards, 169);
assert.equal(completeness.outcomes.find((item: any) => item.queueId === 'p6-fvcc-academicworks').cursor.firstEmptyPageCount, 0);
for (const item of completeness.outcomes) {
  assert.equal(item.applicationRouteVisited, false);
  assert.ok(['completed', 'excluded-with-evidence', 'blocked-external', 'resumably-incomplete'].includes(item.outcome));
  if (item.outcome === 'resumably-incomplete') {
    assert.equal(typeof item.remainingCount, 'number');
    assert.ok(item.cursor);
  }
}

const parsed = CanonicalDatasetSchema.parse(children);
assert.deepEqual(canonicalRelationshipErrors(parsed), []);
assert.equal(children.pinnedInput.spreadsheetRevisionId, '223');
assert.equal(children.scholarships.length, 16);
assert.equal(children.applicationGroups.length, 1);
assert.equal(children.cycles.length, 16);
assert.equal(children.cycles.filter((item: any) => item.status === 'active').length, 0);
assert.equal(children.cycles.filter((item: any) => item.status === 'closed').length, 0);
assert.equal(children.cycles.filter((item: any) => item.status === 'unknown').length, 16);
assert.ok(children.cycles.every((item: any) => item.year === null && item.cycleKey === 'annual-unknown'));
assert.ok(children.cycles.every((item: any) => item.opensAt.precision === 'annual_rule' && item.closesAt.precision === 'annual_rule'));
assert.ok(children.scholarships.every((item: any) => item.lifecycleState === 'modeled' && item.legacyRowIdentities.length === 0));
const legacyImportedWithoutRow = { ...children.scholarships[0], lifecycleState: 'legacy_imported', legacyRowIdentities: [] };
assert.equal(ScholarshipSchema.safeParse(legacyImportedWithoutRow).success, false);
assert.ok(children.scholarships.every((item: any) => item.sourceLinks.some((link: any) => link.role === 'application')));
assert.ok(children.scholarships.every((item: any) => item.sourceLinks.some((link: any) => link.role === 'parent')));
const evidenceById = new Map(children.evidence.map((item: any) => [item.id, item]));
const authorityEvidence = children.evidence.filter((item: any) => item.fieldPath === 'authority');
assert.equal(authorityEvidence.length, 6);
assert.ok(children.sources.every((source: any) => authorityEvidence.some((item: any) =>
  item.subjectId === source.id && item.sourceId === source.id && item.claim === `authority=${source.authority}`
  && source.evidenceIds.includes(item.id))));
assert.ok(children.scholarships.every((scholarship: any) => scholarship.sourceLinks.every((link: any) =>
  link.provenance.length === 1
  && evidenceById.has(link.provenance[0])
  && (evidenceById.get(link.provenance[0]) as any).subjectId === scholarship.id
  && (evidenceById.get(link.provenance[0]) as any).sourceId === link.sourceId
  && (evidenceById.get(link.provenance[0]) as any).fieldPath.startsWith(`sourceLinks.${link.sourceId}.`))));
assert.ok(children.scholarships.every((scholarship: any) => scholarship.studentFields.eligibility.location.state === 'known'
  && scholarship.studentFields.eligibility.location.raw.includes('Scholarships for Montana Students')
  && scholarship.evidenceIds.some((id: string) => (evidenceById.get(id) as any)?.fieldPath === 'studentFields.eligibility.location')));
assert.equal(children.sources.find((item: any) => item.canonicalUrl.includes('reachhighermontana.org/pay-for-school/scholarships')).legacySourceIdentity,
  '6dec62a8b9aa539bf8777019e7f36f9a391d9cad6ce090450263eb505cbaf4b8');
assert.equal(children.sources.find((item: any) => item.canonicalUrl === fixture.reachHigherMontana.applicationRouteUrl).legacySourceIdentity,
  '730c6a5451d8657bb7bb8b4678ce9464041b345e5f95e89cb940c0efb4c47446');
assert.equal(children.sources.find((item: any) => item.canonicalUrl.includes('nfu.org/') && item.canonicalUrl.endsWith('/scholarships/')).legacySourceIdentity,
  'e74fed4e5ae13df216584e44d8606d79c4a67400c7dd376851124a3d8d20fd11');
assert.deepEqual(new Set(children.sources.map((item: any) => item.legacySourceIdentity)), new Set([
  '5c89a7c7b0db86ffc9019872310f38223c54610429f76b346a34fa27c2ec3913',
  '6a76a1c0215f25a48dbbbef118e3fced93e290469ed8bfa188c6bae4cb7b165f',
  '6dec62a8b9aa539bf8777019e7f36f9a391d9cad6ce090450263eb505cbaf4b8',
  '730c6a5451d8657bb7bb8b4678ce9464041b345e5f95e89cb940c0efb4c47446',
  '7780e231a2d92edd4671fe1cbab026c8a55810ee1453066b7dc042d9e21b91b2',
  'e74fed4e5ae13df216584e44d8606d79c4a67400c7dd376851124a3d8d20fd11',
]));
assert.deepEqual(children.legacyBindings.map((item: any) => item.sheetRow).sort((a: number, b: number) => a - b), [17, 31, 45, 55, 79, 83, 187]);
assert.ok(children.legacyBindings.every((item: any) => item.currentLabel === 'Portal' && item.targetKind === 'source_record'));
assert.ok(children.legacyBindings.every((item: any) => item.targetIds.length > 0));
assert.ok(children.legacyBindings.every((item: any) => item.targetIds.every((id: string) => children.sources.some((source: any) => source.id === id))));
assert.ok(children.scholarships.every((item: any) => !/National Farmers Union|Stanley Moore|Seymour|MANRRS/i.test(item.name)));
assert.ok(children.scholarships.every((item: any) => item.name !== 'Montana FFA Leave a Legacy Scholarship'));
assert.equal(fixture.reachHigherMontana.applicationRouteUrl, 'https://www.grantinterface.com/Home/Logon?urlkey=SAF');
assert.match(fixture.reachHigherMontana.applicationEvidence.cycleText, /Opens Jan\. 1, closes Mar\. 1/);
assert.match(fixture.reachHigherMontana.applicationEvidence.supplementalText, /supplemental questions/);
assert.deepEqual(fixture.nationalFarmersUnion.applicationEvidence.linkedRouteUrls, []);
assert.equal(fixture.nationalFarmersUnion.applicationRouteStatus, 'described_without_current_link');
const reachApplicationSource = children.sources.find((item: any) => item.canonicalUrl === fixture.reachHigherMontana.applicationRouteUrl);
assert.ok(reachApplicationSource);
assert.ok(children.evidence.some((item: any) => item.sourceId === reachApplicationSource.id
  && item.contentSha256 === fixture.reachHigherMontana.applicationEvidence.contentSha256));
assert.ok(children.applicationGroups.every((item: any) => item.sourceIds.includes(reachApplicationSource.id)));
const refreshedReachEvidence = children.evidence.filter((item: any) =>
  item.contentSha256 === fixture.reachHigherMontana.applicationEvidence.contentSha256);
assert.equal(refreshedReachEvidence.length, 18);
assert.ok(refreshedReachEvidence.every((item: any) => item.retrievedAt === fixture.reachHigherMontana.applicationEvidenceCapturedAt));
assert.ok(refreshedReachEvidence.some((item: any) => item.claim.includes(fixture.reachHigherMontana.applicationRouteUrl)));

assert.equal(exclusions.reachHigherMontana.length, 14);
assert.equal(exclusions.nationalFarmersUnion.length, 3);
assert.ok(exclusions.nationalFarmersUnion.every((item: any) => item.evidence.linkedRouteUrls.length === 0));
assert.equal(exclusions.fvccAcademicWorks.length, 169);
assert.ok(exclusions.fvccAcademicWorks.every((item: any) => item.currentCatalogStatus === 'Ended'));
assert.equal(exclusions.sourceBlocks.length, 2);
assert.equal(collisions.acceptedChildExactBaselineScholarshipCollisions, 0);
assert.deepEqual(collisions.nearNameCollisionCandidates.map((item: any) => [item.discoveredName, item.baselineSheetRow]), [
  ['Flathead Electric Coop. Early Childhood Education Scholarship', 44],
  ['Montana FFA Leave a Legacy Scholarship', 170],
]);
assert.deepEqual(collisions.reviewedIdentityCollisions.map((item: any) => [item.discoveredName, item.baselineSheetRow, item.disposition]), [
  ['Flathead Electric Coop. Early Childhood Education Scholarship', 44, 'same_award_excluded_currently_ended'],
  ['Montana FFA Leave a Legacy Scholarship', 170, 'same_award_excluded'],
]);
assert.equal(collisions.nearNameCollisionCandidates.length, collisions.reviewedIdentityCollisions.length);
assert.equal(collisions.parentChildBindings[0].childCount, 16);

assert.equal(metrics.awards.exactlyDiscoveredOnCompletedSources, 202);
assert.equal(metrics.awards.acceptedChildRecords, 16);
assert.equal(metrics.awards.excludedChildRecords, 186);
assert.equal(metrics.cycles.acceptedActive, 0);
assert.equal(metrics.cycles.acceptedClosed, 0);
assert.equal(metrics.cycles.acceptedUnknown, 16);
assert.equal(metrics.recipientSlots.observedMinimumAcrossAcceptedChildrenWithUnknownCycles, 71);
assert.equal(metrics.recipientSlots.awardsWithUnknownSlotCount, 2);
assert.equal(metrics.exactNetChangeInActiveEligibleAwards, 0);

assert.match(fixture.reachHigherMontana.authorityEvidenceReceipt.scrapeId,
  /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i);
assert.equal(fixture.reachHigherMontana.authorityEvidenceReceipt.siteName, 'Reach Higher Montana');
assert.equal(fixture.reachHigherMontana.audienceEvidence.heading, '## Scholarships for Montana Students');
assert.doesNotMatch(captureSource, /const scrapeIds/);
assert.match(captureSource, /parsed\.metadata\.scrapeId/);
assert.match(captureSource, /const capturedAt = new Date\(\)\.toISOString\(\)/);

const serialized = JSON.stringify({ queue, completeness, children, exclusions, collisions, metrics });
assert.doesNotMatch(serialized, /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
assert.doesNotMatch(serialized, /(?:access|refresh)[_-]?token|client[_ -]?secret|private key/i);

console.log('P6 COVERAGE TEST PASS queue=5 completed=3 blocked=2 discovered=202 accepted=16 active=0 unknown=16 exclusions=186 slotsObservedMin=71 legacyBindings=7 authority=6 nearNameReviews=2');
