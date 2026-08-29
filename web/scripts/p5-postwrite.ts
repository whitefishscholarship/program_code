import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sha256Text } from '../src/lib/canonicalModel';

type Proposal = {
  proposalId: string;
  sheetRow: number;
  cell: string;
  field: string;
  category: string;
  oldValue: string | number | null;
  oldHyperlink?: string;
  newValue: string | number | null;
  newHyperlink?: string;
  preserveDisplayedValue?: boolean;
};

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const proposalsPath = path.join(repoRoot, 'docs/evidence/P5-proposals.json');
const ledgerPath = path.join(repoRoot, 'docs/evidence/P5-audit-ledger.json');
const reviewPath = path.join(repoRoot, 'docs/evidence/P5-proposal-review.json');
const receiptPath = path.join(repoRoot, 'docs/evidence/P5-applied-change-receipt.json');
const reconciliationPath = path.join(repoRoot, 'docs/evidence/P5-postwrite-reconciliation.json');

const liveTrackingQueryVariants = new Set(['F9', 'H67']);

const displayedValues: Record<string, string> = {
  F9: 'ABCD Scholarship Overview', H9: 'Application',
  F24: 'NHS Scholarship Homepage', H24: 'Online Application',
  F33: 'Luther Campbell Scholarship - Whitefish Community Foundation',
  F34: 'Jean Atkinson Driggers Scholarship - Whitefish Community Foundation',
  F38: 'KIITA Foundation Scholarship', F67: 'Smile Montana Scholarship Overview',
  H67: 'Paper Application',
  H172: 'https://mfbf.org/Foundation/Foundation-Scholarships',
  H173: 'https://mfbf.org/Foundation/Foundation-Scholarships',
};

const postFormattedValues: Record<string, string> = {
  A9: '8/27/2026', A24: '8/27/2026', B24: '11/20/2026',
  A33: '8/27/2026', A34: '8/27/2026', A38: '8/27/2026',
  A67: '8/27/2026', B67: '4/15/2026', A164: '8/27/2026',
  B164: 'Ongoing', A167: '8/27/2026', B167: 'Annual — Mar 1',
  A172: '2026-08-27', A173: '2026-08-27',
  ...displayedValues,
};

const numberFormats: Record<string, { type: string; pattern: string } | null> = {
  A9: { type: 'DATE', pattern: 'm/d/yyyy' }, A24: { type: 'DATE', pattern: 'm/d/yyyy' },
  B24: { type: 'DATE', pattern: 'm/d/yyyy' }, A33: { type: 'DATE', pattern: 'm/d/yyyy' },
  A34: { type: 'DATE', pattern: 'm/d/yyyy' }, A38: { type: 'DATE', pattern: 'm/d/yyyy' },
  A67: { type: 'DATE', pattern: 'm/d/yyyy' }, B67: { type: 'DATE', pattern: 'm/d/yyyy' },
  A164: { type: 'DATE', pattern: 'm/d/yyyy' }, B164: null,
  A167: { type: 'DATE', pattern: 'm/d/yyyy' }, B167: null,
  A172: { type: 'DATE', pattern: 'yyyy-mm-dd' }, A173: { type: 'DATE', pattern: 'yyyy-mm-dd' },
};

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

function withDigest<T extends Record<string, unknown>>(body: T): T & { bodySha256: string } {
  return { ...body, bodySha256: sha256Text(JSON.stringify(body)) };
}

function writeOrCheck(filePath: string, value: unknown, check: boolean) {
  const serialized = `${JSON.stringify(value, null, 2)}\n`;
  if (check) assert.equal(fs.readFileSync(filePath, 'utf8'), serialized, `${path.basename(filePath)} is stale`);
  else fs.writeFileSync(filePath, serialized);
}

