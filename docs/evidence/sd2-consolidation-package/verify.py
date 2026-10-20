"""Read-only package validation; never executes research, installs or old verifiers."""
from pathlib import Path
import collections,csv,datetime,hashlib,io,json,os,subprocess,sys
G=Path(__file__).resolve().parent;R=G.parents[2];M={'docs/CURRENT_HANDOFF.md','docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md','docs/evidence/sd2-autonomous/NEXT_SESSION.md'}
sha=lambda b:hashlib.sha256(b).hexdigest()
canon=lambda x:json.dumps(x,sort_keys=True,separators=(',',':'),ensure_ascii=False).encode()
git=lambda *a:subprocess.check_output(['git',*a],cwd=R)
load=lambda p:json.loads(p.read_text())
cache={};objects={};hashes={}
def bytesat(path):
 if path not in cache:cache[path]=(R/path).read_bytes()
 return cache[path]
def at(ref):
 path=ref['path']
 if path not in hashes:hashes[path]=sha(bytesat(path))
 assert hashes[path]==ref['sha256'],path
 if not ref.get('pointer'):return bytesat(path)
 if ref['path'] not in objects:objects[ref['path']]=json.loads(bytesat(ref['path']))
 x=objects[ref['path']]
 for k in ref.get('pointer','').split('/')[1:]:
  k=k.replace('~1','/').replace('~0','~');x=x[int(k)] if isinstance(x,list) else x[k]
 return x
def working(path):
 p=R/path
 return ('120000',os.readlink(p).encode()) if p.is_symlink() else ('100755'if p.stat().st_mode&0o111 else '100644',p.read_bytes())
