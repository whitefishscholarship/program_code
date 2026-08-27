import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  auditPinnedCellData,
  buildFieldEvidenceReceipt,
  classifyLinkObservation,
  deriveCycleStatus,
  deterministicVerificationSha256,
  evaluateFieldClaims,
  parseTypedDate,
  type FieldClaim,
  type LinkObservation,
} from '../src/lib/verification';
import { generateP4Evidence } from './p4-verification';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(scriptDir, '..');
const p1Fixture = JSON.parse(fs.readFileSync(path.join(webRoot, 'fixtures/p1/master-database-cell-data.json'), 'utf8'));
const p4Fixture = JSON.parse(fs.readFileSync(path.join(webRoot, 'fixtures/p4/verification-scenarios.json'), 'utf8')) as {
  asOf: string;
  defaultTimezone: string;
  linkObservations: LinkObservation[];
  fieldClaims: FieldClaim[];
};

function observation(overrides: Partial<LinkObservation>): LinkObservation {
  return {
    id: 'fixture',
    role: 'application',
    requestedUrl: 'https://provider.invalid/apply',
    finalUrl: 'https://provider.invalid/apply',
    status: 200,
    contentType: 'text/html',
    failureClass: null,
    markers: [],
    retrievedAt: '2026-08-27T17:00:00Z',
    ...overrides,
  };
}

