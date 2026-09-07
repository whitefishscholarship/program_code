# P8M acceptance and delivery resume

Use this only to finish P8M. Read `AGENTS.md`, the canonical plan,
`docs/BUILD_STATE.json`, the top P8M section of `docs/CURRENT_HANDOFF.md`, and
`docs/evidence/P8M.md` in that order. Continue from branch `codex/p8m-acceptance` and
baseline `55245dc42a726d57ef3bdbeeab7aa27fcce31d17`.

Before changing or attesting anything, securely restore GitHub authentication through
the browser or keychain; never request, paste, echo, or store a token. Fetch and verify
that `origin/main` still equals the recorded baseline. If it differs, stop and perform
a governed baseline reconciliation before re-freezing the candidate.

Resolve the recorded acceptance-sequencing gate before creating an attestation. The
current candidate is intentionally `verified`, not accepted. The active safety gate
refused a prospective accepted-state edit before attestation and requires fresh,
informed user approval after the risk disclosure in `docs/CURRENT_HANDOFF.md`, or a
materially safer governed plan correction. Do not bypass that refusal and do not attest
the verified candidate as accepted.

Run the P8M acceptance checks and full repository matrix. Freeze the complete candidate,
generate the exact baseline-to-candidate manifest, and obtain a fresh-context read-only
review from a non-author. Remediate any critical/high finding; disposition every
medium/low finding; re-freeze and have the same reviewer recheck changed bytes. Only a
C0/H0 result may be recorded. After the acceptance-sequencing gate is validly resolved,
regenerate the accepted-state candidate and final manifest, recheck both, and create
the direct-child commit that changes exactly `docs/evidence/P8M-manifest.json` and
`docs/reviews/P8M.json`.

Push the exact attestation tip, open the authorized P8M pull request, monitor required
checks and Preview, merge using repository convention, verify the resulting Production
deployment and direct application smoke, and confirm live `origin/main` contains the
canonical attestation. Do not append another commit to an undelivered attestation.

No spreadsheet write, other-tab access, new official-source read, form/application
interaction, provider contact, configuration change, P8F, or P9 is authorized. P8F is
not permitted until P8M is attested, merged, and reverified on live `origin/main`.
