"""Read-only checkpoint010 integrity, continuity and held-state audit. Never assemble."""
from pathlib import Path
import collections, datetime, hashlib, json, re, subprocess

P = Path(__file__).resolve().parent
ROOT = P.parents[3]
B = P.parent
ENTRY = '5ab4a592be5b28b62e98af39533bc26870169424'
load = lambda p: json.loads(p.read_text())
sha = lambda b: hashlib.sha256(b).hexdigest()
def git(*args):
    return subprocess.check_output(['git', *args], cwd=ROOT)

l = load(B/'checkpoint-010.json')
q = load(B/'queue.json')
assert l['entryCommit'] == ENTRY
assert l['queueSha256'] == sha((B/'queue.json').read_bytes())
assert l['queueOffsetStart'] == 180 and l['queueOffsetEndExclusive'] == 200
assert l['orderedInputKeys'] == [x['inputKey'] for x in q['records'][180:200]]
assert len(l['records']) == len(set(l['orderedInputKeys'])) == 20
assert l['nextInputKey'] == q['records'][200]['inputKey'] == 'saved-405588227-row-204'
assert l['nextCheckpointInputOffset'] == 200
assert not any(l[k] for k in ['acceptedFacts','canonicalAcceptance','fullSD2Complete','SD3Started'])
prior = [load(B/f'checkpoint-{i:03d}.json') for i in range(1,10)]
assert [x['inputKey'] for p in prior for x in p['records']] == [x['inputKey'] for x in q['records'][:180]]
assert sum(len(x['fieldProposals']) for p in prior for x in p['records']) == 3495
assert all(x['identityAcceptance']=='held' for p in prior for x in p['records'])
assert all(f['acceptance']=='held' for p in prior for x in p['records'] for f in x['fieldProposals'].values())
reg = {s['sourceId']:s for s in l['sourceRegistry']}
assert len(reg) == 6 and l['sourceRegistry'] == load(P/'source-receipts.json')
texts = {}
for s in reg.values():
    assert s['depth']<=2 and s['statusCode']==200
    assert all(s.get(k) for k in ['owner','trigger','nextAction','observedAt','sourceScope'])
    raw = (ROOT/s['artifactPath']).read_bytes()
    assert sha(raw)==s['artifactSha256']
    texts[s['sourceId']] = raw.decode()
    assert not s['rawArtifactRetained'] and not s['originFreshnessVerified']
    if 'reuse' in s:
        old = next(x for x in prior[-1]['sourceRegistry'] if x['sourceId']==s['sourceId'])
        assert {k:v for k,v in s.items() if k!='reuse'} == old
        assert s['reuse']['noNewSourceRead']
    elif s['sourceId']=='ngpa':
        assert s['callStartedAt'] is None and s['timestampLimit']
        assert s['observedAtMeaning'].startswith('Subsequent local record')
    else:
        assert s['callStartedAt']<=s['callCompletedAt']==s['observedAt']
    for d in s['linkDispositions']:
        assert all(d.get(k) for k in ['owner','trigger','nextAction','disposition'])
        assert set(d['sourceIds'])<=set(reg)
        if s['sourceId'] in ['ngpa','afsa','wai']:
            assert (d.get('url') or d['rawLocator']) in texts[s['sourceId']]
        if d['url'] is None:
            assert d['rawLocator']=='www.WAI.org/scholarships' and not d['usableUrlEstablished']
assert reg['ngpa']['selectedTableAccounting']==dict(retainedSelectedAwardRows=6,selectedInputs=6,wholeTableCountVerified=True,retrievedAwardRows=20,unrelatedAwardRowsExcluded=14)
assert reg['wai']['conversionAccounting']['selectedProgramProfiles']==13
assert reg['wai']['conversionAccounting']['nativePDFPagesInspected']==0
assert len([s for s in reg.values() if 'reuse' in s])==3
refs = fields = seeds = 0
for r, seed in zip(l['records'],q['records'][180:200]):
    for k in ['inputKey','rowLocator','recordedName','recordedSeedUrls','publishedSourceAliases','publicIdCandidates','identityBasis','identityAcceptance']:
        assert r[k]==seed[k]
    assert r['identityAcceptance']=='held' and r['status']==r['outcome']
    assert all(r.get(k) for k in ['owner','trigger','nextAction'])
    assert set(r['allowedSourceIds'])<=set(reg)
    assert [d['url'] for d in r['seedDispositions']]==list(dict.fromkeys(seed['recordedSeedUrls']+seed['publishedSourceAliases']))
    for d in r['seedDispositions']:
        seeds+=1
        assert set(d['sourceIds'])<=set(r['allowedSourceIds'])
        assert all(d.get(k) for k in ['owner','trigger','nextAction','disposition'])
    for f in r['fieldProposals'].values():
        fields+=1
        assert f['acceptance']=='held' and f['state'] in ['verified','unverified','unstated','conflict','inaccessible']
        assert all(f.get(k) for k in ['owner','trigger','nextAction','sourceScope','observedAt','freshness'])
        if f['state'] in ['verified','conflict']: assert f['evidence']
        for e in f['evidence']:
            s=reg[e['sourceId']]
            assert e['sourceId'] in r['allowedSourceIds']
            assert e['artifactPath']==s['artifactPath'] and e['artifactSha256']==s['artifactSha256']
            assert e['sourceUrl']==s['originalUrl'] and e['excerpt'] in texts[e['sourceId']] and e['locator']
            refs+=1
