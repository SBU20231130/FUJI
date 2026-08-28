import PageHeader from '@/components/shell/page-header';
import Badge from '@/components/ui/badge';
import DataTable, { formatNumber, type Column } from '@/components/ui/data-table';
import EmptyValue from '@/components/ui/empty-value';
import KpiCard from '@/components/ui/kpi-card';
import Panel from '@/components/ui/panel';
import BacktestRunForm from '@/components/admin/backtest-run-form';
import ManualChampionForm from '@/components/admin/manual-champion-form';
import PythonForecastForm from '@/components/admin/python-forecast-form';
import { requireAdmin } from '@/lib/auth';
import { getBacktestRuns, getCurrentChampions, getForecastRuns, getForecastSettings, getModelPerformance } from '@/lib/scm';
import type { BacktestRun, ModelPerformance } from '@/lib/scm-model';

export const dynamic = 'force-dynamic';

function MetricValue({ value, reasonCode }: { value: number | null; reasonCode?: string | null }) {
  return value === null ? <EmptyValue reasonCode={reasonCode ?? 'CALCULATION_UNAVAILABLE'} /> : `${(value * 100).toFixed(1)}%`;
}

function BiasValue({ value }: { value: number | null }) {
  if (value === null) return <EmptyValue reasonCode="NO_COMPARABLE_PERIODS" />;
  return <span className={value > 0 ? 'text-danger' : value < 0 ? 'text-good' : ''}>{formatNumber(value)}</span>;
}

const performanceColumns: Column<ModelPerformance>[] = [
  { key: 'itemId', label: 'SKU' },
  { key: 'modelId', label: '모델', render: (row) => <>{row.modelName ?? row.modelId}<span className="table-subtext">v{row.modelVersion}</span></> },
  { key: 'metricValue', label: '선정 지표', align: 'right', render: (row) => <MetricValue value={row.metricValue} reasonCode={row.reasonCode} /> },
  { key: 'wape', label: 'WAPE', align: 'right', render: (row) => <MetricValue value={row.wape} reasonCode={row.reasonCode} /> },
  { key: 'mape', label: 'MAPE', align: 'right', render: (row) => <MetricValue value={row.mape} reasonCode={row.reasonCode} /> },
  { key: 'bias', label: 'Bias', align: 'right', render: (row) => <BiasValue value={row.bias} /> },
  { key: 'rmse', label: 'RMSE', align: 'right', render: (row) => row.rmse === null ? <EmptyValue reasonCode={row.reasonCode ?? 'CALCULATION_UNAVAILABLE'} /> : formatNumber(row.rmse) },
  { key: 'mae', label: 'MAE', align: 'right', render: (row) => row.mae === null ? <EmptyValue reasonCode={row.reasonCode ?? 'CALCULATION_UNAVAILABLE'} /> : formatNumber(row.mae) },
  { key: 'rank', label: 'Rank', align: 'right', render: (row) => row.rank === null ? <EmptyValue reasonCode={row.reasonCode ?? 'CALCULATION_UNAVAILABLE'} /> : row.rank },
  { key: 'status', label: '상태', render: (row) => row.status === 'VALID' ? <Badge status="SAFE" label="VALID" /> : <Badge status="CALCULATION_UNAVAILABLE" label={row.reasonCode ?? '계산 불가'} /> },
];

const runColumns: Column<BacktestRun>[] = [
  { key: 'backtestRunId', label: 'Backtest Run', render: (row) => <span className="data-value">{row.backtestRunId.slice(0, 8)}</span> },
  { key: 'forecastRunId', label: 'Forecast Run', render: (row) => <span className="data-value">{row.forecastRunId.slice(0, 8)}</span> },
  { key: 'pipeline', label: '파이프라인', render: (row) => <><Badge status={row.pipelineType === 'PYTHON' ? 'SAFE' : 'WARNING'} label={row.pipelineType} />{row.serviceName ? <span className="table-subtext">{row.serviceName}</span> : null}</> },
  { key: 'testStart', label: '검증 기간', render: (row) => `${row.testStart ?? '—'} ~ ${row.testEnd ?? '—'}` },
  { key: 'metric', label: '지표' },
  { key: 'status', label: '상태', render: (row) => row.status === 'COMPLETED' ? <Badge status="SAFE" label="COMPLETED" /> : row.status === 'FAILED' ? <Badge status="CRITICAL" label="FAILED" /> : <Badge status="WARNING" label="RUNNING" /> },
  { key: 'completedAt', label: '완료 시각', render: (row) => row.completedAt ? new Date(row.completedAt).toLocaleString('ko-KR') : <EmptyValue reasonCode="RUNNING" /> },
];

