'use strict';
const assert = require('node:assert/strict');
const { sanitizeRevisionObservation: sanitize } = require('./r3-connector-read.cjs');
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
  d => { d.fileId = 'other'; }, d => { d.revisions[0].modifiedTime = '2025-01-01T00:00:00Z'; },
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
