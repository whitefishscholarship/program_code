import * as dotenv from 'dotenv';
import { google } from 'googleapis';

dotenv.config({ path: '.env.local' });

async function analyzeCriteria() {
    const sheetId = process.env.GOOGLE_SHEET_ID;
    const credentialsString = process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS!;
    const decoded = Buffer.from(credentialsString, 'base64').toString('utf-8');
    const credentialsParsed = JSON.parse(decoded);
    let privateKey = credentialsParsed.private_key;
    if (privateKey && privateKey.includes('\\n')) {
        privateKey = privateKey.replace(/\\n/g, '\n');
    }

    const auth = new google.auth.GoogleAuth({
        credentials: { client_email: credentialsParsed.client_email, private_key: privateKey },
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.values.batchGet({
        spreadsheetId: sheetId,
        ranges: ["'Master Database'!A:Z", "'Scraped Data'!A:Z"],
    });

    const focuses = new Set<string>();
    const summaries: string[] = [];

    response.data.valueRanges?.forEach((range) => {
        const rows = range.values;
        if (!rows || rows.length < 2) return;
        const headers = rows[0] as string[];
        const focusIdx = headers.indexOf('Focus');
        const summaryIdx = headers.indexOf('Summary');

        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (focusIdx >= 0 && row[focusIdx]) {
                const fs = row[focusIdx].split(',').map((s: string) => s.trim()).filter(Boolean);
                fs.forEach((f: string) => focuses.add(f.toLowerCase()));
            }
            if (summaryIdx >= 0 && row[summaryIdx]) {
                summaries.push(row[summaryIdx].toLowerCase());
            }
        }
    });

    console.log("--- UNIQUE FOCUS AREAS ---");
    const sortedFocuses = Array.from(focuses).sort();
    console.log(sortedFocuses.join('\n'));

    // Let's do a quick naive keyword scan on summaries for potential missing criteria
    const keywords = [
        'single parent', 'gpa', 'essay', 'disability', 'athlete', 'sports', 'golf', 'football',
        'agriculture', 'music', 'art', 'first generation', 'foster', 'lgbtq', 'women', 'minority',
        'union', 'employee', 'resident', 'county', 'parish', 'church', 'christian', 'catholic',
        'jewish', 'muslim', 'religion', 'volunteer', 'community service', 'leadership', 'merit',
        'need-based', 'first responder', 'police', 'firefighter', 'military', 'veteran', 'dependent',
        'orphan', 'disease', 'cancer', 'survivor', 'medical', 'nursing', 'teaching', 'education'
    ];

    console.log("\n--- KEYWORD HITS IN SUMMARIES ---");
    const counts: Record<string, number> = {};
    for (const kw of keywords) {
        counts[kw] = 0;
        for (const s of summaries) {
            if (s.includes(kw)) counts[kw]++;
        }
        if (counts[kw] > 0) {
            console.log(`${kw}: ${counts[kw]}`);
        }
    }
}
analyzeCriteria().catch(console.error);
