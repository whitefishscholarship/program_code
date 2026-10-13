"""Local SD1 contract probes; no network, workbook writes or app changes."""
import datetime as dt
import hashlib
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
AS_OF = dt.datetime(2026, 10, 13, 15, 0, tzinfo=dt.timezone.utc)
ROWS = [2, 18, 45, 80, 115, 150, 185, 220, 255, 290, 325, 400]

def digest(value):
    return hashlib.sha256(json.dumps(value, ensure_ascii=False, separators=(',', ':')).encode()).hexdigest()

def stable(prefix, parts):
    return prefix + '_' + digest(parts)

def fact(value=None, state='unverified', refs=None, scope='unresolved', freshness='unknown'):
    return dict(value=value, state=state, evidenceIds=refs or [], scope=scope,
                observedAt='2026-09-11' if refs else None,
                freshness=freshness, acceptance='proposed')

def usable(f):
    return f['acceptance'] == 'accepted' and f['state'] == 'verified' and f['freshness'] == 'applicable'

def filter_result(f, wanted):
    return 'needs_checking' if not usable(f) else ('matches' if f['value'] == wanted else 'different')

def gpa_conflict(entry, answer):
    return answer is not None and usable(entry) and entry['value'] is not None and answer < entry['value']

def rule_result(values, operator):
    if operator == 'AND':
        return False if False in values else None if None in values else True
    if operator == 'OR':
        return True if True in values else None if None in values else False
    return None

def priority(status, route_usable=False, material_unknown=True, supported_mismatch=False):
    if supported_mismatch:
        return 'Later'
    if not usable(status):
        return 'Check first'
    if status['value'] in ('closed', 'unavailable'):
        return 'Later'
    if material_unknown:
        return 'Check first'
    if status['value'] == 'upcoming':
        return 'Prepare next'
    return 'Apply now' if status['value'] == 'active' and route_usable else 'Check first'

def due(last_success=None, status='unknown', expected_opening=None):
    if last_success is None:
        return AS_OF
    soon = expected_opening is not None and dt.timedelta(0) <= expected_opening-last_success <= dt.timedelta(days=30)
    return last_success + dt.timedelta(days=7 if status == 'active' or soon else 14)

def on_failure(previous_due, last_verified, attempt, already_retried=False):
    return dict(overdueDue=previous_due, lastVerified=last_verified,
                nextAttempt=attempt+dt.timedelta(days=14 if already_retried else 1),
                state='manual' if already_retried else 'retry')

