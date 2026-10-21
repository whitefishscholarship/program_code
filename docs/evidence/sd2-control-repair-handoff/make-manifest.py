"""Bind immutable handoff-only candidate; never rebind previous manifests."""
from pathlib import Path
import hashlib,json,subprocess
G=Path(__file__).resolve().parent;R=G.parents[2];ENTRY='03362252704c0032ae13befc015b7376de54056b'
git=lambda *a:subprocess.check_output(['git',*a],cwd=R)
sha=lambda b:hashlib.sha256(b).hexdigest()
assert not(G/'manifest.json').exists()and not git('status','--porcelain').strip()
c=git('rev-parse','HEAD').decode().strip();diff=git('diff','--binary',ENTRY,c);files=[]
for path in git('diff','--name-only',ENTRY,c).decode().splitlines():
 b=git('show',c+':'+path);files.append(dict(path=path,mode=git('ls-tree',c,path).decode().split()[0],sha256=sha(b),bytes=len(b)))
m=dict(scope='Fresh-session handoff integrity only; original source execution remains FAIL',entryCommit=ENTRY,candidateCommit=c,candidateTree=git('rev-parse',c+'^{tree}').decode().strip(),completeDiffSha256=sha(diff),completeDiffBytes=len(diff),changedFiles=files,sourceExecutionStatus='FAIL',canonicalAcceptance=False,acceptedFacts=0,acceptedMappings=0,SD3Started=False)
(G/'manifest.json').write_text(json.dumps(m,indent=2)+'\n');print(json.dumps(dict(candidateCommit=c,manifestSha256=sha((G/'manifest.json').read_bytes()),changedFiles=len(files))))
