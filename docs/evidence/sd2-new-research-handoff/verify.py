"""Read-only local proposal verification; never grants acquisition or canonical acceptance."""
from pathlib import Path
import argparse, hashlib, json, subprocess
p=Path(__file__).resolve().parent
r=p.parents[2]
def git(*args):return subprocess.check_output(['git',*args],cwd=r)
def sha(b):return hashlib.sha256(b).hexdigest()
def require(ok,why):
    if not ok:raise SystemExit('FAIL: '+why)
def load(path):return json.loads(path.read_text())
def check_ref(ref):require(sha((r/ref['path']).read_bytes())==ref['sha256'],ref['path'])
a=argparse.ArgumentParser();a.add_argument('--review-bound',action='store_true');args=a.parse_args()
pres=load(p/'preservation.json');base=pres['baselineCommit']
for ref in pres['protectedReferences']:check_ref(ref)
# Compare all tracked baseline blobs/modes with both current working bytes and index.
for row in git('ls-tree','-rz','--full-tree',base).split(b'\0'):
    if not row:continue
    meta,name=row.split(b'\t',1);mode,kind,oid=meta.decode().split();path=r/name.decode()
    require(kind=='blob','unexpected baseline git object')
    require(path.exists(),'missing baseline file '+str(path))
    b=path.read_bytes()
    require(hashlib.sha1(b'blob '+str(len(b)).encode()+b'\0'+b).hexdigest()==oid,'changed baseline '+str(path))
    require(('100755' if path.stat().st_mode&0o111 else '100644')==mode,'changed mode '+str(path))
s=load(p/'scope.json');source=r/s['sourceReference']['path'];check_ref(s['sourceReference']);check_ref(s['targetReference'])
original=load(source)['targets'];require(len(s['targets'])==s['targetCount']==100,'100 targets')
require([t['targetId'] for t in s['targets']]==[t['targetId'] for t in original],'ordered scope drift')
for target,old in zip(s['targets'],original):
    require(all(target[k]==v for k,v in old.items()),'original target binding drift')
    require(sha(target['exactLocator'].encode())==target['exactLocatorSha256'],'locator hash')
    require(target['historicalHoldRetained'] is True and target['maxExplicitToolInvocations']==1,'target hold/budget')
require(len({i for t in s['targets'] for i in t['affectedSavedInputs']})==s['affectedSavedInputCount']==185,'saved inputs')
require(sum(len(t['materialProofGaps']) for t in s['targets'])==s['fieldGapOccurrences']==853,'field occurrences')
require(len({i for t in s['targets'] for i in t['materialProofGaps']})==s['uniqueFieldGapCount'],'unique fields')
for k,v in {'maxExplicitToolInvocations':100,'maxPerTarget':1,'maxConcurrent':1,'maxPerHost':1,'retries':0,'nativeReads':False,'workbookAccess':False,'search':False,'childTraversal':False}.items():require(s[k]==v,'budget/effect '+k)
old=p/'previous-closeout';idx=load(old/'evidence-index.json')
for f in idx['files']:require(sha((old/f['savedPath']).read_bytes())==f['sha256'],'saved delivery receipt')
o=load(old/'open-items.json');check_ref(o['inheritedReference']);require(load(r/o['inheritedReference']['path'])==o['inherited'],'inherited routes')
# Copied old closeout comes from immutable local checkpoint; do not invoke its obsolete exact-state verifier on Revision23.
for path in old.rglob('*'):
    if path.is_file():require(path.read_bytes()==git('show',pres['historicalCloseoutCommit']+':docs/evidence/sd2-delivered-session-closeout/'+str(path.relative_to(old))),'historical closeout copy drift')
search=load(p/'local-metadata-search.json');require(search['cleared']==0 and search['acceptedFacts']==0 and search['SD3Started'] is False,'search scope')
require(search['priorDecisionSha256']==sha((r/'docs/evidence/sd2-dispatch-evidence-sufficiency-1/decision.json').read_bytes()),'saved sufficiency decision')
state=load(r/'docs/BUILD_STATE.json');require(state['planRevision']==23,'baseline revision')
require(state['sd2ResearchClosure']['targetsHeld']==397 and state['sd2ResearchClosure']['quarantinesHeld']==272 and state['sd2ResearchClosure']['clearedForAcquisition']==0,'holds')
require(state['sd2ResearchClosure']['originalSourceExecution']=='FAIL' and state['activeStageId'] is None and state['nextPermittedStageId'] is None,'failure/stage state')
require(not (p/'journal').exists(),'no live execution store in setup')
if args.review_bound:
    m=load(p/'manifest.json');v=load(p/'review.json');candidate=m['candidateCommit']
    require(m['baselineCommit']==base and m['candidateTree']==git('rev-parse',candidate+'^{tree}').decode().strip(),'candidate identity')
    changed=git('diff','--name-only',base,candidate).decode().splitlines()
    require(changed==[f['path'] for f in m['files']],'complete candidate manifest')
    require(sha(git('diff','--binary','--full-index',base,candidate))==m['completeDiffSha256'],'complete diff')
    for f in m['files']:
        b=git('show',candidate+':'+f['path']);require(sha(b)==f['sha256'] and len(b)==f['bytes'],'candidate blob')
        require((r/f['path']).read_bytes()==b,'worktree candidate drift')
    require(v['outcome']=='PASS' and v['reviewerWasAuthorOrEditor'] is False,'independent outcome')
    require(v['candidateCommit']==candidate and v['candidateManifestSha256']==sha((p/'manifest.json').read_bytes()),'review binding')
    require(all(v['findings'][x]==0 for x in ['critical','high','medium','low']),'review findings')
    require(git('rev-parse','HEAD^').decode().strip()==candidate,'direct child receipt')
    require(set(git('diff','--name-only','HEAD^','HEAD').decode().splitlines())=={str((p/'manifest.json').relative_to(r)),str((p/'review.json').relative_to(r))},'exact two-file local receipt')
    require(not git('status','--porcelain').strip(),'clean receipt checkout')
subprocess.run(['git','diff','--check',base],cwd=r,check=True)
print('PASS: prospective local handoff and exact scope verified; no canonical activation, source clearance, fact acceptance or SD3.')
