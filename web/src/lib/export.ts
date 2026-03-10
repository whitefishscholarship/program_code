import * as XLSX from 'xlsx';

export function downloadAsExcel(rows: Record<string, string>[]): string {
    if (!rows || rows.length === 0) {
        throw new Error('No scholarships to export.');
    }

    // Create worksheet directly from the array of objects (keeps exact headers)
    const worksheet = XLSX.utils.json_to_sheet(rows);

    // Auto-size columns slightly for better readability
    const columnWidths = Object.keys(rows[0]).map(key => ({
        wch: Math.min(key.length + 10, 40)
    }));
    worksheet['!cols'] = columnWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Matches');

    // Return the base64 encoded string so React can insert it directly into a native <a> tag
    const base64Str = XLSX.write(workbook, { bookType: 'xlsx', type: 'base64' });
    return `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64Str}`;
}
