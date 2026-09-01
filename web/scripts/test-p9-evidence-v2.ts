import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  P9_AUTHORIZED_PRODUCTION_TABS,
  P9_PRODUCTION_SPREADSHEET_ID,
  P9_READ_ONLY_OAUTH_SCOPE,
  P9_TESTING_SPREADSHEET_ID,
  P9_VERIFIED_BACKUPS,
} from './production-authority';
import {
  P9_APPLICATION_READ_BOUNDED_FIELDS,
  P9_APPLICATION_RUNTIME_BINDING_MODULE_PATH,
  P9_APPLICATION_READ_CHALLENGE_DOMAIN,
  P9_APPLICATION_READ_CHALLENGE_HASH_ALGORITHM,
  P9_DRIVE_METADATA_SCOPE,
  P9_EVIDENCE_ENVIRONMENT,
  P9_EVIDENCE_REPOSITORY,
  P9_HEALTH_ROUTE_PATH,
  P9_PRODUCTION_SOURCE_LOADER_PATH,
  P9_PUBLIC_ROUTE_PATH,
  P9_REQUIRED_WRITE_SURFACES,
  P9_SIGNER_WORKFLOW,
  P9_TRUSTED_PROOF_PATHS,
  P9_TRUSTED_WORKFLOW_PATH,
  P9_WRITE_GUARD_MODULE_PATH,
  P9_WRITE_ISOLATION_PROBE_EXPORT,
  type P9AttestationVerification,
  type P9DeploymentRecord,
  type P9EntryReceipt,
  type P9EvidenceContext,
  type P9PostCutoverReceipt,
  type P9RuntimeConfig,
  type P9SourceObservation,
  type P9WriteSurfaceInventory,
  canonicalP9Json,
  deriveP9ApplicationReadRuntimeBinding,
  deriveP9WriteSurfaceInventory,
  parseP9DeploymentRecord,
  parseP9EntryReceipt,
  parseP9PostCutoverReceipt,
  p9CanonicalProductionHostnameFingerprint,
  p9ApplicationReadChallengeSha256,
  p9HostedVerificationEnvironmentFingerprint,
  p9RuntimeCredentialProvenanceFingerprint,
  sha256P9Value,
  validateP9DeploymentGitBindingV2,
  validateP9DeploymentRecordV2,
  validateP9EntryReceiptV2,
  validateP9PostCutoverReceiptV2,
  validateP9ReceiptSetSemanticsV2,
} from './p9-evidence-v2';

const baselineCommit = 'b'.repeat(40);
const revision7AttestationCommit = '7'.repeat(40);
const revision7CandidateCommit = '6'.repeat(40);
const trustedProofCandidateCommit = 'a'.repeat(40);
const trustedProofAttestationCommit = 'b'.repeat(40);
const workflowCommit = baselineCommit;
const runtimeCommit = 'e'.repeat(40);
const candidateCommit = 'f'.repeat(40);
const runtimeIdentityFingerprint = 'a'.repeat(64);
const canonicalProductionHostname = 'scholarships.example.org';
const staticCatalogSha256 = 'c'.repeat(64);
const credentialParserSource = [
  'const MAX_CREDENTIAL_PAYLOAD_BYTES = 64 * 1024;',
  'function jsonObjectOrNull(value: string): Record<string, unknown> | null {',
  '  try {',
  '    const parsed: unknown = JSON.parse(value);',
  "    return parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)",
  '      ? (parsed as Record<string, unknown>)',
  '      : null;',
  '  } catch {',
  '    return null;',
  '  }',
  '}',
  'function canonicalBase64JsonObjectOrNull(',
  '  value: string,',
  '): Record<string, unknown> | null {',
  '  if (',
  '    value !== value.trim() ||',
  '    !/^[A-Za-z0-9+/]+={0,2}$/.test(value) ||',
  '    value.length % 4 !== 0 ||',
  "    value.slice(0, -2).includes('=')",
  '  ) {',
  '    return null;',
  '  }',
  "  const decoded = Buffer.from(value, 'base64');",
  '  if (',
  '    decoded.length < 1 ||',
  '    decoded.length > MAX_CREDENTIAL_PAYLOAD_BYTES ||',
  "    decoded.toString('base64') !== value",
  '  ) {',
  '    return null;',
  '  }',
  "  const decodedText = decoded.toString('utf8');",
  "  if (!Buffer.from(decodedText, 'utf8').equals(decoded)) return null;",
  '  return jsonObjectOrNull(decodedText);',
  '}',
  'function parseServiceAccountCredentials(',
  '  value: unknown,',
  '): Record<string, unknown> {',
  '  if (',
  "    typeof value !== 'string' ||",
  "    Buffer.byteLength(value, 'utf8') < 1 ||",
  "    Buffer.byteLength(value, 'utf8') > MAX_CREDENTIAL_PAYLOAD_BYTES ||",
  '    value.trim().length === 0',
  '  ) {',
  "    throw new Error('invalid credentials');",
  '  }',
  '  const raw = jsonObjectOrNull(value);',
  '  const base64 = canonicalBase64JsonObjectOrNull(value);',
  '  if ((raw === null) === (base64 === null)) {',
  "    throw new Error('invalid credentials');",
  '  }',
  '  return (raw ?? base64) as Record<string, unknown>;',
  '}',
].join('\n');
const canonicalizerSource = [
  'function canonicalize(value: unknown): unknown {',
  '  if (Array.isArray(value)) return value.map(canonicalize);',
  "  if (value && typeof value === 'object') {",
  '    return Object.fromEntries(',
  '      Object.entries(value as Record<string, unknown>)',
  '        .sort(([left], [right]) => left.localeCompare(right))',
  '        .map(([key, item]) => [key, canonicalize(item)]),',
  '    );',
  '  }',
  '  return value;',
  '}',
  'function canonicalJson(value: unknown): string {',
  '  const serialized = JSON.stringify(value);',
  "  if (serialized === undefined) throw new Error('non-json');",
  '  return JSON.stringify(canonicalize(JSON.parse(serialized)));',
  '}',
].join('\n');
const tabLiteral = (tab: (typeof P9_AUTHORIZED_PRODUCTION_TABS)[number]) =>
  `{ sheetId: ${tab.sheetId}, title: ${JSON.stringify(tab.title)}, rowCount: ${tab.rowCount}, columnCount: ${tab.columnCount}, boundedRange: ${JSON.stringify(tab.boundedRange)} }`;
const validLoaderSource = [
  "import { createHash } from 'node:crypto';",
  "import { google } from 'googleapis';",
  "import { applicationRuntimeBinding } from './p9-application-runtime-binding';",
  credentialParserSource,
  canonicalizerSource,
  'function p9ApplicationReadChallengeSha256(nonce: string, tab: unknown, gridData: unknown): string {',
  "  return createHash('sha256').update(canonicalJson({",
  `    domain: ${JSON.stringify(P9_APPLICATION_READ_CHALLENGE_DOMAIN)},`,
  '    nonce: nonce,',
  `    spreadsheetId: ${JSON.stringify(P9_PRODUCTION_SPREADSHEET_ID)},`,
  `    oauthScopes: [${JSON.stringify(P9_READ_ONLY_OAUTH_SCOPE)}],`,
  '    tab: tab,',
  '    gridData: gridData,',
  "  })).digest('hex');",
  '}',
  'function mapP9Scholarships(sheets: any[]): unknown[] {',
  '  return sheets.flatMap((sheet) => sheet.data ?? []);',
  '}',
  'export async function loadP9ScholarshipSource(nonce: string | null) {',
  '  const sourceMode = process.env.P9_SOURCE_MODE;',
  "  if (sourceMode === 'accepted-p7-static-catalog') {",
  '    return { scholarships: [], applicationReadProbe: null, applicationRuntimeBinding };',
  '  }',
  '  const credentials = parseServiceAccountCredentials(process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS);',
  `  const auth = new google.auth.GoogleAuth({ credentials: credentials, scopes: [${JSON.stringify(P9_READ_ONLY_OAUTH_SCOPE)}] });`,
  "  const sheets = google.sheets({ version: 'v4', auth: auth });",
  '  const response = await sheets.spreadsheets.get({',
  `    spreadsheetId: ${JSON.stringify(P9_PRODUCTION_SPREADSHEET_ID)},`,
  `    ranges: [${P9_AUTHORIZED_PRODUCTION_TABS.map((tab) => JSON.stringify(tab.boundedRange)).join(', ')}],`,
  '    includeGridData: true,',
  `    fields: ${JSON.stringify(P9_APPLICATION_READ_BOUNDED_FIELDS)},`,
  '  });',
  '  const scholarships = mapP9Scholarships(response.data.sheets ?? []);',
  '  if (nonce === null) {',
  '    return { scholarships, applicationReadProbe: null, applicationRuntimeBinding };',
  '  }',
  ...P9_AUTHORIZED_PRODUCTION_TABS.flatMap((tab) => [
    `  const sheet${tab.sheetId} = response.data.sheets.find((sheet) => sheet.properties.sheetId === ${tab.sheetId});`,
    `  const gridData${tab.sheetId} = sheet${tab.sheetId}.data ?? [];`,
    `  const challenge${tab.sheetId} = p9ApplicationReadChallengeSha256(nonce, ${tabLiteral(tab)}, gridData${tab.sheetId});`,
  ]),
  '  return {',
  '    scholarships,',
  '    applicationReadProbe: {',
  `      domain: ${JSON.stringify(P9_APPLICATION_READ_CHALLENGE_DOMAIN)},`,
  `      challengeHashAlgorithm: ${JSON.stringify(P9_APPLICATION_READ_CHALLENGE_HASH_ALGORITHM)},`,
  '      nonce: nonce,',
  `      spreadsheetId: ${JSON.stringify(P9_PRODUCTION_SPREADSHEET_ID)},`,
  `      oauthScopes: [${JSON.stringify(P9_READ_ONLY_OAUTH_SCOPE)}],`,
  '      tabs: [',
  ...P9_AUTHORIZED_PRODUCTION_TABS.map(
    (tab) =>
      `        { sheetId: ${tab.sheetId}, title: ${JSON.stringify(tab.title)}, rowCount: ${tab.rowCount}, columnCount: ${tab.columnCount}, boundedRange: ${JSON.stringify(tab.boundedRange)}, nonceBoundCanonicalGridDataSha256: challenge${tab.sheetId} },`,
  ),
  '      ],',
  '      runtimeBinding: applicationRuntimeBinding,',
  '    },',
  '    applicationRuntimeBinding,',
  '  };',
  '}',
].join('\n');
const validHealthRouteSource = [
  "import { loadP9ScholarshipSource } from '@/lib/p9-production-source';",
  'export async function GET(request: Request) {',
  "  const headerNonce = request.headers.get('x-p9-evidence-nonce');",
  "  const queryNonce = new URL(request.url).searchParams.get('p9_evidence_nonce');",
  '  if (',
  '    headerNonce === null ||',
  '    queryNonce === null ||',
  '    !/^[A-Za-z0-9_-]{32,128}$/.test(headerNonce) ||',
  '    !/^[A-Za-z0-9_-]{32,128}$/.test(queryNonce) ||',
  '    headerNonce !== queryNonce',
  '  ) {',
  "    return Response.json({ error: 'invalid evidence nonce' }, { status: 400 });",
  '  }',
  '  const nonce = headerNonce;',
  '  const result = await loadP9ScholarshipSource(nonce);',
  '  return Response.json({',
  "    status: 'ok',",
  '    applicationReadProbe: result.applicationReadProbe,',
  '    applicationRuntimeBinding: result.applicationRuntimeBinding,',
  '  });',
  '}',
].join('\n');
const validPublicRouteSource = [
  "import { loadP9ScholarshipSource } from '@/lib/p9-production-source';",
  'export async function GET() {',
  '  const result = await loadP9ScholarshipSource(null);',
  '  return Response.json({ data: result.scholarships });',
  '}',
].join('\n');
const validRuntimeBindingModuleSource =
  'export const applicationRuntimeBinding = {} as const;';
function assertLoaderMappingRejected(loader: string, label: string): void {
  assert.throws(
    () =>
      deriveP9ApplicationReadRuntimeBinding({
        runtimeCommit,
        sourceBytes: {
          runtimeBindingModule: validRuntimeBindingModuleSource,
          loader,
          healthRoute: validHealthRouteSource,
          publicRoute: validPublicRouteSource,
        },
      }),
    /scholarships do not directly map the exact awaited response sheets/,
    label,
  );
}

