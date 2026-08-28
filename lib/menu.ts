export type MenuIcon = 'dashboard' | 'demand' | 'supply' | 'master' | 'calculation' | 'report' | 'leadtime' | 'stockout' | 'users' | 'settings';

export type MenuItem = {
  id: string;
  label: string;
  href: string;
  icon: MenuIcon;
};

export type MenuGroup = {
  id: string;
  label: string;
  items: MenuItem[];
};

export const USER_MENU: MenuGroup[] = [
  {
    id: 'workflow',
    label: 'WORKFLOW',
    items: [
      { id: 'dashboard', label: '전체 현황', href: '/', icon: 'dashboard' },
      { id: 'demand', label: '수요 확정', href: '/workflow#demand', icon: 'demand' },
      { id: 'supply', label: '재고·공급', href: '/workflow#supply', icon: 'supply' },
      { id: 'master', label: '마스터 검증', href: '/workflow#master', icon: 'master' },
      { id: 'calculation', label: '발주량 계산', href: '/workflow#calculation', icon: 'calculation' },
      { id: 'report', label: '보고자료', href: '/workflow#report', icon: 'report' },
    ],
  },
  {
    id: 'analysis',
    label: 'ANALYSIS',
    items: [
      { id: 'leadtime', label: '리드타임 격차', href: '/analysis/leadtime', icon: 'leadtime' },
      { id: 'stockout', label: '재고 소진 위험', href: '/analysis/stockout', icon: 'stockout' },
    ],
  },
];

export const ADMIN_MENU: MenuGroup[] = [
  {
    id: 'admin',
    label: 'ADMIN',
    items: [
      { id: 'users', label: '사용자 관리', href: '/admin/users', icon: 'users' },
      { id: 'forecast-settings', label: 'Forecast 설정', href: '/admin/forecast-settings', icon: 'settings' },
      { id: 'settings', label: '시스템 설정', href: '/admin/settings', icon: 'settings' },
    ],
  },
];
