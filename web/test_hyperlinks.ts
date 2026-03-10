import * as dotenv from 'dotenv';
import { google } from 'googleapis';

dotenv.config({ path: '.env.local' });

async function check() {
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
    const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
    console.log("Available tabs:", meta.data.sheets?.map((s: any) => s.properties?.title));
    const masterTab = meta.data.sheets?.find((s: any) => s.properties?.title?.includes('Master Database (MD)'));
    const exactTitle = masterTab?.properties?.title || 'Master Database (MD)';
    console.log("Using exact title:", exactTitle);

    const response = await sheets.spreadsheets.get({
        spreadsheetId: sheetId,
        includeGridData: true,
        fields: 'sheets(properties.title,data.rowData.values(formattedValue,hyperlink))'
    });

    const rows = response.data.sheets?.[0]?.data?.[0]?.rowData;
    if (!rows) return;
    for (let i = 0; i < 5; i++) {
        console.log(`Row ${i}:`);
        rows[i]?.values?.forEach((v, j) => {
            if (v.hyperlink) {
                console.log(`  Col ${j} Link: ${v.formattedValue} -> ${v.hyperlink}`);
            }
        });
    }
}
check();
