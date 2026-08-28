from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any

import numpy as np
import pandas as pd

from ..errors import ModelDataInsufficient


STANDARD_COLUMNS = (
    "period",
    "predicted_qty",
    "p50",
    "p80",
    "p90",
    "prediction_lower",
    "prediction_upper",
)


@dataclass(frozen=True)
class ModelMetadata:
    model_id: str
    model_version: str
    name: str
    supported_demand_types: tuple[str, ...]
    dependency: str | None = None


class ForecastModel(ABC):
    metadata: ModelMetadata

    @abstractmethod
    def forecast(
        self, train_df: pd.DataFrame, horizon: int, params: dict[str, Any]
    ) -> pd.DataFrame:
        """공통 Forecast 인터페이스."""


def clean_train(train_df: pd.DataFrame, model_id: str) -> pd.DataFrame:
    if train_df.empty:
        raise ModelDataInsufficient(model_id)
    frame = train_df.copy()
    period_key = "period" if "period" in frame.columns else "period_start"
    quantity_key = "qty" if "qty" in frame.columns else "quantity"
    if period_key not in frame.columns or quantity_key not in frame.columns:
        raise ModelDataInsufficient(model_id, "period/quantity 컬럼이 없습니다.")
    frame["period"] = pd.to_datetime(frame[period_key], errors="coerce")
    frame["quantity"] = pd.to_numeric(frame[quantity_key], errors="coerce")
    frame = frame.dropna(subset=["period", "quantity"]).sort_values("period")
    if frame.empty:
        raise ModelDataInsufficient(model_id)
    return frame[["period", "quantity"]].reset_index(drop=True)


def forecast_periods(train: pd.DataFrame, horizon: int) -> pd.DatetimeIndex:
    last = pd.Timestamp(train["period"].iloc[-1])
    return pd.date_range(last + pd.Timedelta(days=1), periods=horizon, freq="D")


def residual_scale(values: np.ndarray) -> float:
    if values.size < 3:
        return 0.0
    scale = float(np.std(np.diff(values), ddof=1))
    return max(scale, 0.0) if np.isfinite(scale) else 0.0


def result_frame(
    train: pd.DataFrame,
    predictions: np.ndarray | list[float],
    model_id: str,
    scale: float | None = None,
) -> pd.DataFrame:
    values = np.asarray(predictions, dtype=float)
    values = np.where(np.isfinite(values), np.maximum(values, 0.0), np.nan)
    scale_value = residual_scale(train["quantity"].to_numpy(dtype=float)) if scale is None else max(scale, 0.0)
    p80 = np.where(np.isfinite(values), values + 1.2816 * scale_value, np.nan)
    p90 = np.where(np.isfinite(values), values + 1.6449 * scale_value, np.nan)
    lower = np.where(np.isfinite(values), np.maximum(values - 1.2816 * scale_value, 0.0), np.nan)
    return pd.DataFrame(
        {
            "period": forecast_periods(train, len(values)).date,
            "predicted_qty": values,
            "p50": values,
            "p80": p80,
            "p90": p90,
            "prediction_lower": lower,
            "prediction_upper": p90,
        },
        columns=STANDARD_COLUMNS,
    )
