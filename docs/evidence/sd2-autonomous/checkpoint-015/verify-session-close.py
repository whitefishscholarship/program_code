"""Read-only session-close audit; preserve all reviewed and pre-close bytes."""
from pathlib import Path
import json,hashlib,subprocess,datetime,os,re
P=Path(__file__).resolve().parent;B=P.parent;R=P.parents[3]
ENTRY='fc38c772799d4e285759cbc00041f5aa233aeb6b'
PRE='a9551b0b8581e4350844332874022b41cf83db36'
CANDIDATE='936848d77b2cdd50bb9103ccb4d186ad40ef57c3'
RECEIPT='1ae7af24695d429ab2f8382208597755aed7c059'
load=lambda p:json.loads(p.read_text());sha=lambda b:hashlib.sha256(b).hexdigest()
def git(*a):return subprocess.check_output(['git',*a],cwd=R)
assert git('branch','--show-current').decode().strip()=='codex/plan-student-data-maintenance'
mutable={'docs/CURRENT_HANDOFF.md','docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md','docs/evidence/sd2-autonomous/NEXT_SESSION.md'}
new={str((P/n).relative_to(R)) for n in ['SESSION_CLOSE.md','pre-close-verification.json','verify-session-close.py','session-close-verification.json']}
changed=set(git('diff','--name-only',PRE).decode().splitlines())|set(git('ls-files','--others','--exclude-standard').decode().splitlines())
assert changed<=mutable|new,changed-(mutable|new)
protected=0
for line in git('ls-tree','-r',PRE).decode().splitlines():
 meta,path=line.split('\t');mode,typ,blob=meta.split()
 if path in mutable:continue
 f=R/path;raw=os.readlink(f).encode() if mode=='120000' else f.read_bytes()
 assert hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest()==blob,path
 if mode in ['100644','100755']:assert bool(f.stat().st_mode&0o111)==(mode=='100755'),path
 protected+=1
pp='docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md';current=(R/pp).read_text();old=git('show',PRE+':'+pp).decode()
a='<!-- SD2-CHECKPOINT-015-CLOSE-START -->\n';z='<!-- SD2-CHECKPOINT-015-CLOSE-END -->\n'
assert current.count(a)==current.count(z)==1 and current[:current.index(a)]+current[current.index(z)+len(z):]==old
for path in mutable-{pp}:
 raw=(R/path).read_bytes();before=git('show',PRE+':'+path);assert raw.endswith(before)
 prefix=raw[:-len(before)].decode();assert all(t in prefix for t in ['offset300/savedrow306','SESSION_CLOSE.md','verify-session-close.py','High'])
m=load(P/'final-manifest.json');rv=load(P/'review.json');binding=rv['binding']
assert rv['outcome']=='PASS' and not any(rv['severityCounts'].values()) and not rv['findings']
assert m['candidateCommit']==binding['candidateCommit']==CANDIDATE and m['entryCommit']==ENTRY
assert sha((P/'final-manifest.json').read_bytes())==binding['manifestSha256']
assert git('rev-parse',CANDIDATE+'^{tree}').decode().strip()==m['candidateTree']==binding['candidateTree']
assert sha(git('diff','--binary',ENTRY,CANDIDATE))==m['completeDiffSha256']==binding['completeDiffSha256']
assert len(m['changedFiles'])==43 and [x['path'] for x in m['changedFiles']]==git('diff','--name-only',ENTRY,CANDIDATE).decode().splitlines()
for x in m['changedFiles']:
 raw=git('show',CANDIDATE+':'+x['path']);assert len(raw)==x['bytes'] and sha(raw)==x['sha256'] and (R/x['path']).read_bytes()==raw
