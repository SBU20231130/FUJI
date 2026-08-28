export type ScmStatus = 'SAFE' | 'WARNING' | 'CRITICAL' | 'CALCULATION_UNAVAILABLE';

export type LeadtimeGap = {
  supplier: string;
  country: string;
  masterLeadTime: number | null;
  sampleCount: number | null;
  actualAverage: number | null;
  p80: number | null;
  gap: number | null;
  status: ScmStatus;
};

export type StockoutRisk = {
  itemId: string;
  itemName: string;
  supplier: string;
  currentStock: number | null;
  inboundQty: number | null;
  availableQty: number | null;
  dailyUsageAvg: number | null;
  plannedLeadTime: number | null;
  stockoutDays: number | null;
  stockoutDate: string | null;
  status: ScmStatus;
  reasonCode?: string;
};

export type StockoutKpi = {
  items: number | null;
  critical: number | null;
  safe: number | null;
  unavailable: number | null;
  within30Days: number | null;
  averageStockoutDays: number | null;
};

export type DemandType = 'SMOOTH' | 'INTERMITTENT' | 'ERRATIC' | 'LUMPY';

export type DemandProfile = {
  itemId: string;
  itemName: string;
  nPeriods: number | null;
  nNonzeroPeriods: number | null;
  adi: number | null;
  cv: number | null;
  cvSquared: number | null;
  zeroDemandRate: number | null;
  trend: number | null;
  recentChangeRate: number | null;
  peakPeriod: string | null;
  demandType: DemandType | null;
  seasonality: 'SEASONAL' | 'NOT_SEASONAL' | null;
  reasonCode: string | null;
  stability: string | null;
};

export type DemandProfileKpi = {
  totalItems: number | null;
  smooth: number | null;
  intermittent: number | null;
  erratic: number | null;
  lumpy: number | null;
  crostonNeeded: number | null;
  calculationUnavailable: number | null;
};

export type ForecastSettings = {
  settingKey: string;
  dataStart: string | null;
  dataEnd: string | null;
  trainStart: string | null;
  trainEnd: string | null;
  testStart: string | null;
  testEnd: string | null;
  granularity: string | null;
  trainRowCount: number | null;
  testRowCount: number | null;
  overlapRowCount: number | null;
  trainWindowOk: boolean | null;
  testWindowOk: boolean | null;
  isolationOk: boolean | null;
  defaultServiceLevel: number | null;
  defaultReviewPeriodDays: number | null;
  defaultSafetyBufferDays: number | null;
  activeItemPolicyCount: number | null;
  enabledOutlierRuleCount: number | null;
  learningExcludedRuleCount: number | null;
};

function value(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && row[key] !== '') return row[key];
  }
  return null;
}

