"""Unchanged local application checks for this documentation-only wrap."""
from pathlib import Path
import datetime, gzip, hashlib, json, subprocess
G=Path(__file__).resolve().parent
R=G.parents[2]
sha=lambda b:hashlib.sha256(b).hexdigest()
now=lambda:datetime.datetime.now(datetime.timezone.utc).isoformat()
if __name__=='__main__':
    logs=G/'checks';logs.mkdir(exist_ok=True);checks=[]
    for name,cmd,cwd in [('plan',['npm','run','plan:check'],R/'web'),
                         ('typecheck',['npm','run','typecheck'],R/'web'),
                         ('tests',['npm','test'],R/'web'),
                         ('build',['npm','run','build'],R/'web'),
                         ('diff',['git','diff','--check'],R),
                         ('entry-diff',['git','diff','--check',json.loads((G/'entry-audit.json').read_text())['entryCommit']],R)]:
        started=now();p=subprocess.run(cmd,cwd=cwd,stdout=subprocess.PIPE,stderr=subprocess.STDOUT)
        raw=p.stdout;stored=gzip.compress(raw,mtime=0);path=logs/(name+'.log.gz')
        with path.open('xb')as stream:stream.write(stored)
        checks.append(dict(name=name,command=cmd,workingDirectory=str(cwd.relative_to(R))or'.',startedAt=started,completedAt=now(),exitCode=p.returncode,logPath=str(path.relative_to(R)),rawSha256=sha(raw),rawBytes=len(raw),storedSha256=sha(stored),storedBytes=len(stored),encoding='gzip'))
        print(name,p.returncode,flush=True)
    (G/'validation.json').write_text(json.dumps(dict(checks=checks,dependencyInstallAttempts=0,sourceRequests=0,requiredBuildGateRemainsOpen=next(x['exitCode']for x in checks if x['name']=='build')!=0,freshAuthenticatedMainTargetVerified=False),indent=2)+'\n')
