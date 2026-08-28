import 'server-only';

import type { User } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export type AppRole = 'ADMIN' | 'USER';

export type AppUser = {
  user_id: string;
  email: string;
  name: string;
  department: string | null;
  role: AppRole;
  active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AuthContext = {
  user: User;
  profile: AppUser;
  role: AppRole;
};

export class ForbiddenError extends Error {
  readonly code = 'FORBIDDEN';

  constructor(message = '관리자 권한이 필요합니다.') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

function safeNextPath(nextPath: string) {
  return nextPath.startsWith('/') && !nextPath.startsWith('//') ? nextPath : '/';
}

export function getLoginRedirect(nextPath: string, error?: string) {
  const params = new URLSearchParams({ next: safeNextPath(nextPath) });
  if (error) params.set('error', error);
  return `/login?${params.toString()}`;
}

async function loadAuthContext(): Promise<{ context: AuthContext | null; reason?: 'UNAUTHENTICATED' | 'INACTIVE' | 'PROFILE_MISSING' }> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { context: null, reason: 'UNAUTHENTICATED' };

  const { data: profile, error } = await supabase
    .schema('core')
    .from('app_user')
    .select('user_id,email,name,department,role,active,last_login_at,created_at,updated_at')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error || !profile) return { context: null, reason: 'PROFILE_MISSING' };
  if (!profile.active) return { context: null, reason: 'INACTIVE' };

  const typedProfile = profile as AppUser;
  return { context: { user, profile: typedProfile, role: typedProfile.role } };
}

export async function getRole(): Promise<AppRole | null> {
  const { context } = await loadAuthContext();
  return context?.role ?? null;
}

export async function requireUser(nextPath = '/') {
  const { context, reason } = await loadAuthContext();
  if (!context) {
    redirect(getLoginRedirect(nextPath, reason === 'INACTIVE' ? 'inactive' : undefined));
  }
  return context;
}

export async function requireAdmin(nextPath = '/admin') {
  const context = await requireUser(nextPath);
  if (context.role !== 'ADMIN') throw new ForbiddenError();
  return context;
}

export { safeNextPath };
