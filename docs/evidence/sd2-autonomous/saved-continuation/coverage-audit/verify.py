"""Read-only final union/preservation audit; never builds/replays comparisons."""
from pathlib import Path
import collections,datetime,hashlib,json,os,subprocess,sys
A=Path(__file__).resolve().parent
R=next((p for p in A.parents if (p/'AGENTS.md').exists()),Path('/private/tmp/program_code-student-data-maintenance-plan'))
C=R/'docs/evidence/sd2-autonomous/saved-continuation';B=C.parent
# While prepared outside the checkout, execution is deliberately prohibited.
assert A==C/'coverage-audit','Install only after fresh group020 receipt verification'
load=lambda p:json.loads(p.read_text())
sha=lambda b:hashlib.sha256(b).hexdigest()
canon=lambda x:json.dumps(x,sort_keys=True,separators=(',',':'),ensure_ascii=False).encode()
git=lambda *x:subprocess.check_output(['git',*x],cwd=R)
M={'docs/CURRENT_HANDOFF.md','docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md','docs/evidence/sd2-autonomous/NEXT_SESSION.md'}
cache={};parsed={}
def raw(path):
 p=R/path
 if path not in cache:cache[path]=p.read_bytes()
 return cache[path]
def obj(path):
 if path not in parsed:parsed[path]=json.loads(raw(path))
 return parsed[path]
def reference(ref):
 assert sha(raw(ref['path']))==ref['sha256'],ref['path']
 x=obj(ref['path']) if ref.get('pointer') else None
 for part in ref.get('pointer','').split('/')[1:]:
  part=part.replace('~1','/').replace('~0','~')
  x=x[int(part)] if isinstance(x,list) else x[part]
 return x
def tree(commit):
 out={}
 for item in git('ls-tree','-rz',commit).split(b'\0'):
  if item:
   meta,path=item.decode().split('\t');mode,kind,blob=meta.split();out[path]=(mode,blob)
 return out
def modebytes(path):
 p=R/path
 if p.is_symlink():return '120000',os.readlink(p).encode()
 return ('100755' if p.stat().st_mode&0o111 else '100644'),p.read_bytes()
def preserve(commit,excluded=M):
 count=0
 for path,(mode,blob) in tree(commit).items():
  if path in excluded:continue
  nowmode,b=modebytes(path);assert nowmode==mode,path
  assert hashlib.sha1(b'blob '+str(len(b)).encode()+b'\0'+b).hexdigest()==blob,path
  count+=1
 return count
def manifest_check(folder,entry_tip):
 mp=folder/'final-manifest.json';rp=folder/'review.json';m=load(mp);v=load(rp)
 assert v['outcome']=='PASS' and not any(v['severityCounts'].values())
 bind=v['binding'];assert bind['manifestSha256']==sha(mp.read_bytes())
 for key in ['candidateCommit','candidateTree','completeDiffSha256','completeDiffBytes']:
  assert bind[key]==m[key],(folder.name,key)
 assert git('rev-parse',m['candidateCommit']+'^{tree}').decode().strip()==m['candidateTree']
 diff=git('diff','--binary',m['entryCommit'],m['candidateCommit'])
 assert len(diff)==m['completeDiffBytes'] and sha(diff)==m['completeDiffSha256']
 changed=set(git('diff','--name-only',m['entryCommit'],m['candidateCommit']).decode().splitlines())
 assert len(m['changedFiles'])==len(changed) and {f['path'] for f in m['changedFiles']}==changed
 allowedprefix=str((C if folder.name=='checkpoint-001' else folder).relative_to(R))+'/'
 assert all(p in M or p.startswith(allowedprefix) for p in changed)
 tt=tree(m['candidateCommit'])
 for f in m['changedFiles']:
  b=git('show',m['candidateCommit']+':'+f['path'])
  assert sha(b)==f['sha256'] and len(b)==f['bytes'] and tt[f['path']]==(f['mode'],f['blob'])
 # Locate the immutable direct child on the selected branch history; do not rerun
 # historical worktree verifiers against a wider descendant context.
 candidates=git('rev-list','--ancestry-path',m['candidateCommit']+'..'+entry_tip).decode().splitlines()
 receipts=[]
 for commit in candidates:
  parents=git('rev-list','--parents','-n','1',commit).decode().split()[1:]
  if parents==[m['candidateCommit']]:
   paths=set(git('diff','--name-only',m['candidateCommit'],commit).decode().splitlines())
   expected={str(mp.relative_to(R)),str(rp.relative_to(R))}
   if paths==expected:
    assert git('show',commit+':'+str(mp.relative_to(R)))==mp.read_bytes()
    assert git('show',commit+':'+str(rp.relative_to(R)))==rp.read_bytes()
    receipts.append(commit)
 assert len(receipts)==1,(folder.name,'unique immutable receipt')
 return dict(group=int(folder.name.split('-')[-1]) if folder.name.startswith('checkpoint-') else 'coverage-audit',entryCommit=m['entryCommit'],candidateCommit=m['candidateCommit'],candidateTree=m['candidateTree'],manifestSha256=sha(mp.read_bytes()),reviewSha256=sha(rp.read_bytes()),receiptCommit=receipts[0],changedPaths=len(changed),completeDiffSha256=m['completeDiffSha256'])
