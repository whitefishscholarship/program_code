// P1-only read path for the named testing spreadsheet. This script deliberately has
// no write-scoped credential, no Sheets mutation call, and no configurable target ID.
import fs from 'node:fs';
import path from 'node:path';
import { google } from 'googleapis';

const TESTING_SPREADSHEET_ID = '1Dp5AMnrfSQ-Xf-r03S75lKsGPJk7o0inOgvC9Q6lOl4';
const MASTER_TAB = 'Master Database';
const BOUNDED_RANGE = `'${MASTER_TAB}'!A1:O1060`;
const OUTPUT = path.join(process.cwd(), 'fixtures/p1/master-database-cell-data.json');
const TRACKING = new Set(['ouid', 'usp', 'rtpof', 'sd', 'gclid', 'fbclid', 'msclkid', 'mc_cid', 'mc_eid', '_gl', 'gad_source']);
const SENSITIVE = /^(access_?token|auth|authorization|code|credential|key|password|secret|signature|sig|token)$/i;

type Cell = {
  formattedValue?: string | null;
  hyperlink?: string | null;
  userEnteredValue?: { formulaValue?: string | null } | null;
  textFormatRuns?: Array<{ format?: { link?: { uri?: string | null } | null } | null }> | null;
};

function sanitizeUrl(raw: string) {
  const url = new URL(raw);
  const queryParameters: Array<{ name: string; identityPotential: boolean; valueRedacted: boolean }> = [];
  const removedParameters: string[] = [];
  const redactedParameters: string[] = [];
  for (const key of [...url.searchParams.keys()]) {
    const lower = key.toLowerCase();
    const tracking = TRACKING.has(lower) || lower.startsWith('utm_') || lower.startsWith('_ga')
      || lower.startsWith('_gcl_') || lower.startsWith('gad_');
    const sensitive = SENSITIVE.test(lower);
    queryParameters.push({ name: key, identityPotential: !tracking, valueRedacted: tracking || sensitive });
    if (tracking) {
      url.searchParams.delete(key);
      removedParameters.push(key);
    } else if (sensitive) {
      url.searchParams.set(key, 'REDACTED');
      redactedParameters.push(key);
    }
  }
  return {
    sanitizedUrl: url.toString(),
    queryParameters,
    removedParameters: [...new Set(removedParameters)],
    redactedParameters: [...new Set(redactedParameters)],
    fragmentPresent: Boolean(url.hash),
  };
}

