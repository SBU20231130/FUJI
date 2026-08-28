import type { ReactNode } from 'react';
import Sidebar from '@/components/shell/sidebar';
import Topbar from '@/components/shell/topbar';
import { ADMIN_MENU } from '@/lib/menu';

export default function AdminLayout({ children }: { children: ReactNode }) {
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
