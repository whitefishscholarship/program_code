// Discovery choices are separate from the frozen accepted-fact taxonomy.
export const COVERAGE_INTERESTS = [
  { id: 'education_teaching', label: 'Education / Teaching', detail: 'Explore education careers. Current connection: the FVCC early-childhood education program; check its enrollment requirements.' },
] as const;
export const STUDENT_ORGANIZATIONS = [
  { id: 'nths', label: 'National Technical Honor Society (NTHS)' },
  { id: 'ffa', label: 'FFA' },
] as const;
export const FINANCIAL_NEED_INTEREST = [
  ['yes', 'Yes'], ['no', 'No'], ['not_sure', 'Not sure'], ['prefer_not_to_answer', 'Prefer not to answer'],
] as const;
export const ORGANIZATION_RESPONSES = ['selected', 'none', 'not_sure', 'prefer_not_to_answer'] as const;
