"""Read-only final no-loss audit; no queue initialization, source access or replay."""
from pathlib import Path
import json,subprocess,hashlib,datetime,collections
P=Path(__file__).resolve().parent;R=P.parents[3];B=P.parent
BASE='400c7858bdbb932e3d414a7f3a5d509201bd20ee'
load=lambda p:json.loads(p.read_text())
def git(*a):return subprocess.check_output(['git',*a],cwd=R)
start=datetime.datetime.now(datetime.timezone.utc).isoformat()
result=json.loads(subprocess.check_output(['python3',str(P/'verify-close.py')],cwd=R))
counts=collections.Counter();ledgerCount=0
def complete(x):return all(x.get(k) for k in ['owner','trigger','nextAction'])
for i in range(1,17):
 l=load(B/f'checkpoint-{i:03d}.json');ledgerCount+=1
 for r in l['records']:
  assert complete(r),(i,r['inputKey']);counts['processedRecordsWithExplicitRoute']+=1
  for f in r['fieldProposals'].values():
   counts['fieldOwnRoute' if complete(f) else 'fieldInheritedRecordRoute']+=1
   assert f.get('acceptance')!='accepted'
  for d in r.get('seedDispositions',[]):
   assert complete(d) or complete(r)
   counts['seedOwnRoute' if complete(d) else 'seedInheritedRecordRoute']+=1
 for s in l['sourceRegistry']:
  for d in s.get('linkDispositions',[]):
   assert complete(d) or complete(s),(i,s['sourceId'])
   counts['linkOwnRoute' if complete(d) else 'linkInheritedSourceRoute']+=1
assert counts==dict(processedRecordsWithExplicitRoute=320,fieldOwnRoute=4061,fieldInheritedRecordRoute=1886,seedOwnRoute=492,seedInheritedRecordRoute=32,linkOwnRoute=971,linkInheritedSourceRoute=22),counts
review=load(P/'review.json');rem=load(P/'remediation.json')
assert review['severityCounts']==dict(critical=0,high=0,medium=0,low=0)
assert [d['id'] for d in review['dispositionsRechecked']]==[d['id'] for d in rem['dispositions']]
assert all(d['result'] in ['fixed','disclosure and prospective prevention corrected'] for d in review['dispositionsRechecked'])
mutable={'docs/CURRENT_HANDOFF.md','docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md','docs/evidence/sd2-autonomous/NEXT_SESSION.md'}
new={'docs/evidence/sd2-autonomous/checkpoint-016/'+n for n in ['FINAL_SESSION_AUDIT.md','verify-final-session-audit.py','final-session-audit.json']}
changed=set(git('diff','--name-only',BASE).decode().splitlines())|set(git('ls-files','--others','--exclude-standard').decode().splitlines())
assert changed<=mutable|new,changed
for line in git('ls-tree','-r',BASE).decode().splitlines():
 meta,path=line.split('\t');mode,typ,blob=meta.split()
 if path in mutable:continue
 assert (R/path).read_bytes()==git('show',BASE+':'+path),path
for path in mutable-{'docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md'}:
 assert (R/path).read_bytes().endswith(git('show',BASE+':'+path))
path='docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md';t=(R/path).read_text();a='<!-- SD2-CHECKPOINT-016-FINAL-AUDIT-START -->\n';z='<!-- SD2-CHECKPOINT-016-FINAL-AUDIT-END -->\n'
assert t.count(a)==t.count(z)==1
assert t[:t.index(a)]+t[t.index(z)+len(z):]==git('show',BASE+':'+path).decode()
note=(P/'FINAL_SESSION_AUDIT.md').read_text()
assert all(x in note for x in ['offset320/savedrow326','5947','86','1886','32 older seed','22 older','owner','trigger','SD3','one overlapping','unverified'])
for path in list(changed):
 if path.endswith('.md') or path.endswith('.json') or path.endswith('.py'):
  text=(R/path).read_text();assert all(x==x.rstrip() for x in text.splitlines()) and text.endswith('\n'),path
git('diff','--check',BASE);git('diff','--check','65a5434288d458e6cfcd99dac6e6485a75c53cb7')
result.update(startedAt=start,recordedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),scope='Requested final session no-loss audit; original goal complete within local held-research limits',closureBaseline=BASE,command='python3 docs/evidence/sd2-autonomous/checkpoint-016/verify-final-session-audit.py',routingCounts=dict(counts),ledgersAudited=ledgerCount,allPreClosureArtifactsUnchanged=True,originalReviewPendingMarkers='Historical pre-review states; all3 independently rechecked in final review.json',newResearchOrReplay=False,unverifiedGates='FINAL_SESSION_AUDIT.md important limits and owned-trigger table',pendingReviewerWork=False,recommendedNextSessionEffort='High')
print(json.dumps(result,indent=2))
