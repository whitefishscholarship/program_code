"""Read-only final handoff audit; --record refuses to replace an existing receipt."""
from pathlib import Path
import json,hashlib,subprocess,datetime,sys
P=Path(__file__).resolve().parent;ROOT=P.parents[3]
def load(p):return json.loads(p.read_text())
def sha(b):return hashlib.sha256(b).hexdigest()
def git(*a):return subprocess.check_output(['git',*a],cwd=ROOT)
m=load(P/'final-manifest.json');r=load(P/'review.json');assert r['outcome']=='PASS'
assert all(n==0 for n in r['severityCounts'].values())
assert r['binding']['candidateCommit']==m['candidateCommit'] and r['binding']['manifestSha256']==sha((P/'final-manifest.json').read_bytes())
assert m['candidateTree']==git('rev-parse',m['candidateCommit']+'^{tree}').decode().strip()
assert sha(git('diff','--binary',m['entryCommit'],m['candidateCommit']))==m['completeDiffSha256']
for f in m['changedFiles']:
 b=git('show',m['candidateCommit']+':'+f['path']);assert sha(b)==f['sha256'] and len(b)==f['bytes']
 assert (ROOT/f['path']).read_bytes()==b,f['path']
kids=git('rev-list','--ancestry-path',m['candidateCommit']+'..HEAD').decode().splitlines()
child=next(c for c in kids if git('rev-parse',c+'^').decode().strip()==m['candidateCommit'])
assert set(git('diff','--name-only',m['candidateCommit'],child).decode().splitlines())=={str((P/'final-manifest.json').relative_to(ROOT)),str((P/'review.json').relative_to(ROOT))}
for path in ['final-manifest.json','review.json']:assert git('show',child+':'+str((P/path).relative_to(ROOT)))==(P/path).read_bytes()
run=subprocess.run(['python3',str(P/'verify.py')],cwd=ROOT,capture_output=True,text=True);assert run.returncode==0,(run.stdout,run.stderr);audit=json.loads(run.stdout)
plan=(ROOT/'docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md').read_text();before=git('show',m['entryCommit']+':docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md').decode()
a='<!-- SD2-CHECKPOINT-005-START -->\n';b='<!-- SD2-CHECKPOINT-005-END -->\n';assert plan.count(a)==plan.count(b)==1
x=plan.index(a);y=plan.index(b)+len(b);assert plan[:x]+plan[y:]==before
assert (ROOT/'docs/CURRENT_HANDOFF.md').read_bytes().endswith(git('show',m['entryCommit']+':docs/CURRENT_HANDOFF.md'))
nexttext=(P.parent/'NEXT_SESSION.md').read_text();assert all(x in nexttext for x in ['offset100','savedrow104','Keith P. Guelff','Never initialize/reset/replay','beforeSD3'])
wrap=(P/'SESSION_WRAP.md').read_text();assert all(x in wrap for x in ['Owner','Trigger','306','1,886','437','EPERM','beforeSD3','77link','brochure','HUD','publicity','custody'])
ledger=load(P.parent/'checkpoint-005.json')
for row in ledger['records']:
 assert all(row.get(k) for k in ['owner','trigger','nextAction'])
 for d in row['seedDispositions']:assert all(d.get(k) for k in ['owner','trigger','nextAction'])
for s in ledger['sourceRegistry']:
 assert all(s.get(k) for k in ['owner','trigger','nextAction'])
 for d in s['linkDispositions']:assert all(d.get(k) for k in ['owner','trigger','nextAction'])
git('diff','--check',m['entryCommit'])
result={'outcome':'PASS','recordedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'scope':'Separate author-verified handoff; does not rebind independent research review','reviewedCandidate':m['candidateCommit'],'localReviewReceipt':child,'manifestSha256':r['binding']['manifestSha256'],'candidatePathsPreserved':len(m['changedFiles']),'allOlderPlanSupplementsAndNineAttentionRowsBytePreserved':True,'CURRENT_HANDOFFOldBytesPreserved':True,'everyFieldIdentitySeedLinkOwnerTriggerNextActionRetained':True,'sourceAudit':audit,'M1Records':437,'standardBuildGate':'Both exact EPERM failures remain open; ownerCodexvalidation/governance; triggerbeforecanonicalacceptance/authorizedrelease','freshMainTarget':'Unknown; verify current authorized main/target at acceptance/release trigger','allLaterPreservationHumanCanonicalPublicationStudentMonitorEffectGatesRetained':True,'noPendingReviewerRepair':True,'noNewSourceReadsFactAcceptanceOrSD3DuringHandoff':True,'next':{'owner':'Next-session Codex research/proposals','trigger':'Next selected session under existing AUTHORITY/POLICY','path':'docs/evidence/sd2-autonomous/queue.json records[100:]','inputKey':'saved-405588227-row-104','name':'Keith P. Guelff Memorial Endowed Scholarship','action':'Resume one later bounded checkpoint at offset100; never initialize/reset/replay; stop beforeSD3'}}
if '--record' in sys.argv:
 path=P/'wrap-verification.json';assert not path.exists();path.write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result,indent=2))
