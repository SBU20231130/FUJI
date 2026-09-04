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
  supplierId: string | null;
  currentStock: number | null;
  inboundQty: number | null;
  availableQty: number | null;
  dailyUsageAvg: number | null;
  plannedLeadTime: number | null;
  effectiveLeadTime: number | null;
  leadTimeSource: string | null;
  stockoutDays: number | null;
  stockoutDate: string | null;
  projectionAsOf: string | null;
  daysOfSupply: number | null;
  monthsOfSupply: number | null;
  scheduledReceipts: number | null;
  confirmedSalesOrder: number | null;
  softAllocation: number | null;
  forecastDemand: number | null;
  forecastSource: string | null;
  forecastModelId: string | null;
  forecastModelVersion: string | null;
  softAllocationStatus: string | null;
  confirmedSalesOrderStatus: string | null;
  status: ScmStatus;
  reasonCode: string | null;
};

export type StockoutKpi = {
  items: number | null;
  critical: number | null;
  warning: number | null;
  safe: number | null;
  unavailable: number | null;
  within30Days: number | null;
  averageStockoutDays: number | null;
};

export type InventoryProjectionRow = {
  itemId: string;
  itemName: string;
  supplier: string;
  projectionAsOf: string | null;
  period: string;
  periodDays: number | null;
  beginningInventory: number | null;
  scheduledReceipts: number | null;
  confirmedSalesOrder: number | null;
  softAllocation: number | null;
  forecastDemand: number | null;
  endingProjectedInventory: number | null;
  stockoutPeriod: string | null;
  daysOfSupply: number | null;
  monthsOfSupply: number | null;
  status: ScmStatus;
  reasonCode: string | null;
  effectiveLeadTime: number | null;
  leadTimeSource: string | null;
  forecastSource: string | null;
  softAllocationStatus: string | null;
  confirmedSalesOrderStatus: string | null;
};

export type SafetyStock = {
  itemId: string;
  itemName: string;
  supplierId: string | null;
  supplierName: string | null;
  itemGrade: string | null;
  serviceLevel: number | null;
  zValue: number | null;
  expectedDailyDemand: number | null;
  forecastErrorSigma: number | null;
  forecastErrorSamples: number | null;
  leadtimeMean: number | null;
  leadtimeStddev: number | null;
  leadtimeSamples: number | null;
  effectiveLeadtime: number | null;
  leadTimeSource: string | null;
  sigmaDlt: number | null;
  safetyStock: number | null;
  availableInventory: number | null;
  scheduledReceipt: number | null;
  forecastRunId: string | null;
  backtestRunId: string | null;
  modelId: string | null;
  modelVersion: string | null;
  sigmaSource: string | null;
  serviceLevelSource: string | null;
  calculationStatus: string;
  reasonCode: string | null;
};

export type PurchaseRecommendation = {
  itemId: string;
  itemName: string;
  itemGrade: string | null;
  forecastQty: number | null;
  confirmedOrderQty: number | null;
  demandBasisQty: number | null;
  availableInventory: number | null;
  scheduledReceipt: number | null;
  safetyStock: number | null;
  effectiveLeadtime: number | null;
  stockoutDate: string | null;
  safetyBufferDays: number | null;
  requiredQty: number | null;
  moq: number | null;
  packSize: number | null;
  recommendedQty: number | null;
  recommendedOrderDate: string | null;
  immediateOrder: boolean | null;
  orderTimingStatus: string | null;
  riskStatus: ScmStatus;
  calculationStatus: string;
  reasonCode: string | null;
  forecastRunId: string | null;
  modelVersion: string | null;
  backtestRunId: string | null;
  forecastErrorSigma: number | null;
  leadtimeStddev: number | null;
  serviceLevel: number | null;
  zValue: number | null;
  calculationTrace: Record<string, unknown> | null;
};

export type LeadtimePolicy = {
  itemId: string;
  itemName: string;
  supplierId: string;
  supplierName: string;
  country: string | null;
  meanDays: number | null;
  p50: number | null;
  p80: number | null;
  p90: number | null;
  adminLeadTime: number | null;
  effectiveLeadTime: number | null;
  source: string | null;
  basis: string | null;
  serviceLevel: number | null;
  confirmedReason: string | null;
  confirmedAt: string | null;
};

export type LeadtimePolicyHistory = {
  historyId: number;
  supplierId: string;
  supplierName: string;
  beforeLeadTime: number | null;
  afterLeadTime: number | null;
  beforeBasis: string | null;
  afterBasis: string | null;
  changedBy: string | null;
  changedAt: string | null;
  beforeReason: string | null;
  afterReason: string | null;
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
  championMetric?: MetricCode | null;
  baselineModelId?: string | null;
  baselineModelVersion?: string | null;
};

