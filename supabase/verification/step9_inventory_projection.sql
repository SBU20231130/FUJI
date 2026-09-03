-- STEP 9 검증 시나리오
-- Supabase SQL Editor에서 실행하면 마지막에 모두 ROLLBACK합니다.
-- 운영 데이터에 테스트 품목/예측/입출고를 남기지 않습니다.

begin;

insert into raw.item_master ("품목코드", "품목명", "품목구분", "단위", "사용여부", supplier_id)
values
  ('STEP9SAFE', 'STEP9 SAFE', '원재료', 'EA', 'Y', 'STEP9_SAFE'),
  ('STEP9WARN', 'STEP9 WARNING', '원재료', 'EA', 'Y', 'STEP9_WARN'),
  ('STEP9CRIT', 'STEP9 CRITICAL', '원재료', 'EA', 'Y', 'STEP9_CRIT'),
  ('STEP9NOLT', 'STEP9 NO LT', '원재료', 'EA', 'Y', 'STEP9_NO_LT'),
  ('STEP9NOINV', 'STEP9 NO INVENTORY', '원재료', 'EA', 'Y', 'STEP9_NO_INV'),
  ('STEP9NOFC', 'STEP9 NO FORECAST', '원재료', 'EA', 'Y', 'STEP9_NO_FORECAST'),
  ('STEP9PO', 'STEP9 FUTURE PO', '원재료', 'EA', 'Y', 'STEP9_PO'),
  ('STEP9SO', 'STEP9 CONFIRMED SO', '원재료', 'EA', 'Y', 'STEP9_SO'),
  ('STEP9SOFT', 'STEP9 SOFT ALLOCATION', '원재료', 'EA', 'Y', 'STEP9_SOFT');

insert into raw.inventory ("품목코드", "창고", "현재고", "기준일자")
values
  ('STEP9SAFE', 'TEST', '100', '2026-08-20'),
  ('STEP9WARN', 'TEST', '25', '2026-08-20'),
  ('STEP9CRIT', 'TEST', '5', '2026-08-20'),
  ('STEP9NOLT', 'TEST', '100', '2026-08-20'),
  ('STEP9NOFC', 'TEST', '100', '2026-08-20'),
  ('STEP9PO', 'TEST', '5', '2026-08-20'),
  ('STEP9SO', 'TEST', '100', '2026-08-20'),
  ('STEP9SOFT', 'TEST', '100', '2026-08-20');

insert into core.leadtime_plan (supplier_id, planned_lead_time, basis, confirmed_reason)
values
  ('STEP9_SAFE', 2, 'TEST', 'STEP9 안전 테스트'),
  ('STEP9_WARN', 2, 'TEST', 'STEP9 경고 테스트'),
  ('STEP9_CRIT', 2, 'TEST', 'STEP9 위험 테스트'),
  ('STEP9_NO_FORECAST', 2, 'TEST', 'STEP9 입력 테스트'),
  ('STEP9_PO', 2, 'TEST', 'STEP9 입고 시점 테스트'),
  ('STEP9_SO', 2, 'TEST', 'STEP9 확정 수주 테스트'),
  ('STEP9_SOFT', 2, 'TEST', 'STEP9 Soft Allocation 테스트');

insert into core.forecast_run (
  forecast_run_id, data_snapshot_at, status, stale, forecast_setting_key,
  pipeline_type, service_name
)
values (
  '00000000-0000-0000-0000-000000000009',
  '2026-08-20T00:00:00Z', 'READY', false, 'DEFAULT', 'SQL', 'step9-test'
);

insert into core.forecast_result (
  forecast_run_id, model_id, model_version, item_id, forecast_date, forecast_value
)
select '00000000-0000-0000-0000-000000000009'::uuid, 'NAIVE', '1.0', item_id, d::date, 10
  from (values
    ('STEP9SAFE'), ('STEP9WARN'), ('STEP9CRIT'), ('STEP9NOLT'),
    ('STEP9NOINV'), ('STEP9PO'), ('STEP9SO'), ('STEP9SOFT')
  ) as i(item_id)
 cross join generate_series('2026-08-20'::date, '2026-08-22'::date, interval '1 day') as dates(d);

