-- STEP 10 검증: 모든 테스트 데이터는 트랜잭션 안에서 생성하고 마지막에 ROLLBACK 합니다.
-- 운영 데이터에 테스트 품목·Forecast·정책이 남지 않아야 합니다.

begin;

insert into raw.item_master ("품목코드", "품목명", "품목구분", "단위", "사용여부", supplier_id, source_type, source_record_id)
values
  ('STEP10FCST', 'STEP10 Forecast 우선', 'TEST', 'EA', 'Y', 'SUP001', 'STEP10_TEST', 'STEP10FCST'),
  ('STEP10SO', 'STEP10 확정수주 우선', 'TEST', 'EA', 'Y', 'SUP001', 'STEP10_TEST', 'STEP10SO'),
  ('STEP10ZERO', 'STEP10 미발주', 'TEST', 'EA', 'Y', 'SUP001', 'STEP10_TEST', 'STEP10ZERO'),
  ('STEP10MOQ', 'STEP10 MOQ', 'TEST', 'EA', 'Y', 'SUP001', 'STEP10_TEST', 'STEP10MOQ'),
  ('STEP10PACK', 'STEP10 Pack Size', 'TEST', 'EA', 'Y', 'SUP001', 'STEP10_TEST', 'STEP10PACK'),
  ('STEP10DATE', 'STEP10 추천일', 'TEST', 'EA', 'Y', 'SUP001', 'STEP10_TEST', 'STEP10DATE'),
  ('STEP10NOFORECAST', 'STEP10 Forecast 없음', 'TEST', 'EA', 'Y', 'SUP001', 'STEP10_TEST', 'STEP10NOFORECAST'),
  ('STEP10NOLT', 'STEP10 Lead Time 없음', 'TEST', 'EA', 'Y', 'STEP10NOLT', 'STEP10_TEST', 'STEP10NOLT'),
  ('STEP10NOSERVICE', 'STEP10 서비스 수준 없음', 'TEST', 'EA', 'Y', 'SUP001', 'STEP10_TEST', 'STEP10NOSERVICE'),
  ('STEP10NOPOLICY', 'STEP10 Item Policy 없음', 'TEST', 'EA', 'Y', 'SUP001', 'STEP10_TEST', 'STEP10NOPOLICY'),
  ('STEP10SIGMALOW', 'STEP10 낮은 Forecast 오차', 'TEST', 'EA', 'Y', 'SUP001', 'STEP10_TEST', 'STEP10SIGMALOW'),
  ('STEP10SIGMAHIGH', 'STEP10 높은 Forecast 오차', 'TEST', 'EA', 'Y', 'SUP001', 'STEP10_TEST', 'STEP10SIGMAHIGH'),
  ('STEP10NOERROR', 'STEP10 Forecast 오차 없음', 'TEST', 'EA', 'Y', 'SUP001', 'STEP10_TEST', 'STEP10NOERROR')
on conflict do nothing;

insert into raw.inventory ("품목코드", "창고", "현재고", "기준일자", "안전재고", source_type, source_record_id)
values
  ('STEP10FCST', 'STEP10', '10', '2026-08-20', '0', 'STEP10_TEST', 'STEP10FCST'),
  ('STEP10SO', 'STEP10', '10', '2026-08-20', '0', 'STEP10_TEST', 'STEP10SO'),
  ('STEP10ZERO', 'STEP10', '500', '2026-08-20', '0', 'STEP10_TEST', 'STEP10ZERO'),
  ('STEP10MOQ', 'STEP10', '0', '2026-08-20', '0', 'STEP10_TEST', 'STEP10MOQ'),
  ('STEP10PACK', 'STEP10', '0', '2026-08-20', '0', 'STEP10_TEST', 'STEP10PACK'),
  ('STEP10DATE', 'STEP10', '400', '2026-08-20', '0', 'STEP10_TEST', 'STEP10DATE'),
  ('STEP10NOFORECAST', 'STEP10', '100', '2026-08-20', '0', 'STEP10_TEST', 'STEP10NOFORECAST'),
  ('STEP10NOLT', 'STEP10', '100', '2026-08-20', '0', 'STEP10_TEST', 'STEP10NOLT'),
  ('STEP10NOSERVICE', 'STEP10', '100', '2026-08-20', '0', 'STEP10_TEST', 'STEP10NOSERVICE'),
  ('STEP10NOPOLICY', 'STEP10', '0', '2026-08-20', '0', 'STEP10_TEST', 'STEP10NOPOLICY'),
  ('STEP10SIGMALOW', 'STEP10', '0', '2026-08-20', '0', 'STEP10_TEST', 'STEP10SIGMALOW'),
  ('STEP10SIGMAHIGH', 'STEP10', '0', '2026-08-20', '0', 'STEP10_TEST', 'STEP10SIGMAHIGH'),
  ('STEP10NOERROR', 'STEP10', '100', '2026-08-20', '0', 'STEP10_TEST', 'STEP10NOERROR');

