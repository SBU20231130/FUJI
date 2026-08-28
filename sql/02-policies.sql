-- STEP 2 이후 RLS 기준
--
-- 기존의 "수업용 전체 허용" using(true) 정책과 anon 쓰기 권한은 제거합니다.
-- 관리자 여부는 클라이언트가 아니라 core.is_admin()이 DB에서 판정합니다.

revoke all on schema core from anon;
revoke all on core.leadtime_plan, core.usage_profile, core.supplier_alias, core.app_user, core.audit_log from anon;
revoke all on schema raw from anon, authenticated;
revoke all on all tables in schema raw from anon, authenticated;

grant select on core.leadtime_plan, core.usage_profile, core.supplier_alias to authenticated;
grant insert, update, delete on core.leadtime_plan, core.usage_profile, core.supplier_alias to authenticated;
grant select, insert, update, delete on core.policy_config, core.outlier_rule, core.item_policy, core.forecast_setting to authenticated;
grant select on core.v_train_demand, core.v_test_actual to authenticated;
grant select on analytics.v_data_coverage, analytics.v_forecast_settings to authenticated;

alter table core.leadtime_plan enable row level security;
alter table core.usage_profile enable row level security;
alter table core.supplier_alias enable row level security;

drop policy if exists "수업용 전체 허용" on core.leadtime_plan;
drop policy if exists "수업용 전체 허용" on core.usage_profile;

drop policy if exists leadtime_plan_select_authenticated on core.leadtime_plan;
create policy leadtime_plan_select_authenticated
  on core.leadtime_plan for select to authenticated using ((select auth.uid()) is not null);
drop policy if exists leadtime_plan_admin_mutation on core.leadtime_plan;
drop policy if exists leadtime_plan_admin_insert on core.leadtime_plan;
create policy leadtime_plan_admin_insert on core.leadtime_plan for insert to authenticated with check ((select core.is_admin()));
drop policy if exists leadtime_plan_admin_update on core.leadtime_plan;
create policy leadtime_plan_admin_update on core.leadtime_plan for update to authenticated using ((select core.is_admin())) with check ((select core.is_admin()));
drop policy if exists leadtime_plan_admin_delete on core.leadtime_plan;
create policy leadtime_plan_admin_delete on core.leadtime_plan for delete to authenticated using ((select core.is_admin()));

drop policy if exists usage_profile_select_authenticated on core.usage_profile;
create policy usage_profile_select_authenticated
  on core.usage_profile for select to authenticated using ((select auth.uid()) is not null);
drop policy if exists usage_profile_admin_mutation on core.usage_profile;
drop policy if exists usage_profile_admin_insert on core.usage_profile;
create policy usage_profile_admin_insert on core.usage_profile for insert to authenticated with check ((select core.is_admin()));
drop policy if exists usage_profile_admin_update on core.usage_profile;
create policy usage_profile_admin_update on core.usage_profile for update to authenticated using ((select core.is_admin())) with check ((select core.is_admin()));
drop policy if exists usage_profile_admin_delete on core.usage_profile;
create policy usage_profile_admin_delete on core.usage_profile for delete to authenticated using ((select core.is_admin()));

drop policy if exists supplier_alias_select_authenticated on core.supplier_alias;
create policy supplier_alias_select_authenticated
  on core.supplier_alias for select to authenticated using ((select auth.uid()) is not null);
drop policy if exists supplier_alias_admin_mutation on core.supplier_alias;
drop policy if exists supplier_alias_admin_insert on core.supplier_alias;
create policy supplier_alias_admin_insert on core.supplier_alias for insert to authenticated with check ((select core.is_admin()));
drop policy if exists supplier_alias_admin_update on core.supplier_alias;
create policy supplier_alias_admin_update on core.supplier_alias for update to authenticated using ((select core.is_admin())) with check ((select core.is_admin()));
drop policy if exists supplier_alias_admin_delete on core.supplier_alias;
create policy supplier_alias_admin_delete on core.supplier_alias for delete to authenticated using ((select core.is_admin()));

alter table core.policy_config enable row level security;
alter table core.outlier_rule enable row level security;
alter table core.item_policy enable row level security;
alter table core.forecast_setting enable row level security;

drop policy if exists policy_config_select_authenticated on core.policy_config;
create policy policy_config_select_authenticated on core.policy_config for select to authenticated using ((select auth.uid()) is not null);
drop policy if exists policy_config_admin_insert on core.policy_config;
create policy policy_config_admin_insert on core.policy_config for insert to authenticated with check ((select core.is_admin()));
drop policy if exists policy_config_admin_update on core.policy_config;
create policy policy_config_admin_update on core.policy_config for update to authenticated using ((select core.is_admin())) with check ((select core.is_admin()));
drop policy if exists policy_config_admin_delete on core.policy_config;
create policy policy_config_admin_delete on core.policy_config for delete to authenticated using ((select core.is_admin()));

drop policy if exists outlier_rule_select_authenticated on core.outlier_rule;
create policy outlier_rule_select_authenticated on core.outlier_rule for select to authenticated using ((select auth.uid()) is not null);
drop policy if exists outlier_rule_admin_insert on core.outlier_rule;
create policy outlier_rule_admin_insert on core.outlier_rule for insert to authenticated with check ((select core.is_admin()));
drop policy if exists outlier_rule_admin_update on core.outlier_rule;
create policy outlier_rule_admin_update on core.outlier_rule for update to authenticated using ((select core.is_admin())) with check ((select core.is_admin()));
drop policy if exists outlier_rule_admin_delete on core.outlier_rule;
create policy outlier_rule_admin_delete on core.outlier_rule for delete to authenticated using ((select core.is_admin()));

drop policy if exists item_policy_select_authenticated on core.item_policy;
create policy item_policy_select_authenticated on core.item_policy for select to authenticated using ((select auth.uid()) is not null);
drop policy if exists item_policy_admin_insert on core.item_policy;
create policy item_policy_admin_insert on core.item_policy for insert to authenticated with check ((select core.is_admin()));
drop policy if exists item_policy_admin_update on core.item_policy;
create policy item_policy_admin_update on core.item_policy for update to authenticated using ((select core.is_admin())) with check ((select core.is_admin()));
drop policy if exists item_policy_admin_delete on core.item_policy;
create policy item_policy_admin_delete on core.item_policy for delete to authenticated using ((select core.is_admin()));

drop policy if exists forecast_setting_select_authenticated on core.forecast_setting;
create policy forecast_setting_select_authenticated on core.forecast_setting for select to authenticated using ((select auth.uid()) is not null);
drop policy if exists forecast_setting_admin_insert on core.forecast_setting;
create policy forecast_setting_admin_insert on core.forecast_setting for insert to authenticated with check ((select core.is_admin()));
drop policy if exists forecast_setting_admin_update on core.forecast_setting;
create policy forecast_setting_admin_update on core.forecast_setting for update to authenticated using ((select core.is_admin())) with check ((select core.is_admin()));
drop policy if exists forecast_setting_admin_delete on core.forecast_setting;
create policy forecast_setting_admin_delete on core.forecast_setting for delete to authenticated using ((select core.is_admin()));

select schemaname, tablename, policyname, roles, cmd, qual, with_check
  from pg_policies
 where schemaname = 'core'
   and tablename in ('leadtime_plan', 'usage_profile', 'supplier_alias', 'app_user', 'audit_log', 'policy_config', 'outlier_rule', 'item_policy', 'forecast_setting');
