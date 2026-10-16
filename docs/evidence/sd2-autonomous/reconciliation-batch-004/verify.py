"""Read-only selected-batch preservation, exact occurrence and evidence verification."""
from pathlib import Path
import collections
import datetime
import hashlib
import json
import os
import subprocess
import sys

P = Path(__file__).resolve().parent
R = P.parents[3]
ENTRY = '1d463dbc5e73bf26c4f9d84f0eb371b8229b32b1'
PREFIX = str(P.relative_to(R)) + '/'
MUTABLE = {'docs/CURRENT_HANDOFF.md', 'docs/evidence/sd2-autonomous/NEXT_SESSION.md',
           'docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md'}
git = lambda *a: subprocess.check_output(['git', *a], cwd=R)
sha = lambda b: hashlib.sha256(b).hexdigest()
canon = lambda x: json.dumps(x, sort_keys=True, separators=(',', ':'), ensure_ascii=False).encode()
load = lambda p: json.loads(p.read_text())
started = datetime.datetime.now(datetime.timezone.utc).isoformat()
assert git('branch', '--show-current').decode().strip() == 'codex/plan-student-data-maintenance'
protected = 0
for item in git('ls-tree', '-rz', ENTRY).split(b'\0'):
    if not item:
        continue
    meta, path = item.decode().split('\t'); mode, kind, blob = meta.split()
    if path in MUTABLE:
        continue
    f = R / path; raw = os.readlink(f).encode() if mode == '120000' else f.read_bytes()
    assert hashlib.sha1(b'blob ' + str(len(raw)).encode() + b'\0' + raw).hexdigest() == blob, path
    if mode in ['100644', '100755']:
        assert bool(f.stat().st_mode & 0o111) == (mode == '100755'), path
    protected += 1
for path in MUTABLE:
    raw = (R / path).read_bytes(); old = git('show', ENTRY + ':' + path)
    if path.endswith('STUDENT_DATA_AND_MAINTENANCE_PLAN.md'):
        a = b'<!-- SD2-BATCH-004-START -->\n'; z = b'<!-- SD2-BATCH-004-END -->\n'
        assert raw.count(a) == raw.count(z) == 1
        assert raw[:raw.index(a)] + raw[raw.index(z) + len(z):] == old
    else:
        assert raw.endswith(old), path
untracked = set(git('ls-files', '--others', '--exclude-standard').decode().splitlines())
assert untracked <= {PREFIX + 'final-manifest.json', PREFIX + 'review.json'}, untracked
paths = set(git('diff', '--name-only', ENTRY).decode().splitlines()) | untracked
assert all(x in MUTABLE or x.startswith(PREFIX) for x in paths), paths
s = load(P / 'selection.json'); e = load(P / 'entry-audit.json')
assert s['entryCommit'] == e['entryCommit'] == ENTRY
assert e['exitCode'] == 0 and e['result']['outcome'] == 'PASS'
assert e['stdoutSha256']==sha((json.dumps(e['result'],indent=2)+'\n').encode())
assert e['command']==['python3','docs/evidence/sd2-autonomous/consolidation-proposal-004/verify.py','--review-bound']
assert e['result']['proposedFieldOccurrences']==53 and e['result']['newComparedFields']==0
assert e['result']['allPriorBytesModesHandoffsAndReviewBindingsPreserved']
assert s['executionSelected'] and s['allFactsAndIdentitiesRemainHeld']
proposal = load(P.parent / 'consolidation-proposal-004/scope.json')
assert s['selectedComparison'] == proposal['proposedComparison'] and not proposal['executionSelected']
for pin in s['proposalPins'] + s['savedEvidencePins'] + load(P / 'artifact-pins.json')['artifacts']:
    assert sha((R / pin['path']).read_bytes()) == pin['sha256'], pin['path']
