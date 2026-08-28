# 배포 전 확인

이 폴더를 superSCM 저장소에 복사하고 push 하면, 참가자가 목요일 아침에 `git pull` 로 받습니다.

## 복사

```bash
cd ~/superSCM
cp -r <이_폴더>/AGENTS.md <이_폴더>/SCHEMA.md .
cp -r <이_폴더>/lib/* lib/
cp -r <이_폴더>/components/analysis/* components/analysis/
cp -r <이_폴더>/docs/* docs/
cp -r <이_폴더>/sql/* sql/
mkdir -p app/analysis/leadtime
cp <이_폴더>/app/analysis/leadtime/page.tsx app/analysis/leadtime/
```

`globals.css.추가분.txt` 의 내용을 `app/globals.css` **맨 끝에** 붙여넣습니다.

> `lib/supabase/env.ts` `client.ts` `server.ts` 가 저장소에 이미 있으면 **덮어쓰지 마세요.**
> 다만 `env.ts` 가 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` 를 읽는지는 확인하세요.

## ★ 정답이 섞여 있지 않은지 확인

이 세 가지가 **없어야** 참가자 실습이 성립합니다.

```bash
grep -n "StockoutRisk" lib/scm-model.ts     # 구현된 정규화 모델 확인
grep -n "getStockoutRisk" lib/scm.ts        # analytics 조회 함수 확인
ls app/\(user\)/analysis/stockout            # STEP 1 분석 화면 확인
```

`lib/scm-model.ts` 끝부분과 `lib/scm.ts` 중간에 "여기에 만듭니다" 주석이 있습니다.
참가자가 어디에 넣을지 헤매지 않도록 남겨둔 표시입니다.

## Supabase Auth / RBAC 초기 설정

STEP 2 migration은 `core.app_user`, `core.audit_log`, Auth 사용자 생성 trigger,
`core.is_admin()` 및 관리자 전용 RLS를 구성합니다. `anon`에는 `core`와 `analytics`
권한을 주지 않습니다. 관련 migration은 `supabase/migrations/20260828000100`부터
`20260828000500`까지입니다.

```
supabase/migrations/20260828000100_add_auth_rbac_audit.sql
supabase/migrations/20260828000200_harden_leadtime_rpc.sql
supabase/migrations/20260828000300_harden_authenticated_read_policies.sql
supabase/migrations/20260828000400_expose_data_api_schemas.sql
supabase/migrations/20260828000500_refresh_data_api_schema_cache.sql
```

현재 프로젝트는 Auth 사용자가 없는 상태이므로, Supabase Dashboard → Authentication
→ Users에서 첫 사용자를 만든 뒤 SQL Editor에서 최초 관리자 1명을 지정해야 합니다.

```sql
update core.app_user
   set role = 'ADMIN'
 where lower(email) = lower('관리자 이메일');
```

이후 로그인하면 `/admin/users`에서 다른 사용자의 ADMIN/USER 및 활성 상태를 변경할 수
있습니다. role/active 변경은 DB trigger가 `core.audit_log`에 자동 기록합니다.

권한 점검용 SQL은 `sql/01-grants.sql`, `sql/02-policies.sql`에 있으며, 이 파일들은
anon 전체 허용 정책을 다시 만들지 않도록 STEP 2 기준으로 갱신되어 있습니다.

## STEP 3 Forecast 데이터 격리

STEP 3 migration은 다음 구조를 추가합니다.

```
raw.usage_history → core.v_train_demand → Forecast / Demand Profile
raw.usage_history → core.v_test_actual → Backtest scoring
```

`core.forecast_setting`의 기간이 학습·검증 경계이며, 현재 데이터 범위를 기준으로
초기 80%/20% 날짜를 만들고 관리자가 수정할 수 있습니다. 정책값은
`core.policy_config`, `core.outlier_rule`, `core.item_policy`에서 관리합니다.
`analytics.v_data_coverage`와 `analytics.v_forecast_settings`에서 기간 커버리지와
격리 상태를 확인할 수 있고, 관리자 화면은 `/admin/forecast-settings`입니다.

실제 적용 migration은 `supabase/migrations/20260828000600_add_forecast_data_model.sql`
및 후속 권한 최적화 파일입니다. `raw`는 Data API 직접 조회 대상이 아니며,
Forecast 학습 코드는 `core.v_train_demand`만 사용해야 합니다.

## 빌드 확인

```bash
npm install
npm run build
```

**배포본 상태에서도 빌드가 통과해야 합니다.** 통과 확인을 마친 구성입니다.

## 실행 확인

```bash
cp .env.local.example .env.local
# NEXT_PUBLIC_SUPABASE_URL
# NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
npm run dev
```

| 주소 | 기대 |
|---|---|
| `/analysis/leadtime` | 공급처 12행 |
| `/analysis/stockout` | 로그인 후 재고 소진 위험 화면 |
| `/api/health/supabase` | `{"configured": true}` |

`/analysis/leadtime` 이 "조회에 실패했습니다" 로 나오면 화면 아래 사유를 봅니다.

| 사유 | 할 일 |
|---|---|
| `permission denied for schema analytics` | `sql/01-grants.sql` 실행 |
| `Invalid schema` / 빈 배열 | Settings → API → Exposed schemas 에 `core`, `analytics` 추가 |

## push

```bash
git add .
git commit -m "4회차 준비: 분석 화면 본보기와 컨텍스트 문서"
git push origin main
```
