from pathlib import Path
import subprocess,json,hashlib,datetime,gzip
G=Path(__file__).resolve().parent;R=G.parents[2];(G/'checks').mkdir(exist_ok=True)
assert not(G/'validation.json').exists(),'No repeated validation batch'
rows=[]
for name,cmd in [('plan',['npm','run','plan:check']),('typecheck',['npm','run','typecheck']),('tests',['npm','test']),('build',['npm','run','build'])]:
 start=datetime.datetime.now(datetime.timezone.utc).isoformat();r=subprocess.run(cmd,cwd=R/'web',capture_output=True);log=r.stdout+r.stderr;p=G/'checks'/(name+'.log.gz');stored=gzip.compress(log,mtime=0);p.write_bytes(stored)
 rows.append(dict(command=cmd,workingDirectory='web',startedAt=start,completedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),exitCode=r.returncode,logPath=str(p.relative_to(R)),logSha256=hashlib.sha256(log).hexdigest(),logBytes=len(log),logEncoding='gzip',storedSha256=hashlib.sha256(stored).hexdigest(),storedBytes=len(stored)))
 print(json.dumps(dict(check=name,exitCode=r.returncode)),flush=True)
(G/'validation.json').write_text(json.dumps(dict(checks=rows,context='Exact unchanged required commands in permitted local execution context; no install or workaround.',requiredBuildGateRemainsOpen=rows[-1]['exitCode']!=0,dependencyInstallAttemptsDuringWrap=0,allRequiredChecksPassed=all(x['exitCode']==0 for x in rows)),indent=2)+'\n')
