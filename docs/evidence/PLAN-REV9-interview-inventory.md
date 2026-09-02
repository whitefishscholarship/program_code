# Plan Revision 9 Evidence — Former Interview Inventory

Date: 2026-09-01
History scope: all 197 commits reachable from every local Git ref at inspection time
Pinned active snapshot: `4c20637a351d272788e24ac9d02e541494644832`
Status: observed historical inventory; not implementation or accepted scholarship truth

## Evidence boundary

This inventory answers what the former interview displayed and how its last active
client-side route behaved. It does not approve the historical rules, prove that a
scholarship fact is current, or authorize product work before Plan Revision 9 is
accepted and delivered. Historical spreadsheet text and regex matches are not accepted
eligibility facts.

Observed facts are identified below. Planned dispositions are governance decisions for
P8F and remain unimplemented until that later stage. Live scholarship freshness and a
protected application-health smoke remain unknown.

## Last active configuration

- `f63e55051a08c143e005375fc82f2b1db63501ab` was the last commit that changed the
  detailed question configuration. Its parent `cb60490b...` still displayed the
  standalone six-option `passiveSignals.organization_affiliations` question originally
  introduced by `dda6e2ab8b54003191e8f79f72c9f9d5e3fd8de2`. The final change removed
  that standalone control, moved its concepts into the special-criteria accordion, and
  added `single_parent`, `agriculture_conservation`,
  `athletics_sports`, `first_responder`, and `company_employee` while preserving the
  already displayed criteria.
- `4c20637a351d272788e24ac9d02e541494644832` is the last commit whose homepage still
  invoked `InterviewWizard` and `processAndFilter`. Its direct child
  `a2567d6395c1a946b0a0df8f50a47a5372928a80` changed only
  `web/src/app/page.tsx` among the seven pinned interview files and removed the active
  interview/result/export route in favor of the P7 catalog page.
- The exact pinned blobs are:

| Path | Blob |
| --- | --- |
| `web/src/app/page.tsx` | `61343c9f4f785580bf4a1321a2163ec7c8f35436` |
| `web/src/components/InterviewWizard.tsx` | `a183940afeeabecda9b443835c6c1e1b98e0e1d5` |
| `web/src/components/steps/ActiveFactsStep.tsx` | `4442b1bc1c7b26bbebcca9fea1d2c9e5594c2241` |
| `web/src/components/steps/PassiveSignalsStep.tsx` | `b34a63d8847401a7943349d64167cbeabd37c7fa` |
| `web/src/types/wizard.ts` | `a90906ae295108811a5e4d8e35119cb6892be196` |
| `web/src/lib/processor.ts` | `436c84e31de39892b9ab5bcb1d518f749e127a89` |
| `web/src/lib/rulesPack.ts` | `f43df3539281637881106bdfd856efa5bd11004e` |

## Complete-history anchor result

The inspection used `git log --all --root --full-history` with pickaxe/regex searches
for `dyslexia`, `adhd`, standalone `add`, `first_generation`, `First-Generation`, and
`Attention-Deficit`, plus exact-tree `git grep` checks of every relevant UI/type/rule
path at the introduction, final configuration, last active route, and P8R commits.

- `dyslexia` first entered the web application in merge commit `dda6e2ab...` as one
  displayed criterion ID/label and one rule key. Later hits were rule changes, governed
  evidence/fixtures, or removal/restoration history; none created another Dyslexia
  question.
- `adhd` first entered in the same commit as exactly one displayed criterion:
  identifier `adhd`, label `ADHD`, tooltip `Diagnosed with Attention-Deficit/Hyperactivity
  Disorder.` The only historical matching key was also `adhd`.
- No commit contains a rendered `ADD` label, an `ADD`/`add` answer identifier, or a
  separate `Attention-Deficit Disorder` question. The standalone lowercase `add` hits
  in the relevant UI history are prose/comments such as `Add more granular step
  components as needed` and `add score points`.
- Therefore ADD was not a distinct question in the reachable history. The evidence
  supports one ADHD question whose tooltip spelled out ADHD; it does not support
  presenting ADD as a second answer.
- `first_generation` entered as one displayed criterion and one matching-rule key.
  `First-Generation College` was its sole displayed label.
