from __future__ import annotations

from uuid import UUID

import pandas as pd

from services.forecast_service.pipeline import ForecastPipeline
from services.forecast_service.schemas import ForecastRunRequest, ModelRequest


class FakeGateway:
    def __init__(self) -> None:
        self.saved: list[dict] = []

    def fetch_train_demand(self, access_token, item_ids=None):
        return [
            {"item_id": "ITEM-SMOOTH", "period_start": f"2026-01-{day:02d}", "quantity": day + 10}
            for day in range(1, 15)
        ] + [
            {"item_id": "ITEM-LUMPY", "period_start": f"2026-01-{day:02d}", "quantity": 20 if day in (2, 8) else 0}
            for day in range(1, 15)
        ]

    def fetch_demand_profiles(self, access_token, item_ids=None):
        return [{"item_id": "ITEM-SMOOTH", "demand_type": "SMOOTH"}, {"item_id": "ITEM-LUMPY", "demand_type": "LUMPY"}]

    def save_forecast_results(self, run_id, rows, access_token):
        self.saved = rows
        return len(rows)


def test_pipeline_preserves_run_version_params_and_intermittent_candidates() -> None:
    gateway = FakeGateway()
    request = ForecastRunRequest(
        run_id=UUID("00000000-0000-0000-0000-000000000001"),
        horizon=3,
        models=[ModelRequest(model_id="CROSTON", params={"alpha": 0.2})],
    )
    # 명시 모델은 LUMPY 품목에만 유효하므로, 실패한 품목을 저장하지 않고 유효 결과만 저장한다.
    result = ForecastPipeline(gateway).run(request, "user-token")
    assert result["status"] == "READY"
    assert gateway.saved
    assert {row["run_id"] for row in gateway.saved} == {str(request.run_id)}
    assert {row["model_version"] for row in gateway.saved} == {"1.0"}
    assert gateway.saved[0]["model_params"]["alpha"] == 0.2
    assert all("v_test_actual" not in str(row) for row in gateway.saved)
