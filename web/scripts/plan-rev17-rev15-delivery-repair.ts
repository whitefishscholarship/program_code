import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { isDeepStrictEqual } from 'node:util';

export const GIT_BLOB_MAX_BUFFER = 16 * 1024 * 1024;
export const REV17_TEST_COMMAND = 'node --import tsx scripts/test-plan-rev17-rev15-delivery-repair.ts';
export const REV17_CONTINUATION = {
  "targetAmendmentId": "PLAN-REV15",
  "targetCandidateCommit": "74057a1f2af33ca226fb573c4f9301796048bef0",
  "targetAttestationCommit": "94db9e72ff241f5eb0939872d97852657f139ecb",
  "targetBaselineCommit": "5fa08541b6b49484dedc8fc06012e47c658ce8fb",
  "authorityReceivedAt": "2026-09-12T23:49:53Z",
  "authorityEvidencePath": "docs/evidence/PLAN-REV17.md",
  "continuationBranch": "codex/plan-rev17-rev15-delivery-repair",
  "authorizedEffects": [
    "branch_push",
    "pull_request",
    "vercel_preview",
    "merge",
    "vercel_production",
    "ci_and_deployment_verification"
  ],
  "allowedContinuationPaths": [
    "AGENTS.md",
    "docs/BUILD_STATE.json",
    "docs/SCHOLARSHIP_SYSTEM_BUILD_PLAN.md",
    "docs/DECISIONS.md",
    "docs/CURRENT_HANDOFF.md",
    "docs/kickoffs/PLAN-REV17-REV15-DELIVERY-REPAIR.md",
    "docs/evidence/PLAN-REV17.md",
    "docs/evidence/interview-coverage/r2-rev17-policy-review.json",
    "docs/evidence/interview-coverage/r2-rev17-validation.json",
    "docs/evidence/interview-coverage/r2-rev17-preservation.json",
    "web/package.json",
    "web/scripts/validate-build-plan.ts",
    "web/scripts/plan-rev17-rev15-delivery-repair.ts",
    "web/scripts/test-plan-rev17-rev15-delivery-repair.ts"
  ],
  "productOrDataChangeAuthorized": false,
  "workbookAccessAuthorized": false,
  "researchAuthorized": false,
  "configurationChangeAuthorized": false,
  "laterPhaseAuthorized": false,
  "projectId": "prj_LbefE2deji6nPND6iBiuofe7IABv",
  "teamId": "team_6CAjRq58n0WvAH49otKSQbA7",
  "canonicalHostname": "web-two-gules-45.vercel.app",
  "originalSourceCommit": "979122a13d4a8098d8cea26f115add1e68405355"
} as const;
export type Rev15DeliveryRepair = typeof REV17_CONTINUATION;
type Amendment = { id: string; baselineCommit: string; deliveryAuthorization?: { authorized: boolean; evidencePath: string | null }; rev15DeliveryRepair?: unknown };
type State = { planRevision: number; governance: { planAmendments: Amendment[] } };
export type CanonicalIdentity = { manifest: { candidateCommit: string; baselineCommit: string }; attestationCommit: string };

export function readGitBuffer(repoRoot: string, args: string[]): Buffer | null {
  try {
    return execFileSync('git', args, { cwd: repoRoot, encoding: 'buffer',
      stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: GIT_BLOB_MAX_BUFFER });
  } catch { return null; }
}
export function matchesBlobHash(blob: Buffer | null, expected: string | null): boolean {
  return blob !== null && expected === createHash('sha256').update(blob).digest('hex');
}
export function validateRepairRecord(record: unknown, target: CanonicalIdentity | null): string[] {
  const errors: string[] = [];
  if (!isDeepStrictEqual(record, REV17_CONTINUATION)) errors.push('REV17 requires its exact authorized continuation record');
  if (!target || target.manifest.candidateCommit !== REV17_CONTINUATION.targetCandidateCommit ||
      target.manifest.baselineCommit !== REV17_CONTINUATION.targetBaselineCommit ||
      target.attestationCommit !== REV17_CONTINUATION.targetAttestationCommit) {
    errors.push('REV17 must preserve exact canonical REV15 topology');
  }
  return errors;
}

