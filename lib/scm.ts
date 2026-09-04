import { createSupabaseServerClient } from './supabase';
import { normalizeBacktestRun, normalizeBomRequirement, normalizeChampionModel, normalizeComparisonPoint, normalizeDemandProfile, normalizeDemandProfileKpi, normalizeDemandProfileRt, normalizeForecastRun, normalizeForecastSettings, normalizeInventoryProjection, normalizeLeadtimeGap, normalizeLeadtimePolicy, normalizeLeadtimePolicyHistory, normalizeModelConfig, normalizeModelPerformance, normalizeOlAccuracy, normalizePartLinkage, normalizePurchaseRecommendation, normalizeSafetyStock, normalizeShipmentTrend, normalizeStockoutKpi, normalizeStockoutRisk, type BacktestRun, type BomRequirement, type ChampionModel, type ComparisonPoint, type DemandProfile, type DemandProfileKpi, type DemandProfileRt, type ForecastRun, type ForecastSettings, type InventoryProjectionRow, type LeadtimeGap, type LeadtimePolicy, type LeadtimePolicyHistory, type ModelConfig, type ModelPerformance, type OlAccuracy, type PartLinkage, type PurchaseRecommendation, type SafetyStock, type ShipmentTrend, type StockoutKpi, type StockoutRisk } from './scm-model';

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

export async function getShipmentTrend(itemCode?: string): Promise<{ rows: ShipmentTrend[]; error: string | null }> {
  try {
    const supabase = await createSupabaseServerClient();
    let query = supabase.schema('analytics').from('v_shipment_trend').select('*').order('item_code').order('period');
    if (itemCode) query = query.eq('item_code', itemCode);
    const { data, error } = await query;
    if (error) return { rows: [], error: error.message };
    return { rows: (data ?? []).map((row) => normalizeShipmentTrend(row as Record<string, unknown>)), error: null };
  } catch (error) {
    return { rows: [], error: error instanceof Error ? error.message : 'Supabase 조회에 실패했습니다.' };
  }
}

export async function getDemandProfileRt(itemCode?: string): Promise<{ rows: DemandProfileRt[]; error: string | null }> {
  try {
    const supabase = await createSupabaseServerClient();
    let query = supabase.schema('analytics').from('v_item_demand_profile').select('*').order('item_code');
    if (itemCode) query = query.eq('item_code', itemCode);
    const { data, error } = await query;
    if (error) return { rows: [], error: error.message };
    return { rows: (data ?? []).map((row) => normalizeDemandProfileRt(row as Record<string, unknown>)), error: null };
  } catch (error) {
    return { rows: [], error: error instanceof Error ? error.message : 'Supabase 조회에 실패했습니다.' };
  }
}

export async function getOlAccuracy(modelBase?: string): Promise<{ rows: OlAccuracy[]; error: string | null }> {
  try {
    const supabase = await createSupabaseServerClient();
    let monthlyQuery = supabase.schema('analytics').from('v_ol_accuracy').select('*').order('model_base').order('period');
    let fiscalQuery = supabase.schema('analytics').from('v_ol_accuracy_fy').select('*').order('model_base').order('fiscal_year');
    if (modelBase) {
      monthlyQuery = monthlyQuery.eq('model_base', modelBase);
      fiscalQuery = fiscalQuery.eq('model_base', modelBase);
    }
    const [monthlyResult, fiscalResult] = await Promise.all([monthlyQuery, fiscalQuery]);
    if (monthlyResult.error || fiscalResult.error) {
      const messages = [monthlyResult.error?.message, fiscalResult.error?.message].filter(Boolean);
      return { rows: [], error: messages.join(' / ') || 'OL 정확도 조회에 실패했습니다.' };
    }
    const rows = [...(monthlyResult.data ?? []), ...(fiscalResult.data ?? [])]
      .map((row) => normalizeOlAccuracy(row as Record<string, unknown>));
    return { rows, error: null };
  } catch (error) {
    return { rows: [], error: error instanceof Error ? error.message : 'Supabase 조회에 실패했습니다.' };
  }
}

export async function getBomRequirement(modelBase: string): Promise<{ rows: BomRequirement[]; error: string | null }> {
  if (!modelBase) return { rows: [], error: null };
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.schema('analytics').from('v_bom_requirement_x').select('*').eq('model_base', modelBase).order('part_role').order('item_code');
    if (error) return { rows: [], error: error.message };
    return { rows: (data ?? []).map((row) => normalizeBomRequirement(row as Record<string, unknown>)), error: null };
  } catch (error) {
    return { rows: [], error: error instanceof Error ? error.message : 'Supabase 조회에 실패했습니다.' };
  }
}

export async function getPartLinkage(itemCode: string): Promise<{ rows: PartLinkage[]; error: string | null }> {
  if (!itemCode) return { rows: [], error: null };
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.schema('analytics').from('v_part_linkage').select('*').eq('item_code', itemCode).order('hoc_code').order('model_base');
    if (error) return { rows: [], error: error.message };
    return { rows: (data ?? []).map((row) => normalizePartLinkage(row as Record<string, unknown>)), error: null };
  } catch (error) {
    return { rows: [], error: error instanceof Error ? error.message : 'Supabase 조회에 실패했습니다.' };
  }
}
