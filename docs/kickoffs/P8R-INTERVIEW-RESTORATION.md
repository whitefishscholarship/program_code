# P8R Kickoff — Student Interview and Matching Restoration

Use this kickoff only in a fresh session after Plan Revision 8 is independently
accepted, direct-child attested, merged, and verified on live `origin/main`.

```text
Execute P8R — Student interview and matching restoration — only for
whitefishscholarship/program_code.

AUTHORITATIVE READ ORDER
1. AGENTS.md
2. docs/SCHOLARSHIP_SYSTEM_BUILD_PLAN.md
3. docs/BUILD_STATE.json
4. docs/CURRENT_HANDOFF.md
5. docs/evidence/P8.md
6. docs/evidence/P8-manifest.json
7. docs/reviews/P8.json
8. docs/evidence/PLAN-REV8.md
9. docs/evidence/PLAN-REV8-manifest.json
10. docs/reviews/PLAN-REV8.json
11. docs/kickoffs/P8R-INTERVIEW-RESTORATION.md

STATE TO PIN BEFORE EDITING
- Fetch live origin/main and prove exact accepted P8 and Revision 8 direct-child
  attestations are present.
- Verify P8R is the sole next-permitted planned stage and P9 remains planned/unstarted.
- Inventory the current homepage, canonical catalog/API, cards, filters, sorting, export,
  admin compatibility, legacy interview components, and legacy processor.
- Commit the complete P8R test matrix before product implementation.

OBJECTIVE
Restore an accessible guided interview as the primary student path, filter the accepted
canonical public award catalog conservatively, and present transparent matching results
on the website without storing or transmitting interview answers.

IN SCOPE
- Interview-first entry with an explicit browse-all alternative.
- Validated typed answers held only in volatile component/browser memory.
- A deterministic typed matcher over the current canonical public award model.
- Match, possible-match, and known-conflict decisions with visible reasons.
- Current result cards, filters, sort, application methods, cycle state, official links,
  and matched CSV export.
- Edit, back, reset, empty, and error recovery; keyboard/focus and screen-reader status.
- Unit/adversarial fixtures and browser evidence at 360x800, 768x1024, and 1440x900.

MATCHING SAFETY RULE
A student answer may hard-exclude only when a typed accepted public fact proves a
conflict. Never infer a hard gate from a substring, default Montana assumption, missing
data, or ambiguous/free-text residence, identity, health, hardship, affiliation,
renewal, deadline, or application text. Unknown remains a possible match with a visible
verification reason. Do not use the legacy heuristic processor as matching truth.

PRIVACY RULE
Never place an interview answer in sessionStorage, localStorage, cookies, IndexedDB,
request bodies, URLs, logs, analytics, fixtures, screenshots/evidence, or Git. Reset on
reload/navigation as designed; prove stale answers cannot be reused.

OUT OF SCOPE
- Any scholarship spreadsheet read or write.
- Production source/configuration work, P9, or P9 identity pins.
- Monitoring activation or schedule changes.
- Scholarship fact mutation, forms/applications, applicant-data collection, answer
  telemetry, provider contact, paid/destructive actions, history rewrite, or scope
  expansion.
- Deployment-configuration or dependency changes unless a separately reviewed plan
  amendment authorizes them.

ACCEPTANCE TESTS
- Run `npm ci` from `web/` before the required validation matrix.
- Precommitted matrix covers required/optional answers, edit/reset, every supported hard
  gate, unknown preservation, conflict reasons, deterministic ranking, empty/error,
  browse-all, filtering/sorting, official links, and matched export.
- Regression tests reject Non-Renewing substring classification, year-2001 deadline
  fallback, default-Montana exclusion, free-text identity/health hard gates, stale answer
  reuse, and every answer persistence/transmission channel.
- Reconcile exact accepted P7 catalog counts and relationships and preserve API/schema,
  privacy allow-list, browse-all/admin/export compatibility.
- Run plan check, typecheck, complete tests, production build, audits, whitespace, and
  all declared browser cells.
- Fresh-context independent review has C0/H0; disposition every medium/low finding.

INDEPENDENT REVIEW
- Freeze the exact candidate, generate the complete baseline-to-candidate manifest, and
  obtain a read-only fresh-context review from an agent that did not author or edit P8R.
- Add only the accepted manifest and review in the direct-child attestation commit.

AUTONOMOUS GIT DELIVERY — NO GIT QUESTIONS TO KELSEY
- Follow AGENTS.md and the exact recorded P8R delivery authority. Never force-push,
  rewrite history, bypass checks, or broaden external access.

STOP CONDITIONS
- P8 or Plan Revision 8 is not exactly accepted and delivered on live origin/main.
- P8R is not the sole next-permitted stage, or P9 has started.
- Any answer could be stored, transmitted, logged, or exposed in evidence.
- Matching would hard-exclude from missing, ambiguous, defaulted, or free-text facts.
- Work requires spreadsheet access/write, deployment configuration, a schedule change,
  applicant data, form interaction, provider contact, or scope expansion.

ROLLBACK
Deploy the last accepted P8 application revision. Do not change any spreadsheet,
accepted scholarship fact, P8 schedule, production configuration, or P9 state.

END-OF-STAGE OUTPUT
One PASS/BLOCKED/FAIL status, exact verification and browser evidence, privacy proof,
review, manifest/attestation, PR/merge/deployment observations, and unresolved unknowns.
```
