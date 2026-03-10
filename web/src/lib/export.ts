import * as ExcelJS from 'exceljs';

export async function downloadAsExcel(rows: Record<string, string>[]): Promise<string> {
    if (!rows || rows.length === 0) {
        throw new Error('No scholarships to export.');
    }

    // 1. Remove columns A and B ("New for 2025", "New for 2026")
    const cleanRows = rows.map(row => {
        const { 'New for 2025': _1, 'New for 2026': _2, ...rest } = row;
        return rest;
    });

    const workbook = new ExcelJS.Workbook();
    // 2. Freeze the first line (headers)
    const worksheet = workbook.addWorksheet('Matches', {
        views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }]
    });

    const headers = Object.keys(cleanRows[0]).filter(k => !k.endsWith('_url'));
    worksheet.columns = headers.map(h => ({
        header: h,
        key: h,
        // Auto-size columns slightly for better readability
        width: Math.min(h.length + 10, 40)
    }));

    // Add data rows, strictly dropping the synthetic _url tracking columns out of the print view
    const structuredRows = cleanRows.map(row => {
        const newRow: Record<string, string> = {};
        headers.forEach(h => newRow[h] = row[h] || '');
        return newRow;
    });
    worksheet.addRows(structuredRows);

    // Iterate through the rows and apply synthetic _url columns natively to the Excel cells
    structuredRows.forEach((row, rowIndex) => {
        // exceljs rows are 1-indexed, and Row 1 is the header. So data starts at Row 2.
        const excelRow = worksheet.getRow(rowIndex + 2);

        headers.forEach((h, colIndex) => {
            const urlField = `${h}_url`;
            const hyperlink = cleanRows[rowIndex][urlField];

            if (hyperlink) {
                // exceljs cells are 1-indexed
                const cell = excelRow.getCell(colIndex + 1);
                cell.value = {
                    text: cell.value as string,
                    hyperlink: hyperlink
                };
                // Standard blue underline for hyperlinks
                cell.font = { color: { argb: 'FF0563C1' }, underline: true };
            }
        });
    });

    // 3. Bold the first row & Add a solid line at the bottom
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
        cell.font = { bold: true };
        cell.border = {
            bottom: { style: 'medium', color: { argb: 'FF000000' } }
        };
    });

    // Return the base64 encoded string so React can insert it directly into a native <a> tag
    const buffer = await workbook.xlsx.writeBuffer();
    const base64Str = Buffer.from(buffer).toString('base64');
    return `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64Str}`;
}
