import assert from 'node:assert/strict';
import { permitsLocalRelevancePreparation as permits } from './interview-relevance-governance';
const blockers = ['PLAN-REV14-awaits-exact-Git-Vercel-effect-authority-or-verified-suppression'];
assert(permits('PLAN-REV14', blockers, false));
assert(!permits('PLAN-REV14', blockers, true));
assert(!permits('PLAN-REV14', [], false));
for (const id of ['PLAN-REV13', 'PLAN-REV15', 'P9']) assert(!permits(id, blockers, false));
assert(!permits('PLAN-REV14', ['PLAN-REV13-awaits-exact-Git-Vercel-effect-authority-or-verified-suppression'], false));
console.log('Relevance local preparation boundary PASS; no hosted authority.');
