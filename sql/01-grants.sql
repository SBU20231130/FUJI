-- STEP 2 이후 권한 기준
--
-- 실제 적용은 supabase/migrations/20260828000100_add_auth_rbac_audit.sql을
-- 먼저 실행합니다. 이 파일은 SQL Editor에서 현재 권한을 점검할 때 사용합니다.
-- anon에는 업무 데이터 권한을 주지 않습니다.

grant usage on schema core, analytics to authenticated;
revoke all on schema core, analytics from anon;

-- raw는 파일/API 적재 전용이므로 Data API의 직접 조회·수정 대상이 아닙니다.
revoke all on schema raw from anon, authenticated;
revoke all on all tables in schema raw from anon, authenticated;

revoke all on all tables in schema core from anon;
revoke all on all tables in schema analytics from anon;
grant select on all tables in schema core to authenticated;
grant select on all tables in schema analytics to authenticated;
grant insert, update, delete on core.policy_config, core.outlier_rule, core.item_policy, core.forecast_setting to authenticated;
grant select on core.v_train_demand, core.v_test_actual to authenticated;
grant select on analytics.v_data_coverage, analytics.v_forecast_settings to authenticated;

revoke all on function public.get_leadtime_gap() from public;
grant execute on function public.get_leadtime_gap() to authenticated;

select has_schema_privilege('anon', 'core', 'usage') as anon_core_schema_ok,
       has_schema_privilege('anon', 'analytics', 'usage') as anon_analytics_schema_ok,
       has_schema_privilege('anon', 'raw', 'usage') as anon_raw_schema_ok,
       has_schema_privilege('authenticated', 'raw', 'usage') as authenticated_raw_schema_ok,
       has_schema_privilege('authenticated', 'analytics', 'usage') as authenticated_analytics_schema_ok;