cov=l['coverage']
assert fields==cov['fieldEnvelopes']==444
assert cov['cumulativeAutonomousHeldFields']==3495+fields==3939
assert cov['cumulativeInitialDispositions']==cov['cumulativeAutonomousHeldIdentities']==200
assert cov['unprocessedInputs']==206 and cov['sourceReceipts']==6
assert cov['outcomes']==dict(collections.Counter(r['outcome'] for r in l['records']))=={'researched-held':18,'held-identity':2}
rows={r['rowLocator']:r for r in l['records']}
v=lambda row,key:rows[row]['fieldProposals'][key]['value']
# Material scope distinctions with consequences for later matching.
assert v(184,'eligibility')['pursuing']=='CFI rating' and not v(184,'eligibility')['CFIIInferred']
assert v(185,'eligibility')['currentStudentRequired']
assert v(187,'eligibility')['currentOrIncomingLIFTStudent'] and v(187,'eligibility')['andPursuingFlightTraining']
assert v(188,'eligibility')['andCurrentOrIncomingStudent']=='Part147 program'
assert 'payment' not in rows[188]['fieldProposals']
assert v(189,'amount')['value'] is None and v(189,'amount')['variants']==['full ride','partial']
for n in range(184,190):
    assert rows[n]['fieldProposals']['cycle']['state']==rows[n]['fieldProposals']['materials']['state']=='conflict'
    assert v(n,'parentNationalityScope')['specificSponsorChildWorkAuthorization'] is None
assert v(190,'minimumGPA')['requirement']=='explicitly none'
assert v(190,'needRequirement')['incomeRequirement']=='explicitly none'
assert v(190,'deadline')['time']=='12:59' and v(190,'deadline')['period']=='p.m.'
assert v(190,'selection')['randomComputerSelectionAfterContest']
for n in [191,192]:
    assert rows[n]['outcome']=='held-identity'
    assert v(n,'identityObservation')['exactNameMapping'] is None
    assert v(n,'identityObservation')['ordinalMappingNotAccepted'] is True
    assert v(n,'eligibility') is None and not v(n,'amount')['exactChildAmountAccepted']
assert v(194,'eligibility')['prerequisites']==['CFI','commercial pilot certificate with multi-engine ratings']
assert v(199,'minimumGPA')['threshold']==3.0 and v(199,'minimumGPA')['basis'] is None
assert v(199,'eligibility')['USCitizenOrPermanentResident']
assert v(200,'amount')['recipientSlotsMaximum']==4 and v(200,'eligibility')['sportOrRecreationalExcluded']
assert rows[202]['fieldProposals']['materials']['state']=='conflict'
assert v(202,'materials')['chosenEssayOrCombinedRequirement'] is None
assert v(202,'minimumGPA')['onlyIf'] and v(202,'minimumGPA')['basis']=='cumulative'
assert v(203,'minimumGPA')['requirementWording']=='should' and v(203,'minimumGPA')['notHardenedToMust']
# Check every prior binding against immutable candidate trees, not current worktree state.
history=0
for folder in [B]+[B/f'checkpoint-{i:03d}' for i in range(2,10)]:
    mp=folder/('research-manifest.json' if folder==B else 'final-manifest.json')
    rp=folder/('research-review.json' if folder==B else 'review.json')
    m=load(mp);review=load(rp);bind=review.get('binding',review)
    assert review['outcome']=='PASS' and bind['candidateCommit']==m['candidateCommit']
    assert bind['manifestSha256']==sha(mp.read_bytes())
    assert sha(git('diff','--binary',m['entryCommit'],m['candidateCommit']))==m['completeDiffSha256']
    for f in m['changedFiles']:
        assert sha(git('show',m['candidateCommit']+':'+f['path']))==f['sha256']
    history+=1
