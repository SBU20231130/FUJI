-- STEP 7 검증 SQL
-- Supabase SQL Editor에서 실행할 수 있습니다. 테스트 데이터는 마지막에 ROLLBACK 됩니다.

-- metric 정의: Bias = forecast - actual. 양수는 over-forecast, 음수는 under-forecast.
do $$
declare
  v_wape numeric;
  v_mape numeric;
  v_bias_over numeric;
  v_bias_under numeric;
  v_rmse numeric;
begin
  select sum(abs(forecast - actual)) / nullif(sum(abs(actual)), 0),
         avg(abs(forecast - actual) / nullif(abs(actual), 0)) filter (where actual <> 0),
         avg(forecast - actual) filter (where forecast >= actual),
         avg(forecast - actual) filter (where forecast < actual),
         sqrt(avg(power(forecast - actual, 2)))
    into v_wape, v_mape, v_bias_over, v_bias_under, v_rmse
    from (values
      (10::numeric, 10::numeric),
      (20::numeric, 22::numeric),
      (0::numeric, 0::numeric)
    ) as x(actual, forecast);
  if v_wape is null then raise exception 'WAPE_BASIC_FAILED'; end if;
  if v_mape is null then raise exception 'MAPE_ZERO_POLICY_FAILED'; end if;
  if v_bias_over <= 0 or v_bias_under >= 0 then raise exception 'BIAS_DIRECTION_FAILED'; end if;
  if v_rmse <= 0 then raise exception 'RMSE_OUTLIER_FAILED'; end if;
end;
$$;

begin;
select set_config('request.jwt.claim.sub', '49b7a93c-cb76-4eb3-b5af-45e486fccc17', true);
select set_config('request.jwt.claims', '{"sub":"49b7a93c-cb76-4eb3-b5af-45e486fccc17","role":"authenticated"}', true);

create temporary table step7_test_run (forecast_run_id uuid) on commit drop;
insert into core.forecast_run (data_snapshot_at, status, stale, forecast_setting_key, triggered_by, train_start, train_end)
values (now(), 'READY', false, 'DEFAULT', '49b7a93c-cb76-4eb3-b5af-45e486fccc17', '2025-03-03', '2026-05-04');
insert into step7_test_run
select forecast_run_id from core.forecast_run
where triggered_by = '49b7a93c-cb76-4eb3-b5af-45e486fccc17'
order by created_at desc limit 1;

-- 실제 검증 Actual을 날짜별로 합산한 synthetic Forecast Result입니다.
with actual_daily as (
  select item_id, use_date, sum(qty)::numeric as qty
    from core.v_test_actual
   where item_id = 'ITEM001'
   group by item_id, use_date
)
insert into core.forecast_result (
  forecast_run_id, model_id, model_version, item_id, forecast_date,
  forecast_value, p50, p80, p90, prediction_lower, prediction_upper
)
select r.forecast_run_id, m.model_id, m.model_version, a.item_id, a.use_date,
       case m.model_id
         when 'NAIVE' then a.qty
         when 'MOVING_AVERAGE' then a.qty - 1
         else a.qty + 10
       end,
       a.qty, a.qty + 2, a.qty + 4, greatest(a.qty - 5, 0), a.qty + 5
  from step7_test_run as r
  cross join (values
    ('NAIVE'::text, '1.0'::text),
    ('MOVING_AVERAGE'::text, '1.0'::text),
    ('SEASONAL_NAIVE'::text, '1.0'::text)
  ) as m(model_id, model_version)
  cross join actual_daily as a;

create temporary table step7_test_backtest (backtest_run_id uuid) on commit drop;
insert into step7_test_backtest
select core.run_backtest((select forecast_run_id from step7_test_run), 'WAPE');

-- champion_metric 설정에 따른 AUTO rank와 모든 후보 저장을 확인합니다.
do $$
declare
  v_backtest_id uuid := (select backtest_run_id from step7_test_backtest);
  v_count integer;
  v_rank integer;
  v_model text;
  v_reason text;
begin
  select count(*) into v_count from core.model_performance where backtest_run_id = v_backtest_id and item_id = 'ITEM002';
  if v_count <> 3 then raise exception 'ALL_CANDIDATES_NOT_STORED:%', v_count; end if;
  select rank, model_id into v_rank, v_model from core.model_performance where backtest_run_id = v_backtest_id and item_id = 'ITEM001' and model_id = 'NAIVE';
  if v_rank <> 1 or v_model <> 'NAIVE' then raise exception 'AUTO_RANK_FAILED'; end if;
  select reason_code into v_reason from core.champion_selection_log where backtest_run_id = v_backtest_id and item_id = 'ITEM002';
  if v_reason <> 'NO_VALID_CANDIDATE' then raise exception 'NO_CHAMPION_REASON_FAILED'; end if;
  begin
    perform core.set_manual_champion('ITEM001', 'NAIVE', '1.0', ' ', v_backtest_id);
    raise exception 'MANUAL_REASON_REQUIRED_NOT_ENFORCED';
  exception when sqlstate '22023' then null;
  end;
end;
$$;

-- test 기간을 바꾸어도 학습 view가 바뀌지 않아야 합니다.
create temporary table step7_train_snapshot as
select count(*) as row_count,
       md5(coalesce(string_agg(format('%s:%s:%s', usage_id, use_date, coalesce(qty::text, 'NULL')), '|' order by usage_id), '')) as fingerprint
  from core.v_train_demand;
update core.forecast_setting set test_start = test_start + 1 where setting_key = 'DEFAULT';
do $$
declare
  v_before record;
  v_after record;
begin
  select row_count, fingerprint into v_before from step7_train_snapshot;
  select count(*) as row_count,
         md5(coalesce(string_agg(format('%s:%s:%s', usage_id, use_date, coalesce(qty::text, 'NULL')), '|' order by usage_id), '')) as fingerprint
    into v_after from core.v_train_demand;
  if v_before.row_count <> v_after.row_count or v_before.fingerprint <> v_after.fingerprint then
    raise exception 'TRAINING_CHANGED_WHEN_TEST_PERIOD_CHANGED';
  end if;
end;
$$;

select jsonb_build_object(
  'backtest_status', (select status from core.backtest_run where backtest_run_id = (select backtest_run_id from step7_test_backtest)),
  'perfect_wape', (select wape from core.model_performance where backtest_run_id = (select backtest_run_id from step7_test_backtest) and item_id = 'ITEM001' and model_id = 'NAIVE'),
  'over_bias', (select bias from core.model_performance where backtest_run_id = (select backtest_run_id from step7_test_backtest) and item_id = 'ITEM001' and model_id = 'SEASONAL_NAIVE'),
  'under_bias', (select bias from core.model_performance where backtest_run_id = (select backtest_run_id from step7_test_backtest) and item_id = 'ITEM001' and model_id = 'MOVING_AVERAGE'),
  'candidate_count', (select count(*) from core.model_performance where backtest_run_id = (select backtest_run_id from step7_test_backtest) and item_id = 'ITEM002'),
  'auto_champion', (select model_id from core.champion_model where backtest_run_id = (select backtest_run_id from step7_test_backtest) and item_id = 'ITEM001')
) as step7_verification;

rollback;
