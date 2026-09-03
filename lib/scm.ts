import { createSupabaseServerClient } from './supabase';
import { normalizeBacktestRun, normalizeChampionModel, normalizeComparisonPoint, normalizeDemandProfile, normalizeDemandProfileKpi, normalizeForecastRun, normalizeForecastSettings, normalizeInventoryProjection, normalizeLeadtimeGap, normalizeLeadtimePolicy, normalizeLeadtimePolicyHistory, normalizeModelConfig, normalizeModelPerformance, normalizePurchaseRecommendation, normalizeSafetyStock, normalizeStockoutKpi, normalizeStockoutRisk, type BacktestRun, type ChampionModel, type ComparisonPoint, type DemandProfile, type DemandProfileKpi, type ForecastRun, type ForecastSettings, type InventoryProjectionRow, type LeadtimeGap, type LeadtimePolicy, type LeadtimePolicyHistory, type ModelConfig, type ModelPerformance, type PurchaseRecommendation, type SafetyStock, type StockoutKpi, type StockoutRisk } from './scm-model';

export async function getDemandProfile(): Promise<{ rows: DemandProfile[]; error: string | null }> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.schema('analytics').from('v_sku_demand_profile').select('*').order('item_id', { ascending: true });
    if (error) return { rows: [], error: error.message };
    return { rows: (data ?? []).map((row) => normalizeDemandProfile(row as Record<string, unknown>)), error: null };
  } catch (error) {
    return { rows: [], error: error instanceof Error ? error.message : 'Supabase 조회에 실패했습니다.' };
  }
}

export async function getDemandProfileKpi(): Promise<{ data: DemandProfileKpi | null; error: string | null }> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.schema('analytics').from('v_demand_profile_kpi').select('*').maybeSingle();
    if (error) return { data: null, error: error.message };
    return { data: normalizeDemandProfileKpi(data as Record<string, unknown> | null), error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Supabase 조회에 실패했습니다.' };
  }
}

export async function getLeadtimeGap(): Promise<{ rows: LeadtimeGap[]; error: string | null }> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc('get_leadtime_gap');
    if (error) return { rows: [], error: error.message };
    return { rows: (data ?? []).map((row: Record<string, unknown>) => normalizeLeadtimeGap(row)), error: null };
  } catch (error) {
    return { rows: [], error: error instanceof Error ? error.message : 'Supabase 조회에 실패했습니다.' };
  }
}

export async function getLeadtimePolicy(): Promise<{ rows: LeadtimePolicy[]; error: string | null }> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.schema('analytics').from('v_leadtime_policy').select('*').order('supplier_id').order('item_id');
    if (error) return { rows: [], error: error.message };
    return { rows: (data ?? []).map((row) => normalizeLeadtimePolicy(row as Record<string, unknown>)), error: null };
  } catch (error) {
    return { rows: [], error: error instanceof Error ? error.message : 'Supabase 조회에 실패했습니다.' };
  }
}

export async function getLeadtimePolicyHistory(): Promise<{ rows: LeadtimePolicyHistory[]; error: string | null }> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.schema('analytics').from('v_leadtime_policy_history').select('*').order('changed_at', { ascending: false });
    if (error) return { rows: [], error: error.message };
    return { rows: (data ?? []).map((row) => normalizeLeadtimePolicyHistory(row as Record<string, unknown>)), error: null };
  } catch (error) {
    return { rows: [], error: error instanceof Error ? error.message : 'Supabase 조회에 실패했습니다.' };
  }
}

export async function getStockoutKpi(): Promise<{ data: StockoutKpi | null; error: string | null }> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.schema('analytics').from('v_stockout_kpi').select('*').maybeSingle();
    if (error) return { data: null, error: error.message };
    return { data: normalizeStockoutKpi(data as Record<string, unknown> | null), error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Supabase 조회에 실패했습니다.' };
  }
}

export async function getStockoutRisk(itemId?: string): Promise<{ rows: StockoutRisk[]; error: string | null }> {
  try {
    const supabase = await createSupabaseServerClient();
    let query = supabase.schema('analytics').from('v_stockout_risk').select('*').order('item_id');
    if (itemId) query = query.eq('item_id', itemId);
    const { data, error } = await query;
    if (error) return { rows: [], error: error.message };
    return { rows: (data ?? []).map((row) => normalizeStockoutRisk(row as Record<string, unknown>)), error: null };
  } catch (error) {
    return { rows: [], error: error instanceof Error ? error.message : 'Supabase 조회에 실패했습니다.' };
  }
}

export async function getInventoryProjection(itemId?: string): Promise<{ rows: InventoryProjectionRow[]; error: string | null }> {
  try {
    const supabase = await createSupabaseServerClient();
    let query = supabase.schema('analytics').from('v_inventory_projection').select('*').order('item_id').order('period');
    if (itemId) query = query.eq('item_id', itemId);
    const { data, error } = await query;
    if (error) return { rows: [], error: error.message };
    return { rows: (data ?? []).map((row) => normalizeInventoryProjection(row as Record<string, unknown>)), error: null };
  } catch (error) {
    return { rows: [], error: error instanceof Error ? error.message : 'Supabase 조회에 실패했습니다.' };
  }
}

