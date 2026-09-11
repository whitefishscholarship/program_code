import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { ACTIVITY_QUESTIONS, SPECIAL_CRITERIA } from '../src/lib/interviewQuestions';

export const INTAKE_WORKBOOK = '1Dp5AMnrfSQ-Xf-r03S75lKsGPJk7o0inOgvC9Q6lOl4';
export const sha256 = (x: string | Buffer) => crypto.createHash('sha256').update(x).digest('hex');
export type WriteGate = {
  workbookId: string; batchDigest: string; authorizedBatchDigest: string | null;
  exactWriteAuthority: boolean; completeNativeBackup: boolean; allTabsIncludingHidden: boolean;
  privateAccessVerified: boolean; materialFeaturesRecoverable: boolean; disposableRecoveryProof: boolean;
  affectedCellBackup: boolean; backupUnchanged: boolean; freshForThisBatch: boolean;
  snapshotFingerprint: string; liveFingerprint: string; quietWindowOrAtomicPrecondition: boolean;
  independentReviewComplete: boolean; unresolvedHighOrCritical: number;
  uncertainPriorWrite: boolean; alreadyApplied: boolean;
};
// Read-only decision function. This project contains no live spreadsheet writer.
export function canApplyIntake(g: WriteGate): boolean {
  return g.workbookId === INTAKE_WORKBOOK && /^[a-f0-9]{64}$/.test(g.batchDigest) &&
    g.batchDigest === g.authorizedBatchDigest && g.exactWriteAuthority &&
    g.completeNativeBackup && g.allTabsIncludingHidden && g.privateAccessVerified &&
    g.materialFeaturesRecoverable && g.disposableRecoveryProof && g.affectedCellBackup &&
    g.backupUnchanged && g.freshForThisBatch && /^[a-f0-9]{64}$/.test(g.snapshotFingerprint) &&
    g.snapshotFingerprint === g.liveFingerprint && g.quietWindowOrAtomicPrecondition &&
    g.independentReviewComplete && g.unresolvedHighOrCritical === 0 &&
    !g.uncertainPriorWrite && !g.alreadyApplied;
}
export type Row = { id: string; sheetId: number; tab: string; rowNumber: number; rowContentSha256: string;
  values: string[];
  sourcePath: string; entityId: string | null; disposition: string | null; rationale: string | null;
  destination: {kind: string; rowNumber?: number; entityId?: string; operationId?: string} | null;
  evidenceIds: string[]; review: {status: string; reviewer: string | null}; };
export type Entity = {id: string; name?: string; sourceRowIds: string[]; disposition: string | null; status: string;
  destination?: Row['destination'];
  fields: {column: string;oldValue: unknown;newValue: unknown;sourceId: string;decision: string;locator: string;observedAt: string;supportingSourceIds?: string[]}[];
  officialEvidenceIds: string[]; tags: {key: string;sourceId: string;existingChoiceId: string|null;existingControlId?: string;existingCriterionId?: string;label: string;meaning: string;effect: string;qualifiedExplanation: string}[];
  interviewCoverage: {dimension?: string;decision: string;choiceId?: string|null;rationale?: string}[];
  proposedValues?: string[]; review: {status:string;reviewer:string|null};};
export type Ledger = {schemaVersion:number;planId:string;inputs:{workbookId:string;snapshotId:string;snapshotSha256:string;
  snapshotFiles:{path:string;sha256:string}[];tabs:{sheetId:number;populatedRows:number}[]};
  rows:Row[];entities:Entity[];officialSources:{id:string;evidencePath:string;url:string;observedAt:string;contentSha256:string}[];
  discoveries:{enumeratedCount:number;reviewedByImplementer:number;remainingCount:number}[];};
