-- STEP 10: Forecast Error와 Lead Time 변동성을 반영한 Safety Stock 및 발주 추천
-- 모든 수량/날짜 계산은 DB에서 수행합니다. 원천(raw) 데이터는 수정하지 않습니다.

create table if not exists core.service_level_policy (
  item_grade text primary key,
  service_level numeric(7, 4) not null,
  z_value numeric(10, 5) not null,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint service_level_policy_grade_ck check (length(trim(item_grade)) > 0),
  constraint service_level_policy_service_level_ck check (service_level > 0 and service_level <= 1),
  constraint service_level_policy_z_value_ck check (z_value >= 0)
);

insert into core.service_level_policy (item_grade, service_level, z_value, description)
values
  ('A', 0.9500, 1.64485, 'A등급 기본 서비스 수준'),
  ('B', 0.9000, 1.28155, 'B등급 기본 서비스 수준'),
  ('C', 0.8500, 1.03643, 'C등급 기본 서비스 수준')
on conflict (item_grade) do nothing;

drop trigger if exists service_level_policy_set_updated_at on core.service_level_policy;
create trigger service_level_policy_set_updated_at
  before update on core.service_level_policy
  for each row execute function core.set_updated_at();

alter table core.service_level_policy enable row level security;
drop policy if exists service_level_policy_select_authenticated on core.service_level_policy;
create policy service_level_policy_select_authenticated
  on core.service_level_policy for select to authenticated
  using ((select auth.uid()) is not null);
drop policy if exists service_level_policy_admin_insert on core.service_level_policy;
create policy service_level_policy_admin_insert
  on core.service_level_policy for insert to authenticated
  with check ((select core.is_admin()));
drop policy if exists service_level_policy_admin_update on core.service_level_policy;
create policy service_level_policy_admin_update
  on core.service_level_policy for update to authenticated
  using ((select core.is_admin()))
  with check ((select core.is_admin()));
drop policy if exists service_level_policy_admin_delete on core.service_level_policy;
create policy service_level_policy_admin_delete
  on core.service_level_policy for delete to authenticated
  using ((select core.is_admin()));

revoke all on core.service_level_policy from anon;
grant select, insert, update, delete on core.service_level_policy to authenticated;

drop view if exists analytics.v_purchase_recommendation;
drop view if exists analytics.v_safety_stock;
drop view if exists core.v_service_level_effective;
drop view if exists core.v_forecast_error_sigma;

create view core.v_service_level_effective as
select i.item_id,
       ip.item_grade,
       ip.moq,
       ip.pack_size,
       sp.service_level,
       sp.z_value,
       sp.description as service_level_description,
       case when sp.item_grade is not null then 'GRADE_POLICY' else null end as service_level_source
  from core.v_item_master i
  left join core.item_policy ip
    on ip.item_id = i.item_id and ip.active = true
  left join core.service_level_policy sp
    on upper(trim(sp.item_grade)) = upper(trim(ip.item_grade))
   and sp.active = true;

-- STEP 7의 유효한 Champion 성능을 우선 사용하고, 없으면 최근 유효 성능을 사용합니다.
-- RMSE를 Forecast error variability(sigma_D)로 사용하며, RMSE가 없는 경우 임의값을 만들지 않습니다.
create view core.v_forecast_error_sigma as
with champion_performance as (
  select distinct on (c.item_id)
         c.item_id,
         p.forecast_run_id,
         p.backtest_run_id,
         p.model_id,
         p.model_version,
         p.rmse as forecast_error_sigma,
         p.comparable_periods as forecast_error_samples,
         'CHAMPION_MODEL_PERFORMANCE_RMSE'::text as sigma_source,
         p.calculated_at
    from core.champion_model c
    join core.model_performance p
      on p.backtest_run_id = c.backtest_run_id
     and p.forecast_run_id = c.forecast_run_id
     and p.item_id = c.item_id
     and p.model_id = c.model_id
     and p.model_version = c.model_version
   where p.status = 'VALID'
     and p.rmse is not null
     and p.rmse >= 0
   order by c.item_id, c.selected_at desc, c.champion_model_id desc
), recent_performance as (
  select distinct on (p.item_id)
         p.item_id,
         p.forecast_run_id,
         p.backtest_run_id,
         p.model_id,
         p.model_version,
         p.rmse as forecast_error_sigma,
         p.comparable_periods as forecast_error_samples,
         'RECENT_MODEL_PERFORMANCE_RMSE'::text as sigma_source,
         p.calculated_at
    from core.model_performance p
   where p.status = 'VALID'
     and p.rmse is not null
     and p.rmse >= 0
     and not exists (select 1 from champion_performance c where c.item_id = p.item_id)
   order by p.item_id, p.calculated_at desc, p.performance_id desc
)
select * from champion_performance
union all
select * from recent_performance;

