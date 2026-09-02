import { createHash, randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  P9_APPLICATION_READ_CHALLENGE_DOMAIN,
  P9_APPLICATION_READ_CHALLENGE_HASH_ALGORITHM,
  P9_APPLICATION_READ_BOUNDED_FIELDS,
  P9_APPLICATION_RUNTIME_BINDING_MODULE_PATH,
  P9_HEALTH_ROUTE_PATH,
  P9_PRODUCTION_SOURCE_LOADER_EXPORT,
  P9_PRODUCTION_SOURCE_LOADER_PATH,
  P9_PUBLIC_ROUTE_PATH,
  deriveP9ApplicationReadRuntimeBinding,
  p9CanonicalProductionHostnameFingerprint,
  p9HostedVerificationEnvironmentFingerprint,
  p9ApplicationReadChallengeSha256,
  p9RuntimeCredentialProvenanceFingerprint,
  type P9ApplicationReadTabIdentity,
} from './p9-evidence-v2';

const REPOSITORY = 'whitefishscholarship/program_code';
const DEFAULT_BRANCH = 'main';
const WORKFLOW_PATH = '.github/workflows/p9-evidence.yml';
const ENVIRONMENT = 'p9-production-verification';
const SIGNER_WORKFLOW =
  'whitefishscholarship/program_code/.github/workflows/p9-evidence.yml';
const PRODUCTION_ID = '1eWGMdavcEECUcY_-nZ9gR2nMTN7T7T6oipG5ql1LoIE';
const TESTING_ID = '1Dp5AMnrfSQ-Xf-r03S75lKsGPJk7o0inOgvC9Q6lOl4';
const SHEETS_READ_SCOPE = 'https://www.googleapis.com/auth/spreadsheets.readonly';
const DRIVE_METADATA_SCOPE = 'https://www.googleapis.com/auth/drive.metadata.readonly';
const STATIC_CATALOG_PATH = 'web/fixtures/p7/student-catalog.json';
const BUILD_STATE_PATH = 'docs/BUILD_STATE.json';
const MAX_RESPONSE_BYTES = 8_000_000;
const MAX_HEALTH_RESPONSE_BYTES = 64 * 1024;
const MAX_CREDENTIAL_PAYLOAD_BYTES = 64 * 1024;
const REQUEST_TIMEOUT_MS = 20_000;
const EXPECTED_REVISION = '9857';
const WRITE_ISOLATION_COMMAND =
  'node --import tsx scripts/p9-trusted-proof.ts --mode=write-isolation';
const ACCEPTED_P7_CANDIDATE_COMMIT = 'e96d3e43e7b730be7fbf07f7eafca586d4813836';
const ACCEPTED_P7_CATALOG_SHA256 =
  '35d7836432747710e3515010e8548ceb20ef270a9896d1f1b14c7c91693e9841';

const TABS = [
  {
    sheetId: 405588227,
    title: 'Resource: WHS Senior Scholarships_Updated 2_3_26',
    rowCount: 807,
    columnCount: 27,
    boundedRange: "'Resource: WHS Senior Scholarships_Updated 2_3_26'!A1:AA807",
    backupSpreadsheetId: '1_UARat1DIg9ZW2ciViVFK5gH51vk8VAr1CvNo4lLcZI',
    nativeCellPayloadSha256:
      'e67b548d3835eb0e37c78f685cbced8932771314c530682dfe781a95a9ec6551',
  },
  {
    sheetId: 1998253810,
    title: 'Resource: "Unique" Finds_Updated 10_2_25',
    rowCount: 973,
    columnCount: 29,
    boundedRange: "'Resource: \"Unique\" Finds_Updated 10_2_25'!A1:AC973",
    backupSpreadsheetId: '1RIxFui5dAX7ieC_iqWdJ1IuxImWC7S_rs3N2fgUX9yw',
    nativeCellPayloadSha256:
      '019e08e246d8180cdd62a75ec1ee79936b02ee5a5032e897bd2f00a947e9d2ed',
  },
] as const;

type JsonRecord = Record<string, unknown>;
type Phase = 'entry' | 'cutover' | 'rollback' | 'restored-cutover';
type DeploymentPhase = Exclude<Phase, 'entry'>;
type CaptureJob =
  | 'entry'
  | 'cutover-proof'
  | 'rollback-proof'
  | 'restored-cutover-proof'
  | 'finalize';

type RuntimeIdentity = {
  accessMethod: 'vercel-production-environment-api-bounded-read';
  credentialSource: 'authenticated-vercel-project-production-environment';
  credentialKey: 'GOOGLE_SERVICE_ACCOUNT_CREDENTIALS';
  environmentVariableIdSha256: string;
  environmentVariableUpdatedAt: string;
  principalFingerprintSha256: string;
  runtimeOAuthScopes: [typeof SHEETS_READ_SCOPE];
  evidenceOAuthScopes: [typeof DRIVE_METADATA_SCOPE, typeof SHEETS_READ_SCOPE];
};

type ProviderIdentity = {
  name: 'vercel';
  apiVersion: 'v13';
  projectIdSha256: string;
  teamIdSha256: string;
};

type OperationalIdentityPins = {
  runtimePrincipalFingerprintSha256: string;
  backupRuntimePrincipalFingerprintSha256: string;
  providerProjectFingerprintSha256: string;
  providerTeamFingerprintSha256: string;
  providerCanonicalProductionHostnameSha256: string;
  hostedVerificationEnvironmentFingerprintSha256: string;
  runtimeCredentialProvenanceFingerprintSha256: string;
};

type VercelEvidence = {
  deployment: JsonRecord;
  provider: ProviderIdentity;
  runtimeIdentity: RuntimeIdentity;
  credentials: JsonRecord;
  createdAt: string;
  readyAt: string;
  ref: string;
  providerHealthUrl: URL;
  aliases: ReadonlySet<string>;
};

type Predecessor = {
  phase: Phase;
  runId: number;
  runAttempt: number;
  artifactId: number;
  subjectSha256: string;
  workflowCommit: string;
};

type Capture = {
  repository: typeof REPOSITORY;
  workflowPath: typeof WORKFLOW_PATH;
  workflowCommit: string;
  runId: number;
  runAttempt: number;
  jobName: CaptureJob;
  event: 'workflow_dispatch';
  environment: typeof ENVIRONMENT;
  headSha: string;
  startedAt: string;
  completedAt: string;
};

type WorkflowContext = {
  baseline: string;
  revision7Attestation: string;
  runtimeCommit: string | null;
  repositoryId: number;
  runId: number;
  runAttempt: number;
  root: string;
  identityPins: OperationalIdentityPins;
};

function fail(message: string): never {
  throw new Error(message);
}

function env(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) fail(`Missing required trusted-workflow value: ${name}`);
  return value;
}

function optionalEnv(name: string): string {
  return process.env[name]?.trim() ?? '';
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asRecord(value: unknown, label: string): JsonRecord {
  if (!isRecord(value)) fail(`${label} must be an object`);
  return value;
}

function exactKeys(value: JsonRecord, keys: readonly string[], label: string): void {
  if (canonicalJson(Object.keys(value).sort()) !== canonicalJson([...keys].sort())) {
    fail(`${label} does not have the exact trusted field set`);
  }
}

function stringField(value: JsonRecord, key: string, label: string): string {
  const item = value[key];
  if (typeof item !== 'string' || !item.trim()) fail(`${label} lacks ${key}`);
  return item.trim();
}

function exactString(value: JsonRecord, key: string, expected: string, label: string): string {
  const item = stringField(value, key, label);
  if (item !== expected) fail(`${label} ${key} does not match the trusted expectation`);
  return item;
}

function positiveInteger(value: unknown, label: string): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) fail(`${label} must be a positive integer`);
  return parsed;
}

function assertSha40(value: string, label: string): void {
  if (!/^[0-9a-f]{40}$/.test(value)) fail(`${label} must be a full lowercase Git SHA`);
}

function assertSha256(value: string, label: string): void {
  if (!/^[0-9a-f]{64}$/.test(value)) fail(`${label} must be a lowercase SHA-256`);
}

function assertDeploymentId(value: string, label: string): void {
  if (!/^dpl_[A-Za-z0-9]+$/.test(value)) fail(`${label} is not a Vercel deployment ID`);
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, canonicalize(item)]),
    );
  }
  return value;
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

function sha256Text(value: string | Buffer): string {
  return createHash('sha256').update(value).digest('hex');
}

function sha256Value(value: unknown): string {
  return sha256Text(canonicalJson(value));
}

function readJson(file: string, label: string): JsonRecord {
  let value: unknown;
  try {
    value = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    fail(`${label} is not readable JSON`);
  }
  return asRecord(value, label);
}

function writeJson(file: string, value: unknown): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
}

function currentMode(): string {
  const argument = process.argv.find((item) => item.startsWith('--mode='));
  return argument?.slice('--mode='.length) ?? '';
}

function phaseJob(phase: DeploymentPhase): CaptureJob {
  if (phase === 'cutover') return 'cutover-proof';
  if (phase === 'rollback') return 'rollback-proof';
  return 'restored-cutover-proof';
}

function parsePredecessors(): Predecessor[] {
  const raw = env('P9_PREDECESSORS_JSON');
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    fail('P9_PREDECESSORS_JSON is not valid JSON');
  }
  if (!Array.isArray(value)) fail('P9_PREDECESSORS_JSON must be an array');
  return value.map((item, index) => {
    const predecessor = asRecord(item, `predecessor ${index + 1}`);
    exactKeys(
      predecessor,
      ['phase', 'runId', 'runAttempt', 'artifactId', 'subjectSha256', 'workflowCommit'],
      `predecessor ${index + 1}`,
    );
    const phase = stringField(predecessor, 'phase', `predecessor ${index + 1}`);
    if (!['entry', 'cutover', 'rollback', 'restored-cutover'].includes(phase)) {
      fail(`predecessor ${index + 1} has an invalid phase`);
    }
    const subjectSha256 = stringField(
      predecessor,
      'subjectSha256',
      `predecessor ${index + 1}`,
    );
    const workflowCommit = stringField(
      predecessor,
      'workflowCommit',
      `predecessor ${index + 1}`,
    );
    assertSha256(subjectSha256, `predecessor ${index + 1} subject digest`);
    assertSha40(workflowCommit, `predecessor ${index + 1} workflow commit`);
    return {
      phase: phase as Phase,
      runId: positiveInteger(predecessor.runId, `predecessor ${index + 1} run ID`),
      runAttempt: positiveInteger(
        predecessor.runAttempt,
        `predecessor ${index + 1} run attempt`,
      ),
      artifactId: positiveInteger(
        predecessor.artifactId,
        `predecessor ${index + 1} artifact ID`,
      ),
      subjectSha256,
      workflowCommit,
    };
  });
}

function operationalIdentityPinsFromBuildState(value: unknown): OperationalIdentityPins {
  const state = asRecord(value, 'Delivered BUILD_STATE');
  if (state.schemaVersion !== 2 || state.planRevision !== 9) {
    fail('Delivered BUILD_STATE is not the exact Plan Revision 9 schema');
  }
  const dataAuthority = asRecord(state.dataAuthority, 'Delivered P9 data authority');
  const authorization = asRecord(
    dataAuthority.productionAuthorization,
    'Delivered P9 production authorization',
  );
  if (
    dataAuthority.productionSpreadsheetId !== PRODUCTION_ID ||
    dataAuthority.productionMutationAuthorized !== false ||
    authorization.authorized !== true ||
    authorization.spreadsheetId !== PRODUCTION_ID ||
    authorization.accessMode !== 'read-only' ||
    authorization.sourceReadAuthorized !== true ||
    authorization.applicationConfigurationSwitchAuthorized !== true ||
    authorization.productionMutationAuthorized !== false ||
    authorization.runtimeReadPermissionVerificationRequired !== true ||
    authorization.runtimePrincipalDirectReaderVerificationRequired !== true ||
    authorization.backupRuntimeReadPermissionVerificationRequired !== true ||
    authorization.providerTargetIdentityPinningRequired !== true ||
    authorization.hostedVerificationEnvironmentVerificationRequired !== true ||
    authorization.runtimeCredentialProvenanceVerificationRequired !== true ||
    authorization.trustedWorkflowPath !== WORKFLOW_PATH ||
    authorization.trustedProofScriptPath !== 'web/scripts/p9-trusted-proof.ts' ||
    authorization.trustedWorkflowMode !== 'manual-protected-default-branch-only' ||
    authorization.evidenceSchemaVersion !== 2
  ) {
    fail('Delivered P9 authority does not retain every read-only operational gate');
  }
  const pin = (key: keyof OperationalIdentityPins): string => {
    const fingerprint = stringField(authorization, key, 'Delivered P9 production authority');
    assertSha256(fingerprint, `Delivered P9 ${key}`);
    return fingerprint;
  };
  const pins: OperationalIdentityPins = {
    runtimePrincipalFingerprintSha256: pin('runtimePrincipalFingerprintSha256'),
    backupRuntimePrincipalFingerprintSha256: pin(
      'backupRuntimePrincipalFingerprintSha256',
    ),
    providerProjectFingerprintSha256: pin('providerProjectFingerprintSha256'),
    providerTeamFingerprintSha256: pin('providerTeamFingerprintSha256'),
    providerCanonicalProductionHostnameSha256: pin(
      'providerCanonicalProductionHostnameSha256',
    ),
    hostedVerificationEnvironmentFingerprintSha256: pin(
      'hostedVerificationEnvironmentFingerprintSha256',
    ),
    runtimeCredentialProvenanceFingerprintSha256: pin(
      'runtimeCredentialProvenanceFingerprintSha256',
    ),
  };
  if (
    pins.runtimePrincipalFingerprintSha256 !==
    pins.backupRuntimePrincipalFingerprintSha256
  ) {
    fail('Delivered P9 source and backup principal pins differ');
  }
  return pins;
}

function readBaselineOperationalIdentityPins(
  root: string,
  baseline: string,
): OperationalIdentityPins {
  const head = spawnSync('git', ['rev-parse', 'HEAD'], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, PATH: process.env.PATH ?? '' },
  });
  if (head.status !== 0 || head.stdout.trim() !== baseline) {
    fail('P9 repository root is not checked out at the exact delivered baseline');
  }
  const delivered = spawnSync('git', ['show', `${baseline}:${BUILD_STATE_PATH}`], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: MAX_RESPONSE_BYTES,
    env: { ...process.env, PATH: process.env.PATH ?? '' },
  });
  const currentPath = path.join(root, BUILD_STATE_PATH);
  if (
    delivered.status !== 0 ||
    typeof delivered.stdout !== 'string' ||
    !fs.statSync(currentPath).isFile() ||
    fs.readFileSync(currentPath, 'utf8') !== delivered.stdout
  ) {
    fail('Current BUILD_STATE bytes differ from the exact delivered baseline blob');
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(delivered.stdout);
  } catch {
    fail('Delivered BUILD_STATE is not valid JSON');
  }
  return operationalIdentityPinsFromBuildState(parsed);
}

function assertPinnedWorkflowEnvironment(pins: OperationalIdentityPins): void {
  // This binds the job to the exact environment identity recorded by a separately
  // governed verification. It does not independently claim that protection rules exist.
  if (
    p9HostedVerificationEnvironmentFingerprint(ENVIRONMENT) !==
    pins.hostedVerificationEnvironmentFingerprintSha256
  ) {
    fail('Trusted proof job is not bound to the pinned hosted verification environment');
  }
}

function verifyWorkflow(expectedJob: string, requireRuntime: boolean): WorkflowContext {
  const baseline = env('P9_BASELINE_COMMIT');
  const revision7Attestation = env('P9_REVISION7_ATTESTATION_COMMIT');
  assertSha40(baseline, 'P9 baseline commit');
  assertSha40(revision7Attestation, 'Revision 7 attestation commit');
  if (
    env('GITHUB_REPOSITORY') !== REPOSITORY ||
    env('GITHUB_EVENT_NAME') !== 'workflow_dispatch' ||
    env('GITHUB_REF') !== `refs/heads/${DEFAULT_BRANCH}` ||
    env('GITHUB_SHA') !== baseline ||
    env('GITHUB_WORKFLOW_REF') !==
      `${REPOSITORY}/${WORKFLOW_PATH}@refs/heads/${DEFAULT_BRANCH}` ||
    env('GITHUB_JOB') !== expectedJob ||
    env('P9_EVIDENCE_ENVIRONMENT') !== ENVIRONMENT
  ) {
    fail('Trusted proof is not running from the exact delivered baseline workflow job');
  }
  const runtimeValue = optionalEnv('P9_RUNTIME_COMMIT');
  if (requireRuntime) assertSha40(runtimeValue, 'P9 runtime commit');
  const root = path.resolve(env('P9_REPOSITORY_ROOT'));
  for (const relative of [WORKFLOW_PATH, 'web/scripts/p9-trusted-proof.ts']) {
    if (!fs.statSync(path.join(root, relative)).isFile()) fail('Delivered proof source is missing');
  }
  const identityPins = readBaselineOperationalIdentityPins(root, baseline);
  assertPinnedWorkflowEnvironment(identityPins);
  return {
    baseline,
    revision7Attestation,
    runtimeCommit: requireRuntime ? runtimeValue : null,
    repositoryId: positiveInteger(env('GITHUB_REPOSITORY_ID'), 'GitHub repository ID'),
    runId: positiveInteger(env('GITHUB_RUN_ID'), 'GitHub run ID'),
    runAttempt: positiveInteger(env('GITHUB_RUN_ATTEMPT'), 'GitHub run attempt'),
    root,
    identityPins,
  };
}

function capture(context: WorkflowContext, jobName: CaptureJob, startedAt: string): Capture {
  return {
    repository: REPOSITORY,
    workflowPath: WORKFLOW_PATH,
    workflowCommit: context.baseline,
    runId: context.runId,
    runAttempt: context.runAttempt,
    jobName,
    event: 'workflow_dispatch',
    environment: ENVIRONMENT,
    headSha: context.baseline,
    startedAt,
    completedAt: new Date().toISOString(),
  };
}

function timestamp(value: unknown, label: string): string {
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value) ||
    !Number.isFinite(Date.parse(value))
  ) {
    fail(`${label} is not a canonical UTC timestamp`);
  }
  const normalized = new Date(Date.parse(value)).toISOString();
  if (value !== normalized && value !== normalized.replace('.000Z', 'Z')) {
    fail(`${label} is not a canonical UTC timestamp`);
  }
  return value;
}

function ordered(earlier: unknown, later: unknown, label: string): void {
  const left = timestamp(earlier, `${label} earlier timestamp`);
  const right = timestamp(later, `${label} later timestamp`);
  if (Date.parse(left) > Date.parse(right)) fail(`${label} chronology is invalid`);
}

function validateCapture(value: unknown, expectedJob: CaptureJob, baseline: string): JsonRecord {
  const item = asRecord(value, `${expectedJob} capture`);
  exactKeys(
    item,
    [
      'repository',
      'workflowPath',
      'workflowCommit',
      'runId',
      'runAttempt',
      'jobName',
      'event',
      'environment',
      'headSha',
      'startedAt',
      'completedAt',
    ],
    `${expectedJob} capture`,
  );
  if (
    item.repository !== REPOSITORY ||
    item.workflowPath !== WORKFLOW_PATH ||
    item.workflowCommit !== baseline ||
    item.headSha !== baseline ||
    item.jobName !== expectedJob ||
    item.event !== 'workflow_dispatch' ||
    item.environment !== ENVIRONMENT
  ) {
    fail(`${expectedJob} capture is not exact and baseline-bound`);
  }
  positiveInteger(item.runId, `${expectedJob} capture run ID`);
  positiveInteger(item.runAttempt, `${expectedJob} capture run attempt`);
  ordered(item.startedAt, item.completedAt, `${expectedJob} capture`);
  return item;
}

