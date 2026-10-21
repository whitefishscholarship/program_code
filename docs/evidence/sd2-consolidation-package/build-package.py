"""Derive one SD2 decision view from immutable saved records; no research replay."""
from pathlib import Path
import collections,csv,hashlib,json,re,sys,urllib.parse
P=Path(__file__).resolve().parent
R=next((p for p in P.parents if (p/'AGENTS.md').exists()),Path('/private/tmp/program_code-student-data-maintenance-plan'))
B=R/'docs/evidence';S=B/'sd2-autonomous';C=S/'saved-continuation';G=B/'sd2-consolidation-package'
sha=lambda b:hashlib.sha256(b).hexdigest()
canon=lambda x:json.dumps(x,sort_keys=True,separators=(',',':'),ensure_ascii=False).encode()
cache={}
def load(p):
 p=Path(p)
 if p not in cache:cache[p]=json.loads(p.read_text())
 return cache[p]
def ref(p,pointer=''):
 p=Path(p);return dict(path=str(p.relative_to(R)),sha256=sha(p.read_bytes()),pointer=pointer)
def at(r):
 p=R/r['path'];assert sha(p.read_bytes())==r['sha256'];x=load(p)
 for k in r.get('pointer','').split('/')[1:]:
  k=k.replace('~1','/').replace('~0','~');x=x[int(k)] if isinstance(x,list) else x[k]
 return x
