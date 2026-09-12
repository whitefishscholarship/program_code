"""Build local proposal views from frozen inputs and curated research; no network/writes to sources."""
import collections
import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / 'docs/evidence/coverage-discovery'
def read(p):
    return json.loads((ROOT / p).read_text())
def save(name, value):
    (OUT / name).write_text(json.dumps(value, indent=2) + '\n')

historical = read('docs/evidence/HISTORICAL-SCHOLARSHIP-RECONCILIATION.json')
intake = read('docs/evidence/SCHOLARSHIP-INTAKE-ledger.json')
mapping = read('docs/evidence/PLAN-REV14-mapping.json')
publication = read('web/fixtures/relevance/interview-relevance-v1.json')
catalog = read('web/fixtures/p7/student-catalog.json')
shortlist = read('web/fixtures/shortlist/spreadsheet-shortlist-v1.json')
inventory = json.loads((OUT / 'question-definitions.json').read_text())
research = json.loads((OUT / 'research.json').read_text())
names = {a['publicId']: a['name'] for a in catalog['awards']}
connections = publication['connections']

controls = []
for group in ['ACTIVITY_QUESTIONS', 'SPECIAL_CRITERIA']:
    for item in inventory[group]:
        enabled = [x for x in connections if x['answerId'] == item['id']]
        controls.append(dict(item, group=group, choices=['selected', 'unselected_unknown'],
            savedAwardIds=sorted({x['awardId'] for x in enabled}),
            savedConnectionIds=[x['id'] for x in enabled],
            gapType='missing_evidence_or_connection' if not enabled else 'current_saved_connection',
            supplyConclusion='Current broad usable supply unknown; saved connections are not a fresh provider census.',
            proposal='Retain as optional; only supported positive relevance; exact conditions on award cards.'))

def control(id, label, choices, effect, awardids=(), proposal=None):
    controls.append(dict(id=id,label=label,group='other_rendered_control',choices=choices,
        currentEffect=effect,savedAwardIds=sorted(set(awardids)),savedConnectionIds=[],
        gapType='no_current_effect' if effect == 'none' else 'current_saved_connection',
        proposal=proposal or 'Preserve current behavior; any implementation requires separate selection.'))

control('gpa','Unweighted GPA',{'numericRange':[0,4]},'saved_GPA_shortlisting',
    [r['targetId'] for r in shortlist['rows'] if r['targetKind']=='award' and r['minimumGpa'] is not None])
control('residenceState','State of residence',inventory['RESIDENCE_STATES'],'none',proposal='Propose optional/collapsed until reviewed geographical mappings exist; no new filter in this proposal.')
control('educationalStatus','Current educational status',inventory['EDUCATIONAL_STATUSES'],'none',proposal='Move to optional details; label no filtering effect until separately reviewed mapping exists. The proposed core is GPA and target school type.')
control('targetSchoolTypes','Target school type',inventory['TARGET_SCHOOL_TYPES'],'saved_school_shortlisting',
    [r['targetId'] for r in shortlist['rows'] if r['targetKind']=='award' and r['schoolTypes']])
for id,label in [('collegeAccepted','Accepted to college?'),('gapYear','Planning a gap year?')]:
    control(id,label,[True,False,'prefer_not_to_answer',None],'none',proposal='Move to optional details or defer display in a selected future release; existing controls unchanged now.')
control('volunteerHours','Volunteer hours',inventory['VOLUNTEER_HOURS']+[None],'none',proposal='Keep conditional on service or omit from proposed core; service itself already supplies positive relevance.')
control('financial_need','Acute financial need',['selected','unselected_unknown'],'positive_saved_relevance',
    [x['awardId'] for x in connections if x['answerId']=='financial_need'],
    'Prioritize ordinary-need discovery wording; never treat it as proof of provider-defined financial need.')
