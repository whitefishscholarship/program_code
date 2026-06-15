// First-batch ingestion: Scraped Data -> grounded extraction -> dedupe -> staging tab,
// then (on `push`) append approved rows into the live Master Database. Reuses the SAME
// shared libs as the admin route (extract + grounding + pushMapping) — one code path.
//
//   npx tsx scripts/ingest-batch.ts          # stage a fresh batch into "Ingestion Staging"
//   npx tsx scripts/ingest-batch.ts push     # append Status=NEW staging rows to Master Database
//
// Develops on the COPY sheet only. Never touches the school master.
import { config } from 'dotenv';
config({ path: '.env.local' }); // Next.js local env (GEMINI_API_KEY, sheet id, SA creds)
import { google, sheets_v4 } from 'googleapis';
import { fetchUrlToText, extractScholarships, GroundedRecord } from '../src/lib/extract';
import { findMasterDuplicate, findUrlCollision, nameTokens, MasterRef } from '../src/lib/grounding';
import { STUDENT_HEADERS, mapRecordToRow, assertWritableHeaders } from '../src/lib/pushMapping';

const SHEET_ID = process.env.GOOGLE_SHEET_ID!;
const SCRAPED_TAB = 'Scraped Data';
const MASTER_TAB = 'Master Database';
const STAGING_TAB = 'Ingestion Staging';
const STAGING_EXTRA = ['Confidence', 'Flags', 'Source URL', 'Status'];

const PAGE_LIMIT = 18; // number of candidate PAGES to process (each may yield several scholarships)
const PAGE_CAP = 10; // max scholarships kept per page (flag + cap big list pages)
const BAD_HOSTS = ['google.com', 'bing.com', 'scholarships.com', 'fastweb', 'bold.org', 'goingmerry', 'scholarshipowl', 'niche.com', 'cappex', 'unigo', 'careeronestop', 'collegeboard', 'salliemae', 'petersons'];

function getSheets(): sheets_v4.Sheets {
    const rawCreds = process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS!;
    let credentials: Record<string, unknown>;
    try {
        credentials = JSON.parse(rawCreds);
    } catch {
        credentials = JSON.parse(Buffer.from(rawCreds, 'base64').toString('utf-8'));
    }
    if (typeof credentials.private_key === 'string') {
        credentials.private_key = (credentials.private_key as string).replace(/\\n/g, '\n');
    }
    const auth = new google.auth.GoogleAuth({ credentials, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    return google.sheets({ version: 'v4', auth });
}

function firstUrl(s: string): string {
    const m = (s || '').match(/https?:\/\/[^\s,]+/);
    return m ? m[0] : '';
}

async function readTab(sheets: sheets_v4.Sheets, tab: string): Promise<Record<string, string>[]> {
    const resp = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: `${tab}` });
    const rows = resp.data.values || [];
    if (!rows.length) return [];
    const headers = rows[0].map(String);
    return rows.slice(1).map((r) => Object.fromEntries(headers.map((h, i) => [h, String(r[i] ?? '')])));
}

function selectCandidates(scraped: Record<string, string>[]): { name: string; url: string }[] {
    const seen = new Set<string>();
    const out: { name: string; url: string }[] = [];
    for (const r of scraped) {
        const url = firstUrl(r['Application Link/Method'] || '');
        const name = (r['Name of Scholarship'] || '').trim();
        const portal = (r['Portal/ Scholarship'] || '').trim();
        if (!url || !name) continue;
        if (portal.toLowerCase().startsWith('portal')) continue; // exclude portals
        let host = '';
        try { host = new URL(url).host.toLowerCase(); } catch { continue; }
        if (BAD_HOSTS.some((b) => host.includes(b))) continue; // junk/aggregator
        if (/\b(directory|list of|various|multiple|portal|database|aggregat|search)\b/i.test(name)) continue;
        let path = '';
        try { path = new URL(url).pathname.replace(/\/+$/, ''); } catch { /* */ }
        if (!path) continue; // require a specific page, not a bare domain
        const key = (host + path).toLowerCase();
        if (seen.has(key)) continue; // distinct URL only
        seen.add(key);
        out.push({ name, url });
    }
    return out;
}

async function ensureStagingTab(sheets: sheets_v4.Sheets): Promise<void> {
    const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID, fields: 'sheets(properties(title))' });
    const exists = (meta.data.sheets || []).some((s) => s.properties?.title === STAGING_TAB);
    if (!exists) {
        await sheets.spreadsheets.batchUpdate({ spreadsheetId: SHEET_ID, requestBody: { requests: [{ addSheet: { properties: { title: STAGING_TAB } } }] } });
    } else {
        await sheets.spreadsheets.values.clear({ spreadsheetId: SHEET_ID, range: STAGING_TAB });
    }
}

