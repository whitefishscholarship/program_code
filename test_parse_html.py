from bs4 import BeautifulSoup
import re

with open('tmp/fvcc.html', 'r', encoding='utf-8') as f:
    html = f.read()

soup = BeautifulSoup(html, 'html.parser')

text = soup.get_text(separator=' ', strip=True)

# Look for mentions of dollars
matches = re.finditer(r'.{0,40}\$.{0,40}', text)
count = 0
for match in matches:
    print(match.group(0))
    count += 1
    if count > 20:
        break
        
print("\n--- FIRST 2000 CHARS OF CLEAN PARSED TEXT ---")
print(text[:2000])
