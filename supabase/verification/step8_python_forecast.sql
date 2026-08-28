-- STEP 8 DB 계약 검증입니다. 테스트 행은 마지막에 ROLLBACK 됩니다.

begin;
select set_config('request.jwt.claim.sub', '49b7a93c-cb76-4eb3-b5af-45e486fccc17', true);
select set_config('request.jwt.claims', '{"sub":"49b7a93c-cb76-4eb3-b5af-45e486fccc17","role":"authenticated"}', true);

create temporary table step8_test_run (forecast_run_id uuid) on commit drop;
do $$
declare
  v_run_id uuid;
begin
  insert into core.forecast_run (
    data_snapshot_at, status, stale, forecast_setting_key, triggered_by,
    train_start, train_end, pipeline_type, service_name, request_params, started_at
  ) values (
    now(), 'RUNNING', false, 'DEFAULT', '49b7a93c-cb76-4eb3-b5af-45e486fccc17',
    '2025-03-03', '2026-05-04', 'PYTHON', 'python-forecast', '{"horizon": 7}', now()
  ) returning forecast_run_id into v_run_id;
  insert into step8_test_run values (v_run_id);
end;
$$;

select core.save_forecast_result(
  (select forecast_run_id from step8_test_run),
  jsonb_build_array(jsonb_build_object(
    'model_id', 'CROSTON',
    'model_version', '1.0',
    'item_id', 'ITEM001',
    'forecast_date', '2026-08-22',
    'forecast_value', 12.5,
    'p50', 12.5,
    'p80', 15.0,
    'p90', 17.0,
    'prediction_lower', 10.0,
    'prediction_upper', 17.0,
    'model_params', jsonb_build_object('alpha', 0.1, 'demand_type', 'INTERMITTENT')
  ))
) as saved_rows;

do $$
declare
  v_run record;
  v_result record;
begin
  select status, pipeline_type, service_name into v_run
    from core.forecast_run where forecast_run_id = (select forecast_run_id from step8_test_run);
  if v_run.status <> 'READY' or v_run.pipeline_type <> 'PYTHON' or v_run.service_name <> 'python-forecast' then
    raise exception 'PYTHON_RUN_NOT_READY';
  end if;
  select predicted_qty, model_version, model_params into v_result
    from analytics.v_forecast_result
   where run_id = (select forecast_run_id from step8_test_run);
  if v_result.predicted_qty <> 12.5 or v_result.model_version <> '1.0' or v_result.model_params ->> 'demand_type' <> 'INTERMITTENT' then
    raise exception 'FORECAST_RESULT_CONTRACT_FAILED';
  end if;
end;
$$;

select jsonb_build_object(
  'run_status', (select status from core.forecast_run where forecast_run_id = (select forecast_run_id from step8_test_run)),
  'pipeline_type', (select pipeline_type from core.forecast_run where forecast_run_id = (select forecast_run_id from step8_test_run)),
  'python_models', (select count(*) from core.model_config where model_id in ('EXPONENTIAL_SMOOTHING', 'HOLT', 'HOLT_WINTERS', 'SARIMA', 'PROPHET', 'CROSTON', 'SBA', 'TSB', 'XGBOOST', 'LIGHTGBM')),
  'intermittent_models', (select count(*) from core.model_config where supported_demand_types @> array['INTERMITTENT']::text[])
) as step8_verification;

rollback;
