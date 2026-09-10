import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

export const P9_REPLACEMENT_EVIDENCE_PATH = 'docs/evidence/P9-deployment.json';
export const P9_REPLACEMENT_RUNTIME_PATHS = [
  'web/src',
  'web/fixtures/p8m/matching-facts-v1.json',
  'web/package.json',
  'web/package-lock.json',
  'web/next.config.ts',
] as const;

type Context = {
  baselineCommit: string;
  runtimeCommit: string;
  publicationSha256: string;
  runtimeClosureSha256: string;
  projectFingerprintSha256: string;
  teamFingerprintSha256: string;
  hostnameFingerprintSha256: string;
  verificationEnvironmentFingerprintSha256: string;
};

type Json = Record<string, any>;
const sha256 = (value: string) => crypto.createHash('sha256').update(value).digest('hex');
const isObject = (value: unknown): value is Json => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const exactKeys = (value: Json, expected: string[]) =>
  JSON.stringify(Object.keys(value).sort()) === JSON.stringify([...expected].sort());

export function validateP9ReplacementEvidence(value: unknown, context: Context): string[] {
  const errors: string[] = [];
  if (!isObject(value)) return ['P9 replacement deployment evidence must be an object'];
  if (value.schemaVersion !== 1) errors.push('P9 replacement deployment evidence schemaVersion must be 1');
  if (value.stageId !== 'P9') errors.push('P9 replacement deployment evidence stageId must be P9');
  if (value.baselineCommit !== context.baselineCommit) errors.push('P9 evidence baseline commit mismatch');
  if (value.runtimeCommit !== context.runtimeCommit) errors.push('P9 evidence runtime commit mismatch');

  const publication = value.publication;
  if (!isObject(publication) || !exactKeys(publication, ['path', 'sha256', 'runtimeClosureSha256'])) {
    errors.push('P9 evidence publication identity is incomplete');
  } else {
    if (publication.path !== 'web/fixtures/p8m/matching-facts-v1.json') errors.push('P9 publication path mismatch');
    if (publication.sha256 !== context.publicationSha256) errors.push('P9 publication digest mismatch');
    if (publication.runtimeClosureSha256 !== context.runtimeClosureSha256) errors.push('P9 runtime closure digest mismatch');
  }

  const target = value.target;
  const targetChecks: Array<[string, string, string]> = [
    ['projectId', 'prj_LbefE2deji6nPND6iBiuofe7IABv', context.projectFingerprintSha256],
    ['teamId', 'team_6CAjRq58n0WvAH49otKSQbA7', context.teamFingerprintSha256],
    ['hostname', 'web-two-gules-45.vercel.app', context.hostnameFingerprintSha256],
    ['verificationEnvironment', 'p9-production-verification', context.verificationEnvironmentFingerprintSha256],
  ];
  if (!isObject(target)) errors.push('P9 provider target is missing');
  else for (const [key, expected, fingerprint] of targetChecks) {
    if (target[key] !== expected || sha256(key === 'hostname' ? expected.toLowerCase() : expected) !== fingerprint) {
      errors.push(`P9 provider target ${key} mismatch`);
    }
  }
  if (isObject(target) && (target.projectName !== 'web' || target.teamName !== "whitefishscholarship's projects")) errors.push('P9 provider target names mismatch');

  const environment = value.environment;
  if (!isObject(environment) || !Array.isArray(environment.inspections) || environment.inspections.length !== 2) {
    errors.push('P9 Production environment inventory is incomplete');
  } else {
    for (const [index, inspection] of environment.inspections.entries()) {
      if (!isObject(inspection) || !Array.isArray(inspection.productionVariableNames) || typeof inspection.observedAt !== 'string' || Number.isNaN(Date.parse(inspection.observedAt))) {
        errors.push(`P9 Production environment inspection ${index} is incomplete`);
        continue;
      }
      const names = inspection.productionVariableNames;
      if (names.some((name: unknown) => typeof name !== 'string' || /(google|gcp|drive|sheets?|spreadsheet|service_account)/i.test(name))) errors.push(`P9 Production environment inspection ${index} contains a forbidden variable`);
      if (new Set(names).size !== names.length || inspection.fingerprintSha256 !== sha256(JSON.stringify([...names].sort()))) errors.push(`P9 Production environment inspection ${index} fingerprint mismatch`);
      if (JSON.stringify([...names].sort()) !== JSON.stringify(['ADMIN_EMAIL', 'ADMIN_PASSWORD', 'JWT_SECRET', 'RESEND_API_KEY'])) errors.push(`P9 Production environment inspection ${index} inventory mismatch`);
      for (const removed of ['GOOGLE_SERVICE_ACCOUNT_CREDENTIALS', 'GOOGLE_SHEET_ID']) {
        if (!Array.isArray(inspection.verifiedRemovedNames) || !inspection.verifiedRemovedNames.includes(removed)) errors.push(`P9 environment inspection ${index} must verify removal of ${removed}`);
      }
    }
    if (environment.valuesInspected !== false) errors.push('P9 environment values must not be inspected or recorded');
  }

  const runtimeProof = value.runtimeProof;
  if (!isObject(runtimeProof) || runtimeProof.sourceAst !== 'pass' || runtimeProof.deploymentConfig !== 'pass' || runtimeProof.productionDependencies !== 'pass' || runtimeProof.builtServerTrace !== 'pass' || !/^[0-9a-f]{64}$/.test(runtimeProof.builtServerTraceSha256)) {
    errors.push('P9 zero-capability runtime proof is incomplete');
  }

  const deployments = value.deployments;
  const aliasOperations = value.aliasOperations;
  const phases = value.observations;
  if (!isObject(deployments) || !isObject(deployments.cleanA) || !isObject(deployments.cleanB)) {
    errors.push('P9 clean deployment identities are incomplete');
  } else if (!Array.isArray(phases) || phases.length !== 4) {
    errors.push('P9 evidence requires exactly four ordered deployment observations');
  } else {
    const expected = [
      ['cutover', deployments.cleanA.id],
      ['pre_rollback', deployments.cleanB.id],
      ['rollback', deployments.cleanA.id],
      ['restored', deployments.cleanB.id],
    ];
    const nonces = new Set<string>();
    phases.forEach((phase: unknown, index: number) => {
      if (!isObject(phase)) { errors.push(`P9 deployment observation ${index} is invalid`); return; }
      if (phase.phase !== expected[index][0] || phase.deploymentId !== expected[index][1]) errors.push(`P9 deployment observation ${index} sequence mismatch`);
      if (phase.requestMethod !== 'GET' || phase.requestUrl !== `https://web-two-gules-45.vercel.app/api/health?nonce=${phase.nonce}`) errors.push(`P9 deployment observation ${index} request mismatch`);
      if (phase.status !== 200 || phase.ok !== true || phase.env !== 'production') errors.push(`P9 deployment observation ${index} health mismatch`);
      if (phase.runtimeCommit !== context.runtimeCommit || phase.publicationSha256 !== context.publicationSha256) errors.push(`P9 deployment observation ${index} source mismatch`);
      if (!isObject(phase.capabilities) || phase.capabilities.google !== 'none' || phase.capabilities.drive !== 'none' || phase.capabilities.sheets !== 'none') errors.push(`P9 deployment observation ${index} capability mismatch`);
      if (typeof phase.nonce !== 'string' || !/^[0-9a-f]{32,128}$/.test(phase.nonce) || nonces.has(phase.nonce)) errors.push(`P9 deployment observation ${index} nonce is invalid or reused`);
      else nonces.add(phase.nonce);
      if (typeof phase.observedAt !== 'string' || Number.isNaN(Date.parse(phase.observedAt))) errors.push(`P9 deployment observation ${index} timestamp is invalid`);
    });
    for (const key of ['cleanA', 'cleanB']) {
      const deployment = deployments[key];
      if (deployment.ready !== true || deployment.environment !== 'production' || deployment.runtimeCommit !== context.runtimeCommit || !/^dpl_[A-Za-z0-9]+$/.test(deployment.id) || !/^web-[a-z0-9]+-whitefishscholarships-projects\.vercel\.app$/.test(deployment.url) || typeof deployment.requestedAt !== 'string' || typeof deployment.readyAt !== 'string' || Number.isNaN(Date.parse(deployment.requestedAt)) || Number.isNaN(Date.parse(deployment.readyAt)) || Date.parse(deployment.requestedAt) >= Date.parse(deployment.readyAt)) errors.push(`P9 ${key} deployment identity mismatch`);
    }
    if (isObject(environment) && Array.isArray(environment.inspections)) {
      const a = environment.inspections[0]; const b = environment.inspections[1];
      if (!isObject(a) || !isObject(b) || Date.parse(a.observedAt) >= Date.parse(deployments.cleanA.requestedAt) || Date.parse(b.observedAt) >= Date.parse(deployments.cleanB.requestedAt) || deployments.cleanA.environmentFingerprintSha256 !== a.fingerprintSha256 || deployments.cleanB.environmentFingerprintSha256 !== b.fingerprintSha256) errors.push('P9 clean deployments are not bound to pre-creation environment inspections');
    }
    if (!Array.isArray(aliasOperations) || aliasOperations.length !== 2 ||
      aliasOperations[0]?.action !== 'instant_rollback' || aliasOperations[0]?.fromDeploymentId !== deployments.cleanB.id || aliasOperations[0]?.toDeploymentId !== deployments.cleanA.id ||
      aliasOperations[1]?.action !== 'promote_restore' || aliasOperations[1]?.fromDeploymentId !== deployments.cleanA.id || aliasOperations[1]?.toDeploymentId !== deployments.cleanB.id ||
      aliasOperations.some((operation: unknown) => !isObject(operation) || typeof operation.confirmedBefore !== 'string' || Number.isNaN(Date.parse(operation.confirmedBefore)))) {
      errors.push('P9 alias rollback/restoration operation sequence is incomplete');
    }
  }

  const controlPlane = value.authenticatedControlPlane;
  const expectedControlActions = ['redeploy_promote', 'redeploy_promote', 'instant_rollback', 'promote_restore'];
  if (!isObject(controlPlane) || controlPlane.interface !== 'authenticated_vercel_dashboard' || controlPlane.actor !== 'whitefishscholarship' || controlPlane.projectId !== 'prj_LbefE2deji6nPND6iBiuofe7IABv' || controlPlane.teamId !== 'team_6CAjRq58n0WvAH49otKSQbA7' || !Array.isArray(controlPlane.operations) || controlPlane.operations.length !== 4 || controlPlane.operations.some((operation: unknown, index: number) => !isObject(operation) || operation.action !== expectedControlActions[index] || typeof operation.confirmedAt !== 'string' || Number.isNaN(Date.parse(operation.confirmedAt)))) errors.push('P9 authenticated provider operation evidence is incomplete');
  else if (isObject(deployments) && Array.isArray(phases)) {
    const [deployA, deployB, rollback, restore] = controlPlane.operations;
    if (deployA.toDeploymentId !== deployments.cleanA.id || deployA.confirmedAt !== deployments.cleanA.requestedAt || deployB.fromDeploymentId !== deployments.cleanA.id || deployB.toDeploymentId !== deployments.cleanB.id || deployB.confirmedAt !== deployments.cleanB.requestedAt || rollback.fromDeploymentId !== deployments.cleanB.id || rollback.toDeploymentId !== deployments.cleanA.id || restore.fromDeploymentId !== deployments.cleanA.id || restore.toDeploymentId !== deployments.cleanB.id || Date.parse(rollback.confirmedAt) <= Date.parse(phases[1].observedAt) || Date.parse(rollback.confirmedAt) >= Date.parse(phases[2].observedAt) || Date.parse(restore.confirmedAt) <= Date.parse(phases[2].observedAt) || Date.parse(restore.confirmedAt) >= Date.parse(phases[3].observedAt)) errors.push('P9 authenticated provider operations do not bind the clean deployment sequence');
  }

  const delivery = value.delivery;
  if (!isObject(delivery) || delivery.pullRequest !== 40 || delivery.previewDeploymentId !== 'dpl_ByUWkSgdsYWrUr81RnhZpCHSzeuV' || delivery.previewRuntimeCommit !== context.runtimeCommit || delivery.githubActionsRun !== 34419079116 || delivery.githubActionsJob !== 102690356105 || delivery.githubActionsConclusion !== 'success') errors.push('P9 Git/Preview/CI binding is incomplete');

  const smoke = value.finalSmoke;
  if (!isObject(smoke) || smoke.status !== 200 || smoke.sources !== 217 || smoke.portals !== 21 || smoke.awards !== 192 || smoke.applicationGroups !== 4 || smoke.cycles !== 192 || smoke.unknownCycles !== 192 || smoke.openCycles !== 0 || smoke.acceptedMatchingFacts !== 0 || smoke.root !== true || smoke.browseAll192 !== true || smoke.csvExport192 !== true || smoke.privateInterview !== true) {
    errors.push('P9 final API/browser reconciliation is incomplete');
  }
  return errors;
}