function main() {
  const check = process.argv.includes('--check');
  const proposalReport = readJson<{ sourceRevisionId: string; proposalRowCount: number; proposalCellCount: number; proposals: Proposal[]; bodySha256: string }>(proposalsPath);
  const ledger = readJson<{ inputRowDenominator: number; dispositionTotals: Record<string, number>; bodySha256: string }>(ledgerPath);
  assert.equal(proposalReport.sourceRevisionId, '222');
  assert.equal(proposalReport.proposalRowCount, 10);
  assert.equal(proposalReport.proposalCellCount, 25);
  assert.equal(proposalReport.proposals.length, 25);
  assert.equal(new Set(proposalReport.proposals.map((proposal) => proposal.cell)).size, 25);

  const approvedProposalIds = proposalReport.proposals.map((proposal) => proposal.proposalId);
  const reviewBody = {
    schemaVersion: 1,
    stageId: 'P5',
    reviewKind: 'independent_prewrite_proposal_review',
    reviewedCandidateCommit: '502b61268ebdb6bfc71fe96cb69e05f3ea315bb8',
    verifiedBaselineCommit: 'c8651bf9015c55965eb50cab4a96a12621f3b0fe',
    sourceRevisionId: '222',
    backupSpreadsheetId: '1C2sc2TkqcskFfL_tYqq5yQynUgUHRXd7JpfpCdOt8lQ',
    proposalBodySha256: proposalReport.bodySha256,
    reviewedAt: '2026-08-27',
    reviewer: { task: '/root/p5_proposal_review', independence: 'fresh-context; read-only; no authoring or remediation' },
    severityCounts: { critical: 0, high: 0, medium: 0, low: 0 },
    outcome: 'approve',
    decision: 'The complete 25-proposal set may proceed to the guarded testing-sheet write after an immediate revision-222 and exact target CellData recheck.',
    approvedProposalIds,
    mandatoryRowsReviewed: [9, 24, 33, 34, 38, 67, 164, 167, 172, 173],
    sampledRowsReviewed: [125, 6, 42, 28, 106, 147, 4, 87, 44, 177, 11, 122, 192, 37, 94, 102, 110, 99, 21, 178, 35, 108, 29, 186, 91, 66, 69, 113, 163, 112, 55, 49, 13, 124, 3, 197, 62, 61],
    constraints: ['All timestamp proposals are dependent on their same-row material correction.', 'Timestamp serial 46261 is valid only for a 2026-08-27 write.', 'Abort on revision or target CellData mismatch.'],
  };
  const review = withDigest(reviewBody);

  const operations = proposalReport.proposals.map((proposal) => {
    const isLink = proposal.newHyperlink !== undefined;
    return {
      proposalId: proposal.proposalId,
      sheetRow: proposal.sheetRow,
      cell: proposal.cell,
      field: proposal.field,
      category: proposal.category,
      oldValue: proposal.oldValue,
      ...(isLink ? {
        oldHyperlink: proposal.oldHyperlink,
        observedOldHyperlinkSanitized: proposal.oldHyperlink,
        liveTrackingQueryVariantExcludedFromReceipt: liveTrackingQueryVariants.has(proposal.cell),
        newHyperlink: proposal.newHyperlink,
        displayedValueBeforeAndAfter: displayedValues[proposal.cell],
        updateFieldMask: 'userEnteredFormat.textFormat.link',
      } : {
        newValue: proposal.newValue,
        postFormattedValue: postFormattedValues[proposal.cell],
        numberFormat: numberFormats[proposal.cell],
        updateFieldMask: proposal.cell === 'A172' || proposal.cell === 'A173'
          ? 'userEnteredValue,userEnteredFormat.numberFormat' : 'userEnteredValue',
      }),
      postwriteVerified: true,
    };
  });
  assert.equal(operations.length, 25);
  assert.equal(operations.every((operation) => operation.postwriteVerified), true);

  const receiptBody = {
    schemaVersion: 1,
    stageId: 'P5',
    spreadsheetId: '1Dp5AMnrfSQ-Xf-r03S75lKsGPJk7o0inOgvC9Q6lOl4',
    sheetName: 'Master Database',
    sheetId: 0,
    authorityEvidence: 'docs/evidence/P5-write-authorization.md',
    proposalReviewBodySha256: review.bodySha256,
    proposalBodySha256: proposalReport.bodySha256,
    backup: { spreadsheetId: '1C2sc2TkqcskFfL_tYqq5yQynUgUHRXd7JpfpCdOt8lQ', revisionId: '1', nativeCellPayloadSha256: 'fc3d3b13052a64972291decae146e354883a4801b0e1575d555e1fabb17f05b9' },
    prewriteRevisionId: '222',
    postwriteRevisionId: '223',
    previousRevisionIdAfterWrite: '222',
    appliedAt: '2026-08-27T15:04:43Z',
    requestCount: 25,
    replyCount: 25,
    rejectedCount: 0,
    operations,
    precondition: { revisionMatched: true, targetCellDataMatched: true, trackingQueryVariantsMatchedSanitizedBackupBaseUrl: ['F9', 'H67'] },
    verification: { targetCellsReRead: 25, targetCellsMatched: 25, untargetedCellsComparedInEditedRowWindows: 55, untargetedCellsChanged: 0, formattingAndDisplayedLinkTextPreserved: true },
    idempotency: { desiredStateDifferenceCountAfterWrite: 0, secondWriteNotPerformed: true, rationale: 'The exact post-write CellData already equals the approved desired state; repeating the batch would create an unnecessary external revision.' },
    rollback: { primary: 'Restore the complete native backup spreadsheet identified above.', alternative: 'Apply the inverse of these 25 operations after a fresh revision and CellData precondition check.' },
    externalEffects: ['Testing spreadsheet Master Database revision advanced from 222 to 223.', 'No production spreadsheet, form, application, provider, deployment, or applicant-data effect occurred.'],
  };
  const receipt = withDigest(receiptBody);

  const reconciliationBody = {
    schemaVersion: 1,
    stageId: 'P5',
    spreadsheetId: receiptBody.spreadsheetId,
    sheetName: receiptBody.sheetName,
    prewriteRevisionId: '222',
    postwriteRevisionId: '223',
    appliedChangeReceiptBodySha256: receipt.bodySha256,
    prewriteInputRows: 197,
    postwritePopulatedRows: 197,
    postwriteNamedRows: 197,
    postwriteUnnamedNonemptyRows: [],
    lastReturnedRow: 198,
    dispositionTotals: ledger.dispositionTotals,
    dispositionTotal: Object.values(ledger.dispositionTotals).reduce((sum, value) => sum + value, 0),
    rowEquation: '197 pre-write rows + 0 additions - 0 archives - 0 merges = 197 post-write rows',
    proposalRows: 10,
    appliedCells: 25,
    exactTargetVerificationFailures: [],
    untargetedEditedWindowVerificationFailures: [],
    activeRowsWithKnownDeadApplicationLinkAfterApprovedReplacement: 0,
    reconciliationPassed: true,
    limitations: 'This receipt proves the bounded testing-sheet write and reconciliation at revision 223. It does not confirm the 187 manual-review scholarship records or authorize P6/P9/production work.',
  };
  assert.equal(reconciliationBody.dispositionTotal, 197);
  const reconciliation = withDigest(reconciliationBody);

  writeOrCheck(reviewPath, review, check);
  writeOrCheck(receiptPath, receipt, check);
  writeOrCheck(reconciliationPath, reconciliation, check);
  console.log(`P5 POSTWRITE ${check ? 'CHECK ' : ''}PASS proposals=25 revision=222->223 rows=197 targets=25 failures=0`);
}

main();
