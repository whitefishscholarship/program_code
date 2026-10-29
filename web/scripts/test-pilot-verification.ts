import assert from 'node:assert/strict';
import { R3_CATALOG } from '../src/lib/r3Catalog';
import { displayMatchReason, displayVerification, openStatusText } from '../src/lib/studentCatalog';
import { InterviewAnswersSchema } from '../src/lib/interviewMatcher';
import { shortlistAwards } from '../src/lib/spreadsheetShortlist';
import { serializeAwardCsv } from '../src/lib/export';

const AOPA_ID = 'award-d8ff6ef257b3';
const verifiedIds = [
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
  'award-5ecbf2de5f92',
  'award-901370e1548e',
  'award-ef357d97de32',
  'award-9c7b61be754a',
  'award-7e11abb8d4fc',
  'award-8b09bb021129',
  'award-b4cd9cb209ea',
  'award-a9386e11715e',
  'award-453110814fe5',
  'award-3c1de856d59e',
  'award-d9861aae050d',
  'award-66bd050a37ca',
  'award-79c1268f1ea5',
  'award-aeb5e9e39b82',
  'award-19c987735664',
  'award-8dc9700421f7',
  'award-0f841a2f9a61',
  'award-f41c36b42ac9',
  'award-feaafc99a9fb',
  'award-667db7bac4b9',
  'award-a2fca0938b4e',
  'award-4abfd54c1a6a',
  'award-005b794acb14',
  'award-3e63902e8554',
  'award-9d3f65e8d844',
  'award-577dacb8c225',
  'award-a3c9f5127f45',
  'award-7d262385f5d5',
  'award-5d6c289f9cf6',
  'award-db429f56aafe',
  'award-fa0711891ae7',
  'award-9049848e68c9',
  'award-221b3ca571aa',
  'award-4ac74a9f17fd',
  'award-4562d94cb7b9',
  'award-8e7ecab8f784',
  'award-62f23380f97a',
  'award-f7f89058438d',
  'award-580ec7a464a7',
  'award-43f86bc61115',
  'award-4a29a85c87bc',
  'award-142da69533e6',
  'award-607fe66710d6',
  'award-c3491944119d',
  'award-4792ca67f2e1',
  'award-2726fc6e69fc',
  'award-1a3f42f9e6a9',
  'award-cadb7a3c4afa',
  'award-5230a4d409fd',
  'award-5dd4c3d3988a',
  'award-88670d80cadf',
  'award-12a7ca904d6a',
  'award-fd629c83fb3f',
  'award-2a22470d390c',
  'award-c601a3ce6b92',
  'award-2974a6462e95',
  'award-d8ff6ef257b3',
  'award-71e2ee7f2172',
  'award-6307b228e380',
  'award-9ef3717601cd',
  'award-d2f262e03fe2',
  'award-fa212121a110',
  'award-7933697626cd',
  'award-b9a12b09957d',
  'award-67ca7bc4fa40',
  'award-a15386569627',
  'award-cc062852a7f2',
  'award-6781caed705a',
  'award-07f8d89b10ba',
  'award-023bcc028b05',
  'award-6eb2676b69f4',
  'award-807d8245fb2b',
  'award-6c9a2b50553e',
  'award-c50893f87fdc',
  'award-83f3b6b43c5e',
  'award-d6ec98fa1642',
  'award-85eccd5611e9',
  'award-bb295b2828b5',
  'award-36791c097a52',
  'award-6a6b073e14f6',
  'award-f6107529bd46',
  'award-8e955dce3eaa',
  'award-39bc01d95ee8',
  'award-9c85eb732e7a',
  'award-3ec37786eaf6',
  'award-3b5ec8c60897',
  'award-943678a94833',
  'award-54180c19eb74',
  'award-36ff5fe7d091',
  'award-cadbe502505a',
  'award-6ee1bd1bab1f',
  'award-b5978bd2f102',
  'award-5a371acc5f8b',
  'award-e58fc41d18c6',
  'award-88ecf11c683e',
  'award-f8748579eb81',
  'award-8bce77306c27',
  'award-203ab9685eb1',
  'award-b42417e9530c',
  'award-a60341b46e39',
  'award-511571f33677',
  'award-440219a21c52',
  'award-bbad8145ca3e',
  'award-62b0511e59fe',
  'award-be12d7769d06',
  'award-467dbfa796e2',
  'award-88d2adae4d6d',
  'award-0a0daa895593',
  'award-df57e3f6a067',
  'award-2541f267aecb',
  'award-de35aff29b9f',
  'award-e3aec30264fc',
  'award-a4ca14a7716d',
  'award-66c48204573e',
  'award-5565234bc80e',
  'award-168218cd3b3c',
  'award-5b93bad03efd',
  'award-3c66c7edc5d3',
  'award-2126bc5d2f6b',
  'award-bb776f54425c',
  'award-6b4f548adb79',
  'award-116fe9ce5784',
  'award-b1a9ae5d6f04',
  'award-e17a43d5029c',
  'award-a0f5a36b98a2',
  'award-b86982e726be',
  'award-251c136369e5',
  'award-d26867d69108',
  'award-f8f731aa27df',
  'award-fc37c2d47f56',
  'award-7e66bc43f068',
  'award-5d3eb630cded',
  'award-ead4360dadca',
  'award-b4faadd4c1d5',
  'award-4f96382a8925',
  'award-068bd3a04e24',
  'award-7b8c0838e0b9',
  'award-b23111c6755c',
  'award-59ca9fde81ba',
  'award-295621b942a5',
  'award-330e6040b83b',
  'award-9047b192ebf2',
  'award-8debb4562aa5',
  'award-1901179dd5bd',
  'award-a35f143a67e4',
  'award-10b85bfc0c0c',
  'award-47478b1163e1',
  'award-0a8edc3902fa',
  'award-86f5be697eda',
  'award-3100c2d6122e',
  'award-938db8ede16a',
  'award-54af9ccbbb57',
  'award-49934bf76150',
  'award-f1d6a4b38033',
  'award-1a058b4c5510',
  'award-ec7d28fb15f9',
  'award-0651dcec4d07',
  'award-ffbd0f0b989f',
  'award-df416d89833f',
  'award-8367e34203f4',
  'award-7b536c5d129d',
  'award-aba97e610d99',
  'award-d629176b982e',
  'award-da7f4a7038ef',
  'award-4b84affbfa6e',
  'award-201e7734747c',
  'award-1ba2675c98f9',
  'award-846cd31bf119',
  'award-02666b75eb76',
  'award-000eeb62b003',
  'award-fb2de42b1e28',
  'award-ce44143820a7',
  'award-2dc33d508924',
  'award-8739a664c0d7',
  'award-e360b55057a5',
  'award-816598124402',
  'award-23a5338563e4',
  'award-21b6dce7662e',
  'award-5648e87a76d7',
  'award-03e0f76e1886',
  'award-84882a48ae6c',
  'award-913072c89540',
  'award-0fdf8e6ce228',
  'award-ad1e28e0e26c',
  'award-dd3cf3aeab83',
  'award-273fe6406702',
  'award-ceec2cef2d5b',
  'award-5dc2aab768d2',
  'award-07059d5bb542',
  'award-29c97f527be9',
  'award-f7fc6a093ae3',
  'award-d90198f6225f',
  'award-a4379bfbc7bd',
  'award-d2b44a62c0a7',
  'award-b8ae28986a81',
  'award-3caab7453e5b',
  'award-51729cb7b370',
  'award-a321ba096da1',
  'award-5fec013fe00c',
  'award-39cdccc5a462',
  'award-72b47d9371a6',
  'award-9bb9b1051d9e',
  'award-40db1e8dee39',
  'award-a55aa2e1054d',
  'award-dc91ab27f6f7',
  'award-93672b6e2fd0',
  'award-7d64a0f1d998',
  'award-8b3ba6db3abf',
  'award-5aa5606c6d92',
  'award-29b2feca960c',
  'award-d200693978b6',
  'award-eb65be4e9357',
  'award-f916a7b874f7',
  'award-bfc8cd5b172f',
  'award-94bc46651bc7',
  'award-344d767af9a6',
  'award-0249ee80bbce',
  'award-d1f523e64c60',
  'award-91e97d6c3fba',
  'award-d5ab9d5dcef8',
  // p2-verified-ids
];
const uncheckedIds = [
  'award-5b5b0db70dd0',
];

