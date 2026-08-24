# P1 Delivery Authorization

Date received: 2026-08-24 (America/Denver)

Source: Kelsey Stuart, in the Codex task that produced and verified the P1 candidate.
The platform did not expose a stable message identifier or exact message timestamp to
the repository.

## Exact P1 delivery authority

After being told that P1 delivery required separate informed authority covering the
repository's Vercel effects, Kelsey stated:

> I authorize delivery of P1 through commit `20476b8`, including pushing the branch,
> opening a pull request, merging it into `main`, and the resulting Vercel Preview and
> Production deployments.

That instruction authorizes the accepted P1 candidate
`92ee21095e959bd19ab641752308c0fd9b394b22` and its exact direct-child attestation
`20476b8384cfbda6aaa04a3da4b7f0a3fbd291e5`. It does not authorize a modified or
replacement P1 candidate or attestation.

## Plan Revision 2 authority

After being informed that Plan Revision 1 could not record the later delivery authority
without either appending after the attestation or rebinding it, Kelsey stated:

> I authorize a Plan Revision 2 governance amendment that preserves P1 commits
> `92ee210` and `20476b8` byte-for-byte and creates a reviewed delivery path for
> `20476b8`. I authorize the amendment's commits, independent review, push, pull
> request, merge, and resulting Vercel Preview and Production deployments. Afterward,
> I authorize delivery of P1 through `20476b8` using that path. This does not authorize
> spreadsheet writes, product changes, deployment-configuration changes, form
> submissions, or provider contact.

## Enforced scope

- Preserve the two named P1 commits and the P1 manifest/review blobs byte-for-byte.
- Permit one independently reviewed, hash-bound delivery integration whose first parent
  is the delivered Plan Revision 2 baseline and whose second parent is exact P1
  attestation `20476b8`.
- Permit the Plan Revision 2 and P1 delivery branches to be pushed, reviewed in pull
  requests, merged to `main`, and deployed by the existing Vercel Git integration.
- Do not write to either scholarship spreadsheet, change product behavior, alter
  deployment configuration, submit a form, enter an application workflow, or contact a
  scholarship provider.

