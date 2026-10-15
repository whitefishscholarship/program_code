"""Separate author handoff audit; never rebind an independent source review."""
from pathlib import Path
import json,subprocess,hashlib,datetime,os
P=Path(__file__).resolve().parent;R=P.parents[3];B=P.parent
sha=lambda b:hashlib.sha256(b).hexdigest()
load=lambda p:json.loads(p.read_text())
def git(*a):return subprocess.check_output(['git',*a],cwd=R)
result=json.loads(subprocess.check_output(['python3',str(P/'verify.py'),'--review-bound'],cwd=R))
assert result['outcome']=='PASS' and result['reviewBound']
m=load(P/'final-manifest.json');review=load(P/'review.json');receipt=load(P/'local-review-receipt.json')
assert receipt['manifestSha256']==sha((P/'final-manifest.json').read_bytes())
assert receipt['reviewSha256']==sha((P/'review.json').read_bytes())
for f in m['changedFiles']:
 p=R/f['path'];assert sha(p.read_bytes())==f['sha256'],f['path']
 mode=git('ls-tree',m['candidateCommit'],f['path']).decode().split()[0]
 assert bool(p.stat().st_mode&0o111)==(mode=='100755'),f['path']
for name in ['final-manifest.json','review.json']:
 path='docs/evidence/sd2-autonomous/checkpoint-016/'+name
 assert (P/name).read_bytes()==git('show',receipt['commit']+':'+path)
assert git('merge-base','--is-ancestor',receipt['commit'],'HEAD')==b''
ledgers=[load(B/f'checkpoint-{i:03d}.json') for i in range(1,17)]
assert sum(len(l['records']) for l in ledgers)==320
assert sum(len(r['fieldProposals']) for l in ledgers for r in l['records'])==5947
assert sum(len(r.get('seedDispositions',[])) for l in ledgers for r in l['records'])==524
assert sum(len(s.get('linkDispositions',[])) for l in ledgers for s in l['sourceRegistry'])==993
assert all(l['acceptedFacts']==0 for l in ledgers)
q=load(B/'queue.json');assert q['records'][320]['inputKey']=='saved-405588227-row-326'
assert q['records'][320]['recordedName']=='Donald E. Pizzini Memorial Nurse Scholarships'
for path in ['docs/CURRENT_HANDOFF.md','docs/evidence/sd2-autonomous/NEXT_SESSION.md']:
 raw=(R/path).read_bytes();old=git('show',m['entryCommit']+':'+path);assert raw.endswith(old)
 prefix=raw[:-len(old)].decode();assert all(x in prefix for x in ['offset320','savedrow326','5947','86','437','SD3'])
 assert m['candidateCommit'] in prefix and receipt['commit'] in prefix
for name in ['SESSION_WRAP.md','SESSION_CLOSE.md']:
 text=(P/name).read_text();assert all(x in text for x in ['owner','trigger','offset320','savedrow326','5947','86','524','993','437','SD3','history'])
 assert m['candidateCommit'] in text and receipt['commit'] in text
 assert not any(line!=line.rstrip() for line in text.splitlines())
git('diff','--check',m['entryCommit'])
result.update(recordedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),scope='Separate author session closeout; independent research binding unchanged',candidateCommit=m['candidateCommit'],localResearchReviewReceipt=receipt['commit'],allCandidateBlobsAndModesStillMatch=True,allOriginalAttentionRowsAndSupplementsPreserved=True,all524SeedAnd993LinkRoutesRetainOriginalActions=True,allOpenRoutes='SESSION_WRAP.md table and original16ledgers; original owner/trigger/action retained',pendingReviewerWork=False,fullSD2Complete=False,canonicalAcceptance=False,externalEffects=False)
print(json.dumps(result,indent=2))
