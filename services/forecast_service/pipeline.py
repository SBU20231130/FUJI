from __future__ import annotations

from collections import defaultdict
from typing import Any
from uuid import UUID

import pandas as pd

from .errors import ForecastServiceError
from .registry import ModelDescriptor, get_descriptor, list_models
from .schemas import ForecastRunRequest, ModelRequest
from .supabase_gateway import SupabaseGateway


def _profile_type(profile: dict[str, Any]) -> str:
    return str(profile.get("demand_type") or "SMOOTH").upper()


def _default_descriptors(demand_type: str) -> list[ModelDescriptor]:
    descriptors = [descriptor for descriptor in list_models() if demand_type in descriptor.metadata.supported_demand_types and descriptor.available]
    if not descriptors:
        descriptors = [descriptor for descriptor in list_models() if descriptor.metadata.model_id == "EXPONENTIAL_SMOOTHING"]
    return descriptors


def _requested_descriptors(models: list[ModelRequest] | None) -> list[tuple[ModelDescriptor, dict[str, Any]]]:
    if models is None:
        return []
    selected: list[tuple[ModelDescriptor, dict[str, Any]]] = []
    for request in models:
        try:
            descriptor = get_descriptor(request.model_id)
        except KeyError as exc:
            raise ForecastServiceError("MODEL_NOT_SUPPORTED", str(exc)) from exc
        if request.model_version != descriptor.metadata.model_version:
            raise ForecastServiceError("MODEL_VERSION_UNSUPPORTED", f"{request.model_id} v{request.model_version}은 지원하지 않습니다.")
        selected.append((descriptor, request.params))
    return selected


class ForecastPipeline:
    def __init__(self, gateway: SupabaseGateway | None = None):
        self.gateway = gateway or SupabaseGateway()

    def run(self, request: ForecastRunRequest, access_token: str | None) -> dict[str, Any]:
        train_rows = self.gateway.fetch_train_demand(access_token, request.item_ids)
        profiles = self.gateway.fetch_demand_profiles(access_token, request.item_ids)
        if not train_rows:
            raise ForecastServiceError("NO_TRAIN_DATA", "core.v_train_demand에 학습 데이터가 없습니다.")
        train_by_item: dict[str, list[dict[str, Any]]] = defaultdict(list)
        for row in train_rows:
            train_by_item[str(row.get("item_id"))].append(row)
        profiles_by_item = {str(row.get("item_id")): row for row in profiles}
        explicit = _requested_descriptors(request.models)
        result_rows: list[dict[str, Any]] = []
        errors: list[dict[str, str]] = []
        used_models: set[str] = set()

        for item_id, rows in train_by_item.items():
            demand_type = _profile_type(profiles_by_item.get(item_id, {}))
            candidates = explicit or [(descriptor, {}) for descriptor in _default_descriptors(demand_type)]
            train_df = pd.DataFrame(rows)
            for descriptor, params in candidates:
                model_id = descriptor.metadata.model_id
                if demand_type not in descriptor.metadata.supported_demand_types:
                    errors.append({"item_id": item_id, "model_id": model_id, "code": "DEMAND_TYPE_UNSUPPORTED"})
                    continue
                if not descriptor.available:
                    errors.append({"item_id": item_id, "model_id": model_id, "code": "MODEL_DEPENDENCY_MISSING"})
                    continue
                try:
                    frame = descriptor.factory().forecast(train_df, request.horizon, params)
                    model_params = {**params, "demand_type": demand_type}
                    for record in frame.to_dict(orient="records"):
                        result_rows.append(
                            {
                                "forecast_run_id": str(request.run_id),
                                "run_id": str(request.run_id),
                                "model_id": model_id,
                                "model_version": descriptor.metadata.model_version,
                                "item_id": item_id,
                                "forecast_date": str(record["period"]),
                                "period": str(record["period"]),
                                "forecast_value": record["predicted_qty"],
                                "predicted_qty": record["predicted_qty"],
                                "p50": record["p50"],
                                "p80": record["p80"],
                                "p90": record["p90"],
                                "prediction_lower": record["prediction_lower"],
                                "prediction_upper": record["prediction_upper"],
                                "result_reason_code": None,
                                "model_params": model_params,
                            }
                        )
                    used_models.add(model_id)
                except Exception as exc:  # 모델 하나의 실패가 다른 후보 실행을 막지 않음
                    code = getattr(exc, "code", "MODEL_EXECUTION_FAILED")
                    errors.append({"item_id": item_id, "model_id": model_id, "code": code})

        if not result_rows:
            raise ForecastServiceError("ALL_MODELS_FAILED", "실행 가능한 모델 결과가 없습니다.")
        saved_count = self.gateway.save_forecast_results(request.run_id, result_rows, access_token)
        return {"run_id": str(request.run_id), "status": "READY", "model_count": len(used_models), "result_count": saved_count, "errors": errors}
