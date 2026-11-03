import { R3_SHORTLIST_ROWS, R3_CONNECTIONS, type DiscoveryConnection } from './r3Catalog';
import { gpaRuleHeld, schoolRuleHeld } from './eligibilityHolds';
import { relevanceByAward } from './interviewRelevance';
import { SHORTLIST_ID_RELINKS } from './shortlistRelinks';
import { preferenceReasonsForAward } from './studentFit';
import { z } from 'zod';
import publicationJson from '../../fixtures/shortlist/spreadsheet-shortlist-v1.json';
import pin from '../../fixtures/shortlist/pin.json';
import { InterviewAnswersSchema, type InterviewAnswers, type AwardMatchResult, type MatchResponse } from './interviewMatcher';
import type { StudentAward } from './studentCatalog';

const RowSchema = z.strictObject({
  sourceRow: z.number().int().min(2).max(198), targetKind: z.enum(['award', 'portal']), targetId: z.string(),
  minimumGpa: z.number().min(0).max(4).nullable(),
  schoolTypes: z.array(z.enum(['two_year', 'four_year', 'trade_vocational'])),
  applicationPreference: z.enum(['offline', 'direct_per_award', 'automatic_consideration']).nullable(),
});
export const SHORTLIST_PUBLICATION = z.strictObject({
  schemaVersion: z.literal(1), id: z.literal('spreadsheet-shortlist-v1-rev225'),
  basis: z.literal('organizer_recorded_not_officially_verified'), snapshotDate: z.literal('2026-09-02'), sourceRevision: z.literal('225'),
  sourceSha256: z.string(), reviewSha256: z.string(),
  counts: z.strictObject({ sourceRows: z.literal(197), awardRows: z.literal(176), portalRows: z.literal(21), catalogAwards: z.literal(192), catalogOnlyAwards: z.literal(16), gpaRules: z.number().int(), schoolRules: z.number().int() }),
  rows: z.array(RowSchema).length(197),
}).parse(publicationJson);
export const SHORTLIST_SHA256 = pin.sha256;
export type ShortlistRow = z.infer<typeof RowSchema>;
export type ShortlistDecision = 'recorded_fit' | 'needs_checking' | 'recorded_mismatch';
export type ShortlistResult = Omit<AwardMatchResult, 'decision'> & { decision: ShortlistDecision; relevant: boolean };
export type DisplayResult = AwardMatchResult | ShortlistResult;
export const SHORTLIST_NOTICE = 'Uses organizer records captured September 14, 2026, while preserving previously reviewed rules for existing awards. GPA and school type can narrow the shortlist where recorded; supported interests, experiences, optional personal connections and application preferences can bring awards forward with explanations. These connections never remove an award or confirm eligibility. Confirm current requirements and availability before applying.';

export type ResultScope = 'recommended' | 'conflicts' | 'all';

/** My matches leaves out recorded conflicts. May not fit keeps only those conflicts. */
export function awardsForResultScope<T extends { decision: string }>(results: readonly T[], scope: ResultScope): T[] {
  if (scope === 'recommended') return results.filter((result) => result.decision !== 'known_conflict' && result.decision !== 'recorded_mismatch');
  if (scope === 'conflicts') return results.filter((result) => result.decision === 'known_conflict' || result.decision === 'recorded_mismatch');
  return [...results];
}

const SCHOOL_LABELS = { two_year: 'two-year', four_year: 'four-year', trade_vocational: 'trade/vocational' } as const;
type ComparedSchool = keyof typeof SCHOOL_LABELS;

function awardSchoolTypes(award: StudentAward): ComparedSchool[] {
  const found = new Set<ComparedSchool>();
  for (const type of award.eligibility.schoolTypes) {
    if (type === 'two_year' || type === 'four_year') found.add(type);
    else if (type === 'trade') found.add('trade_vocational');
  }
  return [...found];
}

function rowsByAward(rows: readonly ShortlistRow[]): Map<string, ShortlistRow> {
  const byId = new Map<string, ShortlistRow>();
  for (const row of rows) {
    if (row.targetKind !== 'award') continue;
    if (!byId.has(row.targetId)) byId.set(row.targetId, row);
    const linked = SHORTLIST_ID_RELINKS[row.targetId];
    if (linked && !byId.has(linked)) byId.set(linked, row);
  }
  return byId;
}

