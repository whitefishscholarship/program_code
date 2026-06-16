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
check("audience: Dawson CC institution-specific held", fitsWhitefishAudience("Kettner Scholarship", "For a full-time student planning to enroll at Dawson Community College.").fit === false);
check("audience: MSU (in-state flagship) still fits", fitsWhitefishAudience("Hilleman Scholars Program", "For students starting at Montana State University in Fall 2026.").fit === true);
check("audience: FVCC (neighboring) still fits", fitsWhitefishAudience("FVCC Eagle Scholarship", "For students attending Flathead Valley Community College.").fit === true);
check("audience: generic 'accredited college' NOT flagged", fitsWhitefishAudience("AEA Memorial Scholarship", "May be used at an accredited college for any field of study.").fit === true);
check("audience: non-Whitefish HS restriction held", fitsWhitefishAudience("Charles England Memorial", "For graduates of Dawson County High School.").fit === false);

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

// ---- REVIEW FIXES (2026-06-16) -------------------------------------------------------
// digit-in-name bypass: a fabricated name sharing only a number must NOT ground
check("ground: fabricated name w/ shared year blanked",
  groundValue("Imaginary 2026 Leadership Scholarship", "The 2026 cycle is open. Smith Award gives $1,000.") === false);
check("ground: legit amount w/ filler words still grounds",
  groundValue("ranging from $250 to $14,000", "Scholarships ranging up to $14,000; minimum $250.") === true);
check("ground: real name still grounds", groundValue("Eagle STEM Scholarship", "The Eagle STEM Scholarship awards $500.") === true);

// dedupe: equality not subset
const dmaster = [{ name: "Presidential Leadership Scholarship", url: "" }, { name: "Bold $25,000 Scholarship", url: "" }];
check("dedupe: distinct shorter name NOT skipped", findMasterDuplicate("Presidential Scholarship", dmaster) === null);
check("dedupe: same-base diff-amount NOT skipped", findMasterDuplicate("Bold $10,000 Scholarship", dmaster) === null);
check("dedupe: exact still caught", findMasterDuplicate("Bold $25,000 Scholarship", dmaster) === "Bold $25,000 Scholarship");
check("dedupe: all-stopword name uses full-string", findMasterDuplicate("Memorial Scholarship", [{ name: "Memorial Scholarship", url: "" }]) === "Memorial Scholarship");

// audience: residency adjective / demonym / HS forms
check("audience: 'Ohio residents' excluded", fitsWhitefishAudience("X", "For Ohio residents only.").fit === false);
check("audience: 'Texas high school seniors' excluded", fitsWhitefishAudience("X", "Open to Texas high school seniors.").fit === false);
check("audience: demonym 'Ohioans' excluded", fitsWhitefishAudience("X", "Scholarships for Ohioans pursuing college.").fit === false);
check("audience: 'graduated from a Florida high school' excluded", fitsWhitefishAudience("X", "Applicants who graduated from a Florida high school.").fit === false);
// audience: generic college phrasing NOT excluded
check("audience: 'any four-year college or university' fits", fitsWhitefishAudience("X", "Open to students attending any four-year college or university.").fit === true);
check("audience: 'an accredited college' fits", fitsWhitefishAudience("X", "May be used at an accredited college.").fit === true);
check("audience: 'University of Alabama' excluded", fitsWhitefishAudience("X", "Must enroll at the University of Alabama.").fit === false);
check("audience: MSU still fits (institution)", fitsWhitefishAudience("Hilleman", "For students starting at Montana State University.").fit === true);
check("audience: 'members of the public' NOT excluded", fitsWhitefishAudience("X", "Open to all students; members of the public may apply.").fit === true);
check("audience: 'exclusively for active NTHS members' excluded", fitsWhitefishAudience("Jon H. Poteat Scholarship", "Reserved exclusively for active NTHS members.").fit === false);
check("audience: Folds of Honor (military family) excluded", fitsWhitefishAudience("Folds of Honor Scholarship", "For dependents and spouses of fallen or disabled US service members.").fit === false);

