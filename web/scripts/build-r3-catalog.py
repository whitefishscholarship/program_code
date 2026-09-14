#!/usr/bin/env python3
"""Offline, deterministic R3 mapping proposal. Never contacts or writes a source."""
import copy, hashlib, json, re
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'docs/evidence/r3-catalog'
def read(path): return json.loads((ROOT / path).read_text())
def digest(value): return hashlib.sha256(json.dumps(value, sort_keys=True, ensure_ascii=False, separators=(',', ':')).encode()).hexdigest()
def filehash(path): return hashlib.sha256((ROOT / path).read_bytes()).hexdigest()
def save(name, value): (OUT / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')
def pid(kind, key): return kind + '-' + hashlib.sha256(('r3:' + key).encode()).hexdigest()[:12]
def values(cells): return [cells[i].get('userEnteredValue', {}) if i < len(cells) else {} for i in range(15)]
def text(cell):
    v = cell.get('userEnteredValue', {})
    return str(cell.get('formattedValue', v.get('stringValue', v.get('numberValue', '')))).strip()
def links(cell):
    return sorted(set(([cell['hyperlink']] if cell.get('hyperlink') else []) + [x['format']['link']['uri'] for x in cell.get('textFormatRuns', []) if x.get('format', {}).get('link', {}).get('uri')]))
def single_url(cell):
    urls = links(cell)
    if not urls and re.fullmatch(r'https?://[^\s]+', text(cell)): urls = [text(cell)]
    return urls[0] if len(urls) == 1 and urls[0].startswith(('https://', 'http://')) else None

def join_rows(expected, observed):
    """Full predicted value vectors locate identities; row/name/URL never joins alone."""
    index = {}
    for row in observed:
        index.setdefault(digest(values(row['cells'])), []).append(row['row'])
    result = {}
    for historical, cells in expected.items():
        candidates = index.get(digest(values(cells)), [])
        if len(candidates) != 1: raise ValueError(f'Unresolved full-row identity at historical row {historical}')
        result[historical] = candidates[0]
    if len(set(result.values())) != len(expected): raise ValueError('Duplicate identity join')
    return result

def build():
    capture = read('docs/evidence/r3-catalog/attempt-2-capture-1.json')
    second = read('docs/evidence/r3-catalog/attempt-2-capture-2.json')
    verification = read('docs/evidence/r3-catalog/capture-verification.json')
    source_sha = digest(capture['rows'])
    assert source_sha == digest(second['rows']) == '22427fc3873cbfec95e7274a90f6a7b23f912b83845cca15ae96aac89a965f7c'
    assert verification['status'] == 'PASS_BOUNDED_CONSISTENT_CAPTURE'
    assert [r['row'] for r in capture['rows']] == list(range(1,418))
    ledger = read('docs/evidence/SCHOLARSHIP-INTAKE-ledger.json')
    entities = {e['id']: e for e in ledger['entities']}
    proposal = read('docs/evidence/SCHOLARSHIP-INTAKE-proposed-writes.json')
    operations = proposal['operations']
    assert len(operations) == 257 and len({o['entityId'] for o in operations}) == 257
    assert sum(len(o['cells']) for o in operations) == 3367
    old = read('web/fixtures/p7/student-catalog.json')
    oldshort = read('web/fixtures/shortlist/spreadsheet-shortlist-v1.json')
    base = read('docs/evidence/scholarship-intake/cells-0.json')['response']['sheets'][0]['data'][0]['rowData']
    expected = {i+1: copy.deepcopy(row.get('values', [])) for i,row in enumerate(base) if i}
    for i in range(199,418): expected[i] = []
    for o in operations:
        row = expected[o['rowNumber']]
        while len(row) < 15: row.append({})
        for c in o['cells']:
            cell = row[ord(c['column'])-65]
            # The APPLIED receipt's field mask replaces or clears BOTH fields.
            for key in ['userEnteredValue','textFormatRuns']:
                cell[key] = copy.deepcopy(c['after'].get(key, {} if key == 'userEnteredValue' else []))
    joins = join_rows(expected, capture['rows'][1:])
    current = {r['row']: r['cells'] + [{}] * (15-len(r['cells'])) for r in capture['rows'][1:]}
    for o in operations:
        for c in o['cells']:
            if c.get('expectedLink'): assert c['expectedLink'] in links(current[joins[o['rowNumber']]][ord(c['column'])-65])
    rowtargets = {r['sourceRow']: r for r in oldshort['rows']}
    catalog = copy.deepcopy(old)
    byid = {a['publicId']:a for a in catalog['awards']}
    crosswalk, criteria, fields, connection_evidence, connections = [], [], [], [], []
    shortlist = copy.deepcopy(oldshort['rows'])
    existing_connections = read('web/fixtures/relevance/interview-relevance-v1.json')['connections'] + read('web/fixtures/coverage/interview-coverage-v1.json')['connections']
    seen_connections = {(c['awardId'],c['answerId']) for c in existing_connections}
    inventory = read('docs/evidence/r3-catalog/control-inventory.json')
    controls = {c['id']:c['label'] for group in inventory.values() if isinstance(group,list) for c in group if isinstance(c,dict) and 'id' in c and 'label' in c}
    gaps = {g['id']:g for g in ledger['interviewGaps']}
    teaching = set(gaps['gap-education-teaching']['supportingEntityIds'])
    need = set(gaps['gap-ordinary-financial-need']['supportingEntityIds'])
    organization = set(gaps['gap-student-organizations']['supportingEntityIds'])
    survivor = 'intake-entity-2b04ced9c8073619'
    withdrawn = 'intake-entity-10fdd5d4c2991973'
    org_ids = ['nths','ffa','bpa','deca','fbla','fccla','hosa','skillsusa','tsa']
    org_support = {org:[] for org in org_ids}
    deferred = []
    new_entities = {}
    for o in operations:
        e = entities[o['entityId']]
        historical = o['rowNumber']; now = joins[historical]; cells = current[now]; v = [text(c) for c in cells]
        if v[3] == 'Portal':
            target = rowtargets[historical]
            assert target['targetKind'] == 'portal'
            crosswalk.append(dict(operationId=o['id'],entityId=e['id'],historicalLocator=f'Master Database!A{historical}:O{historical}',currentLocator=f'Master Database!A{now}:O{now}',currentRow=now,identityEvidence=dict(predictedRowSha256=digest(values(expected[historical])),sourceRowIds=o['sourceRowIds'],ledgerRationale=e.get('identityRationale'),join='unique complete entered-value vector plus applied reviewed provenance; Master record type controls resource classification'),publicId=target['targetId'],sourceSnapshotSha256=source_sha,fieldDeltaIndex='mapping-fields.json#'+e['id'],publicationOutcome='parent_or_resource',supportingReviewPath=e['review']['receiptPath'],owner='Codex',trigger='future resource-display scope',nextAction='preserve portal; do not promote portal summary to child eligibility'))
            fields.append(dict(entityId=e['id'],publicId=target['targetId'],sourceRow=now,deltas=o['cells'],outcome='parent_or_resource',rationale='Portal schema has no summary; existing portal and child relationships preserved. Updated source summary retained here only.',reviewPath=e['review']['receiptPath']))
            continue
        assert v[3] == 'Scholarship' and e['type'] == 'scholarship' and e['review']['status'] == 'reviewed', (historical,now,v[3],e['name'])
        award_id = rowtargets[historical]['targetId'] if o['kind'] == 'update' else pid('award',e['id'])
        assert o['kind'] != 'update' or rowtargets[historical]['targetKind'] == 'award'
        if o['kind'] == 'add':
            assert award_id not in byid
            source_id = pid('source',e['id'])
            # A source record belongs to this reviewed entity. Shared URLs are NOT a group or identity join.
            catalog['sources'].append(dict(publicId=source_id,title=v[6]+' — recorded source',recordType='source',architecture='unknown',url=single_url(cells[5]),access='unknown',availability='unknown',awardCount=1))
            gpa = None
            if v[9] and historical not in [299,335,395,397]:
                assert re.fullmatch(r'[0-4](?:\.\d+)?',v[9]); gpa=float(v[9])
            school = {'4-Year':['four_year'],'4 Year':['four_year'],'Trade':['trade_vocational'],'2-Year, 4-Year, Trade':['two_year','four_year','trade_vocational']}.get(v[10],[])
            criteria.append(dict(entityId=e['id'],awardId=award_id,row=now,gpaRaw=v[9],minimumGpa=gpa,schoolRaw=v[10],schoolTypes=school,gpaDisposition='explicit_numeric_organizer_value' if gpa is not None else 'program_or_college_gpa_not_comparable_to_school_answer' if v[9] else 'unknown_no_rule',schoolDisposition='explicit_resolved_type' if school else 'unknown_no_rule',reviewPath=e['review']['receiptPath'],sourceFieldEvidence=[c['fieldEvidence'] for c in o['cells'] if c['column'] in ['J','K']]))
            shortlist.append(dict(sourceRow=now,targetKind='award',targetId=award_id,minimumGpa=gpa,schoolTypes=school,applicationPreference=None))
            award = dict(publicId=award_id,name=v[6],summary=None,amount={},eligibility=dict(audience=v[2] or 'Geography not recorded',minimumGpa=gpa,schoolTypes=['trade' if x=='trade_vocational' else x for x in school],focus=v[12] or None),cycle={},application=dict(mode='unknown',label=v[7] or 'Application route not recorded; check the source.',url=single_url(cells[7]),groupPublicId=None,supplements='unknown'),sourcePublicIds=[source_id])
            catalog['awards'].append(award);byid[award_id]=award;new_entities[award_id]=e['id']
        else: award = byid[award_id]
        changed_columns = {c['column'] for c in o['cells']}
        if 'G' in changed_columns: award['name']=v[6]
        if 'I' in changed_columns: award['summary']=v[8] or None
        if 'E' in changed_columns:
            award['amount']=dict(label=v[4] or 'Amount not recorded',minimum=None,maximum=None,currency=None,state='unparseable' if v[4] else 'unknown')
        if 'B' in changed_columns or award_id == 'award-ead4360dadca':
            raw=v[1]; numeric = isinstance(cells[1].get('userEnteredValue',{}).get('numberValue'),(int,float))
            has_date = any(cells[1].get(k,{}).get('numberFormat',{}).get('type') in ['DATE','DATE_TIME'] for k in ['userEnteredFormat','effectiveFormat'])
            label = 'Deadline not verified; confirm with NTHS.' if award_id == 'award-ead4360dadca' and numeric and not has_date else 'Deadline not verified; confirm with provider.' if numeric and not has_date else 'Recorded deadline: '+raw+'. Current availability not verified.' if raw else 'Availability not verified'
            award['cycle']=dict(status='unknown',label=label,year=None,opens=None,closes=None,recurrence='unknown')
        # Public field provenance is exact coordinate and original reviewed disposition, not new official acceptance.
        fields.append(dict(entityId=e['id'],awardId=award_id,sourceRow=now,publicFields={'name':'G','summary':'I','amount.label':'E','cycle.label':'B','eligibility.audience':'C','eligibility.focus':'M','application.label':'H','application.url':'H native unique link or full URL','source.url':'F native unique link or full URL','eligibility.minimumGpa':'individually reviewed J (new awards only)','eligibility.schoolTypes':'individually reviewed K (new awards only)'},rules='Apply only changed columns on existing awards; existing eligibility and all relationships preserved. New amount numeric bounds/currency and cycles remain unknown. No formulas executed or URLs followed.',deltas=[dict(column=c['column'],before=c['before'],after=c['after'],evidence=c['fieldEvidence']) for c in o['cells']],reviewPath=e['review']['receiptPath']))
        crosswalk.append(dict(operationId=o['id'],entityId=e['id'],historicalLocator=f"Master Database!A{historical}:O{historical}",currentLocator=f"Master Database!A{now}:O{now}",currentRow=now,identityEvidence=dict(predictedRowSha256=digest(values(expected[historical])),sourceRowIds=o['sourceRowIds'],ledgerRationale=e.get('identityRationale'),join='unique complete entered-value vector after APPLIED field-mask replacement plus every expected native link'),publicId=award_id,sourceSnapshotSha256=source_sha,fieldDeltaIndex='mapping-fields.json#'+e['id'],publicationOutcome='included_in_local_candidate',supportingReviewPath=e['review']['receiptPath'],owner='Codex',trigger='mapping PASS then implementation; R4 requires separate authority',nextAction='publish local bundle only after mapping review'))
        desired = []
        for tag in e.get('tags',[]):
            answer=tag.get('existingChoiceId')
            if answer in ['first_generation','foster_care']:
                deferred.append(dict(entityId=e['id'],awardId=award_id,answerId=answer,outcome='recommendation_only',rationale='Provider definitions remain on card; no universal definition or new sensitive question selected.',owner='Kelsey',trigger='separately selected definition policy',nextAction='review saved provider definitions before new connection'))
            elif answer in controls:
                desired.append((answer, f"Your {controls[answer]} choice brings {award['name']} forward for review. Check its specific recorded conditions below; this connection does not confirm eligibility.", dict(tag=tag)))
        if e['id'] in teaching:
            qualifiers = {'intake-entity-614effa8ef61322e':'Athletics OR education is recorded; education is one alternative.', 'intake-entity-2034b3849f9e6eed':'An education degree is a preference, not a requirement.', 'intake-entity-5529a2e6789f2993':'Education is one helping-career alternative; other helping fields also qualify.', 'intake-entity-19060852883d7493':'Secondary education or English teaching is the recorded field.'}
            desired.append(('education_teaching',f"Education / Teaching brings {award['name']} forward. "+qualifiers.get(e['id'],'An education path is recorded; check the stated college and program conditions.')+' Confirm all requirements; interest alone does not establish eligibility.',dict(gapId='gap-education-teaching')))
        if e['id'] in need:
            sentences = re.split(r'(?<=[.!?])\s+',v[8])
            qualifier = ' '.join(s for s in sentences if re.search(r'need|low.income|financial',s,re.I))
            if not qualifier:
                deferred.append(dict(entityId=e['id'],awardId=award_id,answerId='financial_need',outcome='changed_pending_review',rationale='Historical gap support conflicts with current applied summary, which does not record financial need; no connection imported.',owner='Codex',trigger='separately authorized source research',nextAction='resolve saved gap versus award-specific evidence'))
            if qualifier: desired.append(('financial_need',f"You asked to explore financial-need scholarships. {award['name']}: {qualifier} This is a discovery preference, not proof of financial need or eligibility.",dict(gapId='gap-ordinary-financial-need')))
        if e['id'] in organization or e['id'] == survivor:
            orgs=['nths']+[x for x in org_ids if x!='nths' and re.search(r'(?<![A-Za-z])'+re.escape(x)+r'(?![A-Za-z])',v[6],re.I)]
            for org in orgs:
                org_support[org].append(award_id)
                desired.append(('org_'+org,f"Your {org.upper() if org!='skillsusa' else 'SkillsUSA'} selection brings {award['name']} forward. Check the named membership requirements, including any required joint NTHS membership, training and application conditions. One selection does not establish the full combination or eligibility.",dict(gapId='gap-student-organizations')))
        for answer,message,evidence in desired:
            key=(award_id,answer)
            outcome='preserved_existing_connection' if key in seen_connections else 'included_in_local_candidate'
            connection_evidence.append(dict(entityId=e['id'],awardId=award_id,answerId=answer,evidence=evidence,sourceIds=e['officialEvidenceIds'],summaryLocator=f'I{now}',outcome=outcome,reviewPath=e['review']['receiptPath']))
            if key not in seen_connections:
                seen_connections.add(key);connections.append(dict(id=pid('r3-connection',e['id']+':'+answer),answerId=answer,awardId=award_id,message=message))
    nths = byid['award-ead4360dadca']
    assert rowtargets[143]['targetId'] == nths['publicId'] and len(links(current[joins[143]][1])) == 0
    assert current[joins[143]][1]['userEnteredValue'] == {'numberValue':46113}
    assert not any(current[joins[143]][1].get(k,{}).get('numberFormat',{}).get('type') in ['DATE','DATE_TIME'] for k in ['userEnteredFormat','effectiveFormat'])
    nths['cycle'] = dict(status='unknown',label='Deadline not verified; confirm with NTHS.',year=None,opens=None,closes=None,recurrence='unknown')
    fields.append(dict(entityId=survivor,awardId=nths['publicId'],sourceRow=joins[143],publicField='cycle',sourceCoordinate='B143',rawNativeCell=current[joins[143]][1],outcome='unverified_deadline_message',reviewPath=entities[survivor]['review']['receiptPath'],rationale='Numeric serial without date format; withdrawn duplicate deadline not used.'))
    assert len(catalog['awards'])==411 and len(byid)==411
    assert all(org_support.values())
    # Collision candidates are reported for review; shared sources are not merged.
    collisions=[]
    for new in [a for a in catalog['awards'] if a['publicId'] in new_entities]:
        for prior in old['awards']:
            shared=set(new['sourcePublicIds']) & set(prior['sourcePublicIds'])
            same_app=bool(new['application']['url'] and new['application']['url']==prior['application']['url'])
            same_name=re.sub(r'[^a-z0-9]','',new['name'].lower())==re.sub(r'[^a-z0-9]','',prior['name'].lower())
            if same_name or shared or same_app: collisions.append(dict(newId=new['publicId'],existingId=prior['publicId'],newEntityId=new_entities[new['publicId']],sameNormalizedName=same_name,sharedApplicationUrl=same_app,decision='distinct_reviewed_ledger_entity; shared application route is not award identity'))
    assert not any(c['sameNormalizedName'] for c in collisions)
    catalog['awards'].sort(key=lambda a:(a['name'].lower(),a['publicId']))
    catalog['counts'].update(sources=len(catalog['sources']),awards=411,cycles=411,unknownCycles=411)
    catalog['notice']='Organizer records captured September 14, 2026. Current deadlines, availability and eligibility have not been independently verified. Confirm with each provider.'
    catalog['catalogRevision']=digest({k:v for k,v in catalog.items() if k!='catalogRevision'})
    provenance=dict(schemaVersion=1,id='r3-catalog-v1-rev229',basis='organizer_recorded_not_officially_verified',snapshotDate='2026-09-14',sourceRevision='229',sourceSnapshotSha256=source_sha,generatorSha256=filehash('web/scripts/build-r3-catalog.py'),historicalMatchingFactsRevision='225',limits=verification['limits'])
    old_ids={a['publicId'] for a in old['awards']}
    retained=[dict(publicId=a['publicId'],outcome='preserved_existing',catalogOnly=not any(r['targetId']==a['publicId'] for r in oldshort['rows']),criteria='unchanged historical shortlist row or no parent inheritance',relationships='exact original source IDs/application group preserved',owner='Codex',trigger='local regression checks',nextAction='verify preserved decisions') for a in old['awards']]
    priority=read('docs/evidence/interview-coverage/r3-scope-inputs.json')['priority']
    byentity={x['entityId']:x for x in crosswalk}
    byentity[survivor] = dict(publicId='award-ead4360dadca')
    priority_rows=[]
    for gap in priority['gaps']:
        for eid in gap['entityIds']:
            resolved=survivor if eid==withdrawn else eid
            priority_rows.append(dict(gapId=gap['gapId'],entityId=eid,publicId=byentity[resolved]['publicId'],outcome='duplicate_to_named_survivor' if eid==withdrawn else 'recommendation_only' if gap['gapId']=='gap-first-generation-definition' else 'changed_pending_review' if any(d['entityId']==eid and d.get('answerId')=='financial_need' for d in deferred) and gap['gapId']=='gap-ordinary-financial-need' else 'included_in_local_candidate',survivorEntityId=resolved,owner='Kelsey' if 'definition' in gap['gapId'] else 'Codex',trigger='separate definition selection' if 'definition' in gap['gapId'] else 'mapping review',nextAction='preserve provider wording; no universal definition' if 'definition' in gap['gapId'] else 'verify exact award connection'))
    reconciliation=dict(schemaVersion=1,sourceSnapshotSha256=source_sha,counts=dict(operations=257,additions=219,updates=38,targetedCells=3367,rowPositions=416,scholarshipRows=395,portalRows=21,existingAwards=192,catalogOnlyAwards=16,newAwards=219,localCandidateAwards=411,priorityEntities=38,priorityReferences=42,organizations=9,gaps=5,enteredValueMismatches=0,expectedLinkMismatches=0),operations=crosswalk,rows=[dict(currentRow=n,historicalRow=h,outcome='parent_or_resource' if text(current[n][3])=='Portal' else 'included_in_local_candidate' if h>=199 else 'preserved_existing',publicId=pid('award',next(o['entityId'] for o in operations if o['rowNumber']==h)) if h>=199 else rowtargets[h]['targetId']) for h,n in joins.items()],existingAwards=retained,priority=priority_rows,organizations=org_support,originalGaps=[dict(id=g['id'],outcome='recommendation_only' if any(x in g['id'] for x in ['definition','care','adopt']) else 'bounded_existing_controls',owner='Kelsey' if any(x in g['id'] for x in ['definition','care','adopt']) else 'Codex',trigger='separate definition/question scope' if any(x in g['id'] for x in ['definition','care','adopt']) else 'mapping PASS',nextAction='retain exact saved recommendations and provider conditions') for g in ledger['interviewGaps']],deferred=deferred,collisionCandidates=collisions,preserved=dict(heldEntities=310,holds=312,authority='original intake ledger and CURRENT_HANDOFF remain authoritative',researchQueue=26,appliedBatchReplay=False,oldSourceIds=217,oldPortals=21,oldApplicationGroups=4),identityLimit='Complete full-row vectors plus applied reviewed entity provenance; no name/URL-only merge; current source scope ends row417.',fieldMaskNormalization='Applied userEnteredValue,textFormatRuns replaces missing fields with blank. Expected links may be represented as native cell hyperlink or rich-text link without identity drift.')
    bundle=dict(provenance=provenance,catalog=catalog,shortlistRows=shortlist,connections=connections)
    save('mapping-reconciliation.json',reconciliation);save('mapping-fields.json',fields);save('mapping-criteria.json',criteria);save('mapping-connections.json',connection_evidence);save('mapping-bundle-proposal.json',bundle)
    save('mapping-pins.json',dict(schemaVersion=1,files={str(p.relative_to(ROOT)):filehash(str(p.relative_to(ROOT))) for p in [OUT/n for n in ['mapping-reconciliation.json','mapping-fields.json','mapping-criteria.json','mapping-connections.json','mapping-bundle-proposal.json']]},inputs={p:filehash(p) for p in ['docs/evidence/SCHOLARSHIP-INTAKE-ledger.json','docs/evidence/SCHOLARSHIP-INTAKE-proposed-writes.json','docs/evidence/SCHOLARSHIP-INTAKE-application-receipt.json','web/fixtures/p7/student-catalog.json','web/fixtures/shortlist/spreadsheet-shortlist-v1.json']}))
    print(json.dumps({'status':'PROPOSED_FOR_INDEPENDENT_REVIEW','counts':reconciliation['counts'],'connections':len(connections),'gpaRules':sum(c['minimumGpa'] is not None for c in criteria),'schoolRules':sum(bool(c['schoolTypes']) for c in criteria),'collisionCandidates':len(collisions)}))
if __name__=='__main__': build()
