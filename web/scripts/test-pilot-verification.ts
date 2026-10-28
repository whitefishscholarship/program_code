import assert from 'node:assert/strict';
import { R3_CATALOG } from '../src/lib/r3Catalog';
import { displayVerification, openStatusText } from '../src/lib/studentCatalog';
import { InterviewAnswersSchema } from '../src/lib/interviewMatcher';
import { shortlistAwards } from '../src/lib/spreadsheetShortlist';
import { serializeAwardCsv } from '../src/lib/export';

const AOPA_ID = 'award-d8ff6ef257b3';
const verifiedIds = [
  AOPA_ID,
  'award-2179b44d009d',
  'award-26c4b3c65985',
  'award-a2f7b9b6cbec',
  'award-cd0fb7cd0c64',
  'award-52b096183d9d',
  'award-97dfaadd1d31',
];
const uncheckedIds = ['award-577dacb8c225', 'award-ce44143820a7'];

const byId = new Map(R3_CATALOG.awards.map((award) => [award.publicId, award]));
assert.equal(R3_CATALOG.awards.filter((award) => award.verification?.status === 'verified').length, verifiedIds.length);
for (const id of verifiedIds) assert.equal(byId.get(id)?.verification?.status, 'verified', id);
for (const id of uncheckedIds) assert.equal(byId.get(id)?.verification, undefined, id);
assert.equal(R3_CATALOG.awards.filter((award) => displayVerification(award).status === 'not_yet_checked').length, 411 - verifiedIds.length);

const counted = { active: 0, upcoming: 0, closed: 0, unavailable: 0, unknown: 0 };
for (const award of R3_CATALOG.awards) counted[award.cycle.status] += 1;
assert.equal(counted.active, R3_CATALOG.counts.activeCycles);
assert.equal(counted.upcoming, R3_CATALOG.counts.upcomingCycles);
assert.equal(counted.closed, R3_CATALOG.counts.closedCycles);
assert.equal(counted.unknown, R3_CATALOG.counts.unknownCycles);

const aopa = byId.get(AOPA_ID)!;
assert.equal(aopa.name, 'AOPA Foundation You Can Fly High School Flight Training Scholarship');
assert.equal(aopa.verification?.lastChecked, '2026-10-27');
assert.equal(aopa.verification?.sourceUrl, 'https://www.aopa.org/training-and-safety/students/aopa-flight-training-scholarships');
assert.equal(aopa.verification?.openStatus, 'open_now');
assert.match(aopa.verification?.deadline ?? '', /December 31, 2026/);
assert.equal(aopa.cycle.status, 'active');
assert.match(aopa.amount.label, /90 awards of \$12,000/);
assert.match(aopa.summary ?? '', /free AOPA high school membership/);
assert.match(aopa.summary ?? '', /Ages 16 to 18/);
assert.equal(openStatusText(aopa), 'Open now. Deadline December 31, 2026, 11:59 PM ET.');

const seniorPilot = InterviewAnswersSchema.parse({
  gpa: 3.4,
  residenceState: 'MT',
  educationalStatus: 'high_school_senior',
  targetSchoolTypes: ['four_year'],
  selectedCriteria: ['aviation_pilot'],
});
const journey = shortlistAwards(R3_CATALOG.awards, seniorPilot);
const aopaResult = journey.results.find((result) => result.award.publicId === AOPA_ID);
assert.ok(aopaResult, 'AOPA is on the shortlist');
assert.notEqual(aopaResult.decision, 'recorded_mismatch');
assert.equal(aopaResult.relevant, true);
assert.match(aopaResult.reasons.map((reason) => reason.message).join('\n'), /AOPA Foundation You Can Fly High School Flight Training Scholarship/);
assert.equal(displayVerification(aopaResult.award).status, 'verified');

const barnes = journey.results.find((result) => result.award.publicId === 'award-ce44143820a7');
assert.equal(displayVerification(barnes!.award).status, 'not_yet_checked');

const csv = serializeAwardCsv([aopaResult.award, barnes!.award]);
assert.match(csv, /Verified/);
assert.match(csv, /Not yet checked/);
assert.match(csv, /2026-10-27/);
assert.match(csv, /https:\/\/www\.aopa\.org\/training-and-safety\/students\/aopa-flight-training-scholarships/);

console.log('PILOT VERIFICATION PASS', JSON.stringify({
  verified: verifiedIds.length,
  unchecked: 411 - verifiedIds.length,
  aopaDecision: aopaResult.decision,
  aopaRelevant: aopaResult.relevant,
}));
