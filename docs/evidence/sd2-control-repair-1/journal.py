"""Offline synthetic reservation protocol. No network or acquisition integration.

Existing source execution is never resumed here. The caller must supply pinned
contract/import digests and an already provisioned NEW synthetic store. There is
no reset, truncation, retry, import-replay or repair API.
"""
from contextlib import contextmanager
from pathlib import Path
import fcntl
import hashlib
import json
import os
import re
import stat
from urllib.parse import urlsplit


class Denied(Exception):
    pass


ZERO = '0' * 64
HEX = re.compile(r'[0-9a-f]{64}')
NAME = re.compile(r'synthetic-[a-z0-9-]{1,64}')


def digest(data):
    return hashlib.sha256(data).hexdigest()


def encoded(value):
    return (json.dumps(value, sort_keys=True, separators=(',', ':'),
                       ensure_ascii=True, allow_nan=False) + '\n').encode()


def require(condition, reason):
    if not condition:
        raise Denied(reason)


def integer(value, low, high):
    return type(value) is int and low <= value <= high


def read(path):
    fd = os.open(path, os.O_RDONLY | os.O_NOFOLLOW)
    try:
        s = os.fstat(fd)
        require(stat.S_ISREG(s.st_mode) and s.st_nlink == 1 and
                s.st_size <= 4 * 1024 * 1024, 'unsafe/oversize file')
        with os.fdopen(os.dup(fd), 'rb') as stream:
            return stream.read(4 * 1024 * 1024 + 1)
    finally:
        os.close(fd)


def decode(data):
    def unique(pairs):
        result = {}
        for key, value in pairs:
            require(key not in result, 'duplicate JSON key')
            result[key] = value
        return result
    try:
        value = json.loads(data, object_pairs_hook=unique)
    except (ValueError, UnicodeError) as exc:
        raise Denied('malformed JSON') from exc
    require(encoded(value) == data, 'noncanonical/partial JSON')
    return value


def syncdir(path):
    fd = os.open(path, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW)
    try:
        os.fsync(fd)
    finally:
        os.close(fd)


def exclusive(path, value):
    """Never replace a file; a partial write is a permanent fail-closed barrier."""
    data = encoded(value)
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o444)
    try:
        offset = 0
        while offset < len(data):
            count = os.write(fd, data[offset:])
            require(count > 0, 'short write')
            offset += count
        os.fsync(fd)
    finally:
        os.close(fd)
    syncdir(Path(path).parent)


