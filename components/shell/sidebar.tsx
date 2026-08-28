'use client';

import Link from 'next/link';
import { BarChart3, Boxes, FileText, Gauge, LineChart, Settings2, ShoppingCart, SlidersHorizontal, Users, Workflow } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { USER_MENU, type MenuGroup, type MenuIcon } from '@/lib/menu';

const icons: Record<MenuIcon, typeof Gauge> = {
  dashboard: Gauge,
  demand: BarChart3,
  supply: Boxes,
  master: Settings2,
  calculation: ShoppingCart,
  report: FileText,
  leadtime: LineChart,
  stockout: Workflow,
  users: Users,
  settings: SlidersHorizontal,
};

function isActive(pathname: string, href: string) {
  const route = href.split('#')[0];
  return route === '/' ? pathname === '/' : pathname === route || pathname.startsWith(`${route}/`);
}

export default function Sidebar({ menu = USER_MENU }: { menu?: MenuGroup[] }) {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">OP</div>
        <div className="brand-copy"><strong>월간 발주계획</strong><span>Procurement Planning</span></div>
      </div>
      {menu.map((group) => (
        <div key={group.id} className={group.id === 'analysis' ? 'nav-group nav-group--analysis' : 'nav-group'}>
          <div className="nav-label">{group.label}</div>
          <nav className="nav-list" aria-label={group.label}>
            {group.items.map((item) => {
              const Icon = icons[item.icon];
              return (
                <Link key={item.id} href={item.href} className={`nav-button ${isActive(pathname, item.href) ? 'active' : ''}`}>
                  <span className="nav-number"><Icon size={14} /></span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      ))}
      <div className="sidebar-foot"><b>2026년 09월 발주계획</b><br />SCM CONTROL TOWER<br />분석 기준과 상태를 한 화면에서 관리합니다.</div>
    </aside>
  );
}
