'use strict';
const fs=require('node:fs'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {validateFreshnessSequence}=require('./r3-connector-read.cjs');
const {captureNativeProjection}=require('./r3-native-capture.cjs');
const dir='../docs/evidence/r3-catalog/';
const read=name=>JSON.parse(fs.readFileSync(dir+name,'utf8'));
const evidence=read('capture-verification.json');
const observations=evidence.observationPaths.map(p=>JSON.parse(fs.readFileSync('../'+p,'utf8')));
assert.deepEqual(validateFreshnessSequence(observations,evidence.captures,evidence.attempt),[]);
for(const o of observations){assert(o.fileMetadata.identityVerified);assert.equal(o.fileMetadata.modifiedTime,o.result.fileModifiedTime);assert.equal(o.fileMetadata.fileId,o.result.fileId);assert.equal(o.fileMetadata.trashed,null);}
for(const receipt of evidence.captures){
 const bytes=fs.readFileSync('../'+receipt.snapshotPath);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),receipt.snapshotFileSha256);
 const c=JSON.parse(bytes);
 const projected=captureNativeProjection({structuredContent:{spreadsheetId:c.spreadsheetId,properties:c.properties,sheets:[{properties:c.sheetProperties,data:[{startRow:0,startColumn:0,rowData:c.rows.map(r=>r.valuesFieldReturned?{values:r.cells}:{})}]}]}},417);
 assert.equal(projected.status,'PASS');assert.deepEqual(projected.snapshot.rows,c.rows);
}
console.log('R3 CAPTURE PASS: four independently stable observations, complete pinned native captures, source identity and shape; bounded consistency only.');
