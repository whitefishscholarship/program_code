import assert from 'node:assert/strict';

import {
  P9_AUTHORIZED_PRODUCTION_TABS,
  P9_DEPLOYMENT_EVIDENCE_PATH,
  P9_ENTRY_EVIDENCE_PATH,
  P9_IDENTITY_PIN_EVIDENCE_PATH,
  P9_IDENTITY_PIN_MANIFEST_PATH,
  P9_IDENTITY_PIN_REVIEW_PATH,
  P9_IDENTITY_PIN_STAGE_ID,
  P9_POST_CUTOVER_EVIDENCE_PATH,
  P9_PRODUCTION_SPREADSHEET_ID,
  P9_READ_ONLY_OAUTH_SCOPE,
  P9_RUNTIME_EQUIVALENCE_PATHS,
  P9_TESTING_SPREADSHEET_ID,
  P9_VERIFIED_BACKUPS,
  getCompleteP9IdentityPins,
  hasAnyP9IdentityPin,
  p9IdentityPinsChanged,
  p9ReadOnlyAuthorityChanged,
  fingerprintP9Configuration,
  type P9CutoverConfiguration,
  type P9DataAuthority,
  type P9EntryReceipt,
  type P9DeploymentRecord,
  type P9PostCutoverReceipt,
  type P9RollbackConfiguration,
  validateP9DeploymentGitBinding,
  validateP9DeploymentRecord,
  validateP9EntryReceipt,
  validateP9IdentityPinAttestationPresence,
  validateP9PostCutoverReceipt,
  validateP9ReadOnlyAuthority,
} from './production-authority';

