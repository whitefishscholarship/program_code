import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { SPECIAL_CRITERIA, ACTIVITY_QUESTIONS } from '../src/lib/interviewQuestions';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const read=(p:string)=>fs.readFileSync(path.join(root,p),'utf8');
const sha=(s:string)=>crypto.createHash('sha256').update(s).digest('hex');
const ledger=JSON.parse(read('docs/evidence/PLAN-REV14-mapping.json'));
for(const [p,hash] of Object.entries(ledger.inputs)) assert.equal(sha(read(p)),hash,`Pinned input changed: ${p}`);
const source=JSON.parse(read('web/fixtures/p8m/master-database-rev225.json'));
const reviewed=JSON.parse(read('web/fixtures/p8m/matching-facts-v1.json'));
const catalog=JSON.parse(read('web/fixtures/p7/student-catalog.json'));
const allowed=new Set<string>([...SPECIAL_CRITERIA,...ACTIVITY_QUESTIONS].map(x=>x.id));allowed.add('financial_need');
assert.equal(ledger.rows.length,197);assert.equal(new Set(ledger.rows.map((r:any)=>r.sourceRow)).size,197);
assert.equal(ledger.catalogOnlyAwards.length,16);
assert.equal(new Set([...ledger.rows.filter((r:any)=>r.targetKind==='award').map((r:any)=>r.targetId),...ledger.catalogOnlyAwards.map((r:any)=>r.awardId)]).size,192);
assert.equal(new Set(ledger.connections.map((c:any)=>c.id)).size,ledger.connections.length);
const connections=ledger.connections.map((c:any)=>{
 assert.equal(c.disposition,'relevance_enabled');assert(allowed.has(c.answerId));
 const s=source.rows.find((r:any)=>r.row_number===c.sourceRow);
 const r=reviewed.reviewed_rows.find((r:any)=>r.row_number===c.sourceRow);
 assert.equal(c.sourceRowId,s.source_row_id);assert.equal(c.awardId,r.target_public_id);assert.equal(r.target_kind,'award');
 assert(catalog.awards.some((a:any)=>a.publicId===c.awardId));assert.equal(s.cells[c.sourceField],c.evidenceExcerpt);
 assert(c.explanation.trim().length>0);assert(!/you qualify|you are eligible/i.test(c.explanation));
 return {id:c.id,answerId:c.answerId,awardId:c.awardId,message:c.explanation};
});
const publication={schemaVersion:1,id:'interview-relevance-v1-rev225',basis:'organizer_recorded_not_officially_verified',snapshotDate:'2026-09-02',sourceRevision:'225',connections};
const bytes=JSON.stringify(publication,null,2)+'\n';
for(const [p,value] of Object.entries({'web/fixtures/relevance/interview-relevance-v1.json':bytes,'web/fixtures/relevance/pin.json':JSON.stringify({id:publication.id,sha256:sha(bytes)},null,2)+'\n'})){
 if(process.argv.includes('--write')){fs.mkdirSync(path.dirname(path.join(root,p)),{recursive:true});fs.writeFileSync(path.join(root,p),value);}else assert.equal(read(p),value,`Generated data differs: ${p}`);
}
console.log('Relevance publication PASS',JSON.stringify({connections:connections.length,awards:new Set(connections.map((c:any)=>c.awardId)).size,sha256:sha(bytes)}));
