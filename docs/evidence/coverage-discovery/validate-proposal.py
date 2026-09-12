"""Read-only accounting and preservation checks for this proposal."""
import collections
import hashlib
import json
import subprocess
from pathlib import Path

ROOT=Path(__file__).resolve().parents[3]
OUT=ROOT/'docs/evidence/coverage-discovery'
def read(path):return json.loads((ROOT/path).read_text())
def sha(path):return hashlib.sha256((ROOT/path).read_bytes()).hexdigest()
def git(*args):return subprocess.check_output(['git',*args],cwd=ROOT)
d=read('docs/evidence/coverage-discovery/proposal.json')
g=read('docs/evidence/coverage-discovery/grounding.json')
for p,h in g['inputHashes'].items():
    # Handoff/kickoff are deliberately additive continuation changes; ground their old blobs.
    if p in ['docs/CURRENT_HANDOFF.md','docs/kickoffs/SCHOLARSHIP-INTAKE-RESUME.md']:
        assert hashlib.sha256(git('show',g['checkpoint']+':'+p)).hexdigest()==h,p
    else:assert sha(p)==h,p
for f in read('docs/evidence/HISTORICAL-SCHOLARSHIP-RECONCILIATION-review.json')['candidateFiles']:
    assert sha(f['path'])==f['sha256'],f['path']
for suffix in ['ledger','local-review','proposed-writes','application-receipt']:
    p='docs/evidence/SCHOLARSHIP-INTAKE-'+suffix+'.json'
    assert (ROOT/p).read_bytes()==git('show','cf835c6:'+p),p
for c in ['0ce5419','cf835c6','c63d252','a888df3']:
    subprocess.run(['git','merge-base','--is-ancestor',c,'HEAD'],cwd=ROOT,check=True)

actual=json.loads(subprocess.check_output(['node','--import','tsx','--input-type=module','-e',
    "const m=await import('./src/lib/interviewQuestions.ts');console.log(JSON.stringify(m.default??m))"],cwd=ROOT/'web'))
assert actual==read('docs/evidence/coverage-discovery/question-definitions.json')
expected={x['id'] for k in ['ACTIVITY_QUESTIONS','SPECIAL_CRITERIA'] for x in actual[k]}
expected|={'gpa','residenceState','educationalStatus','targetSchoolTypes','collegeAccepted','gapYear','volunteerHours','financial_need','sensitiveCriteriaSkipped'}
expected|={'application-mode-'+x for x in ['automatic_consideration','selectable_children','eligibility_matched','shared_with_supplements','direct_per_award','offline']}
assert len(d['controls'])==57 and {c['id'] for c in d['controls']}==expected
for c in d['controls']:
    assert c['choices'] is not None
    assert set(c['savedAwardIds'])<=set(d['savedAwardNames'])
    assert len(c['savedAwardIds'])==len(set(c['savedAwardIds']))
    expected_connections=[x for x in d['connections'] if x['answerId']==c['id']]
    assert c['savedConnectionIds']==[x['id'] for x in expected_connections]
    if c['group']!='other_rendered_control' or c['id']=='financial_need':
        assert c['savedAwardIds']==sorted({x['awardId'] for x in expected_connections})
assert d['connections']==read('web/fixtures/relevance/interview-relevance-v1.json')['connections']
h=read('docs/evidence/HISTORICAL-SCHOLARSHIP-RECONCILIATION.json')
unresolved={r['id'] for r in h['rows'] if r['status'] not in ['blank','reference','represented','represented_resource']}
assert len(d['historicalRouting'])==len(unresolved)==83
assert {r['historicalId'] for r in d['historicalRouting']}==unresolved
assert len(h['rows'])==1780 and len({r['id'] for r in h['rows']})==1780
assert sum(h['counts'].values())==1780
source_ids={s['id'] for s in d['sources']}; program_ids={p['id'] for p in d['programs']}
assert len(source_ids)==len(d['sources']) and len(program_ids)==len(d['programs'])
for r in d['historicalRouting']:
    assert r['owner'] and r['trigger'] and r['nextAction']
    assert set(r['evidenceIds'])<=source_ids and set(r['programIds'])<=program_ids
    assert r['countAsReadyAddition'] is False
for p in d['programs']:
    assert p['writeReady'] is False and p['runtimeAccepted'] is False
    assert p['evidenceIds'] and set(p['evidenceIds'])<=source_ids
    assert p['kind'] and p['reach'] and p['cycle'] and p['unknowns']
    assert set(p['existingChoiceIds'])<=expected
intake=read('docs/evidence/SCHOLARSHIP-INTAKE-ledger.json')
assert {x['id'] for x in d['existingRecommendations']}=={x['id'] for x in intake['interviewGaps']}
for g in d['existingRecommendations']:
    old=next(x for x in intake['interviewGaps'] if x['id']==g['id'])
    assert [x['entityId'] for x in g['supportingUniqueEntities']]==old['supportingEntityIds']
    assert g['count']==len(set(old['supportingEntityIds']))
counts=d['counts']
assert counts['selectedHistoricalOccurrences']==sum(bool(r['evidenceIds']) for r in d['historicalRouting'])==20
assert counts['carriedHistoricalOccurrences']==63
assert counts['broadReachNamedPrograms']==sum(p['reach']=='verified_broad_conditional' and p['kind']=='named_award_program' for p in d['programs'])==6
assert counts['heldIntakeEntities']==sum(e['disposition']=='hold' for e in intake['entities'])==310
assert counts['holdRecords']==len(intake['holds'])==312
assert counts['savedConnectedAwards']==len({x['awardId'] for x in d['connections']})==129
assert counts['savedConnections']==len(d['connections'])==206
assert counts['writeReadyAdditions']==counts['newRuntimeConnections']==0
assert not git('diff','0ce5419','--','web','AGENTS.md','docs/BUILD_STATE.json','docs/SCHOLARSHIP_SYSTEM_BUILD_PLAN.md')
subprocess.run(['git','diff','--check'],cwd=ROOT,check=True)
print('PASS:57 controls,83 historical routes,20 selected/63 carried,5 recommendations,26 research records,6 broad conditional programs,zero executable additions;frozen inputs preserved')
