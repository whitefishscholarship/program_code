import assert from 'node:assert/strict';

import {
  changedAttestedPlanAmendment,
  changedStandingAuthorization,
  maximumAttestedPlanRevision,
  sha256Text,
} from './governance-history';

type Authorization = {
  stageId: string;
  authorized: boolean;
  authorizedBy: string;
  authorizedAt: string;
  evidencePath: string;
  basis: string;
  scope: string;
};

const stageIds = ['P3', 'P4', 'P5', 'P6', 'P7', 'P8'];
const canonicalAmendments = [
  { id: 'PLAN-REV2', status: 'accepted' },
  { id: 'PLAN-REV3', status: 'attestation-gated' },
  { id: 'PLAN-REV4', status: 'attestation-gated' },
  { id: 'PLAN-REV5', status: 'attestation-gated' },
];
const canonicalAuthorizations: Authorization[] = stageIds.map((stageId) => ({
  stageId,
  authorized: true,
  authorizedBy: 'Kelsey Stuart',
  authorizedAt: '2026-08-25',
  evidencePath: 'docs/evidence/STANDING-OPERATING-MANDATE.md',
  basis: `${stageId} exact basis`,
  scope:
    stageId === 'P5'
      ? 'Separate testing-sheet write authority required.'
      : stageId === 'P8'
        ? 'Deployment configuration and schedules excluded.'
        : `${stageId} exact scope`,
}));

assert.equal(maximumAttestedPlanRevision(canonicalAmendments), 5);
assert.ok(4 < maximumAttestedPlanRevision(canonicalAmendments), 'revision rollback must fail');
assert.equal(
  changedAttestedPlanAmendment(canonicalAmendments, canonicalAmendments),
  undefined,
);
assert.equal(
  changedAttestedPlanAmendment(
    canonicalAmendments.filter((item) => item.id !== 'PLAN-REV5'),
    canonicalAmendments,
  ),
  'PLAN-REV5',
  'removing historically attested PLAN-REV5 must fail',
);

assert.equal(
  changedStandingAuthorization(canonicalAuthorizations, canonicalAuthorizations, stageIds),
  undefined,
);
for (const stageId of stageIds) {
  assert.equal(
    changedStandingAuthorization(
      canonicalAuthorizations.filter((item) => item.stageId !== stageId),
      canonicalAuthorizations,
      stageIds,
    ),
    stageId,
    `deleting ${stageId} authorization must fail`,
  );

  for (const field of [
    'authorized',
    'authorizedBy',
    'authorizedAt',
    'evidencePath',
    'basis',
    'scope',
  ] as const) {
    const changed = structuredClone(canonicalAuthorizations);
    const target = changed.find((item) => item.stageId === stageId)!;
    if (field === 'authorized') target[field] = false;
    else target[field] = `${target[field]} changed`;
    assert.equal(
      changedStandingAuthorization(changed, canonicalAuthorizations, stageIds),
      stageId,
      `changing ${stageId}.${field} must fail`,
    );
  }
}

assert.notEqual(
  sha256Text('standing mandate'),
  sha256Text('standing mandate changed'),
  'mandate evidence mutation must fail its immutable digest check',
);
assert.match(
  canonicalAuthorizations.find((item) => item.stageId === 'P5')!.scope,
  /Separate testing-sheet write authority required/,
);
assert.match(
  canonicalAuthorizations.find((item) => item.stageId === 'P8')!.scope,
  /Deployment configuration and schedules excluded/,
);

console.log(
  'governance history: PASS (revision/amendment rollback, every P3-P8 field, P5/P8 exclusions, and evidence mutation rejected)',
);
