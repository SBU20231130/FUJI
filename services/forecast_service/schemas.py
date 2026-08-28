from __future__ import annotations

from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class ModelRequest(BaseModel):
    model_id: str = Field(min_length=1)
    model_version: str = Field(default="1.0", min_length=1)
    params: dict[str, Any] = Field(default_factory=dict)


class ForecastRunRequest(BaseModel):
    run_id: UUID
    horizon: int = Field(default=28, ge=1, le=366)
    item_ids: list[str] | None = None
    models: list[ModelRequest] | None = None

    @field_validator("item_ids")
    @classmethod
    def clean_item_ids(cls, value: list[str] | None) -> list[str] | None:
        return [item.strip() for item in value if item.strip()] if value is not None else None


class BacktestRunRequest(BaseModel):
    run_id: UUID
    metric: str | None = Field(default=None, pattern="^(?i)(WAPE|MAPE|RMSE|MAE)$")


class ForecastRunResponse(BaseModel):
    run_id: str
    status: str
    model_count: int = 0
    result_count: int = 0
    errors: list[dict[str, str]] = Field(default_factory=list)


class BacktestRunResponse(BaseModel):
    run_id: str
    backtest_run_id: str | None
    status: str
