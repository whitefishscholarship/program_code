import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { GIT_BLOB_MAX_BUFFER, REV17_CONTINUATION as fixed, readGitBuffer, matchesBlobHash, validateRepairRecord, validateRepairAtRepo } from './plan-rev17-rev15-delivery-repair';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const state = JSON.parse(fs.readFileSync(path.join(root,'docs/BUILD_STATE.json'),'utf8'));
const target = {manifest:{candidateCommit:fixed.targetCandidateCommit,baselineCommit:fixed.targetBaselineCommit},attestationCommit:fixed.targetAttestationCommit};
assert.deepEqual(validateRepairRecord(state.governance.planAmendments.find((x:{id:string})=>x.id==='PLAN-REV17').rev15DeliveryRepair,target),[]);
for (const key of Object.keys(fixed)) {
  const mutation: Record<string,unknown> = structuredClone(fixed);
  mutation[key] = 'unauthorized';
  assert(validateRepairRecord(mutation,target).length, key);
}
assert(validateRepairRecord(fixed,null).length);
assert(validateRepairRecord(fixed,{...target,attestationCommit:'a'.repeat(40)}).length);
for(const key of ['candidateCommit','baselineCommit']) assert(validateRepairRecord(fixed,{...target,manifest:{...target.manifest,[key]:'b'.repeat(40)}}).length);
const manifest = JSON.parse(fs.readFileSync(path.join(root,'docs/evidence/PLAN-REV15-manifest.json'),'utf8'));
let oversized = 0;
for(const file of manifest.files) {
  if(file.change!=='present')continue;
  const args=['show',`${fixed.targetCandidateCommit}:${file.path}`];
  const size = Number(execFileSync('git',['cat-file','-s',`${fixed.targetCandidateCommit}:${file.path}`],{cwd:root,encoding:'utf8'}));
  if(size<=1024*1024)continue;
  const bytes=readGitBuffer(root,args);
  assert.equal(bytes?.length,size);
  assert(matchesBlobHash(bytes,file.sha256));
  assert(!matchesBlobHash(bytes,'0'.repeat(64)));
  assert.throws(()=>execFileSync('git',args,{cwd:root,stdio:['ignore','pipe','pipe']}),(e:unknown)=>(e as {code:string}).code==='ENOBUFS');
  oversized++;
}
assert.equal(oversized,4);
assert.equal(readGitBuffer(root,['show',`${fixed.targetCandidateCommit}:missing-rev17-test-object`]),null);
assert(!matchesBlobHash(null,'0'.repeat(64)));
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'rev17-reader-test-'));
try {
  execFileSync('git',['init','--quiet',temp]);
  const hash=execFileSync('git',['hash-object','-w','--stdin'],{cwd:temp,input:Buffer.alloc(GIT_BLOB_MAX_BUFFER+1024,65),encoding:'utf8'}).trim();
  assert.equal(readGitBuffer(temp,['cat-file','blob',hash]),null,'over-limit read must fail closed');
} finally { fs.rmSync(temp,{recursive:true,force:true}); }
// A separate local repository uses shared read-only objects and its own refs/files.
// Prove clean current and canonical-candidate contexts before testing specific failures.
const fixture=fs.mkdtempSync(path.join(os.tmpdir(),'rev17-boundary-test-'));
const savedHeadRef=process.env.GITHUB_HEAD_REF;
delete process.env.GITHUB_HEAD_REF;
const git=(...args:string[])=>execFileSync('git',args,{cwd:fixture,encoding:'utf8',stdio:['pipe','pipe','pipe']}).trim();
try {
  execFileSync('git',['clone','--quiet','--shared','--no-checkout',root,fixture]);
  if (git('branch','--show-current') === fixed.continuationBranch) git('branch','-m','synthetic-initial');
  git('checkout','--quiet','-b',fixed.continuationBranch,fixed.targetAttestationCommit);
  git('update-ref','refs/remotes/origin/main',fixed.targetBaselineCommit);
  const existingManifest=path.join(root,'docs/evidence/PLAN-REV17-manifest.json');
  const sourceCandidate=fs.existsSync(existingManifest)?JSON.parse(fs.readFileSync(existingManifest,'utf8')).candidateCommit:null;
  for(const file of fixed.allowedContinuationPaths) {
    const bytes=sourceCandidate?readGitBuffer(root,['show',`${sourceCandidate}:${file}`]):fs.readFileSync(path.join(root,file));
    assert(bytes);fs.mkdirSync(path.dirname(path.join(fixture,file)),{recursive:true});fs.writeFileSync(path.join(fixture,file),bytes);
  }
  git('add','--',...fixed.allowedContinuationPaths);
  git('-c','user.name=Local synthetic test','-c','user.email=synthetic@example.invalid','commit','--quiet','-m','Synthetic isolated repair candidate');
  const candidate=git('rev-parse','HEAD');
  const fixtureState=JSON.parse(fs.readFileSync(path.join(fixture,'docs/BUILD_STATE.json'),'utf8'));
  const canonical={manifest:{candidateCommit:candidate,baselineCommit:fixed.targetBaselineCommit},attestationCommit:candidate};
  const check=(state=fixtureState,context:typeof canonical|null=canonical)=>validateRepairAtRepo(fixture,state,target,context);
  assert.deepEqual(check(fixtureState,null),[],'known-valid pre-attestation repair context');
  assert.deepEqual(check(),[],'known-valid immutable candidate context');
  for(const [mutate,expected] of [
    [(s:typeof fixtureState)=>{s.governance.planAmendments.find((x:{id:string})=>x.id==='PLAN-REV15').deliveryAuthorization.scope='changed';},'complete original REV15 amendment'],
    [(s:typeof fixtureState)=>{s.governance.planAmendments.find((x:{id:string})=>x.id==='PLAN-REV17').deliveryAuthorization.authorized=false;},'direct delivery authority'],
    [(s:typeof fixtureState)=>{s.planRevision=16;},'preserved revision'],
    [(s:typeof fixtureState)=>{s.governance.planAmendments.push({id:'PLAN-REV16',baselineCommit:fixed.targetBaselineCommit});},'REV16 requires delivered'],
  ] as const) {
    const copy=structuredClone(fixtureState);mutate(copy);assert(check(copy).some(x=>x.includes(expected)),expected);
  }
  for(const file of ['docs/evidence/PLAN-REV15.md','docs/evidence/PLAN-REV15-manifest.json','docs/reviews/PLAN-REV15.json']) {
    const p=path.join(fixture,file),original=fs.readFileSync(p);fs.appendFileSync(p,'tampered');
    assert(check().includes(`REV17 must preserve ${file}`));fs.writeFileSync(p,original);
  }
  const authority=path.join(fixture,fixed.authorityEvidencePath),originalAuthority=fs.readFileSync(authority);
  fs.appendFileSync(authority,'tampered');assert(check().some(x=>x.includes('authority evidence must remain')));fs.writeFileSync(authority,originalAuthority);
  git('update-ref','-d','refs/remotes/origin/main');assert(check().some(x=>x.includes('requires readable origin/main')));
  git('update-ref','refs/remotes/origin/main',git('rev-parse',`${fixed.targetBaselineCommit}^`));assert(check().some(x=>x.includes('baseline must remain pinned')));
  git('update-ref','refs/remotes/origin/main',fixed.targetBaselineCommit);
  git('checkout','--quiet','-b','codex/unapproved-synthetic-branch');assert(check().some(x=>x.includes('exact authorized continuation branch')));
  git('checkout','--quiet',fixed.continuationBranch);
  assert.deepEqual(check(),[],'restored fixture remains valid');
  fs.writeFileSync(path.join(fixture,'unapproved-test-file'),'synthetic');git('add','unapproved-test-file');
  git('-c','user.name=Local synthetic test','-c','user.email=synthetic@example.invalid','commit','--quiet','-m','Synthetic out of scope candidate');
  const bad={...canonical,manifest:{...canonical.manifest,candidateCommit:git('rev-parse','HEAD')}};
  assert(validateRepairAtRepo(fixture,fixtureState,target,bad).some(x=>x.includes('path boundary')));
  const falseCandidate={...canonical,manifest:{...canonical.manifest,candidateCommit:fixed.targetBaselineCommit}};
  assert(validateRepairAtRepo(fixture,fixtureState,target,falseCandidate).some(x=>x.includes('descend')));
} finally {
  if(savedHeadRef===undefined)delete process.env.GITHUB_HEAD_REF;else process.env.GITHUB_HEAD_REF=savedHeadRef;
  fs.rmSync(fixture,{recursive:true,force:true});
}
console.log('REV17 PASS: four complete large blobs; bad hashes, unreadable/oversized objects; valid current/canonical contexts; targeted authority, protected-file, missing/drifted main, wrong branch, premature REV16, ancestry/path rejection');
