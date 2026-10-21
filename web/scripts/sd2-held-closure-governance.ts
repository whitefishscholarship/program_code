import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { isDeepStrictEqual } from 'node:util';

export const SD2_ENTRY = 'be0cb628a44a0c02b8e84e393f6892a233c865c8';
export const SD2_BASELINE = '1c8e33f23beb55c2ed2ebe78fe4e256722af8392';
export const SD2_ALLOWLIST = [
  'AGENTS.md', 'docs/SCHOLARSHIP_SYSTEM_BUILD_PLAN.md', 'docs/BUILD_STATE.json',
  'docs/DECISIONS.md', 'docs/CURRENT_HANDOFF.md', 'docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md',
  'docs/evidence/PLAN-REV22.md', 'docs/evidence/PLAN-REV22-manifest.json',
  'docs/reviews/PLAN-REV22.json', 'docs/kickoffs/PLAN-REV22-SD2-HELD-CLOSURE.md',
  'web/scripts/sd2-held-closure-governance.ts', 'web/scripts/test-sd2-held-closure-governance.ts',
  'web/scripts/validate-build-plan.ts', 'web/package.json',
];
export const SD2_DENOMINATOR = {
  savedPositions: 794, namedInputs: 411, emptyPositions: 383,
  originalFieldDefinitions: 7547, heldFields: 7518, proposedFields: 29,
  separateAppAwardIds: 411, separateSourceLocators: 397, quarantines: 272,
};
export const SD2_TEST_SUFFIX = ' && node --import tsx scripts/test-sd2-held-closure-governance.ts';
export const SD2_REFS = [
  'docs/evidence/sd2-consolidation-package/summary.json',
  'docs/evidence/sd2-consolidation-package/decision-ledger.json',
  'docs/evidence/sd2-consolidation-package/field-decisions.jsonl',
  'docs/evidence/sd2-access-session-closeout/open-items.json',
  'docs/evidence/sd2-access-session-closeout/review.json',
  'docs/evidence/sd2-held-closure-contract-1/CONTRACT.md',
  'docs/evidence/sd2-held-closure-contract-1/amendment-spec.json',
];
export type HeldState = {
  planRevision: number; activeStageId: unknown; nextPermittedStageId: unknown;
  stages: unknown; governance: { planAmendments: Array<{id: string; deliveryAuthorization?: {authorized?: boolean; evidencePath?: string | null}}> };
  sd2ResearchClosure?: {
    contractId: string; status: string; researchDeliverableComplete: boolean; fullSD2Complete: boolean;
    acceptedFacts: number; acceptedMappings: number; SD3Started: boolean;
    originalSourceExecution: string; targetsHeld: number; quarantinesHeld: number;
    clearedForAcquisition: number; exactNeverDispatchedProof: string; denominator: unknown;
    entryCommit: string; baselineCommit: string; policyCommit: string;
    evidenceReferences: Array<{path: string; sha256: string}>;
    closureAttestation: null | { manifestPath: string; reviewPath: string; proofPath: string }; attentionPath: string; nextOwner: string; nextTrigger: string;
  };
};
export function validateHeldState(s: HeldState): string[] {
  const errors: string[] = [];
  const fail = (message: string) => errors.push('SD2 held closure: ' + message);
  const c = s.sd2ResearchClosure;
  if (!c) return ['SD2 held closure: missing maintenance record'];
  if (c.contractId !== 'sd2-held-research-v1' || c.entryCommit !== SD2_ENTRY || c.baselineCommit !== SD2_BASELINE || !/^[0-9a-f]{40}$/.test(c.policyCommit)) fail('invalid contract or entry binding');
  if (!isDeepStrictEqual(c.denominator, SD2_DENOMINATOR)) fail('exact denominator required');
  if (c.acceptedFacts !== 0 || c.acceptedMappings !== 0 || c.SD3Started !== false || c.originalSourceExecution !== 'FAIL' || c.targetsHeld !== 397 || c.quarantinesHeld !== 272 || c.clearedForAcquisition !== 0 || c.exactNeverDispatchedProof !== 'NOT_ESTABLISHED') fail('original zero-acceptance/source/hold invariants changed');
  if (c.status !== 'blocked-external' || c.researchDeliverableComplete !== false || c.fullSD2Complete !== false) fail('Revision22 initializes blocked accounting only; separate canonical closure proof required');
  if (c.closureAttestation !== null && (!isDeepStrictEqual(Object.keys(c.closureAttestation).sort(), ['manifestPath','proofPath','reviewPath']) || c.closureAttestation.manifestPath !== 'docs/evidence/sd2-held-research-closure/manifest.json' || c.closureAttestation.reviewPath !== 'docs/evidence/sd2-held-research-closure/review.json' || c.closureAttestation.proofPath !== 'docs/evidence/sd2-held-research-closure/manifest.json#/heldResearchProof')) fail('exact future closure proof routes required');
  if (s.activeStageId !== null || s.nextPermittedStageId !== null) fail('stage pointers must remain null');
  if (c.attentionPath !== 'docs/evidence/sd2-access-session-closeout/open-items.json' || !c.nextOwner?.trim() || !c.nextTrigger?.trim()) fail('original attention routing required');
  const refs = c.evidenceReferences;
  if (!Array.isArray(refs) || !isDeepStrictEqual(refs.map(x => x.path).sort(), [...SD2_REFS].sort()) || refs.some(x => !/^[0-9a-f]{64}$/.test(x.sha256))) fail('exact complete evidence references required');
  const amendments = s.governance.planAmendments.filter(a => a.id === 'PLAN-REV22');
  if (amendments.length !== 1 || amendments[0]?.deliveryAuthorization?.authorized !== true || amendments[0]?.deliveryAuthorization?.evidencePath !== 'docs/evidence/PLAN-REV22.md') fail('direct Revision22 delivery authority required');
  return errors;
}

