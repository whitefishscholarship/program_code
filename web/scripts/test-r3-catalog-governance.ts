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