async function stage(): Promise<void> {
    const sheets = getSheets();
    const [scraped, master] = await Promise.all([readTab(sheets, SCRAPED_TAB), readTab(sheets, MASTER_TAB)]);
    const masterRefs: MasterRef[] = master.map((r) => ({ name: r['Name of Scholarship'] || '', url: firstUrl(r['Application Link/Method'] || '') }));
    const candidates = selectCandidates(scraped);
    console.log(`Scraped rows: ${scraped.length} | Master rows: ${master.length} | single-scholarship URL candidates: ${candidates.length}`);
    console.log(`Processing first ${PAGE_LIMIT} candidate pages; capturing ALL distinct scholarships per page (cap ${PAGE_CAP}).\n`);

    const stagedRefs: MasterRef[] = [];
    const stagingRows: string[][] = [];
    let attempts = 0;

    const today = new Date().toLocaleDateString('en-US'); // M/D/YYYY

    for (const cand of candidates) {
        if (attempts >= PAGE_LIMIT) break;
        attempts++;
        const label = `[${attempts}] ${cand.name.slice(0, 44)}`;
        let records: GroundedRecord[] = [];
        try {
            const text = await fetchUrlToText(cand.url);
            records = await extractScholarships(text, cand.url);
        } catch (e: unknown) {
            console.log(`${label}  -> FETCH/EXTRACT FAILED: ${(e as Error).message.slice(0, 60)}`);
            stagingRows.push(rowFor({ 'Name of Scholarship': cand.name }, 0, ['fetch/extract failed'], cand.url, 'FETCH-FAILED'));
            continue;
        }
        // Keep ALL distinct grounded scholarships on the page (it may be a list page),
        // de-duped within the page by name, highest-confidence first, capped per page.
        let named = records.filter((r) => String(r['Name of Scholarship'] || '').trim());
        named.sort((a, b) => (b._confidence || 0) - (a._confidence || 0));
        const pageSeen: Array<Set<string>> = [];
        named = named.filter((r) => {
            const tk = nameTokens(String(r['Name of Scholarship']));
            if ([...pageSeen].some((s) => s.size === tk.size && [...tk].every((t) => s.has(t)))) return false;
            pageSeen.push(tk);
            return true;
        });
        if (!named.length) {
            console.log(`${label}  -> no grounded named record`);
            stagingRows.push(rowFor({ 'Name of Scholarship': cand.name }, 0, ['no grounded named record'], cand.url, 'EMPTY'));
            continue;
        }
        const capped = named.length > PAGE_CAP;
        const kept = named.slice(0, PAGE_CAP);
        console.log(`${label}  -> page yielded ${named.length} scholarship(s)${capped ? ` (capped at ${PAGE_CAP})` : ''}`);

        for (const rec of kept) {
            rec['Last Updated'] = today; // stamp so new rows are findable after re-sort
            const recName = String(rec['Name of Scholarship'] || '');
            const recUrl = firstUrl(String(rec['Application Link/Method'] || '')) || cand.url;
            const flags = [...(rec._flags || [])];
            if (capped) flags.push(`page had ${named.length} scholarships — review source for any beyond the first ${PAGE_CAP}`);

            const dupMaster = findMasterDuplicate(recName, masterRefs);
            const dupBatch = findMasterDuplicate(recName, stagedRefs);
            let status = 'NEW';
            if (dupMaster) status = `DUPLICATE (master: ${dupMaster})`;
            else if (dupBatch) status = `DUPLICATE (batch: ${dupBatch})`;
            else {
                // distinct NEW scholarship that happens to share a list-page URL: flag, don't merge
                const coll = findUrlCollision(recUrl, [...masterRefs, ...stagedRefs]);
                if (coll) flags.push(`shares source URL with "${coll}" (distinct scholarship on a list page)`);
            }

            stagingRows.push(rowFor(rec, rec._confidence || 0, flags, recUrl, status));
            console.log(`      • ${status}  conf=${rec._confidence}  ${recName.slice(0, 50)}${flags.length ? '  ⚑' + flags.length : ''}`);
            if (status === 'NEW') stagedRefs.push({ name: recName, url: recUrl });
        }
    }

    await ensureStagingTab(sheets);
    const header = [...STUDENT_HEADERS, ...STAGING_EXTRA];
    await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${STAGING_TAB}!A1`,
        valueInputOption: 'RAW',
        requestBody: { values: [header, ...stagingRows] },
    });
    const newCount = stagingRows.filter((r) => r[r.length - 1] === 'NEW').length;
    console.log(`\nStaged ${stagingRows.length} attempt rows (${newCount} NEW) into "${STAGING_TAB}". Review there, then run with 'push'.`);
}

// Build a staging row aligned to [STUDENT_HEADERS..., Confidence, Flags, Source URL, Status].
function rowFor(rec: Record<string, unknown>, confidence: number, flags: string[], url: string, status: string): string[] {
    const studentCols = mapRecordToRow(rec, [...STUDENT_HEADERS]);
    return [...studentCols, String(confidence), flags.join(' | '), url, status];
}

async function push(): Promise<void> {
    const sheets = getSheets();
    const staged = await readTab(sheets, STAGING_TAB);
    const newRows = staged.filter((r) => (r['Status'] || '').trim() === 'NEW');
    if (!newRows.length) { console.log('No Status=NEW rows in staging — nothing to push.'); return; }

    // Read the LIVE Master Database header row and write BY NAME (same as the fixed push route).
    const headerResp = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: `${MASTER_TAB}!1:1` });
    const liveHeaders = (headerResp.data.values?.[0] || []).map(String);
    assertWritableHeaders(liveHeaders);

    const values = newRows.map((staging) => {
        // Reconstruct a record keyed by the student headers from the staging row.
        const rec: Record<string, string> = {};
        for (const h of STUDENT_HEADERS) rec[h] = staging[h] || '';
        return mapRecordToRow(rec, liveHeaders);
    });

    const resp = await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: `${MASTER_TAB}!A1`,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: { values },
    });
    console.log(`Appended ${values.length} row(s) to ${MASTER_TAB}. ${resp.data.updates?.updatedRange || ''}`);
}

const mode = process.argv[2] || 'stage';
(mode === 'push' ? push() : stage()).catch((e) => { console.error(e); process.exit(1); });
