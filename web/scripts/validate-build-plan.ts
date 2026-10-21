import { validateNewAtRepo } from './sd2-new-observations-governance';
import { validateHeldAtRepo, validateClosureProofAtRepo, type ClosureProof, type HeldState } from './sd2-held-closure-governance';
import { validateIdentityRepairAtRepo } from './r4-identity-delivery';
import { permitsLocalR3Preparation, validateR3CatalogPolicyAt, type R3CatalogPolicy } from './r3-catalog-governance';
import { permitsLocalCoveragePreparation } from './interview-coverage-governance';
import { readGitBuffer, matchesBlobHash, validateRepairAtRepo, type Rev15DeliveryRepair } from './plan-rev17-rev15-delivery-repair';
import { permitsLocalIntakePreparation } from './intake-governance';
import { permitsLocalRelevancePreparation } from './interview-relevance-governance';
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
  P9_IDENTITY_PIN_EVIDENCE_PATH,
  P9_IDENTITY_PIN_MANIFEST_PATH,
  P9_IDENTITY_PIN_REVIEW_PATH,
  P9_IDENTITY_PIN_STAGE_ID,
  getCompleteP9IdentityPins,
  hasAnyP9IdentityPin,
  p9IdentityPinsChanged,
  validateP9IdentityPinAttestationPresence,
  type P9ProductionAuthorization,
  type P9TestingWriteAuthorization,
  p9ReadOnlyAuthorityChanged,
  validateP9ReadOnlyAuthority,
} from './production-authority';
import {
  P9_DEPLOYMENT_EVIDENCE_PATH,
  P9_ENTRY_EVIDENCE_PATH,
  P9_POST_CUTOVER_EVIDENCE_PATH,
  P9_RUNTIME_EQUIVALENCE_PATHS,
  P9_TRUSTED_PROOF_PATHS,
  P9_EVIDENCE_REPOSITORY,
  P9_SIGNER_WORKFLOW,
  type P9AttestationVerification,
  type P9EntryReceipt,
  type P9EvidenceContext,
  deriveP9WriteSurfaceInventory,
  parseP9DeploymentRecord,
  parseP9EntryReceipt,
  parseP9PostCutoverReceipt,
  validateP9DeploymentGitBindingV2,
  validateP9DeploymentRecordV2,
  validateP9EntryReceiptV2,
  validateP9PostCutoverReceiptV2,
} from './p9-evidence-v2';
import { validatePlanRev10Lifecycle } from './plan-rev10-lifecycle';
import { historicalRuntimeClosureSha256, permitsLocalShortlistPreparation } from './shortlist-governance';
import { validateP9ProductionRuntime } from './p9-production-runtime';
import { validateP9ReplacementEvidenceAtRepo } from './p9-replacement-closeout';
import {
  PLAN_REV11_CONTINUATION_PATHS,
  validatePlanRev11LateDelivery,
  type PlanRev11LateDeliveryContinuation,
} from './plan-rev11-late-delivery';
import {
  PLAN_REV12_AMENDMENT_PATHS,
  validatePlanRev12RowSource,
  type PlanRev12RowSourceCorrection,
} from './plan-rev12-row-source';
import {
  P8M_HUMAN_REVIEW_PATH,
  P8M_RECEIPT_PATH,
  P8M_RECONCILIATION_PATH,
  P8M_SOURCE_SNAPSHOT_PATH,
  validateP8mPackageAt,
} from './p8m-proposals';
import {
  P8M_PUBLICATION_PATH,
  P8M_REVIEW_DIGEST_PATH,
  P8M_REVIEW_VALIDATION_PATH,
  P8M_SOURCE_FIELDS_PATH,
  validateP8mAcceptanceAt,
} from './p8m-acceptance';

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
  lateDeliveryContinuation?: PlanRev11LateDeliveryContinuation;
  rowSourceCorrection?: PlanRev12RowSourceCorrection;
  rev15DeliveryRepair?: Rev15DeliveryRepair;
  r4IdentityRepair?: unknown;
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

type P8mProcessingState = {
  contractId: string;
  status: string;
  authorizationEvidencePath: string;
  sourceRevision: string;
  sourceSnapshotPath: string;
  sourceSnapshotSha256: string;
  authorizedUrlInputColumn: string;
  authorizedUrlInputHeader: string;
  authorizedExternalUrlCount: number;
  externalUrlReads: number;
  claudePromptPath: string;
  claudeReceiptPath: string;
  claudeReceiptSha256: string;
  combinedProposalSha256: string;
  rowOutcomeCount: number;
  matchingFactsProduced: number;
  acceptedFacts: number;
  humanFactReviewer: string | null;
  humanFactReviewerEvidencePath: string | null;
  humanFactReviewerNamedAt: string | null;
  humanReviewDecisionCount: number;
  humanReviewDecisionStatus: string;
  humanReviewPackagePath: string;
  humanReviewPackageSha256: string;
  humanReviewSourceFieldsPath?: string;
  humanReviewSourceFieldsSha256?: string;
  humanReviewDigestPath?: string;
  humanReviewDigestSha256?: string;
  humanReviewValidationPath?: string;
  humanReviewValidationSha256?: string;
  reconciliationPath: string;
  reconciliationSha256: string;
  publicationPath?: string;
  publicationSha256?: string;
  spreadsheetWrites: number;
  finalFreshContextReviewStatus: string;
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
    sourceTransition?: {
      organizerMaster: {
        spreadsheetId: string;
        role: string;
        designationEvidence: string;
        verificationStatus: string;
        accessAuthorized: boolean;
        automatedWriteAuthorized: boolean;
        automatedWriteAuthorizationEvidencePath: string | null;
        automatedWriteAcceptanceEvidencePath: string | null;
        verificationEvidencePath: string;
      };
      p8mRowSource?: PlanRev12RowSourceCorrection;
      p8mProcessing?: P8mProcessingState;
      formerProduction: {
        spreadsheetId: string;
        role: string;
        accessAuthorized: boolean;
        comparisonReadAuthorized: boolean;
        dispositionEvidencePath: string;
      };
      applicationRuntime: {
        sourceMode: string;
        publicationStatus: string;
        mutableMasterDirectReadAuthorized: boolean;
        runtimeReadAuthorityStatus: string;
        publicationEvidencePath: string;
        publicationPath: string | null;
        publicationSha256: string | null;
        publicationSchemaVersion: string | null;
        sourceMasterRevision: string | null;
        acceptedFactSha256: string | null;
        generatorSha256: string | null;
        p8mAcceptanceBindingMode: string;
        runtimeCommit: string | null;
        providerProjectFingerprintSha256: string | null;
        providerTeamFingerprintSha256: string | null;
        canonicalProductionHostnameSha256: string | null;
        verificationEnvironmentFingerprintSha256: string | null;
        runtimeReadAuthorityEvidencePath: string | null;
        deploymentOwner: string | null;
        rollbackOwner: string | null;
        historicalP9IdentityPinStatus: string;
        requiredPublicationPins: string[];
        pinOwnership: {
          P8M: string[];
          P9: string[];
        };
      };
      identities: string[];
      matchingFactContractPath: string;
      matchingFactContractId: string;
      taxonomyVersion: string;
    };
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
  r3CatalogRefresh?: R3CatalogPolicy;
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
const expectedStageIds = ['P0', 'P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8', 'P8R', 'P8M', 'P8F', 'P9'];
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

function sha256FileIfPresent(relativePath: string): string | null {
  try {
    const target = absolute(relativePath);
    if (!fs.existsSync(target) || !fs.statSync(target).isFile()) return null;
    return createHash('sha256').update(fs.readFileSync(target)).digest('hex');
  } catch {
    return null;
  }
}

function sha256Buffer(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex');
}

type P9OperationalEvidenceIdentityContext = Pick<
  P9EvidenceContext,
  | 'runtimePrincipalFingerprintSha256'
  | 'providerProjectFingerprintSha256'
  | 'providerTeamFingerprintSha256'
  | 'providerCanonicalProductionHostnameSha256'
  | 'hostedVerificationEnvironmentFingerprintSha256'
  | 'runtimeCredentialProvenanceFingerprintSha256'
>;

function p9OperationalEvidenceIdentityContext(
  authorization: P9ProductionAuthorization,
): P9OperationalEvidenceIdentityContext | null {
  const pins = getCompleteP9IdentityPins(authorization);
  if (!pins) return null;
  return {
    runtimePrincipalFingerprintSha256:
      pins.runtimePrincipalFingerprintSha256,
    providerProjectFingerprintSha256:
      pins.providerProjectFingerprintSha256,
    providerTeamFingerprintSha256: pins.providerTeamFingerprintSha256,
    providerCanonicalProductionHostnameSha256:
      pins.providerCanonicalProductionHostnameSha256,
    hostedVerificationEnvironmentFingerprintSha256:
      pins.hostedVerificationEnvironmentFingerprintSha256,
    runtimeCredentialProvenanceFingerprintSha256:
      pins.runtimeCredentialProvenanceFingerprintSha256,
  };
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
  return readGitBuffer(repoRoot, args);
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

function gitCommitTimestamp(commit: string): string | null {
  return gitText(['show', '-s', '--format=%cI', commit])?.trim() ?? null;
}

function gitBlobSha256(commit: string, relativePath: string): string | null {
  const value = gitBuffer(['show', `${commit}:${relativePath}`]);
  return value ? sha256Buffer(value) : null;
}

function verifyP9ArtifactAttestation(
  receiptPath: string,
  workflowCommit: string,
): P9AttestationVerification | null {
  try {
    execFileSync(
      'gh',
      [
        'attestation',
        'verify',
        absolute(receiptPath),
        '--repo',
        P9_EVIDENCE_REPOSITORY,
        '--signer-workflow',
        P9_SIGNER_WORKFLOW,
        '--source-digest',
        workflowCommit,
        '--deny-self-hosted-runners',
      ],
      {
        cwd: repoRoot,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );
    return {
      verified: true,
      subjectPath: receiptPath,
      subjectSha256: sha256File(receiptPath),
      repository: P9_EVIDENCE_REPOSITORY,
      signerWorkflow: P9_SIGNER_WORKFLOW,
      sourceDigest: workflowCommit,
      denySelfHostedRunners: true,
    };
  } catch {
    return null;
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
  allowedUndeliveredTip?: string,
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
    } else if (!matchesBlobHash(blob, file.sha256)) {
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
    if (
      validationTip !== attestationCommit &&
      validationTip !== allowedUndeliveredTip
    ) {
      fail(`${subjectId} undelivered branch tip must equal its attestation exactly`);
    }
  }
  return attestationCommit;
}

type AttestedPlanAmendment = {
  record: PlanAmendment;
  candidateCommit: string;
  attestationCommit: string;
};

function findCanonicalAttestation(
  subjectId: string,
  manifestPath: string,
  reviewPath: string,
): {
  manifest: CandidateManifest;
  review: ReviewRecord;
  attestationCommit: string;
} | null {
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
        return { manifest, review, attestationCommit: additionCommit };
      }
    } catch {
      continue;
    }
  }
  return null;
}

