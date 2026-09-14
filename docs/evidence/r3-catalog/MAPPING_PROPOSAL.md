# R3 offline mapping candidate

Independent mapping review is required before product edits. This is an organizer-record
publication proposal, not acceptance of current official eligibility or availability.

Attempt2 has two identical complete A1:O417 native projections and four stable surrounding
observations under the approved correction. `capture-verification.json` states the precise
observational limits. No source calls need repeating. No source was written.

Run `python3 web/scripts/build-r3-catalog.py` to reproduce the proposal and its pins;
`python3 web/scripts/test-r3-mapping.py` checks denominators and preservation/negative cases.
Run both native-capture and connector-read CJS test scripts. Product schema validation is
`cd web && node --import tsx -e "const fs=require('fs'); const {StudentCatalogSchema}=require('./src/lib/studentCatalog.ts'); StudentCatalogSchema.parse(JSON.parse(fs.readFileSync('../docs/evidence/r3-catalog/mapping-bundle-proposal.json')).catalog)"`.

The crosswalk accounts for all416 current data positions and257 applied operations.
Reconstructing the prior native Master values with the APPLIED replacement field mask
matches every current entered value and every expected link. Missing after-values clear
cells; they do not retain old values. Hyperlinks can normalize between cell and rich-text
channels. The join uses a unique full fifteen-cell value vector plus reviewed ledger
identity/source relationships and link checks; historical positions/names/shared URLs
alone never establish identity. Missing or conflicting identity stops that join.

Proposed result:411 awards (192 retained plus219 additions),21 unchanged portals, all217
original sources and4 application groups preserved. Cat Scholarships row100 is one of
the38 updates but remains a portal. Its source-summary update is retained as evidence;
it does not become an award or leak criteria to children. The16 catalog-only children
remain byte-identical. New source records belong to their exact reviewed ledger entity;
shared URLs do not merge awards or establish shared-application membership. Where group
structure is not mapped, the complete recorded application instructions remain on the
card, with mode/supplements unknown. No new counts of recipient slots are inferred.

`mapping-fields.json` records imported-field rules and original reviewed deltas for every
operation, including non-imported resource fields. Old eligibility/shortlist criteria,
source relationships and application groups remain unchanged; existing public name,
summary, amount label and deadline description change only where the applied operation
supports that field. NTHS row143 is a separate recorded follow-up: native46113 without a
date number format yields an unverified-deadline message. No serial date is fabricated.
New amount numeric bounds remain unknown rather than guessing a range from mixed prose.
All new cycles remain unknown with the full recorded deadline/cycle caveats.

`mapping-criteria.json` individually proposes nine explicit numeric GPA comparisons and
seven resolved school-type comparisons on new awards. Four A&P/college-only GPA entries
remain unknown because they cannot safely be compared with the student's school GPA.
Blank/ambiguous types remain unknown. Existing192-award comparisons are preserved.

`mapping-connections.json` binds every proposed discovery connection to exact award and
original reviewed tags or saved gap evidence. Existing206+4 connections remain intact.
All nine organizations have exact included award support. Membership selections do not
establish joint membership, training or eligibility. Teaching alternatives/preferences
are qualified separately. Financial-need wording retains the recorded condition,
selection-factor, essay or preference distinction. Bonita Jean Olson's old need-gap
reference conflicts with the current applied description; its need connection is held
pending separately scoped source research, while the award remains included. All
first-generation and care/adoption definition changes remain recommendations only.

`mapping-reconciliation.json` contains all38 priority entities/42 references, all five
original gaps, explicit deferrals and owners/triggers, plus shared-route collision
candidates. The withdrawn NTHS duplicate points only to retained award-ead4360dadca.
Original310 held entities/312 holds,26-record research queue, recovery objects and every
prior handoff trigger remain under their original authority. No R4 action is authorized.

After mapping PASS: publish the exact bundle with mapping review/reconciliation/generator
pins, wire the same catalog to API/browser/compatibility/CSV, extend supported existing
optional organization controls, preserve the GPA/school algorithm and binary OR relevance,
and complete local unit/runtime/browser/privacy/download verification plus final independent
review. Historical matching-facts revision225 must remain separately labeled in health.

Review remediation: five new connections attached to cards with no summary now state
exact program qualifications in the reason itself. All nine changed existing GPA/school
fields have explicit dispositions: five conflicts remain for Kelsey's separate policy
selection; four agree with preserved shortlist rules and require only regression checks.
The generator now supports non-mutating `--check` reproduction.
