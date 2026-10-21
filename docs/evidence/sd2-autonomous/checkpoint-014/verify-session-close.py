"""Read-only closure audit; preserve all reviewed and pre-close bytes."""
from pathlib import Path
import json,hashlib,subprocess,datetime,os,re
P=Path(__file__).resolve().parent;B=P.parent;R=P.parents[3]
ENTRY='889057e8807ec55c41796d737262a35dda282e31'
PRE='fd445d4135a72d09fdc56de5090759d206868a02'
CANDIDATE='01936d4ccc1fca1fe02f4c8e8076681bb44fc65a'
RECEIPT='b7023529967e1f179ebb239f1667035d5d44fe71'
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
planpath='docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md';s=(R/planpath).read_text();old=git('show',PRE+':'+planpath).decode()
a='<!-- SD2-CHECKPOINT-014-CLOSE-START -->\n';z='<!-- SD2-CHECKPOINT-014-CLOSE-END -->\n'
assert s.count(a)==s.count(z)==1 and s[:s.index(a)]+s[s.index(z)+len(z):]==old
for path in mutable-{planpath}:
 t=(R/path).read_bytes();before=git('show',PRE+':'+path);assert t.endswith(before)
 prefix=t[:-len(before)].decode();assert all(x in prefix for x in ['offset280/savedrow285','SESSION_CLOSE.md','verify-session-close.py','High'])
m=load(P/'final-manifest.json');rv=load(P/'review.json');b=rv['binding']
assert rv['outcome']=='PASS' and not any(rv['severityCounts'].values()) and not rv['findings']
assert m['candidateCommit']==b['candidateCommit']==CANDIDATE and m['entryCommit']==ENTRY
assert sha((P/'final-manifest.json').read_bytes())==b['manifestSha256']
assert sha(git('diff','--binary',ENTRY,CANDIDATE))==m['completeDiffSha256']==b['completeDiffSha256']
assert len(m['changedFiles'])==53 and [f['path'] for f in m['changedFiles']]==git('diff','--name-only',ENTRY,CANDIDATE).decode().splitlines()
for f in m['changedFiles']:
 raw=git('show',CANDIDATE+':'+f['path']);assert len(raw)==f['bytes'] and sha(raw)==f['sha256'] and (R/f['path']).read_bytes()==raw
assert git('rev-parse',RECEIPT+'^').decode().strip()==CANDIDATE
pair={str((P/n).relative_to(R)) for n in ['final-manifest.json','review.json']}
assert set(git('diff','--name-only',CANDIDATE,RECEIPT).decode().splitlines())==pair
for path in pair:assert git('show',RECEIPT+':'+path)==(R/path).read_bytes()
assert len(rv['dispositionsRechecked'])==4 and all(x['result']=='fixed' for x in rv['dispositionsRechecked'])
assert sha((P/'review-round1.json').read_bytes())==b['originalReviewSha256'] and sha((P/'manifest-round1.json').read_bytes())==b['originalManifestSha256']
assert all(not rv[k] for k in ['acceptedFacts','canonicalAcceptance','fullSD2Complete','SD3Started'])
preaudit=load(P/'pre-close-verification.json');assert preaudit['outcome']=='PASS' and preaudit['candidateCommit']==CANDIDATE and preaudit['reviewReceiptCommit']==RECEIPT
assert preaudit['manifestSha256']==b['manifestSha256'] and preaudit['reviewSha256']==sha((P/'review.json').read_bytes())
assert preaudit['priorBindings']==13 and preaudit['protectedPaths']==1705 and preaudit['custodyPins']==71 and not preaudit['custodyGaps']
assert preaudit['allCandidateBytesPreserved'] and preaudit['oldHandoffAndSection9Preserved']
q=load(B/'queue.json');ls=[load(B/f'checkpoint-{i:03d}.json') for i in range(1,15)]
assert len(q['records'])==406 and [r['inputKey'] for l in ls for r in l['records']]==[r['inputKey'] for r in q['records'][:280]]
assert q['records'][280]['inputKey']=='saved-405588227-row-285' and q['records'][280]['recordedName']=="Heroes' Legacy Scholarship (Fisher House)"
fields=identities=seeds=links=0
for l in ls:
 assert l['acceptedFacts']==0
 for r in l['records']:
  identities+=1;assert r['identityAcceptance']=='held' and all(r.get(k) for k in ['owner','trigger','nextAction'])
  for f in r['fieldProposals'].values():fields+=1;assert f['acceptance']=='held' and all(f.get(k) or r.get(k) for k in ['owner','trigger','nextAction'])
  for d in r.get('seedDispositions',[]):seeds+=1;assert all(d.get(k) or (r.get(k) if l['checkpoint']<11 else None) for k in ['owner','trigger','nextAction'])
 for src in l['sourceRegistry']:
  for d in src.get('linkDispositions',[]):links+=1;assert all(d.get(k) or (src.get(k) if l['checkpoint']<11 else None) for k in ['owner','trigger','nextAction'])
assert (fields,identities,seeds,links)==(5341,280,433,934)
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
for term in ['Owner','Trigger','next action','126 unprocessed','5,341','433','934','437','EPERM','original rejected candidate','unverified','No reviewer repair','offset280/savedrow285','High']:
 assert term.lower() in close.lower(),term
for p in new:
 f=R/p
 if not f.exists():continue
 t=f.read_text();assert t.endswith('\n') and all(x==x.rstrip() for x in t.splitlines())
 assert not re.search(r'\b[\w.%+-]+@[\w.-]+\.[A-Za-z]{2,}|[?&](?:token|sig|signature|se|ouid)=',t),p
git('diff','--check',ENTRY,CANDIDATE);git('diff','--check',PRE);git('diff','--check',ENTRY)
print(json.dumps(dict(outcome='PASS',recordedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),scope='Author session closure only; no research-review rebinding',originalGoalCompleteWithinHeldResearchScope=True,preCloseCommit=PRE,candidateCommit=CANDIDATE,reviewReceiptCommit=RECEIPT,protectedPreClosePaths=protected,allPreCloseBytesAndModesPreservedExceptExactPrepends=True,reviewOutcome='PASS',recheckedFindings=4,priorResearchBindingsPreserved=13,preCloseAuditCommand=['python3','docs/evidence/sd2-autonomous/checkpoint-014/verify-wrap.py'],preCloseAuditSha256=sha((P/'pre-close-verification.json').read_bytes()),cumulativeInitialDispositions=280,unprocessedInputs=126,heldFields=fields,heldIdentities=identities,seedAliasOccurrences=seeds,sourceLinkOccurrences=links,allOwnersTriggersActionsPresent=True,custodyPins=71,custodyGaps=gaps,M1Pins=len(pins),M1Records=437,noPendingReviewerOrDelegatedWork=True,nextOwner='Next-session Codex source/identity reconciliation',nextTrigger='Next session under existing AUTHORITY/POLICY',nextOffset=280,nextInputKey='saved-405588227-row-285',nextName=q['records'][280]['recordedName'],authoritativeProgressPath='docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md section9',kickoffPath='docs/evidence/sd2-autonomous/NEXT_SESSION.md',recommendedEffort='High',acceptedFacts=0,canonicalAcceptance=False,fullSD2Complete=False,SD3Started=False,newSourceReads=False,newExternalEffects=False),indent=2))
