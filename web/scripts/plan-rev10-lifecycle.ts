type OrganizerMasterState = {
  verificationStatus: string;
  accessAuthorized: boolean;
  automatedWriteAuthorized: boolean;
  automatedWriteAuthorizationEvidencePath: string | null;
  verificationEvidencePath: string;
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

export function validatePlanRev10Lifecycle(
  transition: PlanRev10LifecycleState,
  p8mStatus: string | undefined,
  p9Status: string | undefined,
): string[] {
  const errors: string[] = [];
  const p8mInFlight = Boolean(p8mStatus && inFlight.has(p8mStatus));
  const p8mAccepted = p8mStatus === 'accepted';
  const p9InFlightOrAccepted = Boolean(
    p9Status && (inFlight.has(p9Status) || p9Status === 'accepted'),
  );
  const master = transition.organizerMaster;
  const runtime = transition.applicationRuntime;

  if (p8mStatus === 'planned') {
    if (
      master.verificationStatus !== 'unverified' ||
      master.accessAuthorized !== false ||
      master.automatedWriteAuthorized !== false ||
      master.automatedWriteAuthorizationEvidencePath !== null ||
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
  } else if (p8mInFlight || p8mAccepted) {
    if (
      !['unverified', 'verified'].includes(master.verificationStatus) ||
      master.accessAuthorized !== true ||
      master.verificationEvidencePath !== 'docs/evidence/P8M.md'
    ) {
      errors.push('In-flight or accepted P8M requires authorized master access and P8M verification evidence');
    }
    if (master.automatedWriteAuthorized && !master.automatedWriteAuthorizationEvidencePath) {
      errors.push('P8M automated write authority requires its separate direct evidence path');
    }
    if (!master.automatedWriteAuthorized && master.automatedWriteAuthorizationEvidencePath !== null) {
      errors.push('P8M no-write state must not claim automated-write authority evidence');
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
        !publicationCorePinned)
    ) {
      errors.push('Accepted P8M requires verified master identity and complete immutable publication pins');
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
      !/^[0-9a-f]{40}$/.test(runtime.runtimeCommit ?? '') ||
      !/^[0-9a-f]{64}$/.test(runtime.providerProjectFingerprintSha256 ?? '') ||
      !/^[0-9a-f]{64}$/.test(runtime.providerTeamFingerprintSha256 ?? '') ||
      !/^[0-9a-f]{64}$/.test(runtime.canonicalProductionHostnameSha256 ?? '') ||
      !/^[0-9a-f]{64}$/.test(runtime.verificationEnvironmentFingerprintSha256 ?? '') ||
      !runtime.runtimeReadAuthorityEvidencePath ||
      !runtime.deploymentOwner?.trim() ||
      !runtime.rollbackOwner?.trim()
    ) {
      errors.push('Replacement P9 requires accepted P8M publication, direct runtime authority, and all provider/runtime pins');
    }
  } else if (runtime.runtimeReadAuthorityStatus !== 'not_authorized') {
    errors.push('Runtime publication-read authority must remain absent before replacement P9');
  }
  return errors;
}
