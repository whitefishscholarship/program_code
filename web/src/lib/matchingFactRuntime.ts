import matchingFactContractJson from '../../fixtures/p8m/matching-fact-contract-v1.json';
import {
  validateMatchingFact,
  type MatchingFactContract,
} from '../../scripts/matching-fact-contract';

export type MatchingFactValue =
  | boolean
  | number
  | string
  | string[]
  | {
      lower: number | string;
      upper: number | string;
      lower_inclusive: boolean;
      upper_inclusive: boolean;
    };

export type AcceptedMatchingFact = {
  award_id: string;
  cycle_id: string | null;
  criterion_id: string;
  effect: 'required' | 'preferred' | 'informational';
  operator: 'eq' | 'neq' | 'in' | 'not_in' | 'gte' | 'lte' | 'between' | 'contains_any' | 'contains_all' | 'exists';
  value: MatchingFactValue;
  evidence_status: 'accepted';
  source_url: string;
  source_revision: string;
  observed_at: string;
  evidence_excerpt: string;
  reviewer_id: string;
  reviewed_at: string;
  review_rationale: string;
  taxonomy_version: '1.0.0';
};

export const P8F_MATCHING_FACT_CONTRACT = matchingFactContractJson as unknown as MatchingFactContract;

export function parseAcceptedMatchingFact(value: unknown): AcceptedMatchingFact {
  const errors = validateMatchingFact(P8F_MATCHING_FACT_CONTRACT, value);
  if (errors.length > 0) throw new Error(`Invalid matching-facts-v1 fact: ${errors.join('; ')}`);
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('Invalid matching-facts-v1 fact: fact must be an object');
  }
  const fact = value as Record<string, unknown>;
  if (fact.evidence_status !== 'accepted') {
    throw new Error('Only accepted matching-facts-v1 facts are available to matching.');
  }
  return value as AcceptedMatchingFact;
}

export function indexAcceptedMatchingFacts(
  values: readonly unknown[],
): Readonly<Record<string, readonly AcceptedMatchingFact[]>> {
  const byAwardId: Record<string, AcceptedMatchingFact[]> = {};
  for (const value of values) {
    const fact = parseAcceptedMatchingFact(value);
    (byAwardId[fact.award_id] ??= []).push(fact);
  }
  return Object.freeze(Object.fromEntries(
    Object.entries(byAwardId).map(([awardId, facts]) => [awardId, Object.freeze(facts)]),
  ));
}
