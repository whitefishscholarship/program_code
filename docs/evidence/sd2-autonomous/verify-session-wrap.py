"""Read-only historical/cursor/hold closeout audit; writes only its wrap receipt."""
from pathlib import Path
import collections,datetime,hashlib,json,subprocess

P=Path(__file__).resolve().parent;ROOT=P.parents[2]
ENTRY='6551d2e5b9c72563375f272f3462b7439137c9f0'
ORIGINAL='3f3462d26a046a25ab1a3738d4556e312b64823d'
started=datetime.datetime.now(datetime.timezone.utc).isoformat()
def git(*args):return subprocess.check_output(['git',*args],cwd=ROOT)
def sha(b):return hashlib.sha256(b).hexdigest()
def load(path):return json.loads((ROOT/path).read_text())
commands=[]
for command in [['python3','docs/evidence/sd2-autonomous/verify.py'],
                ['python3','docs/evidence/sd2-autonomous/build-queue.py','--check'],
                ['git','diff','--check']]:
 begin=datetime.datetime.now(datetime.timezone.utc).isoformat()
 result=subprocess.run(command,cwd=ROOT,capture_output=True,text=True)
 commands.append({'command':command,'cwd':str(ROOT),'startedAt':begin,
  'endedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),
  'exitCode':result.returncode,'stdout':result.stdout,'stderr':result.stderr})
 assert result.returncode==0,commands[-1]
allowed={'docs/CURRENT_HANDOFF.md','docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md'}
preserved=[]
for entry in git('ls-tree','-r','-z',ENTRY).split(b'\0'):
 if not entry:continue
 meta,path=entry.split(b'\t',1);mode,kind,blob=meta.decode().split();path=path.decode()
 if path in allowed:continue
 assert kind=='blob',path
 content=(ROOT/path).read_bytes()
 actual=hashlib.sha1(b'blob '+str(len(content)).encode()+b'\0'+content).hexdigest()
 assert actual==blob,path
 preserved.append({'path':path,'blob':blob,'sha256':sha(content)})
plan=(ROOT/'docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md').read_text()
a=plan.index('<!-- SD2-AUTONOMOUS-START -->');b=plan.index('<!-- SD2-AUTONOMOUS-END -->')+len('<!-- SD2-AUTONOMOUS-END -->\n\n')
assert plan[:a]+plan[b:]==git('show',ORIGINAL+':docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md').decode()
table=plan.split('| Attention item / evidence |',1)[1].split('\nResolved here:',1)[0]
assert len([line for line in table.splitlines() if line.startswith('| ')])-1==9
assert (ROOT/'docs/CURRENT_HANDOFF.md').read_bytes().endswith(git('show',ENTRY+':docs/CURRENT_HANDOFF.md'))

bindings=[]
for prefix in ['docs/evidence/sd2-autonomous/policy','docs/evidence/sd2-autonomous/research',
               'docs/evidence/sd2-jaycee/final-candidate']:
 manifestPath=prefix+'-manifest.json';reviewPath=(prefix+'-review.json' if 'autonomous' in prefix else 'docs/evidence/sd2-jaycee/review.json')
 manifest=load(manifestPath);review=load(reviewPath);candidate=manifest['candidateCommit']
 assert sha((ROOT/manifestPath).read_bytes())==review['manifestSha256']
 assert candidate==review['candidateCommit'] and review['outcome']=='PASS'
 assert git('rev-parse',candidate+'^{tree}').decode().strip()==manifest['candidateTree']
 for file in manifest['changedFiles']:
  content=git('show',candidate+':'+file['path']);assert sha(content)==file['sha256']
  assert len(content)==file['bytes']
 if isinstance(manifest['completeDiffSha256'],dict):
  assert sha(git('diff','--binary',manifest['entryBaseline'],candidate))==manifest['completeDiffSha256']['entryToCandidate']
  assert sha(git('diff','--binary',manifest['retainedMainBaseline'],candidate))==manifest['completeDiffSha256']['retainedMainToCandidate']
 else:assert sha(git('diff','--binary',manifest['entryCommit'],candidate))==manifest['completeDiffSha256']
 bindings.append({'manifestPath':manifestPath,'reviewPath':reviewPath,'candidateCommit':candidate,
  'manifestSha256':sha((ROOT/manifestPath).read_bytes()),'reviewSha256':sha((ROOT/reviewPath).read_bytes())})
