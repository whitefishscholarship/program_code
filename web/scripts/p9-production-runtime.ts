import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(scriptDir, '..');
const sourceRoot = path.join(webRoot, 'src');
const publicationPath = path.join(webRoot, 'fixtures/p8m/matching-facts-v1.json');
const expectedPublicationSha256 = '16db9f32a14c7b63d2a912a84c43ac973ae43a07d7c40841174d6fbdfd5a6b07';

const forbiddenRuntimePatterns = [
  /GOOGLE_SERVICE_ACCOUNT_CREDENTIALS/,
  /GOOGLE_SHEET_ID/,
  /GEMINI_API_KEY/,
  /from\s+['"]googleapis['"]/,
  /from\s+['"]@google\//,
  /next\/font\/google/,
  /sheets\.googleapis\.com/,
  /drive\.googleapis\.com/,
  /google\.sheets\s*\(/,
  /\/auth\/spreadsheets/,
  /\.spreadsheets\.values\./,
] as const;

const sourceExtensions = ['.ts', '.tsx', '.js', '.jsx', '.json', '.css'] as const;

function sha256(value: Buffer | string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function walk(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(absolute) : [absolute];
  });
}

function resolveLocalImport(fromFile: string, specifier: string): string | null {
  let candidate: string;
  if (specifier.startsWith('@/')) candidate = path.join(sourceRoot, specifier.slice(2));
  else if (specifier.startsWith('.')) candidate = path.resolve(path.dirname(fromFile), specifier);
  else return null;

  const attempts = [candidate, ...sourceExtensions.map((extension) => `${candidate}${extension}`)];
  for (const extension of sourceExtensions) attempts.push(path.join(candidate, `index${extension}`));
  const resolved = attempts.find((attempt) => fs.existsSync(attempt) && fs.statSync(attempt).isFile());
  if (!resolved) {
    throw new Error(`Unresolved local runtime import ${specifier} from ${path.relative(webRoot, fromFile)}`);
  }
  const normalized = path.resolve(resolved);
  if (!normalized.startsWith(`${webRoot}${path.sep}`)) {
    throw new Error(`Runtime import escapes the web project: ${specifier}`);
  }
  return normalized;
}

function runtimeEntrypoints(): string[] {
  const appEntries = walk(path.join(sourceRoot, 'app')).filter((file) =>
    /\/(?:page|layout|route)\.(?:ts|tsx|js|jsx)$/.test(file),
  );
  const middleware = path.join(sourceRoot, 'middleware.ts');
  return fs.existsSync(middleware) ? [...appEntries, middleware] : appEntries;
}

export function runtimeClosure(): string[] {
  const queue = runtimeEntrypoints();
  const visited = new Set<string>();
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);
    if (!/\.(?:ts|tsx|js|jsx)$/.test(current)) continue;
    const imports = ts.preProcessFile(fs.readFileSync(current, 'utf8'), true, true).importedFiles;
    for (const imported of imports) {
      const resolved = resolveLocalImport(current, imported.fileName);
      if (resolved && !visited.has(resolved)) queue.push(resolved);
    }
  }
  return [...visited].sort();
}

export function forbiddenRuntimeCapabilities(source: string): string[] {
  return forbiddenRuntimePatterns
    .filter((pattern) => pattern.test(source))
    .map((pattern) => pattern.source);
}

export type P9RuntimeReceipt = {
  publicationSha256: string;
  publicationId: string;
  sourceRows: number;
  scholarshipRows: number;
  portalRows: number;
  acceptedMatchingFacts: number;
  runtimeFiles: number;
  runtimeClosureSha256: string;
  disabledProductionAdminRoutes: string[];
  runtimeGoogleCapability: 'none';
};

export function validateP9ProductionRuntime(): P9RuntimeReceipt {
  const publicationBytes = fs.readFileSync(publicationPath);
  const publicationSha256 = sha256(publicationBytes);
  if (publicationSha256 !== expectedPublicationSha256) {
    throw new Error(`P8M publication digest mismatch: ${publicationSha256}`);
  }
  const publication = JSON.parse(publicationBytes.toString('utf8')) as {
    publication_id: string;
    counts: {
      source_rows: number;
      scholarship_rows: number;
      portal_rows: number;
      accepted_matching_facts: number;
    };
  };
  if (
    publication.publication_id !== 'p8m-matching-facts-v1-rev225' ||
    publication.counts.source_rows !== 197 ||
    publication.counts.scholarship_rows !== 176 ||
    publication.counts.portal_rows !== 21 ||
    publication.counts.accepted_matching_facts !== 0
  ) {
    throw new Error('P8M publication identity or denominator mismatch');
  }

  const packageJson = JSON.parse(fs.readFileSync(path.join(webRoot, 'package.json'), 'utf8')) as {
    dependencies?: Record<string, string>;
  };
  for (const dependency of ['googleapis', '@google/genai']) {
    if (packageJson.dependencies?.[dependency]) {
      throw new Error(`${dependency} must not be a production runtime dependency`);
    }
  }

  const closure = runtimeClosure();
  const violations = closure.flatMap((file) => {
    if (!/\.(?:ts|tsx|js|jsx)$/.test(file)) return [];
    return forbiddenRuntimeCapabilities(fs.readFileSync(file, 'utf8')).map(
      (pattern) => `${path.relative(webRoot, file)}:${pattern}`,
    );
  });
  if (violations.length > 0) {
    throw new Error(`Forbidden Google/Drive/Sheets runtime capability: ${violations.join(', ')}`);
  }
  if (!closure.includes(publicationPath)) {
    throw new Error('The exact P8M publication is not in the deployed runtime closure');
  }

  const disabledProductionAdminRoutes = [
    'src/app/api/admin/extract/route.ts',
    'src/app/api/admin/push/route.ts',
  ];
  for (const relative of disabledProductionAdminRoutes) {
    const source = fs.readFileSync(path.join(webRoot, relative), 'utf8');
    if (!source.includes('status: 410') || !source.includes("'Cache-Control': 'no-store'")) {
      throw new Error(`${relative} must remain a non-cacheable retired endpoint`);
    }
  }

  const runtimeDigestPayload = closure.map((file) => ({
    path: path.relative(webRoot, file),
    sha256: sha256(fs.readFileSync(file)),
  }));
  return {
    publicationSha256,
    publicationId: publication.publication_id,
    sourceRows: publication.counts.source_rows,
    scholarshipRows: publication.counts.scholarship_rows,
    portalRows: publication.counts.portal_rows,
    acceptedMatchingFacts: publication.counts.accepted_matching_facts,
    runtimeFiles: closure.length,
    runtimeClosureSha256: sha256(JSON.stringify(runtimeDigestPayload)),
    disabledProductionAdminRoutes,
    runtimeGoogleCapability: 'none',
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(validateP9ProductionRuntime(), null, 2));
}