const authority: P9DataAuthority = {
  testingSpreadsheetId: P9_TESTING_SPREADSHEET_ID,
  p9TestingWriteAuthorization: {
    authorizationId: 'P9-testing-write-2026-08-30',
    authorized: true,
    authorizedBy: 'Kelsey Stuart',
    authorizedAt: '2026-08-30T18:51:00Z',
    evidencePath: 'docs/evidence/PLAN-REV7.md',
    spreadsheetId: P9_TESTING_SPREADSHEET_ID,
    exactTargetSelectionRequired: true,
    revisionFingerprintRequired: true,
    reversibleBackupRequired: true,
    reviewedDryRunRequired: true,
    readbackReconciliationRequired: true,
    basis: 'Direct testing-only write authority.',
    scope: 'Testing spreadsheet only after every per-write gate passes.',
  },
  productionSpreadsheetId: P9_PRODUCTION_SPREADSHEET_ID,
  productionMutationAuthorized: false,
  productionAuthorization: {
    authorizationId: 'P9-read-only-production-2026-08-30',
    authorized: true,
    authorizedBy: 'Kelsey Stuart',
    authorizedAt: '2026-08-30T18:51:00Z',
    evidencePath: 'docs/evidence/PLAN-REV7.md',
    spreadsheetId: P9_PRODUCTION_SPREADSHEET_ID,
    spreadsheetTitle: 'Whitefish High School Senior Scholarships',
    accessMode: 'read-only',
    sourceReadAuthorized: true,
    applicationConfigurationSwitchAuthorized: true,
    productionMutationAuthorized: false,
    preEntryControlDeviationRecorded: true,
    preEntryControlDeviationEvidencePath: 'docs/evidence/PLAN-REV7.md',
    currentBackupRequired: true,
    backupVerified: true,
    runtimeReadPermissionVerificationRequired: true,
    runtimeReadPermissionVerified: false,
    runtimeReadPermissionEvidencePath: P9_ENTRY_EVIDENCE_PATH,
    runtimePrincipalDirectReaderVerificationRequired: true,
    runtimePrincipalDirectReaderVerified: false,
    runtimePrincipalFingerprintSha256: null,
    runtimePrincipalDirectReaderEvidencePath: P9_ENTRY_EVIDENCE_PATH,
    backupRuntimeReadPermissionVerificationRequired: true,
    backupRuntimeReadPermissionVerified: false,
    backupRuntimePrincipalFingerprintSha256: null,
    backupRuntimeReadPermissionEvidencePath: P9_ENTRY_EVIDENCE_PATH,
    providerTargetIdentityPinningRequired: true,
    providerTargetIdentityPinned: false,
    providerProjectFingerprintSha256: null,
    providerTeamFingerprintSha256: null,
    providerCanonicalProductionHostnameSha256: null,
    providerTargetIdentityEvidencePath: P9_ENTRY_EVIDENCE_PATH,
    hostedVerificationEnvironmentVerificationRequired: true,
    hostedVerificationEnvironmentVerified: false,
    hostedVerificationEnvironmentFingerprintSha256: null,
    hostedVerificationEnvironmentEvidencePath: P9_ENTRY_EVIDENCE_PATH,
    runtimeCredentialProvenanceVerificationRequired: true,
    runtimeCredentialProvenanceVerified: false,
    runtimeCredentialProvenanceFingerprintSha256: null,
    runtimeCredentialProvenanceEvidencePath: P9_ENTRY_EVIDENCE_PATH,
    identityPinAttestationRequired: true,
    identityPinStageId: P9_IDENTITY_PIN_STAGE_ID,
    identityPinEvidencePath: P9_IDENTITY_PIN_EVIDENCE_PATH,
    identityPinManifestPath: P9_IDENTITY_PIN_MANIFEST_PATH,
    identityPinReviewPath: P9_IDENTITY_PIN_REVIEW_PATH,
    entrySourceReverificationRequired: true,
    entrySourceReverificationVerified: false,
    entrySourceReverificationEvidencePath: P9_ENTRY_EVIDENCE_PATH,
    deployedApplicationReadPathVerificationRequired: true,
    deployedApplicationReadPathVerified: false,
    deployedApplicationReadPathEvidencePath: P9_POST_CUTOVER_EVIDENCE_PATH,
    postCutoverNonMutationVerificationRequired: true,
    postCutoverNonMutationVerified: false,
    postCutoverNonMutationEvidencePath: P9_POST_CUTOVER_EVIDENCE_PATH,
    deploymentRecordEvidencePath: P9_DEPLOYMENT_EVIDENCE_PATH,
    evidenceSchemaVersion: 2,
    trustedWorkflowPath: '.github/workflows/p9-evidence.yml',
    trustedProofScriptPath: 'web/scripts/p9-trusted-proof.ts',
    trustedWorkflowMode: 'manual-protected-default-branch-only',
    trustedEvidencePhases: [
      'entry',
      'cutover',
      'rollback',
      'restored-cutover',
      'finalize',
    ],
    runtimeDeploymentStrategy: 'same-rollback-safe-commit-three-deployments',
    legacyReceiptSchemasAccepted: false,
    writeIsolationProofRequired: true,
    deploymentOwner: 'Kelsey Stuart',
    rollbackOwner: 'Kelsey Stuart',
    authorizedTabs: P9_AUTHORIZED_PRODUCTION_TABS.map((tab) => ({ ...tab })),
    backupReceipt: {
      sourceRevisionId: '9857',
      sourceRevisionAfterCopyAndReadback: '9857',
      sourceModifiedTime: '2026-05-19T20:01:00.674Z',
      capturedAt: '2026-08-30T18:36:18.588Z',
      scope: 'authorized-scholarship-tabs-only',
      backups: P9_VERIFIED_BACKUPS.map((backup) => ({ ...backup })),
    },
    basis: 'Direct read-only production source and delivery authority.',
    scope: 'Read-only production source cutover; no production spreadsheet mutation.',
  },
};

