"""Reproduce the saved-input M1 inventory. No network calls or source mutations."""
import collections
import hashlib
import ipaddress
import json
import pathlib
import sys
import urllib.parse

ROOT = pathlib.Path(__file__).resolve().parents[3]
OUT = pathlib.Path(__file__).with_name('inventory.json')
INPUTS = {
    'web/fixtures/r3/catalog-v1.json': '9a4f8c8c0e3990fcaa182f52595710ee0404c11572f69512b4254bb0f6b72908',
    'docs/evidence/r5-research/results.json': 'b559cf798e624259d1ce5acd16fa793e2b215e9f8a53d40885086d8726eca848',
}


def digest(value):
    return hashlib.sha256(value).hexdigest()


def read_input(name):
    raw = (ROOT / name).read_bytes()
    assert digest(raw) == INPUTS[name], f'Changed pinned input: {name}; reconcile explicitly'
    return json.loads(raw)


def classify(url, architecture='', access='', authority='organizer_recorded_unverified'):
    if not url:
        return 'manual', 'No public URL; retain offline review without provider contact'
    u = urllib.parse.urlsplit(url)
    host = (u.hostname or '').lower()
    if u.scheme not in ('http', 'https') or not host or u.username or u.password:
        return 'manual', 'Unsupported URL or embedded credentials'
    try:
        ip = ipaddress.ip_address(host)
        if not ip.is_global:
            return 'manual', 'Non-public address'
    except ValueError:
        if host == 'localhost' or host.endswith(('.local', '.internal')):
            return 'manual', 'Non-public hostname'
    if architecture == 'form_only' or host in ('forms.gle', 'forms.office.com') or '/forms/' in u.path or '/spreadsheets/' in u.path:
        return 'manual', 'Form or workbook surface excluded; no interaction or workbook access'
    if access in ('authenticated', 'offline') or architecture == 'login_application_portal' or any(x in u.path.lower() for x in ('/login', '/signin', '/sign-in', '/oauth', '/authorize', '/submit')):
        return 'manual', 'Authentication/application surface; preserve locator without entering workflow'
    if authority in ('secondary_discovery_only', 'school_discovery_index_only') or architecture == 'external_marketplace':
        return 'manual', 'Discovery-only source cannot establish award opening or rules'
    if architecture in ('paginated_catalog', 'directory_hub', 'matching_portal'):
        return 'public_signal_candidate', 'Registered parent only; no pagination or child discovery; award-specific evidence required'
    return 'public_signal_candidate', 'Registered public URL candidate; current accessibility and award-specific content unverified'


catalog = read_input('web/fixtures/r3/catalog-v1.json')['catalog']
research = read_input('docs/evidence/r5-research/results.json')
assert len(catalog['awards']) == 411 and len(research['programs']) == 26
assert len({a['publicId'] for a in catalog['awards']}) == 411
assert set(research['programs']) == set(research['scope']['programIds'])
catalog_sources = {s['publicId']: s for s in catalog['sources']}
research_sources = {s['id']: s for s in research['sources']}
registered = {}


def register(url, locator, architecture='', access='', authority='organizer_recorded_unverified'):
    route, reason = classify(url, architecture, access, authority)
    if not url:
        return {'url': None, 'route': route, 'reason': reason, 'sourceLocator': locator}
    # Keep query and fragment identity exactly; group network requests only by the URL without its fragment.
    transport = urllib.parse.urldefrag(url)[0]
    fid = 'url-' + digest(transport.encode())[:16]
    record = registered.setdefault(fid, {
        'id': fid, 'url': transport, 'originalUrls': [], 'sourceLocators': [],
        'authorityClasses': [], 'routes': [], 'recordIds': [], 'fetchAuthorized': False,
    })
    for field, val in [('originalUrls', url), ('sourceLocators', locator), ('authorityClasses', authority), ('routes', route)]:
        if val not in record[field]:
            record[field].append(val)
    return {'url': url, 'fetchId': fid, 'route': route, 'reason': reason, 'sourceLocator': locator}


