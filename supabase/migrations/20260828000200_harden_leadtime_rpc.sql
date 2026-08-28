-- 기존 분석 RPC의 search_path를 고정합니다.
-- 계산식과 반환 데이터는 변경하지 않고, 함수 호출 시 객체 가로채기만 방지합니다.
create or replace function public.get_leadtime_gap()
returns setof analytics.v_leadtime_gap
language sql
stable
security invoker
set search_path = ''
as $$
  select *
    from analytics.v_leadtime_gap;
$$;

revoke all on function public.get_leadtime_gap() from public;
grant execute on function public.get_leadtime_gap() to authenticated;
