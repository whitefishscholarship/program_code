'use strict';
const assert = require('node:assert/strict');
const { sanitizeRevisionObservation: sanitize, validateFreshnessSequence: validateSequence } = require('./r3-connector-read.cjs');
const fileId = 'synthetic-file'; const modifiedTime = '2026-01-01T00:00:00.000Z';
const good = { structuredContent: { result: { fileId, currentRevisionId: '2', previousRevisionId: '1', revisions: [
  { id: '2', modifiedTime, mimeType: 'application/vnd.google-apps.spreadsheet', lastModifyingUser: {
    displayName: 'SYNTHETIC_PRIVATE_NAME', emailAddress: 'synthetic@example.invalid', permissionId: 'SYNTHETIC_PRIVATE_ID', photoLink: 'https://example.invalid/SYNTHETIC_PRIVATE_PHOTO', me: true }
  }
] } } };
const result = sanitize(good, fileId, modifiedTime);
assert.equal(result.status, 'PASS'); assert.equal(result.currentRevisionId, '2');
assert(!JSON.stringify(result).includes('SYNTHETIC_PRIVATE')); assert(!JSON.stringify(result).includes('example.invalid'));
const changes = [
  d => { delete d.currentRevisionId; }, d => { d.currentRevisionId = 'absent'; },
  d => { d.fileId = 'other'; }, d => { d.revisions[0].modifiedTime = 'invalid'; },
  d => { d.revisions.push(d.revisions[0]); }, d => { d.revisions = Array(1000).fill(d.revisions[0]); },
  d => { d.nextPageToken = 'unapproved'; }, d => { d.revisions[0].content = 'unapproved'; },
  d => { d.revisions[0].lastModifyingUser.unapproved = 'synthetic'; },
  d => { d.currentRevisionId = 'synthetic@example.invalid'; }, d => { d.revisions[0].mimeType = 'text/plain'; },
];
for (const change of changes) {
  const response = structuredClone(good); change(response.structuredContent.result);
  const blocked = sanitize(response, fileId, modifiedTime);
  assert.equal(blocked.status, 'BLOCKED'); assert.equal(blocked.currentRevisionId, null);
  assert(!JSON.stringify(blocked).includes('SYNTHETIC_PRIVATE'));
}
assert.equal(sanitize({ isError: true, content: [{ text: 'SYNTHETIC_PRIVATE_ERROR' }] }, fileId, modifiedTime).status, 'BLOCKED');
assert.equal(sanitize(good, fileId, null).status, 'BLOCKED');
console.log('R3 revision sanitizer PASS: no editor identity output; missing, ambiguous, widened and cap-limited proof blocks. Synthetic inputs only.');

const unequal = structuredClone(good); unequal.structuredContent.result.revisions[0].modifiedTime = '2025-12-31T23:59:59.859Z';
const differentTimes = sanitize(unequal, fileId, modifiedTime);
assert.equal(differentTimes.status, 'PASS'); assert.equal(differentTimes.fileModifiedTime, modifiedTime);
const book = '1Dp5AMnrfSQ-Xf-r03S75lKsGPJk7o0inOgvC9Q6lOl4';
const at = n => `2026-01-01T00:01:${String(n).padStart(2, '0')}.000Z`;
const observations = [0, 4, 6, 10].map(n => ({ startedAt: at(n), completedAt: at(n + 1), result: { ...differentTimes, fileId: book } }));
const captures = [2, 8].map(n => ({ startedAt: at(n), completedAt: at(n + 1), range: "'Master Database'!A1:O417", sheetId: 0, complete: true, sha256: 'a'.repeat(64),
  cellFields: 'userEnteredValue,effectiveValue,formattedValue,hyperlink,textFormatRuns(startIndex,format(link)),userEnteredFormat(numberFormat),effectiveFormat(numberFormat)' }));
assert.deepEqual(validateSequence(observations, captures, 2), []);
assert.deepEqual(validateSequence(observations, captures, 3), []);
for (const attempt of [0, 1, 4]) assert(validateSequence(observations, captures, attempt).length);
for (const key of ['currentRevisionId', 'fileModifiedTime', 'currentRevisionModifiedTime', 'fileId']) {
  const changed = structuredClone(observations); changed[3].result[key] = key.endsWith('Time') ? '2026-01-02T00:00:00.000Z' : 'changed';
  assert(validateSequence(changed, captures, 2).length, key);
}
assert(validateSequence(observations.slice(1), captures, 2).length);
assert(validateSequence(observations, captures.slice(1), 2).length);
for (const [key, value] of [['sha256', 'b'.repeat(64)], ['complete', false], ['range', 'other'], ['sheetId', 1], ['cellFields', '*'], ['startedAt', at(0)]]) {
  const changed = structuredClone(captures); changed[1][key] = value; assert(validateSequence(observations, changed, 2).length, key);
}
console.log('R3 freshness PASS: unequal independent timestamps allowed; instability, order, bounds, unequal captures and exhausted attempts rejected.');

for (const invalid of ['2026-02-30T00:00:00.000Z', '2026-01-01T24:00:00.000Z', '2026-02-29T00:00:00Z', '2026-04-31T00:00:00Z', '2026-01-01T00:60:00Z']) {
  const changed = structuredClone(good); changed.structuredContent.result.revisions[0].modifiedTime = invalid;
  assert.equal(sanitize(changed, fileId, modifiedTime).status, 'BLOCKED');
  assert.equal(sanitize(good, fileId, invalid).status, 'BLOCKED');
  for (const clock of ['startedAt', 'completedAt']) {
    const sequence = structuredClone(observations); sequence[0][clock] = invalid;
    assert(validateSequence(sequence, captures, 2).length);
    const intervals = structuredClone(captures); intervals[0][clock] = invalid;
    assert(validateSequence(observations, intervals, 2).length);
  }
}
for (const valid of ['2024-02-29T00:00:00Z', '2026-01-01T00:00:00.1Z', '2026-01-01T00:00:00.12Z', '2026-01-01T00:00:00.123Z']) {
  const changed = structuredClone(good); changed.structuredContent.result.revisions[0].modifiedTime = valid;
  assert.equal(sanitize(changed, fileId, valid).status, 'PASS');
}
console.log('R3 date-validation remediation PASS: invalid calendar/time rollovers rejected; valid leap day and fractional timestamps accepted.');