/** The award's own eligibility wins. The shortlist row is only the backup. Held rules stay off. */
export function comparedGpa(award: StudentAward, row: ShortlistRow | undefined): number | null {
  if (gpaRuleHeld(award.publicId)) return null;
  if (award.eligibility.minimumGpa != null) return award.eligibility.minimumGpa;
  return row?.minimumGpa ?? null;
}

/** Trades or agricultural science. A trade program and a four-year program both count. */
const WIDENED_SCHOOLS: Readonly<Record<string, readonly ComparedSchool[]>> = {
  'award-dd3cf3aeab83': ['trade_vocational', 'four_year'],
};

export function comparedSchoolTypes(award: StudentAward, row: ShortlistRow | undefined): ComparedSchool[] {
  if (schoolRuleHeld(award.publicId)) return [];
  const widened = WIDENED_SCHOOLS[award.publicId];
  if (widened) return [...widened];
  const own = awardSchoolTypes(award);
  if (own.length > 0) return own;
  return row?.schoolTypes ? [...row.schoolTypes] : [];
}

export function shortlistAwards(awards: readonly StudentAward[], rawAnswers: InterviewAnswers, rows: readonly ShortlistRow[] = R3_SHORTLIST_ROWS, additionalConnections: readonly DiscoveryConnection[] = R3_CONNECTIONS): { counts: MatchResponse['counts']; results: ShortlistResult[] } {
  const answers = InterviewAnswersSchema.parse(rawAnswers);
  const relevance = relevanceByAward(answers, additionalConnections);
  const byId = rowsByAward(rows);
  const chosenSchools = answers.targetSchoolTypes.filter(type => type !== 'undecided');
  const results = awards.map(award => {
    const row = byId.get(award.publicId);
    const reasons: AwardMatchResult['reasons'] = [];
    let fits = 0, mismatch = false;
    const minimumGpa = comparedGpa(award, row);
    if (minimumGpa != null) {
      const below = answers.gpa < minimumGpa;
      mismatch ||= below;
      if (!below) fits++;
      reasons.push({ code: 'recorded_gpa', kind: 'verification_needed', message: `The minimum GPA for this award is ${minimumGpa}. ${below ? 'Your answer is below that minimum.' : 'Your answer meets that minimum.'} Confirm the required GPA scale and the current rule.` });
    }
    const schoolTypes = comparedSchoolTypes(award, row);
    if (schoolTypes.length && chosenSchools.length) {
      const overlaps = chosenSchools.some(type => schoolTypes.includes(type));
      // Undecided means another education path remains possible, even alongside a concrete choice.
      const outside = !overlaps && !answers.targetSchoolTypes.includes('undecided');
      mismatch ||= outside;
      if (overlaps) fits++;
      reasons.push({ code: 'recorded_school', kind: 'verification_needed', message: `This award lists ${schoolTypes.map(type => SCHOOL_LABELS[type]).join(' or ')} study. ${overlaps ? 'At least one selected school type fits.' : outside ? 'Your selected school types differ from this award.' : 'Your undecided plans keep this award in consideration.'}` });
    }
    reasons.push({ code: 'unverified_requirements', kind: 'verification_needed', message: 'Other requirements and the current deadline still need checking. Missing information does not count against you.' });
    const relevanceReasons = preferenceReasonsForAward(award, answers, relevance);
    if (mismatch) reasons.push(...relevanceReasons);
    else reasons.unshift(...relevanceReasons);
    const decision: ShortlistDecision = mismatch ? 'recorded_mismatch' : fits ? 'recorded_fit' : 'needs_checking';
    return { award, decision, reasons, relevant: relevanceReasons.length > 0 };
  }).sort((a,b) => {
    const tier = { recorded_fit: 0, needs_checking: 1, recorded_mismatch: 2 };
    return Number(a.decision === 'recorded_mismatch') - Number(b.decision === 'recorded_mismatch') || Number(b.relevant) - Number(a.relevant) || tier[a.decision] - tier[b.decision] || a.award.name.localeCompare(b.award.name) || a.award.publicId.localeCompare(b.award.publicId);
  });
  return { results, counts: { match: results.filter(r => r.decision === 'recorded_fit').length, possibleMatch: results.filter(r => r.decision === 'needs_checking').length, knownConflict: results.filter(r => r.decision === 'recorded_mismatch').length, total: results.length } };
}
