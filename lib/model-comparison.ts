// 모델 토글은 서버 조회나 Forecast 실행과 무관한 화면 상태만 바꿉니다.
export function toggleModelVisibility(currentModelIds: string[], modelId: string) {
  return currentModelIds.includes(modelId)
    ? currentModelIds.filter((current) => current !== modelId)
    : [...currentModelIds, modelId];
}
