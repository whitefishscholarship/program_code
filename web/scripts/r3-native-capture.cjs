'use strict';
const FIELD_MASK = 'userEnteredValue,effectiveValue,formattedValue,hyperlink,textFormatRuns(startIndex,format(link)),userEnteredFormat(numberFormat),effectiveFormat(numberFormat)';
const BOOK = '1Dp5AMnrfSQ-Xf-r03S75lKsGPJk7o0inOgvC9Q6lOl4';
const HEADERS = ['Last Updated','Due Date','In-State / National','Portal/ Scholarship','Amount','Scholarship Location/Information','Name of Scholarship','Application Link/Method','Summary','Stated Min. GPA','School Type (2-or 4-Year, or Trade)','Renewing/ Non-Renewing','Focus','Acute Financial Need Prioritization','Accepts Gap Year Applications Upon Return'];
const object = x => x !== null && typeof x === 'object' && !Array.isArray(x);
const only = (x, keys) => object(x) && Object.keys(x).every(k => keys.includes(k));
const numberFormat = x => only(x, ['type','pattern']) && Object.values(x).every(v => typeof v === 'string');
const value = x => only(x,['numberValue','stringValue','boolValue','formulaValue','errorValue']) && Object.entries(x).every(([k,v]) =>
  k === 'numberValue' ? typeof v === 'number' && Number.isFinite(v) : k === 'boolValue' ? typeof v === 'boolean' : k === 'errorValue' ? only(v,['type','message']) && Object.values(v).every(z => typeof z === 'string') : typeof v === 'string');
function validCell(c) {
  if (!only(c,['userEnteredValue','effectiveValue','formattedValue','hyperlink','textFormatRuns','userEnteredFormat','effectiveFormat'])) return false;
  for (const [k,v] of Object.entries(c)) {
    if (k === 'userEnteredValue' || k === 'effectiveValue') { if (!value(v)) return false; }
    else if (k === 'formattedValue' || k === 'hyperlink') { if (typeof v !== 'string') return false; }
    else if (k === 'textFormatRuns') {
      if (!Array.isArray(v) || !v.every(run => only(run,['startIndex','format']) && (run.startIndex === undefined || Number.isInteger(run.startIndex) && run.startIndex >= 0) && (run.format === undefined || only(run.format,['link']) && (run.format.link === undefined || only(run.format.link,['uri']) && typeof run.format.link.uri === 'string')))) return false;
    } else if (!only(v,['numberFormat']) || (v.numberFormat !== undefined && !numberFormat(v.numberFormat))) return false;
  }
  // Unexpected credentials or explicitly labelled applicant records never enter evidence.
  const text = JSON.stringify(c);
  if (/(?:access_token|refresh_token|client_secret)\s*[=:]|Bearer\s+[A-Za-z0-9_-]{20,}|\b\d{3}-\d{2}-\d{4}\b|Applicant\s+(?:Name|Email|Address)\s*:\s*\S/i.test(text)) return false;
  return true;
}
function captureNativeProjection(response, expectedRows) {
  const fail = reason => ({status:'BLOCKED',reason,snapshot:null});
  if (![1,417].includes(expectedRows)) return fail('unapproved_capture_bounds');
  if (!response || response.isError) return fail('connector_error_or_missing_response');
  const s = response.structuredContent;
  if (s?.result && !only(s,['result'])) return fail('unexpected_wrapper');
  const x = s?.result || s;
  if (!only(x,['spreadsheetId','spreadsheetUrl','properties','sheets']) || x.spreadsheetId !== BOOK) return fail('wrong_workbook_or_extra_envelope');
  if (!only(x.properties,['title','locale','timeZone']) || x.properties.title !== 'Whitefish HS Scholarship Database') return fail('wrong_workbook_properties');
  if (!Array.isArray(x.sheets) || x.sheets.length !== 1) return fail('unexpected_sheet_inventory');
  const sheet = x.sheets[0];
  if (!only(sheet,['properties','data'])) return fail('unexpected_sheet_fields');
  const p = sheet.properties;
  if (!only(p,['sheetId','title','hidden','index','sheetType','gridProperties']) || p.sheetId !== 0 || p.title !== 'Master Database' || p.sheetType !== 'GRID') return fail('wrong_selected_sheet');
  const g = p.gridProperties;
  if (!only(g,['rowCount','columnCount','frozenRowCount']) || !Number.isInteger(g.rowCount) || g.rowCount < 417 || !Number.isInteger(g.columnCount) || g.columnCount < 15) return fail('invalid_grid_dimensions');
  if (!Array.isArray(sheet.data) || sheet.data.length !== 1) return fail('missing_or_extra_grid_data');
  const d = sheet.data[0];
  if (!only(d,['startRow','startColumn','rowData']) || (d.startRow ?? 0) !== 0 || (d.startColumn ?? 0) !== 0 || !Array.isArray(d.rowData) || d.rowData.length !== expectedRows) return fail('incomplete_or_wrong_row_projection');
  for (const row of d.rowData) {
    if (!only(row,['values']) || (row.values !== undefined && (!Array.isArray(row.values) || row.values.length > 15 || !row.values.every(validCell)))) return fail('unexpected_cell_projection_or_sensitive_content');
  }
  const headers = (d.rowData[0].values || []).map(c => c.formattedValue ?? c.effectiveValue?.stringValue ?? c.userEnteredValue?.stringValue);
  if (JSON.stringify(headers) !== JSON.stringify(HEADERS)) return fail('header_schema_changed');
  // Preserve sparse CellData exactly. Omitted trailing cells/fields remain omitted,
  // distinct from explicit empty objects; never manufacture source values for them.
  const rows = d.rowData.map((row,index) => ({row:index+1,returnedCellCount:(row.values || []).length,cells:row.values || [],valuesFieldReturned:Object.hasOwn(row,'values')}));
  const snapshot = {schemaVersion:1,spreadsheetId:BOOK,properties:x.properties,sheetProperties:p,range:`'Master Database'!A1:O${expectedRows}`,cellFields:FIELD_MASK,rows,
    limits:['Bounded native response only; omitted cell fields and trailing cells are not invented values.','No claim of whole-workbook completeness, official fact currency or server-head revision binding.','Spreadsheet URL discarded; formulas and links not followed.']};
  return {status:'PASS',snapshot,headerVerified:true,rowPositions:expectedRows,returnedCells:rows.reduce((n,r)=>n+r.returnedCellCount,0),gridRows:g.rowCount,gridColumns:g.columnCount};
}
module.exports = {captureNativeProjection, FIELD_MASK, HEADERS};
