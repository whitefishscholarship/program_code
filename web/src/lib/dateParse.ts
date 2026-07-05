// Shared deadline parsing for the Master Database `Due Date` column.
//
// This is the SINGLE date parser used by both the browse surface (browse.ts) and the
// matching wizard (processor.ts). It replaced a naive `new Date(dateStr)` in processor,
// which resolved bare month-name / month-day strings ("March 15", "Annual — May 31") to
// the YEAR 2001 and then dropped those live scholarships from the quiz as past-due.
//
// `Due Date` is hand-typed and messy. Beyond plain numeric dates it contains:
//   "12/1 (opens) - 3/1 (closes)"      -> a real CLOSE date (the deadline)
//   "(opens 03/15/26) closes 6/15/26"  -> a real CLOSE date with explicit years
//   "Opens 12/15"                       -> an OPEN date only, not a deadline
//   "Annual — May 31"                   -> a recurring month/day, no year
//   "March 1, 2027"                     -> month name with explicit year
//   "Info Available in December"        -> no resolvable day -> no date
// We extract the deadline so urgency colors mean something, while never inventing
// urgency: anything we can't resolve to a date degrades to 'tbd' ("Check site").
//
// Year policy (honest, not optimistic): explicit years are respected (a date with an
// explicit PAST year is treated as expired). When a year is ABSENT we infer the next
// future occurrence of that month/day — appropriate for a forward-looking browse of
// recurring annual scholarships.

const DAY_MS = 1000 * 60 * 60 * 24;

