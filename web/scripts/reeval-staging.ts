// Re-apply the CURRENT relevance/audience filters to Ingestion Staging rows and re-derive
// their Status. Use after a filter change to make the staging tab honest without re-crawling.
// Only flips NEW -> HOLD/REVIEW (never the reverse — a human owns promotions); only touches
// the Status column; by default limited to rows crawled today. Pass "all" to re-eval every row.
//   npx tsx scripts/reeval-staging.ts [all]
import { config } from 'dotenv';
config({ path: '.env.local' });
import { google, sheets_v4 } from 'googleapis';
import { assessRelevance, fitsWhitefishAudience } from '../src/lib/grounding';

const SHEET_ID = process.env.GOOGLE_SHEET_ID!;
const TAB = 'Ingestion Staging';
const ALL = process.argv[2] === 'all';

function getSheets(): sheets_v4.Sheets {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS!;
  let creds: Record<string, unknown>;
  try { creds = JSON.parse(raw); } catch { creds = JSON.parse(Buffer.from(raw, 'base64').toString('utf-8')); }
  if (typeof creds.private_key === 'string') creds.private_key = (creds.private_key as string).replace(/\\n/g, '\n');
  const auth = new google.auth.GoogleAuth({ credentials: creds, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
  return google.sheets({ version: 'v4', auth });
}

(async () => {
  const sheets = getSheets();
  const data = (await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: TAB })).data.values || [];
  const hdr = (data[0] || []).map(String);
  const idx = (n: string) => hdr.findIndex((h) => h.toLowerCase().includes(n.toLowerCase()));
  const NI = idx('Name of Scholarship'), SUM = idx('Summary'), LU = idx('Last Updated'), FL = idx('Flags'), ST = hdr.length - 1;
  const today = new Date().toLocaleDateString('en-US');
  const updates: { range: string; values: string[][] }[] = [];
  let scanned = 0;
  for (let r = 1; r < data.length; r++) {
    const row = data[r];
    const g = (i: number) => (i >= 0 && i < row.length ? String(row[i]).trim() : '');
    const status = g(ST);
    if (status.toUpperCase() !== 'NEW') continue; // only NEW can be tightened down
    if (!ALL && !(g(FL).includes('crawled depth-1') && (g(LU) === today || g(LU) === '6/16/2026'))) continue;
    scanned++;
    const name = g(NI), summary = g(SUM);
    const rel = assessRelevance(name, summary);
    const aud = fitsWhitefishAudience(name, summary);
    let newStatus = '';
    if (rel.level === 'exclude') newStatus = `HOLD (not HS-senior — ${rel.reasons[0]})`;
    else if (!aud.fit) newStatus = `HOLD (${aud.reason})`;
    else if (rel.level === 'review') newStatus = `REVIEW (eligibility — ${rel.reasons[0]})`;
    if (newStatus && newStatus !== status) {
      const a1 = `${TAB}!${String.fromCharCode(65 + ST)}${r + 1}`;
      updates.push({ range: a1, values: [[newStatus]] });
      console.log(`row ${r + 1}: NEW -> ${newStatus}   ${name.slice(0, 48)}`);
    }
  }
  console.log(`\nScanned ${scanned} NEW rows; ${updates.length} reclassified, ${scanned - updates.length} stay NEW.`);
  if (updates.length) {
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: { valueInputOption: 'RAW', data: updates },
    });
    console.log('Status column updated.');
  }
})().catch((e) => { console.error(e); process.exit(1); });
