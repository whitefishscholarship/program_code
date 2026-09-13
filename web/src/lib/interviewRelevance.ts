import { COVERAGE_PUBLICATION } from './coverageRelevance';
import { z } from 'zod';
import publication from '../../fixtures/relevance/interview-relevance-v1.json';
import pin from '../../fixtures/relevance/pin.json';
import type { InterviewAnswers } from './interviewMatcher';
import { SPECIAL_CRITERIA, ACTIVITY_QUESTIONS } from './interviewQuestions';
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
export function relevanceByAward(answers: InterviewAnswers): ReadonlyMap<string, readonly { code: string; kind: 'preference'; message: string }[]> {
  const selected = selectedRelevanceAnswers(answers);
  const reasons = new Map<string, { code: string; kind: 'preference'; message: string }[]>();
  for (const connection of [...RELEVANCE_PUBLICATION.connections, ...COVERAGE_PUBLICATION.connections]) {
    if (!selected.has(connection.answerId)) continue;
    const current = reasons.get(connection.awardId) ?? [];
    current.push({ code: connection.id, kind: 'preference', message: connection.message });
    reasons.set(connection.awardId, current);
  }
  return reasons;
}
const supported = new Set(RELEVANCE_PUBLICATION.connections.map(c => c.answerId));
export const UNSUPPORTED_SPECIAL_CHOICES = SPECIAL_CRITERIA.filter(item => !supported.has(item.id));
export const UNSUPPORTED_NOTICE = `No current saved-record connection for: ${UNSUPPORTED_SPECIAL_CHOICES.map(item => item.label).join(', ')}. These choices do not affect ordering or remove awards. Residence, educational status, college acceptance, gap-year plans and volunteer-hour ranges also have no effect in this version.`;
