'use client';

import ForecastOverlayChart from '@/components/chart/forecast-overlay-chart';
import Badge from '@/components/ui/badge';
import EmptyValue from '@/components/ui/empty-value';
import Panel from '@/components/ui/panel';
import type { ChampionModel, ComparisonPoint, ModelPerformance } from '@/lib/scm-model';

function Metric({ value, reason }: { value: number | null; reason?: string | null }) {
  return value === null ? <EmptyValue reasonCode={reason ?? 'CALCULATION_UNAVAILABLE'} /> : `${(value * 100).toFixed(1)}%`;
}

function NumberMetric({ value, reason }: { value: number | null; reason?: string | null }) {
  return value === null ? <EmptyValue reasonCode={reason ?? 'CALCULATION_UNAVAILABLE'} /> : value.toFixed(2);
}

export default function ModelComparisonView({ points, performance, champions }: { points: ComparisonPoint[]; performance: ModelPerformance[]; champions: ChampionModel[] }) {
  const itemId = points[0]?.itemId ?? performance[0]?.itemId;
  const currentChampion = champions.find((row) => row.itemId === itemId);
  const selectedPerformance = performance.filter((row) => row.itemId === itemId);
  return (
    <>
      <div className="grid grid-3 section">
        <article className="kpi-card"><div className="kpi-card__label">선택 SKU</div><div className="kpi-card__value data-value">{itemId ?? <EmptyValue reasonCode="SKU_NOT_SELECTED" />}</div><div className="kpi-card__foot">Actual과 모델 Forecast 비교</div></article>
        <article className="kpi-card"><div className="kpi-card__label">현재 Champion</div><div className="kpi-card__value data-value">{currentChampion?.modelName ?? <EmptyValue reasonCode="NO_CHAMPION" />}</div><div className="kpi-card__foot">{currentChampion ? `${currentChampion.selectionMethod} · ${currentChampion.metric ?? '—'}` : '선택 이력이 없습니다.'}</div></article>
        <article className="kpi-card"><div className="kpi-card__label">비교 모델 수</div><div className="kpi-card__value data-value">{Array.from(new Set(points.map((point) => point.modelId))).length}</div><div className="kpi-card__foot">토글은 화면 표시만 변경</div></article>
      </div>
      <Panel className="section" title="Actual · Forecast Overlay" description="검증 기간 음영 안에서 저장된 Actual, Forecast, P50/P80/P90과 prediction interval을 겹쳐 봅니다.">
        <ForecastOverlayChart points={points} />
      </Panel>
      <Panel className="section" title="모델 비교 지표" description="모든 후보를 저장하며 계산 불가 값은 숫자로 보정하지 않습니다.">
        {selectedPerformance.length === 0 ? <p className="empty-state">선택 SKU의 성능 결과가 없습니다. <span className="reason-code">+ PERFORMANCE_NOT_FOUND</span></p> : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead><tr><th>모델</th><th>상태</th><th>선정 지표</th><th>WAPE</th><th>MAPE</th><th>Bias</th><th>RMSE</th><th>MAE</th><th>Rank</th><th>Baseline 대비</th></tr></thead>
              <tbody>{selectedPerformance.map((row) => (
                <tr key={`${row.modelId}-${row.modelVersion}`}>
                  <td>{row.modelName ?? row.modelId}<span className="table-subtext">v{row.modelVersion}</span></td>
                  <td>{row.status === 'VALID' ? <Badge status="SAFE" label="VALID" /> : <Badge status="CALCULATION_UNAVAILABLE" label={row.reasonCode ?? '계산 불가'} />}</td>
                  <td><Metric value={row.metricValue} reason={row.reasonCode} /></td>
                  <td><Metric value={row.wape} reason={row.reasonCode} /></td>
                  <td><Metric value={row.mape} reason={row.reasonCode} /></td>
                  <td>{row.bias === null ? <EmptyValue reasonCode={row.reasonCode ?? 'CALCULATION_UNAVAILABLE'} /> : <span className={row.bias > 0 ? 'text-danger' : row.bias < 0 ? 'text-good' : ''}>{row.bias.toFixed(2)}</span>}</td>
                  <td><NumberMetric value={row.rmse} reason={row.reasonCode} /></td>
                  <td><NumberMetric value={row.mae} reason={row.reasonCode} /></td>
                  <td>{row.rank ?? <EmptyValue reasonCode={row.reasonCode ?? 'CALCULATION_UNAVAILABLE'} />}</td>
                  <td><Metric value={row.baselineImprovement} reason="BASELINE_UNAVAILABLE" /></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </Panel>
      {currentChampion ? <Panel className="section" title="Champion 선택 사유" description="최신 Champion만 표시하며 이전 AUTO/MANUAL 선택은 DB 이력으로 보존됩니다."><div className="insight-banner"><div><strong>{currentChampion.modelName ?? currentChampion.modelId} · {currentChampion.selectionMethod}</strong>{currentChampion.selectionReason}<br /><span className="muted">선택 시각: {currentChampion.selectedAt ? new Date(currentChampion.selectedAt).toLocaleString('ko-KR') : '—'}</span></div></div></Panel> : null}
    </>
  );
}
