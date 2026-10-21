"""Build only local, nonaccepted proposals from retained selected source sections."""
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PILOT = json.loads((ROOT.parent / 'sd1/pilot.json').read_text())
ORDER = PILOT['firstSD2Batch']
SOURCES = {
    'pell': 'https://www.carroll.edu/admission-aid/financial-aid/types-aid/pell-promise',
    'nd-singular': 'https://thendalliance.org/scholarship/',
    'nd-program': 'https://thendalliance.org/scholarships/',
    'nd-faq': 'https://thendalliance.org/scholarships/faq/',
    'aopa-program': 'https://www.aopa.org/training-and-safety/students/aopa-flight-training-scholarships',
    'aopa-faq': 'https://download.aopa.org/youcanfly/2026scholarshipfaq.pdf',
}
EVIDENCE = []


def fact(award, field, value, state, source, locator, scope, rationale,
         freshness='applicable', acceptance='proposed'):
    evidence_ids = []
    if source:
        capture = ROOT / (source + '-source.txt')
        digest = hashlib.sha256(capture.read_bytes()).hexdigest()
        identity = [award, field, value, state, source, locator, scope, digest, '2026-10-13']
        eid = 'evd_' + hashlib.sha256(json.dumps(identity, sort_keys=True).encode()).hexdigest()
        EVIDENCE.append({'evidenceId': eid, 'awardId': award, 'field': field,
                         'sourceId': 'src_' + hashlib.sha256(SOURCES[source].encode()).hexdigest(),
                         'sourceUrl': SOURCES[source], 'artifact': source + '-source.txt',
                         'artifactSha256': digest, 'locator': locator, 'scope': scope,
                         'observedAt': '2026-10-13', 'exactAcquisitionReceipt':
                         (source + '-http.json' if source != 'pell' else 'pell-web-observation.json'),
                         'rationale': rationale, 'acceptance': acceptance, 'reviewer': None})
        evidence_ids.append(eid)
    return {'value': value, 'state': state, 'evidenceIds': evidence_ids, 'scope': scope,
            'observedAt': '2026-10-13' if source else None, 'freshness': freshness,
            'acceptance': acceptance, 'rationale': rationale}


def record(award, row_file, outcome):
    old = next(r for r in PILOT['records'] if r['awardId'] == award)
    return {'awardId': award, 'retainedCycleSlotId': old['cycleId'],
            'recordedName': old['name'], 'identityState': 'mapped_candidate',
            'identityBasis': 'Fresh unique selected name + sponsor/program/source-route correspondence, checked against existing public ID. No row-position-only or shared-URL-only binding.',
            'freshRowCapture': row_file, 'outcome': outcome,
            'fields': {}, 'humanFactReviewer': None, 'acceptedFacts': 0,
            'studentPublication': 'held; no runtime output or Apply now classification authorized'}


pell = record(ORDER[0], 'pell-row.json', 'researched_proposals_with_explicit_unknowns')
p = pell['fields']
def pf(field, value, lines, why, state='verified', scope='Carroll Pell Promise / announced Fall 2027', freshness='applicable'):
    p[field] = fact(ORDER[0], field, value, state, 'pell', lines, scope, why, freshness)