assert.deepEqual(
  validateP9ReadOnlyAuthority(authority, {
    expectedEntryProofState: false,
    expectedPostCutoverProofState: false,
  }),
  [],
);
assert.equal(p9ReadOnlyAuthorityChanged(authority, authority), false);
assert.equal(getCompleteP9IdentityPins(authority.productionAuthorization!), null);
assert.equal(hasAnyP9IdentityPin(authority.productionAuthorization!), false);
assert.deepEqual(
  validateP9IdentityPinAttestationPresence({
    anyCurrentPin: false,
    currentArtifactCount: 0,
    historicalAttemptCount: 0,
    canonicalAttestationPresent: false,
  }),
  [],
  'the predeclared future record may remain absent while every pin is null',
);
assert.notDeepEqual(
  validateP9IdentityPinAttestationPresence({
    anyCurrentPin: false,
    currentArtifactCount: 0,
    historicalAttemptCount: 1,
    canonicalAttestationPresent: false,
  }),
  [],
  'a malformed or rejected historical attestation attempt must fail closed',
);
assert.deepEqual(
  validateP9IdentityPinAttestationPresence({
    anyCurrentPin: true,
    currentArtifactCount: 3,
    historicalAttemptCount: 1,
    canonicalAttestationPresent: true,
  }),
  [],
  'a canonical historical attestation may proceed to full manifest, candidate, and byte-binding validation',
);
assert.notDeepEqual(
  validateP9IdentityPinAttestationPresence({
    anyCurrentPin: true,
    currentArtifactCount: 2,
    historicalAttemptCount: 1,
    canonicalAttestationPresent: true,
  }),
  [],
  'deleting any canonical identity-pin artifact must fail closed',
);
assert.notDeepEqual(
  validateP9IdentityPinAttestationPresence({
    anyCurrentPin: true,
    currentArtifactCount: 3,
    historicalAttemptCount: 2,
    canonicalAttestationPresent: true,
  }),
  [],
  'deleting and re-adding the manifest must not create a second canonical attempt',
);

const activeAuthority = structuredClone(authority);
activeAuthority.productionAuthorization!.runtimePrincipalFingerprintSha256 =
  '1'.repeat(64);
activeAuthority.productionAuthorization!.backupRuntimePrincipalFingerprintSha256 =
  '1'.repeat(64);
activeAuthority.productionAuthorization!.providerProjectFingerprintSha256 =
  '2'.repeat(64);
activeAuthority.productionAuthorization!.providerTeamFingerprintSha256 =
  '3'.repeat(64);
activeAuthority.productionAuthorization!.providerCanonicalProductionHostnameSha256 =
  '4'.repeat(64);
activeAuthority.productionAuthorization!.hostedVerificationEnvironmentFingerprintSha256 =
  '5'.repeat(64);
activeAuthority.productionAuthorization!.runtimeCredentialProvenanceFingerprintSha256 =
  '6'.repeat(64);
activeAuthority.productionAuthorization!.runtimeReadPermissionVerified = true;
activeAuthority.productionAuthorization!.runtimePrincipalDirectReaderVerified = true;
activeAuthority.productionAuthorization!.backupRuntimeReadPermissionVerified = true;
activeAuthority.productionAuthorization!.providerTargetIdentityPinned = true;
activeAuthority.productionAuthorization!.hostedVerificationEnvironmentVerified = true;
activeAuthority.productionAuthorization!.runtimeCredentialProvenanceVerified = true;
activeAuthority.productionAuthorization!.entrySourceReverificationVerified = true;
assert.deepEqual(
  validateP9ReadOnlyAuthority(activeAuthority, {
    expectedEntryProofState: true,
    expectedPostCutoverProofState: false,
  }),
  [],
);
assert.equal(
  p9ReadOnlyAuthorityChanged(activeAuthority, authority),
  false,
  'only the seven predeclared identity-pin values and proof states are normalized; Git-history validation must require their canonical attestation',
);

