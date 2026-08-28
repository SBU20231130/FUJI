import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import type { ParsedFile, ParsedRow } from './types.ts';

export class ImportParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImportParseError';
  }
}

const MAX_FILE_BYTES = 25 * 1024 * 1024;

function cleanRow(row: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [key.replace(/^\uFEFF/, '').trim(), value]));
}

function validateHeaders(headers: string[]) {
  if (headers.length === 0 || headers.some((header) => !header.trim())) throw new ImportParseError('첫 행에 컬럼명이 있어야 합니다.');
  const normalized = headers.map((header) => header.trim().toLowerCase());
  if (new Set(normalized).size !== normalized.length) throw new ImportParseError('중복된 컬럼명이 있습니다. 컬럼명을 하나씩만 남겨주세요.');
}

function parseCsv(buffer: Buffer): ParsedFile {
  const text = buffer.toString('utf8').replace(/^\uFEFF/, '');
  const result = Papa.parse<Record<string, unknown>>(text, { header: true, skipEmptyLines: 'greedy', dynamicTyping: false });
  if (result.errors.length > 0) {
    const first = result.errors[0];
    throw new ImportParseError(`CSV를 읽지 못했습니다. ${first.message}`);
  }
  const headers = (result.meta.fields ?? []).map((header) => header.trim());
  validateHeaders(headers);
  const rows: ParsedRow[] = result.data.map((row, index) => ({ rowNumber: index + 2, values: cleanRow(row) }));
  return { fileType: 'CSV', headers, rows };
}

function excelValue(value: unknown) {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return value;
}

function parseExcel(buffer: Buffer): ParsedFile {
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  } catch {
    throw new ImportParseError('Excel 파일을 읽지 못했습니다. .xlsx 파일인지 확인하세요.');
  }
  const firstSheet = workbook.SheetNames[0];
  if (!firstSheet) throw new ImportParseError('Excel 파일에 시트가 없습니다.');
  const sheet = workbook.Sheets[firstSheet];
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' });
  const [headerRow, ...dataRows] = matrix;
  const headers = (headerRow ?? []).map((value) => String(value).trim());
  validateHeaders(headers);
  const rows = dataRows
    .map((row, index) => {
      const values = Object.fromEntries(headers.map((header, columnIndex) => [header, excelValue(row[columnIndex])])) as Record<string, unknown>;
      return { rowNumber: index + 2, values };
    })
    .filter((row) => Object.values(row.values).some((value) => String(value ?? '').trim() !== ''));
  return { fileType: 'Excel', headers, rows };
}

export async function parseImportFile(file: File): Promise<ParsedFile> {
  if (file.size === 0) throw new ImportParseError('빈 파일은 업로드할 수 없습니다.');
  if (file.size > MAX_FILE_BYTES) throw new ImportParseError('파일 크기는 25MB 이하만 허용됩니다.');
  const extension = file.name.toLowerCase().split('.').pop();
  if (!extension || !['csv', 'xlsx', 'xls'].includes(extension)) throw new ImportParseError('CSV 또는 Excel(.xlsx/.xls) 파일만 업로드할 수 있습니다.');
  const buffer = Buffer.from(await file.arrayBuffer());
  return extension === 'csv' ? parseCsv(buffer) : parseExcel(buffer);
}

export { MAX_FILE_BYTES };
