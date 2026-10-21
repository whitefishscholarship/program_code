import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {isDeepStrictEqual as equal} from 'node:util';
export const NEW_BASE='304b80c4c3e5a31a606ce547b6b3de97ab47b8df';
export const RECEIPT='62cc97b';
export const PACKET='docs/evidence/sd2-new-research-handoff/';
export const NEW_DIR='docs/evidence/sd2-new-observations-1/';
export const SCOPE_SHA='d370162ae44777cd9737a83af4f76308ff0fbe737fc9e5e97b3dd416f901ac12';
export const NEW_TEST=' && node --import tsx scripts/test-sd2-new-observations-governance.ts';
export const NEW_ALLOW=[ 'AGENTS.md','docs/SCHOLARSHIP_SYSTEM_BUILD_PLAN.md','docs/BUILD_STATE.json','docs/DECISIONS.md','docs/CURRENT_HANDOFF.md','docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md','docs/kickoffs/PLAN-REV24-SD2-NEW-OBSERVATIONS.md','docs/evidence/PLAN-REV24.md','docs/evidence/PLAN-REV24-manifest.json','docs/reviews/PLAN-REV24.json','web/scripts/validate-build-plan.ts','web/scripts/sd2-new-observations-governance.ts','web/scripts/test-sd2-new-observations-governance.ts','web/package.json'];
const sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
export function stateErrors(before:Record<string,unknown>,after:Record<string,unknown>):string[]{
 const c=after.sd2NewResearchCampaign as Record<string,unknown>;
 if(!c) return ['missing campaign'];
 const errors:string[]=[];
 const expected=JSON.parse(JSON.stringify(before));const actual=JSON.parse(JSON.stringify(after));
 delete actual.sd2NewResearchCampaign; actual.planRevision=expected.planRevision;actual.lastUpdated=expected.lastUpdated;
 actual.governance.planAmendments=actual.governance.planAmendments.filter((x:{id:string})=>x.id!=='PLAN-REV24');
 if(!equal(expected,actual))errors.push('historical state/approvals/pointers changed');
 const pins={contractId:'sd2-new-observations-v1',campaignId:'SD2-NEW-OBSERVATIONS-1',status:'blocked-pending-live-control-review',historicalHoldsRetained:397,historicalQuarantinesRetained:272,historicalTargetsCleared:0,historicalExecution:'FAIL',historicalNeverDispatchedProof:'NOT_ESTABLISHED',newObservationsStarted:false,acceptedFacts:0,acceptedMappings:0,SD3Started:false,sourceCount:100,maxExplicitToolInvocations:100,maxPerTarget:1,maxConcurrent:1,retryAllowed:false,workbookAccessAuthorized:false,nativeReadsAuthorized:false,monitoringAuthorized:false,factAcceptanceAuthorized:false,deliveryAuthorized:true,sourceExecutionAuthorizedAfterGates:true,controlsReviewPath:null,authorityPath:'docs/evidence/PLAN-REV24.md',scopePath:PACKET+'scope.json',scopeSha256:SCOPE_SHA,adapterTool:'sd2.public-program-https-v1',baselineCommit:NEW_BASE};
 for(const [k,v]of Object.entries(pins))if(!equal(c[k],v))errors.push('campaign pin '+k);
 if(after.planRevision!==24)errors.push('exact revision24 required for this candidate');
 return errors;
}
export function validateNewAtRepo(root:string,current:Record<string,unknown>,candidate?:string):string[]{
 const git=(...args:string[])=>execFileSync('git',args,{cwd:root,maxBuffer:128*1024*1024});
 const read=(p:string)=>candidate?git('show',`${candidate}:${p}`):fs.readFileSync(path.join(root,p));
 const errors:string[]=[];
 try{
 const before=JSON.parse(git('show',`${NEW_BASE}:docs/BUILD_STATE.json`).toString());
 const s=candidate?JSON.parse(read('docs/BUILD_STATE.json').toString()):current;
 errors.push(...stateErrors(before,s));
 // Historical candidate policy remains exact; no mutable live activation flag.
 if(!equal(current.sd2NewResearchCampaign,s.sd2NewResearchCampaign))errors.push('campaign cannot be rebound or activated by mutable state');
 const scope=read(PACKET+'scope.json');if(sha(scope)!==SCOPE_SHA)errors.push('exact ordered scope digest');
 const packets=git('ls-tree','-r','--name-only',RECEIPT,'--',PACKET).toString().trim().split('\n');
 for(const p of packets)if(!read(p).equals(git('show',`${RECEIPT}:${p}`)))errors.push('imported receipt changed '+p);
 const changes=candidate?git('diff','--name-only',NEW_BASE,candidate).toString().split('\n'):[...git('diff','--name-only',NEW_BASE).toString().split('\n'),...git('ls-files','--others','--exclude-standard').toString().split('\n')];
 for(const p of changes.filter(Boolean))if(!NEW_ALLOW.includes(p)&&!packets.includes(p)&&!p.startsWith(NEW_DIR))errors.push('outside enabling scope '+p);
 // Any baseline path outside explicit allowance is immutable, including old controls/results.
 for(const p of git('ls-tree','-r','--name-only',NEW_BASE).toString().trim().split('\n'))if(!NEW_ALLOW.includes(p)&&!read(p).equals(git('show',`${NEW_BASE}:${p}`)))errors.push('protected baseline changed '+p);
 const oldPkg=JSON.parse(git('show',`${NEW_BASE}:web/package.json`).toString());const pkg=JSON.parse(read('web/package.json').toString());
 if(pkg.scripts.test!==oldPkg.scripts.test+NEW_TEST)errors.push('focused test must append exactly once');pkg.scripts.test=oldPkg.scripts.test;if(!equal(pkg,oldPkg))errors.push('unrelated package change');
 for(const p of ['AGENTS.md','docs/DECISIONS.md','docs/SCHOLARSHIP_SYSTEM_BUILD_PLAN.md']){let old=git('show',`${NEW_BASE}:${p}`).toString();if(p.endsWith('BUILD_PLAN.md'))old=old.replace('Plan revision: 23','Plan revision: 24');if(!read(p).toString().startsWith(old))errors.push('historical policy changed '+p);}
 if(!read('docs/CURRENT_HANDOFF.md').toString().endsWith(git('show',`${NEW_BASE}:docs/CURRENT_HANDOFF.md`).toString()))errors.push('handoff history changed');
 }catch(e){errors.push('missing/malformed new observation proof '+(e as Error).message);}
 return errors.map(x=>'SD2 new observations: '+x);
}
