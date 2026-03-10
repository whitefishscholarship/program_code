import json
from dotenv import load_dotenv

load_dotenv()
load_dotenv('web/.env.local')

from scraper import extract_text_from_url

url = "https://www.fvcc.edu/admissions-financial-aid/financial-aid-scholarships/scholarships"
print(f"Scraping: {url}")
text, deep_links = extract_text_from_url(url)
print("\n--- DEEP LINKS DISCOVERED ---")
for dl in deep_links:
    print(dl)
    
print("\n--- TEXT EXTRACTED (First 2000 chars) ---")
print(text[:2000])
