import { z } from 'zod';
import publication from '../../fixtures/coverage/interview-coverage-v1.json';
import pin from '../../fixtures/coverage/pin.json';
export const COVERAGE_PUBLICATION = z.strictObject({
  schemaVersion: z.literal(1), id: z.literal('interview-coverage-supplement-v1-rev225'),
  basis: z.literal('organizer_recorded_not_officially_verified'), snapshotDate: z.literal('2026-09-02'), sourceRevision: z.literal('225'),
  connections: z.array(z.strictObject({ id: z.string().min(1), answerId: z.enum(['education_teaching', 'org_nths', 'org_ffa']), awardId: z.string().regex(/^award-[0-9a-f]{12}$/), message: z.string().min(1) })),
}).parse(publication);
export const COVERAGE_SHA256 = pin.sha256;