# These curated interpretations are proposals supported by the listed source sections.
# No old cell snapshot is loaded. New-copy raw cells remain a separate observation.
SPECS = {
2: ('WHS sport connection; essay, coach reference and three paper copies are recorded, unverified.',
    'Current counselor instructions, deadline/cycle, school types and materials; source not inspected.', {}),
18: ('Pell qualification is a recorded prerequisite; 3.0 may be maintenance GPA, not an entry cutoff. Aid includes loans.',
     'Refresh Fall 2027 page; distinguish entry/renewal GPA, grant/loan components and route/window.',
     dict(needRequired='required', renewalGpa=3.0, fundingKind='mixed', cycleLabel='Fall 2027')),
45: ('Optional disability connection; no negative inference from an unanswered sensitive choice.',
     'Document differs from app locator; verify identity/version and full current public instructions.', {}),
80: ('Returning DCC athlete and coach nomination are supported as-of the saved source; incoming seniors need checking.',
     'Refresh award/general-form scope, returning status, GPA and coach nomination versus shared application.',
     dict(entryGpa=2.0, schoolTypes=['two_year'], nomination='required', applicantStage='college_student')),
115: ('Recorded Montana destination allows college/vo-tech options; two recipients are one award.',
      'Current program document, residency versus destination, cycle/priority date and permitted paths.', {}),
150: ('Recorded local senior/girl/need connection; M=Yes cannot distinguish required need from selection.',
      'Public applicable award criteria and window; do not open responses or infer need from the header.', {}),
185: ('Saved NGPA 2026 source supports aviation management/dispatcher study, membership and age; that cycle is closed.',
      'Next cycle and sponsor prerequisites/route; no authenticated portal review.',
      dict(cycleLabel='NGPA 2026', historicalCycleStatus='closed', historicalDeadline='2026-08-07T23:59:00-07:00', studyPaths=['certificate'], amount=5000)),
220: ('WAI2027 closed in 2026; this female-pilot LIFT award differs from the NGPA LIFT fund.',
      'Next offering, award-specific prerequisites, membership and supplements; portal unreviewed.',
      dict(cycleLabel='WAI2027', historicalCycleStatus='closed', historicalDeadline='2026-09-01T23:59:00-04:00', amount=5000)),
255: ('Associate/bachelor/certificate paths have saved support; age and dates conflict. Any does not prove all trade schools.',
      'Resolve named program, singular/plural routes, age 16–26 versus 18–26, need wording and current window.',
      dict(studyPaths=['associate','bachelor','certificate'], age=None, deadline=None)),
290: ('Saved source supports primary financial support and financial need; yearless window cannot prove open today.',
      'Bind app identity/route, current cycle/year and need selection; GED-only acceptance remains unsupported.',
      dict(needRequired='required', fundingKind='gift', studyPaths=['certificate','associate','bachelor'])),
325: ('2.7 GPA and $12,000 are historical child terms; parent opening and conflicting December dates are not child proof.',
      'Confirm named child offering/current terms and resolve parent December 30 versus FAQ December 31.',
      dict(entryGpa=2.7, amount=12000)),
400: ('Named past AOPA fund shares a parent with You Can Fly but remains a separate award; $10,000 is historical.',
      'Confirm child offering/funding/prerequisites and current dates; never inherit parent reopening.',
      dict(amount=10000)),
}

SOURCE_SPECS = {
18: [('related-material-additional-evidence','sources','official-related-carroll-current')],
80: [('dawson-field-evidence','awards',5),('dawson-field-evidence','formReconciliation',None)],
185: [('ngpa-field-evidence','awards',15),('ngpa-field-evidence','commonFacts',None)],
220: [('wai-field-evidence','awards',41),('wai-field-evidence','commonFacts',None)],
255: [('related-material-additional-evidence','sources','official-related-ndalliance'),('related-material-additional-evidence','sources','official-related-ndfaq'),('remaining-community-evidence','sources',11)],
290: [('related-material-additional-evidence','sources','official-related-sorlyd')],
325: [('aopa-field-evidence','awards',2),('aopa-field-evidence','commonFacts',None)],
400: [('aopa-field-evidence','awards',15),('aopa-field-evidence','commonFacts',None)],
}

