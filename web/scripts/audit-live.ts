// Re-audit the live Master Database rows added this session (Last Updated == STAMP)
// with the CORRECTED relevance/audience filters, to find rows that slipped through
// before the filters existed. READ-ONLY: prints a verdict per row, changes nothing.
//   npx tsx scripts/audit-live.ts [stamp]   (default stamp 6/15/2026)
import { config } from 'dotenv';
config({ path: '.env.local' });
import { google } from 'googleapis';
import { assessRelevance, fitsWhitefishAudience, isFundTotal } from '../src/lib/grounding';

const SHEET_ID = process.env.GOOGLE_SHEET_ID!;
const STAMP = process.argv[2] || '6/15/2026';

function getSheets() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS!;
  let creds: Record<string, unknown>;
  try { creds = JSON.parse(raw); } catch { creds = JSON.parse(Buffer.from(raw, 'base64').toString('utf-8')); }
  if (typeof creds.private_key === 'string') creds.private_key = (creds.private_key as string).replace(/\\n/g, '\n');
  const auth = new google.auth.GoogleAuth({ credentials: creds, scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'] });
  return google.sheets({ version: 'v4', auth });
}

(async () => {
  const sheets = getSheets();
  const resp = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: 'Master Database' });
  const rows = resp.data.values || [];
  const hdr = rows[0].map(String);
  const idx = (h: string) => hdr.indexOf(h);
  const ni = idx('Name of Scholarship'), si = idx('Summary'), ai = idx('Amount'), lui = idx('Last Updated'), li = idx('Application Link/Method');

  // whole-DB duplicate-name check (catches dups regardless of stamp)
  const seen = new Map<string, number>();
  const dups: string[] = [];
  for (let r = 1; r < rows.length; r++) {
    const nm = (rows[r][ni] || '').trim().toLowerCase();
    if (!nm) continue;
    if (seen.has(nm)) dups.push(`"${rows[r][ni]}" (rows ${seen.get(nm)} & ${r + 1})`);
    else seen.set(nm, r + 1);
  }
  if (dups.length) console.log(`⚠️ DUPLICATE names in Master Database: ${dups.join(' | ')}\n`);
  else console.log('No duplicate names in Master Database.\n');

  const all = STAMP === 'all';
  const flagged: string[] = [];
  let ok = 0;
  console.log(`Auditing Master Database rows ${all ? '(ALL rows)' : `stamped Last Updated == ${STAMP}`}\n`);
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!all && (row[lui] || '') !== STAMP) continue;
    const name = row[ni] || '', summary = row[si] || '', amount = row[ai] || '', link = row[li] || '';
    const rel = assessRelevance(name, summary);
    const aud = fitsWhitefishAudience(name, summary);
    const issues: string[] = [];
    if (rel.level === 'exclude') issues.push(`relevance:EXCLUDE (${rel.reasons.join('; ')})`);
    else if (rel.level === 'review') issues.push(`relevance:review (${rel.reasons.join('; ')})`);
    if (!aud.fit) issues.push(`audience:NOT-FIT (${aud.reason})`);
    if (amount && isFundTotal(amount)) issues.push(`amount:fund-total ("${amount}")`);
    if (!summary.trim()) issues.push('empty Summary');
    if (!link.trim()) issues.push('empty Application Link'); // paper/online methods are fine — only flag truly empty
    if (issues.length) {
      flagged.push(`[row ${r + 1}] ${name}\n     ${issues.join('  |  ')}`);
    } else { ok++; }
  }
  console.log(`FLAGGED ${flagged.length} of ${flagged.length + ok} session rows (${ok} clean):\n`);
  flagged.forEach((f) => console.log('• ' + f));
})().catch((e) => { console.error(e); process.exit(1); });
