import * as dotenv from 'dotenv';
import { google } from 'googleapis';

dotenv.config({ path: '.env.local' });

async function getHeaders() {
    const sheetId = process.env.GOOGLE_SHEET_ID;
    const credentialsString = process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS!;
    const decoded = Buffer.from(credentialsString, 'base64').toString('utf-8');
    const credentialsParsed = JSON.parse(decoded);
    let privateKey = credentialsParsed.private_key;
    if (privateKey && privateKey.includes('\\n')) {
        privateKey = privateKey.replace(/\\n/g, '\n');
    }

    const auth = new google.auth.GoogleAuth({
        credentials: {
            client_email: credentialsParsed.client_email,
            private_key: privateKey,
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Get metadata
    const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
    if (!meta.data.sheets) return;

    for (const sheet of meta.data.sheets) {
        const title = sheet.properties?.title;
        if (!title) continue;

        try {
            const response = await sheets.spreadsheets.values.get({
                spreadsheetId: sheetId,
                range: `'${title}'!A1:Z1`,
            });
            console.log(`\n--- Tab: ${title} ---`);
            console.log(response.data.values?.[0] || []);
        } catch (e) {
            console.log(`Error fetching ${title}: `, e);
        }
    }
}
getHeaders();
