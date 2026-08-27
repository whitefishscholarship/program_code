import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sha256Text } from '../src/lib/canonicalModel';
import type { P5SourceQueueEntry } from './p5-remediation';

type CellValue = { formatted: string | null; unformatted: string | number | null };
type SnapshotRecord = {
  sheetRow: number;
  rowKey: string;
  values: {
    lastUpdated: CellValue;
    dueDate: CellValue;
    amount: CellValue;
    name: { formatted: string };
    information: { urls: Array<{ url: string }> };
    application: { urls: Array<{ url: string }> };
  };
};
type Snapshot = { spreadsheetRevisionId: string; records: SnapshotRecord[] };
type QueueReport = { bodySha256: string; entries: P5SourceQueueEntry[] };
type PublicProbe = {
  bodySha256: string;
  receipts: Array<{
    sourceId: string;
    status: number | null;
    classifications: Array<{ state: 'reachable' | 'redirected' | 'dead' | 'inconclusive' }>;
  }>;
};
type FirecrawlReport = {
  bodySha256: string;
  receipts: Array<{
    sourceId: string;
    outcome: 'retrieved' | 'inconclusive_retrieval';
    statusCode: number | null;
    nameMatches: Array<{ sheetRow: number; exactNormalizedNamePresent: boolean }>;
  }>;
};
type Proposal = {
  proposalId: string;
  sheetRow: number;
  cell: string;
  field: 'lastUpdated' | 'dueDate' | 'amount' | 'informationLink' | 'applicationLink';
  category: 'audit_timestamp' | 'deadline_correction' | 'amount_correction' | 'dead_link_replacement';
  oldValue: string | number | null;
  oldHyperlink?: string;
  newValue: string | number | null;
  newHyperlink?: string;
  preserveDisplayedValue?: boolean;
  evidenceIds: string[];
  rationale: string;
  reviewStatus: 'pending_independent_review';
};

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const snapshotPath = path.join(repoRoot, 'web/fixtures/p5/prewrite-master-database.json');
const queuePath = path.join(repoRoot, 'docs/evidence/P5-source-queue.json');
const publicProbePath = path.join(repoRoot, 'docs/evidence/P5-public-probes.json');
const firecrawlPath = path.join(repoRoot, 'docs/evidence/P5-firecrawl-receipts.json');
const deadDisclosurePath = path.join(repoRoot, 'docs/evidence/P5-preboundary-dead-link-observations.json');
const staticApplicationDisclosurePath = path.join(repoRoot, 'docs/evidence/P5-preboundary-static-application-observations.json');
const proposalsPath = path.join(repoRoot, 'docs/evidence/P5-proposals.json');
const ledgerPath = path.join(repoRoot, 'docs/evidence/P5-audit-ledger.json');
const manualPath = path.join(repoRoot, 'docs/evidence/P5-manual-review.json');
const samplePath = path.join(repoRoot, 'docs/evidence/P5-review-sample.json');

