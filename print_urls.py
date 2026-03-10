import json, os, gspread, base64
from dotenv import load_dotenv
load_dotenv()
load_dotenv('web/.env.local')
cred_str = os.getenv("GOOGLE_SERVICE_ACCOUNT_CREDENTIALS")
try:
    creds_parsed = json.loads(cred_str)
except:
    decoded = base64.b64decode(cred_str).decode('utf-8')
    creds_parsed = json.loads(decoded)
if 'private_key' in creds_parsed and '\\n' in creds_parsed['private_key']:
    creds_parsed['private_key'] = creds_parsed['private_key'].replace('\\n', '\n')
gc = gspread.service_account_from_dict(creds_parsed)
spreadsheet = gc.open_by_key(os.getenv("GOOGLE_SHEET_ID"))
tab2 = spreadsheet.get_worksheet(3)
for i, row in enumerate(tab2.get_all_values()[:30]):
    url = ""
    for cell in row:
        if str(cell).strip().startswith("http"):
            url = str(cell).strip()
            break
    print(f"Row {i+1}: {url}")
