"""Local saved-evidence comparison tooling. No network, raw/native or original writes."""
from pathlib import Path
import collections,datetime,hashlib,json,os,re,subprocess,sys
C=Path(__file__).resolve().parent;R=C.parents[3];B=C.parent
load=lambda p:json.loads(p.read_text());sha=lambda b:hashlib.sha256(b).hexdigest()
canon=lambda x:json.dumps(x,sort_keys=True,separators=(',',':'),ensure_ascii=False).encode()
git=lambda *a:subprocess.check_output(['git',*a],cwd=R)
def save(p,x):p.write_text(json.dumps(x,indent=2,ensure_ascii=False)+'\n')
def ref(p,pointer=''):return dict(path=str(p.relative_to(R)),sha256=sha(p.read_bytes()),pointer=pointer)
S='existing evidence consistent';U='applicability/identity unresolved';E='evidence unavailable';F='existing evidence conflicting'
MUTABLE={'docs/CURRENT_HANDOFF.md','docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md','docs/evidence/sd2-autonomous/NEXT_SESSION.md'}
def scope():
 a=load(C/'authority.json');assert a['id']=='SD2-SAVED-CONTINUATION-1';assert not any(a[k] for k in ['newSourceOrWorkbookReads','rawNativeReads','externalEffects','SD3Started']);assert a['fieldAndIdentityAcceptance']=='held';p=R/a['scopePath'];assert a['authorized'] and a['automaticInternalReviews'] and not a['perCheckpointHumanApprovalRequired'];assert sha(p.read_bytes())==a['scopeSha256'];s=load(p)
 for key in ['policy','proposalManifest','proposalReview']:
  assert sha((R/a[key+'Path']).read_bytes())==a[key+'Sha256']
 assert (s['inputOccurrences'],s['fieldEnvelopeOccurrences'])==(386,7062)
 return a,s
PROOF={
 'amount':'amount/currency and per-recipient,total,credit,full-part-time,term or duration basis',
 'minimumGPA':'entry GPA lower bound and scale/basis,distinct from maximum or renewal',
 'maximumGPA':'GPA upper bound and scale/basis,distinct from minimum',
 'gpaBasis':'entry GPA scale,equivalence,weighting and cumulative basis,distinct from scoring',
 'schoolType':'institution/accreditation/program whitelist/version,enrollment and credit conditions',
 'residency':'residence/citizenship/status rule,distinct from school or work-event geography',
 'membership':'organization,tenure/deadline,required versus preferred/nonrequired membership',
 'needRequirement':'explicit financial-need eligibility/formula/exceptions,distinct from FAFSA or judging',
 'needPriority':'need selection/ranking/weight,distinct from hard eligibility',
 'renewability':'renewal versus reapplication,total/additional years,full/part-time limits and conditions',
 'renewalGPA':'renewal GPA basis/threshold,distinct from entry',
 'gapYears':'exact applicant stage and gap-year terms without age/education extrapolation',
 'studentStage':'school stage/age/education alternatives and discretionary exceptions',
 'deadline':'exact year,purpose,time,literal timezone and version,distinct from follow-up/membership dates',
 'applicationWindow':'named-child/cycle opening/closing/status continuity,not parent-current inference',
 'cycle':'named-child application/academic-year identity,not publication/observation date',
 'applicationMethod':'exact public submission route/identity/usability without portal interaction',
 'materials':'complete applicable child checklist with conditional counts/word limits,initial-versus-awardee scope',
 'identityContinuity':'exact original child/sponsor/route/cycle relationship and candidate validation',
 'currentOffering':'explicit named-child current-cycle/public/source continuity,not URL response or parent opening',
 'currentParentWindow':'exact parent cycle/status and separate named-child binding',
 'currentParentMaterials':'parent checklist/version and independently established child applicability',
 'currentParentMembershipConflict':'exact parent membership date/operator variants and applicable version;no winner',
 'eligibility':'all exact child eligibility conditions,AND/OR,exceptions,preferences and version scope',
 'recipientSlots':'recipient count/bounds/allocation,not stable award IDs or multiplied totals',
 'applicationLimit':'application-consideration cap/order,not recipient slots or guaranteed awards',
 'sourceNamedAwards':'named child labels and identity relationship,not new stable-ID allocation',
 'disabilityCriterion':'exact program disability definition including self-description and scope;no applicant records',
 'residencyPriority':'geographic preference versus eligibility exclusion',
 'membershipPriority':'membership preference versus hard requirement',
 'trainingUseLimit':'post-award use/disbursement deadline and recipient responsibility,not application deadline',
 'fundingPurpose':'program funding intent versus explicit individual need eligibility',
 'focus':'exact child study/training/career alternatives versus compulsory major',
 'posterMaximum':'maximum cumulative funding versus per-term/per-recipient entitlement',
}
def registry():
 out=[]
 for n in range(1,22):
  p=B/f'checkpoint-{n:03d}.json'
  for i,s in enumerate(load(p)['sourceRegistry']):out.append((p,i,s))
 return out
