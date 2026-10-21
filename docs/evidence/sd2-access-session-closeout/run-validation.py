"""Run only the unchanged required local matrix; preserve actual output losslessly."""
from pathlib import Path
import datetime
import gzip
import hashlib
import json
import subprocess

G = Path(__file__).resolve().parent
R = G.parents[2]
ENTRY = '49a978544ee158b0cc87841e0d94c30c53aa0596'
now = lambda: datetime.datetime.now(datetime.timezone.utc).isoformat()
sha = lambda b: hashlib.sha256(b).hexdigest()
assert not (G / 'validation.json').exists()
(G / 'checks').mkdir(exist_ok=False)
checks = []
commands = [
    ('plan', ['npm', 'run', 'plan:check'], 'web'),
    ('typecheck', ['npm', 'run', 'typecheck'], 'web'),
    ('tests', ['npm', 'test'], 'web'),
    ('build', ['npm', 'run', 'build'], 'web'),
    ('diff', ['git', 'diff', '--check'], '.'),
    ('entry-diff', ['git', 'diff', '--check', ENTRY], '.'),
]
for name, command, directory in commands:
    started = now()
    p = subprocess.run(command, cwd=R / directory, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    completed = now()
    stored = gzip.compress(p.stdout, mtime=0)
    path = G / 'checks' / (name + '.log.gz')
    with path.open('xb') as stream:
        stream.write(stored)
    checks.append(dict(name=name, command=command, workingDirectory=directory,
                       startedAt=started, completedAt=completed, exitCode=p.returncode,
                       logPath=str(path.relative_to(R)), rawSha256=sha(p.stdout),
                       rawBytes=len(p.stdout), storedSha256=sha(stored),
                       storedBytes=len(stored), encoding='gzip'))
    print(json.dumps(dict(check=name, exitCode=p.returncode, bytes=len(p.stdout))), flush=True)
value = dict(checks=checks, dependencyInstallAttempts=0, sourceRequests=0,
             workbookRequests=0, requiredBuildGateRemainsOpen=checks[3]['exitCode'] != 0,
             freshAuthenticatedMainTargetVerified=True)
with (G / 'validation.json').open('x') as stream:
    stream.write(json.dumps(value, indent=2) + '\n')
