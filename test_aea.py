from scraper import extract_text_from_url
from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup

url = "https://aea.net/educationalfoundation/scholarships.asp"
print(f"Testing deep link extraction on: {url}\n")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto(url, wait_until="networkidle")
    html = page.content()
    browser.close()
    
soup = BeautifulSoup(html, 'html.parser')
print("\n--- ALL LINKS FOUND ---")
for a in soup.find_all('a', href=True):
    print(f"Text: '{a.get_text(strip=True)}' | Href: {a['href']}")