export type MetricCode = 'WAPE' | 'MAPE' | 'RMSE' | 'MAE';

export type ModelConfig = {
  modelId: string;
  modelVersion: string;
  modelName: string;
  description: string | null;
  enabled: boolean | null;
  isBaseline: boolean | null;
  supportedDemandTypes: DemandType[];
};

export type ForecastRun = {
  forecastRunId: string;
  forecastSettingKey: string;
  dataSnapshotAt: string | null;
  status: string | null;
  stale: boolean | null;
  staleReason: string | null;
  triggeredBy: string | null;
  trainStart: string | null;
  trainEnd: string | null;
  pipelineType: 'SQL' | 'PYTHON' | string;
  serviceName: string | null;
  requestParams: Record<string, unknown>;
  errorMessage: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string | null;
};

export type BacktestRun = {
  backtestRunId: string;
  forecastRunId: string;
  testStart: string | null;
  testEnd: string | null;
  metric: MetricCode | null;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED' | string;
  triggeredBy: string | null;
  startedAt: string | null;
  completedAt: string | null;
  errorCode: string | null;
  dataSnapshotAt: string | null;
  stale: boolean | null;
  forecastStatus: string | null;
  pipelineType: 'SQL' | 'PYTHON' | string;
  serviceName: string | null;
  forecastErrorMessage: string | null;
};

export type ModelPerformance = {
  performanceId: number;
  backtestRunId: string;
  forecastRunId: string;
  modelId: string;
  modelVersion: string;
  modelName: string | null;
  itemId: string;
  testStart: string | null;
  testEnd: string | null;
  metric: MetricCode | null;
  periodsTotal: number | null;
  actualPeriods: number | null;
  forecastPeriods: number | null;
  comparablePeriods: number | null;
  actualAbsSum: number | null;
  wape: number | null;
  mape: number | null;
  bias: number | null;
  rmse: number | null;
  mae: number | null;
  metricValue: number | null;
  baselineImprovement: number | null;
  rank: number | null;
  status: 'VALID' | 'CALCULATION_UNAVAILABLE' | string;
  reasonCode: string | null;
};

export type ChampionModel = {
  championModelId: number;
  itemId: string;
  modelId: string;
  modelVersion: string;
  modelName: string | null;
  metric: MetricCode | null;
  metricValue: number | null;
  baselineImprovement: number | null;
  backtestRunId: string;
  forecastRunId: string;
  selectionMethod: 'AUTO' | 'MANUAL' | string;
  selectionReason: string;
  selectedAt: string | null;
};

export type ComparisonPoint = {
  forecastRunId: string;
  modelId: string;
  modelVersion: string;
  modelName: string | null;
  itemId: string;
  forecastDate: string;
  actualQty: number | null;
  forecastValue: number | null;
  p50: number | null;
  p80: number | null;
  p90: number | null;
  predictionLower: number | null;
  predictionUpper: number | null;
  validationStatus: string;
};

export type ShipmentTrend = {
  itemCode: string;
  itemName: string | null;
  period: string | null;
  shipmentQty: number | null;
  orderQty: number | null;
  shipmentCount: number | null;
  reasonCode: string | null;
};

export type DemandProfileRt = {
  itemCode: string;
  itemName: string | null;
  validDays: number | null;
  totalDemandQty: number | null;
  averageDailyDemand: number | null;
  demandSd: number | null;
  cv: number | null;
  trend: number | null;
  reasonCode: string | null;
};

export type OlAccuracy = {
  modelBase: string | null;
  period: string | null;
  fiscalYear: string | null;
  salesWape: number | null;
  scmBias: number | null;
  salesMae: number | null;
  salesRmse: number | null;
  scmWape: number | null;
  scmMae: number | null;
  scmRmse: number | null;
  reasonCode: string | null;
};

export type BomRequirement = {
  modelBase: string | null;
  itemCode: string | null;
  itemName: string | null;
  partRole: string | null;
  requirementQty: number | null;
  bomQty: number | null;
  attachmentRate: number | null;
  commonFlag: string | null;
  commonLabel: '복수 기종 공용' | null;
  reasonCode: string | null;
};

export type PartLinkage = {
  itemCode: string;
  hocCode: string | null;
  hocName: string | null;
  modelBase: string | null;
  partCode: string | null;
  partName: string | null;
  linkageType: string | null;
  reasonCode: string | null;
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
    championMetric: normalizeMetric(textValue(row, ['champion_metric', 'championMetric'])),
    baselineModelId: textValue(row, ['baseline_model_id', 'baselineModelId']),
    baselineModelVersion: textValue(row, ['baseline_model_version', 'baselineModelVersion']),
  };
}

