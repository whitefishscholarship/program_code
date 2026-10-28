import { displayVerification, openStatusText, type StudentAward } from './studentCatalog';

export const EXPORT_HEADERS = [
  'Award ID',
  'Record type',
  'Name',
  'Cycle status',
  'Cycle details',
  'Amount',
  'Minimum GPA',
  'School types',
  'Application method',
  'Official link',
  'Verification',
  'Last checked',
  'Verification source',
  'Open status',
  'Deadline',
] as const;

export type ExportRow = Record<(typeof EXPORT_HEADERS)[number], string>;

const schoolTypeLabels: Record<StudentAward['eligibility']['schoolTypes'][number], string> = {
  two_year: 'Two-year',
  four_year: 'Four-year',
  trade: 'Trade',
  other: 'Other',
};

export function toExportRows(awards: StudentAward[]): ExportRow[] {
  return awards.map((award) => ({
    'Award ID': award.publicId,
    'Record type': 'Award',
    'Name': award.name,
    'Cycle status': award.cycle.label,
    'Cycle details': [award.cycle.opens ? `Opens ${award.cycle.opens}` : '', award.cycle.closes ? `Closes ${award.cycle.closes}` : ''].filter(Boolean).join('; '),
    'Amount': award.amount.label,
    'Minimum GPA': award.eligibility.minimumGpa === null ? '' : String(award.eligibility.minimumGpa),
    'School types': award.eligibility.schoolTypes.map((type) => schoolTypeLabels[type]).join('; '),
    'Application method': award.application.label,
    'Official link': award.application.url ?? '',
    'Verification': displayVerification(award).status === 'verified' ? 'Verified' : 'Not yet checked',
    'Last checked': displayVerification(award).lastChecked ?? '',
    'Verification source': displayVerification(award).sourceUrl ?? '',
    'Open status': openStatusText(award) ?? '',
    'Deadline': displayVerification(award).deadline ?? '',
  }));
}

function csvCell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replaceAll('"', '""')}"`;
}

export function serializeAwardCsv(awards: StudentAward[]): string {
  const rows = toExportRows(awards);
  const lines = [EXPORT_HEADERS.map(csvCell).join(',')];
  for (const row of rows) lines.push(EXPORT_HEADERS.map((header) => csvCell(row[header])).join(','));
  return `\uFEFF${lines.join('\r\n')}\r\n`;
}

export function awardCsvDataUri(awards: StudentAward[]): string {
  if (awards.length === 0) throw new Error('No awards to export.');
  return `data:text/csv;charset=utf-8,${encodeURIComponent(serializeAwardCsv(awards))}`;
}
