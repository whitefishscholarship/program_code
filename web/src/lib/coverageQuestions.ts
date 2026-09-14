// Discovery choices are separate from the frozen accepted-fact taxonomy.
export const COVERAGE_INTERESTS = [
  { id: 'education_teaching', label: 'Education / Teaching', detail: 'Explore recorded education and teaching opportunities. Some awards list education as one option or a preference; check each award’s college and program requirements.' },
] as const;
export const STUDENT_ORGANIZATIONS = [
  { id: 'nths', label: 'National Technical Honor Society (NTHS)' },
  { id: 'ffa', label: 'FFA' },
  { id: 'bpa', label: 'Business Professionals of America (BPA)' },
  { id: 'deca', label: 'DECA' },
  { id: 'fbla', label: 'Future Business Leaders of America (FBLA)' },
  { id: 'fccla', label: 'Family, Career and Community Leaders of America (FCCLA)' },
  { id: 'hosa', label: 'HOSA' },
  { id: 'skillsusa', label: 'SkillsUSA' },
  { id: 'tsa', label: 'Technology Student Association (TSA)' },
] as const;
export const FINANCIAL_NEED_INTEREST = [
  ['yes', 'Yes'], ['no', 'No'], ['not_sure', 'Not sure'], ['prefer_not_to_answer', 'Prefer not to answer'],
] as const;
export const ORGANIZATION_RESPONSES = ['selected', 'none', 'not_sure', 'prefer_not_to_answer'] as const;