assertLoaderMappingRejected(
  validLoaderSource.replace(
    'return sheets.flatMap((sheet) => sheet.data ?? []);',
    'return [];',
  ),
  'a mapper that ignores the awaited Sheets response and returns a constant is rejected',
);
assertLoaderMappingRejected(
  validLoaderSource.replace(
    'return sheets.flatMap((sheet) => sheet.data ?? []);',
    'return sheets.flatMap((sheet) => { void sheet; return []; });',
  ),
  'a superficial callback read cannot disguise a constant mapper result',
);
assertLoaderMappingRejected(
  validLoaderSource.replace(
    'return sheets.flatMap((sheet) => sheet.data ?? []);',
    'return sheets.flatMap((sheet) => sheet ? [] : []);',
  ),
  'a source-dependent condition with constant branches is not direct result dataflow',
);
assertLoaderMappingRejected(
  validLoaderSource.replace(
    'return sheets.flatMap((sheet) => sheet.data ?? []);',
    'return sheets.flatMap((sheet) => sheet.data.filter(() => false));',
  ),
  'a derived receiver cannot disguise a filter that always returns an empty result',
);
assertLoaderMappingRejected(
  validLoaderSource.replace(
    'return sheets.flatMap((sheet) => sheet.data ?? []);',
    'return sheets.flatMap((sheet) => sheet.data.length * 0);',
  ),
  'algebraically constant multiplication is not direct result dataflow',
);
assertLoaderMappingRejected(
  validLoaderSource.replace(
    'return sheets.flatMap((sheet) => sheet.data ?? []);',
    'return sheets.flatMap((sheet) => sheet.data.length - sheet.data.length);',
  ),
  'algebraically constant subtraction is not direct result dataflow',
);
for (const [replacement, label] of [
  [
    'return sheets.flatMap((sheet) => { const result = sheet.data; result.length = 0; return result; });',
    'callback-local length mutation cannot erase GridData',
  ],
  [
    'return sheets.flatMap((sheet) => { const result = sheet.data; result.splice(0); return result; });',
    'callback-local mutator calls cannot erase GridData',
  ],
  [
    'return sheets.flatMap((sheet) => { const result = sheet.data; if (true) result.length = 0; return result; });',
    'callback control flow cannot erase GridData',
  ],
  [
    'return sheets.flatMap((sheet) => sheet.data.length);',
    'GridData cardinality is not complete GridData value flow',
  ],
  [
    'return sheets.flatMap((sheet) => [sheet.data.length]);',
    'wrapped GridData cardinality is not complete GridData value flow',
  ],
  [
    'return sheets.flatMap((sheet) => ({ count: sheet.data.length }));',
    'object-wrapped GridData cardinality is not complete GridData value flow',
  ],
  [
    'return sheets.flatMap((sheet) => `${sheet.data.length}`);',
    'rendered GridData cardinality is not complete GridData value flow',
  ],
] as const) {
  assertLoaderMappingRejected(
    validLoaderSource.replace(
      'return sheets.flatMap((sheet) => sheet.data ?? []);',
      replacement,
    ),
    label,
  );
}
for (const [mutation, label] of [
  [
    '(response.data.sheets as any).flatMap = () => [];',
    'response-array flatMap monkeypatching cannot bypass the pinned callback',
  ],
  [
    '(Array.prototype as any).flatMap = () => [];',
    'Array.prototype flatMap monkeypatching cannot bypass the pinned callback',
  ],
] as const) {
  assert.throws(
    () =>
      deriveP9ApplicationReadRuntimeBinding({
        runtimeCommit,
        sourceBytes: {
          runtimeBindingModule: validRuntimeBindingModuleSource,
          loader: validLoaderSource.replace(
            '  const scholarships = mapP9Scholarships(response.data.sheets ?? []);',
            `  ${mutation}\n  const scholarships = mapP9Scholarships(response.data.sheets ?? []);`,
          ),
          healthRoute: validHealthRouteSource,
          publicRoute: validPublicRouteSource,
        },
      }),
    /loader statement sequence differs from the side-effect-free closure/,
    label,
  );
}
assertLoaderMappingRejected(
  validLoaderSource.replace(
    'function mapP9Scholarships(sheets: any[]): unknown[] {',
    'async function mapP9Scholarships(sheets: any[]): Promise<unknown[]> {',
  ),
  'an async mapper cannot substitute an unawaited Promise for GridData',
);
assertLoaderMappingRejected(
  validLoaderSource.replace(
    'function mapP9Scholarships(sheets: any[]): unknown[] {',
    'function* mapP9Scholarships(sheets: any[]): Generator<unknown[]> {',
  ),
  'a generator mapper cannot substitute an iterator for GridData',
);
assertLoaderMappingRejected(
  validLoaderSource.replace(
    'return sheets.flatMap((sheet) => sheet.data ?? []);',
    'return sheets.flatMap(async (sheet) => sheet.data ?? []);',
  ),
  'an async flatMap callback cannot substitute promises for GridData',
);
const applicationRuntimeBinding = deriveP9ApplicationReadRuntimeBinding({
  runtimeCommit,
  sourceBytes: {
    runtimeBindingModule: validRuntimeBindingModuleSource,
    loader: validLoaderSource,
    healthRoute: validHealthRouteSource,
    publicRoute: validPublicRouteSource,
  },
});
assert.throws(
  () =>
    deriveP9ApplicationReadRuntimeBinding({
      runtimeCommit,
      sourceBytes: {
        runtimeBindingModule: [
          '(Array.prototype as any).flatMap = () => [];',
          'export const applicationRuntimeBinding = {} as const;',
        ].join('\n'),
        loader: validLoaderSource,
        healthRoute: validHealthRouteSource,
        publicRoute: validPublicRouteSource,
      },
    }),
  /runtime binding module is not one direct const export/,
  'the imported runtime binding module cannot execute a mapper monkeypatch',
);
const runtimeClosureFixtureRoot = fs.mkdtempSync(
  path.join(os.tmpdir(), 'p9-runtime-closure-'),
);
try {
  for (const [relativePath, source] of [
    [P9_APPLICATION_RUNTIME_BINDING_MODULE_PATH, validRuntimeBindingModuleSource],
    [P9_PRODUCTION_SOURCE_LOADER_PATH, validLoaderSource],
    [P9_HEALTH_ROUTE_PATH, validHealthRouteSource],
    [P9_PUBLIC_ROUTE_PATH, validPublicRouteSource],
  ] as const) {
    const absolutePath = path.join(runtimeClosureFixtureRoot, relativePath);
    fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
    fs.writeFileSync(absolutePath, source);
  }
  for (const [source, label] of [
    [
      '(Array.prototype as any).flatMap = () => [];',
      'a direct built-in prototype write',
    ],
    [
      'const prototypeAlias = Array.prototype; prototypeAlias.flatMap = () => [];',
      'a built-in prototype alias write',
    ],
    [
      "const prototypeAlias = Array.prototype; Reflect.set(prototypeAlias, 'flatMap', () => []);",
      'a reflective built-in prototype alias write',
    ],
    [
      'let prototypeAlias = Array.prototype; prototypeAlias.flatMap = () => [];',
      'a stable let built-in prototype alias write',
    ],
    [
      'const { prototype: prototypeAlias } = Array; prototypeAlias.flatMap = () => [];',
      'a destructured built-in prototype alias write',
    ],
    [
      'const assign = Object.assign; assign(Array.prototype, { flatMap: () => [] });',
      'an aliased prototype mutation function',
    ],
    [
      'const prototypeAlias = Object.getPrototypeOf([]); prototypeAlias.flatMap = () => [];',
      'a call-derived built-in prototype alias write',
    ],
    [
      'const prototypeAlias = ([] as any).__proto__; prototypeAlias.flatMap = () => [];',
      'a __proto__-derived built-in prototype alias write',
    ],
    [
      'Reflect.apply(Object.assign, Object, [Array.prototype, { flatMap: () => [] }]);',
      'an applied built-in prototype mutation function',
    ],
  ] as const) {
    fs.writeFileSync(
      path.join(runtimeClosureFixtureRoot, 'web/instrumentation.ts'),
      source,
    );
    assert.throws(
      () =>
        deriveP9ApplicationReadRuntimeBinding({
          runtimeCommit,
          repositoryRoot: runtimeClosureFixtureRoot,
        }),
      /runtime source mutates a built-in prototype: web\/instrumentation\.ts/,
      `${label} cannot alter mapper intrinsics`,
    );
  }
  for (const [source, label] of [
    [
      "eval('Array.prototype.flatMap = () => []')",
      'eval-based prototype mutation',
    ],
    [
      "Function('Array.prototype.flatMap = () => []')()",
      'Function-constructor prototype mutation',
    ],
    [
      "const Maker = (() => {}).constructor; Maker('Array.prototype.flatMap = () => []')();",
      'function-object constructor prototype mutation',
    ],
    [
      "Reflect.apply(Function, null, ['Array.prototype.flatMap = () => []'])();",
      'reflectively applied Function constructor mutation',
    ],
    [
      "import vm from 'node:vm'; vm.runInThisContext('Array.prototype.flatMap = () => []');",
      'node vm prototype mutation',
    ],
    [
      "import('data:text/javascript;base64,QXJyYXkucHJvdG90eXBlLmZsYX...')",
      'data URL dynamic import mutation',
    ],
    [
      "import * as childProcess from 'node:child_process'; childProcess.exec('node -e \\\"Array.prototype.flatMap = () => []\\\"');",
      'child-process execution mutation',
    ],
    [
      "import * as childProcess from 'node:child_process'; const command = 'node'; childProcess.spawn(command, ['-e', 'Array.prototype.flatMap = () => []']);",
      'child-process dynamic spawn mutation',
    ],
    [
      "import { spawn } from 'node:child_process'; Reflect.apply(spawn, null, ['node']);",
      'reflectively applied child-process spawn mutation',
    ],
    [
      "export { spawn } from 'node:child_process';",
      're-exported child-process spawn mutation capability',
    ],
    [
      "export { spawn as run } from 'node:child_process';",
      'aliased re-exported child-process spawn mutation capability',
    ],
    [
      "export * from 'node:child_process';",
      'star re-exported child-process mutation capability',
    ],
    [
      "import { execFile } from 'node:child_process'; execFile('git', ['diff', '--ext-diff', 'HEAD^', 'HEAD']);",
      'git external-diff execution mutation capability',
    ],
  ] as const) {
    fs.writeFileSync(
      path.join(runtimeClosureFixtureRoot, 'web/instrumentation.ts'),
      source,
    );
    assert.throws(
      () =>
        deriveP9ApplicationReadRuntimeBinding({
          runtimeCommit,
          repositoryRoot: runtimeClosureFixtureRoot,
        }),
      /runtime source contains dynamic execution: web\/instrumentation\.ts/,
      `${label} is rejected from the runtime closure`,
    );
  }
  const prototypeExportPath = path.join(
    runtimeClosureFixtureRoot,
    'web/prototype-source.ts',
  );
  for (const [exportSource, consumerSource, label] of [
    [
      'export const prototypeAlias = Array.prototype;',
      "import { prototypeAlias } from './prototype-source'; prototypeAlias.flatMap = () => [];",
      'a direct exported prototype alias',
    ],
    [
      'export const prototypeBox = { value: Array.prototype };',
      "import { prototypeBox } from './prototype-source'; prototypeBox.value.flatMap = () => [];",
      'an exported prototype container',
    ],
    [
      'export function getPrototype() { return Array.prototype; }',
      "import { getPrototype } from './prototype-source'; getPrototype().flatMap = () => [];",
      'an exported prototype-returning function',
    ],
    [
      'const prototypeAlias = Array.prototype; export { prototypeAlias };',
      "import { prototypeAlias } from './prototype-source'; prototypeAlias.flatMap = () => [];",
      'a named local prototype export',
    ],
    [
      'export class PrototypeBox { static value = Array.prototype; }',
      "import { PrototypeBox } from './prototype-source'; PrototypeBox.value.flatMap = () => [];",
      'an exported class prototype field',
    ],
    [
      'const prototypeBox = { value: Array.prototype }; export { prototypeBox };',
      "import { prototypeBox } from './prototype-source'; prototypeBox.value.flatMap = () => [];",
      'a named exported prototype container',
    ],
    [
      'const prototypeBox: any = {}; prototypeBox.value = Array.prototype; export { prototypeBox };',
      "import { prototypeBox } from './prototype-source'; prototypeBox.value.flatMap = () => [];",
      'a post-initialization exported prototype container',
    ],
    [
      'const prototypeBox: any = {}; Object.assign(prototypeBox, { value: Array.prototype }); export { prototypeBox };',
      "import { prototypeBox } from './prototype-source'; prototypeBox.value.flatMap = () => [];",
      'an Object.assign-mutated exported prototype container',
    ],
    [
      "const prototypeBox: any = {}; Reflect.set(prototypeBox, 'value', Array.prototype); export { prototypeBox };",
      "import { prototypeBox } from './prototype-source'; prototypeBox.value.flatMap = () => [];",
      'a Reflect.set-mutated exported prototype container',
    ],
    [
      'const prototypeBox: any = {}; function selectedBox() { return prototypeBox; } Object.assign(selectedBox(), { value: Array.prototype }); export { prototypeBox };',
      "import { prototypeBox } from './prototype-source'; prototypeBox.value.flatMap = () => [];",
      'an Object.assign-mutated call-selected prototype container',
    ],
    [
      "const prototypeBox: any = {}; function selectedBox() { return prototypeBox; } Reflect.set(selectedBox(), 'value', Array.prototype); export { prototypeBox };",
      "import { prototypeBox } from './prototype-source'; prototypeBox.value.flatMap = () => [];",
      'a Reflect.set-mutated call-selected prototype container',
    ],
    [
      'const prototypeBox: any = {}; function selectedBox() { return prototypeBox; } const pick = selectedBox; Object.assign(pick(), { value: Array.prototype }); export { prototypeBox };',
      "import { prototypeBox } from './prototype-source'; prototypeBox.value.flatMap = () => [];",
      'an aliased call-selected prototype container',
    ],
    [
      'export class PrototypeBox { static value: any; static { this.value = Array.prototype; } }',
      "import { PrototypeBox } from './prototype-source'; PrototypeBox.value.flatMap = () => [];",
      'an exported class static-block prototype container',
    ],
    [
      'const getPrototype = () => Array.prototype; export function exportedPrototype() { return getPrototype(); }',
      "import { exportedPrototype } from './prototype-source'; exportedPrototype().flatMap = () => [];",
      'a wrapped prototype-returning export',
    ],
    [
      'const prototypeAlias = Array.prototype; export = prototypeAlias;',
      "import prototypeAlias = require('./prototype-source'); prototypeAlias.flatMap = () => [];",
      'an export-equals/import-equals prototype alias',
    ],
  ] as const) {
    fs.writeFileSync(prototypeExportPath, `${exportSource}\n`);
    fs.writeFileSync(
      path.join(runtimeClosureFixtureRoot, 'web/instrumentation.ts'),
      consumerSource,
    );
    assert.throws(
      () =>
        deriveP9ApplicationReadRuntimeBinding({
          runtimeCommit,
          repositoryRoot: runtimeClosureFixtureRoot,
        }),
      /runtime source mutates a built-in prototype: web\/(?:instrumentation|prototype-source)\.ts/,
      `${label} cannot mutate mapper intrinsics across modules`,
    );
  }
} finally {
  fs.rmSync(runtimeClosureFixtureRoot, { recursive: true, force: true });
}
const expectedWriteSurfaceInventory: P9WriteSurfaceInventory =
  P9_REQUIRED_WRITE_SURFACES.map((surface) => ({
    ...surface,
    mutators: [
      'scope:https://www.googleapis.com/auth/spreadsheets',
      'spreadsheets.values.append',
    ],
    independentlyDerived: true as const,
    probeExport: 'p9WriteIsolationProbe' as const,
    googleSheetsClientConstructions: 1,
    guardedGoogleSheetsClientConstructions: 1,
    googleSheetsMutatorCalls: 1,
    guardedBeforeClientConstruction: true as const,
  })).sort(
    (left, right) => left.path.localeCompare(right.path) || left.id.localeCompare(right.id),
  );
const receiptDigests = {
  entry: '1'.repeat(64),
  deployment: '2'.repeat(64),
  post: '3'.repeat(64),
};
const runtimeIdentity = {
  accessMethod: 'vercel-production-environment-api-bounded-read' as const,
  credentialSource:
    'authenticated-vercel-project-production-environment' as const,
  credentialKey: 'GOOGLE_SERVICE_ACCOUNT_CREDENTIALS' as const,
  environmentVariableIdSha256: '8'.repeat(64),
  environmentVariableUpdatedAt: '2026-08-30T20:14:00Z',
  principalFingerprintSha256: runtimeIdentityFingerprint,
  runtimeOAuthScopes: [P9_READ_ONLY_OAUTH_SCOPE] as [
    typeof P9_READ_ONLY_OAUTH_SCOPE,
  ],
  evidenceOAuthScopes: [
    P9_DRIVE_METADATA_SCOPE,
    P9_READ_ONLY_OAUTH_SCOPE,
  ] as [typeof P9_DRIVE_METADATA_SCOPE, typeof P9_READ_ONLY_OAUTH_SCOPE],
};

assert.ok(
  P9_TRUSTED_PROOF_PATHS.includes('.github/workflows/ci.yml'),
  'the hosted acceptance verifier workflow is hash-bound as trusted proof code',
);
for (const validatorDependency of [
  'web/scripts/delivery-state-history.ts',
  'web/scripts/delivery-package-history.ts',
  'web/scripts/governance-history.ts',
]) {
  assert.ok(
    P9_TRUSTED_PROOF_PATHS.includes(
      validatorDependency as (typeof P9_TRUSTED_PROOF_PATHS)[number],
    ),
    `the validator dependency ${validatorDependency} is in the immutable trusted closure`,
  );
}

const context: P9EvidenceContext = {
  p9BaselineCommit: baselineCommit,
  p9BaselineCommittedAt: '2026-08-30T20:10:00Z',
  revision7AttestationCommit,
  revision7AttestationCommittedAt: '2026-08-30T20:00:00Z',
  revision7CandidateCommit,
  trustedProofCandidateCommit,
  trustedProofAttestationCommit,
  candidateCommit,
  candidateCommittedAt: '2026-08-30T21:00:00Z',
  runtimePrincipalFingerprintSha256: runtimeIdentityFingerprint,
  providerProjectFingerprintSha256: '4'.repeat(64),
  providerTeamFingerprintSha256: '5'.repeat(64),
  providerCanonicalProductionHostnameSha256:
    p9CanonicalProductionHostnameFingerprint(canonicalProductionHostname),
  hostedVerificationEnvironmentFingerprintSha256:
    p9HostedVerificationEnvironmentFingerprint(P9_EVIDENCE_ENVIRONMENT),
  runtimeCredentialProvenanceFingerprintSha256:
    p9RuntimeCredentialProvenanceFingerprint(runtimeIdentity),
  expectedStaticCatalogSha256: staticCatalogSha256,
  expectedWriteSurfaceInventory,
};

function attestation(
  subjectPath: string,
  subjectSha256: string,
): P9AttestationVerification {
  return {
    verified: true,
    subjectPath,
    subjectSha256,
    repository: P9_EVIDENCE_REPOSITORY,
    signerWorkflow: P9_SIGNER_WORKFLOW,
    sourceDigest: workflowCommit,
    denySelfHostedRunners: true,
  };
}

const applicationGridData = [
  [{ startRow: 0, rowData: [{ values: [{ formattedValue: 'Alpha' }] }] }],
  [{ startRow: 0, rowData: [{ values: [{ formattedValue: 'Beta' }] }] }],
] as const;

function applicationReadChallenge(
  challengeNonce: string,
): NonNullable<P9SourceObservation['applicationReadChallenge']> {
  return {
    domain: P9_APPLICATION_READ_CHALLENGE_DOMAIN,
    nonce: challengeNonce,
    hashAlgorithm: P9_APPLICATION_READ_CHALLENGE_HASH_ALGORITHM,
    tabs: P9_AUTHORIZED_PRODUCTION_TABS.map((tab, index) => ({
      ...tab,
      nonceBoundCanonicalGridDataSha256: p9ApplicationReadChallengeSha256(
        challengeNonce,
        tab,
        applicationGridData[index],
      ),
    })) as [
      (typeof P9_AUTHORIZED_PRODUCTION_TABS)[0] & {
        nonceBoundCanonicalGridDataSha256: string;
      },
      (typeof P9_AUTHORIZED_PRODUCTION_TABS)[1] & {
        nonceBoundCanonicalGridDataSha256: string;
      },
    ],
  };
}

function sourceObservation(
  startedAt: string,
  completedAt: string,
  challengeNonce: string | null = null,
): P9SourceObservation {
  const base: Omit<P9SourceObservation, 'observationId'> = {
    startedAt,
    completedAt,
    spreadsheetId: P9_PRODUCTION_SPREADSHEET_ID,
    revisionBefore: '9857' as const,
    revisionAfter: '9857' as const,
    sharingBeforeSha256: '9'.repeat(64),
    sharingAfterSha256: '9'.repeat(64),
    runtimePrincipalPermission: {
      permissionIdSha256: '8'.repeat(64),
      type: 'user' as const,
      role: 'reader' as const,
      direct: true as const,
      expirationTime: null,
    },
    backupReadPrincipalFingerprintSha256: runtimeIdentityFingerprint,
    operations: [
      {
        service: 'drive' as const,
        method: 'files.get+permissions.list+revisions.list' as const,
        fields:
          'file(id,name,mimeType,modifiedTime,version,capabilities,permissions);latestRevision(id,modifiedTime)' as const,
      },
      {
        service: 'sheets' as const,
        method: 'spreadsheets.get' as const,
        spreadsheetId: P9_PRODUCTION_SPREADSHEET_ID,
        ranges: [
          P9_AUTHORIZED_PRODUCTION_TABS[0].boundedRange,
          P9_AUTHORIZED_PRODUCTION_TABS[1].boundedRange,
        ] as const,
        includeGridData: true as const,
      },
      {
        service: 'sheets' as const,
        method: 'spreadsheets.get' as const,
        spreadsheetIds: [
          P9_VERIFIED_BACKUPS[0].backupSpreadsheetId,
          P9_VERIFIED_BACKUPS[1].backupSpreadsheetId,
        ] as const,
        ranges: [
          P9_AUTHORIZED_PRODUCTION_TABS[0].boundedRange,
          P9_AUTHORIZED_PRODUCTION_TABS[1].boundedRange,
        ] as const,
        includeGridData: true as const,
      },
    ],
    tabs: P9_AUTHORIZED_PRODUCTION_TABS.map((tab) => {
      const backup = P9_VERIFIED_BACKUPS.find((item) => item.sourceSheetId === tab.sheetId)!;
      return {
        ...tab,
        backupSpreadsheetId: backup.backupSpreadsheetId,
        historicalSourceAndBackupSha256: backup.nativeCellPayloadSha256,
        canonicalCellPayloadHashAlgorithm:
          'google-sheets-v4-griddata-canonical-json-v1' as const,
        sourceCanonicalCellPayloadSha256: backup.nativeCellPayloadSha256,
        backupCanonicalCellPayloadSha256: backup.nativeCellPayloadSha256,
      };
    }) as [
      {
        sheetId: number;
        title: string;
        rowCount: number;
        columnCount: number;
        boundedRange: string;
        backupSpreadsheetId: string;
        historicalSourceAndBackupSha256: string;
        canonicalCellPayloadHashAlgorithm: 'google-sheets-v4-griddata-canonical-json-v1';
        sourceCanonicalCellPayloadSha256: string;
        backupCanonicalCellPayloadSha256: string;
      },
      {
        sheetId: number;
        title: string;
        rowCount: number;
        columnCount: number;
        boundedRange: string;
        backupSpreadsheetId: string;
        historicalSourceAndBackupSha256: string;
        canonicalCellPayloadHashAlgorithm: 'google-sheets-v4-griddata-canonical-json-v1';
        sourceCanonicalCellPayloadSha256: string;
        backupCanonicalCellPayloadSha256: string;
      },
    ],
    applicationReadChallenge:
      challengeNonce === null ? null : applicationReadChallenge(challengeNonce),
  };
  return { observationId: sha256P9Value(base), ...base };
}

const entryReceipt: P9EntryReceipt = {
  schemaVersion: 2,
  stageId: 'P9',
  receiptType: 'entry',
  p9BaselineCommit: baselineCommit,
  revision7AttestationCommit,
  capture: {
    repository: P9_EVIDENCE_REPOSITORY,
    workflowPath: P9_TRUSTED_WORKFLOW_PATH,
    workflowCommit,
    runId: 1001,
    runAttempt: 1,
    jobName: 'entry',
    event: 'workflow_dispatch',
    environment: P9_EVIDENCE_ENVIRONMENT,
    headSha: baselineCommit,
    startedAt: '2026-08-30T20:15:00Z',
    completedAt: '2026-08-30T20:25:00Z',
  },
  baselineProductionDeployment: (() => {
    const base = {
      deploymentId: 'dpl_Revision7Baseline',
      urlHost: canonicalProductionHostname,
      target: 'production' as const,
      readyState: 'READY' as const,
      createdAt: '2026-08-30T20:11:00Z',
      readyAt: '2026-08-30T20:12:00Z',
      projectIdSha256: '4'.repeat(64),
      teamIdSha256: '5'.repeat(64),
      gitSource: {
        type: 'github' as const,
        repositoryId: 12345,
        ref: 'main' as const,
        sha: baselineCommit,
      },
    };
    return { observationId: sha256P9Value(base), ...base };
  })(),
  productionSpreadsheetId: P9_PRODUCTION_SPREADSHEET_ID,
  runtimeIdentity,
  sourceObservation: sourceObservation(
    '2026-08-30T20:16:00Z',
    '2026-08-30T20:20:00Z',
  ),
};

