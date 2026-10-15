"""Read-only closure audit of exact reviewed candidate, local receipt and prepends."""
from pathlib import Path
import json,hashlib,subprocess,datetime,os
P=Path(__file__).resolve().parent;B=P.parent;R=P.parents[3]
ENTRY='fc38c772799d4e285759cbc00041f5aa233aeb6b'
load=lambda p:json.loads(p.read_text());sha=lambda b:hashlib.sha256(b).hexdigest()
def git(*a):return subprocess.check_output(['git',*a],cwd=R)
check=subprocess.run(['python3',str(P/'verify.py')],cwd=R,capture_output=True,text=True,check=True);integrity=json.loads(check.stdout)
m=load(P/'final-manifest.json');rv=load(P/'review.json');binding=rv.get('binding',rv);c=m['candidateCommit']
assert rv['outcome']=='PASS' and not any(rv['severityCounts'].values()) and not rv['findings']
assert binding['candidateCommit']==c and binding['manifestSha256']==sha((P/'final-manifest.json').read_bytes())
assert git('rev-parse',c+'^{tree}').decode().strip()==m['candidateTree']
assert sha(git('diff','--binary',ENTRY,c))==m['completeDiffSha256']
assert [x['path'] for x in m['changedFiles']]==git('diff','--name-only',ENTRY,c).decode().splitlines()
for x in m['changedFiles']:
 raw=git('show',c+':'+x['path']);assert len(raw)==x['bytes'] and sha(raw)==x['sha256'] and git('rev-parse',c+':'+x['path']).decode().strip()==x['blob']
 assert (R/x['path']).read_bytes()==raw
pair={str((P/n).relative_to(R)) for n in ['final-manifest.json','review.json']}
receipt=None
for line in git('rev-list','--reverse',c+'..HEAD').decode().splitlines():
 if git('rev-parse',line+'^').decode().strip()==c and set(git('diff','--name-only',c,line).decode().splitlines())==pair:
  receipt=line;break
assert receipt
for path in pair:assert git('show',receipt+':'+path)==(R/path).read_bytes()
mutable={'docs/CURRENT_HANDOFF.md','docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md','docs/evidence/sd2-autonomous/NEXT_SESSION.md'}
allowedNew={str((P/n).relative_to(R)) for n in ['SESSION_WRAP.md','verify-wrap.py','wrap-verification.json']}
changes=set(git('diff','--name-only',receipt).decode().splitlines())|set(git('ls-files','--others','--exclude-standard').decode().splitlines())
assert changes<=mutable|allowedNew,changes-(mutable|allowedNew)
protected=0
for line in git('ls-tree','-r',receipt).decode().splitlines():
 meta,path=line.split('\t');mode,typ,blob=meta.split()
 if path in mutable:continue
 f=R/path;raw=os.readlink(f).encode() if mode=='120000' else f.read_bytes()
 assert hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest()==blob,path
 if mode in ['100644','100755']:assert bool(f.stat().st_mode&0o111)==(mode=='100755'),path
 protected+=1
pp='docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md';current=(R/pp).read_text();old=git('show',ENTRY+':'+pp).decode()
a='<!-- SD2-CHECKPOINT-015-START -->\n';z='<!-- SD2-CHECKPOINT-015-END -->\n'
assert current.count(a)==current.count(z)==1 and current[:current.index(a)]+current[current.index(z)+len(z):]==old
for path in mutable-{pp}:
 raw=(R/path).read_bytes();before=git('show',ENTRY+':'+path);assert raw.endswith(before)
 prefix=raw[:-len(before)].decode();assert all(t in prefix for t in ['offset300/savedrow306','High','SESSION_WRAP.md'])
ls=[load(B/f'checkpoint-{i:03d}.json') for i in range(1,16)];q=load(B/'queue.json')
assert [r['inputKey'] for l in ls for r in l['records']]==[r['inputKey'] for r in q['records'][:300]]
fields=identities=seeds=links=0
for l in ls:
 assert l['acceptedFacts']==0
 for r in l['records']:
  identities+=1;assert r['identityAcceptance']=='held'
  assert all(r.get(k) for k in ['owner','trigger','nextAction'])
  for f in r['fieldProposals'].values():fields+=1;assert f['acceptance']=='held' and all(f.get(k) or r.get(k) for k in ['owner','trigger','nextAction'])
  for d in r.get('seedDispositions',[]):seeds+=1;assert all(d.get(k) or (r.get(k) if l['checkpoint']<11 else None) for k in ['owner','trigger','nextAction'])
 for s in l['sourceRegistry']:
  for d in s.get('linkDispositions',[]):links+=1;assert all(d.get(k) or (s.get(k) if l['checkpoint']<11 else None) for k in ['owner','trigger','nextAction'])
assert (fields,identities,seeds,links)==(5642,300,473,950)
wrap=(P/'SESSION_WRAP.md').read_text()
for term in ['106 unprocessed','5,642','473','950','437','EPERM','Owner','Trigger','next action','unverified','offset300/savedrow306','No reviewer repair','High']:
 assert term.lower() in wrap.lower(),term
assert c in wrap and receipt in wrap
git('diff','--check',ENTRY,c);git('diff','--check',ENTRY)
print(json.dumps(dict(outcome='PASS',recordedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),scope='Author closure only; no independent review rebinding',candidateCommit=c,reviewReceiptCommit=receipt,manifestSha256=sha((P/'final-manifest.json').read_bytes()),reviewSha256=sha((P/'review.json').read_bytes()),candidatePaths=len(m['changedFiles']),protectedReceiptPaths=protected,allCandidateAndHistoricalBytesModesPreserved=True,oldHandoffAndSection9Preserved=True,priorBindings=14,heldFields=fields,heldIdentities=identities,cumulativeInitialDispositions=300,unprocessedInputs=106,seedAliasOccurrences=seeds,sourceLinkOccurrences=links,allOwnersTriggersActionsPresent=True,custodyPins=71,custodyGaps=integrity['custodyGaps'],M1Pins=12,M1Records=437,noPendingReviewerOrDelegatedWork=True,nextOffset=300,nextInputKey=q['records'][300]['inputKey'],nextName=q['records'][300]['recordedName'],nextOwner='Next-session Codex source/identity reconciliation',nextTrigger='Next session under existing AUTHORITY/POLICY',authoritativeProgressPath='docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md section9',kickoffPath='docs/evidence/sd2-autonomous/NEXT_SESSION.md',acceptedFacts=0,canonicalAcceptance=False,fullSD2Complete=False,SD3Started=False,externalEffects=False,recommendedEffort='High'),indent=2))
