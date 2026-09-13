import assert from 'node:assert/strict';
import { permitsLocalIntakePreparation as permits } from './intake-governance';
const b = ['PLAN-REV15-awaits-exact-Git-Vercel-effect-authority-or-verified-suppression'];
assert(permits('PLAN-REV15', b, false));
assert(!permits('PLAN-REV15', b, true));
assert(!permits('PLAN-REV15', [], false));
for (const id of ['PLAN-REV14', 'PLAN-REV16', 'P9']) assert(!permits(id, b, false));
assert(!permits('PLAN-REV15', ['PLAN-REV14-awaits-exact-Git-Vercel-effect-authority-or-verified-suppression'], false));
console.log('Intake local preparation boundary PASS; no hosted authority.');
