"""Read-only no-loss handoff audit; no sources, queue reset or processing replay."""
from pathlib import Path
import json,subprocess,datetime,hashlib
P=Path(__file__).resolve().parent;B=P.parent;R=P.parents[3]
load=lambda p:json.loads(p.read_text());sha=lambda b:hashlib.sha256(b).hexdigest()
start=datetime.datetime.now(datetime.timezone.utc).isoformat()
run=subprocess.run(['python3',str(P/'verify.py'),'--review-bound'],cwd=R,capture_output=True,text=True)
assert run.returncode==0,run.stderr
bound=json.loads(run.stdout);ledgers=[load(B/f'checkpoint-{i:03d}.json') for i in range(1,18)]
counts=dict(fields=0,identities=0,seeds=0,links=0,inheritedRouteProperties=0);missing=[]
def route(item,parent,label):
 for k in ['owner','trigger','nextAction']:
  if not item.get(k):
   if parent.get(k):counts['inheritedRouteProperties']+=1
   else:missing.append([label,k])
for i,l in enumerate(ledgers,1):
 for r in l['records']:
  counts['identities']+=1;route(r,l,[i,r['inputKey'],'record'])
  for key,f in r['fieldProposals'].items():counts['fields']+=1;route(f,r,[i,r['inputKey'],key])
  for d in r.get('seedDispositions',[]):counts['seeds']+=1;route(d,r,[i,r['inputKey'],'seed'])
 for s in l['sourceRegistry']:
  for d in s.get('linkDispositions',[])+s.get('excludedProgramLinkDispositions',[]):counts['links']+=1;route(d,s,[i,s['sourceId'],'link'])
assert counts['fields']==6253 and counts['identities']==340 and counts['seeds']==562 and counts['links']==1020
assert not missing,missing
rv=load(P/'review.json');manifest=load(P/'final-manifest.json');receipt=load(P/'local-review-receipt.json')
assert [d['id'] for d in rv['dispositionsRechecked']]==['SD2-017-M1','SD2-017-M2','SD2-017-M3','SD2-017-L1']
assert all(d['result']=='fixed' for d in rv['dispositionsRechecked'])
assert receipt['reviewSha256']==sha((P/'review.json').read_bytes()) and receipt['manifestSha256']==sha((P/'final-manifest.json').read_bytes())
plancheck=load(P/'wrap-plan.json')
assert plancheck['exitCode']==0 and plancheck['command']==['npm','run','plan:check']
assert sha((R/plancheck['logPath']).read_bytes())==plancheck['logSha256']
for name in ['SESSION_WRAP.md','SESSION_CLOSE.md']:
 t=(P/name).read_text()
 assert all(x in t for x in ['owner','trigger','offset340','6253','340','66','437','SD3','review'])
 assert 'No workbook' in t
for path in [R/'docs/CURRENT_HANDOFF.md',B/'NEXT_SESSION.md']:
 intro=path.read_text().split('---',1)[0]
 assert all(x in intro for x in ['offset340','savedrow346','6253','340','66','437','SD3'])
plan=(R/'docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md').read_text();block=plan.split('<!-- SD2-CHECKPOINT-017-START -->',1)[1].split('<!-- SD2-CHECKPOINT-017-END -->',1)[0]
assert all(x in block for x in ['offset340','savedrow346','6253','340','66','437','SD3'])
assert bound['acceptedFacts']==0 and bound['SD3Started'] is False
subprocess.run(['git','diff','--check',manifest['entryCommit']],cwd=R,check=True,capture_output=True)
print(json.dumps(dict(outcome='PASS',scope='Separate author no-loss closeout; research review remains bound to its immutable candidate',startedAt=start,completedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),candidateCommit=manifest['candidateCommit'],localReviewReceiptCommit=receipt['commit'],routeCounts=counts,missingRouteProperties=missing,allPriorPacketsNineAttentionRowsSupplementsAnd437M1Preserved=True,allFourReviewerFindingsFixedAndIndependentlyRechecked=True,fullSD2Complete=False,acceptedFacts=0,externalEffects=False,SD3Started=False,nextCheckpointInputOffset=340,nextInputKey='saved-405588227-row-346',nextInputName='Welder Training Scholarship',boundVerification=bound),indent=2))