- A second history path existed before the last-active configuration. At
  `dda6e2ab8b54003191e8f79f72c9f9d5e3fd8de2`, the second step displayed the
  standalone `passiveSignals.organization_affiliations` question with six answer
  options. Its processor normalized organization regex hits, hard-excluded a row when
  none of the selected affiliations matched, and added `+5` for the legacy
  `New for 2026!`/`is_new` field. Commit `f63e550...` removed the standalone field and
  migrated the six concepts into `special_criteria`, but still retained `is_new` and its
  +5 boost. Commit `c97f35a652cbf76c162635ff07554178c4575edd` later removed the
  `New for 2026!` normalization and boost before the pinned last-active route. These are
  former active display/rule paths even though they are absent from the last-active
  snapshot, so they remain inventoried and dispositioned.

The complete history search is bounded by the locally reachable 197-commit object graph.
A fresh authenticated GitHub API read and a later keyring-backed scoped-HTTPS normal
Git fetch both confirmed live `main` at
`f118b85dc0e10cc3841d172d2d4091f618454970`. The fetch left the all-ref graph at 197
commits. The initial SSH transport returned `Repository not found`; no claim is made
about objects outside the fetched repository refs.

## Displayed interview structure

The wizard had two steps, `Academic Background` and `Experience & Activities`, with
`Previous`, `Continue`, and final `Find Scholarships` navigation. Answers were held in
React state while the wizard ran. Required asterisks were displayed for GPA, residence,
educational status, and target school type, but the wizard itself had no validation gate
before advancing or submitting.

### Step 1 — Academic Background

| Displayed prompt | Identifier | Control and answer options | Historical use |
| --- | --- | --- | --- |
| Unweighted GPA * | `activeFacts.gpa` | number; step `0.01`; min `0`; max `4.0`; empty -> `null` | hard GPA filter |
| State of Residence * | `activeFacts.state` | empty `Select a state...`; Alabama, Alaska, Arizona, Arkansas, California, Colorado, Connecticut, Delaware, Florida, Georgia, Hawaii, Idaho, Illinois, Indiana, Iowa, Kansas, Kentucky, Louisiana, Maine, Maryland, Massachusetts, Michigan, Minnesota, Mississippi, Missouri, Montana, Nebraska, Nevada, New Hampshire, New Jersey, New Mexico, New York, North Carolina, North Dakota, Ohio, Oklahoma, Oregon, Pennsylvania, Rhode Island, South Carolina, South Dakota, Tennessee, Texas, Utah, Vermont, Virginia, Washington, West Virginia, Wisconsin, Wyoming, Other | hard state/default-Montana heuristic |
| Current Educational Status * | `activeFacts.educational_status` | empty `Select status...`; `High school senior`; `Homeschool senior`; `Current college student`; `Gap year`; `GED`; `Other` | displayed but unused by processor |
| Target School Type (Select all that apply) * | `activeFacts.target_school_types` | `Two year`; `Four year`; `Trade`; `Undecided` | hard school-type filter; `Undecided` had no scholarship normalization counterpart |
| Have you been accepted to a college yet? | `activeFacts.college_accepted` | `Yes` -> `true`; `No` -> `false`; initial `null` | displayed but unused by processor |
| Are you planning to take a gap year? | `activeFacts.gap_year` | `Yes` -> `true`; `No` -> `false`; initial `null` | hard filter when legacy row said no |

### Step 2 — Activities, responsibilities, financial need, and criteria

| Displayed prompt or answer | Identifier/value | Control/condition | Historical use |
| --- | --- | --- | --- |
| Hold a leadership position (Captain, President, Manager) | `passiveSignals.leadership` | checkbox boolean | displayed but unused |
| Have a part-time job or work experience | `passiveSignals.work_experience` | checkbox boolean | displayed but unused |
| Have significant caregiving responsibilities at home | `passiveSignals.caregiving` | checkbox boolean | displayed but unused |
| Participate in community service or volunteering | `passiveSignals.service` | checkbox boolean | displayed; opens volunteer-hours question; otherwise unused |
| Approximately how many volunteer hours have you completed? | `passiveSignals.volunteer_hours_bucket` | displayed only when `service === true`; empty `Select hours...`; `1 to 19`; `20 to 49`; `50 to 99`; `100 plus` (label `100+ hours`) | displayed but unused; type also allowed `0`, which UI did not display |
| I have acute financial need (e.g., qualify for free/reduced lunch, Pell grant eligible, etc.) | `passiveSignals.financial_need` | checkbox; selected `Yes`, unselected empty string | +10 text-match score only |

