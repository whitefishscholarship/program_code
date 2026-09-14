import { isDeepStrictEqual } from 'node:util';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const R3_BLOCKER = 'PLAN-REV18-awaits-separate-R4-Git-Vercel-authority';
export const R3_CONNECTOR_SUPPLEMENT = {
  "id": "R3-CONNECTOR-METADATA-1",
  "proposalPath": "docs/evidence/r3-catalog/CONNECTOR_READ_SUPPLEMENT.md",
  "proposalSha256": "378f6992f63acd9b4e5cb33629306d5e840d8a8b46edaa6bc7d819746e9a4e06",
  "proposalCandidate": "af7d8a1126b23430bf092647bab2bfc9b053cac9",
  "proposalReviewCheckpoint": "99ecf02b5b026cda69737d744a405320a352794e",
  "authorized": true,
  "authorizedBy": "Kelsey Stuart",
  "authorizedAt": "2026-09-13",
  "authorityEvidencePath": "docs/evidence/r3-catalog/connector-authority.json",
  "policyReviewPath": "docs/evidence/r3-catalog/connector-policy-review.json",
  "workbookId": "1Dp5AMnrfSQ-Xf-r03S75lKsGPJk7o0inOgvC9Q6lOl4",
  "revisionRoute": {
    "tool": "google_drive_list_file_revisions",
    "pageSize": 1000,
    "maximumPagesPerObservation": 1,
    "maximumObservationsPerAttempt": 4,
    "maximumAttempts": 3,
    "paginationAuthorized": false,
    "revisionContentAuthorized": false,
    "fields": [
      "fileId",
      "currentRevisionId",
      "previousRevisionId",
      "revisions.id",
      "revisions.mimeType",
      "revisions.modifiedTime",
      "revisions.keepForever",
      "revisions.published",
      "revisions.originalFilename",
      "revisions.size",
      "revisions.lastModifyingUser.displayName",
      "revisions.lastModifyingUser.emailAddress",
      "revisions.lastModifyingUser.me",
      "revisions.lastModifyingUser.permissionId",
      "revisions.lastModifyingUser.photoLink"
    ],
    "currentRevisionIdRequired": true,
    "matchingRevisionRecordRequired": true,
    "independentModifiedTimeAgreementRequired": true,
    "stopAtPageCap": true
  },
  "cellEnvelope": {
    "tool": "google_drive_get_spreadsheet_cells",
    "additionalFields": [
      "sheets[0].properties.index",
      "sheets[0].properties.sheetType",
      "sheets[0].properties.gridProperties.frozenRowCount",
      "spreadsheetUrl"
    ],
    "selectedSheetId": 0,
    "headerSentinelWithinOriginalRange": true
  },
  "discardEditorIdentityBeforeOutputAndPersistence": true,
  "discardRawSpreadsheetUrl": true,
  "trashedUnknownIsNotFalse": true,
  "originalCaptureGatesUnchanged": true
} as const;
export const R3_SCOPE_SHA256 = '2b0b3a58301c8667582ccb1ae06fd1970262a6686dabb51416dbcbb66893b4c2';
export const R3_INPUTS_SHA256 = '2e760d199ba5706fcb9eb3f483440becce405ad1c72a7d389701d46bc93f7843';
export const R3_SOURCE_SCOPE = {
  workbookId: '1Dp5AMnrfSQ-Xf-r03S75lKsGPJk7o0inOgvC9Q6lOl4',
  sheetId: 0,
  sheetTitle: 'Master Database',
  range: "'Master Database'!A1:O417",
  addressableCells: 6255,
  dataRowPositions: 416,
  fileMetadataFields: ['id', 'name', 'mimeType', 'trashed', 'version', 'modifiedTime'],
  spreadsheetMetadataFields: ['spreadsheetId', 'properties.title', 'properties.locale', 'properties.timeZone'],
  sheetMetadataFields: ['sheetId', 'title', 'gridProperties.rowCount', 'gridProperties.columnCount', 'hidden'],
  cellFields: 'userEnteredValue,effectiveValue,formattedValue,hyperlink,textFormatRuns(startIndex,format(link)),userEnteredFormat(numberFormat),effectiveFormat(numberFormat)',
  maximumCaptureAttempts: 3,
  matchingCompleteCapturesRequired: 2,
  stableRevisionRequired: true,
  otherTabInventoryAuthorized: false,
  linkedSourceAccessAuthorized: false,
} as const;

