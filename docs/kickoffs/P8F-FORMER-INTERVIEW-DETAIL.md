# P8F Kickoff — Former Interview Detail and Routing Restoration

Use this kickoff only in a fresh session after Plan Revision 9 is independently
accepted, direct-child attested, merged, and verified on live `origin/main`.

```text
Execute P8F — Former interview detail and routing restoration — only for
whitefishscholarship/program_code.

AUTHORITATIVE READ ORDER
1. AGENTS.md
2. docs/SCHOLARSHIP_SYSTEM_BUILD_PLAN.md
3. docs/BUILD_STATE.json
4. docs/CURRENT_HANDOFF.md
5. docs/evidence/P8R.md
6. docs/evidence/P8R-manifest.json
7. docs/reviews/P8R.json
8. docs/evidence/PLAN-REV9.md
9. docs/evidence/PLAN-REV9-manifest.json
10. docs/reviews/PLAN-REV9.json
11. docs/evidence/PLAN-REV9-interview-inventory.md
12. docs/kickoffs/P8F-FORMER-INTERVIEW-DETAIL.md

STATE TO PIN BEFORE EDITING
- Fetch live origin/main and prove exact accepted P8R and Revision 9 direct-child
  attestations are present.
- Verify P8F is the sole next-permitted planned stage and P9 remains planned/unstarted.
- Reverify historical commit 4c20637a351d272788e24ac9d02e541494644832 and every
  pinned blob in the Revision 9 inventory. Repeat the complete-history anchor searches;
  stop on unexplained drift.
- Inventory the accepted P8R interview/matcher, canonical P7 catalog/cards/filter/sort/
  export, API allow-lists, admin compatibility, and privacy tests.
- Commit the complete P8F test matrix and exact old-ID-to-new-control/rule map before
  changing any product code.

OBJECTIVE
Restore the complete former displayed interview detail and its intended search process
inside the accepted P7/P8R product, using only conservative award-bound accepted facts
for eligibility decisions and keeping every answer in volatile browser memory.

IN SCOPE
- The six former Academic Background questions; four activity/responsibility answers;
  conditional volunteer-hours question; financial-need answer; and all 38 historically
  displayed special-criteria IDs, with accessible wording and exact migration mapping.
- The earlier active standalone `organization_affiliations` question is history, not an
  extra final control. Map its six values exactly to the final affiliation IDs and prove
  the restored UI does not duplicate the affiliation questions.
- One ADHD control with its historical meaning. Do not invent a separate ADD question;
  complete reachable history contains none.
- Explicit optional/prefer-not-to-answer handling for sensitive traits. Nonselection is
  not a negative fact.
- Typed, deterministic answer-to-award rules with visible match, possible-match, and
  known-conflict reasons.
- On-page matched results that retain accepted cards, counts, relationships, filters,
  sorting, application methods, cycle status, official links, browse-all, and visible-
  result CSV export.
- Edit, back, reset, reload, empty, error, keyboard/focus, and screen-reader states.
- Unit/adversarial/privacy/export/API/browser evidence at 360x800, 768x1024, and
  1440x900.

QUESTION AND MATCHING RULES
- Restore displayed former questions only. SAT, ACT, FAFSA, skills, creative skills,
  background_optional, constraints, and career_interests were type-only fields and may
  not be presented as recovered former questions.
- Every control must map to one of: accepted-fact eligibility decision, accepted-fact
  rank-only preference, or explicit no-current-effect. Never ask a sensitive question
  without explaining its optional nature and current effect.
- A hard conflict requires an award-bound field-specific accepted public fact and an
  explicit contradictory typed answer. Missing, ambiguous, free-text-only, manual-
  review, provenance-free, unanswered, and prefer-not-to-answer evidence stays possible.
- Positive sensitive selections may influence a result only through exact accepted
  authority. Omission/nonselection never excludes.
- Do not import, reconnect, copy, or disguise the legacy processor/rules pack as
  matching truth. Implement the Revision 9 disposition table exactly and test every
  retained, safely replaced, and retired rule.
- Retire the earlier organization-regex hard gate and `New for 2026!`/`is_new` +5
  boost. Neither may affect eligibility, decision tier, or order.
- Use deterministic reason-coded tiers and explicit current sort/award-ID tie-breakers;
  do not restore legacy points.

PRIVACY RULE
Answers and detailed result decisions remain only in volatile React/browser memory.
Never place answers, decisions, or matched-row payloads in sessionStorage,
localStorage, cookies, IndexedDB, request bodies, URLs/history, logs, analytics,
screenshots/evidence, exports, fixtures with real student data, or Git. Reset and reload
must clear them.

OUT OF SCOPE
- Any scholarship spreadsheet read or write, fact mutation, public-source acquisition,
  production source/configuration work, P9, or P9 identity pins.
- Monitoring activation or schedule/deployment-configuration changes.
- Forms/applications, applicant-data collection, answer telemetry, provider contact,
  paid/destructive actions, dependency changes not strictly required for P8F, history
  rewrite, gate weakening, or broader scope.

ACCEPTANCE TESTS
- Run npm ci from web/ before the required matrix.
- Precommitted tests account for every historical displayed ID, label, answer option,
  conditional, configuration migration, type-only exclusion, rule disposition, and
  result/export route. The
  counts must reconcile to 6 academic prompts, 4 activity checkboxes, 1 conditional
  volunteer question, 1 financial-need checkbox, and 38 special criteria.
- Reconcile the earlier standalone affiliation question's six values to the six final
  IDs and prove that only the final controls render.
- Prove ADD is not a distinct question and one ADHD control retains the historical
  identifier/meaning.
- Exercise every accepted-fact gate, positive sensitive criterion, optional/unanswered
  state, contradictory fact, unknown preservation, deterministic order, edit/reset,
  and current filter/sort/export route.
- Reject default Montana, Non-Renewing substring, year-2001 deadline, free-text identity/
  health/affiliation gates, arbitrary amount/portal/criterion points, legacy processor
  imports, matched-row storage, stale answers, and every persistence/transmission path.
- Reconcile exact accepted P7/P8R catalog counts and relationships and preserve API,
  public allow-list, browse-all, admin, official-link, and CSV safety.
- Run plan check, typecheck, complete tests, exact production build, both audits,
  whitespace, and all declared browser cells.
- Fresh-context independent review has C0/H0; disposition every medium/low finding.

INDEPENDENT REVIEW
- Freeze the exact candidate, generate the complete baseline-to-candidate manifest, and
  obtain read-only fresh-context review from an agent that did not author or edit P8F.
- Remediation remains with the implementation agent; the reviewer rechecks final bytes.
- Add only the accepted manifest and review in the direct-child attestation commit.

AUTONOMOUS GIT DELIVERY — NO GIT QUESTIONS TO KELSEY
- Follow AGENTS.md and the exact P8F delivery authority. Never force-push, rewrite
  history, bypass checks, broaden external access, or append after attestation.

STOP CONDITIONS
- P8R or Plan Revision 9 is not exactly accepted and delivered on live origin/main.
- P8F is not the sole next-permitted stage, P9 has started, or history/pinned blobs drift.
- A detailed answer could be stored/transmitted or a result could exclude/rank from an
  unaccepted, missing, ambiguous, free-text, or non-answer state.
- The implementation would lose accepted P7/P8R cards, counts, relationships, filters,
  sort, export, privacy, admin/API behavior, or visible reasons.
- Work requires a spreadsheet/source read, fact mutation, P9, deployment configuration,
  schedule change, applicant data, form interaction, provider contact, or scope expansion.

ROLLBACK
Deploy the accepted P8R application revision. Do not change any spreadsheet, accepted
scholarship fact, P8 schedule, production configuration, or P9 state.

END-OF-STAGE OUTPUT
One PASS/BLOCKED/FAIL status; exact inventory/rule reconciliation; verification and
browser evidence; privacy proof; review; manifest/attestation; PR/merge/deployment
observations; and every remaining unknown.
```
