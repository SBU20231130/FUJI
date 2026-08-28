# Python Forecast Service

Next.js와 분리된 FastAPI 배치 서비스입니다. 화면은 이 서비스에 실행을 요청할 뿐이며,
Forecast 계산은 Python에서 수행하고 결과 저장과 권한 검사는 Supabase RPC/RLS가 담당합니다.

## 실행

```powershell
$env:SUPABASE_URL = "https://<project-ref>.supabase.co"
$env:SUPABASE_PUBLISHABLE_KEY = "sb_publishable_..."
$env:FORECAST_SERVICE_TOKEN = "긴 랜덤 토큰"
python -m pip install -r services/forecast_service/requirements.txt
uvicorn services.forecast_service.main:app --reload --port 8000
```

로컬 테스트는 `python -m pip install -r services/forecast_service/requirements-dev.txt` 후
`python -m pytest -q services/forecast_service/tests`로 실행합니다.

`SUPABASE_SERVICE_ROLE_KEY`는 독립 배치 fallback이 필요한 서버에서만 사용하며, Git·브라우저·Next.js `NEXT_PUBLIC_*` 변수에 넣지 않습니다.
일반적인 관리자 실행은 사용자의 Supabase Bearer 세션을 전달하므로 DB의 `core.is_admin()` 및 RLS를 그대로 통과해야 합니다.

## API

- `GET /health`: 서비스 상태
- `GET /models`: 모델 버전·수요 유형·선택 의존성 상태
- `POST /forecast/run`: `run_id`, `horizon`, 선택 모델을 받아 `core.save_forecast_result`로 저장
- `POST /backtest/run`: 기존 `core.run_backtest`를 호출하여 Python/SQL 후보를 함께 비교

모든 실행 API는 `X-Forecast-Service-Token`과 `Authorization: Bearer <Supabase access token>`을 요구합니다.
학습은 `core.v_train_demand`와 `analytics.v_sku_demand_profile`만 조회하며 `core.v_test_actual`은 조회하지 않습니다.
실패한 실행은 `core.forecast_run.status=FAILED`와 `error_message`를 남깁니다.
