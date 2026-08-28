-- STEP 5: 학습 구간 전용 SKU Demand Profile
-- 모든 계산은 core.v_train_demand에서 시작하며 core.v_test_actual/raw.usage_history를 사용하지 않습니다.

create or replace view analytics.v_sku_demand_monthly_grid
with (security_invoker = true)
as
with settings as (
  select setting_key, train_start, train_end
    from core.forecast_setting
   where setting_key = 'DEFAULT'
     and active = true
   limit 1
), periods as (
  select
    s.setting_key,
    gs::date as period_start,
    row_number() over (order by gs)::integer as period_index
  from settings s
  cross join lateral generate_series(
    date_trunc('month', s.train_start::timestamp),
    date_trunc('month', s.train_end::timestamp),
    interval '1 month'
  ) as gs
  where s.train_start is not null
    and s.train_end is not null
), skus as (
  select item_id, item_name
    from core.v_item_master
   where item_id is not null
), grid as (
  select
    p.setting_key,
    sk.item_id,
    sk.item_name,
    p.period_index,
    p.period_start,
    count(d.item_id)::integer as source_row_count,
    count(d.item_id) filter (where d.qty is null)::integer as null_qty_row_count,
    case
      when count(d.item_id) = 0 then 0::numeric
      when count(d.qty) = 0 then null::numeric
      else sum(d.qty)
    end as quantity,
    (count(d.item_id) = 0) as is_structural_zero
  from skus sk
  cross join periods p
  left join core.v_train_demand d
    on d.item_id = sk.item_id
   and d.use_date >= p.period_start
   and d.use_date < (p.period_start + interval '1 month')::date
  group by p.setting_key, sk.item_id, sk.item_name, p.period_index, p.period_start
)
select * from grid;

