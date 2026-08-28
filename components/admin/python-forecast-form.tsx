'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { startPythonForecastAction, type BacktestActionState } from '@/app/(admin)/admin/backtest/actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button className="ui-button ui-button--primary" type="submit" disabled={pending}>{pending ? 'Python 계산 중...' : 'Python Forecast 실행'}</button>;
}

export default function PythonForecastForm() {
  const [state, formAction] = useActionState<BacktestActionState, FormData>(startPythonForecastAction, {});
  return (
    <form action={formAction} className="backtest-form python-forecast-form">
      <label>예측 기간(일)
        <input type="number" name="horizon" min="1" max="366" defaultValue="28" required />
      </label>
      <label>실행 모델(선택)
        <input name="model_ids" placeholder="비워두면 수요 유형별 전체 모델" />
      </label>
      <label>공통 파라미터 JSON(선택)
        <input name="params_json" placeholder='예: {"alpha":0.1}' />
      </label>
      <SubmitButton />
      <p className="form-help">학습 데이터는 DB의 Train 구간만 사용합니다. INTERMITTENT/LUMPY 품목에는 Croston·SBA·TSB 후보가 포함됩니다.</p>
      {state.error ? <p className="form-error" role="alert">{state.error}</p> : null}
      {state.success ? <p className="form-success" role="status">{state.success}</p> : null}
    </form>
  );
}
