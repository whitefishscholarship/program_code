type OrganizerMasterState = {
  verificationStatus: string;
  accessAuthorized: boolean;
  automatedWriteAuthorized: boolean;
  automatedWriteAuthorizationEvidencePath: string | null;
  automatedWriteAcceptanceEvidencePath: string | null;
  verificationEvidencePath: string;
};

export type P8mAcceptanceBinding = {
  candidateCommit: string;
  attestationCommit: string;
  manifestPath: string;
  reviewPath: string;
};

type RuntimePublicationState = {
  publicationStatus: string;
  runtimeReadAuthorityStatus: string;
  publicationPath: string | null;
  publicationSha256: string | null;
  publicationSchemaVersion: string | null;
  sourceMasterRevision: string | null;
  acceptedFactSha256: string | null;
  generatorSha256: string | null;
  runtimeCommit: string | null;
  providerProjectFingerprintSha256: string | null;
  providerTeamFingerprintSha256: string | null;
  canonicalProductionHostnameSha256: string | null;
  verificationEnvironmentFingerprintSha256: string | null;
  runtimeReadAuthorityEvidencePath: string | null;
  deploymentOwner: string | null;
  rollbackOwner: string | null;
};

export type PlanRev10LifecycleState = {
  organizerMaster: OrganizerMasterState;
  applicationRuntime: RuntimePublicationState;
};

const inFlight = new Set(['active', 'implemented', 'verified']);
const stopped = new Set(['blocked-external', 'failed']);

