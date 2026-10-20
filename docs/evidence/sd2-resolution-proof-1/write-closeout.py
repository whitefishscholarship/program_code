"""One-time forensic closeout; no acquisition, installation or acceptance."""
from pathlib import Path
import collections,datetime,hashlib,json
G=Path(__file__).resolve().parent;R=G.parents[2]
sha=lambda b:hashlib.sha256(b).hexdigest()
load=lambda n:json.loads((G/n).read_text())
def save(n,x):(G/n).write_text(json.dumps(x,indent=2)+'\n')
if __name__=='__main__':
    assert not(G/'outcomes.json').exists(),'Do not replay closeout'
    ts=load('triage.json')['targets'];audit=load('source-call-audit.json');calls=collections.defaultdict(list);results=collections.defaultdict(list)
    for i,x in enumerate(audit['records']):
        for k in x['matchedTargetIds']:calls[k].append(dict(path=str((G/'source-call-audit.json').relative_to(R)),sha256=sha((G/'source-call-audit.json').read_bytes()),pointer='/records/'+str(i)))
    for p in sorted(G.glob('source-results-*.json')):
        for i,x in enumerate(json.loads(p.read_text())['records']):results[x['targetId']].append(dict(path=str(p.relative_to(R)),sha256=sha(p.read_bytes()),pointer='/records/'+str(i)))
    repeated={x['targetId']for x in audit['confirmedRepeatedPublicTargets']};rows=[]
    for t in ts:
        k=t['targetId'];reserved=t['mode']in['public','native'];state='held_original_triage_no_acquisition'
        if reserved:state='held_acquisition_suspended_dispatch_uncertain'
        if calls[k]:state='held_observed_dispatch_no_replay'
        if k in repeated:state='held_confirmed_prohibited_replay'
        rows.append(dict(targetId=k,order=t['order'],outcome=state,originalTargetReference=t['targetReference'],originalAffectedFields=t['originalAffectedFields'],originalAffectedSavedInputs=t['affectedSavedInputs'],triageMode=t['mode'],triageReason=t['reason'],observedCompletedToolRecords=len(calls[k]),callMetadataReferences=calls[k],resultReferences=results[k],cumulativeCallLedgerOverridesEarlierResultFlags=True,quarantinedAgainstFurtherAcquisition=reserved,originalRoutesRemainAuthoritative=True,allOriginalHoldsRetained=True,acceptedFact=False,acceptedMapping=False,owner='Codex continuation and original source/identity owners',trigger='Independent durable pre-call journal verification and exact never-dispatched target proof; original accepted-use gates remain',authoritativePaths='source-call-audit.json; call-ledger-review.json; original target/field references and consolidation acceptance-gates.json',nextAction='Retain holds. No more source calls this run. Never repeat observed or possibly dispatched targets. Unknown dispatch is not unused; historical replay remains failed. Hashes establish no criterion values or accepted identity.'))
    save('outcomes.json',dict(meaning='All-target forensic disposition index, not completed acquisition, factual acceptance or a new Reviews queue. Trace metadata supersedes earlier interruption summaries/replay flags.',records=rows))
    summary=dict(schemaVersion=2,recordedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),outcome='FAIL',reason='Three prohibited repeated public requests; historical no-replay constraint cannot be repaired retroactively.',targets=397,triageCounts=dict(collections.Counter(t['mode']for t in ts)),dispositionCounts=dict(collections.Counter(x['outcome']for x in rows)),observedCompletedToolCallRecords=audit['exactCompletedToolCallRecords'],toolCounts=audit['toolCounts'],phaseCounts=audit['phaseCounts'],confirmedReplayOrders=[x['order']for x in audit['confirmedRepeatedPublicTargets']],observedDistinctTargets=sum(bool(calls[t['targetId']])for t in ts),targetsWithResultPackets=sum(bool(results[t['targetId']])for t in ts),allAcquisitionCandidatesQuarantined=272,sourceAcquisitionComplete=False,unloggedInFlightDispatchPossible=True,maximumObservedExplicitToolCallConcurrency=audit['maximumObservedExplicitToolCallConcurrency'],underlyingHttpRequests='UNMEASURED',earlierInterruptedUpperBoundsSuperseded=True,earlierReplayedFalseFlagsSupersededForOrders=[26,30,34],safeProseOrCriterionValuesEstablished=0,priorExcludedTextIncidentDisclosed=True,sourceProseInFinalResultFiles=False,allOriginalFieldDefinitions=7547,originalHeld=7518,originalProposed=29,existingComparisonOccurrences=7468,namedInputs=411,savedPositions=794,acceptedFacts=0,acceptedMappings=0,canonicalAcceptance=False,fullSD2Complete=False,SD3Started=False,workbookAccess=False,remoteGitDeployment=False,monitoring=False,dependencyInstallAttempts=1,validation=dict(restore=0,plan=0,typecheck=0,tests=0,exactBuild=1,buildGate='Process/port EPERM retained; no alternative build/waiver'),originalAcceptanceGates=14,originalOwnersTriggersPathsActionsUnchanged=True)
    save('summary.json',summary)
    save('forensic-correction.json',dict(outcome='FAIL',supersedes=['source-results-002.json interruption coverage and call upper bounds','source-results-004.json replayed=false for orders26/30/34','Earlier controller/session-store completion assumptions and blanket no-replay descriptions'],authoritativeCumulativeLedger='source-call-audit.json',independentReview='call-ledger-review.json',confirmedReplayOrders=[26,30,34],cause='Cancellation discarded isolate state; author treated an incomplete summary as a complete dispatch ledger. Later selection omitted already dispatched targets.',historicalViolationIrreversible=True,containment='All272 public/native candidates quarantined; no further source calls this run. Remaining125 keep original triage holds.',missingResultBodiesNotReconstructed=True,acceptedFacts=0,owner='Codex continuation',trigger='Before any further selected acquisition',authoritativePath='outcomes.json and source-call-audit.json',nextAction='Independently verify exact unused targets and durable exclusive pre-call intent/result journal. Never infer unused from missing results, stale stores, absent notifications or termination. Hold ambiguity; no routine approval checkpoint or scope expansion.'))
    close='''# SD2 selected large run — failed execution, contained

**FAIL.** Three prohibited repeated public requests occurred (target orders26/30/34).
This historical no-replay violation cannot be repaired retroactively. No acceptance
receipt is authorized for this execution. Full SD2 remains incomplete;0accepted;
SD3 remains closed.

All397 original targets have forensic dispositions in outcomes.json; acquisition is
incomplete. Metadata-only audit observes64 completed source-tool calls:57public,
4native metadata,3native fetch. Cell51 completed13 calls, beyond its four-target
interruption summary. Cell86 completed26 while durable packets contained24results.
Observed completions are a floor, not proof of no unlogged in-flight dispatch.
All272 public/native acquisition candidates are quarantined against further reads;
remaining125 retain original triage holds. source-call-audit.json and forensic-
correction.json supersede earlier interrupted upper bounds/replayed=false flags.
call-ledger-review.json independently records known/uncertain dispatch boundaries.
Missing result bodies were not reconstructed. No further source calls this run.

One pinned dependency restoration passed. Unchanged plan check/typecheck/full tests
passed. Exact build failed process/port EPERM even in the permitted environment;
build/fresh authenticated main-target remain gates. No dependency pins, app/catalog,
canonical plan/state, configuration or CI changed. No alternative build or waiver.

The interim independent FAIL remains preserved. Excluded contact text briefly entered
one uncommitted result file; all10 initial excerpt texts were purged before any
source-result commit. No excluded text was committed. Missing saved safety preflight
and whole-native-envelope bounds were repaired and independently rechecked. Later
outputs retain hashes/counts only, proving no criterion values, current/public access,
sponsor continuity, accepted identity or complete native/visual inspection. Safety
repairs do not erase the separate later replay failure.

All7547original definitions(7518held/29proposed),7468prior comparisons,411named inputs/
794saved positions, separate publication identities/crosswalk gaps, duplicate holds,
approvals and rejected/final review bindings remain exact. Original owners/triggers/
paths/actions remain in ../sd2-consolidation-package/acceptance-gates.json and original
packets: nine attention rows/supplements,676seeds,1127links,365receipts,35inherited
routes,628destinations(oneunclosed),71custodypins,437M1routes/12pins. Kelsey's named
reviewer role and limited Jaycee approvals remain unchanged. No new custody claim.

Open items and next actions:
- Codex continuation owns replay failure/dispatch uncertainty. Before further selected
  source work, independently verify an exclusive durable pre-call intent/result
  journal and exact never-dispatched target evidence. Hold known/possible dispatches.
  Authority:forensic-correction.json,source-call-audit.json,call-ledger-review.json,
  outcomes.json and the original selected grant. No routine checkpoint approval.
- Codex validation/governance owns exact build/fresh-main-target verification when an
  unchanged supported context is available. Keep validation logs/pins and actual
  failures; no workaround build, waiver or unrelated repair.
- Original source/identity/governance owners retain original evidence/accepted-use,
  preservation/recovery/permission/custody/publication/student/M1/SD5/reserved-effect
  triggers and next actions at consolidation acceptance-gates/original packets.

The frozen candidate/final independent review document failure and containment only.
They confer no accepted execution or canonical stage acceptance. Future entry:
verify.py --forensic-bound checks matching frozen failure-record integrity and reports
FAIL execution. --review-bound must reject this failed run. Never widen old verifier
contexts, initialize/reset/replay or repeat old comparisons. Sole progress pointer:
student-plan section9. No workbook/app/contact/monitoring/remoteGit/deployment effects.
Stop beforeSD3. No routine small-run approval questions.
'''
    (G/'SESSION_CLOSE.md').write_text(close)
    kickoff='''# SD2 selected run — FAIL; acquisition contained

Sole progress pointer:student-plan section9. Current close:
docs/evidence/sd2-resolution-proof-1/SESSION_CLOSE.md.
Three prohibited replays(orders26/30/34) remain failed; no acceptance receipt.
All397targets have forensic dispositions;64observed completed calls are a floor,
not full dispatch proof. All272 acquisition candidates quarantined; no further
source calls this run. Cumulative trace/correction/independent ledger review supersede
earlier interrupted counts/replayed=false flags. Missing bodies not reconstructed.
Hash-only results establish no criterion values. One pinnedrestore/plan/typecheck/
tests passed; exactbuild EPERM remains. Before future action verify matching frozen
failure-record integrity:
python3 docs/evidence/sd2-resolution-proof-1/verify.py --forensic-bound
This reports FAIL execution with verified integrity; --review-bound rejects.
Read AGENTS canonicalorder/student-plansection9/originalAUTHORITY/POLICY/currentclose,
selection/entry/forensic-correction/source-call-audit/call-ledger-review/outcomes/
summary/validation/interimFAIL/safetyrecheck/finalmanifest/finalreview.
Codex owns durable pre-call journal and independently verified exact-unused proof
before any remaining selected acquisition; ambiguous/spent targets stayheld.
Original owners/triggers/paths/actions at consolidation acceptance-gates/original
packets remain. Every prior byte/mode/hold/approval/route/review and3appendhistories
protected. FullSD2 incomplete;0accepted;Kelsey/Jaycee roles unchanged.
No new scope/workbook/app/config/CI/contact/monitoring/remoteGit/deployment effects.
Never initialize/reset/replay. Stop beforeSD3. Priorhandoffexactbelow.

---

'''
    for path in ['docs/CURRENT_HANDOFF.md','docs/evidence/sd2-autonomous/NEXT_SESSION.md']:
        p=R/path;p.write_bytes(kickoff.encode()+p.read_bytes())
    p=R/'docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md';old=p.read_bytes();marker=b'<!-- SD2-CONSOLIDATION-PACKAGE-START -->\n';assert old.count(marker)==1
    block=('<!-- SD2-RESOLUTION-PROOF-1-START -->\n'+kickoff.split('Priorhandoffexactbelow.')[0].rstrip()+'\n\n<!-- SD2-RESOLUTION-PROOF-1-END -->\n').encode();p.write_bytes(old.replace(marker,block+marker,1))
    print(json.dumps(summary,indent=2))
