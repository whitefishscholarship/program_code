// Grounding honesty gate over Gemini's extraction — TS port of the corrected
// verify_pipeline.py logic (HANDOFF bugs #3 numeric value-match, #13 source grounding).
//
// Gemini stays the extractor; this module is the honesty check over its output: every
// grounded field (and the NAME) must be provably present in the captured source text,
// matched BY VALUE for numbers (not substring), or it is blanked and flagged. Each
// record also gets a confidence score and dedupe helpers vs the live Master Database.

// ---------------------------------------------------------------- value-match grounding
// A number token: a full numeric literal with optional thousands-commas + decimal part.
const NUM_TOKEN = /\d[\d,]*(?:\.\d+)?/g;

function asNumber(tok: string): number | null {
  const n = Number(tok.replace(/,/g, ""));
  return Number.isFinite(n) ? Math.round(n * 10000) / 10000 : null;
}

function sourceNumbers(src: string): Set<number> {
  const out = new Set<number>();
  for (const tok of src.match(NUM_TOKEN) || []) {
    const n = asNumber(tok);
    if (n !== null) out.add(n);
  }
  return out;
}

// Sentinels that are categorical, not literal page text — always "grounded".
const GROUND_SENTINELS = new Set(["any", "varies", "tbd", "full tuition / waiver", "n/a", ""]);

// Filler words carrying no grounding signal — excluded from the token-overlap check so a
// value like "ranging from $250 to $14,000" isn't blanked over its words, while a value
// like "Imaginary 2026 Leadership Scholarship" is still checked on its meaningful tokens.
const GROUND_FILLER = new Set([
  "ranging", "from", "per", "year", "each", "annually", "annual", "and", "the", "for", "one",
  "two", "three", "varies", "semester", "total", "award", "awards", "scholarship", "scholarships",
  "program", "fund", "value", "worth", "amount",
]);

// True if `value` is provably present in `sourceText`. Numbers match by VALUE against the
// discrete numbers in the source (not substring): $5,000 must NOT ground against $50,000;
// GPA 3.5 must NOT ground against $13.50. If the value also has meaningful word tokens,
// >=60% must appear — so a fabricated name sharing only a number can't self-ground.
export function groundValue(value: string, sourceText: string): boolean {
  const v = (value ?? "").toString().trim();
  if (!v || GROUND_SENTINELS.has(v.toLowerCase())) return true;
  const src = sourceText.replace(/\s+/g, " ").toLowerCase();
  const valNums = v.match(NUM_TOKEN);
  if (valNums && valNums.length) {
    const srcNums = sourceNumbers(src);
    for (const tok of valNums) {
      const n = asNumber(tok);
      if (n === null || !srcNums.has(n)) return false;
    }
  }
  const toks = v
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2 && !/^\d+$/.test(t) && !GROUND_FILLER.has(t));
  if (toks.length) {
    const hits = toks.filter((t) => src.includes(t)).length;
    if (hits / toks.length < 0.6) return false;
  }
  return true;
}

// The record fields that must be grounded against source (mirrors the Python set).
// Keys cover both the extract-route schema spellings and the live-sheet spellings.
const GROUNDED_FIELDS = [
  ["Name of Scholarship", "name"],
  ["Amount", "amount"],
  ["Stated Min GPA", "Stated Min. GPA"],
  ["Location/Information", "Scholarship Location/Information"],
  ["Focus", "focus"],
  ["Summary", "summary"],
] as const;

// Blank + flag any grounded field not provably in `sourceText`. Mutates a shallow copy.
export function groundRecord<T extends Record<string, unknown>>(
  record: T,
  sourceText: string,
): { record: T; flags: string[] } {
  const rec = { ...record };
  const flags: string[] = [];
  const seen = new Set<string>();
  for (const variants of GROUNDED_FIELDS) {
    for (const key of variants) {
      if (seen.has(key) || !(key in rec)) continue;
      seen.add(key);
      const val = rec[key];
      if (val && !groundValue(String(val), sourceText)) {
        (rec as Record<string, unknown>)[key] = "";
        flags.push(`UNGROUNDED ${key} '${String(val).slice(0, 30)}' not found in source — blanked`);
      }
    }
  }
  return { record: rec, flags };
}

