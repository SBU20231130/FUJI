import type { ReactNode } from 'react';
import Sidebar from '@/components/shell/sidebar';
import Topbar from '@/components/shell/topbar';
import { USER_MENU } from '@/lib/menu';

export default function UserLayout({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <Sidebar menu={USER_MENU} />
      <main className="main">
        <Topbar />
        <div className="content">{children}</div>
      </main>
    </div>
  );
}
