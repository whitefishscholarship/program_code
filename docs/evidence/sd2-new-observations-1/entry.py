"""Metadata-only freshness receipt producer. No scholarship source requests."""
from pathlib import Path
import importlib.util
import subprocess
import json
import os
import sys
spec=importlib.util.spec_from_file_location('adapter',Path(__file__).with_name('adapter.py'))
a=importlib.util.module_from_spec(spec);spec.loader.exec_module(a)

def refresh(directory):
    directory=Path(directory);directory.mkdir(mode=0o700) # new exclusive receipt directory; preserve old receipts
    subprocess.run(['git','fetch','origin','main'],cwd=a.REPO,check=True)
    main=a.git('rev-parse','origin/main').decode().strip()
    remote=a.git('ls-remote','origin','refs/heads/main').decode().split()[0]
    a.j.require(main==remote,'main moved')
    cmd=['vercel','--global-config','/private/tmp/whitefish-vercel-auth-zn6gmpor','--scope','team_6CAjRq58n0WvAH49otKSQbA7','api','/v9/projects/prj_LbefE2deji6nPND6iBiuofe7IABv?teamId=team_6CAjRq58n0WvAH49otKSQbA7','--method','GET']
    env=os.environ.copy();env.pop('VERCEL_TOKEN',None);env['CI']='1'
    project=json.loads(subprocess.check_output(cmd,env=env,stderr=subprocess.DEVNULL,timeout=30))
    production=project['targets']['production']
    observed=a.now()
    github={'repository':'whitefishscholarship/program_code','mainCommit':main,'remoteCommit':remote,'observedAt':observed,'command':['git','ls-remote','origin','refs/heads/main']}
    provider={'id':project['id'],'accountId':project['accountId'],'rootDirectory':project['rootDirectory'],'repoId':project['link']['repoId'],'deploymentId':production['id'],'readyState':production['readyState'],'commit':production['meta']['githubCommitSha'],'alias':production['alias'],'observedAt':observed}
    refs=[]
    for name,kind,value in [('github.json','github-main',github),('vercel.json','vercel-production',provider)]:
        a.j.exclusive(directory/name,value);refs.append({'file':name,'kind':kind,'sha256':a.sha(a.j.read(directory/name))})
    f={'observedAt':observed,'mainCommit':main,'controlPinsSha256':a.control_pins(),'projectId':provider['id'],'teamId':provider['accountId'],'hostname':'web-two-gules-45.vercel.app','productionCommit':provider['commit'],'authenticatedReceipts':refs}
    a.j.exclusive(directory/'freshness.json',f)
    a.gates(directory/'freshness.json')
    return directory/'freshness.json'

if __name__=='__main__':
    a.j.require(len(sys.argv)==2,'one new metadata receipt directory required')
    print(refresh(sys.argv[1]))