// ---------------------------------------------------------------- trap-aware amount
const AMOUNT_AWARD_CUES = /scholarship|award|waiver|stipend|grant|prize|each|receive|valued|value of|per year|\/\s*yr|tuition/i;
const AMOUNT_TRAP_CUES = /donat|pledg|endow|raised|\bgift\b|in memory|to fund|over the next|to date|\bmillion\b|\bbillion\b|budget|salary|has given|contribut|net worth|total of .{0,25}award|awarded (?:over|more than)/i;

// Returns a trap-aware award amount derived from source text (donation/endowment
// sentences are skipped). Used to cross-check Gemini's Amount and flag disagreement.
export function normalizeAmount(text: string): { display: string; value: number; flags: string[] } {
  const flags: string[] = [];
  const low = text.toLowerCase();
  if (/full[- ]tuition|tuition waiver|covers? full tuition/.test(low) && !/\$/.test(text)) {
    return { display: "Full tuition / waiver", value: 0, flags: ["non-cash award"] };
  }
  const kept: number[] = [];
  for (const sent of text.split(/(?<=[.;\n])\s+/)) {
    if (AMOUNT_TRAP_CUES.test(sent)) continue;
    if (!AMOUNT_AWARD_CUES.test(sent)) continue;
    for (const m of sent.matchAll(/\$\s?([\d,]+(?:\.\d{2})?)/g)) {
      const v = parseInt(m[1].replace(/,/g, "").split(".")[0], 10);
      if (Number.isFinite(v)) kept.push(v);
    }
  }
  if (!kept.length) {
    if (/\bvaries\b|varies by|amount varies|tbd/.test(low)) return { display: "Varies", value: 0, flags: ["amount varies/TBD"] };
    // Bare "$10,000" with no award/trap context is still a valid amount — keep it neutrally
    // rather than blanking, as long as no trap cue appears anywhere.
    if (!AMOUNT_TRAP_CUES.test(text)) {
      const bare = [...text.matchAll(/\$\s?([\d,]+(?:\.\d{2})?)/g)].map((m) => parseInt(m[1].replace(/,/g, "").split(".")[0], 10)).filter(Number.isFinite);
      if (bare.length) {
        const h = Math.max(...bare), l = Math.min(...bare);
        return { display: l === h ? `$${h.toLocaleString("en-US")}` : `$${l.toLocaleString("en-US")} – $${h.toLocaleString("en-US")}`, value: h, flags: [] };
      }
    }
    return { display: "", value: 0, flags: ["no grounded award amount found"] };
  }
  const hi = Math.max(...kept);
  const lo = Math.min(...kept);
  if (/up to\s*\$/.test(low)) flags.push("up-to (max, not guaranteed)");
  if (hi > 0 && hi < 250) flags.push("implausibly low award (<$250) — verify at source");
  const display = lo === hi ? `$${hi.toLocaleString("en-US")}` : `$${lo.toLocaleString("en-US")} – $${hi.toLocaleString("en-US")}`;
  return { display, value: hi, flags };
}

// True if an Amount string looks like a fund/endowment/donation TOTAL rather than an
// award a student receives (e.g. "$7.5 million fund", "$4.2 million endowment"). These
// pass value-grounding (the number IS on the page) so they must be caught by wording.
export function isFundTotal(amount: string): boolean {
  const a = (amount || '').toLowerCase();
  if (/\b(endow|donat|raised|budget|portfolio|net worth)\b/.test(a)) return true;
  // "$X million/billion" is a fund/endowment total UNLESS it's clearly the per-recipient
  // award (e.g. "$1 million scholarship"). Bare "fund"/"gift" alone is too blunt and was
  // blanking legit amounts like "$2,000 from the Smith Memorial Fund", so it's dropped.
  if (/\b(million|billion)\b/.test(a) && !/\b(scholarship|award|prize|grant|each|per (?:student|winner|recipient|year))\b/.test(a)) return true;
  return false;
}

