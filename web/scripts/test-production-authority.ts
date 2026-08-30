import assert from 'node:assert/strict';

import {
  P9_AUTHORIZED_PRODUCTION_TABS,
  P9_DEPLOYMENT_EVIDENCE_PATH,
  P9_ENTRY_EVIDENCE_PATH,
  P9_POST_CUTOVER_EVIDENCE_PATH,
  P9_PRODUCTION_SPREADSHEET_ID,
  P9_READ_ONLY_OAUTH_SCOPE,
  P9_RUNTIME_EQUIVALENCE_PATHS,
  P9_TESTING_SPREADSHEET_ID,
  P9_VERIFIED_BACKUPS,
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
    entrySourceReverificationRequired: true,
    entrySourceReverificationVerified: false,
    entrySourceReverificationEvidencePath: P9_ENTRY_EVIDENCE_PATH,
    postCutoverNonMutationVerificationRequired: true,
    postCutoverNonMutationVerified: false,
    postCutoverNonMutationEvidencePath: P9_POST_CUTOVER_EVIDENCE_PATH,
    deploymentRecordEvidencePath: P9_DEPLOYMENT_EVIDENCE_PATH,
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

const activeAuthority = structuredClone(authority);
activeAuthority.productionAuthorization!.runtimeReadPermissionVerified = true;
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
  'only predeclared proof-state flags may transition after Revision 7 attestation',
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
  /entry proof state/i,
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
assert.deepEqual(validateP9EntryReceipt(entryReceipt), []);
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
assert.deepEqual(validateP9PostCutoverReceipt(postCutoverReceipt), []);
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
assert.deepEqual(
  validateP9DeploymentRecord(deploymentRecord, postCutoverReceipt, entryReceipt),
  [],
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
assert.deepEqual(
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
  /web\/fixtures\/p7\/student-catalog\.json/,
  'a catalog fixture change after the deployed rollback probe must fail',
);
const mutatedPostCutoverReceipt = structuredClone(postCutoverReceipt);
mutatedPostCutoverReceipt.productionWriteCallsObserved = 1;
assert.notDeepEqual(validateP9PostCutoverReceipt(mutatedPostCutoverReceipt), []);

console.log(
  'P9 production authority: PASS (exact IDs/tabs/backups, no-write, immutable receipt paths, entry/post-cutover proof states, owners)',
);
