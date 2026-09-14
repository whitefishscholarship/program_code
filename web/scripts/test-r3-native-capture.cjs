'use strict';
const assert = require('node:assert/strict');
const {captureNativeProjection: capture, HEADERS} = require('./r3-native-capture.cjs');
function response(n) { return {structuredContent:{result:{spreadsheetId:'1Dp5AMnrfSQ-Xf-r03S75lKsGPJk7o0inOgvC9Q6lOl4',spreadsheetUrl:'https://example.invalid/?ouid=SYNTHETIC_PRIVATE',properties:{title:'Whitefish HS Scholarship Database',locale:'en_US',timeZone:'America/Denver'},sheets:[{properties:{sheetId:0,title:'Master Database',index:6,sheetType:'GRID',gridProperties:{rowCount:1060,columnCount:24,frozenRowCount:1}},data:[{rowData:Array.from({length:n},(_,i)=>({values:i===0?HEADERS.map(stringValue=>({effectiveValue:{stringValue}})):[{effectiveValue:{stringValue:'Synthetic scholarship record'}}]}))}]}]}}}; }
assert.equal(capture(response(1),1).status,'PASS');
const complete=capture(response(417),417);assert.equal(complete.status,'PASS');assert.equal(complete.rowPositions,417);assert(!JSON.stringify(complete).includes('SYNTHETIC_PRIVATE'));
for(const mutate of [x=>x.spreadsheetId='other',x=>x.properties.extra='bad',x=>x.sheets.push(x.sheets[0]),x=>x.sheets[0].properties.sheetId=1,x=>x.sheets[0].data[0].rowData.pop(),x=>x.sheets[0].data[0].startRow=1,x=>x.sheets[0].data[0].rowData[0].values.pop(),x=>x.sheets[0].data[0].rowData[1].values[0].note='unapproved',x=>x.sheets[0].data[0].rowData[1].values[0].formattedValue='access_token=SYNTHETIC_PRIVATE',x=>x.sheets[0].data[0].rowData[1].values[0].formattedValue='Applicant Email: synthetic@example.invalid']) {
 const r=response(417);mutate(r.structuredContent.result);const out=capture(r,417);assert.equal(out.status,'BLOCKED');assert.equal(out.snapshot,null);assert(!JSON.stringify(out).includes('SYNTHETIC_PRIVATE'));
}
const sparse=response(417);sparse.structuredContent.result.sheets[0].data[0].rowData[1]={};const out=capture(sparse,417);assert.equal(out.status,'PASS');assert.equal(out.snapshot.rows[1].returnedCellCount,0);assert.equal(out.snapshot.rows[1].valuesFieldReturned,false);
assert.equal(capture(response(1),417).status,'BLOCKED');assert.equal(capture(response(1),418).status,'BLOCKED');
console.log('Native capture PASS: exact header/range/sheet, complete row positions, sparse-presence preservation, extra-field and sensitive-content rejection, discarded spreadsheet URL. Synthetic only.');
