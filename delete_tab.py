import os
import json
import base64
from dotenv import load_dotenv
import gspread

load_dotenv()
load_dotenv('web/.env.local')

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

def reset():
    gc = get_gspread_client()
    sheet_id = os.getenv("GOOGLE_SHEET_ID")
    spreadsheet = gc.open_by_key(sheet_id)
    
    try:
        ws = spreadsheet.worksheet("Scraped Data")
        spreadsheet.del_worksheet(ws)
        print("Deleted old Scraped Data tab.")
    except Exception as e:
        print(f"Could not delete: {e}")

reset()
