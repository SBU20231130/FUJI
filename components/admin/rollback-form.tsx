'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import Button from '@/components/ui/button';
import { rollbackBatchAction, type ImportActionState } from '@/app/(admin)/admin/data-management/actions';

function RollbackButton() {
  const { pending } = useFormStatus();
  return <Button type="submit" variant="ghost" disabled={pending}>{pending ? '롤백 중...' : '롤백'}</Button>;
}

export default function RollbackForm({ batchId }: { batchId: string }) {
  const [confirmed, setConfirmed] = useState(false);
  const [state, action] = useActionState<ImportActionState, FormData>(rollbackBatchAction, {});
  return <form action={action} className="rollback-form">
    <input type="hidden" name="batch_id" value={batchId} />
    <label title="현재 배치의 RAW 행과 upsert/replace 백업을 되돌립니다."><input type="checkbox" name="confirm_rollback" value="true" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} /> 확인</label>
    <RollbackButton />
    {state.error ? <span className="user-access-form__error">{state.error}</span> : null}
    {state.message ? <span className="user-access-form__success">{state.message}</span> : null}
  </form>;
}
