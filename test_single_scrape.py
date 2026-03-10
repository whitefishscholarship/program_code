import json
from dotenv import load_dotenv

load_dotenv()
load_dotenv('web/.env.local')

from scraper import extract_text_from_url, extract_scholarship_data

url = "https://www.montana.edu/admissions/scholarships/"
print(f"Scraping: {url}")
text, deep_links = extract_text_from_url(url)
data = extract_scholarship_data(url, text, deep_links)
print(json.dumps(data, indent=2))