const pinnedInactiveAuthority = structuredClone(activeAuthority);
pinnedInactiveAuthority.productionAuthorization!.runtimeReadPermissionVerified = false;
pinnedInactiveAuthority.productionAuthorization!.runtimePrincipalDirectReaderVerified = false;
pinnedInactiveAuthority.productionAuthorization!.backupRuntimeReadPermissionVerified = false;
pinnedInactiveAuthority.productionAuthorization!.providerTargetIdentityPinned = false;
pinnedInactiveAuthority.productionAuthorization!.hostedVerificationEnvironmentVerified = false;
pinnedInactiveAuthority.productionAuthorization!.runtimeCredentialProvenanceVerified = false;
pinnedInactiveAuthority.productionAuthorization!.entrySourceReverificationVerified = false;
assert.deepEqual(
  validateP9ReadOnlyAuthority(pinnedInactiveAuthority, {
    expectedEntryProofState: false,
    expectedPostCutoverProofState: false,
  }),
  [],
  'a separately governed amendment may pin immutable identities before entry proof runs',
);
assert.ok(
  getCompleteP9IdentityPins(pinnedInactiveAuthority.productionAuthorization!),
  'the future pin candidate must populate one complete same-principal identity set',
);
assert.equal(
  hasAnyP9IdentityPin(pinnedInactiveAuthority.productionAuthorization!),
  true,
);
assert.equal(
  p9IdentityPinsChanged(
    pinnedInactiveAuthority.productionAuthorization!,
    authority.productionAuthorization!,
  ),
  true,
  'the governed pin comparison must detect population even though the narrow Revision 7 authority comparison normalizes it',
);
assert.equal(
  p9ReadOnlyAuthorityChanged(pinnedInactiveAuthority, authority),
  false,
  'predeclared pin population is structurally permitted only so Git-history attestation validation can govern it',
);
assert.equal(
  p9ReadOnlyAuthorityChanged(activeAuthority, pinnedInactiveAuthority),
  false,
  'only proof-state booleans may transition after exact identities are pinned',
);

const acceptedAuthority = structuredClone(activeAuthority);
acceptedAuthority.productionAuthorization!.deployedApplicationReadPathVerified = true;
acceptedAuthority.productionAuthorization!.postCutoverNonMutationVerified = true;
assert.deepEqual(
  validateP9ReadOnlyAuthority(acceptedAuthority, {
    expectedEntryProofState: true,
    expectedPostCutoverProofState: true,
  }),
  [],
);
assert.equal(
  p9ReadOnlyAuthorityChanged(acceptedAuthority, pinnedInactiveAuthority),
  false,
  'cutover proof-state booleans may transition without rebinding immutable identities',
);

