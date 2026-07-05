import { AnswerMap } from '@/types/wizard';
import { RulesPack } from './rulesPack';
import { parseDeadline } from './dateParse';

type RawRow = Record<string, string>;

export interface ProcessedRow {
    raw: RawRow;
    normalized: {
        due_date_type: 'hard' | 'rolling' | 'expired' | 'tbd';
        due_date_value: Date | null;
        amount_max: number;
        gpa: number | null;
        states: string[];
        is_national: boolean;
        school_types: string[]; // 2-Year, 4-Year, Trade, Any
        is_renewable: boolean | null;
        gap_year_allowed: boolean;
        requires_high_service: boolean;
        score: number;
    };
}

// Normalize a single row values without mutation
export function normalizeRow(row: RawRow): ProcessedRow {
    const norm: ProcessedRow['normalized'] = {
        due_date_type: 'tbd',
        due_date_value: null,
        amount_max: 0,
        gpa: null,
        states: [],
        is_national: false,
        school_types: [],
        is_renewable: null,
        gap_year_allowed: true,
        requires_high_service: false,
        score: 0
    };

    // 1. GPA
    const rawGpa = row['Stated Min. GPA'];
    if (rawGpa != null && rawGpa !== '') {
        const gpaStr = String(rawGpa);
        if (gpaStr.toLowerCase() !== 'any') {
            const match = gpaStr.match(/\d+(\.\d+)?/);
            if (match) norm.gpa = parseFloat(match[0]);
        }
    }

    // 2. Dates — use the SHARED parser (dateParse.ts), the same one the browse surface
    // uses, so the two views agree. The old naive `new Date(dateStr)` resolved bare
    // month-name/month-day strings ("March 15", "Annual — May 31") to the year 2001 and
    // silently dropped those live scholarships from the quiz as past-due. Anything the
    // parser can't resolve to a date degrades to 'tbd' (kept), never a year-2001 exclude.
    const rawDue = row['Due Date'];
    const dateStr = (rawDue == null ? '' : String(rawDue)).toLowerCase();
    if (RulesPack.dates.expired_keywords.some(r => r.test(dateStr))) {
        norm.due_date_type = 'expired';
    } else if (RulesPack.dates.rolling_keywords.some(r => r.test(dateStr))) {
        norm.due_date_type = 'rolling';
    } else if (dateStr) {
        const d = parseDeadline(String(rawDue));
        if (d.kind === 'expired') {
            norm.due_date_type = 'expired';
        } else if (d.kind === 'rolling') {
            norm.due_date_type = 'rolling';
        } else if (d.kind === 'hard' && d.date) {
            norm.due_date_type = 'hard';
            norm.due_date_value = d.date;
        } else {
            // 'opens' (informational) and 'tbd' (unresolvable) — keep the row, no hard date.
            norm.due_date_type = 'tbd';
        }
    }

    // 3. Location / National
    const location = String(row['In-State / National'] ?? '').toLowerCase();
    norm.is_national = location.includes('national') || location.includes('any');

    // 4. School Types
    const types = String(row['School Type (2-or 4-Year, or Trade)'] ?? '').toLowerCase();
    if (types.includes('any')) {
        norm.school_types = ['Two year', 'Four year', 'Trade'];
    } else {
        if (types.includes('2')) norm.school_types.push('Two year');
        if (types.includes('4')) norm.school_types.push('Four year');
        if (types.includes('trade')) norm.school_types.push('Trade');
    }

    // 5. Gap Year
    const gap = String(row['Accepts Gap Year Applications Upon Return'] ?? '').toLowerCase();
    if (gap === 'no') norm.gap_year_allowed = false;

    // 7. Amount Parsing (for ranking). Take the HIGHEST number in the string so a range
    // like "$500 - $2,000" ranks/scores on its $2,000 ceiling, not the $500 floor (the
    // field is named amount_max and is used as the high end for sort + score).
    const amountStr = String(row['Amount'] ?? '').replace(/,/g, '');
    const amtNums = amountStr.match(/\d+/g);
    if (amtNums && amtNums.length) {
        norm.amount_max = Math.max(...amtNums.map((n) => parseInt(n, 10)).filter(Number.isFinite));
    }

    // 8. Renewable
    norm.is_renewable = String(row['Renewing/ Non-Renewing'] ?? '').toLowerCase().includes('renewing');

    return { raw: row, normalized: norm };
}