// ---------------------------------------------------------------- relevance (HS senior)
// Assess whether a scholarship plausibly applies to a graduating U.S. high-school senior.
// Conservative: returns 'exclude' only for clear grad-level signals, 'review' for narrow
// professional/membership eligibility, else 'ok'. Reasons drive a HOLD/REVIEW status in
// staging — never an auto-delete (a human confirms).
export function assessRelevance(name: string, summary: string): { level: 'ok' | 'review' | 'exclude'; reasons: string[] } {
  // mask "undergraduate" so it doesn't trip the "graduate" check
  const text = `${name} ${summary}`.toLowerCase().replace(/undergraduate/g, 'ugrad');
  const reasons: string[] = [];
  if (/\b(graduate students?|graduate scholarship|graduate degree|graduate[- ]level|graduate program|grad school|for graduates|master'?s (?:degree|student|program)|\bms\/phd\b|doctoral|doctorate|ph\.?\s?d|postgraduate|post-graduate|mba|law school|medical school)\b/.test(text)) {
    return { level: 'exclude', reasons: ['graduate/professional-school level — not for HS seniors'] };
  }
  const reviewCues: [RegExp, string][] = [
    [/\b(a&p|airframe and powerplant)\b/, 'A&P mechanic certification'],
    [/\btype rating\b/, 'pilot type rating (for existing pilots)'],
    [/\b(cfi|atp certificate|commercial pilot certificate|currently certificated|already hold)\b/, 'requires an existing pilot/professional certificate'],
    [/\b(registered nurses?|\brn\b|nurse practitioner|medical resident|currently (?:employed|practicing|licensed)|continuing (?:their )?education|working professional)\b/, 'for working professionals (continuing education)'],
    [/\b(members? of|membership in|employees? of|dependents? of (?:members|employees))\b/, 'membership/employer-restricted eligibility'],
    [/\bcurrently enrolled (?:in|at) (?:a |an )?(?:college|university|graduate)\b/, 'for students already enrolled in college'],
  ];
  for (const [re, why] of reviewCues) if (re.test(text)) reasons.push(why);
  return { level: reasons.length ? 'review' : 'ok', reasons };
}

// Whether a scholarship plausibly fits a Whitefish, MT high-school senior: i.e. it is
// nationally open (or Montana), not restricted to another state, not membership/employer/
// professional-only, not a search platform, not school-specific. High-precision: only
// returns false when a clear restriction is detected. Training-LOCATION mentions (e.g.
// "New Smyrna Beach") do not count — only residency restrictions do.
const US_STATES_NON_MT = [
  'alabama', 'alaska', 'arizona', 'arkansas', 'california', 'colorado', 'connecticut', 'delaware',
  'florida', 'georgia', 'hawaii', 'idaho', 'illinois', 'indiana', 'iowa', 'kansas', 'kentucky',
  'louisiana', 'maine', 'maryland', 'massachusetts', 'michigan', 'minnesota', 'mississippi', 'missouri',
  'nebraska', 'nevada', 'new hampshire', 'new jersey', 'new mexico', 'new york', 'north carolina',
  'north dakota', 'ohio', 'oklahoma', 'oregon', 'pennsylvania', 'rhode island', 'south carolina',
  'south dakota', 'tennessee', 'texas', 'utah', 'vermont', 'virginia', 'washington', 'west virginia',
  'wisconsin', 'wyoming', 'district of columbia',
];
// Montana institutions a Whitefish senior would plausibly attend — being tied to one of
// these is NOT a disqualifying restriction (FVCC is in neighboring Kalispell; MSU/UM are
// the state flagships). A scholarship tied to a *different* specific college (e.g. a small
// out-of-area community college's internal awards) is held for review.
const FRIENDLY_INSTITUTIONS = [
  'montana state university', 'university of montana', 'montana tech', 'montana technological university',
  'flathead valley community college', 'carroll college', 'rocky mountain college', 'university of providence',
  'salish kootenai college', 'montana state university billings', 'great falls college', 'helena college',
  'university of montana western',
];
// Common single-word demonyms for non-Montana states (adjective form of residency).
const NON_MT_DEMONYMS = [
  'alabamian', 'alaskan', 'arizonan', 'arkansan', 'californian', 'coloradan', 'connecticuter',
  'delawarean', 'floridian', 'georgian', 'hawaiian', 'idahoan', 'illinoisan', 'indianan', 'iowan',
  'kansan', 'kentuckian', 'louisianan', 'mainer', 'marylander', 'michigander', 'minnesotan',
  'mississippian', 'missourian', 'nebraskan', 'nevadan', 'new yorker', 'ohioan', 'oklahoman',
  'oregonian', 'pennsylvanian', 'tennessean', 'texan', 'utahn', 'vermonter', 'virginian',
  'washingtonian', 'wisconsinite', 'wyomingite',
];
// Generic/filler words that, before "college/university", do NOT make a proper institution name.
const INST_GENERIC = new Set([
  'a', 'an', 'the', 'any', 'or', 'and', 'to', 'at', 'for', 'of', 'in', 'on', 'attend', 'attends',
  'attending', 'enroll', 'enrolled', 'enrolling', 'starting', 'start', 'students', 'student',
  'planning', 'plan', 'graduating', 'graduate', 'seniors', 'senior', 'eligible', 'participating',
  'accredited', 'four', 'two', 'year', 'years', 'trade', 'vocational', 'post', 'secondary',
  'postsecondary', 'public', 'private', 'local', 'chosen', 'partner', 'your', 'their', 'our',
  'this', 'that', 'named', 'us', 'u.s', 'american', 'nationally', 'online', 'full', 'time', 'good',
  'standing', 'who', 'be', 'must', 'will', 'first', 'second', 'third', 'community',
]);

// Returns a specific, non-Montana-relevant institution this scholarship is tied to, or null.
// Requires a proper-noun name before the college/university suffix (so "any four-year college
// or university" and "an accredited college" do NOT match), and allowlists Montana schools.
function namedInstitution(t: string): string | null {
  for (const m of t.matchAll(/\b([a-z][a-z.'&-]*(?:\s+[a-z][a-z.'&-]*){0,4})\s+(community college|college|university|institute)\b/g)) {
    const words = m[1].split(/[\s-]+/); // split hyphens too so "four-year" → four, year (generic)
    while (words.length && INST_GENERIC.has(words[0])) words.shift(); // trim leading filler
    if (!words.length || words.some((w) => INST_GENERIC.has(w))) continue; // bare or generic inside
    const inst = `${words.join(' ')} ${m[2]}`;
    if (FRIENDLY_INSTITUTIONS.some((f) => inst.includes(f) || f.includes(inst))) continue;
    return inst;
  }
  // "University of <Place>" form (suffix-first; not caught above)
  const uof = t.match(/\buniversity of ([a-z][a-z]+(?:\s[a-z]+)?)\b/);
  if (uof) {
    const inst = `university of ${uof[1]}`;
    if (!FRIENDLY_INSTITUTIONS.some((f) => inst.includes(f) || f.includes(inst))) return inst;
  }
  return null;
}

