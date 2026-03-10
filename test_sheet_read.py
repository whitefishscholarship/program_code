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
out_tab = spreadsheet.worksheet("Scraped Data")

all_rows = out_tab.get_all_values()
print(f"Total Rows Extracted So Far: {len(all_rows)}")
# Print out the latest few rows
for row in all_rows[-5:]:
    print(f"Name: {row[8]} | Due Date: {row[3]} | Link: {row[9]}")