create view analytics.v_safety_stock as
with policy as (
  select max(safety_buffer_days) filter (where active) as safety_buffer_days
    from core.policy_config
   where policy_key = 'DEFAULT'
), inputs as (
  select r.item_id,
         r.item_name,
         r.supplier_id,
         r.supplier_name,
         s.item_grade,
         s.service_level,
         s.z_value,
         s.service_level_source,
         r.daily_usage_avg as expected_daily_demand,
         r.current_stock as available_inventory,
         r.inbound_qty as scheduled_receipt,
         r.planned_lead_time as effective_leadtime,
         r.lead_time_source,
         l.mean_days as leadtime_mean,
         l.std_days as leadtime_stddev,
         l.n_samples as leadtime_samples,
         e.forecast_error_sigma,
         e.forecast_error_samples,
         e.forecast_run_id,
         e.backtest_run_id,
         e.model_id,
         e.model_version,
         e.sigma_source,
         r.forecast_demand,
         r.confirmed_sales_order,
         r.stockout_date,
         p.safety_buffer_days
    from analytics.v_stockout_risk r
    left join core.v_service_level_effective s on s.item_id = r.item_id
    left join core.v_leadtime_stat l on l.supplier_id = r.supplier_id
    left join core.v_forecast_error_sigma e on e.item_id = r.item_id
    cross join policy p
), classified as (
  select i.*,
         case
           when i.available_inventory is null then 'NO_INVENTORY_DATA'
           when i.effective_leadtime is null then 'NO_LEADTIME'
           when i.forecast_demand is null or i.expected_daily_demand is null or i.expected_daily_demand <= 0 then
             case when i.forecast_demand is null then 'NO_FORECAST' else 'NO_USAGE_HISTORY' end
           when i.forecast_error_sigma is null then 'INSUFFICIENT_FORECAST_ERROR'
           when i.leadtime_stddev is null then 'NO_LEADTIME_VARIABILITY'
           when i.service_level is null or i.z_value is null then 'NO_SERVICE_LEVEL'
           else null
         end as reason_code
    from inputs i
), calculated as (
  select c.*,
         case when c.reason_code is null then sqrt(greatest(
           c.effective_leadtime::numeric * power(c.forecast_error_sigma, 2)
           + power(c.expected_daily_demand, 2) * power(c.leadtime_stddev, 2),
           0
         )) else null end as sigma_dlt
    from classified c
)
select item_id,
       item_name,
       supplier_id,
       supplier_name,
       item_grade,
       service_level,
       z_value,
       expected_daily_demand,
       forecast_error_sigma,
       forecast_error_samples,
       leadtime_mean,
       leadtime_stddev,
       leadtime_samples,
       effective_leadtime,
       lead_time_source,
       sigma_dlt,
       case when sigma_dlt is null then null else z_value * sigma_dlt end as safety_stock,
       available_inventory,
       scheduled_receipt,
       forecast_demand,
       confirmed_sales_order,
       stockout_date,
       safety_buffer_days,
       forecast_run_id,
       backtest_run_id,
       model_id,
       model_version,
       sigma_source,
       service_level_source,
       case when reason_code is null then 'READY' else 'CALCULATION_UNAVAILABLE' end as calculation_status,
       reason_code
  from calculated;

