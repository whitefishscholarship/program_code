// Parity test: the TS grounding port must reject the same fabrications the fixed
// Python suite rejects (HANDOFF #3 numeric value-match, #13 source grounding).
// Run: npx tsx scripts/test-grounding.ts
import {
  groundValue,
  groundRecord,
  normalizeAmount,
  normalizeGpa,
  scoreConfidence,
  findMasterDuplicate,
  findUrlCollision,
  isFundTotal,
  assessRelevance,
  fitsWhitefishAudience,
} from "../src/lib/grounding";

let failed = 0;
function check(name: string, ok: boolean, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : "  -> " + detail}`);
  if (!ok) failed++;
}

// #3 numeric value-match (NOT substring)
check("#3a $5,000 NOT grounded by $50,000", groundValue("$5,000", "This endowment awards a single $50,000 scholarship.") === false);
check("#3b GPA 3.5 NOT grounded by $13.50", groundValue("3.5", "Tuition is $13.50 per credit hour.") === false);
check("#3c real $5,000 grounds", groundValue("$5,000", "The award is worth $5,000 each year.") === true);
check("#3d real GPA 3.5 grounds", groundValue("3.5", "Applicants need a 3.5 GPA or higher.") === true);
check("range $1,000–$5,000 needs both numbers", groundValue("$1,000 – $5,000", "from $1,000 to $5,000 per student") === true);
check("range fails if one number missing", groundValue("$1,000 – $5,000", "up to $5,000 per student") === false);

// text grounding
check("sentinel 'Any' always grounds", groundValue("Any", "anything") === true);
check("hallucinated name token-fails", groundValue("Governor Best Brightest Scholarship", "This page is about the Eagle Scholarship.") === false);

// groundRecord blanks fabricated fields on a Gemini-schema record
const fab = {
  "Name of Scholarship": "Phantom Memorial Scholarship",
  "Amount": "$20,000",
  "Stated Min GPA": "3.9",
  "Summary": "Recipients receive lifetime executive mentorship and overseas retreats.",
};
const src = "The Eagle Scholarship awards $500 to one local senior with a 2.5 GPA.";
const { record, flags } = groundRecord(fab, src);
check("groundRecord blanks fabricated name", record["Name of Scholarship"] === "" && flags.some((f) => f.includes("UNGROUNDED Name")));
check("groundRecord blanks fabricated amount", record["Amount"] === "");
check("groundRecord blanks fabricated GPA (3.9 vs 2.5)", record["Stated Min GPA"] === "");
check("groundRecord blanks fabricated summary", record["Summary"] === "");

// confidence: fewer flags -> higher
const clean = { "Name of Scholarship": "Eagle", "Amount": "$500", "Stated Min GPA": "2.5", "Due Date": "March 1, 2027", "Summary": "x" };
const cHi = scoreConfidence(clean, []);
const cLo = scoreConfidence(record, flags);
check("confidence higher for clean grounded record", cHi > cLo, `clean=${cHi} fabricated=${cLo}`);
check("confidence within 5..98", cHi <= 98 && cLo >= 5);

// fund/endowment totals are not award amounts
check("isFundTotal flags '$7.5 million fund'", isFundTotal("$7.5 million fund") === true);
check("isFundTotal flags '$4.2 million endowment'", isFundTotal("$4.2 million endowment") === true);
check("isFundTotal passes a real award", isFundTotal("$2,000 a year") === false);

// relevance for HS seniors
check("relevance: graduate scholarship excluded", assessRelevance("Helene M. Overly Memorial Graduate Scholarship", "For graduate students in transportation.").level === "exclude");
check("relevance: 'for Graduates' excluded", assessRelevance("Leadership Legacy Scholarship for Graduates", "").level === "exclude");
check("relevance: type rating -> review", assessRelevance("CAE Citation Bravo Type Rating Scholarship", "Earn a type rating.").level === "review");
check("relevance: membership -> review", assessRelevance("Lodge Award", "Open to members of the association.").level === "review");
check("relevance: undergraduate NOT excluded", assessRelevance("Sharon D. Banks Memorial Undergraduate Scholarship", "For undergraduate students.").level === "ok");
check("relevance: plain HS scholarship ok", assessRelevance("Conquering Cancer Scholarship", "For a graduating high school senior.").level === "ok");

// audience fit (Whitefish, MT)
check("audience: national HS scholarship fits", fitsWhitefishAudience("Fly for Duke Aviation Scholarship", "For U.S. high school seniors.").fit === true);
check("audience: other-state residency excluded", fitsWhitefishAudience("Ashtabula Scholarship", "Recipients must be residents of Ashtabula County, OH.").fit === false);
check("audience: Alaskan residents excluded", fitsWhitefishAudience("Stroecker Scholarship", "For Alaskan residents with a private pilot certificate.").fit === false);
check("audience: AEA members excluded", fitsWhitefishAudience("Gene Baker", "Open to all AEA members, their children or dependents.").fit === false);
check("audience: teachers excluded", fitsWhitefishAudience("Teacher Flight", "For current, paid, full-time teachers.").fit === false);
check("audience: search platform excluded", fitsWhitefishAudience("Scholarship Universe", "A platform used by the University to find scholarships.").fit === false);
check("audience: training-location not a residency restriction", fitsWhitefishAudience("Aircraft Mechanic Scholarship (New Smyrna Beach)", "For U.S. high school seniors.").fit === true);

// trap-aware amount: donor total ignored
const amt = normalizeAmount("Two $1,600 scholarships will be available. A donor has given over $50,000 to date.");
check("normalizeAmount ignores donor total", amt.value === 1600, String(amt.value));

// gpa qualify-over-maintain
const g = normalizeGpa("Students must have a 3.0 GPA to qualify. Recipients must maintain a 2.5 GPA to maintain.");
check("normalizeGpa qualify over maintain", g.value === "3.0" && g.flags.some((f) => f.includes("maintain")), JSON.stringify(g));

// dedupe vs master — NAME based (URL collisions must NOT merge distinct scholarships)
const master = [
  { name: "ABC Merit Scholarship", url: "https://abc.org/apply" },
  { name: "Whitefish Community Scholarship", url: "" },
];
check("dedupe by name subset", findMasterDuplicate("Whitefish Community Scholarship Fund", master) === "Whitefish Community Scholarship");
check("dedupe by name equal", findMasterDuplicate("ABC Merit Scholarship", master) === "ABC Merit Scholarship");
check("distinct name on SAME url is NOT a dup", findMasterDuplicate("ABC Engineering Award", master) === null);
check("non-duplicate returns null", findMasterDuplicate("Brand New Award", master) === null);
// URL collision is reported separately (a soft flag, not a merge)
check("findUrlCollision reports shared url", findUrlCollision("https://abc.org/apply?ref=x", master) === "ABC Merit Scholarship");
check("findUrlCollision null when unique", findUrlCollision("https://new.org", master) === null);

console.log(failed === 0 ? "\nALL PASS" : `\n${failed} FAILED`);
process.exit(failed === 0 ? 0 : 1);
