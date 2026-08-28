'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { safeNextPath } from '@/lib/auth';

export type LoginState = {
  error?: string;
};

export async function signInAction(_previousState: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const nextPath = safeNextPath(String(formData.get('next') ?? '/'));

  if (!email || !password) return { error: '이메일과 비밀번호를 입력하세요.' };

  const supabase = await createSupabaseServerClient();
  const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: '로그인에 실패했습니다. 이메일과 비밀번호를 확인하세요.' };
  if (!authData.user) return { error: '로그인 정보를 확인할 수 없습니다.' };

  const { data: profile, error: profileError } = await supabase
    .schema('core')
    .from('app_user')
    .select('active')
    .eq('user_id', authData.user.id)
    .maybeSingle();
  if (profileError || !profile) {
    await supabase.auth.signOut();
    return { error: '사용자 프로필이 준비되지 않았습니다. 관리자에게 문의하세요.' };
  }
  if (!profile.active) {
    await supabase.auth.signOut();
    return { error: '비활성화된 계정입니다. 관리자에게 계정 상태를 문의하세요.' };
  }

  await supabase.schema('core').rpc('touch_last_login');
  redirect(nextPath);
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect('/login');
}
