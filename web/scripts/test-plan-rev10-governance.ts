import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function read(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(read(relativePath)) as T;
}

function containsAll(source: string, phrases: string[], label: string): void {
  for (const phrase of phrases) {
    assert(source.includes(phrase), `${label} is missing ${phrase}`);
  }
}

type Stage = {
  id: string;
  status: string;
  baselineCommit: string | null;
  kickoffPath: string | null;
};

type Authorization = {
  stageId: string;
  authorized: boolean;
  authorizedBy: string | null;
  authorizedAt: string | null;
  evidencePath: string | null;
  basis: string;
  scope: string;
};

type BuildState = {
  planRevision: number;
  activeStageId: string | null;
  nextPermittedStageId: string | null;
  stages: Stage[];
  dataAuthority: {
    sourceTransition?: {
      organizerMaster: {
        spreadsheetId: string;
        role: string;
        designationEvidence: string;
        verificationStatus: string;
        accessAuthorized: boolean;
        automatedWriteAuthorized: boolean;
      };
      formerProduction: {
        spreadsheetId: string;
        role: string;
        accessAuthorized: boolean;
      };
      applicationRuntime: {
        sourceMode: string;
        publicationStatus: string;
        mutableMasterDirectReadAuthorized: boolean;
      };
      identities: string[];
    };
  };
  deployment: {
    stageMergeAuthorizations: Authorization[];
    deliveryBlockers: string[];
  };
  governance: {
    planAmendments: Array<{
      id: string;
      baselineCommit: string;
      evidencePath: string;
      manifestPath: string;
      reviewPath: string;
    }>;
  };
};

type Criterion = {
  criterion_id: string;
  category: string;
  value_type: string;
  allowed_operators: string[];
  sensitive: boolean;
  scopes: string[];
};

type MatchingContract = {
  schemaVersion: number;
  contractId: string;
  taxonomyVersion: string;
  status: string;
  subjectIdentity: {
    required: string[];
    distinctEntities: string[];
  };
  factSchema: {
    requiredFields: string[];
    effects: string[];
    evidenceStatuses: string[];
    valueTypes: string[];
    operators: Array<{ id: string; valueTypes: string[] }>;
  };
  criteria: Criterion[];
  aliases: Array<{ alias: string; criterion_id: string }>;
  evidenceAuthority: {
    precedence: string[];
    hardConflictMinimum: string;
    conflictPolicy: string;
  };
  sensitivePolicy: {
    nonselectionMeaning: string;
    unansweredMeaning: string;
    acceptedUse: string;
  };
  freshness: {
    cycleSpecific: string;
    annualRollover: string;
    nonCycleReviewDays: number;
  };
  claudeBoundary: {
    role: string;
    outputStatus: string;
    directWriteAllowed: boolean;
    selfAcceptanceAllowed: boolean;
    requiredReceipts: string[];
  };
  codexBoundary: {
    role: string;
    responsibilities: string[];
  };
  futureWriteGate: {
    editAccessIsAuthority: boolean;
    requiredAuthorityFields: string[];
    requiredControls: string[];
  };
};

const state = readJson<BuildState>('docs/BUILD_STATE.json');
assert.equal(state.planRevision, 10);
assert.equal(state.activeStageId, null);
assert.equal(state.nextPermittedStageId, 'P8M');

const stageIds = state.stages.map(({ id }) => id);
assert.deepEqual(stageIds.slice(-3), ['P8M', 'P8F', 'P9']);
const p8m = state.stages.find(({ id }) => id === 'P8M');
assert.deepEqual(p8m, {
  id: 'P8M',
  name: 'Matching-fact enrichment and acceptance',
  status: 'planned',
  baselineCommit: null,
  evidencePath: 'docs/evidence/P8M.md',
  manifestPath: 'docs/evidence/P8M-manifest.json',
  reviewPath: 'docs/reviews/P8M.json',
  kickoffPath: 'docs/kickoffs/P8M-MATCHING-FACT-ENRICHMENT.md',
});
assert.equal(state.stages.find(({ id }) => id === 'P8F')?.status, 'planned');
assert.equal(state.stages.find(({ id }) => id === 'P9')?.status, 'planned');

const transition = state.dataAuthority.sourceTransition;
assert(transition, 'BUILD_STATE must define the Revision 10 source transition');
assert.equal(
  transition.organizerMaster.spreadsheetId,
  '1Dp5AMnrfSQ-Xf-r03S75lKsGPJk7o0inOgvC9Q6lOl4',
);
assert.equal(transition.organizerMaster.role, 'organizer_authoring_master');
assert.equal(transition.organizerMaster.designationEvidence, 'user-reported');
assert.equal(transition.organizerMaster.verificationStatus, 'unverified');
assert.equal(transition.organizerMaster.accessAuthorized, false);
assert.equal(transition.organizerMaster.automatedWriteAuthorized, false);
assert.equal(
  transition.formerProduction.spreadsheetId,
  '1eWGMdavcEECUcY_-nZ9gR2nMTN7T7T6oipG5ql1LoIE',
);
assert.equal(transition.formerProduction.role, 'legacy_comparison_only');
assert.equal(transition.formerProduction.accessAuthorized, false);
assert.equal(transition.applicationRuntime.sourceMode, 'validated_immutable_versioned_publication');
assert.equal(transition.applicationRuntime.publicationStatus, 'not_created');
assert.equal(transition.applicationRuntime.mutableMasterDirectReadAuthorized, false);
assert.deepEqual(transition.identities, [
  'human_editor',
  'proposal_processor',
  'fact_reviewer',
  'read_only_application_runtime',
]);