function normalizeMetric(raw: string | null): MetricCode | null {
  return raw && ['WAPE', 'MAPE', 'RMSE', 'MAE'].includes(raw.toUpperCase()) ? raw.toUpperCase() as MetricCode : null;
}

export function normalizeModelConfig(row: Record<string, unknown>): ModelConfig {
  const supported = value(row, ['supported_demand_types', 'supportedDemandTypes']);
  const supportedDemandTypes: DemandType[] = Array.isArray(supported)
    ? supported.filter((item): item is DemandType => ['SMOOTH', 'INTERMITTENT', 'ERRATIC', 'LUMPY'].includes(String(item)))
    : ['SMOOTH', 'ERRATIC', 'INTERMITTENT', 'LUMPY'];
  return {
    modelId: String(value(row, ['model_id', 'modelId']) ?? '미정'),
    modelVersion: String(value(row, ['model_version', 'modelVersion']) ?? '미정'),
    modelName: String(value(row, ['model_name', 'modelName']) ?? '미정'),
    description: textValue(row, ['description']),
    enabled: booleanValue(row, ['enabled']),
    isBaseline: booleanValue(row, ['is_baseline', 'isBaseline']),
    supportedDemandTypes,
  };
}

export function normalizeForecastRun(row: Record<string, unknown>): ForecastRun {
  return {
    forecastRunId: String(value(row, ['forecast_run_id', 'forecastRunId']) ?? ''),
    forecastSettingKey: String(value(row, ['forecast_setting_key', 'forecastSettingKey']) ?? 'DEFAULT'),
    dataSnapshotAt: textValue(row, ['data_snapshot_at', 'dataSnapshotAt']),
    status: textValue(row, ['status']),
    stale: booleanValue(row, ['stale']),
    staleReason: textValue(row, ['stale_reason', 'staleReason']),
    triggeredBy: textValue(row, ['triggered_by', 'triggeredBy']),
    trainStart: textValue(row, ['train_start', 'trainStart']),
    trainEnd: textValue(row, ['train_end', 'trainEnd']),
    pipelineType: String(value(row, ['pipeline_type', 'pipelineType']) ?? 'SQL'),
    serviceName: textValue(row, ['service_name', 'serviceName']),
    requestParams: (value(row, ['request_params', 'requestParams']) as Record<string, unknown> | null) ?? {},
    errorMessage: textValue(row, ['error_message', 'errorMessage']),
    startedAt: textValue(row, ['started_at', 'startedAt']),
    completedAt: textValue(row, ['completed_at', 'completedAt']),
    createdAt: textValue(row, ['created_at', 'createdAt']),
  };
}

export function normalizeBacktestRun(row: Record<string, unknown>): BacktestRun {
  return {
    backtestRunId: String(value(row, ['backtest_run_id', 'backtestRunId']) ?? ''),
    forecastRunId: String(value(row, ['forecast_run_id', 'forecastRunId']) ?? ''),
    testStart: textValue(row, ['test_start', 'testStart']),
    testEnd: textValue(row, ['test_end', 'testEnd']),
    metric: normalizeMetric(textValue(row, ['metric'])),
    status: String(value(row, ['status']) ?? 'CALCULATION_UNAVAILABLE') as BacktestRun['status'],
    triggeredBy: textValue(row, ['triggered_by', 'triggeredBy']),
    startedAt: textValue(row, ['started_at', 'startedAt']),
    completedAt: textValue(row, ['completed_at', 'completedAt']),
    errorCode: textValue(row, ['error_code', 'errorCode']),
    dataSnapshotAt: textValue(row, ['data_snapshot_at', 'dataSnapshotAt']),
    stale: booleanValue(row, ['stale']),
    forecastStatus: textValue(row, ['forecast_status', 'forecastStatus']),
    pipelineType: String(value(row, ['pipeline_type', 'pipelineType']) ?? 'SQL'),
    serviceName: textValue(row, ['service_name', 'serviceName']),
    forecastErrorMessage: textValue(row, ['forecast_error_message', 'forecastErrorMessage']),
  };
}

