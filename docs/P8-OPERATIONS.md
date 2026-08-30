# P8 Monitoring Operations and Recovery

## Operating boundary

P8 provides bounded read-only monitoring and local review-queue tooling. It does not
configure or enable a schedule, send an external notification, mutate accepted facts,
write a spreadsheet, access the production spreadsheet, interact with an application,
or begin P9.

The accepted monitoring plan keeps the architecture separate. Its 1,028 targets are
217 P7 source records, 213 P5 source routes, 192 awards, 192 cycles, 21 portals, four
application groups, 187 P5 review items, and two P6 review items. Of the 213 source
routes, exactly 50 are eligible for bounded public read-only GET requests and 163 are
manual-review no-fetch routes. Embedded application URLs are never probe routes.

## Offline verification

From `web/`:

```bash
npm run p8:monitor:check
npm run p8:test
```

`p8:monitor:check` regenerates the accepted-revision fixture observations in memory and
verifies the committed evidence byte-for-byte. It makes no network request or external
write. `p8:monitor` rewrites those deterministic local evidence artifacts before a
candidate is frozen.

The evidence fixtures execute the same adapter, retry, spacing, freshness,
classification, receipt-chain, finalization, and review-upsert paths used by the guarded
driver. They prove control behavior, not current scholarship facts.

## Guarded read-only driver

P8 includes a future operator command but does not schedule or execute it automatically:

```bash
P8_RECEIPT_DIRECTORY=/operator/chosen/p8-receipts \
P8_RECEIPT_INTEGRITY_KEY=<hex-encoded-key-of-at-least-32-bytes> \
npm run p8:monitor:live-dry-run
```

The driver accepts only explicit dry-run mode, fetches only the 50 accepted public
read-only source routes, follows at most five validated public redirects, limits each
response to 2 MB, times out after 20 seconds, and writes only authenticated local run
receipts. The integrity key is required at runtime and is never printed or committed.
The other 978 targets use pinned snapshot or no-fetch observations. Completion reports
review items but publishes no queue or accepted state.

No live invocation was performed for P8 acceptance. A live invocation would establish
only time-bounded URL observations, not automatically accepted scholarship changes.

## Retry, spacing, and freshness

- Each authenticated segment contains at most 250 targets; all five segments must
  reconcile before a 1,028-target run can finalize.
- Every public request executes a 100 ms spacing delay.
- A failed probe receives at most three attempts with executed 250 ms and 500 ms
  backoff delays.
- Public-source, award, cycle, portal, and open-review observations use seven-day
  freshness windows; manual/offline source and application-group snapshots use 30 days.
- Invalid, stale, or future-dated observations enter review and cannot become accepted
  facts.

A 404/410 is a dead-link review observation, not proof an award closed. Timeouts, bot
blocks, redirects, date conflicts, portal changes, and generic fingerprint changes all
remain explicit review work.

## Receipt and recovery procedure

Each segment is stored append-only and bound with both a SHA-256 content identity and
an HMAC-SHA-256 authentication tag. Each receipt binds the plan, testing-sheet revision,
run ID, mode, exact cursor range, complete result set, review items, and prior receipt.

1. Stop publication after any interruption, authentication failure, cursor mismatch,
   plan mismatch, or source-revision mismatch.
2. Preserve the last authenticated receipt digest and runtime integrity key.
3. Resume with the same run ID, mode, plan digest, testing-sheet revision, prior digest,
   and exact `nextCursor`.
4. Authenticate and reconcile the full chain from cursor zero through target 1,028.
5. Require 1,028 unique results, zero duplicates, zero lost targets, and an end receipt.
6. Finalize the whole ledger before review-queue publication is possible.
7. Upsert review work by stable target/disposition/observation identity. Repeated logical
   work increments its occurrence count instead of creating a duplicate.

The committed recovery evidence interrupts after the first 250 targets with a review
item in the prefix. The suffix cannot publish alone. Whole-ledger finalization retains
that prefix item, and a repeated full apply keeps one stable review ID.

`apply_review_queue` may publish only a complete authenticated local review queue. It
cannot publish or mutate accepted scholarship facts and cannot write a spreadsheet.

## Further authority

The committed schedule plan remains `enabled: false` and
`activationAuthorized: false`. Enabling a schedule, configuring external notification,
or changing deployment configuration requires separate direct authority and a governed
change. P9 additionally requires P8 delivery on live `origin/main`, production
spreadsheet identity, explicit production-migration authority, a verified backup, and
the remaining P9 prerequisites.
