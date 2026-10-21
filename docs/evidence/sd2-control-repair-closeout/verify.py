"""Verify local closeout plus immutable prior receipt; no old context replay."""
from pathlib import Path
import gzip, hashlib, json, os, subprocess, sys
G=Path(__file__).resolve().parent
R=G.parents[2]
ENTRY='ce7d094e04fc07f04d2fb267eb74affcced4a8a8'
H={'docs/CURRENT_HANDOFF.md','docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md','docs/evidence/sd2-autonomous/NEXT_SESSION.md'}
sha=lambda b:hashlib.sha256(b).hexdigest()
git=lambda *a:subprocess.check_output(['git',*a],cwd=R)
load=lambda p:json.loads(p.read_bytes())
def verify(bound=False):
    assert git('branch','--show-current').decode().strip()=='codex/plan-student-data-maintenance'
    e=load(G/'entry-audit.json');assert e['entryCommit']==ENTRY and e['cleanStatus']==''and e['exitCode']==0
    assert e['result']['reviewBound']and e['result']['localRepairIntegrity']=='PASS'
    old=R/'docs/evidence/sd2-control-repair-1';om=load(old/'manifest.json');ov=load(old/'review.json')
    assert ov['outcome']=='PASS'and not any(ov['unresolvedSeverityCounts'].values())
    assert ov['sourceExecutionStatus']=='FAIL'and not ov['canonicalAcceptance']
    assert ov['binding']['manifestSha256']==sha((old/'manifest.json').read_bytes())
    c=om['candidateCommit'];assert git('rev-parse',ENTRY+'^').decode().strip()==c==ov['binding']['candidateCommit']
    assert set(git('diff','--name-only',c,ENTRY).decode().splitlines())=={str((old/p).relative_to(R))for p in ['manifest.json','review.json']}
    d=git('diff','--binary',om['entryCommit'],c);assert sha(d)==om['completeDiffSha256']and len(d)==om['completeDiffBytes']
    for x in om['changedFiles']:
        raw=git('show',c+':'+x['path']);assert sha(raw)==x['sha256']and len(raw)==x['bytes']
        assert git('show',ENTRY+':'+x['path'])==raw
    protected=0
    for line in git('ls-tree','-rz',ENTRY).split(b'\0'):
        if not line:continue
        meta,path=line.decode().split('\t');mode,kind,oid=meta.split()
        if path in H:continue
        p=R/path;b=os.readlink(p).encode()if p.is_symlink()else p.read_bytes()
        actual_mode='120000'if p.is_symlink()else('100755'if p.stat().st_mode&0o111 else'100644')
        assert actual_mode==mode and hashlib.sha1(b'blob '+str(len(b)).encode()+b'\0'+b).hexdigest()==oid,path
        protected+=1
    for path in H:
        oldb=git('show',ENTRY+':'+path);now=(R/path).read_bytes()
        if path.endswith('STUDENT_DATA_AND_MAINTENANCE_PLAN.md'):
            a=b'<!-- SD2-CONTROL-REPAIR-CLOSEOUT-START -->\n';z=b'<!-- SD2-CONTROL-REPAIR-CLOSEOUT-END -->\n'
            assert now.count(a)==now.count(z)==1
            assert now[:now.index(a)]+now[now.index(z)+len(z):]==oldb
        else:assert now.endswith(oldb),path
    prefix=str(G.relative_to(R))+'/'
    changed=set(git('diff','--name-only',ENTRY).decode().splitlines())|set(git('ls-files','--others','--exclude-standard').decode().splitlines())
    assert all(p in H or p.startswith(prefix)for p in changed)
    items=load(G/'open-items.json');assert items['sessionStatus']=='PASS'and items['originalSourceExecutionStatus']=='FAIL'
    assert items['entryCommit']==ENTRY and not items['canonicalAcceptance']and not items['fullSD2Complete']and not items['SD3Started']
    assert items['sourceRequestsDuringWrap']==items['acceptedFacts']==items['acceptedMappings']==items['clearedForAcquisition']==0
    assert items['targetsHeld']==397 and items['quarantinesHeld']==272 and items['exactNeverDispatchedProof']=='NOT_ESTABLISHED'
    assert items['priorReviewTasksComplete']and len(items['priorReviewTasks'])==2
    for ref in items['originalReferences']:assert sha((R/ref['path']).read_bytes())==ref['sha256']
    inherited=load(old/'inherited-open-items.json');repair=load(old/'open-items.json')
    assert [x['original']for x in items['items']]==inherited['sessionItems']+repair['repairItems']
    assert items['originalGates']==inherited['originalGates']and len(items['originalGates'])==items['originalGateCount']==14
    assert len(items['items'])==13 and items['originalSessionItemCount']==9 and items['repairItemCount']==4
    assert all(x['original']['owner']and x['original']['trigger']and x['original']['authoritativePath']and x['continuedAction']for x in items['items'])
    assert all(x['owner']and x['trigger']and x['authoritativePath']and x['nextAction']for x in items['additionalSessionDispositions'])
    gates=R/'docs/evidence/sd2-consolidation-package/acceptance-gates.json'
    for i,(x,y)in enumerate(zip(items['originalGates'],load(gates)['gates'])):
        assert x['reference']==dict(path=str(gates.relative_to(R)),sha256=sha(gates.read_bytes()),pointer=f'/gates/{i}')
        for a,b in [('originalOwner','owner'),('originalTrigger','trigger'),('originalNextAction','nextAction'),('originalAuthoritativePaths','authoritativePaths')]:assert x[a]==y[b]
    closed=[x for x in items['items']if x['original']['id']=='prospective-durable-controls'][0]
    assert closed['currentDisposition']=='CLOSED_MATCHING_INDEPENDENT_PASS'
    assert any(x['id']=='H1'and x['status']=='REMEDIATED_IN_FINAL_CANDIDATE'and x['independentRecheck']for x in ov['findings'])
    v=load(G/'validation.json');assert [x['exitCode']for x in v['checks']]==[0,0,0,1,0,0]
    assert [x['command']for x in v['checks'][:4]]==[['npm','run','plan:check'],['npm','run','typecheck'],['npm','test'],['npm','run','build']]
    assert v['dependencyInstallAttempts']==v['sourceRequests']==0 and v['requiredBuildGateRemainsOpen']and not v['freshAuthenticatedMainTargetVerified']
    for x in v['checks']:
        b=(R/x['logPath']).read_bytes();assert sha(b)==x['storedSha256']and len(b)==x['storedBytes']
        raw=gzip.decompress(b);assert sha(raw)==x['rawSha256']and len(raw)==x['rawBytes']
    build=gzip.decompress((G/'checks/build.log.gz').read_bytes()).decode();assert'Operation not permitted'in build and'binding to a port'in build
    m=None
    if(G/'manifest.json').exists():
        m=load(G/'manifest.json');c=m['candidateCommit'];assert m['entryCommit']==ENTRY
        assert git('rev-parse',c+'^{tree}').decode().strip()==m['candidateTree']
        d=git('diff','--binary',ENTRY,c);assert sha(d)==m['completeDiffSha256']and len(d)==m['completeDiffBytes']
        assert set(git('diff','--name-only',ENTRY,c).decode().splitlines())=={x['path']for x in m['changedFiles']}
        for x in m['changedFiles']:
            b=git('show',c+':'+x['path']);assert sha(b)==x['sha256']and len(b)==x['bytes']and(R/x['path']).read_bytes()==b
            assert git('ls-tree',c,x['path']).decode().split()[0]==x['mode']
    if bound:
        assert m;review=load(G/'review.json');assert review['outcome']=='PASS'and not any(review['unresolvedSeverityCounts'].values())
        assert review['binding']['candidateCommit']==m['candidateCommit']and review['binding']['manifestSha256']==sha((G/'manifest.json').read_bytes())
        assert review['sourceExecutionStatus']=='FAIL'and not review['canonicalAcceptance']
        assert git('rev-parse','HEAD^').decode().strip()==m['candidateCommit']
        assert set(git('diff','--name-only',m['candidateCommit'],'HEAD').decode().splitlines())=={prefix+'manifest.json',prefix+'review.json'}
        assert not git('status','--porcelain').strip()
    git('diff','--check',ENTRY)
    return dict(sessionStatus='PASS',scope='Completed local SD2 repair and session continuity only',reviewBound=bound,protectedPreEntryFiles=protected,appendHistories=3,carriedItems=13,originalGates=14,additionalDispositions=4,priorReviewTasksComplete=True,originalSourceExecution='FAIL',targetsHeld=397,quarantinesHeld=272,exactUnusedProof='NOT_ESTABLISHED',clearedForAcquisition=0,sourceRequestsDuringWrap=0,acceptedFacts=0,acceptedMappings=0,canonicalAcceptance=False,fullSD2Complete=False,exactBuildGate='BLOCKED_EPERM',freshMainTarget='UNVERIFIED',SD3Started=False)
if __name__=='__main__':print(json.dumps(verify('--review-bound'in sys.argv),indent=2))
