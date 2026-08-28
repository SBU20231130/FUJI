import AnalysisFrame from '@/components/analysis/analysis-frame';
import DemandProfileFilters from '@/components/analysis/demand-profile-filters';
import Badge from '@/components/ui/badge';
import EmptyValue from '@/components/ui/empty-value';
import KpiCard from '@/components/ui/kpi-card';
import Panel from '@/components/ui/panel';
import { getDemandProfile, getDemandProfileKpi } from '@/lib/scm';

export const dynamic = 'force-dynamic';

export default async function DemandProfilePage() {
  const [{ rows, error }, { data: kpi, error: kpiError }] = await Promise.all([getDemandProfile(), getDemandProfileKpi()]);
  if (error || kpiError) {
    return <AnalysisFrame title="SKU 수요 프로파일" description="학습 구간의 SKU별 수요 패턴을 분류합니다."><Panel><p className="text-danger">조회에 실패했습니다.</p><p className="muted">{error ?? kpiError}</p></Panel></AnalysisFrame>;
  }
  if (rows.length === 0) {
    return <AnalysisFrame title="SKU 수요 프로파일" description="학습 구간의 SKU별 수요 패턴을 분류합니다."><Panel title="결과가 없습니다."><p className="empty-state">analytics.v_sku_demand_profile 결과가 없습니다. forecast_setting과 Data API 스키마 노출을 확인하세요.</p></Panel></AnalysisFrame>;
  }

  return <AnalysisFrame title="SKU 수요 프로파일" description="core.v_train_demand의 학습 구간만 월 단위로 집계해 SKU별 수요 특성을 분류합니다.">
    <div className="grid grid-4">
      <KpiCard label="전체 SKU" value={kpi?.totalItems ?? <EmptyValue />} foot="analytics.v_demand_profile_kpi" status="SAFE" />
      <KpiCard label="SMOOTH" value={kpi?.smooth ?? <EmptyValue />} foot="정기적·낮은 변동" status="SAFE" />
      <KpiCard label="Croston 후보" value={kpi?.crostonNeeded ?? <EmptyValue />} foot="INTERMITTENT + LUMPY" status="WARNING" />
      <KpiCard label="계산 불가" value={kpi?.calculationUnavailable ?? <EmptyValue />} foot="reason_code 확인 필요" status="CALCULATION_UNAVAILABLE" />
    </div>
    <Panel className="section" title="분류 기준" description="Syntetos-Boylan-Croston 기준값을 그대로 적용합니다.">
      <div className="demand-profile-rules"><span><Badge status="SAFE" label="SMOOTH" /> ADI &lt; 1.32 · CV² &lt; 0.49</span><span><Badge status="WARNING" label="INTERMITTENT" /> ADI ≥ 1.32 · CV² &lt; 0.49</span><span><Badge status="CRITICAL" label="ERRATIC" /> ADI &lt; 1.32 · CV² ≥ 0.49</span><span><Badge status="WARNING" label="LUMPY" /> ADI ≥ 1.32 · CV² ≥ 0.49</span></div>
      <p className="form-help">Peak Month는 동일한 최대 수요가 있으면 가장 이른 월을 선택합니다. Seasonality는 학습 월이 24개월 미만이면 false가 아니라 — + INSUFFICIENT_PERIODS로 표시합니다.</p>
    </Panel>
    <Panel className="section" title="SKU별 수요 프로파일" description="필터는 저장된 analytics 결과에만 적용하며 통계는 SQL View에서 계산합니다.">
      <DemandProfileFilters rows={rows} />
    </Panel>
  </AnalysisFrame>;
}
