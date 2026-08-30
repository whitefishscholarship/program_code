import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import ts from 'typescript';
import { z } from 'zod';

import {
  P9_AUTHORIZED_PRODUCTION_TABS,
  P9_DEPLOYMENT_EVIDENCE_PATH,
  P9_ENTRY_EVIDENCE_PATH,
  P9_POST_CUTOVER_EVIDENCE_PATH,
  P9_PRODUCTION_SPREADSHEET_ID,
  P9_READ_ONLY_OAUTH_SCOPE,
  P9_RUNTIME_EQUIVALENCE_PATHS,
  P9_TESTING_SPREADSHEET_ID,
  P9_VERIFIED_BACKUPS,
} from './production-authority';

export const P9_TRUSTED_WORKFLOW_PATH = '.github/workflows/p9-evidence.yml';
export const P9_TRUSTED_PROOF_SCRIPT_PATH = 'web/scripts/p9-trusted-proof.ts';
export const P9_EVIDENCE_REPOSITORY = 'whitefishscholarship/program_code';
export const P9_EVIDENCE_ENVIRONMENT = 'p9-production-verification';
export const P9_SIGNER_WORKFLOW =
  'github.com/whitefishscholarship/program_code/.github/workflows/p9-evidence.yml';
export const P9_DRIVE_METADATA_SCOPE =
  'https://www.googleapis.com/auth/drive.metadata.readonly';
export const P9_TRUSTED_PROOF_PATHS = [
  P9_TRUSTED_WORKFLOW_PATH,
  '.github/workflows/ci.yml',
  P9_TRUSTED_PROOF_SCRIPT_PATH,
  'web/scripts/p9-evidence-v2.ts',
  'web/scripts/production-authority.ts',
  'web/scripts/validate-build-plan.ts',
  'web/scripts/delivery-state-history.ts',
  'web/scripts/delivery-package-history.ts',
  'web/scripts/governance-history.ts',
  'web/scripts/test-p9-evidence-v2.ts',
  'web/scripts/test-production-authority.ts',
  'web/package.json',
  'web/package-lock.json',
  'web/tsconfig.json',
] as const;

export const P9_REQUIRED_WRITE_SURFACES = [
  { id: 'api-admin-push', path: 'web/src/app/api/admin/push/route.ts' },
  { id: 'script-crawl-directory', path: 'web/scripts/crawl-directory.ts' },
  { id: 'script-ingest-batch', path: 'web/scripts/ingest-batch.ts' },
  { id: 'script-reeval-staging', path: 'web/scripts/reeval-staging.ts' },
] as const;

export const P9_WRITE_GUARD_MODULE_PATH = 'web/src/lib/p9-write-policy.ts';
export const P9_WRITE_GUARD_NAME = 'guardP9SheetWrite';
export const P9_WRITE_ISOLATION_PROBE_EXPORT = 'p9WriteIsolationProbe';
export const P9_PRODUCTION_WRITE_BLOCKED_CODE = 'P9_PRODUCTION_WRITE_BLOCKED';
export const P9_APPLICATION_READ_CHALLENGE_DOMAIN =
  'whitefish-p9-application-read-challenge-v1';
export const P9_APPLICATION_READ_CHALLENGE_HASH_ALGORITHM =
  'google-sheets-v4-griddata-canonical-json+runner-nonce-v1';
export const P9_PRODUCTION_SOURCE_LOADER_PATH =
  'web/src/lib/p9-production-source.ts';
export const P9_PRODUCTION_SOURCE_LOADER_EXPORT =
  'loadP9ScholarshipSource';
export const P9_HEALTH_ROUTE_PATH = 'web/src/app/api/health/route.ts';
export const P9_PUBLIC_ROUTE_PATH = 'web/src/app/api/scholarships/route.ts';
export const P9_APPLICATION_READ_BOUNDED_FIELDS =
  'spreadsheetId,sheets(properties(sheetId,title,gridProperties(rowCount,columnCount)),data)';

export type P9WriteSurfaceInventoryItem = {
  id: string;
  path: string;
  mutators: string[];
  independentlyDerived: true;
  probeExport: typeof P9_WRITE_ISOLATION_PROBE_EXPORT;
  googleSheetsClientConstructions: number;
  guardedGoogleSheetsClientConstructions: number;
  googleSheetsMutatorCalls: number;
  guardedBeforeClientConstruction: boolean;
};

export type P9WriteSurfaceInventory = P9WriteSurfaceInventoryItem[];

const WRITE_CAPABLE_GOOGLE_SCOPES = new Set([
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
]);

const GOOGLE_SHEETS_MUTATOR_SUFFIXES = [
  'spreadsheets.batchUpdate',
  'spreadsheets.sheets.copyTo',
  'spreadsheets.values.append',
  'spreadsheets.values.batchClear',
  'spreadsheets.values.batchClearByDataFilter',
  'spreadsheets.values.batchUpdate',
  'spreadsheets.values.batchUpdateByDataFilter',
  'spreadsheets.values.clear',
  'spreadsheets.values.update',
] as const;

const GENERIC_NETWORK_MODULE_ROOTS = new Map<string, string>([
  ['axios', 'axios'],
  ['cross-fetch', 'fetch'],
  ['got', 'got'],
  ['ky', 'ky'],
  ['node-fetch', 'fetch'],
  ['undici', 'undici'],
  ['http', 'http'],
  ['https', 'https'],
  ['node:http', 'http'],
  ['node:https', 'https'],
]);

const GENERIC_NETWORK_METHOD_MEMBERS = new Map<string, string>([
  ['get', 'GET'],
  ['head', 'HEAD'],
  ['post', 'POST'],
  ['put', 'PUT'],
  ['patch', 'PATCH'],
  ['delete', 'DELETE'],
  ['options', 'OPTIONS'],
]);

function googleSheetsMutator(chain: string | null): string | null {
  if (!chain) return null;
  return (
    GOOGLE_SHEETS_MUTATOR_SUFFIXES.find(
      (suffix) => chain === suffix || chain.endsWith(`.${suffix}`),
    ) ?? null
  );
}

const BASELINE_WRITE_SURFACE_IDS = new Map<string, string>(
  P9_REQUIRED_WRITE_SURFACES.map((surface) => [surface.path, surface.id]),
);

function propertyAccessChain(node: ts.Expression): string | null {
  const names: string[] = [];
  let current: ts.Expression = node;
  while (true) {
    if (ts.isPropertyAccessExpression(current)) {
      names.unshift(current.name.text);
      current = current.expression;
      continue;
    }
    if (
      ts.isElementAccessExpression(current) &&
      current.argumentExpression &&
      (ts.isStringLiteral(current.argumentExpression) ||
        ts.isNoSubstitutionTemplateLiteral(current.argumentExpression))
    ) {
      names.unshift(current.argumentExpression.text);
      current = current.expression;
      continue;
    }
    break;
  }
  if (ts.isIdentifier(current)) names.unshift(current.text);
  return names.length > 0 ? names.join('.') : null;
}

function isGeneratedPath(relativePath: string): boolean {
  const parts = relativePath.split('/');
  return parts.some((part) =>
    [
      'node_modules',
      '.next',
      '.turbo',
      '.git',
      'build',
      'dist',
      'coverage',
      'out',
    ].includes(part),
  );
}

function runtimeSourceFiles(repositoryRoot: string): string[] {
  const files: string[] = [];
  const visit = (directory: string): void => {
    if (!fs.existsSync(directory)) return;
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolutePath = path.join(directory, entry.name);
      const relativePath = path.relative(repositoryRoot, absolutePath).split(path.sep).join('/');
      if (isGeneratedPath(relativePath)) continue;
      if (
        (P9_TRUSTED_PROOF_PATHS as readonly string[]).includes(relativePath) &&
        /\.[cm]?[jt]sx?$/.test(relativePath)
      ) {
        continue;
      }
      if (entry.isDirectory()) visit(absolutePath);
      else if (entry.isFile() && /\.(?:[cm]?[jt]sx?)$/.test(entry.name)) files.push(relativePath);
    }
  };
  // Scan the complete web tree. Test/spec/__tests__ names are intentionally not
  // excluded: a runtime import can make any such file executable capability.
  visit(path.join(repositoryRoot, 'web'));
  return files.sort();
}

function symbolAt(checker: ts.TypeChecker, node: ts.Node): ts.Symbol | null {
  return checker.getSymbolAtLocation(node) ?? null;
}

function sameSymbol(
  checker: ts.TypeChecker,
  left: ts.Node,
  right: ts.Symbol | null,
): boolean {
  return Boolean(right && symbolAt(checker, left) === right);
}

function enclosingGuardCall(
  node: ts.Node,
  checker: ts.TypeChecker,
  guardImportSymbol: ts.Symbol | null,
): ts.CallExpression | null {
  if (!guardImportSymbol) return null;
  let current: ts.Node | undefined = node;
  while (current?.parent) {
    const parent: ts.Node = current.parent;
    if (ts.isArrowFunction(parent) || ts.isFunctionExpression(parent)) {
      const call = parent.parent;
      if (
        ts.isCallExpression(call) &&
        call.arguments[1] === parent &&
        ts.isIdentifier(call.expression) &&
        sameSymbol(checker, call.expression, guardImportSymbol)
      ) {
        return call;
      }
    }
    current = parent;
  }
  return null;
}

function propertyValue(
  object: ts.ObjectLiteralExpression,
  name: string,
): ts.Expression | ts.ShorthandPropertyAssignment | null {
  for (const property of object.properties) {
    if (
      ts.isPropertyAssignment(property) &&
      !ts.isComputedPropertyName(property.name) &&
      ((ts.isIdentifier(property.name) && property.name.text === name) ||
        (ts.isStringLiteral(property.name) && property.name.text === name))
    ) {
      return property.initializer;
    }
    if (ts.isShorthandPropertyAssignment(property) && property.name.text === name) {
      return property;
    }
  }
  return null;
}

type ExactObjectProperty =
  | { state: 'absent' }
  | { state: 'unknown' }
  | {
      state: 'value';
      value: ts.Expression | ts.ShorthandPropertyAssignment;
    };

function exactObjectProperty(
  object: ts.ObjectLiteralExpression,
  name: string,
): ExactObjectProperty {
  let result: ExactObjectProperty = { state: 'absent' };
  for (const property of object.properties) {
    if (ts.isSpreadAssignment(property)) {
      result = { state: 'unknown' };
      continue;
    }
    if (ts.isShorthandPropertyAssignment(property)) {
      if (property.name.text === name) {
        result = { state: 'value', value: property };
      }
      continue;
    }
    if (ts.isPropertyAssignment(property)) {
      let propertyName: string | null = null;
      if (ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)) {
        propertyName = property.name.text;
      } else if (
        ts.isComputedPropertyName(property.name) &&
        (ts.isStringLiteral(property.name.expression) ||
          ts.isNoSubstitutionTemplateLiteral(property.name.expression))
      ) {
        propertyName = property.name.expression.text;
      } else if (ts.isComputedPropertyName(property.name)) {
        result = { state: 'unknown' };
        continue;
      }
      if (propertyName === name) {
        result = { state: 'value', value: property.initializer };
      }
      continue;
    }
    if (
      (ts.isMethodDeclaration(property) ||
        ts.isGetAccessorDeclaration(property) ||
        ts.isSetAccessorDeclaration(property)) &&
      (ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)) &&
      property.name.text === name
    ) {
      result = { state: 'unknown' };
    }
  }
  return result;
}

function symbolKey(
  symbol: ts.Symbol,
  repositoryRoot: string,
): string | null {
  const declaration = symbol.valueDeclaration ?? symbol.declarations?.[0];
  if (!declaration) return null;
  const sourcePath = path
    .relative(repositoryRoot, declaration.getSourceFile().fileName)
    .split(path.sep)
    .join('/');
  return `symbol:${sourcePath}:${declaration.getStart()}`;
}

function directSpreadsheetIdKey(
  expression: ts.Expression | ts.ShorthandPropertyAssignment,
  checker: ts.TypeChecker,
  repositoryRoot: string,
  reassignedSymbols: ReadonlySet<ts.Symbol>,
): string | null {
  if (ts.isShorthandPropertyAssignment(expression)) {
    const symbol = checker.getShorthandAssignmentValueSymbol(expression);
    return symbol && !reassignedSymbols.has(symbol)
      ? symbolKey(symbol, repositoryRoot)
      : null;
  }
  if (ts.isStringLiteral(expression) || ts.isNoSubstitutionTemplateLiteral(expression)) {
    return `literal:${expression.text}`;
  }
  if (ts.isIdentifier(expression)) {
    const symbol = symbolAt(checker, expression);
    return symbol && !reassignedSymbols.has(symbol)
      ? symbolKey(symbol, repositoryRoot)
      : null;
  }
  return null;
}

function directMutatorTargetKey(
  mutator: string,
  call: ts.CallExpression,
  checker: ts.TypeChecker,
  repositoryRoot: string,
  reassignedSymbols: ReadonlySet<ts.Symbol>,
): string | null {
  const argument = call.arguments[0];
  if (!argument || !ts.isObjectLiteralExpression(argument)) return null;
  if (mutator === 'spreadsheets.sheets.copyTo') {
    const requestBody = propertyValue(argument, 'requestBody');
    if (!requestBody || ts.isShorthandPropertyAssignment(requestBody)) return null;
    if (!ts.isObjectLiteralExpression(requestBody)) return null;
    const destination = propertyValue(requestBody, 'destinationSpreadsheetId');
    return destination
      ? directSpreadsheetIdKey(
          destination,
          checker,
          repositoryRoot,
          reassignedSymbols,
        )
      : null;
  }
  const spreadsheetId = propertyValue(argument, 'spreadsheetId');
  return spreadsheetId
    ? directSpreadsheetIdKey(
        spreadsheetId,
        checker,
        repositoryRoot,
        reassignedSymbols,
      )
    : null;
}

type AliasChains = Map<ts.Symbol, string[]>;

function expressionChain(
  expression: ts.Expression,
  checker: ts.TypeChecker,
  aliases: AliasChains,
  seen: ReadonlySet<ts.Symbol> = new Set(),
): string[] | null {
  if (
    ts.isParenthesizedExpression(expression) ||
    ts.isAsExpression(expression) ||
    ts.isTypeAssertionExpression(expression) ||
    ts.isNonNullExpression(expression) ||
    ts.isAwaitExpression(expression)
  ) {
    return expressionChain(expression.expression, checker, aliases, seen);
  }
  if (ts.isIdentifier(expression)) {
    const symbol = symbolAt(checker, expression);
    if (symbol && aliases.has(symbol) && !seen.has(symbol)) {
      return aliases.get(symbol)!;
    }
    return [expression.text];
  }
  if (ts.isPropertyAccessExpression(expression)) {
    const parent = expressionChain(expression.expression, checker, aliases, seen);
    return parent ? [...parent, expression.name.text] : null;
  }
  if (
    ts.isElementAccessExpression(expression) &&
    expression.argumentExpression &&
    (ts.isStringLiteral(expression.argumentExpression) ||
      ts.isNoSubstitutionTemplateLiteral(expression.argumentExpression))
  ) {
    const parent = expressionChain(expression.expression, checker, aliases, seen);
    return parent ? [...parent, expression.argumentExpression.text] : null;
  }
  if (ts.isCallExpression(expression)) {
    if (
      ts.isIdentifier(expression.expression) &&
      expression.expression.text === 'require' &&
      expression.arguments.length === 1 &&
      ts.isStringLiteral(expression.arguments[0]) &&
      expression.arguments[0].text === 'googleapis'
    ) {
      return ['googleapis'];
    }
    if (
      ts.isIdentifier(expression.expression) &&
      expression.expression.text === 'require' &&
      expression.arguments.length === 1 &&
      ts.isStringLiteral(expression.arguments[0])
    ) {
      const root = GENERIC_NETWORK_MODULE_ROOTS.get(expression.arguments[0].text);
      if (root) return [root];
    }
    return expressionChain(expression.expression, checker, aliases, seen);
  }
  return null;
}

function bindAliasPattern(
  name: ts.BindingName,
  base: string[],
  checker: ts.TypeChecker,
  aliases: AliasChains,
): boolean {
  let changed = false;
  if (ts.isIdentifier(name)) {
    const symbol = symbolAt(checker, name);
    if (symbol && canonicalP9Json(aliases.get(symbol)) !== canonicalP9Json(base)) {
      aliases.set(symbol, base);
      changed = true;
    }
    return changed;
  }
  if (ts.isObjectBindingPattern(name)) {
    for (const element of name.elements) {
      if (element.dotDotDotToken) continue;
      const propertyName = element.propertyName ?? element.name;
      const segment = ts.isIdentifier(propertyName) || ts.isStringLiteral(propertyName)
        ? propertyName.text
        : null;
      if (segment && bindAliasPattern(element.name, [...base, segment], checker, aliases)) {
        changed = true;
      }
    }
  }
  return changed;
}

function buildAliasChains(
  sourceFile: ts.SourceFile,
  checker: ts.TypeChecker,
): AliasChains {
  const aliases: AliasChains = new Map();
  for (const statement of sourceFile.statements) {
    if (
      ts.isImportDeclaration(statement) &&
      ts.isStringLiteral(statement.moduleSpecifier)
    ) {
      const moduleName = statement.moduleSpecifier.text;
      const networkRoot = GENERIC_NETWORK_MODULE_ROOTS.get(moduleName);
      if (moduleName !== 'googleapis' && !networkRoot) continue;
      const clause = statement.importClause;
      if (clause?.name) {
        const symbol = symbolAt(checker, clause.name);
        if (symbol) {
          aliases.set(
            symbol,
            moduleName === 'googleapis' ? ['googleapis'] : [networkRoot!],
          );
        }
      }
      if (clause?.namedBindings && ts.isNamespaceImport(clause.namedBindings)) {
        const symbol = symbolAt(checker, clause.namedBindings.name);
        if (symbol) {
          aliases.set(
            symbol,
            moduleName === 'googleapis' ? ['googleapis'] : [networkRoot!],
          );
        }
      }
      if (clause?.namedBindings && ts.isNamedImports(clause.namedBindings)) {
        for (const element of clause.namedBindings.elements) {
          const symbol = symbolAt(checker, element.name);
          if (symbol) {
            const importedName = element.propertyName?.text ?? element.name.text;
            aliases.set(
              symbol,
              moduleName === 'googleapis'
                ? [importedName]
                : importedName === 'fetch'
                  ? ['fetch']
                  : [networkRoot!, importedName],
            );
          }
        }
      }
    }
  }
  for (let pass = 0; pass < 16; pass += 1) {
    let changed = false;
    const visit = (node: ts.Node): void => {
      if (ts.isVariableDeclaration(node) && node.initializer) {
        const chain = expressionChain(node.initializer, checker, aliases);
        if (chain && bindAliasPattern(node.name, chain, checker, aliases)) changed = true;
      }
      ts.forEachChild(node, visit);
    };
    visit(sourceFile);
    if (!changed) break;
  }
  return aliases;
}

