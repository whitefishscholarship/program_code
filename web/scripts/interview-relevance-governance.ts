// Exact local preparation exception; no hosted or publication authority.
export function permitsLocalRelevancePreparation(id: string, blockers: string[], hosted: boolean): boolean {
  return id === 'PLAN-REV14' && !hosted && blockers.includes('PLAN-REV14-awaits-exact-Git-Vercel-effect-authority-or-verified-suppression');
}
