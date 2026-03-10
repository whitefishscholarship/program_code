const puppeteer = require("puppeteer");
const fs = require("fs");

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  await page.goto("https://www.fvcc.edu/admissions-financial-aid/financial-aid-scholarships/scholarships", { waitUntil: "networkidle2" });
  
  // Click all the accordion triggers to expand the text and reveal amounts
  const buttons = await page.$$('.accordion-trigger, [aria-expanded="false"]');
  console.log(`Found ${buttons.length} accordions to expand...`);
  for (const btn of buttons) {
    try {
        await btn.click();
    } catch (e) {}
  }
  
  // Wait a moment for JS animations to finish expanding the DOM
  await new Promise(r => setTimeout(r, 2000));
  
  const text = await page.evaluate(() => document.body.innerText);
  
  console.log("\n--- SCRAPED JS-EXPANDED TEXT ---");
  console.log(text.substring(0, 3000));
  
  await browser.close();
})();
