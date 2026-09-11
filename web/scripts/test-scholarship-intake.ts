import assert from 'node:assert/strict';
import {canApplyIntake,INTAKE_WORKBOOK,validateProposalRecords,validateClosureRecords,type WriteGate,type Ledger,type Entity} from './scholarship-intake';
const valid:WriteGate={workbookId:INTAKE_WORKBOOK,batchDigest:'a'.repeat(64),authorizedBatchDigest:'a'.repeat(64),exactWriteAuthority:true,completeNativeBackup:true,allTabsIncludingHidden:true,privateAccessVerified:true,materialFeaturesRecoverable:true,disposableRecoveryProof:true,affectedCellBackup:true,backupUnchanged:true,freshForThisBatch:true,snapshotFingerprint:'b'.repeat(64),liveFingerprint:'b'.repeat(64),quietWindowOrAtomicPrecondition:true,independentReviewComplete:true,unresolvedHighOrCritical:0,uncertainPriorWrite:false,alreadyApplied:false};
assert(canApplyIntake(valid));
for(const key of ['exactWriteAuthority','completeNativeBackup','allTabsIncludingHidden','privateAccessVerified','materialFeaturesRecoverable','disposableRecoveryProof','affectedCellBackup','backupUnchanged','freshForThisBatch','quietWindowOrAtomicPrecondition','independentReviewComplete'] as const)assert(!canApplyIntake({...valid,[key]:false}),key);
for(const change of [{workbookId:'legacy-workbook'},{authorizedBatchDigest:null},{authorizedBatchDigest:'c'.repeat(64)},{liveFingerprint:'c'.repeat(64)},{unresolvedHighOrCritical:1},{uncertainPriorWrite:true},{alreadyApplied:true},{snapshotFingerprint:'',liveFingerprint:''}]) assert(!canApplyIntake({...valid,...change}));
console.log('Intake recovery, exact authority, newer-edit and no-blind-retry gates PASS (synthetic only).');

