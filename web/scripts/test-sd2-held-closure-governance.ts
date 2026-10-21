import assert from 'node:assert/strict';
import fs from 'node:fs';
import { SD2_GATE_DISPOSITIONS, deriveHeldClosure, validateHeldState, SD2_DENOMINATOR, type HeldState } from './sd2-held-closure-governance';
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
