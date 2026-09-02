import { createHash } from 'node:crypto';

export const P9_PRODUCTION_SPREADSHEET_ID =
  '1eWGMdavcEECUcY_-nZ9gR2nMTN7T7T6oipG5ql1LoIE';

export const P9_TESTING_SPREADSHEET_ID =
  '1Dp5AMnrfSQ-Xf-r03S75lKsGPJk7o0inOgvC9Q6lOl4';

export const P9_ENTRY_EVIDENCE_PATH = 'docs/evidence/P9-entry.json';
export const P9_POST_CUTOVER_EVIDENCE_PATH =
  'docs/evidence/P9-post-cutover.json';
export const P9_DEPLOYMENT_EVIDENCE_PATH = 'docs/evidence/P9-deployment.json';
export const P9_IDENTITY_PIN_STAGE_ID = 'P9-IDENTITY-PINS';
export const P9_IDENTITY_PIN_EVIDENCE_PATH =
  'docs/evidence/P9-identity-pins.md';
export const P9_IDENTITY_PIN_MANIFEST_PATH =
  'docs/evidence/P9-identity-pins-manifest.json';
export const P9_IDENTITY_PIN_REVIEW_PATH =
  'docs/reviews/P9-identity-pins.json';
export const P9_READ_ONLY_OAUTH_SCOPE =
  'https://www.googleapis.com/auth/spreadsheets.readonly';
export const P9_RUNTIME_EQUIVALENCE_PATHS = [
  'web',
  '.github',
  'vercel.json',
  '.vercelignore',
] as const;

export const P9_AUTHORIZED_PRODUCTION_TABS = [
  {
    sheetId: 405588227,
    title: 'Resource: WHS Senior Scholarships_Updated 2_3_26',
    rowCount: 807,
    columnCount: 27,
    boundedRange: "'Resource: WHS Senior Scholarships_Updated 2_3_26'!A1:AA807",
  },
  {
    sheetId: 1998253810,
    title: 'Resource: "Unique" Finds_Updated 10_2_25',
    rowCount: 973,
    columnCount: 29,
    boundedRange: "'Resource: \"Unique\" Finds_Updated 10_2_25'!A1:AC973",
  },
] as const;

export const P9_VERIFIED_BACKUPS = [
  {
    sourceSheetId: 405588227,
    backupSpreadsheetId: '1_UARat1DIg9ZW2ciViVFK5gH51vk8VAr1CvNo4lLcZI',
    nativeCellPayloadSha256:
      'e67b548d3835eb0e37c78f685cbced8932771314c530682dfe781a95a9ec6551',
  },
  {
    sourceSheetId: 1998253810,
    backupSpreadsheetId: '1RIxFui5dAX7ieC_iqWdJ1IuxImWC7S_rs3N2fgUX9yw',
    nativeCellPayloadSha256:
      '019e08e246d8180cdd62a75ec1ee79936b02ee5a5032e897bd2f00a947e9d2ed',
  },
] as const;

export type P9ProductionAuthorization = {
  authorizationId: string;
  authorized: boolean;
  authorizedBy: string;
  authorizedAt: string;
  evidencePath: string;
  spreadsheetId: string;
  spreadsheetTitle: string;
  accessMode: 'read-only';
  sourceReadAuthorized: boolean;
  applicationConfigurationSwitchAuthorized: boolean;
  productionMutationAuthorized: false;
  preEntryControlDeviationRecorded: boolean;
  preEntryControlDeviationEvidencePath: string;
  currentBackupRequired: boolean;
  backupVerified: boolean;
  runtimeReadPermissionVerificationRequired: boolean;
  runtimeReadPermissionVerified: boolean;
  runtimeReadPermissionEvidencePath: string;
  runtimePrincipalDirectReaderVerificationRequired: boolean;
  runtimePrincipalDirectReaderVerified: boolean;
  runtimePrincipalFingerprintSha256: string | null;
  runtimePrincipalDirectReaderEvidencePath: string;
  backupRuntimeReadPermissionVerificationRequired: boolean;
  backupRuntimeReadPermissionVerified: boolean;
  backupRuntimePrincipalFingerprintSha256: string | null;
  backupRuntimeReadPermissionEvidencePath: string;
  providerTargetIdentityPinningRequired: boolean;
  providerTargetIdentityPinned: boolean;
  providerProjectFingerprintSha256: string | null;
  providerTeamFingerprintSha256: string | null;
  providerCanonicalProductionHostnameSha256: string | null;
  providerTargetIdentityEvidencePath: string;
  hostedVerificationEnvironmentVerificationRequired: boolean;
  hostedVerificationEnvironmentVerified: boolean;
  hostedVerificationEnvironmentFingerprintSha256: string | null;
  hostedVerificationEnvironmentEvidencePath: string;
  runtimeCredentialProvenanceVerificationRequired: boolean;
  runtimeCredentialProvenanceVerified: boolean;
  runtimeCredentialProvenanceFingerprintSha256: string | null;
  runtimeCredentialProvenanceEvidencePath: string;
  identityPinAttestationRequired: true;
  identityPinStageId: 'P9-IDENTITY-PINS';
  identityPinEvidencePath: 'docs/evidence/P9-identity-pins.md';
  identityPinManifestPath: 'docs/evidence/P9-identity-pins-manifest.json';
  identityPinReviewPath: 'docs/reviews/P9-identity-pins.json';
  entrySourceReverificationRequired: boolean;
  entrySourceReverificationVerified: boolean;
  entrySourceReverificationEvidencePath: string;
  deployedApplicationReadPathVerificationRequired: boolean;
  deployedApplicationReadPathVerified: boolean;
  deployedApplicationReadPathEvidencePath: string;
  postCutoverNonMutationVerificationRequired: boolean;
  postCutoverNonMutationVerified: boolean;
  postCutoverNonMutationEvidencePath: string;
  deploymentRecordEvidencePath: string;
  evidenceSchemaVersion: 2;
  trustedWorkflowPath: '.github/workflows/p9-evidence.yml';
  trustedProofScriptPath: 'web/scripts/p9-trusted-proof.ts';
  trustedWorkflowMode: 'manual-protected-default-branch-only';
  trustedEvidencePhases: ['entry', 'cutover', 'rollback', 'restored-cutover', 'finalize'];
  runtimeDeploymentStrategy: 'same-rollback-safe-commit-three-deployments';
  legacyReceiptSchemasAccepted: false;
  writeIsolationProofRequired: true;
  deploymentOwner: string;
  rollbackOwner: string;
  authorizedTabs: Array<{
    sheetId: number;
    title: string;
    rowCount: number;
    columnCount: number;
    boundedRange: string;
  }>;
  backupReceipt: {
    sourceRevisionId: string;
    sourceRevisionAfterCopyAndReadback: string;
    sourceModifiedTime: string;
    capturedAt: string;
    scope: 'authorized-scholarship-tabs-only';
    backups: Array<{
      sourceSheetId: number;
      backupSpreadsheetId: string;
      nativeCellPayloadSha256: string;
    }>;
  };
  basis: string;
  scope: string;
};

