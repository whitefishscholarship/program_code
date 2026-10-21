import subprocess,datetime,json,hashlib
from pathlib import Path
root=Path(__file__).resolve().parents[3];out=root/'docs/evidence/m1-approved-setup';log=out/'build.log'
if not (root/'web/vercel.json').exists():raise SystemExit('Stop: approved config not yet installed; wait for Codex build-ready message.')
tracked=subprocess.check_output(['git','ls-files','-z','web'],cwd=root).decode().split('\0');pins=[]
for f in sorted(set(x for x in tracked if x)|{'web/vercel.json'}):
 p=root/f
 if p.is_file():pins.append({'path':f,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
start=datetime.datetime.now(datetime.timezone.utc).isoformat()
with log.open('w') as handle:
 proc=subprocess.run(['npm','run','build'],cwd=root/'web',stdout=handle,stderr=subprocess.STDOUT)
receipt={'command':'npm run build','cwd':str(root/'web'),'executionContext':'User-operated existing Mac Terminal, supported process/port context','startedAt':start,'completedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'exitCode':proc.returncode,'logPath':'docs/evidence/m1-approved-setup/build.log','logSha256':hashlib.sha256(log.read_bytes()).hexdigest(),'pins':pins}
(out/'build.json').write_text(json.dumps(receipt,indent=2)+'\n');print(log.read_text());print('Exact build exit:',proc.returncode)