const writeSurfaces = P9_REQUIRED_WRITE_SURFACES.map((item) => item.id);
const cutoverConfig: P9RuntimeConfig = {
  schemaVersion: 1 as const,
  sourceMode: 'production-google-sheet-read-only' as const,
  productionRead: {
    spreadsheetId: P9_PRODUCTION_SPREADSHEET_ID,
    oauthScopes: [P9_READ_ONLY_OAUTH_SCOPE] as [typeof P9_READ_ONLY_OAUTH_SCOPE],
    tabs: [
      {
        sheetId: P9_AUTHORIZED_PRODUCTION_TABS[0].sheetId,
        boundedRange: P9_AUTHORIZED_PRODUCTION_TABS[0].boundedRange,
      },
      {
        sheetId: P9_AUTHORIZED_PRODUCTION_TABS[1].sheetId,
        boundedRange: P9_AUTHORIZED_PRODUCTION_TABS[1].boundedRange,
      },
    ],
  },
  staticCatalog: null,
  writePolicy: {
    spreadsheetId: P9_TESTING_SPREADSHEET_ID,
    blockedSpreadsheetIds: [P9_PRODUCTION_SPREADSHEET_ID] as [
      typeof P9_PRODUCTION_SPREADSHEET_ID,
    ],
    productionWritesDisabled: true as const,
    writerEnabled: false,
    surfaces: [...writeSurfaces],
  },
  mappingVersion: 'p9-v1',
  runtimeIdentityFingerprintSha256: runtimeIdentityFingerprint,
};

const rollbackConfig: P9RuntimeConfig = {
  ...cutoverConfig,
  sourceMode: 'accepted-p7-static-catalog' as const,
  productionRead: null,
  staticCatalog: {
    path: 'web/fixtures/p7/student-catalog.json' as const,
    sha256: staticCatalogSha256,
  },
};

function deploymentObservation(
  role: 'cutover' | 'rollback' | 'restored-cutover',
  index: number,
  config: P9RuntimeConfig,
  createdAt: string,
  readyAt: string,
  observedAt: string,
): P9DeploymentRecord['deployments']['cutover'] {
  const deployment = `dpl_Proof${index}`;
  const phaseNonce = String(index).repeat(32);
  const phaseChallenge = applicationReadChallenge(phaseNonce);
  const jobName =
    role === 'cutover'
      ? ('cutover-proof' as const)
      : role === 'rollback'
        ? ('rollback-proof' as const)
        : ('restored-cutover-proof' as const);
  const applicationReadProbe =
    role === 'rollback'
      ? null
      : (() => {
          const probe: Omit<
            NonNullable<
              P9DeploymentRecord['deployments']['cutover']['health']['applicationReadProbe']
            >,
            'observationId'
          > = {
            domain: P9_APPLICATION_READ_CHALLENGE_DOMAIN,
            challengeHashAlgorithm:
              P9_APPLICATION_READ_CHALLENGE_HASH_ALGORITHM,
            nonce: phaseNonce,
            startedAt: new Date(Date.parse(observedAt) - 20_000).toISOString(),
            completedAt: new Date(Date.parse(observedAt) - 10_000).toISOString(),
            spreadsheetId: P9_PRODUCTION_SPREADSHEET_ID,
            oauthScopes: [P9_READ_ONLY_OAUTH_SCOPE] as [
              typeof P9_READ_ONLY_OAUTH_SCOPE,
            ],
            tabs: phaseChallenge.tabs,
            runtimeBinding: applicationRuntimeBinding,
          };
          return { observationId: sha256P9Value(probe), ...probe };
        })();
  const base = {
    role,
    deploymentId: deployment,
    urlHost: canonicalProductionHostname,
    target: 'production' as const,
    readyState: 'READY' as const,
    createdAt,
    readyAt,
    capture: {
      ...entryReceipt.capture,
      runId: 1100 + index,
      jobName,
      startedAt: new Date(Date.parse(readyAt) + 30_000).toISOString(),
      completedAt: new Date(Date.parse(observedAt) + 3 * 60_000).toISOString(),
    },
    gitSource: {
      type: 'github' as const,
      repositoryId: 12345,
      ref: 'codex/p9-read-only-cutover',
      sha: runtimeCommit,
    },
    health: {
      observedAt,
      statusCode: 200 as const,
      contentType: 'application/json' as const,
      nonce: phaseNonce,
      commit: runtimeCommit,
      deploymentId: deployment,
      environment: 'production' as const,
      runtimeConfig: config,
      runtimeConfigSha256: sha256P9Value(config),
      applicationRuntimeBinding,
      applicationReadProbe,
    },
  };
  return { observationId: sha256P9Value(base), ...base };
}

const deploymentRecord: P9DeploymentRecord = {
  schemaVersion: 2,
  stageId: 'P9',
  receiptType: 'deployment',
  p9BaselineCommit: baselineCommit,
  runtimeCommit,
  revision7AttestationCommit,
  capture: {
    ...entryReceipt.capture,
    runId: 1002,
    jobName: 'finalize',
    headSha: baselineCommit,
    startedAt: '2026-08-30T20:56:00Z',
    completedAt: '2026-08-30T20:58:00Z',
  },
  provider: {
    name: 'vercel',
    apiVersion: 'v13',
    projectIdSha256: '4'.repeat(64),
    teamIdSha256: '5'.repeat(64),
  },
  deployments: {
    cutover: deploymentObservation(
      'cutover',
      1,
      cutoverConfig,
      '2026-08-30T20:31:00Z',
      '2026-08-30T20:32:00Z',
      '2026-08-30T20:33:00Z',
    ),
    rollback: deploymentObservation(
      'rollback',
      2,
      rollbackConfig,
      '2026-08-30T20:40:00Z',
      '2026-08-30T20:41:00Z',
      '2026-08-30T20:42:00Z',
    ),
    restoredCutover: deploymentObservation(
      'restored-cutover',
      3,
      cutoverConfig,
      '2026-08-30T20:50:00Z',
      '2026-08-30T20:51:00Z',
      '2026-08-30T20:52:00Z',
    ),
  },
};

const postReceipt: P9PostCutoverReceipt = {
  schemaVersion: 2,
  stageId: 'P9',
  receiptType: 'post-cutover',
  p9BaselineCommit: baselineCommit,
  runtimeCommit,
  revision7AttestationCommit,
  capture: {
    ...deploymentRecord.capture,
  },
  deploymentObservationIds: {
    cutover: deploymentRecord.deployments.cutover.observationId,
    rollback: deploymentRecord.deployments.rollback.observationId,
    restoredCutover: deploymentRecord.deployments.restoredCutover.observationId,
  },
  sourceObservations: [
    {
      phase: 'after-cutover-smoke',
      deploymentId: deploymentRecord.deployments.cutover.deploymentId,
      observation: sourceObservation(
        '2026-08-30T20:34:00Z',
        '2026-08-30T20:35:00Z',
        '1'.repeat(32),
      ),
    },
    {
      phase: 'after-rollback-proof',
      deploymentId: deploymentRecord.deployments.rollback.deploymentId,
      observation: sourceObservation(
        '2026-08-30T20:43:00Z',
        '2026-08-30T20:44:00Z',
        null,
      ),
    },
    {
      phase: 'after-restored-cutover',
      deploymentId: deploymentRecord.deployments.restoredCutover.deploymentId,
      observation: sourceObservation(
        '2026-08-30T20:53:00Z',
        '2026-08-30T20:54:00Z',
        '3'.repeat(32),
      ),
    },
  ],
  writeIsolation: {
    testedCommit: runtimeCommit,
    runtimeBinding: applicationRuntimeBinding,
    runtimeStaticCatalogSha256: staticCatalogSha256,
    ciRunId: 1002,
    inventoryMethod: 'typescript-ast-complete-google-mutator-inventory',
    inventorySha256: sha256P9Value({
      inventoryMethod: 'typescript-ast-complete-google-mutator-inventory',
      surfaces: expectedWriteSurfaceInventory,
    }),
    discoveredSurfaceCount: expectedWriteSurfaceInventory.length,
    testStartedAt: '2026-08-30T20:54:00Z',
    testCompletedAt: '2026-08-30T20:55:00Z',
    testCommand:
      'node --import tsx scripts/p9-trusted-proof.ts --mode=write-isolation',
    testExitCode: 0,
    testOutputSha256: sha256P9Value({
      testCommand:
        'node --import tsx scripts/p9-trusted-proof.ts --mode=write-isolation',
      testedCommit: runtimeCommit,
      runtimeBinding: applicationRuntimeBinding,
      surfaces: expectedWriteSurfaceInventory.map((surface) => ({
        id: surface.id,
        path: surface.path,
        mutators: surface.mutators,
        independentlyDerived: true,
        probeExport: P9_WRITE_ISOLATION_PROBE_EXPORT,
        probeInvoked: true,
        guardedBeforeClientConstruction: true,
        negativeTestName: `p9-write-isolation:${surface.id}`,
        attemptedSpreadsheetId: P9_PRODUCTION_SPREADSHEET_ID,
        outcome: 'blocked-before-client-construction',
        guardErrorCode: 'P9_PRODUCTION_WRITE_BLOCKED',
        clientConstructions: 0,
        writeCalls: 0,
      })),
    }),
    surfaces: expectedWriteSurfaceInventory.map((surface) => ({
      id: surface.id,
      path: surface.path,
      mutators: surface.mutators,
      independentlyDerived: true as const,
      probeExport: 'p9WriteIsolationProbe' as const,
      probeInvoked: true as const,
      guardedBeforeClientConstruction: true as const,
      negativeTestName: `p9-write-isolation:${surface.id}`,
      attemptedSpreadsheetId: P9_PRODUCTION_SPREADSHEET_ID,
      outcome: 'blocked-before-client-construction' as const,
      guardErrorCode: 'P9_PRODUCTION_WRITE_BLOCKED' as const,
      clientConstructions: 0 as const,
      writeCalls: 0 as const,
    })),
  },
};

function refreshObservationId<T extends { observationId: string }>(value: T): void {
  const { observationId: _old, ...content } = value;
  value.observationId = sha256P9Value(content);
}

assert.ok(parseP9EntryReceipt(entryReceipt));
assert.ok(parseP9DeploymentRecord(deploymentRecord));
assert.ok(parseP9PostCutoverReceipt(postReceipt));
assert.deepEqual(
  validateP9EntryReceiptV2(
    entryReceipt,
    context,
    receiptDigests.entry,
    attestation('docs/evidence/P9-entry.json', receiptDigests.entry),
  ),
  [],
);
assert.deepEqual(
  validateP9DeploymentRecordV2(
    deploymentRecord,
    entryReceipt,
    context,
    receiptDigests.deployment,
    attestation('docs/evidence/P9-deployment.json', receiptDigests.deployment),
  ),
  [],
);
assert.deepEqual(
  validateP9PostCutoverReceiptV2(
    postReceipt,
    entryReceipt,
    deploymentRecord,
    context,
    receiptDigests.post,
    attestation('docs/evidence/P9-post-cutover.json', receiptDigests.post),
  ),
  [],
);
assert.deepEqual(
  validateP9ReceiptSetSemanticsV2(
    { entry: entryReceipt, deployment: deploymentRecord, postCutover: postReceipt },
    context,
  ),
  [],
  'the trusted finalizer can run the full pre-attestation relationship contract',
);
assert.match(
  validateP9ReceiptSetSemanticsV2(
    {
      entry: entryReceipt,
      deployment: deploymentRecord,
      postCutover: postReceipt,
      attestation: attestation('docs/evidence/P9-entry.json', receiptDigests.entry),
    },
    context,
  ).join('\n'),
  /Unrecognized key: "attestation"/,
  'the semantic-only path rejects a caller-supplied synthetic attestation',
);
assert.equal(deploymentRecord.capture.jobName, 'finalize');
assert.deepEqual(
  deploymentRecord.capture,
  postReceipt.capture,
  'both aggregate receipts retain the actual finalize-job capture',
);

const reversedFinalizeChronology = structuredClone(postReceipt);
reversedFinalizeChronology.writeIsolation.testCompletedAt =
  reversedFinalizeChronology.capture.startedAt;
assert.match(
  validateP9PostCutoverReceiptV2(
    reversedFinalizeChronology,
    entryReceipt,
    deploymentRecord,
    context,
    receiptDigests.post,
    attestation('docs/evidence/P9-post-cutover.json', receiptDigests.post),
  ).join('\n'),
  /must finish strictly before the next phase starts/,
  'write isolation must finish strictly before the real finalize job starts',
);

assert.equal(
  parseP9DeploymentRecord({
    ...deploymentRecord,
    capture: { ...deploymentRecord.capture, jobName: 'deployment-proof' },
  }),
  null,
  'synthetic aggregate job names are rejected',
);

assert.equal(
  parseP9EntryReceipt({
    ...entryReceipt,
    runtimeIdentity: {
      ...entryReceipt.runtimeIdentity,
      accessMethod: 'vercel-production-service-account-bounded-read',
    },
  }),
  null,
  'self-asserted runtime identity provenance is rejected',
);

assert.equal(
  parseP9EntryReceipt({ ...entryReceipt, undeclared: true }),
  null,
  'strict schema rejects an unknown top-level field',
);
assert.equal(
  parseP9DeploymentRecord({
    ...deploymentRecord,
    provider: { ...deploymentRecord.provider, undeclared: true },
  }),
  null,
  'strict schema rejects an unknown nested provider field',
);
assert.equal(
  parseP9PostCutoverReceipt({
    ...postReceipt,
    writeIsolation: { ...postReceipt.writeIsolation, passed: true },
  }),
  null,
  'strict schema rejects assertion-only write evidence',
);

const strictNestedCases: Array<[unknown, string]> = [
  [
    {
      ...entryReceipt,
      capture: { ...entryReceipt.capture, undeclared: true },
    },
    'capture',
  ],
  [
    {
      ...entryReceipt,
      baselineProductionDeployment: {
        ...entryReceipt.baselineProductionDeployment,
        undeclared: true,
      },
    },
    'baseline deployment',
  ],
  [
    {
      ...entryReceipt,
      sourceObservation: {
        ...entryReceipt.sourceObservation,
        operations: [
          { ...entryReceipt.sourceObservation.operations[0], undeclared: true },
          ...entryReceipt.sourceObservation.operations.slice(1),
        ],
      },
    },
    'Google operation',
  ],
  [
    {
      ...deploymentRecord,
      deployments: {
        ...deploymentRecord.deployments,
        cutover: {
          ...deploymentRecord.deployments.cutover,
          health: {
            ...deploymentRecord.deployments.cutover.health,
            undeclared: true,
          },
        },
      },
    },
    'health',
  ],
  [
    {
      ...deploymentRecord,
      deployments: {
        ...deploymentRecord.deployments,
        rollback: {
          ...deploymentRecord.deployments.rollback,
          health: {
            ...deploymentRecord.deployments.rollback.health,
            runtimeConfig: {
              ...deploymentRecord.deployments.rollback.health.runtimeConfig,
              undeclared: true,
            },
          },
        },
      },
    },
    'runtime configuration',
  ],
];
for (const [value, label] of strictNestedCases) {
  assert.equal(
    label === 'health' || label === 'runtime configuration'
      ? parseP9DeploymentRecord(value)
      : parseP9EntryReceipt(value),
    null,
    `strict schema rejects unknown ${label} fields`,
  );
}

assert.equal(
  parseP9EntryReceipt({
    ...entryReceipt,
    capture: { ...entryReceipt.capture, startedAt: '2026-02-30T20:15:00Z' },
  }),
  null,
  'invalid calendar timestamps are rejected',
);

const staleEntry = structuredClone(entryReceipt);
staleEntry.capture.startedAt = '1970-01-01T00:00:00Z';
staleEntry.capture.completedAt = '1970-01-01T00:01:00Z';
assert.notDeepEqual(
  validateP9EntryReceiptV2(
    staleEntry,
    context,
    receiptDigests.entry,
    attestation('docs/evidence/P9-entry.json', receiptDigests.entry),
  ),
  [],
  'pre-Revision-7 evidence is rejected',
);

const fabricatedReady = structuredClone(entryReceipt);
fabricatedReady.baselineProductionDeployment.createdAt = '1970-01-01T00:00:00Z';
fabricatedReady.baselineProductionDeployment.readyAt = '1970-01-01T00:01:00Z';
refreshObservationId(fabricatedReady.baselineProductionDeployment);
assert.match(
  validateP9EntryReceiptV2(
    fabricatedReady,
    context,
    receiptDigests.entry,
    attestation('docs/evidence/P9-entry.json', receiptDigests.entry),
  ).join('\n'),
  /baseline commit to Revision 7 Production deployment/,
  'stale provider readiness cannot be substituted for Revision 7 Production',
);

for (const [field, wrong] of [
  ['subjectPath', 'docs/evidence/not-entry.json'],
  ['subjectSha256', '0'.repeat(64)],
  ['repository', 'other/repository'],
  ['signerWorkflow', 'github.com/other/workflow.yml'],
  ['sourceDigest', '0'.repeat(40)],
] as const) {
  const proof = attestation('docs/evidence/P9-entry.json', receiptDigests.entry);
  Object.assign(proof, { [field]: wrong });
  assert.match(
    validateP9EntryReceiptV2(
      entryReceipt,
      context,
      receiptDigests.entry,
      proof,
    ).join('\n'),
    /lacks exact GitHub OIDC attestation verification/,
    `wrong attestation ${field} is rejected`,
  );
}
const selfHostedAllowed = attestation(
  'docs/evidence/P9-entry.json',
  receiptDigests.entry,
);
selfHostedAllowed.denySelfHostedRunners = false;
assert.notDeepEqual(
  validateP9EntryReceiptV2(
    entryReceipt,
    context,
    receiptDigests.entry,
    selfHostedAllowed,
  ),
  [],
  'attestation verification must deny self-hosted runners',
);

assert.notDeepEqual(
  validateP9DeploymentRecordV2(
    deploymentRecord,
    entryReceipt,
    context,
    receiptDigests.deployment,
    null,
  ),
  [],
  'self-asserted provider JSON without GitHub OIDC verification is rejected',
);

const arbitraryDigest = structuredClone(deploymentRecord);
arbitraryDigest.deployments.cutover.health.runtimeConfigSha256 = '4'.repeat(64);
assert.notDeepEqual(
  validateP9DeploymentRecordV2(
    arbitraryDigest,
    entryReceipt,
    context,
    receiptDigests.deployment,
    attestation('docs/evidence/P9-deployment.json', receiptDigests.deployment),
  ),
  [],
  'an arbitrary runtime-config digest is rejected',
);

const missingApplicationRead = structuredClone(deploymentRecord);
missingApplicationRead.deployments.cutover.health.applicationReadProbe = null;
refreshObservationId(missingApplicationRead.deployments.cutover);
assert.match(
  validateP9DeploymentRecordV2(
    missingApplicationRead,
    entryReceipt,
    context,
    receiptDigests.deployment,
    attestation('docs/evidence/P9-deployment.json', receiptDigests.deployment),
  ).join('\n'),
  /requires a deployed application-path read probe/,
  'cutover cannot pass with configuration claims but no deployed application read',
);

const rollbackApplicationRead = structuredClone(deploymentRecord);
rollbackApplicationRead.deployments.rollback.health.applicationReadProbe =
  structuredClone(
    deploymentRecord.deployments.cutover.health.applicationReadProbe,
  );
assert.ok(rollbackApplicationRead.deployments.rollback.health.applicationReadProbe);
rollbackApplicationRead.deployments.rollback.health.applicationReadProbe.nonce =
  rollbackApplicationRead.deployments.rollback.health.nonce;
refreshObservationId(
  rollbackApplicationRead.deployments.rollback.health.applicationReadProbe,
);
refreshObservationId(rollbackApplicationRead.deployments.rollback);
assert.match(
  validateP9DeploymentRecordV2(
    rollbackApplicationRead,
    entryReceipt,
    context,
    receiptDigests.deployment,
    attestation('docs/evidence/P9-deployment.json', receiptDigests.deployment),
  ).join('\n'),
  /rollback application-path read probe must be null/,
  'rollback must prove the accepted static catalog path without a production read',
);