const correctionPlans = [
  { row: 9, changes: [
    { cell: 'F9', field: 'informationLink', category: 'dead_link_replacement', oldHyperlink: 'https://responsibilitymatters.mtrevenue.gov/scholarship/', newHyperlink: 'https://revenue.mt.gov/ResponsibilityMatters/scholarship/', evidenceIds: ['p5replace_responsibility'], rationale: 'Current direct Montana Department of Revenue scholarship page returned 200.' },
    { cell: 'H9', field: 'applicationLink', category: 'dead_link_replacement', oldHyperlink: 'https://revenuefiles.mt.gov/files/Responsibility-Matters/Scholarship/Scholarship-Application-2026.pdf', newHyperlink: 'https://revenue.mt.gov/ResponsibilityMatters/scholarship/', evidenceIds: ['p5replace_responsibility'], rationale: 'The PDF is 404; the current direct official page provides the active submission method and January 25, 2026 deadline.' },
  ] },
  { row: 24, changes: [
    { cell: 'B24', field: 'dueDate', category: 'deadline_correction', newValue: 46346, evidenceIds: ['p5replace_nhs'], rationale: 'Current direct NHS page states November 20, 2026 at 5:00 p.m. ET.' },
    { cell: 'F24', field: 'informationLink', category: 'dead_link_replacement', oldHyperlink: 'https://www.nhs.us/students/the-nhs-scholarship/', newHyperlink: 'https://www.nationalhonorsociety.org/the-nhs-scholarship/', evidenceIds: ['p5replace_nhs'], rationale: 'Current direct NHS scholarship page returned 200.' },
    { cell: 'H24', field: 'applicationLink', category: 'dead_link_replacement', oldHyperlink: 'https://webportalapp.com/sp/login_saml/nhs2026', newHyperlink: 'https://www.nationalhonorsociety.org/create-an-account/', evidenceIds: ['p5replace_nhs'], rationale: 'The old portal is 404; the current direct NHS page identifies its create-account route as step one.' },
  ] },
  { row: 33, changes: [{ cell: 'F33', field: 'informationLink', category: 'dead_link_replacement', oldHyperlink: 'https://whitefishcommunityfoundation.org/wp-content/uploads/2025/12/2026-Dorothy-and-Luther-Campbell-Scholarship-Application-Criteria.pdf', newHyperlink: 'https://whitefishcommunityfoundation.org/menu/dorothy-and-luther-campbell-scholarship', evidenceIds: ['p5replace_wcf_campbell'], rationale: 'The old PDF is 404; the current direct foundation page returned 200 and links the 2026 criteria.' }] },
  { row: 34, changes: [{ cell: 'F34', field: 'informationLink', category: 'dead_link_replacement', oldHyperlink: 'https://whitefishcommunityfoundation.org/wp-content/uploads/2025/12/2026-Jean-Atkinson-Driggers-Scholarship-Application-Criteria.pdf', newHyperlink: 'https://whitefishcommunityfoundation.org/menu/jean-atkinson-driggers-scholarship', evidenceIds: ['p5replace_wcf_jean'], rationale: 'The old PDF is 404; the current direct foundation page returned 200 and links the 2026 criteria.' }] },
  { row: 38, changes: [{ cell: 'F38', field: 'informationLink', category: 'dead_link_replacement', oldHyperlink: 'https://whitefishcommunityfoundation.org/wp-content/uploads/2025/12/2026-Kiita-Foundation-Scholarship-Application-Criteria.pdf', newHyperlink: 'https://whitefishcommunityfoundation.org/menu/kiita-foundation-scholarship', evidenceIds: ['p5replace_wcf_kiita'], rationale: 'The old PDF is 404; the current direct foundation page returned 200 and links the 2026 criteria.' }] },
  { row: 67, changes: [
    { cell: 'B67', field: 'dueDate', category: 'deadline_correction', newValue: 46127, evidenceIds: ['p5replace_smile'], rationale: 'Current direct Smile Montana page states April 15.' },
    { cell: 'F67', field: 'informationLink', category: 'dead_link_replacement', oldHyperlink: 'https://www.smilemontana.com/news/scholarship', newHyperlink: 'https://www.smilemontana.com/scholarship', evidenceIds: ['p5replace_smile'], rationale: 'The old page is 404; the current direct scholarship page returned 200.' },
    { cell: 'H67', field: 'applicationLink', category: 'dead_link_replacement', oldHyperlink: 'https://docs.google.com/document/d/1v6ap2g4Bsu7EuyjJNVSaxoOV1z54S5lP/edit', newHyperlink: 'https://www.smilemontana.com/s/Smile-Montana-Scholarship-2026.docx', evidenceIds: ['p5replace_smile'], rationale: 'The current direct scholarship page links its public 2026 application document.' },
  ] },
  { row: 164, changes: [{ cell: 'B164', field: 'dueDate', category: 'deadline_correction', newValue: 'Ongoing', evidenceIds: ['P5-preboundary-static-application-observations'], rationale: 'The disclosed current direct Adoption STAR scholarship-page receipt states the deadline is ongoing.' }] },
  { row: 167, changes: [{ cell: 'B167', field: 'dueDate', category: 'deadline_correction', newValue: 'Annual — Mar 1', evidenceIds: ['P5-preboundary-static-application-observations'], rationale: 'The disclosed current direct Dell Scholars page receipt states a March 1 deadline.' }] },
  { row: 172, changes: [{ cell: 'H172', field: 'applicationLink', category: 'dead_link_replacement', oldHyperlink: 'https://mfbf.org/Foundation/Foundation-Scholarships', newHyperlink: 'https://form.jotform.com/250345411585151', evidenceIds: ['p5replace_mfbf'], rationale: 'The old page is 404; the current direct Montana Farm Bureau page identifies this active application link.' }] },
  { row: 173, changes: [{ cell: 'H173', field: 'applicationLink', category: 'dead_link_replacement', oldHyperlink: 'https://mfbf.org/Foundation/Foundation-Scholarships', newHyperlink: 'https://form.jotform.com/250344617133147', evidenceIds: ['p5replace_mfbf'], rationale: 'The old page is 404; the current direct Montana Farm Bureau page identifies this active application link.' }] },
] as const;

