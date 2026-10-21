"""One exact retained-evidence repair; never reads sources or replays queue."""
from pathlib import Path
import json,hashlib,datetime,urllib.parse,itertools
P=Path(__file__).resolve().parent;B=P.parent;R=P.parents[3]
load=lambda p:json.loads(p.read_text());sha=lambda b:hashlib.sha256(b).hexdigest()
def write(p,x):p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
assert not (P/'remediation.json').exists(),'Never repeat repair'
l=load(B/'checkpoint-016.json');meta=load(P/'capture-metadata.json')['nativeMetadata']
metaPath='docs/evidence/sd2-autonomous/checkpoint-016/capture-metadata.json'
def attach_metadata(r):
 f=r['fieldProposals']['identityObservation'];v=f['value']; n=r['rowLocator']
 selected={316:{'parkfile':['name']},317:{'wcea':['mimeType'],'wceaslide':['mimeType'],'wceafile':['name']},318:{'betaalias':['name']}}[n]
 f['metadataEvidence']=[]
 for id,props in selected.items():
  i=next(i for i,m in enumerate(meta) if m['sourceId']==id);m=meta[i]
  f['metadataEvidence'].append(dict(artifactPath=metaPath,artifactSha256=sha((R/metaPath).read_bytes()),sourceId=id,sourceFileId=m['fileId'],entryPointer=f'/nativeMetadata/{i}',propertyPointers=[f'/nativeMetadata/{i}/{p}' for p in props],observedProperties={p:m[p] for p in props},observedAt=m['callCompletedAt'],scope='Exact native metadata observation only; not readable program facts or public/sponsor/current identity acceptance.'))
 if n==317:
  v['primaryMime']=next(m['mimeType'] for m in meta if m['sourceId']=='wcea');v['slideAliasMime']=next(m['mimeType'] for m in meta if m['sourceId']=='wceaslide')
 if n==318:v['oldAliasTitle']=next(m['name'] for m in meta if m['sourceId']=='betaalias')
 f['semanticAssertion']='Typed held observation: '+json.dumps(v,ensure_ascii=False,separators=(',',':'))
for r in l['records']:
 if r['rowLocator'] in [316,317,318]:attach_metadata(r)
 if r['rowLocator']==310:
  f=r['fieldProposals']['amount'];f['value']['PHSAndDLSWaiversDecreaseRelativeToPLS']=True
  f['semanticAssertion']='Typed held observation: '+json.dumps(f['value'],ensure_ascii=False,separators=(',',':'))
overlaps=[]
pub=[s for s in l['sourceRegistry'] if s['provider']=='Firecrawl connector']
for a,b in itertools.combinations(pub,2):
 host=urllib.parse.urlsplit(a['originalUrl']).hostname
 if host==urllib.parse.urlsplit(b['originalUrl']).hostname and max(a['callStartedAt'],b['callStartedAt'])<min(a['callCompletedAt'],b['callCompletedAt']):
  overlaps.append(dict(host=host,sourceIds=[a['sourceId'],b['sourceId']],firstInterval=[a['callStartedAt'],a['callCompletedAt']],secondInterval=[b['callStartedAt'],b['callCompletedAt']],policyCompliant=False,owner='Codex source execution and evidence/governance owners',trigger='Before every subsequent source dispatch; before later authorized evidence/history/canonical/publication review',nextAction='Serialize by normalized hostname: never dispatch two active source calls to the same host; at most four distinct-host calls globally. Preserve historical overlap and assess handling; do not reread or rewrite timestamps.'))
assert len(overlaps)==1 and set(overlaps[0]['sourceIds'])=={'naeinstructions','naefaq'}
audit=dict(rule='At most four independent public source reads; one per host at a time',publicIntervalsChecked=len(pub),historicalOverlaps=overlaps,historicalCompliance=False,originalTimestampsUnchanged=True,newSourceReads=0,prospectiveRule='Before dispatch compute normalized host; dispatch only when that host has no active read; await each previous same-host request. Retain up-to-four global cap.',owner='Codex source execution and evidence/governance owners',trigger='Before every subsequent source dispatch',nextAction='Use frozen POLICY host serialization, minimize/sanitize output, preserve and report historical overlap without reacquisition.')
write(P/'concurrency-audit.json',audit)
l['sourcePolicyDeviations'].append('Historical one-per-host violation: naeinstructions and naefaq overlapped on naehcy.org. concurrency-audit.json retains exact unchanged intervals and owned prospective host serialization; no rereads or compliance relabeling.')
l['sourcePolicyDeviations'].append('Next-input queue preview printed an unnecessary query-bearing source locator without dereference. Values excluded from new handoff/artifacts; historical output handling remains disclosed and owned.')
write(B/'checkpoint-016.json',l)
rev=load(P/'review-round1.json'); dispositions=[]
for f in rev['findings']:
 dispositions.append(dict(id=f['id'],originalSeverity='medium',status='author-remediated-pending-independent-recheck',rationale={'SD2-016-M1':'Five exact metadata entry/property/file/hash/time bindings distinguish metadata from readable content; all holds preserved.','SD2-016-M2':'The shared PHS/DLS reduction assertion is true in every DHC tier; only contradictory row310 boolean and its assertion corrected.','SD2-016-M3':'Exact timestamp overlap remains a historical policy violation; new overlap audit/disclosure and prospective host serialization resolve unrecorded handling, not historical noncompliance. Query-preview lapse also disclosed without values.'}[f['id']],owner=f['owner'],trigger=f['trigger'],target=f['target']))
write(P/'remediation.json',dict(priorCandidateCommit=rev['binding']['candidateCommit'],priorManifestSha256=sha((P/'manifest-round1.json').read_bytes()),priorReviewSha256=sha((P/'review-round1.json').read_bytes()),dispositions=dispositions,newSourceReads=0,fieldCountsAndHoldsUnchanged=True,canonicalAcceptance=False,SD3Started=False))
print('Repaired metadata bindings and PLS comparison; recorded one historical overlap. No new reads.')
