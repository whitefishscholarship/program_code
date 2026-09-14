import { R3_SHORTLIST_ROWS, R3_CONNECTIONS, type DiscoveryConnection } from './r3Catalog';
import { relevanceByAward } from './interviewRelevance';
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

export function shortlistAwards(awards: readonly StudentAward[], rawAnswers: InterviewAnswers, rows: readonly ShortlistRow[] = R3_SHORTLIST_ROWS, additionalConnections: readonly DiscoveryConnection[] = R3_CONNECTIONS): { counts: MatchResponse['counts']; results: ShortlistResult[] } {
  const answers = InterviewAnswersSchema.parse(rawAnswers);
  const relevance = relevanceByAward(answers, additionalConnections);
  const byId = new Map(rows.filter(row => row.targetKind === 'award').map(row => [row.targetId, row]));
  const chosenSchools = answers.targetSchoolTypes.filter(type => type !== 'undecided');
  const results = awards.map(award => {
    const row = byId.get(award.publicId);
    const reasons: AwardMatchResult['reasons'] = [];
    let fits = 0, mismatch = false;
    if (row?.minimumGpa !== null && row?.minimumGpa !== undefined) {
      const below = answers.gpa < row.minimumGpa;
      mismatch ||= below;
      if (!below) fits++;
      reasons.push({ code: 'recorded_gpa', kind: 'verification_needed', message: `Saved spreadsheet row ${row.sourceRow} lists a minimum GPA of ${row.minimumGpa}. ${below ? 'Your answer is below that recorded minimum.' : 'Your answer meets that recorded minimum.'} Confirm the required GPA scale and current rule.` });
    }
    if (row?.schoolTypes.length && chosenSchools.length) {
      const overlaps = chosenSchools.some(type => row.schoolTypes.includes(type));
      // Undecided means another education path remains possible, even alongside a concrete choice.
      const outside = !overlaps && !answers.targetSchoolTypes.includes('undecided');
      mismatch ||= outside;
      if (overlaps) fits++;
      const labels = { two_year: 'two-year', four_year: 'four-year', trade_vocational: 'trade/vocational' };
      reasons.push({ code: 'recorded_school', kind: 'verification_needed', message: `Reviewed spreadsheet row ${row.sourceRow} lists ${row.schoolTypes.map(type => labels[type]).join(' or ')} study. ${overlaps ? 'At least one selected school type fits.' : outside ? 'Your selected school types differ from this record.' : 'Your undecided plans keep this award in consideration.'}` });
    }
    const preferred = Boolean(row?.applicationPreference && answers.preferredApplicationModes.includes(row.applicationPreference));
    if (preferred) reasons.push({ code: 'recorded_application_preference', kind: 'preference', message: 'The reviewed application route fits one of your preferences. This affects order only.' });
    reasons.push({ code: 'unverified_requirements', kind: 'verification_needed', message: row ? 'Other eligibility requirements and current availability still need checking. Missing information does not count against you.' : 'This award has no separate row in the saved spreadsheet. No parent requirements have been assumed; it remains available to check.' });
    const relevanceReasons = relevance.get(award.publicId) ?? [];
    reasons.unshift(...relevanceReasons);
    const decision: ShortlistDecision = mismatch ? 'recorded_mismatch' : fits ? 'recorded_fit' : 'needs_checking';
    return { award, decision, reasons, preferred, relevant: relevanceReasons.length > 0 };
  }).sort((a,b) => {
    const tier = { recorded_fit: 0, needs_checking: 1, recorded_mismatch: 2 };
    return Number(a.decision === 'recorded_mismatch') - Number(b.decision === 'recorded_mismatch') || Number(b.relevant) - Number(a.relevant) || tier[a.decision] - tier[b.decision] || Number(b.preferred) - Number(a.preferred) || a.award.name.localeCompare(b.award.name) || a.award.publicId.localeCompare(b.award.publicId);
  }).map(({ preferred: _preferred, ...result }) => result);
  return { results, counts: { match: results.filter(r => r.decision === 'recorded_fit').length, possibleMatch: results.filter(r => r.decision === 'needs_checking').length, knownConflict: results.filter(r => r.decision === 'recorded_mismatch').length, total: results.length } };
}