for (const mutate of [
  (copy: P9DataAuthority) => { copy.productionMutationAuthorized = true; },
  (copy: P9DataAuthority) => { copy.productionAuthorization!.productionMutationAuthorized = true as unknown as false; },
  (copy: P9DataAuthority) => { copy.productionAuthorization!.accessMode = 'write' as 'read-only'; },
  (copy: P9DataAuthority) => { copy.productionAuthorization!.preEntryControlDeviationRecorded = false; },
  (copy: P9DataAuthority) => { copy.productionSpreadsheetId = P9_TESTING_SPREADSHEET_ID; },
  (copy: P9DataAuthority) => { copy.productionAuthorization!.spreadsheetTitle = 'Different workbook'; },
  (copy: P9DataAuthority) => { copy.productionAuthorization!.authorizedTabs.pop(); },
  (copy: P9DataAuthority) => { copy.productionAuthorization!.backupReceipt.backups[0].nativeCellPayloadSha256 = '0'.repeat(64); },
  (copy: P9DataAuthority) => { copy.productionAuthorization!.entrySourceReverificationRequired = false; },
  (copy: P9DataAuthority) => { copy.productionAuthorization!.entrySourceReverificationEvidencePath = 'docs/evidence/other.md'; },
  (copy: P9DataAuthority) => { copy.productionAuthorization!.runtimePrincipalDirectReaderVerificationRequired = false; },
  (copy: P9DataAuthority) => { copy.productionAuthorization!.backupRuntimeReadPermissionEvidencePath = 'docs/evidence/other.md'; },
  (copy: P9DataAuthority) => { copy.productionAuthorization!.providerTargetIdentityPinningRequired = false; },
  (copy: P9DataAuthority) => { copy.productionAuthorization!.hostedVerificationEnvironmentVerificationRequired = false; },
  (copy: P9DataAuthority) => { copy.productionAuthorization!.runtimeCredentialProvenanceVerificationRequired = false; },
  (copy: P9DataAuthority) => { copy.productionAuthorization!.deployedApplicationReadPathVerificationRequired = false; },
  (copy: P9DataAuthority) => { copy.productionAuthorization!.identityPinAttestationRequired = false as true; },
  (copy: P9DataAuthority) => { copy.productionAuthorization!.identityPinStageId = 'P9' as 'P9-IDENTITY-PINS'; },
  (copy: P9DataAuthority) => { copy.productionAuthorization!.identityPinEvidencePath = 'docs/evidence/rebound.md' as 'docs/evidence/P9-identity-pins.md'; },
  (copy: P9DataAuthority) => { copy.productionAuthorization!.identityPinManifestPath = 'docs/evidence/rebound.json' as 'docs/evidence/P9-identity-pins-manifest.json'; },
  (copy: P9DataAuthority) => { copy.productionAuthorization!.identityPinReviewPath = 'docs/reviews/rebound.json' as 'docs/reviews/P9-identity-pins.json'; },
  (copy: P9DataAuthority) => { copy.productionAuthorization!.trustedEvidencePhases = ['entry'] as unknown as ['entry', 'cutover', 'rollback', 'restored-cutover', 'finalize']; },
  (copy: P9DataAuthority) => { copy.productionAuthorization!.legacyReceiptSchemasAccepted = true as false; },
  (copy: P9DataAuthority) => { copy.p9TestingWriteAuthorization!.reversibleBackupRequired = false; },
]) {
  const copy = structuredClone(authority);
  mutate(copy);
  assert.notDeepEqual(
    validateP9ReadOnlyAuthority(copy, {
      expectedEntryProofState: false,
      expectedPostCutoverProofState: false,
    }),
    [],
    'every authority-boundary mutation must fail',
  );
  assert.equal(
    p9ReadOnlyAuthorityChanged(copy, authority),
    true,
    'every authority-boundary mutation must differ from the attested Revision 7 authority',
  );
}

const partialIdentityPins = structuredClone(authority);
partialIdentityPins.productionAuthorization!.runtimePrincipalFingerprintSha256 =
  '1'.repeat(64);
assert.equal(hasAnyP9IdentityPin(partialIdentityPins.productionAuthorization!), true);
assert.equal(
  getCompleteP9IdentityPins(partialIdentityPins.productionAuthorization!),
  null,
);
assert.match(
  validateP9ReadOnlyAuthority(partialIdentityPins, {
    expectedEntryProofState: false,
    expectedPostCutoverProofState: false,
  }).join('\n'),
  /populated together/i,
  'a partial unreviewed identity-pin population must fail closed',
);

const malformedIdentityPins = structuredClone(pinnedInactiveAuthority);
malformedIdentityPins.productionAuthorization!.providerTeamFingerprintSha256 =
  'A'.repeat(64);
assert.equal(
  getCompleteP9IdentityPins(malformedIdentityPins.productionAuthorization!),
  null,
);
assert.match(
  validateP9ReadOnlyAuthority(malformedIdentityPins, {
    expectedEntryProofState: false,
    expectedPostCutoverProofState: false,
  }).join('\n'),
  /null or SHA-256|populated together/i,
  'malformed pin values must not qualify for the future attestation gate',
);

const reboundIdentityPins = structuredClone(pinnedInactiveAuthority);
reboundIdentityPins.productionAuthorization!.providerProjectFingerprintSha256 =
  '7'.repeat(64);