export const R3_RESERVED_EFFECTS = {
  workbookWrites: false, backupCopies: false, recoveryCopies: false, restore: false,
  research: false, formInteraction: false, providerContact: false, credentials: false,
  configuration: false, paidActions: false, monitoring: false,
  push: false, pullRequest: false, preview: false, merge: false, production: false,
  hostedVerification: false,
} as const;

export type R3CatalogPolicy = {
  planId: string; status: string; scopeProposalCommit: string; scopePath: string;
  scopeSha256: string; inputsPath: string; inputsSha256: string;
  authorityEvidencePath: string; authorizedBy: string; authorizedAt: string;
  sourceReadAuthorized: boolean; localImplementationAuthorized: boolean;
  localEvidencePersistenceAuthorized: boolean; prospectivePolicyAuthorized: boolean;
  policyReviewPath: string; mappingReviewRequiredBeforeProductEdits: boolean;
  sourceScope: unknown; reservedEffects: unknown; connectorSupplement?: unknown;
};

// This validates only R3's selected grant, never a release or attestation substitute.
export function validateR3CatalogPolicy(policy: R3CatalogPolicy | undefined): string[] {
  const errors: string[] = [];
  if (!policy) return ['PLAN-REV18 requires its exact R3 catalog policy'];
  if (policy.planId !== 'R3-CATALOG-1' || policy.scopeProposalCommit !== 'adf45e41ced138d6f853f36faa6dd4065991d048' ||
      policy.scopePath !== 'docs/R3_CATALOG_SCOPE.md' || policy.scopeSha256 !== R3_SCOPE_SHA256 ||
      policy.inputsPath !== 'docs/evidence/interview-coverage/r3-scope-inputs.json' || policy.inputsSha256 !== R3_INPUTS_SHA256)
    errors.push('R3 must retain its exact reviewed scope and input pins');
  if (policy.authorityEvidencePath !== 'docs/evidence/PLAN-REV18.md' || policy.authorizedBy !== 'Kelsey Stuart' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(policy.authorizedAt) || policy.sourceReadAuthorized !== true ||
      policy.localImplementationAuthorized !== true || policy.localEvidencePersistenceAuthorized !== true ||
      policy.prospectivePolicyAuthorized !== true)
    errors.push('R3 requires direct scope-bound local/read authority');
  if (policy.policyReviewPath !== 'docs/evidence/r3-catalog/policy-review.json' || policy.mappingReviewRequiredBeforeProductEdits !== true)
    errors.push('R3 policy and mapping reviews must precede dependent execution');
  if (!isDeepStrictEqual(policy.sourceScope, R3_SOURCE_SCOPE)) errors.push('R3 source reads exceed or alter the approved exact projection');
  if (!isDeepStrictEqual(policy.reservedEffects, R3_RESERVED_EFFECTS)) errors.push('R3 cannot authorize reserved workbook, source or release effects');
  if (!isDeepStrictEqual(policy.connectorSupplement, R3_CONNECTOR_SUPPLEMENT)) errors.push('R3 connector reads require the exact authorized metadata supplement');
  return errors;
}

export function validateR3CatalogPolicyAt(repoRoot: string, policy: R3CatalogPolicy | undefined): string[] {
  const errors = validateR3CatalogPolicy(policy);
  const supplementPath = path.join(repoRoot, R3_CONNECTOR_SUPPLEMENT.proposalPath);
  if (!fs.existsSync(supplementPath) || createHash('sha256').update(fs.readFileSync(supplementPath)).digest('hex') !== R3_CONNECTOR_SUPPLEMENT.proposalSha256)
    errors.push('R3 connector supplement proposal changed');
  for (const [p, expected] of [['docs/R3_CATALOG_SCOPE.md', R3_SCOPE_SHA256], ['docs/evidence/interview-coverage/r3-scope-inputs.json', R3_INPUTS_SHA256]]) {
    const full = path.join(repoRoot, p);
    if (!fs.existsSync(full) || createHash('sha256').update(fs.readFileSync(full)).digest('hex') !== expected)
      errors.push(`R3 reviewed input changed: ${p}`);
  }
  return errors;
}

export function permitsLocalR3Preparation(id: string, blockers: string[], hosted: boolean, policy: R3CatalogPolicy | undefined): boolean {
  return id === 'PLAN-REV18' && !hosted && blockers.includes(R3_BLOCKER) && validateR3CatalogPolicy(policy).length === 0;
}