export type P9TestingWriteAuthorization = {
  authorizationId: string;
  authorized: boolean;
  authorizedBy: string;
  authorizedAt: string;
  evidencePath: string;
  spreadsheetId: string;
  exactTargetSelectionRequired: boolean;
  revisionFingerprintRequired: boolean;
  reversibleBackupRequired: boolean;
  reviewedDryRunRequired: boolean;
  readbackReconciliationRequired: boolean;
  basis: string;
  scope: string;
};

export type P9DataAuthority = {
  testingSpreadsheetId: string;
  p9TestingWriteAuthorization?: P9TestingWriteAuthorization;
  productionSpreadsheetId: string | null;
  productionMutationAuthorized: boolean;
  productionAuthorization: P9ProductionAuthorization | null;
};

export type P9IdentityPins = {
  runtimePrincipalFingerprintSha256: string;
  backupRuntimePrincipalFingerprintSha256: string;
  providerProjectFingerprintSha256: string;
  providerTeamFingerprintSha256: string;
  providerCanonicalProductionHostnameSha256: string;
  hostedVerificationEnvironmentFingerprintSha256: string;
  runtimeCredentialProvenanceFingerprintSha256: string;
};

type P9TabFingerprint = {
  sheetId: number;
  title: string;
  rowCount: number;
  columnCount: number;
  boundedRange: string;
  sourceNativeCellPayloadSha256: string;
};

export type P9EntryReceipt = {
  schemaVersion: number;
  stageId: string;
  verifiedAt: string;
  productionSpreadsheetId: string;
  accessMode: string;
  oauthScope: string;
  runtimeIdentityAccessMethod: string;
  runtimeIdentityFingerprintSha256: string;
  runtimeReadPermissionVerified: boolean;
  sourceRevisionBefore: string;
  sourceRevisionAfter: string;
  authorizedTabsOnly: boolean;
  productionSharingChanged: boolean;
  zeroProductionWritesObserved: boolean;
  tabs: Array<P9TabFingerprint & {
    backupSpreadsheetId: string;
    backupNativeCellPayloadSha256: string;
    sourceMatchesBackup: boolean;
  }>;
};

export type P9PostCutoverReceipt = {
  schemaVersion: number;
  stageId: string;
  verifiedAt: string;
  productionSpreadsheetId: string;
  deployedCommit: string;
  rollbackCommit: string;
  deploymentEvidencePath: string;
  cutoverConfigurationFingerprintSha256: string;
  rollbackConfigurationFingerprintSha256: string;
  oauthScope: string;
  sourceRevisionBeforeDeployment: string;
  sourceRevisionAfterDeploymentSmoke: string;
  sourceRevisionAfterRollbackProof: string;
  authorizedTabsOnly: boolean;
  productionSharingChanged: boolean;
  productionWriteCallsObserved: number;
  productionWriteIsolationTestsPassed: boolean;
  configurationRollbackVerified: boolean;
  tabs: P9TabFingerprint[];
};

export type P9CutoverConfiguration = {
  schemaVersion: number;
  sourceMode: string;
  readSpreadsheetId: string;
  readOAuthScope: string;
  writeSpreadsheetId: string;
  productionWritesDisabled: boolean;
  authorizedTabs: Array<{
    sheetId: number;
    title: string;
    rowCount: number;
    columnCount: number;
    boundedRange: string;
  }>;
  runtimeIdentityFingerprintSha256: string;
};