assert.equal(
  p9IdentityPinsChanged(
    reboundIdentityPins.productionAuthorization!,
    pinnedInactiveAuthority.productionAuthorization!,
  ),
  true,
  'a later complete-set rebind must differ from the canonical pin candidate',
);
assert.equal(
  p9IdentityPinsChanged(
    authority.productionAuthorization!,
    pinnedInactiveAuthority.productionAuthorization!,
  ),
  true,
  'deleting every canonical pin must differ from the immutable candidate',
);
const partiallyDeletedIdentityPins = structuredClone(pinnedInactiveAuthority);
partiallyDeletedIdentityPins.productionAuthorization!.providerTeamFingerprintSha256 =
  null;
assert.equal(
  p9IdentityPinsChanged(
    partiallyDeletedIdentityPins.productionAuthorization!,
    pinnedInactiveAuthority.productionAuthorization!,
  ),
  true,
);
assert.match(
  validateP9ReadOnlyAuthority(partiallyDeletedIdentityPins, {
    expectedEntryProofState: false,
    expectedPostCutoverProofState: false,
  }).join('\n'),
  /populated together/i,
  'partial deletion of an attested pin set must fail closed',
);
assert.match(
  validateP9ReadOnlyAuthority(activeAuthority, {
    expectedEntryProofState: false,
    expectedPostCutoverProofState: false,
  }).join('\n'),
  /activation-gate proof state/i,
  'the P9-IDENTITY-PINS candidate must keep every operational proof state false',
);

const changedOwner = structuredClone(authority);
changedOwner.productionAuthorization!.deploymentOwner = 'Different owner';
assert.equal(p9ReadOnlyAuthorityChanged(changedOwner, authority), true);

const changedDeliveryEvidence = structuredClone(authority);
changedDeliveryEvidence.productionAuthorization!.evidencePath = 'docs/evidence/other.md';
assert.equal(p9ReadOnlyAuthorityChanged(changedDeliveryEvidence, authority), true);

const reboundRuntimeProof = structuredClone(activeAuthority);
reboundRuntimeProof.productionAuthorization!.runtimeReadPermissionEvidencePath =
  'docs/evidence/rebound.md';
assert.equal(p9ReadOnlyAuthorityChanged(reboundRuntimeProof, authority), true);

assert.match(
  validateP9ReadOnlyAuthority(authority, {
    expectedEntryProofState: true,
    expectedPostCutoverProofState: false,
  }).join('\n'),
  /activation-gate proof state/i,
);

assert.match(
  validateP9ReadOnlyAuthority(authority, {
    expectedEntryProofState: true,
    expectedPostCutoverProofState: false,
  }).join('\n'),
  /exact immutable runtime, backup, provider, host, environment, and credential-provenance identities/i,
  'P9 activation must fail while immutable operational identities remain null',
);

const mismatchedBackupPrincipal = structuredClone(activeAuthority);
mismatchedBackupPrincipal.productionAuthorization!.backupRuntimePrincipalFingerprintSha256 =
  '7'.repeat(64);
assert.match(
  validateP9ReadOnlyAuthority(mismatchedBackupPrincipal, {
    expectedEntryProofState: true,
    expectedPostCutoverProofState: false,
  }).join('\n'),
  /same runtime principal/i,
  'the exact runtime principal must also be the principal verified against both backups',
);

assert.match(
  validateP9ReadOnlyAuthority(activeAuthority, {
    expectedEntryProofState: true,
    expectedPostCutoverProofState: true,
  }).join('\n'),
  /deployed application read-path/i,
  'P9 verification and acceptance must fail before the deployed app-path probe passes',
);

