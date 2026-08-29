# P5 Testing-Sheet Write Authorization

Authorization ID: `P5-testing-sheet-write-2026-08-27`
Authorized by: Kelsey Stuart
Authorized at: `2026-08-27T05:41:04Z`
Testing spreadsheet: `1Dp5AMnrfSQ-Xf-r03S75lKsGPJk7o0inOgvC9Q6lOl4`
Authorized tab: `Master Database`

## Direct informed authority

After Codex reported that P5 could not start without direct authority and explicitly
listed revision fingerprint capture, reversible backup creation, and approved
idempotent writes limited to the named testing sheet's `Master Database` tab, Kelsey
replied: "I give the permissions you have listed."

This direct response authorizes P5 to:

- capture and record the current testing spreadsheet revision fingerprint;
- create and verify a complete reversible backup before any testing-sheet content
  mutation; and
- after the remaining P5 gates pass, apply only evidence-bound, approved, idempotent
  changes to the testing spreadsheet's `Master Database` tab and verify exact
  post-write reconciliation.

## Boundaries retained

This authority does not cover the production spreadsheet, P6, coverage expansion,
public API or UI changes, deployment-configuration or schedule changes, forms or
application interactions, applicant data, access-control bypass, paid or destructive
actions, provider contact, force-push, published-history rewrite, or acceptance-gate
weakening.

The testing sheet must remain unchanged until its exact pre-write revision fingerprint
and complete reversible backup have both been captured and independently verified.
Every applied change must equal an approved proposal and be recoverable through the
backup or inverse change receipt.
