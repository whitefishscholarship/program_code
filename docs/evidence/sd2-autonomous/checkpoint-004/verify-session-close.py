"""Read-only final open-item audit. Explicit --record writes one new receipt only."""
from pathlib import Path
import collections,datetime,hashlib,json,subprocess,sys
P=Path(__file__).resolve().parent;ROOT=P.parents[3]
def git(*a):return subprocess.check_output(['git',*a],cwd=ROOT)
def load(p):return json.loads(p.read_text())
def sha(b):return hashlib.sha256(b).hexdigest()
started=datetime.datetime.now(datetime.timezone.utc).isoformat()
cmd=['python3',str((P/'verify-session-wrap.py').relative_to(ROOT))]
r=subprocess.run(cmd,cwd=ROOT,capture_output=True,text=True);assert r.returncode==0,(r.stdout,r.stderr)
wrap=json.loads(r.stdout);assert wrap['outcome']=='PASS' and wrap['sourceAudit']['outcome']=='PASS'
q=load(P.parent/'queue.json');prior=[];allkeys=[];fields=[];sourceLinks=0;seedLinks=0;inheritedSeedLinks=0;routes=[]
for i in range(1,5):
 path=P.parent/f'checkpoint-{i:03d}.json';ledger=load(path);assert ledger['acceptedFacts']==0
 records=ledger['records'];assert len(records)==20
 for record in records:
  assert record['identityAcceptance']=='held'
  assert all(record.get(k) for k in ['owner','trigger','nextAction'])
  allkeys.append(record['inputKey']);fields.extend(record['fieldProposals'].values())
  for field in record['fieldProposals'].values():assert field['acceptance']=='held'
  for d in record.get('seedDispositions',[]):
   assert all(d.get(k) or record.get(k) for k in ['owner','trigger','nextAction']);seedLinks+=1
   if not all(d.get(k) for k in ['owner','trigger','nextAction']):inheritedSeedLinks+=1
  routes.append({'inputKey':record['inputKey'],'authoritativePath':str(path.relative_to(ROOT)),'owner':record['owner'],'trigger':record['trigger'],'nextAction':record['nextAction']})
 for source in ledger['sourceRegistry']:
  for d in source.get('linkDispositions',[]):
   assert all(d.get(k) or source.get(k) for k in ['owner','trigger','nextAction']);sourceLinks+=1
 prior.append({'checkpoint':i,'inputKeys':len(records),'heldFields':sum(len(x['fieldProposals']) for x in records),'ledgerPath':str(path.relative_to(ROOT)),'ledgerSha256':sha(path.read_bytes())})
assert len(allkeys)==len(set(allkeys))==80 and allkeys==[x['inputKey'] for x in q['records'][:80]]
assert len(fields)==1520 and len(q['records'][80:])==326
review=load(P/'review.json');assert review['outcome']=='PASS' and review['unresolvedRequiredFixes']==0
assert len(review['dispositions'])==3 and all(d['status']=='resolved-independently-rechecked' for d in review['dispositions'])
assert all(n==0 for n in review['severityCounts'].values())
close=(P/'SESSION_CLOSE.md').read_text();assert all(x in close for x in ['Source-output handling','Temporary Norrish','Owner','Trigger and next action','Recommended next-session effort: High.'])
assert len([line for line in close.splitlines() if line.startswith('| ')])==7
assert (ROOT/'docs/CURRENT_HANDOFF.md').read_bytes().endswith(git('show','5851e95:docs/CURRENT_HANDOFF.md'))
expected={'docs/CURRENT_HANDOFF.md','docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md','docs/evidence/sd2-autonomous/NEXT_SESSION.md','docs/evidence/sd2-autonomous/checkpoint-004/SESSION_CLOSE.md','docs/evidence/sd2-autonomous/checkpoint-004/verify-session-close.py','docs/evidence/sd2-autonomous/checkpoint-004/session-close-verification.json'}
changed=set(git('diff','--name-only','5851e95').decode().splitlines());assert changed<=expected,changed-expected
git('diff','--check','02e8b2a')
result={'outcome':'PASS','scope':'Final user-requested session close only, not a new SD2 checkpoint or rebound source review','command':['python3','docs/evidence/sd2-autonomous/checkpoint-004/verify-session-close.py','--record' if '--record' in sys.argv else '(read-only default)'],'startedAt':started,'completedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'baselineBeforeCloseout':'5851e95','reviewedCandidate':review['binding']['candidateCommit'],'localReviewReceipt':wrap['localReviewReceipt'],'originalReviewAndManifestPreserved':True,'independentReviewerCompletedNoPendingRepair':True,'threeFindingsResolvedIndependently':True,'initialDispositions':80,'frozenInputs':406,'unprocessedInputs':326,'heldFields':1520,'heldIdentities':80,'factsAccepted':0,'checkpointLedgers':prior,'recordRoutesAudited':len(routes),'seedAliasDispositionsAudited':seedLinks,'seedAliasRoutesInheritedFromVerifiedParentRecord':inheritedSeedLinks,'auditPreparationCorrection':'Initial close-audit assertion expected routing copied into every seed object; checkpoint002 legitimately inherits its complete owner/trigger/specific next action from its named record. Audit now explicitly validates that inheritance. Original ledger/history untouched; initial assertion resolved.','sourceLinkDispositionOccurrencesAudited':sourceLinks,'allOwnersTriggersNextActionsPresent':True,'originalNineAttentionRowsAndEverySupplementPreserved':wrap['allOlderPlanSupplementsAndNineAttentionRowsBytePreserved'],'originalM1Records':437,'M1Pins':12,'newSourceReadOrReplay':False,'newExternalEffects':False,'SD3Started':False,'newIssues':['Three source-review findings resolved by author and independently rechecked; immutable failed history retained.','Initial public recipient/contact output exposure disclosed; persisted containment verified; safe-output follow-through owned by next Codex before permitted source outputs.','Temporary raw custody audited; next evidence owner must record availability gaps rather than reconstruct/replay.'],'laterGates':{'standardBuild':'Both exact process/portEPERM failures remain open, no waiver','freshAuthenticatedMainTarget':'Unverified; retainedlocalpinonly','liveWorkbookPublicSourceAuthorityNativePreservationBackupRecovery':'Not established by this local research/closeout','humanCanonicalPublicationStudentMonitorEffects':'All original owner/trigger/gates remain open'},'next':{'owner':'Next-session Codex research/proposals','trigger':'Fresh session under existing AUTHORITY/POLICY','authoritativeProgressPath':'docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md section9','kickoffPath':'docs/evidence/sd2-autonomous/NEXT_SESSION.md','inputKey':'saved-405588227-row-84','name':'Clayton E. Hoyt Endowed Scholarship','action':'Resume one bounded SD2checkpoint at offset80; neverinitialize/reset/replay; stopbeforeSD3','recommendedEffort':'High'}}
if '--record' in sys.argv:
 p=P/'session-close-verification.json';assert not p.exists(),'Existing receipt will not be replaced';p.write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result,indent=2))