function main(): void {
  const failureCases = [
    ['timeout', { status: null, finalUrl: null, failureClass: 'timeout' }],
    ['dns', { status: null, finalUrl: null, failureClass: 'dns' }],
    ['tls', { status: null, finalUrl: null, failureClass: 'tls' }],
    ['rate-limit', { status: 429 }],
    ['server-error', { status: 503 }],
    ['bot-block', { status: 403, markers: ['bot_block'] }],
    ['login-wall', { status: 200, markers: ['login_wall'] }],
    ['dynamic-shell', { status: 200, markers: ['dynamic_shell'] }],
  ] as const;
  for (const [id, overrides] of failureCases) {
    const result = classifyLinkObservation(observation({ id, ...overrides } as Partial<LinkObservation>));
    assert.equal(result.state, 'inconclusive', `${id} must not become dead or reachable`);
    assert.equal(result.awardClosureSupported, false, `${id} must not support closure`);
    assert.equal(result.linkCorrectionReviewEligible, false, `${id} must not support a link-correction proposal`);
    assert.equal(result.requiresReview, true);
    assert(result.reviewSeverity);
  }
  for (const status of [404, 410]) {
    const result = classifyLinkObservation(observation({ id: `http-${status}`, status }));
    assert.equal(result.state, 'dead');
    assert.equal(result.linkCorrectionReviewEligible, true);
    assert.equal(result.awardClosureSupported, false, 'a dead target is not award-closure evidence');
    assert.equal(result.requiresReview, true);
  }
  const onHost = classifyLinkObservation(observation({ finalUrl: 'https://provider.invalid/new-apply' }));
  assert.equal(onHost.state, 'redirected');
  assert.equal(onHost.redirectKind, 'on_host');
  assert.equal(onHost.requiresReview, false);
  const offHost = classifyLinkObservation(observation({ finalUrl: 'https://vendor.invalid/form', markers: ['application_form'] }));
  assert.equal(offHost.state, 'redirected');
  assert.equal(offHost.redirectKind, 'off_host');
  assert.equal(offHost.targetClass, 'form');
  assert.equal(offHost.requiresReview, true);

  const pinned = auditPinnedCellData(p1Fixture);
  assert.deepEqual({
    links: pinned.hyperlinkDenominator,
    retained: pinned.retainedHyperlinks,
    excluded: pinned.excludedHyperlinks,
    information: pinned.informationHyperlinks,
    application: pinned.applicationHyperlinks,
    hiddenInformation: pinned.hiddenInformationHyperlinks,
    hiddenApplication: pinned.hiddenApplicationHyperlinks,
    offline: pinned.offlineMethodDenominator,
    outcomes: pinned.outcomeDenominator,
  }, {
    links: 270,
    retained: 267,
    excluded: 3,
    information: 86,
    application: 181,
    hiddenInformation: 86,
    hiddenApplication: 92,
    offline: 4,
    outcomes: 274,
  });
  assert.equal(new Set(pinned.outcomes.map((item) => item.id)).size, 274, 'CellData representations and offline methods must not be deduplicated');
  assert.equal(pinned.outcomes.filter((item) => item.role === 'offline' && item.state === 'offline').length, 4);
  assert.equal(pinned.outcomes.filter((item) => item.role === 'application' && item.hiddenBehindLabel).length, 92, 'Every hidden application hyperlink must be audited');
  assert.equal(pinned.outcomes.filter((item) => item.role === 'information' && item.hiddenBehindLabel).length, 86);
  const missingExcluded = structuredClone(p1Fixture);
  missingExcluded.boundedCompleteness.excludedColumnHyperlinkReviewItems.pop();
  assert.throws(() => auditPinnedCellData(missingExcluded), /Total CellData denominator mismatch/, 'Dropping an excluded CellData representation must fail closed');
  const missingRetained = structuredClone(p1Fixture);
  missingRetained.records[0].application.urls = [];
  assert.throws(() => auditPinnedCellData(missingRetained), /denominator mismatch/i, 'Dropping a retained hidden hyperlink must fail closed');

  const exact = parseTypedDate({ raw: '2026-09-30T23:00:00-06:00', timezone: 'America/Denver' });
  assert.deepEqual({ state: exact.parseState, precision: exact.precision, value: exact.closesAt, timezone: exact.timezone }, {
    state: 'parsed', precision: 'exact_datetime', value: '2026-09-30T23:00:00-06:00', timezone: 'America/Denver',
  });
  const serial = parseTypedDate({ raw: 46310, timezone: 'America/Denver' });
  assert.equal(serial.closesAt, '2026-10-15');
  assert.equal(serial.precision, 'date_only');
  const range = parseTypedDate({ raw: '2026-12-15 - 2027-01-15', timezone: 'America/Denver' });
  assert.equal(range.opensAt, '2026-12-15');
  assert.equal(range.closesAt, '2027-01-15');
  assert.equal(range.year, 2027);
  assert.equal(deriveCycleStatus(range, p4Fixture.asOf, { availabilityConfirmed: true, unavailable: false, defaultTimezone: p4Fixture.defaultTimezone }), 'upcoming');
  const annual = parseTypedDate({ raw: 'Annual — May 31', timezone: 'America/Denver' });
  assert.equal(annual.precision, 'annual_rule');
  assert.equal(annual.year, null);
  assert.equal(annual.recurrence, 'annual');
  assert.equal(deriveCycleStatus(annual, p4Fixture.asOf, { availabilityConfirmed: true, unavailable: false, defaultTimezone: p4Fixture.defaultTimezone }), 'unknown');
  assert.equal(parseTypedDate({ raw: 'October 2026' }).precision, 'month_only');
  assert.equal(parseTypedDate({ raw: 'mid March 2027' }).precision, 'approximate');
  assert.equal(parseTypedDate({ raw: 'Rolling deadline' }).recurrence, 'rolling');
  const mixedRange = parseTypedDate({ raw: '12/1 (opens) - 3/1 (closes)', timezone: 'America/Denver' });
  assert.deepEqual({ opensAt: mixedRange.opensAt, closesAt: mixedRange.closesAt, precision: mixedRange.precision, recurrence: mixedRange.recurrence }, {
    opensAt: '12-01', closesAt: '03-01', precision: 'annual_rule', recurrence: 'annual',
  });
  const labeledRange = parseTypedDate({ raw: '(opens 03/15/26) closes 6/15/26', timezone: 'America/Denver' });
  assert.deepEqual({ opensAt: labeledRange.opensAt, closesAt: labeledRange.closesAt, year: labeledRange.year }, {
    opensAt: '2026-03-15', closesAt: '2026-06-15', year: 2026,
  });
  const openOnly = parseTypedDate({ raw: 'Opens 12/15', timezone: 'America/Denver' });
  assert.equal(openOnly.opensAt, '12-15');
  assert.equal(openOnly.closesAt, null, 'an open-only value must not be relabeled as a deadline');
  const invalids = [
    parseTypedDate({ raw: 'February 30, 2027' }),
    parseTypedDate({ raw: '13/40/2027' }),
    parseTypedDate({ raw: -1 }),
  ];
  for (const parsed of invalids) {
    assert.equal(parsed.parseState, 'invalid');
    assert.equal(deriveCycleStatus(parsed, p4Fixture.asOf, { availabilityConfirmed: true, unavailable: false, defaultTimezone: p4Fixture.defaultTimezone }), 'unknown', 'parse failure may not produce a current cycle');
  }
  const unknown = parseTypedDate({ raw: 'TBD' });
  assert.equal(unknown.parseState, 'unknown');
  assert.equal(deriveCycleStatus(unknown, p4Fixture.asOf, { availabilityConfirmed: true, unavailable: false, defaultTimezone: p4Fixture.defaultTimezone }), 'unknown');
  const active = parseTypedDate({ raw: '2026-08-01 - 2026-09-30', timezone: 'America/Denver' });
  assert.equal(deriveCycleStatus(active, p4Fixture.asOf, { availabilityConfirmed: true, unavailable: false, defaultTimezone: p4Fixture.defaultTimezone }), 'active');
  assert.equal(deriveCycleStatus(active, p4Fixture.asOf, { availabilityConfirmed: false, unavailable: false, defaultTimezone: p4Fixture.defaultTimezone }), 'unknown');
  assert.equal(deriveCycleStatus(active, p4Fixture.asOf, { availabilityConfirmed: true, unavailable: true, defaultTimezone: p4Fixture.defaultTimezone }), 'unavailable');

  const field = evaluateFieldClaims(p4Fixture.fieldClaims, p4Fixture.asOf);
  assert.equal(field.receipts.length, p4Fixture.fieldClaims.length);
  assert.equal(new Set(field.receipts.map((item) => item.id)).size, field.receipts.length);
  const accepted = field.decisions.filter((item) => item.accepted);
  assert(accepted.length > 0);
  for (const decision of accepted) {
    assert.equal(decision.conflict, false);
    assert(field.receipts.filter((item) => decision.evidenceIds.includes(item.id)).some((item) => item.currentDirectOfficial));
  }
  const parentChild = field.decisions.find((item) => item.subjectId === 'sch_parent_child_conflict')!;
  assert.equal(parentChild.conflict, true);
  assert.equal(parentChild.preferredValue, '2027-01-15', 'child-specific current official evidence must outrank an indirect parent summary');
  assert.equal(parentChild.accepted, false, 'every conflict must remain reviewable even with a preferred source');
  const stalePdf = field.decisions.find((item) => item.subjectId === 'sch_stale_pdf')!;
  assert.equal(stalePdf.preferredValue, '2027-03-01', 'current official parent must outrank a stale direct PDF');
  assert.equal(stalePdf.accepted, false);
  const aggregator = field.decisions.find((item) => item.subjectId === 'sch_aggregator_provider')!;
  assert.equal(aggregator.preferredValue, '$2,500');
  assert.equal(aggregator.accepted, false, 'aggregator/provider disagreement requires review');
  const aggregatorOnly = field.decisions.find((item) => item.subjectId === 'sch_aggregator_only')!;
  assert.equal(aggregatorOnly.accepted, false, 'aggregator-only evidence may not support acceptance');
  const staleOnly = field.decisions.find((item) => item.subjectId === 'sch_stale_only')!;
  assert.equal(staleOnly.accepted, false, 'stale official evidence may not support acceptance');
  const futureReceipt = buildFieldEvidenceReceipt({
    id: 'future', subjectId: 'sch_future', field: 'deadline', value: '2028-01-01',
    sourceUrl: 'https://provider.invalid/future', authority: 'official_provider', direct: true,
    retrievedAt: '2026-09-01T00:00:00Z', sourceUpdatedAt: null, sourceRevision: null,
  }, p4Fixture.asOf);
  assert.equal(futureReceipt.fresh, false, 'future-dated retrieval evidence must fail freshness');
  assert.equal(futureReceipt.currentDirectOfficial, false);

  const generatedOne = generateP4Evidence();
  const generatedTwo = generateP4Evidence();
  assert.deepEqual(generatedOne, generatedTwo, 'P4 generation must be deterministic and idempotent');
  const links = generatedOne.links as {
    pinnedCellDataAudit: typeof pinned;
    destructiveDecisionBoundary: { awardClosureSupportedCount: number; correctionReviewEligibleCount: number };
    reportSha256: string;
  };
  assert.equal(links.pinnedCellDataAudit.hyperlinkDenominator, 270);
  assert.equal(links.destructiveDecisionBoundary.awardClosureSupportedCount, 0);
  assert.equal(links.destructiveDecisionBoundary.correctionReviewEligibleCount, 2);
  const cycles = generatedOne.cycles as { falseCurrentBoundary: { parseFailureCurrentCount: number }; reportSha256: string };
  assert.equal(cycles.falseCurrentBoundary.parseFailureCurrentCount, 0);
  const conflicts = generatedOne.conflicts as { conflictDenominator: number; acceptedConflictCount: number };
  assert(conflicts.conflictDenominator >= 4);
  assert.equal(conflicts.acceptedConflictCount, 0);
  const reviews = generatedOne.reviews as { reviewDenominator: number; correctionEligibleCount: number; reviews: Array<{ severity: string }> };
  assert(reviews.reviewDenominator > 270);
  assert.equal(reviews.correctionEligibleCount, 0);
  assert(reviews.reviews.every((item) => ['critical', 'high', 'medium', 'low'].includes(item.severity)));
  const serialized = JSON.stringify(generatedOne);
  for (const forbidden of ['applicant@example', 'private response', 'GOOGLE_SERVICE_ACCOUNT_CREDENTIALS', 'BEGIN PRIVATE KEY']) {
    assert(!serialized.includes(forbidden), `P4 deterministic evidence must exclude ${forbidden}`);
  }
  for (const report of Object.values(generatedOne) as Array<Record<string, unknown>>) {
    const { reportSha256, ...body } = report;
    assert.equal(reportSha256, deterministicVerificationSha256(body), 'Report digest must bind the complete deterministic body');
  }

  console.log(`P4 VERIFICATION TEST ALL PASS links=${pinned.hyperlinkDenominator} hiddenApp=${pinned.hiddenApplicationHyperlinks} fields=${field.decisions.length} digest=${links.reportSha256.slice(0, 12)}`);
}

main();
