import AnalysisFrame from '@/components/analysis/analysis-frame';
import ModelComparisonView from '@/components/analysis/model-comparison-view';
import EmptyValue from '@/components/ui/empty-value';
import Panel from '@/components/ui/panel';
import { requireUser } from '@/lib/auth';
import { getBacktestRuns, getCurrentChampions, getForecastRuns, getModelComparison, getModelPerformance } from '@/lib/scm';

export const dynamic = 'force-dynamic';

type SearchParams = {
  forecastRunId?: string;
  itemId?: string;
  from?: string;
  to?: string;
};

export default async function ModelComparisonPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  await requireUser('/analysis/model-comparison');
  const params = searchParams ? await searchParams : {};
  const [forecastRunsResult, backtestRunsResult, championsResult] = await Promise.all([
    getForecastRuns(),
    getBacktestRuns(),
    getCurrentChampions(),
  ]);
  const forecastRunId = params.forecastRunId || forecastRunsResult.rows[0]?.forecastRunId || '';
  const comparisonResult = await getModelComparison({ forecastRunId, from: params.from, to: params.to });
  const itemIds = Array.from(new Set(comparisonResult.rows.map((row) => row.itemId)));
  const itemId = params.itemId && itemIds.includes(params.itemId) ? params.itemId : itemIds[0] || '';
  const points = comparisonResult.rows.filter((row) => row.itemId === itemId);
  const selectedBacktest = backtestRunsResult.rows.find((row) => row.forecastRunId === forecastRunId && row.status === 'COMPLETED');
  const performanceResult = selectedBacktest ? await getModelPerformance(selectedBacktest.backtestRunId) : { rows: [], error: null };
  const error = forecastRunsResult.error ?? backtestRunsResult.error ?? championsResult.error ?? comparisonResult.error ?? performanceResult.error;
  const exportQuery = new URLSearchParams();
  if (forecastRunId) exportQuery.set('forecastRunId', forecastRunId);
  if (itemId) exportQuery.set('itemId', itemId);
  if (params.from) exportQuery.set('from', params.from);
  if (params.to) exportQuery.set('to', params.to);

  return (
    <AnalysisFrame title="모델 비교" description="STEP 6에 저장된 Forecast Result와 검증 Actual을 SKU·기간·Forecast Run별로 비교합니다.">
      {error ? <Panel><p className="text-danger">조회에 실패했습니다.</p><p className="muted">{error}</p></Panel> : null}
      <form className="model-comparison-filters" method="get">
        <label>Forecast Run
          <select name="forecastRunId" defaultValue={forecastRunId}>
            <option value="">선택하세요</option>
            {forecastRunsResult.rows.map((run) => <option key={run.forecastRunId} value={run.forecastRunId}>{run.forecastRunId.slice(0, 8)} · {run.status ?? '상태 미상'}{run.stale ? ' · STALE' : ''}</option>)}
          </select>
        </label>
        <label>SKU
          <select name="itemId" defaultValue={itemId} disabled={itemIds.length === 0}>
            <option value="">선택하세요</option>
            {itemIds.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <label>검증 시작
          <input type="date" name="from" defaultValue={params.from ?? ''} />
        </label>
        <label>검증 종료
          <input type="date" name="to" defaultValue={params.to ?? ''} />
        </label>
        <button className="ui-button ui-button--secondary" type="submit">조회</button>
        {forecastRunId ? <a className="ui-button ui-button--ghost" href={`/api/model-comparison/export?${exportQuery.toString()}`}>CSV 내보내기</a> : null}
      </form>
      {!forecastRunId ? (
        <Panel className="section" title="Forecast Result 대기" description="비교할 저장 결과가 아직 없습니다."><p className="empty-state">STEP 6에서 Forecast Run과 모델별 Forecast Result를 저장하면 이 화면에서 비교할 수 있습니다. <EmptyValue reasonCode="FORECAST_RESULT_NOT_FOUND" /></p></Panel>
      ) : (
        <ModelComparisonView points={points} performance={performanceResult.rows} champions={championsResult.rows} />
      )}
    </AnalysisFrame>
  );
}
