import os
import json
import logging
from typing import Optional, Tuple, List
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright
import requests
import io
import PyPDF2
from urllib.parse import urljoin, urlparse
from pydantic import BaseModel, Field
from dotenv import load_dotenv

# Optional: Google Sheets integration
try:
    import gspread
    from oauth2client.service_account import ServiceAccountCredentials
    GSPREAD_AVAILABLE = True
except ImportError:
    GSPREAD_AVAILABLE = False

from google import genai

load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

# Set up Gemini client
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    logging.warning("GEMINI_API_KEY environment variable not set. Using default environment if available.")

try:
    client = genai.Client()
except Exception as e:
    logging.error(f"Failed to initialize Gemini Client: {e}")
    client = None

# Define the expected output structure using Pydantic
class ScholarshipData(BaseModel):
    new_for_2026: Optional[str] = Field(description="Checkmark or 'x' if new for 2026, else empty")
    new_for_2025: Optional[str] = Field(description="Checkmark or 'x' if new for 2025, else empty")
    last_updated: Optional[str] = Field(description="Date the scholarship information was last updated or reviewed")
    due_date: Optional[str] = Field(description="Application deadline date")
    in_state_national: Optional[str] = Field(description="Is it 'In-State', 'National', or 'Any'?")
    portal_scholarship: Optional[str] = Field(description="Is it a 'Portal' or a specific 'Scholarship'?")
    amount: Optional[str] = Field(description="Dollar amount or 'TBD'")
    location_information: Optional[str] = Field(description="Sponsor or location/information about who offers it (e.g., Flathead Conservation District)")
    name_of_scholarship: Optional[str] = Field(description="Exact name of the scholarship")
    application_link_method: Optional[str] = Field(description="Method of applying: 'Paper Application', 'Application Portal', 'Printable Application', etc. MUST include the URL if one is found.")
    summary: Optional[str] = Field(description="A 2-3 sentence summary of the eligibility constraints and what the scholarship is for")
    stated_min_gpa: Optional[str] = Field(description="Minimum GPA required (e.g., '2.5', '2.0', or 'Any' if not stated)")
    school_type: Optional[str] = Field(description="Type of school: '2-Year', '4-Year', 'Trade', or 'Any'")
    renewing_non_renewing: Optional[str] = Field(description="'Renewing', 'Non-Renewing', or 'Any'")
    focus: Optional[str] = Field(description="Academic focus or major intended (e.g., 'Natural Resources', 'Any')")
    acute_financial_need: Optional[str] = Field(description="'Yes', 'No', or empty if unspecified")
    accepts_gap_year: Optional[str] = Field(description="Accepts Gap Year Applications Upon Return ('Yes' or empty)")
    poc: Optional[str] = Field(description="Point of Contact information (Phone numbers, emails, names)")
    notes: Optional[str] = Field(description="Any extra notes or contact progress")
    known_applicants_2025: Optional[str] = Field(description="Known number of applicants in 2025, if stated")

class ScholarshipList(BaseModel):
    scholarships: List[ScholarshipData] = Field(description="List of all distinct scholarships found on the page or portal.")