export function validateRepairAtRepo(repoRoot: string, state: State,
  target: CanonicalIdentity | null, continuation: CanonicalIdentity | null): string[] {
  const errors: string[] = [];
  const revision = state.governance.planAmendments.find(x => x.id === 'PLAN-REV17');
  errors.push(...validateRepairRecord(revision?.rev15DeliveryRepair, target));
  const read = (ref: string, file: string) => readGitBuffer(repoRoot, ['show', `${ref}:${file}`]);
  const json = (ref: string, file: string): State | null => {
    try { return JSON.parse(read(ref, file)!.toString()) as State; } catch { return null; }
  };
  const ancestor = (older: string, newer: string) => readGitBuffer(repoRoot, ['merge-base', '--is-ancestor', older, newer]) !== null;
  const originMain = readGitBuffer(repoRoot, ['rev-parse', 'refs/remotes/origin/main'])?.toString().trim();
  const fixed = REV17_CONTINUATION;
  if (!originMain || !/^[0-9a-f]{40}$/.test(originMain) || readGitBuffer(repoRoot, ['cat-file','-e',`${originMain}^{commit}`]) === null) {
    errors.push('REV17 requires readable origin/main commit for baseline and tip checks');
  }
  if (state.planRevision < 17 || revision?.baselineCommit !== fixed.targetBaselineCommit ||
      revision.deliveryAuthorization?.authorized !== true || revision.deliveryAuthorization.evidencePath !== fixed.authorityEvidencePath) {
    errors.push('REV17 requires preserved revision, baseline and direct delivery authority');
  }
  const original15 = json(fixed.targetCandidateCommit, 'docs/BUILD_STATE.json')?.governance.planAmendments.find(x => x.id === 'PLAN-REV15');
  if (!original15 || !isDeepStrictEqual(original15, state.governance.planAmendments.find(x => x.id === 'PLAN-REV15'))) {
    errors.push('REV17 must preserve the complete original REV15 amendment record');
  }
  for (const file of ['docs/evidence/PLAN-REV15.md','docs/evidence/PLAN-REV15-manifest.json','docs/reviews/PLAN-REV15.json']) {
    const original = read(fixed.targetAttestationCommit, file);
    let current: Buffer | null = null;
    try { current = fs.readFileSync(path.join(repoRoot, file)); } catch { /* fail closed */ }
    if (!original || !current || !original.equals(current)) errors.push(`REV17 must preserve ${file}`);
  }
  const candidate = continuation?.manifest.candidateCommit ?? 'HEAD';
  if (!ancestor(fixed.targetAttestationCommit, candidate)) errors.push('REV17 candidate must descend from exact A15');
  if (continuation && continuation.manifest.baselineCommit !== fixed.targetBaselineCommit) errors.push('REV17 candidate baseline changed');
  const changesRaw = readGitBuffer(repoRoot, ['diff','--name-only','--no-renames',fixed.targetAttestationCommit,candidate,'--']);
  const changes = changesRaw?.toString().trim().split('\n').filter(Boolean).sort();
  const allowed = [...fixed.allowedContinuationPaths].sort();
  if (!changes || changes.some(p => !allowed.includes(p as typeof allowed[number])) ||
      (continuation && !isDeepStrictEqual(changes, allowed))) errors.push('REV17 candidate violates exact continuation path boundary');
  // Validate immutable C17 after attestation, allowing later reviewed stages to evolve current allowed files.
  const candidateState = json(candidate, 'docs/BUILD_STATE.json');
  if (continuation && (!candidateState || !isDeepStrictEqual(candidateState.governance.planAmendments.find(x=>x.id==='PLAN-REV17'), revision))) {
    errors.push('REV17 complete attested amendment must remain unchanged');
  }
  if (continuation && !isDeepStrictEqual(candidateState?.governance.planAmendments.find(x=>x.id==='PLAN-REV15'), original15)) {
    errors.push('REV17 immutable candidate altered REV15 authority');
  }
  if (continuation) {
    const authority = read(candidate, fixed.authorityEvidencePath);
    let current: Buffer | null = null;
    try { current = fs.readFileSync(path.join(repoRoot,fixed.authorityEvidencePath)); } catch { /* fail closed */ }
    if (!authority || !current?.equals(authority)) errors.push('REV17 authority evidence must remain byte-identical');
  }
  try {
    const previous = JSON.parse(read(fixed.targetAttestationCommit,'web/package.json')!.toString());
    previous.scripts.test += ' && ' + REV17_TEST_COMMAND;
    const packaged = JSON.parse((continuation ? read(candidate,'web/package.json')! : fs.readFileSync(path.join(repoRoot,'web/package.json'))).toString());
    if (!isDeepStrictEqual(previous, packaged)) errors.push('REV17 package must add only its regression command');
  } catch { errors.push('REV17 package preservation is unreadable'); }
  if (originMain && !ancestor(fixed.targetAttestationCommit, originMain)) {
    if (originMain !== fixed.targetBaselineCommit) errors.push('REV17 undelivered baseline must remain pinned M0');
    const branch = process.env.GITHUB_HEAD_REF || readGitBuffer(repoRoot,['branch','--show-current'])?.toString().trim();
    if (branch !== fixed.continuationBranch) errors.push('REV17 must use exact authorized continuation branch');
  }
  const revision16 = state.governance.planAmendments.find(x=>x.id==='PLAN-REV16');
  if (revision16 && (!continuation || !originMain || !ancestor(continuation.attestationCommit,originMain) || !ancestor(continuation.attestationCommit,revision16.baselineCommit))) {
    errors.push('REV16 requires delivered REV15/REV17 predecessor and fresh delivered baseline');
  }
  return errors;
}