pf('officialProgramName', 'Pell Promise for Qualified Students', 'line1-3', 'Current program heading expands the prior Montana-specific label; preserve existing award ID and proposed alias.')
pf('academicYear', {'entryTerm':'Fall 2027'}, 'line2,27', 'An announced entry term, not an application opening date.')
pf('entryGpa', {'minimum':3.0,'scale':None,'basis':None}, 'line3', 'The qualifying paragraph expressly requires GPA >=3.0; entry scale/basis is not stated. Do not derive this from the renewal bullet.')
pf('renewalGpa', {'minimum':3.0,'scale':None,'basis':'cumulative'}, 'line4,32', 'Maintain a cumulative GPA >=3.0; renewal is distinct from entry.')
pf('needRequired', 'required', 'line3,14,20,29', 'Pell eligibility is expressly required; provider describes federal Pell as need based. No generalized FAFSA-income cutoff is invented.')
pf('needSelection', None, 'line24-39', 'Inspected criteria do not state a separate need-selection preference; extra criteria may apply, so broader selection policy remains unverified.', 'unverified')
pf('amount', {'currency':'USD','tuitionCoveragePercent':100,'guaranteedGiftAmount':None,'basis':'tuition_only'}, 'line2-3,31,36-39', 'Tuition package includes loans; cannot rank as a guaranteed 100% gift or include room/board.')
pf('fundingKind', 'mixed', 'line3,21,31,39', 'Federal/institutional aid plus subsidized Stafford borrowing; amounts vary by study year.')
pf('loanComponent', {'freshman':3500,'sophomore':4500,'junior':5500,'senior':5500,'currency':'USD'}, 'line39', 'Provider-listed annual subsidized loan components, not scholarship gift amounts.')
pf('eligibleEntryTypes', ['first_time_freshman','transfer_undergraduate'], 'line2,19,27', 'First-time entering freshmen and transfers; do not claim every college student or every transfer qualifies.')
pf('eligibilityConditions', {'operator':'AND','conditions':['first-time freshman or transfer undergraduate entering Fall 2027','US residence','on-campus residence','FAFSA completion','federal Pell eligibility','loan acceptance','satisfactory academic progress','12 successfully completed credits per semester'],'extraCriteriaPossible':True}, 'line19-39', 'Keep residence, enrollment, aid and credit conditions explicit; athletic-aid exceptions are unresolved.')
pf('renewal', 'conditional', 'line4,32-35', 'Annual renewal requires continued FAFSA/Pell/campus/GPA/credit compliance; duration up to eight semesters.')
pf('maximumDuration', {'semesters':8}, 'line34', 'Conditional maximum; no guaranteed total funding.')
pf('applicationMode', 'automatic_consideration', 'line19-21', 'Proposed admission/FAFSA/aid-offer pathway; separate award-form requirement is not established. Verify automatic-consideration semantics before publication.', 'unverified')
pf('applicationRoute', {'method':'Carroll admission + FAFSA + aid-offer review','publicProgramUrl':SOURCES['pell'],'applicationWorkflowInspected':False}, 'line19-23', 'Public instructions observed; linked admissions/FAFSA workflows not opened.')
for field in ['cycleStatus','opens','deadline','schoolTypes','studyPaths','applicantStage','reapplication','recipientSlots','nomination','materials']:
    p[field] = fact(ORDER[0], field, None, 'unverified', None, None, 'unresolved',
                    'No applicable selected-source proof for this normalized field; keep unknown. An academic entry term does not establish an application window.')
pell['remaining'] = ['Pin named human reviewer before acceptance', 'Verify entry GPA scale/basis and extra/athletic criteria only under later exact source scope', 'Application-window/route-operability evidence and unsupported field gaps remain']

nd = record(ORDER[1], 'neurodiversity-row.json', 'researched_held_cycle_and_age_conflicts')
n = nd['fields']
def nf(field, value, lines, why, state='verified', source='nd-program', scope='Program eligibility block for academic 2027-2028; overall page has mixed cycle labels', freshness='applicable', acceptance='held'):
    n[field] = fact(ORDER[1], field, value, state, source, lines, scope, why, freshness, acceptance)

