import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type, Schema } from '@google/genai';
import * as cheerio from 'cheerio';
// @ts-ignore
import PDFParser from 'pdf2json';

// Use the new Google GenAI SDK
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// The exact schema mirroring the Python scraper.py Pydantic structure
const scholarshipSchema: Schema = {
    type: Type.ARRAY,
    description: "List of all distinct scholarships found in the provided payload.",
    items: {
        type: Type.OBJECT,
        properties: {
            "New for 2026!": {
                type: Type.STRING,
                description: "Checkmark or 'x' if new for 2026, else empty"
            },
            "New for 2025!": {
                type: Type.STRING,
                description: "Checkmark or 'x' if new for 2025, else empty"
            },
            "Last Updated": {
                type: Type.STRING,
                description: "Date the scholarship information was last updated or reviewed"
            },
            "Due Date": {
                type: Type.STRING,
                description: "Application deadline date"
            },
            "In State / National": {
                type: Type.STRING,
                description: "Is it 'In-State', 'National', or 'Any'?"
            },
            "Portal / Scholarship": {
                type: Type.STRING,
                description: "Is it a 'Portal' or a specific 'Scholarship'?"
            },
            "Amount": {
                type: Type.STRING,
                description: "Dollar amount or 'TBD'"
            },
            "Location/Information": {
                type: Type.STRING,
                description: "Sponsor or location/information about who offers it"
            },
            "Name of Scholarship": {
                type: Type.STRING,
                description: "Exact name of the scholarship"
            },
            "Application Link/Method": {
                type: Type.STRING,
                description: "Method of applying: 'Paper Application', 'Application Portal', 'Printable Application', etc. MUST include the URL if one is found."
            },
            "Summary": {
                type: Type.STRING,
                description: "A 2-3 sentence summary of the eligibility constraints and what the scholarship is for"
            },
            "Stated Min GPA": {
                type: Type.STRING,
                description: "Minimum GPA required (e.g., '2.5', '2.0', or 'Any' if not stated)"
            },
            "School Type": {
                type: Type.STRING,
                description: "Type of school: '2-Year', '4-Year', 'Trade', or 'Any'"
            },
            "Renewing/Non-Renewing": {
                type: Type.STRING,
                description: "'Renewing', 'Non-Renewing', or 'Any'"
            },
            "Focus": {
                type: Type.STRING,
                description: "Academic focus or major intended (e.g., 'Natural Resources', 'Any')"
            },
            "Acute Financial Need": {
                type: Type.STRING,
                description: "'Yes', 'No', or empty if unspecified"
            },
            "Accepts Gap Year Apps Upon Return": {
                type: Type.STRING,
                description: "Accepts Gap Year Applications Upon Return ('Yes' or empty)"
            },
            "POC (Emails, Names, Phone)": {
                type: Type.STRING,
                description: "Point of Contact information (Phone numbers, emails, names)"
            },
            "Notes": {
                type: Type.STRING,
                description: "Any extra notes or contact progress"
            },
            "Known Applicants 2025": {
                type: Type.STRING,
                description: "Known number of applicants in 2025, if stated"
            }
        },
        required: [
            "Name of Scholarship",
            "Due Date",
            "Amount",
            "Summary",
            "School Type",
            "Focus",
            "Stated Min GPA"
        ]
    }
};

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const mode = formData.get('mode') as string;

        let rawText = '';
        let sourceRef = 'Admin Portal Direct Ingestion';

        if (mode === 'url') {
            const url = formData.get('url') as string;
            if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 });

            sourceRef = url;
            const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);

            const html = await res.text();
            const $ = cheerio.load(html);
            // Quick text extraction prioritizing body content
            $('script, style, nav, footer, iframe').remove();
            rawText = $('body').text().replace(/\s+/g, ' ').trim();

            if (rawText.length > 50000) {
                rawText = rawText.substring(0, 50000); // 50k char cap to protect context window limit
            }
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

        // 2. Transmit unstructured data to Gemini 2.5 Flash
        const prompt = `
        You are an expert scholarship directory extractor. I need you to read the following text and extract the relevant information.
        
        CRITICAL INSTRUCTION: DO NOT merge distinct scholarships together. If you see a landing page referencing 10 different specific scholarships, output an array containing 10 separate objects. Map the information to the requested JSON schema exactly.
        
        CRITICAL INSTRUCTIONS FOR SPECIFIC FIELDS:
        1. "Amount": You MUST look very hard for any monetary amounts. Do not leave this blank if any dollar figure or variable amount is mentioned.
        2. "Application Link/Method": Output a literal URL starting with "http" if you see one in the text. If you cannot find a specific application link, explicitly write: ${sourceRef}. Your entire final output for this field must ALWAYS start with "http" unless it is completely blank.
        3. "Stated Min GPA": Find any mention of GPA, Grades, Academic Standing. IF NOT STATED AT ALL, explicitly write "Any".
        4. "School Type": Identify if this is for a 2-Year, 4-Year, Trade school. IF NOT STATED, explicitly write "Any".
        5. "Renewing/Non-Renewing": Find any mention of "renewable", "one-time", "annual". If it says renewable, write "Renewing". If it says one-time or does not state it, default to "Non-Renewing" or "Any".
        
        Source Reference: ${sourceRef}
        
        Website/Document Text:
        ${rawText}
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: scholarshipSchema,
                temperature: 0.1,
            }
        });

        if (!response.text) throw new Error('AI returned an empty extraction.');

        const extractedJsonArray = JSON.parse(response.text);

        return NextResponse.json({ success: true, data: extractedJsonArray });

    } catch (error: any) {
        console.error('Extraction Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to extract data' }, { status: 500 });
    }
}
