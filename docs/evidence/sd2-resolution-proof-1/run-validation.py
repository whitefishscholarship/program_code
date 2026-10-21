"""Run only selected pinned restore and unchanged checks; never repair source files."""
import datetime,hashlib,json,os,subprocess,sys
from pathlib import Path
G=Path(__file__).resolve().parent;R=G.parents[2]
P=json.loads((R/'docs/evidence/sd2-consolidation-package/PROPOSED_VALIDATION_REPAIR.json').read_text())
def pins():
    for x in P['pins']:
        assert hashlib.sha256((R/x['path']).read_bytes()).hexdigest()==x['sha256'],x['path']
def now():return datetime.datetime.now(datetime.timezone.utc).isoformat()
def run(label,cmd):
    pins();out=G/'validation';out.mkdir(exist_ok=True);record=out/(label+'.json')
    assert not record.exists(), 'Never replay a recorded validation attempt'
    log=out/(label+'.log');assert not log.exists()
    env=os.environ.copy();env['npm_config_cache']='/private/tmp/sd2-locked-validation-1-npm-cache'
    start=now()
    with log.open('xb')as f:
        p=subprocess.run(cmd,cwd=R/'web',env=env,stdout=f,stderr=subprocess.STDOUT)
    b=log.read_bytes();x=dict(command=cmd,workingDirectory='web',startedAt=start,completedAt=now(),exitCode=p.returncode,rawLogPath=str(log.relative_to(R)),rawLogBytes=len(b),rawLogSha256=hashlib.sha256(b).hexdigest(),result='PASS'if p.returncode==0 else 'FAIL_REMAINS_GATE')
    record.write_text(json.dumps(x,indent=2)+'\n');pins();print(json.dumps(x),flush=True)
    return x
if __name__=='__main__':
    if sys.argv[1:] == ['restore']:
        run('restore',P['proposedRestoreCommand'])
    elif sys.argv[1:] == ['checks']:
        restore=json.loads((G/'validation/restore.json').read_text())
        assert restore['exitCode']==0,'Install failed; do not silently retry or substitute dependencies'
        results=[run(n,c)for n,c in zip(['plan','typecheck','tests','build'],P['requiredCommands'])]
        (G/'validation/summary.json').write_text(json.dumps(dict(checks=results,allRequiredChecksPassed=all(x['exitCode']==0 for x in results),environmentRepairExecuted=True,dependencyInstallAttempts=1,lifecycleScriptsExecuted=False,pins=P['pins']),indent=2)+'\n')
    else:raise SystemExit('Expected restore or checks')
