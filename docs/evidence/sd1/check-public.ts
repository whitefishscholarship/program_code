import { readFileSync } from 'node:fs';
import { StudentAwardSchema, StudentSourceSchema } from '../../../web/src/lib/studentCatalog';
const pilot = JSON.parse(readFileSync(new URL('./pilot.json', import.meta.url), 'utf8'));
for (const award of pilot.publicProjection) StudentAwardSchema.parse(award);
for (const source of pilot.sources) StudentSourceSchema.parse({
  publicId: `source-${source.sourceId.split('_')[1].slice(0, 12)}`,
  title: source.url, recordType: 'source', architecture: 'unknown',
  url: source.url, access: 'unknown', availability: 'unknown', awardCount: source.awardIds.length,
});
const ids = new Set(pilot.sources.map((s: { sourceId: string }) => `source-${s.sourceId.split('_')[1].slice(0, 12)}`));
if (ids.size !== pilot.sources.length) throw new Error('Public source ID prefix collision');
for (const award of pilot.publicProjection) for (const id of award.sourcePublicIds) {
  if (!ids.has(id)) throw new Error(`Orphan public source ${id}`);
}
console.log(JSON.stringify({ outcome: 'PASS', awards: pilot.publicProjection.length, sources: ids.size, schema: 'existing StudentAwardSchema/StudentSourceSchema', appChanged: false }));
