"""Read-only verification of selected SD2 evidence; no source or application calls."""
import collections
import datetime
import hashlib
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
PACKET = Path(__file__).resolve().parent
ENTRY = '1697789a6ba4c8fd4f9026778318abb020986455'
WORKBOOK = '1-rgieaL5Hd87W97Zzx9SPFFSmPAmSPGqkzPYnjDQzL0'
ORDER = ['award-2179b44d009d','award-97dfaadd1d31','award-ce44143820a7']


def sha(data):
    return hashlib.sha256(data).hexdigest()


def git(*args):
    return subprocess.check_output(['git', *args], cwd=ROOT)


def native(files):
    rows = {i:{} for i in range(2,796)}
    for file in files:
        receipt = json.loads(file.read_text())
        assert not receipt['result']['isError']
        result = receipt['result']['structuredContent']
        assert result['spreadsheetId'] == WORKBOOK
        assert len(result['sheets']) == 1
        sheet = result['sheets'][0]
        assert sheet['properties']['sheetId'] == 405588227
        assert len(sheet['data']) == 2
        for block in sheet['data']:
            start = block['startRow'] + 1
            col = block['startColumn']
            width = {5:2,14:1}[col]
            arg = next(x for x in receipt['args']['ranges']
                       if x.split('!')[1].startswith(chr(65+col)))
            end = int(arg.split(':')[1][1:])
            assert arg.startswith("'School Resource - Cleaned Up'!")
            assert 2 <= start <= end <= 795
            row_data = block.get('rowData', [])
            assert len(row_data) <= end-start+1
            for row in range(start,end+1):
                cells = row_data[row-start].get('values',[]) if row-start < len(row_data) else []
                assert len(cells) <= width
                for offset in range(width):
                    letter = chr(65+col+offset)
                    assert letter not in rows[row]
                    rows[row][letter] = cells[offset] if offset < len(cells) else {}
    assert all(set(cells) == {'F','G','O'} for cells in rows.values())
    return rows


start = datetime.datetime.now(datetime.timezone.utc).isoformat()
first = native(sorted(PACKET.glob('inventory-[0-9]*.json')))
final = native([PACKET/'inventory-final.json'])
assert first == final
ledger = json.loads((PACKET/'inventory-ledger.json').read_text())
assert len(ledger['rows']) == 794
assert {r['row'] for r in ledger['rows']} == set(range(2,796))
assert all(r['cells'] == first[r['row']] for r in ledger['rows'])
assert collections.Counter(r['rowOutcome'] for r in ledger['rows']) == {
    'named_identity_pending':411,'empty_selected_projection':383}
assert ledger['counts']['unselectedNamedRows'] == 408
assert ledger['duplicateNameGroups'][0]['rows'] == [40,68]
assert ledger['counts']['uniqueExactNames'] == 410
for kind in ['file','sheet']:
    before = json.loads((PACKET/(kind+'-metadata-before.json')).read_text())['result']['structuredContent']
    after = json.loads((PACKET/(kind+'-metadata-after.json')).read_text())['result']['structuredContent']
    assert before == after

proposals = json.loads((PACKET/'proposals.json').read_text())
assert proposals['orderedAwardIds'] == ORDER
assert [r['awardId'] for r in proposals['records']] == ORDER
assert proposals['acceptedFacts'] == 0 and proposals['humanFactReviewer'] is None
allowed_states = {'verified','unstated','unverified','conflict','inaccessible'}
allowed_freshness = {'applicable','historical','refresh_needed','unknown'}
evidence = {e['evidenceId']:e for e in proposals['evidence']}
assert len(evidence) == len(proposals['evidence']) == 42
for e in evidence.values():
    assert sha((PACKET/e['artifact']).read_bytes()) == e['artifactSha256']
    assert e['acceptance'] in {'proposed','held'} and e['reviewer'] is None
for record in proposals['records']:
    assert record['acceptedFacts'] == 0
    receipt = json.loads((PACKET/record['freshRowCapture']).read_text())
    result = receipt['result']['structuredContent']
    assert result['spreadsheetId'] == WORKBOOK
    block = result['sheets'][0]['data'][0]
    row = block['startRow'] + 1
    cells = block['rowData'][0]['values']
    assert len(cells) <= 15
    assert cells[6]['formattedValue'] == record['recordedName']
    assert cells[5] == first[row]['F'] and cells[6] == first[row]['G'] and cells[14] == first[row]['O']
    ledger_row = next(r for r in ledger['rows'] if r['row'] == row)
    assert ledger_row['selectedAwardId'] == record['awardId']
    for field in record['fields'].values():
        assert field['state'] in allowed_states and field['freshness'] in allowed_freshness
        assert field['acceptance'] in {'proposed','held'}
        assert all(e in evidence for e in field['evidenceIds'])
