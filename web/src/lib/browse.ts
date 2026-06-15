import { normalizeRow, ProcessedRow } from './processor';

export type RawRow = Record<string, string>;

export type UrgencyTone = 'red' | 'amber' | 'green' | 'blue' | 'gray';

export interface UrgencyBadge {
    label: string;
    tone: UrgencyTone;
}

// A scholarship row paired with its normalized fields and derived display data.
export interface BrowseItem {
    raw: RawRow;
    processed: ProcessedRow;
    deadline: ParsedDeadline;
    urgency: UrgencyBadge;
    amountDisplay: string;
    // Sort key for amount: known dollar value, or -1 for "Varies/unknown" so it
    // sorts to a neutral position rather than below genuine $0 awards.
    amountSort: number;
    applyHref: string | null;
    daysUntil: number | null;
}

const DAY_MS = 1000 * 60 * 60 * 24;

function startOfDay(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

// ---------------------------------------------------------------------------
// Deadline parsing (HANDOFF §4 #8)
//
// Master Database `Due Date` is hand-typed and messy. Beyond plain dates it
// contains:
//   "12/1 (opens) - 3/1 (closes)"      -> a real CLOSE date (the deadline)
//   "(opens 03/15/26) closes 6/15/26"  -> a real CLOSE date with explicit years
//   "Opens 12/15"                       -> an OPEN date only, not a deadline
//   "2/1/25 (Spring); 9/1/25 (Fall)"    -> multiple dated checkpoints
//   "Info Available in December"        -> no date at all
// We extract the deadline so urgency colors mean something, while never
// inventing urgency: anything we can't resolve to a date degrades to "Check site".
//
// Year policy (honest, not optimistic): explicit years are respected (a date
// with an explicit past year is treated as expired). When a year is ABSENT we
// infer the next future occurrence of that month/day — appropriate for a
// forward-looking browse of recurring annual scholarships.
// ---------------------------------------------------------------------------

export type DeadlineKind = 'hard' | 'opens' | 'rolling' | 'expired' | 'tbd';

export interface ParsedDeadline {
    kind: DeadlineKind;
    date: Date | null;
    // True when the year was inferred (no explicit year in the source string).
    inferredYear: boolean;
}

const EXPIRED_RE = /\b(expired|past\s*due|deadline\s*passed)\b/i;
const ROLLING_RE = /\b(rolling|ongoing|anytime|year[\s-]?round|continuous|open\s+enrollment)\b/i;
// month/day with optional year, plus the index so we can associate it with nearby words.
const DATE_RE = /(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/g;

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

export function parseDeadline(raw: string | undefined, now: Date = new Date()): ParsedDeadline {
    const str = (raw || '').trim();
    if (!str) return { kind: 'tbd', date: null, inferredYear: false };

    const lower = str.toLowerCase();
    if (EXPIRED_RE.test(lower)) return { kind: 'expired', date: null, inferredYear: false };

    const tokens: DateToken[] = [];
    for (const m of str.matchAll(DATE_RE)) {
        tokens.push({
            month: parseInt(m[1], 10),
            day: parseInt(m[2], 10),
            year: m[3] !== undefined ? parseInt(m[3], 10) : null,
            index: m.index ?? 0,
        });
    }

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

function daysUntil(date: Date | null, now: Date): number | null {
    if (!date) return null;
    return Math.ceil((startOfDay(date).getTime() - startOfDay(now).getTime()) / DAY_MS);
}

const DATE_FMT = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

// Map a parsed deadline to a colored urgency badge. Past-due rows are hidden
// upstream, so `hard` dates here are always today-or-later.
export function deriveUrgency(d: ParsedDeadline, now: Date = new Date()): UrgencyBadge {
    if (d.kind === 'hard' && d.date) {
        const days = daysUntil(d.date, now);
        const approx = d.inferredYear ? '~' : '';
        if (days !== null && days <= 14) return { label: 'Closing soon', tone: 'red' };
        if (days !== null && days <= 30) return { label: 'Due soon', tone: 'amber' };
        return { label: `Due ${approx}${DATE_FMT.format(d.date)}`, tone: 'green' };
    }
    if (d.kind === 'opens' && d.date) {
        return { label: `Opens ${DATE_FMT.format(d.date)}`, tone: 'blue' };
    }
    if (d.kind === 'rolling') return { label: 'Rolling deadline', tone: 'blue' };
    // 'tbd' (and any unresolved case) — degrade safely rather than invent urgency.
    return { label: 'Check site', tone: 'gray' };
}

// Prefer the human-typed Amount string for display. Treat Varies/TBD/empty as
// "Varies" so high-value-but-unspecified awards aren't shown as "$0" (HANDOFF §4 #7).
const VARIES_RE = /^(varies|tbd|n\/?a|unknown|see\s+site|multiple)\.?$/i;

export function displayAmount(row: RawRow, p: ProcessedRow): { text: string; sort: number } {
    const raw = (row['Amount'] || '').trim();
    if (!raw || VARIES_RE.test(raw)) return { text: 'Varies', sort: -1 };
    if (p.normalized.amount_max > 0) return { text: raw, sort: p.normalized.amount_max };
    // Has text but no parseable number (e.g. "Full tuition").
    return { text: raw, sort: -1 };
}

function looksLikeUrl(s: string | undefined): boolean {
    return !!s && /^https?:\/\//i.test(s.trim());
}

// Resolve the best Apply link: embedded hyperlink on the application column first,
// then the location column, then any raw cell that is itself a URL.
export function applyUrl(row: RawRow): string | null {
    const candidates = [
        row['Application Link/Method_url'],
        row['Scholarship Location/Information_url'],
        row['Name of Scholarship_url'],
    ];
    for (const c of candidates) {
        if (looksLikeUrl(c)) return c.trim();
    }
    for (const key of ['Application Link/Method', 'Scholarship Location/Information']) {
        if (looksLikeUrl(row[key])) return row[key].trim();
    }
    return null;
}

// Build a display-ready BrowseItem from a raw API row.
export function toBrowseItem(row: RawRow, now: Date = new Date()): BrowseItem {
    const processed = normalizeRow(row);
    const deadline = parseDeadline(row['Due Date'], now);
    const amount = displayAmount(row, processed);
    return {
        raw: row,
        processed,
        deadline,
        urgency: deriveUrgency(deadline, now),
        amountDisplay: amount.text,
        amountSort: amount.sort,
        applyHref: applyUrl(row),
        daysUntil: daysUntil(deadline.date, now),
    };
}

// Turn the API payload into active (non-past-due) browse items, skipping empty rows.
export function buildBrowseList(rows: RawRow[], now: Date = new Date()): BrowseItem[] {
    return rows
        .filter(row => {
            // A real row has data in at least 3 columns (mirrors processor.ts).
            let populated = 0;
            for (const k of Object.keys(row)) {
                if (k.endsWith('_url')) continue;
                if (row[k] && row[k].trim().length > 0) populated++;
            }
            return populated >= 3 && (row['Name of Scholarship'] || '').trim().length > 0;
        })
        .map(row => toBrowseItem(row, now))
        .filter(item => !isPastDue(item.deadline, now));
}
