// Local canonical provenance only. Does not read a workbook, fetch links or allocate new award seeds.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { adaptP1Inventory, sha256Text } from '../../../web/src/lib/canonicalModel';
import { publicEntityId } from '../../../web/src/lib/studentCatalog';
const packet=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(packet,'../../..');
const read=(p:string)=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const hash=(p:string)=>sha256Text(fs.readFileSync(path.join(root,p),'utf8'));
const inventory=read('docs/evidence/P1-inventory.json');
const pins={p1InventorySha256:hash('docs/evidence/P1-inventory.json'),p1ManifestSha256:hash('docs/evidence/P1-manifest.json'),spreadsheetRevisionId:inventory.generatedFrom.spreadsheetRevisionId,capturedAt:inventory.generatedFrom.capturedAt};
const model=adaptP1Inventory(inventory,pins);
const current=read('web/fixtures/r3/catalog-v1.json');
const old=read('web/fixtures/p7/student-catalog.json');
const ids=['award-67de97a4f446','award-e05338ef963f'];
const records=ids.map(publicId=>{
 const matches=model.scholarships.filter(x=>publicEntityId('award',x.id)===publicId);
 if(matches.length!==1)throw new Error(`Expected one preserved canonical identity for ${publicId}`);
 const canonical=matches[0];
 const award=current.catalog.awards.find((x:any)=>x.publicId===publicId);
 const prior=old.awards.find((x:any)=>x.publicId===publicId);
 if(!award||!prior)throw new Error('Published identity missing');
 return {existingPublicId:publicId,existingCanonicalId:canonical.id,existingCanonicalName:canonical.name,
 existingCanonicalSourceIds:canonical.sourceIds,currentRecordedAppAward:award,priorPublishedAward:prior,
 currentSourceAliases:current.catalog.sources.filter((x:any)=>award.sourcePublicIds.includes(x.publicId)),
 proposedInputLocator:publicId===ids[0]?40:68,identityState:'held',
 binding:'candidate only: matching recorded name, GPA and destination scope corroborate; changed route/version and Montana relationship are unresolved',
 sourceReadPolicy:'All older workbook-derived data used only for identity provenance, never current fact evidence. No older URL fetched.'};
});
const files=['docs/evidence/P1-inventory.json','docs/evidence/P1-manifest.json','web/fixtures/p7/student-catalog.json','web/fixtures/r3/catalog-v1.json'];
const result={scope:'local comparison of existing canonical/public identities only',observedAt:new Date().toISOString(),records,
 comparedArtifacts:files.map(p=>({path:p,sha256:hash(p)})),
 preservedExistingIds:true,newIdentitySeedsAllocated:0,acceptedMappings:0,completeCanonicalCollisionReconciliation:false};
fs.writeFileSync(path.join(packet,'identity-comparison.json'),JSON.stringify(result,null,2)+'\n');
console.log('PASS: both existing canonical/public ID pairs retained as held mapping candidates');