def main():
    capture=json.loads((HERE/'records.json').read_text())
    catalog_path=ROOT/'web/fixtures/r3/catalog-v1.json'
    catalog=json.loads(catalog_path.read_text())['catalog']
    app_sources={s['publicId']:s for s in catalog['sources']}
    inputs={'web/fixtures/r3/catalog-v1.json':hashlib.sha256(catalog_path.read_bytes()).hexdigest()}
    evidence=[]; sources={}; records=[]; public=[]
    for block in capture['sheets'][0]['data']:
        row=block['startRow']+1; cells=block['rowData'][0]['values']
        raw={chr(65+i):c.get('formattedValue') for i,c in enumerate(cells)}
        matches=[a for a in catalog['awards'] if a['name']==raw['G']]
        assert len(matches)==1, ('nonunique app-name candidate',row)
        a=matches[0]; refs=[]
        for filename,key,index in SOURCE_SPECS.get(row,[]):
            path='docs/evidence/scholarship-intake/'+filename+'.json'
            content=(ROOT/path).read_bytes(); inputs[path]=hashlib.sha256(content).hexdigest()
            document=json.loads(content)
            obj=document[key]
            selected=obj if index is None else next(x for x in obj if x.get('sourceId')==index) if isinstance(index,str) else obj[index]
            eid=stable('evd',[a['publicId'],path,key,index,inputs[path]])
            refs.append(eid)
            evidence.append(dict(evidenceId=eid,awardId=a['publicId'],artifact=path,
                                 artifactSha256=inputs[path],locator=f'{key}'+('' if index is None else f'[{index}]'),
                                 selected=selected,
                                 sourceReceipts=[{k:s[k] for k in ['id','sourceId','url','observedAt','contentSha256'] if k in s} for s in document.get('sources',[]) if isinstance(s,dict) and s.get('id')!='official-ngpa-login'],
                                 reuse='as_of_only_no_current_acceptance'))
        urls=[]
        for c in cells:
            u=c.get('hyperlink')
            if u and u not in urls: urls.append(u)
        if row==185: urls.append('https://www.ngpa.org/applynow')
        if row==220: urls.append('https://www.wai.org/scholarship-listings')
        sids=[]
        for u in urls:
            sid=stable('src',['url',u]); sids.append(sid)
            if sid not in sources:
                sources[sid]=dict(sourceId=sid,url=u,aliases=[],accessResult='unreviewed',awardIds=[])
            sources[sid]['awardIds'].append(a['publicId'])
            sources[sid]['aliases']=sorted(set(sources[sid]['aliases']+[s['publicId'] for s in catalog['sources'] if s['url']==u]))
        identical=any(app_sources[x]['url'] in urls for x in a['sourcePublicIds'])
        identity='mapped_candidate' if identical or row==18 else 'held'
        fit,gap,values=SPECS[row]
        fields={k:fact() for k in ['needRequired','needSelection','entryGpa','renewalGpa','schoolTypes','studyPaths','renewal','reapplication','nomination','cycleStatus','deadline','amount','fundingKind','age']}
        for k,v in values.items():
            fields[k]=fact(v, 'verified' if v is not None else 'conflict',refs,
                           values.get('cycleLabel','source_as_of_2026-09-11'),
                           'historical' if row in [185,220,325,400] else 'refresh_needed')
        if row==255:
            fields['age']=fact(None,'conflict',refs,'2026–27 source','refresh_needed')
            fields['deadline']=fact(None,'conflict',refs,'unresolved cycle','refresh_needed')
        if row==18:
            fields['renewalGpa']['state']='unverified'
            fields['renewalGpa']['scope']='maintenance proposed from fresh N; saved synopsis does not resolve entry/renewal distinction'
        if row in [185,290]:
            fields['studyPaths']['state']='unverified'
            fields['studyPaths']['scope']='program-to-study-path mapping needs current field-specific review'
        # ND evidence proposes types only, not age/date/need or broad school eligibility.
        fields['needSelection']=fact()
        cycle_key=values.get('cycleLabel') if row in [18,185,220] else 'unresolved-slot'
        cycle_id=stable('cyc',[a['publicId'],cycle_key])
        rec=dict(awardId=a['publicId'],name=raw['G'],identityState=identity,
                 mappingBasis='unique app name plus fresh source locator' if identical else 'official saved Pell route transition' if row==18 else 'name-only candidate; locator changed/missing',
                 rowLocator=dict(spreadsheetId=capture['spreadsheetId'],sheetId=405588227,row=row),
                 sourceIds=sids,cycleId=cycle_id,cycleLabel=cycle_key,recorded=raw,
                 fields=fields,fitExplanation=fit+' Current eligibility is not confirmed.',
                 filterOutcomes=dict(needRequired=filter_result(fields['needRequired'],'required'),needSelection=filter_result(fields['needSelection'],'considered')),
                 priority=priority(fields['cycleStatus']),missingEvidence=gap,
                 review=dict(reviewId=stable('rev',[a['publicId'],'initial-current-cycle-review']),owner='Codex proposal review; Kelsey fact acceptance',
                             state='open',initialDueAt='2026-10-13',lastSuccessfulCheckAt=None,lastFactVerifiedAt=None,
                             hypotheticalNextAfterSuccess='2026-10-27',hypotheticalBasis='Only after a successful official check October 13; unknown/closed/distant upcoming =14 days'))
        records.append(rec)
        public.append(dict(publicId=a['publicId'],name=raw['G'],summary='Current requirements and availability need checking.',
            amount=dict(label='Amount not verified',minimum=None,maximum=None,currency=None,state='unknown'),
            eligibility=dict(audience='Eligibility not verified',minimumGpa=None,schoolTypes=[],focus=None),
            cycle=dict(status='unknown',label='Availability not verified',year=None,opens=None,closes=None,recurrence='unknown'),
            application=dict(mode='unknown',label='Application method not verified',url=None,groupPublicId=None,supplements='unknown'),
            sourcePublicIds=['source-'+sid.split('_')[1][:12] for sid in sids]))
    tests=[]
    def check(name,condition):
        assert condition,name
        tests.append(name)
    check('12 original fresh-copy sample rows exactly', [x['rowLocator']['row'] for x in records]==ROWS)
    check('award/cycle/review identities unique',all(len({r[k] for r in records})==12 for k in ['awardId','cycleId']) and len({r['review']['reviewId'] for r in records})==12)
    check('all facts have evidence or explicit unknown',all(f['evidenceIds'] or f['value'] is None for r in records for f in r['fields'].values()))
    check('no proposed or historical fact current-usable',not any(usable(f) for r in records for f in r['fields'].values()))
    check('no current open/closed inference from old cycle',all(r['priority']=='Check first' for r in records))
    check('Spear and Live Your Dream identity held', [r['rowLocator']['row'] for r in records if r['identityState']=='held']==[45,290])
    byrow={r['rowLocator']['row']:r for r in records}
    check('Pell maintenance GPA does not become entry rule',byrow[18]['fields']['entryGpa']['value'] is None and byrow[18]['fields']['renewalGpa']['value']==3)
    check('need Yes does not establish selection',all(r['fields']['needSelection']['value'] is None for r in records))
    check('ND age/deadline conflicts retained',byrow[255]['fields']['age']['state']=='conflict' and byrow[255]['fields']['deadline']['state']=='conflict')
    check('historical AOPA GPA does not exclude',not gpa_conflict(byrow[325]['fields']['entryGpa'],2.6))
    check('shared AOPA source does not merge children',len(set(byrow[325]['sourceIds']) & set(byrow[400]['sourceIds']))==1 and byrow[325]['awardId']!=byrow[400]['awardId'])
    # Explicitly fictional contract scenarios; no real interview response is stored.
    accepted=fact('active','verified',scope='synthetic',freshness='applicable'); accepted['acceptance']='accepted'
    considered=fact('considered','verified',scope='synthetic',freshness='applicable'); considered['acceptance']='accepted'
    required=fact('not_required','verified',scope='synthetic',freshness='applicable'); required['acceptance']='accepted'
    check('need eligibility independent of selection',filter_result(required,'required')=='different' and filter_result(considered,'considered')=='matches')
    check('unknown need remains visible',filter_result(fact(),'required')=='needs_checking')
    check('Apply now needs current accepted open plus usable route',priority(accepted,True,False)=='Apply now' and priority(accepted,False,False)=='Check first')
    future=dict(accepted,value='upcoming'); closed=dict(accepted,value='closed')
    check('future and closed priority branches',priority(future,False,False)=='Prepare next' and priority(closed)=='Later')
    check('material conflict stays Check first',priority(accepted,True,True)=='Check first')
    check('optional GPA blank is nonexcluding',not gpa_conflict(dict(accepted,value=3.0),None))
    check('explicit AND OR and unknown operator',rule_result([True,None],'OR') is True and rule_result([True,None],'AND') is None and rule_result([True,False],'unknown') is None)
    check('all uninitialized records due now; no fake success',due()==AS_OF and all(r['review']['lastSuccessfulCheckAt'] is None for r in records))
    check('all non-open statuses receive14days',all(due(AS_OF,s)==AS_OF+dt.timedelta(days=14) for s in ['unknown','closed','unavailable','upcoming']))
    check('open/near-future gets7days',due(AS_OF,'active')==AS_OF+dt.timedelta(days=7) and due(AS_OF,expected_opening=AS_OF+dt.timedelta(days=20))==AS_OF+dt.timedelta(days=7))
    failed=on_failure(AS_OF,None,AS_OF); manual=on_failure(AS_OF,None,AS_OF,True)
    check('failure preserves overdue and verification with one daily retry',failed['overdueDue']==AS_OF and failed['lastVerified'] is None and failed['nextAttempt']==AS_OF+dt.timedelta(days=1) and manual['state']=='manual' and manual['nextAttempt']==AS_OF+dt.timedelta(days=14))
    check('public-only conservative projection',all(set(x)=={'publicId','name','summary','amount','eligibility','cycle','application','sourcePublicIds'} for x in public))
    payload=dict(schemaVersion=1,status='local_design_pilot_only',asOf='2026-10-13',
                 counts=dict(records=12,sourceResources=len(sources),evidenceRecords=len(evidence),identityHolds=2,currentAcceptedFacts=0),
                 inputPins=inputs,records=records,sources=list(sources.values()),evidence=evidence,
                 firstSD2Batch=[byrow[n]['awardId'] for n in [18,255,400]],publicProjection=public)
    (HERE/'pilot.json').write_text(json.dumps(payload,ensure_ascii=False,indent=2)+'\n')
    lines=['# SD1 representative pilot','', '12 fresh-copy records; no current accepted scholarship facts. All current-cycle priorities are Check first.',
           'Initial review due: October 13, 2026. After a future successful official check, ordinary next due: October 27; near announced opening/open: October 20.',
           'These dates are planning proposals; no runner or queue has been activated.','',
           '| New-copy row / award ID | Identity and student use | Missing evidence |','| --- | --- | --- |']
    for r in records:
        lines.append(f"| {r['rowLocator']['row']} / {r['awardId']}<br>{r['name']} | {r['identityState']}; {r['fitExplanation']} | {r['missingEvidence']} |")
    lines += ['', 'Two past closed cycles are preserved separately: NGPA2026 and WAI2027. Neither establishes the next cycle.',
              'The full field envelopes, raw fresh-copy values, precise saved evidence pointers and source-ID crosswalk candidates are in pilot.json.', '',
              'First SD2 batch, exactly three complex identities in this order:']
    for n in [18,255,400]:
        r=byrow[n]; lines.append(f"- {r['awardId']} — {r['name']} (row {n} is only a re-identification hint). {r['missingEvidence']}")
    lines += ['', 'SD2 remains unstarted. Proposed source scope: the exact Carroll /pell-promise page, NDAlliance /scholarship/ and /scholarships/, and AOPA program page plus the already named 2026 FAQ. Recheck identities and source scope before any future authorized reads; application/logins and extra award discovery stay excluded. Held identity failures get explicit outcomes; do not substitute another award or expand the batch.', '',
              'New-copy total population, whole-ledger denominator and other tabs remain uninspected. Establish the separately selected SD2 denominator before claiming whole-workbook completeness.']
    (HERE/'PILOT.md').write_text('\n'.join(lines)+'\n')
    result=dict(outcome='PASS',checks=len(tests),passed=tests,records=12,currentAcceptedFacts=0,pilotSha256=hashlib.sha256((HERE/'pilot.json').read_bytes()).hexdigest())
    (HERE/'pilot-validation.json').write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps(result))

if __name__=='__main__': main()
