import assert from 'node:assert/strict';
import { R3_CATALOG } from '../src/lib/r3Catalog';
import { displayMatchReason, displayVerification, openStatusText } from '../src/lib/studentCatalog';
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
  'award-fa027b498c44',
  'award-1e5f468f541c',
  'award-04b4c1f204d1',
  'award-78528c7a2312',
  'award-bb8ca59a7f0f',
  'award-c32eca2c949c',
  'award-b0e6889263b0',
  'award-57c071d7e024',
  'award-69a595e31c6a',
  'award-a1106312a9de',
  'award-8daa0f30de62',
  'award-474d85f3af23',
  'award-29814362e16a',
  'award-7480af6a3f3d',
  'award-97aa9bb0adf8',
  'award-e9294fad82db',
  'award-eb52009c1f31',
  'award-3de0c3240164',
  'award-8ea19bf3c906',
  'award-b1419d834350',
  'award-63f87645e19d',
  'award-1c71b2ea40bd',
  'award-11631fa03190',
  'award-077975690fea',
  'award-d81c0b25b5de',
  'award-a02e4b043558',
  'award-6c3df1c9b693',
  'award-16f035949c5e',
  'award-1f64dfaa7bf7',
  'award-9635e0eb7f5e',
  'award-512cf202b205',
  'award-f910f9badd6e',
  'award-40f544a79f9d',
  'award-fa030a261f40',
  'award-4d77d6910970',
  'award-c7fa5bcb0cda',
  'award-e34d317f0f51',
  'award-838198d95997',
  'award-0a1f1d1b8505',
  'award-01f442f53c03',
  'award-810497f483c1',
  'award-79b477a8cbf5',
  'award-d06d7c7342e2',
  'award-5be8186316cf',
  'award-1b7e12cc1279',
  'award-d21bc9824cca',
  'award-1b50b8ba8dc7',
  'award-025b82622063',
  'award-555518400a06',
  'award-d0abc8910545',
  'award-84615bac9529',
  'award-4cdd1ce9e18c',
  'award-00c8fd2e3b19',
  'award-67869a40834d',
  'award-e6d33b3f2691',
  'award-25d250ec58c6',
  'award-6f66c4a77103',
  'award-5a085314245e',
  'award-82867636c6e1',
  'award-59d82b621dea',
  'award-15228c015499',
  'award-22920b157d01',
  'award-145de4f3884e',
  'award-74e0f7fdd4c5',
  'award-a9c6e0fcc5af',
  'award-cc404ac65f10',
  'award-9185ae8439e3',
  'award-dafc0ee48bd2',
  'award-4343de48868d',
  'award-f52f9786a495',
  'award-aee0c1547953',
  'award-8250bfe7501a',
  'award-4f14964df035',
  'award-ba504649a05d',
  'award-9da4b8e00a27',
  'award-098d6a3e2296',
  'award-0546c2fa9e62',
  'award-c0fca5630f43',
  'award-6fa70e1db39e',
  'award-347a9a678c08',
  'award-b5aebadbd8d2',
  'award-d1a6bced44ae',
  'award-a6594e658462',
  'award-1ff8a3062d23',
  'award-baac2dac6d2e',
  'award-853f29f07462',
  'award-519dce301c62',
  'award-ff63c599405f',
  'award-ecede06f700f',
  'award-aa5f48666b9f',
  'award-47d3b833050c',
  'award-b1a03b264f02',
  'award-d22749dcd4bf',
  'award-c3710c715ac5',
  'award-bbe935853482',
  'award-89275cd0ee28',
  'award-d6ae56218094',
  'award-9545b3c2a03a',
  'award-2c06399c35e5',
  'award-20025cb56901',
  'award-4b8060812f60',
  'award-675a17e44c2e',
  'award-f31bf2ed527a',
  'award-07c449a12ffd',
  'award-c36fdba14b1f',
  'award-d7fd424f278f',
  'award-d1dc783a1ff8',
  'award-033b1d3e62a1',
  'award-368605f80ab9',
  'award-c8846f19dca4',
  'award-c2add4aa3b24',
  'award-8e8719f2146f',
  'award-9fe0775b24e7',
  'award-e9ca489e5a61',
  'award-e48736fb17e8',
  'award-c0661550686b',
  'award-7fa6002a8718',
  'award-01dc5649ad46',
  'award-084548999d06',
  'award-8034b093b983',
  'award-f3e3f2d8bec0',
  'award-b2d1411189ef',
  'award-0c6f9832a101',
  'award-44bcbb2eeb9c',
  'award-4aa2be1b2660',
  'award-4ea4015b19b3',
  'award-0b75492e8353',
  'award-e8e0a4382e8d',
  'award-ea2e209de181',
  'award-86fa99382474',
  'award-ffe029a85b2a',
  'award-1f84b7995c22',
  'award-df3626999a99',
  'award-d6faaec17330',
  'award-26777f7302e7',
  'award-3703c9eee32b',
  'award-f72b8b128a76',
  'award-abf4abd96954',
  'award-3279a3f6cdff',
  'award-063f7b85a1ae',
  'award-4eb144ad1c26',
  'award-f3ea8c7493c6',
  'award-4156f119417d',
  'award-0c110e5a2639',
  'award-a2ee8e443eb2',
  'award-11c663acf42e',
  'award-ba8d9f252645',
  'award-140b97cfb628',
  'award-67de97a4f446',
  'award-e05338ef963f',
  'award-5dd6fcbcc0f8',
  'award-3ea4f475bc9f',
  'award-8809a8f1adc4',
];
const uncheckedIds = ['award-577dacb8c225', 'award-ce44143820a7'];

