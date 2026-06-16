// Shared scholarship extraction: fetch/clean source text, run Gemini structured
// extraction, then apply the grounding honesty gate. Used by BOTH the admin extract
// route and the batch ingestion script so there is ONE extraction code path (no
// parallel Python system; HANDOFF locked decision).
import { GoogleGenAI, Type, Schema } from '@google/genai';
import * as cheerio from 'cheerio';
import { groundRecord, scoreConfidence, isFundTotal, assessRelevance, fitsWhitefishAudience } from './grounding';

// The Gemini structured-output schema (one object per distinct scholarship).
export const scholarshipSchema: Schema = {
    type: Type.ARRAY,
    description: 'List of all distinct scholarships found in the provided payload.',
    items: {
        type: Type.OBJECT,
        properties: {
            'New for 2026!': { type: Type.STRING, description: "Checkmark or 'x' if new for 2026, else empty" },
            'New for 2025!': { type: Type.STRING, description: "Checkmark or 'x' if new for 2025, else empty" },
            'Last Updated': { type: Type.STRING, description: 'Date the scholarship information was last updated or reviewed' },
            'Due Date': { type: Type.STRING, description: 'Application deadline date' },
            'In State / National': { type: Type.STRING, description: "Is it 'In-State', 'National', or 'Any'?" },
            'Portal / Scholarship': { type: Type.STRING, description: "Is it a 'Portal' or a specific 'Scholarship'?" },
            'Amount': { type: Type.STRING, description: "Dollar amount or 'TBD'" },
            'Location/Information': { type: Type.STRING, description: 'Sponsor or location/information about who offers it' },
            'Name of Scholarship': { type: Type.STRING, description: 'Exact name of the scholarship' },
            'Application Link/Method': { type: Type.STRING, description: "Method of applying. MUST include the URL if one is found." },
            'Summary': { type: Type.STRING, description: 'A 2-3 sentence summary of the eligibility constraints and what the scholarship is for' },
            'Stated Min GPA': { type: Type.STRING, description: "Minimum GPA required (e.g., '2.5', or 'Any' if not stated)" },
            'School Type': { type: Type.STRING, description: "Type of school: '2-Year', '4-Year', 'Trade', or 'Any'" },
            'Renewing/Non-Renewing': { type: Type.STRING, description: "'Renewing', 'Non-Renewing', or 'Any'" },
            'Focus': { type: Type.STRING, description: "Academic focus or major intended (e.g., 'Natural Resources', 'Any')" },
            'Acute Financial Need': { type: Type.STRING, description: "'Yes', 'No', or empty if unspecified" },
            'Accepts Gap Year Apps Upon Return': { type: Type.STRING, description: "Accepts Gap Year Applications Upon Return ('Yes' or empty)" },
        },
        required: ['Name of Scholarship', 'Due Date', 'Amount', 'Summary', 'School Type', 'Focus', 'Stated Min GPA'],
    },
};

export function buildPrompt(rawText: string, sourceRef: string): string {
    return `
        You are an expert scholarship directory extractor. I need you to read the following text and extract the relevant information.

        CRITICAL INSTRUCTION: DO NOT merge distinct scholarships together. If you see a landing page referencing 10 different specific scholarships, output an array containing 10 separate objects. Map the information to the requested JSON schema exactly.

        CRITICAL INSTRUCTIONS FOR SPECIFIC FIELDS:
        1. "Amount": You MUST look very hard for any monetary amounts. Do not leave this blank if any dollar figure or variable amount is mentioned.
        2. "Application Link/Method": Output a literal URL starting with "http" if you see one in the text. If you cannot find a specific application link, explicitly write: ${sourceRef}.
        3. "Stated Min GPA": Find any mention of GPA, Grades, Academic Standing. IF NOT STATED AT ALL, explicitly write "Any".
        4. "School Type": Identify if this is for a 2-Year, 4-Year, Trade school. IF NOT STATED, explicitly write "Any".
        5. "Renewing/Non-Renewing": If renewable, write "Renewing". If one-time or not stated, default to "Non-Renewing" or "Any".

        IMPORTANT: Only state facts that literally appear in the text below. Do not infer dollar amounts or GPAs that are not present — fabricated values will be rejected.

        Source Reference: ${sourceRef}

        Website/Document Text:
        ${rawText}
    `;
}

