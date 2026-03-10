import json
import os
import gspread
import base64
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

tab = spreadsheet.worksheet("Scraped Data")
data = tab.get_all_values()

# Print headers
headers = data[0]

# Print last 20 rows
tail_rows = data[-30:] if len(data) > 30 else data[1:]

print("============== LATEST 30 ROWS ==============")
for idx, row in enumerate(tail_rows):
    if len(row) > 9:
        name = row[8]
        amount = row[6]
        due = row[3]
        gpa = row[11]
        link = row[9]
        portal = row[5]
        print(f"Row {len(data) - len(tail_rows) + idx + 1} | Name: {name[:40].ljust(40)} | Amount: {amount[:15].ljust(15)} | Due: {due[:15].ljust(15)} | GPA: {gpa[:5].ljust(5)} | Portal: {portal[:11].ljust(11)} | Link: {link}")