### Earlier active standalone affiliation question

Before `f63e550...`, the same second step also displayed this section. It was not
displayed concurrently with the final 38-entry configuration. The exact earlier blobs
are `78327a22928e686f727d2daabf960470c65b63d8` for `PassiveSignalsStep.tsx`,
`0943f296b53d82ba0f2fab1a0ec594391ab26b16` for `wizard.ts`,
`0735ce42628110ac3cd806c6e55bd91400910216` for `processor.ts`, and
`da2fd3ab43e39465015d39e712cb9ad5021714f5` for `rulesPack.ts`, all at
`dda6e2ab8b54003191e8f79f72c9f9d5e3fd8de2`.

| Displayed section/prompt | Identifier | Control and answer options | Later migration |
| --- | --- | --- | --- |
| Family & Organization Affiliations; “Are you or your family affiliated with any of the following?” | `passiveSignals.organization_affiliations` | multi-select buttons: `Military`; `First Responder`; `Farmers Union`; `Electric Co-op`; `Credit Union`; `Elks Lodge` | Removed by `f63e550...`; mapped respectively to `military_veteran`, `first_responder`, `farmers_union`, `electric_coop`, `credit_union`, and `elks_lodge` in `passiveSignals.special_criteria`. |

P8F must not render both versions. The exact old-value-to-final-ID mapping is:

| Earlier displayed value | Final displayed identifier |
| --- | --- |
| `Military` | `military_veteran` |
| `First Responder` | `first_responder` |
| `Farmers Union` | `farmers_union` |
| `Electric Co-op` | `electric_coop` |
| `Credit Union` | `credit_union` |
| `Elks Lodge` | `elks_lodge` |

### Special Circumstances & Characteristics

All 38 entries below were displayed as optional checkboxes in grouped `<details>`
accordions and stored in `passiveSignals.special_criteria`.