export function validatePlanRev10Lifecycle(
  transition: PlanRev10LifecycleState,
  p8mStatus: string | undefined,
  p9Status: string | undefined,
  p8mAcceptanceBinding: P8mAcceptanceBinding | null = null,
): string[] {
  const errors: string[] = [];
  const p8mInFlight = Boolean(p8mStatus && inFlight.has(p8mStatus));
  const p8mAccepted = p8mStatus === 'accepted';
  const p8mStopped = Boolean(p8mStatus && stopped.has(p8mStatus));
  const p9InFlightOrAccepted = Boolean(
    p9Status && (inFlight.has(p9Status) || p9Status === 'accepted'),
  );
  const p9Stopped = Boolean(p9Status && stopped.has(p9Status));
  const master = transition.organizerMaster;
  const runtime = transition.applicationRuntime;
  const runtimeAuthorityPinned =
    /^[0-9a-f]{40}$/.test(runtime.runtimeCommit ?? '') &&
    /^[0-9a-f]{64}$/.test(runtime.providerProjectFingerprintSha256 ?? '') &&
    /^[0-9a-f]{64}$/.test(runtime.providerTeamFingerprintSha256 ?? '') &&
    /^[0-9a-f]{64}$/.test(runtime.canonicalProductionHostnameSha256 ?? '') &&
    /^[0-9a-f]{64}$/.test(runtime.verificationEnvironmentFingerprintSha256 ?? '') &&
    Boolean(runtime.runtimeReadAuthorityEvidencePath) &&
    Boolean(runtime.deploymentOwner?.trim()) &&
    Boolean(runtime.rollbackOwner?.trim());

  if (p8mStatus === 'planned') {
    if (
      master.verificationStatus !== 'unverified' ||
      master.accessAuthorized !== false ||
      master.automatedWriteAuthorized !== false ||
      master.automatedWriteAuthorizationEvidencePath !== null ||
      master.automatedWriteAcceptanceEvidencePath !== null ||
      runtime.publicationStatus !== 'not_created' ||
      runtime.runtimeReadAuthorityStatus !== 'not_authorized' ||
      runtime.publicationPath !== null ||
      runtime.publicationSha256 !== null ||
      runtime.publicationSchemaVersion !== null ||
      runtime.sourceMasterRevision !== null ||
      runtime.acceptedFactSha256 !== null ||
      runtime.generatorSha256 !== null
    ) {
      errors.push('Planned P8M requires the exact unverified, inaccessible, no-write, no-publication state');
    }
  } else if (p8mInFlight || p8mAccepted || p8mStopped) {
    if (
      !['unverified', 'verified'].includes(master.verificationStatus) ||
      (p8mStopped
        ? typeof master.accessAuthorized !== 'boolean'
        : master.accessAuthorized !== true) ||
      master.verificationEvidencePath !== 'docs/evidence/P8M.md'
    ) {
      errors.push('P8M lifecycle state requires valid master access state and P8M verification evidence');
    }
    if (
      master.automatedWriteAuthorized &&
      (!master.automatedWriteAuthorizationEvidencePath ||
        !master.automatedWriteAcceptanceEvidencePath)
    ) {
      errors.push('P8M automated write authority requires separate direct authority and acceptance evidence paths');
    }
    if (
      !master.automatedWriteAuthorized &&
      (master.automatedWriteAuthorizationEvidencePath !== null ||
        master.automatedWriteAcceptanceEvidencePath !== null)
    ) {
      errors.push('P8M no-write state must not claim automated-write authority or acceptance evidence');
    }
    const publicationCorePinned =
      Boolean(runtime.publicationPath?.trim()) &&
      /^[0-9a-f]{64}$/.test(runtime.publicationSha256 ?? '') &&
      Boolean(runtime.publicationSchemaVersion?.trim()) &&
      Boolean(runtime.sourceMasterRevision?.trim()) &&
      /^[0-9a-f]{64}$/.test(runtime.acceptedFactSha256 ?? '') &&
      /^[0-9a-f]{64}$/.test(runtime.generatorSha256 ?? '');
    if (
      p8mAccepted &&
      (master.verificationStatus !== 'verified' ||
        runtime.publicationStatus !== 'accepted_immutable_versioned_publication' ||
        !publicationCorePinned ||
        !p8mAcceptanceBinding ||
        !/^[0-9a-f]{40}$/.test(p8mAcceptanceBinding.candidateCommit) ||
        !/^[0-9a-f]{40}$/.test(p8mAcceptanceBinding.attestationCommit) ||
        p8mAcceptanceBinding.manifestPath !== 'docs/evidence/P8M-manifest.json' ||
        p8mAcceptanceBinding.reviewPath !== 'docs/reviews/P8M.json')
    ) {
      errors.push('Accepted P8M requires verified master identity, complete immutable publication pins, and exact canonical candidate/attestation binding');
    }
    if (
      p8mInFlight &&
      !['not_created', 'candidate_immutable_versioned_publication'].includes(
        runtime.publicationStatus,
      )
    ) {
      errors.push('In-flight P8M publication status is invalid');
    }
    if (
      p8mStopped &&
      !['not_created', 'candidate_immutable_versioned_publication'].includes(
        runtime.publicationStatus,
      )
    ) {
      errors.push('Blocked or failed P8M must remain at no publication or a pinned candidate publication');
    }
    if (
      runtime.publicationStatus === 'candidate_immutable_versioned_publication' &&
      !publicationCorePinned
    ) {
      errors.push('A candidate P8M publication requires complete immutable publication pins');
    }
  } else {
    errors.push(`Unsupported P8M lifecycle state: ${p8mStatus ?? 'missing'}`);
  }

  if (p9InFlightOrAccepted) {
    if (
      !p8mAccepted ||
      runtime.publicationStatus !== 'accepted_immutable_versioned_publication' ||
      runtime.runtimeReadAuthorityStatus !== 'authorized_for_digest_pinned_publication' ||
      !runtimeAuthorityPinned
    ) {
      errors.push('Replacement P9 requires accepted P8M publication, direct runtime authority, and all provider/runtime pins');
    }
  } else if (
    p9Stopped &&
    ![
      'not_authorized',
      'authorized_for_digest_pinned_publication',
    ].includes(runtime.runtimeReadAuthorityStatus)
  ) {
    errors.push('Blocked or failed replacement P9 has an invalid runtime publication-read authority state');
  } else if (
    p9Stopped &&
    runtime.runtimeReadAuthorityStatus ===
      'authorized_for_digest_pinned_publication' &&
    (!p8mAccepted || !runtimeAuthorityPinned)
  ) {
    errors.push('Blocked or failed replacement P9 may preserve runtime authority only with accepted P8M and complete pins');
  } else if (
    !p9Stopped &&
    runtime.runtimeReadAuthorityStatus !== 'not_authorized'
  ) {
    errors.push('Runtime publication-read authority must remain absent before replacement P9');
  }
  return errors;
}