def extract_text_from_url(url: str) -> Tuple[str, List[str]]:
    """Fetches the URL, extracts clean text, and deeply crawls up to 2 relevant sub-pages for application info."""
    logging.info(f"Fetching Main URL: {url}")
    def fetch_page_text(target_url: str) -> Tuple[str, List[Tuple[str, str]]]:
        if target_url.lower().endswith(".pdf"):
            try:
                logging.info(f"  Downloading PDF: {target_url}")
                response = requests.get(target_url, timeout=15, headers={"User-Agent": "Mozilla/5.0"})
                response.raise_for_status()
                with io.BytesIO(response.content) as f:
                    reader = PyPDF2.PdfReader(f)
                    text = []
                    for page in reader.pages:
                        page_text = page.extract_text()
                        if page_text:
                            text.append(page_text)
                    return "\\n".join(text), []
            except Exception as e:
                logging.warning(f"  Failed to fetch PDF {target_url}: {e}")
                return "", []

        try:
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                page = browser.new_page(
                    user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
                    extra_http_headers={"Accept-Language": "en-US,en;q=0.9"}
                )
                page.goto(target_url, wait_until="networkidle", timeout=30000)
                
                # Try to click any generic accordion expanders to reveal hidden dollar amounts
                try:
                    buttons = page.locator('.accordion-block__btn, button[aria-expanded="false"], .accordion-trigger')
                    count = buttons.count()
                    for i in range(count):
                        buttons.nth(i).click(timeout=1000)
                    page.wait_for_timeout(1000)
                except Exception:
                    pass

                text = page.evaluate("document.body.innerText")
                html = page.content()
                browser.close()
                
                soup = BeautifulSoup(html, 'html.parser')
                links = []
                for a in soup.find_all('a', href=True):
                    href = a.get('href')
                    if href:
                        full_url = urljoin(target_url, href)
                        if full_url.startswith('http'):
                            link_text = a.get_text(strip=True).lower()
                            links.append((full_url, link_text))
                        
                return text, links
        except Exception as e:
            logging.warning(f"  Failed to fetch {target_url} via Playwright: {e}")
            return "", []

    main_text, main_links = fetch_page_text(url)
    
    # We want to find up to 3 "deep" links that might have application info
    base_domain = urlparse(url).netloc
    seen_urls = {url} # Don't re-crawl the main page
    scored_links = []
    
    for link_url, link_text in main_links:
        link_domain = urlparse(link_url).netloc
        if link_domain == base_domain or "apply" in link_url.lower() or "scholarship" in link_url.lower():
            if link_url not in seen_urls:
                score = 0
                lower_text = link_text.lower()
                lower_url = link_url.lower()
                
                # High priority
                if "apply" in lower_text or "application" in lower_text or "apply" in lower_url or "application" in lower_url:
                    score += 10
                if "scholarship" in lower_text or "scholarship" in lower_url:
                    score += 8
                
                # Medium priority
                if "detail" in lower_text or "criteria" in lower_text or "eligibility" in lower_text:
                    score += 5
                    
                # Low priority (often matches generic forms)
                if "form" in lower_text or "form" in lower_url:
                    score += 2
                if "click here" in lower_text:
                    score += 1

                # Demerits for obvious nav links
                if "member" in lower_url or "login" in lower_url or "contact" in lower_url:
                    score -= 10
                    
                if score > 0:
                    scored_links.append((score, link_url))
                    seen_urls.add(link_url)
                    
    # Sort by score descending and take the top 3
    scored_links.sort(key=lambda x: x[0], reverse=True)
    target_deep_links = [url for score, url in scored_links[:3]]
                        
    combined_text = f"--- MAIN PAGE ({url}) ---\n" + str(main_text) + "\n\n"
    
    for deep_url in target_deep_links:
        logging.info(f"  Deep crawling sub-page for details/application: {deep_url}")
        deep_text, _ = fetch_page_text(deep_url)
        if deep_text:
            combined_text = str(combined_text) + f"--- SECONDARY PAGE ({deep_url}) ---\n" + str(deep_text) + "\n\n"

    # Cap at ~60,000 chars to be totally safe with Gemini Flash tokens
    final_text = str(combined_text)[:60000]
    return final_text, target_deep_links

def extract_scholarship_data(url: str, text: str, deep_links: Optional[List[str]] = None) -> dict:
    """Uses Gemini to parse the unstructured text into our strictly defined schema."""
    logging.info("Extracting structured data using Gemini...")
    if deep_links is None:
        deep_links = []
        
    if not client:
        raise ValueError("Gemini client is not properly initialized.")
        
    prompt = f"""
    You are an expert scholarship directory extractor. I need you to read the following text from a university admissions, foundation, or general scholarship website and extract the relevant information.
    
    CRITICAL INSTRUCTION: DO NOT merge distinct scholarships together. If you see a landing page referencing 10 different specific scholarships (e.g. "Presidential Scholarship", "Transfer Student Award", "Stem Scholarship"), you MUST output an array containing 10 separate ScholarshipData objects.
    
    Map the information to the requested JSON array schema. If information for a field is not found in the text, leave it as an empty string ("") or "Any"/"TBD" as appropriate.
    
    CRITICAL INSTRUCTIONS FOR SPECIFIC FIELDS:
    1. `amount`: You MUST look very hard for any monetary amounts (e.g. $1,000, $500-$5000, "Varies", "Full Tuition", "Tuition Waiver"). Do not leave this blank if any dollar figure or variable amount is mentioned.
    2. `application_link_method`: You MUST output a literal raw URL starting with "http". DO NOT output words like "Application Portal", "Link", or "Information Document". If you cannot find a specific application form link in the text or in the crawled deep links ({', '.join(deep_links) if deep_links else 'None'}), you MUST fall back to exactly outputting: {url}. Your entire final output for this field must ALWAYS start with "http" unless it is completely blank.
    3. `due_date`: Note that multiple pages of text may be provided below. Ensure you look through all text for a deadline or due date and extract the most relevant one.
    4. `stated_min_gpa`: MUST find any mention of GPA, Grades, Academic Standing, or Transcripts. If they say "excellent academic standing", estimate "3.0" minimum, or extract the exact number (e.g., 2.5, 3.0). IF NOT STATED AT ALL, explicitly write "Any".
    5. `school_type`: MUST identify if this is for a 2-Year, 4-Year, Trade school, or Any. If the text mentions "University" or "College", default to "4-Year". If "Vocational", "Apprenticeship", or "Tech School", default to "Trade". IF NOT STATED, explicitly write "Any".
    6. `renewing_non_renewing`: Find any mention of "renewable", "one-time", "annual", "up to 4 years". If it says renewable, write "Renewing". If it says one-time or does not state it, default to "Non-Renewing" or "Any".
    
    Source URL: {url}
    
    Website Text (Contains multiple pages stitched together for maximum context):
    {text}
    """
    
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=prompt,
        config={
            'response_mime_type': 'application/json',
            'response_schema': ScholarshipList,
            'temperature': 0.1,
        },
    )
    
    # Ensure it returns the list inside the wrapper
    return json.loads(response.text)

# (Other functions clipped out here as they are unused directly in bulk scrape)