packet = load(P.parent / 'checkpoint-001.json')
registry = {x['sourceId']: x for x in packet['sourceRegistry']}
c = load(P / 'comparison.json'); identities = load(P / 'identity-assessment.json')
assert (c['selectedInputs'], c['fieldOccurrences']) == (3, 53)
assert [r['savedRowLocator'] for r in c['records']] == [8, 9, 10]
assert [r['savedRowLocator'] for r in identities['records']] == [8, 9, 10]
seen = set(); categories = collections.Counter(); source_occurrences = []
for scope, row, ident in zip(s['selectedComparison']['orderedInputs'], c['records'], identities['records']):
    original = packet['records'][scope['queueOffset']]
    assert sha(canon(original)) == scope['recordCanonicalSha256']
    assert row['savedInputKey'] == original['inputKey'] == scope['savedInputKey']
    assert row['order'] == scope['order'] and row['displayLabel'] == scope['displayLabel']
    assert row['publicIdCandidates'] == ident['publicIdCandidates'] == scope['publicIdCandidates']
    assert row['originalIdentityAcceptance'] == ident['originalIdentityAcceptance'] == original['identityAcceptance'] == 'held'
    assert not ident['acceptedMapping'] and not ident['newIdentityAllocated']
    assert ident['originalIdentityProposal'] == original['identityProposal']
    route = {k: original[k] for k in ['owner', 'trigger', 'authoritativePath', 'nextAction']}
    assert row['originalRecordRoute'] == ident['originalRoute'] == route
    assert row['originalRecordedNameReference'] == scope['recordedNameReference']
    assert row['fieldOccurrences'] == len(row['fields']) == scope['fieldEnvelopeOccurrences']
    assert [f['field'] for f in row['fields']] == scope['orderedFieldNames'] == list(original['fieldProposals'])
    for f in row['fields']:
        ref = f['originalReference'];key = (ref['path'], ref['pointer']);assert key not in seen;seen.add(key)
        assert key == (scope['packetPath'], scope['recordPointer'] + '/fieldProposals/' + f['field'])
        env = original['fieldProposals'][f['field']]
        assert f['originalEnvelope'] == env and sha(canon(env)) == f['originalEnvelopeSha256'] and env['acceptance'] == 'held'
        assert f['originalRoute'] == route
        assert all(f['nextActionRoute'][k] == route[k] for k in route)
        note = f['comparison']; categories[note['category']] += 1
        assert note['category'] in ['existing evidence consistent', 'existing evidence conflicting', 'applicability/identity unresolved', 'evidence unavailable']
        assert note['proposalOnly'] and note['originalHoldRetained'] and not note['newReadSelected']
        assert note['minimumAdditionalProof'] == f['nextActionRoute']['minimumProofProposal']
        assert not f['nextActionRoute']['newReadSelected']
        for r in f['evidenceReferences'] + f['contextReferences'] + f['originalReviewReferences']:
            assert sha((R / r['path']).read_bytes()) == r['sha256']
            if r['pointer'] and r['path'].endswith('.json'):
                node=load(R/r['path'])
                for part in r['pointer'].split('/')[1:]:
                    part=part.replace('~1','/').replace('~0','~')
                    node=node[int(part)] if isinstance(node,list) else node[part]
        for ei, ev in enumerate(env['evidence']):
            assert ev['sourceId'] in scope['sourceIds']
            source = registry[ev['sourceId']];raw = (R / source['artifactPath']).read_bytes()
            assert sha(raw) == ev['artifactSha256'] == source['artifactSha256']
            assert ev['sourceUrl'] == source['requestedUrl'] and ev['excerpt'] in raw.decode()
            assert any(r['pointer'] == ref['pointer'] + f'/evidence/{ei}' for r in f['evidenceReferences'])
            source_occurrences.append(dict(sourceId=ev['sourceId'], savedInputKey=row['savedInputKey'],field=f['field'],
                envelopeReference=ref,evidenceIndex=ei,originalEvidence=ev))
assert len(seen) == 53 and dict(categories) == c['categoryCounts']
views = load(P / 'saved-source-references.json')['sources'];assert [v['sourceId'] for v in views] == ['rh-old','rh-alias','ffa','ffa-applications','ffa-guidelines','ffa-college-rubric','ffa-leadership-rubric']
for view in views:
    source = registry[view['sourceId']]
    sx=next(x for x in s['selectedComparison']['sources'] if x['sourceId']==view['sourceId'])
    assert view['permittedInputKeys']==sx['permittedInputKeys']
    assert all(o['savedInputKey'] in view['permittedInputKeys'] for o in view['selectedEvidenceOccurrences'])
    assert view['extractionLimits'] == source['extractionLimits'] and view['sourceRevision'] == source.get('sourceRevision')
    assert view['originalSourceStatus'] == source['status'] and view['originalObservation'] == source.get('captureRecordedAt')
    assert not view['newFetchPerformed'] and not view['newSourceReceiptCreated']
    expected = [{k:v for k,v in x.items() if k!='sourceId'} for x in source_occurrences if x['sourceId'] == view['sourceId']]
    assert view['selectedEvidenceOccurrences'] == expected
