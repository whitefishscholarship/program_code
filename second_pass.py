import os
import json
import time
import base64
import logging
from dotenv import load_dotenv

load_dotenv()
load_dotenv('web/.env.local')

import gspread
from google import genai
from pydantic import BaseModel, Field
from googlesearch import search
import urllib.parse
from scraper import extract_text_from_url

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

class ScholarshipRecovery(BaseModel):
    amount: str = Field(description="The monetary value of the scholarship (e.g., '$1,000', 'Varies', 'Full Tuition'). Leave empty only if strictly not found.")
    application_link_method: str = Field(description="The DIRECT raw http URL to apply for or view the scholarship details. Must start with http.")
    due_date: str = Field(description="The deadline for the scholarship application. Leave empty only if strictly not found.")

def get_gspread_client():
    cred_str = os.getenv("GOOGLE_SERVICE_ACCOUNT_CREDENTIALS")
    try:
        creds_parsed = json.loads(cred_str)
    except:
        decoded = base64.b64decode(cred_str).decode('utf-8')
        creds_parsed = json.loads(decoded)

    if 'private_key' in creds_parsed and '\\n' in creds_parsed['private_key']:
        creds_parsed['private_key'] = creds_parsed['private_key'].replace('\\n', '\n')

    return gspread.service_account_from_dict(creds_parsed)

def recover_data_via_gemini(url: str, text: str, name: str, deep_links: list) -> dict:
    logging.info("  => Extracting recovery data using Gemini...")
    api_key = os.getenv("GEMINI_API_KEY")
    client = genai.Client(api_key=api_key) if api_key else genai.Client()
    
    prompt = f"""
    You are an expert data recovery assistant. Your strict job is to read the provided text and identify the missing `amount`, `due_date`, and `application_link_method` specifically for the **{name}** scholarship.
    
    1. `amount`: Look very hard for ANY monetary value, including exact amounts (e.g., $1,000), ranges ($500-$5000), "Varies", or text descriptions like "Full Tuition", "Tuition Waiver".
    2. `due_date`: Note the exact due date.
    3. `application_link_method`: Output a raw HTTP link to the application. If not found in the deep links ({', '.join(deep_links)}), emit the Source URL: {url}.
    
    Source URL: {url}
    
    Extracted Text:
    {text}
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config={
                'response_mime_type': 'application/json',
                'response_schema': ScholarshipRecovery,
                'temperature': 0.1,
            },
        )
        return json.loads(response.text)
    except Exception as e:
        logging.error(f"  => Gemini recovery failed: {e}")
        return {}

def main():
    sheet_id = os.getenv("GOOGLE_SHEET_ID")
    gc = get_gspread_client()
    spreadsheet = gc.open_by_key(sheet_id)
    out_tab = spreadsheet.worksheet("Scraped Data")
    
    data = out_tab.get_all_values()
    headers = data[0]
    
    try: amt_idx = headers.index('Amount')
    except: amt_idx = 6
        
    try: link_idx = headers.index('Application Link/Method')
    except: link_idx = 9

    try: name_idx = headers.index('Name of Scholarship')
    except: name_idx = 8
        
    try: date_idx = headers.index('Due Date')
    except: date_idx = 3

    # Process rows (1-indexed in Google Sheets API, header is row 1, data starts at row 2)
    for i in range(1, len(data)):
        row = data[i]
        
        name = row[name_idx] if len(row) > name_idx else ''
        amt = row[amt_idx] if len(row) > amt_idx else ''
        link = row[link_idx] if len(row) > link_idx else ''
        date = row[date_idx] if len(row) > date_idx else ''
        
        is_missing_amt = not amt.strip() or amt.strip().lower() in ['tbd', 'any', 'none', 'varies', 'unknown']
        is_missing_link = not link.strip() or not link.startswith('http')
        is_missing_date = not date.strip() or date.strip().lower() in ['tbd', 'any', 'none', 'unknown']
        
        if not is_missing_amt and not is_missing_link and not is_missing_date:
            continue
            
        logging.info(f"Row {i+1}: Recovering data for '{name}'")
        target_url = link
        
        # 1. Fallback to Google Search if link is missing or broken (404)
        if is_missing_link:
            logging.info(f"  => Missing/invalid link. Executing Google Search for '{name} scholarship'...")
            search_query = f"{name} scholarship application"
            try:
                # Get the first search result
                for result in search(search_query, num_results=1, advanced=False):
                    target_url = result
                    break
                logging.info(f"  => Google Search found: {target_url}")
            except Exception as e:
                logging.error(f"  => Google Search failed: {e}")
                
        if not target_url or not target_url.startswith('http'):
            logging.warning("  => Still no valid URL. Skipping.")
            continue
            
        # 2. Scrape the URL
        logging.info(f"  => Scraping URL: {target_url}")
        text = ""
        deep_links = []
        try:
            text, deep_links = extract_text_from_url(target_url)
        except Exception as e:
            logging.error(f"  => Scrape failed: {e}")
            if "[Scrape failed: 404" in str(e) or "404 Client Error" in str(e):
                logging.warning(f"  => Site 404'd. Re-searching '{name} scholarship'...")
                try:
                    for result in search(f"{name} scholarship application", num_results=1, advanced=False):
                        target_url = result
                        break
                    text, deep_links = extract_text_from_url(target_url)
                except:
                    pass
        
        # 3. Target Gemini Recovery
        recovery_data = recover_data_via_gemini(target_url, text, name, deep_links)
        
        cells_to_update = []
        if is_missing_amt and recovery_data.get('amount'):
            logging.info(f"  => Recovered Amount: {recovery_data['amount']}")
            cells_to_update.append({'range': f"{gspread.utils.rowcol_to_a1(i+1, amt_idx+1)}", 'values': [[recovery_data['amount']]]})
            
        if is_missing_link and recovery_data.get('application_link_method'):
            new_link = recovery_data['application_link_method']
            if new_link.startswith('http'):
                logging.info(f"  => Recovered Link: {new_link}")
                cells_to_update.append({'range': f"{gspread.utils.rowcol_to_a1(i+1, link_idx+1)}", 'values': [[new_link]]})
                
        if is_missing_date and recovery_data.get('due_date'):
            logging.info(f"  => Recovered Due Date: {recovery_data['due_date']}")
            cells_to_update.append({'range': f"{gspread.utils.rowcol_to_a1(i+1, date_idx+1)}", 'values': [[recovery_data['due_date']]]})

        # 4. Batch update Google Sheets
        if cells_to_update:
            out_tab.batch_update(cells_to_update)
            logging.info(f"  => Successfully updated Google Sheet.")
        
        time.sleep(3) # Rate Limiting

if __name__ == "__main__":
    main()
