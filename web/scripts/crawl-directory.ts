// Depth-1 crawl of a link-hub / directory page: enumerate its scholarship links, fetch
// + extract + ground each child, apply the relevance/audience filters, dedupe vs master,
// and APPEND results to Ingestion Staging for review. For recovering the thin directory
// stubs (e.g. byf.org trades) that the flat extractor could only capture as bare names.
//   npx tsx scripts/crawl-directory.ts <directoryUrl> [maxChildren]
import { config } from 'dotenv';
config({ path: '.env.local' });
import { google, sheets_v4 } from 'googleapis';
import { fetchUrlLinks, fetchUrlToText, extractScholarships } from '../src/lib/extract';
import { assessRelevance, fitsWhitefishAudience, findMasterDuplicate, normalizeUrl, MasterRef } from '../src/lib/grounding';
import { STUDENT_HEADERS, mapRecordToRow } from '../src/lib/pushMapping';

const SHEET_ID = process.env.GOOGLE_SHEET_ID!;
const STAGING_TAB = 'Ingestion Staging';
const STAGING_EXTRA = ['Confidence', 'Flags', 'Source URL', 'Status'];
const DIR_URL = process.argv[2];
const MAX_CHILDREN = parseInt(process.argv[3] || '15', 10);

const SCH = /scholarship|grant|award|fellowship|bursary/i;
const SKIP = /\b(login|sign ?in|about|contact|privacy|terms|donate|cart|account|faq|home|menu|search|share|subscribe)\b|facebook|twitter|instagram|linkedin|youtube|tiktok|mailto:|tel:|javascript:/i;

function getSheets(): sheets_v4.Sheets {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS!;
  let creds: Record<string, unknown>;
  try { creds = JSON.parse(raw); } catch { creds = JSON.parse(Buffer.from(raw, 'base64').toString('utf-8')); }
  if (typeof creds.private_key === 'string') creds.private_key = (creds.private_key as string).replace(/\\n/g, '\n');
  const auth = new google.auth.GoogleAuth({ credentials: creds, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
  return google.sheets({ version: 'v4', auth });
}
const firstUrl = (s: string) => (s || '').match(/https?:\/\/[^\s,]+/)?.[0] || '';

function rowFor(rec: Record<string, unknown>, conf: number, flags: string[], url: string, status: string): string[] {
  return [...mapRecordToRow(rec, [...STUDENT_HEADERS]), String(conf), flags.join(' | '), url, status];
}

(async () => {
  if (!DIR_URL) { console.error('usage: crawl-directory.ts <directoryUrl> [maxChildren]'); process.exit(1); }
  const sheets = getSheets();

  // master + existing-staging names for dedupe
  const md = (await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: 'Master Database' })).data.values || [];
  const mh = (md[0] || []).map(String); const mni = mh.indexOf('Name of Scholarship');
  const refs: MasterRef[] = md.slice(1).map((r) => ({ name: String(r[mni] ?? ''), url: '' }));
  const st = (await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: STAGING_TAB })).data.values || [];
  const sh = (st[0] || []).map(String); const sni = sh.indexOf('Name of Scholarship');
  if (sni >= 0) st.slice(1).forEach((r) => refs.push({ name: String(r[sni] ?? ''), url: '' }));

  // 1) enumerate child scholarship links — SKIP matched on link TEXT only (matching it on
  // the URL path wrongly dropped e.g. "Homecoming Scholarship" at /home); dedupe by
  // normalized URL (collapse ?ref= / trailing-slash variants) before capping.
  const allLinks = (await fetchUrlLinks(DIR_URL))
    .filter((l) => (SCH.test(l.text) || SCH.test(l.url)) && !SKIP.test(l.text) && l.url !== DIR_URL);
  const seenChild = new Set<string>();
  const distinct = allLinks.filter((l) => { const k = normalizeUrl(l.url) || l.url; if (seenChild.has(k)) return false; seenChild.add(k); return true; });
  const links = distinct.slice(0, MAX_CHILDREN);
  console.log(`Directory ${DIR_URL}\n  enumerated ${allLinks.length} scholarship links, ${distinct.length} distinct, processing first ${links.length} (cap ${MAX_CHILDREN})${distinct.length > MAX_CHILDREN ? ` — ⚠️ ${distinct.length - MAX_CHILDREN} NOT crawled` : ''}.\n`);

  const PER_CHILD_CAP = 10;
  const today = new Date().toLocaleDateString('en-US');
  const rows: string[][] = [];
  let droppedPerChild = 0;
  for (const [i, l] of links.entries()) {
    let recs;
    try { recs = await extractScholarships(await fetchUrlToText(l.url), l.url); }
    catch (e) {
      console.log(`[${i + 1}] FAIL ${l.url.slice(0, 50)} — ${(e as Error).message.slice(0, 40)}`);
      rows.push(rowFor({ 'Name of Scholarship': l.text.slice(0, 60) || l.url }, 0, [`crawl fetch/extract failed from ${DIR_URL}`], l.url, 'FETCH-FAILED'));
      continue;
    }
    let named = recs.filter((r) => String(r['Name of Scholarship'] || '').trim()).sort((a, b) => (b._confidence || 0) - (a._confidence || 0));
    if (!named.length) { console.log(`[${i + 1}] no grounded record — ${l.text.slice(0, 40)}`); continue; }
    // a child link can itself be a mini-list — keep ALL its scholarships (capped), not just named[0]
    if (named.length > PER_CHILD_CAP) { droppedPerChild += named.length - PER_CHILD_CAP; named = named.slice(0, PER_CHILD_CAP); }
    for (const rec of named) {
      rec['Last Updated'] = today;
      const name = String(rec['Name of Scholarship']);
      const flags = [...(rec._flags || []), `crawled depth-1 from ${DIR_URL}`];
      let status = 'NEW';
      if (findMasterDuplicate(name, refs)) status = 'DUPLICATE';
      else if (rec._relevance === 'exclude') status = 'HOLD (not HS-senior — review)';
      else if (!rec._audienceFit) status = 'HOLD (not Whitefish/MT audience — review)';
      else if (rec._relevance === 'review') status = 'REVIEW (eligibility — check)';
      else refs.push({ name, url: '' });
      rows.push(rowFor(rec, rec._confidence || 0, flags, firstUrl(String(rec['Application Link/Method'] || '')) || l.url, status));
      console.log(`[${i + 1}] ${status}  conf=${rec._confidence}  ${name.slice(0, 50)}`);
    }
  }
  if (droppedPerChild) console.log(`\n⚠️ ${droppedPerChild} scholarship(s) on mini-list child pages dropped by PER_CHILD_CAP — re-crawl those children directly if needed.`);

  if (!rows.length) { console.log('\nNothing recovered.'); return; }
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID, range: `${STAGING_TAB}!A1`, valueInputOption: 'RAW', insertDataOption: 'INSERT_ROWS',
    requestBody: { values: rows },
  });
  const neu = rows.filter((r) => r[r.length - 1] === 'NEW').length;
  console.log(`\nAppended ${rows.length} crawled rows (${neu} NEW) to "${STAGING_TAB}". Review, then push.`);
  void STAGING_EXTRA;
})().catch((e) => { console.error(e); process.exit(1); });
