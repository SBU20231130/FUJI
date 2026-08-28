'use client';

import { useActionState, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { setManualChampionAction, type BacktestActionState } from '@/app/(admin)/admin/backtest/actions';
import type { ModelPerformance } from '@/lib/scm-model';

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button className="ui-button ui-button--secondary" type="submit" disabled={pending}>{pending ? '저장 중...' : '수동 Champion 저장'}</button>;
}

export default function ManualChampionForm({ performances, backtestRunId }: { performances: ModelPerformance[]; backtestRunId: string }) {
  const [state, formAction] = useActionState<BacktestActionState, FormData>(setManualChampionAction, {});
  const candidates = performances.filter((row) => row.status === 'VALID');
  const itemOptions = Array.from(new Set(candidates.map((row) => row.itemId)));
  const first = candidates[0];
  const [itemId, setItemId] = useState(first?.itemId ?? '');
  const itemCandidates = candidates.filter((row) => row.itemId === itemId);
  const [candidateKey, setCandidateKey] = useState(first ? `${first.modelId}::${first.modelVersion}` : '');
  useEffect(() => {
    const next = itemCandidates[0];
    setCandidateKey(next ? `${next.modelId}::${next.modelVersion}` : '');
  }, [itemId]);
  const selected = itemCandidates.find((row) => `${row.modelId}::${row.modelVersion}` === candidateKey) ?? itemCandidates[0];
  return (
    <form action={formAction} className="manual-champion-form">
      <input type="hidden" name="backtest_run_id" value={backtestRunId} />
      <label>품목
        <select name="item_id" value={itemId} onChange={(event) => setItemId(event.target.value)} disabled={candidates.length === 0}>
          <option value="">선택하세요</option>
          {itemOptions.map((itemId) => <option key={itemId} value={itemId}>{itemId}</option>)}
        </select>
      </label>
      <label>모델
        <select name="model_key" value={candidateKey} onChange={(event) => setCandidateKey(event.target.value)} disabled={candidates.length === 0}>
          <option value="">선택하세요</option>
          {itemCandidates.map((row) => <option key={`${row.modelId}-${row.modelVersion}`} value={`${row.modelId}::${row.modelVersion}`}>{row.modelName ?? row.modelId} · {row.modelVersion}</option>)}
        </select>
      </label>
      <input type="hidden" name="model_id" value={selected?.modelId ?? ''} />
      <input type="hidden" name="model_version" value={selected?.modelVersion ?? ''} />
      <label className="manual-champion-form__reason">변경 사유
        <input name="reason" placeholder="예: 프로모션 기간 보수적 예측 채택" required disabled={candidates.length === 0} />
      </label>
      <SubmitButton />
      {candidates.length === 0 ? <p className="form-help">유효한 후보가 없습니다. 먼저 Backtest를 실행하세요.</p> : null}
      {state.error ? <p className="form-error" role="alert">{state.error}</p> : null}
      {state.success ? <p className="form-success" role="status">{state.success}</p> : null}
    </form>
  );
}
