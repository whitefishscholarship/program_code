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

  const environment = value.environment;
  if (!isObject(environment) || !Array.isArray(environment.productionVariableNames) || typeof environment.verifiedAbsentAt !== 'string') {
    errors.push('P9 Production environment inventory is incomplete');
  } else {
    const names = environment.productionVariableNames;
    if (names.some((name: unknown) => typeof name !== 'string' || /(google|gcp|drive|sheets?|spreadsheet|service_account)/i.test(name))) {
      errors.push('P9 Production environment inventory contains a forbidden Google/Drive/Sheets variable');
    }
    if (new Set(names).size !== names.length) errors.push('P9 Production environment inventory contains duplicates');
    for (const removed of ['GOOGLE_SERVICE_ACCOUNT_CREDENTIALS', 'GOOGLE_SHEET_ID']) {
      if (!Array.isArray(environment.verifiedRemovedNames) || !environment.verifiedRemovedNames.includes(removed)) {
        errors.push(`P9 environment evidence must verify removal of ${removed}`);
      }
    }
  }

  const runtimeProof = value.runtimeProof;
  if (!isObject(runtimeProof) || runtimeProof.sourceAst !== 'pass' || runtimeProof.deploymentConfig !== 'pass' || runtimeProof.productionDependencies !== 'pass' || runtimeProof.builtServerTrace !== 'pass') {
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
      if (deployment.ready !== true || deployment.runtimeCommit !== context.runtimeCommit || !/^dpl_[A-Za-z0-9]+$/.test(deployment.id) || !/^web-[a-z0-9]+-whitefishscholarships-projects\.vercel\.app$/.test(deployment.url)) errors.push(`P9 ${key} deployment identity mismatch`);
    }
    if (!Array.isArray(aliasOperations) || aliasOperations.length !== 2 ||
      aliasOperations[0]?.action !== 'instant_rollback' || aliasOperations[0]?.fromDeploymentId !== deployments.cleanB.id || aliasOperations[0]?.toDeploymentId !== deployments.cleanA.id ||
      aliasOperations[1]?.action !== 'promote_restore' || aliasOperations[1]?.fromDeploymentId !== deployments.cleanA.id || aliasOperations[1]?.toDeploymentId !== deployments.cleanB.id ||
      aliasOperations.some((operation: unknown) => !isObject(operation) || typeof operation.confirmedBefore !== 'string' || Number.isNaN(Date.parse(operation.confirmedBefore)))) {
      errors.push('P9 alias rollback/restoration operation sequence is incomplete');
    }
  }

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