assert git('rev-parse','807fe41^').decode().strip()==bindings[-1]['candidateCommit']
assert git('rev-parse',ENTRY+'^').decode().strip()==bindings[1]['candidateCommit']
assert set(git('diff','--name-only',ENTRY+'^',ENTRY).decode().splitlines())=={
 'docs/evidence/sd2-autonomous/research-manifest.json','docs/evidence/sd2-autonomous/research-review.json'}

history=load('docs/evidence/sd2-next-read-proposal/verification.json')
m1pins=history['retainedM1Artifacts'];assert len(m1pins)==12
for item in m1pins:assert sha(git('show','009fa57:'+item['path']))==item['sha256']
m1=json.loads(git('show','009fa57:docs/evidence/season-monitor-m1/inventory.json'))
assert len(m1['records'])==len({r['id'] for r in m1['records']})==437
l=load('docs/evidence/sd2-autonomous/checkpoint-001.json');q=load('docs/evidence/sd2-autonomous/queue.json')
fields=[f for r in l['records'] for f in r['fieldProposals'].values()]
assert len(fields)==344 and all(f['acceptance']=='held' for f in fields)
assert len(q['records'][20:])==386 and q['records'][20]['rowLocator']==21
assert q['records'][20]['recordedName']=='Stockman Bank Next Gen Scholarship'
assert all(r['owner'] and r['trigger'] and r['nextAction'] for r in l['records'])
state=load('docs/BUILD_STATE.json');assert state['activeStageId'] is None and state['nextPermittedStageId'] is None
report={'outcome':'PASS','scope':'author-verified documentation closeout; no rebound review or canonical acceptance',
 'startedAt':started,'endedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),
 'entryCloseout':ENTRY,'historicalBindings':bindings,'preservedEntryPaths':len(preserved),
 'preservedEntryHashLedgerSha256':sha(json.dumps(preserved,sort_keys=True).encode()),
 'allNineOriginalRowsAndSupplementsPreserved':True,'priorHandoffExactSuffixPreserved':True,
 'M1ArtifactPins':m1pins,'M1Records':437,'M1RoutesRebuilt':False,
 'coverage':{'frozenInputs':406,'initiallyResearchedInputs':20,'sourceReceipts':18,'fieldEnvelopes':344,
  'fieldStates':dict(collections.Counter(f['state'] for f in fields)),'heldIdentities':20,'acceptedFacts':0,
  'unprocessedInputs':386,'nextQueueOffset':20,'nextSavedRow':21},
 'openItemRouting':{'authorityPath':'docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md section9',
  'supplementPath':'docs/evidence/sd2-autonomous/SESSION_WRAP.md',
  'allHeldFieldsSelector':'checkpoint-001.json records[*].fieldProposals[*]',
  'owner':'Codex research/identity reconciliation; existing human acceptance gate retained',
  'trigger':'applicable authorized evidence arrival or SD2 consolidation after initial remaining-queue coverage',
  'nextAction':'reconcile every hold; preserve unknowns and original routing; no fullSD2 claim until accounted',
  'sourceLinkDispositions':sum(len(s.get('linksDisposition',[])) for s in l['sourceRegistry'])},
 'resolvedReviewerFindings':{'policyMedium':1,'policyLow':1,'researchLow':1,'unresolved':0},
 'verificationMatrix':'reuse unchanged-source/runtime matrix in validation-summary.json; plan/type/tests PASS; standardbuildEPERM retained',
 'closeoutPlanCheckReceipt':'docs/evidence/sd2-autonomous/wrap-plan-check.json',
 'notVerified':['current live workbook/version/permissions/native preservation','fresh remote main/target',
  'unresolved identities/current-cycle/conflicting facts','real monitor operation/later publication/activation'],
 'reviewerTasks':'both independent GPT tasks completed; no outstanding delegated work',
 'newSourceOrWorkbookReads':0,'workbookWrites':0,'remoteGitReleaseContactLoginMessagesActivation':0,
 'localEffects':'documentation, local verification and authorized local closeout commit only',
 'fullSD2Complete':False,'SD3Started':False,'actualBackendModelAndEffort':'not independently observable; no switch claimed',
 'recommendedNextEffort':'High','commands':commands}
(P/'wrap-verification.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({k:report[k] for k in ['outcome','entryCloseout','preservedEntryPaths','coverage','M1Records','fullSD2Complete','SD3Started']},indent=2))
