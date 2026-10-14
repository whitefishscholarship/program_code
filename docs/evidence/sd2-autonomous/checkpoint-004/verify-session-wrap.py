"""Read-only audited handoff; explicit recording refuses to replace any existing receipt."""
from pathlib import Path
import hashlib,json,subprocess,sys,datetime
P=Path(__file__).resolve().parent;ROOT=P.parents[3]
def git(*a):return subprocess.check_output(['git',*a],cwd=ROOT)
def sha(b):return hashlib.sha256(b).hexdigest()
def load(p):return json.loads(p.read_text())
m=load(P/'final-manifest.json');review=load(P/'review.json');binding=review['binding']
assert review['outcome']=='PASS' and all(n==0 for n in review['severityCounts'].values())
assert binding['manifestSha256']==sha((P/'final-manifest.json').read_bytes()) and binding['candidateCommit']==m['candidateCommit']
assert m['candidateTree']==git('rev-parse',m['candidateCommit']+'^{tree}').decode().strip()
assert sha(git('diff','--binary',m['entryCommit'],m['candidateCommit']))==m['completeDiffSha256']
for f in m['changedFiles']:
 b=git('show',m['candidateCommit']+':'+f['path']);assert sha(b)==f['sha256'] and len(b)==f['bytes'];assert (ROOT/f['path']).read_bytes()==b
receipt=git('rev-parse',m['candidateCommit']+'..HEAD').decode().strip()
# Discover exact local direct-child review receipt without treating it as canonical stage acceptance.
kids=git('rev-list','--ancestry-path',m['candidateCommit']+'..HEAD').decode().splitlines()
child=next(c for c in kids if git('rev-parse',c+'^').decode().strip()==m['candidateCommit'])
assert set(git('diff','--name-only',m['candidateCommit'],child).decode().splitlines())=={str((P/'final-manifest.json').relative_to(ROOT)),str((P/'review.json').relative_to(ROOT))}
for path in ['final-manifest.json','review.json']:assert git('show',child+':'+str((P/path).relative_to(ROOT)))==(P/path).read_bytes()
original=load(P/'manifest-round1.json');round1=load(P/'review-round1.json')
assert original['candidateCommit']=='8cd41aa9491cccd959839a3f93390619a4779d5d' and round1['binding']['manifestSha256']==sha((P/'manifest-round1.json').read_bytes())
assert len(review['dispositions'])==len(round1['findings'])==3
assert {d['findingId'] for d in review['dispositions']}=={f['id'] for f in round1['findings']}
r=subprocess.run(['python3',str(P/'verify.py')],cwd=ROOT,capture_output=True,text=True);assert r.returncode==0,(r.stdout,r.stderr);audit=json.loads(r.stdout)
plan=(ROOT/'docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md').read_text();old=git('show',m['entryCommit']+':docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md').decode()
a='<!-- SD2-CHECKPOINT-004-START -->\n';b='<!-- SD2-CHECKPOINT-004-END -->\n';assert plan.count(a)==plan.count(b)==1
x=plan.index(a);y=plan.index(b)+len(b);assert plan[:x]+plan[y:]==old
assert (ROOT/'docs/CURRENT_HANDOFF.md').read_bytes().endswith(git('show',m['entryCommit']+':docs/CURRENT_HANDOFF.md'))
nextsession=(P.parent/'NEXT_SESSION.md').read_text();assert 'offset80' in nextsession and 'Clayton E. Hoyt' in nextsession and 'Never initialize/reset/replay' in nextsession
wrap=(P/'SESSION_WRAP.md').read_text();assert all(x in wrap for x in ['Codex','Trigger','326','1,520','437','EPERM','beforeSD3'])
git('diff','--check',m['entryCommit'])
result={'outcome':'PASS','recordedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'scope':'Separateauthorverifiedsessionhandoff; never rebinds independent source review','reviewedCandidate':m['candidateCommit'],'localReviewReceipt':child,'manifestSha256':binding['manifestSha256'],'originalCandidate':original['candidateCommit'],'originalReviewPreserved':True,'threeFindingsIndependentlyResolved':True,'candidatePathsPreserved':len(m['changedFiles']),'allOlderPlanSupplementsAndNineAttentionRowsBytePreserved':True,'CURRENT_HANDOFFOldBytesPreserved':True,'everyFieldIdentitySeedLinkOwnerTriggerNextActionRetained':True,'M1Records':437,'sourceAudit':audit,'standardBuildGate':'bothrecordedEPERMfailuresremainopen','freshMainTarget':'unknownretainedpinonly','allLaterPreservationHumanCanonicalPublicationStudentMonitorEffectGatesRetained':True,'noNewResearchFactAcceptanceOrSD3':True,'next':{'owner':'NextsessionCodexresearch/proposals','trigger':'NextselectedsessionunderexistingAUTHORITY/POLICY','path':'docs/evidence/sd2-autonomous/queue.json records[80:]','inputKey':'saved-405588227-row-84','name':'Clayton E. Hoyt Endowed Scholarship','action':'Resumeoneboundedcheckpointat80; neverinitialize/reset/replay; stopbeforeSD3'}}
if '--record' in sys.argv:
 p=P/'wrap-verification.json';assert not p.exists(),'Existingreceiptwillnotbereplaced';p.write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result,indent=2))
