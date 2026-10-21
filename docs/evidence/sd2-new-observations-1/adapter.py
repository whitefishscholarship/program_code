"""Finite new SD2 observations. Import has no effects; no unsafe runner/CLI bypass.

Only run_next can request a source, after durable exclusive intent and custody head.
Uses existing journal primitives unchanged; never opens any historical journal store.
"""
from pathlib import Path
from datetime import datetime, timezone
from urllib.parse import urlsplit
import importlib.util
import hashlib
import http.client
import ipaddress
import json
import os
import re
import socket
import ssl
import subprocess

REPO = Path(__file__).resolve().parents[3]
HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('sd2_original_journal', REPO / 'docs/evidence/sd2-control-repair-1/journal.py')
j = importlib.util.module_from_spec(spec)
spec.loader.exec_module(j)
TOOL = 'sd2.public-program-https-v1'
CAMPAIGN = 'SD2-NEW-OBSERVATIONS-1'
SCOPE_PATH = 'docs/evidence/sd2-new-research-handoff/scope.json'
SCOPE_SHA = 'd370162ae44777cd9737a83af4f76308ff0fbe737fc9e5e97b3dd416f901ac12'
POLICY = '6c15e35f85ebb8e559f38ce9da4e32e80edc0173'
LIMIT = 524288
STORE_ROOT = Path('/private/tmp/whitefish-sd2-new-observations-1/SD2-NEW-OBSERVATIONS-1')
CUSTODY_ROOT = Path('/private/tmp/whitefish-sd2-new-observations-1-custody/SD2-NEW-OBSERVATIONS-1-custody')
REGISTRY_REF = 'refs/sd2-campaign/SD2-NEW-OBSERVATIONS-1'
HEAD_REF = 'refs/sd2-campaign/SD2-NEW-OBSERVATIONS-1-head'

def sha(raw): return hashlib.sha256(raw).hexdigest()
def load(path): return json.loads(j.read(path))
def now(): return datetime.now(timezone.utc).isoformat()
def git(*args, data=None): return subprocess.check_output(['git', *args], input=data, cwd=REPO, stderr=subprocess.DEVNULL)

def durable_object(value):
    oid = git('-c','core.fsync=loose-object,reference','-c','core.fsyncMethod=fsync',
              'hash-object','-w','--stdin',data=j.encoded(value)).decode().strip()
    common = Path(git('rev-parse','--path-format=absolute','--git-common-dir').decode().strip())
    obj = common/'objects'/oid[:2]/oid[2:]
    fd = os.open(obj, os.O_RDONLY | os.O_NOFOLLOW)
    try: os.fsync(fd)
    finally: os.close(fd)
    j.syncdir(obj.parent); j.syncdir(common/'objects')
    return oid

def durable_ref(ref, oid, previous):
    git('-c','core.fsync=loose-object,reference','-c','core.fsyncMethod=fsync',
        'update-ref','--create-reflog','-m','SD2 append-only custody',ref,oid,previous)
    common = Path(git('rev-parse','--path-format=absolute','--git-common-dir').decode().strip())
    # Explicit fsync ordering, independent of ambient Git core.fsync configuration.
    for file in [common/ref, common/'logs'/ref]:
        fd = os.open(file, os.O_RDONLY | os.O_NOFOLLOW)
        try: os.fsync(fd)
        finally: os.close(fd)
        directory = file.parent
        while directory != common:
            j.syncdir(directory); directory = directory.parent
    j.syncdir(common)

def scope():
    raw = j.read(REPO / SCOPE_PATH)
    j.require(sha(raw) == SCOPE_SHA, 'scope pin')
    s = json.loads(raw)
    j.require(len(s['targets']) == 100 and s['targetCount'] == 100 and
              s['maxExplicitToolInvocations'] == 100 and s['maxConcurrent'] == 1, 'scope budget')
    return s

def control_pins():
    pins = load(HERE / 'control-pins.json')
    j.require(pins['campaignId'] == CAMPAIGN and pins['scopeSha256'] == SCOPE_SHA and
              pins['policyCommit'] == POLICY and pins['tool'] == TOOL, 'control identity')
    for ref in pins['files']:
        j.require(sha(j.read(REPO / ref['path'])) == ref['sha256'], 'control bytes changed')
    return sha(j.read(HERE / 'control-pins.json'))

