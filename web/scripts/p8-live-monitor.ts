import fs from 'node:fs';
import path from 'node:path';
import catalogJson from '../fixtures/p7/student-catalog.json';
import p5ReviewJson from '../../docs/evidence/P5-manual-review.json';
import publicProbesJson from '../../docs/evidence/P5-public-probes.json';
import sourceQueueJson from '../../docs/evidence/P5-source-queue.json';
import p6ChildrenJson from '../../docs/evidence/P6-child-records.json';
import { assertFetchableUrl } from '../src/lib/extract';
import {
  acceptedNonPublicObservation,
  buildMonitoringPlan,
  createMonitoringReceiptStore,
  executeMonitoringSegment,
  finalizeMonitoringRun,
  sha256,
  type ProbeAdapter,
  type RawProbeObservation,
} from '../src/lib/monitoring';

const MAX_RESPONSE_BYTES = 2_000_000;
const MAX_REDIRECTS = 5;

async function readBounded(response: Response): Promise<Buffer> {
  const declared = Number(response.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > MAX_RESPONSE_BYTES) throw new Error('Response exceeds the monitoring byte limit');
  if (!response.body) return Buffer.alloc(0);
  const reader = response.body.getReader();
  const chunks: Buffer[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_RESPONSE_BYTES) { await reader.cancel(); throw new Error('Response exceeds the monitoring byte limit'); }
    chunks.push(Buffer.from(value));
  }
  return Buffer.concat(chunks);
}

async function fetchPublicSource(initialUrl: string): Promise<RawProbeObservation> {
  let currentUrl = initialUrl;
  for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect += 1) {
    assertFetchableUrl(currentUrl);
    const response = await fetch(currentUrl, { method: 'GET', redirect: 'manual', headers: { 'User-Agent': 'Whitefish-Scholarship-Monitor/1.0 (read-only)' }, signal: AbortSignal.timeout(20_000) });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location');
      if (!location || redirect === MAX_REDIRECTS) return { kind: 'http', status: response.status, finalUrl: currentUrl, observedFingerprint: null, observedAt: new Date().toISOString(), markers: [] };
      currentUrl = new URL(location, currentUrl).toString();
      continue;
    }
    const body = await readBounded(response);
    return { kind: 'http', status: response.status, finalUrl: currentUrl, observedFingerprint: sha256(body), observedAt: new Date().toISOString(), markers: response.status === 403 || response.status === 429 ? ['bot_block'] : [] };
  }
  throw new Error('Redirect bound exceeded');
}

async function main() {
  if (process.argv.slice(2).join(' ') !== '--dry-run') throw new Error('P8 live monitoring is restricted to the explicit --dry-run mode');
  const receiptDirectory = process.env.P8_RECEIPT_DIRECTORY;
  const encodedKey = process.env.P8_RECEIPT_INTEGRITY_KEY;
  if (!receiptDirectory || !encodedKey || !/^(?:[0-9a-fA-F]{2}){32,}$/.test(encodedKey)) throw new Error('P8_RECEIPT_DIRECTORY and a 32-byte-or-longer hex P8_RECEIPT_INTEGRITY_KEY are required');
  const repoRoot = path.resolve(process.cwd(), '..');
  const pinnedPaths = ['docs/evidence/P3-acquisition.json', 'docs/evidence/P3-completeness.json', 'docs/evidence/P4-field-evidence.json', 'docs/evidence/P4-reviews.json', 'docs/evidence/P5-applied-change-receipt.json', 'docs/evidence/P5-postwrite-reconciliation.json', 'docs/evidence/P5-source-queue.json', 'docs/evidence/P5-public-probes.json', 'docs/evidence/P5-manual-review.json', 'docs/evidence/P6-child-records.json', 'web/fixtures/p7/student-catalog.json', 'docs/evidence/P7-manifest.json'];
  const plan = buildMonitoringPlan({
    catalog: catalogJson as Parameters<typeof buildMonitoringPlan>[0]['catalog'],
    sourceQueue: sourceQueueJson as Parameters<typeof buildMonitoringPlan>[0]['sourceQueue'],
    publicProbes: publicProbesJson,
    p5Review: p5ReviewJson as Parameters<typeof buildMonitoringPlan>[0]['p5Review'],
    p6ReviewItems: p6ChildrenJson.reviewItems,
    acceptedSpreadsheetRevisionId: '223',
    acceptedObservedAt: '2026-08-29T21:25:30.000Z',
    pinnedSurfaces: Object.fromEntries(pinnedPaths.map((item) => [item, sha256(fs.readFileSync(path.join(repoRoot, item)))])),
  });
  const store = createMonitoringReceiptStore(receiptDirectory, Buffer.from(encodedKey, 'hex'));
  const adapter: ProbeAdapter = { probe: async (target) => {
    if (target.route === 'public_read_only_probe') return fetchPublicSource(target.url!);
    return acceptedNonPublicObservation(target);
  } };
  const environment = { now: () => new Date().toISOString(), sleep: (milliseconds: number) => new Promise<void>((resolve) => setTimeout(resolve, milliseconds)) };
  const runId = `p8-live-dry-run-${new Date().toISOString().replace(/[^0-9]/g, '')}`;
  let cursor = 0;
  let tip: string | null = null;
  while (cursor < plan.targets.length) {
    const receipt = await executeMonitoringSegment({ plan, store, runId, mode: 'dry_run', startCursor: cursor, previousReceiptSha256: tip, adapter, environment });
    cursor = receipt.nextCursor;
    tip = receipt.receiptSha256;
  }
  const finalized = finalizeMonitoringRun(plan, store, tip!);
  console.log(JSON.stringify({ stageId: 'P8', mode: 'dry_run', runId, planDigest: plan.planDigest, receiptTipSha256: finalized.receiptTipSha256, targetDenominator: finalized.targetDenominator, processedCount: finalized.processedCount, duplicateCount: finalized.duplicateCount, lostCount: finalized.lostCount, reviewCount: finalized.reviewQueue.length, acceptedFactsChanged: false, acceptedStatePublished: false, scheduleEnabled: false }));
}

main().catch((error) => { console.error(error instanceof Error ? error.message : String(error)); process.exit(1); });