export function startOfDay(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export type DeadlineKind = 'hard' | 'opens' | 'rolling' | 'expired' | 'tbd';

export interface ParsedDeadline {
    kind: DeadlineKind;
    date: Date | null;
    // True when the year was inferred (no explicit year in the source string).
    inferredYear: boolean;
}

const EXPIRED_RE = /\b(expired|past\s*due|deadline\s*passed|closed)\b/i;
const ROLLING_RE = /\b(rolling|ongoing|anytime|year[\s-]?round|continuous|open\s+enrollment)\b/i;

// Numeric month/day with optional year, plus the match index so we can associate it
// with nearby words ("opens"/"closes").
const NUM_DATE_RE = /(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/g;

// Month names (full + common abbreviations). Used for "March 15", "May 31, 2027",
// "31 May", "Annual — Feb 15".
const MONTHS: Record<string, number> = {
    jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4,
    may: 5, jun: 6, june: 6, jul: 7, july: 7, aug: 8, august: 8, sep: 9, sept: 9,
    september: 9, oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12,
};
const MONTH_ALT = Object.keys(MONTHS).sort((a, b) => b.length - a.length).join('|');
// "March 15", "March 15, 2027", "Mar. 15"
const NAME_DAY_RE = new RegExp(`\\b(${MONTH_ALT})\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,?\\s+(\\d{4}))?`, 'gi');
// "15 March", "15th March 2027"
const DAY_NAME_RE = new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(${MONTH_ALT})\\.?(?:,?\\s+(\\d{4}))?`, 'gi');

interface DateToken {
    month: number;
    day: number;
    year: number | null;
    index: number;
}

function resolveYear(token: DateToken, now: Date): { date: Date | null; inferred: boolean } {
    const { month, day } = token;
    if (month < 1 || month > 12 || day < 1 || day > 31) return { date: null, inferred: false };

    if (token.year !== null) {
        const yr = token.year < 100 ? 2000 + token.year : token.year;
        const d = new Date(yr, month - 1, day);
        // Guard against rollovers like 2/31.
        if (d.getMonth() !== month - 1) return { date: null, inferred: false };
        return { date: d, inferred: false };
    }

    // No year given: pick the next occurrence on/after today.
    const today = startOfDay(now);
    let d = new Date(now.getFullYear(), month - 1, day);
    if (d.getMonth() !== month - 1) return { date: null, inferred: false };
    if (d < today) d = new Date(now.getFullYear() + 1, month - 1, day);
    return { date: d, inferred: true };
}

// Collect all date tokens (numeric M/D and month-name forms) in source order.
function collectTokens(str: string): DateToken[] {
    const tokens: DateToken[] = [];
    for (const m of str.matchAll(NUM_DATE_RE)) {
        tokens.push({
            month: parseInt(m[1], 10),
            day: parseInt(m[2], 10),
            year: m[3] !== undefined ? parseInt(m[3], 10) : null,
            index: m.index ?? 0,
        });
    }
    for (const m of str.matchAll(NAME_DAY_RE)) {
        const month = MONTHS[m[1].toLowerCase()];
        if (!month) continue;
        tokens.push({ month, day: parseInt(m[2], 10), year: m[3] !== undefined ? parseInt(m[3], 10) : null, index: m.index ?? 0 });
    }
    for (const m of str.matchAll(DAY_NAME_RE)) {
        const month = MONTHS[m[2].toLowerCase()];
        if (!month) continue;
        tokens.push({ month, day: parseInt(m[1], 10), year: m[3] !== undefined ? parseInt(m[3], 10) : null, index: m.index ?? 0 });
    }
    // Dedupe overlapping matches (a "March 15" can't also be a numeric token, but keep
    // stable order by source index).
    return tokens.sort((a, b) => a.index - b.index);
}

export function parseDeadline(raw: string | undefined, now: Date = new Date()): ParsedDeadline {
    const str = (raw == null ? '' : String(raw)).trim();
    if (!str) return { kind: 'tbd', date: null, inferredYear: false };

    const lower = str.toLowerCase();
    if (EXPIRED_RE.test(lower)) return { kind: 'expired', date: null, inferredYear: false };

    const tokens = collectTokens(str);

    // Rolling only matters when there isn't a concrete date to prefer.
    if (tokens.length === 0) {
        if (ROLLING_RE.test(lower)) return { kind: 'rolling', date: null, inferredYear: false };
        return { kind: 'tbd', date: null, inferredYear: false };
    }

    const hasClose = /clos|deadline|due|by\b/i.test(lower);
    const hasOpen = /open/i.test(lower);

    let chosen: DateToken;
    if (hasClose) {
        // "...closes Y" / "opens X - closes Y": the close date is the last one.
        chosen = tokens[tokens.length - 1];
    } else if (hasOpen && !hasClose) {
        // Open date only — informational, not a deadline.
        const opensTok = tokens[0];
        const r = resolveYear(opensTok, now);
        if (!r.date) return { kind: 'tbd', date: null, inferredYear: false };
        // If it already opened and we have no close date, we can't show urgency.
        if (r.date < startOfDay(now)) return { kind: 'tbd', date: null, inferredYear: false };
        return { kind: 'opens', date: r.date, inferredYear: r.inferred };
    } else {
        // Plain date(s). Pick the soonest future one; else the latest (most recent).
        const resolved = tokens
            .map(t => resolveYear(t, now))
            .filter((r): r is { date: Date; inferred: boolean } => r.date !== null);
        if (resolved.length === 0) return { kind: 'tbd', date: null, inferredYear: false };
        const today = startOfDay(now);
        const future = resolved.filter(r => r.date >= today).sort((a, b) => a.date.getTime() - b.date.getTime());
        if (future.length > 0) {
            return { kind: 'hard', date: future[0].date, inferredYear: future[0].inferred };
        }
        const latest = resolved.sort((a, b) => b.date.getTime() - a.date.getTime())[0];
        return { kind: 'expired', date: latest.date, inferredYear: latest.inferred };
    }

    const r = resolveYear(chosen, now);
    if (!r.date) return { kind: 'tbd', date: null, inferredYear: false };
    if (r.date < startOfDay(now)) return { kind: 'expired', date: r.date, inferredYear: r.inferred };
    return { kind: 'hard', date: r.date, inferredYear: r.inferred };
}

// Past-due = expired, or a resolved hard/close date before today.
export function isPastDue(d: ParsedDeadline, now: Date = new Date()): boolean {
    if (d.kind === 'expired') return true;
    if (d.kind === 'hard' && d.date && d.date < startOfDay(now)) return true;
    return false;
}

export { DAY_MS };
