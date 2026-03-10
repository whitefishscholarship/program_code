import os
from dotenv import load_dotenv

load_dotenv()
load_dotenv('web/.env.local')
os.environ['GEMINI_API_KEY'] = os.getenv('GEMINI_API_KEY', '')

from scraper import extract_text_from_url, extract_scholarship_data
import json

url = "https://aea.net/educationalfoundation/scholarships.asp"
print(f"Testing full deep pipeline on: {url}\n")
text, deep_links = extract_text_from_url(url)
print("\n--- DEEP LINKS ACQUIRED ---")
for dl in deep_links:
    print(dl)

print("\n--- INFERING WITH GEMINI ---")
data = extract_scholarship_data(url, text, deep_links)
print(json.dumps(data, indent=2))
