"""Audit this run's original tool-call metadata only; never inspect/reuse page prose."""
import collections,datetime,hashlib,json,re,urllib.parse
from pathlib import Path
G=Path(__file__).resolve().parent;S=Path('/Users/kelseystuart/.codex/sessions/2026/10/20/rollout-2026-10-20T11-26-59-01a15a5a-258b-7e20-8e62-55b1084f890d.jsonl')
sha=lambda b:hashlib.sha256(b).hexdigest()
iso=lambda s:datetime.datetime.fromisoformat(s.replace('Z','+00:00'))
def derive():
    sel=json.loads((G/'selection.json').read_text());ts=json.loads((G/'triage.json').read_text())['targets'];byurl={x['exactLocator']:x for x in ts};byid=collections.defaultdict(list)
    for t in ts:
        if t['mode']!='native':continue
        u=urllib.parse.urlsplit(t['exactLocator']);m=re.search(r'/(?:document|file)/d/([A-Za-z0-9_-]+)',u.path);fid=m.group(1)if m else urllib.parse.parse_qs(u.query).get('id',[None])[0]
        if fid:byid[fid].append(t)
    events=[json.loads(s)for s in S.read_text().splitlines()];bounds={}
    for e in events:
        q=e.get('payload',{});inp=q.get('input',q.get('arguments',''))
        if q.get('name')=='exec'and isinstance(inp,str):
            if 'let remaining=[...pool],batchResults=[]'in inp:bounds.setdefault('cell51Start',e['timestamp'])
            if 'largeBatchProcessed:processed,of:100'in inp:bounds.setdefault('cell86Start',e['timestamp'])
        if q.get('name')=='wait'and isinstance(inp,str):
            try:a=json.loads(inp)
            except ValueError:continue
            if a.get('terminate')and a.get('cell_id')in['51','86']:bounds.setdefault('cell'+a['cell_id']+'Terminated',e['timestamp'])
    assert all(k in bounds for k in ['cell51Start','cell51Terminated','cell86Start','cell86Terminated']),bounds
    rows=[]
    for line,e in enumerate(events,1):
        q=e.get('payload',{});it=q.get('item',{})
        if q.get('type')!='item_completed'or not isinstance(it,dict)or'tool'not in it or iso(e['timestamp'])<iso(sel['recordedAt']):continue
        tool=str(it['tool'])
        if tool not in ['firecrawl.firecrawl_scrape','google_drive.get_file_metadata','google_drive.fetch']:continue
        a=it.get('arguments',{});a=json.loads(a)if isinstance(a,str)else a;u=a.get('url');matches=[byurl[u]]if u in byurl else byid.get(a.get('fileId'),[])
        start=q.get('started_at_ms');end=q.get('completed_at_ms');phase='other_selected_calls';dt=datetime.datetime.fromtimestamp(start/1000,datetime.timezone.utc)if start else None
        for tag in ['cell51','cell86']:
            if dt and iso(bounds[tag+'Start'])<=dt<=iso(bounds[tag+'Terminated']):phase=tag
        rows.append(dict(traceLine=line,toolItemId=it.get('id'),tool=tool,matchedTargetIds=[x['targetId']for x in matches],matchedTargetOrders=[x['order']for x in matches],argumentLocatorSha256=sha(u.encode())if isinstance(u,str)else None,nativeFileIdSha256=sha(a['fileId'].encode())if a.get('fileId')else None,host=urllib.parse.urlsplit(u).hostname if u else'google-native-connector',startedAtMs=start,completedAtMs=end,eventTimestamp=e['timestamp'],status=it.get('status'),phase=phase,rawProviderBodyNotInspectedForFacts=True))
    assert len({x['toolItemId']for x in rows})==len(rows)
    grouped=collections.defaultdict(list)
    for x in rows:
        if x['tool']=='firecrawl.firecrawl_scrape'and len(x['matchedTargetIds'])==1:grouped[x['matchedTargetIds'][0]].append(x)
    repeats=[dict(targetId=k,order=v[0]['matchedTargetOrders'][0],callCount=len(v),toolItemIds=[x['toolItemId']for x in v],reason='Same frozen public locator dispatched in interrupted cell51 and later cell86; no temporary transport retry basis retained.')for k,v in grouped.items()if any(x['phase']=='cell51'for x in v)and any(x['phase']=='cell86'for x in v)]
    points=[]
    for x in rows:
        if x['startedAtMs']is not None and x['completedAtMs']is not None:points.extend([(x['startedAtMs'],1),(x['completedAtMs'],-1)])
    active=maximum=0
    for _,delta in sorted(points):active+=delta;maximum=max(maximum,active)
    return dict(schemaVersion=1,scope='Current selected-run tool-call metadata only; no page prose/facts reacquired or inspected',traceSource=str(S),phaseBounds=bounds,records=rows,exactCompletedToolCallRecords=len(rows),toolCounts=dict(collections.Counter(x['tool']for x in rows)),phaseCounts=dict(collections.Counter(x['phase']for x in rows)),ambiguousNativeAssignments=sum(len(x['matchedTargetIds'])!=1 for x in rows),confirmedRepeatedPublicTargets=repeats,maximumObservedExplicitToolCallConcurrency=maximum,underlyingHttpRequests='UNMEASURED',doesNotProveNoUnloggedInFlightDispatch=True,sourceExecutionAcceptance=False,allOriginalHoldsRetained=True,acceptedFacts=0,acceptedMappings=0)
if __name__=='__main__':
    d=derive();(G/'source-call-audit.json').write_text(json.dumps(d,indent=2)+'\n')
    print(json.dumps(dict(toolRecords=d['exactCompletedToolCallRecords'],repeatedOrders=[x['order']for x in d['confirmedRepeatedPublicTargets']],phaseCounts=d['phaseCounts'],maximumExplicitConcurrency=d['maximumObservedExplicitToolCallConcurrency'],ambiguousNativeAssignments=d['ambiguousNativeAssignments'])))
