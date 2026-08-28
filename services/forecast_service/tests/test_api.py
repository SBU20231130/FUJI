from __future__ import annotations

from uuid import UUID

from fastapi.testclient import TestClient

from services.forecast_service.api import create_app
from services.forecast_service.config import Settings


class FakeGateway:
    def __init__(self) -> None:
        self.failed = False

    def fetch_train_demand(self, access_token, item_ids=None):
        return [{"item_id": "ITEM1", "period_start": "2026-01-01", "quantity": 10}, {"item_id": "ITEM1", "period_start": "2026-01-02", "quantity": 11}]

    def fetch_demand_profiles(self, access_token, item_ids=None):
        return [{"item_id": "ITEM1", "demand_type": "SMOOTH"}]

    def save_forecast_results(self, run_id, rows, access_token):
        return len(rows)

    def mark_run_failed(self, run_id, error_message, access_token):
        self.failed = True

    def run_backtest(self, run_id, metric, access_token):
        return "backtest-id"


def test_health_and_protected_forecast_endpoint() -> None:
    settings = Settings("https://example.supabase.co", "publishable", None, "service-token")
    client = TestClient(create_app(settings, FakeGateway()))
    assert client.get("/health").json()["status"] == "ok"
    assert client.get("/models").status_code == 200
    assert client.post("/forecast/run", headers={"x-forecast-service-token": "wrong"}, json={"run_id": str(UUID(int=1)), "horizon": 2}).status_code == 401
    response = client.post(
        "/forecast/run",
        headers={"x-forecast-service-token": "service-token", "authorization": "Bearer user-token"},
        json={"run_id": str(UUID(int=1)), "horizon": 2, "models": [{"model_id": "EXPONENTIAL_SMOOTHING"}]},
    )
    assert response.status_code == 200
    assert response.json()["status"] == "READY"
    backtest = client.post(
        "/backtest/run",
        headers={"x-forecast-service-token": "service-token", "authorization": "Bearer user-token"},
        json={"run_id": str(UUID(int=1)), "metric": "WAPE"},
    )
    assert backtest.status_code == 200
    assert backtest.json()["backtest_run_id"] == "backtest-id"


def test_forecast_failure_is_reported_without_leaking_internal_error() -> None:
    class EmptyGateway(FakeGateway):
        def fetch_train_demand(self, access_token, item_ids=None):
            return []

    gateway = EmptyGateway()
    settings = Settings("https://example.supabase.co", "publishable", None, "service-token")
    client = TestClient(create_app(settings, gateway))
    response = client.post(
        "/forecast/run",
        headers={"x-forecast-service-token": "service-token", "authorization": "Bearer user-token"},
        json={"run_id": str(UUID(int=2)), "horizon": 2},
    )
    assert response.status_code == 500
    assert response.json()["detail"]["code"] == "NO_TRAIN_DATA"
    assert gateway.failed is True
