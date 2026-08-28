'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { parseImportFile, ImportParseError } from '@/lib/import/parse';
import { IMPORT_SCHEMAS } from '@/lib/import/schema';
import { IMPORT_TYPES, type ColumnMapping, type ImportMode, type ImportType, type ValidatedRow } from '@/lib/import/types';
import { validateRows } from '@/lib/import/validate';
import { createUploadBatch, getApprovedMappedRows, getBatch, getStagingRows, importRows, insertStagingRows, loadReferences, rollbackBatch, saveMappings, saveValidationResult, setBatchStatus } from '@/lib/import/repository';

export type ImportActionState = {
  error?: string;
  message?: string;
  batch?: {
    batchId: string;
    fileName: string;
    importType: ImportType;
    importMode: ImportMode;
    totalRows: number;
    headers: string[];
    preview: Array<{ rowNumber: number; values: Record<string, unknown>; status?: string }>;
    mapping?: ColumnMapping;
    status?: string;
  };
  validation?: { successRows: number; warningRows: number; errorRows: number; status: string };
};

const emptyState: ImportActionState = {};

function safeError(error: unknown) {
  if (error instanceof ImportParseError) return error.message;
  if (error instanceof Error) return error.message.slice(0, 300);
  return '파일 처리 중 오류가 발생했습니다.';
}

function readImportType(value: FormDataEntryValue | null): ImportType | null {
  const type = String(value ?? '');
  return (IMPORT_TYPES as readonly string[]).includes(type) ? type as ImportType : null;
}

function readImportMode(value: FormDataEntryValue | null): ImportMode | null {
  const mode = String(value ?? '');
  return ['append', 'upsert', 'replace'].includes(mode) ? mode as ImportMode : null;
}

function readBatchId(value: FormDataEntryValue | null) {
  const batchId = String(value ?? '');
  return /^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(batchId) ? batchId : null;
}

function readMapping(value: FormDataEntryValue | null): ColumnMapping | null {
  try {
    const parsed = JSON.parse(String(value ?? '{}')) as Record<string, unknown>;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    return Object.fromEntries(Object.entries(parsed).map(([target, source]) => [target, typeof source === 'string' && source ? source : null]));
  } catch {
    return null;
  }
}

function previewRows(rows: Array<{ row_number: number; original_data: Record<string, unknown>; validation_status?: string }>) {
  return rows.slice(0, 20).map((row) => ({ rowNumber: row.row_number, values: row.original_data, status: row.validation_status }));
}

export async function prepareImportAction(_previousState: ImportActionState = emptyState, formData: FormData): Promise<ImportActionState> {
  const admin = await requireAdmin('/admin/data-management');
  try {
    const file = formData.get('file');
    const importType = readImportType(formData.get('import_type'));
    const importMode = readImportMode(formData.get('import_mode'));
    if (!(file instanceof File) || !file.name) return { error: 'CSV 또는 Excel 파일을 선택하세요.' };
    if (!importType || !importMode) return { error: '적재 유형과 모드를 확인하세요.' };
    const parsed = await parseImportFile(file);
    if (parsed.rows.length === 0) return { error: '파일에 데이터 행이 없습니다.' };
    const batch = await createUploadBatch({ fileName: file.name, importType, importMode, uploadedBy: admin.user.id, totalRows: parsed.rows.length });
    await insertStagingRows(batch.batch_id, parsed.rows.map((row) => ({ rowNumber: row.rowNumber, originalData: row.values })));
    const schema = IMPORT_SCHEMAS[importType];
    const mapping = Object.fromEntries(schema.fields.map((field) => [field.targetColumn, null]));
    return { batch: { batchId: batch.batch_id, fileName: file.name, importType, importMode, totalRows: parsed.rows.length, headers: parsed.headers, preview: parsed.rows.slice(0, 20).map((row) => ({ rowNumber: row.rowNumber, values: row.values })), mapping, status: batch.status } };
  } catch (error) {
    return { error: safeError(error) };
  }
}