def esc(s):return s.replace('~','~0').replace('/','~1')
def derive():
 inventory=load(B/'sd2-first-batch/inventory-ledger.json');queue=load(S/'queue.json');first=load(B/'sd2-first-batch/proposals.json');jaycee=load(B/'sd2-jaycee/proposals.json');publication=load(R/'web/fixtures/r3/catalog-v1.json')
 named=[x for x in inventory['rows'] if x['name']];assert len(inventory['rows'])==794 and len(named)==411
 comparisons={};comparedkeys=set()
 folders=[S/'consolidation-pilot-001',*(S/f'reconciliation-batch-{n:03d}' for n in range(2,8)),*(C/f'checkpoint-{n:03d}' for n in range(1,21))]
 for folder in folders:
  d=load(folder/'comparison.json')
  for ri,r in enumerate(d['records']):
   comparedkeys.add(r['savedInputKey'])
   for fi,f in enumerate(r['fields']):
    key=(f['originalReference']['path'],f['originalReference']['pointer']);assert key not in comparisons
    comparisons[key]=(f,ref(folder/'comparison.json',f'/records/{ri}/fields/{fi}'))
 assert len(comparisons)==7468 and len(comparedkeys)==408
 originals={};qindex={x['inputKey']:(i,x) for i,x in enumerate(queue['records'])}
 for n in range(1,22):
  p=S/f'checkpoint-{n:03d}.json'
  for i,r in enumerate(load(p)['records']):
   row=r['rowLocator'];assert row not in originals;originals[row]=(r,ref(p,f'/records/{i}'),'autonomous',r['fieldProposals'],r['publicIdCandidates'])
 for i,r in enumerate(jaycee['records']):
  row=r['inputRecord']['rowLocator'];assert row not in originals;originals[row]=(r,ref(B/'sd2-jaycee/proposals.json',f'/records/{i}'),'jaycee',r['fields'],[r['existingPublicIdCandidate']])
 for i,r in enumerate(first['records']):
  capture=load(B/'sd2-first-batch'/r['freshRowCapture']);ranges=capture['args']['ranges'];assert len(ranges)==1
  match=re.fullmatch(r"'School Resource - Cleaned Up'!A(\d+):O\1",ranges[0]);assert match
  row=int(match[1]);assert row not in originals;originals[row]=(r,ref(B/'sd2-first-batch/proposals.json',f'/records/{i}'),'first_batch',r['fields'],[r['awardId']])
 assert set(originals)=={x['row'] for x in named} and len(originals)==411
 evidence={}
 for path in [B/'sd2-first-batch/proposals.json',B/'sd2-jaycee/proposals.json']:
  for i,e in enumerate(load(path)['evidence']):evidence[(str(path.relative_to(R)),e['evidenceId'])]=(e,ref(path,f'/evidence/{i}'))
 fields=[];records=[];targets={};states=collections.Counter();acceptances=collections.Counter();categorycounts=collections.Counter();evidencecount=0
 def target(url,where,recordkey,field=None,purpose='existing attached evidence'):
  if not isinstance(url,str) or not url:return
  parsed=urllib.parse.urlsplit(url);querykeys={k.lower() for k,v in urllib.parse.parse_qsl(parsed.query,keep_blank_values=True)}
  blocked=('redacted_locator' if re.search(r'redact|[<>\[\]]',url,re.I) else 'credential_or_authenticated_locator' if parsed.username or parsed.password or querykeys&{'token','access_token','api_key','key','auth','code','signature','sig','password','secret'} else 'non_http_locator' if parsed.scheme not in ['http','https'] else 'workbook_access_excluded' if '/spreadsheets/' in parsed.path else 'form_or_application_interaction_excluded' if 'forms.google' in parsed.netloc or '/forms/' in parsed.path or 'login' in parsed.path.lower() else None)
  t=targets.setdefault(url,dict(targetId='sd2-read-'+sha(url.encode())[:20],exactLocatorSha256=sha(url.encode()),host=parsed.hostname or None,proposedReadStatus='blocked_locator_only' if blocked else 'candidate_requires_official_public_program_identity_preflight',blockReason=blocked,locatorReferences=[],affectedSavedInputs=set(),affectedFields=set(),purposes=set(),executionSelected=False))
  if where not in t['locatorReferences']:t['locatorReferences'].append(where)
  t['affectedSavedInputs'].add(recordkey)
  if field:t['affectedFields'].add(recordkey+'#'+field)
  t['purposes'].add(purpose)
 for invindex,inv in enumerate(inventory['rows']):
  if not inv['name']:continue
  row=inv['row'];orig,recordref,cohort,envelopes,candidates=originals[row];key=f'saved-405588227-row-{row}'
  assert inv['name']==orig.get('recordedName',orig.get('inputRecord',{}).get('recordedName'))
  if cohort=='autonomous':assert orig['inputKey']==key
  firstline=len(fields)+1;rc=collections.Counter();sc=collections.Counter();ac=collections.Counter()
  for name,env in envelopes.items():
   pointer=recordref['pointer']+('/fieldProposals/' if cohort=='autonomous' else '/fields/')+esc(name);originalref=dict(recordref,pointer=pointer);assert at(originalref)==env
   existing=comparisons.get((originalref['path'],originalref['pointer']))
   if existing:
    f,comparisonref=existing;assert f['originalEnvelope']==env and f['originalEnvelopeSha256']==sha(canon(env));category=f['comparison']['category'];route=ref(R/comparisonref['path'],comparisonref['pointer']+'/nextActionRoute');proof=ref(R/comparisonref['path'],comparisonref['pointer']+'/comparison/minimumAdditionalProof')
   else:
    assert cohort=='first_batch';comparisonref=None;category='original first-batch proposal; no saved-comparison occurrence';route=recordref;proof=ref(R/recordref['path'],recordref['pointer']+'/remaining')
   assert env['acceptance'] in ['held','proposed'];assert env['state'] in ['verified','unstated','unverified','conflict','inaccessible']
   reason='conflicting_versions_require_scope_or_retained_hold' if category=='existing evidence conflicting' or env['state']=='conflict' else 'no_attached_evidence_remains_unknown' if category=='evidence unavailable' else 'limited_saved_consistency_still_needs_identity_cycle_freshness_acceptance' if category=='existing evidence consistent' else 'existing_first_batch_proposal_not_accepted' if cohort=='first_batch' else 'identity_source_cycle_scope_unresolved'
   priority='eligibility_deadline_or_application_route' if re.search(r'eligib|deadline|applic|rout|identit|current|cycle|open|residen|age|gpa|school|citizen|student|disab|need|member|material|nominat',name,re.I) else 'other_material_field_retained'
   fields.append(dict(savedInputKey=key,field=name,originalReference=originalref,originalEnvelopeCanonicalSha256=sha(canon(env)),originalState=env['state'],originalAcceptance=env['acceptance'],existingComparisonReference=comparisonref,existingComparisonCategory=category,proposedDisposition='retain_unaccepted',reasonCode=reason,priority=priority,originalRouteReference=route,minimumProofReference=proof,acceptedFact=False,sourceReadSelected=False))
   rc[category]+=1;sc[env['state']]+=1;ac[env['acceptance']]+=1;states[env['state']]+=1;acceptances[env['acceptance']]+=1;categorycounts[category]+=1
   if cohort=='autonomous':
    for ei,ev in enumerate(env['evidence']):
     target(ev.get('sourceUrl'),dict(originalref,pointer=pointer+f'/evidence/{ei}/sourceUrl'),key,name);evidencecount+=1
   else:
    for eid in env['evidenceIds']:
     ev,er=evidence[(originalref['path'],eid)];target(ev.get('sourceUrl'),dict(er,pointer=er['pointer']+'/sourceUrl'),key,name);evidencecount+=1
  if cohort=='autonomous':
   qi,qr=qindex[key]
   for si,url in enumerate(qr['recordedSeedUrls']):target(url,ref(S/'queue.json',f'/records/{qi}/recordedSeedUrls/{si}'),key,purpose='original queued identity/source locator; no new discovery')
  duplicate=inv['identityResolution']=='name_duplicate_hold'
  records.append(dict(savedInputKey=key,savedRowLocator=row,recordedName=inv['name'],inventoryReference=ref(B/'sd2-first-batch/inventory-ledger.json',f'/rows/{invindex}'),originalRecordReference=recordref,originalRecordCanonicalSha256=sha(canon(orig)),cohort=cohort,existingPublicIdCandidates=candidates,originalIdentityStatus=orig.get('identityAcceptance',orig.get('mappingAcceptance',orig.get('identityState'))),proposedDisposition='duplicate_candidate_held' if duplicate else 'held',dispositionReason='Exact original identity/source/cycle and acceptance limits persist; existing candidates are not accepted mappings. Explicit held is a valid proposed SD2 outcome.',fieldLines=dict(path='field-decisions.jsonl',firstLine=firstline,lastLine=len(fields),count=len(envelopes)),fieldStateCounts=dict(sc),originalAcceptanceCounts=dict(ac),existingComparisonCounts=dict(rc),originalRoutesReference=recordref,inheritedRoutesReferences=[ref(S/'PRELUDE.json'),ref(S/'consolidation-proposal/SESSION_CLOSE.md')],acceptedMapping=False,newStableIdAllocated=False,mergeSelected=False))
 assert len(fields)==7547 and len({(x['savedInputKey'],x['field']) for x in fields})==7547
 assert sum(x['cohort']=='autonomous' for x in records)==406
 assert sum(x['fieldLines']['count']for x in records if x['cohort']=='autonomous')==7406
 assert sum(x['fieldLines']['count']for x in records if x['cohort']=='jaycee')==62
 assert sum(x['fieldLines']['count']for x in records if x['cohort']=='first_batch')==79
 assert sum(x['existingComparisonReference'] is not None for x in fields)==7468
 app=publication['catalog']['awards'];appids={x['publicId'] for x in app};assert len(app)==len(appids)==411
 appview=[]
 for i,a in enumerate(app):
  links=[r['savedInputKey'] for r in records if a['publicId'] in r['existingPublicIdCandidates']]
  appview.append(dict(publicId=a['publicId'],existingPublicationReference=ref(R/'web/fixtures/r3/catalog-v1.json',f'/catalog/awards/{i}'),savedInputCandidateKeys=links,status='existing_candidate_links_held' if links else 'no_saved_input_candidate_link_evidenced',proposedDisposition='held',acceptedMapping=False,matchMethod='Exact existing public-ID candidate only; no name matching or ID allocation'))
 inventoryview=[]
 rowsby={r['savedRowLocator']:r for r in records}
 for i,x in enumerate(inventory['rows']):inventoryview.append(dict(savedRowLocator=x['row'],originalInventoryReference=ref(B/'sd2-first-batch/inventory-ledger.json',f'/rows/{i}'),originalRowOutcome=x['rowOutcome'],originalIdentityResolution=x['identityResolution'],derivedInputKey=rowsby[x['row']]['savedInputKey'] if x['name'] else None,proposedDisposition=rowsby[x['row']]['proposedDisposition'] if x['name'] else 'empty_saved_projection_only',currentWorksheetStateEstablished=False))
 targetrows=[]
 for url,t in sorted(targets.items(),key=lambda kv:kv[1]['targetId']):
  for k in ['affectedSavedInputs','affectedFields','purposes']:t[k]=sorted(t[k])
  targetrows.append(t)
 summary=dict(schemaVersion=1,scope='One derived SD2 consolidation/acceptance-preparation view; not a second Reviews queue or factual registry',inventory=dict(savedPositions=794,namedInputs=411,emptySelectedProjectionPositions=383,uniqueExactNames=410),originalProposalFields=dict(autonomous7406=7406,jaycee62=62,firstBatch79=79,total7547=7547,firstBatchEvidenceEntries=42,firstBatchOriginalAcceptance=dict(collections.Counter(e['acceptance']for r in first['records']for e in r['fields'].values()))),comparisonCoverage=dict(inputs=408,fieldOccurrences=7468,continuationInputs=386,continuationFields=7062,priorInputs=22,priorFields=406,firstBatchFieldsWithoutThisComparisonPass=79,categories={k:v for k,v in categorycounts.items() if k!='original first-batch proposal; no saved-comparison occurrence'}),allFieldOutcomeCounts=dict(categorycounts),allFieldStateCounts=dict(states),allOriginalAcceptanceCounts=dict(acceptances),proposedIdentityDispositions=dict(collections.Counter(r['proposedDisposition']for r in records)),publication=dict(existingAwards=411,withCandidateLink=sum(bool(x['savedInputCandidateKeys'])for x in appview),withoutCandidateLink=sum(not x['savedInputCandidateKeys']for x in appview),withMultipleCandidateLinks=sum(len(x['savedInputCandidateKeys'])>1 for x in appview),savedInputsWithoutCandidate=sum(not r['existingPublicIdCandidates']for r in records),candidateIdsOutsidePinnedPublication=sorted({i for r in records for i in r['existingPublicIdCandidates']}-appids)),additionalReadProposal=dict(exactDistinctLocatorCandidates=len(targetrows),preflightCandidateLocators=sum(x['proposedReadStatus']!='blocked_locator_only'for x in targetrows),blockedLocatorOnly=sum(x['proposedReadStatus']=='blocked_locator_only'for x in targetrows),fieldEvidenceReferenceOccurrences=evidencecount),acceptedFacts=0,acceptedMappings=0,newSourceOrWorkbookReads=0,environmentRepairExecuted=False,fullSD2Complete=False,canonicalAcceptance=False,SD3Started=False,externalEffects=False)
 return dict(summary=summary,records=records,fields=fields,publication=appview,inventory=inventoryview,targets=targetrows)
