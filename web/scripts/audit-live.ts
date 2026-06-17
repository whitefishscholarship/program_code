// Re-audit the live Master Database rows added this session (Last Updated == STAMP)
// with the CORRECTED relevance/audience filters, to find rows that slipped through
// before the filters existed. READ-ONLY: prints a verdict per row, changes nothing.
//   npx tsx scripts/audit-live.ts [stamp]            (default stamp 6/15/2026)
//   npx tsx scripts/audit-live.ts all                (audit every row)
//   npx tsx scripts/audit-live.ts all links          (+ application-link liveness check)
import { config } from 'dotenv';
config({ path: '.env.local' });
import { google } from 'googleapis';
import { assessRelevance, fitsWhitefishAudience, isFundTotal, firstHttpUrl, classifyLinkResult, LinkState, classifyLinkTarget, LinkTargetFlag } from '../src/lib/grounding';

const SHEET_ID = process.env.GOOGLE_SHEET_ID!;
const ARGS = process.argv.slice(2);
const LINKS = ARGS.includes('links') || ARGS.includes('--links');
const STAMP = ARGS.find((a) => a !== 'links' && a !== '--links') || '6/15/2026';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36';
// Fetch a URL and classify liveness. Network errors surface as status=null + an error code;
// classifyLinkResult (pure, unit-tested) decides DEAD vs INCONCLUSIVE vs OK.
type LinkCheck = { state: LinkState; detail: string; targetFlags: LinkTargetFlag[]; targetDetail: string };
async function checkLink(url: string): Promise<LinkCheck> {
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), 20000);
  try {
    const resp = await fetch(url, { method: 'GET', redirect: 'follow', signal: ctrl.signal, headers: { 'User-Agent': UA } });
    const live = classifyLinkResult(resp.status);
    // Read a bounded body sample (HTML only) to detect dynamic shells / no-apply pages.
    let bodyText: string | undefined;
    const ct = resp.headers.get('content-type') || '';
    if (resp.ok && /html/i.test(ct)) {
      const html = (await resp.text()).slice(0, 200000);
      bodyText = html
        .replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    }
    const tgt = classifyLinkTarget({ requestedUrl: url, finalUrl: resp.url, contentType: ct, bodyText });
    return { ...live, targetFlags: tgt.flags, targetDetail: tgt.detail };
  } catch (e) {
    const err = e as { code?: string; cause?: { code?: string }; name?: string; message?: string };
    const code = err?.cause?.code || err?.code || (err?.name === 'AbortError' ? 'ETIMEDOUT' : '') || err?.message || 'ERR';
    return { ...classifyLinkResult(null, code), targetFlags: [], targetDetail: '' };
  } finally {
    clearTimeout(to);
  }
}
// Run jobs with a small concurrency cap (polite — avoids self-inflicted 429s).
async function pool<T, R>(items: T[], n: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (i < items.length) { const k = i++; out[k] = await fn(items[k]); }
  }));
  return out;
}

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

  if (LINKS) {
    // Application-link liveness: method-text cells (no URL) are intentional and skipped;
    // only DEAD (DNS not-found / connection refused / 404 / 410) is a real problem.
    const targets: { row: number; name: string; url: string }[] = [];
    for (let r = 1; r < rows.length; r++) {
      if (!all && (rows[r][lui] || '') !== STAMP) continue;
      const url = firstHttpUrl(rows[r][li] || '');
      if (url) targets.push({ row: r + 1, name: rows[r][ni] || '', url });
    }
    console.log(`\n— Link-rot check: testing ${targets.length} rows with a URL (method-text rows skipped) —`);
    const results = await pool(targets, 6, (t) => checkLink(t.url));
    const dead = targets.filter((_, k) => results[k].state === 'DEAD');
    const incon = targets.filter((_, k) => results[k].state === 'INCONCLUSIVE');
    if (dead.length) {
      console.log(`\n🔴 DEAD links (${dead.length}) — fix or remove:`);
      dead.forEach((t) => { const k = targets.indexOf(t); console.log(`• [row ${t.row}] ${t.name}\n     ${t.url}  (${results[k].detail})`); });
    } else {
      console.log('✅ No dead links.');
    }
    if (incon.length) {
      console.log(`\nℹ️ Inconclusive (${incon.length}) — bot-block/rate-limit/server/timeout; likely fine in a browser, verify manually if needed:`);
      incon.forEach((t) => { const k = targets.indexOf(t); console.log(`  [row ${t.row}] ${t.name} — ${results[k].detail}`); });
    }
    // Link-TARGET audit: a live (non-dead) URL can still point to the wrong place — an off-host
    // redirect (often a marketing page), a dynamic/login SaaS portal (can't enumerate / wrong
    // apply path), a PDF form, or a page with no apply signal. Flag for human verification.
    const suspect = targets.filter((_, k) => results[k].targetFlags.length);
    if (suspect.length) {
      console.log(`\n⚠️ Link targets to verify (${suspect.length}) — live but possibly not the real apply page:`);
      suspect.forEach((t) => { const k = targets.indexOf(t); console.log(`• [row ${t.row}] ${t.name}\n     ${t.url}\n     [${results[k].targetFlags.join(', ')}] ${results[k].targetDetail}`); });
    } else {
      console.log('✅ No suspect link targets (no off-host redirects / dynamic portals / no-apply pages).');
    }
  }
})().catch((e) => { console.error(e); process.exit(1); });