export function normalizeModelPerformance(row: Record<string, unknown>): ModelPerformance {
  return {
    performanceId: numberValue(row, ['performance_id', 'performanceId']) ?? 0,
    backtestRunId: String(value(row, ['backtest_run_id', 'backtestRunId']) ?? ''),
    forecastRunId: String(value(row, ['forecast_run_id', 'forecastRunId']) ?? ''),
    modelId: String(value(row, ['model_id', 'modelId']) ?? '미정'),
    modelVersion: String(value(row, ['model_version', 'modelVersion']) ?? '미정'),
    modelName: textValue(row, ['model_name', 'modelName']),
    itemId: String(value(row, ['item_id', 'itemId']) ?? '미정'),
    testStart: textValue(row, ['test_start', 'testStart']),
    testEnd: textValue(row, ['test_end', 'testEnd']),
    metric: normalizeMetric(textValue(row, ['metric'])),
    periodsTotal: numberValue(row, ['periods_total', 'periodsTotal']),
    actualPeriods: numberValue(row, ['actual_periods', 'actualPeriods']),
    forecastPeriods: numberValue(row, ['forecast_periods', 'forecastPeriods']),
    comparablePeriods: numberValue(row, ['comparable_periods', 'comparablePeriods']),
    actualAbsSum: numberValue(row, ['actual_abs_sum', 'actualAbsSum']),
    wape: numberValue(row, ['wape']),
    mape: numberValue(row, ['mape']),
    bias: numberValue(row, ['bias']),
    rmse: numberValue(row, ['rmse']),
    mae: numberValue(row, ['mae']),
    metricValue: numberValue(row, ['metric_value', 'metricValue']),
    baselineImprovement: numberValue(row, ['baseline_improvement', 'baselineImprovement']),
    rank: numberValue(row, ['rank']),
    status: String(value(row, ['status']) ?? 'CALCULATION_UNAVAILABLE'),
    reasonCode: textValue(row, ['reason_code', 'reasonCode']),
  };
}

export function normalizeChampionModel(row: Record<string, unknown>): ChampionModel {
  return {
    championModelId: numberValue(row, ['champion_model_id', 'championModelId']) ?? 0,
    itemId: String(value(row, ['item_id', 'itemId']) ?? '미정'),
    modelId: String(value(row, ['model_id', 'modelId']) ?? '미정'),
    modelVersion: String(value(row, ['model_version', 'modelVersion']) ?? '미정'),
    modelName: textValue(row, ['model_name', 'modelName']),
    metric: normalizeMetric(textValue(row, ['metric'])),
    metricValue: numberValue(row, ['metric_value', 'metricValue']),
    baselineImprovement: numberValue(row, ['baseline_improvement', 'baselineImprovement']),
    backtestRunId: String(value(row, ['backtest_run_id', 'backtestRunId']) ?? ''),
    forecastRunId: String(value(row, ['forecast_run_id', 'forecastRunId']) ?? ''),
    selectionMethod: String(value(row, ['selection_method', 'selectionMethod']) ?? 'AUTO'),
    selectionReason: String(value(row, ['selection_reason', 'selectionReason']) ?? ''),
    selectedAt: textValue(row, ['selected_at', 'selectedAt']),
  };
}

export function normalizeComparisonPoint(row: Record<string, unknown>): ComparisonPoint {
  return {
    forecastRunId: String(value(row, ['forecast_run_id', 'forecastRunId']) ?? ''),
    modelId: String(value(row, ['model_id', 'modelId']) ?? '미정'),
    modelVersion: String(value(row, ['model_version', 'modelVersion']) ?? '미정'),
    modelName: textValue(row, ['model_name', 'modelName']),
    itemId: String(value(row, ['item_id', 'itemId']) ?? '미정'),
    forecastDate: String(value(row, ['forecast_date', 'forecastDate']) ?? ''),
    actualQty: numberValue(row, ['actual_qty', 'actualQty']),
    forecastValue: numberValue(row, ['forecast_value', 'forecastValue']),
    p50: numberValue(row, ['p50']),
    p80: numberValue(row, ['p80']),
    p90: numberValue(row, ['p90']),
    predictionLower: numberValue(row, ['prediction_lower', 'predictionLower']),
    predictionUpper: numberValue(row, ['prediction_upper', 'predictionUpper']),
    validationStatus: String(value(row, ['validation_status', 'validationStatus']) ?? 'ACTUAL_UNAVAILABLE'),
  };
}

export function normalizeShipmentTrend(row: Record<string, unknown>): ShipmentTrend {
  return {
    itemCode: String(value(row, ['item_code', 'itemCode', 'sku', '품목코드']) ?? '미정'),
    itemName: textValue(row, ['item_name', 'itemName', '품목명']),
    period: textValue(row, ['period', 'period_start', 'month', 'shipment_month', '기준월']),
    shipmentQty: numberValue(row, ['shipment_qty', 'shipment_quantity', 'shipped_qty', 'actual_qty', '출하수량']),
    orderQty: numberValue(row, ['order_qty', 'ordered_qty', 'ol_qty', '발주수량']),
    shipmentCount: numberValue(row, ['shipment_count', 'n_shipments', 'shipment_rows', '출하건수']),
    reasonCode: textValue(row, ['reason_code', 'reasonCode', '사유코드']),
  };
}