# Independently check selected qualifiers and exact bounded source-passage fidelity.
f8,f9,f10=[{f['field']:f for f in row['fields']} for row in c['records']]
assert f8['militaryCriterion']['originalEnvelope']['value']=={'servingOrHaveServed':['ROTC','US Armed Forces']}
assert f8['amount']['originalEnvelope']['value']['perRecipient']==2000 and f8['recipientSlots']['originalEnvelope']['value']==1
assert 'AND' in f8['namedEligibilityStatement']['comparison']['comparison'] and 'OR' in f8['namedEligibilityStatement']['comparison']['comparison']
assert f9['studentStage']['originalEnvelope']['state']=='conflict'
assert f9['studentStage']['originalEnvelope']['value']=={'RHM':['high-school senior','college freshman'],'FFA':['college freshman','college sophomore']}
assert f9['studentStage']['comparison']['category']=='existing evidence conflicting'
assert f9['amount']['originalEnvelope']['value']['perRecipient']==500 and f9['recipientSlots']['originalEnvelope']['value']==2
for fields in [f9,f10]:
    assert fields['minimumGPA']['originalEnvelope']['value']==2.0
    assert 'AMTOPP' in fields['minimumGPA']['originalEnvelope']['note']
    assert 'annotation drift' in fields['minimumGPA']['comparison']['comparison']
    assert fields['minimumGPA']['comparison']['category']=='applicability/identity unresolved'
    assert fields['cycle']['originalEnvelope']['value']['nextCycle'] is None
    assert '2021' in fields['materials']['comparison']['comparison']
assert f10['amount']['originalEnvelope']['value']['perRecipient']==1500 and f10['recipientSlots']['originalEnvelope']['value']==1
assert 'Montana FFA State Officer attending Montana State University' in f10['namedEligibilityStatement']['comparison']['comparison']
assert f10['membership']['comparison']['category']=='applicability/identity unresolved'
contexts=load(P/'selected-context.json')['sources']
assert [x['sourceId'] for x in contexts]==[x['sourceId'] for x in s['selectedComparison']['sources']]
for context,sx in zip(contexts,s['selectedComparison']['sources']):
    assert context['permittedInputKeys']==sx['permittedInputKeys']
    assert context['artifactReference']['path']==sx['artifactPath'] and context['artifactReference']['sha256']==sx['artifactSha256']
    text=(R/sx['artifactPath']).read_text()
    for q in context['passages']:
        assert 0<=q['startCharacter']<q['endCharacter']<=len(text)
        assert q['quote']==text[q['startCharacter']:q['endCharacter']]
    if context['sourceId']=='ffa':
        assert len(context['passages'])==3
        assert context['passages'][0]['quote']==f9['studentStage']['originalEnvelope']['evidence'][1]['excerpt']
        assert context['passages'][2]['quote']=='annual $1,500 scholarship to a Montana FFA State Officer.'
assert contexts[0]['artifactReference']['sha256']==contexts[1]['artifactReference']['sha256']
assert all(identities[k]==0 for k in ['acceptedMappings','newStableIds','deletedInputs','mergedInputs','childAwardsCreated'])
assert not identities['completePopulationIdentityReconciliation']
assert c['priorComparedFieldOccurrences']==196 and c['cumulativeComparedFieldOccurrences']==249
assert c['comparedAutonomousInputs']==11 and c['comparedPriorJayceeInputs']==2 and c['remainingAutonomousInputsOutsideComparison']==395
assert dict(categories)=={'existing evidence consistent':14,'evidence unavailable':9,'applicability/identity unresolved':29,'existing evidence conflicting':1}
rows=[]
for i in range(1,22):
    p=load(P.parent / f'checkpoint-{i:03d}.json');rows.extend(p['records'])