controls[-1]['savedConnectionIds']=[x['id'] for x in connections if x['answerId']=='financial_need']
for mode in ['automatic_consideration','selectable_children','eligibility_matched','shared_with_supplements','direct_per_award','offline']:
    control('application-mode-'+mode,mode,['selected','unselected'],'application_preference_order_only',
        [r['targetId'] for r in shortlist['rows'] if r['targetKind']=='award' and r.get('applicationPreference')==mode])
control('sensitiveCriteriaSkipped','Prefer not to answer sensitive questions',[True,False],'clear_sensitive_selections_no_exclusion')

special_proposals={
 'first_generation':'Clarify variable provider definitions; parent degree completion is not interchangeable with first in family to attend.',
 'foster_care':'Retain optional entry; offer adoption/kinship/guardianship follow-up only for supported selected programs. Exact ages and durations stay on cards.',
 'public_service':'Already includes early education; add optional Education / Teaching choice for general teaching, preserving existing public-service alternatives.',
 'arts_humanities':'Music education is already explicit; a general teaching option should not remove this supported path.',
 'mensa':'Zero saved connection does not establish missing scholarships or membership eligibility. Provider sponsorship does not prove membership is required.',
 'aviation_management':'Zero saved connection; intake contains separately reviewed aviation proposals. Connect selected published awards before adding a question.',
}
for c in controls:
    if c['id'] in special_proposals:c['proposal']=special_proposals[c['id']]

by_entity={e['id']:e for e in intake['entities']}
gaps=[]
for g in intake['interviewGaps']:
    supports=[]
    for id in g['supportingEntityIds']:
        e=by_entity[id]
        supports.append({'entityId':id,'name':e['name'],'sourceIds':e.get('officialEvidenceIds',[]),
                         'frozenDisposition':e['disposition'],
                         'evidenceBasis':'Previously reviewed intake evidence; not freshly reverified here'})
    gaps.append({'id':g['id'],'frozenLedgerPointer':'docs/evidence/SCHOLARSHIP-INTAKE-ledger.json#interviewGaps/'+g['id'],
                 'supportingUniqueEntities':supports,'count':len(supports),'proposalStatus':'carry_recommendation_only'})

updates=research['historicalDecisions']
routes=[]
for r in historical['rows']:
    if r['status'] in ['blank','reference','represented','represented_resource']:continue
    u=updates.get(r['id'])
    routes.append({'historicalId':r['id'],'name':r.get('name') or r.get('resourceLabel') or r.get('category') or 'Unnamed historical resource',
        'priorStatus':r['status'],'priorEntityIds':r.get('priorEntityIds',[]),
        'priorDecisionPointer':'docs/evidence/HISTORICAL-SCHOLARSHIP-RECONCILIATION.json#'+r['id'],
        'proposalDisposition':u['disposition'] if u else 'carry_existing_hold_or_bounded_followup',
        'programIds':u['programIds'] if u else [],'evidenceIds':u['evidenceIds'] if u else [],
        'rationale':u['rationale'] if u else r['rationale'],
        'owner':'next selected research agent; Kelsey owns scope decisions',
        'trigger':u.get('trigger','Selected continuation with current public evidence') if u else 'Existing recorded hold trigger, or explicit selection of this historical discrepancy',
        'nextAction':u['nextAction'] if u else r.get('nextAction','Resolve public identity and audience under a bounded selection; preserve prior decisions.'),
        'countAsReadyAddition':False})

programs=research['programs']
master=read('docs/evidence/HISTORICAL-SCHOLARSHIP-RECONCILIATION-input.json')['masters']
def normalize(s):return re.sub(r'[^a-z0-9]','',s.lower())
for p in programs:
    p['comparisonCandidates']=[{'row':m['row'],'name':m['name']} for m in master
        if normalize(m['name'])==normalize(p['name']) or any(u in m['urls'] for u in p.get('officialUrls',[]))]
    p['comparisonLimit']='Name and exact URL comparisons nominate only; no unmatched name proves absence or survivor identity.'
    p['writeReady']=False
    p['runtimeAccepted']=False

