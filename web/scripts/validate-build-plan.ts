import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { fileURLToPath } from 'node:url';

import {
  changedAcceptedIntegration,
  isExactHistoricalDeliveryState,
} from './delivery-state-history';
import {
  isExactP2IntegratedPackage,
  type PackageDocument,
} from './delivery-package-history';
import {
  changedAttestedPlanAmendment,
  changedStandingAuthorization,
  maximumAttestedPlanRevision,
} from './governance-history';
import {
  P9_DEPLOYMENT_EVIDENCE_PATH,
  P9_ENTRY_EVIDENCE_PATH,
  P9_POST_CUTOVER_EVIDENCE_PATH,
  P9_RUNTIME_EQUIVALENCE_PATHS,
  type P9DeploymentRecord,
  type P9EntryReceipt,
  type P9PostCutoverReceipt,
  type P9ProductionAuthorization,
  type P9TestingWriteAuthorization,
  p9ReadOnlyAuthorityChanged,
  validateP9DeploymentGitBinding,
  validateP9DeploymentRecord,
  validateP9EntryReceipt,
  validateP9PostCutoverReceipt,
  validateP9ReadOnlyAuthority,
} from './production-authority';

type StageStatus =
  | 'planned'
  | 'active'
  | 'implemented'
  | 'verified'
  | 'accepted'
  | 'blocked-external'
  | 'failed'
  | 'superseded';

type Stage = {
  id: string;
  name: string;
  status: StageStatus;
  baselineCommit: string | null;
  evidencePath: string;
  manifestPath: string;
  reviewPath: string;
  kickoffPath: string | null;
};

type MergeAuthorization = {
  stageId: string;
  authorized: boolean;
  authorizedBy: string | null;
  authorizedAt: string | null;
  evidencePath: string | null;
  basis: string;
  scope: string;
};

type PlanAmendment = {
  id: string;
  status: 'accepted' | 'attestation-gated';
  baselineCommit: string;
  evidencePath: string;
  manifestPath: string;
  reviewPath: string;
  deliveryAuthorization?: {
    authorized: boolean;
    authorizedBy: string | null;
    authorizedAt: string | null;
    evidencePath: string | null;
    basis: string;
    scope: string;
  };
};

type DeliveryIntegration = {
  stageId: string;
  status: 'authorized-pending' | 'accepted';
  stageCandidateCommit: string;
  stageAttestationCommit: string;
  originalBaselineCommit: string;
  deliveryBaselineCommit: string | null;
  evidencePath: string;
  manifestPath: string;
  reviewPath: string;
  governanceResolutionPaths: string[];
};

type BuildState = {
  schemaVersion: number;
  planRevision: number;
  planPath: string;
  lastUpdated: string;
  repository: {
    owner: string;
    name: string;
    defaultBranch: string;
    baselineCommit: string;
  };
  dataAuthority: {
    testingSpreadsheetId: string;
    testingMasterTab: string;
    testingWriteAuthorization?: {
      authorizationId: string;
      authorized: boolean;
      authorizedBy: string;
      authorizedAt: string;
      evidencePath: string;
      spreadsheetId: string;
      sheetName: string;
      revisionFingerprintRequired: boolean;
      reversibleBackupRequired: boolean;
      basis: string;
      scope: string;
    };
    p9TestingWriteAuthorization?: P9TestingWriteAuthorization;
    productionSpreadsheetId: string | null;
    productionMutationAuthorized: boolean;
    productionAuthorization: P9ProductionAuthorization | null;
  };
  deployment: {
    mainAutoDeploysProduction: boolean;
    stageMergeAuthorizations: MergeAuthorization[];
    deliveryIntegrations?: DeliveryIntegration[];
    deliveryBlockers: string[];
  };
  governance?: {
    planAmendments: PlanAmendment[];
  };
  activeStageId: string | null;
  nextPermittedStageId: string | null;
  stages: Stage[];
  invariants: string[];
};

type CandidateManifest = {
  schemaVersion: number;
  stageId: string;
  createdAt: string;
  baselineCommit: string;
  candidateCommit: string;
  files: Array<{
    path: string;
    change: 'present' | 'deleted';
    sha256: string | null;
  }>;
};

type ReviewRecord = {
  schemaVersion: number;
  stageId: string;
  reviewerTaskId: string;
  reviewerWasAuthorOrEditor: boolean;
  reviewMode: string;
  reviewedAt: string;
  outcome: string;
  findings: { critical: number; high: number; medium: number; low: number };
  dispositions: Array<{
    severity: 'medium' | 'low';
    summary: string;
    rationale: string;
    owner: string;
    target: string;
  }>;
  candidateManifestPath: string;
  candidateManifestSha256: string;
};

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..', '..');
const expectedStageIds = Array.from({ length: 10 }, (_, i) => `P${i}`);
const closedStatuses = new Set<StageStatus>(['accepted']);
const inFlightStatuses = new Set<StageStatus>([
  'active',
  'implemented',
  'verified',
  'blocked-external',
  'failed',
]);
const allowedStatuses = new Set<StageStatus>([
  'planned',
  'superseded',
  ...closedStatuses,
  ...inFlightStatuses,
]);
const errors: string[] = [];

function fail(message: string): void {
  errors.push(message);
}

function absolute(relativePath: string): string {
  const resolved = path.resolve(repoRoot, relativePath);
  const prefix = repoRoot.endsWith(path.sep) ? repoRoot : `${repoRoot}${path.sep}`;
  if (resolved !== repoRoot && !resolved.startsWith(prefix)) {
    throw new Error(`Path escapes repository root: ${relativePath}`);
  }
  return resolved;
}

function requireFile(relativePath: string): string {
  let target = '';
  try {
    target = absolute(relativePath);
  } catch (error) {
    fail((error as Error).message);
    return '';
  }
  if (!fs.existsSync(target) || !fs.statSync(target).isFile()) {
    fail(`Missing required file: ${relativePath}`);
    return '';
  }
  return fs.readFileSync(target, 'utf8');
}

function readJson<T>(relativePath: string): T | null {
  const raw = requireFile(relativePath);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    fail(`${relativePath} is not valid JSON: ${(error as Error).message}`);
    return null;
  }
}

function sha256File(relativePath: string): string {
  return createHash('sha256').update(fs.readFileSync(absolute(relativePath))).digest('hex');
}

function sha256Buffer(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex');
}

