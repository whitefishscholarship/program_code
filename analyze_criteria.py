import os
import json
import base64
import requests
import urllib.parse
from dotenv import load_dotenv
from google import genai

load_dotenv()
load_dotenv('web/.env.local')

from google.oauth2.service_account import Credentials
import google.auth.transport.requests

def get_grid_data():
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
    creds.refresh(google.auth.transport.requests.Request())
    
    url_req = f"https://sheets.googleapis.com/v4/spreadsheets/{sheet_id}?ranges=Scraped%20Data!A1:Z2000&fields=sheets(data(rowData(values(formattedValue))))"
    headers = {'Authorization': f'Bearer {creds.token}'}
    res = requests.get(url_req, headers=headers)
    grid_data = res.json().get('sheets', [{}])[0].get('data', [{}])[0].get('rowData', [])
    return grid_data

def main():
    grid_data = get_grid_data()
    if not grid_data:
        print("Tab is empty.")
        return

    headers = [cell.get('formattedValue', '') for cell in grid_data[0].get('values', [])]
    
    try: focus_idx = headers.index('Focus')
    except: focus_idx = 14
        
    try: summary_idx = headers.index('Summary')
    except: summary_idx = 10
        
    try: name_idx = headers.index('Name of Scholarship')
    except: name_idx = 8

    # Extract all text segments to feed to Gemini
    # We will grab all non-empty focus fields, and the first 200 non-empty summaries
    focus_items = []
    summaries = []
    
    for row in grid_data[1:]:
        cells = row.get('values', [])
        focus = cells[focus_idx].get('formattedValue', '') if len(cells) > focus_idx else ''
        summary = cells[summary_idx].get('formattedValue', '') if len(cells) > summary_idx else ''
        
        if focus and str(focus).strip() != 'Any':
            focus_items.append(str(focus).strip())
        if summary and len(summary) > 10:
            summaries.append(str(summary).strip())
            
    # De-duplicate
    focus_items = list(set(focus_items))
    summaries = list(set(summaries))
    
    # We don't want to blow up the context window, so we'll pass all focus items, and an excerpt of summaries.
    context_str = "FOCUS AREAS EXTRACTED:\n" + "\n".join(focus_items) + "\n\nSUMMARIES EXTRACTED (Sample):\n" + "\n".join(summaries[:300])
    
    api_key = os.getenv("GEMINI_API_KEY")
    client = genai.Client(api_key=api_key) if api_key else genai.Client()
    
    prompt = f"""
    You are an expert scholarship analyst for a web application designed to help Montana high school students find scholarships.
    Every student using this app will be living in Montana, but they may go to a university anywhere in the US or internationally.
    
    I am providing you with hundreds of "Focus" tags and "Summaries" directly extracted from our database of over 400 scraped scholarships.
    I need you to analyze this data and identify a handful (about 15-25) of the most prominent, niche, or important specific characteristics that we should ask the student about in the frontend questionnaire.
    
    Examples the user provided: dyslexia, foster care, acute financial need, first generation Native American.
    Do not just stick to the user's examples. Give me a comprehensive list based on the provided data text below. Group them into logical categories (e.g., Hardships, Demographics, Academic Interests, Extracurriculars). 
    
    Output your answer in clean Markdown format so I can read it to the user.
    
    DATA TEXT EXCERPTS:
    {context_str}
    """
    
    print("Asking Gemini to analyze criteria...")
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=prompt
    )
    
    with open("criteria_analysis.md", "w") as f:
        f.write(response.text)
        
    print("Analysis saved to criteria_analysis.md")

if __name__ == "__main__":
    main()
