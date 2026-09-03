-- 4회차 기준 데이터 seed 전 읽기 전용 점검입니다.
-- SQL Editor의 postgres 권한으로 실행하되, 데이터를 변경하지 않습니다.
-- 모든 대상이 EMPTY일 때만 legacy seed migration을 적용합니다.

with expected(table_name, expected_count) as (
  values
    ('core.supplier_alias', 36::bigint),
    ('raw.supplier_master', 13::bigint),
    ('raw.item_master', 23::bigint),
    ('raw.inventory', 43::bigint),
    ('raw.purchase_order', 92::bigint),
    ('raw.goods_receipt', 81::bigint),
    ('raw.forecast', 13::bigint),
    ('raw.shipment_log', 2864::bigint),
    ('raw.usage_history', 7038::bigint)
),
actual(table_name, actual_count) as (
  select 'core.supplier_alias', count(*) from core.supplier_alias
  union all select 'raw.supplier_master', count(*) from raw.supplier_master
  union all select 'raw.item_master', count(*) from raw.item_master
  union all select 'raw.inventory', count(*) from raw.inventory
  union all select 'raw.purchase_order', count(*) from raw.purchase_order
  union all select 'raw.goods_receipt', count(*) from raw.goods_receipt
  union all select 'raw.forecast', count(*) from raw.forecast
  union all select 'raw.shipment_log', count(*) from raw.shipment_log
  union all select 'raw.usage_history', count(*) from raw.usage_history
)
select
  expected.table_name,
  actual.actual_count,
  expected.expected_count,
  case
    when actual.actual_count = 0 then 'EMPTY'
    when actual.actual_count = expected.expected_count then 'BASELINE_PRESENT'
    else 'OTHER'
  end as seed_state
from expected
join actual using (table_name)
order by expected.table_name;

-- 이 두 테이블은 4회차 기준 데이터 seed 대상이 아닙니다.
-- 업무에서 확정한 값이 이미 있으면 보존합니다.
select
  (select count(*) from core.leadtime_plan) as leadtime_plan_rows,
  (select count(*) from core.usage_profile) as usage_profile_rows;
