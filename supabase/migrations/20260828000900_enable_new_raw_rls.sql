-- 신규 raw 입력 테이블은 service_role 적재 외의 직접 접근을 기본 거부합니다.
alter table raw.business_event enable row level security;
alter table raw.sales_order enable row level security;
alter table raw.item_substitute enable row level security;
