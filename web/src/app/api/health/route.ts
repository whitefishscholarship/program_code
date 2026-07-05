import { NextResponse } from 'next/server';

// Build/version stamp. A push to `main` auto-deploys, but production had no way to report
// WHICH commit it was running, so "did my change actually deploy?" could only be inferred
// from side effects. This endpoint answers it directly: curl /api/health -> the live commit
// SHA. Vercel injects VERCEL_GIT_COMMIT_SHA (and friends) at build+runtime.
//
// Public + never cached, so it always reflects the current deployment. No secrets exposed.
export const dynamic = 'force-dynamic';

export function GET() {
  const sha = process.env.VERCEL_GIT_COMMIT_SHA ?? 'local-dev';
  return NextResponse.json({
    ok: true,
    commit: sha,
    commitShort: sha.slice(0, 7),
    ref: process.env.VERCEL_GIT_COMMIT_REF ?? null,
    message: process.env.VERCEL_GIT_COMMIT_MESSAGE ?? null,
    deploymentId: process.env.VERCEL_DEPLOYMENT_ID ?? null,
    region: process.env.VERCEL_REGION ?? null,
    env: process.env.VERCEL_ENV ?? 'local',
    now: new Date().toISOString(),
  });
}
