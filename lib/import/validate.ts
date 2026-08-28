import { buildRawRow, type ImportSchema } from './schema.ts';
import type { ColumnMapping, ParsedRow, ValidationIssue, ValidatedRow } from './types.ts';

export type ValidationReferences = {
  itemIds: Set<string>;
  supplierIds: Set<string>;
};

export function parseDate(value: unknown): string | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
  const text = String(value ?? '').trim().replace(/[/.]/g, '-');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
  const [year, month, day] = text.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? text : null;
}

export function parseNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const text = String(value ?? '').trim().replace(/,/g, '');
  if (!text) return null;
  if (!/^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(text)) return null;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseBoolean(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value;
  const text = String(value ?? '').trim().toLowerCase();
  if (['true', 't', 'yes', 'y', '1', '활성', '사용'].includes(text)) return true;
  if (['false', 'f', 'no', 'n', '0', '비활성', '미사용'].includes(text)) return false;
  return null;
}

function isBlank(value: unknown) {
  return value === null || value === undefined || String(value).trim() === '';
}

function normalizeText(value: unknown) {
  const text = String(value ?? '').trim();
  return text || null;
}

export function validateRows(rows: ParsedRow[], schema: ImportSchema, mapping: ColumnMapping, references: ValidationReferences, batchId: string, loadedAt: string): ValidatedRow[] {
  const seen = new Map<string, number>();
  const results: ValidatedRow[] = [];

  for (const parsedRow of rows) {
    const issues: ValidationIssue[] = [];
    const canonical: Record<string, unknown> = {};

    for (const fieldDefinition of schema.fields) {
      const sourceColumn = mapping[fieldDefinition.targetColumn];
      const originalValue = sourceColumn ? parsedRow.values[sourceColumn] : undefined;
      if (fieldDefinition.required && (!sourceColumn || isBlank(originalValue))) {
        issues.push({ rowNumber: parsedRow.rowNumber, fieldName: fieldDefinition.targetColumn, code: 'REQUIRED_VALUE_MISSING', message: `${fieldDefinition.name} 값이 필요합니다.`, severity: 'ERROR', originalValue });
        continue;
      }
      if (!sourceColumn || isBlank(originalValue)) continue;

      if (fieldDefinition.dataType === 'text') {
        canonical[fieldDefinition.targetColumn] = normalizeText(originalValue);
      } else if (fieldDefinition.dataType === 'number') {
        const number = parseNumber(originalValue);
        if (number === null) {
          issues.push({ rowNumber: parsedRow.rowNumber, fieldName: fieldDefinition.targetColumn, code: 'INVALID_NUMBER', message: `${fieldDefinition.name}은(는) 숫자여야 합니다.`, severity: 'ERROR', originalValue });
          continue;
        }
        canonical[fieldDefinition.targetColumn] = number;
        if (number < 0) issues.push({ rowNumber: parsedRow.rowNumber, fieldName: fieldDefinition.targetColumn, code: 'NEGATIVE_VALUE', message: `${fieldDefinition.name}에 음수가 입력되었습니다. 업무 규칙을 확인하세요.`, severity: 'WARNING', originalValue });
      } else if (fieldDefinition.dataType === 'date') {
        const date = parseDate(originalValue);
        if (!date) {
          issues.push({ rowNumber: parsedRow.rowNumber, fieldName: fieldDefinition.targetColumn, code: 'INVALID_DATE', message: `${fieldDefinition.name}은(는) YYYY-MM-DD 형식의 유효한 날짜여야 합니다.`, severity: 'ERROR', originalValue });
          continue;
        }
        canonical[fieldDefinition.targetColumn] = date;
      } else {
        const boolean = parseBoolean(originalValue);
        if (boolean === null) {
          issues.push({ rowNumber: parsedRow.rowNumber, fieldName: fieldDefinition.targetColumn, code: 'INVALID_BOOLEAN', message: `${fieldDefinition.name}은(는) true/false, Y/N 값이어야 합니다.`, severity: 'ERROR', originalValue });
          continue;
        }
        canonical[fieldDefinition.targetColumn] = boolean;
      }

      const normalizedReference = normalizeText(canonical[fieldDefinition.targetColumn]);
      if (normalizedReference && fieldDefinition.reference === 'item' && !references.itemIds.has(normalizedReference)) {
        issues.push({ rowNumber: parsedRow.rowNumber, fieldName: fieldDefinition.targetColumn, code: 'UNKNOWN_ITEM', message: `등록되지 않은 품목입니다: ${normalizedReference}`, severity: 'ERROR', originalValue });
      }
      if (normalizedReference && fieldDefinition.reference === 'supplier' && !references.supplierIds.has(normalizedReference)) {
        issues.push({ rowNumber: parsedRow.rowNumber, fieldName: fieldDefinition.targetColumn, code: 'UNKNOWN_SUPPLIER', message: `등록되지 않은 공급업체입니다: ${normalizedReference}`, severity: 'ERROR', originalValue });
      }
    }

    const naturalKey = schema.naturalKey.map((key) => String(canonical[key] ?? '').trim()).join('|');
    if (naturalKey && seen.has(naturalKey)) {
      issues.push({ rowNumber: parsedRow.rowNumber, code: 'DUPLICATE_ROW', message: `파일 안에서 ${seen.get(naturalKey)}행과 자연키가 중복됩니다.`, severity: 'ERROR' });
    } else if (naturalKey) {
      seen.set(naturalKey, parsedRow.rowNumber);
    }

    for (const [earlier, later] of schema.dateRules) {
      const earlierDate = canonical[earlier];
      const laterDate = canonical[later];
      if (earlierDate && laterDate && String(earlierDate) > String(laterDate)) {
        issues.push({ rowNumber: parsedRow.rowNumber, fieldName: later, code: 'INVALID_DATE_ORDER', message: `${earlier}은(는) ${later}보다 늦을 수 없습니다.`, severity: 'ERROR' });
      }
    }

    const status = issues.some((issue) => issue.severity === 'ERROR') ? 'ERROR' : issues.length > 0 ? 'WARNING' : 'SUCCESS';
    results.push({ rowNumber: parsedRow.rowNumber, originalData: parsedRow.values, mappedData: buildRawRow(schema, canonical, batchId, parsedRow.rowNumber, loadedAt), status, issues });
  }
  return results;
}