nf('officialProgramName', 'The Neurodiversity Scholarship', 'line2-3', 'Same named program/sponsor on both fresh singular-redirect and plural routes; preserve ID.')
nf('academicYear', '2027-2028', 'line15-16', 'Eligibility block expressly uses 2027-2028; awards/closed banner still refer to 2026/2026-2027.')
nf('age', {'minimum':16,'maximum':26,'basis':'any time during academic 2027-2028'}, 'line15', 'Current eligibility statement is observed. Publication held pending coherent cycle reconciliation; do not use the prior FAQ age to override a different academic year.')
nf('historicalAgeConflict', {'academicYear':'2026-2027','alternatives':[[16,26],[18,26]]}, 'line11,26', 'Within the same prior-cycle FAQ the list and age answer disagree. Birthdate example omitted; no provider contact authorized.', 'conflict', 'nd-faq', 'academic 2026-2027 FAQ', 'historical')
nf('studyPaths', ['associate','bachelor','certificate'], 'line16', 'Provider explicitly permits these objectives; no blanket all-trade-school claim.')
nf('institutionConditions', {'nonprofit':True,'country':'US','enrollment':['full_time','part_time']}, 'line16', 'Institution ownership/location and degree objectives stay separate from guessed school type.')
nf('needSelection', 'prioritized', 'line18', 'Priority statement combines community involvement and unmet need; exact weighting is unstated. Does not establish a financial-need eligibility requirement.')
nf('needRequired', None, 'line14-19', 'No explicit need eligibility requirement is established; the linked FAQ is older. Do not convert missing requirement or Sheet Yes into not_required/required.', 'unverified')
nf('professionalIdentification', {'required':True,'authority':'healthcare or educational professional','scope':'specified learning differences'}, 'line17', 'Observe published rule without collecting proof, applicant health data or changing app questions.')
nf('staffAndInternationalRestrictions', ['staff/board/contractors and their relatives excluded','international students on temporary visas excluded'], 'line18', 'Direct current-page restrictions; no new student question or hard exclusion implemented.')
nf('opens', {'value':'2026-11','precision':'month_only','timezone':None}, 'line33', 'Fresh live singular and plural pages agree on November 2026; no exact day/time inferred. An older cached singular view had November 2027 and is excluded from current proposals.')
nf('deadline', {'value':'2027-01','precision':'month_only','timezone':None}, 'line21-22', 'January 2027 only. The workbook exact January 1 date is not supported; prior FAQ January15,2026 is a different cycle.')
nf('cycleStatus', None, 'line1,8,15-16,21-33', 'Closed-2026 banner/2026-2027 awards coexist with 2027-2028 eligibility and newer timeline. Hold overall cycle; do not label current open/upcoming from mixed page.', 'conflict')
nf('historicalAmount', {'currency':'USD','fullTimeFourYear':2500,'communityTechnicalOrPartTimeFourYear':1000,'basis':'one_academic_year','recipientSlots':25}, 'line8-11', 'Amounts/25 recipient slots explicitly described for 2026-2027; not 25 independent awards and not established for academic2027-2028.', scope='academic 2026-2027 awards block', freshness='historical')
nf('amount', None, 'line8-16', 'No coherent next-cycle funding amount established.', 'unverified', freshness='unknown')
nf('historicalReapplication', {'allowed':True,'maximumYears':4,'newCompetitiveApplicationRequired':True}, 'line87-88', 'One-year award with competitive reapplication; no automatic renewal. Older FAQ scope only.', source='nd-faq', scope='academic 2026-2027 FAQ', freshness='historical')
nf('historicalApplicationMaterials', ['written story or video alternative','post-selection disability/enrollment/ID verification categories'], 'line44-59,69-78', 'Public categories only; no applicant document or submission accessed. Do not transfer older requirements to an unverified next cycle.', source='nd-faq', scope='academic 2026-2027 FAQ', freshness='historical')
nf('applicationRoute', {'method':'ND Alliance online portal/mobile app','applicationWorkflowInspected':False}, 'line33', 'Public route description only; login/registration/app not accessed.')
for field in ['entryGpa','renewalGpa','schoolTypes','renewal','reapplication','nomination','materials','recipientSlots']:
    n[field] = fact(ORDER[1], field, None, 'unverified', None, None, 'unresolved next cycle', 'No complete applicable proof; keep unknown rather than inherit old terms.', 'unknown', 'held')
nd['remaining'] = ['Named human fact reviewer before acceptance', 'Coherent provider cycle/funding and exact next deadline', 'Historical FAQ age conflict remains; resolve only with a selected official update, never provider contact here', 'No linked certification document, application/login, applicant data or additional awards accessed']

barnes = record(ORDER[2], 'barnes-row.json', 'researched_held_current_named_fund_offering')
b = barnes['fields']
def bf(field, value, lines, why, state='verified', source='aopa-program', scope='Named Barnes fund under Examples of Past Scholarships', freshness='historical', acceptance='held'):
    b[field] = fact(ORDER[2], field, value, state, source, lines, scope, why, freshness, acceptance)