const p8mAuthorization = state.deployment.stageMergeAuthorizations.find(
  ({ stageId }) => stageId === 'P8M',
);
assert(p8mAuthorization, 'P8M requires an explicit authorization record');
assert.equal(p8mAuthorization.authorized, false);
assert.equal(p8mAuthorization.authorizedBy, null);
assert.equal(p8mAuthorization.authorizedAt, null);
assert.equal(p8mAuthorization.evidencePath, null);
assert(
  state.deployment.deliveryBlockers.some((item) => item.startsWith('P8M-')),
  'P8M must remain blocked pending direct stage-specific authority',
);

const rev10 = state.governance.planAmendments.find(({ id }) => id === 'PLAN-REV10');
assert(rev10, 'PLAN-REV10 amendment record missing');
assert.equal(rev10.baselineCommit, '390b270c5d3127ff2705ffb114212a518a1d5953');
assert.equal(rev10.evidencePath, 'docs/evidence/PLAN-REV10.md');
assert.equal(rev10.manifestPath, 'docs/evidence/PLAN-REV10-manifest.json');
assert.equal(rev10.reviewPath, 'docs/reviews/PLAN-REV10.json');

const contract = readJson<MatchingContract>(
  'docs/evidence/PLAN-REV10-matching-fact-contract.json',
);
assert.equal(contract.schemaVersion, 1);
assert.equal(contract.contractId, 'matching-facts-v1');
assert.equal(contract.taxonomyVersion, '1.0.0');
assert.equal(contract.status, 'governance-frozen-no-processing-authority');
assert.deepEqual(contract.subjectIdentity.required, ['award_id']);
assert(contract.subjectIdentity.distinctEntities.includes('parent_source'));
assert(contract.subjectIdentity.distinctEntities.includes('child_award'));
assert(contract.subjectIdentity.distinctEntities.includes('application_group'));
assert(contract.subjectIdentity.distinctEntities.includes('annual_cycle'));

const requiredFactFields = [
  'award_id',
  'cycle_id',
  'criterion_id',
  'effect',
  'operator',
  'value',
  'evidence_status',
  'source_url',
  'source_revision',
  'observed_at',
  'evidence_excerpt',
  'reviewer_id',
  'reviewed_at',
  'review_rationale',
  'taxonomy_version',
];
assert.deepEqual(contract.factSchema.requiredFields, requiredFactFields);
assert.deepEqual(contract.factSchema.effects, ['required', 'preferred', 'informational']);
assert.deepEqual(contract.factSchema.evidenceStatuses, [
  'proposed',
  'accepted',
  'rejected',
  'conflict',
  'stale',
  'unknown',
]);

const operatorIds = new Set(contract.factSchema.operators.map(({ id }) => id));
for (const operator of [
  'eq',
  'neq',
  'in',
  'not_in',
  'gte',
  'lte',
  'between',
  'contains_any',
  'contains_all',
  'exists',
]) {
  assert(operatorIds.has(operator), `missing typed operator ${operator}`);
}

const requiredCategories = [
  'academics',
  'education',
  'geography',
  'responsibility_service',
  'financial_need',
  'learning_neurodiversity',
  'health_hardship',
  'heritage_demographics_identity',
  'career_field',
  'athletics',
  'military_first_responder',
  'organization_affiliation',
  'employer_affiliation',
  'application',
  'cycle',
];
const categories = new Set(contract.criteria.map(({ category }) => category));
for (const category of requiredCategories) {
  assert(categories.has(category), `taxonomy is missing category ${category}`);
}
assert(contract.criteria.length >= 55, 'taxonomy is too narrow for the governed scope');
assert.equal(
  new Set(contract.criteria.map(({ criterion_id }) => criterion_id)).size,
  contract.criteria.length,
  'criterion IDs must be unique',
);
for (const criterion of contract.criteria) {
  assert(contract.factSchema.valueTypes.includes(criterion.value_type));
  assert(criterion.allowed_operators.length > 0);
  for (const operator of criterion.allowed_operators) {
    assert(operatorIds.has(operator), `${criterion.criterion_id} uses unknown operator ${operator}`);
  }
  assert(criterion.scopes.includes('award') || criterion.scopes.includes('cycle'));
}

