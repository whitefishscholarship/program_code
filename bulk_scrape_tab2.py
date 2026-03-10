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
from google.oauth2.service_account import Credentials
from google.auth.transport.requests import Request
import requests
import urllib.parse
from scraper import extract_text_from_url, ScholarshipData, ScholarshipList

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

def get_gspread_client():
    cred_str = os.getenv("GOOGLE_SERVICE_ACCOUNT_CREDENTIALS")
    if not cred_str:
        raise ValueError("GOOGLE_SERVICE_ACCOUNT_CREDENTIALS not found in environment.")

    try:
        creds_parsed = json.loads(cred_str)
    except:
        decoded = base64.b64decode(cred_str).decode('utf-8')
        creds_parsed = json.loads(decoded)

    if 'private_key' in creds_parsed and '\\n' in creds_parsed['private_key']:
        creds_parsed['private_key'] = creds_parsed['private_key'].replace('\\n', '\n')

    return gspread.service_account_from_dict(creds_parsed)

from typing import Optional

def extract_advanced_data(row_str: str, url: str, text: str, deep_links: Optional[list] = None) -> dict:
    logging.info("Extracting structured data using Gemini...")
    api_key = os.getenv("GEMINI_API_KEY")
    client = genai.Client(api_key=api_key) if api_key else genai.Client()
    
    if deep_links is None:
        deep_links = []
        
    fallback_instruction = f"you MUST fall back to exactly outputting: {url}"
    if "[Scrape failed: 404" in text or "404 Not Found" in text:
        fallback_instruction = "the provided URL is broken (404 Not Found). DO NOT output the provided URL. Instead, you MUST formulate a Google Search URL using the scholarship name, e.g., 'https://www.google.com/search?q=Mensa+Foundation+Scholarship', and output that Google search link"
        
    prompt = f"""
    You are an expert data extraction assistant. I need you to read the following context about a scholarship and extract the relevant information to populate a database.
    Map the information to the requested schema. If information for a field is not found in the text, leave it as an empty string ("") or "Any"/"TBD" as appropriate.
    
    CRITICAL INSTRUCTIONS FOR SPECIFIC FIELDS:
    1. `amount`: You MUST look very hard for any monetary amounts (e.g. $1,000, $500-$5000, "Varies", "Full Tuition", "Tuition Waiver"). Do not leave this blank if any dollar figure or variable amount is mentioned.
    2. `application_link_method`: You MUST output a literal raw URL starting with "http". DO NOT output words like "Application Portal", "Link", or "Information Document". If you cannot find a specific application form link in the text or in the crawled deep links ({', '.join(deep_links) if deep_links else 'None'}), {fallback_instruction}. Your entire final output for this field must ALWAYS start with "http" unless it is completely blank.
    3. `due_date`: Note that multiple pages of text may be provided below. Ensure you look through all text for a deadline or due date and extract the most relevant one.
    4. `stated_min_gpa`: MUST find any mention of GPA, Grades, Academic Standing, or Transcripts. If they say "excellent academic standing", estimate "3.0" minimum, or extract the exact number (e.g., 2.5, 3.0). IF NOT STATED AT ALL, explicitly write "Any".
    5. `school_type`: MUST identify if this is for a 2-Year, 4-Year, Trade school, or Any. If the text mentions "University" or "College", default to "4-Year". If "Vocational", "Apprenticeship", or "Tech School", default to "Trade". IF NOT STATED, explicitly write "Any".
    6. `renewing_non_renewing`: Find any mention of "renewable", "one-time", "annual", "up to 4 years". If it says renewable, write "Renewing". If it says one-time or does not state it, default to "Non-Renewing" or "Any".
    
    Here is the data already provided in the spreadsheet row:
    {row_str}
    
    Here is the Source URL (if any): {url}
    
    Here is the text scraped from the website(s) (if any):
    {text}
    """
    
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=prompt,
        config={
            'response_mime_type': 'application/json',
            'response_schema': ScholarshipList,
            'temperature': 0.1,
        },
    )
    
    return json.loads(response.text)

def map_data_to_row(data: dict) -> list:
    # Post-process the extracted application link to aggressively strip conversational
    # text that Gemini carried over from the original spreadsheet.
    link = str(data.get('application_link_method', '') or '').strip()
    if not link.startswith('http'):
        link = ''

    return [
        data.get('new_for_2026', ''),
        data.get('new_for_2025', ''),
        data.get('last_updated', ''),
        data.get('due_date', ''),
        data.get('in_state_national', ''),
        data.get('portal_scholarship', ''),
        data.get('amount', ''),
        data.get('location_information', ''),
        data.get('name_of_scholarship', ''),
        link,
        data.get('summary', ''),
        data.get('stated_min_gpa', ''),
        data.get('school_type', ''),
        data.get('renewing_non_renewing', ''),
        data.get('focus', ''),
        data.get('acute_financial_need', ''),
        data.get('accepts_gap_year', ''),
        data.get('poc', ''),
        data.get('notes', ''),
        data.get('known_applicants_2025', '')
    ]