const entryReceipt: P9EntryReceipt = {
  schemaVersion: 1,
  stageId: 'P9',
  verifiedAt: '2026-08-30T19:00:00Z',
  productionSpreadsheetId: P9_PRODUCTION_SPREADSHEET_ID,
  accessMode: 'read-only',
  oauthScope: P9_READ_ONLY_OAUTH_SCOPE,
  runtimeIdentityAccessMethod: 'deployed-runtime-authenticated-bounded-read',
  runtimeIdentityFingerprintSha256: 'a'.repeat(64),
  runtimeReadPermissionVerified: true,
  sourceRevisionBefore: '9857',
  sourceRevisionAfter: '9857',
  authorizedTabsOnly: true,
  productionSharingChanged: false,
  zeroProductionWritesObserved: true,
  tabs: P9_AUTHORIZED_PRODUCTION_TABS.map((tab) => {
    const backup = P9_VERIFIED_BACKUPS.find((item) => item.sourceSheetId === tab.sheetId)!;
    return {
      ...tab,
      sourceNativeCellPayloadSha256: backup.nativeCellPayloadSha256,
      backupSpreadsheetId: backup.backupSpreadsheetId,
      backupNativeCellPayloadSha256: backup.nativeCellPayloadSha256,
      sourceMatchesBackup: true,
    };
  }),
};
assert.notDeepEqual(
  validateP9EntryReceipt(entryReceipt),
  [],
  'legacy schema-v1 entry evidence must fail closed',
);
const staleEntryReceipt = structuredClone(entryReceipt);
staleEntryReceipt.sourceRevisionAfter = '9858';
assert.notDeepEqual(validateP9EntryReceipt(staleEntryReceipt), []);

