from __future__ import annotations

import pandas as pd

from services.forecast_service.models.basic import CrostonModel, ExponentialSmoothingModel, HoltModel, HoltWintersModel, SBAModel, TSBModel


def training(values: list[float]) -> pd.DataFrame:
    return pd.DataFrame({"period": pd.date_range("2026-01-01", periods=len(values), freq="D"), "quantity": values})


def test_common_models_return_standard_columns() -> None:
    frame = training([10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23])
    for model in (ExponentialSmoothingModel(), HoltModel(), HoltWintersModel()):
        result = model.forecast(frame, 5, {})
        assert list(result.columns) == ["period", "predicted_qty", "p50", "p80", "p90", "prediction_lower", "prediction_upper"]
        assert len(result) == 5
        assert (result["predicted_qty"] >= 0).all()


def test_intermittent_models_produce_non_zero_demand_rate_forecasts() -> None:
    frame = training([0, 0, 12, 0, 0, 0, 18, 0, 0, 10, 0, 0])
    for model in (CrostonModel(), SBAModel(), TSBModel()):
        result = model.forecast(frame, 3, {})
        assert len(result) == 3
        assert result["predicted_qty"].iloc[0] > 0
