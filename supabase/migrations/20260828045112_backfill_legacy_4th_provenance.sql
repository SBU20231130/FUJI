-- 4회차 SQL로 이미 적재된 기준 데이터의 provenance만 보강합니다.
-- 업무 원본 컬럼은 변경하지 않으며, 모든 조건이 NULL인 레거시 행만 대상으로 합니다.

do $migration$
declare
  v_batch_id uuid := gen_random_uuid();
  v_loaded_at timestamptz := clock_timestamp();
begin
  update raw.supplier_master
     set batch_id = v_batch_id,
         source_type = 'LEGACY_4TH_SQL',
         loaded_at = v_loaded_at,
         source_record_id = 'legacy-4th:supplier_master:' || coalesce("공급업체코드", '')
   where batch_id is null and source_type is null
     and loaded_at is null and source_record_id is null;

  update raw.item_master
     set batch_id = v_batch_id,
         source_type = 'LEGACY_4TH_SQL',
         loaded_at = v_loaded_at,
         source_record_id = 'legacy-4th:item_master:' || coalesce("품목코드", '')
   where batch_id is null and source_type is null
     and loaded_at is null and source_record_id is null;

  update raw.inventory
     set batch_id = v_batch_id,
         source_type = 'LEGACY_4TH_SQL',
         loaded_at = v_loaded_at,
         source_record_id = 'legacy-4th:inventory:' || coalesce("품목코드", '') || ':'
           || coalesce("창고", '') || ':' || coalesce("기준일자", '')
   where batch_id is null and source_type is null
     and loaded_at is null and source_record_id is null;

  update raw.purchase_order
     set batch_id = v_batch_id,
         source_type = 'LEGACY_4TH_SQL',
         loaded_at = v_loaded_at
   where batch_id is null and source_type is null
     and loaded_at is null and source_record_id is null;

  with ranked as (
    select ctid, "발주번호" as po_number,
      row_number() over (
        partition by "발주번호"
        order by "품목코드", "발주수량", "단가", "납기예정일", "발주담당", ctid
      ) as line_number
    from raw.purchase_order
    where batch_id = v_batch_id
      and source_type = 'LEGACY_4TH_SQL'
      and loaded_at = v_loaded_at
      and source_record_id is null
  )
  update raw.purchase_order as p
     set source_record_id = 'legacy-4th:purchase_order:'
       || coalesce(r.po_number, '') || ':' || lpad(r.line_number::text, 3, '0')
    from ranked as r
   where p.ctid = r.ctid;

  update raw.goods_receipt
     set batch_id = v_batch_id,
         source_type = 'LEGACY_4TH_SQL',
         loaded_at = v_loaded_at,
         source_record_id = 'legacy-4th:goods_receipt:' || coalesce("입고번호", '')
   where batch_id is null and source_type is null
     and loaded_at is null and source_record_id is null;

  update raw.forecast
     set batch_id = v_batch_id,
         source_type = 'LEGACY_4TH_SQL',
         loaded_at = v_loaded_at,
         source_record_id = 'legacy-4th:forecast:' || coalesce("품목코드", '')
   where batch_id is null and source_type is null
     and loaded_at is null and source_record_id is null;

  update raw.shipment_log
     set batch_id = v_batch_id,
         source_type = 'LEGACY_4TH_SQL',
         loaded_at = v_loaded_at,
         source_record_id = 'legacy-4th:shipment_log:' || coalesce(shipment_id, '')
   where batch_id is null and source_type is null
     and loaded_at is null and source_record_id is null;

  update raw.usage_history
     set batch_id = v_batch_id,
         source_type = 'LEGACY_4TH_SQL',
         loaded_at = v_loaded_at,
         source_record_id = 'legacy-4th:usage_history:' || coalesce(usage_id, '')
   where batch_id is null and source_type is null
     and loaded_at is null and source_record_id is null;
end;
$migration$;
