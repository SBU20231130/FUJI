'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { updateLeadtimePolicyAction, type LeadtimePolicyState } from '@/app/(admin)/admin/policies/leadtime/actions';

function SaveButton() {
  const { pending } = useFormStatus();
  return <button className="ui-button ui-button--primary" type="submit" disabled={pending}>{pending ? '저장 중...' : '정책 저장'}</button>;
}

export default function LeadtimePolicyForm({ supplierId, plannedLeadTime, basis, confirmedReason }: { supplierId: string; plannedLeadTime: number | null; basis: string | null; confirmedReason: string | null }) {
  const [state, formAction] = useActionState<LeadtimePolicyState, FormData>(updateLeadtimePolicyAction, {});

  return (
    <form action={formAction} className="policy-form">
      <input type="hidden" name="supplier_id" value={supplierId} />
      <label>
        <span>관리자 LT (일)</span>
        <input name="planned_lead_time" type="number" min="1" step="1" defaultValue={plannedLeadTime ?? ''} placeholder="비워두면 P80" />
      </label>
      <label>
        <span>근거</span>
        <input name="basis" defaultValue={basis ?? ''} placeholder="ADMIN_CONFIRMED" />
      </label>
      <label className="policy-form__reason">
        <span>변경 사유</span>
        <input name="confirmed_reason" defaultValue={confirmedReason ?? ''} placeholder="예: 2026년 계약 납기 확인" />
      </label>
      <SaveButton />
      {state.error ? <span className="policy-form__error" role="alert">{state.error}</span> : null}
      {state.success ? <span className="policy-form__success" role="status">{state.success}</span> : null}
    </form>
  );
}
