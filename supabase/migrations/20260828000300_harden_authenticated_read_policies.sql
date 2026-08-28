-- authenticated 전체 조회 정책도 세션 존재 여부를 명시해 과도한 using(true)를 피합니다.
drop policy if exists leadtime_plan_select_authenticated on core.leadtime_plan;
create policy leadtime_plan_select_authenticated
on core.leadtime_plan for select to authenticated
using ((select auth.uid()) is not null);

drop policy if exists usage_profile_select_authenticated on core.usage_profile;
create policy usage_profile_select_authenticated
on core.usage_profile for select to authenticated
using ((select auth.uid()) is not null);

drop policy if exists supplier_alias_select_authenticated on core.supplier_alias;
create policy supplier_alias_select_authenticated
on core.supplier_alias for select to authenticated
using ((select auth.uid()) is not null);
