import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeBomRequirement,
  normalizeDemandProfileRt,
  normalizeOlAccuracy,
  normalizePartLinkage,
  normalizeShipmentTrend,
} from './scm-model.ts';

test('출하 Trend 행을 정규화하고 숫자 null을 보존한다', () => {
  assert.deepEqual(normalizeShipmentTrend({
    item_code: '602K02693',
    period: '2026-01',
    shipment_qty: '779.0',
    order_qty: null,
    shipment_count: 4,
    reason_code: null,
  }), {
    itemCode: '602K02693',
    itemName: null,
    period: '2026-01',
    shipmentQty: 779,
    orderQty: null,
    shipmentCount: 4,
    reasonCode: null,
  });
});

test('실시간 수요 프로파일의 대체 컬럼과 사유코드를 정규화한다', () => {
  const result = normalizeDemandProfileRt({
    itemCode: '602K02693',
    itemName: '테스트 품목',
    valid_days: '60',
    daily_demand_avg: '12.5',
    daily_demand_sd: '2.5',
    cv: null,
    reasonCode: 'NO_USAGE',
  });

  assert.deepEqual(result, {
    itemCode: '602K02693',
    itemName: '테스트 품목',
    validDays: 60,
    totalDemandQty: null,
    averageDailyDemand: 12.5,
    demandSd: 2.5,
    cv: null,
    trend: null,
    reasonCode: 'NO_USAGE',
  });
});

test('OL 정확도는 sales_wape와 scm_bias를 별도 지표로 보존한다', () => {
  const result = normalizeOlAccuracy({
    model_base: 'MDL222',
    fiscal_year: 'FY25',
    sales_wape: '0.664',
    scm_bias: '0.367',
  });

  assert.equal(result.modelBase, 'MDL222');
  assert.equal(result.fiscalYear, 'FY25');
  assert.equal(result.salesWape, 0.664);
  assert.equal(result.scmBias, 0.367);
  assert.equal(result.salesMae, null);
});

test('BOM 공용 행에는 복수 기종 공용 표시를 붙이고 part_role을 보존한다', () => {
  const common = normalizeBomRequirement({
    model_base: 'MDL222',
    item_code: 'PART001',
    part_role: 'CAP',
    bom_qty: '2',
    common_flag: 'COMMON',
    reason_code: 'COMMON_BOM',
  });
  const specific = normalizeBomRequirement({ model_base: 'MDL222', part_role: 'MUST_OPTION', common_flag: 'MODEL' });

  assert.equal(common.commonLabel, '복수 기종 공용');
  assert.equal(common.partRole, 'CAP');
  assert.equal(common.bomQty, 2);
  assert.equal(common.reasonCode, 'COMMON_BOM');
  assert.equal(specific.commonLabel, null);
});

test('부품 연결은 발주 대표코드(HOC)를 정규화한다', () => {
  assert.deepEqual(normalizePartLinkage({
    item_code: 'PART001',
    hoc_code: 'HOC001',
    model_base: 'MDL222',
    linkage_type: 'HOC',
    reason_code: null,
  }), {
    itemCode: 'PART001',
    hocCode: 'HOC001',
    hocName: null,
    modelBase: 'MDL222',
    partCode: null,
    partName: null,
    linkageType: 'HOC',
    reasonCode: null,
  });
});
