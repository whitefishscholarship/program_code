"""Read-only requested final audit; no source calls, initialization, reset or replay."""
from pathlib import Path
import json,subprocess,hashlib,datetime,os
P=Path(__file__).resolve().parent;R=P.parents[3]
BASE='7bccbadd87e9ea9248c2100f93e02454d35aab7a'
g=lambda *a:subprocess.check_output(['git',*a],cwd=R)
sha=lambda b:hashlib.sha256(b).hexdigest()
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
path='docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md';t=(R/path).read_text();a='<!-- SD2-CHECKPOINT-018-FINAL-AUDIT-START -->\n';z='<!-- SD2-CHECKPOINT-018-FINAL-AUDIT-END -->\n'
assert t.count(a)==t.count(z)==1 and t[:t.index(a)]+t[t.index(z)+len(z):]==g('show',BASE+':'+path).decode()
allowed={str((P/p).relative_to(R)) for p in ['FINAL_SESSION_AUDIT.md','final-session-audit.json','verify-final-session-audit.py','final-audit-plan.json','final-audit-plan.log']}
paths=set(g('diff','--name-only',BASE).decode().splitlines())|set(g('ls-files','--others','--exclude-standard').decode().splitlines())
assert paths<=mutable|allowed,paths-(mutable|allowed)
r=subprocess.run(['python3',str(P/'verify-close.py')],cwd=R,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
assert r.returncode==0,r.stderr.decode();closure=json.loads(r.stdout)
assert closure['outcome']=='PASS' and closure['allReviewedCandidateFilesUnchanged'] and closure['allPriorHandoffSection9BytesPreserved']
assert closure['routeCounts']==dict(identities=360,fields=6561,seeds=611,links=1071) and not closure['pendingReviewerWork']
assert closure['verification']['historicalManifestReviewsVerified']==17 and closure['verification']['M1Records']==437
assert closure['verification']['M1Pins']==12 and closure['verification']['priorCustodyPins']==71 and not closure['verification']['custodyGaps']
doc=(P/'FINAL_SESSION_AUDIT.md').read_text()
assert all(s in doc for s in ['Owner','Trigger','6561','360','611','1071','46','offset360/savedrow366','Hilleman','0accepted','EPERM','AWS','provider','High','before SD3'])
plan=json.loads((P/'final-audit-plan.json').read_text());assert plan['exitCode']==0 and sha((R/plan['logPath']).read_bytes())==plan['logSha256']
g('diff','--check',BASE)
print(json.dumps(dict(outcome='PASS',scope='Requested final session no-loss audit; no new research or acceptance',startedAt=started,completedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),preAuditHandoffCommit=BASE,protectedPreAuditTrackedFiles=protected,allOriginalBindingsAndPacketsPreserved=True,allOpenRoutesOwned=True,closure=closure,planCheck=plan,noNewSourceReads=True,noResetOrReplay=True,fullSD2Complete=False,canonicalAcceptance=False,acceptedFacts=0,externalEffects=False,SD3Started=False,nextCheckpointInputOffset=360,nextInputKey='saved-405588227-row-366',nextInputName='Hilleman Scholars Program',nextOwner='Next-session Codex source/identity reconciliation',nextTrigger='Next session under existing AUTHORITY/POLICY',nextAction='Resume ONE bounded checkpoint;preserve every hold/review binding;never initialize/reset/replay;stop before SD3',recommendedNextEffort='High'),indent=2))
