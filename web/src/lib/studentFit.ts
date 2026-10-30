import { chipLabel, employerChipMatchesAward, differentiationHits } from './differentiation';
import type { InterviewAnswers } from './interviewMatcher';
import { relevanceByAward, selectedRelevanceAnswers, type PreferenceReason } from './interviewRelevance';
import type { StudentAward } from './studentCatalog';

/** Choices that used to be saved but never became a Fits you label. */
export const DIRECT_FIT_CHOICES = [
  { id: 'financial_need', label: 'Family money' },
  { id: 'leadership', label: 'I lead a team or club' },
  { id: 'work_experience', label: 'I have a job' },
  { id: 'caregiving', label: 'I help care for my family' },
  { id: 'service', label: 'I help in my community' },
  { id: 'black_african_american', label: 'Black or African American' },
  { id: 'hispanic_latino', label: 'Hispanic or Latino' },
  { id: 'chronic_health', label: 'Long-term health issue' },
] as const;

export type FitExplanation = { label: string; message: string };

function choiceTagMatches(id: (typeof DIRECT_FIT_CHOICES)[number]['id'], award: StudentAward): boolean {
  if (id === 'financial_need') return award.needBased === true;
  if (id === 'caregiving') return (award.lifeSituation ?? []).includes('caregiving');
  if (id === 'black_african_american') return (award.heritage ?? []).includes('Black or African American');
  if (id === 'hispanic_latino') return (award.heritage ?? []).includes('Hispanic or Latino');
  if (id === 'chronic_health') return (award.health ?? []).includes('chronic illness');
  return false;
}

/** Keep a specific employer chip from lighting every employer award. */
export function preferenceReasonsForAward(
  award: StudentAward,
  answers: InterviewAnswers,
  reasonsByAward: ReadonlyMap<string, readonly PreferenceReason[]>,
): PreferenceReason[] {
  const reasons = [...(reasonsByAward.get(award.publicId) ?? [])];
  const ties = answers.differentiation?.familyTies ?? [];
  const specific = ties.filter((value) => value.startsWith('employer:'));
  if (specific.length === 0 || ties.includes('employer')) return reasons;
  if (employerChipMatchesAward(award, specific)) return reasons;
  return reasons.filter((reason) => reason.answerId !== 'company_employee');
}

/**
 * Labels and Details reasons come from this list.
 * A choice adds a label only. It never removes an award.
 */
export function studentFitExplanations(
  award: StudentAward,
  answers: InterviewAnswers | null,
  reasonsByAward?: ReadonlyMap<string, readonly PreferenceReason[]>,
): FitExplanation[] {
  if (!answers) return [];
  const map = reasonsByAward ?? relevanceByAward(answers);
  const reasons = preferenceReasonsForAward(award, answers, map);
  const selected = selectedRelevanceAnswers(answers);
  const items: FitExplanation[] = [];
  const seen = new Set<string>();
  const add = (label: string, message: string) => {
    if (seen.has(label)) return;
    seen.add(label);
    items.push({ label, message });
  };
  const profile = answers.differentiation;
  if (profile) {
    for (const label of differentiationHits(award, profile)) add(label, `Fits you: ${label}.`);
  }
  const byAnswer = new Map<string, PreferenceReason>();
  for (const reason of reasons) {
    if (!byAnswer.has(reason.answerId)) byAnswer.set(reason.answerId, reason);
  }
  for (const choice of DIRECT_FIT_CHOICES) {
    if (!selected.has(choice.id)) continue;
    const connection = byAnswer.get(choice.id);
    if (!connection && !choiceTagMatches(choice.id, award)) continue;
    add(choice.label, connection?.message ?? `Fits you: ${choice.label}.`);
  }
  const employerReason = byAnswer.get('company_employee');
  if (employerReason && profile) {
    for (const item of items) {
      const named = profile.familyTies.some((value) => value.startsWith('employer:') && item.label === chipLabel(value));
      if (named) item.message = employerReason.message;
    }
  }
  return items;
}

export function studentFitLabels(
  award: StudentAward,
  answers: InterviewAnswers | null,
  reasonsByAward?: ReadonlyMap<string, readonly PreferenceReason[]>,
): string[] {
  return studentFitExplanations(award, answers, reasonsByAward).map((item) => item.label);
}