create or replace view analytics.v_sku_demand_profile
with (security_invoker = true)
as
with grid as (
  select * from analytics.v_sku_demand_monthly_grid
), bounds as (
  select max(period_index)::integer as last_period_index,
         count(*)::integer as n_periods
    from (select distinct period_index from grid) periods
), stats as (
  select
    g.item_id,
    max(g.item_name) as item_name,
    count(*)::integer as n_periods,
    count(*) filter (where g.quantity > 0)::integer as n_nonzero_periods,
    count(*) filter (where g.quantity = 0)::integer as n_zero_demand_periods,
    count(g.quantity)::integer as n_observed_periods,
    avg(g.quantity) filter (where g.quantity > 0) as nonzero_mean,
    stddev_samp(g.quantity) filter (where g.quantity > 0) as nonzero_sd,
    regr_slope(g.quantity, g.period_index::numeric) as trend,
    (array_agg(to_char(g.period_start, 'YYYY-MM') order by g.quantity desc nulls last, g.period_start asc) filter (where g.quantity > 0))[1] as peak_period
  from grid g
  group by g.item_id
), recent as (
  select
    g.item_id,
    count(g.quantity) filter (where g.period_index > b.last_period_index - 3)::integer as recent_observed_periods,
    count(g.quantity) filter (where g.period_index > b.last_period_index - 6 and g.period_index <= b.last_period_index - 3)::integer as prior_observed_periods,
    avg(g.quantity) filter (where g.period_index > b.last_period_index - 3) as recent_average,
    avg(g.quantity) filter (where g.period_index > b.last_period_index - 6 and g.period_index <= b.last_period_index - 3) as prior_average
  from grid g
  cross join bounds b
  group by g.item_id
), seasonal_pairs as (
  select
    current.item_id,
    current.quantity as current_quantity,
    prior.quantity as prior_quantity
  from grid current
  join grid prior
    on prior.item_id = current.item_id
   and prior.period_start = (current.period_start - interval '12 months')::date
), seasonality as (
  select
    sp.item_id,
    count(sp.current_quantity) filter (where sp.current_quantity is not null and sp.prior_quantity is not null)::integer as paired_observations,
    corr(sp.current_quantity, sp.prior_quantity) as lag12_correlation
  from seasonal_pairs sp
  group by sp.item_id
), profile as (
  select
    s.item_id,
    s.item_name,
    s.n_periods,
    s.n_nonzero_periods,
    case when s.n_nonzero_periods > 0 then s.n_periods::numeric / s.n_nonzero_periods else null end as adi,
    case when s.nonzero_mean > 0 and s.n_nonzero_periods >= 2 then s.nonzero_sd / s.nonzero_mean else null end as cv,
    case when s.nonzero_mean > 0 and s.n_nonzero_periods >= 2 then power(s.nonzero_sd / s.nonzero_mean, 2) else null end as cv_squared,
    case when s.n_periods > 0 then s.n_zero_demand_periods::numeric / s.n_periods else null end as zero_demand_rate,
    case when s.n_observed_periods >= 2 then s.trend else null end as trend,
    case
      when r.recent_observed_periods = 3
       and r.prior_observed_periods = 3
       and r.prior_average is not null
       and r.prior_average <> 0
      then (r.recent_average - r.prior_average) / abs(r.prior_average)
      else null
    end as recent_change_rate,
    s.peak_period,
    case
      when s.n_nonzero_periods > 0
       and s.n_nonzero_periods >= 2
       and s.nonzero_mean > 0
       and (s.n_periods::numeric / s.n_nonzero_periods) < 1.32
       and power(s.nonzero_sd / s.nonzero_mean, 2) < 0.49 then 'SMOOTH'
      when s.n_nonzero_periods > 0
       and s.n_nonzero_periods >= 2
       and s.nonzero_mean > 0
       and (s.n_periods::numeric / s.n_nonzero_periods) >= 1.32
       and power(s.nonzero_sd / s.nonzero_mean, 2) < 0.49 then 'INTERMITTENT'
      when s.n_nonzero_periods > 0
       and s.n_nonzero_periods >= 2
       and s.nonzero_mean > 0
       and (s.n_periods::numeric / s.n_nonzero_periods) < 1.32
       and power(s.nonzero_sd / s.nonzero_mean, 2) >= 0.49 then 'ERRATIC'
      when s.n_nonzero_periods > 0
       and s.n_nonzero_periods >= 2
       and s.nonzero_mean > 0
       and (s.n_periods::numeric / s.n_nonzero_periods) >= 1.32
       and power(s.nonzero_sd / s.nonzero_mean, 2) >= 0.49 then 'LUMPY'
      else null
    end as demand_type,
    case
      when b.n_periods < 24 then null
      when coalesce(se.paired_observations, 0) < 2 then null
      when se.lag12_correlation >= 0.70 then 'SEASONAL'
      else 'NOT_SEASONAL'
    end as seasonality,
    case
      when b.n_periods = 0 then 'TRAIN_PERIOD_NOT_CONFIGURED'
      when s.n_nonzero_periods = 0 then 'NO_DEMAND'
      when s.n_nonzero_periods < 2 or s.nonzero_mean <= 0 then 'INSUFFICIENT_NONZERO_PERIODS_FOR_CV'
      when s.n_observed_periods < 2 then 'INSUFFICIENT_PERIODS_FOR_TREND'
      when r.recent_observed_periods < 3 or r.prior_observed_periods < 3 then 'INSUFFICIENT_RECENT_PERIODS'
      when r.prior_average = 0 then 'RECENT_BASELINE_ZERO'
      when b.n_periods < 24 then 'INSUFFICIENT_PERIODS'
      when coalesce(se.paired_observations, 0) < 2 then 'INSUFFICIENT_SEASONAL_OBSERVATIONS'
      else null
    end as reason_code,
    case
      when s.n_nonzero_periods < 2 or s.nonzero_mean <= 0 then 'CALCULATION_UNAVAILABLE'
      when power(s.nonzero_sd / s.nonzero_mean, 2) < 0.49 then 'STABLE'
      else 'VOLATILE'
    end as stability
  from stats s
  cross join bounds b
  left join recent r on r.item_id = s.item_id
  left join seasonality se on se.item_id = s.item_id
)
select
  item_id,
  item_name,
  n_periods,
  n_nonzero_periods,
  adi,
  cv,
  cv_squared,
  zero_demand_rate,
  trend,
  recent_change_rate,
  peak_period,
  demand_type,
  seasonality,
  reason_code,
  stability
from profile;

create or replace view analytics.v_demand_profile_kpi
with (security_invoker = true)
as
select
  count(*)::integer as total_items,
  count(*) filter (where demand_type = 'SMOOTH')::integer as n_smooth,
  count(*) filter (where demand_type = 'INTERMITTENT')::integer as n_intermittent,
  count(*) filter (where demand_type = 'ERRATIC')::integer as n_erratic,
  count(*) filter (where demand_type = 'LUMPY')::integer as n_lumpy,
  count(*) filter (where demand_type in ('INTERMITTENT', 'LUMPY'))::integer as n_croston_needed,
  count(*) filter (where demand_type is null)::integer as n_calculation_unavailable
from analytics.v_sku_demand_profile;

grant select on analytics.v_sku_demand_monthly_grid, analytics.v_sku_demand_profile, analytics.v_demand_profile_kpi to authenticated;
revoke all on analytics.v_sku_demand_monthly_grid, analytics.v_sku_demand_profile, analytics.v_demand_profile_kpi from anon;
notify pgrst, 'reload schema';
