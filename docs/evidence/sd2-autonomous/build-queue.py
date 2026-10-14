"""Freeze the saved SD2 denominator; no network, spreadsheet or app mutation."""
from pathlib import Path
import hashlib,json,re,subprocess,sys
P=Path(__file__).resolve().parent; ROOT=P.parents[2]
ENTRY='3f3462d26a046a25ab1a3738d4556e312b64823d'
mode=sys.argv[1] if len(sys.argv)==2 else '--check'
if len(sys.argv)>2 or mode not in ['--check','--initialize']:
 raise SystemExit('Use --check (default) or first-time --initialize; no reset/force option.')
existing=[(P/n).exists() for n in ['queue.json','checkpoint-001.json']]
if mode=='--initialize' and any(existing):
 raise SystemExit('Refusing initialization: queue/checkpoint already exists; preserve recorded progress.')
if mode=='--check' and not all(existing):
 raise SystemExit('Both queue and checkpoint must exist for verification; first initialization requires --initialize.')
def sha(b):return hashlib.sha256(b).hexdigest()
def read(p):return json.loads((ROOT/p).read_text())
def git(*a):return subprocess.check_output(['git',*a],cwd=ROOT)
inputs=['docs/evidence/sd2-first-batch/inventory-ledger.json','docs/evidence/sd1/pilot.json',
        'web/fixtures/r3/catalog-v1.json','web/fixtures/p7/student-catalog.json']
pins=[]
for path in inputs:
 b=(ROOT/path).read_bytes();assert b==git('show',ENTRY+':'+path)
 pins.append({'path':path,'sha256':sha(b)})
inventory=read(inputs[0]); catalog=read(inputs[2])['catalog']
named=[r for r in inventory['rows'] if r['name']]
done=[18,40,68,255,400];priority=[45,290]
assert len(inventory['rows'])==794 and len(named)==411
remaining=[r for r in named if r['row'] not in done]
assert len(remaining)==406
remaining.sort(key=lambda r:(priority.index(r['row']) if r['row'] in priority else 2,r['row']))
def urls(cell):
 found=[]
 if cell.get('hyperlink'):found.append(cell['hyperlink'])
 value=cell.get('userEnteredValue',{})
 if value.get('stringValue','').startswith(('https://','http://')):found.append(value['stringValue'])
 if value.get('formulaValue'):
  found.extend(re.findall(r'HYPERLINK\(\s*"([^"]+)"',value['formulaValue'],re.I))
 for run in cell.get('textFormatRuns',[]):
  u=run.get('format',{}).get('link',{}).get('uri')
  if u:found.append(u)
 return found
records=[]
for r in remaining:
 seeds=list(dict.fromkeys(urls(r['cells']['F'])+urls(r['cells']['O'])))
 matches=[a for a in catalog['awards'] if a['name']==r['name']]
 aliases=[]
 for a in matches:
  if a['application'].get('url'):aliases.append(a['application']['url'])
  aliases += [s['url'] for s in catalog['sources'] if s['publicId'] in a['sourcePublicIds'] and s.get('url')]
 if r['row']==290:
  aliases.append('https://www.soroptimist.org/our-work/live-your-dream-awards/apply-for-the-live-your-dream-awards.html')
 records.append({'inputKey':f"saved-405588227-row-{r['row']}",'rowLocator':r['row'],
  'recordedName':r['name'],'recordedSeedUrls':seeds,'publishedSourceAliases':list(dict.fromkeys(aliases)),
  'publicIdCandidates':[a['publicId'] for a in matches],'identityAcceptance':'held',
  'identityBasis':'saved name/source candidates only; requires independent program/sponsor/route evidence',
  'status':'pending'})
result={'schemaVersion':1,'scope':'saved SD2 input keys, never accepted award identities',
 'entryCommit':ENTRY,'sourcePins':pins,'savedCounts':{'rows':794,'named':411,'emptyProjection':383,'uniqueExactNames':410},
 'alreadyResearchedLocators':done,'remainingNamedInputs':406,'priorityLocators':priority,
 'checkpointSize':20,'firstCheckpointInputKeys':[r['inputKey'] for r in records[:20]],
 'records':records,'noNewSpreadsheetRead':True,'humanCheckpointApprovalRequired':False,
 'canonicalFactOrStageAcceptance':False}
queue_text=json.dumps(result,indent=2)+'\n'
if mode=='--check':
 assert (P/'queue.json').read_text()==queue_text
 checkpoint=json.loads((P/'checkpoint-001.json').read_text())
 assert checkpoint['queueSha256']==sha(queue_text.encode())
 assert checkpoint['orderedInputKeys']==result['firstCheckpointInputKeys']
 assert [r['inputKey'] for r in checkpoint['records']]==result['firstCheckpointInputKeys']
 print('PASS:406 frozen inputs verified; existing checkpoint progress preserved without writes.')
 raise SystemExit(0)
(P/'queue.json').write_text(queue_text)
ledger={'schemaVersion':1,'queueSha256':sha((P/'queue.json').read_bytes()),'checkpoint':1,
 'orderedInputKeys':result['firstCheckpointInputKeys'],
 'records':[{'inputKey':r['inputKey'],'rowLocator':r['rowLocator'],'recordedName':r['recordedName'],
 'publicIdCandidates':r['publicIdCandidates'],'identityAcceptance':'held','outcome':'pending',
 'fieldProposals':{},'sourceReceipts':[],'owner':'Codex research/proposals',
 'nextAction':'read allowed source or record explicit source/access/identity hold'} for r in records[:20]],
 'sourceRegistry':[],'acceptedFacts':0,'researchComplete':False,'independentReview':'pending'}
(P/'checkpoint-001.json').write_text(json.dumps(ledger,indent=2)+'\n')
print('PASS:406 exact remaining inputs frozen;20 first-checkpoint inputs; no source or Sheet reads.')
