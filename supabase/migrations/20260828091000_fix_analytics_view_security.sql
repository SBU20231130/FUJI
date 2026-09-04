-- analytics 화면은 authenticated에게 analytics view만 노출하고 raw 원천 테이블은 노출하지 않습니다.
-- security_invoker view는 호출자에게 raw 하위 테이블 권한을 요구하므로,
-- postgres 소유의 읽기 전용 analytics view를 통해 원천 접근을 캡슐화합니다.

alter view analytics.v_inventory_projection set (security_invoker = false);
alter view analytics.v_stockout_risk set (security_invoker = false);
alter view core.v_service_level_effective set (security_invoker = false);
alter view core.v_forecast_error_sigma set (security_invoker = false);
alter view analytics.v_safety_stock set (security_invoker = false);
alter view analytics.v_purchase_recommendation set (security_invoker = false);

notify pgrst, 'reload schema';
