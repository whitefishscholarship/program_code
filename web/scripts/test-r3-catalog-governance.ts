import assert from 'node:assert/strict';
import fs from 'node:fs';
import { permitsLocalR3Preparation, validateR3CatalogPolicy, R3_BLOCKER, type R3CatalogPolicy } from './r3-catalog-governance';

const state = JSON.parse(fs.readFileSync('../docs/BUILD_STATE.json', 'utf8'));
const policy = state.r3CatalogRefresh as R3CatalogPolicy;
assert.deepEqual(validateR3CatalogPolicy(policy), []);
assert(permitsLocalR3Preparation('PLAN-REV18', [R3_BLOCKER], false, policy));
assert(!permitsLocalR3Preparation('PLAN-REV18', [R3_BLOCKER], true, policy));
assert(!permitsLocalR3Preparation('PLAN-REV16', [R3_BLOCKER], false, policy));
assert(!permitsLocalR3Preparation('PLAN-REV18', [], false, policy));
assert(!permitsLocalR3Preparation('PLAN-REV18', [R3_BLOCKER], false, undefined));
for (const [field, value] of [['range', "'Master Database'!A1:O418"], ['sheetId', 1], ['workbookId', 'other'], ['cellFields', '*'], ['otherTabInventoryAuthorized', true], ['maximumCaptureAttempts', 4], ['matchingCompleteCapturesRequired', 1], ['stableRevisionRequired', false]] as const) {
  const changed = structuredClone(policy); (changed.sourceScope as Record<string, unknown>)[field] = value;
  assert(validateR3CatalogPolicy(changed).length > 0, field);
  assert(!permitsLocalR3Preparation('PLAN-REV18', [R3_BLOCKER], false, changed));
}
for (const effect of Object.keys(policy.reservedEffects as object)) {
  const changed = structuredClone(policy); (changed.reservedEffects as Record<string, unknown>)[effect] = true;
  assert(validateR3CatalogPolicy(changed).length > 0, effect);
}
for (const field of ['sourceReadAuthorized', 'localImplementationAuthorized', 'localEvidencePersistenceAuthorized', 'prospectivePolicyAuthorized', 'mappingReviewRequiredBeforeProductEdits'] as const) {
  const changed = structuredClone(policy); changed[field] = false;
  assert(validateR3CatalogPolicy(changed).length > 0, field);
}
console.log('R3 policy PASS: exact scope, authority, review, local-only and reserved-effect rejection gates; no source access.');

const mutations: Array<(supplement: any) => void> = [
  s => { s.authorized = false; }, s => { s.workbookId = 'other'; },
  s => { s.proposalSha256 = '0'.repeat(64); }, s => { s.policyReviewPath = 'other'; },
  s => { s.revisionRoute.pageSize = 1001; }, s => { s.revisionRoute.paginationAuthorized = true; },
  s => { s.revisionRoute.maximumObservationsPerAttempt = 5; }, s => { s.revisionRoute.maximumAttempts = 4; },
  s => { s.revisionRoute.revisionContentAuthorized = true; }, s => { s.revisionRoute.currentRevisionIdRequired = false; },
  s => { s.revisionRoute.matchingRevisionRecordRequired = false; }, s => { s.revisionRoute.independentModifiedTimeAgreementRequired = false; },
  s => { s.revisionRoute.stopAtPageCap = false; }, s => { s.revisionRoute.fields.push('revisions.content'); },
  s => { s.cellEnvelope.selectedSheetId = 1; }, s => { s.cellEnvelope.additionalFields.push('sheets.charts'); },
  s => { s.discardEditorIdentityBeforeOutputAndPersistence = false; }, s => { s.discardRawSpreadsheetUrl = false; },
  s => { s.trashedUnknownIsNotFalse = false; }, s => { s.originalCaptureGatesUnchanged = false; },
];
for (const mutate of mutations) {
  const changed = structuredClone(policy); mutate(changed.connectorSupplement);
  assert(validateR3CatalogPolicy(changed).length > 0);
  assert(!permitsLocalR3Preparation('PLAN-REV18', [R3_BLOCKER], false, changed));
}
const missingSupplement = structuredClone(policy); delete missingSupplement.connectorSupplement;
assert(validateR3CatalogPolicy(missingSupplement).length > 0);
console.log('R3 connector policy PASS: missing authority, widened metadata, privacy and revision-proof regressions rejected.');