def bind(ev,row,field,regs,packetpath):
 matches=[(p,i,s) for p,i,s in regs if s.get('sourceId')==ev['sourceId'] and s.get('artifactSha256')==ev['artifactSha256'] and s.get('artifactPath')]
 assert matches,(row['inputKey'],field,'No saved matching source registry')
 preferred=[x for x in matches if x[0]==packetpath] or matches
 if ev.get('artifactPath'):preferred=[x for x in matches if x[2]['artifactPath']==ev['artifactPath']];assert preferred
 path=R/preferred[0][2]['artifactPath'];assert path.is_relative_to(B) and path.suffix in ['.md','.txt','.json'];assert sha(path.read_bytes())==ev['artifactSha256'];text=path.read_text();quote=ev['excerpt'];start=text.find(quote);assert start>=0,(row['inputKey'],field,ev['sourceId'],'exact saved excerpt absent')
 mode='Original exact field excerpt; original scope retained'
 if ev['sourceId']=='wai' and field=='amount':
  marker='### '+row['recordedName'];a=text.index(marker);tail=re.search(r'\n### (?!\()',text[a+len(marker):]);z=a+len(marker)+tail.start() if tail else len(text);start=text.find(quote,a,z);assert start>=0,(row['inputKey'],'amount missing from exact named child section');mode='Exact named child section including value subheading,not same-value sibling occurrence'
 return dict(artifactReference=ref(path),registryReferences=[ref(p,f'/sourceRegistry/{i}') for p,i,s in matches],sourceId=ev['sourceId'],originalEvidenceSha256=sha(canon(ev)),startCharacter=start,endCharacter=start+len(quote),locatorConvention='Zero-based Unicode codepoints in exact saved UTF8 text',bindingMode=mode)