bf('officialProgramName', 'The David and Lisa Barnes Flight Training Scholarship', 'line27-28,36-37', 'Named fund + donor + route supports retained identity; shared AOPA route does not merge child awards.')
bf('historicalAmount', {'currency':'USD','amount':10000,'recipientSlots':3,'basis':'per_recipient'}, 'line27-30', 'Past example only; three recipients of one fund, no guaranteed current offering.')
bf('historicalAgeAndTraining', {'age':[16,18],'applicantStage':'high_school_student','objective':'private_pilot_certificate'}, 'line31-34', 'Named child historical terms; do not import You Can Fly GPA or exam rules.')
bf('parentApplicationPeriods', {'spring':{'opens':'04-01','deadline':'06-30T23:59','precision':'annual_rule'},'fall':{'opens':'10-01','deadline':'12-31T23:59','precision':'annual_rule'},'timezone':'America/New_York','parentCurrentlyAdvertisingApplications':True}, 'line2,6-7,25', 'Fresh parent and four-page FAQ agree December31; older December30 observation stays historical. Parent opening does not open Barnes.', scope='AOPA parent/shared program; not Barnes cycle', freshness='applicable', acceptance='proposed')
bf('parentApplicationMode', 'eligibility_matched', 'line14-15', 'One general application automatically matches eligible scholarships; donor-funded child set is not frozen on the public page.', scope='AOPA parent/shared application; not accepted child binding', freshness='applicable', acceptance='proposed')
bf('parentMembership', {'required':True,'highSchoolFreeMembershipAvailable':True}, 'page1 Eligibility/Getting Started', 'Shared-program membership rule only; no account created.', source='aopa-faq', scope='AOPA parent FAQ revision20260925', freshness='applicable', acceptance='proposed')
bf('parentMaterials', {'writtenResponses':True,'referenceCount':2,'highSchoolTranscript':True,'referenceFormRequired':True}, 'page2 Application Requirements/Recommendation Process', 'Public required categories only, never applicant submissions. No Barnes-specific proof or inherited GPA cutoff.', source='aopa-faq', scope='AOPA parent FAQ revision20260925', freshness='applicable', acceptance='proposed')
bf('currentOffering', None, 'line15,27-38', 'Barnes appears only under past examples; donor funding determines current matches. Entire selected named section and all four FAQ pages inspected; named current fund not established.', 'unverified', freshness='unknown')
bf('applicationRoute', {'publicParentUrl':SOURCES['aopa-program'],'applicationWorkflowInspected':False,'namedFundAvailabilityVerified':False}, 'line4,14-15,27-38', 'Public common-application description is observed; no portal/login or current Barnes match inspected.', 'unverified', freshness='unknown')
for field in ['academicYear','cycleStatus','opens','deadline','amount','fundingKind','recipientSlots','needRequired','needSelection','entryGpa','renewalGpa','schoolTypes','studyPaths','applicantStage','age','renewal','reapplication','nomination','materials']:
    b[field] = fact(ORDER[2], field, None, 'unverified', None, None, 'unresolved current Barnes cycle', 'Current named child offering/terms not evidenced. Parent or past-example terms never become current child facts.', 'unknown', 'held')
barnes['remaining'] = ['Named human reviewer before acceptance', 'Current Barnes-specific offering, donor funding, cycle and applicable child criteria remain held', 'Additional source/portal/provider effects require separately selected authority; none performed']

payload = {'schemaVersion':1,'scope':'Only selected three-award SD2 local research checkpoint, not full SD2 completion',
           'asOf':'2026-10-13','workbookId':'1-rgieaL5Hd87W97Zzx9SPFFSmPAmSPGqkzPYnjDQzL0',
           'orderedAwardIds':ORDER,'acceptedFacts':0,'humanFactReviewer':None,
           'records':[pell,nd,barnes],'evidence':EVIDENCE,
           'remainingInventory':'408 unselected named rows pending; duplicate-name group held; no full canonical/public-ID reconciliation claimed',
           'privacy':'No applicant answers/documents/PII, login/application, provider contact, workbook writes, app change or external release.',
           'nextBoundary':'Stop before SD3; further SD2 research requires selected exact source/identity scope; no second review queue.'}
(ROOT / 'proposals.json').write_text(json.dumps(payload,indent=2)+'\n')
print('Three records in approved order; '+str(len(EVIDENCE))+' field evidence records; zero accepted facts.')