export function processAndFilter(rows: RawRow[], answers: AnswerMap): RawRow[] {
    const { activeFacts, passiveSignals } = answers;
    const now = new Date();

    // 1. Pre-filter perfectly empty rows (or rows with just a stray space)
    // A real scholarship row should have data in at least 3 different columns.
    const processed = rows
        .filter(row => {
            let populatedCells = 0;
            for (const key of Object.keys(row)) {
                if (row[key] && typeof row[key] === 'string' && row[key].trim().length > 0) {
                    populatedCells++;
                }
            }
            return populatedCells >= 3;
        })
        .map(normalizeRow);

    // 2. Hard Excludes
    const filtered = processed.filter(item => {
        const n = item.normalized;

        // Check Date
        if (n.due_date_type === 'expired') return false;
        if (n.due_date_type === 'hard' && n.due_date_value && n.due_date_value < now) return false;

        // Check GPA
        // Student GPA must be >= stated min GPA
        if (n.gpa !== null && activeFacts.gpa !== null) {
            if (activeFacts.gpa < n.gpa) return false;
        }

        // Check School Type
        // If scholarship requires specific types, student must match at least one
        if (n.school_types.length > 0 && !n.school_types.includes('Any')) {
            const overlap = n.school_types.some(t => activeFacts.target_school_types.includes(t));
            if (!overlap && activeFacts.target_school_types.length > 0) return false;
        }

        // Check State (Strict requirement: local scholarships require you to live in that state)
        if (!n.is_national && activeFacts.state) {
            const locText = [
                item.raw['Scholarship Location/Information'],
                item.raw['Summary'],
                item.raw['Focus'],
            ].join(' ').toLowerCase();

            const isTargetState = locText.includes(activeFacts.state.toLowerCase());

            // If the local scholarship doesn't explicitly mention the user's state,
            // we assume it belongs to the default local region (Montana).
            // Therefore, if the user is NOT from Montana AND the scholarship doesn't mention their state, reject it.
            if (activeFacts.state !== 'Montana' && !isTargetState) {
                return false;
            }
        }

        // Check Gap Year Restrictions
        if (!n.gap_year_allowed && activeFacts.gap_year === true) return false;

        // Organization Affiliations logic has been merged into the Tier 1 Strict Exclusion engine below.

        // Hard eligibility GATES only: membership / affiliation / employer requirements.
        // Identity, demographic, health, and hardship criteria are NOT excluded here — they only
        // boost ranking (below), so an incidental mention never hides an eligible scholarship.
        const fullText = (item.raw['Summary'] || '') + ' ' + (item.raw['Focus'] || '') + ' ' + (item.raw['Name of Scholarship'] || '');
        const normText = fullText.toLowerCase();

        for (const [criteriaId, patterns] of Object.entries(RulesPack.requirements.eligibility_gates)) {
            // If the scholarship requires this affiliation and the student did not select it, exclude.
            if (patterns.some(r => r.test(normText))) {
                if (!passiveSignals.special_criteria.includes(criteriaId)) {
                    return false;
                }
            }
        }

        return true; // Student realistically qualifies
    });

    // 3. Ranking
    filtered.forEach(item => {
        let score = 0;
        const n = item.normalized;
        const sum = item.raw['Summary']?.toLowerCase() || '';

        // Amount Boost
        score += (n.amount_max / 1000); // 1 point per $1,000

        // Renewable
        if (n.is_renewable) score += 3;

        // Portal
        if (RulesPack.boosts.portal.some(r => r.test(sum))) score += 4;

        // Financial Need Alignment
        if (passiveSignals.financial_need === 'Yes' && RulesPack.boosts.financial_need.some(r => r.test(sum))) {
            score += 10;
        }

        // Criteria matches boost ranking — career interests, identity/demographic, AND affiliations.
        // A selected criterion that the scholarship mentions floats it toward the top (+15).
        const fullText = sum + ' ' + (item.raw['Focus']?.toLowerCase() || '') + ' ' + (item.raw['Name of Scholarship']?.toLowerCase() || '');
        for (const criteriaId of passiveSignals.special_criteria) {
            const patternGroups = [
                RulesPack.boosts.special_criteria[criteriaId as keyof typeof RulesPack.boosts.special_criteria],
                RulesPack.boosts.identity_criteria[criteriaId as keyof typeof RulesPack.boosts.identity_criteria],
                RulesPack.requirements.eligibility_gates[criteriaId as keyof typeof RulesPack.requirements.eligibility_gates],
            ];
            for (const patterns of patternGroups) {
                if (patterns && patterns.some(r => r.test(fullText))) {
                    score += 15;
                    break;
                }
            }
        }

        // Penalties
        if (RulesPack.penalties.essay.some(r => r.test(fullText))) score -= 2;

        item.normalized.score = score;
    });

    // Sort descending by score
    filtered.sort((a, b) => b.normalized.score - a.normalized.score);

    // Return exactly the raw rows (preserves identical headers)
    return filtered.map(f => f.raw);
}
