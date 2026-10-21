# Exact M1 setup changes for Kelsey's review

Status: **PROPOSAL ONLY — nothing applied.** M2, scholarship-source checks, email sends (including tests), schedules and activation remain off. All437 routes,12pilot pins and prior reviews remain unchanged. This package resolves the specification of the remaining setup changes; it does not mark M1 accepted or perform M4 operational proof.

## 1. Sender

| Setting | Exact proposed value |
| --- | --- |
| Resend team | `waypointfranchise` |
| From | `Whitefish Scholarships <scholarships@mail.waypointfranchise.com>` |
| To — sole recipient | `kelsey@waypointfranchise.com` |
| Reply-To | Omit; no receiving mailbox is being provisioned |
| Alert purpose | New opening/date/rule findings or actionable persistent checking/run failures; unchanged runs quiet |

The verified domain is `mail.waypointfranchise.com`, not the root domain. Resend permits sending from addresses on a verified domain; no new DNS or mailbox is proposed. This From address is a **chosen future sending identity**, not an observed existing mailbox. Replies may not be received. No sender, email template, automation, broadcast, contact or suppression-list change is being made. The recipient remains the address already selected twice by Kelsey.

## 2. Dedicated credential and storage

**Create a separate key after approval; keep the existing full-access Whitefish key unchanged.**

In the existing Resend team, open **API keys → Create API key**:

- Name: `whitefish-season-alerts`.
- Permission: **Sending access** (`sending_access`).
- Domain: **mail.waypointfranchise.com** only, existing domain ID `bfb1391e-08ca-4207-b13b-e0393865d929`.

Kelsey performs the credential creation and direct secret entry. Never paste its value into chat, Git, reports, logs, shell arguments, a local plaintext file or Vercel. The domain restriction limits sender-domain access; it does **not** limit recipients to Kelsey. Future reviewed sending code must enforce the one-recipient allowlist. The key is not a permission to contact anyone or send now.

In **whitefishscholarship/program_code → Settings → Environments**, prepare a new environment:

| Setting | Exact proposed value |
| --- | --- |
| Name | `scholarship-season-monitor` |
| Deployment branches/tags | **Selected branches and tags**, one **branch** rule: `main`; no tag rules |
| Required reviewer | `whitefishscholarship` (user266880911) |
| Prevent self-review | Off, so the sole account owner can approve a future manual setup job |
| Administrator bypass | Disabled |
| Environment secret | `SCHOLARSHIP_MONITOR_RESEND_API_KEY` = newly created domain-scoped key |
| Environment variable | `SCHOLARSHIP_MONITOR_ALERT_FROM` = exact From above |
| Environment variable | `SCHOLARSHIP_MONITOR_ALERT_TO` = `kelsey@waypointfranchise.com` |
| Environment variable | `SCHOLARSHIP_MONITOR_ENABLED` = `false` |
| Environment variable | `SCHOLARSHIP_MONITOR_EMAIL_ENABLED` = `false` |

If that environment or secret already exists at application time, inspect metadata and stop before overwriting an unknown binding. Keep all existing repository/org/environment secrets and Vercel variables unchanged. No new Vercel token, provider-wide token, GitHub personal token, DNS permission or paid service is needed by this proposal. Later state writing uses the existing workflow `GITHUB_TOKEN` under a separately reviewed job contract, not a new credential here.

The required reviewer is an initial credential-access safeguard because the saved main observation reports `protected=false`; it is not a claim that main is protected or that GitHub confines a token to one workflow or file. The Vercel deployment skill requires secret-bearing code to be reviewed on a protected branch or gated by a reviewer. No secret-consuming workflow is created in M1. Initial manual protection means later email jobs would wait for approval: unattended activation must separately settle effective main protection/access policy before any proposed removal of that reviewer. This package does **not** authorize its removal or a branch-protection change.

The two false flags are proposed settings only. They are **not an implemented kill switch** and must not be represented as one. M2 must implement and test enforcement under separate authority. Environment name/secret metadata can be verified without exposing its value; actual delivery is reserved for M4. Sending-only access must not later be expanded to full access merely to query account usage or reconcile an uncertain send.

## 3. Exact deployment-suppression draft

