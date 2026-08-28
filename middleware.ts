import { NextResponse, type NextRequest } from 'next/server';
import { updateSupabaseSession } from '@/lib/supabase/middleware';

const PUBLIC_PATHS = ['/login', '/api/health/supabase'];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function isProtectedPath(pathname: string) {
  return pathname === '/' || pathname.startsWith('/analysis') || pathname.startsWith('/workflow') || pathname.startsWith('/admin');
}

export async function middleware(request: NextRequest) {
  const { response, user, supabase } = await updateSupabaseSession(request);
  const { pathname, search } = request.nextUrl;

  if (!isPublicPath(pathname) && isProtectedPath(pathname) && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.search = '';
    loginUrl.searchParams.set('next', `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith('/admin') && user && supabase) {
    const { data: profile, error } = await supabase
      .schema('core')
      .from('app_user')
      .select('role,active')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error || !profile || profile.role !== 'ADMIN' || profile.active !== true) {
      const forbidden = new NextResponse('Forbidden', {
        status: 403,
        headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' },
      });
      response.cookies.getAll().forEach(({ name, value }) => forbidden.cookies.set(name, value));
      return forbidden;
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
