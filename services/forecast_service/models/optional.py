from __future__ import annotations

from typing import Any

import pandas as pd

from .base import ForecastModel, ModelMetadata, clean_train, result_frame
from ..errors import ModelDependencyMissing, ModelDataInsufficient


class OptionalDependencyModel(ForecastModel):
    dependency: str

    def _require_dependency(self) -> None:
        try:
            __import__(self.dependency)
        except ImportError as exc:
            raise ModelDependencyMissing(self.metadata.model_id, self.dependency) from exc


class SARIMAModel(OptionalDependencyModel):
    metadata = ModelMetadata("SARIMA", "1.0", "SARIMA", ("SMOOTH", "ERRATIC"), "statsmodels")
    dependency = "statsmodels"

    def forecast(self, train_df: pd.DataFrame, horizon: int, params: dict[str, Any]) -> pd.DataFrame:
        self._require_dependency()
        from statsmodels.tsa.statespace.sarimax import SARIMAX

        train = clean_train(train_df, self.metadata.model_id)
        order = tuple(params.get("order", (1, 1, 0)))
        seasonal_order = tuple(params.get("seasonal_order", (0, 0, 0, 0)))
        if len(train) < max(8, sum(order) + sum(seasonal_order) + 2):
            raise ModelDataInsufficient(self.metadata.model_id)
        fitted = SARIMAX(train["quantity"], order=order, seasonal_order=seasonal_order, enforce_stationarity=False, enforce_invertibility=False).fit(disp=False)
        prediction = fitted.get_forecast(steps=horizon).predicted_mean.to_numpy()
        return result_frame(train, prediction, self.metadata.model_id)


class ProphetModel(OptionalDependencyModel):
    metadata = ModelMetadata("PROPHET", "1.0", "Prophet", ("SMOOTH", "ERRATIC"), "prophet")
    dependency = "prophet"

    def forecast(self, train_df: pd.DataFrame, horizon: int, params: dict[str, Any]) -> pd.DataFrame:
        self._require_dependency()
        from prophet import Prophet

        train = clean_train(train_df, self.metadata.model_id)
        model = Prophet(**{key: value for key, value in params.items() if key in {"weekly_seasonality", "yearly_seasonality", "daily_seasonality", "seasonality_mode"}})
        model.fit(train.rename(columns={"period": "ds", "quantity": "y"}))
        future = model.make_future_dataframe(periods=horizon, freq="D").tail(horizon)
        prediction = model.predict(future)["yhat"].to_numpy()
        return result_frame(train, prediction, self.metadata.model_id)


class XGBoostModel(OptionalDependencyModel):
    metadata = ModelMetadata("XGBOOST", "1.0", "XGBoost", ("SMOOTH", "ERRATIC"), "xgboost")
    dependency = "xgboost"

    def forecast(self, train_df: pd.DataFrame, horizon: int, params: dict[str, Any]) -> pd.DataFrame:
        self._require_dependency()
        import numpy as np
        from xgboost import XGBRegressor

        train = clean_train(train_df, self.metadata.model_id)
        if len(train) < 4:
            raise ModelDataInsufficient(self.metadata.model_id)
        lag = max(1, int(params.get("lag", 3)))
        values = train["quantity"].to_numpy(dtype=float)
        if len(values) <= lag:
            raise ModelDataInsufficient(self.metadata.model_id)
        x = np.array([values[index - lag:index] for index in range(lag, len(values))])
        y = values[lag:]
        model = XGBRegressor(n_estimators=int(params.get("n_estimators", 100)), max_depth=int(params.get("max_depth", 3)), objective="reg:squarederror")
        model.fit(x, y)
        history = list(values)
        predictions = []
        for _ in range(horizon):
            value = float(model.predict(np.array([history[-lag:]]))[0])
            predictions.append(value)
            history.append(value)
        return result_frame(train, predictions, self.metadata.model_id)


class LightGBMModel(XGBoostModel):
    metadata = ModelMetadata("LIGHTGBM", "1.0", "LightGBM", ("SMOOTH", "ERRATIC"), "lightgbm")
    dependency = "lightgbm"

    def forecast(self, train_df: pd.DataFrame, horizon: int, params: dict[str, Any]) -> pd.DataFrame:
        self._require_dependency()
        import numpy as np
        from lightgbm import LGBMRegressor

        train = clean_train(train_df, self.metadata.model_id)
        lag = max(1, int(params.get("lag", 3)))
        values = train["quantity"].to_numpy(dtype=float)
        if len(values) <= lag:
            raise ModelDataInsufficient(self.metadata.model_id)
        x = np.array([values[index - lag:index] for index in range(lag, len(values))])
        model = LGBMRegressor(n_estimators=int(params.get("n_estimators", 100)), max_depth=int(params.get("max_depth", -1)), verbosity=-1)
        model.fit(x, values[lag:])
        history = list(values)
        predictions = []
        for _ in range(horizon):
            value = float(model.predict(np.array([history[-lag:]]))[0])
            predictions.append(value)
            history.append(value)
        return result_frame(train, predictions, self.metadata.model_id)