// Always validate the immutable Revision22 candidate after attestation. Later
// runtime evolution is evaluated by its own stage contract, never frozen here.
export function validateHeldAtRepo(root: string, current: HeldState, candidate?: string): string[] {
  const git = (...args: string[]) => execFileSync('git', args, {cwd: root, maxBuffer: 128 * 1024 * 1024});
  const read = (p: string) => candidate ? git('show', `${candidate}:${p}`) : fs.readFileSync(path.join(root, p));
  const errors: string[] = [];
  try {
    const s: HeldState = candidate ? JSON.parse(read('docs/BUILD_STATE.json').toString()) : current;
    errors.push(...validateHeldState(s));
    const before: HeldState = JSON.parse(git('show', `${SD2_ENTRY}:docs/BUILD_STATE.json`).toString());
    const old = JSON.parse(JSON.stringify(before));
    const after = JSON.parse(JSON.stringify(s));
    delete after.sd2ResearchClosure;
    after.planRevision = old.planRevision; after.lastUpdated = old.lastUpdated;
    after.governance.planAmendments = after.governance.planAmendments.filter((a: {id:string}) => a.id !== 'PLAN-REV22');
    if (!isDeepStrictEqual(old, after)) errors.push('SD2 held closure: unrelated historical state/grant changed');
    for (const ref of s.sd2ResearchClosure?.evidenceReferences ?? []) {
      const raw = read(ref.path);
      if (createHash('sha256').update(raw).digest('hex') !== ref.sha256 || !raw.equals(git('show', `${SD2_ENTRY}:${ref.path}`))) errors.push(`SD2 held closure: evidence changed ${ref.path}`);
    }
    const oldPackage = JSON.parse(git('show', `${SD2_ENTRY}:web/package.json`).toString());
    const newPackage = JSON.parse(read('web/package.json').toString());
    if (newPackage.scripts.test !== oldPackage.scripts.test + SD2_TEST_SUFFIX) errors.push('SD2 held closure: append focused test exactly once');
    newPackage.scripts.test = oldPackage.scripts.test;
    if (!isDeepStrictEqual(newPackage, oldPackage)) errors.push('SD2 held closure: unrelated package/dependency change');
    const tracked = git('ls-tree', '-r', '-z', SD2_ENTRY).toString().split('\0').filter(Boolean);
    const candidateEntries = candidate ? new Map(git('ls-tree', '-r', '-z', candidate).toString().split('\0').filter(Boolean).map(row => { const [meta,p] = row.split('\t'); return [p,meta]; })) : null;
    for (const row of tracked) {
      const [meta, p] = row.split('\t');
      if (SD2_ALLOWLIST.includes(p)) continue;
      if (candidateEntries) {
        if (candidateEntries.get(p) !== meta) errors.push(`SD2 held closure: protected entry blob/mode changed ${p}`);
      } else {
        const file = path.join(root,p);
        const stat = fs.lstatSync(file);
        const mode = stat.isSymbolicLink() ? '120000' : (stat.mode & 0o111 ? '100755' : '100644');
        const raw = stat.isSymbolicLink() ? Buffer.from(fs.readlinkSync(file)) : fs.readFileSync(file);
        const oid = createHash('sha1').update(Buffer.concat([Buffer.from(`blob ${raw.length}\0`),raw])).digest('hex');
        if (`${mode} blob ${oid}` !== meta) errors.push(`SD2 held closure: protected entry blob/mode changed ${p}`);
      }
    }
    for (const p of ['AGENTS.md','docs/DECISIONS.md','docs/SCHOLARSHIP_SYSTEM_BUILD_PLAN.md']) {
      let oldText=git('show',`${SD2_ENTRY}:${p}`).toString();
      if (p.endsWith('SCHOLARSHIP_SYSTEM_BUILD_PLAN.md')) oldText=oldText.replace('Plan revision: 21','Plan revision: 22');
      if (!read(p).toString().startsWith(oldText)) errors.push(`SD2 held closure: original policy history changed ${p}`);
    }
    if (git('merge-base','--is-ancestor',s.sd2ResearchClosure!.policyCommit,candidate ?? 'HEAD').length) errors.push('SD2 held closure: invalid policy ancestry');
    const changed = candidate ? git('diff', '--name-only', SD2_ENTRY, candidate).toString().trim().split('\n') : [
      ...git('diff', '--name-only', SD2_ENTRY).toString().trim().split('\n'),
      ...git('ls-files', '--others', '--exclude-standard').toString().trim().split('\n')];
    for (const p of changed.filter(Boolean)) if (!SD2_ALLOWLIST.includes(p)) errors.push(`SD2 held closure: outside allowlist ${p}`);
    for (const p of ['docs/CURRENT_HANDOFF.md', 'docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md']) {
      const oldText = git('show', `${SD2_ENTRY}:${p}`).toString();
      let text = read(p).toString();
      if (p.endsWith('CURRENT_HANDOFF.md')) {
        if (!text.endsWith(oldText)) errors.push('SD2 held closure: handoff history changed');
      } else {
        text = text.replace(/\n<!-- REV22-START -->\n[\s\S]*?<!-- REV22-END -->\n/, '');
        if (text !== oldText) errors.push('SD2 held closure: student-plan history changed');
      }
    }
    // This amendment does not license a later mutable completion marker.
    // A separately governed closure must add its own canonical proof validation.
    if (!current.sd2ResearchClosure) errors.push('SD2 held closure: maintenance record cannot be removed');
    if (current.sd2ResearchClosure) {
      const initial = {...s.sd2ResearchClosure, closureAttestation: null};
      const live = {...current.sd2ResearchClosure, closureAttestation: null};
      if (!isDeepStrictEqual(initial, live)) errors.push('SD2 held closure: immutable accounting invariants changed');
    }
  } catch (e) { errors.push(`SD2 held closure: missing/malformed proof: ${(e as Error).message}`); }
  return errors;
}