def gates(freshness):
    """No caller-supplied success booleans. Verify attested Git artifacts and fresh pins.

    freshness is a separately preserved authenticated GitHub/Vercel metadata receipt
    produced by the delivery/entry verifier, never a source response.
    """
    digest = control_pins()
    manifest_raw = j.read(REPO / 'docs/evidence/PLAN-REV24-manifest.json')
    manifest = json.loads(manifest_raw)
    review_raw = j.read(REPO / 'docs/reviews/PLAN-REV24.json')
    review = json.loads(review_raw)
    j.require(review['outcome'] == 'accepted' and review['reviewerWasAuthorOrEditor'] is False and
              review['candidateManifestSha256'] == sha(manifest_raw) and
              review['candidateCommit'] == manifest['candidateCommit'] and
              all(review['findings'][k] == 0 for k in ['critical', 'high']) and
              review['checks']['liveControls'] == 'PASS', 'independent actual control/final review')
    # Locate the first canonical direct-child attestation, not a mutable marker.
    attestations = git('log', '--reverse', '--format=%H', '--', 'docs/reviews/PLAN-REV24.json').decode().splitlines()
    j.require(bool(attestations), 'no canonical attestation')
    att = attestations[0]
    j.require(git('rev-parse', att+'^').decode().strip() == manifest['candidateCommit'], 'direct child')
    j.require(set(git('diff', '--name-only', att+'^', att).decode().splitlines()) ==
              {'docs/reviews/PLAN-REV24.json', 'docs/evidence/PLAN-REV24-manifest.json'}, 'two-file attestation')
    for path, raw in [('docs/reviews/PLAN-REV24.json', review_raw), ('docs/evidence/PLAN-REV24-manifest.json', manifest_raw)]:
        j.require(git('show', att+':'+path) == raw, 'attestation bytes')
    j.require(git('show', manifest['candidateCommit']+':docs/evidence/sd2-new-observations-1/control-pins.json') ==
              j.read(HERE/'control-pins.json'), 'reviewed actual adapter binding')
    main = git('rev-parse', 'origin/main').decode().strip()
    subprocess.run(['git', 'merge-base', '--is-ancestor', att, main], cwd=REPO, check=True,
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    f = load(freshness)
    age = (datetime.now(timezone.utc)-datetime.fromisoformat(f['observedAt'])).total_seconds()
    j.require(0 <= age <= 900 and f['mainCommit'] == main and f['controlPinsSha256'] == digest,
              'stale/lost main/control receipt')
    j.require(f['projectId'] == 'prj_LbefE2deji6nPND6iBiuofe7IABv' and
              f['teamId'] == 'team_6CAjRq58n0WvAH49otKSQbA7' and
              f['hostname'] == 'web-two-gules-45.vercel.app' and
              f['productionCommit'] == main, 'delivery target/revision receipt')
    for ref in f['authenticatedReceipts']:
        j.require(sha(j.read(Path(freshness).parent/ref['file'])) == ref['sha256'], 'external receipt loss')
    j.require({r['kind'] for r in f['authenticatedReceipts']} == {'github-main','vercel-production'},
              'authenticated metadata evidence required')
    # Reauthenticate the pinned provider/main metadata ourselves. Receipt booleans alone
    # cannot authorize a request. No protection bypass, credentials or config changes.
    remote = git('ls-remote','origin','refs/heads/main').decode().split()[0]
    j.require(remote == main, 'main moved; refresh/review entry')
    command = ['vercel','--global-config','/private/tmp/whitefish-vercel-auth-zn6gmpor',
               '--scope','team_6CAjRq58n0WvAH49otKSQbA7','api',
               '/v9/projects/prj_LbefE2deji6nPND6iBiuofe7IABv?teamId=team_6CAjRq58n0WvAH49otKSQbA7',
               '--method','GET']
    env = os.environ.copy(); env.pop('VERCEL_TOKEN', None); env['CI'] = '1'
    provider = json.loads(subprocess.check_output(command, env=env, stderr=subprocess.DEVNULL, timeout=30))
    j.require(provider['id'] == f['projectId'] and provider['accountId'] == f['teamId'] and
              provider['rootDirectory'] == 'web' and provider['link']['repoId'] == 1177349487,
              'authenticated provider target')
    production = provider['targets']['production']
    j.require(production['readyState'] == 'READY' and production['meta']['githubCommitSha'] == main and
              f['hostname'] in production['alias'], 'authenticated delivered production revision')
    return digest

def eligible(target):
    """Use existing independently reviewed affinity; do not repeat assessments."""
    ref = target['preflightReference']
    raw = j.read(REPO / ref['path'])
    j.require(sha(raw) == ref['sha256'], 'saved preflight pin')
    records = json.loads(raw)['records']
    matches = [r for r in records if r['targetId'] == target['targetId']]
    j.require(len(matches) == 1, 'affinity identity')
    row = matches[0]
    safe = (row['outcome'] == 'PASS_FOR_PUBLIC_PAGE_RETRIEVAL_ONLY' and
            row['independentSavedInspection'] is True and row['exactReferenceHashesVerified'] is True and
            row['historicalPublicProgramPageTypeSupported'] is True and
            not row['applicationPathMarker'] and row['exactLocatorSha256'] == target['exactLocatorSha256'] and
            row['affectedSavedInputs'] == target['affectedSavedInputs'])
    for ev in row['evidence']:
        for key in ['receiptReference', 'artifactReference']:
            if key in ev:
                ref = ev[key]
                j.require(sha(j.read(REPO/ref['path'])) == ref['sha256'], 'saved evidence pin')
    u = urlsplit(target['exactLocator'])
    safe = safe and u.scheme == 'https' and u.hostname == target['host'] and not u.username and not u.password and not u.port and not u.query and not u.fragment
    safe = safe and not re.search(r'(?i)(\.pdf|\.docx?|\.xlsx?|/login|/apply|/application|/recipients?|/biograph|/students?/)', u.path)
    return bool(safe)

class PublicHTTPS(http.client.HTTPSConnection):
    def connect(self):
        # Resolve once, reject every nonpublic answer; connect by numeric IP, TLS by original host.
        addresses = socket.getaddrinfo(self.host, 443, type=socket.SOCK_STREAM)
        j.require(bool(addresses) and all(ipaddress.ip_address(a[4][0]).is_global for a in addresses), 'nonpublic DNS')
        address = addresses[0]
        sock = socket.socket(address[0], socket.SOCK_STREAM)
        sock.settimeout(20)
        try:
            sock.connect(address[4])
            self.sock = self._context.wrap_socket(sock, server_hostname=self.host)
        except BaseException:
            sock.close()
            raise

def _request(target):
    """One GET only. No redirect, proxy, cookie, auth, retry, raw prose or exception output."""
    u = urlsplit(target['exactLocator'])
    conn = PublicHTTPS(u.hostname, timeout=20, context=ssl.create_default_context())
    try:
        conn.request('GET', u.path or '/', headers={'Accept':'text/html', 'Accept-Encoding':'identity',
                     'User-Agent':'Whitefish-SD2-public-program-review/1.0', 'Connection':'close'})
        response = conn.getresponse()
        if response.status != 200 or response.getheader('Content-Encoding') not in (None, 'identity') or response.getheader('Content-Type', '').split(';')[0].lower() != 'text/html':
            return {'status':'held-response', 'bodySha256':None, 'bytes':0, 'values':{}}
        body = response.read(LIMIT+1)
        digest = sha(body)
        if len(body) > LIMIT:
            return {'status':'held-oversize', 'bodySha256':digest, 'bytes':len(body), 'values':{}}
        return project(body, target)
    finally:
        conn.close()

def project(body, target):
    # Raw input exists only inside this process; fixed scalar projection cannot carry prose/PII.
    text = body.decode('utf-8', errors='strict')
    if re.search(r'(?i)<form\b|type\s*=\s*[\"\']?(?:password|email|file)|\b(?:recipient biography|date of birth|recommendation letter|student transcript|sign in to apply)\b', text):
        return {'status':'held-sensitive', 'bodySha256':sha(body), 'bytes':len(body), 'values':{}}
    text = re.sub(r'(?is)<(?:script|style|nav|footer)\b.*?</(?:script|style|nav|footer)>', ' ', text)
    text = re.sub(r'<[^>]*>', ' ', text)
    # Only minimum GPA may currently yield a proposed number; ambiguous/multiple values stay unknown.
    # No award identity/cycle/material/application/eligibility prose is promoted.
    values = {}
    if len(target['affectedSavedInputs']) == 1 and any(f.endswith('#minimumGPA') for f in target['materialProofGaps']):
        hits = set(re.findall(r'(?i)\bminimum\s+(?:cumulative\s+)?GPA\s*(?:of|:|is)?\s*([0-4](?:\.[0-9]{1,2})?)\b', text))
        if len(hits) == 1:
            number = float(next(iter(hits)))
            if 0 <= number <= 4:
                values = {f:number for f in target['materialProofGaps'] if f.endswith('#minimumGPA')}
    return {'status':'proposed-quarantined', 'bodySha256':sha(body), 'bytes':len(body), 'values':values}

class Campaign:
    def __init__(self, root, custody, freshness):
        self.root, self.custody, self.freshness = Path(root), Path(custody), Path(freshness)
        # Independent custody is outside the journal tree; forbid historical store names.
        j.require(self.root == STORE_ROOT and self.custody == CUSTODY_ROOT, 'singleton exact campaign paths')
        for directory in [self.root, self.custody]:
            j.require(directory.resolve() == directory, 'symlink/aliased store path')
        j.require(self.root.resolve() not in self.custody.resolve().parents and self.custody.resolve() not in self.root.resolve().parents, 'separate custody')
        self.protocol = object.__new__(j.Journal)
        self.protocol.root = self.root

    def _pins(self):
        digest = gates(self.freshness)
        anchor = j.decode(j.read(self.root/'anchor.json'))
        j.require(anchor == {'campaignId':CAMPAIGN, 'scopeSha256':SCOPE_SHA, 'controlPinsSha256':digest,
                             'root':str(STORE_ROOT),'custody':str(CUSTODY_ROOT)}, 'anchor pin')
        j.require(git('show',REGISTRY_REF) == j.encoded(anchor), 'singleton external registry missing/mismatched')
        j.require(j.read(self.custody/'00000000.json') == j.encoded(anchor), 'custody anchor missing')
        return anchor

    def _state(self):
        anchor = self._pins()
        j.require(set(p.name for p in self.root.iterdir()) == {'anchor.json','events','receipts','lock'}, 'store entry')
        j.require(self.custody.is_dir() and not self.custody.is_symlink(), 'unsafe custody')
        names = sorted(p.name for p in (self.root/'events').iterdir())
        j.require(names == [f'{i:08}.json' for i in range(1,len(names)+1)] and
                  names == sorted(p.name for p in (self.root/'receipts').iterdir()) and
                  ['00000000.json']+names == sorted(p.name for p in self.custody.iterdir()), 'lost/partial event or receipt')
        head = sha(j.encoded(anchor)); cursor = 0; calls = 0; active = None; outcomes = []
        targets = scope()['targets']
        for sequence,name in enumerate(names,1):
            raw = j.read(self.root/'events'/name); event = j.decode(raw)
            j.require(set(event) == {'sequence','previous','kind','data'} and event['sequence'] == sequence and event['previous'] == head, 'chain')
            head = sha(raw)
            receipt = j.encoded({'sequence':sequence,'eventSha256':head})
            j.require(j.read(self.root/'receipts'/name) == receipt and j.read(self.custody/name) == receipt, 'custody head mismatch')
            target = targets[cursor] if cursor < 100 else None
            d = event['data']
            j.require(target is not None and d['targetId'] == target['targetId'], 'ordered target')
            if event['kind'] == 'intent':
                j.require(active is None and d == {'targetId':target['targetId'], 'locatorSha256':target['exactLocatorSha256'], 'tool':TOOL} and calls < 100, 'duplicate/active/budget/scope')
                active = sequence; calls += 1
            elif event['kind'] == 'outcome':
                validate_outcome(d, target, active)
                if active is not None:
                    j.require(d['intentSequence'] == active, 'intent/result binding')
                if d['status'] == 'spent-missing-result':
                    # Keep the uncertain request occupied permanently. Stop, never replay/repair.
                    outcomes.append(d)
                    j.require(sequence == len(names), 'event after terminal uncertainty')
                    self._external_head(sequence, head)
                    return dict(head=head,sequence=sequence,cursor=cursor,calls=calls,active=active,outcomes=outcomes)
                active = None; cursor += 1; outcomes.append(d)
            else:
                raise j.Denied('unknown event')
        self._external_head(len(names), head)
        return dict(head=head,sequence=len(names),cursor=cursor,calls=calls,active=active,outcomes=outcomes)

    def _external_head(self, sequence, head):
        marker = {'campaignId':CAMPAIGN,'sequence':sequence,'eventSha256':head}
        j.require(git('show',HEAD_REF) == j.encoded(marker), 'external current cursor mismatch/rollback/loss')
        return git('rev-parse',HEAD_REF).decode().strip()

    def _append(self, state, kind, data):
        previous = self._external_head(state['sequence'], state['head'])
        receipt = self.protocol._append(state, kind, data)
        j.exclusive(self.custody/f"{receipt['sequence']:08}.json", {'sequence':receipt['sequence'],'eventSha256':receipt['head']})
        marker = {'campaignId':CAMPAIGN,'sequence':receipt['sequence'],'eventSha256':receipt['head']}
        oid = durable_object(marker)
        # External repo ref CAS is durable before request/cursor advance. No delete/reset API.
        durable_ref(HEAD_REF,oid,previous)
        return receipt

    def audit(self):
        with self.protocol.locked(): return self._state()

    def run_next(self, expected_head):
        # Hold lock across the only source request and immediate sanitized result persistence.
        with self.protocol.locked():
            state = self._state()
            j.require(expected_head == state['head'] and state['active'] is None and state['cursor'] < 100, 'stale/current/active/cursor gate')
            target = scope()['targets'][state['cursor']]
            if not eligible(target):
                outcome = outcome_for(target, None, 'skipped-unsafe', {}, None, 0)
                return self._append(state, 'outcome', outcome)
            intent = self._append(state, 'intent', {'targetId':target['targetId'],'locatorSha256':target['exactLocatorSha256'],'tool':TOOL})
            # Once intent exists, cancellation/error/missing result can never release its slot for retry.
            try:
                response = _request(target)
                outcome = outcome_for(target, intent['sequence'], response['status'], response['values'], response['bodySha256'], response['bytes'])
            except Exception:
                outcome = outcome_for(target, intent['sequence'], 'spent-missing-result', {}, None, 0)
            validate_outcome(outcome, target, intent['sequence'])
            return self._append({'sequence':intent['sequence'],'head':intent['head']}, 'outcome', outcome)

def outcome_for(target, intent, status, values, body_sha, size):
    return {'campaignId':CAMPAIGN,'targetId':target['targetId'],'intentSequence':intent,
            'observedAt':now(),'status':status,'bodySha256':body_sha,'bytes':size,
            'fields':{f:({'state':'proposed-quarantined','value':values[f]} if f in values else {'state':'held-unknown'}) for f in target['materialProofGaps']},
            'acceptedFacts':0,'acceptedMappings':0,'historicalHoldRetained':True}

def validate_outcome(d, target, active):
    j.require(set(d) == {'campaignId','targetId','intentSequence','observedAt','status','bodySha256','bytes','fields','acceptedFacts','acceptedMappings','historicalHoldRetained'}, 'output schema')
    j.require(d['campaignId'] == CAMPAIGN and d['targetId'] == target['targetId'] and d['intentSequence'] == active and
              d['acceptedFacts'] == 0 and d['acceptedMappings'] == 0 and d['historicalHoldRetained'] is True, 'output identity/held')
    j.require(d['status'] in {'skipped-unsafe','held-response','held-oversize','held-sensitive','proposed-quarantined','spent-missing-result'} and
              (d['status'] == 'skipped-unsafe') == (active is None), 'output status/request')
    j.require(type(d['bytes']) is int and 0 <= d['bytes'] <= LIMIT+1 and
              (d['bodySha256'] is None or re.fullmatch('[0-9a-f]{64}',d['bodySha256'])) and
              set(d['fields']) == set(target['materialProofGaps']), 'output scope/count/hash')
    j.require(0 <= (datetime.now(timezone.utc)-datetime.fromisoformat(d['observedAt'])).total_seconds(), 'output timestamp')
    for field,value in d['fields'].items():
        j.require(value == {'state':'held-unknown'} or
                  (d['status'] == 'proposed-quarantined' and field.endswith('#minimumGPA') and
                   set(value) == {'state','value'} and value['state'] == 'proposed-quarantined' and
                   type(value['value']) in (int,float) and 0 <= value['value'] <= 4), 'unsafe output projection')

def provision(root, custody, freshness):
    # Exclusive new campaign only; never initializes/resets an existing store or old grant.
    digest = gates(freshness); scope()
    c = Campaign(root,custody,freshness)
    anchor = {'campaignId':CAMPAIGN,'scopeSha256':SCOPE_SHA,'controlPinsSha256':digest,
              'root':str(STORE_ROOT),'custody':str(CUSTODY_ROOT)}
    # Atomically claim exactly once across all repository worktrees, BEFORE store creation.
    # A crash or deleted store leaves this ref spent; there is no reset/delete/reclaim API.
    oid = durable_object(anchor)
    durable_ref(REGISTRY_REF,oid,'0'*40)
    c.root.parent.mkdir(mode=0o700,exist_ok=True); c.custody.parent.mkdir(mode=0o700,exist_ok=True)
    c.root.mkdir(mode=0o700); c.custody.mkdir(mode=0o700)
    (c.root/'events').mkdir(); (c.root/'receipts').mkdir()
    fd = os.open(c.root/'lock', os.O_RDWR | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o600)
    os.fsync(fd); os.close(fd); j.syncdir(c.root)
    j.exclusive(c.root/'anchor.json',anchor);j.exclusive(c.custody/'00000000.json',anchor)
    marker = {'campaignId':CAMPAIGN,'sequence':0,'eventSha256':sha(j.encoded(anchor))}
    oid = durable_object(marker)
    durable_ref(HEAD_REF,oid,'0'*40)
    return c
