"""Read-only final closeout audit; --record writes one new receipt, never overwrites."""
from pathlib import Path
import subprocess,json,hashlib,datetime,sys
P=Path(__file__).resolve().parent;ROOT=P.parents[3];B=P.parent
load=lambda p:json.loads(p.read_text());sha=lambda b:hashlib.sha256(b).hexdigest();g=lambda *a:subprocess.check_output(['git',*a],cwd=ROOT)
before='3b712fe4b877092f5ac736476d47c0a1b7e37e1e';started=datetime.datetime.now(datetime.timezone.utc).isoformat()
source=subprocess.run(['python3',str(P/'verify.py')],cwd=ROOT,capture_output=True,text=True);assert source.returncode==0,(source.stdout,source.stderr);audit=json.loads(source.stdout)
expected=load(P/'verification.json');expected.pop('recordedAt');assert audit==expected
m=load(P/'final-manifest.json');review=load(P/'review.json');receipt=load(P/'review-receipt-identity.json')['commit'];c=m['candidateCommit']
assert review['outcome']=='PASS' and not any(review['severityCounts'].values()) and review['unresolvedRequiredFixes']==0
assert review['requiredFixCount']==review['resolvedDispositionCount']==len(review['dispositions'])==3
assert all(d['status']=='resolved-independently-rechecked' for d in review['dispositions'])
assert review['binding']['candidateCommit']==c and review['binding']['manifestSha256']==sha((P/'final-manifest.json').read_bytes())
assert g('rev-parse',receipt+'^').decode().strip()==c
assert set(g('diff','--name-only',c,receipt).decode().splitlines())=={str((P/f).relative_to(ROOT)) for f in ['review.json','final-manifest.json']}
assert sha(g('diff','--binary',m['entryCommit'],c))==m['completeDiffSha256']
for f in m['changedFiles']:assert sha(g('show',c+':'+f['path']))==f['sha256'] and (ROOT/f['path']).read_bytes()==g('show',c+':'+f['path'])
wrap=load(P/'wrap-verification.json');assert wrap['outcome']=='PASS' and wrap['noPendingReviewerRepair']
keys=[];fields=seeds=links=0;ledgers=[];q=load(B/'queue.json')
for i in range(1,8):
 p=B/f'checkpoint-{i:03d}.json';l=load(p);assert l['acceptedFacts']==0
 ledgers.append({'path':str(p.relative_to(ROOT)),'sha256':sha(p.read_bytes())})
 for r in l['records']:
  keys.append(r['inputKey']);assert r['identityAcceptance']=='held' and all(r.get(k) for k in ['owner','trigger','nextAction'])
  for f in r['fieldProposals'].values():assert f['acceptance']=='held' and all(f.get(k) or r.get(k) for k in ['owner','trigger','nextAction']);fields+=1
  for d in r.get('seedDispositions',[]):assert all(d.get(k) or r.get(k) for k in ['owner','trigger','nextAction']);seeds+=1
 for s in l['sourceRegistry']:
  for d in s.get('linkDispositions',[]):assert all(d.get(k) or s.get(k) for k in ['owner','trigger','nextAction']);links+=1
assert keys==[r['inputKey'] for r in q['records'][:140]] and len(keys)==len(set(keys))==140
assert fields==2646 and seeds==235 and links==744 and len(q['records'][140:])==266
assert q['records'][140]['inputKey']=='saved-405588227-row-144' and q['records'][140]['recordedName']=='P.E.O. Chapter D Scholarship (1) $1,400'
pp='docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md';s=(ROOT/pp).read_text();old=g('show',before+':'+pp).decode();a='<!-- SD2-CHECKPOINT-007-CLOSE-START -->\n';b='<!-- SD2-CHECKPOINT-007-CLOSE-END -->\n';assert s.count(a)==s.count(b)==1;x=s.index(a);y=s.index(b)+len(b);assert s[:x]+s[y:]==old
for p in ['docs/CURRENT_HANDOFF.md','docs/evidence/sd2-autonomous/NEXT_SESSION.md']:assert (ROOT/p).read_bytes().endswith(g('show',before+':'+p))
close=(P/'SESSION_CLOSE.md').read_text()
for text in ['Owner','Trigger and next action','Source-output handling','Temporary007raw','WETraw403','Davis recovered','Both exact standard-buildEPERM','Original437M1','Recommended next-session effort: High.']:assert text in close,text
allowed={pp,'docs/CURRENT_HANDOFF.md','docs/evidence/sd2-autonomous/NEXT_SESSION.md'}|{str((P/f).relative_to(ROOT)) for f in ['SESSION_CLOSE.md','verify-session-close.py','session-close-verification.json']}
changed=set(g('diff','--name-only',before).decode().splitlines())|set(g('ls-files','--others','--exclude-standard').decode().splitlines());assert changed<=allowed,changed-allowed
protected=0
for path in g('ls-tree','-r','--name-only',before).decode().splitlines():
 if path in allowed:continue
 assert (ROOT/path).read_bytes()==g('show',before+':'+path),path;protected+=1