def run(review_bound=False):
 started=datetime.datetime.now(datetime.timezone.utc).isoformat();cfg=load(A/'config.json');entry=cfg['entryCommit']
 assert git('branch','--show-current').decode().strip()=='codex/plan-student-data-maintenance'
 authority=load(C/'authority.json');scopepath=R/authority['scopePath'];s=load(scopepath)
 assert authority['authorized'] and authority['automaticInternalReviews'] and not authority['perCheckpointHumanApprovalRequired']
 assert authority['id']==s['id']=='SD2-SAVED-CONTINUATION-1'
 assert sha(scopepath.read_bytes())==authority['scopeSha256']
 for label in ['policy','proposalManifest','proposalReview']:
  assert sha((R/authority[label+'Path']).read_bytes())==authority[label+'Sha256']
 assert not any(authority[k] for k in ['newSourceOrWorkbookReads','rawNativeReads','externalEffects','SD3Started'])
 e=load(A/'entry-audit.json');assert e['entryCommit']==entry and e['exitCode']==0
 assert e['result']['outcome']=='PASS' and e['result']['group']==20 and e['result']['reviewBound']
 assert e['stdoutSha256']==sha((json.dumps(e['result'],indent=2)+'\n').encode())
 assert e['command']==['python3','docs/evidence/sd2-autonomous/saved-continuation/engine.py','verify','20','--review-bound']
 protected=preserve(entry);rootprotected=preserve(authority['entryCommit'])
 for path in M:
  old=git('show',entry+':'+path);now=(R/path).read_bytes()
  if path.endswith('STUDENT_DATA_AND_MAINTENANCE_PLAN.md'):
   a=b'<!-- SD2-CONTINUATION-COVERAGE-AUDIT-START -->\n';z=b'<!-- SD2-CONTINUATION-COVERAGE-AUDIT-END -->\n'
   assert now.count(a)==now.count(z)==1
   assert now[:now.index(a)]+now[now.index(z)+len(z):]==old
  else:assert now.endswith(old),path
 rootprefix=str(A.relative_to(R))+'/'
 changed=set(git('diff','--name-only',entry).decode().splitlines())
 untracked=set(git('ls-files','--others','--exclude-standard').decode().splitlines())
 assert untracked<={rootprefix+'final-manifest.json',rootprefix+'review.json'}
 assert all(p in M or p.startswith(rootprefix) for p in changed|untracked)
 if (A/'final-manifest.json').exists():
  ownm=load(A/'final-manifest.json');assert ownm['entryCommit']==entry
  for f in ownm['changedFiles']:
   currentmode,currentbytes=modebytes(f['path']);assert currentmode==f['mode'] and sha(currentbytes)==f['sha256']
 original=[];bykey={};originalfields=0
 for n in range(1,22):
  path=B/f'checkpoint-{n:03d}.json';p=load(path)
  for r in p['records']:
   key=r['inputKey'];assert key not in bykey;bykey[key]=r;original.append(key)
   assert r['identityAcceptance']=='held'
   assert all(f['acceptance']=='held' for f in r['fieldProposals'].values())
   originalfields+=len(r['fieldProposals'])
 assert len(original)==406 and originalfields==7406
 for pin in s['packetPins']:
  assert sha(raw(pin['path']))==pin['sha256']
  assert sha(canon(obj(pin['path'])['sourceRegistry']))==pin['sourceRegistryCanonicalSha256']
 prior=[];priorpairs=[]
 for folder in [B/'consolidation-pilot-001',*(B/f'reconciliation-batch-{i:03d}' for i in range(2,8))]:
  for r in load(folder/'comparison.json')['records']:
   prior.append(r['savedInputKey']);priorpairs += [(r['savedInputKey'],f['field']) for f in r['fields']]
 assert len(prior)==len(set(prior))==22 and len(priorpairs)==len(set(priorpairs))==406
 priorauto=set(prior)&set(original);jaycee=set(prior)-set(original)
 assert len(priorauto)==20 and len(jaycee)==2
 assert sum(k in jaycee for k,f in priorpairs)==62
 expected=s['orderedInputs'];assert len(expected)==386
 assert len({x['savedInputKey'] for x in expected})==386
 assert set(priorauto).isdisjoint(x['savedInputKey'] for x in expected)
 assert set(priorauto)|{x['savedInputKey'] for x in expected}==set(original)
 allkeys=[];pairs=[];bindingcount=0;counter=collections.Counter();groups=[];views_checked=0
 for n in range(1,21):
  G=C/f'checkpoint-{n:03d}';c=load(G/'config.json');d=load(G/'comparison.json');dec=load(G/'author-decisions.json');ids=load(G/'identity-assessment.json')['records'];views=load(G/'source-references.json')['occurrences']
  identitydata=load(G/'identity-assessment.json')
  assert all(identitydata[k]==0 for k in ['acceptedMappings','newStableIds','deletedInputs','mergedInputs','childAwardsCreated'])
  group=s['reviewCheckpointGroups'][n-1];assert c['scopeGroup']==group
  selection=expected[group['startOrder']-1:group['endOrder']]
  assert len(selection)==len(d['records'])==len(dec['records'])==len(ids)==group['inputs']
  local=collections.Counter();evviews=[]
  for item,r,author,identity in zip(selection,d['records'],dec['records'],ids):
   orig=reference(r['originalRecordReference']);key=item['savedInputKey']
   assert orig==bykey[key] and r['savedInputKey']==author['savedInputKey']==identity['savedInputKey']==key
   assert sha(canon(orig))==item['recordCanonicalSha256']==r['originalRecordCanonicalSha256']
   assert item['packetPath']==r['originalRecordReference']['path'] and item['recordPointer']==r['originalRecordReference']['pointer']
   assert sha(canon(list(orig['fieldProposals'])))==item['orderedFieldNamesSha256']
   assert [f['field'] for f in r['fields']]==list(orig['fieldProposals'])
   assert r['scopeOrder']==item['order'] and r['publicIdCandidates']==identity['publicIdCandidates']==orig['publicIdCandidates']
   assert r['originalIdentityAcceptance']==identity['identityAcceptance']=='held'
   assert not identity['acceptedMapping'] and not identity['newIdentityAllocated']
   assert identity['originalIdentityProposal']==orig.get('identityProposal') and identity['originalReference']==r['originalRecordReference']
   route={k:orig[k] for k in ['owner','trigger','nextAction','authoritativePath'] if k in orig}
   assert route==r['originalExplicitRoute']==identity['originalExplicitRoute']
   assert r['semanticGuard']==author['semanticGuard']==identity['conclusion']
   allkeys.append(key)
   for f in r['fields']:
    name=f['field'];env=orig['fieldProposals'][name];pairs.append((key,name))
    assert reference(f['originalReference'])==env==f['originalEnvelope']
    assert f['originalReference']['pointer']==item['recordPointer']+'/fieldProposals/'+name
    assert f['originalEnvelopeSha256']==sha(canon(env))
    assert f['originalExplicitRoute']==f['nextActionRoute']['originalExplicitRoute']==route
    assert f['authoritativeReference']==f['nextActionRoute']['authoritativeReference']==r['originalRecordReference']
    cmp=f['comparison'];assert cmp['proposalOnly'] and cmp['originalHoldRetained']
    assert not cmp['newReadSelected'] and not f['nextActionRoute']['newReadSelected']
    assert cmp['semanticGuard']==author['semanticGuard'] and f['nextActionRoute']['minimumProofProposal']==cmp['minimumAdditionalProof']
    cat=cmp['category'];assert cat in ['existing evidence consistent','applicability/identity unresolved','evidence unavailable','existing evidence conflicting']
    if env['state']=='conflict':assert cat=='existing evidence conflicting'
    if cat=='existing evidence consistent':assert env['state']=='verified' and env['evidence'] and name in author['consistentFields']
    local[cat]+=1
    assert len(env['evidence'])==len(f['evidenceBindings'])
    for ix,(ev,bind) in enumerate(zip(env['evidence'],f['evidenceBindings'])):
     artifact=bind['artifactReference'];ap=R/artifact['path'];assert ap.is_relative_to(B) and ap.suffix in ['.md','.txt','.json']
     assert sha(raw(artifact['path']))==artifact['sha256']==ev['artifactSha256']
     assert raw(artifact['path']).decode()[bind['startCharacter']:bind['endCharacter']]==ev['excerpt']
     assert bind['originalEvidenceSha256']==sha(canon(ev)) and bind['sourceId']==ev['sourceId']
     assert ev['sourceId'] in orig.get('allowedSourceIds',[ev['sourceId']])
     assert bind['registryReferences']
     for ref in bind['registryReferences']:
      reg=reference(ref);assert reg['sourceId']==ev['sourceId'] and reg['artifactSha256']==artifact['sha256']
     evviews.append(dict(savedInputKey=key,field=name,evidenceIndex=ix,originalEvidenceReference=dict(path=f['originalReference']['path'],sha256=f['originalReference']['sha256'],pointer=f['originalReference']['pointer']+f'/evidence/{ix}'),binding=bind));bindingcount+=1
    for cr in f['additionalContextReferences']:
     context=reference(cr);assert context['savedInputKey']==key and context['field']==name
     ap=R/context['artifactPath'];assert ap.is_relative_to(B) and ap.suffix in ['.md','.txt','.json']
     assert sha(raw(context['artifactPath']))==context['artifactSha256']
     assert raw(context['artifactPath']).decode()[context['startCharacter']:context['endCharacter']]==context['quote']
  assert views==evviews;views_checked+=len(views);assert dict(local)==d['categoryCounts'] and sum(local.values())==group['fields'];counter.update(local)
  assert d['selectedInputs']==group['inputs'] and d['fieldOccurrences']==group['fields']
  assert d['continuationComparedInputs']==group['endOrder'] and d['continuationComparedFields']==sum(g['fields'] for g in s['reviewCheckpointGroups'][:n])
  assert d['cumulativeComparedFieldOccurrences']==406+d['continuationComparedFields'] and d['comparedAutonomousInputs']==20+group['endOrder'] and d['remainingAutonomousInputs']==386-group['endOrder']
  assert not any(d[k] for k in ['acceptedFacts','acceptedMappings','originalFactsChanged','newSourceOrWorkbookReads','rawNativeReads','fullSD2Complete','SD3Started','externalEffects'])
  receipt=manifest_check(G,entry);assert receipt['entryCommit']==c['entryCommit']
  ea=load(G/'entry-audit.json');assert ea['entryCommit']==c['entryCommit'] and ea['exitCode']==0 and ea['result']['outcome']=='PASS'
  assert ea['stdoutSha256']==sha((json.dumps(ea['result'],indent=2)+'\n').encode())
  if n>1:assert ea['result']['group']==n-1 and ea['result']['reviewBound'] and c['entryCommit']==groups[-1]['receiptCommit']
  else:assert c['entryCommit']==authority['entryCommit']
  # Check the historical append boundary at each final candidate itself.
  for path in M:
   old=git('show',c['entryCommit']+':'+path);now=git('show',receipt['candidateCommit']+':'+path)
   if path.endswith('STUDENT_DATA_AND_MAINTENANCE_PLAN.md'):
    a=f'<!-- SD2-CONTINUATION-{n:03d}-START -->\n'.encode();z=f'<!-- SD2-CONTINUATION-{n:03d}-END -->\n'.encode()
    assert now.count(a)==now.count(z)==1
    assert now[:now.index(a)]+now[now.index(z)+len(z):]==old
   else:assert now.endswith(old)
  groups.append(receipt)
 assert groups[-1]['receiptCommit']==entry
 assert allkeys==[x['savedInputKey'] for x in expected] and len(set(allkeys))==386
 expectedpairs=[(x['savedInputKey'],f) for x in expected for f in bykey[x['savedInputKey']]['fieldProposals']]
 assert pairs==expectedpairs and len(pairs)==len(set(pairs))==7062
 assert not set(pairs)&set(priorpairs)
 assert len(set(pairs)|set(priorpairs))==7468
 nextinput=load(C/'checkpoint-020/next-input.json');assert nextinput['nextOriginalInput'] is None and nextinput['inputsRemaining']==nextinput['fieldsRemaining']==0
 val=load(C/'validation.json');assert val['requiredChecksRemainUnfulfilled'] and all(v=='BLOCKED_ENVIRONMENT' for v in val['results'].values())
 checks=load(C/'checkpoint-010/application-checks.json');assert checks['requiredChecksRemainUnfulfilled']
 # Historical accepted/rejected research receipts and every other original file
 # are protected by both entry and original-authority tree blob/mode checks.
 rejected=C/'checkpoint-011';assert (rejected/'review-round1.json').exists() and (rejected/'manifest-round1.json').exists()
 assert load(rejected/'review-round1.json')['outcome']!='PASS'
 git('diff','--check',entry)
 result=dict(schemaVersion=1,outcome='PASS',auditType='Read-only exact saved-continuation union and preservation audit; no comparison replay',startedAt=started,completedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),entryCommit=entry,reviewBound=review_bound,authorizedInputs=386,comparedInputs=len(allkeys),authorizedFieldOccurrences=7062,comparedFieldOccurrences=len(pairs),orderedMembershipSha256=sha(canon(allkeys)),orderedFieldUnionSha256=sha(canon(pairs)),priorComparedInputs=22,priorComparedFieldOccurrences=406,priorAutonomousInputs=20,priorJayceeInputs=2,priorJayceeFieldOccurrences=62,cumulativeAutonomousInputs=406,cumulativeFieldOccurrences=7468,duplicates=0,gaps=0,priorOverlap=0,categoryCounts=dict(counter),evidenceBindings=bindingcount,derivedSourceViewOccurrences=views_checked,protectedAtAuditEntryFiles=protected,protectedAtOriginalAuthorityFiles=rootprotected,independentGroupReviews=20,originalAutonomousFieldHolds=7406,originalAutonomousIdentityHolds=406,allOriginalEnvelopesRoutesReviewBindingsAndModesPreserved=True,threeHistoricalAppendSequencesPreserved=True,reviewReceiptBindings=groups,requiredApplicationChecks='BLOCKED_ENVIRONMENT unchanged127missingtsx/tsc/next; no PASS/install/repair/waiver',acceptedFacts=0,acceptedMappings=0,newSourceOrWorkbookReads=0,rawNativeReads=0,fullSD2Complete=False,canonicalAcceptance=False,SD3Started=False,externalEffects=False)
 stored=load(A/'verification.json')
 if stored.get('outcome')=='PASS':
  skipped={'startedAt','completedAt','reviewBound'}
  assert {k:v for k,v in stored.items() if k not in skipped}=={k:v for k,v in result.items() if k not in skipped}
 if review_bound:
  m=load(A/'final-manifest.json');rv=load(A/'review.json');assert m['entryCommit']==entry;own=manifest_check(A,git('rev-parse','HEAD').decode().strip());assert rv['outcome']=='PASS' and not any(rv['severityCounts'].values())
  assert rv['binding']['manifestSha256']==sha((A/'final-manifest.json').read_bytes()) and rv['binding']['candidateCommit']==m['candidateCommit']
  assert git('rev-parse','HEAD^').decode().strip()==m['candidateCommit']
  assert set(git('diff','--name-only',m['candidateCommit'],'HEAD').decode().splitlines())=={rootprefix+'final-manifest.json',rootprefix+'review.json'}
  assert not git('status','--porcelain').strip()
 print(json.dumps(result,indent=2))
if __name__=='__main__':run('--review-bound' in sys.argv)
