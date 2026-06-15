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
    urgency: UrgencyBadge;
    amountDisplay: string;
    // Sort key for amount: known dollar value, or -1 for "Varies/unknown" so it
    // sorts to a neutral position rather than below genuine $0 awards.
    amountSort: number;
    applyHref: string | null;
    daysUntil: number | null;
}

const DAY_MS = 1000 * 60 * 60 * 24;

// Past-due = expired keyword, or a real (hard) date that is already behind us.
export function isPastDue(p: ProcessedRow, now: Date = new Date()): boolean {
    const n = p.normalized;
    if (n.due_date_type === 'expired') return true;
    if (n.due_date_type === 'hard' && n.due_date_value && n.due_date_value < now) return true;
    return false;
}

function daysUntil(date: Date | null, now: Date): number | null {
    if (!date) return null;
    return Math.ceil((date.getTime() - now.getTime()) / DAY_MS);
}

const DATE_FMT = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

// Map normalized due-date info to a colored urgency badge. Past-due rows are
// hidden upstream, so here `hard` dates are always in the future.
export function deriveUrgency(p: ProcessedRow, now: Date = new Date()): UrgencyBadge {
    const n = p.normalized;

    if (n.due_date_type === 'hard' && n.due_date_value) {
        const days = daysUntil(n.due_date_value, now);
        if (days !== null && days <= 14) return { label: 'Closing soon', tone: 'red' };
        if (days !== null && days <= 30) return { label: 'Due soon', tone: 'amber' };
        return { label: `Due ${DATE_FMT.format(n.due_date_value)}`, tone: 'green' };
    }

    if (n.due_date_type === 'rolling') return { label: 'Rolling deadline', tone: 'blue' };

    // 'tbd' — includes messy Master Database values like "Opens 12/15" that don't
    // parse to a real deadline. Degrade safely rather than invent urgency.
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
    const amount = displayAmount(row, processed);
    return {
        raw: row,
        processed,
        urgency: deriveUrgency(processed, now),
        amountDisplay: amount.text,
        amountSort: amount.sort,
        applyHref: applyUrl(row),
        daysUntil: daysUntil(processed.normalized.due_date_value, now),
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
        .filter(item => !isPastDue(item.processed, now));
}
