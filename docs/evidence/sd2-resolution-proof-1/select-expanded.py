"""Bind finished independent saved-source inspections; never act on a draft."""
import hashlib,json
from pathlib import Path
G=Path(__file__).resolve().parent;R=G.parents[2];sha=lambda b:hashlib.sha256(b).hexdigest()
def check(ref):
    p=R/ref['path'];b=p.read_bytes();assert sha(b)==ref['sha256'],ref['path']
    if not ref.get('pointer'):return b
    x=json.loads(b)
    for k in ref['pointer'].split('/')[1:]:
        k=k.replace('~1','/').replace('~0','~');x=x[int(k)]if isinstance(x,list)else x[k]
    return x
if __name__=='__main__':
    source=Path('/private/tmp/sd2-expanded-saved-preflight.json');b=source.read_bytes();d=json.loads(b)
    assert d['outcome']=='PASS','Never use incomplete independent inspection'
    assert not d['newExternalSourceCalls']and not d['repositoryEdits']
    assert not(G/'expanded-saved-preflight-review.json').exists()
    initial=json.loads((G/'safety-recheck.json').read_text());oldids={x['targetId']for x in initial['targetInspections']}
    ts=json.loads((G/'triage.json').read_text())['targets'];by={x['targetId']:x for x in ts};expected={x['targetId']for x in ts if x['mode']=='public'}-oldids
    assert len(d['records'])==218 and {x['targetId']for x in d['records']}==expected
    completed={x['targetId']for p in G.glob('source-results-*.json')for x in json.loads(p.read_text())['records']}
    rows=[];selected=[]
    for row in d['records']:
        t=by[row['targetId']];assert row['order']==t['order']and row['exactLocatorSha256']==t['exactLocatorSha256']
        assert row['allOriginalHoldsRetained']and row['factsAccepted']==row['mappingsAccepted']==0
        assert 'PENDING'not in row['outcome']
        if row['outcome']=='PASS_FOR_PUBLIC_PAGE_RETRIEVAL_ONLY':
            assert row['independentSavedInspection']and row['exactReferenceHashesVerified']and row['evidence']
            for ev in row['evidence']:
                receipt=check(ev['receiptReference']);check(ev['artifactReference'])
                assert receipt is not None # Exact retained receipts may be whole text/header artifacts.
            if row['targetId']in completed:
                assert not row['retrievalEligibleAfterThisReview']or row.get('noReplayHold'), 'Independent budget state must preserve spent requests'
        rows.append(row)
    # The initial review's three excluded/spent institution targets retain full proof.
    rows.extend(x for x in initial['targetInspections']if x['targetId']not in {y['targetId']for y in json.loads((G/'retrieval-preflight-001.json').read_text())['records']})
    (G/'expanded-saved-preflight-review.json').write_bytes(b)
    out=G/'retrieval-preflight-002.json';payload={'records':rows,'reviewReference':{'path':str((G/'expanded-saved-preflight-review.json').relative_to(R)),'sha256':sha(b)},'earlierReviewReference':{'path':str((G/'safety-recheck.json').relative_to(R)),'sha256':sha((G/'safety-recheck.json').read_bytes())},'meaning':'Exact remaining public-page inspection and held outcomes; no factual/current/public-origin acceptance.'};out.write_text(json.dumps(payload,indent=2)+'\n')
    for row in rows:
        if row['outcome']=='PASS_FOR_PUBLIC_PAGE_RETRIEVAL_ONLY'and row['retrievalEligibleAfterThisReview']and not row.get('noReplayHold')and row['targetId']not in completed:
            t=by[row['targetId']];selected.append({**{k:t[k]for k in ['order','targetId','exactLocatorSha256','exactLocator','host','names','affectedSavedInputs','materialProofGaps']},'savedPreflight':{k:row[k]for k in ['targetId','outcome','independentSavedInspection','exactReferenceHashesVerified']},'preflightReference':{'path':str(out.relative_to(R)),'sha256':sha(out.read_bytes())}})
    (G/'selected-expanded-targets.json').write_text(json.dumps({'targets':selected,'noNewTargetsOrSourceDiscovery':True,'completedTargetsNotReplayed':True},indent=2)+'\n')
    print(json.dumps(dict(remainingPublicInspections=218,selectedUnusedPublicPages=len(selected),allNativeRemainHeld=True)))
