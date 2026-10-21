from pathlib import Path
import subprocess,json,hashlib
p=Path(__file__).resolve().parent;r=p.parents[2]
def git(*a):return subprocess.check_output(['git',*a],cwd=r)
def b(c,f):return git('show',c+':'+f)
def sha(v):return hashlib.sha256(v).hexdigest()
s=json.loads((p/'contract.json').read_text());x=json.loads((p/'preservation.json').read_text());prior=x['priorReceipt'];rev=x['sourceCheckpoint'];base=s['baselineCommit']
for f in x['files']:assert sha(b(f['commit'],f['path']))==f['sha256'],f['path']
for c,root in [(prior,'docs/evidence/season-monitor-m1-public-resend'),('a2757ac19dc263cf0a7698cf46150aaeeb909ded','docs/evidence/season-monitor-m1-refresh')]:
 m=json.loads(b(c,root+'/manifest.json'));v=json.loads(b(c,root+'/review.json'));assert sha(b(c,root+'/manifest.json'))==v['manifestSha256']
 for f in m['files']:assert sha(b(m['candidateCommit'],f['path']))==f['sha256']
for root in ['docs/evidence/season-monitor-m1','docs/evidence/season-monitor-plan']:
 m=json.loads(b(rev,root+'/manifest.json'));v=json.loads(b(rev,root+'/review.json'));assert sha(b(rev,root+'/manifest.json'))==v['manifestSha256']
 for f in m['completeChangeSet']:assert sha(b(m['candidateCommit'],f['path']))==f['sha256']
inv=json.loads(b(rev,'docs/evidence/season-monitor-m1/inventory.json'));assert len(inv['records'])==437
assert len(json.loads(b(rev,'docs/evidence/season-monitor-m1/setup.json'))['proposedM3Sample'])==12
for pin in inv['inputPins']:assert sha(b(rev,pin['path']))==pin['sha256']
assert s['mode']=='PROPOSAL_ONLY_UNAPPLIED' and not any(t['selected'] for t in s['reviewSelections'])
for k in ['M1Complete','M2Started','monitoringActivated']:assert s[k] is False
for k in ['sourceCalls','emailSends','externalMutations']:assert s[k]==0
assert s['sender']['to']==['kelsey@waypointfranchise.com']
assert s['resendKey']['permission']=='sending_access' and s['resendKey']['domain']=='mail.waypointfranchise.com'
assert not s['resendKey']['created'] and not s['resendKey']['reuseExistingFullAccessKey'] and not s['resendKey']['secretValueIncluded']
assert not s['githubEnvironment']['created'] and not s['githubEnvironment']['secretStored'] and not s['githubEnvironment']['workflowAdded']
assert s['githubEnvironment']['selectedBranchRules']==[{'type':'branch','name':'main'}] and not s['githubEnvironment']['tagRules']
assert s['githubEnvironment']['variables']['SCHOLARSHIP_MONITOR_ENABLED']=='false' and s['githubEnvironment']['variables']['SCHOLARSHIP_MONITOR_EMAIL_ENABLED']=='false'
cfg=json.loads((p/'proposed/web-vercel.json').read_text());assert cfg==s['deploymentSuppression']['effectiveConfig'];assert cfg['git']['deploymentEnabled']=={'codex/scholarship-monitor-state':False}
patch=(p/'proposed/deployment-suppression.patch').read_text();added='\n'.join(l[1:] for l in patch.splitlines() if l.startswith('+') and not l.startswith('+++'))+'\n';assert added==(p/'proposed/web-vercel.json').read_text()
assert not (r/'web/vercel.json').exists() and not (r/'web/vercel.ts').exists()
subprocess.run(['git','apply','--check',str(p/'proposed/deployment-suppression.patch')],cwd=r,check=True)
plan=(r/'docs/SCHOLARSHIP_SEASON_MONITOR_PLAN.md').read_text();suffix=plan[plan.index('# Current M1 public-repository setup continuation'):]
assert suffix.replace(x['currentTrackerRow'],x['priorTrackerRow'])==b(prior,'docs/SCHOLARSHIP_SEASON_MONITOR_PLAN.md').decode()
assert (r/'docs/CURRENT_HANDOFF.md').read_bytes().endswith(b(prior,'docs/CURRENT_HANDOFF.md'))
for f in ['docs/BUILD_STATE.json','docs/SCHOLARSHIP_SYSTEM_BUILD_PLAN.md']:assert (r/f).read_bytes()==b(base,f)
assert git('rev-parse','HEAD:web')==git('rev-parse',base+':web');assert not git('diff','HEAD','--','web','.github')
if (p/'main-observation.json').exists():assert json.loads((p/'main-observation.json').read_text())['result']['sha']==base
if (p/'manifest.json').exists():
 m=json.loads((p/'manifest.json').read_text());assert m['baselineCommit']==base
 assert sha(git('diff','--binary',base,m['candidateCommit']))==m['completeDiffSha256']
 assert sorted(git('diff','--name-only',base,m['candidateCommit']).decode().splitlines())==sorted(f['path'] for f in m['files'])
 for f in m['files']:assert sha((r/f['path']).read_bytes())==f['sha256']
 if (p/'review.json').exists():
  v=json.loads((p/'review.json').read_text());assert v['manifestSha256']==sha((p/'manifest.json').read_bytes()) and v['candidateCommit']==m['candidateCommit'] and v['outcome']=='PASS'
subprocess.run(['git','diff','--check'],cwd=r,check=True)
print('PASS: exact inactive proposal, patch check, prior review bindings,437routes/12pins and unchanged active runtime/state. No application, release, send, source check or activation.')
