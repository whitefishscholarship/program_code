import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { ADMIN_COOKIE, verifyAdminToken } from '@/lib/adminAuth';
import { mapRecordToRow, assertWritableHeaders } from '@/lib/pushMapping';
import { findMasterDuplicate, MasterRef } from '@/lib/grounding';

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

        // Idempotency: read existing Master Database names and skip any record already
        // present by name, so re-POSTing the same payload can't duplicate rows.
        const existingResp = await sheets.spreadsheets.values.get({
            spreadsheetId: GOOGLE_SHEET_ID,
            range: 'Master Database!A:O',
        });
        const existing = existingResp.data.values || [];
        const exHdr = (existing[0] || []).map((h) => String(h));
        const exNameIdx = exHdr.indexOf('Name of Scholarship');
        const masterRefs: MasterRef[] = exNameIdx >= 0
            ? existing.slice(1).map((r) => ({ name: String(r[exNameIdx] ?? ''), url: '' }))
            : [];

        const nameKey = (row: any) => String(row['Name of Scholarship'] ?? row['name'] ?? '');
        const skipped: string[] = [];
        const toWrite = body.filter((row: any) => {
            const dup = findMasterDuplicate(nameKey(row), masterRefs);
            if (dup) { skipped.push(nameKey(row)); return false; }
            masterRefs.push({ name: nameKey(row), url: '' }); // guard within-payload dups too
            return true;
        });

        if (toWrite.length === 0) {
            return NextResponse.json({ success: true, message: `No new rows — all ${body.length} already in Master Database.`, skipped });
        }

        // Each staged record -> one row aligned to the live headers; PII/internal fields dropped.
        const values = toWrite.map((row: any) => mapRecordToRow(row, liveHeaders));

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
            message: `Inserted ${values.length} row(s) into Master Database${skipped.length ? `; skipped ${skipped.length} already present` : ''}.`,
            skipped,
            updates: response.data.updates
        });

    } catch (error: any) {
        // Log detail server-side; return a generic message (googleapis errors can carry sheet
        // IDs / ranges / permission detail). The assertWritableHeaders guard message is the
        // one useful signal, so surface just that class of error explicitly.
        console.error('Push Error:', error);
        const msg = typeof error?.message === 'string' && error.message.startsWith('Refusing to write')
            ? error.message
            : 'Failed to append to Google Sheets.';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
