import { NextResponse } from 'next/server';
import { google } from 'googleapis';

// Next.js App Router route segment config
// Revalidate the cache every 5 minutes (300 seconds) to prevent hitting Google API quota
export const revalidate = 300;

export async function GET() {
  try {
    const sheetId = process.env.GOOGLE_SHEET_ID;

    // Check if credentials are provided either as a JSON string or a file path
    let auth;

    // First try to parse the credentials from a base64 encoded string or raw JSON string
    // This is best practice for Vercel/serverless environments
    if (process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS) {
      const credentialsString = process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS;
      let credentialsParsed;

      try {
        // Attempt to parse as raw JSON first
        credentialsParsed = JSON.parse(credentialsString);
      } catch {
        // If that fails, assume it might be base64 encoded
        const decoded = Buffer.from(credentialsString, 'base64').toString('utf-8');
        credentialsParsed = JSON.parse(decoded);
      }

      // CRITICAL FIX: Ensure the private key is properly formatted with actual newlines, 
      // not literal string '\\n' which breaks the node crypto decoder.
      let privateKey = credentialsParsed.private_key;
      if (privateKey && privateKey.includes('\\n')) {
        privateKey = privateKey.replace(/\\n/g, '\n');
      }

      auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: credentialsParsed.client_email,
          private_key: privateKey,
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      });
    } else {
      console.warn("GOOGLE_SERVICE_ACCOUNT_CREDENTIALS environment variable missing.");
      // Fallback to Application Default Credentials if running locally without explicit env var
      auth = new google.auth.GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      });
    }

    if (!sheetId) {
      console.error("GOOGLE_SHEET_ID missing");
      return NextResponse.json({ error: "Configuration Error" }, { status: 500 });
    }

    const sheets = google.sheets({ version: 'v4', auth });

    // Fetch BOTH the titles AND the grid data in a single efficient call
    // This avoids the 'Unable to parse range' API bug when bounding grid data
    const response = await sheets.spreadsheets.get({
      spreadsheetId: sheetId,
      includeGridData: true,
      fields: 'sheets(properties.title,data.rowData.values(formattedValue,hyperlink))'
    });

    if (!response.data.sheets || response.data.sheets.length === 0) {
      return NextResponse.json({ error: "No sheets found in document" }, { status: 500 });
    }

    // Find the master structured tab by title
    let targetSheet = response.data.sheets.find((s: { properties?: { title?: string | null } }) => s.properties?.title?.includes('Master Database'));

    // Fallback: Just grab the very first tab if the exact name isn't found
    if (!targetSheet) {
      targetSheet = response.data.sheets[0];
    }

    const sheetData = targetSheet.data?.[0]?.rowData;
    if (!sheetData || sheetData.length === 0) {
      return NextResponse.json({ data: [] });
    }

    const headersNode = sheetData[0].values;
    const headers = headersNode ? headersNode.map(v => v.formattedValue || '') : [];

    const allPayloads: Record<string, string>[] = [];

    // Process rows into objects with keys matching exact headers
    for (let i = 1; i < sheetData.length; i++) {
      const row = sheetData[i].values;
      if (!row || row.length === 0) continue;

      const rowObject: Record<string, string> = {};
      let hasData = false;

      headers.forEach((header, index) => {
        if (!header) return; // Skip empty header columns
        const cell = row[index];
        const val = cell?.formattedValue || '';
        const link = cell?.hyperlink || '';

        rowObject[header] = val;

        // If the cell contains an embedded hyperlink natively in Google Sheets,
        // we attach it as a synthetic column so the export engine can style it later.
        // The Next.js processor natively ignores these columns since they don't match rules.
        if (link) {
          rowObject[`${header}_url`] = link;
        }

        if (val) hasData = true;
      });

      if (hasData) {
        allPayloads.push(rowObject);
      }
    }

    return NextResponse.json({ data: allPayloads });

  } catch (error: unknown) {
    // Note: Scrubbing payload from error reporting per spec
    console.error("Error fetching from Google Sheets API:", error instanceof Error ? error.message : String(error));
    return NextResponse.json({ error: "Failed to fetch scholarships" }, { status: 500 });
  }
}
