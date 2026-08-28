-- SELECT 정책과 관리자 mutation 정책을 분리해 permissive policy 중복을 줄입니다.
-- 권한 의미는 STEP 2와 동일하게 유지합니다.

drop policy if exists leadtime_plan_admin_mutation on core.leadtime_plan;
drop policy if exists usage_profile_admin_mutation on core.usage_profile;
drop policy if exists supplier_alias_admin_mutation on core.supplier_alias;
drop policy if exists policy_config_admin_mutation on core.policy_config;
drop policy if exists outlier_rule_admin_mutation on core.outlier_rule;
drop policy if exists item_policy_admin_mutation on core.item_policy;
drop policy if exists forecast_setting_admin_mutation on core.forecast_setting;

create policy leadtime_plan_admin_insert on core.leadtime_plan
for insert to authenticated
with check ((select core.is_admin()));
create policy leadtime_plan_admin_update on core.leadtime_plan
for update to authenticated
using ((select core.is_admin()))
with check ((select core.is_admin()));
create policy leadtime_plan_admin_delete on core.leadtime_plan
for delete to authenticated
using ((select core.is_admin()));

create policy usage_profile_admin_insert on core.usage_profile
for insert to authenticated
with check ((select core.is_admin()));
create policy usage_profile_admin_update on core.usage_profile
for update to authenticated
using ((select core.is_admin()))
with check ((select core.is_admin()));
create policy usage_profile_admin_delete on core.usage_profile
for delete to authenticated
using ((select core.is_admin()));

create policy supplier_alias_admin_insert on core.supplier_alias
for insert to authenticated
with check ((select core.is_admin()));
create policy supplier_alias_admin_update on core.supplier_alias
for update to authenticated
using ((select core.is_admin()))
with check ((select core.is_admin()));
create policy supplier_alias_admin_delete on core.supplier_alias
for delete to authenticated
using ((select core.is_admin()));

create policy policy_config_admin_insert on core.policy_config
for insert to authenticated
with check ((select core.is_admin()));
create policy policy_config_admin_update on core.policy_config
for update to authenticated
using ((select core.is_admin()))
with check ((select core.is_admin()));
create policy policy_config_admin_delete on core.policy_config
for delete to authenticated
using ((select core.is_admin()));

create policy outlier_rule_admin_insert on core.outlier_rule
for insert to authenticated
with check ((select core.is_admin()));
create policy outlier_rule_admin_update on core.outlier_rule
for update to authenticated
using ((select core.is_admin()))
with check ((select core.is_admin()));
create policy outlier_rule_admin_delete on core.outlier_rule
for delete to authenticated
using ((select core.is_admin()));

create policy item_policy_admin_insert on core.item_policy
for insert to authenticated
with check ((select core.is_admin()));
create policy item_policy_admin_update on core.item_policy
for update to authenticated
using ((select core.is_admin()))
with check ((select core.is_admin()));
create policy item_policy_admin_delete on core.item_policy
for delete to authenticated
using ((select core.is_admin()));

create policy forecast_setting_admin_insert on core.forecast_setting
for insert to authenticated
with check ((select core.is_admin()));
create policy forecast_setting_admin_update on core.forecast_setting
for update to authenticated
using ((select core.is_admin()))
with check ((select core.is_admin()));
create policy forecast_setting_admin_delete on core.forecast_setting
for delete to authenticated
using ((select core.is_admin()));

notify pgrst, 'reload schema';
