import assert from 'node:assert/strict';
import {
  forbiddenRuntimeCapabilities,
  runtimeClosure,
  validateP9ProductionRuntime,
} from './p9-production-runtime';

const receipt = validateP9ProductionRuntime();
assert.equal(receipt.publicationSha256, '16db9f32a14c7b63d2a912a84c43ac973ae43a07d7c40841174d6fbdfd5a6b07');
assert.equal(receipt.publicationId, 'p8m-matching-facts-v1-rev225');
assert.deepEqual(
  [receipt.sourceRows, receipt.scholarshipRows, receipt.portalRows, receipt.acceptedMatchingFacts],
  [197, 176, 21, 0],
);
assert.equal(receipt.runtimeGoogleCapability, 'none');
assert.equal(receipt.nonceBoundHealth, true);
assert(receipt.runtimeFiles > 0);
assert(/^[0-9a-f]{64}$/.test(receipt.runtimeClosureSha256));
assert(runtimeClosure().some((file) => file.endsWith('/fixtures/p8m/matching-facts-v1.json')));

for (const probe of [
  "import { google } from 'googleapis';",
  "import { GoogleGenAI } from '@google/genai';",
  "import { Geist } from 'next/font/google';",
  'process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS',
  "fetch('https://sheets.googleapis.com/v4/spreadsheets/x')",
  "const scope = 'https://www.googleapis.com/auth/spreadsheets';",
]) {
  assert(forbiddenRuntimeCapabilities(probe).length > 0, `probe must fail closed: ${probe}`);
}

console.log(
  `P9 PRODUCTION RUNTIME TEST PASS files=${receipt.runtimeFiles} publication=${receipt.publicationSha256} closure=${receipt.runtimeClosureSha256}`,
);
