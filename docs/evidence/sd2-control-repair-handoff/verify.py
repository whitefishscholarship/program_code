"""Read-only handoff/preservation audit; no source requests or old verifier replay."""
from pathlib import Path
import hashlib,json,os,subprocess,sys,datetime,gzip
G=Path(__file__).resolve().parent;R=G.parents[2];ENTRY='03362252704c0032ae13befc015b7376de54056b'
M={'docs/CURRENT_HANDOFF.md','docs/evidence/sd2-autonomous/NEXT_SESSION.md','docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md'}
sha=lambda b:hashlib.sha256(b).hexdigest()
git=lambda *a:subprocess.check_output(['git',*a],cwd=R)
load=lambda p:json.loads(p.read_text())
def verify(bound=False):
    started=datetime.datetime.now(datetime.timezone.utc).isoformat();prefix=str(G.relative_to(R))+'/'
    assert git('branch','--show-current').decode().strip()=='codex/plan-student-data-maintenance'
    entry=load(G/'entry-audit.json');assert entry['entryCommit']==ENTRY and entry['exitCode']==0
    er=entry['result'];assert er['outcome']=='FAIL'and er['integrity']=='PASS'and er['forensicBound']
    assert er['confirmedReplayOrders']==[26,30,34]and er['possibleAdditionalReplayOrders']==[32]
    old=R/'docs/evidence/sd2-resolution-proof-1';om=load(old/'final-manifest.json');ov=load(old/'review.json')
    assert ov['outcome']=='FAIL'and ov['binding']['manifestSha256']==sha((old/'final-manifest.json').read_bytes())
    assert git('rev-parse',ENTRY+'^').decode().strip()==om['candidateCommit']==ov['binding']['candidateCommit']
    assert set(git('diff','--name-only',om['candidateCommit'],ENTRY).decode().splitlines())=={str((old/n).relative_to(R))for n in ['final-manifest.json','review.json']}
    od=git('diff','--binary',om['entryCommit'],om['candidateCommit']);assert sha(od)==om['completeDiffSha256']and len(od)==om['completeDiffBytes']
    for x in om['changedFiles']:
        b=git('show',om['candidateCommit']+':'+x['path']);assert sha(b)==x['sha256']and len(b)==x['bytes']
        assert git('show',ENTRY+':'+x['path'])==b
    protected=0
    for line in git('ls-tree','-rz',ENTRY).split(b'\0'):
        if not line:continue
        meta,path=line.decode().split('\t');mode,kind,oid=meta.split()
        if path in M:continue
        p=R/path;b=os.readlink(p).encode()if p.is_symlink()else p.read_bytes();wm='120000'if p.is_symlink()else('100755'if p.stat().st_mode&0o111 else'100644')
        assert wm==mode and hashlib.sha1(b'blob '+str(len(b)).encode()+b'\0'+b).hexdigest()==oid,path;protected+=1
    for path in M:
        oldb=git('show',ENTRY+':'+path);now=(R/path).read_bytes()
        if path.endswith('STUDENT_DATA_AND_MAINTENANCE_PLAN.md'):
            a=b'<!-- SD2-CONTROL-REPAIR-HANDOFF-START -->\n';z=b'<!-- SD2-CONTROL-REPAIR-HANDOFF-END -->\n';assert now.count(a)==now.count(z)==1
            assert now[:now.index(a)]+now[now.index(z)+len(z):]==oldb
        else:assert now.endswith(oldb),path
    changed=set(git('diff','--name-only',ENTRY).decode().splitlines())|set(git('ls-files','--others','--exclude-standard').decode().splitlines())
    assert all(p in M or p.startswith(prefix)for p in changed)
    s=load(G/'scope.json');assert s['entryCommit']==ENTRY and s['sessionStatus']=='FAIL'and s['sourceRequestsDuringNextLocalBatch']==0
    assert s['knownFacts']==dict(targets=397,observedCompletedToolRecords=64,failedToolRecordsWithin64=9,conservativeExplicitCallReservation=68,uncertainAdditionalCalls=4,confirmedReplayOrders=[26,30,34],possibleReplayOrders=[32],acquisitionCandidatesQuarantined=272,otherOriginalTriageHolds=125,theoreticalUnusedExpandedTargets=72)
    assert not s['canonicalAcceptance']and s['acceptedFacts']==s['acceptedMappings']==0 and not s['SD3Started']
    items=load(G/'open-items.json');assert len(items['sessionItems'])==9 and len({x['id']for x in items['sessionItems']})==9
    assert all(x['owner']and x['trigger']and x['authoritativePath']and x['nextAction']for x in items['sessionItems'])
    gp=R/'docs/evidence/sd2-consolidation-package/acceptance-gates.json';gs=load(gp)['gates'];assert len(gs)==items['originalGateCount']==len(items['originalGates'])==14
    for i,(x,y)in enumerate(zip(gs,items['originalGates'])):
        assert y['id']==x['id']and y['reference']==dict(path=str(gp.relative_to(R)),sha256=sha(gp.read_bytes()),pointer='/gates/'+str(i))
        for a,b in [('originalOwner','owner'),('originalTrigger','trigger'),('originalNextAction','nextAction'),('originalAuthoritativePaths','authoritativePaths')]:assert y[a]==x[b]
    recovery=load(G/'historical-recovery-observation.json');assert recovery['unchangedHead']=='0336d32b930a87d458414611184ab546b00df047'and recovery['outcome']=='PASS'
    source=load(old/'summary.json');assert source['outcome']=='FAIL'and source['targets']==397 and source['conservativeExplicitCallReservation']==68 and source['acceptedFacts']==source['acceptedMappings']==0
    assert len(load(old/'outcomes.json')['records'])==397 and sum(x['quarantinedAgainstFurtherAcquisition']for x in load(old/'outcomes.json')['records'])==272
    checks=load(G/'validation.json');assert [x['command']for x in checks['checks']]==[['npm','run','plan:check'],['npm','run','typecheck'],['npm','test'],['npm','run','build']]
    assert [x['exitCode']for x in checks['checks']]==[0,0,0,1]and checks['requiredBuildGateRemainsOpen']
    for x in checks['checks']:
        stored=(R/x['logPath']).read_bytes();assert x['logEncoding']=='gzip'and sha(stored)==x['storedSha256']and len(stored)==x['storedBytes']
        b=gzip.decompress(stored);assert sha(b)==x['logSha256']and len(b)==x['logBytes']
    build=gzip.decompress((R/checks['checks'][-1]['logPath']).read_bytes()).decode();assert 'binding to a port'in build and 'operation not permitted'in build.lower()
    for x in load(R/'docs/evidence/sd2-consolidation-package/PROPOSED_VALIDATION_REPAIR.json')['pins']:assert sha((R/x['path']).read_bytes())==x['sha256']
    manifest=None
    if(G/'manifest.json').exists():
        manifest=load(G/'manifest.json');c=manifest['candidateCommit'];assert manifest['entryCommit']==ENTRY
        assert git('rev-parse',c+'^{tree}').decode().strip()==manifest['candidateTree']
        diff=git('diff','--binary',ENTRY,c);assert sha(diff)==manifest['completeDiffSha256']and len(diff)==manifest['completeDiffBytes']
        assert set(git('diff','--name-only',ENTRY,c).decode().splitlines())=={x['path']for x in manifest['changedFiles']}
        for x in manifest['changedFiles']:
            b=git('show',c+':'+x['path']);assert sha(b)==x['sha256']and len(b)==x['bytes']and(R/x['path']).read_bytes()==b
            assert git('ls-tree',c,x['path']).decode().split()[0]==x['mode']
    if bound:
        assert manifest;review=load(G/'review.json');assert review['outcome']=='PASS'and not any(review['unresolvedSeverityCounts'].values())
        assert review['binding']['candidateCommit']==manifest['candidateCommit']and review['binding']['manifestSha256']==sha((G/'manifest.json').read_bytes())
        assert review['sourceExecutionStatus']=='FAIL'and not review['canonicalAcceptance']
        assert git('rev-parse','HEAD^').decode().strip()==manifest['candidateCommit']
        assert set(git('diff','--name-only',manifest['candidateCommit'],'HEAD').decode().splitlines())=={prefix+'manifest.json',prefix+'review.json'}
        assert not git('status','--porcelain').strip()
    git('diff','--check',ENTRY)
    print(json.dumps(dict(sessionStatus='FAIL',handoffIntegrity='PASS',reviewBound=bound,scope='Fresh-session preparation only; no source execution or canonical acceptance',entryCommit=ENTRY,protectedPreEntryFiles=protected,priorAppendHistories=3,originalGateBindings=14,sessionItems=9,sourceRequestsDuringWrap=0,controlRepairImplemented=False,acceptedFacts=0,acceptedMappings=0,SD3Started=False,requiredChecks='plan/typecheck/tests passed; exact build EPERM remains a gate',startedAt=started,completedAt=datetime.datetime.now(datetime.timezone.utc).isoformat()),indent=2))
if __name__=='__main__':verify('--review-bound'in sys.argv)
