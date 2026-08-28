'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requestPythonBacktest, requestPythonForecast } from '@/lib/python-forecast';

export type BacktestActionState = {
  error?: string;
  success?: string;
  backtestRunId?: string;
  forecastRunId?: string;
};

function parseJsonObject(raw: string) {
  if (!raw.trim()) return {};
  const parsed = JSON.parse(raw) as unknown;
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('모델 파라미터는 JSON 객체여야 합니다.');
  return parsed as Record<string, unknown>;
}

export async function startPythonForecastAction(_previousState: BacktestActionState, formData: FormData): Promise<BacktestActionState> {
  const context = await requireAdmin('/admin/backtest');
  const horizon = Number(formData.get('horizon') ?? 28);
  if (!Number.isInteger(horizon) || horizon < 1 || horizon > 366) return { error: '예측 기간은 1~366일의 정수로 입력하세요.' };
  const modelIds = String(formData.get('model_ids') ?? '').split(',').map((value) => value.trim().toUpperCase()).filter(Boolean);
  let params: Record<string, unknown>;
  try {
    params = parseJsonObject(String(formData.get('params_json') ?? ''));
  } catch (error) {
    return { error: error instanceof Error ? error.message : '모델 파라미터 JSON을 확인하세요.' };
  }

  const supabase = await createSupabaseServerClient();
  const now = new Date().toISOString();
  const { data: setting } = await supabase.schema('core').from('forecast_setting').select('train_start,train_end').eq('setting_key', 'DEFAULT').maybeSingle();
  const { data: run, error: runError } = await supabase.schema('core').from('forecast_run').insert({
    status: 'RUNNING',
    stale: false,
    forecast_setting_key: 'DEFAULT',
    triggered_by: context.user.id,
    data_snapshot_at: now,
    train_start: setting?.train_start ?? null,
    train_end: setting?.train_end ?? null,
    pipeline_type: 'PYTHON',
    service_name: 'python-forecast',
    request_params: { horizon, model_ids: modelIds, params },
    started_at: now,
  }).select('forecast_run_id').single();
  if (runError || !run) return { error: runError?.message ?? 'Forecast Run을 만들지 못했습니다.' };

  const failRun = async (message: string) => {
    await supabase.schema('core').from('forecast_run').update({ status: 'FAILED', error_message: message.slice(0, 2000), completed_at: new Date().toISOString() }).eq('forecast_run_id', run.forecast_run_id);
  };

  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  if (!accessToken) {
    await failRun('Supabase 사용자 세션이 없습니다.');
    return { error: 'Supabase 사용자 세션이 없습니다.', forecastRunId: run.forecast_run_id };
  }

  try {
    const result = await requestPythonForecast({
      run_id: run.forecast_run_id,
      horizon,
      models: modelIds.length > 0 ? modelIds.map((modelId) => ({ model_id: modelId, model_version: '1.0', params })) : undefined,
    }, accessToken);
    if (result.status !== 'READY') throw new Error('Python Forecast Service가 READY 결과를 반환하지 않았습니다.');
    let backtestMessage = '자동 Backtest를 실행하지 못했습니다.';
    try {
      const backtest = await requestPythonBacktest(run.forecast_run_id, accessToken);
      backtestMessage = backtest.backtest_run_id ? `자동 Backtest ${backtest.backtest_run_id.slice(0, 8)}도 완료했습니다.` : '자동 Backtest가 완료되었습니다.';
    } catch (error) {
      backtestMessage = `Forecast는 저장됐지만 자동 Backtest는 실패했습니다: ${error instanceof Error ? error.message : '재실행 필요'}`;
    }
    revalidatePath('/admin/backtest');
    revalidatePath('/analysis/model-comparison');
    return { success: `Python Forecast를 완료했습니다. ${result.result_count}건의 결과를 저장했습니다. ${backtestMessage}`, forecastRunId: run.forecast_run_id };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Python Forecast 실행에 실패했습니다.';
    await failRun(message);
    revalidatePath('/admin/backtest');
    return { error: message, forecastRunId: run.forecast_run_id };
  }
}

export async function runBacktestAction(_previousState: BacktestActionState, formData: FormData): Promise<BacktestActionState> {
  await requireAdmin('/admin/backtest');
  const forecastRunId = String(formData.get('forecast_run_id') ?? '').trim();
  const metric = String(formData.get('metric') ?? '').trim().toUpperCase();
  if (!forecastRunId) return { error: '기존 Forecast Run을 선택하세요.' };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.schema('core').rpc('run_backtest', {
    p_forecast_run_id: forecastRunId,
    p_metric: metric || null,
  });
  if (error) return { error: error.message };

  revalidatePath('/admin/backtest');
  revalidatePath('/analysis/model-comparison');
  return { success: '저장된 Forecast Result를 다시 계산하지 않고 Backtest를 완료했습니다.', backtestRunId: String(data ?? '') };
}

export async function setManualChampionAction(_previousState: BacktestActionState, formData: FormData): Promise<BacktestActionState> {
  await requireAdmin('/admin/backtest');
  const itemId = String(formData.get('item_id') ?? '').trim();
  const modelId = String(formData.get('model_id') ?? '').trim();
  const modelVersion = String(formData.get('model_version') ?? '').trim();
  const reason = String(formData.get('reason') ?? '').trim();
  const backtestRunId = String(formData.get('backtest_run_id') ?? '').trim();
  if (!itemId || !modelId || !modelVersion) return { error: '품목과 모델을 선택하세요.' };
  if (!reason) return { error: '수동 Champion 변경 사유를 입력하세요.' };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.schema('core').rpc('set_manual_champion', {
    p_item_id: itemId,
    p_model_id: modelId,
    p_model_version: modelVersion,
    p_reason: reason,
    p_backtest_run_id: backtestRunId || null,
  });
  if (error) {
    if (error.message.includes('MANUAL_REASON_REQUIRED')) return { error: '수동 Champion 변경 사유를 입력하세요.' };
    if (error.message.includes('CANDIDATE_PERFORMANCE_UNAVAILABLE')) return { error: '선택한 모델의 유효한 성능 결과가 없습니다.' };
    return { error: error.message };
  }

  revalidatePath('/admin/backtest');
  revalidatePath('/analysis/model-comparison');
  return { success: '수동 Champion을 저장했고 audit_log에 기록했습니다.' };
}
