# P0 Delivery Authorization

Date received: 2026-08-23 (America/Denver)

Source: Kelsey Stuart, in the Codex task that produced the P0 candidate. The platform
did not expose a stable message identifier or exact message timestamp to the repository.

## Authorization

Kelsey provided this explicit authorization after being informed that Git delivery can
trigger Vercel deployments:

> I authorize Codex to push P0 commit `07a6e14`, create the PR, and merge it to
> `main`, understanding that this may trigger Vercel Preview and Production
> deployments. This does not authorize any spreadsheet writes or product behavior
> changes.

Kelsey also explicitly authorized independent adversarial review regardless of the
existing documentation. That instruction strengthens the review permission; it does not
waive the repository's independent-review or acceptance gates.

## Enforced scope

- Authorized: push exact P0 commit `07a6e14`, create its PR, merge it to `main`, and
  allow the resulting Vercel Preview and Production deployments.
- Authorized: independent, read-only adversarial review of the refreshed P0 candidate.
- Not authorized by this message: pushing the later validator/authorization amendment,
  updating the PR with that amendment, or merging a final candidate that differs from
  `07a6e14`. Those actions require a new informed instruction.
- Not authorized: scholarship-sheet writes, production-sheet configuration, product
  behavior changes, form submissions, provider contact, or unrelated external effects.

## Complete amended-candidate authorization

After the validator/history remediation was committed as `24a368d`, Kelsey provided
this additional informed authorization:

> I authorize Codex to deliver the P0 branch containing commits `07a6e14` and
> `24a368d`, plus one documentation-only commit recording this authorization and one
> attestation-only commit containing the final manifest and independent review record.
> I authorize pushing the branch, creating/updating its PR, merging to `main`, and
> resulting Vercel Preview and Production deployments. This does not authorize
> spreadsheet writes, product behavior changes, deployment-configuration changes,
> form submissions, or provider contact.

This later authorization covers the complete bounded P0 delivery sequence and resolves
the amendment boundary above. It does not broaden any excluded action.