const P9_IDENTITY_PIN_PROOF_FLAGS = [
  'runtimeReadPermissionVerified',
  'runtimePrincipalDirectReaderVerified',
  'backupRuntimeReadPermissionVerified',
  'providerTargetIdentityPinned',
  'hostedVerificationEnvironmentVerified',
  'runtimeCredentialProvenanceVerified',
  'entrySourceReverificationVerified',
  'deployedApplicationReadPathVerified',
  'postCutoverNonMutationVerified',
] as const satisfies ReadonlyArray<keyof P9ProductionAuthorization>;

function p9IdentityPinProofFlagsAreFalse(
  authorization: P9ProductionAuthorization,
): boolean {
  return P9_IDENTITY_PIN_PROOF_FLAGS.every(
    (field) => authorization[field] === false,
  );
}

function withoutP9IdentityPins(value: BuildState): BuildState {
  const normalized = structuredClone(value);
  const authorization = normalized.dataAuthority.productionAuthorization;
  if (authorization) {
    authorization.runtimePrincipalFingerprintSha256 = null;
    authorization.backupRuntimePrincipalFingerprintSha256 = null;
    authorization.providerProjectFingerprintSha256 = null;
    authorization.providerTeamFingerprintSha256 = null;
    authorization.providerCanonicalProductionHostnameSha256 = null;
    authorization.hostedVerificationEnvironmentFingerprintSha256 = null;
    authorization.runtimeCredentialProvenanceFingerprintSha256 = null;
  }
  return normalized;
}

