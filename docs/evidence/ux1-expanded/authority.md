# UX1 expanded categories — direct user refinement

September16,2026. Kelsey reviewed the local preview and asked:

> why is education expanded but other categories are not. lets make them all expanded so students don't skip over them

The screenshot shows Education interests displayed, with Career Interests and
Extracurriculars & Activities collapsed. Apply the same default-expanded behavior
to all six criterion categories on steps3 and4. Existing HTML disclosure controls
may still be collapsed by a student; every category opens when its screen is entered.
Answers remain optional. No question, matching behavior, answer handling, page order
or navigation change. Runtime delta is the `open` attribute on the shared details
renderer in InterviewWizard.tsx. Existing education/activity groups are already visible.

This refines the same local UX1 release under direct user authority. Preserve all
prior UX1/cleanup evidence and scripts; use this folder and qa-ux1-expanded.cjs for
current verification. Existing tests/typecheck/build and adapted mobile/desktop QA
remain required, with visible-option and Back/edit checks for all38 criteria.
Prospective independent review precedes the runtime edit; final independent review
binds the complete candidate. Four canonical release gates remain unchanged. No
publication, source/workbook access, timer activation or sending is included. The
direct timer handoff in UX plan section7 remains byte-identical.
