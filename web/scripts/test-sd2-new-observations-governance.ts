import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import {stateErrors,NEW_BASE} from './sd2-new-observations-governance';
const before=JSON.parse(execFileSync('git',['show',`${NEW_BASE}:docs/BUILD_STATE.json`]).toString());
const after=JSON.parse(fs.readFileSync('../docs/BUILD_STATE.json','utf8'));
assert.deepEqual(stateErrors(before,after),[]);
for(const [key,value]of Object.entries({historicalHoldsRetained:0,historicalQuarantinesRetained:0,historicalExecution:'PASS',historicalTargetsCleared:1,maxExplicitToolInvocations:101,maxConcurrent:2,retryAllowed:true,acceptedFacts:1,SD3Started:true,status:'active',controlsReviewPath:'fake.json',scopeSha256:'0'.repeat(64),adapterTool:'other',workbookAccessAuthorized:true})){
 const mutant=structuredClone(after);mutant.sd2NewResearchCampaign[key]=value;assert(stateErrors(before,mutant).length,key);
}
for(const key of ['activeStageId','nextPermittedStageId','m1Setup','sd2ResearchClosure','deployment']){const mutant=structuredClone(after);mutant[key]=null; if(JSON.stringify(before[key])!=='null')assert(stateErrors(before,mutant).length,key);}
console.log('PASS SD2 campaign policy mutation gates');