def build(n):
 a,s=scope();G=C/f'checkpoint-{n:03d}';cfg=load(G/'config.json');dec=load(G/'author-decisions.json');group=s['reviewCheckpointGroups'][n-1];selected=s['orderedInputs'][group['startOrder']-1:group['endOrder']]
 assert cfg['group']==n and cfg['scopeGroup']==group and len(dec['records'])==len(selected)
 if (G/'review.json').exists():assert load(G/'review.json')['outcome']!='PASS','Never replay a completed reviewed comparison'
 regs=registry();rows=[];identities=[];sourceviews=[];counts=collections.Counter()
 for item,d in zip(selected,dec['records']):
  p=R/item['packetPath'];packet=load(p);ix=int(item['recordPointer'].split('/')[-1]);row=packet['records'][ix];assert d['savedInputKey']==row['inputKey']==item['savedInputKey'];assert sha(canon(row))==item['recordCanonicalSha256'];assert sha(canon(list(row['fieldProposals'])))==item['orderedFieldNamesSha256']
  route={k:row[k] for k in ['owner','trigger','nextAction','authoritativePath'] if k in row};fields=[];originalref=ref(p,item['recordPointer'])
  for name,env in row['fieldProposals'].items():
   pointer=item['recordPointer']+'/fieldProposals/'+name;refs=[bind(e,row,name,regs,p) for e in env['evidence']]
   if env['state']=='conflict':cat=F;meaning='Preserve existing conflicting values/versions and all evidence;no source winner,union/intersection or silent correction.'
   elif name in d['consistentFields']:
    assert env['state']=='verified' and env['evidence'];cat=S;meaning='Author checked the saved typed value against retained supporting statement in its original limited scope. This is existing-scope consistency,not current truth,complete checklist,identity or fact acceptance.'
   elif env['value'] is None and not env['evidence'] and name not in ['identityContinuity','currentOffering']:
    cat=E;meaning='No supporting evidence is attached to this original field envelope. Preserve null/unknown;this is not full-source silence,false,ineligible or unrestricted.'
   else:cat=U;meaning='Original proposed value/context remains held. Exact child,cycle,version,scope or interpretation applicability remains unresolved;do not promote parent,historical,partial or identity context into a current fact.'
   proof='Applicable original input '+row['inputKey']+': '+PROOF.get(name,'exact field '+name+' wording,qualifiers,basis and applicability')+'. Preserve record semantic boundaries;resolve or retain uncertainty before accepted use. No fetch selected.'
   comparison=dict(category=cat,comparison=meaning,semanticGuard=d['semanticGuard'],minimumAdditionalProof=proof,proposalOnly=True,originalHoldRetained=True,newReadSelected=False)
   if name in d.get('fieldOverrides',{}):comparison.update(d['fieldOverrides'][name])
   counts[comparison['category']]+=1
   contexts=[]
   if (G/'additional-context.json').exists():
    for ci,context in enumerate(load(G/'additional-context.json')['passages']):
     if context['savedInputKey']==row['inputKey'] and context['field']==name:contexts.append(ref(G/'additional-context.json',f'/passages/{ci}'))
   field=dict(field=name,originalReference=ref(p,pointer),originalEnvelopeSha256=sha(canon(env)),originalEnvelope=env,originalExplicitRoute=route,authoritativeReference=originalref,evidenceBindings=refs,additionalContextReferences=contexts,comparison=comparison,nextActionRoute=dict(originalExplicitRoute=route,authoritativeReference=originalref,minimumProofProposal=comparison['minimumAdditionalProof'],newReadSelected=False))
   fields.append(field)
   for ei,binding in enumerate(refs):sourceviews.append(dict(savedInputKey=row['inputKey'],field=name,evidenceIndex=ei,originalEvidenceReference=ref(p,pointer+f'/evidence/{ei}'),binding=binding))
  rows.append(dict(scopeOrder=item['order'],savedInputKey=row['inputKey'],savedRowLocator=row.get('rowLocator'),recordedName=row['recordedName'],publicIdCandidates=row['publicIdCandidates'],originalRecordReference=originalref,originalRecordCanonicalSha256=item['recordCanonicalSha256'],originalIdentityAcceptance=row['identityAcceptance'],originalExplicitRoute=route,semanticGuard=d['semanticGuard'],fields=fields))
  identities.append(dict(savedInputKey=row['inputKey'],publicIdCandidates=row['publicIdCandidates'],identityAcceptance=row['identityAcceptance'],originalReference=originalref,originalIdentityProposal=row.get('identityProposal'),originalExplicitRoute=route,category=U,conclusion=d['semanticGuard'],nextAction='Retain exact original candidate and explicit/inherited identity/source routes;no new ID,merge,deletion or accepted mapping.',acceptedMapping=False,newIdentityAllocated=False))
 priorfields=sum(x['fields'] for x in s['reviewCheckpointGroups'][:n-1]);priorinputs=group['startOrder']-1
 save(G/'comparison.json',dict(schemaVersion=1,group=n,entryCommit=cfg['entryCommit'],authorityReference=ref(C/'authority.json'),scopeReference=ref(R/a['scopePath']),selectedInputs=group['inputs'],fieldOccurrences=group['fields'],records=rows,categoryCounts=dict(counts),continuationComparedInputs=priorinputs+group['inputs'],continuationComparedFields=priorfields+group['fields'],cumulativeComparedFieldOccurrences=406+priorfields+group['fields'],comparedAutonomousInputs=20+priorinputs+group['inputs'],comparedPriorJayceeInputs=2,remainingAutonomousInputs=386-priorinputs-group['inputs'],acceptedFacts=0,acceptedMappings=0,originalFactsChanged=0,newSourceOrWorkbookReads=0,rawNativeReads=0,fullSD2Complete=False,SD3Started=False,externalEffects=False))
 save(G/'identity-assessment.json',dict(records=identities,acceptedMappings=0,newStableIds=0,deletedInputs=0,mergedInputs=0,childAwardsCreated=0))
 save(G/'source-references.json',dict(scope='Derived field/source binding reference view;no new capture or authoritative registry,original source limits remain in exact registry references',occurrences=sourceviews))
 print(json.dumps(dict(group=n,inputs=group['inputs'],fields=group['fields'],categoryCounts=dict(counts),acceptedFacts=0)))