function gitLines(args: string[]): string[] {
  try {
    const output = execFileSync('git', args, {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return output.split('\n').map((line) => line.trim()).filter(Boolean);
  } catch (error) {
    const stderr = (error as { stderr?: string }).stderr?.trim();
    fail(`Git comparison failed: ${stderr || (error as Error).message}`);
    return [];
  }
}

function gitBuffer(args: string[]): Buffer | null {
  try {
    return execFileSync('git', args, {
      cwd: repoRoot,
      encoding: 'buffer',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch {
    return null;
  }
}

function gitText(args: string[]): string | null {
  const value = gitBuffer(args);
  return value ? value.toString('utf8') : null;
}

function gitObjectExists(commit: string): boolean {
  try {
    execFileSync('git', ['cat-file', '-e', `${commit}^{commit}`], {
      cwd: repoRoot,
      stdio: 'ignore',
    });
    return true;
  } catch {
    return false;
  }
}

function isAncestor(ancestor: string, descendant: string): boolean {
  try {
    execFileSync('git', ['merge-base', '--is-ancestor', ancestor, descendant], {
      cwd: repoRoot,
      stdio: 'ignore',
    });
    return true;
  } catch {
    return false;
  }
}

function jsonAtCommit<T>(commit: string, relativePath: string): T | null {
  const raw = gitText(['show', `${commit}:${relativePath}`]);
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    fail(`${relativePath} at ${commit} is not valid JSON: ${(error as Error).message}`);
    return null;
  }
}

function completeChangeSet(
  baselineCommit: string,
  candidateCommit: string,
  excludedPaths: Set<string>,
): Map<string, 'present' | 'deleted'> {
  const changes = new Map<string, 'present' | 'deleted'>();
  const diffLines = gitLines([
    'diff',
    '--name-status',
    '--no-renames',
    '--diff-filter=ACDMT',
    baselineCommit,
    candidateCommit,
    '--',
  ]);
  for (const line of diffLines) {
    const [status, ...pathParts] = line.split('\t');
    const relativePath = pathParts.join('\t');
    if (!relativePath || excludedPaths.has(relativePath)) continue;
    changes.set(relativePath, status === 'D' ? 'deleted' : 'present');
  }
  return changes;
}

function acceptedPrefixLength(candidateState: BuildState): number {
  let length = 0;
  while (candidateState.stages[length]?.status === 'accepted') length += 1;
  return length;
}

function isIsoTimestamp(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value);
}

function validateBoundAttestation(
  subjectId: string,
  baselineCommit: string,
  manifestPath: string,
  reviewPath: string,
  expectedMergeSecondParent?: string,
): string | undefined {
  const manifestRaw = requireFile(manifestPath);
  const reviewRaw = requireFile(reviewPath);
  const requiredPaths = [manifestPath, reviewPath].sort();
  let attestationCommit: string | undefined;

  for (const additionCommit of gitLines([
    'log',
    '--reverse',
    '--diff-filter=A',
    '--format=%H',
    '--',
    manifestPath,
  ])) {
    const historicalManifest = gitText(['show', `${additionCommit}:${manifestPath}`]);
    const historicalReview = gitText(['show', `${additionCommit}:${reviewPath}`]);
    if (historicalManifest === null || historicalReview === null) continue;
    let parsed: CandidateManifest;
    try {
      parsed = JSON.parse(historicalManifest) as CandidateManifest;
    } catch {
      continue;
    }
    const parent = gitText(['rev-parse', `${additionCommit}^`])?.trim();
    const paths = gitLines(['diff', '--name-only', `${additionCommit}^`, additionCommit, '--']).sort();
    if (parent === parsed.candidateCommit && JSON.stringify(paths) === JSON.stringify(requiredPaths)) {
      attestationCommit = additionCommit;
      break;
    }
  }

  if (!attestationCommit || !isAncestor(attestationCommit, 'HEAD')) {
    fail(`${subjectId} requires a committed manifest/review attestation in current history`);
    return undefined;
  }

  const attestedManifestRaw = gitText(['show', `${attestationCommit}:${manifestPath}`]);
  const attestedReviewRaw = gitText(['show', `${attestationCommit}:${reviewPath}`]);
  if (attestedManifestRaw === null || attestedReviewRaw === null) {
    fail(`${subjectId} attestation must contain both manifest and review record`);
    return undefined;
  }
  if (manifestRaw !== attestedManifestRaw || reviewRaw !== attestedReviewRaw) {
    fail(`${subjectId} manifest and review must remain byte-identical to their attestation`);
  }

  let manifest: CandidateManifest;
  let review: ReviewRecord;
  try {
    manifest = JSON.parse(attestedManifestRaw) as CandidateManifest;
    review = JSON.parse(attestedReviewRaw) as ReviewRecord;
  } catch (error) {
    fail(`${subjectId} attestation JSON is invalid: ${(error as Error).message}`);
    return attestationCommit;
  }

  if (manifest.schemaVersion !== 1 || manifest.stageId !== subjectId) {
    fail(`${manifestPath} must identify ${subjectId} with schemaVersion 1`);
  }
  if (!isIsoTimestamp(manifest.createdAt)) fail(`${manifestPath} createdAt must be an ISO UTC timestamp`);
  if (!/^[0-9a-f]{40}$/.test(manifest.candidateCommit)) {
    fail(`${manifestPath} candidateCommit must be a full lowercase Git SHA`);
  }
  if (manifest.baselineCommit !== baselineCommit) fail(`${manifestPath} baselineCommit is not the authorized baseline`);
  if (!gitObjectExists(manifest.baselineCommit) || !gitObjectExists(manifest.candidateCommit)) {
    fail(`${manifestPath} baseline and candidate commits must exist`);
  } else if (!isAncestor(manifest.baselineCommit, manifest.candidateCommit)) {
    fail(`${manifestPath} candidate must descend from its baseline`);
  }

  const attestationParent = gitText(['rev-parse', `${attestationCommit}^`])?.trim();
  if (attestationParent !== manifest.candidateCommit) {
    fail(`${subjectId} attestation must be the direct child of its candidate`);
  }

  if (expectedMergeSecondParent) {
    const ancestry = gitLines(['rev-list', '--parents', '-n', '1', manifest.candidateCommit]);
    const parts = ancestry[0]?.split(' ') ?? [];
    if (
      parts.length !== 3 ||
      parts[1] !== baselineCommit ||
      parts[2] !== expectedMergeSecondParent
    ) {
      fail(`${subjectId} candidate must merge its delivery baseline with the exact preserved stage attestation`);
    }
  }

  const expectedChanges = completeChangeSet(
    manifest.baselineCommit,
    manifest.candidateCommit,
    new Set([manifestPath, reviewPath]),
  );
  const manifestPaths = new Set<string>();
  if (!Array.isArray(manifest.files)) fail(`${manifestPath} files must be an array`);
  for (const file of manifest.files ?? []) {
    if (manifestPaths.has(file.path)) fail(`${manifestPath} contains duplicate path ${file.path}`);
    manifestPaths.add(file.path);
    const expectedChange = expectedChanges.get(file.path);
    if (!expectedChange || expectedChange !== file.change) {
      fail(`${manifestPath} has unexpected change entry for ${file.path}`);
      continue;
    }
    const blob = gitBuffer(['show', `${manifest.candidateCommit}:${file.path}`]);
    if (file.change === 'deleted') {
      if (file.sha256 !== null || blob !== null) fail(`${manifestPath} deletion ${file.path} is invalid`);
    } else if (!blob || file.sha256 !== sha256Buffer(blob)) {
      fail(`${manifestPath} hash mismatch for ${file.path}`);
    }
  }
  for (const expectedPath of expectedChanges.keys()) {
    if (!manifestPaths.has(expectedPath)) fail(`${manifestPath} omits changed path ${expectedPath}`);
  }

  if (
    review.schemaVersion !== 1 ||
    review.stageId !== subjectId ||
    !review.reviewerTaskId?.trim() ||
    review.reviewerWasAuthorOrEditor !== false ||
    review.reviewMode !== 'fresh-context-read-only' ||
    review.outcome !== 'accepted'
  ) {
    fail(`${reviewPath} lacks a valid independent accepted review`);
  }
  if (!isIsoTimestamp(review.reviewedAt)) fail(`${reviewPath} reviewedAt must be an ISO UTC timestamp`);
  for (const severity of ['critical', 'high', 'medium', 'low'] as const) {
    if (!Number.isInteger(review.findings?.[severity]) || review.findings[severity] < 0) {
      fail(`${reviewPath} has invalid ${severity} finding count`);
    }
  }
  if (review.findings?.critical !== 0 || review.findings?.high !== 0) {
    fail(`${reviewPath} cannot retain critical/high findings`);
  }
  const expectedDispositionCount = (review.findings?.medium ?? 0) + (review.findings?.low ?? 0);
  if (!Array.isArray(review.dispositions) || review.dispositions.length !== expectedDispositionCount) {
    fail(`${reviewPath} must disposition every medium/low finding exactly once`);
  } else {
    const mediumCount = review.dispositions.filter((item) => item.severity === 'medium').length;
    const lowCount = review.dispositions.filter((item) => item.severity === 'low').length;
    if (mediumCount !== review.findings.medium || lowCount !== review.findings.low) {
      fail(`${reviewPath} disposition severities must match finding counts`);
    }
    for (const [index, disposition] of review.dispositions.entries()) {
      if (
        !['medium', 'low'].includes(disposition.severity) ||
        !disposition.summary?.trim() ||
        !disposition.rationale?.trim() ||
        !disposition.owner?.trim() ||
        !disposition.target?.trim()
      ) {
        fail(`${reviewPath} disposition ${index + 1} is incomplete`);
      }
    }
  }
  if (review.candidateManifestPath !== manifestPath || review.candidateManifestSha256 !== sha256File(manifestPath)) {
    fail(`${reviewPath} is not bound to ${manifestPath}`);
  }

  const originMain = gitText(['rev-parse', 'refs/remotes/origin/main'])?.trim();
  if (originMain && !isAncestor(attestationCommit, originMain)) {
    if (baselineCommit !== originMain) {
      fail(`${subjectId} undelivered baseline must equal current origin/main`);
    }
    const validationTip = process.env.STAGE_BRANCH_TIP_SHA?.trim() || gitText(['rev-parse', 'HEAD'])?.trim();
    if (validationTip !== attestationCommit) {
      fail(`${subjectId} undelivered branch tip must equal its attestation exactly`);
    }
  }
  return attestationCommit;
}

type AttestedPlanAmendment = {
  record: PlanAmendment;
  candidateCommit: string;
};

function findCanonicalAttestation(
  subjectId: string,
  manifestPath: string,
  reviewPath: string,
): { manifest: CandidateManifest; review: ReviewRecord } | null {
  const requiredPaths = [manifestPath, reviewPath].sort();
  for (const additionCommit of gitLines([
    'log',
    '--reverse',
    '--diff-filter=A',
    '--format=%H',
    '--',
    manifestPath,
  ])) {
    if (!isAncestor(additionCommit, 'HEAD')) continue;
    const manifestRaw = gitText(['show', `${additionCommit}:${manifestPath}`]);
    const reviewRaw = gitText(['show', `${additionCommit}:${reviewPath}`]);
    if (manifestRaw === null || reviewRaw === null) continue;
    try {
      const manifest = JSON.parse(manifestRaw) as CandidateManifest;
      const review = JSON.parse(reviewRaw) as ReviewRecord;
      const parent = gitText(['rev-parse', `${additionCommit}^`])?.trim();
      const paths = gitLines([
        'diff',
        '--name-only',
        `${additionCommit}^`,
        additionCommit,
        '--',
      ]).sort();
      if (
        manifest.stageId === subjectId &&
        review.stageId === subjectId &&
        review.outcome === 'accepted' &&
        review.reviewerWasAuthorOrEditor === false &&
        review.reviewMode === 'fresh-context-read-only' &&
        review.candidateManifestPath === manifestPath &&
        review.candidateManifestSha256 === sha256Buffer(Buffer.from(manifestRaw)) &&
        parent === manifest.candidateCommit &&
        JSON.stringify(paths) === JSON.stringify(requiredPaths) &&
        gitObjectExists(manifest.baselineCommit) &&
        gitObjectExists(manifest.candidateCommit) &&
        isAncestor(manifest.baselineCommit, manifest.candidateCommit)
      ) {
        return { manifest, review };
      }
    } catch {
      continue;
    }
  }
  return null;
}

function discoverHistoricallyAttestedPlanAmendments(): Map<string, AttestedPlanAmendment> {
  const historicalRecords = new Map<string, PlanAmendment>();
  for (const commit of gitLines(['log', '--reverse', '--format=%H', '--', 'docs/BUILD_STATE.json'])) {
    const historicalState = jsonAtCommit<BuildState>(commit, 'docs/BUILD_STATE.json');
    for (const amendment of historicalState?.governance?.planAmendments ?? []) {
      if (!historicalRecords.has(amendment.id)) {
        historicalRecords.set(
          amendment.id,
          JSON.parse(JSON.stringify(amendment)) as PlanAmendment,
        );
      }
    }
  }

  const attested = new Map<string, AttestedPlanAmendment>();
  for (const historicalRecord of historicalRecords.values()) {
    const canonical = findCanonicalAttestation(
      historicalRecord.id,
      historicalRecord.manifestPath,
      historicalRecord.reviewPath,
    );
    if (!canonical) continue;
    const candidateState = jsonAtCommit<BuildState>(
      canonical.manifest.candidateCommit,
      'docs/BUILD_STATE.json',
    );
    const candidateRecord = candidateState?.governance?.planAmendments.find(
      (item) => item.id === historicalRecord.id,
    );
    if (
      candidateRecord &&
      canonical.manifest.baselineCommit === candidateRecord.baselineCommit &&
      isDeepStrictEqual(candidateRecord, historicalRecord)
    ) {
      attested.set(historicalRecord.id, {
        record: JSON.parse(JSON.stringify(candidateRecord)) as PlanAmendment,
        candidateCommit: canonical.manifest.candidateCommit,
      });
    }
  }
  return attested;
}

const requiredFiles = [
  'AGENTS.md',
  'docs/SCHOLARSHIP_SYSTEM_BUILD_PLAN.md',
  'docs/BUILD_STATE.json',
  'docs/KICKOFF_PROMPT_TEMPLATE.md',
  'docs/CURRENT_HANDOFF.md',
  'docs/DECISIONS.md',
  'docs/evidence/P0.md',
  'docs/kickoffs/P1-BASELINE.md',
];

const content = Object.fromEntries(requiredFiles.map((file) => [file, requireFile(file)]));
const state = readJson<BuildState>('docs/BUILD_STATE.json');

if (state) {
  if (state.schemaVersion !== 2) fail(`Unsupported schemaVersion: ${state.schemaVersion}`);
  if (!Number.isInteger(state.planRevision) || state.planRevision < 1) {
    fail('planRevision must be a positive integer');
  }
  if (state.planPath !== 'docs/SCHOLARSHIP_SYSTEM_BUILD_PLAN.md') {
    fail(`Unexpected planPath: ${state.planPath}`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(state.lastUpdated)) {
    fail(`lastUpdated must be YYYY-MM-DD: ${state.lastUpdated}`);
  }
  if (state.repository.owner !== 'whitefishscholarship' || state.repository.name !== 'program_code') {
    fail('Repository identity must be whitefishscholarship/program_code');
  }
  if (state.repository.defaultBranch !== 'main') fail('Default branch must be main');
  if (!/^[0-9a-f]{40}$/.test(state.repository.baselineCommit)) {
    fail('repository.baselineCommit must be a full lowercase Git SHA');
  }
  if (state.dataAuthority.testingSpreadsheetId !== '1Dp5AMnrfSQ-Xf-r03S75lKsGPJk7o0inOgvC9Q6lOl4') {
    fail('Testing spreadsheet ID does not match the authorized test sheet');
  }
  if (state.dataAuthority.testingMasterTab !== 'Master Database') {
    fail('Testing master tab must be Master Database');
  }
  const p5 = state.stages.find((stage) => stage.id === 'P5');
  const p5MayWriteTestingSheet = p5 && (inFlightStatuses.has(p5.status) || p5.status === 'accepted');
  if (p5MayWriteTestingSheet) {
    const authorization = state.dataAuthority.testingWriteAuthorization;
    if (!authorization?.authorized) {
      fail('P5 requires explicit structured testing-sheet write authorization');
    } else {
      if (!authorization.authorizationId.trim() || !authorization.authorizedBy.trim()) {
        fail('P5 testing-sheet authorization requires an ID and authorizer');
      }
      if (!isIsoTimestamp(authorization.authorizedAt)) {
        fail('P5 testing-sheet authorization requires an ISO UTC timestamp');
      }
      if (authorization.spreadsheetId !== state.dataAuthority.testingSpreadsheetId) {
        fail('P5 testing-sheet authorization must bind the configured testing spreadsheet ID');
      }
      if (authorization.sheetName !== state.dataAuthority.testingMasterTab) {
        fail('P5 testing-sheet authorization must bind the configured testing master tab');
      }
      if (!authorization.revisionFingerprintRequired || !authorization.reversibleBackupRequired) {
        fail('P5 testing-sheet authorization must require revision fingerprinting and reversible backup');
      }
      if (!authorization.basis.trim() || !authorization.scope.trim()) {
        fail('P5 testing-sheet authorization requires a nonempty basis and scope');
      }
      requireFile(authorization.evidencePath);
    }
  }
  if (!state.deployment || state.deployment.mainAutoDeploysProduction !== true) {
    fail('BUILD_STATE must acknowledge that main auto-deploys production');
  }

  const ids = state.stages.map((stage) => stage.id);
  if (JSON.stringify(ids) !== JSON.stringify(expectedStageIds)) {
    fail(`Stage IDs/order must be ${expectedStageIds.join(', ')}`);
  }
  if (new Set(ids).size !== ids.length) fail('Stage IDs must be unique');

  for (const stage of state.stages) {
    if (!stage.name.trim()) fail(`${stage.id} has an empty name`);
    if (!allowedStatuses.has(stage.status)) fail(`${stage.id} has invalid status ${stage.status}`);
    if (stage.status === 'superseded') {
      fail(`${stage.id} cannot be superseded under plan revision ${state.planRevision}; an independently reviewed plan amendment and validator revision are required`);
    }
    if (stage.status !== 'planned' && !/^[0-9a-f]{40}$/.test(stage.baselineCommit ?? '')) {
      fail(`${stage.id} requires a full lowercase baselineCommit while not planned`);
    }
    if (stage.status === 'planned' && stage.baselineCommit !== null) {
      fail(`${stage.id} baselineCommit must remain null while planned`);
    }
    if (stage.evidencePath !== `docs/evidence/${stage.id}.md`) {
      fail(`${stage.id} has unexpected evidencePath ${stage.evidencePath}`);
    }
    if (stage.manifestPath !== `docs/evidence/${stage.id}-manifest.json`) {
      fail(`${stage.id} has unexpected manifestPath ${stage.manifestPath}`);
    }
    if (stage.reviewPath !== `docs/reviews/${stage.id}.json`) {
      fail(`${stage.id} has unexpected reviewPath ${stage.reviewPath}`);
    }
    if (inFlightStatuses.has(stage.status) || stage.status === 'accepted') {
      requireFile(stage.evidencePath);
    }
  }

  let prefixLength = 0;
  while (prefixLength < state.stages.length && closedStatuses.has(state.stages[prefixLength].status)) {
    prefixLength += 1;
  }
  const remaining = state.stages.slice(prefixLength);
  const inFlight = remaining.filter((stage) => inFlightStatuses.has(stage.status));
  if (inFlight.length > 1) fail('At most one stage may be in flight');
  if (inFlight.length === 1 && remaining[0]?.id !== inFlight[0].id) {
    fail('The in-flight stage must immediately follow the accepted prefix');
  }
  const tailStart = inFlight.length === 1 ? 1 : 0;
  for (const stage of remaining.slice(tailStart)) {
    if (stage.status !== 'planned') {
      fail(`${stage.id} must be planned; accepted stages must form a contiguous prefix`);
    }
  }

  const expectedActiveStageId = inFlight.length === 1 ? inFlight[0].id : null;
  if (state.activeStageId !== expectedActiveStageId) {
    fail(`activeStageId must be ${expectedActiveStageId ?? 'null'} for the current stage history`);
  }
  const firstPlanned = state.stages.find((stage) => stage.status === 'planned')?.id ?? null;
  const expectedNext = expectedActiveStageId === null ? firstPlanned : null;
  if (state.nextPermittedStageId !== expectedNext) {
    fail(`nextPermittedStageId must be ${expectedNext ?? 'null'} for the current stage history`);
  }

  let maximumHistoricalAcceptedPrefix = 0;
  for (const commit of gitLines(['log', '--format=%H', '--', 'docs/BUILD_STATE.json'])) {
    const historicalState = jsonAtCommit<BuildState>(commit, 'docs/BUILD_STATE.json');
    if (historicalState?.stages) {
      maximumHistoricalAcceptedPrefix = Math.max(
        maximumHistoricalAcceptedPrefix,
        acceptedPrefixLength(historicalState),
      );
    }
  }
  if (acceptedPrefixLength(state) < maximumHistoricalAcceptedPrefix) {
    fail(`Accepted stage history cannot regress below P${maximumHistoricalAcceptedPrefix - 1}`);
  }

  const planAmendments = state.governance?.planAmendments ?? [];
  const historicallyAttestedPlanAmendments = discoverHistoricallyAttestedPlanAmendments();
  const canonicalPlanAmendmentRecords = [...historicallyAttestedPlanAmendments.values()].map(
    (item) => item.record,
  );
  const maximumHistoricalPlanRevision = maximumAttestedPlanRevision(
    canonicalPlanAmendmentRecords,
  );
  if (state.planRevision < maximumHistoricalPlanRevision) {
    fail(
      `Plan revision cannot regress below historically attested revision ${maximumHistoricalPlanRevision}`,
    );
  }
  const changedPlanAmendment = changedAttestedPlanAmendment(
    planAmendments,
    canonicalPlanAmendmentRecords,
  );
  if (changedPlanAmendment) {
    fail(
      `${changedPlanAmendment} historically attested amendment cannot be removed, downgraded, or changed`,
    );
  }
  if (state.planRevision >= 2 && planAmendments.length === 0) {
    fail('Plan revision 2+ requires a hash-bound plan amendment record');
  }
  if (new Set(planAmendments.map((item) => item.id)).size !== planAmendments.length) {
    fail('Plan amendment records must have unique IDs');
  }
  if (state.planRevision >= 2 && !planAmendments.some((item) => item.id === `PLAN-REV${state.planRevision}`)) {
    fail(`Plan revision ${state.planRevision} requires its matching PLAN-REV${state.planRevision} record`);
  }
  for (const amendment of planAmendments) {
    const amendmentRevision = Number(/^PLAN-REV(\d+)$/.exec(amendment.id)?.[1] ?? 0);
    const expectedAmendmentStatus = amendmentRevision >= 3 ? 'attestation-gated' : 'accepted';
    if (
      !amendment.id.trim() ||
      amendment.status !== expectedAmendmentStatus ||
      !/^[0-9a-f]{40}$/.test(amendment.baselineCommit) ||
      !amendment.evidencePath.trim() ||
      !amendment.manifestPath.trim() ||
      !amendment.reviewPath.trim()
    ) {
      fail('Plan amendment records require an ID, accepted status, baseline, evidence, manifest, and review paths');
      continue;
    }
    requireFile(amendment.evidencePath);
    if (amendmentRevision >= 3) {
      const authorization = amendment.deliveryAuthorization;
      if (
        authorization?.authorized !== true ||
        !authorization.authorizedBy?.trim() ||
        !/^\d{4}-\d{2}-\d{2}$/.test(authorization.authorizedAt ?? '') ||
        authorization.evidencePath !== amendment.evidencePath ||
        !authorization.basis.trim() ||
        !authorization.scope.trim()
      ) {
        fail(`${amendment.id} requires direct informed delivery authority bound to its evidence`);
      }
    }
    validateBoundAttestation(
      amendment.id,
      amendment.baselineCommit,
      amendment.manifestPath,
      amendment.reviewPath,
    );
  }

  const deliveryAttestationTips = new Map<string, string>();
  const deliveryIntegrations = state.deployment.deliveryIntegrations ?? [];
  const historicallyAcceptedIntegrations = new Map<string, DeliveryIntegration>();
  for (const commit of gitLines(['log', '--reverse', '--format=%H', '--', 'docs/BUILD_STATE.json'])) {
    const historicalState = jsonAtCommit<BuildState>(commit, 'docs/BUILD_STATE.json');
    for (const historicalIntegration of historicalState?.deployment.deliveryIntegrations ?? []) {
      if (historicalIntegration.status !== 'accepted') continue;
      const canonicalIntegration = historicallyAcceptedIntegrations.get(historicalIntegration.stageId);
      if (!canonicalIntegration) {
        historicallyAcceptedIntegrations.set(
          historicalIntegration.stageId,
          JSON.parse(JSON.stringify(historicalIntegration)) as DeliveryIntegration,
        );
      } else if (!isDeepStrictEqual(canonicalIntegration, historicalIntegration)) {
        fail(`${historicalIntegration.stageId} accepted delivery integration changed in Git history`);
      }
    }
  }
  const regressedIntegration = changedAcceptedIntegration(
    deliveryIntegrations,
    [...historicallyAcceptedIntegrations.values()],
  );
  if (regressedIntegration) {
    fail(`${regressedIntegration} accepted delivery integration cannot be removed, downgraded, or rebound`);
  }
  for (const integration of deliveryIntegrations) {
    if (
      !expectedStageIds.includes(integration.stageId) ||
      !['authorized-pending', 'accepted'].includes(integration.status) ||
      !/^[0-9a-f]{40}$/.test(integration.stageCandidateCommit) ||
      !/^[0-9a-f]{40}$/.test(integration.stageAttestationCommit) ||
      !/^[0-9a-f]{40}$/.test(integration.originalBaselineCommit) ||
      !integration.evidencePath.trim() ||
      !integration.manifestPath.trim() ||
      !integration.reviewPath.trim() ||
      !Array.isArray(integration.governanceResolutionPaths)
    ) {
      fail('Delivery integration records require exact stage commits and evidence paths');
      continue;
    }
    requireFile(integration.evidencePath);
    const requiredGovernancePaths =
      integration.stageId === 'P2' && state.planRevision >= 6
        ? ['docs/BUILD_STATE.json', 'docs/CURRENT_HANDOFF.md', 'web/package.json']
        : ['docs/BUILD_STATE.json', 'docs/CURRENT_HANDOFF.md'];
    if (
      JSON.stringify([...integration.governanceResolutionPaths].sort()) !==
      JSON.stringify(requiredGovernancePaths.sort())
    ) {
      fail(`${integration.stageId} delivery integration has an invalid governance resolution allowlist`);
    }
    if (integration.status === 'authorized-pending') {
      if (integration.deliveryBaselineCommit !== null) {
        fail(`${integration.stageId} pending delivery integration must not pre-bind an unknown delivery baseline`);
      }
      if (
        gitObjectExists(integration.stageCandidateCommit) &&
        gitObjectExists(integration.stageAttestationCommit)
      ) {
        const attestationParent = gitText(['rev-parse', `${integration.stageAttestationCommit}^`])?.trim();
        if (attestationParent !== integration.stageCandidateCommit) {
          fail(`${integration.stageId} preserved attestation is not the direct child of its recorded candidate`);
        }
      }
    } else {
      if (
        !gitObjectExists(integration.stageCandidateCommit) ||
        !gitObjectExists(integration.stageAttestationCommit)
      ) {
        fail(`${integration.stageId} accepted delivery integration requires the preserved Git objects`);
      }
      const attestationParent = gitText(['rev-parse', `${integration.stageAttestationCommit}^`])?.trim();
      if (attestationParent !== integration.stageCandidateCommit) {
        fail(`${integration.stageId} preserved attestation is not the direct child of its recorded candidate`);
      }
      if (!/^[0-9a-f]{40}$/.test(integration.deliveryBaselineCommit ?? '')) {
        fail(`${integration.stageId} accepted delivery integration requires its exact delivery baseline`);
      } else {
        const deliveryManifest = readJson<CandidateManifest>(integration.manifestPath);
        const baselineState = jsonAtCommit<BuildState>(
          integration.deliveryBaselineCommit!,
          'docs/BUILD_STATE.json',
        );
        const stageCandidateState = jsonAtCommit<BuildState>(
          integration.stageCandidateCommit,
          'docs/BUILD_STATE.json',
        );
        const baselineIntegration = baselineState?.deployment.deliveryIntegrations?.find(
          (item) => item.stageId === integration.stageId,
        );
        if (!baselineState || !stageCandidateState || !baselineIntegration) {
          fail(`${integration.stageId} delivery baseline lacks the authorized pending integration state`);
        } else {
          const immutableIntegrationFields = [
            'stageId',
            'stageCandidateCommit',
            'stageAttestationCommit',
            'originalBaselineCommit',
            'evidencePath',
            'manifestPath',
            'reviewPath',
            'governanceResolutionPaths',
          ] as const;
          for (const field of immutableIntegrationFields) {
            if (!isDeepStrictEqual(integration[field], baselineIntegration[field])) {
              fail(`${integration.stageId} delivery integration rebinds immutable field ${field}`);
            }
          }
          if (baselineIntegration.status !== 'authorized-pending' || baselineIntegration.deliveryBaselineCommit !== null) {
            fail(`${integration.stageId} delivery baseline must contain the original pending integration`);
          }
          const baselineAuthorization = baselineState.deployment.stageMergeAuthorizations.find(
            (item) => item.stageId === integration.stageId,
          );
          const currentAuthorization = state.deployment.stageMergeAuthorizations.find(
            (item) => item.stageId === integration.stageId,
          );
          if (!isDeepStrictEqual(currentAuthorization, baselineAuthorization)) {
            fail(`${integration.stageId} delivery integration changes its informed authority record`);
          }

          const deliveredCandidateState = deliveryManifest
            ? jsonAtCommit<BuildState>(deliveryManifest.candidateCommit, 'docs/BUILD_STATE.json')
            : null;
          if (!deliveredCandidateState) {
            fail(`${integration.stageId} delivery manifest candidate lacks BUILD_STATE`);
          } else if (!isExactHistoricalDeliveryState(
            deliveredCandidateState,
            baselineState,
            stageCandidateState,
            integration.stageId,
            integration.deliveryBaselineCommit!,
          )) {
            fail(`${integration.stageId} delivery BUILD_STATE contains changes outside the exact stage-state transition`);
          }
          if (
            integration.stageId === 'P2' &&
            integration.governanceResolutionPaths.includes('web/package.json') &&
            deliveryManifest
          ) {
            const deliveredPackage = jsonAtCommit<PackageDocument>(
              deliveryManifest.candidateCommit,
              'web/package.json',
            );
            const baselinePackage = jsonAtCommit<PackageDocument>(
              integration.deliveryBaselineCommit!,
              'web/package.json',
            );
            const p2Package = jsonAtCommit<PackageDocument>(
              integration.stageAttestationCommit,
              'web/package.json',
            );
            if (
              !deliveredPackage ||
              !baselinePackage ||
              !p2Package ||
              !isExactP2IntegratedPackage(deliveredPackage, baselinePackage, p2Package)
            ) {
              fail(
                'P2 delivery package resolution must preserve the exact baseline harness and exact P2 model scripts',
              );
            }
          }
        }

        const deliveryTip = validateBoundAttestation(
          `${integration.stageId}-DELIVERY`,
          integration.deliveryBaselineCommit!,
          integration.manifestPath,
          integration.reviewPath,
          integration.stageAttestationCommit,
        );
        if (deliveryTip) deliveryAttestationTips.set(integration.stageId, deliveryTip);

        const stage = state.stages.find((item) => item.id === integration.stageId);
        const stageManifestRaw = stage
          ? gitText(['show', `${integration.stageAttestationCommit}:${stage.manifestPath}`])
          : null;
        let stageManifest: CandidateManifest | null = null;
        try {
          stageManifest = stageManifestRaw ? (JSON.parse(stageManifestRaw) as CandidateManifest) : null;
        } catch (error) {
          fail(`${integration.stageId} preserved stage manifest is invalid: ${(error as Error).message}`);
        }
        if (stage && stageManifest && deliveryManifest) {
          const preservedPaths = new Set([
            ...stageManifest.files.map((file) => file.path),
            stage.manifestPath,
            stage.reviewPath,
          ]);
          const deliveryChanges = completeChangeSet(
            integration.deliveryBaselineCommit!,
            deliveryManifest.candidateCommit,
            new Set([integration.manifestPath, integration.reviewPath]),
          );
          for (const [changedPath, change] of deliveryChanges) {
            if (integration.governanceResolutionPaths.includes(changedPath)) continue;
            if (!preservedPaths.has(changedPath)) {
              fail(`${integration.stageId} delivery integration changes unauthorized path ${changedPath}`);
              continue;
            }
            const integratedBlob = gitBuffer(['show', `${deliveryManifest.candidateCommit}:${changedPath}`]);
            const preservedBlob = gitBuffer(['show', `${integration.stageAttestationCommit}:${changedPath}`]);
            if (
              change === 'deleted' ||
              integratedBlob === null ||
              preservedBlob === null ||
              !integratedBlob.equals(preservedBlob)
            ) {
              fail(`${integration.stageId} delivery integration does not preserve exact blob ${changedPath}`);
            }
          }
          for (const preservedPath of preservedPaths) {
            if (integration.governanceResolutionPaths.includes(preservedPath)) continue;
            const baselineBlob = gitBuffer(['show', `${integration.deliveryBaselineCommit}:${preservedPath}`]);
            const preservedBlob = gitBuffer(['show', `${integration.stageAttestationCommit}:${preservedPath}`]);
            if (preservedBlob && (!baselineBlob || !baselineBlob.equals(preservedBlob)) && !deliveryChanges.has(preservedPath)) {
              fail(`${integration.stageId} delivery integration omits preserved path ${preservedPath}`);
            }
          }
        }
      }
    }
  }

  const acceptedStages = state.stages.filter((stage) => stage.status === 'accepted');
  for (const stage of acceptedStages) {
    const currentManifestRaw = requireFile(stage.manifestPath);
    const requiredAttestationPaths = [stage.manifestPath, stage.reviewPath].sort();
    let attestationCommit: string | undefined;
    for (const additionCommit of gitLines([
      'log',
      '--reverse',
      '--diff-filter=A',
      '--format=%H',
      '--',
      stage.manifestPath,
    ])) {
      const possibleManifestRaw = gitText(['show', `${additionCommit}:${stage.manifestPath}`]);
      const possibleReviewRaw = gitText(['show', `${additionCommit}:${stage.reviewPath}`]);
      if (possibleManifestRaw === null || possibleReviewRaw === null) continue;
      let possibleManifest: CandidateManifest;
      try {
        possibleManifest = JSON.parse(possibleManifestRaw) as CandidateManifest;
      } catch {
        continue;
      }
      const possibleParent = gitText(['rev-parse', `${additionCommit}^`])?.trim();
      const possiblePaths = gitLines([
        'diff',
        '--name-only',
        `${additionCommit}^`,
        additionCommit,
        '--',
      ]).sort();
      if (
        possibleParent === possibleManifest.candidateCommit &&
        JSON.stringify(possiblePaths) === JSON.stringify(requiredAttestationPaths)
      ) {
        attestationCommit = additionCommit;
        break;
      }
    }
    let manifest: CandidateManifest | null = null;
    let review: ReviewRecord | null = null;
    let attestationParent: string | null = null;
    if (!attestationCommit || !isAncestor(attestationCommit, 'HEAD')) {
      fail(`${stage.id} requires a committed manifest/review attestation in current history`);
    } else {
      const manifestRaw = gitText(['show', `${attestationCommit}:${stage.manifestPath}`]);
      const reviewRaw = gitText(['show', `${attestationCommit}:${stage.reviewPath}`]);
      if (manifestRaw === null || reviewRaw === null) {
        fail(`${stage.id} attestation commit must contain both manifest and review record`);
      } else {
        try {
          manifest = JSON.parse(manifestRaw) as CandidateManifest;
        } catch (error) {
          fail(`${stage.manifestPath} in attestation is invalid JSON: ${(error as Error).message}`);
        }
        try {
          review = JSON.parse(reviewRaw) as ReviewRecord;
        } catch (error) {
          fail(`${stage.reviewPath} in attestation is invalid JSON: ${(error as Error).message}`);
        }
        const currentManifest = currentManifestRaw;
        const currentReview = requireFile(stage.reviewPath);
        if (currentManifest && currentManifest !== manifestRaw) {
          fail(`${stage.manifestPath} must remain byte-identical to its attestation commit`);
        }
        if (currentReview && currentReview !== reviewRaw) {
          fail(`${stage.reviewPath} must remain byte-identical to its attestation commit`);
        }
      }

      attestationParent = gitText(['rev-parse', `${attestationCommit}^`])?.trim() ?? null;
      const attestationPaths = gitLines([
        'diff',
        '--name-only',
        `${attestationCommit}^`,
        attestationCommit,
        '--',
      ]).sort();
      if (JSON.stringify(attestationPaths) !== JSON.stringify(requiredAttestationPaths)) {
        fail(`${stage.id} attestation commit may change only its manifest and review record`);
      }
    }
    if (!manifest) continue;

    if (manifest.schemaVersion !== 1 || manifest.stageId !== stage.id) {
      fail(`${stage.manifestPath} does not identify ${stage.id} with schemaVersion 1`);
    }
    if (!isIsoTimestamp(manifest.createdAt)) fail(`${stage.manifestPath} createdAt must be an ISO UTC timestamp`);
    if (!/^[0-9a-f]{40}$/.test(manifest.baselineCommit)) {
      fail(`${stage.manifestPath} baselineCommit must be a full lowercase Git SHA`);
    }
    if (!/^[0-9a-f]{40}$/.test(manifest.candidateCommit)) {
      fail(`${stage.manifestPath} candidateCommit must be a full lowercase Git SHA`);
    }
    if (attestationParent !== manifest.candidateCommit) {
      fail(`${stage.id} attestation commit must be the direct child of candidateCommit`);
    }
    if (manifest.baselineCommit !== stage.baselineCommit) {
      fail(`${stage.manifestPath} baselineCommit does not match ${stage.id} BUILD_STATE baseline`);
    }
    if (!gitObjectExists(manifest.baselineCommit) || !gitObjectExists(manifest.candidateCommit)) {
      fail(`${stage.manifestPath} baselineCommit and candidateCommit must both exist locally`);
    } else {
      if (!isAncestor(manifest.baselineCommit, manifest.candidateCommit)) {
        fail(`${stage.manifestPath} candidateCommit must descend from baselineCommit`);
      }
      if (!isAncestor(manifest.candidateCommit, 'HEAD')) {
        fail(`${stage.manifestPath} candidateCommit must be an ancestor of HEAD`);
      }
      const deliveryIntegration = deliveryIntegrations.find(
        (item) =>
          item.stageId === stage.id &&
          item.status === 'accepted' &&
          item.stageCandidateCommit === manifest.candidateCommit &&
          item.stageAttestationCommit === attestationCommit &&
          item.originalBaselineCommit === manifest.baselineCommit,
      );
      const originMain = gitText(['rev-parse', 'refs/remotes/origin/main'])?.trim();
      if (
        originMain &&
        /^[0-9a-f]{40}$/.test(originMain) &&
        !isAncestor(manifest.candidateCommit, originMain) &&
        manifest.baselineCommit !== originMain &&
        !deliveryIntegration
      ) {
        fail(`${stage.manifestPath} baselineCommit must equal current origin/main before delivery`);
      }
      if (originMain && !isAncestor(attestationCommit ?? '', originMain)) {
        const validationTip = process.env.STAGE_BRANCH_TIP_SHA?.trim() || gitText(['rev-parse', 'HEAD'])?.trim();
        const deliveryTip = deliveryAttestationTips.get(stage.id);
        if (validationTip !== attestationCommit && validationTip !== deliveryTip) {
          fail(`${stage.id} undelivered branch tip must equal its attestation commit exactly`);
        }
      }
    }

    const candidateState = jsonAtCommit<BuildState>(manifest.candidateCommit, 'docs/BUILD_STATE.json');
    const stageIndex = expectedStageIds.indexOf(stage.id);
    if (!candidateState?.stages || candidateState.stages[stageIndex]?.id !== stage.id) {
      fail(`${stage.manifestPath} candidateCommit lacks a valid BUILD_STATE entry for ${stage.id}`);
    } else {
      const candidateStage = candidateState.stages[stageIndex];
      if (candidateStage.status !== 'accepted') {
        fail(`${stage.id} must be accepted in its candidateCommit BUILD_STATE`);
      }
      if (candidateStage.baselineCommit !== manifest.baselineCommit) {
        fail(`${stage.manifestPath} baselineCommit does not match the candidateCommit BUILD_STATE`);
      }
      for (let i = 0; i < stageIndex; i += 1) {
        if (candidateState.stages[i]?.status !== 'accepted') {
          fail(`${stage.id} candidateCommit requires ${expectedStageIds[i]} accepted`);
        }
      }
      for (let i = stageIndex + 1; i < expectedStageIds.length; i += 1) {
        if (candidateState.stages[i]?.status !== 'planned') {
          fail(`${stage.id} candidateCommit requires later stage ${expectedStageIds[i]} planned`);
        }
      }

      if (stageIndex === 0) {
        if (manifest.baselineCommit !== candidateState.repository.baselineCommit) {
          fail('P0 manifest baseline must equal the repository bootstrap baseline');
        }
      } else {
        const baselineState = jsonAtCommit<BuildState>(manifest.baselineCommit, 'docs/BUILD_STATE.json');
        if (!baselineState?.stages) {
          fail(`${stage.id} baselineCommit must contain the prior accepted BUILD_STATE`);
        } else {
          if (baselineState.nextPermittedStageId !== stage.id || baselineState.activeStageId !== null) {
            fail(`${stage.id} baselineCommit must identify ${stage.id} as the next permitted stage`);
          }
          if (baselineState.stages[stageIndex]?.status !== 'planned') {
            fail(`${stage.id} must be planned at its baselineCommit`);
          }
          for (let i = 0; i < stageIndex; i += 1) {
            if (baselineState.stages[i]?.status !== 'accepted') {
              fail(`${stage.id} baselineCommit requires ${expectedStageIds[i]} accepted`);
            }
          }
        }
      }
    }

    if (!Array.isArray(manifest.files) || manifest.files.length === 0) {
      fail(`${stage.manifestPath} must list at least one candidate file`);
    } else {
      const manifestPaths = manifest.files.map((entry) => entry.path);
      if (new Set(manifestPaths).size !== manifestPaths.length) {
        fail(`${stage.manifestPath} contains duplicate file paths`);
      }
      for (const entry of manifest.files) {
        if (!['present', 'deleted'].includes(entry.change)) {
          fail(`${stage.manifestPath} has invalid change state for ${entry.path}`);
          continue;
        }
        try {
          absolute(entry.path);
        } catch (error) {
          fail((error as Error).message);
          continue;
        }
        const candidateBlob = gitBuffer(['show', `${manifest.candidateCommit}:${entry.path}`]);
        if (entry.change === 'deleted') {
          if (entry.sha256 !== null) fail(`${stage.manifestPath} deleted entry ${entry.path} must have null sha256`);
          if (candidateBlob !== null) fail(`${stage.manifestPath} marks candidate file ${entry.path} as deleted`);
        } else {
          if (!/^[0-9a-f]{64}$/.test(entry.sha256 ?? '')) {
            fail(`${stage.manifestPath} has an invalid SHA-256 for ${entry.path}`);
          } else if (candidateBlob === null) {
            fail(`Missing required candidate file at ${manifest.candidateCommit}: ${entry.path}`);
          } else if (sha256Buffer(candidateBlob) !== entry.sha256) {
            fail(`${stage.manifestPath} digest mismatch for ${entry.path}`);
          }
        }
      }
      if (stage.baselineCommit && manifest.candidateCommit) {
        const excluded = new Set([stage.manifestPath, stage.reviewPath]);
        const expectedChanges = completeChangeSet(
          stage.baselineCommit,
          manifest.candidateCommit,
          excluded,
        );
        const expectedPaths = [...expectedChanges.keys()].sort();
        const actualPaths = [...manifestPaths].sort();
        if (JSON.stringify(actualPaths) !== JSON.stringify(expectedPaths)) {
          fail(`${stage.manifestPath} does not cover the complete Git change set from ${stage.baselineCommit}`);
        }
        for (const entry of manifest.files) {
          const expectedChange = expectedChanges.get(entry.path);
          if (expectedChange && expectedChange !== entry.change) {
            fail(`${stage.manifestPath} change state mismatch for ${entry.path}`);
          }
        }
      }
    }

    if (!review) continue;

    if (review.schemaVersion !== 1 || review.stageId !== stage.id) {
      fail(`${stage.reviewPath} does not identify ${stage.id} with schemaVersion 1`);
    }
    if (!review.reviewerTaskId.trim()) fail(`${stage.reviewPath} requires reviewerTaskId`);
    if (review.reviewerWasAuthorOrEditor !== false) {
      fail(`${stage.reviewPath} reviewer must declare no authorship or editing`);
    }
    if (review.reviewMode !== 'fresh-context-read-only') {
      fail(`${stage.reviewPath} reviewMode must be fresh-context-read-only`);
    }
    if (!isIsoTimestamp(review.reviewedAt)) fail(`${stage.reviewPath} reviewedAt must be an ISO UTC timestamp`);
    if (review.outcome !== 'accepted') fail(`${stage.reviewPath} outcome must be accepted`);
    if (review.findings.critical !== 0 || review.findings.high !== 0) {
      fail(`${stage.reviewPath} cannot retain critical/high findings`);
    }
    for (const severity of ['critical', 'high', 'medium', 'low'] as const) {
      if (!Number.isInteger(review.findings[severity]) || review.findings[severity] < 0) {
        fail(`${stage.reviewPath} has invalid ${severity} finding count`);
      }
    }
    const expectedDispositionCount = review.findings.medium + review.findings.low;
    if (!Array.isArray(review.dispositions) || review.dispositions.length !== expectedDispositionCount) {
      fail(`${stage.reviewPath} must disposition every medium/low finding exactly once`);
    } else {
      const mediumDispositions = review.dispositions.filter((item) => item.severity === 'medium').length;
      const lowDispositions = review.dispositions.filter((item) => item.severity === 'low').length;
      if (mediumDispositions !== review.findings.medium || lowDispositions !== review.findings.low) {
        fail(`${stage.reviewPath} disposition severities must match medium/low finding counts`);
      }
      for (const [index, disposition] of review.dispositions.entries()) {
        if (
          !['medium', 'low'].includes(disposition.severity) ||
          !disposition.summary.trim() ||
          !disposition.rationale.trim() ||
          !disposition.owner.trim() ||
          !disposition.target.trim()
        ) {
          fail(`${stage.reviewPath} disposition ${index + 1} requires severity, summary, rationale, owner, and target`);
        }
      }
    }
    if (review.candidateManifestPath !== stage.manifestPath) {
      fail(`${stage.reviewPath} candidateManifestPath does not match ${stage.manifestPath}`);
    }
    if (review.candidateManifestSha256 !== sha256File(stage.manifestPath)) {
      fail(`${stage.reviewPath} candidate manifest digest does not match`);
    }
  }

  const authorizationStageIds = state.deployment.stageMergeAuthorizations.map((item) => item.stageId);
  if (new Set(authorizationStageIds).size !== authorizationStageIds.length) {
    fail('Deployment authorizations must have unique stage IDs');
  }
  for (const authorization of state.deployment.stageMergeAuthorizations) {
    if (!expectedStageIds.includes(authorization.stageId)) {
      fail(`Deployment authorization has unknown stageId ${authorization.stageId}`);
    }
    if (!authorization.basis.trim() || !authorization.scope.trim()) {
      fail(`${authorization.stageId} deployment authorization requires basis and scope`);
    }
    if (authorization.authorized) {
      if (
        !authorization.authorizedBy?.trim() ||
        !/^\d{4}-\d{2}-\d{2}$/.test(authorization.authorizedAt ?? '') ||
        !authorization.evidencePath
      ) {
        fail(`${authorization.stageId} authorized deployment requires authorizer, date, and direct evidence path`);
      } else {
        requireFile(authorization.evidencePath);
      }
    } else {
      if (authorization.authorizedBy !== null || authorization.authorizedAt !== null || authorization.evidencePath !== null) {
        fail(`${authorization.stageId} unauthorized deployment must not claim authority evidence`);
      }
      if (!state.deployment.deliveryBlockers.some((blocker) => blocker.startsWith(`${authorization.stageId}-`))) {
        fail(`${authorization.stageId} unauthorized deployment requires an explicit delivery blocker`);
      }
    }
  }
  if (state.planRevision >= 5) {
    const standingMandateEvidencePath = 'docs/evidence/STANDING-OPERATING-MANDATE.md';
    for (const stageId of ['P3', 'P4', 'P5', 'P6', 'P7', 'P8']) {
      const authorization = state.deployment.stageMergeAuthorizations.find(
        (item) => item.stageId === stageId,
      );
      if (
        authorization?.authorized !== true ||
        authorization.evidencePath !== standingMandateEvidencePath
      ) {
        fail(`${stageId} must retain its Plan Revision 5 standing delivery authorization`);
      }
    }
  }
  const attestedRevision5 = historicallyAttestedPlanAmendments.get('PLAN-REV5');
  if (attestedRevision5) {
    const revision5CandidateState = jsonAtCommit<BuildState>(
      attestedRevision5.candidateCommit,
      'docs/BUILD_STATE.json',
    );
    const revision5StageIds = ['P3', 'P4', 'P5', 'P6', 'P7', 'P8'];
    const changedStandingStage = revision5CandidateState
      ? changedStandingAuthorization(
          state.deployment.stageMergeAuthorizations,
          revision5CandidateState.deployment.stageMergeAuthorizations,
          revision5StageIds,
        )
      : revision5StageIds[0];
    if (changedStandingStage) {
      fail(
        `${changedStandingStage} Plan Revision 5 standing authorization cannot be deleted, disabled, or changed`,
      );
    }

    const standingMandateEvidencePath = 'docs/evidence/STANDING-OPERATING-MANDATE.md';
    const canonicalStandingMandate = gitText([
      'show',
      `${attestedRevision5.candidateCommit}:${standingMandateEvidencePath}`,
    ]);
    const currentStandingMandate = requireFile(standingMandateEvidencePath);
    if (
      canonicalStandingMandate === null ||
      currentStandingMandate !== canonicalStandingMandate
    ) {
      fail(
        'Plan Revision 5 standing mandate evidence must remain byte-identical to its immutable candidate',
      );
    }
  }
  const integrationStageIds = deliveryIntegrations.map((item) => item.stageId);
  if (new Set(integrationStageIds).size !== integrationStageIds.length) {
    fail('Delivery integrations must have unique stage IDs');
  }
  for (const integration of deliveryIntegrations) {
    const authorization = state.deployment.stageMergeAuthorizations.find(
      (item) => item.stageId === integration.stageId,
    );
    const stage = state.stages.find((item) => item.id === integration.stageId);
    if (!authorization?.authorized) {
      fail(`${integration.stageId} delivery integration requires current informed delivery authority`);
    }
    if (integration.status === 'accepted' && stage?.status !== 'accepted') {
      fail(`${integration.stageId} accepted delivery integration requires the stage accepted in BUILD_STATE`);
    }
  }

  const p9 = state.stages.find((stage) => stage.id === 'P9');
  const p9MayUseProduction = p9 && (inFlightStatuses.has(p9.status) || p9.status === 'accepted');
  if (p9MayUseProduction) {
    for (const prerequisite of state.stages.slice(0, 9)) {
      if (prerequisite.status !== 'accepted') {
        fail(`P9 requires ${prerequisite.id} to be accepted, not ${prerequisite.status}`);
      }
    }
  }
  if (state.planRevision >= 7) {
    const expectedEntryProofState = Boolean(p9MayUseProduction);
    const expectedPostCutoverProofState =
      p9?.status === 'verified' || p9?.status === 'accepted';
    for (const error of validateP9ReadOnlyAuthority(state.dataAuthority, {
      expectedEntryProofState,
      expectedPostCutoverProofState,
    })) {
      fail(error);
    }
    if (state.dataAuthority.productionAuthorization) {
      let entryReceiptForBinding: P9EntryReceipt | null = null;
      requireFile(state.dataAuthority.productionAuthorization.evidencePath);
      if (expectedEntryProofState) {
        const entryReceipt = readJson<P9EntryReceipt>(P9_ENTRY_EVIDENCE_PATH);
        if (!entryReceipt) {
          fail('P9 active state requires a valid structured entry receipt');
        } else {
          for (const error of validateP9EntryReceipt(entryReceipt)) fail(error);
          entryReceiptForBinding = entryReceipt;
        }
      }
      if (expectedPostCutoverProofState) {
        const postCutoverReceipt = readJson<P9PostCutoverReceipt>(
          P9_POST_CUTOVER_EVIDENCE_PATH,
        );
        const deploymentRecord = readJson<P9DeploymentRecord>(
          P9_DEPLOYMENT_EVIDENCE_PATH,
        );
        if (!postCutoverReceipt) {
          fail('P9 verified/accepted state requires a valid structured post-cutover receipt');
        } else {
          for (const error of validateP9PostCutoverReceipt(postCutoverReceipt)) {
            fail(error);
          }
          if (!deploymentRecord || !entryReceiptForBinding) {
            fail('P9 verified/accepted state requires a valid structured deployment record');
          } else {
            for (const error of validateP9DeploymentRecord(
              deploymentRecord,
              postCutoverReceipt,
              entryReceiptForBinding,
            )) {
              fail(error);
            }
          }

          const candidateCommit = gitText(['rev-parse', 'HEAD'])?.trim() ?? '';
          const rollbackBaseline = p9?.baselineCommit ?? '';
          for (const error of validateP9DeploymentGitBinding(
            postCutoverReceipt,
            rollbackBaseline,
            candidateCommit,
            {
              objectExists: gitObjectExists,
              isAncestor,
              changedRuntimePaths: (deployedCommit, finalCandidateCommit) =>
                gitLines([
                  'diff',
                  '--name-only',
                  deployedCommit,
                  finalCandidateCommit,
                  '--',
                  ...P9_RUNTIME_EQUIVALENCE_PATHS,
                ]),
            },
          )) {
            fail(error);
          }
        }
      }
    }
    if (state.dataAuthority.p9TestingWriteAuthorization) {
      requireFile(state.dataAuthority.p9TestingWriteAuthorization.evidencePath);
    }
    const p9DeliveryAuthorization = state.deployment.stageMergeAuthorizations.find(
      (item) => item.stageId === 'P9',
    );
    if (
      p9DeliveryAuthorization?.authorized !== true ||
      p9DeliveryAuthorization.evidencePath !== state.dataAuthority.productionAuthorization?.evidencePath
    ) {
      fail('Plan Revision 7 requires P9 delivery authority bound to the production authority evidence');
    }

    const attestedRevision7 = historicallyAttestedPlanAmendments.get('PLAN-REV7');
    if (attestedRevision7) {
      const revision7CandidateState = jsonAtCommit<BuildState>(
        attestedRevision7.candidateCommit,
        'docs/BUILD_STATE.json',
      );
      if (
        !revision7CandidateState ||
        p9ReadOnlyAuthorityChanged(
          state.dataAuthority,
          revision7CandidateState.dataAuthority,
        )
      ) {
        fail(
          'Plan Revision 7 production/testing authority cannot change except for its predeclared proof-state flags',
        );
      }
      const changedP9Delivery = revision7CandidateState
        ? changedStandingAuthorization(
            state.deployment.stageMergeAuthorizations,
            revision7CandidateState.deployment.stageMergeAuthorizations,
            ['P9'],
          )
        : 'P9';
      if (changedP9Delivery) {
        fail('P9 Plan Revision 7 delivery authorization cannot be deleted, disabled, or changed');
      }

      const revision7EvidencePath = 'docs/evidence/PLAN-REV7.md';
      const canonicalRevision7Evidence = gitText([
        'show',
        `${attestedRevision7.candidateCommit}:${revision7EvidencePath}`,
      ]);
      if (
        canonicalRevision7Evidence === null ||
        requireFile(revision7EvidencePath) !== canonicalRevision7Evidence
      ) {
        fail('Plan Revision 7 authority evidence must remain byte-identical to its immutable candidate');
      }
    }

    if (p9?.status === 'accepted') {
      const canonicalP9 = findCanonicalAttestation(
        'P9',
        p9.manifestPath,
        p9.reviewPath,
      );
      if (!canonicalP9) {
        fail('Accepted P9 requires its canonical direct-child attestation');
      } else {
        for (const receiptPath of [
          P9_ENTRY_EVIDENCE_PATH,
          P9_POST_CUTOVER_EVIDENCE_PATH,
          P9_DEPLOYMENT_EVIDENCE_PATH,
        ]) {
          const canonicalReceipt = gitText([
            'show',
            `${canonicalP9.manifest.candidateCommit}:${receiptPath}`,
          ]);
          const currentReceipt = requireFile(receiptPath);
          if (canonicalReceipt === null || currentReceipt !== canonicalReceipt) {
            fail(`${receiptPath} must remain byte-identical to the accepted P9 candidate`);
          }
        }
      }
    }
  } else if (!p9MayUseProduction) {
    if (state.dataAuthority.productionSpreadsheetId !== null) {
      fail('Production spreadsheet ID must remain null before P9');
    }
    if (state.dataAuthority.productionMutationAuthorized) {
      fail('Production mutation must remain unauthorized before P9');
    }
    if (state.dataAuthority.productionAuthorization !== null) {
      fail('Structured production authorization must remain null before P9');
    }
  } else {
    const authorization = state.dataAuthority.productionAuthorization;
    if (!state.dataAuthority.productionSpreadsheetId?.trim()) {
      fail('P9 requires a nonempty production spreadsheet ID');
    }
    if (state.dataAuthority.productionMutationAuthorized !== true || !authorization) {
      fail('P9 requires explicit structured production mutation authorization');
    } else {
      if (!authorization.authorizationId.trim() || !authorization.authorizedBy.trim()) {
        fail('Production authorization requires an ID and authorizer');
      }
      if (!isIsoTimestamp(authorization.authorizedAt)) {
        fail('Production authorization requires an ISO UTC timestamp');
      }
      if (!authorization.scope.trim()) fail('Production authorization requires a nonempty scope');
      requireFile(authorization.evidencePath);
    }
  }

  const plan = content['docs/SCHOLARSHIP_SYSTEM_BUILD_PLAN.md'];
  const planRevisionMatch = /^Plan revision: (\d+)$/m.exec(plan);
  if (Number(planRevisionMatch?.[1] ?? 0) !== state.planRevision) {
    fail('Canonical plan revision does not match BUILD_STATE.json');
  }
  for (const stage of state.stages) {
    if (!plan.includes(`### ${stage.id} — ${stage.name}`)) {
      fail(`Canonical plan is missing the exact heading for ${stage.id}: ${stage.name}`);
    }
  }
  for (const phrase of [
    'No silent loss',
    'Independent review standard',
    'Autonomous Git delivery',
    'Plan amendments and decision control',
    'Production migration, deployment, and closeout',
    'candidate manifest',
    'Vercel Git',
    'Delivery integration',
  ]) {
    if (!plan.includes(phrase)) fail(`Canonical plan is missing required section/phrase: ${phrase}`);
  }

  const agents = content['AGENTS.md'];
  for (const phrase of [
    'no Git questions to Kelsey',
    'fresh-context agent',
    'Execute one stage only',
    'candidate manifest',
    'Vercel Git integration',
  ]) {
    if (!agents.includes(phrase)) fail(`AGENTS.md is missing required invariant: ${phrase}`);
  }

  const decisions = content['docs/DECISIONS.md'];
  for (let i = 1; i <= 8; i++) {
    const id = `D-${String(i).padStart(3, '0')}`;
    if (!decisions.includes(`## ${id} —`)) fail(`Decision log is missing ${id}`);
  }

  const handoff = content['docs/CURRENT_HANDOFF.md'];
  if (!handoff.includes(`Plan revision: ${state.planRevision}`)) {
    fail('CURRENT_HANDOFF.md plan revision does not match BUILD_STATE.json');
  }
  const expectedHandoffStage = state.activeStageId ?? state.nextPermittedStageId ?? 'P9';
  if (!handoff.includes(expectedHandoffStage)) {
    fail(`CURRENT_HANDOFF.md does not mention ${expectedHandoffStage}`);
  }

  const kickoffTemplate = content['docs/KICKOFF_PROMPT_TEMPLATE.md'];
  const kickoffPhrases = [
    'AUTHORITATIVE READ ORDER',
    'OUT OF SCOPE',
    'ACCEPTANCE TESTS',
    'INDEPENDENT REVIEW',
    'NO GIT QUESTIONS TO KELSEY',
    'STOP CONDITIONS',
  ];
  for (const phrase of kickoffPhrases) {
    if (!kickoffTemplate.includes(phrase)) {
      fail(`Kickoff template is missing required section: ${phrase}`);
    }
  }

  if (state.nextPermittedStageId) {
    const next = state.stages.find((stage) => stage.id === state.nextPermittedStageId);
    if (!next?.kickoffPath) {
      fail(`${state.nextPermittedStageId} requires a kickoffPath`);
    } else {
      const kickoff = requireFile(next.kickoffPath);
      for (const phrase of [...kickoffPhrases, 'npm ci']) {
        if (!kickoff.includes(phrase)) {
          fail(`${next.kickoffPath} is missing required text: ${phrase}`);
        }
      }
    }
  }
}

if (errors.length) {
  console.error(`Build-plan validation failed with ${errors.length} error(s):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Build-plan validation passed for ${expectedStageIds.length} ordered stage contracts and the current machine-state transition.`);