records = []
for award in catalog['awards']:
    links = []
    for sid in award['sourcePublicIds']:
        assert sid in catalog_sources, sid
        s = catalog_sources[sid]
        links.append(register(s['url'], 'web/fixtures/r3/catalog-v1.json#source:' + sid, s['architecture'], s['access']))
    # Application URLs remain locators. They are never silently added as fetch targets.
    records.append({
        'id': award['publicId'], 'kind': 'catalog_award', 'name': award['name'],
        'inputLocator': 'web/fixtures/r3/catalog-v1.json#award:' + award['publicId'],
        'savedCycle': award['cycle'], 'sourcePublicIds': award['sourcePublicIds'],
        'sources': links, 'applicationLocator': award['application'],
        'route': 'pending', 'excluded': False, 'monitorObservation': None,
        'lastAttemptAt': None, 'lastSuccessfulCheckAt': None, 'nextDueAt': None,
        'initialDueRule': 'Due at approved activation; no successful check is inferred from saved input',
        'reviewStatus': 'unverified_saved_input', 'reviewOwner': 'Codex',
        'awardEvidenceRule': 'Exact named child evidence required; URL sharing does not confer a common cycle or rule',
    })

for key, p in research['programs'].items():
    links = []
    for sid in p['sourceEvidenceIds']:
        assert sid in research_sources, sid
        s = research_sources[sid]
        links.append(register(s['url'], 'docs/evidence/r5-research/results.json#source:' + sid, authority=s['authority']))
    comp = p['snapshotComparison']
    for aid in comp['candidateAwardIds']:
        assert aid in {a['publicId'] for a in catalog['awards']}
    records.append({
        'id': 'lead:' + key, 'originalLeadId': key, 'kind': 'research_lead', 'name': p['name'],
        'inputLocator': 'docs/evidence/r5-research/results.json#program:' + key,
        'sources': links, 'savedCycle': p['cycle'], 'savedDisposition': p['disposition'],
        'supportedNamedAwardIdentity': p['supportedNamedAwardIdentity'], 'relationship': p['relationship'],
        'overlap': {'candidateAwardIds': comp['candidateAwardIds'], 'candidatePortalIds': comp['candidatePortalIds'],
                    'candidateEntityIds': comp['candidateEntityIds'], 'conclusion': comp['result'],
                    'mergeAuthorized': False, 'treatment': 'Keep this lead ID; shared parent or candidate match is not a proven duplicate child'},
        'historicalIds': p['historicalIds'], 'savedEvidenceIds': p['sourceEvidenceIds'],
        'route': 'pending', 'excluded': False, 'monitorObservation': None,
        'lastAttemptAt': None, 'lastSuccessfulCheckAt': None, 'nextDueAt': None,
        'initialDueRule': 'Due at approved activation; manual reminders remain due every 14 days',
        'reviewStatus': 'held_not_a_ready_addition', 'reviewOwner': p['researchOwner'],
        'preservedResearchTrigger': p['resumeTrigger'], 'scopeDecisionOwner': p['scopeDecisionOwner'],
        'separateFollowup': key in ('etv', 'fish'),
    })

# A source with any saved no-fetch route remains manual even if another row labels it public.
for source in registered.values():
    source['route'] = 'manual' if 'manual' in source['routes'] else 'public_signal_candidate'
    for k in ('originalUrls', 'sourceLocators', 'authorityClasses', 'routes'):
        source[k].sort()

for record in records:
    eligible = [l for l in record['sources'] if l.get('fetchId') and registered[l['fetchId']]['route'] == 'public_signal_candidate']
    if record.get('separateFollowup'):
        record['route'] = 'manual_separate_followup'
    elif record.get('originalLeadId') == 'aqhf':
        record['route'] = 'manual_known_block'
    elif eligible:
        record['route'] = 'public_signal_candidate'
    else:
        record['route'] = 'manual_source_review'
    record['registeredFetchIds'] = sorted({l['fetchId'] for l in eligible}) if record['route'] == 'public_signal_candidate' else []
    for fid in record['registeredFetchIds']:
        registered[fid]['recordIds'].append(record['id'])
    record['reviewTrigger'] = 'Approved baseline and then 14-day due review; unresolved/source failure remains visible'

