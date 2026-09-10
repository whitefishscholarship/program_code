import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import catalogJson from '../fixtures/p7/student-catalog.json';
import { StudentCatalogSchema } from '../src/lib/studentCatalog';
import { InterviewAnswersSchema } from '../src/lib/interviewMatcher';
import { shortlistAwards, SHORTLIST_PUBLICATION, SHORTLIST_SHA256, type ShortlistRow } from '../src/lib/spreadsheetShortlist';
import { serializeAwardCsv } from '../src/lib/export';
import { historicalRuntimeClosureSha256, permitsLocalShortlistPreparation } from './shortlist-governance';
import { parseCsv } from './p8m-acceptance';

const catalog = StudentCatalogSchema.parse(catalogJson);
const base = InterviewAnswersSchema.parse({ gpa: 3.5, residenceState: 'MT', educationalStatus: 'high_school_senior', targetSchoolTypes: ['four_year'], collegeAccepted: null, gapYear: null, activities: [], volunteerHours: null, financialNeed: false, selectedCriteria: [], sensitiveCriteriaSkipped: false, preferredApplicationModes: [] });
const profiles = [base, {...base,gpa:2}, {...base,targetSchoolTypes:['trade_vocational'] as const}, {...base,targetSchoolTypes:['undecided'] as const}];
const results = profiles.map(answers => shortlistAwards(catalog.awards, {...answers, targetSchoolTypes:[...answers.targetSchoolTypes]}));
for (const result of results) {
  assert.equal(result.results.length,192);
  assert.equal(new Set(result.results.map(r=>r.award.publicId)).size,192);
  assert.equal(result.counts.match+result.counts.possibleMatch+result.counts.knownConflict,192);
  const visible = result.results.filter(r=>r.decision!=='recorded_mismatch').map(r=>r.award);
  const csv = parseCsv(serializeAwardCsv(visible).replace(/^\uFEFF/,''));
  assert.deepEqual(csv.rows.map(r=>r.Name),visible.map(a=>a.name));
  assert.deepEqual(csv.headers,['Record type','Name','Cycle status','Cycle details','Amount','Minimum GPA','School types','Application method','Official link']);
}
assert(results[1].counts.knownConflict > results[0].counts.knownConflict,'lower GPA must change the actual shortlist');
assert.notDeepEqual(results[2].results.filter(r=>r.decision==='recorded_mismatch').map(r=>r.award.publicId),results[0].results.filter(r=>r.decision==='recorded_mismatch').map(r=>r.award.publicId),'school choice must change results');
assert.deepEqual(shortlistAwards(catalog.awards,{...base,financialNeed:true,selectedCriteria:['adhd'],sensitiveCriteriaSkipped:false}),results[0],'unsupported sensitive answers cannot alter results');
assert.deepEqual(shortlistAwards(catalog.awards,{...base,selectedCriteria:[],sensitiveCriteriaSkipped:true}),results[0]);
const row: ShortlistRow = { sourceRow:2,targetKind:'award',targetId:catalog.awards[0].publicId,minimumGpa:3,schoolTypes:['four_year'],applicationPreference:'offline' };
const one = (gpa:number,schoolTypes=base.targetSchoolTypes,rows=[row])=>shortlistAwards([catalog.awards[0]],{...base,gpa,targetSchoolTypes:schoolTypes},rows).results[0];
assert.equal(one(2.99).decision,'recorded_mismatch');
assert.equal(one(3).decision,'recorded_fit');
assert.equal(one(3,['trade_vocational']).decision,'recorded_mismatch');
assert.notEqual(one(3,['undecided','trade_vocational']).decision,'recorded_mismatch');
assert.equal(one(3,['undecided'],[{...row,minimumGpa:null}]).decision,'needs_checking');
assert.equal(one(2,['four_year'],[{...row,minimumGpa:null}]).decision,'recorded_fit','one missing field must not cancel a supported school comparison');
assert.equal(one(2,['trade_vocational'],[{...row,targetKind:'portal'}]).decision,'needs_checking');
const preferredAward = {...catalog.awards[0], publicId:'award-900000000002',name:'Z synthetic preferred'};
const plainAward = {...catalog.awards[0], publicId:'award-900000000001',name:'A synthetic plain'};
const prefRows: ShortlistRow[] = [{...row,targetId:preferredAward.publicId},{...row,targetId:plainAward.publicId,applicationPreference:null}];
const prefBase=shortlistAwards([preferredAward,plainAward],base,prefRows);
const prefChoice=shortlistAwards([preferredAward,plainAward],{...base,preferredApplicationModes:['offline']},prefRows);
assert.deepEqual(prefChoice.counts,prefBase.counts,'preferences never exclude');
assert.equal(prefBase.results[0].award.publicId,plainAward.publicId);
assert.equal(prefChoice.results[0].award.publicId,preferredAward.publicId);
assert.deepEqual(shortlistAwards([...catalog.awards].reverse(),base),results[0],'input order cannot change result ordering');

for (const n of [6,30,98,158]) assert.equal(SHORTLIST_PUBLICATION.rows.find(r=>r.sourceRow===n)?.minimumGpa,null);
const mappedIds = new Set(SHORTLIST_PUBLICATION.rows.filter(r=>r.targetKind==='award').map(r=>r.targetId));
assert.equal(results[0].results.filter(r=>!mappedIds.has(r.award.publicId)&&r.decision==='needs_checking').length,16);
assert.equal(crypto.createHash('sha256').update(fs.readFileSync('fixtures/shortlist/spreadsheet-shortlist-v1.json')).digest('hex'),SHORTLIST_SHA256);
assert.deepEqual(SHORTLIST_PUBLICATION.counts,{sourceRows:197,awardRows:176,portalRows:21,catalogAwards:192,catalogOnlyAwards:16,gpaRules:49,schoolRules:64});
execFileSync(process.execPath,['--import','tsx','scripts/build-spreadsheet-shortlist.ts'],{stdio:'pipe'});
assert.equal(historicalRuntimeClosureSha256('..','729d39b02b3462e6365648d19317bfc1ef249982'),'4a0bb4bda4077e4eda2c8df7f86edd3dc66592a292cbf8cc9dee636e89cfe373');
assert.notEqual(historicalRuntimeClosureSha256('..','6648652c2d42a663c61de7cc525928c7581a112c'),'4a0bb4bda4077e4eda2c8df7f86edd3dc66592a292cbf8cc9dee636e89cfe373');
assert.throws(()=>historicalRuntimeClosureSha256('..','0'.repeat(40)));
const blockers=['PLAN-REV13-awaits-exact-Git-Vercel-effect-authority-or-verified-suppression'];
assert(permitsLocalShortlistPreparation('PLAN-REV13',blockers,false));
assert(!permitsLocalShortlistPreparation('PLAN-REV13',blockers,true));
assert(!permitsLocalShortlistPreparation('PLAN-REV13',[],false));
assert(!permitsLocalShortlistPreparation('PLAN-REV14',blockers,false));
for (const p of ['src/lib/spreadsheetShortlist.ts','src/components/InterviewWizard.tsx','src/components/ScholarshipBrowser.tsx']) {
 const source=fs.readFileSync(p,'utf8');
 for(const forbidden of ['localStorage','sessionStorage','indexedDB','sendBeacon','document.cookie','console.log','XMLHttpRequest']) assert(!source.includes(forbidden),`${p}: ${forbidden}`);
}
console.log('SHORTLIST PASS',JSON.stringify(results.map(r=>r.counts)));
