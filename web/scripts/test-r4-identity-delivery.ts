import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readGitBuffer } from './plan-rev17-rev15-delivery-repair';
import { captureIdentityEvidence, validateIdentityEvidence, REV19_PINS as p, REV19_POLICY,
  REV19_MANIFEST, REV19_REVIEW, REV19_TEST_COMMAND, REV19_POLICY_RECEIPT, type IdentityEvidence } from './r4-identity-delivery';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const state=JSON.parse(readGitBuffer(root,['show',`${REV19_POLICY}:docs/BUILD_STATE.json`])!.toString());
const target={attestationCommit:p.targetAttestationCommit,manifest:{candidateCommit:p.targetCandidateCommit,baselineCommit:p.targetBaselineCommit}};
const raw=captureIdentityEvidence(root,state,target,null);
// Synthetic topology with real immutable policy evidence; production pins cannot
// be overridden and no source/provider access or repository mutation is needed.
const C='c'.repeat(40),A='a'.repeat(40),T='b'.repeat(40);
function fixture():IdentityEvidence {
 const e=structuredClone(raw);e.state=structuredClone(state);e.candidateState=structuredClone(state);
 e.candidate=C;e.candidateTree=T;e.continuation={attestationCommit:A,manifest:{candidateCommit:C,baselineCommit:p.targetBaselineCommit}};
 e.changedPaths=p.allowedContinuationPaths.filter(x=>x!==REV19_MANIFEST&&x!==REV19_REVIEW);
 e.candidatePackage=structuredClone(e.originalPackage);e.candidatePackage.scripts.test+=' && '+REV19_TEST_COMMAND;
 e.candidateFromA18=true;e.policyBeforeImplementation=true;e.appendOnlyDocuments=true;
 e.attestationParents=[C];e.attestationPaths=[REV19_MANIFEST,REV19_REVIEW];e.attestationInHistory=true;
 e.originMain=p.targetBaselineCommit;e.branch=p.continuationBranch;e.tip=A;e.delivered=false;
 e.commitIdentities=[[p.ownerName,p.ownerEmail,p.ownerName,p.ownerEmail]];
 e.review={schemaVersion:1,stageId:'PLAN-REV19',outcome:'accepted',reviewedAt:'2026-09-14T17:00:00.000Z',reviewerTaskId:'/test/independent',reviewerWasAuthorOrEditor:false,reviewMode:'fresh-context-read-only',candidateCommit:C,candidateTree:T,baselineCommit:p.targetBaselineCommit,findings:{critical:0,high:0,medium:0,low:0},unresolvedFindings:{critical:0,high:0,medium:0,low:0},dispositions:[]};return e;
}
assert.deepEqual(validateIdentityEvidence(fixture()),[]);
const attacks:Array<[string,(e:IdentityEvidence)=>void]>=[
 ['original A18',e=>e.target!.attestationCommit='0'.repeat(40)],
 ['original C18',e=>e.target!.manifest.candidateCommit='0'.repeat(40)],
 ['original baseline',e=>e.target!.manifest.baselineCommit='0'.repeat(40)],
 ['original topology',e=>e.originalTopologyValid=false],
 ['expanded allowlist',e=>e.state.governance.planAmendments.at(-1).r4IdentityRepair.allowedContinuationPaths.push('web/src/app/page.tsx')],
 ['owner pin',e=>e.state.governance.planAmendments.at(-1).r4IdentityRepair.ownerName='other'],
 ['extra effect',e=>e.state.governance.planAmendments.at(-1).r4IdentityRepair.authorizedEffects.push('paid_action')],
 ['missing authority',e=>e.authority=null],['denied authority',e=>e.authority!.authorized=false],
 ['changed authority proof',e=>e.proofHashes['docs/evidence/r4-identity-repair/authority.json']='0'.repeat(64)],
 ['original review',e=>e.originalReviewHash='0'.repeat(64)],['original manifest',e=>e.originalManifestHash='0'.repeat(64)],
 ['historical evidence',e=>e.originalEvidenceChanged.push('docs/evidence/PLAN-REV18.md')],
 ['original grant',e=>e.state.governance.planAmendments.find((x:any)=>x.id==='PLAN-REV18').deliveryAuthorization.authorized=false],
 ['other state',e=>e.candidateState.activeStageId='P9'],
 ['extra candidate path',e=>e.changedPaths!.push('web/src/app/page.tsx')],
 ['missing candidate evidence',e=>e.changedPaths=e.changedPaths!.filter(x=>!x.endsWith('/validation.json'))],
 ['unreadable changes',e=>e.changedPaths=null],['wrong ancestry',e=>e.candidateFromA18=false],
 ['missing policy review',e=>e.policyReview=null],['policy reviewer authored',e=>e.policyReview!.reviewerWasAuthorOrEditor=true],
 ['policy manifest',e=>e.policyManifestValid=false],['implementation before policy',e=>e.policyBeforeImplementation=false],
 ['policy rebound',e=>e.policyReview!.candidateCommit=C],
 ['current proof altered',e=>e.currentProofHashes['docs/evidence/r4-identity-repair/policy-review.json']='0'.repeat(64)],
 ['dependency',e=>e.candidatePackage.dependencies.bad='1'],['test chain',e=>e.candidatePackage.scripts.test=REV19_TEST_COMMAND],
 ['removed handoff',e=>e.appendOnlyDocuments=false],
 ['wrong author',e=>e.commitIdentities![0][0]='Franscale1922'],['wrong committer',e=>e.commitIdentities![0][2]='other'],
 ['wrong email',e=>e.commitIdentities![0][1]='other@example.test'],['missing identity proof',e=>e.commitIdentities=null],
 ['moved main',e=>e.originMain='0'.repeat(40)],['missing main',e=>e.originMain=null],['wrong branch',e=>e.branch='codex/unrelated'],
 ['non-direct child',e=>e.attestationParents=['0'.repeat(40)]],['merge attestation',e=>e.attestationParents.push('0'.repeat(40))],
 ['extra attestation path',e=>e.attestationPaths.push('docs/extra.md')],['missing attestation path',e=>e.attestationPaths.pop()],
 ['post A19 tip',e=>e.tip='0'.repeat(40)],['outside history',e=>e.attestationInHistory=false],
 ['missing final review',e=>e.review=null],['wrong review tree',e=>e.review!.candidateTree='0'.repeat(40)],
 ['wrong final candidate',e=>e.review!.candidateCommit='0'.repeat(40)],['wrong continuation baseline',e=>e.continuation!.manifest.baselineCommit='0'.repeat(40)],
 ['final reviewer authored',e=>e.review!.reviewerWasAuthorOrEditor=true],['high finding',e=>e.review!.findings.high=1],
 ['unresolved low',e=>e.review!.unresolvedFindings.low=1],['missing disposition',e=>e.review!.findings.medium=1],
 ['timestamp',e=>e.review!.reviewedAt='2026-09-14T17:00:00.000000+00:00'],
];
for(const [name,mutate] of attacks){const e=fixture();mutate(e);assert(validateIdentityEvidence(e).length>0,`must reject ${name}`);}
const preparing=fixture();preparing.continuation=null;preparing.review=null;preparing.changedPaths=['AGENTS.md'];preparing.tip=C;
assert.deepEqual(validateIdentityEvidence(preparing),[],'preparation helper does not waive canonical missing attestation gates');
const later=fixture();later.delivered=true;later.originMain='d'.repeat(40);later.tip='e'.repeat(40);later.branch='codex/separately-authorized-next';
later.state.planRevision=20;later.state.r4CatalogRelease.status='delivered-verified';later.state.governance.planAmendments.push({id:'PLAN-REV20',baselineCommit:later.originMain});
assert.deepEqual(validateIdentityEvidence(later),[],'later current runtime/state may evolve while C19 remains preserved');
later.candidatePackage.dependencies.changedHistoricalRuntime='1';assert(validateIdentityEvidence(later).length>0,'changed historical candidate proof must fail');
console.log(`R4 identity continuation PASS: ${attacks.length} negative gates, exact topology, preparation limits, later evolution and historical preservation.`);

