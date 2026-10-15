"""Record one selected check in checkpoint009; never replace an existing receipt."""
from pathlib import Path
import subprocess,sys,datetime,json,hashlib
P=Path(__file__).resolve().parent;ROOT=P.parents[3]
label=sys.argv[1];command=sys.argv[2:];receipt=P/(label+'.json');log=P/(label+'.log')
assert command and not receipt.exists() and not log.exists(),'Existing receipt/log will not be replaced'
start=datetime.datetime.now(datetime.timezone.utc).isoformat()
r=subprocess.run(command,cwd=ROOT/'web',stdout=subprocess.PIPE,stderr=subprocess.STDOUT)
end=datetime.datetime.now(datetime.timezone.utc).isoformat();raw=r.stdout
text='\n'.join(x.rstrip() for x in raw.decode(errors='replace').splitlines()).strip()+'\n';log.write_text(text)
x={'command':command,'cwd':'web','startedAt':start,'completedAt':end,'exitCode':r.returncode,'logPath':str(log.relative_to(ROOT)),'originalOutputSha256':hashlib.sha256(raw).hexdigest(),'logSha256':hashlib.sha256(log.read_bytes()).hexdigest(),'logNormalization':'Leading/trailing blank lines and trailing line whitespace normalized only; substantive output/command/exit/timestamps unchanged'}
receipt.write_text(json.dumps(x,indent=2)+'\n');print(json.dumps(x));print(text[-1800:]);sys.exit(r.returncode)
