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
const forbiddenBuiltRuntimePatterns = [
  ...forbiddenRuntimePatterns,
  /googleapis/,
  /google-auth-library/,
  /@google-cloud\//,
] as const;

const forbiddenPackageRoots = ['googleapis', 'google-auth-library', '@google/genai', '@google-cloud/'] as const;
const forbiddenEnvironmentName = /(google|gcp|drive|sheets?|spreadsheet|service_account)/i;

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

function forbiddenModuleSpecifier(specifier: string): boolean {
  return forbiddenPackageRoots.some((root) =>
    root.endsWith('/') ? specifier.startsWith(root) : specifier === root || specifier.startsWith(`${root}/`),
  );
}

export function forbiddenRuntimeCapabilities(source: string, fileName = 'probe.ts'): string[] {
  const violations = forbiddenRuntimePatterns
    .filter((pattern) => pattern.test(source))
    .map((pattern) => pattern.source);
  const sourceFile = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const localNetworkTargets = new Set<string>();
  const moduleSpecifier = (node: ts.Expression | undefined): string | null =>
    node && (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) ? node.text : null;
  const onlyLocalNetworkValues = (node: ts.Expression): boolean => {
    const literal = moduleSpecifier(node);
    if (literal !== null) return literal.startsWith('/');
    return ts.isConditionalExpression(node) && onlyLocalNetworkValues(node.whenTrue) && onlyLocalNetworkValues(node.whenFalse);
  };
  const collectLocalNetworkTargets = (node: ts.Node): void => {
    if (ts.isVariableStatement(node) && (node.declarationList.flags & ts.NodeFlags.Const)) {
      for (const declaration of node.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name) && declaration.initializer && onlyLocalNetworkValues(declaration.initializer)) {
          localNetworkTargets.add(declaration.name.text);
        }
      }
    }
    ts.forEachChild(node, collectLocalNetworkTargets);
  };
  collectLocalNetworkTargets(sourceFile);
  const visit = (node: ts.Node): void => {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier) {
      const specifier = moduleSpecifier(node.moduleSpecifier);
      if (specifier && forbiddenModuleSpecifier(specifier)) violations.push(`forbidden-module:${specifier}`);
    }
    if (ts.isImportEqualsDeclaration(node) && ts.isExternalModuleReference(node.moduleReference)) {
      const specifier = moduleSpecifier(node.moduleReference.expression);
      if (specifier && forbiddenModuleSpecifier(specifier)) violations.push(`forbidden-module:${specifier}`);
    }
    if (ts.isCallExpression(node)) {
      const isDynamicImport = node.expression.kind === ts.SyntaxKind.ImportKeyword;
      const isRequire = ts.isIdentifier(node.expression) && node.expression.text === 'require';
      if (isDynamicImport || isRequire) {
        const specifier = moduleSpecifier(node.arguments[0]);
        if (specifier === null) violations.push('computed-module-specifier');
        else if (forbiddenModuleSpecifier(specifier)) violations.push(`forbidden-module:${specifier}`);
      }
      if (ts.isIdentifier(node.expression) && node.expression.text === 'fetch') {
        const target = moduleSpecifier(node.arguments[0]);
        if (target === null && !(node.arguments[0] && ts.isIdentifier(node.arguments[0]) && localNetworkTargets.has(node.arguments[0].text))) violations.push('computed-network-target');
        else if (target !== null && /^https?:\/\//i.test(target)) violations.push(`external-network-target:${target}`);
      }
    }
    if (
      ts.isPropertyAccessExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      ts.isIdentifier(node.expression.expression) &&
      node.expression.expression.text === 'process' &&
      node.expression.name.text === 'env' &&
      forbiddenEnvironmentName.test(node.name.text)
    ) violations.push(`forbidden-environment:${node.name.text}`);
    if (
      ts.isElementAccessExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      ts.isIdentifier(node.expression.expression) &&
      node.expression.expression.text === 'process' &&
      node.expression.name.text === 'env'
    ) {
      const name = moduleSpecifier(node.argumentExpression);
      if (name === null) violations.push('computed-environment-name');
      else if (forbiddenEnvironmentName.test(name)) violations.push(`forbidden-environment:${name}`);
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return [...new Set(violations)];
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
  nonceBoundHealth: true;
  productionDependencyGooglePackages: string[];
  developmentOnlyGooglePackages: string[];
  deploymentConfigFilesChecked: string[];
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
    devDependencies?: Record<string, string>;
  };
  const productionDependencyGooglePackages = Object.keys(packageJson.dependencies ?? {}).filter(forbiddenModuleSpecifier);
  if (productionDependencyGooglePackages.length > 0) {
    throw new Error(`${productionDependencyGooglePackages.join(', ')} must not be production runtime dependencies`);
  }
  const developmentOnlyGooglePackages = Object.keys(packageJson.devDependencies ?? {}).filter(forbiddenModuleSpecifier).sort();

  const closure = runtimeClosure();
  const violations = closure.flatMap((file) => {
    if (!/\.(?:ts|tsx|js|jsx)$/.test(file)) return [];
    return forbiddenRuntimeCapabilities(fs.readFileSync(file, 'utf8'), file).map(
      (pattern) => `${path.relative(webRoot, file)}:${pattern}`,
    );
  });
  if (violations.length > 0) {
    throw new Error(`Forbidden Google/Drive/Sheets runtime capability: ${violations.join(', ')}`);
  }
  if (!closure.includes(publicationPath)) {
    throw new Error('The exact P8M publication is not in the deployed runtime closure');
  }

  const deploymentConfigFilesChecked = ['next.config.ts', 'package.json', 'package-lock.json']
    .filter((relative) => fs.existsSync(path.join(webRoot, relative)));
  for (const relative of deploymentConfigFilesChecked) {
    const configViolations = forbiddenRuntimePatterns.filter((pattern) => pattern.test(fs.readFileSync(path.join(webRoot, relative), 'utf8')));
    if (configViolations.length > 0) throw new Error(`Forbidden deployment configuration capability in ${relative}`);
  }

  const builtServerRoot = path.join(webRoot, '.next', 'server');
  if (fs.existsSync(builtServerRoot)) {
    const builtViolations = walk(builtServerRoot)
      .filter((file) => /\.(?:js|mjs|cjs|json)$/.test(file))
      .flatMap((file) => forbiddenBuiltRuntimePatterns.filter((pattern) => pattern.test(fs.readFileSync(file, 'utf8'))).map((pattern) => `${path.relative(webRoot, file)}:${pattern.source}`));
    if (builtViolations.length > 0) throw new Error(`Forbidden capability in traced production bundle: ${builtViolations.join(', ')}`);
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

  const healthSource = fs.readFileSync(path.join(webRoot, 'src/app/api/health/route.ts'), 'utf8');
  if (
    !healthSource.includes("searchParams.get('nonce')") ||
    !healthSource.includes('observationNonce') ||
    !healthSource.includes("'Cache-Control': 'no-store'")
  ) {
    throw new Error('Health route must return a caller-bound nonce without caching');
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
    nonceBoundHealth: true,
    productionDependencyGooglePackages,
    developmentOnlyGooglePackages,
    deploymentConfigFilesChecked,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(validateP9ProductionRuntime(), null, 2));
}
