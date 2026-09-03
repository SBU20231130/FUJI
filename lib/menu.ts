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
      { id: 'inventory-projection', label: 'Inventory Projection', href: '/analysis/inventory-projection', icon: 'stockout' },
      { id: 'purchase-recommendation', label: '발주 추천', href: '/analysis/purchase-recommendation', icon: 'calculation' },
      { id: 'demand-profile', label: 'SKU 수요 프로파일', href: '/analysis/demand-profile', icon: 'demand' },
      { id: 'model-comparison', label: '모델 비교', href: '/analysis/model-comparison', icon: 'leadtime' },
    ],
  },
];

export const ADMIN_MENU: MenuGroup[] = [
  {
    id: 'scm-policies',
    label: 'SCM POLICIES',
    items: [
      { id: 'leadtime-policy', label: 'Lead Time 정책', href: '/admin/policies/leadtime', icon: 'leadtime' },
    ],
  },
  {
    id: 'admin',
    label: 'ADMIN',
    items: [
      { id: 'users', label: '사용자 관리', href: '/admin/users', icon: 'users' },
      { id: 'data-management', label: '데이터 적재', href: '/admin/data-management', icon: 'settings' },
      { id: 'forecast-settings', label: 'Forecast 설정', href: '/admin/forecast-settings', icon: 'settings' },
      { id: 'backtest', label: 'Backtest / Champion', href: '/admin/backtest', icon: 'calculation' },
      { id: 'settings', label: '시스템 설정', href: '/admin/settings', icon: 'settings' },
    ],
  },
];