// Exercise the real Git/filesystem adapter in a disposable local repository. It
// reads existing objects locally and never touches this repository's refs/index.
const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'rev19-history-test-'));
const env: NodeJS.ProcessEnv={...process.env,GIT_AUTHOR_NAME:p.ownerName,GIT_AUTHOR_EMAIL:p.ownerEmail,GIT_COMMITTER_NAME:p.ownerName,GIT_COMMITTER_EMAIL:p.ownerEmail};
delete env.GITHUB_HEAD_REF;delete env.STAGE_BRANCH_TIP_SHA;
const git=(...args:string[])=>execFileSync('git',args,{cwd:temporary,env,encoding:'utf8',stdio:['ignore','pipe','pipe'],maxBuffer:16*1024*1024}).trim();
try {
 execFileSync('git',['clone','--shared','--no-checkout',root,temporary],{env,stdio:'pipe'});
 git('checkout','-b',p.continuationBranch+'-fixture',REV19_POLICY_RECEIPT);
 for(const file of p.allowedContinuationPaths){
  if(file===REV19_MANIFEST||file===REV19_REVIEW)continue;
  const dest=path.join(temporary,file);fs.mkdirSync(path.dirname(dest),{recursive:true});
  const canonicalPath=path.join(root,REV19_MANIFEST);
  const frozen=fs.existsSync(canonicalPath)?JSON.parse(fs.readFileSync(canonicalPath,'utf8')).candidateCommit:null;
  const bytes=frozen?readGitBuffer(root,['show',`${frozen}:${file}`]):
    fs.existsSync(path.join(root,file))?fs.readFileSync(path.join(root,file)):Buffer.from('{}\n');
  assert(bytes,`fixture requires immutable candidate bytes for ${file}`);fs.writeFileSync(dest,bytes);
 }
 // The real candidate state is the approved policy, regardless of when this test
 // runs in a later release whose current state/runtime may have changed.
 fs.writeFileSync(path.join(temporary,'docs/BUILD_STATE.json'),JSON.stringify(state,null,2)+'\n');
 const pack=structuredClone(raw.originalPackage);pack.scripts.test+=' && '+REV19_TEST_COMMAND;
 fs.writeFileSync(path.join(temporary,'web/package.json'),JSON.stringify(pack,null,2)+'\n');
 git('add','--',...p.allowedContinuationPaths.filter(x=>x!==REV19_MANIFEST&&x!==REV19_REVIEW));
 git('commit','--allow-empty','-m','TEST ONLY synthetic reviewed correction candidate');
 const c=git('rev-parse','HEAD'),tree=git('rev-parse','HEAD^{tree}');
 const syntheticManifest={schemaVersion:1,stageId:'PLAN-REV19',createdAt:'2026-09-14T17:00:00.000Z',baselineCommit:p.targetBaselineCommit,candidateCommit:c,files:[]};
 const syntheticReview={...fixture().review,candidateCommit:c,candidateTree:tree};
 fs.mkdirSync(path.join(temporary,'docs/reviews'),{recursive:true});
 fs.writeFileSync(path.join(temporary,REV19_MANIFEST),JSON.stringify(syntheticManifest)+'\n');
 fs.writeFileSync(path.join(temporary,REV19_REVIEW),JSON.stringify(syntheticReview)+'\n');
 git('add','--',REV19_MANIFEST,REV19_REVIEW);git('commit','-m','TEST ONLY direct child attestation topology');
 const a=git('rev-parse','HEAD'),canonical={attestationCommit:a,manifest:syntheticManifest};
 git('update-ref','refs/remotes/origin/main',p.targetBaselineCommit);
 const beforeEnv={head:process.env.GITHUB_HEAD_REF,tip:process.env.STAGE_BRANCH_TIP_SHA};
 process.env.GITHUB_HEAD_REF=p.continuationBranch;delete process.env.STAGE_BRANCH_TIP_SHA;
 try {
  assert.deepEqual(validateIdentityEvidence(captureIdentityEvidence(temporary,state,target,canonical)),[],'real adapter recognizes exact candidate preservation');
  git('update-ref','refs/remotes/origin/main',a);
  fs.appendFileSync(path.join(temporary,'web/src/app/page.tsx'),'\n// TEST ONLY later separately authorized runtime evolution\n');
  const evolved=structuredClone(state);evolved.planRevision=20;evolved.r4CatalogRelease.status='delivered-verified';
  fs.writeFileSync(path.join(temporary,'docs/BUILD_STATE.json'),JSON.stringify(evolved)+'\n');
  git('add','web/src/app/page.tsx','docs/BUILD_STATE.json');git('commit','-m','TEST ONLY later runtime and state evolution');
  assert.deepEqual(validateIdentityEvidence(captureIdentityEvidence(temporary,evolved,target,canonical)),[],'real adapter uses immutable C19 rather than later runtime/state');
  fs.appendFileSync(path.join(temporary,'docs/evidence/r4-identity-repair/policy-review.json'),' ');
  assert(validateIdentityEvidence(captureIdentityEvidence(temporary,evolved,target,canonical)).length>0,'real adapter rejects changed historical review after delivery');
 } finally {
  if(beforeEnv.head===undefined)delete process.env.GITHUB_HEAD_REF;else process.env.GITHUB_HEAD_REF=beforeEnv.head;
  if(beforeEnv.tip===undefined)delete process.env.STAGE_BRANCH_TIP_SHA;else process.env.STAGE_BRANCH_TIP_SHA=beforeEnv.tip;
 }
 console.log('R4 identity real Git adapter PASS: immutable candidate, later runtime/state evolution, historical proof rejection.');
} finally {fs.rmSync(temporary,{recursive:true,force:true});}