const aliases = new Map(contract.aliases.map(({ alias, criterion_id }) => [alias, criterion_id]));
for (const alias of [
  'adhd',
  'dyslexia',
  'first_generation',
  'aviation_pilot',
  'healthcare',
  'military_veteran',
  'first_responder',
  'farmers_union',
  'electric_coop',
  'credit_union',
  'elks_lodge',
  'company_employee',
]) {
  assert(aliases.has(alias), `missing governed alias ${alias}`);
}
assert(!aliases.has('add'), 'ADD must not become a separate taxonomy alias or question');

assert.equal(contract.sensitivePolicy.nonselectionMeaning, 'unknown_not_negative');
assert.equal(contract.sensitivePolicy.unansweredMeaning, 'unknown_not_negative');
assert.equal(contract.sensitivePolicy.acceptedUse, 'positive_signal_only_unless_explicit_contradiction');
assert.equal(contract.evidenceAuthority.hardConflictMinimum, 'accepted_field_specific_authority');
assert.equal(contract.evidenceAuthority.conflictPolicy, 'conflict_blocks_acceptance_and_matching_use');
assert.equal(contract.freshness.nonCycleReviewDays, 365);
assert.equal(contract.claudeBoundary.role, 'proposal_only');
assert.equal(contract.claudeBoundary.outputStatus, 'proposed');
assert.equal(contract.claudeBoundary.directWriteAllowed, false);
assert.equal(contract.claudeBoundary.selfAcceptanceAllowed, false);
for (const receipt of ['input_fingerprint', 'prompt_version', 'checkpoint', 'completeness']) {
  assert(contract.claudeBoundary.requiredReceipts.includes(receipt));
}
assert.equal(contract.codexBoundary.role, 'governance_validation_reconciliation_owner');
for (const responsibility of [
  'stable_id_binding',
  'duplicate_conflict_coverage_checks',
  'no_truncation_reconciliation',
  'source_evidence_policy',
  'independent_review_packaging',
]) {
  assert(contract.codexBoundary.responsibilities.includes(responsibility));
}
assert.equal(contract.futureWriteGate.editAccessIsAuthority, false);
for (const field of [
  'spreadsheet_id',
  'tab',
  'columns_ranges_cells',
  'operation_count',
  'source_revision',
  'backup_owner',
  'rollback_owner',
]) {
  assert(contract.futureWriteGate.requiredAuthorityFields.includes(field));
}
for (const control of [
  'verified_backup',
  'deterministic_dry_run',
  'human_acceptance',
  'independent_review',
  'idempotent_bounded_batch',
  'immediate_readback',
  'untargeted_cell_proof',
  'complete_reconciliation',
]) {
  assert(contract.futureWriteGate.requiredControls.includes(control));
}

const plan = read('docs/SCHOLARSHIP_SYSTEM_BUILD_PLAN.md');
const agents = read('AGENTS.md');
const decisions = read('docs/DECISIONS.md');
const handoff = read('docs/CURRENT_HANDOFF.md');
const p8mKickoff = read('docs/kickoffs/P8M-MATCHING-FACT-ENRICHMENT.md');
const p8fKickoff = read('docs/kickoffs/P8F-FORMER-INTERVIEW-DETAIL.md');
const p9Kickoff = read('docs/kickoffs/P9-PRODUCTION-MIGRATION.md');

containsAll(
  plan,
  [
    'Plan revision: 10',
    '### P8M — Matching-fact enrichment and acceptance',
    'validated immutable versioned publication',
    'legacy comparison-only',
    'Edit access is capability, not operation authority',
    'P8M accepted and delivered',
    'Plan Revision 10',
  ],
  'Revision 10 plan',
);
containsAll(
  agents,
  [
    'Plan Revision 10 and P8M boundary',
    'proposal-only',
    'Edit access is not automated-write authority',
  ],
  'repository contract',
);
assert(decisions.includes('## D-022 —'));
containsAll(
  handoff,
  [
    'Master-source and matching-fact follow-up',
    'Open items that must not be dropped',
    'Live scholarship freshness',
    'protected application-health smoke',
    'blocked Preview access',
    'GitHub Actions Node runtime warning',
    'disabled monitoring',
  ],
  'durable handoff',
);
containsAll(
  p8mKickoff,
  [
    'Execute P8M',
    'proposal-only',
    'Do not access either spreadsheet',
    'direct, stage-specific authority',
    'Stop before P8F and P9',
  ],
  'P8M kickoff',
);
containsAll(
  p8fKickoff,
  ['P8M', 'accepted matching facts', 'Do not invent a separate ADD question'],
  'revised P8F kickoff',
);
containsAll(
  p9Kickoff,
  [
    'Plan Revision 10',
    'legacy comparison-only',
    'validated immutable versioned publication',
  ],
  'revised P9 kickoff',
);

console.log(
  `PLAN REV10 GOVERNANCE TEST PASS criteria=${contract.criteria.length} aliases=${contract.aliases.length} operators=${contract.factSchema.operators.length}`,
);
