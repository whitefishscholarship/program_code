"""Integration-only tests. No source/provider/network calls; old synthetic tests not replayed."""
from pathlib import Path
import importlib.util
import tempfile
import unittest
from unittest.mock import patch
import json
import subprocess

spec=importlib.util.spec_from_file_location('actual_adapter',Path(__file__).with_name('adapter.py'))
a=importlib.util.module_from_spec(spec);spec.loader.exec_module(a)

class Controls(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup)
        self.root=Path(self.tmp.name).resolve()/a.CAMPAIGN;self.custody=Path(self.tmp.name).resolve()/(a.CAMPAIGN+'-custody')
        for key,value in [('STORE_ROOT',self.root),('CUSTODY_ROOT',self.custody)]:
            patcher=patch.object(a,key,value);patcher.start();self.addCleanup(patcher.stop)
        repo=Path(self.tmp.name)/'git';repo.mkdir();subprocess.run(['git','init','-q',str(repo)],check=True)
        def testgit(*args,data=None):return subprocess.check_output(['git',*args],input=data,cwd=repo,stderr=subprocess.DEVNULL)
        patcher=patch.object(a,'git',side_effect=testgit);patcher.start();self.addCleanup(patcher.stop)
        self.p=patch.object(a,'gates',return_value='a'*64);self.p.start();self.addCleanup(self.p.stop)
        self.c=a.provision(self.root,self.custody,Path(self.tmp.name)/'fresh.json')
    def head(self):return self.c.audit()['head']
    def test_exact_order_immediate_safe_results_and_restart(self):
        first=a.scope()['targets'][0]
        response={'status':'proposed-quarantined','bodySha256':'b'*64,'bytes':4,'values':{}}
        def request(t):
            self.assertEqual(t,first)
            self.assertTrue((self.custody/'00000001.json').exists())
            self.assertEqual(a.j.decode(a.j.read(self.root/'events/00000001.json'))['kind'],'intent')
            return response
        with patch.object(a,'eligible',return_value=True),patch.object(a,'_request',side_effect=request) as req:
            old=self.head();self.c.run_next(old);self.assertEqual(req.call_count,1)
            self.assertEqual(self.c.audit()['cursor'],1)
            self.assertEqual(set(self.c.audit()['outcomes'][0]['fields']),set(first['materialProofGaps']))
            restart=a.Campaign(self.root,self.custody,'unused')
            self.assertEqual(restart.audit()['calls'],1)
            with self.assertRaises(a.j.Denied):restart.run_next(old)
    def test_callback_loss_spends_and_stops(self):
        with patch.object(a,'eligible',return_value=True),patch.object(a,'_request',side_effect=TimeoutError) as req:
            self.c.run_next(self.head());self.assertEqual(req.call_count,1)
            s=self.c.audit();self.assertEqual(s['calls'],1);self.assertIsNotNone(s['active'])
            with self.assertRaises(a.j.Denied):self.c.run_next(s['head'])
            self.assertEqual(req.call_count,1)
    def test_interruption_before_result_then_restart_no_replay(self):
        with patch.object(a,'eligible',return_value=True),patch.object(a,'_request',side_effect=KeyboardInterrupt) as req:
            with self.assertRaises(KeyboardInterrupt):self.c.run_next(self.head())
            self.assertEqual(req.call_count,1)
            restart=a.Campaign(self.root,self.custody,'unused')
            with self.assertRaises(a.j.Denied):restart.run_next(restart.audit()['head'])
    def test_receipt_loss_stops_before_request(self):
        with patch.object(a,'eligible',return_value=False):self.c.run_next(self.head())
        (self.custody/'00000001.json').unlink()
        with patch.object(a,'_request') as req:
            with self.assertRaises(a.j.Denied):self.c.audit()
            req.assert_not_called()
    def test_unsafe_skips_and_complete_denominator_budget(self):
        with patch.object(a,'eligible',return_value=False),patch.object(a,'_request') as req:
            for i in range(100):self.c.run_next(self.head())
            self.assertEqual(self.c.audit()['cursor'],100);self.assertEqual(self.c.audit()['calls'],0)
            with self.assertRaises(a.j.Denied):self.c.run_next(self.head())
            req.assert_not_called()
    def test_hundred_exact_requests_then_cap(self):
        with patch.object(a,'eligible',return_value=True),patch.object(a,'_request',return_value={'status':'held-response','bodySha256':None,'bytes':0,'values':{}}) as req:
            for i in range(100):self.c.run_next(self.head())
            self.assertEqual(req.call_count,100);self.assertEqual(self.c.audit()['calls'],100)
            self.assertEqual(len(self.c.audit()['outcomes']),100)
            with self.assertRaises(a.j.Denied):self.c.run_next(self.head())
            self.assertEqual(req.call_count,100)
    def test_custody_failure_before_dispatch(self):
        original=self.c._append
        def fail(state,kind,data):
            if kind=='intent':
                self.c.protocol._append(state,kind,data)
                raise OSError('custody unavailable')
            return original(state,kind,data)
        with patch.object(a,'eligible',return_value=True),patch.object(self.c,'_append',side_effect=fail),patch.object(a,'_request') as req:
            with self.assertRaises(OSError):self.c.run_next(self.head())
            req.assert_not_called()
        with self.assertRaises(a.j.Denied):self.c.audit()
    def test_alternate_parent_and_store_loss_cannot_reprovision(self):
        with self.assertRaises(a.j.Denied):a.Campaign(self.root.parent/'different'/a.CAMPAIGN,self.custody,'unused')
        import shutil
        shutil.rmtree(self.root);shutil.rmtree(self.custody)
        with self.assertRaises(subprocess.CalledProcessError):a.provision(self.root,self.custody,'unused')
        self.assertFalse(self.root.exists())
    def test_consistent_store_custody_rollback_detected(self):
        import shutil
        rootcopy=self.root.parent/'rootcopy';custodycopy=self.root.parent/'custodycopy'
        shutil.copytree(self.root,rootcopy);shutil.copytree(self.custody,custodycopy)
        with patch.object(a,'eligible',return_value=True),patch.object(a,'_request',return_value={'status':'held-response','bodySha256':None,'bytes':0,'values':{}}) as req:
            self.c.run_next(self.head());self.assertEqual(req.call_count,1)
            shutil.rmtree(self.root);shutil.rmtree(self.custody)
            shutil.copytree(rootcopy,self.root);shutil.copytree(custodycopy,self.custody)
            with self.assertRaises(a.j.Denied):self.c.audit()
            req.assert_called_once()
    def test_external_cursor_loss_stops(self):
        a.git('update-ref','-d',a.HEAD_REF) # fault injection only; production exposes no delete API
        with patch.object(a,'_request') as req:
            with self.assertRaises(subprocess.CalledProcessError):self.c.audit()
            req.assert_not_called()
    def test_external_sync_failure_stops_before_dispatch(self):
        with patch.object(a,'eligible',return_value=True),patch.object(a.os,'fsync',side_effect=OSError('durability unavailable')),patch.object(a,'_request') as req:
            with self.assertRaises(OSError):self.c.run_next(self.head())
            req.assert_not_called()
    def test_original_affinity_pins_no_reassessment(self):
        target=a.scope()['targets'][0]
        self.assertIsInstance(a.eligible(target),bool)
        target=dict(target);target['exactLocatorSha256']='0'*64
        self.assertFalse(a.eligible(target))
    def test_provision_cannot_reset(self):
        with self.assertRaises(subprocess.CalledProcessError):a.provision(self.root,self.custody,'unused')
        with self.assertRaises(a.j.Denied):a.Campaign(Path(self.tmp.name)/'old-journal',self.custody,'unused')
    def test_project_no_prose_or_contact(self):
        target=dict(a.scope()['targets'][0]);target['affectedSavedInputs']=['one'];target['materialProofGaps']=['one#minimumGPA','one#eligibility']
        safe=a.project(b'<p>Minimum GPA: 3.25. Contact Jane Doe at jane@example.org 123-456-7890</p>',target)
        self.assertEqual(safe['values'],{'one#minimumGPA':3.25})
        self.assertNotIn('Jane',json.dumps(safe));self.assertNotIn('example',json.dumps(safe))
        for body in [b'<form>Minimum GPA: 3.0</form>',b'<p>student transcript</p>']:
            self.assertEqual(a.project(body,target)['status'],'held-sensitive')
        bad=a.outcome_for(target,1,'proposed-quarantined',{'one#minimumGPA':'private prose'},'b'*64,4)
        with self.assertRaises(a.j.Denied):a.validate_outcome(bad,target,1)
        self.assertEqual(a.project(b'Minimum GPA: 3.0 and minimum GPA: 3.5',target)['values'],{})
    def test_http_redirect_content_boundary(self):
        class Response:
            status=302
            def getheader(self,k,default=None):return default
            def read(self,n):raise AssertionError('redirect body must not be read')
        class Conn:
            def __init__(self,*args,**kwargs):pass
            def request(self,*args,**kwargs):pass
            def getresponse(self):return Response()
            def close(self):pass
        with patch.object(a,'PublicHTTPS',Conn):self.assertEqual(a._request(a.scope()['targets'][0])['status'],'held-response')
    def test_dns_private_no_connect(self):
        with patch.object(a.socket,'getaddrinfo',return_value=[(2,1,6,'',('127.0.0.1',443))]),patch.object(a.socket,'socket') as sock:
            with self.assertRaises(a.j.Denied):a.PublicHTTPS('public.invalid').connect()
            sock.assert_not_called()
    def test_real_gates_no_attestation_no_request(self):
        self.p.stop()
        with patch.object(a,'_request') as req:
            with self.assertRaises((a.j.Denied,FileNotFoundError)):a.gates('missing.json')
            req.assert_not_called()
        self.p.start()

if __name__=='__main__':unittest.main()
