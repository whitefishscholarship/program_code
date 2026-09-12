// Revision16 local preparation only; final attestation and hosted delivery gates remain.
export function permitsLocalCoveragePreparation(id: string, blockers: string[], hosted: boolean): boolean {
  return id === 'PLAN-REV16' && !hosted && blockers.includes('PLAN-REV16-awaits-exact-Git-Vercel-effect-authority-or-verified-suppression');
}
