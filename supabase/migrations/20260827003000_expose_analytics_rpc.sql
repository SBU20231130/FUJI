-- Data API에서 analytics 스키마를 직접 노출하지 않아도
-- 화면이 필요한 분석 뷰만 읽을 수 있도록 public RPC를 제공합니다.
-- 원천 raw 테이블은 public에 노출하지 않습니다.

create or replace function public.get_leadtime_gap()
returns setof analytics.v_leadtime_gap
language sql
stable
security invoker
as $$
  select *
    from analytics.v_leadtime_gap;
$$;

revoke all on function public.get_leadtime_gap() from public;
grant execute on function public.get_leadtime_gap() to anon, authenticated;
