// UX1 cleanup regression: fictional profiles against a local production build only.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { InterviewAnswersSchema } = require('../src/lib/interviewMatcher.ts');
const { shortlistAwards } = require('../src/lib/spreadsheetShortlist.ts');
const { serializeAwardCsv } = require('../src/lib/export.ts');
const { R3_CATALOG: catalog } = require('../src/lib/r3Catalog.ts');
const { SPECIAL_CRITERIA, ACTIVITY_QUESTIONS } = require('../src/lib/interviewQuestions.ts');
const { COVERAGE_INTERESTS, STUDENT_ORGANIZATIONS } = require('../src/lib/coverageQuestions.ts');
const origin = process.env.UX1_ORIGIN || 'http://127.0.0.1:3220';
assert(['127.0.0.1', 'localhost'].includes(new URL(origin).hostname), 'Local QA target only');
const output = path.resolve(__dirname, '../../docs/evidence/ux1-cleanup/browser');
const headings = ['Start with two details', 'More details and application preferences', 'Study plans and activities', 'Helpful scholarship connections'];
const base = InterviewAnswersSchema.parse({ gpa: 3.5, targetSchoolTypes: ['four_year'] });
const byId = new Map(catalog.awards.map(a => [a.publicId, a]));
fs.mkdirSync(output, { recursive: true });
(async () => {
 const browser = await chromium.launch({ headless: true });
 const receipts = [];
 try {
  for (const viewport of [{ width: 360, height: 800 }, { width: 1440, height: 1000 }]) {
   const context = await browser.newContext({ viewport, acceptDownloads: true });
   await context.addInitScript(() => {
    window.__qaWrites = [];
    for (const method of ['setItem', 'removeItem', 'clear']) {
     const old = Storage.prototype[method];
     Storage.prototype[method] = function (...args) { window.__qaWrites.push(method); return old.apply(this, args); };
    }
   });
   const page = await context.newPage();
   const errors = [], forbiddenRequests = [], consoles = [];
   page.on('pageerror', e => errors.push(String(e)));
   page.on('console', m => { if (['error', 'warning', 'log'].includes(m.type())) consoles.push(m.text()); });
   page.on('request', r => {
    const u = new URL(r.url());
    if (u.origin !== origin || r.method() !== 'GET' || r.postData() ||
      (u.pathname.startsWith('/api/') && (u.pathname !== '/api/scholarships' || u.search)))
     forbiddenRequests.push({ path: u.pathname, method: r.method() });
   });
   async function overflow() { assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'horizontal overflow'); }
   async function privacy() {
    assert.deepEqual(await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length, cookie: document.cookie, writes: window.__qaWrites })), { local: 0, session: 0, cookie: '', writes: [] });
    assert.deepEqual(await page.evaluate(() => indexedDB.databases()), []);
    assert.equal(page.url(), origin + '/');
    assert.deepEqual(forbiddenRequests, []); assert.deepEqual(consoles, []); assert.deepEqual(errors, []);
   }
   async function noClutter() {
    const text = await page.locator('body').textContent();
    for (const removed of ['Prefer not to answer', 'How your answers are used', "Your answers stay only", 'No current saved-record connection', 'have no matching effect in this version', 'Unchecked, uncertain and skipped', 'Uses organizer records captured', 'It does not establish financial eligibility', 'Only organizations with a connection', 'Preferences affect order when', 'Always confirm requirements and availability', 'Your private results']) assert(!text.includes(removed), `removed copy still present: ${removed}`);
    assert.equal(await page.locator('[id*="prefer_not"], #student-sensitive-prefer-not').count(), 0);
    assert.equal(await page.getByRole('link', { name: 'Administrator sign-in', exact: true }).count(), 1);
   }
   async function step(n) {
    await page.getByRole('heading', { name: headings[n - 1], exact: true }).waitFor();
    assert.equal(await page.getByText(`Step ${n} of 4`, { exact: true }).count(), 1);
    assert.equal(await page.getByRole('button', { name: 'Continue', exact: true }).count(), n < 4 ? 1 : 0);
    assert.equal(await page.getByRole('button', { name: 'Show my results', exact: true }).count(), n === 4 ? 1 : 0);
    assert.equal(await page.getByRole('button', { name: 'Back', exact: true }).count(), n > 1 ? 1 : 0);
    assert.equal(await page.locator('button').filter({ hasText: /optional section|optional details/i }).count(), 0);
    assert(await page.locator('#interview-step-heading').evaluate(el => el === document.activeElement), 'heading focus');
    await overflow(); await noClutter();
   }
   async function next(n) { await page.getByRole('button', { name: 'Continue', exact: true }).click(); await step(n); }
   async function back(n) { await page.getByRole('button', { name: 'Back', exact: true }).click(); await step(n); }
   async function core(gpa = '3.5') { await page.locator('#student-gpa').fill(gpa); await page.locator('#student-target-school-types-four_year').check(); }
   async function reset() { await page.getByRole('button', { name: 'Reset interview', exact: true }).click(); await step(1); assert.equal(await page.locator('#student-gpa').inputValue(), ''); }
   async function edit() { await page.getByRole('button', { name: 'Edit answers', exact: true }).click(); await step(1); }
   async function resultIds(profile) {
    const expected = shortlistAwards(catalog.awards, { ...base, ...profile }).results.filter(r => r.decision !== 'recorded_mismatch');
    const ids = await page.locator('article[data-award-id]').evaluateAll(xs => xs.map(x => x.dataset.awardId));
    assert.deepEqual(ids, expected.map(x => x.award.publicId), 'results use the final revised profile and original matcher');
    for (const r of expected.filter(x => x.relevant)) {
     const text = await page.locator(`article[data-award-id="${r.award.publicId}"]`).innerText();
     for (const reason of r.reasons) assert(text.includes(reason.message), `missing expected reason for ${r.award.publicId}`);
    }
    const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('link', { name: /Export \d+ awards? as CSV/ }).click()]);
    assert.equal(fs.readFileSync(await download.path(), 'utf8'), serializeAwardCsv(ids.map(id => byId.get(id))), 'exact public-only visible CSV');
    await privacy(); await noClutter(); return ids;
   }
   async function results(profile = {}) { await page.getByRole('button', { name: 'Show my results', exact: true }).click(); await page.getByRole('heading', { name: 'Your scholarship shortlist.', exact: true }).waitFor(); return resultIds(profile); }
   async function shot(name) { await page.screenshot({ path: path.join(output, `${name}-${viewport.width}.png`), fullPage: true }); }
   async function tabTo(selector, label = null) {
    for (let i = 0; i < 220; i++) {
     if (await page.evaluate(({ selector, label }) => document.activeElement?.matches(selector) && (label === null || document.activeElement.textContent.trim() === label), { selector, label })) return;
     await page.keyboard.press('Tab');
    }
    throw Error(`Keyboard could not reach ${selector} ${label}`);
   }
   const api = await (await fetch(origin + '/api/scholarships')).json(); assert.deepEqual(api.catalog, catalog);
   await page.goto(origin); await step(1); await shot('step-1');
   await page.getByRole('button', { name: 'Continue', exact: true }).click(); assert(await page.locator('#interview-error').count());
   await page.locator('#student-gpa').fill('4.2'); await page.getByRole('button', { name: 'Continue', exact: true }).click(); assert(await page.locator('#interview-error').count());
   await page.locator('#student-gpa').fill('3.5'); await page.getByRole('button', { name: 'Continue', exact: true }).click(); assert((await page.locator('#interview-error').innerText()).includes('school type'));
   await core(); await next(2); await shot('step-2');
   assert.equal(await page.locator('#student-residence-state').getAttribute('required'), null);
   assert.equal(await page.locator('input[id^="application-mode-"]').count(), 6);
   await next(3); await shot('step-3');
   for (const item of [...ACTIVITY_QUESTIONS, ...SPECIAL_CRITERIA.filter(x => ['Career Interests', 'Extracurriculars & Activities'].includes(x.category))]) assert.equal(await page.locator('#' + item.controlId).count(), 1);
   for (const item of COVERAGE_INTERESTS) assert.equal(await page.locator('#discovery-' + item.id).count(), 1);
   await next(4); await shot('step-4');
   for (const item of SPECIAL_CRITERIA.filter(x => !['Career Interests', 'Extracurriculars & Activities'].includes(x.category))) assert.equal(await page.locator('#' + item.controlId).count(), 1);
   for (const item of STUDENT_ORGANIZATIONS) assert.equal(await page.locator('#organization-' + item.id).count(), 1);
   const blankCount = (await results()).length;
   // Back restores values; cleared and revised inputs replace earlier values.
   await reset(); await core(); await next(2);
   await page.locator('#student-residence-state').selectOption('MT');
   await page.locator('#student-educational-status').selectOption('high_school_senior');
   await page.locator('input[name="student-college-accepted"]').nth(0).check();
   await page.locator('input[name="student-gap-year"]').nth(1).check();
   await page.locator('#application-mode-offline').check(); await next(3);
   await page.locator('#discovery-education_teaching').check();
   await page.locator('#student-community-service').check(); await page.locator('#student-volunteer-hours').selectOption('100 plus'); await next(4);
   await page.locator('#financial-need-yes').check(); await page.locator('#organization-nths').check();
   await back(3); assert(await page.locator('#discovery-education_teaching').isChecked()); assert.equal(await page.locator('#student-volunteer-hours').inputValue(), '100 plus');
   await back(2); assert.equal(await page.locator('#student-residence-state').inputValue(), 'MT'); assert.equal(await page.locator('#student-educational-status').inputValue(), 'high_school_senior');
   assert(await page.locator('input[name="student-college-accepted"]').nth(0).isChecked()); assert(await page.locator('input[name="student-gap-year"]').nth(1).isChecked()); assert(await page.locator('#application-mode-offline').isChecked());
   await back(1); assert.equal(await page.locator('#student-gpa').inputValue(), '3.5'); await page.locator('#student-gpa').fill('3.6');
   await next(2); await page.locator('#student-residence-state').selectOption(''); await page.locator('#application-mode-offline').uncheck(); await next(3);
   await page.locator('#student-community-service').uncheck(); assert.equal(await page.locator('#student-volunteer-hours').count(), 0); await next(4);
   assert(await page.locator('#financial-need-yes').isChecked()); assert(await page.locator('#organization-nths').isChecked());
   await results({ gpa: 3.6, educationalStatus: 'high_school_senior', collegeAccepted: true, gapYear: false, discoveryInterests: ['education_teaching'], financialNeedInterest: 'yes', studentOrganizations: ['nths'], organizationResponse: 'selected' });
   await edit(); assert.equal(await page.locator('#student-gpa').inputValue(), '3.6'); await page.locator('#student-gpa').fill('3.2'); await next(2);
   assert.equal(await page.locator('#student-residence-state').inputValue(), ''); assert(!(await page.locator('#application-mode-offline').isChecked()));
   await page.locator('#student-educational-status').selectOption(''); await next(3); assert(await page.locator('#discovery-education_teaching').isChecked()); await page.locator('#discovery-education_teaching').uncheck(); await next(4);
   await page.locator('#organization-none').check(); assert(!(await page.locator('#organization-nths').isChecked())); await page.locator('#financial-need-no').check();
   const revised = { gpa: 3.2, collegeAccepted: true, gapYear: false, organizationResponse: 'none', financialNeedInterest: 'no' };
   await results(revised); await edit(); await page.locator('#student-gpa').fill('1.5'); await page.getByRole('button', { name: 'Back to results', exact: true }).click(); await resultIds(revised);
   await edit(); assert.equal(await page.locator('#student-gpa').inputValue(), '3.2');
   // Optional radio answers and organization choices return to blank during editing.
   await next(2);
   for (const id of ['student-college-accepted', 'student-gap-year']) {
    for (const index of [0, 1]) {
     await page.locator(`input[name="${id}"]`).nth(index).check();
     await page.locator(`#clear-${id}`).focus(); await page.keyboard.press('Enter');
     assert.equal(await page.locator(`input[name="${id}"]:checked`).count(), 0);
     assert.equal(await page.locator(`#clear-${id}`).count(), 0);
    }
   }
   await next(3); await page.locator('#student-caregiving').check(); await next(4);
   await page.getByText('Neurodiversity & Learning', { exact: true }).first().click(); await page.locator('#criterion-dyslexia').check();
   for (const response of ['none', 'not_sure']) {
    await page.locator('#organization-nths').check(); await page.locator('#organization-' + response).check();
    assert(!(await page.locator('#organization-nths').isChecked()));
    await page.locator('#clear-organizations').click(); assert.equal(await page.locator('input[name="organization-response"]:checked').count(), 0);
   }
   await page.locator('#organization-nths').check(); await page.locator('#organization-ffa').check();
   await page.locator('#clear-organizations').click(); assert.equal(await page.locator('input[id^="organization-"]:checked').count(), 0);
   await page.locator('#organization-nths').check(); await page.locator('#organization-nths').uncheck(); assert.equal(await page.locator('#clear-organizations').count(), 0);
   for (const value of ['yes', 'no', 'not_sure']) {
    await page.locator('#financial-need-' + value).check(); await page.locator('#clear-financial-need').click();
    assert.equal(await page.locator('input[name="financial-need-interest"]:checked').count(), 0);
   }
   await page.locator('#criterion-dyslexia').uncheck(); await back(3); assert(await page.locator('#student-caregiving').isChecked()); await page.locator('#student-caregiving').uncheck();
   await back(2); assert.equal(await page.locator('input[type="radio"]:checked').count(), 0); await next(3); await next(4);
   await results({ gpa: 3.2, collegeAccepted: null, gapYear: null, financialNeedInterest: null, organizationResponse: null });
   await edit(); await next(2); assert.equal(await page.locator('input[type="radio"]:checked').count(), 0); await next(3); await next(4);
   assert.equal(await page.locator('input:checked').count(), 0);
   await page.locator('#financial-need-yes').check(); await page.reload(); await step(1); assert.equal(await page.locator('#student-gpa').inputValue(), '');
   // Keyboard-only complete journey plus backward traversal.
   await tabTo('#student-gpa'); await page.keyboard.type('3.5'); await tabTo('#student-target-school-types-four_year'); await page.keyboard.press('Space');
   for (const n of [2, 3, 4]) { await tabTo('button', 'Continue'); await page.keyboard.press('Enter'); await step(n); }
   await tabTo('button', 'Back'); await page.keyboard.press('Enter'); await step(3); await tabTo('button', 'Continue'); await page.keyboard.press('Enter'); await step(4);
   await tabTo('button', 'Show my results'); await page.keyboard.press('Enter'); await page.getByRole('heading', { name: 'Your scholarship shortlist.', exact: true }).waitFor(); await resultIds({});
   await reset(); await page.getByRole('button', { name: 'Browse all scholarships', exact: true }).click(); assert.equal(await page.locator('article[data-award-id]').count(), catalog.awards.length);
   await privacy();
   receipts.push({ viewport, status: 'PASS', blankOptionalScreens: true, blankProfileCount: blankCount, catalogAwards: catalog.awards.length, stepOrder: [1,4,2,3], preservedCriteria: SPECIAL_CRITERIA.length, backRetainsValues: true, editRecalculates: true, clearingSelections: true, optionalRadioClearAllValues: true, organizationClear: true, removedCopyAbsent: true, cancelEditKeepsPriorResults: true, keyboard: true, noHorizontalOverflow: true, resetReloadClears: true, publicCsvExact: true, observedAnswerStorageRequestsLogs: 0 });
   await context.close(); console.log('UX1 BROWSER PASS', viewport.width);
  }
  await legacyCompatibility(browser);
  fs.writeFileSync(path.join(output, 'browser.json'), JSON.stringify({ recordedAt: new Date().toISOString(), status: 'PASS', legacyCompatibility: true, origin, scope: 'Local production build; fictional inputs only; no hosted or source-freshness claim', viewports: receipts }, null, 2) + '\n');
 } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });

// Exercise old in-memory answer shapes in the real component using a local intercepted
// QA document. No application route, shipped bundle, saved answer or provider is added.
async function legacyCompatibility(browser) {
 const esbuild = require('esbuild');
 const legacy = InterviewAnswersSchema.parse({ ...base, collegeAccepted: 'prefer_not_to_answer', gapYear: 'prefer_not_to_answer', financialNeedInterest: 'prefer_not_to_answer', organizationResponse: 'prefer_not_to_answer', studentOrganizations: ['nths'], selectedCriteria: ['dyslexia', 'stem'], activities: ['caregiving', 'leadership'], sensitiveCriteriaSkipped: true });
 const bundle = await esbuild.build({ absWorkingDir: path.resolve(__dirname, '..'), stdin: { contents: `import React from 'react'; import { createRoot } from 'react-dom/client'; import Wizard from './src/components/InterviewWizard'; createRoot(document.getElementById('root')).render(React.createElement(Wizard, {initialAnswers:${JSON.stringify(legacy)},onComplete: answers => {window.__qaResult = answers;}, onCancel:()=>{}}));`, resolveDir: path.resolve(__dirname, '..'), loader: 'tsx' }, bundle: true, write: false, platform: 'browser', format: 'iife', define: { 'process.env.NODE_ENV': '"production"' } });
 const context = await browser.newContext(); const page = await context.newPage(); const errors=[];
 page.on('pageerror', e => errors.push(String(e)));
 await page.route(origin + '/__ux1_legacy_qa', route => route.fulfill({ contentType: 'text/html', body: '<div id="root"></div>' }));
 await page.goto(origin + '/__ux1_legacy_qa'); await page.addScriptTag({ content: bundle.outputFiles[0].text });
 const forward = () => page.getByRole('button', { name: 'Continue', exact: true }).click();
 await forward(); assert.equal(await page.locator('input[type="radio"]:checked').count(),0);
 await forward(); assert(!(await page.locator('#student-caregiving').isChecked())); assert(!(await page.locator('#student-caregiving').isDisabled())); assert(await page.locator('#student-leadership').isChecked());
 await forward(); assert.equal(await page.locator('input[type="radio"]:checked').count(),0); assert(!(await page.locator('#organization-nths').isChecked()));
 await page.getByText('Neurodiversity & Learning', { exact: true }).first().click(); assert(!(await page.locator('#criterion-dyslexia').isChecked())); assert(!(await page.locator('#criterion-dyslexia').isDisabled()));
 await page.getByRole('button', { name: 'Show my results', exact: true }).click();
 const blank = await page.evaluate(() => window.__qaResult);
 assert.deepEqual(blank.selectedCriteria, ['stem']); assert.deepEqual(blank.activities, ['leadership']);
 for (const field of ['collegeAccepted','gapYear','financialNeedInterest','organizationResponse']) assert.equal(blank[field],null);
 assert.deepEqual(blank.studentOrganizations,[]); assert.equal(blank.sensitiveCriteriaSkipped,false);
 await page.locator('#financial-need-yes').check(); await page.locator('#criterion-dyslexia').check(); await page.locator('#organization-nths').check();
 await page.getByRole('button', { name:'Back',exact:true }).click(); await page.locator('#student-caregiving').check(); await forward();
 await page.getByRole('button', { name:'Show my results',exact:true }).click(); const revised=await page.evaluate(()=>window.__qaResult);
 assert(revised.selectedCriteria.includes('dyslexia')); assert(revised.activities.includes('caregiving')); assert.equal(revised.financialNeedInterest,'yes'); assert.deepEqual(revised.studentOrganizations,['nths']); assert.equal(revised.organizationResponse,'selected'); assert.equal(revised.sensitiveCriteriaSkipped,false); assert.deepEqual(errors,[]);
 await context.close(); console.log('UX1 LEGACY COMPATIBILITY PASS');
}
