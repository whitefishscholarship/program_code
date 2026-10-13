"""Verify immutable local research closeout and the separately authorized docs wrap."""
import datetime,hashlib,json,subprocess,sys
from pathlib import Path
P=Path(__file__).resolve().parent;ROOT=P.parents[2]
ENTRY='807fe41ee900c5350e1de1a324d4e1d9bbdd8bfa'
commands=[]
def now():return datetime.datetime.now(datetime.timezone.utc).isoformat()
def sha(b):return hashlib.sha256(b).hexdigest()
def run(args,cwd=ROOT):
 start=now();r=subprocess.run(args,cwd=cwd,capture_output=True)
 commands.append({'command':args,'cwd':str(cwd),'startedAt':start,'endedAt':now(),
                  'exitCode':r.returncode,'stdoutSha256':sha(r.stdout),'stderr':r.stderr.decode()})
 assert r.returncode==0,(args,r.stdout.decode(),r.stderr.decode())
 return r.stdout
def git(*a):return run(['git',*a])
def read(n):return json.loads((P/n).read_text())
start=now();assert git('branch','--show-current').decode().strip()=='codex/plan-student-data-maintenance'
head=git('rev-parse','HEAD').decode().strip()
git('merge-base','--is-ancestor',ENTRY,head)
review=read('review.json');manifest=read('final-candidate-manifest.json')
assert review['outcome']=='PASS' and sum(review['severityCounts'].values())==0
assert review['candidateCommit']==manifest['candidateCommit']==git('rev-parse',ENTRY+'^').decode().strip()
assert review['candidateTree']==manifest['candidateTree']==git('rev-parse',manifest['candidateCommit']+'^{tree}').decode().strip()
assert sha((P/'final-candidate-manifest.json').read_bytes())==review['manifestSha256']
assert len(manifest['changedFiles'])==review['manifestFileCount']==41
assert len(review['dispositions'])==review['priorFindingCounts']['medium']==1
assert review['dispositions'][0]['status']=='fixed'
assert set(git('diff','--name-only',ENTRY+'^',ENTRY).decode().splitlines())=={
 'docs/evidence/sd2-jaycee/final-candidate-manifest.json','docs/evidence/sd2-jaycee/review.json'}
for f in manifest['changedFiles']:
 b=git('show',manifest['candidateCommit']+':'+f['path']);assert sha(b)==f['sha256'];assert len(b)==f['bytes']
for key,baseline in [('entryToCandidate',manifest['entryBaseline']),('retainedMainToCandidate',manifest['retainedMainBaseline'])]:
 assert sha(git('diff','--binary',baseline,manifest['candidateCommit']))==manifest['completeDiffSha256'][key]
preserved=[]
for path in git('ls-tree','-r','--name-only',ENTRY,'docs/evidence','docs/reviews','AGENTS.md',
 'docs/SCHOLARSHIP_SYSTEM_BUILD_PLAN.md','docs/BUILD_STATE.json','docs/STUDENT_DATA_CONTRACT.md','web','.github').decode().splitlines():
 b=git('show',ENTRY+':'+path);assert (ROOT/path).read_bytes()==b,path
 preserved.append({'path':path,'sha256':sha(b)})
plan_path='docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md';plan=(ROOT/plan_path).read_text()
old=git('show',ENTRY+':'+plan_path).decode()
a=plan.index('<!-- SD2-JAYCEE-SESSION-WRAP-START -->');b=plan.index('<!-- SD2-JAYCEE-SESSION-WRAP-END -->')+len('<!-- SD2-JAYCEE-SESSION-WRAP-END -->\n')
assert plan[:a]+plan[b:]==old
def attention(s):return s[s.index('### Open attention items'):s.index('Resolved here:')]
assert attention(plan)==attention(old)
assert len([l for l in attention(plan).splitlines() if l.startswith('| ')])-2==9
assert (ROOT/'docs/CURRENT_HANDOFF.md').read_bytes().endswith(git('show',ENTRY+':docs/CURRENT_HANDOFF.md'))
selected=read('proposals.json');assert selected['acceptedFacts']==0 and selected['humanFactReviewer'] is None
assert selected['orderedInputLocators']==[40,68]
assert all(r['outcome']=='held' and r['identityHoldPreserved'] for r in selected['records'])
assert all(e['acceptance']=='held' for e in selected['evidence'])
assert selected['denominators']['remainingNamedRowsWithoutSelectedResearch']==406
assert not selected['fullSD2Complete'] and not selected['SD3Started']
wrap=(P/'SESSION_WRAP.md').read_text()
for value in ['Montana sponsor','406','Pell/Neurodiversity/Barnes','Human fact reviewer',
 'Standard npm run build','Workbook version','437','ETV/Fund the Fish','sender/service/receipt',
 'suppression','measured pilot/full sweep','recovery/catch-up/schedule health','Canonical acceptance']:
 assert value in wrap,value
