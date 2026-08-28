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

export function summarizeLeadtimeGap(rows: LeadtimeGap[]): { suppliers: number; longer: number; lowSample: number; longerStatus: ScmStatus; lowSampleStatus: ScmStatus } {
  return {
    suppliers: rows.length,
    longer: rows.filter((row) => row.gap !== null && row.gap > 0).length,
    lowSample: rows.filter((row) => row.sampleCount !== null && row.sampleCount < 10).length,
    longerStatus: rows.some((row) => row.gap !== null && row.gap > 0) ? 'CRITICAL' : 'SAFE',
    lowSampleStatus: rows.some((row) => row.sampleCount !== null && row.sampleCount < 10) ? 'WARNING' : 'SAFE',
  };
}
