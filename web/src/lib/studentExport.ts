import {
  amountLabel,
  deadlineLabel,
  explicitDeadlineDate,
  formatListStamp,
  officialUrl,
  plainStudentText,
  STUDENT_STATUS_LABELS,
  studentStatus,
} from './studentList';
import type { StudentAward } from './studentCatalog';

export const STUDENT_EXPORT_COLUMNS = [
  'Name',
  'Status',
  'Deadline',
  'Amount',
  'Link',
  'Short summary',
] as const;

export type StudentExportColumn = (typeof STUDENT_EXPORT_COLUMNS)[number];
export type StudentExportRow = Record<StudentExportColumn, string>;

export function toStudentExportRows(awards: readonly StudentAward[], now: Date = new Date()): StudentExportRow[] {
  return awards.map((award) => ({
    Name: plainStudentText(award.name),
    Status: STUDENT_STATUS_LABELS[studentStatus(award, now)],
    Deadline: deadlineLabel(award),
    Amount: amountLabel(award),
    Link: officialUrl(award) ?? '',
    'Short summary': award.summary ? plainStudentText(award.summary) : '',
  }));
}

function csvCell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replaceAll('"', '""')}"`;
}

export function serializeStudentCsv(awards: readonly StudentAward[], now: Date): string {
  const rows = toStudentExportRows(awards, now);
  const lines = [
    csvCell(formatListStamp(now)),
    STUDENT_EXPORT_COLUMNS.map(csvCell).join(','),
    ...rows.map((row) => STUDENT_EXPORT_COLUMNS.map((column) => csvCell(row[column])).join(',')),
  ];
  return `\uFEFF${lines.join('\r\n')}\r\n`;
}

function xmlEscape(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
}

function columnRef(index: number, row: number): string {
  return `${String.fromCharCode(65 + index)}${row}`;
}

const LAST_COLUMN = String.fromCharCode(64 + STUDENT_EXPORT_COLUMNS.length);

function inlineCell(ref: string, value: string, style: number): string {
  return `<c r="${ref}" t="inlineStr" s="${style}"><is><t xml:space="preserve">${xmlEscape(value)}</t></is></c>`;
}

type Hyperlink = { ref: string; target: string };

function worksheetXml(stamp: string, rows: StudentExportRow[]): { sheet: string; links: Hyperlink[] } {
  const links: Hyperlink[] = [];
  const header = STUDENT_EXPORT_COLUMNS.map((column, index) => inlineCell(columnRef(index, 2), column, 1)).join('');
  const body = rows.map((row, rowIndex) => {
    const excelRow = rowIndex + 3;
    const cells = STUDENT_EXPORT_COLUMNS.map((column, index) => {
      const ref = columnRef(index, excelRow);
      const value = row[column];
      const linkTarget = column === 'Name' || column === 'Link' ? row.Link : '';
      if (value && /^https?:\/\//i.test(linkTarget) && (column === 'Name' || column === 'Link')) {
        links.push({ ref, target: linkTarget });
      }
      const style = links.some((link) => link.ref === ref) ? 2 : 0;
      return inlineCell(ref, value, style);
    }).join('');
    return `<row r="${excelRow}">${cells}</row>`;
  }).join('');
  const lastRow = Math.max(2, rows.length + 2);
  const hyperlinks = links.length
    ? `<hyperlinks>${links.map((link, index) => `<hyperlink ref="${link.ref}" r:id="rId${index + 1}"/>`).join('')}</hyperlinks>`
    : '';
  const sheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <dimension ref="A1:${LAST_COLUMN}${lastRow}"/>
  <sheetViews>
    <sheetView workbookViewId="0" tabSelected="1">
      <pane ySplit="2" topLeftCell="A3" activePane="bottomLeft" state="frozen"/>
      <selection pane="bottomLeft" activeCell="A3" sqref="A3"/>
    </sheetView>
  </sheetViews>
  <sheetFormatPr defaultRowHeight="15"/>
  <cols>
    <col min="1" max="1" width="36" customWidth="1"/>
    <col min="2" max="2" width="16" customWidth="1"/>
    <col min="3" max="3" width="14" customWidth="1"/>
    <col min="4" max="4" width="18" customWidth="1"/>
    <col min="5" max="5" width="42" customWidth="1"/>
    <col min="6" max="6" width="48" customWidth="1"/>
  </cols>
  <sheetData>
    <row r="1">${inlineCell('A1', stamp, 0)}</row>
    <row r="2">${header}</row>
    ${body}
  </sheetData>
  <autoFilter ref="A2:${LAST_COLUMN}${lastRow}"/>
  <mergeCells count="1"><mergeCell ref="A1:${LAST_COLUMN}1"/></mergeCells>
  ${hyperlinks}
</worksheet>`;
  return { sheet, links };
}

const STYLES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="3">
    <font><sz val="11"/><name val="Calibri"/></font>
    <font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>
    <font><u/><sz val="11"/><color rgb="FF1155CC"/><name val="Calibri"/></font>
  </fonts>
  <fills count="3">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF123C3A"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="3">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>
    <xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>
  </cellXfs>
</styleSheet>`;

function contentTypesXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`;
}

function workbookXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="My matches" sheetId="1" r:id="rId1"/></sheets>
</workbook>`;
}