export type ClosureProof = {
  schemaVersion: number; selectedAt: string; freezeAt: string;
  selectedEntryCommit: string; baselineCommit: string; candidateCommit: string;
  runtimeDigest: string;
  authority: {authorized: boolean; evidenceSha256: string; scope: string};
  observations: Array<{at:string; mainCommit:string; projectId:string; teamId:string; hostname:string; authenticated:boolean}>;
  checks: Array<{command:string; exitCode:number; runtimeDigest:string; logPath:string; logSha256:string; logBytes:number; startedAt:string; completedAt:string}>;
  originalGates: Array<{id:string; bindingSha256:string; disposition:string}>;
};
export type ClosureContext = {
  revision22Delivered: boolean; canonicalAttestation: boolean; closureDelivered: boolean;
  candidateCommit:string; baselineCommit:string; candidateManifestSha256:string; reviewSha256:string;
  runtimeDigest:string; originalGatesSha256:string;
};
const HASH=/^[0-9a-f]{64}$/;
const COMMIT=/^[0-9a-f]{40}$/;
export const SD2_GATE_DISPOSITIONS=['satisfied','preserved-held-not-accepted','preserved-held-not-accepted','preserved-held-not-accepted','satisfied','satisfied','preserved-held-not-accepted','satisfied','preserved-held-not-accepted','preserved-held-not-accepted','separately-unstarted','separately-unstarted','separately-unstarted','satisfied'];
const COMMANDS=['npm run plan:check','npm run typecheck','npm test','npm run build','git diff --check'];
// Completion is an effective state, never a self-asserted mutable marker. A later
// closure candidate carries proof while its stored initial booleans stay false;
// only verified delivery yields accepted-held-research/research completion.
export function deriveHeldClosure(proof: ClosureProof, context: ClosureContext) {
  const errors:string[]=[];
  if (!context.revision22Delivered || !context.canonicalAttestation) errors.push('delivered policy and exact independent closure attestation required');
  if (proof.schemaVersion!==1 || !COMMIT.test(proof.selectedEntryCommit) || !COMMIT.test(proof.candidateCommit) || proof.candidateCommit!==context.candidateCommit || proof.baselineCommit!==context.baselineCommit || !HASH.test(context.candidateManifestSha256) || !HASH.test(context.reviewSha256) || proof.runtimeDigest!==context.runtimeDigest || !HASH.test(proof.runtimeDigest)) errors.push('candidate/manifest/review/runtime binding invalid');
  const start=Date.parse(proof.selectedAt), freeze=Date.parse(proof.freezeAt);
  if (!Number.isFinite(start) || !Number.isFinite(freeze) || freeze<start) errors.push('invalid entry/freeze chronology');
  if (proof.authority?.authorized!==true || proof.authority.scope!=='SD2-HELD-RESEARCH' || !HASH.test(proof.authority.evidenceSha256)) errors.push('exact closure authority missing');
  if (!Array.isArray(proof.observations) || proof.observations.length!==2 || proof.observations.some(o=>!o.authenticated || o.mainCommit!==proof.baselineCommit || o.projectId!=='prj_LbefE2deji6nPND6iBiuofe7IABv' || o.teamId!=='team_6CAjRq58n0WvAH49otKSQbA7' || o.hostname!=='web-two-gules-45.vercel.app' || !(Date.parse(o.at)>=start && Date.parse(o.at)<=freeze)) || Date.parse(proof.observations[1]?.at)<=Date.parse(proof.observations[0]?.at)) errors.push('fresh authenticated entry and pre-freeze main/target required');
  if (Array.isArray(proof.checks) && Array.isArray(proof.observations) && Date.parse(proof.observations[1]?.at)<Math.max(...proof.checks.map(c=>Date.parse(c.completedAt)))) errors.push('pre-freeze target recheck must follow validation');
  if (!Array.isArray(proof.checks) || !isDeepStrictEqual(proof.checks.map(c=>c.command),COMMANDS) || proof.checks.some(c=>c.exitCode!==0 || c.runtimeDigest!==context.runtimeDigest || !HASH.test(c.logSha256) || c.logBytes<0 || (c.command==='npm run build' && c.logBytes===0) || !(Date.parse(c.startedAt)>=start && Date.parse(c.completedAt)>=Date.parse(c.startedAt) && Date.parse(c.completedAt)<=freeze))) errors.push('exact complete supported validation required');
  if (!Array.isArray(proof.originalGates) || !isDeepStrictEqual(proof.originalGates.map(g=>g.id),Array.from({length:14},(_,i)=>`G${i+1}`)) || proof.originalGates.some(g=>g.bindingSha256!==context.originalGatesSha256 || !HASH.test(g.bindingSha256) || g.disposition!==SD2_GATE_DISPOSITIONS[Number(g.id.slice(1))-1])) errors.push('all original gates must remain bound and dispositioned');
  const complete=errors.length===0 && context.closureDelivered;
  return {errors,status:complete?'accepted-held-research':'blocked-external',researchDeliverableComplete:complete,fullSD2Complete:complete,acceptedFacts:0,acceptedMappings:0,SD3Started:false};
}


