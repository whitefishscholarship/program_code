import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        if (!body || !Array.isArray(body) || body.length === 0) {
            return NextResponse.json({ error: 'Valid JSON array payload required.' }, { status: 400 });
        }

        const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID;
        const GOOGLE_SERVICE_ACCOUNT_CREDENTIALS = process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS;

        if (!GOOGLE_SHEET_ID || !GOOGLE_SERVICE_ACCOUNT_CREDENTIALS) {
            console.error("Missing Google Environment Variables");
            return NextResponse.json({ error: 'Server configuration missing Google Sheets API credentials.' }, { status: 500 });
        }

        let credentials;
        try {
            credentials = JSON.parse(GOOGLE_SERVICE_ACCOUNT_CREDENTIALS);
        } catch (e: any) {
            // Support Base64 encoded payload fallback for rigorous Vercel parsing
            credentials = JSON.parse(Buffer.from(GOOGLE_SERVICE_ACCOUNT_CREDENTIALS, 'base64').toString('ascii'));
        }

        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const sheets = google.sheets({ version: 'v4', auth });

        // Map the array of objects explicitly into the ordered array of arrays required by Google Sheets
        // Note: We match the order of the actual columns in the sheet exactly.
        const headerBinding = [
            "New for 2026!",
            "New for 2025!",
            "Last Updated",
            "Due Date",
            "In State / National",
            "Portal / Scholarship",
            "Amount",
            "Location/Information",
            "Name of Scholarship",
            "Application Link/Method",
            "Summary",
            "Stated Min GPA",
            "School Type",
            "Renewing/Non-Renewing",
            "Focus",
            "Acute Financial Need",
            "Accepts Gap Year Apps Upon Return",
            "POC (Emails, Names, Phone)",
            "Notes",
            "Known Applicants 2025"
        ];

        const values = body.map((row: any) => {
            return headerBinding.map(key => {
                const val = row[key];
                return val ? String(val) : "";
            });
        });

        // Push data to the absolute bottom via 'append'
        const response = await sheets.spreadsheets.values.append({
            spreadsheetId: GOOGLE_SHEET_ID,
            range: 'Master Database!A:T',
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS',
            requestBody: {
                values: values,
            },
        });

        return NextResponse.json({
            success: true,
            message: `Successfully inserted ${values.length} row(s) into Master Database.`,
            updates: response.data.updates
        });

    } catch (error: any) {
        console.error('Push Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to append to Google Sheets' }, { status: 500 });
    }
}