| Category | Identifier | Displayed label | Tooltip |
| --- | --- | --- | --- |
| Neurodiversity & Learning | `dyslexia` | Dyslexia | Diagnosed with Dyslexia. |
| Neurodiversity & Learning | `adhd` | ADHD | Diagnosed with Attention-Deficit/Hyperactivity Disorder. |
| Neurodiversity & Learning | `autism` | Autism Spectrum | Autism or related neurodivergent identities. |
| Neurodiversity & Learning | `learning_other` | Other Learning Disability | Processing disorders or other learning differences. |
| Health & Hardships | `mental_health` | Mental Health Challenges | Personal struggle with mental health or impacted by a family member. |
| Health & Hardships | `chronic_health` | Chronic Disease / Physical Health | Long-term health issues like diabetes or significant physical challenges. |
| Health & Hardships | `foster_care` | Foster Care Experience | Current or former youth in the foster care system. |
| Health & Hardships | `loss_of_parent` | Loss of Parent or Guardian | Especially in the line of duty. |
| Health & Hardships | `overcoming_adversity` | Overcoming Significant Adversity | Demonstrated tenacity in overcoming profound obstacles or personal hardships. |
| Demographics & Identity | `first_generation` | First-Generation College | First in your immediate family to attend college. |
| Demographics & Identity | `black_african_american` | Black or African American | none |
| Demographics & Identity | `hispanic_latino` | Hispanic or Latino/a | none |
| Demographics & Identity | `native_american` | Native American or Indigenous | none |
| Demographics & Identity | `asian_pacific_islander` | Asian or Pacific Islander | none |
| Demographics & Identity | `lgbtqia` | LGBTQIA+ | Lesbian, Gay, Bisexual, Transgender, Queer, Intersex, or Asexual identity. |
| Demographics & Identity | `female` | Female | Often strongly considered for underrepresented fields like STEM or Aviation. |
| Demographics & Identity | `nonbinary` | Non-Binary | none |
| Demographics & Identity | `single_parent` | Single Parent Household | Raised by a single parent, or currently a single parent. |
| Demographics & Identity | `mensa` | Mensa Member | You or a family member are a current member of Mensa. |
| Career Interests | `aviation_pilot` | Aviation - Pilot Training | Flight training, commercial pilot, etc. |
| Career Interests | `aviation_maintenance` | Aviation - Maintenance | A&P Mechanics, aviation maintenance technology. |
| Career Interests | `aviation_management` | Aviation - Management | Air traffic control, airport management. |
| Career Interests | `stem` | STEM | Science, Technology, Engineering, or Mathematics fields. |
| Career Interests | `healthcare` | Healthcare & Nursing | Nursing, Pre-Med, therapy, or related medical careers. |
| Career Interests | `trades` | Skilled Trades & Construction | Construction management, HVAC, plumbing, welding, or automotive. |
| Career Interests | `business_finance` | Business & Finance | Accounting, marketing, entrepreneurship, or banking. |
| Career Interests | `public_service` | Public Service & Social Impact | Social work, early education, first responder, or community improvement. |
| Career Interests | `law` | Law & Legal Studies | Pre-Law, Paralegal studies, or criminal justice. |
| Career Interests | `arts_humanities` | Arts & Humanities | Music education, graphic design, or fine arts. |
| Career Interests | `agriculture_conservation` | Agriculture & Conservation | Forestry, farming, floriculture, or natural resources. |
| Extracurriculars & Activities | `athletics_sports` | Student Athlete / Sports Background | Involved in athletics, refereeing, or specific sports like golf. |
| Family, Employee, & Org Affiliations | `military_veteran` | Military or Veteran Affiliation | Self or family member who is a veteran or active-duty military. |
| Family, Employee, & Org Affiliations | `first_responder` | First Responder Affiliation | Self or family member who is a police officer, firefighter, EMT, etc. |
| Family, Employee, & Org Affiliations | `farmers_union` | Farmers Union Member | Family membership in the Farmers Union. |
| Family, Employee, & Org Affiliations | `electric_coop` | Electric Co-op Member | Family utilizes a local Electric Co-op (e.g. Flathead Electric). |
| Family, Employee, & Org Affiliations | `credit_union` | Credit Union Member | Family utilizes a local Credit Union (e.g. Whitefish Credit Union). |
| Family, Employee, & Org Affiliations | `elks_lodge` | Elks Lodge Affiliation | Family involvement with the Elks Lodge. |
| Family, Employee, & Org Affiliations | `company_employee` | Corporate Sponsor Employee / Dependent | Parent/Guardian is an employee of a major local sponsor (e.g. Don K, Whitefish Mountain Resort). |

## Type-only fields that were not displayed

These fields existed in `wizard.ts` but were not rendered by either pinned step. They
are not former questions and P8F may not present them as historical restoration without
a separately recorded rationale and tests.

| Type-only field | Initial value |
| --- | --- |
| `activeFacts.sat` | `null` |
| `activeFacts.act` | `null` |
| `activeFacts.fafsa_complete` | `null` |
| `passiveSignals.skills` | `[]` |
| `passiveSignals.creative_skills` | `[]` |
| `passiveSignals.background_optional` | `{}` |
| `passiveSignals.constraints` | `[]` |
| `passiveSignals.career_interests` | `[]` |

## Historical row normalization, filters, ranking, and sort

The processor read the legacy `{data}` rows returned by `/api/scholarships`. It first
discarded rows with fewer than three nonempty string cells, then normalized legacy text.

### Hard exclusions in the last active processor

1. Excluded `closed`, `expired`, or `past due` text and parsed hard dates earlier than
   the current browser time.
2. Excluded when numeric `Stated Min. GPA` exceeded a supplied GPA.
3. Excluded when normalized `2`, `4`, or `trade` school types had no overlap with the
   selected school types. Empty normalized types behaved as any; `Undecided` never
   matched a normalized type.
4. Treated `national`/`any` as national. Otherwise searched scholarship location,
   summary, and focus for the selected state. If absent, assumed the award belonged to
   Montana and excluded every non-Montana student.