export type P9RollbackConfiguration = {
  schemaVersion: number;
  sourceMode: string;
  readSpreadsheetId: null;
  readOAuthScope: null;
  writeSpreadsheetId: string;
  productionWritesDisabled: boolean;
};

export type P9DeploymentRecord = {
  schemaVersion: number;
  stageId: string;
  verifiedAt: string;
  provider: string;
  providerAuthenticationMethod: string;
  providerAuthenticationVerified: boolean;
  providerProjectFingerprintSha256: string;
  environment: string;
  deploymentId: string;
  deploymentStatus: string;
  deploymentUrlSha256: string;
  deploymentHealthObservedAt: string;
  deploymentHealthStatusCode: number;
  deploymentHealthCommit: string;
  rollbackDeploymentId: string;
  rollbackStatus: string;
  rollbackUrlSha256: string;
  rollbackHealthObservedAt: string;
  rollbackHealthStatusCode: number;
  rollbackHealthCommit: string;
  deployedCommit: string;
  rollbackCommit: string;
  cutoverConfiguration: P9CutoverConfiguration;
  rollbackConfiguration: P9RollbackConfiguration;
  cutoverConfigurationFingerprintSha256: string;
  rollbackConfigurationFingerprintSha256: string;
  runtimeEquivalentToCandidate: boolean;
};

export type P9GitBindingProbe = {
  objectExists: (commit: string) => boolean;
  isAncestor: (ancestor: string, descendant: string) => boolean;
  changedRuntimePaths: (deployedCommit: string, candidateCommit: string) => string[];
};

export function p9ReadOnlyAuthorityChanged(
  current: P9DataAuthority,
  canonical: P9DataAuthority,
): boolean {
  const normalizedCurrent = structuredClone(current);
  const normalizedCanonical = structuredClone(canonical);

  // Plan Revision 10 adds a separately governed source-transition object while
  // preserving every Revision 7 production/testing authority byte. It is not part
  // of the historical P9 authority comparison.
  delete (normalizedCurrent as P9DataAuthority & { sourceTransition?: unknown })
    .sourceTransition;
  delete (normalizedCanonical as P9DataAuthority & { sourceTransition?: unknown })
    .sourceTransition;

  // P9 may flip only predeclared proof-state booleans after Revision 7. The
  // seven identity fingerprints may transition once through the separately
  // validated P9-IDENTITY-PINS direct-child attestation. Its fixed paths and
  // every other authority fact remain immutable in this comparison.
  for (const authority of [
    normalizedCurrent.productionAuthorization,
    normalizedCanonical.productionAuthorization,
  ]) {
    if (authority) {
      authority.runtimeReadPermissionVerified = false;
      authority.runtimePrincipalDirectReaderVerified = false;
      authority.backupRuntimeReadPermissionVerified = false;
      authority.providerTargetIdentityPinned = false;
      authority.hostedVerificationEnvironmentVerified = false;
      authority.runtimeCredentialProvenanceVerified = false;
      authority.entrySourceReverificationVerified = false;
      authority.deployedApplicationReadPathVerified = false;
      authority.postCutoverNonMutationVerified = false;
      authority.runtimePrincipalFingerprintSha256 = null;
      authority.backupRuntimePrincipalFingerprintSha256 = null;
      authority.providerProjectFingerprintSha256 = null;
      authority.providerTeamFingerprintSha256 = null;
      authority.providerCanonicalProductionHostnameSha256 = null;
      authority.hostedVerificationEnvironmentFingerprintSha256 = null;
      authority.runtimeCredentialProvenanceFingerprintSha256 = null;
    }
  }

  return !sameJson(normalizedCurrent, normalizedCanonical);
}

function isIsoUtcTimestamp(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value);
}

