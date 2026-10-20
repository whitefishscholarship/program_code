"""Fictional local fixtures only. Real source callbacks are intentionally absent."""
from pathlib import Path
import copy
import json
import os
import signal
import tempfile
import unittest
from unittest.mock import patch
import journal as j

G = Path(__file__).resolve().parent


class Controls(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix='sd2-synthetic-')
        self.root = Path(self.tmp.name)
        self.imp = (G / 'historical-import.json').read_bytes()
        self.import_sha = j.digest(self.imp)
        (self.root / 'import.json').write_bytes(self.imp)
        self.targets = []
        self.locators = []
        for i in range(8):
            host = f'host{i}.invalid'
            locator = f'synthetic://{host}/case{i}'
            self.locators.append(locator)
            self.targets.append(dict(targetId=f'synthetic-target-{i}', order=i + 1,
                locatorSha256=j.digest(locator.encode()), host=host,
                tool='synthetic.response', preflightSha256=j.digest(f'preflight{i}'.encode()),
                synthetic=True, held=False))
        self.c = dict(schema=1, mode='synthetic-only', importSha256=self.import_sha,
                      maxCalls=758, maxActive=4, perHost=1, targets=self.targets)
        self.provision()

    def tearDown(self):
        self.tmp.cleanup()

    def provision(self):
        # NEW fixture only; no repository queue or real journal is opened.
        self.store = self.root / f'store{len(list(self.root.glob("store*")))}'
        self.store.mkdir()
        (self.store / 'events').mkdir()
        (self.store / 'receipts').mkdir()
        (self.store / 'lock').touch(mode=0o600)
        self.cp = self.root / (self.store.name + '-contract.json')
        self.cp.write_bytes(j.encoded(self.c))
        self.pin = j.digest(self.cp.read_bytes())
        j.exclusive(self.store / 'anchor.json', dict(schema=1,
                    contractSha256=self.pin, importSha256=self.import_sha))
        self.journal = j.Journal(self.store, self.cp, self.pin,
                                self.root / 'import.json', self.import_sha)

    def reserve(self, i=0, **kwargs):
        return self.journal.reserve(self.targets[i], self.locators[i], **kwargs)

    def finish(self, i=0, status='completed'):
        e = self.journal.audit()['intents'][self.targets[i]['targetId']]
        return self.journal.result(self.targets[i]['targetId'], e['sequence'], status,
                                   j.digest(b'fictional safe response'), 24)

    def test_immediate_immutable_result_and_restart(self):
        a = self.reserve()
        self.assertEqual(self.journal.audit(a['head'])['conservativeCalls'], 69)
        self.finish()
        fresh = j.Journal(self.store, self.cp, self.pin, self.root / 'import.json', self.import_sha)
        self.assertEqual(len(fresh.audit()['results']), 1)
        with self.assertRaises(j.Denied): self.reserve()
        with self.assertRaises(j.Denied): self.finish()

    def test_crash_after_reservation_before_work(self):
        pid = os.fork()
        if pid == 0:
            self.reserve()
            os.kill(os.getpid(), signal.SIGKILL)
        os.waitpid(pid, 0)
        self.assertEqual(len(self.journal.audit()['active']), 1)
        with self.assertRaises(j.Denied): self.reserve()

    def test_cancel_after_synthetic_work_before_result(self):
        pid = os.fork()
        if pid == 0:
            self.reserve()
            j.exclusive(self.root / 'synthetic-work-marker', {'fictionalWork': True})
            os.kill(os.getpid(), signal.SIGTERM)
        os.waitpid(pid, 0)
        self.assertTrue((self.root / 'synthetic-work-marker').exists())
        self.assertEqual(len(self.journal.audit()['active']), 1)
        with self.assertRaises(j.Denied): self.reserve()

    def crash_gap(self, result=False):
        if result: self.reserve()
        pid = os.fork()
        if pid == 0:
            original = j.exclusive
            def gap(path, value):
                original(path, value)
                if Path(path).parent.name == 'events':
                    os.kill(os.getpid(), signal.SIGKILL)
            j.exclusive = gap
            self.finish() if result else self.reserve()
            os._exit(99)
        os.waitpid(pid, 0)
        with self.assertRaises(j.Denied): self.journal.audit()
        with self.assertRaises(j.Denied): self.reserve(1)

    def test_intent_event_receipt_crash_gap(self): self.crash_gap()
    def test_result_event_receipt_crash_gap(self): self.crash_gap(True)

    def test_competing_processes_one_winner(self):
        rd, wr = os.pipe()
        pids = []
        for _ in range(6):
            pid = os.fork()
            if pid == 0:
                os.close(wr)
                os.read(rd, 1)
                try:
                    self.reserve()
                    os._exit(0)
                except j.Denied:
                    os._exit(2)
                except BaseException:
                    os._exit(3)
            pids.append(pid)
        os.close(rd)
        os.write(wr, b'xxxxxx')
        os.close(wr)
        statuses = [os.waitstatus_to_exitcode(os.waitpid(pid, 0)[1]) for pid in pids]
        self.assertEqual(statuses.count(0), 1)
        self.assertEqual(statuses.count(2), 5)
        self.assertEqual(len(self.journal.audit()['intents']), 1)

    def test_partial_write_blocks_restart(self):
        write = os.write
        calls = 0
        def partial(fd, data):
            nonlocal calls
            calls += 1
            if calls == 1: return write(fd, data[:5])
            raise OSError('synthetic disk interruption')
        with patch.object(j.os, 'write', side_effect=partial):
            with self.assertRaises(OSError): self.reserve()
        with self.assertRaises(j.Denied): self.journal.audit()

    def test_fsync_failure_prevents_return(self):
        with patch.object(j.os, 'fsync', side_effect=OSError('synthetic fsync failure')):
            with self.assertRaises(OSError): self.reserve()
        with self.assertRaises(j.Denied): self.journal.audit()

    def test_exclusive_file_never_overwritten(self):
        self.reserve()
        p = self.store / 'events/00000001.json'
        before = p.read_bytes()
        with self.assertRaises(FileExistsError): j.exclusive(p, {'replacement': True})
        self.assertEqual(before, p.read_bytes())

    def test_lost_response_remains_spent_and_active(self):
        self.reserve()
        self.finish(status='unknown')
        self.assertEqual(len(self.journal.audit()['active']), 1)
        with self.assertRaises(j.Denied): self.reserve()
        with self.assertRaises(j.Denied): self.finish()

    def test_failed_response_consumes_call_forever(self):
        self.reserve(); self.finish(status='failed')
        self.assertEqual(self.journal.audit()['conservativeCalls'], 69)
        with self.assertRaises(j.Denied): self.reserve()

    def test_result_without_intent(self):
        with self.assertRaises(j.Denied):
            self.journal.result('synthetic-target-0', 1, 'completed', j.digest(b'x'), 1)

    def test_bad_result_binding_and_raw_payload(self):
        self.reserve()
        for seq, sha, count in [(2, j.digest(b'x'), 1), (1, 'raw source prose', 1),
                                (1, j.digest(b'x'), True), (1, j.digest(b'x'), 1048577)]:
            with self.assertRaises(j.Denied):
                self.journal.result(self.targets[0]['targetId'], seq, 'completed', sha, count)

    def test_target_order_tool_preflight_host_mismatch(self):
        for key, value in [('targetId','synthetic-other'), ('order',99), ('order',True),
                           ('tool','google_drive.fetch'), ('preflightSha256',j.ZERO),
                           ('host','other.invalid'), ('held',True)]:
            t = dict(self.targets[0]); t[key] = value
            with self.assertRaises(j.Denied): self.journal.reserve(t, self.locators[0])

    def test_locator_mismatch(self):
        with self.assertRaises(j.Denied):
            self.journal.reserve(self.targets[0], 'synthetic://host0.invalid/changed')

    def test_contract_import_and_anchor_pin_mismatch(self):
        for p in [self.cp, self.root / 'import.json', self.store / 'anchor.json']:
            p.chmod(0o644)  # deliberate NEW fictional fixture tampering
            before = p.read_bytes(); p.write_bytes(before + b' ')
            with self.assertRaises(j.Denied): self.journal.audit()
            p.write_bytes(before)  # fictional fixture fault injection only

    def test_head_rollback_mismatch(self):
        prior = self.journal.audit()['head']; self.reserve()
        with self.assertRaises(j.Denied): self.journal.audit(prior)

    def test_event_receipt_tamper_and_missing_sequence(self):
        self.reserve()
        path = self.store / 'receipts/00000001.json'
        path.chmod(0o644); path.write_bytes(j.encoded({'sequence':1,'eventSha256':j.ZERO}))
        with self.assertRaises(j.Denied): self.journal.audit()

    def test_missing_and_unexpected_event(self):
        self.reserve()
        (self.store / 'events/00000001.json').rename(self.store / 'events/00000002.json')
        with self.assertRaises(j.Denied): self.journal.audit()

    def test_symlink_barrier(self):
        (self.store / 'events/00000001.json').symlink_to(self.cp)
        (self.store / 'receipts/00000001.json').write_text('{}')
        with self.assertRaises((j.Denied, OSError)): self.journal.audit()

    def test_global_active_cap(self):
        for i in range(4): self.reserve(i)
        with self.assertRaises(j.Denied): self.reserve(4)
        self.finish(); self.reserve(4)

    def test_same_host_cap_including_unknown(self):
        self.targets[1]['host'] = self.targets[0]['host']
        self.locators[1] = 'synthetic://host0.invalid/second'
        self.targets[1]['locatorSha256'] = j.digest(self.locators[1].encode())
        self.provision(); self.reserve(); self.finish(status='unknown')
        with self.assertRaises(j.Denied): self.reserve(1)

    def test_call_budget_includes_historical_68(self):
        self.c['maxCalls'] = 69; self.provision()
        self.reserve(); self.finish()
        with self.assertRaises(j.Denied): self.reserve(1)

    def test_invalid_budget_rejected(self):
        for key, value in [('maxCalls',759), ('maxCalls',True), ('maxActive',5), ('perHost',2)]:
            c = copy.deepcopy(self.c); c[key] = value
            before = self.c; self.c = c; self.provision()
            with self.assertRaises(j.Denied): self.journal.audit()
            self.c = before

    def test_all397_real_targets_denied(self):
        c = json.loads((G / 'contract.json').read_bytes())
        self.c = c; self.provision()
        triage = json.loads((G.parent / 'sd2-resolution-proof-1/triage.json').read_bytes())['targets']
        for target, tri in zip(c['targets'], triage):
            with self.assertRaises(j.Denied): self.journal.reserve(target, tri['exactLocator'])
        self.assertEqual(self.journal.audit()['sequence'], 0)

    def test_native_and_live_tool_cannot_be_unheld_synthetic(self):
        self.targets[0]['tool'] = 'google_drive.fetch'; self.provision()
        with self.assertRaises(j.Denied): self.reserve()

    def test_duplicate_json_key_rejected(self):
        with self.assertRaises(j.Denied): j.decode(b'{"x":1,"x":2}\n')

    def test_cancel_before_reservation_cannot_create_work(self):
        pid = os.fork()
        if pid == 0: os.kill(os.getpid(), signal.SIGKILL)
        os.waitpid(pid, 0)
        self.assertEqual(self.journal.audit()['sequence'], 0)

    def test_duplicate_order_or_locator_contract_denied(self):
        for key in ['order', 'locatorSha256']:
            old = self.targets[1][key]
            self.targets[1][key] = self.targets[0][key]
            self.provision()
            with self.assertRaises(j.Denied): self.journal.audit()
            self.targets[1][key] = old

    def test_external_head_detects_removed_complete_suffix(self):
        receipt = self.reserve()
        # Deliberate synthetic disk-loss simulation. Never an operational repair API.
        (self.store / 'events/00000001.json').unlink()
        (self.store / 'receipts/00000001.json').unlink()
        with self.assertRaises(j.Denied): self.journal.audit(receipt['head'])

    def test_short_write_zero_fails_closed(self):
        with patch.object(j.os, 'write', return_value=0):
            with self.assertRaises(j.Denied): self.reserve()
        with self.assertRaises(j.Denied): self.journal.audit()

    def test_fixed_synthetic_call_persists_each_result_before_return(self):
        receipt = self.journal.synthetic_call(self.targets[0], self.locators[0])
        state = self.journal.audit(receipt['head'])
        self.assertEqual(state['sequence'], 2)
        self.assertEqual(len(state['results']), 1)
        for p in (self.store / 'events').iterdir():
            self.assertNotIn(b'fictional synthetic response', p.read_bytes())

    def test_reservation_failure_prevents_synthetic_work(self):
        with patch.object(self.journal, 'reserve', side_effect=j.Denied('blocked')):
            with patch.object(self.journal, 'result') as result:
                with self.assertRaises(j.Denied):
                    self.journal.synthetic_call(self.targets[0], self.locators[0])
                result.assert_not_called()


if __name__ == '__main__':
    unittest.main(verbosity=2)
