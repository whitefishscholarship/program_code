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

def inspect():
    gc = get_gspread_client()
    sheet_id = os.getenv("GOOGLE_SHEET_ID")
    spreadsheet = gc.open_by_key(sheet_id)
    
    for i, worksheet in enumerate(spreadsheet.worksheets()):
        print(f"Tab {i}: {worksheet.title}")
        print(f"  First 3 rows:")
        for r in range(1, 4):
            try:
                print(f"    R{r}: {worksheet.row_values(r)[:5]}")
            except:
                pass

inspect()
