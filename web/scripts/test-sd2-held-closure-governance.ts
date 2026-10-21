import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import { validateClosureScopeAtRepo, closureScopeErrors, validateHeldAtRepo, SD2_GATE_DISPOSITIONS, deriveHeldClosure, validateHeldState, SD2_DENOMINATOR, type HeldState } from './sd2-held-closure-governance';
const state: HeldState = JSON.parse(fs.readFileSync('../docs/BUILD_STATE.json','utf8'));
assert.deepEqual(validateHeldState(state), []);
let cases=0;
function rejects(change:(s:HeldState)=>void) {const s=structuredClone(state);change(s);assert.ok(validateHeldState(s).length>0);cases++;}
rejects(s=>{delete s.sd2ResearchClosure;});
for(const key of Object.keys(SD2_DENOMINATOR)) rejects(s=>{(s.sd2ResearchClosure!.denominator as Record<string,number>)[key]++;});
for(const [key,value] of Object.entries({acceptedFacts:1,acceptedMappings:1,clearedForAcquisition:1,SD3Started:true,originalSourceExecution:'PASS',targetsHeld:396,quarantinesHeld:271,exactNeverDispatchedProof:'ESTABLISHED',status:'accepted-held-research',researchDeliverableComplete:true,fullSD2Complete:true,closureAttestation:{buildPassed:true},entryCommit:'0'.repeat(40),attentionPath:'elsewhere'})) rejects(s=>{(s.sd2ResearchClosure as unknown as Record<string,unknown>)[key]=value;});
rejects(s=>{s.activeStageId='SD3';});rejects(s=>{s.nextPermittedStageId='SD3';});
rejects(s=>{s.sd2ResearchClosure!.evidenceReferences.pop();});
rejects(s=>{s.sd2ResearchClosure!.evidenceReferences.push(s.sd2ResearchClosure!.evidenceReferences[0]);});
rejects(s=>{s.sd2ResearchClosure!.evidenceReferences[0].sha256='invalid';});
rejects(s=>{s.governance.planAmendments.find(a=>a.id==='PLAN-REV22')!.deliveryAuthorization!.authorized=false;});
rejects(s=>{s.governance.planAmendments.push(s.governance.planAmendments.find(a=>a.id==='PLAN-REV22')!);});
console.log(`SD2 held closure: valid blocked state and ${cases} adversarial mutations passed`);

// Synthetic proof exercises the future transition only; no live gate clearance.
const digest='a'.repeat(64),commit='b'.repeat(40);
const context={revision22Delivered:true,canonicalAttestation:true,closureDelivered:true,candidateCommit:commit,baselineCommit:commit,candidateManifestSha256:digest,reviewSha256:digest,runtimeDigest:digest,originalGatesSha256:digest};
const observation={at:'2026-10-20T01:00:01Z',mainCommit:commit,projectId:'prj_LbefE2deji6nPND6iBiuofe7IABv',teamId:'team_6CAjRq58n0WvAH49otKSQbA7',hostname:'web-two-gules-45.vercel.app',authenticated:true};
const proof={schemaVersion:1,selectedAt:'2026-10-20T01:00:00Z',freezeAt:'2026-10-20T01:10:00Z',selectedEntryCommit:commit,baselineCommit:commit,candidateCommit:commit,runtimeDigest:digest,authority:{authorized:true,evidenceSha256:digest,scope:'SD2-HELD-RESEARCH'},observations:[observation,{...observation,at:'2026-10-20T01:09:00Z'}],checks:['npm run plan:check','npm run typecheck','npm test','npm run build','git diff --check'].map(command=>({command,exitCode:0,runtimeDigest:digest,logPath:'docs/evidence/sd2-held-research-closure/check.log',logSha256:digest,logBytes:1,startedAt:'2026-10-20T01:01:00Z',completedAt:'2026-10-20T01:08:00Z'})),originalGates:Array.from({length:14},(_,i)=>({id:`G${i+1}`,bindingSha256:digest,disposition:SD2_GATE_DISPOSITIONS[i]}))};
assert.equal(deriveHeldClosure(proof,context).status,'accepted-held-research');
assert.equal(deriveHeldClosure(proof,{...context,closureDelivered:false}).fullSD2Complete,false);
for(const key of ['revision22Delivered','canonicalAttestation'] as const) assert.ok(deriveHeldClosure(proof,{...context,[key]:false}).errors.length);
for(const change of [
(p:typeof proof)=>{p.candidateCommit='c'.repeat(40);},
(p:typeof proof)=>{p.runtimeDigest='c'.repeat(64);},
(p:typeof proof)=>{p.observations[0].at='2026-10-19T01:00:00Z';},
(p:typeof proof)=>{p.observations[1].hostname='wrong.example';},
(p:typeof proof)=>{p.observations[1].mainCommit='c'.repeat(40);},
(p:typeof proof)=>{p.observations[0].authenticated=false;},
(p:typeof proof)=>{p.authority.authorized=false;},
(p:typeof proof)=>{p.authority.scope='SD3';},
(p:typeof proof)=>{p.checks.pop();},
(p:typeof proof)=>{p.checks[3].command='npm run build -- --webpack';},
(p:typeof proof)=>{p.checks[3].exitCode=1;},
(p:typeof proof)=>{p.checks[3].runtimeDigest='c'.repeat(64);},
(p:typeof proof)=>{p.checks[3].logSha256='invalid';},
(p:typeof proof)=>{p.originalGates.pop();},
(p:typeof proof)=>{p.originalGates[0].bindingSha256='c'.repeat(64);},
]) {const p=structuredClone(proof);change(p);assert.ok(deriveHeldClosure(p,context).errors.length);}
console.log('Future SD2 closure: synthetic valid proof and delivery/missing/stale/mismatch/substitute-build negatives passed; no real closure accepted');