const replacementReceipts = [
  { evidenceId: 'p5replace_responsibility', file: 'P5-replacement-responsibility.json', url: 'https://revenue.mt.gov/ResponsibilityMatters/scholarship/', markers: ['January 25, 2026', '$2,000'], rows: [9] },
  { evidenceId: 'p5replace_nhs', file: 'P5-replacement-nhs.json', url: 'https://www.nationalhonorsociety.org/the-nhs-scholarship/', markers: ['November 20, 2026', 'create-an-account'], rows: [24] },
  { evidenceId: 'p5replace_wcf_campbell', file: 'P5-replacement-wcf-campbell.json', url: 'https://whitefishcommunityfoundation.org/menu/dorothy-and-luther-campbell-scholarship', markers: ['March 31, 2026', '2026-Dorothy-and-Luther-Campbell-Scholarship-Application-Criteria.pdf'], rows: [33] },
  { evidenceId: 'p5replace_wcf_jean', file: 'P5-replacement-wcf-jean.json', url: 'https://whitefishcommunityfoundation.org/menu/jean-atkinson-driggers-scholarship', markers: ['March 31, 2026', '2026-Jean-Atkinson-Driggers-Scholarship-Application-Criteria.pdf'], rows: [34] },
  { evidenceId: 'p5replace_wcf_kiita', file: 'P5-replacement-wcf-kiita.json', url: 'https://whitefishcommunityfoundation.org/menu/kiita-foundation-scholarship', markers: ['March 31, 2026', '2026-Kiita-Foundation-Scholarship-Application-Criteria.pdf'], rows: [38] },
  { evidenceId: 'p5replace_smile', file: 'P5-replacement-smile.json', url: 'https://www.smilemontana.com/scholarship', markers: ['April 15th', 'Smile-Montana-Scholarship-2026.docx'], rows: [67] },
  { evidenceId: 'p5replace_mfbf', file: 'P5-replacement-mfbf.json', url: 'https://www.mfbf.org/scholarships', markers: ['250345411585151', '250344617133147'], rows: [172, 173] },
] as const;

const mfbfRowBindings = [
  {
    sheetRow: 172,
    scholarship: 'Bernard Greufe Memorial Honor Scholarship',
    file: 'P5-replacement-mfbf-bernard-query.json',
    scrapeId: '01a043b2-0b58-74ce-ae8d-df6db06caae6',
    queryPrompt: 'On this official Montana Farm Bureau scholarship page, identify only the section titled Bernard Greufe Honor Scholarship. Return the exact section title, award amount, application due date, and exact Apply here URL. Do not include any person contact details.',
    expectedMarkers: ['$1,500', 'April 1, 2026', 'https://form.jotform.com/250345411585151'],
    applicationUrl: 'https://form.jotform.com/250345411585151',
  },
  {
    sheetRow: 173,
    scholarship: "Montana Farm Bureau Women's Leadership Committee Scholarships",
    file: 'P5-replacement-mfbf-womens-query.json',
    scrapeId: '01a043b2-058e-72e8-beaa-7b96003821fc',
    queryPrompt: "On this official Montana Farm Bureau scholarship page, identify only the section titled MFBF Scholarship - Sponsored by the Women's Leadership Committee. Return the exact section title, number and amount of awards, application due date, and exact Apply here URL. Do not include any person contact details.",
    expectedMarkers: ['Two $1,500.00 scholarships', 'April 1, 2026', 'https://form.jotform.com/250344617133147'],
    applicationUrl: 'https://form.jotform.com/250344617133147',
  },
] as const;

