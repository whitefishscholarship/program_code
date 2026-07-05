// Offline unit test for the shared deadline parser (dateParse.ts) and its use by the
// wizard normalizer (processor.ts). Pins the fix for the year-2001 month-name bug that
// silently dropped live "Annual — <Month> <Day>" scholarships from the quiz.
// Run: npx tsx scripts/test-date-parse.ts
import { parseDeadline, isPastDue } from "../src/lib/dateParse";
import { normalizeRow } from "../src/lib/processor";

let failed = 0;
function check(name: string, ok: boolean, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : "  -> " + detail}`);
  if (!ok) failed++;
}

// Deterministic "now" = 2026-07-05 (a Sunday), matching the review date.
const NOW = new Date(2026, 6, 5);

// --- month-name parsing (the live "Annual — <Month> <Day>" convention) ---
const may31 = parseDeadline("Annual — May 31", NOW);
check("'Annual — May 31' resolves to a hard date", may31.kind === "hard" && !!may31.date, JSON.stringify(may31));
check("'Annual — May 31' is next year (already past this year)", may31.date?.getFullYear() === 2027 && may31.date?.getMonth() === 4, JSON.stringify(may31.date));

const dec1 = parseDeadline("December 1", NOW);
check("'December 1' resolves to a hard future date this year", dec1.kind === "hard" && dec1.date?.getFullYear() === 2026 && dec1.date?.getMonth() === 11, JSON.stringify(dec1));

const march15 = parseDeadline("March 15", NOW);
check("'March 15' is NOT year 2001 (regression)", march15.date !== null && march15.date.getFullYear() >= 2026, JSON.stringify(march15));

check("'March 15, 2027' respects explicit year", (() => { const d = parseDeadline("March 15, 2027", NOW); return d.kind === "hard" && d.date?.getFullYear() === 2027; })());
check("'Mar. 1, 2020' explicit past year => expired", (() => { const d = parseDeadline("Mar. 1, 2020", NOW); return d.kind === "expired"; })());
check("'15 May' (day-month) resolves", (() => { const d = parseDeadline("15 May", NOW); return d.kind === "hard" && d.date?.getMonth() === 4; })());

// --- numeric still works exactly as before ---
check("'3/15/2027' hard", (() => { const d = parseDeadline("3/15/2027", NOW); return d.kind === "hard" && d.date?.getFullYear() === 2027; })());
check("'Opens 12/15' opens-only", (() => { const d = parseDeadline("Opens 12/15", NOW); return d.kind === "opens"; })());
check("'12/1 (opens) - 3/1 (closes)' picks close date", (() => { const d = parseDeadline("12/1 (opens) - 3/1 (closes)", NOW); return d.kind === "hard" && d.date?.getMonth() === 2; })());
check("'Rolling' => rolling", parseDeadline("Rolling", NOW).kind === "rolling");
check("'Closed' => expired", parseDeadline("Closed", NOW).kind === "expired");
check("empty => tbd", parseDeadline("", NOW).kind === "tbd");
check("'Info available in December' (no day) => tbd", parseDeadline("Info available in December", NOW).kind === "tbd");
check("undefined input => tbd (no throw)", parseDeadline(undefined, NOW).kind === "tbd");

// --- the CRITICAL regression: processor must not hard-exclude month-name deadlines ---
// normalizeRow uses the real 'now', so assert the parsed year is current-or-future, never 2001.
function due(dueStr: string) {
  return normalizeRow({ "Name of Scholarship": "X", "Summary": "y", "Focus": "z", "Due Date": dueStr } as Record<string, string>).normalized;
}
const nowYear = new Date().getFullYear();
for (const s of ["March 15", "Annual — May 31", "December 1", "Annual — Feb 15 (opens Oct)"]) {
  const n = due(s);
  const notPast = n.due_date_type !== "hard" || (n.due_date_value !== null && n.due_date_value.getFullYear() >= nowYear);
  check(`processor keeps "${s}" (not a year-2001 past-due exclude)`, notPast, `${n.due_date_type} ${n.due_date_value?.toISOString()}`);
}
// A genuine explicit past year should still be recognized as expired.
check('processor marks "3/1/2020" expired', due("3/1/2020").due_date_type === "expired");
// Non-string Due Date must not throw (numeric cell robustness).
check("processor tolerates a numeric Due Date cell", (() => { try { due(45000 as unknown as string); return true; } catch { return false; } })());

console.log(failed === 0 ? "\nALL PASS" : `\n${failed} FAILED`);
process.exit(failed === 0 ? 0 : 1);
