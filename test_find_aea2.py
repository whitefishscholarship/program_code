import os
import json
import base64
import urllib.parse
from dotenv import load_dotenv
from google.oauth2.service_account import Credentials
from google.auth.transport.requests import Request
import requests
import gspread

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

scopes = ['https://www.googleapis.com/auth/spreadsheets']
creds = Credentials.from_service_account_info(creds_parsed, scopes=scopes)
creds.refresh(Request())

gc = gspread.service_account_from_dict(creds_parsed)
sheet_id = os.getenv("GOOGLE_SHEET_ID")
spreadsheet = gc.open_by_key(sheet_id)
tab2 = spreadsheet.get_worksheet(3)

url_req = f"https://sheets.googleapis.com/v4/spreadsheets/{spreadsheet.id}?ranges={urllib.parse.quote(tab2.title)}!A1:Z500&fields=sheets(data(rowData(values(hyperlink,formattedValue))))"
headers = {'Authorization': f'Bearer {creds.token}'}
res = requests.get(url_req, headers=headers)
grid_data = res.json().get('sheets', [{}])[0].get('data', [{}])[0].get('rowData', [])

for idx, row in enumerate(grid_data):
    row_cells = row.get('values', [])
    for cell in row_cells:
        if 'hyperlink' in cell and 'aea.net' in cell['hyperlink'].lower():
            print(f"Found 'aea.net' on Row {idx + 1}")
        if 'formattedValue' in cell and 'aea.net' in cell['formattedValue'].lower():
            print(f"Found 'aea.net' in text on Row {idx + 1}")