export async function getSafetyStock(itemId?: string): Promise<{ rows: SafetyStock[]; error: string | null }> {
  try {
    const supabase = await createSupabaseServerClient();
    let query = supabase.schema('analytics').from('v_safety_stock').select('*').order('item_id');
    if (itemId) query = query.eq('item_id', itemId);
    const { data, error } = await query;
    if (error) return { rows: [], error: error.message };
    return { rows: (data ?? []).map((row) => normalizeSafetyStock(row as Record<string, unknown>)), error: null };
  } catch (error) {
    return { rows: [], error: error instanceof Error ? error.message : 'Supabase 조회에 실패했습니다.' };
  }
}

export async function getPurchaseRecommendations(itemId?: string): Promise<{ rows: PurchaseRecommendation[]; error: string | null }> {
  try {
    const supabase = await createSupabaseServerClient();
    let query = supabase.schema('analytics').from('v_purchase_recommendation').select('*').order('item_id');
    if (itemId) query = query.eq('item_id', itemId);
    const { data, error } = await query;
    if (error) return { rows: [], error: error.message };
    return { rows: (data ?? []).map((row) => normalizePurchaseRecommendation(row as Record<string, unknown>)), error: null };
  } catch (error) {
    return { rows: [], error: error instanceof Error ? error.message : 'Supabase 조회에 실패했습니다.' };
  }
}

export async function getPurchaseRecommendation(itemId: string): Promise<{ data: PurchaseRecommendation | null; error: string | null }> {
  const result = await getPurchaseRecommendations(itemId);
  return { data: result.rows[0] ?? null, error: result.error };
}

export async function getForecastSettings(): Promise<{ data: ForecastSettings | null; error: string | null }> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.schema('analytics').from('v_forecast_settings').select('*').maybeSingle();
    if (error) return { data: null, error: error.message };
    return { data: normalizeForecastSettings(data as Record<string, unknown> | null), error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Supabase 조회에 실패했습니다.' };
  }
}

export async function getForecastRuns(): Promise<{ rows: ForecastRun[]; error: string | null }> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.schema('analytics').from('v_forecast_runs').select('*').order('created_at', { ascending: false });
    if (error) return { rows: [], error: error.message };
    return { rows: (data ?? []).map((row) => normalizeForecastRun(row as Record<string, unknown>)), error: null };
  } catch (error) {
    return { rows: [], error: error instanceof Error ? error.message : 'Supabase 조회에 실패했습니다.' };
  }
}

export async function getModelConfigs(): Promise<{ rows: ModelConfig[]; error: string | null }> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.schema('analytics').from('v_model_config').select('*').order('model_id', { ascending: true });
    if (error) return { rows: [], error: error.message };
    return { rows: (data ?? []).map((row) => normalizeModelConfig(row as Record<string, unknown>)), error: null };
  } catch (error) {
    return { rows: [], error: error instanceof Error ? error.message : 'Supabase 조회에 실패했습니다.' };
  }
}

export async function getBacktestRuns(): Promise<{ rows: BacktestRun[]; error: string | null }> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.schema('analytics').from('v_backtest_runs').select('*').order('started_at', { ascending: false });
    if (error) return { rows: [], error: error.message };
    return { rows: (data ?? []).map((row) => normalizeBacktestRun(row as Record<string, unknown>)), error: null };
  } catch (error) {
    return { rows: [], error: error instanceof Error ? error.message : 'Supabase 조회에 실패했습니다.' };
  }
}

export async function getModelPerformance(backtestRunId?: string): Promise<{ rows: ModelPerformance[]; error: string | null }> {
  try {
    const supabase = await createSupabaseServerClient();
    let query = supabase.schema('analytics').from('v_model_performance').select('*').order('item_id', { ascending: true }).order('rank', { ascending: true, nullsFirst: false });
    if (backtestRunId) query = query.eq('backtest_run_id', backtestRunId);
    const { data, error } = await query;
    if (error) return { rows: [], error: error.message };
    return { rows: (data ?? []).map((row) => normalizeModelPerformance(row as Record<string, unknown>)), error: null };
  } catch (error) {
    return { rows: [], error: error instanceof Error ? error.message : 'Supabase 조회에 실패했습니다.' };
  }
}

export async function getCurrentChampions(): Promise<{ rows: ChampionModel[]; error: string | null }> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.schema('analytics').from('v_champion_model').select('*').order('item_id', { ascending: true });
    if (error) return { rows: [], error: error.message };
    return { rows: (data ?? []).map((row) => normalizeChampionModel(row as Record<string, unknown>)), error: null };
  } catch (error) {
    return { rows: [], error: error instanceof Error ? error.message : 'Supabase 조회에 실패했습니다.' };
  }
}

export async function getModelComparison({ forecastRunId, itemId, from, to }: { forecastRunId: string; itemId?: string; from?: string; to?: string }): Promise<{ rows: ComparisonPoint[]; error: string | null }> {
  if (!forecastRunId) return { rows: [], error: null };
  try {
    const supabase = await createSupabaseServerClient();
    let query = supabase.schema('analytics').from('v_model_comparison').select('*').eq('forecast_run_id', forecastRunId).order('forecast_date', { ascending: true }).order('model_id', { ascending: true });
    if (itemId) query = query.eq('item_id', itemId);
    if (from) query = query.gte('forecast_date', from);
    if (to) query = query.lte('forecast_date', to);
    const { data, error } = await query;
    if (error) return { rows: [], error: error.message };
    return { rows: (data ?? []).map((row) => normalizeComparisonPoint(row as Record<string, unknown>)), error: null };
  } catch (error) {
    return { rows: [], error: error instanceof Error ? error.message : 'Supabase 조회에 실패했습니다.' };
  }
}