function cellUrls(cell: Cell | undefined) {
  const found = new Map<string, Set<string>>();
  const add = (raw: string | null | undefined, provenance: string) => {
    if (!raw || !/^https?:\/\//i.test(raw)) return;
    const clean = raw.replace(/[.,;:]+$/, '');
    const sources = found.get(clean) ?? new Set<string>();
    sources.add(provenance);
    found.set(clean, sources);
  };
  add(cell?.hyperlink, 'cellData.hyperlink');
  for (const run of cell?.textFormatRuns ?? []) add(run.format?.link?.uri, 'cellData.textFormatRuns');
  const formula = cell?.userEnteredValue?.formulaValue;
  if (formula) add(formula.match(/HYPERLINK\(\s*"([^"]+)"/i)?.[1], 'cellData.formula');
  for (const match of String(cell?.formattedValue ?? '').matchAll(/https?:\/\/[^\s<>"')\]]+/g)) add(match[0], 'formattedValue');
  return [...found.entries()].map(([raw, provenance], index) => ({
    sourceReferenceIndex: index + 1,
    ...sanitizeUrl(raw),
    provenance: [...provenance],
  }));
}

function sanitizeDisplay(value: string): string {
  return value.replace(/https?:\/\/[^\s<>"')\]]+/g, (raw) => sanitizeUrl(raw.replace(/[.,;:]+$/, '')).sanitizedUrl);
}

async function main() {
  const encodedCredentials = process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS;
  if (!encodedCredentials) throw new Error('GOOGLE_SERVICE_ACCOUNT_CREDENTIALS is required and is never logged');
  const credentials = JSON.parse(encodedCredentials);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets.readonly',
      'https://www.googleapis.com/auth/drive.metadata.readonly',
    ],
  });
  const sheets = google.sheets({ version: 'v4', auth });
  const drive = google.drive({ version: 'v3', auth });
  const [sheetResponse, fileResponse] = await Promise.all([
    sheets.spreadsheets.get({
      spreadsheetId: TESTING_SPREADSHEET_ID,
      ranges: [BOUNDED_RANGE],
      includeGridData: true,
      fields: 'spreadsheetId,properties(title,locale,timeZone),sheets(properties(sheetId,title,gridProperties),data.rowData.values(formattedValue,userEnteredValue,effectiveValue,hyperlink,textFormatRuns))',
    }),
    drive.files.get({ fileId: TESTING_SPREADSHEET_ID, fields: 'id,name,mimeType,modifiedTime,version' }),
  ]);

  const sheet = sheetResponse.data.sheets?.find((candidate) => candidate.properties?.title === MASTER_TAB);
  if (!sheet || sheet.properties?.sheetId !== 0) throw new Error('Testing Master Database tab identity changed');
  const rows = (sheet.data?.[0]?.rowData ?? []) as Array<{ values?: Cell[] }>;
  const headers = (rows[0]?.values ?? []).map((cell) => cell.formattedValue ?? '');
  const expected = ['Portal/ Scholarship', 'Scholarship Location/Information', 'Name of Scholarship', 'Application Link/Method'];
  for (const header of expected) if (!headers.includes(header)) throw new Error(`Missing expected public column: ${header}`);

  const records = rows.slice(1).flatMap((row, index) => {
    const values = row.values ?? [];
    const scholarshipName = String(values[6]?.formattedValue ?? '').trim();
    if (!scholarshipName) return [];
    return [{
      sheetRow: index + 2,
      currentLabel: String(values[3]?.formattedValue ?? '').trim(),
      scholarshipName,
      information: { display: sanitizeDisplay(String(values[5]?.formattedValue ?? '').trim()), urls: cellUrls(values[5]) },
      application: { display: sanitizeDisplay(String(values[7]?.formattedValue ?? '').trim()), urls: cellUrls(values[7]) },
    }];
  });

  const fixture = {
    schemaVersion: 1,
    capture: {
      capturedAt: new Date().toISOString(),
      spreadsheetId: TESTING_SPREADSHEET_ID,
      spreadsheetTitle: sheetResponse.data.properties?.title,
      spreadsheetRevisionId: String(fileResponse.data.version ?? 'unavailable'),
      spreadsheetModifiedTime: fileResponse.data.modifiedTime ?? null,
      sheetTitle: MASTER_TAB,
      sheetId: sheet.properties.sheetId,
      boundedRange: BOUNDED_RANGE,
      gridRowCount: sheet.properties.gridProperties?.rowCount,
      gridColumnCount: sheet.properties.gridProperties?.columnCount,
      cellDataFields: ['formattedValue', 'userEnteredValue', 'effectiveValue', 'hyperlink', 'textFormatRuns'],
      sourceMode: 'google-apis-read-only',
    },
    sanitization: {
      includedColumns: expected,
      excludedColumns: headers.filter((header) => header && !expected.includes(header)),
      originalUrlsStored: false,
      hyperlinkOccurrencesPreservedOneForOne: true,
      displayUrlsSanitized: true,
      removedQueryParameters: ['ouid', 'usp', 'rtpof', 'sd', 'utm_*', 'gclid', 'fbclid', 'msclkid', 'mc_cid', 'mc_eid', '_gl', '_ga*', '_gcl_*', 'gad_*'],
      sensitiveQueryValues: 'replaced with REDACTED',
      statement: 'Contains only public scholarship row identity, public source/application labels, sanitized public URLs, and completeness metadata. It excludes summaries, review columns, credentials, private service-account material, and applicant data.',
    },
    records,
  };
  fs.writeFileSync(OUTPUT, `${JSON.stringify(fixture, null, 2)}\n`, { mode: 0o600 });
  console.log(`P1 READ-ONLY CAPTURE records=${records.length} revision=${fixture.capture.spreadsheetRevisionId}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'P1 capture failed');
  process.exitCode = 1;
});
