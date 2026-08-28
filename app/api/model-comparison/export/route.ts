import { requireUser } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';

function csvCell(value: unknown) {
  const text = value === null || value === undefined ? '' : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET(request: Request) {
  await requireUser('/analysis/model-comparison');
  const url = new URL(request.url);
  const forecastRunId = url.searchParams.get('forecastRunId');
  const itemId = url.searchParams.get('itemId');
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');
  if (!forecastRunId) return new Response('forecastRunId가 필요합니다.', { status: 400 });

  const supabase = await createSupabaseServerClient();
  let query = supabase.schema('analytics').from('v_model_comparison').select('*').eq('forecast_run_id', forecastRunId).order('forecast_date', { ascending: true }).order('model_id', { ascending: true });
  if (itemId) query = query.eq('item_id', itemId);
  if (from) query = query.gte('forecast_date', from);
  if (to) query = query.lte('forecast_date', to);
  const { data, error } = await query;
  if (error) return Response.json({ error: error.message }, { status: 500 });

  const headers = ['forecast_run_id', 'model_id', 'model_version', 'model_name', 'item_id', 'forecast_date', 'actual_qty', 'forecast_value', 'p50', 'p80', 'p90', 'prediction_lower', 'prediction_upper', 'validation_status'];
  const lines = [headers.map(csvCell).join(',')];
  for (const row of data ?? []) lines.push(headers.map((header) => csvCell((row as Record<string, unknown>)[header])).join(','));
  return new Response(`\uFEFF${lines.join('\r\n')}`, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="model-comparison-${forecastRunId.slice(0, 8)}.csv"`,
    },
  });
}
