"""Run one authorized local verification command and preserve its exact result."""
import datetime,json,subprocess,sys
from pathlib import Path
P=Path(__file__).resolve().parent
root=P.parents[2]
name=sys.argv[1];command=sys.argv[2:]
receipt={'command':command,'cwd':str(root/'web'),'startedAt':datetime.datetime.now(datetime.timezone.utc).isoformat()}
r=subprocess.run(command,cwd=root/'web',capture_output=True,text=True)
receipt.update(endedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),exitCode=r.returncode,stdout=r.stdout,stderr=r.stderr)
(P/(name+'.json')).write_text(json.dumps(receipt,indent=2)+'\n')
print(json.dumps({'check':name,'exitCode':r.returncode,'outputTail':(r.stdout+r.stderr)[-1500:]}))
sys.exit(r.returncode)