insert into raw.sales_order (id, sales_order_no, line_no, order_date, item_id, supplier_id, ordered_qty, requested_delivery_date, status, source_type, source_record_id)
values
  (910001, 'STEP10SOORDER', '1', '2026-08-20', 'STEP10SO', 'SUP001', 120, '2026-08-21', 'CONFIRMED', 'STEP10_TEST', 'STEP10SOORDER');

insert into raw.sales_order (id, sales_order_no, line_no, item_id, supplier_id, ordered_qty, requested_delivery_date, status, source_type, source_record_id)
values
  (910002, 'STEP10DATEORDER', '1', 'STEP10DATE', 'SUP001', 600, '2026-09-30', 'CONFIRMED', 'STEP10_TEST', 'STEP10DATEORDER');

insert into raw.shipment_log (shipment_id, po_no, item_id, supplier_id, country, transport_mode, order_date, due_date, qty, warehouse, status, source_type, source_record_id)
values
  ('STEP10INBOUND', 'STEP10INBOUNDPO', 'STEP10FCST', 'SUP001', 'TEST', 'SEA', '2026-08-20', '2026-08-25', 5, 'STEP10', 'IN_TRANSIT', 'STEP10_TEST', 'STEP10INBOUND');

insert into core.item_policy (item_id, moq, pack_size, item_grade, active)
values
  ('STEP10FCST', 1, 1, 'A', true),
  ('STEP10SO', 1, 1, 'A', true),
  ('STEP10ZERO', 1, 1, 'A', true),
  ('STEP10MOQ', 50, 10, 'A', true),
  ('STEP10PACK', 1, 20, 'A', true),
  ('STEP10DATE', 1, 1, 'A', true),
  ('STEP10NOFORECAST', 1, 1, 'A', true),
  ('STEP10NOLT', 1, 1, 'A', true),
  ('STEP10NOSERVICE', 1, 1, 'Z', true),
  ('STEP10NOPOLICY', 1, null, 'A', true),
  ('STEP10SIGMALOW', 1, 1, 'A', true),
  ('STEP10SIGMAHIGH', 1, 1, 'A', true),
  ('STEP10NOERROR', 1, 1, 'A', true);

insert into core.leadtime_plan (supplier_id, planned_lead_time, basis, service_level, confirmed_reason, confirmed_at)
values ('STEP10NOLT', null, 'STEP10_TEST', null, null, null)
on conflict (supplier_id) do nothing;

insert into core.policy_config (policy_key, safety_buffer_days, config_value, active, description)
values ('DEFAULT', 2, '{}'::jsonb, true, 'STEP10 검증')
on conflict (policy_key) do update set safety_buffer_days = excluded.safety_buffer_days, active = true;

insert into core.forecast_run (forecast_run_id, data_snapshot_at, status, stale, forecast_setting_key, pipeline_type, request_params, started_at, completed_at)
values ('11111111-1111-4111-8111-111111111111', '2026-08-20T00:00:00Z', 'READY', false, 'DEFAULT', 'SQL', '{}'::jsonb, '2026-08-20T00:00:00Z', '2026-08-20T00:01:00Z');

insert into core.backtest_run (backtest_run_id, forecast_run_id, test_start, test_end, metric, status, started_at, completed_at)
values ('22222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111111', '2026-07-01', '2026-07-31', 'RMSE', 'COMPLETED', '2026-08-20T00:00:00Z', '2026-08-20T00:01:00Z');

insert into core.model_performance (
  backtest_run_id, forecast_run_id, model_id, model_version, item_id,
  test_start, test_end, metric, periods_total, actual_periods, forecast_periods,
  comparable_periods, actual_abs_sum, rmse, mae, metric_value, status, calculated_at
)
select
  '22222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111111', 'NAIVE', '1.0', item_id,
  '2026-07-01', '2026-07-31', 'RMSE', 31, 31, 31, 31, 310, rmse, rmse, rmse, 'VALID', '2026-08-20T00:02:00Z'
from (values
  ('STEP10FCST', 2::numeric),
  ('STEP10SO', 2::numeric),
  ('STEP10ZERO', 2::numeric),
  ('STEP10MOQ', 2::numeric),
  ('STEP10PACK', 2::numeric),
  ('STEP10DATE', 2::numeric),
  ('STEP10NOLT', 2::numeric),
  ('STEP10NOSERVICE', 2::numeric),
  ('STEP10NOPOLICY', 2::numeric),
  ('STEP10SIGMALOW', 1::numeric),
  ('STEP10SIGMAHIGH', 10::numeric)
) as x(item_id, rmse);

