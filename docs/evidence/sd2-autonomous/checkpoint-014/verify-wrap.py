"""Verify a separate handoff without rebinding the independent research review."""
from pathlib import Path
import json,hashlib,subprocess,datetime
P=Path(__file__).resolve().parent;B=P.parent;R=P.parents[3]
ENTRY='889057e8807ec55c41796d737262a35dda282e31'
CANDIDATE='01936d4ccc1fca1fe02f4c8e8076681bb44fc65a'
RECEIPT='b7023529967e1f179ebb239f1667035d5d44fe71'
load=lambda p:json.loads(p.read_text());sha=lambda b:hashlib.sha256(b).hexdigest()
def git(*a):return subprocess.check_output(['git',*a],cwd=R)
audit=json.loads(subprocess.check_output(['python3',str(P/'verify.py')],cwd=R))
assert audit['outcome']=='PASS'
m=load(P/'final-manifest.json');rv=load(P/'review.json');binding=rv['binding']
assert rv['outcome']=='PASS' and not any(rv['severityCounts'].values()) and not rv['findings']
assert rv['reviewer']['freshContext'] and rv['reviewer']['readOnly'] and not rv['reviewer']['authoredOrEdited']
assert binding['entryCommit']==m['entryCommit']==ENTRY and binding['candidateCommit']==m['candidateCommit']==CANDIDATE
assert binding['candidateTree']==m['candidateTree']==git('rev-parse',CANDIDATE+'^{tree}').decode().strip()
assert binding['manifestSha256']==sha((P/'final-manifest.json').read_bytes())
assert binding['completeDiffSha256']==m['completeDiffSha256']==sha(git('diff','--binary',ENTRY,CANDIDATE))
paths=git('diff','--name-only',ENTRY,CANDIDATE).decode().splitlines();assert paths==[f['path'] for f in m['changedFiles']] and len(paths)==53
for f in m['changedFiles']:
 raw=git('show',CANDIDATE+':'+f['path']);assert sha(raw)==f['sha256'] and len(raw)==f['bytes']
 assert git('rev-parse',CANDIDATE+':'+f['path']).decode().strip()==f['blob']
 assert (R/f['path']).read_bytes()==raw,f['path']
assert git('rev-parse',RECEIPT+'^').decode().strip()==CANDIDATE
pair={str((P/'final-manifest.json').relative_to(R)),str((P/'review.json').relative_to(R))}
assert set(git('diff','--name-only',CANDIDATE,RECEIPT).decode().splitlines())==pair
for p in pair:assert git('show',RECEIPT+':'+p)==(R/p).read_bytes()
rem=load(P/'remediation.json');assert [x['id'] for x in rem['dispositions']]==[x['id'] for x in rv['dispositionsRechecked']]
assert len(rv['dispositionsRechecked'])==4 and all(x['result']=='fixed' for x in rv['dispositionsRechecked'])
assert binding['originalFailedBindingPreserved'] and binding['originalReviewSha256']==sha((P/'review-round1.json').read_bytes())
assert binding['originalManifestSha256']==sha((P/'manifest-round1.json').read_bytes())
assert not any(rv[k] for k in ['canonicalAcceptance','acceptedFacts','fullSD2Complete','SD3Started'])
allowed={'docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md','docs/CURRENT_HANDOFF.md','docs/evidence/sd2-autonomous/NEXT_SESSION.md'}|{str((P/f).relative_to(R)) for f in ['SESSION_WRAP.md','verify-wrap.py','wrap-verification.json']}
post=set(git('diff','--name-only',RECEIPT).decode().splitlines())|set(git('ls-files','--others','--exclude-standard').decode().splitlines())
assert post<=allowed,post-allowed
ls=[load(B/f'checkpoint-{i:03d}.json') for i in range(1,15)]
assert sum(len(x['records']) for x in ls)==280 and sum(len(r['fieldProposals']) for x in ls for r in x['records'])==5341
seedcount=sum(len(r.get('seedDispositions',[])) for x in ls for r in x['records'])
linkcount=sum(len(s.get('linkDispositions',[])) for x in ls for s in x['sourceRegistry'])
assert seedcount==433 and linkcount==934
for x in ls:
 for r in x['records']:
  assert r['identityAcceptance']=='held' and all(r.get(k) for k in ['owner','trigger','nextAction'])
  for f in r['fieldProposals'].values():assert f['acceptance']=='held' and all(f.get(k) or r.get(k) for k in ['owner','trigger','nextAction'])
  for d in r.get('seedDispositions',[]):assert all(d.get(k) or (r.get(k) if x['checkpoint']<11 else None) for k in ['owner','trigger','nextAction'])
 for s in x['sourceRegistry']:
  for d in s.get('linkDispositions',[]):assert all(d.get(k) or (s.get(k) if x['checkpoint']<11 else None) for k in ['owner','trigger','nextAction'])
for p in ['docs/CURRENT_HANDOFF.md','docs/evidence/sd2-autonomous/NEXT_SESSION.md']:
 t=(R/p).read_text();old=git('show',ENTRY+':'+p).decode();assert t.endswith(old)
 prefix=t[:-len(old)];assert all(k in prefix for k in ['offset280','savedrow285',CANDIDATE,RECEIPT,'5,341','280','126','stop before SD3'])
plan=(R/'docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md').read_text();start='<!-- SD2-CHECKPOINT-014-START -->\n';end='<!-- SD2-CHECKPOINT-014-END -->\n'
assert plan.count(start)==plan.count(end)==1;block=plan[plan.index(start):plan.index(end)]
assert all(k in block for k in [CANDIDATE,RECEIPT,'offset280/savedrow285','5,341','126'])
wrap=(P/'SESSION_WRAP.md').read_text()
for term in ['all14 ledgers','433','934','71','437','12 pinned','source','owner','Trigger','Next','EPERM','no source reread','original rejected candidate','Stop before SD3']:
 assert term.lower() in wrap.lower(),term
git('diff','--check',ENTRY,CANDIDATE);git('diff','--check',ENTRY)
print(json.dumps(dict(outcome='PASS',recordedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),scope='Separate author handoff audit only; independent source review not rebound',entryCommit=ENTRY,candidateCommit=CANDIDATE,reviewReceiptCommit=RECEIPT,manifestSha256=sha((P/'final-manifest.json').read_bytes()),reviewSha256=sha((P/'review.json').read_bytes()),reviewOutcome=rv['outcome'],candidatePathsVerified=53,allCandidateBytesPreserved=True,oldHandoffAndSection9Preserved=True,dispositionsIndependentlyRechecked=4,cumulativeInitialDispositions=280,unprocessedInputs=126,cumulativeHeldFields=5341,heldIdentities=280,seedAliasDispositionOccurrences=seedcount,sourceLinkDispositionOccurrences=linkcount,priorBindings=13,protectedPaths=audit['protectedTrackedFiles'],custodyPins=71,custodyGaps=audit['custodyGaps'],M1Records=437,M1Pins=12,nextOffset=280,nextInputKey='saved-405588227-row-285',acceptedFacts=0,canonicalAcceptance=False,fullSD2Complete=False,SD3Started=False,remoteEffects=False),indent=2))