// Exercise the actual immutable-candidate adapter rather than only the pure gate.
const head=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const malformed=structuredClone(state);
malformed.sd2ResearchClosure!.closureAttestation={manifestPath:'docs/evidence/elsewhere/manifest.json',reviewPath:'docs/reviews/elsewhere.json',proofPath:'ignored'};
assert.ok(validateHeldAtRepo('..',malformed,head).some(e=>e.includes('exact future closure proof routes')));
for(const p of ['web/src/app/page.tsx','web/package-lock.json','web/package.json','.github/workflows/ci.yml','vercel.json','web/src/lib/studentCatalog.ts']) {
  assert.ok(closureScopeErrors([{path:p,before:'100644 blob old',after:'100644 blob new'}]).length);
  assert.ok(closureScopeErrors([{path:p,before:null,after:'100644 blob new'}]).length);
  assert.ok(closureScopeErrors([{path:p,before:'100644 blob old',after:'100755 blob old'}]).length);
  assert.deepEqual(closureScopeErrors([{path:p,before:'100644 blob same',after:'100644 blob same'}]),[]);
}
console.log('Repo adapter rejects unchecked live proof routes; future closure scope rejects runtime/dependency/config/CI edits, additions and mode changes while permitting unchanged evolved baseline');

const fixture=fs.mkdtempSync(path.join(os.tmpdir(),'sd2-closure-scope-'));
try {
  const git=(...args:string[])=>execFileSync('git',args,{cwd:fixture,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
  git('init');
  const files=['web/src/app/page.tsx','web/package-lock.json','web/package.json','.github/workflows/ci.yml','vercel.json'];
  for(const p of files) {fs.mkdirSync(path.dirname(path.join(fixture,p)),{recursive:true});fs.writeFileSync(path.join(fixture,p),'baseline\n');}
  git('add','.');git('-c','user.name=Synthetic test','-c','user.email=synthetic@example.invalid','commit','-m','baseline');
  const base=git('rev-parse','HEAD');
  assert.deepEqual(validateClosureScopeAtRepo(fixture,base,base),[]);
  for(const p of files.slice(0,4)) fs.writeFileSync(path.join(fixture,p),'unauthorized candidate change\n');
  fs.chmodSync(path.join(fixture,'vercel.json'),0o755);
  git('add','.');git('-c','user.name=Synthetic test','-c','user.email=synthetic@example.invalid','commit','-m','bad closure');
  const bad=git('rev-parse','HEAD');
  const failures=validateClosureScopeAtRepo(fixture,base,bad);
  for(const p of files) assert.ok(failures.some(e=>e.endsWith(p)),p);
  assert.deepEqual(validateClosureScopeAtRepo(fixture,bad,bad),[],'independently evolved baseline does not freeze later runtime');
  fs.mkdirSync(path.join(fixture,'docs/evidence/sd2-held-research-closure'),{recursive:true});
  fs.writeFileSync(path.join(fixture,'docs/evidence/sd2-held-research-closure/build.log'),'synthetic log\n');
  git('add','.');git('-c','user.name=Synthetic test','-c','user.email=synthetic@example.invalid','commit','-m','proof only');
  assert.deepEqual(validateClosureScopeAtRepo(fixture,bad,git('rev-parse','HEAD')),[]);
} finally {fs.rmSync(fixture,{recursive:true,force:true});}
console.log('Actual Git fixture: runtime/package/lock/CI edits and config mode change rejected; proof-only scope and evolved baseline accepted');
