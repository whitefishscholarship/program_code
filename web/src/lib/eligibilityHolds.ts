/**
 * GPA and school rules Kelsey has not decided yet.
 * `apply: false` means the finder does not use that rule.
 * Set `apply` to true on one entry when the decision is to enforce it.
 */
export type EligibilityHold = {
  id: string;
  name: string;
  reason: string;
  apply: boolean;
};

export const GPA_RULE_HOLDS: readonly EligibilityHold[] = [
  {
    id: 'award-29b2feca960c',
    name: 'Krystal and Franklin H. Noble Endowed Scholarship',
    reason: 'The page lists a 2.75 GPA or an ACT 22 or SAT 1100. The form does not ask for test scores.',
    apply: false,
  },
  {
    id: 'award-7d262385f5d5',
    name: 'The Gates Scholarship',
    reason: 'The 3.3 GPA is weighted. The form asks for an unweighted GPA.',
    apply: false,
  },
  {
    id: 'award-2179b44d009d',
    name: 'Pell Promise for Montana Students',
    reason: 'The 3.0 looks like a rule for keeping the award, not for getting it.',
    apply: false,
  },
  {
    id: 'award-9c85eb732e7a',
    name: "Elk's William and Sara Jenne' Scholarship Application",
    reason: 'The GPA is a college GPA after one year of college, not a high school GPA.',
    apply: false,
  },
  {
    id: 'award-cd6e4da18357',
    name: 'GBES Sustainability Scholarship',
    reason: 'The GPA is for a college junior, not a high school senior.',
    apply: false,
  },
  {
    id: 'award-9c44b840ed10',
    name: 'Mary Naegeli Memorial Tree Farm Scholarship',
    reason: 'The GPA is for a student already in college full time.',
    apply: false,
  },
  {
    id: 'award-a321ba096da1',
    name: 'P.E.O. Marj Keaton-Margie Mullen Scholarship',
    reason: 'The GPA is for a college sophomore or junior at MSU Bozeman.',
    apply: false,
  },
  {
    id: 'award-6f66c4a77103',
    name: 'American Airlines Aircraft Maintenance Technician Scholarship',
    reason: 'The 3.0 is for a student already in an aviation maintenance program.',
    apply: false,
  },
  {
    id: 'award-82867636c6e1',
    name: 'American Airlines Engineering Scholarship',
    reason: 'The 3.0 is for a student already in an engineering program.',
    apply: false,
  },
  {
    id: 'award-df57e3f6a067',
    name: 'John Kozlowski Memorial Scholarship',
    reason: 'The 2.0 applies to a high school senior or a college undergraduate.',
    apply: false,
  },
  {
    id: 'award-bb295b2828b5',
    name: 'Dr. Max L Amberson Ag Education Scholarship',
    reason: 'The 2.0 applies to a high school senior or a college freshman.',
    apply: false,
  },
];

export const SCHOOL_RULE_HOLDS: readonly EligibilityHold[] = [
  {
    id: 'award-dd3cf3aeab83',
    name: 'W. Ralph Peck Memorial Scholarship',
    reason: 'Stored as trade only, but the summary says trades or agricultural science.',
    apply: false,
  },
];

function held(holds: readonly EligibilityHold[], id: string): boolean {
  const hold = holds.find((item) => item.id === id);
  return hold != null && hold.apply === false;
}

export function gpaRuleHeld(id: string): boolean {
  return held(GPA_RULE_HOLDS, id);
}

export function schoolRuleHeld(id: string): boolean {
  return held(SCHOOL_RULE_HOLDS, id);
}
