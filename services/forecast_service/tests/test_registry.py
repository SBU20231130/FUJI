from services.forecast_service.registry import get_descriptor, list_models


def test_registry_contains_required_models() -> None:
    model_ids = {descriptor.metadata.model_id for descriptor in list_models()}
    assert {"EXPONENTIAL_SMOOTHING", "HOLT", "HOLT_WINTERS", "SARIMA", "PROPHET", "CROSTON", "SBA", "TSB", "XGBOOST", "LIGHTGBM"} <= model_ids


def test_croston_family_supports_intermittent_and_lumpy() -> None:
    for model_id in ("CROSTON", "SBA", "TSB"):
        descriptor = get_descriptor(model_id)
        assert {"INTERMITTENT", "LUMPY"} <= set(descriptor.metadata.supported_demand_types)
