import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const inventory = fs.readFileSync(
  path.join(repoRoot, 'docs/evidence/PLAN-REV9-interview-inventory.md'),
  'utf8',
);
const plan = fs.readFileSync(
  path.join(repoRoot, 'docs/SCHOLARSHIP_SYSTEM_BUILD_PLAN.md'),
  'utf8',
);
const kickoff = fs.readFileSync(
  path.join(repoRoot, 'docs/kickoffs/P8F-FORMER-INTERVIEW-DETAIL.md'),
  'utf8',
);

const introductionCommit = 'dda6e2ab8b54003191e8f79f72c9f9d5e3fd8de2';
const finalConfigurationCommit = 'f63e55051a08c143e005375fc82f2b1db63501ab';
const newBoostRemovalCommit = 'c97f35a652cbf76c162635ff07554178c4575edd';
const lastActiveCommit = '4c20637a351d272788e24ac9d02e541494644832';

function git(args: string[]): string {
  return execFileSync('git', args, {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trimEnd();
}

function historicalSource(commit: string, sourcePath: string): string {
  return git(['show', `${commit}:${sourcePath}`]);
}

function assertContainsAll(source: string, phrases: string[], label: string): void {
  for (const phrase of phrases) {
    assert(source.includes(phrase), `${label} is missing ${phrase}`);
  }
}

const historicalPaths = {
  active: 'web/src/components/steps/ActiveFactsStep.tsx',
  passive: 'web/src/components/steps/PassiveSignalsStep.tsx',
  wizard: 'web/src/components/InterviewWizard.tsx',
  types: 'web/src/types/wizard.ts',
  processor: 'web/src/lib/processor.ts',
  rules: 'web/src/lib/rulesPack.ts',
  page: 'web/src/app/page.tsx',
} as const;

const expectedLastActiveBlobs: Record<string, string> = {
  [historicalPaths.page]: '61343c9f4f785580bf4a1321a2163ec7c8f35436',
  [historicalPaths.wizard]: 'a183940afeeabecda9b443835c6c1e1b98e0e1d5',
  [historicalPaths.active]: '4442b1bc1c7b26bbebcca9fea1d2c9e5594c2241',
  [historicalPaths.passive]: 'b34a63d8847401a7943349d64167cbeabd37c7fa',
  [historicalPaths.types]: 'a90906ae295108811a5e4d8e35119cb6892be196',
  [historicalPaths.processor]: '436c84e31de39892b9ab5bcb1d518f749e127a89',
  [historicalPaths.rules]: 'f43df3539281637881106bdfd856efa5bd11004e',
};

for (const [sourcePath, expectedBlob] of Object.entries(expectedLastActiveBlobs)) {
  assert.equal(
    git(['rev-parse', `${lastActiveCommit}:${sourcePath}`]),
    expectedBlob,
    `last-active blob drifted for ${sourcePath}`,
  );
}

const activeSource = historicalSource(lastActiveCommit, historicalPaths.active);
const finalPassiveSource = historicalSource(finalConfigurationCommit, historicalPaths.passive);
const finalConfigurationProcessorSource = historicalSource(
  finalConfigurationCommit,
  historicalPaths.processor,
);
const newBoostRemovalProcessorSource = historicalSource(
  newBoostRemovalCommit,
  historicalPaths.processor,
);
const finalTypeSource = historicalSource(lastActiveCommit, historicalPaths.types);
const finalProcessorSource = historicalSource(lastActiveCommit, historicalPaths.processor);
const lastActivePage = historicalSource(lastActiveCommit, historicalPaths.page);
const earlierPassiveSource = historicalSource(introductionCommit, historicalPaths.passive);
const earlierTypeSource = historicalSource(introductionCommit, historicalPaths.types);
const earlierProcessorSource = historicalSource(introductionCommit, historicalPaths.processor);
const earlierRulesSource = historicalSource(introductionCommit, historicalPaths.rules);

assertContainsAll(
  activeSource,
  [
    'Unweighted GPA',
    'State of Residence',
    'Current Educational Status',
    'Target School Type',
    'Have you been accepted to a college yet?',
    'Are you planning to take a gap year?',
    "['Two year', 'Four year', 'Trade', 'Undecided']",
  ],
  'last-active academic source',
);

assertContainsAll(
  finalPassiveSource,
  [
    'Hold a leadership position (Captain, President, Manager)',
    'Have a part-time job or work experience',
    'Have significant caregiving responsibilities at home',
    'Participate in community service or volunteering',
    'Approximately how many volunteer hours have you completed?',
    'passiveSignals.service &&',
    'value="1 to 19"',
    'value="20 to 49"',
    'value="50 to 99"',
    'value="100 plus"',
    'I have acute financial need',
  ],
  'last-active activity source',
);

const specialCriteria = [...finalPassiveSource.matchAll(
  /\{\s*id:\s*'([^']+)',\s*category:\s*'([^']+)',\s*label:\s*'([^']+)'/g,
)].map((match) => ({ id: match[1], category: match[2], label: match[3] }));
assert.equal(specialCriteria.length, 38, 'historical final configuration must contain 38 criteria');
assert.equal(new Set(specialCriteria.map(({ id }) => id)).size, 38, 'criteria IDs must be unique');
for (const criterion of specialCriteria) {
  assert(
    inventory.includes(`| \`${criterion.id}\` | ${criterion.label} |`),
    `inventory is missing historical criterion ${criterion.id}/${criterion.label}`,
  );
}

assert.match(
  earlierPassiveSource,
  /\['Military', 'First Responder', 'Farmers Union', 'Electric Co-op', 'Credit Union', 'Elks Lodge'\]/,
);
const earlierAffiliationOptions = [
  'Military',
  'First Responder',
  'Farmers Union',
  'Electric Co-op',
  'Credit Union',
  'Elks Lodge',
];
const affiliationMigration = new Map<string, string>([
  ['Military', 'military_veteran'],
  ['First Responder', 'first_responder'],
  ['Farmers Union', 'farmers_union'],
  ['Electric Co-op', 'electric_coop'],
  ['Credit Union', 'credit_union'],
  ['Elks Lodge', 'elks_lodge'],
]);

assertContainsAll(
  earlierPassiveSource,
  [
    'Family & Organization Affiliations',
    'Are you or your family affiliated with any of the following?',
    "toggleArrayItem('organization_affiliations', org)",
  ],
  'earlier affiliation source',
);
assert(earlierTypeSource.includes('organization_affiliations: string[];'));
assert(!finalTypeSource.includes('organization_affiliations'), 'final type must remove earlier field');
assert(!finalPassiveSource.includes("toggleArrayItem('organization_affiliations'"));
for (const option of earlierAffiliationOptions) {
  const finalId = affiliationMigration.get(option);
  assert(finalId, `missing migration target for ${option}`);
  assert(
    inventory.includes(`| \`${option}\` | \`${finalId}\` |`),
    `inventory is missing affiliation migration ${option} -> ${finalId}`,
  );
  assert(specialCriteria.some(({ id }) => id === finalId), `final criteria omit ${finalId}`);
}

assertContainsAll(
  earlierProcessorSource,
  [
    'required_orgs',
    'passiveSignals.organization_affiliations.map',
    'if (!hasOrg) return false;',
    "row['New for 2026!']",
    'if (n.is_new) score += 5;',
  ],
  'earlier processor rule source',
);
assertContainsAll(
  finalConfigurationProcessorSource,
  ["row['New for 2026!']", 'if (n.is_new) score += 5;'],
  'final question-configuration processor source',
);
assert(earlierRulesSource.includes('organizations:'), 'earlier organization regex rules missing');
assert.equal(
  git(['rev-parse', `${newBoostRemovalCommit}:${historicalPaths.processor}`]),
  '9200bfa8e255f24719777cbecf358105997c97ed',
  'New-for-2026 removal processor blob drifted',
);
assert(
  !newBoostRemovalProcessorSource.includes('is_new'),
  'c97f35a processor must remove is_new',
);
assert(!finalProcessorSource.includes('is_new'), 'last-active processor unexpectedly retains is_new');

assertContainsAll(
  lastActivePage,
  [
    "fetch('/api/scholarships')",
    'processAndFilter',
    'ScholarshipBrowser',
    'sessionStorage',
    'scholarship_export_payload_v1',
    'downloadAsExcel',
  ],
  'last-active result/export route',
);

const typeOnlyIds = [
  'activeFacts.sat',
  'activeFacts.act',
  'activeFacts.fafsa_complete',
  'passiveSignals.skills',
  'passiveSignals.creative_skills',
  'passiveSignals.background_optional',
  'passiveSignals.constraints',
  'passiveSignals.career_interests',
];
for (const id of typeOnlyIds) {
  assert(inventory.includes(`\`${id}\``), `inventory is missing type-only field ${id}`);
}

assertContainsAll(
  inventory,
  [
    'No commit contains a rendered `ADD` label',
    'identifier `adhd`, label `ADHD`',
    '`first_generation`',
    'First-Generation College',
    'Earlier active standalone affiliation question',
    '`New for 2026!`/`is_new` +5',
    'Hard exclusions in the last active processor',
    'Score and ordering',
    'Historical browse and result/export routes',
    'Required P8F disposition of every former rule',
    '`sessionStorage` matched-row retry payload',
    '`/api/scholarships` legacy `{data}` as matcher input',
  ],
  'Revision 9 inventory',
);

assertContainsAll(
  plan,
  [
    '### P8F — Former interview detail and routing restoration',
    'no distinct ADD question',
    'earlier active standalone',
    '`New for 2026!`/`is_new` +5 rule is explicitly retired',
    'explicit contradictory typed student answer',
    'retained/safely-replaced/retired',
  ],
  'Revision 9 plan',
);

assertContainsAll(
  kickoff,
  [
    'Do not invent a separate ADD question',
    '6 academic prompts',
    '4 activity checkboxes',
    '38 special criteria',
    'earlier standalone affiliation question',
    'type-only fields',
    'Every control must map to one of',
  ],
  'P8F kickoff',
);

console.log(
  `PLAN REV9 INVENTORY TEST PASS pinnedBlobs=${Object.keys(expectedLastActiveBlobs).length} criteria=${specialCriteria.length} earlierAffiliations=${earlierAffiliationOptions.length} typeOnly=${typeOnlyIds.length}`,
);
