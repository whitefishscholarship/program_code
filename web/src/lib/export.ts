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

    const headers = Object.keys(cleanRows[0]);
    worksheet.columns = headers.map(h => ({
        header: h,
        key: h,
        // Auto-size columns slightly for better readability
        width: Math.min(h.length + 10, 40)
    }));

    // Add data rows
    worksheet.addRows(cleanRows);

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