// audience: generic college-type phrasing NOT flagged as a specific institution
check("audience: 'junior college/trade school' fits", fitsWhitefishAudience("Junior College/Trade School Scholarship", "For students pursuing an associate degree at community college.").fit === true);
check("audience: 'one U.S. college or university' fits", fitsWhitefishAudience("X", "Awards $2,500 to one U.S. college, university, or trade school student.").fit === true);
check("audience: 'a U.S. university' fits", fitsWhitefishAudience("X", "Applicants must be high school seniors planning to attend a U.S. university.").fit === true);
check("audience: 'Ohio State University' still excluded", fitsWhitefishAudience("X", "Must enroll at Ohio State University.").fit === false);

// relevance: grad-INCLUSIVE (open to HS/undergrad too) is NOT excluded
check("relevance: grad-inclusive stays ok", assessRelevance("Conquering Cancer Scholarship", "Applicants must be enrolled in an undergraduate or graduate program, at least 17 years old.").level !== "exclude");

// relevance: grad + professional CE
check("relevance: 'graduate degree' excluded", assessRelevance("X", "For students pursuing a graduate degree.").level === "exclude");
check("relevance: 'registered nurse continuing education' review", assessRelevance("X", "For registered nurses continuing their education.").level !== "ok");
check("relevance: 'graduating high school seniors' stays ok", assessRelevance("X", "For graduating high school seniors.").level === "ok");

// isFundTotal precision
check("fund: '$1 million scholarship' is NOT a fund total", isFundTotal("$1 million scholarship") === false);
check("fund: '$7.5 million fund' IS a fund total", isFundTotal("$7.5 million fund") === true);
check("fund: '$2,000 from the Smith Memorial Fund' is NOT", isFundTotal("$2,000 from the Smith Memorial Fund") === false);

// normalizeAmount keeps bare amounts
check("amount: bare $10,000 kept", normalizeAmount("$10,000").value === 10000);

// ---- REVIEW-2 FIXES (2026-06-16, post-deploy multi-agent review) --------------------
// institution detector now catches out-of-state schools in normal prose
check("audience: 'attend Harvard University' excluded", fitsWhitefishAudience("Crimson Award", "Recipients attend Harvard University.").fit === false);
check("audience: 'Duke University freshmen' excluded", fitsWhitefishAudience("X", "Awarded to Duke University freshmen.").fit === false);
check("audience: MSU prose still fits", fitsWhitefishAudience("Hilleman", "For students starting at Montana State University.").fit === true);
check("audience: generic 'four-year college or university' still fits", fitsWhitefishAudience("X", "Open to students attending any four-year college or university.").fit === true);
// dedupe near-dups
check("dedupe: comma vs no-comma amount", findMasterDuplicate("Bold $25000 Scholarship", [{ name: "Bold $25,000 Scholarship", url: "" }]) === "Bold $25,000 Scholarship");
check("dedupe: year-suffix near-dup caught", findMasterDuplicate("ABC Scholarship 2025", [{ name: "ABC Scholarship", url: "" }]) === "ABC Scholarship");
check("dedupe: different amount NOT a dup", findMasterDuplicate("Bold $10,000 Scholarship", [{ name: "Bold $25,000 Scholarship", url: "" }]) === null);
check("dedupe: distinct longer name still NOT a dup", findMasterDuplicate("Presidential Scholarship", [{ name: "Presidential Leadership Scholarship", url: "" }]) === null);
// membership senior-class carve-out
check("audience: 'members of the senior class' fits", fitsWhitefishAudience("X", "Awarded to members of the senior class.").fit === true);
check("audience: 'members of the FFA' excluded", fitsWhitefishAudience("X", "Open to members of the FFA chapter.").fit === false);
// gold star metaphor vs military family
check("audience: 'gold star students' (metaphor) fits", fitsWhitefishAudience("Gold Star Student Award", "For gold star students with top grades.").fit === true);
check("audience: 'Gold Star families' excluded", fitsWhitefishAudience("X", "For Gold Star families of fallen soldiers.").fit === false);
// grad-inclusive tightened
check("relevance: 'any student in a doctoral program' excluded", assessRelevance("X", "Any student in a doctoral program.").level === "exclude");
check("relevance: 'open to all doctoral candidates' excluded", assessRelevance("X", "Open to all doctoral candidates.").level === "exclude");
check("relevance: HS+grad inclusive still ok", assessRelevance("X", "Open to high school seniors and graduate students.").level === "ok");
// isFundTotal endowment stem
check("fund: '$5 million endowment funds the award' IS a fund total", isFundTotal("$5 million endowment funds the award") === true);
// demonym tightened
check("audience: 'remainder of funds' fits (no false demonym)", fitsWhitefishAudience("X", "The remainder of funds support arts students.").fit === true);
check("audience: 'for Ohioans' excluded", fitsWhitefishAudience("X", "Scholarships for Ohioans pursuing college.").fit === false);