const byId = new Map(R3_CATALOG.awards.map((award) => [award.publicId, award]));
assert.equal(R3_CATALOG.awards.filter((award) => award.verification?.status === 'verified').length, verifiedIds.length);
for (const id of verifiedIds) assert.equal(byId.get(id)?.verification?.status, 'verified', id);
for (const id of uncheckedIds) assert.equal(byId.get(id)?.verification, undefined, id);
assert.equal(byId.get('award-5fec013fe00c')?.verification, undefined);
assert.equal(byId.get('award-5fec013fe00c')?.eligibility.minimumGpa, null);
assert.equal(byId.get('award-fa027b498c44')?.verification?.openStatus, 'closed_next_not_posted');
assert.equal(byId.get('award-04b4c1f204d1')?.verification?.deadline, 'March 15, 2027, 4:00 p.m.');
assert.equal(byId.get('award-140b97cfb628')?.verification?.openStatus, 'closed_next_not_posted');
assert.equal(byId.get('award-140b97cfb628')?.verification?.deadline, 'April 17, 2026');
assert.equal(byId.get('award-d06d7c7342e2')?.verification?.openStatus, 'open_now');
assert.equal(byId.get('award-d06d7c7342e2')?.verification?.deadline, 'March 21, 2027');
assert.equal(byId.get('award-318b34958cc0')?.verification, undefined);
assert.match(byId.get('award-318b34958cc0')?.verificationNote ?? '', /does not list/);
assert.match(byId.get('award-fa212121a110')?.verificationNote ?? '', /does not name a cycle year/);
assert.equal(R3_CATALOG.awards.filter((award) => award.verificationNote).length, 135);
assert.equal(R3_CATALOG.awards.filter((award) => displayVerification(award).status === 'not_yet_checked').length, 411 - verifiedIds.length);

const counted = { active: 0, upcoming: 0, closed: 0, unavailable: 0, unknown: 0 };
for (const award of R3_CATALOG.awards) counted[award.cycle.status] += 1;
assert.equal(counted.active, R3_CATALOG.counts.activeCycles);
assert.equal(counted.upcoming, R3_CATALOG.counts.upcomingCycles);
assert.equal(counted.closed, R3_CATALOG.counts.closedCycles);
assert.equal(counted.unknown, R3_CATALOG.counts.unknownCycles);

const aopa = byId.get(AOPA_ID)!;
assert.equal(aopa.name, 'AOPA Foundation You Can Fly High School Flight Training Scholarship');
assert.equal(aopa.verification?.lastChecked, '2026-10-28');
assert.equal(aopa.verification?.sourceUrl, 'https://www.aopa.org/training-and-safety/students/aopa-flight-training-scholarships');
assert.equal(aopa.verification?.openStatus, 'open_now');
assert.equal(aopa.verification?.deadline, 'December 31, 11:59 p.m. ET');
assert.equal(aopa.eligibility.minimumGpa, null);
assert.equal(aopa.cycle.status, 'active');
assert.match(aopa.amount.label, /90 awards of \$12,000/);
assert.match(aopa.summary ?? '', /free membership/);
assert.match(aopa.summary ?? '', /16 to 18/);
assert.doesNotMatch(`${aopa.summary} ${aopa.eligibility.audience}`, /2\.7|written exam|written-exam|checkride/i);
assert.equal(openStatusText(aopa), 'Open now. Deadline December 31, 11:59 p.m. ET.');

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
const shownReasons = aopaResult.reasons.map((reason) => displayMatchReason(reason.message)).join('\n');
assert.match(aopaResult.reasons.map((reason) => reason.message).join('\n'), /FAA written-exam prerequisite/);
assert.doesNotMatch(shownReasons, /written exam|written-exam|2\.7/i);
assert.match(shownReasons, /age range stated on the official page/);
assert.match(aopaResult.reasons.map((reason) => reason.message).join('\n'), /AOPA Foundation You Can Fly High School Flight Training Scholarship/);
const belowGpa = shortlistAwards(R3_CATALOG.awards, { ...seniorPilot, gpa: 2 });
const belowResult = belowGpa.results.find((result) => result.award.publicId === AOPA_ID);
assert.notEqual(belowResult?.decision, 'recorded_mismatch');
assert.equal(displayVerification(aopaResult.award).status, 'verified');

const barnes = journey.results.find((result) => result.award.publicId === 'award-ce44143820a7');
assert.equal(displayVerification(barnes!.award).status, 'not_yet_checked');

const csv = serializeAwardCsv([aopaResult.award, barnes!.award]);
assert.match(csv, /Verified/);
assert.match(csv, /Not yet checked/);
assert.match(csv, /2026-10-28/);
assert.match(csv, /https:\/\/www\.aopa\.org\/training-and-safety\/students\/aopa-flight-training-scholarships/);

console.log('PILOT VERIFICATION PASS', JSON.stringify({
  verified: verifiedIds.length,
  unchecked: 411 - verifiedIds.length,
  aopaDecision: aopaResult.decision,
  aopaRelevant: aopaResult.relevant,
}));
