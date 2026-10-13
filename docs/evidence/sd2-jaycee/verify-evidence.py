"""Read-only checks of selected continuation evidence and exact retained history."""
from pathlib import Path
import collections,datetime,hashlib,json,re,subprocess
P=Path(__file__).resolve().parent;ROOT=P.parents[2];ENTRY='f742890'
def read(n):return json.loads((P/n).read_text())
def git(*a):return subprocess.check_output(['git',*a],cwd=ROOT)
def sha(b):return hashlib.sha256(b).hexdigest()
def result(n):
 r=read(n);assert not r['result']['isError'];return r['result']['structuredContent']
def attention(s):return s[s.index('### Open attention items'):s.index('Resolved here:')]
start=datetime.datetime.now(datetime.timezone.utc).isoformat()
assert git('rev-parse',ENTRY+'^').decode().startswith('a4e9c7c')
history=json.loads((ROOT/'docs/evidence/sd2-next-read-proposal/verification.json').read_text())
for rev,rec in history['verifiedObjects'].items():
 assert sha(git('cat-file','commit',rev))==rec['commitSha256']
 assert sha(git('cat-file','tree',rec['tree']))==rec['treeSha256']
for r in history['historicalEvidenceAndControlFiles']:
 assert sha((ROOT/r['path']).read_bytes())==r['sha256'],r['path']
assert sha((ROOT/'docs/evidence/sd2-next-read-proposal/NEXT_READ_PROPOSAL.md').read_bytes())==history['proposalSha256']
for p in git('ls-tree','-r','--name-only',ENTRY,'docs/evidence','docs/reviews').decode().splitlines():
 assert (ROOT/p).read_bytes()==git('show',ENTRY+':'+p),p
for p in ['AGENTS.md','docs/SCHOLARSHIP_SYSTEM_BUILD_PLAN.md','docs/BUILD_STATE.json','docs/STUDENT_DATA_CONTRACT.md']:
 assert (ROOT/p).read_bytes()==git('show',ENTRY+':'+p)
assert not git('diff',ENTRY,'--name-only','web','.github')
plan=(ROOT/'docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md').read_text();old=git('show',ENTRY+':docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md').decode()
assert attention(plan)==attention(old)
assert len([l for l in attention(plan).splitlines() if l.startswith('| ')])-2==9
# Remove the single new progress insert to prove all previous supplements are exact.
if '<!-- SD2-JAYCEE-CONTINUATION-START -->' in plan:
 a=plan.index('<!-- SD2-JAYCEE-CONTINUATION-START -->');b=plan.index('<!-- SD2-JAYCEE-CONTINUATION-END -->')+len('<!-- SD2-JAYCEE-CONTINUATION-END -->\n\n')
 assert plan[:a]+plan[b:]==old
else:assert plan==old
assert (ROOT/'docs/CURRENT_HANDOFF.md').read_bytes().endswith(git('show',ENTRY+':docs/CURRENT_HANDOFF.md'))
for kind in ['file','sheet']:assert result(kind+'-before.json')==result(kind+'-after.json')
sheet=result('sheet-before.json');assert sheet['spreadsheetId']=='1-rgieaL5Hd87W97Zzx9SPFFSmPAmSPGqkzPYnjDQzL0'
assert sheet['properties']['title']=='Spreadsheet Clean Up 4'
assert len(sheet['sheets'])==1
props=sheet['sheets'][0]['properties'];assert props['sheetId']==405588227
assert props['title']=='School Resource - Cleaned Up'
assert props['gridProperties']['rowCount']==795 and props['gridProperties']['columnCount']==25
identity=result('identity-before.json')['sheets'][0]['data']
assert [(x['startRow']+1,x['startColumn']) for x in identity]==[(40,5),(40,14),(68,5),(68,14)]
ledger=json.loads((ROOT/'docs/evidence/sd2-first-batch/inventory-ledger.json').read_text())
oldrows={x['row']:x for x in ledger['rows']}
for block in identity:
 for i,cell in enumerate(block['rowData'][0]['values']):
  assert {k:v for k,v in cell.items() if k!='effectiveValue'}==oldrows[block['startRow']+1]['cells'][chr(65+block['startColumn']+i)]
before=[]
for row in [40,68]:
 cap=result(f'row{row}-before.json');assert len(cap['sheets'])==1
 b=cap['sheets'][0]['data'];assert len(b)==1 and b[0]['startRow']+1==row
 assert b[0].get('startColumn',0)==0 and len(b[0]['rowData'][0]['values'])==15
 for col in [5,6,14]:
  cell=b[0]['rowData'][0]['values'][col]
  assert {k:v for k,v in cell.items() if k!='effectiveValue'}==oldrows[row]['cells'][chr(65+col)]
 before+=b