for row in selected['records']:
 for field,value in row['fields'].items():
  assert value['acceptance']=='held'
# Original verifier independently checks complete captures/proposals, all older attention
# supplements and exact historical M1 artifacts; no source calls or file writes.
evidence=json.loads(run(['python3',str(P/'verify-evidence.py')]))
git('diff','--check',ENTRY)
state=json.loads((ROOT/'docs/BUILD_STATE.json').read_text())
assert state['activeStageId'] is None and state['nextPermittedStageId'] is None
check_path=P/'wrap-plan-check-retry.json'
if not check_path.exists():check_path=P/'wrap-plan-check.json'
check=json.loads(check_path.read_text());assert check['exitCode']==0
receipt={'outcome':'PASS','scope':'original selected SD2 local objective plus docs-only session wrap; no new technical/canonical/fact acceptance',
 'startedAt':start,'endedAt':now(),'entryCloseout':ENTRY,'reviewedCandidate':manifest['candidateCommit'],
 'reviewedTree':manifest['candidateTree'],'reviewSha256':sha((P/'review.json').read_bytes()),
 'manifestSha256':review['manifestSha256'],'candidateFilesVerified':41,'completeDiffBindingsVerified':True,
 'unresolvedReviewerFindings':0,'priorMediumFindingsFixedAndRechecked':1,
 'priorEvidenceReviewControlAndRuntimeFilesPreserved':len(preserved),
 'preservedPathHashLedgerSha256':sha(json.dumps(preserved,sort_keys=True).encode()),
 'allNineRowsAndPriorSupplementsPreserved':True,'priorHandoffExactSuffixPreserved':True,
 'allSelectedFieldHoldsRouted':'Codex research/proposals under later exact source/identity selection; human reviewer before acceptance',
 'retainedM1Records':437,'M1RoutesTriggersRebuilt':False,'evidenceVerification':evidence,
 'planCheckReceipt':str(check_path.relative_to(ROOT)),'standardBuild':'Original exact normal/permitted retry EPERM remains open; no replay or waiver',
 'freshRemoteMainAndTarget':'unverified; retained local objects only','acceptedFacts':0,'fullSD2Complete':False,'SD3Started':False,
 'newWorkbookOrSourceReads':0,'workbookWrites':0,'externalEffects':0,
 'localEffects':'read-only verification, documentation and authorized local Git checkpoint only',
 'actualBackendModelAndEffort':'unavailable; no switch','recommendedNextEffort':'High',
 'nextAction':'Next-session Codex local hold triage and bounded next-read proposal; Kelsey selects any further exact reads.',
 'reviewerTaskStatus':'completed; verified with collaboration.list_agents during wrap',
 'wrapVerifierIssue':{'initialFailure':'KeyError: activeStage; verifier used the wrong field name',
   'resolution':'Author corrected assertions to existing activeStageId and nextPermittedStageId; both null. BUILD_STATE unchanged.',
   'status':'fixed; final verification passed'},
 'commands':commands}
if '--check' not in sys.argv:
 (P/'wrap-verification.json').write_text(json.dumps(receipt,indent=2)+'\n')
print(json.dumps({k:v for k,v in receipt.items() if k not in ['commands','evidenceVerification']},indent=2))
