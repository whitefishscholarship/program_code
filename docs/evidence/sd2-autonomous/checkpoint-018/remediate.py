"""Apply exactly the three independent findings from retained evidence; no source access."""
from pathlib import Path
import json,hashlib,copy,datetime
P=Path(__file__).resolve().parent;B=P.parent
load=lambda p:json.loads(p.read_text());sha=lambda b:hashlib.sha256(b).hexdigest()
l=load(B/'checkpoint-018.json');review=load(P/'review-round1.json');m=load(P/'manifest-round1.json')
assert review['outcome']=='FAIL' and review['binding']['candidateCommit']==m['candidateCommit']=='75861c229b6d9b0494b7c3f65b25a2502f07b607'
assert sha((P/'manifest-round1.json').read_bytes())==review['binding']['manifestSha256']
assert l['coverage']['fieldEnvelopes']==307 and not (P/'remediation.json').exists()
rows={r['rowLocator']:r for r in l['records']}
def semantic(f):f['semanticAssertion']='Typed held observation: '+json.dumps(f['value'],ensure_ascii=False,separators=(',',':'))
r=rows[359];f=r['fieldProposals']['eligibility'];template=copy.deepcopy(r['fieldProposals']['minimumGPA'])
template['value']={'historical2026Only':True,'intentToEnrollRequired':True,'institutionScope':'post-secondary educational institution','term':'fall2026','futureOfferingUnknown':True}
template['sourceScope']='RISE historical2026 application eligibility only; future offering and independent identity remain held.'
e=template['evidence'][0];t=(P/'sources/risepdf.md').read_text();start=t.index('• Intend to enroll');end=t.index('• Submit',start);e['excerpt']=t[start:end].strip();line=t[:start].count('\n')+1;e['locator']=f'Selected enrollment-intent passage lines {line}-{line+e["excerpt"].count(chr(10))}'
semantic(template);r['fieldProposals']['eligibility']=template
r=rows[352];f=r['fieldProposals']['amount']
f['value']['DECAProgramDisbursement']={'mustCompleteForm':True,'formEmailedMonth':'May','generalDECAProgramOnly':True,'formUrl':None,'unvisitedChildApplicationRequirementsNotInferred':True}
f['sourceScope']='NTHS named child award amount; separately general DECA program disbursement conditions, not the unvisited child application.';semantic(f)
f=copy.deepcopy(r['fieldProposals']['amount']);f['evidence']=[copy.deepcopy(e) for e in f['evidence'] if e['sourceId']=='deca'];t=(P/'sources/deca.md').read_text();sentence=next(x for x in t.splitlines() if x.startswith('The Corporate Scholarship Program consists'))
e=f['evidence'][0];e['excerpt']=sentence;e['locator']='Selected DECA Corporate Scholarship Program paragraph, line '+str(t[:t.index(sentence)].count('\n')+1)
f['value']={'generalDECACorporateProgramOnly':True,'donorSpecificCriteriaAlsoApply':True,'selectionFactors':['DECA involvement','leadership ability','community service','academic performance'],'notMandatoryChildEligibility':True,'noScoringOrHardExclusionAuthority':True}
f['sourceScope']='General DECA Corporate Scholarship Program selection observation only; not mandatory child eligibility, accepted facts, scoring or hard exclusions.';semantic(f);r['fieldProposals']['selection']=f
actions={352:'Reconcile dualNTHS-DECA child Januarydatevariants,essay/generalfulltime/merit/material rules; preserve generalDECA May-emailed payment-form completion and donor/fourfactor selection separately from child eligibility; accounts/formURL/fullchild requirements remain unknown.',359:'Reconcile exact saved RISE input/duplicate relationship, historical2026 requiredintent to enroll in postsecondaryinstitution in fall2026,separate paymentproof,currentformer/finalcurrentaffiliation,MST-MDT,3.5,two provideruploadedletters/threeessays; no merge/futureoffering/acceptance.'}
for n,action in actions.items():
 r=rows[n];r['nextAction']=action
 for f in r['fieldProposals'].values():f['nextAction']=action
 for d in r['seedDispositions']:d['nextAction']=action
l['coverage']['fieldEnvelopes']=308;l['coverage']['cumulativeAutonomousHeldFields']=6561
assert sum(len(r['fieldProposals']) for r in l['records'])==308
(B/'checkpoint-018.json').write_text(json.dumps(l,ensure_ascii=False,indent=2)+'\n')
dispositions=[]
for id,why,target in [('SD2-018-M1','Typed the separate historical2026 postsecondary enrollment-intent condition using exact retained RISE paragraph.','row359 eligibility'),('SD2-018-M2','Retained the general DECA May-emailed payment-form condition separately from unseen child application.','row352 amount.DECAProgramDisbursement'),('SD2-018-M3','Typed general corporate DECA donor/fourfactor selection separately from child eligibility and hard exclusions.','row352 selection')]:
 dispositions.append(dict(id=id,severity='medium',disposition='fixed; independent recheck required',rationale=why,owner='Codex checkpoint018 implementation',trigger='Before final independent replacement-candidate review',target=target))
receipt=dict(priorCandidateCommit=m['candidateCommit'],priorManifestSha256=sha((P/'manifest-round1.json').read_bytes()),priorReviewSha256=sha((P/'review-round1.json').read_bytes()),priorVerificationSha256=sha((P/'verification-round1.json').read_bytes()),recordedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),newSourceReads=0,allSourceReceiptsUnchanged=True,priorHeldValuesPreservedExceptThreeScopedRepairs=True,oldFieldEnvelopes=307,newFieldEnvelopes=308,cumulativeHeldFields=6561,dispositions=dispositions)
(P/'remediation.json').write_text(json.dumps(receipt,indent=2)+'\n')
print('Three count-matched author repairs from retained evidence;308fields/6561cumulative remain held.')
