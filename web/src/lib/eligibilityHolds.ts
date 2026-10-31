/**
 * GPA and school rules Kelsey has decided.
 * `apply: false` means the finder does not use that rule.
 * `apply: true` means the finder uses the rule stored on the award.
 */
export type EligibilityHold = {
  id: string;
  name: string;
  reason: string;
  apply: boolean;
};

export type AwardNotice = {
  id: string;
  label: string;
  /** A college-only label is not a Fits you match for a high school senior. */
  collegeOnly: boolean;
};

export const PELL_PROMISE_URL = 'https://www.carroll.edu/admission-aid/financial-aid/types-aid/pell-promise';

export const GPA_RULE_HOLDS: readonly EligibilityHold[] = [
  {
    id: 'award-29b2feca960c',
    name: 'Krystal and Franklin H. Noble Endowed Scholarship',
    reason: 'The page lists a 2.75 GPA or an ACT 22 or SAT 1100. The form does not ask for test scores. A 22 ACT or 1100 SAT also qualifies.',
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
    reason: 'Carroll College uses a 3.0 GPA to enter.',
    apply: true,
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
    reason: 'The page requires a 2.5 GPA.',
    apply: true,
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
    reason: 'A 2.0 GPA applies to a high school senior or a college undergraduate.',
    apply: true,
  },
  {
    id: 'award-bb295b2828b5',
    name: 'Dr. Max L Amberson Ag Education Scholarship',
    reason: 'A 2.0 GPA applies to a high school senior or a college freshman.',
    apply: true,
  },
  {
    id: 'award-dd3cf3aeab83',
    name: 'W. Ralph Peck Memorial Scholarship',
    reason: 'A 3.0 GPA is required.',
    apply: true,
  },
];

export const SCHOOL_RULE_HOLDS: readonly EligibilityHold[] = [
  {
    id: 'award-dd3cf3aeab83',
    name: 'W. Ralph Peck Memorial Scholarship',
    reason: 'Trades or agricultural science. A trade program and a four-year program both count.',
    apply: true,
  },
];

/** Shown on the card. These are not Fits you labels. */
export const AWARD_NOTICES: readonly AwardNotice[] = [
  {
    id: 'award-29b2feca960c',
    label: 'A 22 ACT or 1100 SAT also qualifies',
    collegeOnly: false,
  },
  {
    id: 'award-9c85eb732e7a',
    label: 'After 1 year of college',
    collegeOnly: true,
  },
  {
    id: 'award-cd6e4da18357',
    label: 'College juniors only',
    collegeOnly: true,
  },
  {
    id: 'award-a321ba096da1',
    label: 'MSU Bozeman sophomores and juniors only',
    collegeOnly: true,
  },
  {
    id: 'award-6f66c4a77103',
    label: 'Must be in an A&P program',
    collegeOnly: true,
  },
  {
    id: 'award-82867636c6e1',
    label: 'College engineering students',
    collegeOnly: true,
  },
];

const NOTICES = new Map(AWARD_NOTICES.map((notice) => [notice.id, notice]));

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

export function awardNotice(id: string): AwardNotice | null {
  return NOTICES.get(id) ?? null;
}

export function collegeOnlyAward(id: string): boolean {
  return NOTICES.get(id)?.collegeOnly === true;
}