const byId = new Map(R3_CATALOG.awards.map((award) => [award.publicId, award]));
assert.equal(R3_CATALOG.awards.filter((award) => award.verification?.status === 'verified').length, verifiedIds.length);
for (const id of verifiedIds) assert.equal(byId.get(id)?.verification?.status, 'verified', id);
for (const id of uncheckedIds) assert.equal(byId.get(id)?.verification, undefined, id);
assert.equal(byId.get('award-8ec14d114e2f'), undefined);
assert.equal(byId.get('award-5fec013fe00c')?.verification?.status, 'verified');
assert.equal(byId.get('award-5fec013fe00c')?.verification?.deadline, 'April 15, 2027');
assert.equal(byId.get('award-5fec013fe00c')?.cycle.recurrence, 'annual');
assert.equal(byId.get('award-5fec013fe00c')?.eligibility.minimumGpa, null);
assert.equal(byId.get('award-5b5b0db70dd0')?.verification, undefined);
assert.equal(byId.get('award-5b5b0db70dd0')?.cycle.label, 'Not sure/Opens later');
assert.equal(byId.get('award-5b5b0db70dd0')?.cycle.closes, null);
assert.equal(byId.get('award-5b5b0db70dd0')?.amount.minimum, 500);
assert.match(byId.get('award-5b5b0db70dd0')?.verificationNote ?? '', /check weekly for new dates/);
assert.equal(byId.get('award-72b47d9371a6')?.name, 'The Neurodiversity Scholarship');
assert.equal(byId.get('award-72b47d9371a6')?.cycle.opens, 'November 1, 2026');
assert.equal(byId.get('award-72b47d9371a6')?.verification?.deadline, 'January 15, 2027');
assert.equal(byId.get('award-9bb9b1051d9e')?.verification?.deadline, 'April 1, 2027');
assert.equal(byId.get('award-40db1e8dee39')?.amount.label, '$1,000 to $4,000 per year');
assert.equal(byId.get('award-40db1e8dee39')?.cycle.recurrence, 'rolling');
assert.equal(byId.get('award-40db1e8dee39')?.verification?.openStatus, 'open_now');
assert.equal(byId.get('award-40db1e8dee39')?.verification?.deadline, null);
assert.equal(byId.get('award-40db1e8dee39')?.eligibility.minimumGpa, null);
assert.equal(byId.get('award-fa027b498c44')?.verification?.openStatus, 'closed_next_not_posted');
assert.equal(byId.get('award-04b4c1f204d1')?.verification?.deadline, 'March 15, 2027, 4:00 p.m.');
assert.equal(byId.get('award-140b97cfb628')?.verification?.openStatus, 'closed_next_not_posted');
assert.equal(byId.get('award-140b97cfb628')?.verification?.deadline, 'April 17, 2026');
assert.equal(byId.get('award-d06d7c7342e2')?.verification?.openStatus, 'open_now');
assert.equal(byId.get('award-d06d7c7342e2')?.verification?.deadline, 'March 21, 2027');
assert.equal(byId.get('award-318b34958cc0'), undefined);
assert.equal(byId.get('award-60b634d314c6')?.name, 'Everyday Champion Award');
assert.equal(byId.get('award-60b634d314c6')?.verification, undefined);
assert.match(byId.get('award-60b634d314c6')?.verificationNote ?? '', /does not state a deadline/);
assert.equal(byId.get('award-a9c6e0fcc5af')?.verification?.status, 'verified');
assert.equal(byId.get('award-00c8fd2e3b19')?.verification?.status, 'verified');
assert.equal(byId.get('award-2a22470d390c')?.verification?.openStatus, 'open_now');
assert.equal(byId.get('award-2a22470d390c')?.cycle.recurrence, 'rolling');
assert.equal(byId.get('award-b8ae28986a81')?.verification?.status, 'verified');
assert.equal(byId.get('award-3caab7453e5b')?.verification?.status, 'verified');
assert.equal(byId.get('award-51729cb7b370')?.verification?.status, 'verified');
assert.equal(byId.get('award-a321ba096da1')?.verification?.deadline, 'September 1, 2026');
assert.equal(byId.get('award-a321ba096da1')?.verification?.openStatus, 'closed_next_not_posted');
assert.equal(byId.get('award-e30f226ed6fc')?.verification, undefined);
assert.match(byId.get('award-fa212121a110')?.verificationNote ?? '', /confirmed by Kelsey/);
assert.equal(byId.get('award-7e11abb8d4fc')?.verification?.openStatus, 'open_now');
assert.equal(byId.get('award-7e11abb8d4fc')?.verification?.deadline, 'December 1, 2026 at midnight MST');
assert.equal(byId.get('award-5ecbf2de5f92')?.verification?.openStatus, null);
assert.equal(byId.get('award-39cdccc5a462')?.verification?.deadline, 'May 31, 2027');
assert.match(byId.get('award-39cdccc5a462')?.verificationNote ?? '', /confirmed by Kelsey/);
assert.match(byId.get('award-86f5be697eda')?.verificationNote ?? '', /confirmed by Kelsey/);
assert.match(byId.get('award-86f5be697eda')?.verificationNote ?? '', /only 2026 data/);
assert.equal(R3_CATALOG.awards.filter((award) => award.verificationNote).length, 180);
assert.equal(R3_CATALOG.awards.filter((award) => displayVerification(award).status === 'not_yet_checked').length, R3_CATALOG.awards.length - verifiedIds.length);

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

const stillUnchecked = journey.results.find((result) => result.award.publicId === 'award-5b5b0db70dd0');
assert.equal(displayVerification(stillUnchecked!.award).status, 'not_yet_checked');

const csv = serializeAwardCsv([aopaResult.award, stillUnchecked!.award]);
assert.match(csv, /Verified/);
assert.match(csv, /Not yet checked/);
assert.match(csv, /2026-10-28/);
assert.match(csv, /https:\/\/www\.aopa\.org\/training-and-safety\/students\/aopa-flight-training-scholarships/);

console.log('PILOT VERIFICATION PASS', JSON.stringify({
  verified: verifiedIds.length,
  unchecked: R3_CATALOG.awards.length - verifiedIds.length,
  aopaDecision: aopaResult.decision,
  aopaRelevant: aopaResult.relevant,
}));