5. Excluded a gap-year student when `Accepts Gap Year Applications Upon Return` was
   exactly `no`.
6. In the earlier active configuration, normalized membership regex hits into
   `required_orgs`, mapped the six displayed organization strings to internal IDs, and
   excluded when no selected organization matched. In the final configuration, searched
   name, summary, and focus with membership/affiliation/employer regexes and excluded the
   row when the corresponding `special_criteria` ID was not selected.

The final affiliation gates were `military_veteran`, `first_responder`, `farmers_union`,
`electric_coop`, `credit_union`, `elks_lodge`, and `company_employee`. Earlier history
also hard-excluded identity, health, hardship, and demographic terms; commit
`ab8e9f1e...` changed those categories to rank-only before the pinned last-active route.

### Score and ordering

- `amount_max / 1000` points, using the largest number in `Amount`.
- Earlier active code, including the final question configuration at `f63e550...`, added
  `+5` when `New for 2026!` was exactly `x` through normalized `is_new`; commit
  `c97f35a...` removed the rule before the pinned last-active route.
- `+3` when `Renewing/ Non-Renewing` contained `renewing`; this also classified
  `Non-Renewing` as renewable.
- `+4` when summary text matched `portal`, `foundation`, or `common application`.
- `+10` when financial need was selected and summary matched financial need, Pell,
  low-income, or hardship text.
- `+15` once per selected special criterion when any career, identity, or affiliation
  regex matched name, focus, or summary.
- `-2` for essay/personal-statement text.
- Descending numeric score; equal scores retained the input order supplied to the
  stable JavaScript sort.

Defined but unused rules/fields were service-hours tiers, the creative penalty,
`states`, and `requires_high_service`. Educational status, college acceptance,
leadership, work, caregiving, service, volunteer hours, and all type-only fields did not
affect the processor.

## Historical browse and result/export routes

- The last active homepage began in `BROWSE`, rendered the then-current
  `ScholarshipBrowser`, and offered `Get personalized matches (quiz + Excel)`.
- The browse surface fetched `/api/scholarships`; searched name/summary/focus; filtered
  by school type, all/in-state/national, renewable-only, and hard-deadline-only; and
  sorted by deadline, amount, or name. It rendered cards with amount, urgency, location,
  school type, GPA, renewable/focus chips, summary, and Apply/counselor action.
- Interview completion entered `PROCESSING`, fetched the same endpoint, ran
  `processAndFilter` wholly in the browser, and displayed only a match count and Excel
  download screen—not on-page matched cards.
- The route stored full matched legacy rows, but not answers, under
  `scholarship_export_payload_v1` in `sessionStorage` for 15 minutes. Reload resumed the
  export screen from that payload. Reset removed it.
- `downloadAsExcel` generated a data-URI `.xlsx`, omitted synthetic `_url` columns from
  visible columns, restored those links as cell hyperlinks, froze/bolded the header,
  and exported every field returned by the legacy allow-listed API payload.
- The accepted P7/P8R product has replaced these paths with canonical cards,
  relationship/count semantics, safe visible-result CSV export, and no answer/result
  persistence. P8F must preserve the accepted product and may not restore the old
  session-stored row payload or Excel-only result screen.

## Required P8F disposition of every former rule

