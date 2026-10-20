"""Saved-evidence preflight candidates only; never infer public/native acceptance."""
from pathlib import Path
import collections,hashlib,json
G=Path(__file__).resolve().parent;R=G.parents[2]
sha=lambda b:hashlib.sha256(b).hexdigest()
def derive():
    by=collections.defaultdict(list)
    for p in sorted((R/'docs/evidence/sd2-autonomous').glob('checkpoint-*/source-receipts.json')):
        data=json.loads(p.read_text())
        if isinstance(data,dict):data=next((v for v in data.values()if isinstance(v,list)),[])
        for i,x in enumerate(data):
            if not isinstance(x,dict):continue
            for key in ['originalUrl','finalUrl']:
                if x.get(key):by[x[key]].append((p,i,x))
    rows=[]
    for t in json.loads((G/'triage.json').read_text())['targets']:
        row=dict(targetId=t['targetId'],order=t['order'],exactLocatorSha256=t['exactLocatorSha256'],affectedSavedInputs=t['affectedSavedInputs'],outcome='HOLD_NO_INDEPENDENT_SAVED_PREFLIGHT',retrievalSelected=False,evidence=[],allOriginalHoldsRetained=True,currentPublicAccessEstablished=False,currentOfficialContinuityEstablished=False,blankNativeSafetyEstablished=False)
        if t['mode']not in ['public','native']:
            row['outcome']='RETAIN_ORIGINAL_TRIAGE';row['reason']=t['reason']
        elif t['mode']=='native':row['reason']='Exact native public/blank/sponsor safety is not independently established by a filename or connected account; retain held without more native content reads.'
        elif not t['host'].endswith(('.edu','.gov')):row['reason']='Saved recorded locator and provider flag alone do not establish official/public named-program safety; retain held pending independent exact-source proof.'
        else:
            for p,i,x in by[t['exactLocator']]:
                ap=x.get('artifactPath');ah=x.get('artifactSha256')
                if x.get('statusCode')!=200 or not ap or not ah or not(R/ap).is_file():continue
                b=(R/ap).read_bytes()
                if sha(b)!=ah:continue
                txt=b.decode('utf-8');matched=[n for n in t['names']if n.lower()in txt.lower()]
                if not matched:continue
                row['evidence'].append(dict(receiptReference=dict(path=str(p.relative_to(R)),sha256=sha(p.read_bytes()),pointer='/'+str(i)),artifactReference=dict(path=ap,sha256=ah),matchedRecordedNames=matched,allAffectedNamesMatched=set(t['names'])<=set(matched),historicalStatusCode=200,sourceScope=x.get('sourceScope')))
            if row['evidence']:
                row['outcome']='CANDIDATE_REQUIRES_INDEPENDENT_SAVED_INSPECTION';row['reason']='Exact hash-bound institution/government saved public-program page has named-program text. Inspect actual saved source scope and safe type before any retrieval selection; no current-public or sponsor-continuity claim.'
            else:row['reason']='No exact successful hash-bound saved institutional receipt and named-program affinity supports independent retrieval preflight.'
        rows.append(row)
    return rows
if __name__=='__main__':
    rows=derive();p=G/'preflight.json';assert not p.exists()
    p.write_text(json.dumps(dict(records=rows,counts=dict(collections.Counter(x['outcome']for x in rows)),meaning='Saved preflight only; candidates cannot execute until independent inspection is recorded. All original facts/identities/current/public/native claims remain held.'),indent=2)+'\n')
    print(json.dumps(dict(targets=len(rows),outcomes=dict(collections.Counter(x['outcome']for x in rows)))))