const observedAt='2026-09-11T00:00:00.000Z';
const proposedValues=['2026-09-11','Unknown','','Scholarship','','https://example.org/rules','Synthetic award','https://example.org/apply','Rules and exceptions remain on the card.','','','','','',''];
const addition:Entity={id:'synthetic-add',name:'Synthetic award',sourceRowIds:[],status:'reviewed-local-checkpoint',disposition:'propose_add',officialEvidenceIds:['rules'],fields:proposedValues.map((newValue,i)=>({column:String.fromCharCode(65+i),oldValue:null,newValue,sourceId:'rules',decision:newValue?'proposed_supported':'unknown_leave_blank',locator:'Synthetic public rules',observedAt})),tags:[{key:'healthcare',label:'Healthcare & Nursing',meaning:'Nursing study',effect:'topic',qualifiedExplanation:'Nursing only; interest does not prove enrollment.',sourceId:'rules',existingChoiceId:'healthcare',existingControlId:'criterion-healthcare',existingCriterionId:'career.healthcare'}],interviewCoverage:[{dimension:'career',decision:'existing_question_partial',choiceId:'healthcare',rationale:'Nursing is narrower than general healthcare.'}],proposedValues,review:{status:'reviewed',reviewer:'synthetic-independent-reviewer'}};
const fixture:Pick<Ledger,'rows'|'entities'|'officialSources'>={rows:[],entities:[addition],officialSources:[{id:'rules',evidencePath:'synthetic-only',url:'https://example.org/rules',observedAt,contentSha256:'a'.repeat(64)}]};
validateProposalRecords(fixture);
function rejects(change:(l:typeof fixture)=>void,pattern:RegExp) {
  const l=structuredClone(fixture);change(l);assert.throws(()=>validateProposalRecords(l),pattern);
}
rejects(l=>{l.entities[0].fields[8].newValue='Unreviewed replacement';},/Field and proposed row disagree/);
rejects(l=>{l.entities[0].fields[8].observedAt='2026-09-10T00:00:00.000Z';},/timestamp differs/);
rejects(l=>{l.entities[0].fields[8].supportingSourceIds=['missing-source'];},/Unknown supporting source/);
rejects(l=>{l.entities[0].fields[8].oldValue='Existing manual edit';},/overwrites an existing value/);
rejects(l=>{l.entities[0].tags[0].key='unrelated-key';},/Unregistered tag/);
rejects(l=>{l.entities[0].tags[0].label='Unrelated label';},/Unregistered tag/);
const alias=structuredClone(fixture);alias.entities[0].tags[0].key='dcc_healthcare';validateProposalRecords(alias);
rejects(l=>{l.entities[0].tags[0].existingControlId='criterion-stem';},/Wrong interview control/);
rejects(l=>{l.entities[0].interviewCoverage[0].choiceId='new-unapproved-question';},/Unknown coverage choice/);
rejects(l=>{l.entities[0].fields[9]={...l.entities[0].fields[8]};},/Duplicate proposed column/);
const update=structuredClone(fixture);
update.rows=[{id:'synthetic-master',sheetId:0,tab:'Master Database',rowNumber:2,rowContentSha256:'b'.repeat(64),sourcePath:'synthetic-only',entityId:'synthetic-add',disposition:'propose_update',rationale:'Synthetic correction',destination:{kind:'existing_master',sheetId:0,rowNumber:2,entityId:'synthetic-add'},evidenceIds:['rules'],review:{status:'reviewed',reviewer:'synthetic-independent-reviewer'},values:[...proposedValues]}];
update.entities[0].disposition='propose_update';update.entities[0].destination=update.rows[0].destination;
update.entities[0].fields=[{...addition.fields[8],oldValue:proposedValues[8],newValue:'A supported correction.'}];
validateProposalRecords(update);
for(const change of [{kind:'proposed_operation'},{sheetId:123}]) {
  const bad=structuredClone(update);Object.assign(bad.entities[0].destination!,change);assert.throws(()=>validateProposalRecords(bad),/Update destination (kind|sheet) mismatch/);
}
update.rows[0].values[8]='A newer manual edit';
assert.throws(()=>validateProposalRecords(update),/Stale old field value/);
console.log('Intake proposal consistency, field provenance, controlled mapping and newer-edit fixtures PASS.');

const closure={...fixture,schemaVersion:1,planId:'SCHOLARSHIP-INTAKE-1',inputs:{workbookId:INTAKE_WORKBOOK,snapshotId:'synthetic',snapshotSha256:'a'.repeat(64),snapshotFiles:[],tabs:[]},discoveries:[{enumeratedCount:1,reviewedByImplementer:1,remainingCount:0}],relatedFieldTriage:[{id:'synthetic-triage',review:{status:'reviewed'},fields:[{status:'supported_related_update_proposed',review:{status:'reviewed'},rationale:'Exact supported field.'}]}],interviewGaps:[{id:'synthetic-gap',supportingEntityIds:['synthetic-add']}]};
validateClosureRecords(closure);
const missedChild=structuredClone(closure);missedChild.discoveries[0].remainingCount=1;assert.throws(()=>validateClosureRecords(missedChild),/Unaccounted enumerated discovery/);
const pendingField=structuredClone(closure);pendingField.relatedFieldTriage[0].fields[0].review.status='pending';assert.throws(()=>validateClosureRecords(pendingField),/Unreviewed related field/);
const unsupportedGap=structuredClone(closure);unsupportedGap.interviewGaps[0].supportingEntityIds=['missing'];assert.throws(()=>validateClosureRecords(unsupportedGap),/Unknown gap-support entity/);
const noTrigger=structuredClone(closure);noTrigger.entities[0].disposition='hold';assert.throws(()=>validateClosureRecords(noTrigger),/Hold lacks owner or actionable trigger/);
console.log('Intake closure rejects lost children, pending triage, orphaned recommendations and unactionable holds.');
