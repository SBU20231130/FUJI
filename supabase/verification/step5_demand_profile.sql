-- STEP 5 검증용 조회. 이 파일은 테스트 데이터를 영구 변경하지 않습니다.

-- 1) 모든 대상 SKU가 Grid에 있고 학습기간 전체 15개월을 사용해야 합니다.
select
  count(*) = 315 as grid_shape_ok,
  count(distinct item_id) = 21 as sku_count_ok,
  count(distinct period_start) = 15 as period_count_ok,
  count(*) filter (where is_structural_zero) > 0 as structural_zero_observed
from analytics.v_sku_demand_monthly_grid;

-- 2) 현재 무수요 SKU는 임의 숫자가 아니라 명시적인 계산 불가 사유를 가져야 합니다.
select
  item_id,
  adi is null as adi_unavailable,
  cv_squared is null as cv_squared_unavailable,
  zero_demand_rate = 1 as zero_rate_ok,
  demand_type is null as type_unavailable,
  reason_code = 'NO_DEMAND' as reason_ok
from analytics.v_sku_demand_profile
where n_nonzero_periods = 0;

-- 3) 현재 학습기간은 24개월 미만이므로 false가 아니라 null이어야 합니다.
select
  count(*) = 21 as all_profiles_checked,
  count(*) filter (where seasonality is null and reason_code in ('INSUFFICIENT_PERIODS', 'NO_DEMAND')) = 21 as seasonality_guard_ok
from analytics.v_sku_demand_profile;

-- 4) SBC 경계값 synthetic test: SQL 표본표준편차(stddev_samp)와 동일한 기준을 확인합니다.
with periods as (
  select generate_series(1, 24)::integer as period_index
), synthetic as (
  select 'SMOOTH'::text as expected_type, period_index, (10 + (period_index % 2))::numeric as quantity from periods
  union all
  select 'INTERMITTENT', period_index, case when period_index in (1, 13) then 20 else 0 end from periods
  union all
  select 'ERRATIC', period_index, case when period_index = 24 then 100 else 10 end from periods
  union all
  select 'LUMPY', period_index, case when period_index = 1 then 10 when period_index = 13 then 100 else 0 end from periods
), grouped as (
  select expected_type,
         count(*)::numeric as n_periods,
         count(*) filter (where quantity > 0)::numeric as n_nonzero_periods,
         avg(quantity) filter (where quantity > 0) as mean_quantity,
         stddev_samp(quantity) filter (where quantity > 0) as sd_quantity
    from synthetic
   group by expected_type
), classified as (
  select *,
    case
      when n_periods / n_nonzero_periods < 1.32 and power(sd_quantity / mean_quantity, 2) < 0.49 then 'SMOOTH'
      when n_periods / n_nonzero_periods >= 1.32 and power(sd_quantity / mean_quantity, 2) < 0.49 then 'INTERMITTENT'
      when n_periods / n_nonzero_periods < 1.32 and power(sd_quantity / mean_quantity, 2) >= 0.49 then 'ERRATIC'
      when n_periods / n_nonzero_periods >= 1.32 and power(sd_quantity / mean_quantity, 2) >= 0.49 then 'LUMPY'
    end as actual_type
  from grouped
)
select expected_type, actual_type, expected_type = actual_type as classification_ok
from classified
order by expected_type;

-- 5) NULL 원본과 구조적 0을 구분하는지 확인합니다. 삽입은 트랜잭션 롤백됩니다.
begin;
insert into raw.usage_history (usage_id, item_id, use_date, qty, warehouse, note, source_type, source_record_id)
values ('__STEP5_NULL_QTY_PROBE__', 'ITEM020', '2026-04-15', null, 'PROBE', 'test-only', 'STEP5_TEST', '__STEP5_NULL_QTY_PROBE__');
select quantity is null and source_row_count = 1 and null_qty_row_count = 1 and not is_structural_zero as null_distinction_ok
from analytics.v_sku_demand_monthly_grid
where item_id = 'ITEM020' and period_start = '2026-04-01';
rollback;

-- 6) Data leakage guard: Grid의 직접 의존 객체에 train view만 있어야 합니다.
select
  count(*) filter (where n.nspname = 'core' and c.relname = 'v_train_demand') = 1 as train_source_ok,
  count(*) filter (where c.relname = 'v_test_actual') = 0 as no_test_source_ok,
  count(*) filter (where n.nspname = 'raw') = 0 as no_raw_source_ok
from pg_depend d
join pg_rewrite r on r.oid = d.objid
join pg_class v on v.oid = r.ev_class
join pg_class c on c.oid = d.refobjid
join pg_namespace n on n.oid = c.relnamespace
where v.oid = 'analytics.v_sku_demand_monthly_grid'::regclass
  and d.deptype = 'n';

-- 7) test 기간의 대량 행을 넣어도 학습 프로파일은 변하지 않아야 합니다. 롤백으로 원상복구합니다.
begin;
create temporary table step5_profile_probe_before as
select md5(string_agg(concat_ws('|', item_id, item_name, adi::text, cv_squared::text, demand_type, reason_code), ',' order by item_id)) as profile_hash
from analytics.v_sku_demand_profile;
insert into raw.usage_history (usage_id, item_id, use_date, qty, warehouse, note, source_type, source_record_id)
values ('__STEP5_LEAKAGE_PROBE__', 'ITEM001', '2026-06-01', 999999, 'PROBE', 'test-only', 'STEP5_TEST', '__STEP5_LEAKAGE_PROBE__');
select b.profile_hash = a.profile_hash as train_profile_unchanged_after_test_row
from step5_profile_probe_before b
cross join (
  select md5(string_agg(concat_ws('|', item_id, item_name, adi::text, cv_squared::text, demand_type, reason_code), ',' order by item_id)) as profile_hash
  from analytics.v_sku_demand_profile
) a;
rollback;