def main():
    sheet_id = os.getenv("GOOGLE_SHEET_ID")
    if not sheet_id:
        raise ValueError("GOOGLE_SHEET_ID missing from environment.")

    gc = get_gspread_client()
    spreadsheet = gc.open_by_key(sheet_id)

    # 1. Get headers from the real Tab 2 to ensure perfect parity
    try:
        tab1 = spreadsheet.worksheet("Resource: WHS Senior Scholarships_Updated 2_3_26")
    except:
        tab1 = spreadsheet.get_worksheet(2)
    master_headers = tab1.row_values(1)

    try:
        out_tab = spreadsheet.worksheet("Scraped Data")
        logging.info("Found existing 'Scraped Data' tab.")
    except gspread.exceptions.WorksheetNotFound:
        logging.info("Creating new 'Scraped Data' tab.")
        out_tab = spreadsheet.add_worksheet(title="Scraped Data", rows=1000, cols=len(master_headers))
        out_tab.append_row(master_headers)

    try:
        tab2 = spreadsheet.worksheet("Resource: \"Unique\" Finds_Updated 10_2_25")
    except:
        tab2 = spreadsheet.get_worksheet(3)
    
    # NEW: Fetch ALL data + hyperlinks using pure API to bypass gspread limitations
    scopes = ['https://www.googleapis.com/auth/spreadsheets']
    
    cred_str = os.getenv("GOOGLE_SERVICE_ACCOUNT_CREDENTIALS")
    try:
        creds_parsed = json.loads(cred_str)
    except:
        decoded = base64.b64decode(cred_str).decode('utf-8')
        creds_parsed = json.loads(decoded)
    if 'private_key' in creds_parsed and '\\n' in creds_parsed['private_key']:
        creds_parsed['private_key'] = creds_parsed['private_key'].replace('\\n', '\n')
    
    creds = Credentials.from_service_account_info(creds_parsed, scopes=scopes)
    creds.refresh(Request())
    
    url_req = f"https://sheets.googleapis.com/v4/spreadsheets/{spreadsheet.id}?ranges={urllib.parse.quote(tab2.title)}!A1:Z1000&fields=sheets(data(rowData(values(hyperlink,formattedValue))))"
    headers = {'Authorization': f'Bearer {creds.token}'}
    res = requests.get(url_req, headers=headers)
    grid_data = res.json().get('sheets', [{}])[0].get('data', [{}])[0].get('rowData', [])

    if not grid_data:
        logging.info("Tab 2 is empty.")
        return

    # Extract headers
    tab2_headers = []
    if len(grid_data) > 0 and 'values' in grid_data[0]:
        tab2_headers = [cell.get('formattedValue', '') for cell in grid_data[0]['values']]
    
    # Find already processed URLs from the Scraped Data tab
    processed_urls = set()
    try:
        scraped_data = out_tab.get_all_values()
        # Ensure we skip checking if nothing is present
        for row in scraped_data:
            for cell in row:
                if isinstance(cell, str) and "Source URL: " in cell:
                    url_in_cell = cell.split("Source URL: ")[-1].strip()
                    processed_urls.add(url_in_cell)
        num_scraped = len(scraped_data)
    except:
        num_scraped = 1
        
    logging.info(f"Target tab currently has {num_scraped - 1} data rows. {len(processed_urls)} distinct URLs already processed.")

    # Process rows
    for i in range(1, len(grid_data)):
        row_cells = grid_data[i].get('values', [])
        
        # Build strict text row
        row_text_values = [cell.get('formattedValue', '') for cell in row_cells]
        
        # Check if the row is completely empty
        if not any(str(c).strip() for c in row_text_values):
            continue

        url = ""
        # Find any embedded hyperlink OR plain text URL
        for cell in row_cells:
            # Check hidden rich text hyperlink first
            if 'hyperlink' in cell and cell['hyperlink'].startswith("http"):
                url = cell['hyperlink']
                break
            # Fallback to plain text URL
            val = str(cell.get('formattedValue', '')).strip()
            if val.startswith("http"):
                url = val
                break
                
        if url and url in processed_urls:
            logging.info(f"Skipping row {i+1} as {url} was already processed.")
            continue
        
        # Build the row context string
        row_str_parts = []
        for idx, h in enumerate(tab2_headers):
            val = row_text_values[idx] if idx < len(row_text_values) else ""
            row_str_parts.append(f"{h}: {val}")
        row_str = "\n".join(row_str_parts)
        
        logging.info(f"Processing row {i+1}...")
        
        text = ""
        deep_links = []
        if url:
            logging.info(f"  Found URL to scrape: {url}")
            try:
                # Expecting (combined_text, target_deep_links)
                text, deep_links = extract_text_from_url(url)
            except Exception as e:
                logging.error(f"  Failed to scrape {url}: {e}")
                text = f"[Scrape failed: {e}]"
        
        try:
            data = extract_advanced_data(row_str, url, text, deep_links)
            scholarships = data.get('scholarships', [])
            
            # If for some reason the array is empty, we don't write anything
            if not scholarships:
                logging.warning(f"  => No scholarships found by Gemini for {url}.")
            
            row_datas = []
            for index, scholarship_entry in enumerate(scholarships):
                logging.info(f"  => Processing mapped scholarship {index+1}/{len(scholarships)}: {scholarship_entry.get('name_of_scholarship', 'Unnamed')}")
                
                # Put the source URL into the Notes column
                if url:
                    if 'notes' in scholarship_entry and scholarship_entry['notes']:
                        scholarship_entry['notes'] = scholarship_entry['notes'] + f"\\nSource URL: {url}"
                    else:
                        scholarship_entry['notes'] = f"Source URL: {url}"

                row_data = map_data_to_row(scholarship_entry)
                row_datas.append(row_data)
                
            if row_datas:
                out_tab.append_rows(row_datas)
                
            logging.info(f"  => Appended {len(scholarships)} successfully.")
            
            # Rate limit backoff for Google Sheets API (60 writes per minute per user)
            time.sleep(4)
                
        except Exception as e:
            logging.error(f"  => Failed to process row {i+1}: {e}")

if __name__ == "__main__":
    main()