export async function validateImportAction(_previousState: ImportActionState = emptyState, formData: FormData): Promise<ImportActionState> {
  const admin = await requireAdmin('/admin/data-management');
  try {
    const batchId = readBatchId(formData.get('batch_id'));
    const mapping = readMapping(formData.get('mapping'));
    if (!batchId || !mapping) return { error: '검증 요청 정보가 올바르지 않습니다.' };
    const batch = await getBatch(batchId);
    if (!batch) return { error: '적재 배치를 찾을 수 없습니다.' };
    const schema = IMPORT_SCHEMAS[batch.import_type];
    const stagingRows = await getStagingRows(batchId);
    const references = await loadReferences();
    const validatedRows = validateRows(stagingRows.map((row) => ({ rowNumber: row.row_number, values: row.original_data })), schema, mapping, references, batchId, new Date().toISOString());
    const validation = await saveValidationResult(batchId, stagingRows, validatedRows);
    await saveMappings({ importType: batch.import_type, mapping, createdBy: admin.user.id });
    return { batch: { batchId, fileName: batch.file_name, importType: batch.import_type, importMode: batch.import_mode, totalRows: batch.total_rows, headers: stagingRows[0] ? Object.keys(stagingRows[0].original_data) : [], preview: validatedRows.slice(0, 20).map((row) => ({ rowNumber: row.rowNumber, values: row.originalData, status: row.status })), mapping, status: validation.status }, validation };
  } catch (error) {
    return { error: safeError(error) };
  }
}

export async function importBatchAction(_previousState: ImportActionState = emptyState, formData: FormData): Promise<ImportActionState> {
  await requireAdmin('/admin/data-management');
  const batchId = readBatchId(formData.get('batch_id'));
  if (!batchId) return { error: '적재 배치 ID가 올바르지 않습니다.' };
  if (formData.get('confirm_import') !== 'true') return { error: '검증 결과를 확인한 뒤 적재를 확정하세요.' };
  try {
    const batch = await getBatch(batchId);
    if (!batch) return { error: '적재 배치를 찾을 수 없습니다.' };
    if (!['VALIDATED', 'VALIDATED_WITH_ERRORS'].includes(batch.status)) return { error: '검증 완료 상태의 배치만 적재할 수 있습니다.' };
    if (batch.import_mode === 'replace' && formData.get('confirm_replace') !== 'true') return { error: 'Replace 모드는 기존 데이터를 교체합니다. 별도 확인이 필요합니다.' };
    await setBatchStatus(batchId, 'IMPORTING');
    const rows = await getApprovedMappedRows(batchId);
    const imported = await importRows(batchId, rows);
    const now = new Date().toISOString();
    await setBatchStatus(batchId, 'IMPORTED', { imported_at: now, error_message: null });
    revalidatePath('/admin/data-management');
    revalidatePath('/admin/forecast-settings');
    return { message: `${imported}개 행을 적재했습니다.`, batch: { batchId, fileName: batch.file_name, importType: batch.import_type, importMode: batch.import_mode, totalRows: batch.total_rows, headers: [], preview: [], status: 'IMPORTED' } };
  } catch (error) {
    try { await setBatchStatus(batchId, 'FAILED', { error_message: safeError(error) }); } catch { /* 원래 오류를 보존합니다. */ }
    return { error: safeError(error) };
  }
}

export async function rollbackBatchAction(_previousState: ImportActionState = emptyState, formData: FormData): Promise<ImportActionState> {
  await requireAdmin('/admin/data-management');
  const batchId = readBatchId(formData.get('batch_id'));
  if (!batchId) return { error: '롤백 배치 ID가 올바르지 않습니다.' };
  if (formData.get('confirm_rollback') !== 'true') return { error: '롤백 확인이 필요합니다.' };
  try {
    const deleted = await rollbackBatch(batchId);
    revalidatePath('/admin/data-management');
    revalidatePath('/admin/forecast-settings');
    return { message: `배치를 롤백했습니다. ${deleted}개 행을 되돌렸습니다.` };
  } catch (error) {
    return { error: safeError(error) };
  }
}
