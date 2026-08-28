import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeDemandProfile, normalizeForecastSettings, normalizeLeadtimeGap } from './scm-model.ts';

test('normalizes analytics leadtime rows into the screen model', () => {
  const result = normalizeLeadtimeGap({
    supplier_name: 'Fujifilm BI India',
    country: 'India',
    master_lt: 32,
    sample_count: 159,
    actual_avg: 37.6,
    p80: 44,
    gap: 12,
  });

  assert.deepEqual(result, {
    supplier: 'Fujifilm BI India',
    country: 'India',
    masterLeadTime: 32,
    sampleCount: 159,
    actualAverage: 37.6,
    p80: 44,
    gap: 12,
    status: 'CRITICAL',
  });
});

test('uses Korean view aliases and safe defaults', () => {
  const result = normalizeLeadtimeGap({ 법인: 'Japan', 국가: 'Japan', 표준리드타임: 7, 표본수: 278, 실적평균: 14.5, P80: 18, 격차: 11 });
  assert.equal(result.supplier, 'Japan');
  assert.equal(result.masterLeadTime, 7);
  assert.equal(result.p80, 18);
  assert.equal(result.gap, 11);
});

test('reads the real analytics.v_leadtime_gap column names', () => {
  const result = normalizeLeadtimeGap({
    supplier_name: 'Fujifilm BI China',
    country: 'China',
    std_lead_time: 25,
    n_samples: 210,
    mean_days: 28.4,
    p80_days: 33,
    gap_days: 8,
  });

  assert.deepEqual(result, {
    supplier: 'Fujifilm BI China',
    country: 'China',
    masterLeadTime: 25,
    sampleCount: 210,
    actualAverage: 28.4,
    p80: 33,
    gap: 8,
    status: 'CRITICAL',
  });
});

test('keeps forecast coverage flags and unconfigured policy values explicit', () => {
  const result = normalizeForecastSettings({
    setting_key: 'DEFAULT',
    granularity: 'DAILY',
    train_row_count: 5602,
    test_row_count: 1436,
    overlap_row_count: 0,
    train_window_ok: true,
    test_window_ok: true,
    isolation_ok: true,
    default_service_level: null,
  });

  assert.equal(result?.isolationOk, true);
  assert.equal(result?.trainRowCount, 5602);
  assert.equal(result?.defaultServiceLevel, null);
});

test('keeps Demand Profile model codes separate from display labels', () => {
  const result = normalizeDemandProfile({
    item_id: 'ITEM001',
    item_name: '테스트 품목',
    n_periods: 24,
    n_nonzero_periods: 12,
    adi: 2,
    cv: 1,
    cv_squared: 1,
    zero_demand_rate: 0.5,
    trend: -0.3,
    recent_change_rate: 0.25,
    peak_period: '2026-01',
    demand_type: 'LUMPY',
    seasonality: 'SEASONAL',
    reason_code: null,
    stability: 'VOLATILE',
  });

  assert.equal(result.demandType, 'LUMPY');
  assert.equal(result.seasonality, 'SEASONAL');
  assert.equal(result.reasonCode, null);
  assert.equal(result.cvSquared, 1);
});