export function normalizeDemandProfileRt(row: Record<string, unknown>): DemandProfileRt {
  return {
    itemCode: String(value(row, ['item_code', 'itemCode', 'sku', '품목코드']) ?? '미정'),
    itemName: textValue(row, ['item_name', 'itemName', '품목명']),
    validDays: numberValue(row, ['valid_days', 'n_valid_days', 'days', '유효일수']),
    totalDemandQty: numberValue(row, ['total_demand_qty', 'demand_qty', 'total_qty', '총수요량']),
    averageDailyDemand: numberValue(row, ['average_daily_demand', 'daily_demand_avg', 'avg_daily_demand', '일평균수요']),
    demandSd: numberValue(row, ['demand_sd', 'daily_demand_sd', 'sd', '수요표준편차']),
    cv: numberValue(row, ['cv', 'coefficient_of_variation', '변동계수']),
    trend: numberValue(row, ['trend', 'trend_rate', 'trend_per_period', '추세']),
    reasonCode: textValue(row, ['reason_code', 'reasonCode', '사유코드']),
  };
}

export function normalizeOlAccuracy(row: Record<string, unknown>): OlAccuracy {
  return {
    modelBase: textValue(row, ['model_base', 'modelBase', 'model', '기종']),
    period: textValue(row, ['period', 'period_start', 'month', '기준월']),
    fiscalYear: textValue(row, ['fiscal_year', 'fiscalYear', 'fy', '회계연도']),
    salesWape: numberValue(row, ['sales_wape', 'salesWAPE', 'wape_sales']),
    scmBias: numberValue(row, ['scm_bias', 'scmBias', 'bias_scm']),
    salesMae: numberValue(row, ['sales_mae', 'salesMAE', 'mae_sales']),
    salesRmse: numberValue(row, ['sales_rmse', 'salesRMSE', 'rmse_sales']),
    scmWape: numberValue(row, ['scm_wape', 'scmWAPE', 'wape_scm']),
    scmMae: numberValue(row, ['scm_mae', 'scmMAE', 'mae_scm']),
    scmRmse: numberValue(row, ['scm_rmse', 'scmRMSE', 'rmse_scm']),
    reasonCode: textValue(row, ['reason_code', 'reasonCode', '사유코드']),
  };
}

export function normalizeBomRequirement(row: Record<string, unknown>): BomRequirement {
  const commonFlag = textValue(row, ['common_flag', 'commonFlag', '공용구분']);
  return {
    modelBase: textValue(row, ['model_base', 'modelBase', 'model', '기종']),
    itemCode: textValue(row, ['item_code', 'itemCode', 'part_code', 'partCode', '품목코드']),
    itemName: textValue(row, ['item_name', 'itemName', 'part_name', 'partName', '품목명']),
    partRole: textValue(row, ['part_role', 'partRole', 'role', '부품역할']),
    requirementQty: numberValue(row, ['requirement_qty', 'required_qty', 'require_qty', '소요량']),
    bomQty: numberValue(row, ['bom_qty', 'quantity_per_model', 'qty_per_model', 'BOM수량']),
    attachmentRate: numberValue(row, ['attachment_rate', 'attach_rate', '장착율']),
    commonFlag,
    commonLabel: commonFlag?.toUpperCase() === 'COMMON' ? '복수 기종 공용' : null,
    reasonCode: textValue(row, ['reason_code', 'reasonCode', '사유코드']),
  };
}