const dispositions = new Set(['propose_add','propose_update','link_existing','duplicate_of','hold','out_of_scope','non_record']);
export function validateIntakeLedger(l: Ledger, root: string, complete = false) {
  assert.equal(l.schemaVersion,1); assert.equal(l.planId,'SCHOLARSHIP-INTAKE-1');
  assert.equal(l.inputs.workbookId,INTAKE_WORKBOOK);
  const ids = new Set(l.rows.map(r=>r.id)); assert.equal(ids.size,l.rows.length,'Duplicate row identities');
  const entities = new Map(l.entities.map(e=>[e.id,e]));assert.equal(entities.size,l.entities.length,'Duplicate entity IDs');
  const sources=new Map(l.officialSources.map(s=>[s.id,s])); assert.equal(sources.size,l.officialSources.length);
  for(const f of l.inputs.snapshotFiles) assert.equal(sha256(fs.readFileSync(path.join(root,f.path))),f.sha256,`Changed snapshot ${f.path}`);
  const snapshotRows = new Map<string,string>();
  const canonical = (value: unknown): unknown => Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value as Record<string,unknown>).sort(([a],[b])=>a<b?-1:a>b?1:0).map(([k,v])=>[k,canonical(v)])) : value;
  for(const f of l.inputs.snapshotFiles){
    const doc=JSON.parse(fs.readFileSync(path.join(root,f.path),'utf8')) as {response:{sheets:{properties:{sheetId:number};data:{startRow?:number;rowData?:{values?:Record<string,unknown>[]}[]}[]}[]}};
    for(const sheet of doc.response.sheets)for(const block of sheet.data)for(const [i,r] of (block.rowData??[]).entries()){
      const cells=r.values??[];
      if(cells.some(c=>c.userEnteredValue||c.effectiveValue||c.formattedValue))snapshotRows.set(`${sheet.properties.sheetId}:${(block.startRow??0)+i+1}`,sha256(JSON.stringify(canonical(cells))));
    }
  }
  assert.equal(snapshotRows.size,l.rows.length,'Selected populated source row lost');
  const membership = new Map<string,number>();
  for(const e of l.entities) for(const id of e.sourceRowIds) {assert(ids.has(id),'Unknown source row');membership.set(id,(membership.get(id)||0)+1);}
  for(const tab of l.inputs.tabs) assert.equal(l.rows.filter(r=>r.sheetId===tab.sheetId).length,tab.populatedRows,'Tab denominator mismatch');
  for(const r of l.rows) {
    assert.equal(snapshotRows.get(`${r.sheetId}:${r.rowNumber}`),r.rowContentSha256,'Source row hash mismatch');
    assert(r.id.startsWith(`${l.inputs.snapshotId}:sheet-${r.sheetId}:row-${r.rowNumber}:`));
    assert(r.id.endsWith(r.rowContentSha256.slice(0,12)));assert(/^[a-f0-9]{64}$/.test(r.rowContentSha256));
    assert(r.disposition===null||dispositions.has(r.disposition),'Invalid disposition');
    if(r.entityId){assert(entities.has(r.entityId));assert.equal(membership.get(r.id),1,'Row entity membership not exactly one');}
    if(r.disposition!==null)assert(r.rationale?.trim(),'Disposition without rationale');
    if(['duplicate_of','link_existing','propose_add','propose_update'].includes(r.disposition??'')) {
      assert(r.destination,'Missing surviving destination');assert(entities.has(r.destination.entityId!),'Unknown surviving entity');
      if(r.destination.kind==='existing_master') {
        const master=l.rows.find(x=>x.sheetId===0&&x.rowNumber===r.destination!.rowNumber);
        assert(master,'Missing Master destination');
        assert.equal(master.entityId,r.destination.entityId,'Master destination points to a different entity');
      }
      else {assert.equal(r.destination.kind,'proposed_operation');assert(r.destination.operationId);assert.equal(entities.get(r.destination.entityId!)?.disposition,'propose_add','Survivor is not a proposed add');}
    }
    for(const source of r.evidenceIds) assert(sources.has(source),'Unknown row evidence');
    if(complete){assert(r.disposition,'Pending row');assert.equal(r.review.status,'reviewed');assert(r.review.reviewer);}
  }
  for(const s of l.officialSources){assert(/^https?:\/\//.test(s.url));assert(!Number.isNaN(Date.parse(s.observedAt)));assert(/^[a-f0-9]{64}$/.test(s.contentSha256));assert(fs.existsSync(path.join(root,s.evidencePath)));}
  for(const e of l.entities){
    for(const s of e.officialEvidenceIds)assert(sources.has(s));
    if(e.disposition==='propose_add'||e.disposition==='propose_update'){
      assert(e.officialEvidenceIds.length,'Unsupported proposed entity');assert(e.fields.length,'No proposed fields');assert(e.interviewCoverage.length,'No interview coverage decision');
      if(e.disposition==='propose_add')assert.equal(e.proposedValues?.length,15,'Master A:O schema changed');
      for(const f of e.fields){assert(/^[A-O]$/.test(f.column),'Column outside Master schema');assert(sources.has(f.sourceId));assert(['proposed_supported','unknown_leave_blank'].includes(f.decision));if(f.decision==='unknown_leave_blank')assert(f.newValue===null||f.newValue==='','Unknown promoted to value');}
      for(const t of e.tags)assert(sources.has(t.sourceId));
    }
    if(complete){assert.notEqual(e.status,'pending-evaluation');assert.equal(e.review.status,'reviewed');assert(e.review.reviewer);}
  }
  for(const d of l.discoveries)assert.equal(d.enumeratedCount,d.reviewedByImplementer+d.remainingCount,'Lost discovered children');
  validateProposalRecords(l);
  return {rows:l.rows.length,entities:l.entities.length,decidedRows:l.rows.filter(r=>r.disposition!==null).length,pendingEntities:l.entities.filter(e=>e.status==='pending-evaluation').length,proposedAdds:l.entities.filter(e=>e.disposition==='propose_add').length};
}

// Checks the promotion semantics independently of source-file I/O. Native-cell and
// full-workbook recovery checks remain separate preconditions for any future write.
export function validateProposalRecords(l: Pick<Ledger,'rows'|'entities'|'officialSources'>) {
  const sources=new Map(l.officialSources.map(s=>[s.id,s]));
  const choices=new Map<string,{id:string;controlId:string;criterionId:string;label:string}>(
    [...ACTIVITY_QUESTIONS,...SPECIAL_CRITERIA].map(c=>[c.id,c]));
  const targets=new Set<string>();
  for(const e of l.entities) {
    if(!['propose_add','propose_update'].includes(e.disposition??''))continue;
    assert.equal(new Set(e.fields.map(f=>f.column)).size,e.fields.length,'Duplicate proposed column');
    const master=e.disposition==='propose_update' ? l.rows.find(r=>r.sheetId===0&&r.entityId===e.id) : undefined;
    if(e.disposition==='propose_update') {
      assert(master,'Update has no exact Master identity');
      assert.equal(e.destination?.rowNumber,master.rowNumber,'Update destination row mismatch');
      assert.equal(e.destination?.entityId,e.id,'Update destination entity mismatch');
    } else {
      assert.equal(e.fields.length,15,'Addition must decide every A:O field');
      assert.equal(e.proposedValues?.length,15,'Addition must supply A:O values');
      assert(e.proposedValues?.[6]?.trim(),'Nameless addition');
      assert(e.proposedValues?.[7]?.trim(),'Addition missing application route');
    }
    for(const f of e.fields) {
      const source=sources.get(f.sourceId);assert(source,'Unknown field source');
      assert(f.locator.trim(),'Field has no source locator');
      assert.equal(f.observedAt,source.observedAt,'Field timestamp differs from its source');
      for(const id of f.supportingSourceIds??[])assert(sources.has(id),'Unknown supporting source');
      if(master) {
        assert.equal(f.oldValue,master.values[f.column.charCodeAt(0)-65]??'','Stale old field value');
        const target=`${master.rowNumber}:${f.column}`;
        assert(!targets.has(target),'Two operations target the same cell');targets.add(target);
      } else {
        assert.equal(f.oldValue,null,'Addition overwrites an existing value');
        assert.equal(f.newValue,e.proposedValues?.[f.column.charCodeAt(0)-65],'Field and proposed row disagree');
      }
    }
    assert.equal(new Set(e.tags.map(t=>t.key)).size,e.tags.length,'Duplicate tag keys');
    for(const t of e.tags) {
      assert(t.label?.trim()&&t.meaning?.trim()&&t.qualifiedExplanation?.trim(),'Unqualified tag');
      assert(['requirement','preference','topic'].includes(t.effect),'Invalid tag effect');
      if(t.existingChoiceId) {
        const c=choices.get(t.existingChoiceId);assert(c,'Unknown interview choice');
        if(t.existingControlId)assert.equal(t.existingControlId,c.controlId,'Wrong interview control');
        if(t.existingCriterionId)assert.equal(t.existingCriterionId,c.criterionId,'Wrong interview criterion');
      }
    }
    for(const c of e.interviewCoverage) {
      assert(c.decision?.trim(),'Missing coverage decision');
      if(c.choiceId)assert(choices.has(c.choiceId),'Unknown coverage choice');
    }
  }
}
if(path.basename(process.argv[1]??'') === 'scholarship-intake.ts'){
  const root=path.resolve(import.meta.dirname,'../..');
  const l=JSON.parse(fs.readFileSync(path.join(root,'docs/evidence/SCHOLARSHIP-INTAKE-ledger.json'),'utf8')) as Ledger;
  console.log(JSON.stringify(validateIntakeLedger(l,root,process.argv.includes('--complete'))));
}