assert before==result('rows-after.json')['sheets'][0]['data']
assert read('identity-before.json')['endedAt']<=read('row40-before.json')['startedAt']
assert read('row40-before.json')['endedAt']<=read('vocational-http.json')['observedAt']<=read('row68-before.json')['startedAt']
assert read('row68-before.json')['endedAt']<=read('university-http.json')['observedAt']<=read('rows-after.json')['startedAt']
proposals=read('proposals.json');assert proposals['orderedInputLocators']==[40,68]
assert proposals['acceptedFacts']==0 and proposals['humanFactReviewer'] is None
assert [r['inputRecord']['rowLocator'] for r in proposals['records']]==[40,68]
assert all(r['outcome']=='held' and r['identityHoldPreserved'] and r['newAwardId'] is None for r in proposals['records'])
assert len(proposals['evidence'])==len({e['evidenceId'] for e in proposals['evidence']})==62
es={e['evidenceId']:e for e in proposals['evidence']}
for e in es.values():
 assert e['acceptance']=='held' and e['reviewer'] is None
 assert sha((P/e['sourceArtifact']).read_bytes())==e['sourceSha256']
 assert sha((P/e['extractionArtifact']).read_bytes())==e['extractionSha256']
 text=(P/e['sourceArtifact'].replace('.doc','.txt')).read_text()
 assert all(q in text for q in e['excerpts'])
for r in proposals['records']:
 for f in r['fields'].values():
  assert f['state'] in ['verified','unstated','unverified','conflict','inaccessible']
  assert f['acceptance']=='held' and all(e in es for e in f['evidenceIds'])
 assert r['fields']['deadline']['value']['value']=='2027-01-12'
 assert r['fields']['entryGpa']['value']['scale'] is None
 assert r['fields']['availability']['value'] is None
 assert r['fields']['montanaSponsorRelationship']['value'] is None
 assert r['fields']['montanaParticipation']['value'] is None
 assert r['fields']['needRequired']['value'] is None and r['fields']['needSelection']['value'] is None
 assert r['fields']['financialStatementAmbiguity']['state']=='conflict'
 assert r['fields']['materials']['value']['workingHomeEmailAddress']['required'] is True
 assert r['fields']['materials']['value']['applicantSignature']['required'] is True
 assert r['fields']['materials']['value']['completeApplicationForm']['required'] is True
for kind,count in [('vocational',7),('university',6)]:
 h=read(kind+'-http.json');x=read(kind+'-extraction.json')
 assert h['redirectsObserved']==0 and h['url']==h['finalUrl'] and h['httpStatus']==200
 assert h['sourceBytes']==(P/h['sourceArtifact']).stat().st_size
 assert x['pagesExtracted']==x['renderedPages']==count
 assert x['pagesVisuallyInspected']==list(range(1,count+1))
 assert x['sourceSectionsInspected']==list(range(1,16))
 assert all(p['text'].strip() for p in x['pages'])
 assert sum(p['tableCount'] for p in x['structuralParts'])>0
 assert sha((P/x['renderArtifact']).read_bytes())==x['renderSha256']
comp=read('identity-comparison.json');assert comp['acceptedMappings']==comp['newIdentitySeedsAllocated']==0
assert [x['existingPublicId'] for x in comp['records']]==['award-67de97a4f446','award-e05338ef963f']
for r in comp['comparedArtifacts']:assert sha((ROOT/r['path']).read_bytes())==r['sha256']
manifest=json.loads((ROOT/'docs/evidence/sd2-first-batch/candidate-manifest.json').read_text())
assert manifest['candidateCommit']==history['reviewedCandidate']
for f in manifest['changedFiles']:
 b=git('show',manifest['candidateCommit']+':'+f['path']);assert sha(b)==f['sha256'];assert len(b)==f['bytes']
m1=json.loads(git('show','009fa57:docs/evidence/season-monitor-m1/inventory.json'))
assert len(m1['records'])==len({r['id'] for r in m1['records']})==437
assert collections.Counter(r['kind'] for r in m1['records'])=={'catalog_award':411,'research_lead':26}
for artifact in history['retainedM1Artifacts']:
 assert sha(git('show','009fa57:'+artifact['path']))==artifact['sha256']
git('diff','--check')
print(json.dumps({'outcome':'PASS','scope':'local two-record held continuation only','startedAt':start,
 'endedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'selectedInputOutcomes':2,'fieldEvidenceEnvelopes':62,
 'completePublicDocuments':2,'localRenderPagesInspected':13,'identityHoldsRetained':2,'acceptedFacts':0,
 'nativeDetailEquality':True,'reportedMetadataEquality':True,'versionAndAtomicSnapshotProof':False,
 'allNineRowsAndPriorSupplementsExact':True,'originalM1Records':437,'historicalBindingsPreserved':True,
 'runtimeAndControlChanges':False,'remainingNamedRowsWithoutSelectedResearch':406,'fullSD2Complete':False,'SD3Started':False},indent=2))
