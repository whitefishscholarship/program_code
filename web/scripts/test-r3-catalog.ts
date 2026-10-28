import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { R3_CATALOG, R3_SHORTLIST_ROWS, R3_CONNECTIONS, R3_PROVENANCE } from '../src/lib/r3Catalog';
import { StudentCatalogSchema } from '../src/lib/studentCatalog';
import { shortlistAwards, SHORTLIST_PUBLICATION } from '../src/lib/spreadsheetShortlist';
import { RELEVANCE_PUBLICATION, UNSUPPORTED_SPECIAL_CHOICES } from '../src/lib/interviewRelevance';
import { COVERAGE_PUBLICATION } from '../src/lib/coverageRelevance';
import { InterviewAnswersSchema, type InterviewAnswers } from '../src/lib/interviewMatcher';
import { SPECIAL_CRITERIA, ACTIVITY_QUESTIONS } from '../src/lib/interviewQuestions';
import { STUDENT_ORGANIZATIONS } from '../src/lib/coverageQuestions';
import { serializeAwardCsv, EXPORT_HEADERS } from '../src/lib/export';
import { catalogCompatibilityRows } from '../src/lib/catalogCompatibility';
import { parseCsv } from './p8m-acceptance';
import historical from '../fixtures/p7/student-catalog.json';
import pin from '../fixtures/r3/pin.json';
const hash = (path: string) => crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');
assert.equal(hash('fixtures/r3/catalog-v1.json'), pin.sha256);
assert.equal(hash('../docs/evidence/r3-catalog/mapping-bundle-proposal.json'), '9a4f8c8c0e3990fcaa182f52595710ee0404c11572f69512b4254bb0f6b72908');
for (const [key,path] of Object.entries({mappingReviewSha256:'../docs/evidence/r3-catalog/mapping-review.json',mappingManifestSha256:'../docs/evidence/r3-catalog/mapping-manifest.json',reconciliationSha256:'../docs/evidence/r3-catalog/mapping-reconciliation.json',generatorSha256:'scripts/build-r3-catalog.py'})) assert.equal(hash(path),pin[key as keyof typeof pin]);
assert.equal(JSON.parse(fs.readFileSync('../docs/evidence/r3-catalog/mapping-review.json','utf8')).outcome,'PASS');
const old = StudentCatalogSchema.parse(historical), oldIds = new Set(old.awards.map(a => a.publicId));
const base = InterviewAnswersSchema.parse({gpa:3.5,targetSchoolTypes:['four_year']});
function choose(id:string):InterviewAnswers {
 return InterviewAnswersSchema.parse({...base,...(id==='financial_need'?{financialNeedInterest:'yes'}:id.startsWith('org_')?{studentOrganizations:[id.slice(4)],organizationResponse:'selected'}:id==='education_teaching'?{discoveryInterests:[id]}:ACTIVITY_QUESTIONS.some(x=>x.id===id)?{activities:[id]}:{selectedCriteria:[id]})});
}
const profiles:InterviewAnswers[] = [base,...[0,2,3,4].map(gpa=>({...base,gpa})),...(['two_year','trade_vocational','undecided'] as const).map(s=>({...base,targetSchoolTypes:[s]})),...SPECIAL_CRITERIA.map(c=>choose(c.id)),...ACTIVITY_QUESTIONS.map(c=>choose(c.id)),choose('financial_need'),choose('education_teaching'),...STUDENT_ORGANIZATIONS.map(o=>choose('org_'+o.id))];
const clearedByOfficialPage = new Map<string, Set<string>>([
 ['award-d8ff6ef257b3', new Set(['recorded_gpa'])],
 ['award-2179b44d009d', new Set(['recorded_school'])],
 ['award-5fec013fe00c', new Set(['recorded_gpa', 'recorded_school'])],
 ['award-2e991f852dca', new Set(['recorded_gpa', 'recorded_school'])],
 ['award-5230a4d409fd', new Set(['recorded_school'])],
 ['award-ffbd0f0b989f', new Set(['recorded_school'])],
 ['award-bb8ca59a7f0f', new Set(['recorded_gpa'])],
 ['award-077975690fea', new Set(['recorded_gpa'])],
 ['award-84882a48ae6c', new Set(['recorded_gpa'])],
 ['award-6c3df1c9b693', new Set(['recorded_gpa'])],
 ['award-3ec37786eaf6', new Set(['recorded_school'])],
 ['award-e34d317f0f51', new Set(['recorded_school'])],
 ['award-11631fa03190', new Set(['recorded_school'])],
 ['award-3de0c3240164', new Set(['recorded_school'])],
 ['award-1f64dfaa7bf7', new Set(['recorded_school'])],
 ['award-40f544a79f9d', new Set(['recorded_school'])],
 ['award-347a9a678c08', new Set(['recorded_school'])],
 ['award-baac2dac6d2e', new Set(['recorded_school'])],
 ['award-34904382b098', new Set(['recorded_gpa'])],
 ['award-3dbe39e6a748', new Set(['recorded_school'])],
 ['award-b1a03b264f02', new Set(['recorded_school'])],
 ['award-bbe935853482', new Set(['recorded_school'])],
]);
for(const profile of profiles){
 const before=shortlistAwards(old.awards,profile,SHORTLIST_PUBLICATION.rows,[]);
 const now=shortlistAwards(R3_CATALOG.awards,profile);
 assert.equal(now.results.length,411);
 for(const prior of before.results){
  const retained=now.results.find(x=>x.award.publicId===prior.award.publicId)!;
  const cleared=clearedByOfficialPage.get(prior.award.publicId);
  if(!cleared) assert.equal(retained.decision,prior.decision,'existing academic decision changed');
  for(const reason of prior.reasons){
   if(cleared?.has(reason.code)) continue;
   assert(retained.reasons.some(r=>r.code===reason.code&&r.message===reason.message),'existing reason lost');
  }
 }
}
const baseline=shortlistAwards(R3_CATALOG.awards,base);
const decisions=(result:ReturnType<typeof shortlistAwards>)=>Object.fromEntries(result.results.map(r=>[r.award.publicId,r.decision]).sort());
for(const c of R3_CONNECTIONS){
 const result=shortlistAwards(R3_CATALOG.awards,choose(c.answerId));
 const target=result.results.find(r=>r.award.publicId===c.awardId)!;
 assert(target.relevant && target.reasons.some(r=>r.code===c.id&&r.message===c.message));
 assert.deepEqual(decisions(result),decisions(baseline));
}
for(const response of ['no','not_sure','prefer_not_to_answer',null] as const) assert.deepEqual(shortlistAwards(R3_CATALOG.awards,{...base,financialNeedInterest:response}),baseline);
assert.deepEqual(shortlistAwards(R3_CATALOG.awards,{...base,financialNeedInterest:'yes',sensitiveCriteriaSkipped:true}),baseline);
for(const response of ['none','not_sure','prefer_not_to_answer'] as const) assert.deepEqual(shortlistAwards(R3_CATALOG.awards,{...base,studentOrganizations:STUDENT_ORGANIZATIONS.map(o=>o.id),organizationResponse:response}),baseline);
const a=choose('education_teaching'),b=choose('org_deca');
const compound=shortlistAwards(R3_CATALOG.awards,{...a,studentOrganizations:b.studentOrganizations,organizationResponse:'selected'});
assert.deepEqual(new Set(compound.results.filter(r=>r.relevant).map(r=>r.award.publicId)),new Set([a,b].flatMap(p=>shortlistAwards(R3_CATALOG.awards,p).results.filter(r=>r.relevant).map(r=>r.award.publicId))));
assert.deepEqual(decisions(compound),decisions(baseline));
for(const row of R3_SHORTLIST_ROWS.filter(r=>!oldIds.has(r.targetId)&&r.targetKind==='award')){
 const award=R3_CATALOG.awards.find(a=>a.publicId===row.targetId)!;
 if(row.minimumGpa!==null){
  const threshold=row.minimumGpa;
  const run=(gpa:number)=>shortlistAwards([award],{...base,gpa,targetSchoolTypes:['undecided']}).results[0];
  assert.equal(run(threshold).decision,'recorded_fit');assert.equal(run(threshold-0.01).decision,'recorded_mismatch');
 }
 if(row.schoolTypes.length){
  assert.equal(shortlistAwards([award],{...base,gpa:4,targetSchoolTypes:[row.schoolTypes[0]]}).results[0].decision,'recorded_fit');
  const missing=(['two_year','four_year','trade_vocational'] as const).find(x=>!row.schoolTypes.includes(x));
  if(missing){assert.equal(shortlistAwards([award],{...base,gpa:4,targetSchoolTypes:[missing]}).results[0].decision,'recorded_mismatch');assert.notEqual(shortlistAwards([award],{...base,gpa:4,targetSchoolTypes:[missing,'undecided']}).results[0].decision,'recorded_mismatch');}
 }
}
assert.equal(R3_SHORTLIST_ROWS.filter(r=>r.targetKind==='award'&&!oldIds.has(r.targetId)&&r.minimumGpa!==null).length,7);
assert.equal(R3_SHORTLIST_ROWS.filter(r=>r.targetKind==='award'&&!oldIds.has(r.targetId)&&r.schoolTypes.length).length,5);
assert.equal(STUDENT_ORGANIZATIONS.length,9);
for(const org of STUDENT_ORGANIZATIONS)assert([...COVERAGE_PUBLICATION.connections,...R3_CONNECTIONS].some(c=>c.answerId==='org_'+org.id));
assert(!UNSUPPORTED_SPECIAL_CHOICES.some(c=>c.id==='aviation_management'));
assert(!R3_CONNECTIONS.some(c=>['foster_care','first_generation'].includes(c.answerId)));
assert.equal(RELEVANCE_PUBLICATION.connections.length,206);assert.equal(COVERAGE_PUBLICATION.connections.length,4);
const compatibility=catalogCompatibilityRows(R3_CATALOG);assert.deepEqual(compatibility.map(a=>a.publicId),R3_CATALOG.awards.map(a=>a.publicId));
const csv=parseCsv(serializeAwardCsv(compound.results.map(r=>r.award)).replace(/^\uFEFF/,''));
assert.deepEqual(csv.headers,[...EXPORT_HEADERS]);assert.deepEqual(csv.rows.map(r=>r['Award ID']),compound.results.map(r=>r.award.publicId));
for(const key of ['financialNeedInterest','studentOrganizations','discoveryInterests','reasons','decision'])assert(!csv.headers.some(header=>header===key));
assert.equal(R3_PROVENANCE.sourceRevision,'229');assert.equal(R3_PROVENANCE.snapshotDate,'2026-09-14');
assert.equal(R3_PROVENANCE.revisionType,'connector_reported');
console.log('R3 CATALOG PASS',JSON.stringify({awards:411,preservedAwards:192,profiles:profiles.length,pairedConnections:R3_CONNECTIONS.length,newGpaRules:7,newSchoolRules:5,organizations:9,publicCsvIds:true,sensitiveSkipNonExcluding:true}));