create view analytics.v_purchase_recommendation as
with base as (
  select r.item_id,
         r.item_name,
         s.item_grade,
         r.forecast_demand as forecast_qty,
         r.confirmed_sales_order as confirmed_order_qty,
         r.current_stock as available_inventory,
         r.inbound_qty as scheduled_receipt,
         ss.safety_stock,
         r.planned_lead_time as effective_leadtime,
         r.stockout_date,
         ss.safety_buffer_days,
         s.moq,
         s.pack_size,
         r.risk_status,
         ss.calculation_status as safety_stock_status,
         ss.reason_code as safety_stock_reason,
         ss.forecast_run_id,
         ss.model_version,
         ss.backtest_run_id,
         ss.forecast_error_sigma,
         ss.leadtime_stddev,
         ss.service_level,
         ss.z_value
    from analytics.v_stockout_risk r
    join analytics.v_safety_stock ss on ss.item_id = r.item_id
    left join core.v_service_level_effective s on s.item_id = r.item_id
), demand as (
  select b.*,
         case when b.forecast_qty is null or b.confirmed_order_qty is null then null
              else greatest(b.forecast_qty, b.confirmed_order_qty) end as demand_basis_qty
    from base b
), requirement as (
  select d.*,
         case when d.safety_stock_status = 'READY'
                    and d.available_inventory is not null
                    and d.scheduled_receipt is not null
                    and d.demand_basis_qty is not null
              then greatest(0::numeric, d.demand_basis_qty - d.safety_stock
                                           - d.available_inventory - d.scheduled_receipt)
              else null end as required_qty
    from demand d
), classified as (
  select r.*,
         case
           when r.safety_stock_reason is not null then r.safety_stock_reason
           when r.required_qty is null then 'CALCULATION_UNAVAILABLE'
           when r.required_qty <= 0 then null
           when r.moq is null or r.pack_size is null then 'NO_ITEM_POLICY'
           when r.stockout_date is null then 'NO_STOCKOUT_DATE'
           when r.safety_buffer_days is null then 'NO_SAFETY_BUFFER'
           else null
         end as reason_code
    from requirement r
), recommended as (
  select c.*,
         case when c.reason_code is null and c.required_qty > 0
                   then ceil(greatest(c.required_qty, c.moq) / c.pack_size) * c.pack_size
              when c.reason_code is null and c.required_qty <= 0 then 0::numeric
              else null end as recommended_qty,
         case when c.reason_code is null and c.required_qty > 0
                    and c.stockout_date is not null and c.effective_leadtime is not null
                    and c.safety_buffer_days is not null
              then (c.stockout_date - c.effective_leadtime - c.safety_buffer_days::integer)
              else null end as recommended_order_date
    from classified c
), final_values as (
  select r.*,
         case when r.safety_stock_reason is not null then 'CALCULATION_UNAVAILABLE'
              when r.required_qty is null then 'CALCULATION_UNAVAILABLE'
              when r.required_qty <= 0 then 'NO_ORDER_NEEDED'
              when r.reason_code is null then 'READY'
              else 'CALCULATION_UNAVAILABLE' end as calculation_status
    from recommended r
)
select item_id,
       item_name,
       item_grade,
       forecast_qty,
       confirmed_order_qty,
       demand_basis_qty,
       available_inventory,
       scheduled_receipt,
       safety_stock,
       effective_leadtime,
       stockout_date,
       safety_buffer_days,
       required_qty,
       moq,
       pack_size,
       recommended_qty,
       recommended_order_date,
       (recommended_order_date is not null and recommended_order_date < current_date) as immediate_order,
       case
         when calculation_status = 'NO_ORDER_NEEDED' then 'NOT_REQUIRED'
         when calculation_status <> 'READY' then 'UNAVAILABLE'
         when recommended_order_date < current_date then 'IMMEDIATE'
         else 'PLANNED'
       end as order_timing_status,
       risk_status,
       calculation_status,
       case when calculation_status = 'CALCULATION_UNAVAILABLE' then reason_code else null end as reason_code,
       forecast_run_id,
       model_version,
       backtest_run_id,
       forecast_error_sigma,
       leadtime_stddev,
       service_level,
       z_value,
       jsonb_build_object(
         'policy', 'BASE_FORECAST_PLUS_EXPLICIT_CONFIRMED_ORDER',
         'forecast_qty', forecast_qty,
         'confirmed_order_qty', confirmed_order_qty,
         'demand_basis_qty', demand_basis_qty,
         'safety_stock', safety_stock,
         'available_inventory', available_inventory,
         'scheduled_receipt', scheduled_receipt,
         'required_qty', required_qty,
         'moq', moq,
         'pack_size', pack_size,
         'recommended_qty', recommended_qty,
         'recommended_order_date', recommended_order_date,
         'immediate_order', (recommended_order_date is not null and recommended_order_date < current_date),
         'forecast_error_sigma', forecast_error_sigma,
         'leadtime_stddev', leadtime_stddev,
         'service_level', service_level,
         'z_value', z_value,
         'effective_leadtime', effective_leadtime,
         'calculation_status', calculation_status,
         'reason_code', case when calculation_status = 'CALCULATION_UNAVAILABLE' then reason_code else null end
       ) as calculation_trace
  from final_values;

grant select on core.service_level_policy, core.v_service_level_effective,
  core.v_forecast_error_sigma to authenticated;
grant select on analytics.v_safety_stock, analytics.v_purchase_recommendation to authenticated;
revoke all on core.service_level_policy, core.v_service_level_effective,
  core.v_forecast_error_sigma from anon;
revoke all on analytics.v_safety_stock, analytics.v_purchase_recommendation from anon;

notify pgrst, 'reload schema';