def build():
 assert G.exists() and not (G/'review.json').exists(),'Never rebuild a reviewed package'
 out=derive();save=lambda n,d:(G/n).write_text(json.dumps(d,indent=2,ensure_ascii=False)+'\n')
 save('summary.json',out['summary']);save('decision-ledger.json',dict(schemaVersion=1,authoritative=False,meaning='Derived proposed outcomes only; original referenced packets/routes remain authoritative. No new Reviews system.',records=out['records']))
 (G/'field-decisions.jsonl').write_text(''.join(json.dumps(f,separators=(',',':'),ensure_ascii=False)+'\n'for f in out['fields']))
 save('publication-crosswalk.json',dict(meaning='Existing pinned411-award publication denominator kept separate from saved411named inputs; exact candidate links only, all held.',records=out['publication']))
 save('inventory-dispositions.json',dict(meaning='Saved794-position F/G/O projection accounting, not current or whole-workbook state.',records=out['inventory']))
 save('read-targets.json',dict(meaning='Proposal only. Exact locators stay in immutable references; hashes bind the finite targets. Candidate status never establishes official/public/safe access. No URL reconstruction, new discovery or execution selected.',targets=out['targets']))
 with (G/'DECISIONS.csv').open('w',newline='') as f:
  w=csv.writer(f,lineterminator="\n");w.writerow(['saved_input','saved_row','recorded_award_name','original_cohort','existing_public_id_candidates','proposed_outcome','original_identity_status','fields','conflicting_comparison_fields','unavailable_comparison_fields','accepted_mapping'])
  for r in out['records']:w.writerow([r['savedInputKey'],r['savedRowLocator'],r['recordedName'],r['cohort'],' | '.join(r['existingPublicIdCandidates']),r['proposedDisposition'],r['originalIdentityStatus'],r['fieldLines']['count'],r['existingComparisonCounts'].get('existing evidence conflicting',0),r['existingComparisonCounts'].get('evidence unavailable',0),False])
 print(json.dumps(out['summary']))
if __name__=='__main__':
 assert sys.argv[1:]==['build'];build()