const mismatchedApplicationNonce = structuredClone(deploymentRecord);
const mismatchedNonceProbe =
  mismatchedApplicationNonce.deployments.cutover.health.applicationReadProbe;
assert.ok(mismatchedNonceProbe);
mismatchedNonceProbe.nonce = 'n'.repeat(32);
refreshObservationId(mismatchedNonceProbe);
refreshObservationId(mismatchedApplicationNonce.deployments.cutover);
assert.match(
  validateP9DeploymentRecordV2(
    mismatchedApplicationNonce,
    entryReceipt,
    context,
    receiptDigests.deployment,
    attestation('docs/evidence/P9-deployment.json', receiptDigests.deployment),
  ).join('\n'),
  /application-path read probe nonce does not match health/,
  'a correctly rehashed application probe cannot be replayed under another health nonce',
);

const staleApplicationRead = structuredClone(deploymentRecord);
const staleApplicationProbe =
  staleApplicationRead.deployments.restoredCutover.health.applicationReadProbe;
assert.ok(staleApplicationProbe);
staleApplicationProbe.startedAt = '2026-08-30T20:00:00Z';
staleApplicationProbe.completedAt = '2026-08-30T20:00:10Z';
refreshObservationId(staleApplicationProbe);
refreshObservationId(staleApplicationRead.deployments.restoredCutover);
assert.match(
  validateP9DeploymentRecordV2(
    staleApplicationRead,
    entryReceipt,
    context,
    receiptDigests.deployment,
    attestation('docs/evidence/P9-deployment.json', receiptDigests.deployment),
  ).join('\n'),
  /application-path read start after capture start chronology is invalid/,
  'an old application read cannot be rebound to a fresh deployment health proof',
);

const wrongApplicationTabIdentity = structuredClone(deploymentRecord);
const wrongApplicationTabProbe =
  wrongApplicationTabIdentity.deployments.cutover.health.applicationReadProbe;
assert.ok(wrongApplicationTabProbe);
Object.assign(wrongApplicationTabProbe.tabs[0], { title: 'Wrong tab' });
refreshObservationId(wrongApplicationTabProbe);
refreshObservationId(wrongApplicationTabIdentity.deployments.cutover);
assert.equal(
  parseP9DeploymentRecord(wrongApplicationTabIdentity),
  null,
  'the deployed application probe must name the exact authorized tab identity',
);

const wrongApplicationScope = structuredClone(deploymentRecord);
const wrongApplicationScopeProbe =
  wrongApplicationScope.deployments.cutover.health.applicationReadProbe;