assert proposals['records'][0]['fields']['entryGpa']['value']['minimum'] == 3.0
assert proposals['records'][0]['fields']['fundingKind']['value'] == 'mixed'
assert proposals['records'][1]['fields']['deadline']['value']['precision'] == 'month_only'
assert proposals['records'][2]['fields']['currentOffering']['value'] is None
assert proposals['records'][2]['fields']['deadline']['value'] is None

assert (PACKET/'nd-program-source.txt').read_bytes() == (PACKET/'nd-singular-source.txt').read_bytes()
faq = json.loads((PACKET/'aopa-faq-extraction.json').read_text())
assert faq['pageCount'] == faq['pagesExtracted'] == 4
assert all(p['text'].strip() for p in faq['pages'])
assert not any('Barnes' in p['text'] for p in faq['pages'])
assert json.loads((PACKET/'nd-faq-extraction.json').read_text())['publicBirthdateExampleRedactions'] == 1
for path in PACKET.rglob('*'):
    if path.is_file() and path.suffix != '.py':
        text = path.read_text()
        assert 'Set-Cookie:' not in text
        if path.suffix == '.json':
            payload = json.loads(text)
            if 'result' in payload and isinstance(payload['result'], dict):
                assert 'spreadsheetUrl' not in payload['result'].get('structuredContent', {})
        assert not re.search(r'born between\s+[A-Za-z]+\s+\d', text)

controls = ['AGENTS.md','docs/SCHOLARSHIP_SYSTEM_BUILD_PLAN.md','docs/BUILD_STATE.json',
            'docs/STUDENT_DATA_CONTRACT.md']
for path in controls:
    assert (ROOT/path).read_bytes() == git('show',ENTRY+':'+path)
for subtree in ['docs/evidence/sd1','docs/evidence/sd1-continuation','docs/evidence/student-data-plan']:
    for path in git('ls-tree','-r','--name-only',ENTRY,subtree).decode().splitlines():
        assert (ROOT/path).read_bytes() == git('show',ENTRY+':'+path)
assert not git('diff',ENTRY,'--name-only','web','.github')
plan_path = 'docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md'
def attention(text):
    return text[text.index('### Open attention items'):text.index('Resolved here:')]
current_attention = attention((ROOT/plan_path).read_text())
assert current_attention == attention(git('show',ENTRY+':'+plan_path).decode())
assert len([l for l in current_attention.splitlines() if l.startswith('| ')]) - 2 == 9
assert (ROOT/'docs/CURRENT_HANDOFF.md').read_bytes().endswith(git('show',ENTRY+':docs/CURRENT_HANDOFF.md'))
m1 = json.loads(git('show','009fa57:docs/evidence/season-monitor-m1/inventory.json'))
assert len(m1['records']) == len({r['id'] for r in m1['records']}) == 437
assert collections.Counter(r['kind'] for r in m1['records']) == {'catalog_award':411,'research_lead':26}
git('diff','--check',ENTRY)
primary = '/Users/kelseystuart/Documents/Codex/2026-08-23/i-x20/work/program_code'
assert subprocess.check_output(['git','-C',primary,'rev-parse','HEAD']).decode().strip() == '20476b8384cfbda6aaa04a3da4b7f0a3fbd291e5'
assert not subprocess.check_output(['git','-C',primary,'status','--porcelain'])
print(json.dumps({'outcome':'PASS','scope':'selected local SD2 evidence only',
                  'startedAt':start,'endedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),
                  'selectedRows':794,'namedRows':411,'emptySelectedProjectionRows':383,
                  'orderedSelectedAwards':3,'fieldEvidenceRecords':42,'acceptedFacts':0,
                  'nativeBeforeAfterEquality':True,'reportedMetadataEquality':True,
                  'versionAndAtomicSnapshotProof':False,'allNineAttentionRowsPreserved':True,
                  'allHistoricalEvidenceAndControlBytesPreserved':True,'retainedM1UniqueRecords':437,
                  'runtimeDeploymentBytesChanged':False,'primaryCheckoutChanged':False},indent=2))
