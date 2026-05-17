import * as XLSX from 'xlsx';

/**
 * Convert a CSV string to an Excel (.xlsx) file and trigger browser download.
 */
export function downloadExcelFromCsv(csvText: string, filename: string): void {
  const workbook = XLSX.read(csvText, { type: 'string' });
  const excelFilename = filename.replace(/\.csv$/i, '') + '.xlsx';
  XLSX.writeFile(workbook, excelFilename);
}

/**
 * Convert a Blob (CSV response from backend) to an Excel (.xlsx) file and trigger browser download.
 */
export async function downloadExcelFromBlob(blob: Blob, filename: string): Promise<void> {
  const text = await blob.text();
  downloadExcelFromCsv(text, filename);
}

/**
 * Convert a plain array of objects to an Excel (.xlsx) file and trigger browser download.
 */
export function downloadExcelFromData(data: Record<string, any>[], filename: string, sheetName = 'Sheet1'): void {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  const excelFilename = filename.replace(/\.csv$/i, '') + '.xlsx';
  XLSX.writeFile(workbook, excelFilename);
}
