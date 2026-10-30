import { R3_CONNECTIONS, type DiscoveryConnection } from './r3Catalog';
import { COVERAGE_PUBLICATION } from './coverageRelevance';
import { z } from 'zod';
import publication from '../../fixtures/relevance/interview-relevance-v1.json';
import pin from '../../fixtures/relevance/pin.json';
import type { InterviewAnswers } from './interviewMatcher';
import { SPECIAL_CRITERIA, ACTIVITY_QUESTIONS } from './interviewQuestions';
import { SHORTLIST_ID_RELINKS } from './shortlistRelinks';
const answerIds = new Set<string>([...SPECIAL_CRITERIA, ...ACTIVITY_QUESTIONS].map(item => item.id));
answerIds.add('financial_need');
export const RELEVANCE_PUBLICATION = z.strictObject({
  schemaVersion: z.literal(1), id: z.literal('interview-relevance-v1-rev225'),
  basis: z.literal('organizer_recorded_not_officially_verified'), snapshotDate: z.literal('2026-09-02'), sourceRevision: z.literal('225'),
  connections: z.array(z.strictObject({ id: z.string().min(1), answerId: z.string().refine(id => answerIds.has(id)), awardId: z.string().regex(/^award-[0-9a-f]{12}$/), message: z.string().min(1) })),
}).parse(publication);
export const RELEVANCE_SHA256 = pin.sha256;
const sensitive = new Set<string>(SPECIAL_CRITERIA.filter(item => item.sensitive).map(item => item.id));
sensitive.add('caregiving'); sensitive.add('financial_need');
export function selectedRelevanceAnswers(answers: InterviewAnswers): ReadonlySet<string> {
  const wantsNeed = answers.financialNeedInterest === 'yes' || (answers.financialNeedInterest === undefined && answers.financialNeed);
  const organizations = answers.organizationResponse === 'selected' || answers.organizationResponse === undefined ? answers.studentOrganizations ?? [] : [];
  return new Set([...answers.selectedCriteria, ...answers.activities, ...(answers.discoveryInterests ?? []), ...organizations.map(id => `org_${id}`), ...(wantsNeed ? ['financial_need'] : [])]
    .filter(id => !answers.sensitiveCriteriaSkipped || !sensitive.has(id)));
}
export type PreferenceReason = { code: string; kind: 'preference'; message: string; answerId: string };

export function relevanceByAward(answers: InterviewAnswers, additionalConnections: readonly DiscoveryConnection[] = R3_CONNECTIONS): ReadonlyMap<string, readonly PreferenceReason[]> {
  const selected = selectedRelevanceAnswers(answers);
  const reasons = new Map<string, PreferenceReason[]>();
  const add = (awardId: string, reason: PreferenceReason) => {
    const current = reasons.get(awardId) ?? [];
    current.push(reason);
    reasons.set(awardId, current);
  };
  for (const connection of [...RELEVANCE_PUBLICATION.connections, ...COVERAGE_PUBLICATION.connections, ...additionalConnections]) {
    if (!selected.has(connection.answerId)) continue;
    const reason = { code: connection.id, kind: 'preference' as const, message: connection.message, answerId: connection.answerId };
    add(connection.awardId, reason);
    const linked = SHORTLIST_ID_RELINKS[connection.awardId];
    if (linked && linked !== connection.awardId) add(linked, reason);
  }
  return reasons;
}
const supported = new Set([...RELEVANCE_PUBLICATION.connections, ...COVERAGE_PUBLICATION.connections, ...R3_CONNECTIONS].map(c => c.answerId));
export const UNSUPPORTED_SPECIAL_CHOICES = SPECIAL_CRITERIA.filter(item => !supported.has(item.id));
export const UNSUPPORTED_NOTICE = `No current saved-record connection for: ${UNSUPPORTED_SPECIAL_CHOICES.map(item => item.label).join(', ')}. These choices do not affect ordering or remove awards. Residence, educational status, college acceptance, gap-year plans and volunteer-hour ranges also have no effect in this version.`;
