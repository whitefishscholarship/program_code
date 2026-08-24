import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

type ProductionAuthorization = {
  authorizationId: string;
  authorizedBy: string;
  authorizedAt: string;
  evidencePath: string;
  scope: string;
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
    productionSpreadsheetId: string | null;
    productionMutationAuthorized: boolean;
    productionAuthorization: ProductionAuthorization | null;
  };
  deployment: {
    mainAutoDeploysProduction: boolean;
    stageMergeAuthorizations: MergeAuthorization[];
    deliveryBlockers: string[];
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
      const originMain = gitText(['rev-parse', 'refs/remotes/origin/main'])?.trim();
      if (
        originMain &&
        /^[0-9a-f]{40}$/.test(originMain) &&
        !isAncestor(manifest.candidateCommit, originMain) &&
        manifest.baselineCommit !== originMain
      ) {
        fail(`${stage.manifestPath} baselineCommit must equal current origin/main before delivery`);
      }
      if (originMain && !isAncestor(attestationCommit ?? '', originMain)) {
        const validationTip = process.env.STAGE_BRANCH_TIP_SHA?.trim() || gitText(['rev-parse', 'HEAD'])?.trim();
        if (validationTip !== attestationCommit) {
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

  const p9 = state.stages.find((stage) => stage.id === 'P9');
  const p9MayUseProduction = p9 && (inFlightStatuses.has(p9.status) || p9.status === 'accepted');
  if (p9MayUseProduction) {
    for (const prerequisite of state.stages.slice(0, 9)) {
      if (prerequisite.status !== 'accepted') {
        fail(`P9 requires ${prerequisite.id} to be accepted, not ${prerequisite.status}`);
      }
    }
  }
  if (!p9MayUseProduction) {
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