function validateSourceObservationShape(value: unknown): JsonRecord {
  const item = asRecord(value, 'P9 source observation');
  exactKeys(
    item,
    [
      'observationId',
      'startedAt',
      'completedAt',
      'spreadsheetId',
      'revisionBefore',
      'revisionAfter',
      'sharingBeforeSha256',
      'sharingAfterSha256',
      'runtimePrincipalPermission',
      'backupReadPrincipalFingerprintSha256',
      'operations',
      'tabs',
      'applicationReadChallenge',
    ],
    'P9 source observation',
  );
  const { observationId, ...base } = item;
  if (
    observationId !== sha256Value(base) ||
    item.spreadsheetId !== PRODUCTION_ID ||
    item.revisionBefore !== EXPECTED_REVISION ||
    item.revisionAfter !== EXPECTED_REVISION ||
    item.sharingBeforeSha256 !== item.sharingAfterSha256
  ) {
    fail('P9 source observation is not exact, stable, and canonically derived');
  }
  assertSha256(String(item.sharingBeforeSha256), 'P9 source sharing fingerprint');
  assertSha256(
    String(item.backupReadPrincipalFingerprintSha256),
    'P9 backup reader principal fingerprint',
  );
  const runtimePermission = asRecord(
    item.runtimePrincipalPermission,
    'P9 runtime principal permission',
  );
  exactKeys(
    runtimePermission,
    ['permissionIdSha256', 'type', 'role', 'direct', 'expirationTime'],
    'P9 runtime principal permission',
  );
  if (
    runtimePermission.type !== 'user' ||
    runtimePermission.role !== 'reader' ||
    runtimePermission.direct !== true ||
    runtimePermission.expirationTime !== null
  ) {
    fail('P9 runtime principal permission is not exact direct reader-only access');
  }
  assertSha256(
    stringField(runtimePermission, 'permissionIdSha256', 'P9 runtime principal permission'),
    'P9 runtime principal permission ID hash',
  );
  ordered(item.startedAt, item.completedAt, 'P9 source observation');
  if (Date.parse(String(item.completedAt)) - Date.parse(String(item.startedAt)) > 15 * 60_000) {
    fail('P9 source observation exceeds its 15-minute freshness window');
  }
  if (!Array.isArray(item.tabs) || item.tabs.length !== TABS.length) {
    fail('P9 source observation does not contain the exact authorized tab tuple');
  }
  item.tabs.forEach((tabValue, index) => {
    const tab = asRecord(tabValue, `P9 source tab ${index + 1}`);
    exactKeys(
      tab,
      [
        'sheetId',
        'title',
        'rowCount',
        'columnCount',
        'boundedRange',
        'backupSpreadsheetId',
        'historicalSourceAndBackupSha256',
        'canonicalCellPayloadHashAlgorithm',
        'sourceCanonicalCellPayloadSha256',
        'backupCanonicalCellPayloadSha256',
      ],
      `P9 source tab ${index + 1}`,
    );
    const expected = TABS[index];
    if (
      tab.sheetId !== expected.sheetId ||
      tab.title !== expected.title ||
      tab.rowCount !== expected.rowCount ||
      tab.columnCount !== expected.columnCount ||
      tab.boundedRange !== expected.boundedRange ||
      tab.backupSpreadsheetId !== expected.backupSpreadsheetId ||
      tab.historicalSourceAndBackupSha256 !== expected.nativeCellPayloadSha256 ||
      tab.canonicalCellPayloadHashAlgorithm !==
        'google-sheets-v4-griddata-canonical-json-v1' ||
      tab.sourceCanonicalCellPayloadSha256 !== tab.backupCanonicalCellPayloadSha256
    ) {
      fail(`P9 source tab ${index + 1} identity or canonical backup equality is invalid`);
    }
    assertSha256(
      String(tab.sourceCanonicalCellPayloadSha256),
      `P9 source tab ${index + 1} canonical digest`,
    );
  });
  if (item.applicationReadChallenge !== null) {
    const challenge = asRecord(
      item.applicationReadChallenge,
      'P9 source application read challenge',
    );
    exactKeys(
      challenge,
      ['domain', 'nonce', 'hashAlgorithm', 'tabs'],
      'P9 source application read challenge',
    );
    if (
      challenge.domain !== P9_APPLICATION_READ_CHALLENGE_DOMAIN ||
      challenge.hashAlgorithm !== P9_APPLICATION_READ_CHALLENGE_HASH_ALGORITHM ||
      typeof challenge.nonce !== 'string' ||
      !/^[A-Za-z0-9_-]{32,128}$/.test(challenge.nonce) ||
      !Array.isArray(challenge.tabs) ||
      challenge.tabs.length !== TABS.length
    ) {
      fail('P9 source application read challenge is not exact and nonce-bound');
    }
    challenge.tabs.forEach((tabValue, index) => {
      const tab = asRecord(tabValue, `P9 source challenge tab ${index + 1}`);
      exactKeys(
        tab,
        [
          'sheetId',
          'title',
          'rowCount',
          'columnCount',
          'boundedRange',
          'nonceBoundCanonicalGridDataSha256',
        ],
        `P9 source challenge tab ${index + 1}`,
      );
      const expected = TABS[index];
      if (
        tab.sheetId !== expected.sheetId ||
        tab.title !== expected.title ||
        tab.rowCount !== expected.rowCount ||
        tab.columnCount !== expected.columnCount ||
        tab.boundedRange !== expected.boundedRange
      ) {
        fail(`P9 source challenge tab ${index + 1} identity is not exact`);
      }
      assertSha256(
        stringField(
          tab,
          'nonceBoundCanonicalGridDataSha256',
          `P9 source challenge tab ${index + 1}`,
        ),
        `P9 source challenge tab ${index + 1} digest`,
      );
    });
  }
  return item;
}

function validateImmediatePredecessor(
  descriptor: Predecessor,
  predecessor: JsonRecord,
  expectedPhase: Phase,
  baseline: string,
): void {
  if (
    descriptor.phase !== expectedPhase ||
    descriptor.workflowCommit !== baseline ||
    predecessor.p9BaselineCommit !== baseline
  ) {
    fail(`${expectedPhase} predecessor descriptor or receipt is rebound`);
  }
  const expectedJob = expectedPhase === 'entry' ? 'entry' : phaseJob(expectedPhase);
  const predecessorCapture = validateCapture(predecessor.capture, expectedJob, baseline);
  if (
    predecessorCapture.runId !== descriptor.runId ||
    predecessorCapture.runAttempt !== descriptor.runAttempt
  ) {
    fail(`${expectedPhase} predecessor run identity is rebound`);
  }
}

function validatePhaseReceipt(
  value: unknown,
  expectedPhase: DeploymentPhase,
  baseline: string,
  revision7Attestation: string,
  runtimeCommit: string,
  predecessor: JsonRecord,
  descriptor: Predecessor,
  pins: OperationalIdentityPins,
): JsonRecord {
  const item = asRecord(value, `${expectedPhase} phase receipt`);
  exactKeys(
    item,
    [
      'observationId',
      'schemaVersion',
      'kind',
      'stageId',
      'phase',
      'p9BaselineCommit',
      'revision7AttestationCommit',
      'runtimeCommit',
      'productionSpreadsheetId',
      'capture',
      'predecessor',
      'provider',
      'runtimeIdentity',
      'runtimeBinding',
      'deploymentObservation',
      'sourceObservation',
    ],
    `${expectedPhase} phase receipt`,
  );
  const { observationId, ...body } = item;
  if (
    observationId !== sha256Value(body) ||
    item.schemaVersion !== 2 ||
    item.kind !== 'p9-trusted-phase-v2' ||
    item.stageId !== 'P9' ||
    item.phase !== expectedPhase ||
    item.p9BaselineCommit !== baseline ||
    item.revision7AttestationCommit !== revision7Attestation ||
    item.runtimeCommit !== runtimeCommit ||
    item.productionSpreadsheetId !== PRODUCTION_ID ||
    canonicalJson(item.predecessor) !== canonicalJson(descriptor)
  ) {
    fail(`${expectedPhase} phase receipt is not exact and canonically derived`);
  }
  const predecessorPhase: Phase =
    expectedPhase === 'cutover' ? 'entry' : expectedPhase === 'rollback' ? 'cutover' : 'rollback';
  validateImmediatePredecessor(descriptor, predecessor, predecessorPhase, baseline);
  const provider = asRecord(item.provider, `${expectedPhase} provider`);
  exactKeys(
    provider,
    ['name', 'apiVersion', 'projectIdSha256', 'teamIdSha256'],
    `${expectedPhase} provider`,
  );
  if (provider.name !== 'vercel' || provider.apiVersion !== 'v13') {
    fail(`${expectedPhase} provider is not the exact authenticated Vercel provider`);
  }
  assertSha256(stringField(provider, 'projectIdSha256', `${expectedPhase} provider`), `${expectedPhase} project hash`);
  assertSha256(stringField(provider, 'teamIdSha256', `${expectedPhase} provider`), `${expectedPhase} team hash`);
  const predecessorProvider =
    predecessorPhase === 'entry'
      ? {
          name: 'vercel',
          apiVersion: 'v13',
          projectIdSha256: asRecord(
            predecessor.baselineProductionDeployment,
            'Entry baseline deployment',
          ).projectIdSha256,
          teamIdSha256: asRecord(
            predecessor.baselineProductionDeployment,
            'Entry baseline deployment',
          ).teamIdSha256,
        }
      : asRecord(predecessor.provider, `${predecessorPhase} predecessor provider`);
  assertProviderIdentity(provider as ProviderIdentity, predecessorProvider, expectedPhase);
  const runtimeIdentity = validateRuntimeIdentity(item.runtimeIdentity, expectedPhase);
  assertPinnedWorkflowEnvironment(pins);
  const predecessorRuntimeIdentity = validateRuntimeIdentity(
    predecessor.runtimeIdentity,
    `${predecessorPhase} predecessor`,
  );
  if (canonicalJson(runtimeIdentity) !== canonicalJson(predecessorRuntimeIdentity)) {
    fail(`${expectedPhase} runtime credential identity differs from its attested predecessor`);
  }
  const phaseCapture = validateCapture(item.capture, phaseJob(expectedPhase), baseline);
  const observation = asRecord(item.deploymentObservation, `${expectedPhase} deployment observation`);
  exactKeys(
    observation,
    [
      'observationId',
      'role',
      'deploymentId',
      'urlHost',
      'target',
      'readyState',
      'createdAt',
      'readyAt',
      'capture',
      'gitSource',
      'health',
    ],
    `${expectedPhase} deployment observation`,
  );
  const { observationId: deploymentObservationId, ...observationBase } = observation;
  if (
    deploymentObservationId !== sha256Value(observationBase) ||
    observation.role !== expectedPhase ||
    observation.target !== 'production' ||
    observation.readyState !== 'READY' ||
    canonicalJson(observation.capture) !== canonicalJson(phaseCapture)
  ) {
    fail(`${expectedPhase} deployment observation is not exact and derived`);
  }
  assertPinnedOperationalIdentity(
    provider as ProviderIdentity,
    runtimeIdentity,
    healthUrl(
      stringField(observation, 'urlHost', `${expectedPhase} deployment observation`),
    ),
    pins,
    `${expectedPhase} receipt`,
  );
  const gitSource = asRecord(observation.gitSource, `${expectedPhase} Git source`);
  const health = asRecord(observation.health, `${expectedPhase} health`);
  exactKeys(
    health,
    [
      'observedAt',
      'statusCode',
      'contentType',
      'nonce',
      'commit',
      'deploymentId',
      'environment',
      'runtimeConfig',
      'runtimeConfigSha256',
      'applicationRuntimeBinding',
      'applicationReadProbe',
    ],
    `${expectedPhase} health`,
  );
  const runtimeBinding = validateApplicationReadRuntimeBinding(
    item.runtimeBinding,
    runtimeCommit,
    `${expectedPhase} phase receipt`,
  );
  const healthRuntimeBinding = validateApplicationReadRuntimeBinding(
    health.applicationRuntimeBinding,
    runtimeCommit,
    `${expectedPhase} health`,
  );
  if (
    gitSource.type !== 'github' ||
    gitSource.sha !== runtimeCommit ||
    health.statusCode !== 200 ||
    health.contentType !== 'application/json' ||
    health.commit !== runtimeCommit ||
    health.deploymentId !== observation.deploymentId ||
    health.environment !== 'production' ||
    canonicalJson(runtimeBinding) !== canonicalJson(healthRuntimeBinding) ||
    health.runtimeConfigSha256 !== sha256Value(health.runtimeConfig) ||
    asRecord(health.runtimeConfig, `${expectedPhase} runtime config`)
      .runtimeIdentityFingerprintSha256 !== runtimeIdentity.principalFingerprintSha256
  ) {
    fail(`${expectedPhase} provider, Git, health, or runtime-config identity disagrees`);
  }
  validateRuntimeConfig(health.runtimeConfig, expectedPhase);
  const applicationReadProbe = validateApplicationReadProbe(
    health.applicationReadProbe,
    expectedPhase,
    stringField(health, 'nonce', `${expectedPhase} health`),
    runtimeBinding,
  );
  requireFreshApplicationReadProbe(
    applicationReadProbe,
    health.observedAt,
    expectedPhase,
  );
  const source = validateSourceObservationShape(item.sourceObservation);
  bindApplicationReadProbeToSource(applicationReadProbe, source, expectedPhase);
  if (
    source.backupReadPrincipalFingerprintSha256 !==
      runtimeIdentity.principalFingerprintSha256 ||
    source.backupReadPrincipalFingerprintSha256 !==
      pins.backupRuntimePrincipalFingerprintSha256
  ) {
    fail(`${expectedPhase} backups were not read by the exact runtime principal`);
  }
  const predecessorCapture = asRecord(predecessor.capture, 'Immediate predecessor capture');
  ordered(predecessorCapture.completedAt, observation.createdAt, `${expectedPhase} predecessor proof`);
  ordered(observation.createdAt, observation.readyAt, `${expectedPhase} deployment readiness`);
  ordered(observation.readyAt, phaseCapture.startedAt, `${expectedPhase} proof start`);
  if (applicationReadProbe !== null) {
    ordered(
      phaseCapture.startedAt,
      applicationReadProbe.startedAt,
      `${expectedPhase} proof-to-application read`,
    );
    ordered(
      applicationReadProbe.completedAt,
      health.observedAt,
      `${expectedPhase} application-read-to-health observation`,
    );
  }
  ordered(phaseCapture.startedAt, health.observedAt, `${expectedPhase} health observation`);
  ordered(health.observedAt, source.startedAt, `${expectedPhase} health-to-source observation`);
  ordered(source.completedAt, phaseCapture.completedAt, `${expectedPhase} proof completion`);
  if (Date.parse(String(health.observedAt)) - Date.parse(String(observation.readyAt)) > 15 * 60_000) {
    fail(`${expectedPhase} READY-to-health freshness window is invalid`);
  }
  if (Date.parse(String(phaseCapture.completedAt)) - Date.parse(String(phaseCapture.startedAt)) > 30 * 60_000) {
    fail(`${expectedPhase} phase capture exceeds 30 minutes`);
  }
  return item;
}

function gh(args: string[], label: string, captureOutput = false): string {
  const result = spawnSync('gh', args, {
    encoding: 'utf8',
    maxBuffer: MAX_RESPONSE_BYTES,
    stdio: captureOutput ? ['ignore', 'pipe', 'pipe'] : ['ignore', 'ignore', 'pipe'],
  });
  if (result.status !== 0) fail(`${label} failed closed`);
  return captureOutput ? result.stdout : '';
}

function artifactName(predecessor: Predecessor): string {
  const kind =
    predecessor.phase === 'entry'
      ? 'entry'
      : predecessor.phase === 'restored-cutover'
        ? 'restored-phase'
        : `${predecessor.phase}-phase`;
  return `p9-${kind}-${predecessor.runId}-${predecessor.runAttempt}`;
}

function subjectBasename(phase: Phase): string {
  return phase === 'entry' ? 'P9-entry.json' : 'p9-phase.json';
}

function findOnlySubject(directory: string, basename: string): string {
  const matches: string[] = [];
  const walk = (current: string): void => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const child = path.join(current, entry.name);
      if (entry.isDirectory()) walk(child);
      else if (entry.isFile() && entry.name === basename) matches.push(child);
    }
  };
  walk(directory);
  if (matches.length !== 1) fail(`Downloaded artifact does not contain exactly one ${basename}`);
  return matches[0];
}

function validateDownloadedSubject(file: string, descriptor: Predecessor): void {
  const value = readJson(file, `${descriptor.phase} predecessor`);
  const captureValue = asRecord(value.capture, `${descriptor.phase} predecessor capture`);
  if (
    captureValue.workflowCommit !== descriptor.workflowCommit ||
    captureValue.headSha !== descriptor.workflowCommit ||
    captureValue.runId !== descriptor.runId ||
    captureValue.runAttempt !== descriptor.runAttempt
  ) {
    fail(`${descriptor.phase} predecessor capture is rebound`);
  }
  if (descriptor.phase === 'entry') {
    if (value.receiptType !== 'entry') fail('Entry predecessor is not an entry receipt');
  } else if (value.phase !== descriptor.phase || value.kind !== 'p9-trusted-phase-v2') {
    fail(`${descriptor.phase} predecessor is not the exact phase receipt`);
  }
}

function fetchPredecessors(): void {
  const context = verifyWorkflow(env('GITHUB_JOB'), false);
  const descriptors = parsePredecessors();
  const destination = path.resolve(env('P9_PREDECESSOR_DIR'));
  fs.mkdirSync(destination, { recursive: true });
  for (const descriptor of descriptors) {
    if (descriptor.workflowCommit !== context.baseline) {
      fail(`${descriptor.phase} predecessor is not baseline-bound`);
    }
    const runJson = gh(
      [
        'api',
        `repos/${REPOSITORY}/actions/runs/${descriptor.runId}/attempts/${descriptor.runAttempt}`,
      ],
      `${descriptor.phase} run metadata`,
      true,
    );
    const run = asRecord(JSON.parse(runJson), `${descriptor.phase} run metadata`);
    if (
      run.id !== descriptor.runId ||
      run.run_attempt !== descriptor.runAttempt ||
      run.head_sha !== context.baseline ||
      run.event !== 'workflow_dispatch' ||
      run.path !== WORKFLOW_PATH ||
      run.conclusion !== 'success'
    ) {
      fail(`${descriptor.phase} predecessor run metadata is not exact`);
    }
    const artifactJson = gh(
      ['api', `repos/${REPOSITORY}/actions/artifacts/${descriptor.artifactId}`],
      `${descriptor.phase} artifact metadata`,
      true,
    );
    const artifact = asRecord(JSON.parse(artifactJson), `${descriptor.phase} artifact metadata`);
    const workflowRun = asRecord(artifact.workflow_run, `${descriptor.phase} artifact workflow run`);
    if (
      artifact.id !== descriptor.artifactId ||
      artifact.name !== artifactName(descriptor) ||
      artifact.expired !== false ||
      workflowRun.id !== descriptor.runId ||
      workflowRun.head_sha !== context.baseline
    ) {
      fail(`${descriptor.phase} artifact metadata is not exact`);
    }
    const downloadDirectory = path.join(destination, `download-${descriptor.phase}`);
    fs.mkdirSync(downloadDirectory, { recursive: true });
    gh(
      [
        'run',
        'download',
        String(descriptor.runId),
        '--repo',
        REPOSITORY,
        '--name',
        artifactName(descriptor),
        '--dir',
        downloadDirectory,
      ],
      `${descriptor.phase} artifact download`,
    );
    const subject = findOnlySubject(downloadDirectory, subjectBasename(descriptor.phase));
    if (sha256Text(fs.readFileSync(subject)) !== descriptor.subjectSha256) {
      fail(`${descriptor.phase} predecessor digest does not match the descriptor`);
    }
    gh(
      [
        'attestation',
        'verify',
        subject,
        '--repo',
        REPOSITORY,
        '--signer-workflow',
        SIGNER_WORKFLOW,
        '--source-digest',
        context.baseline,
        '--deny-self-hosted-runners',
      ],
      `${descriptor.phase} GitHub OIDC attestation verification`,
    );
    validateDownloadedSubject(subject, descriptor);
    fs.copyFileSync(subject, path.join(destination, `${descriptor.phase}.json`));
  }
  writeJson(path.join(destination, 'verified-predecessors.json'), { descriptors });
  console.log('P9 predecessor artifacts and GitHub OIDC attestations verified.');
}

function emitSuccessorDescriptor(): void {
  const context = verifyWorkflow(env('GITHUB_JOB'), false);
  const phaseValue = env('P9_DESCRIPTOR_PHASE');
  if (!['entry', 'cutover', 'rollback', 'restored-cutover'].includes(phaseValue)) {
    fail('Successor descriptor phase is invalid');
  }
  const subject = path.resolve(env('P9_SUBJECT_PATH'));
  const expectedBasename = subjectBasename(phaseValue as Phase);
  if (!fs.statSync(subject).isFile() || path.basename(subject) !== expectedBasename) {
    fail('Successor descriptor subject is not the exact receipt');
  }
  const descriptor: Predecessor = {
    phase: phaseValue as Phase,
    runId: context.runId,
    runAttempt: context.runAttempt,
    artifactId: positiveInteger(env('P9_ARTIFACT_ID'), 'Uploaded artifact ID'),
    subjectSha256: sha256Text(fs.readFileSync(subject)),
    workflowCommit: context.baseline,
  };
  const summaryPath = path.resolve(env('GITHUB_STEP_SUMMARY'));
  fs.appendFileSync(
    summaryPath,
    `\n### Verified successor descriptor\n\n\`\`\`json\n${JSON.stringify(descriptor)}\n\`\`\`\n`,
  );
  console.log('P9 verified successor descriptor published to the run summary.');
}

function loadVerifiedPredecessors(expected: Phase[]): Map<Phase, JsonRecord> {
  const directory = path.resolve(env('P9_PREDECESSOR_DIR'));
  const descriptors = parsePredecessors();
  if (canonicalJson(descriptors.map((item) => item.phase)) !== canonicalJson(expected)) {
    fail(`Expected predecessor chain ${expected.join(' -> ')}`);
  }
  const verified = readJson(
    path.join(directory, 'verified-predecessors.json'),
    'verified predecessor ledger',
  );
  exactKeys(verified, ['descriptors'], 'verified predecessor ledger');
  if (canonicalJson(verified.descriptors) !== canonicalJson(descriptors)) {
    fail('Verified predecessor ledger differs from the dispatch descriptor');
  }
  return new Map(
    descriptors.map((descriptor) => [
      descriptor.phase,
      readJson(path.join(directory, `${descriptor.phase}.json`), `${descriptor.phase} predecessor`),
    ]),
  );
}

