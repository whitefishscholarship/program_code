# Scholarship Scraper

This is an AI-powered data extraction tool designed to scrape unstructured scholarship websites and convert them into a structured format ready for Google Sheets or CSV.

## Requirements

- Python 3.8+
- Google Gemini API Key

## Setup

1. **Create and activate a virtual environment**:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

2. **Install dependencies**:
   ```bash
   pip install requests beautifulsoup4 google-genai gspread oauth2client python-dotenv pydantic
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the same directory as `scraper.py` and add your Gemini API key:
   ```
   GEMINI_API_KEY=your_key_here
   ```

## Local Usage (Console/Text only)

Run the script against any scholarship URL. It will extract the text, send it to the LLM, and output the structured JSON.

```bash
python scraper.py "https://www.scholarships.com/scholarships/the-kim-and-harold-louie-family-foundation-scholarship-program"
```

## Google Sheets Integration

If you want the tool to automatically add the results to your Google Sheet:

1. Create a Service Account in your Google Cloud Console.
2. Download the JSON key file and save it as `credentials.json` in this directory.
3. **Important**: Open your Google Sheet and *share* it with the `client_email` found inside your `credentials.json` file, giving it "Editor" access.
4. Note your Google Sheet ID (the long string of characters in the URL, `https://docs.google.com/spreadsheets/d/<SHEET_ID>/edit`).

Run the script with the `--sheet-id` argument:
```bash
python scraper.py "https://www.scholarships.com/scholarships/the-kim-and-harold-louie-family-foundation-scholarship-program" --sheet-id <YOUR_SHEET_ID>
```