function sameJson(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function isSha256(value: string): boolean {
  return /^[0-9a-f]{64}$/.test(value);
}

function isNullOrSha256(value: string | null): boolean {
  return value === null || isSha256(value);
}

export function getCompleteP9IdentityPins(
  authorization: P9ProductionAuthorization,
): P9IdentityPins | null {
  const runtimePrincipalFingerprintSha256 =
    authorization.runtimePrincipalFingerprintSha256;
  const backupRuntimePrincipalFingerprintSha256 =
    authorization.backupRuntimePrincipalFingerprintSha256;
  const providerProjectFingerprintSha256 =
    authorization.providerProjectFingerprintSha256;
  const providerTeamFingerprintSha256 =
    authorization.providerTeamFingerprintSha256;
  const providerCanonicalProductionHostnameSha256 =
    authorization.providerCanonicalProductionHostnameSha256;
  const hostedVerificationEnvironmentFingerprintSha256 =
    authorization.hostedVerificationEnvironmentFingerprintSha256;
  const runtimeCredentialProvenanceFingerprintSha256 =
    authorization.runtimeCredentialProvenanceFingerprintSha256;
  if (
    runtimePrincipalFingerprintSha256 === null ||
    backupRuntimePrincipalFingerprintSha256 === null ||
    providerProjectFingerprintSha256 === null ||
    providerTeamFingerprintSha256 === null ||
    providerCanonicalProductionHostnameSha256 === null ||
    hostedVerificationEnvironmentFingerprintSha256 === null ||
    runtimeCredentialProvenanceFingerprintSha256 === null ||
    !isSha256(runtimePrincipalFingerprintSha256) ||
    !isSha256(backupRuntimePrincipalFingerprintSha256) ||
    !isSha256(providerProjectFingerprintSha256) ||
    !isSha256(providerTeamFingerprintSha256) ||
    !isSha256(providerCanonicalProductionHostnameSha256) ||
    !isSha256(hostedVerificationEnvironmentFingerprintSha256) ||
    !isSha256(runtimeCredentialProvenanceFingerprintSha256) ||
    runtimePrincipalFingerprintSha256 !==
      backupRuntimePrincipalFingerprintSha256
  ) {
    return null;
  }
  return {
    runtimePrincipalFingerprintSha256,
    backupRuntimePrincipalFingerprintSha256,
    providerProjectFingerprintSha256,
    providerTeamFingerprintSha256,
    providerCanonicalProductionHostnameSha256,
    hostedVerificationEnvironmentFingerprintSha256,
    runtimeCredentialProvenanceFingerprintSha256,
  };
}

export function hasAnyP9IdentityPin(
  authorization: P9ProductionAuthorization,
): boolean {
  return [
    authorization.runtimePrincipalFingerprintSha256,
    authorization.backupRuntimePrincipalFingerprintSha256,
    authorization.providerProjectFingerprintSha256,
    authorization.providerTeamFingerprintSha256,
    authorization.providerCanonicalProductionHostnameSha256,
    authorization.hostedVerificationEnvironmentFingerprintSha256,
    authorization.runtimeCredentialProvenanceFingerprintSha256,
  ].some((value) => value !== null);
}

export function p9IdentityPinsChanged(
  current: P9ProductionAuthorization,
  canonical: P9ProductionAuthorization,
): boolean {
  const values = (authorization: P9ProductionAuthorization) => ({
    runtimePrincipalFingerprintSha256:
      authorization.runtimePrincipalFingerprintSha256,
    backupRuntimePrincipalFingerprintSha256:
      authorization.backupRuntimePrincipalFingerprintSha256,
    providerProjectFingerprintSha256:
      authorization.providerProjectFingerprintSha256,
    providerTeamFingerprintSha256:
      authorization.providerTeamFingerprintSha256,
    providerCanonicalProductionHostnameSha256:
      authorization.providerCanonicalProductionHostnameSha256,
    hostedVerificationEnvironmentFingerprintSha256:
      authorization.hostedVerificationEnvironmentFingerprintSha256,
    runtimeCredentialProvenanceFingerprintSha256:
      authorization.runtimeCredentialProvenanceFingerprintSha256,
  });
  return !sameJson(values(current), values(canonical));
}

export type P9IdentityPinAttestationPresence = {
  anyCurrentPin: boolean;
  currentArtifactCount: number;
  historicalAttemptCount: number;
  canonicalAttestationPresent: boolean;
};

export function validateP9IdentityPinAttestationPresence(
  presence: P9IdentityPinAttestationPresence,
): string[] {
  const errors: string[] = [];
  if (
    !Number.isInteger(presence.currentArtifactCount) ||
    presence.currentArtifactCount < 0 ||
    !Number.isInteger(presence.historicalAttemptCount) ||
    presence.historicalAttemptCount < 0
  ) {
    return ['P9 identity-pin attestation presence counts are invalid'];
  }
  if (!presence.canonicalAttestationPresent) {
    if (
      presence.anyCurrentPin ||
      presence.currentArtifactCount > 0 ||
      presence.historicalAttemptCount > 0
    ) {
      errors.push(
        'P9 identity pins and their files are forbidden without a canonical independently accepted direct-child P9-IDENTITY-PINS attestation',
      );
    }
    return errors;
  }
  if (
    !presence.anyCurrentPin ||
    presence.currentArtifactCount !== 3 ||
    presence.historicalAttemptCount !== 1
  ) {
    errors.push(
      'Canonical P9-IDENTITY-PINS history requires the complete current pin set and all three immutable artifacts',
    );
  }
  return errors;
}

function expectedTabFingerprint(
  tab: (typeof P9_AUTHORIZED_PRODUCTION_TABS)[number],
): P9TabFingerprint {
  const backup = P9_VERIFIED_BACKUPS.find(
    (item) => item.sourceSheetId === tab.sheetId,
  );
  return {
    ...tab,
    sourceNativeCellPayloadSha256: backup?.nativeCellPayloadSha256 ?? '',
  };
}

export function validateP9EntryReceipt(receipt: P9EntryReceipt): string[] {
  // Schema v1 is permanently fail-closed. P9 acceptance must use the strict,
  // OIDC-attested v2 chain in p9-evidence-v2.ts.
  if (receipt.schemaVersion === 1) {
    return ['P9 schema-v1 entry receipts are unauthenticated and forbidden'];
  }
  const errors: string[] = [];
  const expectedTabs = P9_AUTHORIZED_PRODUCTION_TABS.map((tab) => {
    const fingerprint = expectedTabFingerprint(tab);
    const backup = P9_VERIFIED_BACKUPS.find(
      (item) => item.sourceSheetId === tab.sheetId,
    )!;
    return {
      ...fingerprint,
      backupSpreadsheetId: backup.backupSpreadsheetId,
      backupNativeCellPayloadSha256: backup.nativeCellPayloadSha256,
      sourceMatchesBackup: true,
    };
  });

  if (
    receipt.schemaVersion !== 1 ||
    receipt.stageId !== 'P9' ||
    !isIsoUtcTimestamp(receipt.verifiedAt) ||
    receipt.productionSpreadsheetId !== P9_PRODUCTION_SPREADSHEET_ID
  ) {
    errors.push('P9 entry receipt identity or timestamp is invalid');
  }
  if (
    receipt.accessMode !== 'read-only' ||
    receipt.oauthScope !== P9_READ_ONLY_OAUTH_SCOPE ||
    receipt.runtimeIdentityAccessMethod !== 'deployed-runtime-authenticated-bounded-read' ||
    !isSha256(receipt.runtimeIdentityFingerprintSha256) ||
    receipt.runtimeReadPermissionVerified !== true
  ) {
    errors.push('P9 entry receipt does not prove the deployed runtime read-only identity');
  }
  if (
    receipt.sourceRevisionBefore !== '9857' ||
    receipt.sourceRevisionAfter !== '9857' ||
    receipt.authorizedTabsOnly !== true ||
    receipt.productionSharingChanged !== false ||
    receipt.zeroProductionWritesObserved !== true
  ) {
    errors.push('P9 entry receipt does not close the exact-revision zero-mutation check');
  }
  if (!sameJson(receipt.tabs, expectedTabs)) {
    errors.push('P9 entry receipt tab dimensions or source/backup fingerprints changed');
  }
  return errors;
}

export function validateP9PostCutoverReceipt(
  receipt: P9PostCutoverReceipt,
): string[] {
  if (receipt.schemaVersion === 1) {
    return ['P9 schema-v1 post-cutover receipts are unauthenticated and forbidden'];
  }
  const errors: string[] = [];
  const expectedTabs = P9_AUTHORIZED_PRODUCTION_TABS.map(expectedTabFingerprint);
  if (
    receipt.schemaVersion !== 1 ||
    receipt.stageId !== 'P9' ||
    !isIsoUtcTimestamp(receipt.verifiedAt) ||
    receipt.productionSpreadsheetId !== P9_PRODUCTION_SPREADSHEET_ID ||
    !/^[0-9a-f]{40}$/.test(receipt.deployedCommit) ||
    !/^[0-9a-f]{40}$/.test(receipt.rollbackCommit) ||
    receipt.deployedCommit === receipt.rollbackCommit ||
    receipt.deploymentEvidencePath !== P9_DEPLOYMENT_EVIDENCE_PATH ||
    !isSha256(receipt.cutoverConfigurationFingerprintSha256) ||
    !isSha256(receipt.rollbackConfigurationFingerprintSha256) ||
    receipt.cutoverConfigurationFingerprintSha256 ===
      receipt.rollbackConfigurationFingerprintSha256
  ) {
    errors.push('P9 post-cutover receipt identity, timestamp, or commit binding is invalid');
  }
  if (
    receipt.oauthScope !== P9_READ_ONLY_OAUTH_SCOPE ||
    receipt.sourceRevisionBeforeDeployment !== '9857' ||
    receipt.sourceRevisionAfterDeploymentSmoke !== '9857' ||
    receipt.sourceRevisionAfterRollbackProof !== '9857' ||
    receipt.authorizedTabsOnly !== true ||
    receipt.productionSharingChanged !== false ||
    receipt.productionWriteCallsObserved !== 0 ||
    receipt.productionWriteIsolationTestsPassed !== true ||
    receipt.configurationRollbackVerified !== true
  ) {
    errors.push('P9 post-cutover receipt does not prove read-only deployment and rollback');
  }
  if (!sameJson(receipt.tabs, expectedTabs)) {
    errors.push('P9 post-cutover source revision dimensions or fingerprints changed');
  }
  return errors;
}

export function fingerprintP9Configuration(
  value: P9CutoverConfiguration | P9RollbackConfiguration,
): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

export function validateP9DeploymentRecord(
  record: P9DeploymentRecord,
  receipt: P9PostCutoverReceipt,
  entryReceipt: P9EntryReceipt,
): string[] {
  if (
    record.schemaVersion === 1 ||
    receipt.schemaVersion === 1 ||
    entryReceipt.schemaVersion === 1
  ) {
    return ['P9 schema-v1 deployment evidence is self-asserted and forbidden'];
  }
  const errors: string[] = [];
  const expectedCutoverConfiguration: P9CutoverConfiguration = {
    schemaVersion: 1,
    sourceMode: 'production-google-sheet-read-only',
    readSpreadsheetId: P9_PRODUCTION_SPREADSHEET_ID,
    readOAuthScope: P9_READ_ONLY_OAUTH_SCOPE,
    writeSpreadsheetId: P9_TESTING_SPREADSHEET_ID,
    productionWritesDisabled: true,
    authorizedTabs: P9_AUTHORIZED_PRODUCTION_TABS.map((tab) => ({ ...tab })),
    runtimeIdentityFingerprintSha256:
      entryReceipt.runtimeIdentityFingerprintSha256,
  };
  const expectedRollbackConfiguration: P9RollbackConfiguration = {
    schemaVersion: 1,
    sourceMode: 'accepted-p7-static-catalog',
    readSpreadsheetId: null,
    readOAuthScope: null,
    writeSpreadsheetId: P9_TESTING_SPREADSHEET_ID,
    productionWritesDisabled: true,
  };
  const expectedCutoverFingerprint = fingerprintP9Configuration(
    expectedCutoverConfiguration,
  );
  const expectedRollbackFingerprint = fingerprintP9Configuration(
    expectedRollbackConfiguration,
  );
  if (
    record.schemaVersion !== 1 ||
    record.stageId !== 'P9' ||
    !isIsoUtcTimestamp(record.verifiedAt) ||
    record.provider !== 'vercel' ||
    record.providerAuthenticationMethod !== 'authenticated-vercel-api' ||
    record.providerAuthenticationVerified !== true ||
    !isSha256(record.providerProjectFingerprintSha256) ||
    record.environment !== 'preview-production-source-rollback-probe' ||
    !record.deploymentId.trim() ||
    record.deploymentStatus !== 'ready' ||
    !isSha256(record.deploymentUrlSha256) ||
    !isIsoUtcTimestamp(record.deploymentHealthObservedAt) ||
    record.deploymentHealthStatusCode !== 200 ||
    record.deploymentHealthCommit !== record.deployedCommit ||
    !record.rollbackDeploymentId.trim() ||
    record.deploymentId === record.rollbackDeploymentId ||
    record.rollbackStatus !== 'ready' ||
    !isSha256(record.rollbackUrlSha256) ||
    record.deploymentUrlSha256 === record.rollbackUrlSha256 ||
    !isIsoUtcTimestamp(record.rollbackHealthObservedAt) ||
    record.rollbackHealthStatusCode !== 200 ||
    record.rollbackHealthCommit !== record.rollbackCommit ||
    record.runtimeEquivalentToCandidate !== true
  ) {
    errors.push('P9 deployment record lacks distinct authenticated provider and health observations');
  }
  if (
    record.deployedCommit !== receipt.deployedCommit ||
    record.rollbackCommit !== receipt.rollbackCommit ||
    !sameJson(record.cutoverConfiguration, expectedCutoverConfiguration) ||
    !sameJson(record.rollbackConfiguration, expectedRollbackConfiguration) ||
    record.cutoverConfigurationFingerprintSha256 !== expectedCutoverFingerprint ||
    record.rollbackConfigurationFingerprintSha256 !== expectedRollbackFingerprint ||
    receipt.cutoverConfigurationFingerprintSha256 !== expectedCutoverFingerprint ||
    receipt.rollbackConfigurationFingerprintSha256 !== expectedRollbackFingerprint
  ) {
    errors.push('P9 deployment record is not canonically bound to entry, cutover, rollback, and post-cutover evidence');
  }
  return errors;
}

export function validateP9DeploymentGitBinding(
  receipt: P9PostCutoverReceipt,
  expectedRollbackBaseline: string,
  candidateCommit: string,
  probe: P9GitBindingProbe,
): string[] {
  if (receipt.schemaVersion === 1) {
    return ['P9 schema-v1 Git binding cannot authenticate deployment evidence'];
  }
  const errors: string[] = [];
  if (
    !probe.objectExists(receipt.deployedCommit) ||
    !probe.objectExists(receipt.rollbackCommit) ||
    !probe.objectExists(candidateCommit)
  ) {
    errors.push('P9 deployment and rollback commits must exist as Git objects');
    return errors;
  }
  if (receipt.rollbackCommit !== expectedRollbackBaseline) {
    errors.push('P9 rollback commit must equal the exact P9 baseline');
  }
  if (!probe.isAncestor(receipt.rollbackCommit, receipt.deployedCommit)) {
    errors.push('P9 deployed commit must descend from the exact rollback baseline');
  }
  if (!probe.isAncestor(receipt.deployedCommit, candidateCommit)) {
    errors.push('P9 deployed commit must be an ancestor of the final P9 candidate');
  }
  const runtimeChanges = probe.changedRuntimePaths(
    receipt.deployedCommit,
    candidateCommit,
  );
  if (runtimeChanges.length > 0) {
    errors.push(
      `P9 candidate changed runtime paths after rollback probe: ${runtimeChanges.join(', ')}`,
    );
  }
  return errors;
}

export function validateP9ReadOnlyAuthority(
  dataAuthority: P9DataAuthority,
  options: {
    expectedEntryProofState: boolean;
    expectedPostCutoverProofState: boolean;
  },
): string[] {
  const errors: string[] = [];
  const authorization = dataAuthority.productionAuthorization;
  const testingAuthorization = dataAuthority.p9TestingWriteAuthorization;

  if (dataAuthority.testingSpreadsheetId !== P9_TESTING_SPREADSHEET_ID) {
    errors.push('P9 testing authority changed the pinned testing spreadsheet ID');
  }
  if (!testingAuthorization?.authorized) {
    errors.push('P9 requires structured testing-spreadsheet write authority');
  } else {
    if (
      testingAuthorization.spreadsheetId !== P9_TESTING_SPREADSHEET_ID ||
      !testingAuthorization.authorizationId.trim() ||
      !testingAuthorization.authorizedBy.trim() ||
      !isIsoUtcTimestamp(testingAuthorization.authorizedAt) ||
      !testingAuthorization.evidencePath.trim() ||
      !testingAuthorization.basis.trim() ||
      !testingAuthorization.scope.trim()
    ) {
      errors.push('P9 testing-spreadsheet authority identity or evidence is incomplete');
    }
    if (
      !testingAuthorization.exactTargetSelectionRequired ||
      !testingAuthorization.revisionFingerprintRequired ||
      !testingAuthorization.reversibleBackupRequired ||
      !testingAuthorization.reviewedDryRunRequired ||
      !testingAuthorization.readbackReconciliationRequired
    ) {
      errors.push('P9 testing writes must retain exact-target, backup, review, and readback gates');
    }
  }

  if (dataAuthority.productionSpreadsheetId !== P9_PRODUCTION_SPREADSHEET_ID) {
    errors.push('P9 production spreadsheet ID does not match the authorized identity');
  }
  if (dataAuthority.productionMutationAuthorized !== false) {
    errors.push('P9 production spreadsheet mutation must remain prohibited');
  }
  if (!authorization?.authorized) {
    errors.push('P9 requires structured read-only production authority');
    return errors;
  }
  if (
    authorization.spreadsheetId !== P9_PRODUCTION_SPREADSHEET_ID ||
    authorization.spreadsheetTitle !== 'Whitefish High School Senior Scholarships' ||
    !authorization.authorizationId.trim() ||
    !authorization.authorizedBy.trim() ||
    !isIsoUtcTimestamp(authorization.authorizedAt) ||
    !authorization.evidencePath.trim() ||
    !authorization.basis.trim() ||
    !authorization.scope.trim()
  ) {
    errors.push('P9 production authority identity or evidence is incomplete');
  }
  if (
    authorization.accessMode !== 'read-only' ||
    authorization.sourceReadAuthorized !== true ||
    authorization.applicationConfigurationSwitchAuthorized !== true ||
    authorization.productionMutationAuthorized !== false
  ) {
    errors.push('P9 production authority must remain a read-only source/configuration cutover');
  }
  if (
    authorization.preEntryControlDeviationRecorded !== true ||
    authorization.preEntryControlDeviationEvidencePath !== authorization.evidencePath
  ) {
    errors.push('Plan Revision 7 must retain the pre-entry production-access control deviation');
  }
  if (!authorization.deploymentOwner.trim() || !authorization.rollbackOwner.trim()) {
    errors.push('P9 requires named deployment and rollback owners');
  }
  if (!sameJson(authorization.authorizedTabs, P9_AUTHORIZED_PRODUCTION_TABS)) {
    errors.push('P9 authorized production tab identities or bounds changed');
  }
  if (
    !authorization.currentBackupRequired ||
    !authorization.backupVerified ||
    authorization.backupReceipt.sourceRevisionId !== '9857' ||
    authorization.backupReceipt.sourceRevisionAfterCopyAndReadback !== '9857' ||
    authorization.backupReceipt.sourceModifiedTime !== '2026-05-19T20:01:00.674Z' ||
    authorization.backupReceipt.scope !== 'authorized-scholarship-tabs-only' ||
    !isIsoUtcTimestamp(authorization.backupReceipt.capturedAt) ||
    !sameJson(authorization.backupReceipt.backups, P9_VERIFIED_BACKUPS)
  ) {
    errors.push('P9 production backup receipt changed or is incomplete');
  }
  if (authorization.runtimeReadPermissionVerificationRequired !== true) {
    errors.push('P9 must require deployed-runtime read-permission verification');
  }
  if (
    authorization.runtimeReadPermissionEvidencePath !== P9_ENTRY_EVIDENCE_PATH ||
    authorization.runtimePrincipalDirectReaderEvidencePath !== P9_ENTRY_EVIDENCE_PATH ||
    authorization.backupRuntimeReadPermissionEvidencePath !== P9_ENTRY_EVIDENCE_PATH ||
    authorization.providerTargetIdentityEvidencePath !== P9_ENTRY_EVIDENCE_PATH ||
    authorization.hostedVerificationEnvironmentEvidencePath !== P9_ENTRY_EVIDENCE_PATH ||
    authorization.runtimeCredentialProvenanceEvidencePath !== P9_ENTRY_EVIDENCE_PATH ||
    authorization.entrySourceReverificationEvidencePath !== P9_ENTRY_EVIDENCE_PATH ||
    authorization.deployedApplicationReadPathEvidencePath !==
      P9_POST_CUTOVER_EVIDENCE_PATH ||
    authorization.postCutoverNonMutationEvidencePath !== P9_POST_CUTOVER_EVIDENCE_PATH ||
    authorization.deploymentRecordEvidencePath !== P9_DEPLOYMENT_EVIDENCE_PATH
  ) {
    errors.push('P9 entry and post-cutover proofs must remain bound to their exact receipt paths');
  }
  if (
    authorization.runtimePrincipalDirectReaderVerificationRequired !== true ||
    authorization.backupRuntimeReadPermissionVerificationRequired !== true ||
    authorization.providerTargetIdentityPinningRequired !== true ||
    authorization.hostedVerificationEnvironmentVerificationRequired !== true ||
    authorization.runtimeCredentialProvenanceVerificationRequired !== true ||
    authorization.deployedApplicationReadPathVerificationRequired !== true
  ) {
    errors.push(
      'P9 must retain direct-reader, backup-read, provider-target, hosted-environment, credential-provenance, and deployed-read-path gates',
    );
  }
  if (
    authorization.identityPinAttestationRequired !== true ||
    authorization.identityPinStageId !== P9_IDENTITY_PIN_STAGE_ID ||
    authorization.identityPinEvidencePath !== P9_IDENTITY_PIN_EVIDENCE_PATH ||
    authorization.identityPinManifestPath !== P9_IDENTITY_PIN_MANIFEST_PATH ||
    authorization.identityPinReviewPath !== P9_IDENTITY_PIN_REVIEW_PATH
  ) {
    errors.push(
      'P9 identity pins must remain bound to the predeclared independently attested P9-IDENTITY-PINS record',
    );
  }
  const entryIdentityFingerprints = [
    authorization.runtimePrincipalFingerprintSha256,
    authorization.backupRuntimePrincipalFingerprintSha256,
    authorization.providerProjectFingerprintSha256,
    authorization.providerTeamFingerprintSha256,
    authorization.providerCanonicalProductionHostnameSha256,
    authorization.hostedVerificationEnvironmentFingerprintSha256,
    authorization.runtimeCredentialProvenanceFingerprintSha256,
  ];
  if (!entryIdentityFingerprints.every(isNullOrSha256)) {
    errors.push('P9 immutable operational identity fingerprints must be null or SHA-256');
  }
  if (
    hasAnyP9IdentityPin(authorization) &&
    getCompleteP9IdentityPins(authorization) === null
  ) {
    errors.push(
      'P9 operational identity pins must be populated together as one complete same-principal set',
    );
  }
  if (
    authorization.runtimePrincipalFingerprintSha256 !== null &&
    authorization.backupRuntimePrincipalFingerprintSha256 !== null &&
    authorization.runtimePrincipalFingerprintSha256 !==
      authorization.backupRuntimePrincipalFingerprintSha256
  ) {
    errors.push('P9 source and backup reads must be pinned to the same runtime principal');
  }
  if (
    authorization.evidenceSchemaVersion !== 2 ||
    authorization.trustedWorkflowPath !== '.github/workflows/p9-evidence.yml' ||
    authorization.trustedProofScriptPath !== 'web/scripts/p9-trusted-proof.ts' ||
    authorization.trustedWorkflowMode !== 'manual-protected-default-branch-only' ||
    !sameJson(authorization.trustedEvidencePhases, [
      'entry',
      'cutover',
      'rollback',
      'restored-cutover',
      'finalize',
    ]) ||
    authorization.runtimeDeploymentStrategy !==
      'same-rollback-safe-commit-three-deployments' ||
    authorization.legacyReceiptSchemasAccepted !== false ||
    authorization.writeIsolationProofRequired !== true
  ) {
    errors.push('P9 trusted evidence workflow or schema-v2 deployment contract changed');
  }
  if (
    authorization.entrySourceReverificationRequired !== true ||
    authorization.postCutoverNonMutationVerificationRequired !== true
  ) {
    errors.push('P9 must require exact-source entry and post-cutover zero-mutation proof');
  }
  if (
    authorization.runtimeReadPermissionVerified !== options.expectedEntryProofState ||
    authorization.runtimePrincipalDirectReaderVerified !==
      options.expectedEntryProofState ||
    authorization.backupRuntimeReadPermissionVerified !==
      options.expectedEntryProofState ||
    authorization.providerTargetIdentityPinned !== options.expectedEntryProofState ||
    authorization.hostedVerificationEnvironmentVerified !==
      options.expectedEntryProofState ||
    authorization.runtimeCredentialProvenanceVerified !==
      options.expectedEntryProofState ||
    authorization.entrySourceReverificationVerified !== options.expectedEntryProofState
  ) {
    errors.push(
      'P9 operational activation-gate proof state does not match its stage state',
    );
  }
  if (
    options.expectedEntryProofState &&
    getCompleteP9IdentityPins(authorization) === null
  ) {
    errors.push(
      'P9 cannot activate until exact immutable runtime, backup, provider, host, environment, and credential-provenance identities are pinned',
    );
  }
  if (
    authorization.deployedApplicationReadPathVerified !==
      options.expectedPostCutoverProofState ||
    authorization.postCutoverNonMutationVerified !==
      options.expectedPostCutoverProofState
  ) {
    errors.push(
      'P9 deployed application read-path and post-cutover zero-mutation proof state does not match its stage state',
    );
  }

  return errors;
}
