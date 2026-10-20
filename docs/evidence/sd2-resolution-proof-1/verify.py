"""Read-only selected-run audit. Never call a source, install or replay old contexts."""
from pathlib import Path
import collections,datetime,hashlib,json,os,subprocess,sys
G=Path(__file__).resolve().parent;R=G.parents[2];ENTRY='0336d32b930a87d458414611184ab546b00df047'
M={'docs/CURRENT_HANDOFF.md','docs/evidence/sd2-autonomous/NEXT_SESSION.md','docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md'}
sha=lambda b:hashlib.sha256(b).hexdigest()
git=lambda *a:subprocess.check_output(['git',*a],cwd=R)
load=lambda p:json.loads(p.read_text())
def forbidden(x):
    if isinstance(x,dict):
        assert not any(k in x for k in ['exactQuote','providerErrorReason','rawHtml','markdown','b64_string']), 'Uninspected source prose in result'
        for v in x.values():forbidden(v)
    elif isinstance(x,list):
        for v in x:forbidden(v)
def verify(bound=False):
    start=datetime.datetime.now(datetime.timezone.utc).isoformat();a=load(G/'selection.json');e=load(G/'entry-audit.json');prefix=str(G.relative_to(R))+'/'
    assert git('branch','--show-current').decode().strip()=='codex/plan-student-data-maintenance'
    assert a['entryCommit']==ENTRY and a['authorized'] and set(a['selectedScopes'])=={'SD2-LOCKED-VALIDATION-1','SD2-RESOLUTION-PROOF-1'}
    assert e['entryCommit']==ENTRY and e['exitCode']==0 and e['result']['outcome']=='PASS' and e['result']['reviewBound']
    pm=R/'docs/evidence/sd2-consolidation-package';oldm=load(pm/'final-manifest.json');oldr=load(pm/'review.json')
    assert oldr['binding']['manifestSha256']==sha((pm/'final-manifest.json').read_bytes()) and oldr['outcome']=='PASS'
    assert git('rev-parse',ENTRY+'^').decode().strip()==oldm['candidateCommit']
    assert set(git('diff','--name-only',oldm['candidateCommit'],ENTRY).decode().splitlines())=={str((pm/n).relative_to(R))for n in ['final-manifest.json','review.json']}
    protected=0
    for item in git('ls-tree','-rz',ENTRY).split(b'\0'):
        if not item:continue
        meta,path=item.decode().split('\t');mode,kind,oid=meta.split();p=R/path
        if path in M:continue
        b=os.readlink(p).encode()if p.is_symlink()else p.read_bytes();wm='120000'if p.is_symlink()else('100755'if p.stat().st_mode&0o111 else'100644')
        assert mode==wm and hashlib.sha1(b'blob '+str(len(b)).encode()+b'\0'+b).hexdigest()==oid,path;protected+=1
    for path in M:
        old=git('show',ENTRY+':'+path);now=(R/path).read_bytes()
        if path.endswith('STUDENT_DATA_AND_MAINTENANCE_PLAN.md'):
            s=b'<!-- SD2-RESOLUTION-PROOF-1-START -->\n';z=b'<!-- SD2-RESOLUTION-PROOF-1-END -->\n';assert now.count(s)==now.count(z)==1
            assert now[:now.index(s)]+now[now.index(z)+len(z):]==old
        else:assert now.endswith(old),path
    changed=set(git('diff','--name-only',ENTRY).decode().splitlines())|set(git('ls-files','--others','--exclude-standard').decode().splitlines())
    assert all(p in M or p.startswith(prefix)for p in changed)
    ns={'__file__':str(G/'prepare-targets.py'),'__name__':'readonly_selected_triage'};exec(compile((G/'prepare-targets.py').read_text(),str(G/'prepare-targets.py'),'exec'),ns)
    triage=load(G/'triage.json');assert triage['targets']==ns['derive']() and len(triage['targets'])==397
    ns2={'__file__':str(G/'preflight.py'),'__name__':'readonly_saved_preflight'};exec(compile((G/'preflight.py').read_text(),str(G/'preflight.py'),'exec'),ns2)
    assert load(G/'preflight.json')['records']==ns2['derive']()
    ledger=load(G/'outcomes.json')['records'];assert len(ledger)==len({x['targetId']for x in ledger})==397
    assert [x['targetId']for x in ledger]==[x['targetId']for x in triage['targets']]
    acquisitions=[]
    for p in sorted(G.glob('source-results-*.json')):
        x=load(p);forbidden(x);acquisitions.extend(x['records'])
    assert len({x['targetId']for x in acquisitions})==len(acquisitions)
    targetby={x['targetId']:x for x in triage['targets']}
    for x in acquisitions:
        t=targetby[x['targetId']];assert x['order']==t['order'] and x['exactLocatorSha256']==t['exactLocatorSha256']
        assert x['affectedSavedInputs']==t['affectedSavedInputs'] and t['mode']in['public','native']
    ids={x['targetId']for x in triage['targets']};assert {x['targetId']for x in acquisitions}<=ids
    assert all(x['allOriginalHoldsRetained'] and x['factsAccepted']==x['mappingsAccepted']==0 for x in acquisitions)
    assert all(x['allOriginalHoldsRetained'] and not x['acceptedFact'] and not x['acceptedMapping']for x in ledger)
    known=sum(x.get('explicitRemoteCalls')or 0 for x in acquisitions);upper=known+sum(x.get('explicitRemoteCallsUpperBound',0)for x in acquisitions if x.get('explicitRemoteCalls')is None)
    assert upper<=1516 and sum(x.get('attempts',0)for x in acquisitions)<=758
    assert all((x.get('explicitRemoteCalls')or x.get('explicitRemoteCallsUpperBound',0))<=2 for x in acquisitions)
    v=load(G/'validation/summary.json');repair=load(pm/'PROPOSED_VALIDATION_REPAIR.json');assert v['dependencyInstallAttempts']==1 and not v['lifecycleScriptsExecuted']
    assert [x['command']for x in v['checks']]==repair['requiredCommands'];assert [x['exitCode']for x in v['checks']]==[0,0,0,1] and not v['allRequiredChecksPassed']
    for p in (G/'validation').glob('*.json'):
        x=load(p)
        if 'rawLogPath'in x:
            b=(R/x['rawLogPath']).read_bytes();assert sha(b)==x['rawLogSha256'] and len(b)==x['rawLogBytes']
    assert load(G/'validation/restore.json')['exitCode']==0
    for pin in repair['pins']:assert sha((R/pin['path']).read_bytes())==pin['sha256']
    assert load(G/'interim-review-fail.json')['outcome']=='FAIL'
    safe=load(G/'safety-recheck.json');assert safe['outcome']=='PASS' and not any(safe['severityCounts'].values())
    for n,h in safe['codeSha256'].items():assert sha((G/n).read_bytes())==h,n
    fixes=load(G/'author-remediation.json')['dispositions'];assert len(fixes)==3 and {x['findingId']for x in fixes}=={'H1','H2','M1'}
    assert all(x['owner']and x['rationale']and x['target']for x in fixes)
    approved={}
    for pp in G.glob('retrieval-preflight-*.json'):
        for x in load(pp)['records']:
            if x['outcome']=='PASS_FOR_PUBLIC_PAGE_RETRIEVAL_ONLY' and x.get('retrievalEligibleAfterThisReview',True) and not x.get('noReplayHold',False):approved[x['targetId']]=x
    for x in acquisitions:
        if x.get('afterSafetyRecheck'):
            ref=x['preflightReference'];assert x['targetId']in approved and ref['sha256']==sha((R/ref['path']).read_bytes()) and not x.get('replayed')
            assert any(y['targetId']==x['targetId'] and y['outcome']=='PASS_FOR_PUBLIC_PAGE_RETRIEVAL_ONLY' for y in load(R/ref['path'])['records'])
    summary=load(G/'summary.json');assert summary['targets']==397 and summary['sourceTargetDispositions']==len(acquisitions) and summary['knownExplicitRemoteCalls']==known and summary['maximumExplicitRemoteCallsIncludingInterrupted']==upper
    assert summary['acceptedFacts']==summary['acceptedMappings']==0 and not summary['fullSD2Complete'] and not summary['SD3Started']
    m=None
    if(G/'final-manifest.json').exists():
        m=load(G/'final-manifest.json');assert m['entryCommit']==ENTRY and git('rev-parse',m['candidateCommit']+'^{tree}').decode().strip()==m['candidateTree']
        diff=git('diff','--binary',ENTRY,m['candidateCommit']);assert sha(diff)==m['completeDiffSha256']and len(diff)==m['completeDiffBytes']
        cp=set(git('diff','--name-only',ENTRY,m['candidateCommit']).decode().splitlines());assert cp=={x['path']for x in m['changedFiles']}
        for x in m['changedFiles']:
            b=git('show',m['candidateCommit']+':'+x['path']);assert sha(b)==x['sha256']and len(b)==x['bytes']and(R/x['path']).read_bytes()==b
            mode=git('ls-tree',m['candidateCommit'],x['path']).decode().split()[0];assert mode==x['mode']
    if bound:
        assert m;rv=load(G/'review.json');assert rv['outcome']=='PASS'and not any(rv['severityCounts'].values())
        assert rv['binding']['candidateCommit']==m['candidateCommit']and rv['binding']['manifestSha256']==sha((G/'final-manifest.json').read_bytes())
        assert git('rev-parse','HEAD^').decode().strip()==m['candidateCommit']
        assert set(git('diff','--name-only',m['candidateCommit'],'HEAD').decode().splitlines())=={prefix+'final-manifest.json',prefix+'review.json'}
        assert not git('status','--porcelain').strip()
    git('diff','--check',ENTRY)
    result=dict(outcome='PASS',scope='Selected SD2 large-run audit only; no canonical/fact acceptance',startedAt=start,completedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),reviewBound=bound,entryCommit=ENTRY,protectedEntryFiles=protected,targets=397,sourceTargetDispositions=len(acquisitions),knownExplicitRemoteCalls=known,maximumExplicitRemoteCallsIncludingInterrupted=upper,sourceProseInFinalResultFiles=False,priorBytesModesHoldsRoutesApprovalsReviewsAndThreeAppendHistoriesPreserved=True,requiredChecks='plan/typecheck/tests PASS; exact build remains process/port EPERM',acceptedFacts=0,acceptedMappings=0,fullSD2Complete=False,SD3Started=False,remoteGitDeployment=False,workbookAccess=False)
    print(json.dumps(result,indent=2))
if __name__=='__main__':verify('--review-bound'in sys.argv)