insert into core.champion_model (item_id, model_id, model_version, metric, metric_value, backtest_run_id, forecast_run_id, selection_method, selection_reason)
select item_id, 'NAIVE', '1.0', 'RMSE', rmse, '22222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111111', 'AUTO', 'STEP10 검증 Champion'
from (values
  ('STEP10FCST', 2::numeric),
  ('STEP10SO', 2::numeric),
  ('STEP10ZERO', 2::numeric),
  ('STEP10MOQ', 2::numeric),
  ('STEP10PACK', 2::numeric),
  ('STEP10DATE', 2::numeric),
  ('STEP10NOLT', 2::numeric),
  ('STEP10NOSERVICE', 2::numeric),
  ('STEP10NOPOLICY', 2::numeric),
  ('STEP10SIGMALOW', 1::numeric),
  ('STEP10SIGMAHIGH', 10::numeric)
) as x(item_id, rmse);

insert into core.forecast_result (forecast_run_id, model_id, model_version, item_id, forecast_date, forecast_value, p50, p80, p90)
values
  ('11111111-1111-4111-8111-111111111111', 'NAIVE', '1.0', 'STEP10FCST', '2026-08-21', 100, 100, 100, 100),
  ('11111111-1111-4111-8111-111111111111', 'NAIVE', '1.0', 'STEP10SO', '2026-08-21', 20, 20, 20, 20),
  ('11111111-1111-4111-8111-111111111111', 'NAIVE', '1.0', 'STEP10ZERO', '2026-08-21', 20, 20, 20, 20),
  ('11111111-1111-4111-8111-111111111111', 'NAIVE', '1.0', 'STEP10NOLT', '2026-08-21', 10, 10, 10, 10),
  ('11111111-1111-4111-8111-111111111111', 'NAIVE', '1.0', 'STEP10NOSERVICE', '2026-08-21', 10, 10, 10, 10),
  ('11111111-1111-4111-8111-111111111111', 'NAIVE', '1.0', 'STEP10SIGMALOW', '2026-08-21', 10, 10, 10, 10),
  ('11111111-1111-4111-8111-111111111111', 'NAIVE', '1.0', 'STEP10SIGMAHIGH', '2026-08-21', 10, 10, 10, 10),
  ('11111111-1111-4111-8111-111111111111', 'NAIVE', '1.0', 'STEP10NOERROR', '2026-08-21', 10, 10, 10, 10);

insert into core.forecast_result (forecast_run_id, model_id, model_version, item_id, forecast_date, forecast_value, p50, p80, p90)
select '11111111-1111-4111-8111-111111111111', 'NAIVE', '1.0', x.item_id, d::date, x.daily_demand, x.daily_demand, x.daily_demand, x.daily_demand
from (values ('STEP10MOQ', 10::numeric), ('STEP10PACK', 47::numeric), ('STEP10NOPOLICY', 10::numeric)) as x(item_id, daily_demand)
cross join generate_series('2026-08-21'::date, '2026-09-29'::date, '1 day'::interval) as g(d);

insert into core.forecast_result (forecast_run_id, model_id, model_version, item_id, forecast_date, forecast_value, p50, p80, p90)
select '11111111-1111-4111-8111-111111111111', 'NAIVE', '1.0', 'STEP10DATE', d::date, 10, 10, 10, 10
from generate_series('2026-08-21'::date, '2026-09-30'::date, '1 day'::interval) as g(d);

do $$
declare
  r record;
  low_safety numeric;
  high_safety numeric;