export default async function BacktestPage() {
  await requireAdmin('/admin/backtest');
  const [settingsResult, forecastRunsResult, backtestRunsResult, championsResult] = await Promise.all([
    getForecastSettings(),
    getForecastRuns(),
    getBacktestRuns(),
    getCurrentChampions(),
  ]);
  const settings = settingsResult.data;
  const latestCompleted = backtestRunsResult.rows.find((row) => row.status === 'COMPLETED');
  const performanceResult = latestCompleted ? await getModelPerformance(latestCompleted.backtestRunId) : { rows: [], error: null };
  const error = settingsResult.error ?? forecastRunsResult.error ?? backtestRunsResult.error ?? championsResult.error ?? performanceResult.error;
  const defaultMetric = settings?.championMetric ?? 'WAPE';

  return (
    <section className="analysis-page">
      <PageHeader eyebrow="ADMIN / MODEL GOVERNANCE" title="Backtest · Champion Model" description="STEP 6에서 저장한 Forecast Result를 검증 Actual과 비교하고, 모델별 성능과 Champion 선택 이력을 관리합니다." />
      {error ? <Panel><p className="text-danger">조회에 실패했습니다.</p><p className="muted">{error}</p></Panel> : null}
      <div className="grid grid-4">
        <KpiCard label="Forecast Run" value={forecastRunsResult.rows.length} foot="저장된 Forecast 스냅샷" status={forecastRunsResult.rows.length > 0 ? 'SAFE' : 'CALCULATION_UNAVAILABLE'} />
        <KpiCard label="Backtest 완료" value={backtestRunsResult.rows.filter((row) => row.status === 'COMPLETED').length} foot="검증 결과 저장 완료" status={backtestRunsResult.rows.length > 0 ? 'SAFE' : 'CALCULATION_UNAVAILABLE'} />
        <KpiCard label="현재 Champion" value={championsResult.rows.length} foot="품목별 최신 선택" status={championsResult.rows.length > 0 ? 'SAFE' : 'CALCULATION_UNAVAILABLE'} />
        <KpiCard label="선정 지표" value={defaultMetric} foot="core.forecast_setting" status="SAFE" />
      </div>
      <Panel className="section" title="Backtest 실행" description="Forecast를 재실행하지 않고 저장된 Forecast Result와 core.v_test_actual만 채점합니다.">
        <BacktestRunForm runs={forecastRunsResult.rows} defaultMetric={defaultMetric} />
      </Panel>
      <Panel className="section" title="Python Forecast 실행" description="별도 FastAPI 서비스에서 Train 데이터만 학습하고, 결과를 기존 Forecast Result 구조에 저장합니다.">
        <PythonForecastForm />
      </Panel>
      <Panel className="section" title="Backtest 이력" description="검증 기간·지표·실행 상태를 보존합니다.">
        <DataTable columns={runColumns} rows={backtestRunsResult.rows} rowKey={(row) => row.backtestRunId} empty="아직 Backtest 이력이 없습니다. STEP 6 Forecast Result 저장 후 실행하세요." />
      </Panel>
      <Panel className="section" title="모델 성능 및 후보" description={latestCompleted ? `${latestCompleted.backtestRunId.slice(0, 8)} · ${latestCompleted.metric ?? '—'} · Bias 양수는 over-forecast, 음수는 under-forecast입니다.` : '완료된 Backtest가 생기면 모든 후보 모델의 성능이 저장됩니다.'}>
        <DataTable columns={performanceColumns} rows={performanceResult.rows} rowKey={(row) => String(row.performanceId)} empty="표시할 성능 결과가 없습니다." />
      </Panel>
      {latestCompleted ? (
        <Panel className="section" title="수동 Champion 지정" description="ADMIN만 지정할 수 있으며 사유는 필수이고, 기존 선택 이력은 삭제하지 않습니다.">
          <ManualChampionForm performances={performanceResult.rows} backtestRunId={latestCompleted.backtestRunId} />
        </Panel>
      ) : null}
    </section>
  );
}
