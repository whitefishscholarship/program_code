from pathlib import Path
import hashlib,json,subprocess
p=Path(__file__).resolve().parent;r=p.parents[2]
def sha(b):return hashlib.sha256(b).hexdigest()
x=json.loads((p/'evidence-index.json').read_text())
for f in x['files']:assert sha((p/f['savedPath']).read_bytes())==f['sha256'],f['savedPath']
o=json.loads((p/'open-items.json').read_text());q=o['inheritedReference'];assert sha((r/q['path']).read_bytes())==q['sha256'];assert json.loads((r/q['path']).read_text())==o['inherited']
for f in ['docs/evidence/PLAN-REV22-manifest.json','docs/reviews/PLAN-REV22.json','docs/evidence/sd2-held-research-closure/manifest.json','docs/evidence/sd2-held-research-closure/review.json','docs/BUILD_STATE.json','docs/SCHOLARSHIP_SYSTEM_BUILD_PLAN.md']:
 assert (r/f).read_bytes()==subprocess.check_output(['git','show',x['deliveredMain']+':'+f],cwd=r),f
old=subprocess.check_output(['git','show',x['deliveredMain']+':docs/CURRENT_HANDOFF.md'],cwd=r);assert (r/'docs/CURRENT_HANDOFF.md').read_bytes().endswith(old)
subprocess.run(['git','merge-base','--is-ancestor',x['deliveredMain'],'HEAD'],cwd=r,check=True)
subprocess.run(['git','diff','--check'],cwd=r,check=True)
print('PASS: saved receipts, inherited routes, historical attestations, canonical state and handoff continuity verified. No fresh external observation claimed.')
