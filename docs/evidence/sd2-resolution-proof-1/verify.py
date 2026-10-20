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
        assert x['affectedSavedInputs']==t['affectedSavedInputs'] and x['allOriginalHoldsRetained'] and x['factsAccepted']==x['mappingsAccepted']==0
    ns3={'__file__':str(G/'audit-calls.py'),'__name__':'readonly_call_metadata'};exec(compile((G/'audit-calls.py').read_text(),str(G/'audit-calls.py'),'exec'),ns3)
    audit=load(G/'source-call-audit.json');assert audit==ns3['derive']()
    assert audit['exactCompletedToolCallRecords']==64 and audit['phaseCounts']=={'other_selected_calls':25,'cell51':13,'cell86':26}
    assert [x['order']for x in audit['confirmedRepeatedPublicTargets']]==[26,30,34]
    assert audit['maximumObservedExplicitToolCallConcurrency']==2 and audit['ambiguousNativeAssignments']==0
    correction=load(G/'forensic-correction.json');assert correction['outcome']=='FAIL' and correction['historicalViolationIrreversible'] and correction['confirmedReplayOrders']==[26,30,34]
    reviewLedger=load(G/'call-ledger-review.json');rs=reviewLedger['summary']
    assert reviewLedger['outcome']=='FAIL' and rs['completedSourceToolRecords']==64 and rs['conservativeTotalExplicitCallReservation']==68
    assert rs['uncertainFrontierAdditionalCallsUpperBound']==4 and rs['confirmedHistoricalRepeatedPublicOrders']==[26,30,34] and rs['possibleAdditionalRepeatedPublicOrders']==[32]
    assert {x['toolItemId']for x in audit['records']}=={x['invocationId']for x in reviewLedger['records']}
    tb=reviewLedger['traceBinding'];assert sha((G/'selection.json').read_bytes())==tb['selectionSha256']
    with Path(tb['path']).open('rb')as f:assert sha(f.read(tb['snapshotPrefixBytes']))==tb['snapshotPrefixSha256']
    for snap in reviewLedger['sourceSnapshots']:assert sha((R/snap['path']).read_bytes())==snap['sha256']
    fd=load(G/'failure-dispositions.json')['callLedgerFindingDispositions'];assert len(fd)==len(reviewLedger['findings'])==3
    assert {x['findingId']for x in fd}=={x['id']for x in reviewLedger['findings']} and all(x['rationale']and x['owner']and x['target']and x['trigger']for x in fd)
    counts=collections.Counter(k for x in audit['records']for k in x['matchedTargetIds'])
    for x in ledger:
        t=targetby[x['targetId']]
        assert x['originalTargetReference']==t['targetReference'] and x['originalAffectedFields']==t['originalAffectedFields'] and x['originalAffectedSavedInputs']==t['affectedSavedInputs']
        assert x['observedCompletedToolRecords']==counts[x['targetId']] and x['quarantinedAgainstFurtherAcquisition']==(t['mode']in['public','native'])
        assert x['allOriginalHoldsRetained'] and x['originalRoutesRemainAuthoritative'] and not x['acceptedFact'] and not x['acceptedMapping']
        assert x['owner'] and x['trigger'] and x['authoritativePaths'] and x['nextAction']
        for ref in x['callMetadataReferences']+x['resultReferences']:
            assert sha((R/ref['path']).read_bytes())==ref['sha256']
            node=load(R/ref['path'])
            for part in ref['pointer'].strip('/').split('/'):node=node[int(part)]if isinstance(node,list)else node[part]
            assert x['targetId']in node.get('matchedTargetIds',[node.get('targetId')])
    v=load(G/'validation/summary.json');repair=load(pm/'PROPOSED_VALIDATION_REPAIR.json')
    assert v['dependencyInstallAttempts']==1 and not v['lifecycleScriptsExecuted']
    assert [x['command']for x in v['checks']]==repair['requiredCommands'] and [x['exitCode']for x in v['checks']]==[0,0,0,1] and not v['allRequiredChecksPassed']
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
    summary=load(G/'summary.json');assert summary['outcome']=='FAIL' and summary['targets']==397 and summary['observedCompletedToolCallRecords']==64
    assert summary['confirmedReplayOrders']==[26,30,34] and summary['allAcquisitionCandidatesQuarantined']==272
    assert summary['conservativeExplicitCallReservation']==68 and summary['uncertainFrontierAdditionalCalls']==4 and summary['possibleAdditionalReplayOrders']==[32]
    assert summary['independentCallLedgerReviewSha256']==sha((G/'call-ledger-review.json').read_bytes())
    assert summary['observedDistinctTargets']==len(counts) and summary['targetsWithResultPackets']==len(acquisitions)
    assert not summary['sourceAcquisitionComplete'] and summary['unloggedInFlightDispatchPossible']
    assert summary['acceptedFacts']==summary['acceptedMappings']==0 and not summary['canonicalAcceptance'] and not summary['fullSD2Complete'] and not summary['SD3Started']
    m=None
    if(G/'final-manifest.json').exists():
        m=load(G/'final-manifest.json');assert m['entryCommit']==ENTRY and git('rev-parse',m['candidateCommit']+'^{tree}').decode().strip()==m['candidateTree']
        diff=git('diff','--binary',ENTRY,m['candidateCommit']);assert sha(diff)==m['completeDiffSha256'] and len(diff)==m['completeDiffBytes']
        cp=set(git('diff','--name-only',ENTRY,m['candidateCommit']).decode().splitlines());assert cp=={x['path']for x in m['changedFiles']}
        for x in m['changedFiles']:
            b=git('show',m['candidateCommit']+':'+x['path']);assert sha(b)==x['sha256'] and len(b)==x['bytes'] and(R/x['path']).read_bytes()==b
            assert git('ls-tree',m['candidateCommit'],x['path']).decode().split()[0]==x['mode']
    if bound:
        assert m;rv=load(G/'review.json');assert rv['outcome']=='FAIL' and rv['binding']['candidateCommit']==m['candidateCommit'] and rv['binding']['manifestSha256']==sha((G/'final-manifest.json').read_bytes())
        assert git('rev-parse','HEAD^').decode().strip()==m['candidateCommit']
        assert set(git('diff','--name-only',m['candidateCommit'],'HEAD').decode().splitlines())=={prefix+'final-manifest.json',prefix+'review.json'}
        assert not git('status','--porcelain').strip()
    git('diff','--check')
    whitespace=subprocess.run(['git','diff','--check',ENTRY],cwd=R,capture_output=True,text=True)
    assert whitespace.returncode==2 and whitespace.stdout.splitlines()==['docs/evidence/sd2-resolution-proof-1/public-acquisition.js:57: new blank line at EOF.','docs/evidence/sd2-resolution-proof-1/validation/typecheck.log:4: new blank line at EOF.'],whitespace.stdout
    print(json.dumps(dict(outcome='FAIL',integrity='PASS',scope='Forensic failure-record integrity only; NOT accepted execution or an acceptance receipt',startedAt=start,completedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),forensicBound=bound,entryCommit=ENTRY,protectedEntryFiles=protected,targets=397,observedCompletedToolCalls=64,confirmedReplayOrders=[26,30,34],possibleAdditionalReplayOrders=[32],conservativeExplicitCallReservation=68,fullBaselineWhitespaceCheck='FAIL: preserved bound acquisition-code EOF and raw typecheck-log EOF',all272AcquisitionCandidatesQuarantined=True,priorBytesModesHoldsRoutesApprovalsReviewsAndThreeAppendHistoriesPreserved=True,requiredChecks='plan/typecheck/tests PASS; exact build remains process/port EPERM',acceptedFacts=0,acceptedMappings=0,fullSD2Complete=False,SD3Started=False),indent=2))
if __name__=='__main__':
    if '--review-bound'in sys.argv:
        print(json.dumps(dict(outcome='FAIL',reason='This execution has confirmed prohibited replays and no acceptance receipt. Use --forensic-bound only to verify failed-record integrity.')));sys.exit(2)
    verify('--forensic-bound'in sys.argv)
    if not any(x in sys.argv for x in ['--integrity-only','--forensic-bound']):sys.exit(2)
