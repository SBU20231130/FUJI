-- STEP 8: 별도 Python Forecast Service 연동 계약입니다.
--
-- Python 서비스는 계산만 담당하고, 저장·권한·백테스트 기준은 기존 core 구조를
-- 그대로 사용합니다. 기존 SQL Forecast Run/Result 조회 계약은 유지합니다.

alter table core.forecast_run
  add column if not exists pipeline_type text not null default 'SQL',
  add column if not exists service_name text,
  add column if not exists request_params jsonb not null default '{}'::jsonb,
  add column if not exists error_message text,
  add column if not exists started_at timestamptz,
  add column if not exists completed_at timestamptz;

alter table core.forecast_result
  add column if not exists model_params jsonb not null default '{}'::jsonb;

alter table core.model_config
  add column if not exists supported_demand_types text[] not null
    default array['SMOOTH', 'ERRATIC', 'INTERMITTENT', 'LUMPY']::text[];

do $$
begin
  if exists (
    select 1 from pg_constraint
     where conrelid = 'core.forecast_run'::regclass
       and conname = 'forecast_run_status_ck'
  ) then
    alter table core.forecast_run drop constraint forecast_run_status_ck;
  end if;
  if not exists (
    select 1 from pg_constraint
     where conrelid = 'core.forecast_run'::regclass
       and conname = 'forecast_run_status_ck'
  ) then
    alter table core.forecast_run
      add constraint forecast_run_status_ck
      check (status in ('RUNNING', 'READY', 'STALE', 'FAILED'));
  end if;
  if not exists (
    select 1 from pg_constraint
     where conrelid = 'core.forecast_run'::regclass
       and conname = 'forecast_run_pipeline_type_ck'
  ) then
    alter table core.forecast_run
      add constraint forecast_run_pipeline_type_ck
      check (pipeline_type in ('SQL', 'PYTHON'));
  end if;
end;
$$;

insert into core.model_config (
  model_id, model_version, model_name, description, enabled, is_baseline,
  supported_demand_types
)
values
  ('EXPONENTIAL_SMOOTHING', '1.0', 'Exponential Smoothing', '수준 성분 기반 지수평활 모델', true, false, array['SMOOTH', 'ERRATIC', 'INTERMITTENT', 'LUMPY']),
  ('HOLT', '1.0', 'Holt', '수준과 추세를 분리한 이중 지수평활 모델', true, false, array['SMOOTH', 'ERRATIC']),
  ('HOLT_WINTERS', '1.0', 'Holt-Winters', '수준·추세·계절성을 반영하는 지수평활 모델', true, false, array['SMOOTH', 'ERRATIC']),
  ('SARIMA', '1.0', 'SARIMA', '계절 자기회귀 통합 이동평균 모델', true, false, array['SMOOTH', 'ERRATIC']),
  ('PROPHET', '1.0', 'Prophet', '추세·계절성 기반 Prophet 모델', true, false, array['SMOOTH', 'ERRATIC']),
  ('CROSTON', '1.0', 'Croston', '간헐 수요 전용 Croston 모델', true, false, array['INTERMITTENT', 'LUMPY']),
  ('SBA', '1.0', 'SBA', '간헐 수요 편향을 보정한 SBA 모델', true, false, array['INTERMITTENT', 'LUMPY']),
  ('TSB', '1.0', 'TSB', '간헐 수요 발생 확률을 갱신하는 TSB 모델', true, false, array['INTERMITTENT', 'LUMPY']),
  ('XGBOOST', '1.0', 'XGBoost', '외생 변수 확장이 가능한 XGBoost 모델', true, false, array['SMOOTH', 'ERRATIC']),
  ('LIGHTGBM', '1.0', 'LightGBM', '외생 변수 확장이 가능한 LightGBM 모델', true, false, array['SMOOTH', 'ERRATIC'])
on conflict (model_id, model_version) do update
  set supported_demand_types = excluded.supported_demand_types,
      updated_at = now();

create index if not exists forecast_run_status_pipeline_idx
  on core.forecast_run(status, pipeline_type, created_at desc);

-- Python 서비스가 RUNNING Forecast Run을 만들 수 있는 유일한 일반 테이블 쓰기입니다.
-- triggered_by는 호출한 관리자 본인으로 고정하여 다른 사용자를 가장하지 못하게 합니다.
drop policy if exists forecast_run_admin_insert on core.forecast_run;
create policy forecast_run_admin_insert on core.forecast_run
  for insert to authenticated
  with check (
    (select core.is_admin())
    and (triggered_by is null or triggered_by = (select auth.uid()))
  );

grant insert on core.forecast_run to authenticated;
grant select, insert, update on core.forecast_result to authenticated;

