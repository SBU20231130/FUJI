export const IMPORT_TYPES = [
  'usage_history',
  'inventory',
  'item_master',
  'supplier_master',
  'purchase_order',
  'goods_receipt',
  'sales_order',
  'business_event',
  'item_substitute',
] as const;

export type ImportType = (typeof IMPORT_TYPES)[number];
export type ImportMode = 'append' | 'upsert' | 'replace';
export type ValidationStatus = 'PENDING' | 'SUCCESS' | 'WARNING' | 'ERROR';
export type Severity = 'WARNING' | 'ERROR';

export type ParsedRow = {
  rowNumber: number;
  values: Record<string, unknown>;
};

export type ParsedFile = {
  fileType: 'CSV' | 'Excel';
  headers: string[];
  rows: ParsedRow[];
};

export type ColumnMapping = Record<string, string | null>;

export type ValidationIssue = {
  rowNumber: number;
  fieldName?: string;
  code: string;
  message: string;
  severity: Severity;
  originalValue?: unknown;
};

export type ValidatedRow = {
  rowNumber: number;
  originalData: Record<string, unknown>;
  mappedData: Record<string, unknown>;
  status: ValidationStatus;
  issues: ValidationIssue[];
};
