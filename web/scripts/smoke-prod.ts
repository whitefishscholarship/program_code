// Post-deploy production smoke test — run after every deploy. Exits non-zero on any failure.
//   npx tsx scripts/smoke-prod.ts [baseUrl]
const BASE = process.argv[2] || 'https://web-two-gules-45.vercel.app';
const PII = ['POC', 'Notes', 'Known'];
let failed = 0;
function check(name: string, ok: boolean, detail = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : '  -> ' + detail}`);
  if (!ok) failed++;
}
async function httpStatus(path: string, opts?: RequestInit): Promise<number> {
  try { return (await fetch(BASE + path, { ...opts, signal: AbortSignal.timeout(20000) })).status; } catch { return 0; }
}

(async () => {
  console.log(`Smoke-testing ${BASE}\n`);
  // 1. homepage = new browse UX
  const home = await fetch(BASE + '/', { signal: AbortSignal.timeout(20000) }).then((r) => r.text()).catch(() => '');
  check('homepage 200 + browse UX', home.includes('Browse scholarships') || home.includes('Get personalized matches'), 'browse markers missing');
  // 2. API serves rows + NO PII keys
  const api = await fetch(BASE + '/api/scholarships', { signal: AbortSignal.timeout(20000) }).then((r) => r.json()).catch(() => ({ data: [] }));
  const rows = api.data || [];
  const piiKeys = [...new Set(rows.flatMap((r: Record<string, unknown>) => Object.keys(r)))].filter((k) => PII.some((p) => String(k).includes(p)));
  check('/api/scholarships serves rows', rows.length > 0, `${rows.length}`);
  check('NO PII keys in payload', piiKeys.length === 0, JSON.stringify(piiKeys));
  // 3. admin APIs gated (401 unauthenticated)
  check('/api/admin/push gated', (await httpStatus('/api/admin/push', { method: 'POST' })) === 401);
  check('/api/admin/extract gated', (await httpStatus('/api/admin/extract', { method: 'POST' })) === 401);
  // 4. admin login page loads
  check('/admin/login 200', (await httpStatus('/admin/login')) === 200);

  console.log(`\n${failed === 0 ? '✅ ALL SMOKE CHECKS PASS' : `❌ ${failed} FAILED`}`);
  process.exit(failed === 0 ? 0 : 1);
})();
