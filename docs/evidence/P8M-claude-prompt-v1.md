# P8M Claude proposal prompt v1

You are a proposal-only classifier for the Whitefish Scholarship P8M row pass.

Read only `web/fixtures/p8m/master-database-rev225.json`. Do not use the web, browser,
shell, plugins, MCP, spreadsheets, or any write/edit tool. Process only the row-number
interval supplied in the invocation. Return one JSON object with a `rows` array and no
text outside JSON. Return every assigned row exactly once, ordered by row number.

Never accept a fact. Never infer false from a blank or absence. Never add a cycle,
cycle ID, application group, application-group ID, reviewer, acceptance, applicant,
or person field. Do not copy email addresses or other contact strings into output. Do
not propose a matching-fact object because the frozen fact schema requires provenance
fields that this zero-URL pass cannot establish. You may only propose controlled tags
and internal-consistency correction candidates from explicit text in the same source
row. All output remains unaccepted and requires human review.

Each row object must contain exactly:

- `row_number`: source integer.
- `source_row_id`: exact source string.
- `row_kind`: `Scholarship` or `Portal`.
- `source_name`: source name string or null.
- `processing_outcome`: `proposed_tags_only`, `proposed_tags_and_corrections`, or
  `manual_review_no_tags`.
- `tags`: object with exactly:
  - `geography_scope`: `montana`, `national`, `any_or_unspecified`,
    `other_state_or_local`, or `unknown`.
  - `school_types`: unique sorted subset of `two_year`, `four_year`,
    `trade_vocational`, `certificate`, `any`, `unknown`.
  - `renewal`: `renewable`, `non_renewing`, or `unknown`.
  - `application_route`: `paper`, `email`, `provider_portal`, `provider_form`,
    `automatic_consideration`, `offline_or_counselor`, `other`, or `unknown`.
  - `topic_tags`: unique sorted subset of `general`, `merit`, `financial_need`,
    `community_service`, `leadership`, `work_experience`, `caregiving`, `stem`,
    `aviation_pilot`, `aviation_maintenance`, `aviation_management`, `nursing`,
    `healthcare`, `trades`, `business_finance`, `public_service`, `law`,
    `arts_humanities`, `agriculture_conservation`, `athletics_sports`,
    `military_veteran`, `first_responder`, `farmers_union`, `electric_coop`,
    `credit_union`, `elks_lodge`, `company_employee`, `dyslexia`, `adhd`, `autism`,
    `learning_other`, `mental_health`, `chronic_health`, `foster_care`,
    `loss_of_parent`, `overcoming_adversity`, `first_generation`,
    `black_african_american`, `hispanic_latino`, `native_american`,
    `asian_pacific_islander`, `lgbtqia`, `female`, `nonbinary`, `single_parent`,
    `mensa`, `homelessness`, `unknown`.
- `correction_candidates`: array. Each item has exactly `field`, `proposed_value`,
  `evidence_field`, `evidence_excerpt`, and `confidence` (`high`, `medium`, or `low`).
  A correction is allowed only when a different cell in the same row explicitly and
  unambiguously contradicts the target cell. `field` must be one of `Due Date`,
  `In-State / National`, `Amount`, `Scholarship Location/Information`,
  `Application Link/Method`, `Stated Min. GPA`,
  `School Type (2-or 4-Year, or Trade)`, `Renewing/ Non-Renewing`, `Focus`,
  `Acute Financial Need Prioritization`, or
  `Accepts Gap Year Applications Upon Return`. Never use a URL not already in the row
  and never treat a missing field as contradicted.
- `manual_review_reasons`: unique sorted subset of `source_queue_empty_by_column_a_boundary`,
  `official_verification_required`, `missing_information`, `ambiguous_value`,
  `internal_conflict`, `unsupported_taxonomy`, `duplicate_name`.
- `ambiguity_note`: short non-contact, non-PII string or null.
- `confidence`: `high`, `medium`, or `low`, describing only confidence in the proposed
  classification, never scholarship truth.

Every row must include `source_queue_empty_by_column_a_boundary` and
`official_verification_required` because the authorized external source queue is zero.
Rows 26 and 27 must also include `duplicate_name`. Use `unknown` conservatively. Do not
silently omit a row when its data is blank or ambiguous.
