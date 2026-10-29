import type { StudentCatalog } from './studentCatalog';
import { plainStudentText } from './studentList';

// Legacy column names, derived from the same selected public awards as the browser.
export function catalogCompatibilityRows(catalog: StudentCatalog) {
  const sources = new Map(catalog.sources.map(source => [source.publicId, source]));
  return catalog.awards.map(award => ({
    publicId: award.publicId,
    'Last Updated': '', 'Due Date': award.cycle.label,
    'In-State / National': award.eligibility.audience, 'Portal/ Scholarship': 'Scholarship',
    Amount: award.amount.label,
    'Scholarship Location/Information': award.sourcePublicIds.map(id => sources.get(id)?.url).filter(Boolean).join('; '),
    'Name of Scholarship': award.name, 'Application Link/Method': award.application.url ?? award.application.label,
    Summary: award.summary ? plainStudentText(award.summary) : '', 'Stated Min. GPA': award.eligibility.minimumGpa === null ? '' : String(award.eligibility.minimumGpa),
    'School Type (2-or 4-Year, or Trade)': award.eligibility.schoolTypes.join('; '),
    'Renewing/ Non-Renewing': '', Focus: award.eligibility.focus ?? '',
    'Acute Financial Need Prioritization': '', 'Accepts Gap Year Applications Upon Return': '',
  }));
}