function collectAssignedSymbols(
  sourceFile: ts.SourceFile,
  checker: ts.TypeChecker,
): Set<ts.Symbol> {
  const symbols = new Set<ts.Symbol>();
  const addTarget = (node: ts.Node): void => {
    if (ts.isIdentifier(node)) {
      const symbol = symbolAt(checker, node);
      if (symbol) symbols.add(symbol);
      return;
    }
    ts.forEachChild(node, addTarget);
  };
  const visit = (node: ts.Node): void => {
    if (
      ts.isBinaryExpression(node) &&
      node.operatorToken.kind >= ts.SyntaxKind.FirstAssignment &&
      node.operatorToken.kind <= ts.SyntaxKind.LastAssignment
    ) {
      addTarget(node.left);
    }
    if (
      (ts.isPrefixUnaryExpression(node) || ts.isPostfixUnaryExpression(node)) &&
      (node.operator === ts.SyntaxKind.PlusPlusToken ||
        node.operator === ts.SyntaxKind.MinusMinusToken)
    ) {
      addTarget(node.operand);
    }
    if ((ts.isForInStatement(node) || ts.isForOfStatement(node)) && !ts.isVariableDeclarationList(node.initializer)) {
      addTarget(node.initializer);
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return symbols;
}

type StaticStringPattern = {
  text: string;
  complete: boolean;
};

function unwrapStableExpression(
  expression: ts.Expression,
  checker: ts.TypeChecker,
  reassignedSymbols: ReadonlySet<ts.Symbol>,
  seen: ReadonlySet<ts.Symbol> = new Set(),
): ts.Expression {
  if (
    ts.isParenthesizedExpression(expression) ||
    ts.isAsExpression(expression) ||
    ts.isTypeAssertionExpression(expression) ||
    ts.isNonNullExpression(expression) ||
    ts.isAwaitExpression(expression)
  ) {
    return unwrapStableExpression(
      expression.expression,
      checker,
      reassignedSymbols,
      seen,
    );
  }
  if (ts.isIdentifier(expression)) {
    const symbol = symbolAt(checker, expression);
    const declaration = symbol?.valueDeclaration;
    if (
      symbol &&
      declaration &&
      !seen.has(symbol) &&
      !reassignedSymbols.has(symbol) &&
      ts.isVariableDeclaration(declaration) &&
      declaration.initializer
    ) {
      return unwrapStableExpression(
        declaration.initializer,
        checker,
        reassignedSymbols,
        new Set([...seen, symbol]),
      );
    }
  }
  return expression;
}

function staticStringPattern(
  input: ts.Expression,
  checker: ts.TypeChecker,
  reassignedSymbols: ReadonlySet<ts.Symbol>,
  seen: ReadonlySet<ts.Symbol> = new Set(),
): StaticStringPattern {
  const expression = unwrapStableExpression(
    input,
    checker,
    reassignedSymbols,
    seen,
  );
  if (
    ts.isStringLiteral(expression) ||
    ts.isNoSubstitutionTemplateLiteral(expression)
  ) {
    return { text: expression.text, complete: true };
  }
  if (ts.isTemplateExpression(expression)) {
    let text = expression.head.text;
    let complete = true;
    for (const span of expression.templateSpans) {
      const value = staticStringPattern(
        span.expression,
        checker,
        reassignedSymbols,
        seen,
      );
      text += value.text;
      complete = complete && value.complete;
      text += span.literal.text;
    }
    return { text, complete };
  }
  if (
    ts.isBinaryExpression(expression) &&
    expression.operatorToken.kind === ts.SyntaxKind.PlusToken
  ) {
    const left = staticStringPattern(
      expression.left,
      checker,
      reassignedSymbols,
      seen,
    );
    const right = staticStringPattern(
      expression.right,
      checker,
      reassignedSymbols,
      seen,
    );
    return {
      text: `${left.text}${right.text}`,
      complete: left.complete && right.complete,
    };
  }
  if (
    ts.isCallExpression(expression) &&
    ts.isIdentifier(expression.expression) &&
    expression.expression.text === 'String' &&
    expression.arguments.length === 1
  ) {
    return staticStringPattern(
      expression.arguments[0],
      checker,
      reassignedSymbols,
      seen,
    );
  }
  if (
    ts.isCallExpression(expression) &&
    ts.isPropertyAccessExpression(expression.expression) &&
    expression.expression.name.text === 'toString' &&
    expression.arguments.length === 0
  ) {
    return staticStringPattern(
      expression.expression.expression,
      checker,
      reassignedSymbols,
      seen,
    );
  }
  if (
    ts.isPropertyAccessExpression(expression) &&
    (expression.name.text === 'href' || expression.name.text === 'url')
  ) {
    return staticStringPattern(
      expression.expression,
      checker,
      reassignedSymbols,
      seen,
    );
  }
  if (
    ts.isNewExpression(expression) &&
    ts.isIdentifier(expression.expression) &&
    expression.expression.text === 'URL' &&
    expression.arguments?.[0]
  ) {
    const relative = staticStringPattern(
      expression.arguments[0],
      checker,
      reassignedSymbols,
      seen,
    );
    const baseExpression = expression.arguments[1];
    if (!baseExpression) return relative;
    const base = staticStringPattern(
      baseExpression,
      checker,
      reassignedSymbols,
      seen,
    );
    if (relative.complete && base.complete) {
      try {
        return { text: new URL(relative.text, base.text).toString(), complete: true };
      } catch {
        return { text: '*', complete: false };
      }
    }
    const baseOrigin = /^https?:\/\/[^/*]+/i.exec(base.text)?.[0];
    if (baseOrigin && !baseOrigin.includes('*')) {
      const suffix = relative.text.startsWith('/')
        ? relative.text
        : `/${relative.text}`;
      return { text: `${baseOrigin}${suffix}`, complete: false };
    }
    return { text: '*', complete: false };
  }
  if (ts.isConditionalExpression(expression)) {
    const whenTrue = staticStringPattern(
      expression.whenTrue,
      checker,
      reassignedSymbols,
      seen,
    );
    const whenFalse = staticStringPattern(
      expression.whenFalse,
      checker,
      reassignedSymbols,
      seen,
    );
    if (whenTrue.text === whenFalse.text) {
      return {
        text: whenTrue.text,
        complete: whenTrue.complete && whenFalse.complete,
      };
    }
  }
  return { text: '*', complete: false };
}

function stableObjectLiteral(
  expression: ts.Expression | undefined,
  checker: ts.TypeChecker,
  reassignedSymbols: ReadonlySet<ts.Symbol>,
): ts.ObjectLiteralExpression | null {
  if (!expression) return null;
  const resolved = unwrapStableExpression(expression, checker, reassignedSymbols);
  return ts.isObjectLiteralExpression(resolved) ? resolved : null;
}

type GenericNetworkCall = {
  target: ts.Expression | null;
  method: string | null;
};

function genericNetworkCall(
  call: ts.CallExpression,
  chain: string[] | null,
  checker: ts.TypeChecker,
  reassignedSymbols: ReadonlySet<ts.Symbol>,
): GenericNetworkCall | null {
  if (!chain || chain.length === 0) return null;
  const normalized = chain.map((part) => part.toLowerCase());
  const root = normalized[0];
  const terminal = normalized[normalized.length - 1];
  const isFetch = terminal === 'fetch' || normalized.includes('fetch');
  const isKnownClient =
    isFetch ||
    ['axios', 'got', 'ky', 'undici', 'http', 'https'].includes(root);
  if (!isKnownClient) return null;

  const memberMethod = GENERIC_NETWORK_METHOD_MEMBERS.get(terminal);
  let target: ts.Expression | null = call.arguments[0] ?? null;
  let options = call.arguments[1];
  const firstObject = stableObjectLiteral(
    call.arguments[0],
    checker,
    reassignedSymbols,
  );
  if (!memberMethod && firstObject && !isFetch) {
    const url = exactObjectProperty(firstObject, 'url');
    target =
      url.state === 'value'
        ? ts.isShorthandPropertyAssignment(url.value)
          ? url.value.name
          : url.value
        : null;
    options = call.arguments[0];
  }

  const resolvedTarget = target
    ? unwrapStableExpression(target, checker, reassignedSymbols)
    : null;
  let requestOptions: ts.Expression | undefined;
  if (
    resolvedTarget &&
    ts.isNewExpression(resolvedTarget) &&
    ts.isIdentifier(resolvedTarget.expression) &&
    resolvedTarget.expression.text === 'Request'
  ) {
    target = resolvedTarget.arguments?.[0] ?? null;
    requestOptions = resolvedTarget.arguments?.[1];
  }

  if (memberMethod) return { target, method: memberMethod };
  const optionsObject = stableObjectLiteral(
    options ?? requestOptions,
    checker,
    reassignedSymbols,
  );
  if (!optionsObject) {
    return {
      target,
      method: options || requestOptions ? null : 'GET',
    };
  }
  const methodProperty = exactObjectProperty(optionsObject, 'method');
  if (methodProperty.state === 'absent') {
    return { target, method: 'GET' };
  }
  if (methodProperty.state === 'unknown') return { target, method: null };
  const methodValue = methodProperty.value;
  if (ts.isShorthandPropertyAssignment(methodValue)) {
    const symbol = checker.getShorthandAssignmentValueSymbol(methodValue);
    const declaration = symbol?.valueDeclaration;
    if (
      symbol &&
      declaration &&
      !reassignedSymbols.has(symbol) &&
      ts.isVariableDeclaration(declaration) &&
      declaration.initializer
    ) {
      const derived = staticStringPattern(
        declaration.initializer,
        checker,
        reassignedSymbols,
      );
      return {
        target,
        method: derived.complete ? derived.text.toUpperCase() : null,
      };
    }
    return { target, method: null };
  }
  const derived = staticStringPattern(
    methodValue,
    checker,
    reassignedSymbols,
  );
  return {
    target,
    method: derived.complete ? derived.text.toUpperCase() : null,
  };
}

function genericNetworkTargetRisk(
  target: ts.Expression | null,
  checker: ts.TypeChecker,
  reassignedSymbols: ReadonlySet<ts.Symbol>,
): 'sheets' | 'safe' | 'unknown' {
  if (!target) return 'unknown';
  const pattern = staticStringPattern(target, checker, reassignedSymbols);
  const lower = pattern.text.toLowerCase();
  if (
    lower.includes('sheets.googleapis.com') ||
    lower.includes('content-sheets.googleapis.com')
  ) {
    return 'sheets';
  }
  if (lower.startsWith('/') || lower.startsWith('./') || lower.startsWith('../')) {
    return 'safe';
  }
  const absolute = /^https?:\/\/([^/]+)/i.exec(lower);
  if (absolute) {
    return absolute[1].includes('*') ? 'unknown' : 'safe';
  }
  if (pattern.complete && !lower.includes('*')) {
    return 'safe';
  }
  return 'unknown';
}

function exportedIsolationProbe(sourceFile: ts.SourceFile): ts.FunctionDeclaration | null {
  const matches = sourceFile.statements.filter(
    (statement): statement is ts.FunctionDeclaration =>
      ts.isFunctionDeclaration(statement) &&
      statement.name?.text === P9_WRITE_ISOLATION_PROBE_EXPORT &&
      statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword) === true &&
      Boolean(statement.body) &&
      statement.parameters.length >= 1 &&
      ts.isIdentifier(statement.parameters[0].name),
  );
  return matches.length === 1 ? matches[0] : null;
}

function capabilityIsInsideProbe(
  node: ts.Node,
  probe: ts.FunctionDeclaration | null,
  checker: ts.TypeChecker,
  guardImportSymbol: ts.Symbol | null,
): boolean {
  if (!probe) return false;
  let current: ts.Node | undefined = node;
  while (current?.parent) {
    current = current.parent;
    if (current === probe) return true;
    if (ts.isFunctionLike(current)) {
      const call: ts.Node = current.parent;
      if (
        !(
          (ts.isArrowFunction(current) || ts.isFunctionExpression(current)) &&
          ts.isCallExpression(call) &&
          call.arguments[1] === current &&
          ts.isIdentifier(call.expression) &&
          sameSymbol(checker, call.expression, guardImportSymbol)
        )
      ) {
        return false;
      }
    }
  }
  return false;
}

function surfaceId(relativePath: string): string {
  return (
    BASELINE_WRITE_SURFACE_IDS.get(relativePath) ??
    `google-write-${createHash('sha256').update(relativePath).digest('hex').slice(0, 16)}`
  );
}

/**
 * Independently derives every runtime file with a Google Sheets mutator or a
 * write-capable Sheets/Drive OAuth scope. The structural guard result is
 * computed from the AST; receipt producers cannot supply it.
 */
export function deriveP9WriteSurfaceInventory(
  repositoryRoot: string,
): P9WriteSurfaceInventory {
  if (!fs.existsSync(path.join(repositoryRoot, P9_WRITE_GUARD_MODULE_PATH))) {
    throw new Error(`Missing required P9 write guard module: ${P9_WRITE_GUARD_MODULE_PATH}`);
  }
  const relativeFiles = runtimeSourceFiles(repositoryRoot);
  const absoluteFiles = relativeFiles.map((item) => path.join(repositoryRoot, item));
  const program = ts.createProgram(absoluteFiles, {
    allowJs: true,
    checkJs: false,
    noEmit: true,
    noResolve: true,
    skipLibCheck: true,
    target: ts.ScriptTarget.Latest,
  });
  const checker = program.getTypeChecker();
  const inventory: P9WriteSurfaceInventory = [];
  for (const relativePath of relativeFiles) {
    const absolutePath = path.join(repositoryRoot, relativePath);
    const sourceFile = program.getSourceFile(absolutePath);
    if (!sourceFile) throw new Error(`Cannot parse runtime source file: ${relativePath}`);
    const mutators = new Set<string>();
    const aliases = buildAliasChains(sourceFile, checker);
    const reassignedSymbols = collectAssignedSymbols(sourceFile, checker);
    const probe = exportedIsolationProbe(sourceFile);
    const probeParameter = probe && ts.isIdentifier(probe.parameters[0].name)
      ? probe.parameters[0].name
      : null;
    const probeTargetKey = probeParameter
      ? directSpreadsheetIdKey(
          probeParameter,
          checker,
          repositoryRoot,
          reassignedSymbols,
        )
      : null;
    let clientConstructions = 0;
    let guardedClientConstructions = 0;
    let mutatorCalls = 0;
    let capabilityOccurrences = 0;
    let allCapabilitiesInsideProbe = true;
    let allCapabilitiesUseExactGuard = true;
    const guardTargetKeys: Array<string | null> = [];
    const mutatorTargetKeys: Array<string | null> = [];
    const guardImportSymbols: ts.Symbol[] = [];
    const findGuardImport = (node: ts.Node): void => {
      if (
        ts.isImportDeclaration(node) &&
        ts.isStringLiteral(node.moduleSpecifier) &&
        node.importClause?.namedBindings &&
        ts.isNamedImports(node.importClause.namedBindings) &&
        node.importClause.namedBindings.elements.some(
          (element) =>
            element.name.text === P9_WRITE_GUARD_NAME &&
            (element.propertyName?.text ?? element.name.text) === P9_WRITE_GUARD_NAME,
        )
      ) {
        const specifier = node.moduleSpecifier.text;
        const specifierWithExtension = /\.[cm]?[jt]sx?$/.test(specifier)
          ? specifier
          : `${specifier}.ts`;
        const importedPath = specifier.startsWith('@/')
          ? `web/src/${specifierWithExtension.slice(2)}`
          : path
              .relative(
                repositoryRoot,
                path.resolve(
                  path.dirname(path.join(repositoryRoot, relativePath)),
                  specifierWithExtension,
                ),
              )
              .split(path.sep)
              .join('/');
        if (importedPath === P9_WRITE_GUARD_MODULE_PATH) {
          const element = node.importClause.namedBindings.elements.find(
            (item) =>
              item.name.text === P9_WRITE_GUARD_NAME &&
              (item.propertyName?.text ?? item.name.text) === P9_WRITE_GUARD_NAME,
          );
          const symbol = element ? symbolAt(checker, element.name) : null;
          if (symbol) guardImportSymbols.push(symbol);
        }
      }
      ts.forEachChild(node, findGuardImport);
    };
    findGuardImport(sourceFile);
    const guardImportSymbol = guardImportSymbols.length === 1
      ? guardImportSymbols[0]
      : null;

    const recordGuard = (node: ts.Node): string | null => {
      capabilityOccurrences += 1;
      if (!capabilityIsInsideProbe(node, probe, checker, guardImportSymbol)) {
        allCapabilitiesInsideProbe = false;
      }
      const guardCall = enclosingGuardCall(node, checker, guardImportSymbol);
      const guardTarget = guardCall?.arguments[0]
        ? directSpreadsheetIdKey(
            guardCall.arguments[0],
            checker,
            repositoryRoot,
            reassignedSymbols,
          )
        : null;
      guardTargetKeys.push(guardTarget);
      if (!guardCall || !guardTarget || guardTarget !== probeTargetKey) {
        allCapabilitiesUseExactGuard = false;
      }
      return guardTarget;
    };

    const visit = (node: ts.Node): void => {
      if (
        (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) &&
        WRITE_CAPABLE_GOOGLE_SCOPES.has(node.text)
      ) {
        mutators.add(`scope:${node.text}`);
        recordGuard(node);
      }
      if (ts.isCallExpression(node)) {
        const resolvedChain = expressionChain(node.expression, checker, aliases);
        const chain = resolvedChain?.join('.') ?? propertyAccessChain(node.expression);
        const networkCall = genericNetworkCall(
          node,
          resolvedChain ?? (chain ? chain.split('.') : null),
          checker,
          reassignedSymbols,
        );
        if (
          networkCall &&
          networkCall.method !== 'GET' &&
          networkCall.method !== 'HEAD'
        ) {
          const targetRisk = genericNetworkTargetRisk(
            networkCall.target,
            checker,
            reassignedSymbols,
          );
          if (targetRisk !== 'safe') {
            mutators.add(
              targetRisk === 'sheets'
                ? 'raw-rest-google-sheets-write'
                : 'generic-network-write-unknown-target',
            );
            mutatorCalls += 1;
            mutatorTargetKeys.push(null);
            recordGuard(node);
            allCapabilitiesUseExactGuard = false;
          }
        }
        if (chain) {
          const mutator = googleSheetsMutator(chain);
          if (mutator) {
            mutators.add(mutator);
            mutatorCalls += 1;
            const guardTarget = recordGuard(node);
            const target = directMutatorTargetKey(
              mutator,
              node,
              checker,
              repositoryRoot,
              reassignedSymbols,
            );
            mutatorTargetKeys.push(
              target,
            );
            if (!guardTarget || !target || guardTarget !== target) {
              allCapabilitiesUseExactGuard = false;
            }
          }
          if (chain === 'google.sheets' || chain.endsWith('.google.sheets')) {
            clientConstructions += 1;
            const guardTarget = recordGuard(node);
            if (guardTarget && guardTarget === probeTargetKey) {
              guardedClientConstructions += 1;
            }
          }
        }
      }
      if (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) {
        const isNestedAccess =
          (ts.isPropertyAccessExpression(node.parent) ||
            ts.isElementAccessExpression(node.parent)) &&
          node.parent.expression === node;
        const resolvedChain = expressionChain(node, checker, aliases)?.join('.') ??
          propertyAccessChain(node);
        const mutator = googleSheetsMutator(resolvedChain);
        const isDirectCall =
          ts.isCallExpression(node.parent) && node.parent.expression === node;
        if (mutator && !isDirectCall && !isNestedAccess) {
          mutators.add(mutator);
          mutatorCalls += 1;
          mutatorTargetKeys.push(null);
          recordGuard(node);
          allCapabilitiesUseExactGuard = false;
        }
        if (
          ts.isElementAccessExpression(node) &&
          node.argumentExpression &&
          !ts.isStringLiteral(node.argumentExpression) &&
          !ts.isNoSubstitutionTemplateLiteral(node.argumentExpression)
        ) {
          const base = expressionChain(node.expression, checker, aliases)?.join('.') ?? '';
          if (base.split('.').includes('spreadsheets')) {
            mutators.add('dynamic-google-sheets-member');
            mutatorCalls += 1;
            mutatorTargetKeys.push(null);
            recordGuard(node);
            allCapabilitiesUseExactGuard = false;
          }
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(sourceFile);
    if (mutators.size === 0) continue;
    const distinctGuardTargets = new Set(guardTargetKeys.filter((item) => item !== null));
    const distinctMutatorTargets = new Set(
      mutatorTargetKeys.filter((item) => item !== null),
    );
    const exactTargetBinding =
      mutatorCalls > 0 &&
      mutatorTargetKeys.length === mutatorCalls &&
      mutatorTargetKeys.every((item) => item !== null) &&
      guardTargetKeys.length === capabilityOccurrences &&
      capabilityOccurrences >= clientConstructions + mutatorCalls &&
      guardTargetKeys.every((item) => item !== null) &&
      distinctGuardTargets.size === 1 &&
      distinctMutatorTargets.size === 1 &&
      [...distinctGuardTargets][0] === [...distinctMutatorTargets][0] &&
      [...distinctGuardTargets][0] === probeTargetKey;
    inventory.push({
      id: surfaceId(relativePath),
      path: relativePath,
      mutators: [...mutators].sort(),
      independentlyDerived: true,
      probeExport: P9_WRITE_ISOLATION_PROBE_EXPORT,
      googleSheetsClientConstructions: clientConstructions,
      guardedGoogleSheetsClientConstructions: guardedClientConstructions,
      googleSheetsMutatorCalls: mutatorCalls,
      guardedBeforeClientConstruction:
        guardImportSymbol !== null &&
        probe !== null &&
        probeTargetKey !== null &&
        allCapabilitiesInsideProbe &&
        allCapabilitiesUseExactGuard &&
        mutatorCalls > 0 &&
        clientConstructions > 0 &&
        clientConstructions === guardedClientConstructions &&
        exactTargetBinding,
    });
  }
  return inventory.sort(
    (left, right) => left.path.localeCompare(right.path) || left.id.localeCompare(right.id),
  );
}

const sha40 = z.string().regex(/^[0-9a-f]{40}$/);
const sha256 = z.string().regex(/^[0-9a-f]{64}$/);
const providerId = z.string().regex(/^[A-Za-z0-9_-]{3,128}$/);
const deploymentId = z.string().regex(/^dpl_[A-Za-z0-9]+$/);
const hostname = z.string().regex(/^(?=.{1,253}$)[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/);
const nonce = z.string().regex(/^[A-Za-z0-9_-]{32,128}$/);

function isCanonicalUtcTimestamp(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)) {
    return false;
  }
  const millis = Date.parse(value);
  if (!Number.isFinite(millis)) return false;
  const normalized = new Date(millis).toISOString();
  return value === normalized || value === normalized.replace('.000Z', 'Z');
}

const utcTimestamp = z.string().refine(isCanonicalUtcTimestamp);

const captureSchema = z.strictObject({
  repository: z.literal(P9_EVIDENCE_REPOSITORY),
  workflowPath: z.literal(P9_TRUSTED_WORKFLOW_PATH),
  workflowCommit: sha40,
  runId: z.number().int().positive(),
  runAttempt: z.number().int().positive(),
  jobName: z.enum([
    'entry',
    'cutover-proof',
    'rollback-proof',
    'restored-cutover-proof',
    'finalize',
  ]),
  event: z.literal('workflow_dispatch'),
  environment: z.literal(P9_EVIDENCE_ENVIRONMENT),
  headSha: sha40,
  startedAt: utcTimestamp,
  completedAt: utcTimestamp,
});

const tabSchema = z.strictObject({
  sheetId: z.number().int().positive(),
  title: z.string().min(1),
  rowCount: z.number().int().positive(),
  columnCount: z.number().int().positive(),
  boundedRange: z.string().min(1),
  backupSpreadsheetId: z.string().min(1),
  historicalSourceAndBackupSha256: sha256,
  canonicalCellPayloadHashAlgorithm: z.literal(
    'google-sheets-v4-griddata-canonical-json-v1',
  ),
  sourceCanonicalCellPayloadSha256: sha256,
  backupCanonicalCellPayloadSha256: sha256,
});

const applicationReadChallengeTabSchemas =
  P9_AUTHORIZED_PRODUCTION_TABS.map((tab) =>
    z.strictObject({
      sheetId: z.literal(tab.sheetId),
      title: z.literal(tab.title),
      rowCount: z.literal(tab.rowCount),
      columnCount: z.literal(tab.columnCount),
      boundedRange: z.literal(tab.boundedRange),
      nonceBoundCanonicalGridDataSha256: sha256,
    }),
  );

const applicationReadChallengeSchema = z.strictObject({
  domain: z.literal(P9_APPLICATION_READ_CHALLENGE_DOMAIN),
  nonce,
  hashAlgorithm: z.literal(P9_APPLICATION_READ_CHALLENGE_HASH_ALGORITHM),
  tabs: z.tuple([
    applicationReadChallengeTabSchemas[0],
    applicationReadChallengeTabSchemas[1],
  ]),
});

const driveOperationSchema = z.strictObject({
  service: z.literal('drive'),
  method: z.literal('files.get+permissions.list+revisions.list'),
  fields: z.literal(
    'file(id,name,mimeType,modifiedTime,version,capabilities,permissions);latestRevision(id,modifiedTime)',
  ),
});

const sheetsOperationSchema = z.strictObject({
  service: z.literal('sheets'),
  method: z.literal('spreadsheets.get'),
  spreadsheetId: z.literal(P9_PRODUCTION_SPREADSHEET_ID),
  ranges: z.tuple([
    z.literal(P9_AUTHORIZED_PRODUCTION_TABS[0].boundedRange),
    z.literal(P9_AUTHORIZED_PRODUCTION_TABS[1].boundedRange),
  ]),
  includeGridData: z.literal(true),
});

const backupSheetsOperationSchema = z.strictObject({
  service: z.literal('sheets'),
  method: z.literal('spreadsheets.get'),
  spreadsheetIds: z.tuple([
    z.literal(P9_VERIFIED_BACKUPS[0].backupSpreadsheetId),
    z.literal(P9_VERIFIED_BACKUPS[1].backupSpreadsheetId),
  ]),
  ranges: z.tuple([
    z.literal(P9_AUTHORIZED_PRODUCTION_TABS[0].boundedRange),
    z.literal(P9_AUTHORIZED_PRODUCTION_TABS[1].boundedRange),
  ]),
  includeGridData: z.literal(true),
});

const sourceObservationSchema = z.strictObject({
  observationId: sha256,
  startedAt: utcTimestamp,
  completedAt: utcTimestamp,
  spreadsheetId: z.literal(P9_PRODUCTION_SPREADSHEET_ID),
  revisionBefore: z.literal('9857'),
  revisionAfter: z.literal('9857'),
  sharingBeforeSha256: sha256,
  sharingAfterSha256: sha256,
  runtimePrincipalPermission: z.strictObject({
    permissionIdSha256: sha256,
    type: z.literal('user'),
    role: z.literal('reader'),
    direct: z.literal(true),
    expirationTime: z.null(),
  }),
  backupReadPrincipalFingerprintSha256: sha256,
  operations: z.tuple([
    driveOperationSchema,
    sheetsOperationSchema,
    backupSheetsOperationSchema,
  ]),
  tabs: z.tuple([tabSchema, tabSchema]),
  applicationReadChallenge: applicationReadChallengeSchema.nullable(),
});

const runtimeIdentitySchema = z.strictObject({
  accessMethod: z.literal('vercel-production-environment-api-bounded-read'),
  credentialSource: z.literal(
    'authenticated-vercel-project-production-environment',
  ),
  credentialKey: z.literal('GOOGLE_SERVICE_ACCOUNT_CREDENTIALS'),
  environmentVariableIdSha256: sha256,
  environmentVariableUpdatedAt: utcTimestamp,
  principalFingerprintSha256: sha256,
  runtimeOAuthScopes: z.tuple([z.literal(P9_READ_ONLY_OAUTH_SCOPE)]),
  evidenceOAuthScopes: z.tuple([
    z.literal(P9_DRIVE_METADATA_SCOPE),
    z.literal(P9_READ_ONLY_OAUTH_SCOPE),
  ]),
});

export const P9EntryReceiptSchema = z.strictObject({
  schemaVersion: z.literal(2),
  stageId: z.literal('P9'),
  receiptType: z.literal('entry'),
  p9BaselineCommit: sha40,
  revision7AttestationCommit: sha40,
  capture: captureSchema,
  baselineProductionDeployment: z.strictObject({
    observationId: sha256,
    deploymentId,
    urlHost: hostname,
    target: z.literal('production'),
    readyState: z.literal('READY'),
    createdAt: utcTimestamp,
    readyAt: utcTimestamp,
    projectIdSha256: sha256,
    teamIdSha256: sha256,
    gitSource: z.strictObject({
      type: z.literal('github'),
      repositoryId: z.number().int().positive(),
      ref: z.literal('main'),
      sha: sha40,
    }),
  }),
  productionSpreadsheetId: z.literal(P9_PRODUCTION_SPREADSHEET_ID),
  runtimeIdentity: runtimeIdentitySchema,
  sourceObservation: sourceObservationSchema,
});

const productionReadConfigSchema = z.strictObject({
  spreadsheetId: z.literal(P9_PRODUCTION_SPREADSHEET_ID),
  oauthScopes: z.tuple([z.literal(P9_READ_ONLY_OAUTH_SCOPE)]),
  tabs: z.tuple([
    z.strictObject({
      sheetId: z.literal(P9_AUTHORIZED_PRODUCTION_TABS[0].sheetId),
      boundedRange: z.literal(P9_AUTHORIZED_PRODUCTION_TABS[0].boundedRange),
    }),
    z.strictObject({
      sheetId: z.literal(P9_AUTHORIZED_PRODUCTION_TABS[1].sheetId),
      boundedRange: z.literal(P9_AUTHORIZED_PRODUCTION_TABS[1].boundedRange),
    }),
  ]),
});

const staticCatalogSchema = z.strictObject({
  path: z.literal('web/fixtures/p7/student-catalog.json'),
  sha256,
});

const writePolicySchema = z.strictObject({
  spreadsheetId: z.literal(P9_TESTING_SPREADSHEET_ID),
  blockedSpreadsheetIds: z.tuple([z.literal(P9_PRODUCTION_SPREADSHEET_ID)]),
  productionWritesDisabled: z.literal(true),
  writerEnabled: z.boolean(),
  surfaces: z.array(z.string().min(1)).min(P9_REQUIRED_WRITE_SURFACES.length),
});

const runtimeConfigSchema = z.strictObject({
  schemaVersion: z.literal(1),
  sourceMode: z.enum([
    'production-google-sheet-read-only',
    'accepted-p7-static-catalog',
  ]),
  productionRead: productionReadConfigSchema.nullable(),
  staticCatalog: staticCatalogSchema.nullable(),
  writePolicy: writePolicySchema,
  mappingVersion: z.string().min(1),
  runtimeIdentityFingerprintSha256: sha256,
});

const applicationReadRuntimeBindingSchema = z.strictObject({
  schemaVersion: z.literal(1),
  runtimeCommit: sha40,
  loader: z.strictObject({
    path: z.literal(P9_PRODUCTION_SOURCE_LOADER_PATH),
    exportName: z.literal(P9_PRODUCTION_SOURCE_LOADER_EXPORT),
    fileSha256: sha256,
    directNamedExport: z.literal(true),
    internalSourceMode: z.literal(true),
    exactRuntimeCredentialSource: z.literal(true),
    exactBoundedCredentialParser: z.literal(true),
    exactSheetsV4Client: z.literal(true),
    soleReadonlyScope: z.literal(true),
    exactProductionSpreadsheetId: z.literal(true),
    exactOrderedRanges: z.literal(true),
    includeGridData: z.literal(true),
    boundedFields: z.literal(true),
    rollbackBeforeGoogleConstruction: z.literal(true),
    nonceChallengeDirectDataflow: z.literal(true),
    scholarshipsDirectResponseDataflow: z.literal(true),
    directRuntimeBindingFlow: z.literal(true),
  }),
  healthRoute: z.strictObject({
    path: z.literal(P9_HEALTH_ROUTE_PATH),
    fileSha256: sha256,
    directNamedImport: z.literal(true),
    directAwait: z.literal(true),
    validatedNonceDirectArgument: z.literal(true),
    directProbeResultFlow: z.literal(true),
    directRuntimeBindingFlow: z.literal(true),
  }),
  publicRoute: z.strictObject({
    path: z.literal(P9_PUBLIC_ROUTE_PATH),
    fileSha256: sha256,
    directNamedImport: z.literal(true),
    directAwait: z.literal(true),
    directScholarshipsResultFlow: z.literal(true),
  }),
  bindingSha256: sha256,
});

const applicationReadProbeSchema = z.strictObject({
  observationId: sha256,
  domain: z.literal(P9_APPLICATION_READ_CHALLENGE_DOMAIN),
  challengeHashAlgorithm: z.literal(
    P9_APPLICATION_READ_CHALLENGE_HASH_ALGORITHM,
  ),
  nonce,
  startedAt: utcTimestamp,
  completedAt: utcTimestamp,
  spreadsheetId: z.literal(P9_PRODUCTION_SPREADSHEET_ID),
  oauthScopes: z.tuple([z.literal(P9_READ_ONLY_OAUTH_SCOPE)]),
  tabs: z.tuple([
    applicationReadChallengeTabSchemas[0],
    applicationReadChallengeTabSchemas[1],
  ]),
  runtimeBinding: applicationReadRuntimeBindingSchema,
});

const healthSchema = z.strictObject({
  observedAt: utcTimestamp,
  statusCode: z.literal(200),
  contentType: z.literal('application/json'),
  nonce,
  commit: sha40,
  deploymentId,
  environment: z.literal('production'),
  runtimeConfig: runtimeConfigSchema,
  runtimeConfigSha256: sha256,
  applicationRuntimeBinding: applicationReadRuntimeBindingSchema,
  applicationReadProbe: applicationReadProbeSchema.nullable(),
});

const gitSourceSchema = z.strictObject({
  type: z.literal('github'),
  repositoryId: z.number().int().positive(),
  ref: z.string().min(1),
  sha: sha40,
});

const deploymentObservationSchema = z.strictObject({
  role: z.enum(['cutover', 'rollback', 'restored-cutover']),
  observationId: sha256,
  deploymentId,
  urlHost: hostname,
  target: z.literal('production'),
  readyState: z.literal('READY'),
  createdAt: utcTimestamp,
  readyAt: utcTimestamp,
  capture: captureSchema,
  gitSource: gitSourceSchema,
  health: healthSchema,
});

export const P9DeploymentRecordSchema = z.strictObject({
  schemaVersion: z.literal(2),
  stageId: z.literal('P9'),
  receiptType: z.literal('deployment'),
  p9BaselineCommit: sha40,
  runtimeCommit: sha40,
  revision7AttestationCommit: sha40,
  capture: captureSchema,
  provider: z.strictObject({
    name: z.literal('vercel'),
    apiVersion: z.literal('v13'),
    projectIdSha256: sha256,
    teamIdSha256: sha256,
  }),
  deployments: z.strictObject({
    cutover: deploymentObservationSchema,
    rollback: deploymentObservationSchema,
    restoredCutover: deploymentObservationSchema,
  }),
});

const phasedSourceObservationSchema = z.strictObject({
  phase: z.enum([
    'after-cutover-smoke',
    'after-rollback-proof',
    'after-restored-cutover',
  ]),
  deploymentId,
  observation: sourceObservationSchema,
});

const writeSurfaceResultSchema = z.strictObject({
  id: z.string().min(1),
  path: z.string().min(1),
  mutators: z.array(z.string().min(1)).min(1),
  independentlyDerived: z.literal(true),
  probeExport: z.literal(P9_WRITE_ISOLATION_PROBE_EXPORT),
  probeInvoked: z.literal(true),
  guardedBeforeClientConstruction: z.literal(true),
  negativeTestName: z.string().min(1),
  attemptedSpreadsheetId: z.literal(P9_PRODUCTION_SPREADSHEET_ID),
  outcome: z.literal('blocked-before-client-construction'),
  guardErrorCode: z.literal(P9_PRODUCTION_WRITE_BLOCKED_CODE),
  clientConstructions: z.literal(0),
  writeCalls: z.literal(0),
});

export const P9PostCutoverReceiptSchema = z.strictObject({
  schemaVersion: z.literal(2),
  stageId: z.literal('P9'),
  receiptType: z.literal('post-cutover'),
  p9BaselineCommit: sha40,
  runtimeCommit: sha40,
  revision7AttestationCommit: sha40,
  capture: captureSchema,
  deploymentObservationIds: z.strictObject({
    cutover: sha256,
    rollback: sha256,
    restoredCutover: sha256,
  }),
  sourceObservations: z.tuple([
    phasedSourceObservationSchema,
    phasedSourceObservationSchema,
    phasedSourceObservationSchema,
  ]),
  writeIsolation: z.strictObject({
    testedCommit: sha40,
    runtimeBinding: applicationReadRuntimeBindingSchema,
    runtimeStaticCatalogSha256: sha256,
    ciRunId: z.number().int().positive(),
    inventoryMethod: z.literal('typescript-ast-complete-google-mutator-inventory'),
    inventorySha256: sha256,
    discoveredSurfaceCount: z.number().int().positive(),
    testStartedAt: utcTimestamp,
    testCompletedAt: utcTimestamp,
    testCommand: z.literal(
      'node --import tsx scripts/p9-trusted-proof.ts --mode=write-isolation',
    ),
    testExitCode: z.literal(0),
    testOutputSha256: sha256,
    surfaces: z.array(writeSurfaceResultSchema).min(P9_REQUIRED_WRITE_SURFACES.length),
  }),
});

export type P9EntryReceipt = z.infer<typeof P9EntryReceiptSchema>;
export type P9DeploymentRecord = z.infer<typeof P9DeploymentRecordSchema>;
export type P9PostCutoverReceipt = z.infer<typeof P9PostCutoverReceiptSchema>;
export type P9SourceObservation = z.infer<typeof sourceObservationSchema>;
export type P9RuntimeConfig = z.infer<typeof runtimeConfigSchema>;
export type P9ApplicationReadChallenge = z.infer<
  typeof applicationReadChallengeSchema
>;
export type P9ApplicationReadRuntimeBinding = z.infer<
  typeof applicationReadRuntimeBindingSchema
>;

export type P9EvidenceContext = {
  p9BaselineCommit: string;
  p9BaselineCommittedAt: string;
  revision7AttestationCommit: string;
  revision7AttestationCommittedAt: string;
  revision7CandidateCommit: string;
  candidateCommit?: string;
  candidateCommittedAt?: string;
  runtimePrincipalFingerprintSha256: string;
  providerProjectFingerprintSha256: string;
  providerTeamFingerprintSha256: string;
  providerCanonicalProductionHostnameSha256: string;
  hostedVerificationEnvironmentFingerprintSha256: string;
  runtimeCredentialProvenanceFingerprintSha256: string;
  expectedStaticCatalogSha256: string;
  expectedWriteSurfaceInventory: P9WriteSurfaceInventory;
};

export type P9AttestationVerification = {
  verified: boolean;
  subjectPath: string;
  subjectSha256: string;
  repository: string;
  signerWorkflow: string;
  sourceDigest: string;
  denySelfHostedRunners: boolean;
};

export type P9GitBindingProbe = {
  objectExists: (commit: string) => boolean;
  isAncestor: (ancestor: string, descendant: string) => boolean;
  blobSha256: (commit: string, relativePath: string) => string | null;
  changedRuntimePaths: (runtimeCommit: string, candidateCommit: string) => string[];
  changedTrustedProofPaths: (
    revision7CandidateCommit: string,
    workflowCommit: string,
  ) => string[];
};

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, canonicalize(item)]),
    );
  }
  return value;
}

export function canonicalP9Json(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

export function sha256P9Value(value: unknown): string {
  return createHash('sha256').update(canonicalP9Json(value)).digest('hex');
}

export type P9ApplicationReadTabIdentity =
  (typeof P9_AUTHORIZED_PRODUCTION_TABS)[number];

function normalizeP9JsonCompatibleGridData(value: unknown): unknown[] {
  if (!Array.isArray(value)) {
    throw new Error('P9 application read challenge requires sheet.data array data');
  }
  const serialized = JSON.stringify(value);
  if (serialized === undefined) {
    throw new Error('P9 application read challenge GridData is not JSON-compatible');
  }
  const normalized = JSON.parse(serialized) as unknown;
  if (!Array.isArray(normalized)) {
    throw new Error('P9 application read challenge GridData normalization changed type');
  }
  return normalized;
}

export function p9ApplicationReadChallengeSha256(
  challengeNonce: string,
  tabIdentity: P9ApplicationReadTabIdentity,
  sheetData: unknown,
): string {
  if (!/^[A-Za-z0-9_-]{32,128}$/.test(challengeNonce)) {
    throw new Error('P9 application read challenge nonce is invalid');
  }
  const expectedTab = P9_AUTHORIZED_PRODUCTION_TABS.find(
    (tab) => tab.sheetId === tabIdentity.sheetId,
  );
  if (!expectedTab || canonicalP9Json(tabIdentity) !== canonicalP9Json(expectedTab)) {
    throw new Error('P9 application read challenge tab identity is not exact');
  }
  return sha256P9Value({
    domain: P9_APPLICATION_READ_CHALLENGE_DOMAIN,
    nonce: challengeNonce,
    spreadsheetId: P9_PRODUCTION_SPREADSHEET_ID,
    oauthScopes: [P9_READ_ONLY_OAUTH_SCOPE],
    tab: expectedTab,
    gridData: normalizeP9JsonCompatibleGridData(sheetData ?? []),
  });
}

export type P9ApplicationReadRuntimeSourceBytes = {
  loader: string;
  healthRoute: string;
  publicRoute: string;
};

export type P9ApplicationReadRuntimeBindingInput =
  | { runtimeCommit: string; repositoryRoot: string; sourceBytes?: never }
  | {
      runtimeCommit: string;
      repositoryRoot?: never;
      sourceBytes: P9ApplicationReadRuntimeSourceBytes;
    };

export function deriveP9ApplicationReadRuntimeBinding(
  input: P9ApplicationReadRuntimeBindingInput,
): P9ApplicationReadRuntimeBinding {
  if (!/^[0-9a-f]{40}$/.test(input.runtimeCommit)) {
    throw new Error('P9 application runtime binding rejected: wrong runtime commit');
  }
  const readRuntimeFile = (relativePath: string): string => {
    if (!('repositoryRoot' in input) || !input.repositoryRoot) {
      throw new Error('P9 application runtime binding rejected: missing runtime root');
    }
    const root = path.resolve(input.repositoryRoot);
    const absolute = path.resolve(root, relativePath);
    const fileState = fs.existsSync(absolute) ? fs.lstatSync(absolute) : null;
    if (
      !absolute.startsWith(`${root}${path.sep}`) ||
      !fileState ||
      fileState.isSymbolicLink() ||
      !fileState.isFile()
    ) {
      throw new Error(`P9 application runtime binding rejected: missing ${relativePath}`);
    }
    return fs.readFileSync(absolute, 'utf8');
  };
  const sourceBytes: P9ApplicationReadRuntimeSourceBytes =
    'sourceBytes' in input && input.sourceBytes
      ? input.sourceBytes
      : {
          loader: readRuntimeFile(P9_PRODUCTION_SOURCE_LOADER_PATH),
          healthRoute: readRuntimeFile(P9_HEALTH_ROUTE_PATH),
          publicRoute: readRuntimeFile(P9_PUBLIC_ROUTE_PATH),
        };
  if (
    Object.keys(sourceBytes).sort().join(',') !==
    'healthRoute,loader,publicRoute'
  ) {
    throw new Error('P9 application runtime binding rejected: source byte set differs');
  }
  validateP9ProductionLoaderSource(sourceBytes.loader);
  validateP9ApplicationRouteSource(sourceBytes.healthRoute, 'health');
  validateP9ApplicationRouteSource(sourceBytes.publicRoute, 'public');
  const content = {
    schemaVersion: 1 as const,
    runtimeCommit: input.runtimeCommit,
    loader: {
      path: P9_PRODUCTION_SOURCE_LOADER_PATH as typeof P9_PRODUCTION_SOURCE_LOADER_PATH,
      exportName:
        P9_PRODUCTION_SOURCE_LOADER_EXPORT as typeof P9_PRODUCTION_SOURCE_LOADER_EXPORT,
      fileSha256: sha256P9Text(sourceBytes.loader),
      directNamedExport: true as const,
      internalSourceMode: true as const,
      exactRuntimeCredentialSource: true as const,
      exactBoundedCredentialParser: true as const,
      exactSheetsV4Client: true as const,
      soleReadonlyScope: true as const,
      exactProductionSpreadsheetId: true as const,
      exactOrderedRanges: true as const,
      includeGridData: true as const,
      boundedFields: true as const,
      rollbackBeforeGoogleConstruction: true as const,
      nonceChallengeDirectDataflow: true as const,
      scholarshipsDirectResponseDataflow: true as const,
      directRuntimeBindingFlow: true as const,
    },
    healthRoute: {
      path: P9_HEALTH_ROUTE_PATH as typeof P9_HEALTH_ROUTE_PATH,
      fileSha256: sha256P9Text(sourceBytes.healthRoute),
      directNamedImport: true as const,
      directAwait: true as const,
      validatedNonceDirectArgument: true as const,
      directProbeResultFlow: true as const,
      directRuntimeBindingFlow: true as const,
    },
    publicRoute: {
      path: P9_PUBLIC_ROUTE_PATH as typeof P9_PUBLIC_ROUTE_PATH,
      fileSha256: sha256P9Text(sourceBytes.publicRoute),
      directNamedImport: true as const,
      directAwait: true as const,
      directScholarshipsResultFlow: true as const,
    },
  };
  return { ...content, bindingSha256: sha256P9Value(content) };
}

function bindingReject(message: string): never {
  throw new Error(`P9 application runtime binding rejected: ${message}`);
}

function bindingSourceFile(name: string, source: string): ts.SourceFile {
  const file = ts.createSourceFile(
    name,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const parseDiagnostics = (
    file as ts.SourceFile & { parseDiagnostics?: readonly ts.Diagnostic[] }
  ).parseDiagnostics;
  if (parseDiagnostics && parseDiagnostics.length > 0) {
    bindingReject(`${name} does not parse`);
  }
  return file;
}

function bindingWalk(node: ts.Node, visit: (node: ts.Node) => void): void {
  visit(node);
  ts.forEachChild(node, (child) => bindingWalk(child, visit));
}

function bindingDirectExport(
  file: ts.SourceFile,
  name: string,
): ts.FunctionDeclaration {
  const functions = file.statements.filter(
    (statement): statement is ts.FunctionDeclaration =>
      ts.isFunctionDeclaration(statement) &&
      statement.name?.text === name &&
      statement.modifiers?.some(
        (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
      ) === true &&
      statement.modifiers?.some(
        (modifier) => modifier.kind === ts.SyntaxKind.DefaultKeyword,
      ) !== true &&
      Boolean(statement.body),
  );
  if (
    functions.length !== 1 ||
    file.statements.some((statement) => ts.isExportDeclaration(statement))
  ) {
    bindingReject(`${file.fileName} lacks one direct named ${name} export`);
  }
  return functions[0];
}

function bindingPropertyName(property: ts.ObjectLiteralElementLike): string | null {
  if (
    !ts.isPropertyAssignment(property) ||
    ts.isComputedPropertyName(property.name) ||
    (!ts.isIdentifier(property.name) && !ts.isStringLiteral(property.name))
  ) {
    return null;
  }
  return property.name.text;
}

function bindingExactObject(
  expression: ts.Expression | undefined,
  keys: readonly string[],
  label: string,
): ts.ObjectLiteralExpression {
  if (!expression || !ts.isObjectLiteralExpression(expression)) {
    bindingReject(`${label} is not a direct object literal`);
  }
  const actual = expression.properties.map(bindingPropertyName);
  if (
    actual.some((key) => key === null) ||
    canonicalP9Json(actual) !== canonicalP9Json(keys)
  ) {
    bindingReject(`${label} keys, order, or direct assignments differ`);
  }
  return expression;
}

function bindingDirectProperty(
  object: ts.ObjectLiteralExpression,
  name: string,
): ts.Expression {
  const value = propertyValue(object, name);
  if (!value || ts.isShorthandPropertyAssignment(value)) {
    bindingReject(`${name} is not a direct property assignment`);
  }
  return value;
}

function bindingVariable(
  body: ts.Block,
  name: string,
): ts.VariableDeclaration {
  const declarations: ts.VariableDeclaration[] = [];
  let reassigned = false;
  bindingWalk(body, (node) => {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === name
    ) {
      declarations.push(node);
    }
    if (
      ts.isBinaryExpression(node) &&
      node.operatorToken.kind >= ts.SyntaxKind.FirstAssignment &&
      node.operatorToken.kind <= ts.SyntaxKind.LastAssignment &&
      ts.isIdentifier(node.left) &&
      node.left.text === name
    ) {
      reassigned = true;
    }
  });
  if (declarations.length !== 1 || !declarations[0].initializer || reassigned) {
    bindingReject(`${name} is missing, duplicated, reassigned, or uninitialized`);
  }
  return declarations[0];
}

function bindingDirectConst(
  body: ts.Block,
  name: string,
): ts.VariableDeclaration {
  const declaration = bindingVariable(body, name);
  const declarationList = declaration.parent;
  const statement = declarationList.parent;
  if (
    !ts.isVariableDeclarationList(declarationList) ||
    (declarationList.flags & ts.NodeFlags.Const) === 0 ||
    declarationList.declarations.length !== 1 ||
    !ts.isVariableStatement(statement) ||
    statement.parent !== body
  ) {
    bindingReject(`${name} is not one immutable direct handler/loader binding`);
  }
  return declaration;
}

function bindingPrinted(node: ts.Node, file: ts.SourceFile): string {
  return ts
    .createPrinter({ removeComments: true })
    .printNode(ts.EmitHint.Unspecified, node, file);
}

function bindingExactTab(
  expression: ts.Expression,
  tab: P9ApplicationReadTabIdentity,
  includeDigest: boolean,
  expectedDigest?: string,
): void {
  const keys = [
    'sheetId',
    'title',
    'rowCount',
    'columnCount',
    'boundedRange',
    ...(includeDigest ? ['nonceBoundCanonicalGridDataSha256'] : []),
  ];
  const object = bindingExactObject(expression, keys, `tab ${tab.sheetId}`);
  const expected: Array<[string, string | number]> = [
    ['sheetId', tab.sheetId],
    ['title', tab.title],
    ['rowCount', tab.rowCount],
    ['columnCount', tab.columnCount],
    ['boundedRange', tab.boundedRange],
  ];
  for (const [key, value] of expected) {
    const actual = bindingDirectProperty(object, key);
    if (
      (typeof value === 'number' &&
        (!ts.isNumericLiteral(actual) || Number(actual.text) !== value)) ||
      (typeof value === 'string' &&
        (!ts.isStringLiteral(actual) || actual.text !== value))
    ) {
      bindingReject(`tab ${tab.sheetId} ${key} differs`);
    }
  }
  if (includeDigest) {
    const digest = bindingDirectProperty(
      object,
      'nonceBoundCanonicalGridDataSha256',
    );
    if (!ts.isIdentifier(digest) || digest.text !== expectedDigest) {
      bindingReject(`tab ${tab.sheetId} returned digest is not directly derived`);
    }
  }
}

function bindingChallengeHelper(file: ts.SourceFile): void {
  const helper = file.statements.filter(
    (statement): statement is ts.FunctionDeclaration =>
      ts.isFunctionDeclaration(statement) &&
      statement.name?.text === 'p9ApplicationReadChallengeSha256' &&
      Boolean(statement.body),
  );
  if (helper.length !== 1 || helper[0].parameters.length !== 3) {
    bindingReject('challenge helper is missing, wrapped, or overloaded');
  }
  const names = helper[0].parameters.map((parameter) =>
    ts.isIdentifier(parameter.name) ? parameter.name.text : '',
  );
  const returns: ts.ReturnStatement[] = [];
  bindingWalk(helper[0].body!, (node) => {
    if (ts.isReturnStatement(node)) returns.push(node);
  });
  if (names.some((name) => !name) || returns.length !== 1 || !returns[0].expression) {
    bindingReject('challenge helper has alternate flow or non-direct parameters');
  }
  const digest = returns[0].expression;
  if (
    !ts.isCallExpression(digest) ||
    !ts.isPropertyAccessExpression(digest.expression) ||
    digest.expression.name.text !== 'digest' ||
    !ts.isStringLiteral(digest.arguments[0]) ||
    digest.arguments[0].text !== 'hex'
  ) {
    bindingReject('challenge helper does not directly return a hex digest');
  }
  const update = digest.expression.expression;
  if (
    !ts.isCallExpression(update) ||
    !ts.isPropertyAccessExpression(update.expression) ||
    update.expression.name.text !== 'update' ||
    update.arguments.length !== 1 ||
    !ts.isCallExpression(update.arguments[0]) ||
    !ts.isIdentifier(update.arguments[0].expression) ||
    update.arguments[0].expression.text !== 'canonicalJson'
  ) {
    bindingReject('challenge helper does not hash canonical JSON directly');
  }
  const create = update.expression.expression;
  if (
    !ts.isCallExpression(create) ||
    !ts.isIdentifier(create.expression) ||
    create.expression.text !== 'createHash' ||
    !ts.isStringLiteral(create.arguments[0]) ||
    create.arguments[0].text !== 'sha256'
  ) {
    bindingReject('challenge helper does not directly use SHA-256');
  }
  const envelope = bindingExactObject(
    update.arguments[0].arguments[0],
    ['domain', 'nonce', 'spreadsheetId', 'oauthScopes', 'tab', 'gridData'],
    'challenge envelope',
  );
  const domain = bindingDirectProperty(envelope, 'domain');
  const spreadsheetId = bindingDirectProperty(envelope, 'spreadsheetId');
  const scopes = bindingDirectProperty(envelope, 'oauthScopes');
  if (
    !ts.isStringLiteral(domain) ||
    domain.text !== P9_APPLICATION_READ_CHALLENGE_DOMAIN ||
    !ts.isStringLiteral(spreadsheetId) ||
    spreadsheetId.text !== P9_PRODUCTION_SPREADSHEET_ID ||
    !ts.isArrayLiteralExpression(scopes) ||
    scopes.elements.length !== 1 ||
    !ts.isStringLiteral(scopes.elements[0]) ||
    scopes.elements[0].text !== P9_READ_ONLY_OAUTH_SCOPE
  ) {
    bindingReject('challenge envelope authority fields differ');
  }
  for (const [key, index] of [
    ['nonce', 0],
    ['tab', 1],
    ['gridData', 2],
  ] as const) {
    const value = bindingDirectProperty(envelope, key);
    if (!ts.isIdentifier(value) || value.text !== names[index]) {
      bindingReject(`challenge ${key} is not its immutable direct input`);
    }
  }
  const canonicalFunctions = file.statements.filter(
    (statement): statement is ts.FunctionDeclaration =>
      ts.isFunctionDeclaration(statement) &&
      ['canonicalize', 'canonicalJson'].includes(statement.name?.text ?? '') &&
      Boolean(statement.body),
  );
  const expectedCanonicalFile = bindingSourceFile(
    'expected-p9-canonicalizer.ts',
    [
      'function canonicalize(value: unknown): unknown {',
      '  if (Array.isArray(value)) return value.map(canonicalize);',
      "  if (value && typeof value === 'object') {",
      '    return Object.fromEntries(',
      '      Object.entries(value as Record<string, unknown>)',
      '        .sort(([left], [right]) => left.localeCompare(right))',
      '        .map(([key, item]) => [key, canonicalize(item)]),',
      '    );',
      '  }',
      '  return value;',
      '}',
      'function canonicalJson(value: unknown): string {',
      '  const serialized = JSON.stringify(value);',
      "  if (serialized === undefined) throw new Error('non-json');",
      '  return JSON.stringify(canonicalize(JSON.parse(serialized)));',
      '}',
    ].join('\n'),
  );
  const expectedFunctions = expectedCanonicalFile.statements.filter(
    (statement): statement is ts.FunctionDeclaration =>
      ts.isFunctionDeclaration(statement),
  );
  const printer = ts.createPrinter({ removeComments: true });
  const printed = (node: ts.Node, sourceFile: ts.SourceFile) =>
    printer.printNode(ts.EmitHint.Unspecified, node, sourceFile);
  if (
    canonicalFunctions.length !== 2 ||
    expectedFunctions.some((expected) => {
      const actual = canonicalFunctions.find(
        (candidate) => candidate.name?.text === expected.name?.text,
      );
      return !actual || printed(actual, file) !== printed(expected, expectedCanonicalFile);
    })
  ) {
    bindingReject(
      'canonicalJson is not the exact JSON-normalizing recursively key-sorted implementation',
    );
  }
}

function bindingExactCredentialParser(file: ts.SourceFile): void {
  const expected = bindingSourceFile(
    'expected-p9-credential-parser.ts',
    [
      'const MAX_CREDENTIAL_PAYLOAD_BYTES = 64 * 1024;',
      'function jsonObjectOrNull(value: string): Record<string, unknown> | null {',
      '  try {',
      '    const parsed: unknown = JSON.parse(value);',
      "    return parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)",
      '      ? (parsed as Record<string, unknown>)',
      '      : null;',
      '  } catch {',
      '    return null;',
      '  }',
      '}',
      'function canonicalBase64JsonObjectOrNull(',
      '  value: string,',
      '): Record<string, unknown> | null {',
      '  if (',
      '    value !== value.trim() ||',
      '    !/^[A-Za-z0-9+/]+={0,2}$/.test(value) ||',
      '    value.length % 4 !== 0 ||',
      "    value.slice(0, -2).includes('=')",
      '  ) {',
      '    return null;',
      '  }',
      "  const decoded = Buffer.from(value, 'base64');",
      '  if (',
      '    decoded.length < 1 ||',
      '    decoded.length > MAX_CREDENTIAL_PAYLOAD_BYTES ||',
      "    decoded.toString('base64') !== value",
      '  ) {',
      '    return null;',
      '  }',
      "  const decodedText = decoded.toString('utf8');",
      "  if (!Buffer.from(decodedText, 'utf8').equals(decoded)) return null;",
      '  return jsonObjectOrNull(decodedText);',
      '}',
      'function parseServiceAccountCredentials(',
      '  value: unknown,',
      '): Record<string, unknown> {',
      '  if (',
      "    typeof value !== 'string' ||",
      "    Buffer.byteLength(value, 'utf8') < 1 ||",
      "    Buffer.byteLength(value, 'utf8') > MAX_CREDENTIAL_PAYLOAD_BYTES ||",
      '    value.trim().length === 0',
      '  ) {',
      "    throw new Error('invalid credentials');",
      '  }',
      '  const raw = jsonObjectOrNull(value);',
      '  const base64 = canonicalBase64JsonObjectOrNull(value);',
      '  if ((raw === null) === (base64 === null)) {',
      "    throw new Error('invalid credentials');",
      '  }',
      '  return (raw ?? base64) as Record<string, unknown>;',
      '}',
    ].join('\n'),
  );
  const expectedNames = new Set([
    'jsonObjectOrNull',
    'canonicalBase64JsonObjectOrNull',
    'parseServiceAccountCredentials',
  ]);
  const actualFunctions = file.statements.filter(
    (statement): statement is ts.FunctionDeclaration =>
      ts.isFunctionDeclaration(statement) &&
      expectedNames.has(statement.name?.text ?? ''),
  );
  const expectedFunctions = expected.statements.filter(
    (statement): statement is ts.FunctionDeclaration =>
      ts.isFunctionDeclaration(statement),
  );
  const actualConstants = file.statements.filter(
    (statement): statement is ts.VariableStatement =>
      ts.isVariableStatement(statement) &&
      statement.declarationList.declarations.some(
        (declaration) =>
          ts.isIdentifier(declaration.name) &&
          declaration.name.text === 'MAX_CREDENTIAL_PAYLOAD_BYTES',
      ),
  );
  const expectedConstant = expected.statements.find(ts.isVariableStatement)!;
  const printer = ts.createPrinter({ removeComments: true });
  const printed = (node: ts.Node, sourceFile: ts.SourceFile) =>
    printer.printNode(ts.EmitHint.Unspecified, node, sourceFile);
  if (
    actualConstants.length !== 1 ||
    printed(actualConstants[0], file) !== printed(expectedConstant, expected) ||
    actualFunctions.length !== expectedFunctions.length ||
    expectedFunctions.some((expectedFunction) => {
      const actual = actualFunctions.find(
        (candidate) => candidate.name?.text === expectedFunction.name?.text,
      );
      return (
        !actual ||
        printed(actual, file) !== printed(expectedFunction, expected)
      );
    })
  ) {
    bindingReject(
      'credential parser is not the exact bounded raw-or-canonical-padded-base64 JSON-object parser',
    );
  }
}

function validateP9ProductionLoaderSource(source: string): void {
  const file = bindingSourceFile(P9_PRODUCTION_SOURCE_LOADER_PATH, source);
  const loader = bindingDirectExport(file, P9_PRODUCTION_SOURCE_LOADER_EXPORT);
  if (
    loader.parameters.length !== 1 ||
    !ts.isIdentifier(loader.parameters[0].name)
  ) {
    bindingReject('loader must have one direct nonce-or-null parameter');
  }
  const nonceName = loader.parameters[0].name.text;
  const sourceModeVariable = bindingVariable(loader.body!, 'sourceMode');
  const sourceMode = sourceModeVariable.initializer!;
  if (
    !ts.isPropertyAccessExpression(sourceMode) ||
    propertyAccessChain(sourceMode) !== 'process.env.P9_SOURCE_MODE'
  ) {
    bindingReject('loader sourceMode is not the one exact runtime environment path');
  }
  const sourceModeName = 'sourceMode';
  let dynamicImport = false;
  bindingWalk(file, (node) => {
    if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
      dynamicImport = true;
    }
  });
  if (dynamicImport) bindingReject('loader uses dynamic import');
  const cryptoImports = file.statements.filter(
    (statement): statement is ts.ImportDeclaration =>
      ts.isImportDeclaration(statement) &&
      ts.isStringLiteral(statement.moduleSpecifier) &&
      statement.moduleSpecifier.text === 'node:crypto',
  );
  const cryptoBindings = cryptoImports[0]?.importClause?.namedBindings;
  if (
    cryptoImports.length !== 1 ||
    !cryptoBindings ||
    !ts.isNamedImports(cryptoBindings) ||
    cryptoBindings.elements.length !== 1 ||
    cryptoBindings.elements[0].propertyName ||
    cryptoBindings.elements[0].name.text !== 'createHash'
  ) {
    bindingReject('loader SHA-256 import is not exact named/no-alias');
  }
  const googleImports = file.statements.filter(
    (statement): statement is ts.ImportDeclaration =>
      ts.isImportDeclaration(statement) &&
      ts.isStringLiteral(statement.moduleSpecifier) &&
      statement.moduleSpecifier.text === 'googleapis',
  );
  const googleBindings = googleImports[0]?.importClause?.namedBindings;
  if (
    googleImports.length !== 1 ||
    !googleBindings ||
    !ts.isNamedImports(googleBindings) ||
    googleBindings.elements.length !== 1 ||
    googleBindings.elements[0].propertyName ||
    googleBindings.elements[0].name.text !== 'google'
  ) {
    bindingReject('loader google import is not exact named/no-alias');
  }
  const bindingImports = file.statements.filter(
    (statement): statement is ts.ImportDeclaration =>
      ts.isImportDeclaration(statement) &&
      ts.isStringLiteral(statement.moduleSpecifier) &&
      statement.moduleSpecifier.text ===
        '@/lib/p9-application-runtime-binding',
  );
  const bindingImportsNamed = bindingImports[0]?.importClause?.namedBindings;
  if (
    bindingImports.length !== 1 ||
    !bindingImportsNamed ||
    !ts.isNamedImports(bindingImportsNamed) ||
    bindingImportsNamed.elements.length !== 1 ||
    bindingImportsNamed.elements[0].propertyName ||
    bindingImportsNamed.elements[0].name.text !== 'applicationRuntimeBinding'
  ) {
    bindingReject('loader runtime binding import is not exact named/no-alias');
  }
  const rollback = loader.body!.statements.find((statement): statement is ts.IfStatement => {
    if (!ts.isIfStatement(statement) || statement.elseStatement) return false;
    const condition = statement.expression;
    return (
      ts.isBinaryExpression(condition) &&
      condition.operatorToken.kind === ts.SyntaxKind.EqualsEqualsEqualsToken &&
      ts.isIdentifier(condition.left) &&
      condition.left.text === sourceModeName &&
      ts.isStringLiteral(condition.right) &&
      condition.right.text === 'accepted-p7-static-catalog'
    );
  });
  if (!rollback) bindingReject('loader rollback early return is missing');
  let rollbackNullProbe = false;
  let rollbackBindingFlow = false;
  let rollbackGoogle = false;
  bindingWalk(rollback.thenStatement, (node) => {
    if (node.getText(file).includes('google.')) rollbackGoogle = true;
    if (
      ts.isReturnStatement(node) &&
      node.expression &&
      ts.isObjectLiteralExpression(node.expression)
    ) {
      const probe = propertyValue(node.expression, 'applicationReadProbe');
      rollbackNullProbe =
        Boolean(probe) &&
        !ts.isShorthandPropertyAssignment(probe!) &&
        probe!.kind === ts.SyntaxKind.NullKeyword;
      const binding = propertyValue(node.expression, 'applicationRuntimeBinding');
      rollbackBindingFlow =
        Boolean(binding) &&
        ts.isShorthandPropertyAssignment(binding!) &&
        binding!.name.text === 'applicationRuntimeBinding';
    }
  });
  if (!rollbackNullProbe || !rollbackBindingFlow || rollbackGoogle) {
    bindingReject('rollback does not return before every Google construction');
  }
  const googleNodes: Array<ts.CallExpression | ts.NewExpression> = [];
  bindingWalk(loader.body!, (node) => {
    if (
      (ts.isCallExpression(node) || ts.isNewExpression(node)) &&
      propertyAccessChain(node.expression)?.startsWith('google.')
    ) {
      googleNodes.push(node);
    }
  });
  if (
    googleNodes.some((node) => node.getStart() < rollback.getEnd()) ||
    googleNodes.length !== 2
  ) {
    bindingReject('Google capabilities are duplicated or reachable on rollback');
  }
  const authNode = googleNodes.find(
    (node) => propertyAccessChain(node.expression) === 'google.auth.GoogleAuth',
  );
  const sheetsNode = googleNodes.find(
    (node) => propertyAccessChain(node.expression) === 'google.sheets',
  );
  if (!authNode || !ts.isNewExpression(authNode) || !sheetsNode) {
    bindingReject('loader GoogleAuth/Sheets construction is not direct');
  }
  bindingExactCredentialParser(file);
  const credentials = bindingVariable(loader.body!, 'credentials').initializer!;
  if (
    !ts.isCallExpression(credentials) ||
    !ts.isIdentifier(credentials.expression) ||
    credentials.expression.text !== 'parseServiceAccountCredentials' ||
    credentials.arguments.length !== 1 ||
    propertyAccessChain(credentials.arguments[0]) !==
      'process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS'
  ) {
    bindingReject('loader credentials are not the exact runtime credential source');
  }
  const authOptions = bindingExactObject(
    authNode.arguments?.[0],
    ['credentials', 'scopes'],
    'GoogleAuth options',
  );
  const authCredentials = bindingDirectProperty(authOptions, 'credentials');
  if (!ts.isIdentifier(authCredentials) || authCredentials.text !== 'credentials') {
    bindingReject('GoogleAuth does not use the exact runtime credential symbol');
  }
  const authScopes = bindingDirectProperty(authOptions, 'scopes');
  if (
    !ts.isArrayLiteralExpression(authScopes) ||
    authScopes.elements.length !== 1 ||
    !ts.isStringLiteral(authScopes.elements[0]) ||
    authScopes.elements[0].text !== P9_READ_ONLY_OAUTH_SCOPE
  ) {
    bindingReject('loader scope is not solely Sheets readonly');
  }
  const oauthScopes: string[] = [];
  bindingWalk(loader.body!, (node) => {
    if (
      (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) &&
      node.text.includes('googleapis.com/auth/')
    ) {
      oauthScopes.push(node.text);
    }
  });
  if (oauthScopes.some((scope) => scope !== P9_READ_ONLY_OAUTH_SCOPE)) {
    bindingReject('loader contains a broader Google scope');
  }
  const sheets = bindingVariable(loader.body!, 'sheets');
  if (
    !ts.isCallExpression(sheets.initializer!) ||
    propertyAccessChain(sheets.initializer!.expression) !== 'google.sheets'
  ) {
    bindingReject('sheets variable is not the direct Google client');
  }
  const sheetsOptions = bindingExactObject(
    sheets.initializer!.arguments[0],
    ['version', 'auth'],
    'google.sheets options',
  );
  const sheetsVersion = bindingDirectProperty(sheetsOptions, 'version');
  const sheetsAuth = bindingDirectProperty(sheetsOptions, 'auth');
  if (
    !ts.isStringLiteral(sheetsVersion) ||
    sheetsVersion.text !== 'v4' ||
    !ts.isIdentifier(sheetsAuth) ||
    sheetsAuth.text !== 'auth'
  ) {
    bindingReject('google.sheets is not exact v4 with the exact auth symbol');
  }
  const response = bindingVariable(loader.body!, 'response');
  if (
    !ts.isAwaitExpression(response.initializer!) ||
    !ts.isCallExpression(response.initializer!.expression) ||
    propertyAccessChain(response.initializer!.expression.expression) !==
      'sheets.spreadsheets.get'
  ) {
    bindingReject('response is not directly awaited spreadsheets.get');
  }
  const request = bindingExactObject(
    response.initializer!.expression.arguments[0],
    ['spreadsheetId', 'ranges', 'includeGridData', 'fields'],
    'spreadsheets.get request',
  );
  const spreadsheetId = bindingDirectProperty(request, 'spreadsheetId');
  const fields = bindingDirectProperty(request, 'fields');
  const includeGridData = bindingDirectProperty(request, 'includeGridData');
  const ranges = bindingDirectProperty(request, 'ranges');
  if (
    !ts.isStringLiteral(spreadsheetId) ||
    spreadsheetId.text !== P9_PRODUCTION_SPREADSHEET_ID ||
    !ts.isStringLiteral(fields) ||
    fields.text !== P9_APPLICATION_READ_BOUNDED_FIELDS ||
    includeGridData.kind !== ts.SyntaxKind.TrueKeyword ||
    !ts.isArrayLiteralExpression(ranges) ||
    ranges.elements.length !== P9_AUTHORIZED_PRODUCTION_TABS.length ||
    ranges.elements.some(
      (range, index) =>
        !ts.isStringLiteral(range) ||
        range.text !== P9_AUTHORIZED_PRODUCTION_TABS[index].boundedRange,
    )
  ) {
    bindingReject('spreadsheets.get ID/ranges/grid/fields contract differs');
  }
  const mappingFunctions = file.statements.filter(
    (statement): statement is ts.FunctionDeclaration =>
      ts.isFunctionDeclaration(statement) &&
      statement.name?.text === 'mapP9Scholarships' &&
      Boolean(statement.body),
  );
  const mappingFunction = mappingFunctions[0];
  const mappingParameter = mappingFunction?.parameters[0]?.name;
  const mappingReturn = mappingFunction?.body?.statements[0];
  const mappingExpression =
    mappingReturn && ts.isReturnStatement(mappingReturn)
      ? mappingReturn.expression
      : undefined;
  let callbackUsesInput = false;
  if (
    mappingFunctions.length === 1 &&
    mappingFunction.parameters.length === 1 &&
    mappingFunction.body!.statements.length === 1 &&
    mappingParameter &&
    ts.isIdentifier(mappingParameter) &&
    mappingExpression &&
    ts.isCallExpression(mappingExpression) &&
    ts.isPropertyAccessExpression(mappingExpression.expression) &&
    ts.isIdentifier(mappingExpression.expression.expression) &&
    mappingExpression.expression.expression.text === mappingParameter.text &&
    ['map', 'flatMap'].includes(mappingExpression.expression.name.text) &&
    mappingExpression.arguments.length === 1 &&
    ts.isArrowFunction(mappingExpression.arguments[0]) &&
    mappingExpression.arguments[0].parameters.length === 1 &&
    ts.isIdentifier(mappingExpression.arguments[0].parameters[0].name)
  ) {
    const callbackParameter = mappingExpression.arguments[0].parameters[0].name.text;
    bindingWalk(mappingExpression.arguments[0].body, (node) => {
      if (ts.isIdentifier(node) && node.text === callbackParameter) {
        callbackUsesInput = true;
      }
    });
  }
  const scholarships = bindingVariable(loader.body!, 'scholarships').initializer!;
  if (
    !ts.isCallExpression(scholarships) ||
    !ts.isIdentifier(scholarships.expression) ||
    scholarships.expression.text !== 'mapP9Scholarships' ||
    scholarships.arguments.length !== 1 ||
    !ts.isBinaryExpression(scholarships.arguments[0]) ||
    scholarships.arguments[0].operatorToken.kind !==
      ts.SyntaxKind.QuestionQuestionToken ||
    propertyAccessChain(scholarships.arguments[0].left) !==
      'response.data.sheets' ||
    !ts.isArrayLiteralExpression(scholarships.arguments[0].right) ||
    scholarships.arguments[0].right.elements.length !== 0 ||
    !callbackUsesInput
  ) {
    bindingReject('scholarships do not directly map the exact awaited response sheets');
  }
  bindingChallengeHelper(file);
  const challengeNames: string[] = [];
  for (const tab of P9_AUTHORIZED_PRODUCTION_TABS) {
    const sheetName = `sheet${tab.sheetId}`;
    const gridName = `gridData${tab.sheetId}`;
    const challengeName = `challenge${tab.sheetId}`;
    const sheet = bindingVariable(loader.body!, sheetName).initializer!;
    if (
      !ts.isCallExpression(sheet) ||
      !ts.isPropertyAccessExpression(sheet.expression) ||
      sheet.expression.name.text !== 'find' ||
      propertyAccessChain(sheet.expression.expression) !== 'response.data.sheets' ||
      sheet.arguments.length !== 1 ||
      !ts.isArrowFunction(sheet.arguments[0]) ||
      !ts.isIdentifier(sheet.arguments[0].parameters[0]?.name) ||
      !ts.isBinaryExpression(sheet.arguments[0].body) ||
      propertyAccessChain(sheet.arguments[0].body.left) !==
        `${sheet.arguments[0].parameters[0].name.text}.properties.sheetId` ||
      !ts.isNumericLiteral(sheet.arguments[0].body.right) ||
      Number(sheet.arguments[0].body.right.text) !== tab.sheetId
    ) {
      bindingReject(`${sheetName} is not selected from the exact response`);
    }
    const grid = bindingVariable(loader.body!, gridName).initializer!;
    if (
      !ts.isBinaryExpression(grid) ||
      grid.operatorToken.kind !== ts.SyntaxKind.QuestionQuestionToken ||
      propertyAccessChain(grid.left) !== `${sheetName}.data` ||
      !ts.isArrayLiteralExpression(grid.right) ||
      grid.right.elements.length !== 0
    ) {
      bindingReject(`${gridName} is not immutable sheet.data ?? []`);
    }
    const challenge = bindingVariable(loader.body!, challengeName).initializer!;
    if (
      !ts.isCallExpression(challenge) ||
      !ts.isIdentifier(challenge.expression) ||
      challenge.expression.text !== 'p9ApplicationReadChallengeSha256' ||
      challenge.arguments.length !== 3 ||
      !ts.isIdentifier(challenge.arguments[0]) ||
      challenge.arguments[0].text !== nonceName ||
      !ts.isIdentifier(challenge.arguments[2]) ||
      challenge.arguments[2].text !== gridName
    ) {
      bindingReject(`${challengeName} does not directly bind nonce and GridData`);
    }
    bindingExactTab(challenge.arguments[1], tab, false);
    challengeNames.push(challengeName);
  }
  const probeObjects: ts.ObjectLiteralExpression[] = [];
  bindingWalk(loader.body!, (node) => {
    if (
      ts.isReturnStatement(node) &&
      node.expression &&
      ts.isObjectLiteralExpression(node.expression)
    ) {
      const probe = propertyValue(node.expression, 'applicationReadProbe');
      if (
        probe &&
        !ts.isShorthandPropertyAssignment(probe) &&
        ts.isObjectLiteralExpression(probe)
      ) {
        probeObjects.push(probe);
      }
    }
  });
  if (probeObjects.length !== 1) {
    bindingReject('application probe is unused, wrapped, or has alternate flow');
  }
  const probe = bindingExactObject(
    probeObjects[0],
    [
      'domain',
      'challengeHashAlgorithm',
      'nonce',
      'spreadsheetId',
      'oauthScopes',
      'tabs',
      'runtimeBinding',
    ],
    'returned application probe',
  );
  const domain = bindingDirectProperty(probe, 'domain');
  const algorithm = bindingDirectProperty(probe, 'challengeHashAlgorithm');
  const returnedNonce = bindingDirectProperty(probe, 'nonce');
  const returnedId = bindingDirectProperty(probe, 'spreadsheetId');
  const returnedScopes = bindingDirectProperty(probe, 'oauthScopes');
  if (
    !ts.isStringLiteral(domain) ||
    domain.text !== P9_APPLICATION_READ_CHALLENGE_DOMAIN ||
    !ts.isStringLiteral(algorithm) ||
    algorithm.text !== P9_APPLICATION_READ_CHALLENGE_HASH_ALGORITHM ||
    !ts.isIdentifier(returnedNonce) ||
    returnedNonce.text !== nonceName ||
    !ts.isStringLiteral(returnedId) ||
    returnedId.text !== P9_PRODUCTION_SPREADSHEET_ID ||
    !ts.isArrayLiteralExpression(returnedScopes) ||
    returnedScopes.elements.length !== 1 ||
    !ts.isStringLiteral(returnedScopes.elements[0]) ||
    returnedScopes.elements[0].text !== P9_READ_ONLY_OAUTH_SCOPE
  ) {
    bindingReject('returned probe authority/nonce fields differ');
  }
  const probeRuntimeBinding = bindingDirectProperty(probe, 'runtimeBinding');
  if (
    !ts.isIdentifier(probeRuntimeBinding) ||
    probeRuntimeBinding.text !== 'applicationRuntimeBinding'
  ) {
    bindingReject('returned probe runtime binding is not the exact imported symbol');
  }
  const returnedTabs = bindingDirectProperty(probe, 'tabs');
  if (
    !ts.isArrayLiteralExpression(returnedTabs) ||
    returnedTabs.elements.length !== P9_AUTHORIZED_PRODUCTION_TABS.length
  ) {
    bindingReject('returned probe tabs are missing or reordered');
  }
  returnedTabs.elements.forEach((tab, index) =>
    bindingExactTab(
      tab,
      P9_AUTHORIZED_PRODUCTION_TABS[index],
      true,
      challengeNames[index],
    ),
  );
  const productionReturn = probe.parent.parent;
  if (!ts.isObjectLiteralExpression(productionReturn)) {
    bindingReject('production probe is not directly inside the loader result');
  }
  const productionScholarships = propertyValue(productionReturn, 'scholarships');
  const productionBinding = propertyValue(
    productionReturn,
    'applicationRuntimeBinding',
  );
  if (
    !productionScholarships ||
    !ts.isShorthandPropertyAssignment(productionScholarships) ||
    productionScholarships.name.text !== 'scholarships' ||
    !productionBinding ||
    !ts.isShorthandPropertyAssignment(productionBinding) ||
    productionBinding.name.text !== 'applicationRuntimeBinding'
  ) {
    bindingReject('production result does not directly flow scholarships and runtime binding');
  }
  const publicReadBranch = loader.body!.statements.find(
    (statement): statement is ts.IfStatement =>
      ts.isIfStatement(statement) &&
      ts.isBinaryExpression(statement.expression) &&
      statement.expression.operatorToken.kind ===
        ts.SyntaxKind.EqualsEqualsEqualsToken &&
      ts.isIdentifier(statement.expression.left) &&
      statement.expression.left.text === nonceName &&
      statement.expression.right.kind === ts.SyntaxKind.NullKeyword &&
      statement.getStart() > response.getEnd(),
  );
  let publicNullFlow = false;
  if (publicReadBranch) {
    bindingWalk(publicReadBranch.thenStatement, (node) => {
      if (
        !ts.isReturnStatement(node) ||
        !node.expression ||
        !ts.isObjectLiteralExpression(node.expression)
      ) {
        return;
      }
      const publicScholarships = propertyValue(node.expression, 'scholarships');
      const publicProbe = propertyValue(node.expression, 'applicationReadProbe');
      const publicBinding = propertyValue(
        node.expression,
        'applicationRuntimeBinding',
      );
      publicNullFlow =
        Boolean(publicScholarships) &&
        ts.isShorthandPropertyAssignment(publicScholarships!) &&
        publicScholarships!.name.text === 'scholarships' &&
        Boolean(publicProbe) &&
        !ts.isShorthandPropertyAssignment(publicProbe!) &&
        publicProbe!.kind === ts.SyntaxKind.NullKeyword &&
        Boolean(publicBinding) &&
        ts.isShorthandPropertyAssignment(publicBinding!) &&
        publicBinding!.name.text === 'applicationRuntimeBinding';
    });
  }
  if (!publicNullFlow) {
    bindingReject('public null-nonce path does not directly flow mapped scholarships');
  }
}

function validateP9ApplicationRouteSource(
  source: string,
  kind: 'health' | 'public',
): void {
  const pathName = kind === 'health' ? P9_HEALTH_ROUTE_PATH : P9_PUBLIC_ROUTE_PATH;
  const file = bindingSourceFile(pathName, source);
  const imports = file.statements.filter(
    (statement): statement is ts.ImportDeclaration =>
      ts.isImportDeclaration(statement) &&
      ts.isStringLiteral(statement.moduleSpecifier) &&
      statement.moduleSpecifier.text === '@/lib/p9-production-source',
  );
  const named = imports[0]?.importClause?.namedBindings;
  if (
    imports.length !== 1 ||
    !named ||
    !ts.isNamedImports(named) ||
    named.elements.length !== 1 ||
    named.elements[0].propertyName ||
    named.elements[0].name.text !== P9_PRODUCTION_SOURCE_LOADER_EXPORT
  ) {
    bindingReject(`${kind} route loader import is absent, aliased, or broad`);
  }
  let dynamicImport = false;
  bindingWalk(file, (node) => {
    if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
      dynamicImport = true;
    }
  });
  if (dynamicImport) bindingReject(`${kind} route uses dynamic import`);
  const handler = bindingDirectExport(file, 'GET');
  const calls: ts.CallExpression[] = [];
  bindingWalk(handler.body!, (node) => {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === P9_PRODUCTION_SOURCE_LOADER_EXPORT
    ) {
      calls.push(node);
    }
  });
  if (
    calls.length !== 1 ||
    !ts.isAwaitExpression(calls[0].parent) ||
    !ts.isVariableDeclaration(calls[0].parent.parent) ||
    !ts.isIdentifier(calls[0].parent.parent.name)
  ) {
    bindingReject(`${kind} route does not directly await one loader result`);
  }
  const resultName = calls[0].parent.parent.name.text;
  bindingDirectConst(handler.body!, resultName);
  if (kind === 'health') {
    if (
      handler.parameters.length !== 1 ||
      !ts.isIdentifier(handler.parameters[0].name)
    ) {
      bindingReject('health route request parameter is not direct');
    }
    const requestName = handler.parameters[0].name.text;
    const headerNonce = bindingDirectConst(
      handler.body!,
      'headerNonce',
    ).initializer!;
    if (
      !ts.isCallExpression(headerNonce) ||
      propertyAccessChain(headerNonce.expression) !==
        `${requestName}.headers.get` ||
      headerNonce.arguments.length !== 1 ||
      !ts.isStringLiteral(headerNonce.arguments[0]) ||
      headerNonce.arguments[0].text !== 'x-p9-evidence-nonce'
    ) {
      bindingReject('health nonce is not read from the exact evidence header');
    }
    const queryNonce = bindingDirectConst(
      handler.body!,
      'queryNonce',
    ).initializer!;
    if (
      !ts.isCallExpression(queryNonce) ||
      !ts.isPropertyAccessExpression(queryNonce.expression) ||
      queryNonce.expression.name.text !== 'get' ||
      queryNonce.arguments.length !== 1 ||
      !ts.isStringLiteral(queryNonce.arguments[0]) ||
      queryNonce.arguments[0].text !== 'p9_evidence_nonce' ||
      !ts.isPropertyAccessExpression(queryNonce.expression.expression) ||
      queryNonce.expression.expression.name.text !== 'searchParams' ||
      !ts.isNewExpression(queryNonce.expression.expression.expression) ||
      !ts.isIdentifier(queryNonce.expression.expression.expression.expression) ||
      queryNonce.expression.expression.expression.expression.text !== 'URL' ||
      queryNonce.expression.expression.expression.arguments?.length !== 1 ||
      propertyAccessChain(
        queryNonce.expression.expression.expression.arguments[0],
      ) !== `${requestName}.url`
    ) {
      bindingReject('health nonce is not read from the exact evidence query');
    }
    const expectedGuardFile = bindingSourceFile(
      'expected-p9-health-nonce-guard.ts',
      [
        'if (',
        '  headerNonce === null ||',
        '  queryNonce === null ||',
        '  !/^[A-Za-z0-9_-]{32,128}$/.test(headerNonce) ||',
        '  !/^[A-Za-z0-9_-]{32,128}$/.test(queryNonce) ||',
        '  headerNonce !== queryNonce',
        ') return;',
      ].join('\n'),
    );
    const expectedGuard = expectedGuardFile.statements[0] as ts.IfStatement;
    const guards = handler.body!.statements.filter(
      (statement): statement is ts.IfStatement =>
        ts.isIfStatement(statement) &&
        bindingPrinted(statement.expression, file) ===
          bindingPrinted(expectedGuard.expression, expectedGuardFile),
    );
    const guard = guards[0];
    const guardReturns = guard
      ? ts.isBlock(guard.thenStatement)
        ? guard.thenStatement.statements.length === 1 &&
          ts.isReturnStatement(guard.thenStatement.statements[0])
        : ts.isReturnStatement(guard.thenStatement)
      : false;
    if (
      guards.length !== 1 ||
      !guardReturns ||
      guard.elseStatement ||
      guard.getEnd() >= calls[0].getStart()
    ) {
      bindingReject(
        'health header/query nonces are not both validated and equal before the loader read',
      );
    }
    const nonceBinding = bindingDirectConst(handler.body!, 'nonce');
    const nonceValue = nonceBinding.initializer!;
    if (
      !ts.isIdentifier(nonceValue) ||
      nonceValue.text !== 'headerNonce' ||
      nonceBinding.getStart() <= guard.getEnd() ||
      nonceBinding.getEnd() >= calls[0].getStart()
    ) {
      bindingReject('health validated nonce is not one immutable direct argument');
    }
    const argument = calls[0].arguments[0];
    if (
      calls[0].arguments.length !== 1 ||
      !argument ||
      !ts.isIdentifier(argument) ||
      argument.text !== 'nonce'
    ) {
      bindingReject('health loader nonce is literal, env, config, stored, or aliased');
    }
  } else if (
    calls[0].arguments.length !== 1 ||
    calls[0].arguments[0].kind !== ts.SyntaxKind.NullKeyword
  ) {
    bindingReject('public route must call the shared loader with literal null only');
  }
  const returnedObjects: ts.ObjectLiteralExpression[] = [];
  bindingWalk(handler.body!, (node) => {
    if (
      !ts.isReturnStatement(node) ||
      !node.expression ||
      !ts.isCallExpression(node.expression) ||
      propertyAccessChain(node.expression.expression) !== 'Response.json'
    ) {
      return;
    }
    const object = node.expression.arguments[0];
    if (
      object &&
      ts.isObjectLiteralExpression(object) &&
      node.getStart() > calls[0].getEnd()
    ) returnedObjects.push(object);
  });
  if (returnedObjects.length !== 1) {
    bindingReject(`${kind} route has alternate post-read response flow`);
  }
  const response = returnedObjects[0];
  if (
    response.properties.some(
      (property) =>
        ts.isSpreadAssignment(property) || bindingPropertyName(property) === null,
    )
  ) {
    bindingReject(`${kind} route response uses spread/computed flow`);
  }
  const requiredFlows =
    kind === 'health'
      ? [
          ['applicationReadProbe', 'applicationReadProbe'],
          ['applicationRuntimeBinding', 'applicationRuntimeBinding'],
        ] as const
      : [['data', 'scholarships']] as const;
  const directFlow = requiredFlows.every(([responseKey, resultProperty]) => {
    const matching = response.properties.filter(
      (property) => bindingPropertyName(property) === responseKey,
    );
    if (matching.length !== 1) return false;
    const value = propertyValue(response, responseKey);
    return Boolean(
      value &&
        !ts.isShorthandPropertyAssignment(value) &&
        ts.isPropertyAccessExpression(value) &&
        ts.isIdentifier(value.expression) &&
        value.expression.text === resultName &&
        value.name.text === resultProperty,
    );
  });
  if (!directFlow) {
    bindingReject(`${kind} route does not directly flow the awaited loader result`);
  }
}

export function sha256P9Text(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function p9CanonicalProductionHostnameFingerprint(
  hostnameValue: string,
): string {
  return sha256P9Text(hostnameValue.toLowerCase());
}

export function p9HostedVerificationEnvironmentFingerprint(
  environment: string,
): string {
  return sha256P9Text(environment);
}

export function p9RuntimeCredentialProvenanceFingerprint(
  runtimeIdentity: P9EntryReceipt['runtimeIdentity'],
): string {
  return sha256P9Value(runtimeIdentity);
}

function withoutObservationId<T extends { observationId: string }>(
  value: T,
): Omit<T, 'observationId'> {
  const { observationId: _ignored, ...rest } = value;
  return rest;
}

function millis(value: string): number {
  return Date.parse(value);
}

function ordered(
  errors: string[],
  label: string,
  earlier: string,
  later: string,
): void {
  if (millis(earlier) > millis(later)) {
    errors.push(`${label} chronology is invalid`);
  }
}

function finishedBefore(
  errors: string[],
  label: string,
  finishedAt: string,
  nextStartedAt: string,
): void {
  if (millis(finishedAt) >= millis(nextStartedAt)) {
    errors.push(`${label} must finish strictly before the next phase starts`);
  }
}

function boundedDuration(
  errors: string[],
  label: string,
  start: string,
  end: string,
  maximumMillis: number,
): void {
  const duration = millis(end) - millis(start);
  if (duration < 0 || duration > maximumMillis) {
    errors.push(`${label} freshness window is invalid`);
  }
}

function formatZodError(label: string, error: z.ZodError): string[] {
  return error.issues.map(
    (issue) => `${label} strict schema rejected ${issue.path.join('.') || '<root>'}: ${issue.message}`,
  );
}

function validateEvidenceContextPins(
  context: P9EvidenceContext,
  errors: string[],
): void {
  const pins = [
    context.runtimePrincipalFingerprintSha256,
    context.providerProjectFingerprintSha256,
    context.providerTeamFingerprintSha256,
    context.providerCanonicalProductionHostnameSha256,
    context.hostedVerificationEnvironmentFingerprintSha256,
    context.runtimeCredentialProvenanceFingerprintSha256,
  ];
  if (!pins.every((pin) => sha256.safeParse(pin).success)) {
    errors.push('P9 evidence context lacks exact non-null operational identity pins');
  }
}

function validatePinnedCaptureEnvironment(
  capture: z.infer<typeof captureSchema>,
  context: P9EvidenceContext,
  errors: string[],
  label: string,
): void {
  if (
    p9HostedVerificationEnvironmentFingerprint(capture.environment) !==
    context.hostedVerificationEnvironmentFingerprintSha256
  ) {
    errors.push(`${label} is not bound to the pinned hosted verification environment`);
  }
}

function validatePinnedRuntimeIdentity(
  runtimeIdentity: P9EntryReceipt['runtimeIdentity'],
  context: P9EvidenceContext,
  errors: string[],
  label: string,
): void {
  if (
    runtimeIdentity.principalFingerprintSha256 !==
    context.runtimePrincipalFingerprintSha256
  ) {
    errors.push(`${label} runtime principal differs from the pinned identity`);
  }
  if (
    p9RuntimeCredentialProvenanceFingerprint(runtimeIdentity) !==
    context.runtimeCredentialProvenanceFingerprintSha256
  ) {
    errors.push(`${label} runtime credential provenance differs from the pinned identity`);
  }
}

function validatePinnedProvider(
  projectIdSha256: string,
  teamIdSha256: string,
  context: P9EvidenceContext,
  errors: string[],
  label: string,
): void {
  if (
    projectIdSha256 !== context.providerProjectFingerprintSha256 ||
    teamIdSha256 !== context.providerTeamFingerprintSha256
  ) {
    errors.push(`${label} differs from the pinned provider project or team`);
  }
}

function validatePinnedHostname(
  host: string,
  context: P9EvidenceContext,
  errors: string[],
  label: string,
): void {
  if (
    p9CanonicalProductionHostnameFingerprint(host) !==
    context.providerCanonicalProductionHostnameSha256
  ) {
    errors.push(`${label} differs from the pinned canonical production hostname`);
  }
}

function validateAttestation(
  errors: string[],
  receiptPath: string,
  receiptSha256: string,
  workflowCommit: string,
  verification: P9AttestationVerification | null,
): void {
  if (
    !verification ||
    verification.verified !== true ||
    verification.subjectPath !== receiptPath ||
    verification.subjectSha256 !== receiptSha256 ||
    verification.repository !== P9_EVIDENCE_REPOSITORY ||
    verification.signerWorkflow !== P9_SIGNER_WORKFLOW ||
    verification.sourceDigest !== workflowCommit ||
    verification.denySelfHostedRunners !== true
  ) {
    errors.push(`${receiptPath} lacks exact GitHub OIDC attestation verification`);
  }
}

function expectedTabs() {
  return P9_AUTHORIZED_PRODUCTION_TABS.map((tab) => {
    const backup = P9_VERIFIED_BACKUPS.find((item) => item.sourceSheetId === tab.sheetId)!;
    return {
      ...tab,
      backupSpreadsheetId: backup.backupSpreadsheetId,
      historicalSourceAndBackupSha256: backup.nativeCellPayloadSha256,
      canonicalCellPayloadHashAlgorithm:
        'google-sheets-v4-griddata-canonical-json-v1' as const,
    };
  });
}

function validateSourceObservation(
  observation: P9SourceObservation,
  errors: string[],
  label: string,
): void {
  if (observation.observationId !== sha256P9Value(withoutObservationId(observation))) {
    errors.push(`${label} observation ID is not derived from canonical content`);
  }
  if (observation.sharingBeforeSha256 !== observation.sharingAfterSha256) {
    errors.push(`${label} sharing fingerprint changed`);
  }
  const expected = expectedTabs();
  observation.tabs.forEach((tab, index) => {
    const {
      sourceCanonicalCellPayloadSha256,
      backupCanonicalCellPayloadSha256,
      ...identity
    } = tab;
    if (
      canonicalP9Json(identity) !== canonicalP9Json(expected[index]) ||
      sourceCanonicalCellPayloadSha256 !== backupCanonicalCellPayloadSha256
    ) {
      errors.push(`${label} tab, grid, source, or backup fingerprint changed`);
    }
  });
  boundedDuration(errors, label, observation.startedAt, observation.completedAt, 15 * 60_000);
}

function validateCommonBinding(
  errors: string[],
  value: {
    p9BaselineCommit: string;
    revision7AttestationCommit: string;
    capture: z.infer<typeof captureSchema>;
  },
  context: P9EvidenceContext,
  jobName: z.infer<typeof captureSchema>['jobName'],
): void {
  validateEvidenceContextPins(context, errors);
  validatePinnedCaptureEnvironment(
    value.capture,
    context,
    errors,
    `P9 ${jobName} capture`,
  );
  if (
    value.p9BaselineCommit !== context.p9BaselineCommit ||
    value.revision7AttestationCommit !== context.revision7AttestationCommit
  ) {
    errors.push('P9 evidence is rebound to a different baseline or Revision 7 attestation');
  }
  if (value.capture.jobName !== jobName) {
    errors.push(`P9 ${jobName} receipt has the wrong trusted workflow job`);
  }
  if (
    value.capture.workflowCommit !== context.p9BaselineCommit ||
    value.capture.headSha !== context.p9BaselineCommit
  ) {
    errors.push(`P9 ${jobName} receipt was not produced by the delivered baseline workflow`);
  }
  ordered(
    errors,
    'Revision 7 attestation to P9 evidence',
    context.revision7AttestationCommittedAt,
    value.capture.startedAt,
  );
  ordered(
    errors,
    'P9 baseline to evidence',
    context.p9BaselineCommittedAt,
    value.capture.startedAt,
  );
  boundedDuration(
    errors,
    `P9 ${jobName} workflow`,
    value.capture.startedAt,
    value.capture.completedAt,
    2 * 60 * 60_000,
  );
}

function validatePhaseCapture(
  capture: z.infer<typeof captureSchema>,
  context: P9EvidenceContext,
  expectedJobName: 'cutover-proof' | 'rollback-proof' | 'restored-cutover-proof',
  errors: string[],
): void {
  validatePinnedCaptureEnvironment(
    capture,
    context,
    errors,
    `P9 ${expectedJobName} capture`,
  );
  if (
    capture.jobName !== expectedJobName ||
    capture.workflowCommit !== context.p9BaselineCommit ||
    capture.headSha !== context.p9BaselineCommit
  ) {
    errors.push(`P9 ${expectedJobName} was not produced by the delivered baseline workflow`);
  }
  ordered(
    errors,
    `Revision 7 attestation to ${expectedJobName}`,
    context.revision7AttestationCommittedAt,
    capture.startedAt,
  );
  boundedDuration(
    errors,
    `P9 ${expectedJobName} workflow`,
    capture.startedAt,
    capture.completedAt,
    30 * 60_000,
  );
}

export function parseP9EntryReceipt(value: unknown): P9EntryReceipt | null {
  const parsed = P9EntryReceiptSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function parseP9DeploymentRecord(value: unknown): P9DeploymentRecord | null {
  const parsed = P9DeploymentRecordSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function parseP9PostCutoverReceipt(
  value: unknown,
): P9PostCutoverReceipt | null {
  const parsed = P9PostCutoverReceiptSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

function validateP9EntryReceiptSemantics(
  receipt: P9EntryReceipt,
  context: P9EvidenceContext,
): string[] {
  const errors: string[] = [];
  validateCommonBinding(errors, receipt, context, 'entry');
  const baselineDeployment = receipt.baselineProductionDeployment;
  validatePinnedProvider(
    baselineDeployment.projectIdSha256,
    baselineDeployment.teamIdSha256,
    context,
    errors,
    'P9 entry provider',
  );
  validatePinnedHostname(
    baselineDeployment.urlHost,
    context,
    errors,
    'P9 entry production host',
  );
  validatePinnedRuntimeIdentity(
    receipt.runtimeIdentity,
    context,
    errors,
    'P9 entry',
  );
  if (
    baselineDeployment.observationId !==
      sha256P9Value(withoutObservationId(baselineDeployment)) ||
    baselineDeployment.gitSource.sha !== context.p9BaselineCommit
  ) {
    errors.push('P9 entry baseline Production deployment is not derived or Git-bound');
  }
  ordered(
    errors,
    'P9 baseline commit to Revision 7 Production deployment',
    context.p9BaselineCommittedAt,
    baselineDeployment.createdAt,
  );
  ordered(
    errors,
    'Revision 7 Production deployment readiness',
    baselineDeployment.createdAt,
    baselineDeployment.readyAt,
  );
  ordered(
    errors,
    'Revision 7 Production readiness to P9 entry',
    baselineDeployment.readyAt,
    receipt.capture.startedAt,
  );
  ordered(
    errors,
    'P9 entry source observation start',
    receipt.capture.startedAt,
    receipt.sourceObservation.startedAt,
  );
  ordered(
    errors,
    'P9 entry source observation completion',
    receipt.sourceObservation.completedAt,
    receipt.capture.completedAt,
  );
  validateSourceObservation(receipt.sourceObservation, errors, 'P9 entry');
  if (receipt.sourceObservation.applicationReadChallenge !== null) {
    errors.push('P9 entry source observation must not contain an application challenge');
  }
  if (
    receipt.sourceObservation.backupReadPrincipalFingerprintSha256 !==
    receipt.runtimeIdentity.principalFingerprintSha256
  ) {
    errors.push('P9 entry backups were not read by the exact runtime principal');
  }
  return errors;
}

export function validateP9EntryReceiptV2(
  value: unknown,
  context: P9EvidenceContext,
  receiptSha256: string,
  attestation: P9AttestationVerification | null,
): string[] {
  const parsed = P9EntryReceiptSchema.safeParse(value);
  if (!parsed.success) return formatZodError('P9 entry receipt', parsed.error);
  const errors = validateP9EntryReceiptSemantics(parsed.data, context);
  validateAttestation(
    errors,
    P9_ENTRY_EVIDENCE_PATH,
    receiptSha256,
    parsed.data.capture.workflowCommit,
    attestation,
  );
  return errors;
}

function surfaceIds(config: P9RuntimeConfig): string[] {
  return [...config.writePolicy.surfaces].sort();
}

function validateRuntimeConfig(
  config: P9RuntimeConfig,
  role: 'cutover' | 'rollback' | 'restored-cutover',
  context: P9EvidenceContext,
  entryReceipt: P9EntryReceipt,
  errors: string[],
): void {
  const required = context.expectedWriteSurfaceInventory.map((item) => item.id).sort();
  const baselinePaths = new Set(P9_REQUIRED_WRITE_SURFACES.map((item) => item.path));
  const inventoryPaths = new Set(context.expectedWriteSurfaceInventory.map((item) => item.path));
  if (
    context.expectedWriteSurfaceInventory.length < P9_REQUIRED_WRITE_SURFACES.length ||
    [...baselinePaths].some((item) => !inventoryPaths.has(item)) ||
    context.expectedWriteSurfaceInventory.some(
      (item) =>
        item.independentlyDerived !== true ||
        item.probeExport !== P9_WRITE_ISOLATION_PROBE_EXPORT ||
        item.guardedBeforeClientConstruction !== true ||
        item.googleSheetsClientConstructions < 1 ||
        item.googleSheetsClientConstructions !== item.guardedGoogleSheetsClientConstructions ||
        item.googleSheetsMutatorCalls < 1 ||
        item.mutators.length < 1,
    )
  ) {
    errors.push(`P9 ${role} derived write-surface inventory is incomplete or unguarded`);
  }
  if (
    new Set(config.writePolicy.surfaces).size !== config.writePolicy.surfaces.length ||
    canonicalP9Json(surfaceIds(config)) !== canonicalP9Json(required)
  ) {
    errors.push(`P9 ${role} runtime config does not name the exact write-surface inventory`);
  }
  if (
    config.runtimeIdentityFingerprintSha256 !==
    entryReceipt.runtimeIdentity.principalFingerprintSha256
  ) {
    errors.push(`P9 ${role} runtime identity changed after entry verification`);
  }
  if (
    config.runtimeIdentityFingerprintSha256 !==
    context.runtimePrincipalFingerprintSha256
  ) {
    errors.push(`P9 ${role} runtime principal differs from the pinned identity`);
  }
  if (role === 'rollback') {
    if (
      config.sourceMode !== 'accepted-p7-static-catalog' ||
      config.productionRead !== null ||
      config.staticCatalog?.sha256 !== context.expectedStaticCatalogSha256
    ) {
      errors.push('P9 rollback runtime config is not the exact accepted P7 static source');
    }
  } else if (
    config.sourceMode !== 'production-google-sheet-read-only' ||
    config.productionRead === null ||
    config.staticCatalog !== null
  ) {
    errors.push(`P9 ${role} runtime config is not the exact read-only production source`);
  }
}

function validateApplicationReadProbe(
  health: z.infer<typeof healthSchema>,
  role: 'cutover' | 'rollback' | 'restored-cutover',
  runtimeCommit: string,
  capture: z.infer<typeof captureSchema>,
  errors: string[],
): void {
  const probe = health.applicationReadProbe;
  const {
    bindingSha256: healthBindingSha256,
    ...healthBindingContent
  } = health.applicationRuntimeBinding;
  if (healthBindingSha256 !== sha256P9Value(healthBindingContent)) {
    errors.push(`P9 ${role} health application runtime binding digest is not derived`);
  }
  if (health.applicationRuntimeBinding.runtimeCommit !== runtimeCommit) {
    errors.push(`P9 ${role} health application runtime binding has the wrong commit`);
  }
  if (role === 'rollback') {
    if (probe !== null) {
      errors.push('P9 rollback application-path read probe must be null');
    }
    return;
  }
  if (probe === null) {
    errors.push(`P9 ${role} requires a deployed application-path read probe`);
    return;
  }
  if (probe.observationId !== sha256P9Value(withoutObservationId(probe))) {
    errors.push(`P9 ${role} application-path read probe ID is not derived`);
  }
  if (probe.nonce !== health.nonce) {
    errors.push(`P9 ${role} application-path read probe nonce does not match health`);
  }
  const { bindingSha256, ...bindingContent } = probe.runtimeBinding;
  if (bindingSha256 !== sha256P9Value(bindingContent)) {
    errors.push(`P9 ${role} application runtime binding digest is not derived`);
  }
  if (probe.runtimeBinding.runtimeCommit !== runtimeCommit) {
    errors.push(`P9 ${role} application runtime binding has the wrong commit`);
  }
  if (
    canonicalP9Json(probe.runtimeBinding) !==
    canonicalP9Json(health.applicationRuntimeBinding)
  ) {
    errors.push(`P9 ${role} probe and health application runtime bindings differ`);
  }
  ordered(
    errors,
    `P9 ${role} application-path read start after capture start`,
    capture.startedAt,
    probe.startedAt,
  );
  ordered(
    errors,
    `P9 ${role} application-path read duration`,
    probe.startedAt,
    probe.completedAt,
  );
  ordered(
    errors,
    `P9 ${role} application-path read before health observation`,
    probe.completedAt,
    health.observedAt,
  );
  boundedDuration(
    errors,
    `P9 ${role} application-path read`,
    probe.startedAt,
    probe.completedAt,
    15 * 60_000,
  );
  boundedDuration(
    errors,
    `P9 ${role} application-path read-to-health`,
    probe.completedAt,
    health.observedAt,
    15 * 60_000,
  );
}

function validateDeploymentObservation(
  observation: z.infer<typeof deploymentObservationSchema>,
  expectedRole: 'cutover' | 'rollback' | 'restored-cutover',
  runtimeCommit: string,
  context: P9EvidenceContext,
  entryReceipt: P9EntryReceipt,
  errors: string[],
): void {
  if (observation.role !== expectedRole) {
    errors.push(`P9 deployment role ${expectedRole} is missing`);
  }
  validatePinnedHostname(
    observation.urlHost,
    context,
    errors,
    `P9 ${expectedRole} production host`,
  );
  if (observation.observationId !== sha256P9Value(withoutObservationId(observation))) {
    errors.push(`P9 ${expectedRole} deployment observation ID is not derived`);
  }
  if (
    observation.gitSource.sha !== runtimeCommit ||
    observation.health.commit !== runtimeCommit ||
    observation.health.deploymentId !== observation.deploymentId
  ) {
    errors.push(`P9 ${expectedRole} provider, Git, and health identities disagree`);
  }
  if (
    observation.health.runtimeConfigSha256 !==
    sha256P9Value(observation.health.runtimeConfig)
  ) {
    errors.push(`P9 ${expectedRole} runtime config fingerprint is not derived`);
  }
  validateRuntimeConfig(
    observation.health.runtimeConfig,
    expectedRole,
    context,
    entryReceipt,
    errors,
  );
  validateApplicationReadProbe(
    observation.health,
    expectedRole,
    runtimeCommit,
    observation.capture,
    errors,
  );
  const jobName =
    expectedRole === 'cutover'
      ? 'cutover-proof'
      : expectedRole === 'rollback'
        ? 'rollback-proof'
        : 'restored-cutover-proof';
  validatePhaseCapture(observation.capture, context, jobName, errors);
  ordered(errors, `P9 ${expectedRole} deployment readiness`, observation.createdAt, observation.readyAt);
  ordered(
    errors,
    `P9 ${expectedRole} proof after readiness`,
    observation.readyAt,
    observation.capture.startedAt,
  );
  ordered(
    errors,
    `P9 ${expectedRole} health after capture start`,
    observation.capture.startedAt,
    observation.health.observedAt,
  );
  ordered(
    errors,
    `P9 ${expectedRole} health before capture completion`,
    observation.health.observedAt,
    observation.capture.completedAt,
  );
  boundedDuration(
    errors,
    `P9 ${expectedRole} READY-to-health`,
    observation.readyAt,
    observation.health.observedAt,
    15 * 60_000,
  );
}

function validateP9DeploymentRecordSemantics(
  record: P9DeploymentRecord,
  entryReceipt: P9EntryReceipt,
  context: P9EvidenceContext,
): string[] {
  const errors: string[] = [];
  validateCommonBinding(errors, record, context, 'finalize');
  validatePinnedProvider(
    record.provider.projectIdSha256,
    record.provider.teamIdSha256,
    context,
    errors,
    'P9 deployment provider',
  );
  validatePinnedRuntimeIdentity(
    entryReceipt.runtimeIdentity,
    context,
    errors,
    'P9 deployment entry dependency',
  );
  if (
    record.provider.projectIdSha256 !==
      entryReceipt.baselineProductionDeployment.projectIdSha256 ||
    record.provider.teamIdSha256 !==
      entryReceipt.baselineProductionDeployment.teamIdSha256
  ) {
    errors.push('P9 deployment provider differs from the authenticated entry provider');
  }
  const observations = [
    record.deployments.cutover,
    record.deployments.rollback,
    record.deployments.restoredCutover,
  ];
  const ids = observations.map((item) => item.deploymentId);
  const nonces = observations.map((item) => item.health.nonce);
  const phaseRuns = observations.map(
    (item) => `${item.capture.runId}:${item.capture.runAttempt}`,
  );
  if (
    new Set(ids).size !== 3 ||
    new Set(nonces).size !== 3 ||
    new Set(phaseRuns).size !== 3
  ) {
    errors.push('P9 cutover, rollback, and restored-cutover proofs must be distinct');
  }
  validateDeploymentObservation(
    record.deployments.cutover,
    'cutover',
    record.runtimeCommit,
    context,
    entryReceipt,
    errors,
  );
  validateDeploymentObservation(
    record.deployments.rollback,
    'rollback',
    record.runtimeCommit,
    context,
    entryReceipt,
    errors,
  );
  validateDeploymentObservation(
    record.deployments.restoredCutover,
    'restored-cutover',
    record.runtimeCommit,
    context,
    entryReceipt,
    errors,
  );
  const cutoverBinding =
    record.deployments.cutover.health.applicationRuntimeBinding;
  const rollbackBinding =
    record.deployments.rollback.health.applicationRuntimeBinding;
  const restoredBinding =
    record.deployments.restoredCutover.health.applicationRuntimeBinding;
  if (
    canonicalP9Json(cutoverBinding) !== canonicalP9Json(rollbackBinding) ||
    canonicalP9Json(cutoverBinding) !== canonicalP9Json(restoredBinding)
  ) {
    errors.push('P9 cutover, rollback, and restored application runtime bindings differ');
  }
  finishedBefore(
    errors,
    'P9 entry before cutover',
    entryReceipt.capture.completedAt,
    record.deployments.cutover.createdAt,
  );
  finishedBefore(
    errors,
    'P9 cutover phase proof before rollback',
    record.deployments.cutover.capture.completedAt,
    record.deployments.rollback.createdAt,
  );
  boundedDuration(
    errors,
    'P9 cutover-to-rollback',
    record.deployments.cutover.capture.completedAt,
    record.deployments.rollback.createdAt,
    24 * 60 * 60_000,
  );
  finishedBefore(
    errors,
    'P9 rollback phase proof before restored cutover',
    record.deployments.rollback.capture.completedAt,
    record.deployments.restoredCutover.createdAt,
  );
  boundedDuration(
    errors,
    'P9 rollback-to-restored-cutover',
    record.deployments.rollback.capture.completedAt,
    record.deployments.restoredCutover.createdAt,
    24 * 60 * 60_000,
  );
  boundedDuration(
    errors,
    'P9 entry-to-cutover',
    entryReceipt.capture.completedAt,
    record.deployments.cutover.createdAt,
    24 * 60 * 60_000,
  );
  finishedBefore(
    errors,
    'P9 restored-cutover proof before deployment aggregation',
    record.deployments.restoredCutover.capture.completedAt,
    record.capture.startedAt,
  );
  boundedDuration(
    errors,
    'P9 restored-cutover-to-finalize',
    record.deployments.restoredCutover.capture.completedAt,
    record.capture.startedAt,
    24 * 60 * 60_000,
  );
  boundedDuration(
    errors,
    'P9 complete entry-to-finalize chain',
    entryReceipt.capture.completedAt,
    record.capture.startedAt,
    72 * 60 * 60_000,
  );
  ordered(
    errors,
    'P9 deployment proof completion',
    record.deployments.restoredCutover.health.observedAt,
    record.capture.completedAt,
  );
  return errors;
}

export function validateP9DeploymentRecordV2(
  value: unknown,
  entryReceipt: P9EntryReceipt,
  context: P9EvidenceContext,
  receiptSha256: string,
  attestation: P9AttestationVerification | null,
): string[] {
  const parsed = P9DeploymentRecordSchema.safeParse(value);
  if (!parsed.success) return formatZodError('P9 deployment record', parsed.error);
  const errors = validateP9DeploymentRecordSemantics(
    parsed.data,
    entryReceipt,
    context,
  );
  validateAttestation(
    errors,
    P9_DEPLOYMENT_EVIDENCE_PATH,
    receiptSha256,
    parsed.data.capture.workflowCommit,
    attestation,
  );
  return errors;
}

function validateP9PostCutoverReceiptSemantics(
  receipt: P9PostCutoverReceipt,
  entryReceipt: P9EntryReceipt,
  deploymentRecord: P9DeploymentRecord,
  context: P9EvidenceContext,
): string[] {
  const errors: string[] = [];
  validateCommonBinding(errors, receipt, context, 'finalize');
  if (canonicalP9Json(receipt.capture) !== canonicalP9Json(deploymentRecord.capture)) {
    errors.push('P9 aggregate receipts were not produced by the same finalize job');
  }
  if (
    receipt.runtimeCommit !== deploymentRecord.runtimeCommit
  ) {
    errors.push('P9 post-cutover proof is rebound to a different runtime commit');
  }
  validatePinnedProvider(
    deploymentRecord.provider.projectIdSha256,
    deploymentRecord.provider.teamIdSha256,
    context,
    errors,
    'P9 post-cutover provider',
  );
  validatePinnedRuntimeIdentity(
    entryReceipt.runtimeIdentity,
    context,
    errors,
    'P9 post-cutover entry dependency',
  );
  const expectedIds = {
    cutover: deploymentRecord.deployments.cutover.observationId,
    rollback: deploymentRecord.deployments.rollback.observationId,
    restoredCutover: deploymentRecord.deployments.restoredCutover.observationId,
  };
  if (canonicalP9Json(receipt.deploymentObservationIds) !== canonicalP9Json(expectedIds)) {
    errors.push('P9 post-cutover proof is not bound to all three deployment observations');
  }
  const expectedPhases = [
    ['after-cutover-smoke', deploymentRecord.deployments.cutover],
    ['after-rollback-proof', deploymentRecord.deployments.rollback],
    ['after-restored-cutover', deploymentRecord.deployments.restoredCutover],
  ] as const;
  receipt.sourceObservations.forEach((item, index) => {
    const [phase, deployment] = expectedPhases[index];
    validatePinnedHostname(
      deployment.urlHost,
      context,
      errors,
      `P9 ${phase} production host`,
    );
    validatePinnedCaptureEnvironment(
      deployment.capture,
      context,
      errors,
      `P9 ${phase} capture`,
    );
    if (
      deployment.health.runtimeConfig.runtimeIdentityFingerprintSha256 !==
      context.runtimePrincipalFingerprintSha256
    ) {
      errors.push(`P9 ${phase} runtime principal differs from the pinned identity`);
    }
    if (item.phase !== phase || item.deploymentId !== deployment.deploymentId) {
      errors.push(`P9 source reconciliation phase ${index + 1} is rebound`);
    }
    ordered(
      errors,
      `P9 ${phase} source observation`,
      deployment.health.observedAt,
      item.observation.startedAt,
    );
    ordered(
      errors,
      `P9 ${phase} source observation after phase start`,
      deployment.capture.startedAt,
      item.observation.startedAt,
    );
    ordered(
      errors,
      `P9 ${phase} source observation before phase completion`,
      item.observation.completedAt,
      deployment.capture.completedAt,
    );
    boundedDuration(
      errors,
      `P9 ${phase} health-to-source`,
      deployment.health.observedAt,
      item.observation.startedAt,
      15 * 60_000,
    );
    if (
      item.observation.sharingBeforeSha256 !==
        entryReceipt.sourceObservation.sharingBeforeSha256 ||
      item.observation.sharingAfterSha256 !==
        entryReceipt.sourceObservation.sharingAfterSha256
    ) {
      errors.push(`P9 ${phase} sharing fingerprint differs from entry`);
    }
    if (
      item.observation.backupReadPrincipalFingerprintSha256 !==
        entryReceipt.runtimeIdentity.principalFingerprintSha256 ||
      item.observation.backupReadPrincipalFingerprintSha256 !==
        context.runtimePrincipalFingerprintSha256 ||
      canonicalP9Json(item.observation.runtimePrincipalPermission) !==
        canonicalP9Json(entryReceipt.sourceObservation.runtimePrincipalPermission)
    ) {
      errors.push(`P9 ${phase} runtime reader permission differs from entry`);
    }
    if (
      item.observation.tabs.some(
        (tab, tabIndex) =>
          tab.sourceCanonicalCellPayloadSha256 !==
          entryReceipt.sourceObservation.tabs[tabIndex]
            .sourceCanonicalCellPayloadSha256,
      )
    ) {
      errors.push(`P9 ${phase} canonical source fingerprint differs from entry`);
    }
    const applicationReadProbe = deployment.health.applicationReadProbe;
    if (deployment.role === 'rollback') {
      if (applicationReadProbe !== null) {
        errors.push(`P9 ${phase} rollback application-path read probe must be null`);
      }
      if (item.observation.applicationReadChallenge !== null) {
        errors.push(`P9 ${phase} rollback independent application challenge must be null`);
      }
    } else if (applicationReadProbe === null) {
      errors.push(`P9 ${phase} deployed application-path read probe is missing`);
    } else {
      const independentChallenge = item.observation.applicationReadChallenge;
      if (!independentChallenge) {
        errors.push(`P9 ${phase} independent application challenge is missing`);
      } else if (
        applicationReadProbe.spreadsheetId !== item.observation.spreadsheetId ||
        applicationReadProbe.nonce !== independentChallenge.nonce ||
        applicationReadProbe.domain !== independentChallenge.domain ||
        applicationReadProbe.challengeHashAlgorithm !==
          independentChallenge.hashAlgorithm ||
        canonicalP9Json(applicationReadProbe.tabs) !==
          canonicalP9Json(independentChallenge.tabs)
      ) {
        errors.push(
          `P9 ${phase} nonce-bound application read differs from the independent challenge`,
        );
      }
    }
    validateSourceObservation(item.observation, errors, `P9 ${phase}`);
  });
  const cutoverRuntimeBinding =
    deploymentRecord.deployments.cutover.health.applicationRuntimeBinding;
  const rollbackRuntimeBinding =
    deploymentRecord.deployments.rollback.health.applicationRuntimeBinding;
  const restoredRuntimeBinding =
    deploymentRecord.deployments.restoredCutover.health.applicationRuntimeBinding;
  if (
    canonicalP9Json(cutoverRuntimeBinding) !==
      canonicalP9Json(rollbackRuntimeBinding) ||
    canonicalP9Json(cutoverRuntimeBinding) !==
      canonicalP9Json(restoredRuntimeBinding) ||
    canonicalP9Json(receipt.writeIsolation.runtimeBinding) !==
      canonicalP9Json(cutoverRuntimeBinding) ||
    receipt.writeIsolation.runtimeBinding.runtimeCommit !== receipt.runtimeCommit
  ) {
    errors.push('P9 cross-phase application runtime binding is incomplete or changed');
  }
  const {
    bindingSha256: writeIsolationBindingSha256,
    ...writeIsolationBindingContent
  } = receipt.writeIsolation.runtimeBinding;
  if (
    writeIsolationBindingSha256 !==
    sha256P9Value(writeIsolationBindingContent)
  ) {
    errors.push('P9 write-isolation application runtime binding digest is not derived');
  }
  const testedSurfaces = [...receipt.writeIsolation.surfaces].sort(
    (left, right) => left.path.localeCompare(right.path) || left.id.localeCompare(right.id),
  );
  const requiredSurfaces = [...context.expectedWriteSurfaceInventory].sort(
    (left, right) => left.path.localeCompare(right.path) || left.id.localeCompare(right.id),
  );
  const expectedInventorySha256 = sha256P9Value({
    inventoryMethod: receipt.writeIsolation.inventoryMethod,
    surfaces: requiredSurfaces,
  });
  const expectedTestResults = requiredSurfaces.map((surface) => ({
    id: surface.id,
    path: surface.path,
    mutators: surface.mutators,
    independentlyDerived: true as const,
    probeExport: P9_WRITE_ISOLATION_PROBE_EXPORT,
    probeInvoked: true as const,
    guardedBeforeClientConstruction: true as const,
    negativeTestName: `p9-write-isolation:${surface.id}`,
    attemptedSpreadsheetId: P9_PRODUCTION_SPREADSHEET_ID,
    outcome: 'blocked-before-client-construction',
    guardErrorCode: P9_PRODUCTION_WRITE_BLOCKED_CODE,
    clientConstructions: 0,
    writeCalls: 0,
  }));
  const expectedTestOutputSha256 = sha256P9Value({
    testCommand: receipt.writeIsolation.testCommand,
    testedCommit: receipt.writeIsolation.testedCommit,
    runtimeBinding: receipt.writeIsolation.runtimeBinding,
    surfaces: expectedTestResults,
  });
  const writeIsolationMismatches: string[] = [];
  if (receipt.writeIsolation.testedCommit !== deploymentRecord.runtimeCommit) {
    writeIsolationMismatches.push('runtime commit');
  }
  if (
    receipt.writeIsolation.runtimeStaticCatalogSha256 !==
    context.expectedStaticCatalogSha256
  ) {
    writeIsolationMismatches.push('runtime accepted-P7 catalog bytes');
  }
  if (receipt.writeIsolation.ciRunId !== receipt.capture.runId) {
    writeIsolationMismatches.push('finalize run');
  }
  if (receipt.writeIsolation.discoveredSurfaceCount !== requiredSurfaces.length) {
    writeIsolationMismatches.push('surface count');
  }
  if (receipt.writeIsolation.inventorySha256 !== expectedInventorySha256) {
    writeIsolationMismatches.push('inventory digest');
  }
  if (receipt.writeIsolation.testOutputSha256 !== expectedTestOutputSha256) {
    writeIsolationMismatches.push('negative-test digest');
  }
  if (new Set(testedSurfaces.map((surface) => surface.id)).size !== testedSurfaces.length) {
    writeIsolationMismatches.push('duplicate surface');
  }
  if (
    requiredSurfaces.some(
      (surface) =>
        surface.independentlyDerived !== true ||
        surface.probeExport !== P9_WRITE_ISOLATION_PROBE_EXPORT ||
        surface.guardedBeforeClientConstruction !== true ||
        surface.googleSheetsClientConstructions < 1 ||
        surface.googleSheetsClientConstructions !==
          surface.guardedGoogleSheetsClientConstructions ||
        surface.googleSheetsMutatorCalls < 1,
    )
  ) {
    writeIsolationMismatches.push('independent guard derivation');
  }
  if (canonicalP9Json(testedSurfaces) !== canonicalP9Json(expectedTestResults)) {
    writeIsolationMismatches.push('exact surface results');
  }
  if (writeIsolationMismatches.length > 0) {
    errors.push(
      `P9 write-isolation report is incomplete or rebound: ${writeIsolationMismatches.join(', ')}`,
    );
  }
  ordered(
    errors,
    'P9 write-isolation test',
    receipt.writeIsolation.testStartedAt,
    receipt.writeIsolation.testCompletedAt,
  );
  finishedBefore(
    errors,
    'P9 write-isolation test before finalize capture',
    receipt.writeIsolation.testCompletedAt,
    receipt.capture.startedAt,
  );
  boundedDuration(
    errors,
    'P9 write-isolation test',
    receipt.writeIsolation.testStartedAt,
    receipt.writeIsolation.testCompletedAt,
    30 * 60_000,
  );
  finishedBefore(
    errors,
    'P9 restored-cutover phase before post-cutover aggregation',
    deploymentRecord.deployments.restoredCutover.capture.completedAt,
    receipt.capture.startedAt,
  );
  boundedDuration(
    errors,
    'P9 restored-cutover-to-post-cutover aggregation',
    deploymentRecord.deployments.restoredCutover.capture.completedAt,
    receipt.capture.startedAt,
    24 * 60 * 60_000,
  );
  return errors;
}

export function validateP9PostCutoverReceiptV2(
  value: unknown,
  entryReceipt: P9EntryReceipt,
  deploymentRecord: P9DeploymentRecord,
  context: P9EvidenceContext,
  receiptSha256: string,
  attestation: P9AttestationVerification | null,
): string[] {
  const parsed = P9PostCutoverReceiptSchema.safeParse(value);
  if (!parsed.success) return formatZodError('P9 post-cutover receipt', parsed.error);
  const errors = validateP9PostCutoverReceiptSemantics(
    parsed.data,
    entryReceipt,
    deploymentRecord,
    context,
  );
  if (context.candidateCommittedAt) {
    ordered(
      errors,
      'P9 proof before final candidate',
      parsed.data.capture.completedAt,
      context.candidateCommittedAt,
    );
    boundedDuration(
      errors,
      'P9 final proof to candidate',
      parsed.data.capture.completedAt,
      context.candidateCommittedAt,
      24 * 60 * 60_000,
    );
  }
  validateAttestation(
    errors,
    P9_POST_CUTOVER_EVIDENCE_PATH,
    receiptSha256,
    parsed.data.capture.workflowCommit,
    attestation,
  );
  return errors;
}

const p9ReceiptSetSchema = z.strictObject({
  entry: P9EntryReceiptSchema,
  deployment: P9DeploymentRecordSchema,
  postCutover: P9PostCutoverReceiptSchema,
});

export type P9ReceiptSetV2 = z.input<typeof p9ReceiptSetSchema>;

/**
 * Runs the complete strict-schema and cross-receipt semantic contract inside
 * the trusted finalizer. It intentionally omits only artifact-attestation and
 * final-candidate Git checks, which cannot exist until after receipt creation.
 */
export function validateP9ReceiptSetSemanticsV2(
  receipts: unknown,
  context: P9EvidenceContext,
): string[] {
  const parsed = p9ReceiptSetSchema.safeParse(receipts);
  if (!parsed.success) return formatZodError('P9 receipt set', parsed.error);
  const semanticContext: P9EvidenceContext = {
    ...context,
    candidateCommit: undefined,
    candidateCommittedAt: undefined,
  };
  return [
    ...validateP9EntryReceiptSemantics(parsed.data.entry, semanticContext),
    ...validateP9DeploymentRecordSemantics(
      parsed.data.deployment,
      parsed.data.entry,
      semanticContext,
    ),
    ...validateP9PostCutoverReceiptSemantics(
      parsed.data.postCutover,
      parsed.data.entry,
      parsed.data.deployment,
      semanticContext,
    ),
  ];
}

export function validateP9DeploymentGitBindingV2(
  record: P9DeploymentRecord,
  context: P9EvidenceContext,
  candidateCommit: string,
  probe: P9GitBindingProbe,
): string[] {
  const errors: string[] = [];
  if (context.candidateCommit && candidateCommit !== context.candidateCommit) {
    errors.push('P9 Git binding candidate differs from the validation context');
  }
  for (const commit of [
    context.p9BaselineCommit,
    context.revision7AttestationCommit,
    context.revision7CandidateCommit,
    record.runtimeCommit,
    candidateCommit,
  ]) {
    if (!probe.objectExists(commit)) {
      errors.push(`P9 proof commit does not exist: ${commit}`);
    }
  }
  if (errors.length > 0) return errors;
  if (!probe.isAncestor(context.revision7AttestationCommit, context.p9BaselineCommit)) {
    errors.push('P9 baseline does not contain the accepted Revision 7 attestation');
  }
  if (!probe.isAncestor(context.revision7CandidateCommit, context.revision7AttestationCommit)) {
    errors.push('P9 Revision 7 candidate does not precede its attestation');
  }
  if (
    record.capture.workflowCommit !== context.p9BaselineCommit ||
    record.capture.headSha !== context.p9BaselineCommit
  ) {
    errors.push('P9 trusted workflow is not the exact delivered baseline workflow');
  }
  if (!probe.isAncestor(context.p9BaselineCommit, record.runtimeCommit)) {
    errors.push('P9 runtime commit does not descend from the exact P9 baseline');
  }
  if (!probe.isAncestor(record.runtimeCommit, candidateCommit)) {
    errors.push('P9 runtime commit is not an ancestor of the final candidate');
  }
  if (
    probe.blobSha256(record.runtimeCommit, 'web/fixtures/p7/student-catalog.json') !==
    context.expectedStaticCatalogSha256
  ) {
    errors.push('P9 runtime accepted-P7 catalog bytes differ from the accepted P7 candidate');
  }
  const runtimeChanges = probe.changedRuntimePaths(record.runtimeCommit, candidateCommit);
  if (runtimeChanges.length > 0) {
    errors.push(
      `P9 candidate changed runtime paths after authenticated proof: ${runtimeChanges.join(', ')}`,
    );
  }
  const revision7DeliveryChanges = probe.changedTrustedProofPaths(
    context.revision7CandidateCommit,
    context.p9BaselineCommit,
  );
  if (revision7DeliveryChanges.length > 0) {
    errors.push(
      `P9 delivered trusted proof code differs from accepted Revision 7: ${revision7DeliveryChanges.join(', ')}`,
    );
  }
  const runtimeTrustedChanges = probe.changedTrustedProofPaths(
    context.p9BaselineCommit,
    record.runtimeCommit,
  );
  if (runtimeTrustedChanges.length > 0) {
    errors.push(
      `P9 runtime changed immutable trusted proof code: ${runtimeTrustedChanges.join(', ')}`,
    );
  }
  const candidateTrustedChanges = probe.changedTrustedProofPaths(
    record.runtimeCommit,
    candidateCommit,
  );
  if (candidateTrustedChanges.length > 0) {
    errors.push(
      `P9 final candidate changed immutable trusted proof code: ${candidateTrustedChanges.join(', ')}`,
    );
  }
  return errors;
}

export function receiptSha256(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

export {
  P9_DEPLOYMENT_EVIDENCE_PATH,
  P9_ENTRY_EVIDENCE_PATH,
  P9_POST_CUTOVER_EVIDENCE_PATH,
  P9_RUNTIME_EQUIVALENCE_PATHS,
};
