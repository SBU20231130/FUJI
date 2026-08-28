-- STEP 3 학습·검증 격리 확인용 SQL

select * from analytics.v_data_coverage;

select
  (select count(*) from core.v_train_demand) as train_rows,
  (select count(*) from core.v_test_actual) as test_rows,
  (
    select count(*)
    from core.v_train_demand t
    cross join core.forecast_setting f
    where f.setting_key = 'DEFAULT'
      and t.use_date between f.test_start and f.test_end
  ) as train_rows_in_test_window,
  (
    select count(*)
    from core.v_test_actual t
    cross join core.forecast_setting f
    where f.setting_key = 'DEFAULT'
      and not (t.use_date between f.test_start and f.test_end)
  ) as test_rows_outside_test_window;

select
  (select count(*) from core.policy_config) as policy_config_rows,
  (select count(*) from core.outlier_rule) as outlier_rule_rows,
  (select count(*) from core.item_policy) as item_policy_rows;