def verify(n,reviewbound=False):
 started=datetime.datetime.now(datetime.timezone.utc).isoformat();a,s=scope();G=C/f'checkpoint-{n:03d}';cfg=load(G/'config.json');entry=cfg['entryCommit'];prefix=str(G.relative_to(R))+'/'
 assert git('branch','--show-current').decode().strip()=='codex/plan-student-data-maintenance'
 protected=0
 for x in git('ls-tree','-rz',entry).split(b'\0'):
  if not x:continue
  meta,path=x.decode().split('\t');mode,kind,blob=meta.split()
  if path in MUTABLE:continue
  p=R/path;raw=os.readlink(p).encode() if mode=='120000' else p.read_bytes();assert hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest()==blob,path
  if mode in ['100644','100755']:assert bool(p.stat().st_mode&0o111)==(mode=='100755'),path
  protected+=1
 for path in MUTABLE:
  raw=(R/path).read_bytes();old=git('show',entry+':'+path)
  if path.endswith('STUDENT_DATA_AND_MAINTENANCE_PLAN.md'):
   start=f'<!-- SD2-CONTINUATION-{n:03d}-START -->\n'.encode();end=f'<!-- SD2-CONTINUATION-{n:03d}-END -->\n'.encode();assert raw.count(start)==raw.count(end)==1;assert raw[:raw.index(start)]+raw[raw.index(end)+len(end):]==old
  else:assert raw.endswith(old),path
 untracked=set(git('ls-files','--others','--exclude-standard').decode().splitlines());assert untracked<={prefix+'final-manifest.json',prefix+'review.json'},untracked
 paths=set(git('diff','--name-only',entry).decode().splitlines())|untracked;rootprefix=str(C.relative_to(R))+'/'
 assert all(p in MUTABLE or p.startswith(rootprefix if n==1 else prefix) for p in paths),paths
 e=load(G/'entry-audit.json');assert e['entryCommit']==entry and e['exitCode']==0 and e['result']['outcome']=='PASS';assert e['stdoutSha256']==sha((json.dumps(e['result'],indent=2)+'\n').encode())
 if n==1:assert e['command']==['python3','docs/evidence/sd2-autonomous/reconciliation-batch-007/verify.py','--review-bound']
 else:assert e['result']['group']==n-1 and e['result']['reviewBound']
 group=s['reviewCheckpointGroups'][n-1];assert cfg['scopeGroup']==group;selected=s['orderedInputs'][group['startOrder']-1:group['endOrder']];data=load(G/'comparison.json');dec=load(G/'author-decisions.json');ids=load(G/'identity-assessment.json');views=load(G/'source-references.json')['occurrences'];regs=registry();counts=collections.Counter();seen=set();expectedviews=[]
 assert data['authorityReference']==ref(C/'authority.json') and data['scopeReference']==ref(R/a['scopePath'])
 assert len(selected)==len(data['records'])==len(dec['records'])==len(ids['records']);assert [r['savedInputKey'] for r in data['records']]==[r['savedInputKey'] for r in selected]
 for item,out,d,identity in zip(selected,data['records'],dec['records'],ids['records']):
  p=R/item['packetPath'];original=load(p)['records'][int(item['recordPointer'].split('/')[-1])];assert sha(canon(original))==item['recordCanonicalSha256'];assert out['originalRecordCanonicalSha256']==item['recordCanonicalSha256'];assert out['savedInputKey']==identity['savedInputKey']==d['savedInputKey']==item['savedInputKey'];assert out['publicIdCandidates']==identity['publicIdCandidates']==original['publicIdCandidates'];assert out['originalIdentityAcceptance']==identity['identityAcceptance']==original['identityAcceptance']=='held';assert not identity['acceptedMapping'] and not identity['newIdentityAllocated'];assert identity['originalIdentityProposal']==original.get('identityProposal')
  route={k:original[k] for k in ['owner','trigger','nextAction','authoritativePath'] if k in original};assert out['originalExplicitRoute']==identity['originalExplicitRoute']==route
  assert [f['field'] for f in out['fields']]==list(original['fieldProposals']);assert out['semanticGuard']==d['semanticGuard']
  for f in out['fields']:
   key=(out['savedInputKey'],f['field']);assert key not in seen;seen.add(key);env=original['fieldProposals'][f['field']];assert f['originalEnvelope']==env and f['originalEnvelopeSha256']==sha(canon(env));assert env['acceptance']=='held';assert f['originalReference']==ref(p,item['recordPointer']+'/fieldProposals/'+f['field']);assert f['originalExplicitRoute']==route==f['nextActionRoute']['originalExplicitRoute'];assert f['comparison']['category'] in [S,U,E,F];counts[f['comparison']['category']]+=1;assert f['comparison']['semanticGuard']==d['semanticGuard'];assert f['comparison']['proposalOnly'];assert f['authoritativeReference']==out['originalRecordReference']==ref(p,item['recordPointer']);assert f['nextActionRoute']['authoritativeReference']==f['authoritativeReference'];expectedCategory=F if env['state']=='conflict' else S if f['field'] in d['consistentFields'] else E if env['value'] is None and not env['evidence'] and f['field'] not in ['identityContinuity','currentOffering'] else U;assert f['comparison']['category']==d.get('fieldOverrides',{}).get(f['field'],{}).get('category',expectedCategory);assert f['comparison']['category']!=S or (env['state']=='verified' and env['evidence']);assert f['nextActionRoute']['minimumProofProposal']==f['comparison']['minimumAdditionalProof'];assert not f['nextActionRoute']['newReadSelected'] and not f['comparison']['newReadSelected'] and f['comparison']['originalHoldRetained']
   assert f['evidenceBindings']==[bind(ev,original,f['field'],regs,p) for ev in env['evidence']]
   for cr in f['additionalContextReferences']:
    assert cr['sha256']==sha((R/cr['path']).read_bytes());context=load(R/cr['path'])['passages'][int(cr['pointer'].split('/')[-1])];assert context['savedInputKey']==out['savedInputKey'] and context['field']==f['field'];cp=R/context['artifactPath'];assert cp.is_relative_to(B) and cp.suffix in ['.md','.txt','.json'] and sha(cp.read_bytes())==context['artifactSha256'];assert cp.read_text()[context['startCharacter']:context['endCharacter']]==context['quote']
   for ei,binding in enumerate(f['evidenceBindings']):expectedviews.append(dict(savedInputKey=out['savedInputKey'],field=f['field'],evidenceIndex=ei,originalEvidenceReference=ref(p,item['recordPointer']+'/fieldProposals/'+f['field']+f'/evidence/{ei}'),binding=binding))
 assert len(data['records'])==len(ids['records'])==len(dec['records'])==group['inputs'];assert len(seen)==group['fields']==data['fieldOccurrences'];assert dict(counts)==data['categoryCounts'];assert views==expectedviews
 continuedfields=sum(g['fields'] for g in s['reviewCheckpointGroups'][:n]);continuedinputs=group['endOrder'];assert data['continuationComparedFields']==continuedfields and data['continuationComparedInputs']==continuedinputs;assert data['cumulativeComparedFieldOccurrences']==406+continuedfields and data['comparedAutonomousInputs']==20+continuedinputs and data['remainingAutonomousInputs']==386-continuedinputs
 previouskeys=set();previousfields=0
 for prior in range(1,n):
  pg=C/f'checkpoint-{prior:03d}';pd=load(pg/'comparison.json');pm=load(pg/'final-manifest.json');pr=load(pg/'review.json');assert pr['outcome']=='PASS' and not any(pr['severityCounts'].values());assert pr['binding']['manifestSha256']==sha((pg/'final-manifest.json').read_bytes());assert pr['binding']['candidateCommit']==pm['candidateCommit'];assert sha(git('diff','--binary',pm['entryCommit'],pm['candidateCommit']))==pm['completeDiffSha256'];pk={x['savedInputKey'] for x in pd['records']};assert not previouskeys&pk;previouskeys|=pk;previousfields+=sum(len(x['fields']) for x in pd['records'])
 assert not previouskeys&{x['savedInputKey'] for x in data['records']};assert previousfields==continuedfields-group['fields'];assert len(previouskeys)==continuedinputs-group['inputs']
 assert not any(data[k] for k in ['acceptedFacts','acceptedMappings','originalFactsChanged','newSourceOrWorkbookReads','rawNativeReads','fullSD2Complete','SD3Started','externalEffects'])
 for ix in range(1,22):
  packet=load(B/f'checkpoint-{ix:03d}.json');assert all(r['identityAcceptance']=='held' and all(f['acceptance']=='held' for f in r['fieldProposals'].values()) for r in packet['records'])
 val=load(C/'validation.json');assert val['requiredChecksRemainUnfulfilled'] and all(v=='BLOCKED_ENVIRONMENT' for v in val['results'].values())
 for check in val['checks']:
  raw=check['rawOutputUtf8'];assert sha(raw.encode())==check['rawLogSha256'] and len(raw.encode())==check['rawLogBytes'];assert load(R/str(Path(check['logPath']).with_suffix('.json')))==check;log=(R/check['logPath']).read_bytes();assert sha(log)==check['logSha256'];assert log.decode()=='\n'.join(l.rstrip() for l in raw.splitlines()).rstrip()+'\n';assert check['exitCode']==127
 if reviewbound:
  m=load(G/'final-manifest.json');rv=load(G/'review.json');assert rv['outcome']=='PASS' and not any(rv['severityCounts'].values());assert rv['binding']['candidateCommit']==m['candidateCommit'] and rv['binding']['manifestSha256']==sha((G/'final-manifest.json').read_bytes());assert git('rev-parse',m['candidateCommit']+'^{tree}').decode().strip()==m['candidateTree'];assert sha(git('diff','--binary',entry,m['candidateCommit']))==m['completeDiffSha256'];assert git('rev-parse','HEAD^').decode().strip()==m['candidateCommit'];assert set(git('diff','--name-only',m['candidateCommit'],'HEAD').decode().splitlines())=={prefix+'final-manifest.json',prefix+'review.json'}
  changed=set(git('diff','--name-only',entry,m['candidateCommit']).decode().splitlines());assert m['entryCommit']==entry;assert len(m['changedFiles'])==len(changed) and {f['path'] for f in m['changedFiles']}==changed
  for f in m['changedFiles']:
   assert sha(git('show',m['candidateCommit']+':'+f['path']))==f['sha256']==sha((R/f['path']).read_bytes());mode=git('ls-tree',m['candidateCommit'],'--',f['path']).decode().split()[0];assert f['mode']==mode;assert bool((R/f['path']).stat().st_mode&0o111)==(mode=='100755')
  assert not git('status','--porcelain').strip()
 git('diff','--check',entry)
 print(json.dumps(dict(outcome='PASS',group=n,reviewBound=reviewbound,startedAt=started,completedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),entryCommit=entry,protectedEntryFiles=protected,allPriorBytesModesHandoffsAndReviewBindingsPreserved=True,selectedInputs=group['inputs'],fieldOccurrences=group['fields'],categoryCounts=dict(counts),continuationComparedInputs=continuedinputs,continuationComparedFields=continuedfields,cumulativeComparedFieldOccurrences=406+continuedfields,comparedAutonomousInputs=20+continuedinputs,remainingAuthorizedInputs=386-continuedinputs,autonomousFieldHolds=7406,autonomousIdentityHolds=406,researchCursor=406,nextResearchInput=None,acceptedFacts=0,acceptedMappings=0,newSourceOrWorkbookReads=0,rawNativeReads=0,fullSD2Complete=False,SD3Started=False,externalEffects=False),indent=2))
if __name__=='__main__':
 action=sys.argv[1];n=int(sys.argv[2]);assert 1<=n<=20
 if action=='build':build(n)
 elif action=='verify':verify(n,'--review-bound' in sys.argv)
 else:raise ValueError(action)