insert into raw.shipment_log (shipment_id, po_no, item_id, supplier_id, order_date, due_date, qty, status)
values ('STEP9-SHIP', 'STEP9-PO', 'STEP9PO', 'STEP9_PO', '2026-08-01', '2026-08-22', 100, 'IN_TRANSIT');

insert into raw.sales_order (id, sales_order_no, line_no, order_date, item_id, ordered_qty, requested_delivery_date, status)
values (990000901, 'STEP9-SO', '1', '2026-08-20', 'STEP9SO', 40, '2026-08-21', 'CONFIRMED');

insert into raw.business_event (id, event_id, event_type, event_date, item_id, quantity, status)
values (990000902, 'STEP9-SOFT', 'SOFT_ALLOCATION', '2026-08-21', 'STEP9SOFT', 20, 'OPEN');

-- 1 SAFE, 2 WARNING, 3 CRITICAL
do $$
begin
  if not exists (select 1 from analytics.v_stockout_risk where item_id = 'STEP9SAFE' and risk_status = 'SAFE') then raise exception 'SAFE case failed'; end if;
  if not exists (select 1 from analytics.v_stockout_risk where item_id = 'STEP9WARN' and risk_status = 'WARNING') then raise exception 'WARNING case failed'; end if;
  if not exists (select 1 from analytics.v_stockout_risk where item_id = 'STEP9CRIT' and risk_status = 'CRITICAL') then raise exception 'CRITICAL case failed'; end if;
end;
$$;

-- 4 NO_LEADTIME, 5 NO_INVENTORY_DATA, 6 NO_FORECAST
do $$
begin
  if not exists (select 1 from analytics.v_stockout_risk where item_id = 'STEP9NOLT' and risk_status = 'CALCULATION_UNAVAILABLE' and reason = 'NO_LEADTIME') then raise exception 'NO_LEADTIME case failed'; end if;
  if not exists (select 1 from analytics.v_stockout_risk where item_id = 'STEP9NOINV' and risk_status = 'CALCULATION_UNAVAILABLE' and reason = 'NO_INVENTORY_DATA' and current_stock is null) then raise exception 'NO_INVENTORY_DATA case failed'; end if;
  if not exists (select 1 from analytics.v_stockout_risk where item_id = 'STEP9NOFC' and risk_status = 'CALCULATION_UNAVAILABLE' and reason = 'NO_FORECAST') then raise exception 'NO_FORECAST case failed'; end if;
end;
$$;

-- 7 미래 PO는 납기일 전 기간에 더하지 않고 납기일 기간에만 반영합니다.
do $$
begin
  if exists (select 1 from analytics.v_inventory_projection where item_id = 'STEP9PO' and period = '2026-08-20' and scheduled_receipts <> 0) then raise exception 'future PO was pre-added'; end if;
  if not exists (select 1 from analytics.v_inventory_projection where item_id = 'STEP9PO' and period = '2026-08-22' and scheduled_receipts = 100) then raise exception 'PO receipt date case failed'; end if;
end;
$$;

-- 8 확정 수주와 9 Soft Allocation은 각각 별도 차감 열에 기록합니다.
do $$
begin
  if not exists (select 1 from analytics.v_inventory_projection where item_id = 'STEP9SO' and period = '2026-08-21' and confirmed_sales_order = 40) then raise exception 'confirmed SO case failed'; end if;
  if not exists (select 1 from analytics.v_inventory_projection where item_id = 'STEP9SOFT' and period = '2026-08-21' and soft_allocation = 20 and soft_allocation_status = 'DATA_AVAILABLE') then raise exception 'soft allocation case failed'; end if;
end;
$$;

-- 10 관리자 확정값 우선, 11 정책이 없으면 실적 P80 fallback
insert into core.leadtime_plan (supplier_id, planned_lead_time, basis, confirmed_reason)
values ('SUP001', 7, 'TEST_ADMIN_PRIORITY', 'STEP9 우선순위 테스트');

do $$
begin
  if not exists (select 1 from core.v_leadtime_effective where supplier_id = 'SUP001' and effective_lead_time = 7 and source = 'ADMIN_CONFIRMED') then raise exception 'admin priority case failed'; end if;
  if not exists (select 1 from core.v_leadtime_effective where supplier_id = 'SUP003' and effective_lead_time = p80_days and source = 'ACTUAL_P80' and p80_days is not null) then raise exception 'P80 fallback case failed'; end if;
end;
$$;

rollback;

