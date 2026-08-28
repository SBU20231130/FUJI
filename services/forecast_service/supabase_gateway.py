from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from uuid import UUID

import httpx

from .config import Settings
from .errors import ForecastServiceError


class SupabaseGateway:
    """Supabase Data API/RPC 경계. 호출자의 Bearer 세션을 그대로 전달합니다."""

    def __init__(self, settings: Settings | None = None):
        self.settings = settings or Settings.from_env()

    def _headers(self, access_token: str | None, profile: str | None = None) -> dict[str, str]:
        key = self.settings.supabase_key or self.settings.supabase_service_key
        if not self.settings.supabase_url or not key:
            raise ForecastServiceError("SUPABASE_NOT_CONFIGURED", "Forecast Service의 Supabase 환경변수가 없습니다.")
        headers = {"apikey": key, "Authorization": f"Bearer {access_token or key}"}
        if profile:
            headers["Accept-Profile"] = profile
            headers["Content-Profile"] = profile
        return headers

    @property
    def rest_url(self) -> str:
        return self.settings.supabase_url.rstrip("/") + "/rest/v1"

    def _request(self, method: str, path: str, access_token: str | None, **kwargs: Any) -> Any:
        headers = self._headers(access_token, kwargs.pop("profile", None))
        headers.update(kwargs.pop("headers", {}))
        try:
            response = httpx.request(method, self.rest_url + path, headers=headers, timeout=self.settings.request_timeout_seconds, **kwargs)
        except httpx.HTTPError as exc:
            raise ForecastServiceError("SUPABASE_UNAVAILABLE", "Supabase에 연결하지 못했습니다.") from exc
        if response.status_code >= 400:
            detail = response.text[:500]
            raise ForecastServiceError("SUPABASE_REQUEST_FAILED", f"Supabase 요청이 실패했습니다 ({response.status_code}): {detail}")
        if not response.content:
            return None
        return response.json()

    def fetch_train_demand(self, access_token: str | None, item_ids: list[str] | None = None) -> list[dict[str, Any]]:
        params: dict[str, str] = {"select": "item_id,use_date,qty", "order": "item_id.asc,use_date.asc"}
        if item_ids:
            quoted = ",".join(item.replace(",", "") for item in item_ids)
            params["item_id"] = f"in.({quoted})"
        data = self._request("GET", "/v_train_demand", access_token, profile="core", params=params)
        return list(data or [])

    def fetch_demand_profiles(self, access_token: str | None, item_ids: list[str] | None = None) -> list[dict[str, Any]]:
        params: dict[str, str] = {"select": "item_id,demand_type,reason_code", "order": "item_id.asc"}
        if item_ids:
            quoted = ",".join(item.replace(",", "") for item in item_ids)
            params["item_id"] = f"in.({quoted})"
        data = self._request("GET", "/v_sku_demand_profile", access_token, profile="analytics", params=params)
        return list(data or [])

    def save_forecast_results(self, run_id: UUID, rows: list[dict[str, Any]], access_token: str | None) -> int:
        data = self._request(
            "POST",
            "/rpc/save_forecast_result",
            access_token,
            profile="core",
            json={"p_forecast_run_id": str(run_id), "p_rows": rows},
        )
        return int(data or 0)

    def mark_run_failed(self, run_id: UUID, error_message: str, access_token: str | None) -> None:
        safe_message = error_message[:2000]
        self._request(
            "PATCH",
            f"/forecast_run?forecast_run_id=eq.{run_id}",
            access_token,
            profile="core",
            headers={"Prefer": "return=minimal"},
            json={"status": "FAILED", "error_message": safe_message, "completed_at": datetime.now(timezone.utc).isoformat()},
        )

    def run_backtest(self, run_id: UUID, metric: str | None, access_token: str | None) -> str:
        data = self._request(
            "POST",
            "/rpc/run_backtest",
            access_token,
            profile="core",
            json={"p_forecast_run_id": str(run_id), "p_metric": metric},
        )
        return str(data)
