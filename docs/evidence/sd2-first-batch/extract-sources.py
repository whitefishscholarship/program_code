"""Offline, bounded source extraction; this script performs no network access."""
import hashlib
import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent
BLOCKS = {'p', 'div', 'section', 'article', 'h1', 'h2', 'h3', 'h4', 'li', 'ul', 'ol', 'br'}


class VisibleText(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.skip = 0
        self.parts = []

    def handle_starttag(self, tag, attrs):
        if tag in {'script', 'style', 'head', 'svg'}:
            self.skip += 1
        elif not self.skip and tag in BLOCKS:
            self.parts.append('\n')

    def handle_endtag(self, tag):
        if tag in {'script', 'style', 'head', 'svg'}:
            self.skip -= 1
        elif not self.skip and tag in BLOCKS:
            self.parts.append('\n')

    def handle_data(self, value):
        if not self.skip:
            self.parts.append(value)

    def text(self):
        return '\n'.join(line for part in ''.join(self.parts).splitlines()
                         if (line := re.sub(r'\s+', ' ', part).strip()))


SPECS = {
    'pell': ('/private/tmp/sd2-pell-full.html', 'Pell Promise for Qualified Students', 'Take the Next Step'),
    'nd-singular': ('/private/tmp/sd2-nd-singular.html', 'Scholarship Overview', 'Community Scholarship Opportunities'),
    'nd-program': ('/private/tmp/sd2-nd-program.html', 'Scholarship Overview', 'Community Scholarship Opportunities'),
    'nd-faq': ('/private/tmp/sd2-nd-faq.html', 'Timeline', 'Additional Questions?'),
    'aopa-program': ('/private/tmp/sd2-aopa-program.html', 'SCHOLARSHIPS FOR WHEREVER AVIATION TAKES YOU', 'Examples of Past Scholarships'),
}


def extract(key):
    filename, start, end = SPECS[key]
    raw = Path(filename).read_bytes()
    parser = VisibleText()
    parser.feed(raw.decode('utf-8'))
    full = parser.text()
    start_at = full.index(start)
    end_at = full.index(end, start_at) if end else len(full)
    text = full[start_at:end_at].strip()
    if key == 'aopa-program':
        child_start = full.index('The David and Lisa Barnes Flight Training Scholarship', end_at)
        child_end = full.index('The Dudley D.', child_start)
        text += '\nExamples of Past Scholarships [parent section heading]\n' + full[child_start:child_end].strip()
    if key.startswith('nd-') and key != 'nd-faq':
        assert 'Applications are Now Closed for the 2026 Scholarship' in full
        text = 'Applications are Now Closed for the 2026 Scholarship\n' + text
    # The public FAQ's age example includes birthdate values. Never retain those values.
    text, redactions = re.subn(r'For 2026-2027 scholarships, that means any student born between .*?eligible to apply\.',
                               '[Public birthdate example omitted; no birthdate values retained.]', text)
    # Public support-email addresses are irrelevant to the selected facts; do not retain them.
    text = re.sub(r'[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}', '[public support email omitted]', text)
    path = ROOT / (key + '-source.txt')
    path.write_text(text + '\n')
    evidence = {
        'sourceKey': key, 'rawResponseSha256': hashlib.sha256(raw).hexdigest(),
        'rawResponseBytes': len(raw), 'decodedVisibleTextCharacters': len(full),
        'fieldScopeStart': start, 'fieldScopeEndExclusive': end,
        'additionalFieldScope': ({'parentHeading': 'Examples of Past Scholarships',
                                  'start': 'The David and Lisa Barnes Flight Training Scholarship',
                                  'endExclusive': 'The Dudley D.'} if key == 'aopa-program' else None),
        'fieldScopeCharacters': len(text), 'retainedSourcePath': path.name,
        'retainedSourceSha256': hashlib.sha256(path.read_bytes()).hexdigest(),
        'publicBirthdateExampleRedactions': redactions,
        'rawBodyCommitted': False,
        'completeness': 'Entire identified HTML field scope parsed; other page sections excluded explicitly. This does not prove linked-source, application or runtime completeness.',
    }
    (ROOT / (key + '-extraction.json')).write_text(json.dumps(evidence, indent=2) + '\n')
    print(json.dumps(evidence))


if __name__ == '__main__':
    for key in sys.argv[1:]:
        extract(key)
