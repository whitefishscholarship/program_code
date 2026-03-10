import os
import json
import base64
from google.oauth2.service_account import Credentials
import requests
import urllib.parse
from dotenv import load_dotenv

load_dotenv()
load_dotenv('web/.env.local')

def main():
    sheet_id = os.getenv("GOOGLE_SHEET_ID")
    scopes = ['https://www.googleapis.com/auth/spreadsheets.readonly']
    cred_str = os.getenv("GOOGLE_SERVICE_ACCOUNT_CREDENTIALS")
    
    try:
        creds_parsed = json.loads(cred_str)
    except:
        decoded = base64.b64decode(cred_str).decode('utf-8')
        creds_parsed = json.loads(decoded)
    if 'private_key' in creds_parsed and '\\n' in creds_parsed['private_key']:
        creds_parsed['private_key'] = creds_parsed['private_key'].replace('\\n', '\n')
    
    creds = Credentials.from_service_account_info(creds_parsed, scopes=scopes)
    
    # Needs a token refresh
    import google.auth.transport.requests
    creds.refresh(google.auth.transport.requests.Request())
    
    url_req = f"https://sheets.googleapis.com/v4/spreadsheets/{sheet_id}?ranges=Scraped%20Data!A1:Z1000&fields=sheets(data(rowData(values(hyperlink,formattedValue))))"
    headers = {'Authorization': f'Bearer {creds.token}'}
    res = requests.get(url_req, headers=headers)
    grid_data = res.json().get('sheets', [{}])[0].get('data', [{}])[0].get('rowData', [])

    if not grid_data:
        print("Tab is empty.")
        return

    headers_row = [cell.get('formattedValue', '') for cell in grid_data[0].get('values', [])]

    try:
        amt_idx = headers_row.index('Amount')
    except:
        amt_idx = 6 # fallback
        
    try:
        link_idx = headers_row.index('Application Link/Method')
    except:
        link_idx = 9

    try:
        name_idx = headers_row.index('Name of Scholarship')
    except:
        name_idx = 8

    missing_amount = 0
    missing_link = 0
    missing_both = 0
    missing_rows = []
    total = len(grid_data) - 1

    for i, row in enumerate(grid_data[1:]):
        cells = row.get('values', [])
        
        name = cells[name_idx].get('formattedValue', '') if len(cells) > name_idx else ''
        amt = cells[amt_idx].get('formattedValue', '') if len(cells) > amt_idx else ''
        link = cells[link_idx].get('formattedValue', '') if len(cells) > link_idx else ''
        
        is_missing_amt = not amt.strip() or amt.strip().lower() in ['tbd', 'any', 'none', 'varies', 'unknown']
        is_missing_link = not link.strip() or not link.startswith('http')
        
        if is_missing_amt:
            missing_amount += 1
        if is_missing_link:
            missing_link += 1
            
        if is_missing_amt and is_missing_link:
            missing_both += 1
            
        if is_missing_amt or is_missing_link:
            missing_rows.append({'row': i+2, 'name': name, 'missing_amt': is_missing_amt, 'missing_link': is_missing_link})

    print(f"Total entries: {total}")
    print(f"Missing Amount: {missing_amount} ({missing_amount/total*100:.1f}%)")
    print(f"Missing Link: {missing_link} ({missing_link/total*100:.1f}%)")
    print(f"Missing Both: {missing_both} ({missing_both/total*100:.1f}%)")
    print(f"Total rows requiring second pass: {len(missing_rows)}")

if __name__ == '__main__':
    main()