mutable={'docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md','docs/CURRENT_HANDOFF.md','docs/evidence/sd2-autonomous/NEXT_SESSION.md'}
changed=set(git('diff','--name-only',ENTRY).decode().splitlines())
untracked=set(git('ls-files','--others','--exclude-standard').decode().splitlines())
for path in changed|untracked:
    assert path in mutable or path=='docs/evidence/sd2-autonomous/checkpoint-010.json' or path.startswith('docs/evidence/sd2-autonomous/checkpoint-010/'),path
for path in git('ls-tree','-r','--name-only',ENTRY).decode().splitlines():
    if path not in mutable:
        assert (ROOT/path).read_bytes()==git('show',ENTRY+':'+path),path
pp='docs/STUDENT_DATA_AND_MAINTENANCE_PLAN.md';t=(ROOT/pp).read_text();oldtext=git('show',ENTRY+':'+pp).decode()
start='<!-- SD2-CHECKPOINT-010-START -->\n';end='<!-- SD2-CHECKPOINT-010-END -->\n'
if start in t:
    assert t.count(start)==t.count(end)==1
    a=t.index(start);z=t.index(end)+len(end)
    assert t[:a]+t[z:]==oldtext
else: assert t==oldtext
for path in mutable-{pp}:
    assert (ROOT/path).read_bytes().endswith(git('show',ENTRY+':'+path))
custody=load(P/'prior-custody-audit.json');assert len(custody['pins'])==71
assert [x['path'] for x in custody['pins']]==[x['path'] for x in load(B/'checkpoint-009/prior-custody-audit.json')['pins']]
for pin in custody['pins']:
    f=Path(pin['path']);actual=sha(f.read_bytes()) if f.exists() else None
    assert actual==pin['observedSha256']
    assert all(pin.get(k) for k in ['owner','trigger','nextAction'])
pins=load(ROOT/'docs/evidence/sd2-next-read-proposal/verification.json')['retainedM1Artifacts']
for pin in pins: assert sha(git('show','009fa57:'+pin['path']))==pin['sha256']
m1=json.loads(git('show','009fa57:docs/evidence/season-monitor-m1/inventory.json'))
assert len(m1['records'])==len({r['id'] for r in m1['records']})==437
state=load(ROOT/'docs/BUILD_STATE.json')
assert state['activeStageId'] is None and state['nextPermittedStageId'] is None
for path in list((P/'sources').glob('*.md'))+[B/'checkpoint-010.json',P/'source-receipts.json',P/'capture-metadata.json']:
    t=path.read_text()
    assert not re.search(r'\b[\w.%+-]+@[\w.-]+\.[A-Za-z]{2,}|[?&](?:token|sig|signature|se|ouid)=',t),path
    assert not re.search(r'(?:\b\d{3}[-/.]|\(\d{3}\)\s*)\d{3}[-/.]\d{4}',t),path
    assert not re.search(r'August 21, 1993|October 15, 2024|Home Address|Date of Birth|United 2026 Scholarship Recipients',t),path
    assert t.endswith('\n') and all(x==x.rstrip() for x in t.splitlines()),path
if (P/'validation.json').exists():
    validation=load(P/'validation.json')
    assert not any(validation[k] for k in ['canonicalAcceptance','externalEffects','SD3Started'])
    for receipt in validation['checks']:
        assert sha((ROOT/receipt['logPath']).read_bytes())==receipt['logSha256']
git('diff','--check',ENTRY)
print(json.dumps(dict(outcome='PASS',scope='Local held-research integrity only',recordedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),entryCommit=ENTRY,checkpointInputs=20,cumulativeInitialDispositions=200,unprocessedInputs=206,fieldEnvelopes=fields,cumulativeHeldFields=3939,heldIdentities=200,sourceReceipts=6,newPublicRetrievals=3,reusedSourceReceipts=3,evidenceReferences=refs,seedDispositions=seeds,sourceLinkDispositions=sum(len(s['linkDispositions']) for s in reg.values()),historicalManifestReviewsVerified=history,priorCustodyPins=71,custodyGaps=custody['gaps'],M1Records=437,M1Pins=len(pins),acceptedFacts=0,SD3Started=False,nextInputKey=l['nextInputKey']),indent=2))
