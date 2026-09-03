# 4회차 기준 데이터 이관 준비

## 결론

이번 이관의 원본은 3회차 CSV가 아니라 **4회차 기준 데이터**다. 저장소의
`dump.sql`에 들어 있는 데이터 INSERT 구문은 전달받은 자료의
`4회차/실습데이터/02_data_1.sql`부터 `02_data_4.sql`까지와 내용이 완전히 같다.

`dump.sql` 전체나 `01_schema.sql`을 현재 Supabase에 실행하면 안 된다. 두 파일에는
기존 스키마를 삭제하고 다시 만드는 구문이 있으므로, 현재 마이그레이션과 STEP 2~5
구조를 훼손한다. 이관 시에는 검증된 데이터 INSERT 부분만 새로운 비파괴 seed
마이그레이션으로 분리한다. 실제 원격 DB에는 데이터가 이미 있었으므로 INSERT는 실행하지
않고 provenance 보강 migration만 적용했다.

## 기준 원본과 적재 대상

| 대상 | 원본 | 기대 행 수 | 비고 |
|---|---|---:|---|
| `core.supplier_alias` | 4회차 SQL / `dump.sql` | 36 | 공급처 표기 정규화 기준 |
| `raw.supplier_master` | 4회차 SQL | 13 | 12개 생산법인과 중복 등록 1건을 보존 |
| `raw.item_master` | 4회차 SQL | 23 | 표기 오염·단종 행도 원본 그대로 보존 |
| `raw.inventory` | 4회차 SQL | 43 | 창고별 재고 원본 |
| `raw.purchase_order` | 4회차 SQL | 92 | Open PO 분석 입력 |
| `raw.goods_receipt` | 4회차 SQL | 81 | 입고 실적 원본 |
| `raw.forecast` | 4회차 SQL | 13 | 3회차 수요 입력의 연속성 보존 |
| `raw.shipment_log` | 4회차 SQL | 2,864 | 리드타임 분석의 기준 원본 |
| `raw.usage_history` | 4회차 SQL | 7,038 | Demand Profile·Forecast 학습/검증의 기준 원본 |

이 데이터 집합의 확인용 SHA-256은
`e88d2ea46df40b3d2202c9849210536795908f45fc2c94238f3841b0db4626c4`이다.
이는 압축 파일의 58개 INSERT 문과 현재 `dump.sql`의 58개 INSERT 문이 동일함을
확인한 값이다.

## 3회차 CSV의 위치

3회차 CSV는 데이터 통합 실습을 위한 이전·축소 데이터다. 예를 들어 공급처 10건,
재고 31건인 반면 4회차 기준 데이터는 공급처 13건, 재고 43건이며, 4회차에만
`shipment_log` 2,864건과 `usage_history` 7,038건이 있다.

따라서 3회차 CSV는 파일 업로드 기능의 테스트 샘플로만 보관한다. 초기 운영 데이터로
3회차 CSV와 4회차 SQL을 함께 적재하면 같은 업무 데이터가 중복되고 분석 결과가
왜곡된다.

## 현재 구조와 이관 방식

현재 `supabase/migrations`는 STEP 3에서 모든 기존 raw 입력 테이블에
`batch_id`, `source_type`, `loaded_at`, `source_record_id`를 추가했고, STEP 4에서
향후 CSV/Excel 업로드용 staging·검증·rollback 파이프라인을 만들었다.

초기 기준 데이터는 파일 업로드 화면으로 넣지 않는다.

- 현재 Import Pipeline의 허용 대상에는 `shipment_log`와 `forecast`가 없다.
- 이 두 테이블은 리드타임·Forecast 분석의 필수 기준 데이터다.
- 따라서 초기 4회차 데이터는 DB migration으로 한 번만 seed하고, 이후 월별 변경분은
  Import Pipeline을 통해 검증·승인 후 적재한다.

적용한 `20260828045112_backfill_legacy_4th_provenance` migration은 각 raw 행에
`source_type = 'LEGACY_4TH_SQL'`, 실행 시 생성한 하나의 `batch_id`, 안정적인
`source_record_id`, `loaded_at`을 기록했다. 기존 업무 컬럼은 변환하거나 정제하지
않았다. 정제와 계산은 기존처럼 `core` view와 `analytics` view가 담당한다.

## 실행 순서

1. SQL Editor에서 `sql/04-legacy-data-preflight.sql`을 읽기 전용으로 실행했다.
2. 모든 대상이 `BASELINE_PRESENT`였으므로 데이터 INSERT를 생략했다.
3. `20260828045112_backfill_legacy_4th_provenance`를 원격에 적용해 10,167개
   raw 행의 추적 메타데이터만 보강했다.
4. 원본 건수, source ID 유일성, 분석 뷰 건수를 재조회해 대사했다.
5. 앞으로 새 seed를 만들 때도 `DROP SCHEMA`, `TRUNCATE`, 기존 데이터 삭제를
   사용하지 않는다. `OTHER` 상태에서는 수동 정리·백업 합의 전 작업을 중단한다.

## 완료 검증

- 원본 건수: 2,864 운송 로그, 7,038 사용 이력, 43 재고, 23 품목, 13 공급처,
  92 발주, 81 입고, 13 forecast, 36 공급처 별칭.
- provenance: raw 8개 테이블 10,167행이 `LEGACY_4TH_SQL` 한 배치로 기록됐고,
  source ID NULL 0건·중복 0건이다.
- 접근 제어: `raw` 스키마는 `anon`·`authenticated` 모두 schema usage가 없고,
  `analytics`는 `authenticated`만 schema usage가 있다. 원본을 Data API에 공개하지
  않는 현재 접근면을 유지했다.
- 기준값 테이블: `core.leadtime_plan`, `core.usage_profile`은 초기 seed에서 비워 둔다.
- 분석 확인: `analytics.v_stockout_risk` 20행, `analytics.v_usage_profile` 19행,
  `analytics.v_usage_anomaly` 39행이 기준값이다.
- Forecast 확인: 학습·검증 기간이 `core.forecast_setting`과 일치하고, Demand Profile이
  `core.v_train_demand`만 읽는지 확인한다.

## 주의할 점

- 4회차 워크시트의 anon 공개 권한 안내는 수업용 설정이다. 현재 프로젝트는
  authenticated/ADMIN 정책을 적용했으므로, 비로그인 REST 조회가 거부되는 것은
  정상이다.
- 실제 데이터 INSERT는 실행하지 않았다. 사전점검 결과가 `BASELINE_PRESENT`였기
  때문에 중복을 피하고 메타데이터만 보강했다.
- 현재 raw 데이터가 이미 존재한다면 원본을 덮어쓰지 않는다. 이 경우에는 별도의
  백업·대사·cutover 결정을 먼저 한다.
