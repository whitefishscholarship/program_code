// Offline unit test for the wizard eligibility gates (rulesPack.ts) and amount parsing
// (processor.ts). Pins the fix that stopped bare words ("dependent", "veteran") from
// hard-excluding explicitly-open scholarships from general applicants, while genuine
// affiliation requirements still gate. Run: npx tsx scripts/test-wizard-filter.ts
import { processAndFilter, normalizeRow } from "../src/lib/processor";
import { initialActiveFacts, initialPassiveSignals, AnswerMap } from "../src/types/wizard";

let failed = 0;
function check(name: string, ok: boolean, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : "  -> " + detail}`);
  if (!ok) failed++;
}

// A general applicant: no GPA/state/school-type constraints, and NO special criteria ticked.
const generalApplicant: AnswerMap = {
  activeFacts: { ...initialActiveFacts, state: "", gpa: null },
  passiveSignals: { ...initialPassiveSignals, special_criteria: [] },
};

function row(name: string, summary: string, amount = "$1,000") {
  return { "Name of Scholarship": name, "Summary": summary, "Focus": "General", "Amount": amount } as Record<string, string>;
}

const rows = [
  // Should SURVIVE (open scholarships that merely contain a trigger word) —
  row("Open-Dependent", "Awarded to a graduating senior; a dependent of a Whitefish resident may apply."),
  row("Elks-MVS-Style", "Open to any high school senior; you do not need to be a member. Children and dependents are welcome."),
  row("Honors-Veterans", "This community award honors the memory of veterans; open to all graduating seniors."),
  row("Range-Award", "Open to all seniors.", "$500 - $2,000"),
  // Should be EXCLUDED (genuine affiliation gates) for a general applicant —
  row("Must-Be-Veteran", "Applicant must be a veteran of the US Armed Forces."),
  row("Employee-Family", "Open to dependents of employees of Acme Corporation."),
  row("Elks-Members", "Restricted to Elks members and their families."),
];

const result = processAndFilter(rows, generalApplicant);
const names = new Set(result.map((r) => r["Name of Scholarship"]));

check("open 'dependent of a resident' scholarship SURVIVES", names.has("Open-Dependent"));
check("Elks-MVS-style ('dependents welcome') SURVIVES", names.has("Elks-MVS-Style"));
check("'honors veterans' narrative scholarship SURVIVES", names.has("Honors-Veterans"));
check("range-amount scholarship SURVIVES", names.has("Range-Award"));
check("'must be a veteran' is EXCLUDED for a general applicant", !names.has("Must-Be-Veteran"));
check("'dependents of employees' is EXCLUDED for a general applicant", !names.has("Employee-Family"));
check("'Elks members' is EXCLUDED for a general applicant", !names.has("Elks-Members"));

// When the student DOES tick the matching criterion, the gated award is allowed through.
const militaryApplicant: AnswerMap = {
  activeFacts: { ...initialActiveFacts, state: "" },
  passiveSignals: { ...initialPassiveSignals, special_criteria: ["military_veteran"] },
};
const milResult = processAndFilter([row("Must-Be-Veteran", "Applicant must be a veteran of the US Armed Forces.")], militaryApplicant);
check("'must be a veteran' SURVIVES when the student ticks military", milResult.some((r) => r["Name of Scholarship"] === "Must-Be-Veteran"));

// --- Amount range: normalizeRow stores the HIGH end (M10) ---
check("'$500 - $2,000' amount_max is 2000 (not 500)", normalizeRow(row("R", "s", "$500 - $2,000")).normalized.amount_max === 2000, String(normalizeRow(row("R", "s", "$500 - $2,000")).normalized.amount_max));
check("'$1,000-$50,000' amount_max is 50000", normalizeRow(row("R", "s", "$1,000-$50,000")).normalized.amount_max === 50000);
check("'$5,000' single amount_max is 5000", normalizeRow(row("R", "s", "$5,000")).normalized.amount_max === 5000);
check("numeric Amount cell does not throw", (() => { try { normalizeRow({ "Name of Scholarship": "R", "Summary": "s", "Focus": "f", "Amount": 5000 as unknown as string }); return true; } catch { return false; } })());

console.log(failed === 0 ? "\nALL PASS" : `\n${failed} FAILED`);
process.exit(failed === 0 ? 0 : 1);
