import 'server-only';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { AppUser } from '@/lib/auth';
import type { ImportMode, ImportType, ValidatedRow } from './types.ts';

export type UploadBatch = {
  batch_id: string;
  file_name: string;
  import_type: ImportType;
  import_mode: ImportMode;
  total_rows: number;
  success_rows: number;
  warning_rows: number;
  error_rows: number;
  status: string;
  uploaded_by: string;
  uploaded_at: string;
  imported_at: string | null;
  rolled_back_at: string | null;
  replace_snapshot_at: string | null;
  error_message: string | null;
};

export type StagingRow = {
  staging_id: number;
  row_number: number;
  original_data: Record<string, unknown>;
  mapped_data: Record<string, unknown> | null;
  validation_status: 'PENDING' | 'SUCCESS' | 'WARNING' | 'ERROR';
};

function throwIfError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export async function createUploadBatch(input: { fileName: string; importType: ImportType; importMode: ImportMode; uploadedBy: string; totalRows: number }) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.schema('core').from('upload_batch').insert({
    file_name: input.fileName,
    import_type: input.importType,
    import_mode: input.importMode,
    total_rows: input.totalRows,
    uploaded_by: input.uploadedBy,
  }).select('*').single();
  throwIfError(error);
  return data as UploadBatch;
}

export async function insertStagingRows(batchId: string, rows: Array<{ rowNumber: number; originalData: Record<string, unknown> }>) {
  const supabase = await createSupabaseServerClient();
  for (let start = 0; start < rows.length; start += 500) {
    const chunk = rows.slice(start, start + 500).map((row) => ({ batch_id: batchId, row_number: row.rowNumber, original_data: row.originalData }));
    const { error } = await supabase.schema('core').from('import_staging').insert(chunk);
    throwIfError(error);
  }
}

export async function getBatch(batchId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.schema('core').from('upload_batch').select('*').eq('batch_id', batchId).maybeSingle();
  throwIfError(error);
  return data as UploadBatch | null;
}

export async function getStagingRows(batchId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.schema('core').from('import_staging').select('staging_id,row_number,original_data,mapped_data,validation_status').eq('batch_id', batchId).order('row_number', { ascending: true });
  throwIfError(error);
  return (data ?? []) as StagingRow[];
}

export async function loadReferences() {
  const supabase = await createSupabaseServerClient();
  const [items, suppliers] = await Promise.all([
    supabase.schema('core').from('v_item_master').select('item_id'),
    supabase.schema('core').from('v_supplier_master').select('supplier_id'),
  ]);
  throwIfError(items.error);
  throwIfError(suppliers.error);
  return {
    itemIds: new Set((items.data ?? []).map((row) => String(row.item_id).trim()).filter(Boolean)),
    supplierIds: new Set((suppliers.data ?? []).map((row) => String(row.supplier_id).trim()).filter(Boolean)),
  };
}

export async function saveMappings(input: { importType: ImportType; mapping: Record<string, string | null>; createdBy: string }) {
  const supabase = await createSupabaseServerClient();
  const rows = Object.entries(input.mapping)
    .filter(([, sourceColumn]) => sourceColumn)
    .map(([targetField, sourceColumn]) => ({ import_type: input.importType, source_column: sourceColumn, target_field: targetField, created_by: input.createdBy, last_used_at: new Date().toISOString() }));
  if (!rows.length) return;
  const { error } = await supabase.schema('core').from('column_mapping').upsert(rows, { onConflict: 'import_type,source_column,target_field' });
  throwIfError(error);
}

