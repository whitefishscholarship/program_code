import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  forbiddenRuntimeCapabilities,
  runtimeClosure,
  validateP9ProductionRuntime,
} from './p9-production-runtime';
import { validateP9ReplacementEvidence } from './p9-replacement-closeout';

const receipt = validateP9ProductionRuntime();
assert.equal(receipt.publicationSha256, '16db9f32a14c7b63d2a912a84c43ac973ae43a07d7c40841174d6fbdfd5a6b07');
assert.equal(receipt.publicationId, 'p8m-matching-facts-v1-rev225');
assert.deepEqual(
  [receipt.sourceRows, receipt.scholarshipRows, receipt.portalRows, receipt.acceptedMatchingFacts],
  [197, 176, 21, 0],
);
assert.equal(receipt.runtimeGoogleCapability, 'none');
assert.equal(receipt.nonceBoundHealth, true);
assert.deepEqual(receipt.productionDependencyGooglePackages, []);
assert(receipt.deploymentConfigFilesChecked.includes('next.config.ts'));
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
  "const api = require('googleapis');",
  "const api = await import('@google-cloud/storage');",
  'const api = await import(providerName);',
  'const api = require(providerName);',
  "process.env['GCP_CREDENTIALS']",
  'process.env[credentialName]',
  "fetch('https://example.com/publication.json')",
  'fetch(runtimeSource)',
]) {
  assert(forbiddenRuntimeCapabilities(probe).length > 0, `probe must fail closed: ${probe}`);
}

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const deploymentEvidence = JSON.parse(fs.readFileSync(path.join(repoRoot, 'docs/evidence/P9-deployment.json'), 'utf8'));
const evidenceContext = {
  baselineCommit: '6648652c2d42a663c61de7cc525928c7581a112c',
  runtimeCommit: '729d39b02b3462e6365648d19317bfc1ef249982',
  publicationSha256: '16db9f32a14c7b63d2a912a84c43ac973ae43a07d7c40841174d6fbdfd5a6b07',
  runtimeClosureSha256: '4a0bb4bda4077e4eda2c8df7f86edd3dc66592a292cbf8cc9dee636e89cfe373',
  projectFingerprintSha256: 'ca64aa6ca87036c311b2fa3e412a7794fb848fd88dc82b8c6054d5ca0905cfe4',
  teamFingerprintSha256: 'f4317b9fab487e672aa1939c939c44a8a0c654f0c785112b3ab40106bed3f9e3',
  hostnameFingerprintSha256: 'b1eb88bf68716ce612a9a4f559614a90027ad5d2373d6a803b5d1a21246de075',
  verificationEnvironmentFingerprintSha256: 'c5b24e83bbfdfa64d9734aa853cce72ad4ebdadcf2278c5f11e314e6fd886800',
};
assert.deepEqual(validateP9ReplacementEvidence(deploymentEvidence, evidenceContext), []);
for (const mutate of [
  (copy: any) => { copy.runtimeCommit = '0'.repeat(40); },
  (copy: any) => { copy.target.projectId = 'prj_wrong'; },
  (copy: any) => { copy.delivery.githubActionsConclusion = 'failure'; },
  (copy: any) => { copy.environment.inspections[0].productionVariableNames.push('GCP_CREDENTIALS'); },
  (copy: any) => { copy.observations[2].nonce = copy.observations[1].nonce; },
  (copy: any) => { copy.observations[3].deploymentId = copy.deployments.cleanA.id; },
  (copy: any) => { copy.aliasOperations.reverse(); },
  (copy: any) => { copy.runtimeProof.builtServerTrace = 'unknown'; },
  (copy: any) => { copy.finalSmoke.awards = 191; },
]) {
  const copy = structuredClone(deploymentEvidence);
  mutate(copy);
  assert(validateP9ReplacementEvidence(copy, evidenceContext).length > 0);
}

console.log(
  `P9 PRODUCTION RUNTIME TEST PASS files=${receipt.runtimeFiles} publication=${receipt.publicationSha256} closure=${receipt.runtimeClosureSha256}`,
);
