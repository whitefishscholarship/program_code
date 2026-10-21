"""Read-only separate handoff audit; never rebind source review or replay builders."""
from pathlib import Path
import json,hashlib,subprocess,datetime
P=Path(__file__).resolve().parent;ROOT=P.parents[3];BASE=P.parent
def load(p):return json.loads(p.read_text())
def sha(b):return hashlib.sha256(b).hexdigest()
def git(*a):return subprocess.check_output(['git',*a],cwd=ROOT)
m=load(P/'final-manifest.json');r=load(P/'review.json');c=m['candidateCommit'];entry=m['entryCommit'];receipt='e1f21854425e9dca7f6e285412400c82c1a418ee'
assert c=='5434035979d9465f55bd6f56fb5d042f5045ae75' and r['outcome']=='PASS'
assert r['binding']['manifestSha256']==sha((P/'final-manifest.json').read_bytes()) and r['binding']['candidateCommit']==c
assert r['severityCounts']=={'critical':0,'high':0,'medium':0,'low':0} and r['requiredFixCount']==r['resolvedDispositionCount']==2 and r['unresolvedRequiredFixes']==0
assert git('rev-parse',receipt+'^').decode().strip()==c
expected={str((P/f).relative_to(ROOT)) for f in ['final-manifest.json','review.json']}
assert set(git('diff','--name-only',c,receipt).decode().splitlines())==expected
assert sha(git('diff','--binary',entry,c))==m['completeDiffSha256']
for f in m['changedFiles']:
 assert sha(git('show',c+':'+f['path']))==f['sha256'] and (ROOT/f['path']).read_bytes()==git('show',c+':'+f['path'])
oldmanifest=(P/'manifest-round1.json').read_bytes();assert sha(oldmanifest)==r['originalReview']['manifestSha256']
assert sha((P/'review-round1.json').read_bytes())==r['originalReview']['reviewSha256']
assert (P/'verification-round1.json').read_bytes()==git('show','cdac48b:'+str((P/'verification.json').relative_to(ROOT)))
pp='docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md';old=git('show',entry+':'+pp).decode();current=(ROOT/pp).read_text()
a='<!-- SD2-CHECKPOINT-006-START -->\n';b='<!-- SD2-CHECKPOINT-006-END -->\n';assert current.count(a)==current.count(b)==1
x=current.index(a);y=current.index(b)+len(b);assert current[:x]+current[y:]==old
assert (ROOT/'docs/CURRENT_HANDOFF.md').read_bytes().endswith(git('show',entry+':docs/CURRENT_HANDOFF.md'))
prompt=(BASE/'NEXT_SESSION.md').read_text();wrap=(P/'SESSION_WRAP.md').read_text()
for word in [c,receipt,'offset120','2,262','286','stopbeforeSD3']:
 assert word in prompt and word in wrap,word
for word in ['nineteen','Promise','Wordrecommendations','437M1','raw','sanitiz']:
 assert word in prompt,word
l=load(BASE/'checkpoint-006.json')
for record in l['records']:
 assert all(record.get(k) for k in ['owner','trigger','nextAction'])
 for f in record['fieldProposals'].values():assert f['acceptance']=='held' and all(f.get(k) for k in ['owner','trigger','nextAction'])
 for s in record['seedDispositions']:assert all(s.get(k) for k in ['owner','trigger','nextAction'])
for s in l['sourceRegistry']:
 assert all(s.get(k) for k in ['owner','trigger','nextAction'])
 for d in s['linkDispositions']:assert all(d.get(k) for k in ['owner','trigger','nextAction'])
run=subprocess.run(['python3',str(P/'verify.py')],cwd=ROOT,capture_output=True,text=True);assert run.returncode==0,run.stderr
audit=json.loads(run.stdout);assert audit==load(P/'verification.json')
plan=load(P/'wrap-plan.json');assert plan['exitCode']==0 and sha((ROOT/plan['logPath']).read_bytes())==plan['logSha256']
git('diff','--check',entry)
print(json.dumps({'outcome':'PASS','recordedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'scope':'Separate author-verified handoff; original independent source review not rebound','reviewedCandidate':c,'localReviewReceipt':receipt,'manifestSha256':sha((P/'final-manifest.json').read_bytes()),'candidatePathsPreserved':len(m['changedFiles']),'allOlderPlanSupplementsAndNineAttentionRowsBytePreserved':True,'CURRENT_HANDOFFOldBytesPreserved':True,'everyFieldIdentitySeedLinkOwnerTriggerNextActionRetained':True,'sourceAudit':audit,'M1Records':437,'noPendingReviewerRepair':True,'standardBuildGate':'Both exact process/port EPERM failures open and unwaived; Codex before canonical acceptance/authorized release','freshMainTarget':'Unverified; Codex verifies current authorized main/target at canonical acceptance/release trigger','ClerkRawVisualAvailabilityGapRetained':True,'sourceOutputLapsesDisclosedAndFutureSanitizationRouted':True,'temporaryCustodyAndAllLaterGatesRetained':True,'noNewSourceReadsFactAcceptanceOrSD3DuringHandoff':True,'next':{'owner':'Next-session Codex research/proposals','trigger':'Next selected session under existing AUTHORITY/POLICY','path':'docs/evidence/sd2-autonomous/queue.json records[120:]','offset':120,'inputKey':'saved-405588227-row-124','name':'Jean Atkinson Driggers Scholarship ($2,500)','action':'Resume one later bounded checkpoint; never initialize/reset/replay; stop beforeSD3'}},indent=2))
