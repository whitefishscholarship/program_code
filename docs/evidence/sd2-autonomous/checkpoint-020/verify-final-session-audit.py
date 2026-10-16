"""Read-only requested final no-loss audit; no research, reset, replay or writes."""
from pathlib import Path
import json,subprocess,hashlib,datetime,os
P=Path(__file__).resolve().parent;R=P.parents[3];B=P.parent
BASE='71b16f3b92485fac8852d00a6cc5fa84d2ce04cc'
g=lambda *a:subprocess.check_output(['git',*a],cwd=R)
load=lambda p:json.loads(p.read_text());sha=lambda b:hashlib.sha256(b).hexdigest()
started=datetime.datetime.now(datetime.timezone.utc).isoformat()
mutable={'docs/CURRENT_HANDOFF.md','docs/evidence/sd2-autonomous/NEXT_SESSION.md','docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md'}
protected=0
for line in g('ls-tree','-r',BASE).decode().splitlines():
 meta,path=line.split('\t');mode,typ,blob=meta.split()
 if path in mutable:continue
 f=R/path;raw=os.readlink(f).encode() if mode=='120000' else f.read_bytes()
 assert hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest()==blob,path
 if mode in ['100644','100755']:assert bool(f.stat().st_mode&0o111)==(mode=='100755'),path
 protected+=1
for path in mutable-{'docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md'}:assert (R/path).read_bytes().endswith(g('show',BASE+':'+path))
path='docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md';t=(R/path).read_text();a='<!-- SD2-CHECKPOINT-020-FINAL-AUDIT-START -->\n';z='<!-- SD2-CHECKPOINT-020-FINAL-AUDIT-END -->\n'
assert t.count(a)==t.count(z)==1 and t[:t.index(a)]+t[t.index(z)+len(z):]==g('show',BASE+':'+path).decode()
allowed={str((P/p).relative_to(R)) for p in ['FINAL_SESSION_AUDIT.md','final-session-audit.json','verify-final-session-audit.py','final-audit-plan.json','final-audit-plan.log']}
paths=set(g('diff','--name-only',BASE).decode().splitlines())|set(g('ls-files','--others','--exclude-standard').decode().splitlines())
assert paths<=mutable|allowed,paths-(mutable|allowed)
r=subprocess.run(['python3',str(P/'verify-close.py')],cwd=R,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
assert r.returncode==0,r.stderr.decode();closure=json.loads(r.stdout)
assert closure['outcome']=='PASS' and closure['allReviewedCandidateFilesUnchanged'] and closure['allPriorHandoffSection9BytesPreserved']
assert closure['routeCounts']==dict(identities=400,fields=7284,seeds=668,links=1116) and not closure['pendingReviewerWork']
assert closure['verification']['historicalManifestReviewsVerified']==19 and closure['verification']['M1Records']==437
assert closure['verification']['M1Pins']==12 and closure['verification']['priorCustodyPins']==71 and not closure['verification']['custodyGaps']
doc=(P/'FINAL_SESSION_AUDIT.md').read_text()
assert all(s in doc for s in ['Owner','Trigger','7284','400','668','1116','six unprocessed','500','offset400/savedrow407','MCSPADDEN','0accepted','EPERM','provider','High','before SD3'])
fallback=dict(trigger='Applicable authorized evidence arrival or SD2 consolidation after initial remaining-queue coverage',nextAction='Reconcile exact saved source/identity/status/extraction/link limitations before permitted follow-up; preserve original source-specific dispositions and every held uncertainty; no new read or reconstruction implied.',authoritativePath=str((P/'FINAL_SESSION_AUDIT.md').relative_to(R)))
sources=identities=0;inherited=[]
for i in range(1,21):
 packet=load(B/f'checkpoint-{i:03d}.json')
 for row in packet['records']:
  identities+=1;assert row['identityAcceptance']=='held' and all(row.get(k) for k in ['owner','trigger','nextAction'])
 for s in packet['sourceRegistry']:
  sources+=1;assert s.get('owner')
  absent=[k for k in ['trigger','nextAction'] if not s.get(k)]
  if absent:
   assert i in [1,2] and absent==['trigger','nextAction']
   inherited.append(dict(packetPath=str((B/f'checkpoint-{i:03d}.json').relative_to(R)),sourceId=s['sourceId'],owner=s['owner'],**fallback))
assert identities==400 and sources==357 and len(inherited)==35
converted=unclosed=0
for p in sorted(B.glob('checkpoint-*/conversion-link-dispositions.json')):
 for s in load(p)['sources']:
  assert s['convertedDestinationCount']==len(s['destinations'])
  for d in s['destinations']:
   converted+=1;unclosed+=not d['closed'];assert all(d.get(k) for k in ['owner','trigger','nextAction'])
assert converted==500 and unclosed==1
plan=load(P/'final-audit-plan.json');assert plan['exitCode']==0 and sha((R/plan['logPath']).read_bytes())==plan['logSha256']
g('diff','--check',BASE)
print(json.dumps(dict(outcome='PASS',scope='Requested final session no-loss audit; no new research or acceptance',startedAt=started,completedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),preAuditHandoffCommit=BASE,protectedPreAuditTrackedFiles=protected,allOriginalBindingsAndPacketsPreserved=True,allOpenRoutesOwned=True,sourceReceipts=sources,historicalSourcesWithInheritedRoutes=inherited,convertedDestinationRoutes=converted,unclosedConvertedDestinations=unclosed,closure=closure,planCheck=plan,noNewSourceReads=True,noResetOrReplay=True,fullSD2Complete=False,canonicalAcceptance=False,acceptedFacts=0,externalEffects=False,SD3Started=False,nextCheckpointInputOffset=400,nextInputKey='saved-405588227-row-407',nextInputName='THE RICHARD MCSPADDEN SCHOLARSHIP FOR ADVANCED PILOT TRAINING',nextOwner='Next-session Codex source/identity reconciliation',nextTrigger='Next session under existing AUTHORITY/POLICY',nextAction='Resume ONE bounded checkpoint;preserve every hold/review binding;never initialize/reset/replay;stop before SD3',recommendedNextEffort='High'),indent=2))
