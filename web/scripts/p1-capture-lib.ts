export const BOUNDED_ROW_COUNT = 1060;
export const BOUNDED_COLUMN_COUNT = 15;
export const EXPECTED_HEADERS = [
  'Last Updated',
  'Due Date',
  'In-State / National',
  'Portal/ Scholarship',
  'Amount',
  'Scholarship Location/Information',
  'Name of Scholarship',
  'Application Link/Method',
  'Summary',
  'Stated Min. GPA',
  'School Type (2-or 4-Year, or Trade)',
  'Renewing/ Non-Renewing',
  'Focus',
  'Acute Financial Need Prioritization',
  'Accepts Gap Year Applications Upon Return',
] as const;

export type CaptureCell = {
  formattedValue?: string | null;
  hyperlink?: string | null;
  userEnteredValue?: Record<string, unknown> & { formulaValue?: string | null } | null;
  effectiveValue?: Record<string, unknown> | null;
  textFormatRuns?: Array<{ format?: { link?: { uri?: string | null } | null } | null }> | null;
};

export type CaptureRow = { values?: CaptureCell[] };
export type HyperlinkForm = 'cellData.hyperlink' | 'cellData.textFormatRuns' | 'cellData.formula';
export type LinkStatus = 'http' | 'non_http' | 'malformed_or_relative';

export type RawHyperlinkOccurrence = {
  sheetRow: number;
  columnIndex: number;
  columnHeader: string;
  form: HyperlinkForm;
  rawUrl: string;
  status: LinkStatus;
};

function isNonemptyCell(cell: CaptureCell | undefined): boolean {
  if (!cell) return false;
  return cell.formattedValue !== undefined
    || cell.hyperlink !== undefined
    || cell.userEnteredValue !== undefined
    || cell.effectiveValue !== undefined
    || Boolean(cell.textFormatRuns?.length);
}

function linkStatus(rawUrl: string): LinkStatus {
  try {
    const parsed = new URL(rawUrl);
    return ['http:', 'https:'].includes(parsed.protocol) ? 'http' : 'non_http';
  } catch {
    return 'malformed_or_relative';
  }
}

export function analyzeBoundedCellData(rows: CaptureRow[]) {
  const actualHeaders = Array.from({ length: BOUNDED_COLUMN_COUNT }, (_, index) =>
    String(rows[0]?.values?.[index]?.formattedValue ?? ''));
  const headerMismatches = EXPECTED_HEADERS.flatMap((expected, index) =>
    actualHeaders[index] === expected ? [] : [{ columnIndex: index + 1, expected, actual: actualHeaders[index] }]);

  const populatedRows: Array<{ sheetRow: number; nonemptyColumnIndexes: number[]; hasName: boolean }> = [];
  const hyperlinks: RawHyperlinkOccurrence[] = [];
  const addLink = (sheetRow: number, columnIndex: number, form: HyperlinkForm, rawUrl: string) => {
    hyperlinks.push({
      sheetRow,
      columnIndex,
      columnHeader: EXPECTED_HEADERS[columnIndex - 1] ?? `column_${columnIndex}`,
      form,
      rawUrl,
      status: linkStatus(rawUrl),
    });
  };

  for (let rowIndex = 1; rowIndex < BOUNDED_ROW_COUNT; rowIndex += 1) {
    const cells = rows[rowIndex]?.values ?? [];
    const nonemptyColumnIndexes = Array.from({ length: BOUNDED_COLUMN_COUNT }, (_, index) => index)
      .filter((index) => isNonemptyCell(cells[index]))
      .map((index) => index + 1);
    if (nonemptyColumnIndexes.length > 0) {
      populatedRows.push({
        sheetRow: rowIndex + 1,
        nonemptyColumnIndexes,
        hasName: Boolean(String(cells[6]?.formattedValue ?? '').trim()),
      });
    }

    for (let columnIndex = 0; columnIndex < BOUNDED_COLUMN_COUNT; columnIndex += 1) {
      const cell = cells[columnIndex];
      if (!cell) continue;
      if (typeof cell.hyperlink === 'string') {
        addLink(rowIndex + 1, columnIndex + 1, 'cellData.hyperlink', cell.hyperlink);
      }
      for (const run of cell.textFormatRuns ?? []) {
        const uri = run.format?.link?.uri;
        if (typeof uri === 'string') {
          addLink(rowIndex + 1, columnIndex + 1, 'cellData.textFormatRuns', uri);
        }
      }
      const formula = cell.userEnteredValue?.formulaValue;
      if (typeof formula === 'string' && /HYPERLINK\s*\(/i.test(formula)) {
        const literal = formula.match(/HYPERLINK\(\s*"([^"]*)"/i)?.[1] ?? '';
        addLink(rowIndex + 1, columnIndex + 1, 'cellData.formula', literal);
      }
    }
  }

  const duplicateKeys = new Map<string, number>();
  for (const occurrence of hyperlinks) {
    const key = `${occurrence.sheetRow}:${occurrence.columnIndex}:${occurrence.rawUrl}`;
    duplicateKeys.set(key, (duplicateKeys.get(key) ?? 0) + 1);
  }

  const byForm = (form: HyperlinkForm) => hyperlinks.filter((item) => item.form === form).length;
  const byColumn = (columnIndex: number) => hyperlinks.filter((item) => item.columnIndex === columnIndex).length;
  return {
    actualHeaders,
    headerMismatches,
    returnedRowDataRows: rows.length,
    implicitTrailingBlankRows: BOUNDED_ROW_COUNT - rows.length,
    populatedDataRowsAnyCell: populatedRows.length,
    namedDataRows: populatedRows.filter((row) => row.hasName).length,
    unnamedNonemptyRows: populatedRows.filter((row) => !row.hasName),
    hyperlinks,
    hyperlinkCounts: {
      totalMetadataRepresentations: hyperlinks.length,
      byForm: {
        cellDataHyperlink: byForm('cellData.hyperlink'),
        textFormatRuns: byForm('cellData.textFormatRuns'),
        formula: byForm('cellData.formula'),
      },
      byStatus: {
        http: hyperlinks.filter((item) => item.status === 'http').length,
        nonHttp: hyperlinks.filter((item) => item.status === 'non_http').length,
        malformedOrRelative: hyperlinks.filter((item) => item.status === 'malformed_or_relative').length,
      },
      retainedSourceColumns: byColumn(6) + byColumn(8),
      excludedColumns: hyperlinks.filter((item) => ![6, 8].includes(item.columnIndex)).length,
      duplicateSameCellUrlRepresentations: [...duplicateKeys.values()].reduce((sum, count) => sum + Math.max(0, count - 1), 0),
    },
  };
}

export function assertCaptureCompleteness(analysis: ReturnType<typeof analyzeBoundedCellData>): void {
  if (analysis.headerMismatches.length > 0) {
    throw new Error(`P1 header position mismatch: ${JSON.stringify(analysis.headerMismatches)}`);
  }
  if (analysis.unnamedNonemptyRows.length > 0) {
    throw new Error(`P1 nonempty rows without scholarship names: ${JSON.stringify(analysis.unnamedNonemptyRows)}`);
  }
  const invalid = analysis.hyperlinks.filter((item) => item.status !== 'http');
  if (invalid.length > 0) {
    throw new Error(`P1 non-HTTP or malformed CellData hyperlinks require review: ${JSON.stringify(invalid.map(({ rawUrl: _rawUrl, ...item }) => item))}`);
  }
}
