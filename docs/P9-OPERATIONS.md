# P9 Production Operations

The application reads only the bundled publication
`web/fixtures/p8m/matching-facts-v1.json` at SHA-256
`16db9f32a14c7b63d2a912a84c43ac973ae43a07d7c40841174d6fbdfd5a6b07`.
The Production runtime has no Google, Drive, or Sheets client, credential, scope,
ingestion path, or mutation path. The organizer spreadsheet is an offline human
authoring surface, not part of the deployed architecture.

## Verify Production

Request `/api/health?nonce=<32-128 lowercase hex characters>` on
`web-two-gules-45.vercel.app`. Require the same nonce, the expected Git SHA and Vercel
deployment ID, the publication digest above, `env: production`, and all three provider
capabilities set to `none`. Then verify `/api/scholarships`, the home page, Browse all,
CSV export, and the private interview.

## Roll back safely

Use only a Ready deployment whose health response already proves the same publication
digest and zero Google/Drive/Sheets capability. Never roll back to a legacy deployment
or environment snapshot that contains `GOOGLE_SERVICE_ACCOUNT_CREDENTIALS` or runtime
spreadsheet capability. Assign the canonical domain to the verified prior deployment,
repeat the nonce-bound health and student smoke checks, then restore the intended Ready
deployment and repeat them once more.

Rollback owner and deployment owner: Kelsey Stuart.

## Update scholarship facts

Do not edit Production configuration or read a spreadsheet at runtime. A future update
requires a separately reviewed immutable publication with a new digest, followed by the
same build, Preview, Production, smoke, and safe-rollback sequence.
