"""Read-only final audit of all open routes; never process/replay source inputs."""
from pathlib import Path
import json,hashlib,subprocess,datetime,os
P=Path(__file__).resolve().parent;B=P.parent;R=P.parents[3]
BASE='2f7a903346f99f8a32af8e6ee6b014c70e0b9004'
sha=lambda b:hashlib.sha256(b).hexdigest()
load=lambda p:json.loads(p.read_text())
def git(*a):return subprocess.check_output(['git',*a],cwd=R)
start=datetime.datetime.now(datetime.timezone.utc).isoformat()
run=subprocess.run(['python3',str(P/'verify-close.py')],cwd=R,capture_output=True,text=True)
assert run.returncode==0,run.stderr
closure=json.loads(run.stdout);assert closure['missingRouteProperties']==[]
assert closure['allFourReviewerFindingsFixedAndIndependentlyRechecked']
assert closure['routeCounts']['fields']==6253 and closure['routeCounts']['identities']==340 and closure['routeCounts']['seeds']==562 and closure['routeCounts']['links']==1020
check=load(P/'final-audit-plan.json');assert check['command']==['npm','run','plan:check'] and check['exitCode']==0
assert sha((R/check['logPath']).read_bytes())==check['logSha256']
mutable={'docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md','docs/CURRENT_HANDOFF.md','docs/evidence/sd2-autonomous/NEXT_SESSION.md'}
new={str((P/n).relative_to(R)) for n in ['FINAL_SESSION_AUDIT.md','verify-final-session-audit.py','final-session-audit.json','final-audit-plan.json','final-audit-plan.log']}
changed=set(git('diff','--name-only',BASE).decode().splitlines())|set(git('ls-files','--others','--exclude-standard').decode().splitlines())
assert changed<=mutable|new,changed
protected=0
for line in git('ls-tree','-r',BASE).decode().splitlines():
 meta,path=line.split('\t');mode,typ,blob=meta.split()
 if path in mutable:continue
 f=R/path;raw=os.readlink(f).encode() if mode=='120000' else f.read_bytes()
 assert hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest()==blob,path
 if mode in ['100644','100755']:assert bool(f.stat().st_mode&0o111)==(mode=='100755'),path
 protected+=1
pp='docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md';t=(R/pp).read_text();old=git('show',BASE+':'+pp).decode();a='<!-- SD2-CHECKPOINT-017-FINAL-AUDIT-START -->\n';z='<!-- SD2-CHECKPOINT-017-FINAL-AUDIT-END -->\n'
assert t.count(a)==t.count(z)==1 and t[:t.index(a)]+t[t.index(z)+len(z):]==old
for p in mutable-{pp}:assert (R/p).read_bytes().endswith(git('show',BASE+':'+p))
doc=(P/'FINAL_SESSION_AUDIT.md').read_text();assert all(x in doc for x in ['owner','Trigger','6253','340','562','1020','437','71','offset340/savedrow346','SD3','EPERM'])
for p in new:
 f=R/p
 if f.exists():
  text=f.read_text();assert text.endswith('\n') and all(x==x.rstrip() for x in text.splitlines()),p
git('diff','--check',BASE)
print(json.dumps(dict(outcome='PASS',scope='Requested final session no-loss audit; no new research or acceptance',startedAt=start,completedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),preAuditHandoffCommit=BASE,protectedPreAuditTrackedFiles=protected,allOriginalBindingsAndPacketsPreserved=True,allOpenRoutesOwned=True,closure=closure,planCheck=check,noNewSourceReads=True,noResetOrReplay=True,fullSD2Complete=False,canonicalAcceptance=False,acceptedFacts=0,externalEffects=False,SD3Started=False,nextCheckpointInputOffset=340,nextInputKey='saved-405588227-row-346',nextInputName='Welder Training Scholarship',nextOwner='Next-session Codex source/identity reconciliation',nextTrigger='Next session under existing AUTHORITY/POLICY',nextAction='Resume one bounded checkpoint; preserve every hold/review binding; stop before SD3',recommendedNextEffort='High'),indent=2))