function providerTime(value: unknown, label: string): { epoch: number; iso: string } {
  const epoch =
    typeof value === 'number'
      ? value
      : typeof value === 'string' && /^\d+$/.test(value)
        ? Number(value)
        : typeof value === 'string'
          ? Date.parse(value)
          : Number.NaN;
  if (!Number.isFinite(epoch) || epoch <= 0) fail(`${label} is invalid`);
  return { epoch, iso: new Date(epoch).toISOString() };
}

async function parseBoundedJsonResponse(
  response: Response,
  label: string,
  maximumResponseBytes: number,
): Promise<JsonRecord> {
  const contentLength = response.headers.get('content-length');
  if (
    response.status !== 200 ||
    !response.headers.get('content-type')?.toLowerCase().includes('application/json') ||
    (contentLength !== null &&
      (!/^\d+$/.test(contentLength) || Number(contentLength) > maximumResponseBytes))
  ) {
    fail(`${label} did not return bounded authenticated JSON`);
  }
  if (!response.body) fail(`${label} returned no JSON body`);
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  while (true) {
    const next = await reader.read();
    if (next.done) break;
    totalBytes += next.value.byteLength;
    if (totalBytes > maximumResponseBytes) {
      await reader.cancel();
      fail(`${label} exceeded its authenticated JSON byte bound`);
    }
    chunks.push(next.value);
  }
  const raw = Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))).toString('utf8');
  try {
    return asRecord(JSON.parse(raw), `${label} response`);
  } catch {
    fail(`${label} returned malformed JSON`);
  }
}

