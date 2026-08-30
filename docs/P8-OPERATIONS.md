# P8 Monitoring Operations and Recovery

## Operating boundary

P8 provides local, read-only monitoring and review-queue tooling. No live schedule is
configured or enabled. The committed schedule plan is deliberately disabled, sends no
external notification, and changes no deployment configuration. Spreadsheet writes,
accepted-fact mutation, production access, and P9 execution remain prohibited.

The deterministic evidence uses the accepted 197-row testing-sheet compatibility
fixture derived from reconciled testing-sheet revision `223`. It does not claim a fresh
live sheet read or current public-source observation.

## Local dry run

From `web/`:

```bash
npm run p8:monitor:check
npm run p8:test
```

`p8:monitor:check` verifies the committed receipts byte-for-byte. It performs no
network request and no external write. `p8:monitor` regenerates the same deterministic
local artifacts for development before a candidate is frozen.

## Modes

- `dry_run` classifies changes and emits an immutable receipt, local review queue, and
  artifact-only notification summary. It publishes nothing.
- `apply_review_queue` can publish only a complete local review queue after every
  target is accounted for. It cannot publish accepted facts or write a spreadsheet.
- A failed or partial run publishes neither accepted state nor a review queue.

Ambiguous outcomes—including timeouts, bot blocks, redirects, date conflicts, and
portal changes—remain review items. A 404 supports only a dead-link observation at one
time; it does not archive an award or prove closure.

## Rate, retry, and freshness policy

- At most 250 targets are admitted to one run; the accepted denominator is 197.
- Requests are planned at least 100 milliseconds apart.
- A target receives at most three attempts with deterministic 250 and 500 millisecond
  backoff delays, capped at 1,000 milliseconds.
- Active-cycle checks are due daily, upcoming-cycle checks every three days,
  unknown-cycle and portal checks every seven days, and inactive-cycle checks every 30
  days. Future-dated evidence never passes freshness.

These policies are tested locally. They do not create a timer, scheduled task, webhook,
email integration, or deployment setting.

## Recovery procedure

1. Stop publication when a run is interrupted or its receipt digest fails.
2. Preserve the immutable interrupted receipt and its exact `nextCursor`.
3. Verify that the resumed run binds the same input digest and target denominator.
4. Resume exactly at the recorded cursor; never restart by silently discarding the
   already processed prefix.
5. Reconcile the combined target identities. Completion requires the full denominator,
   zero duplicates, and zero lost targets.
6. Keep the last accepted receipt unchanged. A recovered monitoring run may produce a
   review queue, but it cannot change accepted scholarship facts.

The committed partial-run simulation stops after 73 of 197 targets and resumes the
remaining 124. Reconciliation accounts for all 197 targets exactly once and restores
the same last accepted receipt digest.

## Operator review and reporting

Review `docs/evidence/P8-report.json` first, then the two dry-run receipts, failure
simulations, recovery record, privacy result, and disabled schedule plan. Notifications
are artifact-only counts; no provider, student, or administrator is contacted.

Before any future live schedule or external notification is enabled, obtain separate
direct authority and a governed deployment-configuration change. Before P9, verify all
P0-P8 acceptance and delivery on live `origin/main`, obtain the production spreadsheet
identity and explicit production-migration authority, and follow the P9 kickoff.