export function validateP9ReplacementEvidenceAtRepo(repoRoot: string, context: Context): string[] {
  const evidencePath = path.join(repoRoot, P9_REPLACEMENT_EVIDENCE_PATH);
  if (!fs.existsSync(evidencePath)) return [`Missing ${P9_REPLACEMENT_EVIDENCE_PATH}`];
  const errors = validateP9ReplacementEvidence(JSON.parse(fs.readFileSync(evidencePath, 'utf8')), context);
  const runGit = (args: string[]) => execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' }).trim();
  try {
    runGit(['merge-base', '--is-ancestor', context.baselineCommit, context.runtimeCommit]);
  } catch {
    errors.push('P9 runtime commit must descend from the exact live baseline');
  }
  try {
    const head = runGit(['rev-parse', 'HEAD']);
    runGit(['merge-base', '--is-ancestor', context.runtimeCommit, head]);
    const changed = runGit(['diff', '--name-only', context.runtimeCommit, head, '--', ...P9_REPLACEMENT_RUNTIME_PATHS]);
    if (changed) errors.push(`P9 accepted candidate changes frozen runtime paths: ${changed.replace(/\n/g, ', ')}`);
  } catch {
    errors.push('P9 candidate must retain the frozen runtime commit in its ancestry');
  }
  return errors;
}
