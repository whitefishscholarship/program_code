"""Run unchanged local checks; retain every output byte losslessly."""
from pathlib import Path
import datetime
import gzip
import json
import subprocess
from journal import digest

G = Path(__file__).resolve().parent
R = G.parents[2]


def now():
    return datetime.datetime.now(datetime.timezone.utc).isoformat()


if __name__ == '__main__':
    checks = []
    logdir = G / 'checks'
    logdir.mkdir(exist_ok=True)
    jobs = [('synthetic', ['python3', str(G / 'test_journal.py')], R),
            ('reconciliation', ['python3', str(G / 'reconcile.py'), '--check'], R),
            ('plan', ['npm', 'run', 'plan:check'], R / 'web'),
            ('typecheck', ['npm', 'run', 'typecheck'], R / 'web'),
            ('tests', ['npm', 'test'], R / 'web'),
            ('build', ['npm', 'run', 'build'], R / 'web'),
            ('diff', ['git', 'diff', '--check'], R),
            ('complete-diff', ['git', 'diff', '--check',
                              'e2c5ada60cabca9f7cba1c9117b5e2ff016db9ae'], R)]
    for name, cmd, cwd in jobs:
        start = now()
        p = subprocess.run(cmd, cwd=cwd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
        raw = p.stdout
        stored = gzip.compress(raw, mtime=0)
        path = logdir / (name + '.log.gz')
        with path.open('xb') as stream:
            stream.write(stored)
        checks.append(dict(name=name, command=cmd, workingDirectory=str(cwd.relative_to(R)) or '.',
                           startedAt=start, completedAt=now(), exitCode=p.returncode,
                           logPath=str(path.relative_to(R)), logEncoding='gzip',
                           rawSha256=digest(raw), rawBytes=len(raw),
                           storedSha256=digest(stored), storedBytes=len(stored)))
        print(name, p.returncode, flush=True)
    (G / 'validation.json').write_text(json.dumps(dict(checks=checks,
        dependencyInstallAttempts=0, unchangedRequiredCommands=True,
        allRequiredChecksPassed=all(x['exitCode']==0 for x in checks),
        exactBuildGateCleared=next(x['exitCode'] for x in checks if x['name']=='build')==0,
        freshAuthenticatedMainTargetVerified=False), indent=2)+'\n')
