"""Author-only three-finding repair from retained evidence; zero new source reads."""
from pathlib import Path
import json,hashlib,subprocess,copy,datetime
P=Path(__file__).resolve().parent;R=P.parents[3]
load=lambda p:json.loads(p.read_text());sha=lambda b:hashlib.sha256(b).hexdigest()
def write(p,v):p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
assert not (P/'remediation.json').exists(),'Do not repeat remediation'
l=load(P.parent/'checkpoint-017.json');rows={r['rowLocator']:r for r in l['records']};reg={s['sourceId']:s for s in l['sourceRegistry']}
old=copy.deepcopy(reg['pizzinipdf']);s=reg['pizzinipdf'];raw=(R/s['artifactPath']).read_bytes();t=raw.decode()
assert 'two confidential letters of recommendation' in t and 'Health care and/or long-term care involvement' in t
s['artifactSha256']=sha(raw);s['selectedCharacters']=len(t);s['selectionAccounting']['finalCharacters']=len(t)
for r in l['records']:
 for f in r['fieldProposals'].values():
  for e in f['evidence']:
   if e['sourceId']=='pizzinipdf':e.update(artifactSha256=s['artifactSha256'],excerpt=t.strip(),locator='Selected program passage, lines 1-'+str(len(t.splitlines())))
def sync(f):f['semanticAssertion']='Typed held observation: '+json.dumps(f['value'],ensure_ascii=False,separators=(',',':')) if f['value'] is not None else 'Unknown remains non-excluding.'
f=rows[333]['fieldProposals']['applicantStage'];f.update(value={'observedEligibleStudentLabels':['Current College Students','Graduating High School Seniors'],'labelsAreNotAnInventedExclusiveEligibilityRule':True},state='verified',evidence=copy.deepcopy(rows[333]['fieldProposals']['eligibility']['evidence']),observedAt=reg['gbci']['observedAt']);sync(f)
for row in [338,339]:
 f=rows[row]['fieldProposals']['fundUse'];f['value']['PDFTermsOfUseAllowedExamples']={'items':['tuition','most fees','required textbooks','approved required school uniforms'],'scope':'Exact family PDF Terms of Use; retained separately from general Higher Education FAQ','reconciliation':'held; no all-fees inference or guaranteed uniform reimbursement'};sync(f)
f=rows[339]['fieldProposals']['eligibility'];f['value']['enrollmentStatusOR']=['enrolled','planning to enroll'];sync(f)
f=rows[339]['fieldProposals']['cycle'];assert f['value'].pop('FAQ')=='no accommodations outside Feb1–Mar31';f['state']='unverified';sync(f)
f=rows[339]['fieldProposals']['renewal'];assert f['value'].pop('legacyConsecutiveYears').startswith('first-responder');sync(f)
write(P.parent/'checkpoint-017.json',l);write(P/'source-receipts.json',l['sourceRegistry'])
c=load(P/'capture-metadata.json')
for source in c['sources']:
 if source['sourceId']=='pizzinipdf':source['selectedCharacters']=len(t);source['selectionRemediation']='Original in-session recommendation-region restored; no source reacquisition. Original candidate and hash retained in remediation.json.'
write(P/'capture-metadata.json',c)
c=load(P/'source-concordance.json')
for check in c['checks']:
 if check['sourceId']=='pizzinipdf':check.update(finalArtifactSha256=sha(raw),selectedCharacters=len(t),restoration='Author-only exact region from original in-session conversion; initial omitted-region hash is superseded, not final.')
write(P/'source-concordance.json',c)
review=load(P/'review-round1.json');manifest=load(P/'manifest-round1.json')
dispositions=[]
for f in review['findings']:
 rationale={'SD2-017-M1':'Restored exact recommendation paragraph from original retained in-session conversion. The original end-marker search matched an earlier contents occurrence; a start-scoped search restored confidentiality and healthcare/LTC selection wording. Refreshed source/capture/registry/excerpts/hashes; no new fetch or original/native fidelity claim.', 'SD2-017-M2':'Typed GBCI observed student labels without exclusivity, military enrolled-or-planning eligibility, and each family PDF Terms of Use examples (most fees/approved required school uniforms) separately from general FAQ costs.', 'SD2-017-M3':'Removed first-responder FAQ/legacy observations from military row339; retained military annual window/weekend extension and changed cycle to unverified, not a cross-family conflict. Source-specific first-responder observations remain only on row338.'}[f['id']]
 dispositions.append(dict(id=f['id'],severity=f['severity'],status='author-fixed; independent recheck required',rationale=rationale,owner='Codex implementation owner',trigger='Independent replacement-candidate review',target='checkpoint-017/final-manifest.json and replacement review.json'))
write(P/'remediation.json',dict(recordedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),priorCandidateCommit=manifest['candidateCommit'],priorManifestSha256=sha((P/'manifest-round1.json').read_bytes()),priorReviewSha256=sha((P/'review-round1.json').read_bytes()),priorVerificationSha256=sha((P/'verification-round1.json').read_bytes()),dispositions=dispositions,newSourceReads=0,fieldCountsAndHoldsUnchanged=True,originalSourceSha256Superseded=old['artifactSha256'],finalSourceSha256=sha(raw),sourceArtifact=s['artifactPath'],scope='Only current packet remediation; rejected binding and every prior checkpoint remain exact'))
print(json.dumps({'fixedFindings':3,'newSourceReads':0,'fieldCountsAndHoldsUnchanged':True},indent=2))
