import os
import json
import base64
import urllib.parse
import gspread
from dotenv import load_dotenv

load_dotenv()
load_dotenv('web/.env.local')

cred_str = os.getenv("GOOGLE_SERVICE_ACCOUNT_CREDENTIALS")
try:
    creds_parsed = json.loads(cred_str)
except:
    decoded = base64.b64decode(cred_str).decode('utf-8')
    creds_parsed = json.loads(decoded)

if 'private_key' in creds_parsed and '\n' not in creds_parsed['private_key']:
    creds_parsed['private_key'] = creds_parsed['private_key'].replace('\\n', '\n')

gc = gspread.service_account_from_dict(creds_parsed)

sheet_id = os.getenv("GOOGLE_SHEET_ID")
spreadsheet = gc.open_by_key(sheet_id)

try:
    tab2 = spreadsheet.worksheet("Resource: \"Unique\" Finds_Updated 10_2_25")
except:
    tab2 = spreadsheet.get_worksheet(3)
    
cells = tab2.findall("aea.net")
print(f"Found aea.net at lines: {[c.row for c in cells]}")

