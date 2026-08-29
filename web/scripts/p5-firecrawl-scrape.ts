import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import type { P5SourceQueueEntry } from './p5-remediation';

type QueueReport = { entries: P5SourceQueueEntry[] };

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const queuePath = path.join(repoRoot, 'docs/evidence/P5-source-queue.json');
const outputDir = path.join(repoRoot, '.firecrawl/P5-information-only');
const CONCURRENCY = 5;
const EXCLUDED_INTERACTIVE_URL = /(?:forms\.office\.com|webportalapp\.com|awardspring\.com|my\.site\.com|efmfeed\.verintefm\.com|smr\.to|(?:^|\/)(?:forms?|login|sign[_-]?in|register|portal|responsepage|ninja-forms)(?:[/?#]|$))/i;

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

async function pool<T>(items: T[], fn: (item: T) => Promise<void>): Promise<void> {
  let cursor = 0;
  let completed = 0;
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, items.length) }, async () => {
    for (;;) {
      const index = cursor++;
      if (index >= items.length) return;
      await fn(items[index]);
      completed += 1;
      if (completed % 5 === 0 || completed === items.length) {
        console.log(`P5 Firecrawl progress ${completed}/${items.length}`);
      }
    }
  }));
}

async function main() {
  const queue = readJson<QueueReport>(queuePath);
  const entries = queue.entries.filter((entry) =>
    entry.retrievalDisposition === 'public_read_only_scrape'
    && !EXCLUDED_INTERACTIVE_URL.test(entry.url));
  assert.ok(entries.length > 0);
  fs.mkdirSync(outputDir, { recursive: true });
  await pool(entries, async (entry) => {
    const outputPath = path.join(outputDir, `${entry.sourceId}.json`);
    const errorPath = path.join(outputDir, `${entry.sourceId}.error.json`);
    if (fs.existsSync(outputPath) || fs.existsSync(errorPath)) return;
    try {
      await execFileAsync('firecrawl', [
        'scrape', entry.url,
        '--format', 'markdown,links',
        '--only-main-content',
        '--redact-pii',
        '--json',
        '--output', outputPath,
      ], { maxBuffer: 2_000_000 });
    } catch (error) {
      const failure = error as { code?: string | number; stderr?: string };
      fs.writeFileSync(errorPath, `${JSON.stringify({
        sourceId: entry.sourceId,
        url: entry.url,
        failureCode: String(failure.code ?? 'ERR_FIRECRAWL'),
        failureClass: /authentication/i.test(failure.stderr ?? '') ? 'authentication_or_login' : 'retrieval_failed',
      }, null, 2)}\n`);
    }
  });
  const outputs = entries.filter((entry) => fs.existsSync(path.join(outputDir, `${entry.sourceId}.json`)));
  const failures = entries.filter((entry) => fs.existsSync(path.join(outputDir, `${entry.sourceId}.error.json`)));
  assert.equal(outputs.length + failures.length, entries.length);
  console.log(`P5 FIRECRAWL PASS staticPublic=${entries.length} success=${outputs.length} failures=${failures.length} concurrency=${CONCURRENCY}`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