class Journal:
    def __init__(self, root, contract_path, contract_sha, import_path, import_sha):
        self.root = Path(root)
        self.contract_path = Path(contract_path)
        self.contract_sha = contract_sha
        self.import_path = Path(import_path)
        self.import_sha = import_sha

    @contextmanager
    def locked(self):
        # All three directories must already exist and must not be symlinks.
        for p in [self.root, self.root / 'events', self.root / 'receipts']:
            require(p.is_dir() and not p.is_symlink(), 'unsafe/missing store')
        fd = os.open(self.root / 'lock', os.O_RDWR | os.O_NOFOLLOW)
        try:
            require(stat.S_ISREG(os.fstat(fd).st_mode) and
                    os.fstat(fd).st_nlink == 1, 'unsafe lock')
            fcntl.flock(fd, fcntl.LOCK_EX)
            yield
        finally:
            os.close(fd)

    def _contract(self):
        raw = read(self.contract_path)
        require(digest(raw) == self.contract_sha, 'contract pin mismatch')
        c = decode(raw)
        require(set(c) == {'schema', 'mode', 'importSha256', 'maxCalls',
                           'maxActive', 'perHost', 'targets'}, 'contract fields')
        require(type(c['schema']) is int and c['schema'] == 1 and c['mode'] == 'synthetic-only' and
                c['importSha256'] == self.import_sha, 'closed scope')
        require(integer(c['maxCalls'], 68, 758) and
                integer(c['maxActive'], 1, 4) and c['perHost'] == 1 and
                type(c['perHost']) is int, 'invalid budget')
        raw_import = read(self.import_path)
        require(digest(raw_import) == self.import_sha, 'import pin mismatch')
        imp = decode(raw_import)
        require(set(imp) == {'completed', 'frontier', 'conservativeCalls',
                             'exactAttemptsEstablished'}, 'import fields')
        require(len(imp['completed']) == 64 and len(imp['frontier']) == 4 and
                imp['conservativeCalls'] == 68 and
                imp['exactAttemptsEstablished'] is False, 'invalid historical accounting')
        require(len({x['recordSha256'] for x in imp['completed']}) == 64 and
                all(HEX.fullmatch(x['recordSha256']) for x in imp['completed']),
                'invalid completed import')
        require(len({x['recordSha256'] for x in imp['frontier']}) == 4 and
                all(HEX.fullmatch(x['recordSha256']) for x in imp['frontier']),
                'invalid frontier import')
        targets = c['targets']
        require(isinstance(targets, list) and len(targets) <= 500, 'scope size')
        require(len({t['targetId'] for t in targets}) == len(targets), 'duplicate target')
        require(len({t['order'] for t in targets}) == len(targets), 'duplicate order')
        require(len({t['locatorSha256'] for t in targets}) == len(targets), 'locator alias')
        for t in targets:
            require(set(t) == {'targetId', 'order', 'locatorSha256', 'host', 'tool',
                               'preflightSha256', 'synthetic', 'held'}, 'target fields')
            require(integer(t['order'], 1, 10000) and
                    HEX.fullmatch(t['locatorSha256']) and
                    HEX.fullmatch(t['preflightSha256']) and
                    type(t['synthetic']) is bool and type(t['held']) is bool,
                    'invalid target')
            if t['synthetic']:
                require(NAME.fullmatch(t['targetId']) and t['host'].endswith('.invalid')
                        and t['tool'] == 'synthetic.response', 'synthetic scope')
            else:
                require(t['held'] is True, 'real target must stay held')
        return c, imp

    def _state(self, pinned_head=None):
        c, imp = self._contract()
        require(set(p.name for p in self.root.iterdir()) ==
                {'anchor.json', 'lock', 'events', 'receipts'}, 'unexpected store entry')
        anchor = decode(read(self.root / 'anchor.json'))
        require(encoded(anchor) == encoded({'schema': 1, 'contractSha256': self.contract_sha,
                           'importSha256': self.import_sha}), 'anchor mismatch')
        names = sorted(p.name for p in (self.root / 'events').iterdir())
        expected = [f'{i:08}.json' for i in range(1, len(names) + 1)]
        require(names == expected and sorted(p.name for p in
                (self.root / 'receipts').iterdir()) == expected, 'partial/missing event or receipt')
        head = digest(encoded(anchor))
        intents, results, active = {}, {}, {}
        for i, name in enumerate(names, 1):
            raw = read(self.root / 'events' / name)
            e = decode(raw)
            require(set(e) == {'sequence', 'previous', 'kind', 'data'} and
                    type(e['sequence']) is int and e['sequence'] == i and
                    e['previous'] == head, 'broken chain')
            head = digest(raw)
            require(read(self.root / 'receipts' / name) ==
                    encoded({'sequence': i, 'eventSha256': head}), 'receipt mismatch')
            d = e['data']
            if e['kind'] == 'intent':
                require(isinstance(d, dict) and set(d) == {'target', 'locator'}, 'intent schema')
                t = d['target']
                self._eligible(c, imp, intents, active, t, d['locator'])
                intents[t['targetId']] = e
                active[t['targetId']] = e
            elif e['kind'] == 'result':
                require(isinstance(d, dict) and set(d) ==
                        {'intentSequence', 'targetId', 'status', 'resultSha256', 'bytes'},
                        'result schema')
                target = d['targetId']
                require(target in intents and target not in results and
                        type(d['intentSequence']) is int and
                        d['intentSequence'] == intents[target]['sequence'], 'result binding/duplicate')
                require(d['status'] in {'completed', 'failed', 'unknown'} and
                        HEX.fullmatch(d['resultSha256']) and integer(d['bytes'], 0, 1048576),
                        'unsafe result metadata')
                results[target] = e
                if d['status'] != 'unknown':
                    active.pop(target)
            else:
                raise Denied('unknown event')
        if pinned_head is not None:
            require(pinned_head == head, 'external head mismatch/rollback')
        return dict(contract=c, importedCalls=68, head=head, sequence=len(names),
                    intents=intents, results=results, active=active,
                    conservativeCalls=68 + len(intents))

    def _eligible(self, c, imp, intents, active, target, locator):
        require(isinstance(target, dict) and any(encoded(target) == encoded(t)
                for t in c['targets']), 'scope/target/preflight mismatch')
        require(target['synthetic'] is True and target['held'] is False,
                'real or held target: no source permission')
        require(isinstance(locator, str) and len(locator) <= 256 and
                digest(locator.encode()) == target['locatorSha256'], 'locator mismatch')
        url = urlsplit(locator)
        require(url.scheme == 'synthetic' and url.hostname == target['host'] and
                not url.username and not url.password and not url.query and
                not url.fragment and url.port is None, 'host/route mismatch')
        require(target['targetId'] not in intents, 'spent target; no replay')
        imported = {t for kind in ['completed', 'frontier']
                    for row in imp[kind] for t in row['targetIds']}
        require(target['targetId'] not in imported, 'historical reservation')
        require(68 + len(intents) < c['maxCalls'], 'call cap')
        require(len(active) < c['maxActive'], 'global active cap')
        require(not any(e['data']['target']['host'] == target['host']
                        for e in active.values()), 'host occupied, including uncertainty')

    def _append(self, state, kind, data):
        number = state['sequence'] + 1
        name = f'{number:08}.json'
        event = {'sequence': number, 'previous': state['head'], 'kind': kind, 'data': data}
        exclusive(self.root / 'events' / name, event)
        head = digest(encoded(event))
        exclusive(self.root / 'receipts' / name,
                  {'sequence': number, 'eventSha256': head})
        return {'sequence': number, 'head': head}

    def audit(self, pinned_head=None):
        with self.locked():
            return self._state(pinned_head)

    def reserve(self, target, locator, pinned_head=None):
        with self.locked():
            s = self._state(pinned_head)
            self._eligible(s['contract'], self._contract()[1], s['intents'], s['active'], target, locator)
            return self._append(s, 'intent', {'target': target, 'locator': locator})

    def result(self, target_id, intent_sequence, status, result_sha, byte_count, pinned_head=None):
        with self.locked():
            s = self._state(pinned_head)
            require(target_id in s['intents'] and target_id not in s['results'], 'missing/duplicate intent')
            require(type(intent_sequence) is int and
                    s['intents'][target_id]['sequence'] == intent_sequence, 'intent mismatch')
            require(status in {'completed', 'failed', 'unknown'} and
                    isinstance(result_sha, str) and HEX.fullmatch(result_sha) and
                    integer(byte_count, 0, 1048576), 'unsafe result metadata')
            return self._append(s, 'result', {'targetId': target_id,
                                'intentSequence': intent_sequence, 'status': status,
                                'resultSha256': result_sha, 'bytes': byte_count})

    def synthetic_call(self, target, locator):
        """Fixed fictional work only, with no callback capable of source access.

        Return only AFTER both immutable intent and result receipts are durable.
        If interrupted anywhere after reservation, that target remains spent.
        """
        intent = self.reserve(target, locator)
        response = b'fictional synthetic response\n'
        return self.result(target['targetId'], intent['sequence'], 'completed',
                           digest(response), len(response))