assert len(rows)==406 and all(x['identityAcceptance']=='held' for x in rows)
fields=[f for r in rows for f in r['fieldProposals'].values()]
assert len(fields)==7406 and all(f['acceptance']=='held' for f in fields)
assert p['nextCheckpointInputOffset']==406 and p['nextInputKey'] is None
assert c['acceptedFacts']==c['originalFactsChanged']==c['newSourceOrWorkbookReads']==c['rawContentReinspections']==0
assert not c['fullSD2Complete'] and not c['SD3Started'] and not c['externalEffects']
if (P / 'validation.json').exists():
    val=load(P / 'validation.json')
    for check in val['checks']:
        raw=check['rawOutputUtf8'];assert sha(raw.encode())==check['rawLogSha256'] and len(raw.encode())==check['rawLogBytes']
        data=(R/check['logPath']).read_bytes();assert sha(data)==check['logSha256']
        assert data.decode()=='\n'.join(x.rstrip() for x in raw.splitlines()).rstrip()+'\n'
    by_name={Path(x['logPath']).stem:x for x in val['checks']}
    for name,cmd in [('plan',['npm','run','plan:check']),('typecheck',['npm','run','typecheck']),('tests',['npm','test'])]:
        final=by_name.get(name+'-retry',by_name[name]);assert final['command']==cmd and final['exitCode']==0
        if name+'-retry' in by_name:assert by_name[name]['exitCode']!=0 and 'EPERM' in by_name[name]['rawOutputUtf8']
    assert all(val['results'][x]=='PASS' for x in ['plan','typecheck','tests'])
    build=by_name.get('build-retry',by_name['build']);assert build['command']==['npm','run','build']
    if val['results']['standardBuild']=='PASS':assert build['exitCode']==0
    else:
        assert val['results']['standardBuild']=='BLOCKED_ENVIRONMENT'
        for name in ['build','build-retry']:assert by_name[name]['exitCode']!=0 and 'Operation not permitted' in by_name[name]['rawOutputUtf8']
if '--review-bound' in sys.argv:
    m=load(P/'final-manifest.json');review=load(P/'review.json')
    assert review['outcome']=='PASS' and not any(review['severityCounts'].values())
    assert review['binding']['candidateCommit']==m['candidateCommit'] and review['binding']['manifestSha256']==sha((P/'final-manifest.json').read_bytes())
    assert git('rev-parse',m['candidateCommit']+'^{tree}').decode().strip()==m['candidateTree']
    assert sha(git('diff','--binary',ENTRY,m['candidateCommit']))==m['completeDiffSha256']
    assert set(git('diff','--name-only',ENTRY,m['candidateCommit']).decode().splitlines())=={x['path'] for x in m['changedFiles']}
    for f in m['changedFiles']:assert sha(git('show',m['candidateCommit']+':'+f['path']))==f['sha256']==sha((R/f['path']).read_bytes())
    assert git('rev-parse','HEAD^').decode().strip()==m['candidateCommit']
    assert set(git('diff','--name-only',m['candidateCommit'],'HEAD').decode().splitlines())=={PREFIX+'final-manifest.json',PREFIX+'review.json'}
git('diff','--check',ENTRY)
print(json.dumps(dict(outcome='PASS',startedAt=started,completedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),
    entryCommit=ENTRY,protectedEntryFiles=protected,allPriorBytesModesHandoffsAndReviewBindingsPreserved=True,
    selectedInputs=3,fieldOccurrences=53,categoryCounts=dict(categories),cumulativeComparedFieldOccurrences=249,
    comparedAutonomousInputs=11,remainingAutonomousInputsOutsideComparison=395,autonomousFieldHolds=7406,
    autonomousIdentityHolds=406,researchCursor=406,nextResearchInput=None,M1Records=437,M1Pins=12,custodyPins=71,
    custodyLimit='Original receipts and fresh predecessor verification preserved; no new raw custody-availability claim',
    acceptedFacts=0,acceptedMappings=0,newSourceOrWorkbookReads=0,rawContentReinspections=0,
    fullSD2Complete=False,canonicalAcceptance=False,SD3Started=False,externalEffects=False),indent=2))