function numberValue(row: Record<string, unknown>, keys: string[]) {
  const raw = value(row, keys);
  if (raw === null) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function booleanValue(row: Record<string, unknown>, keys: string[]) {
  const raw = value(row, keys);
  if (typeof raw === 'boolean') return raw;
  if (raw === 'true' || raw === 't' || raw === 1 || raw === '1') return true;
  if (raw === 'false' || raw === 'f' || raw === 0 || raw === '0') return false;
  return null;
}

function textValue(row: Record<string, unknown>, keys: string[]) {
  const raw = value(row, keys);
  return raw === null ? null : String(raw);
}

export function normalizeForecastSettings(row: Record<string, unknown> | null): ForecastSettings | null {
  if (!row) return null;
  return {
    settingKey: String(value(row, ['setting_key', 'settingKey']) ?? 'DEFAULT'),
    dataStart: textValue(row, ['data_start', 'dataStart']),
    dataEnd: textValue(row, ['data_end', 'dataEnd']),
    trainStart: textValue(row, ['train_start', 'trainStart']),
    trainEnd: textValue(row, ['train_end', 'trainEnd']),
    testStart: textValue(row, ['test_start', 'testStart']),
    testEnd: textValue(row, ['test_end', 'testEnd']),
    granularity: textValue(row, ['granularity']),
    trainRowCount: numberValue(row, ['train_row_count', 'trainRowCount']),
    testRowCount: numberValue(row, ['test_row_count', 'testRowCount']),
    overlapRowCount: numberValue(row, ['overlap_row_count', 'overlapRowCount']),
    trainWindowOk: booleanValue(row, ['train_window_ok', 'trainWindowOk']),
    testWindowOk: booleanValue(row, ['test_window_ok', 'testWindowOk']),
    isolationOk: booleanValue(row, ['isolation_ok', 'isolationOk']),
    defaultServiceLevel: numberValue(row, ['default_service_level', 'defaultServiceLevel']),
    defaultReviewPeriodDays: numberValue(row, ['default_review_period_days', 'defaultReviewPeriodDays']),
    defaultSafetyBufferDays: numberValue(row, ['default_safety_buffer_days', 'defaultSafetyBufferDays']),
    activeItemPolicyCount: numberValue(row, ['active_item_policy_count', 'activeItemPolicyCount']),
    enabledOutlierRuleCount: numberValue(row, ['enabled_outlier_rule_count', 'enabledOutlierRuleCount']),
    learningExcludedRuleCount: numberValue(row, ['learning_excluded_rule_count', 'learningExcludedRuleCount']),
  };
}

export function normalizeLeadtimeGap(row: Record<string, unknown>): LeadtimeGap {
  return {
    supplier: String(value(row, ['supplier_name', 'supplier', '법인', '공급처', '공급업체명']) ?? '미정'),
    country: String(value(row, ['country', '국가']) ?? '미정'),
    masterLeadTime: numberValue(row, ['std_lead_time', 'master_lt', 'master_lead_time', 'planned_lead_time', '표준리드타임', '표준리드타임(일)', '마스터값']),
    sampleCount: numberValue(row, ['n_samples', 'sample_count', 'samples', '표본수']),
    actualAverage: numberValue(row, ['mean_days', 'actual_avg', 'actual_average', 'avg_lead_time', '실적평균']),
    p80: numberValue(row, ['p80_days', 'p80', 'P80']),
    gap: numberValue(row, ['gap_days', 'gap', 'leadtime_gap', '격차']),
    status: numberValue(row, ['gap_days', 'gap', 'leadtime_gap', '격차']) === null
      ? 'CALCULATION_UNAVAILABLE'
      : numberValue(row, ['gap_days', 'gap', 'leadtime_gap', '격차'])! > 0 ? 'CRITICAL' : 'SAFE',
  };
}

export function normalizeStockoutRisk(row: Record<string, unknown>): StockoutRisk {
  const stockoutDays = numberValue(row, ['stockout_days', 'stockoutDays', '소진예상일수']);
  const rawStatus = String(value(row, ['risk_status', 'status', '위험상태']) ?? '').toUpperCase();
  const reasonCode = value(row, ['reason', 'reason_code', '사유코드']);
  const unavailable = stockoutDays === null || rawStatus === 'UNKNOWN' || rawStatus === 'CALCULATION_UNAVAILABLE';

  return {
    itemId: String(value(row, ['item_id', 'itemId', '품목코드']) ?? '미정'),
    itemName: String(value(row, ['item_name', 'itemName', '품목명']) ?? '미정'),
    supplier: String(value(row, ['supplier_name', 'supplier', '법인', '공급처']) ?? '미정'),
    currentStock: numberValue(row, ['current_stock', 'currentStock', '현재고']),
    inboundQty: numberValue(row, ['inbound_qty', 'inboundQty', '입고예정']),
    availableQty: numberValue(row, ['available_qty', 'availableQty', '가용재고']),
    dailyUsageAvg: numberValue(row, ['daily_usage_avg', 'dailyUsageAvg', '일평균사용량']),
    plannedLeadTime: numberValue(row, ['planned_lead_time', 'plannedLeadTime', '계획리드타임']),
    stockoutDays,
    stockoutDate: String(value(row, ['stockout_date', 'stockoutDate', '소진예상일']) ?? '') || null,
    status: unavailable ? 'CALCULATION_UNAVAILABLE' : rawStatus === 'CRITICAL' ? 'CRITICAL' : 'SAFE',
    reasonCode: String(reasonCode ?? (unavailable ? 'CALCULATION_UNAVAILABLE' : '')) || undefined,
  };
}

export function normalizeStockoutKpi(row: Record<string, unknown> | null): StockoutKpi | null {
  if (!row) return null;
  return {
    items: numberValue(row, ['n_items', 'items', '품목수']),
    critical: numberValue(row, ['n_critical', 'critical', '위험품목수']),
    safe: numberValue(row, ['n_safe', 'safe', '안전품목수']),
    unavailable: numberValue(row, ['n_unknown', 'n_unavailable', 'unknown', '계산불가수']),
    within30Days: numberValue(row, ['n_within_30d', 'within30Days', '30일이내']),
    averageStockoutDays: numberValue(row, ['avg_stockout_days', 'averageStockoutDays', '평균소진일수']),
  };
}

export function normalizeDemandProfile(row: Record<string, unknown>): DemandProfile {
  const rawDemandType = String(value(row, ['demand_type', 'demandType']) ?? '').toUpperCase();
  const demandType: DemandType | null = ['SMOOTH', 'INTERMITTENT', 'ERRATIC', 'LUMPY'].includes(rawDemandType) ? rawDemandType as DemandType : null;
  const rawSeasonality = String(value(row, ['seasonality']) ?? '').toUpperCase();
  return {
    itemId: String(value(row, ['item_id', 'itemId', '품목코드']) ?? '미정'),
    itemName: String(value(row, ['item_name', 'itemName', '품목명']) ?? '미정'),
    nPeriods: numberValue(row, ['n_periods', 'nPeriods']),
    nNonzeroPeriods: numberValue(row, ['n_nonzero_periods', 'nNonzeroPeriods']),
    adi: numberValue(row, ['adi']),
    cv: numberValue(row, ['cv']),
    cvSquared: numberValue(row, ['cv_squared', 'cvSquared']),
    zeroDemandRate: numberValue(row, ['zero_demand_rate', 'zeroDemandRate']),
    trend: numberValue(row, ['trend', 'trend_per_period']),
    recentChangeRate: numberValue(row, ['recent_change_rate', 'recentChangeRate']),
    peakPeriod: textValue(row, ['peak_period', 'peakPeriod']),
    demandType,
    seasonality: rawSeasonality === 'SEASONAL' || rawSeasonality === 'NOT_SEASONAL' ? rawSeasonality : null,
    reasonCode: textValue(row, ['reason_code', 'reasonCode']),
    stability: textValue(row, ['stability']),
  };
}

export function normalizeDemandProfileKpi(row: Record<string, unknown> | null): DemandProfileKpi | null {
  if (!row) return null;
  return {
    totalItems: numberValue(row, ['total_items', 'totalItems']),
    smooth: numberValue(row, ['n_smooth', 'smooth']),
    intermittent: numberValue(row, ['n_intermittent', 'intermittent']),
    erratic: numberValue(row, ['n_erratic', 'erratic']),
    lumpy: numberValue(row, ['n_lumpy', 'lumpy']),
    crostonNeeded: numberValue(row, ['n_croston_needed', 'crostonNeeded']),
    calculationUnavailable: numberValue(row, ['n_calculation_unavailable', 'calculationUnavailable']),
  };
}

export function summarizeLeadtimeGap(rows: LeadtimeGap[]): { suppliers: number; longer: number; lowSample: number; longerStatus: ScmStatus; lowSampleStatus: ScmStatus } {
  return {
    suppliers: rows.length,
    longer: rows.filter((row) => row.gap !== null && row.gap > 0).length,
    lowSample: rows.filter((row) => row.sampleCount !== null && row.sampleCount < 10).length,
    longerStatus: rows.some((row) => row.gap !== null && row.gap > 0) ? 'CRITICAL' : 'SAFE',
    lowSampleStatus: rows.some((row) => row.sampleCount !== null && row.sampleCount < 10) ? 'WARNING' : 'SAFE',
  };
}
