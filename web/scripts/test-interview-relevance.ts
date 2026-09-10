import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { InterviewAnswersSchema, type InterviewAnswers } from '../src/lib/interviewMatcher';
import { StudentCatalogSchema } from '../src/lib/studentCatalog';
import { shortlistAwards, type ShortlistResult } from '../src/lib/spreadsheetShortlist';
import { RELEVANCE_PUBLICATION, RELEVANCE_SHA256, UNSUPPORTED_SPECIAL_CHOICES } from '../src/lib/interviewRelevance';
import { SPECIAL_CRITERIA, ACTIVITY_QUESTIONS, RESIDENCE_STATES, EDUCATIONAL_STATUSES, TARGET_SCHOOL_TYPES, VOLUNTEER_HOURS } from '../src/lib/interviewQuestions';
import { serializeAwardCsv } from '../src/lib/export';
import { parseCsv } from './p8m-acceptance';
import catalogJson from '../fixtures/p7/student-catalog.json';
import ledger from '../../docs/evidence/PLAN-REV14-mapping.json';
import matrix from '../../docs/evidence/PLAN-REV14-matrix.json';
const catalog=StudentCatalogSchema.parse(catalogJson),base=InterviewAnswersSchema.parse(matrix.base);
const run=(answers:InterviewAnswers)=>shortlistAwards(catalog.awards,answers);
const before=run(base);
const ids=(r:ShortlistResult[])=>r.map(x=>x.award.publicId);
const decisions=(r:ShortlistResult[])=>Object.fromEntries(r.map(x=>[x.award.publicId,x.decision]).sort(([a],[b])=>a.localeCompare(b)));
function choose(id:string):InterviewAnswers{return InterviewAnswersSchema.parse({...base,...(id==='financial_need'?{financialNeed:true}:ACTIVITY_QUESTIONS.some(x=>x.id===id)?{activities:[id]}:{selectedCriteria:[id]})});}
for(const c of RELEVANCE_PUBLICATION.connections) assert(!/\bcell\b|disputed summary|reviewer/i.test(c.message), 'student explanations must not expose mapping or review mechanics');
const known=new Map(RELEVANCE_PUBLICATION.connections.map(c=>[c.id,c]));
for(const ex of matrix.pairedExamples){
 const result=run(choose(ex.answerId));const target=result.results.find(x=>x.award.publicId===ex.awardId)!;
 assert.equal(before.results.find(x=>x.award.publicId===ex.awardId)!.relevant,false);
 assert.equal(target.relevant,true);assert(target.reasons.some(r=>r.code===ex.connectionId&&r.message===ex.expectedReason));
 assert.equal(known.get(ex.connectionId)?.message,ex.expectedReason);
 assert.deepEqual(result.counts,before.counts);assert.deepEqual(decisions(result.results),decisions(before.results));
 assert.equal(result.results.length,192);
 const visible=result.results.filter(x=>x.decision!=='recorded_mismatch');
 let reachedPlain=false;for(const r of visible){if(!r.relevant)reachedPlain=true;else assert(!reachedPlain,'relevant awards must precede unrelated awards within shortlist');}
 const csv=parseCsv(serializeAwardCsv(visible.map(x=>x.award)).replace(/^\uFEFF/,''));assert.deepEqual(csv.rows.map(x=>x.Name),visible.map(x=>x.award.name));assert(!csv.headers.some(x=>/relevance|answer|reason|decision/i.test(x)));
}
for(const [profile,expected] of [[base,166],[{...base,gpa:2},125],[{...base,targetSchoolTypes:['trade_vocational']},152],[{...base,targetSchoolTypes:['undecided']},190]] as const){const out=run(InterviewAnswersSchema.parse(profile));assert.equal(out.counts.match+out.counts.possibleMatch,expected);}
const compound=run({...base,selectedCriteria:['stem','healthcare']});const stem=run(choose('stem')),health=run(choose('healthcare'));
assert.deepEqual(new Set(compound.results.filter(x=>x.relevant).map(x=>x.award.publicId)),new Set([...stem.results,...health.results].filter(x=>x.relevant).map(x=>x.award.publicId)));
assert(compound.results.some(x=>x.reasons.filter(r=>r.code.startsWith('relevance-')).length>1));
const all=InterviewAnswersSchema.parse({...base,selectedCriteria:SPECIAL_CRITERIA.map(x=>x.id),activities:ACTIVITY_QUESTIONS.map(x=>x.id),financialNeed:true});
const skipped=run({...all,sensitiveCriteriaSkipped:true});const nonSensitive=run({...base,selectedCriteria:SPECIAL_CRITERIA.filter(x=>!x.sensitive).map(x=>x.id),activities:ACTIVITY_QUESTIONS.filter(x=>!x.sensitive).map(x=>x.id)});
assert.deepEqual(skipped,nonSensitive,'even contradictory incoming selected+skip state must suppress every sensitive effect');
for(const choice of UNSUPPORTED_SPECIAL_CHOICES)assert.deepEqual(run(choose(choice.id)),before);
assert.deepEqual(UNSUPPORTED_SPECIAL_CHOICES.map(x=>x.id),['nonbinary','single_parent','mensa','aviation_management','farmers_union']);
assert.deepEqual(run({...base,collegeAccepted:true,gapYear:true,volunteerHours:'100 plus',residenceState:'OTHER',educationalStatus:'gap_year'}),before);
const active=run(all);
for(const row of ledger.rows){assert.deepEqual(active.results.find(x=>x.award.publicId===row.targetId)?.relevant,row.targetKind==='portal'?undefined:row.connectionIds.length>0);}
for(const row of ledger.catalogOnlyAwards)assert.equal(active.results.find(x=>x.award.publicId===row.awardId)!.relevant,false);
for(const [answer,row] of [['company_employee',75],['electric_coop',46],['elks_lodge',21],['credit_union',47],['leadership',103],['military_veteran',108]] as const){const id=ledger.rows.find(x=>x.sourceRow===row)!.targetId;assert.equal(run(choose(answer)).results.find(x=>x.award.publicId===id)!.relevant,false);}
const narrow=known.get('relevance-13-credit_union')!;assert(narrow.message.includes('Clearwater Credit Union'));assert(narrow.message.includes('six months'));assert(known.get('relevance-159-native_american')!.message.includes('Confederated Salish'));
assert(run(choose('aviation_pilot')).results.findIndex(x=>x.relevant&&x.decision==='needs_checking') < run(choose('aviation_pilot')).results.findIndex(x=>!x.relevant&&x.decision==='recorded_fit'));
const expectedSort=[...active.results].sort((a,b)=>Number(a.decision==='recorded_mismatch')-Number(b.decision==='recorded_mismatch')||Number(b.relevant)-Number(a.relevant)||Number(a.decision==='needs_checking')-Number(b.decision==='needs_checking')||a.award.name.localeCompare(b.award.name)||a.award.publicId.localeCompare(b.award.publicId));assert.deepEqual(ids(active.results),ids(expectedSort),'multiple connections have no accumulating score');
assert.deepEqual(shortlistAwards([...catalog.awards].reverse(),all),active);
const controls=new Set(ledger.controls.map(x=>x.id));assert.equal(controls.size,ledger.controls.length);
for(const x of [...SPECIAL_CRITERIA,...ACTIVITY_QUESTIONS])assert(controls.has(x.id));
for(const [field,options] of [['residenceState',RESIDENCE_STATES],['educationalStatus',EDUCATIONAL_STATUSES],['targetSchoolTypes',TARGET_SCHOOL_TYPES],['volunteerHours',VOLUNTEER_HOURS]] as const)for(const [value] of options)assert(controls.has(`${field}:${value}`));
assert.equal(ledger.rows.length,197);assert.equal(new Set(ledger.rows.map(r=>r.sourceRow)).size,197);assert.equal(ledger.connections.length,matrix.pairedExamples.length);
assert.equal(crypto.createHash('sha256').update(fs.readFileSync('fixtures/relevance/interview-relevance-v1.json')).digest('hex'),RELEVANCE_SHA256);
execFileSync(process.execPath,['--import','tsx','scripts/build-interview-relevance.ts'],{stdio:'pipe'});
for(const p of ['src/lib/interviewRelevance.ts','src/lib/spreadsheetShortlist.ts','src/components/InterviewWizard.tsx','src/components/ScholarshipBrowser.tsx'])for(const token of ['localStorage','sessionStorage','indexedDB','sendBeacon','document.cookie','console.log','XMLHttpRequest'])assert(!fs.readFileSync(p,'utf8').includes(token));
console.log('RELEVANCE PASS',JSON.stringify({pairedConnections:matrix.pairedExamples.length,enabledControls:matrix.browserExamples.length,sourceRows:197,awards:192,academicRegression:[166,125,152,190]}));
