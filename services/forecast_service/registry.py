from __future__ import annotations

from dataclasses import dataclass

from .models.base import ForecastModel, ModelMetadata
from .models.basic import CrostonModel, ExponentialSmoothingModel, HoltModel, HoltWintersModel, SBAModel, TSBModel
from .models.optional import LightGBMModel, ProphetModel, SARIMAModel, XGBoostModel


@dataclass(frozen=True)
class ModelDescriptor:
    metadata: ModelMetadata
    factory: type[ForecastModel]

    @property
    def available(self) -> bool:
        if not self.metadata.dependency:
            return True
        try:
            __import__(self.metadata.dependency)
            return True
        except ImportError:
            return False


DESCRIPTORS = tuple(
    ModelDescriptor(model.metadata, model)
    for model in (
        ExponentialSmoothingModel,
        HoltModel,
        HoltWintersModel,
        SARIMAModel,
        ProphetModel,
        CrostonModel,
        SBAModel,
        TSBModel,
        XGBoostModel,
        LightGBMModel,
    )
)


def list_models() -> list[ModelDescriptor]:
    return list(DESCRIPTORS)


def get_descriptor(model_id: str) -> ModelDescriptor:
    wanted = model_id.strip().upper()
    for descriptor in DESCRIPTORS:
        if descriptor.metadata.model_id == wanted:
            return descriptor
    raise KeyError(f"지원하지 않는 Python 모델입니다: {model_id}")
