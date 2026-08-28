'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export type BacktestActionState = {
  error?: string;
  success?: string;
  backtestRunId?: string;
};

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
