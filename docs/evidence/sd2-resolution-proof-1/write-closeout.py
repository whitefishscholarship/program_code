"""Write new run's derived outcomes and append-only handoff; no research or repair."""
from pathlib import Path
import collections,datetime,hashlib,json,subprocess
G=Path(__file__).resolve().parent;R=G.parents[2];P=R/'docs/evidence/sd2-consolidation-package'
sha=lambda b:hashlib.sha256(b).hexdigest()
def save(n,x):(G/n).write_text(json.dumps(x,indent=2)+'\n')
if __name__=='__main__':
    assert not(G/'outcomes.json').exists(),'Do not replay a completed closeout'
    ts=json.loads((G/'triage.json').read_text())['targets'];pre=json.loads((G/'preflight.json').read_text());preby={x['targetId']:x for x in pre['records']}
    inspections={};inspectionrefs={}
    for p in sorted(G.glob('retrieval-preflight-*.json')):
        for x in json.loads(p.read_text())['records']:
            assert x['targetId']not in inspections
            inspections[x['targetId']]=x;inspectionrefs[x['targetId']]={'path':str(p.relative_to(R)),'sha256':sha(p.read_bytes())}
    acq={};resultrefs={}
    for p in sorted(G.glob('source-results-*.json')):
        for i,x in enumerate(json.loads(p.read_text())['records']):
            assert x['targetId']not in acq,x['targetId'];acq[x['targetId']]=x;resultrefs[x['targetId']]={'path':str(p.relative_to(R)),'sha256':sha(p.read_bytes()),'pointer':'/records/'+str(i)}
    rows=[]
    for t in ts:
        k=t['targetId'];a=acq.get(k);pf=inspections.get(k,preby[k]);state=a['outcome']if a else 'held_saved_preflight_or_original_triage'
        rows.append(dict(targetId=k,order=t['order'],outcome=state,originalTargetReference=t['targetReference'],originalAffectedFields=t['originalAffectedFields'],originalAffectedSavedInputs=t['affectedSavedInputs'],triageMode=t['mode'],triageReason=t['reason'],independentPreflightOutcome=pf['outcome'],preflightReference=inspectionrefs.get(k,{'path':str((G/'preflight.json').relative_to(R)),'sha256':sha((G/'preflight.json').read_bytes()),'pointer':'/records/'+str(t['order']-1)}),acquisitionReference=resultrefs.get(k),originalRoutesRemainAuthoritative=True,allOriginalHoldsRetained=True,acceptedFact=False,acceptedMapping=False,owner='Original recorded source/identity owners; Codex selected continuation',trigger='Original material accepted-use/evidence-arrival trigger and exact saved-source safety proof; preserve any spent/no-replay boundary',authoritativePaths='Original target/field route references; sd2-consolidation-package/acceptance-gates.json; original packets',nextAction='Retain explicit held/proposed outcome. Hash-only retrieval observations establish no criterion values, current/public origin or identity. Any usable fact needs exact safe inspected proof and original acceptance gates; do not repeat completed attempts, fill blanks, discover sources or expand effects.'))
    save('outcomes.json',dict(meaning='Exact original-target derived readiness/disposition view, not a second factual ledger or Reviews queue.',records=rows))
    vals=list(acq.values());known=sum(x.get('explicitRemoteCalls')or 0 for x in vals);upper=known+sum(x.get('explicitRemoteCallsUpperBound',0)for x in vals if x.get('explicitRemoteCalls')is None)
    summary=dict(schemaVersion=1,recordedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),targets=397,originalBlockedLocators=18,triageCounts=dict(collections.Counter(t['mode']for t in ts)),sourceTargetDispositions=len(vals),targetsWithoutNewAcquisition=397-len(vals),acquisitionOutcomes=dict(collections.Counter(x['outcome']for x in vals)),knownExplicitRemoteCalls=known,maximumExplicitRemoteCallsIncludingInterrupted=upper,interruptedTargets=sum(x.get('explicitRemoteCalls')is None for x in vals),excerptHashes=sum(len(x.get('excerpts',[]))for x in vals),safeProseOrCriterionValuesEstablished=0,priorExcludedTextIncidentDisclosed=True,sourceProseInFinalResultFiles=False,allOriginalFieldDefinitions=7547,originalHeld=7518,originalProposed=29,existingComparisonOccurrences=7468,namedInputs=411,savedPositions=794,acceptedFacts=0,acceptedMappings=0,canonicalAcceptance=False,fullSD2Complete=False,SD3Started=False,workbookAccess=False,remoteGitDeployment=False,monitoring=False,dependencyInstallAttempts=1,validation={'restore':0,'plan':0,'typecheck':0,'tests':0,'exactBuild':1,'buildGate':'Process/port EPERM retained; no alternative build/waiver'},originalAcceptanceGates=14,originalOwnersTriggersPathsActionsUnchanged=True)
    save('summary.json',summary)
    text=f'''# Selected SD2 large validation/proof run — session close

This selected run processed all397 frozen targets into explicit dispositions.
{len(vals)} targets have source-attempt/result dispositions; {397-len(vals)} retain saved-proof,
preflight or original holds without unnecessary acquisition. Known explicit tool calls:
{known}; conservative maximum including4 interrupted target requests:{upper}. Provider-internal
HTTP counts remain unmeasured. Per-target evidence/routes:outcomes.json, triage.json,
preflight.json, retrieval-preflight packets and source-results packets.

One locked restore passed. Unchanged plan/typecheck/full tests passed. Exact build
failed process/port EPERM even in the permitted environment; it remains an open gate.
No scripts, dependency pins, app/catalog, canonical plan/state, configuration or CI changed.

The interim independent FAIL is retained: H1 excluded postal-contact text was briefly
written to one uncommitted new result file, then all10 excerpt texts were purged before
any source-result commit. Hashes/incident remain; no excluded text was committed.
H2 missing saved preflight and M1 full-native-envelope cap were repaired. Exact safety
recheck PASS and synthetic regressions are retained. Interrupted requests were not replayed.
Final result files retain hashes/counts only; they establish no underlying criterion
values, current/public/sponsor continuity, accepted identity, complete native/visual
inspection or source silence. No prior holding becomes a negative or accepted fact.

All7547original definitions(7518held/29proposed),7468prior comparisons,411named inputs,
794saved positions,411separate publication IDs/crosswalk gaps, duplicate-name holds,
original approvals and rejected/final reviews remain exact. Prior historical artifacts
and all three append histories are protected. FullSD2 remains incomplete;0accepted.

Open work retains original owner/trigger/path/action in
../sd2-consolidation-package/acceptance-gates.json and original packets:
- Codex validation/governance: exact supported build and fresh authenticated main/target,
  before canonical acceptance or separately authorized release; retain actual failures.
- Original source/identity owners and Codex: exact original evidence/reconciliation
  trigger; retain held outcomes or independently inspect sufficient safe proof for a
  selected material claim. Spent/interrupted requests are no-replay; hashes are not facts.
- Kelsey retains named fact review and exact limited Jaycee approvals; Codex retains
  evidence-based identity work and automatic independent reviews. No new manual checkpoint
  selection is needed within remaining authorized scope, and no unseen fact is accepted.
- Every original preservation/recovery/permission/custody/publication/student/M1/SD5/
  reserved-effect owner retains original trigger, authoritative path and next action.
  Preserve nine attention rows/supplements,71custodypins,437M1routes/12pins and all
  seeds/links/receipts/inherited/destination routes. No new custody availability claim.

Local run completion is authoritative only at matching immutable final-manifest.json,
independent PASS review.json and exact direct-child two-file local receipt. Before a
future selected action at its clean receipt, run this run's verify.py --review-bound;
never widen an old verifier context, rebuild old comparisons, initialize/reset/replay.
Sole progress pointer:student plan section9. No remote Git/deployment, workbook,
application/contact/monitoring, canonical/fact acceptance, SD3 or later stage.
'''
    (G/'SESSION_CLOSE.md').write_text(text)
    kickoff=f'''# Selected SD2 large validation/proof run

Sole progress pointer:student-plan section9. All397targets explicitly processed;
{len(vals)}source-attempt dispositions, known{known}/conservative max{upper}explicit tool calls,
4interrupted targets no replay. Hash-only results establish no criterion values.
One lockedrestore/plan/typecheck/tests PASS; exactbuild process/portEPERM remains.
Currentclose:docs/evidence/sd2-resolution-proof-1/SESSION_CLOSE.md, summary/outcomes,
selection/entry/triage/preflight/inspection/source-results, validation/safety/failure/
remediation and final-manifest/review. Status only matching immutable PASS/local receipt.
Beforefutureaction atmatching clean receipt:
python3 docs/evidence/sd2-resolution-proof-1/verify.py --review-bound
Read AGENTS canonicalorder/student-plansection9/originalAUTHORITY/POLICY/currentclose.
Preserve every prior byte/mode/hold/approval/route/rejected/final review and3appendhistories.
Initial excluded contact text was purged before any commit; incident/hash remains.
FullSD2 incomplete,0accepted. All original14gates/owners/triggers/paths/actions retained
at consolidation acceptance-gates/originalpackets. No new factual/proof acceptance,
workbook/rawnative/custody access, app/config/CI/remoteGit/deployment/contact/monitoring.
No routine checkpoint questions or secondReviewsqueue. Never initialize/reset/replay.
Stop beforeSD3. Priorhandoffexactbelow.

---

'''
    for path in ['docs/CURRENT_HANDOFF.md','docs/evidence/sd2-autonomous/NEXT_SESSION.md']:
        p=R/path;p.write_bytes(kickoff.encode()+p.read_bytes())
    p=R/'docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md';old=p.read_bytes();marker=b'<!-- SD2-CONSOLIDATION-PACKAGE-START -->\n';assert old.count(marker)==1
    block=('<!-- SD2-RESOLUTION-PROOF-1-START -->\n'+kickoff.split('Priorhandoffexactbelow.')[0]+'\n<!-- SD2-RESOLUTION-PROOF-1-END -->\n').encode();p.write_bytes(old.replace(marker,block+marker,1))
    print(json.dumps(summary,indent=2))
