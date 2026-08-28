from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd

from .base import ForecastModel, ModelMetadata, clean_train, result_frame
from ..errors import ModelDataInsufficient


def _bounded(value: Any, default: float, low: float = 0.001, high: float = 0.999) -> float:
    try:
        return min(high, max(low, float(value)))
    except (TypeError, ValueError):
        return default


class ExponentialSmoothingModel(ForecastModel):
    metadata = ModelMetadata("EXPONENTIAL_SMOOTHING", "1.0", "Exponential Smoothing", ("SMOOTH", "ERRATIC", "INTERMITTENT", "LUMPY"))

    def forecast(self, train_df: pd.DataFrame, horizon: int, params: dict[str, Any]) -> pd.DataFrame:
        train = clean_train(train_df, self.metadata.model_id)
        alpha = _bounded(params.get("alpha"), 0.2)
        level = float(train["quantity"].iloc[0])
        for value in train["quantity"].iloc[1:]:
            level = alpha * float(value) + (1 - alpha) * level
        return result_frame(train, np.repeat(level, horizon), self.metadata.model_id)


class HoltModel(ForecastModel):
    metadata = ModelMetadata("HOLT", "1.0", "Holt", ("SMOOTH", "ERRATIC"))

    def forecast(self, train_df: pd.DataFrame, horizon: int, params: dict[str, Any]) -> pd.DataFrame:
        train = clean_train(train_df, self.metadata.model_id)
        if len(train) < 2:
            raise ModelDataInsufficient(self.metadata.model_id, "수준과 추세 계산에 2개 이상의 관측치가 필요합니다.")
        alpha = _bounded(params.get("alpha"), 0.2)
        beta = _bounded(params.get("beta"), 0.1)
        values = train["quantity"].to_numpy(dtype=float)
        level = values[0]
        trend = values[1] - values[0]
        for value in values[1:]:
            previous_level = level
            level = alpha * value + (1 - alpha) * (level + trend)
            trend = beta * (level - previous_level) + (1 - beta) * trend
        prediction = np.array([level + (index + 1) * trend for index in range(horizon)])
        return result_frame(train, prediction, self.metadata.model_id)


class HoltWintersModel(ForecastModel):
    metadata = ModelMetadata("HOLT_WINTERS", "1.0", "Holt-Winters", ("SMOOTH", "ERRATIC"))

    def forecast(self, train_df: pd.DataFrame, horizon: int, params: dict[str, Any]) -> pd.DataFrame:
        train = clean_train(train_df, self.metadata.model_id)
        season = max(2, int(params.get("seasonal_periods", 7)))
        if len(train) < season * 2:
            raise ModelDataInsufficient(self.metadata.model_id, f"계절 주기 {season}의 두 주기 이상이 필요합니다.")
        alpha = _bounded(params.get("alpha"), 0.2)
        beta = _bounded(params.get("beta"), 0.1)
        gamma = _bounded(params.get("gamma"), 0.1)
        values = train["quantity"].to_numpy(dtype=float)
        seasonal = np.zeros(season, dtype=float)
        baseline = float(np.mean(values[:season]))
        seasonal[:] = values[:season] - baseline
        level = baseline
        trend = float(np.mean(values[season:2 * season]) - baseline) / season
        for index, value in enumerate(values):
            slot = index % season
            previous_level = level
            previous_season = seasonal[slot]
            level = alpha * (value - previous_season) + (1 - alpha) * (level + trend)
            trend = beta * (level - previous_level) + (1 - beta) * trend
            seasonal[slot] = gamma * (value - level) + (1 - gamma) * previous_season
        predictions = np.array([level + (step + 1) * trend + seasonal[(len(values) + step) % season] for step in range(horizon)])
        return result_frame(train, predictions, self.metadata.model_id)


def _intermittent_state(values: np.ndarray, alpha: float) -> tuple[float, float]:
    nonzero = np.flatnonzero(values > 0)
    if len(nonzero) == 0:
        return 0.0, float(len(values))
    demand = float(values[nonzero[0]])
    interval = float(nonzero[0] + 1)
    previous = nonzero[0]
    for index in nonzero[1:]:
        demand = alpha * float(values[index]) + (1 - alpha) * demand
        interval_value = float(index - previous)
        interval = alpha * interval_value + (1 - alpha) * interval
        previous = index
    return demand, interval


class CrostonModel(ForecastModel):
    metadata = ModelMetadata("CROSTON", "1.0", "Croston", ("INTERMITTENT", "LUMPY"))

    def forecast(self, train_df: pd.DataFrame, horizon: int, params: dict[str, Any]) -> pd.DataFrame:
        train = clean_train(train_df, self.metadata.model_id)
        alpha = _bounded(params.get("alpha"), 0.1)
        demand, interval = _intermittent_state(train["quantity"].to_numpy(dtype=float), alpha)
        prediction = np.repeat(demand / interval if interval > 0 else 0.0, horizon)
        return result_frame(train, prediction, self.metadata.model_id)


class SBAModel(CrostonModel):
    metadata = ModelMetadata("SBA", "1.0", "SBA", ("INTERMITTENT", "LUMPY"))

    def forecast(self, train_df: pd.DataFrame, horizon: int, params: dict[str, Any]) -> pd.DataFrame:
        train = clean_train(train_df, self.metadata.model_id)
        alpha = _bounded(params.get("alpha"), 0.1)
        demand, interval = _intermittent_state(train["quantity"].to_numpy(dtype=float), alpha)
        prediction = np.repeat((1 - alpha / 2) * demand / interval if interval > 0 else 0.0, horizon)
        return result_frame(train, prediction, self.metadata.model_id)


class TSBModel(CrostonModel):
    metadata = ModelMetadata("TSB", "1.0", "TSB", ("INTERMITTENT", "LUMPY"))

    def forecast(self, train_df: pd.DataFrame, horizon: int, params: dict[str, Any]) -> pd.DataFrame:
        train = clean_train(train_df, self.metadata.model_id)
        alpha = _bounded(params.get("alpha"), 0.1)
        beta = _bounded(params.get("beta"), 0.1)
        values = train["quantity"].to_numpy(dtype=float)
        probability = float(values[0] > 0)
        demand = float(values[0]) if values[0] > 0 else 0.0
        for value in values[1:]:
            occurrence = float(value > 0)
            probability = beta * occurrence + (1 - beta) * probability
            if occurrence:
                demand = alpha * float(value) + (1 - alpha) * demand
        return result_frame(train, np.repeat(probability * demand, horizon), self.metadata.model_id)