for s in registered.values():
    s['recordIds'].sort()
    s['scheduledCandidate'] = bool(s['recordIds'])

used_source_ids = {sid for a in catalog['awards'] for sid in a['sourcePublicIds']}
support = [{'sourcePublicId': s['publicId'], 'url': s['url'], 'architecture': s['architecture'],
            'access': s['access'], 'awardReferenced': s['publicId'] in used_source_ids,
            'role': 'award_source' if s['publicId'] in used_source_ids else 'preserved_catalog_support_not_an_extra_award'}
           for s in catalog['sources']]
sources = sorted(registered.values(), key=lambda s: s['id'])
fetches = [s for s in sources if s['scheduledCandidate']]
inventory = {
    'schemaVersion': 1, 'step': 'M1', 'basis': 'saved_inputs_only_no_live_scholarship_verification',
    'sourceCheckpoint': '8b8a1d0b4295c828428b371a7c5909e7beb573fb',
    'inputPins': [{'path': p, 'sha256': h} for p, h in INPUTS.items()],
    'policy': {'fetchAuthorized': False, 'exclusionsRequireEvidence': True, 'urlSharingIsNotAwardIdentity': True,
               'applicationLocatorsAreNotFetchTargets': True, 'noRecursiveDiscovery': True,
               'savedCycleDoesNotSetCurrentOpenStatus': True, 'unknownAuthorityCannotEstablishOpening': True},
    'counts': {'records': len(records), 'catalogAwards': 411, 'researchLeads': 26,
               'catalogSourcesAccountedFor': len(support), 'portalsPreserved': len(catalog['portals']),
               'applicationGroupsPreserved': len(catalog['applicationGroups']),
               'routeCounts': dict(sorted(collections.Counter(r['route'] for r in records).items())),
               'excluded': 0, 'confirmedDuplicateChildMerges': 0,
               'leadRecordsWithCandidateAwardOrPortalOverlap': sum(bool(r.get('overlap', {}).get('candidateAwardIds') or r.get('overlap', {}).get('candidatePortalIds')) for r in records),
               'uniqueRegisteredUrls': len(sources), 'uniqueScheduledCandidateUrls': len(fetches),
               'uniqueScheduledCandidateHosts': len({urllib.parse.urlsplit(s['url']).hostname for s in fetches}),
               'sharedFetchUrls': sum(len(s['recordIds']) > 1 for s in fetches),
               'sourceCallsPerformed': 0, 'monitorSuccessfulChecks': 0},
    'records': sorted(records, key=lambda r: r['id']), 'registeredSources': sources,
    'catalogSourceAccounting': support,
    'preservedPortalIds': [p['publicId'] for p in catalog['portals']],
    'preservedApplicationGroupIds': [p['publicId'] for p in catalog['applicationGroups']],
    'historicalLinkAccounting': [{'id': h['historicalId'], 'leadIds': ['lead:' + k for k in h['programIds']]} for h in research['historicalLinks']],
}
assert len({r['id'] for r in records}) == 437
assert len(support) == 436 and len(inventory['historicalLinkAccounting']) == 20
assert sum(inventory['counts']['routeCounts'].values()) == 437
payload = (json.dumps(inventory, indent=2, ensure_ascii=False) + '\n').encode()
if sys.argv[1:] == ['--check']:
    assert OUT.read_bytes() == payload, 'Inventory differs; inspect input/policy drift'
elif not sys.argv[1:]:
    OUT.write_bytes(payload)
else:
    raise SystemExit('Use no argument to generate, or --check to verify')
print(json.dumps({'sha256': digest(payload), **inventory['counts']}))