Future target: **web/vercel.json** in Vercel project `prj_LbefE2deji6nPND6iBiuofe7IABv`, team `team_6CAjRq58n0WvAH49otKSQbA7`, root `web`.

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "git": {
    "deploymentEnabled": {
      "codex/scholarship-monitor-state": false
    }
  }
}
```

Exact file bytes and unified patch are saved under `proposed/`. They are inactive documentation, **not** installed at `web/vercel.json`. No workflow, state branch, `state.json`, report state or schedule is added.

Only the exact monitor-state branch is excluded. Unspecified branches keep Vercel's normal deployment behavior. Vercel documents that a matching `true` rule overrides a matching `false` rule, so there must be no matching wildcard-enable rule in the effective configuration. Recheck project/root, alternate `vercel.ts`, any current config, effective settings and current main before application; merge with an intervening legitimate config rather than overwrite it. Suppression applies to automatic Git deployments, not manual/API/deploy-hook deployment requests.

Required order after separate release approval:

1. Freeze/review the exact config-only release and normal governance evidence from fresh main; preserve runtime bytes and all prior attestations.
2. Push/open PR under explicit branch/PR/CI/**Vercel Preview** authority. This branch is not suppressed by the state-branch exclusion.
3. Merge only with acceptance/checks and explicit **Vercel Production** authority; verify exact main/provider commit and unchanged site/publication behavior.
4. **Stop.** No state-ref creation follows from this configuration release. Only later M4 authority can create the first state ref, inheriting the exact reviewed main tree with suppression already present. Future state writes may change only `state.json` and `REPORT.md`, serialize writes, and reject stale heads; no code runs from the mutable state branch.
5. In M4, verify authenticated provider history for both first ref creation and later state writes. Absence of an application build alone is insufficient proof. If suppression is not provable, stop activation and return to the original explicit fallback-review route; do not silently change storage.

Do not use `vercel curl` or create protection-bypass tokens. Protected Preview health limits must be recorded under the original access policy, not bypassed. The existing site does not need the email credential in its Vercel environment.

## 4. What an approval would select

These are review choices, **all currently unselected**:

| Selection | Effect | Still excluded |
| --- | --- | --- |
| A — Design only | Accept these exact sender/key/storage/suppression specifications for subsequent governed M1 review | Every external change |
| B — Provisioning | Create only the dedicated Resend key and GitHub environment/secret/variables described above | Workflow implementation, tests that send, activation, release, state branch |
| C — Config release | Separate reviewed config release with push/PR/CI/Preview/merge/Production effects explicitly recorded in BUILD_STATE and authority evidence before delivery | Source reads, state-ref creation, emails, workflow activation |

Approving the design is not provisioning authority; provisioning is not release authority. A future direct selection can name multiple exact effects, but must preserve these exclusions. The current task authorizes **preparation only**. Nothing requests a general M2/M3/M4 mandate.

## 5. M1 closure and retained gates

Codex owns the concrete package and normal independent review; Kelsey reviews the proposed effects. M1 can be assessed for specification/setup-contract readiness after selection and its original acceptance prerequisites. Actual inbox receipt, provider suppression behavior, live extraction/timing, full sweep, state writing, pause/resume and scheduled operation remain M3/M4 proofs; no specification review substitutes for them. This package claims no full application test matrix PASS or canonical M1 acceptance.

Authoritative owners/triggers/actions are machine-readable in `contract.json` and `SESSION_CLOSE.md`. Historical IPC/build failures remain historical evidence; no dependency/config repair or repeated failed checks are selected.437 routes,12sample pins,397source holds/272quarantines/0cleared and original sourceFAIL remain; no facts/mappings accepted and noSD3.

## Sources and evidence

- Existing account/domain/key/allowance observations: immutable receipt `9b2ba0fad42e7127d0a57f9ff823152314abcdd7:docs/evidence/season-monitor-m1-public-resend/resend-observations.json` — saved point-in-time evidence, not refreshed account validity.
- [Resend verified domains](https://resend.com/docs/dashboard/domains/introduction).
- [Resend API key permissions](https://resend.com/docs/api-reference/api-keys/create-api-key) and [key domain restrictions](https://resend.com/docs/dashboard/api-keys/introduction).
- [GitHub environment access rules](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments) and [environment-secret storage](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets).
- [Vercel branch deployment configuration and precedence](https://vercel.com/docs/project-configuration/git-configuration).
- Applied guidance: [Vercel deployment skill](/Users/kelseystuart/.codex/plugins/cache/openai-curated-remote/vercel/0.54.1/skills/deployments-cicd/SKILL.md), section Required Environment Variables: secret-bearing workflows need reviewed code on a protected branch or a required reviewer. This informs the proposed credential-access control; it does not require applying it during preparation.
