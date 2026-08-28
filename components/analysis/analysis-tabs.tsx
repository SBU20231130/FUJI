'use client';

// 분석 화면 사이의 이동 탭입니다.
//
// 새 분석 화면을 만들면 아래 목록에 한 줄 추가합니다.
// 아직 안 만든 화면은 ready: false 로 두면 링크 대신 회색으로만 보입니다.
// (링크로 두면 404 가 떠서, 만들기 전인지 고장 난 건지 구분이 안 됩니다.)

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { USER_MENU } from '@/lib/menu';

const tabs = USER_MENU.find((group) => group.id === 'analysis')?.items ?? [];

export default function AnalysisTabs() {
  const pathname = usePathname();

  return (
    <nav className="analysis-tabs" aria-label="분석 화면">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.id}
            href={tab.href}
            className={`analysis-tab ${active ? 'active' : ''}`}
            aria-current={active ? 'page' : undefined}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
