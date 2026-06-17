// Offline unit test for the PDF text path (no Gemini / no network).
// Parses a committed fixture PDF (scripts/fixtures/sample-scholarship.pdf) with the SAME
// pdf2json parser the admin route + batch loop use, and asserts known text round-trips.
// Mirrors the frozen Python fetch_resilient.py::extract_pdf_text round-trip test.
//
// FIXTURE NOTE: the fixture is page 1 of a REAL Women-in-Aviation scholarships PDF (the exact
// kind of assets.noviams.com PDF this path ingests), produced by Adobe PDF Library. We use a
// real-producer PDF on purpose: pdf2json's bundled pdf.js parses xref-STREAM PDFs (PDF 1.5+,
// as Acrobat/Adobe/Word emit) but throws "Invalid XRef stream header" on the classic-xref
// tables that fpdf2/reportlab/pypdf-from-scratch generate — so a synthetic minimal PDF can't
// exercise this code path. (Real scholarship PDFs in the backlog are Adobe/Acrobat output.)
// Run: npx tsx scripts/test-pdf-extract.ts
import { readFileSync } from 'fs';
import { join } from 'path';
import { parsePdfBuffer, isPdfUrl } from '../src/lib/extract';

let failed = 0;
function check(name: string, ok: boolean, detail = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : '  -> ' + detail}`);
  if (!ok) failed++;
}

// --- isPdfUrl classifier (pure) ---
check('isPdfUrl: .pdf path', isPdfUrl('https://assets.noviams.com/x/file.pdf'));
check('isPdfUrl: .pdf with query', isPdfUrl('https://x.org/a/b.pdf?dl=1'));
check('isPdfUrl: uppercase .PDF', isPdfUrl('https://x.org/A.PDF'));
check('isPdfUrl: html not pdf', !isPdfUrl('https://x.org/scholarships'));
check('isPdfUrl: pdf in querystring only is not a pdf url', !isPdfUrl('https://x.org/view?doc=a.pdf'));

// --- parsePdfBuffer round-trip on the fixture PDF ---
async function main() {
  const fixture = join(__dirname, 'fixtures', 'sample-scholarship.pdf');
  const buf = readFileSync(fixture);
  const text = await parsePdfBuffer(buf);

  check('parsePdfBuffer returns substantial text', text.length > 1000, `len=${text.length}`);
  check('extracts the document title', /WOMEN IN AVIATION INTERNATIONAL/i.test(text), text.slice(0, 200));
  check('extracts scholarship wording', /scholarship/i.test(text), text.slice(0, 200));
  check('extracts the year context', /WAI2025/i.test(text), text.slice(0, 200));

  console.log(failed === 0 ? '\nALL PASS' : `\n${failed} FAILED`);
  process.exit(failed === 0 ? 0 : 1);
}
main();
