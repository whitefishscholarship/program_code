#!/usr/bin/env python3
"""Offline acceptance and negative cases for the proposed R3 mapping."""
import copy, importlib.util, json
from pathlib import Path
spec=importlib.util.spec_from_file_location('r3',Path(__file__).with_name('build-r3-catalog.py'));m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
b=m.read('docs/evidence/r3-catalog/mapping-bundle-proposal.json');r=m.read('docs/evidence/r3-catalog/mapping-reconciliation.json');old=m.read('web/fixtures/p7/student-catalog.json');short=m.read('web/fixtures/shortlist/spreadsheet-shortlist-v1.json')
assert len(r['operations'])==len({x['operationId'] for x in r['operations']})==257
assert len(r['rows'])==len({x['currentRow'] for x in r['rows']})==416
assert len(r['existingAwards'])==192 and sum(x['catalogOnly'] for x in r['existingAwards'])==16
assert len(r['priority'])==42 and len({x['entityId'] for x in r['priority']})==38
assert len(b['catalog']['awards'])==len({a['publicId'] for a in b['catalog']['awards']})==411
assert b['catalog']['portals']==old['portals'] and b['catalog']['applicationGroups']==old['applicationGroups']
assert b['catalog']['sources'][:217]==old['sources']
assert b['shortlistRows'][:197]==short['rows']
new={a['publicId']:a for a in b['catalog']['awards']}
for a in old['awards']:
 assert new[a['publicId']]['eligibility']==a['eligibility']
 assert new[a['publicId']]['sourcePublicIds']==a['sourcePublicIds']
 assert new[a['publicId']]['application']==a['application']
 if next(x for x in r['existingAwards'] if x['publicId']==a['publicId'])['catalogOnly']:assert new[a['publicId']]==a
assert new['award-ead4360dadca']['cycle']['closes'] is None
assert 'not verified' in new['award-ead4360dadca']['cycle']['label']
assert all(c['answerId'] not in ['first_generation','foster_care'] for c in b['connections'])
assert all(c['awardId'] in new for c in b['connections'])
assert len({(c['awardId'],c['answerId']) for c in b['connections']})==len(b['connections'])
assert all(r['organizations'].values())
assert sum(x['publicationOutcome']=='parent_or_resource' for x in r['operations'])==1
assert any(d.get('answerId')=='financial_need' and d['outcome']=='changed_pending_review' for d in r['deferred'])
# Name, shared URL and historical position cannot substitute for full-row identity.
cells=[{'userEnteredValue':{'stringValue':x}} for x in ['same name','https://shared.test','condition A']]
other=copy.deepcopy(cells);other[2]['userEnteredValue']['stringValue']='condition B'
expected={2:cells,3:other}
assert m.join_rows(expected,[{'row':19,'cells':other},{'row':40,'cells':cells}])=={2:40,3:19}
for rows in [[{'row':2,'cells':cells}], [{'row':2,'cells':cells},{'row':3,'cells':cells}], [{'row':2,'cells':cells},{'row':3,'cells':other[:2]}]]:
 try:m.join_rows(expected,rows)
 except ValueError:pass
 else:raise AssertionError('Missing/duplicate/changed identity must fail closed')
# A newer unrelated in-range row is never joined by location or URL.
unrelated=copy.deepcopy(other);unrelated[2]['userEnteredValue']['stringValue']='newer unrelated edit'
try:m.join_rows(expected,[{'row':2,'cells':cells},{'row':3,'cells':unrelated}])
except ValueError:pass
else:raise AssertionError('Unrelated edit imported')
# Link target extraction preserves URL query/fragment and refuses ambiguous multi-link cells.
assert m.single_url({'hyperlink':'https://example.test/?q=one#two'})=='https://example.test/?q=one#two'
assert m.single_url({'textFormatRuns':[{'format':{'link':{'uri':u}}} for u in ['https://a.test','https://b.test']]}) is None
print('R3 mapping PASS: complete denominators, frozen relationships/criteria, source identity negatives, survivor, ambiguous dates/links, no parent leakage, unsupported definition/need deferrals.')
