"""Read-only author no-loss closeout, separate from immutable research review."""
from pathlib import Path
import json,hashlib,subprocess,datetime
P=Path(__file__).resolve().parent;B=P.parent;R=P.parents[3]
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
assert v['routeCounts']==dict(identities=406,fields=7406,seeds=676,links=1127)
assert v['M1Records']==437 and v['priorCustodyPins']==71 and not v['custodyGaps']
packets=[load(B/f'checkpoint-{i:03d}.json') for i in range(1,22)]
assert sum(len(p['sourceRegistry']) for p in packets)==365
inherited=[dict(packet=f'{i:03d}',sourceId=s['sourceId'],owner=s.get('owner'),trigger='Inherited original shared source evidence-arrival/consolidation route',authoritativePath=f"docs/evidence/sd2-autonomous/checkpoint-{i:03d}.json",nextAction='Retain exact original source limitations and shared source/evidence route; no historical schema rewrite') for i,p in enumerate(packets,1) for s in p['sourceRegistry'] if not all(s.get(k) for k in ['owner','trigger','nextAction'])]
assert len(inherited)==35 and all(x['owner'] for x in inherited)
converted=0
for i in [19,20,21]:
 c=load(B/f'checkpoint-{i:03d}/conversion-link-dispositions.json')
 for s in c['sources']:
  for d in s['destinations']:
   converted+=1;assert all(d.get(k) for k in ['owner','trigger','nextAction','disposition'])
assert converted==628
for path in ['SESSION_WRAP.md','SESSION_CLOSE.md']:
 t=(P/path).read_text();assert all(s in t for s in ['owner','trigger','406','7406','437','SD3'])
 assert m['candidateCommit'] in t and receipt in t
for path in ['docs/CURRENT_HANDOFF.md','docs/evidence/sd2-autonomous/NEXT_SESSION.md']:
 raw=(R/path).read_bytes();assert raw.endswith(g('show',m['entryCommit']+':'+path))
 top=raw.decode().split('---')[0];assert all(s in top for s in ['406','7406','0accepted','Stop before SD3'])
plan=(R/'docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md').read_text();a='<!-- SD2-CHECKPOINT-021-START -->\n';z='<!-- SD2-CHECKPOINT-021-END -->\n'
assert plan.count(a)==plan.count(z)==1 and plan[:plan.index(a)]+plan[plan.index(z)+len(z):]==g('show',m['entryCommit']+':docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md').decode()
wrap=load(P/'wrap-plan.json');assert wrap['exitCode']==0 and sha((R/wrap['logPath']).read_bytes())==wrap['logSha256']
subprocess.run(['git','diff','--check',m['entryCommit']],cwd=R,check=True)
print(json.dumps(dict(outcome='PASS',scope='Separate author no-loss closeout; immutable research reviews preserved',startedAt=started,completedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),candidateCommit=m['candidateCommit'],localReviewReceiptCommit=receipt,allReviewedCandidateFilesUnchanged=True,allPriorHandoffSection9BytesPreserved=True,routeCounts=v['routeCounts'],sourceReceipts=365,inheritedHistoricalSourceRoutes=inherited,conversionDestinationRoutes=628,pendingReviewerWork=False,verification=v,planCheck=wrap,nextCheckpointInputOffset=406,nextInputKey=None,nextInputName=None,initialQueueCoverageComplete=True,nextOwner='Next-session Codex source/identity reconciliation; Kelsey selects further execution scope',nextTrigger='Next-session local preparation; separately selected scope before further execution',nextAction='Prepare exact bounded SD2 consolidation/hold-reconciliation proposal from saved evidence; no automatic source reads/consolidation,never initialize/reset/replay,stop before SD3',fullSD2Complete=False,canonicalAcceptance=False,acceptedFacts=0,externalEffects=False,SD3Started=False),indent=2))
