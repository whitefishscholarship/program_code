import { R3_PROVENANCE } from '@/lib/r3Catalog';
import { COVERAGE_PUBLICATION, COVERAGE_SHA256 } from '@/lib/coverageRelevance';
import { RELEVANCE_PUBLICATION, RELEVANCE_SHA256 } from '@/lib/interviewRelevance';
import { SHORTLIST_PUBLICATION, SHORTLIST_SHA256 } from '@/lib/spreadsheetShortlist';
import { NextRequest, NextResponse } from 'next/server';
import {
  P8M_MATCHING_PUBLICATION,
  P8M_PUBLICATION_SHA256,
} from '@/lib/p8mMatchingFacts';

// Build/version stamp. A push to `main` auto-deploys, but production had no way to report
// WHICH commit it was running, so "did my change actually deploy?" could only be inferred
// from side effects. This endpoint answers it directly: curl /api/health -> the live commit
// SHA. Vercel injects VERCEL_GIT_COMMIT_SHA (and friends) at build+runtime.
//
// Public + never cached, so it always reflects the current deployment. No secrets exposed.
export const dynamic = 'force-dynamic';

export function GET(request: NextRequest) {
  const sha = process.env.VERCEL_GIT_COMMIT_SHA ?? 'local-dev';
  const requestedNonce = request.nextUrl.searchParams.get('nonce');
  const observationNonce =
    requestedNonce && /^[0-9a-f]{32,128}$/.test(requestedNonce) ? requestedNonce : null;
  return NextResponse.json({
    ok: true,
    commit: sha,
    commitShort: sha.slice(0, 7),
    ref: process.env.VERCEL_GIT_COMMIT_REF ?? null,
    message: process.env.VERCEL_GIT_COMMIT_MESSAGE ?? null,
    deploymentId: process.env.VERCEL_DEPLOYMENT_ID ?? null,
    region: process.env.VERCEL_REGION ?? null,
    env: process.env.VERCEL_ENV ?? 'local',
    publication: {
      mode: 'bundled_immutable_publication',
      path: 'web/fixtures/p8m/matching-facts-v1.json',
      sha256: P8M_PUBLICATION_SHA256,
      id: P8M_MATCHING_PUBLICATION.publication_id,
      schemaVersion: P8M_MATCHING_PUBLICATION.schema_version,
      taxonomyVersion: P8M_MATCHING_PUBLICATION.taxonomy_version,
      sourceRevision: P8M_MATCHING_PUBLICATION.source_revision,
      sourceRows: P8M_MATCHING_PUBLICATION.counts.source_rows,
      scholarshipRows: P8M_MATCHING_PUBLICATION.counts.scholarship_rows,
      portalRows: P8M_MATCHING_PUBLICATION.counts.portal_rows,
      acceptedMatchingFacts: P8M_MATCHING_PUBLICATION.counts.accepted_matching_facts,
    },
    catalog: R3_PROVENANCE,
    shortlist: { id: SHORTLIST_PUBLICATION.id, sha256: SHORTLIST_SHA256, snapshotDate: SHORTLIST_PUBLICATION.snapshotDate, basis: SHORTLIST_PUBLICATION.basis },
    relevance: { id: RELEVANCE_PUBLICATION.id, sha256: RELEVANCE_SHA256, snapshotDate: RELEVANCE_PUBLICATION.snapshotDate, basis: RELEVANCE_PUBLICATION.basis },
    coverage: { id: COVERAGE_PUBLICATION.id, sha256: COVERAGE_SHA256, snapshotDate: COVERAGE_PUBLICATION.snapshotDate, basis: COVERAGE_PUBLICATION.basis },
    capabilities: {
      google: 'none',
      drive: 'none',
      sheets: 'none',
      productionIngestion: 'disabled',
      productionMutation: 'disabled',
    },
    observationNonce,
    now: new Date().toISOString(),
  }, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