candidate_additions=[p for p in programs if p['proposalDisposition']=='candidate_for_later_review']

data={'schemaVersion':1,'id':'SCHOLARSHIP-COVERAGE-PROPOSAL-1','status':'local_proposal_prepared_review_record_controls_completion',
 'inputCheckpoint':'0ce54195cf0cf0d64bd2a4752619997880ad45a2','observationDate':'2026-09-12',
 'authority':'Selected resume kickoff and current user instruction; local/read-only proposal only',
 'sourceOfTruth':'This proposal covers new research and routing only. Frozen intake ledger and historical crosswalk retain their existing decisions.',
 'counts':{'historicalRows':1780,'historicalOccurrences':228,'unresolvedHistoricalOccurrences':len(routes),
    'selectedHistoricalOccurrences':sum(bool(r['evidenceIds']) for r in routes),
    'carriedHistoricalOccurrences':sum(not r['evidenceIds'] for r in routes),
    'controls':len(controls),'specialChoices':38,'activityChoices':4,'savedConnections':len(connections),
    'savedConnectedAwards':len({x['awardId'] for x in connections}),'savedCatalogAwards':len(names),
    'heldIntakeEntities':sum(e['disposition']=='hold' for e in intake['entities']),'holdRecords':len(intake['holds']),
    'existingRecommendations':len(gaps),'newProgramResearchRecords':len(programs),'candidateAdditionsForLaterReview':len(candidate_additions),
    'broadReachNamedPrograms':sum(p['reach']=='verified_broad_conditional' and p['kind']=='named_award_program' for p in programs),
    'writeReadyAdditions':0,'newRuntimeConnections':0},
 'controls':controls,'connections':connections,'savedAwardNames':names,
 'existingRecommendations':gaps,'historicalRouting':routes,'programs':programs,'candidateAdditions':candidate_additions,
 'sources':research['sources'],'discoveryBacklog':research['discoveryBacklog'],
 'limits':['No current Master freshness audit; saved416 records only','No full provider catalog enumeration except explicit page-level accounting',
 'Broad reach counts identify named programs with evidence of broad geography; not confirmed open or universally eligible awards',
 'No new copied workbook,source write,publication,runtime edit,provider contact,application interaction,paid access or monitoring',
 'No financial,medical,legal or sensitive eligibility inference from a broad category; skipped/unselected remains unknown']}
save('proposal.json',data)

lines=['# Current interview coverage matrix','',
 'Generated from the pinned local code and revision225 publications. Counts are unique saved award IDs per control; overlap between rows is expected. They are not fresh official eligibility or broad-reach counts.',
 '', '| Control | Saved distinct awards | Evidence/connection gap | Proposal |','| --- | ---: | --- | --- |']
for c in controls:
    lines.append(f"| `{c['id']}` — {c['label']} | {len(c['savedAwardIds'])} | {c['gapType']} | {c['proposal']} |")
lines+=['','Full enum choices, exact award IDs, names and connection IDs: `proposal.json`. The sensitive-skip control is counted once although rendered on two steps. Academic selects are one logical control each; application modes are six checkboxes.']
(OUT/'interview-matrix.md').write_text('\n'.join(lines)+'\n')
lines=['# Historical continuation crosswalk','', 'All83 unresolved occurrences remain accountable. This is an overlay referencing the frozen historical crosswalk; it does not rewrite prior acceptance.', '',
 '| Source | Entry | Proposal disposition | Next action |','| --- | --- | --- | --- |']
for r in routes:lines.append(f"| `{r['historicalId']}` | {r['name'].replace(chr(10),' ')} | {r['proposalDisposition']} | {r['nextAction']} |")
(OUT/'historical-routing.md').write_text('\n'.join(lines)+'\n')
print(json.dumps(data['counts'],indent=2))
