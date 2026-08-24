# P1 Kickoff — Reproducible Baseline and Architecture Inventory

Paste the following into a fresh session after P0 is accepted and merged.

```text
Execute P1 — Reproducible baseline and architecture inventory — only for
whitefishscholarship/program_code.

AUTHORITATIVE READ ORDER
1. AGENTS.md
2. docs/SCHOLARSHIP_SYSTEM_BUILD_PLAN.md
3. docs/BUILD_STATE.json
4. docs/CURRENT_HANDOFF.md
5. docs/evidence/P0.md
6. docs/kickoffs/P1-BASELINE.md
7. Existing ingestion, audit, API, UI, test, CI, and deployment code

PIN STATE BEFORE EDITING
- Discover the repository root and verify the origin remote.
- Fetch origin and record the current `origin/main` commit. This current verified
  `origin/main` commit is the only permitted P1 branch baseline.
- Verify the P0 accepted marker, evidence, candidate manifest, and independent-review
  record are present on that commit.
- Verify plan revision 1 or read any accepted amendment before proceeding.
- Testing spreadsheet ID:
  1Dp5AMnrfSQ-Xf-r03S75lKsGPJk7o0inOgvC9Q6lOl4
- Authorized data access: read-only, bounded reads of the testing spreadsheet.
- Production spreadsheet is unset and all production mutation is forbidden.

If the sheet has changed since P0, record its current revision and a drift comparison.
Do not force current data to match the 2026-08-23 planning observation. If
`origin/main` advanced beyond the commit that delivered P0, stop until every intervening
change is reconciled with the plan and independently reviewed; never branch P1 from the
older P0 merge while silently ignoring newer `origin/main` history.

OBJECTIVE
Create a reproducible, sanitized, read-only baseline that accounts for every
current Master Database record, CellData hyperlink, URL role, source architecture,
shared source, and explicit unknown. Map the repository paths that ingest, audit,
serve, display, test, build, and deploy scholarship data.

ENTRY PREREQUISITES
- P0 status is accepted in BUILD_STATE.json.
- P0 documentation is present on origin/main.
- The testing spreadsheet is readable.
- No production spreadsheet is configured or authorized.

IN SCOPE
- Bounded metadata and CellData reads from the testing spreadsheet.
- Read-only public link/source inspection needed to classify architecture.
- Sanitized inventory tooling, fixtures, reports, tests, and P1 evidence.
- Reconciliation against the planning observations in plan section 3.
- Documentation of changed counts as source drift rather than automatic failure.

OUT OF SCOPE
- Any spreadsheet write.
- Correcting, archiving, merging, or adding scholarships.
- P2 schema implementation.
- Rewriting acquisition, audit, API, or UI behavior.
- Production configuration, deployment, form submission, or applicant data.

REQUIRED INVENTORY OUTPUT
- Snapshot timestamp and available spreadsheet revision metadata.
- Total populated records and counts by current Portal/Scholarship label.
- Every information and application CellData hyperlink, including labeled links.
- URL occurrence count, distinct URL count, host counts, and shared-URL groups.
- Rows with no URL and their explicit application method.
- Exactly one architecture classification per row/source, including unknown.
- Query parameters and fragments that may carry source identity.
- Repository behavior map with file/line evidence.
- Sanitization statement proving no applicant PII, credentials, private service
  account material, or non-student review columns were committed.
- Re-run stability/reconciliation result.

ACCEPTANCE TESTS
- Every populated Master Database row in the pinned snapshot is accounted for.
- Every information/application CellData hyperlink is accounted for.
- No record is silently dropped; unknown is an explicit classification.
- Re-running against the same captured input produces the same identities/counts.
- Differences from the earlier observation of 197 rows and 213 distinct URLs are
  explained by current source/sheet drift or a corrected counting definition.
- `npm ci`, `npm run plan:check`, `npm run typecheck`, `npm test`,
  `npm run build`, and `git diff --check` pass.
- A fresh-context read-only reviewer that did not author/edit P1 reproduces key
  counts and reports no unresolved critical/high finding.

INDEPENDENT REVIEW
- Commit the complete P1 candidate before review without the new P1 manifest/review
  record. Freeze a manifest that records that candidate commit and the current verified
  `origin/main` baseline, covers their complete Git change set, and hashes candidate-tree
  blobs.
- Use a fresh-context, read-only reviewer that did not author or edit P1.
- Bind the review record to the candidate-manifest SHA-256.
- The implementation agent repairs findings; the reviewer performs the recheck.
- Critical/high findings block P1 acceptance.
- Add only the accepted P1 manifest and review record in a following direct-child
  attestation commit; its diff must contain exactly those paths. Preserve P0's manifest
  and review blobs byte-for-byte. Disposition every medium/low finding with rationale,
  owner, and target.
- Treat P0's first valid attestation as canonical; never delete/re-add or rebind it.
  Keep the P1 attestation as the branch tip until delivery.

EVIDENCE
Update docs/evidence/P1.md, BUILD_STATE.json, CURRENT_HANDOFF.md, DECISIONS.md if
needed, and create the exact P2 kickoff. Record commands, results, source revision,
counts, failures, candidate revision, review result, PR, and merge.

AUTONOMOUS GIT DELIVERY — NO GIT QUESTIONS TO KELSEY
Follow AGENTS.md. Preserve dirty work with an isolated worktree, use a P1 codex/
branch, and commit only P1-owned changes locally. Before push, PR, or merge, inspect
downstream effects. Proceed only if BUILD_STATE contains direct, informed P1 authority
with evidence for every Vercel Preview/Production deployment effect or a verified
deployment-suppression mechanism covers the action. Then push, open/update the PR,
monitor checks, and merge after the P1 gate passes. Never force-push, discard user work,
rewrite history, or bypass checks. Report a verified external auth/permission or
release-authority outage only; do not ask Git preference questions.

STOP CONDITIONS
- Stop if P0's accepted marker, evidence, manifest, and independent-review record
  are not all present on `origin/main`.
- Stop if `origin/main` contains an unreviewed plan/state divergence, if the plan
  revision does not match the accepted P0 record, if it advanced beyond the reconciled
  P0 delivery commit, or if another stage is in flight.
- Treat changed source or sheet content as observed data drift to record, not as
  authority to rewrite the plan. Repository/plan authority drift is a blocker.
- Stop and record an external blocker if the testing spreadsheet cannot be accessed
  read-only after bounded retries.
- Stop before any spreadsheet write, production configuration, deployment change,
  form submission, or work outside P1.

Do not start P2 in this session.
```