export function fitsWhitefishAudience(name: string, summary: string): { fit: boolean; reason: string } {
  const t = `${name} ${summary}`.toLowerCase();
  if (/scholarship universe|platform used by|search (tool|platform)|tool (used )?to (find|search)/.test(t)) {
    return { fit: false, reason: 'a scholarship-search platform, not a scholarship' };
  }
  if (/\bfor (current,? )?(paid,? )?(full-time )?teachers?\b|\beducators? utilizing\b/.test(t)) {
    return { fit: false, reason: 'for teachers, not students' };
  }
  // membership/employer-restricted — but NOT benign "members of the public/community"
  if ((/\b(members?|employees?|dependents?) of\b|\bopen to all .*members\b|repair station member/.test(t)
        && !/members? of the (public|community)/.test(t))
      || /\b(must be|only) .{0,20}\bmember\b/.test(t)) {
    return { fit: false, reason: 'membership/employer-restricted' };
  }
  if (/\bavionics (technician|manager)|already hold|currently certificated|at least \d+ hours of (logged )?flight|commercial pilot certificate (and|with)/.test(t)) {
    return { fit: false, reason: 'requires existing professional certificate/experience' };
  }
  if (/charter school'?s choosing|must attend (a |the )?[a-z .]+ (charter )?school\b/.test(t)) {
    return { fit: false, reason: 'restricted to a specific school' };
  }
  // residency restriction to a non-Montana state/locale — noun form ("residents of Ohio"),
  // adjective form ("Ohio residents", "Texas high school seniors"), demonyms, and HS form.
  const states = US_STATES_NON_MT.join('|');
  const resNoun = new RegExp(`\\b(residents?\\s+of|who\\s+reside\\s+in|residing\\s+in|live\\s+in)\\b[^.]{0,40}\\b(${states})\\b`, 'i');
  const resAdj = new RegExp(`\\b(${states})\\s+(residents?|students?|high schoolers?|high[- ]school (?:seniors?|students?|graduates?)|teens?)\\b`, 'i');
  const resFromHs = new RegExp(`\\b(?:from|in|at)\\s+(?:a\\s+)?(${states})\\s+high school\\b`, 'i');
  const resDemonym = new RegExp(`\\b(${NON_MT_DEMONYMS.join('|')})s?\\b`, 'i');
  if (resNoun.test(t) || resAdj.test(t) || resFromHs.test(t) || resDemonym.test(t) || /ashtabula county/.test(t)) {
    return { fit: false, reason: 'residency restricted to a non-Montana state' };
  }
  // restricted to graduates of a specific (non-Whitefish) high school
  const hs = t.match(/\bgraduates?\s+of\s+(?:the\s+)?([a-z][a-z .'&-]*high school)\b/);
  if (hs && !/whitefish/.test(hs[1])) return { fit: false, reason: `restricted to ${hs[1].trim()} graduates` };
  // tied to a specific non-Montana-relevant institution
  const inst = namedInstitution(t);
  if (inst) return { fit: false, reason: `tied to a specific institution (${inst})` };
  return { fit: true, reason: '' };
}

// ---------------------------------------------------------------- gpa
// Returns a qualifying-GPA value (prefers "to qualify" over "to maintain") + flags.
export function normalizeGpa(text: string): { value: string; flags: string[] } {
  const low = text.toLowerCase();
  const flags: string[] = [];
  if (/no (?:minimum |min\.? )?gpa|gpa.{0,8}not required|no gpa requirement/.test(low)) {
    return { value: "Any", flags: ["explicitly no GPA minimum"] };
  }
  if (/top \d+\s*(?:%|percent)|class rank/.test(low)) flags.push("eligibility is class-rank, not a GPA number");
  let qualify =
    low.match(/(\d\.\d+)\s*(?:cumulative\s*)?gpa[^.]{0,40}(?:to (?:qualify|apply)|or higher|minimum|required)/) ||
    low.match(/(?:minimum|min\.?|at least|gpa of|gpa:?)\s*(\d\.\d+)/) ||
    low.match(/(\d\.\d+)\s*(?:or higher\s*)?(?:cumulative\s*)?gpa/);
  const maintain = low.match(/(\d\.\d+)[^.]{0,30}to maintain/);
  if (maintain && qualify && maintain[1] !== qualify[1]) {
    flags.push(`${maintain[1]} GPA to maintain (separate from qualifying GPA)`);
  }
  if (qualify) return { value: qualify[1], flags };
  return { value: "", flags: flags.length ? flags : ["no GPA stated"] };
}

// ---------------------------------------------------------------- confidence
// 5..98 confidence. Starts at 50, rewards grounded core fields, penalizes blank/flagged.
export function scoreConfidence(record: Record<string, unknown>, flags: string[]): number {
  let c = 50;
  const has = (...keys: string[]) => keys.some((k) => record[k] && String(record[k]).trim() !== "");
  if (has("Amount", "amount")) c += 12;
  if (has("Stated Min GPA", "Stated Min. GPA")) c += 8;
  if (has("Due Date")) c += 8;
  if (has("Name of Scholarship", "name")) c += 5;
  if (has("Summary", "summary")) c += 5;
  const ungrounded = flags.filter((f) => f.startsWith("UNGROUNDED")).length;
  c -= 12 * ungrounded;
  c -= 4 * (flags.length - ungrounded);
  return Math.max(5, Math.min(98, c));
}

// ---------------------------------------------------------------- dedupe vs master
const NAME_STOP = new Set([
  "the", "a", "an", "scholarship", "scholarships", "award", "awards", "program", "programs",
  "foundation", "memorial", "fund", "of", "for", "and", "annual",
]);

export function nameTokens(name: string): Set<string> {
  return new Set(
    (name || "")
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      // keep words >2 chars AND any pure-number token (so "$25,000" vs "$10,000" in a
      // name stay distinct — their 25/10 tokens are kept, not dropped as too-short)
      .filter((t) => (t.length > 2 || /^\d+$/.test(t)) && !NAME_STOP.has(t)),
  );
}

// Name reduced to a normalized string (for full-string compare when token set is empty).
function normName(s: string): string {
  return (s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

// Normalize a URL for comparison (host + path, lowercased, no protocol/query/trailing slash).
export function normalizeUrl(raw: string): string {
  const m = (raw || "").match(/https?:\/\/([^\s"']+)/i);
  if (!m) return "";
  return m[1].toLowerCase().replace(/\/+$/, "").split(/[?#]/)[0];
}

export interface MasterRef {
  name: string;
  url: string;
}

// Returns the matching entry's name if this record duplicates an existing one by NAME
// (token-sets equal, or the record's tokens are a subset of an existing entry's), else
// null. Dedupe is name-based on purpose: many distinct scholarships share one landing
// URL on list pages, so URL equality must NOT collapse them (use findUrlCollision to
// flag those for review instead).
export function findMasterDuplicate(recName: string, master: MasterRef[]): string | null {
  const tk = nameTokens(recName);
  const norm = normName(recName);
  for (const m of master) {
    if (!tk.size) {
      // name is all stop-words (e.g. "Memorial Scholarship") — compare full normalized
      // string so it still dedupes/blocks instead of always returning null (double-push risk)
      if (norm && normName(m.name) === norm) return m.name;
      continue;
    }
    const mtk = nameTokens(m.name);
    // EQUALITY, not subset: "Presidential Scholarship" must NOT collapse into
    // "Presidential Leadership Scholarship" (distinct awards). Stricter = fewer false skips.
    if (mtk.size === tk.size && [...tk].every((t) => mtk.has(t))) return m.name;
  }
  return null;
}

// Returns the name of an entry sharing this record's normalized URL (a soft signal —
// expected and harmless on multi-scholarship list pages), else null.
export function findUrlCollision(recUrl: string, refs: MasterRef[]): string | null {
  const u = normalizeUrl(recUrl);
  if (!u) return null;
  for (const m of refs) {
    if (normalizeUrl(m.url) === u) return m.name;
  }
  return null;
}
