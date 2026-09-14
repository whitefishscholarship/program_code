import { z } from 'zod';
import bundle from '../../fixtures/r3/catalog-v1.json';
import pin from '../../fixtures/r3/pin.json';
import { StudentCatalogSchema } from './studentCatalog';
import { SPECIAL_CRITERIA, ACTIVITY_QUESTIONS } from './interviewQuestions';
import { COVERAGE_INTERESTS, STUDENT_ORGANIZATIONS } from './coverageQuestions';

const hash = z.string().regex(/^[a-f0-9]{64}$/);
export const R3RowSchema = z.strictObject({
  sourceRow: z.number().int().min(2).max(417), targetKind: z.enum(['award', 'portal']), targetId: z.string(),
  minimumGpa: z.number().min(0).max(4).nullable(), schoolTypes: z.array(z.enum(['two_year', 'four_year', 'trade_vocational'])),
  applicationPreference: z.enum(['offline', 'direct_per_award', 'automatic_consideration']).nullable(),
});
const answerIds = new Set<string>([...SPECIAL_CRITERIA, ...ACTIVITY_QUESTIONS, ...COVERAGE_INTERESTS].map(x => x.id));
for (const org of STUDENT_ORGANIZATIONS) answerIds.add(`org_${org.id}`);
answerIds.add('financial_need');
export const R3ConnectionSchema = z.strictObject({
  id: z.string().min(1), answerId: z.string().refine(id => answerIds.has(id)),
  awardId: z.string().regex(/^award-[a-f0-9]{12}$/), message: z.string().min(1),
});
export type DiscoveryConnection = z.infer<typeof R3ConnectionSchema>;
const publication = z.strictObject({
  provenance: z.strictObject({ schemaVersion: z.literal(1), id: z.literal('r3-catalog-v1-rev229'),
    basis: z.literal('organizer_recorded_not_officially_verified'), snapshotDate: z.literal('2026-09-14'),
    sourceRevision: z.literal('229'), sourceSnapshotSha256: hash, generatorSha256: hash,
    historicalMatchingFactsRevision: z.literal('225'), limits: z.array(z.string()),
  }),
  catalog: StudentCatalogSchema, shortlistRows: z.array(R3RowSchema).length(416), connections: z.array(R3ConnectionSchema),
}).parse(bundle);
export const R3_CATALOG = publication.catalog;
export const R3_SHORTLIST_ROWS = publication.shortlistRows;
export const R3_CONNECTIONS = publication.connections;
export const R3_PROVENANCE = {
  id: publication.provenance.id, schemaVersion: publication.provenance.schemaVersion,
  basis: publication.provenance.basis, snapshotDate: publication.provenance.snapshotDate,
  sourceRevision: publication.provenance.sourceRevision, revisionType: 'connector_reported',
  sourceSnapshotSha256: publication.provenance.sourceSnapshotSha256,
  catalogRevision: publication.catalog.catalogRevision, awardCount: publication.catalog.counts.awards,
  bundleSha256: pin.sha256, generatorSha256: pin.generatorSha256,
  mappingReviewSha256: pin.mappingReviewSha256, mappingManifestSha256: pin.mappingManifestSha256,
  reconciliationSha256: pin.reconciliationSha256,
};