function workbookRels(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;
}

function rootRels(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;
}

function sheetRels(links: Hyperlink[]): string {
  const rows = links.map((link, index) => `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="${xmlEscape(link.target)}" TargetMode="External"/>`);
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${rows.join('')}</Relationships>`;
}

function crc32(bytes: Uint8Array): number {
  let crc = ~0;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return ~crc >>> 0;
}

function concat(parts: Array<Uint8Array | number[]>): Uint8Array {
  const arrays = parts.map((part) => (part instanceof Uint8Array ? part : Uint8Array.from(part)));
  const out = new Uint8Array(arrays.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of arrays) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

function u16(value: number): number[] {
  return [value & 255, (value >> 8) & 255];
}

function u32(value: number): number[] {
  return [value & 255, (value >> 8) & 255, (value >> 16) & 255, (value >> 24) & 255];
}

function zipStore(entries: Array<{ name: string; data: Uint8Array }>): Uint8Array {
  const locals: Uint8Array[] = [];
  const centrals: Uint8Array[] = [];
  let offset = 0;
  for (const entry of entries) {
    const name = new TextEncoder().encode(entry.name);
    const crc = crc32(entry.data);
    const local = concat([
      u32(0x04034b50), u16(20), u16(0), u16(0), u16(0), u16(0),
      u32(crc), u32(entry.data.length), u32(entry.data.length),
      u16(name.length), u16(0), name, entry.data,
    ]);
    const central = concat([
      u32(0x02014b50), u16(20), u16(20), u16(0), u16(0), u16(0), u16(0),
      u32(crc), u32(entry.data.length), u32(entry.data.length),
      u16(name.length), u16(0), u16(0), u16(0), u16(0), u32(0),
      u32(offset), name,
    ]);
    locals.push(local);
    centrals.push(central);
    offset += local.length;
  }
  const centralBlob = concat(centrals);
  const eocd = concat([
    u32(0x06054b50), u16(0), u16(0), u16(entries.length), u16(entries.length),
    u32(centralBlob.length), u32(offset), u16(0),
  ]);
  return concat([...locals, centralBlob, eocd]);
}

function textFile(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

export function buildStudentWorkbook(awards: readonly StudentAward[], now: Date): Uint8Array {
  const rows = toStudentExportRows(awards, now);
  const { sheet, links } = worksheetXml(formatListStamp(now), rows);
  const entries = [
    { name: '[Content_Types].xml', data: textFile(contentTypesXml()) },
    { name: '_rels/.rels', data: textFile(rootRels()) },
    { name: 'xl/workbook.xml', data: textFile(workbookXml()) },
    { name: 'xl/_rels/workbook.xml.rels', data: textFile(workbookRels()) },
    { name: 'xl/styles.xml', data: textFile(STYLES_XML) },
    { name: 'xl/worksheets/sheet1.xml', data: textFile(sheet) },
  ];
  if (links.length > 0) entries.push({ name: 'xl/worksheets/_rels/sheet1.xml.rels', data: textFile(sheetRels(links)) });
  return zipStore(entries);
}

function icsText(value: string): string {
  return value.replaceAll('\\', '\\\\').replaceAll('\n', '\\n').replaceAll(',', '\\,').replaceAll(';', '\\;');
}

function foldIcs(text: string): string {
  return text.split('\r\n').map((line) => {
    if (line.length <= 73) return line;
    const parts = [line.slice(0, 73)];
    for (let index = 73; index < line.length; index += 72) parts.push(` ${line.slice(index, index + 72)}`);
    return parts.join('\r\n');
  }).join('\r\n');
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/** One award, one file, built on the device. Returns null when the deadline has no calendar day. */
export function serializeAwardDeadlineCalendar(award: StudentAward, now: Date): string | null {
  if (!explicitDeadlineDate(award)) return null;
  const calendar = serializeStudentCalendar([award], now);
  const events = calendar.split('BEGIN:VEVENT').length - 1;
  if (events !== 1) return null;
  return calendar;
}

export function serializeStudentCalendar(awards: readonly StudentAward[], now: Date): string {
  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const events = awards.flatMap((award) => {
    const date = explicitDeadlineDate(award);
    if (!date) return [];
    const day = `${date.year}${pad(date.month)}${pad(date.day)}`;
    const url = officialUrl(award);
    const lines = [
      'BEGIN:VEVENT',
      `UID:${award.publicId}-${day}@whitefish-scholarships`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${day}`,
      `SUMMARY:${icsText(`Deadline: ${plainStudentText(award.name)}`)}`,
      'DESCRIPTION:Check the official site before you apply. The date can change.',
    ];
    if (url) lines.push(`URL:${url}`);
    lines.push('END:VEVENT');
    return [lines.join('\r\n')];
  });
  return foldIcs([
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Whitefish Scholarship Finder//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...events,
    'END:VCALENDAR',
    '',
  ].join('\r\n'));
}
