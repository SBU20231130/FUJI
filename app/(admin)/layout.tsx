import type { ReactNode } from 'react';
import Sidebar from '@/components/shell/sidebar';
import Topbar from '@/components/shell/topbar';
import { ADMIN_MENU } from '@/lib/menu';
import Panel from '@/components/ui/panel';
import { ForbiddenError, requireAdmin } from '@/lib/auth';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  try {
    await requireAdmin('/admin');
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return <main className="auth-page"><Panel title="접근 권한이 없습니다."><p className="muted">관리자 계정만 이 영역에 접근할 수 있습니다. 현재 계정의 권한을 확인하세요.</p></Panel></main>;
    }
    throw error;
  }

  return (
    <div className="app-shell">
      <Sidebar menu={ADMIN_MENU} />
      <main className="main">
        <Topbar title="관리자" />
        <div className="content">{children}</div>
      </main>
    </div>
  );
}
