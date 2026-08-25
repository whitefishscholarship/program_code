import { isDeepStrictEqual } from 'node:util';

export type HistoricalDeliveryState = {
  activeStageId: string | null;
  nextPermittedStageId: string | null;
  stages: unknown[];
  deployment: {
    deliveryIntegrations?: Array<{
      stageId: string;
      status: string;
      deliveryBaselineCommit: string | null;
    }>;
  };
  planRevision?: number;
};

export function expectedDeliveryCandidateState(
  baselineState: HistoricalDeliveryState,
  stageCandidateState: HistoricalDeliveryState,
  stageId: string,
  deliveryBaselineCommit: string,
): HistoricalDeliveryState {
  const expectedState = JSON.parse(JSON.stringify(baselineState)) as HistoricalDeliveryState;
  expectedState.activeStageId = stageCandidateState.activeStageId;
  expectedState.nextPermittedStageId = stageCandidateState.nextPermittedStageId;
  expectedState.stages = stageCandidateState.stages;
  expectedState.deployment.deliveryIntegrations =
    baselineState.deployment.deliveryIntegrations?.map((item) =>
      item.stageId === stageId
        ? {
            ...item,
            status: 'accepted',
            deliveryBaselineCommit,
          }
        : item,
    );
  return expectedState;
}

export function isExactHistoricalDeliveryState(
  deliveredCandidateState: HistoricalDeliveryState,
  baselineState: HistoricalDeliveryState,
  stageCandidateState: HistoricalDeliveryState,
  stageId: string,
  deliveryBaselineCommit: string,
): boolean {
  return isDeepStrictEqual(
    deliveredCandidateState,
    expectedDeliveryCandidateState(
      baselineState,
      stageCandidateState,
      stageId,
      deliveryBaselineCommit,
    ),
  );
}
