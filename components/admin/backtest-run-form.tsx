'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { runBacktestAction, type BacktestActionState } from '@/app/(admin)/admin/backtest/actions';
import type { ForecastRun, MetricCode } from '@/lib/scm-model';

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button className="ui-button ui-button--primary" type="submit" disabled={pending}>{pending ? '계산 중...' : 'Backtest 실행'}</button>;
}

export default function BacktestRunForm({ runs, defaultMetric }: { runs: ForecastRun[]; defaultMetric: MetricCode }) {
  const [state, formAction] = useActionState<BacktestActionState, FormData>(runBacktestAction, {});
  const readyRuns = runs.filter((run) => run.status === 'READY' && run.stale !== true);
  return (
    <form action={formAction} className="backtest-form">
      <label>Forecast Run
        <select name="forecast_run_id" defaultValue={readyRuns[0]?.forecastRunId ?? ''} disabled={readyRuns.length === 0}>
          <option value="">선택하세요</option>
          {readyRuns.map((run) => <option key={run.forecastRunId} value={run.forecastRunId}>{run.forecastRunId.slice(0, 8)} · {run.dataSnapshotAt ? new Date(run.dataSnapshotAt).toLocaleString('ko-KR') : '스냅샷 미상'}</option>)}
        </select>
      </label>
      <label>Champion 기준 지표
        <select name="metric" defaultValue={defaultMetric}>
          <option value="WAPE">WAPE</option>
          <option value="MAPE">MAPE</option>
          <option value="RMSE">RMSE</option>
          <option value="MAE">MAE</option>
        </select>
      </label>
      <SubmitButton />
      {readyRuns.length === 0 ? <p className="form-help">실행 가능한 READY Forecast Run이 없습니다. STEP 6에서 Forecast Result를 저장하세요.</p> : null}
      {state.error ? <p className="form-error" role="alert">{state.error}</p> : null}
      {state.success ? <p className="form-success" role="status">{state.success}</p> : null}
    </form>
  );
}
