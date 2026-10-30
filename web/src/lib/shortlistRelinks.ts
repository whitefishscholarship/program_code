/**
 * Old shortlist rows whose award id is gone from the live catalog.
 * Relink only when the current award is clearly the same program.
 * The other 51 missing ids were checked against current names on 2026-10-30.
 * They are removed awards or renamed programs that are not clearly the same,
 * and 51 of those rows store no GPA and no school type.
 * The three orphan relevance connections were checked the same way.
 * Payne Family Impact and the 2024-2025 ADHD award stay unlinked.
 */
export const SHORTLIST_ID_RELINKS: Readonly<Record<string, string>> = {
  // MT Youth Serve Scholarships -> Youth Serve Montana Scholarship.
  // The old row has no GPA or school type. The old service note and the
  // current summary both require about 100 volunteer hours.
  'award-4324fe0c431f': 'award-efb6231ef93f',
};
