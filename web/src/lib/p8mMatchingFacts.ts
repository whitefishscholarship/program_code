import { z } from 'zod';
import publicationJson from '../../fixtures/p8m/matching-facts-v1.json';
import type { AcceptedMatchFactBundle } from './interviewMatcher';
import { indexAcceptedMatchingFacts } from './matchingFactRuntime';

export const P8M_PUBLICATION_SHA256 = '16db9f32a14c7b63d2a912a84c43ac973ae43a07d7c40841174d6fbdfd5a6b07';

const CurrentPublicationSchema = z.strictObject({
  schema_version: z.literal(1),
  publication_id: z.literal('p8m-matching-facts-v1-rev225'),
  taxonomy_version: z.literal('1.0.0'),
  source_revision: z.literal('225'),
  source_snapshot_sha256: z.string().regex(/^[a-f0-9]{64}$/),
  human_review_sha256: z.string().regex(/^[a-f0-9]{64}$/),
  generator_sha256: z.string().regex(/^[a-f0-9]{64}$/),
  reviewer_name: z.string().min(1),
  reviewed_at: z.string().min(1),
  status: z.literal('human_reviewed_nonmatching_tags_published'),
  policy: z.object({
    matching_use: z.literal('prohibited_without_accepted_official_source_facts'),
  }).passthrough(),
  counts: z.object({
    source_rows: z.literal(197),
    scholarship_rows: z.literal(176),
    portal_rows: z.literal(21),
    accepted_matching_facts: z.literal(0),
  }).passthrough(),
  accepted_facts: z.array(z.unknown()).length(0),
  reviewed_rows: z.array(z.unknown()).length(197),
});

export const P8M_MATCHING_PUBLICATION = CurrentPublicationSchema.parse(publicationJson);

// P8F intentionally fails closed if the pinned publication later gains facts.
// A future publication needs its own typed evaluator and review before any answer can affect a result.
export const CURRENT_ACCEPTED_MATCH_FACTS: AcceptedMatchFactBundle = Object.freeze({
  byAwardId: indexAcceptedMatchingFacts(P8M_MATCHING_PUBLICATION.accepted_facts),
  cycleIdsByAwardId: Object.freeze({}),
});
export const CURRENT_ACCEPTED_MATCHING_FACT_COUNT = P8M_MATCHING_PUBLICATION.counts.accepted_matching_facts;
