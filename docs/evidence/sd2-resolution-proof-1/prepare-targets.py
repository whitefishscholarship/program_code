"""Create this selected run's exact, reference-bound triage; no source acquisition."""
from pathlib import Path
import collections,hashlib,json,re,urllib.parse
G=Path(__file__).resolve().parent;R=G.parents[2];P=R/'docs/evidence/sd2-consolidation-package'
sha=lambda b:hashlib.sha256(b).hexdigest()
cache={}
def at(ref):
    path=ref['path'];b=(R/path).read_bytes();assert sha(b)==ref['sha256'],path
    if not ref.get('pointer'):return b
    if path not in cache:cache[path]=json.loads(b)
    x=cache[path]
    for k in ref['pointer'].split('/')[1:]:
        k=k.replace('~1','/').replace('~0','~');x=x[int(k)]if isinstance(x,list)else x[k]
    return x
def derive():
    records=json.loads((P/'decision-ledger.json').read_text())['records'];by={r['savedInputKey']:r for r in records}
    fields={f['savedInputKey']+'#'+f['field']:f for f in map(json.loads,(P/'field-decisions.jsonl').read_text().splitlines())}
    source=json.loads((P/'read-targets.json').read_text());out=[]
    for order,t in enumerate(source['targets'],1):
        urls={at(x)for x in t['locatorReferences']};assert len(urls)==1
        url=next(iter(urls));assert sha(url.encode())==t['exactLocatorSha256']
        f=[fields[k]for k in t['affectedFields']];material=[x for x in f if x['priority']=='eligibility_deadline_or_application_route']
        gaps=[x for x in material if x['existingComparisonCategory']!='existing evidence consistent']
        u=urllib.parse.urlsplit(url);host=(u.hostname or '').lower();native=host in ['docs.google.com','drive.google.com']
        mode='public';reason='Material identity/cycle/eligibility/application-route gaps require exact named-program preflight; all results remain held.'
        if t['proposedReadStatus']=='blocked_locator_only':mode='hold';reason='Original blocked locator retained: '+str(t['blockReason'])
        elif not material:mode='retain';reason='No attached priority material-field proof claim; retain existing complete held route without unnecessary reread.'
        elif not gaps:mode='reuse';reason='All attached priority material fields already have limited-scope consistent saved proof; retain source/freshness/identity limitations.'
        elif u.scheme not in ['http','https']or not host or re.search(r'\s|[<>]',url)or u.username or u.password:mode='hold';reason='Exact recorded locator is malformed/annotated or not safely actionable; do not clean, reconstruct or substitute.'
        elif host in ['form.jotform.com','forms.gle','forms.office.com','app.smarterselect.com','apply.mykaleidoscope.com','apply.mykaleidoscope.org','www.grantinterface.com','www.grantinterface.org']or (host=='docs.google.com'and'/forms/'in u.path)or any(x in u.path.lower()for x in ['/login','/signin','/sign-in','/register','/account/','/apply/']):mode='hold';reason='Application/form/login workflow remains locator-only; no interaction or application access.'
        elif native:
            m=re.search(r'/(?:document|file)/d/([A-Za-z0-9_-]+)',u.path)
            fid=m.group(1)if m else urllib.parse.parse_qs(u.query).get('id',[None])[0]
            if not fid or not re.fullmatch(r'[A-Za-z0-9_-]+',fid)or any(s in u.path for s in ['/folders/','/spreadsheets/','/presentation/']):mode='hold';reason='Native identity/type is outside safe exact blank-document preflight; no traversal or substitution.'
            else:mode='native'
        out.append(dict(order=order,targetId=t['targetId'],targetReference=dict(path=str((P/'read-targets.json').relative_to(R)),sha256=sha((P/'read-targets.json').read_bytes()),pointer='/targets/'+str(order-1)),exactLocator=url,exactLocatorSha256=t['exactLocatorSha256'],host=host,mode=mode,reason=reason,affectedSavedInputs=t['affectedSavedInputs'],names=[by[k]['recordedName']for k in t['affectedSavedInputs']],originalLocatorReferences=t['locatorReferences'],originalAffectedFields=t['affectedFields'],materialProofGaps=[x['savedInputKey']+'#'+x['field']for x in gaps],savedProofReused=[x['existingComparisonReference']for x in material if x['existingComparisonCategory']=='existing evidence consistent'],allOriginalHoldsRetained=True,factsAccepted=0,mappingsAccepted=0))
    return out
if __name__=='__main__':
    out=derive();p=G/'triage.json';assert not p.exists(),'Never replay a saved triage'
    p.write_text(json.dumps(dict(targets=out,counts=dict(collections.Counter(x['mode']for x in out)),originalTargetCount=397,originalBlockedLocators=18,meaning='Selected-run processing only; original proposals and holds unchanged.'),indent=2)+'\n')
    print(json.dumps(dict(targets=len(out),modes=dict(collections.Counter(x['mode']for x in out)),priorityMaterialGaps=sum(len(x['materialProofGaps'])for x in out))))