const cutoverConfiguration: P9CutoverConfiguration = {
  schemaVersion: 1,
  sourceMode: 'production-google-sheet-read-only',
  readSpreadsheetId: P9_PRODUCTION_SPREADSHEET_ID,
  readOAuthScope: P9_READ_ONLY_OAUTH_SCOPE,
  writeSpreadsheetId: P9_TESTING_SPREADSHEET_ID,
  productionWritesDisabled: true,
  authorizedTabs: P9_AUTHORIZED_PRODUCTION_TABS.map((tab) => ({ ...tab })),
  runtimeIdentityFingerprintSha256: entryReceipt.runtimeIdentityFingerprintSha256,
};
const rollbackConfiguration: P9RollbackConfiguration = {
  schemaVersion: 1,
  sourceMode: 'accepted-p7-static-catalog',
  readSpreadsheetId: null,
  readOAuthScope: null,
  writeSpreadsheetId: P9_TESTING_SPREADSHEET_ID,
  productionWritesDisabled: true,
};
const postCutoverReceipt: P9PostCutoverReceipt = {
  schemaVersion: 1,
  stageId: 'P9',
  verifiedAt: '2026-08-30T20:00:00Z',
  productionSpreadsheetId: P9_PRODUCTION_SPREADSHEET_ID,
  deployedCommit: 'b'.repeat(40),
  rollbackCommit: 'c'.repeat(40),
  deploymentEvidencePath: P9_DEPLOYMENT_EVIDENCE_PATH,
  cutoverConfigurationFingerprintSha256:
    fingerprintP9Configuration(cutoverConfiguration),
  rollbackConfigurationFingerprintSha256:
    fingerprintP9Configuration(rollbackConfiguration),
  oauthScope: P9_READ_ONLY_OAUTH_SCOPE,
  sourceRevisionBeforeDeployment: '9857',
  sourceRevisionAfterDeploymentSmoke: '9857',
  sourceRevisionAfterRollbackProof: '9857',
  authorizedTabsOnly: true,
  productionSharingChanged: false,
  productionWriteCallsObserved: 0,
  productionWriteIsolationTestsPassed: true,
  configurationRollbackVerified: true,
  tabs: P9_AUTHORIZED_PRODUCTION_TABS.map((tab) => {
    const backup = P9_VERIFIED_BACKUPS.find((item) => item.sourceSheetId === tab.sheetId)!;
    return { ...tab, sourceNativeCellPayloadSha256: backup.nativeCellPayloadSha256 };
  }),
};
assert.notDeepEqual(
  validateP9PostCutoverReceipt(postCutoverReceipt),
  [],
  'legacy schema-v1 post-cutover evidence must fail closed',
);
const deploymentRecord: P9DeploymentRecord = {
  schemaVersion: 1,
  stageId: 'P9',
  verifiedAt: '2026-08-30T20:00:00Z',
  provider: 'vercel',
  providerAuthenticationMethod: 'authenticated-vercel-api',
  providerAuthenticationVerified: true,
  providerProjectFingerprintSha256: 'd'.repeat(64),
  environment: 'preview-production-source-rollback-probe',
  deploymentId: 'deployment-receipt-id',
  deploymentStatus: 'ready',
  deploymentUrlSha256: 'e'.repeat(64),
  deploymentHealthObservedAt: '2026-08-30T20:00:00Z',
  deploymentHealthStatusCode: 200,
  deploymentHealthCommit: postCutoverReceipt.deployedCommit,
  rollbackDeploymentId: 'rollback-receipt-id',
  rollbackStatus: 'ready',
  rollbackUrlSha256: 'f'.repeat(64),
  rollbackHealthObservedAt: '2026-08-30T20:01:00Z',
  rollbackHealthStatusCode: 200,
  rollbackHealthCommit: postCutoverReceipt.rollbackCommit,
  deployedCommit: postCutoverReceipt.deployedCommit,
  rollbackCommit: postCutoverReceipt.rollbackCommit,
  cutoverConfiguration,
  rollbackConfiguration,
  cutoverConfigurationFingerprintSha256:
    postCutoverReceipt.cutoverConfigurationFingerprintSha256,
  rollbackConfigurationFingerprintSha256:
    postCutoverReceipt.rollbackConfigurationFingerprintSha256,
  runtimeEquivalentToCandidate: true,
};
assert.notDeepEqual(
  validateP9DeploymentRecord(deploymentRecord, postCutoverReceipt, entryReceipt),
  [],
  'legacy schema-v1 deployment evidence must fail closed',
);
const unauthenticatedDeploymentRecord = structuredClone(deploymentRecord);
unauthenticatedDeploymentRecord.providerAuthenticationVerified = false;
assert.notDeepEqual(
  validateP9DeploymentRecord(
    unauthenticatedDeploymentRecord,
    postCutoverReceipt,
    entryReceipt,
  ),
  [],
);
assert.notDeepEqual(
  validateP9DeploymentGitBinding(
    postCutoverReceipt,
    postCutoverReceipt.rollbackCommit,
    'e'.repeat(40),
    {
      objectExists: () => true,
      isAncestor: (ancestor, descendant) =>
        (ancestor === 'c'.repeat(40) && descendant === 'b'.repeat(40)) ||
        (ancestor === 'b'.repeat(40) && descendant === 'e'.repeat(40)),
      changedRuntimePaths: () => [],
    },
  ),
  [],
  'legacy schema-v1 Git binding must fail closed',
);
assert.notDeepEqual(
  validateP9DeploymentGitBinding(
    postCutoverReceipt,
    postCutoverReceipt.rollbackCommit,
    'e'.repeat(40),
    {
      objectExists: () => false,
      isAncestor: () => false,
      changedRuntimePaths: () => [...P9_RUNTIME_EQUIVALENCE_PATHS],
    },
  ),
  [],
  'nonexistent deployment commits must fail the Git-binding gate',
);
assert.match(
  validateP9DeploymentGitBinding(
    postCutoverReceipt,
    postCutoverReceipt.rollbackCommit,
    'e'.repeat(40),
    {
      objectExists: () => true,
      isAncestor: () => true,
      changedRuntimePaths: () => ['web/fixtures/p7/student-catalog.json'],
    },
  ).join('\n'),
  /schema-v1/,
  'legacy evidence must fail before any claimed runtime-path proof is considered',
);
const mutatedPostCutoverReceipt = structuredClone(postCutoverReceipt);
mutatedPostCutoverReceipt.productionWriteCallsObserved = 1;
assert.notDeepEqual(validateP9PostCutoverReceipt(mutatedPostCutoverReceipt), []);

console.log(
  'P9 production authority: PASS (exact IDs/tabs/backups, no-write, immutable receipt paths, entry/post-cutover proof states, owners)',
);