inspection=load(P/'document-inspection.json');pins=[]
for d in inspection['nativeDocuments']:pins.append((d['rawArtifactPath'],d['rawSha256']))
for d in inspection['publicDocuments']:
 if d.get('path'):pins.append((d['path'],d['sha256']))
for d in inspection['safePageViews']:pins.append((d['path'],d['sha256']))
for d in load(P/'prior-custody-audit.json')['pins']:pins.append((d['path'],d['recordedSha256']))
assert len(pins)==len({p for p,h in pins})==68
for path,h in pins:assert sha(Path(path).read_bytes())==h
g('diff','--check',m['entryCommit'])
result={'outcome':'PASS','scope':'Final user-requested session closure only; no new research checkpoint or rebound source review','command':['python3','docs/evidence/sd2-autonomous/checkpoint-007/verify-session-close.py']+(['--record'] if '--record' in sys.argv else []),'startedAt':started,'completedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'baselineBeforeCloseout':before,'reviewedCandidate':c,'localReviewReceipt':receipt,'originalManifestReviewSourceAndWrapBindingsPreserved':True,'allPreCloseoutPathsPreservedExceptThreeAuthorizedPointers':protected,'allOlderPlanSupplementsNineAttentionRowsAndOldHandoffPromptBytesPreserved':True,'noPendingReviewerRepairOrRecheck':True,'threeReviewFindingsResolvedIndependently':True,'frozenInputs':406,'initialDispositions':140,'unprocessedInputs':266,'heldFields':2646,'heldIdentities':140,'factsAccepted':0,'seedAliasDispositionOccurrences':235,'sourceLinkDispositionOccurrences':744,'allOwnersTriggersNextActionsPresent':True,'ledgers':ledgers,'M1Records':437,'M1Pins':12,'temporaryCustodyPathsCurrentlyVerified':68,'priorCustodyPins':41,'newRawDocuments':13,'safePageViews':14,'newSourceReadsDuringCloseout':False,'newExternalEffects':False,'SD3Started':False,'sourceAudit':audit,'newIssuesDisposition':{'reviewOmissionsAndInterimReceipt':'Three author-fixed/independently-rechecked; original failed candidate/manifest/review/verification remain immutable','outputScopeAndEmbeddedForm':'Historical lapses disclosed; persisted containment and next-session pre-call/output sanitation trigger retained; no form input/action','temporaryCustody':'68exact local custody hashes verified now; next evidence owner rechecks at required audit or reports specific gaps without reconstruction/replay','IPCSharedIndexAndManifestDraft':'Resolved/corrected before independent final review; no pending repair, account change or remote effect'},'limits':{'standardBuild':'Both exact process/portEPERM failures open/unwaived; Codex before canonical acceptance/authorized release','freshAuthenticatedMainTarget':'Unverified; Codex at canonical acceptance/release trigger','workbookPreservationPublicAuthorityCurrentOffering':'Not proved by local research/closure; original owner/trigger retained','WETAndClerk':'WETraw403/readable200 with no raw/visual proof; older Clerkraw/visual/complete-section gaps unchanged','sourceProvenance':'Provider origin freshness/revisions unknown; Jean first precise timestamp unavailable; Davis recovered original capture has no raw full-envelope hash','nativeAndCrossHostCustody':'DOCXbodyXML is not page-render proof; safe views give no excluded-scope silence; no permanent/cross-host raw availability guarantee','humanCanonicalPublicationStudentMonitorEffects':'All original owner/trigger/gates retained'},'next':{'owner':'Next-session Codex research/proposals','trigger':'Fresh selected session under existing AUTHORITY/POLICY','authoritativeProgressPath':'docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md section9','kickoffPath':'docs/evidence/sd2-autonomous/NEXT_SESSION.md','offset':140,'inputKey':'saved-405588227-row-144','name':'P.E.O. Chapter D Scholarship (1) $1,400','action':'Resume one bounded SD2 checkpoint; never initialize/reset/replay; stop beforeSD3','recommendedEffort':'High'}}
if '--record' in sys.argv:
 p=P/'session-close-verification.json';assert not p.exists(),'Existing closure receipt will not be replaced';p.write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result,indent=2))
