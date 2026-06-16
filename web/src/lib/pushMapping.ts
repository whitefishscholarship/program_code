// Maps a staged scholarship record onto the LIVE `Master Database` header row, BY NAME.
//
// Why this exists (HANDOFF bug #6): the old push route emitted a fixed 20-element,
// master-shaped array (incl. POC / Notes / Known #) and appended it positionally to
// `A:T`. The live `Master Database` tab is 15 clean student-facing columns, so the
// write drifted (a "Name" value landed in the Summary column) AND it wrote 3 PII/staff
// columns. This module writes only the student columns, keyed to the live header row,
// and refuses to write if the target tab carries any staff/PII column.

// The 15 student-facing columns, verified against the live COPY sheet 2026-06-15.
export const STUDENT_HEADERS = [
  "Last Updated",
  "Due Date",
  "In-State / National",
  "Portal/ Scholarship",
  "Amount",
  "Scholarship Location/Information",
  "Name of Scholarship",
  "Application Link/Method",
  "Summary",
  "Stated Min. GPA",
  "School Type (2-or 4-Year, or Trade)",
  "Renewing/ Non-Renewing",
  "Focus",
  "Acute Financial Need Prioritization",
  "Accepts Gap Year Applications Upon Return",
] as const;

// Columns that must NEVER be written to the student-facing Master Database.
// Includes both the live-sheet spellings and the extract-route schema spellings.
export const FORBIDDEN_HEADERS = [
  "POC",
  "POC (Emails, Names, Phone)",
  "Notes",
  "Notes (Last Date of Outreach, Progress, etc.)",
  "Known # Applicants 2025",
  "Known Applicants 2025",
  "New for 2026!",
  "New for 2025!",
];

// Collapse a header/key to a comparison form (case- and punctuation-insensitive),
// so "In State / National" and "In-State / National" compare equal.
export function normalizeHeader(s: string): string {
  return (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

// For the few live headers whose extract-route schema spelling does NOT normalize to
// the same form, list the alternative record-key spellings. The other 11 match by
// normalization alone, as do Scraped-Data rows (whose headers equal the live headers
// verbatim). Keyed by the literal live header; normalized once at load time below.
const ALIAS_LITERALS: Record<string, string[]> = {
  "Scholarship Location/Information": ["Location/Information"],
  "School Type (2-or 4-Year, or Trade)": ["School Type"],
  "Acute Financial Need Prioritization": ["Acute Financial Need"],
  "Accepts Gap Year Applications Upon Return": ["Accepts Gap Year Apps Upon Return"],
};
const EXTRA_ALIASES: Record<string, string[]> = Object.fromEntries(
  Object.entries(ALIAS_LITERALS).map(([header, alts]) => [
    normalizeHeader(header),
    alts.map(normalizeHeader),
  ]),
);

// Build the row to append, aligned to `headers` (the LIVE header row), pulling each
// value from the record by header name (with alias fallbacks). Internal fields
// (those starting with "_", e.g. _confidence/_flags) are ignored, as are any keys
// not matching a live header — so PII never leaks even if present on the record.
export function mapRecordToRow(record: Record<string, unknown>, headers: string[]): string[] {
  const byNorm = new Map<string, unknown>();
  for (const [k, v] of Object.entries(record)) {
    if (k.startsWith("_")) continue;
    byNorm.set(normalizeHeader(k), v);
  }
  return headers.map((h) => {
    const hn = normalizeHeader(h);
    for (const cand of [hn, ...(EXTRA_ALIASES[hn] || [])]) {
      if (byNorm.has(cand)) {
        const v = byNorm.get(cand);
        return v == null ? "" : String(v);
      }
    }
    return "";
  });
}

// Guard: refuse to write unless the live header row is the expected clean student
// schema. Throws if any staff/PII column is present, or if a student column is missing
// (schema drift / wrong tab) — fail loud rather than silently misalign.
export function assertWritableHeaders(headers: string[]): void {
  if (!headers || headers.length === 0) {
    throw new Error("Master Database header row is empty — cannot map a write.");
  }
  const present = new Set(headers.map(normalizeHeader));
  const forbidden = FORBIDDEN_HEADERS.map(normalizeHeader);
  const leaks = headers.filter((h) => forbidden.includes(normalizeHeader(h)));
  if (leaks.length) {
    throw new Error(
      `Refusing to write: target tab carries staff/PII column(s) ${JSON.stringify(leaks)} — wrong tab or schema drift.`,
    );
  }
  const missing = STUDENT_HEADERS.filter((h) => !present.has(normalizeHeader(h)));
  if (missing.length) {
    throw new Error(
      `Refusing to write: Master Database is missing expected student column(s) ${JSON.stringify(missing)}.`,
    );
  }
}
