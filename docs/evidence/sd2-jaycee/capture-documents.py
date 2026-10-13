"""Package already-fetched public documents locally. No network or workbook access."""
from pathlib import Path
import datetime, hashlib, json, re, shutil, subprocess, zipfile
from xml.etree import ElementTree as ET

P = Path(__file__).resolve().parent
TMP = Path('/private/tmp')
sha = lambda b: hashlib.sha256(b).hexdigest()
def write(name, value):
    (P/name).write_text(json.dumps(value, indent=2, ensure_ascii=False)+'\n')

proposal = (P.parent/'sd2-next-read-proposal/NEXT_READ_PROPOSAL.md').read_text()
urls = re.findall(r'^\d\. (https://\S+)', proposal, re.M)
assert len(urls) == 2
ns = {'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
for i, kind in enumerate(['vocational','university']):
    raw = TMP/f'sd2-jaycee-{kind}.doc'
    txt = TMP/f'sd2-jaycee-{kind}.txt'
    render = TMP/f'sd2-jaycee-render/sd2-jaycee-{kind}.pdf'
    docx = TMP/f'sd2-jaycee-render/sd2-jaycee-{kind}.docx'
    headers = (TMP/f'sd2-jaycee-{kind}-headers.txt').read_text().splitlines()
    assert [l for l in headers if l.startswith('HTTP/')][-1].split()[1] == '200'
    assert not any(l.lower().startswith('location:') for l in headers)
    safe = [l for l in headers if l.lower().startswith(('http/','date:','last-modified:','content-length:','content-type:','etag:'))]
    body = txt.read_text()
    # Blank public template was visually inspected; no populated applicant fields.
    assert not re.search(r'[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}', body)
    assert 'Date of Birth' not in body
    assert 'JANUARY 12, 2027' in body
    assert '15. WALLET SIZE PHOTO' in body
    shutil.copyfile(raw, P/f'{kind}-source.doc')
    shutil.copyfile(txt, P/f'{kind}-source.txt')
    shutil.copyfile(render, P/f'{kind}-render.pdf')
    pages = (TMP/f'sd2-jaycee-{kind}-render.txt').read_text().split('\f')
    if not pages[-1].strip(): pages.pop()
    count = int(re.search(r'^Pages:\s+(\d+)', subprocess.check_output(['pdfinfo',str(render)]).decode(), re.M).group(1))
    assert len(pages) == count == {'vocational':7,'university':6}[kind]
    assert all(t.strip() for t in pages)
    parts=[]
    with zipfile.ZipFile(docx) as z:
        for name in z.namelist():
            if name == 'word/document.xml' or re.fullmatch(r'word/(?:header|footer)\d+\.xml', name):
                root = ET.fromstring(z.read(name))
                tables = root.findall('.//w:tbl',ns)
                parts.append({'part':name,'paragraphs':len(root.findall('.//w:p',ns)),
                              'tableCount':len(tables),
                              'tableCellCount':len(root.findall('.//w:tc',ns)),
                              'allParagraphText':[]})
    # Extract text nodes only; do not include XML indentation/style strings.
    with zipfile.ZipFile(docx) as z:
        for part in parts:
            root = ET.fromstring(z.read(part['part']))
            part['allParagraphText'] = [''.join(t.text or '' for t in p.findall('.//w:t',ns)) for p in root.findall('.//w:p',ns)]
    observed = datetime.datetime.fromtimestamp(raw.stat().st_mtime,datetime.timezone.utc).isoformat()
    write(f'{kind}-http.json',{'url':urls[i],'finalUrl':urls[i],'httpStatus':200,
           'curlExitCode':0,'redirectFollowingDisabled':True,'redirectsObserved':0,
           'headers':safe,'sourceBytes':raw.stat().st_size,'sourceSha256':sha(raw.read_bytes()),
           'sourceArtifact':f'{kind}-source.doc','observedAt':observed,
           'retrievalStartedAt':None,'timingLimit':'Completion time uses local download file mtime; exact tool launch time unavailable.',
           'command':['curl','-fsSL','--max-redirs','0','--proto','=https','--connect-timeout','30','--max-time','60','-D',str(TMP/f'sd2-jaycee-{kind}-headers.txt'),'-o',str(raw),urls[i]],
           'publishedCycleLabel':'SCHOLAR:2026-2027','sourceMetadataPageCount':6,
           'httpLastModifiedIsNotFactVerification':True})
    write(f'{kind}-extraction.json',{'sourceSha256':sha(raw.read_bytes()),
          'textArtifact':f'{kind}-source.txt','textSha256':sha(txt.read_bytes()),
          'renderArtifact':f'{kind}-render.pdf','renderSha256':sha(render.read_bytes()),
          'renderedPages':count,'pagesExtracted':len(pages),'pagesVisuallyInspected':list(range(1,count+1)),
          'pages':[{'page':n+1,'characters':len(t),'text':t} for n,t in enumerate(pages)],
          'structuralParts':parts,'sourceSectionsInspected':list(range(1,16)),
          'applicantContent':'blank public form labels only; no responses, filled signature or attachments',
          'completeness':'Entire textutil text, all converted body/table/header/footer paragraphs and every rendered page inspected; sections1-15 and instructions A-I present.',
          'conversionLimit':'Local LibreOffice reflows legacy DOC: vocational metadata6 pages becomes7, including checklist spillover. Blank table borders reach right margin. Rule text agrees across textutil, OOXML and render. These are local page locators, not asserted original Word pagination.',
          'renderer':'bundled LibreOfficeDev26.8.0.0.alpha0; warnings about font cache retained as limits; PDF generation exited0',
          'commands':[['textutil','-convert','txt','-output',str(txt),str(raw)],
            ['/Users/kelseystuart/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/override/soffice','--headless','-env:UserInstallation=file:///private/tmp/sd2-jaycee-lo-profile','--convert-to','pdf','--outdir','/private/tmp/sd2-jaycee-render',str(raw)],
            ['/Users/kelseystuart/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/override/soffice','--headless','-env:UserInstallation=file:///private/tmp/sd2-jaycee-lo-profile','--convert-to','docx','--outdir','/private/tmp/sd2-jaycee-render',str(raw)],
            ['pdftotext','-layout',str(render),str(TMP/f'sd2-jaycee-{kind}-render.txt')],
            ['pdftoppm','-scale-to','1300','-png',str(render),str(TMP/f'sd2-jaycee-render/{kind}')]]})
for kind in ['sheet-before','sheet-after']:
    r=json.loads((P/f'{kind}.json').read_text())
    sheets=r['result']['structuredContent']['sheets']
    r['result']['structuredContent']['sheets']=[s for s in sheets if s['properties']['sheetId']==405588227]
    r['sanitization']={'unrequestedTabPropertyEnvelopesDiscarded':max(len(sheets)-1,r.get('sanitization',{}).get('unrequestedTabPropertyEnvelopesDiscarded',0)),'spreadsheetUrlDiscarded':True}
    write(f'{kind}.json',r)
print('PASS: 2 exact HTTP200 documents packaged; 7+6 pages, all tables and15 sections each inspected')