function readJson<T>(filePath: string): T { return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T; }

function privacyClean(value: string): string {
  return value.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[redacted-email]')
    .replace(/(?<!\d)(?:\+?1[-. (]*)?\d{3}[-. )]*\d{3}[-. ]*\d{4}(?!\d)/g, '[redacted-phone]');
}

function writeOrCheck(filePath: string, value: unknown, check: boolean) {
  const serialized = `${JSON.stringify(value, null, 2)}\n`;
  if (check) assert.equal(fs.readFileSync(filePath, 'utf8'), serialized, `${path.basename(filePath)} is stale`);
  else fs.writeFileSync(filePath, serialized);
}

function main() {
  const check = process.argv.includes('--check');
  const snapshot = readJson<Snapshot>(snapshotPath);
  const queue = readJson<QueueReport>(queuePath);
  const publicProbe = readJson<PublicProbe>(publicProbePath);
  const firecrawl = readJson<FirecrawlReport>(firecrawlPath);
  const deadDisclosure = readJson<{ bodySha256: string; receipts: Array<{ sourceId: string; status: number | null }> }>(deadDisclosurePath);
  const { bodySha256: deadDisclosureDigest, ...deadDisclosureBody } = deadDisclosure;
  assert.equal(deadDisclosure.receipts.length, 7);
  assert.equal(deadDisclosure.receipts.every((receipt) => receipt.status === 404), true);
  assert.equal(sha256Text(JSON.stringify(deadDisclosureBody)), deadDisclosureDigest);
  const staticApplicationDisclosure = readJson<{ bodySha256: string; receipts: Array<{ sourceId: string; outcome: string; statusCode: number | null }> }>(staticApplicationDisclosurePath);
  const { bodySha256: staticApplicationDigest, ...staticApplicationBody } = staticApplicationDisclosure;
  assert.equal(staticApplicationDisclosure.receipts.length, 2);
  assert.equal(staticApplicationDisclosure.receipts.every((receipt) => receipt.outcome === 'retrieved' && receipt.statusCode === 200), true);
  assert.equal(sha256Text(JSON.stringify(staticApplicationBody)), staticApplicationDigest);
  const queueByUrl = new Map(queue.entries.map((entry) => [entry.url, entry]));
  const probeById = new Map(publicProbe.receipts.map((receipt) => [receipt.sourceId, receipt]));
  const firecrawlById = new Map(firecrawl.receipts.map((receipt) => [receipt.sourceId, receipt]));
  const rowsByNumber = new Map(snapshot.records.map((record) => [record.sheetRow, record]));

  const replacementPath = path.join(repoRoot, 'docs/evidence/P5-replacement-evidence.json');
  let replacementReport: { schemaVersion: number; stageId: string; receipts: Array<{ evidenceId: string; statusCode: number | null; piiRedacted: boolean; verifiedExcerpts: string[]; rowBindings: Array<{ sheetRow: number; applicationUrl: string }> }>; bodySha256: string };
  if (check) {
    replacementReport = readJson(replacementPath);
    const { bodySha256, ...body } = replacementReport;
    assert.equal(body.schemaVersion, 1);
    assert.equal(body.stageId, 'P5');
    assert.equal(body.receipts.length, replacementReceipts.length);
    assert.equal(body.receipts.every((receipt) => receipt.statusCode === 200 && receipt.piiRedacted && receipt.verifiedExcerpts.length > 0), true);
    const mfbf = body.receipts.find((receipt) => receipt.evidenceId === 'p5replace_mfbf');
    assert.deepEqual(mfbf?.rowBindings.map((binding) => binding.sheetRow), [172, 173]);
    assert.equal(new Set(mfbf?.rowBindings.map((binding) => binding.applicationUrl)).size, 2);
    assert.equal(sha256Text(JSON.stringify(body)), bodySha256);
  } else {
    const replacementEvidence = replacementReceipts.map((receipt) => {
      const rawPath = path.join(repoRoot, '.firecrawl', receipt.file);
      const raw = readJson<{ markdown?: string; metadata?: { statusCode?: number; url?: string; title?: string; cachedAt?: string; scrapeId?: string } }>(rawPath);
      const rawMarkdown = raw.markdown ?? '';
      const markdown = privacyClean(rawMarkdown);
      assert.equal(raw.metadata?.statusCode, 200, `${receipt.evidenceId} status`);
      assert.equal(raw.metadata?.url, receipt.url, `${receipt.evidenceId} final URL`);
      for (const marker of receipt.markers) assert.equal(rawMarkdown.includes(marker), true, `${receipt.evidenceId} missing marker ${marker}`);
      const verifiedExcerpts = receipt.markers.map((marker) => {
        const index = rawMarkdown.indexOf(marker);
        return privacyClean(rawMarkdown.slice(Math.max(0, index - 180), index + marker.length + 220))
          .replace(/\s+/g, ' ').trim();
      });
      const rowBindings = receipt.evidenceId === 'p5replace_mfbf' ? mfbfRowBindings.map((binding) => {
        const queryResult = privacyClean(fs.readFileSync(path.join(repoRoot, '.firecrawl', binding.file), 'utf8')).replace(/\s+/g, ' ').trim();
        for (const marker of binding.expectedMarkers) assert.equal(queryResult.includes(marker), true, `MFBF row ${binding.sheetRow} missing ${marker}`);
        return {
          sheetRow: binding.sheetRow,
          scholarship: binding.scholarship,
          sourceUrl: receipt.url,
          scrapeId: binding.scrapeId,
          queryPrompt: binding.queryPrompt,
          extractedAnswer: queryResult,
          applicationUrl: binding.applicationUrl,
          piiRedacted: true,
        };
      }) : [];
      return {
        evidenceId: receipt.evidenceId,
        sourceAuthority: 'current_direct_official',
        requestedUrl: receipt.url,
        finalUrl: raw.metadata?.url ?? null,
        statusCode: raw.metadata?.statusCode ?? null,
        cachedAt: raw.metadata?.cachedAt ?? null,
        scrapeId: raw.metadata?.scrapeId ?? null,
        title: privacyClean(raw.metadata?.title ?? '').trim(),
        sanitizedMarkdownSha256: sha256Text(markdown),
        supportedRows: receipt.rows,
        verifiedMarkers: receipt.markers,
        verifiedExcerpts,
        rowBindings,
        piiRedacted: true,
      };
    });
    const replacementBody = { schemaVersion: 1, stageId: 'P5', receipts: replacementEvidence };
    replacementReport = { ...replacementBody, bodySha256: sha256Text(JSON.stringify(replacementBody)) };
    writeOrCheck(replacementPath, replacementReport, false);
  }

  const proposalRows = new Set<number>(correctionPlans.map((plan) => plan.row));
  const proposals: Proposal[] = [];
  for (const plan of correctionPlans) {
    const record = rowsByNumber.get(plan.row);
    assert.ok(record, `missing row ${plan.row}`);
    proposals.push({
      proposalId: `p5prop_${sha256Text(`${plan.row}:A:lastUpdated`).slice(0, 20)}`,
      sheetRow: plan.row, cell: `A${plan.row}`, field: 'lastUpdated', category: 'audit_timestamp',
      oldValue: record.values.lastUpdated.unformatted, newValue: 46261,
      evidenceIds: ['P5-write-authorization', 'P5-prewrite-snapshot'],
      rationale: 'Stamp the correction date only when another approved row correction is applied.',
      reviewStatus: 'pending_independent_review',
    });
    for (const change of plan.changes) {
      const field = change.field as Proposal['field'];
      const oldValue = field === 'dueDate' ? record.values.dueDate.unformatted
        : field === 'amount' ? record.values.amount.unformatted : null;
      proposals.push({
        proposalId: `p5prop_${sha256Text(`${plan.row}:${change.cell}:${field}`).slice(0, 20)}`,
        sheetRow: plan.row,
        cell: change.cell,
        field,
        category: change.category as Proposal['category'],
        oldValue,
        ...('oldHyperlink' in change ? { oldHyperlink: change.oldHyperlink } : {}),
        newValue: 'newValue' in change ? change.newValue : null,
        ...('newHyperlink' in change ? { newHyperlink: change.newHyperlink, preserveDisplayedValue: true } : {}),
        evidenceIds: change.category === 'dead_link_replacement'
          ? [...change.evidenceIds, 'P5-preboundary-dead-link-observations']
          : [...change.evidenceIds],
        rationale: change.rationale,
        reviewStatus: 'pending_independent_review',
      });
    }
  }
  assert.equal(new Set(proposals.map((proposal) => proposal.cell)).size, proposals.length, 'duplicate proposal cell');
  const proposalBody = {
    schemaVersion: 1, stageId: 'P5', sourceRevisionId: snapshot.spreadsheetRevisionId,
    approvalBoundary: 'No sheet write until every proposal is independently reviewed and explicitly approved against the pinned revision and backup.',
    proposalRowCount: proposalRows.size, proposalCellCount: proposals.length, proposals,
  };
  const proposalReport = { ...proposalBody, bodySha256: sha256Text(JSON.stringify(proposalBody)) };
  writeOrCheck(proposalsPath, proposalReport, check);

  const ledger = snapshot.records.map((record) => {
    const references = [
      ...record.values.information.urls.map((item) => ({ role: 'information', url: item.url })),
      ...record.values.application.urls.map((item) => ({ role: 'application', url: item.url })),
    ];
    const observations = references.map((reference) => {
      const source = queueByUrl.get(reference.url);
      assert.ok(source, `missing source ${reference.url}`);
      return { ...reference, source, probe: probeById.get(source.sourceId), firecrawl: firecrawlById.get(source.sourceId) };
    });
    const flags: string[] = [];
    if (observations.some((item) => item.source.retrievalDisposition === 'manual_review_no_fetch')) flags.push('manual_no_fetch');
    if (observations.some((item) => item.probe?.classifications.some((value) => value.state === 'dead'))) flags.push('known_dead_link');
    if (observations.some((item) => !item.probe || item.probe.classifications.some((value) => value.state === 'inconclusive'))) flags.push('inconclusive_source');
    const exactOfficialName = observations.some((item) => item.firecrawl?.outcome === 'retrieved'
      && item.firecrawl.statusCode === 200
      && item.firecrawl.nameMatches.some((match) => match.sheetRow === record.sheetRow && match.exactNormalizedNamePresent));
    let proposedDisposition: 'corrected' | 'manual_review';
    if (proposalRows.has(record.sheetRow)) proposedDisposition = 'corrected';
    else proposedDisposition = 'manual_review';
    if (proposedDisposition === 'manual_review' && !exactOfficialName) flags.push('insufficient_direct_official_identity_evidence');
    const proposalIds = proposals.filter((proposal) => proposal.sheetRow === record.sheetRow).map((proposal) => proposal.proposalId);
    return {
      sheetRow: record.sheetRow,
      rowKey: record.rowKey,
      name: record.values.name.formatted,
      proposedDisposition,
      proposalIds,
      evidenceIds: observations.map((item) => item.source.sourceId),
      riskFlags: [...new Set(flags)].sort(),
      reason: proposedDisposition === 'corrected' ? 'Current direct official evidence supports the listed review-pending corrections.'
        : 'The available evidence is incomplete, inaccessible, inconclusive, stale, or insufficient for a non-destructive confirmed/corrected disposition.',
      nextAction: proposedDisposition === 'manual_review' ? 'Human reviewer should verify current direct official deadline, amount, eligibility, and application method without form submission or provider contact.' : null,
    };
  });
  assert.equal(ledger.length, 197);
  assert.equal(new Set(ledger.map((entry) => entry.sheetRow)).size, 197);
  const dispositionTotals = {
    confirmed: 0,
    corrected: ledger.filter((entry) => entry.proposedDisposition === 'corrected').length,
    archived: 0,
    merged: 0,
    manualReview: ledger.filter((entry) => entry.proposedDisposition === 'manual_review').length,
  };
  assert.equal(Object.values(dispositionTotals).reduce((sum, value) => sum + value, 0), 197);
  const ledgerBody = {
    schemaVersion: 1, stageId: 'P5', sourceRevisionId: snapshot.spreadsheetRevisionId,
    pinnedInputDigests: { sourceQueue: queue.bodySha256, publicProbe: publicProbe.bodySha256, firecrawl: firecrawl.bodySha256, preboundaryDeadLinks: deadDisclosure.bodySha256, preboundaryStaticApplication: staticApplicationDisclosure.bodySha256, replacementEvidence: replacementReport.bodySha256, proposals: proposalReport.bodySha256 },
    inputRowDenominator: 197, dispositionTotals, entries: ledger,
  };
  const ledgerReport = { ...ledgerBody, bodySha256: sha256Text(JSON.stringify(ledgerBody)) };
  writeOrCheck(ledgerPath, ledgerReport, check);

  const manualEntries = ledger.filter((entry) => entry.proposedDisposition === 'manual_review').map((entry) => ({
    sheetRow: entry.sheetRow, rowKey: entry.rowKey, name: entry.name,
    reasonCodes: entry.riskFlags, evidenceIds: entry.evidenceIds, nextAction: entry.nextAction,
    owner: 'Whitefish Scholarship data steward', target: 'Before promotion from manual review or any future production migration',
  }));
  const manualBody = { schemaVersion: 1, stageId: 'P5', denominator: manualEntries.length, entries: manualEntries };
  const manualReport = { ...manualBody, bodySha256: sha256Text(JSON.stringify(manualBody)) };
  writeOrCheck(manualPath, manualReport, check);

  const mandatoryRows = ledger.filter((entry) => entry.proposedDisposition === 'corrected' || entry.riskFlags.includes('known_dead_link')).map((entry) => entry.sheetRow).sort((a, b) => a - b);
  const remaining = ledger.filter((entry) => !mandatoryRows.includes(entry.sheetRow));
  const sampleSize = Math.max(25, Math.ceil(remaining.length * 0.2));
  const seed = `P5:${snapshot.spreadsheetRevisionId}:${queue.bodySha256}`;
  const sampledRows = remaining.map((entry) => ({ sheetRow: entry.sheetRow, rowKey: entry.rowKey, score: sha256Text(`${seed}:${entry.rowKey}`) }))
    .sort((a, b) => a.score.localeCompare(b.score)).slice(0, sampleSize);
  const sampleBody = {
    schemaVersion: 1, stageId: 'P5', algorithm: 'ascending SHA-256(seed:rowKey)', seed,
    mandatoryCoverage: { reason: '100% of proposed corrections and known-dead-link dispositions', rows: mandatoryRows },
    remainingDenominator: remaining.length, requiredRate: 0.2, minimum: 25, sampleSize, sampledRows,
  };
  const sampleReport = { ...sampleBody, bodySha256: sha256Text(JSON.stringify(sampleBody)) };
  writeOrCheck(samplePath, sampleReport, check);
  console.log(`P5 AUDIT ${check ? 'CHECK ' : ''}PASS rows=197 confirmed=${dispositionTotals.confirmed} corrected=${dispositionTotals.corrected} manual=${dispositionTotals.manualReview} proposals=${proposals.length} mandatoryReview=${mandatoryRows.length} sample=${sampleSize}`);
}

main();
