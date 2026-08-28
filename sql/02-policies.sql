-- STEP 2 이후 RLS 기준
--
-- 기존의 "수업용 전체 허용" using(true) 정책과 anon 쓰기 권한은 제거합니다.
-- 관리자 여부는 클라이언트가 아니라 core.is_admin()이 DB에서 판정합니다.

revoke all on schema core from anon;
revoke all on core.leadtime_plan, core.usage_profile, core.supplier_alias, core.app_user, core.audit_log from anon;

grant select on core.leadtime_plan, core.usage_profile, core.supplier_alias to authenticated;
grant insert, update, delete on core.leadtime_plan, core.usage_profile, core.supplier_alias to authenticated;

alter table core.leadtime_plan enable row level security;
alter table core.usage_profile enable row level security;
alter table core.supplier_alias enable row level security;

drop policy if exists "수업용 전체 허용" on core.leadtime_plan;
drop policy if exists "수업용 전체 허용" on core.usage_profile;

drop policy if exists leadtime_plan_select_authenticated on core.leadtime_plan;
create policy leadtime_plan_select_authenticated
  on core.leadtime_plan for select to authenticated using ((select auth.uid()) is not null);
drop policy if exists leadtime_plan_admin_mutation on core.leadtime_plan;
create policy leadtime_plan_admin_mutation
  on core.leadtime_plan for all to authenticated
  using ((select core.is_admin()))
  with check ((select core.is_admin()));

drop policy if exists usage_profile_select_authenticated on core.usage_profile;
create policy usage_profile_select_authenticated
  on core.usage_profile for select to authenticated using ((select auth.uid()) is not null);
drop policy if exists usage_profile_admin_mutation on core.usage_profile;
create policy usage_profile_admin_mutation
  on core.usage_profile for all to authenticated
  using ((select core.is_admin()))
  with check ((select core.is_admin()));

drop policy if exists supplier_alias_select_authenticated on core.supplier_alias;
create policy supplier_alias_select_authenticated
  on core.supplier_alias for select to authenticated using ((select auth.uid()) is not null);
drop policy if exists supplier_alias_admin_mutation on core.supplier_alias;
create policy supplier_alias_admin_mutation
  on core.supplier_alias for all to authenticated
  using ((select core.is_admin()))
  with check ((select core.is_admin()));

select schemaname, tablename, policyname, roles, cmd, qual, with_check
  from pg_policies
 where schemaname = 'core'
   and tablename in ('leadtime_plan', 'usage_profile', 'supplier_alias', 'app_user', 'audit_log');
