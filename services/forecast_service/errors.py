class ForecastServiceError(Exception):
    """사용자에게 안전하게 반환할 수 있는 Forecast Service 오류."""

    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code
        self.message = message


class ModelDependencyMissing(ForecastServiceError):
    def __init__(self, model_id: str, dependency: str):
        super().__init__(
            "MODEL_DEPENDENCY_MISSING",
            f"{model_id} 모델을 실행하려면 선택 의존성 {dependency}가 필요합니다.",
        )


class ModelDataInsufficient(ForecastServiceError):
    def __init__(self, model_id: str, detail: str = "학습 데이터가 부족합니다."):
        super().__init__("MODEL_DATA_INSUFFICIENT", f"{model_id}: {detail}")