def verify(bound=False):
 start=datetime.datetime.now(datetime.timezone.utc).isoformat();a=load(G/'authority.json');entry=a['entryCommit'];prefix=str(G.relative_to(R))+'/'
 assert git('branch','--show-current').decode().strip()=='codex/plan-student-data-maintenance'
 assert a['id']=='SD2-CONSOLIDATION-PACKAGE-1' and a['authorized'] and a['localPreparation'] and a['automaticIndependentPackageReview']
 assert not any(a[k]for k in ['newSourceOrWorkbookReads','rawNativeReads','environmentRepairExecuted','acceptedFacts','acceptedMappings','canonicalAcceptance','remoteGit','externalEffects','SD3Started'])
 e=load(G/'entry-audit.json');assert e['entryCommit']==entry and e['exitCode']==0 and e['result']['outcome']=='PASS' and e['result']['reviewBound']
 assert e['command']==['python3','docs/evidence/sd2-autonomous/saved-continuation/coverage-audit/verify.py','--review-bound']
 assert e['stdoutSha256']==sha((json.dumps(e['result'],indent=2)+'\n').encode())
 previous=R/'docs/evidence/sd2-autonomous/saved-continuation/coverage-audit';pm=load(previous/'final-manifest.json');pr=load(previous/'review.json')
 assert pr['outcome']=='PASS' and not any(pr['severityCounts'].values()) and pr['binding']['manifestSha256']==sha((previous/'final-manifest.json').read_bytes())
 assert git('rev-parse',entry+'^').decode().strip()==pm['candidateCommit']
 assert set(git('diff','--name-only',pm['candidateCommit'],entry).decode().splitlines())=={str((previous/n).relative_to(R))for n in ['final-manifest.json','review.json']}
 protected=0
 for item in git('ls-tree','-rz',entry).split(b'\0'):
  if not item:continue
  meta,path=item.decode().split('\t');mode,kind,blob=meta.split()
  if path in M:continue
  wm,b=working(path);assert wm==mode and hashlib.sha1(b'blob '+str(len(b)).encode()+b'\0'+b).hexdigest()==blob,path;protected+=1
 for path in M:
  old=git('show',entry+':'+path);now=(R/path).read_bytes()
  if path.endswith('STUDENT_DATA_AND_MAINTENANCE_PLAN.md'):
   s=b'<!-- SD2-CONSOLIDATION-PACKAGE-START -->\n';z=b'<!-- SD2-CONSOLIDATION-PACKAGE-END -->\n';assert now.count(s)==now.count(z)==1
   assert now[:now.index(s)]+now[now.index(z)+len(z):]==old
  else:assert now.endswith(old),path
 untracked=set(git('ls-files','--others','--exclude-standard').decode().splitlines());assert untracked<={prefix+'final-manifest.json',prefix+'review.json'}
 paths=set(git('diff','--name-only',entry).decode().splitlines())|untracked;assert all(p in M or p.startswith(prefix)for p in paths)
 # Pure in-memory reconstruction of this new derived report, not a build/replay of
 # any completed research/comparison, with independent reference checks below.
 ns={'__file__':str(G/'build-package.py'),'__name__':'sd2_package_readonly_derivation'};exec(compile((G/'build-package.py').read_text(),str(G/'build-package.py'),'exec'),ns);expected=ns['derive']()
 s=load(G/'summary.json');records=load(G/'decision-ledger.json')['records'];fields=[json.loads(x)for x in (G/'field-decisions.jsonl').read_text().splitlines()];app=load(G/'publication-crosswalk.json')['records'];inventory=load(G/'inventory-dispositions.json')['records'];targets=load(G/'read-targets.json')['targets']
 assert s==expected['summary'] and records==expected['records'] and fields==expected['fields'] and app==expected['publication'] and inventory==expected['inventory'] and targets==expected['targets']
 assert len(records)==411 and len(fields)==7547 and len(app)==411 and len(inventory)==794
 seen=set();comparisons=set();records_by={x['savedInputKey']:x for x in records}
 for r in records:
  orig=at(r['originalRecordReference']);inv=at(r['inventoryReference']);assert sha(canon(orig))==r['originalRecordCanonicalSha256'] and r['savedRowLocator']==inv['row'] and r['recordedName']==inv['name']
  assert not r['acceptedMapping'] and not r['newStableIdAllocated'] and not r['mergeSelected'];assert r['proposedDisposition'] in ['held','duplicate_candidate_held']
  for inherit in r['inheritedRoutesReferences']:at(inherit)
  ff=fields[r['fieldLines']['firstLine']-1:r['fieldLines']['lastLine']];assert len(ff)==r['fieldLines']['count'] and all(f['savedInputKey']==r['savedInputKey']for f in ff)
  originalfields=orig['fieldProposals']if r['cohort']=='autonomous'else orig['fields'];assert [f['field']for f in ff]==list(originalfields)
  for f in ff:
   key=(f['savedInputKey'],f['field']);assert key not in seen;seen.add(key);env=at(f['originalReference']);assert env==originalfields[f['field']] and sha(canon(env))==f['originalEnvelopeCanonicalSha256']
   assert env['state']==f['originalState'] and env['acceptance']==f['originalAcceptance'] in ['held','proposed'];assert not f['acceptedFact'] and not f['sourceReadSelected'] and f['proposedDisposition']=='retain_unaccepted'
   at(f['originalRouteReference']);at(f['minimumProofReference'])
   if f['existingComparisonReference']:
    cr=f['existingComparisonReference'];pair=(cr['path'],cr['pointer']);assert pair not in comparisons;comparisons.add(pair);old=at(cr)
    assert old['originalEnvelope']==env and old['originalReference']==f['originalReference'] and old['comparison']['category']==f['existingComparisonCategory'] and old['comparison']['originalHoldRetained']
   else:assert r['cohort']=='first_batch'
 assert len(seen)==7547 and len(comparisons)==7468
 assert s['allOriginalAcceptanceCounts']=={'held':7518,'proposed':29} and sum(s['comparisonCoverage']['categories'].values())==7468
 for p in app:
  original=at(p['existingPublicationReference']);assert original['publicId']==p['publicId'];assert p['savedInputCandidateKeys']==[r['savedInputKey']for r in records if p['publicId'] in r['existingPublicIdCandidates']];assert not p['acceptedMapping']
 assert sum(not p['savedInputCandidateKeys']for p in app)==4 and sum(not r['existingPublicIdCandidates']for r in records)==4
 for v in inventory:at(v['originalInventoryReference']);assert not v['currentWorksheetStateEstablished']
 assert len({t['targetId']for t in targets})==len(targets)==397
 for t in targets:
  assert not t['executionSelected'] and t['locatorReferences']
  urls={at(x)for x in t['locatorReferences']};assert len(urls)==1 and sha(next(iter(urls)).encode())==t['exactLocatorSha256']
  assert set(t['affectedSavedInputs'])<=set(records_by)
 scope=load(G/'PROPOSED_READ_SCOPE.json');repair=load(G/'PROPOSED_VALIDATION_REPAIR.json');eligible=sum(t['proposedReadStatus']!='blocked_locator_only'for t in targets)
 assert scope['id']=='SD2-RESOLUTION-PROOF-1' and scope['status']=='proposal_only_not_selected' and scope['authorizationRequiredBeforeExecution']
 assert scope['targetsSha256']==sha((G/'read-targets.json').read_bytes()) and scope['exactDistinctLocatorCandidates']==397 and eligible==scope['maximumEligibleDistinctLocators']==379 and scope['blockedLocators']==18
 assert scope['maximumAcquisitionAttemptsPerEligibleLocator']==2 and scope['maximumAcquisitionAttempts']==758 and scope['maximumExplicitRemoteToolCallsPerAttempt']==2 and scope['maximumExplicitRemoteToolCalls']==1516
 assert not any(scope[k]for k in ['factsAccepted','mappingsAccepted','workbookAccess','workbookWrites','sourceReadSelected','rawHistoricalCustodyReinspection','applicationInteraction','providerContact','accountCredentialPermissionConfigurationChange','appOrCatalogMutation','remoteGitDeployment','monitoring','canonicalAcceptance','SD3Started'])
 assert repair['status']=='proposal_only_not_selected' and repair['authorizationRequiredBeforeExecution'] and not repair['environmentRepairSelected'] and not repair['lifecycleScriptsAuthorized']
 assert repair['proposedRestoreCommand']==['npm','ci','--ignore-scripts','--no-audit','--no-fund'] and repair['maximumInstallAttempts']==1
 for pin in repair['pins']:assert sha((R/pin['path']).read_bytes())==pin['sha256']
 checks=load(G/'application-checks.json');assert checks['requiredChecksRemainUnfulfilled'] and not checks['environmentRepairExecuted'] and not checks['dependencyInstallAttempted']
 assert [c['command']for c in checks['checks']]==repair['requiredCommands']==[['npm','run','plan:check'],['npm','run','typecheck'],['npm','test'],['npm','run','build']]
 for c in checks['checks']:
  b=(R/c['rawLogPath']).read_bytes();assert sha(b)==c['rawLogSha256'] and len(b)==c['rawLogBytes'];assert c['exitCode']==127 and c['result']=='BLOCKED_ENVIRONMENT'
 gates=load(G/'acceptance-gates.json')['gates'];assert len(gates)==len({g['id']for g in gates})==14
 assert all(all(g[k]for k in ['owner','trigger','nextAction','authoritativePaths'])for g in gates)
 rows=list(csv.reader(io.StringIO((G/'DECISIONS.csv').read_text())));assert len(rows)==412
 assert [row[0]for row in rows[1:]]==[r['savedInputKey']for r in records]
 for f in G.iterdir():
  if f.is_file():assert f.stat().st_size<16777216,f.name
 m=None
 if (G/'final-manifest.json').exists():
  m=load(G/'final-manifest.json');assert m['entryCommit']==entry and git('rev-parse',m['candidateCommit']+'^{tree}').decode().strip()==m['candidateTree']
  diff=git('diff','--binary',entry,m['candidateCommit']);assert len(diff)==m['completeDiffBytes'] and sha(diff)==m['completeDiffSha256']
  changed=set(git('diff','--name-only',entry,m['candidateCommit']).decode().splitlines());assert len(m['changedFiles'])==len(changed) and {f['path']for f in m['changedFiles']}==changed
  for f in m['changedFiles']:
   wm,b=working(f['path']);blob=git('show',m['candidateCommit']+':'+f['path']);assert wm==f['mode'] and sha(b)==sha(blob)==f['sha256'] and len(blob)==f['bytes']
 if bound:
  assert m is not None;rv=load(G/'review.json');assert rv['outcome']=='PASS' and not any(rv['severityCounts'].values()) and not rv['findings'];assert rv['binding']['candidateCommit']==m['candidateCommit'] and rv['binding']['manifestSha256']==sha((G/'final-manifest.json').read_bytes())
  assert git('rev-parse','HEAD^').decode().strip()==m['candidateCommit'] and set(git('diff','--name-only',m['candidateCommit'],'HEAD').decode().splitlines())=={prefix+'final-manifest.json',prefix+'review.json'}
  assert not git('status','--porcelain').strip()
 git('diff','--check',entry)
 result=dict(schemaVersion=1,outcome='PASS',scope='Local SD2 consolidation/acceptance-preparation package only',startedAt=start,completedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),reviewBound=bound,entryCommit=entry,protectedEntryFiles=protected,allPriorBytesModesHoldsReviewBindingsAndThreeAppendHistoriesPreserved=True,savedPositions=794,namedInputs=411,emptySavedPositions=383,originalFieldDefinitions=7547,existingComparisonOccurrences=7468,earliestDefinitionsOutsideComparisonPass=79,originalHeld=7518,originalProposed=29,publicationAwards=411,publicationCandidateLinked=407,publicationUnlinked=4,savedInputsWithoutCandidate=4,proposedHeldInputs=409,duplicateCandidateHeldInputs=2,exactOptionalLocators=397,preflightCandidateLocators=379,blockedLocatorOnly=18,maximumFutureAcquisitionAttempts=758,maximumFutureExplicitRemoteToolCalls=1516,ownerTriggerPathActionGates=14,requiredApplicationChecks='BLOCKED_ENVIRONMENT actualfour127missingtsx/tsc/next; no repair/install/waiver',acceptedFacts=0,acceptedMappings=0,newSourceOrWorkbookReads=0,environmentRepairExecuted=False,canonicalAcceptance=False,fullSD2Complete=False,SD3Started=False,externalEffects=False)
 stored=load(G/'verification.json')
 if stored.get('outcome')=='PASS':
  skip={'startedAt','completedAt','reviewBound'};assert {k:v for k,v in stored.items()if k not in skip}=={k:v for k,v in result.items()if k not in skip}
 print(json.dumps(result,indent=2))
if __name__=='__main__':verify('--review-bound'in sys.argv)
