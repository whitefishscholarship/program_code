import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { isDeepStrictEqual as equal } from 'node:util';
import { readGitBuffer, type CanonicalIdentity } from './plan-rev17-rev15-delivery-repair';

export const REV19_TEST_COMMAND = 'node --import tsx scripts/test-r4-identity-delivery.ts';
export const REV19_PINS = {
  "targetAmendmentId": "PLAN-REV18",
  "targetCandidateCommit": "5e5c140dc49250234438fa9b741064acc7aa8375",
  "targetAttestationCommit": "d6fdc0d0470dec199c6b93e2c0525b6eebe2e4e2",
  "targetBaselineCommit": "a8aa6f958f029b7edfacf03ac6c5848e9e8f4b32",
  "targetManifestSha256": "a5ec94957e50cecfea9c8aadd16792b98143e92bea3c5ba9f4c03e0705ce3360",
  "targetReviewSha256": "2e4021edb28bcfc4431a2834c0b5027e35ac7d4e474fc61a4b7e8edb611ec4f4",
  "continuationBranch": "codex/r4-whitefish-delivery-repair",
  "ownerName": "whitefishscholarship",
  "ownerEmail": "whitefishscholarship@gmail.com",
  "githubOwnerId": 266880911,
  "projectId": "prj_LbefE2deji6nPND6iBiuofe7IABv",
  "teamId": "team_6CAjRq58n0WvAH49otKSQbA7",
  "canonicalHostname": "web-two-gules-45.vercel.app",
  "allowedContinuationPaths": [
    "AGENTS.md",
    "docs/SCHOLARSHIP_SYSTEM_BUILD_PLAN.md",
    "docs/BUILD_STATE.json",
    "docs/DECISIONS.md",
    "docs/CURRENT_HANDOFF.md",
    "web/scripts/validate-build-plan.ts",
    "web/package.json",
    "docs/evidence/PLAN-REV19.md",
    "docs/evidence/PLAN-REV19-manifest.json",
    "docs/reviews/PLAN-REV19.json",
    "docs/kickoffs/R4-WHITEFISH-DELIVERY.md",
    "web/scripts/r4-identity-delivery.ts",
    "web/scripts/test-r4-identity-delivery.ts",
    "docs/evidence/r4-identity-repair/authority.json",
    "docs/evidence/r4-identity-repair/preflight.json",
    "docs/evidence/r4-identity-repair/policy-manifest.json",
    "docs/evidence/r4-identity-repair/policy-review.json",
    "docs/evidence/r4-identity-repair/policy-validation.json",
    "docs/evidence/r4-identity-repair/preservation.json",
    "docs/evidence/r4-identity-repair/validation.json",
    "docs/evidence/r4-identity-repair/RELEASE_CANDIDATE.md"
  ],
  "authorizedEffects": [
    "branch_push",
    "pull_request",
    "vercel_preview",
    "merge",
    "vercel_production",
    "ci_and_deployment_verification",
    "close_original_pr_unmerged_after_replacement_exists"
  ],
  "forbiddenEffects": [
    "source_or_workbook_access",
    "runtime_change",
    "dependency_change",
    "configuration_change",
    "account_or_access_change",
    "paid_action",
    "published_history_rewrite",
    "rollback",
    "monitoring",
    "provider_or_applicant_interaction",
    "R5_R7"
  ]
} as const;
export const REV19_MANIFEST = 'docs/evidence/PLAN-REV19-manifest.json';
export const REV19_REVIEW = 'docs/reviews/PLAN-REV19.json';
export const REV19_POLICY = '07d5d8df6b722bd83557bbcd160d68bf5cc55918';
export const REV19_POLICY_RECEIPT = '0ef74cbb7b7ae7b87ef6b3acc12d0e8804542efc';
const PROOFS: Record<string,string> = {
  'docs/evidence/r4-identity-repair/authority.json':'eff73ecd1c87552b94e8de534189352daa7ca0e94397207c0052987726d52f5a',
  'docs/evidence/r4-identity-repair/policy-manifest.json':'d5e92bd051e1fe6b5b209b98d325c5fdd81b63a14631b0524f2b714695174e28',
  'docs/evidence/r4-identity-repair/policy-review.json':'016b406992ce89f0c3623dcee3c095b6fdf9850a6a2edecf7f13207fef867442',
};
// Data is extracted from Git and the working tree below. Keeping the decision pure
// lets negative regressions exercise each gate without manufacturing historical SHAs.
type Json = Record<string, any>;
export type IdentityEvidence = {
  state: Json; candidateState: Json; originalState: Json; policyState: Json;
  target: CanonicalIdentity | null; continuation: CanonicalIdentity | null;
  candidate: string; candidateTree: string | null; review: Json | null;
  authority: Json | null; policyManifest: Json | null; policyReview: Json | null;
  proofHashes: Record<string,string|null>; currentProofHashes: Record<string,string|null>;
  originalManifestHash: string | null; originalReviewHash: string | null;
  changedPaths: string[] | null; originalEvidenceChanged: string[];
  candidateFromA18: boolean; policyBeforeImplementation: boolean; policyManifestValid: boolean;
  originalTopologyValid: boolean; attestationParents: string[]; attestationPaths: string[];
  commitIdentities: string[][] | null; originMain: string|null; delivered: boolean;
  branch: string|null; tip: string|null; attestationInHistory: boolean;
  originalPackage: Json; candidatePackage: Json; appendOnlyDocuments: boolean;
};
const digest = (b: Buffer | null) => b ? createHash('sha256').update(b).digest('hex') : null;
const iso = (s: unknown) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(s);
const amendment = (s: Json, id: string) => s?.governance?.planAmendments?.find((a: Json)=>a.id===id);
function validReview(r: Json | null, outcome: string): boolean {
  if (!r || r.schemaVersion!==1 || r.outcome!==outcome || !r.reviewerTaskId?.trim() ||
      r.reviewerWasAuthorOrEditor!==false || r.reviewMode!=='fresh-context-read-only' || !iso(r.reviewedAt)) return false;
  const severities=['critical','high','medium','low'];
  if (severities.some(s=>!Number.isInteger(r.findings?.[s]) || r.findings[s]<0 || r.unresolvedFindings?.[s]!==0) ||
      r.findings.critical!==0 || r.findings.high!==0 || !Array.isArray(r.dispositions)) return false;
  return r.dispositions.length===r.findings.medium+r.findings.low && ['medium','low'].every(s=>
    r.dispositions.filter((d: Json)=>d.severity===s).length===r.findings[s]) && r.dispositions.every((d: Json)=>
      ['summary','rationale','owner','target'].every(k=>typeof d[k]==='string' && d[k].trim()));
}
export function validateIdentityEvidence(e: IdentityEvidence): string[] {
  const errors: string[]=[];const require=(ok: unknown,message:string)=>{if(!ok)errors.push('REV19 '+message);};
  const p=REV19_PINS; const r=amendment(e.state,'PLAN-REV19'); const c=amendment(e.candidateState,'PLAN-REV19');
  require(equal(r?.r4IdentityRepair,p),'requires exact authorized pins, identity, target, effects and finite allowlist');
  require(equal(r,amendment(e.policyState,'PLAN-REV19')) && equal(r,c),'must preserve complete independently reviewed amendment and direct authority');
  require(e.state.planRevision>=19 && c?.baselineCommit===p.targetBaselineCommit && c?.deliveryAuthorization?.authorized===true &&
    c?.deliveryAuthorization?.evidencePath==='docs/evidence/PLAN-REV19.md','requires revision19 and direct evidence-bound delivery authority');
  require(e.target?.attestationCommit===p.targetAttestationCommit && e.target.manifest.candidateCommit===p.targetCandidateCommit &&
    e.target.manifest.baselineCommit===p.targetBaselineCommit && e.originalTopologyValid,'must preserve exact canonical A18/C18 topology');
  require(e.originalManifestHash===p.targetManifestSha256 && e.originalReviewHash===p.targetReviewSha256,'must preserve original canonical manifest/review hashes');
  require(equal(amendment(e.state,'PLAN-REV18'),amendment(e.originalState,'PLAN-REV18')),'must preserve original REV18 amendment/grant');
  const derived=structuredClone(e.candidateState);
  derived.planRevision=e.originalState.planRevision;
  if(derived.governance?.planAmendments)derived.governance.planAmendments=derived.governance.planAmendments.filter((x:Json)=>x.id!=='PLAN-REV19');
  require(e.candidateState.planRevision===19 && equal(derived,e.originalState),'candidate may change only planRevision and append the new state amendment');
  require(e.candidateFromA18,'candidate must descend from exact A18');
  require(e.changedPaths && e.changedPaths.every(x=>(p.allowedContinuationPaths as readonly string[]).includes(x)),'candidate exceeds finite path boundary or changes preserved runtime/evidence');
  require(e.originalEvidenceChanged.length===0,'must preserve historical evidence/review bytes in the current tree');
  require(e.appendOnlyDocuments,'must retain original AGENTS, decisions and complete handoff content');
  const packaged=structuredClone(e.originalPackage);if(packaged.scripts)packaged.scripts.test+=' && '+REV19_TEST_COMMAND;
  require(equal(packaged,e.candidatePackage),'package must append only the exact regression test command');
  require(e.policyBeforeImplementation && e.policyManifestValid,'requires exact frozen policy and complete manifest before implementation');
  for(const [file,hash] of Object.entries(PROOFS)){
    require(e.proofHashes[file]===hash && e.currentProofHashes[file]===hash,`must preserve exact approved proof ${file}`);
  }
  require(e.authority?.authorized===true && e.authority.userReply==='approved' && equal(e.authority.pins,p),'requires the selected direct authority receipt');
  require(validReview(e.policyReview,'PASS') && e.policyReview?.candidateCommit===REV19_POLICY &&
    e.policyReview?.candidateManifestSha256===PROOFS['docs/evidence/r4-identity-repair/policy-manifest.json'],'requires independently accepted policy review binding');
  require(e.originMain && /^[0-9a-f]{40}$/.test(e.originMain),'requires readable origin/main');
  require(e.commitIdentities && e.commitIdentities.length>0 && e.commitIdentities.every(a=>equal(a,[p.ownerName,p.ownerEmail,p.ownerName,p.ownerEmail])),'all new repair commits require selected Whitefish author AND committer');
  if(!e.delivered){
    require(e.originMain===p.targetBaselineCommit,'undelivered baseline must remain pinned M0');
    require(e.branch===p.continuationBranch,'requires exact authorized continuation branch');
  }
  if(e.continuation){
    const a=e.continuation;const rv=e.review;
    require(a.manifest.baselineCommit===p.targetBaselineCommit && e.candidate===a.manifest.candidateCommit,'canonical continuation baseline/candidate binding changed');
    require(equal(e.attestationParents,[e.candidate]) && equal([...e.attestationPaths].sort(),[REV19_MANIFEST,REV19_REVIEW].sort()),'attestation must be a single-parent direct child changing exactly two canonical paths');
    require(e.attestationInHistory,'canonical attestation must remain in current history');
    require(validReview(rv,'accepted') && rv?.stageId==='PLAN-REV19' && rv?.candidateCommit===e.candidate &&
      rv?.baselineCommit===p.targetBaselineCommit && rv?.candidateTree===e.candidateTree,'requires complete independently accepted final candidate review binding');
    require(e.delivered || e.tip===a.attestationCommit,'undelivered tip must equal A19 exactly');
    require(e.changedPaths && equal([...e.changedPaths].sort(),p.allowedContinuationPaths.filter(x=>x!==REV19_MANIFEST&&x!==REV19_REVIEW).sort()),'accepted candidate requires the complete finite implementation/evidence set');
  }
  return errors;
}

