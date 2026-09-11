// Revision15 only; does not waive final attestation or hosted delivery gates.
export function permitsLocalIntakePreparation(id: string, blockers: string[], hosted: boolean): boolean {
  return id === 'PLAN-REV15' && !hosted && blockers.includes('PLAN-REV15-awaits-exact-Git-Vercel-effect-authority-or-verified-suppression');
}
