import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE, verifyAdminToken } from '@/lib/adminAuth';
import { extractScholarships, fetchUrlToText } from '@/lib/extract';
// @ts-ignore
import PDFParser from 'pdf2json';

export async function POST(req: NextRequest) {
    try {
        // Gate this admin-only endpoint behind the signed admin session token.
        if (!(await verifyAdminToken(req.cookies.get(ADMIN_COOKIE)?.value))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await req.formData();
        const mode = formData.get('mode') as string;

        let rawText = '';
        let sourceRef = 'Admin Portal Direct Ingestion';

        if (mode === 'url') {
            const url = formData.get('url') as string;
            if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 });

            sourceRef = url;
            rawText = await fetchUrlToText(url);
        }
        else if (mode === 'document') {
            const file = formData.get('file') as File;
            if (!file) return NextResponse.json({ error: 'File required' }, { status: 400 });

            sourceRef = file.name;
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
                const pdfParser = new PDFParser(null, true); // true = text parsing
                rawText = await new Promise((resolve, reject) => {
                    pdfParser.on("pdfParser_dataError", (errData: any) => reject(errData.parserError));
                    pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
                        resolve(pdfParser.getRawTextContent());
                    });
                    pdfParser.parseBuffer(buffer);
                });
            } else {
                // Assume standard txt or utf-8 encoded doc
                rawText = buffer.toString('utf-8');
            }
        }
        else if (mode === 'text') {
            const textFlow = formData.get('text') as string;
            if (!textFlow) return NextResponse.json({ error: 'Text required' }, { status: 400 });
            rawText = textFlow;
        }
        else {
            return NextResponse.json({ error: 'Invalid mode specified' }, { status: 400 });
        }

        if (!rawText || rawText.length < 50) {
            return NextResponse.json({ error: 'Not enough text extracted to analyze. Please try a different source.' }, { status: 400 });
        }

        // Gemini structured extraction + grounding honesty gate (shared lib, same path
        // the batch ingestion script uses).
        const grounded = await extractScholarships(rawText, sourceRef);

        return NextResponse.json({ success: true, data: grounded });

    } catch (error: any) {
        console.error('Extraction Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to extract data' }, { status: 500 });
    }
}