export function captureIdentityEvidence(repo: string, state: Json, target: CanonicalIdentity|null, continuation: CanonicalIdentity|null): IdentityEvidence {
  const g=(...args:string[])=>readGitBuffer(repo,args);
  const text=(...args:string[])=>g(...args)?.toString().trim()??null;
  const lines=(...args:string[])=>{const s=text(...args);return s===null?null:s.split('\n').filter(Boolean);};
  const read=(ref:string,file:string)=>g('show',`${ref}:${file}`);
  const current=(file:string)=>{try{return fs.readFileSync(path.join(repo,file));}catch{return null;}};
  const json=(b:Buffer|null):Json=>{try{return JSON.parse(b!.toString());}catch{return {};}};
  const ancestor=(a:string,b:string)=>g('merge-base','--is-ancestor',a,b)!==null;
  const fixed=REV19_PINS; const candidate=continuation?.manifest.candidateCommit??'HEAD';
  const selected=(file:string)=>continuation?read(candidate,file):current(file);
  const origin=text('rev-parse','refs/remotes/origin/main');
  const originalState=json(read(fixed.targetAttestationCommit,'docs/BUILD_STATE.json'));
  const policyManifest=json(selected('docs/evidence/r4-identity-repair/policy-manifest.json'));
  const policyChanges=lines('diff','--name-only','--no-renames',fixed.targetAttestationCommit,REV19_POLICY,'--');
  const policyFiles=policyManifest.files as Json[]|undefined;
  const policyManifestValid=policyManifest.stageId==='PLAN-REV19-POLICY' && policyManifest.baselineCommit===fixed.targetAttestationCommit &&
    policyManifest.candidateCommit===REV19_POLICY && Array.isArray(policyFiles) &&
    equal(policyFiles.map(f=>f.path).sort(),policyChanges?.sort()) && policyFiles.every(f=>f.change==='present' && digest(read(REV19_POLICY,f.path))===f.sha256);
  const changed=continuation?lines('diff','--name-only','--no-renames',fixed.targetAttestationCommit,candidate,'--'):
    lines('diff','--name-only','--no-renames',fixed.targetAttestationCommit,'--');
  const untracked=continuation?[]:lines('ls-files','--others','--exclude-standard');
  const tracked=lines('ls-tree','-r',fixed.targetAttestationCommit)??[];
  const historical=tracked.filter(l=>/\tdocs\/(evidence|reviews)\//.test(l));
  const originalEvidenceChanged=historical.flatMap(l=>{
    const [meta,file]=l.split('\t'); const b=current(file);
    const oid=b?createHash('sha1').update(Buffer.from(`blob ${b.length}\0`)).update(b).digest('hex'):null;
    return oid===meta.split(' ')[2]?[]:[file];
  });
  const proofPaths=[...Object.keys(PROOFS),'docs/evidence/PLAN-REV19.md','docs/evidence/r4-identity-repair/policy-validation.json'];
  // After acceptance, current proof bytes are compared with immutable C19; runtime
  // and ordinary current state are deliberately not compared with that old tree.
  if(continuation)for(const file of proofPaths){if(!selected(file)?.equals(current(file)??Buffer.alloc(0)))originalEvidenceChanged.push(file);}
  const end=continuation?.attestationCommit??'HEAD';
  const identities=lines('log','--format=%an%x00%ae%x00%cn%x00%ce',`${fixed.targetAttestationCommit}..${end}`);
  const parents=(ref:string)=>text('show','-s','--format=%P',ref)?.split(' ').filter(Boolean)??[];
  const originalPaths=lines('diff','--name-only',fixed.targetCandidateCommit,fixed.targetAttestationCommit,'--')??[];
  return {state,candidateState:continuation?json(read(candidate,'docs/BUILD_STATE.json')):state,originalState,
    policyState:json(read(REV19_POLICY,'docs/BUILD_STATE.json')),target,continuation,candidate,
    candidateTree:text('rev-parse',`${candidate}^{tree}`),review:continuation?json(read(end,REV19_REVIEW)):null,
    authority:json(selected('docs/evidence/r4-identity-repair/authority.json')),policyManifest,
    policyReview:json(selected('docs/evidence/r4-identity-repair/policy-review.json')),
    proofHashes:Object.fromEntries(Object.keys(PROOFS).map(f=>[f,digest(selected(f))])),
    currentProofHashes:Object.fromEntries(Object.keys(PROOFS).map(f=>[f,digest(current(f))])),
    originalManifestHash:digest(selected('docs/evidence/PLAN-REV18-manifest.json')),
    originalReviewHash:digest(selected('docs/reviews/PLAN-REV18.json')),
    changedPaths:changed&&untracked?[...new Set([...changed,...untracked])]:null,originalEvidenceChanged,
    candidateFromA18:ancestor(fixed.targetAttestationCommit,candidate),
    policyBeforeImplementation:ancestor(REV19_POLICY,candidate)&&ancestor(REV19_POLICY_RECEIPT,candidate)&&
      g('cat-file','-e',`${REV19_POLICY_RECEIPT}:web/scripts/r4-identity-delivery.ts`)===null,
    policyManifestValid,
    originalTopologyValid:equal(parents(fixed.targetAttestationCommit),[fixed.targetCandidateCommit])&&
      equal(originalPaths.sort(),['docs/evidence/PLAN-REV18-manifest.json','docs/reviews/PLAN-REV18.json'].sort()),
    attestationParents:continuation?parents(end):[],attestationPaths:continuation?(lines('diff','--name-only',candidate,end,'--')??[]):[],
    commitIdentities:identities?.map(x=>x.split('\0'))??null,originMain:origin,
    delivered:!!continuation&&!!origin&&ancestor(end,origin),
    branch:process.env.GITHUB_HEAD_REF||text('branch','--show-current'),
    tip:process.env.STAGE_BRANCH_TIP_SHA||text('rev-parse','HEAD'),attestationInHistory:!!continuation&&ancestor(end,'HEAD'),
    originalPackage:json(read(fixed.targetAttestationCommit,'web/package.json')),candidatePackage:json(selected('web/package.json')),
    appendOnlyDocuments:['AGENTS.md','docs/DECISIONS.md'].every(f=>selected(f)?.toString().startsWith(read(fixed.targetAttestationCommit,f)?.toString()??'\0')) &&
      !!selected('docs/CURRENT_HANDOFF.md')?.toString().endsWith(read(fixed.targetAttestationCommit,'docs/CURRENT_HANDOFF.md')?.toString()??'\0'),
  };
}
export function validateIdentityRepairAtRepo(repo: string,state: Json,target:CanonicalIdentity|null,continuation:CanonicalIdentity|null):string[]{
  try{return validateIdentityEvidence(captureIdentityEvidence(repo,state,target,continuation));}
  catch{return ['REV19 identity continuation evidence is unreadable or malformed'];}
}
