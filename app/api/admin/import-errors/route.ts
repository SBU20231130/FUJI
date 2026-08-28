import { ForbiddenError, requireAdmin } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';

function csvCell(value: unknown) {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export async function GET(request: Request) {
  try {
    await requireAdmin('/admin/data-management');
  } catch (error) {
    if (error instanceof ForbiddenError) return Response.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });
    throw error;
  }
  const batchId = new URL(request.url).searchParams.get('batch_id') ?? '';
  if (!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(batchId)) return Response.json({ error: 'batch_id가 올바르지 않습니다.' }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  const [{ data: errors, error: errorsError }, { data: staging, error: stagingError }] = await Promise.all([
    supabase.schema('core').from('validation_error').select('row_number,field_name,error_code,error_message,severity,original_value').eq('batch_id', batchId).order('row_number', { ascending: true }),
    supabase.schema('core').from('import_staging').select('row_number,original_data').eq('batch_id', batchId).order('row_number', { ascending: true }),
  ]);
  if (errorsError || stagingError) return Response.json({ error: errorsError?.message ?? stagingError?.message ?? '검증 오류를 조회하지 못했습니다.' }, { status: 500 });
  const originalColumns = Array.from(new Set((staging ?? []).flatMap((row) => Object.keys((row.original_data ?? {}) as Record<string, unknown>))));
  const rowsByNumber = new Map((staging ?? []).map((row) => [row.row_number, row.original_data as Record<string, unknown>]));
  const header = ['row_number', ...originalColumns, 'field_name', 'error_code', 'error_message', 'severity', 'original_value'];
  const lines = [header.map(csvCell).join(',')];
  for (const error of errors ?? []) {
    const original = rowsByNumber.get(error.row_number) ?? {};
    lines.push([error.row_number, ...originalColumns.map((column) => original[column]), error.field_name, error.error_code, error.error_message, error.severity, error.original_value].map(csvCell).join(','));
  }
  return new Response(`\uFEFF${lines.join('\r\n')}\r\n`, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="import-errors-${batchId}.csv"`, 'Cache-Control': 'no-store' } });
}
