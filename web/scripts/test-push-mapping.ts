// Offline unit test for the push mapper (no Gemini / no network).
// Run: npx tsx scripts/test-push-mapping.ts
import {
  STUDENT_HEADERS,
  FORBIDDEN_HEADERS,
  mapRecordToRow,
  assertWritableHeaders,
  normalizeHeader,
} from "../src/lib/pushMapping";

let failed = 0;
function check(name: string, ok: boolean, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : "  -> " + detail}`);
  if (!ok) failed++;
}

// The live Master Database header row (verified on the COPY sheet 2026-06-15).
const LIVE_HEADERS = [...STUDENT_HEADERS];

// A record using the EXTRACT-ROUTE schema spellings (different from live headers),
// plus PII/internal fields that must be dropped.
const extractRecord: Record<string, unknown> = {
  "Last Updated": "2026-06-15",
  "Due Date": "March 1, 2027",
  "In State / National": "National", // alias of "In-State / National"
  "Portal / Scholarship": "Scholarship", // alias of "Portal/ Scholarship"
  "Amount": "$5,000",
  "Location/Information": "ABC Foundation", // alias of "Scholarship Location/Information"
  "Name of Scholarship": "ABC Merit Scholarship",
  "Application Link/Method": "https://abc.org/apply",
  "Summary": "For STEM seniors.",
  "Stated Min GPA": "3.5", // alias of "Stated Min. GPA"
  "School Type": "4-Year", // alias of "School Type (2-or 4-Year, or Trade)"
  "Renewing/Non-Renewing": "Renewing", // alias of "Renewing/ Non-Renewing"
  "Focus": "STEM",
  "Acute Financial Need": "No", // alias of "Acute Financial Need Prioritization"
  "Accepts Gap Year Apps Upon Return": "Yes", // alias of "Accepts Gap Year Applications Upon Return"
  // --- must be dropped ---
  "POC (Emails, Names, Phone)": "jane@abc.org 555-1234",
  "Notes": "called 6/1, follow up",
  "Known Applicants 2025": "12",
  _confidence: 84,
  _flags: ["something"],
};

const row = mapRecordToRow(extractRecord, LIVE_HEADERS);

check("row length equals live header count (15)", row.length === LIVE_HEADERS.length, `${row.length}`);

// Every student field landed under its correct column (by name, via aliases).
const expected: Record<string, string> = {
  "In-State / National": "National",
  "Portal/ Scholarship": "Scholarship",
  "Amount": "$5,000",
  "Scholarship Location/Information": "ABC Foundation",
  "Name of Scholarship": "ABC Merit Scholarship",
  "Stated Min. GPA": "3.5",
  "School Type (2-or 4-Year, or Trade)": "4-Year",
  "Renewing/ Non-Renewing": "Renewing",
  "Acute Financial Need Prioritization": "No",
  "Accepts Gap Year Applications Upon Return": "Yes",
};
for (const [header, want] of Object.entries(expected)) {
  const idx = LIVE_HEADERS.findIndex((h) => normalizeHeader(h) === normalizeHeader(header));
  check(`"${header}" mapped correctly`, row[idx] === want, `got "${row[idx]}" at col ${idx}`);
}

// CRITICAL: no PII value appears anywhere in the written row.
const pii = ["jane@abc.org 555-1234", "called 6/1, follow up", "12"];
check("no PII value present in row", !row.some((v) => pii.includes(v)), JSON.stringify(row));

// "Name of Scholarship" must NOT land in the Summary column (the original drift bug #6).
const nameIdx = LIVE_HEADERS.indexOf("Name of Scholarship");
const summaryIdx = LIVE_HEADERS.indexOf("Summary");
check("Name is in Name column, not Summary", row[nameIdx] === "ABC Merit Scholarship" && row[summaryIdx] === "For STEM seniors.", `name@${nameIdx}=${row[nameIdx]} summary@${summaryIdx}=${row[summaryIdx]}`);

// A record using Scraped-Data spellings (which equal the live headers) also maps.
const scrapedRecord: Record<string, unknown> = {
  "Name of Scholarship": "XYZ Award",
  "Scholarship Location/Information": "XYZ Org",
  "Stated Min. GPA": "2.0",
  "POC": "secret@xyz.org",
};
const row2 = mapRecordToRow(scrapedRecord, LIVE_HEADERS);
check("scraped-spelling record maps name", row2[nameIdx] === "XYZ Award", row2[nameIdx]);
check("scraped-spelling PII dropped", !row2.includes("secret@xyz.org"), JSON.stringify(row2));

// Guard: clean header row passes.
let guardOk = true;
try {
  assertWritableHeaders(LIVE_HEADERS);
} catch {
  guardOk = false;
}
check("assertWritableHeaders accepts clean 15-col schema", guardOk);

// Guard: a tab carrying a PII column is refused.
let refusedPII = false;
try {
  assertWritableHeaders([...LIVE_HEADERS, "POC (Emails, Names, Phone)"]);
} catch {
  refusedPII = true;
}
check("assertWritableHeaders refuses tab with PII column", refusedPII);

// Guard: a tab missing a student column is refused (schema drift / wrong tab).
let refusedDrift = false;
try {
  assertWritableHeaders(LIVE_HEADERS.filter((h) => h !== "Name of Scholarship"));
} catch {
  refusedDrift = true;
}
check("assertWritableHeaders refuses missing student column", refusedDrift);

console.log(failed === 0 ? "\nALL PASS" : `\n${failed} FAILED`);
process.exit(failed === 0 ? 0 : 1);
