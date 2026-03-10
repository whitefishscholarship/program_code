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

    // Fetch metadata to find the titles of the first two sheets
    const meta = await sheets.spreadsheets.get({
      spreadsheetId: sheetId,
    });

    if (!meta.data.sheets || meta.data.sheets.length === 0) {
      return NextResponse.json({ error: "No sheets found in document" }, { status: 500 });
    }

    // The system now strictly pulls from the Master Database tab.
    // It intentionally ignores the "Scraped Data" tab, which the admin uses as a staging/cleanup area.
    const ranges: string[] = [];

    // Find the master structured tab by title
    const masterTab = meta.data.sheets.find((s: { properties?: { title?: string | null } }) => s.properties?.title?.includes('Master Database (MD)'));

    if (masterTab) {
      ranges.push(`'${masterTab.properties?.title}'!A:Z`);
    } else if (meta.data.sheets.length > 0) {
      // Fallback: Just grab the very first tab if the exact name isn't found.
      ranges.push(`'${meta.data.sheets[0].properties?.title}'!A:Z`);
    }

    // Fetch data including headers for both tabs
    const response = await sheets.spreadsheets.values.batchGet({
      spreadsheetId: sheetId,
      ranges: ranges,
    });

    if (!response.data.valueRanges || response.data.valueRanges.length === 0) {
      return NextResponse.json({ data: [] });
    }

    const allPayloads: Record<string, string>[] = [];

    // Process rows into objects with keys matching exact headers for each tab
    response.data.valueRanges.forEach((rangeData) => {
      const rows = rangeData.values;
      if (!rows || rows.length === 0) return;

      const headers = rows[0] as string[];
      const payload = rows.slice(1).map(row => {
        const rowObject: Record<string, string> = {};
        headers.forEach((header, index) => {
          // Handle empty trailing cells which the API omits
          rowObject[header] = row[index] !== undefined ? row[index] : '';
        });
        return rowObject;
      });

      allPayloads.push(...payload);
    });

    return NextResponse.json({ data: allPayloads });

  } catch (error: unknown) {
    // Note: Scrubbing payload from error reporting per spec
    console.error("Error fetching from Google Sheets API:", error instanceof Error ? error.message : String(error));
    return NextResponse.json({ error: "Failed to fetch scholarships" }, { status: 500 });
  }
}