| Historical rule/surface | P8F disposition | Rationale and required test |
| --- | --- | --- |
| Two-step detailed interview and all 38 displayed special criteria | retain with accessible grouping; wording changes must be mapped | User requested the former detail. Snapshot test every displayed ID/label/option and prove ADD is not duplicated. |
| Earlier standalone `organization_affiliations` question and six values | safely replace through the exact six-value migration map; do not duplicate | The final configuration moved all six concepts into `special_criteria`. Test every old value maps to exactly one final control and that no second affiliation section appears. |
| Required markers without validation | safely replace | Typed validation and focus/live-error tests must block incomplete required answers. |
| GPA filter | safely replace | A hard conflict requires an award-bound accepted public minimum-GPA fact; missing/unaccepted facts remain possible. |
| State/default-Montana filter | retire default; safely replace exact residence logic | Never infer Montana or residence from free text. Test non-Montana and missing-fact preservation. |
| Educational status | retain only with an explicit rule map | It was displayed but unused. Accepted typed status facts may affect a decision; otherwise show no effect. |
| School-type filter | safely replace | Use only award-bound accepted school-type facts; `Undecided` cannot hard-exclude. |
| College-accepted answer | retain only with an explicit rule map | It was displayed but unused; no effect without accepted typed authority. |
| Gap-year filter | safely replace | Only an accepted award-bound gap-year rule can conflict; missing/free text remains possible. |
| Leadership, work, caregiving, service | retain as positive, optional signals only where mapped | They were displayed but unused. Nonselection is not a negative fact. |
| Conditional volunteer-hours bucket | retain condition; safely replace matching | Only an accepted numeric service-hours requirement may conflict. Retire text regex tiers and test every bucket boundary. |
| Financial-need checkbox/+10 | retain question; replace arbitrary score | Positive selection may prioritize only an award-bound accepted need criterion. Nonselection never excludes. |
| Sensitive identity/health/hardship/demographic criteria | retain as optional positive disclosures; replace matching | Selection may influence results only through exact accepted field authority; omission/prefer-not-to-answer never conflicts. Test all IDs and no-answer equivalence. |
| Career/athletic interests | retain as rank-only preferences with accepted field authority | Never convert an interest into eligibility. Test deterministic reason-coded ordering without points. |
| Affiliation/employer regex hard gates | retire regex; safely replace typed tri-state rules | A hard conflict requires accepted required-affiliation authority and an explicit contradictory answer; omission/nonselection remains possible. |
| Empty-row prefilter | retire | P8F consumes the accepted canonical catalog, whose identities/counts already reconcile. |
| Expired keyword and browser-time date filters | retire | Use accepted typed cycle states only; unknown dates remain possible and cannot become open/closed through parsing. |
| Legacy text GPA/school/location/gap normalization | retire as matching truth | P8F uses canonical typed, field-specific authority; legacy `{data}` remains compatibility-only. |
| Amount score | retire | The rejected P8R candidate proved unsupported legacy amount ranking unsafe. |
| `New for 2026!`/`is_new` +5 | retire | A legacy marker and arbitrary point boost are not accepted eligibility or preference authority. Test that the field cannot affect P8F decisions or order. |
| `Non-Renewing` substring/+3 | retire | Direct regression must reject the substring bug; renewability affects order only if an explicit user preference and accepted fact are introduced. |
| Portal/foundation/common-application +4 | retire | Source architecture is not student eligibility. Preserve portal/award distinctions and current filters instead. |
| Selected-criterion +15 | retire | Replace arbitrary points with deterministic decision tiers and reason-coded preference ordering. |
| Essay -2 and unused creative penalty | retire | Application effort was not asked as a preference and cannot silently lower an award. |
| Defined but unused service-hours regexes and normalized fields | retire | No dormant heuristic may become active accidentally; source/static tests must reject imports of the legacy processor/rules pack. |
| Descending legacy score | safely replace | Order by accepted decision tier, explicit mapped preferences, the selected accepted P7 sort, and stable award ID tie-break. |
| Export-only results screen | retire | Results remain on-page with current cards/reasons/edit/reset/browse-all recovery. |
| `sessionStorage` matched-row retry payload | retire | Preserve P8R volatile-memory privacy; tests reject answers, decisions, or matched rows in all persistence/transmission channels. |
| Legacy Excel export | retire from the interview path | Preserve the accepted P7/P8R visible-result CSV allow-list, formula neutralization, and exact visible-row count. |
| `/api/scholarships` legacy `{data}` as matcher input | retire as matching truth | P8F must use the accepted canonical catalog; keep compatibility payload only for existing consumers. |

## Unresolved items carried into P8F

- The accepted 192-award catalog presently has no field-specific accepted matching
  authority for the former detailed criteria. P8F may bind only facts already supported
  by accepted repository evidence; it may not promote free text or add factual claims
  merely to make a question change results. A question with no accepted rule must
  disclose that it did not narrow results.
- Whether all former labels remain appropriate student-facing wording requires
  accessibility/privacy review; any change must preserve an exact old-ID-to-new-control
  map rather than erasing the historical inventory.
- Live scholarship freshness and protected application-health smoke remain unverified.
