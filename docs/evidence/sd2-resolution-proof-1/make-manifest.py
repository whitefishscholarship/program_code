"""Bind the frozen complete local candidate. No source/review/history mutation."""
import hashlib,json,subprocess
from pathlib import Path
G=Path(__file__).resolve().parent;R=G.parents[2];ENTRY='0336d32b930a87d458414611184ab546b00df047'
git=lambda *a:subprocess.check_output(['git',*a],cwd=R)
sha=lambda b:hashlib.sha256(b).hexdigest()
assert not(G/'final-manifest.json').exists(),'Do not rebind an existing manifest'
assert not git('status','--porcelain').strip(),'Freeze the whole candidate before manifestation'
candidate=git('rev-parse','HEAD').decode().strip();diff=git('diff','--binary',ENTRY,candidate);files=[]
for path in git('diff','--name-only',ENTRY,candidate).decode().splitlines():
    b=git('show',candidate+':'+path);mode=git('ls-tree',candidate,path).decode().split()[0]
    files.append(dict(path=path,mode=mode,bytes=len(b),sha256=sha(b)))
m=dict(schemaVersion=1,scope='Forensic failed SD2 execution and containment only; NOT an acceptance receipt',executionOutcome='FAIL',entryCommit=ENTRY,candidateCommit=candidate,candidateTree=git('rev-parse',candidate+'^{tree}').decode().strip(),completeDiffSha256=sha(diff),completeDiffBytes=len(diff),changedFiles=files,allPriorHoldsApprovalsRoutesAndReviewBindingsPreserved=True,acceptedFacts=0,acceptedMappings=0,fullSD2Complete=False,SD3Started=False)
(G/'final-manifest.json').write_text(json.dumps(m,indent=2)+'\n')
print(json.dumps(dict(candidateCommit=candidate,changedFiles=len(files),manifestSha256=sha((G/'final-manifest.json').read_bytes()))))
