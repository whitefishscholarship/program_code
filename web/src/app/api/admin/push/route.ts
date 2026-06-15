import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { ADMIN_COOKIE, verifyAdminToken } from '@/lib/adminAuth';
import { mapRecordToRow, assertWritableHeaders } from '@/lib/pushMapping';

export async function POST(req: NextRequest) {
    try {
        // Gate this admin-only endpoint behind the signed admin session token.
        if (!(await verifyAdminToken(req.cookies.get(ADMIN_COOKIE)?.value))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

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

        // Read the LIVE Master Database header row and write BY NAME (HANDOFF bug #6).
        // The old code appended a fixed 20-col, master-shaped row positionally to A:T,
        // which both drifted against the 15-col student tab and wrote 3 PII/staff columns.
        const headerResp = await sheets.spreadsheets.values.get({
            spreadsheetId: GOOGLE_SHEET_ID,
            range: 'Master Database!1:1',
        });
        const liveHeaders = (headerResp.data.values?.[0] || []).map((h) => String(h));

        // Refuse to write if the target tab isn't the clean student schema (PII present
        // or an expected student column missing) — fail loud rather than misalign/leak.
        assertWritableHeaders(liveHeaders);

        // Each staged record -> one row aligned to the live headers; PII/internal fields dropped.
        const values = body.map((row: any) => mapRecordToRow(row, liveHeaders));

        // Append after the last row; the row length matches the live header count so it
        // lands aligned (15 cols -> A:O).
        const response = await sheets.spreadsheets.values.append({
            spreadsheetId: GOOGLE_SHEET_ID,
            range: 'Master Database!A1',
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