export async function saveValidationResult(batchId: string, stagingRows: StagingRow[], validatedRows: ValidatedRow[]) {
  const supabase = await createSupabaseServerClient();
  const stagingIdByRow = new Map(stagingRows.map((row) => [row.row_number, row.staging_id]));
  const errors = validatedRows.flatMap((row) => row.issues.map((issue) => ({
    batch_id: batchId,
    staging_id: stagingIdByRow.get(row.rowNumber) ?? null,
    row_number: row.rowNumber,
    field_name: issue.fieldName ?? null,
    error_code: issue.code,
    error_message: issue.message,
    severity: issue.severity,
    original_value: issue.originalValue === undefined || issue.originalValue === null ? null : String(issue.originalValue),
  })));
  const { error: deleteError } = await supabase.schema('core').from('validation_error').delete().eq('batch_id', batchId);
  throwIfError(deleteError);
  for (let start = 0; start < errors.length; start += 500) {
    const { error } = await supabase.schema('core').from('validation_error').insert(errors.slice(start, start + 500));
    throwIfError(error);
  }
  for (let start = 0; start < validatedRows.length; start += 500) {
    const chunk = validatedRows.slice(start, start + 500).map((row) => ({
      staging_id: stagingIdByRow.get(row.rowNumber),
      mapped_data: row.mappedData,
      validation_status: row.status,
    }));
    const { error } = await supabase.schema('core').from('import_staging').upsert(chunk, { onConflict: 'staging_id' });
    throwIfError(error);
  }
  const successRows = validatedRows.filter((row) => row.status === 'SUCCESS').length;
  const warningRows = validatedRows.filter((row) => row.status === 'WARNING').length;
  const errorRows = validatedRows.filter((row) => row.status === 'ERROR').length;
  const { error: batchError } = await supabase.schema('core').from('upload_batch').update({ success_rows: successRows, warning_rows: warningRows, error_rows: errorRows, status: errorRows > 0 ? 'VALIDATED_WITH_ERRORS' : 'VALIDATED', error_message: null }).eq('batch_id', batchId);
  throwIfError(batchError);
  return { successRows, warningRows, errorRows, status: errorRows > 0 ? 'VALIDATED_WITH_ERRORS' : 'VALIDATED' };
}

export async function setBatchStatus(batchId: string, status: string, extra: Record<string, unknown> = {}) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.schema('core').from('upload_batch').update({ status, ...extra }).eq('batch_id', batchId);
  throwIfError(error);
}

export async function getApprovedMappedRows(batchId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.schema('core').from('import_staging').select('mapped_data').eq('batch_id', batchId).in('validation_status', ['SUCCESS', 'WARNING']).not('mapped_data', 'is', null).order('row_number', { ascending: true });
  throwIfError(error);
  return (data ?? []).map((row) => row.mapped_data as Record<string, unknown>);
}

export async function importRows(batchId: string, rows: Record<string, unknown>[]) {
  const supabase = await createSupabaseServerClient();
  let imported = 0;
  for (let start = 0; start < rows.length; start += 500) {
    const { data, error } = await supabase.schema('core').rpc('import_batch_rows', { p_batch_id: batchId, p_rows: rows.slice(start, start + 500) });
    throwIfError(error);
    imported += Number(data ?? 0);
  }
  return imported;
}

export async function rollbackBatch(batchId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.schema('core').rpc('rollback_batch', { p_batch_id: batchId });
  throwIfError(error);
  return Number(data ?? 0);
}

export type HistoryRow = UploadBatch & { uploadedByLabel: string };

export async function getImportHistory(): Promise<HistoryRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.schema('core').from('upload_batch').select('*').order('uploaded_at', { ascending: false }).limit(50);
  throwIfError(error);
  const batches = (data ?? []) as UploadBatch[];
  const ids = batches.map((batch) => batch.uploaded_by);
  if (!ids.length) return [];
  const { data: users, error: usersError } = await supabase.schema('core').from('app_user').select('user_id,email,name').in('user_id', ids);
  throwIfError(usersError);
  const userMap = new Map((users ?? []).map((user) => [user.user_id, user as Pick<AppUser, 'user_id' | 'email' | 'name'>]));
  return batches.map((batch) => {
    const user = userMap.get(batch.uploaded_by);
    return { ...batch, uploadedByLabel: user ? `${user.name || user.email} (${user.email})` : batch.uploaded_by.slice(0, 8) };
  });
}