export function normalizePartLinkage(row: Record<string, unknown>): PartLinkage {
  return {
    itemCode: String(value(row, ['item_code', 'itemCode', 'sku', '품목코드']) ?? '미정'),
    hocCode: textValue(row, ['hoc_code', 'hocCode', 'representative_item_code', 'representativeCode', '발주대표코드']),
    hocName: textValue(row, ['hoc_name', 'hocName', 'representative_item_name', 'representativeName', '발주대표명']),
    modelBase: textValue(row, ['model_base', 'modelBase', 'model', '기종']),
    partCode: textValue(row, ['part_code', 'partCode', 'component_code', '부품코드']),
    partName: textValue(row, ['part_name', 'partName', 'component_name', '부품명']),
    linkageType: textValue(row, ['linkage_type', 'linkageType', 'relation', '관계']),
    reasonCode: textValue(row, ['reason_code', 'reasonCode', '사유코드']),
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

export function normalizeLeadtimePolicy(row: Record<string, unknown>): LeadtimePolicy {
  return {
    itemId: String(value(row, ['item_id', 'itemId']) ?? '미정'),
    itemName: String(value(row, ['item_name', 'itemName']) ?? '미정'),
    supplierId: String(value(row, ['supplier_id', 'supplierId']) ?? '미정'),
    supplierName: String(value(row, ['supplier_name', 'supplierName']) ?? '미정'),
    country: textValue(row, ['country']),
    meanDays: numberValue(row, ['mean_days', 'meanDays']),
    p50: numberValue(row, ['p50_days', 'p50']),
    p80: numberValue(row, ['p80_days', 'p80']),
    p90: numberValue(row, ['p90_days', 'p90']),
    adminLeadTime: numberValue(row, ['admin_lead_time', 'adminLeadTime']),
    effectiveLeadTime: numberValue(row, ['effective_lead_time', 'effectiveLeadTime']),
    source: textValue(row, ['source']),
    basis: textValue(row, ['basis']),
    serviceLevel: numberValue(row, ['service_level', 'serviceLevel']),
    confirmedReason: textValue(row, ['confirmed_reason', 'confirmedReason']),
    confirmedAt: textValue(row, ['confirmed_at', 'confirmedAt']),
  };
}

export function normalizeLeadtimePolicyHistory(row: Record<string, unknown>): LeadtimePolicyHistory {
  return {
    historyId: numberValue(row, ['history_id', 'historyId']) ?? 0,
    supplierId: String(value(row, ['supplier_id', 'supplierId']) ?? '미정'),
    supplierName: String(value(row, ['supplier_name', 'supplierName']) ?? '미정'),
    beforeLeadTime: numberValue(row, ['before_planned_lead_time', 'beforeLeadTime']),
    afterLeadTime: numberValue(row, ['after_planned_lead_time', 'afterLeadTime']),
    beforeBasis: textValue(row, ['before_basis', 'beforeBasis']),
    afterBasis: textValue(row, ['after_basis', 'afterBasis']),
    changedBy: textValue(row, ['changed_by', 'changedBy']),
    changedAt: textValue(row, ['changed_at', 'changedAt']),
    beforeReason: textValue(row, ['before_confirmed_reason', 'beforeReason']),
    afterReason: textValue(row, ['after_confirmed_reason', 'afterReason']),
  };
}

export function normalizeInventoryProjection(row: Record<string, unknown>): InventoryProjectionRow {
  const rawStatus = String(value(row, ['risk_status', 'status']) ?? '').toUpperCase();
  const status: ScmStatus = rawStatus === 'CRITICAL'
    ? 'CRITICAL'
    : rawStatus === 'WARNING'
      ? 'WARNING'
      : rawStatus === 'SAFE'
        ? 'SAFE'
        : 'CALCULATION_UNAVAILABLE';
  return {
    itemId: String(value(row, ['item_id', 'itemId']) ?? '미정'),
    itemName: String(value(row, ['item_name', 'itemName']) ?? '미정'),
    supplier: String(value(row, ['supplier_name', 'supplier', 'supplierId']) ?? '미정'),
    projectionAsOf: textValue(row, ['projection_as_of', 'projectionAsOf']),
    period: String(value(row, ['period']) ?? ''),
    periodDays: numberValue(row, ['period_days', 'periodDays']),
    beginningInventory: numberValue(row, ['beginning_inventory', 'beginningInventory']),
    scheduledReceipts: numberValue(row, ['scheduled_receipts', 'scheduledReceipts']),
    confirmedSalesOrder: numberValue(row, ['confirmed_sales_order', 'confirmedSalesOrder']),
    softAllocation: numberValue(row, ['soft_allocation', 'softAllocation']),
    forecastDemand: numberValue(row, ['forecast_demand', 'forecastDemand']),
    endingProjectedInventory: numberValue(row, ['ending_projected_inventory', 'endingProjectedInventory']),
    stockoutPeriod: textValue(row, ['stockout_period', 'stockoutPeriod']),
    daysOfSupply: numberValue(row, ['days_of_supply', 'daysOfSupply']),
    monthsOfSupply: numberValue(row, ['months_of_supply', 'monthsOfSupply']),
    status,
    reasonCode: textValue(row, ['reason_code', 'reasonCode']),
    effectiveLeadTime: numberValue(row, ['effective_lead_time', 'effectiveLeadTime']),
    leadTimeSource: textValue(row, ['lead_time_source', 'leadTimeSource']),
    forecastSource: textValue(row, ['forecast_source', 'forecastSource']),
    softAllocationStatus: textValue(row, ['soft_allocation_status', 'softAllocationStatus']),
    confirmedSalesOrderStatus: textValue(row, ['confirmed_sales_order_status', 'confirmedSalesOrderStatus']),
  };
}

export function normalizeSafetyStock(row: Record<string, unknown>): SafetyStock {
  return {
    itemId: String(value(row, ['item_id', 'itemId']) ?? '미정'),
    itemName: String(value(row, ['item_name', 'itemName']) ?? '미정'),
    supplierId: textValue(row, ['supplier_id', 'supplierId']),
    supplierName: textValue(row, ['supplier_name', 'supplierName']),
    itemGrade: textValue(row, ['item_grade', 'itemGrade']),
    serviceLevel: numberValue(row, ['service_level', 'serviceLevel']),
    zValue: numberValue(row, ['z_value', 'zValue']),
    expectedDailyDemand: numberValue(row, ['expected_daily_demand', 'expectedDailyDemand']),
    forecastErrorSigma: numberValue(row, ['forecast_error_sigma', 'forecastErrorSigma']),
    forecastErrorSamples: numberValue(row, ['forecast_error_samples', 'forecastErrorSamples']),
    leadtimeMean: numberValue(row, ['leadtime_mean', 'leadtimeMean']),
    leadtimeStddev: numberValue(row, ['leadtime_stddev', 'leadtimeStddev']),
    leadtimeSamples: numberValue(row, ['leadtime_samples', 'leadtimeSamples']),
    effectiveLeadtime: numberValue(row, ['effective_leadtime', 'effectiveLeadtime']),
    leadTimeSource: textValue(row, ['lead_time_source', 'leadTimeSource']),
    sigmaDlt: numberValue(row, ['sigma_dlt', 'sigmaDlt']),
    safetyStock: numberValue(row, ['safety_stock', 'safetyStock']),
    availableInventory: numberValue(row, ['available_inventory', 'availableInventory']),
    scheduledReceipt: numberValue(row, ['scheduled_receipt', 'scheduledReceipt']),
    forecastRunId: textValue(row, ['forecast_run_id', 'forecastRunId']),
    backtestRunId: textValue(row, ['backtest_run_id', 'backtestRunId']),
    modelId: textValue(row, ['model_id', 'modelId']),
    modelVersion: textValue(row, ['model_version', 'modelVersion']),
    sigmaSource: textValue(row, ['sigma_source', 'sigmaSource']),
    serviceLevelSource: textValue(row, ['service_level_source', 'serviceLevelSource']),
    calculationStatus: String(value(row, ['calculation_status', 'calculationStatus']) ?? 'CALCULATION_UNAVAILABLE'),
    reasonCode: textValue(row, ['reason_code', 'reasonCode']),
  };
}

export function normalizePurchaseRecommendation(row: Record<string, unknown>): PurchaseRecommendation {
  const rawRisk = String(value(row, ['risk_status', 'riskStatus']) ?? '').toUpperCase();
  const riskStatus: ScmStatus = rawRisk === 'CRITICAL'
    ? 'CRITICAL'
    : rawRisk === 'WARNING'
      ? 'WARNING'
      : rawRisk === 'SAFE'
        ? 'SAFE'
        : 'CALCULATION_UNAVAILABLE';
  const trace = value(row, ['calculation_trace', 'calculationTrace']);
  return {
    itemId: String(value(row, ['item_id', 'itemId']) ?? '미정'),
    itemName: String(value(row, ['item_name', 'itemName']) ?? '미정'),
    itemGrade: textValue(row, ['item_grade', 'itemGrade']),
    forecastQty: numberValue(row, ['forecast_qty', 'forecastQty']),
    confirmedOrderQty: numberValue(row, ['confirmed_order_qty', 'confirmedOrderQty']),
    demandBasisQty: numberValue(row, ['demand_basis_qty', 'demandBasisQty']),
    availableInventory: numberValue(row, ['available_inventory', 'availableInventory']),
    scheduledReceipt: numberValue(row, ['scheduled_receipt', 'scheduledReceipt']),
    safetyStock: numberValue(row, ['safety_stock', 'safetyStock']),
    effectiveLeadtime: numberValue(row, ['effective_leadtime', 'effectiveLeadtime']),
    stockoutDate: textValue(row, ['stockout_date', 'stockoutDate']),
    safetyBufferDays: numberValue(row, ['safety_buffer_days', 'safetyBufferDays']),
    requiredQty: numberValue(row, ['required_qty', 'requiredQty']),
    moq: numberValue(row, ['moq']),
    packSize: numberValue(row, ['pack_size', 'packSize']),
    recommendedQty: numberValue(row, ['recommended_qty', 'recommendedQty']),
    recommendedOrderDate: textValue(row, ['recommended_order_date', 'recommendedOrderDate']),
    immediateOrder: booleanValue(row, ['immediate_order', 'immediateOrder']),
    orderTimingStatus: textValue(row, ['order_timing_status', 'orderTimingStatus']),
    riskStatus,
    calculationStatus: String(value(row, ['calculation_status', 'calculationStatus']) ?? 'CALCULATION_UNAVAILABLE'),
    reasonCode: textValue(row, ['reason_code', 'reasonCode']),
    forecastRunId: textValue(row, ['forecast_run_id', 'forecastRunId']),
    modelVersion: textValue(row, ['model_version', 'modelVersion']),
    backtestRunId: textValue(row, ['backtest_run_id', 'backtestRunId']),
    forecastErrorSigma: numberValue(row, ['forecast_error_sigma', 'forecastErrorSigma']),
    leadtimeStddev: numberValue(row, ['leadtime_stddev', 'leadtimeStddev']),
    serviceLevel: numberValue(row, ['service_level', 'serviceLevel']),
    zValue: numberValue(row, ['z_value', 'zValue']),
    calculationTrace: trace && typeof trace === 'object' && !Array.isArray(trace) ? trace as Record<string, unknown> : null,
  };
}

export function normalizeStockoutRisk(row: Record<string, unknown>): StockoutRisk {
  const stockoutDays = numberValue(row, ['stockout_days', 'stockoutDays', '소진예상일수']);
  const rawStatus = String(value(row, ['risk_status', 'status', '위험상태']) ?? '').toUpperCase();
  const reasonCode = value(row, ['reason', 'reason_code', '사유코드']);
  const unavailable = rawStatus === 'UNKNOWN' || rawStatus === 'CALCULATION_UNAVAILABLE';
  const status: ScmStatus = unavailable
    ? 'CALCULATION_UNAVAILABLE'
    : rawStatus === 'CRITICAL'
      ? 'CRITICAL'
      : rawStatus === 'WARNING'
        ? 'WARNING'
        : 'SAFE';

  return {
    itemId: String(value(row, ['item_id', 'itemId', '품목코드']) ?? '미정'),
    itemName: String(value(row, ['item_name', 'itemName', '품목명']) ?? '미정'),
    supplier: String(value(row, ['supplier_name', 'supplier', '법인', '공급처']) ?? '미정'),
    supplierId: textValue(row, ['supplier_id', 'supplierId']),
    currentStock: numberValue(row, ['current_stock', 'currentStock', '현재고']),
    inboundQty: numberValue(row, ['inbound_qty', 'inboundQty', '입고예정']),
    availableQty: numberValue(row, ['available_qty', 'availableQty', '가용재고']),
    dailyUsageAvg: numberValue(row, ['daily_usage_avg', 'dailyUsageAvg', '일평균사용량']),
    plannedLeadTime: numberValue(row, ['planned_lead_time', 'plannedLeadTime', '계획리드타임']),
    effectiveLeadTime: numberValue(row, ['effective_lead_time', 'effectiveLeadTime']),
    leadTimeSource: textValue(row, ['lead_time_source', 'leadTimeSource']),
    stockoutDays,
    stockoutDate: String(value(row, ['stockout_date', 'stockoutDate', '소진예상일']) ?? '') || null,
    projectionAsOf: textValue(row, ['projection_as_of', 'projectionAsOf']),
    daysOfSupply: numberValue(row, ['days_of_supply', 'daysOfSupply']),
    monthsOfSupply: numberValue(row, ['months_of_supply', 'monthsOfSupply']),
    scheduledReceipts: numberValue(row, ['scheduled_receipts', 'scheduledReceipts']),
    confirmedSalesOrder: numberValue(row, ['confirmed_sales_order', 'confirmedSalesOrder']),
    softAllocation: numberValue(row, ['soft_allocation', 'softAllocation']),
    forecastDemand: numberValue(row, ['forecast_demand', 'forecastDemand']),
    forecastSource: textValue(row, ['forecast_source', 'forecastSource']),
    forecastModelId: textValue(row, ['forecast_model_id', 'forecastModelId']),
    forecastModelVersion: textValue(row, ['forecast_model_version', 'forecastModelVersion']),
    softAllocationStatus: textValue(row, ['soft_allocation_status', 'softAllocationStatus']),
    confirmedSalesOrderStatus: textValue(row, ['confirmed_sales_order_status', 'confirmedSalesOrderStatus']),
    status,
    reasonCode: String(reasonCode ?? '') || null,
  };
}

export function normalizeStockoutKpi(row: Record<string, unknown> | null): StockoutKpi | null {
  if (!row) return null;
  return {
    items: numberValue(row, ['n_items', 'items', '품목수']),
    critical: numberValue(row, ['n_critical', 'critical', '위험품목수']),
    warning: numberValue(row, ['n_warning', 'warning', '경고품목수']),
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
