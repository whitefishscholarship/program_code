import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';

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
type Row = { id: string; sheetId: number; tab: string; rowNumber: number; rowContentSha256: string;
  sourcePath: string; entityId: string | null; disposition: string | null; rationale: string | null;
  destination: {kind: string; rowNumber?: number; entityId?: string; operationId?: string} | null;
  evidenceIds: string[]; review: {status: string; reviewer: string | null}; };
type Entity = {id: string; sourceRowIds: string[]; disposition: string | null; status: string;
  fields: {column: string;newValue: unknown;sourceId: string;decision: string}[];
  officialEvidenceIds: string[]; tags: {key: string;sourceId: string;existingChoiceId: string|null}[];
  interviewCoverage: unknown[]; proposedValues?: string[]; review: {status:string;reviewer:string|null};};
type Ledger = {schemaVersion:number;planId:string;inputs:{workbookId:string;snapshotId:string;snapshotSha256:string;
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
      if(r.destination.kind==='existing_master')assert(l.rows.some(x=>x.sheetId===0&&x.rowNumber===r.destination!.rowNumber),'Missing Master destination');
      else {assert.equal(r.destination.kind,'proposed_operation');assert(r.destination.operationId);assert.equal(entities.get(r.destination.entityId!)?.disposition,'propose_add','Survivor is not a proposed add');}
    }
    for(const source of r.evidenceIds) assert(sources.has(source),'Unknown row evidence');
    if(complete){assert(r.disposition,'Pending row');assert.equal(r.review.status,'reviewed');assert(r.review.reviewer);}
  }
  for(const s of l.officialSources){assert(/^https:\/\//.test(s.url));assert(!Number.isNaN(Date.parse(s.observedAt)));assert(/^[a-f0-9]{64}$/.test(s.contentSha256));assert(fs.existsSync(path.join(root,s.evidencePath)));}
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
  return {rows:l.rows.length,entities:l.entities.length,decidedRows:l.rows.filter(r=>r.disposition!==null).length,pendingEntities:l.entities.filter(e=>e.status==='pending-evaluation').length,proposedAdds:l.entities.filter(e=>e.disposition==='propose_add').length};
}
if(path.basename(process.argv[1]??'') === 'scholarship-intake.ts'){
  const root=path.resolve(import.meta.dirname,'../..');
  const l=JSON.parse(fs.readFileSync(path.join(root,'docs/evidence/SCHOLARSHIP-INTAKE-ledger.json'),'utf8')) as Ledger;
  console.log(JSON.stringify(validateIntakeLedger(l,root,process.argv.includes('--complete'))));
}
