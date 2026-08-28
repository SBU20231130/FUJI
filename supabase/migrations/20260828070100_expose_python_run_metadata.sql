-- STEP 8 보완: Backtest 이력에서도 SQL/PYTHON 실행 구분과 실패 사유를 보여줍니다.

drop view if exists analytics.v_backtest_runs;
create view analytics.v_backtest_runs with (security_invoker = true) as
select b.backtest_run_id, b.forecast_run_id, b.test_start, b.test_end, b.metric,
       b.status, b.triggered_by, b.started_at, b.completed_at, b.error_code,
       b.created_at, b.updated_at, r.data_snapshot_at, r.stale, r.status as forecast_status,
       r.pipeline_type, r.service_name, r.error_message as forecast_error_message
  from core.backtest_run as b
  join core.forecast_run as r on r.forecast_run_id = b.forecast_run_id;

revoke all on analytics.v_backtest_runs from anon;
grant select on analytics.v_backtest_runs to authenticated;
notify pgrst, 'reload schema';
