"""Deterministic metadata-only overlay; never execute old acquisition scripts."""
from pathlib import Path
import json
from journal import digest, encoded

G = Path(__file__).resolve().parent
R = G.parents[2]
OLD = R / 'docs/evidence/sd2-resolution-proof-1'


def load(path):
    return json.loads(path.read_bytes())


def reference(path, pointer, record):
    return dict(path=str(path.relative_to(R)), sha256=digest(path.read_bytes()),
                pointer=pointer, recordSha256=digest(encoded(record)))


def calculate():
    ap = OLD / 'source-call-audit.json'
    fp = OLD / 'forensic-correction.json'
    lp = OLD / 'call-ledger-review.json'
    op = OLD / 'outcomes.json'
    tp = R / 'docs/evidence/sd2-consolidation-package/read-targets.json'
    triage = load(OLD / 'triage.json')['targets']
    targets = load(tp)['targets']
    audit, correction, review = load(ap), load(fp), load(lp)
    outcomes = load(op)['records']
    assert len(targets) == len(triage) == len(outcomes) == 397
    assert len({t['targetId'] for t in targets}) == 397
    imported = dict(completed=[], frontier=[], conservativeCalls=68,
                    exactAttemptsEstablished=False)
    for i, row in enumerate(audit['records']):
        imported['completed'].append(dict(
            reference=reference(ap, f'/records/{i}', row),
            recordSha256=digest(encoded(row)), targetIds=row['matchedTargetIds'],
            orders=row['matchedTargetOrders'], tool=row['tool'], status=row['status'],
            startedAtMs=row['startedAtMs'], completedAtMs=row['completedAtMs']))
    for i, row in enumerate(correction['uncertainFrontierReservations']):
        imported['frontier'].append(dict(
            reference=reference(fp, f'/uncertainFrontierReservations/{i}', row),
            recordSha256=digest(encoded(row)), targetIds=[row['targetId']],
            orders=[row['order']], tool=row['tool'], status='unknown',
            startedAtMs=None, completedAtMs=None))
    assert len(imported['completed']) == 64 and len(imported['frontier']) == 4
    assert sum(r['status'] == 'failed' for r in imported['completed']) == 9
    assert audit['toolCounts'] == review['summary']['toolCounts'] == {
        'firecrawl.firecrawl_scrape':57, 'google_drive.get_file_metadata':4,
        'google_drive.fetch':3}
    touched = {order for row in imported['completed'] + imported['frontier']
               for order in row['orders']}
    reached = {order for group in review['controllerFrontiers']['cell86']['firstSevenGroups']
               for order in group}
    reached |= {order for group in review['controllerFrontiers']['cell51']['firstThreeGroups']
                for order in group}
    expanded = load(OLD / 'selected-expanded-targets.json')['targets']
    theoretical = {t['order'] for t in expanded} - touched - reached
    assert len(theoretical) == 72
    assert theoretical == set(review['theoreticalUnusedExpandedTargets']['orders'])
    assert theoretical.isdisjoint(touched | reached)
    assert touched == set(review['quarantineAllCompletedAndFrontierTargetOrders'])
    assert len(touched) == 55
    rows, contract_targets = [], []
    for i, (target, tri, old) in enumerate(zip(targets, triage, outcomes)):
        order = i + 1
        assert old['order'] == tri['order'] == order
        assert target['targetId'] == tri['targetId'] == old['targetId']
        assert target['exactLocatorSha256'] == tri['exactLocatorSha256']
        assert digest(tri['exactLocator'].encode()) == target['exactLocatorSha256']
        assert tri['host'] == target['host'] or (target['host'] is None and
               tri['host'] == '' and tri['mode'] == 'hold')
        if order in theoretical:
            match = next(t for t in expanded if t['order'] == order)
            assert match['targetId'] == target['targetId']
            assert match['exactLocatorSha256'] == target['exactLocatorSha256']
        rows.append(dict(order=order, targetId=target['targetId'],
                         locatorSha256=target['exactLocatorSha256'],
                         originalHost=target['host'], triageHost=tri['host'],
                         originalTarget=reference(tp, f'/targets/{i}', target),
                         originalOutcome=reference(op, f'/records/{i}', old),
                         originalOutcomeValue=old['outcome'],
                         originalQuarantine=old['quarantinedAgainstFurtherAcquisition'],
                         originalAffectedFieldsSha256=digest(encoded(old['originalAffectedFields'])),
                         originalAffectedSavedInputsSha256=digest(encoded(old['originalAffectedSavedInputs'])),
                         observedCalls=sum(order in r['orders'] for r in imported['completed']),
                         frontierCalls=sum(order in r['orders'] for r in imported['frontier']),
                         dispatchKnowledge=('OBSERVED_OR_FRONTIER_SPENT' if order in touched else
                                            'CONDITIONAL_CONTROLLER_NONREACHABILITY' if order in theoretical else
                                            'NO_EXACT_NEVER_DISPATCHED_PROOF'),
                         exactNeverDispatchedProof=False, acquisitionCleared=False,
                         currentDisposition='HELD', acceptedFact=False, acceptedMapping=False,
                         owner=old['owner'], trigger=old['trigger'],
                         authoritativePaths=old['authoritativePaths'], nextAction=old['nextAction']))
        contract_targets.append(dict(targetId=target['targetId'], order=order,
                                     locatorSha256=target['exactLocatorSha256'], host=target['host'],
                                     tool='HOLD_NO_DISPATCH', preflightSha256=digest(encoded(tri)),
                                     synthetic=False, held=True))
    assert sum(r['originalQuarantine'] for r in rows) == 272
    contract = dict(schema=1, mode='synthetic-only', importSha256=digest(encoded(imported)),
                    maxCalls=758, maxActive=4, perHost=1, targets=contract_targets)
    summary = dict(targets=397, originalQuarantines=272, originalOtherHolds=125,
                   observedCompletedCalls=64, failedCompletedCalls=9,
                   frontierReservations=4, conservativeCalls=68,
                   observedOrFrontierTargetOrders=len(touched),
                   theoreticalUnusedExpandedTargets=72,
                   theoreticalUnusedOrders=sorted(theoretical),
                   theoreticalUnusedTargetIds=[r['targetId'] for r in rows if r['order'] in theoretical],
                   exactNeverDispatchedProof='NOT_ESTABLISHED', clearedForAcquisition=0,
                   originalSourceExecution='FAIL', confirmedReplayOrders=[26, 30, 34],
                   possibleReplayOrders=[32], all397RemainHeld=True,
                   underlyingHttpRequests='UNMEASURED', sourceAttemptsExact='NOT_ESTABLISHED',
                   sourceRequestsDuringBatch=0, acceptedFacts=0, acceptedMappings=0,
                   fullSD2Complete=False, SD3Started=False,
                   proofLimit='Saved completed-event metadata and reconstructed await frontiers only; '
                   'not absence of all external dispatch. No new trace or source bodies inspected.',
                   recordHashEncoding='SHA256 over sorted compact ASCII JSON plus newline')
    return {'historical-import.json': imported, 'reconciliation.json': {'records': rows},
            'contract.json': contract, 'summary.json': summary}


if __name__ == '__main__':
    import sys
    for name, value in calculate().items():
        path = G / name
        if '--check' in sys.argv:
            assert path.read_bytes() == encoded(value), name
        else:
            # Write once; a rerun verifies, never replaces/replays historic state.
            if path.exists():
                assert path.read_bytes() == encoded(value), name
            else:
                with path.open('xb') as stream:
                    stream.write(encoded(value))
    print('PASS: 397 held; 64 completed + 4 reserved; exact unused NOT ESTABLISHED; 0 cleared')
