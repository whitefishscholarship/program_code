import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';

export type HistoricalPlanAmendment = {
  id: string;
};

export type HistoricalMergeAuthorization = {
  stageId: string;
};

export function planRevisionFromAmendmentId(id: string): number {
  return Number(/^PLAN-REV(\d+)$/.exec(id)?.[1] ?? 0);
}

export function maximumAttestedPlanRevision(
  amendments: HistoricalPlanAmendment[],
): number {
  return amendments.reduce(
    (maximum, amendment) => Math.max(maximum, planRevisionFromAmendmentId(amendment.id)),
    0,
  );
}

export function changedAttestedPlanAmendment<T extends HistoricalPlanAmendment>(
  currentAmendments: T[],
  historicallyAttestedAmendments: T[],
): string | undefined {
  for (const historicalAmendment of historicallyAttestedAmendments) {
    const currentAmendment = currentAmendments.find(
      (item) => item.id === historicalAmendment.id,
    );
    if (!currentAmendment || !isDeepStrictEqual(currentAmendment, historicalAmendment)) {
      return historicalAmendment.id;
    }
  }
  return undefined;
}

export function changedStandingAuthorization<T extends HistoricalMergeAuthorization>(
  currentAuthorizations: T[],
  canonicalAuthorizations: T[],
  stageIds: string[],
): string | undefined {
  for (const stageId of stageIds) {
    const current = currentAuthorizations.find((item) => item.stageId === stageId);
    const canonical = canonicalAuthorizations.find((item) => item.stageId === stageId);
    if (!current || !canonical || !isDeepStrictEqual(current, canonical)) {
      return stageId;
    }
  }
  return undefined;
}

export function sha256Text(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}
