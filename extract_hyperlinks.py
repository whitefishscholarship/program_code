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
tab2 = spreadsheet.worksheet("Resource: \"Unique\" Finds_Updated 10_2_25")

from google.oauth2.service_account import Credentials
from google.auth.transport.requests import Request
import requests
import urllib.parse

scopes = ['https://www.googleapis.com/auth/spreadsheets']
creds = Credentials.from_service_account_info(creds_parsed, scopes=scopes)
creds.refresh(Request())

url = f"https://sheets.googleapis.com/v4/spreadsheets/{spreadsheet.id}?ranges={urllib.parse.quote(tab2.title)}!A1:H100&fields=sheets(data(rowData(values(hyperlink,formattedValue))))"
headers = {'Authorization': f'Bearer {creds.token}'}
res = requests.get(url, headers=headers)

print(json.dumps(res.json(), indent=2))
