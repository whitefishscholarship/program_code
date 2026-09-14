# R4 release candidate

The approved release publishes the locally completed R3 catalog:411 awards, preserving
all192 existing awards/criteria and adding219 reviewed organizer records. No runtime,
fixture, dependency, test or deployment-control file changed after R3 review checkpoint
ec0907eeab92647ee394bd9b9a7614ecb6ab92cc. The selected bundle SHA256 remains
9a4f8c8c0e3990fcaa182f52595710ee0404c11572f69512b4254bb0f6b72908.

Authority checkpoint:e10443c. User approved publishing, Preview, merge, Production and
verification. Exact receipt:authority.json; authenticated baseline/target:preflight.json.
Baseline remains a8aa6f958f029b7edfacf03ac6c5848e9e8f4b32. No source/workbook call,
configuration change, provider interaction or future phase is included.

Verification records:tests-validation.json and build-validation.json: full tests, build,
typecheck, intake, coverage, R3 policy/source-capture/mapping/catalog checks and P9
production trace all exit0. Source checks read saved artifacts only. Dependencies were
installed locally with npm ci --offline --no-audit --no-fund (exit0). The framework
middleware warning remains future maintenance; it is not a failed build.

plan-validation.json: both actual local and GITHUB_ACTIONS=true modes fail exactly the
three reserved REV18 manifest/review/committed-attestation gates. These are mandatory
failures until canonical review and the direct-child two-file attestation. Afterward
both modes must report zero errors before publication. No bypass or policy exception
was added by R4. A preliminary documentation-generation script had a Python syntax
error before execution; no partial changes resulted. Corrected generation succeeded
and prospective policy validation retained exactly the same three gates.

Preservation.json independently compares667 runtime/evidence/review files against
R3 review checkpoint, six retained branch tips, the exact R3 grant, older amendment
objects and complete previous handoff. Original R3 final and mapping/policy manifests
remain bound to their original candidates. Current local browser proof is the preserved
R3 360/1440 run and independent replay against these identical runtime bytes, including
actual saved CSVs. No new R4 local browser run is claimed. Exact hosted verification
still follows acceptance; local evidence is not hosted proof.

Required clean-worktree git diff --check exits0. Complete baseline verification using
command-local core.whitespace=cr-at-eol also exits0. Six preserved CSV evidence files
contain intentional BOM/CRLF; raw baseline diff --check reports CR whitespace as noted
in the accepted R3 low finding. Preserve those exact downloaded bytes and Git settings.

Freeze this complete candidate and obtain fresh independent canonical review. Canonical
manifest/review are added only in its immediate child, then stay branch tip until merged.
Publish exact attestation, verify CI and exact Preview, merge preserving ancestry, then
verify the exact Production commit/deployment, selected catalog/API/compatibility/public
CSV/browser behavior and source-capability declarations. Unavailable hosted request-body
or download-event evidence must stay unknown.

All outstanding criteria/definitions/Bonita/NTHS/recovery/hold/research routes remain in
CURRENT_HANDOFF. Codex owns R4 completion. R5–R7 require separately selected scope.