export function validateClosureProofAtRepo(root:string, proof:ClosureProof, context:ClosureContext):string[] {
  const errors=deriveHeldClosure(proof,context).errors;
  try {
    const git=(...args:string[])=>execFileSync('git',args,{cwd:root,maxBuffer:128*1024*1024});
    git('merge-base','--is-ancestor',proof.selectedEntryCommit,proof.candidateCommit);
    git('merge-base','--is-ancestor',proof.baselineCommit,proof.selectedEntryCommit);
    const frozen=Date.parse(git('show','-s','--format=%cI',proof.candidateCommit).toString().trim());
    if (!(Date.parse(proof.freezeAt)<=frozen && frozen-Date.parse(proof.freezeAt)<=300000)) errors.push('proof freeze does not match candidate time');
    const state:HeldState=JSON.parse(git('show',`${proof.candidateCommit}:docs/BUILD_STATE.json`).toString());
    errors.push(...validateHeldState(state));
    for (const ref of state.sd2ResearchClosure?.evidenceReferences ?? []) {
      const raw=git('show',`${proof.candidateCommit}:${ref.path}`);
      if (createHash('sha256').update(raw).digest('hex')!==ref.sha256 || !raw.equals(git('show',`${SD2_ENTRY}:${ref.path}`))) errors.push('closure changed original evidence');
    }
    if (!gatesEqual()) errors.push('closure changed original gates');
    function gatesEqual() {return git('show',`${proof.candidateCommit}:docs/evidence/sd2-consolidation-package/acceptance-gates.json`).equals(git('show',`${SD2_ENTRY}:docs/evidence/sd2-consolidation-package/acceptance-gates.json`));}
    const originalEntries=git('ls-tree','-r','-z',SD2_ENTRY,'--','docs/evidence','docs/reviews').toString().split('\0').filter(Boolean);
    const closureEntries=new Map(git('ls-tree','-r','-z',proof.candidateCommit,'--','docs/evidence','docs/reviews').toString().split('\0').filter(Boolean).map(row=>{const [meta,p]=row.split('\t');return[p,meta];}));
    for (const row of originalEntries) {const [meta,p]=row.split('\t');if(closureEntries.get(p)!==meta) errors.push(`closure changed protected history ${p}`);}

    const tree=git('ls-tree','-r',proof.candidateCommit,'--','web');
    if (createHash('sha256').update(tree).digest('hex')!==context.runtimeDigest) errors.push('runtime/dependency tree mismatch');
    const gates=git('show',`${proof.candidateCommit}:docs/evidence/sd2-consolidation-package/acceptance-gates.json`);
    if (createHash('sha256').update(gates).digest('hex')!==context.originalGatesSha256) errors.push('original gate hash mismatch');
    for(const check of proof.checks) {
      if(!check.logPath.startsWith('docs/evidence/sd2-held-research-closure/') || check.logPath.includes('..')) { errors.push('invalid check log path');continue; }
      const log=git('show',`${proof.candidateCommit}:${check.logPath}`);
      if(log.length!==check.logBytes || createHash('sha256').update(log).digest('hex')!==check.logSha256) errors.push('check log binding mismatch');
    }
    const authority=git('show',`${proof.candidateCommit}:docs/evidence/sd2-held-research-closure/authority.md`);
    if(createHash('sha256').update(authority).digest('hex')!==proof.authority.evidenceSha256) errors.push('closure authority binding mismatch');
  } catch(e) {errors.push(`closure Git/evidence binding failed: ${(e as Error).message}`);}
  return errors;
}