// ---- REVIEW-3 FIXES (2026-06-16, directory-crawl hardening) -------------------------
// Membership phrased without "members of": "<ORG> members", "current/active <ORG> members",
// "members enrolled", "dual membership", plural "members" after "must be" (was \bmember\b).
check("audience: 'current NTHS members' excluded", fitsWhitefishAudience("NTHS BPA Scholarship", "Three $1,000 scholarships to current NTHS members.").fit === false);
check("audience: 'members enrolled in automotive' excluded", fitsWhitefishAudience("ASE Scholarship", "A $500 scholarship to members enrolled in automotive programs.").fit === false);
check("audience: 'must be active OBAP members' excluded (plural)", fitsWhitefishAudience("OBAP Scholarship", "Applicants must be active OBAP members for at least 3 months, 17+ years old.").fit === false);
check("audience: 'must be PAPA members' excluded", fitsWhitefishAudience("PAPA Scholarship", "Applicants must be PAPA members, at least 18 years old.").fit === false);
check("audience: 'current WAI members' excluded", fitsWhitefishAudience("WAI2027 Scholarships", "Applicants must be current WAI members by August 30, 2026.").fit === false);
check("audience: 'dual-membership' excluded", fitsWhitefishAudience("NTHS FBLA Scholarship", "For students holding dual-membership with FBLA.").fit === false);
check("audience: 'AOPA members receive' excluded", fitsWhitefishAudience("AOPA Portal", "AOPA members receive exclusive access to aviation scholarship opportunities.").fit === false);
// membership carve-outs MUST still pass (no over-exclusion / buried good rows)
check("audience: 'members of the senior class' still fits", fitsWhitefishAudience("Senior Award", "Awarded to members of the senior class.").fit === true);
check("audience: 'community members' (benign) still fits", fitsWhitefishAudience("Community Award", "Open to all community members pursuing higher education.").fit === true);
check("audience: clean national 'AFSA awards' fits", fitsWhitefishAudience("AFSA No Essay Scholarship Program", "AFSA awards $1,000 scholarships to 10 students annually. Two contests.").fit === true);
check("audience: national welding (Miller) fits", fitsWhitefishAudience("Miller Electric National Scholarship", "Supports the next generation of welders by providing financial assistance for their education.").fit === true);
// named for-profit flight/aviation academy = institution-specific (captive tuition)
check("audience: 'Epic Flight Academy' scholarship excluded", fitsWhitefishAudience("Epic Flight Academy $5,000 Pilot Scholarship", "This scholarship is awarded by Epic Flight Academy to high school students pursuing pilot training.").fit === false);
check("audience: 'United Aviate Academy' excluded", fitsWhitefishAudience("United Aviate Academy Scholarship", "For applicants conditionally accepted to or currently enrolled at the United Aviate Academy.").fit === false);
check("audience: 'must relocate to' excluded", fitsWhitefishAudience("Aviation Maintenance Scholarship", "A $25,000 scholarship. Must be able to relocate to New Smyrna Beach, FL or Cincinnati.").fit === false);
// a national aviation scholarship NOT tied to a named academy still fits (career focus is OK)
check("audience: national flight-training scholarship (no academy) fits", fitsWhitefishAudience("Fly High Scholarship", "For U.S. high school seniors pursuing flight training at any accredited program.").fit === true);
// directory-listing stub excluded
check("audience: AOPA org-list stub excluded", fitsWhitefishAudience("Experimental Aircraft Association (EAA) Scholarship", "This organization offers scholarships to help individuals achieve their aviation goals. It is listed under industry scholarships.").fit === false);

console.log(failed === 0 ? "\nALL PASS" : `\n${failed} FAILED`);
process.exit(failed === 0 ? 0 : 1);