function validateP9IdentityPinGovernance(state: BuildState): void {
  const authorization = state.dataAuthority.productionAuthorization;
  if (!authorization) return;

  const pinPaths = [
    P9_IDENTITY_PIN_EVIDENCE_PATH,
    P9_IDENTITY_PIN_MANIFEST_PATH,
    P9_IDENTITY_PIN_REVIEW_PATH,
  ];
  const currentPins = getCompleteP9IdentityPins(authorization);
  const anyCurrentPin = hasAnyP9IdentityPin(authorization);
  const currentPinFiles = pinPaths.filter((relativePath) =>
    fs.existsSync(absolute(relativePath)),
  );
  const historicalAttempts = gitLines([
    'log',
    '--reverse',
    '--diff-filter=A',
    '--format=%H',
    '--',
    P9_IDENTITY_PIN_MANIFEST_PATH,
  ]);
  const canonical = findCanonicalAttestation(
    P9_IDENTITY_PIN_STAGE_ID,
    P9_IDENTITY_PIN_MANIFEST_PATH,
    P9_IDENTITY_PIN_REVIEW_PATH,
  );
  for (const error of validateP9IdentityPinAttestationPresence({
    anyCurrentPin,
    currentArtifactCount: currentPinFiles.length,
    historicalAttemptCount: historicalAttempts.length,
    canonicalAttestationPresent: canonical !== null,
  })) {
    fail(error);
  }
  if (!canonical) return;

  const validatedAttestation = validateBoundAttestation(
    P9_IDENTITY_PIN_STAGE_ID,
    canonical.manifest.baselineCommit,
    P9_IDENTITY_PIN_MANIFEST_PATH,
    P9_IDENTITY_PIN_REVIEW_PATH,
  );
  if (validatedAttestation !== canonical.attestationCommit) {
    fail(
      'P9-IDENTITY-PINS must retain its first canonical independently accepted direct-child attestation',
    );
  }

  const expectedCandidatePaths = [
    'docs/BUILD_STATE.json',
    P9_IDENTITY_PIN_EVIDENCE_PATH,
  ].sort();
  const candidatePaths = (canonical.manifest.files ?? [])
    .map((entry) => entry.path)
    .sort();
  if (!isDeepStrictEqual(candidatePaths, expectedCandidatePaths)) {
    fail(
      'P9-IDENTITY-PINS candidate may change only BUILD_STATE and its fixed identity-pin evidence file',
    );
  }

  const baselineState = jsonAtCommit<BuildState>(
    canonical.manifest.baselineCommit,
    'docs/BUILD_STATE.json',
  );
  const candidateState = jsonAtCommit<BuildState>(
    canonical.manifest.candidateCommit,
    'docs/BUILD_STATE.json',
  );
  const candidateAuthorization =
    candidateState?.dataAuthority.productionAuthorization ?? null;
  const baselineAuthorization =
    baselineState?.dataAuthority.productionAuthorization ?? null;
  const candidatePins = candidateAuthorization
    ? getCompleteP9IdentityPins(candidateAuthorization)
    : null;
  const candidateP9 = candidateState?.stages.find((stage) => stage.id === 'P9');

  if (
    !baselineState ||
    !candidateState ||
    candidateState.planRevision !== 10 ||
    candidateState.activeStageId !== null ||
    candidateState.nextPermittedStageId !== 'P9' ||
    candidateP9?.status !== 'planned' ||
    candidateP9.baselineCommit !== null ||
    !baselineAuthorization ||
    hasAnyP9IdentityPin(baselineAuthorization) ||
    !candidateAuthorization ||
    !candidatePins ||
    !p9IdentityPinProofFlagsAreFalse(candidateAuthorization)
  ) {
    fail(
      'P9-IDENTITY-PINS candidate must keep Plan Revision 10 and P9 planned while pinning one complete identity set with every proof state false',
    );
  } else {
    for (const error of validateP9ReadOnlyAuthority(
      candidateState.dataAuthority,
      {
        expectedEntryProofState: false,
        expectedPostCutoverProofState: false,
      },
    )) {
      fail(`P9-IDENTITY-PINS candidate authority is invalid: ${error}`);
    }
    if (
      !isDeepStrictEqual(
        withoutP9IdentityPins(candidateState),
        withoutP9IdentityPins(baselineState),
      )
    ) {
      fail(
        'P9-IDENTITY-PINS candidate BUILD_STATE may populate only the seven predeclared identity fingerprints',
      );
    }
  }

  const baselineEvidence = gitBuffer([
    'show',
    `${canonical.manifest.baselineCommit}:${P9_IDENTITY_PIN_EVIDENCE_PATH}`,
  ]);
  const candidateEvidence = gitText([
    'show',
    `${canonical.manifest.candidateCommit}:${P9_IDENTITY_PIN_EVIDENCE_PATH}`,
  ]);
  if (baselineEvidence !== null || !candidateEvidence?.trim()) {
    fail(
      'P9-IDENTITY-PINS evidence must be newly added and nonempty in the immutable pin candidate',
    );
  }
  const currentEvidence = requireFile(P9_IDENTITY_PIN_EVIDENCE_PATH);
  if (candidateEvidence === null || currentEvidence !== candidateEvidence) {
    fail(
      'P9 identity-pin evidence must remain byte-identical to its immutable candidate',
    );
  }
  if (
    !currentPins ||
    !candidatePins ||
    !candidateAuthorization ||
    p9IdentityPinsChanged(authorization, candidateAuthorization)
  ) {
    fail(
      'P9 identity pins cannot be deleted, partially cleared, changed, or rebound after their canonical attestation',
    );
  }

  const immutableArtifactBytes = [
    {
      path: P9_IDENTITY_PIN_EVIDENCE_PATH,
      expected: candidateEvidence,
    },
    {
      path: P9_IDENTITY_PIN_MANIFEST_PATH,
      expected: gitText([
        'show',
        `${canonical.attestationCommit}:${P9_IDENTITY_PIN_MANIFEST_PATH}`,
      ]),
    },
    {
      path: P9_IDENTITY_PIN_REVIEW_PATH,
      expected: gitText([
        'show',
        `${canonical.attestationCommit}:${P9_IDENTITY_PIN_REVIEW_PATH}`,
      ]),
    },
  ];
  for (const artifact of immutableArtifactBytes) {
    for (const commit of gitLines([
      'log',
      '--full-history',
      '--reverse',
      '--format=%H',
      `${canonical.attestationCommit}..HEAD`,
      '--',
      artifact.path,
    ])) {
      const historicalBytes = gitText(['show', `${commit}:${artifact.path}`]);
      if (artifact.expected === null || historicalBytes !== artifact.expected) {
        fail(
          `P9-IDENTITY-PINS immutable artifact changed or was deleted after attestation: ${artifact.path}`,
        );
        break;
      }
    }
  }

  if (candidateAuthorization) {
    for (const commit of gitLines([
      'log',
      '--full-history',
      '--reverse',
      '--format=%H',
      `${canonical.manifest.candidateCommit}..HEAD`,
      '--',
      'docs/BUILD_STATE.json',
    ])) {
      const historicalAuthorization = jsonAtCommit<BuildState>(
        commit,
        'docs/BUILD_STATE.json',
      )?.dataAuthority.productionAuthorization;
      if (
        !historicalAuthorization ||
        p9IdentityPinsChanged(historicalAuthorization, candidateAuthorization)
      ) {
        fail(
          `P9 identity pins changed, were deleted, or were rebound after their canonical candidate at ${commit}`,
        );
        break;
      }
    }
  }
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
        attestationCommit: canonical.attestationCommit,
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
  if (state.planRevision >= 10) {
    const transition = state.dataAuthority.sourceTransition;
    const p8mStage = state.stages.find((stage) => stage.id === 'P8M');
    const p9Stage = state.stages.find((stage) => stage.id === 'P9');
    const expectedP8mPins = [
      'publication_path',
      'publication_sha256',
      'schema_version',
      'taxonomy_version',
      'source_master_revision',
      'accepted_fact_sha256',
      'generator_sha256',
      'p8m_manifest_candidate_commit',
      'p8m_direct_child_attestation_commit',
    ];
    const expectedP9Pins = [
      'runtime_commit',
      'provider_project',
      'provider_team',
      'canonical_production_hostname',
      'verification_environment',
    ];
    const expectedAllPins = [...expectedP8mPins, ...expectedP9Pins];
    const commonBoundaryValid = Boolean(
      transition &&
        transition.organizerMaster.spreadsheetId ===
          '1Dp5AMnrfSQ-Xf-r03S75lKsGPJk7o0inOgvC9Q6lOl4' &&
        transition.organizerMaster.role === 'organizer_authoring_master' &&
        (state.planRevision >= 12
          ? transition.organizerMaster.designationEvidence ===
            'user-confirmed-and-read-only-verified'
          : transition.organizerMaster.designationEvidence === 'user-reported') &&
        transition.formerProduction.spreadsheetId ===
          '1eWGMdavcEECUcY_-nZ9gR2nMTN7T7T6oipG5ql1LoIE' &&
        transition.formerProduction.role === 'legacy_comparison_only' &&
        transition.formerProduction.accessAuthorized === false &&
        transition.formerProduction.comparisonReadAuthorized === false &&
        transition.applicationRuntime.sourceMode ===
          'validated_immutable_versioned_publication' &&
        transition.applicationRuntime.mutableMasterDirectReadAuthorized === false &&
        transition.applicationRuntime.historicalP9IdentityPinStatus ===
          'retired_unstarted_by_PLAN_REV10' &&
        transition.applicationRuntime.publicationEvidencePath === 'docs/evidence/P8M.md' &&
        transition.applicationRuntime.p8mAcceptanceBindingMode ===
          'derived_from_canonical_manifest_and_direct_child_attestation' &&
        JSON.stringify(transition.applicationRuntime.requiredPublicationPins) ===
          JSON.stringify(expectedAllPins) &&
        JSON.stringify(transition.applicationRuntime.pinOwnership) ===
          JSON.stringify({ P8M: expectedP8mPins, P9: expectedP9Pins }) &&
        JSON.stringify(transition.identities) ===
          JSON.stringify([
            'human_editor',
            'proposal_processor',
            'fact_reviewer',
            'read_only_application_runtime',
          ]) &&
        transition.matchingFactContractPath ===
          'docs/evidence/PLAN-REV10-matching-fact-contract.json' &&
        transition.matchingFactContractId === 'matching-facts-v1' &&
        transition.taxonomyVersion === '1.0.0',
    );
    if (!commonBoundaryValid || !transition) {
      fail('Plan Revision 10 source transition identity or immutable-publication boundary is invalid');
    } else {
      requireFile(transition.formerProduction.dispositionEvidencePath);
      const matchingContract = readJson<Record<string, unknown>>(
        transition.matchingFactContractPath,
      );
      if (
        matchingContract?.contractId !== transition.matchingFactContractId ||
        matchingContract?.taxonomyVersion !== transition.taxonomyVersion ||
        matchingContract?.status !== 'governance-frozen-no-processing-authority' ||
        matchingContract?.validatorModulePath !== 'web/scripts/matching-fact-contract.ts' ||
        (matchingContract?.factSchema as Record<string, unknown> | undefined)
          ?.validationAlgorithm !== 'matching-facts-v1-strict'
      ) {
        fail('Plan Revision 10 matching-fact contract identity or frozen status is invalid');
      }
      requireFile('web/scripts/matching-fact-contract.ts');
      if (transition.organizerMaster.automatedWriteAuthorized) {
        if (transition.organizerMaster.automatedWriteAuthorizationEvidencePath) {
          requireFile(transition.organizerMaster.automatedWriteAuthorizationEvidencePath);
        }
        if (transition.organizerMaster.automatedWriteAcceptanceEvidencePath) {
          requireFile(transition.organizerMaster.automatedWriteAcceptanceEvidencePath);
        }
      }
      const canonicalP8m =
        p8mStage?.status === 'accepted'
          ? findCanonicalAttestation('P8M', p8mStage.manifestPath, p8mStage.reviewPath)
          : null;
      for (const error of validatePlanRev10Lifecycle(
        transition,
        p8mStage?.status,
        p9Stage?.status,
        canonicalP8m
          ? {
              candidateCommit: canonicalP8m.manifest.candidateCommit,
              attestationCommit: canonicalP8m.attestationCommit,
              manifestPath: 'docs/evidence/P8M-manifest.json',
              reviewPath: 'docs/reviews/P8M.json',
            }
          : null,
      )) {
        fail(error);
      }
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

  if (state.planRevision >= 18 || state.r3CatalogRefresh) {
    for (const error of validateR3CatalogPolicyAt(repoRoot, state.r3CatalogRefresh)) fail(error);
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
  const revision10 = planAmendments.find((item) => item.id === 'PLAN-REV10');
  const revision11 = planAmendments.find((item) => item.id === 'PLAN-REV11');
  const revision12 = planAmendments.find((item) => item.id === 'PLAN-REV12');
  const canonicalRevision10 = revision10
    ? findCanonicalAttestation(
        revision10.id,
        revision10.manifestPath,
        revision10.reviewPath,
      )
    : null;
  let canonicalRevision11: ReturnType<typeof findCanonicalAttestation> = null;
  let revision11ContinuationValid = false;
  if (state.planRevision >= 11) {
    requireFile('web/scripts/plan-rev11-late-delivery.ts');
    requireFile('docs/kickoffs/PLAN-REV11-REV10-LATE-DELIVERY.md');
    if (!revision11 || !revision11.lateDeliveryContinuation || !canonicalRevision10) {
      fail('Plan Revision 11 requires its late-delivery record and canonical Revision 10 attestation');
    } else {
      const continuationErrors = validatePlanRev11LateDelivery(
        revision11.lateDeliveryContinuation,
        {
          amendmentId: revision10!.id,
          candidateCommit: canonicalRevision10.manifest.candidateCommit,
          attestationCommit: canonicalRevision10.attestationCommit,
          baselineCommit: canonicalRevision10.manifest.baselineCommit,
        },
      );
      for (const error of continuationErrors) fail(error);
      revision11ContinuationValid = continuationErrors.length === 0;
      if (
        state.deployment.deliveryBlockers.includes(
          'PLAN-REV10-awaits-direct-push-pr-merge-preview-production-authority',
        )
      ) {
        fail('Plan Revision 11 must remove the satisfied Revision 10 delivery-permission blocker');
      }
      canonicalRevision11 = findCanonicalAttestation(
        revision11.id,
        revision11.manifestPath,
        revision11.reviewPath,
      );
      if (canonicalRevision11) {
        if (
          !isAncestor(
            canonicalRevision10.attestationCommit,
            canonicalRevision11.manifest.candidateCommit,
          )
        ) {
          fail('Plan Revision 11 candidate must descend from the exact Revision 10 attestation');
        }
        const continuationChanges = [
          ...completeChangeSet(
            canonicalRevision10.attestationCommit,
            canonicalRevision11.manifest.candidateCommit,
            new Set<string>(),
          ).keys(),
        ].sort();
        if (
          JSON.stringify(continuationChanges) !==
          JSON.stringify([...PLAN_REV11_CONTINUATION_PATHS].sort())
        ) {
          fail('Plan Revision 11 candidate changed paths outside its exact late-delivery continuation allowlist');
        }
      }
    }
  }
  if (state.planRevision >= 12) {
    requireFile('web/scripts/plan-rev12-row-source.ts');
    requireFile('docs/kickoffs/PLAN-REV12-ROW-SOURCE-CORRECTION.md');
    if (!revision12 || !state.dataAuthority.sourceTransition) {
      fail('Plan Revision 12 requires its row-source correction and source-transition state');
    } else {
      const p8mAuthorization = state.deployment.stageMergeAuthorizations.find(
        (item) => item.stageId === 'P8M',
      );
      const rowSourceErrors = validatePlanRev12RowSource({
        planRevision: state.planRevision,
        amendmentBaselineCommit: revision12.baselineCommit,
        amendmentDeliveryAuthorized:
          revision12.deliveryAuthorization?.authorized === true,
        amendmentEvidencePath: revision12.evidencePath,
        rowSource: state.dataAuthority.sourceTransition.p8mRowSource,
        amendmentRowSource: revision12.rowSourceCorrection,
        organizerMaster: state.dataAuthority.sourceTransition.organizerMaster,
        p8mAuthorization,
        p8mStatus: state.stages.find((item) => item.id === 'P8M')?.status,
        p9Status: state.stages.find((item) => item.id === 'P9')?.status,
        activeStageId: state.activeStageId,
        nextPermittedStageId: state.nextPermittedStageId,
        deliveryBlockers: state.deployment.deliveryBlockers,
      });
      for (const error of rowSourceErrors) fail(error);

      const p8mStatus = state.stages.find((item) => item.id === 'P8M')?.status;
      const processing = state.dataAuthority.sourceTransition.p8mProcessing;
      if (p8mStatus === 'planned') {
        if (processing) fail('Planned P8M must not claim a completed proposal-processing receipt');
      } else if (!processing) {
        fail('Started P8M requires its machine-pinned proposal-processing receipt');
      } else {
        for (const requiredPath of [
          processing.authorizationEvidencePath,
          processing.sourceSnapshotPath,
          processing.claudePromptPath,
          processing.claudeReceiptPath,
          processing.humanReviewPackagePath,
          processing.reconciliationPath,
          'docs/evidence/P8M.md',
          'web/scripts/p8m-proposals.ts',
          'web/scripts/test-p8m-proposals.ts',
        ]) {
          requireFile(requiredPath);
        }
        const packageResult = validateP8mPackageAt(repoRoot);
        for (const error of packageResult.errors) fail(`P8M proposal package: ${error}`);
        const packageSummary = packageResult.summary as Record<string, unknown>;
        const packageTotals = packageSummary.totals as Record<string, unknown>;
        const acceptanceResult = validateP8mAcceptanceAt(repoRoot);
        for (const error of acceptanceResult.errors) fail(`P8M acceptance package: ${error}`);
        const acceptanceSummary = acceptanceResult.summary;
        for (const requiredPath of [
          processing.humanReviewSourceFieldsPath,
          processing.humanReviewDigestPath,
          processing.humanReviewValidationPath,
          processing.publicationPath,
          'web/scripts/p8m-acceptance.ts',
          'web/scripts/test-p8m-acceptance.ts',
        ]) {
          if (requiredPath) requireFile(requiredPath);
        }
        const expectedFinalReviewStatus =
          p8mStatus === 'accepted'
            ? 'bound_by_canonical_direct_child_attestation'
            : 'pending_fresh_context_review';
        if (
          processing.contractId !== 'p8m-proposal-pass-v1' ||
          processing.status !== 'human_review_reconciled_publication_candidate' ||
          processing.authorizationEvidencePath !== 'docs/evidence/P8M-processing-authority.md' ||
          processing.sourceRevision !== '225' ||
          processing.sourceSnapshotPath !== P8M_SOURCE_SNAPSHOT_PATH ||
          processing.sourceSnapshotSha256 !== packageSummary.source_snapshot_sha256 ||
          processing.authorizedUrlInputColumn !== 'A' ||
          processing.authorizedUrlInputHeader !== 'Last Updated' ||
          processing.authorizedExternalUrlCount !== 0 ||
          processing.externalUrlReads !== 0 ||
          processing.claudePromptPath !== 'docs/evidence/P8M-claude-prompt-v1.md' ||
          processing.claudeReceiptPath !== P8M_RECEIPT_PATH ||
          processing.claudeReceiptSha256 !== packageSummary.claude_receipt_sha256 ||
          processing.combinedProposalSha256 !== packageSummary.combined_output_sha256 ||
          processing.rowOutcomeCount !== packageTotals.total_returned_rows ||
          processing.matchingFactsProduced !== 0 ||
          processing.acceptedFacts !== 0 ||
          processing.humanFactReviewer !== 'Kelsey Stuart' ||
          processing.humanFactReviewerEvidencePath !==
            'docs/evidence/P8M-processing-authority.md' ||
          processing.humanFactReviewerNamedAt !== '2026-09-03T02:48:16Z' ||
          processing.humanReviewDecisionCount !== 197 ||
          processing.humanReviewDecisionStatus !== 'complete_all_197' ||
          processing.humanReviewPackagePath !== P8M_HUMAN_REVIEW_PATH ||
          processing.humanReviewPackageSha256 !== sha256File(P8M_HUMAN_REVIEW_PATH) ||
          processing.humanReviewSourceFieldsPath !== P8M_SOURCE_FIELDS_PATH ||
          processing.humanReviewSourceFieldsSha256 !== sha256File(P8M_SOURCE_FIELDS_PATH) ||
          processing.humanReviewDigestPath !== P8M_REVIEW_DIGEST_PATH ||
          processing.humanReviewDigestSha256 !== sha256File(P8M_REVIEW_DIGEST_PATH) ||
          processing.humanReviewValidationPath !== P8M_REVIEW_VALIDATION_PATH ||
          processing.humanReviewValidationSha256 !== sha256File(P8M_REVIEW_VALIDATION_PATH) ||
          processing.reconciliationPath !== P8M_RECONCILIATION_PATH ||
          processing.reconciliationSha256 !== sha256File(P8M_RECONCILIATION_PATH) ||
          processing.publicationPath !== P8M_PUBLICATION_PATH ||
          processing.publicationSha256 !== acceptanceSummary.publication_sha256 ||
          processing.publicationSha256 !== sha256File(P8M_PUBLICATION_PATH) ||
          processing.spreadsheetWrites !== 0 ||
          processing.finalFreshContextReviewStatus !== expectedFinalReviewStatus
        ) {
          fail('P8M processing state differs from the validated human-review and no-write publication package');
        }
        const runtimePublication = state.dataAuthority.sourceTransition.applicationRuntime;
        if (
          runtimePublication.publicationPath !== P8M_PUBLICATION_PATH ||
          runtimePublication.publicationSha256 !== acceptanceSummary.publication_sha256 ||
          runtimePublication.publicationSchemaVersion !== '1' ||
          runtimePublication.sourceMasterRevision !== '225' ||
          runtimePublication.acceptedFactSha256 !== acceptanceSummary.accepted_fact_sha256 ||
          runtimePublication.generatorSha256 !== acceptanceSummary.generator_sha256
        ) {
          fail('P8M runtime publication pins differ from the deterministic acceptance output');
        }
      }

      const canonicalRevision12 = findCanonicalAttestation(
        revision12.id,
        revision12.manifestPath,
        revision12.reviewPath,
      );
      if (canonicalRevision12) {
        const amendmentChanges = [
          ...completeChangeSet(
            revision12.baselineCommit,
            canonicalRevision12.manifest.candidateCommit,
            new Set<string>(),
          ).keys(),
        ].sort();
        if (
          JSON.stringify(amendmentChanges) !==
          JSON.stringify([...PLAN_REV12_AMENDMENT_PATHS].sort())
        ) {
          fail('Plan Revision 12 candidate changed paths outside its exact governance allowlist');
        }
      }
    }
  }
  const revision17 = planAmendments.find(item => item.id === 'PLAN-REV17');
  const canonicalRevision15 = findCanonicalAttestation('PLAN-REV15', 'docs/evidence/PLAN-REV15-manifest.json', 'docs/reviews/PLAN-REV15.json');
  const canonicalRevision17 = revision17 ? findCanonicalAttestation(revision17.id, revision17.manifestPath, revision17.reviewPath) : null;
  let revision17ContinuationValid = false;
  if (state.planRevision >= 17 || revision17) {
    const repairErrors = validateRepairAtRepo(repoRoot, { planRevision: state.planRevision, governance: { planAmendments } }, canonicalRevision15, canonicalRevision17);
    repairErrors.forEach(fail);
    revision17ContinuationValid = repairErrors.length === 0;
  }
  const revision19 = planAmendments.find(item => item.id === 'PLAN-REV19');
  const canonicalRevision18 = findCanonicalAttestation('PLAN-REV18', 'docs/evidence/PLAN-REV18-manifest.json', 'docs/reviews/PLAN-REV18.json');
  const canonicalRevision19 = revision19 ? findCanonicalAttestation(revision19.id, revision19.manifestPath, revision19.reviewPath) : null;
  let revision19ContinuationValid = false;
  if (state.planRevision >= 19 || revision19) {
    const startErrors = errors.length;
    const identityErrors = validateIdentityRepairAtRepo(repoRoot, state, canonicalRevision18, canonicalRevision19);
    identityErrors.forEach(fail);
    if (canonicalRevision19 && revision19) {
      validateBoundAttestation(revision19.id, revision19.baselineCommit, revision19.manifestPath, revision19.reviewPath);
      revision19ContinuationValid = errors.length === startErrors;
    }
  }
  if (state.planRevision >= 24) {
    const revision24=findCanonicalAttestation('PLAN-REV24','docs/evidence/PLAN-REV24-manifest.json','docs/reviews/PLAN-REV24.json');
    validateNewAtRepo(repoRoot,state as unknown as Record<string,unknown>,revision24?.manifest.candidateCommit).forEach(fail);
  }
  if (state.planRevision >= 22) {
    const revision22 = findCanonicalAttestation('PLAN-REV22', 'docs/evidence/PLAN-REV22-manifest.json', 'docs/reviews/PLAN-REV22.json');
    validateHeldAtRepo(repoRoot, state as unknown as HeldState, revision22?.manifest.candidateCommit).forEach(fail);
    const closure = (state as unknown as HeldState).sd2ResearchClosure?.closureAttestation;
    if (closure) {
      const canonical = findCanonicalAttestation('SD2-HELD-RESEARCH', closure.manifestPath, closure.reviewPath);
      if (!canonical) fail('SD2 closure requires its own exact independent attestation');
      else {
        const beforeErrors=errors.length;
        validateBoundAttestation('SD2-HELD-RESEARCH', canonical.manifest.baselineCommit, closure.manifestPath, closure.reviewPath);
        const proof=(canonical.manifest as unknown as {heldResearchProof:ClosureProof}).heldResearchProof;
        if (!proof) fail('SD2 closure manifest lacks exact heldResearchProof');
        else {
          const main=gitText(['rev-parse','refs/remotes/origin/main'])?.trim() ?? '';
          const candidate=canonical.manifest.candidateCommit;
          const tree=gitBuffer(['ls-tree','-r',candidate,'--','web']);
          const gates=gitBuffer(['show',`${candidate}:docs/evidence/sd2-consolidation-package/acceptance-gates.json`]);
          validateClosureProofAtRepo(repoRoot,proof,{
            revision22Delivered:!!revision22 && isAncestor(revision22.attestationCommit,main),
            canonicalAttestation:errors.length===beforeErrors,
            closureDelivered:isAncestor(canonical.attestationCommit,main),
            candidateCommit:candidate,baselineCommit:canonical.manifest.baselineCommit,
            candidateManifestSha256:sha256File(closure.manifestPath),reviewSha256:sha256File(closure.reviewPath),
            runtimeDigest:tree?sha256Buffer(tree):'',originalGatesSha256:gates?sha256Buffer(gates):'',
          }).forEach(fail);
        }
      }
    }

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
      if (authorization?.authorized === true) {
        if (
          !authorization.authorizedBy?.trim() ||
          !/^\d{4}-\d{2}-\d{2}$/.test(authorization.authorizedAt ?? '') ||
          authorization.evidencePath !== amendment.evidencePath ||
          !authorization.basis.trim() ||
          !authorization.scope.trim()
        ) {
          fail(`${amendment.id} requires direct informed delivery authority bound to its evidence`);
        }
      } else if (
        (amendment.id !== 'PLAN-REV10' && !(permitsLocalShortlistPreparation(amendment.id, state.deployment.deliveryBlockers, process.env.GITHUB_ACTIONS === 'true') || permitsLocalRelevancePreparation(amendment.id, state.deployment.deliveryBlockers, process.env.GITHUB_ACTIONS === 'true') || permitsLocalIntakePreparation(amendment.id, state.deployment.deliveryBlockers, process.env.GITHUB_ACTIONS === 'true') || permitsLocalCoveragePreparation(amendment.id, state.deployment.deliveryBlockers, process.env.GITHUB_ACTIONS === 'true') || permitsLocalR3Preparation(amendment.id, state.deployment.deliveryBlockers, process.env.GITHUB_ACTIONS === 'true', state.r3CatalogRefresh))) ||
        authorization?.authorized !== false ||
        authorization.authorizedBy !== null ||
        authorization.authorizedAt !== null ||
        authorization.evidencePath !== null ||
        !authorization.basis.trim() ||
        !authorization.scope.trim() ||
        !(
          state.deployment.deliveryBlockers.some((item) =>
            item.startsWith('PLAN-REV10-'),
          ) || revision11ContinuationValid || (permitsLocalShortlistPreparation(amendment.id, state.deployment.deliveryBlockers, process.env.GITHUB_ACTIONS === 'true') || permitsLocalRelevancePreparation(amendment.id, state.deployment.deliveryBlockers, process.env.GITHUB_ACTIONS === 'true') || permitsLocalIntakePreparation(amendment.id, state.deployment.deliveryBlockers, process.env.GITHUB_ACTIONS === 'true') || permitsLocalCoveragePreparation(amendment.id, state.deployment.deliveryBlockers, process.env.GITHUB_ACTIONS === 'true') || permitsLocalR3Preparation(amendment.id, state.deployment.deliveryBlockers, process.env.GITHUB_ACTIONS === 'true', state.r3CatalogRefresh))
        )
      ) {
        fail(`${amendment.id} requires direct informed delivery authority or an exact authorized local-only preparation blocker`);
      }
    }
    if (amendment.id !== 'PLAN-REV19' || !canonicalRevision19) validateBoundAttestation(
      amendment.id,
      amendment.baselineCommit,
      amendment.manifestPath,
      amendment.reviewPath,
      undefined,
      amendment.id === 'PLAN-REV10' &&
        revision11ContinuationValid &&
        canonicalRevision11
        ? canonicalRevision11.attestationCommit
        : amendment.id === 'PLAN-REV15' && revision17ContinuationValid && canonicalRevision17
          ? canonicalRevision17.attestationCommit
          : amendment.id === 'PLAN-REV18' && revision19ContinuationValid && canonicalRevision19
            ? canonicalRevision19.attestationCommit
            : undefined,
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
    const candidateStageIds = candidateState?.stages?.map((item) => item.id) ?? [];
    const stageIndex = candidateStageIds.indexOf(stage.id);
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
          fail(`${stage.id} candidateCommit requires ${candidateStageIds[i]} accepted`);
        }
      }
      for (let i = stageIndex + 1; i < candidateStageIds.length; i += 1) {
        if (candidateState.stages[i]?.status !== 'planned') {
          fail(`${stage.id} candidateCommit requires later stage ${candidateStageIds[i]} planned`);
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
    const p9Index = state.stages.findIndex((stage) => stage.id === 'P9');
    for (const prerequisite of state.stages.slice(0, p9Index)) {
      if (prerequisite.status !== 'accepted') {
        fail(`P9 requires ${prerequisite.id} to be accepted, not ${prerequisite.status}`);
      }
    }
  }
  if (state.planRevision >= 10) {
    const replacementP9Authorization = state.deployment.stageMergeAuthorizations.find(
      (item) => item.stageId === 'P9',
    );
    if (p9MayUseProduction) {
      if (
        replacementP9Authorization?.authorized !== true ||
        !replacementP9Authorization.evidencePath ||
        replacementP9Authorization.evidencePath === 'docs/evidence/PLAN-REV7.md' ||
        replacementP9Authorization.evidencePath !==
          state.dataAuthority.sourceTransition?.applicationRuntime
            .runtimeReadAuthorityEvidencePath
      ) {
        fail('Active replacement P9 requires new direct target-specific authority evidence distinct from Revision 7');
      }
    } else if (
      p9?.status === 'planned' &&
      replacementP9Authorization?.authorized !== false
    ) {
      fail('Planned replacement P9 must remain unauthorized');
    }
    if (p9?.status === 'verified' || p9?.status === 'accepted') {
      const runtime = state.dataAuthority.sourceTransition?.applicationRuntime;
      if (
        !p9.baselineCommit ||
        !runtime?.runtimeCommit ||
        !runtime.publicationSha256 ||
        !runtime.providerProjectFingerprintSha256 ||
        !runtime.providerTeamFingerprintSha256 ||
        !runtime.canonicalProductionHostnameSha256 ||
        !runtime.verificationEnvironmentFingerprintSha256
      ) {
        fail('Verified replacement P9 requires complete baseline, runtime, publication, and provider pins');
      } else {
        const historicalP9 = state.planRevision >= 13 ? findCanonicalAttestation('P9', p9.manifestPath, p9.reviewPath) : null;
        if (state.planRevision >= 13 && !historicalP9) fail('Post-P9 maintenance requires the canonical P9 attestation');
        let runtimeReceipt;
        try {
          runtimeReceipt = validateP9ProductionRuntime();
        } catch (error) {
          fail(`P9 production runtime validation failed: ${(error as Error).message}`);
        }
        if (runtimeReceipt) {
          for (const error of validateP9ReplacementEvidenceAtRepo(repoRoot, {
            baselineCommit: p9.baselineCommit,
            runtimeCommit: runtime.runtimeCommit,
            publicationSha256: runtime.publicationSha256,
            runtimeClosureSha256: historicalP9 ? historicalRuntimeClosureSha256(repoRoot, runtime.runtimeCommit) : runtimeReceipt.runtimeClosureSha256,
            projectFingerprintSha256: runtime.providerProjectFingerprintSha256,
            teamFingerprintSha256: runtime.providerTeamFingerprintSha256,
            hostnameFingerprintSha256: runtime.canonicalProductionHostnameSha256,
            verificationEnvironmentFingerprintSha256: runtime.verificationEnvironmentFingerprintSha256,
          }, historicalP9?.manifest.candidateCommit)) fail(error);
        }
      }
    }
  }
  if (state.planRevision >= 7) {
    const attestedRevision7 = historicallyAttestedPlanAmendments.get('PLAN-REV7');
    const attestedRevision8 = historicallyAttestedPlanAmendments.get('PLAN-REV8');
    const attestedRevision9 = historicallyAttestedPlanAmendments.get('PLAN-REV9');
    const attestedRevision10 = historicallyAttestedPlanAmendments.get('PLAN-REV10');
    const expectedEntryProofState = Boolean(p9MayUseProduction);
    const expectedPostCutoverProofState =
      p9?.status === 'verified' || p9?.status === 'accepted';
    if (state.planRevision < 10) {
      for (const error of validateP9ReadOnlyAuthority(state.dataAuthority, {
        expectedEntryProofState,
        expectedPostCutoverProofState,
      })) {
        fail(error);
      }
      validateP9IdentityPinGovernance(state);
      if (state.dataAuthority.productionAuthorization) {
      let entryReceiptForBinding: P9EntryReceipt | null = null;
      let evidenceContext: P9EvidenceContext | null = null;
      requireFile(state.dataAuthority.productionAuthorization.evidencePath);
      if (expectedEntryProofState) {
        const p7Stage = state.stages.find((stage) => stage.id === 'P7');
        const acceptedP7 = p7Stage
          ? findCanonicalAttestation('P7', p7Stage.manifestPath, p7Stage.reviewPath)
          : null;
        const acceptedP7CatalogBlob = acceptedP7
          ? gitBuffer([
              'show',
              `${acceptedP7.manifest.candidateCommit}:web/fixtures/p7/student-catalog.json`,
            ])
          : null;
        const candidateCommit = gitText(['rev-parse', 'HEAD'])?.trim() ?? '';
        const p9BaselineCommit = p9?.baselineCommit ?? '';
        const p9BaselineCommittedAt = gitCommitTimestamp(p9BaselineCommit);
        const revision7AttestationCommittedAt = attestedRevision7
          ? gitCommitTimestamp(attestedRevision7.attestationCommit)
          : null;
        const candidateCommittedAt = gitCommitTimestamp(candidateCommit);
        const operationalIdentityContext =
          p9OperationalEvidenceIdentityContext(
            state.dataAuthority.productionAuthorization,
          );
        if (!operationalIdentityContext) {
          fail(
            'P9 active state requires non-null immutable SHA-256 pins for the runtime principal, provider project/team/canonical host, hosted verification environment, and runtime credential provenance',
          );
        }
        if (
          !attestedRevision7 ||
          (state.planRevision >= 8 && !attestedRevision8) ||
          (state.planRevision >= 9 && !attestedRevision9) ||
          (state.planRevision >= 10 && !attestedRevision10) ||
          !acceptedP7 ||
          !acceptedP7CatalogBlob ||
          !/^[0-9a-f]{40}$/.test(p9BaselineCommit) ||
          !p9BaselineCommittedAt ||
          !revision7AttestationCommittedAt ||
          !candidateCommittedAt
        ) {
          fail('P9 active state requires immutable accepted P7, delivered Revisions 7 through 10, and exact Git chronology');
        } else if (operationalIdentityContext) {
          try {
            evidenceContext = {
              p9BaselineCommit,
              p9BaselineCommittedAt,
              revision7AttestationCommit: attestedRevision7.attestationCommit,
              revision7AttestationCommittedAt,
              revision7CandidateCommit: attestedRevision7.candidateCommit,
              trustedProofCandidateCommit:
                attestedRevision10?.candidateCommit ??
                attestedRevision9?.candidateCommit ??
                attestedRevision8?.candidateCommit ??
                attestedRevision7.candidateCommit,
              trustedProofAttestationCommit:
                attestedRevision10?.attestationCommit ??
                attestedRevision9?.attestationCommit ??
                attestedRevision8?.attestationCommit ??
                attestedRevision7.attestationCommit,
              candidateCommit,
              candidateCommittedAt,
              ...operationalIdentityContext,
              expectedStaticCatalogSha256: sha256Buffer(acceptedP7CatalogBlob),
              expectedWriteSurfaceInventory: deriveP9WriteSurfaceInventory(repoRoot),
            };
          } catch (error) {
            fail(`P9 write-surface inventory derivation failed: ${(error as Error).message}`);
          }
          const entryValue = readJson<unknown>(P9_ENTRY_EVIDENCE_PATH);
          const parsedEntry = parseP9EntryReceipt(entryValue);
          const entryAttestation = parsedEntry
            ? verifyP9ArtifactAttestation(
                P9_ENTRY_EVIDENCE_PATH,
                parsedEntry.capture.workflowCommit,
              )
            : null;
          const entryReceiptSha256 = sha256FileIfPresent(P9_ENTRY_EVIDENCE_PATH);
          if (evidenceContext && entryReceiptSha256) {
            for (const error of validateP9EntryReceiptV2(
              entryValue,
              evidenceContext,
              entryReceiptSha256,
              entryAttestation,
            )) {
              fail(error);
            }
          }
          entryReceiptForBinding = parsedEntry;
        }
      }
      if (expectedPostCutoverProofState) {
        const postValue = readJson<unknown>(P9_POST_CUTOVER_EVIDENCE_PATH);
        const deploymentValue = readJson<unknown>(P9_DEPLOYMENT_EVIDENCE_PATH);
        const postCutoverReceipt = parseP9PostCutoverReceipt(postValue);
        const deploymentRecord = parseP9DeploymentRecord(deploymentValue);
        if (
          !postCutoverReceipt ||
          !deploymentRecord ||
          !entryReceiptForBinding ||
          !evidenceContext
        ) {
          fail('P9 verified/accepted state requires strict v2 entry, deployment, and post-cutover receipts');
        } else {
          const deploymentAttestation = verifyP9ArtifactAttestation(
            P9_DEPLOYMENT_EVIDENCE_PATH,
            deploymentRecord.capture.workflowCommit,
          );
          const postAttestation = verifyP9ArtifactAttestation(
            P9_POST_CUTOVER_EVIDENCE_PATH,
            postCutoverReceipt.capture.workflowCommit,
          );
          for (const error of validateP9DeploymentRecordV2(
            deploymentValue,
            entryReceiptForBinding,
            evidenceContext,
            sha256File(P9_DEPLOYMENT_EVIDENCE_PATH),
            deploymentAttestation,
          )) {
            fail(error);
          }
          for (const error of validateP9PostCutoverReceiptV2(
            postValue,
            entryReceiptForBinding,
            deploymentRecord,
            evidenceContext,
            sha256File(P9_POST_CUTOVER_EVIDENCE_PATH),
            postAttestation,
          )) {
            fail(error);
          }
          const candidateCommit = gitText(['rev-parse', 'HEAD'])?.trim() ?? '';
          for (const error of validateP9DeploymentGitBindingV2(
            deploymentRecord,
            evidenceContext,
            candidateCommit,
            {
              objectExists: gitObjectExists,
              isAncestor,
              blobSha256: gitBlobSha256,
              changedRuntimePaths: (runtimeCommit, finalCandidateCommit) =>
                gitLines([
                  'diff',
                  '--name-only',
                  runtimeCommit,
                  finalCandidateCommit,
                  '--',
                  ...P9_RUNTIME_EQUIVALENCE_PATHS,
                ]),
              changedTrustedProofPaths: (
                revision7CandidateCommit,
                workflowCommit,
              ) =>
                gitLines([
                  'diff',
                  '--name-only',
                  revision7CandidateCommit,
                  workflowCommit,
                  '--',
                  ...P9_TRUSTED_PROOF_PATHS,
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
    }

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
      const p9DeliveryAuthorization = state.deployment.stageMergeAuthorizations.find(
        (item) => item.stageId === 'P9',
      );
      if (state.planRevision < 10) {
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
      } else if (
        !p9MayUseProduction &&
        (
          p9DeliveryAuthorization?.authorized !== false ||
          p9DeliveryAuthorization.authorizedBy !== null ||
          p9DeliveryAuthorization.authorizedAt !== null ||
          p9DeliveryAuthorization.evidencePath !== null ||
          !p9DeliveryAuthorization.basis.includes('prospectively supersede')
        )
      ) {
        fail('Plan Revision 10 requires the former P9 delivery authority to remain historical and replacement P9 to be unauthorized');
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

    if (state.planRevision >= 8) {
      const p8rDeliveryAuthorization = state.deployment.stageMergeAuthorizations.find(
        (item) => item.stageId === 'P8R',
      );
      if (
        p8rDeliveryAuthorization?.authorized !== true ||
        p8rDeliveryAuthorization.evidencePath !== 'docs/evidence/PLAN-REV8.md'
      ) {
        fail('Plan Revision 8 requires P8R delivery authority bound to PLAN-REV8 evidence');
      }
      if (attestedRevision8) {
        const revision8CandidateState = jsonAtCommit<BuildState>(
          attestedRevision8.candidateCommit,
          'docs/BUILD_STATE.json',
        );
        const changedP8RDelivery = revision8CandidateState
          ? changedStandingAuthorization(
              state.deployment.stageMergeAuthorizations,
              revision8CandidateState.deployment.stageMergeAuthorizations,
              ['P8R'],
            )
          : 'P8R';
        if (changedP8RDelivery) {
          fail('P8R Plan Revision 8 delivery authorization cannot be deleted, disabled, or changed');
        }
        const revision8EvidencePath = 'docs/evidence/PLAN-REV8.md';
        const canonicalRevision8Evidence = gitText([
          'show',
          `${attestedRevision8.candidateCommit}:${revision8EvidencePath}`,
        ]);
        if (
          canonicalRevision8Evidence === null ||
          requireFile(revision8EvidencePath) !== canonicalRevision8Evidence
        ) {
          fail('Plan Revision 8 authority evidence must remain byte-identical to its immutable candidate');
        }
      }
    }

    if (state.planRevision >= 9) {
      const p8fDeliveryAuthorization = state.deployment.stageMergeAuthorizations.find(
        (item) => item.stageId === 'P8F',
      );
      if (
        p8fDeliveryAuthorization?.authorized !== true ||
        p8fDeliveryAuthorization.evidencePath !== 'docs/evidence/PLAN-REV9.md'
      ) {
        fail('Plan Revision 9 requires P8F delivery authority bound to PLAN-REV9 evidence');
      }
      if (attestedRevision9) {
        const revision9CandidateState = jsonAtCommit<BuildState>(
          attestedRevision9.candidateCommit,
          'docs/BUILD_STATE.json',
        );
        const changedP8FDelivery = revision9CandidateState
          ? changedStandingAuthorization(
              state.deployment.stageMergeAuthorizations,
              revision9CandidateState.deployment.stageMergeAuthorizations,
              ['P8F'],
            )
          : 'P8F';
        if (changedP8FDelivery) {
          fail('P8F Plan Revision 9 delivery authorization cannot be deleted, disabled, or changed');
        }
        const revision9EvidencePath = 'docs/evidence/PLAN-REV9.md';
        const canonicalRevision9Evidence = gitText([
          'show',
          `${attestedRevision9.candidateCommit}:${revision9EvidencePath}`,
        ]);
        if (
          canonicalRevision9Evidence === null ||
          requireFile(revision9EvidencePath) !== canonicalRevision9Evidence
        ) {
          fail('Plan Revision 9 authority evidence must remain byte-identical to its immutable candidate');
        }
      }
    }

    if (state.planRevision >= 10) {
      const p8m = state.stages.find((item) => item.id === 'P8M');
      const p8mAuthorization = state.deployment.stageMergeAuthorizations.find(
        (item) => item.stageId === 'P8M',
      );
      if (
        p8m?.status === 'planned' &&
        state.planRevision < 12 &&
        p8mAuthorization?.authorized !== false
      ) {
        fail('Plan Revision 10 requires planned P8M to remain unauthorized');
      }
      if (
        p8m?.status === 'planned' &&
        state.planRevision >= 12 &&
        p8mAuthorization?.authorized !== true
      ) {
        fail('Plan Revision 12 requires the exact bounded no-write P8M authorization');
      }
      if (
        p8m?.status === 'planned' &&
        !state.deployment.deliveryBlockers.some((item) => item.startsWith('P8M-'))
      ) {
        fail('Plan Revision 10 requires the direct-authority P8M delivery blocker');
      }
      if (attestedRevision10) {
        const revision10ContractPath =
          'docs/evidence/PLAN-REV10-matching-fact-contract.json';
        const canonicalContract = gitText([
          'show',
          `${attestedRevision10.candidateCommit}:${revision10ContractPath}`,
        ]);
        if (
          canonicalContract === null ||
          requireFile(revision10ContractPath) !== canonicalContract
        ) {
          fail('Plan Revision 10 matching-fact contract must remain byte-identical');
        }
      }
    }

    if (state.planRevision < 10 && p9?.status === 'accepted') {
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
  if (state.planRevision >= 8) {
    for (const phrase of [
      'volatile browser memory',
      'typed, accepted public eligibility fact',
      'unmodeled eligibility remains a possible match',
      'The existing legacy `{data}` API compatibility payload',
      'Any scholarship spreadsheet read or write',
    ]) {
      if (!plan.includes(phrase)) {
        fail(`Plan Revision 8 is missing interview-restoration safety text: ${phrase}`);
      }
    }
    if (
      !state.invariants.includes(
        'Never transmit or persist student interview answers; process them only in volatile browser memory.',
      )
    ) {
      fail('Plan Revision 8 requires the exact interview-answer privacy invariant');
    }
  }
  if (state.planRevision >= 9) {
    for (const phrase of [
      'Former interview detail and routing restoration',
      'no distinct ADD question',
      'explicit contradictory typed answer',
      'retained/safely-replaced/retired',
      'matched-row payload',
    ]) {
      if (!plan.includes(phrase)) {
        fail(`Plan Revision 9 is missing former-interview safety text: ${phrase}`);
      }
    }
    if (
      !state.invariants.includes(
        'Never treat a sensitive nonselection, unanswered field, or prefer-not-to-answer state as an eligibility contradiction.',
      )
    ) {
      fail('Plan Revision 9 requires the exact sensitive-nonanswer invariant');
    }
    requireFile('docs/evidence/PLAN-REV9-interview-inventory.md');
  }
  if (state.planRevision >= 10) {
    for (const phrase of [
      'Matching-fact enrichment and acceptance',
      'validated immutable versioned publication',
      'legacy comparison-only',
      'Edit access is capability, not operation authority',
      'P8M accepted and delivered',
    ]) {
      if (!plan.includes(phrase)) {
        fail(`Plan Revision 10 is missing master/matching governance text: ${phrase}`);
      }
    }
    requireFile('docs/evidence/PLAN-REV10-matching-fact-contract.json');
    requireFile('docs/kickoffs/P8M-MATCHING-FACT-ENRICHMENT.md');
  }
  if (state.planRevision >= 11) {
    for (const phrase of [
      'Late authority for an undelivered plan amendment',
      'exact Revision 10 candidate and attestation',
      'Stop before P8M access',
    ]) {
      if (!plan.includes(phrase)) {
        fail(`Plan Revision 11 is missing late-delivery safety text: ${phrase}`);
      }
    }
    requireFile('docs/evidence/PLAN-REV11.md');
    requireFile('docs/kickoffs/PLAN-REV11-REV10-LATE-DELIVERY.md');
  }
  if (state.planRevision >= 12) {
    for (const phrase of [
      'Row-source correction and incomplete-fact progress',
      '197 populated rows',
      'not source denominators',
      'blank source cells remain unknown',
    ]) {
      if (!plan.includes(phrase)) {
        fail(`Plan Revision 12 is missing row-source correction text: ${phrase}`);
      }
    }
    requireFile('docs/evidence/PLAN-REV12.md');
    requireFile('docs/kickoffs/PLAN-REV12-ROW-SOURCE-CORRECTION.md');
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
  if (state.planRevision >= 8) {
    for (const phrase of [
      'Plan Revision 8 and P8R boundary',
      'volatile browser',
      'typed accepted',
    ]) {
      if (!agents.includes(phrase)) fail(`AGENTS.md is missing Revision 8 invariant: ${phrase}`);
    }
  }
  if (state.planRevision >= 9) {
    for (const phrase of [
      'Plan Revision 9 and P8F boundary',
      'ADD was not',
      'sensitive nonselection',
    ]) {
      if (!agents.includes(phrase)) fail(`AGENTS.md is missing Revision 9 invariant: ${phrase}`);
    }
  }
  if (
    state.planRevision >= 11 &&
    !agents.includes('Plan Revision 11 late-delivery boundary')
  ) {
    fail('AGENTS.md is missing the Plan Revision 11 late-delivery boundary');
  }
  if (
    state.planRevision >= 12 &&
    !agents.includes('Plan Revision 12 row-source correction boundary')
  ) {
    fail('AGENTS.md is missing the Plan Revision 12 row-source correction boundary');
  }
  if (state.planRevision >= 10) {
    for (const phrase of [
      'Plan Revision 10 and P8M boundary',
      'proposal-only',
      'Edit access is not automated-write authority',
    ]) {
      if (!agents.includes(phrase)) fail(`AGENTS.md is missing Revision 10 invariant: ${phrase}`);
    }
  }

  const decisions = content['docs/DECISIONS.md'];
  for (let i = 1; i <= 8; i++) {
    const id = `D-${String(i).padStart(3, '0')}`;
    if (!decisions.includes(`## ${id} —`)) fail(`Decision log is missing ${id}`);
  }
  if (state.planRevision >= 9 && !decisions.includes('## D-021 —')) {
    fail('Decision log is missing D-021');
  }
  if (state.planRevision >= 10 && !decisions.includes('## D-022 —')) {
    fail('Decision log is missing D-022');
  }
  if (state.planRevision >= 12 && !decisions.includes('## D-024 —')) {
    fail('Decision log is missing D-024');
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
