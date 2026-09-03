'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export type LeadtimePolicyState = { error?: string; success?: string };

export async function updateLeadtimePolicyAction(
  _previousState: LeadtimePolicyState,
  formData: FormData,
): Promise<LeadtimePolicyState> {
  await requireAdmin('/admin/policies/leadtime');

  const supplierId = String(formData.get('supplier_id') ?? '').trim();
  const rawLeadTime = String(formData.get('planned_lead_time') ?? '').trim();
  const basis = String(formData.get('basis') ?? '').trim();
  const confirmedReason = String(formData.get('confirmed_reason') ?? '').trim();

  if (!supplierId) return { error: '공급처가 필요합니다.' };
  if (!rawLeadTime) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.schema('core').from('leadtime_plan').delete().eq('supplier_id', supplierId);
    if (error) return { error: error.message };
    revalidatePath('/admin/policies/leadtime');
    revalidatePath('/analysis/leadtime');
    revalidatePath('/analysis/stockout');
    return { success: '관리자 확정 리드타임을 해제했습니다. 실적 P80 적용으로 돌아갑니다.' };
  }

  const plannedLeadTime = Number(rawLeadTime);
  if (!Number.isInteger(plannedLeadTime) || plannedLeadTime <= 0) return { error: '리드타임은 1 이상의 정수 일수여야 합니다.' };
  if (!confirmedReason) return { error: '정책 변경 사유를 입력하세요.' };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.schema('core').from('leadtime_plan').upsert({
    supplier_id: supplierId,
    planned_lead_time: plannedLeadTime,
    basis: basis || 'ADMIN_CONFIRMED',
    confirmed_reason: confirmedReason,
    confirmed_at: new Date().toISOString(),
  });

  if (error) return { error: error.message };
  revalidatePath('/admin/policies/leadtime');
  revalidatePath('/analysis/leadtime');
  revalidatePath('/analysis/stockout');
  return { success: '관리자 확정 리드타임을 저장했습니다. 변경 이력도 기록되었습니다.' };
}