assert.ok(wrongApplicationScopeProbe);
Object.assign(wrongApplicationScopeProbe, {
  oauthScopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
refreshObservationId(wrongApplicationScopeProbe);
refreshObservationId(wrongApplicationScope.deployments.cutover);
assert.equal(
  parseP9DeploymentRecord(wrongApplicationScope),
  null,
  'the deployed application probe rejects write-capable or additional OAuth scopes',
);

const wrongProvider = structuredClone(deploymentRecord);
wrongProvider.provider.projectIdSha256 = '6'.repeat(64);
assert.match(
  validateP9DeploymentRecordV2(
    wrongProvider,
    entryReceipt,
    context,
    receiptDigests.deployment,
    attestation('docs/evidence/P9-deployment.json', receiptDigests.deployment),
  ).join('\n'),
  /provider differs/,
  'a provider fingerprint from another project is rejected',
);

const alternateProjectEntry = structuredClone(entryReceipt);
alternateProjectEntry.baselineProductionDeployment.projectIdSha256 =
  '6'.repeat(64);
refreshObservationId(alternateProjectEntry.baselineProductionDeployment);
const alternateProjectDeployment = structuredClone(deploymentRecord);
alternateProjectDeployment.provider.projectIdSha256 = '6'.repeat(64);
assert.match(
  validateP9EntryReceiptV2(
    alternateProjectEntry,
    context,
    receiptDigests.entry,
    attestation('docs/evidence/P9-entry.json', receiptDigests.entry),
  ).join('\n'),
  /entry provider differs from the pinned provider project or team/,
  'entry validation independently anchors the Vercel project',
);
assert.match(
  validateP9DeploymentRecordV2(
    alternateProjectDeployment,
    alternateProjectEntry,
    context,
    receiptDigests.deployment,
    attestation('docs/evidence/P9-deployment.json', receiptDigests.deployment),
  ).join('\n'),
  /differs from the pinned provider project or team/,
  'a self-consistent same-repository deployment from another Vercel project is rejected',
);
assert.match(
  validateP9PostCutoverReceiptV2(
    postReceipt,
    entryReceipt,
    alternateProjectDeployment,
    context,
    receiptDigests.post,
    attestation('docs/evidence/P9-post-cutover.json', receiptDigests.post),
  ).join('\n'),
  /post-cutover provider differs from the pinned provider project or team/,
  'post-cutover validation independently anchors the provider project',
);

const alternateTeamEntry = structuredClone(entryReceipt);
alternateTeamEntry.baselineProductionDeployment.teamIdSha256 = '6'.repeat(64);
refreshObservationId(alternateTeamEntry.baselineProductionDeployment);
const alternateTeamDeployment = structuredClone(deploymentRecord);
alternateTeamDeployment.provider.teamIdSha256 = '6'.repeat(64);
assert.match(
  validateP9DeploymentRecordV2(
    alternateTeamDeployment,
    alternateTeamEntry,
    context,
    receiptDigests.deployment,
    attestation('docs/evidence/P9-deployment.json', receiptDigests.deployment),
  ).join('\n'),
  /differs from the pinned provider project or team/,
  'a self-consistent same-repository deployment from another Vercel team is rejected',
);

const alternateCanonicalHost = structuredClone(deploymentRecord);
for (const observation of [
  alternateCanonicalHost.deployments.cutover,
  alternateCanonicalHost.deployments.rollback,
  alternateCanonicalHost.deployments.restoredCutover,
]) {
  observation.urlHost = 'alternate.example.org';
  refreshObservationId(observation);
}
assert.match(
  validateP9DeploymentRecordV2(
    alternateCanonicalHost,
    entryReceipt,
    context,
    receiptDigests.deployment,
    attestation('docs/evidence/P9-deployment.json', receiptDigests.deployment),
  ).join('\n'),
  /differs from the pinned canonical production hostname/,
  'a self-consistent alternate production hostname is rejected',
);
const alternateCanonicalHostEntry = structuredClone(entryReceipt);
alternateCanonicalHostEntry.baselineProductionDeployment.urlHost =
  'alternate.example.org';
refreshObservationId(alternateCanonicalHostEntry.baselineProductionDeployment);
assert.match(
  validateP9EntryReceiptV2(
    alternateCanonicalHostEntry,
    context,
    receiptDigests.entry,
    attestation('docs/evidence/P9-entry.json', receiptDigests.entry),
  ).join('\n'),
  /entry production host differs from the pinned canonical production hostname/,
  'entry validation independently anchors the canonical production hostname',
);

const alternatePrincipalEntry = structuredClone(entryReceipt);
alternatePrincipalEntry.runtimeIdentity.principalFingerprintSha256 =
  '6'.repeat(64);
alternatePrincipalEntry.sourceObservation.backupReadPrincipalFingerprintSha256 =
  '6'.repeat(64);
refreshObservationId(alternatePrincipalEntry.sourceObservation);
const alternatePrincipalDeployment = structuredClone(deploymentRecord);
for (const observation of [
  alternatePrincipalDeployment.deployments.cutover,
  alternatePrincipalDeployment.deployments.rollback,
  alternatePrincipalDeployment.deployments.restoredCutover,
]) {
  observation.health.runtimeConfig.runtimeIdentityFingerprintSha256 =
    '6'.repeat(64);
  observation.health.runtimeConfigSha256 = sha256P9Value(
    observation.health.runtimeConfig,
  );
  refreshObservationId(observation);
}
assert.match(
  validateP9DeploymentRecordV2(
    alternatePrincipalDeployment,
    alternatePrincipalEntry,
    context,
    receiptDigests.deployment,
    attestation('docs/evidence/P9-deployment.json', receiptDigests.deployment),
  ).join('\n'),
  /runtime principal differs from the pinned identity/,
  'a self-consistent alternate runtime principal is rejected',
);

const alternateCredentialProvenance = structuredClone(entryReceipt);
alternateCredentialProvenance.runtimeIdentity.environmentVariableIdSha256 =
  '6'.repeat(64);
assert.match(
  validateP9EntryReceiptV2(
    alternateCredentialProvenance,
    context,
    receiptDigests.entry,
    attestation('docs/evidence/P9-entry.json', receiptDigests.entry),
  ).join('\n'),
  /runtime credential provenance differs from the pinned identity/,
  'alternate non-secret runtime credential provenance is rejected',
);

const wrongHostedEnvironmentPin: P9EvidenceContext = {
  ...context,
  hostedVerificationEnvironmentFingerprintSha256:
    p9HostedVerificationEnvironmentFingerprint('another-environment'),
};
assert.match(
  validateP9EntryReceiptV2(
    entryReceipt,
    wrongHostedEnvironmentPin,
    receiptDigests.entry,
    attestation('docs/evidence/P9-entry.json', receiptDigests.entry),
  ).join('\n'),
  /not bound to the pinned hosted verification environment/,
  'the trusted capture cannot be rebound to another hosted environment identity',
);

const wrongMode = structuredClone(deploymentRecord);
wrongMode.deployments.rollback.health.runtimeConfig.sourceMode =
  'production-google-sheet-read-only';
wrongMode.deployments.rollback.health.runtimeConfigSha256 = sha256P9Value(
  wrongMode.deployments.rollback.health.runtimeConfig,
);
refreshObservationId(wrongMode.deployments.rollback);
assert.match(
  validateP9DeploymentRecordV2(
    wrongMode,
    entryReceipt,
    context,
    receiptDigests.deployment,
    attestation('docs/evidence/P9-deployment.json', receiptDigests.deployment),
  ).join('\n'),
  /rollback runtime config/,
  'a correctly rehashed but wrong rollback mode is rejected',
);

const outOfOrder = structuredClone(deploymentRecord);
outOfOrder.deployments.rollback.createdAt = '2026-08-30T20:32:30Z';
refreshObservationId(outOfOrder.deployments.rollback);
assert.notDeepEqual(
  validateP9DeploymentRecordV2(
    outOfOrder,
    entryReceipt,
    context,
    receiptDigests.deployment,
    attestation('docs/evidence/P9-deployment.json', receiptDigests.deployment),
  ),
  [],
  'rollback before cutover health is rejected',
);

const staleCutover = structuredClone(deploymentRecord);
for (const observation of [
  staleCutover.deployments.cutover,
  staleCutover.deployments.rollback,
  staleCutover.deployments.restoredCutover,
]) {
  for (const key of ['createdAt', 'readyAt'] as const) {
    observation[key] = new Date(Date.parse(observation[key]) + 25 * 60 * 60_000).toISOString();
  }
  observation.capture.startedAt = new Date(
    Date.parse(observation.capture.startedAt) + 25 * 60 * 60_000,
  ).toISOString();
  observation.capture.completedAt = new Date(
    Date.parse(observation.capture.completedAt) + 25 * 60 * 60_000,
  ).toISOString();
  observation.health.observedAt = new Date(
    Date.parse(observation.health.observedAt) + 25 * 60 * 60_000,
  ).toISOString();
  refreshObservationId(observation);
}
staleCutover.capture.startedAt = new Date(
  Date.parse(staleCutover.capture.startedAt) + 25 * 60 * 60_000,
).toISOString();
staleCutover.capture.completedAt = new Date(
  Date.parse(staleCutover.capture.completedAt) + 25 * 60 * 60_000,
).toISOString();
assert.match(
  validateP9DeploymentRecordV2(
    staleCutover,
    entryReceipt,
    context,
    receiptDigests.deployment,
    attestation('docs/evidence/P9-deployment.json', receiptDigests.deployment),
  ).join('\n'),
  /entry-to-cutover freshness window/,
  'an entry proof older than 24 hours cannot authorize cutover',
);

const staleInterPhase = structuredClone(deploymentRecord);
for (const observation of [
  staleInterPhase.deployments.rollback,
  staleInterPhase.deployments.restoredCutover,
]) {
  for (const key of ['createdAt', 'readyAt'] as const) {
    observation[key] = new Date(
      Date.parse(observation[key]) + 25 * 60 * 60_000,
    ).toISOString();
  }
  observation.capture.startedAt = new Date(
    Date.parse(observation.capture.startedAt) + 25 * 60 * 60_000,
  ).toISOString();
  observation.capture.completedAt = new Date(
    Date.parse(observation.capture.completedAt) + 25 * 60 * 60_000,
  ).toISOString();
  observation.health.observedAt = new Date(
    Date.parse(observation.health.observedAt) + 25 * 60 * 60_000,
  ).toISOString();
  refreshObservationId(observation);
}
staleInterPhase.capture.startedAt = new Date(
  Date.parse(staleInterPhase.capture.startedAt) + 25 * 60 * 60_000,
).toISOString();
staleInterPhase.capture.completedAt = new Date(
  Date.parse(staleInterPhase.capture.completedAt) + 25 * 60 * 60_000,
).toISOString();
assert.match(
  validateP9DeploymentRecordV2(
    staleInterPhase,
    entryReceipt,
    context,
    receiptDigests.deployment,
    attestation('docs/evidence/P9-deployment.json', receiptDigests.deployment),
  ).join('\n'),
  /cutover-to-rollback freshness window/,
  'every successor phase must start within 24 hours of its predecessor proof',
);

const sharingDrift = structuredClone(postReceipt);
sharingDrift.sourceObservations[1].observation.sharingBeforeSha256 = 'a'.repeat(64);
sharingDrift.sourceObservations[1].observation.sharingAfterSha256 = 'a'.repeat(64);
refreshObservationId(sharingDrift.sourceObservations[1].observation);
assert.match(
  validateP9PostCutoverReceiptV2(
    sharingDrift,
    entryReceipt,
    deploymentRecord,
    context,
    receiptDigests.post,
    attestation('docs/evidence/P9-post-cutover.json', receiptDigests.post),
  ).join('\n'),
  /sharing fingerprint differs from entry/,
  'cross-phase sharing drift is rejected even when internally stable',
);

const backupMismatch = structuredClone(postReceipt);
backupMismatch.sourceObservations[0].observation.tabs[0]
  .backupCanonicalCellPayloadSha256 = 'b'.repeat(64);
refreshObservationId(backupMismatch.sourceObservations[0].observation);
assert.match(
  validateP9PostCutoverReceiptV2(
    backupMismatch,
    entryReceipt,
    deploymentRecord,
    context,
    receiptDigests.post,
    attestation('docs/evidence/P9-post-cutover.json', receiptDigests.post),
  ).join('\n'),
  /source, or backup fingerprint changed/,
  'fresh canonical source and backup hashes must match',
);

const canonicalDrift = structuredClone(postReceipt);
canonicalDrift.sourceObservations[2].observation.tabs[1]
  .sourceCanonicalCellPayloadSha256 = 'd'.repeat(64);
canonicalDrift.sourceObservations[2].observation.tabs[1]
  .backupCanonicalCellPayloadSha256 = 'd'.repeat(64);
refreshObservationId(canonicalDrift.sourceObservations[2].observation);
assert.match(
  validateP9PostCutoverReceiptV2(
    canonicalDrift,
    entryReceipt,
    deploymentRecord,
    context,
    receiptDigests.post,
    attestation('docs/evidence/P9-post-cutover.json', receiptDigests.post),
  ).join('\n'),
  /canonical source fingerprint differs from entry/,
  'cross-phase canonical source drift is rejected even when the backup matches',
);

const forgedApplicationReadDeployment = structuredClone(deploymentRecord);
const forgedApplicationReadProbe =
  forgedApplicationReadDeployment.deployments.cutover.health.applicationReadProbe;
assert.ok(forgedApplicationReadProbe);
forgedApplicationReadProbe.tabs[0].nonceBoundCanonicalGridDataSha256 =
  'd'.repeat(64);
refreshObservationId(forgedApplicationReadProbe);
refreshObservationId(forgedApplicationReadDeployment.deployments.cutover);
assert.deepEqual(
  validateP9DeploymentRecordV2(
    forgedApplicationReadDeployment,
    entryReceipt,
    context,
    receiptDigests.deployment,
    attestation('docs/evidence/P9-deployment.json', receiptDigests.deployment),
  ),
  [],
  'a self-consistent application hash still requires independent source reconciliation',
);
const forgedApplicationReadPost = structuredClone(postReceipt);
forgedApplicationReadPost.deploymentObservationIds.cutover =
  forgedApplicationReadDeployment.deployments.cutover.observationId;
assert.match(
  validateP9PostCutoverReceiptV2(
    forgedApplicationReadPost,
    entryReceipt,
    forgedApplicationReadDeployment,
    context,
    receiptDigests.post,
    attestation('docs/evidence/P9-post-cutover.json', receiptDigests.post),
  ).join('\n'),
  /nonce-bound application read differs from the independent challenge/,
  'a forged and correctly rehashed application payload is rejected by the independent read',
);

const arbitraryInventory = structuredClone(postReceipt);
arbitraryInventory.writeIsolation.inventorySha256 = 'f'.repeat(64);
assert.match(
  validateP9PostCutoverReceiptV2(
    arbitraryInventory,
    entryReceipt,
    deploymentRecord,
    context,
    receiptDigests.post,
    attestation('docs/evidence/P9-post-cutover.json', receiptDigests.post),
  ).join('\n'),
  /write-isolation report is incomplete or rebound/,
  'a SHA-shaped but underived writer inventory is rejected',
);

const runtimeCatalogSubstitution = structuredClone(postReceipt);
runtimeCatalogSubstitution.writeIsolation.runtimeStaticCatalogSha256 = 'd'.repeat(64);
assert.match(
  validateP9PostCutoverReceiptV2(
    runtimeCatalogSubstitution,
    entryReceipt,
    deploymentRecord,
    context,
    receiptDigests.post,
    attestation('docs/evidence/P9-post-cutover.json', receiptDigests.post),
  ).join('\n'),
  /runtime accepted-P7 catalog bytes/,
  'write-isolation must hash the catalog from the exact runtime checkout',
);

const duplicateSurface = structuredClone(postReceipt);
duplicateSurface.writeIsolation.surfaces[3] = structuredClone(
  duplicateSurface.writeIsolation.surfaces[0],
);
assert.notDeepEqual(
  validateP9PostCutoverReceiptV2(
    duplicateSurface,
    entryReceipt,
    deploymentRecord,
    context,
    receiptDigests.post,
    attestation('docs/evidence/P9-post-cutover.json', receiptDigests.post),
  ),
  [],
  'duplicate or missing writer surfaces are rejected',
);

const fifthSurface = {
  id: 'google-write-fifth-surface',
  path: 'web/src/lib/fifth-writer.ts',
  mutators: [
    'scope:https://www.googleapis.com/auth/spreadsheets',
    'spreadsheets.values.update',
  ],
  independentlyDerived: true as const,
  probeExport: 'p9WriteIsolationProbe' as const,
  googleSheetsClientConstructions: 1,
  guardedGoogleSheetsClientConstructions: 1,
  googleSheetsMutatorCalls: 1,
  guardedBeforeClientConstruction: true,
};
assert.match(
  validateP9PostCutoverReceiptV2(
    postReceipt,
    entryReceipt,
    deploymentRecord,
    {
      ...context,
      expectedWriteSurfaceInventory: [
        ...context.expectedWriteSurfaceInventory,
        fifthSurface,
      ],
    },
    receiptDigests.post,
    attestation('docs/evidence/P9-post-cutover.json', receiptDigests.post),
  ).join('\n'),
  /write-isolation report is incomplete or rebound/,
  'a newly derived fifth write surface cannot be omitted from the receipt',
);

const wrongAcceptedP7CatalogContext: P9EvidenceContext = {
  ...context,
  expectedStaticCatalogSha256: 'd'.repeat(64),
};
assert.match(
  validateP9DeploymentRecordV2(
    deploymentRecord,
    entryReceipt,
    wrongAcceptedP7CatalogContext,
    receiptDigests.deployment,
    attestation('docs/evidence/P9-deployment.json', receiptDigests.deployment),
  ).join('\n'),
  /exact accepted P7 static source/,
  'rollback evidence cannot follow a modified worktree catalog hash',
);

const inventoryFixtureRoot = fs.mkdtempSync(
  path.join(os.tmpdir(), 'p9-write-inventory-'),
);
try {
  const guardAbsolute = path.join(inventoryFixtureRoot, P9_WRITE_GUARD_MODULE_PATH);
  fs.mkdirSync(path.dirname(guardAbsolute), { recursive: true });
  fs.writeFileSync(
    guardAbsolute,
    "export const P9_PRODUCTION_WRITE_BLOCKED_CODE = 'P9_PRODUCTION_WRITE_BLOCKED';\nexport function guardP9SheetWrite<T>(_id: string, factory: () => T): T { return factory(); }\n",
  );
  const validSurfaceSource = (method = 'append') => [
    "import { guardP9SheetWrite } from '@/lib/p9-write-policy';",
    'export async function p9WriteIsolationProbe(spreadsheetId: string) {',
    '  return guardP9SheetWrite(spreadsheetId, async () => {',
    "    const scope = 'https://www.googleapis.com/auth/spreadsheets';",
    "    const sheets = google.sheets({ version: 'v4', scope });",
    `    return sheets.spreadsheets.values.${method}({ spreadsheetId });`,
    '  });',
    '}',
  ].join('\n');
  const fixturePaths = [
    ...P9_REQUIRED_WRITE_SURFACES.map((surface) => surface.path),
    fifthSurface.path,
  ];
  for (const fixturePath of fixturePaths) {
    const target = path.join(inventoryFixtureRoot, fixturePath);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, validSurfaceSource());
  }
  const runtimeNamedTest = path.join(inventoryFixtureRoot, 'web/scripts/runtime.test.ts');
  fs.mkdirSync(path.dirname(runtimeNamedTest), { recursive: true });
  fs.writeFileSync(runtimeNamedTest, validSurfaceSource('update'));
  const rootInstrumentation = path.join(inventoryFixtureRoot, 'web/instrumentation.ts');
  fs.writeFileSync(rootInstrumentation, validSurfaceSource('batchUpdate'));
  const ignoredTrustedVerifier = path.join(
    inventoryFixtureRoot,
    'web/scripts/p9-evidence-v2.ts',
  );
  fs.writeFileSync(
    ignoredTrustedVerifier,
    "const scope = 'https://www.googleapis.com/auth/spreadsheets'; google.sheets({}); sheets.spreadsheets.values.update({ spreadsheetId: PRODUCTION_ID });\n",
  );
  const derived = deriveP9WriteSurfaceInventory(inventoryFixtureRoot);
  assert.equal(
    derived.length,
    7,
    'AST discovery includes a fifth surface, runtime-named test, and web-root runtime file',
  );
  assert.ok(
    derived.every(
      (surface) =>
        surface.independentlyDerived &&
        surface.probeExport === P9_WRITE_ISOLATION_PROBE_EXPORT &&
        surface.guardedBeforeClientConstruction &&
        surface.googleSheetsClientConstructions === 1 &&
        surface.guardedGoogleSheetsClientConstructions === 1 &&
        surface.googleSheetsMutatorCalls === 1,
    ),
    'AST discovery independently proves guard-before-client construction',
  );
  assert.ok(
    derived.some(
      (surface) =>
        surface.path === fifthSurface.path &&
        surface.mutators.includes('spreadsheets.values.append'),
    ),
  );
  assert.ok(
    derived.every((surface) => surface.path !== 'web/scripts/p9-evidence-v2.ts'),
    'hash-bound trusted verifier literals do not pollute runtime inventory',
  );
  assert.ok(
    derived.some((surface) => surface.path === 'web/scripts/runtime.test.ts') &&
      derived.some((surface) => surface.path === 'web/instrumentation.ts'),
    'runtime-capable test names and web-root files are never filename-excluded',
  );

  const symlinkTarget = path.join(inventoryFixtureRoot, 'symlink-writer-target.ts');
  const symlinkPath = path.join(
    inventoryFixtureRoot,
    'web/src/symlinked-writer.ts',
  );
  fs.writeFileSync(symlinkTarget, validSurfaceSource());
  fs.symlinkSync(symlinkTarget, symlinkPath);
  assert.throws(
    () => deriveP9WriteSurfaceInventory(inventoryFixtureRoot),
    /P9 writer inventory rejected symbolic link: web\/src\/symlinked-writer\.ts/,
    'a symlinked runtime writer fails closed instead of disappearing from inventory',
  );
  fs.unlinkSync(symlinkPath);

  fs.writeFileSync(
    path.join(inventoryFixtureRoot, fifthSurface.path),
    [
      "import { guardP9SheetWrite } from '@/lib/p9-write-policy';",
      'export async function p9WriteIsolationProbe(spreadsheetId: string) {',
      '  return guardP9SheetWrite(spreadsheetId, async () => {',
      "    const scope = 'https://www.googleapis.com/auth/spreadsheets';",
      '    const sheets = google.sheets({ scope });',
      '    const append = sheets.spreadsheets.values.append;',
      '    return append({ spreadsheetId });',
      '  });',
      '}',
    ].join('\n'),
  );
  const aliased = deriveP9WriteSurfaceInventory(inventoryFixtureRoot).find(
    (surface) => surface.path === fifthSurface.path,
  );
  assert.ok(
    aliased?.mutators.includes('spreadsheets.values.append'),
    'an aliased mutator reference cannot disappear from inventory',
  );
  assert.equal(
    aliased?.guardedBeforeClientConstruction,
    false,
    'an aliased mutator reference fails closed because its target is not directly bound',
  );

  fs.writeFileSync(
    path.join(inventoryFixtureRoot, fifthSurface.path),
    [
      "import { guardP9SheetWrite } from '@/lib/p9-write-policy';",
      'export async function p9WriteIsolationProbe(spreadsheetId: string) {',
      '  return guardP9SheetWrite(spreadsheetId, async () => {',
      "    const scope = 'https://www.googleapis.com/auth/spreadsheets';",
      "    const sheets = google['sheets']({ scope });",
      "    return sheets['spreadsheets']['values']['update']({ spreadsheetId });",
      '  });',
      '}',
    ].join('\n'),
  );
  const elementAccess = deriveP9WriteSurfaceInventory(inventoryFixtureRoot).find(
    (surface) => surface.path === fifthSurface.path,
  );
  assert.ok(
    elementAccess?.mutators.includes('spreadsheets.values.update'),
    'string-literal element access is recognized as a Sheets mutator',
  );
  assert.equal(
    elementAccess?.guardedBeforeClientConstruction,
    true,
    'a direct element-access call remains provable when its target matches the guard',
  );

  fs.writeFileSync(
    path.join(inventoryFixtureRoot, fifthSurface.path),
    [
      "import { guardP9SheetWrite } from '@/lib/p9-write-policy';",
      'export async function p9WriteIsolationProbe(spreadsheetId: string) {',
      "  const productionId = 'production';",
      '  return guardP9SheetWrite(spreadsheetId, async () => {',
      "    const scope = 'https://www.googleapis.com/auth/spreadsheets';",
      '    const sheets = google.sheets({ scope });',
      '    return sheets.spreadsheets.values.update({ spreadsheetId: productionId });',
      '  });',
      '}',
    ].join('\n'),
  );
  const unguarded = deriveP9WriteSurfaceInventory(inventoryFixtureRoot).find(
    (surface) => surface.path === fifthSurface.path,
  );
  assert.equal(
    unguarded?.guardedBeforeClientConstruction,
    false,
    'a testing-ID guard cannot authenticate a production-ID mutator',
  );

  fs.writeFileSync(
    path.join(inventoryFixtureRoot, fifthSurface.path),
    [
      "import { guardP9SheetWrite } from '@/lib/p9-write-policy';",
      'export async function p9WriteIsolationProbe(spreadsheetId: string) {',
      "  const guardP9SheetWrite = (_id: string, callback: () => unknown) => callback();",
      '  return guardP9SheetWrite(spreadsheetId, async () => {',
      "    const scope = 'https://www.googleapis.com/auth/spreadsheets';",
      '    const sheets = google.sheets({ scope });',
      '    return sheets.spreadsheets.values.update({ spreadsheetId });',
      '  });',
      '}',
    ].join('\n'),
  );
  const shadowedGuard = deriveP9WriteSurfaceInventory(inventoryFixtureRoot).find(
    (surface) => surface.path === fifthSurface.path,
  );
  assert.equal(
    shadowedGuard?.guardedBeforeClientConstruction,
    false,
    'a local guard shadow cannot impersonate the exact imported guard symbol',
  );

  fs.writeFileSync(
    path.join(inventoryFixtureRoot, fifthSurface.path),
    [
      "import { guardP9SheetWrite } from '@/lib/p9-write-policy';",
      'export async function p9WriteIsolationProbe(spreadsheetId: string) {',
      '  return guardP9SheetWrite(spreadsheetId, async () => {',
      "    const spreadsheetId = 'production';",
      "    const scope = 'https://www.googleapis.com/auth/spreadsheets';",
      '    const sheets = google.sheets({ scope });',
      '    return sheets.spreadsheets.values.update({ spreadsheetId });',
      '  });',
      '}',
    ].join('\n'),
  );
  const shadowedTarget = deriveP9WriteSurfaceInventory(inventoryFixtureRoot).find(
    (surface) => surface.path === fifthSurface.path,
  );
  assert.equal(
    shadowedTarget?.guardedBeforeClientConstruction,
    false,
    'lexically shadowed spreadsheet identifiers cannot false-match the guard target',
  );

  fs.writeFileSync(
    path.join(inventoryFixtureRoot, fifthSurface.path),
    [
      "import { guardP9SheetWrite } from '@/lib/p9-write-policy';",
      'export async function p9WriteIsolationProbe(spreadsheetId: string) {',
      "  const destinationSpreadsheetId = 'production';",
      '  return guardP9SheetWrite(spreadsheetId, async () => {',
      "    const scope = 'https://www.googleapis.com/auth/spreadsheets';",
      '    const sheets = google.sheets({ scope });',
      '    return sheets.spreadsheets.sheets.copyTo({',
      '      spreadsheetId,',
      '      requestBody: { destinationSpreadsheetId },',
      '    });',
      '  });',
      '}',
    ].join('\n'),
  );
  const copyToDestination = deriveP9WriteSurfaceInventory(inventoryFixtureRoot).find(
    (surface) => surface.path === fifthSurface.path,
  );
  assert.equal(
    copyToDestination?.guardedBeforeClientConstruction,
    false,
    'copyTo binds its destinationSpreadsheetId, never its source spreadsheetId',
  );

  fs.writeFileSync(
    path.join(inventoryFixtureRoot, fifthSurface.path),
    validSurfaceSource('batchUpdateByDataFilter'),
  );
  const dataFilterWriter = deriveP9WriteSurfaceInventory(inventoryFixtureRoot).find(
    (surface) => surface.path === fifthSurface.path,
  );
  assert.equal(dataFilterWriter?.guardedBeforeClientConstruction, true);
  assert.ok(
    dataFilterWriter?.mutators.includes(
      'spreadsheets.values.batchUpdateByDataFilter',
    ),
    'data-filter writers are included in the complete mutator inventory',
  );

  fs.writeFileSync(
    path.join(inventoryFixtureRoot, fifthSurface.path),
    [
      "import { guardP9SheetWrite } from '@/lib/p9-write-policy';",
      'export async function p9WriteIsolationProbe(spreadsheetId: string) {',
      '  return guardP9SheetWrite(spreadsheetId, async () => {',
      '    return fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, { method: "POST" });',
      '  });',
      '}',
    ].join('\n'),
  );
  const rawRestWriter = deriveP9WriteSurfaceInventory(inventoryFixtureRoot).find(
    (surface) => surface.path === fifthSurface.path,
  );
  assert.ok(
    rawRestWriter?.mutators.includes('raw-rest-google-sheets-write'),
    'raw Sheets REST mutation URLs are inventoried',
  );
  assert.equal(
    rawRestWriter?.guardedBeforeClientConstruction,
    false,
    'raw REST writers are forbidden rather than silently omitted',
  );

  fs.writeFileSync(
    path.join(inventoryFixtureRoot, fifthSurface.path),
    [
      'export async function reviewerSplitStringBypass(id: string, body: unknown) {',
      "  const host = 'https://sheets.googleapis.com';",
      '  const op = `/v4/spreadsheets/${id}:batchUpdate`;',
      "  await fetch(host + op, { method: 'POST', body });",
      '}',
    ].join('\n'),
  );
  const reviewerSplitString = deriveP9WriteSurfaceInventory(
    inventoryFixtureRoot,
  ).find((surface) => surface.path === fifthSurface.path);
  assert.ok(
    reviewerSplitString?.mutators.includes('raw-rest-google-sheets-write'),
    'the reviewer split host/template operation/binary concatenation bypass is inventoried',
  );
  assert.equal(
    reviewerSplitString?.guardedBeforeClientConstruction,
    false,
    'the reviewer split-string REST bypass fails closed',
  );

  fs.writeFileSync(
    path.join(inventoryFixtureRoot, fifthSurface.path),
    [
      'const requestAlias = fetch;',
      'export async function aliasedFetchBypass(id: string) {',
      "  const host = 'https://sheets.' + 'googleapis.com';",
      '  const op = `/v4/spreadsheets/${id}/values/A1:append`;',
      "  return requestAlias(host + op, { method: 'POST' });",
      '}',
    ].join('\n'),
  );
  const aliasedFetchBypass = deriveP9WriteSurfaceInventory(
    inventoryFixtureRoot,
  ).find((surface) => surface.path === fifthSurface.path);
  assert.ok(
    aliasedFetchBypass?.mutators.includes('raw-rest-google-sheets-write'),
    'a fetch alias plus multiply composed Sheets host remains visible',
  );
  assert.equal(aliasedFetchBypass?.guardedBeforeClientConstruction, false);

  fs.writeFileSync(
    path.join(inventoryFixtureRoot, fifthSurface.path),
    [
      'export async function reflectApplyFetchBypass(id: string) {',
      '  const endpoint = `https://sheets.googleapis.com/v4/spreadsheets/${id}:batchUpdate`;',
      "  return Reflect.apply(fetch, null, [endpoint, { method: 'POST' }]);",
      '}',
    ].join('\n'),
  );
  const reflectApplyFetchBypass = deriveP9WriteSurfaceInventory(
    inventoryFixtureRoot,
  ).find((surface) => surface.path === fifthSurface.path);
  assert.ok(
    reflectApplyFetchBypass?.mutators.includes(
      'raw-rest-google-sheets-write',
    ),
    'Reflect.apply cannot hide a raw Sheets REST writer',
  );
  assert.equal(
    reflectApplyFetchBypass?.guardedBeforeClientConstruction,
    false,
    'indirect raw REST writers remain forbidden',
  );

  fs.writeFileSync(
    path.join(inventoryFixtureRoot, fifthSurface.path),
    [
      'export async function detachedFetchBypass(id: string) {',
      '  const endpoint = `https://sheets.googleapis.com/v4/spreadsheets/${id}:batchUpdate`;',
      "  return (0, fetch)(endpoint, { method: 'POST' });",
      '}',
    ].join('\n'),
  );
  const detachedFetchBypass = deriveP9WriteSurfaceInventory(
    inventoryFixtureRoot,
  ).find((surface) => surface.path === fifthSurface.path);
  assert.ok(
    detachedFetchBypass?.mutators.includes('raw-rest-google-sheets-write'),
    'a detached comma-expression fetch remains visible to writer discovery',
  );
  assert.equal(detachedFetchBypass?.guardedBeforeClientConstruction, false);

  fs.writeFileSync(
    path.join(inventoryFixtureRoot, fifthSurface.path),
    [
      'export async function reflectedDetachedFetchBypass(id: string) {',
      '  const endpoint = `https://sheets.googleapis.com/v4/spreadsheets/${id}:batchUpdate`;',
      "  return Reflect.apply((0, fetch), null, [endpoint, { method: 'POST' }]);",
      '}',
    ].join('\n'),
  );
  const reflectedDetachedFetchBypass = deriveP9WriteSurfaceInventory(
    inventoryFixtureRoot,
  ).find((surface) => surface.path === fifthSurface.path);
  assert.ok(
    reflectedDetachedFetchBypass?.mutators.includes(
      'raw-rest-google-sheets-write',
    ),
    'Reflect.apply cannot hide a detached comma-expression fetch',
  );
  assert.equal(
    reflectedDetachedFetchBypass?.guardedBeforeClientConstruction,
    false,
  );

  for (const [callExpression, label] of [
    [
      "(true ? fetch : fetch)(endpoint, { method: 'POST' })",
      'conditional fetch',
    ],
    [
      "(globalThis.fetch || fetch)(endpoint, { method: 'POST' })",
      'logical fetch',
    ],
    [
      "Reflect.apply(true ? fetch : fetch, null, [endpoint, { method: 'POST' }])",
      'reflected conditional fetch',
    ],
    [
      "[fetch][0](endpoint, { method: 'POST' })",
      'unfamiliar callable syntax with an exact Sheets target',
    ],
  ] as const) {
    fs.writeFileSync(
      path.join(inventoryFixtureRoot, fifthSurface.path),
      [
        `export async function conditionalWriter(id: string) {`,
        '  const endpoint = `https://sheets.googleapis.com/v4/spreadsheets/${id}:batchUpdate`;',
        `  return ${callExpression};`,
        '}',
      ].join('\n'),
    );
    const conditionalWriter = deriveP9WriteSurfaceInventory(
      inventoryFixtureRoot,
    ).find((surface) => surface.path === fifthSurface.path);
    assert.ok(
      conditionalWriter?.mutators.includes('raw-rest-google-sheets-write'),
      `${label} remains visible to writer discovery`,
    );
    assert.equal(conditionalWriter?.guardedBeforeClientConstruction, false);
  }

  fs.writeFileSync(
    path.join(inventoryFixtureRoot, fifthSurface.path),
    [
      'const transport = true ? fetch : fetch;',
      'export async function aliasedConditionalWriter(id: string) {',
      '  const endpoint = `https://sheets.googleapis.com/v4/spreadsheets/${id}:batchUpdate`;',
      "  return transport(endpoint, { method: 'POST' });",
      '}',
    ].join('\n'),
  );
  const aliasedConditionalWriter = deriveP9WriteSurfaceInventory(
    inventoryFixtureRoot,
  ).find((surface) => surface.path === fifthSurface.path);
  assert.ok(
    aliasedConditionalWriter?.mutators.includes('raw-rest-google-sheets-write'),
    'a conditional network alias remains visible to writer discovery',
  );
  assert.equal(aliasedConditionalWriter?.guardedBeforeClientConstruction, false);

  for (const [containerSource, label] of [
    [
      [
        "const request = { transport: fetch, url: endpoint, options: { method: 'POST' } };",
        'return request.transport(request.url, request.options);',
      ],
      'object request container',
    ],
    [
      [
        "const request = [fetch, endpoint, { method: 'POST' }] as const;",
        'return request[0](request[1], request[2]);',
      ],
      'array request container',
    ],
    [
      [
        "const request = new Map<string, unknown>([['transport', fetch], ['url', endpoint], ['options', { method: 'POST' }]]);",
        "return (request.get('transport') as typeof fetch)(request.get('url') as string, request.get('options') as RequestInit);",
      ],
      'Map request container',
    ],
  ] as const) {
    fs.writeFileSync(
      path.join(inventoryFixtureRoot, fifthSurface.path),
      [
        'export async function aggregateWriter(id: string) {',
        '  const endpoint = `https://sheets.googleapis.com/v4/spreadsheets/${id}:batchUpdate`;',
        ...containerSource.map((line) => `  ${line}`),
        '}',
      ].join('\n'),
    );
    const aggregateWriter = deriveP9WriteSurfaceInventory(
      inventoryFixtureRoot,
    ).find((surface) => surface.path === fifthSurface.path);
    assert.ok(
      aggregateWriter?.mutators.includes('raw-rest-google-sheets-write'),
      `${label} remains visible to writer discovery`,
    );
    assert.equal(aggregateWriter?.guardedBeforeClientConstruction, false);
  }

  for (const [containerSource, label] of [
    [
      "const request = { transport: (globalThis as any)['f' + 'etch'], url: endpoint, options: { method: 'POST' } };",
      'computed fetch capability',
    ],
    [
      "const request = { transport: fetch, url: endpoint, options: { method: ['P', 'OST'].join('') } };",
      'computed write method',
    ],
  ] as const) {
    fs.writeFileSync(
      path.join(inventoryFixtureRoot, fifthSurface.path),
      [
        'export async function computedAggregateWriter(id: string) {',
        '  const endpoint = `https://sheets.googleapis.com/v4/spreadsheets/${id}:batchUpdate`;',
        `  ${containerSource}`,
        '  return request.transport(request.url, request.options);',
        '}',
      ].join('\n'),
    );
    const computedAggregateWriter = deriveP9WriteSurfaceInventory(
      inventoryFixtureRoot,
    ).find((surface) => surface.path === fifthSurface.path);
    assert.ok(
      computedAggregateWriter?.mutators.includes(
        'raw-rest-google-sheets-write',
      ),
      `${label} remains visible to writer discovery`,
    );
    assert.equal(computedAggregateWriter?.guardedBeforeClientConstruction, false);
  }

  for (const [endpointSource, methodSource, label] of [
    [
      '`https://sheets.googleapis.com/v4/spreadsheets/${id}/values/A1`',
      "'P'.concat('UT')",
      'computed values-update writer',
    ],
    [
      "`https://sheets.googleapis.com/v4/spreadsheets/${id}` + String.fromCharCode(58, 98, 97, 116, 99, 104, 85, 112, 100, 97, 116, 101)",
      "'P'.concat('OST')",
      'computed batch-update writer',
    ],
  ] as const) {
    fs.writeFileSync(
      path.join(inventoryFixtureRoot, fifthSurface.path),
      [
        'export async function computedCharacterWriter(id: string) {',
        `  const endpoint = ${endpointSource};`,
        '  const request = {',
        '    transport: (globalThis as any)[String.fromCharCode(102, 101, 116, 99, 104)],',
        '    url: endpoint,',
        `    options: { method: ${methodSource} },`,
        '  };',
        '  return request.transport(request.url, request.options);',
        '}',
      ].join('\n'),
    );
    const computedCharacterWriter = deriveP9WriteSurfaceInventory(
      inventoryFixtureRoot,
    ).find((surface) => surface.path === fifthSurface.path);
    assert.ok(
      computedCharacterWriter?.mutators.some((mutator) =>
        [
          'raw-rest-google-sheets-write',
          'generic-network-write-unknown-target',
        ].includes(mutator),
      ),
      `${label} remains visible to writer discovery`,
    );
    assert.equal(
      computedCharacterWriter?.guardedBeforeClientConstruction,
      false,
    );
  }

  for (const [transportSource, label] of [
    ["Reflect.get(globalThis, 'fetch')", 'Reflect.get global fetch'],
    [
      "Object.getOwnPropertyDescriptor(globalThis, 'fetch')!.value",
      'global fetch property descriptor',
    ],
  ] as const) {
    fs.writeFileSync(
      path.join(inventoryFixtureRoot, fifthSurface.path),
      [
        'export async function reflectiveGlobalWriter(id: string) {',
        '  const endpoint = `https://sheets.googleapis.com/v4/spreadsheets/${id}/values/A1`;',
        `  const request = { transport: ${transportSource}, url: endpoint, options: { method: 'PUT' } };`,
        '  return request.transport(request.url, request.options);',
        '}',
      ].join('\n'),
    );
    const reflectiveGlobalWriter = deriveP9WriteSurfaceInventory(
      inventoryFixtureRoot,
    ).find((surface) => surface.path === fifthSurface.path);
    assert.ok(
      reflectiveGlobalWriter?.mutators.includes(
        'generic-network-write-unknown-target',
      ),
      `${label} remains visible to writer discovery`,
    );
    assert.equal(reflectiveGlobalWriter?.guardedBeforeClientConstruction, false);
  }

  for (const [transportSource, label] of [
    [
      "Reflect.apply(Reflect.get, Reflect, [globalThis, 'fetch'])",
      'nested reflective global retrieval',
    ],
    [
      "Reflect.get.bind(Reflect)(globalThis, 'fetch')",
      'bound reflective global retrieval',
    ],
    [
      "Reflect.get.call(Reflect, globalThis, 'fetch')",
      'call-applied reflective global retrieval',
    ],
    [
      "Reflect.get.apply(Reflect, [globalThis, 'fetch'])",
      'apply-applied reflective global retrieval',
    ],
    [
      "Reflect.get.bind(Reflect, globalThis)('fetch')",
      'partially bound reflective global retrieval',
    ],
    [
      "(() => { const member = 'get'; return Reflect[member](globalThis, 'fetch'); })()",
      'computed reflective getter alias',
    ],
  ] as const) {
    fs.writeFileSync(
      path.join(inventoryFixtureRoot, fifthSurface.path),
      [
        'export async function nestedReflectiveWriter(id: string) {',
        '  const endpoint = `https://sheets.googleapis.com/v4/spreadsheets/${id}/values/A1`;',
        `  const request = { transport: ${transportSource}, url: endpoint, options: { method: 'PUT' } };`,
        '  return request.transport(request.url, request.options);',
        '}',
      ].join('\n'),
    );
    const nestedReflectiveWriter = deriveP9WriteSurfaceInventory(
      inventoryFixtureRoot,
    ).find((surface) => surface.path === fifthSurface.path);
    assert.ok(
      nestedReflectiveWriter?.mutators.includes(
        'generic-network-write-unknown-target',
      ),
      `${label} remains visible to writer discovery`,
    );
    assert.equal(nestedReflectiveWriter?.guardedBeforeClientConstruction, false);
  }

  fs.writeFileSync(
    path.join(inventoryFixtureRoot, fifthSurface.path),
    [
      'export async function functionApplyFetchBypass(id: string) {',
      '  const endpoint = `https://sheets.googleapis.com/v4/spreadsheets/${id}:batchUpdate`;',
      "  return fetch.apply(null, [endpoint, { method: 'POST' }]);",
      '}',
    ].join('\n'),
  );
  const functionApplyFetchBypass = deriveP9WriteSurfaceInventory(
    inventoryFixtureRoot,
  ).find((surface) => surface.path === fifthSurface.path);
  assert.ok(
    functionApplyFetchBypass?.mutators.includes(
      'raw-rest-google-sheets-write',
    ),
    'Function.prototype.apply cannot hide a raw Sheets REST writer',
  );
  assert.equal(functionApplyFetchBypass?.guardedBeforeClientConstruction, false);

  const capabilityModulePath = path.join(
    inventoryFixtureRoot,
    path.posix.dirname(fifthSurface.path),
    'cross-module-capability.ts',
  );
  const targetModulePath = path.join(
    inventoryFixtureRoot,
    path.posix.dirname(fifthSurface.path),
    'cross-module-target.ts',
  );
  const optionsModulePath = path.join(
    inventoryFixtureRoot,
    path.posix.dirname(fifthSurface.path),
    'cross-module-options.ts',
  );
  fs.writeFileSync(capabilityModulePath, 'export const transport = fetch;\n');
  fs.writeFileSync(
    targetModulePath,
    "export const endpoint = 'https://sheets.googleapis.com/v4/spreadsheets/example/values/A1';\n",
  );
  fs.writeFileSync(
    optionsModulePath,
    "export const options = { method: 'PUT' };\n",
  );
  fs.writeFileSync(
    path.join(inventoryFixtureRoot, fifthSurface.path),
    [
      "import { transport } from './cross-module-capability';",
      "import { endpoint } from './cross-module-target';",
      "import { options } from './cross-module-options';",
      'export async function crossModuleWriter() {',
      '  return transport(endpoint, options);',
      '}',
    ].join('\n'),
  );
  const crossModuleWriter = deriveP9WriteSurfaceInventory(
    inventoryFixtureRoot,
  ).find((surface) => surface.path === fifthSurface.path);
  assert.ok(
    crossModuleWriter?.mutators.includes('raw-rest-google-sheets-write'),
    'a capability, Sheets target, and write method split across modules fail closed at the call site',
  );
  assert.equal(crossModuleWriter?.guardedBeforeClientConstruction, false);
  fs.writeFileSync(
    path.join(inventoryFixtureRoot, fifthSurface.path),
    [
      "import { transport } from './cross-module-capability';",
      "import { endpoint } from './cross-module-target';",
      "import { options } from './cross-module-options';",
      'const send = transport;',
      'export async function aliasedCrossModuleWriter() {',
      '  return send(endpoint, options);',
      '}',
    ].join('\n'),
  );
  const aliasedCrossModuleWriter = deriveP9WriteSurfaceInventory(
    inventoryFixtureRoot,
  ).find((surface) => surface.path === fifthSurface.path);
  assert.ok(
    aliasedCrossModuleWriter?.mutators.includes(
      'raw-rest-google-sheets-write',
    ),
    'a local alias cannot erase an imported network capability',
  );
  const barrelModulePath = path.join(
    inventoryFixtureRoot,
    path.posix.dirname(fifthSurface.path),
    'cross-module-barrel.ts',
  );
  fs.writeFileSync(
    barrelModulePath,
    [
      "export { transport } from './cross-module-capability';",
      "export { endpoint } from './cross-module-target';",
      "export { options } from './cross-module-options';",
    ].join('\n'),
  );
  fs.writeFileSync(
    path.join(inventoryFixtureRoot, fifthSurface.path),
    [
      "import * as requestParts from './cross-module-barrel';",
      'export async function barrelCrossModuleWriter() {',
      '  return requestParts.transport(requestParts.endpoint, requestParts.options);',
      '}',
    ].join('\n'),
  );
  const barrelCrossModuleWriter = deriveP9WriteSurfaceInventory(
    inventoryFixtureRoot,
  ).find((surface) => surface.path === fifthSurface.path);
  assert.ok(
    barrelCrossModuleWriter?.mutators.includes(
      'raw-rest-google-sheets-write',
    ),
    'barrel re-exports and namespace imports cannot erase a composed writer',
  );
  fs.writeFileSync(
    capabilityModulePath,
    'export function getTransport() { return fetch; }\n',
  );
  fs.writeFileSync(
    path.join(inventoryFixtureRoot, fifthSurface.path),
    [
      "import { getTransport } from './cross-module-capability';",
      "import { endpoint } from './cross-module-target';",
      "import { options } from './cross-module-options';",
      'export async function callableExportWriter() {',
      '  return getTransport()(endpoint, options);',
      '}',
    ].join('\n'),
  );
  const callableExportWriter = deriveP9WriteSurfaceInventory(
    inventoryFixtureRoot,
  ).find((surface) => surface.path === fifthSurface.path);
  assert.ok(
    callableExportWriter?.mutators.includes('raw-rest-google-sheets-write'),
    'a function-returned exported capability remains visible at its consumer',
  );
  fs.writeFileSync(
    capabilityModulePath,
    'export const box = { transport: fetch };\n',
  );
  fs.writeFileSync(
    path.join(inventoryFixtureRoot, fifthSurface.path),
    [
      "import { box } from './cross-module-capability';",
      "import { endpoint } from './cross-module-target';",
      "import { options } from './cross-module-options';",
      'export async function containerExportWriter() {',
      '  return box.transport(endpoint, options);',
      '}',
    ].join('\n'),
  );
  const containerExportWriter = deriveP9WriteSurfaceInventory(
    inventoryFixtureRoot,
  ).find((surface) => surface.path === fifthSurface.path);
  assert.ok(
    containerExportWriter?.mutators.includes('raw-rest-google-sheets-write'),
    'a capability nested in an exported container remains visible at its consumer',
  );
  fs.writeFileSync(
    capabilityModulePath,
    'const local = () => fetch; export function getTransport() { return local(); }\n',
  );
  fs.writeFileSync(
    path.join(inventoryFixtureRoot, fifthSurface.path),
    [
      "import { getTransport } from './cross-module-capability';",
      "import { endpoint } from './cross-module-target';",
      "import { options } from './cross-module-options';",
      'export async function wrappedCallableExportWriter() {',
      '  return getTransport()(endpoint, options);',
      '}',
    ].join('\n'),
  );
  const wrappedCallableExportWriter = deriveP9WriteSurfaceInventory(
    inventoryFixtureRoot,
  ).find((surface) => surface.path === fifthSurface.path);
  assert.ok(
    wrappedCallableExportWriter?.mutators.includes(
      'raw-rest-google-sheets-write',
    ),
    'a local callable wrapper cannot erase an exported network capability',
  );
  fs.writeFileSync(
    capabilityModulePath,
    'export class TransportBox { static transport() { return fetch; } }\n',
  );
  fs.writeFileSync(
    path.join(inventoryFixtureRoot, fifthSurface.path),
    [
      "import { TransportBox } from './cross-module-capability';",
      "import { endpoint } from './cross-module-target';",
      "import { options } from './cross-module-options';",
      'export async function classExportWriter() {',
      '  return TransportBox.transport()(endpoint, options);',
      '}',
    ].join('\n'),
  );
  const classExportWriter = deriveP9WriteSurfaceInventory(
    inventoryFixtureRoot,
  ).find((surface) => surface.path === fifthSurface.path);
  assert.ok(
    classExportWriter?.mutators.includes('raw-rest-google-sheets-write'),
    'an exported class method cannot erase a returned network capability',
  );
  for (const [capabilitySource, importName, invocation, label] of [
    [
      'export function getTransport() { return local(); } const local = () => fetch;',
      'getTransport',
      'getTransport()(endpoint, options)',
      'a later-declared local wrapper',
    ],
    [
      'function local() { return fetch; } export function getTransport() { return local(); }',
      'getTransport',
      'getTransport()(endpoint, options)',
      'a local function wrapper',
    ],
    [
      'export class TransportBox { static transport = fetch; }',
      'TransportBox',
      'TransportBox.transport(endpoint, options)',
      'an exported class capability field',
    ],
    [
      'export class TransportBox { static get transport() { return fetch; } }',
      'TransportBox',
      'TransportBox.transport(endpoint, options)',
      'an exported class capability getter',
    ],
    [
      'const box: any = {}; box.transport = fetch; export { box };',
      'box',
      'box.transport(endpoint, options)',
      'a post-initialization exported capability container',
    ],
    [
      'const box: any = {}; Object.assign(box, { transport: fetch }); export { box };',
      'box',
      'box.transport(endpoint, options)',
      'an Object.assign-mutated exported capability container',
    ],
    [
      "const box: any = {}; Reflect.set(box, 'transport', fetch); export { box };",
      'box',
      'box.transport(endpoint, options)',
      'a Reflect.set-mutated exported capability container',
    ],
    [
      'const box: any = {}; function selectedBox() { return box; } Object.assign(selectedBox(), { transport: fetch }); export { box };',
      'box',
      'box.transport(endpoint, options)',
      'an Object.assign-mutated call-selected capability container',
    ],
    [
      "const box: any = {}; function selectedBox() { return box; } Reflect.set(selectedBox(), 'transport', fetch); export { box };",
      'box',
      'box.transport(endpoint, options)',
      'a Reflect.set-mutated call-selected capability container',
    ],
    [
      'const box: any = {}; function selectedBox() { return box; } const pick = selectedBox; Object.assign(pick(), { transport: fetch }); export { box };',
      'box',
      'box.transport(endpoint, options)',
      'an aliased call-selected capability container',
    ],
    [
      'const box: any = {}; const getTransport = () => fetch; Object.assign(box, { transport: getTransport() }); export { box };',
      'box',
      'box.transport(endpoint, options)',
      'a mutation value returned by a local capability wrapper',
    ],
    [
      'export class TransportBox { static transport: typeof fetch; static { this.transport = fetch; } }',
      'TransportBox',
      'TransportBox.transport(endpoint, options)',
      'an exported class static-block capability',
    ],
  ] as const) {
    fs.writeFileSync(capabilityModulePath, `${capabilitySource}\n`);
    fs.writeFileSync(
      path.join(inventoryFixtureRoot, fifthSurface.path),
      [
        `import { ${importName} } from './cross-module-capability';`,
        "import { endpoint } from './cross-module-target';",
        "import { options } from './cross-module-options';",
        'export async function extendedExportWriter() {',
        `  return ${invocation};`,
        '}',
      ].join('\n'),
    );
    const extendedExportWriter = deriveP9WriteSurfaceInventory(
      inventoryFixtureRoot,
    ).find((surface) => surface.path === fifthSurface.path);
    assert.ok(
      extendedExportWriter?.mutators.includes(
        'raw-rest-google-sheets-write',
      ),
      `${label} remains visible at its consumer`,
    );
  }
  fs.writeFileSync(
    capabilityModulePath,
    'export default class { static get transport() { return fetch; } }\n',
  );
  fs.writeFileSync(
    path.join(inventoryFixtureRoot, fifthSurface.path),
    [
      "import TransportBox from './cross-module-capability';",
      "import { endpoint } from './cross-module-target';",
      "import { options } from './cross-module-options';",
      'export async function defaultClassAccessorWriter() {',
      '  return TransportBox.transport(endpoint, options);',
      '}',
    ].join('\n'),
  );
  const defaultClassAccessorWriter = deriveP9WriteSurfaceInventory(
    inventoryFixtureRoot,
  ).find((surface) => surface.path === fifthSurface.path);
  assert.ok(
    defaultClassAccessorWriter?.mutators.includes(
      'raw-rest-google-sheets-write',
    ),
    'a default exported class getter remains visible at its consumer',
  );
  fs.writeFileSync(
    capabilityModulePath,
    'const transport = fetch; export = transport;\n',
  );
  fs.writeFileSync(
    targetModulePath,
    "const endpoint = 'https://sheets.googleapis.com/v4/spreadsheets/example/values/A1'; export = endpoint;\n",
  );
  fs.writeFileSync(
    optionsModulePath,
    "const options = { method: 'PUT' }; export = options;\n",
  );
  fs.writeFileSync(
    path.join(inventoryFixtureRoot, fifthSurface.path),
    [
      "import transport = require('./cross-module-capability');",
      "import endpoint = require('./cross-module-target');",
      "import options = require('./cross-module-options');",
      'export async function importEqualsCrossModuleWriter() {',
      '  return transport(endpoint, options);',
      '}',
    ].join('\n'),
  );
  const importEqualsCrossModuleWriter = deriveP9WriteSurfaceInventory(
    inventoryFixtureRoot,
  ).find((surface) => surface.path === fifthSurface.path);
  assert.ok(
    importEqualsCrossModuleWriter?.mutators.includes(
      'raw-rest-google-sheets-write',
    ),
    'export-equals and import-equals cannot erase split writer facts',
  );
  fs.unlinkSync(capabilityModulePath);
  fs.unlinkSync(targetModulePath);
  fs.unlinkSync(optionsModulePath);
  fs.unlinkSync(barrelModulePath);

  const hiddenBuildWriterPath = path.join(
    inventoryFixtureRoot,
    'web/src/build/hidden.ts',
  );
  fs.mkdirSync(path.dirname(hiddenBuildWriterPath), { recursive: true });
  fs.writeFileSync(
    hiddenBuildWriterPath,
    [
      'export async function hiddenBuildWriter() {',
      "  return fetch('https://sheets.googleapis.com/v4/spreadsheets/example/values/A1', { method: 'PUT' });",
      '}',
    ].join('\n'),
  );
  const hiddenBuildWriter = deriveP9WriteSurfaceInventory(
    inventoryFixtureRoot,
  ).find((surface) => surface.path === 'web/src/build/hidden.ts');
  assert.ok(
    hiddenBuildWriter?.mutators.includes('raw-rest-google-sheets-write'),
    'a runtime writer under a build-named source directory remains in inventory',
  );
  assert.equal(hiddenBuildWriter?.guardedBeforeClientConstruction, false);
  fs.unlinkSync(hiddenBuildWriterPath);

  fs.writeFileSync(
    path.join(inventoryFixtureRoot, fifthSurface.path),
    [
      'export function dynamicallyDecodedWriter() {',
      "  const source = Buffer.from('ZmV0Y2goJ2h0dHBzOi8vc2hlZXRzLmdvb2dsZWFwaXMuY29tL3Y0L3NwcmVhZHNoZWV0cy9leGFtcGxlL3ZhbHVlcy9BMScsIHsgbWV0aG9kOiAnUFVUJyB9KQ==', 'base64').toString();",
      '  return eval(source);',
      '}',
    ].join('\n'),
  );
  const dynamicallyDecodedWriter = deriveP9WriteSurfaceInventory(
    inventoryFixtureRoot,
  ).find((surface) => surface.path === fifthSurface.path);
  assert.ok(
    dynamicallyDecodedWriter?.mutators.includes(
      'generic-network-write-unknown-target',
    ),
    'dynamic execution is a fail-closed writer capability even when source text is encoded',
  );
  assert.equal(
    dynamicallyDecodedWriter?.guardedBeforeClientConstruction,
    false,
  );

  for (const [executionSource, label] of [
    [
      "const Maker = (() => {}).constructor; return Maker(source)();",
      'function-object constructor',
    ],
    [
      'return Reflect.apply(Function, null, [source])();',
      'reflectively applied Function constructor',
    ],
    [
      "const vm = require('node:vm'); return vm.runInThisContext(source);",
      'node vm execution',
    ],
    [
      "return import('data:text/javascript;base64,ZmV0Y2goJ2h0dHBzOi8vc2hlZXRzLmdvb2dsZWFwaXMuY29tJyk=');",
      'data URL dynamic import',
    ],
    [
      "const childProcess = require('node:child_process'); return childProcess.exec(source);",
      'child-process shell execution',
    ],
    [
      "const childProcess = require('node:child_process'); return childProcess.spawn(source);",
      'child-process dynamic spawn execution',
    ],
    [
      "const childProcess = require('node:child_process'); return childProcess.spawn('npx', ['tsx', '-e', source]);",
      'child-process npx spawn execution',
    ],
    [
      "const { spawn } = require('node:child_process'); return Reflect.apply(spawn, null, [source]);",
      'reflectively applied child-process spawn execution',
    ],
    [
      "const { spawn } = require('node:child_process'); return spawn.apply(null, [source]);",
      'applied child-process spawn execution',
    ],
    [
      "const { spawn } = require('node:child_process'); return spawn.bind(null)(source);",
      'bound child-process spawn execution',
    ],
    [
      "const { spawn } = require('node:child_process'); function getRun() { return spawn; } return getRun()(source);",
      'locally returned child-process spawn execution',
    ],
    [
      "const { spawn } = require('node:child_process'); function getRun() { return (spawn); } return getRun()(source);",
      'parenthesized locally returned child-process spawn execution',
    ],
    [
      "const { spawn } = require('node:child_process'); function getRun() { return true ? spawn : spawn; } return getRun()(source);",
      'conditional locally returned child-process spawn execution',
    ],
    [
      "const { spawn } = require('node:child_process'); return (() => { function getRun() { return spawn; } return getRun(); })()(source);",
      'nested-IIFE locally returned child-process spawn execution',
    ],
    [
      "const { spawn } = require('node:child_process'); return ({ getRun() { return spawn; } }).getRun()(source);",
      'object-method returned child-process spawn execution',
    ],
    [
      "const { spawn } = require('node:child_process'); const box = { run: spawn }; return box.run(source);",
      'named object-contained child-process spawn execution',
    ],
    [
      "const { spawn } = require('node:child_process'); const box = { getRun() { return spawn; } }; return box.getRun()(source);",
      'named object-method returned child-process spawn execution',
    ],
    [
      "const { spawn } = require('node:child_process'); class Box { static run = spawn; } return Box.run(source);",
      'class-field-contained child-process spawn execution',
    ],
    [
      "const { spawn } = require('node:child_process'); class Box { static getRun() { return spawn; } } return Box.getRun()(source);",
      'class-method returned child-process spawn execution',
    ],
    [
      "const { spawn } = require('node:child_process'); const box = [spawn]; return box[0](source);",
      'array-contained child-process spawn execution',
    ],
    [
      "const { spawn } = require('node:child_process'); const box = { run: spawn }; const { run } = box; return run(source);",
      'destructured child-process spawn execution',
    ],
    [
      "const { execFile } = require('node:child_process'); return execFile('git', ['-c', source, 'x']);",
      'unrestricted git execFile execution',
    ],
    [
      "const { execFile } = require('node:child_process'); return execFile('git', ['diff', '--ext-diff', 'HEAD^', 'HEAD']);",
      'git external-diff execFile execution',
    ],
    [
      "const { execFile } = require('node:child_process'); return execFile('git', ['show', '--ext-diff', 'HEAD']);",
      'git show external-diff execFile execution',
    ],
    [
      "const { execFile } = require('node:child_process'); return execFile('git', ['show', 'HEAD:file;node -e process.exit(0)'], { shell: true });",
      'git execFile shell-option execution',
    ],
  ] as const) {
    fs.writeFileSync(
      path.join(inventoryFixtureRoot, fifthSurface.path),
      [
        'export function alternateDynamicWriter() {',
        "  const source = Buffer.from('ZmV0Y2goJ2h0dHBzOi8vc2hlZXRzLmdvb2dsZWFwaXMuY29tL3Y0L3NwcmVhZHNoZWV0cy9leGFtcGxlL3ZhbHVlcy9BMScsIHsgbWV0aG9kOiAnUFVUJyB9KQ==', 'base64').toString();",
        `  ${executionSource}`,
        '}',
      ].join('\n'),
    );
    const alternateDynamicWriter = deriveP9WriteSurfaceInventory(
      inventoryFixtureRoot,
    ).find((surface) => surface.path === fifthSurface.path);
    assert.ok(
      alternateDynamicWriter?.mutators.includes(
        'generic-network-write-unknown-target',
      ),
      `${label} is inventoried as an unknown writer capability`,
    );
    assert.equal(
      alternateDynamicWriter?.guardedBeforeClientConstruction,
      false,
    );
  }

  for (const [topLevelSource, label] of [
    [
      "import { spawn } from 'node:child_process'; const box = [spawn]; box[0]('node'); export const loaded = true;",
      'top-level numeric array process access',
    ],
    [
      "import { spawn } from 'node:child_process'; const key = 'run'; const box = { run: spawn }; box[key]('node'); export const loaded = true;",
      'top-level computed process-container access',
    ],
    [
      "import { spawn } from 'node:child_process'; const box = { api: { run: spawn } }; box.api.run('node'); export const loaded = true;",
      'top-level nested process-container access',
    ],
    [
      "import { spawn } from 'node:child_process'; const box = [[spawn]]; box[0][0]('node'); export const loaded = true;",
      'top-level nested-array process access',
    ],
    [
      "import { spawn } from 'node:child_process'; function invoke(run: typeof spawn) { return run('node'); } invoke(spawn); export const loaded = true;",
      'top-level process launcher passed through a call argument',
    ],
    [
      "import { spawn } from 'node:child_process'; function identity(run: typeof spawn) { return run; } identity(spawn)('node'); export const loaded = true;",
      'top-level process launcher returned through a call argument',
    ],
    [
      "import { spawn } from 'node:child_process'; const box: { run?: typeof spawn } = {}; box.run = spawn; box.run('node'); export const loaded = true;",
      'top-level post-initialization process property assignment',
    ],
    [
      "import { spawn } from 'node:child_process'; const box: Record<string, unknown> = {}; Object.assign(box, { run: spawn }); export const loaded = true;",
      'top-level Object.assign process capability escape',
    ],
    [
      "import { spawn } from 'node:child_process'; const box: Record<string, unknown> = {}; Reflect.set(box, 'run', spawn); export const loaded = true;",
      'top-level Reflect.set process capability escape',
    ],
    [
      "import { spawn } from 'node:child_process'; const box: unknown[] = []; box.push(spawn); export const loaded = true;",
      'top-level array process capability escape',
    ],
    [
      "import { spawn } from 'node:child_process'; class Invoke { constructor(run: typeof spawn) { run('node'); } } new Invoke(spawn); export const loaded = true;",
      'top-level constructor process capability escape',
    ],
    [
      "import { spawn } from 'node:child_process'; function invoke(_strings: TemplateStringsArray, run: typeof spawn) { return run('node'); } invoke`${spawn}`; export const loaded = true;",
      'top-level tagged-template process capability escape',
    ],
    [
      "import { spawn } from 'node:child_process'; function* getRuns() { yield spawn; } getRuns().next().value('node'); export const loaded = true;",
      'top-level generator-yielded process capability execution',
    ],
    [
      "import { Worker } from 'node:worker_threads'; const payload = 'data:text/javascript,fetch(\"https://sheets.googleapis.com/v4/spreadsheets/x/values/A1\",{method:\"PUT\"})'; new Worker(new URL(payload)); export const loaded = true;",
      'top-level worker-thread data-URL execution',
    ],
    [
      "import cluster from 'node:cluster'; if (cluster.isPrimary) cluster.fork(); export const loaded = true;",
      'top-level cluster process execution',
    ],
    [
      "process.binding('spawn_sync').spawn({}); export const loaded = true;",
      'top-level internal process binding execution',
    ],
    [
      "import Module from 'node:module'; new Module('x')._compile('fetch(\"https://sheets.googleapis.com\",{method:\"PUT\"})', 'x.cjs'); export const loaded = true;",
      'top-level Node module compilation',
    ],
    [
      "import inspector from 'node:inspector'; const session = new inspector.Session(); session.connect(); session.post('Runtime.evaluate', { expression: 'fetch(\"https://sheets.googleapis.com\",{method:\"PUT\"})' }); export const loaded = true;",
      'top-level inspector runtime evaluation',
    ],
    [
      "import * as cp from 'node:child_process'; cp[process.env.P9_METHOD!]('node'); export const loaded = true;",
      'top-level dynamic child-process namespace member',
    ],
    [
      "import * as cp from 'node:child_process'; const method = 'sp' + 'awn'; cp[method]('node'); export const loaded = true;",
      'top-level computed child-process namespace member',
    ],
    [
      "import * as wt from 'node:worker_threads'; new wt[process.env.P9_METHOD!]('data:text/javascript,0'); export const loaded = true;",
      'top-level dynamic worker namespace member',
    ],
    [
      "const { binding } = process; binding('spawn_sync').spawn({}); export const loaded = true;",
      'top-level destructured process binding execution',
    ],
    [
      "const proc = process; proc.binding('spawn_sync').spawn({}); export const loaded = true;",
      'top-level aliased process binding execution',
    ],
    [
      "const key = 'binding'; process[key]('spawn_sync').spawn({}); export const loaded = true;",
      'top-level computed process binding execution',
    ],
    [
      "const { _compile: compile } = module; compile('fetch(\"https://sheets.googleapis.com\",{method:\"PUT\"})', 'x.cjs'); export const loaded = true;",
      'top-level destructured Node module compilation',
    ],
    [
      "import { Session } from 'node:inspector/promises'; const session = new Session(); session.connect(); session.post('Runtime.evaluate', { expression: 'fetch(\"https://sheets.googleapis.com\",{method:\"PUT\"})' }); export const loaded = true;",
      'top-level inspector promises runtime evaluation',
    ],
    [
      "const addon = require('./writer.node'); addon.run(); export const loaded = true;",
      'top-level native addon execution',
    ],
    [
      "let run: (...args: unknown[]) => unknown; ({ [process.env.P9_METHOD!]: run } = require('node:child_process')); run('node'); export const loaded = true;",
      'top-level assignment-destructured dynamic child-process member',
    ],
    [
      "let Worker: new (source: string) => unknown; ({ [process.env.P9_METHOD!]: Worker } = require('node:worker_threads')); new Worker('data:text/javascript,0'); export const loaded = true;",
      'top-level assignment-destructured dynamic Worker member',
    ],
    [
      "process[process.env.P9_MEMBER!](process.env.P9_BINDING).spawn({}); export const loaded = true;",
      'top-level dynamic process primitive selector',
    ],
    [
      "let binding: (...args: unknown[]) => any; ({ binding } = process); binding('spawn_sync').spawn({}); export const loaded = true;",
      'top-level assignment-destructured process binding',
    ],
    [
      "let dlopen: (...args: unknown[]) => unknown; ({ dlopen } = process); dlopen(module, process.env.P9_ADDON); export const loaded = true;",
      'top-level assignment-destructured process dlopen',
    ],
    [
      "let compile: (...args: unknown[]) => unknown; ({ _compile: compile } = module); compile('fetch(\"https://sheets.googleapis.com\",{method:\"PUT\"})', 'x.cjs'); export const loaded = true;",
      'top-level assignment-destructured Node module compiler',
    ],
    [
      "const writer = require('./writer'); writer.run(); export const loaded = true;",
      'top-level unresolved extensionless CommonJS execution boundary',
    ],
    [
      "const writer = require('./writer.payload'); writer.run(); export const loaded = true;",
      'top-level nonstandard-extension CommonJS execution boundary',
    ],
    [
      "const writer = require('../../../scripts/writer.js'); writer.run(); export const loaded = true;",
      'top-level outside-web CommonJS execution boundary',
    ],
    [
      "const writer = require('/tmp/external-writer.js'); writer.run(); export const loaded = true;",
      'top-level absolute CommonJS execution boundary',
    ],
    [
      "const writer = require('opaque-writer'); writer.run(); export const loaded = true;",
      'top-level undeclared-package CommonJS execution boundary',
    ],
    [
      "import cp = require('node:child_process'); cp.spawn('node'); export const loaded = true;",
      'top-level import-equals child-process execution',
    ],
    [
      "import wt = require('node:worker_threads'); new wt.Worker('data:text/javascript,0'); export const loaded = true;",
      'top-level import-equals Worker execution',
    ],
    [
      "import writer = require('../../../scripts/writer'); writer(); export const loaded = true;",
      'top-level import-equals outside-web execution boundary',
    ],
    [
      "const api = require('tsx/esm/api'); api.tsImport('../../../scripts/writer.ts', __filename); export const loaded = true;",
      'top-level declared loader-package execution boundary',
    ],
    [
      "const writer = require('./writer.css'); writer.run(); export const loaded = true;",
      'top-level CommonJS CSS execution boundary',
    ],
    [
      "const writer = require('./writer.JSON'); writer.run(); export const loaded = true;",
      'top-level uppercase CommonJS JSON execution boundary',
    ],
    [
      "let primitive: (...args: unknown[]) => any; ({ [process.env.P9_MEMBER!]: primitive } = process); primitive(process.env.P9_BINDING).spawn({}); export const loaded = true;",
      'top-level computed assignment-destructured Node primitive',
    ],
    [
      "import writer from './writer.js?view=.json'; writer(); export const loaded = true;",
      'top-level query-disguised ES module execution boundary',
    ],
    [
      "const { [process.env.P9_MEMBER!]: primitive } = process; primitive(process.env.P9_BINDING).spawn({}); export const loaded = true;",
      'top-level computed declaration-destructured Node primitive',
    ],
    [
      "function invoke({ [process.env.P9_MEMBER!]: primitive }: any) { return primitive(process.env.P9_BINDING).spawn({}); } invoke(process); export const loaded = true;",
      'top-level computed parameter-destructured Node primitive',
    ],
    [
      "let primitive: (...args: unknown[]) => any; for ({ [process.env.P9_MEMBER!]: primitive } of [process]) { primitive(process.env.P9_BINDING); } export const loaded = true;",
      'top-level for-of computed assignment-destructured Node primitive',
    ],
  ] as const) {
    fs.writeFileSync(
      path.join(inventoryFixtureRoot, fifthSurface.path),
      `${topLevelSource}\n`,
    );
    const topLevelInventory = deriveP9WriteSurfaceInventory(
      inventoryFixtureRoot,
    ).find((surface) => surface.path === fifthSurface.path);
    assert.ok(
      topLevelInventory?.mutators.includes(
        'generic-network-write-unknown-target',
      ),
      `${label} is inventoried without relying on export facts`,
    );
  }

  const processExportPath = path.join(
    inventoryFixtureRoot,
    path.posix.dirname(fifthSurface.path),
    'process-export.ts',
  );
  fs.writeFileSync(
    processExportPath,
    "export { spawn } from 'node:child_process';\n",
  );
  fs.writeFileSync(
    path.join(inventoryFixtureRoot, fifthSurface.path),
    [
      "import { spawn } from './process-export';",
      'export function reexportedProcessWriter(source: string) {',
      '  return spawn(source);',
      '}',
    ].join('\n'),
  );
  const reexportedProcessInventory = deriveP9WriteSurfaceInventory(
    inventoryFixtureRoot,
  );
  assert.ok(
    reexportedProcessInventory.some(
      (surface) =>
        surface.path === path.posix.join(
          path.posix.dirname(fifthSurface.path),
          'process-export.ts',
        ) &&
        surface.mutators.includes('generic-network-write-unknown-target'),
    ),
    'a locally re-exported process launcher is inventoried at its export boundary',
  );
  for (const [processExportSource, label] of [
    [
      "export { spawn as run } from 'node:child_process';\n",
      'an aliased process launcher re-export',
    ],
    [
      "export * from 'node:child_process';\n",
      'a star process launcher re-export',
    ],
    [
      "import { spawn } from 'node:child_process'; export const box = { run: spawn };\n",
      'a process launcher nested in an exported container',
    ],
    [
      "import { spawn } from 'node:child_process'; export function getRun() { return spawn; }\n",
      'a process launcher returned by an exported function',
    ],
    [
      "import { spawn } from 'node:child_process'; export default function () { return spawn; }\n",
      'a process launcher returned by an anonymous default function',
    ],
    [
      "export * as processApi from 'node:child_process';\n",
      'a namespace process launcher re-export',
    ],
  ] as const) {
    fs.writeFileSync(processExportPath, processExportSource);
    const processExportInventory = deriveP9WriteSurfaceInventory(
      inventoryFixtureRoot,
    );
    assert.ok(
      processExportInventory.some(
        (surface) =>
          surface.path === path.posix.join(
            path.posix.dirname(fifthSurface.path),
            'process-export.ts',
          ) &&
          surface.mutators.includes('generic-network-write-unknown-target'),
      ),
      `${label} is inventoried at its export boundary`,
    );
  }
  fs.unlinkSync(processExportPath);

  const commonJsProcessExportPath = path.join(
    inventoryFixtureRoot,
    path.posix.dirname(fifthSurface.path),
    'process-capability.cjs',
  );
  const commonJsProcessConsumerPath = path.join(
    inventoryFixtureRoot,
    path.posix.dirname(fifthSurface.path),
    'process-consumer.cjs',
  );
  fs.writeFileSync(
    commonJsProcessConsumerPath,
    "const processApi = require('./process-capability.cjs'); processApi.run('node', ['-e', 'process.exit(0)']);\n",
  );
  for (const [commonJsSource, label] of [
    [
      "const { spawn } = require('node:child_process'); module.exports = { run: spawn };\n",
      'a CommonJS process container export',
    ],
    [
      "const { spawn } = require('node:child_process'); module.exports.run = spawn;\n",
      'a CommonJS process member export',
    ],
    [
      "const { spawn } = require('node:child_process'); Object.assign(module.exports, { run: spawn });\n",
      'an Object.assign-mutated CommonJS process export',
    ],
    [
      "const { spawn } = require('node:child_process'); Reflect.set(module.exports, 'run', spawn);\n",
      'a Reflect.set-mutated CommonJS process export',
    ],
    [
      "const { spawn } = require('node:child_process'); const out = module.exports; out.run = spawn;\n",
      'an aliased CommonJS member process export',
    ],
    [
      "const { spawn } = require('node:child_process'); const out = exports; out.run = spawn;\n",
      'an aliased exports member process export',
    ],
    [
      "const { spawn } = require('node:child_process'); const out = module.exports; Object.assign(out, { run: spawn });\n",
      'an Object.assign-mutated aliased CommonJS process export',
    ],
    [
      "const { spawn } = require('node:child_process'); const out = module.exports; Reflect.set(out, 'run', spawn);\n",
      'a Reflect.set-mutated aliased CommonJS process export',
    ],
    [
      "const { spawn } = require('node:child_process'); let out = module.exports; out.run = spawn;\n",
      'a let-aliased CommonJS process export',
    ],
    [
      "const { spawn } = require('node:child_process'); var out = module.exports; out.run = spawn;\n",
      'a var-aliased CommonJS process export',
    ],
    [
      "const { spawn } = require('node:child_process'); const out = (module.exports); out.run = spawn;\n",
      'a parenthesized CommonJS export alias',
    ],
    [
      "const { spawn } = require('node:child_process'); const { exports: out } = module; out.run = spawn;\n",
      'a destructured CommonJS export alias',
    ],
    [
      "const { spawn } = require('node:child_process'); (() => { const out = module.exports; out.run = spawn; })();\n",
      'a scoped CommonJS export alias',
    ],
    [
      "const { spawn } = require('node:child_process'); let out; out = module.exports; out.run = spawn;\n",
      'an assignment-created CommonJS export alias',
    ],
    [
      "const { spawn } = require('node:child_process'); const out = Math.random() > 0.5 ? module.exports : {}; out.run = spawn;\n",
      'a conditional CommonJS export alias',
    ],
    [
      "const { spawn } = require('node:child_process'); const out = module.exports || {}; out.run = spawn;\n",
      'a logical CommonJS export alias',
    ],
    [
      "const { spawn } = require('node:child_process'); function getOut() { return module.exports; } const out = getOut(); out.run = spawn;\n",
      'a function-returned CommonJS export alias',
    ],
    [
      "const { spawn } = require('node:child_process'); const box = { out: module.exports }; box.out.run = spawn;\n",
      'a container-held CommonJS export alias',
    ],
    [
      "const { spawn } = require('node:child_process'); let out; out = module.exports; Object.assign(out, { run: spawn });\n",
      'an Object.assign-mutated assignment-created CommonJS export alias',
    ],
    [
      "const { spawn } = require('node:child_process'); function install(out) { out.run = spawn; } install(module.exports);\n",
      'a call-argument CommonJS export alias',
    ],
    [
      "const { spawn } = require('node:child_process'); const box = [module.exports]; box[0].run = spawn;\n",
      'an array-contained CommonJS export alias',
    ],
    [
      "const { spawn } = require('node:child_process'); const [out] = [module.exports]; out.run = spawn;\n",
      'an array-destructured CommonJS export alias',
    ],
    [
      "const { spawn } = require('node:child_process'); const box = Object.assign({}, { out: module.exports }); box.out.run = spawn;\n",
      'a call-built CommonJS export container',
    ],
    [
      "const { spawn } = require('node:' + 'child_process'); module.exports = { run: spawn };\n",
      'a concatenated-specifier CommonJS process export',
    ],
    [
      "const { spawn } = require(['node', 'child_process'].join(':')); module.exports = { run: spawn };\n",
      'a joined-specifier CommonJS process export',
    ],
    [
      "const { spawn } = module.require('node:child_process'); module.exports = { run: spawn };\n",
      'a module.require CommonJS process export',
    ],
    [
      "const { spawn } = process.getBuiltinModule('node:child_process'); module.exports = { run: spawn };\n",
      'a process.getBuiltinModule CommonJS process export',
    ],
    [
      "const load = require; const api = load(process.env.P9_MODULE); module.exports = { run: api.spawn };\n",
      'an unresolved aliased-loader CommonJS process export',
    ],
    [
      "function loader() { return require; } const api = loader()(process.env.P9_MODULE); module.exports = { run: api.spawn };\n",
      'a returned-loader CommonJS process export',
    ],
    [
      "const load = module.require.bind(module); const api = load(process.env.P9_MODULE); module.exports = { run: api.spawn };\n",
      'a bound-loader CommonJS process export',
    ],
    [
      "const api = Reflect.apply(require, null, [process.env.P9_MODULE]); module.exports = { run: api.spawn };\n",
      'a reflected-loader CommonJS process export',
    ],
    [
      "const load = process.getBuiltinModule; const api = load(process.env.P9_MODULE); module.exports = { run: api.spawn };\n",
      'an aliased getBuiltinModule CommonJS process export',
    ],
    [
      "const api = (0, require)(process.env.P9_MODULE); module.exports = { run: api.spawn };\n",
      'a comma-selected loader CommonJS process export',
    ],
    [
      "const { createRequire } = require('node:module'); const api = createRequire(__filename)(process.env.P9_MODULE); module.exports = { run: api.spawn };\n",
      'a createRequire-built CommonJS process export',
    ],
    [
      "const load = require; const name = 'node:' + 'child_process'; const api = load(name); api.spawn('node');\n",
      'a separately computed aliased child-process loader',
    ],
    [
      "const load = require; const name = 'node:' + 'worker_threads'; const api = load(name); new api.Worker('data:text/javascript,0');\n",
      'a separately computed aliased worker loader',
    ],
    [
      "const { ...cp } = require('node:child_process'); cp.spawn('node');\n",
      'a rest-destructured child-process namespace',
    ],
    [
      "const key = 'spawn'; const { [key]: run } = require('node:child_process'); run('node');\n",
      'a computed-destructured child-process member',
    ],
    [
      "const { ...wt } = require('node:worker_threads'); new wt.Worker('data:text/javascript,0');\n",
      'a rest-destructured worker namespace',
    ],
  ] as const) {
    fs.writeFileSync(commonJsProcessExportPath, commonJsSource);
    const commonJsProcessInventory = deriveP9WriteSurfaceInventory(
      inventoryFixtureRoot,
    );
    assert.ok(
      commonJsProcessInventory.some(
        (surface) =>
          surface.path.endsWith('/process-capability.cjs') &&
          surface.mutators.includes('generic-network-write-unknown-target'),
      ),
      `${label} is inventoried at its export boundary`,
    );
  }
  fs.unlinkSync(commonJsProcessExportPath);
  fs.unlinkSync(commonJsProcessConsumerPath);

  fs.writeFileSync(
    path.join(inventoryFixtureRoot, fifthSurface.path),
    [
      'export async function urlConstructorBypass(id: string) {',
      "  const host = 'https://sheets.googleapis.com';",
      '  const op = `/v4/spreadsheets/${id}:batchUpdate`;',
      '  const endpoint = new URL(op, host);',
      "  return fetch(endpoint, { method: 'POST' });",
      '}',
    ].join('\n'),
  );
  const urlConstructorBypass = deriveP9WriteSurfaceInventory(
    inventoryFixtureRoot,
  ).find((surface) => surface.path === fifthSurface.path);
  assert.ok(
    urlConstructorBypass?.mutators.includes('raw-rest-google-sheets-write'),
    'a composed URL constructor cannot hide a Sheets REST write',
  );
  assert.equal(urlConstructorBypass?.guardedBeforeClientConstruction, false);

  fs.writeFileSync(
    path.join(inventoryFixtureRoot, fifthSurface.path),
    [
      'async function networkWrapper(target: string, init: RequestInit) {',
      '  return fetch(target, init);',
      '}',
      'export async function wrappedFetchBypass(id: string) {',
      "  const host = 'https://sheets.googleapis.com';",
      '  const op = `/v4/spreadsheets/${id}:batchUpdate`;',
      "  return networkWrapper(host + op, { method: 'POST' });",
      '}',
    ].join('\n'),
  );
  const wrappedFetchBypass = deriveP9WriteSurfaceInventory(
    inventoryFixtureRoot,
  ).find((surface) => surface.path === fifthSurface.path);
  assert.ok(
    wrappedFetchBypass?.mutators.includes(
      'generic-network-write-unknown-target',
    ),
    'a wrapper with unknown target and method is forbidden rather than silently ignored',
  );
  assert.equal(wrappedFetchBypass?.guardedBeforeClientConstruction, false);

  fs.writeFileSync(
    path.join(inventoryFixtureRoot, fifthSurface.path),
    [
      "import renamedAxios from 'axios';",
      'const axiosPostAlias = renamedAxios.post;',
      'export async function axiosAliasBypass(id: string) {',
      "  const host = 'https://sheets.googleapis.com';",
      '  const op = `/v4/spreadsheets/${id}:batchUpdate`;',
      '  return axiosPostAlias(host + op, {});',
      '}',
    ].join('\n'),
  );
  const axiosAliasBypass = deriveP9WriteSurfaceInventory(
    inventoryFixtureRoot,
  ).find((surface) => surface.path === fifthSurface.path);
  assert.ok(
    axiosAliasBypass?.mutators.includes('raw-rest-google-sheets-write'),
    'a renamed axios import and method alias cannot hide a composed Sheets write',
  );
  assert.equal(axiosAliasBypass?.guardedBeforeClientConstruction, false);

  fs.writeFileSync(
    path.join(inventoryFixtureRoot, 'web/package.json'),
    JSON.stringify({ dependencies: { 'safe-alias': 'npm:tsx@4.22.4' } }),
  );
  fs.writeFileSync(
    path.join(inventoryFixtureRoot, 'web/package-lock.json'),
    JSON.stringify({
      lockfileVersion: 3,
      packages: {
        'node_modules/safe-alias': { integrity: `sha512-${'a'.repeat(32)}` },
      },
    }),
  );
  fs.writeFileSync(
    path.join(inventoryFixtureRoot, fifthSurface.path),
    "const loader = require('safe-alias'); loader.run(); export const loaded = true;\n",
  );
  const aliasedLoaderPackage = deriveP9WriteSurfaceInventory(
    inventoryFixtureRoot,
  ).find((surface) => surface.path === fifthSurface.path);
  assert.ok(
    aliasedLoaderPackage?.mutators.includes(
      'generic-network-write-unknown-target',
    ),
    'an integrity-bearing npm alias cannot disguise a loader package',
  );
  fs.writeFileSync(
    path.join(inventoryFixtureRoot, 'web/package.json'),
    JSON.stringify({ dependencies: { 'safe-local': 'file:../outside-package' } }),
  );
  fs.writeFileSync(
    path.join(inventoryFixtureRoot, 'web/package-lock.json'),
    JSON.stringify({
      lockfileVersion: 3,
      packages: {
        'node_modules/safe-local': { integrity: `sha512-${'b'.repeat(32)}` },
      },
    }),
  );
  fs.writeFileSync(
    path.join(inventoryFixtureRoot, fifthSurface.path),
    "const loader = require('safe-local'); loader.run(); export const loaded = true;\n",
  );
  const localLoaderPackage = deriveP9WriteSurfaceInventory(
    inventoryFixtureRoot,
  ).find((surface) => surface.path === fifthSurface.path);
  assert.ok(
    localLoaderPackage?.mutators.includes(
      'generic-network-write-unknown-target',
    ),
    'an integrity-bearing local dependency cannot escape the runtime closure',
  );

  const assetTargetPath = path.join(
    inventoryFixtureRoot,
    path.posix.dirname(fifthSurface.path),
    'asset-target.txt',
  );
  const assetLinkPath = path.join(
    inventoryFixtureRoot,
    path.posix.dirname(fifthSurface.path),
    'asset-link.json',
  );
  fs.writeFileSync(assetTargetPath, '{"safe":true}\n');
  fs.symlinkSync(path.basename(assetTargetPath), assetLinkPath);
  fs.writeFileSync(
    path.join(inventoryFixtureRoot, fifthSurface.path),
    "import data from './asset-link.json'; export const loaded = data;\n",
  );
  assert.throws(
    () => deriveP9WriteSurfaceInventory(inventoryFixtureRoot),
    /rejected symbolic link: web\/.+\/asset-link\.json/,
    'an apparent ESM data asset cannot cross a symlink outside exact source identity',
  );
  fs.unlinkSync(assetLinkPath);
  fs.unlinkSync(assetTargetPath);

  fs.writeFileSync(
    path.join(inventoryFixtureRoot, fifthSurface.path),
    [
      'export async function safeReadOnlyNetwork(target: string) {',
      '  return fetch(target);',
      '}',
    ].join('\n'),
  );
  assert.equal(
    deriveP9WriteSurfaceInventory(inventoryFixtureRoot).some(
      (surface) => surface.path === fifthSurface.path,
    ),
    false,
    'a statically proven default-GET generic call is not mislabeled as a writer',
  );
} finally {
  fs.rmSync(inventoryFixtureRoot, { recursive: true, force: true });
}

assert.deepEqual(
  validateP9DeploymentGitBindingV2(
    deploymentRecord,
    context,
    candidateCommit,
    {
      objectExists: () => true,
      isAncestor: () => true,
      blobSha256: () => staticCatalogSha256,
      changedRuntimePaths: () => [],
      changedTrustedProofPaths: () => [],
    },
  ),
  [],
);
assert.match(
  validateP9DeploymentGitBindingV2(
    deploymentRecord,
    context,
    candidateCommit,
    {
      objectExists: () => true,
      isAncestor: () => true,
      blobSha256: () => staticCatalogSha256,
      changedRuntimePaths: () => ['web/fixtures/p7/student-catalog.json'],
      changedTrustedProofPaths: () => [],
    },
  ).join('\n'),
  /student-catalog/,
);
assert.match(
  validateP9DeploymentGitBindingV2(
    deploymentRecord,
    context,
    candidateCommit,
    {
      objectExists: () => true,
      isAncestor: () => true,
      blobSha256: () => staticCatalogSha256,
      changedRuntimePaths: () => [],
      changedTrustedProofPaths: () => [P9_TRUSTED_WORKFLOW_PATH],
    },
  ).join('\n'),
  /trusted proof code differs/,
);

assert.match(
  validateP9DeploymentGitBindingV2(
    deploymentRecord,
    context,
    candidateCommit,
    {
      objectExists: () => true,
      isAncestor: () => true,
      blobSha256: () => staticCatalogSha256,
      changedRuntimePaths: () => [],
      changedTrustedProofPaths: (from, to) =>
        from === trustedProofCandidateCommit && to === baselineCommit
          ? ['web/scripts/p9-trusted-proof.ts']
          : [],
    },
  ).join('\n'),
  /accepted trusted-proof amendment/,
  'the latest accepted governance amendment, not the older Revision 7 candidate, anchors trusted proof code',
);

assert.match(
  validateP9DeploymentGitBindingV2(
    deploymentRecord,
    context,
    candidateCommit,
    {
      objectExists: () => true,
      isAncestor: () => true,
      blobSha256: () => staticCatalogSha256,
      changedRuntimePaths: () => [],
      changedTrustedProofPaths: (from, to) =>
        from === baselineCommit && to === runtimeCommit
          ? ['web/scripts/validate-build-plan.ts']
          : [],
    },
  ).join('\n'),
  /runtime changed immutable trusted proof code/,
  'the runtime commit cannot replace the accepted validator or trusted proof closure',
);

assert.match(
  validateP9DeploymentGitBindingV2(
    deploymentRecord,
    context,
    candidateCommit,
    {
      objectExists: () => true,
      isAncestor: () => true,
      blobSha256: () => 'd'.repeat(64),
      changedRuntimePaths: () => [],
      changedTrustedProofPaths: () => [],
    },
  ).join('\n'),
  /runtime accepted-P7 catalog bytes/,
  'the deployed runtime blob must hash to the exact accepted P7 catalog',
);

assert.match(
  validateP9DeploymentGitBindingV2(
    deploymentRecord,
    context,
    '0'.repeat(40),
    {
      objectExists: () => true,
      isAncestor: () => true,
      blobSha256: () => staticCatalogSha256,
      changedRuntimePaths: () => [],
      changedTrustedProofPaths: () => [],
    },
  ).join('\n'),
  /candidate differs/,
  'the Git-binding argument cannot substitute another candidate',
);

for (const [label, probe] of [
  [
    'missing object',
    {
      objectExists: () => false,
      isAncestor: () => true,
      blobSha256: () => staticCatalogSha256,
      changedRuntimePaths: () => [],
      changedTrustedProofPaths: () => [],
    },
  ],
  [
    'bad ancestry',
    {
      objectExists: () => true,
      isAncestor: () => false,
      blobSha256: () => staticCatalogSha256,
      changedRuntimePaths: () => [],
      changedTrustedProofPaths: () => [],
    },
  ],
] as const) {
  assert.notDeepEqual(
    validateP9DeploymentGitBindingV2(
      deploymentRecord,
      context,
      candidateCommit,
      probe,
    ),
    [],
    `${label} is rejected by Git binding`,
  );
}

assert.notEqual(
  canonicalP9Json(cutoverConfig),
  canonicalP9Json(rollbackConfig),
  'cutover and rollback configurations are distinct canonical descriptors',
);

console.log(
  'P9 evidence v2: PASS (strict schemas, chronology, derived IDs/config, OIDC gate, same-runtime rollback, complete writer inventory)',
);
