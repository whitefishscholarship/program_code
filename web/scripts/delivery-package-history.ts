import { isDeepStrictEqual } from 'node:util';

export type PackageDocument = {
  scripts?: Record<string, string>;
  [key: string]: unknown;
};

function commandSequence(command: string | undefined): string[] {
  return (command ?? '')
    .split(' && ')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function expectedP2IntegratedPackage(
  deliveryBaselinePackage: PackageDocument,
  p2CandidatePackage: PackageDocument,
): PackageDocument {
  const expected = structuredClone(deliveryBaselinePackage);
  const baselineScripts = expected.scripts ?? {};
  const p2Scripts = p2CandidatePackage.scripts ?? {};
  const p2Model = p2Scripts['p2:model'];
  const p2ModelCheck = p2Scripts['p2:model:check'];
  if (!p2Model || !p2ModelCheck) {
    throw new Error('P2 candidate package lacks its required model scripts');
  }

  const mergedTestCommands = commandSequence(baselineScripts.test);
  for (const command of commandSequence(p2Scripts.test)) {
    if (!mergedTestCommands.includes(command)) mergedTestCommands.push(command);
  }
  expected.scripts = {
    ...baselineScripts,
    'p2:model': p2Model,
    'p2:model:check': p2ModelCheck,
    test: mergedTestCommands.join(' && '),
  };
  return expected;
}

export function isExactP2IntegratedPackage(
  integratedPackage: PackageDocument,
  deliveryBaselinePackage: PackageDocument,
  p2CandidatePackage: PackageDocument,
): boolean {
  try {
    return isDeepStrictEqual(
      integratedPackage,
      expectedP2IntegratedPackage(deliveryBaselinePackage, p2CandidatePackage),
    );
  } catch {
    return false;
  }
}
