// Fictional profiles only; local production build. No scholarship-source interaction.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { InterviewAnswersSchema } = require('../src/lib/interviewMatcher.ts');
const { shortlistAwards } = require('../src/lib/spreadsheetShortlist.ts');
const { serializeAwardCsv } = require('../src/lib/export.ts');
const { SPECIAL_CRITERIA, ACTIVITY_QUESTIONS } = require('../src/lib/interviewQuestions.ts');
const { COVERAGE_PUBLICATION } = require('../src/lib/coverageRelevance.ts');
const { R3_CATALOG: catalog, R3_CONNECTIONS, R3_PROVENANCE } = require('../src/lib/r3Catalog.ts');
const { STUDENT_ORGANIZATIONS } = require('../src/lib/coverageQuestions.ts');
const output = path.resolve(__dirname, '../../docs/evidence/r3-catalog/browser');
const origin = 'http://127.0.0.1:3218';
fs.mkdirSync(output, { recursive: true });
const byId = new Map(catalog.awards.map(a => [a.publicId, a]));
const base = InterviewAnswersSchema.parse({ gpa: 3.5, targetSchoolTypes: ['four_year'] });
const coreCount = shortlistAwards(catalog.awards, base).results.filter(r => r.decision !== 'recorded_mismatch').length;
(async () => {
 const browser = await chromium.launch({ headless: true }); const receipts = [];
 try {
 for (const viewport of [{ width: 360, height: 800 }, { width: 1440, height: 1000 }]) {
  const context = await browser.newContext({ viewport, acceptDownloads: true });
  await context.addInitScript(() => {
   window.__qaWrites = [];
   for (const method of ['setItem', 'removeItem', 'clear']) { const old = Storage.prototype[method]; Storage.prototype[method] = function (...args) { window.__qaWrites.push(method); return old.apply(this, args); }; }
  });
  const page = await context.newPage(); let savedDownloadCount = 0; const errors = [], forbiddenRequests = [], consoles = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (['error', 'warning', 'log'].includes(m.type())) consoles.push(m.text()); });
  page.on('request', r => { const u = new URL(r.url()); if (u.origin !== origin || r.method() !== 'GET' || r.postData() || (u.pathname.startsWith('/api/') && (u.pathname !== '/api/scholarships' || u.search))) forbiddenRequests.push({ path: u.pathname, method: r.method() }); });
  async function overflow() { assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'horizontal overflow'); }
  async function privacy() {
   assert.deepEqual(await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length, cookie: document.cookie, writes: window.__qaWrites })), { local: 0, session: 0, cookie: '', writes: [] });
   assert.deepEqual(await page.evaluate(() => indexedDB.databases()), []); assert.equal(page.url(), origin + '/');
  }
  async function openCore(reset = true) {
   if (reset) await page.getByRole('button', { name: 'Reset interview', exact: true }).click();
   await page.getByRole('heading', { name: 'Start with two details', exact: true }).waitFor();
  }
  async function core(gpa = '3.5', school = 'four_year') {
   await page.locator('#student-gpa').fill(gpa); await page.locator('#student-target-school-types-' + school).check();
  }
  async function results() { await page.getByRole('button', { name: 'Show my results', exact: true }).click(); await page.getByRole('heading', { name: 'Your scholarship shortlist.', exact: true }).waitFor(); await overflow(); }
  async function csv() {
   const ids = await page.locator('article[data-award-id]').evaluateAll(xs => xs.map(x => x.dataset.awardId));
   const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('link', { name: /Export \d+ awards? as CSV/ }).click()]);
   const actual = fs.readFileSync(await download.path(), 'utf8');
   assert.equal(actual, serializeAwardCsv(ids.map(id => byId.get(id))));
   if (savedDownloadCount < 2) await download.saveAs(path.join(output, `public-${viewport.width}-${savedDownloadCount}.csv`));
   savedDownloadCount++; return ids;
  }
  async function assertAll(profile) {
   await page.getByRole('button', { name: `All awards (${catalog.awards.length})`, exact: true }).click();
   const ids = await csv(); assert.deepEqual(ids, shortlistAwards(catalog.awards, { ...base, ...profile }).results.map(r => r.award.publicId)); await privacy();
  }
  async function next() { await page.getByRole('button', { name: 'Next optional section', exact: true }).click(); }
  const api = await (await fetch(origin + '/api/scholarships')).json();
  assert.deepEqual(api.catalog, catalog);
  assert.deepEqual(api.data.map(x => x.publicId), catalog.awards.map(x => x.publicId));
  await page.goto(origin); await openCore(false); await page.keyboard.press('Tab'); assert(await page.locator(':focus').count());
  assert.equal(await page.locator('#student-residence-state').count(), 0); assert.equal(await page.locator('#student-educational-status').count(), 0);
  await page.getByRole('button', { name: 'Show my results', exact: true }).click(); assert(await page.getByRole('alert').count());
  await page.locator('#student-gpa').fill('4.2'); await page.getByRole('button', { name: 'Show my results', exact: true }).click(); assert(await page.getByRole('alert').count());
  await core(); await page.getByRole('button', { name: 'Show my results', exact: true }).click(); await page.getByRole('heading', { name: 'Your scholarship shortlist.', exact: true }).waitFor(); assert.equal((await csv()).length, coreCount); await assertAll({});
  const tested = [];
  for (const id of ['education_teaching', ...STUDENT_ORGANIZATIONS.map(x => 'org_' + x.id)]) {
   await openCore(); await core(); await page.getByRole('button', { name: 'Add optional details', exact: true }).click();
   const profile = id === 'education_teaching' ? { discoveryInterests: ['education_teaching'] } : { organizationResponse: 'selected', studentOrganizations: [id.slice(4)] };
   if (id === 'education_teaching') await page.locator('#discovery-education_teaching').check(); else { await next(); await page.locator('#organization-' + id.slice(4)).check(); }
   await results(); await assertAll(profile);
   for (const c of [...COVERAGE_PUBLICATION.connections, ...R3_CONNECTIONS].filter(c => c.answerId === id)) assert((await page.locator(`article[data-award-id="${c.awardId}"]`).innerText()).includes(c.message));
   if (id === 'org_deca') { const c = R3_CONNECTIONS.find(c => c.answerId === id); await page.locator(`article[data-award-id="${c.awardId}"]`).screenshot({path:path.join(output,`new-award-${viewport.width}.png`)}); }
   if (id === 'org_nths') assert((await page.locator('article[data-award-id="award-ead4360dadca"]').innerText()).includes('Deadline not verified; confirm with NTHS.'));
   await page.getByRole('button', { name: 'Edit answers', exact: true }).click(); assert.equal(await page.locator('#student-gpa').inputValue(), '3.5');
   await page.getByRole('button', { name: 'Add optional details', exact: true }).click();
   if (id !== 'education_teaching') await next();
   assert(await page.locator(id === 'education_teaching' ? '#discovery-education_teaching' : '#organization-' + id.slice(4)).isChecked()); await results(); tested.push(id);
  }
  for (const response of ['yes', 'no', 'not_sure', 'prefer_not_to_answer', 'sensitive_skip']) {
   await openCore(); await core(); await page.getByRole('button', { name: 'Add optional details', exact: true }).click(); await next();
   await page.locator('#financial-need-yes').check();
   if (response === 'sensitive_skip') { await page.locator('#student-sensitive-prefer-not').check(); assert(await page.locator('#financial-need-prefer_not_to_answer').isChecked()); }
   else await page.locator('#financial-need-' + response).check();
   await results(); await assertAll({ financialNeedInterest: response === 'sensitive_skip' ? 'prefer_not_to_answer' : response, sensitiveCriteriaSkipped: response === 'sensitive_skip' });
  }
  for (const response of ['none', 'not_sure', 'prefer_not_to_answer']) {
   await openCore(); await core(); await page.getByRole('button', { name: 'Add optional details', exact: true }).click(); await next();
   await page.locator('#organization-nths').check(); await page.locator('#organization-' + response).check(); assert(!(await page.locator('#organization-nths').isChecked()));
   await results(); await assertAll({});
  }
  // Complete preserved inventory, conditional controls, optional fields and skip behavior.
  await openCore(); await core(); await page.getByRole('button', { name: 'Add optional details', exact: true }).click();
  for (const item of ACTIVITY_QUESTIONS) assert.equal(await page.locator('#' + item.controlId).count(), 1);
  await page.locator('#student-community-service').check(); await page.locator('#student-volunteer-hours').selectOption('100 plus'); await page.locator('#student-community-service').uncheck(); assert.equal(await page.locator('#student-volunteer-hours').count(), 0);
  let inventory = 0;
  for (const item of SPECIAL_CRITERIA.filter(x => ['Career Interests', 'Extracurriculars & Activities'].includes(x.category))) { assert.equal(await page.locator('#' + item.controlId).count(), 1); inventory++; }
  await next();
  for (const item of SPECIAL_CRITERIA.filter(x => !['Career Interests', 'Extracurriculars & Activities'].includes(x.category))) { assert.equal(await page.locator('#' + item.controlId).count(), 1); inventory++; }
  assert.equal(inventory, 38);
  await next(); assert.equal(await page.locator('#student-residence-state').getAttribute('required'), null); assert.equal(await page.locator('#student-residence-state').inputValue(), '');
  await page.locator('#student-residence-state').selectOption('MT'); await page.locator('#student-educational-status').selectOption('high_school_senior'); await page.locator('#student-residence-state').selectOption(''); await page.locator('#student-educational-status').selectOption('');
  assert.equal(await page.locator('input[id^="application-mode-"]').count(), 6); await results(); await assertAll({});
  await page.getByRole('button', { name: `Shortlist (${coreCount})`, exact: true }).click(); await page.getByLabel('Search results', { exact: true }).fill('Montana'); assert((await csv()).length < coreCount);
  for (const sort of ['name', 'amount', 'status']) { await page.getByLabel('Sort', { exact: false }).selectOption(sort); const ids = await csv(); const sorted = ids.map(id => byId.get(id)).sort((a, b) => (sort === 'amount' ? (b.amount.maximum ?? b.amount.minimum ?? -1) - (a.amount.maximum ?? a.amount.minimum ?? -1) : 0) || a.name.localeCompare(b.name) || a.publicId.localeCompare(b.publicId)); assert.deepEqual(ids, sorted.map(a => a.publicId)); }
  await page.reload(); await openCore(false); assert.equal(await page.locator('#student-gpa').inputValue(), ''); await overflow(); await privacy();
  async function tabTo(selector, content = null) {
   for (let i = 0; i < 220; i++) {
    if (await page.evaluate(({selector,content}) => { const el=document.activeElement; return !!el && el.matches(selector) && (content === null || el.textContent.trim() === content); }, {selector,content})) return;
    await page.keyboard.press('Tab');
   }
   throw new Error('Keyboard could not reach '+selector+' '+content);
  }
  await tabTo('#student-gpa'); await page.keyboard.type('3.5');
  await tabTo('#student-target-school-types-four_year'); await page.keyboard.press('Space');
  await tabTo('button','Add optional details'); await page.keyboard.press('Enter');
  await page.getByRole('heading',{name:'Study plans and activities',exact:true}).waitFor();
  await tabTo('#discovery-education_teaching'); await page.keyboard.press('Space');
  await tabTo('summary','Career Interests'); await page.keyboard.press('Enter');
  await tabTo('#criterion-stem'); await page.keyboard.press('Space');
  await tabTo('button','Next optional section'); await page.keyboard.press('Enter');
  await page.getByRole('heading',{name:'Helpful scholarship connections',exact:true}).waitFor();
  await tabTo('#financial-need-yes'); await page.keyboard.press('Space');
  await tabTo('#organization-deca'); await page.keyboard.press('Space');
  await tabTo('button','Next optional section'); await page.keyboard.press('Enter');
  await page.getByRole('heading',{name:'More details and application preferences',exact:true}).waitFor();
  await tabTo('#student-residence-state'); await page.keyboard.press('m');
  await tabTo('button','Show my results'); await page.keyboard.press('Enter');
  await page.getByRole('heading',{name:'Your scholarship shortlist.',exact:true}).waitFor();
  await overflow(); await privacy();
  const keyboardProfile={...base,discoveryInterests:['education_teaching'],selectedCriteria:['stem'],financialNeedInterest:'yes',organizationResponse:'selected',studentOrganizations:['deca']};
  const expectedKeyboard=shortlistAwards(catalog.awards,keyboardProfile).results.filter(x=>x.decision!=='recorded_mismatch').map(x=>x.award.publicId);
  assert.deepEqual(await page.locator('article[data-award-id]').evaluateAll(xs=>xs.map(x=>x.dataset.awardId)),expectedKeyboard);
  await tabTo('a'); // Continue tabbing to the CSV export, without programmatic focus or click.
  for(let i=0;i<220;i++){if(await page.locator(':focus').evaluate(e=>e.tagName==='A' && /Export .* as CSV/.test(e.textContent)))break;await page.keyboard.press('Tab');}
  assert(await page.locator(':focus').evaluate(e=>e.tagName==='A' && /Export .* as CSV/.test(e.textContent)));
  const keyboardDownloadPromise=page.waitForEvent('download'); await page.keyboard.press('Enter');
  const keyboardDownload=await keyboardDownloadPromise; await keyboardDownload.saveAs(path.join(output,`keyboard-${viewport.width}.csv`));
  assert.equal(fs.readFileSync(await keyboardDownload.path(),'utf8'),serializeAwardCsv(expectedKeyboard.map(id=>byId.get(id))));
  await page.screenshot({path:path.join(output,`results-${viewport.width}.png`),fullPage:false});
  await page.reload(); await openCore(false); await privacy();
  await page.evaluate(() => { const p = document.createElement('p'); p.textContent = 'Local QA — fictional test inputs only'; p.style.cssText = 'background:#fff1c2;color:#111;padding:8px;margin:0'; document.body.prepend(p); });
  await page.screenshot({ path: path.join(output, `core-${viewport.width}.png`), fullPage: true });
  await page.getByRole('button', { name: 'Browse all scholarships', exact: true }).click(); assert.equal((await csv()).length, catalog.awards.length);
  assert.deepEqual(errors, []); assert.deepEqual(forbiddenRequests, []); assert.deepEqual(consoles, []);
  receipts.push({ viewport, status: 'PASS', coreOnlyCount: coreCount, preservedCriteria: inventory, newChoices: tested, needResponses: 5, organizationClearResponses: 3, publicCsvExact: true, explicitSort: true, conditionalHours: true, optionalFieldsClear: true, editResetReload: true, browseAll: catalog.awards.length, keyboard: { completeJourney: true, inputs: true, allOptionalSections: true, collapsedChoices: true, results: true, savedCsv: true, programmaticFocus: false }, horizontalOverflow: false, answerStorageRequestsLogs: 0 });
  await context.close(); console.log('BROWSER PASS', viewport.width);
 }
 const health = await (await fetch(origin + '/api/health?nonce=11111111111111111111111111111111')).json();
 assert.equal(health.catalog.id, R3_PROVENANCE.id); assert.equal(health.catalog.sourceSnapshotSha256, R3_PROVENANCE.sourceSnapshotSha256); assert.equal(health.publication.sourceRevision, '225');
 assert.equal(health.coverage.sha256, require('../fixtures/coverage/pin.json').sha256); assert.deepEqual([health.capabilities.google, health.capabilities.drive, health.capabilities.sheets], ['none', 'none', 'none']);
 fs.writeFileSync(path.join(output, 'browser.json'), JSON.stringify({ observedAt: new Date().toISOString(), status: 'PASS', target: 'local production build only', syntheticOnly: true, viewports: receipts, health: { catalog: health.catalog, matchingFacts: health.publication, coverage: health.coverage, capabilities: health.capabilities } }, null, 2) + '\n');
 } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