begin
  select * into r from analytics.v_purchase_recommendation where item_id = 'STEP10FCST';
  if r.forecast_qty <= r.confirmed_order_qty or r.demand_basis_qty <> r.forecast_qty then
    raise exception 'Forecast 우선 기준 수요 검증 실패: %', row_to_json(r);
  end if;
  if r.scheduled_receipt <> 5 then
    raise exception '예정 입고 연결 검증 실패: %', row_to_json(r);
  end if;

  select * into r from analytics.v_purchase_recommendation where item_id = 'STEP10SO';
  if r.confirmed_order_qty <= r.forecast_qty or r.demand_basis_qty <> r.confirmed_order_qty then
    raise exception '확정 수주 우선 기준 수요 검증 실패: %', row_to_json(r);
  end if;

  select * into r from analytics.v_safety_stock where item_id = 'STEP10FCST';
  if r.calculation_status <> 'READY' or r.sigma_dlt is null or r.safety_stock is null or r.forecast_error_sigma <> 2 or r.leadtime_stddev is null then
    raise exception 'Safety Stock 계산/출처 검증 실패: %', row_to_json(r);
  end if;
  if abs(r.sigma_dlt - sqrt(r.effective_leadtime * power(r.forecast_error_sigma, 2) + power(r.expected_daily_demand, 2) * power(r.leadtime_stddev, 2))) > 0.0001 then
    raise exception 'sigma_DLT 공식 검증 실패: %', row_to_json(r);
  end if;

  select * into r from analytics.v_purchase_recommendation where item_id = 'STEP10ZERO';
  if r.required_qty > 0 or r.recommended_qty <> 0 or r.calculation_status <> 'NO_ORDER_NEEDED' then
    raise exception '필요 수량 0 이하 미발주 검증 실패: %', row_to_json(r);
  end if;

  select * into r from analytics.v_purchase_recommendation where item_id = 'STEP10MOQ';
  if r.required_qty is null or r.recommended_qty < 50 then
    raise exception 'MOQ 하한 검증 실패: %', row_to_json(r);
  end if;
  if not r.immediate_order or r.order_timing_status <> 'IMMEDIATE' then
    raise exception '과거 추천 발주일 즉시 처리 검증 실패: %', row_to_json(r);
  end if;

  select * into r from analytics.v_purchase_recommendation where item_id = 'STEP10PACK';
  if r.required_qty is null or r.recommended_qty < r.required_qty or mod(r.recommended_qty, 20) <> 0 then
    raise exception 'Pack Size 올림 검증 실패: %', row_to_json(r);
  end if;

  select * into r from analytics.v_purchase_recommendation where item_id = 'STEP10DATE';
  if r.recommended_order_date is null or r.recommended_order_date <> r.stockout_date - r.effective_leadtime - r.safety_buffer_days::integer then
    raise exception '추천 발주일 공식 검증 실패: %', row_to_json(r);
  end if;

  select * into r from analytics.v_purchase_recommendation where item_id = 'STEP10NOFORECAST';
  if r.calculation_status <> 'CALCULATION_UNAVAILABLE' or r.reason_code <> 'NO_FORECAST' or r.recommended_qty is not null then
    raise exception 'NO_FORECAST 검증 실패: %', row_to_json(r);
  end if;

  select * into r from analytics.v_purchase_recommendation where item_id = 'STEP10NOLT';
  if r.calculation_status <> 'CALCULATION_UNAVAILABLE' or r.reason_code <> 'NO_LEADTIME' or r.recommended_qty is not null then
    raise exception 'NO_LEADTIME 검증 실패: %', row_to_json(r);
  end if;

  select * into r from analytics.v_purchase_recommendation where item_id = 'STEP10NOSERVICE';
  if r.calculation_status <> 'CALCULATION_UNAVAILABLE' or r.reason_code <> 'NO_SERVICE_LEVEL' or r.recommended_qty is not null then
    raise exception 'NO_SERVICE_LEVEL 검증 실패: %', row_to_json(r);
  end if;

  select * into r from analytics.v_purchase_recommendation where item_id = 'STEP10NOPOLICY';
  if r.calculation_status <> 'CALCULATION_UNAVAILABLE' or r.reason_code <> 'NO_ITEM_POLICY' or r.recommended_qty is not null then
    raise exception 'NO_ITEM_POLICY 검증 실패: %', row_to_json(r);
  end if;

  select safety_stock into low_safety from analytics.v_safety_stock where item_id = 'STEP10SIGMALOW';
  select safety_stock into high_safety from analytics.v_safety_stock where item_id = 'STEP10SIGMAHIGH';
  if low_safety is null or high_safety is null or high_safety <= low_safety then
    raise exception 'Forecast error sigma 증가에 따른 Safety Stock 증가 검증 실패: low=%, high=%', low_safety, high_safety;
  end if;

  select * into r from analytics.v_purchase_recommendation where item_id = 'STEP10NOERROR';
  if r.calculation_status <> 'CALCULATION_UNAVAILABLE' or r.reason_code <> 'INSUFFICIENT_FORECAST_ERROR' then
    raise exception 'INSUFFICIENT_FORECAST_ERROR 검증 실패: %', row_to_json(r);
  end if;

  select * into r from analytics.v_purchase_recommendation where item_id = 'STEP10FCST';
  if r.calculation_trace is null or r.calculation_trace->>'forecast_qty' is null or r.calculation_trace->>'required_qty' is null then
    raise exception '계산 trace 재조회 검증 실패: %', row_to_json(r);
  end if;
end;
$$;

rollback;