-- 기존 upsert RPC는 관리자 검사를 유지하되 RUNNING 상태에서도 저장할 수 있어야
-- Python 결과가 한 건씩 들어오는 동안에도 동일한 저장 계약을 사용합니다.
create or replace function core.save_forecast_result(
  p_forecast_run_id uuid,
  p_rows jsonb
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row jsonb;
  v_count integer := 0;
  v_run core.forecast_run%rowtype;
begin
  if not (select core.is_admin()) then
    raise exception 'ADMIN_REQUIRED' using errcode = '42501';
  end if;
  if jsonb_typeof(p_rows) <> 'array' then
    raise exception 'RESULT_ROWS_MUST_BE_ARRAY' using errcode = '22023';
  end if;
  select * into v_run
    from core.forecast_run
   where forecast_run_id = p_forecast_run_id
   for update;
  if not found then raise exception 'FORECAST_RUN_NOT_FOUND'; end if;
  if v_run.status not in ('RUNNING', 'READY') or v_run.stale then
    raise exception 'FORECAST_RUN_NOT_READY';
  end if;

  for v_row in select value from jsonb_array_elements(p_rows) loop
    insert into core.forecast_result (
      forecast_run_id, model_id, model_version, item_id, forecast_date,
      forecast_value, p50, p80, p90, prediction_lower, prediction_upper,
      result_reason_code, model_params
    ) values (
      p_forecast_run_id,
      nullif(v_row ->> 'model_id', ''),
      nullif(v_row ->> 'model_version', ''),
      nullif(v_row ->> 'item_id', ''),
      (v_row ->> 'forecast_date')::date,
      nullif(v_row ->> 'forecast_value', '')::numeric,
      nullif(v_row ->> 'p50', '')::numeric,
      nullif(v_row ->> 'p80', '')::numeric,
      nullif(v_row ->> 'p90', '')::numeric,
      nullif(v_row ->> 'prediction_lower', '')::numeric,
      nullif(v_row ->> 'prediction_upper', '')::numeric,
      nullif(v_row ->> 'result_reason_code', ''),
      case when jsonb_typeof(v_row -> 'model_params') = 'object'
        then v_row -> 'model_params' else '{}'::jsonb end
    )
    on conflict (forecast_run_id, model_id, model_version, item_id, forecast_date) do update
      set forecast_value = excluded.forecast_value,
          p50 = excluded.p50,
          p80 = excluded.p80,
          p90 = excluded.p90,
          prediction_lower = excluded.prediction_lower,
          prediction_upper = excluded.prediction_upper,
          result_reason_code = excluded.result_reason_code,
          model_params = excluded.model_params,
          updated_at = now();
    v_count := v_count + 1;
  end loop;

  update core.forecast_run
     set status = 'READY',
         service_name = coalesce(service_name, 'python-forecast'),
         completed_at = coalesce(completed_at, now()),
         updated_at = now()
   where forecast_run_id = p_forecast_run_id
     and status = 'RUNNING';
  return v_count;
end;
$$;

revoke all on function core.save_forecast_result(uuid, jsonb) from public;
grant execute on function core.save_forecast_result(uuid, jsonb) to authenticated;

drop view if exists analytics.v_forecast_runs;
create view analytics.v_forecast_runs with (security_invoker = true) as
select r.forecast_run_id, r.forecast_setting_key, r.data_snapshot_at, r.status, r.stale,
       r.stale_reason, r.stale_at, r.triggered_by, r.train_start, r.train_end,
       r.pipeline_type, r.service_name, r.request_params, r.error_message,
       r.started_at, r.completed_at, r.created_at, r.updated_at
  from core.forecast_run as r;

drop view if exists analytics.v_model_config;
create view analytics.v_model_config with (security_invoker = true) as
select model_id, model_version, model_name, description, enabled, is_baseline,
       supported_demand_types, created_at, updated_at
  from core.model_config;

drop view if exists analytics.v_forecast_result;
create view analytics.v_forecast_result with (security_invoker = true) as
select forecast_run_id as run_id,
       forecast_run_id,
       model_id,
       model_version,
       item_id,
       forecast_date as period,
       forecast_date,
       forecast_value as predicted_qty,
       forecast_value,
       p50,
       p80,
       p90,
       prediction_lower,
       prediction_upper,
       result_reason_code,
       model_params,
       created_at,
       updated_at
  from core.forecast_result;

revoke all on analytics.v_forecast_result from anon;
grant select on analytics.v_forecast_result to authenticated;
grant select on analytics.v_forecast_runs, analytics.v_model_config to authenticated;

notify pgrst, 'reload schema';
