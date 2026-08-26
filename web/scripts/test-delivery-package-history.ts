import assert from 'node:assert/strict';

import {
  expectedP2IntegratedPackage,
  isExactP2IntegratedPackage,
  type PackageDocument,
} from './delivery-package-history';

const baseline: PackageDocument = {
  name: 'web',
  scripts: {
    build: 'next build',
    test: 'tsx scripts/test-base.ts && tsx scripts/test-governance-history.ts',
  },
  dependencies: { next: '16.1.6' },
};
const p2Candidate: PackageDocument = {
  name: 'web',
  scripts: {
    build: 'next build',
    'p2:model': 'tsx scripts/p2-data-model.ts',
    'p2:model:check': 'tsx scripts/p2-data-model.ts --check',
    test: 'tsx scripts/test-base.ts && tsx scripts/test-p2-data-model.ts',
  },
  dependencies: { next: '16.1.6' },
};

const expected = expectedP2IntegratedPackage(baseline, p2Candidate);
assert.deepEqual(expected.scripts, {
  build: 'next build',
  test:
    'tsx scripts/test-base.ts && tsx scripts/test-governance-history.ts && tsx scripts/test-p2-data-model.ts',
  'p2:model': 'tsx scripts/p2-data-model.ts',
  'p2:model:check': 'tsx scripts/p2-data-model.ts --check',
});
assert.equal(isExactP2IntegratedPackage(expected, baseline, p2Candidate), true);

for (const missingCommand of [
  'tsx scripts/test-governance-history.ts',
  'tsx scripts/test-p2-data-model.ts',
]) {
  const changed = structuredClone(expected);
  changed.scripts!.test = changed.scripts!.test
    .split(' && ')
    .filter((command) => command !== missingCommand)
    .join(' && ');
  assert.equal(
    isExactP2IntegratedPackage(changed, baseline, p2Candidate),
    false,
    `removing ${missingCommand} must fail`,
  );
}

const changedDependency = structuredClone(expected);
changedDependency.dependencies = { next: 'changed' };
assert.equal(
  isExactP2IntegratedPackage(changedDependency, baseline, p2Candidate),
  false,
  'changing a non-resolution package field must fail',
);

const changedModelScript = structuredClone(expected);
changedModelScript.scripts!['p2:model:check'] = 'changed';
assert.equal(
  isExactP2IntegratedPackage(changedModelScript, baseline, p2Candidate),
  false,
  'changing a P2 model script must fail',
);

console.log(
  'delivery package history: PASS (baseline governance and exact P2 scripts preserved; omissions and unrelated mutation rejected)',
);