export type GroundedRecord = Record<string, unknown> & {
    _confidence: number;
    _flags: string[];
    _source: string;
    _relevance: 'ok' | 'review' | 'exclude';
    _audienceFit: boolean;
};

// Fetch a URL and reduce it to clean body text (same reduction the admin route uses).
const FETCH_TIMEOUT_MS = 20000;

export async function fetchUrlToText(url: string): Promise<string> {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
    const html = await res.text();
    const $ = cheerio.load(html);
    // strip only script/style/iframe — keep nav/footer/aside, since some directories list
    // scholarships inside <nav>/<aside> and removing them silently drops those rows.
    $('script, style, iframe').remove();
    let text = $('body').text().replace(/\s+/g, ' ').trim();
    if (text.length > 50000) {
        console.warn(`[fetchUrlToText] truncated ${url} from ${text.length} to 50000 chars — tail scholarships may be dropped`);
        text = text.substring(0, 50000);
    }
    return text;
}

// Enumerate on-page anchor links (absolute URLs + visible text) for a depth-1 crawl of
// link-hub / directory pages. De-duped by resolved URL; only http(s).
export async function fetchUrlLinks(url: string): Promise<Array<{ url: string; text: string }>> {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
    const $ = cheerio.load(await res.text());
    const out = new Map<string, string>();
    $('a[href]').each((_, a) => {
        const href = String($(a).attr('href') || '');
        const text = $(a).text().replace(/\s+/g, ' ').trim();
        try {
            const abs = new URL(href, url).toString().split('#')[0];
            if (/^https?:/i.test(abs) && !out.has(abs)) out.set(abs, text);
        } catch { /* skip malformed */ }
    });
    return [...out.entries()].map(([u, t]) => ({ url: u, text: t }));
}

// Run Gemini extraction over already-captured text, then GROUND every record's fields
// + name against that same source text and attach confidence + flags.
export async function extractScholarships(rawText: string, sourceRef: string): Promise<GroundedRecord[]> {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    // Bounded retry on transient Gemini errors (429/5xx/network) — extraction is idempotent.
    let response;
    let lastErr: unknown;
    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: buildPrompt(rawText, sourceRef),
                config: { responseMimeType: 'application/json', responseSchema: scholarshipSchema, temperature: 0.1 },
            });
            break;
        } catch (e) {
            lastErr = e;
            if (attempt < 3) await new Promise((r) => setTimeout(r, 800 * attempt));
        }
    }
    if (!response) throw new Error(`Gemini failed after retries: ${(lastErr as Error)?.message ?? lastErr}`);
    if (!response.text) throw new Error('AI returned an empty extraction.');
    const parsed = JSON.parse(response.text);
    const records: Record<string, unknown>[] = Array.isArray(parsed) ? parsed : [];
    return records.map((rec) => {
        const { record, flags } = groundRecord(rec, rawText);
        // Reject fund/endowment/donation totals masquerading as an award amount — these
        // pass value-grounding because the number really is on the page.
        const amt = String(record['Amount'] ?? '');
        if (amt && isFundTotal(amt)) {
            record['Amount'] = '';
            flags.push(`Amount "${amt.slice(0, 30)}" looks like a fund/endowment total, not an award — blanked`);
        }
        const name = String(record['Name of Scholarship'] ?? '');
        const summary = String(record['Summary'] ?? '');
        // Relevance for a graduating HS senior (grad-level / professional-only eligibility).
        const rel = assessRelevance(name, summary);
        if (rel.reasons.length) flags.push(`relevance(${rel.level}): ${rel.reasons.join('; ')}`);
        // Fit for a Whitefish, MT audience (national/MT vs out-of-state/membership/platform).
        const aud = fitsWhitefishAudience(name, summary);
        if (!aud.fit) flags.push(`audience: ${aud.reason}`);
        return { ...record, _confidence: scoreConfidence(record, flags), _flags: flags, _source: sourceRef, _relevance: rel.level, _audienceFit: aud.fit };
    });
}
