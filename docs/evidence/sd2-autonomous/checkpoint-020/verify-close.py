"""Read-only author closure audit, separate from immutable research review."""
from pathlib import Path
import json,hashlib,subprocess,datetime
P=Path(__file__).resolve().parent;R=P.parents[3]
load=lambda p:json.loads(p.read_text());sha=lambda b:hashlib.sha256(b).hexdigest()
g=lambda *a:subprocess.check_output(['git',*a],cwd=R)
started=datetime.datetime.now(datetime.timezone.utc).isoformat()
m=load(P/'final-manifest.json');rv=load(P/'review.json');receipt=load(P/'local-review-receipt.json')['commit']
assert rv['outcome']=='PASS' and rv['binding']['manifestSha256']==sha((P/'final-manifest.json').read_bytes())
assert rv['binding']['candidateCommit']==m['candidateCommit'] and not any(rv['severityCounts'].values())
for f in m['changedFiles']:assert sha((R/f['path']).read_bytes())==f['sha256'],f['path']
for path in ['final-manifest.json','review.json']:assert (P/path).read_bytes()==g('show',receipt+':'+str((P/path).relative_to(R)))
assert g('rev-parse',receipt+'^').decode().strip()==m['candidateCommit']
assert set(g('diff','--name-only',m['candidateCommit'],receipt).decode().splitlines())=={str((P/x).relative_to(R)) for x in ['final-manifest.json','review.json']}
check=subprocess.run(['python3',str(P/'verify.py'),'--review-bound'],cwd=R,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
assert check.returncode==0,check.stderr.decode();v=json.loads(check.stdout)
assert v['routeCounts']==dict(identities=400,fields=7284,seeds=668,links=1116)
assert v['M1Records']==437 and v['priorCustodyPins']==71 and not v['custodyGaps']
for path in ['SESSION_WRAP.md','SESSION_CLOSE.md']:
 t=(P/path).read_text();assert all(s in t for s in ['owner','trigger','400','7284','6','437','SD3'])
 assert m['candidateCommit'] in t and receipt in t
for path in ['docs/CURRENT_HANDOFF.md','docs/evidence/sd2-autonomous/NEXT_SESSION.md']:
 raw=(R/path).read_bytes();assert raw.endswith(g('show',m['entryCommit']+':'+path))
 top=raw.decode().split('---')[0];assert all(s in top for s in ['400','407','6','7284','0accepted'])
plan=(R/'docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md').read_text();a='<!-- SD2-CHECKPOINT-020-START -->\n';z='<!-- SD2-CHECKPOINT-020-END -->\n'
assert plan.count(a)==plan.count(z)==1 and plan[:plan.index(a)]+plan[plan.index(z)+len(z):]==g('show',m['entryCommit']+':docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md').decode()
wrap=load(P/'wrap-plan.json');assert wrap['exitCode']==0 and sha((R/wrap['logPath']).read_bytes())==wrap['logSha256']
subprocess.run(['git','diff','--check',m['entryCommit']],cwd=R,check=True)
print(json.dumps(dict(outcome='PASS',scope='Separate author no-loss closure; immutable research review preserved',startedAt=started,completedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),candidateCommit=m['candidateCommit'],localReviewReceiptCommit=receipt,allReviewedCandidateFilesUnchanged=True,allPriorHandoffSection9BytesPreserved=True,routeCounts=v['routeCounts'],pendingReviewerWork=False,verification=v,planCheck=wrap,nextCheckpointInputOffset=400,nextInputKey='saved-405588227-row-407',nextInputName='THE RICHARD MCSPADDEN SCHOLARSHIP FOR ADVANCED PILOT TRAINING',nextOwner='Next-session Codex source/identity reconciliation',nextTrigger='Next session under existing AUTHORITY/POLICY',nextAction='Resume ONE bounded checkpoint;preserve every hold/review binding;never initialize/reset/replay;stop before SD3',fullSD2Complete=False,canonicalAcceptance=False,acceptedFacts=0,externalEffects=False,SD3Started=False),indent=2))
