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
from scraper import extract_text_from_url, ScholarshipData

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

def extract_advanced_data(row_str: str, url: str, text: str) -> dict:
    logging.info("Extracting structured data using Gemini...")
    api_key = os.getenv("GEMINI_API_KEY")
    client = genai.Client(api_key=api_key) if api_key else genai.Client()
        
    prompt = f"""
    You are an expert data extraction assistant. I need you to read the following context about a scholarship and extract the relevant information to populate a database.
    Map the information to the requested schema. If information for a field is not found in the text, leave it as an empty string ("") or "Any"/"TBD" as appropriate.
    
    Here is the data already provided in the spreadsheet row:
    {row_str}
    
    Here is the Source URL (if any): {url}
    
    Here is the text scraped from the website (if any):
    {text}
    """
    
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=prompt,
        config={
            'response_mime_type': 'application/json',
            'response_schema': ScholarshipData,
            'temperature': 0.1,
        },
    )
    
    return json.loads(response.text)

def map_data_to_col(data: dict) -> list:
    return [
        [data.get('new_for_2026', '')],
        [data.get('new_for_2025', '')],
        [data.get('last_updated', '')],
        [data.get('due_date', '')],
        [data.get('in_state_national', '')],
        [data.get('portal_scholarship', '')],
        [data.get('amount', '')],
        [data.get('location_information', '')],
        [data.get('name_of_scholarship', '')],
        [data.get('application_link_method', '')],
        [data.get('summary', '')],
        [data.get('stated_min_gpa', '')],
        [data.get('school_type', '')],
        [data.get('renewing_non_renewing', '')],
        [data.get('focus', '')],
        [data.get('acute_financial_need', '')],
        [data.get('accepts_gap_year', '')],
        [data.get('poc', '')],
        [data.get('notes', '')],
        [data.get('known_applicants_2025', '')]
    ]

# Helper to write a column
def append_column(sheet, col_index, values):
    import gspread.utils
    col_letter = gspread.utils.rowcol_to_a1(1, col_index).replace('1', '')
    range_name = f"{col_letter}1:{col_letter}{len(values)}"
    sheet.update(range_name, values)

def transpose_to_vertical_if_needed(spreadsheet, master_headers):
    # Determine if Scraped Data needs to be cleared and rebuilt vertically
    try:
        out_tab = spreadsheet.worksheet("Scraped Data")
        logging.info("Found existing 'Scraped Data' tab.")
        all_vals = out_tab.get_all_values()
        
        # If the first row length > 0 and the first cell is our first header, but it's horizontal (e.g. len > 1 and it matches master headers)
        if all_vals and len(all_vals) > 0 and all_vals[0] == master_headers:
            logging.info("Tab is horizontal! Transposing it to vertical...")
            
            # Transpose
            max_cols = max(len(r) for r in all_vals)
            transposed = []
            for c in range(max_cols):
                new_row = []
                for r in range(len(all_vals)):
                    val = all_vals[r][c] if c < len(all_vals[r]) else ""
                    new_row.append(val)
                transposed.append(new_row)
            
            out_tab.clear()
            out_tab.update('A1', transposed)
            logging.info("Transposition complete.")
            return True
        else:
            # Maybe already vertical
            if all_vals and len(all_vals) > 0 and all_vals[0][0] == master_headers[0]:
                logging.info("Tab is already vertical.")
                return True
                
        return True
    except gspread.exceptions.WorksheetNotFound:
        logging.info("Creating new 'Scraped Data' tab vertically.")
        out_tab = spreadsheet.add_worksheet(title="Scraped Data", rows=100, cols=1000)
        # Write headers vertically
        vert_headers = [[h] for h in master_headers]
        out_tab.update('A1', vert_headers)
        return False

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

    transpose_to_vertical_if_needed(spreadsheet, master_headers)
    out_tab = spreadsheet.worksheet("Scraped Data")

    # Read raw URLs from Tab 3
    try:
        tab2 = spreadsheet.worksheet("Resource: \"Unique\" Finds_Updated 10_2_25")
    except:
        tab2 = spreadsheet.get_worksheet(3)
    tab2_data = tab2.get_all_values()

    if not tab2_data:
        logging.info("Tab 2 is empty.")
        return

    tab2_headers = tab2_data[0]
    
    # Check how many columns are currently in Scraped Data
    try:
        scraped_data = out_tab.get_all_values()
        num_scraped_cols = max(len(r) for r in scraped_data) if scraped_data else 1
    except:
        num_scraped_cols = 1
        
    logging.info(f"Target tab currently has {num_scraped_cols - 1} data columns.")
    
    num_scraped = num_scraped_cols

    # Process rows
    for i in range(num_scraped, len(tab2_data)):
        row = tab2_data[i]
        
        # Check if the row is completely empty
        if not any(str(c).strip() for c in row):
            continue

        url = ""
        # Find any cell starting with http
        for cell in row:
            if str(cell).strip().startswith("http"):
                url = str(cell).strip()
                break
        
        # Build the row context string
        row_str_parts = []
        for idx, h in enumerate(tab2_headers):
            val = row[idx] if idx < len(row) else ""
            row_str_parts.append(f"{h}: {val}")
        row_str = "\n".join(row_str_parts)
        
        logging.info(f"Processing row {i+1}...")
        
        text = ""
        if url:
            logging.info(f"  Found URL to scrape: {url}")
            try:
                text = extract_text_from_url(url)
            except Exception as e:
                logging.error(f"  Failed to scrape {url}: {e}")
                text = f"[Scrape failed: {e}]"
        
        try:
            data = extract_advanced_data(row_str, url, text)
            
            # Put the source URL into the Notes column
            if url:
                if 'notes' in data and data['notes']:
                    data['notes'] = data['notes'] + f"\\nSource URL: {url}"
                else:
                    data['notes'] = f"Source URL: {url}"

            col_data = map_data_to_col(data)
            
            # We want to insert into column num_scraped_cols + 1
            num_scraped_cols += 1
            append_column(out_tab, num_scraped_cols, col_data)
            logging.info(f"  => Appended to column {num_scraped_cols} successfully.")
            
            # Rate limit
            time.sleep(4)
        except Exception as e:
            logging.error(f"  => Failed to process row {i+1}: {e}")

if __name__ == "__main__":
    main()
