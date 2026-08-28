from __future__ import annotations

import hmac
from typing import Annotated

from fastapi import FastAPI, Header, HTTPException, Request

from .config import Settings
from .errors import ForecastServiceError
from .pipeline import ForecastPipeline
from .registry import list_models
from .schemas import BacktestRunRequest, BacktestRunResponse, ForecastRunRequest, ForecastRunResponse
from .supabase_gateway import SupabaseGateway


def _bearer(value: str | None) -> str | None:
    if not value or not value.lower().startswith("bearer "):
        return None
    token = value[7:].strip()
    return token or None


def create_app(settings: Settings | None = None, gateway: SupabaseGateway | None = None) -> FastAPI:
    resolved = settings or Settings.from_env()
    resolved_gateway = gateway or SupabaseGateway(resolved)
    pipeline = ForecastPipeline(resolved_gateway)
    app = FastAPI(title="SCM Forecast Service", version="1.0.0")

    def require_service_token(value: str | None) -> None:
        if not resolved.service_token or not value or not hmac.compare_digest(value, resolved.service_token):
            raise HTTPException(status_code=401, detail="Forecast Service 토큰이 올바르지 않습니다.")

    def require_user_token(authorization: str | None) -> str:
        token = _bearer(authorization)
        if not token:
            raise HTTPException(status_code=401, detail="Supabase 사용자 세션이 필요합니다.")
        return token

    @app.get("/health")
    def health() -> dict[str, object]:
        return {"status": "ok", "service": "forecast-service", "supabase_configured": resolved.configured}

    @app.get("/models")
    def models() -> list[dict[str, object]]:
        return [
            {
                "model_id": descriptor.metadata.model_id,
                "model_version": descriptor.metadata.model_version,
                "name": descriptor.metadata.name,
                "supported_demand_types": list(descriptor.metadata.supported_demand_types),
                "dependency": descriptor.metadata.dependency,
                "available": descriptor.available,
            }
            for descriptor in list_models()
        ]

    @app.post("/forecast/run", response_model=ForecastRunResponse)
    def forecast_run(
        payload: ForecastRunRequest,
        x_forecast_service_token: Annotated[str | None, Header()] = None,
        authorization: Annotated[str | None, Header()] = None,
    ) -> ForecastRunResponse:
        require_service_token(x_forecast_service_token)
        access_token = require_user_token(authorization)
        try:
            return ForecastRunResponse(**pipeline.run(payload, access_token))
        except ForecastServiceError as exc:
            try:
                resolved_gateway.mark_run_failed(payload.run_id, f"{exc.code}: {exc.message}", access_token)
            except Exception:
                pass
            raise HTTPException(status_code=500, detail={"code": exc.code, "message": exc.message}) from exc
        except Exception as exc:
            try:
                resolved_gateway.mark_run_failed(payload.run_id, "MODEL_EXECUTION_FAILED: Forecast Service 실행에 실패했습니다.", access_token)
            except Exception:
                pass
            raise HTTPException(status_code=500, detail={"code": "MODEL_EXECUTION_FAILED", "message": "Forecast Service 실행에 실패했습니다."}) from exc

    @app.post("/backtest/run", response_model=BacktestRunResponse)
    def backtest_run(
        payload: BacktestRunRequest,
        x_forecast_service_token: Annotated[str | None, Header()] = None,
        authorization: Annotated[str | None, Header()] = None,
    ) -> BacktestRunResponse:
        require_service_token(x_forecast_service_token)
        access_token = require_user_token(authorization)
        try:
            backtest_id = resolved_gateway.run_backtest(payload.run_id, payload.metric.upper() if payload.metric else None, access_token)
            return BacktestRunResponse(run_id=str(payload.run_id), backtest_run_id=backtest_id, status="COMPLETED")
        except ForecastServiceError as exc:
            raise HTTPException(status_code=500, detail={"code": exc.code, "message": exc.message}) from exc

    return app
