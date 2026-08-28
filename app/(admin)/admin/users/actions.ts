'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin, type AppRole } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export type UserAccessState = {
  error?: string;
  success?: string;
};

export async function updateUserAccessAction(_previousState: UserAccessState, formData: FormData): Promise<UserAccessState> {
  const admin = await requireAdmin('/admin/users');
  const targetUserId = String(formData.get('user_id') ?? '');
  const role = String(formData.get('role') ?? '') as AppRole;
  const active = formData.get('active') === 'true';

  if (!targetUserId || !['ADMIN', 'USER'].includes(role)) return { error: '잘못된 사용자 변경 요청입니다.' };
  if (targetUserId === admin.user.id && (role !== 'ADMIN' || !active)) {
    return { error: '자신의 ADMIN 권한과 활성 상태는 스스로 변경할 수 없습니다.' };
  }

  const supabase = await createSupabaseServerClient();
  const { data: before, error: readError } = await supabase
    .schema('core')
    .from('app_user')
    .select('user_id,role,active')
    .eq('user_id', targetUserId)
    .maybeSingle();

  if (readError) return { error: readError.message };
  if (!before) return { error: '대상 사용자를 찾을 수 없습니다.' };
  if (before.role === role && before.active === active) return { success: '변경된 내용이 없습니다.' };

  const { error: updateError } = await supabase
    .schema('core')
    .from('app_user')
    .update({ role, active })
    .eq('user_id', targetUserId);

  if (updateError) {
    if (updateError.message.includes('SELF_LOCKOUT_FORBIDDEN')) {
      return { error: '자신의 ADMIN 권한과 활성 상태는 스스로 변경할 수 없습니다.' };
    }
    return { error: updateError.message };
  }

  revalidatePath('/admin/users');
  return { success: '사용자 권한을 저장했습니다. 변경 이력도 기록되었습니다.' };
}
