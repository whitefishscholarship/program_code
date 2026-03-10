from playwright.sync_api import sync_playwright

def scrape_fvcc():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
            extra_http_headers={
                "Accept-Language": "en-US,en;q=0.9",
            }
        )
        page.goto("https://www.fvcc.edu/admissions-financial-aid/financial-aid-scholarships/scholarships", timeout=60000)
        
        # Give it a second to load dynamic content
        page.wait_for_timeout(2000)
        
        # Find all accordion expand buttons and click them to reveal the dollar amounts
        buttons = page.locator('.accordion-block__btn, button[aria-expanded="false"]')
        count = buttons.count()
        print(f"Found {count} expandable accordions to click...")
        
        for i in range(count):
            try:
                buttons.nth(i).click()
            except Exception as e:
                pass
                
        # Wait for CSS animations to unfurl the text
        page.wait_for_timeout(2000)
        
        # Grab the fully rendered inner text
        text = page.evaluate("document.body.innerText")
        print("\n--- SCRAPED JS-EXPANDED TEXT ---")
        print(text[:2000])
        
        browser.close()

if __name__ == "__main__":
    scrape_fvcc()