assert git('rev-parse',RECEIPT+'^').decode().strip()==CANDIDATE
pair={str((P/n).relative_to(R)) for n in ['final-manifest.json','review.json']}
assert set(git('diff','--name-only',CANDIDATE,RECEIPT).decode().splitlines())==pair
for path in pair:assert git('show',RECEIPT+':'+path)==(R/path).read_bytes()
assert len(rv['dispositionsRechecked'])==3 and all(x['result']=='fixed' for x in rv['dispositionsRechecked'])
assert sha((P/'review-round1.json').read_bytes())==binding['originalReviewSha256']
assert sha((P/'manifest-round1.json').read_bytes())==binding['originalManifestSha256']
assert all(not rv[k] for k in ['acceptedFacts','canonicalAcceptance','fullSD2Complete','SD3Started'])
pre=load(P/'pre-close-verification.json');assert pre['outcome']=='PASS'
assert pre['candidateCommit']==CANDIDATE and pre['reviewReceiptCommit']==RECEIPT
assert pre['manifestSha256']==binding['manifestSha256'] and pre['reviewSha256']==sha((P/'review.json').read_bytes())
assert pre['priorBindings']==14 and pre['protectedReceiptPaths']==1812 and pre['candidatePaths']==43
assert pre['allCandidateAndHistoricalBytesModesPreserved'] and pre['oldHandoffAndSection9Preserved']
assert pre['noPendingReviewerOrDelegatedWork'] and pre['allOwnersTriggersActionsPresent']
q=load(B/'queue.json');ls=[load(B/f'checkpoint-{i:03d}.json') for i in range(1,16)]
assert len(q['records'])==406 and [r['inputKey'] for l in ls for r in l['records']]==[r['inputKey'] for r in q['records'][:300]]
assert q['records'][300]['inputKey']=='saved-405588227-row-306'
assert q['records'][300]['recordedName']=="Sporty's Foundation Private Pilot Training for AEA Technicians"
fields=identities=seeds=links=0
for l in ls:
 assert l['acceptedFacts']==0
 for r in l['records']:
  identities+=1;assert r['identityAcceptance']=='held' and all(r.get(k) for k in ['owner','trigger','nextAction'])
  for f in r['fieldProposals'].values():fields+=1;assert f['acceptance']=='held' and all(f.get(k) or r.get(k) for k in ['owner','trigger','nextAction'])
  for d in r.get('seedDispositions',[]):seeds+=1;assert all(d.get(k) or (r.get(k) if l['checkpoint']<11 else None) for k in ['owner','trigger','nextAction'])
 for s in l['sourceRegistry']:
  for d in s.get('linkDispositions',[]):links+=1;assert all(d.get(k) or (s.get(k) if l['checkpoint']<11 else None) for k in ['owner','trigger','nextAction'])
assert (fields,identities,seeds,links)==(5642,300,473,950)
cust=load(P/'prior-custody-audit.json');assert len(cust['pins'])==71;gaps=[]
for pin in cust['pins']:
 p=Path(pin['path']);actual=sha(p.read_bytes()) if p.exists() else None
 if actual!=pin['recordedSha256']:gaps.append(pin['path'])
 assert all(pin.get(k) for k in ['owner','trigger','nextAction'])
assert not gaps,gaps
pins=load(R/'docs/evidence/sd2-next-read-proposal/verification.json')['retainedM1Artifacts']
for pin in pins:assert sha(git('show','009fa57:'+pin['path']))==pin['sha256']
m1=json.loads(git('show','009fa57:docs/evidence/season-monitor-m1/inventory.json'));assert len(m1['records'])==len({r['id'] for r in m1['records']})==437
close=(P/'SESSION_CLOSE.md').read_text()
for term in ['Owner','Trigger','next action','106 unprocessed','5,642','473','950','437','EPERM','original rejected candidate','unverified','No reviewer repair','offset300/savedrow306','High']:
 assert term.lower() in close.lower(),term
for path in new:
 p=R/path
 if not p.exists():continue
 t=p.read_text();assert t.endswith('\n') and all(x==x.rstrip() for x in t.splitlines())
 assert not re.search(r'\b[\w.%+-]+@[\w.-]+\.[A-Za-z]{2,}|[?&](?:token|sig|signature|se|ouid)=',t),path
git('diff','--check',ENTRY,CANDIDATE);git('diff','--check',PRE);git('diff','--check',ENTRY)
print(json.dumps(dict(outcome='PASS',recordedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),scope='Author session closure only; no research-review rebinding',originalGoalCompleteWithinHeldResearchScope=True,preCloseCommit=PRE,candidateCommit=CANDIDATE,reviewReceiptCommit=RECEIPT,protectedPreClosePaths=protected,allPreCloseBytesModesPreservedExceptExactPrepends=True,reviewOutcome='PASS',recheckedFindings=3,priorResearchBindingsPreserved=14,preCloseAuditSha256=sha((P/'pre-close-verification.json').read_bytes()),cumulativeInitialDispositions=300,unprocessedInputs=106,heldFields=fields,heldIdentities=identities,seedAliasOccurrences=seeds,sourceLinkOccurrences=links,allOwnersTriggersActionsPresent=True,custodyPins=71,custodyGaps=gaps,M1Pins=len(pins),M1Records=437,noPendingReviewerOrDelegatedWork=True,nextOwner='Next-session Codex source/identity reconciliation',nextTrigger='Next session under existing AUTHORITY/POLICY',nextOffset=300,nextInputKey='saved-405588227-row-306',nextName=q['records'][300]['recordedName'],authoritativeProgressPath='docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md section9',kickoffPath='docs/evidence/sd2-autonomous/NEXT_SESSION.md',recommendedEffort='High',acceptedFacts=0,canonicalAcceptance=False,fullSD2Complete=False,SD3Started=False,newSourceReads=False,newExternalEffects=False),indent=2))
