import { Search } from 'lucide-react';
import { signOutAction } from '@/app/(auth)/login/actions';

export default function Topbar({ title = '월간 발주계획', period = '2026.09' }: { title?: string; period?: string }) {
  return (
    <header className="topbar">
      <div><div className="eyebrow">MONTHLY PROCUREMENT CONTROL</div><h1>{title}</h1></div>
      <div className="global-search" aria-hidden="true"><Search size={17} strokeWidth={2} /><span>공급망 노드, 예측, 알림 검색...</span></div>
      <div className="top-meta"><span className="local-badge">SUPABASE LIVE</span><span>기준월 <b>{period}</b></span><form action={signOutAction}><button type="submit" className="logout-button">로그아웃</button></form></div>
    </header>
  );
}
