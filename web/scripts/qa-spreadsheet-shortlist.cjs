// Synthetic local QA only. Start the production build on 127.0.0.1:3213 first.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs=require('node:fs');const assert=require('node:assert/strict');
const output=require('node:path').resolve(__dirname,'../../docs/evidence');
function parseCsv(text){let rows=[],row=[],cell='',quoted=false;for(let i=0;i<text.length;i++){let c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}else if(c===','&&!quoted){row.push(cell);cell='';}else if(c==='\n'&&!quoted){row.push(cell.replace(/\r$/,''));rows.push(row);row=[];cell='';}else cell+=c;}if(cell||row.length){row.push(cell);rows.push(row);}return rows;}
(async()=>{const browser=await chromium.launch({headless:true});const receipts=[];
for(const [width,height] of [[360,800],[768,1024],[1440,900]]){
 const context=await browser.newContext({viewport:{width,height},acceptDownloads:true});const page=await context.newPage();let violations=[];let errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('request',r=>{const u=new URL(r.url());if(!['http:','https:'].includes(u.protocol))return;if(u.hostname!=='127.0.0.1'||r.method()!=='GET'||r.postData())violations.push('unexpected request');if(u.pathname==='/api/scholarships'&&u.search)violations.push('answer-bearing catalog query');});
 await page.goto('http://127.0.0.1:3213');await page.getByRole('heading',{name:'Academic background',exact:true}).waitFor();
 assert.equal(await page.locator('#student-gpa').inputValue(),'');
 await page.keyboard.press('Tab');assert(await page.locator(':focus').count());
 const overflow=async()=>assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await overflow();
 async function fill(gpa,school){await page.locator('#student-gpa').fill(String(gpa));await page.locator('#student-residence-state').selectOption('MT');await page.locator('#student-educational-status').selectOption('high_school_senior');for(const x of ['two_year','four_year','trade_vocational','undecided'])await page.locator('#student-target-school-types-'+x).setChecked(x===school);for(let i=0;i<3;i++)await page.getByRole('button',{name:'Continue',exact:true}).click();await page.getByRole('button',{name:'Show my results',exact:true}).click();await page.getByRole('heading',{name:'Your scholarship shortlist.',exact:true}).waitFor();await overflow();}
 async function names(){return page.locator('article h3').allTextContents();}
 async function csvCheck(){const expected=await names();const link=page.getByRole('link',{name:/Export \d+ awards? as CSV/});const [download]=await Promise.all([page.waitForEvent('download'),link.click()]);const file=await download.path();const csv=fs.readFileSync(file,'utf8').replace(/^\uFEFF/,'');const parsed=parseCsv(csv);assert.deepEqual(parsed.slice(1).map(r=>r[1]),expected);return expected.length;}
 await fill(3.5,'four_year');let high=await csvCheck();assert.equal(high,166);
 await page.getByRole('button',{name:'Outside shortlist (26)',exact:true}).click();assert.equal((await names()).length,26);await csvCheck();
 await page.getByRole('button',{name:'All awards (192)',exact:true}).click();assert.equal((await names()).length,192);
 await page.getByRole('button',{name:'Shortlist (166)',exact:true}).click();
 await page.getByLabel('Search results',{exact:true}).fill('Montana');await page.getByLabel('Sort',{exact:false}).selectOption('name');let filtered=await csvCheck();assert(filtered>0&&filtered<166);
 await page.getByRole('button',{name:'Edit answers',exact:true}).click();assert.equal(await page.locator('#student-gpa').inputValue(),'3.5');await fill(2,'four_year');let low=await csvCheck();assert.equal(low,125);
 await page.getByRole('button',{name:'Edit answers',exact:true}).click();await fill(3.5,'trade_vocational');let trade=await csvCheck();assert.equal(trade,152);
 await page.getByRole('button',{name:'Edit answers',exact:true}).click();await fill(3.5,'undecided');let undecided=await csvCheck();assert.equal(undecided,190);
 await page.getByRole('button',{name:'Reset interview',exact:true}).click();assert.equal(await page.locator('#student-gpa').inputValue(),'');
 await page.locator('#student-gpa').fill('2.75');await page.reload();await page.getByRole('heading',{name:'Academic background',exact:true}).waitFor();assert.equal(await page.locator('#student-gpa').inputValue(),'');
 assert.deepEqual(await page.evaluate(()=>({local:localStorage.length,session:sessionStorage.length,cookie:document.cookie})),{local:0,session:0,cookie:''});assert.deepEqual(await page.evaluate(async()=>await indexedDB.databases()),[]);assert.equal(page.url(),'http://127.0.0.1:3213/');
 await page.getByRole('button',{name:'Browse all scholarships',exact:true}).click();assert.equal((await names()).length,192);await page.getByRole('button',{name:'Start private interview',exact:true}).click();await fill(3.5,'four_year');
 if(width===1440){await page.screenshot({path:output+'/PLAN-REV13-synthetic-desktop.png'});}if(width===360){await page.screenshot({path:output+'/PLAN-REV13-synthetic-mobile.png'});}
 assert.deepEqual(violations,[]);assert.deepEqual(errors,[]);receipts.push({viewport:[width,height],syntheticProfilesOnly:true,highGpaFourYear:high,lowerGpaFourYear:low,trade,undecided,filteredCsvRows:filtered,allAwards:192,outsideRecovery:true,csvExactVisibleNamesAndOrder:true,editResetReload:true,noAnswerRequestsOrStorage:true,noHorizontalOverflow:true,pageErrors:0});await context.close();
}
const api=await fetch('http://127.0.0.1:3213/api/health?nonce=11111111111111111111111111111111');const health=await api.json();assert.equal(health.observationNonce,'11111111111111111111111111111111');assert.equal(health.shortlist.id,'spreadsheet-shortlist-v1-rev225');assert.deepEqual([health.capabilities.google,health.capabilities.drive,health.capabilities.sheets],['none','none','none']);
fs.writeFileSync(output+'/PLAN-REV13-browser-results.json',JSON.stringify({observedAt:new Date().toISOString(),target:'local production Webpack build, not deployed Production',status:'PASS',journeys:receipts,health:{status:api.status,shortlist:health.shortlist,capabilities:health.capabilities}},null,2)+'\n');await browser.close();console.log('BROWSER PASS',JSON.stringify(receipts));})().catch(e=>{console.error(e);process.exit(1)});
