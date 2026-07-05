import { normalizeRow, ProcessedRow } from './processor';
import { DAY_MS, startOfDay, parseDeadline, isPastDue, ParsedDeadline, DeadlineKind } from './dateParse';

// Re-export the shared deadline types/functions so existing importers of '@/lib/browse'
// keep working (the parser itself now lives in dateParse.ts, shared with processor.ts).
export { parseDeadline, isPastDue };
export type { ParsedDeadline, DeadlineKind };

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
                if (row[k] != null && String(row[k]).trim().length > 0) populated++;
            }
            return populated >= 3 && String(row['Name of Scholarship'] ?? '').trim().length > 0;
        })
        .map(row => toBrowseItem(row, now))
        .filter(item => !isPastDue(item.deadline, now));
}
