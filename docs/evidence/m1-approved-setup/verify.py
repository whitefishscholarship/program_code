from pathlib import Path
import subprocess,json,hashlib
p=Path(__file__).resolve().parent;r=p.parents[2]
def git(*args):return subprocess.check_output(['git',*args],cwd=r)
def sha(b):return hashlib.sha256(b).hexdigest()
a=json.loads((p/'authority.json').read_text());base=a['baselineCommit'];pins=json.loads((p/'preservation.json').read_text())
for f in pins['protectedFiles']:assert sha((r/f['path']).read_bytes())==f['sha256'],f['path']
inv=json.loads((r/'docs/evidence/season-monitor-m1/inventory.json').read_text());assert len(inv['records'])==437
assert len(json.loads((r/'docs/evidence/season-monitor-m1/setup.json').read_text())['proposedM3Sample'])==12
s=json.loads((r/'docs/BUILD_STATE.json').read_text());old=json.loads(git('show',base+':docs/BUILD_STATE.json'))
y=json.loads(json.dumps(s));assert y.pop('m1Setup')['M2Started'] is False;y['planRevision']=old['planRevision'];y['lastUpdated']=old['lastUpdated'];y['governance']['planAmendments']=[x for x in y['governance']['planAmendments'] if x['id']!='PLAN-REV23'];assert y==old
cfg=r/'web/vercel.json'
if cfg.exists():assert json.loads(cfg.read_text())=={'$schema':'https://openapi.vercel.sh/vercel.json','git':{'deploymentEnabled':{'codex/scholarship-monitor-state':False}}}
changed=git('diff','--name-only',base,'HEAD','--','web','.github').decode().splitlines();assert set(changed)<= {'web/vercel.json'},changed
assert not git('diff','HEAD','--','web','.github'), 'Uncommitted active changes must be checkpointed before final verifier'
rows=json.loads((p/'github-provisioning.json').read_text());env=next(x['observed'] for x in reversed(rows) if isinstance(x['observed'],dict) and x['observed'].get('name')=='scholarship-season-monitor' and 'protection_rules' in x['observed']);assert env['can_admins_bypass'] is False
review=next(x for x in env['protection_rules'] if x['type']=='required_reviewers');assert review['prevent_self_review'] is False and [x['reviewer']['id'] for x in review['reviewers']]==[266880911]
pol=next(x['observed'] for x in reversed(rows) if isinstance(x['observed'],dict) and 'branch_policies' in x['observed']);assert pol['total_count']==1 and pol['branch_policies'][0]['name']=='main' and pol['branch_policies'][0]['type']=='branch'
v=next(x['observed'] for x in reversed(rows) if isinstance(x['observed'],dict) and 'variables' in x['observed']);assert {a['name']:a['value'] for a in v['variables']}=={'SCHOLARSHIP_MONITOR_ALERT_FROM':'Whitefish Scholarships <scholarships@mail.waypointfranchise.com>','SCHOLARSHIP_MONITOR_ALERT_TO':'kelsey@waypointfranchise.com','SCHOLARSHIP_MONITOR_ENABLED':'false','SCHOLARSHIP_MONITOR_EMAIL_ENABLED':'false'}
if (p/'build.json').exists():
 b=json.loads((p/'build.json').read_text());assert b['command']=='npm run build' and b['exitCode']==0 and sha((r/b['logPath']).read_bytes())==b['logSha256']
 for f in b['pins']:assert sha((r/f['path']).read_bytes())==f['sha256'],f['path']
subprocess.run(['git','diff','--check'],cwd=r,check=True)
print('PASS: approved scope,437routes12pins, original protected snapshots and exact env/config controls; no M2/source/send/activation authorization. Build verified only when actual bound receipt exists.')
