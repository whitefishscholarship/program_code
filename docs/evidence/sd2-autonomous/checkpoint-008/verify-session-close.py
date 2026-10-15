"""Read-only closure proof. Keeps the independent source review immutable."""
from pathlib import Path
import json,subprocess,hashlib,datetime
P=Path(__file__).resolve().parent;ROOT=P.parents[3];B=P.parent
load=lambda p:json.loads(p.read_text());sha=lambda b:hashlib.sha256(b).hexdigest();g=lambda *a:subprocess.check_output(['git',*a],cwd=ROOT)
base=g('rev-parse','405c926').decode().strip()
assert g('show','-s','--format=%s',base).decode().strip()=='docs(sd2): close eighth checkpoint and preserve all continuation routes'
assert g('branch','--show-current').decode().strip()=='codex/plan-student-data-maintenance'
target=P/'session-close-verification.json'
fresh=load(target)['freshPreCloseAudit'] if target.exists() else load(Path('/private/tmp/sd2-checkpoint008-session-close-audit.json'))
assert fresh['outcome']=='PASS' and fresh['allOwnersTriggersNextActionsPresent'] and fresh['noPendingReviewerRepair']
assert (fresh['heldFields'],fresh['heldIdentities'],fresh['initialDispositions'],fresh['unprocessedInputs'])==(3033,160,160,246)
assert fresh['sourceAudit']['priorCustodyPins']==68 and fresh['sourceAudit']['safePageViews']==2 and fresh['sourceAudit']['M1Records']==437
m=load(P/'final-manifest.json');r=load(P/'review.json');c=m['candidateCommit'];receipt=load(P/'review-receipt-identity.json')['commit']
assert r['outcome']=='PASS' and not any(r['severityCounts'].values()) and r['binding']['candidateCommit']==c
assert sha((P/'final-manifest.json').read_bytes())==r['binding']['manifestSha256']
assert len(r['dispositions'])==2 and all(x['status']=='resolved-independently-rechecked' for x in r['dispositions'])
assert g('rev-parse',receipt+'^').decode().strip()==c
assert set(g('diff','--name-only',c,receipt).decode().splitlines())=={str((P/x).relative_to(ROOT)) for x in ['final-manifest.json','review.json']}
mutable={'docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md','docs/CURRENT_HANDOFF.md','docs/evidence/sd2-autonomous/NEXT_SESSION.md'};preserved=0
for path in g('ls-tree','-r','--name-only',base).decode().splitlines():
 if path in mutable:continue
 assert (ROOT/path).read_bytes()==g('show',base+':'+path),path;preserved+=1
pp='docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md';t=(ROOT/pp).read_text();a='<!-- SD2-CHECKPOINT-008-CLOSE-START -->\n';b='<!-- SD2-CHECKPOINT-008-CLOSE-END -->\n';assert t.count(a)==t.count(b)==1;x=t.index(a);y=t.index(b)+len(b);assert t[:x]+t[y:]==g('show',base+':'+pp).decode()
for path in mutable- {pp}:assert (ROOT/path).read_bytes().endswith(g('show',base+':'+path))
doc=(P/'SESSION_CLOSE.md').read_text();rows=[x for x in doc.splitlines() if x.startswith('| ')][2:];assert len(rows)==10
for row in rows:
 cells=row.split('|');assert len(cells)==5 and all(cells[i].strip() for i in [1,2,3])
for text in ['246 unprocessed','offset160','savedrow164','3,033','272 seed-alias','766 source-link','437','No reviewer repair','Before any next permitted source call/output','Before canonical acceptance','Next-session recommended effort: High.']:assert text.lower() in doc.lower(),text
plan=load(P/'session-close-plan.json');assert plan['exitCode']==0 and sha((ROOT/plan['logPath']).read_bytes())==plan['logSha256']
newnames=['SESSION_CLOSE.md','verify-session-close.py','session-close-plan.json','session-close-plan.log','session-close-verification.json'];allowed=mutable|{str((P/x).relative_to(ROOT)) for x in newnames}
changed=set(g('diff','--name-only',base).decode().splitlines())|set(g('ls-files','--others','--exclude-standard').decode().splitlines());assert changed<=allowed,changed-allowed
g('diff','--check',base)
result={'outcome':'PASS','recordedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'scope':'Final requested session closure only; not another research checkpoint or rebound independent review','priorHandoffCommit':base,'priorTrackedPathsPreserved':preserved,'sourceCandidate':c,'localReviewReceipt':receipt,'allPriorProgressHandoffKickoffBytesRetained':True,'allHeldFactsIdentitiesSourcesAndMaterialsKeepOriginalOwnersTriggersActions':True,'closureAttentionRoutes':10,'noPendingReviewerRepairOrRecheck':True,'reviewerAgentObservedCompleted':True,'originalGoalCompleteWithinLocalHeldResearchLimits':True,'initialDispositions':160,'heldFields':3033,'heldIdentities':160,'acceptedFacts':0,'unprocessedInputs':246,'M1Records':437,'freshPreCloseAudit':fresh,'closurePlanCheck':plan,'runtimeTestsNotReplayed':'Original passing typecheck/fulltests and both exact blocked builds retained unchanged; only local closure documentation changed.','newSourceReads':False,'newExternalEffects':False,'SD3Started':False,'next':{'owner':'Next-session Codex research/proposals','trigger':'Next selected session under existing AUTHORITY/POLICY','authoritativeProgressPath':'docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md section9','kickoffPath':'docs/evidence/sd2-autonomous/NEXT_SESSION.md','offset':160,'savedRow':164,'inputKey':'saved-405588227-row-164','name':'Elevated Access Advanced Rating Scholarship','action':'Resume one bounded SD2 checkpoint; preserve every hold and route; never initialize/reset/replay; stop before SD3.'},'importantUnverifiedItems':'Current offering/source revisions/currency; native public/sponsor continuity; non-PEO complete raw/page/image proof; permanent temporary custody; fresh authenticated main/target; current workbook/preservation/backup/permission and every later acceptance/publication/student/monitor/effect gate. Exact standard build remains process/port permission-blocked.'}
print(json.dumps(result,indent=2))