async function fetchJson(
  url: URL,
  label: string,
  headers: Record<string, string>,
  maximumResponseBytes = MAX_RESPONSE_BYTES,
): Promise<JsonRecord> {
  const response = await fetch(url, {
    method: 'GET',
    headers,
    cache: 'no-store',
    redirect: 'manual',
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  return parseBoundedJsonResponse(response, label, maximumResponseBytes);
}

function healthUrl(value: string): URL {
  let url: URL;
  try {
    url = new URL(/^https:\/\//i.test(value) ? value : `https://${value}`);
  } catch {
    fail('Trusted health URL is invalid');
  }
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    url.port ||
    url.search ||
    url.hash
  ) {
    fail('Trusted health URL violates the HTTPS host boundary');
  }
  url.hostname = url.hostname.toLowerCase();
  url.pathname = '/api/health';
  return url;
}

function assertHealthHostAuthorized(url: URL, aliases: ReadonlySet<string>): void {
  if (!aliases.has(url.hostname.toLowerCase())) {
    fail('Trusted health hostname is not an authenticated deployment alias');
  }
}

function selectPinnedCanonicalHealthUrl(
  aliases: ReadonlySet<string>,
  pins: OperationalIdentityPins,
): URL {
  const matches = [...aliases].filter(
    (hostname) =>
      p9CanonicalProductionHostnameFingerprint(hostname) ===
      pins.providerCanonicalProductionHostnameSha256,
  );
  if (matches.length !== 1) {
    fail('Authenticated deployment aliases do not contain exactly one pinned Production host');
  }
  return healthUrl(matches[0]);
}

function assertPinnedOperationalIdentity(
  provider: ProviderIdentity,
  runtimeIdentity: RuntimeIdentity,
  canonicalHealthUrl: URL,
  pins: OperationalIdentityPins,
  label: string,
): void {
  if (
    provider.projectIdSha256 !== pins.providerProjectFingerprintSha256 ||
    provider.teamIdSha256 !== pins.providerTeamFingerprintSha256
  ) {
    fail(`${label} provider project or team differs from the delivered authority pin`);
  }
  if (
    runtimeIdentity.principalFingerprintSha256 !==
      pins.runtimePrincipalFingerprintSha256 ||
    runtimeIdentity.principalFingerprintSha256 !==
      pins.backupRuntimePrincipalFingerprintSha256
  ) {
    fail(`${label} runtime principal differs from the delivered source/backup pin`);
  }
  if (
    p9RuntimeCredentialProvenanceFingerprint(runtimeIdentity) !==
    pins.runtimeCredentialProvenanceFingerprintSha256
  ) {
    fail(`${label} Vercel credential provenance differs from the delivered authority pin`);
  }
  if (
    p9CanonicalProductionHostnameFingerprint(canonicalHealthUrl.hostname) !==
    pins.providerCanonicalProductionHostnameSha256
  ) {
    fail(`${label} health host differs from the delivered canonical Production pin`);
  }
}

function assertProviderIdentity(
  actual: ProviderIdentity,
  expected: JsonRecord | ProviderIdentity,
  label: string,
): void {
  const expectedRecord = asRecord(expected, `${label} expected provider`);
  exactKeys(
    expectedRecord,
    ['name', 'apiVersion', 'projectIdSha256', 'teamIdSha256'],
    `${label} expected provider`,
  );
  if (
    expectedRecord.name !== actual.name ||
    expectedRecord.apiVersion !== actual.apiVersion ||
    expectedRecord.projectIdSha256 !== actual.projectIdSha256 ||
    expectedRecord.teamIdSha256 !== actual.teamIdSha256
  ) {
    fail(`${label} provider identity differs from its attested predecessor`);
  }
}

function validateRuntimeIdentity(value: unknown, label: string): RuntimeIdentity {
  const identity = asRecord(value, `${label} runtime identity`);
  exactKeys(
    identity,
    [
      'accessMethod',
      'credentialSource',
      'credentialKey',
      'environmentVariableIdSha256',
      'environmentVariableUpdatedAt',
      'principalFingerprintSha256',
      'runtimeOAuthScopes',
      'evidenceOAuthScopes',
    ],
    `${label} runtime identity`,
  );
  if (
    identity.accessMethod !== 'vercel-production-environment-api-bounded-read' ||
    identity.credentialSource !==
      'authenticated-vercel-project-production-environment' ||
    identity.credentialKey !== 'GOOGLE_SERVICE_ACCOUNT_CREDENTIALS' ||
    canonicalJson(identity.runtimeOAuthScopes) !== canonicalJson([SHEETS_READ_SCOPE]) ||
    canonicalJson(identity.evidenceOAuthScopes) !==
      canonicalJson([DRIVE_METADATA_SCOPE, SHEETS_READ_SCOPE])
  ) {
    fail(`${label} runtime identity does not use the exact bounded read-only mode`);
  }
  assertSha256(
    stringField(identity, 'environmentVariableIdSha256', `${label} runtime identity`),
    `${label} environment-variable ID hash`,
  );
  timestamp(identity.environmentVariableUpdatedAt, `${label} environment-variable update`);
  assertSha256(
    stringField(identity, 'principalFingerprintSha256', `${label} runtime identity`),
    `${label} principal fingerprint`,
  );
  return identity as RuntimeIdentity;
}

function validateRuntimeConfig(value: unknown, phase: DeploymentPhase): JsonRecord {
  const config = asRecord(value, `${phase} runtime config`);
  exactKeys(
    config,
    [
      'schemaVersion',
      'sourceMode',
      'productionRead',
      'staticCatalog',
      'writePolicy',
      'mappingVersion',
      'runtimeIdentityFingerprintSha256',
    ],
    `${phase} runtime config`,
  );
  if (config.schemaVersion !== 1) fail(`${phase} runtime config version is invalid`);
  assertSha256(
    stringField(config, 'runtimeIdentityFingerprintSha256', `${phase} runtime config`),
    `${phase} runtime identity fingerprint`,
  );
  stringField(config, 'mappingVersion', `${phase} runtime config`);
  const policy = asRecord(config.writePolicy, `${phase} write policy`);
  exactKeys(
    policy,
    [
      'spreadsheetId',
      'blockedSpreadsheetIds',
      'productionWritesDisabled',
      'writerEnabled',
      'surfaces',
    ],
    `${phase} write policy`,
  );
  if (
    policy.spreadsheetId !== TESTING_ID ||
    canonicalJson(policy.blockedSpreadsheetIds) !== canonicalJson([PRODUCTION_ID]) ||
    policy.productionWritesDisabled !== true ||
    typeof policy.writerEnabled !== 'boolean' ||
    !Array.isArray(policy.surfaces) ||
    policy.surfaces.length === 0 ||
    policy.surfaces.some((surface) => typeof surface !== 'string' || !surface.trim()) ||
    new Set(policy.surfaces).size !== policy.surfaces.length
  ) {
    fail(`${phase} runtime write policy is not exact and production-write-isolated`);
  }
  if (phase === 'rollback') {
    const catalog = asRecord(config.staticCatalog, 'rollback static catalog');
    if (
      config.sourceMode !== 'accepted-p7-static-catalog' ||
      config.productionRead !== null ||
      catalog.path !== STATIC_CATALOG_PATH
    ) {
      fail('Rollback runtime source is not the accepted P7 catalog');
    }
    assertSha256(stringField(catalog, 'sha256', 'rollback static catalog'), 'Static catalog hash');
  } else {
    const read = asRecord(config.productionRead, `${phase} production read config`);
    if (
      config.sourceMode !== 'production-google-sheet-read-only' ||
      config.staticCatalog !== null ||
      read.spreadsheetId !== PRODUCTION_ID ||
      canonicalJson(read.oauthScopes) !== canonicalJson([SHEETS_READ_SCOPE]) ||
      canonicalJson(read.tabs) !==
        canonicalJson(TABS.map(({ sheetId, boundedRange }) => ({ sheetId, boundedRange })))
    ) {
      fail(`${phase} runtime source is not the exact bounded read-only production source`);
    }
  }
  return config;
}

function validateApplicationReadRuntimeBinding(
  value: unknown,
  runtimeCommit: string,
  label: string,
): JsonRecord {
  const binding = asRecord(value, `${label} runtime binding`);
  exactKeys(
    binding,
    [
      'schemaVersion',
      'runtimeCommit',
      'runtimeBindingModule',
      'runtimeSourceClosure',
      'loader',
      'healthRoute',
      'publicRoute',
      'bindingSha256',
    ],
    `${label} runtime binding`,
  );
  const runtimeBindingModule = asRecord(
    binding.runtimeBindingModule,
    `${label} runtime binding module`,
  );
  exactKeys(
    runtimeBindingModule,
    ['path', 'directLiteralExport', 'sideEffectFree'],
    `${label} runtime binding module`,
  );
  const runtimeSourceClosure = asRecord(
    binding.runtimeSourceClosure,
    `${label} runtime source closure`,
  );
  exactKeys(
    runtimeSourceClosure,
    [
      'method',
      'excludedLiteralBindingModulePath',
      'fileCount',
      'sha256',
      'builtInPrototypeMutationFree',
    ],
    `${label} runtime source closure`,
  );
  const loader = asRecord(binding.loader, `${label} runtime loader binding`);
  exactKeys(
    loader,
    [
      'path',
      'exportName',
      'fileSha256',
      'directNamedExport',
      'internalSourceMode',
      'exactRuntimeCredentialSource',
      'exactBoundedCredentialParser',
      'exactSheetsV4Client',
      'soleReadonlyScope',
      'exactProductionSpreadsheetId',
      'exactOrderedRanges',
      'includeGridData',
      'boundedFields',
      'rollbackBeforeGoogleConstruction',
      'nonceChallengeDirectDataflow',
      'scholarshipsDirectResponseDataflow',
      'directRuntimeBindingFlow',
    ],
    `${label} runtime loader binding`,
  );
  const healthRoute = asRecord(
    binding.healthRoute,
    `${label} runtime health-route binding`,
  );
  exactKeys(
    healthRoute,
    [
      'path',
      'fileSha256',
      'directNamedImport',
      'directAwait',
      'validatedNonceDirectArgument',
      'directProbeResultFlow',
      'directRuntimeBindingFlow',
    ],
    `${label} runtime health-route binding`,
  );
  const publicRoute = asRecord(
    binding.publicRoute,
    `${label} runtime public-route binding`,
  );
  exactKeys(
    publicRoute,
    [
      'path',
      'fileSha256',
      'directNamedImport',
      'directAwait',
      'directScholarshipsResultFlow',
    ],
    `${label} runtime public-route binding`,
  );
  const { bindingSha256, ...base } = binding;
  if (
    binding.schemaVersion !== 1 ||
    binding.runtimeCommit !== runtimeCommit ||
    bindingSha256 !== sha256Value(base) ||
    runtimeBindingModule.path !== P9_APPLICATION_RUNTIME_BINDING_MODULE_PATH ||
    runtimeBindingModule.directLiteralExport !== true ||
    runtimeBindingModule.sideEffectFree !== true ||
    runtimeSourceClosure.method !==
      'sha256-sorted-runtime-path-and-blob-v1' ||
    runtimeSourceClosure.excludedLiteralBindingModulePath !==
      P9_APPLICATION_RUNTIME_BINDING_MODULE_PATH ||
    !Number.isInteger(runtimeSourceClosure.fileCount) ||
    Number(runtimeSourceClosure.fileCount) < 1 ||
    runtimeSourceClosure.builtInPrototypeMutationFree !== true ||
    loader.path !== P9_PRODUCTION_SOURCE_LOADER_PATH ||
    loader.exportName !== P9_PRODUCTION_SOURCE_LOADER_EXPORT ||
    loader.directNamedExport !== true ||
    loader.internalSourceMode !== true ||
    loader.exactRuntimeCredentialSource !== true ||
    loader.exactBoundedCredentialParser !== true ||
    loader.exactSheetsV4Client !== true ||
    loader.soleReadonlyScope !== true ||
    loader.exactProductionSpreadsheetId !== true ||
    loader.exactOrderedRanges !== true ||
    loader.includeGridData !== true ||
    loader.boundedFields !== true ||
    loader.rollbackBeforeGoogleConstruction !== true ||
    loader.nonceChallengeDirectDataflow !== true ||
    loader.scholarshipsDirectResponseDataflow !== true ||
    loader.directRuntimeBindingFlow !== true ||
    healthRoute.path !== P9_HEALTH_ROUTE_PATH ||
    healthRoute.directNamedImport !== true ||
    healthRoute.directAwait !== true ||
    healthRoute.validatedNonceDirectArgument !== true ||
    healthRoute.directProbeResultFlow !== true ||
    healthRoute.directRuntimeBindingFlow !== true ||
    publicRoute.path !== P9_PUBLIC_ROUTE_PATH ||
    publicRoute.directNamedImport !== true ||
    publicRoute.directAwait !== true ||
    publicRoute.directScholarshipsResultFlow !== true
  ) {
    fail(`${label} runtime binding is not exact, rollback-safe, and canonically derived`);
  }
  for (const [digest, digestLabel] of [
    [bindingSha256, 'binding'],
    [runtimeSourceClosure.sha256, 'runtime source closure'],
    [loader.fileSha256, 'loader'],
    [healthRoute.fileSha256, 'health route'],
    [publicRoute.fileSha256, 'public route'],
  ] as const) {
    assertSha256(String(digest), `${label} runtime ${digestLabel} digest`);
  }
  return binding;
}

function independentlyDeriveRuntimeBinding(
  runtimeRootValue: string,
  runtimeCommit: string,
  label: string,
): JsonRecord {
  const runtimeRoot = path.resolve(runtimeRootValue);
  assertSha40(runtimeCommit, `${label} commit`);
  const git = spawnSync('git', ['rev-parse', 'HEAD'], {
    cwd: runtimeRoot,
    encoding: 'utf8',
    env: { ...process.env, PATH: process.env.PATH ?? '' },
  });
  if (git.status !== 0 || git.stdout.trim() !== runtimeCommit) {
    fail(`${label} checkout is not the exact runtime commit`);
  }
  const topLevel = spawnSync('git', ['rev-parse', '--show-toplevel'], {
    cwd: runtimeRoot,
    encoding: 'utf8',
    env: { ...process.env, PATH: process.env.PATH ?? '' },
  });
  if (
    topLevel.status !== 0 ||
    path.resolve(topLevel.stdout.trim()) !== runtimeRoot
  ) {
    fail(`${label} path is not the exact runtime repository root`);
  }
  const trackedStatus = spawnSync(
    'git',
    ['status', '--porcelain=v1', '--untracked-files=all'],
    {
      cwd: runtimeRoot,
      encoding: 'utf8',
      env: { ...process.env, PATH: process.env.PATH ?? '' },
    },
  );
  if (trackedStatus.status !== 0 || trackedStatus.stdout.length !== 0) {
    fail(`${label} checkout contains tracked index or worktree changes`);
  }
  for (const relativePath of [
    P9_APPLICATION_RUNTIME_BINDING_MODULE_PATH,
    P9_PRODUCTION_SOURCE_LOADER_PATH,
    P9_HEALTH_ROUTE_PATH,
    P9_PUBLIC_ROUTE_PATH,
  ]) {
    const checkedOutBytes = fs.readFileSync(path.join(runtimeRoot, relativePath));
    const committed = spawnSync(
      'git',
      ['show', `${runtimeCommit}:${relativePath}`],
      {
        cwd: runtimeRoot,
        encoding: null,
        maxBuffer: 4 * 1024 * 1024,
        env: { ...process.env, PATH: process.env.PATH ?? '' },
      },
    );
    if (
      committed.status !== 0 ||
      !Buffer.isBuffer(committed.stdout) ||
      sha256Text(checkedOutBytes) !== sha256Text(committed.stdout)
    ) {
      fail(`${label} ${relativePath} bytes do not belong to the exact runtime commit`);
    }
  }
  const binding = deriveP9ApplicationReadRuntimeBinding({
    runtimeCommit,
    repositoryRoot: runtimeRoot,
  }) as unknown as JsonRecord;
  return validateApplicationReadRuntimeBinding(binding, runtimeCommit, label);
}

function requireByteIdenticalRuntimeBindings(
  bindings: readonly JsonRecord[],
  label: string,
): void {
  if (
    bindings.length === 0 ||
    bindings.some(
      (binding) => canonicalJson(binding) !== canonicalJson(bindings[0]),
    )
  ) {
    fail(`${label} application runtime bindings are not byte-identical`);
  }
}

function validateApplicationReadProbe(
  value: unknown,
  phase: DeploymentPhase,
  expectedNonce: string,
  expectedRuntimeBinding: JsonRecord,
): JsonRecord | null {
  if (!/^[A-Za-z0-9_-]{32,128}$/.test(expectedNonce)) {
    fail(`${phase} health nonce is not a bounded base64url value`);
  }
  if (phase === 'rollback') {
    if (value !== null) {
      fail('Rollback health must not read the production spreadsheet');
    }
    return null;
  }

  const probe = asRecord(value, `${phase} application read probe`);
  exactKeys(
    probe,
    [
      'observationId',
      'domain',
      'challengeHashAlgorithm',
      'nonce',
      'startedAt',
      'completedAt',
      'spreadsheetId',
      'oauthScopes',
      'tabs',
      'runtimeBinding',
    ],
    `${phase} application read probe`,
  );
  const { observationId, ...base } = probe;
  if (
    observationId !== sha256Value(base) ||
    probe.domain !== P9_APPLICATION_READ_CHALLENGE_DOMAIN ||
    probe.challengeHashAlgorithm !== P9_APPLICATION_READ_CHALLENGE_HASH_ALGORITHM ||
    probe.nonce !== expectedNonce ||
    probe.spreadsheetId !== PRODUCTION_ID ||
    canonicalJson(probe.oauthScopes) !== canonicalJson([SHEETS_READ_SCOPE])
  ) {
    fail(`${phase} application read probe is not exact, nonce-bound, and derived`);
  }
  const runtimeBinding = validateApplicationReadRuntimeBinding(
    probe.runtimeBinding,
    stringField(expectedRuntimeBinding, 'runtimeCommit', `${phase} expected runtime binding`),
    `${phase} application read probe`,
  );
  if (canonicalJson(runtimeBinding) !== canonicalJson(expectedRuntimeBinding)) {
    fail(`${phase} application read probe is not bound to the exact runtime checkout`);
  }
  assertSha256(String(observationId), `${phase} application read observation ID`);
  ordered(probe.startedAt, probe.completedAt, `${phase} application read probe`);
  if (
    Date.parse(String(probe.completedAt)) - Date.parse(String(probe.startedAt)) >
    15 * 60_000
  ) {
    fail(`${phase} application read probe exceeds 15 minutes`);
  }
  if (!Array.isArray(probe.tabs) || probe.tabs.length !== TABS.length) {
    fail(`${phase} application read probe does not contain the exact authorized tabs`);
  }
  probe.tabs.forEach((tabValue, index) => {
    const tab = asRecord(tabValue, `${phase} application read tab ${index + 1}`);
    exactKeys(
      tab,
      [
        'sheetId',
        'title',
        'rowCount',
        'columnCount',
        'boundedRange',
        'nonceBoundCanonicalGridDataSha256',
      ],
      `${phase} application read tab ${index + 1}`,
    );
    const expected = TABS[index];
    if (
      tab.sheetId !== expected.sheetId ||
      tab.title !== expected.title ||
      tab.rowCount !== expected.rowCount ||
      tab.columnCount !== expected.columnCount ||
      tab.boundedRange !== expected.boundedRange
    ) {
      fail(`${phase} application read tab ${index + 1} is not the exact authorized tab`);
    }
    assertSha256(
      stringField(
        tab,
        'nonceBoundCanonicalGridDataSha256',
        `${phase} application read tab ${index + 1}`,
      ),
      `${phase} application read tab ${index + 1} canonical digest`,
    );
  });
  return probe;
}

function requireFreshApplicationReadProbe(
  probe: JsonRecord | null,
  observedAt: unknown,
  phase: DeploymentPhase,
): void {
  if (probe === null) return;
  ordered(probe.completedAt, observedAt, `${phase} application-read-to-health observation`);
  if (Date.parse(String(observedAt)) - Date.parse(String(probe.completedAt)) > 15 * 60_000) {
    fail(`${phase} application read probe is stale at health observation`);
  }
}

function bindApplicationReadProbeToSource(
  probe: JsonRecord | null,
  source: JsonRecord,
  phase: DeploymentPhase,
): void {
  if (phase === 'rollback') {
    if (probe !== null || source.applicationReadChallenge !== null) {
      fail('Rollback application read probe and independent challenge must remain null');
    }
    return;
  }
  if (probe === null) fail(`${phase} application read probe is missing`);
  const challenge = asRecord(
    source.applicationReadChallenge,
    `${phase} independent application read challenge`,
  );
  exactKeys(
    challenge,
    ['domain', 'nonce', 'hashAlgorithm', 'tabs'],
    `${phase} independent application read challenge`,
  );
  if (
    probe.spreadsheetId !== source.spreadsheetId ||
    probe.domain !== challenge.domain ||
    probe.nonce !== challenge.nonce ||
    probe.challengeHashAlgorithm !== challenge.hashAlgorithm ||
    canonicalJson(probe.tabs) !== canonicalJson(challenge.tabs)
  ) {
    fail(`${phase} application read does not match the independent nonce-bound source challenge`);
  }
}

function validateHealthResponseBody(
  body: JsonRecord,
  phase: DeploymentPhase,
  deploymentId: string,
  runtimeCommit: string,
  nonce: string,
  runtimeBinding: JsonRecord,
): {
  config: JsonRecord;
  applicationRuntimeBinding: JsonRecord;
  applicationReadProbe: JsonRecord | null;
} {
  exactKeys(
    body,
    [
      'ok',
      'nonce',
      'commit',
      'deploymentId',
      'environment',
      'runtimeConfig',
      'runtimeConfigSha256',
      'applicationRuntimeBinding',
      'applicationReadProbe',
    ],
    `${phase} health response`,
  );
  if (
    body.ok !== true ||
    body.nonce !== nonce ||
    body.commit !== runtimeCommit ||
    body.deploymentId !== deploymentId ||
    body.environment !== 'production'
  ) {
    fail(`${phase} authenticated health identity is not exact`);
  }
  const config = validateRuntimeConfig(body.runtimeConfig, phase);
  const digest = sha256Value(config);
  if (body.runtimeConfigSha256 !== digest) {
    fail(`${phase} runtime configuration digest is not canonically derived`);
  }
  const applicationRuntimeBinding = validateApplicationReadRuntimeBinding(
    body.applicationRuntimeBinding,
    runtimeCommit,
    `${phase} health response`,
  );
  if (canonicalJson(applicationRuntimeBinding) !== canonicalJson(runtimeBinding)) {
    fail(`${phase} health response is not bound to the independently inspected runtime`);
  }
  const applicationReadProbe = validateApplicationReadProbe(
    body.applicationReadProbe,
    phase,
    nonce,
    runtimeBinding,
  );
  return { config, applicationRuntimeBinding, applicationReadProbe };
}

async function observeHealth(
  base: URL,
  aliases: ReadonlySet<string>,
  phase: DeploymentPhase,
  deploymentId: string,
  runtimeCommit: string,
  runtimeBinding: JsonRecord,
): Promise<JsonRecord> {
  // This check deliberately precedes retrieval of the protection-bypass secret.
  assertHealthHostAuthorized(base, aliases);
  const nonce = randomBytes(24).toString('base64url');
  const url = new URL(base);
  url.searchParams.set('p9_evidence_nonce', nonce);
  const bypassSecret = env('P9_HEALTH_BYPASS_SECRET');
  const body = await fetchJson(
    url,
    `${phase} health`,
    {
      accept: 'application/json',
      'cache-control': 'no-store',
      'x-p9-evidence-nonce': nonce,
      'x-vercel-protection-bypass': bypassSecret,
    },
    MAX_HEALTH_RESPONSE_BYTES,
  );
  const { config, applicationRuntimeBinding, applicationReadProbe } =
    validateHealthResponseBody(
    body,
    phase,
    deploymentId,
    runtimeCommit,
    nonce,
    runtimeBinding,
    );
  const digest = sha256Value(config);
  const observedAt = new Date().toISOString();
  requireFreshApplicationReadProbe(applicationReadProbe, observedAt, phase);
  return {
    observedAt,
    statusCode: 200,
    contentType: 'application/json',
    nonce,
    commit: runtimeCommit,
    deploymentId,
    environment: 'production',
    runtimeConfig: config,
    runtimeConfigSha256: digest,
    applicationRuntimeBinding,
    applicationReadProbe,
  };
}

function productionTargetOnly(value: unknown): boolean {
  return Array.isArray(value) &&
    value.length === 1 &&
    value[0] === 'production';
}

function deploymentAliasHosts(deployment: JsonRecord): ReadonlySet<string> {
  const rawAliases = deployment.alias;
  if (!Array.isArray(rawAliases)) {
    fail('Authenticated Vercel deployment alias set is malformed');
  }
  const deploymentUrl = healthUrl(stringField(deployment, 'url', 'Vercel deployment'));
  const aliases = new Set<string>([deploymentUrl.hostname]);
  for (const value of rawAliases) {
    if (typeof value !== 'string' || !value.trim()) {
      fail('Authenticated Vercel deployment alias is malformed');
    }
    const parsed = healthUrl(value.trim());
    aliases.add(parsed.hostname);
  }
  return aliases;
}

function jsonObjectOrNull(value: string): JsonRecord | null {
  try {
    const parsed: unknown = JSON.parse(value);
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function strictlyDecodedBase64OrNull(value: string): string | null {
  if (
    !/^[A-Za-z0-9+/]+={0,2}$/.test(value) ||
    value.length % 4 !== 0 ||
    /=/.test(value.slice(0, Math.max(0, value.length - 2)))
  ) {
    return null;
  }
  const decoded = Buffer.from(value, 'base64');
  if (
    decoded.length === 0 ||
    decoded.length > MAX_CREDENTIAL_PAYLOAD_BYTES ||
    decoded.toString('base64') !== value
  ) {
    return null;
  }
  const text = decoded.toString('utf8');
  if (!Buffer.from(text, 'utf8').equals(decoded)) return null;
  return text;
}

function parseBoundedServiceAccountCredentials(value: unknown): JsonRecord {
  if (
    typeof value !== 'string' ||
    Buffer.byteLength(value, 'utf8') === 0 ||
    Buffer.byteLength(value, 'utf8') > MAX_CREDENTIAL_PAYLOAD_BYTES
  ) {
    fail('Vercel production Google credential has an invalid bounded representation');
  }
  if (!value.trim()) {
    fail('Vercel production Google credential has an invalid bounded representation');
  }
  const candidates: JsonRecord[] = [];
  const raw = jsonObjectOrNull(value);
  if (raw !== null) candidates.push(raw);
  const decoded = value === value.trim() ? strictlyDecodedBase64OrNull(value) : null;
  if (decoded !== null) {
    const base64Object = jsonObjectOrNull(decoded);
    if (base64Object !== null) candidates.push(base64Object);
  }
  if (candidates.length !== 1) {
    fail('Vercel production Google credential is not one strict supported object form');
  }
  return candidates[0];
}

async function vercelProductionCredential(
  projectId: string,
  teamId: string,
  accessToken: string,
  deploymentCreatedEpoch: number,
): Promise<{ credentials: JsonRecord; runtimeIdentity: RuntimeIdentity }> {
  const listEndpoint = new URL(
    `https://api.vercel.com/v10/projects/${encodeURIComponent(projectId)}/env`,
  );
  listEndpoint.searchParams.set('teamId', teamId);
  listEndpoint.searchParams.set('target', 'production');
  const headers = {
    accept: 'application/json',
    authorization: `Bearer ${accessToken}`,
  };
  const list = await fetchJson(listEndpoint, 'Vercel production environment lookup', headers);
  if (!Array.isArray(list.envs)) {
    fail('Vercel production environment lookup did not return an environment list');
  }
  const matches = list.envs.filter((value) => {
    if (!isRecord(value)) return false;
    return (
      value.key === 'GOOGLE_SERVICE_ACCOUNT_CREDENTIALS' &&
      productionTargetOnly(value.target)
    );
  });
  if (matches.length !== 1) {
    fail('Vercel project must contain exactly one production-only Google credential');
  }
  const metadata = asRecord(matches[0], 'Vercel production Google credential metadata');
  const variableId = stringField(
    metadata,
    'id',
    'Vercel production Google credential metadata',
  );
  const updated = providerTime(
    metadata.updatedAt,
    'Vercel production Google credential updatedAt',
  );
  if (updated.epoch > deploymentCreatedEpoch) {
    fail('Vercel production Google credential was updated after deployment creation');
  }
  const detailEndpoint = new URL(
    `https://api.vercel.com/v1/projects/${encodeURIComponent(projectId)}/env/${encodeURIComponent(variableId)}`,
  );
  detailEndpoint.searchParams.set('teamId', teamId);
  detailEndpoint.searchParams.set('decrypt', 'true');
  const detail = await fetchJson(
    detailEndpoint,
    'Vercel production environment credential retrieval',
    headers,
  );
  if (
    detail.id !== variableId ||
    detail.key !== 'GOOGLE_SERVICE_ACCOUNT_CREDENTIALS' ||
    !productionTargetOnly(detail.target) ||
    providerTime(detail.updatedAt, 'Vercel production credential detail updatedAt').epoch !==
      updated.epoch
  ) {
    fail('Vercel production credential detail differs from its authenticated metadata');
  }
  const credentials = parseBoundedServiceAccountCredentials(detail.value);
  const clientEmail = stringField(credentials, 'client_email', 'Google service-account credentials');
  const credentialProjectId = stringField(
    credentials,
    'project_id',
    'Google service-account credentials',
  );
  stringField(credentials, 'private_key', 'Google service-account credentials');
  const runtimeIdentity: RuntimeIdentity = {
    accessMethod: 'vercel-production-environment-api-bounded-read',
    credentialSource: 'authenticated-vercel-project-production-environment',
    credentialKey: 'GOOGLE_SERVICE_ACCOUNT_CREDENTIALS',
    environmentVariableIdSha256: sha256Text(variableId),
    environmentVariableUpdatedAt: updated.iso,
    principalFingerprintSha256: sha256Value({
      clientEmail: clientEmail.toLowerCase(),
      projectId: credentialProjectId,
    }),
    runtimeOAuthScopes: [SHEETS_READ_SCOPE],
    evidenceOAuthScopes: [DRIVE_METADATA_SCOPE, SHEETS_READ_SCOPE],
  };
  return { credentials, runtimeIdentity };
}

async function vercelDeployment(
  deploymentId: string,
  expectedCommit: string,
  repositoryId: number,
  pins: OperationalIdentityPins,
): Promise<VercelEvidence> {
  assertDeploymentId(deploymentId, 'Vercel deployment');
  const projectId = env('VERCEL_PROJECT_ID');
  const teamId = env('VERCEL_TEAM_ID');
  const provider: ProviderIdentity = {
    name: 'vercel',
    apiVersion: 'v13',
    projectIdSha256: sha256Text(projectId),
    teamIdSha256: sha256Text(teamId),
  };
  if (
    provider.projectIdSha256 !== pins.providerProjectFingerprintSha256 ||
    provider.teamIdSha256 !== pins.providerTeamFingerprintSha256
  ) {
    fail('Selected Vercel project or team differs from the delivered authority pin');
  }
  const accessToken = env('VERCEL_ACCESS_TOKEN');
  const endpoint = new URL(
    `https://api.vercel.com/v13/deployments/${encodeURIComponent(deploymentId)}`,
  );
  endpoint.searchParams.set('teamId', teamId);
  const deployment = await fetchJson(endpoint, 'Vercel v13 deployment', {
    accept: 'application/json',
    authorization: `Bearer ${accessToken}`,
  });
  if (
    deployment.id !== deploymentId ||
    deployment.projectId !== projectId ||
    deployment.teamId !== teamId ||
    deployment.target !== 'production' ||
    deployment.readyState !== 'READY'
  ) {
    fail('Vercel deployment identity, target, or READY state is not exact');
  }
  const meta = asRecord(deployment.meta, 'Vercel Git metadata');
  if (meta.githubCommitSha !== expectedCommit) fail('Vercel Git SHA is not exact');
  const providerRepositoryId = positiveInteger(
    meta.githubCommitRepoId ?? meta.githubRepoId,
    'Vercel Git repository ID',
  );
  if (providerRepositoryId !== repositoryId) fail('Vercel Git repository ID is not exact');
  const ref = stringField(meta, 'githubCommitRef', 'Vercel Git metadata');
  const created = providerTime(deployment.createdAt, 'Vercel createdAt');
  const ready = providerTime(deployment.readyAt ?? deployment.ready, 'Vercel readyAt');
  if (created.epoch > ready.epoch) fail('Vercel deployment readiness chronology is invalid');
  const aliases = deploymentAliasHosts(deployment);
  const deploymentGeneratedHealthUrl = healthUrl(
    stringField(deployment, 'url', 'Vercel deployment'),
  );
  assertHealthHostAuthorized(deploymentGeneratedHealthUrl, aliases);
  const providerHealthUrl = selectPinnedCanonicalHealthUrl(aliases, pins);
  assertHealthHostAuthorized(providerHealthUrl, aliases);
  const credential = await vercelProductionCredential(
    projectId,
    teamId,
    accessToken,
    created.epoch,
  );
  assertPinnedOperationalIdentity(
    provider,
    credential.runtimeIdentity,
    providerHealthUrl,
    pins,
    'Authenticated Vercel deployment',
  );
  return {
    deployment,
    provider,
    runtimeIdentity: credential.runtimeIdentity,
    credentials: credential.credentials,
    createdAt: created.iso,
    readyAt: ready.iso,
    ref,
    providerHealthUrl,
    aliases,
  };
}

function sharingFingerprint(permissions: unknown[]): string {
  const normalized = permissions.map((permission) => {
    const item = asRecord(permission, 'Drive permission');
    const permissionDetails = Array.isArray(item.permissionDetails)
      ? item.permissionDetails.map((detail) => {
          const value = asRecord(detail, 'Drive permission detail');
          return {
            permissionType:
              typeof value.permissionType === 'string' ? value.permissionType : null,
            role: typeof value.role === 'string' ? value.role : null,
            inherited:
              typeof value.inherited === 'boolean' ? value.inherited : null,
            inheritedFrom:
              typeof value.inheritedFrom === 'string' ? value.inheritedFrom : null,
          };
        })
      : [];
    permissionDetails.sort((left, right) =>
      canonicalJson(left).localeCompare(canonicalJson(right)),
    );
    return {
      id: typeof item.id === 'string' ? item.id : null,
      type: typeof item.type === 'string' ? item.type : null,
      role: typeof item.role === 'string' ? item.role : null,
      emailAddress:
        typeof item.emailAddress === 'string' ? item.emailAddress.toLowerCase() : null,
      domain: typeof item.domain === 'string' ? item.domain.toLowerCase() : null,
      expirationTime:
        typeof item.expirationTime === 'string' ? item.expirationTime : null,
      view: typeof item.view === 'string' ? item.view : null,
      allowFileDiscovery:
        typeof item.allowFileDiscovery === 'boolean' ? item.allowFileDiscovery : null,
      deleted: typeof item.deleted === 'boolean' ? item.deleted : null,
      pendingOwner: typeof item.pendingOwner === 'boolean' ? item.pendingOwner : null,
      permissionDetails,
    };
  });
  normalized.sort((left, right) => canonicalJson(left).localeCompare(canonicalJson(right)));
  return sha256Value(normalized);
}

function requireExplicitDirectReaderPermissionDetails(
  permission: JsonRecord,
): JsonRecord[] {
  if (
    !Array.isArray(permission.permissionDetails) ||
    permission.permissionDetails.length !== 1
  ) {
    fail('Runtime principal permission lacks explicit API-derived directness details');
  }
  const detail = asRecord(
    permission.permissionDetails[0],
    'Runtime principal permission detail',
  );
  exactKeys(
    detail,
    ['permissionType', 'role', 'inherited'],
    'Runtime principal permission detail',
  );
  if (
    detail.permissionType !== 'user' ||
    detail.role !== 'reader' ||
    detail.inherited !== false ||
    'inheritedFrom' in detail
  ) {
    fail('Runtime principal permission details do not explicitly prove direct reader access');
  }
  return [detail];
}

function canonicalGridDataHash(sheet: JsonRecord, label: string): string {
  const data = sheet.data ?? [];
  if (!Array.isArray(data)) fail(`${label} GridData payload is not an array`);
  return sha256Value(data);
}

async function sourceObservation(
  credentials: JsonRecord,
  runtimeIdentity: RuntimeIdentity,
  challengeNonce: string | null,
): Promise<JsonRecord> {
  if (
    challengeNonce !== null &&
    !/^[A-Za-z0-9_-]{32,128}$/.test(challengeNonce)
  ) {
    fail('Independent source observation challenge nonce is invalid');
  }
  const startedAt = new Date().toISOString();
  const clientEmail = stringField(credentials, 'client_email', 'Google service-account credentials');
  const projectId = stringField(credentials, 'project_id', 'Google service-account credentials');
  const principalFingerprintSha256 = sha256Value({
    clientEmail: clientEmail.toLowerCase(),
    projectId,
  });
  if (principalFingerprintSha256 !== runtimeIdentity.principalFingerprintSha256) {
    fail('Authenticated Vercel credential identity changed before the Google observation');
  }
  const { google } = await import('googleapis');
  const driveAuth = new google.auth.GoogleAuth({
    credentials,
    scopes: [DRIVE_METADATA_SCOPE],
  });
  const sheetsAuth = new google.auth.GoogleAuth({
    credentials,
    scopes: [SHEETS_READ_SCOPE],
  });
  const drive = google.drive({ version: 'v3', auth: driveAuth });
  const sheets = google.sheets({ version: 'v4', auth: sheetsAuth });
  const metadata = async (): Promise<{
    revision: string;
    sharing: string;
    runtimePrincipalPermission: JsonRecord;
  }> => {
    const file = await drive.files.get({
      fileId: PRODUCTION_ID,
      fields: 'id,name,mimeType,modifiedTime,version,capabilities',
      supportsAllDrives: true,
    });
    if (
      file.data.id !== PRODUCTION_ID ||
      file.data.name !== 'Whitefish High School Senior Scholarships' ||
      file.data.mimeType !== 'application/vnd.google-apps.spreadsheet' ||
      String(file.data.version) !== EXPECTED_REVISION
    ) {
      fail('Production Drive file identity or native spreadsheet type changed');
    }
    const permissions: unknown[] = [];
    let permissionToken: string | undefined;
    do {
      const response = await drive.permissions.list({
        fileId: PRODUCTION_ID,
        fields:
          'nextPageToken,permissions(id,type,role,emailAddress,domain,expirationTime,view,allowFileDiscovery,deleted,pendingOwner,permissionDetails(permissionType,role,inherited,inheritedFrom))',
        pageSize: 100,
        pageToken: permissionToken,
        supportsAllDrives: true,
      });
      permissions.push(...(response.data.permissions ?? []));
      permissionToken = response.data.nextPageToken ?? undefined;
    } while (permissionToken);
    const revisions: Array<{ id?: string | null; modifiedTime?: string | null }> = [];
    let revisionToken: string | undefined;
    do {
      const response = await drive.revisions.list({
        fileId: PRODUCTION_ID,
        fields: 'nextPageToken,revisions(id,modifiedTime)',
        pageSize: 1000,
        pageToken: revisionToken,
      });
      revisions.push(...(response.data.revisions ?? []));
      revisionToken = response.data.nextPageToken ?? undefined;
    } while (revisionToken);
    const latest = revisions.at(-1)?.id ?? '';
    if (latest !== EXPECTED_REVISION) fail('Production Drive revision is not exact 9857');
    const principalPermissions = permissions.filter((permission) => {
      if (!isRecord(permission)) return false;
      return (
        typeof permission.emailAddress === 'string' &&
        permission.emailAddress.toLowerCase() === clientEmail.toLowerCase()
      );
    });
    if (principalPermissions.length !== 1) {
      fail('Runtime principal must have exactly one identifiable production permission');
    }
    const principalPermission = asRecord(
      principalPermissions[0],
      'Runtime principal production permission',
    );
    const permissionDetails = requireExplicitDirectReaderPermissionDetails(
      principalPermission,
    );
    if (
      principalPermission.type !== 'user' ||
      principalPermission.role !== 'reader' ||
      principalPermission.deleted === true ||
      principalPermission.pendingOwner === true ||
      typeof principalPermission.expirationTime === 'string' ||
      permissionDetails.some((detail) => detail.inherited !== false)
    ) {
      fail('Runtime principal production permission is not direct, unexpired reader-only access');
    }
    return {
      revision: latest,
      sharing: sharingFingerprint(permissions),
      runtimePrincipalPermission: {
        permissionIdSha256: sha256Text(
          stringField(
            principalPermission,
            'id',
            'Runtime principal production permission',
          ),
        ),
        type: 'user',
        role: 'reader',
        direct: true,
        expirationTime: null,
      },
    };
  };
  const before = await metadata();
  const source = await sheets.spreadsheets.get({
    spreadsheetId: PRODUCTION_ID,
    ranges: TABS.map((tab) => tab.boundedRange),
    includeGridData: true,
    fields: P9_APPLICATION_READ_BOUNDED_FIELDS,
  });
  if (source.data.spreadsheetId !== PRODUCTION_ID) {
    fail('Bounded production Sheets response is rebound to another spreadsheet');
  }
  const sourceSheets = source.data.sheets ?? [];
  if (sourceSheets.length !== TABS.length) fail('Bounded production tab response is incomplete');
  const observedTabs: JsonRecord[] = [];
  const challengeTabs: JsonRecord[] = [];
  for (const tab of TABS) {
    const sourceSheet = sourceSheets.find((sheet) => sheet.properties?.sheetId === tab.sheetId);
    if (!sourceSheet) fail(`Authorized production tab ${tab.sheetId} is missing`);
    const sourceRecord = sourceSheet as unknown as JsonRecord;
    const properties = asRecord(sourceRecord.properties, `Production tab ${tab.sheetId} properties`);
    const grid = asRecord(properties.gridProperties, `Production tab ${tab.sheetId} grid`);
    if (
      properties.title !== tab.title ||
      grid.rowCount !== tab.rowCount ||
      grid.columnCount !== tab.columnCount
    ) {
      fail(`Authorized production tab ${tab.sheetId} identity or grid bounds changed`);
    }
    const backup = await sheets.spreadsheets.get({
      spreadsheetId: tab.backupSpreadsheetId,
      ranges: [tab.boundedRange],
      includeGridData: true,
      fields: P9_APPLICATION_READ_BOUNDED_FIELDS,
    });
    if (backup.data.spreadsheetId !== tab.backupSpreadsheetId) {
      fail(`Verified backup response for tab ${tab.sheetId} is rebound`);
    }
    const backupSheet = backup.data.sheets?.[0];
    if (!backupSheet) fail(`Verified backup for tab ${tab.sheetId} is missing`);
    const backupRecord = backupSheet as unknown as JsonRecord;
    const backupProperties = asRecord(
      backupRecord.properties,
      `Backup tab ${tab.sheetId} properties`,
    );
    const backupGrid = asRecord(
      backupProperties.gridProperties,
      `Backup tab ${tab.sheetId} grid`,
    );
    if (
      backupProperties.title !== tab.title ||
      backupGrid.rowCount !== tab.rowCount ||
      backupGrid.columnCount !== tab.columnCount
    ) {
      fail(`Verified backup tab ${tab.sheetId} identity or grid bounds changed`);
    }
    const sourceCanonicalCellPayloadSha256 = canonicalGridDataHash(
      sourceRecord,
      `Production tab ${tab.sheetId}`,
    );
    const backupCanonicalCellPayloadSha256 = canonicalGridDataHash(
      backupRecord,
      `Backup tab ${tab.sheetId}`,
    );
    if (sourceCanonicalCellPayloadSha256 !== backupCanonicalCellPayloadSha256) {
      fail(`Production tab ${tab.sheetId} differs from its verified native backup`);
    }
    if (challengeNonce !== null) {
      const tabIdentity = {
        sheetId: tab.sheetId,
        title: tab.title,
        rowCount: tab.rowCount,
        columnCount: tab.columnCount,
        boundedRange: tab.boundedRange,
      };
      challengeTabs.push({
        ...tabIdentity,
        nonceBoundCanonicalGridDataSha256: p9ApplicationReadChallengeSha256(
          challengeNonce,
          tabIdentity as P9ApplicationReadTabIdentity,
          sourceRecord.data ?? [],
        ),
      });
    }
    observedTabs.push({
      sheetId: tab.sheetId,
      title: tab.title,
      rowCount: tab.rowCount,
      columnCount: tab.columnCount,
      boundedRange: tab.boundedRange,
      backupSpreadsheetId: tab.backupSpreadsheetId,
      historicalSourceAndBackupSha256: tab.nativeCellPayloadSha256,
      canonicalCellPayloadHashAlgorithm:
        'google-sheets-v4-griddata-canonical-json-v1',
      sourceCanonicalCellPayloadSha256,
      backupCanonicalCellPayloadSha256,
    });
  }
  const after = await metadata();
  if (
    before.revision !== after.revision ||
    before.sharing !== after.sharing ||
    canonicalJson(before.runtimePrincipalPermission) !==
      canonicalJson(after.runtimePrincipalPermission)
  ) {
    fail('Production revision or sharing changed during the bounded read-only observation');
  }
  const base = {
    startedAt,
    completedAt: new Date().toISOString(),
    spreadsheetId: PRODUCTION_ID,
    revisionBefore: EXPECTED_REVISION,
    revisionAfter: EXPECTED_REVISION,
    sharingBeforeSha256: before.sharing,
    sharingAfterSha256: after.sharing,
    runtimePrincipalPermission: before.runtimePrincipalPermission,
    backupReadPrincipalFingerprintSha256: principalFingerprintSha256,
    operations: [
      {
        service: 'drive',
        method: 'files.get+permissions.list+revisions.list',
        fields:
          'file(id,name,mimeType,modifiedTime,version,capabilities,permissions);latestRevision(id,modifiedTime)',
      },
      {
        service: 'sheets',
        method: 'spreadsheets.get',
        spreadsheetId: PRODUCTION_ID,
        ranges: TABS.map((tab) => tab.boundedRange),
        includeGridData: true,
      },
      {
        service: 'sheets',
        method: 'spreadsheets.get',
        spreadsheetIds: TABS.map((tab) => tab.backupSpreadsheetId),
        ranges: TABS.map((tab) => tab.boundedRange),
        includeGridData: true,
      },
    ],
    tabs: observedTabs,
    applicationReadChallenge:
      challengeNonce === null
        ? null
        : {
            domain: P9_APPLICATION_READ_CHALLENGE_DOMAIN,
            nonce: challengeNonce,
            hashAlgorithm: P9_APPLICATION_READ_CHALLENGE_HASH_ALGORITHM,
            tabs: challengeTabs,
          },
  };
  return {
    observationId: sha256Value(base),
    ...base,
  };
}

async function writeEntry(): Promise<void> {
  const startedAt = new Date().toISOString();
  const context = verifyWorkflow('entry', false);
  const deploymentId = env('P9_DEPLOYMENT_ID');
  const provider = await vercelDeployment(
    deploymentId,
    context.baseline,
    context.repositoryId,
    context.identityPins,
  );
  if (provider.ref !== 'main') fail('Baseline Production deployment is not from main');
  const source = await sourceObservation(
    provider.credentials,
    provider.runtimeIdentity,
    null,
  );
  const baselineBase = {
    deploymentId,
    urlHost: provider.providerHealthUrl.hostname,
    target: 'production',
    readyState: 'READY',
    createdAt: provider.createdAt,
    readyAt: provider.readyAt,
    projectIdSha256: provider.provider.projectIdSha256,
    teamIdSha256: provider.provider.teamIdSha256,
    gitSource: {
      type: 'github',
      repositoryId: context.repositoryId,
      ref: 'main',
      sha: context.baseline,
    },
  };
  const receipt = {
    schemaVersion: 2,
    stageId: 'P9',
    receiptType: 'entry',
    p9BaselineCommit: context.baseline,
    revision7AttestationCommit: context.revision7Attestation,
    capture: capture(context, 'entry', startedAt),
    baselineProductionDeployment: {
      observationId: sha256Value(baselineBase),
      ...baselineBase,
    },
    productionSpreadsheetId: PRODUCTION_ID,
    runtimeIdentity: provider.runtimeIdentity,
    sourceObservation: source,
  };
  const schemas = await import('./p9-evidence-v2');
  const parsed = schemas.P9EntryReceiptSchema.safeParse(receipt);
  if (!parsed.success) fail(`Strict P9 entry schema rejected trusted receipt: ${parsed.error.message}`);
  writeJson(path.join(context.root, 'docs/evidence/P9-entry.json'), receipt);
  console.log('P9 strict entry receipt written from bounded read-only observations.');
}

async function writePhase(phase: DeploymentPhase): Promise<void> {
  const startedAt = new Date().toISOString();
  const context = verifyWorkflow(phaseJob(phase), true);
  const runtimeBinding = independentlyDeriveRuntimeBinding(
    env('P9_RUNTIME_REPOSITORY_ROOT'),
    context.runtimeCommit!,
    `${phase} runtime`,
  );
  const expectedPredecessor: Phase =
    phase === 'cutover' ? 'entry' : phase === 'rollback' ? 'cutover' : 'rollback';
  const predecessors = loadVerifiedPredecessors([expectedPredecessor]);
  const descriptor = parsePredecessors()[0];
  const predecessor = predecessors.get(expectedPredecessor)!;
  const deploymentId = env('P9_DEPLOYMENT_ID');
  const provider = await vercelDeployment(
    deploymentId,
    context.runtimeCommit!,
    context.repositoryId,
    context.identityPins,
  );
  const expectedProvider =
    expectedPredecessor === 'entry'
      ? {
          name: 'vercel',
          apiVersion: 'v13',
          projectIdSha256: asRecord(
            predecessor.baselineProductionDeployment,
            'Entry baseline deployment',
          ).projectIdSha256,
          teamIdSha256: asRecord(
            predecessor.baselineProductionDeployment,
            'Entry baseline deployment',
          ).teamIdSha256,
        }
      : asRecord(predecessor.provider, `${expectedPredecessor} predecessor provider`);
  assertProviderIdentity(provider.provider, expectedProvider, phase);
  const predecessorRuntimeIdentity = validateRuntimeIdentity(
    predecessor.runtimeIdentity,
    `${expectedPredecessor} predecessor`,
  );
  if (canonicalJson(provider.runtimeIdentity) !== canonicalJson(predecessorRuntimeIdentity)) {
    fail(`${phase} authenticated runtime credential differs from its attested predecessor`);
  }
  const checkedHealthUrl =
    phase === 'restored-cutover'
      ? healthUrl(env('P9_FINAL_HEALTH_URL'))
      : provider.providerHealthUrl;
  if (
    p9CanonicalProductionHostnameFingerprint(checkedHealthUrl.hostname) !==
      context.identityPins.providerCanonicalProductionHostnameSha256 ||
    checkedHealthUrl.hostname !== provider.providerHealthUrl.hostname
  ) {
    fail(`${phase} health URL is not the pinned canonical Production hostname`);
  }
  const health = await observeHealth(
    checkedHealthUrl,
    provider.aliases,
    phase,
    deploymentId,
    context.runtimeCommit!,
    runtimeBinding,
  );
  const source = await sourceObservation(
    provider.credentials,
    provider.runtimeIdentity,
    phase === 'rollback'
      ? null
      : stringField(health, 'nonce', `${phase} health`),
  );
  const applicationReadProbe = validateApplicationReadProbe(
    health.applicationReadProbe,
    phase,
    stringField(health, 'nonce', `${phase} health`),
    runtimeBinding,
  );
  bindApplicationReadProbeToSource(applicationReadProbe, source, phase);
  if (
    provider.runtimeIdentity.principalFingerprintSha256 !==
    asRecord(health.runtimeConfig, `${phase} runtime config`).runtimeIdentityFingerprintSha256
  ) {
    fail(`${phase} runtime and trusted Google identities have different fingerprints`);
  }
  const phaseCapture = capture(context, phaseJob(phase), startedAt);
  const observationBase = {
    role: phase,
    deploymentId,
    urlHost: checkedHealthUrl.hostname,
    target: 'production',
    readyState: 'READY',
    createdAt: provider.createdAt,
    readyAt: provider.readyAt,
    capture: phaseCapture,
    gitSource: {
      type: 'github',
      repositoryId: context.repositoryId,
      ref: provider.ref,
      sha: context.runtimeCommit,
    },
    health,
  };
  const body = {
    schemaVersion: 2,
    kind: 'p9-trusted-phase-v2',
    stageId: 'P9',
    phase,
    p9BaselineCommit: context.baseline,
    revision7AttestationCommit: context.revision7Attestation,
    runtimeCommit: context.runtimeCommit,
    productionSpreadsheetId: PRODUCTION_ID,
    capture: phaseCapture,
    predecessor: descriptor,
    provider: provider.provider,
    runtimeIdentity: provider.runtimeIdentity,
    runtimeBinding,
    deploymentObservation: {
      observationId: sha256Value(observationBase),
      ...observationBase,
    },
    sourceObservation: source,
  };
  const receipt = { observationId: sha256Value(body), ...body };
  validatePhaseReceipt(
    receipt,
    phase,
    context.baseline,
    context.revision7Attestation,
    context.runtimeCommit!,
    predecessor,
    descriptor,
    context.identityPins,
  );
  writeJson(path.resolve(env('P9_PHASE_RECEIPT_PATH')), receipt);
  console.log(`P9 ${phase} phase receipt written from authenticated read-only observations.`);
}

async function runWriteIsolation(runtimeRoot: string, runtimeCommit: string): Promise<JsonRecord> {
  const git = spawnSync('git', ['rev-parse', 'HEAD'], {
    cwd: runtimeRoot,
    encoding: 'utf8',
    env: { ...process.env, PATH: process.env.PATH ?? '' },
  });
  if (git.status !== 0 || git.stdout.trim() !== runtimeCommit) {
    fail('Write-isolation checkout is not the exact runtime commit');
  }
  const runtimeBinding = independentlyDeriveRuntimeBinding(
    runtimeRoot,
    runtimeCommit,
    'Write-isolation runtime',
  );
  const startedAt = new Date().toISOString();
  const schemas = await import('./p9-evidence-v2');
  const inventory = schemas.deriveP9WriteSurfaceInventory(runtimeRoot);
  const runtimeStaticCatalogSha256 = sha256Text(
    fs.readFileSync(path.join(runtimeRoot, STATIC_CATALOG_PATH)),
  );
  if (runtimeStaticCatalogSha256 !== ACCEPTED_P7_CATALOG_SHA256) {
    fail(
      `Runtime catalog bytes differ from accepted P7 candidate ${ACCEPTED_P7_CANDIDATE_COMMIT}`,
    );
  }
  if (
    inventory.length === 0 ||
    inventory.some(
      (surface) =>
        surface.independentlyDerived !== true ||
        surface.probeExport !== schemas.P9_WRITE_ISOLATION_PROBE_EXPORT ||
        surface.mutators.length === 0 ||
        surface.googleSheetsMutatorCalls < 1 ||
        surface.googleSheetsClientConstructions < 1 ||
        surface.guardedBeforeClientConstruction !== true ||
        surface.googleSheetsClientConstructions !==
          surface.guardedGoogleSheetsClientConstructions,
    )
  ) {
    fail('Independently derived runtime write-surface inventory is incomplete or unguarded');
  }
  const guardPath = path.join(runtimeRoot, schemas.P9_WRITE_GUARD_MODULE_PATH);
  if (!fs.existsSync(guardPath)) {
    fail('Runtime write guard module is absent from the exact runtime commit');
  }
  const guardModule = (await import(
    `${pathToFileURL(guardPath).href}?runtime=${runtimeCommit}`
  )) as Record<string, unknown>;
  const guard = guardModule[schemas.P9_WRITE_GUARD_NAME];
  if (typeof guard !== 'function') {
    fail('Runtime write guard does not export the exact trusted guard function');
  }
  if (
    guardModule.P9_PRODUCTION_WRITE_BLOCKED_CODE !==
    schemas.P9_PRODUCTION_WRITE_BLOCKED_CODE
  ) {
    fail('Runtime write guard does not export the exact production-write block code');
  }
  let guardError: unknown;
  let directGuardClientConstructions = 0;
  try {
    await Promise.resolve(
      guard(PRODUCTION_ID, () => {
        directGuardClientConstructions += 1;
      }),
    );
  } catch (error) {
    guardError = error;
  }
  if (
    directGuardClientConstructions !== 0 ||
    !guardError ||
    typeof guardError !== 'object' ||
    (guardError as { code?: unknown }).code !== schemas.P9_PRODUCTION_WRITE_BLOCKED_CODE
  ) {
    fail('Runtime write guard does not block production before callback execution');
  }

  const runtimeRequire = createRequire(path.join(runtimeRoot, 'web', 'package.json'));
  const runtimeGoogleapis = runtimeRequire('googleapis') as {
    google?: { sheets?: (...arguments_: unknown[]) => unknown };
  };
  if (!runtimeGoogleapis.google || typeof runtimeGoogleapis.google.sheets !== 'function') {
    fail('Cannot instrument the runtime googleapis Sheets client factory');
  }
  const originalSheetsFactory = runtimeGoogleapis.google.sheets;
  const expectedTestResults: JsonRecord[] = [];
  try {
    for (const surface of inventory) {
      let clientConstructions = 0;
      let writeCalls = 0;
      const writeCall = async (): Promise<never> => {
        writeCalls += 1;
        const error = new Error('P9 isolated proof observed a write call');
        (error as Error & { code: string }).code = 'P9_WRITE_CALL_OBSERVED';
        throw error;
      };
      const readCall = async () => ({ data: { sheets: [], values: [] } });
      runtimeGoogleapis.google.sheets = () => {
        clientConstructions += 1;
        return {
          spreadsheets: {
            batchUpdate: writeCall,
            get: readCall,
            sheets: { copyTo: writeCall },
            values: {
              append: writeCall,
              batchClear: writeCall,
              batchUpdate: writeCall,
              clear: writeCall,
              get: readCall,
              update: writeCall,
            },
          },
        };
      };
      const modulePath = path.join(runtimeRoot, surface.path);
      let surfaceModule: Record<string, unknown>;
      try {
        surfaceModule = (await import(
          `${pathToFileURL(modulePath).href}?runtime=${runtimeCommit}&surface=${encodeURIComponent(surface.id)}`
        )) as Record<string, unknown>;
      } catch (error) {
        fail(`Cannot safely import runtime write surface ${surface.id}: ${(error as Error).message}`);
      }
      const probe = surfaceModule[schemas.P9_WRITE_ISOLATION_PROBE_EXPORT];
      if (typeof probe !== 'function') {
        fail(`Runtime write surface ${surface.id} lacks the exact executable probe export`);
      }
      let rejectedError: unknown;
      try {
        await Promise.resolve(probe(PRODUCTION_ID));
      } catch (error) {
        rejectedError = error;
      }
      const guardErrorCode =
        rejectedError && typeof rejectedError === 'object'
          ? (rejectedError as { code?: unknown }).code
          : null;
      if (
        guardErrorCode !== schemas.P9_PRODUCTION_WRITE_BLOCKED_CODE ||
        clientConstructions !== 0 ||
        writeCalls !== 0
      ) {
        fail(`Runtime surface probe did not block ${surface.id} before every client/write call`);
      }
      expectedTestResults.push({
        id: surface.id,
        path: surface.path,
        mutators: surface.mutators,
        independentlyDerived: true,
        probeExport: schemas.P9_WRITE_ISOLATION_PROBE_EXPORT,
        probeInvoked: true,
        guardedBeforeClientConstruction: true,
        negativeTestName: `p9-write-isolation:${surface.id}`,
        attemptedSpreadsheetId: PRODUCTION_ID,
        outcome: 'blocked-before-client-construction',
        guardErrorCode: schemas.P9_PRODUCTION_WRITE_BLOCKED_CODE,
        clientConstructions: 0,
        writeCalls: 0,
      });
    }
  } finally {
    runtimeGoogleapis.google.sheets = originalSheetsFactory;
  }
  const completedAt = new Date().toISOString();
  const expectedInventorySha256 = sha256Value({
    inventoryMethod: 'typescript-ast-complete-google-mutator-inventory',
    surfaces: inventory,
  });
  const testCommand = WRITE_ISOLATION_COMMAND;
  return {
    derivedInventory: inventory,
    testedCommit: runtimeCommit,
    runtimeBinding,
    runtimeStaticCatalogSha256,
    ciRunId: positiveInteger(env('GITHUB_RUN_ID'), 'GitHub run ID'),
    inventoryMethod: 'typescript-ast-complete-google-mutator-inventory',
    inventorySha256: expectedInventorySha256,
    discoveredSurfaceCount: inventory.length,
    testStartedAt: startedAt,
    testCompletedAt: completedAt,
    testCommand,
    testExitCode: 0,
    testOutputSha256: sha256Value({
      testCommand,
      testedCommit: runtimeCommit,
      runtimeBinding,
      surfaces: expectedTestResults,
    }),
    surfaces: expectedTestResults,
  };
}

async function writeIsolationReceipt(): Promise<void> {
  const context = verifyWorkflow('write-isolation', true);
  const proof = await runWriteIsolation(
    path.resolve(env('P9_RUNTIME_REPOSITORY_ROOT')),
    context.runtimeCommit!,
  );
  writeJson(path.resolve(env('P9_WRITE_ISOLATION_RECEIPT_PATH')), proof);
  console.log('P9 isolated runtime write-surface proof written without deployment credentials.');
}

function validateWriteIsolationReceipt(
  value: JsonRecord,
  runtimeCommit: string,
  runId: number,
): { receipt: JsonRecord; inventory: JsonRecord[] } {
  exactKeys(
    value,
    [
      'derivedInventory',
      'testedCommit',
      'runtimeBinding',
      'runtimeStaticCatalogSha256',
      'ciRunId',
      'inventoryMethod',
      'inventorySha256',
      'discoveredSurfaceCount',
      'testStartedAt',
      'testCompletedAt',
      'testCommand',
      'testExitCode',
      'testOutputSha256',
      'surfaces',
    ],
    'P9 write-isolation receipt',
  );
  if (!Array.isArray(value.derivedInventory) || value.derivedInventory.length === 0) {
    fail('P9 write-isolation receipt lacks its independently derived inventory');
  }
  const inventory = value.derivedInventory.map((item, index) => {
    const surface = asRecord(item, `P9 derived write surface ${index + 1}`);
    exactKeys(
      surface,
      [
        'id',
        'path',
        'mutators',
        'independentlyDerived',
        'probeExport',
        'googleSheetsClientConstructions',
        'guardedGoogleSheetsClientConstructions',
        'googleSheetsMutatorCalls',
        'guardedBeforeClientConstruction',
      ],
      `P9 derived write surface ${index + 1}`,
    );
    if (
      surface.independentlyDerived !== true ||
      surface.probeExport !== 'p9WriteIsolationProbe' ||
      surface.guardedBeforeClientConstruction !== true ||
      !Array.isArray(surface.mutators) ||
      surface.mutators.length === 0 ||
      !surface.mutators.every((mutator) => typeof mutator === 'string' && mutator.length > 0) ||
      positiveInteger(
        surface.googleSheetsClientConstructions,
        `P9 derived write surface ${index + 1} client constructions`,
      ) !==
        positiveInteger(
          surface.guardedGoogleSheetsClientConstructions,
          `P9 derived write surface ${index + 1} guarded client constructions`,
        ) ||
      positiveInteger(
        surface.googleSheetsMutatorCalls,
        `P9 derived write surface ${index + 1} mutator calls`,
      ) < 1
    ) {
      fail(`P9 derived write surface ${index + 1} is incomplete or unguarded`);
    }
    stringField(surface, 'id', `P9 derived write surface ${index + 1}`);
    stringField(surface, 'path', `P9 derived write surface ${index + 1}`);
    return surface;
  });
  const sortedInventory = [...inventory].sort(
    (left, right) =>
      String(left.path).localeCompare(String(right.path)) ||
      String(left.id).localeCompare(String(right.id)),
  );
  if (canonicalJson(inventory) !== canonicalJson(sortedInventory)) {
    fail('P9 independently derived write-surface inventory is not canonically ordered');
  }
  const expectedInventorySha256 = sha256Value({
    inventoryMethod: 'typescript-ast-complete-google-mutator-inventory',
    surfaces: inventory,
  });
  const expectedTestResults = inventory.map((surface) => ({
    id: surface.id,
    path: surface.path,
    mutators: surface.mutators,
    independentlyDerived: true,
    probeExport: 'p9WriteIsolationProbe',
    probeInvoked: true,
    guardedBeforeClientConstruction: true,
    negativeTestName: `p9-write-isolation:${surface.id}`,
    attemptedSpreadsheetId: PRODUCTION_ID,
    outcome: 'blocked-before-client-construction',
    guardErrorCode: 'P9_PRODUCTION_WRITE_BLOCKED',
    clientConstructions: 0,
    writeCalls: 0,
  }));
  const expectedTestOutputSha256 = sha256Value({
    testCommand: WRITE_ISOLATION_COMMAND,
    testedCommit: runtimeCommit,
    runtimeBinding: value.runtimeBinding,
    surfaces: expectedTestResults,
  });
  const runtimeBinding = validateApplicationReadRuntimeBinding(
    value.runtimeBinding,
    runtimeCommit,
    'P9 write-isolation receipt',
  );
  if (
    value.testedCommit !== runtimeCommit ||
    value.runtimeStaticCatalogSha256 !== ACCEPTED_P7_CATALOG_SHA256 ||
    value.ciRunId !== runId ||
    value.inventoryMethod !== 'typescript-ast-complete-google-mutator-inventory' ||
    value.inventorySha256 !== expectedInventorySha256 ||
    value.discoveredSurfaceCount !== inventory.length ||
    value.testCommand !== WRITE_ISOLATION_COMMAND ||
    value.testExitCode !== 0 ||
    value.testOutputSha256 !== expectedTestOutputSha256 ||
    !Array.isArray(value.surfaces)
  ) {
    fail('P9 write-isolation receipt is incomplete or rebound');
  }
  assertSha256(String(value.testOutputSha256), 'P9 write-isolation output digest');
  ordered(value.testStartedAt, value.testCompletedAt, 'P9 write-isolation test');
  if (canonicalJson(value.surfaces) !== canonicalJson(expectedTestResults)) {
    fail('P9 write-isolation negative results are not exact');
  }
  const { derivedInventory: _internalInventory, ...receipt } = value;
  receipt.runtimeBinding = runtimeBinding;
  return { receipt, inventory };
}

async function finalize(): Promise<void> {
  const context = verifyWorkflow('finalize', true);
  const chain = loadVerifiedPredecessors([
    'entry',
    'cutover',
    'rollback',
    'restored-cutover',
  ]);
  const entry = chain.get('entry');
  if (!entry) fail('Finalizer is missing the attested entry receipt');
  const phases = ['cutover', 'rollback', 'restored-cutover'] as const;
  const phaseReceipts = phases.map((phase) => {
    const receipt = chain.get(phase);
    if (!receipt) fail(`Finalizer is missing the attested ${phase} receipt`);
    return receipt;
  });
  const descriptors = parsePredecessors();
  for (let index = 0; index < phaseReceipts.length; index += 1) {
    const receipt = phaseReceipts[index];
    const predecessorPhase: Phase = index === 0 ? 'entry' : phases[index - 1];
    const descriptor = descriptors.find((item) => item.phase === predecessorPhase);
    const predecessor = chain.get(predecessorPhase);
    if (!descriptor || !predecessor) fail(`${phases[index]} predecessor chain is incomplete`);
    validatePhaseReceipt(
      receipt,
      phases[index],
      context.baseline,
      context.revision7Attestation,
      context.runtimeCommit!,
      predecessor,
      descriptor,
      context.identityPins,
    );
  }
  const deploymentObservations = phaseReceipts.map((receipt) =>
    asRecord(receipt.deploymentObservation, 'Deployment observation'),
  );
  const phaseRuntimeBindings = phaseReceipts.map((receipt, index) =>
    validateApplicationReadRuntimeBinding(
      receipt.runtimeBinding,
      context.runtimeCommit!,
      `${phases[index]} finalized phase`,
    ),
  );
  requireByteIdenticalRuntimeBindings(
    phaseRuntimeBindings,
    'Cross-phase',
  );
  const provider = asRecord(phaseReceipts[0].provider, 'Cutover provider');
  const entryDeployment = asRecord(
    entry.baselineProductionDeployment,
    'Entry baseline deployment',
  );
  assertProviderIdentity(provider as ProviderIdentity, {
    name: 'vercel',
    apiVersion: 'v13',
    projectIdSha256: entryDeployment.projectIdSha256,
    teamIdSha256: entryDeployment.teamIdSha256,
  }, 'finalize');
  for (const receipt of phaseReceipts.slice(1)) {
    if (canonicalJson(receipt.provider) !== canonicalJson(provider)) {
      fail('Provider identity changed across P9 phases');
    }
    if (canonicalJson(receipt.runtimeIdentity) !== canonicalJson(phaseReceipts[0].runtimeIdentity)) {
      fail('Runtime credential identity changed across P9 phases');
    }
  }
  const entrySource = validateSourceObservationShape(entry.sourceObservation);
  const entryTabs = entrySource.tabs as JsonRecord[];
  for (const receipt of phaseReceipts) {
    const phaseSource = validateSourceObservationShape(receipt.sourceObservation);
    const phaseTabs = phaseSource.tabs as JsonRecord[];
    if (
      phaseSource.sharingBeforeSha256 !== entrySource.sharingBeforeSha256 ||
      phaseSource.backupReadPrincipalFingerprintSha256 !==
        entrySource.backupReadPrincipalFingerprintSha256 ||
      canonicalJson(phaseSource.runtimePrincipalPermission) !==
        canonicalJson(entrySource.runtimePrincipalPermission) ||
      phaseTabs.some(
        (tab, index) =>
          tab.sourceCanonicalCellPayloadSha256 !==
          entryTabs[index]?.sourceCanonicalCellPayloadSha256,
      )
    ) {
      fail('P9 source sharing or canonical GridData digest changed across phases');
    }
  }
  const configs = deploymentObservations.map((observation, index) =>
    asRecord(
      asRecord(observation.health, `${phases[index]} health`).runtimeConfig,
      `${phases[index]} runtime config`,
    ),
  );
  if (canonicalJson(configs[0]) !== canonicalJson(configs[2])) {
    fail('Restored-cutover runtime configuration does not exactly restore cutover');
  }
  for (const key of [
    'writePolicy',
    'mappingVersion',
    'runtimeIdentityFingerprintSha256',
  ]) {
    if (
      configs.some((config) => canonicalJson(config[key]) !== canonicalJson(configs[0][key]))
    ) {
      fail(`P9 runtime configuration changed invariant ${key} across phases`);
    }
  }
  const writeIsolationArtifact = readJson(
    path.resolve(env('P9_WRITE_ISOLATION_RECEIPT_PATH')),
    'P9 write-isolation receipt',
  );
  const validatedIsolation = validateWriteIsolationReceipt(
    writeIsolationArtifact,
    context.runtimeCommit!,
    context.runId,
  );
  requireByteIdenticalRuntimeBindings(
    [
      ...phaseRuntimeBindings,
      asRecord(
        validatedIsolation.receipt.runtimeBinding,
        'P9 write-isolation runtime binding',
      ),
    ],
    'Deployment and same-run write-isolation',
  );
  const expectedSurfaceIds = validatedIsolation.inventory
    .map((surface) => stringField(surface, 'id', 'P9 derived write surface'))
    .sort();
  for (let index = 0; index < configs.length; index += 1) {
    const policy = asRecord(configs[index].writePolicy, `${phases[index]} write policy`);
    const actualSurfaceIds = Array.isArray(policy.surfaces)
      ? policy.surfaces.map(String).sort()
      : [];
    if (canonicalJson(actualSurfaceIds) !== canonicalJson(expectedSurfaceIds)) {
      fail(`${phases[index]} runtime config is not bound to the derived write inventory`);
    }
  }
  // The same-run isolation job must have completed before the finalize producer starts.
  const finalizeStartedAt = new Date().toISOString();
  ordered(
    validatedIsolation.receipt.testCompletedAt,
    finalizeStartedAt,
    'P9 write-isolation completion before finalize',
  );
  if (
    Date.parse(String(validatedIsolation.receipt.testCompletedAt)) >=
    Date.parse(finalizeStartedAt)
  ) {
    fail('P9 write-isolation must finish strictly before finalize starts');
  }
  const finalizeCapture = capture(context, 'finalize', finalizeStartedAt);
  const deploymentRecord: JsonRecord = {
    schemaVersion: 2,
    stageId: 'P9',
    receiptType: 'deployment',
    p9BaselineCommit: context.baseline,
    runtimeCommit: context.runtimeCommit,
    revision7AttestationCommit: context.revision7Attestation,
    capture: finalizeCapture,
    provider,
    deployments: {
      cutover: deploymentObservations[0],
      rollback: deploymentObservations[1],
      restoredCutover: deploymentObservations[2],
    },
  };
  const postReceipt: JsonRecord = {
    schemaVersion: 2,
    stageId: 'P9',
    receiptType: 'post-cutover',
    p9BaselineCommit: context.baseline,
    runtimeCommit: context.runtimeCommit,
    revision7AttestationCommit: context.revision7Attestation,
    capture: finalizeCapture,
    deploymentObservationIds: {
      cutover: deploymentObservations[0].observationId,
      rollback: deploymentObservations[1].observationId,
      restoredCutover: deploymentObservations[2].observationId,
    },
    sourceObservations: phaseReceipts.map((receipt, index) => ({
      phase: [
        'after-cutover-smoke',
        'after-rollback-proof',
        'after-restored-cutover',
      ][index],
      deploymentId: deploymentObservations[index].deploymentId,
      observation: receipt.sourceObservation,
    })),
    writeIsolation: validatedIsolation.receipt,
  };
  const schemas = await import('./p9-evidence-v2');
  const gitTimestamp = (commit: string): string | null => {
    const result = spawnSync('git', ['show', '-s', '--format=%cI', commit], {
      cwd: context.root,
      encoding: 'utf8',
      env: { ...process.env, PATH: process.env.PATH ?? '' },
    });
    if (result.status !== 0 || !result.stdout.trim()) return null;
    return new Date(Date.parse(result.stdout.trim())).toISOString();
  };
  const baselineCommittedAt = gitTimestamp(context.baseline);
  if (!baselineCommittedAt) fail('Finalizer cannot derive the baseline Git timestamp');
  // A shallow baseline checkout may omit the Revision 7 object. The later baseline
  // timestamp is a conservative chronology bound because Git ancestry is verified
  // separately by the canonical validator.
  const revision7CommittedAt =
    gitTimestamp(context.revision7Attestation) ?? baselineCommittedAt;
  const revision7Parents = spawnSync(
    'git',
    ['show', '-s', '--format=%P', context.revision7Attestation],
    {
      cwd: context.root,
      encoding: 'utf8',
      env: { ...process.env, PATH: process.env.PATH ?? '' },
    },
  );
  const parentCommits = revision7Parents.stdout.trim().split(/\s+/).filter(Boolean);
  if (revision7Parents.status !== 0 || parentCommits.length !== 1) {
    fail('Revision 7 attestation must be an available single-parent direct-child commit');
  }
  assertSha40(parentCommits[0], 'Revision 7 candidate direct parent');
  const staticCatalog = fs.readFileSync(path.join(context.root, STATIC_CATALOG_PATH));
  if (sha256Text(staticCatalog) !== ACCEPTED_P7_CATALOG_SHA256) {
    fail(
      `Baseline catalog bytes differ from accepted P7 candidate ${ACCEPTED_P7_CANDIDATE_COMMIT}`,
    );
  }
  const semanticErrors = schemas.validateP9ReceiptSetSemanticsV2(
    { entry, deployment: deploymentRecord, postCutover: postReceipt },
    {
      p9BaselineCommit: context.baseline,
      p9BaselineCommittedAt: baselineCommittedAt,
      revision7AttestationCommit: context.revision7Attestation,
      revision7AttestationCommittedAt: revision7CommittedAt,
      revision7CandidateCommit: parentCommits[0],
      runtimePrincipalFingerprintSha256:
        context.identityPins.runtimePrincipalFingerprintSha256,
      providerProjectFingerprintSha256:
        context.identityPins.providerProjectFingerprintSha256,
      providerTeamFingerprintSha256:
        context.identityPins.providerTeamFingerprintSha256,
      providerCanonicalProductionHostnameSha256:
        context.identityPins.providerCanonicalProductionHostnameSha256,
      hostedVerificationEnvironmentFingerprintSha256:
        context.identityPins.hostedVerificationEnvironmentFingerprintSha256,
      runtimeCredentialProvenanceFingerprintSha256:
        context.identityPins.runtimeCredentialProvenanceFingerprintSha256,
      expectedStaticCatalogSha256: ACCEPTED_P7_CATALOG_SHA256,
      expectedWriteSurfaceInventory:
        validatedIsolation.inventory as ReturnType<
          typeof schemas.deriveP9WriteSurfaceInventory
        >,
    },
  );
  if (semanticErrors.length > 0) {
    fail(`Final P9 semantic validation rejected the receipt set: ${semanticErrors.join('; ')}`);
  }
  const evidence = path.join(context.root, 'docs/evidence');
  fs.mkdirSync(evidence, { recursive: true });
  const entryFile = path.join(path.resolve(env('P9_PREDECESSOR_DIR')), 'entry.json');
  fs.copyFileSync(entryFile, path.join(evidence, 'P9-entry.json'));
  writeJson(path.join(evidence, 'P9-deployment.json'), deploymentRecord);
  writeJson(path.join(evidence, 'P9-post-cutover.json'), postReceipt);
  console.log('P9 exact entry, deployment, and post-cutover receipts finalized.');
}


async function selfTest(): Promise<void> {
  const expectFailure = (operation: () => void, label: string): void => {
    let rejected = false;
    try {
      operation();
    } catch {
      rejected = true;
    }
    if (!rejected) fail(`Self-test negative was not rejected: ${label}`);
  };
  const expectFailureAsync = async (
    operation: () => Promise<unknown>,
    label: string,
  ): Promise<void> => {
    let rejected = false;
    try {
      await operation();
    } catch {
      rejected = true;
    }
    if (!rejected) fail(`Self-test async negative was not rejected: ${label}`);
  };
  const refreshObservationId = (value: JsonRecord): void => {
    const base = { ...value };
    delete base.observationId;
    value.observationId = sha256Value(base);
  };
  if (canonicalJson({ z: 1, a: { d: 4, b: 2 } }) !== '{"a":{"b":2,"d":4},"z":1}') {
    fail('Canonical JSON drifted');
  }
  await expectFailureAsync(
    () =>
      parseBoundedJsonResponse(
        new Response(
          JSON.stringify({ padding: 'x'.repeat(MAX_HEALTH_RESPONSE_BYTES) }),
          {
            status: 200,
            headers: { 'content-type': 'application/json' },
          },
        ),
        'self-test oversized health response',
        MAX_HEALTH_RESPONSE_BYTES,
      ),
    'health response exceeds 64 KiB',
  );
  const exactPermissionDetails = {
    permissionDetails: [
      { permissionType: 'user', role: 'reader', inherited: false },
    ],
  };
  if (
    canonicalJson(
      requireExplicitDirectReaderPermissionDetails(exactPermissionDetails),
    ) !== canonicalJson(exactPermissionDetails.permissionDetails)
  ) {
    fail('Self-test rejected exact explicit direct-reader permission details');
  }
  const invalidPermissionDetails: Array<[string, JsonRecord]> = [
    ['missing permissionDetails', {}],
    ['non-array permissionDetails', { permissionDetails: {} }],
    ['empty permissionDetails', { permissionDetails: [] }],
    [
      'unknown permission detail field',
      {
        permissionDetails: [
          { permissionType: 'user', role: 'reader', inherited: false, unknown: true },
        ],
      },
    ],
    [
      'unknown permission type',
      {
        permissionDetails: [
          { permissionType: 'unknown', role: 'reader', inherited: false },
        ],
      },
    ],
    [
      'unknown permission role',
      {
        permissionDetails: [
          { permissionType: 'user', role: 'unknown', inherited: false },
        ],
      },
    ],
    [
      'inherited permission detail',
      {
        permissionDetails: [
          {
            permissionType: 'user',
            role: 'reader',
            inherited: true,
            inheritedFrom: 'parent',
          },
        ],
      },
    ],
    [
      'present null inheritedFrom',
      {
        permissionDetails: [
          {
            permissionType: 'user',
            role: 'reader',
            inherited: false,
            inheritedFrom: null,
          },
        ],
      },
    ],
    [
      'multiple permission details',
      {
        permissionDetails: [
          { permissionType: 'user', role: 'reader', inherited: false },
          { permissionType: 'user', role: 'reader', inherited: false },
        ],
      },
    ],
  ];
  for (const [label, permission] of invalidPermissionDetails) {
    expectFailure(
      () => requireExplicitDirectReaderPermissionDetails(permission),
      label,
    );
  }

  const credentialObject = {
    client_email: 'runtime@example.invalid',
    project_id: 'test-project',
    private_key: 'test-key-material',
  };
  const rawCredential = JSON.stringify(credentialObject);
  const base64Credential = Buffer.from(rawCredential, 'utf8').toString('base64');
  for (const [label, representation] of [
    ['raw JSON object', rawCredential],
    ['base64 JSON object', base64Credential],
  ] as const) {
    if (
      canonicalJson(parseBoundedServiceAccountCredentials(representation)) !==
      canonicalJson(credentialObject)
    ) {
      fail(`Self-test rejected strict ${label} credential form`);
    }
  }
  const invalidCredentials: Array<[string, unknown]> = [
    ['missing credential', undefined],
    ['empty credential', '   '],
    ['malformed credential', '{'],
    ['malformed permissive base64', `${base64Credential}!`],
    ['non-canonical unpadded base64', 'e30'],
    ['base64 with surrounding whitespace', ' e30= '],
    ['raw non-object credential', '[]'],
    [
      'base64 non-object credential',
      Buffer.from('[]', 'utf8').toString('base64'),
    ],
    ['nested JSON credential', JSON.stringify(rawCredential)],
    [
      'quoted base64 credential',
      JSON.stringify(base64Credential),
    ],
    [
      'double-encoded credential',
      Buffer.from(base64Credential, 'utf8').toString('base64'),
    ],
    [
      'invalid UTF-8 base64 credential',
      Buffer.from([0xff, 0xfe, 0xfd]).toString('base64'),
    ],
    [
      'unbounded credential',
      `${' '.repeat(MAX_CREDENTIAL_PAYLOAD_BYTES + 1)}${rawCredential}`,
    ],
  ];
  for (const [label, representation] of invalidCredentials) {
    expectFailure(
      () => parseBoundedServiceAccountCredentials(representation),
      label,
    );
  }
  expectFailure(
    () => healthUrl('https://example.vercel.app:8443/api/health'),
    'health URL with port',
  );
  expectFailure(
    () => healthUrl('https://example.vercel.app/api/health?secret=1'),
    'health URL with query',
  );
  expectFailure(
    () =>
      assertHealthHostAuthorized(
        healthUrl('https://wrong.vercel.app'),
        new Set(['right.vercel.app']),
      ),
    'health hostname outside authenticated aliases',
  );

  const baseline = 'b'.repeat(40);
  const revision7 = '7'.repeat(40);
  const runtime = 'e'.repeat(40);
  const runtimeBindingBase = {
    schemaVersion: 1,
    runtimeCommit: runtime,
    runtimeBindingModule: {
      path: P9_APPLICATION_RUNTIME_BINDING_MODULE_PATH,
      directLiteralExport: true,
      sideEffectFree: true,
    },
    runtimeSourceClosure: {
      method: 'sha256-sorted-runtime-path-and-blob-v1',
      excludedLiteralBindingModulePath:
        P9_APPLICATION_RUNTIME_BINDING_MODULE_PATH,
      fileCount: 3,
      sha256: '4'.repeat(64),
      builtInPrototypeMutationFree: true,
    },
    loader: {
      path: P9_PRODUCTION_SOURCE_LOADER_PATH,
      exportName: P9_PRODUCTION_SOURCE_LOADER_EXPORT,
      fileSha256: '1'.repeat(64),
      directNamedExport: true,
      internalSourceMode: true,
      exactRuntimeCredentialSource: true,
      exactBoundedCredentialParser: true,
      exactSheetsV4Client: true,
      soleReadonlyScope: true,
      exactProductionSpreadsheetId: true,
      exactOrderedRanges: true,
      includeGridData: true,
      boundedFields: true,
      rollbackBeforeGoogleConstruction: true,
      nonceChallengeDirectDataflow: true,
      scholarshipsDirectResponseDataflow: true,
      directRuntimeBindingFlow: true,
    },
    healthRoute: {
      path: P9_HEALTH_ROUTE_PATH,
      fileSha256: '2'.repeat(64),
      directNamedImport: true,
      directAwait: true,
      validatedNonceDirectArgument: true,
      directProbeResultFlow: true,
      directRuntimeBindingFlow: true,
    },
    publicRoute: {
      path: P9_PUBLIC_ROUTE_PATH,
      fileSha256: '3'.repeat(64),
      directNamedImport: true,
      directAwait: true,
      directScholarshipsResultFlow: true,
    },
  };
  const runtimeBinding: JsonRecord = {
    ...runtimeBindingBase,
    bindingSha256: sha256Value(runtimeBindingBase),
  };
  validateApplicationReadRuntimeBinding(
    runtimeBinding,
    runtime,
    'Self-test exact runtime',
  );
  const provider: ProviderIdentity = {
    name: 'vercel',
    apiVersion: 'v13',
    projectIdSha256: '4'.repeat(64),
    teamIdSha256: '5'.repeat(64),
  };
  const runtimeIdentity: RuntimeIdentity = {
    accessMethod: 'vercel-production-environment-api-bounded-read',
    credentialSource: 'authenticated-vercel-project-production-environment',
    credentialKey: 'GOOGLE_SERVICE_ACCOUNT_CREDENTIALS',
    environmentVariableIdSha256: '6'.repeat(64),
    environmentVariableUpdatedAt: '2026-08-30T19:40:00Z',
    principalFingerprintSha256: 'a'.repeat(64),
    runtimeOAuthScopes: [SHEETS_READ_SCOPE],
    evidenceOAuthScopes: [DRIVE_METADATA_SCOPE, SHEETS_READ_SCOPE],
  };
  const canonicalProductionHostname = 'scholarships.example.org';
  const identityPins: OperationalIdentityPins = {
    runtimePrincipalFingerprintSha256:
      runtimeIdentity.principalFingerprintSha256,
    backupRuntimePrincipalFingerprintSha256:
      runtimeIdentity.principalFingerprintSha256,
    providerProjectFingerprintSha256: provider.projectIdSha256,
    providerTeamFingerprintSha256: provider.teamIdSha256,
    providerCanonicalProductionHostnameSha256:
      p9CanonicalProductionHostnameFingerprint(canonicalProductionHostname),
    hostedVerificationEnvironmentFingerprintSha256:
      p9HostedVerificationEnvironmentFingerprint(ENVIRONMENT),
    runtimeCredentialProvenanceFingerprintSha256:
      p9RuntimeCredentialProvenanceFingerprint(runtimeIdentity),
  };
  const pinnedBuildState = {
    schemaVersion: 2,
    planRevision: 9,
    dataAuthority: {
      productionSpreadsheetId: PRODUCTION_ID,
      productionMutationAuthorized: false,
      productionAuthorization: {
        authorized: true,
        spreadsheetId: PRODUCTION_ID,
        accessMode: 'read-only',
        sourceReadAuthorized: true,
        applicationConfigurationSwitchAuthorized: true,
        productionMutationAuthorized: false,
        runtimeReadPermissionVerificationRequired: true,
        runtimePrincipalDirectReaderVerificationRequired: true,
        backupRuntimeReadPermissionVerificationRequired: true,
        providerTargetIdentityPinningRequired: true,
        hostedVerificationEnvironmentVerificationRequired: true,
        runtimeCredentialProvenanceVerificationRequired: true,
        trustedWorkflowPath: WORKFLOW_PATH,
        trustedProofScriptPath: 'web/scripts/p9-trusted-proof.ts',
        trustedWorkflowMode: 'manual-protected-default-branch-only',
        evidenceSchemaVersion: 2,
        ...identityPins,
      },
    },
  };
  if (
    canonicalJson(operationalIdentityPinsFromBuildState(pinnedBuildState)) !==
    canonicalJson(identityPins)
  ) {
    fail('Self-test rejected exact delivered operational identity pins');
  }
  const missingOperationalPin = structuredClone(pinnedBuildState);
  asRecord(
    asRecord(
      missingOperationalPin.dataAuthority,
      'self-test missing-pin data authority',
    ).productionAuthorization,
    'self-test missing-pin production authorization',
  ).providerProjectFingerprintSha256 = null;
  expectFailure(
    () => operationalIdentityPinsFromBuildState(missingOperationalPin),
    'delivered BUILD_STATE contains a null operational identity pin',
  );
  if (
    selectPinnedCanonicalHealthUrl(
      new Set(['generated.vercel.app', canonicalProductionHostname]),
      identityPins,
    ).hostname !== canonicalProductionHostname
  ) {
    fail('Self-test did not select the exact pinned canonical Production alias');
  }
  expectFailure(
    () =>
      selectPinnedCanonicalHealthUrl(
        new Set(['generated.vercel.app', 'wrong.example.org']),
        identityPins,
      ),
    'authenticated aliases omit the pinned canonical Production hostname',
  );
  const inventory = [
    ['api-admin-push', 'web/src/app/api/admin/push/route.ts'],
    ['script-crawl-directory', 'web/scripts/crawl-directory.ts'],
    ['script-ingest-batch', 'web/scripts/ingest-batch.ts'],
    ['script-reeval-staging', 'web/scripts/reeval-staging.ts'],
  ]
    .map(([id, surfacePath]) => ({
      id,
      path: surfacePath,
      mutators: ['spreadsheets.values.update'],
      independentlyDerived: true as const,
      probeExport: 'p9WriteIsolationProbe' as const,
      googleSheetsClientConstructions: 1,
      guardedGoogleSheetsClientConstructions: 1,
      googleSheetsMutatorCalls: 1,
      guardedBeforeClientConstruction: true,
    }))
    .sort(
      (left, right) =>
        left.path.localeCompare(right.path) || left.id.localeCompare(right.id),
    );
  const surfaceIds = inventory.map((surface) => surface.id);
  const makeCapture = (
    jobName: CaptureJob,
    runId: number,
    startedAt: string,
    completedAt: string,
  ): Capture => ({
    repository: REPOSITORY,
    workflowPath: WORKFLOW_PATH,
    workflowCommit: baseline,
    runId,
    runAttempt: 1,
    jobName,
    event: 'workflow_dispatch',
    environment: ENVIRONMENT,
    headSha: baseline,
    startedAt,
    completedAt,
  });
  const sharing = '9'.repeat(64);
  const canonicalCells = ['1'.repeat(64), '2'.repeat(64)];
  const gridData: unknown[][] = [
    [{ startRow: 0, rowData: [{ values: [{ formattedValue: 'alpha' }] }] }],
    [{ startRow: 0, rowData: [{ values: [{ formattedValue: 'beta' }] }] }],
  ];
  const makeChallengeTabs = (
    nonceValue: string,
    challengeGridData: readonly unknown[] = gridData,
  ): JsonRecord[] =>
    TABS.map((tab, index) => {
      const tabIdentity = {
        sheetId: tab.sheetId,
        title: tab.title,
        rowCount: tab.rowCount,
        columnCount: tab.columnCount,
        boundedRange: tab.boundedRange,
      } as P9ApplicationReadTabIdentity;
      return {
        ...tabIdentity,
        nonceBoundCanonicalGridDataSha256: p9ApplicationReadChallengeSha256(
          nonceValue,
          tabIdentity,
          challengeGridData[index] ?? [],
        ),
      };
    });
  const makeSource = (
    startedAt: string,
    completedAt: string,
    challengeNonce: string | null = null,
    challengeGridData: readonly unknown[] = gridData,
  ): JsonRecord => {
    const base = {
      startedAt,
      completedAt,
      spreadsheetId: PRODUCTION_ID,
      revisionBefore: EXPECTED_REVISION,
      revisionAfter: EXPECTED_REVISION,
      sharingBeforeSha256: sharing,
      sharingAfterSha256: sharing,
      runtimePrincipalPermission: {
        permissionIdSha256: '8'.repeat(64),
        type: 'user',
        role: 'reader',
        direct: true,
        expirationTime: null,
      },
      backupReadPrincipalFingerprintSha256:
        runtimeIdentity.principalFingerprintSha256,
      operations: [
        {
          service: 'drive',
          method: 'files.get+permissions.list+revisions.list',
          fields:
            'file(id,name,mimeType,modifiedTime,version,capabilities,permissions);latestRevision(id,modifiedTime)',
        },
        {
          service: 'sheets',
          method: 'spreadsheets.get',
          spreadsheetId: PRODUCTION_ID,
          ranges: TABS.map((tab) => tab.boundedRange),
          includeGridData: true,
        },
        {
          service: 'sheets',
          method: 'spreadsheets.get',
          spreadsheetIds: TABS.map((tab) => tab.backupSpreadsheetId),
          ranges: TABS.map((tab) => tab.boundedRange),
          includeGridData: true,
        },
      ],
      tabs: TABS.map((tab, index) => ({
        sheetId: tab.sheetId,
        title: tab.title,
        rowCount: tab.rowCount,
        columnCount: tab.columnCount,
        boundedRange: tab.boundedRange,
        backupSpreadsheetId: tab.backupSpreadsheetId,
        historicalSourceAndBackupSha256: tab.nativeCellPayloadSha256,
        canonicalCellPayloadHashAlgorithm:
          'google-sheets-v4-griddata-canonical-json-v1',
        sourceCanonicalCellPayloadSha256: canonicalCells[index],
        backupCanonicalCellPayloadSha256: canonicalCells[index],
      })),
      applicationReadChallenge:
        challengeNonce === null
          ? null
          : {
              domain: P9_APPLICATION_READ_CHALLENGE_DOMAIN,
              nonce: challengeNonce,
              hashAlgorithm: P9_APPLICATION_READ_CHALLENGE_HASH_ALGORITHM,
              tabs: makeChallengeTabs(challengeNonce, challengeGridData),
            },
    };
    return { observationId: sha256Value(base), ...base };
  };
  const makeApplicationReadProbe = (
    phase: DeploymentPhase,
    nonceValue: string,
    startedAt: string,
    completedAt: string,
    binding: JsonRecord = runtimeBinding,
    challengeGridData: readonly unknown[] = gridData,
  ): JsonRecord | null => {
    if (phase === 'rollback') return null;
    const base = {
      domain: P9_APPLICATION_READ_CHALLENGE_DOMAIN,
      challengeHashAlgorithm: P9_APPLICATION_READ_CHALLENGE_HASH_ALGORITHM,
      nonce: nonceValue,
      startedAt,
      completedAt,
      spreadsheetId: PRODUCTION_ID,
      oauthScopes: [SHEETS_READ_SCOPE],
      tabs: makeChallengeTabs(nonceValue, challengeGridData),
      runtimeBinding: binding,
    };
    return { observationId: sha256Value(base), ...base };
  };
  const makeConfig = (phase: DeploymentPhase): JsonRecord => ({
    schemaVersion: 1,
    sourceMode:
      phase === 'rollback'
        ? 'accepted-p7-static-catalog'
        : 'production-google-sheet-read-only',
    productionRead:
      phase === 'rollback'
        ? null
        : {
            spreadsheetId: PRODUCTION_ID,
            oauthScopes: [SHEETS_READ_SCOPE],
            tabs: TABS.map(({ sheetId, boundedRange }) => ({ sheetId, boundedRange })),
          },
    staticCatalog:
      phase === 'rollback'
        ? { path: STATIC_CATALOG_PATH, sha256: 'c'.repeat(64) }
        : null,
    writePolicy: {
      spreadsheetId: TESTING_ID,
      blockedSpreadsheetIds: [PRODUCTION_ID],
      productionWritesDisabled: true,
      writerEnabled: false,
      surfaces: surfaceIds,
    },
    mappingVersion: 'p9-v1',
    runtimeIdentityFingerprintSha256: runtimeIdentity.principalFingerprintSha256,
  });

  const entryCapture = makeCapture(
    'entry',
    1001,
    '2026-08-30T20:00:00Z',
    '2026-08-30T20:05:00Z',
  );
  const baselineDeploymentBase = {
    deploymentId: 'dpl_Baseline',
    urlHost: canonicalProductionHostname,
    target: 'production',
    readyState: 'READY',
    createdAt: '2026-08-30T19:50:00Z',
    readyAt: '2026-08-30T19:55:00Z',
    projectIdSha256: provider.projectIdSha256,
    teamIdSha256: provider.teamIdSha256,
    gitSource: { type: 'github', repositoryId: 12345, ref: 'main', sha: baseline },
  };
  const entry: JsonRecord = {
    schemaVersion: 2,
    stageId: 'P9',
    receiptType: 'entry',
    p9BaselineCommit: baseline,
    revision7AttestationCommit: revision7,
    capture: entryCapture,
    baselineProductionDeployment: {
      observationId: sha256Value(baselineDeploymentBase),
      ...baselineDeploymentBase,
    },
    productionSpreadsheetId: PRODUCTION_ID,
    runtimeIdentity,
    sourceObservation: makeSource('2026-08-30T20:01:00Z', '2026-08-30T20:04:00Z'),
  };
  const descriptors: Record<Phase, Predecessor> = {
    entry: {
      phase: 'entry', runId: 1001, runAttempt: 1, artifactId: 2001,
      subjectSha256: '1'.repeat(64), workflowCommit: baseline,
    },
    cutover: {
      phase: 'cutover', runId: 1002, runAttempt: 1, artifactId: 2002,
      subjectSha256: '2'.repeat(64), workflowCommit: baseline,
    },
    rollback: {
      phase: 'rollback', runId: 1003, runAttempt: 1, artifactId: 2003,
      subjectSha256: '3'.repeat(64), workflowCommit: baseline,
    },
    'restored-cutover': {
      phase: 'restored-cutover', runId: 1004, runAttempt: 1, artifactId: 2004,
      subjectSha256: '4'.repeat(64), workflowCommit: baseline,
    },
  };
  const makePhase = (
    phase: DeploymentPhase,
    index: number,
    predecessor: JsonRecord,
    descriptor: Predecessor,
    times: [string, string, string, string, string, string, string],
  ): JsonRecord => {
    const [createdAt, readyAt, captureStart, healthAt, sourceStart, sourceEnd, captureEnd] = times;
    const phaseCapture = makeCapture(phaseJob(phase), 1001 + index, captureStart, captureEnd);
    const config = makeConfig(phase);
    const deploymentId = `dpl_Phase${index}`;
    const healthNonce = String(index).repeat(32);
    const health = {
      observedAt: healthAt,
      statusCode: 200,
      contentType: 'application/json',
      nonce: healthNonce,
      commit: runtime,
      deploymentId,
      environment: 'production',
      runtimeConfig: config,
      runtimeConfigSha256: sha256Value(config),
      applicationRuntimeBinding: runtimeBinding,
      applicationReadProbe: makeApplicationReadProbe(
        phase,
        healthNonce,
        captureStart,
        healthAt,
      ),
    };
    const deploymentBase = {
      role: phase,
      deploymentId,
      urlHost: canonicalProductionHostname,
      target: 'production',
      readyState: 'READY',
      createdAt,
      readyAt,
      capture: phaseCapture,
      gitSource: {
        type: 'github', repositoryId: 12345,
        ref: 'codex/p9-read-only-cutover', sha: runtime,
      },
      health,
    };
    const body = {
      schemaVersion: 2,
      kind: 'p9-trusted-phase-v2',
      stageId: 'P9',
      phase,
      p9BaselineCommit: baseline,
      revision7AttestationCommit: revision7,
      runtimeCommit: runtime,
      productionSpreadsheetId: PRODUCTION_ID,
      capture: phaseCapture,
      predecessor: descriptor,
      provider,
      runtimeIdentity,
      runtimeBinding,
      deploymentObservation: {
        observationId: sha256Value(deploymentBase),
        ...deploymentBase,
      },
      sourceObservation: makeSource(
        sourceStart,
        sourceEnd,
        phase === 'rollback' ? null : healthNonce,
      ),
    };
    const receipt = { observationId: sha256Value(body), ...body };
    validatePhaseReceipt(
      receipt,
      phase,
      baseline,
      revision7,
      runtime,
      predecessor,
      descriptor,
      identityPins,
    );
    return receipt;
  };
  const cutover = makePhase('cutover', 1, entry, descriptors.entry, [
    '2026-08-30T20:10:00Z', '2026-08-30T20:11:00Z',
    '2026-08-30T20:12:00Z', '2026-08-30T20:13:00Z',
    '2026-08-30T20:14:00Z', '2026-08-30T20:15:00Z',
    '2026-08-30T20:16:00Z',
  ]);
  const rollback = makePhase('rollback', 2, cutover, descriptors.cutover, [
    '2026-08-30T20:20:00Z', '2026-08-30T20:21:00Z',
    '2026-08-30T20:22:00Z', '2026-08-30T20:23:00Z',
    '2026-08-30T20:24:00Z', '2026-08-30T20:25:00Z',
    '2026-08-30T20:26:00Z',
  ]);
  const restored = makePhase(
    'restored-cutover', 3, rollback, descriptors.rollback, [
      '2026-08-30T20:30:00Z', '2026-08-30T20:31:00Z',
      '2026-08-30T20:32:00Z', '2026-08-30T20:33:00Z',
      '2026-08-30T20:34:00Z', '2026-08-30T20:35:00Z',
      '2026-08-30T20:36:00Z',
    ],
  );

  const cutoverObservation = asRecord(
    cutover.deploymentObservation,
    'self-test cutover deployment',
  );
  const cutoverHealth = asRecord(
    cutoverObservation.health,
    'self-test cutover health',
  );
  const cutoverNonce = stringField(
    cutoverHealth,
    'nonce',
    'self-test cutover health',
  );
  const cutoverProbe = asRecord(
    cutoverHealth.applicationReadProbe,
    'self-test cutover application read probe',
  );
  const cutoverSource = validateSourceObservationShape(cutover.sourceObservation);
  const rawHealthBody: JsonRecord = {
    ok: true,
    nonce: cutoverNonce,
    commit: runtime,
    deploymentId: cutoverObservation.deploymentId,
    environment: 'production',
    runtimeConfig: cutoverHealth.runtimeConfig,
    runtimeConfigSha256: cutoverHealth.runtimeConfigSha256,
    applicationRuntimeBinding: runtimeBinding,
    applicationReadProbe: cutoverProbe,
  };
  validateHealthResponseBody(
    rawHealthBody,
    'cutover',
    stringField(cutoverObservation, 'deploymentId', 'self-test cutover deployment'),
    runtime,
    cutoverNonce,
    runtimeBinding,
  );
  for (const extraKey of ['data', 'values'] as const) {
    expectFailure(
      () =>
        validateHealthResponseBody(
          { ...rawHealthBody, [extraKey]: [] },
          'cutover',
          stringField(
            cutoverObservation,
            'deploymentId',
            'self-test cutover deployment',
          ),
          runtime,
          cutoverNonce,
          runtimeBinding,
        ),
      `health response contains unexpected ${extraKey}`,
    );
  }
  const healthWithoutRuntimeBinding = { ...rawHealthBody };
  delete healthWithoutRuntimeBinding.applicationRuntimeBinding;
  expectFailure(
    () =>
      validateHealthResponseBody(
        healthWithoutRuntimeBinding,
        'cutover',
        stringField(cutoverObservation, 'deploymentId', 'self-test cutover deployment'),
        runtime,
        cutoverNonce,
        runtimeBinding,
      ),
    'health response omits the independently derived runtime binding',
  );
  expectFailure(
    () =>
      validateHealthResponseBody(
        { ...rawHealthBody, nonce: 'r'.repeat(32) },
        'cutover',
        stringField(cutoverObservation, 'deploymentId', 'self-test cutover deployment'),
        runtime,
        cutoverNonce,
        runtimeBinding,
      ),
    'health response replays a different nonce',
  );

  const expectChallengeMismatch = (digest: string, label: string): void => {
    const probe = structuredClone(cutoverProbe);
    const tabs = probe.tabs;
    if (!Array.isArray(tabs)) fail('Self-test challenge probe lacks tabs');
    asRecord(tabs[0], 'Self-test challenge tab').nonceBoundCanonicalGridDataSha256 =
      digest;
    refreshObservationId(probe);
    expectFailure(() => {
      const validatedProbe = validateApplicationReadProbe(
        probe,
        'cutover',
        cutoverNonce,
        runtimeBinding,
      );
      bindApplicationReadProbeToSource(
        validatedProbe,
        cutoverSource,
        'cutover',
      );
    }, label);
  };
  const oldRawGridHash = sha256Value(gridData[0]);
  expectChallengeMismatch(
    oldRawGridHash,
    'legacy raw GridData hash is accepted as a nonce-bound challenge',
  );
  expectChallengeMismatch(
    sha256Value({ nonce: cutoverNonce, oldHash: oldRawGridHash }),
    'nonce wrapping a legacy GridData hash is accepted as a direct challenge',
  );
  const mutatedTabIdentity = {
    sheetId: TABS[0].sheetId,
    title: TABS[0].title,
    rowCount: TABS[0].rowCount,
    columnCount: TABS[0].columnCount,
    boundedRange: TABS[0].boundedRange,
  } as P9ApplicationReadTabIdentity;
  expectChallengeMismatch(
    p9ApplicationReadChallengeSha256(
      cutoverNonce,
      mutatedTabIdentity,
      [{ startRow: 0, rowData: [{ values: [{ formattedValue: 'alphb' }] }] }],
    ),
    'one-byte GridData mutation is accepted as the independent challenge',
  );
  const replayProbe = makeApplicationReadProbe(
    'cutover',
    'r'.repeat(32),
    String(cutoverProbe.startedAt),
    String(cutoverProbe.completedAt),
  );
  expectFailure(
    () =>
      validateApplicationReadProbe(
        replayProbe,
        'cutover',
        cutoverNonce,
        runtimeBinding,
      ),
    'application read probe replays a different nonce',
  );

  const wrongCommitBinding = structuredClone(runtimeBinding);
  wrongCommitBinding.runtimeCommit = 'd'.repeat(40);
  const wrongCommitBindingBase = { ...wrongCommitBinding };
  delete wrongCommitBindingBase.bindingSha256;
  wrongCommitBinding.bindingSha256 = sha256Value(wrongCommitBindingBase);
  expectFailure(
    () =>
      validateApplicationReadRuntimeBinding(
        wrongCommitBinding,
        runtime,
        'Self-test wrong runtime commit',
      ),
    'runtime binding is rebound to another commit',
  );
  const changedRuntimeBinding = structuredClone(runtimeBinding);
  asRecord(
    changedRuntimeBinding.loader,
    'Self-test changed runtime loader',
  ).fileSha256 = 'f'.repeat(64);
  const changedRuntimeBindingBase = { ...changedRuntimeBinding };
  delete changedRuntimeBindingBase.bindingSha256;
  changedRuntimeBinding.bindingSha256 = sha256Value(changedRuntimeBindingBase);
  validateApplicationReadRuntimeBinding(
    changedRuntimeBinding,
    runtime,
    'Self-test changed runtime',
  );
  expectFailure(
    () =>
      requireByteIdenticalRuntimeBindings(
        [runtimeBinding, changedRuntimeBinding],
        'Self-test cross-phase',
      ),
    'cross-phase runtime binding mismatch',
  );
  const mismatchedBindingProbe = structuredClone(cutoverProbe);
  mismatchedBindingProbe.runtimeBinding = changedRuntimeBinding;
  refreshObservationId(mismatchedBindingProbe);
  expectFailure(
    () =>
      validateApplicationReadProbe(
        mismatchedBindingProbe,
        'cutover',
        cutoverNonce,
        runtimeBinding,
      ),
    'application probe carries a different valid runtime binding',
  );
  const unsafeRollbackBinding = structuredClone(runtimeBinding);
  asRecord(
    unsafeRollbackBinding.loader,
    'Self-test unsafe rollback loader',
  ).rollbackBeforeGoogleConstruction = false;
  const unsafeRollbackBindingBase = { ...unsafeRollbackBinding };
  delete unsafeRollbackBindingBase.bindingSha256;
  unsafeRollbackBinding.bindingSha256 = sha256Value(unsafeRollbackBindingBase);
  expectFailure(
    () =>
      validateApplicationReadRuntimeBinding(
        unsafeRollbackBinding,
        runtime,
        'Self-test unsafe rollback runtime',
      ),
    'rollback binding permits Google construction before static fallback',
  );
  const rollbackSourceWithChallenge = structuredClone(
    asRecord(rollback.sourceObservation, 'Self-test rollback source'),
  );
  rollbackSourceWithChallenge.applicationReadChallenge = {
    domain: P9_APPLICATION_READ_CHALLENGE_DOMAIN,
    nonce: 'q'.repeat(32),
    hashAlgorithm: P9_APPLICATION_READ_CHALLENGE_HASH_ALGORITHM,
    tabs: makeChallengeTabs('q'.repeat(32)),
  };
  expectFailure(
    () =>
      bindApplicationReadProbeToSource(
        null,
        rollbackSourceWithChallenge,
        'rollback',
      ),
    'rollback independent challenge is not null',
  );

  const overlongApplicationProbe = makeApplicationReadProbe(
    'cutover',
    'n'.repeat(32),
    '2026-08-30T20:00:00Z',
    '2026-08-30T20:16:00Z',
  );
  expectFailure(
    () =>
      validateApplicationReadProbe(
        overlongApplicationProbe,
        'cutover',
        'n'.repeat(32),
        runtimeBinding,
      ),
    'application read probe exceeds its bounded duration',
  );

  const wrongProvider = structuredClone(cutover);
  asRecord(wrongProvider.provider, 'wrong provider').teamIdSha256 = 'f'.repeat(64);
  const { observationId: _wrongProviderId, ...wrongProviderBody } = wrongProvider;
  wrongProvider.observationId = sha256Value(wrongProviderBody);
  expectFailure(
    () => validatePhaseReceipt(
      wrongProvider,
      'cutover',
      baseline,
      revision7,
      runtime,
      entry,
      descriptors.entry,
      identityPins,
    ),
    'phase provider differs from attested predecessor',
  );
  expectFailure(
    () =>
      validatePhaseReceipt(
        cutover,
        'cutover',
        baseline,
        revision7,
        runtime,
        entry,
        descriptors.entry,
        {
          ...identityPins,
          providerProjectFingerprintSha256: '0'.repeat(64),
        },
      ),
    'predecessor-consistent provider differs from delivered project pin',
  );
  expectFailure(
    () =>
      validatePhaseReceipt(
        cutover,
        'cutover',
        baseline,
        revision7,
        runtime,
        entry,
        descriptors.entry,
        {
          ...identityPins,
          hostedVerificationEnvironmentFingerprintSha256: '0'.repeat(64),
        },
      ),
    'capture differs from delivered hosted-environment pin',
  );
  expectFailure(
    () =>
      validatePhaseReceipt(
        cutover,
        'cutover',
        baseline,
        revision7,
        runtime,
        entry,
        descriptors.entry,
        {
          ...identityPins,
          runtimeCredentialProvenanceFingerprintSha256: '0'.repeat(64),
        },
      ),
    'runtime identity differs from delivered credential-provenance pin',
  );
  const wrongPinnedHostname = structuredClone(cutover);
  const wrongPinnedHostnameDeployment = asRecord(
    wrongPinnedHostname.deploymentObservation,
    'wrong pinned-host deployment',
  );
  wrongPinnedHostnameDeployment.urlHost = 'wrong.example.org';
  const {
    observationId: _wrongPinnedHostnameDeploymentId,
    ...wrongPinnedHostnameDeploymentBase
  } = wrongPinnedHostnameDeployment;
  wrongPinnedHostnameDeployment.observationId = sha256Value(
    wrongPinnedHostnameDeploymentBase,
  );
  const {
    observationId: _wrongPinnedHostnameReceiptId,
    ...wrongPinnedHostnameReceiptBase
  } = wrongPinnedHostname;
  wrongPinnedHostname.observationId = sha256Value(wrongPinnedHostnameReceiptBase);
  expectFailure(
    () =>
      validatePhaseReceipt(
        wrongPinnedHostname,
        'cutover',
        baseline,
        revision7,
        runtime,
        entry,
        descriptors.entry,
        identityPins,
      ),
    'deployment receipt host differs from delivered canonical Production pin',
  );
  const reversed = structuredClone(cutover);
  const reversedDeployment = asRecord(reversed.deploymentObservation, 'reversed deployment');
  reversedDeployment.createdAt = '2026-08-30T20:04:00Z';
  const { observationId: _reversedDeploymentId, ...reversedDeploymentBody } = reversedDeployment;
  reversedDeployment.observationId = sha256Value(reversedDeploymentBody);
  const { observationId: _reversedId, ...reversedBody } = reversed;
  reversed.observationId = sha256Value(reversedBody);
  expectFailure(
    () => validatePhaseReceipt(
      reversed,
      'cutover',
      baseline,
      revision7,
      runtime,
      entry,
      descriptors.entry,
      identityPins,
    ),
    'deployment created before predecessor completion',
  );

  const mismatchedApplicationHash = structuredClone(cutover);
  const mismatchedApplicationDeployment = asRecord(
    mismatchedApplicationHash.deploymentObservation,
    'mismatched application deployment',
  );
  const mismatchedApplicationHealth = asRecord(
    mismatchedApplicationDeployment.health,
    'mismatched application health',
  );
  const mismatchedApplicationProbe = asRecord(
    mismatchedApplicationHealth.applicationReadProbe,
    'mismatched application read probe',
  );
  const mismatchedApplicationTabs = mismatchedApplicationProbe.tabs;
  if (!Array.isArray(mismatchedApplicationTabs)) {
    fail('Self-test application read probe lacks tabs');
  }
  asRecord(
    mismatchedApplicationTabs[0],
    'mismatched application read tab',
  ).nonceBoundCanonicalGridDataSha256 = 'f'.repeat(64);
  const {
    observationId: _mismatchedApplicationProbeId,
    ...mismatchedApplicationProbeBase
  } = mismatchedApplicationProbe;
  mismatchedApplicationProbe.observationId = sha256Value(mismatchedApplicationProbeBase);
  const {
    observationId: _mismatchedApplicationDeploymentId,
    ...mismatchedApplicationDeploymentBase
  } = mismatchedApplicationDeployment;
  mismatchedApplicationDeployment.observationId = sha256Value(
    mismatchedApplicationDeploymentBase,
  );
  const {
    observationId: _mismatchedApplicationReceiptId,
    ...mismatchedApplicationReceiptBase
  } = mismatchedApplicationHash;
  mismatchedApplicationHash.observationId = sha256Value(mismatchedApplicationReceiptBase);
  expectFailure(
    () =>
      validatePhaseReceipt(
        mismatchedApplicationHash,
        'cutover',
        baseline,
        revision7,
        runtime,
        entry,
        descriptors.entry,
        identityPins,
      ),
    'application read hash differs from independent source observation',
  );

  const rollbackWithApplicationRead = structuredClone(rollback);
  const rollbackWithApplicationReadDeployment = asRecord(
    rollbackWithApplicationRead.deploymentObservation,
    'rollback with application read deployment',
  );
  const rollbackWithApplicationReadHealth = asRecord(
    rollbackWithApplicationReadDeployment.health,
    'rollback with application read health',
  );
  const rollbackNonce = stringField(
    rollbackWithApplicationReadHealth,
    'nonce',
    'rollback with application read health',
  );
  rollbackWithApplicationReadHealth.applicationReadProbe = makeApplicationReadProbe(
    'cutover',
    rollbackNonce,
    '2026-08-30T20:22:00Z',
    '2026-08-30T20:23:00Z',
  );
  const {
    observationId: _rollbackWithApplicationReadDeploymentId,
    ...rollbackWithApplicationReadDeploymentBase
  } = rollbackWithApplicationReadDeployment;
  rollbackWithApplicationReadDeployment.observationId = sha256Value(
    rollbackWithApplicationReadDeploymentBase,
  );
  const {
    observationId: _rollbackWithApplicationReadReceiptId,
    ...rollbackWithApplicationReadReceiptBase
  } = rollbackWithApplicationRead;
  rollbackWithApplicationRead.observationId = sha256Value(
    rollbackWithApplicationReadReceiptBase,
  );
  expectFailure(
    () =>
      validatePhaseReceipt(
        rollbackWithApplicationRead,
        'rollback',
        baseline,
        revision7,
        runtime,
        cutover,
        descriptors.cutover,
        identityPins,
      ),
    'rollback application read probe is not null',
  );

  const observations = [cutover, rollback, restored].map((receipt) =>
    asRecord(receipt.deploymentObservation, 'self-test deployment observation'),
  );
  const finalCapture = makeCapture(
    'finalize', 1005, '2026-08-30T20:40:00Z', '2026-08-30T20:45:00Z',
  );
  const deploymentRecord = {
    schemaVersion: 2,
    stageId: 'P9',
    receiptType: 'deployment',
    p9BaselineCommit: baseline,
    runtimeCommit: runtime,
    revision7AttestationCommit: revision7,
    capture: finalCapture,
    provider,
    deployments: {
      cutover: observations[0],
      rollback: observations[1],
      restoredCutover: observations[2],
    },
  };
  const testCommand = WRITE_ISOLATION_COMMAND;
  const testedSurfaces = inventory.map((surface) => ({
    id: surface.id,
    path: surface.path,
    mutators: surface.mutators,
    independentlyDerived: true as const,
    probeExport: 'p9WriteIsolationProbe' as const,
    probeInvoked: true as const,
    guardedBeforeClientConstruction: true as const,
    negativeTestName: `p9-write-isolation:${surface.id}`,
    attemptedSpreadsheetId: PRODUCTION_ID,
    outcome: 'blocked-before-client-construction',
    guardErrorCode: 'P9_PRODUCTION_WRITE_BLOCKED',
    clientConstructions: 0,
    writeCalls: 0,
  }));
  const writeIsolation = {
    testedCommit: runtime,
    runtimeBinding,
    runtimeStaticCatalogSha256: 'c'.repeat(64),
    ciRunId: finalCapture.runId,
    inventoryMethod: 'typescript-ast-complete-google-mutator-inventory',
    inventorySha256: sha256Value({
      inventoryMethod: 'typescript-ast-complete-google-mutator-inventory',
      surfaces: inventory,
    }),
    discoveredSurfaceCount: inventory.length,
    testStartedAt: '2026-08-30T20:37:00Z',
    testCompletedAt: '2026-08-30T20:38:00Z',
    testCommand,
    testExitCode: 0,
    testOutputSha256: sha256Value({
      testCommand,
      testedCommit: runtime,
      runtimeBinding,
      surfaces: testedSurfaces,
    }),
    surfaces: testedSurfaces,
  };
  const postReceipt = {
    schemaVersion: 2,
    stageId: 'P9',
    receiptType: 'post-cutover',
    p9BaselineCommit: baseline,
    runtimeCommit: runtime,
    revision7AttestationCommit: revision7,
    capture: finalCapture,
    deploymentObservationIds: {
      cutover: observations[0].observationId,
      rollback: observations[1].observationId,
      restoredCutover: observations[2].observationId,
    },
    sourceObservations: [cutover, rollback, restored].map((receipt, index) => ({
      phase: [
        'after-cutover-smoke',
        'after-rollback-proof',
        'after-restored-cutover',
      ][index],
      deploymentId: observations[index].deploymentId,
      observation: receipt.sourceObservation,
    })),
    writeIsolation,
  };
  const schemas = await import('./p9-evidence-v2');
  const semanticContext = {
    p9BaselineCommit: baseline,
    p9BaselineCommittedAt: '2026-08-30T19:00:00Z',
    revision7AttestationCommit: revision7,
    revision7AttestationCommittedAt: '2026-08-30T18:00:00Z',
    revision7CandidateCommit: '8'.repeat(40),
    runtimePrincipalFingerprintSha256:
      identityPins.runtimePrincipalFingerprintSha256,
    providerProjectFingerprintSha256:
      identityPins.providerProjectFingerprintSha256,
    providerTeamFingerprintSha256:
      identityPins.providerTeamFingerprintSha256,
    providerCanonicalProductionHostnameSha256:
      identityPins.providerCanonicalProductionHostnameSha256,
    hostedVerificationEnvironmentFingerprintSha256:
      identityPins.hostedVerificationEnvironmentFingerprintSha256,
    runtimeCredentialProvenanceFingerprintSha256:
      identityPins.runtimeCredentialProvenanceFingerprintSha256,
    expectedStaticCatalogSha256: 'c'.repeat(64),
    expectedWriteSurfaceInventory: inventory,
  };
  const semanticErrors = schemas.validateP9ReceiptSetSemanticsV2(
    { entry, deployment: deploymentRecord, postCutover: postReceipt },
    semanticContext,
  );
  if (semanticErrors.length > 0) {
    fail(`Self-test valid receipt set was rejected: ${semanticErrors.join('; ')}`);
  }
  const catalogMutationErrors = schemas.validateP9ReceiptSetSemanticsV2(
    { entry, deployment: deploymentRecord, postCutover: postReceipt },
    { ...semanticContext, expectedStaticCatalogSha256: 'd'.repeat(64) },
  );
  if (!catalogMutationErrors.some((error) => /rollback|static source/i.test(error))) {
    fail('Self-test accepted a rollback catalog that differs from the accepted P7 digest');
  }
  const reversedFinalize = structuredClone(postReceipt);
  const reversedCapture = asRecord(reversedFinalize.capture, 'reversed finalize capture');
  reversedCapture.startedAt = '2026-08-30T20:37:30Z';
  const reversedErrors = schemas.validateP9ReceiptSetSemanticsV2(
    { entry, deployment: deploymentRecord, postCutover: reversedFinalize },
    semanticContext,
  );
  if (!reversedErrors.some((error) => /write-isolation|same finalize job/i.test(error))) {
    fail('Self-test reversed finalize chronology was not rejected semantically');
  }
  expectFailure(
    () => assertProviderIdentity(
      provider,
      { ...provider, projectIdSha256: '0'.repeat(64) },
      'self-test',
    ),
    'wrong provider identity',
  );
  console.log(
    'P9 trusted proof self-test: PASS (host, provider, predecessor, chronology, strict v2, and semantic negatives)',
  );
}

async function main(): Promise<void> {
  const mode = currentMode();
  if (mode === 'fetch-predecessors') return fetchPredecessors();
  if (mode === 'emit-descriptor') return emitSuccessorDescriptor();
  if (mode === 'entry') return writeEntry();
  if (mode === 'cutover' || mode === 'rollback' || mode === 'restored-cutover') {
    return writePhase(mode);
  }
  if (mode === 'finalize') return finalize();
  if (mode === 'write-isolation') return writeIsolationReceipt();
  if (mode === 'self-test') return selfTest();
  fail('Unknown trusted proof mode');
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'unknown failure';
  console.error(`P9 trusted proof failed closed: ${message}`);
  process.exitCode = 1;
});
